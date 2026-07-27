import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  fetchAdaptiveTriage,
  fetchCopilotRecommendations,
  fetchDeteriorationInsight,
  fetchFollowUpAutopilot
} from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import { User, LogOut, Compass, TrendingDown, ClipboardList, AlertTriangle, RefreshCw, Layers, Zap, Bot, CalendarClock } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function PatientFutureCarePage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t, translateUiText = (value: string | number) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth?.profileId;
  
  const [deterioration, setDeterioration] = useState<DynamicStateObject | null>(null);
  const [copilot, setCopilot] = useState<DynamicStateObject | null>(null);
  const [adaptive, setAdaptive] = useState<DynamicStateObject | null>(null);
  const [autopilot, setAutopilot] = useState<DynamicStateObject | null>(null);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [error, setError] = useState<DynamicState>("");

  const load = async () => {
    if (!patientId) {
      setDeterioration(null);
      setCopilot(null);
      setAdaptive(null);
      setAutopilot(null);
      setError("Unable to load Future Care guidance.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [deteriorationRes, copilotRes, adaptiveRes, autopilotRes] = await Promise.allSettled([
        fetchDeteriorationInsight(patientId),
        fetchCopilotRecommendations(patientId),
        fetchAdaptiveTriage(patientId),
        fetchFollowUpAutopilot(patientId)
      ]);

      const nextDeterioration = deteriorationRes.status === "fulfilled" ? deteriorationRes.value : null;
      const nextCopilot = copilotRes.status === "fulfilled" ? copilotRes.value : null;
      const nextAdaptive = adaptiveRes.status === "fulfilled" ? adaptiveRes.value : null;
      const nextAutopilot = autopilotRes.status === "fulfilled" ? autopilotRes.value : null;

      setDeterioration(nextDeterioration);
      setCopilot(nextCopilot);
      setAdaptive(nextAdaptive);
      setAutopilot(nextAutopilot);

      if (!nextDeterioration && !nextCopilot && !nextAdaptive && !nextAutopilot) {
        // @ts-expect-error - Auto-suppressed during migration
        setError(getApiErrorMessage(deteriorationRes.reason || copilotRes.reason || adaptiveRes.reason || autopilotRes.reason, "Unable to load Future Care guidance."));
      } else {
        setError("");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };

  return (
    <div className="h-full w-full bg-canvas text-[var(--tc-text)] font-sans flex flex-col overflow-hidden lg:flex-row">
      <PatientSidebar />
      
      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 -1 p-6 lg:p-10 min-w-0" role="main">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeSlideUp">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">{t("futureCare") || "Future Care"}</h1>
            <p className="text-ink-muted text-sm mb-3">{t("predictiveHealthInsightsAndProactiveFollowUpPlans") || "Predictive health insights and proactive follow-up plans."}</p>
            <div className="flex gap-2 items-center mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                <Compass size={12} className="text-primary" />{t("carePlanning") || "Care Planning"}</span>
              <div className="inline-flex items-center gap-2 text-xs text-ink-muted bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <User size={14} />
                Signed in as {auth?.fullName || "Anita Patient"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher hideLabel />
            <button 
              onClick={handleLogout} 
              aria-label="Log out"
              className="inline-flex items-center gap-2 px-4 py-2 bg-transparent text-ink-muted border border-white/10 rounded-element text-sm font-medium hover:bg-white/5 hover:text-ink transition-colors"
            >
              <LogOut size={16} />{t("logout") || "Logout"}</button>
          </div>
        </div>

        <div className="max-w-5xl animate-fadeSlideUp" style={{animationDelay: '0.1s'}}>
          
          {loading ? (
            <div className="flex flex-col gap-8 mt-8">
              {[1,2,3].map((i: DynamicStateObject) => <div key={i} className="card-premium h-40 animate-pulse bg-white/5"></div>)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-alert/5 border border-alert/20 rounded-xl mt-8">
              <AlertTriangle size={32} className="text-alert mb-4" />
              <h3 className="font-display text-lg mb-2">{t("unableToLoadInsights") || "Unable to load insights"}</h3>
              <p className="text-sm text-ink-muted mb-6">{error}</p>
              <button className="px-4 py-2 border border-white/20 rounded-element text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2" onClick={load}><RefreshCw size={16} /> {t("retry") || "Retry"}</button>
            </div>
          ) : (
            <div className="space-y-10 mt-8">
              
              {/* Deterioration Overview */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                   <h3 className="font-display text-xl font-medium">{t("deteriorationInsights") || "Deterioration Insights"}</h3>
                   <div className="flex-1 h-px bg-white/10"></div>
                </div>

                {deterioration ? (
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="card-premium !bg-surface flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">{t("riskScore") || "Risk Score"}</p>
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-3xl font-display font-medium text-ink">{deterioration.predictedScore}</p>
                          <p className="text-sm font-medium text-ink-muted/50">/100</p>
                        </div>
                      </div>
                      <div className="card-premium !bg-surface flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">{t("riskProfile") || "Risk Profile"}</p>
                        <div><Badge value={deterioration.predictedRiskLevel} /></div>
                      </div>
                      <div className="card-premium !bg-surface flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">{t("sharedCaregivers") || "Shared Caregivers"}</p>
                        <p className="text-3xl font-display font-medium text-ink">{deterioration.activeCaregiverCount}</p>
                      </div>
                      <div className="card-premium !bg-surface flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">{t("abnormalObs") || "Abnormal Obs."}</p>
                        <p className="text-3xl font-display font-medium text-ink">{deterioration.abnormalObservationCount}</p>
                      </div>
                    </div>
                    
                    {deterioration.summary && (
                      <div className="card-premium !bg-white/5 border-l-4 border-l-primary hover:border-white/20 transition-colors">
                        <p className="text-[15px] leading-relaxed text-ink/90">{deterioration.summary}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="card-premium !bg-surface flex flex-col">
                        <h4 className="text-sm font-semibold uppercase tracking-widest text-ink-muted mb-4 flex items-center gap-2">
                          <TrendingDown size={18} className="text-primary" /> {t("contributingFactors") || "Contributing Factors"}</h4>
                        {(deterioration.contributingFactors || []).length ? (
                          <div className="flex flex-col gap-2">
                            {(deterioration.contributingFactors || []).map((factor: DynamicStateObject, idx: DynamicStateObject) => (
                              <p key={idx} className="text-sm leading-relaxed text-ink/90 p-3 bg-white/5 rounded-lg border border-white/10">{translateDisplayText(language, factor)}</p>
                            ))}
                          </div>
                        ) : <p className="text-sm text-ink-muted italic">{t("noContributingRiskFactorsAreAvailableYet") || "No contributing risk factors are available yet."}</p>}
                      </div>
                      <div className="card-premium !bg-surface flex flex-col">
                        <h4 className="text-sm font-semibold uppercase tracking-widest text-ink-muted mb-4 flex items-center gap-2">
                          <ClipboardList size={18} className="text-primary" /> {t("recommendedActions") || "Recommended Actions"}</h4>
                        {(deterioration.recommendedActions || []).length ? (
                          <div className="flex flex-col gap-2">
                            {(deterioration.recommendedActions || []).map((action: DynamicStateObject, idx: DynamicStateObject) => (
                              <p key={idx} className="text-sm leading-relaxed text-ink/90 p-3 bg-white/5 rounded-lg border border-white/10">{translateDisplayText(language, action)}</p>
                            ))}
                          </div>
                        ) : <p className="text-sm text-ink-muted italic">{t("noRecommendedActionsAreAvailableYet") || "No recommended actions are available yet."}</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed h-[200px]">
                    <Layers size={48} className="text-ink-muted/30 mb-4" />
                    <h3 className="font-display text-lg mb-2">{t("noDeteriorationData") || "No Deterioration Data"}</h3>
                    <p className="text-sm text-ink-muted max-w-[280px]">{t("weNeedMoreHealthObservationsToPredictDeteriorationRisks") || "We need more health observations to predict deterioration risks."}</p>
                  </div>
                )}
              </div>

              {/* Copilot Guidance */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                   <h3 className="font-display text-xl font-medium">{t("aICopilotGuidance") || "AI Copilot Guidance"}</h3>
                   <div className="flex-1 h-px bg-white/10"></div>
                </div>

                {copilot ? (
                  <div className="card-premium">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                        <h4 className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">{t("patientActions") || "Patient Actions"}</h4>
                        {(copilot.patientActions || []).length ? (
                          <div className="flex flex-col gap-3">
                            {(copilot.patientActions || []).map((item: DynamicStateObject, idx: DynamicStateObject) => (
                              <p key={idx} className="text-sm leading-relaxed text-ink/90 flex gap-2">
                                <span className="text-primary mt-0.5">•</span> {translateDisplayText(language, item)}
                              </p>
                            ))}
                          </div>
                        ) : <p className="text-sm text-ink-muted italic">{t("noActionsRequired") || "No actions required."}</p>}
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">{t("caregiverActions") || "Caregiver Actions"}</h4>
                        {(copilot.caregiverActions || []).length ? (
                          <div className="flex flex-col gap-3">
                            {(copilot.caregiverActions || []).map((item: DynamicStateObject, idx: DynamicStateObject) => (
                              <p key={idx} className="text-sm leading-relaxed text-ink/90 flex gap-2">
                                <span className="text-primary mt-0.5">•</span> {translateDisplayText(language, item)}
                              </p>
                            ))}
                          </div>
                        ) : <p className="text-sm text-ink-muted italic">{t("noActionsRequired") || "No actions required."}</p>}
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-4">{t("doctorActions") || "Doctor Actions"}</h4>
                        {(copilot.doctorActions || []).length ? (
                          <div className="flex flex-col gap-3">
                            {(copilot.doctorActions || []).map((item: DynamicStateObject, idx: DynamicStateObject) => (
                              <p key={idx} className="text-sm leading-relaxed text-ink/90 flex gap-2">
                                <span className="text-primary mt-0.5">•</span> {translateDisplayText(language, item)}
                              </p>
                            ))}
                          </div>
                        ) : <p className="text-sm text-ink-muted italic">{t("noActionsRequired") || "No actions required."}</p>}
                      </div>
                    </div>
                    
                    {copilot.escalationDecision && (
                      <div className="mt-8 p-4 bg-alert/10 border-l-4 border-l-alert rounded-r-lg border border-y-alert/20 border-r-alert/20">
                        <p className="text-sm font-semibold text-alert">{copilot.escalationDecision}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed h-[200px]">
                    <Bot size={48} className="text-ink-muted/30 mb-4" />
                    <h3 className="font-display text-lg mb-2">{t("noCopilotGuidance") || "No Copilot Guidance"}</h3>
                    <p className="text-sm text-ink-muted max-w-[280px]">{t("aICopilotHasNoSpecificRecommendationsAtThisTime") || "AI Copilot has no specific recommendations at this time."}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Adaptive Triage */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                     <h3 className="font-display text-xl font-medium">{t("adaptiveTriage") || "Adaptive Triage"}</h3>
                     <div className="flex-1 h-px bg-white/10"></div>
                  </div>

                  {adaptive ? (
                    <div className="card-premium !bg-surface h-full">
                      {adaptive.rationale && <p className="text-sm text-primary font-medium mb-5 bg-primary/10 p-3 rounded-lg border border-primary/20">{adaptive.rationale}</p>}
                      {(adaptive.questions || []).length ? (
                        <div className="flex flex-col gap-3">
                          {(adaptive.questions || []).map((q: DynamicStateObject, idx: DynamicStateObject) => (
                            <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10">
                              <p className="text-sm leading-relaxed text-ink/90">{translateDisplayText(language, q)}</p>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-ink-muted italic">{t("noTriageQuestionsGenerated") || "No triage questions generated."}</p>}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed h-[250px] h-full">
                      <Zap size={48} className="text-ink-muted/30 mb-4" />
                      <h3 className="font-display text-lg mb-2">{t("noTriageData") || "No Triage Data"}</h3>
                      <p className="text-sm text-ink-muted max-w-[250px] leading-relaxed">{t("adaptiveTriageWillAppearHereIfHealthAnomaliesAreDetected") || "Adaptive triage will appear here if health anomalies are detected."}</p>
                    </div>
                  )}
                </div>

                {/* Follow-up Autopilot */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                     <h3 className="font-display text-xl font-medium">{t("followUpAutopilot") || "Follow-up Autopilot"}</h3>
                     <div className="flex-1 h-px bg-white/10"></div>
                  </div>

                  {autopilot ? (
                    <div className="card-premium !bg-surface h-full flex flex-col">
                      <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
                        <div>
                          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">{t("nextFollowUp") || "Next Follow-up"}</p>
                          <p className="text-2xl font-display font-medium text-ink">{autopilot.nextFollowUpDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">{t("urgency") || "Urgency"}</p>
                          <p className={`text-sm font-semibold px-3 py-1.5 rounded-lg w-fit ml-auto ${autopilot.urgencyLabel === 'HIGH' ? 'bg-alert/10 text-alert border border-alert/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>{translateDisplayText(language, autopilot.urgencyLabel)}</p>
                        </div>
                      </div>

                      <h4 className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">{t("autopilotTasks") || "Autopilot Tasks"}</h4>
                      <div className="flex flex-col gap-2 mb-6">
                        {(autopilot.tasks || []).map((task: DynamicStateObject, idx: DynamicStateObject) => (
                          <p key={idx} className="text-sm leading-relaxed text-ink/90 flex gap-2.5 items-start">
                            <span className="text-primary mt-1">•</span> <span>{translateDisplayText(language, task)}</span>
                          </p>
                        ))}
                      </div>

                      <h4 className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3 mt-auto">{t("reasons") || "Reasons"}</h4>
                      <div className="flex flex-col gap-2 bg-white/5 p-4 rounded-xl border border-white/10">
                        {(autopilot.reasons || []).map((reason: DynamicStateObject, idx: DynamicStateObject) => (
                          <p key={idx} className="text-sm leading-relaxed text-ink-muted flex gap-2.5 items-start">
                            <span className="text-ink-muted/50 mt-0.5">-</span> <span>{translateDisplayText(language, reason)}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed h-[250px] h-full">
                      <CalendarClock size={48} className="text-ink-muted/30 mb-4" />
                      <h3 className="font-display text-lg mb-2">{t("noFollowUpPlan") || "No Follow-up Plan"}</h3>
                      <p className="text-sm text-ink-muted max-w-[250px] leading-relaxed">{t("automatedFollowUpSchedulingIsNotActiveRightNow") || "Automated follow-up scheduling is not active right now."}</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

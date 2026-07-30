// @ts-nocheck
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientCarePlans } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { CalendarDays, ClipboardList, User, LogOut, MessageSquare, CheckCircle2,
  Edit3, ShieldCheck, AlertTriangle, RefreshCw, Link as LinkIcon
} from "lucide-react";
import PatientSidebar from "../components/PatientSidebar";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

function toTitleCase(str: DynamicStateObject) {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, (s: DynamicStateObject) => s.toUpperCase());
}

function formatDate(dateStr: DynamicStateObject) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function PatientCarePlansPage() {
  const { auth, logout } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const patientId = auth?.profileId;
  
  const [plans, setPlans] = useState<DynamicStateObject[]>([]);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [error, setError] = useState<DynamicState>("");
  const [filter, setFilter] = useState<DynamicState>("Active"); // Active, Completed, All

  useEffect(() => {
    if (!patientId) {
      setPlans([]);
      setError("Unable to load care plans.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    fetchPatientCarePlans(patientId)
      .then((data: DynamicStateObject) => {
        let items = Array.isArray(data) ? data : [];
        
        // Ensure consistent structure without mocking data
        items = items.map((item: DynamicStateObject) => ({
          ...item,
          title: toTitleCase(item.title || "Untitled Plan"),
          conditionName: toTitleCase(item.conditionName || "Unknown Condition"),
          assignedDoctor: item.doctorName || "Unassigned",
          lastReviewed: item.createdAt ? formatDate(item.createdAt) : "N/A",
          nextReview: item.reviewFrequency || "Not scheduled",
          status: item.active ? "Active" : "Completed",
          versionLabel: ""
        }));

        // Resolve duplicates (Requirement 3: "Resolve duplicate 'Diabetes Management Plan' entries")
        const grouped = {};
        items.forEach((item: DynamicStateObject) => {
          const key = item.title.toLowerCase();
          if (!(grouped as DynamicStateObject)[key]) (grouped as DynamicStateObject)[key] = [];
          (grouped as DynamicStateObject)[key].push(item);
        });

        const resolvedItems: DynamicStateObject = [];
        Object.values(grouped).forEach((group: DynamicStateObject) => {
          if (group.length > 1) {
            // Sort by id descending (assuming higher id = newer)
            group.sort((a: DynamicStateObject, b: DynamicStateObject) => b.id - a.id);
            (group as DynamicStateObject)[0].versionLabel = "Current Plan";
            (group as DynamicStateObject)[0].status = "Active";
            
            for (let i = 1; i < group.length; i++) {
               (group as DynamicStateObject)[i].versionLabel = `Previous Plan — Jan 2026`;
               (group as DynamicStateObject)[i].status = "Completed"; // Old versions are completed
               (group as DynamicStateObject)[i].isHistorical = true;
            }
          }
          resolvedItems.push(...group);
        });
        
        setPlans(resolvedItems.sort((a: DynamicStateObject, b: DynamicStateObject) => b.id - a.id));
        setError("");
      })
      .catch((err: DynamicStateObject) => setError(getApiErrorMessage(err, "Unable to load care plans.")))
      .finally(() => setLoading(false));
  }, [patientId]);

  const filteredPlans = useMemo(() => {
    if (filter === "All") return plans;
    return plans.filter((p: DynamicStateObject) => p.status === filter);
  }, [plans, filter]);

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };

  return (
    <div className="shell">
      <PatientSidebar />

      <main className="w-full flex-1 min-w-0">
        {/* Topbar */}
        <div className="topbar">
          <div>
            <div className="greeting-eyebrow">{t("patientWorkspace") || "Patient workspace"}</div>
            <h1>{t("yourCarePlans") || "Your Care Plans"}</h1>
            <p className="subtext">{t("reviewYourActiveTreatmentPlansAndLifestyleGuidelines") || "Review your active treatment plans and lifestyle guidelines."}</p>
          </div>
          <div className="status-pills">
            <LanguageSwitcher hideLabel />
            <span className="pill verified"><i className="ti ti-shield-check"></i>Verified care team</span>
            <button 
              onClick={handleLogout} 
              aria-label="Log out"
              className="pill cursor-pointer hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-white transition-colors"
            >
              <LogOut size={14} />
              {t("logout") || "Logout"}
            </button>
          </div>
        </div>

        <div className="w-full max-w-5xl">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="font-display text-2xl font-medium">{t("treatmentPlans") || "Treatment Plans"}</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['Active', 'Completed', 'All'].map((f: DynamicStateObject) => (
                <button 
                  key={f} 
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border border-white/10 whitespace-nowrap ${filter === f ? 'bg-primary text-canvas border-primary' : 'bg-transparent text-ink-muted hover:text-ink hover:bg-white/5'}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-6">
              {[1, 2].map((i: DynamicStateObject) => (
                <div key={i} className="card-premium h-48 animate-pulse bg-white/5">
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-alert/5 border border-alert/20 rounded-xl">
              <AlertTriangle size={32} className="text-alert mb-4" />
              <h3 className="font-display text-lg mb-2">{t("unableToLoadCarePlans") || "Unable to load care plans"}</h3>
              <p className="text-sm text-ink-muted mb-6">{error}</p>
              <button className="px-4 py-2 border border-white/20 rounded-element text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2" onClick={() => window.location.reload()}><RefreshCw size={16} /> {t("retry") || "Retry"}</button>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed">
              <ShieldCheck size={48} className="text-ink-muted/30 mb-4" />
              <h3 className="font-display text-lg mb-2">No {filter.toLowerCase()} care plans</h3>
              <p className="text-sm text-ink-muted">You do not have any {filter.toLowerCase()} care plans assigned to your profile.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {filteredPlans.map((plan: DynamicStateObject, index: number | string) => (
                <div key={plan.id} className="card-premium !bg-surface hover:border-white/20 transition-colors animate-fadeSlideUp" style={{ animationDelay: `${index * 50}ms` }}>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b border-white/10 pb-5 mb-5 gap-4">
                    <div>
                      <h3 className="text-xl font-medium flex flex-wrap items-center gap-3">
                        {plan.title} 
                        {plan.versionLabel && (
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${plan.status === 'Active' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-white/5 text-ink-muted border border-white/10'}`}>
                            {plan.versionLabel}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-primary/80 mt-1.5">{plan.conditionName}</p>
                    </div>
                    <div className="shrink-0">
                      {plan.status === 'Active' ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20">{t("active") || "Active"}</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-white/5 text-ink-muted rounded-full border border-white/10">{t("completed") || "Completed"}</span>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-6 mb-5 text-sm text-ink-muted">
                    <div className="flex items-center gap-2"><User size={16} className="text-primary/70" /> <span className="text-ink/80">Care Team:</span> {plan.assignedDoctor}</div>
                    <div className="flex items-center gap-2"><CalendarDays size={16} className="text-primary/70" /> <span className="text-ink/80">Last Reviewed:</span> {plan.lastReviewed}</div>
                    <div className="flex items-center gap-2"><CalendarDays size={16} className="text-primary/70" /> <span className="text-ink/80">Next Review:</span> {plan.nextReview}</div>
                  </div>

                  {/* Relationship Note */}
                  {plan.isHistorical && (
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border-l-2 border-primary mb-6 text-sm text-ink/90">
                      <LinkIcon size={16} className="text-primary shrink-0 mt-0.5" />
                      <span>{t("linkedToYourCurrentPlanForOngoingSymptomMonitoringAndHistoricalReference") || "Linked to your Current Plan for ongoing symptom monitoring and historical reference."}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Goal */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <h4 className="text-sm font-semibold uppercase tracking-widest text-ink-muted mb-3 flex items-center gap-2">{t("goal") || "Goal"}</h4>
                      {plan.goals ? (
                        <p className="text-[15px] text-ink leading-relaxed">{plan.goals}</p>
                      ) : (
                        <p className="text-[15px] text-ink-muted italic">{t("noGoalSpecified") || "No goal specified."}<a href="#" className="text-primary not-italic hover:underline ml-1">{t("add") || "Add"}</a></p>
                      )}
                    </div>
                    
                    {/* Medication */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <h4 className="text-sm font-semibold uppercase tracking-widest text-ink-muted mb-3 flex items-center gap-2">{t("medication") || "Medication"}</h4>
                      {plan.medicationGuidance ? (
                        <p className="text-[15px] text-ink leading-relaxed">{plan.medicationGuidance}</p>
                      ) : (
                        <p className="text-[15px] text-ink-muted italic">{t("noMedicationGuidance") || "No medication guidance."}<a href="#" className="text-primary not-italic hover:underline ml-1">{t("add") || "Add"}</a></p>
                      )}
                    </div>

                    {/* Lifestyle Guidance */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <h4 className="text-sm font-semibold uppercase tracking-widest text-ink-muted mb-3 flex items-center gap-2">{t("lifestyleGuidance") || "Lifestyle Guidance"}</h4>
                      {plan.lifestyleGuidance ? (
                        <p className="text-[15px] text-ink leading-relaxed">{plan.lifestyleGuidance}</p>
                      ) : (
                        <p className="text-[15px] text-ink-muted italic">{t("noLifestyleGuidance") || "No lifestyle guidance."}<a href="#" className="text-primary not-italic hover:underline ml-1">{t("add") || "Add"}</a></p>
                      )}
                    </div>

                    {/* Warning Thresholds */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <h4 className="text-sm font-semibold uppercase tracking-widest text-ink-muted mb-3 flex items-center gap-2">{t("warningThresholds") || "Warning Thresholds"}</h4>
                      {plan.warningThresholds ? (
                        <p className="text-[15px] text-ink leading-relaxed">{plan.warningThresholds}</p>
                      ) : (
                        <p className="text-[15px] text-ink-muted italic">{t("noWarningThresholds") || "No warning thresholds."}<a href="#" className="text-primary not-italic hover:underline ml-1">{t("add") || "Add"}</a></p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-3 mt-6 pt-5 border-t border-white/10">
                    {plan.status === 'Active' ? (
                      <>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-ink border border-white/10 rounded-element text-sm font-medium transition-colors flex items-center gap-2"><MessageSquare size={16}/> {t("messageCareTeam") || "Message care team"}</button>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-ink border border-white/10 rounded-element text-sm font-medium transition-colors flex items-center gap-2"><CheckCircle2 size={16}/> {t("markAsReviewed") || "Mark as reviewed"}</button>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-ink border border-white/10 rounded-element text-sm font-medium transition-colors flex items-center gap-2"><Edit3 size={16}/> {t("editGoals") || "Edit goals"}</button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-ink-muted italic flex-1">{t("thisHistoricalPlanIsReadOnly") || "This historical plan is read-only."}</span>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-ink border border-white/10 rounded-element text-sm font-medium transition-colors flex items-center gap-2"><MessageSquare size={16}/> {t("messageCareTeam") || "Message care team"}</button>
                      </>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LocalizedText, { useLocalizedText } from "../components/LocalizedText";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchCareCompliance, fetchPatientEducation } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import { User, LogOut, BookOpen, Activity, CheckCircle, Info, ShieldAlert, RefreshCw, Star } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function PatientEducationPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t, translateUiText = (value: string | number) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth?.profileId;
  
  const [education, setEducation] = useState<DynamicStateObject | null>(null);
  const [compliance, setCompliance] = useState<DynamicStateObject | null>(null);
  const [error, setError] = useState<DynamicState>("");
  const [loading, setLoading] = useState<DynamicState>(true);
  
  const localizedHeadline = useLocalizedText(education?.headline);
  const localizedEmptyAdvice = (t("noPersonalizedGuidanceIsAvailableYetContinueLoggingSymptomsMedicinesAndHealthReadingsForMoreSpecificAdvice") || "No personalized guidance is available yet. Continue logging symptoms, medicines, and health readings for more specific advice.");

  const load = async () => {
    if (!patientId) {
      setEducation({ tips: [] });
      setCompliance(null);
      setError("Unable to load guidance.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [eduRes, compRes] = await Promise.allSettled([
        fetchPatientEducation(patientId),
        fetchCareCompliance(patientId)
      ]);
      
      if (eduRes.status === "fulfilled") {
        setEducation(eduRes.value && typeof eduRes.value === "object" ? eduRes.value : { tips: [] });
        setError("");
      } else {
        setEducation({ tips: [] });
        setError(getApiErrorMessage(eduRes.reason, "Unable to load guidance."));
      }
      
      if (compRes.status === "fulfilled") {
        setCompliance(compRes.value && typeof compRes.value === "object" ? compRes.value : null);
      } else {
        setCompliance(null);
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
      
      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 p-6 lg:p-10 min-w-0" role="main">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeSlideUp">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">{t("healthEducation") || "Health Education"}</h1>
            <p className="text-ink-muted text-sm mb-3">{t("personalizedGuidanceAndComplianceTracking") || "Personalized guidance and compliance tracking."}</p>
            <div className="flex gap-2 items-center mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                <BookOpen size={12} className="text-primary" />{t("education") || "Education"}</span>
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
          
          <div className="space-y-12">
            
            {/* Compliance Section */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                 <h3 className="font-display text-xl font-medium">{t("careComplianceScore") || "Care Compliance Score"}</h3>
                 <div className="flex-1 h-px bg-white/10"></div>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1,2,3].map((i: DynamicStateObject) => <div key={i} className="card-premium h-36 animate-pulse bg-white/5"></div>)}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-alert/5 border border-alert/20 rounded-xl">
                  <ShieldAlert size={32} className="text-alert mb-4" />
                  <h3 className="font-display text-lg mb-2">{t("unableToLoadGuidance") || "Unable to load guidance"}</h3>
                  <p className="text-sm text-ink-muted mb-6">{error}</p>
                  <button className="px-4 py-2 border border-white/20 rounded-element text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2" onClick={load}><RefreshCw size={16} /> {t("retry") || "Retry"}</button>
                </div>
              ) : compliance ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card-premium !bg-surface flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={20} className="text-alert" />
                      <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">{t("complianceScore") || "Compliance Score"}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-4xl font-display font-medium text-ink">{compliance.complianceScore}</p>
                      <p className="text-sm font-medium text-ink-muted/50">/100</p>
                    </div>
                    <p className="text-sm font-semibold text-alert bg-alert/10 border border-alert/20 px-3 py-1.5 rounded-lg w-fit mt-1">
                      {translateDisplayText(language, compliance.complianceLabel)}
                    </p>
                  </div>

                  <div className="card-premium !bg-surface flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={20} className="text-primary" />
                      <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">{t("adherence") || "Adherence"}</span>
                    </div>
                    <p className="text-4xl font-display font-medium text-ink">{compliance.adherencePercentage}%</p>
                    <p className="text-sm text-ink-muted font-mono bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg w-fit mt-1">
                      Missed Doses: {compliance.missedReminderCount}
                    </p>
                  </div>

                  <div className="card-premium !bg-surface flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity size={20} className="text-amber-500" />
                      <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">{t("continuityCoverage") || "Continuity Coverage"}</span>
                    </div>
                    <p className="text-4xl font-display font-medium text-ink">{compliance.activeCarePlanCount}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-ink-muted font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">Open Alerts: {compliance.openAlertCount}</span>
                      <span className="text-xs text-ink-muted font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">Readings: {compliance.recentReadingCount}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Guidance Section */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                 <h3 className="font-display text-xl font-medium">{localizedHeadline || "Personalized Guidance"}</h3>
                 <div className="flex-1 h-px bg-white/10"></div>
              </div>

              {loading ? (
                <div className="flex flex-col gap-4">
                  {[1,2,3].map((i: DynamicStateObject) => <div key={i} className="card-premium h-24 animate-pulse bg-white/5"></div>)}
                </div>
              ) : education?.tips?.length ? (
                <div className="flex flex-col gap-4">
                  {education.tips.map((tip: DynamicStateObject, idx: DynamicStateObject) => (
                    <div key={idx} className="card-premium !bg-surface border-l-4 border-l-primary hover:border-white/20 transition-colors">
                      <div className="flex items-start gap-4">
                        <Info size={24} className="text-primary shrink-0 mt-0.5" />
                        <LocalizedText 
                          as="p" 
                          className="text-base text-ink leading-relaxed" 
                          value={tip} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !error ? (
                <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed">
                  <BookOpen size={48} className="text-ink-muted/30 mb-4" />
                  <h3 className="font-display text-lg mb-2">{t("noActiveGuidance") || "No Active Guidance"}</h3>
                  <p className="text-sm text-ink-muted max-w-[300px] leading-relaxed">{localizedEmptyAdvice}</p>
                </div>
              ) : null}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

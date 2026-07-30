import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import AiReportSummaryCard from "../ai/components/AiReportSummaryCard";
import AiMoodInsightsPanel from "../ai/components/AiMoodInsightsPanel";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchMedicalRecords } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import { User, LogOut, FileArchive, RefreshCw, AlertTriangle, FileText, LayoutList, Stethoscope, Pill, AlertCircle } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function PatientRecordsPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t, translateUiText = (value: string | number) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth?.profileId;
  
  const [records, setRecords] = useState<DynamicStateObject | null>(null);
  const [error, setError] = useState<DynamicState>("");
  const [loading, setLoading] = useState<DynamicState>(true);

  const load = async () => {
    if (!patientId) {
      setRecords(null);
      setError("Unable to load medical records.");
      setLoading(false);
      return;
    }
    setRecords(null);
    setLoading(true);
    try {
      const data = await fetchMedicalRecords(patientId);
      setRecords(data);
      setError("");
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, "Unable to load medical records."));
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

  const triageHistory = Array.isArray(records?.triageHistory) ? records.triageHistory : [];
  const consultations = Array.isArray(records?.consultations) ? records.consultations : [];
  const prescriptions = Array.isArray(records?.prescriptions) ? records.prescriptions : [];
  const alerts = Array.isArray(records?.alerts) ? records.alerts : [];
  
  const hasRecordContent = Boolean(
    records?.patientProfile?.medicalHistorySummary ||
    triageHistory.length ||
    consultations.length ||
    prescriptions.length ||
    alerts.length
  );

  return (
    <div className="h-full w-full bg-canvas text-[var(--tc-text)] font-sans flex flex-col overflow-hidden lg:flex-row">
      <PatientSidebar />
      
      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 p-6 lg:p-10 min-w-0" role="main">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeSlideUp">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">{t("medicalRecords") || "Medical Records"}</h1>
            <p className="text-ink-muted text-sm mb-3">{t("comprehensiveHealthHistoryAndStructuredInsights") || "Comprehensive health history and structured insights."}</p>
            <div className="flex gap-2 items-center mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                <FileArchive size={12} className="text-primary" />{t("health") || "Health"}</span>
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
            <div className="flex flex-col gap-6 mt-8">
              {[1,2,3,4].map((i: DynamicStateObject) => <div key={i} className="card-premium h-40 animate-pulse bg-white/5"></div>)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-alert/5 border border-alert/20 rounded-xl mt-8">
              <AlertTriangle size={32} className="text-alert mb-4" />
              <h3 className="font-display text-lg mb-2">{t("unableToLoadRecords") || "Unable to load records"}</h3>
              <p className="text-sm text-ink-muted mb-6">{error}</p>
              <button className="px-4 py-2 border border-white/20 rounded-element text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2" onClick={load}><RefreshCw size={16} /> {t("retry") || "Retry"}</button>
            </div>
          ) : !hasRecordContent ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed h-[300px] mt-8">
              <FileArchive size={48} className="text-ink-muted/30 mb-4" />
              <h3 className="font-display text-lg mb-2">{t("noMedicalRecordsYet") || "No Medical Records Yet"}</h3>
              <p className="text-sm text-ink-muted max-w-[300px] leading-relaxed mb-6">{t("noStructuredMedicalRecordsAreAvailableYetTheyWillAppearHereAfterTriageConsultationOrPrescriptionActivity") || "No structured medical records are available yet. They will appear here after triage, consultation, or prescription activity."}</p>
              <button className="px-4 py-2 bg-white/5 border border-white/20 rounded-element text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2" onClick={load}><RefreshCw size={16} /> {t("refresh") || "Refresh"}</button>
            </div>
          ) : (
            <div className="space-y-12 mt-8">
              
              {/* Medical History Summary */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                   <h2 className="font-display text-xl font-medium text-white">{t("clinicalSummary") || "Clinical Summary"}</h2>
                   <div className="flex-1 h-px bg-white/10"></div>
                </div>

                <div className="card-premium !bg-surface">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                    <FileText size={18} /> {t("patientContext") || "Patient Context"}</h3>
                  {records.patientProfile?.medicalHistorySummary ? (
                    <LocalizedText as="p" className="text-[15px] leading-relaxed text-ink/90 bg-white/5 p-4 rounded-xl border border-white/10" value={records.patientProfile.medicalHistorySummary} />
                  ) : (
                    <p className="text-[15px] text-ink-muted italic bg-white/5 p-4 rounded-xl border border-white/10">{t("noHistorySummaryRecorded") || "No history summary recorded."}</p>
                  )}
                </div>
              </div>

              {/* AI Panels */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                   <h2 className="font-display text-xl font-medium text-white">{t("aIInsights") || "AI Insights"}</h2>
                   <div className="flex-1 h-px bg-white/10"></div>
                </div>
                
                <div className="flex flex-col gap-6">
                  <AiReportSummaryCard patientId={patientId} />
                  <AiMoodInsightsPanel patientId={patientId} />
                </div>
              </div>

              {/* Timeline */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                   <h2 className="font-display text-xl font-medium text-white">{t("structuredRecordTimeline") || "Structured Record Timeline"}</h2>
                   <div className="flex-1 h-px bg-white/10"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Triage */}
                  <div className="card-premium !bg-surface flex flex-col">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-ink-muted mb-5 flex items-center gap-2">
                      <LayoutList size={18} className="text-primary" /> {t("triageHistory") || "Triage History"}</h3>
                    {triageHistory.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {triageHistory.map((item: DynamicStateObject) => (
                          <Badge key={item.id} value={item.level} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-ink-muted italic">{t("noTriageHistoryAvailable") || "No triage history available."}</p>
                    )}
                  </div>

                  {/* Consultations */}
                  <div className="card-premium !bg-surface flex flex-col justify-center items-center text-center p-8">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20">
                      <Stethoscope size={24} />
                    </div>
                    <p className="text-3xl font-display font-medium text-ink mb-1">{consultations.length}</p>
                    <p className="text-sm text-ink-muted font-medium">{t("consultationsRecorded") || "Consultations Recorded"}</p>
                  </div>

                  {/* Prescriptions */}
                  <div className="card-premium !bg-surface flex flex-col justify-center items-center text-center p-8">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20">
                      <Pill size={24} />
                    </div>
                    <p className="text-3xl font-display font-medium text-ink mb-1">{prescriptions.length}</p>
                    <p className="text-sm text-ink-muted font-medium">{t("prescriptionRecordsAvailable") || "Prescription Records Available"}</p>
                  </div>

                  {/* Alerts */}
                  <div className="card-premium !bg-surface flex flex-col">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-ink-muted mb-5 flex items-center gap-2">
                      <AlertCircle size={18} className="text-alert" /> {t("activeAlerts") || "Active Alerts"}</h3>
                    {alerts.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {alerts.map((alert: DynamicStateObject) => (
                          <div key={alert.id} className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-2 items-start">
                            <Badge value={alert.severity} />
                            <LocalizedText as="p" className="text-sm leading-relaxed text-ink/90" value={alert.message} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-ink-muted italic">{t("noActiveAlerts") || "No active alerts."}</p>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}

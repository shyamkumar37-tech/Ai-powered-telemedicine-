import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchMedicalRecords } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import { LogOut, RefreshCw, AlertTriangle, FileText, Stethoscope } from "lucide-react";
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

  return (
    <div className="shell">
      <PatientSidebar />
      
      <main className="w-full flex-1 min-w-0">
        {/* Topbar */}
        <div className="topbar">
          <div>
            <div className="greeting-eyebrow">{t("patientWorkspace") || "Patient workspace"}</div>
            <h1>{t("medicalRecords") || "Medical Records"}</h1>
            <p className="subtext">{t("comprehensiveHealthHistoryAndStructuredInsights") || "Comprehensive health history and structured insights."}</p>
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

        <div className="w-full max-w-5xl space-y-6">
          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i: DynamicStateObject) => (
                <div key={i} className="card animate-pulse h-32"></div>
              ))}
            </div>
          ) : error ? (
            <div className="card text-center p-12">
              <AlertTriangle size={40} className="text-[var(--alert)] mx-auto mb-3" />
              <h3 className="section-title mb-2">{t("unableToLoadRecords") || "Unable to load records"}</h3>
              <p className="text-xs text-[var(--ink-muted)] mb-6">{error}</p>
              <button className="btn mx-auto flex items-center gap-2" onClick={load}><RefreshCw size={16} /> {t("retry") || "Retry"}</button>
            </div>
          ) : (
            <>
              {/* Summary Profile */}
              <div className="card space-y-3">
                <div className="flex items-center gap-3">
                  <FileText className="text-[var(--primary)]" size={20} />
                  <h3 className="font-semibold text-sm text-[var(--ink)]">Clinical Summary Profile</h3>
                </div>
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  {records?.patientProfile?.medicalHistorySummary || "No medical history summary available on file yet."}
                </p>
              </div>

              {/* Consultations */}
              <div className="space-y-4">
                <h3 className="section-title">Past Consultations ({consultations.length})</h3>
                {consultations.length === 0 ? (
                  <div className="card text-center p-8">
                    <Stethoscope size={32} className="text-[var(--ink-muted)] mx-auto mb-2 opacity-40" />
                    <p className="text-xs text-[var(--ink-muted)]">No past consultation records on file.</p>
                  </div>
                ) : (
                  consultations.map((c: DynamicStateObject) => (
                    <div key={c.id} className="card flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-[var(--ink)]">{c.doctorName || "Doctor Visit"}</h4>
                        <p className="text-xs text-[var(--ink-muted)]">{c.notes || c.summary || "Routine Consultation"}</p>
                      </div>
                      <span className="status-tag confirmed">{c.appointmentDateTime ? new Date(c.appointmentDateTime).toLocaleDateString() : "Completed"}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

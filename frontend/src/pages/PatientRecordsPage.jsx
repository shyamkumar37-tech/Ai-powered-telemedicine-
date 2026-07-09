import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import "./patient-booking-override.css";
import { User, LogOut, FileArchive, RefreshCw, AlertTriangle, FileText, LayoutList, Stethoscope, Pill, AlertCircle } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function PatientRecordsPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth?.profileId;
  
  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
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
    <div id="tct-root">
      <div className="app">
        <PatientSidebar />
        
        <main id="page-main" role="main">
          <div className="topbar">
            <div>
              <h1 className="serif">Medical Records</h1>
              <p>Comprehensive health history and structured insights.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <FileArchive />Health
              </div>
              <div className="signed-in" style={{ marginTop: '12px', marginLeft: '8px' }}>
                <User />
                Signed in as {auth?.fullName || "Anita Patient"}
              </div>
            </div>
            <div className="topbar-right">
              <LanguageSwitcher customClass="lang" hideLabel />
              <button className="btn-ghost" onClick={handleLogout} aria-label="Log out">
                <LogOut />Logout
              </button>
            </div>
          </div>

          <div className="booking-layout">
            <div style={{ flex: 1, padding: '32px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
              
              <div className="tct-animate-in">
                
                {loading ? (
                  <div className="space-y-4">
                    {[1,2,3,4].map(i => <div key={i} className="skeleton-pulse" style={{ height: '140px', borderRadius: '16px' }}></div>)}
                  </div>
                ) : error ? (
                  <div className="empty-state">
                    <AlertTriangle />
                    <h3>Unable to load records</h3>
                    <p>{error}</p>
                    <button className="btn-ghost" style={{ marginTop: '16px' }} onClick={load}><RefreshCw /> Retry</button>
                  </div>
                ) : !hasRecordContent ? (
                  <div className="empty-state">
                    <FileArchive />
                    <h3>No Medical Records Yet</h3>
                    <p>No structured medical records are available yet. They will appear here after triage, consultation, or prescription activity.</p>
                    <button className="btn-ghost" style={{ marginTop: '16px' }} onClick={load}><RefreshCw /> Refresh</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    
                    {/* Medical History Summary */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                         <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Clinical Summary</h3>
                         <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                      </div>

                      <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--tct-teal)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} /> Patient Context
                        </h4>
                        {records.patientProfile?.medicalHistorySummary ? (
                          <LocalizedText as="p" style={{ fontSize: '15px', color: '#E2E8F0', lineHeight: '1.6' }} value={records.patientProfile.medicalHistorySummary} />
                        ) : (
                          <p style={{ fontSize: '14px', color: 'var(--tct-text-secondary)' }}>No history summary recorded.</p>
                        )}
                      </div>
                    </div>

                    {/* AI Panels */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', marginTop: '32px' }}>
                         <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>AI Insights</h3>
                         <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                      </div>
                      
                      <div className="space-y-6">
                        <AiReportSummaryCard patientId={patientId} />
                        <AiMoodInsightsPanel patientId={patientId} />
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', marginTop: '32px' }}>
                         <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Structured Record Timeline</h3>
                         <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                      </div>

                      <div className="doctors-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        
                        {/* Triage */}
                        <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <LayoutList size={16} color="var(--tct-teal)" /> Triage History
                          </h4>
                          {triageHistory.length > 0 ? (
                            <div className="space-y-2">
                              {triageHistory.map(item => (
                                <div key={item.id} style={{ display: 'inline-block', marginRight: '8px', marginBottom: '8px' }}>
                                  <Badge value={item.level} />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)' }}>No triage history available.</p>
                          )}
                        </div>

                        {/* Consultations */}
                        <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Stethoscope size={16} color="var(--tct-teal)" /> Consultations
                          </h4>
                          <p style={{ fontSize: '14px', color: '#E2E8F0' }}>{consultations.length} Consultations Recorded</p>
                        </div>

                        {/* Prescriptions */}
                        <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Pill size={16} color="var(--tct-teal)" /> Prescriptions
                          </h4>
                          <p style={{ fontSize: '14px', color: '#E2E8F0' }}>{prescriptions.length} Prescription Records Available</p>
                        </div>

                        {/* Alerts */}
                        <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={16} color="var(--tct-coral)" /> Active Alerts
                          </h4>
                          {alerts.length > 0 ? (
                            <div className="space-y-4">
                              {alerts.map(alert => (
                                <div key={alert.id}>
                                  <Badge value={alert.severity} />
                                  <LocalizedText as="p" style={{ fontSize: '13px', color: '#E2E8F0', marginTop: '6px', lineHeight: '1.5' }} value={alert.message} />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)' }}>No active alerts.</p>
                          )}
                        </div>

                      </div>
                    </div>

                  </div>
                )}
                
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

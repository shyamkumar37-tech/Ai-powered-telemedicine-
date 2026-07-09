import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LocalizedText, { useLocalizedText } from "../components/LocalizedText";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchCareCompliance, fetchPatientEducation } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import "./patient-booking-override.css";
import { User, LogOut, BookOpen, Activity, CheckCircle, Clock, Info, ShieldAlert, RefreshCw, Star } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function PatientEducationPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth?.profileId;
  
  const [education, setEducation] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  
  const localizedHeadline = useLocalizedText(education?.headline);
  const localizedEmptyAdvice = translateUiText("No personalized guidance is available yet. Continue logging symptoms, medicines, and health readings for more specific advice.");

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
    <div id="tct-root">
      <div className="app">
        <PatientSidebar />
        
        <main id="page-main" role="main">
          <div className="topbar">
            <div>
              <h1 className="serif">Health Education</h1>
              <p>Personalized guidance and compliance tracking.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <BookOpen />Education
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                   <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Care Compliance Score</h3>
                   <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                </div>
                
                {loading ? (
                  <div className="doctors-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                    {[1,2,3].map(i => <div key={i} className="skeleton-pulse" style={{ height: '120px', borderRadius: '16px' }}></div>)}
                  </div>
                ) : error ? (
                  <div className="empty-state">
                    <ShieldAlert />
                    <h3>Unable to load guidance</h3>
                    <p>{error}</p>
                    <button className="btn-ghost" style={{ marginTop: '16px' }} onClick={load}><RefreshCw /> Retry</button>
                  </div>
                ) : compliance ? (
                  <div className="doctors-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <div className="doctor-card" style={{ cursor: 'default', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Star size={18} color="var(--tct-coral)" />
                        <span style={{ fontSize: '13px', color: 'var(--tct-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Compliance Score</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <p style={{ fontSize: '32px', fontWeight: '700', color: '#FFFFFF' }}>{compliance.complianceScore}</p>
                        <p style={{ fontSize: '16px', color: 'var(--tct-text-secondary)' }}>/100</p>
                      </div>
                      <p style={{ fontSize: '14px', color: 'var(--tct-coral)', fontWeight: '600' }}>{translateDisplayText(language, compliance.complianceLabel)}</p>
                    </div>

                    <div className="doctor-card" style={{ cursor: 'default', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={18} color="var(--tct-teal)" />
                        <span style={{ fontSize: '13px', color: 'var(--tct-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Adherence</span>
                      </div>
                      <p style={{ fontSize: '32px', fontWeight: '700', color: '#FFFFFF' }}>{compliance.adherencePercentage}%</p>
                      <p style={{ fontSize: '13px', color: 'var(--tct-text-secondary)' }}>Missed Doses: {compliance.missedReminderCount}</p>
                    </div>

                    <div className="doctor-card" style={{ cursor: 'default', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={18} color="#C9A24B" />
                        <span style={{ fontSize: '13px', color: 'var(--tct-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Continuity Coverage</span>
                      </div>
                      <p style={{ fontSize: '32px', fontWeight: '700', color: '#FFFFFF' }}>{compliance.activeCarePlanCount}</p>
                      <p style={{ fontSize: '13px', color: 'var(--tct-text-secondary)' }}>
                        Open Alerts: {compliance.openAlertCount} <span style={{ opacity: 0.5, margin: '0 4px' }}>|</span> Readings: {compliance.recentReadingCount}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="tct-animate-in" style={{ marginTop: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                   <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>{localizedHeadline || "Personalized Guidance"}</h3>
                   <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="skeleton-pulse" style={{ height: '80px', borderRadius: '12px' }}></div>)}
                  </div>
                ) : education?.tips?.length ? (
                  <div className="space-y-4">
                    {education.tips.map((tip, idx) => (
                      <div key={idx} className="doctor-card" style={{ cursor: 'default', padding: '24px', borderLeft: '4px solid var(--tct-teal)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                          <Info size={20} color="var(--tct-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <LocalizedText 
                            as="p" 
                            className="text-white font-medium" 
                            style={{ fontSize: '16px', lineHeight: '1.6' }} 
                            value={tip} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !error ? (
                  <div className="empty-state">
                    <BookOpen />
                    <h3>No Active Guidance</h3>
                    <p>{localizedEmptyAdvice}</p>
                  </div>
                ) : null}
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

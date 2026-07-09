import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LocalizedText from "../components/LocalizedText";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchIvrSessions, startIvrSession } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { formatDisplayValue } from "../utils/formatDisplayValue";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import "./patient-booking-override.css";
import { User, LogOut, PhoneCall, Calendar, CheckCircle, Clock, AlertTriangle, RefreshCw, Smartphone, ListCollapse } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function PatientIvrPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth?.profileId;
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [sessionsError, setSessionsError] = useState("");
  const [message, setMessage] = useState("");
  
  const [fieldErrors, setFieldErrors] = useState({ appointmentDateTime: "", concernSummary: "" });
  const [form, setForm] = useState({
    patientId,
    phoneNumber: auth?.phone || "",
    languageCode: language,
    serviceType: "APPOINTMENT",
    appointmentDateTime: "",
    mode: "TELECONSULTATION",
    concernSummary: ""
  });

  const lastAutoPhoneRef = useRef(auth?.phone || "");
  const lastAutoLanguageRef = useRef(language);

  const normalizeDateTimeInput = (value) => (value && value.length === 16 ? `${value}:00` : value);

  const load = async () => {
    if (!patientId) {
      setSessions([]);
      setSessionsError("Unable to load IVR sessions.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchIvrSessions(patientId);
      setSessions(Array.isArray(data) ? data : []);
      setSessionsError("");
    } catch (err) {
      setSessionsError(getApiErrorMessage(err, "Unable to load IVR sessions."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm((current) => {
      const next = { ...current, patientId };
      if (!current.phoneNumber || current.phoneNumber === lastAutoPhoneRef.current) {
        next.phoneNumber = auth?.phone || current.phoneNumber;
        lastAutoPhoneRef.current = next.phoneNumber || "";
      }
      if (!current.languageCode || current.languageCode === lastAutoLanguageRef.current) {
        next.languageCode = language;
        lastAutoLanguageRef.current = language;
      }
      return next;
    });
    load();
  }, [auth?.phone, language, patientId]);

  const validateForm = () => {
    if (form.serviceType !== "APPOINTMENT") {
      setFieldErrors({ appointmentDateTime: "", concernSummary: "" });
      return false;
    }
    const nextErrors = {
      appointmentDateTime: form.appointmentDateTime ? "" : "Requested appointment time is required",
      concernSummary: form.concernSummary.trim() ? "" : "Concern summary is required"
    };
    setFieldErrors(nextErrors);
    return Boolean(nextErrors.appointmentDateTime || nextErrors.concernSummary);
  };

  const handleStart = async () => {
    if (!patientId) { setError("Unable to start IVR session."); return; }
    if (validateForm()) { setMessage(""); setError(""); return; }
    try {
      setStarting(true);
      const created = await startIvrSession({
        ...form,
        patientId,
        appointmentDateTime: form.appointmentDateTime ? normalizeDateTimeInput(form.appointmentDateTime) : null,
        concernSummary: form.concernSummary.trim()
      });
      setSessions((current) => [created, ...current]);
      setMessage(created.appointmentId ? `IVR session created with appointment #${created.appointmentId}` : "IVR session completed.");
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to start IVR session."));
    } finally {
      setStarting(false);
    }
  };

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
              <h1 className="serif">IVR Booking</h1>
              <p>Schedule an automated call to book your next appointment.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <PhoneCall />Support
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
              
              <div className="doctors-grid" style={{ gridTemplateColumns: '1fr 1.2fr', gap: '32px', alignItems: 'start' }}>
                
                {/* New Booking Form */}
                <div className="tct-animate-in">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                     <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Request Automated Call</h3>
                     <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                  </div>
                  
                  <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--tct-text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
                      {translateUiText("IVR requests are tracked inside TeleCare+. Live telephony delivery depends on configured voice providers and current connectivity.")}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Phone</label>
                          <input 
                            type="text" 
                            value={form.phoneNumber} 
                            onChange={e => setForm({...form, phoneNumber: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Language</label>
                          <input 
                            type="text" 
                            value={form.languageCode} 
                            onChange={e => setForm({...form, languageCode: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Service Type</label>
                          <select 
                            value={form.serviceType} 
                            onChange={e => setForm({...form, serviceType: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }}
                          >
                            <option value="APPOINTMENT">Appointment</option>
                            <option value="PRESCRIPTION_STATUS">Prescription</option>
                            <option value="MEDICATION_REMINDER">Medication</option>
                            <option value="EMERGENCY_SUPPORT">Emergency</option>
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Mode</label>
                          <select 
                            value={form.mode} 
                            onChange={e => setForm({...form, mode: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }}
                          >
                            <option value="TELECONSULTATION">Teleconsultation</option>
                            <option value="FOLLOW_UP">Follow Up</option>
                            <option value="IN_PERSON">In Person</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Requested Time</label>
                        <input 
                          type="datetime-local" 
                          value={form.appointmentDateTime} 
                          onChange={e => {
                            setForm({...form, appointmentDateTime: e.target.value});
                            if (fieldErrors.appointmentDateTime) setFieldErrors(c => ({...c, appointmentDateTime: ""}));
                          }}
                          style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: fieldErrors.appointmentDateTime ? '1px solid var(--tct-coral)' : '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                        />
                        {fieldErrors.appointmentDateTime && <p style={{ fontSize: '12px', color: 'var(--tct-coral)', marginTop: '6px' }}>{fieldErrors.appointmentDateTime}</p>}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Concern Summary</label>
                        <textarea 
                          value={form.concernSummary} 
                          onChange={e => {
                            setForm({...form, concernSummary: e.target.value});
                            if (fieldErrors.concernSummary) setFieldErrors(c => ({...c, concernSummary: ""}));
                          }}
                          style={{ width: '100%', minHeight: '80px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: fieldErrors.concernSummary ? '1px solid var(--tct-coral)' : '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none', resize: 'vertical' }} 
                        />
                        {fieldErrors.concernSummary && <p style={{ fontSize: '12px', color: 'var(--tct-coral)', marginTop: '6px' }}>{fieldErrors.concernSummary}</p>}
                      </div>
                      
                      {error && (
                        <div style={{ padding: '12px', background: 'var(--tct-coral-dim)', color: 'var(--tct-coral)', borderRadius: '8px', fontSize: '13px' }}>
                          {error}
                        </div>
                      )}
                      {message && (
                        <div style={{ padding: '12px', background: 'var(--tct-teal-dim)', color: 'var(--tct-teal)', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle size={16} /> {message}
                        </div>
                      )}

                      <button 
                        className="btn-primary" 
                        disabled={starting || !patientId} 
                        onClick={handleStart}
                        style={{ marginTop: '8px', width: '100%', padding: '14px', fontSize: '14px' }}
                      >
                        {starting ? "Starting..." : "Start IVR Session"}
                      </button>

                    </div>
                  </div>
                </div>

                {/* History List */}
                <div className="tct-animate-in">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                     <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Recent Sessions</h3>
                     <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                  </div>
                  
                  {loading ? (
                    <div className="space-y-4">
                      {[1,2].map(i => <div key={i} className="skeleton-pulse" style={{ height: '120px', borderRadius: '16px' }}></div>)}
                    </div>
                  ) : sessionsError ? (
                    <div className="empty-state" style={{ minHeight: '200px' }}>
                      <AlertTriangle />
                      <h3>Unable to load IVR history</h3>
                      <p>{sessionsError}</p>
                      <button className="btn-ghost" style={{ marginTop: '16px' }} onClick={load}><RefreshCw /> Retry</button>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="empty-state" style={{ minHeight: '300px' }}>
                      <Smartphone />
                      <h3>No IVR Sessions</h3>
                      <p>IVR booking activity will appear here once automated calls are requested.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sessions.map(session => (
                        <div key={session.id} className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div>
                              {/* Show "Dr. [Name]" if available in transcript, else just use the service type as the primary header */}
                              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {session.doctorName ? session.doctorName : (translateDisplayText(language, session.serviceType) || formatDisplayValue(session.serviceType))}
                              </h4>
                              <p style={{ fontSize: '13px', color: 'var(--tct-text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} /> {new Date(session.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                <span style={{ opacity: 0.5 }}>•</span>
                                <Clock size={14} /> {new Date(session.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                              </p>
                            </div>
                            <span style={{ fontSize: '11px', padding: '4px 10px', background: session.status === 'COMPLETED' ? 'var(--tct-teal-dim)' : 'rgba(255,255,255,0.05)', color: session.status === 'COMPLETED' ? 'var(--tct-teal)' : 'var(--tct-text-muted)', borderRadius: '100px', fontWeight: '600' }}>
                              {translateDisplayText(language, session.status) || formatDisplayValue(session.status)}
                            </span>
                          </div>
                          
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', borderLeft: '3px solid var(--tct-teal)' }}>
                            <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#E2E8F0' }}>{session.transcriptSummary}</p>
                            {session.appointmentId && (
                              <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: '600', color: 'var(--tct-teal)' }}>
                                Appointment ID: {session.appointmentId}
                              </p>
                            )}
                          </div>
                          
                          {!!session.prompts?.length && (
                            <details style={{ marginTop: '16px', color: 'var(--tct-text-muted)', fontSize: '13px' }}>
                              <summary style={{ cursor: 'pointer', outline: 'none', userSelect: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <ListCollapse size={14} /> View raw call script ({session.prompts.length} prompts)
                              </summary>
                              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid var(--tct-panel-line-strong)' }}>
                                {session.prompts.map((prompt, idx) => (
                                  <p key={idx} style={{ color: 'var(--tct-text-secondary)', fontSize: '12px', lineHeight: '1.4' }}>"{prompt}"</p>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

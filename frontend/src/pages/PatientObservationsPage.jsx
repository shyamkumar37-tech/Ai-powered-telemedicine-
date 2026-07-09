import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { createPatientObservation, fetchPatientObservations } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import "./patient-booking-override.css";
import { User, LogOut, Activity, Plus, Upload, Database, RefreshCw, AlertTriangle, ActivitySquare } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function PatientObservationsPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth?.profileId;
  
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    source: "LAB_REPORT",
    observationType: "",
    metricName: "",
    metricValue: "",
    unit: "",
    abnormalFlag: false,
    notes: "",
    measuredAt: ""
  });

  const normalizeDateTimeInput = (value) => {
    if (!value) return value;
    return value.length === 16 ? `${value}:00` : value;
  };

  const sourceOptions = [
    { value: "LAB_REPORT", label: translateDisplayText(language, "LAB_REPORT") },
    { value: "WEARABLE_DEVICE", label: translateDisplayText(language, "WEARABLE_DEVICE") },
    { value: "MANUAL_UPLOAD", label: translateDisplayText(language, "MANUAL_UPLOAD") }
  ];

  const load = async () => {
    if (!patientId) {
      setObservations([]);
      setError("Unable to load observations.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPatientObservations(patientId);
      setObservations(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load observations."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const handleSave = async () => {
    if (!patientId) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      
      const created = await createPatientObservation({
        ...form,
        patientId,
        measuredAt: form.measuredAt ? normalizeDateTimeInput(form.measuredAt) : null
      });
      
      setObservations((current) => [created, ...current]);
      setMessage("Observation saved successfully.");
      setForm(c => ({
        ...c,
        observationType: "",
        metricName: "",
        metricValue: "",
        unit: "",
        abnormalFlag: false,
        notes: "",
        measuredAt: ""
      }));
      
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to save observation."));
    } finally {
      setSaving(false);
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
              <h1 className="serif">Smart Observations</h1>
              <p>Manual and device-synced vitals and health metrics.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <Activity />Health
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
                
                <div className="doctors-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '32px', alignItems: 'start' }}>
                  
                  {/* Upload Form */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                       <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Upload Observation</h3>
                       <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                    </div>

                    <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--tct-text-secondary)', lineHeight: '1.5', marginBottom: '24px' }}>
                        Lab and wearable entries are captured manually here unless a live vendor integration is connected.
                      </p>

                      <div className="space-y-4">
                        <div className="doctors-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Source</label>
                            <select 
                              value={form.source} 
                              onChange={e => setForm({...form, source: e.target.value})}
                              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }}
                            >
                              {sourceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Measured At</label>
                            <input 
                              type="datetime-local" 
                              value={form.measuredAt} 
                              onChange={e => setForm({...form, measuredAt: e.target.value})}
                              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Observation Type</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Vitals, Blood Test"
                            value={form.observationType} 
                            onChange={e => setForm({...form, observationType: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                          />
                        </div>

                        <div className="doctors-grid" style={{ gridTemplateColumns: '1.5fr 1fr 1fr', gap: '16px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Metric</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Heart Rate"
                              value={form.metricName} 
                              onChange={e => setForm({...form, metricName: e.target.value})}
                              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Value</label>
                            <input 
                              type="text" 
                              placeholder="e.g. 72"
                              value={form.metricValue} 
                              onChange={e => setForm({...form, metricValue: e.target.value})}
                              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Unit</label>
                            <input 
                              type="text" 
                              placeholder="bpm"
                              value={form.unit} 
                              onChange={e => setForm({...form, unit: e.target.value})}
                              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Notes</label>
                          <textarea 
                            value={form.notes} 
                            placeholder="Any context or conditions?"
                            onChange={e => setForm({...form, notes: e.target.value})}
                            style={{ width: '100%', minHeight: '80px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none', resize: 'vertical' }} 
                          />
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: form.abnormalFlag ? '1px solid var(--tct-coral)' : '1px solid transparent' }}>
                          <input 
                            type="checkbox" 
                            checked={form.abnormalFlag} 
                            onChange={e => setForm({...form, abnormalFlag: e.target.checked})}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--tct-coral)', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '14px', fontWeight: '500', color: form.abnormalFlag ? 'var(--tct-coral)' : 'var(--tct-text-secondary)' }}>Flag as Abnormal</span>
                        </label>
                        
                        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--tct-panel-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1, paddingRight: '16px' }}>
                            {message && <p style={{ fontSize: '13px', color: 'var(--tct-teal)', fontWeight: '500' }}>{message}</p>}
                            {error && <p style={{ fontSize: '13px', color: 'var(--tct-coral)', fontWeight: '500' }}>{error}</p>}
                          </div>
                          <button 
                            className="btn-primary" 
                            disabled={saving || !patientId}
                            onClick={handleSave}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
                          >
                            <Upload size={16} /> {saving ? "Uploading..." : "Upload Observation"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* History */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                       <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>History</h3>
                       <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                    </div>

                    {loading ? (
                      <div className="space-y-4">
                        {[1,2,3,4].map(i => <div key={i} className="skeleton-pulse" style={{ height: '100px', borderRadius: '12px' }}></div>)}
                      </div>
                    ) : observations.length === 0 ? (
                      <div className="empty-state">
                        <Database />
                        <h3>No Observations</h3>
                        <p>Upload an observation to start building this history.</p>
                      </div>
                    ) : (
                      <div className="space-y-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '8px' }}>
                        {observations.map(item => (
                          <div key={item.id} className="doctor-card" style={{ cursor: 'default', padding: '20px', borderLeft: item.abnormalFlag ? '3px solid var(--tct-coral)' : '3px solid var(--tct-teal)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                              
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>{translateDisplayText(language, item.metricName)}</h4>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                    <span style={{ fontSize: '18px', fontWeight: '700', color: item.abnormalFlag ? 'var(--tct-coral)' : '#FFFFFF' }}>{item.metricValue}</span>
                                    {item.unit && <span style={{ fontSize: '12px', color: 'var(--tct-text-muted)' }}>{item.unit}</span>}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--tct-text-secondary)' }}>
                                  <span>{translateDisplayText(language, item.observationType)}</span>
                                  <span style={{ opacity: 0.3 }}>|</span>
                                  <span>{new Date(item.measuredAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                
                                {item.notes && (
                                  <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                                    <LocalizedText as="p" style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: '1.4' }} value={item.notes} />
                                  </div>
                                )}
                              </div>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '600', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                                  {translateDisplayText(language, item.source)}
                                </span>
                                {item.abnormalFlag && (
                                  <span style={{ fontSize: '11px', fontWeight: '700', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--tct-coral)', padding: '4px 8px', borderRadius: '4px' }}>
                                    ABNORMAL
                                  </span>
                                )}
                              </div>
                              
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

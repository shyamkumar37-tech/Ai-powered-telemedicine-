import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { createTriage, fetchTriageHistory } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { emitTriageUpdated } from "../utils/appEvents";
import { buildLoginRedirect } from "../utils/authSession";
import { logAsyncFailure, runWithRequestTimeout } from "../utils/requestLifecycle";
import "./patient-triage-override.css";
import {
  LayoutDashboard, CalendarDays, Stethoscope, CalendarPlus, ClipboardList, Pill, Bell,
  Heart, Activity, BookOpen, Route, Eye, Folder, User, LogOut, MessageSquare, CheckCircle2,
  Edit3, ShieldCheck, AlertTriangle, RefreshCw, Link as LinkIcon, ShieldAlert,
  Zap, BrainCircuit, HelpCircle, History, Stethoscope as RoutineIcon, Sparkles
} from "lucide-react";
import PatientSidebar from "../components/PatientSidebar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import HumanBodyModel from "../components/triage/HumanBodyModel";

// Mock removed
export default function TriagePage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t } = useLanguage() || { language: "en", t: (k) => k };
  const patientId = auth?.profileId;

  const [form, setForm] = useState({
    patientId,
    symptoms: "I've had a severe headache and nausea since yesterday morning.",
    symptomDurationDays: 1,
    chestPain: true,
    severeBreathlessness: false,
    fainting: false,
    temperature: 99.4,
    persistentHighFever: false
  });
  
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("All");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ symptoms: "" });

  useEffect(() => {
    setForm((current) => ({ ...current, patientId }));
  }, [patientId]);

  const loadHistory = async ({ suppressError = false, signal } = {}) => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await runWithRequestTimeout(
        (requestSignal) => fetchTriageHistory(patientId, { signal: requestSignal }),
        { signal }
      );
      setHistory(data);
    } catch (err) {
      logAsyncFailure("triage:history", err, { patientId });
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadHistory({ signal: controller.signal });
    return () => controller.abort();
  }, [patientId]);

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };

  const navigator = useMemo(() => {
    if (!form.symptoms.trim() && !form.chestPain && !form.severeBreathlessness && !form.fainting && !form.persistentHighFever) {
      return null;
    }
    const flags = [];
    if (form.chestPain || form.severeBreathlessness || form.fainting) {
      flags.push("Emergency indicators detected. Seek urgent medical review.");
    }
    if (Number(form.temperature) && Number(form.temperature) >= 101) {
      flags.push("High temperature reported. Monitor closely and hydrate.");
    }
    if (form.persistentHighFever) {
      flags.push("Persistent fever noted. Escalate if symptoms worsen.");
    }
    if (Number(form.symptomDurationDays) >= 7) {
      flags.push("Symptoms lasting more than a week. Schedule follow-up.");
    }
    const questions = [
      "When did the symptoms start and what changed recently?",
      "Is the discomfort getting worse, better, or staying the same?",
      "Any medications already taken or missed?",
      "Any recent exposure to illness or travel?"
    ];
    return {
      summary: "Use this guided checklist to prepare your triage details.",
      flags,
      questions,
      disclaimer: "This guidance supports triage and does not replace a clinician."
    };
  }, [form]);

  const parseTriageLevel = (rawLevel) => {
    const levelStr = String(rawLevel).toUpperCase();
    if (levelStr.includes("EMERGENCY")) return { label: "EMERGENCY", type: "emergency" };
    if (levelStr.includes("URGENT")) return { label: "URGENT", type: "urgent" };
    return { label: "ROUTINE", type: "routine" };
  };

  // Ensure we sort history so newest is first
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => new Date(b.assessedAt) - new Date(a.assessedAt));
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (filter === "All") return sortedHistory;
    return sortedHistory.filter(item => {
      const lvl = parseTriageLevel(item.level);
      return lvl.label.toLowerCase() === filter.toLowerCase();
    });
  }, [sortedHistory, filter]);

  const groupedHistory = useMemo(() => {
    const today = [];
    const yesterday = [];
    const earlier = [];
    
    const now = new Date();
    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Start of yesterday
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    
    filteredHistory.forEach(item => {
      const date = new Date(item.assessedAt);
      if (date >= startOfToday) {
        today.push(item);
      } else if (date >= startOfYesterday && date < startOfToday) {
        yesterday.push(item);
      } else {
        earlier.push(item);
      }
    });
    return { today, yesterday, earlier };
  }, [filteredHistory]);

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  };

  return (
    <div id="tct-root">
      <div className="app">
        <PatientSidebar />

        <main id="page-main" role="main">
          <div className="topbar tct-animate-in">
            <div>
              <h1 className="serif">Smart symptom triage</h1>
              <p>Evaluate your symptoms and receive clinical guidance instantly.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <Stethoscope />Care
              </div>
              <div className="signed-in" style={{ marginTop: '12px', marginLeft: '8px' }}>
                <User />
                Signed in as {auth?.fullName || "Anita Patient"} · QA account
              </div>
            </div>
            <div className="topbar-right">
              <LanguageSwitcher customClass="lang" hideLabel />
              <button className="btn-ghost" onClick={handleLogout} aria-label="Log out">
                <LogOut />Logout
              </button>
            </div>
          </div>

          <div className="triage-layout">
            
            {/* LEFT COLUMN: THE FORM */}
            <div className="panel tct-animate-in tct-delay-1">
              <h2 className="panel-title serif"><Activity />Clinical Intake</h2>
              
              <div className="mb-6">
                <HumanBodyModel onPartClick={(part) => {
                  setForm(prev => ({ 
                    ...prev, 
                    symptoms: prev.symptoms ? `${prev.symptoms} Pain in ${part}.` : `Pain in ${part}.` 
                  }));
                  if (fieldErrors.symptoms) setFieldErrors({ symptoms: "" });
                }} />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" htmlFor="symptoms">Describe your primary symptoms</label>
                <textarea 
                  id="symptoms"
                  className="form-input" 
                  rows="3" 
                  placeholder="e.g., I've had a severe headache and nausea since yesterday morning."
                  value={form.symptoms}
                  onChange={(e) => {
                    setForm({ ...form, symptoms: e.target.value });
                    if (fieldErrors.symptoms) setFieldErrors({ symptoms: "" });
                  }}
                  aria-invalid={!!fieldErrors.symptoms}
                />
                {fieldErrors.symptoms && <p className="text-sm" style={{ color: 'var(--tct-coral)', marginTop: '4px' }}>{fieldErrors.symptoms}</p>}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="duration">Duration (Days)</label>
                  <input id="duration" type="number" className="form-input" min="1" value={form.symptomDurationDays} onChange={(e) => setForm({ ...form, symptomDurationDays: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="temp">Temperature (°F)</label>
                  <input id="temp" type="number" className="form-input" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} />
                </div>
              </div>

              <h3 className="form-label" style={{ marginBottom: '16px' }}>Select any severe symptoms that apply</h3>
              <div className="chip-grid">
                <label className="chip-label">
                  <input type="checkbox" checked={form.chestPain} onChange={(e) => setForm({ ...form, chestPain: e.target.checked })} />
                  <div className="chip">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div className="chip-icon"></div>Chest pain</span>
                  </div>
                </label>
                <label className="chip-label">
                  <input type="checkbox" checked={form.severeBreathlessness} onChange={(e) => setForm({ ...form, severeBreathlessness: e.target.checked })} />
                  <div className="chip">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div className="chip-icon"></div>Severe breathlessness</span>
                  </div>
                </label>
                <label className="chip-label">
                  <input type="checkbox" checked={form.fainting} onChange={(e) => setForm({ ...form, fainting: e.target.checked })} />
                  <div className="chip">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div className="chip-icon"></div>Fainting / dizziness</span>
                  </div>
                </label>
                <label className="chip-label">
                  <input type="checkbox" checked={form.persistentHighFever} onChange={(e) => setForm({ ...form, persistentHighFever: e.target.checked })} />
                  <div className="chip">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div className="chip-icon"></div>Persistent high fever</span>
                  </div>
                </label>
              </div>

              {error && (
                <div style={{ padding: '16px', background: 'rgba(226,96,79,0.1)', border: '1px solid var(--tct-coral)', borderRadius: '8px', marginBottom: '24px', color: 'var(--tct-coral)', fontSize: '14px' }}>
                  <ShieldAlert size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/>
                  {error}
                </div>
              )}

              {result && (
                <div style={{ padding: '20px', background: 'var(--tct-teal-dim)', border: '1px solid rgba(79,179,160,0.3)', borderRadius: '12px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <CheckCircle2 style={{ color: 'var(--tct-teal)' }}/>
                    <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--tct-text-primary)' }}>Triage Complete</span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--tct-text-primary)', lineHeight: '1.5' }}>{result.recommendation}</p>
                </div>
              )}

              <button 
                className="btn-teal" 
                disabled={submitting}
                onClick={async () => {
                  if (!form.symptoms.trim()) {
                    setFieldErrors({ symptoms: "Symptoms are required to run triage." });
                    return;
                  }
                  setSubmitting(true);
                  setError("");
                  try {
                    const data = await createTriage({
                      ...form,
                      symptoms: form.symptoms.trim(),
                      symptomDurationDays: Number(form.symptomDurationDays),
                      oxygenLevel: 98,
                      temperature: Number(form.temperature)
                    });
                    setResult(data);
                    setHistory((current) => [data, ...current.filter((item) => item.id !== data.id)]);
                    emitTriageUpdated();
                  } catch (err) {
                    setError(getApiErrorMessage(err, "Triage submission failed."));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <Sparkles size={18} /> {submitting ? "Evaluating..." : "Evaluate triage"}
              </button>
            </div>

            {/* RIGHT COLUMN: AI NAVIGATOR */}
            <div className="panel ai-panel tct-animate-in tct-delay-2">
              <h2 className="panel-title serif"><BrainCircuit />AI symptom navigator</h2>
              {navigator ? (
                <div className="ai-body">
                  <p>{navigator.summary}</p>
                  
                  {navigator.flags.length > 0 && (
                    <div className="ai-flags">
                      {navigator.flags.map((flag, idx) => (
                        <p key={idx}><AlertTriangle size={16} /> {flag}</p>
                      ))}
                    </div>
                  )}

                  <p style={{ fontWeight: '600', color: 'var(--tct-text-primary)', marginBottom: '12px' }}>Consider discussing:</p>
                  <ul className="ai-questions">
                    {navigator.questions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>

                  <p style={{ fontSize: '12px', marginTop: '24px', opacity: 0.8 }}>{navigator.disclaimer}</p>
                </div>
              ) : (
                <div className="ai-empty">
                  <div className="ai-empty-icon"><HelpCircle size={24} /></div>
                  <p>Enter your symptoms and select<br/>'Evaluate triage' to receive a guided<br/>assessment and risk profile here.</p>
                </div>
              )}
            </div>
          </div>

          {/* HISTORY SECTION */}
          <div className="history-panel tct-animate-in tct-delay-2" role="region" aria-label="Triage History">
            
            <div className="history-head">
              <h2 className="serif"><History /> Triage history</h2>
              <div className="filter-pills">
                {['All', 'Routine', 'Urgent', 'Emergency'].map(f => (
                  <button 
                    key={f}
                    className={`fpill ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="history-list">
                {[1,2,3].map(i => (
                  <div key={i} className="history-strip">
                     <div className="skeleton-block" style={{ width: '44px', height: '44px', borderRadius: '10px' }}></div>
                     <div style={{ flex: 1 }}>
                       <div className="skeleton-block" style={{ width: '200px', height: '18px', marginBottom: '8px' }}></div>
                       <div className="skeleton-block" style={{ width: '150px', height: '14px' }}></div>
                     </div>
                  </div>
                ))}
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="empty-state-list">
                <History />
                <h3>No history found</h3>
                <p>You haven't completed any triage assessments in this category.</p>
              </div>
            ) : (
              <>
                {groupedHistory.today.length > 0 && (
                  <div className="history-group">
                    <div className="group-label">TODAY</div>
                    <div className="history-list">
                      {groupedHistory.today.map(item => {
                        const lvl = parseTriageLevel(item.level);
                        return (
                          <div key={item.id} className={`history-strip ${lvl.type === 'emergency' ? 'emergency-row' : ''}`}>
                            <div className={`hs-icon ${lvl.type}`}>
                              {lvl.type === 'emergency' ? <AlertTriangle /> : lvl.type === 'urgent' ? <Zap /> : <RoutineIcon />}
                            </div>
                            <div className="hs-body">
                              <div className="hs-title-row">
                                <span className="hs-title">{item.symptoms}</span>
                                <span className={`hs-badge ${lvl.type}`}>{lvl.label}</span>
                              </div>
                              <div className="hs-sub">{item.recommendation}</div>
                            </div>
                            <div className="hs-time mono">{formatTime(item.assessedAt)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {groupedHistory.yesterday.length > 0 && (
                  <div className="history-group">
                    <div className="group-label">YESTERDAY</div>
                    <div className="history-list">
                      {groupedHistory.yesterday.map(item => {
                        const lvl = parseTriageLevel(item.level);
                        return (
                          <div key={item.id} className={`history-strip ${lvl.type === 'emergency' ? 'emergency-row' : ''}`}>
                            <div className={`hs-icon ${lvl.type}`}>
                              {lvl.type === 'emergency' ? <AlertTriangle /> : lvl.type === 'urgent' ? <Zap /> : <RoutineIcon />}
                            </div>
                            <div className="hs-body">
                              <div className="hs-title-row">
                                <span className="hs-title">{item.symptoms}</span>
                                <span className={`hs-badge ${lvl.type}`}>{lvl.label}</span>
                              </div>
                              <div className="hs-sub">{item.recommendation}</div>
                            </div>
                            <div className="hs-time mono">{formatTime(item.assessedAt)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {groupedHistory.earlier.length > 0 && (
                  <div className="history-group">
                    <div className="group-label">EARLIER THIS WEEK</div>
                    <div className="history-list">
                      {groupedHistory.earlier.map(item => {
                        const lvl = parseTriageLevel(item.level);
                        return (
                          <div key={item.id} className={`history-strip ${lvl.type === 'emergency' ? 'emergency-row' : ''}`}>
                            <div className={`hs-icon ${lvl.type}`}>
                              {lvl.type === 'emergency' ? <AlertTriangle /> : lvl.type === 'urgent' ? <Zap /> : <RoutineIcon />}
                            </div>
                            <div className="hs-body">
                              <div className="hs-title-row">
                                <span className="hs-title">{item.symptoms}</span>
                                <span className={`hs-badge ${lvl.type}`}>{lvl.label}</span>
                              </div>
                              <div className="hs-sub">{item.recommendation}</div>
                            </div>
                            <div className="hs-time mono">{formatTime(item.assessedAt)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

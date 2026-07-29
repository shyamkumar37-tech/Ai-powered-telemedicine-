import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { createTriage, fetchTriageHistory } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { emitTriageUpdated } from "../utils/appEvents";
import { buildLoginRedirect } from "../utils/authSession";
import { logAsyncFailure, runWithRequestTimeout } from "../utils/requestLifecycle";
import {
  Stethoscope,
  User,
  LogOut,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Zap,
  BrainCircuit,
  HelpCircle,
  History,
  Sparkles,
  Activity,
  Check,
  Circle,
  Stethoscope as RoutineIcon
} from "lucide-react";
import PatientSidebar from "../components/PatientSidebar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import HumanBodyModel from "../components/triage/HumanBodyModel";
import SymptomTrendsPanel from "../components/patient/SymptomTrendsPanel";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function TriagePage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t } = useLanguage() || { language: "en", t: (k: DynamicStateObject) => k };
  const patientId = auth?.profileId;

  const [form, setForm] = useState<DynamicState>({
    patientId,
    symptoms: "I've had a severe headache and nausea since yesterday morning.",
    symptomDurationDays: 1,
    chestPain: true,
    severeBreathlessness: false,
    fainting: false,
    temperature: 99.4,
    persistentHighFever: false
  });
  
  const [history, setHistory] = useState<DynamicStateObject[]>([]);
  const [filter, setFilter] = useState<DynamicState>("All");
  const [result, setResult] = useState<DynamicStateObject | null>(null);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [submitting, setSubmitting] = useState<DynamicState>(false);
  const [error, setError] = useState<DynamicState>("");
  const [fieldErrors, setFieldErrors] = useState<DynamicState>({ symptoms: "" });

  useEffect(() => {
    setForm((current: DynamicStateObject) => ({ ...current, patientId }));
  }, [patientId]);
  const loadHistory = async ({ suppressError = false, signal }: { suppressError?: boolean, signal?: AbortSignal } = {}) => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await runWithRequestTimeout(
        (requestSignal: DynamicStateObject) => fetchTriageHistory(patientId, { signal: requestSignal }),
        { signal }
      );
      setHistory(data);
    } catch (err: DynamicStateObject) {
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
    const flags: DynamicStateObject = [];
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

  const parseTriageLevel = (rawLevel: DynamicStateObject) => {
    const levelStr = String(rawLevel).toUpperCase();
    if (levelStr.includes("EMERGENCY")) return { label: "EMERGENCY", type: "emergency" };
    if (levelStr.includes("URGENT")) return { label: "URGENT", type: "urgent" };
    return { label: "ROUTINE", type: "routine" };
  };

  const sortedHistory = useMemo(() => {
    return [...history].sort((a: DynamicStateObject, b: DynamicStateObject) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime());
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (filter === "All") return sortedHistory;
    return sortedHistory.filter((item: DynamicStateObject) => {
      const lvl = parseTriageLevel(item.level);
      return lvl.label.toLowerCase() === filter.toLowerCase();
    });
  }, [sortedHistory, filter]);

  const groupedHistory = useMemo(() => {
    const today: DynamicStateObject = [];
    const yesterday: DynamicStateObject = [];
    const earlier: DynamicStateObject = [];
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    
    filteredHistory.forEach((item: DynamicStateObject) => {
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

  const formatTime = (isoString: boolean) => {
    return new Date((isoString as any)).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  };

  return (
    <div className="h-full w-full bg-canvas text-[var(--tc-text)] font-sans flex flex-col overflow-hidden lg:flex-row">
      <PatientSidebar />

      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 -1 p-6 lg:p-10 min-w-0" role="main">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeSlideUp">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">{t("smartSymptomTriage") || "Smart symptom triage"}</h1>
            <p className="text-ink-muted text-sm mb-3">{t("evaluateYourSymptomsAndReceiveClinicalGuidanceInstantly") || "Evaluate your symptoms and receive clinical guidance instantly."}</p>
            <div className="flex gap-2 items-center mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                <Stethoscope size={12} className="text-primary" />{t("care") || "Care"}</span>
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

        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6 mb-8">
          {/* LEFT COLUMN: THE FORM */}
          <div className="card-premium animate-fadeSlideUp" style={{animationDelay: '0.1s'}}>
            <h2 className="font-display text-xl font-medium mb-6 flex items-center gap-2">
              <Activity size={20} className="text-primary"/>{t("clinicalIntake") || "Clinical Intake"}</h2>
            
            <div className="mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
              <HumanBodyModel onPartClick={(part: DynamicStateObject) => {
                setForm((prev: DynamicStateObject) => ({ 
                  ...prev, 
                  symptoms: prev.symptoms ? `${prev.symptoms} Pain in ${part}.` : `Pain in ${part}.` 
                }));
                if (fieldErrors.symptoms) setFieldErrors({ symptoms: "" });
              }} />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-ink-muted mb-2" htmlFor="symptoms">{t("describeYourPrimarySymptoms") || "Describe your primary symptoms"}</label>
              <textarea 
                id="symptoms"
                className="w-full bg-white/5 border border-white/10 rounded-element p-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-ink-muted/50"
                rows={3} 
                placeholder="e.g., I've had a severe headache and nausea since yesterday morning."
                value={form.symptoms}
                onChange={(e: DynamicStateObject) => {
                  setForm({ ...form, symptoms: e.target.value });
                  if (fieldErrors.symptoms) setFieldErrors({ symptoms: "" });
                }}
                aria-invalid={!!fieldErrors.symptoms}
              />
              {fieldErrors.symptoms && <p className="text-sm text-alert mt-1">{fieldErrors.symptoms}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-2" htmlFor="duration">Duration (Days)</label>
                <input 
                  id="duration" 
                  type="number" 
                  className="w-full bg-white/5 border border-white/10 rounded-element p-3 text-ink font-mono focus:outline-none focus:ring-2 focus:ring-primary/50" 
                  min="1" 
                  value={form.symptomDurationDays} 
                  onChange={(e: DynamicStateObject) => setForm({ ...form, symptomDurationDays: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-2" htmlFor="temp">Temperature (°F)</label>
                <input 
                  id="temp" 
                  type="number" 
                  className="w-full bg-white/5 border border-white/10 rounded-element p-3 text-ink font-mono focus:outline-none focus:ring-2 focus:ring-primary/50" 
                  value={form.temperature} 
                  onChange={(e: DynamicStateObject) => setForm({ ...form, temperature: e.target.value })} 
                />
              </div>
            </div>

            <h3 className="text-sm font-medium text-ink-muted mb-3">{t("selectAnySevereSymptomsThatApply") || "Select any severe symptoms that apply"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                { id: 'chestPain', label: 'Chest pain' },
                { id: 'severeBreathlessness', label: 'Severe breathlessness' },
                { id: 'fainting', label: 'Fainting / dizziness' },
                { id: 'persistentHighFever', label: 'Persistent high fever' }
              ].map((symptom: DynamicStateObject) => (
                <label key={symptom.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${(form as DynamicStateObject)[symptom.id] ? 'bg-primary border-primary text-canvas' : 'border-white/20 group-hover:border-white/40'}`}>
                    {(form as DynamicStateObject)[symptom.id] && <Check size={12} strokeWidth={3} />}
                  </div>
                  <input type="checkbox" className="sr-only" checked={(form as DynamicStateObject)[symptom.id]} onChange={(e: DynamicStateObject) => setForm({ ...form, [symptom.id]: e.target.checked })} />
                  <span className="text-sm">{symptom.label}</span>
                </label>
              ))}
            </div>

            {error && (
              <div className="flex gap-2 p-4 bg-alert/10 border border-alert/30 rounded-element text-alert text-sm mb-6">
                <ShieldAlert size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="p-5 bg-primary/10 border border-primary/30 rounded-xl mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="text-primary" size={18} />
                  <span className="font-medium text-ink">{t("triageComplete") || "Triage Complete"}</span>
                </div>
                <p className="text-sm text-ink-muted leading-relaxed">{result.recommendation}</p>
              </div>
            )}

            <button 
              className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 text-base"
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
                  setHistory((current: DynamicStateObject) => [data, ...current.filter((item: DynamicStateObject) => item.id !== data.id)]);
                  emitTriageUpdated();
                } catch (err: DynamicStateObject) {
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
          <div className="card-premium ai-content animate-fadeSlideUp" style={{animationDelay: '0.2s'}}>
            <h2 className="font-display text-xl font-medium mb-6 flex items-center gap-2">
              <BrainCircuit size={20} className="text-live"/>{t("aISymptomNavigator") || "AI symptom navigator"}</h2>
            {navigator ? (
              <div>
                <p className="text-sm text-ink leading-relaxed mb-6">{navigator.summary}</p>
                
                {navigator.flags.length > 0 && (
                  <div className="flex flex-col gap-3 mb-6">
                    {navigator.flags.map((flag: DynamicStateObject, idx: DynamicStateObject) => (
                      <div key={idx} className="flex gap-2 items-start text-sm text-alert bg-alert/5 p-3 rounded-element border border-alert/20">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" /> 
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm font-medium mb-3">Consider discussing:</p>
                <ul className="flex flex-col gap-2 pl-2">
                  {navigator.questions.map((q: DynamicStateObject, idx: DynamicStateObject) => (
                    <li key={idx} className="flex gap-2 items-start text-sm text-ink-muted">
                      <Circle {...{} as DynamicStateObject} size={8} className="shrink-0 mt-1.5 text-primary fill-primary" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-ink-muted mt-8 italic border-t border-white/10 pt-4">{navigator.disclaimer}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 px-4 opacity-70">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-ink-muted mb-4">
                  <HelpCircle size={28} />
                </div>
                <p className="text-sm text-ink-muted leading-relaxed">
                  {t("enterYourSymptomsAndSelect") || "Enter your symptoms and select"}<br/>'Evaluate triage' to receive a guided<br/>assessment and risk profile here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SYMPTOM TRENDS SECTION */}
        {patientId && (
          <SymptomTrendsPanel patientId={patientId} />
        )}

        {/* HISTORY SECTION */}
        <div className="card-premium animate-fadeSlideUp" style={{animationDelay: '0.2s'}} role="region" aria-label="Triage History">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-white/10 pb-6">
            <h2 className="font-display text-xl font-medium flex items-center gap-2"><History size={20}/> {t("triageHistory") || "Triage history"}</h2>
            <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
              {['All', 'Routine', 'Urgent', 'Emergency'].map((f: DynamicStateObject) => (
                <button 
                  key={f}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-primary text-canvas shadow' : 'text-ink-muted hover:text-ink'}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-4">
              {[1,2,3].map((i: DynamicStateObject) => (
                <div key={i} className="flex gap-4 p-4 border border-white/5 rounded-xl bg-white/5 animate-pulse">
                   <div className="w-12 h-12 rounded-xl bg-white/10"></div>
                   <div className="flex-1">
                     <div className="h-5 w-1/3 bg-white/10 rounded mb-2"></div>
                     <div className="h-4 w-2/3 bg-white/10 rounded"></div>
                   </div>
                </div>
              ))}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <History size={40} className="text-ink-muted/30 mb-4" />
              <h3 className="font-display text-lg mb-2">{t("noHistoryFound") || "No history found"}</h3>
              <p className="text-sm text-ink-muted">{t("youHavenTCompletedAnyTriageAssessmentsInThisCategory") || "You haven't completed any triage assessments in this category."}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {[
                { label: 'TODAY', items: groupedHistory.today },
                { label: 'YESTERDAY', items: groupedHistory.yesterday },
                { label: 'EARLIER THIS WEEK', items: groupedHistory.earlier }
              ].map((group: DynamicStateObject) => group.items.length > 0 && (
                <div key={group.label}>
                  <div className="text-xs font-semibold text-ink-muted tracking-widest uppercase mb-4 pl-2">{group.label}</div>
                  <div className="flex flex-col gap-3">
                    {group.items.map((item: DynamicStateObject) => {
                      const lvl = parseTriageLevel(item.level);
                      const isEmergency = lvl.type === 'emergency';
                      const isUrgent = lvl.type === 'urgent';
                      
                      let Icon = RoutineIcon;
                      if (isEmergency) Icon = AlertTriangle;
                      if (isUrgent) Icon = Zap;

                      const iconBgClass = isEmergency ? 'bg-alert/10 text-alert border-alert/20' : isUrgent ? 'bg-[#C9A24B]/10 text-[#C9A24B] border-[#C9A24B]/20' : 'bg-primary/10 text-primary border-primary/20';
                      const badgeClass = isEmergency ? 'bg-alert text-canvas' : isUrgent ? 'bg-[#C9A24B] text-canvas' : 'bg-primary text-canvas';
                      const stripClass = isEmergency ? 'border-alert/30 bg-alert/5' : 'border-white/5 bg-white/5 hover:bg-white/10 transition-colors';

                      return (
                        <div key={item.id} className={`flex flex-col sm:flex-row gap-4 p-4 rounded-xl border ${stripClass}`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${iconBgClass}`}>
                            <Icon size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                              <span className="font-medium truncate">{item.symptoms}</span>
                              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>{lvl.label}</span>
                            </div>
                            <div className="text-sm text-ink-muted leading-relaxed">{item.recommendation}</div>
                          </div>
                          <div className="text-xs font-mono text-ink-muted whitespace-nowrap pt-1">
                            {formatTime(item.assessedAt)}
                          </div>
                        </div>
                      );
                    })}
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

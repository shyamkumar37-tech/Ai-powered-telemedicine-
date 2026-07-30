import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchIvrSessions, startIvrSession } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { formatDisplayValue } from "../utils/formatDisplayValue";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import { User, LogOut, PhoneCall, Calendar, CheckCircle, Clock, AlertTriangle, RefreshCw, Smartphone, ListCollapse } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function PatientIvrPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t, translateUiText = (value: string | number) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth?.profileId;
  
  const [sessions, setSessions] = useState<DynamicStateObject[]>([]);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [starting, setStarting] = useState<DynamicState>(false);
  const [error, setError] = useState<DynamicState>("");
  const [sessionsError, setSessionsError] = useState<DynamicState>("");
  const [message, setMessage] = useState<DynamicState>("");
  
  const [fieldErrors, setFieldErrors] = useState<DynamicState>({ appointmentDateTime: "", concernSummary: "" });
  const [form, setForm] = useState<DynamicState>({
    patientId,
    phoneNumber: auth?.phone || "",
    languageCode: language,
    serviceType: "APPOINTMENT",
    appointmentDateTime: "",
    mode: "TELECONSULTATION",
    concernSummary: ""
  });

  const lastAutoPhoneRef = useRef<DynamicState>(auth?.phone || "");
  const lastAutoLanguageRef = useRef<DynamicState>(language);
  const normalizeDateTimeInput = (value: string | number) => (value && (value as any).length === 16 ? `${value}:00` : value);

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
    } catch (err: DynamicStateObject) {
      setSessionsError(getApiErrorMessage(err, "Unable to load IVR sessions."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm((current: DynamicStateObject) => {
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
      setSessions((current: DynamicStateObject) => [created, ...current]);
      setMessage(created.appointmentId ? `IVR session created with appointment #${created.appointmentId}` : "IVR session completed.");
      setError("");
    } catch (err: DynamicStateObject) {
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
    <div className="h-full w-full bg-canvas text-[var(--tc-text)] font-sans flex flex-col overflow-hidden lg:flex-row">
      <PatientSidebar />
      
      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 p-6 lg:p-10 min-w-0" role="main">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeSlideUp">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">{t("iVRBooking") || "IVR Booking"}</h1>
            <p className="text-ink-muted text-sm mb-3">{t("scheduleAnAutomatedCallToBookYourNextAppointment") || "Schedule an automated call to book your next appointment."}</p>
            <div className="flex gap-2 items-center mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                <PhoneCall size={12} className="text-primary" />{t("support") || "Support"}</span>
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

        <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8 animate-fadeSlideUp" style={{animationDelay: '0.1s'}}>
          
          {/* New Booking Form */}
          <div className="flex flex-col">
            <div className="flex items-center gap-4 mb-6">
               <h3 className="font-display text-xl font-medium">{t("requestAutomatedCall") || "Request Automated Call"}</h3>
               <div className="flex-1 h-px bg-white/10"></div>
            </div>
            
            <div className="card-premium">
              <p className="text-sm text-ink-muted mb-6 leading-relaxed">
                {(t("iVRRequestsAreTrackedInsideTeleCareLiveTelephonyDeliveryDependsOnConfiguredVoiceProvidersAndCurrentConnectivity") || "IVR requests are tracked inside TeleCare+. Live telephony delivery depends on configured voice providers and current connectivity.")}
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-ink-muted mb-2">{t("phone") || "Phone"}</label>
                    <input 
                      type="text" 
                      value={form.phoneNumber} 
                      onChange={(e: DynamicStateObject) => setForm({...form, phoneNumber: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-element p-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-ink-muted mb-2">{t("language") || "Language"}</label>
                    <input 
                      type="text" 
                      value={form.languageCode} 
                      onChange={(e: DynamicStateObject) => setForm({...form, languageCode: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-element p-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" 
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-ink-muted mb-2">{t("serviceType") || "Service Type"}</label>
                    <select 
                      value={form.serviceType} 
                      onChange={(e: DynamicStateObject) => setForm({...form, serviceType: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-element p-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    >
                      <option value="APPOINTMENT" className="bg-surface">{t("appointment") || "Appointment"}</option>
                      <option value="PRESCRIPTION_STATUS" className="bg-surface">{t("prescription") || "Prescription"}</option>
                      <option value="MEDICATION_REMINDER" className="bg-surface">{t("medication") || "Medication"}</option>
                      <option value="EMERGENCY_SUPPORT" className="bg-surface">{t("emergency") || "Emergency"}</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-ink-muted mb-2">{t("mode") || "Mode"}</label>
                    <select 
                      value={form.mode} 
                      onChange={(e: DynamicStateObject) => setForm({...form, mode: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-element p-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    >
                      <option value="TELECONSULTATION" className="bg-surface">{t("teleconsultation") || "Teleconsultation"}</option>
                      <option value="FOLLOW_UP" className="bg-surface">{t("followUp") || "Follow Up"}</option>
                      <option value="IN_PERSON" className="bg-surface">{t("inPerson") || "In Person"}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-muted mb-2">{t("requestedTime") || "Requested Time"}</label>
                  <input 
                    type="datetime-local" 
                    value={form.appointmentDateTime} 
                    onChange={(e: DynamicStateObject) => {
                      setForm({...form, appointmentDateTime: e.target.value});
                      if (fieldErrors.appointmentDateTime) setFieldErrors((c: DynamicStateObject) => ({...c, appointmentDateTime: ""}));
                    }}
                    className={`w-full bg-white/5 border rounded-element p-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm ${fieldErrors.appointmentDateTime ? 'border-alert' : 'border-white/10'}`} 
                  />
                  {fieldErrors.appointmentDateTime && <p className="text-xs text-alert mt-1.5">{fieldErrors.appointmentDateTime}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-muted mb-2">{t("concernSummary") || "Concern Summary"}</label>
                  <textarea 
                    value={form.concernSummary} 
                    onChange={(e: DynamicStateObject) => {
                      setForm({...form, concernSummary: e.target.value});
                      if (fieldErrors.concernSummary) setFieldErrors((c: DynamicStateObject) => ({...c, concernSummary: ""}));
                    }}
                    className={`w-full h-[80px] p-3 bg-white/5 border rounded-element text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-y ${fieldErrors.concernSummary ? 'border-alert' : 'border-white/10'}`} 
                  />
                  {fieldErrors.concernSummary && <p className="text-xs text-alert mt-1.5">{fieldErrors.concernSummary}</p>}
                </div>
                
                {error && (
                  <div className="p-3 bg-alert/10 text-alert border border-alert/20 rounded-element text-sm mt-2">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-element text-sm flex items-center gap-2 mt-2 font-medium">
                    <CheckCircle size={16} /> {message}
                  </div>
                )}

                <button 
                  className="btn-primary w-full mt-2 py-3 flex justify-center" 
                  disabled={starting || !patientId} 
                  onClick={handleStart}
                >
                  {starting ? "Starting..." : "Start IVR Session"}
                </button>

              </div>
            </div>
          </div>

          {/* History List */}
          <div className="flex flex-col">
            <div className="flex items-center gap-4 mb-6">
               <h3 className="font-display text-xl font-medium">{t("recentSessions") || "Recent Sessions"}</h3>
               <div className="flex-1 h-px bg-white/10"></div>
            </div>
            
            {loading ? (
              <div className="flex flex-col gap-4">
                {[1,2].map((i: DynamicStateObject) => <div key={i} className="card-premium h-32 animate-pulse bg-white/5"></div>)}
              </div>
            ) : sessionsError ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-alert/5 border border-alert/20 rounded-xl">
                <AlertTriangle size={32} className="text-alert mb-4" />
                <h3 className="font-display text-lg mb-2">{t("unableToLoadIVRHistory") || "Unable to load IVR history"}</h3>
                <p className="text-sm text-ink-muted mb-6">{sessionsError}</p>
                <button className="px-4 py-2 border border-white/20 rounded-element text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2" onClick={load}>
                  <RefreshCw size={16} /> {t("retry") || "Retry"}</button>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed">
                <Smartphone size={48} className="text-ink-muted/30 mb-4" />
                <h3 className="font-display text-lg mb-2">{t("noIVRSessions") || "No IVR Sessions"}</h3>
                <p className="text-sm text-ink-muted max-w-sm">{t("iVRBookingActivityWillAppearHereOnceAutomatedCallsAreRequested") || "IVR booking activity will appear here once automated calls are requested."}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {sessions.map((session: DynamicStateObject) => (
                  <div key={session.id} className="card-premium !bg-surface hover:border-white/20 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5 pb-5 border-b border-white/10">
                      <div>
                        {/* Show "Dr. [Name]" if available in transcript, else just use the service type as the primary header */}
                        <h4 className="text-base font-medium flex items-center gap-2 mb-1.5">
                          {session.doctorName ? session.doctorName : (translateDisplayText(language, session.serviceType) || formatDisplayValue(session.serviceType))}
                        </h4>
                        <p className="text-sm text-ink-muted flex flex-wrap items-center gap-2 font-mono">
                          <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(session.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="opacity-50">•</span>
                          <span className="flex items-center gap-1"><Clock size={14} /> {new Date(session.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                        </p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold tracking-wider uppercase border ${session.status === 'COMPLETED' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white/5 text-ink-muted border-white/10'}`}>
                        {translateDisplayText(language, session.status) || formatDisplayValue(session.status)}
                      </span>
                    </div>
                    
                    <div className="bg-white/5 p-4 rounded-xl border-l-4 border-primary">
                      <p className="text-sm leading-relaxed text-ink-muted italic">"{session.transcriptSummary}"</p>
                      {session.appointmentId && (
                        <p className="mt-3 text-sm font-semibold text-primary font-mono bg-primary/10 inline-block px-2 py-1 rounded">
                          Appointment ID: {session.appointmentId}
                        </p>
                      )}
                    </div>
                    
                    {!!session.prompts?.length && (
                      <details className="mt-5 text-sm text-ink-muted">
                        <summary className="cursor-pointer outline-none select-none inline-flex items-center gap-2 hover:text-ink transition-colors font-medium">
                          <ListCollapse size={16} /> View raw call script ({session.prompts.length} prompts)
                        </summary>
                        <div className="mt-4 flex flex-col gap-2 pl-3 border-l-2 border-white/10">
                          {session.prompts.map((prompt: DynamicStateObject, idx: DynamicStateObject) => (
                            <p key={idx} className="text-xs text-ink-muted/80 leading-relaxed font-mono">"{prompt}"</p>
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
      </main>
    </div>
  );
}

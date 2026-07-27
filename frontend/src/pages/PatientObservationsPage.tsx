import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LocalizedText from "../components/LocalizedText";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { createPatientObservation, fetchPatientObservations } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import { User, LogOut, Activity, Upload, Database } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function PatientObservationsPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t, translateUiText = (value: string | number) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth?.profileId;
  
  const [observations, setObservations] = useState<DynamicStateObject[]>([]);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [saving, setSaving] = useState<DynamicState>(false);
  const [error, setError] = useState<DynamicState>("");
  const [message, setMessage] = useState<DynamicState>("");
  const [form, setForm] = useState<DynamicState>({
    source: "LAB_REPORT",
    observationType: "",
    metricName: "",
    metricValue: "",
    unit: "",
    abnormalFlag: false,
    notes: "",
    measuredAt: ""
  });

  const normalizeDateTimeInput = (value: string | number) => {
    if (!value) return value;
    // @ts-expect-error - Auto-suppressed during migration
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
    } catch (err: DynamicStateObject) {
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
      
      setObservations((current: DynamicStateObject) => [created, ...current]);
      setMessage("Observation saved successfully.");
      setForm((c: DynamicStateObject) => ({
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
    } catch (err: DynamicStateObject) {
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
    <div className="h-full w-full bg-canvas text-[var(--tc-text)] font-sans flex flex-col overflow-hidden lg:flex-row">
      <PatientSidebar />
      
      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 -1 p-6 lg:p-10 min-w-0" role="main">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeSlideUp">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">{t("smartObservations") || "Smart Observations"}</h1>
            <p className="text-ink-muted text-sm mb-3">{t("manualAndDeviceSyncedVitalsAndHealthMetrics") || "Manual and device-synced vitals and health metrics."}</p>
            <div className="flex gap-2 items-center mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                <Activity size={12} className="text-primary" />{t("health") || "Health"}</span>
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
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-8">
            
            {/* Upload Form */}
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                 <h3 className="font-display text-xl font-medium">{t("uploadObservation") || "Upload Observation"}</h3>
                 <div className="flex-1 h-px bg-white/10"></div>
              </div>

              <div className="card-premium !bg-surface h-full flex flex-col">
                <p className="text-sm text-ink-muted leading-relaxed mb-6">
                  {t("labAndWearableEntriesAreCapturedManuallyHereUnlessALiveVendorIntegrationIsConnected") || "Lab and wearable entries are captured manually here unless a live vendor integration is connected."}</p>

                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("source") || "Source"}</label>
                      <select 
                        value={form.source} 
                        onChange={(e: DynamicStateObject) => setForm({...form, source: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors"
                      >
                        {sourceOptions.map((opt: DynamicStateObject) => <option key={opt.value} value={opt.value} className="bg-canvas">{opt.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("measuredAt") || "Measured At"}</label>
                      <input 
                        type="datetime-local" 
                        value={form.measuredAt} 
                        onChange={(e: DynamicStateObject) => setForm({...form, measuredAt: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors [color-scheme:dark]" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("observationType") || "Observation Type"}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Vitals, Blood Test"
                      value={form.observationType} 
                      onChange={(e: DynamicStateObject) => setForm({...form, observationType: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors placeholder:text-ink-muted/30" 
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("metric") || "Metric"}</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Heart Rate"
                        value={form.metricName} 
                        onChange={(e: DynamicStateObject) => setForm({...form, metricName: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors placeholder:text-ink-muted/30" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("value") || "Value"}</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 72"
                        value={form.metricValue} 
                        onChange={(e: DynamicStateObject) => setForm({...form, metricValue: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors placeholder:text-ink-muted/30" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("unit") || "Unit"}</label>
                      <input 
                        type="text" 
                        placeholder="bpm"
                        value={form.unit} 
                        onChange={(e: DynamicStateObject) => setForm({...form, unit: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors placeholder:text-ink-muted/30" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("notes") || "Notes"}</label>
                    <textarea 
                      value={form.notes} 
                      placeholder="Any context or conditions?"
                      onChange={(e: DynamicStateObject) => setForm({...form, notes: e.target.value})}
                      className="w-full h-[100px] p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors resize-y placeholder:text-ink-muted/30" 
                    />
                  </div>

                  <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border transition-colors ${form.abnormalFlag ? 'bg-alert/10 border-alert/30' : 'bg-alert/5 border-transparent hover:bg-alert/10'}`}>
                    <input 
                      type="checkbox" 
                      checked={form.abnormalFlag} 
                      onChange={(e: DynamicStateObject) => setForm({...form, abnormalFlag: e.target.checked})}
                      className="w-5 h-5 accent-alert cursor-pointer rounded border-alert/50 bg-white/5"
                    />
                    <span className={`text-sm font-medium ${form.abnormalFlag ? 'text-alert' : 'text-ink-muted'}`}>{t("flagAsAbnormal") || "Flag as Abnormal"}</span>
                  </label>
                  
                  <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      {message && <p className="text-sm font-medium text-primary animate-fadeIn">{message}</p>}
                      {error && <p className="text-sm font-medium text-alert animate-fadeIn">{error}</p>}
                    </div>
                    <button 
                      className="btn-primary py-2.5 px-5 flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" 
                      disabled={saving || !patientId}
                      onClick={handleSave}
                    >
                      <Upload size={18} className={saving ? "animate-bounce" : ""} /> {saving ? "Uploading..." : "Upload Observation"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* History */}
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                 <h3 className="font-display text-xl font-medium">{t("history") || "History"}</h3>
                 <div className="flex-1 h-px bg-white/10"></div>
              </div>

              {loading ? (
                <div className="flex flex-col gap-4">
                  {[1,2,3,4].map((i: DynamicStateObject) => <div key={i} className="card-premium h-32 animate-pulse bg-white/5"></div>)}
                </div>
              ) : observations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed h-[300px]">
                  <Database size={48} className="text-ink-muted/30 mb-4" />
                  <h3 className="font-display text-lg mb-2">{t("noObservations") || "No Observations"}</h3>
                  <p className="text-sm text-ink-muted max-w-[250px]">{t("uploadAnObservationToStartBuildingThisHistory") || "Upload an observation to start building this history."}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-h-[calc(100vh-200px)] pr-2 scrollbar-hide">
                  {observations.map((item: DynamicStateObject) => (
                    <div key={item.id} className={`card-premium !bg-surface border-l-4 hover:border-white/20 transition-colors ${item.abnormalFlag ? 'border-l-alert' : 'border-l-primary'}`}>
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h4 className="text-lg font-medium text-ink">{translateDisplayText(language, item.metricName)}</h4>
                            <div className="flex items-baseline gap-1.5">
                              <span className={`text-2xl font-display font-medium ${item.abnormalFlag ? 'text-alert' : 'text-ink'}`}>{item.metricValue}</span>
                              {item.unit && <span className="text-sm text-ink-muted">{item.unit}</span>}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm text-ink-muted/80">
                            <span>{translateDisplayText(language, item.observationType)}</span>
                            <span className="w-1 h-1 rounded-full bg-ink-muted/30"></span>
                            <span>{new Date(item.measuredAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          
                          {item.notes && (
                            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                              <LocalizedText as="p" className="text-sm text-ink/90 leading-relaxed" value={item.notes} />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-ink-muted whitespace-nowrap">
                            {translateDisplayText(language, item.source)}
                          </span>
                          {item.abnormalFlag && (
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-alert/10 border border-alert/20 text-alert px-2.5 py-1 rounded-md">
                              {t("aBNORMAL") || "ABNORMAL"}</span>
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
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { createHealthRecord, fetchHealthRecords, fetchHealthSummary } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { useToast } from "../components/ui/ToastProvider";
import PatientSidebar from "../components/PatientSidebar";
import { User, LogOut, Heart, AlertTriangle, CalendarDays, Stethoscope, Save, Bluetooth } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function PatientHealthPage() {
  const { auth, logout } = useAuth();
  const { language, t } = useLanguage();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const patientId = auth?.profileId;
  
  const [records, setRecords] = useState<DynamicStateObject[]>([]);
  const [form, setForm] = useState<DynamicState>({
    patientId,
    bloodPressure: "",
    sugar: "",
    weight: "",
    spo2: "",
    pulse: "",
    temperature: ""
  });
  const [isPairing, setIsPairing] = useState<DynamicState>(false);

  const [loading, setLoading] = useState<DynamicState>(true);
  const [saving, setSaving] = useState<DynamicState>(false);
  const [error, setError] = useState<DynamicState>("");
  const [summary, setSummary] = useState<DynamicStateObject | null>(null);

  const fieldUnits = {
    bloodPressure: "mmHg",
    sugar: "mg/dL",
    weight: "kg",
    spo2: "%",
    pulse: "bpm",
    temperature: "°F"
  };

  const fieldLabels = {
    bloodPressure: "Blood Pressure",
    sugar: "Blood Sugar",
    weight: "Weight",
    spo2: "SpO2 (Oxygen)",
    pulse: "Pulse Rate",
    temperature: "Temperature"
  };

  useEffect(() => {
    if (patientId) setForm((current: DynamicStateObject) => ({ ...current, patientId }));
  }, [patientId]);

  const load = async ({ suppressError = false } = {}) => {
    if (!patientId) {
      if (!suppressError) setError("Unable to load health records.");
      setRecords([]);
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchHealthRecords(patientId);
      const trendSummary = await fetchHealthSummary(patientId);
      setRecords(data);
      setSummary(trendSummary);
      if (!suppressError) setError("");
    } catch (err: DynamicStateObject) {
      if (!suppressError) setError(getApiErrorMessage(err, "Unable to load health records."));
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
    <div className="h-full w-full bg-canvas text-[var(--tc-text)] font-sans flex flex-col overflow-hidden lg:flex-row">
      <PatientSidebar />
      
      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 -1 p-6 lg:p-10 min-w-0" role="main">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeSlideUp">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">{t("healthVitals") || "Health Vitals"}</h1>
            <p className="text-ink-muted text-sm mb-3">{t("logYourDailyReadingsAndMonitorYourHealthTrends") || "Log your daily readings and monitor your health trends."}</p>
            <div className="flex gap-2 items-center mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                <Heart size={12} className="text-primary" />{t("health") || "Health"}</span>
              <div className="inline-flex items-center gap-2 text-xs text-ink-muted bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <User size={14} />
                Signed in as {auth?.fullName || "Anita Patient"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher hideLabel />
            
            <button 
              className="inline-flex items-center gap-2 px-4 py-2 bg-transparent text-ink border border-white/20 rounded-element text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
              onClick={async () => {
                // @ts-expect-error - Auto-suppressed during migration
                if (!navigator.bluetooth) {
                  alert("Web Bluetooth API is not available in this browser.");
                  return;
                }
                setIsPairing(true);
                try {
                  // @ts-expect-error - Auto-suppressed during migration
                  const device = await navigator.bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: ['heart_rate']
                  });
                  console.log("Paired with", device.name);
                  alert("Successfully paired with wearable device: " + device.name);
                } catch (err: DynamicStateObject) {
                  console.error("Bluetooth pairing failed", err);
                } finally {
                  setIsPairing(false);
                }
              }}
              disabled={isPairing}
            >
              <Bluetooth size={16} className={isPairing ? "animate-pulse text-[#60A5FA]" : ""} />
              {isPairing ? "Pairing..." : "Sync Wearable"}
            </button>
            
            <button 
              onClick={handleLogout} 
              aria-label="Log out"
              className="inline-flex items-center gap-2 px-4 py-2 bg-transparent text-ink-muted border border-white/10 rounded-element text-sm font-medium hover:bg-white/5 hover:text-ink transition-colors"
            >
              <LogOut size={16} />{t("logout") || "Logout"}</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 animate-fadeSlideUp" style={{animationDelay: '0.1s'}}>
          
          {/* Left Panel: Log New Reading */}
          <div className="flex flex-col">
            <h2 className="font-display text-xl font-medium mb-6">{t("logNewReading") || "Log New Reading"}</h2>
            
            <div className="card-premium h-fit">
              <div className="grid grid-cols-2 gap-5">
                {Object.keys(form).filter((k: DynamicStateObject) => k !== "patientId").map((key: DynamicStateObject) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-ink-muted mb-2">
                      {(fieldLabels as DynamicStateObject)[key]}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={(form as DynamicStateObject)[key]}
                        onChange={(e: DynamicStateObject) => setForm({ ...form, [key]: e.target.value })}
                        placeholder={`0.0`}
                        className="w-full bg-white/5 border border-white/10 rounded-element py-3 pl-4 pr-14 text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-ink-muted/50 font-mono text-sm"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted text-xs font-medium uppercase tracking-wider">
                        {(fieldUnits as DynamicStateObject)[key]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {error && <p className="text-alert text-sm mt-4 p-3 bg-alert/10 border border-alert/20 rounded-element">{error}</p>}
              
              <button
                className="btn-primary w-full mt-6 flex justify-center py-3"
                disabled={saving || !patientId}
                onClick={async () => {
                  if (!patientId) {
                    setError("Unable to save health reading.");
                    return;
                  }
                  setError("");
                  setSaving(true);
                  try {
                    const response = await createHealthRecord({
                      ...form,
                      sugar: form.sugar ? Number(form.sugar) : null,
                      weight: form.weight ? Number(form.weight) : null,
                      spo2: form.spo2 ? Number(form.spo2) : null,
                      pulse: form.pulse ? Number(form.pulse) : null,
                      temperature: form.temperature ? Number(form.temperature) : null
                    });
                    pushToast({
                      type: "success",
                      title: "Saved",
                      message: "Reading saved successfully."
                    });
                    setRecords((current: DynamicStateObject) => [response, ...current.filter((item: DynamicStateObject) => item.id !== response.id)]);
                    setForm({ ...form, bloodPressure: "", sugar: "", weight: "", spo2: "", pulse: "", temperature: "" });
                    await load({ suppressError: true });
                  } catch (err: DynamicStateObject) {
                    setError(getApiErrorMessage(err, "Unable to save health reading."));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <Save size={18} className="mr-2" /> {saving ? "Saving..." : "Save Reading"}
              </button>
            </div>
          </div>

          {/* Right Panel: History */}
          <div className="flex flex-col">
            <h2 className="font-display text-xl font-medium mb-6">{t("interactiveTrends") || "Interactive Trends"}</h2>
            
            {(() => {
              if (!records || records.length === 0) return null;
              const chartData = [...records].reverse().map((record: DynamicStateObject) => {
                let systolic: DynamicStateObject = null;
                let diastolic: DynamicStateObject = null;
                if (record.bloodPressure && record.bloodPressure.includes('/')) {
                  const parts = record.bloodPressure.split('/');
                  systolic = Number((parts as DynamicStateObject)[0]);
                  diastolic = Number((parts as DynamicStateObject)[1]);
                }
                return {
                  ...record,
                  timeLabel: new Date(record.recordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                  systolic,
                  diastolic,
                };
              });

              return (
                <div className="flex flex-col gap-6 mb-8">
                  {/* Blood Pressure Chart */}
                  <div className="card-premium !bg-surface">
                    <h3 className="text-sm font-semibold text-ink mb-4">Blood Pressure (mmHg)</h3>
                    <div className="w-full h-[250px]">
                      <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="timeLabel" stroke="var(--color-ink-muted)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--color-ink-muted)" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0D1826', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#E2604F" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                          <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#60A5FA" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Sugar & Pulse Chart */}
                  <div className="card-premium !bg-surface">
                    <h3 className="text-sm font-semibold text-ink mb-4">Sugar (mg/dL) & Pulse (bpm)</h3>
                    <div className="w-full h-[250px]">
                      <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="timeLabel" stroke="var(--color-ink-muted)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--color-ink-muted)" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0D1826', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Line type="monotone" dataKey="sugar" name="Blood Sugar" stroke="#4FB3A0" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                          <Line type="monotone" dataKey="pulse" name="Pulse Rate" stroke="#A78BFA" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* SpO2 Chart */}
                  <div className="card-premium !bg-surface">
                    <h3 className="text-sm font-semibold text-ink mb-4">Oxygen Saturation (SpO2 %)</h3>
                    <div className="w-full h-[250px]">
                      <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="timeLabel" stroke="var(--color-ink-muted)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis domain={[90, 100]} stroke="var(--color-ink-muted)" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0D1826', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Line type="monotone" dataKey="spo2" name="SpO2" stroke="#4FB3A0" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              );
            })()}

            {loading ? (
              <div className="flex flex-col gap-4">
                {[1, 2].map((i: DynamicStateObject) => (
                  <div key={i} className="card-premium animate-pulse h-32 flex flex-col justify-center">
                    <div className="h-6 w-1/3 bg-white/10 rounded mb-4"></div>
                    <div className="h-4 w-full bg-white/10 rounded"></div>
                  </div>
                ))}
              </div>
            ) : !loading && (!Array.isArray(records) || !records.length) ? (
              <div className="flex flex-col items-center justify-center h-[300px] border border-white/5 border-dashed rounded-xl p-8 text-center text-ink-muted">
                <Stethoscope size={48} className="opacity-30 mb-4" />
                <h3 className="font-display text-lg mb-2 text-ink">{t("noHealthReadingsYet") || "No health readings yet"}</h3>
                <p className="text-sm max-w-sm">{t("addYourFirstReadingUsingTheFormToStartTrackingYourHealthTrendsOverTime") || "Add your first reading using the form to start tracking your health trends over time."}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-ink-muted tracking-widest uppercase mb-2">{t("recentReadings") || "Recent Readings"}</h3>
                {records.map((record: DynamicStateObject) => (
                  <div key={record.id} className="card-premium !bg-white/5 hover:!bg-white/10 transition-colors">
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${record.alertSeverity === 'NORMAL' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-alert/10 text-alert border border-alert/20'}`}>
                        {record.alertSeverity || "NORMAL"}
                      </span>
                      <span className="text-xs text-ink-muted flex items-center gap-1.5 font-mono">
                        <CalendarDays size={14} /> {new Date(record.recordedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 bg-black/20 p-3 rounded-element border border-white/5">
                      <div className="text-xs text-ink-muted">BP: <span className="font-mono text-ink text-sm block mt-1">{record.bloodPressure || "-"}</span></div>
                      <div className="text-xs text-ink-muted">Sugar: <span className="font-mono text-ink text-sm block mt-1">{record.sugar || "-"}</span></div>
                      <div className="text-xs text-ink-muted">SpO2: <span className="font-mono text-ink text-sm block mt-1">{record.spo2 || "-"}</span></div>
                      <div className="text-xs text-ink-muted">Pulse: <span className="font-mono text-ink text-sm block mt-1">{record.pulse || "-"}</span></div>
                    </div>

                    {record.alertMessage && (
                      <div className="flex gap-2 text-xs text-ink-muted italic border-l-2 border-alert/50 pl-3 py-1">
                        <AlertTriangle size={14} className="text-alert shrink-0" />
                        {record.alertMessage}
                      </div>
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

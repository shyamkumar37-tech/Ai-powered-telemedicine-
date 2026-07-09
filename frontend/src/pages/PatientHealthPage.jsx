import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { createHealthRecord, fetchHealthRecords, fetchHealthSummary } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import { useToast } from "../components/ui/ToastProvider";
import PatientSidebar from "../components/PatientSidebar";
import "./patient-booking-override.css";
import { User, LogOut, Heart, AlertTriangle, RefreshCw, Activity, CalendarDays, LineChart, Stethoscope, Save, Bluetooth } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function PatientHealthPage() {
  const { auth, logout } = useAuth();
  const { language, t } = useLanguage();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const patientId = auth?.profileId;
  
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    patientId,
    bloodPressure: "",
    sugar: "",
    weight: "",
    spo2: "",
    pulse: "",
    temperature: ""
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPairing, setIsPairing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

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
    if (patientId) setForm((current) => ({ ...current, patientId }));
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
    } catch (err) {
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
    <div id="tct-root">
      <div className="app">
        <PatientSidebar />
        
        <main id="page-main" role="main">
          <div className="topbar">
            <div>
              <h1 className="serif">Health Vitals</h1>
              <p>Log your daily readings and monitor your health trends.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <Heart />Health
              </div>
              <div className="signed-in" style={{ marginTop: '12px', marginLeft: '8px' }}>
                <User />
                Signed in as {auth?.fullName || "Anita Patient"}
              </div>
            </div>
            <div className="topbar-right">
              <LanguageSwitcher customClass="lang" hideLabel />
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2 bg-white"
                  onClick={async () => {
                    if (!navigator.bluetooth) {
                      alert("Web Bluetooth API is not available in this browser.");
                      return;
                    }
                    setIsPairing(true);
                    try {
                      const device = await navigator.bluetooth.requestDevice({
                        acceptAllDevices: true,
                        optionalServices: ['heart_rate']
                      });
                      console.log("Paired with", device.name);
                      alert("Successfully paired with wearable device: " + device.name);
                    } catch (err) {
                      console.error("Bluetooth pairing failed", err);
                    } finally {
                      setIsPairing(false);
                    }
                  }}
                  disabled={isPairing}
                >
                  <Bluetooth className={`h-4 w-4 ${isPairing ? "animate-pulse text-blue-500" : ""}`} />
                  {isPairing ? "Pairing..." : "Sync Wearable"}
                </Button>
                <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add reading
                </Button>
                <button className="btn-ghost" onClick={handleLogout} aria-label="Log out">
                  <LogOut />Logout
                </button>
              </div>
            </div>
          </div>

          <div className="booking-layout">
            <div style={{ flex: 1, padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
              
              <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                
                {/* Left Panel: Log New Reading */}
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.5px', marginBottom: '24px' }}>Log New Reading</h2>
                  
                  <div style={{ background: 'var(--tct-panel)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '16px', padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {Object.keys(form).filter(k => k !== "patientId").map((key) => (
                        <div key={key}>
                          <label style={{ display: 'block', fontSize: '13px', color: '#E2E8F0', fontWeight: '600', marginBottom: '8px' }}>
                            {fieldLabels[key]}
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="text"
                              value={form[key]}
                              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                              placeholder={`0.0`}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                paddingRight: '60px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--tct-panel-line-strong)',
                                borderRadius: '12px',
                                color: '#FFFFFF',
                                fontSize: '14px',
                                outline: 'none'
                              }}
                            />
                            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tct-text-muted)', fontSize: '13px' }}>
                              {fieldUnits[key]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {error && <p style={{ color: 'var(--tct-coral)', fontSize: '13px', marginTop: '16px' }}>{error}</p>}
                    
                    <button
                      className="btn-primary"
                      disabled={saving || !patientId}
                      style={{ width: '100%', marginTop: '24px', justifyContent: 'center' }}
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
                          setRecords((current) => [response, ...current.filter((item) => item.id !== response.id)]);
                          setForm({ ...form, bloodPressure: "", sugar: "", weight: "", spo2: "", pulse: "", temperature: "" });
                          await load({ suppressError: true });
                        } catch (err) {
                          setError(getApiErrorMessage(err, "Unable to save health reading."));
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      <Save size={16} /> {saving ? "Saving..." : "Save Reading"}
                    </button>
                  </div>
                </div>

                {/* Right Panel: History */}
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.5px', marginBottom: '24px' }}>History</h2>
                  
                  {summary && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <LineChart size={16} color="var(--tct-teal)" />
                          <span style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: '600' }}>Sugar Trend</span>
                        </div>
                        <p style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: '600' }}>{summary.sugarTrend || "Stable"}</p>
                        <p style={{ fontSize: '12px', color: 'var(--tct-text-secondary)', marginTop: '4px' }}>Latest: {summary.latestSugar ?? "-"} | Prev: {summary.previousSugar ?? "-"}</p>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <Activity size={16} color="var(--tct-teal)" />
                          <span style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: '600' }}>Average Pulse</span>
                        </div>
                        <p style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: '600' }}>{summary.averagePulse ? summary.averagePulse.toFixed(1) : "-"}</p>
                        <p style={{ fontSize: '12px', color: 'var(--tct-text-secondary)', marginTop: '4px' }}>BP: {summary.latestBloodPressure || "-"} | SpO2: {summary.latestSpo2 ?? "-"}</p>
                      </div>
                    </div>
                  )}

                  {loading ? (
                    <div className="doctors-grid" style={{ gridTemplateColumns: '1fr' }}>
                      {[1, 2].map(i => (
                        <div key={i} className="doctor-card" style={{ pointerEvents: 'none', height: '100px' }}>
                          <div className="skeleton-pulse" style={{ height: '24px', width: '30%', borderRadius: '4px', marginBottom: '16px' }}></div>
                          <div className="skeleton-pulse" style={{ height: '16px', width: '100%', borderRadius: '4px' }}></div>
                        </div>
                      ))}
                    </div>
                  ) : !loading && (!Array.isArray(records) || !records.length) ? (
                    <div className="empty-state" style={{ minHeight: '300px' }}>
                      <Stethoscope />
                      <h3>No health readings yet</h3>
                      <p>Add your first reading using the form to start tracking your health trends over time.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {records.map((record) => (
                        <div key={record.id} className="doctor-card" style={{ cursor: 'default', display: 'block', padding: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '12px', padding: '4px 10px', background: record.alertSeverity === 'NORMAL' ? 'var(--tct-teal-dim)' : 'var(--tct-coral-dim)', color: record.alertSeverity === 'NORMAL' ? 'var(--tct-teal)' : 'var(--tct-coral)', borderRadius: '100px', fontWeight: '600' }}>
                              {record.alertSeverity || "NORMAL"}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--tct-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CalendarDays size={14} /> {new Date(record.recordedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '13px', color: 'var(--tct-text-secondary)' }}>BP: <strong style={{ color: '#E2E8F0' }}>{record.bloodPressure || "-"}</strong></div>
                            <div style={{ fontSize: '13px', color: 'var(--tct-text-secondary)' }}>Sugar: <strong style={{ color: '#E2E8F0' }}>{record.sugar || "-"}</strong></div>
                            <div style={{ fontSize: '13px', color: 'var(--tct-text-secondary)' }}>SpO2: <strong style={{ color: '#E2E8F0' }}>{record.spo2 || "-"}</strong></div>
                            <div style={{ fontSize: '13px', color: 'var(--tct-text-secondary)' }}>Pulse: <strong style={{ color: '#E2E8F0' }}>{record.pulse || "-"}</strong></div>
                          </div>

                          {record.alertMessage && (
                            <p style={{ fontSize: '13px', color: 'var(--tct-text-secondary)', fontStyle: 'italic' }}>
                              {record.alertMessage}
                            </p>
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

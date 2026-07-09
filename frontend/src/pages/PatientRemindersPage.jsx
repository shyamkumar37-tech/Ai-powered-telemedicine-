import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchAdherence, fetchPatientReminders, updateReminderStatus } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import { useToast } from "../components/ui/ToastProvider";
import PatientSidebar from "../components/PatientSidebar";
import "./patient-booking-override.css";
import { User, LogOut, Bell, Search, AlertTriangle, RefreshCw, CheckCircle2, ShieldCheck, XCircle, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function PatientRemindersPage() {
  const { auth, logout } = useAuth();
  const { language, t } = useLanguage();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const patientId = auth?.profileId;
  
  const [reminders, setReminders] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingReminderId, setUpdatingReminderId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const parseScheduledDate = (value) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const startOfToday = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const toEffectiveStatus = (item) => {
    if (!item) return "PENDING";
    if (item.status && item.status !== "PENDING") return item.status;
    const scheduled = parseScheduledDate(item.scheduledDate);
    if (!scheduled) return item.status || "PENDING";
    return scheduled < startOfToday ? "MISSED" : (item.status || "PENDING");
  };

  const dedupeReminders = (items) => {
    const seen = new Set();
    const result = [];
    items.forEach((item) => {
      const key = [
        item.medicineName || "",
        item.dosage || "",
        item.frequency || "",
        item.scheduledDate || "",
        item.status || ""
      ].join("|");
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    });
    return result;
  };

  const load = async () => {
    if (!patientId) {
      setReminders([]);
      setAdherence(null);
      setError("Unable to load reminders.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [reminderData, adherenceData] = await Promise.all([
        fetchPatientReminders(patientId),
        fetchAdherence(patientId)
      ]);
      const normalized = Array.isArray(reminderData) ? reminderData : [];
      const deduped = dedupeReminders(normalized);
      const enriched = deduped.map((item) => ({
        ...item,
        effectiveStatus: toEffectiveStatus(item)
      }));
      setReminders(enriched);
      setAdherence(adherenceData);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load reminders."));
      setReminders([]);
      setAdherence(null);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (reminderId, status) => {
    setUpdatingReminderId(reminderId);
    setError("");
    try {
      await updateReminderStatus(reminderId, { status });
      pushToast({
        type: "success",
        title: "Reminders",
        message: status === "TAKEN" ? "Reminder marked as taken." : "Reminder marked as missed."
      });
      await load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Unable to update reminder status.");
      setError(message);
      pushToast({ type: "error", title: "Error", message });
    } finally {
      setUpdatingReminderId(null);
    }
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const filteredReminders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reminders.filter((item) => {
      const status = item.effectiveStatus || item.status || "PENDING";
      if (filter !== "All" && status !== filter.toUpperCase()) return false;
      if (!query) return true;
      const target = `${item.medicineName ?? ""} ${item.dosage ?? ""} ${item.frequency ?? ""}`.toLowerCase();
      return target.includes(query);
    });
  }, [filter, reminders, search]);

  const groupedReminders = useMemo(() => {
    const groups = {
      today: [],
      yesterday: [],
      week: [],
      older: []
    };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    filteredReminders.forEach((item) => {
      const scheduled = parseScheduledDate(item.scheduledDate);
      if (!scheduled) {
        groups.older.push(item);
        return;
      }
      if (scheduled >= today && scheduled < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
        groups.today.push(item);
      } else if (scheduled >= yesterday && scheduled < today) {
        groups.yesterday.push(item);
      } else if (scheduled >= weekStart) {
        groups.week.push(item);
      } else {
        groups.older.push(item);
      }
    });
    return groups;
  }, [filteredReminders, startOfToday]);

  const adherencePercentage = Number(adherence?.adherencePercentage ?? 0);
  
  // Neutral/Encouraging adherence framing
  let trendIcon = <Minus size={16} color="var(--tct-text-muted)" />;
  let trendColor = "var(--tct-text-muted)";
  let trendText = "Steady adherence trend";
  
  if (adherencePercentage >= 80) {
    trendIcon = <TrendingUp size={16} color="var(--tct-teal)" />;
    trendColor = "var(--tct-teal)";
    trendText = "Great consistency on your regimen";
  } else if (adherencePercentage < 50 && adherencePercentage > 0) {
    trendIcon = <TrendingDown size={16} color="var(--tct-coral)" />;
    trendColor = "var(--tct-coral)";
    trendText = "Slight dip in adherence — check in with your care team";
  } else if (adherencePercentage === 0) {
    trendText = "No data yet — your trend will appear here as you log doses.";
  }

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
              <h1 className="serif">Reminders</h1>
              <p>Track your scheduled medications and adherence trends.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <Bell />Medications
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
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.5px', marginBottom: '12px' }}>Overview</h2>
                  <div className="filter-bar" style={{ marginBottom: 0 }}>
                    {['All', 'Pending', 'Taken', 'Missed'].map(f => (
                      <button 
                        key={f} 
                        className={`filter-pill ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                  <Search size={16} color="var(--tct-text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search medication..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 40px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--tct-panel-line-strong)',
                      borderRadius: '100px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Adherence Insight Card */}
              <div style={{ background: 'var(--tct-panel)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '16px', padding: '24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${trendColor}` }}>
                  {trendIcon}
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '600', marginBottom: '4px' }}>Adherence Insight</h3>
                  <p style={{ fontSize: '14px', color: 'var(--tct-text-secondary)' }}>{trendText} <span style={{ opacity: 0.6 }}>(~{adherencePercentage}% of recent doses logged)</span></p>
                </div>
              </div>

              {loading && !reminders.length ? (
                <div className="doctors-grid" style={{ gridTemplateColumns: '1fr' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="doctor-card" style={{ pointerEvents: 'none', height: '100px' }}>
                      <div className="skeleton-pulse" style={{ height: '24px', width: '40%', borderRadius: '4px', marginBottom: '16px' }}></div>
                      <div className="skeleton-pulse" style={{ height: '16px', width: '60%', borderRadius: '4px' }}></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="empty-state">
                  <AlertTriangle />
                  <h3>Unable to load reminders</h3>
                  <p>{error}</p>
                  <button className="btn-ghost" style={{ marginTop: '16px' }} onClick={() => load()}><RefreshCw /> Retry</button>
                </div>
              ) : !loading && !error && !reminders.length ? (
                <div className="empty-state">
                  <ShieldCheck />
                  <h3>No active reminders</h3>
                  <p>Reminders will appear here automatically when a prescription is active.</p>
                </div>
              ) : !loading && !error && reminders.length && !filteredReminders.length ? (
                <div className="empty-state">
                  <Search />
                  <h3>No reminders match</h3>
                  <p>Try a different filter or clear your search input.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {[
                    { label: "Today", items: groupedReminders.today },
                    { label: "Yesterday", items: groupedReminders.yesterday },
                    { label: "Earlier this week", items: groupedReminders.week },
                    { label: "Older", items: groupedReminders.older }
                  ].map((group) => (
                    group.items.length > 0 && (
                      <div key={group.label} className="tct-animate-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                           <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>{group.label}</h3>
                           <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                        </div>
                        <div className="doctors-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
                          {group.items.map((item) => {
                            const status = item.effectiveStatus || item.status || "PENDING";
                            const actionable = status === "PENDING";
                            
                            let statusBadge = null;
                            if (status === 'TAKEN') statusBadge = <span style={{ fontSize: '13px', padding: '4px 12px', background: 'rgba(79, 179, 160, 0.1)', color: 'var(--tct-teal)', borderRadius: '100px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14}/> Taken</span>;
                            else if (status === 'MISSED') statusBadge = <span style={{ fontSize: '13px', padding: '4px 12px', background: 'rgba(226, 96, 79, 0.1)', color: 'var(--tct-coral)', borderRadius: '100px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><XCircle size={14}/> Missed</span>;
                            else statusBadge = <span style={{ fontSize: '13px', padding: '4px 12px', background: 'rgba(255,255,255,0.05)', color: 'var(--tct-text-muted)', borderRadius: '100px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14}/> Pending</span>;

                            return (
                              <div key={`${item.id}-${item.scheduledDate}`} className="doctor-card" style={{ cursor: 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                  <h4 style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: '600', marginBottom: '6px' }}>{item.medicineName || "Medication"}</h4>
                                  <p style={{ fontSize: '14px', color: 'var(--tct-text-secondary)' }}>
                                    {item.dosage || "Dose not set"} • {item.frequency || "Frequency not set"} • {item.scheduledDate}
                                  </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  {statusBadge}
                                  {actionable && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button
                                        className="btn-ghost"
                                        disabled={updatingReminderId === item.id}
                                        onClick={() => updateStatus(item.id, "TAKEN")}
                                        style={{ background: 'rgba(79, 179, 160, 0.1)', color: 'var(--tct-teal)' }}
                                      >
                                        Mark Taken
                                      </button>
                                      <button
                                        className="btn-ghost"
                                        disabled={updatingReminderId === item.id}
                                        onClick={() => updateStatus(item.id, "MISSED")}
                                      >
                                        Missed
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

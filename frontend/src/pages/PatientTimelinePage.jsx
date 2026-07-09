import LanguageSwitcher from "../components/LanguageSwitcher";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientTimeline } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import "./patient-booking-override.css";
import { User, LogOut, Activity, Bell, CalendarDays, FileText, HeartPulse, MessageSquareText, Pill, AlertTriangle, RefreshCw, Layers } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import {
  deriveActor,
  deriveStatus,
  formatTimelineDate,
  formatRelativeTimelineDate,
  groupTimelineEvents,
  needsAction,
  normalizeTimelineDate
} from "../utils/timelineUtils";

export default function PatientTimelinePage() {
  const { auth, logout } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const patientId = auth?.profileId;
  
  const [timeline, setTimeline] = useState([]);
  const [filter, setFilter] = useState("All");
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "comfortable";
    try {
      const stored = localStorage.getItem("telecareplus-timeline-view");
      return stored === "compact" || stored === "comfortable" ? stored : "comfortable";
    } catch {
      return "comfortable";
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!patientId) {
      setTimeline([]);
      setError("Unable to load timeline.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPatientTimeline(patientId);
      setTimeline(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load timeline."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const processedTimeline = useMemo(() => {
    const grouped = groupTimelineEvents(timeline);
    return grouped
      .map((item) => {
        const { date, isValid, isSuspiciousFuture } = normalizeTimelineDate(item?.occurredAt);
        const status = deriveStatus(item);
        const actor = deriveActor(item);
        const actionNeeded = needsAction(item, status);
        return {
          ...item,
          displayDate: formatTimelineDate(date),
          relativeDate: formatRelativeTimelineDate(date),
          hasValidDate: isValid,
          suspiciousDate: isSuspiciousFuture,
          status,
          actor,
          actionNeeded
        };
      })
      .sort((a, b) => {
        const aDate = normalizeTimelineDate(a?.occurredAt).date;
        const bDate = normalizeTimelineDate(b?.occurredAt).date;
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return bDate.getTime() - aDate.getTime();
      });
  }, [timeline]);

  const filterOptions = [
    { label: "All", value: "All" },
    { label: "Appointments", value: "APPOINTMENT" },
    { label: "Triage", value: "TRIAGE" },
    { label: "Prescriptions", value: "PRESCRIPTION" },
    { label: "Alerts", value: "ALERT" }
  ];

  const filteredTimeline = useMemo(() => {
    if (filter === "All") return processedTimeline;
    return processedTimeline.filter((item) => item.type === filter);
  }, [filter, processedTimeline]);

  const groupedByDate = useMemo(() => {
    const groups = { today: [], yesterday: [], week: [], older: [] };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - 6);

    filteredTimeline.forEach((item) => {
      const date = normalizeTimelineDate(item?.occurredAt).date;
      if (!date) {
        groups.older.push(item);
        return;
      }
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      if (dateOnly.getTime() === today.getTime()) {
        groups.today.push(item);
      } else if (dateOnly.getTime() === yesterday.getTime()) {
        groups.yesterday.push(item);
      } else if (dateOnly >= weekStart) {
        groups.week.push(item);
      } else {
        groups.older.push(item);
      }
    });

    return groups;
  }, [filteredTimeline]);

  const renderTypeIcon = (type) => {
    const props = { size: 16, color: "var(--tct-text-muted)" };
    switch (type) {
      case "APPOINTMENT": return <CalendarDays {...props} />;
      case "TRIAGE": return <HeartPulse {...props} />;
      case "PRESCRIPTION": return <Pill {...props} />;
      case "HEALTH": return <Activity {...props} />;
      case "ALERT": return <Bell {...props} />;
      case "CONSULTATION": return <MessageSquareText {...props} />;
      default: return <FileText {...props} />;
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
              <h1 className="serif">Unified Timeline</h1>
              <p>Your complete medical history and continuity of care.</p>
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
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
                <div className="filter-bar" style={{ marginBottom: 0 }}>
                  {filterOptions.map(f => (
                    <button 
                      key={f.value} 
                      className={`filter-pill ${filter === f.value ? 'active' : ''}`}
                      onClick={() => setFilter(f.value)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: '4px', background: 'var(--tct-panel)', border: '1px solid var(--tct-panel-line)', padding: '4px', borderRadius: '100px' }}>
                  <button 
                    style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', color: viewMode === 'comfortable' ? '#FFFFFF' : 'var(--tct-text-muted)', background: viewMode === 'comfortable' ? 'var(--tct-teal)' : 'transparent' }}
                    onClick={() => { setViewMode("comfortable"); localStorage.setItem("telecareplus-timeline-view", "comfortable"); }}
                  >
                    Comfortable
                  </button>
                  <button 
                    style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', color: viewMode === 'compact' ? '#FFFFFF' : 'var(--tct-text-muted)', background: viewMode === 'compact' ? 'var(--tct-teal)' : 'transparent' }}
                    onClick={() => { setViewMode("compact"); localStorage.setItem("telecareplus-timeline-view", "compact"); }}
                  >
                    Compact
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="doctors-grid" style={{ gridTemplateColumns: '1fr' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="doctor-card" style={{ pointerEvents: 'none', height: '80px' }}>
                      <div className="skeleton-pulse" style={{ height: '24px', width: '40%', borderRadius: '4px', marginBottom: '16px' }}></div>
                      <div className="skeleton-pulse" style={{ height: '16px', width: '80%', borderRadius: '4px' }}></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="empty-state">
                  <AlertTriangle />
                  <h3>Unable to load timeline</h3>
                  <p>{error}</p>
                  <button className="btn-ghost" style={{ marginTop: '16px' }} onClick={load}><RefreshCw /> Retry</button>
                </div>
              ) : !loading && !error && !timeline.length ? (
                <div className="empty-state">
                  <Layers />
                  <h3>No Timeline Events</h3>
                  <p>No recent continuity events were found.</p>
                </div>
              ) : !loading && !error && timeline.length && !filteredTimeline.length ? (
                <div className="empty-state">
                  <Layers />
                  <h3>No matching events</h3>
                  <p>No timeline events match your filter.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {[
                    { key: "today", label: "Today", items: groupedByDate.today },
                    { key: "yesterday", label: "Yesterday", items: groupedByDate.yesterday },
                    { key: "week", label: "Earlier this week", items: groupedByDate.week },
                    { key: "older", label: "Older", items: groupedByDate.older }
                  ].map((group) => (
                    group.items.length > 0 && (
                      <div key={group.key} className="tct-animate-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                           <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>{group.label}</h3>
                           <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                        </div>
                        <div className="doctors-grid" style={{ gridTemplateColumns: '1fr', gap: viewMode === 'compact' ? '8px' : '16px' }}>
                          {group.items.map((item, index) => (
                            <div key={`${item.type}-${item.occurredAt}-${index}`} className="doctor-card" style={{ cursor: 'default', padding: viewMode === 'compact' ? '16px' : '24px', border: item.actionNeeded ? '1px solid var(--tct-coral)' : '' }}>
                              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {renderTypeIcon(item.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h4 style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: '600' }}>{item.title}</h4>
                                        {item.repeatCount > 1 && (
                                          <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', color: '#E2E8F0' }}>Repeated x{item.repeatCount}</span>
                                        )}
                                      </div>
                                      <p style={{ fontSize: '13px', color: 'var(--tct-text-secondary)', marginTop: '4px' }}>
                                        <strong style={{ color: '#E2E8F0', fontWeight: '500' }}>{item.relativeDate}</strong> • {item.displayDate}
                                      </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: '12px', padding: '4px 10px', background: 'rgba(255,255,255,0.05)', color: 'var(--tct-text-muted)', borderRadius: '100px', fontWeight: '600' }}>{item.type}</span>
                                      {item.status && (
                                        <span style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--tct-teal-dim)', color: 'var(--tct-teal)', borderRadius: '100px', fontWeight: '600' }}>{item.status}</span>
                                      )}
                                      {item.actionNeeded && (
                                        <span style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--tct-coral-dim)', color: 'var(--tct-coral)', borderRadius: '100px', fontWeight: '600' }}>Needs Action</span>
                                      )}
                                    </div>
                                  </div>
                                  <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--tct-text-secondary)' }}>
                                    <span style={{ display: 'inline-block', fontSize: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', padding: '2px 8px', borderRadius: '4px', marginRight: '8px', color: '#E2E8F0' }}>
                                      Source: {item.actor}
                                    </span>
                                    {item.details && <p style={{ marginTop: '8px' }}>{item.details}</p>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
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

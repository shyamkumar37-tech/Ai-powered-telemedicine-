import LanguageSwitcher from "../components/LanguageSwitcher";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientTimeline } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import PatientSidebar from "../components/PatientSidebar";
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
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function PatientTimelinePage() {
  const { auth, logout } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const patientId = auth?.profileId;
  
  const [timeline, setTimeline] = useState<DynamicStateObject[]>([]);
  const [filter, setFilter] = useState<DynamicState>("All");
  const [viewMode, setViewMode] = useState<DynamicState>(() => {
    if (typeof window === "undefined") return "comfortable";
    try {
      const stored = localStorage.getItem("telecareplus-timeline-view");
      return stored === "compact" || stored === "comfortable" ? stored : "comfortable";
    } catch {
      return "comfortable";
    }
  });
  const [loading, setLoading] = useState<DynamicState>(true);
  const [error, setError] = useState<DynamicState>("");

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
    } catch (err: DynamicStateObject) {
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
      .map((item: DynamicStateObject) => {
        const { date, isValid, isSuspiciousFuture } = normalizeTimelineDate(item?.occurredAt);
        const status = deriveStatus(item);
        const actor = deriveActor(item);
        const actionNeeded = needsAction(item, status);
        return {
          ...item,
          displayDate: (formatTimelineDate(date as any) as any),
          relativeDate: formatRelativeTimelineDate(date as any),
          hasValidDate: isValid,
          suspiciousDate: isSuspiciousFuture,
          status,
          actor,
          actionNeeded
        };
      })
      .sort((a: DynamicStateObject, b: DynamicStateObject) => {
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
    return processedTimeline.filter((item: DynamicStateObject) => item.type === filter);
  }, [filter, processedTimeline]);

  const groupedByDate = useMemo(() => {
    const groups = { today: [], yesterday: [], week: [], older: [] };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - 6);

    filteredTimeline.forEach((item: DynamicStateObject) => {
      const date = normalizeTimelineDate(item?.occurredAt).date;
      if (!date) {
        (groups.older as any).push(item);
        return;
      }
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      if (dateOnly.getTime() === today.getTime()) {
        (groups.today as any).push(item);
      } else if (dateOnly.getTime() === yesterday.getTime()) {
        (groups.yesterday as any).push(item);
      } else if (dateOnly >= (weekStart as any)) {
        (groups.week as any).push(item);
      } else {
        (groups.older as any).push(item);
      }
    });

    return groups;
  }, [filteredTimeline]);

  const renderTypeIcon = (type: DynamicStateObject) => {
    const props = { size: 18, className: "text-ink-muted group-hover:text-primary transition-colors" };
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
    <div className="h-full w-full bg-canvas text-[var(--tc-text)] font-sans flex flex-col overflow-hidden lg:flex-row">
      <PatientSidebar />
      
      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 -1 p-6 lg:p-10 min-w-0" role="main">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeSlideUp">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">{t("unifiedTimeline") || "Unified Timeline"}</h1>
            <p className="text-ink-muted text-sm mb-3">{t("yourCompleteMedicalHistoryAndContinuityOfCare") || "Your complete medical history and continuity of care."}</p>
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
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {filterOptions.map((f: DynamicStateObject) => (
                <button 
                  key={f.value} 
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border whitespace-nowrap ${filter === f.value ? 'bg-primary text-canvas border-primary' : 'bg-transparent text-ink-muted border-white/10 hover:text-ink hover:bg-white/5'}`}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            
            <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-full shrink-0">
              <button 
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${viewMode === 'comfortable' ? 'bg-primary text-canvas' : 'bg-transparent text-ink-muted hover:text-ink'}`}
                onClick={() => { setViewMode("comfortable"); localStorage.setItem("telecareplus-timeline-view", "comfortable"); }}
              >
                {t("comfortable") || "Comfortable"}</button>
              <button 
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${viewMode === 'compact' ? 'bg-primary text-canvas' : 'bg-transparent text-ink-muted hover:text-ink'}`}
                onClick={() => { setViewMode("compact"); localStorage.setItem("telecareplus-timeline-view", "compact"); }}
              >
                {t("compact") || "Compact"}</button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-4 mt-8">
              {[1, 2, 3].map((i: DynamicStateObject) => (
                <div key={i} className="card-premium h-24 animate-pulse bg-white/5"></div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-alert/5 border border-alert/20 rounded-xl mt-8">
              <AlertTriangle size={32} className="text-alert mb-4" />
              <h3 className="font-display text-lg mb-2">{t("unableToLoadTimeline") || "Unable to load timeline"}</h3>
              <p className="text-sm text-ink-muted mb-6">{error}</p>
              <button className="px-4 py-2 border border-white/20 rounded-element text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2" onClick={load}><RefreshCw size={16} /> {t("retry") || "Retry"}</button>
            </div>
          ) : !loading && !error && !timeline.length ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed h-[300px] mt-8">
              <Layers size={48} className="text-ink-muted/30 mb-4" />
              <h3 className="font-display text-lg mb-2">{t("noTimelineEvents") || "No Timeline Events"}</h3>
              <p className="text-sm text-ink-muted max-w-[280px]">{t("noRecentContinuityEventsWereFound") || "No recent continuity events were found."}</p>
            </div>
          ) : !loading && !error && timeline.length && !filteredTimeline.length ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed h-[300px] mt-8">
              <Layers size={48} className="text-ink-muted/30 mb-4" />
              <h3 className="font-display text-lg mb-2">{t("noMatchingEvents") || "No matching events"}</h3>
              <p className="text-sm text-ink-muted max-w-[280px]">{t("noTimelineEventsMatchYourFilter") || "No timeline events match your filter."}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-10 mt-8">
              {[
                { key: "today", label: "Today", items: groupedByDate.today },
                { key: "yesterday", label: "Yesterday", items: groupedByDate.yesterday },
                { key: "week", label: "Earlier this week", items: groupedByDate.week },
                { key: "older", label: "Older", items: groupedByDate.older }
              ].map((group: DynamicStateObject) => (
                group.items.length > 0 && (
                  <div key={group.key} className="flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                       <h3 className="font-display text-xl font-medium">{group.label}</h3>
                       <div className="flex-1 h-px bg-white/10"></div>
                    </div>
                    <div className="flex flex-col gap-4">
                      {group.items.map((item: DynamicStateObject, index: number | string) => (
                        <div key={`${item.type}-${item.occurredAt}-${index}`} className={`card-premium group !bg-surface hover:border-white/20 transition-colors ${viewMode === 'compact' ? '!p-4' : '!p-6'} ${item.actionNeeded ? 'border-alert/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : ''}`}>
                          <div className="flex gap-4 sm:gap-6 items-start">
                            
                            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                              {renderTypeIcon(item.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h4 className="text-base font-semibold text-ink">{item.title}</h4>
                                    {item.repeatCount > 1 && (
                                      <span className="text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded text-ink-muted">Repeated x{item.repeatCount}</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-ink-muted">
                                    <strong className="text-ink/90 font-medium">{item.relativeDate}</strong> <span className="opacity-50 mx-1">•</span> {item.displayDate}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2 shrink-0">
                                  <span className="text-xs font-semibold px-3 py-1 bg-white/5 border border-white/10 text-ink-muted rounded-full">{item.type}</span>
                                  {item.status && (
                                    <span className="text-xs font-semibold px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full">{item.status}</span>
                                  )}
                                  {item.actionNeeded && (
                                    <span className="text-xs font-semibold px-3 py-1 bg-alert/10 border border-alert/20 text-alert rounded-full">{t("needsAction") || "Needs Action"}</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="mt-3">
                                <span className="inline-block text-xs font-medium bg-white/5 border border-white/10 px-2.5 py-1 rounded text-ink/80 mb-2">
                                  Source: {item.actor}
                                </span>
                                {item.details && <p className="text-sm leading-relaxed text-ink-muted">{item.details}</p>}
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
      </main>
    </div>
  );
}

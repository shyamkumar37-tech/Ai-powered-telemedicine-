import { useEffect, useMemo, useState, useOptimistic } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchAdherence, fetchPatientReminders, updateReminderStatus } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { useToast } from "../components/ui/ToastProvider";
import PatientSidebar from "../components/PatientSidebar";
import { User, LogOut, Bell, Search, AlertTriangle, RefreshCw, CheckCircle2, ShieldCheck, XCircle, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function PatientRemindersPage() {
  const { auth, logout } = useAuth();
  const { language, t } = useLanguage();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const patientId = auth?.profileId;
  
  const [reminders, setReminders] = useState<DynamicStateObject[]>([]);
  const [adherence, setAdherence] = useState<DynamicStateObject | null>(null);
  const [error, setError] = useState<DynamicState>("");
  const [loading, setLoading] = useState<DynamicState>(true);
  const [updatingReminderId, setUpdatingReminderId] = useState<DynamicStateObject | null>(null);
  const [filter, setFilter] = useState<DynamicState>("All");
  const [search, setSearch] = useState<DynamicState>("");

  const [optimisticReminders, addOptimisticReminder] = useOptimistic(
    reminders,
    (state: DynamicStateObject[], update: { id: DynamicStateObject; status: DynamicStateObject }) =>
      state.map((r) =>
        r.id === update.id ? { ...r, status: update.status, effectiveStatus: update.status } : r
      )
  );

  const parseScheduledDate = (value: string | number) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const startOfToday = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const toEffectiveStatus = (item: DynamicStateObject) => {
    if (!item) return "PENDING";
    if (item.status && item.status !== "PENDING") return item.status;
    const scheduled = parseScheduledDate(item.scheduledDate);
    if (!scheduled) return item.status || "PENDING";
    return scheduled < startOfToday ? "MISSED" : (item.status || "PENDING");
  };

  const dedupeReminders = (items: DynamicStateObject) => {
    const seen = new Set();
    const result: DynamicStateObject = [];
    items.forEach((item: DynamicStateObject) => {
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
      const enriched = deduped.map((item: DynamicStateObject) => ({
        ...item,
        effectiveStatus: toEffectiveStatus(item)
      }));
      setReminders(enriched);
      setAdherence(adherenceData);
      setError("");
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, "Unable to load reminders."));
      setReminders([]);
      setAdherence(null);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (reminderId: DynamicStateObject, status: DynamicStateObject) => {
    addOptimisticReminder({ id: reminderId, status });
    try {
      await updateReminderStatus(reminderId, { status });
      pushToast({
        type: "success",
        title: "Reminders",
        message: status === "TAKEN" ? "Reminder marked as taken." : "Reminder marked as missed."
      });
      // The reload happens in background, optimistic state keeps it fast
      await load();
    } catch (err: DynamicStateObject) {
      const message = getApiErrorMessage(err, "Unable to update reminder status.");
      setError(message);
      pushToast({ type: "error", title: "Error", message });
    }
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const filteredReminders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return optimisticReminders.filter((item: DynamicStateObject) => {
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

    filteredReminders.forEach((item: DynamicStateObject) => {
      const scheduled = parseScheduledDate(item.scheduledDate);
      if (!scheduled) {
        (groups.older as any).push(item);
        return;
      }
      if (scheduled >= today && scheduled < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
        (groups.today as any).push(item);
      } else if (scheduled >= yesterday && scheduled < today) {
        (groups.yesterday as any).push(item);
      } else if (scheduled >= weekStart) {
        (groups.week as any).push(item);
      } else {
        (groups.older as any).push(item);
      }
    });
    return groups;
  }, [filteredReminders, startOfToday]);

  const adherencePercentage = Number(adherence?.adherencePercentage ?? 0);
  
  let trendIcon = <Minus size={24} className="text-ink-muted" />;
  let trendColorClass = "border-ink-muted bg-white/5";
  let trendText = "Steady adherence trend";
  
  if (adherencePercentage >= 80) {
    trendIcon = <TrendingUp size={24} className="text-primary" />;
    trendColorClass = "border-primary/50 bg-primary/10";
    trendText = "Great consistency on your regimen";
  } else if (adherencePercentage < 50 && adherencePercentage > 0) {
    trendIcon = <TrendingDown size={24} className="text-alert" />;
    trendColorClass = "border-alert/50 bg-alert/10";
    trendText = "Slight dip in adherence — check in with your care team";
  } else if (adherencePercentage === 0) {
    trendText = "No data yet — your trend will appear here as you log doses.";
  }

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
            <h1 className="font-display text-3xl font-medium mb-2">{t("reminders") || "Reminders"}</h1>
            <p className="text-ink-muted text-sm mb-3">{t("trackYourScheduledMedicationsAndAdherenceTrends") || "Track your scheduled medications and adherence trends."}</p>
            <div className="flex gap-2 items-center mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                <Bell size={12} className="text-primary" />{t("medications") || "Medications"}</span>
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

        <div className="max-w-4xl animate-fadeSlideUp" style={{animationDelay: '0.1s'}}>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center flex-wrap gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl font-medium mb-3">{t("overview") || "Overview"}</h2>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['All', 'Pending', 'Taken', 'Missed'].map((f: DynamicStateObject) => (
                  <button 
                    key={f} 
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border border-white/10 whitespace-nowrap ${filter === f ? 'bg-primary text-canvas border-primary' : 'bg-transparent text-ink-muted hover:text-ink hover:bg-white/5'}`}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative w-full md:w-auto md:w-[280px]">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Search medication..."
                value={search}
                onChange={(e: DynamicStateObject) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-ink-muted/50 text-sm transition-all"
              />
            </div>
          </div>

          {/* Adherence Insight Card */}
          <div className="card-premium flex items-center gap-5 mb-8">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border ${trendColorClass}`}>
              {trendIcon}
            </div>
            <div>
              <h3 className="font-medium text-base mb-1">{t("adherenceInsight") || "Adherence Insight"}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                {trendText} <span className="opacity-60 block mt-0.5 font-mono text-xs">(~{adherencePercentage}% of recent doses logged)</span>
              </p>
            </div>
          </div>

          {loading && !reminders.length ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i: DynamicStateObject) => (
                <div key={i} className="card-premium h-24 animate-pulse flex flex-col justify-center">
                  <div className="h-5 w-2/5 bg-white/10 rounded mb-3"></div>
                  <div className="h-4 w-3/5 bg-white/10 rounded"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-alert/5 border border-alert/20 rounded-xl">
              <AlertTriangle size={32} className="text-alert mb-4" />
              <h3 className="font-display text-lg mb-2">{t("unableToLoadReminders") || "Unable to load reminders"}</h3>
              <p className="text-sm text-ink-muted mb-6">{error}</p>
              <button className="px-4 py-2 border border-white/20 rounded-element text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2" onClick={() => load()}>
                <RefreshCw size={16} /> {t("retry") || "Retry"}</button>
            </div>
          ) : !loading && !error && !reminders.length ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed">
              <ShieldCheck size={48} className="text-ink-muted/30 mb-4" />
              <h3 className="font-display text-lg mb-2">{t("noActiveReminders") || "No active reminders"}</h3>
              <p className="text-sm text-ink-muted max-w-md">{t("remindersWillAppearHereAutomaticallyWhenAPrescriptionIsActive") || "Reminders will appear here automatically when a prescription is active."}</p>
            </div>
          ) : !loading && !error && reminders.length && !filteredReminders.length ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed">
              <Search size={48} className="text-ink-muted/30 mb-4" />
              <h3 className="font-display text-lg mb-2">{t("noRemindersMatch") || "No reminders match"}</h3>
              <p className="text-sm text-ink-muted">{t("tryADifferentFilterOrClearYourSearchInput") || "Try a different filter or clear your search input."}</p>
            </div>
          ) : (
            <div className="space-y-10">
              {[
                { label: "Today", items: groupedReminders.today },
                { label: "Yesterday", items: groupedReminders.yesterday },
                { label: "Earlier this week", items: groupedReminders.week },
                { label: "Older", items: groupedReminders.older }
              ].map((group: DynamicStateObject) => (
                group.items.length > 0 && (
                  <div key={group.label} className="animate-fadeSlideUp">
                    <div className="flex items-center gap-4 mb-4">
                       <h3 className="text-sm font-semibold tracking-widest uppercase text-ink-muted/80">{group.label}</h3>
                       <div className="flex-1 h-px bg-white/10"></div>
                    </div>
                    <div className="flex flex-col gap-4">
                      {group.items.map((item: DynamicStateObject) => {
                        const status = item.effectiveStatus || item.status || "PENDING";
                        const actionable = status === "PENDING";
                        
                        let statusBadge: DynamicStateObject = null;
                        if (status === 'TAKEN') statusBadge = <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold tracking-wider uppercase border border-primary/20"><CheckCircle2 size={14}/> {t("taken") || "Taken"}</span>;
                        else if (status === 'MISSED') statusBadge = <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-alert/10 text-alert rounded-full text-xs font-semibold tracking-wider uppercase border border-alert/20"><XCircle size={14}/> {t("missed") || "Missed"}</span>;
                        else statusBadge = <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 text-ink-muted rounded-full text-xs font-semibold tracking-wider uppercase border border-white/10"><Clock size={14}/> {t("pending") || "Pending"}</span>;

                        return (
                          <div key={`${item.id}-${item.scheduledDate}`} className="card-premium flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-white/20 transition-colors">
                            <div>
                              <h4 className="text-base font-medium mb-1.5">{item.medicineName || "Medication"}</h4>
                              <p className="text-sm text-ink-muted font-mono flex flex-wrap items-center gap-1.5">
                                <span>{item.dosage || "Dose not set"}</span>
                                <span className="opacity-40">•</span>
                                <span>{item.frequency || "Frequency not set"}</span>
                                <span className="opacity-40">•</span>
                                <span>{item.scheduledDate}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                              {statusBadge}
                              {actionable && (
                                <div className="flex gap-2">
                                  <button
                                    className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-element text-sm font-medium transition-colors disabled:opacity-50"
                                    onClick={() => updateStatus(item.id, "TAKEN")}
                                  >
                                    {t("markTaken") || "Mark Taken"}</button>
                                  <button
                                    className="px-4 py-2 bg-transparent hover:bg-white/5 text-ink border border-white/20 rounded-element text-sm font-medium transition-colors disabled:opacity-50"
                                    onClick={() => updateStatus(item.id, "MISSED")}
                                  >
                                    {t("missed") || "Missed"}</button>
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
      </main>
    </div>
  );
}

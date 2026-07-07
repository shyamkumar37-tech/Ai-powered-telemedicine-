import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchAdherence, fetchPatientReminders, updateReminderStatus } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import EmptyState from "../components/ui/EmptyState";
import { useToast } from "../components/ui/ToastProvider";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import ErrorStateCard from "../components/ui/ErrorStateCard";

export default function PatientRemindersPage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const { pushToast } = useToast();
  const patientId = auth.profileId;
  const [reminders, setReminders] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingReminderId, setUpdatingReminderId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const emptyRemindersMessage = translateDisplayText(
    language,
    "No medication reminders are active yet. Reminders will appear here after a prescription is created."
  );

  const parseScheduledDate = (value) => {
    if (!value) {
      return null;
    }
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const startOfToday = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const toEffectiveStatus = (item) => {
    if (!item) {
      return "PENDING";
    }
    if (item.status && item.status !== "PENDING") {
      return item.status;
    }
    const scheduled = parseScheduledDate(item.scheduledDate);
    if (!scheduled) {
      return item.status || "PENDING";
    }
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
      setError(getApiErrorMessage(new Error("missing-patient-id"), t("unableLoadReminders")));
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
      setError(getApiErrorMessage(err, t("unableLoadReminders")));
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
        title: t("reminders"),
        message: translateDisplayText(
          language,
          status === "TAKEN" ? "Reminder marked as taken." : "Reminder marked as missed."
        )
      });
      await load();
    } catch (err) {
      const message = getApiErrorMessage(err, translateUiText("Unable to update reminder status."));
      setError(message);
      pushToast({ type: "error", title: translateUiText("Unable to update reminder status."), message });
    } finally {
      setUpdatingReminderId(null);
    }
  };

  useEffect(() => {
    load();
  }, [patientId, language, t]);

  const filteredReminders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reminders.filter((item) => {
      const status = item.effectiveStatus || item.status || "PENDING";
      if (filter !== "All" && status !== filter.toUpperCase()) {
        return false;
      }
      if (!query) {
        return true;
      }
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

  return (
    <SectionCard title={`${t("medicationReminders")}${adherence ? ` - ${adherence.adherencePercentage}% ${t("adherence")}` : ""}`}>
      <div className="mb-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {["All", "Pending", "Taken", "Missed"].map((value) => {
            const active = filter === value;
            return (
              <button
                key={value}
                type="button"
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  active ? "bg-clinic text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:text-slate-800"
                }`}
                onClick={() => setFilter(value)}
                aria-label={translateDisplayText(language, value)}
                data-voice-label={translateDisplayText(language, value)}
              >
                {translateDisplayText(language, value)}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2">
          <span className="text-xs font-semibold text-slate-400">🔍</span>
          <input
            className="w-full bg-transparent text-sm text-slate-700 outline-none"
            placeholder={translateDisplayText(language, "Search medication")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label={translateDisplayText(language, "Search medication")}
            data-voice-label={translateDisplayText(language, "Search medication")}
          />
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{t("adherence")}</p>
          <div className="mt-4 flex items-center gap-4">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full text-sm font-semibold text-ink"
              style={{
                background: `conic-gradient(${adherencePercentage >= 60 ? "#10b981" : adherencePercentage >= 30 ? "#f59e0b" : "#ef4444"} ${adherencePercentage * 3.6}deg, #e2e8f0 0deg)`
              }}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-sm font-semibold text-ink">
                {Number.isFinite(adherencePercentage) ? `${adherencePercentage}%` : "0%"}
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-600">{translateDisplayText(language, "Adherence based on due reminders only.")}</p>
              <p className="mt-2 text-xs text-slate-500">{translateDisplayText(language, "Future reminders are excluded from adherence calculations.")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{translateDisplayText(language, "Reminder overview")}</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
              <p className="text-xs text-slate-500">{t("pending")}</p>
              <p className="mt-1 text-lg font-semibold text-ink">{reminders.filter((item) => (item.effectiveStatus || item.status) === "PENDING").length}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-3 py-3 text-center">
              <p className="text-xs text-emerald-600">{t("taken")}</p>
              <p className="mt-1 text-lg font-semibold text-emerald-700">{reminders.filter((item) => (item.effectiveStatus || item.status) === "TAKEN").length}</p>
            </div>
            <div className="rounded-2xl bg-rose-50 px-3 py-3 text-center">
              <p className="text-xs text-rose-600">{t("missed")}</p>
              <p className="mt-1 text-lg font-semibold text-rose-700">{reminders.filter((item) => (item.effectiveStatus || item.status) === "MISSED").length}</p>
            </div>
          </div>
        </div>
      </div>

      {loading && !reminders.length ? <LoadingSkeleton lines={4} /> : null}
      {error ? (
        <ErrorStateCard
          title={t("unableLoadReminders")}
          body={error}
          actionLabel={t("retry")}
          onAction={() => load()}
        />
      ) : null}
      {!loading && !error && !reminders.length ? (
        <EmptyState title={translateDisplayText(language, "No reminders yet")} description={emptyRemindersMessage} />
      ) : null}
      {!loading && !error && reminders.length && !filteredReminders.length ? (
        <EmptyState title={translateDisplayText(language, "No reminders match your filter")} description={translateDisplayText(language, "Try a different filter or clear the search input.")} />
      ) : null}

      <div className="space-y-5">
        {[
          { label: translateDisplayText(language, "Today"), items: groupedReminders.today },
          { label: translateDisplayText(language, "Yesterday"), items: groupedReminders.yesterday },
          { label: translateDisplayText(language, "This week"), items: groupedReminders.week },
          { label: translateDisplayText(language, "Older"), items: groupedReminders.older }
        ].map((group) => (
          group.items.length ? (
            <div key={group.label}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{group.label}</p>
              <div className="space-y-3">
                {group.items.map((item) => {
                  const status = item.effectiveStatus || item.status || "PENDING";
                  const actionable = status === "PENDING";
                  const dosage = item.dosage ? item.dosage : translateDisplayText(language, "Dose not set");
                  const frequency = item.frequency ? translateDisplayText(language, item.frequency) : translateDisplayText(language, "Frequency not set");
                  return (
                    <div key={`${item.id}-${item.scheduledDate}`} className="rounded-2xl bg-mist p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">{item.medicineName || translateDisplayText(language, "Medication")}</p>
                          <p className="text-sm text-slate-500">
                            {dosage} • {frequency} • {item.scheduledDate}
                          </p>
                        </div>
                        <Badge value={status} />
                      </div>
                      {actionable ? (
                        <div className="mt-3 flex gap-3">
                          <button
                            className="btn-primary"
                            disabled={updatingReminderId === item.id}
                            onClick={() => updateStatus(item.id, "TAKEN")}
                            aria-label={updatingReminderId === item.id ? t("saving") : t("markTaken")}
                            data-voice-label={updatingReminderId === item.id ? t("saving") : t("markTaken")}
                          >
                            {updatingReminderId === item.id ? t("saving") : t("markTaken")}
                          </button>
                          <button
                            className="btn-secondary"
                            disabled={updatingReminderId === item.id}
                            onClick={() => updateStatus(item.id, "MISSED")}
                            aria-label={updatingReminderId === item.id ? t("saving") : t("markMissed")}
                            data-voice-label={updatingReminderId === item.id ? t("saving") : t("markMissed")}
                          >
                            {updatingReminderId === item.id ? t("saving") : t("markMissed")}
                          </button>
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-slate-500">{translateDisplayText(language, "Status locked for completed reminders.")}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null
        ))}
      </div>
    </SectionCard>
  );
}

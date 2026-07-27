import { useEffect, useMemo, useState } from "react";
import {
  flushOfflineQueue,
  getOfflineQueueSnapshot,
  subscribeToOfflineQueue
} from "../services/api";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { translateDisplayText } from "../utils/i18n";
import { DynamicStateObject, DynamicState } from "./../types/DynamicState";

const COPY_BASE = {
  offlineTitle: "Offline sync is active",
  offlineBody: "You are offline. New changes will be stored locally as pending until the server confirms them.",
  queuedTitle: "Queued changes are waiting to sync",
  queuedBody: "{count} change(s) are pending server confirmation.",
  synced: "Queued changes were confirmed by the server.",
  syncFailed: "Sync is still pending. The changes were not confirmed by the server yet.",
  syncing: "Syncing now...",
  syncNow: "Sync now",
  pendingLabel: "Pending changes",
  recentItems: "Queued items",
  genericChange: "Pending change",
  triage: "Triage submission",
  appointment: "Appointment booking",
  consultation: "Consultation note",
  prescription: "Prescription update",
  reminder: "Reminder update",
  health: "Health reading",
  message: "Message",
  observation: "Observation upload"
};

function getLocalizedCopy(language: DynamicStateObject) {
  return Object.fromEntries(
    Object.entries(COPY_BASE).map(([key, value]: DynamicStateObject) => [key, translateDisplayText(language, value)])
  );
}

function formatMessage(template: DynamicStateObject, count: number | string) {
  return template.replace("{count}", String(count));
}

function describeQueuedItem(item: DynamicStateObject, text: DynamicStateObject) {
  const path = `${item?.url || ""}`.toLowerCase();
  if (path.includes("/triage")) return text.triage;
  if (path.includes("/appointments")) return text.appointment;
  if (path.includes("/consultations")) return text.consultation;
  if (path.includes("/prescriptions")) return text.prescription;
  if (path.includes("/reminders")) return text.reminder;
  if (path.includes("/health-records")) return text.health;
  if (path.includes("/messages")) return text.message;
  if (path.includes("/observations")) return text.observation;
  return text.genericChange;
}

export default function OfflineQueueBanner() {
  const { language } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const text = useMemo(() => getLocalizedCopy(language), [language]);
  const [queueState, setQueueState] = useState<DynamicState>(() => {
    const snapshot = getOfflineQueueSnapshot();
    return { size: snapshot.length, items: snapshot };
  });
  const [isOnline, setIsOnline] = useState<DynamicState>(typeof navigator === "undefined" ? true : navigator.onLine);
  const [syncing, setSyncing] = useState<DynamicState>(false);
  const [feedback, setFeedback] = useState<DynamicState>("");

  useEffect(() => subscribeToOfflineQueue((detail: DynamicStateObject) => {
    setQueueState(detail);
  }), []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return () => {};
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!queueState.size && feedback && typeof window !== "undefined") {
      const timer = window.setTimeout(() => setFeedback(""), 3200);
      return () => window.clearTimeout(timer);
    }
    return () => {};
  }, [feedback, queueState.size]);

  const visible = !isOnline || queueState.size > 0 || Boolean(feedback) || syncing;

  const bannerCopy = useMemo(() => {
    if (!isOnline) {
      return {
        title: text.offlineTitle,
        body: text.offlineBody
      };
    }

    if (syncing) {
      return {
        title: text.queuedTitle,
        body: text.syncing
      };
    }

    if (queueState.size > 0) {
      return {
        title: text.queuedTitle,
        body: formatMessage(text.queuedBody, queueState.size)
      };
    }

    if (feedback) {
      return {
        title: text.offlineTitle,
        body: feedback
      };
    }

    return { title: "", body: "" };
  }, [feedback, isOnline, queueState.size, syncing, text]);

  const handleFlush = async () => {
    setSyncing(true);
    setFeedback("");
    try {
      await flushOfflineQueue();
      if (getOfflineQueueSnapshot().length === 0) {
        setFeedback(text.synced);
      } else {
        setFeedback(text.syncFailed);
      }
    } catch {
      setFeedback(text.syncFailed);
    } finally {
      setSyncing(false);
    }
  };

  if (!visible) {
    return null;
  }

  const previewItems = queueState.items.slice(0, 3);

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm" role="status" aria-live="polite">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-semibold">{bannerCopy.title}</p>
          <p className="text-amber-900/90">{bannerCopy.body}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {queueState.size > 0 ? (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900">
              {text.pendingLabel}: {queueState.size}
            </span>
          ) : null}
          {isOnline && queueState.size > 0 ? (
            <button
              type="button"
              className="btn-secondary !border-amber-300 !bg-white !px-4 !py-2 !text-amber-950 hover:!border-amber-500"
              disabled={syncing}
              onClick={handleFlush}
              aria-label={syncing ? text.syncing : text.syncNow}
              data-voice-label={syncing ? text.syncing : text.syncNow}
            >
              {syncing ? text.syncing : text.syncNow}
            </button>
          ) : null}
        </div>
      </div>

      {previewItems.length ? (
        <div className="mt-3 rounded-2xl bg-white/70 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">{text.recentItems}</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-950/90">
            {previewItems.map((item: DynamicStateObject) => (
              <li key={item.id}>- {describeQueuedItem(item, text)}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

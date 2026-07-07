import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientTimeline } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import {
  deriveActor,
  deriveStatus,
  formatTimelineDate,
  formatRelativeTimelineDate,
  groupTimelineEvents,
  needsAction,
  normalizeTimelineDate
} from "../utils/timelineUtils";
import { Activity, Bell, CalendarDays, FileText, HeartPulse, MessageSquareText, Pill } from "lucide-react";

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      <div className="page-skeleton__block" aria-hidden="true" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`timeline-skeleton-${index}`} className="page-skeleton__card" aria-hidden="true" />
      ))}
    </div>
  );
}

export default function PatientTimelinePage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const patientId = auth.profileId;
  const [timeline, setTimeline] = useState([]);
  const [filter, setFilter] = useState("All");
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") {
      return "comfortable";
    }
    try {
      const stored = localStorage.getItem("telecareplus-timeline-view");
      return stored === "compact" || stored === "comfortable" ? stored : "comfortable";
    } catch {
      return "comfortable";
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchPatientTimeline(patientId)
      .then((data) => {
        setTimeline(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadTimeline"))))
      .finally(() => setLoading(false));
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

  const filterOptions = useMemo(() => ([
    { label: translateDisplayText(language, "All"), value: "All" },
    { label: translateDisplayText(language, "Appointments"), value: "APPOINTMENT" },
    { label: translateDisplayText(language, "Triage"), value: "TRIAGE" },
    { label: translateDisplayText(language, "Prescriptions"), value: "PRESCRIPTION" },
    { label: translateDisplayText(language, "Alerts"), value: "ALERT" }
  ]), [language]);

  const filteredTimeline = useMemo(() => {
    if (filter === "All") {
      return processedTimeline;
    }
    return processedTimeline.filter((item) => item.type === filter);
  }, [filter, processedTimeline]);

  const groupedByDate = useMemo(() => {
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
    const base = "h-4 w-4 text-slate-500";
    switch (type) {
      case "APPOINTMENT":
        return <CalendarDays className={base} />;
      case "TRIAGE":
        return <HeartPulse className={base} />;
      case "PRESCRIPTION":
        return <Pill className={base} />;
      case "HEALTH":
        return <Activity className={base} />;
      case "ALERT":
        return <Bell className={base} />;
      case "CONSULTATION":
        return <MessageSquareText className={base} />;
      default:
        return <FileText className={base} />;
    }
  };

  const renderStatusBadge = (status) => {
    if (!status) {
      return null;
    }
    const value = status.toUpperCase();
    const tone = value === "CONFIRMED" || value === "COMPLETED"
      ? "bg-emerald-100 text-emerald-700"
      : value === "REQUESTED" || value === "PENDING"
        ? "bg-amber-100 text-amber-700"
        : value === "CANCELLED" || value === "MISSED"
          ? "bg-rose-100 text-rose-700"
          : "bg-slate-100 text-slate-700";
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${tone}`}>
        {translateDisplayText(language, value)}
      </span>
    );
  };

  const compact = viewMode === "compact";

  return (
    <SectionCard title={t("unifiedTimeline")}>
      {loading ? <TimelineSkeleton /> : null}
      {error ? (
        <ErrorStateCard
          title={t("unableLoadTimeline")}
          body={error}
          actionLabel={t("retry")}
          onAction={() => {
            setLoading(true);
            fetchPatientTimeline(patientId)
              .then((data) => {
                setTimeline(Array.isArray(data) ? data : []);
                setError("");
              })
              .catch((err) => setError(getApiErrorMessage(err, t("unableLoadTimeline"))))
              .finally(() => setLoading(false));
          }}
        />
      ) : null}
      {!loading && !error && !timeline.length ? (
        <EmptyStateCard
          title={t("noTimeline")}
          body={translateDisplayText(language, "No recent continuity events were found.")}
        />
      ) : null}
      {!loading && !error && timeline.length ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const active = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  active ? "bg-clinic text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:text-slate-800"
                }`}
                onClick={() => setFilter(option.value)}
                aria-label={option.label}
                data-voice-label={option.label}
              >
                {option.label}
              </button>
            );
          })}
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-2 py-2">
            {[
              { label: translateDisplayText(language, "Comfortable view"), value: "comfortable" },
              { label: translateDisplayText(language, "Compact view"), value: "compact" }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  viewMode === option.value ? "bg-ink text-white" : "text-slate-500 hover:text-slate-700"
                }`}
                onClick={() => {
                  setViewMode(option.value);
                  try {
                    localStorage.setItem("telecareplus-timeline-view", option.value);
                  } catch {
                    // Ignore storage failures.
                  }
                }}
                aria-label={option.label}
                data-voice-label={option.label}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {!loading && !error && timeline.length && !filteredTimeline.length ? (
        <p className="text-sm text-slate-500">{translateDisplayText(language, "No timeline events match your filter.")}</p>
      ) : null}
      <div className={compact ? "space-y-3" : "space-y-6"}>
        {[
          { key: "today", label: translateDisplayText(language, "Today"), items: groupedByDate.today },
          { key: "yesterday", label: translateDisplayText(language, "Yesterday"), items: groupedByDate.yesterday },
          { key: "week", label: translateDisplayText(language, "Earlier this week"), items: groupedByDate.week },
          { key: "older", label: translateDisplayText(language, "Older"), items: groupedByDate.older }
        ].map((group) => (
          group.items.length ? (
            <div key={group.key}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{group.label}</p>
              <div className={compact ? "space-y-2" : "space-y-4"}>
                {group.items.map((item, index) => (
                  <div key={`${item.type}-${item.occurredAt}-${index}`} className={`rounded-2xl bg-mist ${compact ? "p-4" : "p-5"} ${item.actionNeeded ? "border border-amber-200" : ""}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 rounded-full bg-white shadow-sm ${compact ? "p-1.5" : "p-2"}`}>{renderTypeIcon(item.type)}</span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <LocalizedText as="p" className="font-semibold text-ink" value={item.title} />
                            {item.repeatCount && item.repeatCount > 1 ? (
                              <span className="rounded-full bg-white px-2 py-0.5 text-[0.65rem] font-semibold text-slate-600">
                                {translateDisplayText(language, "Repeated")} × {item.repeatCount}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-500">
                            <span className="font-semibold text-slate-600">{translateDisplayText(language, item.relativeDate)}</span>
                            <span className="mx-2 text-slate-400">•</span>
                            <span>{translateDisplayText(language, item.displayDate)}</span>
                          </p>
                          {!item.hasValidDate ? (
                            <p className="mt-1 text-xs text-amber-600">{translateDisplayText(language, "Timestamp needs review")}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{translateDisplayText(language, item.type)}</span>
                        {item.severity ? <Badge value={item.severity} /> : null}
                        {renderStatusBadge(item.status)}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {translateDisplayText(language, "Source")}: {translateDisplayText(language, item.actor)}
                      </span>
                      {item.actionNeeded ? (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          {translateDisplayText(language, "Needs action")}
                        </span>
                      ) : null}
                    </div>
                    <LocalizedText as="p" className="mt-3 text-sm text-slate-700" value={item.details} />
                  </div>
                ))}
              </div>
            </div>
          ) : null
        ))}
      </div>
    </SectionCard>
  );
}

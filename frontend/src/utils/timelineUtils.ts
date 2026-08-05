const MAX_FUTURE_DAYS = 365;
const MIN_YEAR = 2000;

export interface TimelineItem {
  id?: string | number;
  type?: string;
  title?: string;
  details?: string;
  occurredAt?: string | Date;
  severity?: string;
  repeatCount?: number;
  [key: string]: unknown;
}

function parseDateValue(value: string | number | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export function normalizeTimelineDate(value: string | number | Date, now = new Date()) {
  const parsed = parseDateValue(value);
  if (!parsed) {
    return { date: null, isValid: false, isSuspiciousFuture: false };
  }

  if (parsed.getFullYear() < MIN_YEAR) {
    return { date: null, isValid: false, isSuspiciousFuture: false };
  }

  const diffDays = (parsed.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  if (diffDays > MAX_FUTURE_DAYS) {
    return { date: null, isValid: false, isSuspiciousFuture: true };
  }

  return { date: parsed, isValid: true, isSuspiciousFuture: false };
}

export function formatTimelineDate(date: string | Date | null | undefined): string {
  if (!date) {
    return "Time unavailable";
  }
  const parsed = typeof date === "string" ? new Date(date) : date;
  return Number.isNaN(parsed.getTime()) ? "Time unavailable" : parsed.toLocaleString();
}

export function formatRelativeTimelineDate(date: Date | null | undefined, now = new Date()): string {
  if (!date || Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / (60 * 1000));
  const diffHours = Math.round(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 60) {
    return `${Math.max(diffMinutes, 1)} min ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }
  if (diffDays === 1) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  return date.toLocaleDateString();
}

export function deriveStatus(item: TimelineItem | null | undefined): string | null {
  if (!item?.title) {
    return null;
  }
  const match = item.title.match(/Appointment\s+([A-Z_]+)/i);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }
  return null;
}

export function deriveActor(item: TimelineItem | null | undefined): string {
  switch (item?.type) {
    case "TRIAGE":
      return "AI Triage";
    case "APPOINTMENT":
      return "Patient";
    case "CONSULTATION":
      return "Doctor";
    case "PRESCRIPTION":
      return "Doctor";
    case "HEALTH":
      return "Patient";
    case "ALERT":
      return "System";
    default:
      return "System event";
  }
}

export function needsAction(item: TimelineItem | null | undefined, status: string | null | undefined): boolean {
  if (item?.severity && ["CRITICAL", "WARNING"].includes(String(item.severity).toUpperCase())) {
    return true;
  }
  if (status && ["REQUESTED", "PENDING", "MISSED"].includes(status.toUpperCase())) {
    return true;
  }
  if (item?.type === "ALERT" && item?.severity && ["CRITICAL", "WARNING"].includes(String(item.severity).toUpperCase())) {
    return true;
  }
  return false;
}

export function groupTimelineEvents(items: TimelineItem[]): TimelineItem[] {
  const grouped: TimelineItem[] = [];
  const triageGroups = new Map<string, TimelineItem>();

  items.forEach((item: TimelineItem) => {
    if (item?.type === "TRIAGE") {
      const dateKey = item?.occurredAt ? String(item.occurredAt).slice(0, 10) : "unknown";
      const key = `${item.title || ""}|${item.details || ""}|${dateKey}`;
      if (!triageGroups.has(key)) {
        triageGroups.set(key, { ...item, repeatCount: 1 });
      } else {
        const existing = triageGroups.get(key)!;
        const existingDate = parseDateValue(existing?.occurredAt);
        const nextDate = parseDateValue(item?.occurredAt);
        const resolved = nextDate && (!existingDate || nextDate > existingDate) ? item : existing;
        triageGroups.set(key, {
          ...resolved,
          repeatCount: (existing.repeatCount || 1) + 1
        });
      }
      return;
    }
    grouped.push(item);
  });

  triageGroups.forEach((value: TimelineItem) => grouped.push(value));
  return grouped;
}

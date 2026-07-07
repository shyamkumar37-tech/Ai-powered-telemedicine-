import SectionCard from "../SectionCard";
import StatusBadge from "./StatusBadge";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../../context/LanguageContext";
import { translateDisplayText } from "../../utils/i18n";

const PRIORITY_CONFIG = {
  urgent: { tone: "danger", label: "Urgent" },
  review: { tone: "warning", label: "Needs review" },
  upcoming: { tone: "info", label: "Upcoming" },
  recent: { tone: "success", label: "Completed / Recent" }
};

export default function PriorityActionsCard({
  title,
  subtitle,
  actions = [],
  emptyTitle = "No urgent care actions right now",
  emptyBody = "You are up to date. Check back after your next update.",
  className = ""
}) {
  const { language } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const localizedSubtitle = subtitle ? translateDisplayText(language, subtitle) : "";
  const groups = actions.reduce((acc, action) => {
    const key = action.priority || "upcoming";
    if (!acc[key]) acc[key] = [];
    acc[key].push(action);
    return acc;
  }, {});

  const orderedGroups = ["urgent", "review", "upcoming", "recent"]
    .filter((key) => Array.isArray(groups[key]) && groups[key].length > 0)
    .map((key) => ({
      key,
      label: translateDisplayText(language, PRIORITY_CONFIG[key]?.label || "Upcoming"),
      tone: PRIORITY_CONFIG[key]?.tone || "info",
      items: groups[key]
    }));

  const hasActions = orderedGroups.length > 0;

  return (
    <SectionCard title={title} className={className}>
      {localizedSubtitle ? (
        <p className="mb-4 text-sm text-slate-600">{localizedSubtitle}</p>
      ) : null}
      {hasActions ? (
        <div className="space-y-4">
          {orderedGroups.map((group) => (
            <div key={group.key} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{group.label}</p>
                <StatusBadge tone={group.tone}>{group.items.length}</StatusBadge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                      {item.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-ink">{item.title}</p>
                        {item.status ? (
                          <StatusBadge tone={item.statusTone || "default"} className="text-[11px]">
                            {item.status}
                          </StatusBadge>
                        ) : null}
                      </div>
                      {item.description ? (
                        <p className="text-sm text-slate-600">{item.description}</p>
                      ) : null}
                      {item.meta ? (
                        <p className="text-xs text-slate-500">{item.meta}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-4 text-sm text-emerald-700">
          <p className="font-semibold">{translateDisplayText(language, emptyTitle)}</p>
          <p className="mt-1 text-xs text-emerald-600">{translateDisplayText(language, emptyBody)}</p>
        </div>
      )}
    </SectionCard>
  );
}

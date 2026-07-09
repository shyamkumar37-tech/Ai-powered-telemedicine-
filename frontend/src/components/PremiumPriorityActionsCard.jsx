import React from "react";
import PremiumSectionCard from "./PremiumSectionCard";

const PRIORITY_CONFIG = {
  urgent: { badgeClass: "doc-badge-alert", label: "Urgent" },
  review: { badgeClass: "doc-badge-warn", label: "Needs review" },
  upcoming: { badgeClass: "doc-badge-accent", label: "Upcoming" },
  recent: { badgeClass: "doc-badge-neutral", label: "Completed" }
};

export default function PremiumPriorityActionsCard({ title, subtitle, actions = [], emptyTitle, emptyBody, className = "" }) {
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
      label: PRIORITY_CONFIG[key]?.label || "Upcoming",
      badgeClass: PRIORITY_CONFIG[key]?.badgeClass || "doc-badge-neutral",
      items: groups[key]
    }));

  const hasActions = orderedGroups.length > 0;

  return (
    <PremiumSectionCard title={title} className={className}>
      {subtitle && <p className="mb-6 text-sm text-slate-400">{subtitle}</p>}
      
      {hasActions ? (
        <div className="space-y-6">
          {orderedGroups.map((group) => (
            <div key={group.key} className="space-y-3">
              <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{group.label}</p>
                <span className="text-xs font-semibold text-slate-500">{group.items.length}</span>
              </div>
              
              <div className="doc-grid-2">
                {group.items.map((item) => (
                  <div key={item.id} className="flex gap-4 rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10 hover:border-white/10 cursor-pointer">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-400/10 text-teal-400 border border-teal-400/20 shadow-[0_0_15px_rgba(45,212,191,0.1)]">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                        {item.status && (
                          <span className={`doc-badge ${item.statusTone === 'danger' ? 'doc-badge-alert' : item.statusTone === 'warning' ? 'doc-badge-warn' : item.statusTone === 'success' ? 'doc-badge-success' : 'doc-badge-accent'} text-[10px] px-2 py-0.5`}>
                            {item.status}
                          </span>
                        )}
                      </div>
                      {item.description && <p className="truncate text-sm text-slate-300">{item.description}</p>}
                      {item.meta && <p className="truncate text-xs text-slate-500">{item.meta}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-white/5 p-6 text-center">
          <p className="text-sm font-semibold text-slate-300">{emptyTitle}</p>
          <p className="mt-1 text-xs text-slate-500">{emptyBody}</p>
        </div>
      )}
    </PremiumSectionCard>
  );
}

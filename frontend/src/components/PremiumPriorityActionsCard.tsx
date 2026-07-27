import { DynamicState, DynamicStateObject } from "./../types/DynamicState";
import PremiumSectionCard from "./PremiumSectionCard";

const PRIORITY_CONFIG = {
  urgent: { badgeClass: "bg-alert/10 text-alert border border-alert/20", label: "Urgent" },
  review: { badgeClass: "bg-amber-500/10 text-amber-400 border border-amber-500/20", label: "Needs review" },
  upcoming: { badgeClass: "bg-primary/10 text-primary border border-primary/20", label: "Upcoming" },
  recent: { badgeClass: "bg-white/5 text-ink-muted border border-white/10", label: "Completed" }
};

export interface PremiumPriorityActionsCardProps {
  title?: DynamicState;
  subtitle?: DynamicState;
  actions?: DynamicState;
  emptyTitle?: DynamicState;
  emptyBody?: DynamicState;
  className?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function PremiumPriorityActionsCard({ title, subtitle, actions = [], emptyTitle, emptyBody, className = "" }: PremiumPriorityActionsCardProps) {
  const groups = actions.reduce((acc: DynamicStateObject, action: DynamicStateObject) => {
    const key = action.priority || "upcoming";
    if (!(acc as DynamicStateObject)[key]) (acc as DynamicStateObject)[key] = [];
    (acc as DynamicStateObject)[key].push(action);
    return acc;
  }, {});

  const orderedGroups = ["urgent", "review", "upcoming", "recent"]
    .filter((key: DynamicStateObject) => Array.isArray((groups as DynamicStateObject)[key]) && (groups as DynamicStateObject)[key].length > 0)
    .map((key: DynamicStateObject) => ({
      key,
      label: (PRIORITY_CONFIG as DynamicStateObject)[key]?.label || "Upcoming",
      badgeClass: (PRIORITY_CONFIG as DynamicStateObject)[key]?.badgeClass || "bg-white/5 text-ink-muted border border-white/10",
      items: (groups as DynamicStateObject)[key]
    }));

  const hasActions = orderedGroups.length > 0;

  return (
    <PremiumSectionCard title={title} className={className}>
      {subtitle && <p className="mb-6 text-sm text-ink-muted/80">{subtitle}</p>}
      
      {hasActions ? (
        <div className="space-y-6">
          {orderedGroups.map((group: DynamicStateObject) => (
            <div key={group.key} className="space-y-3">
              <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">{group.label}</p>
                <span className="text-xs font-semibold text-ink-muted">{group.items.length}</span>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                {group.items.map((item: DynamicStateObject) => (
                  <div key={item.id} className="flex gap-4 rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10 hover:border-white/10 cursor-pointer">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      item.statusTone === 'danger' ? 'bg-alert/10 text-alert shadow-[0_0_15px_rgba(225,29,72,0.1)]' : 
                      item.statusTone === 'warning' ? 'bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 
                      item.statusTone === 'success' ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(13,148,136,0.1)]' : 
                      'bg-sky-500/10 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.1)]'
                    }`}>
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                        {item.status && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider ${
                            item.statusTone === 'danger' ? 'bg-alert/20 text-alert' : 
                            item.statusTone === 'warning' ? 'bg-amber-500/20 text-amber-400' : 
                            item.statusTone === 'success' ? 'bg-primary/20 text-primary' : 
                            'bg-sky-500/20 text-sky-400'
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </div>
                      {item.description && <p className="truncate text-sm text-ink/90">{item.description}</p>}
                      {item.meta && <p className="truncate text-xs text-ink-muted/80">{item.meta}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-white/5 p-6 text-center">
          <p className="text-sm font-semibold text-ink/90">{emptyTitle}</p>
          <p className="mt-1 text-xs text-ink-muted">{emptyBody}</p>
        </div>
      )}
    </PremiumSectionCard>
  );
}

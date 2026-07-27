import { DynamicState, DynamicStateObject } from "./../types/DynamicState";
import LocalizedText from "./LocalizedText";

export interface StatCardProps {
  title?: DynamicState;
  value?: DynamicState;
  hint?: DynamicState;
  icon?: DynamicState;
  className?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function StatCard({ title, value, hint, icon, className = "" }: StatCardProps) {
  return (
    <div className={`glass-card tc-card dashboard-stat ${className}`.trim()}>
      <div className="flex items-center justify-between">
        <LocalizedText as="p" className="text-sm font-medium text-slate-500" value={title} minLength={4} />
        {icon ? (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-[0.65rem] font-semibold tracking-[0.2em] text-slate-500">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
      <LocalizedText as="p" className="mt-2 text-xs text-slate-500" value={hint} minLength={4} />
    </div>
  );
}

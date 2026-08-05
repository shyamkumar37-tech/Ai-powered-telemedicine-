import { DynamicState } from "./../types/DynamicState";

export interface PremiumStatCardProps {
  title?: DynamicState;
  value?: DynamicState;
  hint?: DynamicState;
  icon?: DynamicState;
  progress?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function PremiumStatCard({ title, value, hint, icon, progress }: PremiumStatCardProps) {
  return (
    <div className="card-premium !bg-surface flex flex-col justify-between hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-ink-muted mb-1">{title}</p>
          <h3 className="font-display text-3xl font-medium text-ink tracking-tight">{value}</h3>
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
            {icon}
          </div>
        )}
      </div>
      
      {progress !== undefined && (
        <div className="mt-5 mb-1">
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)] transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
            />
          </div>
        </div>
      )}
      
      {hint && (
        <p className="mt-3 text-[11px] font-semibold text-ink-muted uppercase tracking-widest">{hint}</p>
      )}
    </div>
  );
}

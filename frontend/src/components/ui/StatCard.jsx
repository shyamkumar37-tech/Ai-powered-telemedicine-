export default function StatCard({ title, value, hint, icon }) {
  return (
    <div className="glass-card dashboard-stat p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {icon ? (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-[0.65rem] font-semibold tracking-[0.2em] text-slate-500">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

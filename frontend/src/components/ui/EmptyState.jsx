export default function EmptyState({ title = "No data available", description, action }) {
  return (
    <div className="glass-card tc-card tc-state-card flex flex-col items-start gap-3 text-slate-600">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

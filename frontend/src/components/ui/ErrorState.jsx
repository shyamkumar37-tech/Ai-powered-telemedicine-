export default function ErrorState({ title = "Something went wrong", description, action }) {
  return (
    <div className="glass-card border border-red-100 bg-red-50/80 p-6 text-red-700">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-400">Error</p>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      {description ? <p className="mt-2 text-sm text-red-600">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

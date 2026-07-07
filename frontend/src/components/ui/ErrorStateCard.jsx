export default function ErrorStateCard({ title = "Something went wrong", body = "Please try again.", actionLabel = "Retry", onAction }) {
  return (
    <div className="glass-card tc-card tc-state-card">
      <div className="error-state__icon" aria-hidden="true" />
      <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
      {onAction ? (
        <button className="btn-primary mt-4" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

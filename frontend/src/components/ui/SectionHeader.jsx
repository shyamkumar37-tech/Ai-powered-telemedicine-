export default function SectionHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={`tc-page-header flex flex-wrap items-center justify-between ${className}`.trim()}>
      <div className="tc-page-header__copy">
        <p className="tc-page-eyebrow text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">TeleCare+</p>
        <h2 className="tc-page-title mt-2 text-2xl font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="tc-page-subtitle mt-2 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="tc-page-header__action">{action}</div> : null}
    </div>
  );
}

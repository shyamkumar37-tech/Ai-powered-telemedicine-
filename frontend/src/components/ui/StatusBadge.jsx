export default function StatusBadge({ tone = "default", children, className = "" }) {
  const tones = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700"
  };
  const classes = [
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
    tones[tone] || tones.default,
    className
  ].join(" ");

  return <span className={classes}>{children}</span>;
}

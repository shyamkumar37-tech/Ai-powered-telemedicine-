import { useId } from "react";

export default function Select({
  label,
  helperText,
  error,
  className = "",
  children,
  ...props
}) {
  const fieldId = useId();
  const helperId = helperText ? `${fieldId}-helper` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <label className="block space-y-2" htmlFor={fieldId}>
      {label ? <span className="text-sm font-medium text-slate-600">{label}</span> : null}
      <select
        id={fieldId}
        className={`field ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      >
        {children}
      </select>
      {helperText ? <span id={helperId} className="text-xs text-slate-500">{helperText}</span> : null}
      {error ? <span id={errorId} className="text-xs text-red-600" role="alert">{error}</span> : null}
    </label>
  );
}

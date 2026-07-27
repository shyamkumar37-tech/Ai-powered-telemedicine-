import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { useId } from "react";

export interface InputProps {
  label?: DynamicState;
  helperText?: DynamicState;
  error?: DynamicState;
  leading?: DynamicState;
  trailing?: DynamicState;
  className?: DynamicState;
  props?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function Input({
  label,
  helperText,
  error,
  leading,
  trailing,
  className = "",
  ...props
}: InputProps) {
  const fieldId = useId();
  const helperId = helperText ? `${fieldId}-helper` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <label className="block space-y-2" htmlFor={fieldId}>
      {label ? <span className="text-sm font-medium text-slate-600">{label}</span> : null}
      <div className="relative">
        {leading ? <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">{leading}</span> : null}
        <input
          id={fieldId}
          className={`field ${leading ? "pl-10" : ""} ${trailing ? "pr-10" : ""} ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
        {trailing ? <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">{trailing}</span> : null}
      </div>
      {helperText ? <span id={helperId} className="text-xs text-slate-500">{helperText}</span> : null}
      {error ? <span id={errorId} className="text-xs text-red-600" role="alert">{error}</span> : null}
    </label>
  );
}

import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { useId } from "react";

export interface TextareaProps {
  label?: DynamicState;
  helperText?: DynamicState;
  error?: DynamicState;
  className?: DynamicState;
  props?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function Textarea({
  label,
  helperText,
  error,
  className = "",
  ...props
}: TextareaProps) {
  const fieldId = useId();
  const helperId = helperText ? `${fieldId}-helper` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <label className="block space-y-2" htmlFor={fieldId}>
      {label ? <span className="text-sm font-medium text-slate-600">{label}</span> : null}
      <textarea
        id={fieldId}
        className={`field min-h-28 resize-y ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      />
      {helperText ? <span id={helperId} className="text-xs text-slate-500">{helperText}</span> : null}
      {error ? <span id={errorId} className="text-xs text-red-600" role="alert">{error}</span> : null}
    </label>
  );
}

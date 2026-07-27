import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { ReactNode } from "react";

export interface StatusBadgeProps {
  tone?: DynamicState;
  children?: ReactNode;
  className?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function StatusBadge({ tone = "default", children, className = "" }: StatusBadgeProps) {
  const tones = {
    default: "border border-slate-700/50 bg-slate-800/50 text-slate-300",
    success: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    warning: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
    danger: "border border-rose-500/30 bg-rose-500/10 text-rose-400",
    info: "border border-blue-500/30 bg-blue-500/10 text-blue-400"
  };
  const classes = [
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
    (tones as DynamicStateObject)[tone] || tones.default,
    className
  ].join(" ");

  return <span className={classes}>{children}</span>;
}

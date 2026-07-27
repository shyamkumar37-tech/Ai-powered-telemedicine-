import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { ReactNode } from "react";

const toneClasses = {
  default: "border-slate-700/50 bg-slate-800/50 text-slate-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  danger: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-400"
};

export interface BadgeProps {
  tone?: DynamicState;
  className?: DynamicState;
  children?: ReactNode;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function Badge({ tone = "default", className = "", children }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.08em]",
        (toneClasses as DynamicStateObject)[tone] || toneClasses.default,
        className
      ].join(" ")}
    >
      {children}
    </span>
  );
}

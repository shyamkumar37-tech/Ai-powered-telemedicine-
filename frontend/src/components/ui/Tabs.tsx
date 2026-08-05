import { DynamicState } from "./../../types/DynamicState";
import { ReactNode } from "react";

export interface TabsProps {
  className?: DynamicState;
  children?: ReactNode;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export function Tabs({ className = "", children }: TabsProps) {
  return (
    <div className={`grid grid-cols-2 gap-2 rounded-[1.1rem] bg-slate-100/80 p-1 ${className}`.trim()}>
      {children}
    </div>
  );
}

export interface TabProps {
  active?: DynamicState;
  className?: DynamicState;
  props?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export function Tab({ active, className = "", ...props }: TabProps) {
  const classes = [
    "rounded-[1rem] px-4 py-3 text-sm font-semibold transition",
    active ? "bg-clinic text-white shadow-lg shadow-teal-200/40" : "text-slate-600 hover:text-slate-800",
    className
  ].join(" ");
  return <button type="button" className={classes} {...props} />;
}

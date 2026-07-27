import { DynamicState, DynamicStateObject } from "./../types/DynamicState";
import { ReactNode } from "react";

export interface PremiumSectionCardProps {
  title?: DynamicState;
  action?: DynamicState;
  children?: ReactNode;
  className?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function PremiumSectionCard({ title, action, children, className = "" }: PremiumSectionCardProps) {
  return (
    <section className={`card-premium !bg-surface flex flex-col ${className}`.trim()}>
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        {typeof title === "string" ? (
          <h2 className="font-display text-lg font-medium text-ink tracking-tight">{title}</h2>
        ) : (
          <div className="font-display text-lg font-medium text-ink tracking-tight">{title}</div>
        )}
        {action && <div>{action}</div>}
      </div>
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </section>
  );
}

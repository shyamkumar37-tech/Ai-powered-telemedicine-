import { DynamicState } from "./../types/DynamicState";
import { ReactNode } from "react";

export interface PharmacistPremiumCardProps {
  title?: DynamicState;
  action?: DynamicState;
  children?: ReactNode;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function PharmacistPremiumCard({ title, action, children }: PharmacistPremiumCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--ph-panel)] shadow-lg overflow-hidden group">
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-white/5 px-6 py-5 group-hover:bg-white/10 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

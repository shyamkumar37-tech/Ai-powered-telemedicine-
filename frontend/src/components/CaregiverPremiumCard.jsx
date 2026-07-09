import React from "react";

export default function CaregiverPremiumCard({ title, action, children, className = "" }) {
  return (
    <section className={`cg-card ${className}`.trim()}>
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        {typeof title === "string" ? (
          <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
        ) : (
          <div className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">{title}</div>
        )}
        {action && <div>{action}</div>}
      </div>
      {children}
    </section>
  );
}

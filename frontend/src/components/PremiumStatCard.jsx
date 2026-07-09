import React from "react";

export default function PremiumStatCard({ title, value, hint, icon, progress }) {
  return (
    <div className="doc-card flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-semibold text-white tracking-tight">{value}</h3>
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-teal-400 border border-white/10">
            {icon}
          </div>
        )}
      </div>
      
      {progress !== undefined && (
        <div className="mt-4">
          <div className="doc-progress-track">
            <div 
              className="doc-progress-fill" 
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
            />
          </div>
        </div>
      )}
      
      {hint && (
        <p className="mt-4 text-xs font-medium text-slate-500 uppercase tracking-wider">{hint}</p>
      )}
    </div>
  );
}

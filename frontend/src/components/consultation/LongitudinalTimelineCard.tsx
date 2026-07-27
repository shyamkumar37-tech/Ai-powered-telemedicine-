import { useLanguage } from "../../context/LanguageContext";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../utils/queryKeys";
import PremiumSectionCard from "../PremiumSectionCard";
import { Activity } from "lucide-react";
import { fetchHealthRecords, fetchPatientTimeline } from "../../services/telecareService";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Brush } from "recharts";
import { Pill, Syringe, ClipboardPlus, Stethoscope, AlertTriangle } from "lucide-react";
import { DynamicStateObject, DynamicState } from "./../../types/DynamicState";

export interface LongitudinalTimelineCardProps {
  patientId?: string | number;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function LongitudinalTimelineCard({ patientId }: LongitudinalTimelineCardProps) {
  const { t } = useLanguage();
  const [metric, setMetric] = useState<DynamicState>("bp"); // bp, glucose, weight, hr
  const [viewMode, setViewMode] = useState<DynamicState>("vitals"); // vitals, events

  const { data = [], isLoading: loading } = useQuery({
    // @ts-expect-error - Auto-suppressed during migration
    queryKey: queryKeys.patient.vitals(patientId),
    queryFn: async () => {
      // @ts-expect-error - Auto-suppressed during migration
      const records = await fetchHealthRecords(patientId);
      const sorted = [...records]
        // @ts-expect-error - Auto-suppressed during migration
        .sort((a: DynamicStateObject, b: DynamicStateObject) => new Date(a.recordedAt) - new Date(b.recordedAt))
        .slice(-30);

      return sorted.map((r: DynamicStateObject, i: DynamicStateObject) => {
        const sys = r.bloodPressure ? parseInt((r.bloodPressure.split('/') as DynamicStateObject)[0]) : null;
        const dia = r.bloodPressure ? parseInt((r.bloodPressure.split('/') as DynamicStateObject)[1]) : null;
        return {
          day: i,
          date: new Date(r.recordedAt).toLocaleDateString(),
          bpSys: sys || 120, 
          bpDia: dia || 80,
          glucose: r.sugar || 100,
          weight: r.weight || 70,
          hr: r.heartRate || 70
        };
      });
    },
    enabled: !!patientId && viewMode === "vitals"
  });

  const { data: timelineEvents = [], isLoading: loadingEvents } = useQuery({
    // @ts-expect-error - Auto-suppressed during migration
    queryKey: [...queryKeys.patient.vitals(patientId), "timeline-events"],
    // @ts-expect-error - Auto-suppressed during migration
    queryFn: () => fetchPatientTimeline(patientId),
    enabled: !!patientId && viewMode === "events"
  });

  const getChartContent = () => {
    if (loading) {
       return <div className="h-64 mt-4 flex items-center justify-center text-tcd-text-muted">{t("loadingChart") || "Loading chart..."}</div>;
    }

    let color = "#0D9488"; // primary
    if (metric === "bp") color = "#8b5cf6"; // purple
    else if (metric === "glucose") color = "#f59e0b"; // amber
    else if (metric === "weight") color = "#e11d48"; // rose
    else if (metric === "hr") color = "#fb7185"; // rose-400

    const CustomTooltip = ({ active, payload }: DynamicStateObject) => {
      if (active && payload && payload.length) {
        const d = (payload as DynamicStateObject)[0].payload;
        return (
          <div className="bg-surface border border-white/10 p-3 text-xs rounded-xl z-10 shadow-xl">
            <p className="text-ink-muted mb-1 font-semibold uppercase tracking-widest text-[10px]">Date: {d.date}</p>
            <p className="font-bold text-ink text-sm">
              {metric === "bp" && `${Math.round(d.bpSys)}/${Math.round(d.bpDia)} mmHg`}
              {metric === "glucose" && `${Math.round(d.glucose)} mg/dL`}
              {metric === "weight" && `${Math.round(d.weight)} kg`}
              {metric === "hr" && `${Math.round(d.hr)} bpm`}
            </p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="h-64 mt-4 bg-white/5 border border-white/10 rounded-xl p-2 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {metric === "bp" ? (
              <>
                <Area type="monotone" dataKey="bpSys" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMetric)" />
                <Area type="monotone" dataKey="bpDia" stroke="#c4b5fd" fillOpacity={0.5} fill="url(#colorMetric)" />
              </>
            ) : (
              <Area type="monotone" dataKey={metric === "hr" ? "hr" : metric === "glucose" ? "glucose" : "weight"} stroke={color} fillOpacity={1} fill="url(#colorMetric)" />
            )}
            <Brush dataKey="date" height={20} stroke="#475569" fill="#0f172a" tickFormatter={() => ''} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const getTimelineContent = () => {
    if (loadingEvents) {
       return <div className="h-64 mt-4 flex items-center justify-center text-tcd-text-muted">{t("loadingTimeline") || "Loading timeline..."}</div>;
    }
    
    if (timelineEvents.length === 0) {
      return <div className="h-64 mt-4 flex items-center justify-center text-tcd-text-muted">{t("noMajorMedicalEventsRecorded") || "No major medical events recorded."}</div>;
    }

    const getIcon = (type: DynamicStateObject) => {
      switch (type?.toLowerCase()) {
        case "prescription": return <Pill className="w-4 h-4 text-primary" />;
        case "surgery": return <Syringe className="w-4 h-4 text-doc-alert" />;
        case "diagnosis": return <ClipboardPlus className="w-4 h-4 text-doc-warn" />;
        case "alert": return <AlertTriangle className="w-4 h-4 text-doc-alert" />;
        default: return <Stethoscope className="w-4 h-4 text-doc-success" />;
      }
    };

    return (
      <div className="mt-4 max-h-64 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {timelineEvents.map((event: DynamicStateObject, idx: DynamicStateObject) => (
          <div key={idx} className="relative pl-6 before:absolute before:left-[11px] before:top-6 before:bottom-[-24px] before:w-0.5 before:bg-white/5 last:before:hidden">
            <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-surface border border-white/10 flex items-center justify-center shadow-lg z-10">
              {getIcon(event.type)}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-semibold text-ink">{event.title}</h4>
                <span className="text-[10px] uppercase tracking-wider text-ink-muted">{new Date(event.occurredAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">{event.details}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <PremiumSectionCard 
      title="Longitudinal Timeline" 
      icon={<Activity className="w-5 h-5 text-primary" />}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
          <button
            onClick={() => setViewMode("vitals")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors uppercase tracking-widest ${
              viewMode === "vitals" ? "bg-primary text-canvas shadow-sm" : "text-ink-muted hover:text-ink hover:bg-white/10"
            }`}
          >
            {t("vitalsTrend") || "Vitals Trend"}</button>
          <button
            onClick={() => setViewMode("events")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors uppercase tracking-widest ${
              viewMode === "events" ? "bg-primary text-canvas shadow-sm" : "text-ink-muted hover:text-ink hover:bg-white/10"
            }`}
          >
            {t("medicalEvents") || "Medical Events"}</button>
        </div>
        
        {viewMode === "vitals" && (
          <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
            {["bp", "glucose", "weight", "hr"].map((m: DynamicStateObject) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors uppercase tracking-widest ${
                  metric === m 
                    ? "bg-white/20 text-ink shadow-sm" 
                    : "text-ink-muted hover:text-ink hover:bg-white/10"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>
      {viewMode === "vitals" ? getChartContent() : getTimelineContent()}
    </PremiumSectionCard>
  );
}

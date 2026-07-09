import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../utils/queryKeys";
import PremiumSectionCard from "../PremiumSectionCard";
import { Activity } from "lucide-react";
import { fetchHealthRecords } from "../../services/telecareService";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Brush } from "recharts";

export default function LongitudinalTimelineCard({ patientId }) {
  const [metric, setMetric] = useState("bp"); // bp, glucose, weight, hr

  const { data = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.patient.vitals(patientId),
    queryFn: async () => {
      const records = await fetchHealthRecords(patientId);
      const sorted = [...records]
        .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
        .slice(-30);

      return sorted.map((r, i) => {
        const sys = r.bloodPressure ? parseInt(r.bloodPressure.split('/')[0]) : null;
        const dia = r.bloodPressure ? parseInt(r.bloodPressure.split('/')[1]) : null;
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
    enabled: !!patientId
  });

  const getChartContent = () => {
    if (loading) {
       return <div className="h-64 mt-4 flex items-center justify-center text-tcd-text-muted">Loading chart...</div>;
    }

    let color = "#14b8a6"; // tcd-teal
    if (metric === "bp") color = "#8b5cf6"; // tcd-purple
    else if (metric === "glucose") color = "#f59e0b"; // tcd-amber
    else if (metric === "weight") color = "#f43f5e"; // tcd-coral
    else if (metric === "hr") color = "#fb7185"; // rose-400

    const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
          <div className="bg-tcd-panel border border-tcd-panel-line p-2 text-xs rounded z-10 shadow-lg">
            <p className="text-tcd-text-secondary mb-1">Date: {d.date}</p>
            <p className="font-semibold text-tcd-text-primary">
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
      <div className="h-64 mt-4 bg-tcd-ink-2 border border-tcd-panel-line-strong rounded-lg p-2">
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

  return (
    <PremiumSectionCard 
      title="Longitudinal Timeline" 
      icon={<Activity className="w-5 h-5 text-tcd-teal" />}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex bg-tcd-panel-2 rounded-md border border-tcd-panel-line p-1">
          {["bp", "glucose", "weight", "hr"].map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors uppercase ${
                metric === m 
                  ? "bg-tcd-teal text-tcd-ink shadow-sm" 
                  : "text-tcd-text-muted hover:text-tcd-text-primary hover:bg-tcd-panel-line"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {getChartContent()}
    </PremiumSectionCard>
  );
}

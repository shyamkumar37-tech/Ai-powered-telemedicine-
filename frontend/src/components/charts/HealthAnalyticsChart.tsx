import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { useState } from 'react';
import { useLanguage } from "../../context/LanguageContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Droplets } from 'lucide-react';

export interface CustomTooltipProps {
  active?: DynamicState;
  payload?: DynamicState;
  label?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0B1121]/90 border border-emerald-500/20 p-3 rounded-xl shadow-2xl backdrop-blur-xl">
        <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">{label}</p>
        {payload.map((entry: DynamicStateObject, index: number | string) => (
          <div key={index} className="flex items-center gap-3 text-sm font-medium mt-1">
            <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }}></span>
            <span className="text-white text-base">{entry.value}</span>
            <span className="text-slate-500 text-xs">{entry.name === 'Heart Rate' ? 'bpm' : 'mg/dL'}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export interface HealthAnalyticsChartProps {
  data?: DynamicState;
  height?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function HealthAnalyticsChart({ data, height = 300 }: HealthAnalyticsChartProps) {
  const { t } = useLanguage();
  const [activeMetric, setActiveMetric] = useState<DynamicState>('heartRate'); // 'heartRate' or 'glucose'

  // Generate some realistic-looking mock data if none is provided
  const chartData = data || [
    { name: 'Mon', heartRate: 72, glucose: 95 },
    { name: 'Tue', heartRate: 75, glucose: 98 },
    { name: 'Wed', heartRate: 71, glucose: 102 },
    { name: 'Thu', heartRate: 78, glucose: 97 },
    { name: 'Fri', heartRate: 74, glucose: 94 },
    { name: 'Sat', heartRate: 82, glucose: 105 },
    { name: 'Sun', heartRate: 70, glucose: 92 },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <button 
          onClick={() => setActiveMetric('heartRate')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            activeMetric === 'heartRate' 
              ? 'bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--primary)]/20' 
              : 'text-[var(--tc-text-muted)] hover:text-white'
          }`}
        >
          <Activity size={14} /> {t("heartRate") || "Heart Rate"}</button>
        <button 
          onClick={() => setActiveMetric('glucose')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            activeMetric === 'glucose' 
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
              : 'text-[var(--tc-text-muted)] hover:text-white'
          }`}
        >
          <Droplets size={14} /> {t("glucose") || "Glucose"}</button>
      </div>
      
      <div style={{ height, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeMetric === 'heartRate' ? 'var(--primary)' : '#3b82f6'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={activeMetric === 'heartRate' ? 'var(--primary)' : '#3b82f6'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--tc-border)" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--tc-text-muted)', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--tc-text-muted)', fontSize: 12 }}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--tc-border-strong)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area 
              type="monotone" 
              dataKey={activeMetric} 
              name={activeMetric === 'heartRate' ? 'Heart Rate' : 'Glucose'}
              stroke={activeMetric === 'heartRate' ? 'var(--primary)' : '#3b82f6'} 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorMetric)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

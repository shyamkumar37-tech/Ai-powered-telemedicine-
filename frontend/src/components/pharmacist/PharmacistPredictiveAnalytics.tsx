import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { useLanguage } from "../../context/LanguageContext";
import { useState, useEffect } from "react";
import PharmacistPremiumCard from "../PharmacistPremiumCard";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { TrendingDown, Loader2 } from "lucide-react";
import { getSupplyPrediction } from "../../ai/services/aiService";
import { useAuth } from "../../context/AuthContext";

export interface PharmacistPredictiveAnalyticsProps {
  inventoryItems?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function PharmacistPredictiveAnalytics({ inventoryItems }: PharmacistPredictiveAnalyticsProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<DynamicStateObject[]>([]);
  const [loading, setLoading] = useState<DynamicState>(true);
  const { auth } = useAuth();

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        // Fallback to "1" if auth.user is missing just for safety
        const result = await getSupplyPrediction(auth?.user?.id || "1");
        setData(result);
      } catch (err: DynamicStateObject) {
        console.error("Failed to fetch predictive supply analytics", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (inventoryItems && inventoryItems.length > 0) {
      fetchPrediction();
    }
  }, [inventoryItems, auth]);

  if (!inventoryItems || inventoryItems.length === 0) return null;

  const colors = ["#0ea5e9", "#f43f5e", "#10b981"]; // sky, rose, emerald

  const CustomTooltip = ({ active, payload, label }: DynamicStateObject) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-white/10 p-3 text-xs rounded-xl shadow-xl">
          <p className="text-ink-muted mb-2 font-semibold uppercase tracking-widest text-[10px]">{label}</p>
          {payload.map((p: DynamicStateObject, i: DynamicStateObject) => (
            <p key={i} className="font-bold text-sm mb-1" style={{ color: p.color }}>
              {p.name}: {p.value} units
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <PharmacistPremiumCard
      title={
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-sky-400" />
          <span>AI Supply Chain Prediction (30-Day Forecast)</span>
        </div>
      }
    >
      {loading ? (
        <div className="h-[300px] flex flex-col items-center justify-center text-sky-400/50">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-xs font-bold uppercase tracking-widest animate-pulse">{t("computingDepletionVectors") || "Computing Depletion Vectors..."}</p>
        </div>
      ) : (
        <div className="h-[300px] mt-4 bg-slate-900/40 rounded-xl p-4 border border-white/5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
              
              {data.length > 0 && Object.keys(data[0]).filter((k: DynamicStateObject) => k !== 'day' && k !== 'date').map((medName: DynamicStateObject, idx: DynamicStateObject) => (
                <Line 
                  key={medName}
                  type="monotone" 
                  dataKey={medName} 
                  name={medName}
                  stroke={colors[idx % colors.length]} 
                  strokeWidth={3}
                  dot={{ fill: colors[idx % colors.length], r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </PharmacistPremiumCard>
  );
}

import { useLanguage } from "../../context/LanguageContext";
import { useEffect, useState } from "react";
import { fetchSymptomTrends } from "../../services/telecareService";
import { Activity, AlertTriangle } from "lucide-react";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

export interface SymptomTrendsPanelProps {
  patientId?: string | number;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function SymptomTrendsPanel({ patientId }: SymptomTrendsPanelProps) {
  const { t } = useLanguage();
  const [trends, setTrends] = useState<DynamicStateObject | null>(null);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [error, setError] = useState<DynamicState>("");

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    fetchSymptomTrends(patientId)
      .then((data: DynamicStateObject) => {
        setTrends(data);
        setError("");
      })
      .catch((err: DynamicStateObject) => {
        setError("Unable to load symptom trends at this time.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [patientId]);

  if (loading) {
    return <div className="p-6 card-premium animate-pulse">{t("loadingSymptomTrends") || "Loading symptom trends..."}</div>;
  }

  if (error || !trends) {
    return null;
  }

  return (
    <div className="card-premium p-6 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-display font-medium text-white">{t("symptomTrends") || "Symptom Trends"}</h3>
      </div>
      
      <p className="text-ink-muted text-sm mb-6">{trends.summary}</p>

      {trends.trends && trends.trends.length > 0 ? (
        <div className="space-y-4">
          {trends.trends.map((trend: DynamicStateObject, i: DynamicStateObject) => (
            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-lg flex items-start gap-3">
              <div className="mt-0.5">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              </div>
              <p className="text-sm text-white">{trend}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm italic text-ink-muted py-4">{t("noRecentSymptomTrendsFound") || "No recent symptom trends found."}</div>
      )}

      {trends.disclaimer && (
        <div className="mt-6 flex items-start gap-2 text-xs text-ink-muted bg-white/5 p-3 rounded-lg border border-white/10">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{trends.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

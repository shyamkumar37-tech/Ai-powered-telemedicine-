import { useLanguage } from "../../context/LanguageContext";
import { useEffect, useState } from "react";
import { fetchConsultationPrep } from "../../services/telecareService";
import { Stethoscope, CheckCircle2, AlertTriangle } from "lucide-react";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

export interface ConsultationPrepPanelProps {
  patientId?: string | number;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function ConsultationPrepPanel({ patientId }: ConsultationPrepPanelProps) {
  const { t } = useLanguage();
  const [prep, setPrep] = useState<DynamicStateObject | null>(null);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [error, setError] = useState<DynamicState>("");

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    fetchConsultationPrep(patientId)
      .then((data: DynamicStateObject) => {
        setPrep(data);
        setError("");
      })
      .catch((err: DynamicStateObject) => {
        setError("Unable to generate consultation prep at this time.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [patientId]);

  if (loading) {
    return <div className="p-6 card-premium animate-pulse">{t("generatingPrepSummary") || "Generating prep summary..."}</div>;
  }

  if (error || !prep) {
    return null;
  }

  return (
    <div className="card-premium p-6 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <Stethoscope className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-display font-medium text-white">{prep.summary}</h3>
      </div>
      
      <p className="text-ink-muted text-slate-300 mb-6">Here are suggested talking points for your upcoming consultation based on your recent health data:</p>

      {prep.talkingPoints && prep.talkingPoints.length > 0 ? (
        <div className="space-y-4">
          {prep.talkingPoints.map((point: DynamicStateObject, i: DynamicStateObject) => (
            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <p className="text-sm text-white leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm italic text-ink-muted py-4">{t("noSpecificTalkingPointsGenerated") || "No specific talking points generated."}</div>
      )}

      {prep.disclaimer && (
        <div className="mt-6 flex items-start gap-2 text-xs text-ink-muted bg-white/5 p-3 rounded-lg border border-white/10">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{prep.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

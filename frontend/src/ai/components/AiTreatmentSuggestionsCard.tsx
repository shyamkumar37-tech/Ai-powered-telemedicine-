import { useEffect, useState } from "react";
import PremiumSectionCard from "../../components/PremiumSectionCard";
import { useLanguage } from "../../context/LanguageContext";
import { fetchAiTreatmentRecommendations } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

export interface AiTreatmentSuggestionsCardProps {
  patientId?: string | number;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function AiTreatmentSuggestionsCard({ patientId }: AiTreatmentSuggestionsCardProps) {
  const { t, language } = useLanguage();
  const [suggestions, setSuggestions] = useState<DynamicStateObject | null>(null);
  const [error, setError] = useState<DynamicState>("");
  const [loading, setLoading] = useState<DynamicState>(false);

  useEffect(() => {
    if (!patientId) {
      setSuggestions(null);
      setError("");
      return;
    }

    let active = true;
    setLoading(true);
    fetchAiTreatmentRecommendations(patientId)
      .then((data: DynamicStateObject) => {
        if (active) {
          setSuggestions(data);
          setError("");
        }
      })
      .catch((err: DynamicStateObject) => {
        if (active) {
          setError(getApiErrorMessage(err, t("unableLoadAiTreatment")));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [patientId, language]);

  return (
    <PremiumSectionCard title={t("aiTreatmentSuggestions")}>
      {!patientId ? <p className="text-sm text-ink-muted/80">{t("selectAppointment")}</p> : null}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
          <div className="h-4 bg-white/10 rounded w-5/6"></div>
        </div>
      ) : null}
      {error ? <p className="text-sm text-alert">{error}</p> : null}
      {!loading && !error && suggestions ? (
        <div className="space-y-4">
          <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-xl">
            {(Array.isArray(suggestions.suggestions) ? suggestions.suggestions : []).map((item: DynamicStateObject, index: number | string) => (
              <p key={`${item}-${index}`} className="text-sm text-ink/90 flex gap-2">
                <span className="text-primary opacity-50">•</span> {item}
              </p>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 italic px-1">{suggestions.disclaimer}</p>
        </div>
      ) : null}
      {!loading && !error && !suggestions && patientId ? (
        <p className="text-sm text-ink-muted py-4 text-center border border-dashed border-white/10 rounded-xl bg-white/5">{t("noAiSuggestions")}</p>
      ) : null}
    </PremiumSectionCard>
  );
}

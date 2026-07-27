import { useEffect, useState } from "react";
import PremiumSectionCard from "../../components/PremiumSectionCard";
import LocalizedText from "../../components/LocalizedText";
import { useLanguage } from "../../context/LanguageContext";
import { fetchAiRiskPrediction } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

export interface AiRiskCardProps {
  patientId?: string | number;
  titleKey?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function AiRiskCard({ patientId, titleKey = "aiRiskInsights" }: AiRiskCardProps) {
  const { language, t } = useLanguage();
  const [insight, setInsight] = useState<DynamicStateObject | null>(null);
  const [error, setError] = useState<DynamicState>("");
  const [loading, setLoading] = useState<DynamicState>(false);

  useEffect(() => {
    if (!patientId) {
      setInsight(null);
      setError("");
      return;
    }

    let active = true;
    setLoading(true);
    fetchAiRiskPrediction(patientId)
      .then((data: DynamicStateObject) => {
        if (active) {
          setInsight(data);
          setError("");
        }
      })
      .catch((err: DynamicStateObject) => {
        if (active) {
          setError(getApiErrorMessage(err, t("unableLoadAiRisk")));
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
    <PremiumSectionCard title={<LocalizedText value={t(titleKey)} forceTranslate minLength={1} sourceLanguage="auto" />}>
      {!patientId ? <p className="text-sm text-ink-muted/80">{t("selectAppointment")}</p> : null}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-16 bg-white/10 rounded-xl w-full"></div>
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
          <div className="h-4 bg-white/10 rounded w-5/6"></div>
        </div>
      ) : null}
      {error ? <p className="text-sm text-alert">{error}</p> : null}
      {!loading && !error && insight ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest">{t("aiRiskCategory")}</p>
              <p className="text-lg font-bold text-primary mt-1">
                <LocalizedText value={insight.category} forceTranslate minLength={1} sourceLanguage="auto" />
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest">{t("aiRiskScore")}</p>
              <p className="text-lg font-bold text-ink mt-1">{insight.score}<span className="text-sm text-ink-muted">/100</span></p>
            </div>
          </div>
          <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-xl">
            {Array.isArray(insight.insights) ? insight.insights.map((item: DynamicStateObject, index: number | string) => (
              <LocalizedText
                key={`${item}-${index}`}
                as="p"
                className="text-sm text-ink/90 flex gap-2"
                value={`• ${item}`}
                forceTranslate
                minLength={1}
                sourceLanguage="auto"
              />
            )) : null}
          </div>
          <LocalizedText as="p" className="text-[10px] text-slate-400 italic px-1" value={insight.disclaimer} forceTranslate minLength={1} sourceLanguage="auto" />
        </div>
      ) : null}
    </PremiumSectionCard>
  );
}

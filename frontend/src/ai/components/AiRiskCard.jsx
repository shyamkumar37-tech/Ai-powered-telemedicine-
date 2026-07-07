import { useEffect, useState } from "react";
import SectionCard from "../../components/SectionCard";
import LocalizedText from "../../components/LocalizedText";
import { translateDisplayText } from "../../utils/i18n";
import { useLanguage } from "../../context/LanguageContext";
import { fetchAiRiskPrediction } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";

export default function AiRiskCard({ patientId, titleKey = "aiRiskInsights" }) {
  const { language, t } = useLanguage();
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setInsight(null);
      setError("");
      return;
    }

    let active = true;
    setLoading(true);
    fetchAiRiskPrediction(patientId)
      .then((data) => {
        if (active) {
          setInsight(data);
          setError("");
        }
      })
      .catch((err) => {
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
    <SectionCard title={<LocalizedText value={t(titleKey)} forceTranslate minLength={1} sourceLanguage="auto" />}>
      {!patientId ? <p className="text-sm text-slate-500">{t("selectAppointment")}</p> : null}
      {loading ? <p className="text-sm text-slate-500">{t("loadingAiRisk")}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!loading && !error && insight ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-mist px-4 py-3">
            <div>
              <p className="text-sm text-slate-500">{t("aiRiskCategory")}</p>
              <p className="text-lg font-semibold text-ink">
                <LocalizedText value={insight.category} forceTranslate minLength={1} sourceLanguage="auto" />
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">{t("aiRiskScore")}</p>
              <p className="text-lg font-semibold text-ink">{insight.score}/100</p>
            </div>
          </div>
          <div className="space-y-2">
            {Array.isArray(insight.insights) ? insight.insights.map((item, index) => (
              <LocalizedText
                key={`${item}-${index}`}
                as="p"
                className="text-sm text-slate-600"
                value={item}
                forceTranslate
                minLength={1}
                sourceLanguage="auto"
              />
            )) : null}
          </div>
          <LocalizedText as="p" className="text-xs text-slate-500" value={insight.disclaimer} forceTranslate minLength={1} sourceLanguage="auto" />
        </div>
      ) : null}
    </SectionCard>
  );
}

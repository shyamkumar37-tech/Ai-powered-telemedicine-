import { useEffect, useState } from "react";
import SectionCard from "../../components/SectionCard";
import { useLanguage } from "../../context/LanguageContext";
import { fetchAiTreatmentRecommendations } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";

export default function AiTreatmentSuggestionsCard({ patientId }) {
  const { t, language } = useLanguage();
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setSuggestions(null);
      setError("");
      return;
    }

    let active = true;
    setLoading(true);
    fetchAiTreatmentRecommendations(patientId)
      .then((data) => {
        if (active) {
          setSuggestions(data);
          setError("");
        }
      })
      .catch((err) => {
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
    <SectionCard title={t("aiTreatmentSuggestions")}>
      {!patientId ? <p className="text-sm text-slate-500">{t("selectAppointment")}</p> : null}
      {loading ? <p className="text-sm text-slate-500">{t("loadingAiTreatment")}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!loading && !error && suggestions ? (
        <div className="space-y-3">
          <div className="space-y-2">
            {(Array.isArray(suggestions.suggestions) ? suggestions.suggestions : []).map((item, index) => (
              <p key={`${item}-${index}`} className="text-sm text-slate-600">{item}</p>
            ))}
          </div>
          <p className="text-xs text-slate-500">{suggestions.disclaimer}</p>
        </div>
      ) : null}
      {!loading && !error && !suggestions ? (
        <p className="text-sm text-slate-500">{t("noAiSuggestions")}</p>
      ) : null}
    </SectionCard>
  );
}

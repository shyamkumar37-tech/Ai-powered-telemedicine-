import { useEffect, useState } from "react";
import SectionCard from "../../components/SectionCard";
import LocalizedText from "../../components/LocalizedText";
import { useLanguage } from "../../context/LanguageContext";
import { translateDisplayText } from "../../utils/i18n";
import { fetchAiAdherenceCoach, fetchAiFollowUp, fetchAiHealthTrends, fetchAiJourneyPlan } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";

export default function AiPatientInsightsPanel({ patientId }) {
  const { t, language } = useLanguage();
  const [adherence, setAdherence] = useState(null);
  const [trends, setTrends] = useState(null);
  const [followUp, setFollowUp] = useState(null);
  const [journey, setJourney] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) {
      return;
    }
    let active = true;
    Promise.allSettled([
      fetchAiAdherenceCoach(patientId),
      fetchAiHealthTrends(patientId),
      fetchAiFollowUp(patientId),
      fetchAiJourneyPlan(patientId)
    ]).then(([a, h, f, j]) => {
      if (!active) return;
      if (a.status === "fulfilled") setAdherence(a.value);
      if (h.status === "fulfilled") setTrends(h.value);
      if (f.status === "fulfilled") setFollowUp(f.value);
      if (j.status === "fulfilled") setJourney(j.value);
      const errorResult = [a, h, f, j].find((item) => item.status === "rejected");
      if (errorResult) {
        setError(getApiErrorMessage(errorResult.reason, t("unableLoadAiRisk")));
      } else {
        setError("");
      }
    });
    return () => {
      active = false;
    };
  }, [patientId, t]);

  if (!patientId) {
    return null;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionCard title={<LocalizedText value="Adherence coach" forceTranslate minLength={1} sourceLanguage="auto" />}>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {adherence ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>{t("aiRiskScore")}: {adherence.adherenceRate}%</p>
            <p>{t("missedDoses")}: {adherence.missedCount}</p>
            <ul className="list-disc pl-5">
              {(Array.isArray(adherence.nudges) ? adherence.nudges : []).map((item) => (
                <li key={item}><LocalizedText value={item} forceTranslate minLength={1} sourceLanguage="auto" /></li>
              ))}
            </ul>
            {adherence.rationale?.length ? (
              <ul className="list-disc pl-5 text-xs text-slate-500">
                {adherence.rationale.map((item) => (
                  <li key={item}><LocalizedText value={item} forceTranslate minLength={1} sourceLanguage="auto" /></li>
                ))}
              </ul>
            ) : null}
            <LocalizedText as="p" className="text-xs text-slate-500" value={adherence.disclaimer} forceTranslate minLength={1} sourceLanguage="auto" />
          </div>
        ) : <p className="text-sm text-slate-500">{t("loadingAiRisk")}</p>}
      </SectionCard>

      <SectionCard title={<LocalizedText value="Health trend explainer" forceTranslate minLength={1} sourceLanguage="auto" />}>
        {trends ? (
          <div className="space-y-2 text-sm text-slate-700">
            <LocalizedText as="p" value={trends.summary} forceTranslate minLength={1} sourceLanguage="auto" />
            <ul className="list-disc pl-5">
              {(Array.isArray(trends.keyTrends) ? trends.keyTrends : []).map((item) => (
                <li key={item}><LocalizedText value={item} forceTranslate minLength={1} sourceLanguage="auto" /></li>
              ))}
            </ul>
            {trends.rationale?.length ? (
              <ul className="list-disc pl-5 text-xs text-slate-500">
                {trends.rationale.map((item) => (
                  <li key={item}><LocalizedText value={item} forceTranslate minLength={1} sourceLanguage="auto" /></li>
                ))}
              </ul>
            ) : null}
            <LocalizedText as="p" className="text-xs text-slate-500" value={trends.disclaimer} forceTranslate minLength={1} sourceLanguage="auto" />
          </div>
        ) : <p className="text-sm text-slate-500">{t("loadingAiRisk")}</p>}
      </SectionCard>

      <SectionCard title={<LocalizedText value="Smart follow-up planner" forceTranslate minLength={1} sourceLanguage="auto" />}>
        {followUp ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>{t("followUpDate")}: {followUp.recommendedDate}</p>
            <p>{t("riskProfile")}: <LocalizedText value={followUp.urgency} forceTranslate minLength={1} sourceLanguage="auto" /></p>
            {Array.isArray(followUp.rationale) && followUp.rationale.length ? (
              <ul className="list-disc pl-5 text-xs text-slate-500">
                {followUp.rationale.map((item) => (
                  <li key={item}><LocalizedText value={item} forceTranslate minLength={1} sourceLanguage="auto" /></li>
                ))}
              </ul>
            ) : null}
            <LocalizedText as="p" className="text-xs text-slate-500" value={followUp.disclaimer} forceTranslate minLength={1} sourceLanguage="auto" />
          </div>
        ) : <p className="text-sm text-slate-500">{t("loadingAiRisk")}</p>}
      </SectionCard>

      <SectionCard title={<LocalizedText value="Journey orchestrator" forceTranslate minLength={1} sourceLanguage="auto" />}>
        {journey ? (
          <div className="space-y-3 text-sm text-slate-700">
            <LocalizedText as="p" value={journey.summary} forceTranslate minLength={1} sourceLanguage="auto" />
            <div className="space-y-2">
              {(Array.isArray(journey.steps) ? journey.steps : []).map((step) => (
                <div key={`${step.title}-${step.detail}`} className="rounded-2xl bg-mist p-3">
                  <LocalizedText as="p" className="font-semibold" value={step.title} forceTranslate minLength={1} sourceLanguage="auto" />
                  <p className="text-xs text-slate-500">
                    <LocalizedText value={step.status} forceTranslate minLength={1} sourceLanguage="auto" /> {step.dueDate ? `- ${step.dueDate}` : ""}
                  </p>
                  <LocalizedText as="p" className="text-xs text-slate-500" value={step.detail} forceTranslate minLength={1} sourceLanguage="auto" />
                </div>
              ))}
            </div>
            <LocalizedText as="p" className="text-xs text-slate-500" value={journey.disclaimer} forceTranslate minLength={1} sourceLanguage="auto" />
          </div>
        ) : <p className="text-sm text-slate-500">{t("loadingAiRisk")}</p>}
      </SectionCard>
    </div>
  );
}

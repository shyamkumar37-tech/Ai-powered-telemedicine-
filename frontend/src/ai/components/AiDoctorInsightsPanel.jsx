import { useEffect, useState } from "react";
import SectionCard from "../../components/SectionCard";
import { useLanguage } from "../../context/LanguageContext";
import { fetchDifferentialSuggestions, fetchDoctorRiskQueue, fetchDrugInteractions } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";
import { translateDisplayText } from "../../utils/i18n";

export default function AiDoctorInsightsPanel({ doctorId }) {
  const { t, language, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const [riskQueue, setRiskQueue] = useState(null);
  const [diffInput, setDiffInput] = useState("");
  const [diffSuggestions, setDiffSuggestions] = useState(null);
  const [medInput, setMedInput] = useState("");
  const [interactionWarnings, setInteractionWarnings] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!doctorId) return;
    fetchDoctorRiskQueue(doctorId)
      .then((data) => setRiskQueue(data))
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadDoctorQueue"))));
  }, [doctorId, t]);

  const runDifferential = async () => {
    if (!diffInput.trim()) return;
    setError("");
    try {
      const response = await fetchDifferentialSuggestions({ symptoms: diffInput.trim(), notes: "" });
      setDiffSuggestions(response);
    } catch (err) {
      setError(getApiErrorMessage(err, t("unableLoadDoctorQueue")));
    }
  };

  const runInteractions = async () => {
    const meds = medInput.split(",").map((item) => item.trim()).filter(Boolean);
    if (!meds.length) return;
    setError("");
    try {
      const response = await fetchDrugInteractions({ medicines: meds });
      setInteractionWarnings(response);
    } catch (err) {
      setError(getApiErrorMessage(err, t("unableLoadDoctorQueue")));
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionCard title={translateUiText("Patient risk heatmap")}>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {riskQueue ? (
          <div className="space-y-2 text-sm text-slate-700">
            {(Array.isArray(riskQueue.patients) ? riskQueue.patients : []).map((patient) => (
              <div key={patient.patientId} className="rounded-2xl bg-mist p-3">
                <p className="font-semibold">{patient.patientName}</p>
                <p className="text-xs text-slate-500">{patient.riskCategory} - {patient.score}/100</p>
                <p className="text-xs text-slate-500">{(Array.isArray(patient.reasons) ? patient.reasons : []).join(" | ")}</p>
              </div>
            ))}
            <p className="text-xs text-slate-500">{riskQueue.disclaimer}</p>
          </div>
        ) : <p className="text-sm text-slate-500">{t("loadingDoctorIntelligence")}</p>}
      </SectionCard>

      <SectionCard title={translateUiText("AI differential suggestions")}>
        <textarea
          className="field min-h-24 resize-y"
          placeholder={translateUiText("Enter symptoms or notes")}
          value={diffInput}
          onChange={(event) => setDiffInput(event.target.value)}
        />
        <button className="btn-primary mt-3" type="button" onClick={runDifferential}>
          {translateUiText("Generate differential")}
        </button>
        {diffSuggestions ? (
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <ul className="list-disc pl-5">
              {(Array.isArray(diffSuggestions.suggestions) ? diffSuggestions.suggestions : []).map((item) => <li key={item}>{item}</li>)}
            </ul>
            {Array.isArray(diffSuggestions.rationale) && diffSuggestions.rationale.length ? (
              <ul className="list-disc pl-5 text-xs text-slate-500">
                {diffSuggestions.rationale.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
            <p className="text-xs text-slate-500">{diffSuggestions.disclaimer}</p>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title={translateUiText("Drug interaction alerts")}>
        <input
          className="field"
          placeholder={translateUiText("Enter medicines separated by commas")}
          value={medInput}
          onChange={(event) => setMedInput(event.target.value)}
        />
        <button className="btn-secondary mt-3" type="button" onClick={runInteractions}>
          {translateUiText("Check interactions")}
        </button>
        {interactionWarnings ? (
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <ul className="list-disc pl-5">
              {(Array.isArray(interactionWarnings.warnings) ? interactionWarnings.warnings : []).map((item) => <li key={item}>{item}</li>)}
            </ul>
            {Array.isArray(interactionWarnings.rationale) && interactionWarnings.rationale.length ? (
              <ul className="list-disc pl-5 text-xs text-slate-500">
                {interactionWarnings.rationale.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
            <p className="text-xs text-slate-500">{interactionWarnings.disclaimer}</p>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}

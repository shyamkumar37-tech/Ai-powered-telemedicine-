import { useState } from "react";
import SectionCard from "../../components/SectionCard";
import { useLanguage } from "../../context/LanguageContext";
import { fetchConsultationSummary } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";
import { translateDisplayText } from "../../utils/i18n";

function buildSummaryText(summary) {
  if (!summary) {
    return "";
  }
  return [
    `Subjective: ${summary.subjective}`,
    `Objective: ${summary.objective}`,
    `Assessment: ${summary.assessment}`,
    `Plan: ${summary.plan}`
  ].join("\n");
}

export default function AiConsultationSummaryCard({ consultationId, onApplySummary }) {
  const { t, language, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSummary = async () => {
    if (!consultationId) {
      setError(translateUiText("Save a consultation note first."));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchConsultationSummary(consultationId);
      setSummary(data);
      setMessage("");
    } catch (err) {
      setError(getApiErrorMessage(err, translateUiText("Unable to generate summary.")));
    } finally {
      setLoading(false);
    }
  };

  const applySummary = () => {
    if (!summary || !onApplySummary) {
      return;
    }
    const text = buildSummaryText(summary);
    onApplySummary(text);
    setMessage(translateUiText("Summary copied into consultation notes."));
  };

  return (
    <SectionCard
      title={translateUiText("Consultation auto-summary")}
      action={(
        <button
          className="btn-secondary"
          type="button"
          disabled={loading}
          onClick={loadSummary}
        >
          {loading ? translateUiText("Loading...") : translateUiText("Generate summary")}
        </button>
      )}
    >
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {summary ? (
        <div className="space-y-3 text-sm text-slate-700">
          <p><span className="font-semibold">S:</span> {summary.subjective}</p>
          <p><span className="font-semibold">O:</span> {summary.objective}</p>
          <p><span className="font-semibold">A:</span> {summary.assessment}</p>
          <p><span className="font-semibold">P:</span> {summary.plan}</p>
          {summary.suggestedCodes?.length ? (
            <p className="text-xs text-slate-500">
              {translateUiText("Suggested codes")}: {summary.suggestedCodes.join(", ")}
            </p>
          ) : null}
          {summary.rationale?.length ? (
            <ul className="list-disc pl-5 text-xs text-slate-500">
              {summary.rationale.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
          <p className="text-xs text-slate-500">{summary.disclaimer}</p>
          {onApplySummary ? (
            <button className="btn-primary" type="button" onClick={applySummary}>
              {translateUiText("Add to notes")}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{translateUiText("Generate a structured summary from the consultation notes.")}</p>
      )}
      {message ? <p className="mt-3 text-sm text-emerald-600" role="status" aria-live="polite">{message}</p> : null}
    </SectionCard>
  );
}

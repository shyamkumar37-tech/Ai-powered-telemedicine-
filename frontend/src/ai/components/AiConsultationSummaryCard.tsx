import { useState } from "react";
import PremiumSectionCard from "../../components/PremiumSectionCard";
import { useLanguage } from "../../context/LanguageContext";
import { fetchConsultationSummary } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";
import { translateDisplayText } from "../../utils/i18n";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

function buildSummaryText(summary: DynamicStateObject) {
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

export interface AiConsultationSummaryCardProps {
  consultationId?: string | number;
  onApplySummary?: (...args: DynamicStateObject[]) => void;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function AiConsultationSummaryCard({ consultationId, onApplySummary }: AiConsultationSummaryCardProps) {
  const { t, language, translateUiText = (value: string | number) => translateDisplayText(language, value) } = useLanguage();
  const [summary, setSummary] = useState<DynamicStateObject | null>(null);
  const [loading, setLoading] = useState<DynamicState>(false);
  const [message, setMessage] = useState<DynamicState>("");
  const [error, setError] = useState<DynamicState>("");

  const loadSummary = async () => {
    if (!consultationId) {
      setError((t("saveAConsultationNoteFirst") || "Save a consultation note first."));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchConsultationSummary(consultationId);
      setSummary(data);
      setMessage("");
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, (t("unableToGenerateSummary") || "Unable to generate summary.")));
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
    setMessage((t("summaryCopiedIntoConsultationNotes") || "Summary copied into consultation notes."));
  };

  return (
    <PremiumSectionCard
      title={(t("consultationAutoSummary") || "Consultation auto-summary")}
      action={(
        <button
          className="px-3 py-1.5 bg-primary/10 text-primary font-semibold text-xs rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
          type="button"
          disabled={loading}
          onClick={loadSummary}
        >
          {loading ? (t("loading") || "Loading...") : (t("generateSummary") || "Generate summary")}
        </button>
      )}
    >
      {error ? <p className="text-sm text-alert mb-3">{error}</p> : null}
      {summary ? (
        <div className="space-y-4 text-sm text-ink/90">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <p><span className="font-semibold text-primary uppercase text-xs tracking-wider">S:</span> {summary.subjective}</p>
            <p><span className="font-semibold text-primary uppercase text-xs tracking-wider">O:</span> {summary.objective}</p>
            <p><span className="font-semibold text-primary uppercase text-xs tracking-wider">A:</span> {summary.assessment}</p>
            <p><span className="font-semibold text-primary uppercase text-xs tracking-wider">P:</span> {summary.plan}</p>
          </div>
          {summary.suggestedCodes?.length ? (
            <p className="text-xs text-ink-muted bg-white/5 px-3 py-2 rounded-lg border border-white/10">
              <span className="font-semibold text-ink/80">{(t("suggestedCodes") || "Suggested codes")}:</span> {summary.suggestedCodes.join(", ")}
            </p>
          ) : null}
          {summary.rationale?.length ? (
            <ul className="list-disc pl-5 text-xs text-ink-muted/80 space-y-1">
              {summary.rationale.map((item: DynamicStateObject) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
          <p className="text-[10px] text-ink-muted/50 italic">{summary.disclaimer}</p>
          {onApplySummary ? (
            <button className="w-full btn-primary" type="button" onClick={applySummary}>
              {(t("addToNotes") || "Add to notes")}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-ink-muted py-4 text-center border border-dashed border-white/10 rounded-xl bg-white/5">{(t("generateAStructuredSummaryFromTheConsultationNotes") || "Generate a structured summary from the consultation notes.")}</p>
      )}
      {message ? <p className="mt-3 text-sm font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-2 rounded-lg" role="status" aria-live="polite">{message}</p> : null}
    </PremiumSectionCard>
  );
}

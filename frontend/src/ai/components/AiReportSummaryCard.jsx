import { useState } from "react";
import SectionCard from "../../components/SectionCard";
import { useLanguage } from "../../context/LanguageContext";
import { exportAiReportSummary, fetchAiReportSummary } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";

export default function AiReportSummaryCard({ patientId, titleKey = "aiReportSummary" }) {
  const { t } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleGenerate() {
    if (!patientId) {
      return;
    }
    try {
      setLoading(true);
      setError("");
      const data = await fetchAiReportSummary(patientId);
      setSummary(data);
    } catch (err) {
      setError(getApiErrorMessage(err, t("unableGenerateAiSummary")));
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!patientId) {
      return;
    }
    try {
      setExporting(true);
      const data = await exportAiReportSummary(patientId);
      const bytes = Uint8Array.from(atob(data.base64Content || ""), (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: data.contentType || "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = data.fileName || "telecare-ai-summary.txt";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      setError(getApiErrorMessage(err, t("unableExportAiSummary")));
    } finally {
      setExporting(false);
    }
  }

  return (
    <SectionCard
      title={t(titleKey)}
      action={(
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" type="button" onClick={handleGenerate} disabled={loading || !patientId}>
            {loading ? t("generatingAiSummary") : t("generateAiSummary")}
          </button>
          <button className="btn-primary" type="button" onClick={handleExport} disabled={exporting || !patientId}>
            {exporting ? t("exportingAiSummary") : t("exportAiSummary")}
          </button>
        </div>
      )}
    >
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!summary ? (
        <p className="text-sm text-slate-500">{t("aiSummaryHelper")}</p>
      ) : (
        <div className="space-y-4 text-sm text-slate-600">
          <p><span className="font-medium text-ink">{t("aiSummaryOverview")}:</span> {summary.overview}</p>
          <div>
            <p className="font-medium text-ink">{t("aiSummaryComplaints")}:</p>
            <ul className="list-disc pl-5">
              {summary.recentComplaints?.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
          <p><span className="font-medium text-ink">{t("aiSummaryDiagnosis")}:</span> {summary.diagnosisSummary}</p>
          <div>
            <p className="font-medium text-ink">{t("aiSummaryMedicines")}:</p>
            <ul className="list-disc pl-5">
              {summary.prescribedMedicines?.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-ink">{t("aiSummaryFollowUp")}:</p>
            <ul className="list-disc pl-5">
              {summary.followUpAdvice?.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-500">{summary.disclaimer}</p>
        </div>
      )}
    </SectionCard>
  );
}

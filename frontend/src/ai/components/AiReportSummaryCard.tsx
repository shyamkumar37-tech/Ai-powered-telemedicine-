import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { exportAiReportSummary, streamAiReportSummary } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";
import { Sparkles, Download, FileText } from "lucide-react";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

export interface AiReportSummaryCardProps {
  patientId?: string | number;
  titleKey?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function AiReportSummaryCard({ patientId, titleKey = "aiReportSummary" }: AiReportSummaryCardProps) {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<DynamicStateObject | null>(null);
  const [error, setError] = useState<DynamicState>("");
  const [loading, setLoading] = useState<DynamicState>(false);
  const [exporting, setExporting] = useState<DynamicState>(false);

  const streamRef = useRef<DynamicState>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current();
    };
  }, []);

  async function handleGenerate() {
    if (!patientId) return;
    setLoading(true);
    setError("");
    setSummary("");

    streamRef.current = streamAiReportSummary(
      patientId,
      (textChunk: DynamicStateObject) => {
        setSummary((prev: DynamicStateObject) => (prev || "") + textChunk);
      },
      (err: DynamicStateObject) => {
        setError("AI Stream interrupted.");
        setLoading(false);
        streamRef.current = null;
      },
      () => {
        setLoading(false);
        streamRef.current = null;
      }
    );
  }

  async function handleExport() {
    if (!patientId) return;
    try {
      setExporting(true);
      const data = await exportAiReportSummary(patientId);
      const bytes = Uint8Array.from(atob(data.base64Content || ""), (char: DynamicStateObject) => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: data.contentType || "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = data.fileName || "telecare-ai-summary.txt";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, "Unable to export AI summary."));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="card-premium !bg-surface flex flex-col p-6">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> {t(titleKey)}
        </h3>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-1.5" onClick={handleGenerate} disabled={loading || !patientId}>
            {loading ? "Generating..." : "Generate AI Summary"}
          </button>
          <button className="btn-primary flex items-center gap-1.5" onClick={handleExport} disabled={exporting || !patientId || !summary}>
            <Download className="w-4 h-4" /> {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-alert mb-4 font-medium">{error}</p>}
      
      {!summary ? (
        <div className="p-6 bg-white/5 rounded-xl border border-dashed border-white/10 text-center">
          <FileText className="w-8 h-8 text-ink-muted/50 mx-auto mb-3" />
          <p className="text-sm text-ink-muted">{t("clickGenerateToAnalyzeYourMedicalRecordsUsingAI") || "Click generate to analyze your medical records using AI."}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-2">{t("overview") || "Overview"}</p>
            <p className="text-sm text-ink/90 leading-relaxed">{summary.overview}</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-2">{t("recentComplaints") || "Recent Complaints"}</p>
              <ul className="list-disc pl-5 text-ink/90 text-sm leading-relaxed space-y-1">
                {summary.recentComplaints?.map((item: DynamicStateObject, idx: DynamicStateObject) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-2">{t("prescribedMedicines") || "Prescribed Medicines"}</p>
              <ul className="list-disc pl-5 text-ink/90 text-sm leading-relaxed space-y-1">
                {summary.prescribedMedicines?.map((item: DynamicStateObject, idx: DynamicStateObject) => <li key={idx}>{item}</li>)}
              </ul>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-2">{t("followUpAdvice") || "Follow Up Advice"}</p>
              <ul className="list-disc pl-5 text-ink/90 text-sm leading-relaxed space-y-1">
                {summary.followUpAdvice?.map((item: DynamicStateObject, idx: DynamicStateObject) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-2">{t("diagnosisSummary") || "Diagnosis Summary"}</p>
            <p className="text-sm text-ink/90 leading-relaxed">{summary.diagnosisSummary}</p>
          </div>

          <p className="text-[10px] text-ink-muted/50 italic mt-6 pt-4 border-t border-white/10">
            {summary.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}

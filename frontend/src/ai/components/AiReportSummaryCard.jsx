import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { exportAiReportSummary, fetchAiReportSummary } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";
import { Sparkles, Download, FileText } from "lucide-react";

export default function AiReportSummaryCard({ patientId, titleKey = "aiReportSummary" }) {
  const { t } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleGenerate() {
    if (!patientId) return;
    try {
      setLoading(true);
      setError("");
      const data = await fetchAiReportSummary(patientId);
      setSummary(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to generate AI summary."));
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!patientId) return;
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
      setError(getApiErrorMessage(err, "Unable to export AI summary."));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="doctor-card" style={{ padding: '24px', cursor: 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--tct-teal)" /> {t(titleKey)}
        </h4>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={handleGenerate} disabled={loading || !patientId} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {loading ? "Generating..." : "Generate AI Summary"}
          </button>
          <button className="btn-primary" onClick={handleExport} disabled={exporting || !patientId || !summary} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      {error && <p style={{ fontSize: '14px', color: 'var(--tct-coral)', marginBottom: '16px', fontWeight: '500' }}>{error}</p>}
      
      {!summary ? (
        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--tct-panel-line-strong)', textAlign: 'center' }}>
          <FileText size={24} color="var(--tct-text-muted)" style={{ margin: '0 auto', marginBottom: '12px' }} />
          <p style={{ fontSize: '14px', color: 'var(--tct-text-secondary)' }}>Click generate to analyze your medical records using AI.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <p style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Overview</p>
            <p style={{ fontSize: '14px', color: '#E2E8F0', lineHeight: '1.6' }}>{summary.overview}</p>
          </div>
          
          <div className="doctors-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Recent Complaints</p>
              <ul style={{ paddingLeft: '20px', color: '#E2E8F0', fontSize: '14px', lineHeight: '1.6' }}>
                {summary.recentComplaints?.map((item, idx) => <li key={idx} style={{ paddingLeft: '4px' }}>{item}</li>)}
              </ul>
            </div>
            
            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Prescribed Medicines</p>
              <ul style={{ paddingLeft: '20px', color: '#E2E8F0', fontSize: '14px', lineHeight: '1.6' }}>
                {summary.prescribedMedicines?.map((item, idx) => <li key={idx} style={{ paddingLeft: '4px' }}>{item}</li>)}
              </ul>
            </div>

            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Follow Up Advice</p>
              <ul style={{ paddingLeft: '20px', color: '#E2E8F0', fontSize: '14px', lineHeight: '1.6' }}>
                {summary.followUpAdvice?.map((item, idx) => <li key={idx} style={{ paddingLeft: '4px' }}>{item}</li>)}
              </ul>
            </div>
          </div>

          <div>
            <p style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Diagnosis Summary</p>
            <p style={{ fontSize: '14px', color: '#E2E8F0', lineHeight: '1.6' }}>{summary.diagnosisSummary}</p>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--tct-text-muted)', fontStyle: 'italic', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--tct-panel-line)' }}>
            {summary.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}

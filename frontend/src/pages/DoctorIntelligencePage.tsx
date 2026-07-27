import { useEffect, useState } from "react";
import PremiumSectionCard from "../components/PremiumSectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchDoctorPriorityQueue } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { BrainCircuit, Activity, AlertTriangle, TrendingDown } from "lucide-react";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

function IntelligenceSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_: DynamicStateObject, i: DynamicStateObject) => (
        <div key={i} className="doc-skeleton h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function DoctorIntelligencePage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const doctorId = auth.profileId ?? auth.userId;
  const [queue, setQueue] = useState<DynamicStateObject[]>([]);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [error, setError] = useState<DynamicState>("");

  useEffect(() => {
    setLoading(true);
    fetchDoctorPriorityQueue(doctorId)
      .then((data: DynamicStateObject) => {
        setQueue(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err: DynamicStateObject) => setError(getApiErrorMessage(err, t("unableLoadDoctorQueue"))))
      .finally(() => setLoading(false));
  }, [doctorId, t]);

  const getRiskColor = (level: DynamicStateObject) => {
    switch (level) {
      case "CRITICAL": return "bg-rose-500";
      case "HIGH": return "bg-amber-500";
      case "MODERATE": return "bg-yellow-500";
      default: return "bg-teal-500";
    }
  };

  const getRiskBadge = (level: DynamicStateObject) => {
    switch (level) {
      case "CRITICAL": return "tc-badge tc-badge-danger";
      case "HIGH": return "tc-badge tc-badge-warning";
      default: return "tc-badge tc-badge-neutral";
    }
  };

  return (
    <div className="space-y-6 tcd-animate-in">
      <PremiumSectionCard title={(
        <span className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-teal-400" />
          {t("doctorIntelligenceQueue")}
        </span>
      )}>
        {loading ? <IntelligenceSkeleton /> : null}
        {error ? (
          <ErrorStateCard
            title={t("unableLoadDoctorQueue")}
            body={error}
          />
        ) : null}
        {!loading && !error && !queue.length ? (
          <EmptyStateCard
            title={t("noDoctorQueue")}
            body={translateDisplayText(language, "Priority patients will appear here when risk signals are detected.")}
          />
        ) : null}
        <div className="grid gap-6 md:grid-cols-2">
          {queue.map((patient: DynamicStateObject) => (
            <div key={patient.patientId} className="group rounded-xl border border-white/5 bg-[var(--tc-surface-muted)] p-5 transition-colors hover:bg-white/10 hover:border-[var(--tc-border)]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-white text-lg tracking-tight">{patient.patientName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`tc-badge ${getRiskBadge(patient.riskLevel)} text-xs px-2.5 py-0.5`}>
                      {translateDisplayText(language, patient.riskLevel)}
                    </span>
                    {patient.latestAlert && patient.latestAlert !== t("noActiveAlert") && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-rose-400">
                        <AlertTriangle className="h-3 w-3" /> {t("activeAlert") || "Active Alert"}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-300">{patient.riskScore}/100</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">{t("riskScore")}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-5 border-y border-white/5 py-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Activity className="h-3 w-3" /> {t("riskStatus") || "Risk Status"}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--tc-surface-muted)] rounded-full">
                    <div className={`h-full rounded-full ${getRiskColor(patient.riskLevel)}`} style={{ width: `${Math.max(5, patient.riskScore)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1"><TrendingDown className="h-3 w-3" /> {t("adherence") || "Adherence"}</span>
                    <span className="text-xs font-semibold text-white">{patient.adherencePercentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--tc-surface-muted)] rounded-full">
                    <div className="h-full rounded-full bg-teal-400" style={{ width: `${Math.max(5, patient.adherencePercentage)}%` }} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t("latestSignal") || "Latest Signal"}</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{translateDisplayText(language, patient.latestAlert)}</p>
                </div>
                
                <div className="rounded-lg bg-teal-400/5 border border-teal-400/10 p-3">
                  <p className="text-xs font-semibold text-teal-400/70 uppercase tracking-wider mb-1">{t("aIRecommendation") || "AI Recommendation"}</p>
                  <p className="text-sm font-medium text-teal-400">{translateDisplayText(language, patient.recommendedAction)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PremiumSectionCard>

      <PremiumSectionCard title={(
        <span className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-indigo-400" />
          Clinical Copilot (RAG)
        </span>
      )}>
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-5 space-y-4">
          <p className="text-sm text-slate-400">{t("askTheAICopilotQuestionsAboutClinicalGuidelinesAndPatientHistory") || "Ask the AI Copilot questions about clinical guidelines and patient history."}</p>
          <div className="flex gap-2">
            <input 
              id="copilot-query" 
              className="field flex-1" 
              placeholder="e.g. What is the recommended treatment for hypertension?" 
              onKeyDown={async (e: DynamicStateObject) => {
                if (e.key === 'Enter') {
                  const val = e.target.value;
                  if (!val) return;
                  e.target.disabled = true;
                  const resSpan = document.getElementById("copilot-response");
                  // @ts-expect-error - Auto-suppressed during migration
                  resSpan.innerText = "Thinking...";
                  try {
                    const { askCopilot } = await import("../ai/services/aiService");
                    const res = await askCopilot({ query: val, patientId: null });
                    // @ts-expect-error - Auto-suppressed during migration
                    resSpan.innerText = res.answer;
                  } catch (err: DynamicStateObject) {
                    // @ts-expect-error - Auto-suppressed during migration
                    resSpan.innerText = "Error asking copilot.";
                  } finally {
                    e.target.disabled = false;
                  }
                }
              }}
            />
          </div>
          <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 min-h-24 text-sm text-slate-300">
            <span id="copilot-response">{t("copilotResponseWillAppearHere") || "Copilot response will appear here..."}</span>
          </div>
        </div>
      </PremiumSectionCard>
    </div>
  );
}


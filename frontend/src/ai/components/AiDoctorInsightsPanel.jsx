import { useEffect, useState } from "react";
import PremiumSectionCard from "../../components/PremiumSectionCard";
import { useLanguage } from "../../context/LanguageContext";
import { fetchDifferentialSuggestions, fetchDoctorRiskQueue, fetchDrugInteractions } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";
import { translateDisplayText } from "../../utils/i18n";
import { Activity, Beaker, Pill, AlertTriangle } from "lucide-react";

export default function AiDoctorInsightsPanel({ doctorId }) {
  const { t, language, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const [riskQueue, setRiskQueue] = useState(null);
  const [diffInput, setDiffInput] = useState("");
  const [diffSuggestions, setDiffSuggestions] = useState(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [medInput, setMedInput] = useState("");
  const [interactionWarnings, setInteractionWarnings] = useState(null);
  const [interactionLoading, setInteractionLoading] = useState(false);
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
    setDiffLoading(true);
    try {
      const response = await fetchDifferentialSuggestions({ symptoms: diffInput.trim(), notes: "" });
      setDiffSuggestions(response);
    } catch (err) {
      setError(getApiErrorMessage(err, t("unableLoadDoctorQueue")));
    } finally {
      setDiffLoading(false);
    }
  };

  const runInteractions = async () => {
    const meds = medInput.split(",").map((item) => item.trim()).filter(Boolean);
    if (!meds.length) return;
    setError("");
    setInteractionLoading(true);
    try {
      const response = await fetchDrugInteractions({ medicines: meds });
      setInteractionWarnings(response);
    } catch (err) {
      setError(getApiErrorMessage(err, t("unableLoadDoctorQueue")));
    } finally {
      setInteractionLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 80) return "bg-rose-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-teal-500";
  };

  return (
    <div className="grid gap-6 xl:grid-cols-3 mt-6">
      <div className="xl:col-span-1">
        <PremiumSectionCard title={(
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-400" />
            {translateUiText("Patient risk heatmap")}
          </span>
        )} className="h-full">
          {error ? <p className="text-sm text-rose-400 mb-4">{error}</p> : null}
          {riskQueue ? (
            <div className="space-y-4">
              {(Array.isArray(riskQueue.patients) ? riskQueue.patients : []).map((patient) => (
                <div key={patient.patientId} className="group rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-white">{patient.patientName}</p>
                    <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">{patient.score}/100</span>
                  </div>
                  
                  {/* Radial/Bar Gauge Representation */}
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-3">
                    <div className={`h-full rounded-full ${getRiskColor(patient.score)}`} style={{ width: `${Math.max(5, patient.score)}%` }} />
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 bg-black/20 px-1.5 py-0.5 rounded">
                      {patient.riskCategory}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {(Array.isArray(patient.reasons) ? patient.reasons : []).join(" • ")}
                  </p>
                </div>
              ))}
              <div className="flex items-start gap-2 mt-4 text-slate-500 bg-white/5 p-3 rounded-lg">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">{riskQueue.disclaimer}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <div className="doc-skeleton h-5 w-1/2 mb-3 rounded" />
                  <div className="doc-skeleton h-1.5 w-full mb-3 rounded-full" />
                  <div className="doc-skeleton h-4 w-3/4 rounded" />
                </div>
              ))}
            </div>
          )}
        </PremiumSectionCard>
      </div>

      <div className="xl:col-span-2 grid gap-6 md:grid-cols-2">
        <PremiumSectionCard title={(
          <span className="flex items-center gap-2">
            <Beaker className="h-4 w-4 text-teal-400" />
            {translateUiText("AI differential suggestions")}
          </span>
        )}>
          <div className="flex flex-col h-full">
            <textarea
              className="doc-input min-h-[100px] resize-y mb-4"
              placeholder={translateUiText("Enter symptoms or clinical notes (e.g. '34yo M, acute RLQ pain, nausea')")}
              value={diffInput}
              onChange={(event) => setDiffInput(event.target.value)}
            />
            <button className="doc-btn doc-btn-primary w-full" type="button" onClick={runDifferential} disabled={diffLoading}>
              {diffLoading ? "Analyzing..." : translateUiText("Generate differential")}
            </button>
            
            {diffSuggestions && !diffLoading && (
              <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="rounded-lg bg-teal-400/5 border border-teal-400/10 p-4">
                  <h4 className="text-sm font-semibold text-teal-400 mb-2 uppercase tracking-wider">Top Differentials</h4>
                  <ul className="space-y-1.5">
                    {(Array.isArray(diffSuggestions.suggestions) ? diffSuggestions.suggestions : []).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                        <span className="text-teal-400 opacity-50 block mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {Array.isArray(diffSuggestions.rationale) && diffSuggestions.rationale.length > 0 && (
                  <div className="rounded-lg bg-white/5 p-4">
                    <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Clinical Rationale</h4>
                    <ul className="space-y-1.5">
                      {diffSuggestions.rationale.map((item, i) => (
                        <li key={i} className="text-xs text-slate-400 leading-relaxed">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-[10px] text-slate-500 italic px-1">{diffSuggestions.disclaimer}</p>
              </div>
            )}
          </div>
        </PremiumSectionCard>

        <PremiumSectionCard title={(
          <span className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-amber-400" />
            {translateUiText("Drug interaction alerts")}
          </span>
        )}>
          <div className="flex flex-col h-full">
            <input
              className="doc-input mb-4"
              placeholder={translateUiText("Enter medicines (e.g. 'warfarin, amiodarone')")}
              value={medInput}
              onChange={(event) => setMedInput(event.target.value)}
            />
            <button className="doc-btn doc-btn-secondary w-full" type="button" onClick={runInteractions} disabled={interactionLoading}>
              {interactionLoading ? "Checking..." : translateUiText("Check interactions")}
            </button>
            
            {interactionWarnings && !interactionLoading && (
              <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                {(Array.isArray(interactionWarnings.warnings) ? interactionWarnings.warnings : []).map((w, idx) => (
                  <div key={idx} className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-400">{w.severity} Interaction</p>
                        <p className="text-sm text-slate-300 mt-1">{w.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!interactionWarnings.warnings || interactionWarnings.warnings.length === 0) && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                    <p className="text-sm font-medium text-emerald-400">No known severe interactions</p>
                  </div>
                )}
                
                <p className="text-[10px] text-slate-500 italic px-1">{interactionWarnings.disclaimer}</p>
              </div>
            )}
          </div>
        </PremiumSectionCard>
      </div>
    </div>
  );
}

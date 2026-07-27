import { useEffect, useState } from "react";
import PremiumSectionCard from "../../components/PremiumSectionCard";
import { useLanguage } from "../../context/LanguageContext";
import { fetchDifferentialSuggestions, fetchDoctorRiskQueue, fetchDrugInteractions } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";
import { translateDisplayText } from "../../utils/i18n";
import { Activity, Beaker, Pill, AlertTriangle } from "lucide-react";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

export interface AiDoctorInsightsPanelProps {
  doctorId?: string | number;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function AiDoctorInsightsPanel({ doctorId }: AiDoctorInsightsPanelProps) {
  const { t, language, translateUiText = (value: string | number) => translateDisplayText(language, value) } = useLanguage();
  const [riskQueue, setRiskQueue] = useState<DynamicStateObject | null>(null);
  const [diffInput, setDiffInput] = useState<DynamicState>("");
  const [diffSuggestions, setDiffSuggestions] = useState<DynamicStateObject | null>(null);
  const [diffLoading, setDiffLoading] = useState<DynamicState>(false);
  const [medInput, setMedInput] = useState<DynamicState>("");
  const [interactionWarnings, setInteractionWarnings] = useState<DynamicStateObject | null>(null);
  const [interactionLoading, setInteractionLoading] = useState<DynamicState>(false);
  const [error, setError] = useState<DynamicState>("");

  useEffect(() => {
    if (!doctorId) return;
    fetchDoctorRiskQueue(doctorId)
      .then((data: DynamicStateObject) => setRiskQueue(data))
      .catch((err: DynamicStateObject) => setError(getApiErrorMessage(err, t("unableLoadDoctorQueue"))));
  }, [doctorId, t]);

  const runDifferential = async () => {
    if (!diffInput.trim()) return;
    setError("");
    setDiffLoading(true);
    try {
      const response = await fetchDifferentialSuggestions({ symptoms: diffInput.trim(), notes: "" });
      setDiffSuggestions(response);
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, t("unableLoadDoctorQueue")));
    } finally {
      setDiffLoading(false);
    }
  };

  const runInteractions = async () => {
    const meds = medInput.split(",").map((item: DynamicStateObject) => item.trim()).filter(Boolean);
    if (!meds.length) return;
    setError("");
    setInteractionLoading(true);
    try {
      const response = await fetchDrugInteractions({ medicines: meds });
      setInteractionWarnings(response);
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, t("unableLoadDoctorQueue")));
    } finally {
      setInteractionLoading(false);
    }
  };

  const getRiskColor = (score: DynamicStateObject) => {
    if (score >= 80) return "bg-alert shadow-[0_0_10px_rgba(239,68,68,0.5)]";
    if (score >= 50) return "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]";
    return "bg-primary shadow-[0_0_10px_rgba(20,184,166,0.5)]";
  };

  return (
    <div className="grid gap-6 xl:grid-cols-3 mt-6">
      <div className="xl:col-span-1">
        <PremiumSectionCard title={(
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            {(t("patientRiskHeatmap") || "Patient risk heatmap")}
          </span>
        )} className="h-full border-t-[3px] border-t-primary/50">
          {error ? <p className="text-sm text-alert mb-4">{error}</p> : null}
          {riskQueue ? (
            <div className="space-y-4">
              {(Array.isArray(riskQueue.patients) ? riskQueue.patients : []).map((patient: DynamicStateObject) => (
                <div key={patient.patientId} className="group rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-ink">{patient.patientName}</p>
                    <span className="text-xs font-bold text-ink bg-white/10 px-2 py-0.5 rounded-full">{patient.score}/100</span>
                  </div>
                  
                  {/* Radial/Bar Gauge Representation */}
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                    <div className={`h-full rounded-full transition-all duration-1000 ${getRiskColor(patient.score)}`} style={{ width: `${Math.max(5, patient.score)}%` }} />
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-muted bg-white/5 px-1.5 py-0.5 rounded">
                      {patient.riskCategory}
                    </span>
                  </div>
                  
                  <p className="text-xs text-ink-muted/80 leading-relaxed">
                    {(Array.isArray(patient.reasons) ? patient.reasons : []).join(" • ")}
                  </p>
                </div>
              ))}
              <div className="flex items-start gap-2 mt-4 text-ink-muted bg-white/5 border border-white/10 p-3 rounded-lg">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed opacity-80">{riskQueue.disclaimer}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((i: DynamicStateObject) => (
                <div key={i} className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <div className="h-5 w-1/2 mb-3 bg-white/10 rounded" />
                  <div className="h-1.5 w-full mb-3 bg-white/5 rounded-full" />
                  <div className="h-4 w-3/4 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          )}
        </PremiumSectionCard>
      </div>

      <div className="xl:col-span-2 grid gap-6 md:grid-cols-2">
        <PremiumSectionCard title={(
          <span className="flex items-center gap-2">
            <Beaker className="h-4 w-4 text-sky-400" />
            {(t("aIDifferentialSuggestions") || "AI differential suggestions")}
          </span>
        )} className="border-t-[3px] border-t-sky-400/50 bg-sky-400/5">
          <div className="flex flex-col h-full">
            <textarea
              className="w-full min-h-[100px] resize-y mb-4 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-ink outline-none focus:border-sky-400/50 transition-colors placeholder:text-ink-muted/50"
              placeholder={(t("enterSymptomsOrClinicalNotesEG34yoMAcuteRLQPainNausea") || "Enter symptoms or clinical notes (e.g. '34yo M, acute RLQ pain, nausea')")}
              value={diffInput}
              onChange={(event: DynamicStateObject) => setDiffInput(event.target.value)}
            />
            <button 
              className="bg-sky-500 hover:bg-sky-400 text-canvas px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50" 
              type="button" 
              onClick={runDifferential} 
              disabled={diffLoading}
            >
              {diffLoading ? "Analyzing..." : (t("generateDifferential") || "Generate differential")}
            </button>
            
            {diffSuggestions && !diffLoading && (
              <div className="mt-6 space-y-4 animate-fadeSlideUp">
                <div className="rounded-xl bg-sky-400/10 border border-sky-400/20 p-4">
                  <h4 className="text-sm font-semibold text-sky-400 mb-2 uppercase tracking-wider">{t("topDifferentials") || "Top Differentials"}</h4>
                  <ul className="space-y-1.5">
                    {(Array.isArray(diffSuggestions.suggestions) ? diffSuggestions.suggestions : []).map((item: DynamicStateObject, i: DynamicStateObject) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-ink/90">
                        <span className="text-sky-400 opacity-50 block mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {Array.isArray(diffSuggestions.rationale) && diffSuggestions.rationale.length > 0 && (
                  <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                    <h4 className="text-xs font-semibold text-ink-muted mb-2 uppercase tracking-wider">{t("clinicalRationale") || "Clinical Rationale"}</h4>
                    <ul className="space-y-1.5">
                      {diffSuggestions.rationale.map((item: DynamicStateObject, i: DynamicStateObject) => (
                        <li key={i} className="text-xs text-ink-muted/80 leading-relaxed">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-[10px] text-ink-muted/50 italic px-1">{diffSuggestions.disclaimer}</p>
              </div>
            )}
          </div>
        </PremiumSectionCard>

        <PremiumSectionCard title={(
          <span className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-amber-400" />
            {(t("drugInteractionAlerts") || "Drug interaction alerts")}
          </span>
        )} className="border-t-[3px] border-t-amber-400/50 bg-amber-400/5">
          <div className="flex flex-col h-full">
            <input
              className="w-full mb-4 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-ink outline-none focus:border-amber-400/50 transition-colors placeholder:text-ink-muted/50"
              placeholder={(t("enterMedicinesEGWarfarinAmiodarone") || "Enter medicines (e.g. 'warfarin, amiodarone')")}
              value={medInput}
              onChange={(event: DynamicStateObject) => setMedInput(event.target.value)}
            />
            <button 
              className="bg-amber-500 hover:bg-amber-400 text-canvas px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50" 
              type="button" 
              onClick={runInteractions} 
              disabled={interactionLoading}
            >
              {interactionLoading ? "Checking..." : (t("checkInteractions") || "Check interactions")}
            </button>
            
            {interactionWarnings && !interactionLoading && (
              <div className="mt-6 space-y-4 animate-fadeSlideUp">
                {(Array.isArray(interactionWarnings.warnings) ? interactionWarnings.warnings : []).map((w: DynamicStateObject, idx: DynamicStateObject) => {
                  const isNotEvaluated = typeof w === "string" && w.startsWith("Not evaluated");
                  const isInteractionFound = typeof w === "string" && w.startsWith("Interaction found");
                  const isNoInteraction = typeof w === "string" && w.startsWith("No interaction");
                  
                  if (isNoInteraction) {
                    return (
                      <div key={idx} className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center">
                        <p className="text-sm font-medium text-primary">No interaction found (verified)</p>
                      </div>
                    );
                  }

                  if (isNotEvaluated) {
                    return (
                      <div key={idx} className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-amber-400">{t("notEvaluated") || "Not Evaluated"}</p>
                            <p className="text-sm text-ink/90 mt-1">{w}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className="rounded-xl bg-alert/10 border border-alert/20 p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-alert shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-alert">{t("interactionFound") || "Interaction Found"}</p>
                          <p className="text-sm text-ink/90 mt-1">{typeof w === "string" ? w.replace("Interaction found: ", "") : w.description || w}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {(!interactionWarnings.warnings || interactionWarnings.warnings.length === 0) && (
                  <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center">
                    <p className="text-sm font-medium text-primary">{t("noInteractionsProvided") || "No interactions provided"}</p>
                  </div>
                )}
                
                <p className="text-[10px] text-ink-muted/50 italic px-1">Disclaimer: {interactionWarnings.disclaimer}</p>
              </div>
            )}
          </div>
        </PremiumSectionCard>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../utils/queryKeys";
import PharmacistPremiumCard from "../../components/PharmacistPremiumCard";
import { useLanguage } from "../../context/LanguageContext";
import { fetchInventoryRisk, fetchRefillPrediction, fetchSubstitutionSuggestions } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";
import { translateDisplayText } from "../../utils/i18n";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

export interface AiPharmacistInsightsPanelProps {
  pharmacistId?: string | number;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function AiPharmacistInsightsPanel({ pharmacistId }: AiPharmacistInsightsPanelProps) {
  const { t, language, translateUiText = (value: string | number) => translateDisplayText(language, value) } = useLanguage();
  const [medicineName, setMedicineName] = useState<DynamicState>("");
  const [substitution, setSubstitution] = useState<DynamicStateObject | null>(null);
  const [substitutionError, setSubstitutionError] = useState<DynamicState>("");
  const { data: refill, error: refillError, isLoading: loadingRefill } = useQuery({
    queryKey: (queryKeys.pharmacist.refillPrediction((pharmacistId as any)) as any),
    queryFn: () => fetchRefillPrediction(pharmacistId),
    enabled: !!pharmacistId
  });

  const { data: inventory, error: inventoryError, isLoading: loadingInventory } = useQuery({
    queryKey: (queryKeys.pharmacist.inventoryRisk as any)(pharmacistId),
    queryFn: () => fetchInventoryRisk(pharmacistId),
    enabled: !!pharmacistId
  });

  const error = (refillError || inventoryError) ? getApiErrorMessage(refillError || inventoryError, t("unableLoadPharmacistDashboard")) : "";

  const runSubstitution = async () => {
    if (!medicineName.trim()) {
      return;
    }
    setSubstitutionError("");
    try {
      const response = await fetchSubstitutionSuggestions({ medicineName: medicineName.trim() });
      setSubstitution(response);
    } catch (err: DynamicStateObject) {
      setSubstitutionError(getApiErrorMessage(err, t("unableLoadPharmacistDashboard")));
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <PharmacistPremiumCard title={(t("refillPrediction") || "Refill prediction")}>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {refill ? (
          <div className="space-y-3 text-sm text-slate-300">
            {(Array.isArray(refill.items) ? refill.items : []).map((item: DynamicStateObject) => (
              <div key={`${item.medicineName}-${item.estimatedRefillDate}`} className="rounded-xl bg-white/5 p-4 border border-white/10 hover:bg-white/10 transition-colors">
                <p className="font-semibold text-white text-base">{item.medicineName}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {(t("estimatedRefill") || "Estimated refill")}: <span className="text-emerald-400 font-medium">{item.estimatedRefillDate}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">{item.status}</p>
              </div>
            ))}
            <p className="text-xs text-slate-500 pt-2">{refill.disclaimer}</p>
          </div>
        ) : <p className="text-sm text-slate-400">{t("loadingPharmacistDashboard")}</p>}
      </PharmacistPremiumCard>

      <PharmacistPremiumCard title={(t("inventoryRiskAlerts") || "Inventory risk alerts")}>
        {inventory ? (
          <div className="space-y-3 text-sm text-slate-300">
            {(inventory.alerts || []).map((item: DynamicStateObject) => (
              <p key={item} className="rounded-xl bg-red-500/10 p-4 border border-red-500/20 text-red-200">
                {item}
              </p>
            ))}
            <p className="text-xs text-slate-500 pt-2">{inventory.disclaimer}</p>
          </div>
        ) : <p className="text-sm text-slate-400">{t("loadingPharmacistDashboard")}</p>}
      </PharmacistPremiumCard>

      <PharmacistPremiumCard title={(t("medicationSubstitutionSuggestions") || "Medication substitution suggestions")}>
        <input
          className="ph-input"
          placeholder={(t("enterMedicineName") || "Enter medicine name")}
          value={medicineName}
          onChange={(event: DynamicStateObject) => setMedicineName(event.target.value)}
        />
        <button className="ph-btn ph-btn-secondary mt-4 w-full sm:w-auto" type="button" onClick={runSubstitution}>
          {(t("getSuggestions") || "Get suggestions")}
        </button>
        {substitutionError ? <p className="text-sm text-red-400 mt-2">{substitutionError}</p> : null}
        {substitution ? (
          <div className="mt-4 space-y-2 text-sm text-slate-300 bg-white/5 p-4 rounded-xl border border-white/10">
            <ul className="list-disc pl-5 space-y-1">
              {(Array.isArray(substitution.suggestions) ? substitution.suggestions : []).map((item: DynamicStateObject) => <li key={item}>{item}</li>)}
            </ul>
            <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-white/10">{substitution.disclaimer}</p>
          </div>
        ) : null}
      </PharmacistPremiumCard>
    </div>
  );
}

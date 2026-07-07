import { useEffect, useState } from "react";
import SectionCard from "../../components/SectionCard";
import { useLanguage } from "../../context/LanguageContext";
import { fetchInventoryRisk, fetchRefillPrediction, fetchSubstitutionSuggestions } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";
import { translateDisplayText } from "../../utils/i18n";

export default function AiPharmacistInsightsPanel({ pharmacistId }) {
  const { t, language, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const [refill, setRefill] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [medicineName, setMedicineName] = useState("");
  const [substitution, setSubstitution] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pharmacistId) {
      return;
    }
    let active = true;
    Promise.allSettled([
      fetchRefillPrediction(pharmacistId),
      fetchInventoryRisk(pharmacistId)
    ]).then(([refillResult, inventoryResult]) => {
      if (!active) return;
      if (refillResult.status === "fulfilled") {
        setRefill(refillResult.value);
      }
      if (inventoryResult.status === "fulfilled") {
        setInventory(inventoryResult.value);
      }
      const errorResult = [refillResult, inventoryResult].find((item) => item.status === "rejected");
      if (errorResult) {
        setError(getApiErrorMessage(errorResult.reason, t("unableLoadPharmacistDashboard")));
      } else {
        setError("");
      }
    });
    return () => {
      active = false;
    };
  }, [pharmacistId, t]);

  const runSubstitution = async () => {
    if (!medicineName.trim()) {
      return;
    }
    setError("");
    try {
      const response = await fetchSubstitutionSuggestions({ medicineName: medicineName.trim() });
      setSubstitution(response);
    } catch (err) {
      setError(getApiErrorMessage(err, t("unableLoadPharmacistDashboard")));
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionCard title={translateUiText("Refill prediction")}>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {refill ? (
          <div className="space-y-2 text-sm text-slate-700">
            {(Array.isArray(refill.items) ? refill.items : []).map((item) => (
              <div key={`${item.medicineName}-${item.estimatedRefillDate}`} className="rounded-2xl bg-mist p-3">
                <p className="font-semibold">{item.medicineName}</p>
                <p className="text-xs text-slate-500">
                  {translateUiText("Estimated refill")}: {item.estimatedRefillDate}
                </p>
                <p className="text-xs text-slate-500">{item.status}</p>
              </div>
            ))}
            <p className="text-xs text-slate-500">{refill.disclaimer}</p>
          </div>
        ) : <p className="text-sm text-slate-500">{t("loadingPharmacistDashboard")}</p>}
      </SectionCard>

      <SectionCard title={translateUiText("Inventory risk alerts")}>
        {inventory ? (
          <div className="space-y-2 text-sm text-slate-700">
            {(inventory.alerts || []).map((item) => <p key={item}>{item}</p>)}
            <p className="text-xs text-slate-500">{inventory.disclaimer}</p>
          </div>
        ) : <p className="text-sm text-slate-500">{t("loadingPharmacistDashboard")}</p>}
      </SectionCard>

      <SectionCard title={translateUiText("Medication substitution suggestions")}>
        <input
          className="field"
          placeholder={translateUiText("Enter medicine name")}
          value={medicineName}
          onChange={(event) => setMedicineName(event.target.value)}
        />
        <button className="btn-secondary mt-3" type="button" onClick={runSubstitution}>
          {translateUiText("Get suggestions")}
        </button>
        {substitution ? (
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <ul className="list-disc pl-5">
              {(Array.isArray(substitution.suggestions) ? substitution.suggestions : []).map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className="text-xs text-slate-500">{substitution.disclaimer}</p>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}

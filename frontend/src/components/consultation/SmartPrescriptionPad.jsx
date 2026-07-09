import { useState } from "react";
import FormField from "../FormField";
import PremiumSectionCard from "../PremiumSectionCard";
import { useLanguage } from "../../context/LanguageContext";
import { ShieldAlert, Calculator, Pill, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { checkClinicalDrugInteractions, calculateDosage, suggestClinicalAlternatives } from "../../ai/services/aiService";

import { fetchPatientPrescriptions } from "../../services/telecareService";

export default function SmartPrescriptionPad({ 
  prescription, 
  setPrescription, 
  patientId,
  onSave, 
  loading, 
  disabled,
  message,
  error
}) {
  const { t } = useLanguage();
  
  const [checking, setChecking] = useState(false);
  const [interactions, setInteractions] = useState(null);
  
  const [calculating, setCalculating] = useState(false);
  const [dosageRec, setDosageRec] = useState(null);

  const [suggesting, setSuggesting] = useState(false);
  const [alternatives, setAlternatives] = useState(null);

  const handleCheckInteractions = async () => {
    if (!prescription.medicineName || !patientId) return;
    setChecking(true);
    setInteractions(null);
    try {
      const activePrescriptions = await fetchPatientPrescriptions(patientId, { status: "ACTIVE" });
      const currentMedications = activePrescriptions.map(p => p.medicineName);
      
      const req = { medications: [...currentMedications, prescription.medicineName] };
      const res = await checkClinicalDrugInteractions(req);
      setInteractions(res.alerts);
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  const handleCalculateDosage = async () => {
    if (!prescription.medicineName) return;
    setCalculating(true);
    setDosageRec(null);
    try {
      const req = { patientId: 1, medicineName: prescription.medicineName };
      const res = await calculateDosage(req);
      setDosageRec(res);
      // Auto apply dosage
      setPrescription(prev => ({ ...prev, dosage: res.suggestedDosage }));
    } catch (err) {
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  const handleSuggestAlternatives = async () => {
    if (!prescription.medicineName) return;
    setSuggesting(true);
    setAlternatives(null);
    try {
      const req = { medicineName: prescription.medicineName };
      const res = await suggestClinicalAlternatives(req);
      setAlternatives(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <PremiumSectionCard
      title="Smart Prescription Pad"
      action={
        <button
          className="doc-btn doc-btn-primary"
          type="button"
          disabled={disabled || loading}
          onClick={onSave}
        >
          {disabled ? t("prescriptionLoaded") : t("generatePrescription")}
        </button>
      }
    >
      <div className="grid gap-4">
        <FormField
          label={t("patientName")}
          value={prescription.patientDisplayName}
          onChange={(e) => setPrescription({ ...prescription, patientDisplayName: e.target.value })}
        />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-600">{t("prescriptionNote")}</span>
          <textarea
            className="doc-input min-h-36 resize-y"
            value={prescription.notes}
            onChange={(e) => setPrescription({ ...prescription, notes: e.target.value })}
          />
        </label>
        
        <div className="bg-tcd-panel-2 border border-tcd-panel-line rounded-lg p-4 space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <FormField 
                label={t("medicineName")} 
                value={prescription.medicineName} 
                onChange={(e) => {
                  setPrescription({ ...prescription, medicineName: e.target.value });
                  setInteractions(null);
                  setDosageRec(null);
                  setAlternatives(null);
                }} 
              />
            </div>
            <div className="flex gap-2 mb-1">
              <button 
                onClick={handleCheckInteractions} 
                disabled={!prescription.medicineName || checking}
                className="flex items-center gap-1.5 px-3 py-2 bg-tcd-teal/10 text-tcd-teal rounded-md text-xs font-medium hover:bg-tcd-teal/20 transition-colors disabled:opacity-50"
                title="Check Interactions"
              >
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                Interactions
              </button>
              <button 
                onClick={handleCalculateDosage}
                disabled={!prescription.medicineName || calculating}
                className="flex items-center gap-1.5 px-3 py-2 bg-tcd-blue/10 text-tcd-blue rounded-md text-xs font-medium hover:bg-tcd-blue/20 transition-colors disabled:opacity-50"
                title="Calculate Dosage"
              >
                {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                Dosage
              </button>
              <button 
                onClick={handleSuggestAlternatives}
                disabled={!prescription.medicineName || suggesting}
                className="flex items-center gap-1.5 px-3 py-2 bg-tcd-purple/10 text-tcd-purple rounded-md text-xs font-medium hover:bg-tcd-purple/20 transition-colors disabled:opacity-50"
                title="Suggest Alternatives"
              >
                {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pill className="w-4 h-4" />}
                Substitutes
              </button>
            </div>
            
            <div className="flex justify-end mb-2">
              <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-slate-200 rounded-md text-xs font-medium hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50">
                <ShieldAlert className="w-4 h-4" />
                Scan Prescription
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setChecking(true);
                    try {
                      const formData = new FormData();
                      formData.append("image", file);
                      const { extractPrescriptionFromImage } = await import("../../ai/services/aiService");
                      const res = await extractPrescriptionFromImage(formData);
                      if (res.extractedMedications?.length) {
                        setPrescription(prev => ({ 
                          ...prev, 
                          medicineName: res.extractedMedications[0],
                          dosage: res.instructions || prev.dosage
                        }));
                      }
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setChecking(false);
                      e.target.value = null;
                    }
                  }} 
                />
              </label>
            </div>
          </div>

          {/* AI Insights Display */}
          {interactions && interactions.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3">
              <div className="flex items-center gap-2 text-red-500 font-medium text-sm mb-2">
                <AlertTriangle className="w-4 h-4" /> Drug Interactions Detected
              </div>
              <ul className="space-y-1">
                {interactions.map((int, i) => (
                  <li key={i} className="text-xs text-red-400">
                    <span className="font-semibold uppercase mr-1">{int.severity}:</span> 
                    {int.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {interactions && interactions.length === 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-md p-2 flex items-center gap-2 text-emerald-500 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4" /> No known interactions found.
            </div>
          )}

          {dosageRec && (
            <div className="bg-tcd-blue/10 border border-tcd-blue/30 rounded-md p-3 text-sm">
              <div className="font-medium text-tcd-blue mb-1">Recommended Dosage: {dosageRec.suggestedDosage}</div>
              <div className="text-xs text-tcd-text-muted">{dosageRec.reasoning}</div>
            </div>
          )}

          {alternatives && alternatives.alternatives.length > 0 && (
            <div className="bg-tcd-purple/10 border border-tcd-purple/30 rounded-md p-3 text-sm">
              <div className="font-medium text-tcd-purple mb-1">Formulary Alternatives</div>
              <div className="text-xs text-tcd-text-muted mb-2">{alternatives.reasoning}</div>
              <div className="flex flex-wrap gap-2">
                {alternatives.alternatives.map((alt, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setPrescription(prev => ({ ...prev, medicineName: alt }));
                      setAlternatives(null);
                    }}
                    className="px-2 py-1 bg-tcd-purple/20 text-tcd-purple rounded text-xs hover:bg-tcd-purple/30 transition-colors"
                  >
                    {alt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField label={t("dosage")} value={prescription.dosage} onChange={(e) => setPrescription({ ...prescription, dosage: e.target.value })} />
          <FormField label={t("frequency")} value={prescription.frequency} onChange={(e) => setPrescription({ ...prescription, frequency: e.target.value })} />
          <FormField label={t("durationDays")} type="number" value={prescription.durationDays} onChange={(e) => setPrescription({ ...prescription, durationDays: e.target.value })} />
        </div>
        <FormField label={t("followUpDate")} type="date" value={prescription.followUpDate} onChange={(e) => setPrescription({ ...prescription, followUpDate: e.target.value })} />
      </div>
      
      {message ? <p className="mt-4 text-sm text-emerald-600" role="status" aria-live="polite">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600" role="alert">{error}</p> : null}
    </PremiumSectionCard>
  );
}

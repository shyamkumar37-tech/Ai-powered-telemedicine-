import { useState } from "react";
import FormField from "../FormField";
import PremiumSectionCard from "../PremiumSectionCard";
import { useLanguage } from "../../context/LanguageContext";
import { ShieldAlert, Calculator, Pill, Loader2, AlertTriangle, CheckCircle2, Plus, Trash2, Search } from "lucide-react";
import { checkClinicalDrugInteractions, calculateDosage, suggestClinicalAlternatives } from "../../ai/services/aiService";
import { fetchPatientPrescriptions } from "../../services/telecareService";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

export interface SmartPrescriptionPadProps {
  prescription?: DynamicState;
  setPrescription?: DynamicState;
  patientId?: string | number;
  onSave?: (...args: DynamicStateObject[]) => void;
  loading?: DynamicState;
  disabled?: DynamicState;
  message?: DynamicState;
  error?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function SmartPrescriptionPad({ 
  prescription, 
  setPrescription, 
  patientId,
  onSave, 
  loading, 
  disabled,
  message,
  error
}: SmartPrescriptionPadProps) {
  const { t } = useLanguage();
  
  const [checking, setChecking] = useState<DynamicState>(false);
  const [interactions, setInteractions] = useState<DynamicStateObject | null>(null);
  
  const [calculating, setCalculating] = useState<DynamicState>(false);
  const [dosageRec, setDosageRec] = useState<DynamicStateObject | null>(null);

  const [suggesting, setSuggesting] = useState<DynamicState>(false);
  const [alternatives, setAlternatives] = useState<DynamicStateObject | null>(null);

  const [newMed, setNewMed] = useState<DynamicState>({ medicineName: "", dosage: "", frequency: "", durationDays: 5, notes: "" });

  const handleCheckInteractions = async () => {
    if (!newMed.medicineName || !patientId) return;
    setChecking(true);
    setInteractions(null);
    try {
      const activePrescriptions = await fetchPatientPrescriptions(patientId, { status: "ACTIVE" });
      const currentMedications = activePrescriptions.map((p: DynamicStateObject) => p.medicineName);
      const builderMedications = prescription.medications.map((m: DynamicStateObject) => m.medicineName);
      
      const req = { medications: [...currentMedications, ...builderMedications, newMed.medicineName] };
      const res = await checkClinicalDrugInteractions(req);
      setInteractions(res.alerts);
    } catch (err: DynamicStateObject) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  const handleCalculateDosage = async () => {
    if (!newMed.medicineName) return;
    setCalculating(true);
    setDosageRec(null);
    try {
      const req = { patientId: 1, medicineName: newMed.medicineName };
      const res = await calculateDosage(req);
      setDosageRec(res);
      setNewMed((prev: DynamicStateObject) => ({ ...prev, dosage: res.suggestedDosage }));
    } catch (err: DynamicStateObject) {
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  const handleSuggestAlternatives = async () => {
    if (!newMed.medicineName) return;
    setSuggesting(true);
    setAlternatives(null);
    try {
      const req = { medicineName: newMed.medicineName };
      const res = await suggestClinicalAlternatives(req);
      setAlternatives(res);
    } catch (err: DynamicStateObject) {
      console.error(err);
    } finally {
      setSuggesting(false);
    }
  };

  const handleAddMedication = () => {
    if (!newMed.medicineName) return;
    setPrescription({
      ...prescription,
      medications: [...prescription.medications, { ...newMed, durationDays: Number(newMed.durationDays) }]
    });
    setNewMed({ medicineName: "", dosage: "", frequency: "", durationDays: 5, notes: "" });
    setInteractions(null);
    setDosageRec(null);
    setAlternatives(null);
  };

  const handleRemoveMedication = (index: number | string) => {
    const meds = [...prescription.medications];
    // @ts-expect-error - Auto-suppressed during migration
    meds.splice(index, 1);
    setPrescription({ ...prescription, medications: meds });
  };

  return (
    <PremiumSectionCard
      title={(
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-purple-400" />
          <span>{t("smartEPrescriptionBuilder") || "Smart e-Prescription Builder"}</span>
        </div>
      )}
      action={
        <button
          className="doc-btn doc-btn-primary bg-purple-500 hover:bg-purple-600 shadow-[0_4px_14px_0_rgba(168,85,247,0.39)]"
          type="button"
          disabled={disabled || loading || prescription.medications.length === 0}
          onClick={onSave}
        >
          {disabled ? t("prescriptionLoaded") : t("generatePrescription")}
        </button>
      }
    >
      <div className="grid gap-6">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            label={t("patientName")}
            value={prescription.patientDisplayName}
            onChange={(e: DynamicStateObject) => setPrescription({ ...prescription, patientDisplayName: e.target.value })}
          />
          <FormField 
            label={t("followUpDate")} 
            type="date" 
            value={prescription.followUpDate} 
            onChange={(e: DynamicStateObject) => setPrescription({ ...prescription, followUpDate: e.target.value })} 
          />
        </div>
        
        {/* Medication List */}
        {prescription.medications.length > 0 && (
          <div className="space-y-3">
            <h4 className="doc-subheading text-white">Current Order ({prescription.medications.length})</h4>
            <div className="space-y-2">
              {prescription.medications.map((med: DynamicStateObject, i: DynamicStateObject) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl">
                  <div>
                    <p className="font-bold text-white text-lg">{med.medicineName}</p>
                    <p className="text-sm text-slate-400">{med.dosage} &bull; {med.frequency} &bull; {med.durationDays} days</p>
                  </div>
                  {!disabled && (
                    <button 
                      onClick={() => handleRemoveMedication(i)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Builder Panel */}
        {!disabled && (
          <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-5 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <h4 className="doc-subheading text-purple-400 flex items-center gap-2">
              <Plus className="w-4 h-4" /> {t("addMedication") || "Add Medication"}</h4>
            
            <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
              <div className="flex-1">
                <FormField 
                  label={t("medicineName")} 
                  value={newMed.medicineName} 
                  placeholder="e.g. Amoxicillin"
                  onChange={(e: DynamicStateObject) => {
                    setNewMed({ ...newMed, medicineName: e.target.value });
                    setInteractions(null);
                    setDosageRec(null);
                    setAlternatives(null);
                  }} 
                />
              </div>
              <div className="flex gap-2 mb-1">
                <button 
                  onClick={handleCheckInteractions} 
                  disabled={!newMed.medicineName || checking}
                  className="doc-btn doc-btn-secondary px-3 py-2 text-xs h-[42px] border-slate-700 hover:bg-slate-800"
                  title="Check Interactions"
                >
                  {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4 text-alert" />}
                  Check
                </button>
                <button 
                  onClick={handleCalculateDosage}
                  disabled={!newMed.medicineName || calculating}
                  className="doc-btn doc-btn-secondary px-3 py-2 text-xs h-[42px] border-slate-700 hover:bg-slate-800"
                  title="Calculate Dosage"
                >
                  {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4 text-sky-400" />}
                  Dose
                </button>
                <button 
                  onClick={handleSuggestAlternatives}
                  disabled={!newMed.medicineName || suggesting}
                  className="doc-btn doc-btn-secondary px-3 py-2 text-xs h-[42px] border-slate-700 hover:bg-slate-800"
                  title="Suggest Alternatives"
                >
                  {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 text-purple-400" />}
                  Alts
                </button>
              </div>
            </div>

            {/* AI Insights Display */}
            {interactions && interactions.length > 0 && (
              <div className="bg-alert/10 border border-alert/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-alert font-bold text-sm mb-3">
                  <AlertTriangle className="w-4 h-4" /> {t("drugInteractionsDetected") || "Drug Interactions Detected"}</div>
                <ul className="space-y-1">
                  {interactions.map((int: DynamicStateObject, i: DynamicStateObject) => (
                    <li key={i} className="text-xs text-alert/90 flex gap-1">
                      <span className="font-bold uppercase tracking-wider">{int.severity}:</span> 
                      <span>{int.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {interactions && interactions.length === 0 && (
              <div className="bg-success/10 border border-success/20 rounded-xl p-3 flex items-center gap-2 text-success text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" /> {t("safeToPrescribeNoKnownInteractions") || "Safe to prescribe. No known interactions."}</div>
            )}

            {dosageRec && (
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 text-sm">
                <div className="font-bold text-sky-400 mb-1">Recommended Dosage: {dosageRec.suggestedDosage}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{dosageRec.reasoning}</div>
              </div>
            )}

            {alternatives && alternatives.alternatives.length > 0 && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-sm">
                <div className="font-bold text-purple-400 mb-1 uppercase tracking-wider text-xs">{t("formularyAlternatives") || "Formulary Alternatives"}</div>
                <div className="text-xs text-slate-400 mb-3 leading-relaxed">{alternatives.reasoning}</div>
                <div className="flex flex-wrap gap-2">
                  {alternatives.alternatives.map((alt: DynamicStateObject, i: DynamicStateObject) => (
                    <button 
                      key={i}
                      onClick={() => {
                        setNewMed((prev: DynamicStateObject) => ({ ...prev, medicineName: alt }));
                        setAlternatives(null);
                      }}
                      className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 font-semibold rounded-md text-xs hover:bg-purple-500/40 transition-colors"
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <FormField label={t("dosage")} value={newMed.dosage} placeholder="e.g. 500mg" onChange={(e: DynamicStateObject) => setNewMed({ ...newMed, dosage: e.target.value })} />
              <FormField label={t("frequency")} value={newMed.frequency} placeholder="e.g. BID" onChange={(e: DynamicStateObject) => setNewMed({ ...newMed, frequency: e.target.value })} />
              <FormField label={t("durationDays")} type="number" value={newMed.durationDays} onChange={(e: DynamicStateObject) => setNewMed({ ...newMed, durationDays: e.target.value })} />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={!newMed.medicineName || !newMed.dosage}
                className="doc-btn bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 disabled:opacity-50"
                onClick={handleAddMedication}
              >
                <Plus className="w-4 h-4" /> {t("addToOrder") || "Add to Order"}</button>
            </div>
          </div>
        )}

        <label className="block space-y-2 mt-4">
          <span className="doc-subheading">{t("prescriptionNote")}</span>
          <textarea
            className="doc-input min-h-[100px] bg-slate-900/50"
            placeholder="Special instructions for the pharmacist..."
            value={prescription.notes}
            onChange={(e: DynamicStateObject) => setPrescription({ ...prescription, notes: e.target.value })}
          />
        </label>
      </div>
      
      {error ? <p className="mt-4 text-sm font-semibold text-alert bg-alert/10 border border-alert/20 px-4 py-3 rounded-xl">{error}</p> : null}
      {message ? <p className="mt-4 text-sm font-semibold text-primary bg-primary/10 border border-primary/20 px-4 py-3 rounded-xl">{message}</p> : null}
    </PremiumSectionCard>
  );
}

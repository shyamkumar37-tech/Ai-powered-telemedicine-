import { useLanguage } from "../../context/LanguageContext";
import { useState } from "react";
import PremiumSectionCard from "../PremiumSectionCard";
import { FileSignature, ShieldAlert, Loader2, CheckCircle2, Send } from "lucide-react";
import { DynamicStateObject, DynamicState } from "./../../types/DynamicState";

export interface PriorAuthorizationPanelProps {
  patientId?: string | number;
  consultationId?: string | number;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function PriorAuthorizationPanel({ patientId, consultationId }: PriorAuthorizationPanelProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState<DynamicState>(false);
  const [status, setStatus] = useState<DynamicState>("idle"); // idle | processing | approved | denied
  const [medication, setMedication] = useState<DynamicState>("Oxycodone 10mg");
  const [justification, setJustification] = useState<DynamicState>("Severe chronic back pain unresponsive to NSAIDs.");

  const handleSubmit = () => {
    setLoading(true);
    setStatus("processing");
    
    // Simulate API call to Insurance/PBM clearinghouse
    setTimeout(() => {
      setLoading(false);
      // Simulate 80% approval rate
      if (Math.random() > 0.2) {
        setStatus("approved");
      } else {
        setStatus("denied");
      }
    }, 2500);
  };

  return (
    <PremiumSectionCard
      title={(
        <div className="flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-indigo-400" />
          <span>Automated Prior Authorization (ePA)</span>
        </div>
      )}
    >
      <div className="mt-4 space-y-4">
        {status === "idle" && (
          <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
            <p className="text-sm text-slate-300 mb-4">
              Submit clinical justification directly to the PBM (Pharmacy Benefit Manager) to instantly approve restricted medications.
            </p>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-400">
                {t("restrictedMedication") || "Restricted Medication"}<input 
                  type="text"
                  value={medication}
                  onChange={(e: DynamicStateObject) => setMedication(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-white text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-slate-400">
                {t("clinicalJustification") || "Clinical Justification"}<textarea 
                  value={justification}
                  onChange={(e: DynamicStateObject) => setJustification(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-white text-sm"
                />
              </label>
              <button 
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold transition-colors"
              >
                <Send className="w-4 h-4" />
                {t("submitToInsurance") || "Submit to Insurance"}</button>
            </div>
          </div>
        )}

        {status === "processing" && (
          <div className="bg-slate-900/50 rounded-xl p-8 border border-white/10 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <h4 className="font-semibold text-white mb-1">{t("awaitingPBMResponse") || "Awaiting PBM Response"}</h4>
            <p className="text-sm text-slate-400">{t("runningAutomatedCriteriaCheck") || "Running automated criteria check..."}</p>
          </div>
        )}

        {status === "approved" && (
          <div className="bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/30 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h4 className="font-bold text-lg text-white mb-1">{t("priorAuthApproved") || "Prior Auth Approved"}</h4>
            <p className="text-sm text-emerald-300 mb-4">{t("medicationIsNowFullyCoveredForThePatient") || "Medication is now fully covered for the patient."}</p>
            <button 
              onClick={() => setStatus("idle")}
              className="text-sm text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg"
            >
              {t("submitAnother") || "Submit Another"}</button>
          </div>
        )}

        {status === "denied" && (
          <div className="bg-rose-500/10 rounded-xl p-6 border border-rose-500/30 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            </div>
            <h4 className="font-bold text-lg text-white mb-1">{t("priorAuthDenied") || "Prior Auth Denied"}</h4>
            <p className="text-sm text-rose-300 mb-4">{t("doesNotMeetStepTherapyRequirementsAnAlternativeIsRecommended") || "Does not meet step-therapy requirements. An alternative is recommended."}</p>
            <button 
              onClick={() => setStatus("idle")}
              className="text-sm text-white bg-rose-500/20 hover:bg-rose-500/30 px-4 py-2 rounded-lg"
            >
              {t("modifyResubmit") || "Modify & Resubmit"}</button>
          </div>
        )}
      </div>
    </PremiumSectionCard>
  );
}

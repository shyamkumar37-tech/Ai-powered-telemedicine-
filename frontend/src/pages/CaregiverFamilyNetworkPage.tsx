import { useEffect, useState } from "react";
import LocalizedText from "../components/LocalizedText";
import CaregiverPremiumCard from "../components/CaregiverPremiumCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchCaregiverFamilyNetwork } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { useToast } from "../components/ui/ToastProvider";
import { Users, Mail, Phone, HeartHandshake, UserPlus } from "lucide-react";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function CaregiverFamilyNetworkPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const caregiverId = auth.profileId ?? auth.userId;
  const [network, setNetwork] = useState<DynamicStateObject | null>(null);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [error, setError] = useState<DynamicState>("");
  const { pushToast } = useToast();
  
  // Form state
  const [inviteEmail, setInviteEmail] = useState<DynamicState>("");
  const [invitePatientId, setInvitePatientId] = useState<DynamicState>("");

  useEffect(() => {
    setLoading(true);
    fetchCaregiverFamilyNetwork(caregiverId)
      .then((data: DynamicStateObject) => {
        setNetwork(data);
        setError("");
      })
      .catch((err: DynamicStateObject) => setError(getApiErrorMessage(err, t("unableLoadCaregiverFamilyNetwork"))))
      .finally(() => setLoading(false));
  }, [caregiverId]);

  const handleInvite = async (e: DynamicStateObject) => {
    e.preventDefault();
    if (!inviteEmail || !invitePatientId) {
      pushToast({ type: "error", title: "Missing Fields", message: "Please provide an email and select a patient." });
      return;
    }
    try {
      await import("../services/telecareService").then((m: DynamicStateObject) => m.inviteCaregiver({
        patientId: parseInt(invitePatientId, 10),
        email: inviteEmail,
        relationship: "Family Member"
      }));
      pushToast({ type: "success", title: "Invite Sent", message: `Secure invitation sent to ${inviteEmail}.` });
      setInviteEmail("");
    } catch (err: DynamicStateObject) {
      pushToast({ type: "error", title: "Invite Failed", message: getApiErrorMessage(err, "Could not send invitation.") });
    }
  };

  return (
    <div className="tcd-animate-in space-y-6">
      <CaregiverPremiumCard
        title={
          <span className="inline-flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-400" />
            <span>{t("expandCareNetwork") || "Expand Care Network"}</span>
          </span>
        }
      >
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-end gap-4 bg-[var(--tc-surface-muted)] p-5 rounded-xl border border-[var(--tc-border)]">
          <label className="flex-1 w-full block space-y-2">
            <span className="text-sm font-medium text-slate-300">{t("inviteEmail") || "Invite Email"}</span>
            <input 
              type="email" 
              className="cg-input w-full" 
              placeholder="family.member@example.com" 
              value={inviteEmail} 
              onChange={(e: DynamicStateObject) => setInviteEmail(e.target.value)} 
            />
          </label>
          <label className="flex-1 w-full block space-y-2">
            <span className="text-sm font-medium text-slate-300">{t("forPatient") || "For Patient"}</span>
            <select className="cg-input w-full" value={invitePatientId} onChange={(e: DynamicStateObject) => setInvitePatientId(e.target.value)}>
              <option value="" disabled>{t("selectPatient") || "Select patient..."}</option>
              {(network?.linkedPatients || []).map((p: DynamicStateObject) => (
                <option key={p.patientId} value={p.patientId}>{p.patientName}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="cg-btn cg-btn-primary w-full sm:w-auto px-6 h-[46px]">
            {t("sendInvite") || "Send Invite"}</button>
        </form>
      </CaregiverPremiumCard>

      <CaregiverPremiumCard
        title={
          <span className="inline-flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-indigo-400" />
            <LocalizedText as="span" value={t("familyCareNetwork")} minLength={4} />
          </span>
        }
      >
        {loading ? <LoadingSkeleton lines={4} /> : null}
        {error ? (
          <ErrorStateCard
            title={t("unableLoadCaregiverFamilyNetwork")}
            body={error}
          />
        ) : null}
        {!loading && !error && !(network?.linkedPatients?.length) ? (
          <EmptyStateCard
            title={t("noLinkedFamilies")}
            body={translateDisplayText(language, "Linked families will appear here once patients share access.")}
          />
        ) : null}
        <div className="space-y-6">
          {(network?.linkedPatients || []).map((item: DynamicStateObject) => (
            <div key={item.patientId} className="rounded-xl bg-[var(--tc-surface)] border border-[var(--tc-border)] p-5 transition-colors hover:bg-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-[var(--tc-border)]">
                <div>
                  <h3 className="text-xl font-semibold text-white">{item.patientName}</h3>
                  <p className="text-sm text-slate-400 mt-1">{item.sharedSupport ? t("sharedSupport") : t("singleSupport")}</p>
                </div>
                <span className="rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {(Array.isArray(item.caregivers) ? item.caregivers.length : 0)} {t("caregiversLabel")}
                </span>
              </div>
              
              <LocalizedText as="p" className="mb-5 text-sm text-slate-300 bg-black/20 p-3 rounded-lg border border-white/5" value={item.coordinationNote} />
              
              <div className="grid gap-4 md:grid-cols-2">
                {(Array.isArray(item.caregivers) ? item.caregivers : []).map((caregiver: DynamicStateObject) => (
                  <div key={caregiver.caregiverId} className="rounded-xl bg-[var(--tc-surface)] border border-[var(--tc-border)] px-4 py-4 hover:border-indigo-500/30 transition-colors">
                    <p className="font-semibold text-white text-base">{caregiver.caregiverName}</p>
                    <p className="text-sm text-indigo-400 font-medium mb-3">{translateDisplayText(language, caregiver.relationshipLabel || t("caregiverCredential"))}</p>
                    
                    <div className="space-y-2 mt-auto">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Phone className="w-4 h-4 text-slate-500" />
                        {caregiver.phone || "No phone provided"}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Mail className="w-4 h-4 text-slate-500" />
                        {caregiver.email || "No email provided"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CaregiverPremiumCard>
    </div>
  );
}


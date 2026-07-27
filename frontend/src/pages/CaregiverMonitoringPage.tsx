import { useEffect, useState } from "react";
import AlertStrip from "../components/AlertStrip";
import CaregiverPremiumCard from "../components/CaregiverPremiumCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchLinkedPatients, linkCaregiver } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { useToast } from "../components/ui/ToastProvider";
import { Activity, Link as LinkIcon, UserCircle, ShieldAlert } from "lucide-react";
import GeofenceMap from "../components/caregiver/GeofenceMap";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function CaregiverMonitoringPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const caregiverId = auth.profileId ?? auth.userId;
  const [linkedPatients, setLinkedPatients] = useState<DynamicStateObject[]>([]);
  const [patientId, setPatientId] = useState<DynamicState>("");
  const [error, setError] = useState<DynamicState>("");
  const [loading, setLoading] = useState<DynamicState>(true);
  const { pushToast } = useToast();
  
  const lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const load = () => {
    setLoading(true);
    fetchLinkedPatients(caregiverId)
      .then((data: DynamicStateObject) => {
        setLinkedPatients(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err: DynamicStateObject) => setError(getApiErrorMessage(err, t("unableLoadLinkedPatients"))))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [caregiverId]);

  return (
    <div className="tcd-animate-in space-y-6">
      <CaregiverPremiumCard
        title={
          <span className="inline-flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-indigo-400" />
            <span>{t("linkPatient")}</span>
          </span>
        }
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 max-w-xl">
          <label className="flex-1 w-full block space-y-2">
            <span className="text-sm font-medium text-slate-400">{t("patientIDOrInviteCode") || "Patient ID or Invite Code"}</span>
            <input 
              className="cg-input w-full" 
              placeholder="e.g. 1 or P-98765"
              value={patientId} 
              onChange={(e: DynamicStateObject) => setPatientId(e.target.value)} 
            />
          </label>
          <button
            className="cg-btn cg-btn-primary w-full sm:w-auto"
            onClick={async () => {
              if (!patientId.trim()) {
                setError("Please enter a valid Patient ID");
                return;
              }
              try {
                setError("");
                await linkCaregiver({ patientId: Number(patientId), caregiverId });
                pushToast({ type: "success", title: "Patient Linked", message: t("patientLinkedSuccessfully") });
                setPatientId("");
                await load();
              } catch (err: DynamicStateObject) {
                const errMsg = getApiErrorMessage(err, t("unableLinkPatient"));
                setError(errMsg);
                pushToast({ type: "error", title: "Linking Failed", message: errMsg });
              }
            }}
          >
            {t("link")}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-400 flex items-center gap-1"><ShieldAlert className="w-4 h-4" />{error}</p> : null}
      </CaregiverPremiumCard>
      
      <CaregiverPremiumCard
        title={
          <div className="flex items-center justify-between w-full">
            <span className="inline-flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              <span>{t("linkedPatientMonitoring")}</span>
            </span>
            <span className="text-xs font-medium text-slate-400">Updated {lastUpdated}</span>
          </div>
        }
      >
        {loading ? <LoadingSkeleton lines={4} /> : null}
        {error ? (
          <ErrorStateCard
            title={t("unableLoadLinkedPatients")}
            body={error}
            actionLabel={t("retry")}
            onAction={() => load()}
          />
        ) : null}
        {!loading && !error && !linkedPatients.length ? (
          <EmptyStateCard
            title={t("noLinkedPatients")}
            body={t("linkPatient")}
          />
        ) : null}
        
        <div className="grid gap-6 lg:grid-cols-2 mt-4">
          {(Array.isArray(linkedPatients) ? linkedPatients : []).map((patient: DynamicStateObject) => (
            <div key={patient.patientId} className="rounded-xl border border-white/5 bg-[var(--tc-surface-muted)] p-5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[var(--tc-border)]">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <UserCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white">{patient.patientName}</h3>
                  <p className="text-sm text-slate-400">ID: {patient.patientId}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-black/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">{t("pendingReminders")}</p>
                  <p className="text-xl font-semibold text-amber-400">{patient.pendingReminders}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">{t("adherence")}</p>
                  <p className="text-xl font-semibold text-teal-400">{patient.adherencePercentage}%</p>
                </div>
              </div>

              {patient.activeAlerts && patient.activeAlerts.length > 0 ? (
                <div className="mb-5">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t("activeAlerts") || "Active Alerts"}</p>
                  <AlertStrip items={patient.activeAlerts} />
                </div>
              ) : (
                <div className="bg-teal-500/10 text-teal-400 rounded-lg p-3 text-sm text-center mb-5">
                  {t("noActiveAlertsForThisPatient") || "No active alerts for this patient"}</div>
              )}

              <GeofenceMap patientId={patient.patientId} />
            </div>
          ))}
        </div>
      </CaregiverPremiumCard>
    </div>
  );
}

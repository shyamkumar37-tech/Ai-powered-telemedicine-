import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import CaregiverPremiumCard from "../components/CaregiverPremiumCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { createCaregiverIntervention, fetchCaregiverAlerts, fetchCaregiverInterventions, fetchLinkedPatients, updateCaregiverInterventionStatus } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import { ClipboardList, Users, Phone, Car, Stethoscope, Home, UserCheck, ShieldAlert, CheckCircle } from "lucide-react";
import SmartEMarScanner from "../components/caregiver/SmartEMarScanner";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function CaregiverInterventionsPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const caregiverId = auth.profileId ?? auth.userId;
  const [interventions, setInterventions] = useState<DynamicStateObject[]>([]);
  const [alerts, setAlerts] = useState<DynamicStateObject[]>([]);
  const [patients, setPatients] = useState<DynamicStateObject[]>([]);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [error, setError] = useState<DynamicState>("");
  const [message, setMessage] = useState<DynamicState>("");
  const [fieldErrors, setFieldErrors] = useState<DynamicState>({ notes: "" });
  const [form, setForm] = useState<DynamicState>({
    patientId: "",
    alertNotificationId: "",
    actionType: "CALLED_PATIENT",
    wellbeingStatus: "NEEDS_ATTENTION",
    notes: "",
    followUpNeeded: true
  });

  const actionOptions = [
    { value: "CALLED_PATIENT", label: translateDisplayText(language, "CALLED_PATIENT") },
    { value: "CONFIRMED_MEDICINE_TAKEN", label: translateDisplayText(language, "CONFIRMED_MEDICINE_TAKEN") },
    { value: "BOOKED_IN_PERSON_VISIT", label: translateDisplayText(language, "BOOKED_IN_PERSON_VISIT") },
    { value: "TOOK_PATIENT_TO_HOSPITAL", label: translateDisplayText(language, "TOOK_PATIENT_TO_HOSPITAL") },
    { value: "DOCTOR_INFORMED", label: translateDisplayText(language, "DOCTOR_INFORMED") },
    { value: "HOME_CHECK_COMPLETED", label: translateDisplayText(language, "HOME_CHECK_COMPLETED") }
  ];

  const wellbeingOptions = [
    { value: "STABLE", label: translateDisplayText(language, "STABLE") },
    { value: "NEEDS_ATTENTION", label: translateDisplayText(language, "NEEDS_ATTENTION") },
    { value: "URGENT", label: translateDisplayText(language, "URGENT") },
    { value: "UNREACHABLE", label: translateDisplayText(language, "UNREACHABLE") }
  ];

  const load = async () => {
    setLoading(true);
    try {
      const [linkedPatients, caregiverAlerts, actionLog] = await Promise.all([
        fetchLinkedPatients(caregiverId),
        fetchCaregiverAlerts(caregiverId),
        fetchCaregiverInterventions(caregiverId)
      ]);
      const safePatients = Array.isArray(linkedPatients) ? linkedPatients : [];
      const safeAlerts = Array.isArray(caregiverAlerts) ? caregiverAlerts : [];
      const safeInterventions = Array.isArray(actionLog) ? actionLog : [];
      setPatients(safePatients);
      setAlerts(safeAlerts);
      setInterventions(safeInterventions);
      setForm((current: DynamicStateObject) => ({
        ...current,
        patientId: current.patientId || (safePatients[0]?.patientId ? String(safePatients[0].patientId) : ""),
        alertNotificationId: current.alertNotificationId || (safeAlerts[0]?.id ? String(safeAlerts[0].id) : "")
      }));
      setError("");
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, t("unableLoadInterventionHub")));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [caregiverId]);

  const priorityPatients = [...patients].sort((left: DynamicStateObject, right: DynamicStateObject) => {
    const leftScore = Number(left.pendingReminders || 0) + (Array.isArray(left.activeAlerts) ? left.activeAlerts.length * 2 : 0);
    const rightScore = Number(right.pendingReminders || 0) + (Array.isArray(right.activeAlerts) ? right.activeAlerts.length * 2 : 0);
    return rightScore - leftScore;
  });

  return (
    <div className="tcd-animate-in space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <CaregiverPremiumCard
          title={
            <span className="inline-flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-indigo-400" />
              <span>{t("interventionHub")}</span>
            </span>
          }
          action={
            <button
              className="cg-btn cg-btn-primary"
              type="button"
              aria-label={t("logIntervention")}
              data-voice-label={t("logIntervention")}
              onClick={async () => {
                const trimmedNotes = form.notes.trim();
                if (!trimmedNotes) {
                  setFieldErrors({ notes: t("caregiverNotesRequired") });
                  setMessage("");
                  setError("");
                  return;
                }
                try {
                  setFieldErrors({ notes: "" });
                  const created = await createCaregiverIntervention({
                    caregiverId,
                    patientId: Number(form.patientId),
                    alertNotificationId: form.alertNotificationId ? Number(form.alertNotificationId) : null,
                    actionType: form.actionType,
                    wellbeingStatus: form.wellbeingStatus,
                    notes: trimmedNotes,
                    followUpNeeded: form.followUpNeeded
                  });
                  setMessage(t("interventionLoggedFor").replace("{name}", created.patientName));
                  setError("");
                  setForm((current: DynamicStateObject) => ({ ...current, notes: "" }));
                  await load();
                } catch (err: DynamicStateObject) {
                  setError(getApiErrorMessage(err, t("unableLogIntervention")));
                }
              }}
            >
              {t("logIntervention")}
            </button>
          }
        >
          <div className="grid gap-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">{t("patient")}</span>
              <select className="cg-input" aria-label={t("patient")} data-voice-label={t("patient")} value={form.patientId} onChange={(e: DynamicStateObject) => setForm({ ...form, patientId: e.target.value })}>
                {patients.map((patient: DynamicStateObject) => (
                  <option key={patient.patientId} value={patient.patientId}>{patient.patientName}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">{t("linkedAlert")}</span>
              <select className="cg-input" aria-label={t("linkedAlert")} data-voice-label={t("linkedAlert")} value={form.alertNotificationId} onChange={(e: DynamicStateObject) => setForm({ ...form, alertNotificationId: e.target.value })}>
                <option value="">{t("noLinkedAlert")}</option>
                {alerts.map((alert: DynamicStateObject) => (
                  <option key={alert.id} value={alert.id}>{alert.patientName} - {translateDisplayText(language, alert.severity)}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">{t("actionTaken")}</span>
                <select className="cg-input" aria-label={t("actionTaken")} data-voice-label={t("actionTaken")} value={form.actionType} onChange={(e: DynamicStateObject) => setForm({ ...form, actionType: e.target.value })}>
                  {actionOptions.map((option: DynamicStateObject) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">{t("patientWellbeing")}</span>
                <select className="cg-input" aria-label={t("patientWellbeing")} data-voice-label={t("patientWellbeing")} value={form.wellbeingStatus} onChange={(e: DynamicStateObject) => setForm({ ...form, wellbeingStatus: e.target.value })}>
                  {wellbeingOptions.map((option: DynamicStateObject) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">{t("caregiverNotes")}</span>
              <textarea
                className="cg-input min-h-[120px] resize-y"
                aria-label={t("caregiverNotes")}
                data-voice-label={t("caregiverNotes")}
                aria-invalid={Boolean(fieldErrors.notes)}
                aria-describedby={fieldErrors.notes ? "caregiver-intervention-notes-error" : undefined}
                value={form.notes}
                onChange={(e: DynamicStateObject) => {
                  setForm({ ...form, notes: e.target.value });
                  if (fieldErrors.notes) {
                    setFieldErrors({ notes: "" });
                  }
                }}
              />
              {fieldErrors.notes ? <p id="caregiver-intervention-notes-error" className="text-xs text-red-400" role="alert">{fieldErrors.notes}</p> : null}
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-300 bg-[var(--tc-surface-muted)] p-3 rounded-xl border border-[var(--tc-border)] cursor-pointer hover:bg-white/10 transition-colors">
              <input type="checkbox" className="w-4 h-4 text-indigo-500 rounded bg-black/50 border-[var(--tc-border-strong)] focus:ring-indigo-500 focus:ring-offset-slate-900" aria-label={t("followUpNeeded")} data-voice-label={t("followUpNeeded")} checked={form.followUpNeeded} onChange={(e: DynamicStateObject) => setForm({ ...form, followUpNeeded: e.target.checked })} />
              {t("followUpNeeded")}
            </label>
          </div>
          {message ? <p className="mt-4 text-sm text-emerald-400 bg-emerald-500/10 p-3 rounded-lg flex items-center gap-2" role="status" aria-live="polite"><CheckCircle className="w-4 h-4"/>{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg flex items-center gap-2" role="alert"><ShieldAlert className="w-4 h-4"/>{error}</p> : null}
        </CaregiverPremiumCard>
        
        {/* Smart eMAR Scanner */}
        {form.patientId && (
          <SmartEMarScanner patientId={form.patientId} />
        )}

        <CaregiverPremiumCard 
          title={
            <span className="inline-flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-400" />
              <span>{t("priorityPatientQueue")}</span>
            </span>
          }
        >
          {loading ? <LoadingSkeleton lines={4} /> : null}
          {!loading && !priorityPatients.length ? (
            <EmptyStateCard
              title={t("noLinkedPatients")}
              body={translateDisplayText(language, "Link a patient to see priority monitoring here.")}
            />
          ) : null}
          <div className="space-y-4">
            {priorityPatients.map((patient: DynamicStateObject) => {
              const needsReview = (Array.isArray(patient.activeAlerts) ? patient.activeAlerts.length : 0) > 0;
              return (
                <div key={patient.patientId} className={`rounded-xl p-5 border ${needsReview ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-[var(--tc-surface-muted)] border-[var(--tc-border)]'} hover:border-[var(--tc-border-strong)] transition-colors`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-white">{patient.patientName}</p>
                      <p className="text-sm text-slate-400 mt-1">{t("pendingRemindersLabel")}: <span className="text-amber-400">{patient.pendingReminders}</span> | {t("adherenceLabel")}: <span className="text-teal-400">{patient.adherencePercentage}%</span></p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${needsReview ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/10 text-slate-300'}`}>
                      {needsReview ? t("needsReview") : t("stableQueue")}
                    </span>
                  </div>
                  {Array.isArray(patient.activeAlerts) && patient.activeAlerts.length ? (
                    <div className="mt-3 space-y-2 border-t border-[var(--tc-border)] pt-3">
                      {(Array.isArray(patient.activeAlerts) ? patient.activeAlerts : []).slice(0, 2).map((item: DynamicStateObject) => (
                        <LocalizedText key={item} as="div" className="text-sm text-slate-300 bg-black/20 p-2 rounded-lg" value={item} />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </CaregiverPremiumCard>
      </div>

      <CaregiverPremiumCard 
        title={
          <span className="inline-flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-400" />
            <span>{t("interventionTimeline")}</span>
          </span>
        }
      >
        {loading ? <LoadingSkeleton lines={4} /> : null}
        {!loading && !interventions.length ? (
          <EmptyStateCard
            title={t("noInterventionsRecorded")}
            body={translateDisplayText(language, "Interventions will appear here after you log an action.")}
          />
        ) : null}
        <div className="relative border-l-2 border-[var(--tc-border)] ml-4 space-y-8 py-4">
          {interventions.map((item: DynamicStateObject) => {
            const isResolved = item.status === "RESOLVED";
            
            // Map action type to icon
            let ActionIcon = UserCheck;
            if (item.actionType === "CALLED_PATIENT") ActionIcon = Phone;
            if (item.actionType === "CONFIRMED_MEDICINE_TAKEN") ActionIcon = CheckCircle;
            if (item.actionType === "TOOK_PATIENT_TO_HOSPITAL") ActionIcon = Car;
            if (item.actionType === "DOCTOR_INFORMED") ActionIcon = Stethoscope;
            if (item.actionType === "HOME_CHECK_COMPLETED") ActionIcon = Home;
            
            return (
              <div key={item.id} className="relative pl-6">
                <div className={`absolute -left-[13px] top-1 h-6 w-6 rounded-full border-4 border-[var(--cg-panel)] flex items-center justify-center ${isResolved ? 'bg-teal-500' : 'bg-amber-500'}`}>
                  {isResolved ? <CheckCircle className="h-3 w-3 text-[var(--cg-panel)]" /> : <div className="h-2 w-2 rounded-full bg-[var(--cg-panel)]" />}
                </div>
                
                <div className="rounded-xl border border-[var(--tc-border)] bg-[var(--tc-surface-muted)] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4 border-b border-[var(--tc-border)] pb-4">
                    <div>
                      <p className="font-semibold text-white">{item.patientName}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(item.actionAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.alertSeverity ? <Badge value={item.alertSeverity} /> : null}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isResolved ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {translateDisplayText(language, item.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-md bg-white/10 text-indigo-400">
                      <ActionIcon className="w-4 h-4" />
                    </div>
                    <p className="font-medium text-white">{translateDisplayText(language, item.actionType)}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-black/20 p-3 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">{t("wellbeingStatus")}</p>
                      <p className="text-sm font-medium text-slate-200">{translateDisplayText(language, item.wellbeingStatus)}</p>
                    </div>
                    {item.alertMessage ? (
                      <div className="bg-black/20 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">{t("linkedAlert")}</p>
                        <LocalizedText as="p" className="text-sm font-medium text-red-400 line-clamp-1" value={item.alertMessage} />
                      </div>
                    ) : null}
                  </div>
                  
                  {item.notes ? (
                    <div className="bg-[var(--tc-surface-muted)] p-3 rounded-lg border border-white/5 mb-4">
                      <LocalizedText as="p" className="text-sm text-slate-300" value={item.notes} />
                    </div>
                  ) : null}
                  
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    {item.followUpNeeded ? (
                      <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400">
                        {t("followUpNeeded")}
                      </span>
                    ) : <span />}
                    {!isResolved ? (
                      <button
                        className="cg-btn cg-btn-ghost text-xs"
                        type="button"
                        aria-label={t("markResolved")}
                        data-voice-label={t("markResolved")}
                        onClick={async () => {
                          try {
                            await updateCaregiverInterventionStatus(item.id, { status: "RESOLVED" });
                            await load();
                          } catch (err: DynamicStateObject) {
                            setError(getApiErrorMessage(err, t("unableUpdateIntervention")));
                          }
                        }}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {t("markResolved")}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CaregiverPremiumCard>
    </div>
  );
}

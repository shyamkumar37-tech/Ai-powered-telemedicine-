import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { createCaregiverIntervention, fetchCaregiverAlerts, fetchCaregiverInterventions, fetchLinkedPatients, updateCaregiverInterventionStatus } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";

export default function CaregiverInterventionsPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const caregiverId = auth.profileId ?? auth.userId;
  const [interventions, setInterventions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ notes: "" });
  const [form, setForm] = useState({
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
      setForm((current) => ({
        ...current,
        patientId: current.patientId || (safePatients[0]?.patientId ? String(safePatients[0].patientId) : ""),
        alertNotificationId: current.alertNotificationId || (safeAlerts[0]?.id ? String(safeAlerts[0].id) : "")
      }));
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("unableLoadInterventionHub")));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [caregiverId]);

  const priorityPatients = [...patients].sort((left, right) => {
    const leftScore = Number(left.pendingReminders || 0) + (Array.isArray(left.activeAlerts) ? left.activeAlerts.length * 2 : 0);
    const rightScore = Number(right.pendingReminders || 0) + (Array.isArray(right.activeAlerts) ? right.activeAlerts.length * 2 : 0);
    return rightScore - leftScore;
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title={t("interventionHub")}
        action={
          <button
            className="btn-primary"
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
                  setForm((current) => ({ ...current, notes: "" }));
                  await load();
                } catch (err) {
                  setError(getApiErrorMessage(err, t("unableLogIntervention")));
                }
              }}
            >
              {t("logIntervention")}
            </button>
          }
        >
          <div className="grid gap-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-600">{t("patient")}</span>
              <select className="field" aria-label={t("patient")} data-voice-label={t("patient")} value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                {patients.map((patient) => (
                  <option key={patient.patientId} value={patient.patientId}>{patient.patientName}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-600">{t("linkedAlert")}</span>
              <select className="field" aria-label={t("linkedAlert")} data-voice-label={t("linkedAlert")} value={form.alertNotificationId} onChange={(e) => setForm({ ...form, alertNotificationId: e.target.value })}>
                <option value="">{t("noLinkedAlert")}</option>
                {alerts.map((alert) => (
                  <option key={alert.id} value={alert.id}>{alert.patientName} - {translateDisplayText(language, alert.severity)}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-600">{t("actionTaken")}</span>
              <select className="field" aria-label={t("actionTaken")} data-voice-label={t("actionTaken")} value={form.actionType} onChange={(e) => setForm({ ...form, actionType: e.target.value })}>
                {actionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-600">{t("patientWellbeing")}</span>
              <select className="field" aria-label={t("patientWellbeing")} data-voice-label={t("patientWellbeing")} value={form.wellbeingStatus} onChange={(e) => setForm({ ...form, wellbeingStatus: e.target.value })}>
                {wellbeingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-600">{t("caregiverNotes")}</span>
              <textarea
                className="field min-h-28 resize-y"
                aria-label={t("caregiverNotes")}
                data-voice-label={t("caregiverNotes")}
                aria-invalid={Boolean(fieldErrors.notes)}
                aria-describedby={fieldErrors.notes ? "caregiver-intervention-notes-error" : undefined}
                value={form.notes}
                onChange={(e) => {
                  setForm({ ...form, notes: e.target.value });
                  if (fieldErrors.notes) {
                    setFieldErrors({ notes: "" });
                  }
                }}
              />
              {fieldErrors.notes ? <p id="caregiver-intervention-notes-error" className="text-xs text-red-600" role="alert">{fieldErrors.notes}</p> : null}
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input type="checkbox" aria-label={t("followUpNeeded")} data-voice-label={t("followUpNeeded")} checked={form.followUpNeeded} onChange={(e) => setForm({ ...form, followUpNeeded: e.target.checked })} />
              {t("followUpNeeded")}
            </label>
          </div>
          {message ? <p className="mt-4 text-sm text-emerald-600" role="status" aria-live="polite">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-red-600" role="alert">{error}</p> : null}
        </SectionCard>
        <SectionCard title={t("priorityPatientQueue")}>
          {loading ? <LoadingSkeleton lines={4} /> : null}
          {!loading && !priorityPatients.length ? (
            <EmptyStateCard
              title={t("noLinkedPatients")}
              body={translateDisplayText(language, "Link a patient to see priority monitoring here.")}
            />
          ) : null}
          <div className="space-y-4">
            {priorityPatients.map((patient) => (
              <div key={patient.patientId} className="rounded-2xl bg-mist p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{patient.patientName}</p>
                    <p className="text-sm text-slate-500">{t("pendingRemindersLabel")}: {patient.pendingReminders} | {t("adherenceLabel")}: {patient.adherencePercentage}%</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-clinic">
                    {(Array.isArray(patient.activeAlerts) ? patient.activeAlerts.length : 0) > 0 ? t("needsReview") : t("stableQueue")}
                  </span>
                </div>
                {Array.isArray(patient.activeAlerts) && patient.activeAlerts.length ? (
                  <div className="mt-3 space-y-2">
                    {(Array.isArray(patient.activeAlerts) ? patient.activeAlerts : []).slice(0, 2).map((item) => (
                      <LocalizedText key={item} as="div" className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700" value={item} />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title={t("interventionTimeline")}>
        {loading ? <LoadingSkeleton lines={4} /> : null}
        {!loading && !interventions.length ? (
          <EmptyStateCard
            title={t("noInterventionsRecorded")}
            body={translateDisplayText(language, "Interventions will appear here after you log an action.")}
          />
        ) : null}
        <div className="space-y-4">
          {interventions.map((item) => (
            <div key={item.id} className="rounded-2xl bg-mist p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{item.patientName}</p>
                  <p className="text-sm text-slate-500">{new Date(item.actionAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  {item.alertSeverity ? <Badge value={item.alertSeverity} /> : null}
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{translateDisplayText(language, item.status)}</span>
                </div>
              </div>
              <p className="mt-3 text-sm font-semibold text-clinic">{translateDisplayText(language, item.actionType)}</p>
              <p className="mt-2 text-sm text-slate-600">{t("wellbeingStatus")}: {translateDisplayText(language, item.wellbeingStatus)}</p>
              {item.alertMessage ? (
                <p className="mt-2 text-sm text-slate-500">
                  {t("linkedAlert")}: <LocalizedText value={item.alertMessage} />
                </p>
              ) : null}
              {item.notes ? <LocalizedText as="p" className="mt-2 text-sm text-slate-700" value={item.notes} /> : null}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {item.followUpNeeded ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{t("followUpNeeded")}</span> : null}
                {item.status !== "RESOLVED" ? (
                  <button
                    className="btn-secondary"
                    type="button"
                    aria-label={t("markResolved")}
                    data-voice-label={t("markResolved")}
                    onClick={async () => {
                      try {
                        await updateCaregiverInterventionStatus(item.id, { status: "RESOLVED" });
                        await load();
                      } catch (err) {
                        setError(getApiErrorMessage(err, t("unableUpdateIntervention")));
                      }
                    }}
                  >
                    {t("markResolved")}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

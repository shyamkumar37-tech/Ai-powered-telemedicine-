import { useEffect, useRef, useState } from "react";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchIvrSessions, startIvrSession } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { formatDisplayValue } from "../utils/formatDisplayValue";
import { translateDisplayText } from "../utils/i18n";
import { logAsyncFailure, runWithRequestTimeout } from "../utils/requestLifecycle";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";

export default function PatientIvrPage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth.profileId;
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [sessionsError, setSessionsError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({
    appointmentDateTime: "",
    concernSummary: ""
  });
  const [form, setForm] = useState({
    patientId,
    phoneNumber: auth.phone || "",
    languageCode: language,
    serviceType: "APPOINTMENT",
    appointmentDateTime: "",
    mode: "TELECONSULTATION",
    concernSummary: ""
  });
  const lastAutoPhoneRef = useRef(auth.phone || "");
  const lastAutoLanguageRef = useRef(language);

  const normalizeDateTimeInput = (value) => {
    if (!value) {
      return value;
    }
    return value.length === 16 ? `${value}:00` : value;
  };

  const load = async (signal) => {
    if (!patientId) {
      setSessions([]);
      setSessionsError(t("unableLoadIvrSessions"));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await runWithRequestTimeout(
        (requestSignal) => fetchIvrSessions(patientId, { signal: requestSignal }),
        { signal }
      );
      setSessions(Array.isArray(data) ? data : []);
      setSessionsError("");
    } catch (err) {
      setSessionsError(getApiErrorMessage(err, t("unableLoadIvrSessions")));
      logAsyncFailure("patient-ivr:load", err, { patientId });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setForm((current) => {
      const next = { ...current, patientId };
      if (!current.phoneNumber || current.phoneNumber === lastAutoPhoneRef.current) {
        next.phoneNumber = auth.phone || current.phoneNumber;
        lastAutoPhoneRef.current = next.phoneNumber || "";
      }
      if (!current.languageCode || current.languageCode === lastAutoLanguageRef.current) {
        next.languageCode = language;
        lastAutoLanguageRef.current = language;
      }
      return next;
    });
    load(controller.signal);
    return () => {
      controller.abort();
    };
  }, [auth.phone, language, patientId, reloadToken]);

  const validateForm = () => {
    if (form.serviceType !== "APPOINTMENT") {
      setFieldErrors({ appointmentDateTime: "", concernSummary: "" });
      return false;
    }

    const nextErrors = {
      appointmentDateTime: form.appointmentDateTime ? "" : t("requestedAppointmentTimeRequired"),
      concernSummary: form.concernSummary.trim() ? "" : t("concernSummaryRequired")
    };

    setFieldErrors(nextErrors);
    return Boolean(nextErrors.appointmentDateTime || nextErrors.concernSummary);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SectionCard
        title={t("ivrVoiceBookingTitle")}
        action={
          <button
            className="btn-primary"
            type="button"
            disabled={starting || !patientId}
            aria-label={starting ? t("starting") : t("startIvrSession")}
            data-voice-label={starting ? t("starting") : t("startIvrSession")}
            onClick={async () => {
              if (!patientId) {
                setError(t("unableStartIvrSession"));
                return;
              }
              if (validateForm()) {
                setMessage("");
                setError("");
                return;
              }
              try {
                setStarting(true);
                const created = await startIvrSession({
                  ...form,
                  patientId,
                  appointmentDateTime: form.appointmentDateTime ? normalizeDateTimeInput(form.appointmentDateTime) : null,
                  concernSummary: form.concernSummary.trim()
                });
                setSessions((current) => [created, ...current]);
                setMessage(created.appointmentId
                  ? t("ivrSessionCreatedWithAppointment").replace("{appointmentId}", created.appointmentId)
                  : t("ivrSessionCompleted"));
                setError("");
              } catch (err) {
                setError(getApiErrorMessage(err, t("unableStartIvrSession")));
                logAsyncFailure("patient-ivr:start", err, { patientId });
              } finally {
                setStarting(false);
              }
            }}
          >
            {starting ? t("starting") : t("startIvrSession")}
          </button>
        }
      >
        <p className="mb-4 text-sm text-slate-600">
          {translateUiText("IVR requests are tracked inside TeleCare+. Live telephony delivery depends on configured voice providers and current connectivity.")}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("phone")}</span>
            <input className="field" aria-label={t("phone")} data-voice-label={t("phone")} value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("language")}</span>
            <input className="field" aria-label={t("language")} data-voice-label={t("language")} value={form.languageCode} onChange={(event) => setForm({ ...form, languageCode: event.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("serviceType")}</span>
            <select className="field" aria-label={t("serviceType")} data-voice-label={t("serviceType")} value={form.serviceType} onChange={(event) => setForm({ ...form, serviceType: event.target.value })}>
              <option value="APPOINTMENT">{translateDisplayText(language, "APPOINTMENT")}</option>
              <option value="PRESCRIPTION_STATUS">{translateDisplayText(language, "PRESCRIPTION_STATUS")}</option>
              <option value="MEDICATION_REMINDER">{translateDisplayText(language, "MEDICATION_REMINDER")}</option>
              <option value="EMERGENCY_SUPPORT">{translateDisplayText(language, "EMERGENCY_SUPPORT")}</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("consultationMode")}</span>
            <select className="field" aria-label={t("consultationMode")} data-voice-label={t("consultationMode")} value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value })}>
              <option value="TELECONSULTATION">{t("teleconsultation")}</option>
              <option value="FOLLOW_UP">{t("followUp")}</option>
              <option value="IN_PERSON">{t("inPerson")}</option>
            </select>
          </label>
          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-600">{t("requestedAppointmentTime")}</span>
            <input
              className="field"
              type="datetime-local"
              aria-label={t("requestedAppointmentTime")}
              data-voice-label={t("requestedAppointmentTime")}
              aria-invalid={Boolean(fieldErrors.appointmentDateTime)}
              aria-describedby={fieldErrors.appointmentDateTime ? "ivr-appointment-time-error" : undefined}
              value={form.appointmentDateTime}
              onChange={(event) => {
                setForm({ ...form, appointmentDateTime: event.target.value });
                if (fieldErrors.appointmentDateTime) {
                  setFieldErrors((current) => ({ ...current, appointmentDateTime: "" }));
                }
              }}
            />
            {fieldErrors.appointmentDateTime ? <p id="ivr-appointment-time-error" className="text-xs text-red-600" role="alert">{fieldErrors.appointmentDateTime}</p> : null}
          </label>
        </div>
        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-slate-600">{t("concernSummary")}</span>
          <textarea
            className="field min-h-24 resize-y"
            aria-label={t("concernSummary")}
            data-voice-label={t("concernSummary")}
            aria-invalid={Boolean(fieldErrors.concernSummary)}
            aria-describedby={fieldErrors.concernSummary ? "ivr-concern-summary-error" : undefined}
            value={form.concernSummary}
            onChange={(event) => {
              setForm({ ...form, concernSummary: event.target.value });
              if (fieldErrors.concernSummary) {
                setFieldErrors((current) => ({ ...current, concernSummary: "" }));
              }
            }}
          />
          {fieldErrors.concernSummary ? <p id="ivr-concern-summary-error" className="text-xs text-red-600" role="alert">{fieldErrors.concernSummary}</p> : null}
        </label>
        {message ? <p className="mt-4 text-sm text-emerald-600" role="status" aria-live="polite">{message}</p> : null}
        {error ? (
          <div className="mt-4">
            <ErrorStateCard
              title={t("unableStartIvrSession")}
              body={error}
            />
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title={t("ivrBooking")}>
        {loading ? <LoadingSkeleton lines={3} /> : null}
        {!loading && sessionsError ? (
          <ErrorStateCard
            title={t("unableLoadIvrSessions")}
            body={sessionsError}
            actionLabel={t("retry")}
            onAction={() => setReloadToken((current) => current + 1)}
          />
        ) : null}
        {!loading && !sessionsError && !sessions.length ? (
          <EmptyStateCard
            title={t("noIvrSessions")}
            body={translateDisplayText(language, "IVR booking activity will appear here once sessions are started.")}
          />
        ) : null}
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="rounded-2xl bg-mist p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{translateDisplayText(language, session.serviceType) || formatDisplayValue(session.serviceType)}</p>
                  <p className="text-sm text-slate-500">{new Date(session.createdAt).toLocaleString()}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {translateDisplayText(language, session.status) || formatDisplayValue(session.status)}
                </span>
              </div>
              <LocalizedText as="p" className="mt-3 text-sm text-slate-700" value={session.transcriptSummary} />
              {session.appointmentId ? <p className="mt-2 text-sm font-semibold text-clinic">{t("appointmentIdLabel")}: {session.appointmentId}</p> : null}
              {!!session.prompts?.length && (
                <div className="mt-4 space-y-2">
                  {session.prompts.map((prompt) => (
                    <LocalizedText key={prompt} as="div" className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700" value={prompt} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

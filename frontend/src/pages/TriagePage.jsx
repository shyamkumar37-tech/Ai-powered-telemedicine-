import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import FormField from "../components/FormField";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { createTriage, fetchTriageHistory } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import { emitTriageUpdated } from "../utils/appEvents";
import { logAsyncFailure, runWithRequestTimeout } from "../utils/requestLifecycle";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";

export default function TriagePage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth.profileId;
  const [form, setForm] = useState({
    patientId,
    symptoms: "",
    symptomDurationDays: 1,
    chestPain: false,
    severeBreathlessness: false,
    fainting: false,
    oxygenLevel: 98,
    temperature: 98.6,
    persistentHighFever: false
  });
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ symptoms: "" });

  const navigator = useMemo(() => {
    if (!form.symptoms.trim()) {
      return null;
    }
    const flags = [];
    if (form.chestPain || form.severeBreathlessness || form.fainting) {
      flags.push("Emergency indicators detected. Seek urgent medical review.");
    }
    if (Number(form.oxygenLevel) && Number(form.oxygenLevel) < 94) {
      flags.push("Oxygen level appears low. Consider immediate clinical review.");
    }
    if (Number(form.temperature) && Number(form.temperature) >= 101) {
      flags.push("High temperature reported. Monitor closely and hydrate.");
    }
    if (form.persistentHighFever) {
      flags.push("Persistent fever noted. Escalate if symptoms worsen.");
    }
    if (Number(form.symptomDurationDays) >= 7) {
      flags.push("Symptoms lasting more than a week. Schedule follow-up.");
    }
    const questions = [
      "When did the symptoms start and what changed recently?",
      "Is the discomfort getting worse, better, or staying the same?",
      "Any medications already taken or missed?",
      "Any recent exposure to illness or travel?"
    ];
    return {
      summary: "Use this guided checklist to prepare your triage details.",
      flags,
      questions,
      disclaimer: "This guidance supports triage and does not replace a clinician."
    };
  }, [
    form.symptoms,
    form.chestPain,
    form.severeBreathlessness,
    form.fainting,
    form.oxygenLevel,
    form.temperature,
    form.persistentHighFever,
    form.symptomDurationDays
  ]);

  useEffect(() => {
    setForm((current) => ({ ...current, patientId }));
  }, [patientId]);

  const loadHistory = async ({ suppressError = false, signal } = {}) => {
    if (!patientId) {
      setHistory([]);
      setHistoryError(t("unableLoadTriageHistory"));
      if (!suppressError) {
        setError(t("unableLoadTriageHistory"));
      }
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await runWithRequestTimeout(
        (requestSignal) => fetchTriageHistory(patientId, { signal: requestSignal }),
        { signal }
      );
      if (Array.isArray(data)) {
        setHistory(data);
        setHistoryError("");
      } else {
        setHistory([]);
        setHistoryError(t("unexpectedTriageResponse"));
      }
      if (!suppressError) {
        setError("");
      }
    } catch (err) {
      const message = getApiErrorMessage(err, t("unableLoadTriageHistory"));
      setHistoryError(message);
      if (!suppressError) {
        setError(message);
      }
      logAsyncFailure("triage:history", err, { patientId });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const controller = new AbortController();
    loadHistory({ signal: controller.signal });
    return () => {
      controller.abort();
    };
  }, [patientId, t]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <div className="space-y-6">
        <SectionCard
          title={t("smartSymptomTriage")}
          action={
            <button
              className="btn-primary"
              type="button"
              disabled={submitting || !patientId}
              aria-label={submitting ? t("submitting") : t("evaluateTriage")}
              data-voice-label={submitting ? t("submitting") : t("evaluateTriage")}
              onClick={async () => {
                if (!patientId) {
                  setError(t("unableLoadTriageHistory"));
                  return;
                }
                if (!form.symptoms.trim()) {
                  setFieldErrors({ symptoms: t("symptomsRequired") });
                  setError("");
                  setMessage("");
                  return;
                }
                setError("");
                setMessage("");
                setSubmitting(true);
                try {
                  setFieldErrors({ symptoms: "" });
                  const data = await createTriage({
                    ...form,
                    symptoms: form.symptoms.trim(),
                    symptomDurationDays: Number(form.symptomDurationDays),
                    oxygenLevel: Number(form.oxygenLevel),
                    temperature: Number(form.temperature)
                  });
                  setResult(data);
                  setHistory((current) => [data, ...current.filter((item) => item.id !== data.id)]);
                  setError("");
                  setMessage(t("triageSavedSuccessfully"));
                  emitTriageUpdated();
                  await loadHistory({ suppressError: true });
                } catch (err) {
                  if (err?.offlineQueued || err?.response?.status === 202) {
                    setError("");
                    setMessage(t("triageSavedSuccessfully"));
                    emitTriageUpdated();
                  } else {
                    setError(getApiErrorMessage(err, t("triageSubmissionFailed")));
                    logAsyncFailure("triage:create", err, { patientId });
                  }
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? t("submitting") : t("evaluateTriage")}
            </button>
          }
        >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label={t("symptoms")}
            required
            error={fieldErrors.symptoms}
            value={form.symptoms}
            onChange={(e) => {
              setForm({ ...form, symptoms: e.target.value });
              if (fieldErrors.symptoms) {
                setFieldErrors({ symptoms: "" });
              }
            }}
          />
          <FormField label={t("durationInDays")} type="number" value={form.symptomDurationDays} onChange={(e) => setForm({ ...form, symptomDurationDays: e.target.value })} />
          <FormField label={t("oxygenLevel")} type="number" value={form.oxygenLevel} onChange={(e) => setForm({ ...form, oxygenLevel: e.target.value })} />
          <FormField label={t("temperature")} type="number" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            [t("chestPain"), "chestPain"],
            [t("severeBreathlessness"), "severeBreathlessness"],
            [t("fainting"), "fainting"],
            [t("persistentHighFever"), "persistentHighFever"]
          ].map(([label, key]) => (
            <label key={key} className="flex items-center gap-3 rounded-2xl bg-mist px-4 py-3 text-sm">
              <input type="checkbox" aria-label={label} data-voice-label={label} checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
              {label}
            </label>
          ))}
        </div>
        {result ? (
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <Badge value={result.level} />
              <LocalizedText as="p" className="text-sm text-slate-600" value={result.recommendation} />
            </div>
          </div>
        ) : null}
        {message ? <p className="mt-4 text-sm text-emerald-600" role="status" aria-live="polite">{message}</p> : null}
        {error ? (
          <div className="mt-4">
            <ErrorStateCard
              title={t("triageSubmissionFailed")}
              body={error}
            />
          </div>
        ) : null}
        </SectionCard>
        <SectionCard title={translateUiText("AI Symptom Navigator")}>
          {navigator ? (
            <div className="space-y-3 text-sm text-slate-700">
              <p>{translateDisplayText(language, navigator.summary)}</p>
              {navigator.flags.length ? (
                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-amber-800">
                  {navigator.flags.map((item) => (
                    <p key={item}>{translateDisplayText(language, item)}</p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  {translateUiText("No urgent red flags detected from the current inputs.")}
                </p>
              )}
              <ul className="list-disc pl-5">
                {navigator.questions.map((item) => <li key={item}>{translateDisplayText(language, item)}</li>)}
              </ul>
              <p className="text-xs text-slate-500">{translateDisplayText(language, navigator.disclaimer)}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              {translateUiText("Enter symptoms to receive guided triage prompts.")}
            </p>
          )}
        </SectionCard>
      </div>
      <SectionCard title={t("triageHistory")}>
        {loading ? <LoadingSkeleton lines={3} /> : null}
        {!loading && historyError ? (
          <ErrorStateCard
            title={t("unableLoadTriageHistory")}
            body={historyError}
          />
        ) : null}
        {!loading && !historyError && Array.isArray(history) && !history.length ? (
          <EmptyStateCard
            title={t("noTriageRecords")}
            body={t("noTriageRecords")}
          />
        ) : null}
        <div className="space-y-3">
          {(Array.isArray(history) ? history : []).map((item) => (
            <div key={item.id} className="rounded-2xl bg-mist p-4">
              <div className="flex items-center justify-between gap-3">
                <Badge value={item.level} />
                <span className="text-xs text-slate-500">{new Date(item.assessedAt).toLocaleString()}</span>
              </div>
              <LocalizedText as="p" className="mt-3 text-sm text-slate-700" value={item.symptoms} />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

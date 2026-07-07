import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { createPatientObservation, fetchPatientObservations } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";

export default function PatientObservationsPage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth.profileId;
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    patientId,
    source: "LAB_REPORT",
    observationType: "",
    metricName: "",
    metricValue: "",
    unit: "",
    abnormalFlag: false,
    notes: "",
    measuredAt: ""
  });

  const normalizeDateTimeInput = (value) => {
    if (!value) {
      return value;
    }
    return value.length === 16 ? `${value}:00` : value;
  };

  const sourceOptions = [
    { value: "LAB_REPORT", label: translateDisplayText(language, "LAB_REPORT") },
    { value: "WEARABLE_DEVICE", label: translateDisplayText(language, "WEARABLE_DEVICE") },
    { value: "MANUAL_UPLOAD", label: translateDisplayText(language, "MANUAL_UPLOAD") }
  ];

  const load = async () => {
    if (!patientId) {
      setObservations([]);
      setError(getApiErrorMessage(new Error("missing-patient-id"), t("unableLoadObservations")));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPatientObservations(patientId);
      setObservations(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("unableLoadObservations")));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm((current) => ({ ...current, patientId }));
    load();
  }, [patientId]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SectionCard
        title={t("smartObservations")}
        action={
        <button
          className="btn-primary"
          type="button"
          disabled={saving || !patientId}
          aria-label={saving ? t("saving") : t("uploadObservation")}
          data-voice-label={saving ? t("saving") : t("uploadObservation")}
          onClick={async () => {
              if (!patientId) {
                setError(getApiErrorMessage(new Error("missing-patient-id"), t("unableSaveObservation")));
                return;
              }
              try {
                setSaving(true);
                const created = await createPatientObservation({
                  ...form,
                  patientId,
                  measuredAt: form.measuredAt ? normalizeDateTimeInput(form.measuredAt) : null
                });
                setObservations((current) => [created, ...current]);
                setMessage(t("observationSaved"));
                setError("");
                setForm((current) => ({
                  ...current,
                  observationType: "",
                  metricName: "",
                  metricValue: "",
                  unit: "",
                  abnormalFlag: false,
                  notes: "",
                  measuredAt: ""
                }));
              } catch (err) {
                setError(getApiErrorMessage(err, t("unableSaveObservation")));
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? t("saving") : t("uploadObservation")}
          </button>
        }
      >
        <p className="mb-4 text-sm text-slate-600">
          {translateUiText("Lab and wearable entries are captured manually here unless a live vendor integration is connected.")}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("observationSource")}</span>
            <select
              className="field"
              value={form.source}
              aria-label={t("observationSource")}
              data-voice-label={t("observationSource")}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              {sourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("observationType")}</span>
            <input className="field" aria-label={t("observationType")} data-voice-label={t("observationType")} value={form.observationType} onChange={(e) => setForm({ ...form, observationType: e.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("metricName")}</span>
            <input className="field" aria-label={t("metricName")} data-voice-label={t("metricName")} value={form.metricName} onChange={(e) => setForm({ ...form, metricName: e.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("metricValue")}</span>
            <input className="field" aria-label={t("metricValue")} data-voice-label={t("metricValue")} value={form.metricValue} onChange={(e) => setForm({ ...form, metricValue: e.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("unit")}</span>
            <input className="field" aria-label={t("unit")} data-voice-label={t("unit")} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">{t("measuredAt")}</span>
            <input className="field" type="datetime-local" aria-label={t("measuredAt")} data-voice-label={t("measuredAt")} value={form.measuredAt} onChange={(e) => setForm({ ...form, measuredAt: e.target.value })} />
          </label>
        </div>
        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-slate-600">{t("notes")}</span>
          <textarea className="field min-h-24 resize-y" aria-label={t("notes")} data-voice-label={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
        <label className="mt-4 flex items-center gap-3 text-sm text-slate-600">
          <input type="checkbox" aria-label={t("abnormalFlag")} data-voice-label={t("abnormalFlag")} checked={form.abnormalFlag} onChange={(e) => setForm({ ...form, abnormalFlag: e.target.checked })} />
          {t("abnormalFlag")}
        </label>
        {message ? <p className="mt-4 text-sm text-emerald-600" role="status" aria-live="polite">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600" role="alert">{error}</p> : null}
      </SectionCard>

      <SectionCard title={t("observationHistory")}>
        {loading ? <LoadingSkeleton lines={4} /> : null}
        {!loading && !observations.length ? (
          <EmptyStateCard
            title={t("noObservations")}
            body={translateDisplayText(language, "Upload an observation to start building this history.")}
          />
        ) : null}
        <div className="space-y-4">
          {observations.map((item) => (
            <div key={item.id} className="rounded-2xl bg-mist p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{translateDisplayText(language, item.metricName)} - {item.metricValue}{item.unit ? ` ${item.unit}` : ""}</p>
                  <p className="text-sm text-slate-500">{translateDisplayText(language, item.observationType)} | {new Date(item.measuredAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{translateDisplayText(language, item.source)}</span>
                  {item.abnormalFlag ? <Badge value="WARNING" /> : null}
                </div>
              </div>
              {item.notes ? <LocalizedText as="p" className="mt-3 text-sm text-slate-700" value={item.notes} /> : null}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

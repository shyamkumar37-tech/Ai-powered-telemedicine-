import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import FormField from "../components/FormField";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { createHealthRecord, fetchHealthRecords, fetchHealthSummary } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import { useToast } from "../components/ui/ToastProvider";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";

export default function PatientHealthPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const { pushToast } = useToast();
  const patientId = auth.profileId;
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    patientId,
    bloodPressure: "",
    sugar: "",
    weight: "",
    spo2: "",
    pulse: "",
    temperature: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  const fieldLabels = {
    bloodPressure: t("bloodPressure"),
    sugar: t("sugar"),
    weight: t("weight"),
    spo2: t("spo2"),
    pulse: t("pulse"),
    temperature: t("temperature")
  };

  useEffect(() => {
    setForm((current) => ({ ...current, patientId }));
  }, [patientId]);

  const load = async ({ suppressError = false } = {}) => {
    if (!patientId) {
      if (!suppressError) {
        setError(getApiErrorMessage(new Error("missing-patient-id"), t("unableLoadHealthRecords")));
      }
      setRecords([]);
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchHealthRecords(patientId);
      const trendSummary = await fetchHealthSummary(patientId);
      setRecords(data);
      setSummary(trendSummary);
      if (!suppressError) {
        setError("");
      }
    } catch (err) {
      if (!suppressError) {
        setError(getApiErrorMessage(err, t("unableLoadHealthRecords")));
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [patientId]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SectionCard
        title={t("addDailyHealthReadings")}
        action={
          <button
            className="btn-primary"
            disabled={saving || !patientId}
            aria-label={saving ? t("saving") : t("saveReading")}
            data-voice-label={saving ? t("saving") : t("saveReading")}
            onClick={async () => {
              if (!patientId) {
                const message = t("unableSaveHealthReading");
                setError(message);
                pushToast({ type: "error", title: t("unableSaveHealthReading"), message });
                return;
              }
              setError("");
              setSaving(true);
              try {
                const response = await createHealthRecord({
                  ...form,
                  sugar: form.sugar ? Number(form.sugar) : null,
                  weight: form.weight ? Number(form.weight) : null,
                  spo2: form.spo2 ? Number(form.spo2) : null,
                  pulse: form.pulse ? Number(form.pulse) : null,
                  temperature: form.temperature ? Number(form.temperature) : null
                });
                pushToast({
                  type: "success",
                  title: t("saveReading"),
                  message: t("readingSavedWith").replace("{severity}", translateDisplayText(language, response.alertSeverity))
                });
                setError("");
                setRecords((current) => [response, ...current.filter((item) => item.id !== response.id)]);
                setForm({ ...form, bloodPressure: "", sugar: "", weight: "", spo2: "", pulse: "", temperature: "" });
                await load({ suppressError: true });
              } catch (err) {
                const message = getApiErrorMessage(err, t("unableSaveHealthReading"));
                setError(message);
                pushToast({ type: "error", title: t("unableSaveHealthReading"), message });
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? t("saving") : t("saveReading")}
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {Object.keys(form).filter((key) => key !== "patientId").map((key) => (
            <FormField key={key} label={fieldLabels[key] || key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          ))}
        </div>
        {error ? <p className="mt-4 text-sm text-red-600" role="alert">{error}</p> : null}
      </SectionCard>
      <SectionCard title={t("healthMonitoringHistory")}>
        {summary ? (
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-mist p-4 text-sm text-slate-700">
              {t("sugarTrend")}: <span className="font-semibold">{translateDisplayText(language, summary.sugarTrend)}</span>
              <div className="mt-1 text-slate-500">{t("latest")} {summary.latestSugar ?? "-"} | {t("previous")} {summary.previousSugar ?? "-"}</div>
            </div>
            <div className="rounded-2xl bg-mist p-4 text-sm text-slate-700">
              {t("averagePulse")}: <span className="font-semibold">{summary.averagePulse ? summary.averagePulse.toFixed(1) : "-"}</span>
              <div className="mt-1 text-slate-500">{t("latestBp")} {summary.latestBloodPressure || "-"} | {t("latestSpo2")} {summary.latestSpo2 ?? "-"}</div>
            </div>
          </div>
        ) : null}
        {loading ? <LoadingSkeleton lines={4} /> : null}
        {!loading && !Array.isArray(records) ? (
          <ErrorStateCard
            title={t("unexpectedHealthHistory")}
            body={t("unexpectedHealthHistory")}
            actionLabel={t("retry")}
            onAction={() => load()}
          />
        ) : null}
        {!loading && Array.isArray(records) && !records.length ? (
          <EmptyStateCard
            title={t("noHealthReadings")}
            body={translateDisplayText(language, "Add your first reading to start tracking your health trends.")}
          />
        ) : null}
        <div className="space-y-3">
          {(Array.isArray(records) ? records : []).map((record) => (
            <div key={record.id} className="rounded-2xl bg-mist p-4">
              <div className="flex items-center justify-between gap-3">
                <Badge value={record.alertSeverity} />
                <span className="text-xs text-slate-500">{new Date(record.recordedAt).toLocaleString()}</span>
              </div>
              <p className="mt-3 text-sm text-slate-700">
                {t("bloodPressure")} {record.bloodPressure || "-"} | {t("sugar")} {record.sugar || "-"} | {t("spo2")} {record.spo2 || "-"} | {t("pulse")} {record.pulse || "-"}
              </p>
              <LocalizedText as="p" className="mt-2 text-sm text-slate-500" value={record.alertMessage} />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

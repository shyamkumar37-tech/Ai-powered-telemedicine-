import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import AiReportSummaryCard from "../ai/components/AiReportSummaryCard";
import AiMoodInsightsPanel from "../ai/components/AiMoodInsightsPanel";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchMedicalRecords } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";

function RecordsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="page-skeleton__block" aria-hidden="true" />
      <div className="page-skeleton__row" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`record-skeleton-${index}`} className="page-skeleton__card" />
        ))}
      </div>
    </div>
  );
}

export default function PatientRecordsPage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth.profileId;
  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!patientId) {
      setRecords(null);
      setError(t("unableLoadMedicalRecords"));
      setLoading(false);
      return;
    }
    setRecords(null);
    setLoading(true);
    fetchMedicalRecords(patientId)
      .then((data) => {
        setRecords(data);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadMedicalRecords"))))
      .finally(() => setLoading(false));
  }, [patientId, reloadToken]);

  if (loading) return <RecordsSkeleton />;
  if (error) {
    return (
      <ErrorStateCard
        title={t("unableLoadMedicalRecords")}
        body={error}
        actionLabel={t("retry")}
        onAction={() => setReloadToken((current) => current + 1)}
      />
    );
  }
  if (!records) {
    return (
      <EmptyStateCard
        title={translateUiText("No medical records yet")}
        body={translateUiText("No structured medical records are available yet. They will appear here after triage, consultation, or prescription activity.")}
        actionLabel={t("retry")}
        onAction={() => setReloadToken((current) => current + 1)}
      />
    );
  }

  const triageHistory = Array.isArray(records.triageHistory) ? records.triageHistory : [];
  const consultations = Array.isArray(records.consultations) ? records.consultations : [];
  const prescriptions = Array.isArray(records.prescriptions) ? records.prescriptions : [];
  const alerts = Array.isArray(records.alerts) ? records.alerts : [];
  const hasRecordContent = Boolean(
    records.patientProfile?.medicalHistorySummary
    || triageHistory.length
    || consultations.length
    || prescriptions.length
    || alerts.length
  );

  if (!hasRecordContent) {
    return (
      <EmptyStateCard
        title={translateUiText("No medical records yet")}
        body={translateUiText("No structured medical records are available yet. They will appear here after triage, consultation, or prescription activity.")}
        actionLabel={t("retry")}
        onAction={() => setReloadToken((current) => current + 1)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AiReportSummaryCard patientId={patientId} />
      <AiMoodInsightsPanel patientId={patientId} />
      <SectionCard title={t("medicalHistorySummary")}>
        {records.patientProfile?.medicalHistorySummary
          ? <LocalizedText as="p" className="text-sm text-slate-600" value={records.patientProfile.medicalHistorySummary} />
          : <p className="text-sm text-slate-600">{t("noHistorySummary")}</p>}
      </SectionCard>
      <SectionCard title={t("structuredRecordTimeline")}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-mist p-4">
            <h3 className="font-semibold">{t("triageHistory")}</h3>
            <div className="mt-3 space-y-2">
              {triageHistory.length
                ? triageHistory.map((item) => <Badge key={item.id} value={item.level} />)
                : <p className="text-sm text-slate-500">{t("noTriageHistoryAvailable")}</p>}
            </div>
          </div>
          <div className="rounded-2xl bg-mist p-4">
            <h3 className="font-semibold">{t("consultations")}</h3>
            <p className="mt-3 text-sm text-slate-600">{consultations.length} {t("consultationsRecorded")}</p>
          </div>
          <div className="rounded-2xl bg-mist p-4">
            <h3 className="font-semibold">{t("prescriptions")}</h3>
            <p className="mt-3 text-sm text-slate-600">{prescriptions.length} {t("prescriptionRecordsAvailable")}</p>
          </div>
          <div className="rounded-2xl bg-mist p-4">
            <h3 className="font-semibold">{t("activeAlerts")}</h3>
            <div className="mt-3 space-y-2">
              {alerts.length
                ? alerts.map((alert) => (
                  <div key={alert.id} className="space-y-2">
                    <Badge value={alert.severity} />
                    <LocalizedText as="p" className="text-sm text-slate-600" value={alert.message} />
                  </div>
                ))
                : <p className="text-sm text-slate-500">{t("noActiveAlerts")}</p>}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

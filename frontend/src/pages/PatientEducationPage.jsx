import { useEffect, useState } from "react";
import LocalizedText, { useLocalizedText } from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchCareCompliance, fetchPatientEducation } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import { logAsyncFailure, runWithRequestTimeout } from "../utils/requestLifecycle";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";

export default function PatientEducationPage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth.profileId;
  const [education, setEducation] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const localizedHeadline = useLocalizedText(education?.headline);
  const localizedEmptyAdvice = translateUiText("No personalized guidance is available yet. Continue logging symptoms, medicines, and health readings for more specific advice.");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (!patientId) {
      setEducation({ tips: [] });
      setCompliance(null);
      setError(t("unableLoadGuidance"));
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.allSettled([
      runWithRequestTimeout((signal) => fetchPatientEducation(patientId, { signal }), { signal: controller.signal }),
      runWithRequestTimeout((signal) => fetchCareCompliance(patientId, { signal }), { signal: controller.signal })
    ])
      .then(([educationResult, complianceResult]) => {
        if (!active) {
          return;
        }
        if (educationResult.status === "fulfilled") {
          setEducation(educationResult.value && typeof educationResult.value === "object" ? educationResult.value : { tips: [] });
          setError("");
        } else {
          setEducation({ tips: [] });
          setError(getApiErrorMessage(educationResult.reason, t("unableLoadGuidance")));
          logAsyncFailure("patient-education:guidance", educationResult.reason, { patientId });
        }

        if (complianceResult.status === "fulfilled") {
          setCompliance(complianceResult.value && typeof complianceResult.value === "object" ? complianceResult.value : null);
        } else {
          setCompliance(null);
          logAsyncFailure("patient-education:compliance", complianceResult.reason, { patientId });
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [patientId, reloadToken, t]);

  return (
    <div className="space-y-6">
      <SectionCard title={t("careComplianceScore")}>
        {loading ? <LoadingSkeleton lines={3} /> : null}
        {error ? (
          <ErrorStateCard
            title={t("unableLoadGuidance")}
            body={error}
            actionLabel={t("retry")}
            onAction={() => setReloadToken((current) => current + 1)}
          />
        ) : null}
        {compliance ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-slate-500">{t("complianceScore")}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{compliance.complianceScore}/100</p>
              <p className="mt-1 text-sm text-slate-500">{translateDisplayText(language, compliance.complianceLabel)}</p>
            </div>
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-slate-500">{t("adherence")}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{compliance.adherencePercentage}%</p>
              <p className="mt-1 text-sm text-slate-500">{t("missedDoses")}: {compliance.missedReminderCount}</p>
            </div>
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-slate-500">{t("continuityCoverage")}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{compliance.activeCarePlanCount}</p>
              <p className="mt-1 text-sm text-slate-500">{t("openAlerts")}: {compliance.openAlertCount} | {t("readings")}: {compliance.recentReadingCount}</p>
            </div>
          </div>
        ) : null}
      </SectionCard>
      <SectionCard title={localizedHeadline || t("personalizedGuidance")}>
        {education?.tips?.length ? (
          <div className="space-y-3">
            {education.tips.map((tip) => (
              <LocalizedText key={tip} as="div" className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate-700" value={tip} />
            ))}
          </div>
        ) : !loading && !error ? (
          <EmptyStateCard
            title={t("personalizedGuidance")}
            body={localizedEmptyAdvice}
          />
        ) : null}
      </SectionCard>
    </div>
  );
}

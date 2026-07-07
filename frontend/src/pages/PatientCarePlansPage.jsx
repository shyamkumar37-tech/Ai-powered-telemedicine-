import { useEffect, useState } from "react";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientCarePlans } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";

export default function PatientCarePlansPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const patientId = auth.profileId;
  const translateCarePlanValue = (value) => {
    const demoMap = {
      "Diabetes continuity care plan": t("demoDiabetesCarePlanTitle"),
      "Type 2 Diabetes": t("demoType2Diabetes"),
      "Keep fasting sugar under control, maintain medicine adherence above 90%, and avoid emergency fluctuations.": t("demoDiabetesGoals"),
      "Take diabetic medicines after meals as prescribed. Do not skip doses. Record missed doses in the reminders page.": t("demoDiabetesMedicationGuidance"),
      "Walk 30 minutes at least 5 days a week, reduce refined sugar intake, maintain hydration, and log weekly weight.": t("demoDiabetesLifestyleGuidance"),
      "Escalate if sugar remains above 250 mg/dL, if dizziness worsens, or if repeated missed medication events occur.": t("demoDiabetesWarningThresholds"),
      "Weekly review": t("weeklyReview")
    };
    return demoMap[value] || translateDisplayText(language, value);
  };
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!patientId) {
      setPlans([]);
      setError(t("unableLoadCarePlans"));
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPatientCarePlans(patientId)
      .then((data) => {
        setPlans(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadCarePlans"))))
      .finally(() => setLoading(false));
  }, [patientId, reloadToken]);

  return (
    <SectionCard title={t("carePlans")}>
      {loading ? <LoadingSkeleton lines={4} /> : null}
      {error ? (
        <ErrorStateCard
          title={t("unableLoadCarePlans")}
          body={error}
          actionLabel={t("retry")}
          onAction={() => setReloadToken((current) => current + 1)}
        />
      ) : null}
      {!loading && !error && !plans.length ? (
        <EmptyStateCard
          title={t("noCarePlansAssigned")}
          body={translateDisplayText(language, "Care plans will appear here after a clinician creates one.")}
          actionLabel={t("retry")}
          onAction={() => setReloadToken((current) => current + 1)}
        />
      ) : null}
      <div className="space-y-4">
        {plans.map((plan) => (
            <div key={plan.id} className="rounded-2xl bg-mist p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{translateCarePlanValue(plan.title)}</p>
                  <p className="text-sm text-slate-500">{translateCarePlanValue(plan.conditionName)} - {translateCarePlanValue(plan.reviewFrequency || t("reviewScheduleNotSet"))}</p>
                </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${plan.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                {plan.active ? t("active") : t("inactive")}
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm font-semibold text-ink">{t("goals")}</p>
                <p className="mt-2 text-sm text-slate-600">{translateCarePlanValue(plan.goals)}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm font-semibold text-ink">{t("medicationGuidance")}</p>
                <p className="mt-2 text-sm text-slate-600">{translateCarePlanValue(plan.medicationGuidance) || t("noMedicationGuidance")}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm font-semibold text-ink">{t("lifestyleGuidance")}</p>
                <p className="mt-2 text-sm text-slate-600">{translateCarePlanValue(plan.lifestyleGuidance) || t("noLifestyleGuidance")}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm font-semibold text-ink">{t("warningThresholds")}</p>
                <p className="mt-2 text-sm text-slate-600">{translateCarePlanValue(plan.warningThresholds) || t("noWarningThresholds")}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

import { useEffect, useState } from "react";
import FormField from "../components/FormField";
import PremiumSectionCard from "../components/PremiumSectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { createCarePlan, fetchDoctorCarePlans } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function DoctorCarePlansPage() {
  const { auth } = useAuth();
  const { t, language } = useLanguage();
  const doctorId = auth.profileId ?? auth.userId;
  const translateCarePlanValue = (value: string | number) => {
    const demoMap = {
      "Diabetes continuity care plan": t("demoDiabetesCarePlanTitle"),
      "Type 2 Diabetes": t("demoType2Diabetes"),
      "Keep fasting sugar under control, maintain medicine adherence above 90%, and avoid emergency fluctuations.": t("demoDiabetesGoals"),
      "Take diabetic medicines after meals as prescribed. Do not skip doses. Record missed doses in the reminders page.": t("demoDiabetesMedicationGuidance"),
      "Walk 30 minutes at least 5 days a week, reduce refined sugar intake, maintain hydration, and log weekly weight.": t("demoDiabetesLifestyleGuidance"),
      "Escalate if sugar remains above 250 mg/dL, if dizziness worsens, or if repeated missed medication events occur.": t("demoDiabetesWarningThresholds"),
      "Weekly review": t("weeklyReview")
    };
    return (demoMap as DynamicStateObject)[value] || value;
  };
  const [plans, setPlans] = useState<DynamicStateObject[]>([]);
  const [error, setError] = useState<DynamicState>("");
  const [message, setMessage] = useState<DynamicState>("");
  const [loading, setLoading] = useState<DynamicState>(true);
  const [reloadToken, setReloadToken] = useState<DynamicState>(0);
  const [form, setForm] = useState<DynamicState>({
    patientId: 1,
    doctorId,
    title: "",
    conditionName: "",
    goals: "",
    medicationGuidance: "",
    lifestyleGuidance: "",
    warningThresholds: "",
    reviewFrequency: t("weeklyReview"),
    active: true
  });

  const loadPlans = async () => {
    if (!doctorId || auth?.role !== "DOCTOR") {
      setPlans([]);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchDoctorCarePlans(doctorId);
      setPlans(Array.isArray(data) ? data : []);
      setError("");
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, t("unableLoadCarePlans")));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const nextWeeklyReview = t("weeklyReview");
    setForm((current: DynamicStateObject) => {
      const shouldUpdateDoctorId = current.doctorId !== doctorId;
      const shouldUpdateReview = current.reviewFrequency === "Weekly review"
        || current.reviewFrequency === nextWeeklyReview;
      if (!shouldUpdateDoctorId && !shouldUpdateReview) {
        return current;
      }
      return {
        ...current,
        doctorId,
        reviewFrequency: shouldUpdateReview ? nextWeeklyReview : current.reviewFrequency
      };
    });
    loadPlans();
  }, [auth?.role, doctorId, language, reloadToken]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr] tcd-animate-in">
      <PremiumSectionCard
        title={t("createDiseaseCarePlan")}
        action={
          <button
            className="btn-primary btn-primary"
            type="button"
            aria-label={t("saveCarePlan")}
            data-voice-label={t("saveCarePlan")}
            onClick={async () => {
              try {
                const created = await createCarePlan({
                  ...form,
                  patientId: Number(form.patientId),
                  doctorId
                });
                setMessage(t("carePlanCreatedFor").replace("{name}", created.patientName));
                setError("");
                setForm({
                  patientId: 1,
                  doctorId,
                  title: "",
                  conditionName: "",
                  goals: "",
                  medicationGuidance: "",
                  lifestyleGuidance: "",
                  warningThresholds: "",
                  reviewFrequency: t("weeklyReview"),
                  active: true
                });
                await loadPlans();
              } catch (err: DynamicStateObject) {
                setError(getApiErrorMessage(err, t("unableCreateCarePlan")));
              }
            }}
          >
            {t("saveCarePlan")}
          </button>
        }
      >
        <div className="grid gap-4">
          <FormField label={t("patientId")} type="number" value={form.patientId} onChange={(e: DynamicStateObject) => setForm({ ...form, patientId: e.target.value })} />
          <FormField label={t("planTitle")} value={form.title} onChange={(e: DynamicStateObject) => setForm({ ...form, title: e.target.value })} />
          <FormField label={t("conditionName")} value={form.conditionName} onChange={(e: DynamicStateObject) => setForm({ ...form, conditionName: e.target.value })} />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-400">{t("goals")}</span>
            <textarea className="field min-h-24 resize-y" aria-label={t("goals")} data-voice-label={t("goals")} value={form.goals} onChange={(e: DynamicStateObject) => setForm({ ...form, goals: e.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-400">{t("medicationGuidance")}</span>
            <textarea className="field min-h-24 resize-y" aria-label={t("medicationGuidance")} data-voice-label={t("medicationGuidance")} value={form.medicationGuidance} onChange={(e: DynamicStateObject) => setForm({ ...form, medicationGuidance: e.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-400">{t("lifestyleGuidance")}</span>
            <textarea className="field min-h-24 resize-y" aria-label={t("lifestyleGuidance")} data-voice-label={t("lifestyleGuidance")} value={form.lifestyleGuidance} onChange={(e: DynamicStateObject) => setForm({ ...form, lifestyleGuidance: e.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-400">{t("warningThresholds")}</span>
            <textarea className="field min-h-24 resize-y" aria-label={t("warningThresholds")} data-voice-label={t("warningThresholds")} value={form.warningThresholds} onChange={(e: DynamicStateObject) => setForm({ ...form, warningThresholds: e.target.value })} />
          </label>
          <FormField label={t("reviewFrequency")} value={form.reviewFrequency} onChange={(e: DynamicStateObject) => setForm({ ...form, reviewFrequency: e.target.value })} />
        </div>
        {message ? <p className="mt-4 text-sm text-emerald-600" role="status" aria-live="polite">{message}</p> : null}
        {error ? (
          <div className="mt-4 text-sm text-red-600" role="alert">
            <p>{error}</p>
            <button
              className="btn-primary btn-secondary mt-3"
              type="button"
              onClick={() => setReloadToken((current: DynamicStateObject) => current + 1)}
              aria-label={t("retry")}
              data-voice-label={t("retry")}
            >
              {t("retry")}
            </button>
          </div>
        ) : null}
      </PremiumSectionCard>
      <PremiumSectionCard title={t("recentCarePlans")}>
        {loading ? <LoadingSkeleton lines={4} /> : null}
        {!loading && !plans.length ? (
          <EmptyStateCard
            title={t("noCarePlansCreated")}
            body={t("createDiseaseCarePlan")}
          />
        ) : null}
        <div className="space-y-4">
          {plans.map((plan: DynamicStateObject) => (
            <div key={plan.id} className="rounded-xl border border-white/5 bg-[var(--tc-surface-muted)] p-5">
              <p className="font-semibold text-white tracking-tight">{translateCarePlanValue(plan.title)}</p>
              <p className="mt-1 text-sm text-teal-400">{plan.patientName} <span className="text-slate-500 mx-1">•</span> {translateCarePlanValue(plan.conditionName)}</p>
              <div className="mt-4 rounded-lg bg-black/20 p-3 border-l-2 border-teal-500/50">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t("careGoals") || "Care Goals"}</p>
                <p className="text-sm text-slate-300 leading-relaxed">{translateCarePlanValue(plan.goals)}</p>
              </div>
            </div>
          ))}
        </div>
      </PremiumSectionCard>
    </div>
  );
}


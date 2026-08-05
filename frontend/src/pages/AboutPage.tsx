import { Link } from "react-router-dom";
import PageContainer from "../components/ui/PageContainer";
import { useLanguage } from "../context/LanguageContext";

export default function AboutPage() {
  const { translateUiText = (value: string | number) => value , t } = useLanguage();

  return (
    <PageContainer className="px-4 py-16 md:px-8">
      <div className="glass-card mx-auto max-w-3xl p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-clinic">{(t("teleCare") || "TeleCare+")}</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">{(t("aboutTeleCare") || "About TeleCare+")}</h1>
        <p className="mt-4 text-sm text-slate-600">
          {(t("teleCareIsAContinuityFirstTelemedicineWorkspaceDesignedForPatientsCliniciansCaregiversAndPharmacists") || "TeleCare+ is a continuity-first telemedicine workspace designed for patients, clinicians, caregivers, and pharmacists.")}
        </p>
        <p className="mt-3 text-sm text-slate-600">
          {(t("ourFocusIsSafeReliableFollowUpCareWithClearGuidanceForEveryRoleInTheCareJourney") || "Our focus is safe, reliable follow-up care with clear guidance for every role in the care journey.")}
        </p>
        <Link className="btn-secondary mt-6 inline-flex" to="/">{(t("backToHome") || "Back to home")}</Link>
      </div>
    </PageContainer>
  );
}

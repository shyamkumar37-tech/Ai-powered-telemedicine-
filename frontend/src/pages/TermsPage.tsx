import { Link } from "react-router-dom";
import PageContainer from "../components/ui/PageContainer";
import { useLanguage } from "../context/LanguageContext";

export default function TermsPage() {
  const { translateUiText = (value: string | number) => value , t } = useLanguage();

  return (
    <PageContainer className="px-4 py-16 md:px-8">
      <div className="glass-card mx-auto max-w-3xl p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-clinic">{(t("teleCare") || "TeleCare+")}</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">{(t("terms") || "Terms")}</h1>
        <p className="mt-4 text-sm text-slate-600">
          {(t("teleCareIsAnAcademicProjectClinicalAdviceShouldAlwaysBeVerifiedWithALicensedProfessional") || "TeleCare+ is an academic project. Clinical advice should always be verified with a licensed professional.")}
        </p>
        <p className="mt-3 text-sm text-slate-600">
          {(t("thisPageWillIncludeFullTermsAndConditionsForOfficialDeployments") || "This page will include full terms and conditions for official deployments.")}
        </p>
        <Link className="btn-secondary mt-6 inline-flex" to="/">{(t("backToHome") || "Back to home")}</Link>
      </div>
    </PageContainer>
  );
}

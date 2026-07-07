import { Link } from "react-router-dom";
import PageContainer from "../components/ui/PageContainer";
import { useLanguage } from "../context/LanguageContext";

export default function AboutPage() {
  const { translateUiText = (value) => value } = useLanguage();

  return (
    <PageContainer className="px-4 py-16 md:px-8">
      <div className="glass-card mx-auto max-w-3xl p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-clinic">{translateUiText("TeleCare+")}</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">{translateUiText("About TeleCare+")}</h1>
        <p className="mt-4 text-sm text-slate-600">
          {translateUiText("TeleCare+ is a continuity-first telemedicine workspace designed for patients, clinicians, caregivers, and pharmacists.")}
        </p>
        <p className="mt-3 text-sm text-slate-600">
          {translateUiText("Our focus is safe, reliable follow-up care with clear guidance for every role in the care journey.")}
        </p>
        <Link className="btn-secondary mt-6 inline-flex" to="/">{translateUiText("Back to home")}</Link>
      </div>
    </PageContainer>
  );
}

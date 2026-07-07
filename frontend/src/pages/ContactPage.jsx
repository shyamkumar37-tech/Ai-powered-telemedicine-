import { Link } from "react-router-dom";
import PageContainer from "../components/ui/PageContainer";
import { useLanguage } from "../context/LanguageContext";

export default function ContactPage() {
  const { translateUiText = (value) => value } = useLanguage();

  return (
    <PageContainer className="px-4 py-16 md:px-8">
      <div className="glass-card mx-auto max-w-3xl p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-clinic">{translateUiText("TeleCare+")}</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">{translateUiText("Contact")}</h1>
        <p className="mt-4 text-sm text-slate-600">
          {translateUiText("For account, care, or operational support, reach out to the TeleCare+ team.")}
        </p>
        <p className="mt-3 text-sm text-slate-600">
          {translateUiText("Email")}: <span className="font-semibold text-ink">support@telecareplus.app</span>
        </p>
        <Link className="btn-secondary mt-6 inline-flex" to="/">
          {translateUiText("Back to home")}
        </Link>
      </div>
    </PageContainer>
  );
}

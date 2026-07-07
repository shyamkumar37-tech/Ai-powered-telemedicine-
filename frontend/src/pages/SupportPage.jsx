import { Link, useLocation } from "react-router-dom";
import PageContainer from "../components/ui/PageContainer";
import { useLanguage } from "../context/LanguageContext";

export default function SupportPage() {
  const { translateUiText = (value) => value } = useLanguage();
  const location = useLocation();
  const supportTopic = (() => {
    try {
      return new URLSearchParams(location.search || "").get("topic") || "";
    } catch {
      return "";
    }
  })();

  return (
    <PageContainer className="px-4 py-16 md:px-8">
      <div className="glass-card mx-auto max-w-3xl p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-clinic">{translateUiText("TeleCare+")}</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">{translateUiText("Support")}</h1>
        <p className="mt-4 text-sm text-slate-600">
          {supportTopic === "password-reset"
            ? translateUiText("Need password help? Contact your TeleCare+ support team to verify identity and reset access safely.")
            : translateUiText("Need help navigating your care workspace? We’re here to guide you through TeleCare+ safely.")}
        </p>
        <p className="mt-3 text-sm text-slate-600">
          {translateUiText("Quick tips")}: {translateUiText("Log in, explore your role dashboard, and review reminders or care plans.")}
        </p>
        <Link className="btn-secondary mt-6 inline-flex" to="/">
          {translateUiText("Back to home")}
        </Link>
      </div>
    </PageContainer>
  );
}

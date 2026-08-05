import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { normalizeRole } from "../utils/roleUtils";

export default function NotFoundPage() {
  const { auth } = useAuth();
  const { t, language, translateUiText = (value: string | number) => value } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const location = useLocation();
  const navigate = useNavigate();
  const normalizedRole = normalizeRole(auth?.role);
  const languageSearch = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search || "");
      const lang = params.get("lang") || language;
      return lang && lang !== "en" ? `?lang=${lang}` : "";
    } catch {
      return language && language !== "en" ? `?lang=${language}` : "";
    }
  }, [language, location.search]);

  const roleHome = normalizedRole === "PATIENT"
    ? `/patient${languageSearch}`
    : normalizedRole === "DOCTOR"
      ? `/doctor${languageSearch}`
      : normalizedRole === "PHARMACIST"
        ? `/pharmacist${languageSearch}`
        : normalizedRole === "CAREGIVER"
          ? `/caregiver${languageSearch}`
          : `/${languageSearch}`;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="glass-card w-full max-w-xl p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-clinic">TeleCare+</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">{t("pageNotFound") || "Page not found"}</h1>
        <p className="mt-3 text-sm text-slate-600">
          {(t("weCouldNotFindThePageYouAreLookingForItMayHaveMovedOrBeenRenamed") || "We could not find the page you are looking for. It may have moved or been renamed.")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate(roleHome, { replace: true })}
            aria-label="Go to dashboard"
            data-voice-label="Go to dashboard"
          >
            {t("goToDashboard") || "Go to dashboard"}</button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(`/${languageSearch}`, { replace: true })}
            aria-label="Go to home"
            data-voice-label="Go to home"
          >
            {t("goToHome") || "Go to home"}</button>
        </div>
      </div>
    </div>
  );
}

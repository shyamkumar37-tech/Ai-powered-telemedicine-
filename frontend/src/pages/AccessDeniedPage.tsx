import { DynamicState, DynamicStateObject } from "./../types/DynamicState";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { normalizeRole } from "../utils/roleUtils";
import { buildLoginRedirect } from "../utils/authSession";

function roleLabel(role: DynamicStateObject) {
  if (role === "PATIENT") return "Patient";
  if (role === "DOCTOR") return "Doctor";
  if (role === "CAREGIVER") return "Caregiver";
  if (role === "PHARMACIST") return "Pharmacist";
  if (role === "ADMIN") return "Admin";
  return "Unknown";
}

export interface AccessDeniedPageProps {
  requiredRoles?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function AccessDeniedPage({ requiredRoles = [] }: AccessDeniedPageProps) {
  const { auth, logout } = useAuth();
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
      : normalizedRole === "ADMIN"
        ? `/admin${languageSearch}`
      : normalizedRole === "PHARMACIST"
        ? `/pharmacist${languageSearch}`
        : normalizedRole === "CAREGIVER"
          ? `/caregiver${languageSearch}`
          : `/login${languageSearch}`;

  const requiredLabel = requiredRoles.length
    ? requiredRoles.map((role: DynamicStateObject) => roleLabel(normalizeRole(role))).join(", ")
    : "this page";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="glass-card w-full max-w-xl p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-clinic">TeleCare+</p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">{(t("accessRestricted") || "Access restricted")}</h1>
        <p className="mt-3 text-sm text-slate-600">
          {(t("thisPageIsAvailableOnlyForUsers") || `This page is available only for ${requiredLabel} users.`)}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {(t("signedInAs") || `Signed in as ${roleLabel(normalizedRole)}.`)}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate(roleHome, { replace: true })}
            aria-label={(t("goToMyDashboard") || "Go to my dashboard")}
            data-voice-label={(t("goToMyDashboard") || "Go to my dashboard")}
          >
            {(t("goToMyDashboard") || "Go to my dashboard")}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              logout();
              navigate(buildLoginRedirect(languageSearch), { replace: true });
            }}
            aria-label={(t("switchAccount") || "Switch account")}
            data-voice-label={(t("switchAccount") || "Switch account")}
          >
            {(t("switchAccount") || "Switch account")}
          </button>
        </div>
      </div>
    </div>
  );
}

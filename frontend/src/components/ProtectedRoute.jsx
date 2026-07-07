import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { buildAuthSnapshot, evaluateProtectedRouteState } from "../utils/authGuards";
import PageLayout from "./PageLayout";
import AccessDeniedPage from "../pages/AccessDeniedPage";
import { trackAuthEvent, trackUnauthorizedRoute } from "../services/telemetry";

export default function ProtectedRoute({ roles, children, variant = "page" }) {
  const { auth, isAuthenticated, isAuthReady } = useAuth();
  const { language, translateUiText = (value) => value } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const location = useLocation();
  const languageSearch = location.search || (language && language !== "en" ? `?lang=${language}` : "");
  const [timedOut, setTimedOut] = useState(false);

  if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
      console.log("[TeleCare+] ProtectedRoute decision", {
        path: location.pathname + location.search,
        isAuthReady,
        isAuthenticated,
        role: auth?.role ?? null,
        roles: roles ?? null
      });
    }

  if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
    console.log("[TeleCare+] ProtectedRoute guardState", evaluateProtectedRouteState({
      auth, isAuthenticated, isAuthReady, roles, variant, pathname: location.pathname, languageSearch
    }));
  }

  useEffect(() => {
    if (isAuthReady) {
      setTimedOut(false);
      return () => {};
    }

    setTimedOut(false);
    const timer = window.setTimeout(() => {
      setTimedOut(true);
    }, 8000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isAuthReady]);

  const guardState = evaluateProtectedRouteState({
    auth,
    isAuthenticated,
    isAuthReady,
    roles,
    variant,
    pathname: location.pathname,
    languageSearch
  });

  console.log("[WORKSPACE]", {
    step: "route-guard",
    path: location.pathname + location.search,
    state: guardState.kind,
    isAuthReady,
    isAuthenticated,
    role: auth?.role ?? null,
    userId: auth?.userId ?? null,
    profileId: auth?.profileId ?? null,
    requiredRoles: roles ?? null
  });

  useEffect(() => {
    if (guardState.kind === "invalid-auth") {
      trackAuthEvent("invalid-session", {
        path: location.pathname + location.search,
        ...buildAuthSnapshot(auth)
      });
    }

    if (guardState.kind === "denied" || guardState.kind === "redirect-home") {
      trackUnauthorizedRoute({
        route: location.pathname,
        requiredRoles: roles,
        ...buildAuthSnapshot(auth)
      });
    }
  }, [auth, guardState.kind, location.pathname, location.search, roles]);

  if (!isAuthReady) {
    if (timedOut) {
      return (
        <div className="glass-card p-6">
          <p className="text-lg font-semibold text-ink">{translateUiText("Workspace is taking longer than expected")}</p>
          <p className="mt-2 text-sm text-slate-600">{translateUiText("Your session is still being prepared. You can retry without losing your login.")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="btn-primary"
              type="button"
              onClick={() => window.location.reload()}
              aria-label={translateUiText("Retry")}
              data-voice-label={translateUiText("Retry")}
            >
              {translateUiText("Retry")}
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => window.location.assign(`/login${languageSearch}`)}
              aria-label={translateUiText("Back to login")}
              data-voice-label={translateUiText("Back to login")}
            >
              {translateUiText("Back to login")}
            </button>
          </div>
        </div>
      );
    }
    return <PageLayout variant={variant} />;
  }

  if (guardState.kind === "redirect-login" || guardState.kind === "invalid-auth") {
    return <Navigate to={guardState.redirectTo} replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (guardState.kind === "redirect-home") {
    return <Navigate to={guardState.redirectTo} replace />;
  }

  if (guardState.kind === "denied") {
    return <AccessDeniedPage requiredRoles={roles} />;
  }

  return (
    <PageLayout variant={variant}>
      {children}
    </PageLayout>
  );
}

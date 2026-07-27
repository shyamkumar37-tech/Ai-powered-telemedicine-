import { getDefaultRouteForRole, normalizeRole } from "./roleUtils";
import { DynamicStateObject } from "./../types/DynamicState";

export function evaluateProtectedRouteState({
  auth,
  isAuthenticated,
  isAuthReady,
  roles,
  variant,
  pathname,
  languageSearch
}: DynamicStateObject) {
  const normalizedRole = normalizeRole(auth?.role);

  if (!isAuthReady) {
    return {
      kind: "loading",
      normalizedRole
    };
  }

  if (!isAuthenticated) {
    return {
      kind: "redirect-login",
      normalizedRole,
      redirectTo: `/login${languageSearch}`
    };
  }

  if (!normalizedRole) {
    return {
      kind: "invalid-auth",
      normalizedRole,
      redirectTo: `/login${languageSearch}`
    };
  }

  if (roles && !roles.includes(normalizedRole)) {
    const redirectHome = getDefaultRouteForRole(normalizedRole, languageSearch);
    if (variant === "shell" && pathname !== redirectHome.replace(languageSearch, "")) {
      return {
        kind: "redirect-home",
        normalizedRole,
        redirectTo: redirectHome
      };
    }

    return {
      kind: "denied",
      normalizedRole
    };
  }

  // Enforce Patient Onboarding Flow
  if (normalizedRole === "PATIENT") {
    // We treat explicitly false or missing profileId as incomplete for patients right after registration
    const profileIncomplete = auth?.isProfileComplete === false || !auth?.profileId;
    
    if (profileIncomplete && pathname !== "/patient/setup") {
      return {
        kind: "redirect-setup",
        normalizedRole,
        redirectTo: `/patient/setup${languageSearch}`
      };
    } else if (!profileIncomplete && pathname === "/patient/setup") {
      return {
        kind: "redirect-home",
        normalizedRole,
        redirectTo: `/patient${languageSearch}`
      };
    }
  }

  return {
    kind: "allow",
    normalizedRole
  };
}

export function buildAuthSnapshot(auth: DynamicStateObject) {
  return {
    role: normalizeRole(auth?.role),
    userId: auth?.userId ?? null,
    profileId: auth?.profileId ?? null
  };
}

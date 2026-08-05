import { getDefaultRouteForRole, normalizeRole } from "./roleUtils";

export interface AuthUser {
  role?: string | null;
  userId?: string | number | null;
  profileId?: string | number | null;
  isProfileComplete?: boolean;
  token?: string | null;
  [key: string]: unknown;
}

export interface ProtectedRouteGuardInput {
  auth?: AuthUser | null;
  isAuthenticated?: boolean;
  isAuthReady?: boolean;
  roles?: string | string[] | null;
  variant?: string;
  pathname?: string;
  languageSearch?: string;
}

export function evaluateProtectedRouteState({
  auth,
  isAuthenticated,
  isAuthReady,
  roles,
  variant,
  pathname,
  languageSearch = ""
}: ProtectedRouteGuardInput) {
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

  const roleArray = Array.isArray(roles) ? roles : roles ? [roles] : null;
  if (roleArray && !roleArray.includes(normalizedRole)) {
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

export function buildAuthSnapshot(auth?: AuthUser | null) {
  return {
    role: normalizeRole(auth?.role),
    userId: auth?.userId ?? null,
    profileId: auth?.profileId ?? null
  };
}

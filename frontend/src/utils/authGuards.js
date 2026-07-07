import { getDefaultRouteForRole, normalizeRole } from "./roleUtils";

export function evaluateProtectedRouteState({
  auth,
  isAuthenticated,
  isAuthReady,
  roles,
  variant,
  pathname,
  languageSearch
}) {
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

  return {
    kind: "allow",
    normalizedRole
  };
}

export function buildAuthSnapshot(auth) {
  return {
    role: normalizeRole(auth?.role),
    userId: auth?.userId ?? null,
    profileId: auth?.profileId ?? null
  };
}

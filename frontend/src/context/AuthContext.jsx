import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as loginRequest, register as registerRequest, verifyOtpLogin as verifyOtpLoginRequest } from "../services/authService";
import { trackAuthEvent } from "../services/telemetry";
import { normalizeRole } from "../utils/roleUtils";
import { safeJsonParse } from "../utils/safeJson";
import { normalizeAuth as normalizeAuthUtil } from "../utils/normalizeAuth";
import {
  AUTH_CHANGED_EVENT,
  AUTH_STORAGE_KEY,
  clearAuthStorageArtifacts,
  notifyAuthCleared
} from "../utils/authSession";

function normalizeAuth(data) {
  return normalizeAuthUtil(data);
}

function readStoredAuth() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      console.log("[AUTH]", { step: "storage-read", stored: false });
      if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
        console.log("[TeleCare+] readStoredAuth: no stored auth");
      }
      return null;
    }
    const parsed = safeJsonParse(stored);
    if (!parsed) {
      console.log("[AUTH]", { step: "storage-read", stored: true, validJson: false });
      if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
        console.log("[TeleCare+] readStoredAuth: stored auth invalid, clearing");
      }
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    const norm = normalizeAuth(parsed);
    console.log("[AUTH]", {
      step: "storage-read",
      stored: true,
      normalized: Boolean(norm),
      role: norm?.role ?? null,
      userId: norm?.userId ?? null,
      profileId: norm?.profileId ?? null
    });
    if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
      console.log("[TeleCare+] readStoredAuth -> normalized", norm);
    }
    return norm;
  } catch {
    console.log("[AUTH]", { step: "storage-read", error: "storage-read-invalid" });
    trackAuthEvent("storage-read-invalid", { storageKey: AUTH_STORAGE_KEY });
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function notifyAuthChange(auth) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, {
    detail: auth ?? null
  }));
}

function persistStoredAuth(auth) {
  try {
    const existing = localStorage.getItem(AUTH_STORAGE_KEY);
    const existingJson = existing || null;
    const nextJson = auth ? JSON.stringify(auth) : null;
    if (nextJson === existingJson) {
      // no-op to avoid storage event loops
    } else if (auth) {
      localStorage.setItem(AUTH_STORAGE_KEY, nextJson);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures; active in-memory auth can still work.
  } finally {
    console.log("[AUTH]", {
      step: auth ? "token-save" : "token-clear",
      hasToken: Boolean(auth?.token),
      role: auth?.role ?? null,
      userId: auth?.userId ?? null,
      profileId: auth?.profileId ?? null
    });
    if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
      console.log("[TeleCare+] persistStoredAuth", auth);
    }
    notifyAuthChange(auth);
  }
}

function writeStoredAuthSilently(auth) {
  try {
    const existing = localStorage.getItem(AUTH_STORAGE_KEY);
    const nextJson = auth ? JSON.stringify(auth) : null;
    if (nextJson === existing) {
      // avoid write to prevent triggering storage listeners unnecessarily
    } else if (auth) {
      localStorage.setItem(AUTH_STORAGE_KEY, nextJson);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures; active in-memory auth can still work.
  }
}

function clearAuthArtifacts() {
  clearAuthStorageArtifacts();
  notifyAuthCleared();
}

const AUTH_CONTEXT_FALLBACK = {
  auth: null,
  isAuthReady: false,
  isAuthenticated: false,
  login: async (payload) => {
    const normalized = normalizeAuth(await loginRequest(payload));
    persistStoredAuth(normalized);
    return normalized;
  },
  register: async (payload) => {
    const normalized = normalizeAuth(await registerRequest(payload));
    persistStoredAuth(normalized);
    return normalized;
  },
  verifyOtpLogin: async (payload) => {
    const normalized = normalizeAuth(await verifyOtpLoginRequest(payload));
    persistStoredAuth(normalized);
    return normalized;
  },
  logout: () => {
    clearAuthArtifacts();
    persistStoredAuth(null);
  }
};

const AuthContext = createContext(AUTH_CONTEXT_FALLBACK);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);
  const [initialized, setInitialized] = useState(true);

  useEffect(() => {
    console.log("[BOOTSTRAP]", {
      step: "auth-provider-mounted",
      hasAuth: Boolean(auth?.token),
      role: auth?.role ?? null,
      userId: auth?.userId ?? null,
      profileId: auth?.profileId ?? null
    });
    if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
      console.log("[TeleCare+] AuthProvider mount; initial auth:", auth);
    }
    writeStoredAuthSilently(auth);
  }, [auth]);

  useEffect(() => {
    // Auth is read synchronously from localStorage during initial state setup.
    // Keep this effect for existing diagnostics, but readiness should not depend
    // on an async effect after redirects.
    console.log("[BOOTSTRAP]", { step: "auth-hydration-ready" });
    if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
      console.log("[TeleCare+] AuthProvider initialized -> true");
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return () => {};
    }

    const syncAuth = () => {
      const nextAuth = readStoredAuth();
      if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
        console.log("[TeleCare+] syncAuth event -> nextAuth", nextAuth);
      }
      setAuth((current) => {
        if (!current && !nextAuth) {
          return current;
        }
        if (current?.token === nextAuth?.token
          && current?.role === nextAuth?.role
          && current?.profileId === nextAuth?.profileId
          && current?.userId === nextAuth?.userId) {
          return current;
        }
        return nextAuth;
      });
    };

    window.addEventListener("storage", syncAuth);
    window.addEventListener(AUTH_CHANGED_EVENT, syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuth);
    };
  }, []);

  const isTokenValid = (candidate) => Boolean(candidate?.token);

  const value = useMemo(() => ({
    auth,
    isAuthReady: initialized,
    isAuthenticated: Boolean(auth?.token && !isTokenValid(auth) ? false : Boolean(auth?.token && auth?.role)),
    login: async (payload) => {
      console.log("[AUTH]", { step: "login-submit", email: payload?.email ?? null });
      const data = await loginRequest(payload);
      console.log("[AUTH]", {
        step: "login-response",
        hasToken: Boolean(data?.token || data?.accessToken || data?.access_token),
        role: data?.role ?? data?.user?.role ?? null,
        userId: data?.userId ?? data?.user?.id ?? null,
        profileId: data?.profileId ?? null
      });
      const normalized = normalizeAuth(data);
      console.log("[AUTH]", {
        step: "login-normalized",
        accepted: Boolean(normalized),
        role: normalized?.role ?? null,
        userId: normalized?.userId ?? null,
        profileId: normalized?.profileId ?? null
      });
      if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
        console.log("[TeleCare+] login -> normalized", normalized);
      }
      persistStoredAuth(normalized);
      setAuth(normalized);
      return normalized;
    },
    register: async (payload) => {
      const data = await registerRequest(payload);
      const normalized = normalizeAuth(data);
      persistStoredAuth(normalized);
      setAuth(normalized);
      return normalized;
    },
    verifyOtpLogin: async (payload) => {
      const data = await verifyOtpLoginRequest(payload);
      const normalized = normalizeAuth(data);
      persistStoredAuth(normalized);
      setAuth(normalized);
      return normalized;
    },
    logout: () => {
      clearAuthArtifacts();
      persistStoredAuth(null);
      if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
        console.log("[TeleCare+] logout -> cleared");
      }
      setAuth(null);
    }
  }), [auth, initialized]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context && typeof context.isAuthReady !== "undefined") {
    return context;
  }
  return AUTH_CONTEXT_FALLBACK;
}

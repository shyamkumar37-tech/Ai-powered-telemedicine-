import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { login as loginRequest, register as registerRequest, verifyOtpLogin as verifyOtpLoginRequest } from "../services/authService";
import { wsService } from "../services/websocketService";
import { trackAuthEvent } from "../services/telemetry";
import { safeJsonParse } from "../utils/safeJson";
import { normalizeAuth as normalizeAuthUtil } from "../utils/normalizeAuth";
import {
  AUTH_CHANGED_EVENT,
  AUTH_STORAGE_KEY,
  clearAuthStorageArtifacts,
  notifyAuthCleared
} from "../utils/authSession";
import { DynamicStateObject, DynamicState } from "./../types/DynamicState";

function normalizeAuth(data: DynamicStateObject) {
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

function notifyAuthChange(auth: DynamicStateObject) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, {
    detail: auth ?? null
  }));
}

function persistStoredAuth(auth: DynamicStateObject) {
  try {
    const existing = localStorage.getItem(AUTH_STORAGE_KEY);
    const existingJson = existing || null;
    const nextJson = auth ? JSON.stringify(auth) : null;
    if (nextJson === existingJson) {
      // no-op to avoid storage event loops
    } else if (auth) {
      localStorage.setItem(AUTH_STORAGE_KEY, nextJson as string);
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

function writeStoredAuthSilently(auth: DynamicStateObject) {
  try {
    const existing = localStorage.getItem(AUTH_STORAGE_KEY);
    const nextJson = auth ? JSON.stringify(auth) : null;
    if (nextJson === existing) {
      // avoid write to prevent triggering storage listeners unnecessarily
    } else if (auth) {
      localStorage.setItem(AUTH_STORAGE_KEY, nextJson as string);
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

export interface AuthContextType {
  auth: DynamicStateObject | null;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  login: (payload: DynamicStateObject) => Promise<DynamicStateObject | null>;
  register: (payload: DynamicStateObject) => Promise<DynamicStateObject | null>;
  verifyOtpLogin: (payload: DynamicStateObject) => Promise<DynamicStateObject | null>;
  logout: () => void;
  updateAuthData: (payload: DynamicStateObject) => void;
}

const AUTH_CONTEXT_FALLBACK: AuthContextType = {
  auth: null,
  isAuthReady: false,
  isAuthenticated: false,
  login: async (payload: DynamicStateObject) => {
    const normalized = normalizeAuth(await loginRequest(payload));
    persistStoredAuth(normalized);
    return normalized;
  },
  register: async (payload: DynamicStateObject) => {
    const normalized = normalizeAuth(await registerRequest(payload));
    persistStoredAuth(normalized);
    return normalized;
  },
  verifyOtpLogin: async (payload: DynamicStateObject) => {
    const normalized = normalizeAuth(await verifyOtpLoginRequest(payload));
    persistStoredAuth(normalized);
    return normalized;
  },
  logout: () => {
    clearAuthArtifacts();
    persistStoredAuth(null);
  },
  updateAuthData: () => {}
};

const AuthContext = createContext<AuthContextType>(AUTH_CONTEXT_FALLBACK);

export interface AuthProviderProps {
  children?: ReactNode;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [auth, setAuth] = useState<DynamicState>(readStoredAuth);
  const [initialized, setInitialized] = useState<DynamicState>(true);

  useEffect(() => {
    const handleAuthChange = (e: any) => {
      setAuth(e.detail);
    };
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
  }, []);

  const value = useMemo(() => ({
    auth,
    isAuthReady: initialized,
    isAuthenticated: !!auth?.token,
    login: async (payload: DynamicStateObject) => {
      const normalized = normalizeAuth(await loginRequest(payload));
      persistStoredAuth(normalized);
      if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
        console.log("[TeleCare+] login -> saved");
      }
      return normalized;
    },
    register: async (payload: DynamicStateObject) => {
      const normalized = normalizeAuth(await registerRequest(payload));
      persistStoredAuth(normalized);
      if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
        console.log("[TeleCare+] register -> saved");
      }
      return normalized;
    },
    verifyOtpLogin: async (payload: DynamicStateObject) => {
      const normalized = normalizeAuth(await verifyOtpLoginRequest(payload));
      persistStoredAuth(normalized);
      if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
        console.log("[TeleCare+] verifyOtpLogin -> saved");
      }
      return normalized;
    },
    logout: () => {
      clearAuthArtifacts();
      persistStoredAuth(null);
      if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
        console.log("[TeleCare+] logout -> cleared");
      }
      setAuth(null);
    },
    updateAuthData: (payload: DynamicStateObject) => {
      setAuth((current: DynamicStateObject) => {
        if (!current) return current;
        const nextAuth = { ...current, ...payload };
        if (payload.user && current.user) {
          nextAuth.user = { ...current.user, ...payload.user };
        }
        persistStoredAuth(nextAuth);
        return nextAuth;
      });
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

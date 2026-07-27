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

import { useCallback, useEffect, useRef, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useAuth } from "../context/AuthContext";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { API_BASE_URL } from "../services/api";
import { getDefaultRouteForRole, normalizeRole } from "../utils/roleUtils";
import { Loader2, ShieldCheck, Fingerprint, Sparkles, Mail, Lock, Check, ArrowRight, Activity, Heart, Stethoscope, Users, Pill } from "lucide-react";
import { useToast } from "../components/ui/ToastProvider";
import { motion } from "framer-motion";
import { DynamicStateObject, DynamicState } from "../types/DynamicState";

const DEMO_ROLE_ACCOUNTS = {
  PATIENT: {
    email: "patient@telecareplus.com",
    password: "Password123",
    roleName: "Patient",
    subtitle: "Patient · Chronic care plan"
  },
  DOCTOR: {
    email: "doctor@telecareplus.com",
    password: "Password123",
    roleName: "Doctor",
    subtitle: "Doctor · Clinical consult cockpit"
  },
  CAREGIVER: {
    email: "caregiver@telecareplus.com",
    password: "Password123",
    roleName: "Caregiver",
    subtitle: "Caregiver · Multi-dependent monitoring"
  },
  PHARMACIST: {
    email: "pharmacist@telecareplus.com",
    password: "Password123",
    roleName: "Pharmacist",
    subtitle: "Pharmacist · Dispensing & inventory pipeline"
  }
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3.5 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold text-xs tracking-wide uppercase flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 active:scale-98 transition-all cursor-pointer mt-6"
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>Signing in securely...</span>
        </>
      ) : (
        <>
          <span>Sign in securely</span>
          <ArrowRight size={16} />
        </>
      )}
    </button>
  );
}

export default function LoginPage() {
  const { language, t } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const { login, logout, auth, isAuthenticated, isAuthReady } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const forceLogin = (() => {
    try {
      return new URLSearchParams(location.search || "").get("forceLogin") === "1";
    } catch {
      return false;
    }
  })();

  const languageSearch = (() => {
    try {
      const params = new URLSearchParams(location.search || "");
      params.delete("forceLogin");
      const targetLang = params.get("lang") || (language && language !== "en" ? language : "");
      return targetLang && targetLang !== "en" ? `?lang=${targetLang}` : "";
    } catch {
      return language && language !== "en" ? `?lang=${language}` : "";
    }
  })();

  const [selectedRole, setSelectedRole] = useState<"PATIENT" | "DOCTOR" | "CAREGIVER" | "PHARMACIST">("PATIENT");
  const [form, setForm] = useState<DynamicState>({
    email: DEMO_ROLE_ACCOUNTS.PATIENT.email,
    password: DEMO_ROLE_ACCOUNTS.PATIENT.password
  });
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"signin" | "register">("signin");
  const [backendStatus, setBackendStatus] = useState<DynamicState>({ state: "checking" });
  const hasRedirectedRef = useRef<DynamicState>(false);
  const hasForcedLogoutRef = useRef<DynamicState>(false);

  const handleSelectRole = (roleKey: "PATIENT" | "DOCTOR" | "CAREGIVER" | "PHARMACIST") => {
    setSelectedRole(roleKey);
    setForm({
      email: DEMO_ROLE_ACCOUNTS[roleKey].email,
      password: DEMO_ROLE_ACCOUNTS[roleKey].password
    });
  };

  useEffect(() => {
    try {
      const expired = sessionStorage.getItem("telecareplus-auth-expired");
      if (expired === "1") {
        sessionStorage.removeItem("telecareplus-auth-expired");
        pushToast({
          type: "error",
          title: "Session expired",
          message: "Please sign in again to continue."
        });
      }
    } catch {
      // Ignore storage error.
    }
  }, []);

  const checkBackend = useCallback(async () => {
    setBackendStatus({ state: "checking" });
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4000);
    try {
      const statusUrl = import.meta.env.DEV ? "/api/system/status" : `${API_BASE_URL}/system/status`;
      const response = await fetch(statusUrl, {
        method: "GET",
        signal: controller.signal,
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) throw new Error("Backend unavailable");
      const payload = await response.json();
      const ready = payload?.ready === true || payload?.status === "UP";
      setBackendStatus({ state: ready ? "ready" : "down" });
    } catch {
      setBackendStatus({ state: "down" });
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      checkBackend();
    }
  }, [checkBackend]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = `TeleCare+ — One secure door into connected care`;
    }
  }, []);

  const redirectByRole = (authData: DynamicStateObject, { allowForceLogin = false } = {}) => {
    if (hasRedirectedRef.current || (forceLogin && !allowForceLogin)) {
      return;
    }
    const normalizedRole = normalizeRole(authData?.role);
    const roleHome = getDefaultRouteForRole(normalizedRole, languageSearch);
    const requestedPath = typeof location.state?.from === "string" ? location.state.from : "";
    const destination = requestedPath && requestedPath.startsWith(roleHome.split("?")[0]) ? requestedPath : roleHome;
    hasRedirectedRef.current = true;
    navigate(destination, { replace: true });
  };

  useEffect(() => {
    if (forceLogin && isAuthenticated && !hasForcedLogoutRef.current) {
      hasForcedLogoutRef.current = true;
      logout();
      return;
    }
    if (isAuthReady && isAuthenticated && auth?.role) {
      redirectByRole(auth);
    }
  }, [auth, forceLogin, isAuthReady, isAuthenticated, location.pathname, location.search]);

  const [error, submitAction, isPending] = useActionState(async (prevState: string | null, formData: FormData) => {
    try {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const authData = await login({ email, password });
      pushToast({
        type: "success",
        title: "Login successful",
        message: `Welcome back, ${authData?.fullName || "TeleCare+ user"}.`
      });
      redirectByRole(authData, { allowForceLogin: true });
      return null;
    } catch (err: any) {
      return err.response?.data?.message || err.message || "Login failed";
    }
  }, null);

  return (
    <div className="min-h-screen w-full bg-[#050913] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] text-slate-100 flex items-center justify-center p-4 lg:p-10 selection:bg-teal-500 selection:text-slate-950 font-sans">
      <motion.div
        className="w-full max-w-6xl rounded-3xl border border-slate-800 bg-[#080E1A]/90 backdrop-blur-2xl shadow-2xl shadow-slate-950/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* LEFT COLUMN — BRAND & SECURITY HIGHLIGHTS */}
        <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-gradient-to-br from-slate-900/50 via-slate-950/40 to-slate-950">
          <div>
            {/* Top Logo */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-500/20">
                  <Heart size={20} className="fill-teal-400 text-teal-400" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">TeleCare+</span>
              </div>
              <LanguageSwitcher hideLabel />
            </div>

            {/* Pill Badge */}
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 border border-teal-500/30 text-teal-300 mb-6">
              Clinical-grade access · 6 locales
            </span>

            {/* Headline */}
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
              One secure door into <span className="text-teal-400">connected care</span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-lg">
              Sign in once and TeleCare+ assembles the right workspace — triage and vitals for patients, a consult cockpit for doctors, dependent monitoring for caregivers and a dispensing pipeline for pharmacists.
            </p>

            {/* 3 Security Highlight Cards */}
            <div className="space-y-3.5 mb-8">
              <div className="flex items-start gap-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 p-4 backdrop-blur transition-all hover:border-slate-700 hover:bg-slate-900/80">
                <div className="h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">HIPAA & GDPR aligned</h4>
                  <p className="text-xs text-slate-400 mt-0.5">End-to-end encrypted consults, audited record access.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 p-4 backdrop-blur transition-all hover:border-slate-700 hover:bg-slate-900/80">
                <div className="h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                  <Fingerprint size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Passkey + MFA ready</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Biometric sign-in with TOTP fallback for clinicians.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 p-4 backdrop-blur transition-all hover:border-slate-700 hover:bg-slate-900/80">
                <div className="h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">AI with consent gates</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Every AI summary is traceable to signed source notes.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Medical Graphics Panel */}
          <div className="relative overflow-hidden rounded-2xl border border-teal-500/30 bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 p-4 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <Activity size={22} className="text-teal-400 animate-pulse" />
              <div>
                <div className="font-semibold text-white">Live Clinical Telemetry Engine</div>
                <div className="text-[11px] text-teal-300/80">Sub-100ms sync across all 4 role portals</div>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping"></span>
          </div>
        </div>

        {/* RIGHT COLUMN — SIGN IN FORM */}
        <div className="lg:col-span-6 p-8 lg:p-12 bg-[#0B1524]/90 flex flex-col justify-between">
          <div>
            {/* Top Tab Switcher */}
            <div className="flex items-center justify-between rounded-xl bg-slate-950 p-1 border border-slate-800 mb-8 max-w-sm">
              <button
                type="button"
                onClick={() => setActiveTab("signin")}
                className={`w-1/2 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "signin"
                    ? "bg-teal-400 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className={`w-1/2 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "register"
                    ? "bg-teal-400 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Create account
              </button>
            </div>

            {/* Header */}
            <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Welcome back</h2>
            <p className="text-xs text-slate-400 mb-6">Choose your role — the demo opens that workspace instantly.</p>

            {/* ROLE SELECTOR GRID */}
            <div className="mb-6">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 block">ROLE</label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: "PATIENT", label: "Patient", icon: Heart },
                  { key: "DOCTOR", label: "Doctor", icon: Stethoscope },
                  { key: "CAREGIVER", label: "Caregiver", icon: Users },
                  { key: "PHARMACIST", label: "Pharmacist", icon: Pill }
                ].map((role) => {
                  const isSelected = selectedRole === role.key;
                  const IconComp = role.icon;
                  return (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => handleSelectRole(role.key as any)}
                      className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "border-teal-400 bg-teal-500/10 text-teal-300 shadow-sm"
                          : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComp size={16} className={isSelected ? "text-teal-400" : "text-slate-500"} />
                        <span>{role.label}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-teal-400" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-teal-400/90 font-medium mt-2.5 pl-1">
                {DEMO_ROLE_ACCOUNTS[selectedRole].subtitle}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400 font-medium" role="alert">
                {error}
              </div>
            )}

            {/* Form */}
            <form action={submitAction} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Work email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e: DynamicStateObject) => setForm({ ...form, email: e.target.value })}
                    placeholder="name@telecareplus.com"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 pl-10 text-xs text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    value={form.password}
                    onChange={(e: DynamicStateObject) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 pl-10 text-xs text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-teal-400 focus:ring-0"
                  />
                  <span>Keep me signed in</span>
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    pushToast({
                      type: "info",
                      title: "Password Reset",
                      message: "Use demo passwords or contact admin for credential resets."
                    });
                  }}
                  className="text-teal-400 hover:underline"
                >
                  Forgot password?
                </a>
              </div>

              <SubmitButton />
            </form>

            {/* OR CONTINUE WITH Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <span className="relative bg-[#0B1524] px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                OR CONTINUE WITH
              </span>
            </div>

            {/* SSO Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  pushToast({ type: "info", title: "Passkey Auth", message: "WebAuthn / Passkey prompt initialized." });
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-all cursor-pointer"
              >
                <Fingerprint size={15} className="text-teal-400" />
                <span>Passkey</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  pushToast({ type: "info", title: "Hospital SSO", message: "Redirecting to SAML2 / OAuth2 Hospital SSO Provider." });
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-all cursor-pointer"
              >
                <ShieldCheck size={15} className="text-teal-400" />
                <span>Hospital SSO</span>
              </button>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
            By signing in, you agree to TeleCare+ Terms of Service & Privacy Policy.
          </div>
        </div>
      </motion.div>
    </div>
  );
}

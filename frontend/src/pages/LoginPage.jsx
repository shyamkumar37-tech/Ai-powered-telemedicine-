import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useAuth } from "../context/AuthContext";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { API_BASE_URL } from "../services/api";
import { requestOtpLogin } from "../services/authService";
import { getDefaultRouteForRole, normalizeRole } from "../utils/roleUtils";
import { Tabs, Tab } from "../components/ui/Tabs";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "../components/ui/ToastProvider";

function FloatingField({
  id,
  label,
  type = "text",
  value,
  onChange,
  helperText,
  errorText,
  rightAddon,
  inputMode,
  required,
  autoComplete
}) {
  return (
    <label className="tc-floating-field" htmlFor={id}>
      <span className="sr-only">{label}</span>
      <input
        id={id}
        className="tc-floating-input"
        type={type}
        value={value}
        onChange={(e) => {
          try {
            console.log(`[TeleCare+] input change ${id}`, e.target && e.target.value);
          } catch (err) {
            /* ignore */
          }
          onChange && onChange(e);
        }}
        onFocus={(e) => {
          try {
            console.log(`[TeleCare+] input focus ${id}`);
          } catch (err) {}
        }}
        onBlur={(e) => {
          try {
            console.log(`[TeleCare+] input blur ${id}`);
          } catch (err) {}
        }}
        onKeyDown={(e) => {
          try {
            console.log(`[TeleCare+] input keydown ${id}`, e.key);
          } catch (err) {}
        }}
        placeholder=" "
        inputMode={inputMode}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={Boolean(errorText)}
        aria-describedby={helperText || errorText ? `${id}-hint` : undefined}
      />
      <span className="tc-floating-label">{label}</span>
      {rightAddon ? <span className="tc-floating-addon">{rightAddon}</span> : null}
      {helperText || errorText ? (
        <span id={`${id}-hint`} className={errorText ? "tc-field-error" : "tc-field-helper"}>
          {errorText || helperText}
        </span>
      ) : null}
    </label>
  );
}

export default function LoginPage() {
  const { language, t, translateUiText = (value) => value } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const { login, verifyOtpLogin, logout, auth, isAuthenticated, isAuthReady } = useAuth();
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
      const lang = params.get("lang") || (language && language !== "en" ? language : "");
      return lang && lang !== "en" ? `?lang=${lang}` : "";
    } catch {
      return language && language !== "en" ? `?lang=${language}` : "";
    }
  })();
  const [form, setForm] = useState({ email: "", password: "" });
  const [otpForm, setOtpForm] = useState({ phone: "", otp: "" });
  const [mode, setMode] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [otpErrors, setOtpErrors] = useState({ phone: "", otp: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ state: "checking" });
  const hasRedirectedRef = useRef(false);
  const hasForcedLogoutRef = useRef(false);

  useEffect(() => {
    try {
      const expired = sessionStorage.getItem("telecareplus-auth-expired");
      if (expired === "1") {
        sessionStorage.removeItem("telecareplus-auth-expired");
        pushToast({
          type: "error",
          title: translateUiText("Session expired"),
          message: translateUiText("Please sign in again to continue.")
        });
      }
    } catch {
      // Ignore session storage errors.
    }
    // Clear form fields on mount to prevent autofill from persisting after logout
    setForm({ email: "", password: "" });
    setOtpForm({ phone: "", otp: "" });
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
      if (!response.ok) {
        throw new Error("Backend unavailable");
      }
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
      document.title = `TeleCare+ - ${translateUiText("Login")}`;
    }
  }, [translateUiText]);

  const redirectByRole = (authData, { allowForceLogin = false } = {}) => {
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
    if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
      console.log("[TeleCare+] LoginPage redirect check", {
        path: location.pathname + location.search,
        isAuthReady,
        isAuthenticated,
        role: auth?.role ?? null
      });
    }
    if (forceLogin && isAuthenticated && !hasForcedLogoutRef.current) {
      hasForcedLogoutRef.current = true;
      logout();
      return;
    }
    if (isAuthReady && isAuthenticated && auth?.role) {
      redirectByRole(auth);
    }
  }, [auth, forceLogin, isAuthReady, isAuthenticated, location.pathname, location.search]);

  const backendUnavailable = backendStatus.state === "down";
  const backendMessage = translateUiText("Backend service is starting. Please wait a moment and try again.");

  const onPasswordSubmit = async (event) => {
    event.preventDefault();
    if (backendUnavailable) {
      setError(backendMessage);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const authData = await login(form);
      pushToast({
        type: "success",
        title: translateUiText("Login successful"),
        message: translateUiText(`Welcome back, ${authData?.fullName || "TeleCare+ user"}.`)
      });
      redirectByRole(authData, { allowForceLogin: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  const onRequestOtp = async () => {
    if (backendUnavailable) {
      setError(backendMessage);
      return;
    }
    const trimmedPhone = otpForm.phone.trim();
    const digitsOnly = trimmedPhone.replace(/\D/g, "");
    if (!trimmedPhone) {
      setOtpErrors((current) => ({ ...current, phone: t("mobileNumberRequired") }));
      setError("");
      setOtpMessage("");
      return;
    }
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      setOtpErrors((current) => ({ ...current, phone: t("invalidMobileNumber") }));
      setError("");
      setOtpMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setOtpMessage("");
    try {
      const phone = trimmedPhone;
      setOtpErrors({ phone: "", otp: "" });
      const response = await requestOtpLogin({ phone });
      setOtpMessage(response.message);
      setOtpForm((current) => ({
        ...current,
        phone,
        otp: current.otp
      }));
    } catch (err) {
      setError(err.response?.data?.message || t("unableSendOtp"));
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (event) => {
    event.preventDefault();
    if (backendUnavailable) {
      setError(backendMessage);
      return;
    }
    const nextErrors = { phone: "", otp: "" };
    const trimmedPhone = otpForm.phone.trim();
    const digitsOnly = trimmedPhone.replace(/\D/g, "");
    const resolvedOtp = otpForm.otp.trim();

    if (!trimmedPhone) {
      nextErrors.phone = t("mobileNumberRequired");
    } else if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      nextErrors.phone = t("invalidMobileNumber");
    }

    if (!resolvedOtp) {
      nextErrors.otp = t("otpRequired");
    } else if (resolvedOtp.length !== 6) {
      nextErrors.otp = t("otpInvalidLength");
    }

    if (nextErrors.phone || nextErrors.otp) {
      setOtpErrors(nextErrors);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const payload = {
        phone: trimmedPhone,
        otp: resolvedOtp
      };
      setOtpErrors({ phone: "", otp: "" });
      const authData = await verifyOtpLogin(payload);
      pushToast({
        type: "success",
        title: translateUiText("Login successful"),
        message: translateUiText(`Welcome back, ${authData?.fullName || "TeleCare+ user"}.`)
      });
      redirectByRole(authData, { allowForceLogin: true });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || t("otpLoginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-shell__grid">
        <section className="login-visual">
          <div className="login-visual__glow" aria-hidden="true" />
          <div className="login-visual__orb" aria-hidden="true" />
          <div className="login-visual__content">
            <p className="login-visual__eyebrow">{translateUiText("Continuous care, beyond consultations")}</p>
            <h1 className="login-visual__title">{translateUiText("TeleCare+ connected care workspace")}</h1>
            <p className="login-visual__subtitle">
              {translateUiText("Monitor health, manage care plans, and stay connected with your care team — all in one place.")}
            </p>
            <div className="login-visual__mockups">
              <div className="relative min-h-[320px]">
                <div className="login-float login-float--center tc-tilt rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-[0_0_30px_rgba(0,255,200,0.1)] backdrop-blur-xl transition-all duration-200 hover:scale-[1.02]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white/90">{translateUiText("Today's Health Overview")}</p>
                    <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                      {translateUiText("Stable")}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">{translateUiText("Heart Rate")}</p>
                      <p className="mt-2 text-xl font-semibold text-white">78 bpm</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">{translateUiText("BP")}</p>
                      <p className="mt-2 text-xl font-semibold text-white">120/80</p>
                    </div>
                  </div>
                </div>

                <div className="login-float login-float--delay-1 tc-tilt absolute right-0 top-6 w-[220px] -rotate-2 rounded-xl border border-white/10 bg-white/5 p-4 shadow-[0_0_30px_rgba(0,255,200,0.1)] backdrop-blur-xl transition-all duration-200 hover:scale-[1.02]">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">{translateUiText("Next Appointment")}</p>
                  <p className="mt-2 text-base font-semibold text-white">{translateUiText("Dr. Sharma")}</p>
                  <p className="text-sm text-white/70">{translateUiText("Today 4:30 PM")}</p>
                </div>

                <div className="login-float login-float--delay-2 tc-tilt absolute bottom-[-12px] left-0 w-[220px] rounded-xl border border-white/10 bg-white/5 p-4 shadow-[0_0_30px_rgba(0,255,200,0.1)] backdrop-blur-xl transition-all duration-200 hover:scale-[1.02]">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">{translateUiText("Medication Adherence")}</p>
                  <p className="mt-2 text-base font-semibold text-white">85% {translateUiText("completed")}</p>
                  <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 w-[85%] rounded-full bg-emerald-400" />
                  </div>
                </div>

                <div className="login-float login-float--delay-3 tc-tilt absolute bottom-8 right-10 w-[200px] rounded-xl border border-rose-400/30 bg-white/5 p-4 shadow-[0_0_30px_rgba(248,113,113,0.18)] backdrop-blur-xl transition-all duration-200 hover:scale-[1.02]">
                  <p className="text-xs uppercase tracking-[0.2em] text-rose-200">{translateUiText("Alert")}</p>
                  <p className="mt-2 text-base font-semibold text-white">{translateUiText("High BP detected")}</p>
                  <span className="mt-2 inline-flex rounded-full bg-rose-500/20 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-rose-200">
                    {translateUiText("Critical")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="login-panel glass-card login-card">
          <div className="login-panel__header">
            <div>
              <p className="login-panel__brand">{t("appName")}</p>
              <h2 className="login-panel__title">{t("secureSignIn")}</h2>
              <p className="login-panel__subtitle">{translateUiText("Secure login - Privacy-first - AI-assisted care")}</p>
            </div>
            <LanguageSwitcher />
          </div>

          <div className="login-panel__badges">
            {[translateUiText("Secure login"), translateUiText("Privacy protected"), translateUiText("Low bandwidth optimized")].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>

          <Tabs>
            <Tab
              active={mode === "password"}
              aria-label={t("emailLogin")}
              data-voice-label={t("emailLogin")}
              onClick={() => {
                setMode("password");
                setError("");
              }}
            >
              {t("emailLogin")}
            </Tab>
            <Tab
              active={mode === "otp"}
              aria-label={t("mobileOtp")}
              data-voice-label={t("mobileOtp")}
              onClick={() => {
                setMode("otp");
                setError("");
              }}
            >
              {t("mobileOtp")}
            </Tab>
          </Tabs>

          {backendUnavailable ? (
            <div className="login-status" role="status" aria-live="polite">
              <p>{backendMessage}</p>
              <button
                type="button"
                className="btn-secondary mt-3"
                onClick={checkBackend}
                aria-label={translateUiText("Retry connection")}
                data-voice-label={translateUiText("Retry connection")}
                disabled={backendStatus.state === "checking"}
              >
                {backendStatus.state === "checking" ? translateUiText("Checking...") : translateUiText("Retry connection")}
              </button>
            </div>
          ) : null}

          {mode === "password" ? (
            <form className="space-y-5" onSubmit={onPasswordSubmit}>
              <FloatingField
                id="login-email"
                label={t("email")}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                helperText={translateUiText("Use the email you registered with TeleCare+.")}
                required
                autoComplete="off"
              />
              <FloatingField
                id="login-password"
                label={t("password")}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                helperText={translateUiText("Use the password created during registration.")}
                required
                autoComplete="current-password"
                rightAddon={(
                  <button
                    type="button"
                    className="login-icon-btn"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? translateUiText("Hide password") : translateUiText("Show password")}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              />
              {error ? <p className="login-error" role="alert">{error}</p> : null}
              <button
                className="btn-primary login-submit"
                disabled={loading || backendUnavailable}
                aria-label={loading ? t("signingIn") : t("login")}
                data-voice-label={loading ? t("signingIn") : t("login")}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? t("signingIn") : t("login")}
              </button>
              <p className="text-center text-xs text-slate-500">
                {translateUiText("Trouble signing in?")}{" "}
                <Link className="font-semibold text-clinic hover:underline" to={`/support${languageSearch}`}>
                  {translateUiText("Get help")}
                </Link>
                {" • "}
                <Link
                  className="font-semibold text-clinic hover:underline"
                  to={`/support${languageSearch ? `${languageSearch}&topic=password-reset` : "?topic=password-reset"}`}
                >
                  {translateUiText("Forgot Password")}
                </Link>
              </p>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={onOtpSubmit}>
              <FloatingField
                id="login-phone"
                label={t("mobileNumber")}
                value={otpForm.phone}
                onChange={(e) => {
                  setOtpForm({ ...otpForm, phone: e.target.value });
                  setOtpErrors((current) => ({ ...current, phone: "" }));
                  setError("");
                }}
                helperText={translateUiText("Enter the mobile number linked to your TeleCare+ account.")}
                errorText={otpErrors.phone}
                required
                inputMode="tel"
                autoComplete="tel"
              />
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <FloatingField
                  id="login-otp"
                  label={t("otp")}
                  value={otpForm.otp}
                  onChange={(e) => {
                    setOtpForm({ ...otpForm, otp: e.target.value });
                    setOtpErrors((current) => ({ ...current, otp: "" }));
                    setError("");
                  }}
                  helperText={translateUiText("Enter the 6-digit code sent to your phone.")}
                  errorText={otpErrors.otp}
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <button
                  type="button"
                  className="btn-secondary login-otp-btn"
                  disabled={loading || backendUnavailable}
                  onClick={onRequestOtp}
                  aria-label={loading ? t("sending") : t("sendOtp")}
                  data-voice-label={loading ? t("sending") : t("sendOtp")}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loading ? t("sending") : t("sendOtp")}
                </button>
              </div>
              {otpMessage ? <p className="login-success" role="status" aria-live="polite">{otpMessage}</p> : null}
              {error ? <p className="login-error" role="alert">{error}</p> : null}
              <button
                className="btn-primary login-submit"
                disabled={loading || backendUnavailable}
                aria-label={loading ? t("verifying") : t("loginWithOtp")}
                data-voice-label={loading ? t("verifying") : t("loginWithOtp")}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? t("verifying") : t("loginWithOtp")}
              </button>
            </form>
          )}
          <p className="login-footer">{t("newHere")} <Link className="login-footer__link" to={`/register${languageSearch}`}>{t("createAccount")}</Link></p>
        </section>
      </div>
    </div>
  );
}

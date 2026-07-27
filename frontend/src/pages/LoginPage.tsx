import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useAuth } from "../context/AuthContext";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { API_BASE_URL } from "../services/api";
import { requestOtpLogin } from "../services/authService";
import { getDefaultRouteForRole, normalizeRole } from "../utils/roleUtils";
import { Loader2 } from "lucide-react";
import { useToast } from "../components/ui/ToastProvider";
import { motion } from "framer-motion";
import "./login-override.css";
import { DynamicStateObject, DynamicState } from "./../types/DynamicState";

export default function LoginPage() {
  const { language, t, translateUiText = (value: string | number) => value } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
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

  const [form, setForm] = useState<DynamicState>({ email: "", password: "" });
  const [otpForm, setOtpForm] = useState<DynamicState>({ phone: "", otp: "" });
  const [mode, setMode] = useState<DynamicState>("password");
  const [otpMessage, setOtpMessage] = useState<DynamicState>("");
  const [otpErrors, setOtpErrors] = useState<DynamicState>({ phone: "", otp: "" });
  const [error, setError] = useState<DynamicState>("");
  const [loading, setLoading] = useState<DynamicState>(false);
  const [backendStatus, setBackendStatus] = useState<DynamicState>({ state: "checking" });
  const hasRedirectedRef = useRef<DynamicState>(false);
  const hasForcedLogoutRef = useRef<DynamicState>(false);

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
    } catch {}
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
      document.title = `TeleCare+ — Secure sign in`;
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

  const backendUnavailable = backendStatus.state === "down";
  const backendMessage = "Backend service is starting. Please wait a moment and try again.";

  const onPasswordSubmit = async (event: DynamicStateObject) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const authData = await login(form);
      pushToast({
        type: "success",
        title: "Login successful",
        message: `Welcome back, ${authData?.fullName || "TeleCare+ user"}.`
      });
      redirectByRole(authData, { allowForceLogin: true });
    } catch (err: DynamicStateObject) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onRequestOtp = async () => {
    const trimmedPhone = otpForm.phone.trim();
    const digitsOnly = trimmedPhone.replace(/\D/g, "");
    if (!trimmedPhone) {
      setOtpErrors((current: DynamicStateObject) => ({ ...current, phone: "Mobile number is required" }));
      setError("");
      setOtpMessage("");
      return;
    }
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      setOtpErrors((current: DynamicStateObject) => ({ ...current, phone: "Invalid mobile number" }));
      setError("");
      setOtpMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setOtpMessage("");
    try {
      const response = await requestOtpLogin({ phone: trimmedPhone });
      setOtpMessage(response.message);
      setOtpErrors({ phone: "", otp: "" });
      setOtpForm((current: DynamicStateObject) => ({ ...current, phone: trimmedPhone }));
    } catch (err: DynamicStateObject) {
      setError(err.response?.data?.message || "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (event: DynamicStateObject) => {
    event.preventDefault();
    const nextErrors = { phone: "", otp: "" };
    const trimmedPhone = otpForm.phone.trim();
    const digitsOnly = trimmedPhone.replace(/\D/g, "");
    const resolvedOtp = otpForm.otp.trim();

    if (!trimmedPhone) nextErrors.phone = "Mobile number is required";
    else if (digitsOnly.length < 10 || digitsOnly.length > 15) nextErrors.phone = "Invalid mobile number";

    if (!resolvedOtp) nextErrors.otp = "OTP is required";
    else if (resolvedOtp.length !== 6) nextErrors.otp = "OTP must be 6 digits";

    if (nextErrors.phone || nextErrors.otp) {
      setOtpErrors(nextErrors);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const authData = await verifyOtpLogin({ phone: trimmedPhone, otp: resolvedOtp });
      pushToast({
        type: "success",
        title: "Login successful",
        message: `Welcome back, ${authData?.fullName || "TeleCare+ user"}.`
      });
      redirectByRole(authData, { allowForceLogin: true });
    } catch (err: DynamicStateObject) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || "OTP login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="tcl-root" className="login-wrapper">
      <motion.div className="stage" initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}>
        
        <div className="brand">
          <div className="eyebrow">{t("continuousCareBeyondConsultations") || "Continuous care, beyond consultations"}</div>
          <h1 className="serif">TeleCare+ connected<br/><em>care</em> workspace</h1>
          <p className="lede">Monitor vitals, manage care plans, and stay connected with your care team — all in one place.</p>

          <div className="overview-label">{t("todaySOverview") || "Today's overview"}</div>
          <div className="grid">
            <div className="card">
              <div className="label"><span className="dot"></span>{t("heartRate") || "Heart rate"}</div>
              <div className="value mono">78<span style={{fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400}}> bpm</span></div>
              <div className="sub">{t("restingWithinRange") || "Resting, within range"}</div>
            </div>
            <div className="card">
              <div className="label"><span className="dot brass"></span>{t("bloodPressure") || "Blood pressure"}</div>
              <div className="value mono">128<span style={{fontSize: '14px', color: 'var(--text-muted)'}}>/82</span></div>
              <div className="sub">{t("slightlyElevated") || "Slightly elevated"}</div>
            </div>

            <div className="card appt wide">
              <div className="label">{t("nextAppointment") || "Next appointment"}</div>
              <div className="value serif">{t("drSharma") || "Dr. Sharma"}</div>
              <div className="sub mono">Today · 4:30 PM</div>
            </div>

            <div className="card alert wide">
              <div className="label"><span className="dot coral"></span>{t("alert") || "Alert"}</div>
              <div className="value" style={{fontSize: '16px'}}>{t("highBloodPressureDetected") || "High blood pressure detected"}</div>
              <span className="badge">{t("critical") || "Critical"}</span>
            </div>

            <div className="card wide">
              <div className="label">{t("medicationAdherence") || "Medication adherence"}</div>
              <div className="value mono">85<span style={{fontSize: '14px', color: 'var(--text-muted)'}}>%</span> <span style={{fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 400}}>completed this week</span></div>
              <div className="bar-track"><div className="bar-fill"></div></div>
            </div>
          </div>

          <div className="pulse-strip">
            <svg width="150" height="28" viewBox="0 0 150 28">
              <polyline points="0,14 22,14 30,4 38,24 46,14 60,14 68,8 74,20 80,14 150,14"
                fill="none" stroke="#4FB3A0" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"
                strokeDasharray="220" strokeDashoffset="220">
                <animate attributeName="stroke-dashoffset" from="220" to="0" dur="1.8s" repeatCount="indefinite"/>
              </polyline>
            </svg>
            <div className="ptext">{t("liveSyncWith") || "Live sync with"}<b>{t("appleHealth") || "Apple Health"}</b> · last updated 2 min ago</div>
          </div>
        </div>

        <div className="seam">
          <svg width="28" height="140" viewBox="0 0 28 140">
            <polyline points="0,70 6,70 9,50 12,90 15,70 19,70 22,58 25,80 28,70"
              fill="none" stroke="#C9A24B" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" opacity="0.55"/>
          </svg>
        </div>

        <div className="signin">
          <div className="signin-top">
            <div className="wordmark">{t("tELECARE") || "TELECARE"}<span>+</span></div>
            <LanguageSwitcher customClass="lang" hideLabel />
          </div>

          <h2 className="serif">{(t("secureSignIn") || "Secure sign in")}</h2>
          <p className="sub">{(t("privacyFirstAIAssistedCareBuiltForHowYouActuallyManageYourHealth") || "Privacy-first, AI-assisted care — built for how you actually manage your health.")}</p>

          <div className="trust-row">
            <span className="trust"><span className="dot"></span>{(t("encryptedEndToEnd") || "Encrypted end to end")}</span>
            <span className="trust"><span className="dot"></span>{(t("hIPAAAligned") || "HIPAA aligned")}</span>
            <span className="trust"><span className="dot"></span>{(t("lowBandwidthOptimized") || "Low-bandwidth optimized")}</span>
          </div>

          {mode !== "forgot" && (
            <div className="tabs">
              <button className={mode === "password" ? "active" : ""} onClick={() => { setMode("password"); setError(""); setOtpMessage(""); }}>{(t("emailLogin") || "Email login")}</button>
              <button className={mode === "otp" ? "active" : ""} onClick={() => { setMode("otp"); setError(""); }}>{(t("mobileOTP") || "Mobile OTP")}</button>
            </div>
          )}

          {backendUnavailable && (
            <div className="error-banner" role="alert">
              <p>{backendMessage}</p>
              <button
                type="button"
                style={{ marginTop: '8px', textDecoration: 'underline' }}
                onClick={checkBackend}
                disabled={backendStatus.state === "checking"}
              >
                {backendStatus.state === "checking" ? "Checking..." : "Retry connection"}
              </button>
            </div>
          )}

          {error && <div className="error-banner" role="alert">{error}</div>}
          {otpMessage && <div className="otp-message">{otpMessage}</div>}

          {mode === "forgot" ? (
            <form onSubmit={(e: DynamicStateObject) => {
              e.preventDefault();
              setLoading(true);
              setTimeout(() => {
                setLoading(false);
                pushToast({
                  type: "success",
                  title: (t("resetLinkSent") || "Reset Link Sent"),
                  message: (t("ifAnAccountExistsWithThisEmailYouWillReceiveAPasswordResetLinkShortly") || "If an account exists with this email, you will receive a password reset link shortly.")
                });
                setMode("password");
              }, 1200);
            }} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <div className="field">
                <label className="field-label">{(t("email") || "Email")}</label>
                <input type="email" placeholder={(t("enterYourEmail") || "Enter your email")} required
                  value={form.email} onChange={(e: DynamicStateObject) => setForm({ ...form, email: e.target.value })} />
                <div className="hint">{(t("weWillSendAPasswordResetLinkToThisEmailAddress") || "We will send a password reset link to this email address.")}</div>
              </div>
              <button type="submit" className="signin-btn" disabled={loading}>
                {loading && <Loader2 className="animate-spin" size={16} />}
                {loading ? (t("sending") || "Sending...") : (t("sendResetLink") || "Send Reset Link")}
              </button>
              <button type="button" onClick={() => setMode("password")} style={{marginTop: '16px', background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', alignSelf: 'center'}}>
                {(t("backToLogin") || "Back to login")}
              </button>
            </form>
          ) : mode === "password" ? (
            <form onSubmit={onPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <div className="field">
                <label className="field-label">{(t("email") || "Email")}</label>
                <input type="email" placeholder={(t("enterYourEmail") || "Enter your email")} required
                  value={form.email} onChange={(e: DynamicStateObject) => setForm({ ...form, email: e.target.value })} />
                <div className="hint">{(t("useTheEmailYouRegisteredWithTeleCare") || "Use the email you registered with TeleCare+.")}</div>
              </div>

              <div className="field">
                <label className="field-label">{(t("password") || "Password")}</label>
                <input type="password" placeholder="••••••••••" required
                  value={form.password} onChange={(e: DynamicStateObject) => setForm({ ...form, password: e.target.value })} />
                <div className="hint">{(t("useThePasswordCreatedDuringRegistration") || "Use the password created during registration.")}</div>
              </div>

              <button type="submit" className="signin-btn" disabled={loading}>
                {loading && <Loader2 className="animate-spin" size={16} />}
                {loading ? (t("signingIn") || "Signing in...") : (t("signIn") || "Sign in")}
              </button>
            </form>
          ) : (
            <form onSubmit={onOtpSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <div className="field">
                <label className="field-label">{(t("mobileNumber") || "Mobile Number")}</label>
                <input type="tel" placeholder="+1 (555) 000-0000"
                  value={otpForm.phone} onChange={(e: DynamicStateObject) => setOtpForm({ ...otpForm, phone: e.target.value })} />
                {otpErrors.phone ? <div className="hint" style={{ color: 'var(--coral)' }}>{translateUiText(otpErrors.phone)}</div> : <div className="hint">{(t("enterThePhoneNumberLinkedToYourAccount") || "Enter the phone number linked to your account.")}</div>}
              </div>

              {otpMessage && (
                <div className="field">
                  <label className="field-label">{(t("oneTimePassword") || "One-Time Password")}</label>
                  <input type="text" placeholder="123456" maxLength={6}
                    value={otpForm.otp} onChange={(e: DynamicStateObject) => setOtpForm({ ...otpForm, otp: e.target.value })} />
                  {otpErrors.otp ? <div className="hint" style={{ color: 'var(--coral)' }}>{translateUiText(otpErrors.otp)}</div> : <div className="hint">{(t("enterThe6DigitCodeSentToYourPhone") || "Enter the 6-digit code sent to your phone.")}</div>}
                </div>
              )}

              {otpMessage ? (
                <button type="submit" className="signin-btn" disabled={loading}>
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  {loading ? (t("verifying") || "Verifying...") : (t("signIn") || "Sign in")}
                </button>
              ) : (
                <button type="button" className="signin-btn" onClick={onRequestOtp} disabled={loading}>
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  {loading ? (t("sending") || "Sending...") : (t("sendOTP") || "Send OTP")}
                </button>
              )}
            </form>
          )}

          {mode !== "forgot" && (
            <div className="foot-links">
              <span>{(t("troubleSigningIn") || "Trouble signing in?")} <Link to="/support">{(t("getHelp") || "Get help")}</Link></span>
              <a href="#" onClick={(e: DynamicStateObject) => { e.preventDefault(); setMode("forgot"); setError(""); }}>{(t("forgotPassword") || "Forgot password")}</a>
            </div>
          )}

          <div className="create-acct">
            {(t("newHere") || "New here?")} <Link to="/register">{(t("createAnAccount") || "Create an account")}</Link>
          </div>
        </div>

      </motion.div>
    </main>
  );
}

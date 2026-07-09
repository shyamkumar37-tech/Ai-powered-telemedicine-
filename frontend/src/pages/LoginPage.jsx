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
import "./login-override.css";

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
        title: "Login successful",
        message: `Welcome back, ${authData?.fullName || "TeleCare+ user"}.`
      });
      redirectByRole(authData, { allowForceLogin: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
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
      setOtpErrors((current) => ({ ...current, phone: "Mobile number is required" }));
      setError("");
      setOtpMessage("");
      return;
    }
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      setOtpErrors((current) => ({ ...current, phone: "Invalid mobile number" }));
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
      setOtpForm((current) => ({ ...current, phone: trimmedPhone }));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send OTP");
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
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || "OTP login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="tcl-root" className="login-wrapper">
      <div className="stage">
        
        <div className="brand">
          <div className="eyebrow">Continuous care, beyond consultations</div>
          <h1 className="serif">TeleCare+ connected<br/><em>care</em> workspace</h1>
          <p className="lede">Monitor vitals, manage care plans, and stay connected with your care team — all in one place.</p>

          <div className="overview-label">Today's overview</div>
          <div className="grid">
            <div className="card">
              <div className="label"><span className="dot"></span>Heart rate</div>
              <div className="value mono">78<span style={{fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400}}> bpm</span></div>
              <div className="sub">Resting, within range</div>
            </div>
            <div className="card">
              <div className="label"><span className="dot brass"></span>Blood pressure</div>
              <div className="value mono">128<span style={{fontSize: '14px', color: 'var(--text-muted)'}}>/82</span></div>
              <div className="sub">Slightly elevated</div>
            </div>

            <div className="card appt wide">
              <div className="label">Next appointment</div>
              <div className="value serif">Dr. Sharma</div>
              <div className="sub mono">Today · 4:30 PM</div>
            </div>

            <div className="card alert wide">
              <div className="label"><span className="dot coral"></span>Alert</div>
              <div className="value" style={{fontSize: '16px'}}>High blood pressure detected</div>
              <span className="badge">Critical</span>
            </div>

            <div className="card wide">
              <div className="label">Medication adherence</div>
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
            <div className="ptext">Live sync with <b>Apple Health</b> · last updated 2 min ago</div>
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
            <div className="wordmark">TELECARE<span>+</span></div>
            <LanguageSwitcher customClass="lang" hideLabel />
          </div>

          <h2 className="serif">Secure sign in</h2>
          <p className="sub">Privacy-first, AI-assisted care — built for how you actually manage your health.</p>

          <div className="trust-row">
            <span className="trust"><span className="dot"></span>Encrypted end to end</span>
            <span className="trust"><span className="dot"></span>HIPAA aligned</span>
            <span className="trust"><span className="dot"></span>Low-bandwidth optimized</span>
          </div>

          <div className="tabs">
            <button className={mode === "password" ? "active" : ""} onClick={() => { setMode("password"); setError(""); setOtpMessage(""); }}>Email login</button>
            <button className={mode === "otp" ? "active" : ""} onClick={() => { setMode("otp"); setError(""); }}>Mobile OTP</button>
          </div>

          {backendUnavailable && (
            <div className="error-banner">
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

          {error && <div className="error-banner">{error}</div>}
          {otpMessage && <div className="otp-message">{otpMessage}</div>}

          {mode === "password" ? (
            <form onSubmit={onPasswordSubmit} style={{ display: 'contents' }}>
              <div className="field">
                <label className="field-label">Email</label>
                <input type="email" placeholder="Enter your email" required
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <div className="hint">Use the email you registered with TeleCare+.</div>
              </div>

              <div className="field">
                <label className="field-label">Password</label>
                <input type="password" placeholder="••••••••••" required
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <div className="hint">Use the password created during registration.</div>
              </div>

              <button type="submit" className="signin-btn" disabled={loading}>
                {loading && <Loader2 className="animate-spin" size={16} />}
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={onOtpSubmit} style={{ display: 'contents' }}>
              <div className="field">
                <label className="field-label">Mobile Number</label>
                <input type="tel" placeholder="+1 (555) 000-0000"
                  value={otpForm.phone} onChange={(e) => setOtpForm({ ...otpForm, phone: e.target.value })} />
                {otpErrors.phone ? <div className="hint" style={{ color: 'var(--coral)' }}>{otpErrors.phone}</div> : <div className="hint">Enter the phone number linked to your account.</div>}
              </div>

              {otpMessage && (
                <div className="field">
                  <label className="field-label">One-Time Password</label>
                  <input type="text" placeholder="123456" maxLength={6}
                    value={otpForm.otp} onChange={(e) => setOtpForm({ ...otpForm, otp: e.target.value })} />
                  {otpErrors.otp ? <div className="hint" style={{ color: 'var(--coral)' }}>{otpErrors.otp}</div> : <div className="hint">Enter the 6-digit code sent to your phone.</div>}
                </div>
              )}

              {otpMessage ? (
                <button type="submit" className="signin-btn" disabled={loading}>
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  {loading ? "Verifying..." : "Sign in"}
                </button>
              ) : (
                <button type="button" className="signin-btn" onClick={onRequestOtp} disabled={loading}>
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              )}
            </form>
          )}

          <div className="foot-links">
            <span>Trouble signing in? <a href="#">Get help</a></span>
            <a href="#">Forgot password</a>
          </div>

          <div className="create-acct">
            New here? <Link to="/register">Create an account</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

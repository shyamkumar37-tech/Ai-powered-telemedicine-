import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InstallAppButton from "../components/InstallAppButton";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";
import PageContainer from "../components/ui/PageContainer";

export default function LandingPage() {
  const { language, t, translateUiText = (value) => value } = useLanguage();
  const navigate = useNavigate();
  const languageSearch = language && language !== "en" ? `?lang=${language}` : "";
  const loginSearchParams = new URLSearchParams(language && language !== "en" ? { lang: language } : {});
  loginSearchParams.set("forceLogin", "1");
  const loginSearch = loginSearchParams.toString();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    try {
      return localStorage.getItem("telecareplus-theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = `TeleCare+ - ${translateUiText("Home")}`;
    }
  }, [translateUiText]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.classList.toggle("telecare-dark", darkMode);
    try {
      localStorage.setItem("telecareplus-theme", darkMode ? "dark" : "light");
    } catch {
      // Ignore storage failures.
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((current) => !current);
  };

  const trustPills = useMemo(() => ([
    translateUiText("AI-powered triage"),
    translateUiText("Low bandwidth ready"),
    translateUiText("Care continuity"),
    translateUiText("Caregiver connected")
  ]), [translateUiText]);

  const careJourney = useMemo(() => ([
    translateUiText("Patient reports symptoms"),
    translateUiText("AI triage evaluates urgency"),
    translateUiText("Doctor reviews case"),
    translateUiText("Prescription confirmed"),
    translateUiText("Reminders scheduled"),
    translateUiText("Caregiver monitors adherence")
  ]), [translateUiText]);

  const platformStats = useMemo(() => ([
    { value: "24,800+", label: translateUiText("Patients monitored") },
    { value: "1,240", label: translateUiText("Active consultations") },
    { value: "91%", label: translateUiText("Recovery adherence") },
    { value: "148", label: translateUiText("Connected hospitals") }
  ]), [translateUiText]);

  const showcaseFeatures = useMemo(() => ([
    {
      title: translateUiText("AI Symptom Analysis"),
      text: translateUiText("Risk-aware intake routes urgent cases to the right clinician faster.")
    },
    {
      title: translateUiText("Remote Monitoring"),
      text: translateUiText("Vitals, alerts, and recovery signals stay visible between visits.")
    },
    {
      title: translateUiText("Medication Tracking"),
      text: translateUiText("Dose adherence, missed reminders, and pharmacy status stay connected.")
    },
    {
      title: translateUiText("Family Care Dashboard"),
      text: translateUiText("Caregivers get supportive context without overwhelming the patient.")
    },
    {
      title: translateUiText("Accessibility Tools"),
      text: translateUiText("Voice, contrast, reading, and text controls are available everywhere.")
    }
  ]), [translateUiText]);

  return (
    <div className="landing-shell min-h-screen">
      <div className="landing-header">
        <PageContainer className="px-4 md:px-8">
          <header className="landing-top flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="landing-logo">
                <svg viewBox="0 0 56 56" aria-hidden="true">
                  <path
                    d="M28 6c6.7 0 12.8 2.8 17.2 7.2A24 24 0 0 1 52 30c0 6.7-2.8 12.8-7.2 17.2A24 24 0 0 1 28 54c-6.7 0-12.8-2.8-17.2-7.2A24 24 0 0 1 4 30c0-6.7 2.8-12.8 7.2-17.2A24 24 0 0 1 28 6z"
                    fill="url(#telecareLogoGradient)"
                  />
                  <path
                    d="M16 31h7.2l3.1 6.8L32.8 22l3.4 9H40"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient id="telecareLogoGradient" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#0f766e" />
                      <stop offset="100%" stopColor="#0ea5a5" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-500">{translateUiText("TeleCare+")}</p>
                <p className="text-lg font-semibold text-ink">{translateUiText("Connected Care Platform")}</p>
                <p className="text-xs text-slate-500">{translateUiText("From first symptom to daily recovery support")}</p>
              </div>
            </div>
            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
              <a className="landing-link" href="#journey">{translateUiText("Care journey")}</a>
              <a className="landing-link" href="#roles">{translateUiText("Roles")}</a>
              <a className="landing-link" href="#accessibility">{translateUiText("Accessibility")}</a>
              <a className="landing-link" href="#footer">{translateUiText("Contact")}</a>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="landing-toggle"
                onClick={toggleTheme}
                aria-label={translateUiText("Toggle theme")}
              >
                {darkMode ? translateUiText("Dark Mode") : translateUiText("Light Mode")}
              </button>
              <LanguageSwitcher />
              <div className="hidden items-center gap-2 md:flex">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => navigate(`/login${loginSearch ? `?${loginSearch}` : ""}`)}
                  aria-label={t("login")}
                  data-voice-label={t("login")}
                >
                  {t("login")}
                </button>
                <Link className="btn-primary" to={`/register${languageSearch}`}>{t("createAccount")}</Link>
              </div>
            </div>
          </header>
        </PageContainer>
      </div>

      <PageContainer className="px-4 md:px-8 pb-16 pt-12">
        <section className="landing-hero relative overflow-hidden rounded-[2.5rem] px-8 py-12 text-white shadow-panel">
          <div className="landing-hero__glow landing-hero__glow--left" aria-hidden="true" />
          <div className="landing-hero__glow landing-hero__glow--right" aria-hidden="true" />
          <div className="landing-hero__grid">
            <div className="landing-hero__copy">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-teal-100/90">
                {trustPills.map((label) => (
                  <span key={label} className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                    {label}
                  </span>
                ))}
              </div>
              <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">
                <span className="landing-hero__title">{t("heroTitle")}</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-200/90">{t("heroText")}</p>
              <p className="mt-4 text-sm text-teal-100/80">
                {translateUiText("Built for rural clinics, chronic care, and family-supported recovery")}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  className="btn-primary shadow-lg shadow-teal-900/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-900/40 focus-visible:-translate-y-0.5"
                  to={`/register${languageSearch}`}
                  aria-label={t("createAccount")}
                  data-voice-label={t("createAccount")}
                >
                  {t("createAccount")}
                </Link>
                <Link
                  className="btn-outline border-white/50 text-white hover:border-white hover:bg-white/10"
                  to={`/login${loginSearch ? `?${loginSearch}` : ""}`}
                  aria-label={t("login")}
                  data-voice-label={t("login")}
                >
                  {t("login")}
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold text-teal-100/90">
                {[
                  translateUiText("4 care roles connected"),
                  translateUiText("6 languages supported"),
                  translateUiText("Accessibility built in"),
                  translateUiText("Low bandwidth ready")
                ].map((item) => (
                  <span key={item} className="hero-proof-chip">{item}</span>
                ))}
              </div>
            </div>

            <div className="landing-hero__stack">
              <div className="hero-card hero-card--patient">
                <p className="text-xs text-slate-500">{translateUiText("Patient app")}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{translateUiText("Symptom check-in")}</p>
                <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                  <div className="h-2 w-2/3 rounded-full bg-emerald-400" />
                </div>
              </div>
              <div className="hero-card hero-card--doctor">
                <p className="text-xs text-slate-500">{translateUiText("Doctor dashboard")}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{translateUiText("Triage queue")}</p>
                <div className="mt-3 grid gap-2 text-xs text-slate-500">
                  <span className="hero-line">{translateUiText("Urgent cases")} - 4</span>
                  <span className="hero-line">{translateUiText("Follow-ups")} - 8</span>
                </div>
              </div>
              <div className="hero-card hero-card--caregiver">
                <p className="text-xs text-slate-500">{translateUiText("Caregiver reminders")}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{translateUiText("Adherence status")}</p>
                <div className="mt-3 flex gap-2">
                  <span className="status-pill status-pill--good" />
                  <span className="status-pill status-pill--warn" />
                  <span className="status-pill status-pill--alert" />
                </div>
              </div>
              <div className="hero-card hero-card--pharmacy">
                <p className="text-xs text-slate-500">{translateUiText("Pharmacist panel")}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{translateUiText("Prescription review")}</p>
                <div className="mt-3 h-8 rounded-xl bg-slate-100" />
              </div>
            </div>
          </div>
        </section>

        <section className="landing-stats-grid mt-8" aria-label={translateUiText("Platform statistics")}>
          {platformStats.map((item) => (
            <div key={item.label} className="premium-card landing-stat-card">
              <p className="landing-stat-card__value">{item.value}</p>
              <p className="landing-stat-card__label">{item.label}</p>
            </div>
          ))}
        </section>

        <section className="landing-workflow mt-16 landing-reveal">
          <div className="landing-section-heading">
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-200">{translateUiText("Command center")}</p>
            <h2>{translateUiText("Live patient monitoring, clinical action, and family support in one workspace")}</h2>
          </div>
          <div className="landing-workflow__grid">
            <div className="premium-card monitoring-preview">
              <div className="monitoring-preview__header">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">{translateUiText("Live monitoring")}</p>
                  <h3>{translateUiText("Anita Patient")}</h3>
                </div>
                <span>{translateUiText("Stable")}</span>
              </div>
              <div className="heartbeat-line" aria-hidden="true" />
              <div className="monitoring-preview__metrics">
                <div><strong>78</strong><span>{translateUiText("Heart Rate")}</span></div>
                <div><strong>120/80</strong><span>{translateUiText("Blood Pressure")}</span></div>
                <div><strong>96%</strong><span>{translateUiText("Recovery")}</span></div>
              </div>
            </div>
            <div className="landing-feature-showcase">
              {showcaseFeatures.map((feature) => (
                <article key={feature.title} className="premium-card feature-showcase-card">
                  <span className="feature-showcase-card__mark" aria-hidden="true" />
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="journey" className="mt-16 landing-reveal">
          <div className="journey-shell">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-clinic">{translateUiText("Care journey")}</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink md:text-3xl">
                {translateUiText("A connected flow from first symptom to daily recovery")}
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-600">
                {translateUiText("TeleCare+ keeps patient updates, clinical review, pharmacy checks, and caregiver follow-up in one timeline.")}
              </p>
            </div>
            <div className="journey-row">
              {careJourney.map((step, index) => (
                <div key={step} className="journey-step">
                  <span className="journey-index">{index + 1}</span>
                  <p className="text-sm font-medium text-ink">{step}</p>
                  {index < careJourney.length - 1 ? <span className="journey-arrow" aria-hidden="true">-&gt;</span> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-testimonials mt-16 landing-reveal" aria-label={translateUiText("Care team outcomes")}>
          {[
            {
              quote: translateUiText("TeleCare+ helped our nurses prioritize risk while keeping family members informed."),
              name: translateUiText("Dr. Meera Shah"),
              role: translateUiText("Clinical Director")
            },
            {
              quote: translateUiText("The recovery dashboard made daily medicines and follow-ups feel manageable."),
              name: translateUiText("Anita R."),
              role: translateUiText("Patient")
            },
            {
              quote: translateUiText("We cut missed follow-ups because the care timeline is visible to everyone."),
              name: translateUiText("Rural Care Network"),
              role: translateUiText("Partner hospital")
            }
          ].map((item) => (
            <figure key={item.name} className="premium-card testimonial-card">
              <blockquote>{item.quote}</blockquote>
              <figcaption>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </figcaption>
            </figure>
          ))}
        </section>

        <section id="roles" className="mt-16 landing-reveal">
          <div className="roles-grid">
            {[
              {
                title: translateUiText("Patient"),
                text: translateUiText("Symptom check-ins, reminders, and progress snapshots."),
                accent: "role-card--patient",
                cta: translateUiText("Create patient workspace"),
                icon: (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 4a4 4 0 0 1 4 4c0 2.2-1.8 4-4 4s-4-1.8-4-4a4 4 0 0 1 4-4Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M4 20c2.5-4 6-6 8-6s5.5 2 8 6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                )
              },
              {
                title: translateUiText("Doctor"),
                text: translateUiText("Triage dashboards, review tools, and care planning."),
                accent: "role-card--doctor",
                cta: translateUiText("Create doctor workspace"),
                icon: (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 12h12M12 6v12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M8 3h8a3 3 0 0 1 3 3v4a7 7 0 0 1-7 7H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                )
              },
              {
                title: translateUiText("Caregiver"),
                text: translateUiText("Adherence alerts and supportive follow-up guidance."),
                accent: "role-card--caregiver",
                cta: translateUiText("Create caregiver workspace"),
                icon: (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21c-5-4-8-7-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 4-3 7-8 11Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                )
              },
              {
                title: translateUiText("Pharmacist"),
                text: translateUiText("Prescription confirmation and medication safety checks."),
                accent: "role-card--pharmacy",
                cta: translateUiText("Create pharmacy workspace"),
                icon: (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 7h14v12H5z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M8 7V5h8v2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M12 11v4M10 13h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                )
              }
            ].map(({ title, text, accent, icon, cta }) => (
              <div key={title} className={`role-card ${accent}`}>
                <div className="role-card__icon" aria-hidden="true">{icon}</div>
                <div>
                  <h3 className="text-base font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{text}</p>
                  <Link className="role-card__cta" to={`/register${languageSearch}`}>
                    {cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 landing-reveal">
          <div className="feature-split">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-clinic">{translateUiText("Smart triage")}</p>
              <h3 className="mt-3 text-2xl font-semibold text-ink">{translateUiText("Spot risk early without overwhelming staff.")}</h3>
              <p className="mt-3 text-sm text-slate-600">{t("highlightTriage")}</p>
            </div>
            <div className="visual-card">
              <p className="text-xs text-slate-500">{translateUiText("Triage preview")}</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="visual-row"><span className="visual-pill" />{translateUiText("Severe cough - High")}</div>
                <div className="visual-row"><span className="visual-pill visual-pill--warn" />{translateUiText("Fatigue - Medium")}</div>
                <div className="visual-row"><span className="visual-pill visual-pill--ok" />{translateUiText("Hydration - Stable")}</div>
              </div>
            </div>
          </div>
          <div className="feature-split feature-split--reverse">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-clinic">{translateUiText("Continuity dashboard")}</p>
              <h3 className="mt-3 text-2xl font-semibold text-ink">{translateUiText("Keep every follow-up visible across the team.")}</h3>
              <p className="mt-3 text-sm text-slate-600">{t("highlightFlow")}</p>
            </div>
            <div className="visual-card">
              <p className="text-xs text-slate-500">{translateUiText("Care timeline")}</p>
              <div className="mt-3 space-y-3">
                <div className="visual-line">
                  <span className="visual-dot" />
                  <span className="text-xs text-slate-600">{translateUiText("Doctor review completed")}</span>
                </div>
                <div className="visual-line">
                  <span className="visual-dot visual-dot--active" />
                  <span className="text-xs text-slate-600">{translateUiText("Medication confirmation")}</span>
                </div>
                <div className="visual-line">
                  <span className="visual-dot" />
                  <span className="text-xs text-slate-600">{translateUiText("Caregiver follow-up")}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="feature-split">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-clinic">{translateUiText("Caregiver adherence")}</p>
              <h3 className="mt-3 text-2xl font-semibold text-ink">{translateUiText("Support families with real-time adherence status.")}</h3>
              <p className="mt-3 text-sm text-slate-600">
                {translateUiText("Caregiver alerts show what is on track, overdue, and needs a follow-up call.")}
              </p>
            </div>
            <div className="visual-card caregiver-visual">
              <p className="text-xs text-slate-500">{translateUiText("Caregiver status")}</p>
              <div className="mt-4 grid gap-3">
                <div className="caregiver-row">
                  <span className="status-pill status-pill--good" />
                  <span className="text-xs text-slate-600">{translateUiText("Morning dose taken")}</span>
                </div>
                <div className="caregiver-row">
                  <span className="status-pill status-pill--warn" />
                  <span className="text-xs text-slate-600">{translateUiText("Afternoon dose pending")}</span>
                </div>
                <div className="caregiver-row">
                  <span className="status-pill status-pill--alert" />
                  <span className="text-xs text-slate-600">{translateUiText("Evening dose overdue")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="accessibility" className="mt-16 landing-reveal">
          <div className="access-center">
            <div className="access-center__header">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-clinic">{translateUiText("Accessibility control center")}</p>
                <h3 className="mt-2 text-2xl font-semibold text-ink">{translateUiText("Inclusive care tools built in.")}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {translateUiText("Preview the settings panel - live controls stay in the accessibility toolbar.")}
                </p>
              </div>
              <span className="landing-accessibility-badge">{translateUiText("Assistive-ready")}</span>
            </div>
            <div className="access-center__grid">
              {[
                {
                  title: translateUiText("Reading tools"),
                  items: [
                    translateUiText("Screen reader narration"),
                    translateUiText("Read page aloud")
                  ]
                },
                {
                  title: translateUiText("Display tools"),
                  items: [
                    translateUiText("Large text mode"),
                    translateUiText("High contrast layout")
                  ]
                },
                {
                  title: translateUiText("Voice tools"),
                  items: [
                    translateUiText("Voice command support"),
                    translateUiText("Language switching")
                  ]
                }
              ].map((group) => (
                <div key={group.title} className="access-card">
                  <div className="access-card__title">
                    <span className="access-icon" />
                    <h4 className="text-base font-semibold text-ink">{group.title}</h4>
                  </div>
                  <div className="mt-4 space-y-3">
                    {group.items.map((item) => (
                      <div key={item} className="access-item">
                        <div>
                          <p className="text-sm font-medium text-ink">{item}</p>
                          <p className="text-xs text-slate-500">{translateUiText("Settings available")}</p>
                        </div>
                        <span className="access-toggle">{translateUiText("On")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16 landing-reveal">
          <div className="trust-strip">
            {[
              { title: translateUiText("4 roles"), text: translateUiText("Patient, Doctor, Caregiver, Pharmacist") },
              { title: translateUiText("6 languages"), text: translateUiText("Multilingual continuity support") },
              { title: translateUiText("Low bandwidth"), text: translateUiText("Optimized for rural clinics") },
              { title: translateUiText("Accessibility"), text: translateUiText("Inclusive tools built in") }
            ].map((item) => (
              <div key={item.title} className="trust-card">
                <p className="text-lg font-semibold text-ink">{item.title}</p>
                <p className="mt-2 text-xs text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 landing-reveal">
          <InstallAppButton />
        </section>

        <section className="landing-cta landing-reveal" aria-label={translateUiText("Get started")}>
          <div>
            <p>{translateUiText("Ready for connected care operations?")}</p>
            <span>{translateUiText("Launch a secure patient, doctor, caregiver, and pharmacy workspace.")}</span>
          </div>
          <Link className="btn-primary" to={`/register${languageSearch}`}>{t("createAccount")}</Link>
        </section>

        <footer id="footer" className="landing-footer mt-16 rounded-[2rem] px-8 py-10">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm font-semibold text-ink">{translateUiText("TeleCare+")}</p>
              <p className="mt-2 text-sm text-slate-600">
                {translateUiText("A continuity-first telemedicine workspace for clinics, patients, and families.")}
              </p>
            </div>
            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              {[
                { label: translateUiText("About"), to: "/about" },
                { label: translateUiText("Privacy"), to: "/privacy" },
                { label: translateUiText("Contact"), to: "/contact" },
                { label: translateUiText("Terms"), to: "/terms" },
                { label: translateUiText("Support"), to: "/support" }
              ].map((item) => (
                <Link key={item.to} className="footer-link" to={item.to}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <p className="mt-6 text-xs text-slate-500">(c) {new Date().getFullYear()} TeleCare+. {translateUiText("All rights reserved.")}</p>
        </footer>
      </PageContainer>
    </div>
  );
}

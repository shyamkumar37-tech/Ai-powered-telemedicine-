import { DynamicState, DynamicStateObject } from "./../types/DynamicState";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import "./landing-override.css?v=3";
import { motion, useInView, animate } from "framer-motion";

export interface AnimatedCounterProps {
  from?: DynamicState;
  to?: DynamicState;
  suffix?: DynamicState;
  duration?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

function AnimatedCounter({ from, to, suffix = "", duration = 1.4 }: AnimatedCounterProps) {
  // @ts-expect-error - Auto-suppressed during migration
  const nodeRef = useRef<DynamicState>();
  const inView = useInView(nodeRef, { once: true, margin: "-10%" });
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (inView && !prefersReduced) {
      const controls = animate(from, to, {
        duration,
        ease: "easeOut",
        onUpdate(value: string | number) {
          if (nodeRef.current) {
            // @ts-expect-error - Auto-suppressed during migration
            nodeRef.current.textContent = Math.round(value).toLocaleString() + suffix;
          }
        }
      });
      return () => controls.stop();
    } else if (prefersReduced && nodeRef.current) {
      nodeRef.current.textContent = to.toLocaleString() + suffix;
    }
  }, [from, to, inView, suffix, prefersReduced, duration]);

  return <span ref={nodeRef}>{from.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { translateUiText = (value: string | number) => value, t } = useLanguage();
  const [darkMode, setDarkMode] = useState<DynamicState>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("telecareplus-theme") === "light" ? false : true; // Default dark
    } catch {
      return true;
    }
  });

  // Toggles for accessibility
  const [screenReader, setScreenReader] = useState<DynamicState>(false);
  const [readAloud, setReadAloud] = useState<DynamicState>(false);
  const [largeText, setLargeText] = useState<DynamicState>(false);
  const [highContrast, setHighContrast] = useState<DynamicState>(false);
  const [voiceCommand, setVoiceCommand] = useState<DynamicState>(false);
  const [langSwitch, setLangSwitch] = useState<DynamicState>(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = `TeleCare+ — Connected Care Platform`;
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (darkMode) {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
    try {
      localStorage.setItem("telecareplus-theme", darkMode ? "dark" : "light");
    } catch {}
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((d: DynamicStateObject) => !d);

  // Animated ECG
  const ecgLineRef = useRef<DynamicState>(null);
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let req: DynamicStateObject;
    if (!prefersReduced && ecgLineRef.current) {
      let offset = 0;
      const animateECG = () => {
        offset -= 1.4;
        if (offset <= -400) offset = 0;
        if (ecgLineRef.current) {
          ecgLineRef.current.setAttribute('transform', `translate(${offset},0)`);
        }
        req = requestAnimationFrame(animateECG);
      };
      req = requestAnimationFrame(animateECG);
    }
    return () => { if (req) cancelAnimationFrame(req); };
  }, []);

  // Symptom check-in bar animation
  const barRefs = useRef<DynamicState>([]);
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      barRefs.current.forEach((bar: DynamicStateObject) => {
        if (!bar) return;
        const target = bar.style.width;
        bar.style.width = '0%';
        requestAnimationFrame(() => {
          bar.style.transition = 'width 1.1s cubic-bezier(.2,.8,.2,1)';
          bar.style.width = target;
        });
      });
    }
  }, []);

  // Scroll reveals
  const revealRefs = useRef<DynamicState>([]);
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      revealRefs.current.forEach((el: DynamicStateObject) => el?.classList.add('is-visible'));
    } else {
      const io = new IntersectionObserver((entries: DynamicStateObject) => {
        entries.forEach((entry: DynamicStateObject) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      revealRefs.current.forEach((el: DynamicStateObject) => {
        if (el) io.observe(el);
      });
      return () => io.disconnect();
    }
  }, []);

  // Count up numbers
  const countRefs = useRef<DynamicState>([]);
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animateCount = (el: DynamicStateObject) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const duration = 1400;
      const start = performance.now();
      const tick = (now: DynamicStateObject) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(target * eased);
        el.textContent = val.toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      if (prefersReduced) {
        el.textContent = target.toLocaleString() + suffix;
      } else {
        requestAnimationFrame(tick);
      }
    };
    
    if ('IntersectionObserver' in window && !prefersReduced) {
      const countIo = new IntersectionObserver((entries: DynamicStateObject) => {
        entries.forEach((entry: DynamicStateObject) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      countRefs.current.forEach((el: DynamicStateObject) => {
        if (el) countIo.observe(el);
      });
      return () => countIo.disconnect();
    } else {
      countRefs.current.forEach((el: DynamicStateObject) => {
        if (el) animateCount(el);
      });
    }
  }, []);

  const addToRefs = (arr: DynamicStateObject) => (el: DynamicStateObject) => {
    if (el && !arr.current.includes(el)) {
      arr.current.push(el);
    }
  };

  return (
    <div className="landing-wrapper">
      <a className="skip-link" href="#main">{(t("skipToContent") || "Skip to content")}</a>

      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            <div className="brand-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2 12h4l2-7 4 14 2-9 2 5h6" stroke="#04231A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="brand-text">
              <div className="eyebrow">TELECARE+</div>
              <div className="title">{(t("connectedCarePlatform") || "Connected Care Platform")}</div>
              <div className="sub">{(t("fromFirstSymptomToDailyRecoverySupport") || "From first symptom to daily recovery support")}</div>
            </div>
          </div>
          <nav className="nav-links">
            <a href="#journey">{(t("careJourney") || "Care journey")}</a>
            <a href="#roles">{(t("roles") || "Roles")}</a>
            <a href="#accessibility">{(t("accessibility") || "Accessibility")}</a>
            <a href="#contact">{(t("contact") || "Contact")}</a>
          </nav>
          <div className="nav-actions">
            <button className="pill" onClick={toggleTheme} aria-pressed={!darkMode}>
              {darkMode ? (t("LightMode") || "☀️ Light Mode") : (t("DarkMode") || "🌙 Dark Mode")}
            </button>
            <LanguageSwitcher customClass="pill border-0 !p-0" hideLabel={true} />
            <Link to="/login?forceLogin=1" className="btn btn-ghost">{(t("login") || "Login")}</Link>
            <Link to="/register" className="btn btn-primary">{(t("createAccount") || "Create account")}</Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* HERO */}
        <div className="wrap hero-shell">
          <span className="ambient ambient-1"></span>
          <span className="ambient ambient-2"></span>
          <section className="hero reveal is-visible" style={{ paddingTop: '56px' }} ref={addToRefs(revealRefs)}>
            <div className="hero-grid">
              <div>
                <div className="tags">
                  <span className="tag">{(t("aIPoweredTriage") || "AI-powered triage")}</span>
                  <span className="tag">{(t("lowBandwidthReady") || "Low bandwidth ready")}</span>
                  <span className="tag">{(t("careContinuity") || "Care continuity")}</span>
                  <span className="tag">{(t("caregiverConnected") || "Caregiver connected")}</span>
                </div>
                <h1>{(t("smartTelemedicineThatContinuesCareNotJustConsultations") || "Smart telemedicine that continues care, not just consultations.")}</h1>
                <p className="lede">{(t("triageContinuityDashboardsChronicMonitoringCaregiverOversightAndEmergencyAwareWorkflowsInOneAcademicGradePlatform") || "Triage, continuity dashboards, chronic monitoring, caregiver oversight, and emergency-aware workflows in one academic-grade platform.")}</p>
                <p className="fine">{(t("builtForRuralClinicsChronicCareAndFamilySupportedRecovery") || "Built for rural clinics, chronic care, and family-supported recovery.")}</p>
                <div className="hero-ctas">
                  <Link to="/register" className="btn btn-primary">{(t("createAccount") || "Create account")}</Link>
                  <Link to="/login?forceLogin=1" className="btn btn-ghost">{(t("login") || "Login")}</Link>
                </div>
                <div className="chips">
                  <span className="chip">{(t("4CareRolesConnected") || "4 care roles connected")}</span>
                  <span className="chip">{(t("6LanguagesSupported") || "6 languages supported")}</span>
                  <span className="chip">{(t("accessibilityBuiltIn") || "Accessibility built in")}</span>
                  <span className="chip">{(t("lowBandwidthReady") || "Low bandwidth ready")}</span>
                </div>
              </div>

              <div className="preview-stack">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2 }} className="hero-graphic-wrap">
                  <img src="/hero-abstract.jpg" alt="Premium Healthcare Graphic" className="hero-graphic" />
                  <div className="glass-panel">
                    <div className="preview-title" style={{marginTop: '12px', fontSize: '16px'}}>{t("liveSystemActive") || "Live System Active"}</div>
                    <div className="bar-track" style={{marginTop: '12px'}}><div className="bar-fill" style={{ width: '82%' }}></div></div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          <div className="stats">
            <div className="stat-card card-lift reveal" ref={addToRefs(revealRefs)}><div className="stat-num"><AnimatedCounter from={0} to={24800} suffix="+" /></div><div className="stat-label">{(t("patientsMonitored") || "Patients monitored")}</div></div>
            <div className="stat-card card-lift reveal" ref={addToRefs(revealRefs)}><div className="stat-num"><AnimatedCounter from={0} to={1240} /></div><div className="stat-label">{(t("activeConsultations") || "Active consultations")}</div></div>
            <div className="stat-card card-lift reveal" ref={addToRefs(revealRefs)}><div className="stat-num"><AnimatedCounter from={0} to={91} suffix="%" /></div><div className="stat-label">{(t("recoveryAdherence") || "Recovery adherence")}</div></div>
            <div className="stat-card card-lift reveal" ref={addToRefs(revealRefs)}><div className="stat-num"><AnimatedCounter from={0} to={148} /></div><div className="stat-label">{(t("connectedHospitals") || "Connected hospitals")}</div></div>
          </div>
        </div>

        {/* MONITORING + FEATURES */}
        <section className="bg-alt">
          <div className="wrap">
            <div className="section-head reveal" ref={addToRefs(revealRefs)}>
              <div className="eyebrow-2">{(t("liveWorkspace") || "Live workspace")}</div>
              <h2>{(t("livePatientMonitoringClinicalActionAndFamilySupportInOneWorkspace") || "Live patient monitoring, clinical action, and family support in one workspace")}</h2>
            </div>
            <div className="monitor-grid">
              <div className="monitor-card card-lift reveal" ref={addToRefs(revealRefs)}>
                <div className="monitor-top">
                  <div>
                    <div className="preview-label">{(t("liveMonitoring") || "Live monitoring")}</div>
                    <div className="patient-name">{(t("anitaPatient") || "Anita Patient")}</div>
                  </div>
                  <span className="status-pill">● {(t("stable") || "Stable")}</span>
                </div>
                <div className="ecg-wrap">
                  <svg id="ecgSvg" viewBox="0 0 400 110" width="100%" height="100%" preserveAspectRatio="none">
                    <polyline id="ecgLine" ref={ecgLineRef} fill="none" stroke="#10B981" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
                      points="0,55 30,55 45,55 55,20 65,90 75,40 90,55 400,55 430,55 445,55 455,20 465,90 475,40 490,55 800,55"/>
                  </svg>
                </div>
                <div className="vitals-row">
                  <div className="vital-box"><div className="vital-num"><AnimatedCounter from={0} to={78} /></div><div className="vital-label">{(t("heartRate") || "Heart Rate")}</div></div>
                  <div className="vital-box"><div className="vital-num">120/80</div><div className="vital-label">{(t("bloodPressure") || "Blood Pressure")}</div></div>
                  <div className="vital-box"><div className="vital-num"><AnimatedCounter from={0} to={96} suffix="%" /></div><div className="vital-label">{(t("recovery") || "Recovery")}</div></div>
                </div>
              </div>

              <div className="feature-list reveal" ref={addToRefs(revealRefs)}>
                <div className="feature-item card-lift">
                  <span className="feature-dot"></span>
                  <div><h3>{(t("aISymptomAnalysis") || "AI Symptom Analysis")}</h3><p>{(t("riskAwareIntakeRoutesUrgentCasesToTheRightClinicianFaster") || "Risk-aware intake routes urgent cases to the right clinician faster.")}</p></div>
                </div>
                <div className="feature-item card-lift">
                  <span className="feature-dot"></span>
                  <div><h3>{(t("remoteMonitoring") || "Remote Monitoring")}</h3><p>{(t("vitalsAlertsAndRecoverySignalsStayVisibleBetweenVisits") || "Vitals, alerts, and recovery signals stay visible between visits.")}</p></div>
                </div>
                <div className="feature-item card-lift">
                  <span className="feature-dot"></span>
                  <div><h3>{(t("medicationTracking") || "Medication Tracking")}</h3><p>{(t("doseAdherenceMissedRemindersAndPharmacyStatusStayConnected") || "Dose adherence, missed reminders, and pharmacy status stay connected.")}</p></div>
                </div>
                <div className="feature-item card-lift">
                  <span className="feature-dot"></span>
                  <div><h3>{(t("familyCareDashboard") || "Family Care Dashboard")}</h3><p>{(t("caregiversGetSupportiveContextWithoutOverwhelmingThePatient") || "Caregivers get supportive context without overwhelming the patient.")}</p></div>
                </div>
                <div className="feature-item card-lift">
                  <span className="feature-dot"></span>
                  <div><h3>{(t("accessibilityTools") || "Accessibility Tools")}</h3><p>{(t("voiceContrastReadingAndTextControlsAreAvailableEverywhere") || "Voice, contrast, reading, and text controls are available everywhere.")}</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CARE JOURNEY */}
        <section id="journey">
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow-2">{(t("careJourney") || "Care journey")}</div>
              <h2>{(t("aConnectedFlowFromFirstSymptomToDailyRecovery") || "A connected flow from first symptom to daily recovery")}</h2>
              <p>{(t("teleCareKeepsPatientUpdatesClinicalReviewPharmacyChecksAndCaregiverFollowUpInOneTimeline") || "TeleCare+ keeps patient updates, clinical review, pharmacy checks, and caregiver follow-up in one timeline.")}</p>
            </div>
            <div className="journey-track">
              <div className="journey-step card-lift reveal" ref={addToRefs(revealRefs)}><div className="num">1</div><h3>{(t("patientReportsSymptoms") || "Patient reports symptoms")}</h3></div>
              <div className="journey-step card-lift reveal" ref={addToRefs(revealRefs)}><div className="num">2</div><h3>{(t("aITriageEvaluatesUrgency") || "AI triage evaluates urgency")}</h3></div>
              <div className="journey-step card-lift reveal" ref={addToRefs(revealRefs)}><div className="num">3</div><h3>{(t("doctorReviewsCase") || "Doctor reviews case")}</h3></div>
              <div className="journey-step card-lift reveal" ref={addToRefs(revealRefs)}><div className="num">4</div><h3>{(t("prescriptionConfirmed") || "Prescription confirmed")}</h3></div>
              <div className="journey-step card-lift reveal" ref={addToRefs(revealRefs)}><div className="num">5</div><h3>{(t("remindersScheduled") || "Reminders scheduled")}</h3></div>
              <div className="journey-step card-lift reveal" ref={addToRefs(revealRefs)}><div className="num">6</div><h3>{(t("caregiverMonitorsAdherence") || "Caregiver monitors adherence")}</h3></div>
            </div>

            <div className="testimonials">
              <div className="t-card card-lift reveal" ref={addToRefs(revealRefs)}>
                <div className="t-stars">★★★★★</div>
                <p>"{(t("teleCareHelpedOurNursesPrioritizeRiskWhileKeepingFamilyMembersInformed") || "TeleCare+ helped our nurses prioritize risk while keeping family members informed.")}"</p>
                <div className="t-author">
                  <div className="t-avatar bg-blue">DS</div>
                  <div>
                    <div className="t-name">{(t("drMeeraShah") || "Dr. Meera Shah")}</div>
                    <div className="t-role">{(t("clinicalDirector") || "Clinical Director")}</div>
                  </div>
                </div>
              </div>
              <div className="t-card card-lift reveal" ref={addToRefs(revealRefs)}>
                <div className="t-stars">★★★★★</div>
                <p>"{(t("theRecoveryDashboardMadeDailyMedicinesAndFollowUpsFeelManageable") || "The recovery dashboard made daily medicines and follow-ups feel manageable.")}"</p>
                <div className="t-author">
                  <div className="t-avatar bg-mint">AR</div>
                  <div>
                    <div className="t-name">{(t("anitaR") || "Anita R.")}</div>
                    <div className="t-role">{(t("patient") || "Patient")}</div>
                  </div>
                </div>
              </div>
              <div className="t-card card-lift reveal" ref={addToRefs(revealRefs)}>
                <div className="t-stars">★★★★★</div>
                <p>"{(t("weCutMissedFollowUpsBecauseTheCareTimelineIsVisibleToEveryone") || "We cut missed follow-ups because the care timeline is visible to everyone.")}"</p>
                <div className="t-author">
                  <div className="t-avatar bg-rose">RC</div>
                  <div>
                    <div className="t-name">{(t("ruralCareNetwork") || "Rural Care Network")}</div>
                    <div className="t-role">{(t("partnerHospital") || "Partner hospital")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROLES */}
        <section id="roles" className="bg-alt">
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow-2">{(t("builtForEverySeatAtTheTable") || "Built for every seat at the table")}</div>
              <h2>{(t("onePlatformFourConnectedRoles") || "One platform, four connected roles")}</h2>
              <p>{(t("eachRoleSeesExactlyWhatItNeedsNothingMoreNothingHidden") || "Each role sees exactly what it needs — nothing more, nothing hidden.")}</p>
            </div>
            <div className="role-grid">
              <div className="role-card r-patient card-lift reveal" ref={addToRefs(revealRefs)} onClick={() => navigate('/login?forceLogin=1')}>
                <div className="role-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
                <h3>{(t("patient") || "Patient")}</h3>
                <p>{(t("symptomCheckInsRemindersAndProgressSnapshots") || "Symptom check-ins, reminders, and progress snapshots.")}</p>
                <div className="role-cta">{(t("openPatientApp") || "Open patient app")}</div>
              </div>
              <div className="role-card r-doctor card-lift reveal" ref={addToRefs(revealRefs)} onClick={() => navigate('/login?forceLogin=1')}>
                <div className="role-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
                <h3>{(t("doctor") || "Doctor")}</h3>
                <p>{(t("triageDashboardsReviewToolsAndCarePlanning") || "Triage dashboards, review tools, and care planning.")}</p>
                <div className="role-cta">{(t("openClinicianView") || "Open clinician view")}</div>
              </div>
              <div className="role-card r-caregiver card-lift reveal" ref={addToRefs(revealRefs)} onClick={() => navigate('/login?forceLogin=1')}>
                <div className="role-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.4-7-10a5 5 0 019-3 5 5 0 019 3c0 5.6-7 10-7 10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg></div>
                <h3>{(t("caregiver") || "Caregiver")}</h3>
                <p>{(t("adherenceAlertsAndSupportiveFollowUpGuidance") || "Adherence alerts and supportive follow-up guidance.")}</p>
                <div className="role-cta">{(t("openCaregiverHub") || "Open caregiver hub")}</div>
              </div>
              <div className="role-card r-pharmacist card-lift reveal" ref={addToRefs(revealRefs)} onClick={() => navigate('/login?forceLogin=1')}>
                <div className="role-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M9 8h6M9 12h6M9 16h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
                <h3>{(t("pharmacist") || "Pharmacist")}</h3>
                <p>{(t("prescriptionConfirmationAndMedicationSafetyChecks") || "Prescription confirmation and medication safety checks.")}</p>
                <div className="role-cta">{(t("openPharmacyQueue") || "Open pharmacy queue")}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ACCESSIBILITY */}
        <section id="accessibility">
          <div className="wrap">
            <div className="a11y-panel reveal" ref={addToRefs(revealRefs)}>
              <div className="a11y-top">
                <div>
                  <div className="eyebrow-2">{(t("accessibilityControlCenter") || "Accessibility control center")}</div>
                  <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>{(t("inclusiveCareToolsBuiltIn") || "Inclusive care tools built in.")}</h2>
                  <p style={{ color: 'var(--muted)', fontSize: '15px' }}>{(t("liveControlsStayAvailableInTheToolbarOnEveryPage") || "Live controls stay available in the toolbar on every page.")}</p>
                </div>
                <span className="status-pill">{(t("assistiveReady") || "Assistive-ready")}</span>
              </div>

              <div className="a11y-grid">
                <div className="a11y-card card-lift">
                  <div className="a11y-card-head">
                    <div className="a11y-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 19h16M6 15l3-8 3 8M8 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
                    <h3>{(t("readingTools") || "Reading tools")}</h3>
                  </div>
                  <div className="a11y-row">
                    <div><div className="a11y-row-label">{(t("screenReaderNarration") || "Screen reader narration")}</div><div className="a11y-row-sub">{(t("settingsAvailable") || "Settings available")}</div></div>
                    <button className="toggle" aria-pressed={screenReader} onClick={() => setScreenReader(!screenReader)} aria-label="Toggle screen reader narration"></button>
                  </div>
                  <div className="a11y-row">
                    <div><div className="a11y-row-label">{(t("readPageAloud") || "Read page aloud")}</div><div className="a11y-row-sub">{(t("settingsAvailable") || "Settings available")}</div></div>
                    <button className="toggle" aria-pressed={readAloud} onClick={() => setReadAloud(!readAloud)} aria-label="Toggle read page aloud"></button>
                  </div>
                </div>

                <div className="a11y-card card-lift">
                  <div className="a11y-card-head">
                    <div className="a11y-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/><path d="M12 4a8 8 0 000 16z" fill="currentColor"/></svg></div>
                    <h3>{(t("displayTools") || "Display tools")}</h3>
                  </div>
                  <div className="a11y-row">
                    <div><div className="a11y-row-label">{(t("largeTextMode") || "Large text mode")}</div><div className="a11y-row-sub">{(t("settingsAvailable") || "Settings available")}</div></div>
                    <button className="toggle" aria-pressed={largeText} onClick={() => setLargeText(!largeText)} aria-label="Toggle large text mode"></button>
                  </div>
                  <div className="a11y-row">
                    <div><div className="a11y-row-label">{(t("highContrastLayout") || "High contrast layout")}</div><div className="a11y-row-sub">{(t("settingsAvailable") || "Settings available")}</div></div>
                    <button className="toggle" aria-pressed={highContrast} onClick={() => setHighContrast(!highContrast)} aria-label="Toggle high contrast layout"></button>
                  </div>
                </div>

                <div className="a11y-card card-lift">
                  <div className="a11y-card-head">
                    <div className="a11y-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M5 11a7 7 0 0014 0M12 18v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
                    <h3>{(t("voiceTools") || "Voice tools")}</h3>
                  </div>
                  <div className="a11y-row">
                    <div><div className="a11y-row-label">{(t("voiceCommandSupport") || "Voice command support")}</div><div className="a11y-row-sub">{(t("settingsAvailable") || "Settings available")}</div></div>
                    <button className="toggle" aria-pressed={voiceCommand} onClick={() => setVoiceCommand(!voiceCommand)} aria-label="Toggle voice command support"></button>
                  </div>
                  <div className="a11y-row">
                    <div><div className="a11y-row-label">{(t("languageSwitching") || "Language switching")}</div><div className="a11y-row-sub">{(t("settingsAvailable") || "Settings available")}</div></div>
                    <button className="toggle" aria-pressed={langSwitch} onClick={() => setLangSwitch(!langSwitch)} aria-label="Toggle language switching"></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-strip">
              <div className="info-box"><b>{(t("4Roles") || "4 roles")}</b><span>{(t("patientDoctorCaregiverPharmacist") || "Patient, Doctor, Caregiver, Pharmacist")}</span></div>
              <div className="info-box"><b>{(t("6Languages") || "6 languages")}</b><span>{(t("multilingualContinuitySupport") || "Multilingual continuity support")}</span></div>
              <div className="info-box"><b>{(t("lowBandwidth") || "Low bandwidth")}</b><span>{(t("optimizedForRuralClinics") || "Optimized for rural clinics")}</span></div>
              <div className="info-box"><b>{(t("accessibility") || "Accessibility")}</b><span>{(t("inclusiveToolsBuiltIn") || "Inclusive tools built in")}</span></div>
            </div>

            <div className="cta-banner">
              <div>
                <h3>{(t("installableApp") || "Installable app")}</h3>
                <p>{(t("addTeleCareToYourDeviceForFasterAccessAndBackgroundSupport") || "Add TeleCare+ to your device for faster access and background support.")}</p>
              </div>
              <button className="btn btn-ghost">{(t("installApp") || "Install app")}</button>
            </div>

            <div className="cta-banner" id="contact">
              <div>
                <h3>{(t("readyForConnectedCareOperations") || "Ready for connected care operations?")}</h3>
                <p>{(t("launchASecurePatientDoctorCaregiverAndPharmacyWorkspace") || "Launch a secure patient, doctor, caregiver, and pharmacy workspace.")}</p>
              </div>
              <Link to="/register" className="btn btn-primary">{(t("createAccount") || "Create account")}</Link>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="brand">
                <div className="brand-mark" style={{ width: '40px', height: '40px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2 12h4l2-7 4 14 2-9 2 5h6" stroke="#04231A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="brand-text"><div className="title" style={{ fontSize: '18px' }}>TeleCare+</div></div>
              </div>
              <p>{(t("aConnectedCareOperatingSystemForClinicsPatientsAndFamiliesBuiltForLowBandwidthHighTrustEnvironments") || "A connected care operating system for clinics, patients, and families — built for low-bandwidth, high-trust environments.")}</p>
            </div>
            <div className="footer-col">
              <h4>{(t("platform") || "Platform")}</h4>
              <a href="#journey">{(t("careJourney") || "Care journey")}</a>
              <a href="#roles">{(t("roles") || "Roles")}</a>
              <a href="#accessibility">{(t("accessibility") || "Accessibility")}</a>
            </div>
            <div className="footer-col">
              <h4>{(t("company") || "Company")}</h4>
              <a href="#">{(t("about") || "About")}</a>
              <a href="#">{(t("careers") || "Careers")}</a>
              <a href="#">{(t("partners") || "Partners")}</a>
            </div>
            <div className="footer-col">
              <h4>{(t("support") || "Support")}</h4>
              <a href="#contact">{(t("contact") || "Contact")}</a>
              <a href="#">{(t("status") || "Status")}</a>
              <a href="#">{(t("privacy") || "Privacy")}</a>
            </div>
          </div>
          <div className="footer-bottom">© 2026 TeleCare+. {(t("builtForRuralClinicsAndChronicCareRecovery") || "Built for rural clinics and chronic care recovery.")}</div>
        </div>
      </footer>
    </div>
  );
}

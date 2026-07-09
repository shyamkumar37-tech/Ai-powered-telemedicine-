import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./landing-override.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("telecareplus-theme") === "light" ? false : true; // Default dark
    } catch {
      return true;
    }
  });

  // Toggles for accessibility
  const [screenReader, setScreenReader] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState(false);
  const [langSwitch, setLangSwitch] = useState(false);

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

  const toggleTheme = () => setDarkMode((d) => !d);

  // Animated ECG
  const ecgLineRef = useRef(null);
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let req;
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
  const barRefs = useRef([]);
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      barRefs.current.forEach(bar => {
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
  const revealRefs = useRef([]);
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      revealRefs.current.forEach(el => el?.classList.add('is-visible'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      revealRefs.current.forEach(el => {
        if (el) io.observe(el);
      });
      return () => io.disconnect();
    }
  }, []);

  // Count up numbers
  const countRefs = useRef([]);
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animateCount = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
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
      const countIo = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      countRefs.current.forEach(el => {
        if (el) countIo.observe(el);
      });
      return () => countIo.disconnect();
    } else {
      countRefs.current.forEach(el => {
        if (el) animateCount(el);
      });
    }
  }, []);

  const addToRefs = (arr) => (el) => {
    if (el && !arr.current.includes(el)) {
      arr.current.push(el);
    }
  };

  return (
    <div className="landing-wrapper">
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            <div className="brand-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2 12h4l2-7 4 14 2-9 2 5h6" stroke="#04231A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="brand-text">
              <div className="eyebrow">TELECARE+</div>
              <div className="title">Connected Care Platform</div>
              <div className="sub">From first symptom to daily recovery support</div>
            </div>
          </div>
          <nav className="nav-links">
            <a href="#journey">Care journey</a>
            <a href="#roles">Roles</a>
            <a href="#accessibility">Accessibility</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="nav-actions">
            <button className="pill" onClick={toggleTheme} aria-pressed={!darkMode}>
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
            <select className="pill" aria-label="Language">
              <option>English</option>
              <option>हिन्दी</option>
              <option>தமிழ்</option>
              <option>Español</option>
            </select>
            <Link to="/login" className="btn btn-ghost">Login</Link>
            <Link to="/login" className="btn btn-primary">Create account</Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* HERO */}
        <div className="wrap hero-shell">
          <span className="ambient ambient-1"></span>
          <span className="ambient ambient-2"></span>
          <section className="hero reveal is-visible" style={{ paddingTop: '64px' }} ref={addToRefs(revealRefs)}>
            <div className="hero-grid">
              <div>
                <div className="tags">
                  <span className="tag">AI-powered triage</span>
                  <span className="tag">Low bandwidth ready</span>
                  <span className="tag">Care continuity</span>
                  <span className="tag">Caregiver connected</span>
                </div>
                <h1>Smart telemedicine that <em>continues care</em>, not just consultations.</h1>
                <p className="lede">Triage, continuity dashboards, chronic monitoring, caregiver oversight, and emergency-aware workflows in one academic-grade platform.</p>
                <p className="fine">Built for rural clinics, chronic care, and family-supported recovery.</p>
                <div className="hero-ctas">
                  <Link to="/login" className="btn btn-primary">Create account</Link>
                  <Link to="/login" className="btn btn-ghost">Login</Link>
                </div>
                <div className="chips">
                  <span className="chip">4 care roles connected</span>
                  <span className="chip">6 languages supported</span>
                  <span className="chip">Accessibility built in</span>
                  <span className="chip">Low bandwidth ready</span>
                </div>
              </div>

              <div className="preview-stack">
                <div className="preview-card">
                  <div className="preview-label">Patient app</div>
                  <div className="preview-title">Symptom check-in</div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: '82%' }} ref={addToRefs(barRefs)}></div></div>
                </div>
                <div className="preview-card">
                  <div className="preview-label">Doctor dashboard</div>
                  <div className="preview-title">Triage queue</div>
                  <div className="queue-row"><span>Urgent cases</span><b>4</b></div>
                  <div className="queue-row"><span>Follow-ups</span><b>8</b></div>
                </div>
                <div className="preview-card">
                  <div className="preview-label">Caregiver reminders</div>
                  <div className="preview-title">Adherence status</div>
                  <div className="dot-row">
                    <span className="dot g"></span><span className="dot a"></span><span className="dot r"></span>
                  </div>
                </div>
                <div className="preview-card">
                  <div className="preview-label">Pharmacist panel</div>
                  <div className="preview-title">Prescription review</div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: '96%', background: 'linear-gradient(90deg,#EAF2F5,#C6D6E0)' }} ref={addToRefs(barRefs)}></div></div>
                </div>
              </div>
            </div>
          </section>

          <div className="stats">
            <div className="stat-card card-lift reveal" ref={addToRefs(revealRefs)}><div className="stat-num" data-count="24800" data-suffix="+" ref={addToRefs(countRefs)}>0</div><div className="stat-label">Patients monitored</div></div>
            <div className="stat-card card-lift reveal" ref={addToRefs(revealRefs)}><div className="stat-num" data-count="1240" ref={addToRefs(countRefs)}>0</div><div className="stat-label">Active consultations</div></div>
            <div className="stat-card card-lift reveal" ref={addToRefs(revealRefs)}><div className="stat-num" data-count="91" data-suffix="%" ref={addToRefs(countRefs)}>0</div><div className="stat-label">Recovery adherence</div></div>
            <div className="stat-card card-lift reveal" ref={addToRefs(revealRefs)}><div className="stat-num" data-count="148" ref={addToRefs(countRefs)}>0</div><div className="stat-label">Connected hospitals</div></div>
          </div>
        </div>

        {/* MONITORING + FEATURES */}
        <div className="wrap">
          <section>
            <div className="section-head reveal" ref={addToRefs(revealRefs)}>
              <div className="eyebrow-2">Live workspace</div>
              <h2>Live patient monitoring, clinical action, and family support in one workspace</h2>
            </div>
            <div className="monitor-grid">
              <div className="monitor-card card-lift reveal" ref={addToRefs(revealRefs)}>
                <div className="monitor-top">
                  <div>
                    <div className="preview-label">Live monitoring</div>
                    <div className="patient-name">Anita Patient</div>
                  </div>
                  <span className="status-pill">● Stable</span>
                </div>
                <div className="ecg-wrap">
                  <svg id="ecgSvg" viewBox="0 0 400 110" width="100%" height="100%" preserveAspectRatio="none">
                    <polyline id="ecgLine" ref={ecgLineRef} fill="none" stroke="#3DDC97" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
                      points="0,55 30,55 45,55 55,20 65,90 75,40 90,55 400,55 430,55 445,55 455,20 465,90 475,40 490,55 800,55"/>
                  </svg>
                </div>
                <div className="vitals-row">
                  <div className="vital-box"><div className="vital-num" data-count="78" ref={addToRefs(countRefs)}>0</div><div className="vital-label">Heart Rate</div></div>
                  <div className="vital-box"><div className="vital-num">120/80</div><div className="vital-label">Blood Pressure</div></div>
                  <div className="vital-box"><div className="vital-num" data-count="96" data-suffix="%" ref={addToRefs(countRefs)}>0</div><div className="vital-label">Recovery</div></div>
                </div>
              </div>

              <div className="feature-list reveal" ref={addToRefs(revealRefs)}>
                <div className="feature-item card-lift">
                  <span className="feature-dot"></span>
                  <div><h3>AI Symptom Analysis</h3><p>Risk-aware intake routes urgent cases to the right clinician faster.</p></div>
                </div>
                <div className="feature-item card-lift">
                  <span className="feature-dot"></span>
                  <div><h3>Remote Monitoring</h3><p>Vitals, alerts, and recovery signals stay visible between visits.</p></div>
                </div>
                <div className="feature-item card-lift">
                  <span className="feature-dot"></span>
                  <div><h3>Medication Tracking</h3><p>Dose adherence, missed reminders, and pharmacy status stay connected.</p></div>
                </div>
                <div className="feature-item card-lift">
                  <span className="feature-dot"></span>
                  <div><h3>Family Care Dashboard</h3><p>Caregivers get supportive context without overwhelming the patient.</p></div>
                </div>
                <div className="feature-item card-lift">
                  <span className="feature-dot"></span>
                  <div><h3>Accessibility Tools</h3><p>Voice, contrast, reading, and text controls are available everywhere.</p></div>
                </div>
              </div>
            </div>
          </section>

          {/* CARE JOURNEY */}
          <section id="journey">
            <div className="section-head">
              <div className="eyebrow-2">Care journey</div>
              <h2>A connected flow from first symptom to daily recovery</h2>
              <p>TeleCare+ keeps patient updates, clinical review, pharmacy checks, and caregiver follow-up in one timeline.</p>
            </div>
            <div className="journey-track">
              <div className="journey-step card-lift reveal" ref={addToRefs(revealRefs)}><div className="num">1</div><h3>Patient reports symptoms</h3></div>
              <div className="journey-step card-lift reveal" ref={addToRefs(revealRefs)}><div className="num">2</div><h3>AI triage evaluates urgency</h3></div>
              <div className="journey-step card-lift reveal" ref={addToRefs(revealRefs)}><div className="num">3</div><h3>Doctor reviews case</h3></div>
              <div className="journey-step card-lift reveal" ref={addToRefs(revealRefs)}><div className="num">4</div><h3>Prescription confirmed</h3></div>
              <div className="journey-step card-lift reveal" ref={addToRefs(revealRefs)}><div className="num">5</div><h3>Reminders scheduled</h3></div>
              <div className="journey-step card-lift reveal" ref={addToRefs(revealRefs)}><div className="num">6</div><h3>Caregiver monitors adherence</h3></div>
            </div>

            <div className="testimonials">
              <div className="t-card card-lift reveal" ref={addToRefs(revealRefs)}>
                <p>"TeleCare+ helped our nurses prioritize risk while keeping family members informed."</p>
                <div className="t-name">Dr. Meera Shah</div>
                <div className="t-role">Clinical Director</div>
              </div>
              <div className="t-card card-lift reveal" ref={addToRefs(revealRefs)}>
                <p>"The recovery dashboard made daily medicines and follow-ups feel manageable."</p>
                <div className="t-name">Anita R.</div>
                <div className="t-role">Patient</div>
              </div>
              <div className="t-card card-lift reveal" ref={addToRefs(revealRefs)}>
                <p>"We cut missed follow-ups because the care timeline is visible to everyone."</p>
                <div className="t-name">Rural Care Network</div>
                <div className="t-role">Partner hospital</div>
              </div>
            </div>
          </section>

          {/* ROLES */}
          <section id="roles">
            <div className="section-head">
              <div className="eyebrow-2">Built for every seat at the table</div>
              <h2>One platform, four connected roles</h2>
              <p>Each role sees exactly what it needs — nothing more, nothing hidden.</p>
            </div>
            <div className="role-grid">
              <div className="role-card r-patient card-lift reveal" ref={addToRefs(revealRefs)} onClick={() => navigate('/login')}>
                <div className="role-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
                <h3>Patient</h3>
                <p>Symptom check-ins, reminders, and progress snapshots.</p>
                <div className="role-cta">Open patient app</div>
              </div>
              <div className="role-card r-doctor card-lift reveal" ref={addToRefs(revealRefs)} onClick={() => navigate('/login')}>
                <div className="role-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
                <h3>Doctor</h3>
                <p>Triage dashboards, review tools, and care planning.</p>
                <div className="role-cta">Open clinician view</div>
              </div>
              <div className="role-card r-caregiver card-lift reveal" ref={addToRefs(revealRefs)} onClick={() => navigate('/login')}>
                <div className="role-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.4-7-10a5 5 0 019-3 5 5 0 019 3c0 5.6-7 10-7 10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg></div>
                <h3>Caregiver</h3>
                <p>Adherence alerts and supportive follow-up guidance.</p>
                <div className="role-cta">Open caregiver hub</div>
              </div>
              <div className="role-card r-pharmacist card-lift reveal" ref={addToRefs(revealRefs)} onClick={() => navigate('/login')}>
                <div className="role-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M9 8h6M9 12h6M9 16h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
                <h3>Pharmacist</h3>
                <p>Prescription confirmation and medication safety checks.</p>
                <div className="role-cta">Open pharmacy queue</div>
              </div>
            </div>
          </section>

          {/* ACCESSIBILITY */}
          <section id="accessibility">
            <div className="a11y-panel reveal" ref={addToRefs(revealRefs)}>
              <div className="a11y-top">
                <div>
                  <div className="eyebrow-2">Accessibility control center</div>
                  <h2 style={{ fontSize: '22px', marginBottom: '6px' }}>Inclusive care tools built in.</h2>
                  <p style={{ color: 'var(--muted)', fontSize: '13.5px' }}>Live controls stay available in the toolbar on every page.</p>
                </div>
                <span className="status-pill">Assistive-ready</span>
              </div>

              <div className="a11y-grid">
                <div className="a11y-card card-lift">
                  <div className="a11y-card-head">
                    <div className="a11y-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 19h16M6 15l3-8 3 8M8 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
                    <h3>Reading tools</h3>
                  </div>
                  <div className="a11y-row">
                    <div><div className="a11y-row-label">Screen reader narration</div><div className="a11y-row-sub">Settings available</div></div>
                    <button className="toggle" aria-pressed={screenReader} onClick={() => setScreenReader(!screenReader)} aria-label="Toggle screen reader narration"></button>
                  </div>
                  <div className="a11y-row">
                    <div><div className="a11y-row-label">Read page aloud</div><div className="a11y-row-sub">Settings available</div></div>
                    <button className="toggle" aria-pressed={readAloud} onClick={() => setReadAloud(!readAloud)} aria-label="Toggle read page aloud"></button>
                  </div>
                </div>

                <div className="a11y-card card-lift">
                  <div className="a11y-card-head">
                    <div className="a11y-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/><path d="M12 4a8 8 0 000 16z" fill="currentColor"/></svg></div>
                    <h3>Display tools</h3>
                  </div>
                  <div className="a11y-row">
                    <div><div className="a11y-row-label">Large text mode</div><div className="a11y-row-sub">Settings available</div></div>
                    <button className="toggle" aria-pressed={largeText} onClick={() => setLargeText(!largeText)} aria-label="Toggle large text mode"></button>
                  </div>
                  <div className="a11y-row">
                    <div><div className="a11y-row-label">High contrast layout</div><div className="a11y-row-sub">Settings available</div></div>
                    <button className="toggle" aria-pressed={highContrast} onClick={() => setHighContrast(!highContrast)} aria-label="Toggle high contrast layout"></button>
                  </div>
                </div>

                <div className="a11y-card card-lift">
                  <div className="a11y-card-head">
                    <div className="a11y-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M5 11a7 7 0 0014 0M12 18v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
                    <h3>Voice tools</h3>
                  </div>
                  <div className="a11y-row">
                    <div><div className="a11y-row-label">Voice command support</div><div className="a11y-row-sub">Settings available</div></div>
                    <button className="toggle" aria-pressed={voiceCommand} onClick={() => setVoiceCommand(!voiceCommand)} aria-label="Toggle voice command support"></button>
                  </div>
                  <div className="a11y-row">
                    <div><div className="a11y-row-label">Language switching</div><div className="a11y-row-sub">Settings available</div></div>
                    <button className="toggle" aria-pressed={langSwitch} onClick={() => setLangSwitch(!langSwitch)} aria-label="Toggle language switching"></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-strip">
              <div className="info-box"><b>4 roles</b><span>Patient, Doctor, Caregiver, Pharmacist</span></div>
              <div className="info-box"><b>6 languages</b><span>Multilingual continuity support</span></div>
              <div className="info-box"><b>Low bandwidth</b><span>Optimized for rural clinics</span></div>
              <div className="info-box"><b>Accessibility</b><span>Inclusive tools built in</span></div>
            </div>

            <div className="cta-banner">
              <div>
                <h3>Installable app</h3>
                <p>Add TeleCare+ to your device for faster access and background support.</p>
              </div>
              <button className="btn btn-ghost">Install app</button>
            </div>

            <div className="cta-banner" id="contact">
              <div>
                <h3>Ready for connected care operations?</h3>
                <p>Launch a secure patient, doctor, caregiver, and pharmacy workspace.</p>
              </div>
              <Link to="/login" className="btn btn-primary">Create account</Link>
            </div>
          </section>
        </div>
      </main>

      <footer>
        <div className="wrap">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="brand">
                <div className="brand-mark" style={{ width: '36px', height: '36px' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M2 12h4l2-7 4 14 2-9 2 5h6" stroke="#04231A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="brand-text"><div className="title">TeleCare+</div></div>
              </div>
              <p>A connected care operating system for clinics, patients, and families — built for low-bandwidth, high-trust environments.</p>
            </div>
            <div className="footer-col">
              <h4>Platform</h4>
              <a href="#journey">Care journey</a>
              <a href="#roles">Roles</a>
              <a href="#accessibility">Accessibility</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Partners</a>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <a href="#contact">Contact</a>
              <a href="#">Status</a>
              <a href="#">Privacy</a>
            </div>
          </div>
          <div className="footer-bottom">© 2026 TeleCare+. Built for rural clinics and chronic care recovery.</div>
        </div>
      </footer>
    </div>
  );
}

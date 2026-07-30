import LanguageSwitcher from "../components/LanguageSwitcher";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "../services/telecareService";
import { buildLoginRedirect } from "../utils/authSession";
import { useLanguage } from "../context/LanguageContext";
import PatientSidebar from "../components/PatientSidebar";
import { LogOut, Menu } from "lucide-react";
import { DynamicStateObject, DynamicState } from "./../types/DynamicState";

export default function PatientDashboardPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { t = (key: DynamicStateObject) => key } = useLanguage() || { language: "en", t: (key: DynamicStateObject) => key };

  const [liveTime, setLiveTime] = useState<DynamicState>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard", "patient", auth?.profileId],
    queryFn: () => fetchDashboard("patient", auth?.profileId),
    enabled: !!auth?.profileId,
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };

  const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="shell">
      {/* 236px Patient Sidebar */}
      <PatientSidebar isMobileOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <main className="w-full flex-1 min-w-0">
        {/* Topbar matching exact screenshot */}
        <div className="topbar">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-1.5 text-[var(--ink-muted)] hover:text-white bg-[var(--surface-2)] border border-[var(--border)] rounded-lg"
                aria-label="Open sidebar menu"
              >
                <Menu size={18} />
              </button>
              <div className="greeting-eyebrow">PATIENT WORKSPACE</div>
            </div>
            <h1>Good afternoon, {auth?.fullName?.split(" ")[0] || "Anita"}</h1>
            <p className="subtext">Here's what needs your attention today, {formattedDate}.</p>
          </div>
          <div className="status-pills">
            <LanguageSwitcher hideLabel />
            <span className="pill verified"><i className="ti ti-shield-check"></i>Verified care team</span>
            <span className="pill live"><span className="dot"></span>Live · {liveTime || "02:03 pm"}</span>
            <button 
              onClick={handleLogout} 
              aria-label="Log out"
              className="pill cursor-pointer hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-white transition-colors"
            >
              <LogOut size={14} />
              {t("logout") || "Logout"}
            </button>
          </div>
        </div>

        {/* Priority actions */}
        <section>
          <div className="priority-grid">
            <div className="card priority-card crit">
              <div className="p-label crit"><i className="ti ti-alert-triangle"></i>Critical health alert</div>
              <div className="p-body">Care continuity reminder — review <strong>sugar trend</strong>, medication adherence and this week's monitoring plan.</div>
            </div>
            <div className="card priority-card live-b">
              <div className="p-label live-t"><i className="ti ti-calendar"></i>Upcoming appointment</div>
              <div className="p-body"><strong>Dr. Smith</strong> · Endocrinology<br />Jul 30, 2026 · 4:30 pm</div>
            </div>
            <div className="card priority-card">
              <div className="p-label primary-t"><i className="ti ti-clipboard-check"></i>Daily task</div>
              <div className="p-body">Take <strong>Lisinopril 10mg</strong><br />2 of 3 doses logged today</div>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section>
          <div className="metric-grid">
            <div className="card">
              <div className="ring"><div className="ring-inner"></div></div>
              <div className="metric-label">Health score</div>
              <div className="metric-value">{dashboardData?.healthScore || 37}</div>
              <div className="metric-delta up">+5 pts · optimal range</div>
            </div>
            <div className="card">
              <div className="metric-label">Adherence</div>
              <div className="metric-value">100%</div>
              <div className="metric-delta down">−2% vs goal · target 90%</div>
            </div>
            <div className="card">
              <div className="metric-label">Active alerts</div>
              <div className="metric-value">{dashboardData?.recentHealthAlerts?.length || 1}</div>
              <div className="metric-delta">Glucose fluctuation</div>
            </div>
            <div className="card">
              <div className="metric-label">Next visit</div>
              <div className="metric-value" style={{ fontSize: "16px" }}>Tomorrow</div>
              <div className="metric-delta">10:00 am · video consult</div>
            </div>
          </div>
        </section>

        {/* Vitals snapshot */}
        <section>
          <div className="section-head">
            <div className="section-title">Vitals snapshot</div>
            <button onClick={() => navigate('/patient/health')} className="section-link bg-transparent border-none cursor-pointer">View observations →</button>
          </div>
          <div className="card">
            <div className="vitals-grid">
              <div className="vital">
                <div className="vital-icon blue"><i className="ti ti-heart-rate-monitor"></i></div>
                <div><div className="vital-name">Heart rate</div><div className="vital-val">78 <span>bpm</span></div></div>
              </div>
              <div className="vital">
                <div className="vital-icon"><i className="ti ti-activity"></i></div>
                <div><div className="vital-name">Blood pressure</div><div className="vital-val">128/82</div></div>
              </div>
              <div className="vital">
                <div className="vital-icon amber"><i className="ti ti-droplet"></i></div>
                <div><div className="vital-name">Glucose</div><div className="vital-val">142 <span>mg/dL</span></div></div>
              </div>
              <div className="vital">
                <div className="vital-icon"><i className="ti ti-lungs"></i></div>
                <div><div className="vital-name">Oxygen sat.</div><div className="vital-val">97 <span>%</span></div></div>
              </div>
            </div>
          </div>
        </section>

        {/* Two column layout: Health Analytics & Clinical Intelligence */}
        <section className="two-col">
          <div className="card chart-card">
            <div className="section-head">
              <div className="section-title">Health analytics</div>
              <button onClick={() => navigate('/patient/health')} className="section-link bg-transparent border-none cursor-pointer">Full report →</button>
            </div>
            <p className="chart-sub">30-day vitals trend · heart rate &amp; glucose telemetry</p>
            <svg className="spark" viewBox="0 0 400 130" preserveAspectRatio="none">
              <polyline fill="none" stroke="#38BDF8" strokeWidth="2" points="0,70 40,60 80,66 120,50 160,58 200,40 240,48 280,35 320,44 360,30 400,38"/>
              <polyline fill="none" stroke="#14B8A6" strokeWidth="2" points="0,100 40,95 80,105 120,90 160,98 200,85 240,92 280,80 320,88 360,75 400,82"/>
            </svg>
            <div style={{ display: "flex", gap: "16px", fontSize: "11.5px", color: "var(--ink-muted)" }}>
              <span><span style={{ display: "inline-block", width: "8px", height: "8px", background: "#38BDF8", borderRadius: "2px", marginRight: "5px" }}></span>Heart rate</span>
              <span><span style={{ display: "inline-block", width: "8px", height: "8px", background: "#14B8A6", borderRadius: "2px", marginRight: "5px" }}></span>Glucose</span>
            </div>
          </div>

          <div className="card ai-card">
            <div className="ai-head">
              <div className="ai-icon"><i className="ti ti-bulb"></i></div>
              <div className="ai-title">Clinical intelligence</div>
            </div>
            <div className="ai-body">Fluctuation detected — morning glucose has trended <strong style={{ color: "var(--ink)" }}>5% higher</strong> over the last 3 days. Consider reviewing the current diet plan with your care team.</div>
            <button onClick={() => navigate('/patient/care-plans')} className="btn"><i className="ti ti-clipboard-list"></i>Review diet plan</button>
          </div>
        </section>

        {/* Two column layout: Appointments & Prescriptions */}
        <section className="two-col">
          <div className="card">
            <div className="section-head">
              <div className="section-title">Upcoming appointments</div>
              <button onClick={() => navigate('/patient/book')} className="section-link bg-transparent border-none cursor-pointer">Book new →</button>
            </div>
            <div className="list-row">
              <div className="row-icon"><i className="ti ti-video"></i></div>
              <div className="row-main"><div className="row-title">Dr. Smith — Endocrinology</div><div className="row-sub">Jul 30 · 4:30 pm · Video consult</div></div>
              <span className="status-tag confirmed">Confirmed</span>
            </div>
            <div className="list-row">
              <div className="row-icon"><i className="ti ti-stethoscope"></i></div>
              <div className="row-main"><div className="row-title">Dr. Rao — Primary care</div><div className="row-sub">Aug 4 · 11:00 am · In-person</div></div>
              <span className="status-tag pending">Pending</span>
            </div>
            <div className="list-row">
              <div className="row-icon"><i className="ti ti-mood-smile"></i></div>
              <div className="row-main"><div className="row-title">Mental wellness check-in</div><div className="row-sub">Weekly · PHQ-9 screening due</div></div>
              <span className="status-tag pending">Due</span>
            </div>
          </div>

          <div className="card">
            <div className="section-head">
              <div className="section-title">Prescriptions</div>
              <button onClick={() => navigate('/patient/prescriptions')} className="section-link bg-transparent border-none cursor-pointer">See all →</button>
            </div>
            <div className="list-row">
              <div className="row-icon"><i className="ti ti-pill"></i></div>
              <div className="row-main"><div className="row-title">Lisinopril 10mg</div><div className="row-sub">Refill in 6 days</div></div>
            </div>
            <div className="list-row">
              <div className="row-icon"><i className="ti ti-pill"></i></div>
              <div className="row-main"><div className="row-title">Metformin 500mg</div><div className="row-sub">Refill overdue</div></div>
              <span className="status-tag refill">Refill</span>
            </div>
            <div className="list-row">
              <div className="row-icon"><i className="ti ti-truck-delivery"></i></div>
              <div className="row-main"><div className="row-title">Pharmacy delivery</div><div className="row-sub">Out for delivery · ETA 40 min</div></div>
            </div>
          </div>
        </section>

        {/* Bottom grid: Care & wellbeing */}
        <section>
          <div className="section-head"><div className="section-title">Care &amp; wellbeing</div></div>
          <div className="bottom-grid">
            <div className="card feature-card">
              <i className="ti ti-clipboard-heart"></i>
              <h3>Care plan progress</h3>
              <p>Physician-assigned diet and exercise routine, week 3 of 6.</p>
              <div className="progress-track"><div className="progress-fill" style={{ width: "52%" }}></div></div>
            </div>
            <div className="card feature-card">
              <i className="ti ti-users"></i>
              <h3>Family &amp; caregiver network</h3>
              <p>2 caregivers linked with monitoring access to your vitals and reminders.</p>
            </div>
            <div className="card feature-card">
              <i className="ti ti-message-chatbot"></i>
              <h3>AI health assistant</h3>
              <p>Ask about symptoms, medications, or navigating the platform — text or voice.</p>
              <button onClick={() => navigate('/patient/voice-assist')} className="btn ghost"><i className="ti ti-microphone"></i>Talk to assistant</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

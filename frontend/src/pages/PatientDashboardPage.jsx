import LanguageSwitcher from "../components/LanguageSwitcher";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "../services/telecareService";
import "./patient-dashboard-override.css";
import { buildLoginRedirect } from "../utils/authSession";
import { useLanguage } from "../context/LanguageContext";
import PatientSidebar from "../components/PatientSidebar";
import PharmacyDeliveryMap from "../components/pharmacy/PharmacyDeliveryMap";
import {
  LayoutDashboard,
  CalendarDays,
  Stethoscope,
  CalendarPlus,
  ClipboardList,
  Pill,
  Bell,
  Heart,
  Activity,
  BookOpen,
  Route,
  Eye,
  Folder,
  MessageCircle,
  Bot,
  Wallet,
  Mic,
  Smile,
  Users,
  BellRing,
  UserCircle,
  User,
  LogOut,
  ShieldCheck,
  Lock,
  HeartPulse,
  Droplets,
  AlertTriangle,
  ArrowRight,
  Check,
  Lightbulb,
  Compass,
  TrendingUp,
  ClipboardCheck,
  Circle
} from "lucide-react";

export default function PatientDashboardPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage() || { language: "en" };

  const [liveTime, setLiveTime] = useState("");

  const { data: dashboardData, isLoading } = useQuery({
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

  return (
    <div id="tcd-root">
      <div className="app">
        <PatientSidebar />

        <main id="page-main" role="main">
          <div className="topbar tcd-animate-in">
            <div>
              <h1 className="serif">Dashboard</h1>
              <p>Review updates, tasks, and care actions for today.</p>
              <div className="signed-in">
                <User />
                Signed in as {auth?.fullName || "Anita Patient"} · QA account
              </div>
            </div>
            <div className="topbar-right">
              <LanguageSwitcher customClass="lang" hideLabel />
              <button className="btn-ghost" onClick={handleLogout} aria-label="Log out of TeleCare+">
                <LogOut />Logout
              </button>
            </div>
          </div>

          <div className="section-head tcd-animate-in tcd-delay-1">
            <h2 className="serif">Today's care dashboard</h2>
            <div className="trust-badges">
              <span className="badge"><ShieldCheck />Verified care team</span>
              <span className="badge"><Lock />Secure data</span>
              <span className="badge" style={{ borderColor: 'transparent', color: 'var(--tcd-text-muted)' }}>
                <Activity size={12} style={{ color: 'var(--tcd-text-muted)' }} /> Live: {liveTime}
              </span>
            </div>
          </div>

          <div className="hero-row tcd-animate-in tcd-delay-1">
            <div className="status-card" role="region" aria-label="Health Status">
              {isLoading ? (
                <>
                  <div className="skeleton-block" style={{ height: '16px', width: '120px', marginBottom: '12px' }}></div>
                  <div className="skeleton-block" style={{ height: '32px', width: '240px', marginBottom: '12px' }}></div>
                  <div className="skeleton-block" style={{ height: '48px', width: '100%', marginBottom: '24px' }}></div>
                  <div className="skeleton-block" style={{ height: '24px', width: '100px' }}></div>
                </>
              ) : (
                <>
                  <div className="status-eyebrow">Today's health status</div>
                  <div className="status-title serif">Needs attention</div>
                  <p className="status-sub">
                    Your latest readings need a closer look. Review the alert below and follow the recommended action.
                  </p>
                  <span className="status-pill">Needs attention</span>

                  <div className="status-metrics">
                    <div className="status-metric">
                      <div className="label"><HeartPulse />Blood pressure</div>
                      <div className="value dim">No reading</div>
                    </div>
                    
                    {/* EDGE CASE: Empty state demonstration */}
                    <div className="status-metric" style={{ flex: 1, minWidth: '150px' }}>
                      <div className="label"><Droplets />Sugar</div>
                      <div className="empty-state" style={{ padding: '8px 0', alignItems: 'flex-start', textAlign: 'left' }}>
                        <p style={{ fontSize: '12px', opacity: 0.7 }}>Log a reading to unlock insights</p>
                      </div>
                    </div>

                    <div className="status-metric">
                      <div className="label"><Smile />Mood snapshot</div>
                      <div className="value">Routine</div>
                    </div>
                    <div className="status-wave">
                      <svg width="120" height="30" viewBox="0 0 120 30" aria-hidden="true">
                        <polyline points="0,15 16,15 22,6 28,24 34,15 44,15 50,10 55,20 60,15 120,15"
                          fill="none" stroke="#4FB3A0" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"
                          strokeDasharray="180" strokeDashoffset="180">
                          <animate attributeName="stroke-dashoffset" from="180" to="0" dur="1.8s" repeatCount="indefinite" />
                        </polyline>
                      </svg>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="side-col">
              <div className="mini-card" role="region" aria-label="Next best action">
                {isLoading ? (
                  <>
                    <div className="skeleton-block" style={{ height: '16px', width: '100px', marginBottom: '16px' }}></div>
                    <div className="skeleton-block" style={{ height: '24px', width: '180px', marginBottom: '8px' }}></div>
                    <div className="skeleton-block" style={{ height: '40px', width: '100%' }}></div>
                  </>
                ) : (
                  <>
                    <div className="mini-label"><AlertTriangle />Next best action</div>
                    <h3>Review active alerts</h3>
                    <p className="mini-sub">Readings are outside your expected telemonitoring range.</p>
                    <div className="mini-actions">
                      <button className="btn-teal">View alerts <ArrowRight /></button>
                    </div>
                  </>
                )}
              </div>
              <div className="mini-card" role="region" aria-label="Upcoming appointment">
                {isLoading ? (
                  <>
                    <div className="skeleton-block" style={{ height: '16px', width: '120px', marginBottom: '16px' }}></div>
                    <div className="skeleton-block" style={{ height: '24px', width: '150px', marginBottom: '8px' }}></div>
                    <div className="skeleton-block" style={{ height: '16px', width: '100px' }}></div>
                  </>
                ) : (
                  <>
                    <div className="mini-label"><CalendarDays />Upcoming appointment</div>
                    <h3>Dr. Arjun Mehta</h3>
                    <p className="mini-sub mono">Tue, 21 Jul · 11:15 am</p>
                    <div className="mini-actions">
                      <button className="btn-outline">View details</button>
                      <button className="btn-teal">Join / message</button>
                    </div>
                  </>
                )}
              </div>
              <div className="mini-card" role="region" aria-label="Community & Gamification">
                <div className="mini-label" style={{color: '#f59e0b'}}><Circle fill="#f59e0b" size={12}/>Gamification & Streaks</div>
                <h3>7-Day Adherence Streak!</h3>
                <p className="mini-sub">You earned 500 points this week. You are in the Top 10% of patients.</p>
                <div className="mini-actions mt-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm bg-amber-50 p-2 rounded border border-amber-200">
                    <span className="font-bold text-amber-700">#4289 (You)</span>
                    <span className="font-mono text-amber-600">1,250 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded">
                    <span className="font-medium text-slate-600">#1942</span>
                    <span className="font-mono text-slate-500">1,100 pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="metrics-row tcd-animate-in tcd-delay-2">
            <div className="metric-card">
              <div className="top">
                <span className="label">Health score</span>
                <span className="icon-circle c-coral"><Activity /></span>
              </div>
              {isLoading ? <div className="skeleton-block" style={{ height: '36px', width: '50px' }}></div> : (
                <div className="value mono">{dashboardData?.riskScore ?? 0}</div>
              )}
              <div className="sub">Calculated from recent risk signals</div>
            </div>
            <div className="metric-card">
              <div className="top">
                <span className="label">Medication adherence</span>
                <span className="icon-circle c-teal"><Pill /></span>
              </div>
              {isLoading ? <div className="skeleton-block" style={{ height: '36px', width: '80px' }}></div> : (
                <div className="value mono">{dashboardData?.adherencePercentage ?? 0}<span>%</span></div>
              )}
              <div className="sub">{dashboardData?.pendingMedicationReminders ?? 0} reminders pending</div>
            </div>
            <div className="metric-card">
              <div className="top">
                <span className="label">Active alerts</span>
                <span className="icon-circle c-brass pulse-animation"><BellRing /></span>
              </div>
              {isLoading ? <div className="skeleton-block" style={{ height: '36px', width: '40px' }}></div> : (
                <div className="value mono">{dashboardData?.recentHealthAlerts?.length ?? 0}</div>
              )}
              <div className="sub">Review these first today</div>
            </div>
            <div className="metric-card">
              <div className="top">
                <span className="label">Upcoming appointments</span>
                <span className="icon-circle c-teal"><CalendarDays /></span>
              </div>
              {isLoading ? <div className="skeleton-block" style={{ height: '36px', width: '40px' }}></div> : (
                <div className="value mono">{dashboardData?.pendingAppointments ?? 0}</div>
              )}
              <div className="sub">One visit scheduled</div>
            </div>
          </div>

          {window.location.hash === "#delivery" && (
            <div className="mb-6 tcd-animate-in tcd-delay-3">
              <h2 className="serif text-white mb-4">Live Pharmacy Delivery Tracker</h2>
              <PharmacyDeliveryMap />
            </div>
          )}

          <div className="lower-row tcd-animate-in tcd-delay-3">
            <div className="panel" role="region" aria-label="Health Trends">
              <h2 className="serif">Health trends</h2>
              {isLoading ? (
                <div style={{ display: 'flex', gap: '12px', height: '100px' }}>
                  <div className="skeleton-block" style={{ flex: 1, height: '100%' }}></div>
                  <div className="skeleton-block" style={{ flex: 1, height: '100%' }}></div>
                  <div className="skeleton-block" style={{ flex: 1, height: '100%' }}></div>
                  <div className="skeleton-block" style={{ flex: 1, height: '100%' }}></div>
                </div>
              ) : (
                <>
                  <div className="week-row">
                    <span className="wk-label">This week — recent care consistency</span>
                    <span className="wk-tag">7 days</span>
                  </div>
                  <div className="days">
                    <div className="day done">
                      <div className="dlabel">M</div>
                      <div className="ddot" aria-label="Completed"><Check /></div>
                    </div>
                    <div className="day done">
                      <div className="dlabel">T</div>
                      <div className="ddot" aria-label="Completed"><Check /></div>
                    </div>
                    <div className="day">
                      <div className="dlabel">W</div>
                      <div className="ddot" aria-label="Not completed"></div>
                    </div>
                    <div className="day">
                      <div className="dlabel">T</div>
                      <div className="ddot" aria-label="Not completed"></div>
                    </div>
                    <div className="day">
                      <div className="dlabel">F</div>
                      <div className="ddot" aria-label="Not completed"></div>
                    </div>
                    <div className="day">
                      <div className="dlabel">S</div>
                      <div className="ddot" aria-label="Not completed"></div>
                    </div>
                    <div className="day">
                      <div className="dlabel">S</div>
                      <div className="ddot" aria-label="Not completed"></div>
                    </div>
                  </div>
                  <div className="insight-box">
                    <div className="itag"><Lightbulb />Care insight</div>
                    <p style={{ fontSize: '13px', color: 'var(--tcd-text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>
                      Your dashboard is prioritizing this review because an alert is still active.
                    </p>
                    <ul>
                      <li><Circle size={10} style={{ fill: 'currentColor' }} />Take scheduled medications</li>
                      <li><Circle size={10} style={{ fill: 'currentColor' }} />Review upcoming follow-up</li>
                      <li><Circle size={10} style={{ fill: 'currentColor' }} />Complete mental health check-in</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            <div className="panel" role="region" aria-label="Clinical Intelligence">
              <h2 className="serif">Clinical intelligence</h2>
              
              {isLoading ? (
                <>
                  <div className="skeleton-block" style={{ height: '60px', width: '100%', marginBottom: '16px' }}></div>
                  <div className="skeleton-block" style={{ height: '60px', width: '100%', marginBottom: '16px' }}></div>
                  <div className="skeleton-block" style={{ height: '60px', width: '100%' }}></div>
                </>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: { transition: { staggerChildren: 0.1 } },
                    hidden: {}
                  }}
                >
                  <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="feed-row">
                    <div className="feed-icon"><Compass /></div>
                    <div className="feed-body">
                      <h4>Adherence coach</h4>
                      <p>Risk score 13% · 3 of 6 recent doses missed. Consider smaller, more consistent reminder goals.</p>
                      <a href="#">View coaching guidance <ArrowRight size={12} /></a>
                    </div>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="feed-row">
                    <div className="feed-icon"><TrendingUp /></div>
                    <div className="feed-body">
                      <h4>Health trend explainer</h4>
                      <p>Latest BP was derived from your most recorded vitals. Trends are supportive, not diagnostic.</p>
                      <a href="#">View trend detail <ArrowRight size={12} /></a>
                    </div>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="feed-row">
                    <div className="feed-icon"><ClipboardCheck /></div>
                    <div className="feed-body">
                      <h4>Smart follow-up planner</h4>
                      <p className="feed-meta mono">Follow-up date · 2026-07-28 &nbsp;·&nbsp; Risk profile · Routine</p>
                      <a href="#">View follow-up plan <ArrowRight size={12} /></a>
                    </div>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="feed-row">
                    <div className="feed-icon"><Route /></div>
                    <div className="feed-body">
                      <h4>Journey orchestrator</h4>
                      <p>Your 7–14 day care checklist. Latest triage completed 2026-06-10 — routine consultation.</p>
                      <a href="#">View journey checklist <ArrowRight size={12} /></a>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

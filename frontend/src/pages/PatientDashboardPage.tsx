import LanguageSwitcher from "../components/LanguageSwitcher";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "../services/telecareService";
import { buildLoginRedirect } from "../utils/authSession";
import { useLanguage } from "../context/LanguageContext";
import PatientSidebar from "../components/PatientSidebar";
import PharmacyDeliveryMap from "../components/pharmacy/PharmacyDeliveryMap";
import TrendSparkline from "../components/charts/TrendSparkline";
import ProgressRing from "../components/charts/ProgressRing";
import HealthAnalyticsChart from "../components/charts/HealthAnalyticsChart";
import PriorityActionsCard from "../components/ui/PriorityActionsCard";
import AnimatedCounter from "../components/ui/AnimatedCounter";
import { motion } from "framer-motion";
import { staggerContainer, fadeInUp, hoverLift } from "../utils/motionVariants";
import {
  CalendarDays,
  Activity,
  HeartPulse,
  Droplets,
  AlertTriangle,
  ArrowRight,
  Pill,
  BellRing,
  User,
  LogOut,
  ShieldCheck,
  Lock,
  Lightbulb,
  TrendingUp,
  ClipboardCheck
} from "lucide-react";
import { DynamicStateObject, DynamicState } from "./../types/DynamicState";

export default function PatientDashboardPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { t = (key: DynamicStateObject) => key } = useLanguage() || { language: "en", t: (key: DynamicStateObject) => key };

  const [liveTime, setLiveTime] = useState<DynamicState>("");

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
    <div className="flex h-screen w-full bg-[var(--tc-bg)] text-[var(--tc-text)] font-sans overflow-hidden">
      {/* 280px Fixed Width Desktop Sidebar */}
      <PatientSidebar />

      {/* Main Content Workspace (Elastic 100% Remaining Width) */}
      <main className="flex-1 w-full min-w-0 min-h-0 overflow-y-auto relative z-0 p-4 sm:p-6 lg:p-8" role="main">
        <div className="max-w-[1600px] mx-auto w-full space-y-6 pb-20">

          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--tc-surface-elevated)] border border-[var(--tc-border)] rounded-2xl p-6 shadow-sm">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
                {t("dashboard") || "Dashboard"}
              </h1>
              <p className="text-[var(--tc-text-muted)] text-sm mb-3">
                {t("reviewUpdatesTasksAndCareActionsForToday") || "Review updates, tasks, and care actions for today."}
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--tc-text-muted)] bg-[var(--tc-surface)] border border-[var(--tc-border)] px-3 py-1.5 rounded-full">
                <User size={14} className="text-[var(--primary)]" />
                Signed in as <span className="text-white font-semibold">{auth?.fullName || "Anita Patient"}</span> · QA account
              </div>
            </div>
            <div className="flex items-center gap-3 self-end md:self-center">
              <LanguageSwitcher hideLabel />
              <button 
                onClick={handleLogout} 
                aria-label="Log out of TeleCare+"
                className="inline-flex items-center gap-2 px-4 py-2 bg-transparent text-[var(--tc-text-muted)] border border-[var(--tc-border)] rounded-xl text-sm font-medium hover:bg-[var(--tc-surface-muted)] hover:text-white transition-colors"
              >
                <LogOut size={16} />
                {t("logout") || "Logout"}
              </button>
            </div>
          </div>

          {/* Today's Care Dashboard Status Sub-bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="font-display text-xl font-bold tracking-tight text-white">
              {t("todaySCareDashboard") || "Today's Care Overview"}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-[var(--tc-surface)] border border-[var(--tc-border)] text-[var(--tc-text-muted)] font-medium">
                <ShieldCheck size={14} className="text-[var(--primary)]" />
                {t("verifiedCareTeam") || "Verified care team"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-[var(--tc-surface)] border border-[var(--tc-border)] text-[var(--tc-text-muted)] font-medium">
                <Lock size={14} className="text-[var(--primary)]" />
                {t("secureData") || "Secure data"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 text-[var(--tc-text-muted)] font-mono font-medium">
                <Activity size={14} className="text-[var(--primary)]" /> Live: {liveTime}
              </span>
            </div>
          </div>

          {/* Hero Row (12-Column CSS Grid) */}
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Priority Actions (col-span-7) */}
            <div className="lg:col-span-7 h-full flex flex-col min-w-0">
              <PriorityActionsCard 
                isLoading={isLoading}
                alerts={dashboardData?.recentHealthAlerts || []}
                appointments={dashboardData?.pendingAppointments > 0 ? [{ doctorName: "Dr. Smith", date: new Date().toISOString() }] : []}
                tasks={["Log Morning Blood Pressure", "Take Lisinopril 10mg"]}
              />
            </div>

            {/* Health Status Card (col-span-5) */}
            <div className="lg:col-span-5 h-full flex flex-col min-w-0">
              <div className="glass-card relative flex flex-col justify-between h-full p-6" role="region" aria-label="Health Status">
                <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl ${dashboardData?.riskLevel === 'CRITICAL' || dashboardData?.recentHealthAlerts?.some((a: DynamicStateObject) => a.includes('CRITICAL')) ? 'bg-rose-500' : 'bg-gradient-to-r from-[var(--primary-dark)] to-[var(--primary)]'}`}></div>
                
                {dashboardData?.riskLevel === 'CRITICAL' || dashboardData?.recentHealthAlerts?.some((a: DynamicStateObject) => a.includes('CRITICAL')) ? (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 mb-4 flex items-start gap-3 text-rose-500 animate-pulse">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm">{t("criticalHealthAlert") || "Critical Health Alert"}</h4>
                      <p className="text-sm mt-1">{t("yourRecentVitalsAreCriticallyOutOfRangePleaseContactEmergencyServicesImmediatelyOrGoToTheNearestEmergencyRoom") || "Your recent vitals are critically out of range. Please contact emergency services immediately or go to the nearest emergency room."}</p>
                    </div>
                  </div>
                ) : null}

                {isLoading ? (
                  <div className="animate-pulse flex flex-col gap-4">
                    <div className="h-4 bg-white/10 rounded w-1/4"></div>
                    <div className="h-10 bg-white/10 rounded w-1/2"></div>
                    <div className="h-16 bg-white/10 rounded w-full"></div>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-[var(--tc-text-muted)] font-bold mb-2">{t('todaysHealthStatus') || "Today's Health Status"}</div>
                      <div className="font-display text-3xl sm:text-4xl text-rose-500 font-bold mb-3 leading-tight">{t('needsAttention') || "Needs Attention"}</div>
                      <p className="text-[var(--tc-text-muted)] text-sm leading-relaxed mb-6">
                        {t('needsAttentionDesc') || "Your latest readings need a closer look. Review the alert below and follow the recommended action."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--tc-border-subtle)]">
                      <button className="btn-primary py-2.5 px-3 bg-[var(--tc-surface-elevated)] text-[var(--tc-text)] hover:bg-[var(--tc-surface-muted)] transition-colors border border-[var(--tc-border)] rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                        <HeartPulse size={16} className="text-rose-400 shrink-0" />
                        <span>{t("logBloodPressure") || "Log BP"}</span>
                      </button>
                      <button className="btn-primary py-2.5 px-3 bg-[var(--tc-surface-elevated)] text-[var(--tc-text)] hover:bg-[var(--tc-surface-muted)] transition-colors border border-[var(--tc-border)] rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                        <Droplets size={16} className="text-blue-400 shrink-0" />
                        <span>{t("logSugar") || "Log Sugar"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Row (12-Column CSS Grid - 4 Cards at 3 columns each) */}
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6">
            
            {/* Health Score Card (col-span-3) */}
            <motion.div variants={fadeInUp as any} whileHover={hoverLift as any} className="lg:col-span-3 glass-card flex flex-col justify-between p-6 group h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs text-[var(--tc-text-secondary)] font-bold tracking-wide uppercase">{t("healthScore") || "Health Score"}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full flex items-center border border-emerald-400/20">
                      <TrendingUp size={10} className="mr-1"/> +5 pts
                    </span>
                  </div>
                </div>
                <div className="relative shrink-0">
                  <ProgressRing progress={dashboardData?.riskScore || 85} size={52} strokeWidth={5} color="var(--primary)" label={dashboardData?.riskScore || 85} />
                </div>
              </div>
              <div className="text-xs text-[var(--tc-text-muted)] font-medium pt-2 border-t border-[var(--tc-border-subtle)]">{t("optimalRangeKeepItUp") || "Optimal range. Keep it up!"}</div>
            </motion.div>

            {/* Adherence Card (col-span-3) */}
            <motion.div variants={fadeInUp as any} whileHover={hoverLift as any} className="lg:col-span-3 glass-card flex flex-col justify-between p-6 group h-full">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs text-[var(--tc-text-secondary)] font-bold tracking-wide uppercase">{t("adherence") || "Adherence"}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full flex items-center border border-rose-400/20">
                      <Activity size={10} className="mr-1"/> -2%
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-dim)] text-[var(--primary)] flex items-center justify-center shrink-0 border border-[var(--primary)]/20">
                  <Pill size={18} />
                </div>
              </div>
              {isLoading ? <div className="animate-pulse h-8 w-20 bg-white/10 rounded mb-1"></div> : (
                <div className="font-display font-bold tracking-tight text-white text-3xl mb-1">
                  <AnimatedCounter value={dashboardData?.adherencePercentage ?? 92} />
                  <span className="text-lg text-[var(--tc-text-muted)] ml-1">%</span>
                </div>
              )}
              <div className="w-full h-1.5 bg-white/10 rounded-full mt-1 mb-2">
                <div className="h-full bg-[var(--primary)] rounded-full shadow-[0_0_8px_var(--primary)]" style={{ width: `${dashboardData?.adherencePercentage ?? 92}%` }}></div>
              </div>
              <div className="text-[11px] text-[var(--tc-text-muted)] font-medium">Goal: &gt;90%</div>
            </motion.div>

            {/* Active Alerts Card (col-span-3) */}
            <motion.div variants={fadeInUp as any} whileHover={hoverLift as any} className="lg:col-span-3 glass-card flex flex-col justify-between p-6 group h-full">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-[var(--tc-text-secondary)] font-bold tracking-wide uppercase">{t("activeAlerts") || "Active Alerts"}</span>
                <span className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shrink-0">
                  <BellRing size={16} className={dashboardData?.recentHealthAlerts?.length > 0 ? "animate-wiggle" : ""} />
                </span>
              </div>
              {isLoading ? <div className="animate-pulse h-10 w-12 bg-white/10 rounded mb-1"></div> : (
                <div className="font-display font-bold tracking-tight text-white text-3xl mb-1">
                  <AnimatedCounter value={dashboardData?.recentHealthAlerts?.length ?? 1} />
                </div>
              )}
              <div className="h-10 mt-auto pt-2 border-t border-[var(--tc-border-subtle)]">
                <TrendSparkline data={[{val: 3}, {val: 2}, {val: 4}, {val: 1}, {val: 1}]} dataKey="val" color="#f43f5e" height={30} />
              </div>
            </motion.div>

            {/* Upcoming Visits Card (col-span-3) */}
            <motion.div variants={fadeInUp as any} whileHover={hoverLift as any} className="lg:col-span-3 glass-card flex flex-col justify-between p-6 group h-full">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs text-[var(--tc-text-secondary)] font-bold tracking-wide uppercase">{t("upcoming") || "Upcoming Visits"}</span>
                <span className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                  <CalendarDays size={16} />
                </span>
              </div>
              {isLoading ? <div className="animate-pulse h-10 w-12 bg-white/10 rounded mb-1"></div> : (
                <div className="font-display font-bold tracking-tight text-white text-3xl mb-1">
                  <AnimatedCounter value={dashboardData?.pendingAppointments ?? 2} />
                </div>
              )}
              <div className="mt-auto bg-[var(--tc-surface-elevated)] border border-[var(--tc-border)] rounded-lg p-2 text-xs text-[var(--tc-text-secondary)] flex items-center gap-2 font-medium">
                 <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></div>
                 <span>Tomorrow, 10:00 AM</span>
              </div>
            </motion.div>

          </motion.div>

          {/* Live Delivery Tracker (WebSocket feature) */}
          {window.location.hash === "#delivery" && (
            <div className="animate-fadeSlideUp live-pulse rounded-2xl overflow-hidden">
              <div className="glass-card p-6 border-none">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <h2 className="font-display text-xl font-bold text-[var(--tc-text)]">{t("livePharmacyDeliveryTracker") || "Live Pharmacy Delivery Tracker"}</h2>
                </div>
                <PharmacyDeliveryMap />
              </div>
            </div>
          )}

          {/* Health Analytics Chart & Clinical AI Insights (12-Column CSS Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Health Analytics Chart (col-span-7) */}
            <div className="lg:col-span-7 glass-card flex flex-col justify-between p-6 min-w-0" role="region" aria-label="Health Trends">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h2 className="font-display text-lg font-bold text-white tracking-tight">{t("healthAnalytics") || "Health Analytics"}</h2>
                  <p className="text-xs text-[var(--tc-text-muted)]">30-day vitals trend & diagnostic telemetry</p>
                </div>
                <button className="text-[12px] font-bold text-[var(--primary)] hover:text-white transition-colors inline-flex items-center gap-1 bg-[var(--primary-dim)] px-3 py-1.5 rounded-full self-start sm:self-auto border border-[var(--primary)]/20">
                  <span>{t("viewFullReport") || "View Full Report"}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
              <div className="w-full h-[320px] min-h-[300px]">
                <HealthAnalyticsChart />
              </div>
            </div>

            {/* Clinical Intelligence Card (col-span-5) */}
            <div className="lg:col-span-5 glass-card flex flex-col justify-between p-6 min-w-0" role="region" aria-label="Clinical Intelligence">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-lg font-bold text-white tracking-tight">{t("clinicalIntelligence") || "Clinical Intelligence"}</h2>
                  <p className="text-xs text-[var(--tc-text-muted)]">Real-time AI health risk recommendations</p>
                </div>
                <span className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border border-purple-500/30 shrink-0">
                  {t("aIDriven") || "AI Driven"}
                </span>
              </div>
              
              <div className="space-y-4 flex-1">
                {/* Fluctuation Detected */}
                <div className="bg-[var(--tc-surface-elevated)] border border-[var(--tc-border)] rounded-xl p-4 flex gap-3.5 items-start hover:border-[var(--primary)]/50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                    <Lightbulb size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white mb-1">{t("fluctuationDetected") || "Fluctuation Detected"}</h4>
                    <p className="text-xs text-[var(--tc-text-muted)] leading-relaxed mb-3">Your morning glucose has been trending 5% higher over the last 3 days. Consider reviewing your diet plan.</p>
                    <button className="text-[11px] font-bold text-white bg-[var(--tc-surface)] hover:bg-[var(--tc-surface-muted)] border border-[var(--tc-border-strong)] px-3 py-1 rounded-lg transition-colors">
                      {t("reviewDietPlan") || "Review Diet Plan"}
                    </button>
                  </div>
                </div>

                {/* Medication Refill Needed */}
                <div className="bg-[var(--tc-surface-elevated)] border border-[var(--tc-border)] rounded-xl p-4 flex gap-3.5 items-start hover:border-[var(--primary)]/50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                    <ClipboardCheck size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white mb-1">{t("medicationRefillNeeded") || "Medication Refill Needed"}</h4>
                    <p className="text-xs text-[var(--tc-text-muted)] leading-relaxed mb-3">{t("lisinoprilSupplyIsRunningLowBasedOnYourAdherenceRateAutoRefillCanBeInitiated") || "Lisinopril supply is running low based on your adherence rate. Auto-refill can be initiated."}</p>
                    <button className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 px-3 py-1 rounded-lg transition-colors">
                      {t("requestRefill") || "Request Refill"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

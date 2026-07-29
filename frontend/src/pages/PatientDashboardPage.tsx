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
  Smile,
  AlertTriangle,
  ArrowRight,
  Pill,
  BellRing,
  User,
  LogOut,
  ShieldCheck,
  Lock,
  Check,
  Circle,
  Lightbulb,
  Compass,
  TrendingUp,
  ClipboardCheck
} from "lucide-react";
import { DynamicStateObject, DynamicState } from "./../types/DynamicState";

export default function PatientDashboardPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t= (key: DynamicStateObject) => key  } = useLanguage() || { language: "en", t: (key: DynamicStateObject) => key };

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
    <div className="h-full w-full bg-[var(--tc-bg)] text-[var(--tc-text)] font-sans flex flex-col overflow-hidden lg:flex-row">
      <PatientSidebar />

      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 -1 p-6 lg:p-10 min-w-0" role="main">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeSlideUp">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">{t("dashboard") || "Dashboard"}</h1>
            <p className="text-[var(--tc-text-muted)] text-sm mb-3">{t("reviewUpdatesTasksAndCareActionsForToday") || "Review updates, tasks, and care actions for today."}</p>
            <div className="inline-flex items-center gap-2 text-xs text-[var(--tc-text-muted)] bg-[var(--tc-surface)] border border-[var(--tc-border)] px-3 py-1.5 rounded-full">
              <User size={14} />
              Signed in as {auth?.fullName || "Anita Patient"} · QA account
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher hideLabel />
            <button 
              onClick={handleLogout} 
              aria-label="Log out of TeleCare+"
              className="inline-flex items-center gap-2 px-4 py-2 bg-transparent text-[var(--tc-text-muted)] border border-[var(--tc-border)] rounded-element text-sm font-medium hover:bg-[var(--tc-surface-muted)] hover:text-[var(--tc-text)] transition-colors"
            >
              <LogOut size={16} />{t("logout") || "Logout"}</button>
          </div>
        </div>

        {/* Section Head */}
        <div className="flex justify-between items-end mb-6 animate-fadeSlideUp" style={{animationDelay: '0.1s'}}>
          <h2 className="font-display text-xl font-medium">{t("todaySCareDashboard") || "Today's care dashboard"}</h2>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[var(--tc-surface)] border border-[var(--tc-border)] text-[var(--tc-text-muted)]">
              <ShieldCheck size={12} className="text-[var(--primary)]" />{t("verifiedCareTeam") || "Verified care team"}</span>
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[var(--tc-surface)] border border-[var(--tc-border)] text-[var(--tc-text-muted)]">
              <Lock size={12} className="text-[var(--primary)]" />{t("secureData") || "Secure data"}</span>
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 text-[var(--tc-text-muted)]">
              <Activity size={12} /> Live: {liveTime}
            </span>
          </div>
        </div>

        {/* Hero Row: Action Hierarchy */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 mb-8">
          
          {/* Priority Actions (New Unified Hub) */}
          <div className="h-full">
            <PriorityActionsCard 
              isLoading={isLoading}
              alerts={dashboardData?.recentHealthAlerts || []}
              appointments={dashboardData?.pendingAppointments > 0 ? [{ doctorName: "Dr. Smith", date: new Date().toISOString() }] : []} // Mocking appt for UI demo based on pending count
              tasks={["Log Morning Blood Pressure", "Take Lisinopril 10mg"]}
            />
          </div>

          {/* Status Card (Moved to secondary position, simplified) */}
          <div className="glass-card relative flex flex-col justify-between" role="region" aria-label="Health Status">
            <div className={`absolute top-0 left-0 right-0 h-1 ${dashboardData?.riskLevel === 'CRITICAL' || dashboardData?.recentHealthAlerts?.some((a: DynamicStateObject) => a.includes('CRITICAL')) ? 'bg-rose-500' : 'bg-gradient-to-r from-[var(--primary-dark)] to-[var(--primary)]'}`}></div>
            
            {dashboardData?.riskLevel === 'CRITICAL' || dashboardData?.recentHealthAlerts?.some((a: DynamicStateObject) => a.includes('CRITICAL')) ? (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 mb-4 flex items-start gap-3 text-rose-500 animate-pulse">
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
              <>
                <div className="text-xs uppercase tracking-widest text-[var(--tc-text-muted)] mb-3">{t('todaysHealthStatus') || "Today's health status"}</div>
                <div className="font-display text-4xl text-rose-500 mb-4 leading-tight">{t('needsAttention') || "Needs attention"}</div>
                <p className="text-[var(--tc-text-muted)] mb-6 max-w-[80%] leading-relaxed">
                  {t('needsAttentionDesc') || "Your latest readings need a closer look. Review the alert below and follow the recommended action."}
                </p>

                <div className="flex gap-4 items-end pt-4 mt-auto">
                  <button className="flex-1 btn-primary py-2.5 bg-tc-surface-elevated text-tc-text hover:bg-tc-surface-muted transition-colors border border-tc-border border-dashed">
                    <HeartPulse size={16} className="inline mr-2 text-rose-400" />
                    {t("logBloodPressure") || "Log BP"}
                  </button>
                  <button className="flex-1 btn-primary py-2.5 bg-tc-surface-elevated text-tc-text hover:bg-tc-surface-muted transition-colors border border-tc-border border-dashed">
                    <Droplets size={16} className="inline mr-2 text-blue-400" />
                    {t("logSugar") || "Log Sugar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Metrics Row */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Health Score Card */}
          <motion.div variants={fadeInUp as any} whileHover={hoverLift as any} className="glass-card flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[13px] text-[var(--tc-text-secondary)] font-bold tracking-wide uppercase">{t("healthScore") || "Health score"}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full flex items-center border border-emerald-400/20">
                    <TrendingUp size={10} className="mr-1"/> +5 pts
                  </span>
                </div>
              </div>
              <div className="relative">
                <ProgressRing progress={dashboardData?.riskScore || 85} size={50} strokeWidth={4} color="var(--primary)" label={dashboardData?.riskScore || 85} />
              </div>
            </div>
            <div className="text-xs text-[var(--tc-text-muted)] font-medium">{t("optimalRangeKeepItUp") || "Optimal range. Keep it up!"}</div>
          </motion.div>

          {/* Adherence Card */}
          <motion.div variants={fadeInUp as any} whileHover={hoverLift as any} className="glass-card flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[13px] text-[var(--tc-text-secondary)] font-bold tracking-wide uppercase">{t("adherence") || "Adherence"}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full flex items-center border border-rose-400/20">
                    <Activity size={10} className="mr-1"/> -2%
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[var(--primary-dim)] text-[var(--primary)] flex items-center justify-center shadow-[var(--tc-shadow-sm)]">
                <Pill size={18} />
              </div>
            </div>
            {isLoading ? <div className="animate-pulse h-8 w-20 bg-white/10 rounded mb-1"></div> : (
              <div className="font-display font-bold tracking-tight text-white text-3xl mb-1">
                <AnimatedCounter value={dashboardData?.adherencePercentage ?? 92} />
                <span className="text-lg text-[var(--tc-text-muted)] ml-1">%</span>
              </div>
            )}
            <div className="w-full h-1 bg-white/10 rounded-full mt-1 mb-2">
              <div className="h-full bg-[var(--primary)] rounded-full shadow-[0_0_8px_var(--primary)]" style={{ width: `${dashboardData?.adherencePercentage ?? 92}%` }}></div>
            </div>
            <div className="text-[11px] text-[var(--tc-text-muted)] font-medium">Goal: &gt;90%</div>
          </motion.div>

          {/* Active Alerts Card */}
          <motion.div variants={fadeInUp as any} whileHover={hoverLift as any} className="glass-card flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[13px] text-[var(--tc-text-secondary)] font-bold tracking-wide uppercase">{t("activeAlerts") || "Active alerts"}</span>
              <span className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                <BellRing size={14} className={dashboardData?.recentHealthAlerts?.length > 0 ? "animate-wiggle" : ""} />
              </span>
            </div>
            {isLoading ? <div className="animate-pulse h-10 w-12 bg-white/10 rounded mb-1"></div> : (
              <div className="font-display font-bold tracking-tight text-white text-3xl mb-1">
                <AnimatedCounter value={dashboardData?.recentHealthAlerts?.length ?? 1} />
              </div>
            )}
            <div className="h-10 mt-auto">
              {/* Mini Sparkline for Alerts over time */}
              <TrendSparkline data={[{val: 3}, {val: 2}, {val: 4}, {val: 1}, {val: 1}]} dataKey="val" color="#f43f5e" height={30} />
            </div>
          </motion.div>

          {/* Upcoming Visits Card */}
          <motion.div variants={fadeInUp as any} whileHover={hoverLift as any} className="glass-card flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[13px] text-[var(--tc-text-secondary)] font-bold tracking-wide uppercase">{t("upcoming") || "Upcoming"}</span>
              <span className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <CalendarDays size={14} />
              </span>
            </div>
            {isLoading ? <div className="animate-pulse h-10 w-12 bg-white/10 rounded mb-1"></div> : (
              <div className="font-display font-bold tracking-tight text-white text-3xl mb-1">
                <AnimatedCounter value={dashboardData?.pendingAppointments ?? 2} />
              </div>
            )}
            <div className="mt-auto bg-[var(--tc-surface-elevated)] border border-[var(--tc-border)] rounded-lg p-2 text-xs text-[var(--tc-text-secondary)] flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
               Tomorrow, 10:00 AM
            </div>
          </motion.div>
        </motion.div>

        {/* Live Tracking (WebSocket features) */}
        {window.location.hash === "#delivery" && (
          <div className="mb-8 animate-fadeSlideUp live-pulse rounded-card" style={{animationDelay: '0.3s'}}>
            <div className="glass-card !bg-transparent border-none">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-live animate-pulse"></div>
                <h2 className="font-display text-xl text-[var(--tc-text)]">{t("livePharmacyDeliveryTracker") || "Live Pharmacy Delivery Tracker"}</h2>
              </div>
              <PharmacyDeliveryMap />
            </div>
          </div>
        )}
        {/* Lower Row */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
          
          <div className="glass-card flex flex-col" role="region" aria-label="Health Trends">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-lg font-bold text-white tracking-tight">{t("healthAnalytics") || "Health analytics"}</h2>
              <button className="text-[12px] font-bold text-[var(--primary)] hover:text-white transition-colors flex items-center gap-1 bg-[var(--primary-dim)] px-3 py-1 rounded-full">
                {t("viewFullReport") || "View Full Report"}<ArrowRight size={12} />
              </button>
            </div>
            <div className="flex-1 h-[300px]">
              <HealthAnalyticsChart />
            </div>
          </div>

          <div className="glass-card flex flex-col" role="region" aria-label="Clinical Intelligence">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-lg font-bold text-white tracking-tight">{t("clinicalIntelligence") || "Clinical intelligence"}</h2>
              <span className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-purple-500/30">
                {t("aIDriven") || "AI Driven"}</span>
            </div>
            
            <div className="flex-1 flex flex-col gap-4">
              {/* Intelligence Items */}
              <div className="bg-[var(--tc-surface-elevated)] border border-[var(--tc-border)] rounded-xl p-4 flex gap-4 items-start hover:border-[var(--primary)]/50 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                  <Lightbulb size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">{t("fluctuationDetected") || "Fluctuation Detected"}</h4>
                  <p className="text-xs text-[var(--tc-text-muted)] leading-relaxed mb-2">Your morning glucose has been trending 5% higher over the last 3 days. Consider reviewing your diet plan.</p>
                  <button className="text-[11px] font-bold text-white bg-[var(--tc-surface)] hover:bg-[var(--tc-surface-muted)] border border-[var(--tc-border-strong)] px-3 py-1 rounded-md transition-colors">
                    {t("reviewDietPlan") || "Review Diet Plan"}</button>
                </div>
              </div>

              <div className="bg-[var(--tc-surface-elevated)] border border-[var(--tc-border)] rounded-xl p-4 flex gap-4 items-start hover:border-[var(--primary)]/50 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                  <ClipboardCheck size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">{t("medicationRefillNeeded") || "Medication Refill Needed"}</h4>
                  <p className="text-xs text-[var(--tc-text-muted)] leading-relaxed mb-2">{t("lisinoprilSupplyIsRunningLowBasedOnYourAdherenceRateAutoRefillCanBeInitiated") || "Lisinopril supply is running low based on your adherence rate. Auto-refill can be initiated."}</p>
                  <button className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 px-3 py-1 rounded-md transition-colors">
                    {t("requestRefill") || "Request Refill"}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

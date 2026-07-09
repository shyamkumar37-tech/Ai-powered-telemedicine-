import { useEffect, useState } from "react";
import AlertStrip from "../components/AlertStrip";
import CaregiverPremiumCard from "../components/CaregiverPremiumCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import AiCaregiverInsightsPanel from "../ai/components/AiCaregiverInsightsPanel";
import { fetchDashboard } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { logAsyncFailure, runWithRequestTimeout } from "../utils/requestLifecycle";
import { translateDisplayText } from "../utils/i18n";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import PriorityActionsCard from "../components/ui/PriorityActionsCard";
import { Activity, Bell, CalendarDays, ShieldAlert, Users, TrendingUp } from "lucide-react";

function CaregiverDashboardSkeleton() {
  return (
    <div className="dashboard-shell space-y-6">
      <div className="dashboard-skeleton__header" aria-hidden="true" />
      <div className="dashboard-skeleton__grid" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`caregiver-stat-${index}`} className="dashboard-skeleton__stat" />
        ))}
      </div>
      <div className="dashboard-skeleton__panel" aria-hidden="true" />
    </div>
  );
}

export default function CaregiverDashboardPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const caregiverId = auth.profileId ?? auth.userId;
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (!caregiverId || auth?.role !== "CAREGIVER") {
      if (active) {
        setDashboard(null);
        setError("");
        setLoading(false);
      }
      return () => {
        active = false;
      };
    }

    setLoading(true);
    runWithRequestTimeout(
      (signal) => fetchDashboard(auth.role, caregiverId, { signal }),
      { signal: controller.signal }
    )
      .then((data) => {
        if (!active) return;
        setDashboard(data);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setDashboard(null);
        setError(getApiErrorMessage(err, t("unableLoadCaregiverDashboard")));
        logAsyncFailure("caregiver-dashboard", err, { caregiverId });
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [auth.role, caregiverId, language, t, reloadToken]);

  if (error) {
    return (
      <ErrorStateCard
        title={t("unableLoadCaregiverDashboard")}
        body={error}
        actionLabel={t("retry")}
        onAction={() => setReloadToken((current) => current + 1)}
      />
    );
  }
  if (loading) return <CaregiverDashboardSkeleton />;
  if (!dashboard) {
    return (
      <EmptyStateCard
        title={t("noDashboardData")}
        body={translateDisplayText(language, "Caregiver insights will appear once patients share their data.")}
        actionLabel={t("retry")}
        onAction={() => setReloadToken((current) => current + 1)}
      />
    );
  }

  const alertsCount = Array.isArray(dashboard.recentHealthAlerts) ? dashboard.recentHealthAlerts.length : 0;
  const pendingReminders = Number(dashboard.pendingMedicationReminders || 0);
  const adherencePercentage = Number(dashboard.adherencePercentage ?? 0);
  const totalAppointments = Number(dashboard.totalAppointments || 0);

  const priorityActions = [];

  // Extract context from recent alerts for more specific priority actions
  const latestAlert = dashboard.recentHealthAlerts?.[0];
  const lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (alertsCount > 0) {
    priorityActions.push({
      id: "alerts",
      title: latestAlert ? `Urgent: ${latestAlert.patientName}` : translateDisplayText(language, "Urgent patient alerts"),
      description: latestAlert ? latestAlert.message : translateDisplayText(language, "{count} alerts need attention").replace("{count}", alertsCount),
      meta: translateDisplayText(language, "Check escalations and notify the care team."),
      priority: "urgent",
      status: translateDisplayText(language, "Critical"),
      statusTone: "danger",
      icon: <ShieldAlert className="h-5 w-5 text-red-400" />
    });
  }

  if (pendingReminders > 0) {
    priorityActions.push({
      id: "reminders",
      title: translateDisplayText(language, "Medication pending"),
      description: translateDisplayText(language, "{count} reminders need follow-up across your network").replace("{count}", pendingReminders),
      meta: translateDisplayText(language, "Help patients confirm doses."),
      priority: "review",
      status: translateDisplayText(language, "Warning"),
      statusTone: "warning",
      icon: <Bell className="h-5 w-5 text-amber-400" />
    });
  }

  if (adherencePercentage > 0 && adherencePercentage < 70) {
    priorityActions.push({
      id: "adherence",
      title: translateDisplayText(language, "Adherence drop detected"),
      description: `Average adherence is currently ${adherencePercentage.toFixed(1)}%.`,
      meta: translateDisplayText(language, "Reach out to check barriers."),
      priority: "review",
      status: translateDisplayText(language, "Needs focus"),
      statusTone: "warning",
      icon: <TrendingUp className="h-5 w-5 text-amber-400" />
    });
  }

  if (totalAppointments > 0) {
    priorityActions.push({
      id: "appointments",
      title: translateDisplayText(language, "Upcoming visits"),
      description: translateDisplayText(language, "{count} upcoming patient appointments").replace("{count}", totalAppointments),
      meta: translateDisplayText(language, "Prepare transport or support."),
      priority: "upcoming",
      status: translateDisplayText(language, "Info"),
      statusTone: "info",
      icon: <CalendarDays className="h-5 w-5 text-teal-400" />
    });
  }

  return (
    <div className="tcd-animate-in space-y-6">
      {/* Progress / Summary Strip */}
      <div className="cg-card py-4 px-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Patients Monitored</p>
              <p className="text-xl font-bold text-white">Active</p>
            </div>
          </div>
          <div className="h-10 w-px bg-white/10 hidden md:block"></div>
          <div className="flex items-center gap-3">
            <div className="bg-red-500/20 p-2 rounded-lg text-red-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Unresolved Alerts</p>
              <p className="text-xl font-bold text-white">{alertsCount}</p>
            </div>
          </div>
          <div className="h-10 w-px bg-white/10 hidden md:block"></div>
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Pending Reminders</p>
              <p className="text-xl font-bold text-white">{pendingReminders}</p>
            </div>
          </div>
          <div className="h-10 w-px bg-white/10 hidden md:block"></div>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm text-slate-400 font-medium text-right">Data Freshness</p>
              <p className="text-xs font-medium text-indigo-400 mt-1">Updated {lastUpdated}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <PriorityActionsCard
            title={translateDisplayText(language, "Priority Actions")}
            subtitle={translateDisplayText(language, "Focus on patients who need follow-up today.")}
            actions={priorityActions}
            emptyTitle={translateDisplayText(language, "No urgent care actions right now")}
            emptyBody={translateDisplayText(language, "Stay ready for upcoming tasks and alerts.")}
            className="cg-card !border-none"
          />
        </div>
        <div className="space-y-6">
          <CaregiverPremiumCard
            title={
              <span className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-indigo-400" />
                {t("activeAlerts")}
              </span>
            }
          >
            {(Array.isArray(dashboard.recentHealthAlerts) ? dashboard.recentHealthAlerts : []).length ? (
              <AlertStrip items={Array.isArray(dashboard.recentHealthAlerts) ? dashboard.recentHealthAlerts : []} />
            ) : (
              <p className="text-sm text-slate-400 p-4 text-center bg-white/5 rounded-xl border border-white/5">{t("noActiveEscalations")}</p>
            )}
          </CaregiverPremiumCard>
          
          <CaregiverPremiumCard
            title={
              <span className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-400" />
                Adherence Overview
              </span>
            }
          >
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
              <p className="text-4xl font-bold text-white mb-2">{adherencePercentage.toFixed(1)}%</p>
              <p className="text-sm text-slate-400">Network Average</p>
              <div className="mt-4 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${adherencePercentage}%` }}></div>
              </div>
            </div>
          </CaregiverPremiumCard>
        </div>
      </div>
      <AiCaregiverInsightsPanel caregiverId={caregiverId} />
    </div>
  );
}

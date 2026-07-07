import { useEffect, useState } from "react";
import AlertStrip from "../components/AlertStrip";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
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
import { Activity, Bell, CalendarDays, ShieldAlert } from "lucide-react";

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

  if (alertsCount > 0) {
    priorityActions.push({
      id: "alerts",
      title: translateDisplayText(language, "Urgent patient alerts"),
      description: translateDisplayText(language, "{count} alerts need attention").replace("{count}", alertsCount),
      meta: translateDisplayText(language, "Check escalations and notify the care team."),
      priority: "urgent",
      status: translateDisplayText(language, "Urgent"),
      statusTone: "danger",
      icon: <ShieldAlert className="h-5 w-5" />
    });
  }

  if (pendingReminders > 0) {
    priorityActions.push({
      id: "reminders",
      title: translateDisplayText(language, "Medication reminders pending"),
      description: translateDisplayText(language, "{count} reminders need follow-up").replace("{count}", pendingReminders),
      meta: translateDisplayText(language, "Help patients confirm doses."),
      priority: "review",
      status: translateDisplayText(language, "Needs review"),
      statusTone: "warning",
      icon: <Bell className="h-5 w-5" />
    });
  }

  if (adherencePercentage > 0 && adherencePercentage < 70) {
    priorityActions.push({
      id: "adherence",
      title: translateDisplayText(language, "Adherence support needed"),
      description: translateDisplayText(language, "Average adherence is below 70%."),
      meta: translateDisplayText(language, "Reach out to check barriers."),
      priority: "review",
      status: translateDisplayText(language, "Needs focus"),
      statusTone: "warning",
      icon: <Activity className="h-5 w-5" />
    });
  }

  if (totalAppointments > 0) {
    priorityActions.push({
      id: "appointments",
      title: translateDisplayText(language, "Upcoming appointments"),
      description: translateDisplayText(language, "{count} upcoming patient visits").replace("{count}", totalAppointments),
      meta: translateDisplayText(language, "Prepare transport or support."),
      priority: "upcoming",
      status: translateDisplayText(language, "Upcoming"),
      statusTone: "info",
      icon: <CalendarDays className="h-5 w-5" />
    });
  }

  return (
    <>
      <PriorityActionsCard
        title={translateDisplayText(language, "Priority actions")}
        subtitle={translateDisplayText(language, "Focus on patients who need follow-up today.")}
        actions={priorityActions}
        emptyTitle={translateDisplayText(language, "No urgent care actions right now")}
        emptyBody={translateDisplayText(language, "Stay ready for upcoming tasks and alerts.")}
        className="dashboard-section"
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title={t("linkedAppointments")} value={dashboard.totalAppointments} hint={translateDisplayText(language, dashboard.recentTriageCategory)} icon={<CalendarDays className="h-4 w-4" />} />
        <StatCard title={t("pendingReminders")} value={dashboard.pendingMedicationReminders} hint={t("caregiverSupportItems")} icon={<Bell className="h-4 w-4" />} />
        <StatCard title={t("averageAdherence")} value={`${Number(dashboard.adherencePercentage ?? 0).toFixed(1)}%`} hint={t("acrossLinkedPatients")} icon={<Activity className="h-4 w-4" />} />
      </div>
      <SectionCard
        title={(
          <span className="inline-flex items-center gap-2">
            <Bell className="h-4 w-4 text-teal-600" />
            {t("activeAlerts")}
          </span>
        )}
      >
        {(Array.isArray(dashboard.recentHealthAlerts) ? dashboard.recentHealthAlerts : []).length ? (
          <AlertStrip items={Array.isArray(dashboard.recentHealthAlerts) ? dashboard.recentHealthAlerts : []} />
        ) : (
          <p className="text-sm text-slate-500">{t("noActiveEscalations")}</p>
        )}
      </SectionCard>
      <AiCaregiverInsightsPanel caregiverId={caregiverId} />
    </>
  );
}

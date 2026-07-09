import { useEffect, useState } from "react";
import LocalizedText from "../components/LocalizedText";
import PremiumSectionCard from "../components/PremiumSectionCard";
import PremiumStatCard from "../components/PremiumStatCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import AiDoctorInsightsPanel from "../ai/components/AiDoctorInsightsPanel";
import { fetchDashboard } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { logAsyncFailure, runWithRequestTimeout } from "../utils/requestLifecycle";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import PremiumPriorityActionsCard from "../components/PremiumPriorityActionsCard";
import { CalendarDays, ClipboardCheck, ShieldAlert, Stethoscope } from "lucide-react";

export default function DoctorDashboardPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const translateUiText = (value) => translateDisplayText(language, value);
  const doctorId = auth.profileId ?? auth.userId;
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (!doctorId || auth?.role !== "DOCTOR") {
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
      (signal) => fetchDashboard(auth.role, doctorId, { signal }),
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
        setError(getApiErrorMessage(err, t("unableLoadDoctorDashboard")));
        logAsyncFailure("doctor-dashboard", err, { doctorId });
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
  }, [auth.role, doctorId, language, reloadToken, t]);

  if (error) {
    return (
      <ErrorStateCard
        title={t("unableLoadDoctorDashboard")}
        body={error}
        actionLabel={t("retry")}
        onAction={() => setReloadToken((current) => current + 1)}
      />
    );
  }
  if (loading) return (
    <div className="space-y-6">
      <div className="doc-skeleton h-64 w-full"></div>
      <div className="doc-grid-3">
        <div className="doc-skeleton h-32 w-full"></div>
        <div className="doc-skeleton h-32 w-full"></div>
        <div className="doc-skeleton h-32 w-full"></div>
      </div>
    </div>
  );
  
  if (!dashboard) {
    return (
      <EmptyStateCard
        title={t("noDashboardData")}
        body={t("noDashboardData")}
      />
    );
  }

  const alertsCount = Array.isArray(dashboard.recentHealthAlerts) ? dashboard.recentHealthAlerts.length : 0;
  const pendingAppointments = Number(dashboard.pendingAppointments || 0);
  const totalAppointments = Number(dashboard.totalAppointments || 0);
  const prescriptionsCompleted = Number(dashboard.prescriptionCount || 0);

  const priorityActions = [];

  if (alertsCount > 0) {
    priorityActions.push({
      id: "alerts",
      title: translateUiText("Triage alerts to review"),
      description: translateUiText("{count} patient alerts need review").replace("{count}", alertsCount),
      meta: translateUiText("Open the priority queue to respond."),
      priority: "urgent",
      status: translateUiText("Urgent"),
      statusTone: "danger",
      icon: <ShieldAlert className="h-5 w-5" />
    });
  }

  if (pendingAppointments > 0) {
    priorityActions.push({
      id: "pending-appointments",
      title: translateUiText("Appointments pending confirmation"),
      description: translateUiText("{count} appointments need review").replace("{count}", pendingAppointments),
      meta: translateUiText("Confirm or reschedule as needed."),
      priority: "review",
      status: translateUiText("Needs review"),
      statusTone: "warning",
      icon: <ClipboardCheck className="h-5 w-5" />
    });
  }

  if (totalAppointments > 0) {
    priorityActions.push({
      id: "upcoming-appointments",
      title: translateUiText("Upcoming appointments"),
      description: translateUiText("{count} appointments on your schedule").replace("{count}", totalAppointments),
      meta: translateUiText("Review the day's agenda."),
      priority: "upcoming",
      status: translateUiText("Upcoming"),
      statusTone: "info",
      icon: <CalendarDays className="h-5 w-5" />
    });
  }

  if (prescriptionsCompleted > 0) {
    priorityActions.push({
      id: "completed-consults",
      title: translateUiText("Consultations completed"),
      description: translateUiText("{count} consults closed recently").replace("{count}", prescriptionsCompleted),
      meta: translateUiText("Document any follow-up tasks."),
      priority: "recent",
      status: translateUiText("Completed"),
      statusTone: "success",
      icon: <Stethoscope className="h-5 w-5" />
    });
  }

  // Calculate some dummy adherence or progress metrics for visual flavor
  const adherenceTarget = 80; // 80%
  const todayProgress = totalAppointments > 0 ? (totalAppointments - pendingAppointments) / totalAppointments * 100 : 100;
  
  return (
    <div className="space-y-6 pb-12 tcd-animate-in">
      <PremiumPriorityActionsCard
        title={translateUiText("Priority actions")}
        subtitle={translateUiText("Focus on the most urgent clinical work first.")}
        actions={priorityActions}
        emptyTitle={translateUiText("No urgent care actions right now")}
        emptyBody={translateUiText("You're caught up. Continue monitoring your queue.")}
      />
      <div className="doc-grid-3">
        <PremiumStatCard 
          title={t("appointmentsLabel")} 
          value={dashboard.totalAppointments} 
          hint={t("allAssignedAppointments")} 
          icon={<CalendarDays className="h-5 w-5" />} 
          progress={todayProgress}
        />
        <PremiumStatCard 
          title={t("pendingToday")} 
          value={dashboard.pendingAppointments} 
          hint={t("awaitingConfirmation")} 
          icon={<ClipboardCheck className="h-5 w-5" />} 
          progress={pendingAppointments > 0 ? 30 : 100}
        />
        <PremiumStatCard 
          title={t("completedConsults")} 
          value={dashboard.prescriptionCount} 
          hint={t("consultationsClosed")} 
          icon={<Stethoscope className="h-5 w-5" />} 
          progress={100}
        />
      </div>
      <div className="doc-grid-2">
        <PremiumSectionCard
          title={(
            <span className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-teal-400" />
              {t("clinicalExtensionSnapshot")}
            </span>
          )}
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-white/5 border border-white/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">{t("carePlanning")}</p>
                <p className="mt-1 text-xs text-slate-500">{t("createStructuredCarePlans")}</p>
              </div>
              <span className="doc-badge doc-badge-success">{t("ready")}</span>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">{t("prioritizedReview")}</p>
                <p className="mt-1 text-xs text-slate-500">{t("patientsSurfacedByTriage")}</p>
              </div>
              <span className="doc-badge doc-badge-alert text-base px-3 py-1">
                {(Array.isArray(dashboard.recentHealthAlerts) ? dashboard.recentHealthAlerts : []).length}
              </span>
            </div>
          </div>
        </PremiumSectionCard>
        
        <PremiumSectionCard
          title={(
            <span className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              {t("priorityReviewQueue")}
            </span>
          )}
        >
          {(Array.isArray(dashboard.recentHealthAlerts) ? dashboard.recentHealthAlerts : []).length ? (
            <div className="space-y-3">
              {(Array.isArray(dashboard.recentHealthAlerts) ? dashboard.recentHealthAlerts : []).map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="rounded-xl border border-rose-500/10 bg-rose-500/5 px-4 py-3"
                >
                  <p className="text-sm font-medium text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 rounded-full bg-white/5 p-3 text-slate-500">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-300">{t("noDoctorQueue")}</p>
              <p className="mt-1 text-xs text-slate-500">All alerts have been reviewed</p>
            </div>
          )}
        </PremiumSectionCard>
      </div>
      
      {/* TODO: AiDoctorInsightsPanel requires a redesign as well to match the layout */}
      <AiDoctorInsightsPanel doctorId={doctorId} />
    </div>
  );
}

import { useEffect, useState } from "react";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
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
import PriorityActionsCard from "../components/ui/PriorityActionsCard";
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
  if (loading) return <LoadingSkeleton lines={4} />;
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

  return (
    <>
      <PriorityActionsCard
        title={translateUiText("Priority actions")}
        subtitle={translateUiText("Focus on the most urgent clinical work first.")}
        actions={priorityActions}
        emptyTitle={translateUiText("No urgent care actions right now")}
        emptyBody={translateUiText("You're caught up. Continue monitoring your queue.")}
        className="dashboard-section"
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title={t("appointmentsLabel")} value={dashboard.totalAppointments} hint={t("allAssignedAppointments")} icon={<CalendarDays className="h-4 w-4" />} />
        <StatCard title={t("pendingToday")} value={dashboard.pendingAppointments} hint={t("awaitingConfirmation")} icon={<ClipboardCheck className="h-4 w-4" />} />
        <StatCard title={t("completedConsults")} value={dashboard.prescriptionCount} hint={t("consultationsClosed")} icon={<Stethoscope className="h-4 w-4" />} />
      </div>
      <SectionCard
        title={(
          <span className="inline-flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-teal-600" />
            {t("clinicalExtensionSnapshot")}
          </span>
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-mist p-4">
            <p className="text-sm text-slate-500">{t("carePlanning")}</p>
            <p className="mt-2 text-xl font-semibold text-ink">{t("ready")}</p>
            <p className="mt-1 text-sm text-slate-500">{t("createStructuredCarePlans")}</p>
          </div>
          <div className="rounded-2xl bg-mist p-4">
            <p className="text-sm text-slate-500">{t("prioritizedReview")}</p>
            <p className="mt-2 text-xl font-semibold text-ink">{(Array.isArray(dashboard.recentHealthAlerts) ? dashboard.recentHealthAlerts : []).length}</p>
            <p className="mt-1 text-sm text-slate-500">{t("patientsSurfacedByTriage")}</p>
          </div>
        </div>
      </SectionCard>
      <SectionCard
        title={(
          <span className="inline-flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-teal-600" />
            {t("priorityReviewQueue")}
          </span>
        )}
      >
        {(Array.isArray(dashboard.recentHealthAlerts) ? dashboard.recentHealthAlerts : []).length ? (
          <div className="space-y-3">
            {(Array.isArray(dashboard.recentHealthAlerts) ? dashboard.recentHealthAlerts : []).map((item, index) => (
              <LocalizedText
                key={`${item}-${index}`}
                as="div"
                className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate-700"
                value={item}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">{t("noDoctorQueue")}</p>
        )}
      </SectionCard>
      <AiDoctorInsightsPanel doctorId={doctorId} />
    </>
  );
}

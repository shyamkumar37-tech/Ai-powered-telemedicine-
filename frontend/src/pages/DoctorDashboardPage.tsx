import { useEffect, useState } from "react";
import LocalizedText from "../components/LocalizedText";
import PremiumSectionCard from "../components/PremiumSectionCard";
import PremiumStatCard from "../components/PremiumStatCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import AiDoctorInsightsPanel from "../ai/components/AiDoctorInsightsPanel";
import { fetchDashboard } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { useQuery } from "@tanstack/react-query";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import PremiumPriorityActionsCard from "../components/PremiumPriorityActionsCard";
import { CalendarDays, ClipboardCheck, ShieldAlert, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "../utils/motionVariants";
import { useAccessibleAnimation } from "../hooks/useAccessibleAnimation";
import { DynamicStateObject } from "./../types/DynamicState";

export default function DoctorDashboardPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const translateUiText = (value: string | number) => translateDisplayText(language, value);
  const doctorId = auth.profileId ?? auth.userId;

  const { data: dashboard, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['doctorDashboard', doctorId, language],
    queryFn: async ({ signal }: DynamicStateObject) => {
      return await fetchDashboard(auth.role, doctorId, { signal });
    },
    enabled: !!doctorId && auth?.role === "DOCTOR",
  });

  const handleRetry = () => {
    refetch();
  };

  if (error) {
    return (
      <ErrorStateCard
        title={t("unableLoadDoctorDashboard")}
        message={getApiErrorMessage(error, t("unableLoadDoctorDashboard"))}
        onRetry={handleRetry}
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

  const priorityActions: DynamicStateObject = [];

  if (alertsCount > 0) {
    priorityActions.push({
      id: "alerts",
      title: t("triageAlertsToReview") || "Triage alerts to review",
      description: (t("alertsNeedReview") || "{count} patient alerts need review").replace("{count}", alertsCount as any),
      meta: t("openPriorityQueue") || "Open the priority queue to respond.",
      priority: "urgent",
      status: t("urgent") || "Urgent",
      statusTone: "danger",
      icon: <ShieldAlert className="h-5 w-5" />
    });
  }

  if (pendingAppointments > 0) {
    priorityActions.push({
      id: "pending-appointments",
      title: t("appointmentsPendingConfirmation") || "Appointments pending confirmation",
      description: ((t("appointmentsNeedReview") || "{count} appointments need review").replace("{count}", pendingAppointments as any) as any),
      meta: t("confirmOrReschedule") || "Confirm or reschedule as needed.",
      priority: "review",
      status: (t("needsReview") || "Needs review"),
      statusTone: "warning",
      icon: <ClipboardCheck className="h-5 w-5" />
    });
  }

  if (totalAppointments > 0) {
    priorityActions.push({
      id: "upcoming-appointments",
      title: (t("upcomingAppointments") || "Upcoming appointments"),
      description: (t("CountAppointmentsOnYourSchedule") || "{count} appointments on your schedule").replace("{count}", totalAppointments as any),
      meta: (t("reviewTheDaySAgenda") || "Review the day's agenda."),
      priority: "upcoming",
      status: (t("upcoming") || "Upcoming"),
      statusTone: "info",
      icon: <CalendarDays className="h-5 w-5" />
    });
  }

  if (prescriptionsCompleted > 0) {
    priorityActions.push({
      id: "completed-consults",
      title: (t("consultationsCompleted") || "Consultations completed"),
      description: (t("CountConsultsClosedRecently") || "{count} consults closed recently").replace("{count}", prescriptionsCompleted as any),
      meta: (t("documentAnyFollowUpTasks") || "Document any follow-up tasks."),
      priority: "recent",
      status: (t("completed") || "Completed"),
      statusTone: "success",
      icon: <Stethoscope className="h-5 w-5" />
    });
  }

  // Calculate some dummy adherence or progress metrics for visual flavor
  const adherenceTarget = 80; // 80%
  const todayProgress = totalAppointments > 0 ? (totalAppointments - pendingAppointments) / totalAppointments * 100 : 100;
  
  const accessibleStagger = useAccessibleAnimation(staggerContainer);
  const accessibleFadeInUp = useAccessibleAnimation(fadeInUp);

  return (
    <motion.div 
      className="space-y-6 pb-12"
      variants={accessibleStagger}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={accessibleFadeInUp}>
        <PremiumPriorityActionsCard
          title={(t("priorityActions") || "Priority actions")}
          subtitle={(t("focusOnTheMostUrgentClinicalWorkFirst") || "Focus on the most urgent clinical work first.")}
          actions={priorityActions}
          emptyTitle={(t("noUrgentCareActionsRightNow") || "No urgent care actions right now")}
          emptyBody={(t("youReCaughtUpContinueMonitoringYourQueue") || "You're caught up. Continue monitoring your queue.")}
        />
      </motion.div>
      <motion.div className="doc-grid-3" variants={accessibleFadeInUp}>
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
      </motion.div>
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
              <motion.span className="doc-badge doc-badge-alert text-base px-3 py-1">
                {(Array.isArray(dashboard.recentHealthAlerts) ? dashboard.recentHealthAlerts : []).length}
              </motion.span>
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
              {(Array.isArray(dashboard.recentHealthAlerts) ? dashboard.recentHealthAlerts : []).map((item: DynamicStateObject, index: number | string) => (
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
              <p className="mt-1 text-xs text-slate-500">{t("allAlertsHaveBeenReviewed") || "All alerts have been reviewed"}</p>
            </div>
          )}
        </PremiumSectionCard>
      </div>
      
      <motion.div variants={accessibleFadeInUp}>
        <AiDoctorInsightsPanel doctorId={doctorId} />
      </motion.div>
    </motion.div>
  );
}

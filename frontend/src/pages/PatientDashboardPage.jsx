import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  ChevronRight,
  HeartPulse,
  Pill,
  RefreshCw,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import AiPatientInsightsPanel from "../ai/components/AiPatientInsightsPanel";
import {
  fetchAdherence,
  fetchDashboard,
  fetchHealthSummary,
  fetchPatientAppointments
} from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { logAsyncFailure, runWithRequestTimeout } from "../utils/requestLifecycle";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import SectionCard from "../components/SectionCard";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { DashboardCareIllustration } from "../components/illustrations/CareIllustrations";

function DashboardMetric({ label, value, meta, tone = "default", icon }) {
  return (
    <div className="premium-card rounded-[1.35rem] p-5 transition">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
          tone === "danger"
            ? "bg-rose-50 text-rose-600"
            : tone === "warning"
              ? "bg-amber-50 text-amber-600"
              : tone === "success"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-blue-50 text-blue-600"
        }`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
      {meta ? <p className="mt-2 text-sm text-slate-500">{meta}</p> : null}
    </div>
  );
}

function TinyTrend({ values = [] }) {
  const safeValues = values.length ? values : [24, 42, 36, 64, 58, 72, 68];

  return (
    <div className="flex h-36 items-end gap-2">
      {safeValues.map((value, index) => (
        <div key={`trend-${index}`} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="w-full rounded-full bg-gradient-to-t from-blue-600 via-sky-500 to-emerald-400"
            style={{ height: `${Math.max(value, 14)}%` }}
          />
          <span className="text-[11px] font-medium text-slate-400">
            {["M", "T", "W", "T", "F", "S", "S"][index] || index + 1}
          </span>
        </div>
      ))}
    </div>
  );
}

function buildFallbackDashboard({ adherence, healthSummary }) {
  const summaryAlerts = healthSummary?.latestAlertMessage
    ? [`${healthSummary.latestAlertSeverity || "INFO"}: ${healthSummary.latestAlertMessage}`]
    : [];

  return {
    totalAppointments: 0,
    pendingAppointments: 0,
    prescriptionCount: 0,
    pendingMedicationReminders: Math.max(0, (adherence?.total ?? 0) - (adherence?.taken ?? 0)),
    adherencePercentage: adherence?.adherencePercentage ?? 0,
    recentTriageCategory: healthSummary?.latestAlertSeverity ? "Follow-up needed" : "No check-in yet",
    recentHealthAlerts: summaryAlerts,
    riskScore: healthSummary?.latestAlertSeverity === "CRITICAL" ? 78 : summaryAlerts.length ? 42 : 18,
    fallback: true
  };
}

export default function PatientDashboardPage() {
  const { auth, isAuthenticated } = useAuth();
  const { translateUiText = (value) => value, t } = useLanguage();
  const patientId = auth.profileId;

  const [dashboard, setDashboard] = useState(null);
  const [adherence, setAdherence] = useState(null);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [healthSummary, setHealthSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partialError, setPartialError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadDashboard() {
      console.log("[WORKSPACE]", {
        step: "dashboard-bootstrap-start",
        isAuthenticated,
        role: auth?.role ?? null,
        patientId: patientId ?? null
      });

      if (!isAuthenticated || auth?.role !== "PATIENT" || !patientId) {
        if (active) {
          setDashboard(null);
          setAdherence(null);
          setNextAppointment(null);
          setHealthSummary(null);
          setLoading(false);
          setPartialError("");
        }
        console.log("[WORKSPACE]", {
          step: "dashboard-bootstrap-skipped",
          reason: "missing-auth-or-patient",
          isAuthenticated,
          role: auth?.role ?? null,
          patientId: patientId ?? null
        });
        return;
      }

      setLoading(true);
      setPartialError("");

      try {
        const [dashboardResult, adherenceResult, appointmentsResult, healthSummaryResult] = await Promise.allSettled([
          runWithRequestTimeout((signal) => fetchDashboard(auth.role, patientId, { signal }), { signal: controller.signal }),
          runWithRequestTimeout((signal) => fetchAdherence(patientId, { signal }), { signal: controller.signal }),
          runWithRequestTimeout((signal) => fetchPatientAppointments(patientId, { signal }), { signal: controller.signal }),
          runWithRequestTimeout((signal) => fetchHealthSummary(patientId, { signal }), { signal: controller.signal })
        ]);

        if (!active) {
          return;
        }

        const nextAdherence = adherenceResult.status === "fulfilled" ? adherenceResult.value : null;
        const nextHealthSummary = healthSummaryResult.status === "fulfilled" ? healthSummaryResult.value : null;
        const nextDashboard = dashboardResult.status === "fulfilled"
          ? dashboardResult.value
          : buildFallbackDashboard({ adherence: nextAdherence, healthSummary: nextHealthSummary });

        console.log("[BOOTSTRAP]", {
          step: "workspace-modules-settled",
          dashboard: dashboardResult.status,
          adherence: adherenceResult.status,
          appointments: appointmentsResult.status,
          healthSummary: healthSummaryResult.status
        });
        console.log("[WORKSPACE]", {
          step: "dashboard-data-ready",
          fallback: Boolean(nextDashboard?.fallback),
          dashboard: nextDashboard,
          adherence: nextAdherence,
          healthSummary: nextHealthSummary
        });

        setDashboard(nextDashboard);
        setAdherence(nextAdherence);
        setHealthSummary(nextHealthSummary);

        if (dashboardResult.status === "rejected") {
          setPartialError(getApiErrorMessage(dashboardResult.reason, t("unableLoadPatientDashboard")));
          logAsyncFailure("patient-dashboard:dashboard", dashboardResult.reason, { patientId });
        }
        if (adherenceResult.status === "rejected") {
          logAsyncFailure("patient-dashboard:adherence", adherenceResult.reason, { patientId });
        }
        if (healthSummaryResult.status === "rejected") {
          logAsyncFailure("patient-dashboard:health-summary", healthSummaryResult.reason, { patientId });
        }

        if (appointmentsResult.status === "fulfilled") {
          const now = Date.now();
          const next = (Array.isArray(appointmentsResult.value) ? appointmentsResult.value : [])
            .map((item) => ({
              ...item,
              parsedDate: item?.appointmentDateTime ? new Date(item.appointmentDateTime) : null
            }))
            .filter((item) => item.parsedDate && item.parsedDate.getTime() > now)
            .sort((a, b) => a.parsedDate - b.parsedDate)[0] || null;
          setNextAppointment(next);
        } else {
          setNextAppointment(null);
          logAsyncFailure("patient-dashboard:appointments", appointmentsResult.reason, { patientId });
        }
      } finally {
        if (active) {
          setLoading(false);
          console.log("[WORKSPACE]", { step: "dashboard-bootstrap-complete", patientId });
        }
      }
    }

    loadDashboard();
    return () => {
      active = false;
      controller.abort();
    };
  }, [auth?.role, isAuthenticated, patientId, reloadToken, t]);

  const alertItems = useMemo(() => {
    const alerts = Array.isArray(dashboard?.recentHealthAlerts) ? dashboard.recentHealthAlerts : [];
    const normalized = alerts
      .map((entry) => String(entry || "").trim())
      .filter(Boolean)
      .map((entry) => {
        const [severity, ...rest] = entry.split(":");
        return {
          severity: rest.length ? severity.trim().toUpperCase() : "INFO",
          message: rest.length ? rest.join(":").trim() : entry
        };
      });

    if (healthSummary?.latestAlertMessage) {
      normalized.unshift({
        severity: String(healthSummary.latestAlertSeverity || "INFO").toUpperCase(),
        message: healthSummary.latestAlertMessage
      });
    }

    return normalized;
  }, [dashboard?.recentHealthAlerts, healthSummary?.latestAlertMessage, healthSummary?.latestAlertSeverity]);

  if (loading) {
    return <LoadingSkeleton lines={8} />;
  }

  if (!dashboard) {
    return (
      <EmptyStateCard
        title={t("noDashboardData")}
        body={translateUiText("We could not find enough patient activity to build your dashboard yet.")}
        actionLabel={t("retry")}
        onAction={() => setReloadToken((token) => token + 1)}
        illustration="health"
      />
    );
  }

  const adherencePercentage = adherence?.adherencePercentage ?? dashboard.adherencePercentage ?? 0;
  const activeAlertsCount = alertItems.length;
  const riskScore = Number(dashboard.riskScore || 0);
  const healthScore = Math.max(0, 100 - riskScore);
  const latestBp = healthSummary?.latestBloodPressure || "No reading";
  const latestSugar = healthSummary?.latestSugar ?? "No reading";
  const moodSnapshot = dashboard?.recentTriageCategory || "No check-in yet";

  const healthTone = activeAlertsCount > 0 || riskScore >= 70
    ? { tone: "danger", label: "Needs attention" }
    : adherencePercentage < 60
      ? { tone: "warning", label: "Monitor closely" }
      : { tone: "success", label: "Stable today" };

  const nextBestAction = activeAlertsCount > 0
    ? {
      title: "Review active alerts",
      description: alertItems[0]?.message || "You have unresolved care alerts.",
      cta: "View alerts",
      href: "/patient/alerts"
    }
    : !nextAppointment
      ? {
        title: "Book a follow-up",
        description: "Stay ahead of care by scheduling your next consultation now.",
        cta: "Book Appointment",
        href: "/patient/book"
      }
      : adherencePercentage < 70
        ? {
          title: "Complete today’s medication routine",
          description: "Your adherence is below target. Review reminders before the next visit.",
          cta: "Open reminders",
          href: "/patient/reminders"
        }
        : {
          title: "Log today’s health reading",
          description: "Adding BP, pulse, or sugar updates improves your next consultation.",
          cta: "Update health",
          href: "/patient/health"
        };

  return (
    <div className="dashboard-command-center space-y-6">
      {partialError ? (
        <div className="premium-card flex flex-wrap items-center justify-between gap-4 border-amber-300/40 bg-amber-500/10 p-4 text-amber-100" role="status" aria-live="polite">
          <div>
            <p className="text-sm font-semibold">{translateUiText("Partial workspace mode")}</p>
            <p className="mt-1 text-sm text-amber-100/80">
              {translateUiText("Some dashboard modules did not respond, so TeleCare+ loaded a safe fallback workspace.")}
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setReloadToken((token) => token + 1)}
          >
            <RefreshCw className="h-4 w-4" />
            {t("retry")}
          </button>
        </div>
      ) : null}
      <SectionCard
        title={translateUiText("Today’s care dashboard")}
        action={
          <div className="flex flex-wrap gap-2">
            <Badge tone="info">Verified care team</Badge>
            <Badge tone="success">Secure data</Badge>
            <Badge tone="default">HIPAA-like safeguards</Badge>
            <Badge tone="default">Accessible by design</Badge>
          </div>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="command-hero rounded-[1.8rem] p-6 text-white shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Today’s Health Status</p>
                <h2 className="mt-2 text-3xl font-semibold">{healthTone.label}</h2>
                <p className="mt-2 max-w-xl text-sm text-blue-50/90">
                  {activeAlertsCount
                    ? "Your latest readings need a closer look. Review alerts and follow the recommended action."
                    : "You’re on track today. Keep up medications, readings, and follow-ups to maintain continuity."}
                </p>
              </div>
              <Badge tone={healthTone.tone}>{healthTone.label}</Badge>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_220px]">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/14">
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.16em] text-blue-100">Blood pressure</p>
                  <p className="mt-2 text-xl font-semibold">{latestBp}</p>
                </div>
                <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/14">
                    <Activity className="h-5 w-5" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.16em] text-blue-100">Sugar</p>
                  <p className="mt-2 text-xl font-semibold">{latestSugar}</p>
                </div>
                <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/14">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.16em] text-blue-100">Mood snapshot</p>
                  <p className="mt-2 text-xl font-semibold">{moodSnapshot}</p>
                </div>
              </div>
              <div className="mx-auto w-full max-w-[220px]">
                <DashboardCareIllustration />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="premium-card rounded-[1.6rem] p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Next Best Action
              </div>
              <h3 className="mt-3 text-xl font-semibold text-ink">{nextBestAction.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{nextBestAction.description}</p>
              <div className="mt-5">
                <Link to={nextBestAction.href}>
                  <Button rightIcon={<ChevronRight className="h-4 w-4" />}>{nextBestAction.cta}</Button>
                </Link>
              </div>
            </div>

            <div className="premium-card rounded-[1.6rem] p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <CalendarDays className="h-4 w-4 text-emerald-600" />
                Upcoming Appointment
              </div>
              {nextAppointment ? (
                <>
                  <h3 className="mt-3 text-lg font-semibold text-ink">{nextAppointment.doctorName || "Doctor assigned"}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {nextAppointment.parsedDate?.toLocaleString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit"
                    })}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Link to="/patient/appointments">
                      <Button variant="secondary">View details</Button>
                    </Link>
                    <Link to="/patient/messages">
                      <Button>Join / Message</Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="mt-3 text-lg font-semibold text-ink">No appointment booked</h3>
                  <p className="mt-2 text-sm text-slate-600">Choose a doctor and secure a slot in under a minute.</p>
                  <div className="mt-4">
                    <Link to="/patient/book">
                      <Button>Book Appointment</Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-4">
        <DashboardMetric
          label="Health score"
          value={healthScore}
          meta="Calculated from recent risk signals"
          tone={healthTone.tone}
          icon={<HeartPulse className="h-3.5 w-3.5" />}
        />
        <DashboardMetric
          label="Medication adherence"
          value={`${adherencePercentage}%`}
          meta={`${adherence?.taken ?? 0} of ${adherence?.total ?? 0} doses completed`}
          tone={adherencePercentage < 60 ? "warning" : "success"}
          icon={<Pill className="h-3.5 w-3.5" />}
        />
        <DashboardMetric
          label="Active alerts"
          value={activeAlertsCount}
          meta={activeAlertsCount ? "Review these first today" : "No urgent escalations"}
          tone={activeAlertsCount ? "danger" : "success"}
          icon={<ShieldAlert className="h-3.5 w-3.5" />}
        />
        <DashboardMetric
          label="Upcoming appointments"
          value={nextAppointment ? 1 : 0}
          meta={nextAppointment ? "One visit scheduled" : "No upcoming visits"}
          tone={nextAppointment ? "info" : "default"}
          icon={<CalendarDays className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <SectionCard title={translateUiText("Health Trends")} className="min-w-0">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="premium-card rounded-[1.5rem] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-700">This week</p>
                  <p className="text-sm text-slate-500">A simple view of your recent care consistency</p>
                </div>
                <Badge tone="info">7 days</Badge>
              </div>
              <div className="mt-5">
                <TinyTrend values={[
                  Math.min(Math.max(healthScore - 18, 22), 92),
                  Math.min(Math.max(healthScore - 10, 28), 92),
                  Math.min(Math.max(healthScore - 14, 24), 92),
                  Math.min(Math.max(healthScore - 6, 36), 92),
                  Math.min(Math.max(healthScore - 2, 44), 92),
                  Math.min(Math.max(healthScore + 2, 48), 96),
                  Math.min(Math.max(healthScore, 42), 96)
                ]} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.4rem] bg-blue-50 p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <Activity className="h-4 w-4" />
                  Care insight
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {activeAlertsCount
                    ? "Your dashboard is prioritizing review because an alert is still active."
                    : adherencePercentage < 70
                      ? "Medication adherence is the main opportunity to improve your care trend this week."
                      : "Your readings look stable. Keep logging daily vitals for better clinician guidance."}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-emerald-50 p-5">
                <p className="text-sm font-medium text-emerald-700">Today’s health checklist</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>Take scheduled medicines</li>
                  <li>Review upcoming follow-up</li>
                  <li>Complete mental health check-in</li>
                </ul>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={translateUiText("Clinical intelligence")}>
          <AiPatientInsightsPanel patientId={patientId} />
        </SectionCard>
      </div>
    </div>
  );
}

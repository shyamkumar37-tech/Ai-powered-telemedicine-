import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PremiumSectionCard from "../components/PremiumSectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchDoctorAppointments, updateAppointmentStatus } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import { useToast } from "../components/ui/ToastProvider";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { CalendarDays, Clock, CheckCircle2, XCircle, FileText, User, AlertTriangle } from "lucide-react";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

function AppointmentsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-1/3 mb-6 bg-[var(--tc-surface-muted)] animate-pulse rounded-lg" />
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_: DynamicStateObject, index: number | string) => (
          <div key={`doctor-appointment-skeleton-${index}`} className="h-48 w-full rounded-xl bg-[var(--tc-surface-muted)] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function DoctorAppointmentsPage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value: string | number) => translateDisplayText(language, value) } = useLanguage();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const doctorId = auth.profileId ?? auth.userId;
  const [appointments, setAppointments] = useState<DynamicStateObject[]>([]);
  const [error, setError] = useState<DynamicState>("");
  const [loading, setLoading] = useState<DynamicState>(true);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<DynamicStateObject | null>(null);
  const [reloadToken, setReloadToken] = useState<DynamicState>(0);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchDoctorAppointments(doctorId);
      setAppointments(Array.isArray(data) ? data : []);
      setError("");
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, t("unableLoadDoctorAppointments")));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [doctorId, t, reloadToken]);

  const updateStatus = async (appointmentId: DynamicStateObject, status: DynamicStateObject, fallbackMessage: DynamicStateObject) => {
    setUpdatingAppointmentId(appointmentId);
    try {
      setError("");
      await updateAppointmentStatus(appointmentId, { status });
      pushToast({
        type: "success",
        title: t("appointments"),
        message: status === "CONFIRMED"
          ? (t("appointmentConfirmed") || "Appointment confirmed.")
          : (t("appointmentCancelled") || "Appointment cancelled.")
      });
      await load();
    } catch (err: DynamicStateObject) {
      const message = getApiErrorMessage(err, fallbackMessage);
      setError(message);
      pushToast({ type: "error", title: fallbackMessage, message });
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  const getStatusBadge = (status: DynamicStateObject) => {
    switch (status) {
      case "CONFIRMED":
        return <span className="tc-badge tc-badge tc-badge-success">{status}</span>;
      case "CANCELLED":
        return <span className="tc-badge tc-badge tc-badge-neutral">{status}</span>;
      case "PENDING":
      default:
        return <span className="tc-badge tc-badge tc-badge-warning">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 doc-premium-workspace tcd-animate-in">
      <PremiumSectionCard
        title={(
          <span className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
            <span className="doc-heading tracking-tight">{translateDisplayText(language, t("doctorAppointmentQueue"))}</span>
          </span>
        )}
      >
        {loading ? <AppointmentsSkeleton /> : null}
        {error ? (
          <ErrorStateCard
            title={t("unableLoadDoctorAppointments")}
            body={error}
            actionLabel={t("retry")}
            onAction={() => setReloadToken((current: DynamicStateObject) => current + 1)}
          />
        ) : null}
        {!loading && !error && !appointments.length ? (
          <EmptyStateCard
            title={t("noAppointmentsAssigned")}
            body={(t("newAppointmentRequestsWillAppearHereWhenPatientsBookAVisit") || "New appointment requests will appear here when patients book a visit.")}
            actionLabel={t("retry")}
            onAction={() => setReloadToken((current: DynamicStateObject) => current + 1)}
          />
        ) : null}
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          {appointments.map((item: DynamicStateObject) => {
            const isUrgent = item.triageLevel === "EMERGENCY" || item.triageLevel === "URGENT";
            
            return (
              <div key={item.id} className={`glass-card glass-card-interactive flex flex-col justify-between p-6 ${isUrgent ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : ''}`}>
                <div>
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-primary">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-white tracking-tight">{item.patientName}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(item.appointmentDateTime).toLocaleString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-5">
                    {getStatusBadge(item.status)}
                    {item.triageLevel && (
                      <span className={`tc-badge ${isUrgent ? 'tc-badge tc-badge-danger' : 'tc-badge tc-badge-neutral flex items-center gap-1'}`}>
                        {isUrgent && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {item.triageLevel}
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-6 rounded-xl bg-slate-900/50 border border-slate-800 p-4">
                    <p className="doc-subheading mb-2">{t("chiefConcern") || "Chief Concern"}</p>
                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">{item.concernSummary || "No details provided"}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-5 border-t border-slate-800">
                  {item.status !== "CONFIRMED" && (
                    <button
                      className="btn-primary btn-primary flex-1"
                      type="button"
                      disabled={updatingAppointmentId === item.id}
                      onClick={() => updateStatus(item.id, "CONFIRMED", t("unableConfirmAppointment"))}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {updatingAppointmentId === item.id ? t("saving") : t("confirm")}
                    </button>
                  )}
                  {item.status !== "CANCELLED" && (
                    <button
                      className="btn-primary btn-secondary flex-1"
                      type="button"
                      disabled={updatingAppointmentId === item.id}
                      onClick={() => updateStatus(item.id, "CANCELLED", t("unableCancelAppointment"))}
                    >
                      <XCircle className="h-4 w-4" />
                      {updatingAppointmentId === item.id ? t("saving") : t("cancel")}
                    </button>
                  )}
                  {item.status === "CONFIRMED" && (
                    <button
                      className="btn-primary btn-primary flex-1"
                      type="button"
                      onClick={() => navigate(`/doctor/consultation?appointmentId=${item.id}`)}
                    >
                      <FileText className="h-4 w-4" />
                      {(t("consult") || "Consult")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </PremiumSectionCard>
    </div>
  );
}


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
import { CalendarDays, Clock, CheckCircle2, XCircle, FileText, User } from "lucide-react";

function AppointmentsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="doc-skeleton h-10 w-1/3 mb-6" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`doctor-appointment-skeleton-${index}`} className="doc-skeleton h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function DoctorAppointmentsPage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const doctorId = auth.profileId ?? auth.userId;
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchDoctorAppointments(doctorId);
      setAppointments(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, t("unableLoadDoctorAppointments")));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [doctorId, t, reloadToken]);

  const updateStatus = async (appointmentId, status, fallbackMessage) => {
    setUpdatingAppointmentId(appointmentId);
    try {
      setError("");
      await updateAppointmentStatus(appointmentId, { status });
      pushToast({
        type: "success",
        title: t("appointments"),
        message: status === "CONFIRMED"
          ? translateUiText("Appointment confirmed.")
          : translateUiText("Appointment cancelled.")
      });
      await load();
    } catch (err) {
      const message = getApiErrorMessage(err, fallbackMessage);
      setError(message);
      pushToast({ type: "error", title: fallbackMessage, message });
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return <span className="doc-badge doc-badge-success text-xs px-2.5 py-1">{status}</span>;
      case "CANCELLED":
        return <span className="doc-badge doc-badge-neutral text-xs px-2.5 py-1">{status}</span>;
      case "PENDING":
      default:
        return <span className="doc-badge doc-badge-warn text-xs px-2.5 py-1">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 tcd-animate-in">
      <PremiumSectionCard
        title={(
          <span className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-teal-400" />
            <span>{translateDisplayText(language, t("doctorAppointmentQueue"))}</span>
          </span>
        )}
      >
        {loading ? <AppointmentsSkeleton /> : null}
        {error ? (
          <ErrorStateCard
            title={t("unableLoadDoctorAppointments")}
            body={error}
            actionLabel={t("retry")}
            onAction={() => setReloadToken((current) => current + 1)}
          />
        ) : null}
        {!loading && !error && !appointments.length ? (
          <EmptyStateCard
            title={t("noAppointmentsAssigned")}
            body={translateUiText("New appointment requests will appear here when patients book a visit.")}
            actionLabel={t("retry")}
            onAction={() => setReloadToken((current) => current + 1)}
          />
        ) : null}
        <div className="doc-grid-2">
          {appointments.map((item) => (
            <div key={item.id} className="group flex flex-col justify-between rounded-xl border border-white/5 bg-white/5 p-5 transition-colors hover:bg-white/10 hover:border-white/10">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-400/10 text-teal-400">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white tracking-tight">{item.patientName}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{new Date(item.appointmentDateTime).toLocaleString(undefined, {
                          weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                        })}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {getStatusBadge(item.status)}
                  {item.triageLevel && <span className="doc-badge doc-badge-alert text-xs px-2.5 py-1">{item.triageLevel}</span>}
                </div>
                
                <div className="mb-6 rounded-lg bg-black/20 p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Chief Concern</p>
                  <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">{item.concernSummary || "No details provided"}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  className="doc-btn doc-btn-primary flex-1 flex items-center justify-center gap-2"
                  type="button"
                  disabled={updatingAppointmentId === item.id}
                  onClick={() => updateStatus(item.id, "CONFIRMED", t("unableConfirmAppointment"))}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {updatingAppointmentId === item.id ? t("saving") : t("confirm")}
                </button>
                <button
                  className="doc-btn doc-btn-secondary flex-1 flex items-center justify-center gap-2"
                  type="button"
                  disabled={updatingAppointmentId === item.id}
                  onClick={() => updateStatus(item.id, "CANCELLED", t("unableCancelAppointment"))}
                >
                  <XCircle className="h-4 w-4" />
                  {updatingAppointmentId === item.id ? t("saving") : t("cancel")}
                </button>
                <button
                  className="doc-btn flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white"
                  type="button"
                  onClick={() => navigate(`/doctor/consultation?appointmentId=${item.id}`)}
                >
                  <FileText className="h-4 w-4" />
                  {translateUiText("Consult")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </PremiumSectionCard>
    </div>
  );
}

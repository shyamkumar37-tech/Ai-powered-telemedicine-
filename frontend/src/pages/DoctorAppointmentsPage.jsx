import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../components/Badge";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchDoctorAppointments, updateAppointmentStatus } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import { useToast } from "../components/ui/ToastProvider";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { CalendarDays } from "lucide-react";

function AppointmentsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="page-skeleton__block" aria-hidden="true" />
      <div className="page-skeleton__row" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`doctor-appointment-skeleton-${index}`} className="page-skeleton__card" />
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

  return (
    <SectionCard
      title={(
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-teal-600" />
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
      <div className="space-y-3">
        {appointments.map((item) => (
          <div key={item.id} className="rounded-2xl bg-mist p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{item.patientName}</p>
                <p className="text-sm text-slate-500">{new Date(item.appointmentDateTime).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Badge value={item.status} />
                {item.triageLevel ? <Badge value={item.triageLevel} /> : null}
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-700">{item.concernSummary}</p>
            <div className="mt-3 flex gap-3">
              <button
                className="btn-primary"
                type="button"
                disabled={updatingAppointmentId === item.id}
                aria-label={updatingAppointmentId === item.id ? t("saving") : t("confirm")}
                data-voice-label={updatingAppointmentId === item.id ? t("saving") : t("confirm")}
                onClick={() => updateStatus(item.id, "CONFIRMED", t("unableConfirmAppointment"))}
              >
                {updatingAppointmentId === item.id ? t("saving") : t("confirm")}
              </button>
              <button
                className="btn-secondary"
                type="button"
                disabled={updatingAppointmentId === item.id}
                aria-label={updatingAppointmentId === item.id ? t("saving") : t("cancel")}
                data-voice-label={updatingAppointmentId === item.id ? t("saving") : t("cancel")}
                onClick={() => updateStatus(item.id, "CANCELLED", t("unableCancelAppointment"))}
              >
                {updatingAppointmentId === item.id ? t("saving") : t("cancel")}
              </button>
              <button
                className="btn-secondary"
                type="button"
                aria-label={translateUiText("Open consultation")}
                data-voice-label={translateUiText("Open consultation")}
                onClick={() => navigate(`/doctor/consultation?appointmentId=${item.id}`)}
              >
                {translateUiText("Open consultation")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

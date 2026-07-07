import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientAppointments } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import Button from "../components/ui/Button";
import { CalendarDays } from "lucide-react";

export default function PatientAppointmentsPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const patientId = auth.profileId;
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!patientId) {
      setAppointments([]);
      setError(t("unableLoadAppointments"));
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPatientAppointments(patientId)
      .then((data) => {
        setAppointments(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadAppointments"))))
      .finally(() => setLoading(false));
  }, [patientId, reloadToken]);

  return (
    <SectionCard
      title={(
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-teal-600" />
          <LocalizedText as="span" value={t("appointmentHistory")} minLength={4} />
        </span>
      )}
      action={(
        <Link to="/patient/book">
          <Button>Book Appointment</Button>
        </Link>
      )}
    >
      {loading ? <LoadingSkeleton lines={4} /> : null}
      {error ? (
        <ErrorStateCard
          title={t("unableLoadAppointments")}
          body={error}
          actionLabel={t("retry")}
          onAction={() => setReloadToken((current) => current + 1)}
        />
      ) : null}
      {!loading && !error && !appointments.length ? (
        <EmptyStateCard
          title={t("noAppointmentsFound")}
          body={translateDisplayText(language, "Appointments will appear here after you complete a booking.")}
          actionLabel={t("retry")}
          onAction={() => setReloadToken((current) => current + 1)}
        />
      ) : null}
      <div className="space-y-3">
        {(Array.isArray(appointments) ? appointments : []).map((item) => (
          <div key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{item.doctorName}</p>
                <p className="text-sm text-slate-500">{new Date(item.appointmentDateTime).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Badge value={item.status} />
                {item.triageLevel ? <Badge value={item.triageLevel} /> : null}
              </div>
            </div>
            <LocalizedText as="p" className="mt-3 text-sm text-slate-700" value={item.concernSummary} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

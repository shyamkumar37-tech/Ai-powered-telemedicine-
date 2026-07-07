import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientPrescriptions } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { Pill } from "lucide-react";

export default function PatientPrescriptionsPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const patientId = auth.profileId;
  const [prescriptions, setPrescriptions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!patientId) {
      setPrescriptions([]);
      setError(t("unableLoadPrescriptions"));
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPatientPrescriptions(patientId)
      .then((data) => {
        setPrescriptions(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadPrescriptions"))))
      .finally(() => setLoading(false));
  }, [patientId, reloadToken]);

  return (
    <SectionCard
      title={(
        <span className="inline-flex items-center gap-2">
          <Pill className="h-5 w-5 text-teal-600" />
          <LocalizedText as="span" value={t("prescriptionHistory")} minLength={4} />
        </span>
      )}
    >
      {loading ? <LoadingSkeleton lines={4} /> : null}
      {error ? (
        <ErrorStateCard
          title={t("unableLoadPrescriptions")}
          body={error}
          actionLabel={t("retry")}
          onAction={() => setReloadToken((current) => current + 1)}
        />
      ) : null}
      {!loading && !error && !prescriptions.length ? (
        <EmptyStateCard
          title={t("noPrescriptionsAvailable")}
          body={translateDisplayText(language, "Prescriptions will appear here after a consultation is completed.")}
          actionLabel={t("retry")}
          onAction={() => setReloadToken((current) => current + 1)}
        />
      ) : null}
      <div className="space-y-4">
        {(Array.isArray(prescriptions) ? prescriptions : []).map((prescription) => (
          <div key={prescription.id} className="rounded-2xl bg-mist p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{prescription.doctorName}</p>
                <p className="text-sm text-slate-500">{t("followUpLabel")}: {prescription.followUpDate || t("notSet")}</p>
              </div>
              <Link className="btn-secondary" to={`/patient/prescriptions/${prescription.id}/print`}>
                {t("printView")}
              </Link>
            </div>
            <LocalizedText as="p" className="mt-3 text-sm text-slate-600" value={prescription.notes} />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(Array.isArray(prescription.medications) ? prescription.medications : []).map((medicine) => (
                <div key={medicine.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                  <p className="font-semibold">{medicine.medicineName}</p>
                  <p>{medicine.dosage} | {translateDisplayText(language, medicine.frequency)}</p>
                  <p>{medicine.durationDays} {t("daysSuffix")}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

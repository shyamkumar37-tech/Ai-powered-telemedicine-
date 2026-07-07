import { useEffect, useState } from "react";
import LocalizedText from "../components/LocalizedText";
import { useNavigate, useParams } from "react-router-dom";
import SectionCard from "../components/SectionCard";
import { useLanguage } from "../context/LanguageContext";
import { fetchPrescription } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";

export default function PrescriptionPrintPage() {
  const { language, t } = useLanguage();
  const { prescriptionId } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchPrescription(prescriptionId)
      .then((data) => {
        setPrescription(data);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadPrintablePrescription"))))
      .finally(() => setLoading(false));
  }, [prescriptionId, language, t]);

  return (
    <SectionCard
      title={t("printablePrescription")}
      action={
        <div className="flex gap-3">
          <button
            className="btn-secondary"
            type="button"
            aria-label={t("back")}
            data-voice-label={t("back")}
            onClick={() => navigate(-1)}
          >
            {t("back")}
          </button>
          <button
            className="btn-primary"
            type="button"
            aria-label={t("print")}
            data-voice-label={t("print")}
            onClick={() => window.print()}
            disabled={!prescription}
          >
            {t("print")}
          </button>
        </div>
      }
    >
      {loading ? <LoadingSkeleton lines={3} /> : null}
      {error ? (
        <ErrorStateCard
          title={t("unableLoadPrintablePrescription")}
          body={error}
        />
      ) : null}
      {!loading && !error && !prescription ? (
        <EmptyStateCard
          title={t("noPrescriptionsAvailable")}
          body={t("noPrescriptionsAvailable")}
        />
      ) : null}
      {prescription ? (
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-slate-800 shadow-sm print:border-0 print:shadow-none">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-teal-600">{t("telecarePrescriptionHeading")}</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">{prescription.patientName}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("doctorLabel")}: {prescription.doctorName}</p>
            <p className="text-sm text-slate-500">{t("followUpDate")}: {prescription.followUpDate || t("notSet")}</p>
          </div>
          <div className="mt-6">
            <p className="text-sm font-semibold text-ink">{t("prescriptionNote")}</p>
            <LocalizedText
              as="pre"
              className="mt-3 whitespace-pre-wrap rounded-2xl bg-mist p-4 font-sans text-sm text-slate-700"
              value={prescription.notes}
            />
          </div>
          <div className="mt-6">
            <p className="text-sm font-semibold text-ink">{t("medicines")}</p>
            <div className="mt-3 space-y-3">
              {(Array.isArray(prescription.medications) ? prescription.medications : []).map((medicine) => (
                <div key={medicine.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-ink">{medicine.medicineName}</p>
                  <p className="mt-1 text-sm text-slate-600">{medicine.dosage} | {medicine.frequency} | {medicine.durationDays} {t("daysSuffix")}</p>
                  {medicine.notes ? (
                    <LocalizedText as="p" className="mt-2 text-sm text-slate-500" value={medicine.notes} />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}

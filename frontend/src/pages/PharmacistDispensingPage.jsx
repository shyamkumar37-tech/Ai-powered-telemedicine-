import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPharmacistDispensing, updateDispenseRecord } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { formatDisplayValue } from "../utils/formatDisplayValue";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";

export default function PharmacistDispensingPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const pharmacistId = auth.profileId ?? auth.userId;
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [edits, setEdits] = useState({});

  useEffect(() => {
    setLoading(true);
    fetchPharmacistDispensing(pharmacistId)
      .then((data) => {
        const safe = Array.isArray(data) ? data : [];
        setRecords(safe);
        setEdits(
          Object.fromEntries(
            safe.map((record) => [
              record.id,
              {
                status: record.status,
                verificationNotes: record.verificationNotes || ""
              }
            ])
          )
        );
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadDispensingQueue"))))
      .finally(() => setLoading(false));
  }, [pharmacistId, t]);

  return (
    <SectionCard title={t("dispensingQueue")}>
      {loading ? <LoadingSkeleton lines={4} /> : null}
      {error ? (
        <ErrorStateCard
          title={t("unableLoadDispensingQueue")}
          body={error}
        />
      ) : null}
      {!loading && !error && !records.length ? (
        <EmptyStateCard
          title={t("noDispensingQueue")}
          body={translateDisplayText(language, "Dispensing requests will appear here once prescriptions are approved.")}
        />
      ) : null}
      <div className="space-y-4">
        {records.map((record) => (
          <div key={record.id} className="rounded-2xl bg-mist p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{record.patientName}</p>
                <p className="text-sm text-slate-500">{record.doctorName}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge value={record.status} />
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{t("pickupCode")}: {record.pickupCode}</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {(Array.isArray(record.medicines) ? record.medicines : []).map((item) => (
                <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr_auto]">
              <select
                className="field"
                aria-label={t("dispensedStatus")}
                data-voice-label={t("dispensedStatus")}
                value={edits[record.id]?.status || record.status}
                onChange={(event) =>
                  setEdits((current) => ({
                    ...current,
                    [record.id]: { ...current[record.id], status: event.target.value }
                  }))
                }
              >
                <option value="PENDING_VERIFICATION">{t("pendingVerificationStatus")}</option>
                <option value="VERIFIED">{t("verifiedStatus")}</option>
                <option value="DISPENSED">{t("dispensedStatus")}</option>
              </select>
              <input
                className="field"
                placeholder={t("verificationNotes")}
                aria-label={t("verificationNotes")}
                data-voice-label={t("verificationNotes")}
                value={edits[record.id]?.verificationNotes || ""}
                onChange={(event) =>
                  setEdits((current) => ({
                    ...current,
                    [record.id]: { ...current[record.id], verificationNotes: event.target.value }
                  }))
                }
              />
              <button
                type="button"
                className="btn-primary"
                aria-label={t("update")}
                data-voice-label={t("update")}
                onClick={async () => {
                  try {
                    const updated = await updateDispenseRecord(record.id, edits[record.id]);
                    setRecords((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
                    setError("");
                  } catch (err) {
                    setError(getApiErrorMessage(err, t("unableUpdateDispensingStatus")));
                  }
                }}
              >
                {t("update")}
              </button>
            </div>
            {record.dispensedAt ? <p className="mt-3 text-sm text-slate-500">{t("dispensedAt")}: {new Date(record.dispensedAt).toLocaleString()}</p> : null}
            {record.followUpDate ? <p className="mt-1 text-sm text-slate-500">{t("followUpDateLabel")}: {record.followUpDate}</p> : null}
            {record.status ? <p className="mt-1 text-xs font-semibold text-slate-400">{translateDisplayText(language, formatDisplayValue(record.status))}</p> : null}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

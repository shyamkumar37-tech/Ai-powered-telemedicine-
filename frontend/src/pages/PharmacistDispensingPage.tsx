import { useEffect, useState, useMemo } from "react";
import Badge from "../components/Badge";
import PharmacistPremiumCard from "../components/PharmacistPremiumCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPharmacistDispensing, updateDispenseRecord } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { Clock, Filter, ShoppingBag } from "lucide-react";
import PharmacistDeliveryTracker from "../components/pharmacist/PharmacistDeliveryTracker";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function PharmacistDispensingPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const pharmacistId = auth.profileId ?? auth.userId;
  const [records, setRecords] = useState<DynamicStateObject[]>([]);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [error, setError] = useState<DynamicState>("");
  const [edits, setEdits] = useState<DynamicState>({});
  const [statusFilter, setStatusFilter] = useState<DynamicState>("ALL");
  const [sortBy, setSortBy] = useState<DynamicState>("NEWEST");

  useEffect(() => {
    setLoading(true);
    fetchPharmacistDispensing(pharmacistId)
      .then((data: DynamicStateObject) => {
        const safe = Array.isArray(data) ? data : [];
        setRecords(safe);
        setEdits(
          Object.fromEntries(
            safe.map((record: DynamicStateObject) => [
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
      .catch((err: DynamicStateObject) => setError(getApiErrorMessage(err, t("unableLoadDispensingQueue"))))
      .finally(() => setLoading(false));
  }, [pharmacistId, t]);

  const getTimeInQueue = (createdAt: DynamicStateObject) => {
    if (!createdAt) return "Unknown";
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs > 24) return `${Math.floor(diffHrs / 24)} days`;
    if (diffHrs > 0) return `${diffHrs} hr ${diffMins % 60} min`;
    return `${diffMins} min`;
  };

  const filteredAndSortedRecords = useMemo(() => {
    let result = [...records];
    if (statusFilter !== "ALL") {
      result = result.filter((r: DynamicStateObject) => r.status === statusFilter);
    }
    
    result.sort((a: DynamicStateObject, b: DynamicStateObject) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      if (sortBy === "NEWEST") return dateB - dateA;
      if (sortBy === "OLDEST") return dateA - dateB;
      // URGENT: prioritize pending, then oldest
      if (sortBy === "URGENT") {
        if (a.status === "PENDING_VERIFICATION" && b.status !== "PENDING_VERIFICATION") return -1;
        if (a.status !== "PENDING_VERIFICATION" && b.status === "PENDING_VERIFICATION") return 1;
        return dateA - dateB; // oldest pending first
      }
      return 0;
    });
    return result;
  }, [records, statusFilter, sortBy]);

  return (
    <PharmacistPremiumCard
      title={
        <span className="inline-flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-emerald-400" />
          {t("dispensingQueue")}
        </span>
      }
      action={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--tc-surface-muted)] px-3 py-1.5 rounded-lg border border-[var(--tc-border)] text-sm">
            <Filter className="h-4 w-4 text-slate-400" />
            <select aria-label="Filter by Status" title="Filter by Status" className="bg-transparent text-white outline-none" value={statusFilter} onChange={(e: DynamicStateObject) => setStatusFilter(e.target.value)}>
              <option value="ALL" className="text-slate-900">{t("allStatuses") || "All Statuses"}</option>
              <option value="PENDING_VERIFICATION" className="text-slate-900">{t("pending") || "Pending"}</option>
              <option value="VERIFIED" className="text-slate-900">{t("verified") || "Verified"}</option>
              <option value="DISPENSED" className="text-slate-900">{t("dispensed") || "Dispensed"}</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-[var(--tc-surface-muted)] px-3 py-1.5 rounded-lg border border-[var(--tc-border)] text-sm">
            <Clock className="h-4 w-4 text-slate-400" />
            <select aria-label="Sort By" title="Sort By" className="bg-transparent text-white outline-none" value={sortBy} onChange={(e: DynamicStateObject) => setSortBy(e.target.value)}>
              <option value="NEWEST" className="text-slate-900">{t("newestFirst") || "Newest First"}</option>
              <option value="OLDEST" className="text-slate-900">{t("oldestFirst") || "Oldest First"}</option>
              <option value="URGENT" className="text-slate-900">Urgent (Wait Time)</option>
            </select>
          </div>
        </div>
      }
    >
      {loading ? <LoadingSkeleton lines={4} /> : null}
      {error ? (
        <ErrorStateCard
          title={t("unableLoadDispensingQueue")}
          body={error}
        />
      ) : null}
      {!loading && !error && !filteredAndSortedRecords.length ? (
        <EmptyStateCard
          title={t("noDispensingQueue")}
          body={translateDisplayText(language, "No requests match the current filters.")}
        />
      ) : null}
      <div className="space-y-4">
        {filteredAndSortedRecords.map((record: DynamicStateObject) => (
          <div key={record.id} className="rounded-2xl bg-[var(--tc-surface-muted)] p-5 border border-[var(--tc-border)] hover:bg-white/10 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-white">{record.patientName}</p>
                <p className="text-sm text-slate-400">Prescribed by {record.doctorName}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-3">
                  <Badge value={record.status} />
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-400/20">
                    {t("pickupCode")}: {record.pickupCode}
                  </span>
                </div>
                {record.status === "PENDING_VERIFICATION" && (
                  <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Waiting: {getTimeInQueue(record.createdAt)}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {(Array.isArray(record.medicines) ? record.medicines : []).map((item: DynamicStateObject) => (
                <div key={item} className="rounded-xl bg-slate-900/50 border border-white/5 px-4 py-3 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-[200px_1fr_auto]">
              <select
                className="ph-input"
                aria-label={t("dispensedStatus")}
                value={(edits as DynamicStateObject)[record.id]?.status || record.status}
                onChange={(event: DynamicStateObject) =>
                  setEdits((current: DynamicStateObject) => ({
                    ...current,
                    [record.id]: { ...(current as DynamicStateObject)[record.id], status: event.target.value }
                  }))
                }
              >
                <option value="PENDING_VERIFICATION">{t("pendingVerificationStatus")}</option>
                <option value="VERIFIED">{t("verifiedStatus")}</option>
                <option value="DISPENSED">{t("dispensedStatus")}</option>
              </select>
              <input
                className="ph-input"
                placeholder={t("verificationNotes")}
                aria-label={t("verificationNotes")}
                value={(edits as DynamicStateObject)[record.id]?.verificationNotes || ""}
                onChange={(event: DynamicStateObject) =>
                  setEdits((current: DynamicStateObject) => ({
                    ...current,
                    [record.id]: { ...(current as DynamicStateObject)[record.id], verificationNotes: event.target.value }
                  }))
                }
              />
              <button
                type="button"
                className="ph-btn ph-btn-primary"
                aria-label={t("update")}
                onClick={async () => {
                  try {
                    const updated = await updateDispenseRecord(record.id, (edits as DynamicStateObject)[record.id]);
                    setRecords((current: DynamicStateObject) => current.map((entry: DynamicStateObject) => (entry.id === updated.id ? updated : entry)));
                    setError("");
                  } catch (err: DynamicStateObject) {
                    setError(getApiErrorMessage(err, t("unableUpdateDispensingStatus")));
                  }
                }}
              >
                {t("update")}
              </button>
            </div>
            
            {record.status === "OUT_FOR_DELIVERY" && (
              <PharmacistDeliveryTracker recordId={record.id} patientName={record.patientName} />
            )}

            <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 border-t border-[var(--tc-border)] pt-4">
              {record.createdAt && <p>Received: {new Date(record.createdAt).toLocaleString()}</p>}
              {record.dispensedAt && <p>Dispensed: {new Date(record.dispensedAt).toLocaleString()}</p>}
              {record.followUpDate && <p>{t("followUpDateLabel")}: {record.followUpDate}</p>}
            </div>
          </div>
        ))}
      </div>
    </PharmacistPremiumCard>
  );
}

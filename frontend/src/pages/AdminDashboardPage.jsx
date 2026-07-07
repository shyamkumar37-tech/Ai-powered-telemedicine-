import { useEffect, useState } from "react";
import SectionCard from "../components/SectionCard";
import { fetchAdminStatus } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import { Database, ShieldCheck, TriangleAlert, Users } from "lucide-react";

function AdminMetric({ icon, label, value, hint }) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchAdminStatus();
        if (!active) {
          return;
        }
        setStatus(data);
      } catch (err) {
        if (!active) {
          return;
        }
        setStatus(null);
        setError(getApiErrorMessage(err, "Unable to load admin status."));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStatus();
    return () => {
      active = false;
    };
  }, [reloadToken]);

  if (loading) {
    return <LoadingSkeleton lines={8} />;
  }

  if (error) {
    return (
      <ErrorStateCard
        title="Unable to load admin dashboard"
        body={error}
        actionLabel="Retry"
        onAction={() => setReloadToken((current) => current + 1)}
      />
    );
  }

  if (!status) {
    return (
      <EmptyStateCard
        title="No admin telemetry available"
        body="The system did not return an admin status payload."
        actionLabel="Retry"
        onAction={() => setReloadToken((current) => current + 1)}
      />
    );
  }

  const warnings = Array.isArray(status.warnings) ? status.warnings : [];
  const dataCounts = status.dataCounts || {};
  const database = status.database || {};

  return (
    <div className="space-y-6">
      <SectionCard
        title="Admin control center"
        action={(
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
            status.ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            {status.ready ? "System ready" : "Needs attention"}
          </span>
        )}
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <AdminMetric icon={<Database className="h-4 w-4" />} label="Database" value={database.connected ? "Connected" : "Down"} hint="Live connectivity check" />
          <AdminMetric icon={<Users className="h-4 w-4" />} label="Users" value={dataCounts.users ?? 0} hint="Registered accounts" />
          <AdminMetric icon={<Users className="h-4 w-4" />} label="Patients" value={dataCounts.patients ?? 0} hint="Patient profiles" />
          <AdminMetric icon={<Users className="h-4 w-4" />} label="Doctors" value={dataCounts.doctors ?? 0} hint="Doctor profiles" />
        </div>
      </SectionCard>

      <SectionCard title="Operational warnings">
        {warnings.length ? (
          <div className="space-y-3">
            {warnings.map((warning, index) => (
              <div key={`warning-${index}`} className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{warning}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateCard
            title="No active admin warnings"
            body="Operational warnings will appear here when the environment needs attention."
          />
        )}
      </SectionCard>
    </div>
  );
}

import { useLanguage } from "../../context/LanguageContext";
import { useEffect, useState } from "react";
import { fetchPatientAccessLogs } from "../../services/telecareService";
import { ShieldCheck, History, XCircle } from "lucide-react";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

export interface DataAccessTransparencyPanelProps {
  patientId?: string | number;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function DataAccessTransparencyPanel({ patientId }: DataAccessTransparencyPanelProps) {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<DynamicStateObject[]>([]);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [error, setError] = useState<DynamicState>("");

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    fetchPatientAccessLogs(patientId)
      .then((data: DynamicStateObject) => {
        setLogs(data);
        setError("");
      })
      .catch((err: DynamicStateObject) => {
        setError("Failed to load access logs.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [patientId]);

  if (loading) {
    return <div className="p-6 card-premium animate-pulse">{t("loadingAccessLogs") || "Loading access logs..."}</div>;
  }

  if (error) {
    return <div className="p-6 card-premium text-alert">{error}</div>;
  }

  return (
    <div className="card-premium p-6 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-display font-medium text-white">{t("dataAccessTransparency") || "Data Access Transparency"}</h3>
      </div>
      <p className="text-ink-muted text-sm mb-6">
        {t("reviewWhoHasAccessedYourMedicalRecordsAndWhenWeBelieveInFullTransparencyOfYourHealthData") || "Review who has accessed your medical records and when. We believe in full transparency of your health data."}</p>

      {logs.length === 0 ? (
        <div className="text-ink-muted text-sm italic py-4">{t("noAccessLogsFound") || "No access logs found."}</div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {logs.map((log: DynamicStateObject) => (
            <div key={log.id} className="p-4 bg-white/5 border border-white/10 rounded-lg flex items-start gap-4">
              {log.outcome === "SUCCESS" ? (
                <History className="h-5 w-5 text-success mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-alert mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  {log.actorRole ? log.actorRole.replace("ROLE_", "") : "SYSTEM"} accessed your {log.resourceType.toLowerCase().replace("_", " ")}
                </p>
                <div className="flex gap-4 mt-1 text-xs text-ink-muted">
                  <span>Action: {log.action}</span>
                  <span>Time: {new Date(log.createdAt).toLocaleString()}</span>
                </div>
                {log.outcome !== "SUCCESS" && (
                  <p className="text-xs text-alert mt-1">Denied: {log.denialReason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

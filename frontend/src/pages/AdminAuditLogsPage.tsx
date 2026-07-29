import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import AdminLayout from "../components/AdminLayout";
import api from "../services/api";
import { getApiErrorMessage } from "../utils/apiError";
import { FileSearch, Download, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function AdminAuditLogsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<DynamicState>("access");
  const [logs, setLogs] = useState<DynamicStateObject[]>([]);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [error, setError] = useState<DynamicState>("");
  const [page, setPage] = useState<DynamicState>(0);
  const [totalPages, setTotalPages] = useState<DynamicState>(1);
  const [filterAction, setFilterAction] = useState<DynamicState>("");
  const [filterUserId, setFilterUserId] = useState<DynamicState>("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let endpoint = activeTab === "access" ? "/admin/audit-logs/access" : "/admin/audit-logs/ai";
      const params: any = { page, size: 20 };
      
      if (activeTab === "access") {
        if (filterAction) (params.action as any) = filterAction;
        if (filterUserId) params.actorUserId = filterUserId;
      } else {
        if (filterAction) params.featureKey = filterAction;
        if (filterUserId) params.userId = filterUserId;
      }
      
      const res = await api.get(endpoint, { params });
      setLogs(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setError("");
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, "Failed to load audit logs"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeTab, page, filterAction, filterUserId]);

  const handleTabChange = (tab: DynamicStateObject) => {
    setActiveTab(tab);
    setPage(0);
    setFilterAction("");
    setFilterUserId("");
  };

  const handleExportCSV = () => {
    if (!logs.length) return toast.error("No logs to export.");
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeTab === "access") {
      csvContent += "ID,Created At,Actor ID,Role,Patient ID,Action,Resource Type,Outcome,Source IP\n";
      logs.forEach((log: DynamicStateObject) => {
        csvContent += `${log.id},${log.createdAt},${log.actorUserId || ""},${log.actorRole || ""},${log.patientId || ""},${log.action},${log.resourceType},${log.outcome},${log.sourceIp || ""}\n`;
      });
    } else {
      csvContent += "ID,Created At,User ID,Patient ID,Feature,Risk Level,Input Summary\n";
      logs.forEach((log: DynamicStateObject) => {
        const input = (log.inputSummary || "").replace(/,/g, " ");
        csvContent += `${log.id},${log.createdAt},${log.userId || ""},${log.patientId || ""},${log.featureKey},${log.riskLevel || ""},${input}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `telecare_${activeTab}_logs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const layoutActions = (
    <button className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition" onClick={handleExportCSV}>
      <Download size={16 as any} /> {t("exportCSV") || "Export CSV"}</button>
  );

  return (
    <AdminLayout actions={layoutActions}>
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-2 md:flex-row md:items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileSearch className="w-6 h-6 text-teal-400" />
              {t("auditLogViewer") || "Audit Log Viewer"}</h1>
            <p className="text-sm text-slate-300 mt-1">{t("reviewHIPAAComplianceTrailsAndSystemEvents") || "Review HIPAA compliance trails and system events."}</p>
          </div>
        </header>

        <div className="flex border-b border-white/10">
          <button 
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "access" ? "border-teal-400 text-teal-400" : "border-transparent text-slate-300 hover:text-slate-200"}`}
            onClick={() => handleTabChange("access")}
          >
            {t("accessLogs") || "Access Logs"}</button>
          <button 
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "ai" ? "border-teal-400 text-teal-400" : "border-transparent text-slate-300 hover:text-slate-200"}`}
            onClick={() => handleTabChange("ai")}
          >
            {t("aIEventLogs") || "AI Event Logs"}</button>
        </div>

        <div className="flex gap-4 items-center bg-slate-900/50 p-4 rounded-xl border border-white/10">
          <Filter className="w-4 h-4 text-slate-300" />
          <input 
            type="text" 
            placeholder="User ID..." 
            className="px-3 py-1.5 text-sm bg-slate-900 border border-white/10 rounded-lg text-white outline-none focus:border-teal-500"
            value={filterUserId}
            onChange={(e: DynamicStateObject) => setFilterUserId(e.target.value)}
          />
          <input 
            type="text" 
            placeholder={activeTab === "access" ? "Action (e.g. LOGIN)..." : "Feature (e.g. symptom-chat)..."} 
            className="px-3 py-1.5 text-sm bg-slate-900 border border-white/10 rounded-lg text-white outline-none focus:border-teal-500 w-64"
            value={filterAction}
            onChange={(e: DynamicStateObject) => setFilterAction(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-12 text-slate-300">{t("loadingAuditLogs") || "Loading audit logs..."}</div>
        ) : error ? (
          <p className="text-rose-400 p-4 bg-rose-500/10 rounded-lg border border-rose-500/20">{error}</p>
        ) : (
          <div className="bg-slate-900/80 rounded-2xl border border-white/10 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-900 border-b border-white/10">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase">{t("time") || "Time"}</th>
                    {activeTab === "access" ? (
                      <>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase">{t("actor") || "Actor"}</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase">{t("targetPatient") || "Target Patient"}</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase">{t("action") || "Action"}</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase">{t("outcome") || "Outcome"}</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase">IP/Agent</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase">{t("user") || "User"}</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase">{t("targetPatient") || "Target Patient"}</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase">{t("feature") || "Feature"}</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase">{t("riskLevel") || "Risk Level"}</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase">{t("summary") || "Summary"}</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {logs.map((log: DynamicStateObject) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      {activeTab === "access" ? (
                        <>
                          <td className="px-4 py-3">
                            <span className="font-medium text-white">{log.actorUserId || "System"}</span>
                            {log.actorRole && <span className="ml-2 text-xs bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 border border-white/5">{log.actorRole}</span>}
                          </td>
                          <td className="px-4 py-3 text-white">{log.patientId || "-"}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-white">{log.action}</span>
                            <p className="text-xs text-slate-500 mt-1">{log.resourceType}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${log.outcome === "SUCCESS" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                              {log.outcome}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate" title={log.userAgent}>
                            {log.sourceIp || "Internal"}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium text-white">{log.userId || "System"}</td>
                          <td className="px-4 py-3 text-white">{log.patientId || "-"}</td>
                          <td className="px-4 py-3 font-medium text-white">{log.featureKey}</td>
                          <td className="px-4 py-3 text-xs text-slate-300">{log.riskLevel || "-"}</td>
                          <td className="px-4 py-3 text-xs text-slate-300 max-w-[300px] truncate" title={log.inputSummary}>
                            {log.inputSummary || "-"}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-300">
                        {t("noAuditLogsFound") || "No audit logs found."}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-slate-900">
                <button 
                  className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent"
                  disabled={page === 0}
                  onClick={() => setPage((p: DynamicStateObject) => p - 1)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-slate-300">
                  Page {page + 1} of {totalPages}
                </span>
                <button 
                  className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent"
                  disabled={page === totalPages - 1}
                  onClick={() => setPage((p: DynamicStateObject) => p + 1)}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

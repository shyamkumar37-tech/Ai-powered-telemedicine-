import { useAuth } from "../context/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ShieldAlert, Activity, Users, Clock, Database, TrendingUp, LogOut, Download } from "lucide-react";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { Link, useNavigate } from "react-router-dom";
import { buildLoginRedirect } from "../utils/authSession";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminStatus } from "../services/telecareService";
import { exportToCSV, exportToPDF } from "../utils/exportUtils";

export default function AdminDashboardPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const { data: adminStatus, isLoading } = useQuery({
    queryKey: ["adminStatus"],
    queryFn: () => fetchAdminStatus(),
  });

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };
  
  const analytics = adminStatus?.analytics || {};
  const dataCounts = adminStatus?.dataCounts || {};
  
  const consultationData = analytics.consultationData || [];
  const aiRiskData = analytics.aiRiskData || [];
  
  const handleExportCSV = () => {
    exportToCSV(consultationData, "TeleCare_Consultation_Analytics");
  };

  const handleExportPDF = () => {
    const columns = [
      { header: "Date", dataKey: "day" },
      { header: "Total Consults", dataKey: "total" },
      { header: "Avg Time (m)", dataKey: "avgTime" }
    ];
    exportToPDF(consultationData, "TeleCare_Consultation_Report", columns, "TeleCare+ Consultation Analytics Report");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="font-serif text-xl font-medium tracking-tight text-white">TeleCare+ Admin Console</h1>
            <p className="text-xs text-slate-400">System Analytics & Monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={handleExportCSV} className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition">
            <Download size={16} /> CSV
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition">
            <Download size={16} /> PDF
          </button>
          <LanguageSwitcher />
          <Link to="/patient/dashboard" className="text-sm font-medium text-slate-300 transition hover:text-white">Exit Admin</Link>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 py-1.5 pl-2 pr-4 shadow-inner">
            <div className="h-7 w-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
              A
            </div>
            <span className="text-sm font-medium text-slate-200">Admin User</span>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white transition"><LogOut size={20}/></button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-8 space-y-8">
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-lg">
            <div className="flex items-center gap-3 text-teal-400 mb-4"><Users size={20}/> <span className="font-semibold">Active Patients</span></div>
            <div className="text-4xl font-mono text-white">{isLoading ? "..." : (dataCounts.patients || 0).toLocaleString()}</div>
            <div className="mt-2 text-sm text-slate-400 flex items-center gap-1"><TrendingUp size={14} className="text-teal-400"/> +14% this week</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-lg">
            <div className="flex items-center gap-3 text-indigo-400 mb-4"><Clock size={20}/> <span className="font-semibold">Avg Consult Time</span></div>
            <div className="text-4xl font-mono text-white">{isLoading ? "..." : (analytics.avgConsultTime || "0m")}</div>
            <div className="mt-2 text-sm text-slate-400 flex items-center gap-1"><TrendingUp size={14} className="text-indigo-400"/> Target: 15m</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-lg">
            <div className="flex items-center gap-3 text-amber-400 mb-4"><Activity size={20}/> <span className="font-semibold">AI Risk Alerts</span></div>
            <div className="text-4xl font-mono text-white">{isLoading ? "..." : (analytics.aiRiskAlerts || 0)}</div>
            <div className="mt-2 text-sm text-slate-400 flex items-center gap-1"><TrendingUp size={14} className="text-amber-400"/> Requires clinical review</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-lg">
            <div className="flex items-center gap-3 text-rose-400 mb-4"><Database size={20}/> <span className="font-semibold">System Load</span></div>
            <div className="text-4xl font-mono text-white">{isLoading ? "..." : (analytics.systemLoad || "0%")}</div>
            <div className="mt-2 text-sm text-slate-400 flex items-center gap-1">All services operational</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl relative overflow-hidden">
            <h3 className="text-lg font-semibold text-white mb-6">Consultation Volume & Time</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={consultationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis yAxisId="left" stroke="#94a3b8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#4FB3A0" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="total" name="Total Consults" stroke="#818cf8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="avgTime" name="Avg Time (m)" stroke="#4FB3A0" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl relative overflow-hidden">
            <h3 className="text-lg font-semibold text-white mb-6">AI Risk Prediction Distribution</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aiRiskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {aiRiskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

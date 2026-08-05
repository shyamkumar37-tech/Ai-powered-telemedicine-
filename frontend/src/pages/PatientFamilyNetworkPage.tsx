import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientFamilyNetwork } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import PatientSidebar from "../components/PatientSidebar";
import { LogOut, Users, ShieldAlert, RefreshCw } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function PatientFamilyNetworkPage() {
  const { auth, logout } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const patientId = auth?.profileId;
  
  const [network, setNetwork] = useState<DynamicStateObject | null>(null);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [error, setError] = useState<DynamicState>("");

  const load = async () => {
    if (!patientId) {
      setNetwork(null);
      setError("Unable to load family network.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPatientFamilyNetwork(patientId);
      setNetwork(data);
      setError("");
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, "Unable to load family network."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const filteredCaregivers = useMemo(() => {
    return network?.caregivers || [];
  }, [network?.caregivers]);

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };

  return (
    <div className="shell">
      <PatientSidebar />
      
      <main className="w-full flex-1 min-w-0">
        {/* Topbar */}
        <div className="topbar">
          <div>
            <div className="greeting-eyebrow">{t("patientWorkspace") || "Patient workspace"}</div>
            <h1>{t("familyNetwork") || "Family Network"}</h1>
            <p className="subtext">{t("manageSharedCaregiversAndCoordinationSummaries") || "Manage shared caregivers and coordination summaries."}</p>
          </div>
          <div className="status-pills">
            <LanguageSwitcher hideLabel />
            <span className="pill verified"><i className="ti ti-shield-check"></i>Verified care team</span>
            <button 
              onClick={handleLogout} 
              aria-label="Log out"
              className="pill cursor-pointer hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-white transition-colors"
            >
              <LogOut size={14} />
              {t("logout") || "Logout"}
            </button>
          </div>
        </div>

        <div className="w-full max-w-5xl space-y-6">
          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2].map((i: DynamicStateObject) => (
                <div key={i} className="card animate-pulse h-32"></div>
              ))}
            </div>
          ) : error ? (
            <div className="card text-center p-12">
              <ShieldAlert size={40} className="text-[var(--alert)] mx-auto mb-3" />
              <h3 className="section-title mb-2">{t("unableToLoadFamilyNetwork") || "Unable to load family network"}</h3>
              <p className="text-xs text-[var(--ink-muted)] mb-6">{error}</p>
              <button className="btn mx-auto flex items-center gap-2" onClick={load}><RefreshCw size={16} /> {t("retry") || "Retry"}</button>
            </div>
          ) : (
            <>
              {/* Overview */}
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary-dim)] text-[var(--primary)] flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[var(--ink)]">{network?.patientName || "Anita Patient"}'s Care Circle</h3>
                    <p className="text-xs text-[var(--ink-muted)]">Connected caregivers & family access network</p>
                  </div>
                </div>

                <div className="bottom-grid mt-4">
                  <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)]">
                    <div className="text-xs text-[var(--ink-muted)] mb-1">Active Caregivers</div>
                    <div className="font-semibold text-lg text-[var(--ink)]">{filteredCaregivers.length}</div>
                  </div>
                  <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)]">
                    <div className="text-xs text-[var(--ink-muted)] mb-1">Shared Permissions</div>
                    <div className="font-semibold text-lg text-[var(--primary)]">Full Consent</div>
                  </div>
                  <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)]">
                    <div className="text-xs text-[var(--ink-muted)] mb-1">Emergency Escalation</div>
                    <div className="font-semibold text-lg text-[var(--live)]">Enabled</div>
                  </div>
                </div>
              </div>

              {/* Caregivers List */}
              <div className="space-y-4">
                <h3 className="section-title">Designated Caregivers</h3>
                {filteredCaregivers.length === 0 ? (
                  <div className="card text-center p-8">
                    <Users size={32} className="text-[var(--ink-muted)] mx-auto mb-2 opacity-40" />
                    <p className="text-xs text-[var(--ink-muted)]">No designated caregivers added yet.</p>
                  </div>
                ) : (
                  filteredCaregivers.map((cg: DynamicStateObject) => (
                    <div key={cg.id || cg.email} className="card flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] text-[var(--live)] flex items-center justify-center font-semibold text-sm">
                          {cg.name ? cg.name.substring(0, 2).toUpperCase() : "CG"}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-[var(--ink)]">{cg.name || cg.fullName}</h4>
                          <p className="text-xs text-[var(--ink-muted)]">{cg.relation || "Caregiver"} · {cg.email || cg.phone}</p>
                        </div>
                      </div>
                      <span className="status-tag confirmed">Active Access</span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

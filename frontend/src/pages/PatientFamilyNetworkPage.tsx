import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientFamilyNetwork } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import { User, LogOut, Users, ShieldAlert, RefreshCw, Network, ClipboardList } from "lucide-react";
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
    <div className="h-full w-full bg-canvas text-[var(--tc-text)] font-sans flex flex-col overflow-hidden lg:flex-row">
      <PatientSidebar />
      
      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 p-6 lg:p-10 min-w-0" role="main">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeSlideUp">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">{t("familyNetwork") || "Family Network"}</h1>
            <p className="text-ink-muted text-sm mb-3">{t("manageSharedCaregiversAndCoordinationSummaries") || "Manage shared caregivers and coordination summaries."}</p>
            <div className="flex gap-2 items-center mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                <Users size={12} className="text-primary" />{t("community") || "Community"}</span>
              <div className="inline-flex items-center gap-2 text-xs text-ink-muted bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <User size={14} />
                Signed in as {auth?.fullName || "Anita Patient"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher hideLabel />
            <button 
              onClick={handleLogout} 
              aria-label="Log out"
              className="inline-flex items-center gap-2 px-4 py-2 bg-transparent text-ink-muted border border-white/10 rounded-element text-sm font-medium hover:bg-white/5 hover:text-ink transition-colors"
            >
              <LogOut size={16} />{t("logout") || "Logout"}</button>
          </div>
        </div>

        <div className="max-w-5xl animate-fadeSlideUp" style={{animationDelay: '0.1s'}}>
          
          {loading ? (
            <div className="flex flex-col gap-6 mt-8">
              {[1, 2, 3].map((i: DynamicStateObject) => (
                <div key={i} className="card-premium h-32 animate-pulse bg-white/5"></div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-alert/5 border border-alert/20 rounded-xl mt-8">
              <ShieldAlert size={32} className="text-alert mb-4" />
              <h3 className="font-display text-lg mb-2">{t("unableToLoadFamilyNetwork") || "Unable to load family network"}</h3>
              <p className="text-sm text-ink-muted mb-6">{error}</p>
              <button className="px-4 py-2 border border-white/20 rounded-element text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2" onClick={load}><RefreshCw size={16} /> {t("retry") || "Retry"}</button>
            </div>
          ) : network && (
            <div className="space-y-10 mt-8">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-premium !bg-surface flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">{t("patient") || "Patient"}</p>
                  <p className="text-2xl font-display font-medium text-ink truncate">{network.patientName}</p>
                </div>
                <div className="card-premium !bg-surface flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">{t("sharedCaregivers") || "Shared Caregivers"}</p>
                  <p className="text-3xl font-display font-medium text-ink">{filteredCaregivers.length}</p>
                </div>
                <div className="card-premium !bg-surface flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">{t("networkStatus") || "Network Status"}</p>
                  <p className="text-2xl font-display font-medium text-ink">{network.multiCaregiverSupport ? "Shared Support" : "Single Support"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Shared Caregivers Column */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                     <h3 className="font-display text-xl font-medium">{t("sharedCaregivers") || "Shared Caregivers"}</h3>
                     <div className="flex-1 h-px bg-white/10"></div>
                  </div>
                  
                  {filteredCaregivers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed h-[250px]">
                      <Network size={48} className="text-ink-muted/30 mb-4" />
                      <h3 className="font-display text-lg mb-2">{t("noCaregiverNetwork") || "No Caregiver Network"}</h3>
                      <p className="text-sm text-ink-muted max-w-[250px] leading-relaxed">{t("caregiversWillAppearHereOnceTheyAreLinkedToYourProfile") || "Caregivers will appear here once they are linked to your profile."}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {filteredCaregivers.map((caregiver: DynamicStateObject) => (
                        <div key={caregiver.caregiverId} className="card-premium !bg-surface hover:border-white/20 transition-colors">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-medium shrink-0 border border-primary/20">
                              {caregiver.caregiverName?.charAt(0) || "C"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-lg font-medium text-ink truncate mb-1">{caregiver.caregiverName}</h4>
                              <p className="text-sm font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded w-fit mb-2">
                                {translateDisplayText(language, caregiver.relationshipLabel || "Caregiver")}
                              </p>
                              <p className="text-sm text-ink-muted font-mono">{caregiver.phone}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Coordination Summary Column */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                     <h3 className="font-display text-xl font-medium">{t("coordinationSummary") || "Coordination Summary"}</h3>
                     <div className="flex-1 h-px bg-white/10"></div>
                  </div>
                  
                  {(!network.coordinationNote && !network.escalationAdvice) || (network.coordinationNote?.toLowerCase().includes("test") && network.escalationAdvice?.toLowerCase().includes("test")) ? (
                     <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed h-[250px]">
                       <ClipboardList size={48} className="text-ink-muted/30 mb-4" />
                       <h3 className="font-display text-lg mb-2">{t("noActiveCoordination") || "No Active Coordination"}</h3>
                       <p className="text-sm text-ink-muted max-w-[280px] leading-relaxed mb-6">{t("noCoordinationSummariesOrEscalationAdviceHaveBeenSetForYourNetworkYet") || "No coordination summaries or escalation advice have been set for your network yet."}</p>
                       <button className="btn-primary py-2 px-4 text-sm flex items-center gap-2"><RefreshCw size={16}/> {t("requestUpdate") || "Request Update"}</button>
                     </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {network.coordinationNote && !network.coordinationNote.toLowerCase().includes("test") && (
                        <div className="card-premium !bg-surface border-l-4 border-l-primary hover:border-white/20 transition-colors">
                          <h4 className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-3">{t("careNote") || "Care Note"}</h4>
                          <p className="text-sm leading-relaxed text-ink/90">{translateDisplayText(language, network.coordinationNote)}</p>
                        </div>
                      )}
                      {network.escalationAdvice && !network.escalationAdvice.toLowerCase().includes("test") && (
                        <div className="card-premium !bg-surface border-l-4 border-l-alert hover:border-white/20 transition-colors">
                          <h4 className="text-[10px] font-bold text-alert uppercase tracking-widest mb-3">{t("escalationAdvice") || "Escalation Advice"}</h4>
                          <p className="text-sm leading-relaxed text-ink/90">{translateDisplayText(language, network.escalationAdvice)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

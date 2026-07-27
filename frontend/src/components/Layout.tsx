// @ts-nocheck
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { roleRoutes } from "../utils/roleConfig";
import { normalizeRole } from "../utils/roleUtils";
import LanguageSwitcher from "./LanguageSwitcher";
import OfflineQueueBanner from "./OfflineQueueBanner";
import LoadingSkeleton from "./ui/LoadingSkeleton";
import { useToast } from "./ui/ToastProvider";
import { buildLoginRedirect } from "../utils/authSession";
import {
  Activity, Bell, CalendarDays, ClipboardList, ClipboardPlus, FileText, HeartPulse, Home, Hospital, MessageSquareText, Mic, NotebookPen, Package, Pill, ShieldCheck, Stethoscope, Users, LogOut, Menu, X, ChevronRight, Search, User as UserIcon
} from "lucide-react";
import { DynamicStateObject, DynamicState } from "./../types/DynamicState";

export default function Layout() {
  const { auth, logout } = useAuth();
  const { language, t, translateUiText = (value: string | number) => value } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const { pushToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<DynamicState>(false);
  const normalizedRole = normalizeRole(auth?.role);

  const localizedChromeCopy = {
    hi: { workspaceSubtitle: "आज के अपडेट, कार्य और देखभाल कार्रवाइयों की समीक्षा करें।", Care: "देखभाल", Medications: "दवाइयाँ", Health: "स्वास्थ्य", Support: "सहायता", "Family & Community": "परिवार और समुदाय", Insights: "अंतर्दृष्टि", Profile: "प्रोफ़ाइल", General: "सामान्य" },
    ta: { workspaceSubtitle: "இன்றைய புதுப்பிப்புகள், பணிகள் மற்றும் பராமரிப்பு நடவடிக்கைகளை மதிப்பாய்வு செய்யுங்கள்.", Care: "பராமரிப்பு", Medications: "மருந்துகள்", Health: "உடல்நலம்", Support: "ஆதரவு", "Family & Community": "குடும்பம் மற்றும் சமூகத்தினர்", Insights: "பார்வைகள்", Profile: "சுயவிவரம்", General: "பொது" },
    te: { workspaceSubtitle: "ఈరోజు నవీకరణలు, పనులు మరియు సంరక్షణ చర్యలను సమీక్షించండి.", Care: "సంరక్షణ", Medications: "మందులు", Health: "ఆరోగ్యం", Support: "సహాయం", "Family & Community": "కుటుంబం మరియు సమాజం", Insights: "అవగాహనలు", Profile: "ప్రొఫైల్", General: "సాధారణం" },
    ml: { workspaceSubtitle: "ഇന്നത്തെ അപ്‌ഡേറ്റുകളും ജോലികളും പരിചരണ നടപടികളും പരിശോധിക്കുക.", Care: "പരിചരണം", Medications: "മരുന്നുകൾ", Health: "ആരോഗ്യം", Support: "സഹాయం", "Family & Community": "കുടുംബവും സമൂഹവും", Insights: "അവലോകനങ്ങൾ", Profile: "പ്രൊഫൈൽ", General: "പൊതു" },
    pa: { workspaceSubtitle: "ਅੱਜ ਦੇ ਅੱਪਡੇਟ, ਕੰਮ ਅਤੇ ਦੇਖਭਾਲ ਕਾਰਵਾਈਆਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ।", Care: "ਦੇਖਭਾਲ", Medications: "ਦਵਾਈਆਂ", Health: "ਸਿਹਤ", Support: "ਸਹਾਇਤਾ", "Family & Community": "ਪਰਿਵਾਰ ਅਤੇ ਕਮਿਊਨਿਟੀ", Insights: "ਝਲਕਾਂ", Profile: "ਪ੍ਰੋਫ਼ਾਈਲ", General: "ਸਧਾਰਣ" }
  };

  if (!auth?.role) {
    return (
      <div className="min-h-screen bg-canvas px-4 py-6 md:px-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <LoadingSkeleton lines={4} />
        </div>
      </div>
    );
  }

  const routes = Array.isArray((roleRoutes as DynamicStateObject)[normalizedRole]) ? (roleRoutes as DynamicStateObject)[normalizedRole] : [];
  
  const renderIcon = (key: DynamicStateObject) => {
    const base = "w-5 h-5";
    switch (key) {
      case "dashboard": return <Home className={base} strokeWidth={2.2} />;
      case "profile": return <ShieldCheck className={base} strokeWidth={2.2} />;
      case "appointments":
      case "consultation": return <CalendarDays className={base} strokeWidth={2.2} />;
      case "book":
      case "booking": return <ClipboardPlus className={base} strokeWidth={2.2} />;
      case "carePlans": return <ClipboardList className={base} strokeWidth={2.2} />;
      case "prescriptions":
      case "dispensing": return <Pill className={base} strokeWidth={2.2} />;
      case "reminders":
      case "alerts":
      case "notifications": return <Bell className={base} strokeWidth={2.2} />;
      case "triage":
      case "health":
      case "observations": return <HeartPulse className={base} strokeWidth={2.2} />;
      case "messages":
      case "aiChatbot": return <MessageSquareText className={base} strokeWidth={2.2} />;
      case "ivrBooking":
      case "voiceAssist": return <Mic className={base} strokeWidth={2.2} />;
      case "futureCare": return <Hospital className={base} strokeWidth={2.2} />;
      case "familyNetwork": return <Users className={base} strokeWidth={2.2} />;
      case "timeline":
      case "intelligence":
      case "populationInsights":
      case "monitoring":
      case "careGaps": return <Activity className={base} strokeWidth={2.2} />;
      case "education":
      case "mentalHealthCheckin": return <NotebookPen className={base} strokeWidth={2.2} />;
      case "referrals": return <Stethoscope className={base} strokeWidth={2.2} />;
      case "inventory": return <Package className={base} strokeWidth={2.2} />;
      case "records": return <FileText className={base} strokeWidth={2.2} />;
      default: return <FileText className={base} strokeWidth={2.2} />;
    }
  };

  const languageSearch = (() => {
    try {
      const params = new URLSearchParams(location.search || "");
      const lang = params.get("lang") || language;
      return lang && lang !== "en" ? `?lang=${lang}` : "";
    } catch {
      return language && language !== "en" ? `?lang=${language}` : "";
    }
  })();

  const resolvedRole = normalizedRole ?? "";
  const roleLabelKey = resolvedRole === "PATIENT" ? "patientCredential" : resolvedRole === "DOCTOR" ? "doctorCredential" : resolvedRole === "CAREGIVER" ? "caregiverCredential" : resolvedRole === "ADMIN" ? "admin" : "pharmacistCredential";

  const sectionLabels = {
    Care: (localizedChromeCopy as DynamicStateObject)[language]?.Care ?? (t("care") || "Care"),
    Medications: (localizedChromeCopy as DynamicStateObject)[language]?.Medications ?? (t("medications") || "Medications"),
    Health: (localizedChromeCopy as DynamicStateObject)[language]?.Health ?? (t("health") || "Health"),
    Support: (localizedChromeCopy as DynamicStateObject)[language]?.Support ?? (t("support") || "Support"),
    "Family & Community": ((localizedChromeCopy as DynamicStateObject)[language] as DynamicStateObject)?.["Family & Community"] ?? (t("familyCommunity") || "Family & Community"),
    Insights: (localizedChromeCopy as DynamicStateObject)[language]?.Insights ?? (t("insights") || "Insights"),
    Profile: (localizedChromeCopy as DynamicStateObject)[language]?.Profile ?? (t("profile") || "Profile"),
    General: (localizedChromeCopy as DynamicStateObject)[language]?.General ?? (t("general") || "General")
  };

  const groupedRoutes = routes.reduce((acc: DynamicStateObject, item: DynamicStateObject) => {
    const section = item.section || "General";
    if (!(acc as DynamicStateObject)[section]) (acc as DynamicStateObject)[section] = [];
    (acc as DynamicStateObject)[section].push(item);
    return acc;
  }, {});

  const sectionOrder = [
    "Workspace", "Patient Management", "Clinical Intelligence", "Care", "Medications", "Health", 
    "Actions", "Operations", "Communication", "Support", "Family & Community", "Insights", 
    "Profile", "Account", "General"
  ];
  const activeRoute = routes.find((item: DynamicStateObject) => item.path === location.pathname);
  const activeTitle = activeRoute ? translateUiText(t(activeRoute.labelKey)) : translateUiText(t("continuityWorkspace"));
  const activeSection = activeRoute?.section ? ((sectionLabels as DynamicStateObject)[activeRoute.section] ?? translateUiText(activeRoute.section)) : "";

  useEffect(() => {
    if (typeof document === "undefined") return;
    const pageTitle = activeRoute ? translateUiText(t(activeRoute.labelKey)) : translateUiText(t("appName"));
    document.title = `TeleCare+ - ${pageTitle}`;
  }, [location.pathname, routes, t, translateUiText]);

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(languageSearch), { replace: true });
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[var(--tc-bg)] text-[var(--tc-text)] font-sans flex flex-col lg:flex-row relative">
      
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[var(--tc-surface)]/80 backdrop-blur-xl border-b border-[var(--tc-border)] shrink-0 z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center shadow-lg shadow-[var(--primary-dim)]">
            <span className="text-[#04231A] font-bold text-sm tracking-tighter">T+</span>
          </div>
          <span className="font-display font-bold text-lg tracking-wide text-white">{t("teleCare") || "TeleCare"}<span className="text-[var(--primary)]">+</span></span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-[var(--tc-text-muted)] hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex-shrink-0 w-full lg:w-[280px] bg-[var(--tc-sidebar-bg)] backdrop-blur-2xl lg:border-r border-[var(--tc-border)] transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) lg:translate-x-0 lg:sticky lg:top-0 lg:flex flex-col h-screen ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="flex items-center p-6 pb-4 shrink-0 border-b border-[var(--tc-border-subtle)] lg:border-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center shadow-[var(--tc-shadow-primary)] mr-3">
             <span className="text-[#04231A] font-extrabold text-base tracking-tighter">T+</span>
          </div>
          <div className="font-display font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
            {t("tELECARE") || "TELECARE"}<span className="text-[var(--primary)]">+</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 py-6">
          <nav className="space-y-8">
            {sectionOrder
              .filter((section: DynamicStateObject) => (groupedRoutes as DynamicStateObject)[section]?.length)
              .map((section: DynamicStateObject, index: number | string) => (
                <div key={section} className="animate-fadeSlideUp" style={{ animationDelay: `${index * 50}ms` }}>
                  <p className="px-3 mb-3 text-[11px] font-bold tracking-[0.15em] text-[var(--tc-text-soft)] uppercase">
                    {(sectionLabels as DynamicStateObject)[section] ?? translateUiText(section)}
                  </p>
                  <ul className="space-y-1.5">
                    {(groupedRoutes as DynamicStateObject)[section].map((item: DynamicStateObject) => {
                      const active = location.pathname === item.path;
                      const hasBadge = item.labelKey === "messages" || item.labelKey === "alerts" || item.labelKey === "notifications";
                      const isNumberBadge = item.labelKey === "messages";

                      return (
                        <li key={item.path}>
                          <Link
                            to={`${item.path}${languageSearch}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14.5px] transition-all duration-200 group relative overflow-hidden ${
                              active 
                                ? 'bg-gradient-to-r from-[var(--primary-dark)] to-[var(--primary)] text-[#04231A] shadow-[var(--tc-shadow-primary)] font-semibold' 
                                : 'text-[var(--tc-text-muted)] hover:bg-[var(--tc-surface-muted)] hover:text-white'
                            }`}
                          >
                            <span className={`transition-transform duration-200 group-hover:scale-110 shrink-0 ${active ? "text-[#04231A]" : "text-[var(--tc-text-soft)] group-hover:text-white"}`}>
                              {renderIcon(item.labelKey)}
                            </span>
                            
                            <span className="truncate">{translateUiText(t(item.labelKey))}</span>
                            
                            {hasBadge && (
                              isNumberBadge ? (
                                <span className={`ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full ${active ? 'bg-[#04231A] text-white' : 'bg-rose-500 text-white'}`}>3</span>
                              ) : (
                                <span className={`ml-auto w-2 h-2 rounded-full ${active ? 'bg-[#04231A]' : 'bg-rose-500'}`}></span>
                              )
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
          </nav>
        </div>

        <div className="p-4 shrink-0 border-t border-[var(--tc-border-subtle)] bg-[var(--tc-sidebar-bg)]/80 backdrop-blur-xl">
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[var(--tc-surface)] hover:bg-[var(--tc-surface-elevated)] border border-[var(--tc-border)] hover:border-[var(--tc-border-strong)] text-[var(--tc-text)] rounded-xl transition-all font-semibold text-[14px] group">
            <LogOut size={18} className="text-[var(--tc-text-soft)] group-hover:text-white transition-colors" />
            {translateUiText(t("logout"))}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto relative z-0" role="main">
        {/* Topbar for Desktop */}
        <div className="hidden lg:flex p-6 lg:px-10 lg:pt-6 lg:pb-4 shrink-0 flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 bg-[var(--tc-bg)]/90 backdrop-blur-xl border-b border-[var(--tc-border)] sticky top-0 shadow-sm">
          <div className="flex-1 max-w-xl flex items-center gap-4">
             {/* Global Search */}
             <div className="relative w-full max-w-md group">
               <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--tc-text-soft)] group-focus-within:text-[var(--primary)] transition-colors">
                 <Search size={18} />
               </div>
               <input
                 type="search"
                 className="block w-full pl-10 pr-4 py-2.5 bg-[var(--tc-surface)] border border-[var(--tc-border)] rounded-full text-sm placeholder-[var(--tc-text-soft)] text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all shadow-[var(--tc-shadow-sm)]"
                 placeholder="Search patients, appointments, or medical records..."
               />
               <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                 <kbd className="hidden sm:inline-block border border-[var(--tc-border-strong)] rounded px-2 py-0.5 text-[10px] font-medium text-[var(--tc-text-muted)] bg-[var(--tc-surface-elevated)]">⌘K</kbd>
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-5">
             {/* Action Icons */}
             <div className="flex items-center gap-2 pr-4 border-r border-[var(--tc-border-strong)]">
               <button className="relative p-2.5 text-[var(--tc-text-muted)] hover:text-white hover:bg-[var(--tc-surface)] rounded-full transition-colors group">
                 <Bell size={20} className="group-hover:animate-wiggle" />
                 <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[var(--tc-bg)] animate-pulse"></span>
               </button>
               <LanguageSwitcher hideLabel customClass="!bg-transparent !border-none !shadow-none !p-2.5 hover:!bg-[var(--tc-surface)] !rounded-full text-[var(--tc-text-muted)] hover:text-white transition-colors" />
             </div>

             {/* User Profile */}
             <div className="group relative flex items-center gap-3 cursor-pointer p-1 pr-4 rounded-full hover:bg-[var(--tc-surface)] border border-transparent hover:border-[var(--tc-border)] transition-all">
               <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary-dark)] to-[var(--primary)] text-[#04231A] flex items-center justify-center font-bold text-[14px] shadow-[var(--tc-shadow-primary)]">
                 {auth?.fullName?.charAt(0) || "U"}
               </div>
               <div className="hidden sm:block text-left">
                 <div className="text-[13px] font-bold text-white leading-tight flex items-center gap-1.5">
                   {auth?.fullName || "User"}
                   <ChevronRight size={14} className="text-[var(--tc-text-soft)] group-hover:translate-x-0.5 transition-transform" />
                 </div>
                 <div className="text-[11px] text-[var(--tc-text-muted)] font-medium uppercase tracking-wider">{auth?.role?.replace('ROLE_', '')}</div>
               </div>
               
               {/* Dropdown Menu (Hidden by default, shown on hover/focus within) */}
               <div className="absolute top-full right-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                 <div className="bg-[var(--tc-surface-elevated)] border border-[var(--tc-border-strong)] rounded-xl shadow-2xl p-2 backdrop-blur-xl">
                   <div className="px-3 py-2 border-b border-[var(--tc-border)] mb-2">
                     <p className="text-sm font-bold text-white">{auth?.fullName}</p>
                     <p className="text-xs text-[var(--tc-text-muted)] truncate">{auth?.email || 'user@telecareplus.com'}</p>
                   </div>
                   <button onClick={() => navigate('/patient/profile')} className="w-full text-left px-3 py-2 text-sm text-[var(--tc-text-secondary)] hover:text-white hover:bg-[var(--tc-surface-muted)] rounded-lg flex items-center gap-2 transition-colors">
                     <UserIcon size={16} /> {t("profileSettings") || "Profile & Settings"}</button>
                   <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 transition-colors mt-1">
                     <LogOut size={16} /> {t("signOut") || "Sign out"}</button>
                 </div>
               </div>
             </div>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-10 pb-24">
          <OfflineQueueBanner />
          <div className="max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-md transition-opacity duration-300" onClick={() => setMobileMenuOpen(false)} />
      )}
    </div>
  );
}

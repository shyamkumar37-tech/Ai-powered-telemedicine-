import { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { roleRoutes } from "../utils/roleConfig";
import { normalizeRole } from "../utils/roleUtils";
import LanguageSwitcher from "./LanguageSwitcher";
import LocalizedText from "./LocalizedText";
import OfflineQueueBanner from "./OfflineQueueBanner";
import PageContainer from "./ui/PageContainer";
import LoadingSkeleton from "./ui/LoadingSkeleton";
import { useToast } from "./ui/ToastProvider";
import { buildLoginRedirect } from "../utils/authSession";
import {
  Activity,
  Bell,
  CalendarDays,
  ClipboardList,
  ClipboardPlus,
  FileText,
  HeartPulse,
  Home,
  Hospital,
  MessageSquareText,
  Mic,
  NotebookPen,
  Package,
  Pill,
  ShieldCheck,
  Stethoscope,
  Users
} from "lucide-react";

export default function Layout() {
  const { auth, logout } = useAuth();
  const { language, t, translateUiText = (value) => value } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const { pushToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const normalizedRole = normalizeRole(auth?.role);
  const localizedChromeCopy = {
    hi: {
      workspaceSubtitle: "आज के अपडेट, कार्य और देखभाल कार्रवाइयों की समीक्षा करें।",
      Care: "देखभाल",
      Medications: "दवाइयाँ",
      Health: "स्वास्थ्य",
      Support: "सहायता",
      "Family & Community": "परिवार और समुदाय",
      Insights: "अंतर्दृष्टि",
      Profile: "प्रोफ़ाइल",
      General: "सामान्य"
    },
    ta: {
      workspaceSubtitle: "இன்றைய புதுப்பிப்புகள், பணிகள் மற்றும் பராமரிப்பு நடவடிக்கைகளை மதிப்பாய்வு செய்யுங்கள்.",
      Care: "பராமரிப்பு",
      Medications: "மருந்துகள்",
      Health: "உடல்நலம்",
      Support: "ஆதரவு",
      "Family & Community": "குடும்பம் மற்றும் சமூகத்தினர்",
      Insights: "பார்வைகள்",
      Profile: "சுயவிவரம்",
      General: "பொது"
    },
    te: {
      workspaceSubtitle: "ఈరోజు నవీకరణలు, పనులు మరియు సంరక్షణ చర్యలను సమీక్షించండి.",
      Care: "సంరక్షణ",
      Medications: "మందులు",
      Health: "ఆరోగ్యం",
      Support: "సహాయం",
      "Family & Community": "కుటుంబం మరియు సమాజం",
      Insights: "అవగాహనలు",
      Profile: "ప్రొఫైల్",
      General: "సాధారణం"
    },
    ml: {
      workspaceSubtitle: "ഇന്നത്തെ അപ്‌ഡേറ്റുകളും ജോലികളും പരിചരണ നടപടികളും പരിശോധിക്കുക.",
      Care: "പരിചരണം",
      Medications: "മരുന്നുകൾ",
      Health: "ആരോഗ്യം",
      Support: "സഹായം",
      "Family & Community": "കുടുംബവും സമൂഹവും",
      Insights: "അവലോകനങ്ങൾ",
      Profile: "പ്രൊഫൈൽ",
      General: "പൊതു"
    },
    pa: {
      workspaceSubtitle: "ਅੱਜ ਦੇ ਅੱਪਡੇਟ, ਕੰਮ ਅਤੇ ਦੇਖਭਾਲ ਕਾਰਵਾਈਆਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ।",
      Care: "ਦੇਖਭਾਲ",
      Medications: "ਦਵਾਈਆਂ",
      Health: "ਸਿਹਤ",
      Support: "ਸਹਾਇਤਾ",
      "Family & Community": "ਪਰਿਵਾਰ ਅਤੇ ਕਮਿਊਨਿਟੀ",
      Insights: "ਝਲਕਾਂ",
      Profile: "ਪ੍ਰੋਫ਼ਾਈਲ",
      General: "ਸਧਾਰਣ"
    }
  };
  if (!auth?.role) {
    return (
      <div className="app-shell min-h-screen px-4 py-6 md:px-8">
        <div className="mx-auto max-w-3xl">
          <LoadingSkeleton lines={5} />
        </div>
      </div>
    );
  }
  const routes = Array.isArray(roleRoutes[normalizedRole]) ? roleRoutes[normalizedRole] : [];
  const renderIcon = (key) => {
    const base = "h-4 w-4";
    switch (key) {
      case "dashboard":
        return <Home className={base} />;
      case "profile":
        return <ShieldCheck className={base} />;
      case "appointments":
      case "consultation":
        return <CalendarDays className={base} />;
      case "book":
      case "booking":
        return <ClipboardPlus className={base} />;
      case "carePlans":
        return <ClipboardList className={base} />;
      case "prescriptions":
      case "dispensing":
        return <Pill className={base} />;
      case "reminders":
      case "alerts":
      case "notifications":
        return <Bell className={base} />;
      case "triage":
      case "health":
      case "observations":
        return <HeartPulse className={base} />;
      case "messages":
      case "aiChatbot":
        return <MessageSquareText className={base} />;
      case "ivrBooking":
      case "voiceAssist":
        return <Mic className={base} />;
      case "futureCare":
        return <Hospital className={base} />;
      case "familyNetwork":
        return <Users className={base} />;
      case "timeline":
        return <Activity className={base} />;
      case "education":
        return <NotebookPen className={base} />;
      case "mentalHealthCheckin":
        return <NotebookPen className={base} />;
      case "intelligence":
      case "populationInsights":
        return <Activity className={base} />;
      case "referrals":
        return <Stethoscope className={base} />;
      case "monitoring":
      case "careGaps":
        return <Activity className={base} />;
      case "inventory":
        return <Package className={base} />;
      case "records":
        return <FileText className={base} />;
      default:
        return <FileText className={base} />;
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
  const roleLabelKey = resolvedRole === "PATIENT"
    ? "patientCredential"
    : resolvedRole === "DOCTOR"
      ? "doctorCredential"
      : resolvedRole === "CAREGIVER"
        ? "caregiverCredential"
        : resolvedRole === "ADMIN"
          ? "admin"
          : "pharmacistCredential";

  const sectionLabels = {
    Care: localizedChromeCopy[language]?.Care ?? translateUiText("Care"),
    Medications: localizedChromeCopy[language]?.Medications ?? translateUiText("Medications"),
    Health: localizedChromeCopy[language]?.Health ?? translateUiText("Health"),
    Support: localizedChromeCopy[language]?.Support ?? translateUiText("Support"),
    "Family & Community": localizedChromeCopy[language]?.["Family & Community"] ?? translateUiText("Family & Community"),
    Insights: localizedChromeCopy[language]?.Insights ?? translateUiText("Insights"),
    Profile: localizedChromeCopy[language]?.Profile ?? translateUiText("Profile"),
    General: localizedChromeCopy[language]?.General ?? translateUiText("General")
  };

  const groupedRoutes = routes.reduce((acc, item) => {
    const section = item.section || "General";
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {});

  const sectionOrder = ["Care", "Medications", "Health", "Support", "Family & Community", "Insights", "Profile", "General"];
  const mobileRoutes = routes.filter((item) => ["dashboard", "appointments", "booking", "book", "messages", "health", "triage", "consultation"].includes(item.labelKey)).slice(0, 4);
  const activeRoute = routes.find((item) => item.path === location.pathname);
  const activeTitle = activeRoute ? translateUiText(t(activeRoute.labelKey)) : translateUiText(t("continuityWorkspace"));
  const activeSection = activeRoute?.section ? (sectionLabels[activeRoute.section] ?? translateUiText(activeRoute.section)) : "";

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const activeRoute = routes.find((item) => item.path === location.pathname);
    const pageTitle = activeRoute ? translateUiText(t(activeRoute.labelKey)) : translateUiText(t("appName"));
    document.title = `TeleCare+ - ${pageTitle}`;
  }, [location.pathname, routes, t, translateUiText]);

  return (
    <div className="app-shell min-h-screen px-3 py-4 sm:px-4 sm:py-6 md:px-8">
      <PageContainer>
        <div className="app-header mb-4 flex flex-col gap-4 rounded-[2rem] px-4 py-4 text-white shadow-panel sm:px-5 sm:py-5 md:mb-6 md:flex-row md:items-center md:justify-between md:px-6 md:py-6">
          <div className="min-w-0 space-y-2">
            <LocalizedText as="p" className="text-sm uppercase tracking-[0.3em] text-teal-200" value={translateUiText(t("appName"))} minLength={2} />
            <LocalizedText as="h1" className="text-2xl font-semibold md:text-3xl" value={activeTitle} minLength={4} />
            <p className="app-header__subtitle text-sm text-slate-200">
              {localizedChromeCopy[language]?.workspaceSubtitle ?? translateUiText("Review updates, tasks, and care actions for today.")}
            </p>
            {activeSection ? (
              <span className="app-header__badge inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">
                {activeSection}
              </span>
            ) : null}
            <p className="text-sm text-slate-300">
              <LocalizedText
                as="span"
                value={`${translateUiText(t("signedInAs"))} ${auth?.fullName || "TeleCare+ User"} (${translateUiText(t(roleLabelKey))})`}
                minLength={4}
              />
            </p>
          </div>
          <div className="flex min-w-0 flex-col items-stretch gap-3 sm:items-start md:flex-row md:items-center md:justify-end">
            <LanguageSwitcher light />
            <button
              className="btn-secondary border-white/20 bg-white/10 text-white hover:border-white hover:text-white"
              aria-label={translateUiText(t("logout"))}
              data-voice-label={translateUiText(t("logout"))}
              onClick={() => {
                logout();
                pushToast({
                  type: "success",
                  title: translateUiText(t("logout")),
                  message: translateUiText("You have been signed out safely.")
                });
                navigate(buildLoginRedirect(languageSearch), { replace: true });
              }}
            >
              <LocalizedText as="span" value={translateUiText(t("logout"))} minLength={2} />
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
          <aside className="app-sidebar glass-card h-fit min-w-0 overflow-hidden p-4 sm:p-5">
            <nav className="space-y-6">
              {sectionOrder
                .filter((section) => groupedRoutes[section]?.length)
                .map((section) => (
                  <div key={section} className="app-nav-group space-y-2">
                    <p className="app-nav-section px-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
                      {sectionLabels[section] ?? translateUiText(section)}
                    </p>
                    <div className="space-y-2">
                      {groupedRoutes[section].map((item) => {
                        const active = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={`${item.path}${languageSearch}`}
                            aria-label={translateUiText(t(item.labelKey))}
                            data-voice-label={translateUiText(t(item.labelKey))}
                            className={`app-nav-item flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                              active ? "app-nav-item--active" : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <span className={`app-nav-icon ${active ? "text-teal-600" : "text-slate-500"}`} title={translateUiText(t(item.labelKey))}>
                              {renderIcon(item.labelKey)}
                            </span>
                            <LocalizedText as="span" value={translateUiText(t(item.labelKey))} minLength={2} />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </nav>
          </aside>
          <main id="page-main" className="min-w-0 space-y-4 pb-24 page-fade-in sm:space-y-6 lg:pb-0" data-page-content="true">
            <OfflineQueueBanner />
            <Outlet />
            {mobileRoutes.length ? (
              <div className="mobile-bottom-nav lg:hidden">
                {mobileRoutes.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={`${item.path}${languageSearch}`}
                      className={`mobile-bottom-nav__item ${active ? "mobile-bottom-nav__item--active" : ""}`}
                    >
                      {renderIcon(item.labelKey)}
                      <span className="text-center leading-tight">{translateUiText(t(item.labelKey))}</span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </main>
        </div>
      </PageContainer>
    </div>
  );
}
/*
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const activeRoute = routes.find((item) => item.path === location.pathname);
    const pageTitle = activeRoute ? translateUiText(t(activeRoute.labelKey)) : translateUiText(t("appName"));
    document.title = `TeleCare+ - ${pageTitle}`;
  }, [location.pathname, routes, t, translateUiText]);
*/

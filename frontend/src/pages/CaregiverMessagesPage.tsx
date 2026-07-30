import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { LogOut, User, ArrowLeft } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useNavigate, Link } from "react-router-dom";
import ChatInterface from "../components/ChatInterface";

export default function CaregiverMessagesPage() {
  const { auth, logout } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };

  return (
    <div className="h-full w-full bg-canvas text-[var(--tc-text)] font-sans flex flex-col overflow-hidden">

      
      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 min-w-0 p-4 lg:p-6 bg-canvas" role="main">
        {/* Topbar */}
        <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeSlideUp z-10 mb-6">
          <div className="flex items-center gap-4">
            <Link 
              to="/caregiver" 
              className="p-2 -ml-2 rounded-full hover:bg-white/10 text-[var(--tc-text-muted)] hover:text-[var(--tc-text)] transition-colors"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="font-display text-3xl font-medium mb-1 text-[var(--tc-text)]">{t("caregiverMessages")}</h1>
              <p className="text-[var(--tc-text-muted)] text-sm">{t("communicateWithThePatientAndTheirCareTeam") || "Communicate with the patient and their care team."}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 text-xs text-[var(--tc-text-muted)] bg-[var(--tc-surface)] border border-[var(--tc-border)] px-3 py-1.5 rounded-full">
                <User size={14} />
                Signed in as {auth?.fullName}
             </div>
            <LanguageSwitcher hideLabel />
            <button 
              onClick={handleLogout} 
              aria-label="Log out"
              className="inline-flex items-center gap-2 px-4 py-2 bg-transparent text-[var(--tc-text-muted)] border border-[var(--tc-border)] rounded-element text-sm font-medium hover:bg-[var(--tc-surface-muted)] hover:text-[var(--tc-text)] transition-colors"
            >
              <LogOut size={16} />{t("logout") || "Logout"}</button>
          </div>
        </div>

        <div className="flex-1 h-0 bg-white rounded-xl shadow border border-gray-200 animate-fadeSlideUp" style={{animationDelay: '0.1s'}}>
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}

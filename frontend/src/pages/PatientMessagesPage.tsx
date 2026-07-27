import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import PatientSidebar from "../components/PatientSidebar";
import { LogOut, MessageSquare, User } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useNavigate } from "react-router-dom";
import ChatInterface from "../components/ChatInterface";

export default function PatientMessagesPage() {
  const { auth, logout } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };

  return (
    <div className="h-full w-full bg-canvas text-[var(--tc-text)] font-sans flex flex-col overflow-hidden lg:flex-row">
      <PatientSidebar />
      
      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 -1 min-w-0 p-4 lg:p-6 bg-canvas" role="main">
        {/* Topbar */}
        <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeSlideUp z-10 mb-6">
          <div>
            <h1 className="font-display text-3xl font-medium mb-1 text-ink">{t("messages") || "Messages"}</h1>
            <p className="text-ink-muted text-sm">{t("communicateDirectlyWithYourCareTeamAndSpecialists") || "Communicate directly with your care team and specialists."}</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 text-xs text-ink-muted bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <User size={14} />
                Signed in as {auth?.fullName}
             </div>
            <LanguageSwitcher hideLabel />
            <button 
              onClick={handleLogout} 
              aria-label="Log out"
              className="inline-flex items-center gap-2 px-4 py-2 bg-transparent text-ink-muted border border-white/10 rounded-element text-sm font-medium hover:bg-white/5 hover:text-ink transition-colors"
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

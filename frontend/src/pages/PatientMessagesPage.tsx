import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import PatientSidebar from "../components/PatientSidebar";
import { LogOut } from "lucide-react";
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
    <div className="shell">
      <PatientSidebar />
      
      <main className="w-full flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <div className="topbar">
          <div>
            <div className="greeting-eyebrow">{t("patientWorkspace") || "Patient workspace"}</div>
            <h1>{t("messages") || "Messages"}</h1>
            <p className="subtext">{t("communicateDirectlyWithYourCareTeamAndSpecialists") || "Communicate directly with your care team and specialists."}</p>
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

        <div className="card flex-1 min-h-[550px] p-0 overflow-hidden">
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}

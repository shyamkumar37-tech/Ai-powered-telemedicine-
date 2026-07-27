import { DynamicState, DynamicStateObject } from "./../types/DynamicState";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldAlert, LogOut } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { buildLoginRedirect } from "../utils/authSession";
import { ReactNode } from "react";

export interface AdminLayoutProps {
  children?: ReactNode;
  actions?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function AdminLayout({ children, actions }: AdminLayoutProps) {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };

  const navLinks = [
    { name: "Dashboard", path: "/admin" },
    { name: "Users", path: "/admin/users" },
    { name: "Audit Logs", path: "/admin/audit-logs" }
  ];

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30 flex flex-col">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h1 className="font-serif text-xl font-medium tracking-tight text-white">TeleCare+ Admin Console</h1>
            </div>
          </div>
          
          <nav aria-label="Admin Navigation" className="hidden md:flex gap-1">
            {navLinks.map((link: DynamicStateObject) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-white/10 text-white' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {actions}
          <LanguageSwitcher />
          <Link to="/patient/dashboard" className="text-sm font-medium text-slate-300 transition hover:text-white">{t("exitAdmin") || "Exit Admin"}</Link>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 py-1.5 pl-2 pr-4 shadow-inner">
            <div className="h-7 w-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
              {t("a") || "A"}</div>
            <span className="text-sm font-medium text-slate-200">{t("adminUser") || "Admin User"}</span>
          </div>
          <button onClick={handleLogout} aria-label="Logout" className="text-slate-400 hover:text-white transition"><LogOut size={20}/></button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto relative z-0" role="main">
        <div className="flex-1 p-6 md:p-8 pb-24">
          {children}
        </div>
      </main>
    </div>
  );
}

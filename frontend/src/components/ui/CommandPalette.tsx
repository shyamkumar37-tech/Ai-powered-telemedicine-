import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { Search, Monitor, Settings, Activity, Users, Calendar, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { AnimatePresence, motion } from "framer-motion";
import { DynamicStateObject, DynamicState } from "./../../types/DynamicState";

export default function CommandPalette() {
  const [open, setOpen] = useState<DynamicState>(false);
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const down = (e: DynamicStateObject) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open: DynamicStateObject) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!auth?.token) return null; // Don't show if not logged in

  const handleSelect = (action: DynamicStateObject) => {
    setOpen(false);
    action();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          
          {/* Palette Dialog */}
          <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            className="relative z-50 w-full max-w-[640px] overflow-hidden rounded-xl border border-[var(--tc-border)] bg-[var(--tc-bg)] shadow-2xl outline-none tc-animate-slide-up"
          >
            <div className="flex items-center border-b border-[var(--tc-border)] px-4">
              <Search className="mr-3 h-5 w-5 text-gray-400" />
              <Command.Input
                placeholder="Type a command or search..."
                className="h-14 w-full bg-transparent text-[var(--tc-text)] placeholder-gray-400 outline-none"
              />
              <div className="ml-4 flex h-6 items-center rounded border border-[var(--tc-border)] bg-black/20 px-2 text-[10px] font-medium text-gray-400">
                ESC
              </div>
            </div>

            <Command.List className="max-h-[350px] overflow-y-auto p-2 scrollbar-thin">
              <Command.Empty className="py-8 text-center text-sm text-gray-500">
                No results found.
              </Command.Empty>

              <Command.Group heading="Navigation" className="px-2 py-1 text-xs font-medium text-gray-400">
                <Command.Item
                  onSelect={() => handleSelect(() => navigate(`/${auth.role.toLowerCase()}`))}
                  className="mt-1 flex cursor-pointer items-center rounded-md px-3 py-2.5 text-sm text-[var(--tc-text)] hover:bg-[var(--tc-accent)] hover:text-white aria-selected:bg-[var(--tc-accent)] aria-selected:text-white"
                >
                  <Activity className="mr-3 h-4 w-4" />
                  Dashboard
                </Command.Item>
                {auth.role === 'DOCTOR' && (
                  <Command.Item
                    onSelect={() => handleSelect(() => navigate("/doctor/appointments"))}
                    className="flex cursor-pointer items-center rounded-md px-3 py-2.5 text-sm text-[var(--tc-text)] hover:bg-[var(--tc-accent)] hover:text-white aria-selected:bg-[var(--tc-accent)] aria-selected:text-white"
                  >
                    <Calendar className="mr-3 h-4 w-4" />
                    Appointments
                  </Command.Item>
                )}
                {auth.role === 'DOCTOR' && (
                  <Command.Item
                    onSelect={() => handleSelect(() => navigate("/doctor/population-insights"))}
                    className="flex cursor-pointer items-center rounded-md px-3 py-2.5 text-sm text-[var(--tc-text)] hover:bg-[var(--tc-accent)] hover:text-white aria-selected:bg-[var(--tc-accent)] aria-selected:text-white"
                  >
                    <Users className="mr-3 h-4 w-4" />
                    Population Insights
                  </Command.Item>
                )}
              </Command.Group>

              <Command.Group heading="Actions" className="px-2 py-1 pt-4 text-xs font-medium text-gray-400">
                <Command.Item
                  onSelect={() => handleSelect(() => navigate("/patient/profile"))}
                  className="mt-1 flex cursor-pointer items-center rounded-md px-3 py-2.5 text-sm text-[var(--tc-text)] hover:bg-[var(--tc-accent)] hover:text-white aria-selected:bg-[var(--tc-accent)] aria-selected:text-white"
                >
                  <Monitor className="mr-3 h-4 w-4" />
                  Toggle Theme (Dark / Light)
                </Command.Item>
                <Command.Item
                  onSelect={() => handleSelect(() => navigate("/patient/profile"))}
                  className="flex cursor-pointer items-center rounded-md px-3 py-2.5 text-sm text-[var(--tc-text)] hover:bg-[var(--tc-accent)] hover:text-white aria-selected:bg-[var(--tc-accent)] aria-selected:text-white"
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Preferences
                </Command.Item>
              </Command.Group>

              <Command.Group heading="Account" className="px-2 py-1 pt-4 text-xs font-medium text-gray-400">
                <Command.Item
                  onSelect={() => handleSelect(() => { logout(); navigate("/login"); })}
                  className="mt-1 flex cursor-pointer items-center rounded-md px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/20 aria-selected:bg-red-500/20"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Log Out
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command.Dialog>
        </div>
      )}
    </AnimatePresence>
  );
}

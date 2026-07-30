import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientProfile, updatePatientProfile } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { supportedLanguages, translateDisplayText } from "../utils/i18n";
import { useToast } from "../components/ui/ToastProvider";
import PatientSidebar from "../components/PatientSidebar";
import { User, LogOut, FileText, UserCircle, Save, AlertTriangle, ShieldCheck } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import DataAccessTransparencyPanel from "../components/patient/DataAccessTransparencyPanel";
import { enableBackgroundAlerts, disableBackgroundAlerts } from "../services/pushService";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function PatientProfilePage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t, translateUiText = (value: string | number) => translateDisplayText(language, value) } = useLanguage();
  const { pushToast } = useToast();
  const patientId = auth?.profileId;
  
  const [form, setForm] = useState<DynamicStateObject | null>(null);
  const [loadError, setLoadError] = useState<DynamicState>("");
  const [saveError, setSaveError] = useState<DynamicState>("");
  const [saving, setSaving] = useState<DynamicState>(false);

  const buildFormFromProfile = (data: DynamicStateObject) => ({
    fullName: data?.user?.fullName || "",
    email: data?.user?.email || "",
    phone: data?.user?.phone || "",
    preferredLanguage: data?.user?.preferredLanguage || "en",
    age: data?.age ?? "",
    gender: data?.gender || "",
    bloodGroup: data?.bloodGroup || "",
    allergies: data?.allergies || "",
    diseases: data?.diseases || "",
    emergencyContactName: data?.emergencyContactName || "",
    emergencyContactPhone: data?.emergencyContactPhone || "",
    medicalHistorySummary: data?.medicalHistorySummary || "",
    emailNotificationsEnabled: data?.user?.emailNotificationsEnabled ?? true,
    smsNotificationsEnabled: data?.user?.smsNotificationsEnabled ?? false,
    pushNotificationsEnabled: data?.user?.pushNotificationsEnabled ?? true
  });

  useEffect(() => {
    if (!patientId) {
      setForm(null);
      setLoadError("Unable to load profile.");
      return;
    }
    fetchPatientProfile(patientId)
      .then((data: DynamicStateObject) => {
        setForm(buildFormFromProfile(data));
        setLoadError("");
      })
      .catch((err: DynamicStateObject) => {
        setForm(null);
        setLoadError(getApiErrorMessage(err, "Unable to load profile."));
      });
  }, [patientId, language]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError("");
      
      // Handle mobile PWA push notification APIs
      if (form.pushNotificationsEnabled) {
        try {
          await enableBackgroundAlerts();
        } catch (e: DynamicStateObject) {
          console.error("Failed to enable push notifications", e);
          pushToast({ type: "warning", title: "Push Notifications", message: e.message || "Could not enable push notifications on this device." });
        }
      } else {
        try {
          await disableBackgroundAlerts();
        } catch (e: DynamicStateObject) {
          console.error("Failed to disable push notifications", e);
        }
      }

      await updatePatientProfile(patientId, form);
      try {
        const refreshed = await fetchPatientProfile(patientId);
        setForm(buildFormFromProfile(refreshed));
        pushToast({ type: "success", title: "Profile Saved", message: "Your profile has been successfully updated." });
      } catch (refreshError: DynamicStateObject) {
        const message = getApiErrorMessage(refreshError, "Unable to load profile.");
        setSaveError(message);
        pushToast({ type: "error", title: "Error", message });
      }
    } catch (err: DynamicStateObject) {
      const message = getApiErrorMessage(err, "Unable to save profile.");
      setSaveError(message);
      pushToast({ type: "error", title: "Error", message });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };

  const languageOptions = supportedLanguages;
  const genderOptions = ["Female", "Male", "Other"];

  return (
    <div className="h-full w-full bg-canvas text-[var(--tc-text)] font-sans flex flex-col overflow-hidden lg:flex-row">
      <PatientSidebar />
      
      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 p-6 lg:p-10 min-w-0" role="main">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeSlideUp">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">{t("patientProfile") || "Patient Profile"}</h1>
            <p className="text-ink-muted text-sm mb-3">{t("manageYourPersonalInformationAndClinicalDetails") || "Manage your personal information and clinical details."}</p>
            <div className="flex gap-2 items-center mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                <UserCircle size={12} className="text-primary" />{t("profile") || "Profile"}</span>
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
          
          <div className="flex items-center gap-4 mb-6">
             <h3 className="font-display text-xl font-medium">{t("personalMedicalInfo") || "Personal & Medical Info"}</h3>
             <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {loadError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-alert/5 border border-alert/20 rounded-xl mt-8">
              <AlertTriangle size={32} className="text-alert mb-4" />
              <h3 className="font-display text-lg mb-2">{t("unableToLoadProfile") || "Unable to load profile"}</h3>
              <p className="text-sm text-ink-muted">{loadError}</p>
            </div>
          ) : !form ? (
            <div className="card-premium !bg-surface mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1,2,3,4,5,6].map((i: DynamicStateObject) => <div key={i} className="card-premium h-16 animate-pulse bg-white/5"></div>)}
              </div>
            </div>
          ) : (
            <div className="card-premium !bg-surface mt-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Identity */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-sm font-semibold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                    <UserCircle size={18} /> {t("identityContact") || "Identity & Contact"}</h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("fullName") || "Full Name"}</label>
                    <input 
                      type="text" 
                      value={form.fullName} 
                      onChange={(e: DynamicStateObject) => setForm({...form, fullName: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("email") || "Email"}</label>
                    <input 
                      type="email" 
                      value={form.email} 
                      onChange={(e: DynamicStateObject) => setForm({...form, email: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("phone") || "Phone"}</label>
                    <input 
                      type="text" 
                      value={form.phone} 
                      onChange={(e: DynamicStateObject) => setForm({...form, phone: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("preferredLanguage") || "Preferred Language"}</label>
                    <select 
                      value={form.preferredLanguage} 
                      onChange={(e: DynamicStateObject) => setForm({...form, preferredLanguage: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors"
                    >
                      {languageOptions.map((option: DynamicStateObject) => (
                        <option key={option.code} value={option.code} className="bg-canvas">{translateDisplayText(language, option.code)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("age") || "Age"}</label>
                      <input 
                        type="number" 
                        value={form.age} 
                        onChange={(e: DynamicStateObject) => setForm({...form, age: Number(e.target.value)})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("gender") || "Gender"}</label>
                      <select 
                        value={form.gender} 
                        onChange={(e: DynamicStateObject) => setForm({...form, gender: e.target.value})}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors"
                      >
                        <option value="" className="bg-canvas">{t("notSet") || "Not set"}</option>
                        {genderOptions.map((option: DynamicStateObject) => (
                          <option key={option} value={option} className="bg-canvas">{translateDisplayText(language, option)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Clinical */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-sm font-semibold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                    <FileText size={18} /> {t("medicalEmergency") || "Medical & Emergency"}</h4>

                  <div>
                    <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("bloodGroup") || "Blood Group"}</label>
                    <input 
                      type="text" 
                      value={form.bloodGroup} 
                      onChange={(e: DynamicStateObject) => setForm({...form, bloodGroup: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("allergies") || "Allergies"}</label>
                    <input 
                      type="text" 
                      value={form.allergies} 
                      onChange={(e: DynamicStateObject) => setForm({...form, allergies: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("preExistingDiseases") || "Pre-existing Diseases"}</label>
                    <input 
                      type="text" 
                      value={form.diseases} 
                      onChange={(e: DynamicStateObject) => setForm({...form, diseases: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("emergencyContactName") || "Emergency Contact Name"}</label>
                    <input 
                      type="text" 
                      value={form.emergencyContactName} 
                      onChange={(e: DynamicStateObject) => setForm({...form, emergencyContactName: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("emergencyContactPhone") || "Emergency Contact Phone"}</label>
                    <input 
                      type="text" 
                      value={form.emergencyContactPhone} 
                      onChange={(e: DynamicStateObject) => setForm({...form, emergencyContactPhone: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-2">{t("medicalHistorySummary") || "Medical History Summary"}</label>
                    <textarea 
                      value={form.medicalHistorySummary} 
                      onChange={(e: DynamicStateObject) => setForm({...form, medicalHistorySummary: e.target.value})}
                      className="w-full h-[100px] p-3 bg-white/5 border border-white/10 rounded-xl text-ink outline-none focus:border-primary/50 transition-colors resize-y" 
                    />
                  </div>
                </div>

              </div>

              {/* Notification Preferences */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <h4 className="text-sm font-semibold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                  <ShieldCheck size={18} /> {t("notificationPreferences") || "Notification Preferences"}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.emailNotificationsEnabled} 
                      onChange={(e: DynamicStateObject) => setForm({...form, emailNotificationsEnabled: e.target.checked})}
                      className="w-5 h-5 accent-primary bg-white/5 border border-white/10 rounded" 
                    />
                    <span className="text-sm text-ink font-medium">{t("emailNotifications") || "Email Notifications"}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.smsNotificationsEnabled} 
                      onChange={(e: DynamicStateObject) => setForm({...form, smsNotificationsEnabled: e.target.checked})}
                      className="w-5 h-5 accent-primary bg-white/5 border border-white/10 rounded" 
                    />
                    <span className="text-sm text-ink font-medium">{t("sMSNotifications") || "SMS Notifications"}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.pushNotificationsEnabled} 
                      onChange={(e: DynamicStateObject) => setForm({...form, pushNotificationsEnabled: e.target.checked})}
                      className="w-5 h-5 accent-primary bg-white/5 border border-white/10 rounded" 
                    />
                    <span className="text-sm text-ink font-medium">{t("pushNotifications") || "Push Notifications"}</span>
                  </label>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-end gap-4">
                {saveError && <p className="text-sm font-medium text-alert animate-fadeIn">{saveError}</p>}
                <button 
                  className="btn-primary py-2.5 px-6 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={saving} 
                  onClick={handleSave}
                >
                  <Save size={18} className={saving ? "animate-pulse" : ""} /> {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>

            </div>
          )}

          {/* Data Access Transparency Panel */}
          {patientId && (
            <DataAccessTransparencyPanel patientId={patientId} />
          )}

        </div>
      </main>
    </div>
  );
}

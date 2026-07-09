import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LocalizedText from "../components/LocalizedText";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientProfile, updatePatientProfile } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { supportedLanguages, translateDisplayText } from "../utils/i18n";
import { useToast } from "../components/ui/ToastProvider";
import PatientSidebar from "../components/PatientSidebar";
import "./patient-booking-override.css";
import { User, LogOut, FileText, UserCircle, Save, AlertTriangle, ShieldCheck } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function PatientProfilePage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const { pushToast } = useToast();
  const patientId = auth?.profileId;
  
  const [form, setForm] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const buildFormFromProfile = (data) => ({
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
    medicalHistorySummary: data?.medicalHistorySummary || ""
  });

  useEffect(() => {
    if (!patientId) {
      setForm(null);
      setLoadError("Unable to load profile.");
      return;
    }
    fetchPatientProfile(patientId)
      .then((data) => {
        setForm(buildFormFromProfile(data));
        setLoadError("");
      })
      .catch((err) => {
        setForm(null);
        setLoadError(getApiErrorMessage(err, "Unable to load profile."));
      });
  }, [patientId, language]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError("");
      await updatePatientProfile(patientId, form);
      try {
        const refreshed = await fetchPatientProfile(patientId);
        setForm(buildFormFromProfile(refreshed));
        pushToast({ type: "success", title: "Profile Saved", message: "Your profile has been successfully updated." });
      } catch (refreshError) {
        const message = getApiErrorMessage(refreshError, "Unable to load profile.");
        setSaveError(message);
        pushToast({ type: "error", title: "Error", message });
      }
    } catch (err) {
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
    <div id="tct-root">
      <div className="app">
        <PatientSidebar />
        
        <main id="page-main" role="main">
          <div className="topbar">
            <div>
              <h1 className="serif">Patient Profile</h1>
              <p>Manage your personal information and clinical details.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <UserCircle />Profile
              </div>
              <div className="signed-in" style={{ marginTop: '12px', marginLeft: '8px' }}>
                <User />
                Signed in as {auth?.fullName || "Anita Patient"}
              </div>
            </div>
            <div className="topbar-right">
              <LanguageSwitcher customClass="lang" hideLabel />
              <button className="btn-ghost" onClick={handleLogout} aria-label="Log out">
                <LogOut />Logout
              </button>
            </div>
          </div>

          <div className="booking-layout">
            <div style={{ flex: 1, padding: '32px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
              
              <div className="tct-animate-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                   <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Personal & Medical Info</h3>
                   <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                </div>

                {loadError ? (
                  <div className="empty-state">
                    <AlertTriangle />
                    <h3>Unable to load profile</h3>
                    <p>{loadError}</p>
                  </div>
                ) : !form ? (
                  <div className="doctor-card" style={{ padding: '32px' }}>
                    <div className="doctors-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-pulse" style={{ height: '60px', borderRadius: '8px' }}></div>)}
                    </div>
                  </div>
                ) : (
                  <div className="doctor-card" style={{ cursor: 'default', padding: '32px' }}>
                    
                    <div className="doctors-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                      
                      {/* Identity */}
                      <div className="space-y-4">
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--tct-teal)', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <UserCircle size={16} /> Identity & Contact
                        </h4>
                        
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Full Name</label>
                          <input 
                            type="text" 
                            value={form.fullName} 
                            onChange={e => setForm({...form, fullName: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Email</label>
                          <input 
                            type="email" 
                            value={form.email} 
                            onChange={e => setForm({...form, email: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Phone</label>
                          <input 
                            type="text" 
                            value={form.phone} 
                            onChange={e => setForm({...form, phone: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Preferred Language</label>
                          <select 
                            value={form.preferredLanguage} 
                            onChange={e => setForm({...form, preferredLanguage: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }}
                          >
                            {languageOptions.map(option => (
                              <option key={option.code} value={option.code}>{translateDisplayText(language, option.code)}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Age</label>
                            <input 
                              type="number" 
                              value={form.age} 
                              onChange={e => setForm({...form, age: Number(e.target.value)})}
                              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Gender</label>
                            <select 
                              value={form.gender} 
                              onChange={e => setForm({...form, gender: e.target.value})}
                              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }}
                            >
                              <option value="">Not set</option>
                              {genderOptions.map(option => (
                                <option key={option} value={option}>{translateDisplayText(language, option)}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Clinical */}
                      <div className="space-y-4">
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--tct-teal)', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <FileText size={16} /> Medical & Emergency
                        </h4>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Blood Group</label>
                          <input 
                            type="text" 
                            value={form.bloodGroup} 
                            onChange={e => setForm({...form, bloodGroup: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Allergies</label>
                          <input 
                            type="text" 
                            value={form.allergies} 
                            onChange={e => setForm({...form, allergies: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Pre-existing Diseases</label>
                          <input 
                            type="text" 
                            value={form.diseases} 
                            onChange={e => setForm({...form, diseases: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Emergency Contact Name</label>
                          <input 
                            type="text" 
                            value={form.emergencyContactName} 
                            onChange={e => setForm({...form, emergencyContactName: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Emergency Contact Phone</label>
                          <input 
                            type="text" 
                            value={form.emergencyContactPhone} 
                            onChange={e => setForm({...form, emergencyContactPhone: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Medical History Summary</label>
                          <textarea 
                            value={form.medicalHistorySummary} 
                            onChange={e => setForm({...form, medicalHistorySummary: e.target.value})}
                            style={{ width: '100%', minHeight: '80px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none', resize: 'vertical' }} 
                          />
                        </div>
                      </div>

                    </div>

                    <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--tct-panel-line)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
                      {saveError && <p style={{ fontSize: '14px', color: 'var(--tct-coral)', fontWeight: '500' }}>{saveError}</p>}
                      <button 
                        className="btn-primary" 
                        disabled={saving} 
                        onClick={handleSave}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                      >
                        <Save size={16} /> {saving ? "Saving..." : "Save Profile"}
                      </button>
                    </div>

                  </div>
                )}
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

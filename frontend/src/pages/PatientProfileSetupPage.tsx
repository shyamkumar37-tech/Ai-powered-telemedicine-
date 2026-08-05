import { DynamicState, DynamicStateObject } from "./../types/DynamicState";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { updatePatientProfile } from "../services/telecareService";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, Phone, Calendar, ArrowRight, ArrowLeft, 
  Activity, ShieldPlus, Heart, MapPin, Pill, FileText, 
  CheckCircle2, X, Droplet, Contact, Info, AlertCircle
} from "lucide-react";

// Custom UI Components with Floating Labels and High Contrast
export interface FloatingInputProps {
  label?: DynamicState;
  Icon?: DynamicState;
  value?: DynamicState;
  onChange?: (...args: DynamicStateObject[]) => void;
  type?: DynamicState;
  required?: DynamicState;
  name?: DynamicState;
  helperText?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

const FloatingInput = ({ label, icon: Icon, value, onChange, type="text", required, name, helperText }: FloatingInputProps) => {
  const [focused, setFocused] = useState<DynamicState>(false);
  const active = focused || (value && value.toString().length > 0) || type === "date";
  
  return (
    <div className="relative w-full group flex flex-col gap-1.5">
      <div className="relative">
        <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${active ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
          {Icon && <Icon size={20} strokeWidth={focused ? 2.5 : 2} />}
        </div>
        <input 
          id={name} type={type} name={name} value={value} onChange={onChange} required={required}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className={`w-full bg-white border-2 rounded-2xl pt-7 pb-2.5 px-14 text-[15px] font-semibold text-slate-900 outline-none transition-all duration-300 ${focused ? 'border-slate-900 shadow-sm' : 'border-slate-300 hover:border-slate-400'} ${active && !focused ? 'border-slate-300' : ''}`}
        />
        <label htmlFor={name} className={`absolute left-14 transition-all duration-300 pointer-events-none ${active ? 'top-2 text-[11px] text-slate-900 font-bold uppercase tracking-wider' : 'top-1/2 -translate-y-1/2 text-[15px] text-slate-600 font-semibold'}`}>
          {label} {required && <span className="text-red-600 ml-0.5">*</span>}
        </label>
        {active && value && !focused && required && (
           <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600">
             <CheckCircle2 size={18} strokeWidth={2.5} />
           </div>
        )}
      </div>
      {helperText && <p className="text-[13px] text-slate-700 font-medium ml-4">{helperText}</p>}
    </div>
  );
};

export interface SelectInputProps {
  label?: DynamicState;
  Icon?: DynamicState;
  value?: DynamicState;
  onChange?: (...args: DynamicStateObject[]) => void;
  name?: DynamicState;
  options?: DynamicState;
  required?: DynamicState;
  helperText?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

const SelectInput = ({ label, icon: Icon, value, onChange, name, options, required, helperText }: SelectInputProps) => (
  <div className="relative w-full group flex flex-col gap-1.5">
    <div className="relative">
      <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${(value && value.toString().length > 0) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
        {Icon && <Icon size={20} strokeWidth={(value && value.toString().length > 0) ? 2.5 : 2} />}
      </div>
      <select 
        id={name} name={name} value={value} onChange={onChange} required={required}
        className={`w-full bg-white border-2 rounded-2xl pt-7 pb-2.5 px-14 text-[15px] font-semibold text-slate-900 outline-none transition-all duration-300 appearance-none cursor-pointer ${(value && value.toString().length > 0) ? 'border-slate-300 focus:border-slate-900 focus:shadow-sm' : 'border-slate-300 hover:border-slate-400 focus:border-slate-900 focus:shadow-sm'}`}
      >
        <option value="" disabled hidden></option>
        {options.map((opt: DynamicStateObject) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
         <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <label htmlFor={name} className={`absolute left-14 transition-all duration-300 pointer-events-none ${(value && value.toString().length > 0) ? 'top-2 text-[11px] text-slate-900 font-bold uppercase tracking-wider' : 'top-1/2 -translate-y-1/2 text-[15px] text-slate-600 font-semibold'}`}>
        {label} {required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
    </div>
    {helperText && <p className="text-[13px] text-slate-700 font-medium ml-4">{helperText}</p>}
  </div>
);

export interface UnitInputProps {
  label?: DynamicState;
  Icon?: DynamicState;
  value?: DynamicState;
  onChange?: (...args: DynamicStateObject[]) => void;
  unit?: DynamicState;
  onUnitChange?: (...args: DynamicStateObject[]) => void;
  units?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

const UnitInput = ({ label, icon: Icon, value, onChange, unit, onUnitChange, units }: UnitInputProps) => {
  const [focused, setFocused] = useState<DynamicState>(false);
  const active = focused || (value && value.toString().length > 0);
  
  return (
    <div className="relative w-full group flex rounded-2xl transition-all duration-300">
      <div className="relative flex-1">
        <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${active ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
          {Icon && <Icon size={20} strokeWidth={focused ? 2.5 : 2} />}
        </div>
        <input 
          id={`unit-${label}`} type="number" value={value} onChange={onChange} placeholder="" min="0" step="0.1"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className={`w-full bg-white border-2 border-r-0 rounded-l-2xl pt-7 pb-2.5 px-14 text-[15px] font-semibold text-slate-900 outline-none transition-all duration-300 ${focused ? 'border-slate-900' : 'border-slate-300 hover:border-slate-400'} z-10 relative`}
        />
        <label htmlFor={`unit-${label}`} className={`absolute left-14 transition-all duration-300 pointer-events-none z-20 ${active ? 'top-2 text-[11px] text-slate-900 font-bold uppercase tracking-wider' : 'top-1/2 -translate-y-1/2 text-[15px] text-slate-600 font-semibold'}`}>
          {label}
        </label>
      </div>
      <div className={`border-2 rounded-r-2xl bg-slate-100 flex items-center justify-center w-[90px] relative z-0 border-l-0 transition-colors duration-300 ${focused ? 'border-slate-900 border-l-2' : 'border-slate-300 group-hover:border-slate-400'}`}>
        <select value={unit} onChange={onUnitChange} className="w-full h-full bg-transparent px-4 outline-none text-[15px] font-bold text-slate-800 cursor-pointer appearance-none text-center hover:text-slate-900 transition-colors focus:text-slate-900">
          {units.map((u: DynamicStateObject) => <option key={u} value={u}>{u}</option>)}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
           <svg width="10" height="6" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
    </div>
  );
};

export interface TagInputProps {
  label?: DynamicState;
  Icon?: DynamicState;
  tags?: DynamicState;
  setTags?: DynamicState;
  placeholder?: DynamicState;
  helperText?: DynamicState;
  translateUiText?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

const TagInput = ({ label, icon: Icon, tags, setTags, placeholder, helperText, translateUiText }: TagInputProps) => {
  const { t } = useLanguage();
  const [input, setInput] = useState<DynamicState>("");
  const [focused, setFocused] = useState<DynamicState>(false);
  
  const addTag = (e: DynamicStateObject) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) setTags([...tags, input.trim()]);
      setInput("");
    }
  };
  
  const removeTag = (indexToRemove: DynamicStateObject) => {
    setTags(tags.filter((_: DynamicStateObject, idx: DynamicStateObject) => idx !== indexToRemove));
  };
  
  return (
    <div className="flex flex-col gap-2 w-full group">
      <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 pl-2">
        {Icon && <Icon size={18} className={tags.length > 0 ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700 transition-colors"} />} {label}
      </label>
      <div className={`flex flex-wrap items-center gap-2 p-3 h-[72px] bg-white border-2 rounded-2xl transition-all duration-300 ${focused ? 'border-slate-900 shadow-sm' : 'border-slate-300 hover:border-slate-400'}`}>
        <AnimatePresence>
          {tags.map((tag: DynamicStateObject, idx: DynamicStateObject) => (
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              key={tag} 
              className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 text-slate-900 px-3 py-1.5 rounded-xl text-[14px] font-bold shadow-sm"
            >
              {tag}
              <button type="button" onClick={() => removeTag(idx)} className="hover:text-red-600 hover:bg-red-50 rounded-full p-0.5 transition-colors focus:outline-none"><X size={16} strokeWidth={3} /></button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input 
          type="text" 
          value={input} 
          onChange={(e: DynamicStateObject) => setInput(e.target.value)} 
          onKeyDown={addTag} 
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={tags.length === 0 ? placeholder : (t("typeAndPressEnter") || "Type and press enter...")} 
          className="flex-1 w-[200px] outline-none bg-transparent text-[15px] px-2 py-1.5 text-slate-900 placeholder-slate-500 font-semibold"
        />
      </div>
      <p className="text-[13px] text-slate-700 font-medium pl-4 flex items-center gap-1.5">
        <Info size={14} /> {helperText || (t("pressEnterToAddMultipleItemsToTheList") || "Press Enter to add multiple items to the list")}
      </p>
    </div>
  );
};

// Abstract Healthcare Background Elements (Kept light and subtle)
const HealthcareBackground = () => (
  <div className="absolute inset-0 pointer-events-none z-0 select-none">
    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-teal-400/5 blur-[100px]" />
    <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[120px]" />
    <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[100px]" />
    
    <svg className="absolute w-full h-full opacity-[0.02] text-slate-900" viewBox="0 0 100 100" preserveAspectRatio="none">
       <path d="M0,50 Q25,20 50,50 T100,50" fill="none" stroke="currentColor" strokeWidth="0.5" />
       <path d="M0,60 Q25,90 50,60 T100,60" fill="none" stroke="currentColor" strokeWidth="0.5" />
       <circle cx="25" cy="35" r="1" fill="currentColor" />
       <circle cx="75" cy="65" r="1" fill="currentColor" />
    </svg>
    <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-30"></div>
  </div>
);

export default function PatientProfileSetupPage() {
  const { t } = useLanguage();
  const { auth, updateAuthData } = useAuth();
  const { language, translateUiText } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<DynamicState>(false);
  const [error, setError] = useState<DynamicState>("");
  const [step, setStep] = useState<DynamicState>(1);
  const totalSteps = 3;
  
  const [heightVal, setHeightVal] = useState<DynamicState>("");
  const [heightUnit, setHeightUnit] = useState<DynamicState>("cm");
  const [weightVal, setWeightVal] = useState<DynamicState>("");
  const [weightUnit, setWeightUnit] = useState<DynamicState>("kg");
  const [allergies, setAllergies] = useState<DynamicStateObject[]>([]);
  const [diseases, setDiseases] = useState<DynamicStateObject[]>([]);
  const [medications, setMedications] = useState<DynamicStateObject[]>([]);

  const [form, setForm] = useState<DynamicState>({
    fullName: auth?.fullName || "",
    email: auth?.email || "",
    phone: auth?.phone || "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    insuranceInfo: "",
    preferredLanguage: auth?.preferredLanguage || "en",
  });

  useEffect(() => {
    if (auth?.role !== "PATIENT") {
      navigate("/");
    }
  }, [auth?.role, navigate]);

  const handleChange = (e: DynamicStateObject) => {
    const { name, value } = e.target;
    setForm((prev: DynamicStateObject) => ({ ...prev, [name]: value }));
  };

  const getInitials = (name: DynamicStateObject) => {
    return name ? name.split(" ").map((n: DynamicStateObject) => (n as DynamicStateObject)[0]).join("").toUpperCase().substring(0,2) : "US";
  };

  const completionPercentage = useMemo(() => {
    let completed = 0;
    const requiredFields = [
      form.fullName, form.email, form.phone, form.dateOfBirth, form.gender, 
      form.bloodGroup, heightVal, weightVal, form.emergencyContactName, form.emergencyContactPhone
    ];
    requiredFields.forEach((f: DynamicStateObject) => { if (f && f.toString().trim().length > 0) completed++; });
    return Math.round((completed / requiredFields.length) * 100);
  }, [form, heightVal, weightVal]);

  const handleSubmit = async (e: DynamicStateObject) => {
    e.preventDefault();
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        height: heightVal ? `${heightVal} ${heightUnit}` : "",
        weight: weightVal ? `${weightVal} ${weightUnit}` : "",
        allergies: allergies.join(", "),
        diseases: diseases.join(", "),
        currentMedications: medications.join(", "),
        isProfileComplete: true 
      };
      
      await updatePatientProfile(auth.profileId, payload);
      
      if (updateAuthData) {
         updateAuthData({
           isProfileComplete: true,
           fullName: form.fullName,
           phone: form.phone,
           email: form.email,
           preferredLanguage: form.preferredLanguage
         });
      }
      
      toast.success((t("profileSetupSuccessfullyCompleted") || "Profile setup successfully completed!"));
      const languageSearch = language && language !== "en" ? `?lang=${language}` : "";
      navigate(`/patient${languageSearch}`, { replace: true });
    } catch (err: DynamicStateObject) {
      console.error(err);
      setError(err.response?.data?.message || (t("failedToUpdateProfilePleaseVerifyYourInformationAndTryAgain") || "Failed to update profile. Please verify your information and try again."));
      toast.error((t("failedToUpdateProfile") || "Failed to update profile."));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: (t("personalInfo") || "Personal Info"), desc: (t("basicDetails") || "Basic details"), icon: User },
    { id: 2, title: (t("vitalsContacts") || "Vitals & Contacts"), desc: (t("emergencyPrep") || "Emergency prep"), icon: Activity },
    { id: 3, title: (t("medicalHistory") || "Medical History"), desc: (t("healthRecords") || "Health records"), icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex items-center justify-center overflow-x-hidden relative">
      <HealthcareBackground />

      <div className="max-w-[1100px] w-full relative z-10 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center min-">
        
        {/* Header Area */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-8"
        >
          <div className="flex items-center gap-6">
            <div className="relative group cursor-default">
              <div className="w-24 h-24 rounded-full bg-slate-800 p-[4px] shadow-lg transition-transform duration-500 group-hover:scale-105 group-hover:rotate-6">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center border-[4px] border-white relative">
                   <div className="absolute inset-0 bg-slate-50" />
                   <span className="text-3xl font-display font-black text-slate-900 relative z-10 tracking-tighter">
                     {getInitials(form.fullName)}
                   </span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-md border-2 border-slate-200 text-slate-900">
                <ShieldPlus size={20} strokeWidth={2.5} />
              </div>
            </div>
            
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold text-teal-700 tracking-tight leading-tight" style={{ textShadow: 'none' }}>
                {(t("completeYour") || "Complete Your")} <br className="hidden md:block" />{(t("healthProfile") || "Health Profile")}
              </h1>
              <p className="text-teal-600 font-semibold text-lg mt-3 flex items-center gap-2">
                 <Info size={20} className="text-teal-600" /> {(t("securelySetUpYourClinicalRecordToProceed") || "Securely set up your clinical record to proceed.")}
              </p>
            </div>
          </div>
          
          {/* Global Progress Indicator */}
          <div className="bg-white px-6 py-5 rounded-3xl shadow-sm border-2 border-slate-200 flex flex-col gap-2 w-[240px]">
            <div className="flex justify-between items-end">
              <span className="text-sm font-extrabold text-teal-700 uppercase tracking-wider">{(t("completion") || "Completion")}</span>
              <span className="text-2xl font-black text-teal-700">{completionPercentage}<span className="text-teal-600 text-lg ml-0.5">%</span></span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 shadow-inner">
              <motion.div 
                initial={{ width: 0 }} animate={{ width: `${completionPercentage}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-slate-900 h-full rounded-full relative"
              >
              </motion.div>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8">
            <div className="p-5 rounded-2xl bg-red-50 text-red-900 border-2 border-red-200 shadow-sm flex items-start gap-4 font-bold">
              <AlertCircle size={24} strokeWidth={2.5} className="shrink-0 mt-0.5 text-red-700" /> 
              <p className="leading-relaxed">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Main Form Interface */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <form onSubmit={handleSubmit} className="bg-white border-2 border-slate-200 shadow-xl shadow-slate-200/50 rounded-[32px] flex flex-col relative">
            
            {/* Connected Step Navigation */}
            <div className="bg-slate-50 border-b-2 border-slate-200 p-6 sm:px-10">
              <div className="flex items-center justify-between relative max-w-3xl mx-auto">
                {/* Connecting Line */}
                <div className="absolute top-6 left-[10%] right-[10%] h-1.5 bg-slate-200 rounded-full -z-0" />
                <div className="absolute top-6 left-[10%] h-1.5 bg-slate-900 rounded-full transition-all duration-500 -z-0" style={{ width: `${((step - 1) / (totalSteps - 1)) * 80}%` }} />
                
                {steps.map((s: DynamicStateObject) => {
                  const isActive = step === s.id;
                  const isCompleted = step > s.id;
                  return (
                    <div key={s.id} className="relative z-10 flex flex-col items-center gap-3 w-1/3">
                      <motion.div 
                        animate={{ 
                          scale: isActive ? 1.15 : 1,
                          backgroundColor: isActive ? '#0f172a' : isCompleted ? '#334155' : '#f8fafc',
                          color: isActive || isCompleted ? '#ffffff' : '#64748b',
                          borderColor: isActive || isCompleted ? '#0f172a' : '#cbd5e1'
                        }}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 shadow-sm transition-colors duration-300`}
                      >
                        {isCompleted ? <CheckCircle2 size={22} strokeWidth={3} /> : <s.icon size={22} strokeWidth={isActive ? 3 : 2.5} />}
                      </motion.div>
                      <div className="text-center">
                        <p className={`text-[13px] font-extrabold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-teal-700' : isCompleted ? 'text-slate-700' : 'text-slate-500'}`}>{(t("step") || "Step")} {s.id}</p>
                        <p className={`text-[15px] font-bold hidden sm:block mt-0.5 transition-colors duration-300 ${isActive ? 'text-teal-700' : 'text-slate-600'}`}>{s.title}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Form Content */}
            <div className="p-8 sm:p-12 h-[460px] bg-white relative">
               <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none text-slate-900">
                 {step === 1 && <User size={200} />}
                 {step === 2 && <Activity size={200} />}
                 {step === 3 && <FileText size={200} />}
               </div>
               
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4, ease: "easeOut" }} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 relative z-10">
                    <div className="md:col-span-2 mb-2">
                       <h3 className="text-3xl font-extrabold text-teal-800" style={{ textShadow: 'none' }}>{(t("personalDetails") || "Personal Details")}</h3>
                       <p className="text-slate-700 font-medium mt-1">{(t("provideYourBasicIdentificationAndContactInformation") || "Provide your basic identification and contact information.")}</p>
                    </div>
                    
                    <FloatingInput label={(t("legalFullName") || "Legal Full Name")} name="fullName" value={form.fullName} onChange={handleChange} required icon={User} />
                    <FloatingInput label={(t("emailAddress") || "Email Address")} type="email" name="email" value={form.email} onChange={handleChange} required icon={Mail} />
                    <FloatingInput label={(t("primaryPhoneNumber") || "Primary Phone Number")} name="phone" value={form.phone} onChange={handleChange} required icon={Phone} />
                    <FloatingInput label={(t("dateOfBirth") || "Date of Birth")} type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} required icon={Calendar} />
                    
                    <SelectInput 
                      label={(t("genderIdentity") || "Gender Identity")} name="gender" value={form.gender} onChange={handleChange} required icon={User}
                      options={[
                        {value: "Male", label: (t("male") || "Male")}, {value: "Female", label: (t("female") || "Female")}, 
                        {value: "Other", label: (t("other") || "Other")}, {value: "Prefer not to say", label: (t("preferNotToSay") || "Prefer not to say")}
                      ]} 
                    />
                    
                    <SelectInput 
                      label={(t("bloodGroup") || "Blood Group")} name="bloodGroup" value={form.bloodGroup} onChange={handleChange} required icon={Droplet}
                      options={[
                        {value: "A+", label: "A+"}, {value: "A-", label: "A-"}, {value: "B+", label: "B+"}, 
                        {value: "B-", label: "B-"}, {value: "AB+", label: "AB+"}, {value: "AB-", label: "AB-"}, 
                        {value: "O+", label: "O+"}, {value: "O-", label: "O-"}
                      ]} 
                    />
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-12 relative z-10">
                    
                    <div>
                      <h3 className="text-3xl font-extrabold text-teal-800 mb-2" style={{ textShadow: 'none' }}>{(t("physicalVitals") || "Physical Vitals")}</h3>
                      <p className="text-slate-700 font-medium mb-8">{(t("theseMetricsHelpCalibrateDosagesAndHealthInsights") || "These metrics help calibrate dosages and health insights.")}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                        <UnitInput 
                          label={(t("currentHeight") || "Current Height")} icon={Activity} value={heightVal} onChange={(e: DynamicStateObject) => setHeightVal(e.target.value)}
                          unit={heightUnit} onUnitChange={(e: DynamicStateObject) => setHeightUnit(e.target.value)} units={["cm", "ft", "in"]}
                        />
                        <UnitInput 
                          label={(t("currentWeight") || "Current Weight")} icon={Activity} value={weightVal} onChange={(e: DynamicStateObject) => setWeightVal(e.target.value)}
                          unit={weightUnit} onUnitChange={(e: DynamicStateObject) => setWeightUnit(e.target.value)} units={["kg", "lbs"]}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-3xl font-extrabold text-teal-800 mb-2" style={{ textShadow: 'none' }}>{(t("emergencyInsurance") || "Emergency & Insurance")}</h3>
                      <p className="text-slate-700 font-medium mb-8">{(t("vitalInformationForRapidResponseAndBilling") || "Vital information for rapid response and billing.")}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                        <FloatingInput label={(t("emergencyContactName") || "Emergency Contact Name")} name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} required icon={Contact} />
                        <FloatingInput label={(t("emergencyContactPhone") || "Emergency Contact Phone")} name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={handleChange} required icon={Phone} />
                        
                        <div className="md:col-span-2">
                          <FloatingInput label={(t("residentialAddress") || "Residential Address")} name="address" value={form.address} onChange={handleChange} icon={MapPin} />
                        </div>
                        <div className="md:col-span-2">
                          <FloatingInput label={(t("insuranceProviderPolicyIDOptional") || "Insurance Provider & Policy ID (Optional)")} name="insuranceInfo" value={form.insuranceInfo} onChange={handleChange} icon={ShieldPlus} helperText={(t("requiredForAutomatedClaimsProcessing") || "Required for automated claims processing.")} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-12 relative z-10">
                    
                    <div>
                       <h3 className="text-3xl font-extrabold text-teal-800 mb-2" style={{ textShadow: 'none' }}>{(t("clinicalHistory") || "Clinical History")}</h3>
                       <p className="text-teal-800 font-bold mb-10">{(t("buildAComprehensiveViewOfYourHealthProfileForYourCareTeam") || "Build a comprehensive view of your health profile for your care team.")}</p>
                       
                       <div className="space-y-10">
                        <TagInput 
                          label={(t("knownAllergiesReactions") || "Known Allergies & Reactions")} icon={AlertCircle} 
                          tags={allergies} setTags={setAllergies} 
                          placeholder={(t("eGPenicillinPeanutsLatex") || "e.g., Penicillin, Peanuts, Latex")} 
                          helperText={(t("includeMedicationFoodAndEnvironmentalAllergies") || "Include medication, food, and environmental allergies.")}
                          translateUiText={translateUiText}
                        />
                        
                        <TagInput 
                          label={(t("chronicConditionsDiagnoses") || "Chronic Conditions & Diagnoses")} icon={Heart} 
                          tags={diseases} setTags={setDiseases} 
                          placeholder={(t("eGType2DiabetesHypertensionAsthma") || "e.g., Type 2 Diabetes, Hypertension, Asthma")} 
                          helperText={(t("listOngoingConditionsYouAreCurrentlyManaging") || "List ongoing conditions you are currently managing.")}
                          translateUiText={translateUiText}
                        />
                        
                        <TagInput 
                          label={(t("currentMedicationsSupplements") || "Current Medications & Supplements")} icon={Pill} 
                          tags={medications} setTags={setMedications} 
                          placeholder={(t("eGLisinopril10mgDailyVitaminD") || "e.g., Lisinopril 10mg daily, Vitamin D")} 
                          helperText={(t("includeDosageAndFrequencyIfKnown") || "Include dosage and frequency if known.")}
                          translateUiText={translateUiText}
                        />
                       </div>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-0 px-8 py-6 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-between z-20">
              <button 
                type="button" 
                onClick={() => setStep(step > 1 ? step - 1 : 1)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-700 bg-white border-2 border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus:ring-4 focus:ring-slate-200'}`}
              >
                <ArrowLeft size={20} strokeWidth={2.5} /> {(t("back") || "Back")}
              </button>
              
              <button 
                type="submit" 
                disabled={loading}
                className="group relative flex items-center justify-center gap-3 px-10 py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-[16px] shadow-lg shadow-slate-900/20 transition-all duration-300 hover:shadow-slate-900/30 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {loading ? (
                    <>{(t("savingProfile") || "Saving Profile...")} <div className="w-5 h-5 border-4 border-slate-500 border-t-white rounded-full animate-spin"></div></>
                  ) : step === totalSteps ? (
                    <>{(t("finalizeEnter") || "Finalize & Enter")} <CheckCircle2 size={22} strokeWidth={3} /></>
                  ) : (
                    <>{(t("saveContinue") || "Save & Continue")} <ArrowRight size={22} strokeWidth={3} className="group-hover:translate-x-1 transition-transform duration-300" /></>
                  )}
                </span>
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </div>
  );
}

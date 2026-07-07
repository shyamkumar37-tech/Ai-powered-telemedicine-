import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateDisplayText } from "../utils/i18n";

function buildRoleDefaults(translateUiText) {
  return {
    PATIENT: { age: 45, gender: translateUiText("Female") },
    DOCTOR: { specialization: translateUiText("General Medicine") },
    CAREGIVER: { relationshipLabel: translateUiText("Family member") },
    PHARMACIST: {}
  };
}

export default function RegisterPage() {
  const { auth, isAuthenticated, register } = useAuth();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const navigate = useNavigate();
  const languageSearch = language && language !== "en" ? `?lang=${language}` : "";
  const roleDefaults = useMemo(() => buildRoleDefaults(translateUiText), [translateUiText]);
  const previousRoleDefaultsRef = useRef(roleDefaults);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "PATIENT",
    preferredLanguage: "en",
    ...roleDefaults.PATIENT
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !auth?.role) {
      return;
    }

    navigate(
      auth.role === "PATIENT"
        ? `/patient${languageSearch}`
        : auth.role === "DOCTOR"
          ? `/doctor${languageSearch}`
          : auth.role === "PHARMACIST"
            ? `/pharmacist${languageSearch}`
            : `/caregiver${languageSearch}`,
      { replace: true }
    );
  }, [auth?.role, isAuthenticated, languageSearch, navigate]);

  useEffect(() => {
    const previousRoleDefaults = previousRoleDefaultsRef.current;
    setForm((current) => {
      if (current.role === "PATIENT") {
        if (
          (!current.gender || current.gender === previousRoleDefaults.PATIENT.gender || current.gender === "Female")
          && current.gender !== roleDefaults.PATIENT.gender
        ) {
          return { ...current, gender: roleDefaults.PATIENT.gender };
        }
        return current;
      }

      if (current.role === "DOCTOR") {
        if (
          (!current.specialization
            || current.specialization === previousRoleDefaults.DOCTOR.specialization
            || current.specialization === "General Medicine")
          && current.specialization !== roleDefaults.DOCTOR.specialization
        ) {
          return { ...current, specialization: roleDefaults.DOCTOR.specialization };
        }
        return current;
      }

      if (current.role === "CAREGIVER") {
        if (
          !current.relationshipLabel
          || current.relationshipLabel === previousRoleDefaults.CAREGIVER.relationshipLabel
          || current.relationshipLabel === "Family member"
        ) {
          if (current.relationshipLabel !== roleDefaults.CAREGIVER.relationshipLabel) {
            return { ...current, relationshipLabel: roleDefaults.CAREGIVER.relationshipLabel };
          }
        }
      }

      return current;
    });

    previousRoleDefaultsRef.current = roleDefaults;
  }, [roleDefaults]);

  const updateRole = (role) => {
    setForm((current) => ({
      fullName: current.fullName,
      email: current.email,
      password: current.password,
      phone: current.phone,
      preferredLanguage: current.preferredLanguage,
      role,
      ...roleDefaults[role]
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const auth = await register(form);
      const destination = auth.role === "PATIENT"
        ? `/patient${languageSearch}`
        : auth.role === "DOCTOR"
          ? `/doctor${languageSearch}`
          : auth.role === "PHARMACIST"
            ? `/pharmacist${languageSearch}`
            : `/caregiver${languageSearch}`;
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t("registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-8">
      <form className="glass-card mx-auto max-w-3xl space-y-5 p-8" onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-clinic">{t("registration")}</p>
            <h1 className="mt-3 text-3xl font-semibold text-ink">{t("registerTitle")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label={t("fullName")} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <FormField label={t("phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <FormField label={t("email")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <FormField label={t("password")} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {["PATIENT", "DOCTOR", "CAREGIVER", "PHARMACIST"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => updateRole(role)}
              aria-label={role === "PATIENT" ? t("patientCredential") : role === "DOCTOR" ? t("doctorCredential") : role === "PHARMACIST" ? t("pharmacistCredential") : t("caregiverCredential")}
              data-voice-label={role === "PATIENT" ? t("patientCredential") : role === "DOCTOR" ? t("doctorCredential") : role === "PHARMACIST" ? t("pharmacistCredential") : t("caregiverCredential")}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${form.role === role ? "border-clinic bg-clinic text-white" : "border-slate-200 bg-white text-slate-600"}`}
            >
              {role === "PATIENT" ? t("patientCredential") : role === "DOCTOR" ? t("doctorCredential") : role === "PHARMACIST" ? t("pharmacistCredential") : t("caregiverCredential")}
            </button>
          ))}
        </div>
        {form.role === "PATIENT" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label={t("age")} type="number" value={form.age || ""} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} required />
            <FormField label={t("gender")} value={form.gender || ""} onChange={(e) => setForm({ ...form, gender: e.target.value })} required />
          </div>
        ) : null}
        {form.role === "DOCTOR" ? (
          <FormField label={t("specialization")} value={form.specialization || ""} onChange={(e) => setForm({ ...form, specialization: e.target.value })} required />
        ) : null}
        {form.role === "CAREGIVER" ? (
          <FormField label={t("relationshipLabel")} value={form.relationshipLabel || ""} onChange={(e) => setForm({ ...form, relationshipLabel: e.target.value })} />
        ) : null}
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{error}</p> : null}
        <button className="btn-primary" disabled={loading} aria-label={loading ? t("creatingAccount") : t("register")} data-voice-label={loading ? t("creatingAccount") : t("register")}>{loading ? t("creatingAccount") : t("register")}</button>
      </form>
    </div>
  );
}

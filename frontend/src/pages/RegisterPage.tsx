import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateDisplayText } from "../utils/i18n";
import { DynamicStateObject, DynamicState } from "./../types/DynamicState";

function buildRoleDefaults(t: DynamicStateObject) {
  return {
    PATIENT: {},
    DOCTOR: { specialization: (t("generalMedicine") || "General Medicine") },
    CAREGIVER: { relationshipLabel: (t("familyMember") || "Family member") },
    PHARMACIST: {}
  };
}

export default function RegisterPage() {
  const { auth, isAuthenticated, register } = useAuth();
  const { language, t } = useLanguage();
  const translateUiText = (value: string | number) => translateDisplayText(language, value);
  const navigate = useNavigate();
  const languageSearch = language && language !== "en" ? `?lang=${language}` : "";
  const roleDefaults = useMemo(() => buildRoleDefaults(t), [t]);
  const previousRoleDefaultsRef = useRef<DynamicState>(roleDefaults);
  const [form, setForm] = useState<DynamicState>({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "PATIENT",
    preferredLanguage: "en",
    ...roleDefaults.PATIENT
  });
  const [loading, setLoading] = useState<DynamicState>(false);
  const [error, setError] = useState<DynamicState>("");

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
    setForm((current: DynamicStateObject) => {
      if (current.role === "PATIENT") {
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

  const updateRole = (role: DynamicStateObject) => {
    setForm((current: DynamicStateObject) => ({
      fullName: current.fullName,
      email: current.email,
      password: current.password,
      phone: current.phone,
      preferredLanguage: current.preferredLanguage,
      role,
      ...(roleDefaults as DynamicStateObject)[role]
    }));
  };

  const onSubmit = async (event: DynamicStateObject) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role
      };
      const auth = await register(payload);
      const destination = auth.role === "PATIENT"
        ? `/patient${languageSearch}`
        : auth.role === "DOCTOR"
          ? `/doctor${languageSearch}`
          : auth.role === "PHARMACIST"
            ? `/pharmacist${languageSearch}`
            : `/caregiver${languageSearch}`;
      navigate(destination, { replace: true });
    } catch (err: DynamicStateObject) {
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
          <FormField label={t("fullName")} value={form.fullName} onChange={(e: DynamicStateObject) => setForm({ ...form, fullName: e.target.value })} required />
          <FormField label={t("phone")} value={form.phone} onChange={(e: DynamicStateObject) => setForm({ ...form, phone: e.target.value })} required />
          <FormField label={t("email")} type="email" value={form.email} onChange={(e: DynamicStateObject) => setForm({ ...form, email: e.target.value })} required />
          <FormField label={t("password")} type="password" value={form.password} onChange={(e: DynamicStateObject) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {["PATIENT", "DOCTOR", "CAREGIVER", "PHARMACIST"].map((role: DynamicStateObject) => (
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
        {form.role === "DOCTOR" ? (
          <FormField label={t("specialization")} value={form.specialization || ""} onChange={(e: DynamicStateObject) => setForm({ ...form, specialization: e.target.value })} required />
        ) : null}
        {form.role === "CAREGIVER" ? (
          <FormField label={t("relationshipLabel")} value={form.relationshipLabel || ""} onChange={(e: DynamicStateObject) => setForm({ ...form, relationshipLabel: e.target.value })} />
        ) : null}
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{error}</p> : null}
        <button className="btn-primary" disabled={loading} aria-label={loading ? t("creatingAccount") : t("register")} data-voice-label={loading ? t("creatingAccount") : t("register")}>{loading ? t("creatingAccount") : t("register")}</button>
      </form>
    </div>
  );
}

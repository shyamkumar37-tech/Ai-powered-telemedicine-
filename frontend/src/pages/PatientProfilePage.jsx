import { useEffect, useState } from "react";
import FormField from "../components/FormField";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientProfile, updatePatientProfile } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { supportedLanguages, translateDisplayText } from "../utils/i18n";
import { useToast } from "../components/ui/ToastProvider";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import ErrorStateCard from "../components/ui/ErrorStateCard";

export default function PatientProfilePage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const { pushToast } = useToast();
  const patientId = auth.profileId;
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
      setLoadError(t("unableLoadProfile"));
      return;
    }
    fetchPatientProfile(patientId)
      .then((data) => {
        setForm(buildFormFromProfile(data));
        setLoadError("");
      })
      .catch((err) => {
        setForm(null);
        setLoadError(getApiErrorMessage(err, t("unableLoadProfile")));
      });
  }, [patientId, language, t]);

  if (loadError) {
    return (
      <SectionCard title={t("patientProfile")}>
        <ErrorStateCard
          title={t("unableLoadProfile")}
          body={loadError}
        />
      </SectionCard>
    );
  }
  if (!form) {
    return (
      <SectionCard title={t("patientProfile")}>
        <LoadingSkeleton lines={4} />
      </SectionCard>
    );
  }

  const fieldLabels = {
    fullName: t("fullName"),
    email: t("email"),
    phone: t("phone"),
    preferredLanguage: t("preferredLanguage"),
    age: t("age"),
    gender: t("gender"),
    bloodGroup: t("bloodGroup"),
    allergies: t("allergies"),
    diseases: t("diseases"),
    emergencyContactName: t("emergencyContactName"),
    emergencyContactPhone: t("emergencyContactPhone"),
    medicalHistorySummary: t("medicalHistorySummary")
  };

  const languageOptions = supportedLanguages;
  const genderOptions = ["Female", "Male", "Other"];
  const translatableValueFields = new Set([
    "allergies",
    "diseases",
    "medicalHistorySummary"
  ]);

  return (
    <SectionCard
      title={t("patientProfile")}
      action={
        <button
          className="btn-primary"
          disabled={saving}
          aria-label={t("saveProfile")}
          data-voice-label={t("saveProfile")}
          onClick={async () => {
            try {
              setSaving(true);
              setSaveError("");
              await updatePatientProfile(patientId, form);
              try {
                const refreshed = await fetchPatientProfile(patientId);
                setForm(buildFormFromProfile(refreshed));
                pushToast({
                  type: "success",
                  title: t("saveProfile"),
                  message: t("profileSavedFor").replace("{name}", refreshed?.user?.fullName || form.fullName || t("patientCredential"))
                });
              } catch (refreshError) {
                const message = getApiErrorMessage(refreshError, t("unableLoadProfile"));
                setSaveError(message);
                pushToast({ type: "error", title: t("unableLoadProfile"), message });
              }
            } catch (err) {
              const message = getApiErrorMessage(err, t("unableSaveProfile"));
              setSaveError(message);
              pushToast({ type: "error", title: t("unableSaveProfile"), message });
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? t("saving") : t("saveProfile")}
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(form).map(([key, value]) => {
          if (key === "preferredLanguage") {
            return (
              <label key={key} className="block space-y-2">
                <span className="text-sm font-medium text-slate-600">{fieldLabels[key]}</span>
                <select className="field" value={value ?? "en"} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
                  {languageOptions.map((option) => (
                    <option key={option.code} value={option.code}>{translateDisplayText(language, option.code)}</option>
                  ))}
                </select>
              </label>
            );
          }

          if (key === "gender") {
            return (
              <label key={key} className="block space-y-2">
                <span className="text-sm font-medium text-slate-600">{fieldLabels[key]}</span>
                <select className="field" value={value ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
                  <option value="">{t("notSet")}</option>
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>{translateDisplayText(language, option)}</option>
                  ))}
                </select>
              </label>
            );
          }

          return (
            <FormField
              key={key}
              label={fieldLabels[key] || key}
              value={value ?? ""}
              helperText={translatableValueFields.has(key) && value && language !== "en"
                ? (
                  <span className="text-xs text-slate-500">
                    {translateUiText("Preview")}: <LocalizedText as="span" value={value} />
                  </span>
                )
                : null}
              onChange={(e) => setForm({ ...form, [key]: key === "age" ? Number(e.target.value) : e.target.value })}
            />
          );
        })}
      </div>
      {saveError ? <p className="mt-4 text-sm text-red-600" role="alert">{saveError}</p> : null}
    </SectionCard>
  );
}

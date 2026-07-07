import { useEffect, useState } from "react";
import FormField from "../components/FormField";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchDoctorProfile, updateDoctorProfile } from "../services/telecareService";
import { supportedLanguages, translateDisplayText } from "../utils/i18n";
import { useToast } from "../components/ui/ToastProvider";
import { getApiErrorMessage } from "../utils/apiError";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import ErrorStateCard from "../components/ui/ErrorStateCard";

export default function DoctorProfilePage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const { pushToast } = useToast();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDoctorProfile(auth.profileId ?? auth.userId)
      .then((data) => {
        setForm({
          fullName: data?.user?.fullName || "",
          email: data?.user?.email || "",
          phone: data?.user?.phone || "",
          preferredLanguage: data?.user?.preferredLanguage || "en",
          specialization: data?.specialization || "",
          qualification: data?.qualification || "",
          availabilitySummary: data?.availabilitySummary || "",
          bio: data?.bio || ""
        });
        setError("");
      })
      .catch((err) => {
        setError(getApiErrorMessage(err, t("unableLoadProfile")));
      });
  }, [auth.profileId, auth.userId]);

  if (error) {
    return (
      <SectionCard title={t("doctorProfile")}>
        <ErrorStateCard
          title={t("unableLoadProfile")}
          body={error}
        />
      </SectionCard>
    );
  }
  if (!form) {
    return (
      <SectionCard title={t("doctorProfile")}>
        <LoadingSkeleton lines={4} />
      </SectionCard>
    );
  }

  const fieldLabels = {
    fullName: t("fullName"),
    email: t("email"),
    phone: t("phone"),
    preferredLanguage: t("preferredLanguage"),
    specialization: t("specialization"),
    qualification: t("qualification"),
    availabilitySummary: t("availabilitySummary"),
    bio: t("bio")
  };

  const languageOptions = supportedLanguages;
  const translatableValueFields = new Set([
    "specialization",
    "availabilitySummary",
    "bio"
  ]);

  return (
    <SectionCard
      title={t("doctorProfile")}
      action={
        <button
          className="btn-primary"
          onClick={async () => {
            try {
              const data = await updateDoctorProfile(auth.profileId ?? auth.userId, form);
              pushToast({
                type: "success",
                title: t("saveProfile"),
                message: t("profileSavedFor").replace("{name}", data?.user?.fullName || form.fullName || t("doctor"))
              });
            } catch (err) {
              const message = getApiErrorMessage(err, t("unableSaveProfile"));
              pushToast({ type: "error", title: t("unableSaveProfile"), message });
            }
          }}
        >
          {t("saveProfile")}
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
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          );
        })}
      </div>
    </SectionCard>
  );
}

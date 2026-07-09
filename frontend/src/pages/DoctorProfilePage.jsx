import { useEffect, useState } from "react";
import LocalizedText from "../components/LocalizedText";
import PremiumSectionCard from "../components/PremiumSectionCard";
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
      <div className="tcd-animate-in">
        <PremiumSectionCard title={t("doctorProfile")}>
          <ErrorStateCard
            title={t("unableLoadProfile")}
            body={error}
          />
        </PremiumSectionCard>
      </div>
    );
  }
  if (!form) {
    return (
      <div className="tcd-animate-in">
        <PremiumSectionCard title={t("doctorProfile")}>
          <LoadingSkeleton lines={4} />
        </PremiumSectionCard>
      </div>
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
    <div className="tcd-animate-in space-y-6">
      <PremiumSectionCard
        title={t("doctorProfile")}
        action={
          <button
            className="doc-btn doc-btn-primary"
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
      <div className="doc-grid-2">
        {Object.entries(form).map(([key, value]) => {
          if (key === "preferredLanguage") {
            return (
              <label key={key} className="block space-y-2">
                <span className="text-sm font-medium text-slate-400">{fieldLabels[key]}</span>
                <select className="doc-input" value={value ?? "en"} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
                  {languageOptions.map((option) => (
                    <option key={option.code} value={option.code}>{translateDisplayText(language, option.code)}</option>
                  ))}
                </select>
              </label>
            );
          }

          const isTextArea = key === 'bio' || key === 'availabilitySummary' || key === 'specialization';

          return (
            <label key={key} className={`block space-y-2 ${isTextArea ? 'col-span-1 md:col-span-2' : ''}`}>
              <span className="text-sm font-medium text-slate-400">{fieldLabels[key] || key}</span>
              {isTextArea ? (
                <textarea
                  className="doc-input min-h-28 resize-y"
                  value={value ?? ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              ) : (
                <input
                  className="doc-input"
                  value={value ?? ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              )}
              {translatableValueFields.has(key) && value && language !== "en" && (
                <span className="text-xs text-slate-400 block mt-1">
                  {translateUiText("Preview")}: <LocalizedText as="span" className="text-teal-400" value={value} />
                </span>
              )}
            </label>
          );
        })}
      </div>
    </PremiumSectionCard>
    </div>
  );
}

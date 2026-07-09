import { useEffect, useState } from "react";
import { applyGlobalLanguage, LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { supportedLanguages } from "../utils/i18n";

export default function LanguageSwitcher({ light = false, customClass, hideLabel = false }) {
  const { language, setLanguage, t } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const [selectedLanguage, setSelectedLanguage] = useState(language || "en");

  useEffect(() => {
    setSelectedLanguage(language || "en");
  }, [language]);

  const handleChange = (nextLanguage) => {
    if (!nextLanguage || nextLanguage === selectedLanguage) {
      return;
    }

    setSelectedLanguage(nextLanguage);
    applyGlobalLanguage(nextLanguage);
    setLanguage(nextLanguage);
  };

  const selectElement = (
    <select
      aria-label={t("language")}
      data-voice-label={t("language")}
      data-testid="language-switcher"
      className={customClass || `rounded-xl border px-3 py-2 text-sm ${light ? "border-white/20 bg-white/10 text-white" : "border-slate-200 bg-white text-slate-700"}`}
      value={selectedLanguage}
      onChange={(e) => handleChange(e.target.value)}
    >
      {supportedLanguages.map((item) => (
        <option key={item.code} value={item.code} className="text-slate-900">
          {item.label}
        </option>
      ))}
    </select>
  );

  if (hideLabel) {
    return selectElement;
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className={light ? "text-slate-200" : "text-slate-600"}>{t("language")}</span>
      {selectElement}
    </label>
  );
}

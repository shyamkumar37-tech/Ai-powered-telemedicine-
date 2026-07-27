import { DynamicState, DynamicStateObject } from "./../types/DynamicState";
import { useEffect, useState } from "react";
import { applyGlobalLanguage, LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { supportedLanguages } from "../utils/i18n";

export interface LanguageSwitcherProps {
  light?: DynamicState;
  customClass?: DynamicState;
  hideLabel?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function LanguageSwitcher({ light = false, customClass, hideLabel = false }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const [selectedLanguage, setSelectedLanguage] = useState<DynamicState>(language || "en");

  useEffect(() => {
    setSelectedLanguage(language || "en");
  }, [language]);

  const handleChange = (nextLanguage: DynamicStateObject) => {
    if (!nextLanguage || nextLanguage === selectedLanguage) {
      return;
    }

    setSelectedLanguage(nextLanguage);
    applyGlobalLanguage(nextLanguage);
    setLanguage(nextLanguage);
  };

  const selectElement = (
    <select
      aria-label={t("language") || "Language"}
      data-voice-label={t("language") || "Language"}
      data-testid="language-switcher"
      className={customClass || `rounded-xl border px-3 py-2 text-sm ${light ? "border-white/20 bg-white/10 text-white" : "border-slate-200 bg-white text-slate-700"}`}
      value={selectedLanguage}
      onChange={(e: DynamicStateObject) => handleChange(e.target.value)}
    >
      {supportedLanguages.map((item: DynamicStateObject) => (
        <option key={item.code} value={item.code} className="bg-slate-800 text-white">
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
      <span className={light ? "text-slate-200" : "text-slate-300"}>{t("language")}</span>
      {selectElement}
    </label>
  );
}

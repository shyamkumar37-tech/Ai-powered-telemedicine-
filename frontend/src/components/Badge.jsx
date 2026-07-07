import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { translateDisplayText } from "../utils/i18n";

export default function Badge({ value }) {
  const { language } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const localizedValue = translateDisplayText(language, value);
  const tone =
    value?.includes("EMERGENCY") || value?.includes("CRITICAL")
      ? "tc-badge--critical"
      : value?.includes("WARNING") || value?.includes("PRIORITY") || value?.includes("IN_PERSON")
        ? "tc-badge--warning"
          : value?.includes("TAKEN") || value?.includes("CONFIRMED") || value?.includes("COMPLETED")
          ? "tc-badge--success"
          : "tc-badge--neutral";

  return (
    <span
      className={`tc-badge ${tone}`}
      aria-label={localizedValue}
      data-voice-label={localizedValue}
    >
      {localizedValue}
    </span>
  );
}

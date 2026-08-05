import { DynamicState } from "./../types/DynamicState";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { translateDisplayText } from "../utils/i18n";

export interface BadgeProps {
  value?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function Badge({ value }: BadgeProps) {
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
      aria-label={localizedValue as string}
      data-voice-label={localizedValue}
    >
      {localizedValue}
    </span>
  );
}

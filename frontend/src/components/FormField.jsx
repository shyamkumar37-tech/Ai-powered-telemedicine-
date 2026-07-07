import { useId } from "react";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { translateDisplayText } from "../utils/i18n";

const HINDI_VALIDATION_MESSAGES = {
  genericRequired: "यह फ़ील्ड भरना आवश्यक है।",
  genericInvalid: "कृपया मान्य जानकारी दर्ज करें।",
  email: "कृपया मान्य ईमेल पता दर्ज करें।",
  number: "कृपया मान्य संख्या दर्ज करें।",
  short: "कृपया इस फ़ील्ड को पूरा करें।",
  long: "कृपया छोटा मान दर्ज करें।"
};

function getHindiValidationMessage(label, input) {
  const fieldLabel = typeof label === "string" && label.trim() ? label.trim() : "";

  if (input.validity.valueMissing) {
    return fieldLabel ? `${fieldLabel} भरना आवश्यक है।` : HINDI_VALIDATION_MESSAGES.genericRequired;
  }

  if (input.validity.typeMismatch) {
    if (String(input.type || "").toLowerCase() === "email") {
      return HINDI_VALIDATION_MESSAGES.email;
    }
    return HINDI_VALIDATION_MESSAGES.genericInvalid;
  }

  if (input.validity.badInput || input.validity.rangeOverflow || input.validity.rangeUnderflow || input.validity.stepMismatch) {
    return HINDI_VALIDATION_MESSAGES.number;
  }

  if (input.validity.tooShort) {
    return fieldLabel ? `${fieldLabel} पूरा दर्ज करें।` : HINDI_VALIDATION_MESSAGES.short;
  }

  if (input.validity.tooLong) {
    return fieldLabel ? `${fieldLabel} छोटा रखें।` : HINDI_VALIDATION_MESSAGES.long;
  }

  if (input.validity.patternMismatch) {
    return HINDI_VALIDATION_MESSAGES.genericInvalid;
  }

  return "";
}

export default function FormField({ label, error, helperText, leadingIcon, ...props }) {
  const { language } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const fieldId = useId();
  const helperId = helperText ? `${fieldId}-helper` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const localizedLabel = typeof label === "string"
    ? translateDisplayText(language, label)
    : label;
  const localizedPlaceholder = typeof props.placeholder === "string"
    ? translateDisplayText(language, props.placeholder)
    : props.placeholder;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;
  const { onInvalid, onInput, onChange, ...inputProps } = props;

  const clearCustomValidation = (event) => {
    event.currentTarget.setCustomValidity("");
  };

  const inputClassName = `field${leadingIcon ? " pl-11" : ""}`;

  return (
    <label className="block space-y-2" htmlFor={fieldId}>
      <span className="text-sm font-semibold text-slate-600">{localizedLabel}</span>
      <div className="relative">
        {leadingIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
            {leadingIcon}
          </span>
        ) : null}
        <input
          id={fieldId}
          className={inputClassName}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          aria-label={typeof localizedLabel === "string" ? localizedLabel : props["aria-label"]}
          data-voice-label={typeof localizedLabel === "string" ? localizedLabel : props["data-voice-label"]}
          onInvalid={(event) => {
            clearCustomValidation(event);
            if (language === "hi") {
              const message = getHindiValidationMessage(localizedLabel, event.currentTarget);
              if (message) {
                event.currentTarget.setCustomValidity(message);
              }
            }
            onInvalid?.(event);
          }}
          onInput={(event) => {
            clearCustomValidation(event);
            onInput?.(event);
          }}
          onChange={(event) => {
            clearCustomValidation(event);
            onChange?.(event);
          }}
          {...inputProps}
          placeholder={localizedPlaceholder}
        />
      </div>
      {helperText ? (
        typeof helperText === "string"
          ? <span id={helperId} className="text-xs text-slate-500">{helperText}</span>
          : helperText
      ) : null}
      {error ? <span id={errorId} className="text-xs text-red-600" role="alert">{error}</span> : null}
    </label>
  );
}

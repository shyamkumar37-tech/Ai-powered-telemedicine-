import { translateDisplayText } from "./i18n";
import { DynamicStateObject } from "./../types/DynamicState";

const FIELD_LABELS = {
  age: "Age",
  appointmentDateTime: "Appointment date & time",
  concernSummary: "Concern summary",
  email: "Email",
  fullName: "Full name",
  gender: "Gender",
  notes: "Notes",
  otp: "OTP",
  password: "Password",
  phone: "Phone",
  requestedAppointmentTime: "Requested appointment time",
  symptoms: "Symptoms"
};

function getStoredLanguage() {
  if (typeof window === "undefined") {
    return "en";
  }

  try {
    const queryLanguage = new URL(window.location.href).searchParams.get("lang");
    if (queryLanguage) {
      return queryLanguage;
    }
  } catch {
    // Ignore malformed URL state.
  }

  try {
    return localStorage.getItem("telecareplus-language")
      || sessionStorage.getItem("telecareplus-language")
      || document.documentElement?.lang
      || "en";
  } catch {
    return document.documentElement?.lang || "en";
  }
}

function getFieldLabel(language: DynamicStateObject, fieldKey: DynamicStateObject) {
  const label = (FIELD_LABELS as DynamicStateObject)[fieldKey];
  return label ? translateDisplayText(language, label) : "";
}

function localizeMessage(language: DynamicStateObject, fieldKey: DynamicStateObject, message: DynamicStateObject) {
  const normalizedMessage = translateDisplayText(language, String(message || "").trim());
  if (!normalizedMessage) {
    return normalizedMessage;
  }

  if (language !== "hi") {
    return normalizedMessage;
  }

  const fieldLabel = getFieldLabel(language, fieldKey);

  if (/(must not be blank|must not be null|must not be empty|Please fill out this field\.)/i.test(String(normalizedMessage))) {
    return fieldLabel ? `${fieldLabel} भरना आवश्यक है।` : "यह फ़ील्ड भरना आवश्यक है।";
  }

  if (/Enter a valid mobile number/i.test(String(normalizedMessage))) {
    return "कृपया मान्य मोबाइल नंबर दर्ज करें।";
  }

  if (/OTP must be 6 digits/i.test(String(normalizedMessage))) {
    return "OTP 6 अंकों का होना चाहिए।";
  }

  if (/Password must be at least 6 characters/i.test(String(normalizedMessage))) {
    return "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।";
  }

  if (/(must be a well-formed email address|valid email)/i.test(String(normalizedMessage))) {
    return "कृपया मान्य ईमेल पता दर्ज करें।";
  }

  if (/Caregiver notes are required/i.test(String(normalizedMessage))) {
    return "देखभालकर्ता नोट्स भरना आवश्यक है।";
  }

  if (/Requested appointment time is required/i.test(String(normalizedMessage))) {
    return "अनुरोधित अपॉइंटमेंट समय भरना आवश्यक है।";
  }

  if (/Concern summary is required/i.test(String(normalizedMessage))) {
    return "चिंता सारांश भरना आवश्यक है।";
  }

  return normalizedMessage;
}

export function getApiErrorMessage(err: DynamicStateObject, fallback: DynamicStateObject) {
  const language = getStoredLanguage();
  if (err?.name === "TimeoutError") {
    return localizeMessage(language, "", err.message || "The request took too long to complete.");
  }
  if (err?.offlineQueued) {
    return localizeMessage(language, "", err.response?.data?.message || "Stored locally as a pending change. It has not reached the server yet and will retry when your connection returns.");
  }
  const payload = err?.response?.data;
  if (!payload) {
    return fallback;
  }
  if (typeof payload === "string") {
    return localizeMessage(language, "", payload);
  }
  if (payload.message) {
    return localizeMessage(language, "", payload.message);
  }
  if (typeof payload === "object") {
    const [firstKey, firstValue] = Object.entries(payload)[0] || [];
    if (typeof firstValue === "string") {
      return localizeMessage(language, firstKey, firstValue);
    }
  }
  return fallback;
}

export const TRIAGE_UPDATED_STORAGE_KEY = "telecareplus-triage-updated-at";
export const TRIAGE_UPDATED_EVENT = "telecareplus-triage-updated";

export function emitTriageUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  const value = String(Date.now());

  try {
    localStorage.setItem(TRIAGE_UPDATED_STORAGE_KEY, value);
  } catch {
    // Ignore persistence failures.
  }

  window.dispatchEvent(new CustomEvent(TRIAGE_UPDATED_EVENT, { detail: value }));
}

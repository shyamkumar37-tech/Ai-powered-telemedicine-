import { DynamicStateObject } from "./../types/DynamicState";

export const AUTH_STORAGE_KEY = "telecareplus-auth";
export const AUTH_CHANGED_EVENT = "telecareplus-auth-changed";

const LOCAL_STORAGE_PREFIXES = [
  "telecareplus-",
  "telecareplus_auth",
  "telecareplus-auth"
];

const SESSION_STORAGE_KEYS = [
  "telecareplus-auth-expired",
  "telecareplus-auth-redirecting",
  "telecareplus-language"
];

function removePrefixedKeys(storage: DynamicStateObject, prefixes: DynamicStateObject) {
  if (!storage) {
    return;
  }

  try {
    const keys = Object.keys(storage);
    keys.forEach((key: DynamicStateObject) => {
      if (prefixes.some((prefix: DynamicStateObject) => key.startsWith(prefix))) {
        try {
          storage.removeItem(key);
        } catch {
          // Ignore storage cleanup failures.
        }
      }
    });
  } catch {
    // Ignore storage enumeration failures.
  }
}

function removeNamedKeys(storage: DynamicStateObject, keys: DynamicStateObject) {
  if (!storage) {
    return;
  }

  keys.forEach((key: DynamicStateObject) => {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore storage cleanup failures.
    }
  });
}

function clearTelecareCookies() {
  if (typeof document === "undefined" || !document.cookie) {
    return;
  }

  document.cookie
    .split(";")
    .map((entry: DynamicStateObject) => entry.trim())
    .filter(Boolean)
    .map((entry: DynamicStateObject) => (entry.split("=") as DynamicStateObject)[0])
    .filter((name: DynamicStateObject) => name && name.toLowerCase().startsWith("telecare"))
    .forEach((name: DynamicStateObject) => {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    });
}

export function buildLoginRedirect(languageSearch = "", forceLogin = true) {
  const hasQuery = languageSearch && languageSearch.startsWith("?");
  if (!forceLogin) {
    return hasQuery ? `/login${languageSearch}` : "/login";
  }
  if (!hasQuery || !languageSearch) {
    return "/login?forceLogin=1";
  }
  return `/login${languageSearch}&forceLogin=1`;
}

export function clearAuthStorageArtifacts() {
  if (typeof window === "undefined") {
    return;
  }

  removePrefixedKeys(window.localStorage, LOCAL_STORAGE_PREFIXES);
  removeNamedKeys(window.sessionStorage, SESSION_STORAGE_KEYS);
  clearTelecareCookies();
}

export function notifyAuthCleared() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: null }));
}

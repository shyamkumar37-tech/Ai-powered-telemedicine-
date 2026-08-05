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

// In-Memory Access Token Storage (PHI & OAuth Security Standard)
let inMemoryAccessToken: string | null = null;

export function setInMemoryAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getInMemoryAccessToken(): string | null {
  return inMemoryAccessToken;
}

function removePrefixedKeys(storage: Storage, prefixes: string[]) {
  if (!storage) {
    return;
  }

  try {
    const keys = Object.keys(storage);
    keys.forEach((key: string) => {
      if (key === "telecareplus-language") {
        return;
      }
      if (prefixes.some((prefix: string) => key.startsWith(prefix))) {
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

function removeNamedKeys(storage: Storage, keys: string[]) {
  if (!storage) {
    return;
  }

  keys.forEach((key: string) => {
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
    .map((entry: string) => entry.trim())
    .filter(Boolean)
    .map((entry: string) => entry.split("=")[0])
    .filter((name: string) => name && name.toLowerCase().startsWith("telecare"))
    .forEach((name: string) => {
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
  setInMemoryAccessToken(null);

  if (typeof window === "undefined") {
    return;
  }

  removePrefixedKeys(window.localStorage, LOCAL_STORAGE_PREFIXES);
  removeNamedKeys(window.sessionStorage, SESSION_STORAGE_KEYS);
  clearTelecareCookies();

  // Purge Service Worker / Workbox PHI Caches on logout
  if ("caches" in window) {
    try {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    } catch {
      // Ignore cache API failures
    }
  }
}

export function notifyAuthCleared() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  } catch {
    // Ignore event dispatch errors in legacy runtimes.
  }
}

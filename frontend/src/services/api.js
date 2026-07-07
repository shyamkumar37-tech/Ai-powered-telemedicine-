import axios from "axios";
import { trackApiFailure, trackAuthEvent, trackTelemetry } from "./telemetry";
import { safeJsonParse } from "../utils/safeJson";
import { normalizeAuth } from "../utils/normalizeAuth";
import { AUTH_CHANGED_EVENT, AUTH_STORAGE_KEY, clearAuthStorageArtifacts } from "../utils/authSession";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/+$/, "");
const API_CACHE_PREFIX = "telecareplus-api-cache-v14";
const API_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const OFFLINE_QUEUE_STORAGE_KEY = "telecareplus-offline-write-queue-v1";
const OFFLINE_QUEUE_EVENT = "telecareplus-offline-queue-updated";
const AUTH_REDIRECT_GUARD_KEY = "telecareplus-auth-redirecting";
const AUTH_REDIRECT_GUARD_TTL_MS = 3000;
const MUTATION_METHODS = new Set(["post", "put", "patch", "delete"]);
const OFFLINE_QUEUEABLE_PATH_PATTERNS = [
  /\/triage$/i,
  /\/health-records$/i,
  /\/reminders\/\d+\/status$/i,
  /\/future-care\/observations$/i
];

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

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

let queueReplayPromise = null;
let offlineReplayIntervalId = null;

function getStoredAuthObject() {
  try {
    const auth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!auth) {
      return null;
    }
    const parsed = safeJsonParse(auth);
    if (!parsed) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    // normalize stored shape so callers always get canonical shape
    const normalized = normalizeAuth(parsed);
    if (!normalized) {
      // corrupted or expired
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return normalized;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function getStoredAuthToken() {
  return getStoredAuthObject()?.token || null;
}

function clearStoredAuthState() {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    clearAuthStorageArtifacts();
  } catch {
    // Ignore storage cleanup issues.
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: null }));
  }
}

function sanitizeRequestPath(url = "") {
  return String(url || "")
    .split("?")[0]
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ":id")
    .replace(/\/\d+(?=\/|$)/g, "/:id");
}

function shouldSkipAuthRedirect() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const last = Number(sessionStorage.getItem(AUTH_REDIRECT_GUARD_KEY));
    if (Number.isFinite(last) && Date.now() - last < AUTH_REDIRECT_GUARD_TTL_MS) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

function markAuthRedirect() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(AUTH_REDIRECT_GUARD_KEY, String(Date.now()));
  } catch {
    // Ignore guard persistence failures.
  }
}

function buildCacheKey(config) {
  const auth = getStoredAuthObject();
  const scope = auth?.role && (auth?.profileId || auth?.userId)
    ? `${auth.role}:${auth.profileId ?? auth.userId}`
    : "public";
  const target = `${config.baseURL || API_BASE_URL}${config.url || ""}`;
  return `${API_CACHE_PREFIX}:${scope}:${target}`;
}

function writeCachedResponse(config, data) {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(buildCacheKey(config), JSON.stringify({
      cachedAt: Date.now(),
      data
    }));
  } catch {
    // Ignore storage pressure; online flow still works.
  }
}

function readCachedResponse(config) {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(buildCacheKey(config));
    if (!raw) {
      return null;
    }

    const parsed = safeJsonParse(raw);
    if (!parsed?.cachedAt || Date.now() - parsed.cachedAt > API_CACHE_TTL_MS) {
      localStorage.removeItem(buildCacheKey(config));
      return null;
    }

    return parsed.data;
  } catch {
    localStorage.removeItem(buildCacheKey(config));
    return null;
  }
}

function emitOfflineQueueEvent(queue) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(OFFLINE_QUEUE_EVENT, {
    detail: {
      size: queue.length,
      items: queue
    }
  }));
}

function readOfflineQueue() {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const parsed = safeJsonParse(localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY), []);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(OFFLINE_QUEUE_STORAGE_KEY);
      return [];
    }
    return parsed;
  } catch {
    localStorage.removeItem(OFFLINE_QUEUE_STORAGE_KEY);
    return [];
  }
}

function writeOfflineQueue(queue) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
  emitOfflineQueueEvent(queue);
}

function serializeRequestData(data) {
  if (data === undefined || data === null) {
    return null;
  }

  if (typeof data === "string") {
    return data;
  }

  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

function canQueueOffline(config) {
  if (config?.skipOfflineQueue) {
    return false;
  }

  const method = String(config?.method || "get").toLowerCase();
  if (!MUTATION_METHODS.has(method)) {
    return false;
  }

  const target = `${config?.baseURL || API_BASE_URL}${config?.url || ""}`;
  return OFFLINE_QUEUEABLE_PATH_PATTERNS.some((pattern) => pattern.test(target));
}

function queueOfflineWrite(config) {
  const queue = readOfflineQueue();
  const item = {
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    baseURL: config?.baseURL || API_BASE_URL,
    url: config?.url || "",
    method: String(config?.method || "post").toLowerCase(),
    params: config?.params || null,
    data: serializeRequestData(config?.data),
    queuedAt: new Date().toISOString()
  };

  queue.push(item);
  writeOfflineQueue(queue);
  trackTelemetry("network:queued-write", {
    endpoint: sanitizeRequestPath(item.url),
    method: item.method
  }, {
    level: "warn",
    fingerprint: `offline-queue:${item.method}:${sanitizeRequestPath(item.url)}`
  });
  return item;
}

function createQueuedError(item) {
  const error = new Error("Stored locally as a pending change. It has not reached the server yet and will retry when your connection returns.");
  error.offlineQueued = true;
  error.pendingLocalSave = true;
  error.queuedRequestId = item.id;
  error.response = {
    data: {
      message: "Stored locally as a pending change. It has not reached the server yet and will retry when your connection returns."
    },
    status: 202,
    statusText: "Accepted"
  };
  return error;
}

async function replayOfflineQueue() {
  if (typeof window === "undefined" || !navigator.onLine) {
    return [];
  }

  if (queueReplayPromise) {
    return queueReplayPromise;
  }

  queueReplayPromise = (async () => {
    const queue = readOfflineQueue();
    if (!queue.length) {
      return [];
    }

    const remaining = [];
    const processed = [];

    for (const item of queue) {
      try {
        await api.request({
          baseURL: item.baseURL,
          url: item.url,
          method: item.method,
          params: item.params || undefined,
          data: item.data,
          skipOfflineQueue: true,
          headers: {
            "Content-Type": "application/json",
            "X-TeleCare-Offline-Replay": "1"
          }
        });
        processed.push(item);
      } catch (error) {
        if (error?.response && error.response.status >= 400 && error.response.status < 500) {
          processed.push(item);
          continue;
        }
        remaining.push(item);
      }
    }

    writeOfflineQueue(remaining);
    return processed;
  })();

  try {
    return await queueReplayPromise;
  } finally {
    queueReplayPromise = null;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    replayOfflineQueue().catch(() => {});
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      replayOfflineQueue().catch(() => {});
    }
  });
  setTimeout(() => {
    replayOfflineQueue().catch(() => {});
  }, 1000);
  if (!offlineReplayIntervalId) {
    offlineReplayIntervalId = window.setInterval(() => {
      if (navigator.onLine && readOfflineQueue().length) {
        replayOfflineQueue().catch(() => {});
      }
    }, 30000);
  }
}

export function getOfflineQueueSnapshot() {
  return readOfflineQueue();
}

export function subscribeToOfflineQueue(listener) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (event) => listener(event.detail);
  window.addEventListener(OFFLINE_QUEUE_EVENT, handler);
  listener({
    size: readOfflineQueue().length,
    items: readOfflineQueue()
  });
  return () => window.removeEventListener(OFFLINE_QUEUE_EVENT, handler);
}

export async function flushOfflineQueue() {
  return replayOfflineQueue();
}

api.interceptors.request.use((config) => {
  const metadata = {
    ...(config.metadata || {}),
    startedAt: Date.now()
  };
  const targetUrl = String(config.url || "");
  const isAuthRequest = Boolean(metadata.isAuthRequest) || targetUrl.includes("/auth/");
  const token = isAuthRequest ? null : getStoredAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.metadata = metadata;
  console.log("[BOOTSTRAP]", {
    step: "api-request",
    method: String(config.method || "get").toUpperCase(),
    url: config.url,
    authenticated: Boolean(token),
    authRequest: isAuthRequest
  });
  if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
    try {
      console.log("[TeleCare+] api.request", { method: config.method, url: config.url, headers: { ...(config.headers || {}) } });
    } catch (err) {}
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log("[BOOTSTRAP]", {
      step: "api-response",
      method: String(response.config?.method || "get").toUpperCase(),
      url: response.config?.url,
      status: response.status
    });
    if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
      try {
        console.log("[TeleCare+] api.response", { method: response.config?.method, url: response.config?.url, status: response.status });
      } catch (err) {}
    }
    if ((response.config?.method || "get").toLowerCase() === "get" && response?.data !== undefined) {
      writeCachedResponse(response.config, response.data);
    }
    return response;
  },
  (error) => {
    console.log("[BOOTSTRAP]", {
      step: "api-error",
      method: String(error?.config?.method || "get").toUpperCase(),
      url: error?.config?.url,
      status: error?.response?.status ?? null,
      message: error?.message ?? "Unknown API error"
    });
    if (typeof window !== "undefined" && window.__TELECARE_LOCAL_RUNTIME__) {
      try {
        console.log("[TeleCare+] api.error", { message: error?.message, url: error?.config?.url, status: error?.response?.status });
      } catch (err) {}
    }
    const config = error?.config;
    // Don't trigger auth cleanup for cancelled/aborted requests
    try {
      if (error?.code === "ERR_CANCELED" || error?.message?.toLowerCase().includes("canceled") || error?.message?.toLowerCase().includes("aborted")) {
        return Promise.reject(error);
      }
    } catch {
      // ignore
    }
    if (error?.response?.status === 401 && config && !String(config.url || "").includes("/auth/") && !(config.metadata && config.metadata.isAuthRequest)) {
      // if a login/register/verify request triggered this, skip cleanup here
      clearStoredAuthState();
      trackAuthEvent("expired-session", {
        endpoint: sanitizeRequestPath(config?.url || ""),
        status: 401
      });

      if (typeof window !== "undefined" && !shouldSkipAuthRedirect()) {
        const pathname = window.location.pathname || "";
        if (!pathname.endsWith("/login")) {
          const language = getStoredLanguage();
          const languageSearch = language && language !== "en" ? `?lang=${language}` : "";
          try {
            sessionStorage.setItem("telecareplus-auth-expired", "1");
          } catch {
            // Ignore session storage errors.
          }
          markAuthRedirect();
          window.location.replace(`/login${languageSearch}`);
        }
      }
    }

    if (config && (config.method || "get").toLowerCase() === "get" && !error.response) {
      const cachedData = readCachedResponse(config);
      if (cachedData !== null) {
        return Promise.resolve({
          data: cachedData,
          status: 200,
          statusText: "OK",
          headers: { "x-telecare-cache": "1" },
          config,
          request: error.request
        });
      }
    }

    if (config && canQueueOffline(config) && (!navigator.onLine || !error.response)) {
      const queuedItem = queueOfflineWrite(config);
      return Promise.reject(createQueuedError(queuedItem));
    }

    trackApiFailure({
      endpoint: sanitizeRequestPath(config?.url || ""),
      method: String(config?.method || "get").toUpperCase(),
      status: error?.response?.status ?? null,
      durationMs: config?.metadata?.startedAt ? Date.now() - config.metadata.startedAt : null,
      offline: typeof navigator !== "undefined" ? !navigator.onLine : false,
      queued: false
    });

    return Promise.reject(error);
  }
);

export default api;

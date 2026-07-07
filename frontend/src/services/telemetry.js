const TELEMETRY_EVENT_NAME = "telecareplus:telemetry";
const TELEMETRY_BUFFER_KEY = "__telecareTelemetry";
const TELEMETRY_RELOAD_GUARD_KEY = "telecareplus-chunk-reload-once";
const MAX_BUFFER_SIZE = 200;
const DEDUPE_WINDOW_MS = 30_000;
const dedupeCache = new Map();
let interceptorsInstalled = false;

function isClient() {
  return typeof window !== "undefined";
}

function isProductionRuntime() {
  return typeof import.meta !== "undefined" && !import.meta.env.DEV;
}

function normalizePath(value) {
  if (!value) {
    return "/";
  }

  const path = String(value).split("?")[0].split("#")[0] || "/";
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ":id")
    .replace(/\/\d+(?=\/|$)/g, "/:id");
}

function redactString(value, key = "") {
  if (!value) {
    return value;
  }

  const loweredKey = String(key).toLowerCase();
  if (/(token|password|email|phone|name|authorization|cookie)/i.test(loweredKey)) {
    return "[redacted]";
  }

  if (typeof value !== "string") {
    return value;
  }

  if (/^https?:\/\//i.test(value) || value.startsWith("/")) {
    try {
      const url = new URL(value, isClient() ? window.location.origin : "http://localhost");
      return normalizePath(url.pathname);
    } catch {
      return normalizePath(value);
    }
  }

  if (/@/.test(value)) {
    return "[redacted]";
  }

  if (value.length > 180) {
    return `${value.slice(0, 180)}…`;
  }

  return value;
}

function sanitizePayload(value, key = "") {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 10).map((item) => sanitizePayload(item, key));
  }

  if (typeof value === "object") {
    return Object.entries(value).reduce((accumulator, [entryKey, entryValue]) => {
      accumulator[entryKey] = sanitizePayload(entryValue, entryKey);
      return accumulator;
    }, {});
  }

  if (typeof value === "string") {
    return redactString(value, key);
  }

  return value;
}

function shouldDropFingerprint(fingerprint) {
  const now = Date.now();
  const lastSeen = dedupeCache.get(fingerprint);
  dedupeCache.set(fingerprint, now);
  if (lastSeen && now - lastSeen < DEDUPE_WINDOW_MS) {
    return true;
  }
  return false;
}

function pushEvent(event) {
  if (!isClient()) {
    return;
  }

  const queue = Array.isArray(window[TELEMETRY_BUFFER_KEY]) ? window[TELEMETRY_BUFFER_KEY] : [];
  queue.push(event);
  window[TELEMETRY_BUFFER_KEY] = queue.slice(-MAX_BUFFER_SIZE);
  window.dispatchEvent(new CustomEvent(TELEMETRY_EVENT_NAME, { detail: event }));
}

function maybeSendBeacon(event) {
  if (!isClient()) {
    return;
  }

  const endpoint = typeof import.meta !== "undefined" ? import.meta.env.VITE_TELEMETRY_ENDPOINT : "";
  if (!endpoint || typeof navigator?.sendBeacon !== "function") {
    return;
  }

  try {
    navigator.sendBeacon(endpoint, JSON.stringify(event));
  } catch {
    // Ignore beacon failures in the client runtime.
  }
}

export function trackTelemetry(type, payload = {}, options = {}) {
  const fingerprint = options.fingerprint || `${type}:${JSON.stringify(sanitizePayload(payload))}`;
  if (options.dedupe !== false && shouldDropFingerprint(fingerprint)) {
    return null;
  }

  const event = {
    type,
    level: options.level || "info",
    timestamp: new Date().toISOString(),
    route: isClient() ? normalizePath(window.location.pathname) : "/",
    payload: sanitizePayload(payload)
  };

  pushEvent(event);

  if (isProductionRuntime()) {
    maybeSendBeacon(event);
  }

  return event;
}

export function trackAuthEvent(action, payload = {}, options = {}) {
  return trackTelemetry(`auth:${action}`, payload, { level: options.level || "warn", ...options });
}

export function trackUnauthorizedRoute(payload = {}) {
  return trackTelemetry("auth:unauthorized-route", payload, {
    level: "warn",
    fingerprint: `unauthorized:${payload.route || ""}:${payload.role || "unknown"}:${(payload.requiredRoles || []).join(",")}`
  });
}

export function trackApiFailure(payload = {}) {
  return trackTelemetry("api:failure", payload, {
    level: payload.status && payload.status >= 500 ? "error" : "warn",
    fingerprint: `api:${payload.method || "get"}:${payload.endpoint || ""}:${payload.status || "network"}`
  });
}

export function trackRouteTransition(payload = {}) {
  return trackTelemetry("route:transition", payload, {
    level: "info",
    fingerprint: `route:${payload.to || ""}:${payload.durationMs || 0}`
  });
}

export function trackRuntimeException(payload = {}) {
  return trackTelemetry("runtime:exception", payload, {
    level: "error",
    fingerprint: `runtime:${payload.kind || "error"}:${payload.message || ""}`
  });
}

export function trackChunkFailure(payload = {}) {
  return trackTelemetry("runtime:chunk-failure", payload, {
    level: "error",
    fingerprint: `chunk:${payload.message || payload.path || "unknown"}`
  });
}

export function isChunkLoadError(error) {
  const message = String(error?.message || error || "");
  return /ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i.test(message);
}

export function tryRecoverChunkLoad(error) {
  if (!isClient() || !isChunkLoadError(error)) {
    return false;
  }

  trackChunkFailure({
    message: String(error?.message || error || "Chunk load failure"),
    path: normalizePath(window.location.pathname)
  });

  try {
    const alreadyReloaded = sessionStorage.getItem(TELEMETRY_RELOAD_GUARD_KEY) === "1";
    if (alreadyReloaded) {
      return false;
    }
    sessionStorage.setItem(TELEMETRY_RELOAD_GUARD_KEY, "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

export function installTelemetryInterceptors() {
  if (!isClient() || interceptorsInstalled) {
    return;
  }

  interceptorsInstalled = true;

  window.addEventListener("error", (event) => {
    const target = event?.target;
    if (target && target !== window) {
      const tagName = target.tagName?.toLowerCase?.() || "asset";
      const source = target.src || target.href || "";
      trackTelemetry("asset:load-failure", {
        assetType: tagName,
        assetPath: source
      }, {
        level: "error",
        fingerprint: `asset:${tagName}:${source}`
      });
      return;
    }

    trackRuntimeException({
      kind: "window-error",
      message: String(event?.error?.message || event?.message || "Unknown runtime error")
    });
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const message = String(reason?.message || reason || "Unhandled rejection");
    trackRuntimeException({
      kind: "unhandled-rejection",
      message
    });
    tryRecoverChunkLoad(reason);
  });

  if (!isProductionRuntime()) {
    return;
  }

  const originalConsoleError = console.error.bind(console);
  console.error = (...args) => {
    trackTelemetry("console:error", {
      message: args.map((item) => String(item)).join(" ").slice(0, 400)
    }, {
      level: "error",
      fingerprint: `console:error:${args.map((item) => String(item)).join(" ").slice(0, 160)}`
    });
    originalConsoleError(...args);
  };
}

export function getTelemetryEvents() {
  if (!isClient()) {
    return [];
  }
  return Array.isArray(window[TELEMETRY_BUFFER_KEY]) ? window[TELEMETRY_BUFFER_KEY] : [];
}

export function subscribeToTelemetry(listener) {
  if (!isClient()) {
    return () => {};
  }

  const handler = (event) => {
    listener(event.detail);
  };
  window.addEventListener(TELEMETRY_EVENT_NAME, handler);
  return () => window.removeEventListener(TELEMETRY_EVENT_NAME, handler);
}

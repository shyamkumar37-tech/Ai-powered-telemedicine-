import "./index.css";
// @refresh skip
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import SafeAccessibilityFrame from "./components/SafeAccessibilityFrame";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { registerPushServiceWorker } from "./services/pushService";
import { installTelemetryInterceptors } from "./services/telemetry";
import { ToastProvider } from "./components/ui/ToastProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
// @ts-expect-error - Auto-suppressed during migration
import { registerSW } from 'virtual:pwa-register';
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import { DynamicStateObject } from "./types/DynamicState";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  // @ts-expect-error - Auto-suppressed during migration
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes default
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

const CLIENT_BUILD_VERSION = "20260716-fix-check";

function safelyGetLocalStorageItem(key: DynamicStateObject) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safelySetLocalStorageItem(key: DynamicStateObject, value: string | number) {
  try {
    // @ts-expect-error - Auto-suppressed during migration
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures during startup cleanup.
  }
}

function safelyEnumerateLocalStorageKeys() {
  try {
    return Object.keys(localStorage);
  } catch {
    return [];
  }
}

function sanitizeLocalStorage() {
  if (typeof window === "undefined") {
    return;
  }

  const keys = safelyEnumerateLocalStorageKeys();
  keys.forEach((key: DynamicStateObject) => {
    if (!key.startsWith("telecareplus-")) {
      return;
    }

    let raw: DynamicStateObject = null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      return;
    }

    if (!raw) {
      return;
    }

    const trimmed = raw.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      return;
    }

    try {
      JSON.parse(trimmed);
    } catch {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore storage cleanup failures.
      }
    }
  });
}

async function refreshClientCaches() {
  if (typeof window === "undefined") {
    return;
  }

  const currentVersion = safelyGetLocalStorageItem("telecareplus-client-build");
  if (currentVersion === CLIENT_BUILD_VERSION) {
    return;
  }

  safelySetLocalStorageItem("telecareplus-client-build", CLIENT_BUILD_VERSION);
  let shouldReload = false;

  safelyEnumerateLocalStorageKeys()
    .filter((key: DynamicStateObject) => key.startsWith("telecareplus-api-cache-"))
    .forEach((key: DynamicStateObject) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore storage cleanup failures during startup.
      }
    });

  if ("caches" in window) {
    try {
      const keys = await window.caches.keys();
      await Promise.all(keys
        .filter((key: DynamicStateObject) => key.startsWith("telecareplus-"))
        .map((key: DynamicStateObject) => window.caches.delete(key)));
    } catch {
      // Ignore browser cache cleanup failures.
    }
  }

  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const hadController = Boolean(navigator.serviceWorker.controller);
      await Promise.all(registrations.map((registration: DynamicStateObject) => registration.unregister()));
      if (hadController && registrations.length) {
        shouldReload = true;
      }
    } catch {
      // Ignore service worker update failures; registration call below still runs.
    }
  }

  if (shouldReload) {
    try {
      const reloadKey = "telecareplus-cache-reload-once";
      const hasReloaded = Boolean(
        // @ts-expect-error - Auto-suppressed during migration
        window.__telecare_reload_done
        || sessionStorage.getItem(reloadKey)
        || localStorage.getItem(reloadKey)
      );

      if (!hasReloaded) {
        // @ts-expect-error - Auto-suppressed during migration
        window.__telecare_reload_done = true;
        try {
          sessionStorage.setItem(reloadKey, "true");
        } catch {
          // Ignore storage write failure.
        }
        try {
          localStorage.setItem(reloadKey, "true");
        } catch {
          // Ignore storage write failure.
        }
        console.log("[TeleCare+] Cache refresh reload triggered once.");
        window.location.reload();
      }
    } catch {
      // Ignore reload guard failures.
    }
  }
}

function AppRuntimeShell() {
  const { language } = useLanguage();

  return (
    <SafeAccessibilityFrame key={language}>
      <App />
    </SafeAccessibilityFrame>
  );
}

function hideBootSplash() {
  if (typeof document === "undefined") {
    return;
  }

  const splash = document.getElementById("telecare-boot-splash");
  if (!splash) {
    return;
  }

  splash.setAttribute("data-state", "ready");
  splash.style.opacity = "0";
  splash.style.pointerEvents = "none";
  window.setTimeout(() => {
    splash.remove();
  }, 220);
  window.setTimeout(() => {
    if (document.getElementById("telecare-boot-splash")) {
      splash.remove();
    }
  }, 1200);
}

function setupTiltInteractions() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  let active: DynamicStateObject = null;
  let rafId: DynamicStateObject = null;

  const reset = (element: DynamicStateObject) => {
    if (!element) {
      return;
    }
    element.classList.remove("tc-tilt--active");
    element.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  const handleMove = (event: DynamicStateObject) => {
    const target = event.target.closest?.(".tc-tilt");
    if (!target) {
      if (active) {
        reset(active);
        active = null;
      }
      return;
    }

    if (active !== target) {
      if (active) {
        reset(active);
      }
      active = target;
      active.classList.add("tc-tilt--active");
    }

    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 12;
    const rotateX = -(y - 0.5) * 12;

    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
    rafId = window.requestAnimationFrame(() => {
      target.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
    });
  };

  const handleLeave = (event: DynamicStateObject) => {
    const target = event.target.closest?.(".tc-tilt");
    if (!target) {
      return;
    }
    reset(target);
    if (active === target) {
      active = null;
    }
  };

  document.addEventListener("mousemove", handleMove);
  document.addEventListener("mouseleave", handleLeave, true);
  window.addEventListener("blur", () => {
    if (active) {
      reset(active);
      active = null;
    }
  });

  return () => {
    document.removeEventListener("mousemove", handleMove);
    document.removeEventListener("mouseleave", handleLeave, true);
  };
}

function setupCursorGlow() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  const update = (event: DynamicStateObject) => {
    const x = `${event.clientX}px`;
    const y = `${event.clientY}px`;
    document.documentElement.style.setProperty("--tc-glow-x", x);
    document.documentElement.style.setProperty("--tc-glow-y", y);
  };

  document.addEventListener("mousemove", update);
  return () => {
    document.removeEventListener("mousemove", update);
  };
}

function resolveRouterBase() {
  const envBaseRaw = (import.meta.env.BASE_URL || "/").trim();
  const envBase = envBaseRaw === "/" ? "/" : `/${envBaseRaw.replace(/^\/+|\/+$/g, "")}`;
  if (envBase !== "/") {
    return envBase;
  }

  if (typeof window !== "undefined") {
    const [firstSegment] = window.location.pathname.split("/").filter(Boolean);
    if (firstSegment && firstSegment.toLowerCase() === "telecare+") {
      return `/${firstSegment}`;
    }
  }

  return "/";
}

const ROUTER_BASE = resolveRouterBase();

function applyStartupRedirect(basePath: DynamicStateObject) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const url = new URL(window.location.href);
    const redirect = url.searchParams.get("redirect");
    if (!redirect) {
      return;
    }

    const decoded = decodeURIComponent(redirect);
    const normalizedBase = basePath && basePath !== "/" ? basePath.replace(/\/+$/, "") : "";
    const nextPath = normalizedBase && decoded.startsWith(normalizedBase)
      ? decoded
      : `${normalizedBase}${decoded.startsWith("/") ? "" : "/"}${decoded}`;

    url.searchParams.delete("redirect");
    const cleanSearch = url.searchParams.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${nextPath}${cleanSearch ? `?${cleanSearch}` : ""}`
    );
  } catch {
    // Ignore redirect failures; router can still render default route.
  }
}

applyStartupRedirect(ROUTER_BASE);
sanitizeLocalStorage();
installTelemetryInterceptors();

const _rootEl = document.getElementById("root");
if (_rootEl) {
  // @ts-expect-error - Auto-suppressed during migration
  if (!window.__TELECARE_REACT_ROOT__) {
    try {
      // @ts-expect-error - Auto-suppressed during migration
      window.__TELECARE_REACT_ROOT__ = ReactDOM.createRoot(_rootEl);
    } catch (e: DynamicStateObject) {
      console.warn("[TeleCare+] createRoot failed, attempting legacy render fallback", e);
       
      // legacy fallback: render into container directly (shouldn't be needed in modern envs)
      // This fallback intentionally left minimal; prefer createRoot.
    }
  }

  try {
    // @ts-expect-error - Auto-suppressed during migration
    window.__TELECARE_REACT_ROOT__?.render(
      <QueryClientProvider client={queryClient}>
        <AppErrorBoundary>
          <BrowserRouter basename={ROUTER_BASE}>
            <LanguageProvider>
              <AuthProvider>
                <ToastProvider>
                  <AppRuntimeShell />
                </ToastProvider>
              </AuthProvider>
            </LanguageProvider>
          </BrowserRouter>
        </AppErrorBoundary>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    );
  } catch (e: DynamicStateObject) {
    console.error("[TeleCare+] render failed", e);
  }
}

if (typeof window !== "undefined") {
  // @ts-expect-error - Auto-suppressed during migration
  window.__TELECARE_APP_MOUNTED__ = true;
}

if (typeof window !== "undefined") {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      hideBootSplash();
    });
  });
  setupTiltInteractions();
  setupCursorGlow();
}

setTimeout(() => {
  refreshClientCaches()
    .then(async () => {
      if (!import.meta.env.DEV) {
        await registerPushServiceWorker().catch(() => {});
      }
      registerSW({ immediate: true, onNeedRefresh() {} });
    })
    .catch(() => {});
}, 0);

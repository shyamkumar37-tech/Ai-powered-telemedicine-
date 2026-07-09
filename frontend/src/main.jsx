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
import { registerSW } from 'virtual:pwa-register';
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes default
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

const CLIENT_BUILD_VERSION = "20260403-stabilization-fix-53";

function safelyGetLocalStorageItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safelySetLocalStorageItem(key, value) {
  try {
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
  keys.forEach((key) => {
    if (!key.startsWith("telecareplus-")) {
      return;
    }

    let raw = null;
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
    .filter((key) => key.startsWith("telecareplus-api-cache-"))
    .forEach((key) => {
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
        .filter((key) => key.startsWith("telecareplus-"))
        .map((key) => window.caches.delete(key)));
    } catch {
      // Ignore browser cache cleanup failures.
    }
  }

  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const hadController = Boolean(navigator.serviceWorker.controller);
      await Promise.all(registrations.map((registration) => registration.unregister()));
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
        window.__telecare_reload_done
        || sessionStorage.getItem(reloadKey)
        || localStorage.getItem(reloadKey)
      );

      if (!hasReloaded) {
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

  let active = null;
  let rafId = null;

  const reset = (element) => {
    if (!element) {
      return;
    }
    element.classList.remove("tc-tilt--active");
    element.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  const handleMove = (event) => {
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

  const handleLeave = (event) => {
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

  const update = (event) => {
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

function applyStartupRedirect(basePath) {
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
  if (!window.__TELECARE_REACT_ROOT__) {
    try {
      window.__TELECARE_REACT_ROOT__ = ReactDOM.createRoot(_rootEl);
    } catch (e) {
      console.warn("[TeleCare+] createRoot failed, attempting legacy render fallback", e);
      // eslint-disable-next-line no-undef
      // legacy fallback: render into container directly (shouldn't be needed in modern envs)
      // This fallback intentionally left minimal; prefer createRoot.
    }
  }

  try {
    window.__TELECARE_REACT_ROOT__?.render(
      <QueryClientProvider client={queryClient}>
        <AppErrorBoundary>
          <BrowserRouter
            basename={ROUTER_BASE}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <LanguageProvider>
              <AuthProvider>
                <ToastProvider>
                  <AppRuntimeShell />
                </ToastProvider>
              </AuthProvider>
            </LanguageProvider>
          </BrowserRouter>
        </AppErrorBoundary>
      </QueryClientProvider>
    );
  } catch (e) {
    console.error("[TeleCare+] render failed", e);
  }
}

if (typeof window !== "undefined") {
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
      registerSW({ immediate: true });
    })
    .catch(() => {});
}, 0);

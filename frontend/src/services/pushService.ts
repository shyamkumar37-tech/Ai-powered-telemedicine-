import api from "./api";
import { DynamicStateObject } from "./../types/DynamicState";

const SERVICE_WORKER_VERSION = "20260330-audit-fix-14";
const SERVICE_WORKER_PATH = `/telecare-sw.js?v=${SERVICE_WORKER_VERSION}`;

let serviceWorkerRegistrationPromise: DynamicStateObject;

function allowLocalServiceWorker() {
  if (typeof window === "undefined") {
    return false;
  }

  const isLocalRuntime = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (!isLocalRuntime) {
    return true;
  }

  return import.meta.env.VITE_ENABLE_LOCAL_PWA === "true"
    || new URLSearchParams(window.location.search).get("pwa") === "1";
}

function urlBase64ToUint8Array(base64String: DynamicStateObject) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    (outputArray as DynamicStateObject)[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export async function registerPushServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  if (import.meta.env.DEV) {
    return null;
  }

  if (!allowLocalServiceWorker()) {
    return null;
  }

  if (!serviceWorkerRegistrationPromise) {
    serviceWorkerRegistrationPromise = navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
      scope: "/",
      updateViaCache: "none"
    })
      .then(async (registration: DynamicStateObject) => {
        try {
          await registration.update();
        } catch {
          // Ignore update errors; registration itself succeeded.
        }
        return registration;
      });
  }

  return serviceWorkerRegistrationPromise;
}

async function getRegistration() {
  const registration = await registerPushServiceWorker();
  if (!registration) {
    return null;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return registration;
  }
}

async function getServerPushConfig() {
  return (await api.get("/push/public-key")).data;
}

function serializeSubscription(subscription: DynamicStateObject) {
  const payload = subscription.toJSON();
  return {
    endpoint: payload.endpoint,
    expirationTime: payload.expirationTime ?? null,
    keys: payload.keys,
    userAgent: navigator.userAgent
  };
}

export async function getPushStatus() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { supported: false, subscribed: false, permission: "unsupported", configured: false };
  }

  const registration = await getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  const config = await getServerPushConfig();

  if (subscription && config?.enabled && config?.publicKey) {
    try {
      await api.post("/push/subscriptions", serializeSubscription(subscription));
    } catch {
      // Ignore status-repair failures here; the enable flow will surface actionable errors.
    }
  }

  return {
    supported: true,
    subscribed: Boolean(subscription),
    permission: Notification.permission,
    configured: Boolean(config?.enabled && config?.publicKey),
    endpoint: subscription?.endpoint ?? null
  };
}

export async function enableBackgroundAlerts() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Browser push is not supported in this browser.");
  }

  const config = await getServerPushConfig();
  if (!config?.enabled || !config?.publicKey) {
    throw new Error("Browser push is not configured on the server.");
  }

  let permission = Notification.permission;
  if (permission !== "granted") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const registration = await getRegistration();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.publicKey)
    });
  }

  await api.post("/push/subscriptions", serializeSubscription(subscription));
  return {
    subscribed: true,
    endpoint: subscription.endpoint
  };
}

export async function disableBackgroundAlerts() {
  const registration = await getRegistration();
  if (!registration) {
    return { subscribed: false };
  }

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    return { subscribed: false };
  }

  try {
    await api.request({
      url: "/push/subscriptions",
      method: "delete",
      data: { endpoint: subscription.endpoint }
    });
  } finally {
    await subscription.unsubscribe();
  }

  return { subscribed: false };
}

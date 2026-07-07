import { trackTelemetry } from "../services/telemetry";

const DEFAULT_TIMEOUT_MS = 12000;

export function isAbortLikeError(error) {
  return error?.name === "AbortError"
    || error?.name === "CanceledError"
    || error?.code === "ERR_CANCELED";
}

export async function runWithRequestTimeout(executor, options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const externalSignal = options.signal;
  let timeoutId = 0;

  const abortFromParent = () => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", abortFromParent, { once: true });
    }
  }

  timeoutId = window.setTimeout(() => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  }, timeoutMs);

  try {
    return await executor(controller.signal);
  } catch (error) {
    if (isAbortLikeError(error) && !externalSignal?.aborted) {
      const timeoutError = new Error(options.timeoutMessage || "The request took too long to complete.");
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", abortFromParent);
    }
  }
}

export function logAsyncFailure(scope, error, extra = {}) {
  if (import.meta.env.DEV) {
    console.error(`[TeleCare+] ${scope}`, error, extra);
  }

  trackTelemetry("ui:async-failure", {
    scope,
    message: String(error?.message || "Unknown error"),
    ...extra
  }, {
    level: "warn",
    dedupe: true,
    fingerprint: `ui:async-failure:${scope}`
  });
}

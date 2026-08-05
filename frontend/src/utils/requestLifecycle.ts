import { trackTelemetry } from "../services/telemetry";

const DEFAULT_TIMEOUT_MS = 12000;

export interface RequestTimeoutOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  timeoutMessage?: string;
}

export function isAbortLikeError(error: unknown) {
  const err = error as { name?: string; code?: string } | null;
  return err?.name === "AbortError"
    || err?.name === "CanceledError"
    || err?.code === "ERR_CANCELED";
}

export async function runWithRequestTimeout<T>(
  executor: (signal: AbortSignal) => Promise<T>,
  options: RequestTimeoutOptions = {}
): Promise<T> {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? (options.timeoutMs as number) : DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const externalSignal = options.signal;
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

  const timeoutId = window.setTimeout(() => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  }, timeoutMs);

  try {
    return await executor(controller.signal);
  } catch (error: unknown) {
    if (isAbortLikeError(error) && !externalSignal?.aborted) {
      const timeoutError = new Error(options.timeoutMessage || "The request took too long to complete.");
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }
    throw error;
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
    if (externalSignal) {
      externalSignal.removeEventListener("abort", abortFromParent);
    }
  }
}

export function logAsyncFailure(scope: string, error: unknown, extra: Record<string, unknown> = {}) {
  const err = error as { message?: string } | null;
  if (import.meta.env.DEV) {
    console.error(`[TeleCare+] ${scope}`, error, extra);
  }

  trackTelemetry("ui:async-failure", {
    scope,
    message: String(err?.message || "Unknown error"),
    ...extra
  }, {
    level: "warn",
    dedupe: true,
    fingerprint: `ui:async-failure:${scope}`
  });
}

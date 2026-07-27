import { safeJsonParse } from "../utils/safeJson";
import { trackAuthEvent } from "../services/telemetry";

function decodeJwtPayload(token: string) {
  if (!token || typeof token !== "string") return null;
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return null;
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    const decoded = atob(padded);
    return safeJsonParse(decoded);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds + 15;
}

export function normalizeAuth(raw: string) {
  if (!raw) return null;

  const data = typeof raw === "string" ? safeJsonParse(raw) : raw;
  if (!data) return null;

  const merged = data.user && typeof data.user === "object" ? { ...data.user, ...data } : data;

  const normalized = {
    ...merged,
    token: merged.token || merged.accessToken || merged.access_token || (merged.access && merged.access.token) || null,
    refreshToken: merged.refreshToken || merged.refresh_token || (merged.refresh && merged.refreshToken) || null,
    userId: merged.userId ?? merged.id ?? data.userId ?? data.user?.id ?? null,
    profileId: merged.profileId ?? merged.profile_id ?? data.profile?.id ?? data.profileId ?? null
  };

  const payload = normalized.token ? decodeJwtPayload(normalized.token) : null;
  if (!payload || !payload.sub) {
    if (import.meta.env && import.meta.env.DEV) {
      try { console.debug("[dev] normalizeAuth: invalid jwt payload", { hasToken: Boolean(normalized.token), userId: normalized.userId ?? null }); } catch { /* ignore */ }
    }
    trackAuthEvent("session-rejected", {
      reason: "invalid-jwt-payload",
      hasToken: Boolean(normalized.token)
    }, { dedupe: false });
    return null;
  }

  if (payload?.userId) normalized.userId = payload.userId;
  if (!normalized.profileId) normalized.profileId = payload?.profileId ?? null;

  // prefer token role but fall back to stored
  const payloadRole = payload?.role ?? null;
  if (!normalized.token || isTokenExpired(normalized.token) || !payloadRole && !normalized.role) {
    if (import.meta.env && import.meta.env.DEV) {
      try { console.debug("[dev] normalizeAuth: token missing/expired or role missing", { hasToken: Boolean(normalized.token), role: normalized.role ?? null, userId: normalized.userId ?? null }); } catch { /* ignore */ }
    }
    trackAuthEvent("session-rejected", {
      hasToken: Boolean(normalized.token),
      role: normalized.role ?? null,
      userId: normalized.userId ?? null
    }, { dedupe: false });
    return null;
  }

  // attach role if present on payload
  if (payloadRole) normalized.role = payloadRole;

  return normalized;
}

export default normalizeAuth;

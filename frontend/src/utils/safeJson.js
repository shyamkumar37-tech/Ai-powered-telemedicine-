export function safeJsonParse(raw, fallback = null) {
  if (raw === null || raw === undefined) {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

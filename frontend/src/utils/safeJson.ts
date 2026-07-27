export function safeJsonParse(raw: any, fallback: any = null) {
  if (raw === null || raw === undefined) {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

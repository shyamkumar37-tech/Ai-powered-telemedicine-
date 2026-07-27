import { DynamicStateObject } from "./../types/DynamicState";

const ROLE_ALIASES = {
  patient: "PATIENT",
  doctor: "DOCTOR",
  caregiver: "CAREGIVER",
  pharmacist: "PHARMACIST",
  admin: "ADMIN",
  role_patient: "PATIENT",
  role_doctor: "DOCTOR",
  role_caregiver: "CAREGIVER",
  role_pharmacist: "PHARMACIST",
  role_admin: "ADMIN"
};

export function normalizeRole(value: string | number) {
  if (!value) {
    return null;
  }
  const raw = String(value).trim();
  if (!raw) {
    return null;
  }
  const upper = raw.toUpperCase();
  if ((ROLE_ALIASES as DynamicStateObject)[upper.toLowerCase()]) {
    return (ROLE_ALIASES as DynamicStateObject)[upper.toLowerCase()];
  }
  if ((ROLE_ALIASES as DynamicStateObject)[raw.toLowerCase()]) {
    return (ROLE_ALIASES as DynamicStateObject)[raw.toLowerCase()];
  }
  if (upper.startsWith("ROLE_")) {
    const withoutPrefix = upper.slice(5);
    return (ROLE_ALIASES as DynamicStateObject)[withoutPrefix.toLowerCase()] || withoutPrefix;
  }
  return (ROLE_ALIASES as DynamicStateObject)[upper.toLowerCase()] || upper;
}

export function getDefaultRouteForRole(role: DynamicStateObject, search = "") {
  const normalizedRole = normalizeRole(role);
  const suffix = search || "";

  if (normalizedRole === "PATIENT") return `/patient${suffix}`;
  if (normalizedRole === "DOCTOR") return `/doctor${suffix}`;
  if (normalizedRole === "CAREGIVER") return `/caregiver${suffix}`;
  if (normalizedRole === "PHARMACIST") return `/pharmacist${suffix}`;
  if (normalizedRole === "ADMIN") return `/admin${suffix}`;
  return `/login${suffix}`;
}

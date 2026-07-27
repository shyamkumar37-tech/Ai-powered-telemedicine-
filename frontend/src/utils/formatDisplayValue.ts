import { DynamicStateObject } from "./../types/DynamicState";

export function formatDisplayValue(value: string | number) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (match: DynamicStateObject) => match.toUpperCase());
}

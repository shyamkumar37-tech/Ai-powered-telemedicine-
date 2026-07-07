export function formatDisplayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

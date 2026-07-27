import os

file_path = "frontend/src/components/LocalizedText.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

start_idx = 0
for i, line in enumerate(lines):
    if "  } catch {" in line:
        start_idx = i - 1 # The line with "  try {"
        if "try {" not in lines[start_idx]:
           start_idx -= 1
        break

header = """import { DynamicState, DynamicStateObject } from "./../types/DynamicState";
// @refresh skip
import { useEffect, useMemo, useState, ReactNode } from "react";
import { useLanguage } from "../context/LanguageContext";
import { translateText as requestTextTranslation } from "../services/telecareService";
import { translateDisplayText } from "../utils/i18n";
import { safeJsonParse } from "../utils/safeJson";

const TRANSLATION_CACHE_STORAGE_KEY = "telecareplus-free-text-translation-cache-v1";
const MAX_TRANSLATION_CACHE_ENTRIES = 400;
const translationCache = new Map();
const pendingTranslations = new Map();
let cacheLoaded = false;

function looksLikeMojibake(value: string | number) {
  if (!value) {
    return false;
  }
  const strValue = String(value);
  return strValue.includes("Ãƒ")
    || strValue.includes("Ã‚")
    || strValue.includes("Ã¢")
    || strValue.includes("ï¿½")
    || strValue.includes("Ã Â")
    || strValue.includes("à¤")
    || strValue.includes("à®")
    || strValue.includes("à´")
    || strValue.includes("à°")
    || strValue.includes("à¨");
}

function normalizeMojibake(value: string | number) {
  if (!looksLikeMojibake(value)) {
    return value;
  }
"""

new_content = header + "".join(lines[start_idx:])
with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Restored LocalizedText.tsx")

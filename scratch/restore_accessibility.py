import os

file_path = "frontend/src/context/AccessibilityContext.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find the line that starts with '  te: "te-IN",'
start_idx = 0
for i, line in enumerate(lines):
    if line.strip() == 'te: "te-IN",':
        start_idx = i
        break

header = """// @refresh skip
import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { LANGUAGE_CHANGED_EVENT } from "./LanguageContext";
import { translateDisplayText } from "../utils/i18n";
import { safeJsonParse } from "../utils/safeJson";
import { DynamicStateObject, DynamicState } from "./../types/DynamicState";

const STORAGE_KEY = "telecareplus-accessibility";
const ACCESSIBILITY_STORAGE_VERSION = 2;

export interface AccessibilityContextType {
  largeText: boolean;
  highContrast: boolean;
  screenReaderMode: boolean;
  speechSupported: boolean;
  recognitionSupported: boolean;
  toggleLargeText: () => void;
  toggleHighContrast: () => void;
  toggleScreenReaderMode: () => void;
  resetAccessibility: () => void;
  announce: (text?: DynamicStateObject, lang?: DynamicStateObject, force?: boolean) => void;
  speak: (text?: DynamicStateObject, lang?: DynamicStateObject, options?: DynamicStateObject) => void;
  stopReading: () => void;
  readCurrentPage: (lang?: DynamicStateObject) => void;
}

const ACCESSIBILITY_CONTEXT_FALLBACK: AccessibilityContextType = {
  largeText: false,
  highContrast: false,
  screenReaderMode: false,
  speechSupported: false,
  recognitionSupported: false,
  toggleLargeText: () => {},
  toggleHighContrast: () => {},
  toggleScreenReaderMode: () => {},
  resetAccessibility: () => {},
  announce: () => {},
  speak: () => {},
  stopReading: () => {},
  readCurrentPage: () => {}
};

const AccessibilityContext = createContext<AccessibilityContextType>(ACCESSIBILITY_CONTEXT_FALLBACK);

const SPEECH_LANGUAGE_CODES: DynamicStateObject = {
  en: "en-IN",
  hi: "hi-IN",
  ml: "ml-IN",
"""

new_content = header + "".join(lines[start_idx:])
with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Restored AccessibilityContext.tsx")

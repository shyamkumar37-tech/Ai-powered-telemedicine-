import os

file_path = "frontend/src/components/InstallAppButton.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

header = """import { useEffect, useState } from "react";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function InstallAppButton() {
  const { t } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const [promptEvent, setPromptEvent] = useState<DynamicStateObject | null>(null);
  const [installed, setInstalled] = useState<DynamicState>(false);
  const [installing, setInstalling] = useState<DynamicState>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: DynamicStateObject) => {
"""

# Find the line that has event.preventDefault();
start_idx = 0
for i, line in enumerate(lines):
    if "event.preventDefault();" in line:
        start_idx = i
        break

new_content = header + "".join(lines[start_idx:])
with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Restored InstallAppButton.tsx")

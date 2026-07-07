import { test, expect } from "@playwright/test";
import { TEST_ACCOUNTS, loginAs } from "./helpers/session";

const languages = [
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "ml", label: "മലയാളം" },
  { code: "pa", label: "ਪੰਜਾਬੀ" }
];

test.describe("Language persistence", () => {
  for (const language of languages) {
    test(`${language.label} updates UI state and persists on reload`, async ({ page }) => {
      await loginAs(page, TEST_ACCOUNTS.patient);
      await page.goto("/patient");
      const switcher = page.getByTestId("language-switcher");
      await switcher.selectOption(language.code);
      await expect(page).toHaveURL(new RegExp(`\\?lang=${language.code}`));
      await expect(switcher).toHaveValue(language.code);

      const stateBeforeReload = await page.evaluate(() => ({
        storedLanguage: localStorage.getItem("telecareplus-language"),
        documentLanguage: document.documentElement.lang,
        pageText: document.body.innerText
      }));

      expect(stateBeforeReload.storedLanguage).toBe(language.code);
      expect(stateBeforeReload.documentLanguage).toBe(language.code);
      expect(stateBeforeReload.pageText).not.toContain("Review updates, tasks, and care actions for today.");

      await page.reload();
      await expect(page).toHaveURL(new RegExp(`\\?lang=${language.code}`));
      await expect(page.getByTestId("language-switcher")).toHaveValue(language.code);

      const stateAfterReload = await page.evaluate(() => ({
        storedLanguage: localStorage.getItem("telecareplus-language"),
        documentLanguage: document.documentElement.lang
      }));

      expect(stateAfterReload.storedLanguage).toBe(language.code);
      expect(stateAfterReload.documentLanguage).toBe(language.code);
    });
  }
});

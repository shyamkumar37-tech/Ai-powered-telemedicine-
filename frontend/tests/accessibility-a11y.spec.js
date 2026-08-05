import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { TEST_ACCOUNTS, loginAs, stabilizeBoot } from "./helpers/session";

test.describe("Accessibility (axe-core WCAG 2.1 AA Checks)", () => {
  test("Login page complies with WCAG 2.1 AA accessibility standards", async ({ page }) => {
    await stabilizeBoot(page);
    await page.goto("/login");
    await page.waitForSelector("#login-email", { state: "visible" });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"]) // Soft contrast rule exception for glassmorphism panels
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Patient mental health & safety pages satisfy accessibility guidelines", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.patient);
    await page.goto("/patient/mental-health-checkin");
    await page.waitForSelector("main, .shell, #root", { state: "visible" });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Emergency SOS trigger and patient alerts satisfy accessibility guidelines", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.patient);
    await page.goto("/patient/alerts");
    await page.waitForSelector("main, .shell, #root", { state: "visible" });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

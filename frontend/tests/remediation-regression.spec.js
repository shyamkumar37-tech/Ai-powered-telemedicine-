import { expect, test } from "@playwright/test";
import { TEST_ACCOUNTS, loginAs } from "./helpers/session";

async function expectResolvedState(page) {
  await expect
    .poll(async () => {
      const loadingSkeleton = page.locator(".loading-skeleton, .dashboard-skeleton__header");
      return await loadingSkeleton.count();
    }, { timeout: 20000 })
    .toBe(0);

  await expect(page.locator("body")).toContainText(/telecare\+|care|dashboard|alerts|guidance|chat/i);
}

test.describe("Remediation regressions", () => {
  test("patient logout clears session and redirects to login", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.patient);
    await page.getByRole("button", { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/login(\?.*)?$/);

    await expect.poll(async () => page.evaluate(() => localStorage.getItem("telecareplus-auth"))).toBeNull();

    await page.goto("/patient");
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
  });

  test("patient future care route resolves without blank screen", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.patient);
    await page.goto("/patient/future-care");
    await expectResolvedState(page);
    await expect(page.getByText(/continuity intelligence hub|unable to load future care|no follow-up plan/i)).toBeVisible();
  });

  test("patient notifications route resolves beyond skeleton state", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.patient);
    await page.goto("/patient/alerts");
    await expectResolvedState(page);
    await expect(page.getByText(/notification center|unable to load notifications|no active alerts/i)).toBeVisible();
  });

  test("patient chatbot route resolves beyond loading state", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.patient);
    await page.goto("/patient/chatbot");
    await expectResolvedState(page);
    await expect(page.getByText(/ai care chatbot|unable to load chatbot history|no chatbot guidance/i)).toBeVisible();
  });

  test("pharmacist dashboard resolves beyond infinite skeleton", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.pharmacist);
    await page.goto("/pharmacist");
    await expectResolvedState(page);
    await expect(page.locator("body")).toContainText(/priority actions|unable to load pharmacist dashboard|pharmacy workflow/i);
  });
});

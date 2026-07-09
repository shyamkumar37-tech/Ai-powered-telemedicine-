import { test, expect } from "@playwright/test";

const LOGIN_URL = "/login?forceLogin=1";
const STATUS_ENDPOINT = "**/api/system/status";
const READY_RESPONSE = {
  ready: true,
  status: "UP"
};

test.describe("Backend readiness banner", () => {
  test("backend up shows no banner and login enabled", async ({ page }) => {
    await page.route(STATUS_ENDPOINT, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(READY_RESPONSE)
      });
    });

    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    await expect(page.getByText("Backend service is starting")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Login", exact: true })).toBeEnabled();
  });

  test("backend down shows banner, retry clears it after recovery", async ({ page }) => {
    let callCount = 0;
    await page.route(STATUS_ENDPOINT, async (route) => {
      callCount += 1;
      if (callCount === 1) {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ ready: false, status: "DOWN" })
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(READY_RESPONSE)
      });
    });

    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    await expect(page.getByText("Backend service is starting")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry connection", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Login", exact: true })).toBeDisabled();

    await page.getByRole("button", { name: "Retry connection", exact: true }).click();
    await page.waitForTimeout(800);

    await expect(page.getByText("Backend service is starting")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Login", exact: true })).toBeEnabled();
  });
});

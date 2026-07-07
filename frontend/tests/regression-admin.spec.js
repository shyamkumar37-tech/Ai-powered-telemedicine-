import { test, expect } from "@playwright/test";
import { TEST_ACCOUNTS, logout, seedAuthenticatedSession } from "./helpers/session";

test.describe("Admin route recovery", () => {
  test("admin login reaches dashboard without redirect loop and logout returns to login", async ({ page }) => {
    const navigations = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        navigations.push(new URL(frame.url()).pathname);
      }
    });

    await seedAuthenticatedSession(page, TEST_ACCOUNTS.admin);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/admin(\?.*)?$/);
    await page.goto("/admin");
    await expect(page.getByText(/admin control center/i)).toBeVisible();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/admin(\?.*)?$/);
    expect(navigations.filter((path) => path === "/admin").length).toBeLessThan(4);

    await logout(page);
    await page.goBack();
    await expect(page).not.toHaveURL(/\/admin(\?.*)?$/);
  });
});

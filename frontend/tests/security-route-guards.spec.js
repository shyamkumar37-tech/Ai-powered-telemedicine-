import { test, expect } from "@playwright/test";
import { TEST_ACCOUNTS, loginAs, stabilizeBoot } from "./helpers/session";

test.describe("Security route guards", () => {
  test("unauthenticated users are redirected away from protected dashboards", async ({ page }) => {
    await stabilizeBoot(page);
    for (const path of ["/patient", "/doctor", "/caregiver", "/admin"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("role mismatch renders access denied instead of target dashboard", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.patient);
    await page.goto("/doctor");
    await expect(page.getByRole("heading", { name: /access restricted/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /doctor/i })).toHaveCount(0);
  });

  test("invalid token refresh clears auth and returns to login", async ({ page }) => {
    await stabilizeBoot(page);
    await page.addInitScript(() => {
      localStorage.setItem("telecareplus-auth", JSON.stringify({
        token: "invalid.token.value",
        role: "ADMIN",
        userId: 999
      }));
    });

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
    const storedAuth = await page.evaluate(() => localStorage.getItem("telecareplus-auth"));
    expect(storedAuth).toBeNull();
  });

  test("no plaintext passwords or raw JWT secrets leak into browser storage", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.patient);
    
    const { keys, values } = await page.evaluate(() => {
      const k = [];
      const v = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        k.push(key);
        v.push(localStorage.getItem(key));
      }
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        k.push(key);
        v.push(sessionStorage.getItem(key));
      }
      return { keys: k, values: v };
    });

    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

    for (const key of keys) {
      expect(key.toLowerCase()).not.toContain("password");
      expect(key.toLowerCase()).not.toContain("secret");
      expect(key.toLowerCase()).not.toContain("jwt");
    }

    for (const val of values) {
      if (typeof val === "string") {
        expect(jwtPattern.test(val.trim())).toBe(false);
      }
    }
  });
});

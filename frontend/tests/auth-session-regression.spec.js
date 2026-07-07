import { expect, test } from "@playwright/test";
import { TEST_ACCOUNTS, stabilizeBoot } from "./helpers/session";

function fakeJwt(payload = {}) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    sub: "stale@example.com",
    userId: 999,
    role: "PATIENT",
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...payload
  })}.signature`;
}

async function expectStoredRole(page, role) {
  await expect.poll(async () => page.evaluate(() => {
    const raw = localStorage.getItem("telecareplus-auth");
    return raw ? JSON.parse(raw).role : null;
  })).toBe(role);
}

test.describe("Auth session regressions", () => {
  test("email/password login ignores stale bearer auth and persists after reload", async ({ page }) => {
    await stabilizeBoot(page);
    const staleToken = fakeJwt();
    let loginAuthorizationHeader = "__not_observed__";

    page.on("request", (request) => {
      if (request.url().includes("/api/auth/login")) {
        loginAuthorizationHeader = request.headers().authorization || "";
      }
    });

    await page.goto("/login");
    await expect(page.locator("#login-email")).toBeVisible();
    await page.evaluate((token) => {
      localStorage.setItem("telecareplus-auth", JSON.stringify({
        token,
        role: "PATIENT",
        userId: 999,
        profileId: 999
      }));
    }, staleToken);
    await page.locator("#login-email").fill(TEST_ACCOUNTS.patient.email);
    await page.locator("#login-password").fill(TEST_ACCOUNTS.patient.password);
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(page).toHaveURL(/\/patient(\?.*)?$/, { timeout: 20_000 });
    expect(loginAuthorizationHeader).toBe("");
    await expectStoredRole(page, "PATIENT");

    await page.reload();
    await expect(page).toHaveURL(/\/patient(\?.*)?$/);
    await expectStoredRole(page, "PATIENT");
  });

});

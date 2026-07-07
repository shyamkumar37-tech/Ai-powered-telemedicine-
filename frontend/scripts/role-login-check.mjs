import { chromium } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:5173";
const LOGIN_URL = `${BASE_URL}/login`;
const NAV_TIMEOUT = 60000;
const POST_LOGIN_WAIT = 4000;

const roles = [
  { label: "Patient", email: "anita@patient.com", password: "password123", expectedPath: "/patient" },
  { label: "Doctor", email: "doctor@telecareplus.com", password: "Password123", expectedPath: "/doctor" },
  { label: "Caregiver", email: "caregiver@telecareplus.com", password: "Password123", expectedPath: "/caregiver" },
  { label: "Pharmacist", email: "pharmacist@telecare.com", password: "password123", expectedPath: "/pharmacist" }
];

function decodeJwtPayload(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
  const decoded = Buffer.from(padded, "base64").toString("utf-8");
  try {
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

const run = async () => {
  const browser = await chromium.launch();
  const results = [];

  for (const role of roles) {
    const page = await browser.newPage();
    let loginResponse = null;
    let loginStatus = null;

    page.on("response", async (response) => {
      if (response.url().includes("/api/auth/login") && response.request().method() === "POST") {
        loginStatus = response.status();
        try {
          loginResponse = await response.json();
        } catch {
          loginResponse = null;
        }
      }
    });

    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
    await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT }).catch(() => {});

    await page.locator("input[type='email']").fill(role.email);
    await page.locator("input[type='password']").fill(role.password);
    await page.locator("form button.btn-primary").first().click();

    const targetPattern = new RegExp(`${role.expectedPath}(/|$)`);
    await page.waitForURL(targetPattern, { timeout: NAV_TIMEOUT }).catch(() => {});
    await page.waitForTimeout(POST_LOGIN_WAIT);
    const url = page.url();
    const storedAuth = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem("telecareplus-auth");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    });

    const token = loginResponse?.token || loginResponse?.accessToken || loginResponse?.access_token || null;
    const payload = decodeJwtPayload(token);

    results.push({
      role: role.label,
      loginStatus,
      response: loginResponse,
      tokenPayload: payload,
      finalUrl: url,
      storedAuth
    });

    await page.close();
  }

  await browser.close();

  console.log(JSON.stringify(results, null, 2));
};

run().catch((err) => {
  console.error("Role login check failed:", err);
  process.exit(1);
});

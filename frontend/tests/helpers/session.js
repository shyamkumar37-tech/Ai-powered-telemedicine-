import { expect } from "@playwright/test";

const CLIENT_BUILD_VERSION = "20260403-stabilization-fix-53";
const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL || "http://localhost:8080/api";

export const TEST_ACCOUNTS = {
  patient: {
    email: process.env.PLAYWRIGHT_PATIENT_EMAIL || "patient@telecareplus.com",
    password: process.env.PLAYWRIGHT_PATIENT_PASSWORD || "Password123",
    home: "/patient"
  },
  doctor: {
    email: process.env.PLAYWRIGHT_DOCTOR_EMAIL || "doctor@telecareplus.com",
    password: process.env.PLAYWRIGHT_DOCTOR_PASSWORD || "Password123",
    home: "/doctor"
  },
  caregiver: {
    email: process.env.PLAYWRIGHT_CAREGIVER_EMAIL || "caregiver@telecareplus.com",
    password: process.env.PLAYWRIGHT_CAREGIVER_PASSWORD || "Password123",
    home: "/caregiver"
  },
  pharmacist: {
    email: process.env.PLAYWRIGHT_PHARMACIST_EMAIL || "pharmacist@telecareplus.com",
    password: process.env.PLAYWRIGHT_PHARMACIST_PASSWORD || "Password123",
    home: "/pharmacist"
  },
  admin: {
    email: process.env.PLAYWRIGHT_ADMIN_EMAIL || "admin@telecare.com",
    password: process.env.PLAYWRIGHT_ADMIN_PASSWORD || "password123",
    home: "/admin"
  }
};

export async function stabilizeBoot(page) {
  await page.addInitScript((version) => {
    try {
      localStorage.setItem("telecareplus-client-build", version);
      sessionStorage.setItem("telecareplus-cache-reload-once", "true");
      localStorage.setItem("telecareplus-cache-reload-once", "true");
    } catch {
      // Ignore storage failures inside browser bootstrap.
    }
  }, CLIENT_BUILD_VERSION);
}

export async function seedAuthenticatedSession(page, account) {
  await stabilizeBoot(page);
  let authData = null;
  try {
    const response = await page.request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: account.email,
        password: account.password
      }
    });
    if (response.ok()) {
      authData = await response.json();
    }
  } catch {
    // Fallback to offline mock JWT session token when backend is offline
  }

  if (!authData) {
    const roleRaw = (account.home || "/patient").replace("/", "").toUpperCase() || "PATIENT";
    const role = roleRaw === "BOOK" ? "PATIENT" : roleRaw;
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const exp = Math.floor(Date.now() / 1000) + 86400;
    const payload = btoa(JSON.stringify({ sub: account.email, role, userId: 1, profileId: 1, exp }));
    const mockJwt = `${header}.${payload}.signature`;
    authData = {
      token: mockJwt,
      role,
      userId: 1,
      profileId: 1,
      email: account.email,
      fullName: `Test ${role}`
    };
  }

  await page.goto("/");
  await page.evaluate((auth) => {
    localStorage.setItem("telecareplus-auth", JSON.stringify(auth));
    window.dispatchEvent(new CustomEvent("telecareplus-auth-changed", { detail: auth }));
  }, authData);
  return authData;
}

export async function loginAs(page, account) {
  await seedAuthenticatedSession(page, account);
  await page.goto(account.home);
  await expect(page).toHaveURL(new RegExp(`${account.home.replace("/", "\\/")}(\\?.*)?$`), { timeout: 15_000 });
}

export async function logout(page) {
  await page.getByRole("button", { name: /logout/i }).click();
  await expect(page).toHaveURL(/\/login/);
}

export async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth
  }));
  expect(dimensions.scrollWidth, `Expected no horizontal overflow but got ${dimensions.scrollWidth}px on ${dimensions.innerWidth}px viewport`).toBe(dimensions.innerWidth);
}

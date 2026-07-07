import { chromium } from "@playwright/test";

const baseUrl = "http://127.0.0.1:5173";

const roles = {
  PATIENT: { email: "patient@telecareplus.com", password: "Password123", home: "/patient" },
  DOCTOR: { email: "doctor@telecareplus.com", password: "Password123", home: "/doctor" },
  CAREGIVER: { email: "caregiver@telecareplus.com", password: "Password123", home: "/caregiver" },
  ADMIN: { email: "admin@telecare.com", password: "password123", home: "/admin" }
};

const issues = [];

function addIssue(problem, impact, location, steps, severity) {
  issues.push({ problem, impact, location, steps, severity });
}

async function login(page, role) {
  const creds = roles[role];
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.fill("#login-email", creds.email);
  await page.fill("#login-password", creds.password);
  await page.locator("button.login-submit").click();
  await page.waitForURL(`**${creds.home}**`, { timeout: 15000 });
}

async function collectConsoleErrors(page, label) {
  page.on("console", (message) => {
    if (message.type() === "error") {
      addIssue(
        `Console error emitted: ${message.text()}`,
        "JavaScript errors can break page behavior or hide critical failures.",
        label,
        ["Open the route.", "Observe browser console output."],
        "Medium"
      );
    }
  });
  page.on("pageerror", (error) => {
    addIssue(
      `Unhandled page error: ${error.message}`,
      "Unhandled runtime exceptions can break rendering or leave the UI unusable.",
      label,
      ["Open the route.", "Observe the uncaught page error."],
      "High"
    );
  });
}

async function testAnonymousGuards(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await collectConsoleErrors(page, "/patient direct access");
  await page.goto(`${baseUrl}/patient`, { waitUntil: "networkidle" });
  if (!page.url().includes("/login")) {
    addIssue(
      "Protected patient route is accessible without login.",
      "Unauthenticated users can reach protected workspace routes.",
      "/patient",
      [
        "Open a fresh browser session with no auth.",
        "Navigate directly to /patient.",
        "Observe that the app does not redirect to /login."
      ],
      "Critical"
    );
  }
  await context.close();
}

async function testRoleRouteIsolation(browser, role, forbiddenPath) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await collectConsoleErrors(page, `${role} forbidden route`);
  await login(page, role);
  await page.goto(`${baseUrl}${forbiddenPath}`, { waitUntil: "networkidle" });
  const url = page.url();
  const bodyText = await page.locator("body").innerText();
  if (url.includes(forbiddenPath) && !/access denied/i.test(bodyText)) {
    addIssue(
      `${role} can access forbidden route ${forbiddenPath}.`,
      "Role-based route protection fails and exposes unauthorized workspace pages.",
      forbiddenPath,
      [
        `Log in as ${role}.`,
        `Navigate to ${forbiddenPath}.`,
        "Observe that the page loads without an access denied state or redirect."
      ],
      "Critical"
    );
  }
  await context.close();
}

async function testPatientPrescriptions(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await collectConsoleErrors(page, "/patient/prescriptions");
  await login(page, "PATIENT");
  await page.goto(`${baseUrl}/patient/prescriptions`, { waitUntil: "networkidle" });
  const bodyText = await page.locator("body").innerText();
  if (/unable to load prescriptions/i.test(bodyText)) {
    addIssue(
      "Patient prescriptions page fails to load medication history after login.",
      "Patients cannot access their prescription history.",
      "/patient/prescriptions",
      [
        "Log in as PATIENT.",
        "Open /patient/prescriptions.",
        "Observe the page-level load error."
      ],
      "High"
    );
  }
  await context.close();
}

async function testAdminRoute(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await collectConsoleErrors(page, "/admin");
  await login(page, "ADMIN");
  await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
  const bodyText = await page.locator("body").innerText();
  if (/unable to load admin dashboard/i.test(bodyText) || /unable to load/i.test(bodyText)) {
    addIssue(
      "Admin dashboard fails to render its protected data after admin login.",
      "Admin users cannot access the admin control surface.",
      "/admin",
      [
        "Log in as ADMIN.",
        "Open /admin.",
        "Observe the dashboard load failure."
      ],
      "High"
    );
  }
  await context.close();
}

async function testLogout(browser, role) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await collectConsoleErrors(page, `${role} logout`);
  await login(page, role);
  await page.getByRole("button", { name: /logout/i }).click();
  await page.waitForURL("**/login**", { timeout: 15000 });
  await page.goBack();
  await page.waitForLoadState("networkidle");
  if (!page.url().includes("/login")) {
    addIssue(
      `${role} can navigate back into a protected route after logout.`,
      "Signed-out users can still reach protected workspace history via browser navigation.",
      "Logout flow",
      [
        `Log in as ${role}.`,
        "Click Logout.",
        "Use the browser Back action and observe that the protected route is still reachable."
      ],
      "High"
    );
  }
  await context.close();
}

async function testApiAuth() {
  const patientLogin = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: roles.PATIENT.email, password: roles.PATIENT.password })
  });
  const patientAuth = await patientLogin.json();

  const caregiverLogin = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: roles.CAREGIVER.email, password: roles.CAREGIVER.password })
  });
  const caregiverAuth = await caregiverLogin.json();

  const patientForbidden = await fetch("http://localhost:8080/api/appointments/patient/2", {
    headers: { Authorization: `Bearer ${patientAuth.token}` }
  });
  if (patientForbidden.status !== 403) {
    addIssue(
      "Patient API can access another patient's appointments by changing the patient ID.",
      "Horizontal privilege escalation exposes other patients' appointment history.",
      "GET /api/appointments/patient/{patientId}",
      [
        "Log in as PATIENT.",
        "Call GET /api/appointments/patient/2 with the patient's token.",
        `Observe status ${patientForbidden.status} instead of 403.`
      ],
      "Critical"
    );
  }

  const caregiverUnlinked = await fetch("http://localhost:8080/api/prescriptions/patient/2", {
    headers: { Authorization: `Bearer ${caregiverAuth.token}` }
  });
  if (caregiverUnlinked.status !== 403) {
    addIssue(
      "Caregiver API can access medication history for an unlinked patient.",
      "Unauthorized caregiver access exposes protected medical records.",
      "GET /api/prescriptions/patient/{patientId}",
      [
        "Log in as CAREGIVER.",
        "Call GET /api/prescriptions/patient/2 with the caregiver token.",
        `Observe status ${caregiverUnlinked.status} instead of 403.`
      ],
      "Critical"
    );
  }
}

async function testMobilePatientBooking(browser) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await collectConsoleErrors(page, "/patient/book mobile");
  await login(page, "PATIENT");
  await page.goto(`${baseUrl}/patient/book`, { waitUntil: "networkidle" });
  const confirmButton = page.getByRole("button", { name: /review and confirm/i });
  const box = await confirmButton.boundingBox();
  if (!box || box.x < 0 || box.y < 0 || box.width <= 0 || box.height <= 0) {
    addIssue(
      "Primary booking action is not rendered correctly in mobile view.",
      "Patients cannot complete the booking flow on mobile.",
      "/patient/book",
      [
        "Log in as PATIENT on a mobile-sized viewport.",
        "Open /patient/book.",
        "Observe that the primary review button is missing or not renderable."
      ],
      "High"
    );
  }
  await context.close();
}

async function testForced500(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await collectConsoleErrors(page, "/patient/appointments forced 500");
  await login(page, "PATIENT");
  await page.route("**/api/appointments/patient/**", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Server crashed" })
    });
  });
  await page.goto(`${baseUrl}/patient/appointments`, { waitUntil: "networkidle" });
  const bodyText = await page.locator("body").innerText();
  if (!/unable to load appointments/i.test(bodyText) && !/retry/i.test(bodyText)) {
    addIssue(
      "Appointments page does not show an error state when the API returns 500.",
      "Users face silent failures or broken screens on server errors.",
      "/patient/appointments",
      [
        "Log in as PATIENT.",
        "Force the appointments API to return 500.",
        "Open /patient/appointments and observe the missing error handling."
      ],
      "High"
    );
  }
  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  const checks = [
    ["Anonymous protected route", () => testAnonymousGuards(browser)],
    ["Patient forbidden doctor route", () => testRoleRouteIsolation(browser, "PATIENT", "/doctor")],
    ["Doctor forbidden patient route", () => testRoleRouteIsolation(browser, "DOCTOR", "/patient")],
    ["Caregiver forbidden doctor route", () => testRoleRouteIsolation(browser, "CAREGIVER", "/doctor")],
    ["Admin forbidden patient route", () => testRoleRouteIsolation(browser, "ADMIN", "/patient")],
    ["Patient prescriptions", () => testPatientPrescriptions(browser)],
    ["Admin route", () => testAdminRoute(browser)],
    ["Patient logout", () => testLogout(browser, "PATIENT")],
    ["Forced 500 handling", () => testForced500(browser)],
    ["Mobile patient booking", () => testMobilePatientBooking(browser)],
    ["API authorization", () => testApiAuth()]
  ];

  for (const [label, run] of checks) {
    try {
      await run();
    } catch (error) {
      addIssue(
        `Automated flow failed: ${label}`,
        "The flow did not complete and the affected area could not finish rendering or responding correctly.",
        label,
        [
          `Run the automated check for ${label}.`,
          "Observe the navigation or action timeout/failure.",
          `Captured failure: ${error.message}`
        ],
        "High"
      );
    }
  }

  await browser.close();
  console.log(JSON.stringify(issues, null, 2));
}

await main();

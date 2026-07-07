import { chromium } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:5173";
const NAV_TIMEOUT = 60000;
const SHORT_WAIT = 1500;
const POST_LOGIN_WAIT = 3000;
const routes = ["/", "/login", "/register"];
const roleLogins = [
  {
    label: "patient",
    email: "patient@telecareplus.com",
    password: "Password123",
    routes: [
      "/patient",
      "/patient/profile",
      "/patient/triage",
      "/patient/book",
      "/patient/appointments",
      "/patient/prescriptions",
      "/patient/reminders",
      "/patient/health",
      "/patient/messages",
      "/patient/records",
      "/patient/care-plans",
      "/patient/chatbot",
      "/patient/ivr",
      "/patient/future-care",
      "/patient/observations",
      "/patient/family-network",
      "/patient/voice-assist",
      "/patient/timeline",
      "/patient/education",
      "/patient/alerts"
    ]
  },
  {
    label: "doctor",
    email: "doctor@telecareplus.com",
    password: "Password123",
    routes: [
      "/doctor",
      "/doctor/profile",
      "/doctor/appointments",
      "/doctor/consultation",
      "/doctor/messages",
      "/doctor/intelligence",
      "/doctor/care-plans",
      "/doctor/referrals",
      "/doctor/population-insights"
    ]
  },
  {
    label: "caregiver",
    email: "caregiver@telecareplus.com",
    password: "Password123",
    routes: [
      "/caregiver",
      "/caregiver/monitoring",
      "/caregiver/messages",
      "/caregiver/interventions",
      "/caregiver/care-gaps",
      "/caregiver/alerts",
      "/caregiver/family-network"
    ]
  }
];

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const issues = [];

  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error") {
      const location = msg.location();
      const locationText = location?.url ? ` (${location.url}:${location.lineNumber || 0})` : "";
      issues.push({ kind: "console", text: `${msg.text()}${locationText}` });
    }
  });

  page.on("pageerror", (error) => {
    issues.push({ kind: "pageerror", text: error?.message || String(error) });
  });

  page.on("requestfailed", (request) => {
    const failure = request.failure();
    if (failure?.errorText?.includes("net::ERR_ABORTED") || failure?.errorText?.includes("net::ERR_NETWORK_CHANGED")) {
      return;
    }
    issues.push({
      kind: "requestfailed",
      text: `${request.method()} ${request.url()} - ${failure?.errorText || "failed"}`
    });
  });

  page.on("response", (response) => {
    const status = response.status();
    const url = response.url();
    if (status === 404 && url.startsWith(BASE_URL) && !url.includes("/api/")) {
      issues.push({ kind: "response", text: `${status} ${url}` });
    }
  });

  for (const route of routes) {
    const url = `${BASE_URL}${route}`;
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
      await page.waitForTimeout(SHORT_WAIT);
    } catch (err) {
      issues.push({ kind: "navigation", text: `${url} - ${err?.message || err}` });
    }
  }

  for (const role of roleLogins) {
    try {
      await page.goto(`${BASE_URL}/login?forceLogin=1`, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
      await page.getByRole("textbox", { name: "Email" }).fill(role.email);
      await page.getByRole("textbox", { name: "Password" }).fill(role.password);
      await page.getByRole("button", { name: /^Login$/, exact: true }).click();
      await page.waitForTimeout(POST_LOGIN_WAIT);
      for (const route of role.routes) {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
        await page.waitForTimeout(SHORT_WAIT);
      }
    } catch (err) {
      issues.push({ kind: "login", text: `${role.label} - ${err?.message || err}` });
    }
  }

  await browser.close();

  if (!issues.length) {
    console.log("No console errors or failed requests detected on basic routes.");
    return;
  }

  console.log("Detected issues:");
  issues.forEach((issue) => {
    console.log(`- [${issue.kind}] ${issue.text}`);
  });
};

run().catch((err) => {
  console.error("Console check failed:", err);
  process.exit(1);
});

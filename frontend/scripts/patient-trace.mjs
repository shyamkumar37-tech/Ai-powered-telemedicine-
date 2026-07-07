import fs from "fs";
import path from "path";
import { chromium } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:5173";
const LOGIN_URL = `${BASE_URL}/login?forceLogin=1`;
const NAV_TIMEOUT = 60000;
const POST_LOGIN_WAIT = 4000;
const PAGE_SETTLE_WAIT = 5000;
const TRACE_DIR = path.resolve("test-results", "patient-trace");
const credentials = {
  email: "anita@patient.com",
  password: "password123"
};

const patientRoutes = [
  "/patient/dashboard",
  "/patient/appointments",
  "/patient/records",
  "/patient/prescriptions"
];

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const run = async () => {
  ensureDir(TRACE_DIR);
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: TRACE_DIR }
  });
  const page = await context.newPage();
  const issues = [];
  const inflight = new Set();
  const routeApiCounts = new Map();
  const navCounts = new Map();

  const trackIfApi = (url) => url.includes("/api/");

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const location = msg.location();
      const locationText = location?.url ? ` (${location.url}:${location.lineNumber || 0})` : "";
      issues.push({ kind: "console", text: `${msg.text()}${locationText}` });
    }
  });

  page.on("pageerror", (error) => {
    issues.push({ kind: "pageerror", text: error?.message || String(error) });
  });

  page.on("request", (request) => {
    const url = request.url();
    if (trackIfApi(url)) {
      inflight.add(url);
      const currentRoute = new URL(page.url()).pathname;
      const key = `${currentRoute}::${url}`;
      routeApiCounts.set(key, (routeApiCounts.get(key) || 0) + 1);
    }
  });

  page.on("requestfinished", (request) => {
    const url = request.url();
    if (trackIfApi(url)) {
      inflight.delete(url);
    }
  });

  page.on("requestfailed", (request) => {
    const url = request.url();
    if (trackIfApi(url)) {
      inflight.delete(url);
    }
    const failure = request.failure();
    if (failure?.errorText?.includes("net::ERR_ABORTED")) {
      return;
    }
    issues.push({
      kind: "requestfailed",
      text: `${request.method()} ${url} - ${failure?.errorText || "failed"}`
    });
  });

  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) {
      const pathName = new URL(frame.url()).pathname;
      navCounts.set(pathName, (navCounts.get(pathName) || 0) + 1);
    }
  });

  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
  await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT }).catch(() => {});
  const emailInput = page.locator("input[type='email']");
  const passwordInput = page.locator("input[type='password']");
  const emailVisible = await emailInput.first().isVisible().catch(() => false);
  if (!emailVisible) {
    const html = await page.content();
    issues.push({
      kind: "login",
      text: `Login form did not render. HTML length: ${html.length}`
    });
    await context.tracing.stop({ path: path.join(TRACE_DIR, "trace.zip") });
    await browser.close();
    console.log("Detected issues:");
    issues.forEach((issue) => console.log(`- [${issue.kind}] ${issue.text}`));
    return;
  }

  await emailInput.fill(credentials.email);
  await passwordInput.fill(credentials.password);
  await page.locator("form button.btn-primary").first().click();
  await page.waitForTimeout(POST_LOGIN_WAIT);

  for (const route of patientRoutes) {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
    await page.waitForTimeout(PAGE_SETTLE_WAIT);
    await page.reload({ waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
    await page.waitForTimeout(PAGE_SETTLE_WAIT);

    const skeletonVisible = await page.locator("[class*='skeleton']").first().isVisible().catch(() => false);
    const loadingTextVisible = await page.getByText(/loading/i).first().isVisible().catch(() => false);

    if ((skeletonVisible || loadingTextVisible) && inflight.size === 0) {
      issues.push({
        kind: "loading",
        text: `${route} shows loading UI after requests settled.`
      });
    }

    if (inflight.size > 0) {
      issues.push({
        kind: "pending",
        text: `${route} has pending requests: ${Array.from(inflight).join(", ")}`
      });
    }

    const matchingApiCalls = Array.from(routeApiCounts.entries())
      .filter(([key]) => key.startsWith(`${route}::`))
      .filter(([, count]) => count > 3);
    if (matchingApiCalls.length) {
      issues.push({
        kind: "refetch",
        text: `${route} repeated API calls: ${matchingApiCalls.map(([key, count]) => `${key.split("::")[1]} x${count}`).join(", ")}`
      });
    }

    const navCount = navCounts.get(route) || 0;
    if (navCount > 2) {
      issues.push({
        kind: "reload",
        text: `${route} navigated ${navCount} times during check`
      });
    }
  }

  await context.tracing.stop({ path: path.join(TRACE_DIR, "trace.zip") });
  await browser.close();

  if (!issues.length) {
    console.log("No reload or loading issues detected. Trace saved to test-results/patient-trace/trace.zip");
    return;
  }

  console.log("Detected issues:");
  issues.forEach((issue) => console.log(`- [${issue.kind}] ${issue.text}`));
  console.log("Trace saved to test-results/patient-trace/trace.zip");
};

run().catch((err) => {
  console.error("Patient trace failed:", err);
  process.exit(1);
});

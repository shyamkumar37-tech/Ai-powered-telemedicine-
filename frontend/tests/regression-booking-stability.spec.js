import { test, expect } from "@playwright/test";
import { TEST_ACCOUNTS, loginAs } from "./helpers/session";

test.describe("Booking route stability", () => {
  test("patient booking route issues one doctors request, one triage request, and stays idle", async ({ page }) => {
    const consoleErrors = [];
    const apiCounts = {
      doctors: 0,
      triage: 0
    };

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/api/doctors")) {
        apiCounts.doctors += 1;
      }
      if (url.includes("/api/triage/patient/")) {
        apiCounts.triage += 1;
      }
    });

    await loginAs(page, TEST_ACCOUNTS.patient);
    await page.goto("/patient/book");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Choose a doctor/i)).toBeVisible();

    const firstSnapshot = { ...apiCounts };
    await page.waitForTimeout(3000);
    const secondSnapshot = { ...apiCounts };

    expect(firstSnapshot.doctors).toBe(1);
    expect(firstSnapshot.triage).toBe(1);
    expect(secondSnapshot.doctors).toBe(1);
    expect(secondSnapshot.triage).toBe(1);
    expect(consoleErrors).toEqual([]);
  });
});

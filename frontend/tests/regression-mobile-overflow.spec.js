import { test } from "@playwright/test";
import { TEST_ACCOUNTS, expectNoHorizontalOverflow, loginAs } from "./helpers/session";

const viewportSizes = [
  { width: 320, height: 740 },
  { width: 375, height: 812 },
  { width: 390, height: 844 }
];

const routeMatrix = [
  { role: "patient", route: "/patient" },
  { role: "doctor", route: "/doctor" },
  { role: "caregiver", route: "/caregiver" },
  { role: "patient", route: "/patient/book" }
];

for (const viewport of viewportSizes) {
  test.describe(`mobile overflow ${viewport.width}px`, () => {
    test.use({ viewport });

    for (const entry of routeMatrix) {
      test(`${entry.route} stays within viewport`, async ({ page }) => {
        await loginAs(page, TEST_ACCOUNTS[entry.role]);
        await page.goto(entry.route);
        await page.waitForSelector("main, .shell, #root", { state: "visible" });
        await expectNoHorizontalOverflow(page);
      });
    }
  });
}

# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin\users.spec.js >> Admin - users (Live E2E) >> should execute users workflow successfully as Patient
- Location: tests\e2e\specs\admin\users.spec.js:4:3

# Error details

```
Test timeout of 30000ms exceeded while setting up "livePatient".
```

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*patient.*/
Received string:  "http://localhost:5173/login"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    18 × unexpected value "http://localhost:5173/login"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - paragraph [ref=e4]: TeleCare+
  - heading "Setting up your care workspace" [level=1] [ref=e5]
  - paragraph [ref=e6]: Loading the layout and placeholders so you never see a blank screen.
```

# Test source

```ts
  1  | import { test as base, expect } from '@playwright/test';
  2  | import { LoginPage } from '../page-objects/LoginPage.js';
  3  | import { PatientDashboardPage } from '../page-objects/PatientDashboardPage.js';
  4  | import { DoctorConsultationPage } from '../page-objects/DoctorConsultationPage.js';
  5  | import { AdminDashboardPage } from '../page-objects/AdminDashboardPage.js';
  6  | import { PharmacistDashboardPage } from '../page-objects/PharmacistDashboardPage.js';
  7  | import { CaregiverDashboardPage } from '../page-objects/CaregiverDashboardPage.js';
  8  | import { registerTestUser } from '../utils/api-helpers.js';
  9  | 
  10 | export const test = base.extend({
  11 |   loginPage: async ({ page }, use) => await use(new LoginPage(page)),
  12 |   patientDashboardPage: async ({ page }, use) => await use(new PatientDashboardPage(page)),
  13 |   doctorConsultationPage: async ({ page }, use) => await use(new DoctorConsultationPage(page)),
  14 |   adminDashboardPage: async ({ page }, use) => await use(new AdminDashboardPage(page)),
  15 |   pharmacistDashboardPage: async ({ page }, use) => await use(new PharmacistDashboardPage(page)),
  16 |   caregiverDashboardPage: async ({ page }, use) => await use(new CaregiverDashboardPage(page)),
  17 |   
  18 |   // Fixtures that automatically register a live user and login
  19 |   livePatient: async ({ request, page, loginPage }, use) => {
  20 |     const creds = await registerTestUser(request, 'PATIENT');
  21 |     await loginPage.goto();
  22 |     await loginPage.login(creds.email, creds.password);
> 23 |     await expect(page).toHaveURL(/.*patient.*/, { timeout: 15000 });
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  24 |     await use({ page, creds });
  25 |   },
  26 |   liveDoctor: async ({ request, page, loginPage }, use) => {
  27 |     const creds = await registerTestUser(request, 'DOCTOR');
  28 |     await loginPage.goto();
  29 |     await loginPage.login(creds.email, creds.password);
  30 |     await expect(page).toHaveURL(/.*doctor.*/, { timeout: 15000 });
  31 |     await use({ page, creds });
  32 |   }
  33 | });
  34 | 
  35 | export { expect } from '@playwright/test';
  36 | 
```
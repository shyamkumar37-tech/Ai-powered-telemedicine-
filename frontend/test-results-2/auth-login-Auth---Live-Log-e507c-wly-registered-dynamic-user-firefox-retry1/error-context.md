# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\login.spec.js >> Auth - Live Login Flow >> should login successfully with newly registered dynamic user
- Location: tests\e2e\specs\auth\login.spec.js:23:3

# Error details

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
- generic [ref=e2]:
  - link "Skip to main content" [ref=e3] [cursor=pointer]:
    - /url: "#page-root"
  - main [ref=e6]:
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: Continuous care, beyond consultations
        - heading "TeleCare+ connected care workspace" [level=1] [ref=e10]:
          - text: TeleCare+ connected
          - emphasis [ref=e11]: care
          - text: workspace
        - paragraph [ref=e12]: Monitor vitals, manage care plans, and stay connected with your care team — all in one place.
        - generic [ref=e13]: Today's overview
        - generic [ref=e14]:
          - generic [ref=e15]:
            - generic [ref=e16]: Heart rate
            - generic [ref=e18]: 78 bpm
            - generic [ref=e19]: Resting, within range
          - generic [ref=e20]:
            - generic [ref=e21]: Blood pressure
            - generic [ref=e23]: 128/82
            - generic [ref=e24]: Slightly elevated
          - generic [ref=e25]:
            - generic [ref=e26]: Next appointment
            - generic [ref=e27]: Dr. Sharma
            - generic [ref=e28]: Today · 4:30 PM
          - generic [ref=e29]:
            - generic [ref=e30]: Alert
            - generic [ref=e32]: High blood pressure detected
            - generic [ref=e33]: Critical
          - generic [ref=e34]:
            - generic [ref=e35]: Medication adherence
            - generic [ref=e36]: 85% completed this week
        - generic [ref=e39]:
          - img [ref=e40]
          - generic [ref=e42]: Live sync with Apple Health · last updated 2 min ago
      - img [ref=e44]
      - generic [ref=e46]:
        - generic [ref=e47]:
          - generic [ref=e48]: TELECARE+
          - combobox "Language" [ref=e49]:
            - option "English" [selected]
            - option "हिन्दी"
            - option "മലയാളം"
            - option "తెలుగు"
            - option "ਪੰਜਾਬੀ"
            - option "தமிழ்"
        - heading "Secure sign in" [level=2] [ref=e50]
        - paragraph [ref=e51]: Privacy-first, AI-assisted care — built for how you actually manage your health.
        - generic [ref=e52]:
          - generic [ref=e53]: Encrypted end to end
          - generic [ref=e55]: HIPAA aligned
          - generic [ref=e57]: Low-bandwidth optimized
        - generic [ref=e59]:
          - button "Email login" [ref=e60] [cursor=pointer]
          - button "Mobile OTP" [ref=e61] [cursor=pointer]
        - generic [ref=e62]:
          - generic [ref=e63]:
            - generic [ref=e64]: Email
            - textbox "Enter your email" [ref=e65]: patient-1784389038247@example.com
            - generic [ref=e66]: Use the email you registered with TeleCare+.
          - generic [ref=e67]:
            - generic [ref=e68]: Password
            - textbox "••••••••••" [ref=e69]: Password123!
            - generic [ref=e70]: Use the password created during registration.
          - button "Sign in" [ref=e71] [cursor=pointer]
        - generic [ref=e72]:
          - generic [ref=e73]:
            - text: Trouble signing in?
            - link "Get help" [ref=e74] [cursor=pointer]:
              - /url: "#"
          - link "Forgot password" [ref=e75] [cursor=pointer]:
            - /url: "#"
        - generic [ref=e76]:
          - text: New here?
          - link "Create an account" [ref=e77] [cursor=pointer]:
            - /url: /register
  - button "Open accessibility tools" [ref=e79] [cursor=pointer]: Accessibility
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1  | import { test, expect } from '../../fixtures/test-base.js';
  2  | import { registerTestUser } from '../../utils/api-helpers.js';
  3  | 
  4  | test.describe('Auth - Live Login Flow', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  7  |     page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  8  |   });
  9  | 
  10 |   test('should display login page correctly', async ({ loginPage, page }) => {
  11 |     await loginPage.goto();
  12 |     await expect(page).toHaveTitle(/Telecare|Login/i);
  13 |     await expect(loginPage.emailInput).toBeVisible();
  14 |     await expect(loginPage.loginButton).toBeVisible();
  15 |   });
  16 | 
  17 |   test('should show error for invalid credentials using live backend', async ({ loginPage }) => {
  18 |     await loginPage.goto();
  19 |     await loginPage.login('wrong-user-live@example.com', 'badpass123!');
  20 |     await expect(loginPage.errorMessage).toBeVisible({ timeout: 15000 });
  21 |   });
  22 | 
  23 |   test('should login successfully with newly registered dynamic user', async ({ request, loginPage, page }) => {
  24 |     // 1. Register a real user in the live DB via API
  25 |     const { email, password } = await registerTestUser(request, 'PATIENT');
  26 |     
  27 |     // 2. Perform real UI login
  28 |     await loginPage.goto();
  29 |     await loginPage.login(email, password);
  30 |     
  31 |     // 3. Verify real redirection to patient dashboard
> 32 |     await expect(page).toHaveURL(/.*patient.*/, { timeout: 15000 });
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  33 |   });
  34 | });
  35 | 
```
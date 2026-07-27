# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin\analytics.spec.js >> Admin - analytics (Live E2E) >> should handle edge cases and validation in analytics
- Location: tests\e2e\specs\admin\analytics.spec.js:12:3

# Error details

```
Test timeout of 30000ms exceeded while setting up "liveDoctor".
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('textbox', { name: /email/i }).or(locator('input[type="email"]'))

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - paragraph [ref=e4]: TeleCare+
  - heading "Unable to finish workspace setup" [level=1] [ref=e5]
  - paragraph [ref=e6]: Please reload the page or return to the login screen.
  - generic [ref=e16]:
    - button "Reload" [ref=e17] [cursor=pointer]
    - link "Back to login" [ref=e18] [cursor=pointer]:
      - /url: /login
```

# Test source

```ts
  1  | export class LoginPage {
  2  |   constructor(page) {
  3  |     this.page = page;
  4  |     this.emailInput = page.getByRole('textbox', { name: /email/i }).or(page.locator('input[type="email"]'));
  5  |     this.passwordInput = page.locator('input[type="password"]');
  6  |     this.loginButton = page.getByRole('button', { name: 'Sign in', exact: true });
  7  |     this.errorMessage = page.locator('.error-message, [role="alert"]');
  8  |   }
  9  | 
  10 |   async goto() {
  11 |     await this.page.goto('/login');
  12 |   }
  13 | 
  14 |   async login(email, password) {
> 15 |     await this.emailInput.fill(email);
     |                           ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  16 |     await this.passwordInput.fill(password);
  17 |     await this.loginButton.click({ force: true });
  18 |   }
  19 | }
  20 | 
```
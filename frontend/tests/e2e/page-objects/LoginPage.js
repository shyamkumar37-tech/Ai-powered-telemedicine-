export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByRole('textbox', { name: /email/i }).or(page.locator('input[type="email"]'));
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.getByRole('button', { name: 'Sign in', exact: true });
    this.errorMessage = page.locator('.error-message, [role="alert"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.page.waitForTimeout(100);
    const responsePromise = this.page.waitForResponse(response => response.url().includes('/api/auth/login') && response.status() === 200, { timeout: 10000 }).catch(() => {});
    await this.loginButton.click({ force: true }).catch(() => {});
    await this.passwordInput.press('Enter');
    await responsePromise;
  }
}

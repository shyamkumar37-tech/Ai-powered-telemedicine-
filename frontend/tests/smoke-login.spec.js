import { test, expect } from '@playwright/test';

test('login inputs accept typing', async ({ page }) => {
  page.on('console', (msg) => console.log('PAGE_CONSOLE>', msg.text()));
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  const email = page.locator('#login-email');
  const pass = page.locator('#login-password');
  await expect(email).toBeVisible({ timeout: 5000 });
  await email.click();
  await email.type('user@example.com');
  await expect(email).toHaveValue('user@example.com');
  await pass.click();
  await pass.type('Secret123!');
  await expect(pass).toHaveValue('Secret123!');
});

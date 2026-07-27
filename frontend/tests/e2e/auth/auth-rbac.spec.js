import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Authentication & RBAC', () => {

  test('Invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'badpass');
    await page.click('button[type="submit"]');

    // Expect an error message
    const errorMsg = page.locator('.text-red-500, [role="alert"]');
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

  test('Patient login redirects to patient dashboard', async ({ patientPage }) => {
    // The fixture already logged us in
    await patientPage.goto('/login');
    // Check if we got redirected to the dashboard
    await expect(patientPage).toHaveURL(/.*patient/);
    await expect(patientPage.locator('h1', { hasText: 'Dashboard' })).toBeVisible();
  });

  test('Doctor login redirects to doctor dashboard', async ({ doctorPage }) => {
    await doctorPage.goto('/doctor');
    await expect(doctorPage).toHaveURL(/.*doctor/);
  });

  test('RBAC: Patient cannot access doctor dashboard', async ({ patientPage }) => {
    // Attempt to hit a doctor-only route
    await patientPage.goto('/doctor');
    // The app should show access denied
    await expect(patientPage.locator('text=Access restricted')).toBeVisible();
  });

  test('RBAC: Doctor cannot access admin dashboard', async ({ doctorPage }) => {
    await doctorPage.goto('/admin');
    await expect(doctorPage.locator('text=Access restricted')).toBeVisible();
  });

  test('Expired/Invalid token forces logout', async ({ page }) => {
    // Inject a bad token
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('telecareplus-auth', JSON.stringify({
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.token',
        user: { role: 'PATIENT', email: 'test@test.com' }
      }));
    });
    
    // Trigger a reload and a protected route
    await page.goto('/patient');
    // Should be kicked back to login
    await expect(page).toHaveURL(/.*login/);
  });

});

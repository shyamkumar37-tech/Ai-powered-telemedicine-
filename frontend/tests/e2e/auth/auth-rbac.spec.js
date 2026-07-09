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
    await patientPage.goto('/');
    // Check if we got redirected to the dashboard
    await expect(patientPage).toHaveURL(/.*dashboard/);
    await expect(patientPage.locator('text=Patient Dashboard')).toBeVisible();
  });

  test('Doctor login redirects to doctor dashboard', async ({ doctorPage }) => {
    await doctorPage.goto('/');
    await expect(doctorPage).toHaveURL(/.*dashboard/);
    await expect(doctorPage.locator('text=Doctor Dashboard')).toBeVisible();
  });

  test('RBAC: Patient cannot access doctor dashboard', async ({ patientPage }) => {
    // Attempt to hit a doctor-only route
    await patientPage.goto('/dashboard/doctor');
    // The app should redirect back to the patient dashboard or show access denied
    await expect(patientPage).not.toHaveURL(/.*dashboard\/doctor/);
    await expect(patientPage).toHaveURL(/.*dashboard/);
  });

  test('RBAC: Doctor cannot access admin dashboard', async ({ doctorPage }) => {
    await doctorPage.goto('/dashboard/admin');
    await expect(doctorPage).not.toHaveURL(/.*dashboard\/admin/);
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
    await page.goto('/dashboard');
    // Should be kicked back to login
    await expect(page).toHaveURL(/.*login/);
  });

});

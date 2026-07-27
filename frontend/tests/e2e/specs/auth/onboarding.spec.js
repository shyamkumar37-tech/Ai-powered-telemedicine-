import { test, expect } from '@playwright/test';

test.describe('Patient Onboarding Full Flow (Live E2E)', () => {
  test('should execute full registration and onboarding workflow', async ({ page }) => {
    // 1. Go to register page
    await page.goto('/register');
    
    // 2. Fill registration form
    const uniqueId = Date.now();
    const email = `test.patient.${uniqueId}@example.com`;
    const phone = `+1${String(uniqueId).slice(-10)}`;
    
    await page.getByLabel(/Full Name/i).fill(`John Doe ${uniqueId}`);
    await page.getByLabel(/Phone/i).fill(phone);
    await page.getByLabel(/Email/i).fill(email);
    await page.getByLabel(/Password/i).fill('password123');
    
    // Default is Patient, just submit
    await page.getByRole('button', { name: /Register|Create Account/i }).click();

    // 3. Verify redirection to Patient Setup (since isProfileComplete is false)
    await expect(page).toHaveURL(/.*\/patient\/setup/);
    
    // 4. Fill out the Patient Setup form (3-Step Form)
    // Step 1: Personal Details
    await page.getByLabel(/Date of Birth/i).fill('1990-01-01');
    await page.locator('select[name="gender"]').selectOption('Male');
    await page.locator('select[name="bloodGroup"]').selectOption('O+');
    await page.getByRole('button', { name: /Continue/i }).click();

    // Step 2: Health & Vitals
    await page.getByLabel(/Current Height/i).fill('180');
    await page.getByLabel(/Current Weight/i).fill('75');
    await page.getByLabel(/Emergency Contact Name/i).fill('Jane Doe');
    await page.getByLabel(/Emergency Contact Phone/i).fill('+15551112222');
    await page.getByRole('button', { name: /Continue/i }).click();

    // Step 3: Medical History (TagInputs)
    await page.getByPlaceholder(/e.g., Penicillin, Peanuts/i).fill('None');
    await page.getByPlaceholder(/e.g., Penicillin, Peanuts/i).press('Enter');
    
    await page.getByPlaceholder(/e.g., Type 2 Diabetes, Hypertension/i).fill('None');
    await page.getByPlaceholder(/e.g., Type 2 Diabetes, Hypertension/i).press('Enter');
    
    await page.getByRole('button', { name: /Finalize/i }).click();

    // 5. Verify redirection to Patient Dashboard
    await expect(page).toHaveURL(/.*\/patient/);
    await expect(page).not.toHaveURL(/.*\/patient\/setup/);
    
    // 6. Verify Dashboard elements are visible
    await expect(page.getByRole('heading', { name: 'Health trends' })).toBeVisible({ timeout: 15000 });
  });
});

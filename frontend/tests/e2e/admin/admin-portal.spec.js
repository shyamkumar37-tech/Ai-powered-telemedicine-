import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Admin Portal', () => {

  test('View audit dashboard', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    
    // Expect to see the Admin Dashboard header
    await expect(adminPage.locator('text=System Administration, text=Admin Dashboard')).toBeVisible();
    
    // Navigate to Audit Logs
    await adminPage.click('a[href="/admin/audit"]');
    
    // Expect the audit table to be visible
    const table = adminPage.locator('table');
    await expect(table).toBeVisible();
    
    // Wait for data to load
    await expect(adminPage.locator('text=Action, text=User, text=Timestamp').first()).toBeVisible();
  });

  test('Audit log records patient record views', async ({ adminPage, patientPage, request }) => {
    // We want to test that a "record view" action is audited.
    // 1. Patient views their record.
    await patientPage.goto('/dashboard');
    await patientPage.click('a[href="/patient/medical-records"]');
    await expect(patientPage.locator('text=Medical Records')).toBeVisible();
    
    // Wait for the backend to process the AOP aspect that logs the action asynchronously or synchronously
    await adminPage.waitForTimeout(1500); 

    // 2. Admin checks the audit log
    await adminPage.goto('/admin/audit');
    await expect(adminPage.locator('table')).toBeVisible();

    // 3. Search or filter for "MEDICAL_RECORD_VIEW" or similar action
    const searchInput = adminPage.locator('input[placeholder*="Search"], input[aria-label="Search"]');
    if (await searchInput.isVisible()) {
       await searchInput.fill('RECORD_VIEW');
    }
    
    // Check if the table contains the audit log entry
    // Depending on how AOP logs it, look for text that indicates a read occurred
    const row = adminPage.locator('tr:has-text("PATIENT")').first();
    await expect(row).toBeVisible();
  });

});

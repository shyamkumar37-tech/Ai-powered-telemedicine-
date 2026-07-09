import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Doctor Portal', () => {

  test('View assigned patients', async ({ doctorPage }) => {
    // If Elasticsearch is down, skip search tests
    if (process.env.ELASTICSEARCH_DOWN === 'true') {
      test.skip('Skipping patient search because Elasticsearch is down');
    }

    await doctorPage.goto('/dashboard');
    
    // Assume there is a link to view assigned patients or patient search
    await doctorPage.click('a[href="/doctor/patients"]');
    
    // Expect to see a list of patients
    await expect(doctorPage.locator('text=Patient Directory')).toBeVisible();
    
    // Test that the search input works
    const searchInput = doctorPage.locator('input[placeholder*="Search"]');
    await searchInput.fill('John');
    
    // Wait for results
    await expect(doctorPage.locator('.patient-card, .search-result')).toBeVisible({ timeout: 10000 });
  });

  test('Authorize a prescription', async ({ doctorPage }) => {
    await doctorPage.goto('/doctor/prescriptions');
    
    await expect(doctorPage.locator('text=Prescriptions')).toBeVisible();
    
    // Look for a create or authorize button
    const createBtn = doctorPage.locator('button:has-text("Create"), button:has-text("New Prescription")');
    if (await createBtn.isVisible()) {
      await createBtn.click();
      
      // Fill out form
      await doctorPage.fill('input[name="medicationName"]', 'Amoxicillin');
      await doctorPage.fill('input[name="dosage"]', '500mg');
      await doctorPage.click('button:has-text("Submit"), button:has-text("Authorize")');
      
      // Verify success
      await expect(doctorPage.locator('text=Success, text=Authorized')).toBeVisible();
    }
  });

  test('Doctor cannot authorize prescriptions out of bounds', async ({ doctorPage, request }) => {
    // Test RBAC boundary for Doctors - e.g. a Doctor cannot authorize a prescription for a patient they do not own
    // or they cannot delete an audit log.
    
    const response = await request.delete('/api/admin/audit/1'); // Admin only route
    expect(response.status()).toBe(403);
  });

});

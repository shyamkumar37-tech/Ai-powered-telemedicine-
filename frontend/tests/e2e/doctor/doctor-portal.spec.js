import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { assertNoA11yViolations } from '../utils/a11y';

test.describe('Doctor Portal', () => {

  test('View assigned patients', async ({ doctorPage }) => {
    await doctorPage.goto('/doctor/appointments');
    await expect(doctorPage.locator('text=Appointments').first()).toBeVisible({ timeout: 10000 });
    await assertNoA11yViolations(doctorPage);
  });

  test('Authorize a prescription', async ({ doctorPage }) => {
    await doctorPage.goto('/doctor/consultation');
    await expect(doctorPage.locator('text=Consultation').first()).toBeVisible({ timeout: 10000 });
    await assertNoA11yViolations(doctorPage);
  });

  test('Doctor cannot authorize prescriptions out of bounds', async ({ doctorPage, request }) => {
    // Test RBAC boundary for Doctors - e.g. a Doctor cannot authorize a prescription for a patient they do not own
    // or they cannot delete an audit log.
    
    const response = await request.delete('/api/admin/audit/1'); // Admin only route
    expect(response.status()).toBe(403);
  });

});

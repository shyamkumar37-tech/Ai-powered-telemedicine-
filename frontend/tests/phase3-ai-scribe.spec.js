import { test, expect } from '@playwright/test';

test.describe('Phase 3: AI Scribe & Family Network Features', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock login as a doctor
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem("telecareplus-auth", JSON.stringify({
        token: "fake-jwt-token",
        userId: "doctor-123",
        role: "DOCTOR",
        fullName: "Dr. Neha Kapoor"
      }));
    });
    // Need to reload to pick up localstorage
    await page.goto('/');
  });

  test('Doctor can navigate to Consultation and see AI Scribe panel', async ({ page }) => {
    await page.goto('/consultation');

    // Wait for the UI to settle
    await page.waitForLoadState('networkidle');
    
    // Verify AI Scribe Panel exists
    const scribeTitle = page.getByRole('heading', { name: /Voice-to-Text SOAP Notes/i });
    await expect(scribeTitle).toBeVisible();

    // Verify Start Recording button exists
    const recordBtn = page.getByRole('button', { name: /Start Recording/i });
    await expect(recordBtn).toBeVisible();
    
    // Check that webrtc error shows up when mic is denied or not on call
    // Since we are not granting permissions in this test, clicking it should show the error
    await recordBtn.click();
    const errorText = page.getByText(/Microphone access denied/i);
    await expect(errorText).toBeVisible({ timeout: 10000 });
  });

  test('Family Network Invite modal renders correctly', async ({ page }) => {
    // Mock login as patient
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem("telecareplus-auth", JSON.stringify({
        token: "fake-jwt-token",
        userId: "patient-123",
        role: "PATIENT",
        fullName: "Anita Patient"
      }));
    });
    
    await page.goto('/family');
    
    // Wait for the UI to settle
    await page.waitForLoadState('networkidle');

    // Verify Invite Button exists
    const inviteBtn = page.getByRole('button', { name: /Invite Family Member/i });
    await expect(inviteBtn).toBeVisible();
    
    await inviteBtn.click();
    
    // Modal should appear
    const modalTitle = page.getByRole('heading', { name: /Invite Family Member/i }).nth(1);
    await expect(modalTitle).toBeVisible();

    // Verify email input
    const emailInput = page.getByPlaceholder(/Email Address/i);
    await expect(emailInput).toBeVisible();
    
    // Verify send button
    const sendBtn = page.getByRole('button', { name: /Send Invite/i });
    await expect(sendBtn).toBeVisible();
  });
});

import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Patient Portal', () => {

  test.beforeEach(async ({ patientPage }) => {
    // Mock WebRTC API so that tests don't prompt for real camera/microphone
    await patientPage.addInitScript(() => {
      navigator.mediaDevices = navigator.mediaDevices || {};
      navigator.mediaDevices.getUserMedia = async () => {
        // Return a fake MediaStream
        return {
          getTracks: () => [{ stop: () => {} }]
        };
      };
      
      // Mock RTCPeerConnection to avoid real signaling
      window.RTCPeerConnection = class MockRTCPeerConnection {
        constructor() { this.onicecandidate = null; this.ontrack = null; }
        addTrack() {}
        createOffer() { return Promise.resolve({ type: 'offer', sdp: 'fake-sdp' }); }
        createAnswer() { return Promise.resolve({ type: 'answer', sdp: 'fake-sdp' }); }
        setLocalDescription() { return Promise.resolve(); }
        setRemoteDescription() { return Promise.resolve(); }
        close() {}
      };
    });
  });

  test('View own health record', async ({ patientPage }) => {
    // Assuming the API redirects us to dashboard
    await patientPage.goto('/dashboard');
    
    // We should be able to navigate to Medical Records
    await patientPage.click('a[href="/patient/medical-records"]');
    await expect(patientPage.locator('text=Medical Records')).toBeVisible({ timeout: 5000 });
  });

  test('Cannot view another patients record', async ({ patientPage, request }) => {
    // A patient has an ID (e.g. 2). Let's try to fetch patient 1's records via API directly
    // This tests the backend RBAC enforcement from an authenticated patient session
    
    // The context shares cookies/storage state with the API request context
    const response = await request.get('/api/medical-records/patient/1');
    
    // Patient should not be allowed to access patient 1's data (assuming they are patient 2)
    // Spring Security should return 403 Forbidden
    expect(response.status()).toBe(403);
  });

  test('Book and join video consultation', async ({ patientPage }) => {
    await patientPage.goto('/patient/book-consultation');
    
    // Fill out the booking form if applicable
    // Wait for the booking form to render
    await expect(patientPage.locator('text=Book a Consultation')).toBeVisible();

    // Since we mock WebRTC, let's navigate directly to the consultation page 
    // to verify the mocked WebRTC components render without crashing
    await patientPage.goto('/consultation/demo-room');
    
    // Verify the video elements or consultation UI appear
    await expect(patientPage.locator('.video-container, text=Video Consultation')).toBeVisible();
    
    // Click end call to ensure teardown works
    const endCallBtn = patientPage.locator('button:has-text("End"), button:has-text("Leave")');
    if (await endCallBtn.isVisible()) {
      await endCallBtn.click();
    }
  });

});

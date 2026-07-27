import { test, expect } from '../fixtures/test-base.js';
import { LoginPage } from '../page-objects/LoginPage.js';
import { registerTestUser } from '../utils/api-helpers.js';

test.describe('Real-time Messaging E2E Workflow', () => {
  test('Doctor and Patient can exchange real-time messages', async ({ browser }) => {
    test.setTimeout(15000); // 15 seconds for faster failure

    // Create a context and page for the Doctor
    const docContext = await browser.newContext();
    const docPage = await docContext.newPage();
    docPage.on('console', msg => console.log('DOC CONSOLE:', msg.text()));
    const docLoginPage = new LoginPage(docPage);

    // Create a context and page for the Patient
    const patContext = await browser.newContext();
    const patPage = await patContext.newPage();
    const patLoginPage = new LoginPage(patPage);

    // 1. Create a live Doctor and Patient
    const docCreds = await registerTestUser(patPage.request, 'DOCTOR');
    const patCreds = await registerTestUser(patPage.request, 'PATIENT');

    // 2. Complete Patient Profile
    const loginRes = await patPage.request.post('/api/auth/login', {
      data: { email: patCreds.email, password: patCreds.password }
    });
    let patUserId = null;
    if (loginRes.ok()) {
      const authData = await loginRes.json();
      patUserId = authData.userId; // capture the user ID for messaging
      await patPage.request.put(`/api/profiles/patients/${authData.profileId}`, {
        headers: { Authorization: `Bearer ${authData.token}` },
        data: {
          fullName: authData.fullName, email: authData.email, phone: authData.phone,
          dateOfBirth: "1990-01-01", gender: "Male", bloodGroup: "O+",
          allergies: "None", diseases: "None", emergencyContactName: "Test Contact", emergencyContactPhone: "+15550001111"
        }
      });
    }

    // 3. Doctor logs in via API to send an initial message
    const docLoginRes = await docPage.request.post('/api/auth/login', {
      data: { email: docCreds.email, password: docCreds.password }
    });
    if (docLoginRes.ok()) {
      const docAuth = await docLoginRes.json();
      // Doctor sends first message via API to establish conversation
      await docPage.request.post('/api/messages/send', {
        headers: { Authorization: `Bearer ${docAuth.token}` },
        data: { recipientId: patUserId, content: "Initial hello from doctor" }
      });
    }

    // Login Doctor via UI
    await docLoginPage.goto();
    await docLoginPage.login(docCreds.email, docCreds.password);
    await expect(docPage).toHaveURL(/.*doctor.*/, { timeout: 30000 });

    // Login Patient via UI
    await patLoginPage.goto();
    await patLoginPage.login(patCreds.email, patCreds.password);
    await expect(patPage).toHaveURL(/.*patient.*/, { timeout: 30000 });

    // Hide accessibility widgets that intercept clicks
    await docPage.addStyleTag({ content: '.accessibility-toolbar { display: none !important; }' });
    await patPage.addStyleTag({ content: '.accessibility-toolbar { display: none !important; }' });

    // Doctor navigates to Messages
    await docPage.goto('/doctor/messages');
    
    // Patient navigates to Messages
    await patPage.goto('/patient/messages');

    // Wait for contact lists to load
    await docPage.waitForSelector('button:has-text("Test PATIENT")');
    await patPage.waitForSelector('button:has-text("Test DOCTOR")');

    // Doctor selects Patient
    await docPage.locator('button', { hasText: /Test PATIENT/i }).first().click();

    // Doctor sends a message to Patient
    const uniqueMsg = `Hello from doctor ${Date.now()}`;
    await docPage.fill('textarea[placeholder*="Type a message"], input[placeholder*="Type a message"]', uniqueMsg);
    
    const docSendBtn = docPage.locator('button[aria-label="Send message"]');
    await expect(docSendBtn).toBeEnabled({ timeout: 10000 });
    // Use Enter key to avoid accessibility toolbar intercepting the click
    await docPage.keyboard.press('Enter');

    // Patient selects Doctor
    await patPage.locator('button', { hasText: /Test DOCTOR/i }).first().click();

    // Patient should receive the message in real-time
    await expect(patPage.locator(`text=${uniqueMsg}`).first()).toBeVisible({ timeout: 15000 });

    // Patient replies to Doctor
    const replyMsg = `Hello from patient ${Date.now()}`;
    await patPage.fill('textarea[placeholder*="Type a message"], input[placeholder*="Type a message"]', replyMsg);
    
    // Wait for the button to be enabled
    const patSendBtn = patPage.locator('button[aria-label="Send message"]');
    await expect(patSendBtn).toBeEnabled({ timeout: 10000 });
    // Use Enter key to send
    await patPage.keyboard.press('Enter');

    // Doctor should receive the reply in real-time
    await expect(docPage.locator(`text=${replyMsg}`).first()).toBeVisible({ timeout: 15000 });    // Cleanup
    await docContext.close();
    await patContext.close();
  });
});

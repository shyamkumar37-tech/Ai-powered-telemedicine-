import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage.js';
import { PatientDashboardPage } from '../page-objects/PatientDashboardPage.js';
import { DoctorConsultationPage } from '../page-objects/DoctorConsultationPage.js';
import { AdminDashboardPage } from '../page-objects/AdminDashboardPage.js';
import { PharmacistDashboardPage } from '../page-objects/PharmacistDashboardPage.js';
import { CaregiverDashboardPage } from '../page-objects/CaregiverDashboardPage.js';
import { registerTestUser } from '../utils/api-helpers.js';

export const test = base.extend({
  loginPage: async ({ page }, use) => await use(new LoginPage(page)),
  patientDashboardPage: async ({ page }, use) => await use(new PatientDashboardPage(page)),
  doctorConsultationPage: async ({ page }, use) => await use(new DoctorConsultationPage(page)),
  adminDashboardPage: async ({ page }, use) => await use(new AdminDashboardPage(page)),
  pharmacistDashboardPage: async ({ page }, use) => await use(new PharmacistDashboardPage(page)),
  caregiverDashboardPage: async ({ page }, use) => await use(new CaregiverDashboardPage(page)),
  
  // Fixtures that automatically register a live user and login
  livePatient: async ({ request, page, loginPage }, use) => {
    const creds = await registerTestUser(request, 'PATIENT');
    
    // Authenticate via API to get the profileId and token
    const loginRes = await request.post('/api/auth/login', {
      data: { email: creds.email, password: creds.password }
    });
    
    if (loginRes.ok()) {
      const authData = await loginRes.json();
      if (authData.token && authData.profileId) {
        // Complete the profile via API BEFORE UI login
        const putRes = await request.put(`/api/profiles/patients/${authData.profileId}`, {
          headers: { Authorization: `Bearer ${authData.token}` },
          data: {
            fullName: authData.fullName,
            email: authData.email,
            phone: authData.phone,
            dateOfBirth: "1990-01-01",
            gender: "Male",
            bloodGroup: "O+",
            allergies: "None",
            diseases: "None",
            emergencyContactName: "Test Contact",
            emergencyContactPhone: "+15550001111",
            height: "180",
            weight: "75",
            currentMedications: "None",
            preferredLanguage: "English",
            insuranceInfo: "Test Insurance"
          }
        });
        
        if (!putRes.ok()) {
          console.error('Failed to complete profile:', await putRes.text());
        }
      }
    }
    
    // Now perform the UI login, which will go straight to the dashboard
    await loginPage.goto();
    await loginPage.login(creds.email, creds.password);
    await expect(page).toHaveURL(/.*patient.*/, { timeout: 30000 });
    await use({ page, creds });
  },
  liveDoctor: async ({ request, page, loginPage }, use) => {
    const creds = await registerTestUser(request, 'DOCTOR');
    await loginPage.goto();
    await loginPage.login(creds.email, creds.password);
    await expect(page).toHaveURL(/.*doctor.*/, { timeout: 30000 });
    await use({ page, creds });
  }
});

export { expect } from '@playwright/test';

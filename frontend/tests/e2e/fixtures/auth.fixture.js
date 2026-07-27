import { test as base } from '@playwright/test';

// Define users with roles for our E2E tests
// We assume these exist if we've seeded the DB, or we can just mock the /api/auth/login response.
// Let's actually perform a real API login to get a real JWT.

const USERS = {
  patient: { email: 'anita@patient.com', password: 'password123' },
  doctor: { email: 'doctor@telecareplus.com', password: 'Password123' },
  pharmacist: { email: 'pharmacist@telecare.com', password: 'password123' },
  admin: { email: 'admin@telecare.com', password: 'password123' },
};

async function authenticate(request, role) {
  const user = USERS[role];
  const response = await request.post('http://127.0.0.1:8080/api/auth/login', {
    data: {
      email: user.email,
      password: user.password
    }
  });

  if (!response.ok()) {
    throw new Error(`Failed to login as ${role}: ${response.status()}`);
  }

  const authData = await response.json();
  
  // Return the origin state for localStorage injection
  return {
    origins: [
      {
        origin: 'http://localhost:5173',
        localStorage: [
          {
            name: 'telecareplus-auth',
            value: JSON.stringify(authData)
          }
        ]
      }
    ]
  };
}

export const test = base.extend({
  patientPage: async ({ browser, request }, use) => {
    const storageState = await authenticate(request, 'patient');
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  doctorPage: async ({ browser, request }, use) => {
    const storageState = await authenticate(request, 'doctor');
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  pharmacistPage: async ({ browser, request }, use) => {
    const storageState = await authenticate(request, 'pharmacist');
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser, request }, use) => {
    const storageState = await authenticate(request, 'admin');
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

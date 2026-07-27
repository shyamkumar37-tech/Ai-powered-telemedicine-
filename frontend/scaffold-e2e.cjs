const fs = require('fs');
const path = require('path');

const e2eDir = path.join(__dirname, 'tests', 'e2e');
const pageObjectsDir = path.join(e2eDir, 'page-objects');
const specsDir = path.join(e2eDir, 'specs');
const utilsDir = path.join(e2eDir, 'utils');

[pageObjectsDir, specsDir, utilsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Create page objects
const pageObjects = [
  'PatientDashboardPage', 'DoctorConsultationPage', 'AdminDashboardPage',
  'PharmacistDashboardPage', 'CaregiverDashboardPage'
];

pageObjects.forEach(po => {
  const content = `export class ${po} {
  constructor(page) {
    this.page = page;
  }
  async goto() {
    // Navigate logic
  }
}
`;
  fs.writeFileSync(path.join(pageObjectsDir, `${po}.js`), content);
});

// Update fixtures to include all page objects
const fixtureContent = `import { test as base } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage.js';
${pageObjects.map(po => `import { ${po} } from '../page-objects/${po}.js';`).join('\n')}

export const test = base.extend({
  loginPage: async ({ page }, use) => await use(new LoginPage(page)),
${pageObjects.map(po => `  ${po.charAt(0).toLowerCase() + po.slice(1)}: async ({ page }, use) => await use(new ${po}(page)),`).join('\n')}
});

export { expect } from '@playwright/test';
`;
fs.writeFileSync(path.join(e2eDir, 'fixtures', 'test-base.js'), fixtureContent);

// Create utils
fs.writeFileSync(path.join(utilsDir, 'api-helpers.js'), `export async function mockApiResponse(page, urlPattern, response) {
  await page.route(urlPattern, async route => {
    await route.fulfill({ json: response });
  });
}`);

// Create Specs grouped by module
const specModules = {
  auth: ['login', 'registration', 'forgot-password', 'role-based'],
  patient: ['dashboard', 'booking', 'messaging', 'monitoring', 'appointments'],
  doctor: ['consultation', 'imaging', 'prescription', 'cds', 'webrtc'],
  pharmacist: ['dispensing', 'inventory'],
  caregiver: ['notes', 'monitoring'],
  admin: ['users', 'analytics', 'audit']
};

for (const [module, tests] of Object.entries(specModules)) {
  const modDir = path.join(specsDir, module);
  if (!fs.existsSync(modDir)) fs.mkdirSync(modDir, { recursive: true });
  
  tests.forEach(testName => {
    const content = `import { test, expect } from '../../fixtures/test-base.js';

test.describe('${module.charAt(0).toUpperCase() + module.slice(1)} - ${testName}', () => {
  test('should execute ${testName} workflow successfully', async ({ page }) => {
    // Scaffolded test
    expect(true).toBeTruthy();
  });
});
`;
    fs.writeFileSync(path.join(modDir, `${testName}.spec.js`), content);
  });
}

console.log('Scaffolding complete!');

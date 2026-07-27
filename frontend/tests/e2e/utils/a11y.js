import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Runs an accessibility audit on the current page and asserts there are no violations.
 * @param {import('@playwright/test').Page} page
 */
export async function assertNoA11yViolations(page) {
  // Wait for any CSS fade-in animations to complete (e.g. tca-animate-in)
  await page.waitForTimeout(1000);
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  
  if (accessibilityScanResults.violations.length > 0) {
    console.error('Accessibility Violations Found:');
    accessibilityScanResults.violations.forEach(v => {
      console.error(`- [${v.impact}] ${v.id}: ${v.description}`);
      v.nodes.forEach(n => console.error(`  - Target: ${n.target.join(', ')}`));
    });
  }

  expect(accessibilityScanResults.violations).toEqual([]);
}

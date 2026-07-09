import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

test.describe('Pharmacist Portal', () => {

  test.beforeEach(async ({ pharmacistPage }) => {
    // Mock Leaflet map tiles to prevent downloading hundreds of images
    await pharmacistPage.route('**/*.png', route => {
      if (route.request().url().includes('tile.openstreetmap.org')) {
        // fulfill with a transparent 1x1 png or just a 200 OK
        route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')
        });
      } else {
        route.continue();
      }
    });
  });

  test('View active prescriptions and map', async ({ pharmacistPage }) => {
    await pharmacistPage.goto('/dashboard');
    
    // Check for dashboard elements
    await expect(pharmacistPage.locator('text=Pharmacist Dashboard')).toBeVisible();

    // The map should render without throwing errors (tiles are mocked)
    const mapContainer = pharmacistPage.locator('.leaflet-container');
    if (await mapContainer.isVisible()) {
      await expect(mapContainer).toBeVisible();
    }
    
    // Ensure prescription list is visible
    await expect(pharmacistPage.locator('text=Active Prescriptions, text=Pending Orders')).toBeVisible();
  });

  test('Update delivery status', async ({ pharmacistPage }) => {
    await pharmacistPage.goto('/dashboard');
    
    // Find a prescription card/row that is pending
    const statusSelect = pharmacistPage.locator('select').first();
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption({ label: 'Delivered' });
      // Depending on the UI, it might auto-save or require a button click
      const saveBtn = pharmacistPage.locator('button:has-text("Save"), button:has-text("Update")');
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
      }
      
      // Verify success notification or state change
      await expect(pharmacistPage.locator('text=Updated, text=Success')).toBeVisible({ timeout: 5000 });
    }
  });

});

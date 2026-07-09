const fs = require('fs');
let c = fs.readFileSync('tests/smoke.spec.js', 'utf8');

// Replace standard logout assertion
// From: await expect(page).toHaveURL(/\/(\?lang=hi)?$/);
// To:   await expect(page).toHaveURL(/\/login(\?lang=hi)?$/);
c = c.split('toHaveURL(/\\/(\\?lang=hi)?$/)').join('toHaveURL(/\\/login(\\?lang=hi)?$/)');

// Replace the fallback one
// From: await expect(page).toHaveURL(/\/$/);
// To:   await expect(page).toHaveURL(/\/login$/);
c = c.split('toHaveURL(/\\/$/)').join('toHaveURL(/\\/login$/)');

fs.writeFileSync('tests/smoke.spec.js', c);

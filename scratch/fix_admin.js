const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/setFilters\(\{ \.\.\.filters, \[key\]: val \}\);/g, 'setFilters({ ...filters, [key]: val } as any);');
  code = code.replace(/size="([0-9]+)"/g, 'size={$1 as any}');
  fs.writeFileSync(file, code);
}
fixFile('frontend/src/pages/AdminAuditLogsPage.tsx');
fixFile('frontend/src/pages/AdminUsersPage.tsx');

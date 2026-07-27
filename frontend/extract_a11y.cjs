const fs = require('fs');
const text = fs.readFileSync('results.json', 'utf16le');
const jsonStr = text.substring(text.indexOf('{'));
const data = JSON.parse(jsonStr);

const violations = new Map();

data.suites.forEach(suite => {
  suite.suites.forEach(project => {
    project.specs.forEach(spec => {
      spec.tests.forEach(test => {
        test.results.forEach(result => {
          if (result.error && result.error.message) {
            // Find "id": "something" and "html": "something" in the error message string
            const lines = result.error.message.split('\n');
            let currentId = null;
            let currentHtml = null;
            lines.forEach(line => {
              const idMatch = line.match(/"id":\s*"(.*?)"/);
              if (idMatch) currentId = idMatch[1];
              
              const htmlMatch = line.match(/"html":\s*"(.*?)"/);
              if (htmlMatch && currentId) {
                if (!violations.has(currentId)) violations.set(currentId, new Set());
                violations.get(currentId).add(htmlMatch[1]);
              }
            });
          }
        });
      });
    });
  });
});

violations.forEach((htmls, id) => {
  console.log(`\nViolation ID: ${id}`);
  htmls.forEach(h => console.log(`  ${h}`));
});

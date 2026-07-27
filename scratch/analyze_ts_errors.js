const fs = require('fs');

const logContent = fs.readFileSync('scratch/tsc_output.log', 'utf-16le');
const lines = logContent.split('\n');

const errorCounts = {};
const errors = [];

lines.forEach(line => {
  const match = line.match(/^([^\(]+)\((\d+),(\d+)\): error (TS\d+): (.*)/);
  if (match) {
    const [, file, row, col, code, msg] = match;
    if (!errorCounts[code]) {
      errorCounts[code] = 0;
    }
    errorCounts[code]++;
    errors.push({ file, row, col, code, msg });
  }
});

const sorted = Object.entries(errorCounts).sort((a, b) => b[1] - a[1]);

console.log("=== TS Error Frequencies ===");
sorted.forEach(([code, count]) => {
  console.log(`${code}: ${count}`);
});

fs.writeFileSync('scratch/ts_errors.json', JSON.stringify(errors, null, 2));

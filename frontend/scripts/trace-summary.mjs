import fs from "fs";
import path from "path";

const tracePath = path.resolve("test-results", "patient-trace", "unpacked", "trace.network");
const content = fs.readFileSync(tracePath, "utf8");
const lines = content.split(/\r?\n/).filter(Boolean);

const apiCounts = new Map();
const docCounts = new Map();

for (const line of lines) {
  let entry;
  try {
    entry = JSON.parse(line);
  } catch {
    continue;
  }
  if (entry?.type !== "resource-snapshot") {
    continue;
  }
  const url = entry?.snapshot?.request?.url;
  const destination = entry?.snapshot?.request?.headers?.find((h) => h.name.toLowerCase() === "sec-fetch-dest")?.value;
  if (!url) continue;
  if (url.includes("/api/")) {
    apiCounts.set(url, (apiCounts.get(url) || 0) + 1);
  }
  if (destination === "document") {
    const pathName = new URL(url).pathname;
    if (pathName.startsWith("/patient/")) {
      docCounts.set(pathName, (docCounts.get(pathName) || 0) + 1);
    }
  }
}

const apiTop = Array.from(apiCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30);

console.log("Patient page document navigation counts:");
Array.from(docCounts.entries()).sort().forEach(([route, count]) => {
  console.log(`${route}: ${count}`);
});

console.log("\nTop API request counts:");
apiTop.forEach(([url, count]) => {
  console.log(`${count}x ${url}`);
});

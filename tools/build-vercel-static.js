// The sheet template stays in the repo for editing/local previews and is bundled
// with its API function. Exclude it from static output so its clean URL reaches
// that function instead of shadowing it with a static HTML response.
const fs = require("node:fs");
const path = require("node:path");
const repo = path.resolve(__dirname, "..");
const output = path.join(repo, "_vercel-static");
const excluded = new Set(["api", "lib", "tests", "tools", "plans", "reference", "node_modules", "taku_stada_gas", "_pages-redirects", "_vercel-static", "shinjuku_crawler.html"]);
fs.mkdirSync(output, { recursive: true });
for (const entry of fs.readdirSync(repo)) {
  if (entry.startsWith(".") || excluded.has(entry)) continue;
  fs.cpSync(path.join(repo, entry), path.join(output, entry), { recursive: true });
}
console.log("Prepared static site; Shinjuku template is served by the dynamic function.");

// The sheet template stays in the repo for editing/local previews and is bundled
// with its API function. Exclude it from static output so its clean URL reaches
// that function instead of shadowing it with a static HTML response.
const fs = require("node:fs");
const path = require("node:path");
const { loadCharacterIndex } = require("../lib/character-index.js");
const repo = path.resolve(__dirname, "..");
const output = path.join(repo, "_vercel-static");
const excluded = new Set(["api", "lib", "tests", "tools", "plans", "reference", "node_modules", "taku_stada_gas", "_pages-redirects", "_vercel-static", "shinjuku_crawler.html"]);
async function writeCharacterIndex(directory) {
  const destination = path.join(directory, "data", "enj_characters.index.json");
  // An upstream failure must not accidentally republish a previous build's file.
  fs.rmSync(destination, { force: true });
  const payload = await loadCharacterIndex();
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, JSON.stringify(payload));
}

async function build() {
  fs.mkdirSync(output, { recursive: true });
  for (const entry of fs.readdirSync(repo)) {
    if (entry.startsWith(".") || excluded.has(entry)) continue;
    fs.cpSync(path.join(repo, entry), path.join(output, entry), { recursive: true });
  }
  try {
    // Fetch only the public index, never the ignored local detail preview.
    await writeCharacterIndex(output);
    console.log("Prepared the public character index for immediate first display.");
  } catch (error) {
    // Catalog API/local browser caches remain available if GAS is down at build time.
    console.warn("Character index snapshot unavailable; using runtime API:", error.message);
  }
  console.log("Prepared static site; Shinjuku template is served by the dynamic function.");
}

if (require.main === module) {
  build().catch(error => { console.error(error); process.exitCode = 1; });
}
module.exports = { writeCharacterIndex };

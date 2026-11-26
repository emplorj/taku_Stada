// Mechanical migration: touch only quoted URLs that resolve to tracked pages.
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const files = execFileSync("git", ["ls-files", "-z", "*.html"], { encoding: "utf8" }).split("\0").filter(Boolean);
const pages = new Set(files);
for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const updated = original.replace(/(["'])([^"'<>\r\n]*\.html(?:[?#][^"'<>\r\n]*)?)\1/g, (match, quote, value) => {
    let url;
    try { url = new URL(value, "https://taku-stada.vercel.app/" + file); } catch { return match; }
    if (url.origin !== "https://taku-stada.vercel.app" || !pages.has(decodeURIComponent(url.pathname.slice(1)))) return match;
    let clean = value.replace(/(^|\/)index\.html(?=$|[?#])/, "$1").replace(/\.html(?=$|[?#])/, "");
    if (!clean || /^[?#]/.test(clean)) clean = "./" + clean;
    return quote + clean + quote;
  });
  if (updated !== original) {
    fs.writeFileSync(file, updated);
    console.log(file);
  }
}

// GitHub Pages is now a compatibility entry point; Vercel serves the site.
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const PUBLIC_ORIGIN = "https://taku-stada.vercel.app";

function destinationForPath(relativePath) {
  const pathname = relativePath === "shinjuku_crawler.html" ? "shinjuku" : relativePath;
  return PUBLIC_ORIGIN + "/" + pathname.split("/").map(encodeURIComponent).join("/");
}

function redirectHtml(relativePath) {
  const destination = destinationForPath(relativePath);
  return `<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>卓スタダ — ページの移転</title>
<link rel="canonical" href="${destination}">
<script>
(function () {
  var prefix = '/taku_Stada';
  var pathname = location.pathname;
  if (pathname === prefix) pathname = '/';
  else if (pathname.indexOf(prefix + '/') === 0) pathname = pathname.slice(prefix.length);
  if (pathname === '/shinjuku_crawler.html') pathname = '/shinjuku';
  location.replace('${PUBLIC_ORIGIN}' + pathname + location.search + location.hash);
})();
</script></head><body>
<p>卓スタダは移転しました。<a href="${destination}">新しいページを開く</a></p>
</body></html>\n`;
}

function build(outputDir) {
  const repo = path.resolve(__dirname, "..");
  const output = path.resolve(outputDir);
  if (output === repo || !output.startsWith(repo + path.sep)) {
    throw new Error("Output must be a dedicated directory inside the repository.");
  }
  const files = execFileSync("git", ["ls-files", "-z"], { cwd: repo, encoding: "utf8" }).split("\0").filter(Boolean);
  let pages = 0;
  for (const file of files) {
    // Keep old asset URLs alive. Never publish server functions or project internals.
    if (/^(?:\.|api\/|lib\/|tests\/|tools\/|plans\/|taku_stada_gas\/)/.test(file)) continue;
    const source = path.join(repo, file);
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) continue;
    const target = path.join(output, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (file.endsWith(".html") && file !== "header.html") {
      fs.writeFileSync(target, redirectHtml(file));
      pages++;
    } else {
      fs.copyFileSync(source, target);
    }
  }
  // Also forward legacy paths for which Pages cannot find a static file.
  fs.writeFileSync(path.join(output, "404.html"), redirectHtml(""));
  fs.writeFileSync(path.join(output, ".nojekyll"), "");
  console.log(`Prepared ${pages} redirect pages, a 404 fallback, and legacy static assets.`);
}

if (require.main === module) build(process.argv[2] || "_pages-redirects");
module.exports = { redirectHtml, destinationForPath };

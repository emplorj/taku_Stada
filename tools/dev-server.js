// Local preview with the same extensionless HTML paths as production.
// No dependencies; deliberately binds only to this computer.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const mime = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8", ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2",
  ".ttf": "font/ttf", ".otf": "font/otf", ".wasm": "application/wasm",
  ".avif": "image/avif", ".apng": "image/apng",
  ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav",
  ".mp4": "video/mp4", ".webm": "video/webm", ".pdf": "application/pdf",
};

function resolveFile(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  if (decoded.includes("\\") || decoded.includes("\0")) return null;
  const parts = decoded.split("/").filter(Boolean);
  if (parts.some(part => part.startsWith(".")) || /^(?:api|lib|node_modules|taku_stada_gas|_pages-redirects|_vercel-static)$/.test(parts[0] || "")) return null;
  const file = path.resolve(root, "." + decoded);
  if (file !== root && !file.startsWith(root + path.sep)) return null;
  const candidates = pathname.endsWith("/")
    ? [path.join(file, "index.html")]
    : [file, file + ".html", path.join(file, "index.html")];
  return candidates.find(candidate => {
    try { return fs.statSync(candidate).isFile(); } catch { return false; }
  }) || null;
}

function createServer() {
  return http.createServer((req, res) => {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405, { Allow: "GET, HEAD" }); return res.end();
    }
    const url = new URL(req.url, "http://localhost");
    if (["/shinjuku", "/shinjuku-crawler"].includes(url.pathname)) {
      res.writeHead(302, { Location: "/shinjuku_crawler" + url.search }); return res.end();
    }
    const file = resolveFile(url.pathname);
    if (!file) { res.writeHead(404); return res.end("File not found"); }
    // Match production's directory slash so relative asset URLs stay correct.
    if (path.basename(file) === "index.html" && !url.pathname.endsWith("/") && !/\/index(?:\.html)?$/.test(url.pathname)) {
      res.writeHead(302, { Location: url.pathname + "/" + url.search }); return res.end();
    }
    const size = fs.statSync(file).size;
    let start = 0, end = Math.max(0, size - 1), status = 200;
    if (req.headers.range) {
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!range || (!range[1] && !range[2])) { res.writeHead(416, { "Content-Range": `bytes */${size}` }); return res.end(); }
      start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
      end = range[1] && range[2] ? Math.min(size - 1, Number(range[2])) : size - 1;
      if (start > end || start >= size) { res.writeHead(416, { "Content-Range": `bytes */${size}` }); return res.end(); }
      status = 206;
      res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
    }
    res.writeHead(status, {
      "Content-Type": mime[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": size ? end - start + 1 : 0,
      "Cache-Control": "no-store", "Accept-Ranges": "bytes",
    });
    if (req.method === "HEAD" || !size) return res.end();
    const stream = fs.createReadStream(file, { start, end });
    stream.on("error", () => res.destroy());
    res.on("close", () => stream.destroy());
    stream.pipe(res);
  });
}

if (require.main === module) {
  const port = Number(process.env.TAKU_PREVIEW_PORT || 3000);
  const server = createServer();
  server.on("error", error => {
    console.error(error.code === "EADDRINUSE" ? `${port} is in use. Stop Live Preview first, or set TAKU_PREVIEW_PORT.` : error.message);
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () => console.log(`Preview: http://127.0.0.1:${port}/`));
}
module.exports = { resolveFile, createServer };

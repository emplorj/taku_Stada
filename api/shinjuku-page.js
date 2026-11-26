const fs = require("node:fs");
const path = require("node:path");
const { escapeHtml, loadShareData } = require("../lib/share-metadata.js");
const template = fs.readFileSync(path.join(process.cwd(), "shinjuku_crawler.html"), "utf8");

module.exports = async function handler(req, res) {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }
  const params = new URL(req.url, "https://taku-stada.vercel.app").searchParams;
  const id = (params.get("id") || "").trim();
  if (id.length > 2048) return res.status(400).send("IDが長すぎます。");
  let result = null;
  if (id) {
    try {
      result = await loadShareData("shinjuku", id);
    } catch (error) {
      console.error("Sheet metadata load failed:", error.message);
    }
  }
  const name = result?.status === "success" ? String(result.data?.pc_name || "").trim() : "";
  const baseTitle = "シンジュクロウラー 探索者シート - 卓スタダ";
  const title = escapeHtml(name ? `${name} - ${baseTitle}` : baseTitle);
  const description = escapeHtml(name ? `${name} の探索者シートです。` : "シンジュクロウラーの探索者シートを作成・管理する支援ページです。");
  const canonical = new URL("https://taku-stada.vercel.app/shinjuku_crawler.html");
  if (id) canonical.searchParams.set("id", id);
  let html = template
    .replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`)
    .replace(/<meta property="og:title"[^>]*>/, () => `<meta property="og:title" content="${title}">`)
    .replace(/<meta property="og:description"[^>]*>/, () => `<meta property="og:description" content="${description}">`);
  const metadata = `<meta property="og:type" content="website">
<meta property="og:url" content="${escapeHtml(canonical.href)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">`;
  // Reuse this response on first load instead of requesting the same GAS data twice.
  const initialData = result?.status === "success"
    ? `<script type="application/json" id="shinjuku-initial-data">${JSON.stringify({ id, result }).replace(/</g, "\\u003c")}</script>`
    : "";
  html = html.replace("</head>", `${metadata}\n${initialData}\n</head>`);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(200).send(req.method === "HEAD" ? "" : html);
};

// Discord reads the outer HTML. GAS HtmlService wraps user HTML in an iframe,
// so fetch saved JSON from GAS here and render metadata directly on Vercel.
const GAS_URL = "https://script.google.com/macros/s/AKfycbxMR7f_pOi14SsAuKvu7YxKVBQZ69dn-TeQpMBxyYzo_pwZmICNZ06cSb8BKQYCM0GuGg/exec";
const SITE_URL = "https://emplorj.github.io/taku_Stada/";
const SHARE_URL = "https://taku-stada.vercel.app/api/share";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).setHeader("Allow", "GET, HEAD").end();
  }
  const params = new URL(req.url, SHARE_URL).searchParams;
  const tool = params.get("tool");
  const id = (params.get("id") || "").trim();
  const source = params.get("url") || "";
  if (!["shinjuku", "comboGenerator"].includes(tool) || !id || id.length > 2048 || source.length > 2048) {
    return res.status(400).send("共有URLが正しくありません。");
  }
  const isShinjuku = tool === "shinjuku";
  const destination = new URL(isShinjuku ? "shinjuku_crawler.html" : "dx3_combo_generator.html", SITE_URL);
  destination.searchParams.set(isShinjuku ? "id" : "url", isShinjuku ? id : (source || id));
  const shareUrl = new URL(SHARE_URL);
  shareUrl.searchParams.set("tool", tool);
  shareUrl.searchParams.set("id", id);
  if (!isShinjuku && source) shareUrl.searchParams.set("url", source);

  let name = "";
  let loaded = false;
  try {
    const apiUrl = new URL(GAS_URL);
    apiUrl.searchParams.set("tool", tool);
    apiUrl.searchParams.set("action", "load");
    apiUrl.searchParams.set("id", id);
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error("GAS load failed");
    const result = await response.json();
    if (result.status === "success" && result.data) {
      name = String(result.data[isShinjuku ? "pc_name" : "characterName"] || "").trim();
      loaded = true;
    }
  } catch (error) {
    console.error("Share metadata load failed:", error.message);
  }
  const baseTitle = isShinjuku
    ? "シンジュクロウラー 探索者シート - 卓スタダ"
    : "DX3 コンボジェネレーター - 卓スタダ";
  const title = name ? `${name} - ${baseTitle}` : baseTitle;
  const description = name
    ? `${name} の${isShinjuku ? "探索者シート" : "コンボデータ"}です。`
    : "共有されたキャラクターページを開きます。";
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  // Fixed destination host, escaped both for the link and the script context.
  const destinationScript = JSON.stringify(destination.href).replace(/</g, "\\u003c");
  const html = `<!doctype html>
<html lang="ja"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${safeTitle}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="卓スタダ">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDescription}">
<meta property="og:url" content="${escapeHtml(shareUrl.href)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDescription}">
</head><body>
<p><a href="${escapeHtml(destination.href)}">${safeTitle}を開く</a></p>
<script>window.location.replace(${destinationScript});</script>
</body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", loaded ? "public, max-age=0, s-maxage=60" : "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(200).send(req.method === "HEAD" ? "" : html);
};

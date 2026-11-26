// Cache only the public catalog index. Detail and editing requests still go to GAS.
const { loadCharacterIndex } = require("../lib/character-index.js");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }
  try {
    const payload = await loadCharacterIndex();
    // Browsers revalidate; the CDN shares successful responses for 60 seconds,
    // then may serve them for 60 more seconds while refreshing in the background.
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=60");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    if (req.method === "HEAD") return res.status(200).end();
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Character index load failed:", error.message);
    return res.status(502).json({ status: "error", message: "キャラクター一覧を取得できませんでした。" });
  }
};

const GAS_URL = "https://script.google.com/macros/s/AKfycbxMR7f_pOi14SsAuKvu7YxKVBQZ69dn-TeQpMBxyYzo_pwZmICNZ06cSb8BKQYCM0GuGg/exec";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

async function loadShareData(tool, id) {
  const url = new URL(GAS_URL);
  url.searchParams.set("tool", tool);
  url.searchParams.set("action", "load");
  url.searchParams.set("id", id);
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error("GAS load failed");
  return response.json();
}

module.exports = { escapeHtml, loadShareData };

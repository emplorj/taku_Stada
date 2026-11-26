const INDEX_URL = "https://script.google.com/macros/s/AKfycbz561gTV1WJKEQVip8JVDqDvqPACZXEj9x3ptMBzTwpSNBHWbMeCc9BxjL51C4dDKRy/exec?tool=index";

async function loadCharacterIndex() {
  const response = await fetch(INDEX_URL, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Catalog upstream HTTP ${response.status}`);
  const payload = await response.json();
  if (payload?.status !== "success" || !Array.isArray(payload.characters)) {
    throw new Error("Invalid catalog index response");
  }
  return payload;
}

module.exports = { loadCharacterIndex };

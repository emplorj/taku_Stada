const { test } = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/shinjuku-page.js");

test("sheet URL returns editor, escaped metadata and reusable saved JSON", async () => {
  const original = global.fetch;
  let calls = 0;
  const data = { pc_name: '名前"</script><script>悪意</script>', equip_r_free: true, puzzle_positions: "[]" };
  try {
    global.fetch = async url => {
      calls++;
      assert.equal(url.searchParams.get("id"), "保存&ID");
      return { ok: true, json: async () => ({ status: "success", data }) };
    };
    const res = {
      headers: {}, status(code) { this.code = code; return this; },
      setHeader(key, value) { this.headers[key] = value; return this; },
      send(html) { this.html = html; return this; },
    };
    await handler({ method: "GET", url: "/shinjuku_crawler.html?id=" + encodeURIComponent("保存&ID") }, res);
    assert.equal(res.code, 200);
    assert.equal(calls, 1);
    assert.equal(res.headers["Cache-Control"], "no-store");
    assert.match(res.html, /id="shinjuku-sheet"/);
    assert.match(res.html, /og:title" content="名前&quot;&lt;\/script&gt;/);
    const json = res.html.match(/id="shinjuku-initial-data">([\s\S]*?)<\/script>/)[1];
    assert.deepEqual(JSON.parse(json), { id: "保存&ID", result: { status: "success", data } });
    assert.doesNotMatch(json, /<script>/);
    const source = require("node:fs").readFileSync("shinjuku_crawler.html", "utf8");
    for (const match of source.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Function(match[1]);
  } finally { global.fetch = original; }
});

const { test } = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/share.js");

function response() {
  return {
    headers: {}, code: 0, body: "",
    setHeader(key, value) { this.headers[key] = value; return this; },
    status(code) { this.code = code; return this; },
    send(body) { this.body = body; return this; },
    end() { return this; },
  };
}

test("share HTML has outer-head metadata, escapes names, and preserves destination IDs", async () => {
  const originalFetch = global.fetch;
  try {
    for (const tool of ["shinjuku", "comboGenerator"]) {
      const id = "id&日本語";
      global.fetch = async url => {
        assert.equal(url.hostname, "script.google.com");
        assert.equal(url.searchParams.get("action"), "load");
        assert.equal(url.searchParams.get("id"), id);
        return { ok: true, json: async () => ({ status: "success", data: {
          pc_name: '名前"<script>危険</script>', characterName: "コンボ名",
        } }) };
      };
      const res = response();
      await handler({ method: "GET", url: `/api/share?tool=${tool}&id=${encodeURIComponent(id)}&url=v-123` }, res);
      assert.equal(res.code, 200);
      const head = res.body.split("</head>")[0];
      assert.match(head, /<meta property="og:title" content="/);
      assert.doesNotMatch(res.body, /<iframe|http-equiv="refresh"/i);
      assert.doesNotMatch(head, /<script>/);
      assert.match(head, tool === "shinjuku" ? /名前&quot;&lt;script&gt;/ : /コンボ名/);
      const target = JSON.parse(res.body.match(/window.location.replace\((.*)\);/)[1]);
      const destination = new URL(target);
      assert.equal(destination.hostname, "taku-stada.vercel.app");
      assert.equal(destination.searchParams.get(tool === "shinjuku" ? "id" : "url"), tool === "shinjuku" ? id : "v-123");
    }
    global.fetch = () => { throw new Error("invalid requests must not fetch"); };
    for (const url of ["/api/share?tool=other&id=x", "/api/share?tool=shinjuku"]) {
      const res = response();
      await handler({ method: "GET", url }, res);
      assert.equal(res.code, 400);
    }
  } finally {
    global.fetch = originalFetch;
  }
});

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const os = require("node:os");
const handler = require("../api/character-index.js");
const { writeCharacterIndex } = require("../tools/build-vercel-static.js");

function response() {
  return {
    headers: {}, code: 0, body: null,
    setHeader(key, value) { this.headers[key] = value; return this; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

const payload = { status: "success", generatedAt: "2026-11-27T00:00:00Z", characters: [
  { id: "1", registrationName: "探索者", representativeIndex: 0, variants: [{ name: "探索者", tags: ["テスト"] }] },
] };

test("public index is shared without altering data or forwarding client parameters", async () => {
  const originalFetch = global.fetch;
  try {
    global.fetch = async (url, options) => {
      const target = new URL(url);
      assert.equal(target.hostname, "script.google.com");
      assert.equal(target.search, "?tool=index");
      assert.ok(options.signal instanceof AbortSignal);
      return { ok: true, json: async () => payload };
    };
    const res = response();
    await handler({ method: "GET", url: "/api/character-index?tool=character&id=99" }, res);
    assert.equal(res.code, 200);
    assert.strictEqual(res.body, payload);
    assert.equal(res.headers["Cache-Control"], "public, max-age=0, s-maxage=60, stale-while-revalidate=60");
    assert.match(res.headers["Content-Type"], /application\/json/);
    const head = response();
    await handler({ method: "HEAD" }, head);
    assert.equal(head.code, 200);
    assert.equal(head.body, null);
  } finally { global.fetch = originalFetch; }
});

test("failed upstream data is never cached and writes are rejected", async () => {
  const originalFetch = global.fetch;
  const originalError = console.error;
  try {
    console.error = () => {};
    for (const result of [
      new Error("offline"),
      { ok: false, status: 503 },
      { ok: true, json: async () => ({ status: "error", characters: [] }) },
      { ok: true, json: async () => ({ status: "success" }) },
    ]) {
      global.fetch = async () => { if (result instanceof Error) throw result; return result; };
      const res = response();
      await handler({ method: "GET" }, res);
      assert.equal(res.code, 502);
      assert.equal(res.headers["Cache-Control"], "no-store");
    }
    global.fetch = async () => { assert.fail("writes must not contact GAS"); };
    const res = response();
    await handler({ method: "POST" }, res);
    assert.equal(res.code, 405);
    assert.equal(res.headers.Allow, "GET, HEAD");
  } finally {
    global.fetch = originalFetch;
    console.error = originalError;
  }
});

// Exercise the actual browser request functions without rendering the entire catalog.
const source = fs.readFileSync(path.join(__dirname, "../js/enj_characters.js"), "utf8");
const fetchFunctions = source.slice(source.indexOf("  async function fetchCharacterPayload("), source.indexOf("  function readCachedCharacterPayload(")) +
  source.slice(source.indexOf("  async function fetchLatestCharacterIndex("), source.indexOf("  async function loadCharacters("));

test("browser uses a stable Vercel URL with direct GAS fallback; local preview stays direct", async () => {
  for (const hostname of ["taku-stada.vercel.app", "taku-stada-preview.vercel.app", "127.0.0.1", "emplorj.github.io"]) {
    for (const offlineCache of [false, true]) {
      const requests = [];
      const context = vm.createContext({
        location: { hostname }, CHARACTER_INDEX_API_URL: "https://example.test/exec?tool=index",
        isCharacterPayload: value => value?.status === "success" && Array.isArray(value.characters),
        console: { warn() {} },
        fetch: async (url, options) => {
          requests.push({ url, options });
          if (url === "/api/character-index" && offlineCache) throw new Error("not deployed yet");
          return { ok: true, json: async () => payload };
        },
      });
      const result = await vm.runInContext(`${fetchFunctions}\nfetchLatestCharacterIndex()`, context);
      assert.strictEqual(result, payload);
      const vercel = hostname.endsWith(".vercel.app");
      assert.equal(requests.length, vercel && offlineCache ? 2 : 1);
      if (vercel) {
        assert.equal(requests[0].url, "/api/character-index");
        assert.equal(requests[0].options.cache, undefined);
      }
      if (!vercel || offlineCache) {
        assert.match(requests.at(-1).url, /^https:\/\/example\.test\/exec\?tool=index&_=/);
        assert.equal(requests.at(-1).options.cache, "no-store");
      }
    }
  }
});

test("build snapshot contains only the public index and a failed build removes an older snapshot", async () => {
  const originalFetch = global.fetch;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "taku-character-index-"));
  const destination = path.join(directory, "data/enj_characters.index.json");
  try {
    global.fetch = async url => {
      assert.equal(new URL(url).search, "?tool=index");
      return { ok: true, json: async () => payload };
    };
    await writeCharacterIndex(directory);
    assert.deepEqual(JSON.parse(fs.readFileSync(destination, "utf8")), payload);
    global.fetch = async () => { throw new Error("offline"); };
    await assert.rejects(writeCharacterIndex(directory), /offline/);
    assert.equal(fs.existsSync(destination), false);
  } finally {
    global.fetch = originalFetch;
    assert.ok(directory.startsWith(path.join(os.tmpdir(), "taku-character-index-")));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function catalogLoader(saved = null, search = "") {
  const preview = deferred(), api = deferred(), displayed = [], cached = [];
  const status = {}, count = {};
  const context = vm.createContext({
    location: { hostname: "taku-stada.vercel.app", search }, URLSearchParams, status, count,
    console: { warn() {} },
    readCachedCharacterPayload: () => saved,
    saveCachedCharacterPayload: value => cached.push(value),
    fetchCharacterPayload: url => { assert.equal(url, "data/enj_characters.index.json"); return preview.promise; },
    fetchLatestCharacterIndex: () => api.promise,
    applyCharacterPayload: (value, options) => displayed.push({ value, options }),
    payloadGeneratedAt: value => Date.parse(value.generatedAt) || 0,
  });
  const loader = source.slice(source.indexOf("  async function loadCharacters("), source.indexOf('  grid.addEventListener("click"'));
  const done = vm.runInContext(`${loader}\nloadCharacters()`, context);
  return { preview, api, displayed, cached, status, count, done };
}

test("first visit displays the snapshot before GAS, and unchanged data does not rebuild cards", async () => {
  const page = catalogLoader();
  page.preview.resolve(payload);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.displayed.length, 1);
  assert.equal(page.displayed[0].options.openInitial, true);
  assert.equal(page.status.hidden, true);
  page.api.resolve({ ...payload, generatedAt: "2026-11-27T00:01:00Z" });
  await page.done;
  assert.equal(page.displayed.length, 1);
  assert.equal(page.cached.length, 1);
});

test("a slow snapshot cannot delay or overwrite live data; new data opens the URL character only once", async () => {
  const page = catalogLoader();
  const latest = { ...payload, characters: [{ ...payload.characters[0], registrationName: "最新" }] };
  page.api.resolve(latest);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.displayed[0].value, latest);
  assert.equal(page.status.hidden, true);
  page.preview.resolve(payload);
  await page.done;
  assert.equal(page.displayed.length, 1);

  const next = catalogLoader();
  next.preview.resolve(payload);
  await new Promise(resolve => setImmediate(resolve));
  next.api.resolve(latest);
  await next.done;
  assert.equal(next.displayed.length, 2);
  assert.equal(next.displayed[1].options.openInitial, false);
});

test("saved data survives an older snapshot or offline API, and total failure shows a useful error", async () => {
  const saved = { ...payload, generatedAt: "2026-11-27T01:00:00Z" };
  const page = catalogLoader(saved);
  page.preview.resolve(payload);
  page.api.reject(new Error("offline"));
  await page.done;
  assert.equal(page.displayed.length, 1);
  assert.equal(page.displayed[0].value, saved);
  assert.equal(page.status.hidden, true);

  const failed = catalogLoader();
  failed.preview.reject(new Error("missing snapshot"));
  failed.api.reject(new Error("offline"));
  await failed.done;
  assert.match(failed.status.textContent, /読み込めませんでした/);
  assert.equal(failed.status.hidden, false);
  assert.equal(failed.count.textContent, "0 characters");
});

test("a shared URL to a newly added character still opens when the latest index arrives", async () => {
  const page = catalogLoader(null, "?id=2");
  page.preview.resolve(payload);
  await new Promise(resolve => setImmediate(resolve));
  const latest = { ...payload, characters: [...payload.characters, { ...payload.characters[0], id: "2" }] };
  page.api.resolve(latest);
  await page.done;
  assert.equal(page.displayed.length, 2);
  assert.equal(page.displayed[1].options.openInitial, true);
});

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { resolveFile } = require("../tools/dev-server.js");

test("local routes resolve to actual HTML and assets without exposing internals", () => {
  assert.equal(resolveFile("/shinjuku_crawler"), resolveFile("/shinjuku_crawler.html"));
  assert.equal(path.basename(resolveFile("/")), "index.html");
  assert.equal(resolveFile("/247_guild/"), resolveFile("/247_guild/index.html"));
  assert.equal(path.basename(resolveFile("/247_guild/sw25_generator")), "sw25_generator.html");
  assert.equal(path.basename(resolveFile("/css/style.css")), "style.css");
  for (const url of ["/.git/config", "/%2e%2e/.env", "/taku_stada_gas/.clasp.json", "/api/share.js", "/%zz", "/missing-page"]) assert.equal(resolveFile(url), null);
});

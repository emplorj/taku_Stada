const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const { redirectHtml } = require("../tools/build-github-redirects.js");

test("legacy redirects retain nested paths, encoded queries and fragments", () => {
  for (const [from, to] of [
    ["/taku_Stada", "/"],
    ["/taku_Stada/", "/"],
    ["/taku_Stada/247_guild/", "/247_guild/"],
    ["/taku_Stada/247_guild/sw25_generator.html", "/247_guild/sw25_generator.html"],
    ["/taku_Stada/shinjuku_crawler.html", "/shinjuku"],
    ["/taku_Stada/CoC_Q%26A.html", "/CoC_Q%26A.html"],
  ]) {
    let actual;
    const html = redirectHtml("index.html");
    vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {
      location: { pathname: from, search: "?id=%E6%97%A5%E6%9C%AC%26%3F&mode=json", hash: "#panel-enemy-builder", replace(url) { actual = url; } },
    });
    assert.equal(actual, "https://taku-stada.vercel.app" + to + "?id=%E6%97%A5%E6%9C%AC%26%3F&mode=json#panel-enemy-builder");
  }
});

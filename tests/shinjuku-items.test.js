const { test } = require("node:test");
const assert = require("node:assert/strict");
const catalog = require("../js/shinjuku_items.js");

test("all inventory presets have price, dimensions and notes", () => {
  assert.equal(new Set(catalog.all.map(i => i.name)).size, catalog.all.length);
  assert.ok(catalog.all.length > 80);
  for (const item of catalog.all) {
    assert.ok(Number.isFinite(item.price));
    assert.ok(item.w > 0 && item.h > 0);
    assert.ok(catalog.describe(item.name));
    assert.equal(catalog.get(item.name), item);
  }
});

test("old aliases and different character widths resolve the same item", () => {
  assert.equal(catalog.get("缶チューハイ"), catalog.get("缶チューハイ（500ml）"));
  assert.equal(catalog.get("G & G ルールブック"), catalog.get("G＆Gルールブック"));
  assert.equal(catalog.get("ロープの束(5m)").h, 3);
  assert.equal(catalog.get("自由な自作アイテム"), undefined);
});

test("effects and remarks include damage, armor, folding and usage counts", () => {
  assert.match(catalog.describe("特殊警棒"), /ダメージ：1d6/);
  assert.match(catalog.describe("特殊警棒"), /1×2/);
  assert.match(catalog.describe("分厚い辞書"), /耐久：3/);
  assert.match(catalog.describe("分厚い辞書"), /ダメージ：1d3/);
  assert.doesNotMatch(catalog.describe("分厚い辞書", "b"), /耐久：3/);
  assert.match(catalog.describe("分厚い辞書", "b"), /ダメージ：1d3/);
  assert.equal(catalog.get("自撮り棒").count, 3);
  assert.equal(catalog.get("拳銃").count, 17);
  assert.equal(catalog.get("カロリーフレンド").count, "");
});

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { parse, format } = require("../js/shinjuku_tags.js");

test("commas and half/full width whitespace delimit tags, including pasted text", () => {
  assert.deepEqual(parse("教え上手, ポジティブ 大食い　器用\t記憶力\n計画性"),
    ["教え上手", "ポジティブ", "大食い", "器用", "記憶力", "計画性"]);
});
test("legacy Japanese separators, hashtags and brackets still load correctly", () => {
  assert.deepEqual(parse("＃根性、［演技力］，超器用；【ハンドメイド】"), ["根性", "演技力", "超器用", "ハンドメイド"]);
});
test("normalization skips empty and repeated tags without changing their order", () => {
  assert.equal(format(" , 根性  演技力,根性, , "), "根性, 演技力");
  assert.equal(format(["超器用", "ハンドメイド", "超器用"]), "超器用, ハンドメイド");
  assert.equal(format(null), "");
});
test("new tag names retain internal punctuation instead of silently splitting a compound name", () => {
  assert.deepEqual(parse("好き・大事, メモ（仮）"), ["好き・大事", "メモ（仮）"]);
});

function editor(initial = "") {
  const document = new EventTarget(), window = {};
  class Control extends EventTarget {
    constructor() { super(); this.children = []; this.value = ""; }
    setAttribute(name, value) { this[name] = value; }
    append(...children) { this.children.push(...children); }
    appendChild(child) { this.children.push(child); }
    replaceChildren() { this.children = []; }
    focus() { document.activeElement = this; }
    select() {}
  }
  const original = new Control();
  original.value = initial;
  original.form = new EventTarget();
  original.closest = () => ({ querySelector: () => ({}) });
  let wrapper;
  original.before = element => { wrapper = element; };
  document.querySelector = () => original;
  document.createElement = () => new Control();
  vm.runInNewContext(fs.readFileSync("js/shinjuku_tags.js", "utf8"), { window, document, Event, queueMicrotask });
  document.dispatchEvent(new Event("DOMContentLoaded"));
  const entry = wrapper.children[1].children[0], addButton = wrapper.children[1].children[1], chips = wrapper.children[0];
  const emit = (type, fields = {}) => {
    const event = Object.assign(new Event(type, { cancelable: true }), fields);
    entry.dispatchEvent(event);
    return event;
  };
  return { original, entry, addButton, emit, document, api: window.ShinjukuTags,
    type(value) { entry.value = value; emit("input"); },
    get tags() { return chips.children.map(chip => chip.children[0].textContent); },
  };
}

test("Enter and nonempty Tab commit tags, while empty Tab keeps normal field navigation", () => {
  const page = editor();
  page.type("根性");
  assert.equal(page.emit("keydown", { key: "Enter" }).defaultPrevented, true);
  page.type("演技力");
  assert.equal(page.emit("keydown", { key: "Tab" }).defaultPrevented, true);
  assert.deepEqual(page.tags, ["根性", "演技力"]);
  assert.equal(page.original.value, "根性, 演技力");
  assert.equal(page.entry.value, "");
  assert.equal(page.emit("keydown", { key: "Tab" }).defaultPrevented, false);
});

test("Japanese composition does not commit a tag on the IME confirmation Enter", () => {
  const page = editor();
  page.emit("compositionstart");
  page.type("集中力");
  assert.equal(page.emit("keydown", { key: "Enter", isComposing: true }).defaultPrevented, false);
  assert.deepEqual(page.tags, []);
  page.emit("compositionend");
  assert.deepEqual(page.tags, []);
  page.emit("keydown", { key: "Enter" });
  assert.deepEqual(page.tags, ["集中力"]);
});

test("pasted separators, external loads and a pending tag before save use the same stored format", () => {
  const page = editor("計画性　記憶力");
  assert.deepEqual(page.tags, ["計画性", "記憶力"]);
  page.type("器用, 学習力 好奇心");
  assert.deepEqual(page.tags, ["計画性", "記憶力", "器用", "学習力"]);
  page.api.commit();
  assert.equal(page.original.value, "計画性, 記憶力, 器用, 学習力, 好奇心");
  page.original.value = "超器用、ハンドメイド";
  page.original.dispatchEvent(new Event("input"));
  assert.deepEqual(page.tags, ["超器用", "ハンドメイド"]);
});

test("the tap add button commits a tag and keeps the input ready for the next tag", () => {
  const page = editor();
  page.type("根性");
  page.addButton.dispatchEvent(new Event("click"));
  assert.deepEqual(page.tags, ["根性"]);
  assert.equal(page.entry.value, "");
  assert.equal(page.document.activeElement, page.entry);
  page.addButton.dispatchEvent(new Event("click"));
  assert.deepEqual(page.tags, ["根性"]);
});

test("a tap during Japanese composition adds the tag only after the IME confirms it", () => {
  const page = editor();
  page.emit("compositionstart");
  page.type("集中力");
  page.addButton.dispatchEvent(new Event("click"));
  assert.deepEqual(page.tags, []);
  page.emit("compositionend");
  assert.deepEqual(page.tags, ["集中力"]);
  assert.equal(page.entry.value, "");
});

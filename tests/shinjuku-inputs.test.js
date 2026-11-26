const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { arrange } = require("../js/bag_puzzle.js");

function rowControls() {
  const document = new EventTarget();
  const window = new EventTarget();
  window.innerHeight = 800;
  window.scrollBy = () => {};
  const frames = new Set();
  let frameId = 0;
  vm.runInNewContext(fs.readFileSync("js/shinjuku_inputs.js", "utf8"), {
    window, document, Event,
    requestAnimationFrame() { frames.add(++frameId); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  const body = {
    children: [],
    insertBefore(row, before) {
      this.children.splice(this.children.indexOf(row), 1);
      this.children.splice(before ? this.children.indexOf(before) : this.children.length, 0, row);
    },
  };
  let changes = 0;
  for (const id of ["a", "b", "c"]) {
    const classes = new Set();
    const row = {
      id, parentElement: body,
      classList: { add: value => classes.add(value), remove: value => classes.delete(value) },
      get previousElementSibling() { return body.children[body.children.indexOf(this) - 1] || null; },
      get nextElementSibling() { return body.children[body.children.indexOf(this) + 1] || null; },
      getBoundingClientRect() { return { top: 100 + body.children.indexOf(this) * 32, height: 32 }; },
      handle: Object.assign(new EventTarget(), { focus() {} }),
    };
    body.children.push(row);
    window.ShinjukuInputs.reorder(row.handle, row, () => changes++);
  }
  const emit = (target, type, fields) => target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), fields));
  return { body, document, emit, frames, get changes() { return changes; } };
}

test("inventory row handles support adjacent keyboard moves without moving past the ends", () => {
  const page = rowControls();
  const first = page.body.children[0];
  page.emit(first.handle, "keydown", { key: "ArrowUp" });
  assert.equal(page.changes, 0);
  page.emit(first.handle, "keydown", { key: "ArrowDown" });
  assert.deepEqual(page.body.children.map(row => row.id), ["b", "a", "c"]);
  page.emit(first.handle, "keydown", { key: "ArrowDown" });
  page.emit(first.handle, "keydown", { key: "ArrowDown" });
  assert.deepEqual(page.body.children.map(row => row.id), ["b", "c", "a"]);
  assert.equal(page.changes, 2);
});

test("pointer reordering ignores other pointers and saves once when a drag ends", () => {
  const page = rowControls();
  const first = page.body.children[0];
  page.emit(first.handle, "pointerdown", { button: 0, pointerId: 1, clientY: 116 });
  page.emit(page.document, "pointermove", { pointerId: 2, clientY: 195 });
  assert.deepEqual(page.body.children.map(row => row.id), ["a", "b", "c"]);
  page.emit(page.document, "pointermove", { pointerId: 1, clientY: 195 });
  assert.deepEqual(page.body.children.map(row => row.id), ["b", "c", "a"]);
  assert.equal(page.changes, 0);
  page.emit(page.document, "pointerup", { pointerId: 1 });
  assert.equal(page.changes, 1);
  assert.equal(page.frames.size, 0);
  page.emit(page.document, "pointermove", { pointerId: 1, clientY: 100 });
  assert.deepEqual(page.body.children.map(row => row.id), ["b", "c", "a"]);
});

test("canceling a drag also persists its current order and stops the scrolling loop", () => {
  const page = rowControls();
  page.emit(page.body.children[2].handle, "pointerdown", { button: 0, pointerId: 1, clientY: 180 });
  page.emit(page.document, "pointermove", { pointerId: 1, clientY: 100 });
  page.emit(page.document, "pointercancel", { pointerId: 1 });
  assert.deepEqual(page.body.children.map(row => row.id), ["c", "a", "b"]);
  assert.equal(page.changes, 1);
  assert.equal(page.frames.size, 0);
});

test("saving reordered inventory preserves bag coordinates, free flags, notes, counts and row IDs", () => {
  const source = fs.readFileSync("js/bag_puzzle.js", "utf8");
  const items = [
    { id: "a", name: "カロリーフレンド", x: 0, y: 5, w: 1, h: 1, rawW: 1, rawH: 1 },
    { id: "b", name: "缶チューハイ", x: 1, y: 4, w: 1, h: 2, rawW: 1, rawH: 2 },
  ];
  const rows = [
    { dataset: { id: "b" }, item_note: "缶のメモ", item_price: "15", item_count: "2", item_free: false },
    { dataset: { id: "a" }, item_note: "食料のメモ", item_price: "20", item_count: "1", item_free: true },
  ];
  rows.forEach(row => { row.querySelector = selector => {
    const key = selector.match(/name="([^"]+)"/)[1];
    return { value: row[key], checked: row[key] };
  }; });
  const hiddenInput = {};
  const context = vm.createContext({ items, hiddenInput, itemListBody: {
    rows, querySelector: selector => rows.find(row => row.dataset.id === selector.match(/data-id="([^"]+)"/)[1]),
  } });
  const start = source.indexOf("  function savePositionsToHidden()");
  const save = source.slice(start, source.indexOf("  // --- ロード用 ---", start));
  const orderStart = source.indexOf("      const order = new Map(Array.from(itemListBody.rows");
  const order = source.slice(orderStart, source.indexOf("      savePositionsToHidden();", orderStart));
  vm.runInContext(`${save}\n${order}\nsavePositionsToHidden();`, context);
  const saved = JSON.parse(hiddenInput.value);
  assert.deepEqual(saved.map(item => item.id), ["b", "a"]);
  assert.deepEqual(saved.map(item => [item.x, item.y, item.w, item.h]), [[1, 4, 1, 2], [0, 5, 1, 1]]);
  assert.deepEqual(saved.map(item => [item.isFree, item.note, item.count]), [[false, "缶のメモ", "2"], [true, "食料のメモ", "1"]]);
  // Restore keeps the saved order and legal manual positions intact.
  assert.deepEqual(arrange(saved), saved);
});

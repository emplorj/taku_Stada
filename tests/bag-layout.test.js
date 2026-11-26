const { test } = require("node:test");
const assert = require("node:assert/strict");
const { canPlace, arrange } = require("../js/bag_puzzle.js");

const piece = (id, w, h, x = 0, y = 0) => ({ id, w, h, rawW: w, rawH: h, x, y });
function assertValid(items) {
  for (const item of items.filter(i => !i.unplaced)) {
    assert.ok(canPlace(item, item.x, item.y, items), `illegal placement: ${JSON.stringify(item)}`);
  }
}

test("full bag leaves new items unplaced instead of stacking at the origin", () => {
  const items = arrange([piece("bag-full", 6, 6), piece("extra", 1, 1)]);
  assert.deepEqual([items[0].x, items[0].y], [0, 0]);
  assert.equal(items[1].unplaced, true);
  assertValid(items);
});

test("old overlapping saves are repaired, keeping the first valid position", () => {
  const items = arrange([piece("armor", 3, 4), piece("food", 1, 1), piece("shoes", 2, 2)]);
  assertValid(items);
  assert.deepEqual([items[0].x, items[0].y], [0, 0]);
  assert.equal(items.filter(i => i.unplaced).length, 0);
});

test("growing an item preserves unchanged neighbors and moves the resized item", () => {
  const items = arrange([piece("growing", 3, 4), piece("fixed", 2, 2, 1, 1)], new Set(["fixed"]));
  assertValid(items);
  assert.deepEqual([items[1].x, items[1].y], [1, 1]);
});

test("overflow stays connected to the bag and never overlaps occupied cells", () => {
  const items = arrange([piece("lower", 6, 3, 0, 3), piece("tall", 6, 4)]);
  assertValid(items);
  assert.equal(items[1].y, -1);
  assert.equal(items[1].unplaced, false);
  assert.equal(canPlace(piece("outside", 1, 2), 0, -2, []), false);
});

test("automatic rotation fits long items while retaining raw size and inventory metadata", () => {
  const items = arrange([{ ...piece("long", 8, 2), name: "道具", price: "50", isFree: true, note: "メモ", count: "3" }]);
  assertValid(items);
  assert.equal(items[0].w, 2);
  assert.equal(items[0].h, 8);
  assert.equal(items[0].rawW, 8);
  assert.equal(items[0].rawH, 2);
  assert.equal(items[0].price, "50");
  assert.equal(items[0].isFree, true);
  assert.equal(items[0].note, "メモ");
  assert.equal(items[0].count, "3");
  assert.equal(arrange([piece("too-wide", 8, 8)])[0].unplaced, true);
});

test("moving or rotating onto another item is rejected, edge-touching is allowed", () => {
  const items = [piece("moving", 1, 3), piece("fixed", 2, 3, 1, 0)];
  assert.equal(canPlace(items[0], 1, 0, items), false);
  assert.equal(canPlace({ ...items[0], w: 3, h: 1 }, 0, 0, items), false);
  assert.equal(canPlace(items[0], 3, 0, items), true);
  assert.equal(canPlace(items[0], -1, 0, items), false);
  assert.equal(canPlace(items[0], 0, 4, items), false);
});

test("unplaced items can return after space is freed, and legal saved coordinates stay intact", () => {
  const full = arrange([piece("full", 6, 6), piece("waiting", 1, 1)]);
  const retried = arrange(full.filter(i => i.id !== "full"));
  assert.equal(retried[0].unplaced, false);
  assertValid(retried);
  const saved = [piece("a", 2, 2, 4, 4), piece("b", 1, 3, 0, -1)];
  assert.deepEqual(arrange(saved), saved);
});

test("dense sets never stack, including overflow and oversized input", () => {
  for (let seed = 1; seed <= 80; seed++) {
    const input = Array.from({ length: 12 }, (_, i) => piece(String(i), 1 + (seed * 3 + i * 7) % 8, 1 + (seed * 5 + i * 3) % 9));
    const result = arrange(input);
    assert.equal(result.length, input.length);
    assertValid(result);
    assertValid(arrange(JSON.parse(JSON.stringify(result))));
  }
});

test("the pack button fills the bottom row before moving upwards", () => {
  const packed = arrange([piece("tall", 1, 2), piece("small", 1, 1), piece("wide", 2, 1)], new Set());
  assert.deepEqual(packed.map(i => [i.x, i.y]), [[0, 4], [1, 5], [2, 5]]);
  assertValid(packed);
});

test("packing moves existing items down, while restoring preserves legal manual coordinates", () => {
  const source = [piece("manual", 2, 2, 4, 0)];
  assert.deepEqual(arrange(source), source);
  assert.equal(arrange(source, new Set())[0].y, 4);
});

const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");

// Exercise the real click/input handlers without network saves or a browser.
function sheet(search = "") {
  class Control {
    constructor(value = "") { this.value = value; this.checked = false; this.events = {}; this.style = {}; }
    get valueAsNumber() { return this.value === "" ? NaN : Number(this.value); }
    addEventListener(type, fn) { (this.events[type] ||= []).push(fn); }
    dispatchEvent(event) { for (const fn of this.events[event.type] || []) fn(event); }
    click() { if (!this.disabled) this.dispatchEvent({ type: "click" }); }
    focus() {}
    setAttribute(name, value) { this[name] = value; }
    showPopover() { this.isOpen = true; }
    hidePopover() { this.isOpen = false; }
  }
  const controls = {};
  const element = id => controls[id] ||= new Control();
  const fields = {};
  for (const name of ["stamina", "spirit", "background", "tags", "pc_name", "motivation"]) fields[name] = new Control();
  for (const slot of ["r", "l", "b"]) for (const key of ["name", "stat", "price", "free", "w", "h", "note"]) {
    fields[`equip_${slot}_${key}`] = new Control(["w", "h"].includes(key) ? "1" : "");
  }
  const nameIn = selector => selector.match(/name="([^"]+)"/)[1];
  const table = {
    rows: [],
    querySelectorAll: () => table.rows.map(row => row.fields.item_name),
  };
  function addRow() {
    const row = { fields: {}, dataset: { id: `row-${table.rows.length}` }, querySelector(selector) { return this.fields[nameIn(selector)]; } };
    for (const key of ["name", "price", "free", "w", "h", "count", "note"]) row.fields[`item_${key}`] = new Control(["w", "h"].includes(key) ? "1" : "");
    table.rows.push(row);
  }
  addRow();
  element("add-item-row").addEventListener("click", addRow);
  const panel = element("shinjuku-creation");
  panel.querySelector = selector => element(selector.slice(1));
  element("creation-auto-equip").checked = true;
  const form = { elements: fields, querySelector: () => table, style: {} };
  const document = {
    getElementById(id) { return id === "shinjuku-sheet" ? form : id.startsWith("row-") && id.endsWith("-puzzle") ? null : element(id); },
    querySelector(selector) { return selector === ".crawler-header" ? { getBoundingClientRect: () => ({ bottom: 82 }) } : fields[nameIn(selector)]; },
  };
  let confirms = 0, totalCalls = 0;
  const randoms = [];
  vm.runInNewContext(fs.readFileSync("js/shinjuku_creation.js", "utf8"), {
    document, location: { search }, URLSearchParams,
    Math: Object.assign(Object.create(Math), { random: () => randoms.shift() ?? 0 }),
    Event: class { constructor(type) { this.type = type; } },
    window: { confirm() { confirms++; return true; }, calculateTotal() { totalCalls++; }, addEventListener() {} },
  });
  return {
    fields, table, element, randoms,
    get confirms() { return confirms; }, get totalCalls() { return totalCalls; },
    setStats(stamina, spirit, bonus = [6, 5]) {
      fields.stamina.value = String(stamina); fields.spirit.value = String(spirit);
      fields.spirit.dispatchEvent({ type: "input" });
      for (const [index, key] of ["creation-extra-stamina", "creation-extra-spirit"].entries()) element(key).value = String(bonus[index]);
      panel.dispatchEvent({ type: "input" });
    },
    bag() { return table.rows.map(row => row.fields).filter(f => f.item_name.value); },
  };
}

test("PDF example: base and bonus equipment keep all quantities and free flags", () => {
  const s = sheet();
  s.setStats(3, 2, [6, 1]);
  s.element("creation-apply").click();
  assert.equal(s.fields.background.value, "売れないミュージシャン");
  assert.equal(s.fields.tags.value, "楽器演奏・表現力");
  assert.equal(s.fields.equip_r_name.value, "金属バット");
  assert.equal(s.fields.equip_l_name.value, "大バール");
  assert.equal(s.fields.equip_b_stat.value, "1");
  const names = s.bag().map(row => row.item_name.value);
  assert.equal(names.filter(n => n === "缶チューハイ").length, 4);
  assert.equal(names.filter(n => n === "携帯型ラジオ").length, 2);
  assert.ok(s.bag().every(row => row.item_free.checked));
  assert.ok(["r", "l", "b"].every(slot => s.fields[`equip_${slot}_free`].checked));
  s.element("creation-apply").click();
  assert.equal(s.totalCalls, 1, "a second click does not duplicate items");
});

test("all 36 backgrounds resolve catalog sizes and prices, with auto equip disabled", () => {
  // Item counts in the background table on pp.16–17, expanding ×N.
  const counts = [[4,6,4,3,5,5],[3,4,4,4,4,2],[3,6,5,3,3,2],[4,5,4,3,2,4],[2,4,2,4,2,2],[3,3,2,2,1,3]];
  for (let stamina = 1; stamina <= 6; stamina++) for (let spirit = 1; spirit <= 6; spirit++) {
    const s = sheet();
    s.element("creation-auto-equip").checked = false;
    s.setStats(stamina, spirit);
    s.element("creation-apply").click();
    assert.equal(s.bag().length, counts[stamina - 1][spirit - 1] + (stamina + spirit <= 5 ? 1 : 0));
    assert.ok(s.bag().every(row => Number(row.item_price.value) > 0 && Number(row.item_w.value) > 0 && Number(row.item_h.value) > 0 && row.item_free.checked));
    assert.equal(s.fields.equip_r_name.value, "");
  }
});

test("filled equipment and partially entered bag rows are preserved", () => {
  const s = sheet();
  s.fields.equip_r_note.value = "編集中";
  s.fields.equip_b_name.value = "既存の防具";
  s.table.rows[0].fields.item_note.value = "メモだけ入力済み";
  s.setStats(5, 1);
  s.element("creation-apply").click();
  assert.equal(s.confirms, 1);
  assert.equal(s.fields.equip_r_name.value, "");
  assert.equal(s.fields.equip_r_note.value, "編集中");
  assert.equal(s.fields.equip_l_name.value, "特殊警棒");
  assert.equal(s.fields.equip_b_name.value, "既存の防具");
  assert.equal(s.bag()[0].item_name.value, "防刃ベスト（警察）");
  assert.equal(s.table.rows[0].fields.item_note.value, "メモだけ入力済み");
});

test("additional dice are required only for a stat sum of five or less", () => {
  const s = sheet();
  s.setStats(2, 3, [0, 7]);
  assert.equal(s.element("creation-apply").disabled, true);
  s.setStats(3, 3, [0, 7]);
  assert.equal(s.element("creation-apply").disabled, false);
  s.setStats(7, 3);
  assert.equal(s.element("creation-apply").disabled, true);
});

test("all d66 motives directly fill the field without modifying equipment", () => {
  const s = sheet();
  const results = new Set();
  for (let first = 1; first <= 6; first++) for (let second = 1; second <= 6; second++) {
    s.randoms.push((first - 0.5) / 6, (second - 0.5) / 6);
    s.element("creation-motive-roll").click();
    assert.equal(s.element("creation-motive-result").textContent, `${first}${second}`);
    assert.ok(s.fields.motivation.value.length > 20);
    results.add(s.fields.motivation.value);
  }
  assert.equal(results.size, 36);
  assert.equal(s.bag().length, 0);
});

test("header roll updates status numbers and opens the adjacent review popover", () => {
  const s = sheet();
  s.randoms.push(3.5 / 6, 5.5 / 6);
  s.element("creation-roll").click();
  assert.equal(Number(s.fields.stamina.value), 4);
  assert.equal(Number(s.fields.spirit.value), 6);
  assert.equal(s.element("shinjuku-creation").isOpen, true);
  assert.equal(s.element("shinjuku-creation").style.top, "90px");
  assert.equal(s.fields.background.value, "");
  s.element("creation-apply").click();
  assert.equal(s.fields.background.value, "ホスト or ホステス");
  assert.equal(s.element("shinjuku-creation").isOpen, false);
  assert.equal(s.element("creation-apply").disabled, true);
});

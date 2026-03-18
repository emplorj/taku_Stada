const state = {
  enemies: [],
  selectedId: null,
  search: "",
  maneuverMasterMap: new Map(),
  maneuverMasterLoaded: false,
};

const PART_TYPES = ["頭", "腕", "胴", "脚"];
const CLASS_TYPES = ["サヴァント", "ホラー", "レギオン"];
const TIMING_OPTIONS = [
  "オート",
  "アクション",
  "ジャッジ",
  "ダメージ",
  "ラピッド",
  "効果参照",
];
const RANGE_OPTIONS = [
  "なし",
  "効果参照",
  "自身",
  "0",
  "1",
  "2",
  "3",
  "0-1",
  "0-2",
  "0-3",
  "1-2",
  "1-3",
  "2-3",
];
const NC_AUTHOR_STORAGE_KEY = "nechronicaManagerAuthor";
const BASIC_MANEUVERS_TEMPLATE = [
  { type: "頭", name: "のうみそ" },
  { type: "頭", name: "めだま" },
  { type: "頭", name: "あご" },
  { type: "腕", name: "こぶし" },
  { type: "腕", name: "うで" },
  { type: "腕", name: "かた" },
  { type: "胴", name: "せぼね" },
  { type: "胴", name: "はらわた" },
  { type: "胴", name: "はらわた" },
  { type: "脚", name: "ほね" },
  { type: "脚", name: "ほね" },
  { type: "脚", name: "あし" },
];

const el = {
  enemyList: document.getElementById("enemyList"),
  enemySearchInput: document.getElementById("enemySearchInput"),
  saveEnemyButton: document.getElementById("saveEnemyButton"),
  exportJsonButton: document.getElementById("exportJsonButton"),
  exportKomaJsonButton: document.getElementById("exportKomaJsonButton"),
  copyMemoPreviewButton: document.getElementById("copyMemoPreviewButton"),
  importKomaJsonButton: document.getElementById("importKomaJsonButton"),
  komaJsonInput: document.getElementById("komaJsonInput"),
  partsStatusPanel: document.getElementById("partsStatusPanel"),
  addBasicManeuversButton: document.getElementById("addBasicManeuversButton"),
  addManeuverButton: document.getElementById("addManeuverButton"),
  enemyEditorForm: document.getElementById("enemyEditorForm"),
  dataPreview: document.getElementById("dataPreview"),
  memoPreview: document.getElementById("memoPreview"),
  maneuversTableBody: document.querySelector("#maneuversTable tbody"),
  maneuverKindList: document.getElementById("maneuverKindList"),
  fields: {
    id: document.getElementById("field-id"),
    author: document.getElementById("field-author"),
    name: document.getElementById("field-name"),
    malice: document.getElementById("field-malice"),
    initiative: document.getElementById("field-initiative"),
    classType: document.getElementById("field-class-type"),
    iconUrl: document.getElementById("field-icon-url"),
    isPublic: document.getElementById("field-is-public"),
    isPublicText: document.getElementById("field-is-public-text"),
    time: document.getElementById("field-time"),
    timeText: document.getElementById("field-time-text"),
    memo: document.getElementById("field-memo"),
  },
};

function nowIsoLocal() {
  return new Date().toISOString();
}

function getRememberedAuthor() {
  try {
    const v = String(localStorage.getItem(NC_AUTHOR_STORAGE_KEY) || "").trim();
    return v === "system" ? "" : v;
  } catch (_e) {
    return "";
  }
}

function rememberAuthor(name) {
  try {
    localStorage.setItem(NC_AUTHOR_STORAGE_KEY, String(name || "").trim());
  } catch (_e) {
    // ignore storage errors
  }
}

function formatDateTimeDisplay(isoLike) {
  const d = isoLike ? new Date(isoLike) : new Date();
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${min}:${s}`;
}

function createEmptyManeuver() {
  return {
    id: `man_${Date.now()}`,
    status: "無事",
    name: "",
    kindName: "",
    displayName: "",
    partType: "胴",
    timing: "",
    cost: "",
    range: "",
    initiative: 0,
    malice: 0,
    effect: "",
    brokenEffect: "",
    masterId: "",
    source: "",
    partId: "",
    broken: "",
    use: true,
  };
}

function sanitizePartType(v, fallback = "胴") {
  const s = String(v || "").trim();
  return s || fallback;
}

function buildSelectOptions(values, current) {
  const cur = String(current || "").trim();
  const list = values.includes(cur) || !cur ? values : [cur, ...values];
  return list
    .map(
      (v) =>
        `<option value="${escapeHtml(v)}" ${v === cur ? "selected" : ""}>${escapeHtml(v)}</option>`,
    )
    .join("");
}

function getManeuverStatusClass(status) {
  const s = String(status || "無事");
  if (s === "損傷") return "status-damaged";
  if (s === "使用") return "status-used";
  return "status-safe";
}

function isServantEnemy(enemy) {
  return String(enemy && enemy.class_type) === "サヴァント";
}

function normalizePartsByClass(enemy) {
  if (!enemy || !enemy.data) return;
  if (isServantEnemy(enemy)) return;

  const parts = Array.isArray(enemy.data.parts) ? enemy.data.parts : [];
  const base = parts[0] || {};
  const max = Number((base && base.max) || 1);
  const current = Number((base && base.current) || max || 1);
  enemy.data.parts = [
    {
      id: (base && base.id) || `part_${Date.now()}`,
      type: "胴",
      name: (base && base.name) || "本体",
      max,
      current,
      use: base && typeof base.use === "boolean" ? base.use : true,
    },
  ];
}

function createEnemyTemplate() {
  const id = String(Date.now());
  return {
    ID: id,
    author: getRememberedAuthor(),
    name: "",
    class_type: "サヴァント",
    is_public: true,
    memo: "",
    data: {
      parts: [],
      maneuvers: [createEmptyManeuver()],
    },
    icon_url: "",
    time: nowIsoLocal(),
  };
}

function getNextId() {
  const nums = state.enemies
    .map((e) => Number(e && e.ID))
    .filter((n) => Number.isFinite(n));
  if (!nums.length) return "1";
  return String(Math.max(...nums) + 1);
}

function normalizeEnemy(enemy) {
  if (!enemy || typeof enemy !== "object") return createEnemyTemplate();
  if (!enemy.data || typeof enemy.data !== "object") enemy.data = {};
  if (!CLASS_TYPES.includes(String(enemy.class_type || ""))) {
    enemy.class_type = "サヴァント";
  }
  // 旧版の initiative 構造は保持しない（行動値はマニューバ効果由来）
  if (enemy.data.initiative) delete enemy.data.initiative;
  if (!Array.isArray(enemy.data.parts)) enemy.data.parts = [];
  if (!Array.isArray(enemy.data.maneuvers)) enemy.data.maneuvers = [];

  enemy.data.parts = enemy.data.parts.map((p, i) => ({
    id: p && p.id ? p.id : `part_${i + 1}`,
    type: (p && p.type) || "",
    name: (p && p.name) || "",
    max: Number((p && p.max) || 0),
    current: Number((p && p.current) || 0),
    use: p && typeof p.use === "boolean" ? p.use : true,
  }));

  enemy.data.maneuvers = enemy.data.maneuvers.map((m, i) => {
    const status =
      m && typeof m.status === "string"
        ? m.status
        : m && m.use === false
          ? "損傷"
          : "無事";
    const normalizedName = String((m && (m.name || m.kindName)) || "");
    return {
      id: m && m.id ? m.id : `man_${i + 1}`,
      status,
      name: normalizedName,
      kindName: normalizedName,
      displayName: (m && (m.displayName || m.name || m.kindName)) || "",
      partType: sanitizePartType((m && (m.partType || m.partId)) || ""),
      timing: (m && m.timing) || "",
      cost: (m && m.cost) || "",
      range: (m && m.range) || "",
      initiative: Number((m && m.initiative) || 0),
      malice: Number((m && m.malice) || 0),
      effect: (m && m.effect) || "",
      brokenEffect: (m && (m.brokenEffect || m.broken)) || "",
      masterId: (m && m.masterId) || "",
      source: (m && m.source) || "",
      partId: (m && m.partId) || "",
      broken: (m && m.broken) || "",
      use: status !== "損傷",
    };
  });

  if (!enemy.data.maneuvers.length) {
    enemy.data.maneuvers = [createEmptyManeuver()];
  }

  normalizePartsByClass(enemy);

  return enemy;
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          q = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      q = true;
    } else if (c === ",") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

function parseManeuverCsv(text) {
  const lines = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (!lines.length) return new Map();
  const head = parseCsvLine(lines[0]);
  const idx = (name) => head.indexOf(name);

  const iName = idx("名称");
  const iPart = idx("部位");
  const iTiming = idx("タイミング");
  const iCost = idx("コスト");
  const iRange = idx("射程");
  const iEffect = idx("効果");
  const iInitiative = idx("行動値");
  const iMalice = idx("悪意");
  const iId = idx("ID");
  const iSource = idx("出典");

  const map = new Map();
  if (iName < 0) return map;
  for (let i = 1; i < lines.length; i += 1) {
    const row = parseCsvLine(lines[i]);
    const name = String(row[iName] || "").trim();
    if (!name) continue;
    map.set(name, {
      kindName: name,
      displayName: name,
      partType: String(row[iPart] || ""),
      timing: String(row[iTiming] || ""),
      cost: String(row[iCost] || ""),
      range: String(row[iRange] || ""),
      effect: String(row[iEffect] || ""),
      initiative: Number(row[iInitiative] || 0),
      malice: Number(row[iMalice] || 0),
      masterId: String(row[iId] || ""),
      source: String(row[iSource] || ""),
    });
  }
  return map;
}

function hasManeuverCsvHeader(text) {
  const head = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/, 1)[0];
  return head.includes("名称") && head.includes("タイミング");
}

async function readCsvTextWithEncodingFallback(res) {
  const buf = await res.arrayBuffer();

  const utf8Text = new TextDecoder("utf-8").decode(buf);
  if (hasManeuverCsvHeader(utf8Text)) {
    return utf8Text;
  }

  try {
    const sjisText = new TextDecoder("shift-jis").decode(buf);
    if (hasManeuverCsvHeader(sjisText)) {
      return sjisText;
    }
  } catch (_e) {
    // shift-jis 非対応環境では utf-8 の結果を使う
  }

  return utf8Text;
}

async function loadManeuverMaster() {
  if (state.maneuverMasterLoaded) return;
  const candidates = ["ネクロニカ_マニューバ.csv"];
  for (const p of candidates) {
    try {
      const res = await fetch(p, { cache: "force-cache" });
      if (!res.ok) continue;
      const text = await readCsvTextWithEncodingFallback(res);
      const parsed = parseManeuverCsv(text);
      if (parsed.size) {
        state.maneuverMasterMap = parsed;
        renderManeuverKindList();
        break;
      }
    } catch (_e) {
      // 次候補へ
    }
  }
  state.maneuverMasterLoaded = true;
}

function renderManeuverKindList() {
  if (!el.maneuverKindList) return;
  const names = [...state.maneuverMasterMap.keys()].sort((a, b) =>
    a.localeCompare(b, "ja"),
  );
  el.maneuverKindList.innerHTML = names
    .map((name) => `<option value="${escapeHtml(name)}"></option>`)
    .join("");
}

function ensurePartFromManeuver(enemy, maneuver) {
  if (!enemy || !enemy.data || !maneuver) return;
  if (!isServantEnemy(enemy)) {
    normalizePartsByClass(enemy);
    return;
  }

  const t = sanitizePartType(maneuver.partType, "");
  if (!t) return;
  const parts = enemy.data.parts || [];
  const exists = parts.some((p) => String(p && p.type) === t);
  if (exists) return;
  parts.push({
    id: `part_${Date.now()}`,
    type: t,
    name: t,
    max: 1,
    current: 1,
    use: true,
  });
  enemy.data.parts = parts;
}

function applyManeuverMasterRow(enemy, row, options = {}) {
  const key = String(
    row && row.name ? row.name : row && row.kindName ? row.kindName : "",
  ).trim();
  if (!key) return;
  const master = state.maneuverMasterMap.get(key);
  if (!master) return;
  const keepPartType = !!(options && options.keepPartType);
  // 補完結果は maneuvers 実データ(name/kindName)へ反映する
  row.name = master.kindName;
  row.kindName = master.kindName;
  row.displayName = row.name;
  row.partType = keepPartType
    ? sanitizePartType(row.partType || master.partType)
    : sanitizePartType(master.partType);
  row.timing = master.timing;
  row.cost = master.cost;
  row.range = master.range;
  row.effect = master.effect;
  row.initiative = Number(master.initiative || 0);
  row.malice = Number(master.malice || 0);
  row.masterId = master.masterId;
  row.source = master.source;
  ensurePartFromManeuver(enemy, row);
}

function pickPartTypeFromCommandLine(line, nameText = "") {
  const beforeName = String(line || "")
    .split("【")[0]
    .trim();
  const fromPrefix = sanitizePartType(beforeName, "");
  if (fromPrefix) return fromPrefix;

  const name = String(nameText || "").trim();
  const m = name.match(/[（(【\[]\s*(頭|腕|胴|脚)\s*[）)】\]]/);
  if (m && m[1]) return sanitizePartType(m[1], "");

  const m2 = name.match(/^(頭|腕|胴|脚)[：:・\s]/);
  if (m2 && m2[1]) return sanitizePartType(m2[1], "");

  return "";
}

function getSelectedEnemy() {
  return state.enemies.find((e) => e.ID === state.selectedId) || null;
}

function loadFromStorage() {
  const initial = createEnemyTemplate();
  state.enemies = [normalizeEnemy(initial)];
  state.selectedId = initial.ID;
}

function saveToStorage() {
  // DB保存へ置換予定。ローカル保存は廃止。
}

function renderEnemyList() {
  const q = state.search.trim().toLowerCase();
  const targets = state.enemies.filter((e) => {
    if (!e.is_public) return false;
    if (!q) return true;
    return (
      String(e.name || "")
        .toLowerCase()
        .includes(q) ||
      String(e.author || "")
        .toLowerCase()
        .includes(q)
    );
  });

  el.enemyList.innerHTML = "";
  if (!targets.length) {
    const li = document.createElement("li");
    li.textContent = "該当なし";
    el.enemyList.appendChild(li);
    return;
  }

  targets.forEach((enemy) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    if (enemy.ID === state.selectedId) button.classList.add("is-active");
    button.textContent = `${enemy.name || "(no name)"} / ${enemy.class_type || "未設定"}`;
    button.addEventListener("click", () => {
      state.selectedId = enemy.ID;
      renderAll();
    });
    li.appendChild(button);
    el.enemyList.appendChild(li);
  });
}

function fillForm(enemy) {
  if (!enemy) return;
  el.fields.id.value = enemy.ID || "";
  el.fields.author.value = enemy.author || "";
  el.fields.name.value = enemy.name || "";
  el.fields.classType.value = enemy.class_type || "";
  el.fields.iconUrl.value = enemy.icon_url || "";
  if (el.fields.isPublic) el.fields.isPublic.checked = !!enemy.is_public;
  if (el.fields.isPublicText)
    el.fields.isPublicText.textContent = enemy.is_public ? "公開" : "非公開";
  el.fields.time.value = enemy.time || "";
  if (el.fields.timeText)
    el.fields.timeText.textContent = formatDateTimeDisplay(enemy.time);
  el.fields.memo.value = enemy.memo || "";
}

function calcInitiativeTotal(enemy) {
  const base = 6 + (String(enemy && enemy.class_type) === "レギオン" ? 2 : 0);
  const maneuvers = (enemy && enemy.data && enemy.data.maneuvers) || [];
  const delta = maneuvers.reduce((acc, m) => {
    const n = Number((m && m.initiative) || 0);
    if (!Number.isFinite(n)) return acc;
    // 行動値増減仕様:
    // - 通常は 0
    // - 正の値は常に加算
    // - 負の値は「損傷」時のみ同値を加算（例: -1 -> +1）
    // - 負の値で「損傷」以外のときは 0 扱い
    if (n < 0) {
      if (m && m.status === "損傷") return acc + Math.abs(n);
      return acc;
    }
    if (n > 0) return acc + n;
    return acc;
  }, 0);
  // 既定値: 6 + IF(種別="レギオン",2,0)
  // その上にマニューバ由来の増減を加算する。
  return base + delta;
}

function calcMalice(enemy) {
  const rawRounded = calcMaliceRawRounded(enemy);
  return rawRounded < 0 ? 0 : rawRounded;
}

function calcMaliceRawRounded(enemy) {
  const maneuvers = (enemy && enemy.data && enemy.data.maneuvers) || [];
  const sumMalice = maneuvers.reduce(
    (acc, m) => acc + Number((m && m.malice) || 0),
    0,
  );
  const classType = String((enemy && enemy.class_type) || "");
  const classAdjust =
    classType === "サヴァント"
      ? 8
      : classType === "ホラー"
        ? 4
        : classType === "レギオン"
          ? 10 - calcInitiativeTotal(enemy)
          : 0;

  // スプレッドシート式:
  // =LET(悪意,ROUNDUP(合計悪意点-SWITCH(種類,"サヴァント",8,"ホラー",4,"レギオン",10-H831,0)),IF(悪意<0,0,悪意))
  const raw = sumMalice - classAdjust;
  const rounded = raw >= 0 ? Math.ceil(raw) : Math.floor(raw); // ROUNDUP 相当(0桁)
  return rounded;
}

function getMaliceToneClass(maliceValue) {
  const v = Number(maliceValue || 0);
  if (v >= 20) return "is-malice-5"; // 強すぎ: 真っ暗
  if (v >= 15) return "is-malice-4"; // 最強帯
  if (v >= 10) return "is-malice-3";
  if (v >= 6) return "is-malice-2";
  if (v >= 2) return "is-malice-1"; // 最低発光帯
  return "is-malice-0";
}

function renderCalculatedHeader(enemy) {
  if (!enemy) return;
  if (el.fields.initiative)
    el.fields.initiative.value = String(calcInitiativeTotal(enemy));
  if (el.fields.malice) {
    const rawMalice = calcMaliceRawRounded(enemy);
    const shownMalice = rawMalice < 0 ? 0 : rawMalice;
    el.fields.malice.value = String(shownMalice);
    if (rawMalice < 0) {
      el.fields.malice.title = `自動入力項目（マニューバ内容から計算） / 丸め前: ${rawMalice}`;
    } else {
      el.fields.malice.title = "自動入力項目（マニューバ内容から計算）";
    }
    el.fields.malice.classList.remove(
      "is-malice-0",
      "is-malice-1",
      "is-malice-2",
      "is-malice-3",
      "is-malice-4",
      "is-malice-5",
    );
    el.fields.malice.classList.add(getMaliceToneClass(shownMalice));
  }
}

function renderPartsTable(enemy) {
  if (!el.partsTableBody) return;
  const parts = (enemy && enemy.data && enemy.data.parts) || [];
  el.partsTableBody.innerHTML = "";
  parts.forEach((part, index) => {
    const partType = sanitizePartType((part && part.type) || "");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input class="use-check" data-kind="parts" data-index="${index}" data-key="use" type="checkbox" ${part.use ? "checked" : ""}></td>
      <td><input data-kind="parts" data-index="${index}" data-key="id" value="${escapeHtml(part.id || "")}"></td>
      <td><input data-kind="parts" data-index="${index}" data-key="type" list="partTypeList" value="${escapeHtml(partType)}"></td>
      <td><input data-kind="parts" data-index="${index}" data-key="name" value="${escapeHtml(part.name || "")}"></td>
      <td><input data-kind="parts" data-index="${index}" data-key="max" type="number" value="${Number(part.max || 0)}"></td>
      <td><input data-kind="parts" data-index="${index}" data-key="current" type="number" value="${Number(part.current || 0)}"></td>
      <td><button type="button" data-remove-kind="parts" data-index="${index}">削除</button></td>
    `;
    el.partsTableBody.appendChild(tr);
  });
}

function renderManeuversTable(enemy) {
  const table = document.getElementById("maneuversTable");
  if (table) {
    table.classList.toggle("hide-part-column", !isServantEnemy(enemy));
  }
  const maneuvers = (enemy && enemy.data && enemy.data.maneuvers) || [];
  el.maneuversTableBody.innerHTML = "";
  maneuvers.forEach((m, index) => {
    const statusValue = String((m && m.status) || "無事");
    const statusClass = getManeuverStatusClass(statusValue);
    const partType = sanitizePartType((m && m.partType) || "");
    const maliceValue = Number((m && m.malice) || 0);
    const isForbiddenMalice = maliceValue === 99;
    const partTypeOptions = buildSelectOptions(
      ["頭", "腕", "胴", "脚"],
      partType,
    );
    const timingOptions = buildSelectOptions(
      TIMING_OPTIONS,
      (m && m.timing) || "",
    );
    const tr = document.createElement("tr");
    tr.setAttribute("draggable", "true");
    tr.dataset.index = String(index);
    if (isForbiddenMalice) tr.classList.add("is-forbidden-maneuver");
    tr.innerHTML = `
      <td>
        <select class="status-select ${statusClass}" data-kind="maneuvers" data-index="${index}" data-key="status">
          <option value="無事" ${statusValue === "無事" ? "selected" : ""}>無事</option>
          <option value="使用" ${statusValue === "使用" ? "selected" : ""}>使用</option>
          <option value="損傷" ${statusValue === "損傷" ? "selected" : ""}>損傷</option>
        </select>
      </td>
      <td><input data-kind="maneuvers" data-index="${index}" data-key="name" value="${escapeHtml(m.name || m.kindName || "")}"></td>
      <td>
        <select data-kind="maneuvers" data-index="${index}" data-key="partType">
          ${partTypeOptions}
        </select>
      </td>
      <td>
        <select class="timing-select" data-kind="maneuvers" data-index="${index}" data-key="timing">
          ${timingOptions}
        </select>
      </td>
      <td><input data-kind="maneuvers" data-index="${index}" data-key="cost" list="maneuverCostList" value="${escapeHtml(m.cost || "")}"></td>
      <td><input class="range-input" data-kind="maneuvers" data-index="${index}" data-key="range" list="maneuverRangeList" value="${escapeHtml((m && m.range) || "")}"></td>
      <td><input data-kind="maneuvers" data-index="${index}" data-key="initiative" type="number" value="${Number(m.initiative || 0)}"></td>
      <td>
        <input data-kind="maneuvers" data-index="${index}" data-key="effect" value="${escapeHtml(m.effect || "")}">
        ${isForbiddenMalice ? '<div class="forbidden-note">※悪意99: エネミーに付与不可</div>' : ""}
      </td>
      <td><input data-kind="maneuvers" data-index="${index}" data-key="malice" type="number" min="0" value="${maliceValue}" title="${isForbiddenMalice ? "悪意99のマニューバはエネミーに付与できません" : ""}"></td>
      <td>
        <div class="row-action-wrap">
          <button type="button" class="delete-btn" data-remove-kind="maneuvers" data-index="${index}" title="削除" aria-label="削除">
            <i class="fa-solid fa-trash"></i>
          </button>
          <span class="drag-hint" aria-hidden="true" title="この行はドラッグで並べ替えできます">⠿</span>
        </div>
      </td>
    `;
    el.maneuversTableBody.appendChild(tr);
  });
}

function renderDataPreview(enemy) {
  if (!el.dataPreview) return;
  const data = (enemy && enemy.data) || { parts: [], maneuvers: [] };
  el.dataPreview.textContent = JSON.stringify(data, null, 2);
}

function partEmoji(type) {
  if (type === "頭") return "👧頭";
  if (type === "腕") return "💪腕";
  if (type === "胴") return "🧍胴";
  if (type === "脚") return "🦵脚";
  return "🟩その他";
}

function stateMark(entity) {
  if (!entity) return "⭕";
  if (entity.status === "無事") return "⭕";
  if (entity.status === "損傷") return "❌";
  if (entity.status === "使用") return "✅";
  return entity.use ? "⭕" : "✅";
}

function isDamageTriggeredEffectText(effectText) {
  const s = String(effectText || "");
  return /損傷(した|している|中|時|したとき|していたなら)|このパーツが損傷したとき|このパーツの損傷時/.test(
    s,
  );
}

function formatEffectWithTriggerHint(effectText) {
  const base = String(effectText || "").trim();
  if (!base) return "";
  if (!isDamageTriggeredEffectText(base)) return base;
  return `〔未発動 / 損傷時に発動〕${base}`;
}

function normalizeUserMemoText(rawMemo) {
  const raw = String(rawMemo || "").replace(/\r\n?/g, "\n");
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const lines = trimmed.split("\n");
  const iniIndex = lines.findIndex((l) => /初期行動値：/.test(String(l)));
  const legendIndex = lines.findIndex((l) =>
    /無事：⭕、使用：✅、損傷：❌/.test(String(l)),
  );

  // 既存のコマメモ全文を再取込した場合は、自由記述メモ部分だけを抽出して二重化を防ぐ
  if (iniIndex >= 0 && legendIndex > iniIndex) {
    const mid = lines
      .slice(iniIndex + 1, legendIndex)
      .join("\n")
      .trim();
    if (!mid || /^\/\/ここに解説\s*$/u.test(mid)) return "";
    return mid;
  }

  return trimmed;
}

function getPartStatusText(enemy) {
  const list = buildKomaStatus(enemy);
  if (!Array.isArray(list) || !list.length) return "残存パーツ --/--";
  if (list.length === 1) {
    const row = list[0] || {};
    return `残存パーツ ${Number(row.value || 0)}/${Number(row.max || 0)}`;
  }
  const now = list.reduce(
    (sum, row) => sum + Number((row && row.value) || 0),
    0,
  );
  const max = list.reduce((sum, row) => sum + Number((row && row.max) || 0), 0);
  return `残存パーツ ${now}/${max}`;
}

function getPartStatusItems(enemy) {
  const list = buildKomaStatus(enemy);
  if (!Array.isArray(list) || !list.length) {
    return [];
  }
  return list.map((row) => {
    const value = Number((row && row.value) || 0);
    const max = Number((row && row.max) || 0);
    const ratio = max > 0 ? value / max : 0;
    return {
      label: String((row && row.label) || "全体"),
      value,
      max,
      ratio,
    };
  });
}

function renderPartsStatusPanel(enemy) {
  if (!el.partsStatusPanel) return;
  if (!enemy) {
    el.partsStatusPanel.innerHTML =
      '<span class="parts-status-total">残存パーツ --/--</span>';
    return;
  }

  const total = getPartStatusText(enemy);
  if (!isServantEnemy(enemy)) {
    el.partsStatusPanel.innerHTML = `<span class="parts-status-total">${escapeHtml(total)}</span>`;
    return;
  }

  const items = getPartStatusItems(enemy);
  const chipsHtml = items
    .map((item) => {
      const ratioClass =
        item.ratio >= 0.7
          ? "is-safe"
          : item.ratio >= 0.35
            ? "is-caution"
            : "is-danger";
      return `<span class="parts-chip ${ratioClass}"><span class="parts-chip-label">${escapeHtml(item.label)}</span><span class="parts-chip-value">${item.value}/${item.max}</span></span>`;
    })
    .join("");

  el.partsStatusPanel.innerHTML = `<span class="parts-status-total">${escapeHtml(total)}</span><span class="parts-chip-list">${chipsHtml}</span>`;
}

function renderMemoPreview(enemy) {
  if (!el.memoPreview) return;
  if (!enemy) {
    el.memoPreview.textContent = "---";
    renderPartsStatusPanel(null);
    return;
  }
  el.memoPreview.textContent = buildKomaMemo(enemy);
  renderPartsStatusPanel(enemy);
}

function hasManeuverName(m) {
  const shownName = String(
    (m && (m.name || m.kindName || m.displayName)) || "",
  ).trim();
  return shownName.length > 0;
}

function buildKomaStatus(enemy) {
  const maneuvers = (
    (enemy && enemy.data && enemy.data.maneuvers) ||
    []
  ).filter(hasManeuverName);
  if (isServantEnemy(enemy)) {
    return PART_TYPES.map((p) => {
      const list = maneuvers.filter(
        (m) => sanitizePartType(m && m.partType, "") === p,
      );
      const max = list.length;
      const value = list.filter(
        (m) => String((m && m.status) || "無事") !== "損傷",
      ).length;
      return { label: p, value, max };
    }).filter((x) => x.max > 0);
  }
  const max = maneuvers.length;
  const value = maneuvers.filter(
    (m) => String((m && m.status) || "無事") !== "損傷",
  ).length;
  return [{ label: "パーツ", value, max }];
}

function buildKomaCommands(enemy) {
  const iniTotal = calcInitiativeTotal(enemy);
  const lines = [
    "NC+2 行動判定",
    "NC+1 行動判定",
    "NC 行動判定",
    "NC-1 行動判定",
    "NC-2 行動判定",
    "",
    "NA+2 攻撃判定",
    "NA+1 攻撃判定",
    "NA 攻撃判定",
    "",
    "◆行動値操作",
    ":initiative-1",
    ":initiative-2",
    ":initiative-3",
    `:initiative=${iniTotal}`,
    "🟩【マニューバ名】《タイミング / コスト / 射程》効果 ",
  ];

  const maneuvers = (enemy && enemy.data && enemy.data.maneuvers) || [];
  let currentPart = "";
  maneuvers.forEach((m) => {
    const part = sanitizePartType((m && m.partType) || "", "");
    if (isServantEnemy(enemy) && part && part !== currentPart) {
      lines.push(partEmoji(part));
      currentPart = part;
    }
    const shownName = (m && (m.name || m.kindName || m.displayName)) || "";
    const effectText = formatEffectWithTriggerHint((m && m.effect) || "");
    lines.push(
      `【${shownName}】《${(m && m.timing) || ""}/${(m && m.cost) || ""}/${(m && m.range) || ""}》${effectText}`,
    );
  });
  return lines.join("\n");
}

function buildKomaMemo(enemy) {
  const iniTotal = calcInitiativeTotal(enemy);
  const userMemo = normalizeUserMemoText(enemy && enemy.memo);
  const lines = [
    "───",
    `初期行動値：${iniTotal}`,
    userMemo || "//ここに解説",
    "",
    "無事：⭕、使用：✅、損傷：❌",
    isServantEnemy(enemy)
      ? "🟩【マニューバ名】《タイミング / コスト / 射程》"
      : "🟩【マニューバ名】 《タイミング / コスト / 射程》",
  ];

  const maneuvers = (
    (enemy && enemy.data && enemy.data.maneuvers) ||
    []
  ).filter(hasManeuverName);
  let currentPart = "";
  maneuvers.forEach((m) => {
    const part = sanitizePartType((m && m.partType) || "", "");
    if (isServantEnemy(enemy) && part && part !== currentPart) {
      lines.push(partEmoji(part));
      currentPart = part;
    }
    const effectText = formatEffectWithTriggerHint((m && m.effect) || "");
    lines.push(
      `${stateMark(m)}【${(m && (m.name || m.kindName || m.displayName)) || ""}】《${(m && m.timing) || ""}/${(m && m.cost) || ""}/${(m && m.range) || ""}》${effectText}`,
    );
  });
  return lines.join("\n");
}

function buildKomaCharacterJson(enemy) {
  return {
    kind: "character",
    data: {
      name: String((enemy && enemy.name) || ""),
      memo: buildKomaMemo(enemy),
      initiative: calcInitiativeTotal(enemy),
      iconUrl: String((enemy && enemy.icon_url) || ""),
      commands: buildKomaCommands(enemy),
      status: buildKomaStatus(enemy),
    },
  };
}

function importFromKomaJson(enemy, src) {
  const data = src && src.data ? src.data : {};
  enemy.name = String(data.name || enemy.name || "").trim();
  enemy.icon_url = String(data.iconUrl || enemy.icon_url || "").trim();
  if (typeof data.memo === "string" && data.memo.trim()) {
    enemy.memo = normalizeUserMemoText(data.memo);
  }

  const statusList = Array.isArray(data.status) ? data.status : [];
  const hasServantParts = statusList.some((s) =>
    PART_TYPES.includes(String(s && s.label)),
  );
  if (hasServantParts) {
    enemy.class_type = "サヴァント";
  }

  const cmd = String(data.commands || "");
  const rows = [];
  let currentPart = "";
  cmd.split(/\r?\n/).forEach((lineRaw) => {
    const line = String(lineRaw || "").trim();
    if (!line) return;
    if (line.startsWith("👧")) {
      currentPart = "頭";
      return;
    }
    if (line.startsWith("💪")) {
      currentPart = "腕";
      return;
    }
    if (line.startsWith("🧍")) {
      currentPart = "胴";
      return;
    }
    if (line.startsWith("🦵")) {
      currentPart = "脚";
      return;
    }
    const m = line.match(/^【(.+?)】《([^/]*)\/([^/]*)\/([^》]*)》\s*(.*)$/);
    if (!m) return;
    const row = createEmptyManeuver();
    const inlinePartType = pickPartTypeFromCommandLine(line, m[1]);
    const importedPartType = sanitizePartType(
      inlinePartType || currentPart || "",
      "",
    );
    const hasImportedPartType = !!importedPartType;
    row.name = String(m[1] || "").trim();
    row.kindName = row.name;
    row.displayName = row.name;
    row.timing = String(m[2] || "").trim();
    row.cost = String(m[3] || "").trim();
    row.range = String(m[4] || "").trim();
    row.effect = String(m[5] || "").trim();
    row.partType = sanitizePartType(importedPartType || row.partType);
    applyManeuverMasterRow(enemy, row, {
      keepPartType: hasImportedPartType,
    });
    // CSV補完後に、取込元の明示値を優先
    row.timing = String(m[2] || row.timing || "").trim();
    row.cost = String(m[3] || row.cost || "").trim();
    row.range = String(m[4] || row.range || "").trim();
    row.effect = String(m[5] || row.effect || "").trim();
    rows.push(row);
  });

  if (rows.length) {
    enemy.data.maneuvers = rows;
  }
  normalizePartsByClass(enemy);
}

function renderAll() {
  const enemy = getSelectedEnemy();
  renderEnemyList();
  fillForm(enemy);
  renderManeuversTable(enemy);
  renderCalculatedHeader(enemy);
  renderDataPreview(enemy);
  renderMemoPreview(enemy);
}

function appendBasicManeuvers(enemy) {
  if (!enemy || !enemy.data) return;
  if (!Array.isArray(enemy.data.maneuvers)) enemy.data.maneuvers = [];

  BASIC_MANEUVERS_TEMPLATE.forEach((p) => {
    const row = createEmptyManeuver();
    row.partType = p.type;
    row.name = p.name;
    row.kindName = p.name;
    row.displayName = p.name;
    applyManeuverMasterRow(enemy, row);
    ensurePartFromManeuver(enemy, row);
    enemy.data.maneuvers.push(row);
  });
}

function upsertCurrentEnemyFromForm() {
  const current = getSelectedEnemy();
  if (!current) return;
  current.ID = el.fields.id.value.trim();
  if (!current.ID) {
    current.ID = getNextId();
    el.fields.id.value = current.ID;
  }
  current.author = el.fields.author.value.trim();
  rememberAuthor(current.author);
  current.name = el.fields.name.value.trim();
  current.class_type = el.fields.classType.value.trim();
  current.icon_url = el.fields.iconUrl.value.trim();
  current.is_public = !!(el.fields.isPublic && el.fields.isPublic.checked);
  if (el.fields.isPublicText)
    el.fields.isPublicText.textContent = current.is_public ? "公開" : "非公開";
  current.memo = el.fields.memo.value;
  if (!current.data || typeof current.data !== "object") current.data = {};
  normalizePartsByClass(current);
  if (current.data.initiative) delete current.data.initiative;
  current.time = nowIsoLocal();
  el.fields.time.value = current.time;
  if (el.fields.timeText)
    el.fields.timeText.textContent = formatDateTimeDisplay(current.time);
  state.selectedId = current.ID;
}

function bindTableEvents() {
  const handleTableValueChange = (event) => {
    const target = event.target;
    if (
      !(target instanceof HTMLInputElement) &&
      !(target instanceof HTMLSelectElement)
    )
      return;
    const kind = target.dataset.kind;
    const index = Number(target.dataset.index);
    const key = target.dataset.key;
    if (!kind || Number.isNaN(index) || !key) return;

    const enemy = getSelectedEnemy();
    if (!enemy || !enemy.data || !Array.isArray(enemy.data[kind])) return;
    const row = enemy.data[kind][index];
    if (!row) return;

    row[key] =
      target.type === "number"
        ? Number(target.value || 0)
        : target.type === "checkbox"
          ? target.checked
          : target.value;
    if (kind === "maneuvers" && key === "status") {
      row.use = row.status !== "損傷";
      target.classList.remove("status-safe", "status-used", "status-damaged");
      target.classList.add(getManeuverStatusClass(row.status));
    }
    if (kind === "maneuvers" && key === "partType") {
      row.partType = sanitizePartType(row.partType);
      ensurePartFromManeuver(enemy, row);
    }
    if (kind === "maneuvers" && key === "name") {
      row.kindName = row.name;
      if (event.type === "change") {
        let complemented = false;
        const inputName = String(row.name || "").trim();
        if (inputName) {
          const exact = state.maneuverMasterMap.get(inputName);
          if (exact) {
            applyManeuverMasterRow(enemy, row);
            target.value = row.name || row.kindName || "";
            complemented = true;
          } else {
            const candidates = [...state.maneuverMasterMap.keys()]
              .filter((k) => String(k).startsWith(inputName))
              .sort((a, b) => a.localeCompare(b, "ja"));
            if (candidates.length === 1) {
              row.name = candidates[0];
              row.kindName = candidates[0];
              applyManeuverMasterRow(enemy, row);
              target.value = row.name || row.kindName || "";
              complemented = true;
            }
          }
        }
        if (complemented) {
          renderManeuversTable(enemy);
        }
      }
    }
    if (kind === "maneuvers" && key === "malice") {
      renderManeuversTable(enemy);
    }
    if (kind === "parts" && key === "type") {
      row.type = sanitizePartType(row.type);
    }
    enemy.time = nowIsoLocal();
    el.fields.time.value = enemy.time;
    if (el.fields.timeText)
      el.fields.timeText.textContent = formatDateTimeDisplay(enemy.time);
    renderCalculatedHeader(enemy);
    renderDataPreview(enemy);
    renderMemoPreview(enemy);
  };

  document.addEventListener("input", handleTableValueChange);
  document.addEventListener("change", handleTableValueChange);

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const kind = target.getAttribute("data-remove-kind");
    const index = Number(target.getAttribute("data-index"));
    if (!kind || Number.isNaN(index)) return;

    const enemy = getSelectedEnemy();
    if (!enemy || !enemy.data || !Array.isArray(enemy.data[kind])) return;
    enemy.data[kind].splice(index, 1);
    enemy.time = nowIsoLocal();
    saveToStorage();
    renderAll();
  });

  let draggingIndex = -1;
  document.addEventListener("dragstart", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const tr = target.closest("#maneuversTable tbody tr");
    if (!tr) return;
    draggingIndex = Number(tr.dataset.index);
    if (Number.isNaN(draggingIndex)) return;
    tr.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(draggingIndex));
    }
  });

  document.addEventListener("dragover", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const tr = target.closest("#maneuversTable tbody tr");
    if (!tr) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  });

  document.addEventListener("drop", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const tr = target.closest("#maneuversTable tbody tr");
    if (!tr) return;
    event.preventDefault();

    const toIndex = Number(tr.dataset.index);
    if (
      Number.isNaN(draggingIndex) ||
      Number.isNaN(toIndex) ||
      draggingIndex < 0 ||
      draggingIndex === toIndex
    )
      return;

    const enemy = getSelectedEnemy();
    if (!enemy || !enemy.data || !Array.isArray(enemy.data.maneuvers)) return;

    const rows = enemy.data.maneuvers;
    const [moved] = rows.splice(draggingIndex, 1);
    if (!moved) return;
    rows.splice(toIndex, 0, moved);

    enemy.time = nowIsoLocal();
    saveToStorage();
    renderAll();
    draggingIndex = -1;
  });

  document.addEventListener("dragend", () => {
    draggingIndex = -1;
    document
      .querySelectorAll("#maneuversTable tbody tr.is-dragging")
      .forEach((row) => row.classList.remove("is-dragging"));
  });
}

function escapeHtml(v) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setupEvents() {
  if (el.fields.author) {
    const remembered = getRememberedAuthor();
    if (remembered && !el.fields.author.value) {
      el.fields.author.value = remembered;
    }
  }

  el.enemySearchInput.addEventListener("input", () => {
    state.search = el.enemySearchInput.value || "";
    renderEnemyList();
  });

  if (el.saveEnemyButton) {
    el.saveEnemyButton.addEventListener("click", () => {
      upsertCurrentEnemyFromForm();
      saveToStorage();
      renderAll();
    });
  }

  if (el.exportJsonButton) {
    el.exportJsonButton.addEventListener("click", () => {
      upsertCurrentEnemyFromForm();
      const enemy = getSelectedEnemy();
      if (!enemy) return;
      const pretty = JSON.stringify(enemy, null, 2);
      navigator.clipboard
        .writeText(pretty)
        .then(() => {
          alert("選択中エネミーJSONをクリップボードへコピーした");
        })
        .catch(() => {
          alert("コピー失敗。コンソールに出力する");
          console.log(pretty);
        });
    });
  }

  if (el.exportKomaJsonButton) {
    el.exportKomaJsonButton.addEventListener("click", () => {
      upsertCurrentEnemyFromForm();
      const enemy = getSelectedEnemy();
      if (!enemy) return;
      const out = buildKomaCharacterJson(enemy);
      const pretty = JSON.stringify(out, null, 0);
      navigator.clipboard
        .writeText(pretty)
        .then(() => {
          alert("ココフォリア駒データをコピーした");
        })
        .catch(() => {
          alert("コピー失敗。コンソールに出力する");
          console.log(pretty);
        });
    });
  }

  if (el.copyMemoPreviewButton) {
    el.copyMemoPreviewButton.addEventListener("click", () => {
      upsertCurrentEnemyFromForm();
      const enemy = getSelectedEnemy();
      if (!enemy) return;
      const text = buildKomaMemo(enemy);
      navigator.clipboard
        .writeText(text)
        .then(() => {
          alert("コマメモをコピーした");
        })
        .catch(() => {
          alert("コピー失敗。コンソールに出力する");
          console.log(text);
        });
    });
  }

  if (el.importKomaJsonButton || el.komaJsonInput) {
    const runKomaJsonImport = (rawSource = null) => {
      const enemy = getSelectedEnemy();
      if (!enemy) return false;
      const raw = String(
        rawSource != null
          ? rawSource
          : (el.komaJsonInput && el.komaJsonInput.value) || "",
      ).trim();
      if (!raw) return false;
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.kind !== "character" || !parsed.data) {
          alert("コマJSON形式ではありません");
          return false;
        }
        importFromKomaJson(enemy, parsed);
        enemy.time = nowIsoLocal();
        saveToStorage();
        renderAll();
        return true;
      } catch (_e) {
        alert("JSONの解析に失敗しました");
        return false;
      }
    };

    if (el.importKomaJsonButton) {
      el.importKomaJsonButton.addEventListener("click", () => {
        runKomaJsonImport();
      });
    }

    if (el.komaJsonInput) {
      el.komaJsonInput.addEventListener("paste", (event) => {
        const pasted =
          (event.clipboardData && event.clipboardData.getData("text")) || "";
        if (!pasted) return;
        event.preventDefault();
        el.komaJsonInput.value = pasted;
        runKomaJsonImport(pasted);
      });

      el.komaJsonInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        runKomaJsonImport();
      });
    }
  }

  if (el.addManeuverButton) {
    el.addManeuverButton.addEventListener("click", () => {
      const enemy = getSelectedEnemy();
      if (!enemy) return;
      enemy.data.maneuvers.push(createEmptyManeuver());
      enemy.time = nowIsoLocal();
      saveToStorage();
      renderAll();
    });
  }

  if (el.addBasicManeuversButton) {
    el.addBasicManeuversButton.addEventListener("click", () => {
      const enemy = getSelectedEnemy();
      if (!enemy) return;
      appendBasicManeuvers(enemy);
      enemy.time = nowIsoLocal();
      saveToStorage();
      renderAll();
    });
  }

  el.enemyEditorForm.addEventListener("input", () => {
    const enemy = getSelectedEnemy();
    if (!enemy) return;
    upsertCurrentEnemyFromForm();
    if (document.activeElement === el.fields.classType) {
      renderManeuversTable(enemy);
    }
    renderCalculatedHeader(enemy);
    renderDataPreview(enemy);
    renderMemoPreview(enemy);
    renderEnemyList();
  });

  if (el.fields.classType) {
    el.fields.classType.addEventListener("change", () => {
      const enemy = getSelectedEnemy();
      if (!enemy) return;
      upsertCurrentEnemyFromForm();
      renderManeuversTable(enemy);
      renderCalculatedHeader(enemy);
      renderDataPreview(enemy);
      renderMemoPreview(enemy);
      renderEnemyList();
    });
  }

  bindTableEvents();
}

async function boot() {
  loadFromStorage();
  await loadManeuverMaster();
  setupEvents();
  renderAll();
}

document.addEventListener("DOMContentLoaded", boot);

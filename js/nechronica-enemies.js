const state = {
  enemies: [],
  selectedId: null,
  search: "",
  maneuverMasterMap: new Map(),
  maneuverMasterLoaded: false,
  enemySortKey: "time",
  enemySortDir: "desc",
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
const NC_AUTHOR_STORAGE_KEY = "nechronicaEnemiesAuthor";
const NC_API_STORAGE_KEY = "nechronicaEnemiesApiUrl";
const NC_LAST_SELECTED_ID_KEY = "nechronicaEnemiesLastSelectedId";
const DEFAULT_NECHRONICA_GAS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxMR7f_pOi14SsAuKvu7YxKVBQZ69dn-TeQpMBxyYzo_pwZmICNZ06cSb8BKQYCM0GuGg/exec";
let saveDebounceTimer = null;
let saveRequestInFlight = false;
let secondaryRenderDebounceTimer = null;
let hasUnsavedChanges = false;
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
  newEnemyButton: document.getElementById("newEnemyButton"),
  reloadEnemyListButton: document.getElementById("reloadEnemyListButton"),
  saveStatusText: document.getElementById("saveStatusText"),
  sortByMaliceButton: document.getElementById("sortByMaliceButton"),
  sortByInitiativeButton: document.getElementById("sortByInitiativeButton"),
  sortByAuthorButton: document.getElementById("sortByAuthorButton"),
  sortByIdButton: document.getElementById("sortByIdButton"),
  sortByTimeButton: document.getElementById("sortByTimeButton"),
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
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${min}:${s}`;
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

function getConfiguredNechronicaApiUrl() {
  const params = new URLSearchParams(window.location.search);
  const apiFromQuery = params.get("ncApi") || params.get("gasApi");
  if (apiFromQuery) {
    try {
      localStorage.setItem(NC_API_STORAGE_KEY, apiFromQuery);
    } catch (_e) {
      // ignore
    }
    return String(apiFromQuery).trim();
  }
  try {
    const fromStorage = localStorage.getItem(NC_API_STORAGE_KEY) || "";
    const trimmed = String(fromStorage).trim();
    if (trimmed) return trimmed;
  } catch (_e) {
    // ignore
  }
  return DEFAULT_NECHRONICA_GAS_WEB_APP_URL;
}

function normalizeApiUrl(url) {
  return String(url || "").replace(/\/+$/, "");
}

function buildApiUrl(action, params = {}) {
  const base = normalizeApiUrl(getConfiguredNechronicaApiUrl());
  if (!base) throw new Error("API URLが未設定");
  const url = new URL(base);
  url.searchParams.set("tool", "nechronica");
  url.searchParams.set("action", action);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v == null) return;
    const s = String(v).trim();
    if (!s) return;
    url.searchParams.set(k, s);
  });
  return url.toString();
}

async function fetchApiJson(url, init = null) {
  const res = await fetch(url, init || undefined);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      data && data.message ? data.message : `APIエラー (HTTP ${res.status})`;
    throw new Error(msg);
  }
  if (!data || data.status === "error") {
    throw new Error((data && data.message) || "API応答が不正");
  }
  return data;
}

function scheduleSaveToDb(delayMs = 600) {
  void delayMs;
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }
  if (!hasUnsavedChanges) {
    hasUnsavedChanges = true;
  }
  setSaveStatus("idle", "未保存の変更あり");
}

function clearUnsavedChanges() {
  hasUnsavedChanges = false;
  setSaveStatus("idle", "");
}

function scheduleSecondaryRenders(options = {}) {
  const { includeList = false, delayMs = 120 } = options;
  const selectedIdAtSchedule = state.selectedId;
  if (secondaryRenderDebounceTimer) {
    clearTimeout(secondaryRenderDebounceTimer);
  }
  secondaryRenderDebounceTimer = setTimeout(() => {
    secondaryRenderDebounceTimer = null;
    // 選択中が変わった場合は renderAll 側の描画を優先
    if (selectedIdAtSchedule !== state.selectedId) return;
    const enemy = getSelectedEnemy();
    if (!enemy) return;
    renderDataPreview(enemy);
    renderMemoPreview(enemy);
    if (includeList) {
      renderEnemyList();
    }
  }, delayMs);
}

function setSaveStatus(kind, text) {
  if (!el.saveStatusText) return;
  el.saveStatusText.textContent = String(text || "");
  el.saveStatusText.classList.remove(
    "is-idle",
    "is-saving",
    "is-ok",
    "is-error",
  );
  if (kind === "saving") {
    el.saveStatusText.classList.add("is-saving");
  } else if (kind === "ok") {
    el.saveStatusText.classList.add("is-ok");
  } else if (kind === "error") {
    el.saveStatusText.classList.add("is-error");
  } else {
    el.saveStatusText.classList.add("is-idle");
  }
}

function formatDateTimeDisplay(isoLike) {
  const raw = String(isoLike || "").trim();
  if (raw) {
    const alreadyFormatted = raw.match(
      /^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
    );
    if (alreadyFormatted) {
      return `${alreadyFormatted[1]}/${alreadyFormatted[2]}/${alreadyFormatted[3]} ${alreadyFormatted[4]}:${alreadyFormatted[5]}:${alreadyFormatted[6]}`;
    }

    const isoLikeMatch = raw.match(
      /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/,
    );
    if (isoLikeMatch) {
      return `${isoLikeMatch[1]}/${isoLikeMatch[2]}/${isoLikeMatch[3]} ${isoLikeMatch[4]}:${isoLikeMatch[5]}:${isoLikeMatch[6]}`;
    }
  }

  const d = raw ? new Date(raw) : new Date();
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${min}:${s}`;
}

function createEmptyManeuver() {
  return {
    id: `man_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
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
  const id = getNextId();
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

function isSequentialEnemyId(idLike) {
  const s = String(idLike || "").trim();
  if (!/^\d+$/.test(s)) return false;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 && n < 1000000000000;
}

function getNextId() {
  const nums = state.enemies
    .map((e) => String((e && e.ID) || "").trim())
    .filter((id) => isSequentialEnemyId(id))
    .map((id) => Number(id))
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

function isNoNameServantPlaceholder(enemy) {
  if (!enemy) return false;
  const classType = String(enemy.class_type || "").trim();
  if (classType !== "サヴァント") return false;
  const name = String(enemy.name || "")
    .trim()
    .toLowerCase();
  return !name || name === "(no name)";
}

function getEnemySortValue(enemy, key) {
  if (key === "author") {
    return String((enemy && enemy.author) || "").toLowerCase();
  }
  if (key === "id") {
    const idNum = Number(String((enemy && enemy.ID) || "").trim());
    return Number.isFinite(idNum) ? idNum : Number.NEGATIVE_INFINITY;
  }
  if (key === "time") {
    return String((enemy && enemy.time) || "").trim();
  }
  if (key === "initiative") {
    const v = Number(calcInitiativeTotal(enemy));
    return Number.isFinite(v) ? v : Number.NEGATIVE_INFINITY;
  }
  const malice = Number(calcMalice(enemy));
  return Number.isFinite(malice) ? malice : Number.NEGATIVE_INFINITY;
}

function sortEnemies(list) {
  const key = state.enemySortKey || "malice";
  const dir = state.enemySortDir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const av = getEnemySortValue(a, key);
    const bv = getEnemySortValue(b, key);
    if (typeof av === "string" && typeof bv === "string") {
      const c = av.localeCompare(bv, "ja");
      if (c !== 0) return c * dir;
    } else {
      const c = Number(av) - Number(bv);
      if (c !== 0) return c * dir;
    }
    return String((a && a.name) || "").localeCompare(
      String((b && b.name) || ""),
      "ja",
    );
  });
}

function updateEnemySortButtons() {
  const map = [
    [el.sortByMaliceButton, "malice", "悪意"],
    [el.sortByInitiativeButton, "initiative", "行動値"],
    [el.sortByAuthorButton, "author", "作者"],
    [el.sortByIdButton, "id", "ID順"],
    [el.sortByTimeButton, "time", "更新順"],
  ];
  map.forEach(([btn, key, label]) => {
    if (!btn) return;
    const active = state.enemySortKey === key;
    btn.classList.toggle("is-active", active);
    const arrow = active ? (state.enemySortDir === "asc" ? "↑" : "↓") : "";
    btn.textContent = `${label}${arrow}`;
  });
}

function setEnemySort(key) {
  if (!key) return;
  if (state.enemySortKey === key) {
    state.enemySortDir = state.enemySortDir === "asc" ? "desc" : "asc";
  } else {
    state.enemySortKey = key;
    state.enemySortDir = key === "author" || key === "id" ? "asc" : "desc";
  }
  renderEnemyList();
}

async function loadFromStorage() {
  const author = getRememberedAuthor();
  try {
    const url = buildApiUrl("listNechronicaEnemies", { author });
    const response = await fetchApiJson(url);
    const list = Array.isArray(response.data) ? response.data : [];
    if (list.length) {
      state.enemies = list
        .map((row) => normalizeEnemy(row))
        .filter((enemy) => !isNoNameServantPlaceholder(enemy));
      if (!state.enemies.length) {
        const initial = createEnemyTemplate();
        state.enemies = [normalizeEnemy(initial)];
        state.selectedId = initial.ID;
        return;
      }
      if (
        !state.selectedId ||
        !state.enemies.some((e) => e.ID === state.selectedId)
      ) {
        state.selectedId = null;
      }
      clearUnsavedChanges();
      return;
    }
  } catch (error) {
    console.warn("[nechronica] DB一覧取得失敗:", error);
  }

  const initial = createEnemyTemplate();
  state.enemies = [normalizeEnemy(initial)];
  state.selectedId = initial.ID;
  clearUnsavedChanges();
}

function saveToStorage() {
  const enemy = getSelectedEnemy();
  if (!enemy || saveRequestInFlight) return;
  setSaveStatus("saving", "保存中…");
  console.info(
    "[nechronica] DB保存開始",
    enemy && enemy.ID ? `ID=${enemy.ID}` : "new",
  );
  saveRequestInFlight = true;
  const payload = normalizeEnemy(JSON.parse(JSON.stringify(enemy)));
  fetchApiJson(buildApiUrl("saveNechronicaEnemy"), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      tool: "nechronica",
      action: "saveNechronicaEnemy",
      author: getRememberedAuthor(),
      enemy: payload,
    }),
  })
    .then((response) => {
      const saved = response && response.data ? response.data : null;
      if (!saved) return;
      const current = getSelectedEnemy();
      if (!current) return;
      if (saved.ID) {
        current.ID = String(saved.ID);
        el.fields.id.value = current.ID;
      }
      if (saved.time) {
        current.time = String(saved.time);
        el.fields.time.value = current.time;
        if (el.fields.timeText) {
          el.fields.timeText.textContent = formatDateTimeDisplay(current.time);
        }
      }
      setSaveStatus(
        "ok",
        `保存完了 ${formatDateTimeDisplay((saved && saved.time) || nowIsoLocal())}`,
      );
      hasUnsavedChanges = false;
      console.info(
        "[nechronica] DB保存成功",
        saved && saved.ID ? `ID=${saved.ID}` : "",
      );
    })
    .catch((error) => {
      console.warn("[nechronica] DB保存失敗:", error);
      setSaveStatus(
        "error",
        `保存失敗: ${error && error.message ? error.message : "通信エラー"}`,
      );
    })
    .finally(() => {
      saveRequestInFlight = false;
    });
}

function renderEnemyList() {
  const q = state.search.trim().toLowerCase();
  const myAuthor = getRememberedAuthor();
  const targets = state.enemies.filter((e) => {
    if (isNoNameServantPlaceholder(e)) return false;
    const isMine = myAuthor && String(e.author || "") === String(myAuthor);
    if (!e.is_public && !isMine) return false;
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

  const sortedTargets = sortEnemies(targets);
  el.enemyList.innerHTML = "";
  updateEnemySortButtons();
  if (!sortedTargets.length) {
    const li = document.createElement("li");
    li.textContent = "該当なし";
    el.enemyList.appendChild(li);
    return;
  }

  sortedTargets.forEach((enemy) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.classList.add("enemy-list-card");
    if (enemy.ID === state.selectedId) button.classList.add("is-active");
    const nameText = String(enemy.name || "(no name)");
    const classText = String(enemy.class_type || "未設定");
    const classBgClass =
      classText === "サヴァント"
        ? "is-class-servant"
        : classText === "ホラー"
          ? "is-class-horror"
          : classText === "レギオン"
            ? "is-class-region"
            : "";
    if (classBgClass) {
      button.classList.add(classBgClass);
    }
    const authorText = String(enemy.author || "-");
    const maliceValue = calcMalice(enemy);
    const maliceBadgeClass = getMaliceBadgeClass(maliceValue);
    const initiativeValue = Number(calcInitiativeTotal(enemy));
    const showInitiative = Number.isFinite(initiativeValue);
    const iconUrl = String(enemy.icon_url || "").trim();
    button.innerHTML = `
      <span class="enemy-list-row enemy-list-row-main">
        <span class="enemy-malice-badge ${maliceBadgeClass}" title="悪意点">
          <span class="label">悪意</span>
          <span class="value">${escapeHtml(maliceValue)}</span>
        </span>
        <span class="enemy-list-icon-wrap">
          ${
            iconUrl
              ? `<img class="enemy-list-icon" src="${escapeHtml(iconUrl)}" alt="${escapeHtml(nameText)}">`
              : `<span class="enemy-list-icon enemy-list-icon-placeholder" aria-hidden="true">👤</span>`
          }
        </span>
        <span class="enemy-list-main-text ${classBgClass}">
          <span class="enemy-list-name-row">
            <span class="enemy-list-name">${escapeHtml(nameText)}</span>
            ${
              showInitiative
                ? `<span class="enemy-meta-chip enemy-meta-inline">行動値 ${escapeHtml(initiativeValue)}</span>`
                : ""
            }
            <span class="enemy-meta-chip enemy-meta-inline">作者 ${escapeHtml(authorText)}</span>
          </span>
          <span class="enemy-list-class">${escapeHtml(classText)}</span>
        </span>
      </span>
    `;
    button.addEventListener("click", () => {
      state.selectedId = enemy.ID;
      saveLastSelectedId(enemy.ID);
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
  const maneuvers = (enemy && enemy.data && enemy.data.maneuvers) || [];
  if (maneuvers.length === 0) return 0;
  
  const base = 6 + (String(enemy && enemy.class_type) === "レギオン" ? 2 : 0);
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
  if (maneuvers.length === 0) return 0;
  
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

function getMaliceBadgeClass(maliceValue) {
  const v = Number(maliceValue || 0);
  if (v >= 20) return "is-mlv-5";
  if (v >= 15) return "is-mlv-4";
  if (v >= 10) return "is-mlv-3";
  if (v >= 6) return "is-mlv-2";
  if (v >= 2) return "is-mlv-1";
  return "is-mlv-0";
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
    // NOTE:
    // malice入力ごとにテーブル全体を再描画すると、
    // number入力のフォーカス/キャレットが外れて編集しづらくなる。
    // ここでは再描画せず、下部の計算ヘッダ/プレビュー更新のみで追従する。
    if (kind === "parts" && key === "type") {
      row.type = sanitizePartType(row.type);
    }
    enemy.time = nowIsoLocal();
    el.fields.time.value = enemy.time;
    if (el.fields.timeText)
      el.fields.timeText.textContent = formatDateTimeDisplay(enemy.time);
    renderCalculatedHeader(enemy);
    const shouldRefreshList =
      kind === "maneuvers" &&
      (key === "malice" || key === "initiative" || key === "status");
    scheduleSecondaryRenders({ includeList: shouldRefreshList });
    scheduleSaveToDb();
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
    scheduleSaveToDb();
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
    scheduleSaveToDb();
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

  if (el.newEnemyButton) {
    el.newEnemyButton.addEventListener("click", () => {
      upsertCurrentEnemyFromForm();
      const fresh = normalizeEnemy(createEnemyTemplate());
      state.enemies.unshift(fresh);
      state.selectedId = fresh.ID;
      scheduleSaveToDb();
      renderAll();
      setSaveStatus("idle", "新規作成（未保存）");
    });
  }

  if (el.saveEnemyButton) {
    el.saveEnemyButton.addEventListener("click", () => {
      upsertCurrentEnemyFromForm();
      setSaveStatus("saving", "保存要求を送信中…");
      saveToStorage();
      renderAll();
    });
  }

  if (el.reloadEnemyListButton) {
    el.reloadEnemyListButton.addEventListener("click", async () => {
      try {
        if (hasUnsavedChanges) {
          const ok = window.confirm(
            "未保存の変更があります。再読込すると失われます。続行しますか？",
          );
          if (!ok) return;
        }
        setSaveStatus("saving", "DB再読込中…");
        await loadFromStorage();
        renderAll();
        setSaveStatus("ok", "DB再読込完了");
        alert("DBから再読込した");
      } catch (error) {
        console.warn("[nechronica] DB再読込失敗:", error);
        setSaveStatus("error", "DB再読込失敗");
        alert("DB再読込に失敗しました");
      }
    });
  }

  if (el.sortByMaliceButton) {
    el.sortByMaliceButton.addEventListener("click", () =>
      setEnemySort("malice"),
    );
  }
  if (el.sortByInitiativeButton) {
    el.sortByInitiativeButton.addEventListener("click", () =>
      setEnemySort("initiative"),
    );
  }
  if (el.sortByAuthorButton) {
    el.sortByAuthorButton.addEventListener("click", () =>
      setEnemySort("author"),
    );
  }
  if (el.sortByIdButton) {
    el.sortByIdButton.addEventListener("click", () => setEnemySort("id"));
  }
  if (el.sortByTimeButton) {
    el.sortByTimeButton.addEventListener("click", () => setEnemySort("time"));
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
        scheduleSaveToDb();
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
      scheduleSaveToDb();
      renderAll();
    });
  }

  if (el.addBasicManeuversButton) {
    el.addBasicManeuversButton.addEventListener("click", () => {
      const enemy = getSelectedEnemy();
      if (!enemy) return;
      appendBasicManeuvers(enemy);
      enemy.time = nowIsoLocal();
      scheduleSaveToDb();
      renderAll();
    });
  }

  el.enemyEditorForm.addEventListener("input", (event) => {
    const target = event.target;
    // テーブル入力は bindTableEvents 側で更新とオートセーブを処理する。
    // ここで追加処理すると、入力中に不要な再描画が走りカーソルが外れやすい。
    if (target instanceof HTMLElement && target.closest("#maneuversTable")) {
      return;
    }
    const enemy = getSelectedEnemy();
    if (!enemy) return;
    upsertCurrentEnemyFromForm();
    if (document.activeElement === el.fields.classType) {
      renderManeuversTable(enemy);
    }
    renderCalculatedHeader(enemy);
    const targetId =
      target instanceof HTMLElement ? String(target.id || "") : "";
    const shouldRefreshList =
      targetId === "field-id" ||
      targetId === "field-author" ||
      targetId === "field-name" ||
      targetId === "field-class-type" ||
      targetId === "field-icon-url" ||
      targetId === "field-is-public";
    scheduleSecondaryRenders({ includeList: shouldRefreshList });
    scheduleSaveToDb();
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
      scheduleSaveToDb();
    });
  }

  window.addEventListener("beforeunload", (event) => {
    if (!hasUnsavedChanges) return;
    event.preventDefault();
    event.returnValue = "";
  });

  bindTableEvents();
}

// ===== 前回選択エネミーの保存・復元 =====

function saveLastSelectedId(id) {
  try {
    if (id) {
      localStorage.setItem(NC_LAST_SELECTED_ID_KEY, String(id));
    } else {
      localStorage.removeItem(NC_LAST_SELECTED_ID_KEY);
    }
  } catch (_e) {
    // ignore
  }
}

function getLastSelectedId() {
  try {
    return String(localStorage.getItem(NC_LAST_SELECTED_ID_KEY) || "").trim();
  } catch (_e) {
    return "";
  }
}

function showRestoreDialog(enemy) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "restore-dialog-overlay";

    const dialog = document.createElement("div");
    dialog.className = "restore-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "restore-dialog-title");

    const nameText = String(enemy.name || "(no name)");
    const classText = String(enemy.class_type || "");

    dialog.innerHTML = `
      <p id="restore-dialog-title" class="restore-dialog-title">前回の続きを開きますか？</p>
      <p class="restore-dialog-enemy">
        <span class="restore-dialog-name">${escapeHtml(nameText)}</span>
        ${classText ? `<span class="restore-dialog-class">${escapeHtml(classText)}</span>` : ""}
      </p>
      <div class="restore-dialog-actions">
        <button id="restoreDialogYes" class="small-square-btn">続きを開く</button>
        <button id="restoreDialogNo" class="small-square-btn is-secondary">新規で開く</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // フォーカス
    const yesBtn = dialog.querySelector("#restoreDialogYes");
    const noBtn = dialog.querySelector("#restoreDialogNo");
    if (yesBtn) yesBtn.focus();

    function close(result) {
      overlay.remove();
      resolve(result);
    }

    if (yesBtn) yesBtn.addEventListener("click", () => close(true));
    if (noBtn) noBtn.addEventListener("click", () => close(false));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(false);
    });
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") {
        document.removeEventListener("keydown", onKey);
        close(false);
      }
    });
  });
}

async function boot() {
  setSaveStatus("idle", "読込中…");
  await loadFromStorage();
  await loadManeuverMaster();
  setupEvents();

  // 前回開いていたエネミーの復元確認
  const lastId = getLastSelectedId();
  const lastEnemy = lastId ? state.enemies.find((e) => String(e.ID) === lastId) : null;
  
  if (lastEnemy && String(lastEnemy.ID) !== String(state.selectedId)) {
    const restore = await showRestoreDialog(lastEnemy);
    if (restore) {
      state.selectedId = lastEnemy.ID;
      saveLastSelectedId(lastEnemy.ID);
    } else {
      // 復元しない場合は新規作成
      const fresh = createEnemyTemplate();
      state.enemies.unshift(normalizeEnemy(fresh));
      state.selectedId = fresh.ID;
      saveLastSelectedId(fresh.ID);
      scheduleSaveToDb();
    }
  } else if (!state.selectedId) {
    // 記憶がない・対象がない場合で、まだ未選択なら新規作成
    const fresh = createEnemyTemplate();
    state.enemies.unshift(normalizeEnemy(fresh));
    state.selectedId = fresh.ID;
    saveLastSelectedId(fresh.ID);
    scheduleSaveToDb();
  }

  renderAll();
  if (hasUnsavedChanges) {
    setSaveStatus("idle", "未保存の変更あり");
  } else {
    setSaveStatus("idle", "");
  }
}

document.addEventListener("DOMContentLoaded", boot);

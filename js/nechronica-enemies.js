const state = {
  enemies: [],
  selectedId: null,
  search: "",
  enemySearchField: "all",
  summaryPlayerCount: 4,
  summaryKarmaCount: 1,
  summaryDamageTabKey: "",
  activeTab: "editor",
  maneuverMasterMap: new Map(),
  maneuverMasterLoaded: false,
  enemySortKey: "id",
  enemySortDir: "asc",
  enemyListPageSize: 10,
  enemyListPage: 1,
};

const PART_TYPES = ["頭", "腕", "胴", "脚"];
const CLASS_TYPES = ["サヴァント", "ホラー", "レギオン"];
const PLACE_TYPES = ["地獄", "奈落", "煉獄", "花園", "楽園"];
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
const NC_SUMMARY_LAYOUT_STORAGE_KEY = "nechronicaEnemiesSummaryLayoutV1";
const KOMA_JSON_COPY_SUCCESS_MESSAGE =
  "ココフォリアコマ出力をコピーした！これを盤面でペーストだ！";
const DEFAULT_NECHRONICA_GAS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxMR7f_pOi14SsAuKvu7YxKVBQZ69dn-TeQpMBxyYzo_pwZmICNZ06cSb8BKQYCM0GuGg/exec";
let saveDebounceTimer = null;
let saveRequestInFlight = false;
let secondaryRenderDebounceTimer = null;
let summaryRenderDebounceTimer = null;
let hasUnsavedChanges = false;
let saveToastTimer = null;
const localUnsavedEnemyIds = new Set();
const SERVANT_BASIC_MANEUVERS_TEMPLATE = [
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

const HORROR_BASIC_MANEUVERS_TEMPLATE = [
  { type: "頭", name: "のうみそ" },
  { type: "胴", name: "ほね" },
  { type: "胴", name: "はらわた" },
  { type: "胴", name: "はらわた" },
  { type: "胴", name: "", effect: "Lv1-2の強化パーツ" },
];

const LEGION_BASIC_MANEUVERS_TEMPLATE = [
  { type: "腕", name: "ひきさく" },
  { type: "脚", name: "よろめく" },
  { type: "胴", name: "むらがる" },
];

const el = {
  editorTabButton: document.getElementById("editorTabButton"),
  summaryTabButton: document.getElementById("summaryTabButton"),
  editorTabPanel: document.getElementById("editorTabPanel"),
  summaryTabPanel: document.getElementById("summaryTabPanel"),
  copySummaryPartsButton: document.getElementById("copySummaryPartsButton"),
  summaryTotalMalice: document.getElementById("summaryTotalMalice"),
  summaryFavorPoints: document.getElementById("summaryFavorPoints"),
  summaryPlayerCountInput: document.getElementById("summaryPlayerCountInput"),
  summaryKarmaCountInput: document.getElementById("summaryKarmaCountInput"),
  summaryBaseParts: document.getElementById("summaryBaseParts"),
  summaryEnhancedParts: document.getElementById("summaryEnhancedParts"),
  summaryEnemiesBody: document.getElementById("summaryEnemiesBody"),
  summaryDamageUnitList: document.getElementById("summaryDamageUnitList"),
  summaryPlaceGrid: document.getElementById("summaryPlaceGrid"),
  clearAllSummaryPlaceButton: document.getElementById(
    "clearAllSummaryPlaceButton",
  ),
  enemyList: document.getElementById("enemyList"),
  enemyListPager: document.getElementById("enemyListPager"),
  enemySearchInput: document.getElementById("enemySearchInput"),
  enemySearchField: document.getElementById("enemySearchField"),
  enemyPageSizeInput: document.getElementById("enemyPageSizeInput"),
  enemyShowAllButton: document.getElementById("enemyShowAllButton"),
  enemyShowTenButton: document.getElementById("enemyShowTenButton"),
  saveEnemyButton: document.getElementById("saveEnemyButton"),
  saveEnemyButtonBottom: document.getElementById("saveEnemyButtonBottom"),
  saveAsEnemyButtonBottom: document.getElementById("saveAsEnemyButtonBottom"),
  newEnemyButton: document.getElementById("newEnemyButton"),
  newEnemyButtonBottom: document.getElementById("newEnemyButtonBottom"),
  duplicateEnemyButton: document.getElementById("duplicateEnemyButton"),
  duplicateEnemyButtonBottom: document.getElementById(
    "duplicateEnemyButtonBottom",
  ),
  deleteEnemyButton: document.getElementById("deleteEnemyButton"),
  deleteEnemyButtonBottom: document.getElementById("deleteEnemyButtonBottom"),
  reloadEnemyListButton: document.getElementById("reloadEnemyListButton"),
  reloadEnemyListButtonBottom: document.getElementById(
    "reloadEnemyListButtonBottom",
  ),
  saveStatusText: document.getElementById("saveStatusText"),
  sortByMaliceButton: document.getElementById("sortByMaliceButton"),
  sortByInitiativeButton: document.getElementById("sortByInitiativeButton"),
  sortByAuthorButton: document.getElementById("sortByAuthorButton"),
  sortByIdButton: document.getElementById("sortByIdButton"),
  sortByTimeButton: document.getElementById("sortByTimeButton"),
  exportJsonButton: document.getElementById("exportJsonButton"),
  exportKomaJsonButton: document.getElementById("exportKomaJsonButton"),
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
    maliceLabel: document.getElementById("fieldMaliceLabel"),
    initiative: document.getElementById("field-initiative"),
    legionInitiativeBonusWrap: document.getElementById(
      "fieldLegionInitiativeBonusWrap",
    ),
    legionInitiativeBonus: document.getElementById(
      "field-legion-initiative-bonus",
    ),
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

function saveSummaryLayoutToLocal() {
  try {
    const payload = {};
    state.enemies.forEach((enemy) => {
      const id = String((enemy && enemy.ID) || "").trim();
      if (!id) return;
      const slots = Array.isArray(enemy.summary_slots)
        ? enemy.summary_slots
            .map((slot) => {
              const place = String((slot && slot.place) || "煉獄").trim();
              const unitCount = Number((slot && slot.unit_count) || 1);
              return {
                place: PLACE_TYPES.includes(place) ? place : "煉獄",
                unit_count:
                  Number.isFinite(unitCount) && unitCount > 0
                    ? Math.floor(unitCount)
                    : 1,
              };
            })
            .filter((slot) => slot)
        : [];
      payload[id] = slots;
    });
    localStorage.setItem(
      NC_SUMMARY_LAYOUT_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch (_e) {
    // ignore storage errors
  }
}

function loadSummaryLayoutFromLocal() {
  try {
    const raw = localStorage.getItem(NC_SUMMARY_LAYOUT_STORAGE_KEY) || "";
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    state.enemies.forEach((enemy) => {
      const id = String((enemy && enemy.ID) || "").trim();
      if (!id) return;
      const slots = parsed[id];
      if (!Array.isArray(slots)) return;
      enemy.summary_slots = slots
        .map((slot) => {
          const place = String((slot && slot.place) || "煉獄").trim();
          const unitCount = Number((slot && slot.unit_count) || 1);
          return {
            place: PLACE_TYPES.includes(place) ? place : "煉獄",
            unit_count:
              Number.isFinite(unitCount) && unitCount > 0
                ? Math.floor(unitCount)
                : 1,
          };
        })
        .filter((slot) => slot);
    });
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

function scheduleSummaryRenders(options = {}) {
  const { includeList = true, delayMs = 60, immediate = false } = options;
  if (summaryRenderDebounceTimer) {
    clearTimeout(summaryRenderDebounceTimer);
    summaryRenderDebounceTimer = null;
  }
  const run = () => {
    renderSummaryPanel();
    if (includeList) renderEnemyList();
  };
  if (immediate || delayMs <= 0) {
    run();
    return;
  }
  summaryRenderDebounceTimer = setTimeout(() => {
    summaryRenderDebounceTimer = null;
    run();
  }, delayMs);
}

function setSaveStatus(kind, text) {
  const message = String(text || "").trim();
  if (!el.saveStatusText) return;
  el.saveStatusText.textContent = message;
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

  if (!message) return;
  if (kind !== "ok" && kind !== "error") return;

  showToast(message, kind === "error" ? "error" : "info");
}

function showToast(message, kind = "info") {
  const shared = getNechronicaShared();
  if (shared && typeof shared.showToast === "function") {
    shared.showToast(message, {
      kind,
      id: "copyToast",
      className: "copy-toast",
      errorClass: "is-error",
      showClass: "is-show",
      duration: 1400,
    });
    return;
  }
  const text = String(message || "").trim();
  if (!text) return;

  let toast = document.getElementById("copyToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "copyToast";
    toast.className = "copy-toast";
    document.body.appendChild(toast);
  }
  // 既存DOMに同ID要素がある場合でも、通知用スタイルを強制適用する
  toast.className = "copy-toast";
  toast.textContent = text;
  toast.classList.remove("is-error", "is-show");
  if (kind === "error") {
    toast.classList.add("is-error");
  }
  // reflow
  void toast.offsetWidth;
  toast.classList.add("is-show");

  if (saveToastTimer) clearTimeout(saveToastTimer);
  saveToastTimer = setTimeout(() => {
    toast.classList.remove("is-show");
  }, 1400);
}

function showKomaJsonCopySuccessToast() {
  showToast(KOMA_JSON_COPY_SUCCESS_MESSAGE, "info");
}

async function writeClipboardText(text) {
  await getNechronicaShared().writeClipboardText(text);
}

function setSaveButtonLabelByEnemy(enemy) {
  const isNew =
    !!enemy && localUnsavedEnemyIds.has(String((enemy && enemy.ID) || ""));
  const label = isNew ? "新規保存" : "上書き保存";
  const apply = (btn) => {
    if (!(btn instanceof HTMLButtonElement)) return;
    const icon = btn.querySelector("i");
    if (icon) {
      btn.innerHTML = `<i class="${icon.className}"></i> ${escapeHtml(label)}`;
    } else {
      btn.textContent = label;
    }
    btn.title = label;
    btn.setAttribute("aria-label", label);
  };
  apply(el.saveEnemyButton);
  apply(el.saveEnemyButtonBottom);
}

function formatDateTimeDisplay(isoLike) {
  const raw = String(isoLike || "").trim();
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
    reportChecked: false,
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

function getNechronicaShared() {
  const shared =
    typeof window !== "undefined" && window && window.NechronicaShared
      ? window.NechronicaShared
      : null;
  if (shared && typeof shared.isRepeatableTiming === "function") {
    return shared;
  }
  return {
    isRepeatableTiming: (timing) => {
      const t = String(timing || "").trim();
      return t === "オート" || t === "アクション";
    },
    canUseUsedStatusForManeuver: (maneuver) => {
      const timing = String((maneuver && maneuver.timing) || "").trim();
      return timing !== "オート" && timing !== "アクション";
    },
    writeClipboardText: async (text) => {
      const value = String(text == null ? "" : text);
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(value);
        return;
      }
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "readonly");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (!ok) throw new Error("clipboard unavailable");
    },
    showToast: (message, opts = {}) => {
      const text = String(message || "").trim();
      if (!text) return;
      const id = String(opts.id || "copyToast");
      const className = String(opts.className || "copy-toast");
      let toast = document.getElementById(id);
      if (!toast) {
        toast = document.createElement("div");
        toast.id = id;
        toast.className = className;
        document.body.appendChild(toast);
      }
      toast.className = className;
      toast.textContent = text;
      toast.classList.remove("is-error", "is-show");
      if ((opts && opts.kind) === "error") toast.classList.add("is-error");
      void toast.offsetWidth;
      toast.classList.add("is-show");
      if (saveToastTimer) clearTimeout(saveToastTimer);
      saveToastTimer = setTimeout(
        () => {
          toast.classList.remove("is-show");
        },
        Number(opts.duration) > 0 ? Number(opts.duration) : 1400,
      );
    },
    resolveReportCheckedOnDamageTransition: (
      prevStatus,
      nextStatus,
      currentChecked,
      damageToken = "損傷",
    ) => {
      const prev = String(prevStatus || "");
      const next = String(nextStatus || "");
      if (next === damageToken) return true;
      if (prev === damageToken && next !== damageToken) return false;
      return !!currentChecked;
    },
  };
}

function isRepeatableTiming(timing) {
  return !!getNechronicaShared().isRepeatableTiming(timing);
}

function canUseUsedStatusForManeuver(maneuver) {
  const shared = getNechronicaShared();
  if (typeof shared.canUseUsedStatusForManeuver === "function") {
    return !!shared.canUseUsedStatusForManeuver(maneuver);
  }
  return !isRepeatableTiming(maneuver && maneuver.timing);
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
    place: "煉獄",
    unit_count: 1,
    summary_slots: [],
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

function getDefaultUnitCountByClassType(classType) {
  return String(classType || "") === "レギオン" ? 5 : 1;
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
  const legionBonusRaw = Number(enemy.legion_initiative_bonus || 0);
  enemy.legion_initiative_bonus = Number.isFinite(legionBonusRaw)
    ? Math.floor(legionBonusRaw)
    : 0;
  const place = String(enemy.place || "煉獄").trim();
  enemy.place = PLACE_TYPES.includes(place) ? place : "煉獄";
  const defaultUnits = getDefaultUnitCountByClassType(enemy.class_type);
  const units = Number(enemy.unit_count || defaultUnits);
  enemy.unit_count =
    Number.isFinite(units) && units > 0 ? Math.floor(units) : defaultUnits;
  if (!Array.isArray(enemy.summary_slots)) {
    if (enemy.summary_included) {
      enemy.summary_slots = [
        {
          place: enemy.place,
          unit_count: enemy.unit_count,
        },
      ];
    } else {
      enemy.summary_slots = [];
    }
  }
  enemy.summary_slots = enemy.summary_slots
    .map((slot) => {
      const slotPlace = String(
        (slot && slot.place) || enemy.place || "煉獄",
      ).trim();
      const slotUnits = Number(
        (slot && slot.unit_count) || enemy.unit_count || defaultUnits,
      );
      return {
        place: PLACE_TYPES.includes(slotPlace) ? slotPlace : "煉獄",
        unit_count:
          Number.isFinite(slotUnits) && slotUnits > 0
            ? Math.floor(slotUnits)
            : defaultUnits,
      };
    })
    .filter((slot) => slot && slot.unit_count > 0);
  if (
    !enemy.summary_unit_damage_notes ||
    typeof enemy.summary_unit_damage_notes !== "object"
  ) {
    enemy.summary_unit_damage_notes = {};
  }
  if (
    !enemy.summary_unit_part_states ||
    typeof enemy.summary_unit_part_states !== "object"
  ) {
    enemy.summary_unit_part_states = {};
  }
  // 旧版の initiative は top-level へ救済してから data 側を整理する
  // （enemies.txt など data.initiative 起点の入力との互換維持）
  const topLevelInitiative = Number(enemy.initiative || 0);
  const legacyDataInitiative = Number(enemy.data.initiative || 0);
  if (
    (!Number.isFinite(topLevelInitiative) || topLevelInitiative <= 0) &&
    Number.isFinite(legacyDataInitiative) &&
    legacyDataInitiative > 0
  ) {
    enemy.initiative = legacyDataInitiative;
  }
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
    const normalizedName = String((m && (m.name || m.kindName)) || "");
    const key = normalizedName.trim();
    const master = key ? state.maneuverMasterMap.get(key) : null;
    const directInitiative = Number((m && m.initiative) || 0);
    const directMalice = Number((m && m.malice) || 0);
    const fallbackInitiative = Number((master && master.initiative) || 0);
    const fallbackMalice = Number((master && master.malice) || 0);
    const normalizedInitiative =
      Number.isFinite(directInitiative) && directInitiative !== 0
        ? directInitiative
        : Number.isFinite(fallbackInitiative)
          ? fallbackInitiative
          : 0;
    const normalizedMalice =
      Number.isFinite(directMalice) && directMalice !== 0
        ? directMalice
        : Number.isFinite(fallbackMalice)
          ? fallbackMalice
          : 0;
    return {
      id: m && m.id ? m.id : `man_${i + 1}`,
      name: normalizedName,
      kindName: normalizedName,
      displayName: (m && (m.displayName || m.name || m.kindName)) || "",
      partType: sanitizePartType((m && (m.partType || m.partId)) || ""),
      timing: (m && m.timing) || "",
      cost: (m && m.cost) || "",
      range: (m && m.range) || "",
      initiative: normalizedInitiative,
      malice: normalizedMalice,
      effect: (m && m.effect) || "",
      brokenEffect: (m && (m.brokenEffect || m.broken)) || "",
      masterId: (m && m.masterId) || "",
      source: (m && m.source) || "",
      partId: (m && m.partId) || "",
      broken: (m && m.broken) || "",
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
    let c = 0;
    if (typeof av === "string" && typeof bv === "string") {
      c = av.localeCompare(bv, "ja");
    } else {
      c = Number(av) - Number(bv);
    }

    if (c !== 0) return c * dir;

    // 多重ソート: メインキーが同じなら「更新日時（新しい順）」
    if (key !== "time") {
      const at = String((a && a.time) || "");
      const bt = String((b && b.time) || "");
      const tc = at.localeCompare(bt);
      if (tc !== 0) return tc * -1; // 常に降順（新しい順）
    }

    // それでも同じなら名前
    return String((a && a.name) || "").localeCompare(
      String((b && b.name) || ""),
      "ja",
    );
  });
}

function normalizeEnemyListPageSize(rawValue) {
  const raw = String(rawValue ?? "").trim();
  if (!raw) return 10;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 10;
  const i = Math.floor(n);
  if (i === 0) return 0;
  if (i < 0) return 10;
  return i;
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

    let iconHtml = "";
    if (active) {
      iconHtml =
        state.enemySortDir === "asc"
          ? ' <i class="fa-solid fa-sort-up"></i>'
          : ' <i class="fa-solid fa-sort-down"></i>';
    }
    btn.innerHTML = `${label}${iconHtml}`;
  });
}

function setEnemySort(key) {
  if (!key) return;

  const isRecommendAsc = key === "author" || key === "id";
  const recommendDir = isRecommendAsc ? "asc" : "desc";
  const reverseDir = isRecommendAsc ? "desc" : "asc";

  if (state.enemySortKey === key) {
    if (state.enemySortDir === recommendDir) {
      // 1回目(推奨) -> 2回目(逆)
      state.enemySortDir = reverseDir;
    } else {
      // 2回目(逆) -> 3回目(リセット: ID昇順)
      state.enemySortKey = "id";
      state.enemySortDir = "asc";
    }
  } else {
    // 別のキーをクリック -> 1回目(推奨)
    state.enemySortKey = key;
    state.enemySortDir = recommendDir;
  }
  state.enemyListPage = 1;
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
        localUnsavedEnemyIds.add(String(initial.ID || ""));
        loadSummaryLayoutFromLocal();
        state.selectedId = initial.ID;
        return;
      }
      if (
        !state.selectedId ||
        !state.enemies.some((e) => e.ID === state.selectedId)
      ) {
        state.selectedId = null;
      }
      localUnsavedEnemyIds.clear();
      loadSummaryLayoutFromLocal();
      clearUnsavedChanges();
      return;
    }
  } catch (error) {
    console.warn("[nechronica] DB一覧取得失敗:", error);
  }

  const initial = createEnemyTemplate();
  state.enemies = [normalizeEnemy(initial)];
  localUnsavedEnemyIds.add(String(initial.ID || ""));
  loadSummaryLayoutFromLocal();
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
      const beforeId = String(current.ID || "");
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
      localUnsavedEnemyIds.delete(beforeId);
      localUnsavedEnemyIds.delete(String(current.ID || ""));
      setSaveButtonLabelByEnemy(current);
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
  const searchField = String(state.enemySearchField || "all").trim();
  const myAuthor = getRememberedAuthor();
  const targets = state.enemies.filter((e) => {
    if (isNoNameServantPlaceholder(e)) return false;
    const isMine = myAuthor && String(e.author || "") === String(myAuthor);
    if (!e.is_public && !isMine) return false;
    if (!q) return true;
    const fields = {
      name: String(e.name || "").toLowerCase(),
      author: String(e.author || "").toLowerCase(),
      class: String(e.class_type || "").toLowerCase(),
      id: String(e.ID || "").toLowerCase(),
    };
    if (searchField === "all") {
      return Object.values(fields).some((v) => v.includes(q));
    }
    return String(fields[searchField] || "").includes(q);
  });

  const sortedTargets = sortEnemies(targets);
  const pageSize = normalizeEnemyListPageSize(state.enemyListPageSize);
  state.enemyListPageSize = pageSize;
  const showAll = pageSize <= 0;
  const totalPages = showAll
    ? 1
    : Math.max(1, Math.ceil(sortedTargets.length / pageSize));
  state.enemyListPage = showAll
    ? 1
    : Math.min(Math.max(1, state.enemyListPage), totalPages);
  const pageStart = showAll ? 0 : (state.enemyListPage - 1) * pageSize;
  const pageEnd = showAll ? sortedTargets.length : pageStart + pageSize;
  const visibleTargets = sortedTargets.slice(pageStart, pageEnd);

  if (el.enemyPageSizeInput) {
    const expectedValue = showAll ? "0" : String(pageSize);
    if (el.enemyPageSizeInput.value !== expectedValue) {
      el.enemyPageSizeInput.value = expectedValue;
    }
  }

  if (el.enemyListPager) {
    el.enemyListPager.innerHTML = "";
  }

  el.enemyList.innerHTML = "";
  updateEnemySortButtons();
  if (!sortedTargets.length) {
    const li = document.createElement("li");
    li.textContent = "該当なし";
    el.enemyList.appendChild(li);
    if (el.enemyListPager) {
      el.enemyListPager.innerHTML =
        '<span class="enemy-list-pager-info">0件</span>';
    }
    return;
  }

  visibleTargets.forEach((enemy) => {
    const li = document.createElement("li");
    const card = document.createElement("div");
    card.classList.add("enemy-list-card");
    if (enemy.ID === state.selectedId) card.classList.add("is-active");

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
    if (classBgClass) card.classList.add(classBgClass);

    const authorText = String(enemy.author || "-");
    const baseMaliceValue = Number(calcMalice(enemy) || 0);
    const maliceValue = Number.isFinite(baseMaliceValue)
      ? Math.max(0, Math.ceil(baseMaliceValue))
      : 0;
    const maliceBadgeClass = getMaliceBadgeClass(maliceValue);
    const initiativeValue = Number(calcInitiativeTotal(enemy));
    const showInitiative = Number.isFinite(initiativeValue);
    const iconUrl = String(enemy.icon_url || "").trim();
    const showSummaryAdd = state.activeTab === "summary";
    const addLabel = "追加";

    card.innerHTML = `
        <span class="enemy-list-row enemy-list-row-main">
          <!-- 左: 悪意点バッジ / アイコン -->
          <span class="enemy-list-side-left">
            <span class="enemy-malice-badge ${maliceBadgeClass}" title="悪意点">
              <span class="malice-label">悪意</span>
              <span class="malice-value">${escapeHtml(maliceValue)}</span>
            </span>
            <span class="enemy-list-icon-wrap">
              ${
                iconUrl
                  ? `<img class="enemy-list-icon" src="${escapeHtml(iconUrl)}" alt="${escapeHtml(nameText)}">`
                  : `<span class="enemy-list-icon enemy-list-icon-placeholder" aria-hidden="true">👤</span>`
              }
            </span>
          </span>
          
          <!-- 中央: メイン情報 -->
          <span class="enemy-list-content-main">
            <span class="enemy-list-upper-info">
              <span class="enemy-list-name">${escapeHtml(nameText)}</span>
              ${
                showInitiative
                  ? `<span class="enemy-meta-chip">行動値 ${escapeHtml(initiativeValue)}</span>`
                  : ""
              }
            </span>
            <span class="enemy-list-lower-info">
              <span class="meta-item">作者: ${escapeHtml(authorText)}</span>
              <span class="meta-item">ID: ${escapeHtml(enemy.ID || "-")}</span>
            </span>
          </span>

          <!-- 右側まとめ -->
          <span class="enemy-list-side-right-group">
            <!-- 分類と更新日 -->
            <span class="enemy-list-meta-column">
              <span class="enemy-list-class-tag">${escapeHtml(classText)}</span>
              <span class="enemy-list-time-tag">${escapeHtml(formatDateTimeDisplay(enemy.time))}</span>
            </span>
            <!-- アクションボタン -->
            <span class="enemy-list-btns-row">
              <button type="button" class="list-side-btn is-load" title="編集を表示">
                <i class="fa-solid fa-file-signature"></i><br>編集
              </button>
              <button type="button" class="list-side-btn is-copy" title="コピー">
                <i class="fa-solid fa-copy"></i><br>出力
              </button>
              ${
                showSummaryAdd
                  ? `<button type="button" class="list-side-btn is-add-summary" title="敵まとめへ追加" data-add-summary-id="${escapeHtml(enemy.ID || "")}"><i class="fa-solid fa-plus"></i><br>${escapeHtml(addLabel)}</button>`
                  : ""
              }
            </span>
          </span>
        </span>
      `;

    // 読込ボタン
    card.querySelector(".is-load").addEventListener("click", () => {
      state.selectedId = enemy.ID;
      saveLastSelectedId(enemy.ID);
      setActivePageTab("editor");
      renderAll();
      // 編集画面へスクロール
      const editor = document.querySelector(".editor-pane");
      if (editor) editor.scrollIntoView({ behavior: "smooth" });
    });

    // コピーボタン
    card.querySelector(".is-copy").addEventListener("click", async (event) => {
      event.stopPropagation();
      const copyData = buildKomaCharacterJson(enemy);
      try {
        await writeClipboardText(JSON.stringify(copyData));
        showKomaJsonCopySuccessToast();
        const btn = event.currentTarget;
        if (btn instanceof HTMLButtonElement) {
          const originalText = btn.textContent;
          btn.textContent = "完了!";
          btn.classList.add("is-success");
          setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove("is-success");
          }, 1500);
        }
      } catch (_e) {
        showToast("コピー失敗。コンソールに出力する", "error");
        console.log(copyData);
      }
    });

    const addSummaryBtn = card.querySelector("[data-add-summary-id]");
    if (addSummaryBtn instanceof HTMLButtonElement) {
      addSummaryBtn.addEventListener("click", () => {
        if (!Array.isArray(enemy.summary_slots)) enemy.summary_slots = [];
        enemy.summary_slots.push({
          place: getEnemyPlace(enemy),
          unit_count: getEnemyUnitCount(enemy),
        });
        enemy.time = nowIsoLocal();
        saveSummaryLayoutToLocal();
        scheduleSaveToDb();
        renderEnemyList();
        renderSummaryPanel();
      });
    }

    li.appendChild(card);
    el.enemyList.appendChild(li);
  });

  if (el.enemyListPager) {
    const from = pageStart + 1;
    const to = Math.min(pageEnd, sortedTargets.length);
    const pagerPage = showAll ? 1 : state.enemyListPage;
    const pagerTotalPages = showAll ? 1 : totalPages;
    const disablePrev = pagerPage <= 1;
    const disableNext = pagerPage >= pagerTotalPages;
    el.enemyListPager.innerHTML = `
      <button type="button" class="pager-btn" data-page-action="prev" ${disablePrev ? "disabled" : ""}>前へ</button>
      <span class="enemy-list-pager-info">${escapeHtml(from)}-${escapeHtml(to)} / ${escapeHtml(sortedTargets.length)}件（${escapeHtml(pagerPage)} / ${escapeHtml(pagerTotalPages)}ページ）</span>
      <button type="button" class="pager-btn" data-page-action="next" ${disableNext ? "disabled" : ""}>次へ</button>
    `;
  }
}

function fillForm(enemy) {
  if (!enemy) return;
  setSaveButtonLabelByEnemy(enemy);
  el.fields.id.value = enemy.ID || "";
  el.fields.author.value = enemy.author || "";
  el.fields.name.value = enemy.name || "";
  el.fields.classType.value = enemy.class_type || "サヴァント";
  if (el.fields.legionInitiativeBonus)
    el.fields.legionInitiativeBonus.value = String(
      Number(enemy.legion_initiative_bonus || 0) || 0,
    );
  if (el.fields.legionInitiativeBonusWrap) {
    el.fields.legionInitiativeBonusWrap.hidden =
      String(enemy.class_type || "") !== "レギオン";
  }
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
  const isLegion = String(enemy && enemy.class_type) === "レギオン";
  const legionBonus = Number((enemy && enemy.legion_initiative_bonus) || 0);
  const normalizedLegionBonus = Number.isFinite(legionBonus)
    ? Math.floor(legionBonus)
    : 0;
  const base = 6 + (isLegion ? 2 + normalizedLegionBonus : 0);
  const legacyTotal = Number(
    (enemy && (enemy.initiative ?? (enemy.data && enemy.data.initiative))) || 0,
  );
  const hasLegacyTotal = Number.isFinite(legacyTotal) && legacyTotal > 0;
  if (maneuvers.length === 0) return hasLegacyTotal ? legacyTotal : base;

  const addInitiativeByRule = (acc, n, status) => {
    if (!Number.isFinite(n)) return acc;
    // 行動値増減仕様:
    // - 通常は 0
    // - 正の値は常に加算
    // - 負の値は「損傷」時のみ同値を加算（例: -1 -> +1）
    // - 負の値で「損傷」以外のときは 0 扱い
    if (n < 0) {
      if (status === "損傷") return acc + Math.abs(n);
      return acc;
    }
    if (n > 0) return acc + n;
    return acc;
  };

  const hasManeuverInitiative = maneuvers.some((m) => {
    const n = Number((m && m.initiative) || 0);
    return Number.isFinite(n) && n !== 0;
  });
  if (!hasManeuverInitiative && hasLegacyTotal) {
    return legacyTotal;
  }

  const shouldUseMasterFallback = !hasManeuverInitiative;
  const delta = maneuvers.reduce((acc, m) => {
    const direct = Number((m && m.initiative) || 0);
    if (Number.isFinite(direct) && (direct !== 0 || !shouldUseMasterFallback)) {
      return addInitiativeByRule(acc, direct, String((m && m.status) || ""));
    }
    if (!shouldUseMasterFallback) return acc;

    const key = String(
      (m && (m.kindName || m.name || m.displayName)) || "",
    ).trim();
    if (!key) return acc;
    const master = state.maneuverMasterMap.get(key);
    if (!master) return acc;
    const masterIni = Number(master.initiative || 0);
    return addInitiativeByRule(acc, masterIni, String((m && m.status) || ""));
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
  const legacyRaw = Number(
    (enemy && (enemy.malice ?? (enemy.data && enemy.data.malice))) || 0,
  );
  const hasLegacyMalice = Number.isFinite(legacyRaw) && legacyRaw > 0;
  const legacyRounded = hasLegacyMalice ? Math.ceil(legacyRaw) : 0;
  if (maneuvers.length === 0) return legacyRounded;

  const hasManeuverMalice = maneuvers.some((m) => {
    const v = Number((m && m.malice) || 0);
    return Number.isFinite(v) && v !== 0;
  });
  if (!hasManeuverMalice && hasLegacyMalice) {
    return legacyRounded;
  }

  const shouldUseMasterFallback = !hasManeuverMalice && !hasLegacyMalice;

  const sumMalice = maneuvers.reduce((acc, m) => {
    const direct = Number((m && m.malice) || 0);
    if (Number.isFinite(direct) && (direct !== 0 || !shouldUseMasterFallback)) {
      return acc + direct;
    }

    if (!shouldUseMasterFallback) return acc;

    const key = String(
      (m && (m.kindName || m.name || m.displayName)) || "",
    ).trim();
    if (!key) return acc;

    const master = state.maneuverMasterMap.get(key);
    if (!master) return acc;
    const masterMalice = Number(master.malice || 0);
    return Number.isFinite(masterMalice) ? acc + masterMalice : acc;
  }, 0);
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
  if (el.fields.maliceLabel) {
    el.fields.maliceLabel.textContent =
      String(enemy.class_type || "") === "レギオン"
        ? "悪意点（5体で）"
        : "悪意点";
  }
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
    const partType = sanitizePartType((m && m.partType) || "");
    const partToneClass = getPartTypeToneClass(partType);
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
    tr.setAttribute("draggable", "false");
    tr.dataset.index = String(index);
    tr.classList.add(partToneClass);
    if (isForbiddenMalice) tr.classList.add("is-forbidden-maneuver");
    tr.innerHTML = `
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
          <button type="button" class="copy-row-btn" data-copy-kind="maneuver-line" data-index="${index}" title="この行をコピー" aria-label="この行をコピー">
            <i class="fa-solid fa-copy"></i>
          </button>
          <button type="button" class="delete-btn" data-remove-kind="maneuvers" data-index="${index}" title="削除" aria-label="削除">
            <i class="fa-solid fa-trash"></i>
          </button>
          <span class="drag-hint" draggable="true" aria-hidden="true" title="この行はドラッグで並べ替えできます">⠿</span>
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

function getPartTypeToneClass(type) {
  const t = sanitizePartType(type, "");
  if (t === "頭") return "is-head";
  if (t === "腕") return "is-arm";
  if (t === "胴") return "is-body";
  if (t === "脚") return "is-leg";
  return "is-other";
}

function stateMark(entity) {
  if (!entity) return "⭕";
  if (entity.status === "損傷") return "❌";
  return "⭕";
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
    /無事：⭕、使用：[✅⭕]、損傷：❌/.test(String(l)),
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
  const lines = ["\n───", `初期行動値：${iniTotal}`];
  if (userMemo) lines.push(userMemo);
  lines.push(
    "",
    "無事：⭕、使用：⭕、損傷：❌",
    isServantEnemy(enemy)
      ? "🟩【マニューバ名】《タイミング / コスト / 射程》"
      : "🟩【マニューバ名】 《タイミング / コスト / 射程》",
  );

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
    lines.push(
      `${stateMark(m)}【${(m && (m.name || m.kindName || m.displayName)) || ""}】《${(m && m.timing) || ""}/${(m && m.cost) || ""}/${(m && m.range) || ""}》`,
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

function formatManeuverLineForReport(maneuver) {
  if (!maneuver) return "";
  const name = String(
    (maneuver &&
      (maneuver.name || maneuver.kindName || maneuver.displayName)) ||
      "",
  ).trim();
  if (!name) return "";
  const timing = String((maneuver && maneuver.timing) || "");
  const cost = String((maneuver && maneuver.cost) || "");
  const range = String((maneuver && maneuver.range) || "");
  const effectText = formatEffectWithTriggerHint(
    (maneuver && maneuver.effect) || "",
  );
  return `${stateMark(maneuver)}【${name}】《${timing}/${cost}/${range}》${effectText}`;
}

function getCheckedManeuverReportLines(enemy) {
  const maneuvers = (enemy && enemy.data && enemy.data.maneuvers) || [];
  return maneuvers
    .filter((m) => m && m.reportChecked)
    .map((m) => formatManeuverLineForReport(m))
    .filter((line) => line.length > 0);
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
  renderSummaryPanel();
}

function getEnemyUnitCount(enemy) {
  const n = Number(enemy && enemy.unit_count);
  if (!Number.isFinite(n) || n <= 0) {
    return getDefaultUnitCountByClassType(enemy && enemy.class_type);
  }
  return Math.floor(n);
}

function getEnemyPlace(enemy) {
  const place = String((enemy && enemy.place) || "").trim();
  return PLACE_TYPES.includes(place) ? place : "煉獄";
}

function normalizeSummaryPlayerCount(rawValue) {
  const n = Number(rawValue);
  if (!Number.isFinite(n)) return 4;
  const normalized = Math.floor(n);
  if (normalized < 1) return 1;
  if (normalized > 99) return 99;
  return normalized;
}

function normalizeSummaryKarmaCount(rawValue) {
  const n = Number(rawValue);
  if (!Number.isFinite(n)) return 1;
  const normalized = Math.floor(n);
  if (normalized < 0) return 0;
  if (normalized > 99) return 99;
  return normalized;
}

function buildSummaryPartsCopyText() {
  const { allMalice } = buildEnemySummaryRows();
  const playerCount = normalizeSummaryPlayerCount(state.summaryPlayerCount);
  const karmaCount = normalizeSummaryKarmaCount(state.summaryKarmaCount);
  const baseParts = Math.ceil(allMalice / 1);
  const enhancedParts = Math.ceil(allMalice / 2);
  const favorPointsRaw = allMalice / playerCount + karmaCount * 2;
  const favorPoints = Number.isFinite(favorPointsRaw)
    ? Number.isInteger(favorPointsRaw)
      ? String(favorPointsRaw)
      : favorPointsRaw.toFixed(2)
    : "0";
  return [
    `基本パーツ: ${baseParts}`,
    `強化パーツ: ${enhancedParts}`,
    `寵愛点: ${favorPoints}`,
  ].join("\n");
}

function calcSummaryScore(totalMalice, allMalice) {
  const den = Number(allMalice || 0);
  const num = Number(totalMalice || 0);
  if (!Number.isFinite(num) || num <= 0) return "0";
  if (!Number.isFinite(den) || den <= 0) return `${num.toFixed(2)}/-`;
  return `${(num / den).toFixed(2)}`;
}

function getAlphabetIndexLabel(index) {
  let n = Number(index);
  if (!Number.isFinite(n) || n < 0) return "A";
  n = Math.floor(n);
  let label = "";
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

function formatSummaryDamageDisplayName(row) {
  const baseName = String((row && row.name) || "").trim();
  const displayName = String(
    (row && (row.displayName || row.name)) || "",
  ).trim();
  if (!baseName || !displayName) return displayName || baseName;
  const suffix = displayName.startsWith(`${baseName} `)
    ? displayName.slice(baseName.length).trim()
    : "";
  if (/^[A-Z]+$/.test(suffix)) {
    return `${suffix}${baseName}`;
  }
  return displayName;
}

function buildSummaryUnitKey(slotIndex, unitIndex) {
  return `${Number(slotIndex)}:${Number(unitIndex)}`;
}

function buildSummaryUnitPartKey(maneuver, index) {
  if (maneuver && maneuver.id) return String(maneuver.id);
  return `m_${Number(index)}`;
}

function normalizeSummaryUnitPartState(entry) {
  if (entry && typeof entry === "object") {
    const statusRaw = String(entry.status || "無事").trim();
    const status =
      statusRaw === "損傷" || statusRaw === "使用" ? statusRaw : "無事";
    const nameOverride = String(entry.nameOverride || "").trim();
    return {
      status,
      reportChecked: !!entry.reportChecked,
      nameOverride,
    };
  }
  return {
    status: "無事",
    reportChecked: false,
    nameOverride: "",
  };
}

function getSummaryUnitRows(summaryRows) {
  const unitRows = [];
  summaryRows.forEach((row) => {
    const units = Number(row && row.units);
    const isLegion = String((row && row.classType) || "") === "レギオン";
    const normalizedUnits = isLegion
      ? 1
      : Number.isFinite(units) && units > 0
        ? Math.floor(units)
        : 1;
    const enemy = state.enemies.find(
      (e) => String((e && e.ID) || "") === String(row.id || ""),
    );
    if (!enemy) return;
    if (
      !enemy.summary_unit_damage_notes ||
      typeof enemy.summary_unit_damage_notes !== "object"
    ) {
      enemy.summary_unit_damage_notes = {};
    }
    if (
      !enemy.summary_unit_part_states ||
      typeof enemy.summary_unit_part_states !== "object"
    ) {
      enemy.summary_unit_part_states = {};
    }
    for (let unitIndex = 0; unitIndex < normalizedUnits; unitIndex += 1) {
      const unitKey = buildSummaryUnitKey(row.slotIndex, unitIndex);
      const currentMap = enemy.summary_unit_part_states[unitKey];
      if (!currentMap || typeof currentMap !== "object") {
        enemy.summary_unit_part_states[unitKey] = {};
      }
      const baseRowName = formatSummaryDamageDisplayName(row);
      const unitPrefix =
        normalizedUnits > 1 ? getAlphabetIndexLabel(unitIndex) : "";
      const unitDisplayName = unitPrefix
        ? `${unitPrefix}${baseRowName}`
        : baseRowName;
      unitRows.push({
        id: row.id,
        slotIndex: row.slotIndex,
        unitIndex,
        unitKey,
        unitLabel: `${unitIndex + 1}`,
        rowName: baseRowName,
        unitDisplayName,
        classType: String(row.classType || ""),
        place: row.place,
        enemy,
      });
    }
  });
  return unitRows;
}

function getSummaryUnitPartRows(unitRow) {
  const enemy = unitRow.enemy;
  const maneuvers = Array.isArray(enemy?.data?.maneuvers)
    ? enemy.data.maneuvers
    : [];
  const aliveLabel = getPartStatusText(enemy);
  const unitMap = enemy.summary_unit_part_states[unitRow.unitKey] || {};
  return maneuvers.filter(hasManeuverName).map((m, index) => {
    const partKey = buildSummaryUnitPartKey(m, index);
    const stateObj = normalizeSummaryUnitPartState(unitMap[partKey]);
    unitMap[partKey] = stateObj;
    enemy.summary_unit_part_states[unitRow.unitKey] = unitMap;
    const basePartName = String(
      (m && (m.name || m.kindName || m.displayName)) || "",
    ).trim();
    const timingText = String((m && m.timing) || "");
    const allowUsedStatus = canUseUsedStatusForManeuver({ timing: timingText });
    if (!allowUsedStatus && stateObj.status === "使用") {
      stateObj.status = "無事";
    }
    const partName = stateObj.nameOverride || basePartName;
    return {
      id: unitRow.id,
      slotIndex: unitRow.slotIndex,
      unitIndex: unitRow.unitIndex,
      unitKey: unitRow.unitKey,
      partKey,
      enemyName: unitRow.rowName,
      place: unitRow.place,
      unitLabel: unitRow.unitLabel,
      classType: String(unitRow.classType || ""),
      aliveLabel,
      partType: sanitizePartType((m && m.partType) || "", "胴"),
      partName,
      basePartName,
      timing: timingText,
      cost: String((m && m.cost) || ""),
      range: String((m && m.range) || ""),
      effect: String((m && m.effect) || ""),
      allowUsedStatus,
      status: stateObj.status,
      reportChecked: !!stateObj.reportChecked,
    };
  });
}

function buildSummaryPartStatusTextFromRows(partRows) {
  if (!Array.isArray(partRows) || !partRows.length) return "残存パーツ --/--";
  const max = partRows.length;
  const now = partRows.reduce(
    (acc, row) =>
      acc + (String((row && row.status) || "無事") === "損傷" ? 0 : 1),
    0,
  );
  return `残存パーツ ${now}/${max}`;
}

function summaryPartAllowsUsedStatus(enemy, partKey) {
  const key = String(partKey || "").trim();
  if (!key) return true;
  const maneuvers = Array.isArray(enemy?.data?.maneuvers)
    ? enemy.data.maneuvers.filter(hasManeuverName)
    : [];
  for (let i = 0; i < maneuvers.length; i += 1) {
    const m = maneuvers[i];
    if (buildSummaryUnitPartKey(m, i) === key) {
      return canUseUsedStatusForManeuver(m);
    }
  }
  return true;
}

function calcSummaryUnitInitiative(unitRow, partRows = null) {
  const enemy = unitRow && unitRow.enemy;
  const maneuvers = Array.isArray(enemy?.data?.maneuvers)
    ? enemy.data.maneuvers.filter(hasManeuverName)
    : [];
  const base = 6 + (String(enemy && enemy.class_type) === "レギオン" ? 2 : 0);
  if (!maneuvers.length) return base;

  const stateRows = Array.isArray(partRows)
    ? partRows
    : getSummaryUnitPartRows(unitRow);
  const statusMap = new Map(
    stateRows.map((row) => [
      String(row.partKey || ""),
      String(row.status || ""),
    ]),
  );

  const addInitiativeByRule = (acc, n, status) => {
    if (!Number.isFinite(n)) return acc;
    if (n < 0) {
      if (status === "損傷") return acc + Math.abs(n);
      return acc;
    }
    if (n > 0) return acc + n;
    return acc;
  };

  const hasManeuverInitiative = maneuvers.some((m) => {
    const n = Number((m && m.initiative) || 0);
    return Number.isFinite(n) && n !== 0;
  });
  const shouldUseMasterFallback = !hasManeuverInitiative;

  const delta = maneuvers.reduce((acc, m, index) => {
    const partKey = buildSummaryUnitPartKey(m, index);
    const status = String(statusMap.get(partKey) || (m && m.status) || "");
    const direct = Number((m && m.initiative) || 0);
    if (Number.isFinite(direct) && (direct !== 0 || !shouldUseMasterFallback)) {
      return addInitiativeByRule(acc, direct, status);
    }
    if (!shouldUseMasterFallback) return acc;
    const key = String(
      (m && (m.kindName || m.name || m.displayName)) || "",
    ).trim();
    if (!key) return acc;
    const master = state.maneuverMasterMap.get(key);
    if (!master) return acc;
    const masterIni = Number(master.initiative || 0);
    return addInitiativeByRule(acc, masterIni, status);
  }, 0);

  return base + delta;
}

function buildSummaryCheckedPartCopyText(partRows) {
  return partRows
    .map((row) => {
      const status = String((row && row.status) || "無事");
      const mark = status === "損傷" ? "❌" : status === "使用" ? "✅" : "⭕";
      return `${mark}${row.partType}【${row.partName}】《${row.timing}/${row.cost}/${row.range}》${row.effect}`;
    })
    .join("\n");
}

function buildEnemySummaryRows() {
  const rows = [];
  state.enemies
    .filter((enemy) => !isNoNameServantPlaceholder(enemy))
    .forEach((enemy) => {
      const baseMalice = calcMalice(enemy);
      const slots = Array.isArray(enemy.summary_slots)
        ? enemy.summary_slots
        : [];
      slots.forEach((slot, index) => {
        const units = Number((slot && slot.unit_count) || 1);
        const normalizedUnits =
          Number.isFinite(units) && units > 0 ? Math.floor(units) : 1;
        const place = String((slot && slot.place) || getEnemyPlace(enemy));
        const normalizedPlace = PLACE_TYPES.includes(place) ? place : "煉獄";
        const totalMalice = baseMalice * normalizedUnits;
        const baseName = String(enemy.name || "(no name)");
        rows.push({
          id: String(enemy.ID || ""),
          slotIndex: index,
          rowKey: `${String(enemy.ID || "")}:${index}`,
          name: baseName,
          displayName: baseName,
          classType: String(enemy.class_type || ""),
          place: normalizedPlace,
          units: normalizedUnits,
          malice: baseMalice,
          totalMalice,
          damageStatus: getPartStatusText(enemy),
        });
      });
    });

  const nameMap = new Map();
  rows.forEach((row) => {
    if (String(row.classType || "") === "レギオン") return;
    const key = String(row.name || "").trim();
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key).push(row);
  });
  nameMap.forEach((sameNameRows) => {
    if (!Array.isArray(sameNameRows) || sameNameRows.length <= 1) return;
    sameNameRows.forEach((row, i) => {
      row.displayName = `${row.name} ${getAlphabetIndexLabel(i)}`;
    });
  });

  const allMalice = rows.reduce((sum, row) => sum + row.totalMalice, 0);
  rows.forEach((row) => {
    row.scoreText = calcSummaryScore(row.totalMalice, allMalice);
  });
  return { rows, allMalice };
}

function renderSummaryPanel() {
  if (
    !el.summaryEnemiesBody ||
    !el.summaryPlaceGrid ||
    !el.summaryDamageUnitList
  )
    return;
  const { rows, allMalice } = buildEnemySummaryRows();
  const unitRows = getSummaryUnitRows(rows);
  const playerCount = normalizeSummaryPlayerCount(state.summaryPlayerCount);
  const karmaCount = normalizeSummaryKarmaCount(state.summaryKarmaCount);
  state.summaryPlayerCount = playerCount;
  state.summaryKarmaCount = karmaCount;
  const baseParts = Math.ceil(allMalice / 1);
  const enhancedParts = Math.ceil(allMalice / 2);
  const favorPointsRaw = allMalice / playerCount + karmaCount * 2;
  const favorPoints = Number.isFinite(favorPointsRaw)
    ? Number.isInteger(favorPointsRaw)
      ? String(favorPointsRaw)
      : favorPointsRaw.toFixed(2)
    : "0";

  if (el.summaryTotalMalice)
    el.summaryTotalMalice.textContent = String(allMalice);
  if (el.summaryFavorPoints) el.summaryFavorPoints.textContent = favorPoints;
  if (el.summaryPlayerCountInput)
    el.summaryPlayerCountInput.value = String(playerCount);
  if (el.summaryKarmaCountInput)
    el.summaryKarmaCountInput.value = String(karmaCount);
  if (el.summaryBaseParts) el.summaryBaseParts.textContent = String(baseParts);
  if (el.summaryEnhancedParts)
    el.summaryEnhancedParts.textContent = String(enhancedParts);

  el.summaryEnemiesBody.innerHTML = "";
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    const placeOptions = PLACE_TYPES.map(
      (p) =>
        `<option value="${escapeHtml(p)}" ${
          p === row.place ? "selected" : ""
        }>${escapeHtml(p)}</option>`,
    ).join("");
    tr.innerHTML = `
      <td>${escapeHtml(row.totalMalice)}</td>
      <td>${escapeHtml(row.malice)}</td>
      <td><input class="summary-unit-input" type="number" min="1" step="1" data-summary-id="${escapeHtml(row.id)}" data-summary-slot="${escapeHtml(row.slotIndex)}" data-summary-key="unit_count" value="${escapeHtml(row.units)}"></td>
      <td>${escapeHtml(row.classType)}</td>
      <td><select class="summary-place-select" data-summary-id="${escapeHtml(row.id)}" data-summary-slot="${escapeHtml(row.slotIndex)}" data-summary-key="place">${placeOptions}</select></td>
      <td>
        <div class="summary-name-cell-wrap">
          <span class="summary-name-text">${escapeHtml(row.displayName || row.name)}</span>
          <span class="summary-row-actions">
            <button type="button" class="small-square-btn summary-row-action-btn" data-summary-copy-memo-id="${escapeHtml(row.id)}" data-summary-copy-memo-slot="${escapeHtml(row.slotIndex)}" title="コマ状態コピー"><i class="fa-solid fa-note-sticky" aria-hidden="true"></i><span>状態コピー</span></button>
            <button type="button" class="small-square-btn summary-row-action-btn" data-summary-copy-koma-json-id="${escapeHtml(row.id)}" title="コマJSON出力"><i class="fa-solid fa-file-export" aria-hidden="true"></i><span>JSON出力</span></button>
            <button type="button" class="small-square-btn summary-remove-btn" data-summary-remove-id="${escapeHtml(row.id)}" data-summary-remove-slot="${escapeHtml(row.slotIndex)}" title="配置から除外"><i class="fa-solid fa-trash" aria-hidden="true"></i><span>配置除外</span></button>
          </span>
        </div>
      </td>
    `;
    el.summaryEnemiesBody.appendChild(tr);
  });

  const availableTabKeys = rows.map((row) => String(row.rowKey || ""));
  if (
    !state.summaryDamageTabKey ||
    !availableTabKeys.includes(state.summaryDamageTabKey)
  ) {
    state.summaryDamageTabKey = availableTabKeys[0] || "";
  }

  el.summaryDamageUnitList.innerHTML = "";
  if (!rows.length) {
    state.summaryDamageTabKey = "";
    el.summaryDamageUnitList.innerHTML =
      '<div class="summary-place-empty">（まとめに追加した手駒がありません）</div>';
  } else {
    const tabsWrap = document.createElement("div");
    tabsWrap.className = "summary-damage-tabs";
    tabsWrap.setAttribute("role", "tablist");
    rows.forEach((row) => {
      const key = String(row.rowKey || "");
      const btn = document.createElement("button");
      const classKey =
        row.classType === "レギオン"
          ? "legion"
          : row.classType === "ホラー"
            ? "horror"
            : row.classType === "サヴァント"
              ? "servant"
              : "other";
      const dotClass = `summary-place-dot is-${classKey}`;
      const classMark =
        classKey === "legion"
          ? "L"
          : classKey === "horror"
            ? "H"
            : classKey === "servant"
              ? "S"
              : "?";
      btn.type = "button";
      btn.className = `summary-damage-tab-btn${
        key === state.summaryDamageTabKey ? " is-active" : ""
      }`;
      btn.setAttribute("data-summary-damage-tab", key);
      btn.setAttribute(
        "aria-selected",
        key === state.summaryDamageTabKey ? "true" : "false",
      );
      btn.innerHTML = `<span class="${escapeHtml(dotClass)}" aria-hidden="true">${escapeHtml(classMark)}</span><span>${escapeHtml(formatSummaryDamageDisplayName(row))}</span>`;
      tabsWrap.appendChild(btn);
    });
    el.summaryDamageUnitList.appendChild(tabsWrap);

    const panel = document.createElement("div");
    panel.className = "summary-damage-tab-panel";
    el.summaryDamageUnitList.appendChild(panel);

    const targetKey = String(state.summaryDamageTabKey || "");
    const tabUnitRows = unitRows.filter(
      (unitRow) =>
        `${String(unitRow.id)}:${Number(unitRow.slotIndex)}` === targetKey,
    );

    if (!tabUnitRows.length) {
      panel.innerHTML =
        '<div class="summary-place-empty">（この手駒の個体がありません）</div>';
    } else {
      tabUnitRows.forEach((unitRow) => {
        const partRows = getSummaryUnitPartRows(unitRow);
        const partStatusText = buildSummaryPartStatusTextFromRows(partRows);
        const currentInitiative = calcSummaryUnitInitiative(unitRow, partRows);
        const article = document.createElement("article");
        article.className = "summary-damage-unit-card";
        article.innerHTML = `
        <header class="summary-damage-unit-header">
          <div>
            <strong>${escapeHtml(unitRow.unitDisplayName || unitRow.rowName)}</strong>
            <span class="summary-damage-unit-meta">${escapeHtml(unitRow.place)} / ${escapeHtml(partStatusText)}<span class="summary-damage-unit-initiative"> / 現在行動値:${escapeHtml(currentInitiative)}</span></span>
          </div>
          <div class="summary-unit-header-actions">
            <button type="button" class="small-square-btn summary-unit-copy-btn" data-summary-unit-memo-id="${escapeHtml(unitRow.id)}" data-summary-unit-memo-slot="${escapeHtml(unitRow.slotIndex)}" data-summary-unit-memo-unit="${escapeHtml(unitRow.unitIndex)}" title="コマ状態コピー"><i class="fa-solid fa-note-sticky" aria-hidden="true"></i><span>状態コピー</span></button>
            <button type="button" class="small-square-btn summary-unit-copy-btn" data-summary-unit-clear-check-id="${escapeHtml(unitRow.id)}" data-summary-unit-clear-check-slot="${escapeHtml(unitRow.slotIndex)}" data-summary-unit-clear-check-unit="${escapeHtml(unitRow.unitIndex)}" title="チェック解除"><i class="fa-solid fa-eraser" aria-hidden="true"></i><span>チェック解除</span></button>
            ${
              unitRow.classType === "レギオン"
                ? ""
                : `<button type="button" class="small-square-btn summary-unit-copy-btn" data-summary-unit-copy-id="${escapeHtml(unitRow.id)}" data-summary-unit-copy-slot="${escapeHtml(unitRow.slotIndex)}" data-summary-unit-copy-unit="${escapeHtml(unitRow.unitIndex)}" title="チェック行をコピー"><i class="fa-solid fa-copy" aria-hidden="true"></i><span>チェック分コピー</span></button>`
            }
          </div>
        </header>
        <div class="table-wrap summary-unit-parts-wrap">
          <table class="asian-table summary-unit-parts-table">
            <colgroup>
              <col class="col-report">
              <col class="col-copy">
              <col class="col-state">
              <col class="col-part">
              <col class="col-name">
              <col class="col-timing">
              <col class="col-cost">
              <col class="col-range">
              <col class="col-effect">
            </colgroup>
            <thead>
              <tr>
                <th>チェック</th>
                <th>コピー</th>
                <th>状態</th>
                <th>部位</th>
                <th>名称</th>
                <th>タイミング</th>
                <th>コスト</th>
                <th>射程</th>
                <th>効果</th>
              </tr>
            </thead>
            <tbody>
              ${partRows
                .map((row) => {
                  const statusClass = getManeuverStatusClass(
                    row.status || "無事",
                  );
                  const allowUsedStatus = !!row.allowUsedStatus;
                  const isLegion = row.classType === "レギオン";
                  const isHorror = row.classType === "ホラー";
                  const rowToneClass = getPartTypeToneClass(row.partType);
                  const partTypeText = String(row.partType || "-");
                  return `<tr class="${escapeHtml(rowToneClass)}">
                    <td><input class="summary-damage-check" type="checkbox" data-summary-part-id="${escapeHtml(row.id)}" data-summary-part-slot="${escapeHtml(row.slotIndex)}" data-summary-part-unit="${escapeHtml(row.unitIndex)}" data-summary-part-key="${escapeHtml(row.partKey)}" data-summary-part-prop="reportChecked" ${row.reportChecked ? "checked" : ""}></td>
                    <td><button type="button" class="small-square-btn summary-part-copy-btn" data-summary-part-copy-id="${escapeHtml(row.id)}" data-summary-part-copy-slot="${escapeHtml(row.slotIndex)}" data-summary-part-copy-unit="${escapeHtml(row.unitIndex)}" data-summary-part-copy-key="${escapeHtml(row.partKey)}" title="この行をコピー" aria-label="この行をコピー"><i class="fa-solid fa-copy" aria-hidden="true"></i></button></td>
                    <td>${isLegion ? "-" : `<select class="status-select ${statusClass}" data-summary-part-id="${escapeHtml(row.id)}" data-summary-part-slot="${escapeHtml(row.slotIndex)}" data-summary-part-unit="${escapeHtml(row.unitIndex)}" data-summary-part-key="${escapeHtml(row.partKey)}" data-summary-part-prop="status"><option value="無事" ${row.status === "無事" ? "selected" : ""}>無事</option>${allowUsedStatus ? `<option value="使用" ${row.status === "使用" ? "selected" : ""}>使用</option>` : ""}<option value="損傷" ${row.status === "損傷" ? "selected" : ""}>損傷</option></select>`}</td>
                    <td>${isLegion || isHorror ? "-" : escapeHtml(partTypeText)}</td>
                    <td><input type="text" class="summary-part-name-input" value="${escapeHtml(row.partName)}" data-summary-part-id="${escapeHtml(row.id)}" data-summary-part-slot="${escapeHtml(row.slotIndex)}" data-summary-part-unit="${escapeHtml(row.unitIndex)}" data-summary-part-key="${escapeHtml(row.partKey)}" data-summary-part-prop="nameOverride" placeholder="名称"></td>
                    <td>${escapeHtml(row.timing)}</td>
                    <td>${escapeHtml(row.cost)}</td>
                    <td>${escapeHtml(row.range)}</td>
                    <td>${escapeHtml(row.effect)}</td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      `;
        panel.appendChild(article);
      });
    }
  }

  const byPlace = new Map(PLACE_TYPES.map((p) => [p, []]));
  rows.forEach((row) => {
    const list = byPlace.get(row.place);
    if (list) {
      const classType = String(row.classType || "").trim();
      const classKey =
        classType === "レギオン"
          ? "legion"
          : classType === "ホラー"
            ? "horror"
            : classType === "サヴァント"
              ? "servant"
              : "other";
      list.push({
        id: row.id,
        slotIndex: row.slotIndex,
        name: row.displayName || row.name,
        classType,
        classKey,
        damageStatus: row.damageStatus || "-",
        units: row.units,
      });
    }
  });
  el.summaryPlaceGrid.innerHTML = "";
  PLACE_TYPES.forEach((place) => {
    const card = document.createElement("article");
    card.className = `summary-place-card place-${place}`;
    const items = byPlace.get(place) || [];
    card.innerHTML = `
      <header>${escapeHtml(place)}</header>
      <div class="summary-place-body">${
        items.length
          ? `<div class="summary-place-item-line">${items
              .map((item, idx) => {
                const badgeClass = `summary-place-badge is-${item.classKey || "other"}`;
                const dotClass = `summary-place-dot is-${item.classKey || "other"}`;
                const classMark =
                  item.classKey === "legion"
                    ? "L"
                    : item.classKey === "horror"
                      ? "H"
                      : item.classKey === "servant"
                        ? "S"
                        : "?";
                return `<span class="summary-place-badge" draggable="true" data-drag-id="${escapeHtml(
                  item.id || "",
                )}" data-drag-slot="${escapeHtml(item.slotIndex)}" data-drag-place="${escapeHtml(
                  place,
                )}" data-drag-index="${escapeHtml(idx)}" title="${escapeHtml(
                  `${item.classType || "-"} / ${item.damageStatus || "-"}`,
                )}" data-class-type="${escapeHtml(item.classType || "")}"><span class="${escapeHtml(dotClass)}" aria-hidden="true">${escapeHtml(classMark)}</span><span class="summary-place-badge-name">${escapeHtml(item.name || "")}</span><span class="summary-place-badge-count">×${escapeHtml(item.units || 0)}</span></span>`.replace(
                  'class="summary-place-badge"',
                  `class="${escapeHtml(badgeClass)}"`,
                );
              })
              .join("")}</div>`
          : '<div class="summary-place-empty">（なし）</div>'
      }</div>
    `;
    el.summaryPlaceGrid.appendChild(card);
  });

  bindSummaryBadgeDnD();
}

function bindSummaryBadgeDnD() {
  if (!el.summaryPlaceGrid) return;
  let dragging = null;

  el.summaryPlaceGrid
    .querySelectorAll(".summary-place-badge")
    .forEach((badge) => {
      badge.addEventListener("dragstart", (event) => {
        const target = event.currentTarget;
        if (!(target instanceof HTMLElement)) return;
        const enemyId = String(
          target.getAttribute("data-drag-id") || "",
        ).trim();
        const slotIndex = Number(target.getAttribute("data-drag-slot"));
        const fromPlace = String(
          target.getAttribute("data-drag-place") || "",
        ).trim();
        if (!enemyId || Number.isNaN(slotIndex)) return;
        dragging = { enemyId, slotIndex, fromPlace };
        target.classList.add("is-dragging");
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", `${enemyId}:${slotIndex}`);
        }
      });

      badge.addEventListener("dragend", (event) => {
        const target = event.currentTarget;
        if (target instanceof HTMLElement)
          target.classList.remove("is-dragging");
        dragging = null;
      });
    });

  el.summaryPlaceGrid
    .querySelectorAll(".summary-place-card")
    .forEach((card) => {
      card.addEventListener("dragover", (event) => {
        if (!dragging) return;
        event.preventDefault();
        card.classList.add("is-drop-target");
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      });
      card.addEventListener("dragleave", () => {
        card.classList.remove("is-drop-target");
      });
      card.addEventListener("drop", (event) => {
        card.classList.remove("is-drop-target");
        if (!dragging) return;
        event.preventDefault();
        const header = card.querySelector("header");
        const toPlaceRaw =
          header instanceof HTMLElement ? String(header.textContent || "") : "";
        const toPlace = PLACE_TYPES.includes(toPlaceRaw) ? toPlaceRaw : "";
        if (!toPlace) return;
        const enemy = state.enemies.find(
          (e) => String((e && e.ID) || "") === dragging.enemyId,
        );
        if (!enemy || !Array.isArray(enemy.summary_slots)) return;
        const slot = enemy.summary_slots[dragging.slotIndex];
        if (!slot) return;
        slot.place = toPlace;
        enemy.time = nowIsoLocal();
        saveSummaryLayoutToLocal();
        scheduleSaveToDb();
        scheduleSummaryRenders({ includeList: true });
        dragging = null;
      });
    });
}

function handleSummaryTableChange(event) {
  const target = event.target;
  if (
    !(target instanceof HTMLInputElement) &&
    !(target instanceof HTMLSelectElement)
  )
    return;
  const id = String(target.getAttribute("data-summary-id") || "").trim();
  const slotIndex = Number(target.getAttribute("data-summary-slot"));
  const key = String(target.getAttribute("data-summary-key") || "").trim();
  if (!id || !key || Number.isNaN(slotIndex)) return;
  const enemy = state.enemies.find((e) => String(e && e.ID) === id);
  if (!enemy) return;
  if (!Array.isArray(enemy.summary_slots)) enemy.summary_slots = [];
  const slot = enemy.summary_slots[slotIndex];
  if (!slot) return;

  if (key === "unit_count") {
    const n = Number(target.value || 1);
    const normalized = Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
    slot.unit_count = normalized;
    target.value = String(normalized);
  }
  if (key === "place") {
    const place = String(target.value || "").trim();
    slot.place = PLACE_TYPES.includes(place) ? place : "煉獄";
    if (target instanceof HTMLSelectElement) target.value = slot.place;
  }

  enemy.time = nowIsoLocal();
  if (String(enemy.ID) === String(state.selectedId)) {
    if (el.fields.time) el.fields.time.value = enemy.time;
    if (el.fields.timeText)
      el.fields.timeText.textContent = formatDateTimeDisplay(enemy.time);
  }
  scheduleSaveToDb();
  saveSummaryLayoutToLocal();
  scheduleSummaryRenders({ includeList: true });
}

function handleSummaryTableClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const copyMemoBtn = target.closest("[data-summary-copy-memo-id]");
  if (copyMemoBtn instanceof HTMLElement) {
    const id = String(
      copyMemoBtn.getAttribute("data-summary-copy-memo-id") || "",
    ).trim();
    if (!id) return;
    const enemy = state.enemies.find((e) => String(e && e.ID) === id);
    if (!enemy) return;
    const text = buildKomaMemo(enemy);
    writeClipboardText(text)
      .then(() => {
        showToast("コマ状態をコピーした", "info");
      })
      .catch(() => {
        showToast("コピー失敗。コンソールに出力する", "error");
        console.log(text);
      });
    return;
  }

  const copyKomaJsonBtn = target.closest("[data-summary-copy-koma-json-id]");
  if (copyKomaJsonBtn instanceof HTMLElement) {
    const id = String(
      copyKomaJsonBtn.getAttribute("data-summary-copy-koma-json-id") || "",
    ).trim();
    if (!id) return;
    const enemy = state.enemies.find((e) => String(e && e.ID) === id);
    if (!enemy) return;
    const text = JSON.stringify(buildKomaCharacterJson(enemy), null, 2);
    writeClipboardText(text)
      .then(() => {
        showKomaJsonCopySuccessToast();
      })
      .catch(() => {
        showToast("コピー失敗。コンソールに出力する", "error");
        console.log(text);
      });
    return;
  }

  const btn = target.closest("[data-summary-remove-id]");
  if (!(btn instanceof HTMLElement)) return;
  const id = String(btn.getAttribute("data-summary-remove-id") || "").trim();
  const slotIndex = Number(btn.getAttribute("data-summary-remove-slot"));
  if (!id || Number.isNaN(slotIndex)) return;
  const enemy = state.enemies.find((e) => String(e && e.ID) === id);
  if (!enemy) return;
  if (!Array.isArray(enemy.summary_slots)) enemy.summary_slots = [];
  enemy.summary_slots.splice(slotIndex, 1);
  enemy.time = nowIsoLocal();
  saveSummaryLayoutToLocal();
  scheduleSaveToDb();
  scheduleSummaryRenders({ includeList: true });
}

function handleSummaryDamageInput(event) {
  const target = event.target;
  if (
    !(target instanceof HTMLInputElement) &&
    !(target instanceof HTMLSelectElement)
  )
    return;
  const id = String(target.getAttribute("data-summary-part-id") || "").trim();
  const slotIndex = Number(target.getAttribute("data-summary-part-slot"));
  const unitIndex = Number(target.getAttribute("data-summary-part-unit"));
  const partKey = String(
    target.getAttribute("data-summary-part-key") || "",
  ).trim();
  const prop = String(
    target.getAttribute("data-summary-part-prop") || "",
  ).trim();
  if (!id || Number.isNaN(slotIndex) || Number.isNaN(unitIndex)) return;
  const enemy = state.enemies.find((e) => String((e && e.ID) || "") === id);
  if (!enemy) return;
  if (
    !enemy.summary_unit_part_states ||
    typeof enemy.summary_unit_part_states !== "object"
  ) {
    enemy.summary_unit_part_states = {};
  }
  const unitKey = buildSummaryUnitKey(slotIndex, unitIndex);
  if (
    !enemy.summary_unit_part_states[unitKey] ||
    typeof enemy.summary_unit_part_states[unitKey] !== "object"
  ) {
    enemy.summary_unit_part_states[unitKey] = {};
  }
  const unitMap = enemy.summary_unit_part_states[unitKey];
  const current = normalizeSummaryUnitPartState(unitMap[partKey]);
  if (prop === "status" && target instanceof HTMLSelectElement) {
    const prevStatus = String(current.status || "無事");
    const s = String(target.value || "無事").trim();
    const allowUsed = summaryPartAllowsUsedStatus(enemy, partKey);
    current.status =
      s === "損傷" ? "損傷" : allowUsed && s === "使用" ? "使用" : "無事";
    current.reportChecked =
      getNechronicaShared().resolveReportCheckedOnDamageTransition(
        prevStatus,
        current.status,
        current.reportChecked,
        "損傷",
      );
    const rowEl = target.closest("tr");
    const checkEl =
      rowEl && rowEl.querySelector
        ? rowEl.querySelector(".summary-damage-check")
        : null;
    if (checkEl instanceof HTMLInputElement) {
      checkEl.checked = !!current.reportChecked;
    }
    target.classList.remove("status-safe", "status-used", "status-damaged");
    target.classList.add(getManeuverStatusClass(current.status));
  } else if (prop === "reportChecked" && target instanceof HTMLInputElement) {
    current.reportChecked = !!target.checked;
  } else if (prop === "nameOverride" && target instanceof HTMLInputElement) {
    const typed = String(target.value || "").trim();
    current.nameOverride = typed;
  }
  unitMap[partKey] = current;
  enemy.time = nowIsoLocal();
  scheduleSaveToDb();
  if (prop === "status") {
    scheduleSummaryRenders({ includeList: false, delayMs: 30 });
  }
}

function clearSummaryUnitCheckedRows(enemy, slotIndex, unitIndex) {
  if (
    !enemy ||
    Number.isNaN(Number(slotIndex)) ||
    Number.isNaN(Number(unitIndex))
  ) {
    return;
  }
  if (
    !enemy.summary_unit_part_states ||
    typeof enemy.summary_unit_part_states !== "object"
  ) {
    enemy.summary_unit_part_states = {};
  }
  const unitKey = buildSummaryUnitKey(slotIndex, unitIndex);
  const unitMap = enemy.summary_unit_part_states[unitKey];
  if (unitMap && typeof unitMap === "object") {
    Object.keys(unitMap).forEach((partKey) => {
      const entry = normalizeSummaryUnitPartState(unitMap[partKey]);
      entry.reportChecked = false;
      unitMap[partKey] = entry;
    });
  }
}

function handleSummaryDamageClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const tabBtn = target.closest("[data-summary-damage-tab]");
  if (tabBtn instanceof HTMLButtonElement) {
    const key = String(
      tabBtn.getAttribute("data-summary-damage-tab") || "",
    ).trim();
    if (!key) return;
    state.summaryDamageTabKey = key;
    scheduleSummaryRenders({ includeList: false, immediate: true });
    return;
  }

  const memoBtn = target.closest("[data-summary-unit-memo-id]");
  if (memoBtn instanceof HTMLButtonElement) {
    const id = String(
      memoBtn.getAttribute("data-summary-unit-memo-id") || "",
    ).trim();
    if (!id) return;
    const enemy = state.enemies.find((e) => String((e && e.ID) || "") === id);
    if (!enemy) return;
    const text = buildKomaMemo(enemy);
    writeClipboardText(text)
      .then(() => {
        const original = memoBtn.textContent;
        memoBtn.textContent = "完了";
        showToast("コマ状態をコピーした", "info");
        setTimeout(() => {
          memoBtn.textContent = original;
        }, 1200);
      })
      .catch(() => {
        showToast("コピー失敗", "error");
      });
    return;
  }

  const clearCheckBtn = target.closest("[data-summary-unit-clear-check-id]");
  if (clearCheckBtn instanceof HTMLButtonElement) {
    const id = String(
      clearCheckBtn.getAttribute("data-summary-unit-clear-check-id") || "",
    ).trim();
    const slotIndex = Number(
      clearCheckBtn.getAttribute("data-summary-unit-clear-check-slot"),
    );
    const unitIndex = Number(
      clearCheckBtn.getAttribute("data-summary-unit-clear-check-unit"),
    );
    if (!id || Number.isNaN(slotIndex) || Number.isNaN(unitIndex)) return;
    const enemy = state.enemies.find((e) => String((e && e.ID) || "") === id);
    if (!enemy) return;
    clearSummaryUnitCheckedRows(enemy, slotIndex, unitIndex);
    enemy.time = nowIsoLocal();
    scheduleSaveToDb();
    scheduleSummaryRenders({ includeList: true });
    return;
  }

  const partCopyBtn = target.closest("[data-summary-part-copy-id]");
  if (partCopyBtn instanceof HTMLButtonElement) {
    const id = String(
      partCopyBtn.getAttribute("data-summary-part-copy-id") || "",
    ).trim();
    const slotIndex = Number(
      partCopyBtn.getAttribute("data-summary-part-copy-slot"),
    );
    const unitIndex = Number(
      partCopyBtn.getAttribute("data-summary-part-copy-unit"),
    );
    const partKey = String(
      partCopyBtn.getAttribute("data-summary-part-copy-key") || "",
    ).trim();
    if (!id || Number.isNaN(slotIndex) || Number.isNaN(unitIndex) || !partKey)
      return;
    const summaryRows = buildEnemySummaryRows().rows;
    const unitRows = getSummaryUnitRows(summaryRows);
    const unitRow = unitRows.find(
      (r) =>
        String(r.id) === id &&
        Number(r.slotIndex) === slotIndex &&
        Number(r.unitIndex) === unitIndex,
    );
    if (!unitRow) return;
    const row = getSummaryUnitPartRows(unitRow).find(
      (part) => String(part.partKey) === partKey,
    );
    if (!row) return;
    const text = buildSummaryCheckedPartCopyText([row]);
    writeClipboardText(text)
      .then(() => {
        const originalHtml = partCopyBtn.innerHTML;
        partCopyBtn.textContent = "完了";
        showToast("チェック行をコピーした", "info");
        setTimeout(() => {
          partCopyBtn.innerHTML = originalHtml;
        }, 1200);
      })
      .catch(() => {
        showToast("コピー失敗", "error");
      });
    return;
  }

  const btn = target.closest("[data-summary-unit-copy-id]");
  if (!(btn instanceof HTMLButtonElement)) return;
  const id = String(btn.getAttribute("data-summary-unit-copy-id") || "").trim();
  const slotIndex = Number(btn.getAttribute("data-summary-unit-copy-slot"));
  const unitIndex = Number(btn.getAttribute("data-summary-unit-copy-unit"));
  if (!id || Number.isNaN(slotIndex) || Number.isNaN(unitIndex)) return;
  const summaryRows = buildEnemySummaryRows().rows;
  const unitRows = getSummaryUnitRows(summaryRows);
  const unitRow = unitRows.find(
    (r) =>
      String(r.id) === id &&
      Number(r.slotIndex) === slotIndex &&
      Number(r.unitIndex) === unitIndex,
  );
  if (!unitRow) return;
  const checkedRows = getSummaryUnitPartRows(unitRow).filter(
    (r) => r.reportChecked,
  );
  if (!checkedRows.length) {
    showToast("チェックされた行がありません", "error");
    return;
  }
  const text = buildSummaryCheckedPartCopyText(checkedRows);
  writeClipboardText(text)
    .then(() => {
      const enemy = unitRow.enemy;
      clearSummaryUnitCheckedRows(enemy, slotIndex, unitIndex);
      enemy.time = nowIsoLocal();
      scheduleSaveToDb();
      scheduleSummaryRenders({ includeList: true });
      const original = btn.textContent;
      btn.textContent = "完了";
      showToast("チェック分をコピーした", "info");
      setTimeout(() => {
        btn.textContent = original;
      }, 1200);
    })
    .catch(() => {
      showToast("コピー失敗", "error");
    });
}

function setActivePageTab(tabName) {
  const isSummary = tabName === "summary";
  state.activeTab = isSummary ? "summary" : "editor";
  if (el.summaryTabButton) {
    el.summaryTabButton.classList.toggle("is-active", isSummary);
    el.summaryTabButton.setAttribute(
      "aria-selected",
      isSummary ? "true" : "false",
    );
  }
  if (el.editorTabButton) {
    el.editorTabButton.classList.toggle("is-active", !isSummary);
    el.editorTabButton.setAttribute(
      "aria-selected",
      isSummary ? "false" : "true",
    );
  }
  if (el.summaryTabPanel) el.summaryTabPanel.hidden = !isSummary;
  if (el.editorTabPanel) el.editorTabPanel.hidden = isSummary;
  renderEnemyList();
  if (isSummary) renderSummaryPanel();
}

function appendBasicManeuvers(enemy) {
  if (!enemy || !enemy.data) return;
  if (!Array.isArray(enemy.data.maneuvers)) enemy.data.maneuvers = [];

  const classType = String(enemy.class_type || "").trim();
  const template =
    classType === "ホラー"
      ? HORROR_BASIC_MANEUVERS_TEMPLATE
      : classType === "レギオン"
        ? LEGION_BASIC_MANEUVERS_TEMPLATE
        : SERVANT_BASIC_MANEUVERS_TEMPLATE;

  template.forEach((p) => {
    const row = createEmptyManeuver();
    row.partType = p.type;
    row.name = String(p.name || "");
    row.kindName = String(p.name || "");
    row.displayName = String(p.name || "");
    applyManeuverMasterRow(enemy, row);
    if (typeof p.effect === "string") {
      row.effect = p.effect;
    }
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
  if (el.fields.legionInitiativeBonus) {
    const n = Number(el.fields.legionInitiativeBonus.value || 0);
    current.legion_initiative_bonus = Number.isFinite(n) ? Math.floor(n) : 0;
  } else {
    current.legion_initiative_bonus = Number(
      current.legion_initiative_bonus || 0,
    );
  }
  if (
    !Number.isFinite(Number(current.unit_count)) ||
    Number(current.unit_count) <= 0
  ) {
    current.unit_count = getDefaultUnitCountByClassType(current.class_type);
  }
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
      if (!canUseUsedStatusForManeuver(row) && row.status === "使用") {
        row.status = "無事";
        target.value = "無事";
      }
      row.use = row.status !== "損傷";
      target.classList.remove("status-safe", "status-used", "status-damaged");
      target.classList.add(getManeuverStatusClass(row.status));
    }
    if (kind === "maneuvers" && key === "timing") {
      if (!canUseUsedStatusForManeuver(row) && row.status === "使用") {
        row.status = "無事";
      }
      renderManeuversTable(enemy);
    }
    if (kind === "maneuvers" && key === "partType") {
      row.partType = sanitizePartType(row.partType);
      ensurePartFromManeuver(enemy, row);
      renderManeuversTable(enemy);
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
    const copyButton = target.closest('[data-copy-kind="maneuver-line"]');
    if (copyButton instanceof HTMLElement) {
      const index = Number(copyButton.getAttribute("data-index"));
      if (Number.isNaN(index)) return;
      const enemy = getSelectedEnemy();
      if (!enemy || !enemy.data || !Array.isArray(enemy.data.maneuvers)) return;
      const line = formatManeuverLineForReport(enemy.data.maneuvers[index]);
      if (!line) {
        showToast("コピー対象のマニューバ名が未入力です", "error");
        return;
      }
      writeClipboardText(line)
        .then(() => {
          showToast("選択行をコピーした", "info");
        })
        .catch(() => {
          showToast("コピー失敗。コンソールに出力する", "error");
          console.log(line);
        });
      return;
    }
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
    if (
      target.closest(
        "input, textarea, select, button, [contenteditable='true']",
      )
    ) {
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "none";
      event.preventDefault();
      return;
    }
    if (!target.closest("#maneuversTable .drag-hint")) {
      return;
    }
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
  const bindClick = (element, handler) => {
    if (element) element.addEventListener("click", handler);
  };

  if (el.fields.author) {
    const remembered = getRememberedAuthor();
    if (remembered && !el.fields.author.value) {
      el.fields.author.value = remembered;
    }
  }

  el.enemySearchInput.addEventListener("input", () => {
    state.search = el.enemySearchInput.value || "";
    state.enemyListPage = 1;
    renderEnemyList();
  });

  if (el.enemySearchField) {
    el.enemySearchField.addEventListener("change", () => {
      state.enemySearchField = String(
        el.enemySearchField.value || "all",
      ).trim();
      state.enemyListPage = 1;
      renderEnemyList();
    });
  }

  if (el.enemyPageSizeInput) {
    el.enemyPageSizeInput.addEventListener("change", () => {
      const raw = String(el.enemyPageSizeInput.value || "").trim();
      state.enemyListPageSize = normalizeEnemyListPageSize(raw);
      el.enemyPageSizeInput.value = String(state.enemyListPageSize || 0);
      state.enemyListPage = 1;
      renderEnemyList();
    });
  }

  if (el.enemyShowAllButton) {
    el.enemyShowAllButton.addEventListener("click", () => {
      state.enemyListPageSize = 0;
      state.enemyListPage = 1;
      if (el.enemyPageSizeInput) {
        el.enemyPageSizeInput.value = "0";
      }
      renderEnemyList();
    });
  }

  if (el.enemyShowTenButton) {
    el.enemyShowTenButton.addEventListener("click", () => {
      state.enemyListPageSize = 10;
      state.enemyListPage = 1;
      if (el.enemyPageSizeInput) {
        el.enemyPageSizeInput.value = "10";
      }
      renderEnemyList();
    });
  }

  if (el.enemyListPager) {
    el.enemyListPager.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const btn = target.closest("[data-page-action]");
      if (!(btn instanceof HTMLButtonElement)) return;
      const action = String(btn.getAttribute("data-page-action") || "").trim();
      if (!action) return;
      const pageSize = normalizeEnemyListPageSize(state.enemyListPageSize);
      if (pageSize <= 0) return;
      if (action === "prev") {
        state.enemyListPage = Math.max(1, state.enemyListPage - 1);
      } else if (action === "next") {
        state.enemyListPage += 1;
      }
      renderEnemyList();
    });
  }

  if (el.editorTabButton) {
    el.editorTabButton.addEventListener("click", () => {
      setActivePageTab("editor");
    });
  }
  if (el.summaryTabButton) {
    el.summaryTabButton.addEventListener("click", () => {
      upsertCurrentEnemyFromForm();
      setActivePageTab("summary");
    });
  }
  if (el.copySummaryPartsButton) {
    el.copySummaryPartsButton.addEventListener("click", () => {
      upsertCurrentEnemyFromForm();
      const text = buildSummaryPartsCopyText();
      writeClipboardText(text)
        .then(() => {
          showToast("基本/強化/寵愛をコピーした", "info");
        })
        .catch(() => {
          showToast("コピー失敗。コンソールに出力する", "error");
          console.log(text);
        });
    });
  }

  if (el.clearAllSummaryPlaceButton) {
    el.clearAllSummaryPlaceButton.addEventListener("click", () => {
      state.enemies.forEach((enemy) => {
        enemy.summary_slots = [];
        enemy.time = nowIsoLocal();
      });
      state.summaryDamageTabKey = "";
      saveSummaryLayoutToLocal();
      scheduleSaveToDb();
      renderSummaryPanel();
      renderEnemyList();
    });
  }
  if (el.summaryPlayerCountInput) {
    const handleSummaryPlayerCountInput = () => {
      const normalized = normalizeSummaryPlayerCount(
        el.summaryPlayerCountInput.value,
      );
      state.summaryPlayerCount = normalized;
      el.summaryPlayerCountInput.value = String(normalized);
      renderSummaryPanel();
    };
    el.summaryPlayerCountInput.addEventListener(
      "change",
      handleSummaryPlayerCountInput,
    );
    el.summaryPlayerCountInput.addEventListener(
      "blur",
      handleSummaryPlayerCountInput,
    );
  }
  if (el.summaryKarmaCountInput) {
    const handleSummaryKarmaCountInput = () => {
      const normalized = normalizeSummaryKarmaCount(
        el.summaryKarmaCountInput.value,
      );
      state.summaryKarmaCount = normalized;
      el.summaryKarmaCountInput.value = String(normalized);
      renderSummaryPanel();
    };
    el.summaryKarmaCountInput.addEventListener(
      "change",
      handleSummaryKarmaCountInput,
    );
    el.summaryKarmaCountInput.addEventListener(
      "blur",
      handleSummaryKarmaCountInput,
    );
  }
  if (el.summaryEnemiesBody) {
    el.summaryEnemiesBody.addEventListener("change", handleSummaryTableChange);
    el.summaryEnemiesBody.addEventListener("click", handleSummaryTableClick);
  }
  if (el.summaryDamageUnitList) {
    el.summaryDamageUnitList.addEventListener(
      "input",
      handleSummaryDamageInput,
    );
    el.summaryDamageUnitList.addEventListener(
      "change",
      handleSummaryDamageInput,
    );
    el.summaryDamageUnitList.addEventListener(
      "click",
      handleSummaryDamageClick,
    );
  }

  const handleNewEnemy = () => {
    upsertCurrentEnemyFromForm();
    const fresh = normalizeEnemy(createEnemyTemplate());
    state.enemies.unshift(fresh);
    localUnsavedEnemyIds.add(String(fresh.ID || ""));
    state.selectedId = fresh.ID;
    scheduleSaveToDb();
    renderAll();
    setSaveStatus("idle", "新規作成（未保存）");
  };
  bindClick(el.newEnemyButton, handleNewEnemy);
  bindClick(el.newEnemyButtonBottom, handleNewEnemy);

  const handleDuplicateEnemy = () => {
    upsertCurrentEnemyFromForm();
    const current = getSelectedEnemy();
    if (!current) return;

    const duplicated = JSON.parse(JSON.stringify(current));
    duplicated.ID = getNextId();
    duplicated.name = duplicated.name + "（コピー）";
    duplicated.time = nowIsoLocal();

    state.enemies.unshift(duplicated);
    localUnsavedEnemyIds.add(String(duplicated.ID || ""));
    state.selectedId = duplicated.ID;
    saveLastSelectedId(duplicated.ID);

    scheduleSaveToDb();
    renderAll();
    setSaveStatus("idle", "複製しました（未保存）");
  };
  bindClick(el.duplicateEnemyButton, handleDuplicateEnemy);
  bindClick(el.duplicateEnemyButtonBottom, handleDuplicateEnemy);

  const handleDeleteEnemy = async () => {
    const enemy = getSelectedEnemy();
    if (!enemy || !enemy.ID) return;
    if (
      !window.confirm(
        `「${enemy.name}」を完全に削除しますか？\n(データベースからも削除されます)`,
      )
    )
      return;

    setSaveStatus("saving", "削除中...");
    try {
      const url = buildApiUrl("delete", { id: enemy.ID });
      await fetchApiJson(url);

      state.enemies = state.enemies.filter(
        (e) => String(e.ID) !== String(enemy.ID),
      );
      localUnsavedEnemyIds.delete(String(enemy.ID || ""));
      state.selectedId = state.enemies.length > 0 ? state.enemies[0].ID : null;

      setSaveStatus("ok", "削除完了");
      renderAll();
    } catch (error) {
      console.error("削除失敗:", error);
      setSaveStatus("error", "削除失敗");
      alert("削除に失敗しました: " + error.message);
    }
  };
  bindClick(el.deleteEnemyButton, handleDeleteEnemy);
  bindClick(el.deleteEnemyButtonBottom, handleDeleteEnemy);

  const handleSaveAsEnemy = () => {
    upsertCurrentEnemyFromForm();
    const current = getSelectedEnemy();
    if (!current) return;

    const duplicated = JSON.parse(JSON.stringify(current));
    duplicated.ID = getNextId();
    duplicated.name = duplicated.name + "（コピー）";
    duplicated.time = nowIsoLocal();

    state.enemies.unshift(duplicated);
    localUnsavedEnemyIds.add(String(duplicated.ID || ""));
    state.selectedId = duplicated.ID;
    saveLastSelectedId(duplicated.ID);
    renderAll();
    setSaveStatus("saving", "別名保存中…");
    saveToStorage();
  };
  bindClick(el.saveAsEnemyButtonBottom, handleSaveAsEnemy);

  const handleSaveEnemy = () => {
    upsertCurrentEnemyFromForm();
    setSaveStatus("saving", "保存要求を送信中…");
    saveToStorage();
    renderAll();
  };
  bindClick(el.saveEnemyButton, handleSaveEnemy);
  bindClick(el.saveEnemyButtonBottom, handleSaveEnemy);
  document.addEventListener("keydown", (event) => {
    const key = String(event.key || "").toLowerCase();
    if (!(event.ctrlKey || event.metaKey) || key !== "s") return;
    event.preventDefault();
    handleSaveEnemy();
  });

  const handleReloadEnemyList = async () => {
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
  };
  bindClick(el.reloadEnemyListButton, handleReloadEnemyList);
  bindClick(el.reloadEnemyListButtonBottom, handleReloadEnemyList);

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
      writeClipboardText(pretty)
        .then(() => {
          showToast("選択中エネミーJSONをコピーした", "info");
        })
        .catch(() => {
          showToast("コピー失敗。コンソールに出力する", "error");
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
      writeClipboardText(pretty)
        .then(() => {
          showKomaJsonCopySuccessToast();
        })
        .catch(() => {
          showToast("コピー失敗。コンソールに出力する", "error");
          console.log(pretty);
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
      if (el.fields.legionInitiativeBonusWrap) {
        el.fields.legionInitiativeBonusWrap.hidden =
          String(enemy.class_type || "") !== "レギオン";
      }
      renderManeuversTable(enemy);
      renderCalculatedHeader(enemy);
      renderDataPreview(enemy);
      renderMemoPreview(enemy);
      renderEnemyList();
      scheduleSaveToDb();
    });
  }

  if (el.fields.legionInitiativeBonus) {
    el.fields.legionInitiativeBonus.addEventListener("input", () => {
      const enemy = getSelectedEnemy();
      if (!enemy) return;
      upsertCurrentEnemyFromForm();
      renderCalculatedHeader(enemy);
      renderDataPreview(enemy);
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
  setActivePageTab("editor");
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
  // マスタ読込後に再正規化して、enemies.txt由来の悪意点/行動値を補完
  state.enemies = state.enemies.map((enemy) => normalizeEnemy(enemy));
  setupEvents();

  // 前回開いていたエネミーの復元確認
  const lastId = getLastSelectedId();
  const lastEnemy = lastId
    ? state.enemies.find((e) => String(e.ID) === lastId)
    : null;

  if (lastEnemy && String(lastEnemy.ID) !== String(state.selectedId)) {
    const restore = await showRestoreDialog(lastEnemy);
    if (restore) {
      state.selectedId = lastEnemy.ID;
      saveLastSelectedId(lastEnemy.ID);
    } else {
      // 復元しない場合は新規作成
      const fresh = createEnemyTemplate();
      state.enemies.unshift(normalizeEnemy(fresh));
      localUnsavedEnemyIds.add(String(fresh.ID || ""));
      state.selectedId = fresh.ID;
      saveLastSelectedId(fresh.ID);
    }
  } else if (!state.selectedId) {
    // 記憶がない・対象がない場合で、まだ未選択なら新規作成
    const fresh = createEnemyTemplate();
    state.enemies.unshift(normalizeEnemy(fresh));
    localUnsavedEnemyIds.add(String(fresh.ID || ""));
    state.selectedId = fresh.ID;
    saveLastSelectedId(fresh.ID);
  }

  renderAll();
  if (hasUnsavedChanges) {
    setSaveStatus("idle", "未保存の変更あり");
  } else {
    setSaveStatus("idle", "");
  }
}

document.addEventListener("DOMContentLoaded", boot);

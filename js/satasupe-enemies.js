(function () {
  const STORAGE_KEY = "satasupeEnemySheetsV1";
  const AUTHOR_STORAGE_KEY = "satasupeEnemiesAuthor";
  const API_STORAGE_KEY = "satasupeEnemiesApiUrl";
  const DEFAULT_GAS_WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbxMR7f_pOi14SsAuKvu7YxKVBQZ69dn-TeQpMBxyYzo_pwZmICNZ06cSb8BKQYCM0GuGg/exec";

  const state = {
    sheets: [],
    selectedId: null,
    dirty: false,
    query: "",
  };

  const el = {
    enemyList: document.getElementById("enemyList"),
    enemySearchInput: document.getElementById("enemySearchInput"),
    enemyEditorForm: document.getElementById("enemyEditorForm"),
    saveStatusText: document.getElementById("saveStatusText"),
    newEnemyButton: document.getElementById("newEnemyButton"),
    saveEnemyButton: document.getElementById("saveEnemyButton"),
    saveAsEnemyButton: document.getElementById("saveAsEnemyButton"),
    deleteEnemyButton: document.getElementById("deleteEnemyButton"),
    exportJsonButton: document.getElementById("exportJsonButton"),
    exportKomaJsonButton: document.getElementById("exportKomaJsonButton"),
    importJsonInput: document.getElementById("importJsonInput"),
    addWeaponButton: document.getElementById("addWeaponButton"),
    addOutfitButton: document.getElementById("addOutfitButton"),
    addVehicleButton: document.getElementById("addVehicleButton"),
    addKarmaButton: document.getElementById("addKarmaButton"),
    addHistoryButton: document.getElementById("addHistoryButton"),
    weaponsBody: document.getElementById("weaponsBody"),
    outfitsBody: document.getElementById("outfitsBody"),
    vehiclesBody: document.getElementById("vehiclesBody"),
    karmaBody: document.getElementById("karmaBody"),
    historyBody: document.getElementById("historyBody"),
    hobbiesInput: document.getElementById("field-hobbies"),
    randomLikeAgeButton: document.getElementById("randomLikeAgeButton"),
    openHobbyPickerButton: document.getElementById("openHobbyPickerButton"),
    hobbyDiceGridToggle: document.getElementById("hobbyDiceGridToggle"),
    hobbyPickerPanel: document.getElementById("hobbyPickerPanel"),
    hobbyPickerList: document.getElementById("hobbyPickerList"),
  };

  const body = document.body;
  if (!body || !body.classList.contains("satasupe-enemies-page")) return;

  const ENV_EXP_TABLE = [0, 1, 2, 4, 6, 9, 13, 18, 25, 33];
  const GIFT_EXP_TABLE = [0, 0, 0, 1, 2, 4, 10, 18, 30, 52];
  const HOBBY_GRID_6 = [
    ["イベント", "音楽", "アラサガシ", "アウトドア", "育成", "アダルト"],
    [
      "アブノーマル",
      "好きなタグ",
      "おせっかい",
      "工作",
      "サビシガリヤ",
      "飲食",
    ],
    [
      "カワイイ",
      "トレンド",
      "好きなタグ",
      "スポーツ",
      "ヒマツブシ",
      "ギャンブル",
    ],
    ["トンデモ", "読書", "家事", "同一のタグ", "宗教", "ゴシップ"],
    [
      "マニア",
      "パフォーマンス",
      "ガリ勉",
      "ハイソ",
      "同一のタグ",
      "ファッション",
    ],
    ["ヲタク", "美術", "健康", "旅行", "ワビサビ", "ハプニング"],
  ];
  const HOBBY_GRID_5 = [
    ["エクストリーム", "カワイイ", "トンデモ", "マニア", "ヲタク"],
    ["音楽", "トレンド", "読書", "パフォーマンス", "美術"],
    ["アラサガシ", "おせっかい", "家事", "ガリ勉", "健康"],
    ["アウトドア", "工作", "スポーツ", "ハイソ", "旅行"],
    ["育成", "サビシガリヤ", "ヒマツブシ", "宗教", "ワビサビ"],
    ["アダルト", "飲食", "ギャンブル", "ゴシップ", "ファッション"],
  ];
  const HOBBY_COLOR_CLASSES = [
    "bg-pink",
    "bg-blue",
    "bg-gray",
    "bg-yellow",
    "bg-green",
    "bg-purple",
  ];
  const LIKE_TYPE_OPTIONS = [
    "ダークな",
    "お金持ちな",
    "美形な",
    "知的な",
    "ワイルドな",
    "バランスが取れてる",
  ];
  const LIKE_DETAIL_OPTIONS = ["年下", "同い年", "年上"];

  function nowText() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${y}/${m}/${day} ${h}:${min}:${s}`;
  }

  function uid() {
    return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  function randInt(min, max) {
    const a = Number(min);
    const b = Number(max);
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  function pickRandom(values) {
    if (!Array.isArray(values) || !values.length) return "";
    const i = randInt(0, values.length - 1);
    return String(values[i] || "");
  }

  function createSheetTemplate() {
    return {
      id: `tmp-${uid()}`,
      author: "",
      name: "",
      nameKana: "",
      createdAt: nowText(),
      updatedAt: nowText(),
      base: {
        homeland: "",
        sex: "",
        age: "",
        style: "",
        team: "",
        surface: "",
        alliance: "",
        hierarchy: "",
        likes: "",
        dislikes: "",
      },
      ability: {
        crime: 1,
        life: 1,
        love: 1,
        culture: 1,
        combat: 1,
        body: 1,
        mind: 1,
        powerInit: 1,
        powerAtk: 1,
        powerDes: 1,
      },
      condition: {
        bp: 10,
        mp: 10,
        wallet: 10,
        san: 0,
        cthulhu: 0,
        trauma: "",
        addiction: "",
        prisoner: "",
      },
      home: {
        place: "",
        comfortable: 10,
        security: 10,
      },
      weapons: [],
      outfits: [],
      vehicles: [],
      karma: [],
      history: [],
      memo: "",
      meta: {
        danger: 1,
        karmaValue: 7,
        reaction: "中立",
        size: "M",
        quote: "",
        hobbies: "",
        likeType: "",
        likeDetail: "年上",
        garbageTable: "ガラクタ表",
        expConv: 0,
      },
    };
  }

  function pickExp(table, value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    const idx = Math.max(0, Math.min(table.length - 1, Math.trunc(n)));
    return Number(table[idx] || 0);
  }

  function calcExpConvFromAbility(ability) {
    const a = ability || {};
    const env =
      pickExp(ENV_EXP_TABLE, a.crime) +
      pickExp(ENV_EXP_TABLE, a.life) +
      pickExp(ENV_EXP_TABLE, a.love) +
      pickExp(ENV_EXP_TABLE, a.culture) +
      pickExp(ENV_EXP_TABLE, a.combat);
    const gift =
      pickExp(GIFT_EXP_TABLE, a.body) + pickExp(GIFT_EXP_TABLE, a.mind);
    return env + gift;
  }

  function recomputeDerivedFields(sheet) {
    if (!sheet || typeof sheet !== "object") return;
    if (!sheet.meta || typeof sheet.meta !== "object") sheet.meta = {};
    const karmaRows = Array.isArray(sheet.karma) ? sheet.karma : [];
    const karmaCount = karmaRows.filter((row) =>
      String((row && row.talent) || "").trim(),
    ).length;
    const priceCount = karmaRows.filter((row) =>
      String((row && row.price) || "").trim(),
    ).length;
    sheet.meta.karmaCount = karmaCount;
    sheet.meta.priceCount = priceCount;
    sheet.meta.danger = Math.max(1, karmaCount + priceCount);
    sheet.meta.expConv = calcExpConvFromAbility(sheet.ability || {});
  }

  function renderDerivedFields(sheet) {
    if (!sheet || !el.enemyEditorForm) return;
    const applyNumber = (fieldPath, fallback = 0) => {
      const node = el.enemyEditorForm.querySelector(
        `[data-field="${fieldPath}"]`,
      );
      if (!node) return;
      const v = getByPath(sheet, fieldPath);
      node.value = String(Number(v) || fallback);
    };
    applyNumber("meta.expConv", 0);
    applyNumber("meta.karmaCount", 0);
    applyNumber("meta.priceCount", 0);
    applyNumber("meta.danger", 1);
  }

  function normalizeHobbyValues(rawText) {
    return String(rawText || "")
      .split(/[\n,、\s]+/)
      .map((v) => String(v || "").trim())
      .filter(Boolean);
  }

  function closeHobbyPicker() {
    if (el.hobbyPickerPanel) {
      el.hobbyPickerPanel.hidden = true;
    }
  }

  function renderHobbyPicker() {
    if (!el.hobbyPickerList || !el.hobbiesInput) return;
    const selectedSet = new Set(normalizeHobbyValues(el.hobbiesInput.value));
    el.hobbyPickerList.innerHTML = "";
    const useDiceGrid =
      !el.hobbyDiceGridToggle || el.hobbyDiceGridToggle.checked;
    const table = useDiceGrid ? HOBBY_GRID_6 : HOBBY_GRID_5;

    el.hobbyPickerList.classList.remove("is-dice-grid", "is-plain-grid");
    el.hobbyPickerList.classList.add(
      useDiceGrid ? "is-dice-grid" : "is-plain-grid",
    );

    if (useDiceGrid) {
      const firstRollTitle = document.createElement("div");
      firstRollTitle.className = "hobby-grid-header-cell hobby-grid-roll-title";
      firstRollTitle.style.gridColumn = "2 / span 7";
      firstRollTitle.style.gridRow = "1";
      firstRollTitle.textContent = "1回目のサイコロ";
      el.hobbyPickerList.appendChild(firstRollTitle);

      const catLabels = [
        "1.ｻﾌﾞｶﾙ系",
        "2.ｱｰﾄ系",
        "3.ﾏｼﾞﾒ系",
        "4.休日系",
        "5.ｲﾔｼ系",
        "6.風俗系",
      ];
      for (let c = 0; c < 6; c += 1) {
        const colHead = document.createElement("div");
        colHead.className = "hobby-grid-header-cell hobby-grid-cat-header";
        colHead.style.gridColumn = String(c + 3);
        colHead.style.gridRow = "2";
        colHead.textContent = catLabels[c];
        el.hobbyPickerList.appendChild(colHead);
      }

      const rowHeadTop = document.createElement("div");
      rowHeadTop.className = "hobby-grid-header-cell";
      rowHeadTop.style.gridColumn = "2";
      rowHeadTop.style.gridRow = "2";
      rowHeadTop.textContent = "";
      el.hobbyPickerList.appendChild(rowHeadTop);

      const sideHead = document.createElement("div");
      sideHead.className = "hobby-grid-side-header";
      sideHead.style.gridColumn = "1";
      sideHead.style.gridRow = "3 / span 6";
      sideHead.textContent = "2回目のサイコロ";
      el.hobbyPickerList.appendChild(sideHead);
    }

    table.forEach((row, rIndex) => {
      if (useDiceGrid) {
        const rowHead = document.createElement("div");
        rowHead.className = "hobby-grid-header-cell";
        rowHead.style.gridColumn = "2";
        rowHead.style.gridRow = String(rIndex + 3);
        rowHead.textContent = String(rIndex + 1);
        el.hobbyPickerList.appendChild(rowHead);
      }
      row.forEach((name, cIndex) => {
        const button = document.createElement("button");
        button.type = "button";
        const colorClass =
          HOBBY_COLOR_CLASSES[rIndex % HOBBY_COLOR_CLASSES.length];
        const isZoromeSpecial =
          useDiceGrid &&
          rIndex === cIndex &&
          /イベント|タグ|ハプニング/.test(String(name));
        button.className = `hobby-picker-item hobby-choice-box hobby-grid-btn ${colorClass}${selectedSet.has(name) ? " is-selected" : ""}${isZoromeSpecial ? " is-disabled-cell" : ""}`;
        if (useDiceGrid) {
          button.style.gridColumn = String(cIndex + 3);
          button.style.gridRow = String(rIndex + 3);
        }
        if (isZoromeSpecial) {
          button.disabled = true;
          button.tabIndex = -1;
        }
        button.textContent = name;
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (isZoromeSpecial) return;
          const map = new Set(normalizeHobbyValues(el.hobbiesInput.value));
          if (map.has(name)) {
            map.delete(name);
          } else {
            map.add(name);
          }
          const next = Array.from(map.values()).join(",");
          el.hobbiesInput.value = next;
          const ev = new Event("input", { bubbles: true });
          el.hobbiesInput.dispatchEvent(ev);
          renderHobbyPicker();
        });
        el.hobbyPickerList.appendChild(button);
      });
    });
  }

  function createWeaponRow() {
    return {
      place: "",
      name: "",
      aim: "",
      damage: "",
      range: "",
      notes: "",
    };
  }

  function createOutfitRow() {
    return {
      place: "",
      name: "",
      use: "",
      effect: "",
      notes: "",
    };
  }

  function createVehicleRow() {
    return {
      name: "",
      speed: "",
      frame: "",
      burden: "",
      notes: "",
    };
  }

  function createKarmaRow() {
    return {
      name: "",
      talent: "",
      price: "",
      use: "",
      target: "",
      judge: "",
      effect: "",
    };
  }

  function createHistoryRow() {
    return {
      scenario: "",
      dd: "",
      date: "",
      karma: "",
      exp: "",
      cost: "",
      comment: "",
    };
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function setStatus(text) {
    if (el.saveStatusText) el.saveStatusText.textContent = text;
  }

  function normalizeApiUrl(url) {
    return String(url || "").replace(/\/+$/, "");
  }

  function getConfiguredApiUrl() {
    const params = new URLSearchParams(window.location.search);
    const apiFromQuery = params.get("ncApi") || params.get("gasApi");
    if (apiFromQuery) {
      try {
        localStorage.setItem(API_STORAGE_KEY, String(apiFromQuery));
      } catch (_e) {
        // ignore
      }
      return String(apiFromQuery).trim();
    }
    try {
      const fromStorage = localStorage.getItem(API_STORAGE_KEY) || "";
      const trimmed = String(fromStorage).trim();
      if (trimmed) return trimmed;
    } catch (_e) {
      // ignore
    }
    return DEFAULT_GAS_WEB_APP_URL;
  }

  function buildApiUrl(action, params = {}) {
    const base = normalizeApiUrl(getConfiguredApiUrl());
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

  function getRememberedAuthor() {
    try {
      return String(localStorage.getItem(AUTHOR_STORAGE_KEY) || "").trim();
    } catch (_e) {
      return "";
    }
  }

  function rememberAuthor(name) {
    try {
      localStorage.setItem(AUTHOR_STORAGE_KEY, String(name || "").trim());
    } catch (_e) {
      // ignore
    }
  }

  function markDirty() {
    state.dirty = true;
    setStatus("未保存");
  }

  function saveStorage() {
    const payload = { sheets: state.sheets };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    state.dirty = false;
    setStatus("保存済み");
  }

  function loadStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.sheets)) {
        state.sheets = parsed.sheets;
      }
    } catch (_e) {
      // ignore
    }
  }

  function toApiEnemy(sheet) {
    const author = String(sheet.author || "").trim() || getRememberedAuthor();
    return {
      ID: String(sheet.id || "").trim(),
      author,
      name: String(sheet.name || "").trim() || "無題",
      class_type: "サタスペ",
      is_public: true,
      memo: String(sheet.memo || ""),
      data: {
        system: "satasupe",
        sheet,
      },
      icon_url: "",
      time: nowText(),
    };
  }

  function fromApiEnemy(enemy) {
    const data =
      enemy && enemy.data && typeof enemy.data === "object" ? enemy.data : {};
    const sheet =
      data && data.sheet && typeof data.sheet === "object"
        ? deepClone(data.sheet)
        : createSheetTemplate();
    sheet.id = String((enemy && enemy.ID) || sheet.id || "").trim();
    sheet.author = String((enemy && enemy.author) || sheet.author || "").trim();
    sheet.name = String((enemy && enemy.name) || sheet.name || "").trim();
    sheet.memo = String((enemy && enemy.memo) || sheet.memo || "");
    sheet.updatedAt = String(
      (enemy && enemy.time) || sheet.updatedAt || nowText(),
    );
    if (!sheet.createdAt) sheet.createdAt = sheet.updatedAt;
    recomputeDerivedFields(sheet);
    return sheet;
  }

  async function loadFromDb() {
    const author = getRememberedAuthor();
    const url = buildApiUrl("listNechronicaEnemies", { author });
    const response = await fetchApiJson(url);
    const all = Array.isArray(response.data) ? response.data : [];
    const targets = all.filter((enemy) => {
      const classType = String((enemy && enemy.class_type) || "").trim();
      const system =
        enemy && enemy.data && typeof enemy.data === "object"
          ? String(enemy.data.system || "").trim()
          : "";
      return classType === "サタスペ" || system === "satasupe";
    });
    state.sheets = targets.map((enemy) => fromApiEnemy(enemy));
    if (!state.sheets.length) {
      const first = createSheetTemplate();
      first.name = "新規エネミー";
      first.author = author;
      state.sheets = [first];
    }
    state.selectedId = state.sheets[0] ? state.sheets[0].id : null;
    state.dirty = false;
  }

  async function saveCurrentToDb() {
    const sheet = getSelected();
    if (!sheet) return;
    readFormToSheet(sheet);
    const payload = toApiEnemy(sheet);
    if (payload.author) rememberAuthor(payload.author);

    const response = await fetchApiJson(buildApiUrl("saveNechronicaEnemy"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "nechronica",
        action: "saveNechronicaEnemy",
        author: payload.author,
        enemy: payload,
      }),
    });

    const saved = fromApiEnemy(response.data || payload);
    const idx = state.sheets.findIndex(
      (s) => String(s.id) === String(sheet.id),
    );
    if (idx >= 0) {
      state.sheets[idx] = saved;
    } else {
      state.sheets.unshift(saved);
    }
    state.selectedId = saved.id;
    state.dirty = false;
    saveStorage();
    setStatus("保存済み(DB)");
  }

  function getSelected() {
    return (
      state.sheets.find((x) => String(x.id) === String(state.selectedId)) ||
      null
    );
  }

  function setByPath(obj, path, value) {
    const segs = String(path || "").split(".");
    let cur = obj;
    for (let i = 0; i < segs.length - 1; i += 1) {
      const k = segs[i];
      if (!cur[k] || typeof cur[k] !== "object") cur[k] = {};
      cur = cur[k];
    }
    cur[segs[segs.length - 1]] = value;
  }

  function getByPath(obj, path) {
    const segs = String(path || "").split(".");
    let cur = obj;
    for (let i = 0; i < segs.length; i += 1) {
      if (cur == null) return "";
      cur = cur[segs[i]];
    }
    return cur == null ? "" : cur;
  }

  function renderList() {
    if (!el.enemyList) return;
    const q = String(state.query || "")
      .trim()
      .toLowerCase();
    const targets = state.sheets
      .filter((s) => {
        if (!q) return true;
        const hay =
          `${s.name || ""} ${s.author || ""} ${s.id || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) =>
        String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")),
      );

    el.enemyList.innerHTML = "";
    targets.forEach((sheet) => {
      const li = document.createElement("li");
      li.className = "enemy-list-item";
      if (String(sheet.id) === String(state.selectedId))
        li.classList.add("is-active");
      li.innerHTML = `
        <button type="button" class="enemy-list-btn" data-id="${sheet.id}">
          <strong>${sheet.name || "（名称未設定）"}</strong>
          <span class="enemy-list-meta">${sheet.author || "作者未設定"}</span>
        </button>
      `;
      el.enemyList.appendChild(li);
    });
  }

  function applyRandomLikeProfile(sheet) {
    if (!sheet) return;
    if (!sheet.meta || typeof sheet.meta !== "object") sheet.meta = {};
    if (!sheet.base || typeof sheet.base !== "object") sheet.base = {};
    sheet.meta.likeType = pickRandom(LIKE_TYPE_OPTIONS);
    sheet.meta.likeDetail = pickRandom(LIKE_DETAIL_OPTIONS);
    sheet.base.age = randInt(8, 80);
    sheet.updatedAt = nowText();
  }

  function fillForm(sheet) {
    if (!sheet || !el.enemyEditorForm) return;
    recomputeDerivedFields(sheet);
    const fields = el.enemyEditorForm.querySelectorAll("[data-field]");
    fields.forEach((node) => {
      const path = node.getAttribute("data-field");
      if (!path) return;
      const v = getByPath(sheet, path);
      node.value = v == null ? "" : String(v);
    });
  }

  function readFormToSheet(sheet) {
    if (!sheet || !el.enemyEditorForm) return;
    const fields = el.enemyEditorForm.querySelectorAll("[data-field]");
    fields.forEach((node) => {
      const path = node.getAttribute("data-field");
      if (!path) return;
      let v = node.value;
      if (node.type === "number" && v !== "") v = Number(v);
      setByPath(sheet, path, v);
    });
    recomputeDerivedFields(sheet);
    renderDerivedFields(sheet);
    sheet.updatedAt = nowText();
  }

  function tableCellInput(value, path, type = "text") {
    return `<input type="${type}" data-row-field="${path}" value="${String(value == null ? "" : value).replace(/"/g, "&quot;")}">`;
  }

  function renderWeapons(sheet) {
    if (!el.weaponsBody) return;
    el.weaponsBody.innerHTML = "";
    sheet.weapons.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-row-kind", "weapons");
      tr.setAttribute("data-row-index", String(index));
      tr.innerHTML = `
        <td>${tableCellInput(row.place, "place")}</td>
        <td>${tableCellInput(row.name, "name")}</td>
        <td>${tableCellInput(row.aim, "aim")}</td>
        <td>${tableCellInput(row.damage, "damage")}</td>
        <td>${tableCellInput(row.range, "range")}</td>
        <td>${tableCellInput(row.notes, "notes")}</td>
        <td><button type="button" class="small-square-btn is-danger" data-row-remove="1">×</button></td>
      `;
      el.weaponsBody.appendChild(tr);
    });
  }

  function renderOutfits(sheet) {
    if (!el.outfitsBody) return;
    el.outfitsBody.innerHTML = "";
    sheet.outfits.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-row-kind", "outfits");
      tr.setAttribute("data-row-index", String(index));
      tr.innerHTML = `
        <td>${tableCellInput(row.place, "place")}</td>
        <td>${tableCellInput(row.name, "name")}</td>
        <td>${tableCellInput(row.use, "use")}</td>
        <td>${tableCellInput(row.effect, "effect")}</td>
        <td>${tableCellInput(row.notes, "notes")}</td>
        <td><button type="button" class="small-square-btn is-danger" data-row-remove="1">×</button></td>
      `;
      el.outfitsBody.appendChild(tr);
    });
  }

  function renderVehicles(sheet) {
    if (!el.vehiclesBody) return;
    el.vehiclesBody.innerHTML = "";
    sheet.vehicles.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-row-kind", "vehicles");
      tr.setAttribute("data-row-index", String(index));
      tr.innerHTML = `
        <td>${tableCellInput(row.name, "name")}</td>
        <td>${tableCellInput(row.speed, "speed")}</td>
        <td>${tableCellInput(row.frame, "frame")}</td>
        <td>${tableCellInput(row.burden, "burden")}</td>
        <td>${tableCellInput(row.notes, "notes")}</td>
        <td><button type="button" class="small-square-btn is-danger" data-row-remove="1">×</button></td>
      `;
      el.vehiclesBody.appendChild(tr);
    });
  }

  function renderKarma(sheet) {
    if (!el.karmaBody) return;
    el.karmaBody.innerHTML = "";
    sheet.karma.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-row-kind", "karma");
      tr.setAttribute("data-row-index", String(index));
      tr.innerHTML = `
        <td>${tableCellInput(row.name, "name")}</td>
        <td>${tableCellInput(row.talent, "talent")}</td>
        <td>${tableCellInput(row.price, "price")}</td>
        <td>${tableCellInput(row.use, "use")}</td>
        <td>${tableCellInput(row.target, "target")}</td>
        <td>${tableCellInput(row.judge, "judge")}</td>
        <td>${tableCellInput(row.effect, "effect")}</td>
        <td><button type="button" class="small-square-btn is-danger" data-row-remove="1">×</button></td>
      `;
      el.karmaBody.appendChild(tr);
    });
  }

  function renderHistory(sheet) {
    if (!el.historyBody) return;
    el.historyBody.innerHTML = "";
    sheet.history.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-row-kind", "history");
      tr.setAttribute("data-row-index", String(index));
      tr.innerHTML = `
        <td>${tableCellInput(row.scenario, "scenario")}</td>
        <td>${tableCellInput(row.dd, "dd")}</td>
        <td>${tableCellInput(row.date, "date")}</td>
        <td>${tableCellInput(row.karma, "karma")}</td>
        <td>${tableCellInput(row.exp, "exp")}</td>
        <td>${tableCellInput(row.cost, "cost")}</td>
        <td>${tableCellInput(row.comment, "comment")}</td>
        <td><button type="button" class="small-square-btn is-danger" data-row-remove="1">×</button></td>
      `;
      el.historyBody.appendChild(tr);
    });
  }

  function renderEditor() {
    const sheet = getSelected();
    if (!sheet) return;
    fillForm(sheet);
    renderWeapons(sheet);
    renderOutfits(sheet);
    renderVehicles(sheet);
    renderKarma(sheet);
    renderHistory(sheet);
  }

  function renderAll() {
    renderList();
    renderEditor();
  }

  function ensureSelected() {
    if (!state.sheets.length) {
      const first = createSheetTemplate();
      first.name = "新規エネミー";
      first.author = getRememberedAuthor();
      state.sheets.push(first);
      state.selectedId = first.id;
      markDirty();
    } else if (!state.selectedId) {
      state.selectedId = state.sheets[0].id;
    }
  }

  function handleRowInput(target) {
    const tr = target.closest("tr[data-row-kind]");
    if (!tr) return;
    const sheet = getSelected();
    if (!sheet) return;
    const kind = tr.getAttribute("data-row-kind");
    const index = Number(tr.getAttribute("data-row-index"));
    const field = target.getAttribute("data-row-field");
    if (!kind || !Number.isFinite(index) || !field) return;
    const list = sheet[kind];
    if (!Array.isArray(list) || !list[index]) return;
    list[index][field] = target.value;
    recomputeDerivedFields(sheet);
    renderDerivedFields(sheet);
    sheet.updatedAt = nowText();
    markDirty();
    renderList();
  }

  function removeRowFromEvent(target) {
    const tr = target.closest("tr[data-row-kind]");
    if (!tr) return;
    const sheet = getSelected();
    if (!sheet) return;
    const kind = tr.getAttribute("data-row-kind");
    const index = Number(tr.getAttribute("data-row-index"));
    if (!kind || !Number.isFinite(index)) return;
    if (!Array.isArray(sheet[kind])) return;
    sheet[kind].splice(index, 1);
    recomputeDerivedFields(sheet);
    renderDerivedFields(sheet);
    sheet.updatedAt = nowText();
    markDirty();
    renderEditor();
  }

  function addRow(kind) {
    const sheet = getSelected();
    if (!sheet) return;
    if (kind === "weapons") sheet.weapons.push(createWeaponRow());
    if (kind === "outfits") sheet.outfits.push(createOutfitRow());
    if (kind === "vehicles") sheet.vehicles.push(createVehicleRow());
    if (kind === "karma") sheet.karma.push(createKarmaRow());
    if (kind === "history") sheet.history.push(createHistoryRow());
    recomputeDerivedFields(sheet);
    renderDerivedFields(sheet);
    sheet.updatedAt = nowText();
    markDirty();
    renderEditor();
  }

  function exportCurrentJson() {
    const sheet = getSelected();
    if (!sheet) return;
    readFormToSheet(sheet);
    const blob = new Blob([JSON.stringify(sheet, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `satasupe-enemy-${sheet.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("JSON出力完了");
  }

  function toInt(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
  }

  function normalizeText(value) {
    return String(value == null ? "" : value).trim();
  }

  function toDiceExpr(damageText) {
    const raw = normalizeText(damageText);
    if (!raw) return "1";
    const m = raw.match(/\d+/);
    if (m) return String(Number(m[0]));
    if (raw.includes("〔破壊力〕") || raw.includes("{破壊力}"))
      return "{破壊力}";
    return "1";
  }

  function buildKomaMemo(sheet) {
    const base = sheet.base || {};
    const ability = sheet.ability || {};
    const meta = sheet.meta || {};
    const condition = sheet.condition || {};
    const home = sheet.home || {};

    const hobbies = normalizeText(meta.hobbies)
      ? normalizeText(meta.hobbies)
          .split(/[,、\s]+/)
          .filter(Boolean)
          .join("、")
      : "";

    const karmaNames = (sheet.karma || [])
      .map((k) => normalizeText(k.name))
      .filter(Boolean);
    const talents = (sheet.karma || [])
      .map((k) => normalizeText(k.talent))
      .filter(Boolean);
    const prices = (sheet.karma || [])
      .map((k) => normalizeText(k.price))
      .filter(Boolean);

    const weaponLines = (sheet.weapons || [])
      .map((w) => {
        const name = normalizeText(w.name) || "武器なし";
        const aim = normalizeText(w.aim) || "-";
        const damage = normalizeText(w.damage) || "-";
        const notes = normalizeText(w.notes);
        const special = notes ? `、${notes}` : "";
        return `${name}（命${aim}、ダ${damage}${special}）`;
      })
      .filter(Boolean)
      .join("\n");

    const lines = [
      "",
      "───",
      `【名前】${normalizeText(sheet.name) || "無題"}`,
      normalizeText(meta.quote),
      `危険度：${toInt(meta.danger, 1)}　反応：${normalizeText(meta.reaction) || "中立"}　サイズ：${normalizeText(meta.size) || "M"}`,
      `${normalizeText(base.sex)}　${normalizeText(base.age)}歳　好み：${normalizeText(base.likes)}`,
      `【犯罪】${toInt(ability.crime, 1)}【生活】${toInt(ability.life, 1)}【恋愛】${toInt(ability.love, 1)}【教養】${toInt(ability.culture, 1)}【戦闘】${toInt(ability.combat, 1)}`,
      `【肉体】${toInt(ability.body, 1)}【精神】${toInt(ability.mind, 1)}`,
      `【性業値】${toInt(meta.karmaValue, 7)}`,
      `【反応力】${toInt(ability.powerInit, 1)}【攻撃力】${toInt(ability.powerAtk, 1)}【破壊力】${toInt(ability.powerDes, 1)}`,
      "",
      hobbies ? `趣味：${hobbies}` : "",
      "",
      talents.length ? `異能：${talents.join("/")}` : "",
      prices.length ? `代償：${prices.join("/")}` : "",
      karmaNames.length ? `カルマ：${karmaNames.join("、")}` : "",
      "",
      `状態：BP${toInt(condition.bp, 10)} / MP${toInt(condition.mp, 10)} / 財布${toInt(condition.wallet, 10)}`,
      `アジト：${normalizeText(home.place)}（快適度${toInt(home.comfortable, 10)} / セキュリティ${toInt(home.security, 10)}）`,
      "",
      "◆装備",
      weaponLines,
      normalizeText(sheet.memo),
    ];

    return lines
      .filter((x) => x !== null && x !== undefined && x !== "")
      .join("\n");
  }

  function buildKomaCommands(sheet) {
    const ability = sheet.ability || {};
    const meta = sheet.meta || {};
    const commands = [];

    commands.push("@基本");
    commands.push(`SR{性業値} 性業値判定`);
    commands.push(`(${toInt(ability.crime, 1)})R>=X[,1,13] 犯罪判定`);
    commands.push(`(${toInt(ability.life, 1)})R>=X[,1,13] 生活判定`);
    commands.push(`(${toInt(ability.love, 1)})R>=X[,1,13] 恋愛判定`);
    commands.push(`(${toInt(ability.culture, 1)})R>=X[,1,13] 教養判定`);
    commands.push(`(${toInt(ability.combat, 1)})R>=X[,1,13] 戦闘判定`);
    commands.push(`(${toInt(ability.body, 1)})R>=X[,1,13] 肉体判定`);
    commands.push(`(${toInt(ability.mind, 1)})R>=X[,1,13] 精神判定`);

    commands.push("@異能・代償");
    (sheet.karma || []).forEach((k) => {
      const name = normalizeText(k.name);
      const use = normalizeText(k.use) || "常駐";
      const target = normalizeText(k.target) || "自分";
      const judge = normalizeText(k.judge) || "なし";
      const effect = normalizeText(k.effect);
      if (name) commands.push(`【${name}】${use}・${target}・${judge}`);
      if (effect) commands.push(effect);
      const talent = normalizeText(k.talent);
      if (talent) commands.push(`${talent}`);
      const price = normalizeText(k.price);
      if (price) commands.push(`${price}`);
    });

    commands.push("@汎用");
    commands.push(`(${toInt(ability.body, 1)})R>=X[,1,13] セーブ判定`);
    commands.push(`(${toInt(ability.body, 1)})R>=X[1,2,13] 跳ぶ`);

    commands.push("@武器");
    (sheet.weapons || []).forEach((w) => {
      const name = normalizeText(w.name) || "武器";
      const aim = normalizeText(w.aim) || "X";
      const dice = toDiceExpr(w.damage);
      commands.push(`(${dice})R>=${aim}[,1,13] ${name}`);
    });

    commands.push("@各種表");
    commands.push("TAGT 情報タグ決定表");
    commands.push("FumbleT 命中判定ファンブル表");
    commands.push("FatalT 致命傷表");
    commands.push("KusaiMT 臭い飯表");
    commands.push("GetgT ガラクタ表");

    return commands.join("\n");
  }

  function buildKomaCharacterJson(sheet) {
    const ability = sheet.ability || {};
    const condition = sheet.condition || {};
    const meta = sheet.meta || {};
    const walletMax = Math.max(
      0,
      toInt(condition.walletMax, toInt(condition.wallet, 0)),
    );
    const walletValue = Math.max(
      0,
      Math.min(
        toInt(condition.wallet, walletMax),
        walletMax || toInt(condition.wallet, 0),
      ),
    );

    return {
      kind: "character",
      data: {
        name: normalizeText(sheet.name) || "無題",
        memo: buildKomaMemo(sheet),
        initiative: toInt(ability.powerInit, 1),
        status: [
          {
            label: "肉体点",
            value: toInt(condition.bp, 10),
            max: toInt(condition.bp, 10),
          },
          {
            label: "精神点",
            value: toInt(condition.mp, 10),
            max: toInt(condition.mp, 10),
          },
          {
            label: "サイフ",
            value: walletValue,
            max: walletMax || toInt(condition.wallet, 0),
          },
        ],
        params: [
          { label: "犯罪", value: String(toInt(ability.crime, 1)) },
          { label: "生活", value: String(toInt(ability.life, 1)) },
          { label: "恋愛", value: String(toInt(ability.love, 1)) },
          { label: "教養", value: String(toInt(ability.culture, 1)) },
          { label: "戦闘", value: String(toInt(ability.combat, 1)) },
          { label: "肉体", value: String(toInt(ability.body, 1)) },
          { label: "精神", value: String(toInt(ability.mind, 1)) },
          { label: "反応力", value: String(toInt(ability.powerInit, 1)) },
          { label: "攻撃力", value: String(toInt(ability.powerAtk, 1)) },
          { label: "破壊力", value: String(toInt(ability.powerDes, 1)) },
          { label: "性業値", value: String(toInt(meta.karmaValue, 7)) },
        ],
        commands: buildKomaCommands(sheet),
      },
    };
  }

  async function writeClipboardText(text) {
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }

  function exportKomaJson() {
    const sheet = getSelected();
    if (!sheet) return;
    readFormToSheet(sheet);
    const text = JSON.stringify(buildKomaCharacterJson(sheet));
    writeClipboardText(text)
      .then(() => setStatus("コマJSONをコピー"))
      .catch(() => {
        const blob = new Blob([text], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `satasupe-koma-${sheet.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setStatus("コマJSONを保存");
      });
  }

  function importJsonFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const next = createSheetTemplate();
        const merged = Object.assign(next, parsed);
        merged.id = uid();
        merged.createdAt = nowText();
        merged.updatedAt = nowText();
        state.sheets.unshift(merged);
        state.selectedId = merged.id;
        markDirty();
        renderAll();
      } catch (_e) {
        alert("JSONの読み込みに失敗しました");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function bindEvents() {
    if (el.enemySearchInput) {
      el.enemySearchInput.addEventListener("input", (e) => {
        state.query = String(e.target.value || "");
        renderList();
      });
    }

    if (el.enemyList) {
      el.enemyList.addEventListener("click", (e) => {
        const btn = e.target.closest(".enemy-list-btn");
        if (!btn) return;
        const id = btn.getAttribute("data-id");
        if (!id) return;
        state.selectedId = id;
        renderAll();
      });
    }

    if (el.enemyEditorForm) {
      el.enemyEditorForm.addEventListener("input", (e) => {
        const target = e.target;
        if (
          !(
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target instanceof HTMLSelectElement
          )
        )
          return;
        if (target.hasAttribute("data-row-field")) {
          handleRowInput(target);
          return;
        }
        const sheet = getSelected();
        if (!sheet) return;
        const field = target.getAttribute("data-field");
        if (!field) return;
        let v = target.value;
        if (target instanceof HTMLInputElement && target.type === "checkbox") {
          v = target.checked;
        } else if (
          target instanceof HTMLInputElement &&
          target.type === "number" &&
          v !== ""
        ) {
          v = Number(v);
        }
        setByPath(sheet, field, v);
        if (field === "author") rememberAuthor(v);
        recomputeDerivedFields(sheet);
        renderDerivedFields(sheet);
        sheet.updatedAt = nowText();
        markDirty();
        renderList();
      });

      el.enemyEditorForm.addEventListener("click", (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        const removeBtn = target.closest("[data-row-remove]");
        if (removeBtn) {
          removeRowFromEvent(removeBtn);
        }
      });
    }

    if (el.openHobbyPickerButton && el.hobbyPickerPanel) {
      el.openHobbyPickerButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const opening = el.hobbyPickerPanel.hidden;
        if (opening) {
          renderHobbyPicker();
        }
        el.hobbyPickerPanel.hidden = !opening;
      });

      if (el.hobbyDiceGridToggle) {
        el.hobbyDiceGridToggle.addEventListener("change", (event) => {
          event.stopPropagation();
          renderHobbyPicker();
        });
      }

      el.hobbyPickerPanel.addEventListener("click", (event) => {
        event.stopPropagation();
      });

      document.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Node)) return;
        const inPanel = el.hobbyPickerPanel.contains(target);
        const onButton = el.openHobbyPickerButton.contains(target);
        if (!inPanel && !onButton) {
          closeHobbyPicker();
        }
      });
    }

    if (el.randomLikeAgeButton) {
      el.randomLikeAgeButton.addEventListener("click", () => {
        const sheet = getSelected();
        if (!sheet) return;
        applyRandomLikeProfile(sheet);
        fillForm(sheet);
        markDirty();
        renderList();
      });
    }

    if (el.newEnemyButton) {
      el.newEnemyButton.addEventListener("click", () => {
        const sheet = createSheetTemplate();
        sheet.name = "新規エネミー";
        sheet.author = getRememberedAuthor();
        state.sheets.unshift(sheet);
        state.selectedId = sheet.id;
        markDirty();
        renderAll();
      });
    }

    if (el.saveEnemyButton) {
      el.saveEnemyButton.addEventListener("click", async () => {
        try {
          setStatus("保存中…");
          await saveCurrentToDb();
          renderAll();
        } catch (error) {
          console.error(error);
          setStatus("保存失敗");
          alert("DB保存に失敗しました: " + error.message);
        }
      });
    }

    if (el.saveAsEnemyButton) {
      el.saveAsEnemyButton.addEventListener("click", async () => {
        const sheet = getSelected();
        if (!sheet) return;
        readFormToSheet(sheet);
        const copied = deepClone(sheet);
        copied.id = `tmp-${uid()}`;
        copied.name = `${copied.name || "無題"}（コピー）`;
        copied.createdAt = nowText();
        copied.updatedAt = nowText();
        state.sheets.unshift(copied);
        state.selectedId = copied.id;
        markDirty();
        renderAll();
        try {
          setStatus("保存中…");
          await saveCurrentToDb();
          renderAll();
        } catch (error) {
          console.error(error);
          setStatus("保存失敗");
          alert("複製保存に失敗しました: " + error.message);
        }
      });
    }

    if (el.deleteEnemyButton) {
      el.deleteEnemyButton.addEventListener("click", () => {
        const sheet = getSelected();
        if (!sheet) return;
        const ok = window.confirm(
          `「${sheet.name || "無題"}」を削除しますか？`,
        );
        if (!ok) return;
        state.sheets = state.sheets.filter(
          (s) => String(s.id) !== String(sheet.id),
        );
        state.selectedId = state.sheets[0] ? state.sheets[0].id : null;
        ensureSelected();
        markDirty();
        renderAll();
      });
    }

    if (el.exportJsonButton) {
      el.exportJsonButton.addEventListener("click", exportCurrentJson);
    }

    if (el.exportKomaJsonButton) {
      el.exportKomaJsonButton.addEventListener("click", exportKomaJson);
    }

    if (el.importJsonInput) {
      el.importJsonInput.addEventListener("change", (e) => {
        const input = e.target;
        if (!(input instanceof HTMLInputElement)) return;
        const file = input.files && input.files[0];
        if (!file) return;
        importJsonFile(file);
        input.value = "";
      });
    }

    if (el.addWeaponButton)
      el.addWeaponButton.addEventListener("click", () => addRow("weapons"));
    if (el.addOutfitButton)
      el.addOutfitButton.addEventListener("click", () => addRow("outfits"));
    if (el.addVehicleButton)
      el.addVehicleButton.addEventListener("click", () => addRow("vehicles"));
    if (el.addKarmaButton)
      el.addKarmaButton.addEventListener("click", () => addRow("karma"));
    if (el.addHistoryButton)
      el.addHistoryButton.addEventListener("click", () => addRow("history"));

    document.addEventListener("keydown", (event) => {
      const key = String(event.key || "").toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "s") {
        event.preventDefault();
        const selected = getSelected();
        if (!selected) return;
        saveCurrentToDb()
          .then(() => renderAll())
          .catch((error) => {
            console.error(error);
            setStatus("保存失敗");
          });
      }
    });
  }

  async function boot() {
    setStatus("読込中…");
    try {
      await loadFromDb();
    } catch (error) {
      console.warn("[satasupe] DB読込失敗。ローカルへフォールバック", error);
      loadStorage();
    }
    ensureSelected();
    const selected = getSelected();
    if (selected && selected.author) rememberAuthor(selected.author);
    bindEvents();
    renderAll();
    setStatus("未保存");
  }

  void boot();
})();

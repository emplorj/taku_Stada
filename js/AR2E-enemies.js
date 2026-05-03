(function () {
  const AUTHOR_STORAGE_KEY = "ar2eEnemiesAuthor";
  const API_STORAGE_KEY = "ar2eEnemiesApiUrl";
  const LAST_SELECTED_ID_KEY = "ar2eEnemiesLastSelectedId";
  const DEFAULT_GAS_WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbxMR7f_pOi14SsAuKvu7YxKVBQZ69dn-TeQpMBxyYzo_pwZmICNZ06cSb8BKQYCM0GuGg/exec";

  // アリアンロッド用のエネミーデータ状態
  const state = {
    skills: [],
    dropItems: [],
    attackMethods: [],
    enemies: [],
    selectedId: null,
    dirty: false,
    search: "",
    searchField: "all",
    sortMode: "time",
    sortDir: "desc",
    page: 1,
    pageSize: 10,
  };
  const localUnsavedEnemyIds = new Set();

  const el = {
    form: document.getElementById("enemyEditorForm"),
    skillsBody: document.getElementById("skillsBody"),
    addSkillBtn: document.getElementById("addSkillBtn"),
    chatPreview: document.getElementById("chat-palette-preview"),
    chatPreviewLabel: document.getElementById("chatPreviewLabel"),
    nameInput: document.querySelector('input[data-field="name"]'),
    enemyTypeSelect: document.getElementById("enemyTypeSelect"),
    abilityBlockTitle: document.getElementById("abilityBlockTitle"),
    generalAbilityBlock: document.getElementById("generalAbilityBlock"),
    mobJudgeBlock: document.getElementById("mobJudgeBlock"),
    dropItemsBody: document.getElementById("dropItemsBody"),
    addDropItemBtn: document.getElementById("addDropItemBtn"),
    attackMethodsBody: document.getElementById("attackMethodsBody"),
    addAttackMethodBtn: document.getElementById("addAttackMethodBtn"),
    attributeInput: document.getElementById("field-attribute"),
    attributeSelectGroup: document.getElementById("attributeSelectGroup"),
    attributeDivider: document.getElementById("attributeDivider"),
    attributePrimarySelect: document.getElementById("attributePrimarySelect"),
    attributeSecondarySelect: document.getElementById("attributeSecondarySelect"),
    toggleDiceFormat: document.getElementById("toggleDiceFormat"),
    fieldId: document.getElementById("field-id"),
    fieldAuthor: document.getElementById("field-author"),
    fieldIconUrl: document.getElementById("field-icon-url"),
    fieldIsPublic: document.getElementById("field-is-public"),
    fieldIsPublicText: document.getElementById("field-is-public-text"),
    saveStatusText: document.getElementById("saveStatusText"),
    newEnemyButton: document.getElementById("newEnemyButton"),
    saveEnemyButton: document.getElementById("saveEnemyButton"),
    saveAsEnemyButton: document.getElementById("saveAsEnemyButton"),
    deleteEnemyButton: document.getElementById("deleteEnemyButton"),
    reloadEnemyListButton: document.getElementById("reloadEnemyListButton"),
    importJsonInput: document.getElementById("importJsonInput"),
    enemyList: document.getElementById("enemyList"),
    enemySearchInput: document.getElementById("enemySearchInput"),
    enemySearchField: document.getElementById("enemySearchField"),
    sortByIdButton: document.getElementById("sortByIdButton"),
    sortByTimeButton: document.getElementById("sortByTimeButton"),
    sortByLevelButton: document.getElementById("sortByLevelButton"),
    sortByAuthorButton: document.getElementById("sortByAuthorButton"),
    sortByClassButton: document.getElementById("sortByClassButton"),
    enemyPageSizeInput: document.getElementById("enemyPageSizeInput"),
    enemyShowAllButton: document.getElementById("enemyShowAllButton"),
    enemyShowTenButton: document.getElementById("enemyShowTenButton"),
    enemyPrevButton: document.getElementById("enemyPrevButton"),
    enemyNextButton: document.getElementById("enemyNextButton"),
    enemyPagerInfo: document.getElementById("enemyPagerInfo"),
  };

  const ABILITY_KEYS =["str", "dex", "agi", "int", "sen", "mnd", "luk"];

  function applyNumericFontClasses() {
    const targets = document.querySelectorAll([
      '.num-ability-val',
      '.num-ability-bonus',
      '.num-2',
      'input[data-field="initiative"]',
      'input[data-field="movement"]',
      'input[data-field="identification"]',
      'input[data-field="hp"]',
      'input[data-field="mp"]',
      'input[data-field="physDef"]',
      'input[data-field="magicDef"]',
      '#skillsBody input[data-key="cost"]',
      '#skillsBody input[data-key="sl"]',
      'input[data-drop-key="min"]',
      'input[data-drop-key="max"]',
      'input[data-drop-key="unitPrice"]',
      '.dice-mini-editor input[type="number"]',
      '.dice-mini-editor .dice-mark',
      '.dice-mini-editor .dice-plus-mark',
      '.updated-at',
      '.enemy-list-time-tag'
    ].join(','));
    targets.forEach((node) => node.classList.add('numeric-font'));
  }

  function clampDigit(v, fallback = 0) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(9, Math.max(0, Math.trunc(n)));
  }

  function nowText() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const i = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${y}/${m}/${day} ${h}:${i}:${s}`;
  }

  function deepClone(v) {
    return JSON.parse(JSON.stringify(v));
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
      } catch (_e) {}
      return String(apiFromQuery).trim();
    }
    try {
      const fromStorage = localStorage.getItem(API_STORAGE_KEY) || "";
      const trimmed = String(fromStorage).trim();
      if (trimmed) return trimmed;
    } catch (_e) {}
    return DEFAULT_GAS_WEB_APP_URL;
  }

  function buildApiUrl(action, params = {}) {
    const base = normalizeApiUrl(getConfiguredApiUrl());
    if (!base) throw new Error("API URLが未設定");
    const url = new URL(base);
    url.searchParams.set("tool", "ar2e");
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
      const msg = data && data.message ? data.message : `APIエラー (HTTP ${res.status})`;
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
    } catch (_e) {}
  }

  function saveLastSelectedId(id) {
    try {
      if (id) localStorage.setItem(LAST_SELECTED_ID_KEY, String(id));
      else localStorage.removeItem(LAST_SELECTED_ID_KEY);
    } catch (_e) {}
  }

  function getLastSelectedId() {
    try {
      return String(localStorage.getItem(LAST_SELECTED_ID_KEY) || "").trim();
    } catch (_e) {
      return "";
    }
  }

  function setStatus(text) {
    if (el.saveStatusText) el.saveStatusText.textContent = String(text || "");
  }

  function markDirty() {
    state.dirty = true;
    setStatus("未保存");
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

  function createEnemyTemplate() {
    return {
      ID: `new_${Date.now()}`,
      author: getRememberedAuthor(),
      name: "",
      class_type: "general",
      is_public: true,
      memo: "",
      data: { system: "ar2e", sheet: {} },
      icon_url: "",
      time: nowText(),
    };
  }

  function getSelectedEnemy() {
    return state.enemies.find((e) => String(e.ID) === String(state.selectedId)) || null;
  }

  function readFormToCurrentEnemy() {
    const current = getSelectedEnemy();
    if (!current || !el.form) return;
    const sheet = {};
    el.form.querySelectorAll("[data-field]").forEach((node) => {
      const key = node.getAttribute("data-field");
      if (!key || key === "id") return;
      let value;
      if (node.type === "checkbox") value = !!node.checked;
      else value = node.value;
      setByPath(sheet, key, value);
    });
    current.author = String(sheet.author || "").trim();
    current.name = String(sheet.name || "").trim();
    current.class_type = String(sheet.enemyType || "general").trim() || "general";
    current.is_public = !!sheet.isPublic;
    current.memo = String(sheet.memo || "");
    current.icon_url = String(getByPath(sheet, "meta.imageUrl") || "").trim();
    current.data = {
      system: "ar2e",
      sheet,
      skills: deepClone(state.skills),
      dropItems: deepClone(state.dropItems),
      attackMethods: deepClone(state.attackMethods),
    };
    current.time = nowText();
  }

  function fillFormFromEnemy(enemy) {
    if (!enemy || !el.form) return;
    const sheet = (enemy.data && enemy.data.sheet && typeof enemy.data.sheet === "object") ? enemy.data.sheet : {};
    el.form.querySelectorAll("[data-field]").forEach((node) => {
      const key = node.getAttribute("data-field");
      if (!key) return;
      let value = getByPath(sheet, key);
      if (key === "id") value = enemy.ID || "";
      if (key === "author") value = enemy.author || value;
      if (key === "name") value = enemy.name || value;
      if (key === "enemyType") value = enemy.class_type || value || "general";
      if (key === "memo") value = enemy.memo || value;
      if (key === "meta.imageUrl") value = enemy.icon_url || value;
      if (key === "isPublic") value = enemy.is_public;
      if (node.type === "checkbox") node.checked = !!value;
      else node.value = value == null ? "" : String(value);
    });
    if (el.fieldIsPublicText) {
      el.fieldIsPublicText.textContent = enemy.is_public ? "公開" : "非公開";
    }
    state.skills = Array.isArray(enemy?.data?.skills) ? deepClone(enemy.data.skills) : [createEmptySkill()];
    state.dropItems = Array.isArray(enemy?.data?.dropItems) ? deepClone(enemy.data.dropItems) : [createEmptyDropItem()];
    state.attackMethods = Array.isArray(enemy?.data?.attackMethods)
      ? deepClone(enemy.data.attackMethods)
      : [createEmptyAttackMethod()];

    syncAttributeSelectsFromInput();
    updateEnemyTypeView();
    updateAbilityDerived();
    renderSkills();
    renderDropItems();
    renderAttackMethods();
    state.dirty = false;
    setStatus("保存済み");
    saveLastSelectedId(enemy.ID);
  }

  function toApiEnemy(enemy) {
    const e = deepClone(enemy);
    return {
      ID: String(e.ID || "").trim(),
      author: String(e.author || "").trim(),
      name: String(e.name || "").trim() || "無題",
      class_type: String(e.class_type || "general").trim() || "general",
      is_public: !!e.is_public,
      memo: String(e.memo || ""),
      data: e.data && typeof e.data === "object" ? e.data : { system: "ar2e", sheet: {} },
      icon_url: String(e.icon_url || "").trim(),
      time: String(e.time || nowText()),
    };
  }

  function fromApiEnemy(enemy) {
    const e = enemy && typeof enemy === "object" ? deepClone(enemy) : createEnemyTemplate();
    return {
      ID: String(e.ID || `new_${Date.now()}`),
      author: String(e.author || "").trim(),
      name: String(e.name || "").trim(),
      class_type: ["general", "mob"].includes(String(e.class_type || "")) ? String(e.class_type) : "general",
      is_public: !!e.is_public,
      memo: String(e.memo || ""),
      data: e.data && typeof e.data === "object" ? e.data : { system: "ar2e", sheet: {} },
      icon_url: String(e.icon_url || "").trim(),
      time: String(e.time || nowText()),
    };
  }

  function normalizePageSize(v) {
    const n = Number(String(v ?? "").trim() || "10");
    if (!Number.isFinite(n)) return 10;
    if (Math.floor(n) === 0) return 0;
    return Math.max(1, Math.floor(n));
  }

  function renderEnemyList() {
    if (!el.enemyList) return;
    const q = String(state.search || "").trim().toLowerCase();
    const field = String(state.searchField || "all");
    const mine = getRememberedAuthor();
    let list = state.enemies.filter((e) => {
      const isMine = mine && String(e.author || "") === mine;
      if (!e.is_public && !isMine) return false;
      if (!q) return true;
      const targets = {
        id: String(e.ID || "").toLowerCase(),
        name: String(e.name || "").toLowerCase(),
        author: String(e.author || "").toLowerCase(),
        class: String(e.class_type || "").toLowerCase(),
      };
      if (field === "all") return Object.values(targets).some((v) => v.includes(q));
      return String(targets[field] || "").includes(q);
    });

    const dir = state.sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      const mode = state.sortMode || "time";
      if (mode === "id") return String(a.ID || "").localeCompare(String(b.ID || ""), "ja") * dir;
      if (mode === "author") return String(a.author || "").localeCompare(String(b.author || ""), "ja") * dir;
      if (mode === "class") return String(a.class_type || "").localeCompare(String(b.class_type || ""), "ja") * dir;
      if (mode === "level") {
        const la = Number(getByPath(a.data?.sheet || {}, "level") || 0);
        const lb = Number(getByPath(b.data?.sheet || {}, "level") || 0);
        return (la - lb) * dir;
      }
      return String(a.time || "").localeCompare(String(b.time || ""), "ja") * dir;
    });

    state.pageSize = normalizePageSize(state.pageSize);
    const showAll = state.pageSize === 0;
    const totalPages = showAll ? 1 : Math.max(1, Math.ceil(list.length / state.pageSize));
    state.page = Math.min(Math.max(1, state.page), totalPages);
    const start = showAll ? 0 : (state.page - 1) * state.pageSize;
    const end = showAll ? list.length : start + state.pageSize;
    const pageItems = list.slice(start, end);

    el.enemyList.innerHTML = "";
    pageItems.forEach((enemy) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "enemy-list-item-btn";
      btn.textContent = `${enemy.name || "(no name)"} / ${enemy.class_type || "general"} / ${enemy.author || "-"}`;
      btn.addEventListener("click", () => {
        readFormToCurrentEnemy();
        state.selectedId = enemy.ID;
        fillFormFromEnemy(enemy);
        renderEnemyList();
      });
      if (String(enemy.ID) === String(state.selectedId)) btn.style.outline = "2px solid #ffd966";
      li.appendChild(btn);
      el.enemyList.appendChild(li);
    });

    if (el.enemyPagerInfo) {
      const from = list.length ? start + 1 : 0;
      const to = Math.min(end, list.length);
      el.enemyPagerInfo.textContent = `${from}-${to} / ${list.length}件（${state.page}/${totalPages}）`;
    }
    if (el.enemyPrevButton) el.enemyPrevButton.disabled = state.page <= 1;
    if (el.enemyNextButton) el.enemyNextButton.disabled = state.page >= totalPages;
  }

  async function loadFromDb() {
    const author = getRememberedAuthor();
    const response = await fetchApiJson(buildApiUrl("listAR2EEnemies", { author }));
    const rows = Array.isArray(response.data) ? response.data : [];
    state.enemies = rows.map(fromApiEnemy);
    if (!state.enemies.length) {
      const fresh = createEnemyTemplate();
      state.enemies = [fresh];
      localUnsavedEnemyIds.add(String(fresh.ID));
    }
    const lastId = getLastSelectedId();
    state.selectedId = state.enemies.some((e) => String(e.ID) === lastId)
      ? lastId
      : state.enemies[0].ID;
    fillFormFromEnemy(getSelectedEnemy());
    renderEnemyList();
  }

  async function saveCurrentToDb() {
    const current = getSelectedEnemy();
    if (!current) return;
    readFormToCurrentEnemy();
    const payload = toApiEnemy(current);
    if (payload.author) rememberAuthor(payload.author);
    const response = await fetchApiJson(buildApiUrl("saveAR2EEnemy"), {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        tool: "ar2e",
        action: "saveAR2EEnemy",
        author: payload.author,
        enemy: payload,
      }),
    });
    const saved = fromApiEnemy(response.data || payload);
    const idx = state.enemies.findIndex((e) => String(e.ID) === String(current.ID));
    if (idx >= 0) state.enemies[idx] = saved;
    else state.enemies.unshift(saved);
    state.selectedId = saved.ID;
    localUnsavedEnemyIds.delete(String(saved.ID));
    fillFormFromEnemy(saved);
    renderEnemyList();
  }

  async function deleteCurrentFromDb() {
    const current = getSelectedEnemy();
    if (!current) return;
    if (!window.confirm("このエネミーを削除しますか？")) return;
    if (!localUnsavedEnemyIds.has(String(current.ID))) {
      await fetchApiJson(buildApiUrl("deleteAR2EEnemy", { id: current.ID }));
    }
    state.enemies = state.enemies.filter((e) => String(e.ID) !== String(current.ID));
    localUnsavedEnemyIds.delete(String(current.ID));
    if (!state.enemies.length) {
      const fresh = createEnemyTemplate();
      state.enemies = [fresh];
      localUnsavedEnemyIds.add(String(fresh.ID));
    }
    state.selectedId = state.enemies[0].ID;
    fillFormFromEnemy(getSelectedEnemy());
    renderEnemyList();
  }

  function createNewEnemy() {
    readFormToCurrentEnemy();
    const fresh = createEnemyTemplate();
    state.enemies.unshift(fresh);
    localUnsavedEnemyIds.add(String(fresh.ID));
    state.selectedId = fresh.ID;
    fillFormFromEnemy(fresh);
    renderEnemyList();
  }

  function parseDiceFormula(raw, fallbackCount = 2) {
    const text = String(raw || "").trim();
    const bare = text.match(/^(\d+)\s*[dD]$/i);
    if (bare) {
      return {
        count: clampDigit(bare[1], fallbackCount),
        plus: ""
      };
    }
    const m = text.match(/^(\d+)\s*[dD]\s*\+\s*(-?\d+)$/i);
    if (!m) return { count: fallbackCount, plus: "" };
    
    const p = Number(m[2]);
    return {
      count: clampDigit(m[1], fallbackCount),
      plus: (p === 0) ? "" : clampDigit(m[2], 0)
    };
  }

  function setDiceFormula(field, count, plus) {
    const hidden = document.querySelector(`input[data-field="${field}"]`);
    if (!hidden) return;
    const c = clampDigit(count, 2);
    const p = plus === "" ? "" : clampDigit(plus, 0);
    if (p === "" || p === 0) {
      hidden.value = `${c}D+0`; // 保存値としては+0を残す（表示時は空になる）
    } else {
      hidden.value = `${c}D+${p}`;
    }
  }

  function bindDiceMiniEditor(field, countId, plusId) {
    const countInput = document.getElementById(countId);
    const plusInput = document.getElementById(plusId);
    const hidden = document.querySelector(`input[data-field="${field}"]`);
    if (!countInput || !plusInput || !hidden) return;

    const parsed = parseDiceFormula(hidden.value, 2);
    countInput.value = String(parsed.count);
    plusInput.value = String(parsed.plus);
    setDiceFormula(field, parsed.count, parsed.plus);

    const syncFromMini = () => {
      setDiceFormula(field, countInput.value, plusInput.value);
      updateChatPalettePreview();
    };
    countInput.addEventListener("input", syncFromMini);
    plusInput.addEventListener("input", syncFromMini);
  }

  // =======================================================
  // スキル管理
  // =======================================================

  function createEmptySkill() {
    return {
      id: `skill_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      isSecret: false,
      name: "",
      sl: "",
      timing: "",
      judge: "",
      target: "",
      range: "",
      cost: "",
      hitDice: "",
      damageDice: "",
      effect: ""
    };
  }

  function createEmptyDropItem() {
    return {
      id: `drop_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      min: "",
      max: "",
      name: "",
      unitPrice: "",
      quantity: "1"
    };
  }

  function createEmptyAttackMethod() {
    return {
      id: `atk_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: "",
      target: "",
      range: "",
      hitDice: "2D",
      damageDice: "2D+0",
      attribute: "",
      effect: ""
    };
  }

  function renderSkills() {
    if (!el.skillsBody) return;
    el.skillsBody.innerHTML = "";

    state.skills.forEach((skill, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-index", index);
      
      const hit = parseDiceFormula(skill.hitDice, 2);
      const dmg = parseDiceFormula(skill.damageDice, 2);

      tr.innerHTML = `
        <td style="text-align:center;" data-label="">
          <input type="checkbox" data-key="isSecret" ${skill.isSecret ? "checked" : ""}>
        </td>
        <td data-label="名前"><input type="text" data-key="name" value="${escapeHtml(skill.name)}" placeholder="名称"></td>
        <td data-label="SL"><input type="number" data-key="sl" value="${escapeHtml(skill.sl)}" placeholder="1"></td>
        <td data-label="タイミング"><input type="text" data-key="timing" value="${escapeHtml(skill.timing)}" placeholder="メジャー等" list="ar2eTimingList"></td>
        <td data-label="判定"><input type="text" data-key="judge" value="${escapeHtml(skill.judge)}" placeholder="自動成功"></td>
        <td data-label="対象"><input type="text" data-key="target" value="${escapeHtml(skill.target)}" list="ar2eTargetList" placeholder="単体"></td>
        <td data-label="射程"><input type="text" data-key="range" value="${escapeHtml(skill.range)}" list="ar2eRangeList" placeholder="至近"></td>
        <td data-label="コスト"><input type="number" data-key="cost" value="${escapeHtml(skill.cost)}" placeholder="3"></td>
        <td data-label="命中">
          <input type="hidden" data-key="hitDice" value="${escapeHtml(skill.hitDice || "2D+0")}">
          <span class="dice-mini-editor in-table" aria-label="命中ダイス式">
            <input type="number" data-dice-key="hitDice" data-dice-part="count" min="0" max="9" step="1" value="${hit.count}" class="dice-count-input">
            <span class="dice-mark numeric-font">D</span>
            <span class="dice-plus-mark numeric-font">+</span>
            <input type="number" data-dice-key="hitDice" data-dice-part="plus" min="0" max="9" step="1" value="${hit.plus}" placeholder="0" class="dice-plus-input">
          </span>
        </td>
        <td data-label="ダメージ">
          <input type="hidden" data-key="damageDice" value="${escapeHtml(skill.damageDice || "2D+0")}">
          <span class="dice-mini-editor in-table" aria-label="ダメージダイス式">
            <input type="number" data-dice-key="damageDice" data-dice-part="count" min="0" max="9" step="1" value="${dmg.count}" class="dice-count-input">
            <span class="dice-mark numeric-font">D</span>
            <span class="dice-plus-mark numeric-font">+</span>
            <input type="number" data-dice-key="damageDice" data-dice-part="plus" min="0" max="9" step="1" value="${dmg.plus}" placeholder="0" class="dice-plus-input">
          </span>
        </td>
        <td data-label="効果"><input type="text" data-key="effect" value="${escapeHtml(skill.effect)}" placeholder="効果"></td>
        <td style="text-align:center;" data-label="">
          <button type="button" class="delete-btn" title="削除"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      el.skillsBody.appendChild(tr);

      // isSecretの反映のみ
      const secretInput = tr.querySelector('input[data-key="isSecret"]');
      if (secretInput) {
        secretInput.classList.add("skill-secret-toggle");
        const isSecret = !!(skill && skill.isSecret);
        secretInput.classList.toggle("is-secret-on", isSecret);
        secretInput.setAttribute("aria-checked", isSecret ? "true" : "false");
        tr.classList.toggle("is-secret-row", isSecret);
      }
    });

    applyNumericFontClasses();
    updateChatPalettePreview();
  }

  function renderDropItems() {
    if (!el.dropItemsBody) return;
    el.dropItemsBody.innerHTML = "";

    state.dropItems.forEach((item, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-drop-index", index);
      tr.innerHTML = `
        <td><input type="number" data-drop-key="min" value="${escapeHtml(item.min)}" placeholder="1"></td>
        <td><input type="number" data-drop-key="max" value="${escapeHtml(item.max)}" placeholder="5"></td>
        <td><input type="text" data-drop-key="name" value="${escapeHtml(item.name)}" placeholder="アイテム名"></td>
        <td><input type="text" data-drop-key="unitPrice" value="${escapeHtml(item.unitPrice)}" placeholder="100G"></td>
        <td><input type="number" data-drop-key="quantity" value="${escapeHtml(item.quantity || "1")}" min="1" step="1" class="num-2"></td>
        <td style="text-align:center;">
          <button type="button" class="delete-btn" data-drop-delete="1" title="削除"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      el.dropItemsBody.appendChild(tr);
    });

    applyNumericFontClasses();
  }

  function renderAttackMethods() {
    if (!el.attackMethodsBody) return;
    el.attackMethodsBody.innerHTML = "";

    state.attackMethods.forEach((atk, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-atk-index", index);
      const hit = parseDiceFormula(atk.hitDice, 2);
      const dmg = parseDiceFormula(atk.damageDice, 2);

      tr.innerHTML = `
        <td data-label="名前"><input type="text" data-atk-key="name" value="${escapeHtml(atk.name)}" placeholder="攻撃名"></td>
        <td data-label="対象"><input type="text" data-atk-key="target" value="${escapeHtml(atk.target)}" list="ar2eTargetList" placeholder="単体"></td>
        <td data-label="射程"><input type="text" data-atk-key="range" value="${escapeHtml(atk.range)}" list="ar2eRangeList" placeholder="至近"></td>
        <td data-label="命中">
          <span class="dice-mini-editor in-table" aria-label="攻撃命中式">
            <input type="number" data-atk-dice-key="hitDice" data-atk-dice-part="count" min="0" max="9" step="1" value="${hit.count}" class="numeric-font dice-count-input">
            <span class="dice-mark numeric-font">D</span>
            <span class="dice-plus-mark numeric-font">+</span>
            <input type="number" data-atk-dice-key="hitDice" data-atk-dice-part="plus" min="0" max="9" step="1" value="${hit.plus}" placeholder="0" class="numeric-font dice-plus-input">
          </span>
        </td>
        <td data-label="ダメージ">
          <span class="dice-mini-editor in-table" aria-label="攻撃ダメージ式">
            <input type="number" data-atk-dice-key="damageDice" data-atk-dice-part="count" min="0" max="9" step="1" value="${dmg.count}" class="numeric-font dice-count-input">
            <span class="dice-mark numeric-font">D</span>
            <span class="dice-plus-mark numeric-font">+</span>
            <input type="number" data-atk-dice-key="damageDice" data-atk-dice-part="plus" min="0" max="9" step="1" value="${dmg.plus}" placeholder="0" class="numeric-font dice-plus-input">
          </span>
        </td>
        <td data-label="属性"><input type="text" data-atk-key="attribute" value="${escapeHtml(atk.attribute)}" list="ar2eAttributeList" placeholder="属性"></td>
        <td data-label="効果"><input type="text" data-atk-key="effect" value="${escapeHtml(atk.effect)}" placeholder="効果"></td>
        <td style="text-align:center;" data-label=""><button type="button" class="delete-btn" data-atk-delete="1" title="削除"><i class="fa-solid fa-trash"></i></button></td>
      `;
      el.attackMethodsBody.appendChild(tr);
    });

    applyNumericFontClasses();
  }

  function updateEnemyTypeView() {
    const type = el.enemyTypeSelect ? el.enemyTypeSelect.value : "general";
    if (el.generalAbilityBlock) el.generalAbilityBlock.hidden = type !== "general";
    if (el.mobJudgeBlock) el.mobJudgeBlock.hidden = type !== "mob";
    if (el.abilityBlockTitle) {
      el.abilityBlockTitle.textContent = type === "mob" ? "判定" : "能力値";
    }
    if (el.chatPreviewLabel) {
      el.chatPreviewLabel.textContent = type === "general"
        ? "能力値プレビュー（自動生成）"
        : "チャットパレットプレビュー（自動生成）";
    }
  }

  // =======================================================
  // チャットパレット（ペースト用テキスト）生成
  // =======================================================
  
  function formatDiceText(raw) {
    // 逆順スイッチがONの時、2D+0 を 0+2D に変えて出力する
    const isReverse = document.body.classList.contains("is-dice-reverse");
    if (!isReverse) return raw;
    const text = String(raw || "").trim();
    const m = text.match(/^(\d+)D\+(\d+)$/i);
    if (m) {
      return `${m[2]}+${m[1]}D`;
    }
    const m2 = text.match(/^(\d+)D$/i);
    if (m2) return raw;
    return raw;
  }

  function updateChatPalettePreview() {
    if (!el.chatPreview) return;

    const enemyType = el.enemyTypeSelect ? el.enemyTypeSelect.value : "general";
    if (enemyType === "general") {
      const labels = {
        str: "筋力",
        dex: "器用",
        agi: "敏捷",
        int: "知力",
        sen: "感知",
        mnd: "精神",
        luk: "幸運"
      };

      const lines = ABILITY_KEYS.map((key) => {
        const baseInput = document.querySelector(`input[data-field="${key}"]`);
        const derivedInput = document.querySelector(`input[data-derived="${key}"]`);
        const base = baseInput ? String(baseInput.value || "0").trim() || "0" : "0";
        const derived = derivedInput ? String(derivedInput.value || "0").trim() || "0" : "0";
        return `${labels[key] || key} ${base} (判定値:${derived})`;
      });

      el.chatPreview.value = lines.join("\n");
      return;
    }

    // 基本アクションの生成
    const evadeDice = formatDiceText(getFieldValue("evadeDice") || "2D+0");
    const actionDice = formatDiceText(getFieldValue("mobActionJudge") || "2D+0");
    const reactionDice = formatDiceText(getFieldValue("mobReactionJudge") || "2D+0");

    let chatText = `${evadeDice} 回避\n${actionDice} アクション判定\n${reactionDice} リアクション判定\n\n`;

    // スキルのチャットパレット化
    state.skills.forEach(skill => {
      const name = String(skill.name || "").trim();
      if (!name) return;

      // ペースト用の説明テキスト: 『名前』SL:1(タイミング/判定/対象/射程) 効果
      let infoText = `『${name}』`;
      if (skill.sl) infoText += `SL:${skill.sl}`;

      const bracketParts =[];
      if (skill.timing) bracketParts.push(skill.timing);
      if (skill.judge) bracketParts.push(skill.judge);
      if (skill.target) bracketParts.push(skill.target);
      if (skill.range) bracketParts.push(skill.range);

      if (bracketParts.length > 0) {
        infoText += `(${bracketParts.join("/")})`;
      }
      if (skill.effect) infoText += ` ${skill.effect}`;

      // チャットコマンド用（命中とダメージ）
      if (skill.hitDice && skill.hitDice !== "0D+0" && skill.hitDice !== "0D") {
        chatText += `${formatDiceText(skill.hitDice)} ${name} 命中\n`;
      }
      if (skill.damageDice && skill.damageDice !== "0D+0" && skill.damageDice !== "0D") {
        chatText += `${formatDiceText(skill.damageDice)} ${name} ダメージ\n`;
      }

      chatText += `${infoText}\n\n`;
    });

    el.chatPreview.value = chatText.trim();
  }

  function getFieldValue(fieldKey) {
    const input = document.querySelector(`input[data-field="${fieldKey}"]`);
    return input ? String(input.value || "").trim() : "";
  }

  function updateAbilityDerived() {
    ABILITY_KEYS.forEach((key) => {
      const baseInput = document.querySelector(`input[data-field="${key}"]`);
      const derivedInput = document.querySelector(`input[data-derived="${key}"]`);
      if (!baseInput || !derivedInput) return;

      const raw = Number(baseInput.value);
      const base = Number.isFinite(raw) ? Math.max(0, Math.trunc(raw)) : 0;
      const dice = Math.floor(base / 3);
      derivedInput.value = `${dice}`;
    });
  }

  function normalizeAttributeTheme(value) {
    const text = String(value || "");
    if (text.includes("地")) return "earth";
    if (text.includes("水")) return "water";
    if (text.includes("火")) return "fire";
    if (text.includes("風")) return "wind";
    if (text.includes("光")) return "light";
    if (text.includes("闇")) return "dark";
    if (text.includes("特殊")) return "special";
    return "";
  }

  function parseAttributePair(rawValue) {
    const raw = String(rawValue || "").trim();
    if (!raw || raw === "-") return { primary: "-", secondary: "" };
    const values = raw
      .split("/")
      .map((v) => v.trim())
      .filter(Boolean)
      .filter((v) => v !== "-")
      .slice(0, 2);
    return {
      primary: values[0] || "-",
      secondary: values[1] || ""
    };
  }

  function updateAttributeFromSelects() {
    if (!el.attributeInput || !el.attributePrimarySelect || !el.attributeSecondarySelect) return;
    const primary = String(el.attributePrimarySelect.value || "-").trim() || "-";
    const secondary = String(el.attributeSecondarySelect.value || "").trim();

    if (primary === "-") {
      el.attributeSecondarySelect.value = "";
      el.attributeSecondarySelect.hidden = true;
      if (el.attributeDivider) el.attributeDivider.hidden = true;
      el.attributeInput.value = "-";
      updateAttributeTheme();
      return;
    }

    el.attributeSecondarySelect.hidden = false;
    if (el.attributeDivider) el.attributeDivider.hidden = false;

    if (secondary && secondary !== primary) {
      el.attributeInput.value = `${primary}/${secondary}`;
    } else {
      el.attributeInput.value = primary;
    }
    updateAttributeTheme();
  }

  function syncAttributeSelectsFromInput() {
    if (!el.attributeInput || !el.attributePrimarySelect || !el.attributeSecondarySelect) return;
    const parsed = parseAttributePair(el.attributeInput.value);
    el.attributePrimarySelect.value = parsed.primary;
    el.attributeSecondarySelect.value = parsed.secondary;
    
    el.attributeSecondarySelect.hidden = parsed.primary === "-";
    if (el.attributeDivider) {
      el.attributeDivider.hidden = parsed.primary === "-";
    }
    updateAttributeFromSelects();
  }

  function updateAttributeTheme() {
    const attributeInput = document.querySelector('input[data-field="attribute"]');
    if (!attributeInput) return;
    const theme = normalizeAttributeTheme(attributeInput.value);
    if (theme) {
      attributeInput.setAttribute("data-attr-theme", theme);
    } else {
      attributeInput.removeAttribute("data-attr-theme");
    }
  }

  // =======================================================
  // ユーティリティ・イベントバインド
  // =======================================================

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function bindEvents() {
    // 行追加ボタン
    if (el.addSkillBtn) {
      el.addSkillBtn.addEventListener("click", () => {
        state.skills.push(createEmptySkill());
        renderSkills();
      });
    }

    // テーブル内の入力監視（即時反映）
    if (el.skillsBody) {
      el.skillsBody.addEventListener("input", (e) => {
        const target = e.target;
        const tr = target.closest("tr");
        if (!tr) return;
        const index = Number(tr.getAttribute("data-index"));
        const key = target.getAttribute("data-key");
        const diceKey = target.getAttribute("data-dice-key");
        
        if (diceKey && state.skills[index]) {
          const countInput = tr.querySelector(`input[data-dice-key="${diceKey}"][data-dice-part="count"]`);
          const plusInput = tr.querySelector(`input[data-dice-key="${diceKey}"][data-dice-part="plus"]`);
          if (countInput && plusInput) {
            const count = clampDigit(countInput.value, 2);
            const plusRaw = String(plusInput.value || "").trim();
            const plus = plusRaw === "" ? "" : clampDigit(plusRaw, 0);
            const formula = plus === "" ? `${count}D+0` : `${count}D+${plus}`;
            state.skills[index][diceKey] = formula;
            const hidden = tr.querySelector(`input[data-key="${diceKey}"]`);
            if (hidden) hidden.value = formula;
            updateChatPalettePreview();
          }
          return;
        }

        if (key && state.skills[index]) {
          if (target.type === "checkbox") {
            state.skills[index][key] = target.checked;
          } else {
            state.skills[index][key] = target.value;
          }

          if (key === "isSecret") {
            const isSecret = !!state.skills[index].isSecret;
            target.classList.toggle("is-secret-on", isSecret);
            target.setAttribute("aria-checked", isSecret ? "true" : "false");
            tr.classList.toggle("is-secret-row", isSecret);
          }

          // チャットパレットをリアルタイム更新
          updateChatPalettePreview();
        }
      });

      // 削除ボタン
      el.skillsBody.addEventListener("click", (e) => {
        const btn = e.target.closest(".delete-btn");
        if (!btn) return;
        const tr = btn.closest("tr");
        if (!tr) return;
        const index = Number(tr.getAttribute("data-index"));
        
        state.skills.splice(index, 1);
        renderSkills();
      });
    }

    if (el.dropItemsBody) {
      el.dropItemsBody.addEventListener("input", (e) => {
        const target = e.target;
        const tr = target.closest("tr");
        if (!tr) return;
        const index = Number(tr.getAttribute("data-drop-index"));
        const key = target.getAttribute("data-drop-key");
        if (key && state.dropItems[index]) {
          state.dropItems[index][key] = target.value;
        }
      });

      el.dropItemsBody.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-drop-delete]");
        if (!btn) return;
        const tr = btn.closest("tr");
        if (!tr) return;
        const index = Number(tr.getAttribute("data-drop-index"));
        state.dropItems.splice(index, 1);
        renderDropItems();
      });
    }

    if (el.addDropItemBtn) {
      el.addDropItemBtn.addEventListener("click", () => {
        state.dropItems.push(createEmptyDropItem());
        renderDropItems();
      });
    }

    if (el.attackMethodsBody) {
      el.attackMethodsBody.addEventListener("input", (e) => {
        const target = e.target;
        const tr = target.closest("tr");
        if (!tr) return;
        const index = Number(tr.getAttribute("data-atk-index"));
        const key = target.getAttribute("data-atk-key");
        const diceKey = target.getAttribute("data-atk-dice-key");
        if (!state.attackMethods[index]) return;

        if (diceKey) {
          const countInput = tr.querySelector(`input[data-atk-dice-key="${diceKey}"][data-atk-dice-part="count"]`);
          const plusInput = tr.querySelector(`input[data-atk-dice-key="${diceKey}"][data-atk-dice-part="plus"]`);
          if (countInput && plusInput) {
            const count = clampDigit(countInput.value, 2);
            const plusRaw = String(plusInput.value || "").trim();
            const plus = plusRaw === "" ? "" : clampDigit(plusRaw, 0);
            const formula = plus === "" ? `${count}D+0` : `${count}D+${plus}`;
            state.attackMethods[index][diceKey] = formula;
          }
          return;
        }

        if (key) {
          state.attackMethods[index][key] = target.value;
        }
      });

      el.attackMethodsBody.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-atk-delete]");
        if (!btn) return;
        const tr = btn.closest("tr");
        if (!tr) return;
        const index = Number(tr.getAttribute("data-atk-index"));
        state.attackMethods.splice(index, 1);
        renderAttackMethods();
      });
    }

    if (el.addAttackMethodBtn) {
      el.addAttackMethodBtn.addEventListener("click", () => {
        state.attackMethods.push(createEmptyAttackMethod());
        renderAttackMethods();
      });
    }

    if (el.enemyTypeSelect) {
      el.enemyTypeSelect.addEventListener("change", () => {
        updateEnemyTypeView();
        markDirty();
      });
    }

    if (el.attributePrimarySelect) {
      el.attributePrimarySelect.addEventListener("change", () => {
        const primary = String(el.attributePrimarySelect.value || "-").trim() || "-";
        if (primary === "-") {
          if (el.attributeSecondarySelect) {
            el.attributeSecondarySelect.value = "";
            el.attributeSecondarySelect.hidden = true;
          }
          if (el.attributeDivider) el.attributeDivider.hidden = true;
        } else {
          if (el.attributeSecondarySelect) {
            el.attributeSecondarySelect.hidden = false;
          }
          if (el.attributeDivider) el.attributeDivider.hidden = false;
        }
        updateAttributeFromSelects();
      });
    }

    if (el.attributeSecondarySelect) {
      el.attributeSecondarySelect.addEventListener("change", () => {
        updateAttributeFromSelects();
      });
    }

    if (el.toggleDiceFormat) {
      el.toggleDiceFormat.addEventListener("change", (e) => {
        document.body.classList.toggle("is-dice-reverse", e.target.checked);
        updateChatPalettePreview();
        markDirty();
      });
    }

    // フォーム全体での入力監視（ダイス変更時にチャパレを更新するため）
    if (el.form) {
      el.form.addEventListener("input", (e) => {
        const target = e.target;
        const field = target.getAttribute("data-field");
        if (field === "evadeDice" || field === "mobActionJudge" || field === "mobReactionJudge") {
          updateChatPalettePreview();
        }

        if (field && ABILITY_KEYS.includes(field)) {
          updateAbilityDerived();
        }

        if (field === "attribute") {
          updateAttributeTheme();
        }
        if (field === "author" && el.fieldIsPublicText) {
          rememberAuthor(target.value || "");
        }
        if (field === "isPublic" && el.fieldIsPublicText) {
          el.fieldIsPublicText.textContent = target.checked ? "公開" : "非公開";
        }
        markDirty();
      });
    }

    if (el.newEnemyButton) el.newEnemyButton.addEventListener("click", createNewEnemy);
    if (el.saveEnemyButton) {
      el.saveEnemyButton.addEventListener("click", async () => {
        try {
          setStatus("保存中…");
          await saveCurrentToDb();
          setStatus("保存済み");
        } catch (e) {
          setStatus(`保存失敗: ${e.message || "error"}`);
        }
      });
    }
    if (el.saveAsEnemyButton) {
      el.saveAsEnemyButton.addEventListener("click", async () => {
        const current = getSelectedEnemy();
        if (!current) return;
        const name = window.prompt("別名保存する名前を入力してください", String(current.name || "").trim());
        if (!name) return;
        readFormToCurrentEnemy();
        const copied = deepClone(current);
        copied.ID = `new_${Date.now()}`;
        copied.name = String(name).trim();
        localUnsavedEnemyIds.add(String(copied.ID));
        state.enemies.unshift(copied);
        state.selectedId = copied.ID;
        try {
          setStatus("別名保存中…");
          await saveCurrentToDb();
          setStatus("保存済み");
        } catch (e) {
          setStatus(`保存失敗: ${e.message || "error"}`);
        }
      });
    }
    if (el.deleteEnemyButton) {
      el.deleteEnemyButton.addEventListener("click", async () => {
        try {
          await deleteCurrentFromDb();
          setStatus("削除済み");
        } catch (e) {
          setStatus(`削除失敗: ${e.message || "error"}`);
        }
      });
    }
    if (el.reloadEnemyListButton) {
      el.reloadEnemyListButton.addEventListener("click", async () => {
        try {
          setStatus("読込中…");
          await loadFromDb();
          setStatus("読込完了");
        } catch (e) {
          setStatus(`読込失敗: ${e.message || "error"}`);
        }
      });
    }
    if (el.enemySearchInput) {
      el.enemySearchInput.addEventListener("input", () => {
        state.search = el.enemySearchInput.value || "";
        state.page = 1;
        renderEnemyList();
      });
    }
    if (el.enemySearchField) {
      el.enemySearchField.addEventListener("change", () => {
        state.searchField = el.enemySearchField.value || "all";
        state.page = 1;
        renderEnemyList();
      });
    }
    const bindSort = (btn, mode, recDir) => {
      if (!btn) return;
      btn.addEventListener("click", () => {
        if (state.sortMode === mode) {
          state.sortDir = state.sortDir === recDir ? (recDir === "asc" ? "desc" : "asc") : recDir;
        } else {
          state.sortMode = mode;
          state.sortDir = recDir;
        }
        state.page = 1;
        renderEnemyList();
      });
    };
    bindSort(el.sortByIdButton, "id", "asc");
    bindSort(el.sortByTimeButton, "time", "desc");
    bindSort(el.sortByLevelButton, "level", "desc");
    bindSort(el.sortByAuthorButton, "author", "asc");
    bindSort(el.sortByClassButton, "class", "asc");
    if (el.enemyPageSizeInput) {
      el.enemyPageSizeInput.addEventListener("change", () => {
        state.pageSize = normalizePageSize(el.enemyPageSizeInput.value);
        state.page = 1;
        renderEnemyList();
      });
    }
    if (el.enemyShowAllButton) {
      el.enemyShowAllButton.addEventListener("click", () => {
        state.pageSize = 0;
        if (el.enemyPageSizeInput) el.enemyPageSizeInput.value = "0";
        state.page = 1;
        renderEnemyList();
      });
    }
    if (el.enemyShowTenButton) {
      el.enemyShowTenButton.addEventListener("click", () => {
        state.pageSize = 10;
        if (el.enemyPageSizeInput) el.enemyPageSizeInput.value = "10";
        state.page = 1;
        renderEnemyList();
      });
    }
    if (el.enemyPrevButton) {
      el.enemyPrevButton.addEventListener("click", () => {
        state.page = Math.max(1, state.page - 1);
        renderEnemyList();
      });
    }
    if (el.enemyNextButton) {
      el.enemyNextButton.addEventListener("click", () => {
        state.page += 1;
        renderEnemyList();
      });
    }
    if (el.importJsonInput) {
      el.importJsonInput.addEventListener("change", () => {
        const raw = String(el.importJsonInput.value || "").trim();
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          const current = getSelectedEnemy();
          if (!current) return;
          const merged = fromApiEnemy({ ...current, ...parsed, data: parsed.data || current.data });
          const idx = state.enemies.findIndex((x) => String(x.ID) === String(current.ID));
          if (idx >= 0) state.enemies[idx] = merged;
          fillFormFromEnemy(merged);
          markDirty();
          renderEnemyList();
        } catch (e) {
          setStatus(`JSON読込失敗: ${e.message || "error"}`);
        }
      });
    }
  }

  // 初期起動処理
  async function init() {
    bindEvents();
    bindDiceMiniEditor("evadeDice", "evadeDiceCount", "evadeDicePlus");
    bindDiceMiniEditor("mobActionJudge", "mobActionDiceCount", "mobActionDicePlus");
    bindDiceMiniEditor("mobReactionJudge", "mobReactionDiceCount", "mobReactionDicePlus");
    applyNumericFontClasses();
    try {
      await loadFromDb();
    } catch (_e) {
      const fresh = createEnemyTemplate();
      fresh.data = {
        system: "ar2e",
        sheet: { enemyType: "general", isPublic: true, author: getRememberedAuthor() },
        skills: [createEmptySkill(), createEmptySkill(), createEmptySkill()],
        dropItems: [createEmptyDropItem(), createEmptyDropItem()],
        attackMethods: [createEmptyAttackMethod()],
      };
      state.enemies = [fresh];
      state.selectedId = fresh.ID;
      localUnsavedEnemyIds.add(String(fresh.ID));
      fillFormFromEnemy(fresh);
      renderEnemyList();
    }
  }

  document.addEventListener("DOMContentLoaded", init);

})();

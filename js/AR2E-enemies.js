(function () {
  const AUTHOR_STORAGE_KEY = "ar2eEnemiesAuthor";
  const API_STORAGE_KEY = "ar2eEnemiesApiUrl";
  const LAST_SELECTED_ID_KEY = "ar2eEnemiesLastSelectedId";
  const DRAFT_STORAGE_KEY = "ar2eEnemiesDraft";
  const DRAFT_PROMPTED_KEY = "ar2eEnemiesDraftPrompted";
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
    toggleEffectMultiline: document.getElementById("toggleEffectMultiline"),
    fieldId: document.getElementById("field-id"),
    fieldAuthor: document.getElementById("field-author"),
    fieldIconUrl: document.getElementById("field-icon-url"),
    fieldIsPublic: document.getElementById("field-is-public"),
    fieldIsPublicText: document.getElementById("field-is-public-text"),
    saveStatusText: document.getElementById("saveStatusText"),
    newEnemyButton: document.getElementById("newEnemyButton"),
    saveEnemyButton: document.getElementById("saveEnemyButton"),
    saveAsEnemyButton: document.getElementById("saveAsEnemyButton"),
    exportKomaJsonButton: document.getElementById("exportKomaJsonButton"),
    komaExportModeSelect: document.getElementById("komaExportModeSelect"),
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
    ar2eSkillNameList: document.getElementById("ar2eSkillNameList"),
  };

  const skillNameMaster = [];
  const skillMasterByName = new Map();
  const skillExpandByName = new Map();

  const ABILITY_KEYS = ["str", "dex", "agi", "int", "sen", "mnd", "luk"];

  function getEnemiesShared() {
    return (
      (typeof window !== "undefined" &&
        (window.EnemiesShared || window.NechronicaShared)) ||
      {}
    );
  }

  const shared = getEnemiesShared();

  function requestSaveAsName(currentName = "") {
    const sharedApi = getEnemiesShared();
    if (typeof sharedApi.requestSaveAsName === "function") {
      return sharedApi.requestSaveAsName(currentName);
    }
    const v = window.prompt(
      "別名保存する名前を入力してください",
      String(currentName || "").trim(),
    );
    return v == null ? null : String(v).trim();
  }

  async function requestSaveAsSameNameAction(currentName = "") {
    const sharedApi = getEnemiesShared();
    if (typeof sharedApi.requestSaveAsSameNameAction === "function") {
      return sharedApi.requestSaveAsSameNameAction(currentName);
    }
    return "save";
  }

  function buildCopiedName(name) {
    const sharedApi = getEnemiesShared();
    if (typeof sharedApi.buildCopiedName === "function") {
      return sharedApi.buildCopiedName(name, {
        fallbackName: "無題",
        idempotent: true,
      });
    }
    const raw = String(name || "").trim() || "無題";
    return raw.includes("（コピー）") ? raw : `${raw}（コピー）`;
  }

  function isUnsavedEnemy(enemy) {
    if (!enemy) return true;
    const id = String(enemy.ID || "");
    return !id || id.startsWith("new_") || id.startsWith("tmp-") || localUnsavedEnemyIds.has(id);
  }

  function setSaveButtonLabelByEnemy(enemy) {
    if (!el.saveEnemyButton) return;
    const icon = '<i class="fa-solid fa-cloud-arrow-up"></i>';
    const text = isUnsavedEnemy(enemy) ? "新規保存" : "上書き保存";
    el.saveEnemyButton.innerHTML = `${icon} ${text}`;
  }

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
      '.dice-mini-editor .dice-plus-mark'
    ].join(','));
    targets.forEach((node) => node.classList.add('numeric-font'));
  }

  function clampDigit(v, fallback = 0) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(9, Math.max(0, Math.trunc(n)));
  }

  function clampDiceValue(v, fallback = 0) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(999, Math.max(0, Math.trunc(n)));
  }

  function nowText() {
    const sharedApi = getEnemiesShared();
    return typeof sharedApi.nowText === "function"
      ? sharedApi.nowText()
      : new Date().toLocaleString("ja-JP");
  }

  function formatShortDate(value) {
    const sharedApi = getEnemiesShared();
    if (typeof sharedApi.formatDateTime === "function") {
      return sharedApi.formatDateTime(value, {
        emptyValue: "-",
        fallbackRawOnInvalid: true,
        defaultSeconds: "00",
        ignoreInputSeconds: true,
      });
    }
    const s = String(value || "").trim();
    return s || "-";
  }

  function deepClone(v) {
    const sharedApi = getEnemiesShared();
    return typeof sharedApi.deepClone === "function"
      ? sharedApi.deepClone(v)
      : JSON.parse(JSON.stringify(v));
  }

  function normalizeApiUrl(url) {
    const sharedApi = getEnemiesShared();
    return typeof sharedApi.normalizeApiUrl === "function"
      ? sharedApi.normalizeApiUrl(url)
      : String(url || "").replace(/\/+$/, "");
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
    const sharedApi = getEnemiesShared();
    if (typeof sharedApi.buildApiUrl === "function") {
      return sharedApi.buildApiUrl({
        baseUrl: getConfiguredApiUrl(),
        tool: "ar2e",
        action,
        params,
      });
    }
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
    const sharedApi = getEnemiesShared();
    if (typeof sharedApi.fetchApiJson === "function") {
      return sharedApi.fetchApiJson(url, init);
    }
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
    const sharedApi = getEnemiesShared();
    if (typeof sharedApi.getRememberedAuthorFromStorage === "function") {
      return sharedApi.getRememberedAuthorFromStorage(AUTHOR_STORAGE_KEY);
    }
    try {
      return String(localStorage.getItem(AUTHOR_STORAGE_KEY) || "").trim();
    } catch (_e) {
      return "";
    }
  }

  function rememberAuthor(name) {
    const sharedApi = getEnemiesShared();
    if (typeof sharedApi.rememberAuthorToStorage === "function") {
      sharedApi.rememberAuthorToStorage(AUTHOR_STORAGE_KEY, name);
      return;
    }
    try {
      localStorage.setItem(AUTHOR_STORAGE_KEY, String(name || "").trim());
    } catch (_e) {}
  }

  function saveLastSelectedId(id) {
    const sharedApi = getEnemiesShared();
    if (typeof sharedApi.saveLastSelectedIdToStorage === "function") {
      sharedApi.saveLastSelectedIdToStorage(LAST_SELECTED_ID_KEY, id);
      return;
    }
    try {
      if (id) localStorage.setItem(LAST_SELECTED_ID_KEY, String(id));
      else localStorage.removeItem(LAST_SELECTED_ID_KEY);
    } catch (_e) {}
  }

  function getLastSelectedId() {
    const sharedApi = getEnemiesShared();
    if (typeof sharedApi.getLastSelectedIdFromStorage === "function") {
      return sharedApi.getLastSelectedIdFromStorage(LAST_SELECTED_ID_KEY);
    }
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
    saveDraftSnapshotFromCurrent();
  }

  function clearDraftSnapshot() {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      sessionStorage.removeItem(DRAFT_PROMPTED_KEY);
    } catch (_e) {}
  }

  function saveDraftSnapshotFromCurrent() {
    try {
      const current = getSelectedEnemy();
      if (!current) return;
      readFormToCurrentEnemy();
      const payload = {
        selectedId: String(current.ID || ""),
        enemy: deepClone(current),
        savedAt: Date.now(),
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      sessionStorage.removeItem(DRAFT_PROMPTED_KEY);
    } catch (_e) {}
  }

  function restoreDraftIfNeededOnce() {
    try {
      const prompted = sessionStorage.getItem(DRAFT_PROMPTED_KEY);
      if (prompted === "1") return;

      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY) || "";
      if (!raw) return;
      sessionStorage.setItem(DRAFT_PROMPTED_KEY, "1");

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || !parsed.enemy) return;

      const ok = window.confirm("前回の未保存編集を復元しますか？\n\n「いいえ」を押すと新規白紙を作成します。");
      if (!ok) {
        createNewEnemy();
        return;
      }

      const restored = parsed.enemy;
      const rid = String(restored.ID || parsed.selectedId || `tmp_${Date.now()}`);
      restored.ID = rid;

      const idx = state.enemies.findIndex((x) => String(x.ID) === rid);
      if (idx >= 0) state.enemies[idx] = restored;
      else state.enemies.unshift(restored);

      state.selectedId = rid;
      fillFormFromEnemy(restored);
      state.dirty = true;
      setStatus("未保存（復元）");
      renderEnemyList();
    } catch (_e) {}
  }

  function getByPath(obj, path) {
    const sharedApi = getEnemiesShared();
    return typeof sharedApi.getByPath === "function"
      ? sharedApi.getByPath(obj, path, "")
      : "";
  }

  function setByPath(obj, path, value) {
    const sharedApi = getEnemiesShared();
    if (typeof sharedApi.setByPath === "function") {
      sharedApi.setByPath(obj, path, value);
    }
  }

  function moveRowByIndex(list, fromIndex, toIndex) {
    const sharedApi = getEnemiesShared();
    if (typeof sharedApi.moveRowByIndex === "function") {
      return sharedApi.moveRowByIndex(list, fromIndex, toIndex);
    }
    return false;
  }

  function createEnemyTemplate(options = {}) {
    const { auto = false } = options || {};
    return {
      ID: `new_${Date.now()}`,
      author: getRememberedAuthor(),
      name: "",
      class_type: "general",
      is_public: true,
      memo: "",
      data: { sheet: {} },
      icon_url: "",
      time: nowText(),
      _autoTemplate: !!auto,
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

    // AR2E_enemies.html では作者・立ち絵URL・公開設定が form の外側の
    // editor-action-bar に置かれているため、form 内の data-field 走査だけでは
    // 保存値に入らない。保存時は明示的に action bar 側の値も取り込む。
    if (el.fieldAuthor) {
      setByPath(sheet, "author", el.fieldAuthor.value);
    }
    if (el.fieldIconUrl) {
      setByPath(sheet, "meta.imageUrl", el.fieldIconUrl.value);
    }
    if (el.fieldIsPublic) {
      setByPath(sheet, "isPublic", !!el.fieldIsPublic.checked);
    }

    current.author = String(sheet.author || "").trim() || getRememberedAuthor();
    current.name = String(sheet.name || "").trim();
    current.class_type = String(sheet.enemyType || "general").trim() || "general";
    current.is_public = !!sheet.isPublic;
    current.memo = String(sheet.memo || "");
    current.icon_url = String(getByPath(sheet, "meta.imageUrl") || "").trim();
    current.data = {
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

      // 保存データに値がない場合は、HTML側の初期値（value属性）を優先する
      if (value == null || value === "") {
        const attrVal = node.getAttribute("value");
        if (attrVal != null) value = attrVal;
      }

      if (node.type === "checkbox") node.checked = !!value;
      else node.value = value == null ? "" : String(value);
    });
    // AR2E のメタ欄は form の外側にあるため、fill 時も明示的に同期する。
    if (el.fieldAuthor) {
      el.fieldAuthor.value = enemy.author || getByPath(sheet, "author") || "";
    }
    if (el.fieldIconUrl) {
      el.fieldIconUrl.value = enemy.icon_url || getByPath(sheet, "meta.imageUrl") || "";
    }
    if (el.fieldIsPublic) {
      el.fieldIsPublic.checked = !!enemy.is_public;
    }
    if (el.fieldIsPublicText) {
      el.fieldIsPublicText.textContent = enemy.is_public ? "公開" : "非公開";
    }
    setSaveButtonLabelByEnemy(enemy);
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
    clearDraftSnapshot();
    saveLastSelectedId(enemy.ID);
  }

  function toApiEnemy(enemy) {
    const e = deepClone(enemy);
    const author = String(e.author || "").trim() || getRememberedAuthor();
    return {
      ID: String(e.ID || "").trim(),
      author,
      name: String(e.name || "").trim() || "無題",
      class_type: String(e.class_type || "general").trim() || "general",
      is_public: !!e.is_public,
      memo: String(e.memo || ""),
      data: e.data && typeof e.data === "object" ? e.data : { sheet: {} },
      icon_url: String(e.icon_url || "").trim(),
      time: String(e.time || nowText()),
    };
  }

  function fromApiEnemy(enemy) {
    const e = enemy && typeof enemy === "object" ? deepClone(enemy) : createEnemyTemplate();
    const sheet = e.data && e.data.sheet && typeof e.data.sheet === "object" ? e.data.sheet : {};
    const author = String(e.author || sheet.author || "").trim();
    const rawIsPublic = e.is_public ?? sheet.isPublic;
    const isPublic =
      rawIsPublic === true ||
      rawIsPublic === 1 ||
      rawIsPublic === "1" ||
      String(rawIsPublic).toLowerCase() === "true";
    return {
      ID: String(e.ID || `new_${Date.now()}`),
      author,
      name: String(e.name || "").trim(),
      class_type: ["general", "mob"].includes(String(e.class_type || "")) ? String(e.class_type) : "general",
      is_public: isPublic,
      memo: String(e.memo || ""),
      data: e.data && typeof e.data === "object" ? e.data : { sheet: {} },
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
    const myAuthor = getRememberedAuthor();
    let list = state.enemies.filter((e) => {
      if (isUnsavedEnemy(e)) return false;

      const canView =
        typeof shared.canViewEnemyByVisibility === "function"
          ? shared.canViewEnemyByVisibility({
              isPublic: !!e.is_public,
              enemyAuthor: e.author,
              myAuthor,
            })
          : !!e.is_public ||
            (myAuthor && String(e.author || "") === String(myAuthor));
      if (!canView) {
        return false;
      }
      
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
      const sheet = enemy?.data?.sheet || {};
      const name = String(enemy.name || "（名称未設定）");
      const classType = String(enemy.class_type || "general");
      const enemyTypeLabel = classType === "mob" ? "モブ" : "一般";
      const author = String(enemy.author || "").trim();
      const idText = String(enemy.ID || "-");
      const level = Number(getByPath(sheet, "level") || 0);
      const levelText = Number.isFinite(level) && level > 0 ? `Lv ${level}` : "Lv -";
      const timeText = formatShortDate(enemy.time);
      const iconUrl = String(enemy.icon_url || "").trim();
      const classification = String(getByPath(sheet, "classification") || "-").trim() || "-";
      const attribute = String(getByPath(sheet, "attribute") || "-").trim() || "-";
      const hp = getByPath(sheet, "hp") || 0;
      const initiative = getByPath(sheet, "initiative") || 0;

      const li = document.createElement("li");
      li.className = "enemy-list-item";
      if (String(enemy.ID) === String(state.selectedId)) li.classList.add("is-active");

      const classificationIcon = getClassificationIcon(classification);
      const attrHtml = renderAttributeChips(attribute);
      const levelStyle = getLevelBadgeStyle(level);

      li.innerHTML = `
        <div class="enemy-list-card" data-id="${escapeHtml(idText)}" data-enemy-type="${classType}">
          <i class="fa-solid ${classificationIcon} enemy-list-bg-icon" aria-hidden="true"></i>
          <span class="enemy-list-row">
            <span class="enemy-list-side-left">
              <span class="enemy-level-badge ${levelStyle.class}" style="${levelStyle.style}">
                <span class="level-label">Lv</span>
                <span class="level-value">${escapeHtml(String(levelText).replace(/^Lv\s*/, ""))}</span>
              </span>
              <span class="enemy-list-icon-wrap">
                ${iconUrl ? `<img src="${escapeHtml(iconUrl)}" alt="">` : `<i class="fa-solid fa-dragon" aria-hidden="true"></i>`}
              </span>
            </span>
            <span class="enemy-list-content-main">
              <span class="enemy-list-upper-info">
                <span class="enemy-list-name">${escapeHtml(name)}</span>
                <span class="enemy-list-meta-tags">
                  ${attrHtml}
                  <span class="enemy-list-meta-tag is-stat">HP ${escapeHtml(String(hp))}</span>
                  <span class="enemy-list-meta-tag is-stat">行動 ${escapeHtml(String(initiative))}</span>
                </span>
              </span>
              <span class="enemy-list-lower-info">
                <span>ID：${escapeHtml(idText)}</span>
                ${author ? `<span>作者：${escapeHtml(author)}</span>` : ""}
              </span>
            </span>
            <span class="enemy-list-side-right-group">
              <span class="enemy-list-meta-column">
                <span class="enemy-list-badge-row">
                  <span class="enemy-list-class-tag">${escapeHtml(classification)}</span>
                  <span class="enemy-list-meta-tag is-type is-${classType}">${escapeHtml(enemyTypeLabel)}</span>
                </span>
                <span class="enemy-list-time-tag">${escapeHtml(timeText)}</span>
              </span>
              <span class="enemy-list-btns-row">
                <button type="button" class="list-side-btn is-load" data-id="${escapeHtml(idText)}" title="編集">
                  <i class="fa-solid fa-pen-to-square"></i><br>編集
                </button>
                <button type="button" class="list-side-btn is-output" data-id="${escapeHtml(idText)}" title="出力">
                  <i class="fa-solid fa-file-export"></i><br>出力
                </button>
              </span>
            </span>
          </span>
        </div>
      `;

      li.querySelector(".list-side-btn.is-load")?.addEventListener("click", () => {
        if (!confirmLoadEnemyOrCreateNew(enemy)) return;
        state.selectedId = enemy.ID;
        fillFormFromEnemy(enemy);
        renderEnemyList();
      });

      li.querySelector(".list-side-btn.is-output")?.addEventListener("click", async () => {
        try {
          if (!confirmLoadEnemyOrCreateNew(enemy)) return;
          state.selectedId = enemy.ID;
          fillFormFromEnemy(enemy);
          await exportKomaJsonByCurrentMode();
          setStatus("コマJSON出力完了");
          renderEnemyList();
        } catch (error) {
          setStatus(error.message || "コマJSON出力に失敗", true);
        }
      });

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

  function getLevelBadgeStyle(level) {
    if (level >= 50) {
      return { class: "is-legend", style: "" };
    }
    
    let r, g, b;
    let textColor = "#f1f5f9"; // 最初から白系

    if (level <= 15) {
      // 緑 (#93c47d) -> 黄色 (#ffd666)
      const ratio = Math.max(0, (level - 1) / 14);
      r = Math.round(0x93 + (0xff - 0x93) * ratio);
      g = Math.round(0xc4 + (0xd6 - 0xc4) * ratio);
      b = Math.round(0x7d + (0x66 - 0x7d) * ratio);
    } else if (level <= 35) {
      // 黄色 (#ffd666) -> 赤 (#cc0000)
      const ratio = (level - 15) / 20;
      r = Math.round(0xff + (0xcc - 0xff) * ratio);
      g = Math.round(0xd6 + (0x00 - 0xd6) * ratio);
      b = Math.round(0x66 + (0x00 - 0x66) * ratio);
    } else {
      // 赤固定
      r = 0xcc; g = 0x00; b = 0x00;
      textColor = "#ffffff";
    }

    return {
      class: "",
      style: `background-color: rgb(${r},${g},${b}); color: ${textColor}; border-color: rgba(0,0,0,0.2);`
    };
  }


  function getClassificationIcon(classification) {
    const c = String(classification || "");
    if (c.includes("竜")) return "fa-dragon";
    if (c.includes("人間")) return "fa-user-shield";
    if (c.includes("動物")) return "fa-paw";
    if (c.includes("植物")) return "fa-leaf";
    if (c.includes("精霊")) return "fa-wind";
    if (c.includes("妖精")) return "fa-sparkles";
    if (c.includes("妖魔")) return "fa-skull";
    if (c.includes("魔族")) return "fa-demon";
    if (c.includes("アンデッド")) return "fa-ghost";
    if (c.includes("人造")) return "fa-robot";
    if (c.includes("機械")) return "fa-gear";
    if (c.includes("魔獣")) return "fa-spaghetti-monster-flying";
    if (c.includes("霊獣")) return "fa-cat";
    if (c.includes("巨人")) return "fa-mountain";
    return "fa-shield-halved";
  }

  function renderAttributeChips(attrStr) {
    const s = String(attrStr || "-");
    if (s === "-" || !s) return "";
    
    // 区切り文字（/ , ・ スペースなど）で分割
    const parts = s.split(/[\/\s・,，]+/).filter(Boolean);
    if (!parts.length) return "";

    return parts.map(p => {
      let cls = "is-none";
      if (p.includes("火")) cls = "is-fire";
      else if (p.includes("水")) cls = "is-water";
      else if (p.includes("風")) cls = "is-wind";
      else if (p.includes("地")) cls = "is-earth";
      else if (p.includes("光")) cls = "is-light";
      else if (p.includes("闇")) cls = "is-dark";
      else if (p.includes("物理") || p.includes("白兵") || p.includes("射撃")) cls = "is-phys";

      return `<span class="attr-chip ${cls}">${escapeHtml(p)}</span>`;
    }).join("");
  }


  async function loadFromDb() {
    const author = getRememberedAuthor();
    const response = await fetchApiJson(buildApiUrl("listAR2EEnemies", { author }));
    const rows = Array.isArray(response.data) ? response.data : [];
    state.enemies = rows.map(fromApiEnemy);
    if (!state.enemies.length) {
      const fresh = createEnemyTemplate({ auto: true });
      state.enemies = [fresh];
      localUnsavedEnemyIds.add(String(fresh.ID));
    }
    const lastId = getLastSelectedId();
    state.selectedId = state.enemies.some((e) => String(e.ID) === lastId)
      ? lastId
      : state.enemies[0].ID;
    const selected = getSelectedEnemy();
    fillFormFromEnemy(selected);
    renderEnemyList();
    setStatus(isUnsavedEnemy(selected) ? "未保存" : "保存済み");
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
      const fresh = createEnemyTemplate({ auto: true });
      state.enemies = [fresh];
      localUnsavedEnemyIds.add(String(fresh.ID));
    }
    state.selectedId = state.enemies[0].ID;
    fillFormFromEnemy(getSelectedEnemy());
    renderEnemyList();
  }

  function createNewEnemy() {
    const fresh = createEnemyTemplate({ auto: false });
    state.enemies.unshift(fresh);
    localUnsavedEnemyIds.add(String(fresh.ID));
    state.selectedId = fresh.ID;
    fillFormFromEnemy(fresh);
    renderEnemyList();
    setStatus("新規白紙を作成");
  }

  function confirmLoadEnemyOrCreateNew(targetEnemy) {
    const current = getSelectedEnemy();
    const switching = String(current?.ID || "") !== String(targetEnemy?.ID || "");
    if (!switching || !state.dirty) return true;
    const targetName = String(targetEnemy?.name || "").trim() || "（名称未設定）";
    const ok = window.confirm(
      `未保存の編集があります。\n「${targetName}」を読み込みますか？\n\n「いいえ」を押すと新規白紙を作成します。`,
    );
    if (!ok) {
      createNewEnemy();
      return false;
    }
    return true;
  }

  function parseDiceFormula(raw, fallbackCount = 2) {
    const text = String(raw || "").trim();
    const bare = text.match(/^(\d+)\s*[dD]$/i);
    if (bare) {
      return {
        count: clampDiceValue(bare[1], fallbackCount),
        plus: ""
      };
    }
    const m = text.match(/^(\d+)\s*[dD]\s*\+\s*(-?\d+)$/i);
    if (!m) return { count: fallbackCount, plus: "" };
    
    const p = Number(m[2]);
    return {
      count: clampDiceValue(m[1], fallbackCount),
      plus: (p === 0) ? "" : clampDiceValue(m[2], 0)
    };
  }

  function setDiceFormula(field, count, plus) {
    const hidden = document.querySelector(`input[data-field="${field}"]`);
    if (!hidden) return;
    const c = clampDiceValue(count, 2);
    const p = plus === "" ? "" : clampDiceValue(plus, 0);
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
      hitDice: "2D",
      damageDice: "2D+0",
      attribute: "",
      effect: ""
    };
  }

  function normalizeSkillName(rawName) {
    let name = String(rawName == null ? "" : rawName).trim();
    if (!name) return "";
    name = name.replace(/^《+|》+$/g, "").trim();
    name = name.replace(/^[<＜]+|[>＞]+$/g, "").trim();
    name = name.replace(/[\s　]+Lv(?:\[[^\]]*\])?$/i, "").trim();
    if (name === "ニ回行動") name = "二回行動";
    return name;
  }

  function formatSkillNameWithBrackets(rawName) {
    const core = normalizeSkillName(rawName);
    return core ? `《${core}》` : "";
  }

  function normalizeSkillNameAndLevel(skill) {
    if (!skill || typeof skill !== "object") return;
    const raw = String(skill.name == null ? "" : skill.name);
    const hasLvSuffix = /[\s　]+Lv(?:\[[^\]]*\])?$/i.test(raw.trim());
    if (hasLvSuffix && String(skill.sl || "").trim() === "") {
      skill.sl = "1";
    }
  }

  function parseSkillLevelCapFromName(rawName) {
    const raw = String(rawName || "").trim();
    if (!raw) return null;
    const lvRange = raw.match(/Lv\s*\[\s*1\s*-\s*(\d+)\s*\]/i);
    if (lvRange) return Math.max(1, toInt(lvRange[1], 1));
    if (/\bLv\b/i.test(raw)) return null;
    return 1;
  }

  function normalizeSkillMasterEntry(raw) {
    if (!raw) return null;
    if (typeof raw === "string") {
      const name = normalizeSkillName(raw);
      return name ? { name } : null;
    }
    if (typeof raw !== "object") return null;
    const name = normalizeSkillName(raw.name || raw.skillName || raw.title || "");
    if (!name) return null;
    const out = { name };
    const fields = ["timing", "judge", "target", "range", "cost", "hitDice", "damageDice", "effect", "attribute"];
    fields.forEach((k) => {
      const v = raw[k];
      if (v != null && String(v).trim() !== "") out[k] = String(v).trim();
    });
    if (raw.slMax != null && String(raw.slMax).trim() !== "") {
      const n = toInt(raw.slMax, 0);
      if (n > 0) out.slMax = n;
    }
    return out;
  }

  function applySkillNameMaster(entries) {
    const normalizedEntries = (Array.isArray(entries) ? entries : [])
      .map((row) => normalizeSkillMasterEntry(row))
      .filter(Boolean);

    skillMasterByName.clear();
    normalizedEntries.forEach((entry) => {
      if (!skillMasterByName.has(entry.name)) {
        skillMasterByName.set(entry.name, entry);
      }
    });

    const unique = Array.from(skillMasterByName.values())
      .map((entry) => formatSkillNameWithBrackets(entry.name))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "ja"));
    skillNameMaster.splice(0, skillNameMaster.length, ...unique);
    if (!el.ar2eSkillNameList) return;
    el.ar2eSkillNameList.innerHTML = "";
    skillNameMaster.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      el.ar2eSkillNameList.appendChild(opt);
    });
  }

  function parseCSV(text) {
    const rows = [];
    let row = [""];
    let inQuote = false;
    let i = 0;
    for (let j = 0; j < text.length; j++) {
      const char = text[j];
      const next = text[j + 1];
      if (inQuote && char === '"' && next === '"') {
        row[i] += '"';
        j++;
      } else if (char === '"') {
        inQuote = !inQuote;
      } else if (char === "," && !inQuote) {
        row[++i] = "";
      } else if (char === "\n" && !inQuote) {
        rows.push(row);
        row = [""];
        i = 0;
      } else if (char !== "\r") {
        row[i] += char;
      }
    }
    if (row.length > 1 || row[0] !== "") rows.push(row);
    return rows;
  }

  async function loadSkillNameMaster() {
    if (!el.ar2eSkillNameList) return;

    try {
      const csvRes = await fetch("./AR2E_skillinfo.csv", { cache: "no-store" });
      if (csvRes.ok) {
        const text = await csvRes.text();
        const rows = parseCSV(text);
        const entries = [];
        skillExpandByName.clear();
        let inSuperMasterSection = false;
        const blacklist = new Set(["HP", "MP", "SL", "SL+1", "SL*2", "SL×2", "P382", "CL", "CL+1"]);

        const header = (rows[0] || []).map((v) => String(v || "").trim());
        const findCol = (label) => header.findIndex((h) => h === label);
        const col = {
          name: findCol("名前"),
          lv: findCol("Lv"),
          timing: findCol("タイミング"),
          effect: findCol("効果"),
          cost: findCol("コスト"),
          hit: findCol("命中(ダイス数)"),
          damage: findCol("ダメージ(ダイス数)"),
          range: findCol("射程"),
          target: findCol("範囲"),
          attribute: findCol("属性")
        };
        const pick = (cols, idx) => (idx >= 0 ? String(cols[idx] || "").trim() : "");
        const toDiceFormula = (raw) => {
          const v = String(raw || "").trim();
          if (!v) return "";
          if (/^\d+D(?:\+\d+)?$/i.test(v)) return v.toUpperCase();
          if (/^\d+$/.test(v)) return `2D+${v}`;
          return "";
        };
        const parseLvByColumn = (lvRaw, nameRaw) => {
          const v = String(lvRaw || "").trim();
          if (/^\[\s*1\s*-\s*(\d+)\s*\]$/i.test(v)) {
            const m = v.match(/^\[\s*1\s*-\s*(\d+)\s*\]$/i);
            return Math.max(1, toInt(m && m[1], 1));
          }
          if (/^TRUE$/i.test(v)) return null;
          if (/^FALSE$/i.test(v)) return 1;
          return parseSkillLevelCapFromName(nameRaw);
        };

        rows.forEach((cols, rowIndex) => {
          if (rowIndex === 0) return; // Skip header row

          const firstCol = String(cols[0] || "").trim();
          if (firstCol.includes("スーパーマスター用")) {
            inSuperMasterSection = true;
            return;
          }
          if (inSuperMasterSection && firstCol === "クラス") return;
          if (inSuperMasterSection) {
            const superName = String(cols[1] || "").trim();
            if (!superName) return;
            const key = normalizeSkillName(superName);
            if (!key) return;
            const packed = cols.map((c) => String(c || "")).join("\n");
            const breakdown = [];
            const matches = packed.matchAll(/[《<＜]([^》>＞]+)[》>＞]/g);
            for (const m of matches) {
              const n = normalizeSkillName(m[1]);
              if (n) breakdown.push(n);
            }
            if (breakdown.length) {
              skillExpandByName.set(key, Array.from(new Set(breakdown)));
            }
            return;
          }

          // Extract all 《...》 from all columns (sub-skills)
          cols.forEach(col => {
            const matches = col.matchAll(/[《<＜]([^》>＞]+)[》>＞]/g);
            for (const m of matches) {
              const n = m[1].replace(/[\s　]+Lv(?:\[[^\]]*\])?$/i, "").trim();
              if (n && !blacklist.has(n) && !/^[P0-9\-*+/]+$/.test(n)) {
                entries.push({ name: `《${n}》` });
              }
            }
          });

          // Main skill row processing
          const nameRaw = pick(cols, col.name >= 0 ? col.name : 1);
          if (!nameRaw || nameRaw === "名前" || nameRaw === "内訳" || nameRaw.startsWith("スーパーマスター用")) return;

          const n = nameRaw.replace(/《+|》+/g, "").replace(/[\s　]+Lv(?:\[[^\]]*\])?$/i, "").trim();
          if (!n || blacklist.has(n) || /^[P0-9\-*+/]+$/.test(n)) return;

          entries.push({
            name: `《${n}》`,
            timing: pick(cols, col.timing),
            effect: pick(cols, col.effect),
            cost: pick(cols, col.cost),
            judge: "",
            hitDice: toDiceFormula(pick(cols, col.hit)),
            damageDice: toDiceFormula(pick(cols, col.damage)),
            range: pick(cols, col.range),
            target: pick(cols, col.target),
            attribute: pick(cols, col.attribute),
            slMax: parseLvByColumn(pick(cols, col.lv), nameRaw)
          });
        });

        if (entries.length) {
          applySkillNameMaster(entries);
          return;
        }
      }
    } catch (_e) {
      console.error("Failed to load skill CSV:", _e);
    }

    applySkillNameMaster([]);
  }

  function applySkillMasterToSkill(skill, options = {}) {
    if (!skill || typeof skill !== "object") return;
    const force = !!options.force;
    const name = normalizeSkillName(skill.name || "");
    if (!name) return;
    const master = skillMasterByName.get(name);
    if (!master) return;
    const fillIfEmpty = (key) => {
      if (!(key in master)) return;
      if (!force && String(skill[key] || "").trim() !== "") return;
      skill[key] = master[key];
    };
    ["timing", "judge", "target", "range", "cost", "hitDice", "damageDice", "effect", "attribute"].forEach(fillIfEmpty);
    if (master.slMax != null && !Number.isNaN(Number(master.slMax))) {
      skill.slMax = Number(master.slMax);
    }
  }

  function expandSkillByMasterName(nameRaw) {
    const key = normalizeSkillName(nameRaw);
    if (!key) return;
    const list = skillExpandByName.get(key);
    if (!Array.isArray(list) || !list.length) return;
    const exists = new Set(state.skills.map((s) => normalizeSkillName(s && s.name ? s.name : "")).filter(Boolean));
    list.forEach((skillName) => {
      if (!skillName || exists.has(skillName)) return;
      const row = createEmptySkill();
      row.name = skillName;
      applySkillMasterToSkill(row);
      state.skills.push(row);
      exists.add(skillName);
    });
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

  function toDropRollNumber(value) {
    const n = Number(String(value == null ? "" : value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }

  function getNextDropMinByInsertIndex(insertIndex) {
    const prev = state.dropItems[Math.max(0, insertIndex - 1)] || null;
    if (!prev) return "";
    const prevMax = toDropRollNumber(prev.max);
    if (!Number.isFinite(prevMax)) return "";
    return String(prevMax + 1);
  }

  function createEmptyAttackMethod() {
    return {
      id: `atk_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: "",
      weaponKind: "",
      weaponPart: "",
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
    const isEffectMultiline = !!(el.toggleEffectMultiline && el.toggleEffectMultiline.checked);

    state.skills.forEach((skill, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-index", index);
      const skillAttrTheme = normalizeAttributeTheme(skill.attribute);
      if (skillAttrTheme) {
        tr.setAttribute("data-skill-row-theme", skillAttrTheme);
      }
      
      const hit = parseDiceFormula(skill.hitDice, 2);
      const dmg = parseDiceFormula(skill.damageDice, 2);

      tr.innerHTML = `
        <td style="text-align:center;" data-label="">
          <input type="checkbox" data-key="isSecret" ${skill.isSecret ? "checked" : ""}>
        </td>
        <td data-label="名前"><input type="text" data-key="name" value="${escapeHtml(skill.name)}" placeholder="名称" list="ar2eSkillNameList"></td>
        <td data-label="SL"><input type="number" data-key="sl" value="${escapeHtml(skill.sl)}" placeholder="1" ${skill.slMax ? `max="${escapeHtml(skill.slMax)}"` : ""}></td>
        <td data-label="タイミング"><input type="text" data-key="timing" value="${escapeHtml(skill.timing)}" placeholder="メジャー等" list="ar2eTimingList"></td>
        <td data-label="判定"><input type="text" data-key="judge" value="${escapeHtml(skill.judge)}" placeholder="自動成功"></td>
        <td data-label="対象"><input type="text" data-key="target" value="${escapeHtml(skill.target)}" list="ar2eTargetList" placeholder="単体"></td>
        <td data-label="射程"><input type="text" data-key="range" value="${escapeHtml(skill.range)}" list="ar2eRangeList" placeholder="至近"></td>
        <td data-label="コスト"><input type="number" data-key="cost" value="${escapeHtml(skill.cost)}" placeholder="3"></td>
        <td data-label="命中">
          <input type="hidden" data-key="hitDice" value="${escapeHtml(skill.hitDice || "2D+0")}">
          <span class="dice-mini-editor in-table" aria-label="命中ダイス式">
            <input type="number" data-dice-key="hitDice" data-dice-part="count" min="0" step="1" value="${hit.count}" class="dice-count-input">
            <span class="dice-mark numeric-font">D</span>
            <span class="dice-plus-mark numeric-font">+</span>
            <input type="number" data-dice-key="hitDice" data-dice-part="plus" min="0" step="1" value="${hit.plus}" placeholder="0" class="dice-plus-input">
          </span>
        </td>
        <td data-label="ダメージ">
          <input type="hidden" data-key="damageDice" value="${escapeHtml(skill.damageDice || "2D+0")}">
          <span class="dice-mini-editor in-table" aria-label="ダメージダイス式">
            <input type="number" data-dice-key="damageDice" data-dice-part="count" min="0" step="1" value="${dmg.count}" class="dice-count-input">
            <span class="dice-mark numeric-font">D</span>
            <span class="dice-plus-mark numeric-font">+</span>
            <input type="number" data-dice-key="damageDice" data-dice-part="plus" min="0" step="1" value="${dmg.plus}" placeholder="0" class="dice-plus-input">
          </span>
        </td>
        <td data-label="属性"><input type="text" data-key="attribute" value="${escapeHtml(skill.attribute)}" list="ar2eAttributeList" placeholder="火(魔)" ${skillAttrTheme ? `data-skill-attr-theme="${skillAttrTheme}"` : ""}></td>
        <td data-label="効果">${isEffectMultiline
          ? `<textarea data-key="effect" placeholder="効果" rows="2">${escapeHtml(skill.effect)}</textarea>`
          : `<input type="text" data-key="effect" value="${escapeHtml(skill.effect)}" placeholder="効果">`
        }</td>
        <td style="text-align:center;" data-label="">
          <div class="row-action-wrap">
            <button type="button" class="copy-row-btn" data-copy-kind="skill-line" data-index="${index}" title="この行をコピー" aria-label="この行をコピー"><i class="fa-solid fa-copy"></i></button>
            <button type="button" class="delete-btn" data-remove-kind="skills" data-index="${index}" title="削除" aria-label="削除"><i class="fa-solid fa-trash"></i></button>
            <span class="drag-hint" draggable="true" aria-hidden="true" title="この行はドラッグで並べ替えできます">⠿</span>
          </div>
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
      const qty = Number(item.quantity);
      const unit = Number(String(item.unitPrice || "").replace(/[^0-9.-]/g, ""));
      const lineTotal = Number.isFinite(qty) && Number.isFinite(unit) ? qty * unit : "";
      tr.innerHTML = `
        <td><input type="number" data-drop-key="min" value="${escapeHtml(item.min)}" placeholder="1"></td>
        <td><input type="number" data-drop-key="max" value="${escapeHtml(item.max)}" placeholder="5"></td>
        <td><input type="text" data-drop-key="name" value="${escapeHtml(item.name)}" placeholder="アイテム名"></td>
        <td><input type="text" data-drop-key="unitPrice" value="${escapeHtml(item.unitPrice)}" placeholder="100G"></td>
        <td><input type="number" data-drop-key="quantity" value="${escapeHtml(item.quantity || "1")}" min="1" step="1" class="num-2"></td>
        <td><input type="text" value="${escapeHtml(lineTotal === "" ? "" : String(lineTotal))}" readonly tabindex="-1" aria-label="行総計" class="num-2"></td>
        <td style="text-align:center; white-space: nowrap;">
          <div class="row-action-wrap">
            <button type="button" class="copy-row-btn" data-copy-kind="drop-line" data-drop-copy="1" title="この行をコピー" aria-label="この行をコピー"><i class="fa-solid fa-copy"></i></button>
            <button type="button" class="delete-btn" data-remove-kind="dropItems" data-drop-delete="1" title="削除" aria-label="削除"><i class="fa-solid fa-trash"></i></button>
            <span class="drag-hint" draggable="true" aria-hidden="true" title="この行はドラッグで並べ替えできます">⠿</span>
          </div>
        </td>
      `;
      el.dropItemsBody.appendChild(tr);
    });

    applyNumericFontClasses();
  }

  function renderAttackMethods() {
    if (!el.attackMethodsBody) return;
    el.attackMethodsBody.innerHTML = "";
    const isEffectMultiline = !!(el.toggleEffectMultiline && el.toggleEffectMultiline.checked);

    state.attackMethods.forEach((atk, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-atk-index", index);
      const atkAttrTheme = normalizeAttributeTheme(atk.attribute);
      if (atkAttrTheme) {
        tr.setAttribute("data-atk-row-theme", atkAttrTheme);
      }
      const hit = parseDiceFormula(atk.hitDice, 2);
      const dmg = parseDiceFormula(atk.damageDice, 2);

      tr.innerHTML = `
        <td data-label="名前"><input type="text" data-atk-key="name" value="${escapeHtml(atk.name)}" placeholder="攻撃名"></td>
        <td data-label="種別"><input type="text" data-atk-key="weaponKind" value="${escapeHtml(atk.weaponKind || "")}" list="ar2eWeaponKindList" placeholder="格闘" class="atk-kind-input"></td>
        <td data-label="部位"><input type="text" data-atk-key="weaponPart" value="${escapeHtml(atk.weaponPart || "")}" list="ar2eWeaponPartList" placeholder="片" class="atk-part-input"></td>
        <td data-label="対象"><input type="text" data-atk-key="target" value="${escapeHtml(atk.target)}" list="ar2eTargetList" placeholder="単体"></td>
        <td data-label="射程"><input type="text" data-atk-key="range" value="${escapeHtml(atk.range)}" list="ar2eRangeList" placeholder="至近"></td>
        <td data-label="命中">
          <span class="dice-mini-editor in-table" aria-label="攻撃命中式">
            <input type="number" data-atk-dice-key="hitDice" data-atk-dice-part="count" min="0" step="1" value="${hit.count}" class="numeric-font dice-count-input">
            <span class="dice-mark numeric-font">D</span>
            <span class="dice-plus-mark numeric-font">+</span>
            <input type="number" data-atk-dice-key="hitDice" data-atk-dice-part="plus" min="0" step="1" value="${hit.plus}" placeholder="0" class="numeric-font dice-plus-input">
          </span>
        </td>
        <td data-label="ダメージ">
          <span class="dice-mini-editor in-table" aria-label="攻撃ダメージ式">
            <input type="number" data-atk-dice-key="damageDice" data-atk-dice-part="count" min="0" step="1" value="${dmg.count}" class="numeric-font dice-count-input">
            <span class="dice-mark numeric-font">D</span>
            <span class="dice-plus-mark numeric-font">+</span>
            <input type="number" data-atk-dice-key="damageDice" data-atk-dice-part="plus" min="0" step="1" value="${dmg.plus}" placeholder="0" class="numeric-font dice-plus-input">
          </span>
        </td>
        <td data-label="属性"><input type="text" data-atk-key="attribute" value="${escapeHtml(atk.attribute)}" list="ar2eAttributeList" placeholder="属性" ${atkAttrTheme ? `data-atk-attr-theme="${atkAttrTheme}"` : ""}></td>
        <td data-label="効果">${isEffectMultiline
          ? `<textarea data-atk-key="effect" placeholder="効果" rows="2">${escapeHtml(atk.effect)}</textarea>`
          : `<input type="text" data-atk-key="effect" value="${escapeHtml(atk.effect)}" placeholder="効果">`
        }</td>
        <td style="text-align:center;" data-label="">
          <div class="row-action-wrap">
            <button type="button" class="copy-row-btn" data-copy-kind="attack-line" data-atk-copy="1" title="この行をコピー" aria-label="この行をコピー"><i class="fa-solid fa-copy"></i></button>
            <button type="button" class="delete-btn" data-remove-kind="attackMethods" data-atk-delete="1" title="削除" aria-label="削除"><i class="fa-solid fa-trash"></i></button>
            <span class="drag-hint" draggable="true" aria-hidden="true" title="この行はドラッグで並べ替えできます">⠿</span>
          </div>
        </td>
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
      el.chatPreviewLabel.textContent = "チャットパレットプレビュー（自動生成）";
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

  function normalizeSkillNameForKoma(rawName) {
    const text = String(rawName || "").trim();
    if (!text) return "";
    const hasLeft = text.startsWith("《");
    const hasRight = text.endsWith("》");
    if (hasLeft && hasRight) return text;
    return `《${text}》`;
  }

  function buildSkillHeadlineForKoma(skill) {
    const baseName = normalizeSkillNameForKoma(skill && skill.name);
    if (!baseName) return "";
    const slRaw = String((skill && skill.sl) == null ? "" : skill.sl).trim();
    if (!slRaw) return baseName;
    const slNum = toInt(slRaw, 0);
    if (Number.isFinite(slNum) && slNum > 0) {
      return `${baseName}Lv${slNum}`;
    }
    return `${baseName}Lv${slRaw}`;
  }

  function buildAttackLineForKoma(atk) {
    if (!atk) return "";
    const name = String(atk.name || "").trim();
    if (!name) return "";
    const kind = String(atk.weaponKind || "").trim();
    const part = String(atk.weaponPart || "").trim();
    const kindPart = kind || part ? `(${kind || "-"}/${part || "-"})` : "";
    const hit = formatDiceText(String(atk.hitDice || "").trim() || "2D+0");
    const dmg = formatDiceText(String(atk.damageDice || "").trim() || "2D+0");
    const attr = String(atk.attribute || "").trim() || "-";
    const range = String(atk.range || "").trim() || "-";
    return `${name}${kindPart ? ` ${kindPart}` : ""} ${hit}/${dmg}/${attr}/${range}`.trim();
  }

  function buildAttackHitCommandForKoma(atk) {
    if (!atk) return "";
    const name = String(atk.name || "").trim();
    if (!name) return "";
    const kind = String(atk.weaponKind || "").trim();
    const part = String(atk.weaponPart || "").trim();
    const kindPart = kind || part ? `(${kind || "-"}/${part || "-"})` : "";
    const attr = String(atk.attribute || "").trim() || "-";
    const range = String(atk.range || "").trim() || "-";
    const hit = formatDiceText(String(atk.hitDice || "").trim() || "2D+0");
    return `${hit} ${name}${kindPart ? ` ${kindPart}` : ""} ${attr}/${range} 命中`;
  }

  function buildAttackContextLabelForKoma(atk) {
    if (!atk) return "";
    const name = String(atk.name || "").trim();
    if (!name) return "";
    const kind = String(atk.weaponKind || "").trim();
    const part = String(atk.weaponPart || "").trim();
    const kindPart = kind || part ? `(${kind || "-"}/${part || "-"})` : "";
    const attr = String(atk.attribute || "").trim() || "-";
    const range = String(atk.range || "").trim() || "-";
    return `${name}${kindPart ? ` ${kindPart}` : ""} ${attr}/${range}`;
  }

  function isDefaultSkillDiceForPassive(rawDice) {
    const text = String(rawDice || "").trim().toUpperCase();
    return text === "2D" || text === "2D+0";
  }

  function shouldEmitSkillDiceCommand(skill, rawDice) {
    const dice = String(rawDice || "").trim();
    if (!dice || dice === "0D" || dice === "0D+0") return false;
    const timing = String(skill && skill.timing ? skill.timing : "").trim();
    if (timing === "パッシブ" && isDefaultSkillDiceForPassive(dice)) return false;
    return true;
  }

  function buildAbilityJudgeCommandLines() {
    const labels = {
      str: "筋力",
      dex: "器用",
      agi: "敏捷",
      int: "知力",
      sen: "感知",
      mnd: "精神",
      luk: "幸運",
    };
    return ABILITY_KEYS.map((key) => {
      const derivedInput = document.querySelector(`input[data-derived="${key}"]`);
      const diceInput = document.querySelector(`input[data-field="${key}Dice"]`);
      const plus = derivedInput ? String(derivedInput.value || "0").trim() || "0" : "0";
      const count = diceInput ? String(diceInput.value || "2").trim() || "2" : "2";
      return `${formatDiceText(`${count}D+${plus}`)} ${labels[key] || key}`;
    });
  }

  function updateChatPalettePreview() {
    if (!el.chatPreview) return;

    const enemyType = el.enemyTypeSelect ? el.enemyTypeSelect.value : "general";
    if (enemyType === "general") {
      const lines = [
        `${formatDiceText(getFieldValue("evadeDice") || "2D+0")} 回避`,
        ...buildAbilityJudgeCommandLines(),
      ];

      state.attackMethods.forEach((atk) => {
        const hitLine = buildAttackHitCommandForKoma(atk);
        if (hitLine) lines.push(hitLine);
        const dmg = String(atk && atk.damageDice ? atk.damageDice : "").trim();
        if (dmg && dmg !== "0D+0" && dmg !== "0D") {
          const atkContext = buildAttackContextLabelForKoma(atk);
          if (atkContext) lines.push(`${formatDiceText(dmg)} ${atkContext} ダメージ`);
        }
      });

      lines.push("");

      state.skills.forEach((skill) => {
        const skillHead = buildSkillHeadlineForKoma(skill);
        if (!skillHead) return;
        const hitDice = String(skill.hitDice || "").trim();
        const damageDice = String(skill.damageDice || "").trim();
        if (shouldEmitSkillDiceCommand(skill, hitDice)) {
          lines.push(`${formatDiceText(hitDice)} ${skillHead} 命中`);
        }
        if (shouldEmitSkillDiceCommand(skill, damageDice)) {
          lines.push(`${formatDiceText(damageDice)} ${skillHead} ダメージ`);
        }
      });

      lines.push("");

      state.skills.forEach((skill) => {
        const skillHead = buildSkillHeadlineForKoma(skill);
        if (!skillHead) return;
        const timing = String(skill.timing || "").trim();
        const effect = String(skill.effect || "").trim();
        lines.push(`${skillHead} (${timing || "パッシブ"}) ${effect}`.trim());
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

  function toInt(value, fallback = 0) {
    const n = Number(String(value == null ? "" : value).trim());
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
  }

  function buildKomaCommandsForCurrentEnemy() {
    const enemyType = el.enemyTypeSelect ? String(el.enemyTypeSelect.value || "general") : "general";
    if (enemyType === "general") {
      const lines = [
        `${formatDiceText(getFieldValue("evadeDice") || "2D+0")} 回避`,
        ...buildAbilityJudgeCommandLines(),
      ];
      state.attackMethods.forEach((atk) => {
        const hitLine = buildAttackHitCommandForKoma(atk);
        if (hitLine) lines.push(hitLine);
      });
      return lines.join("\n");
    }

    const evadeDice = formatDiceText(getFieldValue("evadeDice") || "2D+0");
    const actionDice = formatDiceText(getFieldValue("mobActionJudge") || "2D+0");
    const reactionDice = formatDiceText(getFieldValue("mobReactionJudge") || "2D+0");
    const lines = [
      `${evadeDice} 回避`,
      `${actionDice} アクション判定`,
      `${reactionDice} リアクション判定`,
    ];

    state.skills.forEach((skill) => {
      const skillHead = buildSkillHeadlineForKoma(skill);
      if (!skillHead) return;
      const hitDice = String(skill.hitDice || "").trim();
      const damageDice = String(skill.damageDice || "").trim();
      if (shouldEmitSkillDiceCommand(skill, hitDice)) {
        lines.push(`${formatDiceText(hitDice)} ${skillHead} 命中`);
      }
      if (shouldEmitSkillDiceCommand(skill, damageDice)) {
        lines.push(`${formatDiceText(damageDice)} ${skillHead} ダメージ`);
      }
    });

    state.attackMethods.forEach((atk) => {
      const atkLine = buildAttackLineForKoma(atk);
      if (atkLine) lines.push(atkLine);
    });

    return lines.join("\n");
  }

  function buildKomaMemoByMode(mode) {
    if (mode === "pre_identify") {
      return "\n\n───\n---エネミー識別を使用してください---";
    }
    const lines = [];
    state.skills.forEach((skill) => {
      const skillHead = buildSkillHeadlineForKoma(skill);
      if (!skillHead) return;
      const timing = String(skill.timing || "").trim();
      const effect = String(skill.effect || "").trim();
      const hitDice = String(skill.hitDice || "").trim();
      const damageDice = String(skill.damageDice || "").trim();
      const target = String(skill.target || "").trim();
      const judge = String(skill.judge || "").trim();
      const range = String(skill.range || "").trim();
      const parts = [];
      if (hitDice || damageDice || target || judge || range) {
        parts.push(`${hitDice || "-"}/${damageDice || "-"}`);
        parts.push(target || "-");
        parts.push(judge || "-");
        parts.push(range || "-");
      }
      const bracket = parts.length ? ` [${parts.join("/")}]` : "";
      lines.push(`${skillHead} (${timing || "パッシブ"}) ${effect}${bracket}`.trim());
    });

    state.attackMethods.forEach((atk) => {
      const atkLine = buildAttackLineForKoma(atk);
      if (atkLine) lines.push(atkLine);
    });
    const baseMemo = String(getFieldValue("memo") || "").trim();
    const skillMemo = lines.join(" \n");
    if (!baseMemo && !skillMemo) return "";
    return `\n\n───\n${skillMemo}${baseMemo ? `\n${baseMemo}` : ""}`;
  }

  function buildKomaParamsByMode(mode) {
    const level = getFieldValue("level");
    const identification = getFieldValue("identification");
    const movement = getFieldValue("movement");
    const physDef = getFieldValue("physDef");
    const magicDef = getFieldValue("magicDef");
    const params = [
      { label: "レベル", value: String(level || "") },
      { label: "識別値", value: String(identification || "") },
    ];
    if (mode !== "post_identify") {
      params.push({ label: "物理防御", value: String(physDef || "") });
      params.push({ label: "魔法防御", value: String(magicDef || "") });
    }
    params.push({ label: "移動値", value: String(movement || "") });
    return params;
  }

  function buildKomaCharacterJson(mode = "pre_identify") {
    const name = String(getFieldValue("name") || "").trim() || "無題";
    const hp = String(getFieldValue("hp") || "").trim() || "0";
    const mp = String(getFieldValue("mp") || "").trim() || "0";
    const initiative = toInt(getFieldValue("initiative"), 0);
    return {
      kind: "character",
      data: {
        name,
        memo: buildKomaMemoByMode(mode),
        initiative,
        status: [
          { label: "HP", value: hp, max: hp },
          { label: "MP", value: mp, max: mp },
        ],
        params: buildKomaParamsByMode(mode),
        commands: buildKomaCommandsForCurrentEnemy(),
        ...(mode === "pre_identify" ? { secret: true } : {}),
      },
    };
  }

  async function exportKomaJsonByCurrentMode() {
    const mode = el.komaExportModeSelect ? String(el.komaExportModeSelect.value || "pre_identify") : "pre_identify";
    const jsonObj = buildKomaCharacterJson(mode);
    const text = JSON.stringify(jsonObj);
    if (typeof shared.writeClipboardText === "function") {
      await shared.writeClipboardText(text);
      if (typeof shared.showToast === "function") {
        shared.showToast("コマJSONをコピーしました", { id: "ar2eKomaToast" });
      }
      return;
    }
    window.prompt("コマJSON（コピーしてください）", text);
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
    const text = String(value || "").replace(/なし/g, "").replace(/-/g, "");
    const themes = [];
    // 順序を固定してクラス名を生成 (火-水 など)
    if (text.includes("火")) themes.push("fire");
    if (text.includes("水")) themes.push("water");
    if (text.includes("風")) themes.push("wind");
    if (text.includes("地")) themes.push("earth");
    if (text.includes("光")) themes.push("light");
    if (text.includes("闇")) themes.push("dark");
    if (text.includes("特殊")) themes.push("special");
    
    if (themes.length === 0) return "";
    // 2つ以上ある場合は連結
    return themes.join("-");
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
    const attributeSelectGroup = el.attributeSelectGroup || document.getElementById("attributeSelectGroup");
    const editorPane = document.querySelector(".editor-pane");
    const basicInfoBlock = document.querySelector(".left-column-stack > .data-block:first-child");

    const allBlocks = Array.from(document.querySelectorAll(".editor-pane .data-block"));
    const targets = [attributeSelectGroup, editorPane, ...allBlocks];
    const colorMap = {
      "fire":    { hex: "#ef4444", rgb: "239, 68, 68" },
      "water":   { hex: "#3b82f6", rgb: "59, 130, 246" },
      "wind":    { hex: "#22c55e", rgb: "34, 197, 94" },
      "earth":   { hex: "#d97706", rgb: "217, 119, 6" },
      "light":   { hex: "#facc15", rgb: "250, 204, 21" },
      "dark":    { hex: "#8b5cf6", rgb: "139, 92, 246" },
      "special": { hex: "#06b6d4", rgb: "6, 182, 212" }
    };

    if (!attributeInput || !attributeInput.value || attributeInput.value === "-") {
      targets.forEach(node => {
        if (node) {
          node.removeAttribute("data-attr-theme");
          node.style.removeProperty("--attr-clr-1");
          node.style.removeProperty("--attr-clr-2");
          node.style.removeProperty("--attr-rgb-1");
          node.style.removeProperty("--attr-rgb-2");
        }
      });
      return;
    }

    const theme = normalizeAttributeTheme(attributeInput.value);
    const themes = theme.split("-");
    const c1 = colorMap[themes[0]] || { hex: "transparent", rgb: "0,0,0" };
    const c2 = colorMap[themes[1]] || c1;

    targets.forEach(node => {
      if (node) {
        node.setAttribute("data-attr-theme", theme);
        node.style.setProperty("--attr-clr-1", c1.hex);
        node.style.setProperty("--attr-clr-2", c2.hex);
        node.style.setProperty("--attr-rgb-1", c1.rgb);
        node.style.setProperty("--attr-rgb-2", c2.rgb);
      }
    });
  }

  // =======================================================
  // ユーティリティ・イベントバインド
  // =======================================================

  function escapeHtml(str) {
    if (!str) return "";
    const sharedApi = getEnemiesShared();
    return typeof sharedApi.escapeHtml === "function"
      ? sharedApi.escapeHtml(str)
      : String(str);
  }

  function bindEvents() {
    document.querySelectorAll('input[data-derived]').forEach((node) => {
      node.tabIndex = -1;
    });

    // 行追加ボタン
    if (el.addSkillBtn) {
      el.addSkillBtn.addEventListener("click", () => {
        state.skills.push(createEmptySkill());
        renderSkills();
      });
    }

    // テーブル内の入力監視（即時反映）
    if (el.skillsBody) {
      let draggingSkillIndex = -1;
      el.skillsBody.addEventListener("dragstart", (e) => {
        const handle = e.target.closest(".drag-hint");
        if (!handle) return;
        const tr = handle.closest("tr[data-index]");
        if (!tr) return;
        draggingSkillIndex = Number(tr.getAttribute("data-index"));
        tr.classList.add("is-dragging");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", String(draggingSkillIndex));
          e.dataTransfer.setDragImage(tr, 24, 12);
        }
      });
      el.skillsBody.addEventListener("dragover", (e) => {
        if (draggingSkillIndex < 0) return;
        const tr = e.target.closest("tr[data-index]");
        if (!tr) return;
        e.preventDefault();
        tr.classList.add("is-drag-over");
      });
      el.skillsBody.addEventListener("dragleave", (e) => {
        const tr = e.target.closest("tr[data-index]");
        if (tr) tr.classList.remove("is-drag-over");
      });
      el.skillsBody.addEventListener("drop", (e) => {
        const tr = e.target.closest("tr[data-index]");
        if (!tr || draggingSkillIndex < 0) return;
        e.preventDefault();
        tr.classList.remove("is-drag-over");
        const toIndex = Number(tr.getAttribute("data-index"));
        if (moveRowByIndex(state.skills, draggingSkillIndex, toIndex)) {
          renderSkills();
          markDirty();
        }
        draggingSkillIndex = -1;
      });
      el.skillsBody.addEventListener("dragend", () => {
        draggingSkillIndex = -1;
        el.skillsBody.querySelectorAll("tr.is-dragging").forEach((row) => row.classList.remove("is-dragging"));
        el.skillsBody.querySelectorAll("tr.is-drag-over").forEach((row) => row.classList.remove("is-drag-over"));
      });

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
            const count = clampDiceValue(countInput.value, 2);
            const plusRaw = String(plusInput.value || "").trim();
            const plus = plusRaw === "" ? "" : clampDiceValue(plusRaw, 0);
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

          if (key === "attribute") {
            const theme = normalizeAttributeTheme(target.value);
            if (theme) {
              target.setAttribute("data-skill-attr-theme", theme);
              tr.setAttribute("data-skill-row-theme", theme);
            } else {
              target.removeAttribute("data-skill-attr-theme");
              tr.removeAttribute("data-skill-row-theme");
            }
          }

          if (key === "name") return;

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

      el.skillsBody.addEventListener("change", (e) => {
        const target = e.target;
        const tr = target.closest("tr");
        if (!tr) return;
        const index = Number(tr.getAttribute("data-index"));
        const key = target.getAttribute("data-key");
        if (key !== "name" || !state.skills[index]) return;
        state.skills[index].name = target.value;
        normalizeSkillNameAndLevel(state.skills[index]);
        applySkillMasterToSkill(state.skills[index], { force: true });
        expandSkillByMasterName(state.skills[index].name);
        renderSkills();
        markDirty();
      });

      // 削除ボタン
      el.skillsBody.addEventListener("click", (e) => {
        const copyBtn = e.target.closest("button[data-copy-kind='skill-line']");
        if (copyBtn) {
          const tr = copyBtn.closest("tr");
          if (!tr) return;
          const index = Number(tr.getAttribute("data-index"));
          const src = state.skills[index];
          if (!src) return;
          const copied = deepClone(src);
          copied.id = `skill_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          state.skills.splice(index + 1, 0, copied);
          renderSkills();
          markDirty();
          return;
        }

        const btn = e.target.closest("button[data-remove-kind='skills']");
        if (!btn) return;
        const tr = btn.closest("tr");
        if (!tr) return;
        const index = Number(tr.getAttribute("data-index"));

        state.skills.splice(index, 1);
        renderSkills();
        markDirty();
      });
    }

    if (el.dropItemsBody) {
      let draggingDropIndex = -1;
      el.dropItemsBody.addEventListener("dragstart", (e) => {
        const handle = e.target.closest(".drag-hint");
        if (!handle) return;
        const tr = handle.closest("tr[data-drop-index]");
        if (!tr) return;
        draggingDropIndex = Number(tr.getAttribute("data-drop-index"));
        tr.classList.add("is-dragging");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", String(draggingDropIndex));
          e.dataTransfer.setDragImage(tr, 24, 12);
        }
      });
      el.dropItemsBody.addEventListener("dragover", (e) => {
        if (draggingDropIndex < 0) return;
        const tr = e.target.closest("tr[data-drop-index]");
        if (!tr) return;
        e.preventDefault();
        tr.classList.add("is-drag-over");
      });
      el.dropItemsBody.addEventListener("dragleave", (e) => {
        const tr = e.target.closest("tr[data-drop-index]");
        if (tr) tr.classList.remove("is-drag-over");
      });
      el.dropItemsBody.addEventListener("drop", (e) => {
        const tr = e.target.closest("tr[data-drop-index]");
        if (!tr || draggingDropIndex < 0) return;
        e.preventDefault();
        tr.classList.remove("is-drag-over");
        const toIndex = Number(tr.getAttribute("data-drop-index"));
        if (moveRowByIndex(state.dropItems, draggingDropIndex, toIndex)) {
          renderDropItems();
          markDirty();
        }
        draggingDropIndex = -1;
      });
      el.dropItemsBody.addEventListener("dragend", () => {
        draggingDropIndex = -1;
        el.dropItemsBody.querySelectorAll("tr.is-dragging").forEach((row) => row.classList.remove("is-dragging"));
        el.dropItemsBody.querySelectorAll("tr.is-drag-over").forEach((row) => row.classList.remove("is-drag-over"));
      });

      el.dropItemsBody.addEventListener("input", (e) => {
        const target = e.target;
        const tr = target.closest("tr");
        if (!tr) return;
        const index = Number(tr.getAttribute("data-drop-index"));
        const key = target.getAttribute("data-drop-key");
        if (key && state.dropItems[index]) {
          state.dropItems[index][key] = target.value;

          const qty = Number(state.dropItems[index].quantity);
          const unit = Number(String(state.dropItems[index].unitPrice || "").replace(/[^0-9.-]/g, ""));
          const lineTotal = Number.isFinite(qty) && Number.isFinite(unit) ? qty * unit : "";
          const totalInput = tr.querySelector('td:nth-child(6) input[readonly]');
          if (totalInput) {
            totalInput.value = lineTotal === "" ? "" : String(lineTotal);
          }
          markDirty();
        }
      });

      el.dropItemsBody.addEventListener("click", (e) => {
        const copyBtn = e.target.closest("button[data-drop-copy]");
        if (copyBtn) {
          const tr = copyBtn.closest("tr");
          if (!tr) return;
          const index = Number(tr.getAttribute("data-drop-index"));
          const src = state.dropItems[index];
          if (!src) return;
          const insertIndex = Math.max(0, index);
          state.dropItems.splice(insertIndex, 0, {
            min: getNextDropMinByInsertIndex(insertIndex),
            max: src.max,
            name: src.name,
            unitPrice: src.unitPrice,
            quantity: src.quantity,
          });
          renderDropItems();
          markDirty();
          return;
        }

        const btn = e.target.closest("button[data-drop-delete]");
        if (!btn) return;
        const tr = btn.closest("tr");
        if (!tr) return;
        const index = Number(tr.getAttribute("data-drop-index"));
        state.dropItems.splice(index, 1);
        renderDropItems();
        markDirty();
      });
    }

    if (el.addDropItemBtn) {
      el.addDropItemBtn.addEventListener("click", () => {
        const insertIndex = state.dropItems.length;
        const row = createEmptyDropItem();
        row.min = getNextDropMinByInsertIndex(insertIndex);
        state.dropItems.push(row);
        renderDropItems();
        markDirty();
      });
    }

    if (el.attackMethodsBody) {
      let draggingAtkIndex = -1;
      el.attackMethodsBody.addEventListener("dragstart", (e) => {
        const handle = e.target.closest(".drag-hint");
        if (!handle) return;
        const tr = handle.closest("tr[data-atk-index]");
        if (!tr) return;
        draggingAtkIndex = Number(tr.getAttribute("data-atk-index"));
        tr.classList.add("is-dragging");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", String(draggingAtkIndex));
          e.dataTransfer.setDragImage(tr, 24, 12);
        }
      });
      el.attackMethodsBody.addEventListener("dragover", (e) => {
        if (draggingAtkIndex < 0) return;
        const tr = e.target.closest("tr[data-atk-index]");
        if (!tr) return;
        e.preventDefault();
        tr.classList.add("is-drag-over");
      });
      el.attackMethodsBody.addEventListener("dragleave", (e) => {
        const tr = e.target.closest("tr[data-atk-index]");
        if (tr) tr.classList.remove("is-drag-over");
      });
      el.attackMethodsBody.addEventListener("drop", (e) => {
        const tr = e.target.closest("tr[data-atk-index]");
        if (!tr || draggingAtkIndex < 0) return;
        e.preventDefault();
        tr.classList.remove("is-drag-over");
        const toIndex = Number(tr.getAttribute("data-atk-index"));
        if (moveRowByIndex(state.attackMethods, draggingAtkIndex, toIndex)) {
          renderAttackMethods();
          markDirty();
        }
        draggingAtkIndex = -1;
      });
      el.attackMethodsBody.addEventListener("dragend", () => {
        draggingAtkIndex = -1;
        el.attackMethodsBody.querySelectorAll("tr.is-dragging").forEach((row) => row.classList.remove("is-dragging"));
        el.attackMethodsBody.querySelectorAll("tr.is-drag-over").forEach((row) => row.classList.remove("is-drag-over"));
      });

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
            const count = clampDiceValue(countInput.value, 2);
            const plusRaw = String(plusInput.value || "").trim();
            const plus = plusRaw === "" ? "" : clampDiceValue(plusRaw, 0);
            const formula = plus === "" ? `${count}D+0` : `${count}D+${plus}`;
            state.attackMethods[index][diceKey] = formula;
          }
          return;
        }

        if (key) {
          state.attackMethods[index][key] = target.value;
          if (key === "attribute") {
            const theme = normalizeAttributeTheme(target.value);
            if (theme) {
              target.setAttribute("data-atk-attr-theme", theme);
              tr.setAttribute("data-atk-row-theme", theme);
            } else {
              target.removeAttribute("data-atk-attr-theme");
              tr.removeAttribute("data-atk-row-theme");
            }
          }
        }
      });

      el.attackMethodsBody.addEventListener("click", (e) => {
        const copyBtn = e.target.closest("button[data-copy-kind='attack-line']");
        if (copyBtn) {
          const tr = copyBtn.closest("tr");
          if (!tr) return;
          const index = Number(tr.getAttribute("data-atk-index"));
          const src = state.attackMethods[index];
          if (!src) return;
          state.attackMethods.splice(index + 1, 0, deepClone(src));
          renderAttackMethods();
          markDirty();
          return;
        }

        const btn = e.target.closest("button[data-atk-delete]");
        if (!btn) return;
        const tr = btn.closest("tr");
        if (!tr) return;
        const index = Number(tr.getAttribute("data-atk-index"));
        state.attackMethods.splice(index, 1);
        renderAttackMethods();
        markDirty();
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

    if (el.toggleEffectMultiline) {
      el.toggleEffectMultiline.addEventListener("change", () => {
        renderSkills();
        renderAttackMethods();
        markDirty();
      });
    }

    // フォーム全体での入力監視（ダイス変更時にチャパレを更新するため）
    if (el.form) {
      el.form.addEventListener("keydown", (e) => {
        if (e.key !== "Tab" || e.altKey || e.ctrlKey || e.metaKey) return;
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;
        if (!target.classList.contains("num-ability-val")) return;

        const abilityInputs = Array.from(el.form.querySelectorAll("input.num-ability-val"));
        const currentIndex = abilityInputs.indexOf(target);
        if (currentIndex < 0) return;

        const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
        const nextTarget = abilityInputs[nextIndex];
        if (!nextTarget) return;

        e.preventDefault();
        nextTarget.focus();
        nextTarget.select();
      });

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

    const bindOutsideFormMetaInput = (node, onChange) => {
      if (!node || !el.form || el.form.contains(node)) return;
      node.addEventListener("input", onChange);
      node.addEventListener("change", onChange);
    };

    bindOutsideFormMetaInput(el.fieldAuthor, (e) => {
      rememberAuthor(e.target && e.target.value ? e.target.value : "");
      markDirty();
    });
    bindOutsideFormMetaInput(el.fieldIconUrl, () => {
      markDirty();
    });
    bindOutsideFormMetaInput(el.fieldIsPublic, (e) => {
      const checked = !!(e.target && e.target.checked);
      if (el.fieldIsPublicText) {
        el.fieldIsPublicText.textContent = checked ? "公開" : "非公開";
      }
      markDirty();
    });

    if (el.newEnemyButton) el.newEnemyButton.addEventListener("click", createNewEnemy);
    if (el.saveEnemyButton) {
      el.saveEnemyButton.addEventListener("click", async () => {
        try {
          const current = getSelectedEnemy();
          const isNew = isUnsavedEnemy(current);
          setStatus(isNew ? "新規保存中…" : "保存中…");
          await saveCurrentToDb();
          setStatus(isNew ? "新規保存完了" : "保存済み");
        } catch (e) {
          setStatus(`保存失敗: ${e.message || "error"}`);
        }
      });
    }
    if (el.saveAsEnemyButton) {
      el.saveAsEnemyButton.addEventListener("click", async () => {
        const current = getSelectedEnemy();
        if (!current) return;
        let name = String(current.name || "").trim();
        if (!name) {
          name = requestSaveAsName("") || "";
        }
        name = String(name || "").trim();
        if (!name) return;

        if (name === String(current.name || "").trim()) {
          const sameNameAction = await requestSaveAsSameNameAction(name);
          if (sameNameAction === "cancel") return;
          if (sameNameAction === "copy") {
            name = buildCopiedName(name);
          }
        }

        readFormToCurrentEnemy();
        const copied = deepClone(current);
        copied.ID = `new_${Date.now()}`;
        copied.name = String(name).trim();
        localUnsavedEnemyIds.add(String(copied.ID));
        state.enemies.unshift(copied);
        state.selectedId = copied.ID;
        try {
          setStatus("新規保存中…");
          await saveCurrentToDb();
          setStatus("新規保存完了");
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
        const selected = getSelectedEnemy();
        if (state.dirty) {
          const targetName = String((selected && selected.name) || "").trim() || "編集中データ";
          const ok = window.confirm(
            `「${targetName}」をDBから再読込しますか？\n未保存の変更は失われます。\n\n「いいえ」を押すと新規白紙を作成します。`,
          );
          if (!ok) {
            createNewEnemy();
            return;
          }
        }

        if (selected) {
          readFormToCurrentEnemy();
        }
        try {
          setStatus("読込中…");
          await loadFromDb();
          setStatus("読込完了");
        } catch (e) {
          setStatus(`読込失敗: ${e.message || "error"}`);
        }
      });
    }
    if (el.exportKomaJsonButton) {
      el.exportKomaJsonButton.addEventListener("click", async () => {
        try {
          readFormToCurrentEnemy();
          await exportKomaJsonByCurrentMode();
          setStatus("コマJSON出力完了");
        } catch (e) {
          setStatus(`コマJSON出力失敗: ${e.message || "error"}`);
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

          let merged;
          // ココフォリアの駒JSON形式の場合
          if (parsed.kind === "character" && parsed.data) {
            merged = deepClone(current);
            if (!merged.data) merged.data = { sheet: {}, skills: [], dropItems: [], attackMethods: [] };
            if (!merged.data.sheet) merged.data.sheet = {};
            
            const d = parsed.data;
            if (d.name) merged.name = d.name;
            if (d.initiative !== undefined) merged.data.sheet.initiative = d.initiative;
            
            if (Array.isArray(d.status)) {
              d.status.forEach(st => {
                if (st.label === "HP") merged.data.sheet.hp = st.value;
                if (st.label === "MP") merged.data.sheet.mp = st.value;
              });
            }
            if (Array.isArray(d.params)) {
              d.params.forEach(p => {
                let val = String(p.value || "");
                // 「能力値の 18/6 は18を保存 6は自動入力部分」
                if (val.includes("/")) {
                  val = val.split("/")[0].trim();
                }
                if (p.label === "レベル") merged.data.sheet.level = val;
                if (p.label === "識別値") merged.data.sheet.identification = val;
                if (p.label === "物理防御" || p.label === "物理防御力") merged.data.sheet.physDef = val;
                if (p.label === "魔法防御" || p.label === "魔法防御力") merged.data.sheet.magicDef = val;
                if (p.label === "移動値" || p.label === "移動") merged.data.sheet.movement = val;
                if (p.label === "筋力") merged.data.sheet.str = val;
                if (p.label === "器用") merged.data.sheet.dex = val;
                if (p.label === "敏捷") merged.data.sheet.agi = val;
                if (p.label === "知力") merged.data.sheet.int = val;
                if (p.label === "感知") merged.data.sheet.sen = val;
                if (p.label === "精神") merged.data.sheet.mnd = val;
                if (p.label === "幸運") merged.data.sheet.luk = val;
              });
            }

            // Commands parsing
            const cmdHitDice = {};
            const cmdDmgDice = {};
            if (d.commands) {
              const lines = String(d.commands).split("\n");
              lines.forEach(line => {
                const match = line.trim().match(/^([0-9D\+\-]+)\s+(.*)$/i);
                if (match) {
                  let dice = match[1];
                  const namePart = match[2];
                  const rMatch = dice.match(/^(\d+)\+(\d+)D$/i);
                  if (rMatch) dice = `${rMatch[2]}D+${rMatch[1]}`;
                  
                  if (namePart === "回避") merged.data.sheet.evadeDice = dice;
                  else if (namePart === "アクション判定") {
                    merged.data.sheet.mobActionJudge = dice;
                    merged.data.sheet.enemyType = "mob";
                    merged.class_type = "mob";
                  }
                  else if (namePart === "リアクション判定") {
                    merged.data.sheet.mobReactionJudge = dice;
                    merged.data.sheet.enemyType = "mob";
                    merged.class_type = "mob";
                  }
                  else if (namePart.endsWith(" 命中")) {
                    cmdHitDice[namePart.replace(/ 命中$/, "").trim()] = dice;
                  }
                  else if (namePart.endsWith(" ダメージ")) {
                    cmdDmgDice[namePart.replace(/ ダメージ$/, "").trim()] = dice;
                  }
                }
              });
            }

            // Memo parsing
            if (d.memo) {
              const parts = d.memo.split(/───|---エネミー識別を使用してください---/);
              if (parts.length > 1) {
                const skillText = parts[parts.length - 1].trim();
                const skillLines = skillText.split("\n");
                
                const baseMemoLines = [];
                if (parts[0].trim()) baseMemoLines.push(parts[0].trim());
                
                merged.data.skills = [];
                
                skillLines.forEach(line => {
                  let lineText = line.trim();
                  let bracketText = "";
                  const bMatch = lineText.match(/(.*?)\s*\[([^\]]+)\]$/);
                  if (bMatch && bMatch[2].includes("/")) {
                    lineText = bMatch[1];
                    bracketText = bMatch[2];
                  }
                  
                  const sMatch = lineText.match(/^『(.+?)』\((.*?)\)\s*(.*)$/);
                  if (sMatch) {
                    const sName = sMatch[1].trim();
                    const s = {
                      id: `skill_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                      name: "《" + sName + "》",
                      timing: sMatch[2].trim(),
                      effect: sMatch[3].trim(),
                      hitDice: cmdHitDice[sName] || "",
                      damageDice: cmdDmgDice[sName] || "",
                      target: "",
                      judge: "",
                      range: "",
                      cost: "",
                      sl: "",
                      isSecret: false
                    };
                    
                    if (bracketText) {
                      const bParts = bracketText.split(/[\s/]+/).filter(Boolean);
                      if (bParts.length >= 5) {
                        if (!s.hitDice && bParts[0] !== "-") s.hitDice = bParts[0];
                        if (!s.damageDice && bParts[1] !== "-") s.damageDice = bParts[1];
                        if (bParts[2] !== "-") s.target = bParts[2];
                        if (bParts[3] !== "-") s.judge = bParts[3];
                        if (bParts[4] !== "-") s.range = bParts[4];
                      }
                    }
                    merged.data.skills.push(s);
                  } else {
                    if (line.trim()) baseMemoLines.push(line.trim());
                  }
                });
                merged.memo = baseMemoLines.join("\n");
              } else {
                merged.memo = d.memo.trim();
              }
            }
          } else {
            // DB形式など直接のマージフォールバック
            merged = fromApiEnemy({ ...current, ...parsed, data: parsed.data || current.data });
          }

          const idx = state.enemies.findIndex((x) => String(x.ID) === String(current.ID));
          if (idx >= 0) state.enemies[idx] = merged;
          fillFormFromEnemy(merged);
          // ココフォリアからのインポート後は算出値を再計算
          updateAbilityDerived();
          markDirty();
          renderEnemyList();
          el.importJsonInput.value = ""; // 読み込み後にクリア
          setStatus("JSONインポート完了", "ok");
        } catch (e) {
          setStatus(`JSON読込失敗: ${e.message || "error"}`, "error");
        }
      });
    }
  }

  // 初期起動処理
  async function init() {
    bindEvents();
    await loadSkillNameMaster();
    bindDiceMiniEditor("evadeDice", "evadeDiceCount", "evadeDicePlus");
    bindDiceMiniEditor("mobActionJudge", "mobActionDiceCount", "mobActionDicePlus");
    bindDiceMiniEditor("mobReactionJudge", "mobReactionDiceCount", "mobReactionDicePlus");
    applyNumericFontClasses();
    try {
      await loadFromDb();
      restoreDraftIfNeededOnce();
    } catch (e) {
      console.error("[AR2E] Failed to load from DB:", e);
      setStatus(`DB読込失敗: ${e.message || "error"}`, "error");
      
      const fresh = createEnemyTemplate({ auto: true });
      fresh.data = {
        sheet: { enemyType: "general", isPublic: true, author: getRememberedAuthor() },
        skills: [createEmptySkill(), createEmptySkill(), createEmptySkill()],
        dropItems: [createEmptyDropItem(), createEmptyDropItem()],
        attackMethods: [createEmptyAttackMethod()],
      };
      state.enemies = [fresh];
      state.selectedId = fresh.ID;
      localUnsavedEnemyIds.add(String(fresh.ID));
      fillFormFromEnemy(fresh);
      restoreDraftIfNeededOnce();
      renderEnemyList();
    }

    window.addEventListener("beforeunload", (event) => {
      if (!state.dirty) return;
      saveDraftSnapshotFromCurrent();
      event.preventDefault();
      event.returnValue = "";
    });
  }

  document.addEventListener("DOMContentLoaded", init);

})();

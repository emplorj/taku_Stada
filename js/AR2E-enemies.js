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
    exDropItems: [],
    dropItems: [],
    attackMethods: [],
    resources: [],
    enemies: [],
    selectedId: null,
    dirty: false,
    search: "",
    searchField: "all",
    sortMode: "time",
    sortDir: "desc",
    page: 1,
    pageSize: 10,
    adminMode: false,
    viewStage: "pre_identify",
    viewMode: false,
  };
  const localUnsavedEnemyIds = new Set();
  let keepDraftSnapshotOnNextFill = false;

  const el = {
    form: document.getElementById("enemyEditorForm"),
    skillsBody: document.getElementById("skillsBody"),
    addSkillBtn: document.getElementById("addSkillBtn"),
    skillDisplayModeButton: document.getElementById("skillDisplayModeButton"),
    skillSummaryList: document.getElementById("skillSummaryList"),
    chatPreview: document.getElementById("chat-palette-preview"),
    chatPreviewLines: document.getElementById("chatPreviewLines"),
    chatPreviewLabel: document.getElementById("chatPreviewLabel"),
    copyChatPaletteButton: document.getElementById("copyChatPaletteButton"),
    enemyViewPane: document.getElementById("enemyViewPane"),
    enemyViewContent: document.getElementById("enemyViewContent"),
    enemyViewChatPaletteText: document.getElementById("enemyViewChatPaletteText"),
    viewToggleChatPaletteButton: document.getElementById("viewToggleChatPaletteButton"),
    viewWideModeToggle: document.getElementById("viewWideModeToggle"),
    viewCopyChatPaletteButton: document.getElementById("viewCopyChatPaletteButton"),
    viewCopyKomaJsonButton: document.getElementById("viewCopyKomaJsonButton"),
    viewCopyKomaJsonToolbarButton: document.getElementById("viewCopyKomaJsonToolbarButton"),
    viewEditModeButton: document.getElementById("viewEditModeButton"),
    openEnemyViewButton: document.getElementById("openEnemyViewButton"),
    nameInput: document.querySelector('input[data-field="name"]'),
    enemyTypeSelect: document.getElementById("enemyTypeSelect"),
    abilityBlockTitle: document.getElementById("abilityBlockTitle"),
    generalAbilityBlock: document.getElementById("generalAbilityBlock"),
    mobJudgeBlock: document.getElementById("mobJudgeBlock"),
    exDropItemsBody: document.getElementById("exDropItemsBody"),
    addExDropItemBtn: document.getElementById("addExDropItemBtn"),
    dropItemsBody: document.getElementById("dropItemsBody"),
    addDropItemBtn: document.getElementById("addDropItemBtn"),
    resourcesBody: document.getElementById("resourcesBody"),
    addResourceBtn: document.getElementById("addResourceBtn"),
    attackMethodsBody: document.getElementById("attackMethodsBody"),
    addAttackMethodBtn: document.getElementById("addAttackMethodBtn"),
    attributeInput: document.getElementById("field-attribute"),
    attributeSelectGroup: document.getElementById("attributeSelectGroup"),
    attributeDivider: document.getElementById("attributeDivider"),
    attributePrimarySelect: document.getElementById("attributePrimarySelect"),
    attributeSecondarySelect: document.getElementById("attributeSecondarySelect"),
    attributeSpecialText: document.getElementById("attributeSpecialText"),
    toggleDiceFormat: document.getElementById("toggleDiceFormat"),
    toggleEffectMultiline: document.getElementById("toggleEffectMultiline"),
    fieldId: document.getElementById("field-id"),
    fieldAuthor: document.getElementById("field-author"),
    fieldIconUrl: document.getElementById("field-icon-url"),
    fieldIsPublic: document.getElementById("field-is-public"),
    fieldIsPublicText: document.getElementById("field-is-public-text"),
    fieldShowDropsInView: document.getElementById("field-show-drops-in-view"),
    saveStatusText: document.getElementById("saveStatusText"),
    newEnemyButton: document.getElementById("newEnemyButton"),
    saveEnemyButton: document.getElementById("saveEnemyButton"),
    saveAsEnemyButton: document.getElementById("saveAsEnemyButton"),
    shareEnemyButton: document.getElementById("shareEnemyButton"),
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


  function getUrlMode() {
    try {
      return String(new URLSearchParams(window.location.search).get("mode") || "").trim().toLowerCase();
    } catch (_e) {
      return "";
    }
  }

  function shouldStartInViewMode() {
    return !!getSharedEnemyIdFromUrl() && getUrlMode() !== "edit";
  }

  function setPageMode() {
    state.viewMode = shouldStartInViewMode();
    document.documentElement.classList.toggle("is-ar2e-enemy-view-boot", !!state.viewMode);
    document.body.classList.toggle("is-enemy-view-mode", !!state.viewMode);
    if (el.enemyViewPane) el.enemyViewPane.hidden = !state.viewMode;
    if (state.viewMode && el.enemyViewContent && !String(el.enemyViewContent.innerHTML || "").trim()) {
      el.enemyViewContent.innerHTML = `<section class="enemy-view-block enemy-view-loading">エネミー情報を読み込み中...</section>`;
    }
  }

  function showToast(message, kind = "info") {
    const sharedApi = getEnemiesShared();
    if (!sharedApi || typeof sharedApi.showToast !== "function") return;
    sharedApi.showToast(message, {
      kind,
      id: "copyToast",
      className: "copy-toast",
      errorClass: "is-error",
      showClass: "is-show",
      duration: 1800,
    });
  }

  function message(key, params = {}) {
    const sharedApi = getEnemiesShared();
    if (sharedApi && typeof sharedApi.getMessage === "function") {
      return sharedApi.getMessage(key, params);
    }
    return String(key || "");
  }

  function showKomaJsonCopySuccessToast() {
    showToast(message("komaJsonCopySuccess"), "info");
  }

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

  function toHalfWidthNumericText(value) {
    return String(value == null ? "" : value)
      .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
      .replace(/[＋]/g, "+")
      .replace(/[－ー―]/g, "-")
      .replace(/[．]/g, ".");
  }

  function normalizeNumericLikeInput(target) {
    if (!target || target.tagName !== "INPUT") return false;
    const type = String(target.getAttribute("type") || "text").toLowerCase();
    const numericType = type === "number" || target.classList.contains("numeric-font") || target.classList.contains("num-2");
    const numericDataKey = [
      "data-field",
      "data-key",
      "data-dice-key",
      "data-atk-dice-key",
      "data-drop-key",
      "data-ex-drop-key",
      "data-resource-key",
    ].some((attr) => /(?:level|hp|mp|initiative|movement|identification|physDef|magicDef|sl|cost|quantity|min|max|unitPrice|current|str|dex|agi|int|sen|mnd|luk|Dice)$/i.test(String(target.getAttribute(attr) || "")));
    if (!numericType && !numericDataKey) return false;

    const before = target.value;
    const after = toHalfWidthNumericText(before);
    if (before === after) return false;

    const start = target.selectionStart;
    const end = target.selectionEnd;
    target.value = after;
    try {
      if (start != null && end != null && type !== "number") {
        target.setSelectionRange(start, end);
      }
    } catch (_e) {}
    return true;
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

  function getSharedEnemyIdFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      return String(params.get("id") || params.get("enemy") || "").trim();
    } catch (_e) {
      return "";
    }
  }

  function buildEnemyShareUrl(enemyId) {
    const id = String(enemyId || "").trim();
    if (!id) return "";
    const url = new URL(window.location.href);
    url.searchParams.set("id", id);
    url.hash = "";
    return url.toString();
  }


  function openUrlInNewTab(url) {
    const href = typeof url === "string" ? url : String(url && url.toString ? url.toString() : url || "");
    if (!href) return;
    window.open(href, "_blank", "noopener");
  }

  function openEnemyViewInNewTab(enemyId) {
    const id = String(enemyId || "").trim();
    if (!id) return;
    const url = new URL(window.location.href);
    url.searchParams.set("id", id);
    url.searchParams.delete("mode");
    openUrlInNewTab(url);
  }

  function openEnemyEditInNewTab(enemyId) {
    const id = String(enemyId || "").trim();
    const url = new URL(window.location.href);
    url.searchParams.set("mode", "edit");
    if (id) url.searchParams.set("id", id);
    openUrlInNewTab(url);
  }

  function copyTextToClipboard(text) {
    const value = String(text || "");
    if (!value) return Promise.reject(new Error("コピーするテキストがありません"));
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      return navigator.clipboard.writeText(value);
    }
    return new Promise((resolve, reject) => {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        ok ? resolve() : reject(new Error("コピーに失敗しました"));
      } catch (error) {
        reject(error);
      }
    });
  }

  function tryEnableAdminModeFromImport(raw) {
    if (String(raw || "").trim() !== "9800") return false;
    const ok = window.confirm("管理者モードとして、すべてのエネミーを表示しますか？");
    if (!ok) return true;
    state.adminMode = true;
    state.page = 1;
    setStatus("管理者モード");
    showToast("管理者モード", "info");
    if (el.importJsonInput) el.importJsonInput.value = "";
    loadFromDb()
      .then(() => {
        state.page = 1;
        renderEnemyList();
        setStatus("管理者モード");
      })
      .catch((error) => {
        console.error("[AR2E] 管理者モード読込失敗:", error);
        setStatus(`管理者モード読込失敗: ${error.message || "error"}`);
      });
    return true;
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
    const message = String(text || "");
    if (el.saveStatusText) el.saveStatusText.textContent = message;
    if (!message || message === "未保存" || message === "保存済み" || message === "新規白紙") return;
    const isError = /失敗|エラー|error/i.test(message);
    showToast(message, isError ? "error" : "info");
  }

  function markDirty() {
    state.dirty = true;
    const current = getSelectedEnemy();
    if (current) current._pristineNew = false;
    setStatus("未保存");
    saveDraftSnapshotFromCurrent();
    renderEnemyView();
  }

  function clearDraftSnapshot() {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      sessionStorage.removeItem(DRAFT_PROMPTED_KEY);
    } catch (_e) {}
  }

  function hasDraftSnapshot() {
    try {
      return !!sessionStorage.getItem(DRAFT_STORAGE_KEY);
    } catch (_e) {
      return false;
    }
  }

  function isBlankNewEnemyDraft(enemy) {
    if (!enemy || typeof enemy !== "object" || !isUnsavedEnemy(enemy)) return false;
    const sheet = enemy.data && enemy.data.sheet && typeof enemy.data.sheet === "object" ? enemy.data.sheet : {};
    const hasBasicText = [
      enemy.name,
      enemy.memo,
      enemy.icon_url,
      sheet.name,
      sheet.memo,
      getByPath(sheet, "meta.imageUrl"),
    ].some((value) => String(value || "").trim());
    if (hasBasicText) return false;

    const skills = Array.isArray(enemy.data?.skills) ? enemy.data.skills : [];
    const attacks = Array.isArray(enemy.data?.attackMethods) ? enemy.data.attackMethods : [];
    const drops = Array.isArray(enemy.data?.dropItems) ? enemy.data.dropItems : [];
    const exDrops = Array.isArray(enemy.data?.exDropItems) ? enemy.data.exDropItems : [];
    const resources = Array.isArray(enemy.data?.resources) ? enemy.data.resources : [];
    const hasFilledRow = [...skills, ...attacks, ...drops, ...exDrops, ...resources].some((row) => {
      if (!row || typeof row !== "object") return false;
      return Object.entries(row).some(([key, value]) => {
        if (["id", "uid", "_id", "secret"].includes(String(key))) return false;
        return String(value || "").trim();
      });
    });
    return !hasFilledRow;
  }

  function saveDraftSnapshotFromCurrent() {
    try {
      const current = getSelectedEnemy();
      if (!current) return;
      readFormToCurrentEnemy();
      if (isBlankNewEnemyDraft(current)) {
        clearDraftSnapshot();
        return;
      }
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

      if (isBlankNewEnemyDraft(parsed.enemy)) {
        clearDraftSnapshot();
        return;
      }

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
      data: {
        sheet: { enemyType: "general", attribute: "-/-", isPublic: true, showDropItemsInView: true, author: getRememberedAuthor() },
        exDropItems: [createEmptyExDropItem()],
        dropItems: createDefaultDropItems(),
        resources: [],
      },
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
    if (el.fieldShowDropsInView) {
      setByPath(sheet, "showDropItemsInView", !!el.fieldShowDropsInView.checked);
    }
    if (el.komaExportModeSelect) {
      const viewStage = normalizeViewStage(el.komaExportModeSelect.value || state.viewStage);
      state.viewStage = viewStage;
      setByPath(sheet, "viewStage", viewStage);
    } else {
      setByPath(sheet, "viewStage", normalizeViewStage(state.viewStage));
    }

    current.author = String(sheet.author || "").trim() || getRememberedAuthor();
    current.name = String(sheet.name || "").trim();
    current.class_type = String(sheet.enemyType || "general").trim() || "general";
    current.is_public = !!sheet.isPublic;
    current.memo = stripLegacyDefenseLineFromMemo(sheet.memo, sheet);
    current.icon_url = String(getByPath(sheet, "meta.imageUrl") || "").trim();
    current.data = {
      sheet: {
        ...sheet,
        memo: current.memo,
      },
      skills: deepClone(state.skills),
      exDropItems: deepClone(state.exDropItems),
      dropItems: deepClone(state.dropItems),
      attackMethods: deepClone(state.attackMethods),
      resources: deepClone(state.resources),
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
      if (key === "showDropItemsInView" && (value == null || value === "")) value = true;

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
    if (el.fieldShowDropsInView) {
      const rawShowDrops = getByPath(sheet, "showDropItemsInView");
      el.fieldShowDropsInView.checked = rawShowDrops == null || rawShowDrops === "" ? true : !!rawShowDrops;
    }
    setSaveButtonLabelByEnemy(enemy);
    const savedViewStage = normalizeViewStage(getByPath(sheet, "viewStage"));
    state.viewStage = savedViewStage;
    if (el.komaExportModeSelect) {
      el.komaExportModeSelect.value = savedViewStage;
    }
    state.skills = Array.isArray(enemy?.data?.skills) ? deepClone(enemy.data.skills) : [createEmptySkill()];
    state.exDropItems = Array.isArray(enemy?.data?.exDropItems)
      ? deepClone(enemy.data.exDropItems)
      : [];
    state.dropItems = Array.isArray(enemy?.data?.dropItems) ? deepClone(enemy.data.dropItems) : createDefaultDropItems();
    state.attackMethods = Array.isArray(enemy?.data?.attackMethods)
      ? deepClone(enemy.data.attackMethods)
      : [createEmptyAttackMethod()];
    state.resources = Array.isArray(enemy?.data?.resources) ? deepClone(enemy.data.resources) : [];

    syncAttributeSelectsFromInput();
    updateEnemyTypeView();
    updateAbilityDerived();
    renderSkills();
    renderExDropItems();
    renderDropItems();
    renderAttackMethods();
    renderResources();
    renderEnemyView();
    state.dirty = false;
    setStatus("保存済み");
    if (keepDraftSnapshotOnNextFill) {
      keepDraftSnapshotOnNextFill = false;
    } else {
      clearDraftSnapshot();
    }
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

  function stripLegacyDefenseLineFromMemo(memo, sheet = {}) {
    const text = String(memo || "");
    const physDef = String(getByPath(sheet, "physDef") || "").trim();
    const magicDef = String(getByPath(sheet, "magicDef") || "").trim();
    return text.replace(/^\s*(\d+)\s*\/\s*(\d+)\s*(?:\r?\n|$)/, (match, phys, magic) => {
      if (physDef && magicDef && (String(phys) !== physDef || String(magic) !== magicDef)) {
        return match;
      }
      return "";
    }).trimStart();
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

      const canView = state.adminMode ||
        (typeof shared.canViewEnemyByVisibility === "function"
          ? shared.canViewEnemyByVisibility({
              isPublic: !!e.is_public,
              enemyAuthor: e.author,
              myAuthor,
            })
          : !!e.is_public ||
            (myAuthor && String(e.author || "") === String(myAuthor)));
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
                ${author ? `<span>${getCreditLabel(author)}：${escapeHtml(author)}</span>` : ""}
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
                <button type="button" class="list-side-btn is-view" data-id="${escapeHtml(idText)}" title="閲覧">
                  <i class="fa-solid fa-eye"></i><br>閲覧
                </button>
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

      li.querySelector(".list-side-btn.is-view")?.addEventListener("click", () => {
        openEnemyViewInNewTab(enemy.ID);
      });

      li.querySelector(".list-side-btn.is-output")?.addEventListener("click", async () => {
        try {
          if (!confirmLoadEnemyOrCreateNew(enemy)) return;
          state.selectedId = enemy.ID;
          fillFormFromEnemy(enemy);
          await exportKomaJsonByCurrentMode();
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


  function getEnemyAuthorForCompare(enemy) {
    if (!enemy || typeof enemy !== "object") return "";
    const sheet = enemy.data && enemy.data.sheet && typeof enemy.data.sheet === "object" ? enemy.data.sheet : {};
    return String(enemy.author || sheet.author || "").trim();
  }

  function getEnemyAuthor(enemy) {
    return getEnemyAuthorForCompare(enemy);
  }

  async function fetchEnemyRowsForList(params) {
    const response = await fetchApiJson(buildApiUrl("listAR2EEnemies", params));
    return Array.isArray(response.data) ? response.data : [];
  }


  function extractEnemyFromApiResponse(data, targetId = "") {
    const id = String(targetId || "").trim();
    if (!data) return null;
    const rows = Array.isArray(data)
      ? data
      : Array.isArray(data.data)
        ? data.data
        : data.data && typeof data.data === "object"
          ? [data.data]
          : typeof data === "object"
            ? [data]
            : [];
    if (!rows.length) return null;
    if (!id) return rows[0];
    return rows.find((row) => String(row && row.ID || "") === id) || rows[0] || null;
  }

  async function fetchSharedEnemyById(sharedId) {
    const id = String(sharedId || "").trim();
    if (!id) return null;

    // GAS/Spreadsheet は応答が遅くなりやすい。共有URLでは直列リトライを避け、
    // 対応している可能性が高い個別取得系を並列で投げ、最初に一致したものを使う。
    const variants = [
      { action: "getAR2EEnemy", params: { id } },
      { action: "loadAR2EEnemy", params: { id } },
      { action: "readAR2EEnemy", params: { id } },
      { action: "listAR2EEnemies", params: { id, enemyId: id, sharedId: id } },
    ];

    const tasks = variants.map((variant) =>
      fetchApiJson(buildApiUrl(variant.action, variant.params))
        .then((response) => {
          const found = extractEnemyFromApiResponse(response, id);
          return found && String(found.ID || "") === id ? found : null;
        })
        .catch((error) => {
          console.warn("[AR2E] 共有URLの個別読込失敗:", variant.action, error);
          return null;
        })
    );

    return new Promise((resolve) => {
      let pending = tasks.length;
      tasks.forEach((task) => {
        task.then((found) => {
          if (found) {
            resolve(found);
            return;
          }
          pending -= 1;
          if (pending <= 0) resolve(null);
        });
      });
    });
  }

  async function waitForSharedEnemyCandidate(sharedId, sharedEnemyPromise, rowsPromise) {
    const id = String(sharedId || "").trim();
    if (!id) return null;

    const candidates = [
      sharedEnemyPromise.then((row) => row || null).catch(() => null),
      rowsPromise
        .then((rows) => {
          const found = Array.isArray(rows)
            ? rows.find((row) => String(row && row.ID || "") === id)
            : null;
          return found || null;
        })
        .catch(() => null),
    ];

    return new Promise((resolve) => {
      let pending = candidates.length;
      candidates.forEach((candidate) => {
        candidate.then((found) => {
          if (found) {
            resolve(found);
            return;
          }
          pending -= 1;
          if (pending <= 0) resolve(null);
        });
      });
    });
  }

  async function loadEnemyRowsFromDb() {
    const author = getRememberedAuthor();
    if (!state.adminMode) {
      return fetchEnemyRowsForList({ author });
    }

    // 管理者モードではバックエンド側の実装差を吸収するため、
    // 既存パラメータを優先しつつ、全作者取得用の別名パラメータも段階的に試す。
    const paramVariants = [
      { admin: "9800", includePrivate: "1", allAuthors: "1" },
      { admin: "9800", adminCode: "9800", includePrivate: "1", allAuthors: "1", includeAllAuthors: "1", mode: "admin" },
      { admin: "9800", includePrivate: "1", allAuthors: "1", author: "*" },
    ];

    let bestRows = [];
    for (const params of paramVariants) {
      try {
        const rows = await fetchEnemyRowsForList(params);
        if (rows.length > bestRows.length) bestRows = rows;
        const hasOtherAuthor = rows.some((row) => {
          const rowAuthor = getEnemyAuthorForCompare(row);
          return rowAuthor && author && rowAuthor !== author;
        });
        if (hasOtherAuthor) return rows;
      } catch (error) {
        console.warn("[AR2E] 管理者モード一覧取得リトライ失敗:", error);
      }
    }
    return bestRows;
  }

  async function loadFromDb(options = {}) {
    const { preserveCurrentUnsaved = false, preserveDraftSnapshot = false } = options || {};
    const currentBeforeLoad = getSelectedEnemy();
    const shouldPreserveCurrent = preserveCurrentUnsaved && currentBeforeLoad && isUnsavedEnemy(currentBeforeLoad);
    const wasDirty = !!state.dirty;
    const sharedId = getSharedEnemyIdFromUrl();
    let sharedEnemy = null;

    let rowsPromise = null;
    let rawSharedEnemyPromise = null;

    if (shouldPreserveCurrent) {
      readFormToCurrentEnemy();
      rowsPromise = loadEnemyRowsFromDb();
    } else if (sharedId) {
      setStatus("共有URLから読込中...");
      // 共有URLでは、個別取得と一覧取得を並列化する。
      // 個別取得APIが未対応でも、一覧取得側で対象IDが見つかり次第フォームへ反映する。
      rawSharedEnemyPromise = fetchSharedEnemyById(sharedId);
      rowsPromise = loadEnemyRowsFromDb();
      const rawSharedEnemy = await waitForSharedEnemyCandidate(sharedId, rawSharedEnemyPromise, rowsPromise);
      if (rawSharedEnemy) {
        sharedEnemy = fromApiEnemy(rawSharedEnemy);
        state.enemies = [sharedEnemy];
        state.selectedId = sharedEnemy.ID;
        if (preserveDraftSnapshot) keepDraftSnapshotOnNextFill = true;
        fillFormFromEnemy(sharedEnemy);
        renderEnemyList();
        setStatus("共有URLから読込", "ok");
      }
    } else {
      rowsPromise = loadEnemyRowsFromDb();
    }

    const rows = await rowsPromise;
    state.enemies = rows.map(fromApiEnemy);

    if (sharedEnemy && !state.enemies.some((e) => String(e.ID || "") === String(sharedEnemy.ID || ""))) {
      state.enemies.unshift(sharedEnemy);
    }

    if (shouldPreserveCurrent) {
      const preserved = deepClone(currentBeforeLoad);
      const preservedId = String(preserved.ID || `new_${Date.now()}`);
      preserved.ID = preservedId;
      state.enemies = state.enemies.filter((e) => String(e.ID || "") !== preservedId);
      state.enemies.unshift(preserved);
      localUnsavedEnemyIds.add(preservedId);
      state.selectedId = preservedId;
    } else if (!state.enemies.length) {
      const fresh = createEnemyTemplate({ auto: true });
      state.enemies = [fresh];
      localUnsavedEnemyIds.add(String(fresh.ID));
    }

    if (!shouldPreserveCurrent && sharedId && state.enemies.some((e) => String(e.ID) === sharedId)) {
      state.selectedId = sharedId;
    } else if (!shouldPreserveCurrent) {
      const lastId = getLastSelectedId();
      state.selectedId = state.enemies.some((e) => String(e.ID) === lastId)
        ? lastId
        : state.enemies[0].ID;
    }

    const selected = getSelectedEnemy();
    if (preserveDraftSnapshot) keepDraftSnapshotOnNextFill = true;
    fillFormFromEnemy(selected);
    if (shouldPreserveCurrent) {
      state.dirty = wasDirty;
      setStatus(wasDirty ? "未保存（一覧更新済み）" : "新規白紙（一覧更新済み）");
      if (wasDirty) saveDraftSnapshotFromCurrent();
    }
    renderEnemyList();
    if (!shouldPreserveCurrent && sharedId && String(state.selectedId) === sharedId) {
      setStatus("共有URLから読込", "ok");
      return;
    }
    if (!shouldPreserveCurrent) {
      setStatus(isUnsavedEnemy(selected) ? "未保存" : "保存済み");
    }
  }

  async function shareCurrentEnemy() {
    const current = getSelectedEnemy();
    if (!current) return;
    readFormToCurrentEnemy();
    if (isUnsavedEnemy(current) || state.dirty) {
      setStatus("共有URL作成中...", "info");
      await saveCurrentToDb();
    }
    const saved = getSelectedEnemy();
    const shareUrl = buildEnemyShareUrl(saved && saved.ID);
    if (!shareUrl) throw new Error("共有URLを生成できませんでした");
    await copyTextToClipboard(shareUrl);
    setStatus("共有URLをコピーしました", "ok");
    showToast("共有URLをコピーしました", "info");
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
    fresh._pristineNew = true;
    state.enemies.unshift(fresh);
    localUnsavedEnemyIds.add(String(fresh.ID));
    state.selectedId = fresh.ID;
    fillFormFromEnemy(fresh);
    state.dirty = false;
    clearDraftSnapshot();
    renderEnemyList();
    setStatus("新規白紙");
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


  function createEmptyExDropItem() {
    return {
      id: `exdrop_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: "",
      unitPrice: "",
      quantity: "1",
      memo: ""
    };
  }

  function createEmptyResource() {
    return {
      id: `res_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: "",
      current: "",
      max: "",
      memo: ""
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

  function createDefaultDropItems() {
    return [createEmptyDropItem(), createEmptyDropItem()];
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
        <td class="row-drag-cell" data-label=""><span class="drag-hint" draggable="true" aria-hidden="true" title="この行をドラッグで並べ替え">⠿</span></td>
        <td class="secret-cell" data-label="秘">
          <input type="checkbox" data-key="isSecret" ${skill.isSecret ? "checked" : ""}>
        </td>
        <td class="cell-name" data-label="名前"><input type="text" data-key="name" value="${escapeHtml(skill.name)}" placeholder="名称" list="ar2eSkillNameList"></td>
        <td class="cell-sl" data-label="SL"><input type="number" data-key="sl" value="${escapeHtml(skill.sl)}" placeholder="1" ${skill.slMax ? `max="${escapeHtml(skill.slMax)}"` : ""}></td>
        <td class="cell-timing" data-label="タイミング"><input type="text" data-key="timing" value="${escapeHtml(skill.timing)}" placeholder="メジャー等" list="ar2eTimingList"></td>
        <td class="cell-judge" data-label="判定"><input type="text" data-key="judge" value="${escapeHtml(skill.judge)}" placeholder="自動成功"></td>
        <td class="cell-target" data-label="対象"><input type="text" data-key="target" value="${escapeHtml(skill.target)}" list="ar2eTargetList" placeholder="単体"></td>
        <td class="cell-range" data-label="射程"><input type="text" data-key="range" value="${escapeHtml(skill.range)}" list="ar2eRangeList" placeholder="至近"></td>
        <td class="cell-cost" data-label="コスト"><input type="number" data-key="cost" value="${escapeHtml(skill.cost)}" placeholder="3"></td>
        <td class="cell-hit" data-label="命中">
          <input type="hidden" data-key="hitDice" value="${escapeHtml(skill.hitDice || "2D+0")}">
          <span class="dice-mini-editor in-table" aria-label="命中ダイス式">
            <input type="number" data-dice-key="hitDice" data-dice-part="count" min="0" step="1" value="${hit.count}" class="dice-count-input">
            <span class="dice-mark numeric-font">D</span>
            <span class="dice-plus-mark numeric-font">+</span>
            <input type="number" data-dice-key="hitDice" data-dice-part="plus" min="0" step="1" value="${hit.plus}" placeholder="0" class="dice-plus-input">
          </span>
        </td>
        <td class="cell-damage" data-label="ダメージ">
          <input type="hidden" data-key="damageDice" value="${escapeHtml(skill.damageDice || "2D+0")}">
          <span class="dice-mini-editor in-table" aria-label="ダメージダイス式">
            <input type="number" data-dice-key="damageDice" data-dice-part="count" min="0" step="1" value="${dmg.count}" class="dice-count-input">
            <span class="dice-mark numeric-font">D</span>
            <span class="dice-plus-mark numeric-font">+</span>
            <input type="number" data-dice-key="damageDice" data-dice-part="plus" min="0" step="1" value="${dmg.plus}" placeholder="0" class="dice-plus-input">
          </span>
        </td>
        <td class="cell-attribute" data-label="属性"><input type="text" data-key="attribute" value="${escapeHtml(skill.attribute)}" list="ar2eAttributeList" placeholder="白兵(物理)" ${skillAttrTheme ? `data-skill-attr-theme="${skillAttrTheme}"` : ""}></td>
        <td class="cell-effect" data-label="効果">${isEffectMultiline
          ? `<textarea data-key="effect" placeholder="効果" rows="2">${escapeHtml(skill.effect)}</textarea>`
          : `<input type="text" data-key="effect" value="${escapeHtml(skill.effect)}" placeholder="効果">`
        }</td>
        <td class="row-actions-cell" data-label="">
          <div class="row-action-wrap">
            <span class="row-action-left" aria-hidden="false">
              <span class="drag-hint row-action-drag" draggable="true" aria-hidden="true" title="この行をドラッグで並べ替え">⠿</span>
              <label class="row-action-secret" title="非公開スキル">
                <span class="row-action-secret-label">秘</span>
                <input type="checkbox" data-card-secret="1" ${skill.isSecret ? "checked" : ""} aria-label="非公開スキル">
              </label>
            </span>
            <span class="row-action-buttons">
              <button type="button" class="copy-row-btn" data-copy-kind="skill-line" data-index="${index}" title="このスキルのチャットパレットをコピー" aria-label="このスキルのチャットパレットをコピー"><i class="fa-solid fa-clipboard"></i></button>
              <button type="button" class="clone-row-btn" data-clone-kind="skills" data-index="${index}" title="このスキル行を複製" aria-label="このスキル行を複製"><i class="fa-solid fa-copy"></i></button>
              <button type="button" class="delete-btn" data-remove-kind="skills" data-index="${index}" title="削除" aria-label="削除"><i class="fa-solid fa-trash"></i></button>
            </span>
          </div>
        </td>
      `;
      el.skillsBody.appendChild(tr);

      // isSecretの反映のみ
      const secretInput = tr.querySelector('input[data-key="isSecret"]');
      const cardSecretInput = tr.querySelector('input[data-card-secret]');
      [secretInput, cardSecretInput].filter(Boolean).forEach((node) => {
        node.classList.add("skill-secret-toggle");
        const isSecret = !!(skill && skill.isSecret);
        node.checked = isSecret;
        node.classList.toggle("is-secret-on", isSecret);
        node.setAttribute("aria-checked", isSecret ? "true" : "false");
        tr.classList.toggle("is-secret-row", isSecret);
      });
    });

    applyNumericFontClasses();
    renderSkillSummaryList();
    updateChatPalettePreview();
  }

  function renderSkillSummaryList() {
    if (!el.skillSummaryList) return;
    el.skillSummaryList.innerHTML = "";
    const visibleSkills = state.skills.filter((skill) => skill && !skill.isSecret && String(skill.name || "").trim());
    if (!visibleSkills.length) {
      const empty = document.createElement("div");
      empty.className = "skill-summary-empty";
      empty.textContent = "公開表示できるスキルがありません。";
      el.skillSummaryList.appendChild(empty);
      return;
    }
    visibleSkills.forEach((skill) => {
      const item = document.createElement("article");
      item.className = "skill-summary-card";
      const title = buildSkillHeadlineForKoma(skill) || String(skill.name || "").trim();
      const metaParts = [];
      if (skill.timing) metaParts.push(skill.timing);
      if (skill.judge) metaParts.push(`判定:${skill.judge}`);
      if (skill.target) metaParts.push(`対象:${skill.target}`);
      if (skill.range) metaParts.push(`射程:${skill.range}`);
      if (skill.cost) metaParts.push(`コスト:${skill.cost}`);
      if (skill.attribute) metaParts.push(`属性:${skill.attribute}`);
      const effect = String(skill.effect || "").trim();
      item.innerHTML = `
        <div class="skill-summary-title">${escapeHtml(title)}</div>
        ${metaParts.length ? `<div class="skill-summary-meta">${escapeHtml(metaParts.join(" / "))}</div>` : ""}
        ${effect ? `<div class="skill-summary-effect">${escapeHtml(effect)}</div>` : ""}
      `;
      el.skillSummaryList.appendChild(item);
    });
  }

  function renderExDropItems() {
    // EXドロップは通常ドロップ表の先頭に統合表示する。
    // 旧HTML互換のため関数は残すが、描画本体は renderDropItems() に集約する。
    applyNumericFontClasses();
  }

  function renderDropItems() {
    if (!el.dropItemsBody) return;
    el.dropItemsBody.innerHTML = "";

    if (!Array.isArray(state.exDropItems)) state.exDropItems = [];
    if (state.exDropItems.length > 1) state.exDropItems = state.exDropItems.slice(0, 1);
    if (el.addExDropItemBtn) {
      const hasExDrop = state.exDropItems.length >= 1;
      el.addExDropItemBtn.disabled = hasExDrop;
      el.addExDropItemBtn.title = hasExDrop ? "EXドロップは1枠のみです" : "EXドロップを追加";
      el.addExDropItemBtn.classList.toggle("is-disabled", hasExDrop);
    }

    state.exDropItems.forEach((item, index) => {
      const tr = document.createElement("tr");
      tr.className = "drop-row-ex";
      tr.setAttribute("data-drop-kind", "ex");
      tr.setAttribute("data-ex-drop-index", index);
      const qty = Number(item.quantity);
      const unit = Number(String(item.unitPrice || "").replace(/[^0-9.-]/g, ""));
      const lineTotal = Number.isFinite(qty) && Number.isFinite(unit) ? qty * unit : "";
      tr.innerHTML = `
        <td class="row-drag-cell" data-label=""><span class="drag-hint" draggable="true" aria-hidden="true" title="このEXドロップ行をドラッグで並べ替え">⠿</span></td>
        <td colspan="2" class="drop-ex-label-cell cell-drop-min" data-label="出目"><span class="drop-ex-label">EXドロップ</span></td>
        <td class="cell-drop-name" data-label="名前"><input type="text" data-ex-drop-key="name" value="${escapeHtml(item.name || "")}" placeholder="アイテム名"></td>
        <td class="cell-drop-price" data-label="単価"><input type="text" data-ex-drop-key="unitPrice" value="${escapeHtml(item.unitPrice || "")}" placeholder="100G" class="numeric-font"></td>
        <td class="cell-drop-qty" data-label="個数"><input type="number" data-ex-drop-key="quantity" value="${escapeHtml(item.quantity || "1")}" min="1" step="1" class="num-2"></td>
        <td class="cell-drop-total" data-label="総計"><input type="text" value="${escapeHtml(lineTotal === "" ? "" : String(lineTotal))}" readonly tabindex="-1" aria-label="行総計" class="num-2 numeric-font"></td>
        <td class="row-actions-cell">
          <div class="row-action-wrap">
            <button type="button" class="delete-btn" data-ex-drop-delete="1" title="EXドロップを削除" aria-label="EXドロップを削除"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      el.dropItemsBody.appendChild(tr);
    });

    state.dropItems.forEach((item, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-drop-kind", "normal");
      tr.setAttribute("data-drop-index", index);
      const qty = Number(item.quantity);
      const unit = Number(String(item.unitPrice || "").replace(/[^0-9.-]/g, ""));
      const lineTotal = Number.isFinite(qty) && Number.isFinite(unit) ? qty * unit : "";
      tr.innerHTML = `
        <td class="row-drag-cell" data-label=""><span class="drag-hint" draggable="true" aria-hidden="true" title="このドロップ行をドラッグで並べ替え">⠿</span></td>
        <td class="cell-drop-min" data-label="出目小"><input type="number" data-drop-key="min" value="${escapeHtml(item.min)}" placeholder="1"></td>
        <td class="cell-drop-max" data-label="出目大"><input type="number" data-drop-key="max" value="${escapeHtml(item.max)}" placeholder="5"></td>
        <td class="cell-drop-name" data-label="名前"><input type="text" data-drop-key="name" value="${escapeHtml(item.name)}" placeholder="アイテム名"></td>
        <td class="cell-drop-price" data-label="単価"><input type="text" data-drop-key="unitPrice" value="${escapeHtml(item.unitPrice)}" placeholder="100G"></td>
        <td class="cell-drop-qty" data-label="個数"><input type="number" data-drop-key="quantity" value="${escapeHtml(item.quantity || "1")}" min="1" step="1" class="num-2"></td>
        <td class="cell-drop-total" data-label="総計"><input type="text" value="${escapeHtml(lineTotal === "" ? "" : String(lineTotal))}" readonly tabindex="-1" aria-label="行総計" class="num-2 numeric-font"></td>
        <td class="row-actions-cell">
          <div class="row-action-wrap">
            <button type="button" class="delete-btn" data-remove-kind="dropItems" data-drop-delete="1" title="ドロップ品を削除" aria-label="ドロップ品を削除"><i class="fa-solid fa-trash"></i></button>
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
        <td class="row-drag-cell" data-label=""><span class="drag-hint" draggable="true" aria-hidden="true" title="この行をドラッグで並べ替え">⠿</span></td>
        <td class="cell-name" data-label="名前"><input type="text" data-atk-key="name" value="${escapeHtml(atk.name)}" placeholder="攻撃名"></td>
        <td class="cell-kind" data-label="種別"><input type="text" data-atk-key="weaponKind" value="${escapeHtml(atk.weaponKind || "")}" list="ar2eWeaponKindList" placeholder="格闘" class="atk-kind-input"></td>
        <td class="cell-part" data-label="部位"><input type="text" data-atk-key="weaponPart" value="${escapeHtml(atk.weaponPart || "")}" list="ar2eWeaponPartList" placeholder="片" class="atk-part-input"></td>
        <td class="cell-target" data-label="対象"><input type="text" data-atk-key="target" value="${escapeHtml(atk.target)}" list="ar2eTargetList" placeholder="単体"></td>
        <td class="cell-range" data-label="射程"><input type="text" data-atk-key="range" value="${escapeHtml(atk.range)}" list="ar2eRangeList" placeholder="至近"></td>
        <td class="cell-hit" data-label="命中">
          <span class="dice-mini-editor in-table" aria-label="攻撃命中式">
            <input type="number" data-atk-dice-key="hitDice" data-atk-dice-part="count" min="0" step="1" value="${hit.count}" class="numeric-font dice-count-input">
            <span class="dice-mark numeric-font">D</span>
            <span class="dice-plus-mark numeric-font">+</span>
            <input type="number" data-atk-dice-key="hitDice" data-atk-dice-part="plus" min="0" step="1" value="${hit.plus}" placeholder="0" class="numeric-font dice-plus-input">
          </span>
        </td>
        <td class="cell-damage" data-label="ダメージ">
          <span class="dice-mini-editor in-table" aria-label="攻撃ダメージ式">
            <input type="number" data-atk-dice-key="damageDice" data-atk-dice-part="count" min="0" step="1" value="${dmg.count}" class="numeric-font dice-count-input">
            <span class="dice-mark numeric-font">D</span>
            <span class="dice-plus-mark numeric-font">+</span>
            <input type="number" data-atk-dice-key="damageDice" data-atk-dice-part="plus" min="0" step="1" value="${dmg.plus}" placeholder="0" class="numeric-font dice-plus-input">
          </span>
        </td>
        <td class="cell-attribute" data-label="属性"><input type="text" data-atk-key="attribute" value="${escapeHtml(atk.attribute)}" list="ar2eAttributeList" placeholder="属性" ${atkAttrTheme ? `data-atk-attr-theme="${atkAttrTheme}"` : ""}></td>
        <td class="cell-effect" data-label="効果">${isEffectMultiline
          ? `<textarea data-atk-key="effect" placeholder="効果" rows="2">${escapeHtml(atk.effect)}</textarea>`
          : `<input type="text" data-atk-key="effect" value="${escapeHtml(atk.effect)}" placeholder="効果">`
        }</td>
        <td class="row-actions-cell" data-label="">
          <div class="row-action-wrap">
            <span class="row-action-left" aria-hidden="false">
              <span class="drag-hint row-action-drag" draggable="true" aria-hidden="true" title="この行をドラッグで並べ替え">⠿</span>
            </span>
            <span class="row-action-buttons">
              <button type="button" class="copy-row-btn" data-copy-kind="attack-line" data-atk-copy="1" title="この攻撃方法のチャットパレットをコピー" aria-label="この攻撃方法のチャットパレットをコピー"><i class="fa-solid fa-clipboard"></i></button>
              <button type="button" class="clone-row-btn" data-clone-kind="attackMethods" data-atk-clone="1" title="この攻撃方法行を複製" aria-label="この攻撃方法行を複製"><i class="fa-solid fa-copy"></i></button>
              <button type="button" class="delete-btn" data-remove-kind="attackMethods" data-atk-delete="1" title="削除" aria-label="削除"><i class="fa-solid fa-trash"></i></button>
            </span>
          </div>
        </td>
      `;
      el.attackMethodsBody.appendChild(tr);
    });

    applyNumericFontClasses();
    updateChatPalettePreview();
  }

  function renderResources() {
    if (!el.resourcesBody) return;
    el.resourcesBody.innerHTML = "";
    state.resources.forEach((res, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-resource-index", index);
      tr.innerHTML = `
        <td class="cell-resource-name" data-label="名前"><input type="text" data-resource-key="name" value="${escapeHtml(res.name || "")}" placeholder="フェイト / ヘイト等"></td>
        <td class="cell-resource-current" data-label="現在"><input type="number" data-resource-key="current" value="${escapeHtml(res.current || "")}" placeholder="0" class="num-2"></td>
        <td class="cell-resource-max" data-label="最大"><input type="number" data-resource-key="max" value="${escapeHtml(res.max || "")}" placeholder="0" class="num-2"></td>
        <td class="cell-resource-memo" data-label="メモ"><input type="text" data-resource-key="memo" value="${escapeHtml(res.memo || "")}" placeholder="ここでのメモはコマには反映されない"></td>
        <td class="row-actions-cell" data-label=""><div class="row-action-wrap"><button type="button" class="delete-btn" data-resource-delete="1" title="削除" aria-label="削除"><i class="fa-solid fa-trash"></i></button></div></td>
      `;
      el.resourcesBody.appendChild(tr);
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
    const target = String(atk.target || "").trim() || "-";
    const range = String(atk.range || "").trim() || "-";
    return `${name}${kindPart ? ` ${kindPart}` : ""} 命中:${hit} ダメージ:${dmg} 属性:${attr} 対象:${target} 射程:${range}`.trim();
  }

  function formatAttackChantDiceText(raw) {
    const text = String(raw || "").trim();
    const m = text.match(/^(\d+)\s*[dD](?:\s*\+\s*(-?\d+))?$/);
    if (!m) return formatDiceText(text);
    const dice = `${m[1]}D`;
    const plus = String(m[2] == null ? "0" : m[2]).trim();
    if (!plus || plus === "0") return dice;
    return `${plus}(${dice})`;
  }

  function normalizeChantDescription(raw) {
    return String(raw || "")
      .replace(/\r?\n+/g, " ")
      .replace(/[ \t　]+/g, " ")
      .trim();
  }

  function appendChantDescription(line, rawEffect) {
    const effect = normalizeChantDescription(rawEffect);
    if (!line || !effect) return line;
    return `${line}\\n${effect}`;
  }

  function buildAttackChantLineForKoma(atk) {
    if (!atk) return "";
    const name = String(atk.name || "").trim();
    if (!name) return "";
    const kind = String(atk.weaponKind || "").trim();
    const part = String(atk.weaponPart || "").trim();
    const kindPart = kind || part ? `(${kind || "-"}/${part || "-"})` : "";
    const hit = formatAttackChantDiceText(String(atk.hitDice || "").trim() || "2D+0");
    const dmg = formatAttackChantDiceText(String(atk.damageDice || "").trim() || "2D+0");
    const attr = String(atk.attribute || "").trim() || "-";
    const target = String(atk.target || "").trim() || "-";
    const range = String(atk.range || "").trim() || "-";
    const line = `${name}${kindPart ? kindPart : ""} ${hit} /${dmg}/${attr}/${target}/${range}`.trim();
    return appendChantDescription(line, atk.effect);
  }

  function buildSkillChantLineForKoma(skill) {
    if (!skill) return "";
    const skillHead = buildSkillHeadlineForKoma(skill);
    if (!skillHead) return "";
    const hitDice = String(skill.hitDice || "").trim();
    const damageDice = String(skill.damageDice || "").trim();
    if (!shouldEmitSkillDiceCommand(skill, hitDice) && !shouldEmitSkillDiceCommand(skill, damageDice)) return "";
    const hit = hitDice ? formatDiceText(hitDice) : "-";
    const dmg = damageDice ? formatDiceText(damageDice) : "-";
    const attr = String(skill.attribute || "").trim() || "-";
    const target = String(skill.target || "").trim() || "-";
    const range = String(skill.range || "").trim() || "-";
    const line = `${skillHead} ${hit}/${dmg}/${attr}/${target}/${range}`.trim();
    return appendChantDescription(line, skill.effect);
  }

  function buildChantLinesForKoma() {
    const lines = [];
    state.attackMethods.forEach((atk) => {
      const line = buildAttackChantLineForKoma(atk);
      if (line) lines.push(line);
    });
    state.skills.forEach((skill) => {
      const line = buildSkillChantLineForKoma(skill);
      if (line) lines.push(line);
    });
    return lines;
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
    const judge = String(skill && skill.judge ? skill.judge : "").trim();
    const hasDiceJudge = /命中|魔術|呪歌|錬金術|射撃|白兵|筋力|器用|敏捷|知力|感知|精神|幸運/.test(judge);
    if (isDefaultSkillDiceForPassive(dice) && !hasDiceJudge) return false;
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

  function renderChatPreviewLineList(rawText) {
    if (!el.chatPreviewLines) return;
    el.chatPreviewLines.innerHTML = "";
    el.chatPreviewLines.hidden = true;
  }

  function setChatPreviewText(rawText) {
    if (!el.chatPreview) return;
    const text = String(rawText || "");
    el.chatPreview.value = text;
    renderChatPreviewLineList(text);
  }

  function getChatPaletteTextForView() {
    const previewText = el.chatPreview ? String(el.chatPreview.value || "").trim() : "";
    return previewText;
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

      const chantLines = buildChantLinesForKoma();
      if (chantLines.length) {
        lines.push("", ...chantLines);
      }

      lines.push("");

      state.skills.forEach((skill) => {
        const skillHead = buildSkillHeadlineForKoma(skill);
        if (!skillHead) return;
        const timing = String(skill.timing || "").trim();
        const effect = String(skill.effect || "").trim();
        lines.push(`${skillHead} (${timing || "パッシブ"}) ${effect}`.trim());
      });

      setChatPreviewText(lines.join("\n"));
      renderEnemyView();
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

    const chantLines = buildChantLinesForKoma();
    if (chantLines.length) {
      chatText += `${chantLines.join("\n")}\n\n`;
    }

    setChatPreviewText(chatText.trim());
    renderEnemyView();
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
      const chantLines = buildChantLinesForKoma();
      if (chantLines.length) lines.push("", ...chantLines);
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

    const chantLines = buildChantLinesForKoma();
    if (chantLines.length) lines.push("", ...chantLines);

    return lines.join("\n");
  }

  function buildKomaMemoByMode(mode) {
    if (mode === "pre_identify") {
      return "\n\n───\n---エネミー識別を使用してください---";
    }
    const lines = [];
    const classification = String(getFieldValue("classification") || "").trim();
    const attribute = String(getFieldValue("attribute") || "").trim();
    const initiative = String(getFieldValue("initiative") || "").trim();
    const movement = String(getFieldValue("movement") || "").trim();
    const identification = String(getFieldValue("identification") || "").trim();
    const physDef = String(getFieldValue("physDef") || "").trim();
    const magicDef = String(getFieldValue("magicDef") || "").trim();
    const profileParts = [];
    if (classification) profileParts.push(`分類:${classification}`);
    if (attribute) profileParts.push(`属性:${attribute}`);
    if (initiative) profileParts.push(`行動値:${initiative}`);
    if (movement) profileParts.push(`移動値:${movement}`);
    if (identification) profileParts.push(`識別値:${identification}`);
    if (mode === "defense_open") {
      if (physDef) profileParts.push(`物理防御:${physDef}`);
      if (magicDef) profileParts.push(`魔法防御:${magicDef}`);
    }
    if (profileParts.length) lines.push(`【基本情報】${profileParts.join(" / ")}`);

    const chantLines = buildChantLinesForKoma();
    if (chantLines.length) {
      lines.push("【詠唱】");
      chantLines.forEach((line) => lines.push(line));
    }

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
        if (hitDice) parts.push(`命中:${formatDiceText(hitDice)}`);
        if (damageDice) parts.push(`ダメージ:${formatDiceText(damageDice)}`);
        if (target) parts.push(`対象:${target}`);
        if (judge) parts.push(`判定:${judge}`);
        if (range) parts.push(`射程:${range}`);
      }
      const bracket = parts.length ? ` [${parts.join(" / ")}]` : "";
      lines.push(`${skillHead} (${timing || "パッシブ"}) ${effect}${bracket}`.trim());
    });

    state.attackMethods.forEach((atk) => {
      const atkLine = buildAttackLineForKoma(atk);
      if (atkLine) lines.push(atkLine);
    });
    const baseMemo = stripLegacyDefenseLineFromMemo(getFieldValue("memo"), {
      physDef,
      magicDef,
    }).trim();
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
    const current = getSelectedEnemy();
    const externalUrl = mode === "pre_identify" ? "" : buildEnemyShareUrl(current && current.ID);
    return {
      kind: "character",
      data: {
        name,
        memo: buildKomaMemoByMode(mode),
        initiative,
        ...(externalUrl ? { externalUrl } : {}),
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
    const current = getSelectedEnemy();
    if (mode !== "pre_identify" && current && (isUnsavedEnemy(current) || state.dirty)) {
      setStatus("共有URL付きコマ出力のため保存中...");
      await saveCurrentToDb();
    }
    const jsonObj = buildKomaCharacterJson(mode);
    const text = JSON.stringify(jsonObj);
    if (typeof shared.writeClipboardText === "function") {
      await shared.writeClipboardText(text);
      showKomaJsonCopySuccessToast();
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
    if (raw === "-/-") return { primary: "-", secondary: "-" };
    if (!raw || raw === "-") return { primary: "-", secondary: "" };
    const values = raw
      .split("/")
      .map((v) => v.trim())
      .filter(Boolean)
      .slice(0, 2);
    return {
      primary: values[0] || "-",
      secondary: values[1] || ""
    };
  }

  function normalizeAttributePart(value) {
    const text = String(value || "").trim();
    if (!text || text === "-") return "-";
    if (text === "特殊") {
      const special = el.attributeSpecialText ? String(el.attributeSpecialText.value || "").trim() : "";
      return special || "特殊";
    }
    return text;
  }

  function updateAttributeSpecialInputVisibility() {
    if (!el.attributeSpecialText || !el.attributePrimarySelect || !el.attributeSecondarySelect) return;
    const primaryIsSpecial = el.attributePrimarySelect.value === "特殊";
    const secondaryIsSpecial = false;
    if (el.attributeSecondarySelect.value === "特殊") el.attributeSecondarySelect.value = "";
    const usesSpecial = primaryIsSpecial;
    el.attributeSpecialText.hidden = !usesSpecial;
    el.attributeSelectGroup.classList.toggle("is-special-primary", primaryIsSpecial);
    el.attributeSelectGroup.classList.toggle("is-special-secondary", secondaryIsSpecial);
    if (!usesSpecial) el.attributeSpecialText.value = "";
  }

  function updateAttributeFromSelects() {
    if (!el.attributeInput || !el.attributePrimarySelect || !el.attributeSecondarySelect) return;
    const primary = String(el.attributePrimarySelect.value || "-").trim() || "-";
    let secondary = String(el.attributeSecondarySelect.value || "").trim();
    if (secondary === "特殊") {
      secondary = "";
      el.attributeSecondarySelect.value = "";
    }
    updateAttributeSpecialInputVisibility();

    if (primary === "-") {
      el.attributeSecondarySelect.value = secondary === "-" ? "-" : "";
      el.attributeSecondarySelect.hidden = true;
      if (el.attributeDivider) el.attributeDivider.hidden = true;
      el.attributeInput.value = secondary === "-" ? "-/-" : "-";
      updateAttributeTheme();
      return;
    }

    el.attributeSecondarySelect.hidden = primary === "特殊";
    if (el.attributeDivider) el.attributeDivider.hidden = primary === "特殊";

    const primaryValue = normalizeAttributePart(primary);
    const secondaryValue = normalizeAttributePart(secondary);
    if (secondary && secondary !== primary) {
      el.attributeInput.value = `${primaryValue}/${secondaryValue}`;
    } else {
      el.attributeInput.value = primaryValue;
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
    updateAttributeSpecialInputVisibility();
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
  // 閲覧モード
  // =======================================================

  const VIEW_MASK = ["▆", "▚", "█", "▙", "▄", "▜", "▃", "▟", "▇", "▂", "▞", "▛"];
  const ABILITY_LABELS = { str: "筋力", dex: "器用", agi: "敏捷", int: "知力", sen: "感知", mnd: "精神", luk: "幸運" };

  function maskText(size = 8) {
    const n = Math.max(2, Math.min(80, Number(size) || 8));
    let out = "";
    for (let i = 0; i < n; i += 1) out += VIEW_MASK[i % VIEW_MASK.length];
    return out;
  }

  function maskTextLike(value, fallbackSize = 6) {
    const text = viewValue(value, "");
    const normalized = String(text || "").replace(/\s+/g, "");
    const size = normalized
      ? Array.from(normalized).reduce((sum, ch) => sum + (/^[\x00-\x7F]$/.test(ch) ? 0.72 : 1.05), 0)
      : fallbackSize;
    return maskText(size);
  }

  function normalizeViewStage(value) {
    const stage = String(value || "").trim();
    if (["pre_identify", "post_identify", "defense_open", "gm"].includes(stage)) return stage;
    return "pre_identify";
  }

  function isViewStagePre() { return state.viewStage === "pre_identify"; }
  function isViewStagePost() { return state.viewStage === "post_identify"; }
  function isViewStageDefenseOpen() { return state.viewStage === "defense_open" || state.viewStage === "gm"; }
  function isViewStageGm() { return state.viewStage === "gm"; }

  function viewValue(value, fallback = "-") {
    const s = String(value == null ? "" : value).trim();
    return s || fallback;
  }

  function maybeMask(value, shouldMask, size = 6) {
    return shouldMask ? `<span class="view-mask">${maskTextLike(value, size)}</span>` : escapeHtml(viewValue(value));
  }

  function diceTextHtmlForView(value, extraClass = "") {
    const className = `view-dice-letter${extraClass ? ` ${extraClass}` : ""}`;
    return escapeHtml(viewValue(value)).replace(/D/g, `<span class="${className}">D</span>`);
  }

  function chip(label, cls = "") {
    const text = String(label == null ? "" : label).trim();
    if (!text || text === "-") return `<span class="view-chip is-muted">-</span>`;
    return `<span class="view-chip ${cls}">${escapeHtml(text)}</span>`;
  }

  function chipsFromText(raw, baseCls = "") {
    const text = String(raw || "").trim();
    if (!text || text === "-") return chip("-", baseCls);
    return text.split(/[\/\s・,，]+/).filter(Boolean).map((x) => chip(x, baseCls)).join("");
  }

  function attributeChipsForView(raw) {
    const text = String(raw || "-").trim();
    if (!text || text === "-") return chip("-", "is-muted");
    return text.split(/[\/\s・,，]+/).filter(Boolean).map((p) => {
      let cls = "is-muted";
      if (p.includes("火")) cls = "is-fire";
      else if (p.includes("水")) cls = "is-water";
      else if (p.includes("風")) cls = "is-wind";
      else if (p.includes("地")) cls = "is-earth";
      else if (p.includes("光")) cls = "is-light";
      else if (p.includes("闇")) cls = "is-dark";
      else if (p.includes("特殊")) cls = "is-special";
      else if (p.includes("物理") || p.includes("白兵") || p.includes("射撃")) cls = "is-phys";
      return chip(p, cls);
    }).join("");
  }

  function abilityFormulaForView(key, sheet) {
    const base = toInt(getByPath(sheet, key), 0);
    const dice = toInt(getByPath(sheet, `${key}Dice`), 2);
    const bonus = Math.floor(Math.max(0, base) / 3);
    return `${dice}D+${bonus}（基本値${base || 0}）`;
  }

  function abilityFormulaHtmlForView(key, sheet) {
    const base = toInt(getByPath(sheet, key), 0);
    const dice = toInt(getByPath(sheet, `${key}Dice`), 2);
    const bonus = Math.floor(Math.max(0, base) / 3);
    return `${diceTextHtmlForView(`${dice}D+${bonus}`, "is-ability-dice-letter")}<span class="view-ability-base">（<small>基本値</small>${escapeHtml(String(base || 0))}）</span>`;
  }

  function defenseCompareText(sheet) {
    const phys = toInt(getByPath(sheet, "physDef"), 0);
    const magic = toInt(getByPath(sheet, "magicDef"), 0);
    if (phys === magic) return "同じ";
    return phys > magic ? "物防が高い" : "魔防が高い";
  }

  function renderViewStageButtons() {
    document.querySelectorAll(".enemy-view-stage-btn[data-view-stage]").forEach((btn) => {
      btn.classList.toggle("is-active", String(btn.dataset.viewStage) === String(state.viewStage));
    });
  }

  function buildViewAttackCards() {
    const maskAll = isViewStagePre();
    const list = Array.isArray(state.attackMethods) ? state.attackMethods : [];
    if (!list.length) return `<div class="view-empty-card">攻撃方法なし</div>`;
    return list.map((atk) => {
      const name = String(atk.name || "").trim() || "攻撃";
      const kind = String(atk.weaponKind || "").trim();
      const part = String(atk.weaponPart || "").trim();
      const kindPart = kind || part ? `<span class="view-attack-sub">[${escapeHtml(kind || "-")}/${escapeHtml(part || "-")}]</span>` : "";
      const effect = String(atk.effect || "").trim();
      if (maskAll) {
        const hitText = formatDiceText(atk.hitDice || "2D+0");
        const dmgText = formatDiceText(atk.damageDice || "2D+0");
        const kindPartText = kind || part ? `[${kind || "-"}/${part || "-"}]` : "";
        const metaText = `${kindPartText}${hitText}${dmgText}${atk.attribute || "-"}${atk.target || "-"}${atk.range || "-"}`;
        return `<article class="view-attack-card is-masked">
          <div class="view-attack-main"><span class="view-attack-name"><span class="view-mask">${maskTextLike(name, 8)}</span></span><span class="view-mask">${maskTextLike(metaText, 16)}</span></div>
          ${effect ? `<p><span class="view-mask">${maskTextLike(effect, 18)}</span></p>` : ""}
        </article>`;
      }
      return `<article class="view-attack-card">
        <div class="view-attack-main">
          <span class="view-attack-name">${escapeHtml(name)} ${kindPart}</span>
          <span class="view-attack-field"><b>命中</b>${escapeHtml(formatDiceText(atk.hitDice || "2D+0"))}</span>
          <span class="view-attack-field"><b>ダメージ</b>${escapeHtml(formatDiceText(atk.damageDice || "2D+0"))}</span>
          <span class="view-attack-field"><b>属性</b>${attributeChipsForView(atk.attribute || "-")}</span>
          <span class="view-attack-field"><b>対象</b>${escapeHtml(viewValue(atk.target, "-"))}</span>
          <span class="view-attack-field"><b>射程</b>${escapeHtml(viewValue(atk.range, "-"))}</span>
        </div>
        ${effect ? `<p>${escapeHtml(effect)}</p>` : ""}
      </article>`;
    }).join("");
  }

  function buildViewSkillCards() {
    const maskAll = isViewStagePre();
    const list = Array.isArray(state.skills) ? state.skills : [];
    if (!list.length) return `<div class="view-empty-card">スキルなし</div>`;
    return list.map((skill) => {
      const secret = !!skill.isSecret;
      const masked = maskAll || (secret && !isViewStageGm());
      if (masked) {
        const skillHead = buildSkillHeadlineForKoma(skill) || skill.name || "スキル";
        const effect = String(skill.effect || "").trim();
        const meta = [skill.timing, skill.judge, skill.target, skill.range, skill.cost, skill.attribute].filter(Boolean).join(" ");
        return `<article class="view-skill-card is-masked">
          <div class="view-skill-main"><span class="view-skill-name">《${maskTextLike(skillHead, 8)}》</span><span class="view-mask">${maskTextLike(meta, 18)}</span></div>
          ${effect ? `<p><span class="view-mask">${maskTextLike(effect, 22)}</span></p>` : ""}
        </article>`;
      }
      const head = buildSkillHeadlineForKoma(skill) || escapeHtml(skill.name || "スキル");
      const hit = String(skill.hitDice || "").trim();
      const dmg = String(skill.damageDice || "").trim();
      const showHit = shouldEmitSkillDiceCommand(skill, hit);
      const showDmg = shouldEmitSkillDiceCommand(skill, dmg);
      return `<article class="view-skill-card">
        <div class="view-skill-main">
          <span class="view-skill-name">${escapeHtml(head)}</span>
          ${skill.timing ? `<span class="view-skill-field"><b>タイミング</b>${escapeHtml(skill.timing)}</span>` : ""}
          ${skill.judge ? `<span class="view-skill-field"><b>判定</b>${escapeHtml(skill.judge)}</span>` : ""}
          ${skill.target ? `<span class="view-skill-field"><b>対象</b>${escapeHtml(skill.target)}</span>` : ""}
          ${skill.range ? `<span class="view-skill-field"><b>射程</b>${escapeHtml(skill.range)}</span>` : ""}
          ${skill.cost ? `<span class="view-skill-field"><b>コスト</b>${escapeHtml(skill.cost)}</span>` : ""}
          ${showHit ? `<span class="view-skill-field"><b>命中</b>${escapeHtml(formatDiceText(hit))}</span>` : ""}
          ${showDmg ? `<span class="view-skill-field"><b>ダメージ</b>${escapeHtml(formatDiceText(dmg))}</span>` : ""}
          ${skill.attribute ? `<span class="view-skill-field"><b>属性</b>${attributeChipsForView(skill.attribute)}</span>` : ""}
        </div>
        ${String(skill.effect || "").trim() ? `<p>${escapeHtml(skill.effect)}</p>` : ""}
      </article>`;
    }).join("");
  }

  function formatViewDropItemText(item) {
    const name = viewValue(item && item.name, "-");
    const unitRaw = viewValue(item && item.unitPrice, "0");
    const qty = viewValue(item && item.quantity, "1");
    const unit = /G\s*$/i.test(String(unitRaw)) ? String(unitRaw) : `${unitRaw}G`;
    return `${escapeHtml(name)} ${escapeHtml(qty)}個（${escapeHtml(unit)}）`;
  }

  function buildViewDropRows(sheet) {
    const show = getByPath(sheet, "showDropItemsInView");
    if (!(show == null || show === "" ? true : !!show)) return "";
    if (isViewStagePre()) return "";
    const rows = [];
    (Array.isArray(state.exDropItems) ? state.exDropItems : []).forEach((item) => {
      if (!String(item && (item.name || item.unitPrice || item.quantity) || "").trim()) return;
      rows.push(`<tr><th>EXドロップ</th><td>${formatViewDropItemText(item)}</td></tr>`);
    });
    (Array.isArray(state.dropItems) ? state.dropItems : []).forEach((item) => {
      const min = viewValue(item.min, "-");
      const max = viewValue(item.max, "");
      const range = max ? `${min}〜${max}` : `${min}〜`;
      rows.push(`<tr><th>${escapeHtml(range)}</th><td>${formatViewDropItemText(item)}</td></tr>`);
    });
    if (!rows.length) return "";
    return `<section class="enemy-view-block"><h3>ドロップ品</h3><table class="enemy-view-table is-drop-simple"><tbody>${rows.join("")}</tbody></table></section>`;
  }

  function calcDropTotal(item) {
    const qty = Number(item && item.quantity);
    const unit = Number(String(item && item.unitPrice || "").replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(qty) || !Number.isFinite(unit)) return 0;
    return Math.trunc(qty * unit);
  }

  function buildViewResources() {
    const rows = (Array.isArray(state.resources) ? state.resources : []).filter((r) => String(r.name || r.current || r.max || r.memo || "").trim()).map((r) => `<tr><td class="view-name-cell">${escapeHtml(r.name || "-")}</td><td>${escapeHtml(r.current || "-")}</td><td>${escapeHtml(r.max || "-")}</td><td class="view-name-cell">${escapeHtml(r.memo || "")}</td></tr>`);
    if (!rows.length) return "";
    return `<section class="enemy-view-block"><h3>追加リソース</h3><table class="enemy-view-table is-resource"><thead><tr><th>名称</th><th>現在</th><th>最大</th><th>メモ</th></tr></thead><tbody>${rows.join("")}</tbody></table></section>`;
  }


  function getCreditLabel(author) {
    const text = String(author || "").trim();
    return /^公式(?:[-－ー]|$)/.test(text) ? "出典" : "作者";
  }

  function renderEnemyView() {
    if (!el.enemyViewContent) return;
    renderViewStageButtons();
    const current = getSelectedEnemy();
    const sheet = (current && current.data && current.data.sheet) || {};
    const name = viewValue(current && current.name || getByPath(sheet, "name"), "名称未設定");
    const iconUrl = viewValue(current && current.icon_url || getByPath(sheet, "meta.imageUrl"), "");
    const classification = viewValue(getByPath(sheet, "classification"), "-");
    const attr = viewValue(getByPath(sheet, "attribute"), "-");
    const level = viewValue(getByPath(sheet, "level"), "-");
    const memo = viewValue(current && current.memo || getByPath(sheet, "memo"), "");
    const defenseMasked = !isViewStageDefenseOpen();
    const preMasked = isViewStagePre();
    const identified = !preMasked;
    const defenseOpen = isViewStageDefenseOpen();
    const displayName = escapeHtml(name);
    const viewIconClass = preMasked ? "fa-question" : getClassificationIcon(classification);
    const defenseSummary = defenseCompareText(sheet);
    const abilities = ABILITY_KEYS.map((key) => {
      const abilityText = abilityFormulaForView(key, sheet).replace(/（.*$/, "");
      return `<div class="enemy-view-ability-pill"><b>${ABILITY_LABELS[key]}</b><span>${preMasked ? `<span class="view-mask">${maskTextLike(abilityText, 5)}</span>` : abilityFormulaHtmlForView(key, sheet)}</span></div>`;
    }).join("");
    const statSummary = `
      <div class="enemy-view-stat-grid is-hero-stats">
        <div><b>HP</b><span>${maybeMask(getByPath(sheet, "hp"), preMasked, 5)}</span></div>
        <div><b>MP</b><span>${maybeMask(getByPath(sheet, "mp"), preMasked, 5)}</span></div>
        <div><b>行動値</b><span>${maybeMask(getByPath(sheet, "initiative"), false, 3)}</span></div>
        <div><b>移動値</b><span>${maybeMask(getByPath(sheet, "movement"), preMasked, 4)}</span></div>
        <div><b>回避</b><span>${defenseMasked ? maybeMask(formatDiceText(getByPath(sheet, "evadeDice") || "2D+0"), true, 5) : diceTextHtmlForView(formatDiceText(getByPath(sheet, "evadeDice") || "2D+0"), "is-summary-dice-letter")}</span></div>
        <div><b>物防</b><span>${maybeMask(getByPath(sheet, "physDef"), defenseMasked, 3)}</span></div>
        <div><b>魔防</b><span>${maybeMask(getByPath(sheet, "magicDef"), defenseMasked, 3)}</span></div>
      </div>`;
    try {
      const chatPaletteText = getChatPaletteTextForView();
      if (el.enemyViewChatPaletteText) el.enemyViewChatPaletteText.value = chatPaletteText;
    } catch (error) {
      console.warn("[AR2E] チャットパレット表示の更新をスキップ:", error);
    }
    el.enemyViewContent.innerHTML = `
      <section class="enemy-view-hero">
        ${iconUrl ? `<div class="enemy-view-image"><img src="${escapeHtml(iconUrl)}" alt=""></div>` : `<div class="enemy-view-image is-empty"><i class="fa-solid ${viewIconClass}"></i></div>`}
        <div class="enemy-view-titlebox">
          <i class="fa-solid ${viewIconClass} enemy-view-bg-class-icon" aria-hidden="true"></i>
          <div class="enemy-view-name-row">
            <h2>${displayName}</h2>
          </div>
          <dl class="enemy-view-top-profile">
            <div class="is-top-profile"><dt>分類</dt><dd>${identified ? escapeHtml(classification) : `<span class="view-mask">${maskTextLike(classification, 4)}</span>`}</dd></div>
            <div class="is-top-profile"><dt>属性</dt><dd class="view-profile-chips">${identified ? attributeChipsForView(attr) : `<span class="view-mask">${maskTextLike(attr, 2)}</span>`}</dd></div>
            <div class="is-top-profile is-level-profile"><dt>レベル</dt><dd><span class="enemy-view-level-inline">${identified ? escapeHtml(level) : `<span class="view-mask">${maskTextLike(level, 2)}</span>`}</span></dd></div>
            <div class="is-top-profile"><dt>識別値</dt><dd>${escapeHtml(viewValue(getByPath(sheet, "identification"), "-"))}</dd></div>
          </dl>
          <dl class="enemy-view-profile-table is-with-summary">
            <div><dt>HP</dt><dd>${maybeMask(getByPath(sheet, "hp"), preMasked, 5)}</dd></div>
            <div><dt>MP</dt><dd>${maybeMask(getByPath(sheet, "mp"), preMasked, 5)}</dd></div>
            <div><dt>行動値</dt><dd>${maybeMask(getByPath(sheet, "initiative"), false, 3)}</dd></div>
            <div><dt>移動値</dt><dd>${maybeMask(getByPath(sheet, "movement"), preMasked, 4)}</dd></div>
            <div><dt>回避</dt><dd>${defenseMasked ? maybeMask(formatDiceText(getByPath(sheet, "evadeDice") || "2D+0"), true, 5) : diceTextHtmlForView(formatDiceText(getByPath(sheet, "evadeDice") || "2D+0"), "is-summary-dice-letter")}</dd></div>
            <div><dt>物防</dt><dd class="${!preMasked && !defenseOpen ? "is-text-value" : ""}">${preMasked ? maybeMask(getByPath(sheet, "physDef"), true, 3) : (defenseOpen ? escapeHtml(viewValue(getByPath(sheet, "physDef"), "-")) : escapeHtml(defenseSummary))}</dd></div>
            <div><dt>魔防</dt><dd class="${!preMasked && !defenseOpen ? "is-text-value" : ""}">${preMasked ? maybeMask(getByPath(sheet, "magicDef"), true, 3) : (defenseOpen ? escapeHtml(viewValue(getByPath(sheet, "magicDef"), "-")) : escapeHtml(defenseSummary))}</dd></div>
            <div class="enemy-view-profile-abilities"><dt>能力値</dt><dd><div class="enemy-view-ability-row">${abilities}</div></dd></div>
          </dl>
        </div>
      </section>
      <section class="enemy-view-block">
        <h3>攻撃方法</h3>
        <div class="enemy-view-attacks">${buildViewAttackCards()}</div>
      </section>
      <section class="enemy-view-block">
        <h3>所持スキル</h3>
        <div class="enemy-view-skills">${buildViewSkillCards()}</div>
      </section>
      ${(memo || getEnemyAuthor(current)) ? `<section class="enemy-view-block is-view-memo-block"><div class="enemy-view-memo-head"><h3>解説</h3>${getEnemyAuthor(current) ? `<span class="view-chip is-credit enemy-view-memo-credit-chip">${getCreditLabel(getEnemyAuthor(current))}：${escapeHtml(getEnemyAuthor(current))}</span>` : ""}</div>${memo ? `<div class="enemy-view-memo">${escapeHtml(memo)}</div>` : `<div class="enemy-view-memo is-empty"></div>`}</section>` : ""}
      ${buildViewDropRows(sheet)}
      ${buildViewResources()}
    `;
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
    if (el.form) {
      el.form.addEventListener("input", (e) => {
        normalizeNumericLikeInput(e.target);
      }, true);
    }
    setPageMode();
    if (el.fieldShowDropsInView) {
      el.fieldShowDropsInView.addEventListener("change", () => {
        const current = getSelectedEnemy();
        if (current) readFormToCurrentEnemy();
        markDirty();
      });
    }
    if (el.komaExportModeSelect) {
      el.komaExportModeSelect.addEventListener("change", () => {
        state.viewStage = normalizeViewStage(el.komaExportModeSelect.value);
        const current = getSelectedEnemy();
        if (current) readFormToCurrentEnemy();
        markDirty();
      });
    }
    document.querySelectorAll(".enemy-view-stage-btn[data-view-stage]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.viewStage = String(btn.dataset.viewStage || "pre_identify");
        renderEnemyView();
      });
    });
    if (el.openEnemyViewButton) {
      el.openEnemyViewButton.addEventListener("click", async () => {
        try {
          const current = getSelectedEnemy();
          if (current) readFormToCurrentEnemy();
          let id = String((current && current.ID) || getSharedEnemyIdFromUrl() || "").trim();
          if (!id || isUnsavedEnemy(current) || state.dirty) {
            const ok = window.confirm("閲覧用画面を表示するには保存が必要です。保存してから表示しますか？");
            if (!ok) return;
            await saveCurrentToDb();
            const saved = getSelectedEnemy();
            id = String((saved && saved.ID) || "").trim();
          }
          openEnemyViewInNewTab(id);
        } catch (error) {
          console.error("[AR2E] 閲覧画面への移動に失敗:", error);
          setStatus(`閲覧画面への移動に失敗: ${error.message || "error"}`);
        }
      });
    }
    if (el.viewEditModeButton) {
      el.viewEditModeButton.addEventListener("click", () => {
        const current = getSelectedEnemy();
        const id = String((current && current.ID) || getSharedEnemyIdFromUrl() || "").trim();
        openEnemyEditInNewTab(id);
      });
    }
    if (el.viewCopyChatPaletteButton) {
      el.viewCopyChatPaletteButton.addEventListener("click", async () => {
        const text = el.enemyViewChatPaletteText ? String(el.enemyViewChatPaletteText.value || "") : (getChatPaletteTextForView() || buildKomaCommandsForCurrentEnemy().join("\n"));
        if (!text.trim()) return;
        await copyTextToClipboard(text);
        showToast("チャットパレットをコピーしました", "info");
      });
    }
    const copyViewKomaJson = async () => {
      try {
        await exportKomaJsonByCurrentMode();
      } catch (e) {
        setStatus(`コマJSON出力失敗: ${e.message || "error"}`);
      }
    };
    if (el.viewCopyKomaJsonButton) {
      el.viewCopyKomaJsonButton.addEventListener("click", copyViewKomaJson);
    }
    if (el.viewCopyKomaJsonToolbarButton) {
      el.viewCopyKomaJsonToolbarButton.addEventListener("click", copyViewKomaJson);
    }
    if (el.viewToggleChatPaletteButton) {
      el.viewToggleChatPaletteButton.addEventListener("click", () => {
        const panel = document.querySelector(".enemy-view-chat-palette-panel");
        if (!panel) return;
        const nextOpen = !panel.classList.contains("is-open");
        panel.classList.toggle("is-open", nextOpen);
        document.body.classList.toggle("is-enemy-view-chat-open", nextOpen);
        el.viewToggleChatPaletteButton.setAttribute("aria-expanded", nextOpen ? "true" : "false");
      });
    }
    if (el.viewWideModeToggle) {
      el.viewWideModeToggle.addEventListener("change", () => {
        document.body.classList.toggle("is-enemy-view-wide", !!el.viewWideModeToggle.checked);
      });
    }
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

        if (target.matches && target.matches('input[data-card-secret]') && state.skills[index]) {
          const isSecret = !!target.checked;
          state.skills[index].isSecret = isSecret;
          tr.querySelectorAll('input[data-key="isSecret"], input[data-card-secret]').forEach((node) => {
            node.checked = isSecret;
            node.classList.toggle("is-secret-on", isSecret);
            node.setAttribute("aria-checked", isSecret ? "true" : "false");
          });
          tr.classList.toggle("is-secret-row", isSecret);
          updateChatPalettePreview();
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
          const line = buildSkillChantLineForKoma(src);
          if (!line) {
            showToast("コピーするスキルチャットパレットがありません", "error");
            return;
          }
          copyTextToClipboard(line)
            .then(() => showToast("このスキルのチャットパレットをコピーしました", "info"))
            .catch((error) => showToast(error.message || "コピーに失敗しました", "error"));
          return;
        }

        const cloneBtn = e.target.closest("button[data-clone-kind='skills']");
        if (cloneBtn) {
          const tr = cloneBtn.closest("tr");
          if (!tr) return;
          const index = Number(tr.getAttribute("data-index"));
          const src = state.skills[index];
          if (!src) return;
          const duplicated = deepClone(src);
          duplicated.id = `skill_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          state.skills.splice(index + 1, 0, duplicated);
          renderSkills();
          markDirty();
          showToast("スキル行を複製しました", "info");
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

    if (el.exDropItemsBody) {
      let draggingExDropIndex = -1;
      el.exDropItemsBody.addEventListener("dragstart", (e) => {
        const handle = e.target.closest(".drag-hint");
        if (!handle) return;
        const tr = handle.closest("tr[data-ex-drop-index]");
        if (!tr) return;
        draggingExDropIndex = Number(tr.getAttribute("data-ex-drop-index"));
        tr.classList.add("is-dragging");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", String(draggingExDropIndex));
          e.dataTransfer.setDragImage(tr, 24, 12);
        }
      });
      el.exDropItemsBody.addEventListener("dragover", (e) => {
        if (draggingExDropIndex < 0) return;
        const tr = e.target.closest("tr[data-ex-drop-index]");
        if (!tr) return;
        e.preventDefault();
        tr.classList.add("is-drag-over");
      });
      el.exDropItemsBody.addEventListener("dragleave", (e) => {
        const tr = e.target.closest("tr[data-ex-drop-index]");
        if (tr) tr.classList.remove("is-drag-over");
      });
      el.exDropItemsBody.addEventListener("drop", (e) => {
        const tr = e.target.closest("tr[data-ex-drop-index]");
        if (!tr || draggingExDropIndex < 0) return;
        e.preventDefault();
        tr.classList.remove("is-drag-over");
        const toIndex = Number(tr.getAttribute("data-ex-drop-index"));
        if (moveRowByIndex(state.exDropItems, draggingExDropIndex, toIndex)) {
          renderExDropItems();
          markDirty();
        }
        draggingExDropIndex = -1;
      });
      el.exDropItemsBody.addEventListener("dragend", () => {
        draggingExDropIndex = -1;
        el.exDropItemsBody.querySelectorAll("tr.is-dragging").forEach((row) => row.classList.remove("is-dragging"));
        el.exDropItemsBody.querySelectorAll("tr.is-drag-over").forEach((row) => row.classList.remove("is-drag-over"));
      });
      el.exDropItemsBody.addEventListener("input", (e) => {
        const target = e.target;
        const tr = target.closest("tr");
        if (!tr) return;
        const index = Number(tr.getAttribute("data-ex-drop-index"));
        const key = target.getAttribute("data-ex-drop-key");
        if (key && state.exDropItems[index]) {
          state.exDropItems[index][key] = target.value;
          const qty = Number(state.exDropItems[index].quantity);
          const unit = Number(String(state.exDropItems[index].unitPrice || "").replace(/[^0-9.-]/g, ""));
          const lineTotal = Number.isFinite(qty) && Number.isFinite(unit) ? qty * unit : "";
          const totalInput = tr.querySelector('td:nth-child(5) input[readonly]');
          if (totalInput) totalInput.value = lineTotal === "" ? "" : String(lineTotal);
          markDirty();
        }
      });
      el.exDropItemsBody.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-ex-drop-delete]");
        if (!btn) return;
        const tr = btn.closest("tr");
        if (!tr) return;
        const index = Number(tr.getAttribute("data-ex-drop-index"));
        state.exDropItems.splice(index, 1);
        renderExDropItems();
        markDirty();
      });
    }

    if (el.dropItemsBody) {
      let draggingDropIndex = -1;
      let draggingDropKind = "";
      el.dropItemsBody.addEventListener("dragstart", (e) => {
        const handle = e.target.closest(".drag-hint");
        if (!handle) return;
        const tr = handle.closest("tr[data-drop-kind]");
        if (!tr) return;
        draggingDropKind = String(tr.getAttribute("data-drop-kind") || "normal");
        draggingDropIndex = Number(
          draggingDropKind === "ex"
            ? tr.getAttribute("data-ex-drop-index")
            : tr.getAttribute("data-drop-index")
        );
        tr.classList.add("is-dragging");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", `${draggingDropKind}:${draggingDropIndex}`);
          e.dataTransfer.setDragImage(tr, 24, 12);
        }
      });
      el.dropItemsBody.addEventListener("dragover", (e) => {
        if (draggingDropIndex < 0) return;
        const tr = e.target.closest("tr[data-drop-kind]");
        if (!tr || String(tr.getAttribute("data-drop-kind") || "normal") !== draggingDropKind) return;
        e.preventDefault();
        tr.classList.add("is-drag-over");
      });
      el.dropItemsBody.addEventListener("dragleave", (e) => {
        const tr = e.target.closest("tr[data-drop-kind]");
        if (tr) tr.classList.remove("is-drag-over");
      });
      el.dropItemsBody.addEventListener("drop", (e) => {
        const tr = e.target.closest("tr[data-drop-kind]");
        if (!tr || draggingDropIndex < 0) return;
        const kind = String(tr.getAttribute("data-drop-kind") || "normal");
        if (kind !== draggingDropKind) return;
        e.preventDefault();
        tr.classList.remove("is-drag-over");
        const toIndex = Number(
          kind === "ex"
            ? tr.getAttribute("data-ex-drop-index")
            : tr.getAttribute("data-drop-index")
        );
        const list = kind === "ex" ? state.exDropItems : state.dropItems;
        if (moveRowByIndex(list, draggingDropIndex, toIndex)) {
          renderDropItems();
          markDirty();
        }
        draggingDropIndex = -1;
        draggingDropKind = "";
      });
      el.dropItemsBody.addEventListener("dragend", () => {
        draggingDropIndex = -1;
        draggingDropKind = "";
        el.dropItemsBody.querySelectorAll("tr.is-dragging").forEach((row) => row.classList.remove("is-dragging"));
        el.dropItemsBody.querySelectorAll("tr.is-drag-over").forEach((row) => row.classList.remove("is-drag-over"));
      });

      el.dropItemsBody.addEventListener("input", (e) => {
        const target = e.target;
        const tr = target.closest("tr[data-drop-kind]");
        if (!tr) return;
        const kind = String(tr.getAttribute("data-drop-kind") || "normal");
        if (kind === "ex") {
          const index = Number(tr.getAttribute("data-ex-drop-index"));
          const key = target.getAttribute("data-ex-drop-key");
          if (key && state.exDropItems[index]) {
            state.exDropItems[index][key] = target.value;
            const qty = Number(state.exDropItems[index].quantity);
            const unit = Number(String(state.exDropItems[index].unitPrice || "").replace(/[^0-9.-]/g, ""));
            const lineTotal = Number.isFinite(qty) && Number.isFinite(unit) ? qty * unit : "";
            const totalInput = tr.querySelector('td:nth-last-child(2) input[readonly]');
            if (totalInput) totalInput.value = lineTotal === "" ? "" : String(lineTotal);
            markDirty();
          }
          return;
        }

        const index = Number(tr.getAttribute("data-drop-index"));
        const key = target.getAttribute("data-drop-key");
        if (key && state.dropItems[index]) {
          state.dropItems[index][key] = target.value;
          const qty = Number(state.dropItems[index].quantity);
          const unit = Number(String(state.dropItems[index].unitPrice || "").replace(/[^0-9.-]/g, ""));
          const lineTotal = Number.isFinite(qty) && Number.isFinite(unit) ? qty * unit : "";
          const totalInput = tr.querySelector('td:nth-child(7) input[readonly]');
          if (totalInput) totalInput.value = lineTotal === "" ? "" : String(lineTotal);
          markDirty();
        }
      });

      el.dropItemsBody.addEventListener("click", (e) => {
        const exBtn = e.target.closest("button[data-ex-drop-delete]");
        if (exBtn) {
          const tr = exBtn.closest("tr[data-ex-drop-index]");
          if (!tr) return;
          const index = Number(tr.getAttribute("data-ex-drop-index"));
          state.exDropItems.splice(index, 1);
          renderDropItems();
          markDirty();
          return;
        }

        const btn = e.target.closest("button[data-drop-delete]");
        if (!btn) return;
        const tr = btn.closest("tr[data-drop-index]");
        if (!tr) return;
        const index = Number(tr.getAttribute("data-drop-index"));
        state.dropItems.splice(index, 1);
        renderDropItems();
        markDirty();
      });
    }

    if (el.addExDropItemBtn) {
      el.addExDropItemBtn.addEventListener("click", () => {
        if (state.exDropItems.length >= 1) {
          showToast("EXドロップは1枠のみです", "info");
          renderDropItems();
          return;
        }
        state.exDropItems = [createEmptyExDropItem()];
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
          const line = buildAttackChantLineForKoma(src);
          if (!line) {
            showToast("コピーする攻撃チャットパレットがありません", "error");
            return;
          }
          copyTextToClipboard(line)
            .then(() => showToast("この攻撃方法のチャットパレットをコピーしました", "info"))
            .catch((error) => showToast(error.message || "コピーに失敗しました", "error"));
          return;
        }

        const cloneBtn = e.target.closest("button[data-atk-clone]");
        if (cloneBtn) {
          const tr = cloneBtn.closest("tr");
          if (!tr) return;
          const index = Number(tr.getAttribute("data-atk-index"));
          const src = state.attackMethods[index];
          if (!src) return;
          const duplicated = deepClone(src);
          duplicated.id = `atk_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          state.attackMethods.splice(index + 1, 0, duplicated);
          renderAttackMethods();
          markDirty();
          showToast("攻撃方法行を複製しました", "info");
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
        markDirty();
      });
    }

    if (el.addResourceBtn) {
      el.addResourceBtn.addEventListener("click", () => {
        state.resources.push(createEmptyResource());
        renderResources();
        markDirty();
      });
    }

    if (el.resourcesBody) {
      el.resourcesBody.addEventListener("input", (e) => {
        const target = e.target;
        const tr = target.closest("tr[data-resource-index]");
        if (!tr) return;
        const index = Number(tr.getAttribute("data-resource-index"));
        const key = target.getAttribute("data-resource-key");
        if (key && state.resources[index]) {
          state.resources[index][key] = target.value;
          markDirty();
        }
      });
      el.resourcesBody.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-resource-delete]");
        if (!btn) return;
        const tr = btn.closest("tr[data-resource-index]");
        if (!tr) return;
        const index = Number(tr.getAttribute("data-resource-index"));
        state.resources.splice(index, 1);
        renderResources();
        markDirty();
      });
    }

    if (el.skillDisplayModeButton && el.skillSummaryList) {
      el.skillDisplayModeButton.addEventListener("click", () => {
        const block = el.skillSummaryList.closest(".skill-display-area");
        const tableWrap = document.getElementById("skillsTable")?.closest(".table-wrap");
        const showingList = block && !block.hidden;
        if (block) block.hidden = showingList;
        if (tableWrap) tableWrap.hidden = !showingList;
        el.skillDisplayModeButton.textContent = showingList ? "一覧表示" : "編集表示";
        renderSkillSummaryList();
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
            el.attributeSecondarySelect.hidden = primary === "特殊";
          }
          if (el.attributeDivider) el.attributeDivider.hidden = primary === "特殊";
        }
        updateAttributeFromSelects();
      });
    }

    if (el.attributeSecondarySelect) {
      el.attributeSecondarySelect.addEventListener("change", () => {
        updateAttributeFromSelects();
      });
    }

    if (el.attributeSpecialText) {
      el.attributeSpecialText.addEventListener("input", () => {
        updateAttributeFromSelects();
      });
    }

    if (el.copyChatPaletteButton) {
      el.copyChatPaletteButton.addEventListener("click", async () => {
        try {
          updateChatPalettePreview();
          const text = el.chatPreview ? String(el.chatPreview.value || "").trim() : "";
          if (!text) throw new Error("コピーするチャットパレットがありません");
          await copyTextToClipboard(text);
          showToast("チャットパレットをコピーしました", "info");
        } catch (error) {
          showToast(error.message || "チャットパレットのコピーに失敗しました", "error");
        }
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
    if (el.shareEnemyButton) {
      el.shareEnemyButton.addEventListener("click", async () => {
        try {
          await shareCurrentEnemy();
        } catch (e) {
          setStatus(`共有失敗: ${e.message || "error"}`, "error");
          showToast(`共有失敗: ${e.message || "error"}`, "error");
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
        const selectedIsUnsaved = selected && isUnsavedEnemy(selected);
        let preserveCurrentUnsaved = false;

        if (selectedIsUnsaved && state.dirty && !selected._pristineNew) {
          const ok = window.confirm(
            "現在の新規白紙を残したまま、DB一覧だけ更新しますか？\n\n「OK」：新規白紙を表示したまま一覧更新\n「キャンセル」：更新しない",
          );
          if (!ok) return;
          preserveCurrentUnsaved = true;
        } else if (selectedIsUnsaved) {
          preserveCurrentUnsaved = true;
        } else if (state.dirty) {
          const targetName = String((selected && selected.name) || "").trim() || "編集中データ";
          const ok = window.confirm(
            `「${targetName}」をDBから再読込しますか？\n未保存の変更は失われます。\n\n「キャンセル」を押すと更新しません。`,
          );
          if (!ok) return;
        }

        if (selected) {
          readFormToCurrentEnemy();
        }
        try {
          setStatus("読込中…");
          await loadFromDb({ preserveCurrentUnsaved });
          if (!preserveCurrentUnsaved) setStatus("読込完了");
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
    document.addEventListener("keydown", (event) => {
      const key = String(event.key || "").toLowerCase();
      if (!(event.ctrlKey || event.metaKey) || key !== "s") return;
      event.preventDefault();
      if (state.viewMode) return;
      if (el.saveEnemyButton && !el.saveEnemyButton.disabled) {
        el.saveEnemyButton.click();
      }
    });

    if (el.importJsonInput) {
      el.importJsonInput.addEventListener("change", () => {
        const raw = String(el.importJsonInput.value || "").trim();
        if (!raw) return;
        if (tryEnableAdminModeFromImport(raw)) return;
        try {
          const parsed = JSON.parse(raw);
          const current = getSelectedEnemy();
          if (!current) return;

          let merged;
          // ココフォリアの駒JSON形式の場合
          if (parsed.kind === "character" && parsed.data) {
            merged = deepClone(current);
            if (!merged.data) merged.data = { sheet: {}, skills: [], exDropItems: [], dropItems: [], attackMethods: [], resources: [] };
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
      await loadFromDb({ preserveDraftSnapshot: hasDraftSnapshot() });
      restoreDraftIfNeededOnce();
    } catch (e) {
      console.error("[AR2E] Failed to load from DB:", e);
      setStatus(`DB読込失敗: ${e.message || "error"}`, "error");
      
      const fresh = createEnemyTemplate({ auto: true });
      fresh.data = {
        sheet: { enemyType: "general", attribute: "-/-", isPublic: true, showDropItemsInView: true, author: getRememberedAuthor() },
        skills: [createEmptySkill(), createEmptySkill(), createEmptySkill()],
        dropItems: createDefaultDropItems(),
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
      const current = getSelectedEnemy();
      const isBlankFresh = !!current && isBlankNewEnemyDraft(current);
      const shouldConfirmUnload =
        !isBlankFresh &&
        (!!state.dirty ||
          (!!current && isUnsavedEnemy(current) && !current._autoTemplate && !current._pristineNew));
      if (!shouldConfirmUnload) {
        if (isBlankFresh) clearDraftSnapshot();
        return;
      }
      saveDraftSnapshotFromCurrent();
      event.preventDefault();
      event.returnValue = "";
    });
  }

  document.addEventListener("DOMContentLoaded", init);

})();

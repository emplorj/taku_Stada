(function attachEnemiesShared(globalScope) {
  const REPEATABLE_TIMINGS = new Set(["オート", "アクション"]);
  const toastTimers = new Map();
  const MESSAGE_TEMPLATES = Object.freeze({
    komaJsonCopySuccess: "ココフォリアコマ出力をコピーした！これを盤面でペーストだ！",
    clipboardCopyFailedConsole: "コピー失敗。コンソールに出力する",
    saveRequestSending: "保存要求を送信中…",
    saveAsInProgress: "別名保存中…",
    saveAsSameNameBlocked: "ちょっと待て！別名保存なのに同じ名前だ。先に名前を変えてくれ。",
    saveAsSameNameConfirm: "別名保存なのに同じ名前だけど保存しちゃっていい？\n1: そのまま保存\n2: やめる\n3: （コピー）を付けて保存",
    saveAsSameNameChoiceInvalid: "入力がわからない。1（そのまま保存）/2（やめる）/3（コピー名で保存）で選んでくれ。",
    saveAsSameNameOptionSave: "そのまま保存",
    saveAsSameNameOptionCancel: "やめる",
    saveAsSameNameOptionCopy: "（コピー）を付けて保存",
    saveCompleted: "保存完了 {time}",
    saveAsPrompt: "別名保存する名前を入力してください",
    saveAsNameRequired: "保存名を入力してください",
  });

  // --- Utility ---
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

  function formatShortDate(value) {
    const s = String(value || "").trim();
    if (!s) return "-";
    const m = s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (m) {
      const hh = String(m[4] || "00").padStart(2, "0");
      const mi = String(m[5] || "00").padStart(2, "0");
      const ss = m[6] ? `:${String(m[6]).padStart(2, "0")}` : "";
      return `${m[1]}/${String(m[2]).padStart(2, "0")}/${String(m[3]).padStart(2, "0")} ${hh}:${mi}${ss}`;
    }
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function deepClone(obj) {
    if (obj == null) return obj;
    return JSON.parse(JSON.stringify(obj));
  }

  function toInt(value, fallback = 0) {
    const n = Number(String(value == null ? "" : value).trim());
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
  }

  // --- API / Network ---
  const DEFAULT_GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxMR7f_pOi14SsAuKvu7YxKVBQZ69dn-TeQpMBxyYzo_pwZmICNZ06cSb8BKQYCM0GuGg/exec";

  function getConfiguredApiUrl(storageKey) {
    const params = new URLSearchParams(window.location.search);
    const apiFromQuery = params.get("ncApi") || params.get("gasApi");
    if (apiFromQuery) {
      try { localStorage.setItem(storageKey, String(apiFromQuery)); } catch (_e) {}
      return String(apiFromQuery).trim();
    }
    try {
      const fromStorage = localStorage.getItem(storageKey) || "";
      if (fromStorage.trim()) return fromStorage.trim();
    } catch (_e) {}
    return DEFAULT_GAS_WEB_APP_URL;
  }

  function buildApiUrl(storageKey, toolName, action, params = {}) {
    const base = getConfiguredApiUrl(storageKey).replace(/\/+$/, "");
    if (!base) throw new Error("API URLが未設定");
    const url = new URL(base);
    url.searchParams.set("tool", toolName);
    url.searchParams.set("action", action);
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && String(v).trim()) url.searchParams.set(k, String(v).trim());
    });
    return url.toString();
  }

  async function fetchApiJson(url, init = null) {
    const res = await fetch(url, init || undefined);
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.message) ? data.message : `APIエラー (HTTP ${res.status})`);
    if (!data || data.status === "error") throw new Error((data && data.message) || "API応答が不正");
    return data;
  }

  // --- UI Components ---
  function showRestoreDialog(nameText, classText) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "restore-dialog-overlay";
      const dialog = document.createElement("div");
      dialog.className = "restore-dialog";
      dialog.setAttribute("role", "dialog");
      
      const classLabel = classText ? `<span class="restore-dialog-class">${escapeHtml(classText)}</span>` : "";
      dialog.innerHTML = `
        <p class="restore-dialog-title">前回の続きを開きますか？</p>
        <p class="restore-dialog-enemy">
          <span class="restore-dialog-name">${escapeHtml(nameText || "（名称未設定）")}</span>
          ${classLabel}
        </p>
        <div class="restore-dialog-actions">
          <button id="restoreDialogYes" class="small-square-btn">続きを開く</button>
          <button id="restoreDialogNo" class="small-square-btn is-secondary">新規で開く</button>
        </div>
      `;
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      const done = (res) => { overlay.remove(); resolve(res); };
      const yesBtn = dialog.querySelector("#restoreDialogYes");
      if (yesBtn) yesBtn.addEventListener("click", () => done(true));
      dialog.querySelector("#restoreDialogNo")?.addEventListener("click", () => done(false));
      overlay.addEventListener("click", (e) => { if (e.target === overlay) done(false); });
      document.addEventListener("keydown", function onKey(e) {
        if (e.key === "Escape") {
          document.removeEventListener("keydown", onKey);
          done(false);
        }
      });
      if (yesBtn) yesBtn.focus();
    });
  }

  // --- Table Drag & Drop ---
  function moveArrayElement(list, fromIndex, toIndex) {
    if (!Array.isArray(list) || fromIndex === toIndex) return false;
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) return false;
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    return true;
  }

  function bindTableDragAndDrop(containerElement, options = {}) {
    if (!containerElement) return;
    const {
      rowSelector = "tr",
      handleSelector = ".drag-hint",
      indexAttr = "data-index",
      dragClass = "is-dragging",
      dragOverClass = "is-drag-over",
      onDrop
    } = options;

    let draggingIndex = -1;

    containerElement.addEventListener("dragstart", (e) => {
      const handle = e.target.closest(handleSelector);
      if (!handle) return;
      if (e.target.closest("input, textarea, select, button, [contenteditable='true']")) {
        if (e.dataTransfer) e.dataTransfer.effectAllowed = "none";
        e.preventDefault();
        return;
      }
      const tr = handle.closest(rowSelector);
      if (!tr) return;
      draggingIndex = Number(tr.getAttribute(indexAttr));
      if (Number.isNaN(draggingIndex) || draggingIndex < 0) {
        draggingIndex = -1;
        return;
      }
      
      tr.classList.add(dragClass);
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(draggingIndex));
        if (typeof e.dataTransfer.setDragImage === "function") {
          e.dataTransfer.setDragImage(tr, 24, 12);
        }
      }
    });

    containerElement.addEventListener("dragover", (e) => {
      if (draggingIndex < 0) return;
      const tr = e.target.closest(rowSelector);
      if (!tr) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      tr.classList.add(dragOverClass);
    });

    containerElement.addEventListener("dragleave", (e) => {
      const tr = e.target.closest(rowSelector);
      if (tr) tr.classList.remove(dragOverClass);
    });

    containerElement.addEventListener("drop", (e) => {
      const tr = e.target.closest(rowSelector);
      if (!tr || draggingIndex < 0) return;
      e.preventDefault();
      tr.classList.remove(dragOverClass);
      
      const toIndex = Number(tr.getAttribute(indexAttr));
      if (!Number.isNaN(toIndex) && toIndex >= 0 && draggingIndex !== toIndex) {
        if (typeof onDrop === "function") onDrop(draggingIndex, toIndex);
      }
      draggingIndex = -1;
    });

    containerElement.addEventListener("dragend", () => {
      draggingIndex = -1;
      containerElement.querySelectorAll(`.${dragClass}`).forEach(n => n.classList.remove(dragClass));
      containerElement.querySelectorAll(`.${dragOverClass}`).forEach(n => n.classList.remove(dragOverClass));
    });
  }

  // --- Original Nechronica Specific ---
  function normalizeTimingText(timing) { return String(timing || "").trim(); }
  function isRepeatableTiming(timing) { return REPEATABLE_TIMINGS.has(normalizeTimingText(timing)); }
  function canUseUsedStatusForTiming(timing) { return !isRepeatableTiming(timing); }
  function canUseUsedStatusForManeuver(maneuver) { return canUseUsedStatusForTiming(maneuver && maneuver.timing); }

  async function writeClipboardText(text) {
    const value = String(text == null ? "" : text);
    if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
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
  }

  function showToast(message, opts = {}) {
    if (typeof document === "undefined") return;
    const text = String(message || "").trim();
    if (!text) return;
    const { id = "copyToast", className = "copy-toast", kind = "info", errorClass = "is-error", showClass = "is-show", duration = 1800 } = opts || {};
    let toast = document.getElementById(id);
    if (!toast) {
      toast = document.createElement("div");
      toast.id = id;
      toast.className = className;
      document.body.appendChild(toast);
    }
    toast.classList.remove(showClass);
    void toast.offsetWidth;
    toast.textContent = text;
    toast.className = className;
    if (kind === "error") toast.classList.add(errorClass);
    toast.classList.add(showClass);
    const prevTimer = toastTimers.get(id);
    if (prevTimer) clearTimeout(prevTimer);
    const timer = setTimeout(() => { toast.classList.remove(showClass); toastTimers.delete(id); }, duration);
    toastTimers.set(id, timer);
  }

  function getMessage(key, params = {}) {
    const template = MESSAGE_TEMPLATES[key];
    if (typeof template !== "string") return String(key || "");
    return template.replace(/\{(\w+)\}/g, (_m, token) => {
      const value = params ? params[token] : "";
      return value == null ? "" : String(value);
    });
  }

  function requestSaveAsName(currentName = "", opts = {}) {
    if (typeof window === "undefined" || typeof window.prompt !== "function") return null;
    const promptText = String((opts && opts.promptText) || getMessage("saveAsPrompt")).trim() || "別名保存する名前を入力してください";
    let defaultName = String((opts && opts.defaultName) != null ? opts.defaultName : String(currentName || "").trim());
    while (true) {
      const raw = window.prompt(promptText, defaultName);
      if (raw == null) return null;
      const name = String(raw || "").trim();
      if (name) return name;
      if (typeof window.alert === "function") window.alert(getMessage("saveAsNameRequired"));
      defaultName = "";
    }
  }

  async function requestSaveAsSameNameAction(_currentName = "", opts = {}) {
    const promptText = String((opts && opts.promptText) || getMessage("saveAsSameNameConfirm")) || "別名保存なのに同じ名前だけど保存しちゃっていい？";
    while (true) {
      const raw = window.prompt(promptText, "2");
      if (raw == null) return "cancel";
      const choice = String(raw || "").trim().toLowerCase();
      if (choice === "1" || choice === "save" || choice === "そのまま保存") return "save";
      if (choice === "2" || choice === "cancel" || choice === "やめる") return "cancel";
      if (choice === "3" || choice === "copy" || choice === "コピー" || choice === "コピー名で保存") return "copy";
      window.alert(getMessage("saveAsSameNameChoiceInvalid"));
    }
  }

  function resolveReportCheckedOnDamageTransition(prevStatus, nextStatus, currentChecked, damageToken) {
    const damaged = String(damageToken || "損傷");
    const prev = String(prevStatus || "");
    const next = String(nextStatus || "");
    if (next === damaged) return true;
    if (prev === damaged && next !== damaged) return false;
    return !!currentChecked;
  }

  function getRememberedAuthorFromStorage(storageKey, options = {}) {
    const key = String(storageKey || "").trim();
    if (!key) return "";
    const forbidSystem = !!(options && options.forbidSystem);
    try {
      const v = String(localStorage.getItem(key) || "").trim();
      if (forbidSystem && v === "system") return "";
      return v;
    } catch (_e) { return ""; }
  }

  function rememberAuthorToStorage(storageKey, name) {
    const key = String(storageKey || "").trim();
    if (!key) return;
    try { localStorage.setItem(key, String(name || "").trim()); } catch (_e) {}
  }

  function canViewEnemyByVisibility({ isPublic, enemyAuthor, myAuthor, enemyId = "", selectedId = "", allowSelectedFallback = false } = {}) {
    if (isPublic === true) return true;
    const mine = String(myAuthor || "").trim() !== "" && String(enemyAuthor || "") === String(myAuthor || "");
    if (mine) return true;
    if (allowSelectedFallback && String(enemyId || "") !== "" && String(enemyId || "") === String(selectedId || "")) return true;
    return false;
  }

  async function saveFile(filename, content, mimeType = "application/json") {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const shared = {
    // Nechronica Core
    normalizeTimingText,
    isRepeatableTiming,
    canUseUsedStatusForTiming,
    canUseUsedStatusForManeuver,
    writeClipboardText,
    showToast,
    getMessage,
    requestSaveAsName,
    requestSaveAsSameNameAction,
    resolveReportCheckedOnDamageTransition,
    canViewEnemyByVisibility,
    getRememberedAuthorFromStorage,
    rememberAuthorToStorage,
    saveFile,
    // Universal Core
    nowText,
    formatShortDate,
    escapeHtml,
    deepClone,
    toInt,
    getConfiguredApiUrl,
    buildApiUrl,
    fetchApiJson,
    showRestoreDialog,
    moveArrayElement,
    bindTableDragAndDrop
  };

  globalScope.EnemiesShared = Object.assign({}, globalScope.EnemiesShared || {}, shared);
  globalScope.NechronicaShared = globalScope.EnemiesShared; // 互換性維持
})(typeof window !== "undefined" ? window : globalThis);
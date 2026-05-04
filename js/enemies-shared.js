(function attachEnemiesShared(globalScope) {
  const REPEATABLE_TIMINGS = new Set(["オート", "アクション"]);
  const toastTimers = new Map();
  const MESSAGE_TEMPLATES = Object.freeze({
    komaJsonCopySuccess:
      "ココフォリアコマ出力をコピーした！これを盤面でペーストだ！",
    clipboardCopyFailedConsole: "コピー失敗。コンソールに出力する",
    saveRequestSending: "保存要求を送信中…",
    saveAsInProgress: "別名保存中…",
    saveAsSameNameBlocked:
      "ちょっと待て！別名保存なのに同じ名前だ。先に名前を変えてくれ。",
    saveAsSameNameConfirm:
      "別名保存なのに同じ名前だけど保存しちゃっていい？\n1: そのまま保存\n2: やめる\n3: （コピー）を付けて保存",
    saveAsSameNameChoiceInvalid:
      "入力がわからない。1（そのまま保存）/2（やめる）/3（コピー名で保存）で選んでくれ。",
    saveAsSameNameOptionSave: "そのまま保存",
    saveAsSameNameOptionCancel: "やめる",
    saveAsSameNameOptionCopy: "（コピー）を付けて保存",
    saveCompleted: "保存完了 {time}",
    saveAsPrompt: "別名保存する名前を入力してください",
    saveAsNameRequired: "保存名を入力してください",
  });

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function toFiniteInteger(value, fallback = 0) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.trunc(n);
  }

  function clampInteger(value, min, max, fallback = 0) {
    const n = toFiniteInteger(value, fallback);
    return Math.min(max, Math.max(min, n));
  }

  function nowText() {
    const d = new Date();
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    const h = pad2(d.getHours());
    const i = pad2(d.getMinutes());
    const s = pad2(d.getSeconds());
    return `${y}/${m}/${day} ${h}:${i}:${s}`;
  }

  function nowIsoLocal() {
    return nowText();
  }

  function formatDateParts(date) {
    const y = date.getFullYear();
    const m = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());
    const h = pad2(date.getHours());
    const i = pad2(date.getMinutes());
    const s = pad2(date.getSeconds());
    return `${y}/${m}/${day} ${h}:${i}:${s}`;
  }

  function formatDateTime(value, options = {}) {
    const {
      emptyValue = "-",
      invalidValue = "-",
      fallbackRawOnInvalid = true,
      useNowWhenEmpty = false,
      defaultSeconds = "00",
      ignoreInputSeconds = false,
    } = options || {};

    const raw = String(value || "").trim();
    if (!raw) {
      return useNowWhenEmpty ? formatDateParts(new Date()) : String(emptyValue);
    }

    const m = raw.match(
      /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
    );
    if (m) {
      const yyyy = m[1];
      const mm = pad2(m[2]);
      const dd = pad2(m[3]);
      const hh = pad2(m[4] || "00");
      const mi = pad2(m[5] || "00");
      const ss = pad2(ignoreInputSeconds ? defaultSeconds : m[6] || defaultSeconds);
      return `${yyyy}/${mm}/${dd} ${hh}:${mi}:${ss}`;
    }

    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) {
      return fallbackRawOnInvalid ? raw : String(invalidValue);
    }
    return formatDateParts(d);
  }

  function normalizeTimingText(timing) {
    return String(timing || "").trim();
  }

  function isRepeatableTiming(timing) {
    return REPEATABLE_TIMINGS.has(normalizeTimingText(timing));
  }

  function canUseUsedStatusForTiming(timing) {
    return !isRepeatableTiming(timing);
  }

  function canUseUsedStatusForManeuver(maneuver) {
    return canUseUsedStatusForTiming(maneuver && maneuver.timing);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function autoResizeTextarea(textarea) {
    if (!textarea || String(textarea.tagName || "").toLowerCase() !== "textarea") {
      return;
    }
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeApiUrl(url) {
    return String(url || "").replace(/\/+$/, "");
  }

  function buildApiUrl({ baseUrl, tool, action, params = {} } = {}) {
    const base = normalizeApiUrl(baseUrl);
    if (!base) throw new Error("API URLが未設定");
    const url = new URL(base);
    if (tool != null && String(tool).trim()) {
      url.searchParams.set("tool", String(tool).trim());
    }
    url.searchParams.set("action", action);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value == null) return;
      const s = String(value).trim();
      if (!s) return;
      url.searchParams.set(key, s);
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

  function getByPath(obj, path, defaultValue = "") {
    const segs = String(path || "").split(".");
    let cur = obj;
    for (let i = 0; i < segs.length; i += 1) {
      if (cur == null) return defaultValue;
      cur = cur[segs[i]];
    }
    return cur == null ? defaultValue : cur;
  }

  function setByPath(obj, path, value) {
    const segs = String(path || "").split(".").filter((seg) => seg !== "");
    if (!obj || !segs.length) return;
    let cur = obj;
    for (let i = 0; i < segs.length - 1; i += 1) {
      const key = segs[i];
      if (!cur[key] || typeof cur[key] !== "object") cur[key] = {};
      cur = cur[key];
    }
    cur[segs[segs.length - 1]] = value;
  }

  function moveRowByIndex(list, fromIndex, toIndex) {
    if (!Array.isArray(list)) return false;
    if (fromIndex === toIndex) return false;
    if (fromIndex < 0 || toIndex < 0) return false;
    if (fromIndex >= list.length || toIndex >= list.length) return false;
    const [row] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, row);
    return true;
  }

  async function writeClipboardText(text) {
    const value = String(text == null ? "" : text);
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(value);
      return;
    }
    if (typeof document === "undefined") {
      throw new Error("clipboard unavailable");
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

    const {
      id = "copyToast",
      className = "copy-toast",
      kind = "info",
      errorClass = "is-error",
      showClass = "is-show",
      duration = 1800,
    } = opts || {};

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
    toast.classList.remove(errorClass, showClass);
    if (kind === "error") toast.classList.add(errorClass);

    toast.classList.add(showClass);

    const prevTimer = toastTimers.get(id);
    if (prevTimer) clearTimeout(prevTimer);

    const timer = setTimeout(() => {
      toast.classList.remove(showClass);
      toastTimers.delete(id);
    }, Number(duration) > 0 ? Number(duration) : 1800);

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
    if (typeof window === "undefined" || typeof window.prompt !== "function") {
      return null;
    }
    const promptText =
      String((opts && opts.promptText) || getMessage("saveAsPrompt")).trim() ||
      "別名保存する名前を入力してください";
    let defaultName = String(
      (opts && opts.defaultName) != null
        ? opts.defaultName
        : String(currentName || "").trim(),
    );
    while (true) {
      const raw = window.prompt(promptText, defaultName);
      if (raw == null) return null;
      const name = String(raw || "").trim();
      if (name) return name;
      if (typeof window.alert === "function") {
        window.alert(getMessage("saveAsNameRequired"));
      }
      defaultName = "";
    }
  }

  function ensureSharedChoiceModalStyle() {
    if (typeof document === "undefined") return;
    if (document.getElementById("sharedChoiceModalStyle")) return;
    const style = document.createElement("style");
    style.id = "sharedChoiceModalStyle";
    style.textContent = `
      .shared-choice-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.58);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 11000;
        padding: 16px;
      }
      .shared-choice-modal {
        width: min(560px, calc(100vw - 24px));
        border-radius: 12px;
        background: #191b22;
        color: #f3f4f8;
        border: 1px solid rgba(255,255,255,0.16);
        box-shadow: 0 16px 48px rgba(0,0,0,0.45);
        padding: 16px;
      }
      .shared-choice-modal-title {
        margin: 0 0 8px;
        font-size: 1.05rem;
        font-weight: 700;
      }
      .shared-choice-modal-message {
        margin: 0;
        color: #d8dcef;
        white-space: pre-wrap;
        line-height: 1.5;
      }
      .shared-choice-modal-actions {
        margin-top: 14px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .shared-choice-modal-btn {
        appearance: none;
        border: 1px solid rgba(255,255,255,0.25);
        background: #2a2f3d;
        color: #f3f4f8;
        border-radius: 8px;
        padding: 8px 12px;
        font: inherit;
        cursor: pointer;
      }
      .shared-choice-modal-btn:hover {
        filter: brightness(1.1);
      }
      .shared-choice-modal-btn.is-main {
        background: #3f6cff;
        border-color: #5f85ff;
      }
      .shared-choice-modal-btn.is-sub {
        background: #2f5b4b;
        border-color: #4f8f77;
      }
      .shared-choice-modal-btn.is-muted {
        background: #2a2f3d;
      }
    `;
    document.head.appendChild(style);
  }

  function openChoiceModal({
    title = "確認",
    message = "",
    choices = [],
    cancelValue = "cancel",
  } = {}) {
    if (typeof document === "undefined") {
      return Promise.resolve(cancelValue);
    }
    ensureSharedChoiceModalStyle();
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "shared-choice-modal-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");

      const box = document.createElement("div");
      box.className = "shared-choice-modal";

      const h = document.createElement("h3");
      h.className = "shared-choice-modal-title";
      h.textContent = String(title || "確認");

      const p = document.createElement("p");
      p.className = "shared-choice-modal-message";
      p.textContent = String(message || "");

      const actions = document.createElement("div");
      actions.className = "shared-choice-modal-actions";

      const done = (value) => {
        document.removeEventListener("keydown", onEsc, true);
        overlay.remove();
        resolve(value);
      };

      const onEsc = (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        done(cancelValue);
      };

      document.addEventListener("keydown", onEsc, true);
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) done(cancelValue);
      });

      choices.forEach((choice, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          `shared-choice-modal-btn ${choice && choice.className ? choice.className : ""}`.trim();
        btn.textContent = String((choice && choice.label) || "選択");
        btn.addEventListener("click", () =>
          done((choice && choice.value) || cancelValue),
        );
        actions.appendChild(btn);
        if (idx === 0) {
          setTimeout(() => {
            try {
              btn.focus();
            } catch (_e) {}
          }, 0);
        }
      });

      box.appendChild(h);
      box.appendChild(p);
      box.appendChild(actions);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
    });
  }

  async function requestSaveAsSameNameAction(_currentName = "", opts = {}) {
    if (typeof document !== "undefined") {
      const text = String(
        (opts && opts.promptText) || getMessage("saveAsSameNameConfirm"),
      );
      return openChoiceModal({
        title: "別名保存の確認",
        message: text,
        cancelValue: "cancel",
        choices: [
          {
            value: "save",
            label: getMessage("saveAsSameNameOptionSave"),
            className: "is-main",
          },
          {
            value: "cancel",
            label: getMessage("saveAsSameNameOptionCancel"),
            className: "is-muted",
          },
          {
            value: "copy",
            label: getMessage("saveAsSameNameOptionCopy"),
            className: "is-sub",
          },
        ],
      });
    }
    if (typeof window === "undefined" || typeof window.prompt !== "function") {
      return "cancel";
    }
    const promptText =
      String(
        (opts && opts.promptText) || getMessage("saveAsSameNameConfirm"),
      ) || "別名保存なのに同じ名前だけど保存しちゃっていい？";
    const defaultChoice = String((opts && opts.defaultChoice) || "2");
    while (true) {
      const raw = window.prompt(promptText, defaultChoice);
      if (raw == null) return "cancel";
      const choice = String(raw || "")
        .trim()
        .toLowerCase();
      if (choice === "1" || choice === "save" || choice === "そのまま保存") {
        return "save";
      }
      if (choice === "2" || choice === "cancel" || choice === "やめる") {
        return "cancel";
      }
      if (
        choice === "3" ||
        choice === "copy" ||
        choice === "コピー" ||
        choice === "コピー名で保存"
      ) {
        return "copy";
      }
      if (typeof window.alert === "function") {
        window.alert(getMessage("saveAsSameNameChoiceInvalid"));
      }
    }
  }

  function buildCopiedName(name, options = {}) {
    const {
      fallbackName = "",
      idempotent = false,
      suffix = "（コピー）",
    } = options || {};
    const raw = String(name || "").trim();
    const base = raw || String(fallbackName || "").trim();
    if (idempotent && base.includes(suffix)) return base;
    return `${base}${suffix}`;
  }

  function resolveReportCheckedOnDamageTransition(
    prevStatus,
    nextStatus,
    currentChecked,
    damageToken,
  ) {
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
    } catch (_e) {
      return "";
    }
  }

  function rememberAuthorToStorage(storageKey, name) {
    const key = String(storageKey || "").trim();
    if (!key) return;
    try {
      localStorage.setItem(key, String(name || "").trim());
    } catch (_e) {}
  }

  function saveLastSelectedIdToStorage(storageKey, id) {
    const key = String(storageKey || "").trim();
    if (!key) return;
    try {
      if (id) localStorage.setItem(key, String(id));
      else localStorage.removeItem(key);
    } catch (_e) {}
  }

  function getLastSelectedIdFromStorage(storageKey) {
    const key = String(storageKey || "").trim();
    if (!key) return "";
    try {
      return String(localStorage.getItem(key) || "").trim();
    } catch (_e) {
      return "";
    }
  }

  function canViewEnemyByVisibility({
    isPublic,
    enemyAuthor,
    myAuthor,
    enemyId = "",
    selectedId = "",
    allowSelectedFallback = false,
  } = {}) {
    if (isPublic === true) return true;
    const mine =
      String(myAuthor || "").trim() !== "" &&
      String(enemyAuthor || "") === String(myAuthor || "");
    if (mine) return true;
    if (
      allowSelectedFallback &&
      String(enemyId || "") !== "" &&
      String(enemyId || "") === String(selectedId || "")
    ) {
      return true;
    }
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

  function getShared() {
    return globalScope.EnemiesShared || globalScope.NechronicaShared || sharedApi;
  }

  const sharedApi = {
    pad2,
    toFiniteInteger,
    clampInteger,
    nowText,
    nowIsoLocal,
    formatDateTime,
    normalizeTimingText,
    isRepeatableTiming,
    canUseUsedStatusForTiming,
    canUseUsedStatusForManeuver,
    escapeHtml,
    autoResizeTextarea,
    deepClone,
    normalizeApiUrl,
    buildApiUrl,
    fetchApiJson,
    getByPath,
    setByPath,
    moveRowByIndex,
    writeClipboardText,
    showToast,
    getMessage,
    requestSaveAsName,
    requestSaveAsSameNameAction,
    buildCopiedName,
    resolveReportCheckedOnDamageTransition,
    canViewEnemyByVisibility,
    getRememberedAuthorFromStorage,
    rememberAuthorToStorage,
    saveLastSelectedIdToStorage,
    getLastSelectedIdFromStorage,
    saveFile,
    getShared,
  };

  const merged = Object.assign(
    {},
    globalScope.NechronicaShared || {},
    globalScope.EnemiesShared || {},
    sharedApi,
  );

  globalScope.EnemiesShared = merged;
  globalScope.NechronicaShared = merged;
})(typeof window !== "undefined" ? window : globalThis);

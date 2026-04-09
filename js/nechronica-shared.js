(function attachNechronicaShared(globalScope) {
  const REPEATABLE_TIMINGS = new Set(["オート", "アクション"]);
  const toastTimers = new Map();
  const MESSAGE_TEMPLATES = Object.freeze({
    komaJsonCopySuccess:
      "ココフォリアコマ出力をコピーした！これを盤面でペーストだ！",
    clipboardCopyFailedConsole: "コピー失敗。コンソールに出力する",
    saveRequestSending: "保存要求を送信中…",
    saveAsInProgress: "別名保存中…",
    saveCompleted: "保存完了 {time}",
    saveAsPrompt: "別名保存する名前を入力してください",
    saveAsNameRequired: "保存名を入力してください",
  });

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

    // すでに表示中の場合は一度クラスを消して再表示（アニメーションのリセット）
    toast.classList.remove(showClass);
    void toast.offsetWidth; // reflow

    toast.textContent = text;
    toast.className = className; // クラスをリセット
    if (kind === "error") toast.classList.add(errorClass);

    toast.classList.add(showClass);

    const prevTimer = toastTimers.get(id);
    if (prevTimer) clearTimeout(prevTimer);

    const timer = setTimeout(() => {
      toast.classList.remove(showClass);
      toastTimers.delete(id);
    }, duration);

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
    normalizeTimingText,
    isRepeatableTiming,
    canUseUsedStatusForTiming,
    canUseUsedStatusForManeuver,
    writeClipboardText,
    showToast,
    getMessage,
    requestSaveAsName,
    resolveReportCheckedOnDamageTransition,
    saveFile,
  };

  globalScope.NechronicaShared = Object.assign(
    {},
    globalScope.NechronicaShared || {},
    shared,
  );
})(typeof window !== "undefined" ? window : globalThis);

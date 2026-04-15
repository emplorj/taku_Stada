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
    requestSaveAsSameNameAction,
    resolveReportCheckedOnDamageTransition,
    saveFile,
  };

  globalScope.NechronicaShared = Object.assign(
    {},
    globalScope.NechronicaShared || {},
    shared,
  );
})(typeof window !== "undefined" ? window : globalThis);

(function attachNechronicaShared(globalScope) {
  const REPEATABLE_TIMINGS = new Set(["オート", "アクション"]);
  const toastTimers = new Map();

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
      duration = 1400,
    } = opts || {};
    let toast = document.getElementById(id);
    if (!toast) {
      toast = document.createElement("div");
      toast.id = id;
      toast.className = className;
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.remove(errorClass, showClass);
    if (kind === "error") toast.classList.add(errorClass);
    void toast.offsetWidth;
    toast.classList.add(showClass);

    const prevTimer = toastTimers.get(id);
    if (prevTimer) clearTimeout(prevTimer);
    const timer = setTimeout(
      () => {
        toast.classList.remove(showClass);
        toastTimers.delete(id);
      },
      Number(duration) > 0 ? Number(duration) : 1400,
    );
    toastTimers.set(id, timer);
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

  const shared = {
    normalizeTimingText,
    isRepeatableTiming,
    canUseUsedStatusForTiming,
    canUseUsedStatusForManeuver,
    writeClipboardText,
    showToast,
    resolveReportCheckedOnDamageTransition,
  };

  globalScope.NechronicaShared = Object.assign(
    {},
    globalScope.NechronicaShared || {},
    shared,
  );
})(typeof window !== "undefined" ? window : globalThis);

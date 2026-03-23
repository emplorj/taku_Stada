const sheetForm = document.getElementById("sheetForm");
const submitButton = document.getElementById("submitButton");
const copyButton = document.getElementById("copyButton");
const itemSection = document.getElementById("itemSection");
const itemOutputHandArea = document.getElementById("itemOutputHand");
const itemOutputAjitoArea = document.getElementById("itemOutputAjito");
const itemOutputVehicleArea = document.getElementById("itemOutputVehicle");
const itemHeaderHand = document.getElementById("itemHeaderHand");
const itemHeaderAjito = document.getElementById("itemHeaderAjito");
const itemHeaderVehicle = document.getElementById("itemHeaderVehicle");
const copyItemHandButton = document.getElementById("copyItemHandButton");
const copyItemAjitoButton = document.getElementById("copyItemAjitoButton");
const copyItemVehicleButton = document.getElementById("copyItemVehicleButton");
const messageArea = document.getElementById("messageArea");
const outputArea = document.getElementById("output");
const loadingOverlay = document.getElementById("loading");
const progressBarContainer = document.getElementById("progressBarContainer");
const progressBar = document.getElementById("progressBar");
const plNameInput = document.getElementById("plName");
const nechronicaSection = document.getElementById("nechronicaSection");
const includeOutputNechronicaManeuverCheckbox = document.getElementById(
  "includeOutputNechronicaManeuver",
);
const includeOutputNechronicaBaseCheckbox = document.getElementById(
  "includeOutputNechronicaBase",
);
const includeNechronicaManeuverCheckbox = document.getElementById(
  "includeNechronicaManeuver",
);
const includeNechronicaBaseCheckbox = document.getElementById(
  "includeNechronicaBase",
);
const nechronicaPartEditor = document.getElementById("nechronicaPartEditor");
const nechronicaOutputArea = document.getElementById("nechronicaOutput");
const nechronicaKakeraTemplateArea = document.getElementById(
  "nechronicaKakeraTemplate",
);
const copyKakeraTemplateButton = document.getElementById(
  "copyKakeraTemplateButton",
);
const copyNechronicaButton = document.getElementById("copyNechronicaButton");
const usedToSafeAllButton = document.getElementById("usedToSafeAllButton");
const damageAllPartsButton = document.getElementById("damageAllPartsButton");
const safeAllPartsButton = document.getElementById("safeAllPartsButton");
const copyCheckedPartsButton = document.getElementById(
  "copyCheckedPartsButton",
);
const clearCheckedPartsButton = document.getElementById(
  "clearCheckedPartsButton",
);

let toastTimer = null;
let progressTimer = null;
let nechronicaEditorState = null;
let lastRawOutputText = "";
const DEFAULT_NECHRONICA_KAKERA_TEMPLATE =
  "【記憶のカケラ：初期】\n" +
  "「テキスト」\n" +
  "----------------------------------------------------------------------------\n" +
  "【記憶のカケラ：取得】";

function quoteKakeraTokensFromLine(line) {
  return String(line || "")
    .split(/[、,\/／|｜]+/)
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .map((x) => `「${x.replace(/[「」]/g, "")}」`)
    .join("");
}

function buildNechronicaKakeraTemplateFromBaseLines(baseLines) {
  const lines = Array.isArray(baseLines)
    ? baseLines.map((x) => String(x || ""))
    : [];
  if (!lines.length) return DEFAULT_NECHRONICA_KAKERA_TEMPLATE;

  const initialIdx = lines.findIndex((x) =>
    x.includes("【記憶のカケラ：初期】"),
  );
  const acquiredIdx = lines.findIndex((x) =>
    x.includes("【記憶のカケラ：取得】"),
  );
  if (initialIdx >= 0 && acquiredIdx >= 0 && acquiredIdx > initialIdx) {
    const picked = lines
      .slice(initialIdx, acquiredIdx + 2)
      .filter((x) => x.trim() !== "");
    if (picked.length >= 3) return picked.join("\n");
  }

  const oldIdx = lines.findIndex(
    (x) => String(x || "").trim() === "[記憶のカケラ]",
  );
  let initialQuoted = "「テキスト」";
  if (oldIdx >= 0) {
    const src = String(lines[oldIdx + 1] || "").trim();
    const q = quoteKakeraTokensFromLine(src);
    if (q) initialQuoted = q;
  }

  return (
    "【記憶のカケラ：初期】\n" +
    `${initialQuoted}\n` +
    "----------------------------------------------------------------------------\n" +
    "【記憶のカケラ：取得】"
  );
}

function getCurrentProgressValue() {
  if (!progressBar) return 0;
  const w = String(progressBar.style.width || "0").trim();
  const n = Number(w.replace("%", ""));
  return Number.isFinite(n) ? n : 0;
}

function setProgress(value, animated = true) {
  if (!progressBar) return;
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  progressBar.style.transition = animated ? "width 0.25s ease-out" : "none";
  progressBar.style.width = `${clamped}%`;
}

function setProgressAtLeast(value, animated = true) {
  const now = getCurrentProgressValue();
  if (value > now) setProgress(value, animated);
}

function startProgressTracking() {
  stopProgressTracking();
  setProgress(5, false);
  progressTimer = setInterval(() => {
    if (!loadingOverlay || loadingOverlay.style.display !== "flex") return;
    const now = getCurrentProgressValue();
    // 通信待ち中は 78% まで緩やかに進め、実処理完了時に一気に詰める。
    if (now < 78) setProgress(now + 1, true);
  }, 450);
}

function stopProgressTracking() {
  if (!progressTimer) return;
  clearInterval(progressTimer);
  progressTimer = null;
}

function showToast(message, kind = "info") {
  let toast = document.getElementById("copyToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "copyToast";
    toast.className = "copy-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.remove("is-error", "is-show");
  if (kind === "error") toast.classList.add("is-error");
  // reflow
  void toast.offsetWidth;
  toast.classList.add("is-show");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-show");
  }, 1400);
}

function copyTextWithToast(text, successMessage, emptyMessage = "") {
  const txt = String(text || "").trim();
  if (!txt) {
    if (emptyMessage) showToast(emptyMessage, "error");
    return;
  }
  navigator.clipboard
    .writeText(txt)
    .then(() => showToast(successMessage, "info"))
    .catch((err) => {
      showToast("コピーに失敗したようだ… ブラウザの権限を確認しろ！", "error");
      console.error("Clipboard copy failed: ", err);
    });
}

const PL_NAME_STORAGE_KEY = "komaMakerPlName";
const DEFAULT_VERCEL_API_BASES = ["https://taku-stada.vercel.app"];

if (plNameInput) {
  plNameInput.value = localStorage.getItem(PL_NAME_STORAGE_KEY) || "";
  plNameInput.addEventListener("input", () => {
    localStorage.setItem(PL_NAME_STORAGE_KEY, plNameInput.value || "");
  });
}

function getConfiguredApiBase() {
  const params = new URLSearchParams(window.location.search);
  const apiBaseFromQuery = params.get("apiBase");
  if (apiBaseFromQuery) {
    localStorage.setItem("komaMakerApiBase", apiBaseFromQuery);
  }

  const fromStorage = localStorage.getItem("komaMakerApiBase") || "";
  if (apiBaseFromQuery || fromStorage) {
    return apiBaseFromQuery || fromStorage;
  }

  // GitHub Pages では同一オリジン /api が存在しないため、
  // 既定の Vercel API を自動採用してクエリ指定を不要にする。
  if (window.location.hostname.endsWith("github.io")) {
    const fallback = DEFAULT_VERCEL_API_BASES[0] || "";
    if (fallback) localStorage.setItem("komaMakerApiBase", fallback);
    return fallback;
  }

  return "";
}

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || "").replace(/\/+$/, "");
}

function guessVercelApiBaseFromPath() {
  const parts = String(window.location.pathname || "")
    .split("/")
    .filter(Boolean);
  if (!parts.length) return "";
  const repoName = parts[0].toLowerCase().replace(/_/g, "-");
  if (!repoName) return "";
  return `https://${repoName}.vercel.app`;
}

function getApiCandidates() {
  const configuredBase = normalizeBaseUrl(getConfiguredApiBase());
  const guessedBase = normalizeBaseUrl(guessVercelApiBaseFromPath());
  const isGitHubPages = window.location.hostname.endsWith("github.io");
  const defaultBases = isGitHubPages
    ? DEFAULT_VERCEL_API_BASES.map(normalizeBaseUrl)
    : [];

  const externalCandidates = [
    configuredBase ? `${configuredBase}/api/koma-maker` : null,
    guessedBase ? `${guessedBase}/api/koma-maker` : null,
    ...defaultBases.map((b) => `${b}/api/koma-maker`),
  ].filter(Boolean);

  // GitHub Pages には同一オリジンの /api が存在しないため、
  // 405/404 ノイズを避けるために相対候補は出さない。
  const sameOriginCandidates = isGitHubPages
    ? []
    : [
        new URL("/api/koma-maker", window.location.origin).toString(),
        new URL("../api/koma-maker", window.location.href).toString(),
        new URL("./api/koma-maker", window.location.href).toString(),
      ];

  const candidates = [...externalCandidates, ...sameOriginCandidates];
  return [...new Set(candidates)];
}

async function postToKomaMakerApi(formData) {
  const endpoints = getApiCandidates();
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      setProgressAtLeast(18, true);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setProgressAtLeast(78, true);

      let data = null;
      try {
        data = await response.json();
        setProgressAtLeast(86, true);
      } catch (_) {}

      if (response.status === 404) {
        lastError = new Error(`APIエラー (HTTP 404): ${endpoint}`);
        continue;
      }

      if (!response.ok) {
        const message =
          data && data.message
            ? data.message
            : `APIエラー (HTTP ${response.status}): ${endpoint}`;
        throw new Error(message);
      }

      if (!data) throw new Error(`APIの応答がJSONではない: ${endpoint}`);
      setProgressAtLeast(90, true);
      return data;
    } catch (error) {
      lastError = error;
    }
  }
  const error = lastError || new Error("APIエンドポイントの解決に失敗した。");
  error.attemptedEndpoints = endpoints;
  throw error;
}

async function submitSheetData(formData) {
  try {
    return await postToKomaMakerApi(formData);
  } catch (e) {
    const attempted =
      e && e.attemptedEndpoints && e.attemptedEndpoints.length
        ? ` 試行先: ${e.attemptedEndpoints.join(" | ")}`
        : "";

    if (window.location.hostname.endsWith("github.io")) {
      const suggestedBase = normalizeBaseUrl(
        getConfiguredApiBase() ||
          guessVercelApiBaseFromPath() ||
          DEFAULT_VERCEL_API_BASES[0],
      );
      const helpUrl = new URL(window.location.href);
      if (suggestedBase) helpUrl.searchParams.set("apiBase", suggestedBase);

      throw new Error(
        "GitHub Pages 上では同一オリジンに /api が無いため、Vercel 側 API ベースURL指定が必要。" +
          ` 推奨: ${helpUrl.toString()}` +
          attempted,
      );
    }

    throw new Error("/api/koma-maker が動く環境で開いてくれ。" + attempted);
  }
}

copyButton.addEventListener("click", () => {
  const txt = outputArea.value;
  if (
    !txt ||
    txt === "ここに情報が出力される。よく見ておくんだな" ||
    txt.includes("エラー発生") ||
    txt.includes("対応していない")
  ) {
    showToast(
      "まだコピーできる内容が出力されていない、あるいはエラーのようだ！",
      "error",
    );
    return;
  }
  navigator.clipboard
    .writeText(txt)
    .then(() =>
      showToast(
        "コピーした！ これをココフォリアに持って行ってペーストだ！",
        "info",
      ),
    )
    .catch((err) => {
      showToast("コピーに失敗したようだ… ブラウザの権限を確認しろ！", "error");
      console.error("Clipboard copy failed: ", err);
    });
});

function setupItemCopyButton(button, textarea, emptyText, successMessage) {
  if (!button || !textarea) return;
  button.addEventListener("click", () => {
    const txt = textarea.value || "";
    if (!txt || txt === emptyText) {
      showToast("まだアイテム欄が出力されていないようだ！", "error");
      return;
    }
    navigator.clipboard
      .writeText(txt)
      .then(() => showToast(successMessage, "info"))
      .catch((err) => {
        showToast(
          "コピーに失敗したようだ… ブラウザの権限を確認しろ！",
          "error",
        );
        console.error("Clipboard copy failed: ", err);
      });
  });
}

function setItemSectionVisible(visible) {
  if (!itemSection) return;
  itemSection.style.display = visible ? "block" : "none";
}

function setNechronicaSectionVisible(visible) {
  if (!nechronicaSection) return;
  nechronicaSection.style.display = visible ? "block" : "none";
}

function resetNechronicaSection() {
  nechronicaEditorState = null;
  if (includeOutputNechronicaManeuverCheckbox)
    includeOutputNechronicaManeuverCheckbox.checked = false;
  if (includeOutputNechronicaBaseCheckbox)
    includeOutputNechronicaBaseCheckbox.checked = true;
  if (includeNechronicaManeuverCheckbox)
    includeNechronicaManeuverCheckbox.checked = true;
  if (includeNechronicaBaseCheckbox)
    includeNechronicaBaseCheckbox.checked = true;
  if (nechronicaKakeraTemplateArea) {
    nechronicaKakeraTemplateArea.value = DEFAULT_NECHRONICA_KAKERA_TEMPLATE;
  }
  if (nechronicaPartEditor) {
    nechronicaPartEditor.innerHTML = "";
  }
  if (nechronicaOutputArea) {
    nechronicaOutputArea.value =
      "ここにネクロニカ用の引用テキストが出力される。";
  }
  if (copyNechronicaButton) copyNechronicaButton.disabled = true;
  if (usedToSafeAllButton) usedToSafeAllButton.disabled = true;
  if (damageAllPartsButton) damageAllPartsButton.disabled = true;
  if (safeAllPartsButton) safeAllPartsButton.disabled = true;
  if (copyCheckedPartsButton) copyCheckedPartsButton.disabled = true;
  if (clearCheckedPartsButton) clearCheckedPartsButton.disabled = true;
  lastRawOutputText = "";
}

function getNechronicaKakeraTemplateLines() {
  const raw = nechronicaKakeraTemplateArea
    ? String(nechronicaKakeraTemplateArea.value || "")
    : "";
  const src = raw.trim() || DEFAULT_NECHRONICA_KAKERA_TEMPLATE;
  return src.split(/\r?\n/).map((line) => String(line || "").trimEnd());
}

function overwriteNechronicaKakeraInBaseLines(baseLines) {
  const lines = Array.isArray(baseLines) ? baseLines.slice() : [];
  if (!lines.length) return lines;
  const startIdx = lines.findIndex((line) => {
    const t = String(line || "").trim();
    return t === "[記憶のカケラ]" || t.startsWith("【記憶のカケラ");
  });

  const templateLines = getNechronicaKakeraTemplateLines();
  if (startIdx < 0) return [...lines, ...templateLines];
  return [...lines.slice(0, startIdx), ...templateLines];
}

function isNechronicaLegendLine(line) {
  const s = String(line || "").trim();
  if (!s) return false;
  return (
    s.includes("無事：⭕") &&
    s.includes("損傷：❌") &&
    (s.includes("使用：✅") ||
      s.includes("使用：⭕") ||
      s.includes("未使用：🟩"))
  );
}

function parseNechronicaMemo(memo) {
  const lines = String(memo || "").split(/\r?\n/);
  const legendIndex = lines.findIndex((line) => isNechronicaLegendLine(line));
  if (legendIndex < 0) return null;

  const baseIndex = lines.findIndex(
    (line, idx) =>
      idx >= legendIndex && String(line || "").trim() === "基礎データ:",
  );

  const quoteLinesRaw =
    baseIndex >= 0
      ? lines.slice(legendIndex, baseIndex)
      : lines.slice(legendIndex);
  const quoteLines = quoteLinesRaw.filter(
    (line) => String(line || "").trim() !== "",
  );
  if (!quoteLines.length) return null;

  const legend = quoteLines[0];
  const items = [];
  const sectionHeaders = new Set(["👧頭", "💪腕", "🧍胴", "🦵脚"]);
  const stateMarks = ["🟩", "✅", "⭕", "❌"];
  let currentSection = "class";
  const sanitizeNechronicaBody = (text) => {
    const raw = String(text || "").trim();
    const idx = raw.indexOf("【");
    if (idx >= 0) return raw.slice(idx).replace(/~/g, "～");
    return raw.replace(/^[�\uFFFD]+/, "");
  };
  const normalizeStateMark = (state, allowDamage) => {
    const s = String(state || "").trim();
    const defaultState = allowDamage ? "⭕" : "🟩";
    if (["🟩", "✅", "⭕", "❌"].includes(s)) {
      if (!allowDamage && s === "❌") return "✅";
      if (!allowDamage && s === "⭕") return "🟩";
      if (allowDamage && s === "🟩") return "⭕";
      return s;
    }
    if (s.includes("✅")) return "✅";
    if (s.includes("⭕")) return allowDamage ? "⭕" : "🟩";
    if (allowDamage && s.includes("❌")) return "❌";
    if (s.includes("🟩")) return allowDamage ? "⭕" : "🟩";
    return defaultState;
  };

  for (let i = 1; i < quoteLines.length; i++) {
    const line = String(quoteLines[i] || "").trim();
    const normalizedLine = line
      .replace(/^\uFEFF+/, "")
      .replace(/^[�\uFFFD]+(?=【)/, "🟩");
    if (!line) continue;
    if (sectionHeaders.has(line)) {
      items.push({ type: "header", text: line });
      currentSection = line;
      continue;
    }
    if (/^【マニューバ名】/.test(normalizedLine)) {
      items.push({ type: "header", text: normalizedLine });
      continue;
    }
    const m = normalizedLine.match(/^([🟩✅⭕❌])\s*(.+)$/);
    if (m) {
      const allowDamage = currentSection !== "class";
      const state = normalizeStateMark(m[1], allowDamage);
      const sanitizedBody = sanitizeNechronicaBody(m[2]);
      items.push({
        type: "row",
        state,
        body: sanitizedBody,
        allowDamage,
        section: currentSection,
        reportChecked: false,
      });
      continue;
    }
    // 想定外フォーマットでも行を失わないよう固定状態で保持。
    const fallbackState =
      stateMarks.find((mark) => normalizedLine.startsWith(mark)) ||
      (currentSection === "class" ? "🟩" : "⭕");
    const body = sanitizeNechronicaBody(
      normalizedLine.replace(/^[🟩✅⭕❌]\s*/, ""),
    );
    const allowDamage = currentSection !== "class";
    items.push({
      type: "row",
      state: normalizeStateMark(fallbackState, allowDamage),
      body,
      allowDamage,
      section: currentSection,
      reportChecked: false,
    });
  }

  const baseLines =
    baseIndex >= 0
      ? lines
          .slice(baseIndex)
          .filter((line) => String(line || "").trim() !== "")
      : [];

  return { legend, items, baseLines };
}

function buildNechronicaMemoFromParsed(
  parsedMemo,
  includeManeuver = true,
  includeBase = true,
) {
  if (!parsedMemo || !Array.isArray(parsedMemo.items)) return "";
  const lines = [];
  if (includeManeuver) {
    lines.push(parsedMemo.legend || "");
    parsedMemo.items.forEach((item) => {
      if (item.type === "header") lines.push(item.text || "");
      else lines.push(`${item.state || "⭕"}${item.body || ""}`);
    });
  }
  if (
    includeBase &&
    Array.isArray(parsedMemo.baseLines) &&
    parsedMemo.baseLines.length
  ) {
    if (lines.length) lines.push("");
    lines.push(...parsedMemo.baseLines);
  }
  return lines.join("\n").trim();
}

function stripKakeraFromBaseLines(baseLines) {
  const lines = Array.isArray(baseLines) ? baseLines.slice() : [];
  if (!lines.length) return lines;

  const startIdx = lines.findIndex((line) => {
    const t = String(line || "").trim();
    return (
      t === "[記憶のカケラ]" ||
      t.startsWith("【記憶のカケラ：初期】") ||
      t.startsWith("【記憶のカケラ：取得】")
    );
  });
  if (startIdx < 0) return lines;
  return lines.slice(0, startIdx).filter((x) => String(x || "").trim() !== "");
}

function applyNechronicaOutputDisplayFilter(rawOutText) {
  let parsedOut = null;
  try {
    parsedOut = JSON.parse(String(rawOutText || ""));
  } catch (_) {
    return String(rawOutText || "");
  }
  if (!parsedOut || !parsedOut.data) return String(rawOutText || "");

  const memo = String(parsedOut.data.memo || "");
  const parsedMemo = parseNechronicaMemo(memo);
  if (!parsedMemo) return String(rawOutText || "");

  const includeManeuver = !!(
    includeOutputNechronicaManeuverCheckbox &&
    includeOutputNechronicaManeuverCheckbox.checked
  );
  const includeBase = !!(
    includeOutputNechronicaBaseCheckbox &&
    includeOutputNechronicaBaseCheckbox.checked
  );
  const baseLinesForOutput = stripKakeraFromBaseLines(parsedMemo.baseLines);
  parsedOut.data.memo = buildNechronicaMemoFromParsed(
    { ...parsedMemo, baseLines: baseLinesForOutput },
    includeManeuver,
    includeBase,
  );
  return JSON.stringify(parsedOut);
}

function renderNechronicaEditor() {
  if (!nechronicaPartEditor) return;
  nechronicaPartEditor.innerHTML = "";
  if (!nechronicaEditorState || !Array.isArray(nechronicaEditorState.items))
    return;

  const stateOptions = [
    { mark: "🟩", label: "未使用" },
    { mark: "✅", label: "使用" },
    { mark: "⭕", label: "無事" },
    { mark: "❌", label: "損傷" },
  ];
  const getTimingFromBody = (body) => {
    const m = String(body || "").match(/《\s*([^/\s]*)\s*\//);
    return m && m[1] ? String(m[1]).trim() : "";
  };
  const isRepeatableTiming = (body) => {
    const timing = getTimingFromBody(body);
    return timing === "オート" || timing === "アクション";
  };
  let rowIndex = -1;

  nechronicaEditorState.items.forEach((item) => {
    if (item.type === "header") {
      const h = document.createElement("div");
      h.className = "nechronica-part-header";
      const title = document.createElement("span");
      title.className = "nechronica-part-header-title";
      title.textContent = item.text;
      h.appendChild(title);

      if (["👧頭", "💪腕", "🧍胴", "🦵脚"].includes(String(item.text || ""))) {
        const actions = document.createElement("span");
        actions.className = "nechronica-part-header-actions";

        const dmgBtn = document.createElement("button");
        dmgBtn.type = "button";
        dmgBtn.className = "hoha nechronica-mini-btn nechronica-header-action";
        dmgBtn.textContent = "損傷";
        dmgBtn.dataset.section = item.text;
        dmgBtn.dataset.mark = "❌";

        const safeBtn = document.createElement("button");
        safeBtn.type = "button";
        safeBtn.className = "hoha nechronica-mini-btn nechronica-header-action";
        safeBtn.textContent = "無事";
        safeBtn.dataset.section = item.text;
        safeBtn.dataset.mark = "⭕";

        actions.appendChild(dmgBtn);
        actions.appendChild(safeBtn);
        h.appendChild(actions);
      }

      nechronicaPartEditor.appendChild(h);
      return;
    }

    rowIndex += 1;
    const row = document.createElement("div");
    row.className = "nechronica-part-row";

    const reportCheck = document.createElement("input");
    reportCheck.type = "checkbox";
    reportCheck.className = "nechronica-report-check";
    reportCheck.dataset.rowIndex = String(rowIndex);
    reportCheck.checked = !!item.reportChecked;
    reportCheck.disabled = !item.allowDamage;

    const select = document.createElement("select");
    select.className = "nechronica-state-select status-select";
    select.dataset.rowIndex = String(rowIndex);
    const repeatable = isRepeatableTiming(item.body);
    const availableStates = item.allowDamage
      ? repeatable
        ? stateOptions.filter((x) => x.mark === "⭕" || x.mark === "❌")
        : stateOptions.filter((x) => x.mark !== "🟩")
      : repeatable
        ? stateOptions.filter((x) => x.mark === "🟩")
        : stateOptions.filter((x) => x.mark === "🟩" || x.mark === "✅");
    if (!availableStates.some((x) => x.mark === item.state)) {
      item.state = item.allowDamage ? "⭕" : "🟩";
    }
    availableStates.forEach((state) => {
      const opt = document.createElement("option");
      opt.value = state.mark;
      opt.textContent = state.label;
      if (state.mark === item.state) opt.selected = true;
      select.appendChild(opt);
    });
    syncNechronicaStateSelectClass(select);

    const text = document.createElement("span");
    text.className = "nechronica-part-text";
    text.textContent = item.body;

    const copyLineButton = document.createElement("button");
    copyLineButton.type = "button";
    copyLineButton.className = "nechronica-line-copy-btn";
    copyLineButton.dataset.rowIndex = String(rowIndex);
    copyLineButton.textContent = "⧉";
    copyLineButton.title = "この行をコピー";
    copyLineButton.disabled = !item.allowDamage;

    row.appendChild(reportCheck);
    row.appendChild(select);
    row.appendChild(text);
    row.appendChild(copyLineButton);
    nechronicaPartEditor.appendChild(row);
  });
}

function syncNechronicaStateSelectClass(selectEl) {
  if (!(selectEl instanceof HTMLSelectElement)) return;
  selectEl.classList.remove(
    "status-unused",
    "status-safe",
    "status-used",
    "status-damaged",
  );
  const v = String(selectEl.value || "");
  if (v === "🟩") {
    selectEl.classList.add("status-unused");
    return;
  }
  if (v === "⭕") {
    selectEl.classList.add("status-safe");
    return;
  }
  if (v === "✅") {
    selectEl.classList.add("status-used");
    return;
  }
  if (v === "❌") {
    selectEl.classList.add("status-damaged");
  }
}

function renderNechronicaQuoteOutput() {
  if (!nechronicaOutputArea) return;
  if (!nechronicaEditorState) {
    nechronicaOutputArea.value =
      "ここにネクロニカ用の引用テキストが出力される。";
    if (copyNechronicaButton) copyNechronicaButton.disabled = true;
    return;
  }

  const bodyLines = nechronicaEditorState.items.map((item) => {
    if (item.type === "header") return item.text;
    const state = item.allowDamage
      ? item.state
      : item.state === "❌"
        ? "✅"
        : item.state;
    return `${state}${item.body}`;
  });

  const includeBase = !!(
    includeNechronicaBaseCheckbox && includeNechronicaBaseCheckbox.checked
  );
  const includeManeuver = !!(
    includeNechronicaManeuverCheckbox &&
    includeNechronicaManeuverCheckbox.checked
  );
  const lines = [];
  if (includeManeuver) {
    lines.push(nechronicaEditorState.legend, ...bodyLines);
  }
  if (includeBase && nechronicaEditorState.baseLines.length) {
    if (lines.length) lines.push("");
    lines.push(
      ...overwriteNechronicaKakeraInBaseLines(nechronicaEditorState.baseLines),
    );
  }

  nechronicaOutputArea.value = lines.join("\n").trim();
  if (copyNechronicaButton)
    copyNechronicaButton.disabled = !nechronicaOutputArea.value;
  const hasPartRows = !!(
    nechronicaEditorState &&
    Array.isArray(nechronicaEditorState.items) &&
    nechronicaEditorState.items.some((x) => x.type === "row" && x.allowDamage)
  );
  const hasUsedRows = !!(
    nechronicaEditorState &&
    Array.isArray(nechronicaEditorState.items) &&
    nechronicaEditorState.items.some(
      (x) => x.type === "row" && x.state === "✅",
    )
  );
  if (usedToSafeAllButton) usedToSafeAllButton.disabled = !hasUsedRows;
  if (damageAllPartsButton) damageAllPartsButton.disabled = !hasPartRows;
  if (safeAllPartsButton) safeAllPartsButton.disabled = !hasPartRows;
  const hasCheckedRows = !!(
    nechronicaEditorState &&
    Array.isArray(nechronicaEditorState.items) &&
    nechronicaEditorState.items.some(
      (x) => x.type === "row" && x.allowDamage && x.reportChecked,
    )
  );
  if (copyCheckedPartsButton) copyCheckedPartsButton.disabled = !hasCheckedRows;
  if (clearCheckedPartsButton)
    clearCheckedPartsButton.disabled = !hasCheckedRows;
}

function setNechronicaStatesForAllParts(mark) {
  if (!nechronicaEditorState || !Array.isArray(nechronicaEditorState.items))
    return;
  nechronicaEditorState.items.forEach((item) => {
    if (item.type !== "row") return;
    if (!item.allowDamage) return;
    item.state = mark;
  });
  renderNechronicaEditor();
  renderNechronicaQuoteOutput();
}

function setNechronicaStatesForPart(sectionLabel, mark) {
  if (!nechronicaEditorState || !Array.isArray(nechronicaEditorState.items))
    return;
  nechronicaEditorState.items.forEach((item) => {
    if (item.type !== "row") return;
    if (!item.allowDamage) return;
    if (String(item.section || "") !== String(sectionLabel || "")) return;
    item.state = mark;
  });
  renderNechronicaEditor();
  renderNechronicaQuoteOutput();
}

function setNechronicaUsedToSafeForPart(sectionLabel) {
  if (!nechronicaEditorState || !Array.isArray(nechronicaEditorState.items))
    return;
  nechronicaEditorState.items.forEach((item) => {
    if (item.type !== "row") return;
    if (!item.allowDamage) return;
    if (String(item.section || "") !== String(sectionLabel || "")) return;
    if (item.state === "✅") item.state = "⭕";
  });
  renderNechronicaEditor();
  renderNechronicaQuoteOutput();
}

function setNechronicaUsedToSafeForAll() {
  if (!nechronicaEditorState || !Array.isArray(nechronicaEditorState.items))
    return;
  nechronicaEditorState.items.forEach((item) => {
    if (item.type !== "row") return;
    if (!item.allowDamage) return;
    if (item.state === "✅") item.state = "⭕";
  });
  renderNechronicaEditor();
  renderNechronicaQuoteOutput();
}

function fillNechronicaSectionFromOutput(rawText) {
  let parsed = null;
  try {
    parsed = JSON.parse(String(rawText || ""));
  } catch (_) {
    parsed = null;
  }

  const memo = String(
    parsed && parsed.data && parsed.data.memo ? parsed.data.memo : "",
  );
  const externalUrl = String(
    parsed && parsed.data && parsed.data.externalUrl
      ? parsed.data.externalUrl
      : "",
  );
  const isNechronica =
    /nechro|nechronica/i.test(externalUrl) ||
    isNechronicaLegendLine(memo) ||
    (memo.includes("【マニューバ名】") && memo.includes("損傷：❌"));

  if (!isNechronica) {
    setNechronicaSectionVisible(false);
    resetNechronicaSection();
    return;
  }

  const parsedMemo = parseNechronicaMemo(memo);
  if (!parsedMemo) {
    setNechronicaSectionVisible(false);
    resetNechronicaSection();
    return;
  }

  nechronicaEditorState = parsedMemo;
  if (nechronicaKakeraTemplateArea) {
    nechronicaKakeraTemplateArea.value =
      buildNechronicaKakeraTemplateFromBaseLines(parsedMemo.baseLines);
  }
  if (includeNechronicaBaseCheckbox)
    includeNechronicaBaseCheckbox.checked = true;
  if (includeNechronicaManeuverCheckbox)
    includeNechronicaManeuverCheckbox.checked = true;
  renderNechronicaEditor();
  renderNechronicaQuoteOutput();
  setNechronicaSectionVisible(true);
}

function setItemHeader(el, title, current = null, max = null) {
  if (!el) return;
  if (current === null || max === null) {
    el.textContent = title;
    return;
  }
  const c = Number.isFinite(Number(current)) ? Number(current) : 0;
  const m = Number.isFinite(Number(max)) ? Number(max) : 0;
  const isOver = c > m;
  el.innerHTML = `<span class="item-title">${title}</span><span class="item-count${isOver ? " is-over" : ""}">${c} / ${m}${isOver ? " ⚠" : ""}</span>`;
}

function resetItemSection() {
  setItemHeader(itemHeaderHand, "手持ち");
  setItemHeader(itemHeaderAjito, "アジト");
  setItemHeader(itemHeaderVehicle, "乗り物");
  if (itemOutputHandArea)
    itemOutputHandArea.value = "ここに手持ちアイテムが出力される。";
  if (itemOutputAjitoArea)
    itemOutputAjitoArea.value = "ここにアジトアイテムが出力される。";
  if (itemOutputVehicleArea)
    itemOutputVehicleArea.value = "ここに乗り物アイテムが出力される。";
  if (copyItemHandButton) copyItemHandButton.disabled = true;
  if (copyItemAjitoButton) copyItemAjitoButton.disabled = true;
  if (copyItemVehicleButton) copyItemVehicleButton.disabled = true;
}

function parseItemSectionsFromMemo(memo) {
  const out = { hand: [], ajito: [], vehicle: [] };
  const lines = String(memo || "").split(/\r?\n/);
  let current = "";
  for (const raw of lines) {
    const line = String(raw || "").trim();
    if (line === "◆手持ちのアイテム") {
      current = "hand";
      continue;
    }
    if (line === "◆アジトのアイテム") {
      current = "ajito";
      continue;
    }
    if (line === "◆乗り物のアイテム") {
      current = "vehicle";
      continue;
    }
    if (!current) continue;
    if (!line) continue;
    if (line.startsWith("◆")) {
      current = "";
      continue;
    }
    if (line.startsWith("・")) {
      out[current].push(line);
      continue;
    }
    current = "";
  }
  return out;
}

function fillItemSectionFromOutput(
  rawText,
  itemLimits = null,
  itemSectionsFromApi = null,
) {
  let memo = "";
  let isSatasupe = false;
  try {
    const outObj = JSON.parse(String(rawText || ""));
    memo = String(
      outObj && outObj.data && outObj.data.memo ? outObj.data.memo : "",
    );
    const externalUrl = String(
      outObj && outObj.data && outObj.data.externalUrl
        ? outObj.data.externalUrl
        : "",
    );
    isSatasupe = /satasupe|appspot\.com/i.test(externalUrl);
  } catch (_) {
    memo = "";
    isSatasupe = false;
  }

  if (!isSatasupe) {
    setItemSectionVisible(false);
    resetItemSection();
    return;
  }

  const sections =
    itemSectionsFromApi && typeof itemSectionsFromApi === "object"
      ? {
          hand: Array.isArray(itemSectionsFromApi.hand)
            ? itemSectionsFromApi.hand.map((x) => `・${String(x || "")}`)
            : [],
          ajito: Array.isArray(itemSectionsFromApi.ajito)
            ? itemSectionsFromApi.ajito.map((x) => `・${String(x || "")}`)
            : [],
          vehicle: Array.isArray(itemSectionsFromApi.vehicle)
            ? itemSectionsFromApi.vehicle.map((x) => `・${String(x || "")}`)
            : [],
        }
      : parseItemSectionsFromMemo(memo);

  const countFilled = (arr) =>
    (Array.isArray(arr) ? arr : []).filter(
      (x) => String(x || "").trim() !== "・",
    ).length;
  const handCurrent = countFilled(sections.hand);
  const ajitoCurrent = countFilled(sections.ajito);
  const vehicleCurrent = countFilled(sections.vehicle);

  const outObj = (() => {
    try {
      return JSON.parse(String(rawText || ""));
    } catch (_) {
      return null;
    }
  })();
  const handMax = Math.max(0, Number(itemLimits && itemLimits.handMax) || 0);
  const ajitoMax = Math.max(0, Number(itemLimits && itemLimits.ajitoMax) || 10);
  const vehicleMax = Math.max(
    0,
    Number(itemLimits && itemLimits.vehicleMax) || 0,
  );

  const withSlots = (arr, max) => {
    const base = Array.isArray(arr) ? arr.slice() : [];
    const remain = Math.max(0, Number(max) - base.length);
    for (let i = 0; i < remain; i++) base.push("・");
    return base;
  };

  const handLines = withSlots(sections.hand, handMax);
  const ajitoLines = withSlots(sections.ajito, ajitoMax);
  const vehicleLines = withSlots(sections.vehicle, vehicleMax);

  setItemHeader(itemHeaderHand, "手持ち", handCurrent, handMax);
  setItemHeader(itemHeaderAjito, "アジト", ajitoCurrent, ajitoMax);
  setItemHeader(itemHeaderVehicle, "乗り物", vehicleCurrent, vehicleMax);

  const sectionTexts = {
    hand: ["◆手持ちのアイテム", ...handLines].join("\n").trim(),
    ajito: ["◆アジトのアイテム", ...ajitoLines].join("\n").trim(),
    vehicle: ["◆乗り物のアイテム", ...vehicleLines].join("\n").trim(),
  };
  if (itemOutputHandArea) itemOutputHandArea.value = sectionTexts.hand;
  if (itemOutputAjitoArea) itemOutputAjitoArea.value = sectionTexts.ajito;
  if (itemOutputVehicleArea) itemOutputVehicleArea.value = sectionTexts.vehicle;

  if (copyItemHandButton) copyItemHandButton.disabled = false;
  if (copyItemAjitoButton) copyItemAjitoButton.disabled = false;
  if (copyItemVehicleButton) copyItemVehicleButton.disabled = false;

  setItemSectionVisible(true);
}

setupItemCopyButton(
  copyItemHandButton,
  itemOutputHandArea,
  "ここに手持ちアイテムが出力される。",
  "手持ちアイテムをコピーした！",
);
setupItemCopyButton(
  copyItemAjitoButton,
  itemOutputAjitoArea,
  "ここにアジトアイテムが出力される。",
  "アジトアイテムをコピーした！",
);
setupItemCopyButton(
  copyItemVehicleButton,
  itemOutputVehicleArea,
  "ここに乗り物アイテムが出力される。",
  "乗り物アイテムをコピーした！",
);

if (itemSection) {
  setItemSectionVisible(false);
  resetItemSection();
}

if (nechronicaPartEditor) {
  nechronicaPartEditor.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    if (target.classList.contains("nechronica-line-copy-btn")) {
      if (!nechronicaEditorState || !Array.isArray(nechronicaEditorState.items))
        return;
      const rowIndex = Number(target.dataset.rowIndex || "-1");
      if (!Number.isInteger(rowIndex) || rowIndex < 0) return;
      let currentRow = -1;
      for (const item of nechronicaEditorState.items) {
        if (item.type !== "row") continue;
        currentRow += 1;
        if (currentRow !== rowIndex) continue;
        copyTextWithToast(
          `${item.state || "⭕"}${item.body || ""}`,
          "行をコピーした！",
        );
        break;
      }
      return;
    }
    if (!target.classList.contains("nechronica-header-action")) return;
    setNechronicaStatesForPart(
      target.dataset.section || "",
      target.dataset.mark || "⭕",
    );
  });

  nechronicaPartEditor.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (!target.classList.contains("nechronica-state-select")) return;
    if (!nechronicaEditorState || !Array.isArray(nechronicaEditorState.items))
      return;

    const rowIndex = Number(target.dataset.rowIndex || "-1");
    if (!Number.isInteger(rowIndex) || rowIndex < 0) return;
    syncNechronicaStateSelectClass(target);

    let currentRow = -1;
    for (const item of nechronicaEditorState.items) {
      if (item.type !== "row") continue;
      currentRow += 1;
      if (currentRow !== rowIndex) continue;
      item.state = target.value;
      break;
    }
    renderNechronicaQuoteOutput();
  });

  nechronicaPartEditor.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.classList.contains("nechronica-report-check")) return;
    if (!nechronicaEditorState || !Array.isArray(nechronicaEditorState.items))
      return;
    const rowIndex = Number(target.dataset.rowIndex || "-1");
    if (!Number.isInteger(rowIndex) || rowIndex < 0) return;
    let currentRow = -1;
    for (const item of nechronicaEditorState.items) {
      if (item.type !== "row") continue;
      currentRow += 1;
      if (currentRow !== rowIndex) continue;
      item.reportChecked = !!target.checked;
      break;
    }
    renderNechronicaQuoteOutput();
  });
}

if (includeNechronicaManeuverCheckbox) {
  includeNechronicaManeuverCheckbox.addEventListener("change", () => {
    renderNechronicaQuoteOutput();
  });
}

if (includeOutputNechronicaManeuverCheckbox) {
  includeOutputNechronicaManeuverCheckbox.addEventListener("change", () => {
    outputArea.value = applyNechronicaOutputDisplayFilter(
      lastRawOutputText || "",
    );
  });
}

if (includeOutputNechronicaBaseCheckbox) {
  includeOutputNechronicaBaseCheckbox.addEventListener("change", () => {
    outputArea.value = applyNechronicaOutputDisplayFilter(
      lastRawOutputText || "",
    );
  });
}

if (includeNechronicaBaseCheckbox) {
  includeNechronicaBaseCheckbox.addEventListener("change", () => {
    renderNechronicaQuoteOutput();
  });
}

if (nechronicaKakeraTemplateArea) {
  nechronicaKakeraTemplateArea.addEventListener("input", () => {
    renderNechronicaQuoteOutput();
  });
}

if (copyNechronicaButton && nechronicaOutputArea) {
  copyNechronicaButton.addEventListener("click", () => {
    const txt = nechronicaOutputArea.value || "";
    if (!txt || txt === "ここにネクロニカ用の引用テキストが出力される。") {
      showToast("ネクロニカ引用ボックスがまだ生成されていない！", "error");
      return;
    }
    navigator.clipboard
      .writeText(txt)
      .then(() => showToast("ネクロニカ引用ボックスをコピーした！", "info"))
      .catch((err) => {
        showToast(
          "コピーに失敗したようだ… ブラウザの権限を確認しろ！",
          "error",
        );
        console.error("Clipboard copy failed: ", err);
      });
  });
}

if (copyKakeraTemplateButton && nechronicaKakeraTemplateArea) {
  copyKakeraTemplateButton.addEventListener("click", () => {
    const txt = String(nechronicaKakeraTemplateArea.value || "").trim();
    if (!txt) {
      showToast("記憶のカケラテンプレが空だ！", "error");
      return;
    }
    navigator.clipboard
      .writeText(txt)
      .then(() => showToast("記憶のカケラテンプレをコピーした！", "info"))
      .catch((err) => {
        showToast(
          "コピーに失敗したようだ… ブラウザの権限を確認しろ！",
          "error",
        );
        console.error("Clipboard copy failed: ", err);
      });
  });
}

if (damageAllPartsButton) {
  damageAllPartsButton.addEventListener("click", () => {
    setNechronicaStatesForAllParts("❌");
  });
}

if (usedToSafeAllButton) {
  usedToSafeAllButton.addEventListener("click", () => {
    setNechronicaUsedToSafeForAll();
  });
}

if (safeAllPartsButton) {
  safeAllPartsButton.addEventListener("click", () => {
    setNechronicaStatesForAllParts("⭕");
  });
}

if (copyCheckedPartsButton) {
  copyCheckedPartsButton.addEventListener("click", () => {
    if (!nechronicaEditorState || !Array.isArray(nechronicaEditorState.items))
      return;
    const lines = nechronicaEditorState.items
      .filter(
        (item) => item.type === "row" && item.allowDamage && item.reportChecked,
      )
      .map((item) => `${item.state || "⭕"}${item.body || ""}`);
    copyTextWithToast(
      lines.join("\n"),
      "チェック項目をコピーした！",
      "コピー対象が選ばれていないようだ！",
    );
  });
}

if (clearCheckedPartsButton) {
  clearCheckedPartsButton.addEventListener("click", () => {
    if (!nechronicaEditorState || !Array.isArray(nechronicaEditorState.items))
      return;
    nechronicaEditorState.items.forEach((item) => {
      if (item.type !== "row") return;
      item.reportChecked = false;
    });
    renderNechronicaEditor();
    renderNechronicaQuoteOutput();
  });
}

if (nechronicaSection) {
  setNechronicaSectionVisible(false);
  resetNechronicaSection();
}

sheetForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const sheetUrlValue = document.getElementById("sheetUrl").value.toLowerCase();

  submitButton.disabled = true;
  copyButton.disabled = true;
  if (itemSection) {
    setItemSectionVisible(false);
    resetItemSection();
  }
  if (nechronicaSection) {
    setNechronicaSectionVisible(false);
    resetNechronicaSection();
  }
  stopProgressTracking();
  setProgress(0, false);
  loadingOverlay.style.display = "flex";
  startProgressTracking();
  setProgressAtLeast(10, true);

  messageArea.textContent = "処理を開始する…";
  outputArea.value = "";

  const formData = {
    sheet: document.getElementById("sheetUrl").value,
    img: document.getElementById("imgUrl").value,
    plName: plNameInput ? plNameInput.value : "",
    nomemo: document.getElementById("noMemo").checked.toString(),
    nochp: document.getElementById("noChp").checked.toString(),
    useComboPalette: "false",
  };

  submitSheetData(formData)
    .then(async (result) => {
      setProgressAtLeast(92, true);
      if (result && result.comboFound) {
        const yes = window.confirm(
          "コンボデータが見つかりました！コンボデータを反映させますか？",
        );
        if (yes) {
          setProgress(25, false);
          formData.useComboPalette = "true";
          const resultWithCombo = await submitSheetData(formData);
          setProgressAtLeast(92, true);
          updatePage(resultWithCombo);
          return;
        }
      }
      updatePage(result);
    })
    .catch(showError);
});

function updatePage(result) {
  const hideMemoDisplay = !!(document.getElementById("hideMemoDisplay") || {})
    .checked;

  let renderedOut = "出力の受信に失敗した。";
  if (result && Object.prototype.hasOwnProperty.call(result, "out")) {
    const outRaw = result.out;
    if (typeof outRaw === "string") {
      renderedOut = outRaw;
    } else if (outRaw && typeof outRaw === "object") {
      try {
        renderedOut = JSON.stringify(outRaw);
      } catch (_e) {
        renderedOut = String(outRaw);
      }
    } else if (outRaw != null) {
      renderedOut = String(outRaw);
    }
  }
  if (hideMemoDisplay) {
    try {
      const parsed = JSON.parse(renderedOut);
      if (
        parsed &&
        parsed.data &&
        Object.prototype.hasOwnProperty.call(parsed.data, "memo")
      ) {
        const memoText = String(parsed.data.memo || "");
        const lines = memoText.split(/\r?\n/);
        const tailDelimiterIndex = lines.lastIndexOf("───");
        if (tailDelimiterIndex > 0) {
          let blankStart = -1;
          for (let i = tailDelimiterIndex - 1; i >= 0; i--) {
            if (String(lines[i] || "").trim() === "") {
              blankStart = i;
              break;
            }
          }
          if (blankStart >= 0) {
            const keep = lines.slice(0, blankStart);
            keep.push("───");
            parsed.data.memo = keep.join("\n");
          }
        }
        renderedOut = JSON.stringify(parsed);
      }
    } catch (_) {}
  }

  setProgressAtLeast(95, true);
  messageArea.textContent = result.message || "メッセージの受信に失敗した。";
  lastRawOutputText = renderedOut;
  outputArea.value = applyNechronicaOutputDisplayFilter(lastRawOutputText);

  // セクション解析は表示フィルタ適用前の生データを使う。
  // （表示側チェックがOFFでも、ネクロニカ/アイテムの下部UIは維持するため）
  const sectionSourceText = lastRawOutputText || outputArea.value || "";

  fillItemSectionFromOutput(
    sectionSourceText,
    result && result.itemLimits,
    result && result.itemSections,
  );
  fillNechronicaSectionFromOutput(sectionSourceText);

  const txt = outputArea.value || "";
  const canCopy =
    txt &&
    txt !== "ここに情報が出力される。よく見ておくんだな" &&
    !txt.includes("エラー発生") &&
    !txt.includes("対応していない");
  copyButton.disabled = !canCopy;

  finalizeUiUpdate();
}

function showError(error) {
  setProgressAtLeast(95, true);
  const errorMessage =
    error && error.message
      ? error.message
      : typeof error === "string"
        ? error
        : "不明なエラーが発生した。";
  messageArea.textContent = "エラーが発生した！: " + errorMessage;
  outputArea.value = "エラー発生";
  lastRawOutputText = "";
  copyButton.disabled = true;
  if (itemSection) {
    setItemSectionVisible(false);
    resetItemSection();
  }
  if (nechronicaSection) {
    setNechronicaSectionVisible(false);
    resetNechronicaSection();
  }
  finalizeUiUpdate();
}

function finalizeUiUpdate() {
  stopProgressTracking();
  setProgress(100, true);

  setTimeout(() => {
    submitButton.disabled = false;
    loadingOverlay.style.display = "none";
  }, 350);
}

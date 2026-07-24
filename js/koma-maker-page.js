const sheetForm = document.getElementById("sheetForm");
const submitButton = document.getElementById("submitButton");
const copyButton = document.getElementById("copyButton");
const komaOutputGrid = document.getElementById("komaOutputGrid");
const primaryKomaOutputTitle = document.getElementById(
  "primaryKomaOutputTitle",
);
const stellarSheathSection = document.getElementById("stellarSheathSection");
const stellarSheathOutputArea = document.getElementById(
  "stellarSheathOutput",
);
const copyStellarSheathButton = document.getElementById(
  "copyStellarSheathButton",
);
const sw25FellowSection = document.getElementById("sw25FellowSection");
const sw25FellowOutputArea = document.getElementById("sw25FellowOutput");
const copySw25FellowButton = document.getElementById(
  "copySw25FellowButton",
);
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
const hideNechronicaEditorEffectCheckbox = document.getElementById(
  "hideNechronicaEditorEffect",
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
const shinobigamiInfoSection = document.getElementById(
  "shinobigamiInfoSection",
);
const shinobigamiPlayerCountInput = document.getElementById(
  "shinobigamiPlayerCount",
);
const shinobigamiInfoEditor = document.getElementById(
  "shinobigamiInfoEditor",
);
const shinobigamiInfoOutputArea = document.getElementById(
  "shinobigamiInfoOutput",
);
const copyShinobigamiInfoButton = document.getElementById(
  "copyShinobigamiInfoButton",
);
const importShinobigamiInfoButton = document.getElementById(
  "importShinobigamiInfoButton",
);
const shinobigamiInfoImportArea = document.getElementById(
  "shinobigamiInfoImport",
);

let toastTimer = null;
let progressTimer = null;
let nechronicaEditorState = null;
let shinobigamiInfoState = null;
let lastRawOutputText = "";
const DEFAULT_NECHRONICA_KAKERA_TEMPLATE =
  "【記憶のカケラ：初期】\n" +
  "「テキスト」\n" +
  "----------------------------------------------------------------------------\n" +
  "【記憶のカケラ：取得】";

function getNechronicaShared() {
  const shared =
    typeof window !== "undefined" && window && window.NechronicaShared
      ? window.NechronicaShared
      : null;
  if (shared && typeof shared.isRepeatableTiming === "function") {
    return shared;
  }
  return {
    isRepeatableTiming: (timing) => {
      const t = String(timing || "").trim();
      return t === "オート" || t === "アクション";
    },
    writeClipboardText: async (text) => {
      const value = String(text == null ? "" : text);
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
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
    },
    showToast: (message, opts = {}) => {
      const text = String(message || "").trim();
      if (!text) return;
      const id = String(opts.id || "copyToast");
      const className = String(opts.className || "copy-toast");
      let toast = document.getElementById(id);
      if (!toast) {
        toast = document.createElement("div");
        toast.id = id;
        toast.className = className;
        document.body.appendChild(toast);
      }
      toast.className = className;
      toast.textContent = text;
      toast.classList.remove("is-error", "is-show");
      if ((opts && opts.kind) === "error") toast.classList.add("is-error");
      void toast.offsetWidth;
      toast.classList.add("is-show");
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(
        () => {
          toast.classList.remove("is-show");
        },
        Number(opts.duration) > 0 ? Number(opts.duration) : 1400,
      );
    },
    resolveReportCheckedOnDamageTransition: (
      prevStatus,
      nextStatus,
      currentChecked,
      damageToken = "❌",
    ) => {
      const prev = String(prevStatus || "");
      const next = String(nextStatus || "");
      if (next === damageToken) return true;
      if (prev === damageToken && next !== damageToken) return false;
      return !!currentChecked;
    },
  };
}

function message(key, params = {}) {
  const shared = getNechronicaShared();
  if (shared && typeof shared.getMessage === "function") {
    return shared.getMessage(key, params);
  }
  return String(key || "");
}

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
  getNechronicaShared().showToast(message, {
    kind,
    id: "copyToast",
    className: "copy-toast",
    errorClass: "is-error",
    showClass: "is-show",
    duration: 1400,
  });
}

function copyTextWithToast(text, successMessage, emptyMessage = "") {
  const txt = String(text || "").trim();
  if (!txt) {
    if (emptyMessage) showToast(emptyMessage, "error");
    return;
  }
  getNechronicaShared()
    .writeClipboardText(txt)
    .then(() => showToast(successMessage, "info"))
    .catch((err) => {
      showToast("コピーに失敗したようだ… ブラウザの権限を確認しろ！", "error");
      console.error("Clipboard copy failed: ", err);
    });
}

const PL_NAME_STORAGE_KEY = "komaMakerPlName";
const KOMA_MAKER_API_URL =
  "https://taku-stada.vercel.app/api/koma-maker";

if (plNameInput) {
  plNameInput.value = localStorage.getItem(PL_NAME_STORAGE_KEY) || "";
  plNameInput.addEventListener("input", () => {
    localStorage.setItem(PL_NAME_STORAGE_KEY, plNameInput.value || "");
  });
}

function buildKomaMakerApiRequest(formData) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(formData),
  };
}

async function postToKomaMakerApi(formData) {
  setProgressAtLeast(18, true);
  const response = await fetch(
    KOMA_MAKER_API_URL,
    buildKomaMakerApiRequest(formData),
  );
  setProgressAtLeast(78, true);

  let data = null;
  try {
    data = await response.json();
    setProgressAtLeast(86, true);
  } catch (_) {}

  if (!response.ok) {
    const message =
      data && data.message
        ? data.message
        : `APIエラー (HTTP ${response.status}): ${KOMA_MAKER_API_URL}`;
    throw new Error(message);
  }

  if (!data) {
    throw new Error(`APIの応答がJSONではない: ${KOMA_MAKER_API_URL}`);
  }
  if (data.status === "error") {
    throw new Error(data.message || `APIエラー: ${KOMA_MAKER_API_URL}`);
  }
  setProgressAtLeast(90, true);
  return data;
}

async function submitSheetData(formData) {
  try {
    return await postToKomaMakerApi(formData);
  } catch (e) {
    const detail = e && e.message ? `: ${e.message}` : "";
    throw new Error(`Vercel版 KomaMaker API への接続に失敗した${detail}`);
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
    .then(() => showToast(message("komaJsonCopySuccess"), "info"))
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
    getNechronicaShared()
      .writeClipboardText(txt)
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

function setStellarSheathSectionVisible(visible) {
  if (!stellarSheathSection) return;
  stellarSheathSection.style.display = visible ? "block" : "none";
}

function setSw25FellowSectionVisible(visible) {
  if (!sw25FellowSection) return;
  sw25FellowSection.style.display = visible ? "block" : "none";
}

function setPrimaryKomaOutputMode(mode = "") {
  const isStellar = mode === "stellar";
  const isSw25Fellow = mode === "sw25-fellow";
  if (komaOutputGrid) {
    komaOutputGrid.classList.toggle("is-stellar", isStellar);
    komaOutputGrid.classList.toggle("is-sw25-fellow", isSw25Fellow);
  }
  if (primaryKomaOutputTitle) {
    primaryKomaOutputTitle.textContent = isStellar
      ? "ブリンガー用コマ"
      : isSw25Fellow
        ? "通常出力"
        : "コマ出力";
  }
  if (copyButton) {
    copyButton.textContent = isStellar
      ? "ブリンガーをコピー"
      : isSw25Fellow
        ? "通常コマをコピー"
        : "コピー";
  }
}

function resetStellarSheathSection() {
  if (stellarSheathOutputArea) {
    stellarSheathOutputArea.value = "ここにシース用コマが出力される。";
  }
  if (copyStellarSheathButton) {
    copyStellarSheathButton.disabled = true;
  }
}

function fillStellarSheathSection(stellarSheathOut) {
  if (!stellarSheathOut) {
    setStellarSheathSectionVisible(false);
    resetStellarSheathSection();
    return false;
  }

  let rendered = "";
  if (typeof stellarSheathOut === "string") {
    rendered = stellarSheathOut;
  } else if (typeof stellarSheathOut === "object") {
    try {
      rendered = JSON.stringify(stellarSheathOut);
    } catch (_) {
      rendered = "";
    }
  }

  if (!rendered) {
    setStellarSheathSectionVisible(false);
    resetStellarSheathSection();
    return false;
  }

  if (stellarSheathOutputArea) stellarSheathOutputArea.value = rendered;
  if (copyStellarSheathButton) copyStellarSheathButton.disabled = false;
  setStellarSheathSectionVisible(true);
  return true;
}

function resetSw25FellowSection() {
  if (sw25FellowOutputArea) {
    sw25FellowOutputArea.value = "ここにフェロー用コマが出力される。";
  }
  if (copySw25FellowButton) {
    copySw25FellowButton.disabled = true;
  }
}

function fillSw25FellowSection(sw25FellowOut) {
  if (!sw25FellowOut) {
    setSw25FellowSectionVisible(false);
    resetSw25FellowSection();
    return false;
  }

  let rendered = "";
  if (typeof sw25FellowOut === "string") {
    rendered = sw25FellowOut;
  } else if (typeof sw25FellowOut === "object") {
    try {
      rendered = JSON.stringify(sw25FellowOut);
    } catch (_) {
      rendered = "";
    }
  }
  if (!rendered) {
    setSw25FellowSectionVisible(false);
    resetSw25FellowSection();
    return false;
  }

  if (sw25FellowOutputArea) sw25FellowOutputArea.value = rendered;
  if (copySw25FellowButton) copySw25FellowButton.disabled = false;
  setSw25FellowSectionVisible(true);
  return true;
}

function setNechronicaSectionVisible(visible) {
  if (!nechronicaSection) return;
  nechronicaSection.style.display = visible ? "block" : "none";
}

function setShinobigamiInfoSectionVisible(visible) {
  if (!shinobigamiInfoSection) return;
  shinobigamiInfoSection.style.display = visible ? "block" : "none";
}

function createShinobigamiInfoRow() {
  return {
    emotion: "なし",
    secret: false,
    location: false,
    ougi: false,
  };
}

const SHINOBIGAMI_EMOTION_OPTIONS = [
  "なし",
  "共感",
  "不信",
  "友情",
  "怒り",
  "愛情",
  "妬み",
  "忠誠",
  "侮蔑",
  "憧憬",
  "劣等感",
  "狂信",
  "殺意",
];

function clampShinobigamiPlayerCount(value) {
  const count = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(count)) return 4;
  return Math.min(6, Math.max(1, count));
}

function resetShinobigamiInfoSection() {
  shinobigamiInfoState = null;
  if (shinobigamiPlayerCountInput) shinobigamiPlayerCountInput.value = "4";
  if (shinobigamiInfoEditor) shinobigamiInfoEditor.innerHTML = "";
  if (shinobigamiInfoOutputArea) {
    shinobigamiInfoOutputArea.value =
      "ここに取得済み情報の管理文が出力される。";
  }
  if (shinobigamiInfoImportArea) {
    shinobigamiInfoImportArea.value = "";
  }
  if (copyShinobigamiInfoButton) {
    copyShinobigamiInfoButton.disabled = true;
  }
}

function toFullWidthDigits(value) {
  return String(value || "").replace(/[0-9]/g, (digit) =>
    String.fromCharCode(digit.charCodeAt(0) + 0xfee0),
  );
}

function padShinobigamiWideCell(value, width) {
  const text = String(value || "");
  const missing = Math.max(0, Number(width) - Array.from(text).length);
  return `${text}${"　".repeat(missing)}`;
}

function buildShinobigamiInfoText() {
  if (!shinobigamiInfoState || !Array.isArray(shinobigamiInfoState.rows)) {
    return "";
  }
  const lines = [
    "【取得済み情報】",
    `${padShinobigamiWideCell("", 4)}${padShinobigamiWideCell("感情", 5)}${padShinobigamiWideCell("秘密", 3)}${padShinobigamiWideCell("居所", 3)}奥義`,
  ];
  shinobigamiInfoState.rows.forEach((row, index) => {
    const pc = `ＰＣ${toFullWidthDigits(index + 1)}`;
    const emotion = SHINOBIGAMI_EMOTION_OPTIONS.includes(row.emotion)
      ? row.emotion
      : "なし";
    const secret = row.secret ? "◯" : "✕";
    const location = row.location ? "◯" : "✕";
    const ougi = row.ougi ? "◯" : "✕";
    lines.push(
      `${padShinobigamiWideCell(pc, 4)}${padShinobigamiWideCell(emotion, 5)}${padShinobigamiWideCell(secret, 3)}${padShinobigamiWideCell(location, 3)}${ougi}`,
    );
  });
  return lines.join("\n");
}

function isShinobigamiInfoHeaderLine(line) {
  const compact = String(line || "").replace(/[　\s]/g, "");
  return (
    compact.includes("感情") &&
    compact.includes("秘密") &&
    compact.includes("居所") &&
    compact.includes("奥義")
  );
}

function replaceShinobigamiInfoBlockInMemo(memo, infoText) {
  const sourceLines = String(memo || "").split(/\r?\n/);
  const replacementLines = String(infoText || "").split(/\r?\n/);
  const startIndex = sourceLines.findIndex(
    (line) => String(line || "").trim() === "【取得済み情報】",
  );
  if (startIndex < 0) {
    const prefix = sourceLines.filter(
      (line, index) =>
        index < sourceLines.length - 1 || String(line || "").trim() !== "",
    );
    if (prefix.length && String(prefix[prefix.length - 1] || "").trim()) {
      prefix.push("");
    }
    return [...prefix, ...replacementLines].join("\n");
  }

  let endIndex = startIndex + 1;
  while (
    endIndex < sourceLines.length &&
    String(sourceLines[endIndex] || "").trim() === ""
  ) {
    endIndex += 1;
  }
  if (
    endIndex < sourceLines.length &&
    isShinobigamiInfoHeaderLine(sourceLines[endIndex])
  ) {
    endIndex += 1;
  }
  while (
    endIndex < sourceLines.length &&
    /^ＰＣ[０-９0-9]+[　\s]/.test(String(sourceLines[endIndex] || ""))
  ) {
    endIndex += 1;
  }
  const tailLines = sourceLines.slice(endIndex);
  let firstContentIndex = tailLines.findIndex(
    (line) => String(line || "").trim() !== "",
  );
  if (
    firstContentIndex >= 0 &&
    String(tailLines[firstContentIndex] || "").trim() === "その他"
  ) {
    const legacyMemoLines = tailLines
      .slice(firstContentIndex + 1)
      .filter(
        (line, index, values) =>
          String(line || "").trim() !== "" ||
          (index > 0 && index < values.length - 1),
      );
    const normalizedTail = ["", "───"];
    if (legacyMemoLines.some((line) => String(line || "").trim())) {
      normalizedTail.push(...legacyMemoLines, "───");
    }
    return [
      ...sourceLines.slice(0, startIndex),
      ...replacementLines,
      ...normalizedTail,
    ].join("\n");
  }
  return [
    ...sourceLines.slice(0, startIndex),
    ...replacementLines,
    ...tailLines,
  ].join("\n");
}

function syncShinobigamiInfoToKomaOutput(infoText) {
  if (!infoText || !outputArea) return;
  const noMemoCheckbox = document.getElementById("noMemo");
  if (noMemoCheckbox && noMemoCheckbox.checked) return;

  let parsed = null;
  try {
    parsed = JSON.parse(String(outputArea.value || ""));
  } catch (_) {
    return;
  }
  if (!parsed || !parsed.data || typeof parsed.data.memo !== "string") return;
  parsed.data.memo = replaceShinobigamiInfoBlockInMemo(
    parsed.data.memo,
    infoText,
  );
  const rendered = JSON.stringify(parsed);
  outputArea.value = rendered;
  lastRawOutputText = rendered;
}

function renderShinobigamiInfoOutput() {
  if (!shinobigamiInfoOutputArea) return;
  const text = buildShinobigamiInfoText();
  shinobigamiInfoOutputArea.value =
    text || "ここに取得済み情報の管理文が出力される。";
  if (copyShinobigamiInfoButton) {
    copyShinobigamiInfoButton.disabled = !text;
  }
  syncShinobigamiInfoToKomaOutput(text);
}

function renderShinobigamiInfoEditor() {
  if (!shinobigamiInfoEditor) return;
  shinobigamiInfoEditor.innerHTML = "";
  if (!shinobigamiInfoState || !Array.isArray(shinobigamiInfoState.rows)) {
    return;
  }

  const header = document.createElement("div");
  header.className = "shinobigami-info-row shinobigami-info-header";
  ["PC", "感情", "秘密", "居所", "奥義"].forEach((label) => {
    const cell = document.createElement("span");
    cell.textContent = label;
    header.appendChild(cell);
  });
  shinobigamiInfoEditor.appendChild(header);

  shinobigamiInfoState.rows.forEach((row, rowIndex) => {
    const rowElement = document.createElement("div");
    rowElement.className = "shinobigami-info-row";
    const pcLabel = document.createElement("span");
    pcLabel.className = "shinobigami-pc-label";
    pcLabel.textContent = `PC${rowIndex + 1}`;
    rowElement.appendChild(pcLabel);

    const emotionSelect = document.createElement("select");
    emotionSelect.className = "shinobigami-emotion-select";
    emotionSelect.dataset.rowIndex = String(rowIndex);
    emotionSelect.setAttribute("aria-label", `PC${rowIndex + 1} 感情`);
    SHINOBIGAMI_EMOTION_OPTIONS.forEach((emotion) => {
      const option = document.createElement("option");
      option.value = emotion;
      option.textContent = emotion;
      option.selected = emotion === row.emotion;
      emotionSelect.appendChild(option);
    });
    rowElement.appendChild(emotionSelect);

    [
      ["secret", row.secret, "◯", "✕", "秘密"],
      ["location", row.location, "◯", "✕"],
      ["ougi", row.ougi, "◯", "✕"],
    ].forEach(([field, acquired, acquiredLabel, emptyLabel, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "shinobigami-info-toggle";
      button.classList.toggle("is-acquired", !!acquired);
      button.dataset.rowIndex = String(rowIndex);
      button.dataset.field = String(field);
      button.textContent = acquired ? acquiredLabel : emptyLabel;
      button.setAttribute(
        "aria-label",
        `PC${rowIndex + 1} ${label || (field === "location" ? "居所" : "奥義")} ${acquired ? "取得済み" : "未取得"}`,
      );
      button.setAttribute("aria-pressed", acquired ? "true" : "false");
      rowElement.appendChild(button);
    });
    shinobigamiInfoEditor.appendChild(rowElement);
  });
}

function isShinobigamiAcquiredMark(value) {
  return /^(?:◯|○|⭕)$/.test(String(value || "").trim());
}

function fromFullWidthDigits(value) {
  return String(value || "").replace(/[０-９]/g, (digit) =>
    String.fromCharCode(digit.charCodeAt(0) - 0xfee0),
  );
}

function importShinobigamiInfoText(text) {
  const sourceLines = String(text || "").split(/\r?\n/);
  const importedRows = new Map();

  sourceLines.forEach((line) => {
    const match = String(line || "").match(
      /^ＰＣ([０-９0-9]+)[　\s]+(.+?)\s*$/,
    );
    if (!match) return;
    const pcNumber = Number.parseInt(fromFullWidthDigits(match[1]), 10);
    if (!Number.isInteger(pcNumber) || pcNumber < 1 || pcNumber > 6) return;
    const values = String(match[2] || "")
      .trim()
      .split(/[　\s]+/)
      .filter(Boolean);
    if (values.length < 4) return;
    importedRows.set(pcNumber, {
      emotion: SHINOBIGAMI_EMOTION_OPTIONS.includes(values[0])
        ? values[0]
        : "なし",
      secret: isShinobigamiAcquiredMark(values[1]),
      location: isShinobigamiAcquiredMark(values[2]),
      ougi: isShinobigamiAcquiredMark(values[3]),
    });
  });

  if (!importedRows.size) return false;
  const playerCount = Math.max(...importedRows.keys());
  shinobigamiInfoState = {
    rows: Array.from({ length: playerCount }, (_, index) =>
      importedRows.get(index + 1) || createShinobigamiInfoRow(),
    ),
  };
  if (shinobigamiPlayerCountInput) {
    shinobigamiPlayerCountInput.value = String(playerCount);
  }
  renderShinobigamiInfoEditor();
  renderShinobigamiInfoOutput();
  return true;
}

function resizeShinobigamiInfoRows(countValue) {
  if (!shinobigamiInfoState) return;
  const count = clampShinobigamiPlayerCount(countValue);
  while (shinobigamiInfoState.rows.length < count) {
    shinobigamiInfoState.rows.push(createShinobigamiInfoRow());
  }
  if (shinobigamiInfoState.rows.length > count) {
    shinobigamiInfoState.rows.length = count;
  }
  if (shinobigamiPlayerCountInput) {
    shinobigamiPlayerCountInput.value = String(count);
  }
  renderShinobigamiInfoEditor();
  renderShinobigamiInfoOutput();
}

function fillShinobigamiInfoSectionFromOutput(rawText) {
  let parsed = null;
  try {
    parsed = JSON.parse(String(rawText || ""));
  } catch (_) {
    parsed = null;
  }
  const externalUrl = String(
    parsed && parsed.data && parsed.data.externalUrl
      ? parsed.data.externalUrl
      : "",
  );
  if (!/character-sheets\.appspot\.com\/shinobigami\//i.test(externalUrl)) {
    setShinobigamiInfoSectionVisible(false);
    resetShinobigamiInfoSection();
    return;
  }

  const memo = String(
    parsed && parsed.data && parsed.data.memo ? parsed.data.memo : "",
  );
  const memoPlayerCount = (
    memo.match(/^ＰＣ[０-９0-9]+[　\s]/gm) || []
  ).length;
  const playerCount = clampShinobigamiPlayerCount(memoPlayerCount || 4);
  shinobigamiInfoState = {
    rows: Array.from({ length: playerCount }, createShinobigamiInfoRow),
  };
  if (shinobigamiPlayerCountInput) {
    shinobigamiPlayerCountInput.value = String(playerCount);
  }
  renderShinobigamiInfoEditor();
  renderShinobigamiInfoOutput();
  setShinobigamiInfoSectionVisible(true);
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
    return !!getNechronicaShared().isRepeatableTiming(timing);
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
        dmgBtn.textContent = "切断";
        dmgBtn.dataset.section = item.text;
        dmgBtn.dataset.mark = "❌";

        const safeBtn = document.createElement("button");
        safeBtn.type = "button";
        safeBtn.className = "hoha nechronica-mini-btn nechronica-header-action";
        safeBtn.textContent = "無事";
        safeBtn.dataset.section = item.text;
        safeBtn.dataset.mark = "⭕";

        const clearCheckBtn = document.createElement("button");
        clearCheckBtn.type = "button";
        clearCheckBtn.className =
          "hoha nechronica-mini-btn nechronica-header-action";
        clearCheckBtn.textContent = "チェック解除";
        clearCheckBtn.dataset.section = item.text;
        clearCheckBtn.dataset.action = "clear-check";

        actions.appendChild(dmgBtn);
        actions.appendChild(safeBtn);
        actions.appendChild(clearCheckBtn);
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
    const shouldHideEffect = !(
      hideNechronicaEditorEffectCheckbox &&
      hideNechronicaEditorEffectCheckbox.checked === false
    );
    text.textContent = shouldHideEffect
      ? stripNechronicaEffectText(item.body)
      : String(item.body || "");

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

function stripNechronicaEffectText(body) {
  const s = String(body || "");
  return s.replace(/(《[^》]*》).*/, "$1").trim();
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
    return `${state}${stripNechronicaEffectText(item.body)}`;
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
    item.reportChecked = mark === "❌";
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
    item.reportChecked = mark === "❌";
  });
  renderNechronicaEditor();
  renderNechronicaQuoteOutput();
}

function clearNechronicaCheckedForPart(sectionLabel) {
  if (!nechronicaEditorState || !Array.isArray(nechronicaEditorState.items))
    return;
  nechronicaEditorState.items.forEach((item) => {
    if (item.type !== "row") return;
    if (!item.allowDamage) return;
    if (String(item.section || "") !== String(sectionLabel || "")) return;
    item.reportChecked = false;
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
    isSatasupe = /character-sheets\.appspot\.com\/satasupe\//i.test(
      externalUrl,
    );
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

if (
  copyStellarSheathButton &&
  stellarSheathOutputArea
) {
  copyStellarSheathButton.addEventListener("click", () => {
    const txt = stellarSheathOutputArea.value || "";
    if (!txt || txt === "ここにシース用コマが出力される。") {
      showToast("まだシース用コマが出力されていないようだ！", "error");
      return;
    }
    copyTextWithToast(txt, "シース用コマをコピーした！");
  });
}

if (stellarSheathSection) {
  setStellarSheathSectionVisible(false);
  resetStellarSheathSection();
}

if (copySw25FellowButton && sw25FellowOutputArea) {
  copySw25FellowButton.addEventListener("click", () => {
    const txt = sw25FellowOutputArea.value || "";
    if (!txt || txt === "ここにフェロー用コマが出力される。") {
      showToast("まだフェロー用コマが出力されていないようだ！", "error");
      return;
    }
    copyTextWithToast(txt, "フェロー用コマをコピーした！");
  });
}

if (sw25FellowSection) {
  setSw25FellowSectionVisible(false);
  resetSw25FellowSection();
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
    if ((target.dataset.action || "") === "clear-check") {
      clearNechronicaCheckedForPart(target.dataset.section || "");
      return;
    }
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
      const prev = item.state;
      item.state = target.value;
      if (item.allowDamage) {
        item.reportChecked =
          getNechronicaShared().resolveReportCheckedOnDamageTransition(
            prev,
            item.state,
            item.reportChecked,
            "❌",
          );
        const rowEl = target.closest(".nechronica-part-row");
        const checkEl =
          rowEl && rowEl.querySelector
            ? rowEl.querySelector(".nechronica-report-check")
            : null;
        if (checkEl instanceof HTMLInputElement) {
          checkEl.checked = !!item.reportChecked;
        }
      }
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

if (hideNechronicaEditorEffectCheckbox) {
  hideNechronicaEditorEffectCheckbox.addEventListener("change", () => {
    renderNechronicaEditor();
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
    getNechronicaShared()
      .writeClipboardText(txt)
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
    getNechronicaShared()
      .writeClipboardText(txt)
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

if (shinobigamiInfoEditor) {
  shinobigamiInfoEditor.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    if (!target.classList.contains("shinobigami-info-toggle")) return;
    if (!shinobigamiInfoState || !Array.isArray(shinobigamiInfoState.rows)) {
      return;
    }
    const rowIndex = Number(target.dataset.rowIndex || "-1");
    const field = String(target.dataset.field || "");
    const row = shinobigamiInfoState.rows[rowIndex];
    if (
      !row ||
      !["secret", "location", "ougi"].includes(field)
    ) {
      return;
    }
    row[field] = !row[field];
    renderShinobigamiInfoEditor();
    renderShinobigamiInfoOutput();
  });

  shinobigamiInfoEditor.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (!target.classList.contains("shinobigami-emotion-select")) return;
    if (!shinobigamiInfoState || !Array.isArray(shinobigamiInfoState.rows)) {
      return;
    }
    const rowIndex = Number(target.dataset.rowIndex || "-1");
    const row = shinobigamiInfoState.rows[rowIndex];
    if (!row || !SHINOBIGAMI_EMOTION_OPTIONS.includes(target.value)) return;
    row.emotion = target.value;
    renderShinobigamiInfoOutput();
  });
}

if (shinobigamiPlayerCountInput) {
  shinobigamiPlayerCountInput.addEventListener("input", () => {
    resizeShinobigamiInfoRows(shinobigamiPlayerCountInput.value);
  });
}

if (copyShinobigamiInfoButton && shinobigamiInfoOutputArea) {
  copyShinobigamiInfoButton.addEventListener("click", () => {
    copyTextWithToast(
      shinobigamiInfoOutputArea.value,
      "取得済み情報の管理文をコピーした！",
      "コピーできる管理文がまだ生成されていないようだ！",
    );
  });
}

if (importShinobigamiInfoButton && shinobigamiInfoImportArea) {
  importShinobigamiInfoButton.addEventListener("click", () => {
    const imported = importShinobigamiInfoText(
      shinobigamiInfoImportArea.value,
    );
    if (imported) {
      showToast("取得済み情報の管理文を読み込んだ！", "info");
      return;
    }
    showToast(
      "PC行を読み取れなかった。コピーした管理文の形式を確認してくれ！",
      "error",
    );
  });
}

if (shinobigamiInfoSection) {
  setShinobigamiInfoSectionVisible(false);
  resetShinobigamiInfoSection();
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
  if (stellarSheathSection) {
    setStellarSheathSectionVisible(false);
    resetStellarSheathSection();
  }
  if (sw25FellowSection) {
    setSw25FellowSectionVisible(false);
    resetSw25FellowSection();
  }
  setPrimaryKomaOutputMode("");
  if (nechronicaSection) {
    setNechronicaSectionVisible(false);
    resetNechronicaSection();
  }
  if (shinobigamiInfoSection) {
    setShinobigamiInfoSectionVisible(false);
    resetShinobigamiInfoSection();
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


function normalizeDxComboCommandEscapesInOutput(renderedOut) {
  let parsed;
  try {
    parsed = JSON.parse(String(renderedOut || ""));
  } catch (_e) {
    return renderedOut;
  }
  if (!parsed || !parsed.data || typeof parsed.data.commands !== "string") {
    return renderedOut;
  }

  const commands = parsed.data.commands;
  const marker = "//▼コンボデータ";
  const markerIndex = commands.indexOf(marker);
  if (markerIndex < 0) return renderedOut;

  const before = commands.slice(0, markerIndex).replace(/\n*$/, "");
  const comboSection = commands.slice(markerIndex);
  const sourceLines = comboSection.split(/\r?\n/);
  const outLines = [];
  let declarationParts = [];

  const commandBreak = String.fromCharCode(92, 110);
  const flushDeclaration = () => {
    if (!declarationParts.length) return;
    outLines.push(
      declarationParts
        .map((line) => String(line || "").replace(/\r?\n/g, commandBreak).trim())
        .filter(Boolean)
        .join(commandBreak),
    );
    declarationParts = [];
  };
  const isDiceFormulaLine = (line) => /^\s*\([^\n]*\)\s*DX/i.test(line) || /^\s*\([^\n]*\)DX/i.test(line) || (/DX/i.test(line) && /◆/.test(line));

  sourceLines.forEach((line, index) => {
    const raw = String(line || "").trimEnd();
    const trimmed = raw.trim();
    if (index === 0 && trimmed === marker) {
      outLines.push(marker);
      return;
    }
    if (!trimmed) return;

    if (trimmed.startsWith("◆")) {
      flushDeclaration();
      declarationParts.push(trimmed);
      return;
    }

    if (isDiceFormulaLine(trimmed)) {
      flushDeclaration();
      outLines.push(trimmed);
      return;
    }

    if (declarationParts.length) {
      declarationParts.push(trimmed);
    } else {
      outLines.push(trimmed);
    }
  });
  flushDeclaration();

  parsed.data.commands = [before, outLines.join("\n")]
    .filter((part) => String(part || "").trim())
    .join("\n");
  return JSON.stringify(parsed);
}

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

  renderedOut = normalizeDxComboCommandEscapesInOutput(renderedOut);

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
  const hasStellarSheath = fillStellarSheathSection(
    result && result.stellarSheathOut,
  );
  const hasSw25Fellow = fillSw25FellowSection(
    result && result.sw25FellowOut,
  );
  setPrimaryKomaOutputMode(
    hasStellarSheath
      ? "stellar"
      : hasSw25Fellow
        ? "sw25-fellow"
        : "",
  );
  fillNechronicaSectionFromOutput(sectionSourceText);
  fillShinobigamiInfoSectionFromOutput(sectionSourceText);

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
  if (stellarSheathSection) {
    setStellarSheathSectionVisible(false);
    resetStellarSheathSection();
  }
  if (sw25FellowSection) {
    setSw25FellowSectionVisible(false);
    resetSw25FellowSection();
  }
  setPrimaryKomaOutputMode("");
  if (nechronicaSection) {
    setNechronicaSectionVisible(false);
    resetNechronicaSection();
  }
  if (shinobigamiInfoSection) {
    setShinobigamiInfoSectionVisible(false);
    resetShinobigamiInfoSection();
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

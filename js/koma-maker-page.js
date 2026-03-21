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
const includeNechronicaBaseCheckbox = document.getElementById(
  "includeNechronicaBase",
);
const nechronicaPartEditor = document.getElementById("nechronicaPartEditor");
const nechronicaOutputArea = document.getElementById("nechronicaOutput");
const copyNechronicaButton = document.getElementById("copyNechronicaButton");

let toastTimer = null;
let progressTimer = null;
let nechronicaEditorState = null;

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
  if (includeNechronicaBaseCheckbox)
    includeNechronicaBaseCheckbox.checked = true;
  if (nechronicaPartEditor) {
    nechronicaPartEditor.innerHTML = "";
  }
  if (nechronicaOutputArea) {
    nechronicaOutputArea.value =
      "ここにネクロニカ用の引用テキストが出力される。";
  }
  if (copyNechronicaButton) copyNechronicaButton.disabled = true;
}

function parseNechronicaMemo(memo) {
  const lines = String(memo || "").split(/\r?\n/);
  const legendIndex = lines.findIndex((line) =>
    String(line || "").startsWith("未使用：🟩、使用：✅、無事：⭕、損傷：❌"),
  );
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

  for (let i = 1; i < quoteLines.length; i++) {
    const line = String(quoteLines[i] || "").trim();
    const normalizedLine = line.replace(/^�(?=【)/, "🟩");
    if (!line) continue;
    if (sectionHeaders.has(line)) {
      items.push({ type: "header", text: line });
      currentSection = line;
      continue;
    }
    const m = normalizedLine.match(/^([🟩✅⭕❌])\s*(.+)$/);
    if (m) {
      const allowDamage = currentSection !== "class";
      const state = !allowDamage && m[1] === "❌" ? "✅" : m[1];
      const sanitizedBody = String(m[2] || "").replace(/^[�\uFFFD]+(?=【)/, "");
      items.push({
        type: "row",
        state,
        body: sanitizedBody,
        allowDamage,
      });
      continue;
    }
    // 想定外フォーマットでも行を失わないよう固定状態で保持。
    const fallbackState =
      stateMarks.find((mark) => normalizedLine.startsWith(mark)) || "⭕";
    const body = normalizedLine
      .replace(/^[🟩✅⭕❌]\s*/, "")
      .replace(/^[�\uFFFD]+(?=【)/, "");
    const allowDamage = currentSection !== "class";
    items.push({
      type: "row",
      state: !allowDamage && fallbackState === "❌" ? "✅" : fallbackState,
      body,
      allowDamage,
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
  let rowIndex = -1;

  nechronicaEditorState.items.forEach((item) => {
    if (item.type === "header") {
      const h = document.createElement("div");
      h.className = "nechronica-part-header";
      h.textContent = item.text;
      nechronicaPartEditor.appendChild(h);
      return;
    }

    rowIndex += 1;
    const row = document.createElement("div");
    row.className = "nechronica-part-row";

    const select = document.createElement("select");
    select.className = "nechronica-state-select";
    select.dataset.rowIndex = String(rowIndex);
    const availableStates = item.allowDamage
      ? stateOptions
      : stateOptions.filter((x) => x.mark !== "❌");
    availableStates.forEach((state) => {
      const opt = document.createElement("option");
      opt.value = state.mark;
      opt.textContent = state.label;
      if (state.mark === item.state) opt.selected = true;
      select.appendChild(opt);
    });

    const text = document.createElement("span");
    text.className = "nechronica-part-text";
    text.textContent = item.body;

    row.appendChild(select);
    row.appendChild(text);
    nechronicaPartEditor.appendChild(row);
  });
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
  const lines = [nechronicaEditorState.legend, ...bodyLines];
  if (includeBase && nechronicaEditorState.baseLines.length) {
    lines.push("", ...nechronicaEditorState.baseLines);
  }

  nechronicaOutputArea.value = lines.join("\n").trim();
  if (copyNechronicaButton)
    copyNechronicaButton.disabled = !nechronicaOutputArea.value;
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
    memo.includes("未使用：🟩、使用：✅、無事：⭕、損傷：❌");

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
  if (includeNechronicaBaseCheckbox)
    includeNechronicaBaseCheckbox.checked = true;
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
  nechronicaPartEditor.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (!target.classList.contains("nechronica-state-select")) return;
    if (!nechronicaEditorState || !Array.isArray(nechronicaEditorState.items))
      return;

    const rowIndex = Number(target.dataset.rowIndex || "-1");
    if (!Number.isInteger(rowIndex) || rowIndex < 0) return;

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
}

if (includeNechronicaBaseCheckbox) {
  includeNechronicaBaseCheckbox.addEventListener("change", () => {
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

  let renderedOut =
    result && result.out ? String(result.out) : "出力の受信に失敗した。";
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
  outputArea.value = renderedOut;

  fillItemSectionFromOutput(
    outputArea.value || "",
    result && result.itemLimits,
    result && result.itemSections,
  );
  fillNechronicaSectionFromOutput(outputArea.value || "");

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

const sheetForm = document.getElementById("sheetForm");
const submitButton = document.getElementById("submitButton");
const copyButton = document.getElementById("copyButton");
const messageArea = document.getElementById("messageArea");
const outputArea = document.getElementById("output");
const effectSection = document.getElementById("effectSection");
const effectNameTableBody = document.getElementById("effectNameTableBody");
const effectLevelTableBody = document.getElementById("effectLevelTableBody");
const loadingOverlay = document.getElementById("loading");
const progressBarContainer = document.getElementById("progressBarContainer");
const progressBar = document.getElementById("progressBar");
const plNameInput = document.getElementById("plName");

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
  return apiBaseFromQuery || localStorage.getItem("komaMakerApiBase") || "";
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
  const defaultBases = window.location.hostname.endsWith("github.io")
    ? DEFAULT_VERCEL_API_BASES.map(normalizeBaseUrl)
    : [];

  const candidates = [
    configuredBase ? `${configuredBase}/api/koma-maker` : null,
    guessedBase ? `${guessedBase}/api/koma-maker` : null,
    ...defaultBases.map((b) => `${b}/api/koma-maker`),
    new URL("/api/koma-maker", window.location.origin).toString(),
    new URL("../api/koma-maker", window.location.href).toString(),
    new URL("./api/koma-maker", window.location.href).toString(),
  ].filter(Boolean);
  return [...new Set(candidates)];
}

async function postToKomaMakerApi(formData) {
  const endpoints = getApiCandidates();
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      let data = null;
      try {
        data = await response.json();
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
    alert("まだコピーできる内容が出力されていない、あるいはエラーのようだ！");
    return;
  }
  navigator.clipboard
    .writeText(txt)
    .then(() =>
      alert("コピーした！ これをココフォリアに持って行ってペーストだ！"),
    )
    .catch((err) => {
      alert("コピーに失敗したようだ… ブラウザの権限を確認しろ！: " + err);
      console.error("Clipboard copy failed: ", err);
    });
});

sheetForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const sheetUrlValue = document.getElementById("sheetUrl").value.toLowerCase();

  submitButton.disabled = true;
  copyButton.disabled = true;
  progressBar.style.removeProperty("animation");
  progressBar.style.transition = "none";
  progressBar.style.width = "0%";
  progressBarContainer.classList.remove("satasupe-progress");
  loadingOverlay.style.display = "flex";

  if (
    sheetUrlValue.includes("satasupe") ||
    sheetUrlValue.includes("appspot.com")
  ) {
    progressBarContainer.classList.add("satasupe-progress");
  } else {
    setTimeout(() => {
      if (loadingOverlay.style.display === "flex") {
        progressBar.style.transition = "width 5s linear";
        progressBar.style.width = "95%";
      }
    }, 50);
  }

  messageArea.textContent = "処理を開始する…";
  outputArea.value = "";
  effectSection.style.display = "none";
  effectNameTableBody.innerHTML = "";
  effectLevelTableBody.innerHTML = "";

  const formData = {
    sheet: document.getElementById("sheetUrl").value,
    img: document.getElementById("imgUrl").value,
    plName: plNameInput ? plNameInput.value : "",
    nomemo: document.getElementById("noMemo").checked.toString(),
    nochp: document.getElementById("noChp").checked.toString(),
  };

  submitSheetData(formData).then(updatePage).catch(showError);
});

function updatePage(result) {
  messageArea.textContent = result.message || "メッセージの受信に失敗した。";
  outputArea.value = result.out || "出力の受信に失敗した。";

  if (
    result.eff &&
    Array.isArray(result.eff) &&
    result.eff[0] &&
    result.eff[0][0] !== 1 &&
    result.eff[0].length > 0
  ) {
    const effectNames = result.eff[0];
    const effectLevels = result.eff[1];
    effectNameTableBody.innerHTML = "";
    effectLevelTableBody.innerHTML = "";

    for (let i = 0; i < effectNames.length; i++) {
      const nameRow = effectNameTableBody.insertRow();
      const nameCell = nameRow.insertCell();
      nameCell.innerHTML = effectNames[i]
        ? effectNames[i].toString().replace(/\n/g, "<br>")
        : "(データなし)";

      const levelRow = effectLevelTableBody.insertRow();
      const levelCell = levelRow.insertCell();
      levelCell.innerHTML =
        effectLevels &&
        effectLevels[i] !== undefined &&
        effectLevels[i] !== null
          ? effectLevels[i].toString().replace(/\n/g, "<br>")
          : "-";
    }
    effectSection.style.display = "block";
  } else {
    effectSection.style.display = "none";
  }

  finalizeUiUpdate();
}

function showError(error) {
  const errorMessage =
    error && error.message
      ? error.message
      : typeof error === "string"
        ? error
        : "不明なエラーが発生した。";
  messageArea.textContent = "エラーが発生した！: " + errorMessage;
  outputArea.value = "エラー発生";
  effectSection.style.display = "none";
  finalizeUiUpdate();
}

function finalizeUiUpdate() {
  const isSatasupe =
    progressBarContainer.classList.contains("satasupe-progress");
  if (isSatasupe) progressBar.style.animation = "none";
  progressBar.style.transition = "none";
  progressBar.style.transition = "width 0.3s ease-out";
  progressBar.style.width = "100%";

  setTimeout(() => {
    submitButton.disabled = false;
    copyButton.disabled = false;
    loadingOverlay.style.display = "none";
  }, 350);
}

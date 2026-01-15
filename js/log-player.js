document.addEventListener("DOMContentLoaded", () => {
  // --- 定数 ---
  const NARRATOR_NAMES = ["GM", "KP", "NC", "DD", "NM"];
  const SYSTEM_NAME = "system";

  // --- DOM要素 ---
  const fileInput = document.getElementById("log-file-input");
  const fileNameDisplay = document.getElementById("file-name-display");
  const uploadArea = document.getElementById("upload-area");
  const uploadSection = document.querySelector(".upload-section");
  const playerArea = document.getElementById("player-area");
  const screenFrame = document.querySelector(".screen-frame");

  // テキスト貼り付け
  const logTextInput = document.getElementById("log-text-input");
  const btnParseText = document.getElementById("btn-parse-text");

  // プレイヤー表示部
  const charNameEl = document.getElementById("char-name");
  const bgCharNameEl = document.getElementById("bg-char-name");
  const messageTextEl = document.getElementById("message-text");
  const logTabLabelEl = document.getElementById("log-tab-label");
  const nextIndicator = document.querySelector(".next-indicator");
  const dialogueBox = document.getElementById("dialogue-box");

  // フィルタリング・シークバー
  const tabFiltersContainer = document.getElementById("tab-filters-container");
  const seekBar = document.getElementById("seek-bar");
  const currentLineDisplay = document.getElementById("current-line-display");
  const totalLineDisplay = document.getElementById("total-line-display");
  const autoSpeedSelect = document.getElementById("auto-speed-select");
  const btnSendGas = document.getElementById("btn-send-gas");

  // コントロールボタン
  const btnFirst = document.getElementById("btn-first"); // 追加
  const btnPrev = document.getElementById("btn-prev");
  const btnAuto = document.getElementById("btn-auto");
  const btnNext = document.getElementById("btn-next");
  const btnLast = document.getElementById("btn-last"); // 追加
  const btnHistory = document.getElementById("btn-history");

  // モーダル
  const historyModal = document.getElementById("history-modal");
  const btnCloseModal = document.getElementById("btn-close-modal");
  const historyListEl = document.getElementById("history-list");
  const btnCopySelection = document.getElementById("btn-copy-selection");
  const btnSelectAll = document.getElementById("btn-select-all");
  const btnDeselectAll = document.getElementById("btn-deselect-all");

  // --- 状態変数 ---
  let fullLogData = [];
  let filteredLogIndices = [];
  let activeTabs = new Set();
  let currentFilteredIndex = 0;
  let isTyping = false;
  let typeInterval = null;
  let autoPlayInterval = null;
  let isAutoPlaying = false;

  // --- 1. ファイル読み込み ---
  if (uploadSection) {
    uploadSection.addEventListener("click", (e) => {
      if (e.target !== fileInput && e.target.tagName !== "LABEL") {
        fileInput.click();
      }
    });
  }

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    fileNameDisplay.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (event) => {
      const htmlContent = event.target.result;
      try {
        fullLogData = parseCcfoliaLog(htmlContent);
        if (fullLogData.length > 0) {
          initPlayer();
        } else {
          alert("ログの読み込みに失敗しました。\n発言が見つかりませんでした。");
        }
      } catch (error) {
        console.error(error);
        alert("解析中にエラーが発生しました。");
      }
    };
    reader.readAsText(file);
  });

  // --- 2. テキスト貼り付け ---
  if (btnParseText) {
    btnParseText.addEventListener("click", (e) => {
      e.stopPropagation();
      const text = logTextInput.value;
      if (!text.trim()) {
        alert("テキストが入力されていません。");
        return;
      }
      try {
        fullLogData = parseRawTextLog(text);
        if (fullLogData.length > 0) {
          initPlayer();
        } else {
          alert("ログの解析に失敗しました。形式を確認してください。");
        }
      } catch (error) {
        console.error(error);
        alert("解析エラーが発生しました。");
      }
    });
  }

  // --- パーサー ---
  function parseCcfoliaLog(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const parsedLogs = [];
    const pTags = doc.querySelectorAll("p");

    pTags.forEach((p) => {
      const color = p.style.color || "#ffffff";
      const spans = p.querySelectorAll("span");
      let tab = "Main";
      let name = "";
      let text = "";

      if (spans.length >= 3) {
        tab = spans[0].textContent.trim().replace(/^\[|\]$/g, "");
        name = spans[1].textContent.trim();
        let rawText = spans[2].innerHTML.replace(/<br\s*\/?>/gi, "\n");
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = rawText;
        text = tempDiv.textContent;
      } else {
        const fullText = p.textContent.trim();
        const tabMatch = fullText.match(/^\[(.*?)\]/);
        if (tabMatch) {
          tab = tabMatch[1];
          const remain = fullText.substring(tabMatch[0].length).trim();
          const colonIndex = remain.indexOf(":");
          if (colonIndex > -1) {
            name = remain.substring(0, colonIndex).trim();
            text = remain.substring(colonIndex + 1).trim();
          } else {
            if (remain.startsWith("system")) {
              name = "system";
              text = remain.substring(6).trim();
            } else {
              name = "???";
              text = remain;
            }
          }
        }
      }
      processLogItem(parsedLogs, tab, name, text, color);
    });
    return parsedLogs;
  }

  function parseRawTextLog(rawText) {
    const parsedLogs = [];
    const lines = rawText.split(/\r?\n/);

    lines.forEach((line) => {
      if (!line.trim()) return;
      const matchWithTab = line.match(/^\[(.*?)\]\s*(.*?)\s*[:：]\s*(.*)$/);
      const matchNoTab = line.match(/^(.*?)\s*[:：]\s*(.*)$/);

      if (matchWithTab) {
        const tab = matchWithTab[1];
        const name = matchWithTab[2];
        const text = matchWithTab[3];
        const color = stringToColor(name);
        processLogItem(parsedLogs, tab, name, text, color);
      } else if (matchNoTab) {
        const tab = "Main";
        const name = matchNoTab[1];
        const text = matchNoTab[2];
        const color = stringToColor(name);
        processLogItem(parsedLogs, tab, name, text, color);
      } else {
        const tabOnlyMatch = line.match(/^\[(.*?)\]\s*(.*)$/);
        if (tabOnlyMatch) {
          const tab = tabOnlyMatch[1];
          const text = tabOnlyMatch[2];
          const name = "system";
          const color = "#888888";
          processLogItem(parsedLogs, tab, name, text, color);
        } else {
          const tab = "Main";
          const name = "???";
          const text = line;
          const color = "#aaaaaa";
          processLogItem(parsedLogs, tab, name, text, color);
        }
      }
    });
    return parsedLogs;
  }

  function processLogItem(targetArray, tab, name, text, color) {
    let type = "speech";
    if (name === SYSTEM_NAME) {
      type = "system";
      const match = text.match(/^\s*\[\s*(.+?)\s*\]\s*(.*)/s);
      if (match) {
        name = match[1];
        text = match[2].trim();
      }
    } else if (NARRATOR_NAMES.includes(name)) {
      type = "narrator";
    } else if (!hasBrackets(text)) {
      type = "desc";
    }
    if (text || type === "system") {
      targetArray.push({ tab, name, text, color, type });
    }
  }

  function stringToColor(str) {
    if (!str) return "#ffffff";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 60%)`;
  }

  // --- プレイヤー初期化 ---
  function initPlayer() {
    uploadArea.style.display = "none";
    playerArea.style.display = "block";

    const tabs = new Set(fullLogData.map((d) => d.tab));
    activeTabs = new Set(tabs);

    renderTabFilters(tabs);
    updateFilteredLogs();
  }

  function renderTabFilters(tabs) {
    tabFiltersContainer.innerHTML = "";
    tabs.forEach((tab) => {
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = tab;
      checkbox.checked = true;
      checkbox.addEventListener("change", (e) => {
        if (e.target.checked) activeTabs.add(tab);
        else activeTabs.delete(tab);
        updateFilteredLogs();
      });
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(tab));
      tabFiltersContainer.appendChild(label);
    });
  }

  function updateFilteredLogs() {
    const currentRealIndex = filteredLogIndices[currentFilteredIndex];
    filteredLogIndices = [];
    fullLogData.forEach((data, index) => {
      if (activeTabs.has(data.tab)) {
        filteredLogIndices.push(index);
      }
    });

    totalLineDisplay.textContent = filteredLogIndices.length;
    seekBar.max = Math.max(0, filteredLogIndices.length - 1);

    const newPos = filteredLogIndices.indexOf(currentRealIndex);
    if (newPos !== -1) currentFilteredIndex = newPos;
    else currentFilteredIndex = 0;

    generateHistoryList();
    displayLine(currentFilteredIndex);
  }

  // --- 表示ロジック ---
  function displayLine(fIndex) {
    if (filteredLogIndices.length === 0) return;
    if (fIndex < 0) fIndex = 0;
    if (fIndex >= filteredLogIndices.length)
      fIndex = filteredLogIndices.length - 1;

    currentFilteredIndex = fIndex;
    const realIndex = filteredLogIndices[fIndex];
    const data = fullLogData[realIndex];

    seekBar.value = fIndex;
    currentLineDisplay.textContent = fIndex + 1;
    logTabLabelEl.textContent = data.tab;

    dialogueBox.className = "dialogue-box";

    charNameEl.textContent = data.name;
    charNameEl.style.display = "block";

    bgCharNameEl.textContent = data.name;
    bgCharNameEl.style.color = data.color;
    bgCharNameEl.style.opacity = "0.2";

    if (data.type === "system") {
      dialogueBox.classList.add("system-mode");
      applyNameStyle(data.color);
      messageTextEl.style.color = "";
      if (data.text.includes("成功")) {
        messageTextEl.style.color = "rgb(33, 150, 243)";
      } else if (data.text.includes("失敗")) {
        messageTextEl.style.color = "rgb(220, 0, 78)";
      } else {
        messageTextEl.style.color = "#0f0";
      }
    } else {
      messageTextEl.style.color = "";
      if (data.type === "narrator") {
        dialogueBox.classList.add("gm-mode");
        charNameEl.style.backgroundColor = "transparent";
        charNameEl.style.color = "";
      } else if (data.type === "speech") {
        dialogueBox.classList.add("speech-mode");
        applyNameStyle(data.color);
      } else {
        dialogueBox.classList.add("desc-mode");
        applyNameStyle(data.color);
      }
    }

    displayText(data.text);
    highlightHistory(realIndex);
  }

  function applyNameStyle(color) {
    charNameEl.style.backgroundColor = color;
    if (color.startsWith("hsl")) {
      charNameEl.style.color = "#000";
    } else {
      charNameEl.style.color = isLightColor(color) ? "#000" : "#fff";
    }
  }

  function displayText(fullText) {
    messageTextEl.innerHTML = "";
    nextIndicator.classList.remove("visible");
    isTyping = true;
    if (typeInterval) clearInterval(typeInterval);

    let charIndex = 0;
    const speed = parseInt(autoSpeedSelect.value);
    const typeSpeed = speed < 200 ? 0 : 20;

    if (typeSpeed === 0) {
      messageTextEl.textContent = fullText;
      finishTyping();
    } else {
      typeInterval = setInterval(() => {
        messageTextEl.textContent += fullText.charAt(charIndex);
        charIndex++;
        messageTextEl.scrollTop = messageTextEl.scrollHeight;
        if (charIndex >= fullText.length) finishTyping();
      }, typeSpeed);
    }
  }

  function hasBrackets(text) {
    return /[「『]/.test(text);
  }

  function isLightColor(colorStr) {
    if (colorStr.startsWith("#")) {
      const hex = colorStr.substring(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return (r * 299 + g * 587 + b * 114) / 1000 > 180;
    }
    return false;
  }

  function finishTyping() {
    if (typeInterval) clearInterval(typeInterval);
    isTyping = false;
    if (filteredLogIndices.length > 0) {
      const realIndex = filteredLogIndices[currentFilteredIndex];
      messageTextEl.textContent = fullLogData[realIndex].text;
    }
    nextIndicator.classList.add("visible");
  }

  // --- ナビゲーション処理 ---
  function nextLine() {
    if (isTyping) {
      finishTyping();
      return;
    }
    if (currentFilteredIndex < filteredLogIndices.length - 1) {
      displayLine(currentFilteredIndex + 1);
    } else {
      if (isAutoPlaying) toggleAutoPlay();
    }
  }

  function prevLine() {
    if (isAutoPlaying) toggleAutoPlay();
    if (isTyping) finishTyping();
    if (currentFilteredIndex > 0) {
      displayLine(currentFilteredIndex - 1);
    }
  }

  function firstLine() {
    if (isAutoPlaying) toggleAutoPlay();
    displayLine(0);
  }

  function lastLine() {
    if (isAutoPlaying) toggleAutoPlay();
    displayLine(filteredLogIndices.length - 1);
  }

  seekBar.addEventListener("input", (e) => {
    if (isAutoPlaying) toggleAutoPlay();
    displayLine(parseInt(e.target.value));
  });

  function toggleAutoPlay() {
    isAutoPlaying = !isAutoPlaying;
    if (isAutoPlaying) {
      btnAuto.classList.add("active");
      btnAuto.innerHTML = '<i class="fa-solid fa-pause"></i> 停止';
      runAutoPlay();
    } else {
      btnAuto.classList.remove("active");
      btnAuto.innerHTML = '<i class="fa-solid fa-play"></i> 自動';
      if (autoPlayInterval) clearTimeout(autoPlayInterval);
    }
  }

  function runAutoPlay() {
    const interval = parseInt(autoSpeedSelect.value);
    autoPlayInterval = setTimeout(() => {
      if (!isTyping) {
        if (currentFilteredIndex < filteredLogIndices.length - 1) {
          displayLine(currentFilteredIndex + 1);
          if (isAutoPlaying) runAutoPlay();
        } else {
          toggleAutoPlay();
        }
      } else {
        if (isAutoPlaying) runAutoPlay();
      }
    }, interval);
  }

  // --- イベントリスナー ---
  // --- イベントリスナー ---
  screenFrame.addEventListener("click", nextLine);

  if (btnFirst) btnFirst.addEventListener("click", firstLine);
  btnPrev.addEventListener("click", prevLine);
  btnAuto.addEventListener("click", toggleAutoPlay);
  btnNext.addEventListener("click", nextLine);
  if (btnLast) btnLast.addEventListener("click", lastLine);

  // ★追加: 速度選択プルダウンのクリックイベントが、隣の自動再生ボタン等に干渉しないようにする
  autoSpeedSelect.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // ★追加: 速度変更時に即座に反映させる（再生中ならインターバル更新）
  autoSpeedSelect.addEventListener("change", () => {
    if (isAutoPlaying) {
      // 一度停止して再開することで新しい速度を適用
      if (autoPlayInterval) clearTimeout(autoPlayInterval);
      runAutoPlay();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (playerArea.style.display !== "none") {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextLine();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevLine();
      }
    }
  });

  // --- 履歴・コピー ---
  btnHistory.addEventListener("click", () => {
    if (isAutoPlaying) toggleAutoPlay();
    historyModal.style.display = "flex";
    requestAnimationFrame(() => {
      const activeItem = historyListEl.querySelector(".history-item.active");
      if (activeItem) {
        if (activeItem === historyListEl.firstElementChild) {
          historyListEl.scrollTop = 0;
        } else {
          activeItem.scrollIntoView({ block: "center", behavior: "auto" });
        }
      }
    });
  });

  btnCloseModal.addEventListener(
    "click",
    () => (historyModal.style.display = "none")
  );

  function generateHistoryList() {
    historyListEl.innerHTML = "";
    const fragment = document.createDocumentFragment();

    filteredLogIndices.forEach((realIndex, fIndex) => {
      const data = fullLogData[realIndex];
      const itemDiv = document.createElement("div");
      itemDiv.className = "history-item";
      itemDiv.dataset.realIndex = realIndex;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "history-checkbox";
      checkbox.value = realIndex;
      checkbox.addEventListener("click", (e) => e.stopPropagation());

      const nameSpan = document.createElement("span");
      nameSpan.className = "history-name";
      nameSpan.textContent = data.name;

      nameSpan.style.backgroundColor = data.color;
      if (data.color.startsWith("hsl")) {
        nameSpan.style.color = "#000";
      } else {
        nameSpan.style.color = isLightColor(data.color) ? "#000" : "#fff";
      }

      const textSpan = document.createElement("span");
      textSpan.className = "history-text";
      textSpan.textContent = data.text;

      itemDiv.appendChild(checkbox);
      itemDiv.appendChild(nameSpan);
      itemDiv.appendChild(textSpan);

      itemDiv.addEventListener("click", () => {
        displayLine(fIndex);
        historyModal.style.display = "none";
      });

      fragment.appendChild(itemDiv);
    });
    historyListEl.appendChild(fragment);
  }

  function highlightHistory(realIndex) {
    const items = historyListEl.querySelectorAll(".history-item");
    items.forEach((item) => item.classList.remove("active"));
    const target = historyListEl.querySelector(
      `.history-item[data-real-index="${realIndex}"]`
    );
    if (target) target.classList.add("active");
  }

  btnSelectAll.addEventListener("click", () =>
    document
      .querySelectorAll(".history-checkbox")
      .forEach((cb) => (cb.checked = true))
  );
  btnDeselectAll.addEventListener("click", () =>
    document
      .querySelectorAll(".history-checkbox")
      .forEach((cb) => (cb.checked = false))
  );

  btnCopySelection.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll(".history-checkbox:checked");
    if (checkboxes.length === 0) {
      alert("選択されていません");
      return;
    }
    const sorted = Array.from(checkboxes).sort(
      (a, b) => parseInt(a.value) - parseInt(b.value)
    );
    let copyText = "";
    sorted.forEach((cb) => {
      const data = fullLogData[parseInt(cb.value)];
      copyText += `${data.tab} ${data.name} : ${data.text}\n\n`;
    });
    navigator.clipboard.writeText(copyText).then(() => {
      const originalText = btnCopySelection.innerHTML;
      btnCopySelection.innerHTML = '<i class="fa-solid fa-check"></i> 完了';
      setTimeout(() => (btnCopySelection.innerHTML = originalText), 1500);
    });
  });

  // --- GAS送信 ---
  btnSendGas.addEventListener("click", () => {
    prepareDataForExport();
  });

  function prepareDataForExport() {
    if (filteredLogIndices.length === 0) {
      alert("送信するデータがありません。");
      return;
    }
    const exportData = filteredLogIndices.map((realIndex) => {
      return fullLogData[realIndex];
    });
    const jsonData = JSON.stringify(exportData, null, 2);
    console.log("Export Data Ready:", jsonData);
    alert("コンソールに送信用のJSONデータを出力しました。");
  }
});

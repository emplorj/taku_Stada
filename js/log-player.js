document.addEventListener("DOMContentLoaded", () => {
  // --- 定数: ナレーター扱いする名前 ---
  const NARRATOR_NAMES = ["GM", "KP", "NC", "DD", "NM"];
  const SYSTEM_NAME = "system";

  // --- ★定数: システム定義 ---
  // 色は common.js の TRPG_SYSTEM_COLORS から取得
  const SYSTEM_CONFIG = {
    CoC: {
      name: "クトゥルフ神話TRPG",
      color: TRPG_SYSTEM_COLORS.CoC,
      keywords: [
        "1d100",
        "1D100",
        "CCB",
        "SAN",
        "決定的成功",
        "スペシャル",
        "イクストリーム",
      ],
    },
    "SW2.5": {
      name: "ソード・ワールド2.5",
      color: TRPG_SYSTEM_COLORS["SW2.5"],
      keywords: ["2d6", "2D6", "k10", "k20", "k30", "威力", "行使", "防護点"],
    },
    DX3rd: {
      name: "ダブルクロス3rd",
      color: TRPG_SYSTEM_COLORS.DX3, // "DX3" キーを使用
      keywords: [
        "10d10",
        "10D10",
        "侵蝕率",
        "ロイス",
        "タイタス",
        "リザレクト",
      ],
    },
    Nechronica: {
      name: "永い後日談のネクロニカ",
      color: TRPG_SYSTEM_COLORS["ネクロニカ"],
      keywords: [
        "NC",
        "パーツ",
        "未練",
        "ネクロマンサー",
        "最大行動値",
        "対話判定",
      ],
    },
    Satasupe: {
      name: "サタスペ",
      color: TRPG_SYSTEM_COLORS["サタスペ"],
      keywords: [
        "サタスペ",
        "肉体点",
        "精神点",
        "性業値",
        "ファンブル表",
        "アクシデント表",
      ],
    },
    Mamono: {
      name: "マモノスクランブル",
      color: TRPG_SYSTEM_COLORS["マモブル"],
      keywords: ["マモノ", "コイン", "特性", "あやかし"],
    },
    Stellar: {
      name: "銀剣のステラナイツ",
      color: TRPG_SYSTEM_COLORS["ステラナイツ"],
      keywords: [
        "ステラ",
        "ブーケ",
        "チャージ",
        "シチュエーション",
        "アタック判定",
      ],
    },
    Shinobigami: {
      name: "シノビガミ",
      color: TRPG_SYSTEM_COLORS["シノビガミ"],
      keywords: ["接近戦", "射撃戦", "忍法", "プロット", "生命力", "奥義"],
    },
    AR2E: {
      name: "アリアンロッドRPG 2E",
      color: TRPG_SYSTEM_COLORS.AR2E,
      keywords: ["フェイト", "スクウェア", "エンゲージ", "3d6"],
    },
  };

  // --- DOM要素 ---
  const fileInput = document.getElementById("log-file-input");
  const fileNameDisplay = document.getElementById("file-name-display");
  const uploadArea = document.getElementById("upload-area");
  const uploadSection = document.querySelector(".upload-section");
  const playerArea = document.getElementById("player-area");
  const screenFrame = document.querySelector(".screen-frame"); // クリック用＆背景変更用

  const logTextInput = document.getElementById("log-text-input");
  const btnParseText = document.getElementById("btn-parse-text");

  const charNameEl = document.getElementById("char-name");
  const bgCharNameEl = document.getElementById("bg-char-name");
  const messageTextEl = document.getElementById("message-text");
  const logTabLabelEl = document.getElementById("log-tab-label");
  const systemTagEl = document.getElementById("system-tag"); // ★追加
  const nextIndicator = document.querySelector(".next-indicator");
  const dialogueBox = document.getElementById("dialogue-box");

  // フィルタリング・シークバー
  const tabFiltersContainer = document.getElementById("tab-filters-container");
  const seekBar = document.getElementById("seek-bar");
  const currentLineDisplay = document.getElementById("current-line-display");
  const totalLineDisplay = document.getElementById("total-line-display");
  const autoSpeedSelect = document.getElementById("auto-speed-select");

  // ボタン
  const btnFirst = document.getElementById("btn-first");
  const btnPrev = document.getElementById("btn-prev");
  const btnAuto = document.getElementById("btn-auto");
  const btnNext = document.getElementById("btn-next");
  const btnLast = document.getElementById("btn-last");
  const btnHistory = document.getElementById("btn-history");
  const btnCopyCurrent = document.getElementById("btn-copy-current");

  // モーダル
  const historyModal = document.getElementById("history-modal");
  const btnCloseModal = document.getElementById("btn-close-modal");
  const historyListEl = document.getElementById("history-list");
  const btnCopySelection = document.getElementById("btn-copy-selection");

  // シェア機能
  const btnShareScene = document.getElementById("btn-share-scene");
  const shareModal = document.getElementById("share-modal");
  const btnCloseShareModal = document.getElementById("btn-close-share-modal");
  const shareTitleInput = document.getElementById("share-title");
  const shareRangeInfo = document.getElementById("share-range-info");
  const btnGenerateShareUrl = document.getElementById("btn-generate-share-url");
  const btnDeleteScene = document.getElementById("btn-delete-scene");
  const shareResult = document.getElementById("share-result");
  const shareUrlDisplay = document.getElementById("share-url-display");

  // --- 状態変数 ---
  let fullLogData = [];
  let filteredLogIndices = [];
  let activeTabs = new Set();

  let currentFilteredIndex = 0;
  let isTyping = false;
  let typeInterval = null;
  let autoPlayInterval = null;
  let isAutoPlaying = false;

  let logLoadMode = null;
  let currentSceneId = null;

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
          logLoadMode = "html";

          // ★システム判定と反映
          const detected = detectSystem(fullLogData);
          applySystemTheme(detected);

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
          logLoadMode = "text";

          // ★システム判定と反映
          const detected = detectSystem(fullLogData);
          applySystemTheme(detected);

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

  // --- ★システム判定ロジック ---
  function detectSystem(logs) {
    const scores = {};
    // スコア初期化
    for (const key in SYSTEM_CONFIG) {
      scores[key] = 0;
    }

    // パフォーマンスのため最初の1000行をチェック
    const sampleLogs = logs.slice(0, 1000);

    sampleLogs.forEach((log) => {
      const t = log.text;
      for (const [sysKey, config] of Object.entries(SYSTEM_CONFIG)) {
        config.keywords.forEach((keyword) => {
          if (t.includes(keyword)) {
            scores[sysKey]++;
          }
        });
      }
    });

    // 最大スコアのシステムを探す
    let maxScore = 0;
    let detected = null;

    for (const [sysKey, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detected = sysKey;
      }
    }

    // ネクロニカの"NC"は他の文章でも出る可能性があるので、ある程度スコアがないとSW2.5の"2d6"等に負ける
    // 競合調整（例：SW2.5とAR2Eは共に2d6を使うが、SWは威力表、ARはフェイトなど固有語で差別化）

    return detected; // 見つからなければ null
  }

  // --- ★システムテーマ反映 ---
  function applySystemTheme(systemKey) {
    let config = SYSTEM_CONFIG[systemKey];

    // 未知のシステムの場合のデフォルト処理
    if (!config) {
      if (systemTagEl) systemTagEl.style.display = "none";

      // デフォルトの背景に戻す
      if (screenFrame) {
        screenFrame.style.backgroundColor = "#111";
        screenFrame.style.backgroundImage = `
                linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
                url('img/default_bg.jpg')
            `;
        screenFrame.style.backgroundSize = "cover";
        screenFrame.style.backgroundPosition = "center";
      }
      return;
    }

    // タグ表示
    if (systemTagEl) {
      systemTagEl.textContent = config.name;
      systemTagEl.style.backgroundColor = config.color;
      systemTagEl.style.display = "block";
    }

    // 背景変更 (リッチなグラデーション)
    if (screenFrame) {
      const c = config.color;

      // ★修正: グラデーションの透明度を調整して背景画像が見えるようにする
      // rgba(0,0,0,0.9) だと濃すぎるため -> rgba(0,0,0,0.6) に変更
      // システムカラーも少し透過させる (${c}88)

      screenFrame.style.backgroundColor = "#111"; // 画像がない場合のベース色
      screenFrame.style.backgroundImage = `
            linear-gradient(135deg, rgba(0,0,0,0.6) 0%, ${c}66 100%),
            url('img/default_bg.jpg')
        `;
      screenFrame.style.backgroundSize = "cover";
      screenFrame.style.backgroundPosition = "center";
      screenFrame.style.backgroundBlendMode = "normal";
    }
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
        const color = NARRATOR_NAMES.includes(name)
          ? "#888888"
          : stringToColor(name);
        processLogItem(parsedLogs, tab, name, text, color);
      } else if (matchNoTab) {
        const tab = "Main";
        const name = matchNoTab[1];
        const text = matchNoTab[2];
        const color = NARRATOR_NAMES.includes(name)
          ? "#888888"
          : stringToColor(name);
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

    if (btnShareScene) {
      if (logLoadMode === "text") {
        btnShareScene.style.display = "inline-flex";
      } else {
        btnShareScene.style.display = "none";
      }
    }
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
        messageTextEl.style.textShadow = "0 0 2px rgba(33, 150, 243, 0.5)";
      } else if (data.text.includes("失敗")) {
        messageTextEl.style.color = "rgb(220, 0, 78)";
        messageTextEl.style.textShadow = "0 0 2px rgba(220, 0, 78, 0.5)";
      } else {
        messageTextEl.style.color = "#0f0";
        messageTextEl.style.textShadow = "0 0 2px #0f0";
      }
    } else {
      messageTextEl.style.color = "";
      messageTextEl.style.textShadow = "";

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

      if (data.text.includes("＞")) {
        if (data.text.includes("成功")) {
          messageTextEl.style.color = "rgb(33, 150, 243)";
          messageTextEl.style.textShadow = "0 0 2px rgba(33, 150, 243, 0.5)";
        } else if (data.text.includes("失敗")) {
          messageTextEl.style.color = "rgb(220, 0, 78)";
          messageTextEl.style.textShadow = "0 0 2px rgba(220, 0, 78, 0.5)";
        }
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

  // --- ナビゲーション ---
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
  screenFrame.addEventListener("click", nextLine);

  if (btnFirst) btnFirst.addEventListener("click", firstLine);
  if (btnLast) btnLast.addEventListener("click", lastLine);

  btnPrev.addEventListener("click", prevLine);
  btnAuto.addEventListener("click", toggleAutoPlay);
  btnNext.addEventListener("click", nextLine);

  // リセット（トップに戻る）
  const btnReset = document.getElementById("btn-reset");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (confirm("現在のログを閉じてトップに戻りますか？")) {
        location.reload();
      }
    });
  }

  autoSpeedSelect.addEventListener("click", (e) => {
    e.stopPropagation();
  });
  autoSpeedSelect.addEventListener("change", () => {
    if (isAutoPlaying) {
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

  if (btnCopyCurrent) {
    btnCopyCurrent.addEventListener("click", () => {
      if (filteredLogIndices.length === 0) return;
      const data = fullLogData[filteredLogIndices[currentFilteredIndex]];
      const textToCopy = `[${data.tab}] ${data.name} : ${data.text}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalHTML = btnCopyCurrent.innerHTML;
        btnCopyCurrent.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => (btnCopyCurrent.innerHTML = originalHTML), 1000);
      });
    });
  }

  // --- GAS共有機能 ---
  // (中略: 既存のGAS共有機能の実装)
  const GAS_API_URL =
    "https://script.google.com/macros/s/AKfycbxMR7f_pOi14SsAuKvu7YxKVBQZ69dn-TeQpMBxyYzo_pwZmICNZ06cSb8BKQYCM0GuGg/exec";

  if (btnShareScene) {
    btnShareScene.addEventListener("click", () => {
      if (logLoadMode === "html") {
        alert(
          "HTMLファイルからのログは共有できません。\nテキスト貼り付けモードをご利用ください。"
        );
        return;
      }
      if (fullLogData.length === 0) {
        alert("共有するログがありません");
        return;
      }
      shareRangeInfo.textContent = `全ログ: ${fullLogData.length}行`;
      shareTitleInput.value = "";
      shareResult.style.display = "none";
      if (currentSceneId && btnDeleteScene) {
        btnDeleteScene.style.display = "block";
      } else if (btnDeleteScene) {
        btnDeleteScene.style.display = "none";
      }
      shareModal.style.display = "flex";
    });
  }

  if (btnCloseShareModal) {
    btnCloseShareModal.addEventListener("click", () => {
      shareModal.style.display = "none";
    });
  }

  if (btnGenerateShareUrl) {
    btnGenerateShareUrl.addEventListener("click", async () => {
      const sceneId = generateRandomId(6);
      await saveSceneToGAS(sceneId, btnGenerateShareUrl);
    });
  }

  if (btnDeleteScene) {
    btnDeleteScene.addEventListener("click", async () => {
      if (!currentSceneId) return;
      if (
        !confirm(
          "本当にこのシーンを削除しますか？\n（共有URLも無効になります）"
        )
      ) {
        return;
      }
      const payload = {
        tool: "logScene",
        action: "delete",
        id: currentSceneId,
      };
      try {
        btnDeleteScene.disabled = true;
        const originalText = btnDeleteScene.innerHTML;
        btnDeleteScene.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin"></i> 削除中...';
        const response = await fetch(GAS_API_URL, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (result.status === "success" || result.status === "not_found") {
          alert("シーンを削除しました。");
          currentSceneId = null;
          shareModal.style.display = "none";
        } else {
          alert(`削除失敗: ${result.message}`);
        }
      } catch (error) {
        console.error("削除エラー:", error);
        alert(`削除処理中にエラーが発生しました。\n${error.message}`);
      } finally {
        btnDeleteScene.disabled = false;
        btnDeleteScene.innerHTML = originalText;
      }
    });
  }

  async function saveSceneToGAS(sceneId, btnElement) {
    if (fullLogData.length === 0) {
      alert("共有するログがありません");
      return;
    }
    const selectedLines = fullLogData.map((data) => {
      return `[${data.tab}] ${data.name} : ${data.text}`;
    });
    const title = shareTitleInput.value.trim() || "（タイトル未設定）";
    const currentBaseUrl = window.location.origin + window.location.pathname;

    const payload = {
      tool: "logScene",
      action: "save",
      id: sceneId,
      baseUrl: currentBaseUrl,
      data: {
        lines: selectedLines,
        startLine: 0,
        title: title,
      },
    };

    try {
      btnElement.disabled = true;
      btnElement.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> 処理中...';

      // JSONPやno-corsではなく、通常のPOSTで送信
      // (GAS側でCORSヘッダーを設定している前提)
      const response = await fetch(GAS_API_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.status === "success") {
        const shareUrl = result.url;
        shareUrlDisplay.value = shareUrl;
        shareResult.style.display = "block";
        try {
          await navigator.clipboard.writeText(shareUrl);
        } catch (clipError) {
          console.warn(
            "クリップボードへの自動コピーに失敗しました:",
            clipError
          );
        }
        shareUrlDisplay.select();
        currentSceneId = sceneId;
        if (btnDeleteScene) btnDeleteScene.style.display = "block";
      } else {
        alert(`エラー: ${result.message}`);
      }
    } catch (error) {
      console.error("共有URL生成エラー:", error);
      alert(`共有URLの生成・保存に失敗しました。\n詳細: ${error.message}`);
    } finally {
      if (btnElement) {
        btnElement.disabled = false;
        if (btnElement.id === "btn-generate-share-url") {
          btnElement.innerHTML =
            '<i class="fa-solid fa-link"></i> 新規URLを発行してコピー';
        }
      }
    }
  }

  function generateRandomId(length) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // URLパラメータからの読み込み
  const urlParams = new URLSearchParams(window.location.search);
  const paramSceneId = urlParams.get("scene");

  if (paramSceneId) {
    loadSceneFromGAS(paramSceneId);
  }

  async function loadSceneFromGAS(sid) {
    try {
      const requestUrl = `${GAS_API_URL}?tool=logScene&id=${encodeURIComponent(
        sid
      )}`;
      console.log("Fetching scene:", requestUrl);
      const response = await fetch(requestUrl);
      const result = await response.json();
      console.log("Scene fetch result:", result);

      if (result.status === "success") {
        const sceneData = result.data;
        const logText = sceneData.lines.join("\n");
        fullLogData = parseRawTextLog(logText);
        if (fullLogData.length > 0) {
          logLoadMode = "text";
          currentSceneId = sid;

          // システム判定
          const detected = detectSystem(fullLogData);
          applySystemTheme(detected);

          initPlayer();
          if (sceneData.title && sceneData.title !== "（タイトル未設定）") {
            console.log(`シーン読み込み完了: ${sceneData.title}`);
          }
        } else {
          alert("シーンデータの解析に失敗しました(ログ件数0)");
        }
      } else if (result.status === "not_found") {
        alert(`指定されたシーンが見つかりませんでした。\nID: ${sid}`);
      } else {
        alert(`エラー: ${result.message}`);
      }
    } catch (error) {
      console.error("シーン読み込みエラー:", error);
      alert("シーンの読み込みに失敗しました。");
    }
  }
});

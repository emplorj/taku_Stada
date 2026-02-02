document.addEventListener("DOMContentLoaded", () => {
  // --- 定数: ナレーター扱いする名前 ---
  const NARRATOR_NAMES = ["GM", "KP", "NC", "DD", "NM"];
  const SYSTEM_NAME = "system";
  const CHARACTER_CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=1980715564&single=true&output=csv";

  // キャラクターデータ管理用
  let characterMap = new Map(); // PC名 -> Data
  let registeredMap = new Map(); // 登録名 -> [Data, Data, ...]

  // --- ★定数: システム定義 ---
  // 色は common.js の TRPG_SYSTEM_COLORS から取得
  const SYSTEM_CONFIG = {
    CoC: {
      name: "クトゥルフ神話TRPG",
      color: TRPG_SYSTEM_COLORS.CoC,
      keywords: ["CCB<=", "CC<=", "SAN", "クトゥルフ"],
    },
    "SW2.5": {
      name: "ソード・ワールド2.5",
      color: TRPG_SYSTEM_COLORS["SW2.5"],
      keywords: [
        "ソード・ワールド",
        "ソードワールド",
        "k0",
        "k10",
        "k50",
        "k100",
        "まもちき",
        "Gr",
      ],
    },
    DX3: {
      name: "ダブルクロス3rd",
      color: TRPG_SYSTEM_COLORS.DX3,
      keywords: ["UGN", "DX7", "ロイス", "バックトラック"],
    },
    Nechronica: {
      name: "永い後日談のネクロニカ",
      color: TRPG_SYSTEM_COLORS["ネクロニカ"],
      keywords: ["ネクロニカ", "NC", "ネクロマンサー", "対話判定"],
    },
    Satasupe: {
      name: "サタスペ",
      color: TRPG_SYSTEM_COLORS["サタスペ"],
      keywords: ["サタスペ", "R>=5", "性業値", "AfterT"],
    },
    Mamono: {
      name: "マモノスクランブル",
      color: TRPG_SYSTEM_COLORS["マモブル"],
      keywords: ["マモノスクランブル", "MS<="],
    },
    Stellar: {
      name: "銀剣のステラナイツ",
      color: TRPG_SYSTEM_COLORS["ステラナイツ"],
      keywords: ["銀剣のステラナイツ", "ブーケ", "SK"],
    },
    Shinobigami: {
      name: "シノビガミ",
      color: TRPG_SYSTEM_COLORS["シノビガミ"],
      keywords: ["シノビガミ", "接近戦", "SG>="],
    },
    AR2E: {
      name: "アリアンロッドRPG 2E",
      color: TRPG_SYSTEM_COLORS.AR2E,
      keywords: ["アリアンロッド", "エリンディル", "フェイト", "エンゲージ"],
    },
  };

  // --- 画像プリロード (表示遅延対策) ---
  function preloadBackgroundImages() {
    // CSSで使用している背景画像のパスリスト
    const imagesToPreload = [
      "img/logBG/CoC.png",
      "img/logBG/SW.png",
      "img/logBG/DX3.png",
      "img/logBG/ネクロニカ.png",
      "img/logBG/サタスペ.png",
      "img/logBG/マモブル.png",
      "img/logBG/銀剣.png",
      "img/logBG/シノビガミ.png",
      "img/logBG/AR2E.png",
      "img/logBG/default.png", // パスを修正
    ];

    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    console.log("Background images preloading started (low priority).");
  }

  // ページ全体の読み込みが完了してから、かつブラウザがアイドル状態の時にプリロードを開始
  window.addEventListener("load", () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => preloadBackgroundImages(), {
        timeout: 2000,
      });
    } else {
      setTimeout(preloadBackgroundImages, 1000);
    }
  });

  // --- DOM要素 ---
  const fileInput = document.getElementById("log-file-input");
  const uploadArea = document.getElementById("upload-area");
  const uploadSection = document.querySelector(".upload-section");
  const playerArea = document.getElementById("player-area");
  const screenFrame = document.querySelector(".screen-frame"); // クリック用＆背景変更用

  const logTextInput = document.getElementById("log-text-input");
  const btnParseText = document.getElementById("btn-parse-text");

  const archiveSelect = document.getElementById("archive-select");
  const btnLoadArchive = document.getElementById("btn-load-archive");
  const archiveStatus = document.getElementById("archive-status");
  const archiveModal = document.getElementById("archive-modal");
  const btnOpenArchiveModal = document.getElementById("btn-open-archive-modal");
  const btnCloseArchiveModal = document.getElementById(
    "btn-close-archive-modal",
  );
  const archiveSearchInput = document.getElementById("archive-search-input");
  const archiveSearchField = document.getElementById("archive-search-field");
  const archiveModalList = document.getElementById("archive-modal-list");

  const GAS_WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbyZQ3dTGIuIFdrggw0reZqEq1JqyQ8MZHnihGovv_SOkPaRj7EmZ7qgjqpn4VlVuLRv3w/exec";

  const charNameEl = document.getElementById("char-name");
  const bgCharNameEl = document.getElementById("bg-char-name");
  const messageTextEl = document.getElementById("message-text");
  const logTabLabelEl = document.getElementById("log-tab-label");
  const systemTagEl = document.getElementById("system-tag"); // ★追加
  const nextIndicator = document.querySelector(".next-indicator");
  const dialogueBox = document.getElementById("dialogue-box");
  const standingPictureEl = document.getElementById("char-standing-picture");
  const diceContainer = document.getElementById("dice-container");
  const diceAudio = new Audio("audio/nc42340.mp3");
  diceAudio.volume = 0.5; // デフォルト音量を50%に

  // フィルタリング・シークバー
  const tabFiltersContainer = document.getElementById("tab-filters-container");
  const seekBar = document.getElementById("seek-bar");
  const currentLineDisplay = document.getElementById("current-line-display");
  const totalLineDisplay = document.getElementById("total-line-display");
  const autoSpeedSelect = document.getElementById("auto-speed-select");
  const volumeSlider = document.getElementById("volume-slider");

  let currentStandingImageUrl = "";
  let archiveItems = [];
  let archiveSelectedFolderUrl = "";
  let archiveListLoaded = false;
  let archiveListLoading = false;
  let assetsReadyPromise = null;

  // --- キャラクターデータの取得とパース ---
  async function loadCharacterData() {
    try {
      const csvText = await fetchCsvTextWithFallbacks(CHARACTER_CSV_URL);

      // ヘッダー行を動的に特定する
      const parseResults = Papa.parse(csvText, { skipEmptyLines: true });
      const allRows = parseResults.data;

      let headerRowIndex = -1;
      let headerRow;
      for (let i = 0; i < allRows.length; i++) {
        if (allRows[i].includes("PC名")) {
          headerRowIndex = i;
          headerRow = allRows[i];
          break;
        }
      }

      if (headerRowIndex === -1) {
        console.error("CSVに 'PC名' ヘッダーが見つかりません。");
        return;
      }

      const getIndex = (name) => headerRow.indexOf(name);
      const dataRows = allRows.slice(headerRowIndex + 1);

      dataRows.forEach((row) => {
        const pcName = row[getIndex("PC名")]
          ? row[getIndex("PC名")].trim()
          : "";
        const regName = row[getIndex("登録名(呼称名)")]
          ? row[getIndex("登録名(呼称名)")].trim()
          : "";
        const imgUrl = row[getIndex("立ち絵URL")]
          ? row[getIndex("立ち絵URL")].trim()
          : "";
        const tableName = row[getIndex("卓名")]
          ? row[getIndex("卓名")].trim()
          : "";
        if (!pcName && !regName) return;

        const data = { pcName, regName, imgUrl, tableName };

        // 検索用キーは正規化したものを使用
        const pcKey = normalizeName(pcName);
        const regKey = normalizeName(regName);

        if (pcKey) characterMap.set(pcKey, data);
        if (regKey) {
          if (!registeredMap.has(regKey)) registeredMap.set(regKey, []);
          registeredMap.get(regKey).push(data);
        }
      });
      console.log(
        `Character data loaded: ${characterMap.size} PCs, ${registeredMap.size} registered names.`,
      );
    } catch (err) {
      console.error("Failed to load character data:", err);
    }
  }

  async function fetchCsvTextWithFallbacks(csvUrl) {
    const jinaUrl = `https://r.jina.ai/http://${csvUrl.replace(
      /^https?:\/\//,
      "",
    )}`;
    const candidates = [
      jinaUrl,
      `https://corsproxy.io/?${encodeURIComponent(csvUrl)}`,
      `https://cors.isomorphic-git.org/${csvUrl}`,
      csvUrl,
    ];
    let lastError;
    for (const url of candidates) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(
            `CSVの取得に失敗: ${response.status} ${response.statusText}`,
          );
        }
        return await response.text();
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("CSVの取得に失敗しました");
  }

  // 起動時に読み込み
  loadCharacterData();

  function setArchiveStatus() {}

  function toggleArchiveLoadingOverlay(isVisible) {}

  async function loadScenarioArchiveList() {
    if (!archiveSelect) {
      if (archiveStatus) {
        archiveStatus.textContent =
          "検索ボタンからアーカイブを選択してください。";
      }
    }
    if (archiveListLoading) return;
    archiveListLoading = true;
    toggleArchiveLoadingOverlay(true);
    if (archiveSelect) {
      archiveSelect.innerHTML =
        '<option value="">-- アーカイブを読み込み中 --</option>';
    }
    if (btnLoadArchive) btnLoadArchive.disabled = true;

    try {
      const response = await fetch(`${GAS_WEB_APP_URL}?action=listArchive`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`一覧取得に失敗: ${response.status}`);
      }
      const result = await response.json();
      if (!result || result.status !== "success") {
        throw new Error(result?.message || "一覧取得に失敗しました");
      }
      const items = Array.isArray(result.data) ? result.data : [];
      archiveItems = items;
      archiveListLoaded = true;
      if (items.length === 0) {
        if (archiveSelect) {
          archiveSelect.innerHTML =
            '<option value="">-- アーカイブが見つかりません --</option>';
        }
        setArchiveStatus("アーカイブが空でした。", true);
        return;
      }

      if (archiveSelect) {
        archiveSelect.innerHTML =
          '<option value="">-- 選択してください --</option>';
      }

      updateArchiveFilterOptions();
      renderArchiveModalList();

      setArchiveStatus("", false);
    } catch (error) {
      console.error("Archive list load failed:", error);
      archiveSelect.innerHTML =
        '<option value="">-- アーカイブ取得に失敗 --</option>';
      setArchiveStatus("アーカイブ取得に失敗しました。", true);
    } finally {
      archiveListLoading = false;
      toggleArchiveLoadingOverlay(false);
    }
  }

  function waitForAssetsReady() {
    if (assetsReadyPromise) return assetsReadyPromise;
    assetsReadyPromise = new Promise((resolve) => {
      const finish = () => resolve();
      if (document.readyState === "complete") {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(finish).catch(finish);
        } else {
          finish();
        }
      } else {
        window.addEventListener(
          "load",
          () => {
            if (document.fonts && document.fonts.ready) {
              document.fonts.ready.then(finish).catch(finish);
            } else {
              finish();
            }
          },
          { once: true },
        );
      }
    });
    return assetsReadyPromise;
  }

  async function ensureArchiveListLoaded() {
    if (archiveListLoaded || archiveListLoading) return;
    await waitForAssetsReady();
    await loadScenarioArchiveList();
  }

  if (archiveSelect && btnLoadArchive) {
    archiveSelect.addEventListener("change", () => {
      btnLoadArchive.disabled = !archiveSelect.value;
      archiveSelectedFolderUrl = archiveSelect.value || "";
    });

    btnLoadArchive.addEventListener("click", async (e) => {
      e.stopPropagation();
      const folderUrl = archiveSelect.value;
      if (!folderUrl) {
        setArchiveStatus("アーカイブを選択してください。", true);
        return;
      }
      await loadArchiveLogFromFolder(folderUrl);
    });
  } else if (btnLoadArchive) {
    btnLoadArchive.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!archiveSelectedFolderUrl) {
        setArchiveStatus("モーダルからアーカイブを選択してください。", true);
        return;
      }
      await loadArchiveLogFromFolder(archiveSelectedFolderUrl);
    });
  }

  if (btnOpenArchiveModal && archiveModal) {
    btnOpenArchiveModal.addEventListener("click", (e) => {
      e.stopPropagation();
      openArchiveModal();
    });
  }

  if (btnCloseArchiveModal && archiveModal) {
    btnCloseArchiveModal.addEventListener("click", () => {
      closeArchiveModal();
    });
  }

  if (archiveSearchInput) {
    archiveSearchInput.addEventListener("input", () => {
      renderArchiveModalList();
    });
  }

  if (archiveSearchField) {
    archiveSearchField.addEventListener("change", () => {
      renderArchiveModalList();
    });
  }

  async function openArchiveModal() {
    if (!archiveModal) return;
    archiveModal.style.display = "flex";
    if (archiveModalList) {
      archiveModalList.innerHTML =
        '<div class="archive-loading-inline"><div class="archive-loading-spinner" aria-hidden="true"></div><div>アーカイブを読み込み中...</div></div>';
    }
    await ensureArchiveListLoaded();
    renderArchiveModalList();
  }

  function closeArchiveModal() {
    if (!archiveModal) return;
    archiveModal.style.display = "none";
  }

  function updateArchiveFilterOptions() {}

  function renderArchiveModalList() {
    if (!archiveModalList) return;
    const keyword = (archiveSearchInput?.value || "").trim().toLowerCase();
    const searchField = archiveSearchField?.value || "all";

    const filtered = archiveItems.filter((item) => {
      if (keyword) {
        const haystack =
          searchField === "all"
            ? [item.name, item.gm, item.pl, item.pc]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
            : (item[searchField] || "").toString().toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      return true;
    });

    archiveModalList.innerHTML = "";
    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "archive-item";
      empty.textContent = "該当するシナリオがありません。";
      archiveModalList.appendChild(empty);
      return;
    }

    filtered.forEach((item) => {
      const row = document.createElement("div");
      row.className = `archive-item${item.isVoice ? " disabled" : ""}`;

      const info = document.createElement("div");
      info.className = "archive-item-info";

      const title = document.createElement("div");
      title.className = "archive-item-name";
      const numberText = formatScenarioNumber(item.number);
      const nameText = item.name || "(名称未設定)";
      title.innerHTML = numberText
        ? `<span class="archive-item-number">${numberText}</span>${nameText}`
        : nameText;
      info.appendChild(title);

      const badges = document.createElement("div");
      badges.className = "archive-item-badges";
      const systemBadge = item.system
        ? {
            text: item.system,
            className: "archive-badge",
            style: item.systemColor
              ? {
                  backgroundColor: item.systemColor,
                  borderColor: item.systemColor,
                }
              : null,
          }
        : null;
      [
        systemBadge,
        item.date ? { text: item.date, className: "archive-badge date" } : null,
        item.gm ? { text: `GM:${item.gm}`, className: "archive-badge" } : null,
      ]
        .filter(Boolean)
        .forEach((badge) => {
          const span = document.createElement("span");
          span.className = badge.className;
          span.textContent = badge.text;
          if (badge.style) {
            Object.assign(span.style, badge.style);
          }
          badges.appendChild(span);
        });
      info.appendChild(badges);

      const detail = document.createElement("div");
      detail.className = "archive-item-meta";
      detail.textContent = [
        item.pl ? `PL:${item.pl}` : "",
        item.pc ? `PC:${item.pc}` : "",
      ]
        .filter(Boolean)
        .join(" / ");
      if (detail.textContent) info.appendChild(detail);

      const btn = document.createElement("button");
      btn.className = "control-btn";
      btn.textContent = "選択";
      btn.disabled = item.isVoice || !item.folderUrl;
      btn.addEventListener("click", () => {
        if (item.isVoice) return;
        archiveSelectedFolderUrl = item.folderUrl;
        setArchiveStatus(`選択: ${item.name}`, false);
        closeArchiveModal();
        loadArchiveLogFromFolder(archiveSelectedFolderUrl);
      });

      row.appendChild(info);
      row.appendChild(btn);
      archiveModalList.appendChild(row);
    });
  }

  function splitNames(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return String(value)
      .split(/[、,\/\n]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  function matchesAny(fieldValue, selected) {
    if (!selected.length) return true;
    const values = splitNames(fieldValue);
    return selected.some((v) => values.includes(v));
  }

  function formatScenarioNumber(value) {
    if (!value) return "";
    const text = String(value).trim();
    if (text.startsWith("#")) {
      return `#${text.replace(/^#+/, "")}`;
    }
    return `#${text}`;
  }

  async function loadArchiveLogFromFolder(folderUrl) {
    try {
      setArchiveStatus("ログを取得中...", false);
      if (btnLoadArchive) btnLoadArchive.disabled = true;
      const resolveResponse = await fetch(
        `${GAS_WEB_APP_URL}?action=resolveLogHtml&url=${encodeURIComponent(
          folderUrl,
        )}`,
        { cache: "no-store" },
      );
      if (!resolveResponse.ok) {
        throw new Error(`HTML解決に失敗: ${resolveResponse.status}`);
      }
      const resolveResult = await resolveResponse.json();
      if (!resolveResult || resolveResult.status !== "success") {
        throw new Error(resolveResult?.message || "HTML解決に失敗しました");
      }

      let htmlText = "";
      try {
        const htmlResponse = await fetch(resolveResult.directUrl, {
          cache: "no-store",
        });
        if (!htmlResponse.ok) {
          throw new Error(`HTML取得に失敗: ${htmlResponse.status}`);
        }
        htmlText = await htmlResponse.text();
      } catch (fetchError) {
        const proxyResponse = await fetch(
          `${GAS_WEB_APP_URL}?action=fetchLogHtml&url=${encodeURIComponent(
            resolveResult.directUrl,
          )}`,
          { cache: "no-store" },
        );
        if (!proxyResponse.ok) {
          throw new Error(`HTML取得に失敗: ${proxyResponse.status}`);
        }
        htmlText = await proxyResponse.text();
      }
      const htmlContent = htmlText;

      fullLogData = window.fullLogData = parseCcfoliaLog(htmlContent);
      if (fullLogData.length > 0) {
        logLoadMode = "html";
        const detected = detectSystem(fullLogData);
        applySystemTheme(detected);
        if (window.logToolApp) {
          window.logToolApp.isCoCLog = detected === "CoC";
        }
        updateVueApp(fullLogData, htmlContent, true);
        initPlayer();
        setArchiveStatus("ログを読み込みました。", false);
      } else {
        setArchiveStatus("ログの読み込みに失敗しました。", true);
      }
    } catch (error) {
      console.error("Archive log load failed:", error);
      setArchiveStatus(
        error?.message || "アーカイブの読み込みに失敗しました。",
        true,
      );
    } finally {
      if (btnLoadArchive) btnLoadArchive.disabled = false;
    }
  }

  // 名前を検索用に正規化する (カッコ内や引用符を除去)
  function normalizeName(name) {
    if (!name) return "";
    return name
      .replace(/[（\(][^（\(\)]*[）\)]/g, "") // カッコ内を除去
      .replace(/[”\"“\'「」『』【】]/g, "") // 検索の邪魔になる記号を除去
      .replace(/[\s　]/g, "") // 全角・半角スペースを除去
      .trim()
      .toLowerCase(); // ★小文字に統一
  }

  // --- ローカル立ち絵設定 (CSVにないキャラ用) ---
  const LOCAL_CHARACTER_IMAGES = [
    {
      names: ["ジン", "Jin", "”ジン”"],
      images: [
        "img/Jin/幕間.png",
        "img/Jin/新生.png",
        "img/Jin/暁月.png",
        "img/Jin/漆黒.png",
        "img/Jin/紅蓮.png",
        "img/Jin/裸.png",
      ],
    },
    {
      names: ["霧谷 雄吾", "霧谷雄吾", "霧谷"],
      images: ["img/logIllust/霧谷雄吾.png"],
    },
    {
      names: ["春日 恭二", "春日恭二", "春日"],
      images: ["img/logIllust/春日恭二.png"],
    },
  ];

  // キャラクターデータを検索する
  // ★修正: 第2引数に systemHint を追加
  function findCharacter(rawName, systemHint = "") {
    const name = normalizeName(rawName);
    if (!name) return null;

    // 1. 登録名で検索 (メインのロジック)
    if (registeredMap.has(name)) {
      const candidates = registeredMap.get(name);
      if (candidates.length === 1) {
        return candidates[0]; // 候補が1つならそれを返す
      }

      // 候補が複数ある場合は、卓名とシステムヒントで絞り込む
      if (systemHint) {
        const systemConfigForHint = SYSTEM_CONFIG[systemHint];
        const systemKeyLower = systemHint.toLowerCase();

        const matchedCandidate = candidates.find((c) => {
          if (!c.tableName) return false;

          const tableNamePrefix = c.tableName.split("-")[0].trim();

          // 1. 卓名プレフィックスを小文字化して、システムのキー(ASCII)と比較
          if (tableNamePrefix.toLowerCase() === systemKeyLower) {
            return true;
          }

          // 2. 卓名プレフィックスを、システムの日本語名と直接比較
          if (
            systemConfigForHint &&
            tableNamePrefix === systemConfigForHint.name
          ) {
            return true;
          }

          return false;
        });

        // 一致する候補があればそれを返し、なければ先頭の候補を返す
        return matchedCandidate || candidates[0];
      }

      // systemHintがない場合は、単純に先頭候補を返す
      return candidates[0];
    }

    // 2. PC名で検索 (登録名で見つからなかった場合のフォールバック)
    if (characterMap.has(name)) {
      return characterMap.get(name);
    }

    // 3. ローカル設定から検索 (CSVになかった場合)
    for (const config of LOCAL_CHARACTER_IMAGES) {
      if (config.names.some((n) => normalizeName(n) === name)) {
        const idx = Math.floor(Math.random() * config.images.length);
        return {
          pcName: rawName,
          regName: rawName,
          imgUrl: config.images[idx],
          tableName: "Local",
        };
      }
    }

    return null;
  }

  window.getStandingPictureUrl = function (rawName) {
    const data = findCharacter(rawName, currentSystemTheme);
    return data && data.imgUrl ? data.imgUrl : "";
  };

  // 立ち絵を更新する
  // 立ち絵を更新する
  function updateStandingPicture(charName, currentIndex) {
    maxCharacterSlots = getMaxCharacterSlots();
    if (characterSlots.length !== maxCharacterSlots) {
      characterSlots = new Array(maxCharacterSlots).fill(null);
      characterLastLine.clear();
      if (standingPictureEl) standingPictureEl.innerHTML = "";
      dialogueBox.classList.remove(
        "tail-slot-0",
        "tail-slot-1",
        "tail-slot-2",
        "tail-slot-3",
        "tail-slot-4",
        "tail-off-screen",
      );
    }
    const charData = findCharacter(charName, currentSystemTheme);
    const normalizedName = normalizeName(charName);
    const newUrl = charData ? charData.imgUrl : "";

    const allImgs = Array.from(
      standingPictureEl.querySelectorAll("img:not(.exiting)"),
    );

    // 1. 全員のクラスからアクティブを剥がして暗転させる
    allImgs.forEach((img) => {
      img.classList.remove("active");
      img.classList.add("dimmed");
    });

    // しっぽクラスをリセット
    dialogueBox.classList.remove(
      "tail-slot-0",
      "tail-slot-1",
      "tail-slot-2",
      "tail-slot-3",
      "tail-slot-4",
    );

    // 2. 自動退場チェック (currentIndex - lastLine > 30)
    allImgs.forEach((img) => {
      const name = img.dataset.charName;
      const lastLine = characterLastLine.get(name) || 0;
      if (currentIndex - lastLine > HIDE_THRESHOLD && name !== normalizedName) {
        img.classList.remove("active", "dimmed");
        img.classList.add("exiting");
        setTimeout(() => img.remove(), 650);
        // スロットを解放
        const sIdx = characterSlots.indexOf(name);
        if (sIdx !== -1) characterSlots[sIdx] = null;
      }
    });

    // 3. キャラ画像がない（システム・ナレーター等）場合は終了
    if (!newUrl) {
      currentStandingImageUrl = "";
      return;
    }

    // 4. スロット割り当て
    let existingImg = allImgs.find(
      (img) => img.dataset.charName === normalizedName,
    );
    let slotIdx = characterSlots.indexOf(normalizedName);

    if (slotIdx === -1) {
      // 画面にいない場合、空きスロットを探す
      slotIdx = characterSlots.indexOf(null);
      if (slotIdx === -1) {
        // 空きがなければ、最も古い（lastLineが最小の）キャラを追い出す
        let oldestName = null;
        let minLine = Infinity;
        characterSlots.forEach((name) => {
          if (name) {
            const l = characterLastLine.get(name) || 0;
            if (l < minLine) {
              minLine = l;
              oldestName = name;
            }
          }
        });

        if (oldestName) {
          const oldestImg = allImgs.find(
            (img) => img.dataset.charName === oldestName,
          );
          if (oldestImg) {
            oldestImg.classList.remove("active", "dimmed");
            oldestImg.classList.add("exiting");
            setTimeout(() => oldestImg.remove(), 650);
          }
          slotIdx = characterSlots.indexOf(oldestName);
          characterSlots[slotIdx] = null;
        }
      }
      characterSlots[slotIdx] = normalizedName;
    }

    // 5. 表示更新
    characterLastLine.set(normalizedName, currentIndex);
    const slotClass = `slot-${slotIdx}`;

    // しっぽをスロットに合わせて設定（デフォルトのoff-screenを上書き）
    const tailClass = `tail-slot-${slotIdx}`;
    dialogueBox.classList.remove("tail-off-screen");
    dialogueBox.classList.add(tailClass);

    if (existingImg) {
      existingImg.classList.remove(
        "dimmed",
        "exiting",
        "slot-left",
        "slot-center",
        "slot-right",
        "slot-0",
        "slot-1",
        "slot-2",
        "slot-3",
        "slot-4",
      );
      existingImg.classList.add("active", slotClass);
      // 同じ名前でURLが違う（色違いなど）場合、画像を差し替える
      if (existingImg.src !== newUrl) {
        existingImg.src = newUrl;
      }
    } else {
      const newImg = document.createElement("img");
      newImg.src = newUrl;
      newImg.dataset.charName = normalizedName;
      newImg.classList.add(slotClass);
      standingPictureEl.appendChild(newImg);
      newImg.offsetHeight;
      newImg.classList.add("active");
    }

    currentStandingImageUrl = newUrl;
  }

  // 全立ち絵を一掃する
  function clearAllStandingPictures() {
    const allImgs = Array.from(
      standingPictureEl.querySelectorAll("img:not(.exiting)"),
    );
    allImgs.forEach((img) => {
      img.classList.remove("active", "dimmed");
      img.classList.add("exiting");
      setTimeout(() => img.remove(), 650);
    });
    // スロットと履歴を完全にリセット
    characterSlots.fill(null);
    characterLastLine.clear();
  }

  // ボタン
  const btnFirst = document.getElementById("btn-first");
  const btnPrev = document.getElementById("btn-prev");
  const btnAuto = document.getElementById("btn-auto");
  const btnNext = document.getElementById("btn-next");
  const btnLast = document.getElementById("btn-last");
  const btnHistory = document.getElementById("btn-history");
  const btnCopyCurrent = document.getElementById("btn-copy-current");
  const btnReset = document.getElementById("btn-reset");

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
  window.fullLogData = fullLogData; // グローバルスコープに公開
  let filteredLogIndices = [];
  let activeTabs = new Set();

  let currentFilteredIndex = 0;
  let currentSystemTheme = ""; // ★追加
  function getMaxCharacterSlots() {
    const width = window.innerWidth || 0;
    const height = window.innerHeight || 0;
    const isLandscape = window.matchMedia
      ? window.matchMedia("(orientation: landscape)").matches
      : false;

    if ((isLandscape && height <= 430) || width <= 360) return 2;
    if (width <= 430) return 3;
    return 5;
  }

  let maxCharacterSlots = getMaxCharacterSlots();
  let characterSlots = new Array(maxCharacterSlots).fill(null);
  let characterLastLine = new Map(); // Name -> FilteredIndex
  const HIDE_THRESHOLD = 30; // 30行発言がなければ非表示

  let isTyping = false;
  let typeInterval = null;
  let autoPlayInterval = null;
  let isAutoPlaying = false;

  let logLoadMode = null;
  let currentSceneId = null;

  window.addEventListener("resize", () => {
    const newMax = getMaxCharacterSlots();
    if (newMax !== maxCharacterSlots) {
      maxCharacterSlots = newMax;
      characterSlots = new Array(maxCharacterSlots).fill(null);
      characterLastLine.clear();
      if (standingPictureEl) standingPictureEl.innerHTML = "";
      if (dialogueBox) {
        dialogueBox.classList.remove(
          "tail-slot-0",
          "tail-slot-1",
          "tail-slot-2",
          "tail-slot-3",
          "tail-slot-4",
          "tail-off-screen",
        );
      }
      if (window.fullLogData && window.fullLogData.length > 0) {
        displayLine(currentFilteredIndex);
      }
    }
  });

  // --- Vueアプリ連携用 ---
  function updateVueApp(logs, rawContent, isHtml) {
    if (window.logToolApp) {
      // ログデータ形式の変換 (LogPlayer -> GrowthChecker)
      const convertedLogs = logs.map((log, index) => ({
        originalIndex: index,
        tab: log.tab,
        character: log.name,
        message: log.text,
        // HTML形式ならそのまま、テキストなら改行を<br>に
        messageHtml: isHtml
          ? log.html || log.text.replace(/\n/g, "<br>")
          : log.text.replace(/\n/g, "<br>"),
        color: log.color,
      }));

      window.logToolApp.setExternalLogs(convertedLogs, rawContent, isHtml);
    }
  }

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
    const reader = new FileReader();
    reader.onload = (event) => {
      const htmlContent = event.target.result;
      try {
        fullLogData = window.fullLogData = parseCcfoliaLog(htmlContent);
        if (fullLogData.length > 0) {
          logLoadMode = "html";

          // ★システム判定と反映
          const detected = detectSystem(fullLogData);
          applySystemTheme(detected);

          if (window.logToolApp) {
            window.logToolApp.isCoCLog = detected === "CoC";
          }

          // ★Vueアプリにデータを渡す
          updateVueApp(fullLogData, htmlContent, true);

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
        fullLogData = window.fullLogData = parseRawTextLog(text);
        if (fullLogData.length > 0) {
          logLoadMode = "text";

          // ★システム判定と反映
          const detected = detectSystem(fullLogData);
          applySystemTheme(detected);

          if (window.logToolApp) {
            window.logToolApp.isCoCLog = detected === "CoC";
          }

          // ★Vueアプリにデータを渡す
          updateVueApp(fullLogData, text, false);

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

  // --- 3. ドラッグ＆ドロップ ---
  if (uploadArea) {
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadSection.classList.add("drag-over");
    });

    uploadArea.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadSection.classList.remove("drag-over");
    });

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadSection.classList.remove("drag-over");
      handleFileDrop(e);
    });
  }

  function handleFileDrop(e) {
    const files = e.dataTransfer.files;
    if (files.length !== 1) {
      alert("ファイルを1つだけドロップしてください。");
      return;
    }
    const file = files[0];
    if (!file.name.match(/\.(html|htm)$/i)) {
      alert("HTML形式のログファイルのみ対応しています。");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const htmlContent = event.target.result;
      try {
        fullLogData = window.fullLogData = parseCcfoliaLog(htmlContent);
        if (fullLogData.length > 0) {
          logLoadMode = "html";

          const detected = detectSystem(fullLogData);
          applySystemTheme(detected);

          if (window.logToolApp) {
            window.logToolApp.isCoCLog = detected === "CoC";
          }

          // ★Vueアプリにデータを渡す
          updateVueApp(fullLogData, htmlContent, true);
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
    currentSystemTheme = systemKey; // ★現在のシステム名を更新
    let config = SYSTEM_CONFIG[systemKey];

    if (config) {
      document.documentElement.style.setProperty(
        "--system-accent",
        config.color,
      );
    } else {
      document.documentElement.style.setProperty("--system-accent", "#87cefa");
    }

    // タグの表示制御
    if (systemTagEl) {
      if (config) {
        systemTagEl.textContent = config.name;
        systemTagEl.style.backgroundColor = config.color;
        systemTagEl.style.display = "block";
      } else {
        systemTagEl.style.display = "none";
      }
    }

    // 背景変更 (CSSクラス制御)
    if (screenFrame) {
      // 1. 既存のテーマクラスやインラインスタイルをリセット
      const classesToRemove = [];
      screenFrame.classList.forEach((cls) => {
        if (cls.startsWith("theme-")) classesToRemove.push(cls);
      });
      classesToRemove.forEach((cls) => screenFrame.classList.remove(cls));

      screenFrame.style.backgroundImage = "";
      screenFrame.style.backgroundColor = "";
      screenFrame.style.borderColor = "";
      screenFrame.style.removeProperty("--system-color");

      // 2. 新しいテーマを適用
      if (config) {
        // キーをCSSクラス名に適した形式に変換 (SW2.5 -> theme-sw2-5)
        const themeClass =
          "theme-" + systemKey.toLowerCase().replace(/[^a-z0-9]/g, "-");
        screenFrame.classList.add(themeClass);

        // システムカラーをカスタムプロパティとして渡す（CSSでの色づけ用）
        screenFrame.style.setProperty("--system-color", config.color);
      } else {
        screenFrame.classList.add("theme-default");
      }
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
              name = "";
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
          const name = "";
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
    // 現在アクティブなタブを検出
    const activeTabBtn = document.querySelector(".tab-btn.active");
    let currentTab = "player"; // デフォルト
    if (activeTabBtn) {
      const onclickAttr = activeTabBtn.getAttribute("onclick");
      const match = onclickAttr && onclickAttr.match(/switchTab\('([^']+)'\)/);
      if (match) {
        currentTab = match[1];
      }
    }

    if (fullLogData.length === 0) return;
    currentIndex = 0;
    isPlaying = false;
    currentWaitTime = 0;
    uploadArea.style.display = "none";
    document.getElementById("tab-navigation").style.display = "flex";
    playerArea.style.display = "block";
    if (btnReset) btnReset.style.display = "inline-flex";

    const tabs = new Set(fullLogData.map((d) => d.tab));
    activeTabs = new Set(tabs);

    // 立ち絵状態をリセット
    maxCharacterSlots = getMaxCharacterSlots();
    characterSlots = new Array(maxCharacterSlots).fill(null);
    characterLastLine.clear();
    if (standingPictureEl) standingPictureEl.innerHTML = "";
    dialogueBox.classList.remove(
      "tail-slot-0",
      "tail-slot-1",
      "tail-slot-2",
      "tail-slot-3",
      "tail-slot-4",
      "tail-off-screen",
    );

    renderTabFilters(tabs);
    updateFilteredLogs();

    // 検出したタブに切り替え（ログ読み込み後も選択中のタブを維持）
    if (window.switchTab) window.switchTab(currentTab);

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

    window.filteredLogIndices = filteredLogIndices;

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
    try {
      if (!filteredLogIndices || filteredLogIndices.length === 0) return;
      if (fIndex < 0) fIndex = 0;
      if (fIndex >= filteredLogIndices.length)
        fIndex = filteredLogIndices.length - 1;

      currentFilteredIndex = fIndex;
      const realIndex = filteredLogIndices[fIndex];
      const data = fullLogData[realIndex];

      if (!data) return;

      seekBar.value = fIndex;
      currentLineDisplay.textContent = fIndex + 1;

      // ★新機能: シーン切り替え検知で立ち絵一掃
      // パターン: 行頭か■の直後に「シーン」があり、その後にスペース、数字、または特定の記号が続く場合
      const scenePattern =
        /(?:^|■)(?:シーン|Scene)(?:[\s　0-9０-９:：・『]|$)/i;
      if (scenePattern.test(data.text)) {
        clearAllStandingPictures();
      }

      logTabLabelEl.textContent = data.tab;

      dialogueBox.className = "dialogue-box";

      const showName = data.name && data.name.trim() !== "";
      const displayName = (data.name || "").replace(/[“”]/g, '"');
      charNameEl.textContent = displayName;
      charNameEl.style.display = showName ? "block" : "none";

      bgCharNameEl.textContent = showName ? displayName : "";
      bgCharNameEl.style.color = data.color || "#ffffff";
      bgCharNameEl.style.opacity = "0.6";

      // ダイス演出リセット
      if (diceContainer) diceContainer.classList.remove("visible");

      // 名前が空欄でもボックスは表示し、ネームプレートのみ隠す（既存の charNameEl.style.display が担当）
      dialogueBox.style.display = "flex";

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
          dialogueBox.classList.add("speech-mode", "tail-off-screen");
          applyNameStyle(data.color);
        } else {
          dialogueBox.classList.add("desc-mode");
          applyNameStyle(data.color);
        }

        // ダイス演出 (＞記号検知)
        if (data.text.includes("＞") || data.text.includes(">")) {
          if (data.text.includes("成功")) {
            messageTextEl.style.color = "rgb(33, 150, 243)";
            messageTextEl.style.textShadow = "0 0 2px rgba(33, 150, 243, 0.5)";
          } else if (data.text.includes("失敗")) {
            messageTextEl.style.color = "rgb(220, 0, 78)";
            messageTextEl.style.textShadow = "0 0 2px rgba(220, 0, 78, 0.5)";
          }

          if (diceContainer) {
            diceContainer.classList.remove("visible");
            void diceContainer.offsetWidth; // reflow
            diceContainer.classList.add("visible");
          }
          if (diceAudio) {
            diceAudio.currentTime = 0;
            diceAudio.play().catch((e) => console.log("Audio play deferred"));
          }
        }
      }

      displayText(data.text);
      highlightHistory(realIndex);
      updateStandingPicture(data.name || "", fIndex);
    } catch (err) {
      console.error("Critical error in displayLine:", err);
    }
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
        try {
          messageTextEl.textContent += fullText.charAt(charIndex);
          charIndex++;
          messageTextEl.scrollTop = messageTextEl.scrollHeight;
          if (charIndex >= fullText.length) finishTyping();
        } catch (e) {
          console.error("Typing interval error:", e);
          finishTyping();
        }
      }, typeSpeed);
    }
  }

  function hasBrackets(text) {
    return /[「『]/.test(text);
  }

  function isLightColor(colorStr) {
    if (!colorStr) return false;
    let r, g, b;

    if (colorStr.startsWith("#")) {
      const hex = colorStr.substring(1);
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
    } else if (colorStr.startsWith("rgb")) {
      const match = colorStr.match(/\d+/g);
      if (match && match.length >= 3) {
        r = parseInt(match[0]);
        g = parseInt(match[1]);
        b = parseInt(match[2]);
      }
    }

    if (r !== undefined && g !== undefined && b !== undefined) {
      // YIQ輝度計算
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

  if (volumeSlider) {
    volumeSlider.addEventListener("input", (e) => {
      if (diceAudio) {
        diceAudio.volume = parseFloat(e.target.value);
      }
    });
  }

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
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (confirm("現在のログを閉じてトップに戻りますか？")) {
        // 再読み込みせずに初期状態へ戻す
        if (isAutoPlaying) toggleAutoPlay();
        if (typeInterval) clearInterval(typeInterval);
        if (autoPlayInterval) clearTimeout(autoPlayInterval);
        isTyping = false;

        fullLogData = window.fullLogData = [];
        filteredLogIndices = [];
        activeTabs = new Set();
        currentFilteredIndex = 0;
        currentSystemTheme = "";
        logLoadMode = null;
        currentSceneId = null;

        if (fileInput) fileInput.value = "";
        if (logTextInput) logTextInput.value = "";

        if (uploadArea) uploadArea.style.display = "block";
        if (playerArea) playerArea.style.display = "none";
        const tabNavigation = document.getElementById("tab-navigation");
        if (tabNavigation) tabNavigation.style.display = "flex";

        if (tabFiltersContainer) tabFiltersContainer.innerHTML = "";
        if (historyListEl) historyListEl.innerHTML = "";
        if (messageTextEl) messageTextEl.textContent = "";
        if (logTabLabelEl) logTabLabelEl.textContent = "Main";
        if (bgCharNameEl) bgCharNameEl.textContent = "";
        if (charNameEl) {
          charNameEl.textContent = "";
          charNameEl.style.display = "none";
        }
        if (systemTagEl) systemTagEl.style.display = "none";

        clearAllStandingPictures();

        if (window.logToolApp) {
          window.logToolApp.logContent = "";
          window.logToolApp.parsedLogs = [];
          window.logToolApp.filteredRawLogs = [];
          window.logToolApp.dialogueResults = [];
          window.logToolApp.hasResults = false;
        }

        const growthTabBtn = document.querySelector(
          "button[onclick=\"switchTab('growth')\"]",
        );
        if (growthTabBtn) {
          growthTabBtn.classList.add("disabled");
          growthTabBtn.title =
            "クトゥルフ神話TRPGのログでのみアクティブになります";
        }

        document.documentElement.style.setProperty(
          "--system-accent",
          "#87cefa",
        );
        if (btnReset) btnReset.style.display = "none";
        if (window.switchTab) window.switchTab("player");
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
    () => (historyModal.style.display = "none"),
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
      nameSpan.textContent = (data.name || "").replace(/[“”]/g, '"');

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
      `.history-item[data-real-index="${realIndex}"]`,
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
      (a, b) => parseInt(a.value) - parseInt(b.value),
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
          "HTMLファイルからのログは共有できません。\nテキスト貼り付けモードをご利用ください。",
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
          "本当にこのシーンを削除しますか？\n（共有URLも無効になります）",
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
            clipError,
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
        sid,
      )}`;
      console.log("Fetching scene:", requestUrl);
      const response = await fetch(requestUrl);
      const result = await response.json();
      console.log("Scene fetch result:", result);

      if (result.status === "success") {
        const sceneData = result.data;
        const logText = sceneData.lines.join("\n");
        fullLogData = window.fullLogData = parseRawTextLog(logText);
        if (fullLogData.length > 0) {
          logLoadMode = "text";
          currentSceneId = sid;

          // システム判定
          const detected = detectSystem(fullLogData);
          applySystemTheme(detected);

          if (window.logToolApp) {
            window.logToolApp.isCoCLog = detected === "CoC";
          }

          // ★Vueアプリにデータを渡す
          updateVueApp(fullLogData, logText, false);

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
  /* =========================
     Vue.js App Integration
     ========================= */

  // タブ切り替え関数
  // タブ切り替え関数
  function switchTab(tabId) {
    if (tabId === "growth") {
      const growthTabBtn = document.getElementById("growth-tab-btn");
      const isCoCLog = window.logToolApp ? window.logToolApp.isCoCLog : false;
      if (
        (growthTabBtn && growthTabBtn.classList.contains("disabled")) ||
        !isCoCLog
      ) {
        return;
      }
    }
    // すべてのタブコンテンツを非表示
    const contents = document.querySelectorAll(".tab-content");
    for (let i = 0; i < contents.length; i++) {
      contents[i].style.display = "none";
      contents[i].classList.remove("active");
    }

    // すべてのタブボタンを非アクティブ
    const btns = document.querySelectorAll(".tab-btn");
    for (let i = 0; i < btns.length; i++) {
      btns[i].classList.remove("active");
    }

    // ログデータ有無チェック
    const hasLogs = window.fullLogData && window.fullLogData.length > 0;

    // 表示するコンテンツを決定
    let contentToShow = null;
    const playerContent = document.getElementById("player-tab-content");
    const analysisTabs = document.getElementById("analysis-tabs");

    if (tabId === "player" || !hasLogs) {
      // プレイヤー選択時 または ログ未ロード時は常にプレイヤーコンテンツ（アップロード画面）を表示
      contentToShow = playerContent;
    } else {
      // ログがあり、かつ分析タブ選択時は分析用コンテンツを表示
      contentToShow = analysisTabs;

      // Vue側のタブ状態も更新
      if (window.logToolApp) {
        window.logToolApp.currentAnalysisTab = tabId;
      }
    }

    // コンテンツを表示
    if (contentToShow) {
      contentToShow.style.display = "block";
      contentToShow.classList.add("active");
    }

    // ボタンのアクティブ化 (クリックされたタブをハイライト)
    const activeBtn = document.querySelector(
      `button[onclick="switchTab('${tabId}')"]`,
    );
    if (activeBtn) {
      activeBtn.classList.add("active");
    }

    // プレイヤー以外に移動したときは再生停止
    if (tabId !== "player") {
      if (typeof isPlaying !== "undefined" && isPlaying) {
        if (typeof togglePlay === "function") togglePlay();
      }
    }
  }

  // グローバルに公開
  window.switchTab = switchTab;

  // Vueアプリ統合
  if (typeof window.GrowthCheckerConfig !== "undefined") {
    const config = Object.assign({}, window.GrowthCheckerConfig);
    config.el = "#log-tool-app";

    // データ初期値の上書き
    config.data = Object.assign({}, config.data, {
      currentAnalysisTab: "growth",
      displayedLogsCount: 100,
      logsPerPage: 200,
    });

    // computed の追加
    config.computed = Object.assign({}, config.computed, {
      visibleRawLogs: function () {
        if (!this.filteredRawLogs) return [];
        return this.filteredRawLogs.slice(0, this.displayedLogsCount);
      },
      hasMoreLogs: function () {
        if (!this.filteredRawLogs) return false;
        return this.filteredRawLogs.length > this.displayedLogsCount;
      },
    });

    // methods の追加
    config.methods = Object.assign({}, config.methods, {
      setExternalLogs: function (logs, rawContent, isHtml) {
        this.logContent = rawContent;
        this.parsedLogs = logs;

        // タブ更新
        const tabs = new Set(["メイン", "情報", "雑談"]);
        this.parsedLogs.forEach((log) => tabs.add(log.tab));
        this.tabNames = [
          "メイン",
          "情報",
          "雑談",
          ...[...tabs].filter((t) => !["メイン", "情報", "雑談"].includes(t)),
        ];
        this.selectedTabs = [...this.tabNames];

        // CoCログ判定
        const isCoC =
          typeof this.isCoCLog === "boolean"
            ? this.isCoCLog
            : /CCB|ボーナス・ペナルティダイス/i.test(rawContent) ||
              logs.some((l) => /CCB?/.test(l.message));
        this.isCoCLog = isCoC;

        // 成長チェックタブボタンの有効/無効制御
        const growthTabBtn = document.querySelector(
          "button[onclick=\"switchTab('growth')\"]",
        );
        if (growthTabBtn) {
          if (isCoC) {
            growthTabBtn.classList.remove("disabled");
            growthTabBtn.title = "";
          } else {
            growthTabBtn.classList.add("disabled");
            growthTabBtn.title =
              "クトゥルフ神話TRPGのログでのみアクティブになります";
          }
        }

        if (isCoC) {
          this.detectedVersion = rawContent.includes(
            "ボーナス・ペナルティダイス",
          )
            ? "coc7"
            : "coc6";
          if (this.setPreset) this.setPreset("official");
        } else {
          this.detectedVersion = null;
        }

        this.$nextTick(() => {
          if (
            this.visibleCharacterNames &&
            this.visibleCharacterNames.length > 0
          ) {
            this.selectedChartCharacter = this.visibleCharacterNames.includes(
              "★みんな",
            )
              ? "★みんな"
              : this.visibleCharacterNames[0];
            if (this.updateChart) this.updateChart(this.selectedChartCharacter);
          } else {
            this.selectedChartCharacter = null;
          }
        });
        this.displayedLogsCount = 100; // 初期表示数リセット
      },
      jumpToLog: function (originalIndex) {
        // originalIndex を filteredLogIndices のインデックスに変換
        const fIndex = window.filteredLogIndices
          ? window.filteredLogIndices.indexOf(originalIndex)
          : -1;
        if (fIndex !== -1) {
          displayLine(fIndex);
          // プレイヤータブに切り替え
          window.switchTab("player");
          const historyModal = document.getElementById("history-modal");
          if (historyModal) historyModal.style.display = "none";
        }
      },
      loadMoreLogs: function () {
        this.displayedLogsCount += this.logsPerPage;
      },
    });

    window.logToolApp = new Vue(config);
  }

  // 初期タブ設定
  if (window.switchTab) switchTab("player");

  window.addEventListener("error", (e) => {
    console.error("Global captured error:", e.error);
  });
});

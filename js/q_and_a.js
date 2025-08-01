// q_and_a.js (完全最終版・備考機能追加)

document.addEventListener("DOMContentLoaded", () => {
  // このページがQ&Aページでなければ何もしない
  if (!document.getElementById("qa-main-container")) return;

  document.body.classList.add("qa-page-body");

  // --- 定数とグローバル変数 ---
  const GAS_WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbwEsQe3onyMVVRJxdl_4wrE_VzFgpfs6HBe46eczo1yv3MhKLMK-Ic1A-a44mKtWUT8vQ/exec";
  const SPREADSHEET_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT3Q8zZ9pdnw0UkcF3sZ3XFQr4g8ZrgRBNPBzzUT0RmulLMzhgJN4st3fa5h0Gkhqr4gZrt2TxYHaMc/pub?gid=0&single=true&output=csv";
  const PULLDOWN_SHEET_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT3Q8zZ9pdnw0UkcF3sZ3XFQr4g8ZrgRBNPBzzUT0RmulLMzhgJN4st3fa5h0Gkhqr4gZrt2TxYHaMc/pub?gid=1509960675&single=true&output=csv";
  const CHAR_CATALOG_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=1980715564&single=true&output=csv";
  const SCENARIO_ARCHIVE_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=620166307&single=true&output=csv";

  let allCharacters = [],
    questions = [],
    formData = {},
    answers = {};
  let currentQuestionIndex = 0;
  let editingState = {
    isEditing: false,
    questionIndex: null,
    bubbleElement: null,
  };
  let characterCatalog = [],
    scenarioArchive = [];
  const REMARKS_HEADER = "※備考等"; // 備考欄のヘッダー名を定数化

  const dom = {
    characterList: document.getElementById("character-list"),
    qaDetails: document.getElementById("qa-details-view"),
    plFilter: document.getElementById("pl-filter"),
    systemFilter: document.getElementById("system-filter"),
    pcSearch: document.getElementById("pc-search"),
    modal: document.getElementById("add-character-modal"),
    openModalBtn: document.getElementById("open-modal-button"),
    closeModalBtn: document.querySelector(".modal-close-button"),
    wizard: document.getElementById("wizard-container"),
    steps: document.querySelectorAll("[data-step]"),
    pcNameInput: document.getElementById("form-pcName"),
    plNameInput: document.getElementById("form-plName"),
    systemInput: document.getElementById("form-system"),
    fontFamilyInput: document.getElementById("form-fontFamily"),
    firstScenarioInput: document.getElementById("form-firstScenario"),
    imageUrlInput: document.getElementById("form-imageUrl"),
    chatContainer: document.getElementById("chat-container"),
    chatInput: document.getElementById("chat-input"),
    chatImageContainer: document.getElementById("chat-character-image"),
    spoilerTip: document.querySelector(".spoiler-tip"),
    btnStep1Next: document.getElementById("btn-step1-next"),
    btnStep2Prev: document.getElementById("btn-step2-prev"),
    btnStep2Next: document.getElementById("btn-step2-next"),
    btnStep3Prev: document.getElementById("btn-step3-prev"),
    btnSendAnswer: document.getElementById("btn-send-answer"),
    btnFinish: document.getElementById("btn-finish"),
    plRandomInput: document.getElementById("pl-random-input"),
    randomCharButton: document.getElementById("random-char-button"),
    randomCharResult: document.getElementById("random-char-result"),
    reloadButton: document.getElementById("reload-button"),
  };

  if (dom.openModalBtn) {
    dom.openModalBtn.disabled = true;
    dom.openModalBtn.textContent = "データ読込中...";
  }

  // --- ヘルパー関数 ---
  const getContrastYIQ = (hexcolor) => {
    if (!hexcolor) return "black";
    hexcolor = hexcolor.replace("#", "");
    if (hexcolor.length !== 6) return "black";
    const r = parseInt(hexcolor.substr(0, 2), 16),
      g = parseInt(hexcolor.substr(2, 2), 16),
      b = parseInt(hexcolor.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? "black" : "white";
  };
  const applySpoilerFormatting = (text) => {
    if (!text) return "";
    const escaped = text
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, '"');
    return escaped
      .replace(/\|\|(.*?)\|\|/g, '<span class="spoiler-text">$1</span>')
      .replace(/\n/g, "<br>");
  };
  const addSpoilerClickListeners = (container) => {
    container
      .querySelectorAll(".spoiler-text:not(.listener-added)")
      .forEach((spoiler) => {
        spoiler.classList.add("listener-added");
        spoiler.addEventListener(
          "click",
          (e) => {
            e.stopPropagation();
            spoiler.classList.add("is-revealed");
          },
          { once: true }
        );
      });
  };
  const getFontClass = (fontName) =>
    fontName ? `font-${fontName.toLowerCase().replace(/\s/g, "-")}` : "";
  function createProxiedUrl(originalUrl) {
    if (!originalUrl || !originalUrl.includes("imgur.com")) return originalUrl;
    return `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`;
  }
  function parseCSV(csvText, requiredHeaders) {
    const results = Papa.parse(csvText, {
      header: false, // ヘッダーは手動で処理
      skipEmptyLines: true,
    });

    const rows = results.data;
    const headerIndex = rows.findIndex((row) =>
      requiredHeaders.every((h) => row.includes(h))
    );
    if (headerIndex === -1) {
      throw new Error(
        `ヘッダー行（${requiredHeaders.join(", ")} を含む行）が見つかりません。`
      );
    }

    let header = rows[headerIndex];
    header = header.map((h) => h.trim()); // Papa Parseは改行コードを自動で処理するため、ここでは不要
    const dataRows = rows.slice(headerIndex + 1);
    return { header, dataRows };
  }
  function scrollToChatBottom() {
    if (dom.chatContainer) {
      // requestAnimationFrameを使い、ブラウザの描画更新の直後に実行させる
      requestAnimationFrame(() => {
        dom.chatContainer.scrollTop = dom.chatContainer.scrollHeight;
      });
    }
  }

  // --- メイン関数 ---
  function renderCharacterList(characters) {
    if (!dom.characterList) return;
    dom.characterList.innerHTML = "";
    if (characters.length === 0) {
      dom.characterList.innerHTML =
        '<p class="no-results">該当するキャラクターがいません。</p>';
      return;
    }
    characters.forEach((char) => {
      const card = document.createElement("div");
      card.className = "character-card";
      card.dataset.id = char.id;
      if (char.imageUrl) {
        const proxiedImageUrl = createProxiedUrl(char.imageUrl);
        card.style.backgroundImage = `url('${proxiedImageUrl}')`;
        card.classList.add("has-bg-image");
        card.style.backgroundRepeat = "no-repeat";

        const img = new Image();
        img.onload = function () {
          const aspectRatio = this.naturalWidth / this.naturalHeight;
          const x = aspectRatio;
          let bgSize, hOffset, vOffset;

          if (x < 0.5) {
            // --- 【ルールA】 縦長の立ち絵 (aspectRatio < 0.7) ---
            // 狙い: 縦に長いほど、顔が上に来るように垂直オフセットを小さくする
            // y = ax^2 + bx + c の二次関数でフィットさせる
            hOffset = -170 * x * x + 40 * x + 40; // 右へのずらし量
            vOffset = 180 * x * x - 230 * x + 80; // 下へのずらし量
            bgSize = "60%";
          } else if (x <= 0.8) {
            // --- 【ルールB】 バストアップ・ (0.7 <= aspectRatio <= 1.1) ---
            // 狙い: 顔アイコンやバストアップを中央に寄せるための調整
            // y = mx + b の一次関数でフィットさせる
            hOffset = 35 * x + 24; // 右へのずらし量
            vOffset = 10 * x + 15; // 下へのずらし量
            bgSize = "65%";
          } else if (x <= 1.1) {
            // --- 【ルールB】 バストアップ・正方形 (0.7 <= aspectRatio <= 1.1) ---
            // 狙い: 顔アイコンやバストアップを中央に寄せるための調整
            // y = mx + b の一次関数でフィットさせる
            hOffset = 35 * x + 34; // 右へのずらし量
            vOffset = 25 * x + 5; // 下へのずらし量
            bgSize = "80%";
          } else {
            // --- 【ルールC】 横長の画像 (aspectRatio > 1.1) ---
            // 狙い: 画像全体を見せつつ、右側のキャラクターを優先
            bgSize = "cover";
            hOffset = 120; // 固定値が最も安定
            vOffset = 35; // 固定値が最も安定
          }

          card.style.backgroundSize = bgSize;
          card.style.backgroundPosition = `right -${hOffset}px top -${vOffset}px`;
        };
        img.onerror = function () {
          card.style.backgroundSize = "cover";
          card.style.backgroundPosition = "center";
        };
        img.src = proxiedImageUrl;
      }
      const systemColor =
        typeof TRPG_SYSTEM_COLORS !== "undefined" &&
        TRPG_SYSTEM_COLORS[char.system]
          ? TRPG_SYSTEM_COLORS[char.system]
          : "#007bff";
      card.innerHTML = `<div class="card-system" style="background-color: ${systemColor};"></div><div class="card-info"><h4 class="card-pc-name">${char.pcName}</h4><p class="card-pl-name">PL: ${char.plName}</p><p class="card-system-name">System: ${char.system}</p></div>`;
      card.addEventListener("click", () => {
        renderQaDetails(char);
        document
          .querySelectorAll(".character-card.active")
          .forEach((c) => c.classList.remove("active"));
        card.classList.add("active");
      });
      dom.characterList.appendChild(card);
    });
  }

  function renderQaDetails(character) {
    if (!dom.qaDetails) return;
    dom.qaDetails.style.backgroundImage = "";
    dom.qaDetails.classList.remove("has-bg-image");
    if (character.imageUrl) {
      const proxiedImageUrl = createProxiedUrl(character.imageUrl);
      dom.qaDetails.style.backgroundImage = `url('${proxiedImageUrl}')`;
      dom.qaDetails.classList.add("has-bg-image");
      const img = new Image();
      img.onload = function () {
        const aspectRatio = this.naturalWidth / this.naturalHeight;
        let bgSize, bgPos;
        if (aspectRatio <= 1.2) {
          bgSize = "600px auto";
          bgPos = "top right 60px";
        } else {
          bgSize = "cover";
          bgPos = "center center";
        }
        dom.qaDetails.style.backgroundSize = bgSize;
        dom.qaDetails.style.backgroundPosition = bgPos;
      };
      img.onerror = function () {
        dom.qaDetails.style.backgroundSize = "cover";
        dom.qaDetails.style.backgroundPosition = "center";
      };
      img.src = proxiedImageUrl;
    }
    const editButtonHtml = `<button class="edit-character-button" title="このキャラクターを編集する"><i class="fas fa-pen"></i></button>`;
    const fontClass = getFontClass(character.fontFamily);
    let contentHtml = `<div class="details-view-content">
                <div class="qa-header">
                    <h2>${character.pcName} ${editButtonHtml}</h2>
                    <p><strong>PL:</strong> ${
                      character.plName
                    } / <strong>システム:</strong> ${character.system}</p>
                    <p><strong>初登場シナリオ:</strong> ${
                      character.firstScenario || "N/A"
                    }</p>
                </div>
                <div class="qa-body">
                    ${questions
                      .map(
                        (q, i) =>
                          `<div class="qa-item"><p class="question">${q.replace(
                            /\n/g,
                            "<br>"
                          )}</p><p class="answer ${fontClass}">${applySpoilerFormatting(
                            character.answers[i] || "（無回答）"
                          )}</p></div>`
                      )
                      .join("")}`;

    if (character.remarks) {
      contentHtml += `<div class="qa-item"><p class="question">${REMARKS_HEADER}</p><p class="answer ${fontClass}">${applySpoilerFormatting(
        character.remarks
      )}</p></div>`;
    }
    contentHtml += `</div></div>`;
    dom.qaDetails.innerHTML = contentHtml;
    const contentWrapper = dom.qaDetails.querySelector(".details-view-content");
    addSpoilerClickListeners(contentWrapper);
    contentWrapper
      .querySelector(".edit-character-button")
      ?.addEventListener("click", () => openEditModal(character));
  }

  function addChatMessage(
    message,
    type,
    questionIndexForAnswer = null,
    isSpecial = false
  ) {
    const row = document.createElement("div");
    row.className = "chat-message-row";
    const bubbleContainer = document.createElement("div");
    bubbleContainer.className = "chat-bubble-container";
    const bubble = document.createElement("div");
    let bubbleClassName = `chat-bubble ${type}`;
    if (type === "answer") {
      const fontClass = getFontClass(dom.fontFamilyInput.value);
      if (fontClass) bubbleClassName += ` ${fontClass}`;
    }
    if (isSpecial) bubbleClassName += " special-question";
    bubble.className = bubbleClassName;
    bubble.innerHTML = applySpoilerFormatting(message);
    addSpoilerClickListeners(bubble);
    bubbleContainer.appendChild(bubble);
    if (type === "answer" && questionIndexForAnswer !== null) {
      const editButton = document.createElement("button");
      editButton.className = "edit-answer-button";
      editButton.innerHTML = '<i class="fa-solid fa-pen"></i>';
      editButton.title = "この回答を編集する";
      editButton.onclick = () => enterEditMode(questionIndexForAnswer, bubble);
      bubbleContainer.appendChild(editButton);
    }
    row.appendChild(bubbleContainer);
    dom.chatContainer.appendChild(row);

    scrollToChatBottom();
  }

  function openEditModal(character) {
    if (!dom.modal) return;
    formData = { ...character, isEditing: true };
    dom.pcNameInput.value = character.pcName;
    dom.plNameInput.value = character.plName;
    dom.systemInput.value = character.system;
    dom.firstScenarioInput.value = character.firstScenario;
    dom.imageUrlInput.value = character.imageUrl;
    dom.fontFamilyInput.value = character.fontFamily || "HigashiOme-Gothic-C";
    if (window.updateCustomSelectDisplay) {
      window.updateCustomSelectDisplay(dom.systemInput);
      window.updateCustomSelectDisplay(dom.fontFamilyInput);
    }
    answers = {};
    questions.forEach((q, i) => {
      answers[`Q${i + 1}`] = character.answers[i] || "（無回答）";
    });
    formData.remarks = character.remarks || "";
    dom.chatContainer.innerHTML = "";
    questions.forEach((q, i) => {
      addChatMessage(q, "question");
      addChatMessage(answers[`Q${i + 1}`], "answer", i);
    });
    addChatMessage(
      "最後に、何か備考があれば教えてください。（なければ空欄でOK）",
      "question",
      null,
      true
    );
    addChatMessage(formData.remarks, "answer", questions.length);

    const chatGrid = dom.chatContainer.closest(".chat-grid-container");
    if (chatGrid) chatGrid.style.minHeight = "400px";

    currentQuestionIndex = questions.length + 1;
    document.querySelector(".chat-input-area").classList.add("inactive");
    dom.btnSendAnswer.disabled = true;
    dom.btnFinish.disabled = false;

    dom.chatImageContainer.innerHTML = formData.imageUrl
      ? `<img src="${createProxiedUrl(
          formData.imageUrl
        )}" alt="Character Image">`
      : "";
    document.body.classList.add("modal-open");
    dom.modal.style.display = "flex";
    goToStep(3);

    // ★★★ ここが修正箇所です ★★★
    // モーダルの表示アニメーション(0.5秒)が終わるのを待ってからスクロールする
    setTimeout(scrollToChatBottom, 510);
  }

  function applyFilters() {
    const plValue = dom.plFilter.value;
    const systemValue = dom.systemFilter.value;
    const searchValue = dom.pcSearch.value.trim().toLowerCase();
    let filtered = allCharacters;
    if (plValue !== "all")
      filtered = filtered.filter((char) => char.plName === plValue);
    if (systemValue !== "all")
      filtered = filtered.filter((char) => char.system === systemValue);
    if (searchValue)
      filtered = filtered.filter((char) =>
        char.pcName.toLowerCase().includes(searchValue)
      );
    renderCharacterList(filtered);
    if (dom.qaDetails)
      dom.qaDetails.innerHTML =
        '<div class="qa-placeholder"><p>左のリストからキャラクターを選択してください。</p></div>';
  }

  function setupFilters() {
    if (!dom.plFilter || !dom.systemFilter) return;
    const plNames = [
      ...new Set(allCharacters.map((char) => char.plName)),
    ].filter(Boolean);
    const systems = [
      ...new Set(allCharacters.map((char) => char.system)),
    ].filter(Boolean);
    plNames.sort().forEach((name) => {
      dom.plFilter.innerHTML += `<option value="${name}">${name}</option>`;
    });
    systems.sort().forEach((name) => {
      dom.systemFilter.innerHTML += `<option value="${name}">${name}</option>`;
    });
    dom.plFilter.addEventListener("change", applyFilters);
    dom.systemFilter.addEventListener("change", applyFilters);
    dom.pcSearch.addEventListener("input", applyFilters);
  }

  function goToStep(stepNumber) {
    if (dom.wizard) {
      dom.steps.forEach((step) => step.classList.remove("active"));
      const targetStep = dom.wizard.querySelector(
        `[data-step="${stepNumber}"]`
      );
      if (targetStep) targetStep.classList.add("active");
    }
  }

  function enterEditMode(qIndex, bubbleEl) {
    if (editingState.isEditing) exitEditMode();
    editingState = {
      isEditing: true,
      questionIndex: qIndex,
      bubbleElement: bubbleEl,
    };
    let existingAnswer =
      qIndex === questions.length
        ? formData.remarks
        : answers[`Q${qIndex + 1}`];
    if (existingAnswer === "（無回答）") existingAnswer = "";
    dom.chatInput.value = existingAnswer;
    dom.btnSendAnswer.textContent = "更新";
    dom.btnSendAnswer.disabled = false;
    document.querySelector(".chat-input-area").classList.remove("inactive");
    dom.wizard.classList.add("editing-active");
    dom.chatInput.focus();
  }

  function exitEditMode() {
    if (!editingState.isEditing) return;
    editingState = {
      isEditing: false,
      questionIndex: null,
      bubbleElement: null,
    };
    dom.chatInput.value = "";
    dom.btnSendAnswer.textContent = "送信";
    dom.wizard.classList.remove("editing-active");
    if (currentQuestionIndex > questions.length) {
      document.querySelector(".chat-input-area").classList.add("inactive");
      dom.btnSendAnswer.disabled = true;
    }
  }

  function askNextQuestion() {
    exitEditMode();
    dom.btnFinish.disabled = false;

    if (currentQuestionIndex < questions.length) {
      addChatMessage(questions[currentQuestionIndex], "question");
      dom.chatInput.placeholder = "回答を入力...";
      dom.chatInput.value = "「」";
      dom.chatInput.focus();
      dom.chatInput.setSelectionRange(1, 1);
    } else if (currentQuestionIndex === questions.length) {
      addChatMessage(
        "最後に、何か備考があれば教えてください。（なければ空欄でOK）",
        "question",
        null,
        true
      );
      dom.chatInput.placeholder = "備考を入力...";
      dom.chatInput.value = "";
      dom.chatInput.focus();
    } else {
      addChatMessage(
        "全ての質問が完了しました！<br>内容を確認・編集し、よろしければ下の「完了」ボタンを押してください。",
        "question",
        null,
        true
      );
      document.querySelector(".chat-input-area").classList.add("inactive");
      dom.btnSendAnswer.disabled = true;
      dom.chatInput.value = "";
    }
  }

  function finishAndSubmit() {
    goToStep(4);
    let submissionData = formData.isEditing
      ? {
          action: "update",
          ID: formData.id,
        }
      : {
          action: "append",
          ID:
            allCharacters.reduce(
              (max, char) => Math.max(max, parseInt(char.id) || 0),
              0
            ) + 1,
        };
    Object.assign(submissionData, {
      システム: dom.systemInput.value,
      PL名: dom.plNameInput.value,
      PC名: dom.pcNameInput.value,
      初登場シナリオ: dom.firstScenarioInput.value,
      画像URL: dom.imageUrlInput.value,
      フォント: dom.fontFamilyInput.value,
    });
    questions.forEach((questionHeader, i) => {
      const answerKey = `Q${i + 1}`;
      if (answers[answerKey] !== undefined)
        submissionData[questionHeader] = answers[answerKey];
    });

    // ★★★ 修正点3: undefinedでないことを確認して備考を追加 ★★★
    if (formData.remarks !== undefined) {
      submissionData[REMARKS_HEADER] = formData.remarks;
    }

    const finalStatusContainer = document.querySelector(
      '[data-step="4"] .final-status-container'
    );
    finalStatusContainer.innerHTML =
      '<div class="loader"></div><h2>登録処理中...</h2><p>データをスプレッドシートに書き込んでいます...</p>';
    fetch(GAS_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      cache: "no-cache",
      body: JSON.stringify(submissionData),
    })
      .then(() => {
        finalStatusContainer.innerHTML =
          '<p class="success" style="font-size: 2.5em; margin: 0;">✔️</p><h2 class="success">登録リクエストを送信しました！</h2><p>数秒後にデータが反映されます。ページをリロードして確認してください。</p>';
        formData.isEditing = false;
      })
      .catch((error) => {
        console.error("GASへの送信でネットワークエラー:", error);
        finalStatusContainer.innerHTML = `<p class="error" style="font-size: 2.5em; margin: 0;">❌</p><h2 class="error">ネットワークエラー</h2><p>サーバーに接続できませんでした。インターネット接続を確認してください。</p>`;
        formData.isEditing = false;
      });
  }

  function parseQandA(csvText) {
    const requiredHeaders = ["ID", "システム", "PL名", "PC名"];
    const results = Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
    });

    const rows = results.data;
    const headerIndex = rows.findIndex((row) =>
      requiredHeaders.every((h) => row.includes(h))
    );

    if (headerIndex === -1) {
      console.error("ヘッダー行が見つかりません。", rows);
      throw new Error(
        `必須ヘッダー（${requiredHeaders.join(
          ", "
        )}）を含む行が見つかりません。`
      );
    }

    const header = rows[headerIndex].map((h) => h.trim());
    const dataRows = rows.slice(headerIndex + 1);

    const allData = dataRows.map((row) => {
      const obj = {};
      header.forEach((key, i) => {
        // データがヘッダーより短い場合を考慮
        obj[key] = row[i] !== undefined ? row[i] : "";
      });
      return obj;
    });

    const headerKeys = header;
    const remarksIndex = headerKeys.indexOf(REMARKS_HEADER);
    const q1Index = headerKeys.findIndex((h) => h && h.trim().startsWith("Q1"));

    if (q1Index === -1) {
      console.warn("質問項目（Q1...）が見つかりませんでした。");
      questions = [];
    } else {
      questions = headerKeys.slice(
        q1Index,
        remarksIndex !== -1 ? remarksIndex : headerKeys.length
      );
    }

    return allData
      .map((row) => {
        if (!row["PC名"] || row["PC名"].trim() === "") return null;

        const answersArray = questions.map((qKey) => row[qKey] || "");

        return {
          id: row["ID"],
          system: row["システム"],
          plName: row["PL名"],
          pcName: row["PC名"],
          firstScenario: row["初登場シナリオ"],
          imageUrl: (row["画像URL"] || "").trim(),
          fontFamily: row["フォント"] || "",
          remarks: row[REMARKS_HEADER] || "",
          answers: answersArray,
        };
      })
      .filter(Boolean);
  }

  function parseCharacterCatalog(csvText) {
    const results = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    return results.data
      .map((row) => {
        if (!row["PL"] || !row["PC名"] || !row["卓名"]) return null;
        return {
          plName: row["PL"].trim(),
          pcName: row["PC名"].trim(),
          systemName: row["卓名"].trim(),
        };
      })
      .filter(Boolean);
  }

  function parseScenarioArchive(csvText) {
    const results = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    const archive = [];
    results.data.forEach((row) => {
      const scenarioName = row["シナリオ名"] || "";
      const pls = (row["PL"] || "")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const pcs = (row["PC"] || "")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const systemName = row["システム"] || "";

      pls.forEach((pl, index) => {
        if (pl && pcs[index]) {
          archive.push({
            scenarioName: scenarioName.trim(),
            plName: pl,
            pcName: pcs[index],
            systemName: systemName.trim(),
          });
        }
      });
    });
    return archive;
  }

  function setupFormAutofillListeners() {
    const pcNameSuggestions = document.getElementById("pc-name-suggestions");
    const scenarioSuggestions = document.getElementById("scenario-suggestions");
    let originalSystemOptions = [];
    if (dom.systemInput) {
      originalSystemOptions = Array.from(dom.systemInput.options).map((opt) =>
        opt.cloneNode(true)
      );
    }
    let debounceTimeout;
    function debounce(func, wait) {
      return function (...args) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => func.apply(this, args), wait);
      };
    }
    function handlePcInput() {
      const pcValue = dom.pcNameInput.value.trim();
      if (pcValue === "") {
        resetFormSelections();
        dom.pcNameInput.classList.remove("invalid");
        return;
      }
      resetSuggestions(true);
      if (pcValue.length < 1) return;
      const possibleChars = characterCatalog.filter(
        (c) => c.pcName === pcValue
      );
      if (possibleChars.length > 0) {
        dom.pcNameInput.classList.remove("invalid");
        if (dom.plNameInput.value.trim() === "") {
          dom.plNameInput.value = possibleChars[0].plName;
        }
        updateSystemSuggestions(possibleChars);
      } else {
        dom.pcNameInput.classList.add("invalid");
      }
    }
    function handlePlInput() {
      updatePcSuggestions();
    }
    function handleSystemChange() {
      updatePcSuggestions();
      updateScenarioSuggestions();
      if (window.updateCustomSelectDisplay)
        window.updateCustomSelectDisplay(dom.systemInput);
    }
    function updatePcSuggestions() {
      const plValue = dom.plNameInput.value.trim(),
        systemValue = dom.systemInput.value;
      pcNameSuggestions.innerHTML = "";
      dom.pcNameInput.classList.remove("invalid");
      if (plValue) {
        let filteredPcs = characterCatalog.filter((c) => c.plName === plValue);
        if (systemValue) {
          filteredPcs = filteredPcs.filter((c) =>
            c.systemName.startsWith(systemValue)
          );
        }
        const uniquePcs = [...new Set(filteredPcs.map((p) => p.pcName))];
        if (uniquePcs.length === 0 && systemValue) {
          dom.pcNameInput.classList.add("invalid");
        } else {
          uniquePcs.forEach((pc) => {
            pcNameSuggestions.appendChild(
              Object.assign(document.createElement("option"), { value: pc })
            );
          });
        }
      }
    }
    function updateSystemSuggestions(possibleChars) {
      const systemsForPc = [
        ...new Set(possibleChars.map((c) => c.systemName.split("-")[0].trim())),
      ];
      dom.systemInput.innerHTML =
        '<option value="">システムを選択してください</option>';
      systemsForPc.forEach((system) => {
        dom.systemInput.appendChild(
          Object.assign(document.createElement("option"), {
            value: system,
            textContent: system,
          })
        );
      });
      if (systemsForPc.length > 0) {
        dom.systemInput.value = systemsForPc[0];
      }
      buildCustomOptions(dom.systemInput);
      updateScenarioSuggestions();
    }
    function updateScenarioSuggestions() {
      (scenarioSuggestions.innerHTML = ""), (dom.firstScenarioInput.value = "");
      const plValue = dom.plNameInput.value.trim(),
        pcValue = dom.pcNameInput.value.trim(),
        systemValue = dom.systemInput.value;
      if (plValue && pcValue && systemValue) {
        const scenarios = [
          ...new Set(
            scenarioArchive
              .filter(
                (s) =>
                  s.plName === plValue &&
                  s.pcName === pcValue &&
                  s.systemName === systemValue
              )
              .map((s) => s.scenarioName)
          ),
        ];
        if (scenarios.length > 0) {
          dom.firstScenarioInput.value = scenarios[0];
          scenarios.forEach((scenario) => {
            scenarioSuggestions.appendChild(
              Object.assign(document.createElement("option"), {
                value: scenario,
              })
            );
          });
        }
      }
    }
    function resetFormSelections() {
      (pcNameSuggestions.innerHTML = ""),
        (scenarioSuggestions.innerHTML = ""),
        (dom.firstScenarioInput.value = ""),
        dom.pcNameInput.classList.remove("invalid");
      dom.systemInput.innerHTML = "";
      originalSystemOptions.forEach((option) =>
        dom.systemInput.appendChild(option.cloneNode(true))
      );
      dom.systemInput.value = "";
      buildCustomOptions(dom.systemInput);
    }
    function resetSuggestions(keepPcSuggestions = false) {
      if (!keepPcSuggestions) pcNameSuggestions.innerHTML = "";
      (scenarioSuggestions.innerHTML = ""), (dom.firstScenarioInput.value = "");
    }
    dom.pcNameInput.addEventListener("input", debounce(handlePcInput, 300));
    dom.plNameInput.addEventListener("input", debounce(handlePlInput, 300));
    dom.systemInput.addEventListener(
      "change",
      debounce(handleSystemChange, 100)
    );
  }

  function setupFormOptions(csvText) {
    try {
      const lines = csvText.trim().replace(/\r/g, "").split("\n");
      const plDataList = document.getElementById("pl-name-suggestions");
      const systemSelect = document.getElementById("form-system");
      if (!plDataList || !systemSelect) return;
      plDataList.innerHTML = "";
      systemSelect.innerHTML =
        '<option value="">システムを選択してください</option>';
      const plNames = new Set(),
        systems = new Set(),
        excludedSystems = ["CoC-㊙"];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        if (values.length < 3) continue;
        if (values[0].trim()) plNames.add(values[0].trim());
        let systemName = values[2].trim();
        if (systemName) {
          if (
            systemName.toLowerCase() === "ｻﾀｽﾍﾟ" ||
            systemName.toLowerCase() === "サタスペ"
          )
            systemName = "サタスペ";
          if (!excludedSystems.includes(systemName)) systems.add(systemName);
        }
      }
      [...plNames].sort().forEach((name) => {
        plDataList.appendChild(
          Object.assign(document.createElement("option"), { value: name })
        );
      });
      [...systems].sort().forEach((name) => {
        systemSelect.appendChild(
          Object.assign(document.createElement("option"), {
            value: name,
            textContent: name,
          })
        );
      });
    } catch (error) {
      console.error("フォームオプションの設定中にエラー:", error);
    }
  }

  function setupCustomSelects() {
    document.querySelectorAll(".custom-select-wrapper").forEach((wrapper) => {
      const originalSelect = wrapper.querySelector("select");
      if (!originalSelect || wrapper.dataset.initialized) return;
      wrapper.querySelector(".custom-select-trigger")?.remove();
      if (originalSelect.customOptionsContainer)
        originalSelect.customOptionsContainer.remove();
      const trigger = document.createElement("div");
      trigger.className = "custom-select-trigger";
      trigger.innerHTML = `<span></span><div class="arrow"></div>`;
      wrapper.appendChild(trigger);
      const optionsContainer = document.createElement("div");
      optionsContainer.className = "custom-select-options";
      document.body.appendChild(optionsContainer);
      originalSelect.customOptionsContainer = optionsContainer;
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isAlreadyOpen = optionsContainer.classList.contains("open");
        document
          .querySelectorAll(".custom-select-options.open")
          .forEach((oc) => oc.classList.remove("open"));
        document
          .querySelectorAll(".custom-select-wrapper.open")
          .forEach((w) => w.classList.remove("open"));
        if (!isAlreadyOpen) {
          wrapper.classList.add("open");
          optionsContainer.classList.add("open");
          const rect = trigger.getBoundingClientRect();
          optionsContainer.style.left = `${rect.left}px`;
          optionsContainer.style.top = `${rect.bottom + 2}px`;
          optionsContainer.style.width = `${rect.width}px`;
        }
      });
      originalSelect.addEventListener("change", () =>
        window.updateCustomSelectDisplay(originalSelect)
      );
      wrapper.dataset.initialized = "true";
    });
    window.addEventListener("click", () => {
      document
        .querySelectorAll(".custom-select-options.open")
        .forEach((oc) => oc.classList.remove("open"));
      document
        .querySelectorAll(".custom-select-wrapper.open")
        .forEach((w) => w.classList.remove("open"));
    });
  }

  function buildCustomOptions(selectElement) {
    if (!selectElement || !selectElement.customOptionsContainer) return;
    const optionsContainer = selectElement.customOptionsContainer;
    optionsContainer.innerHTML = "";
    Array.from(selectElement.options).forEach((optionEl) => {
      const customOption = document.createElement("div");
      customOption.className = "custom-option";
      customOption.textContent = optionEl.textContent;
      customOption.dataset.value = optionEl.value;
      const font =
        optionEl.dataset.font ||
        (selectElement.id === "form-fontFamily" ? optionEl.value : "");
      if (font && font !== "HigashiOme-Gothic-C") {
        customOption.style.fontFamily = `'${font}', sans-serif`;
      }
      customOption.addEventListener("click", (e) => {
        e.stopPropagation();
        selectElement.value = optionEl.value;
        selectElement.dispatchEvent(new Event("change", { bubbles: true }));
        optionsContainer.classList.remove("open");
        selectElement
          .closest(".custom-select-wrapper")
          ?.classList.remove("open");
      });
      optionsContainer.appendChild(customOption);
    });
    window.updateCustomSelectDisplay(selectElement);
  }

  window.updateCustomSelectDisplay = function (selectElement) {
    if (!selectElement) return;
    const wrapper = selectElement.closest(".custom-select-wrapper");
    const trigger = wrapper
      ? wrapper.querySelector(".custom-select-trigger")
      : null;
    const optionsContainer = selectElement.customOptionsContainer;
    const selectedOption = selectElement.options[selectElement.selectedIndex];

    if (trigger && selectedOption) {
      trigger.querySelector("span").textContent = selectedOption.textContent;
      if (selectElement.id === "form-system") {
        const systemColor =
          TRPG_SYSTEM_COLORS[selectedOption.value] || "#0d1a50";
        trigger.style.backgroundColor = systemColor;
        trigger.style.borderColor = systemColor;
        trigger.style.color = getContrastYIQ(systemColor);
      } else {
        trigger.style.backgroundColor = "";
        trigger.style.borderColor = "";
        trigger.style.color = "";
      }
      if (selectElement.id === "form-fontFamily") {
        const font = selectedOption.dataset.font || selectedOption.value;
        trigger.style.fontFamily =
          font && font !== "HigashiOme-Gothic-C" ? `'${font}', sans-serif` : "";
      } else if (selectElement.id !== "form-system") {
        trigger.style.fontFamily = "";
      }
    }
    if (optionsContainer) {
      optionsContainer.querySelectorAll(".custom-option").forEach((opt) => {
        opt.classList.toggle(
          "selected",
          opt.dataset.value === selectElement.value
        );
      });
    }
  };

  dom.openModalBtn?.addEventListener("click", () => {
    if (!dom.modal) return;
    formData = {};
    answers = {};
    currentQuestionIndex = 0;
    document.body.classList.add("modal-open");
    dom.modal.style.display = "flex";
    goToStep(1);
    [
      dom.pcNameInput,
      dom.plNameInput,
      dom.systemInput,
      dom.firstScenarioInput,
      dom.imageUrlInput,
      dom.chatInput,
      dom.fontFamilyInput,
    ].forEach((input) => {
      if (input) input.value = "";
    });
    if (window.updateCustomSelectDisplay) {
      updateCustomSelectDisplay(dom.systemInput);
      updateCustomSelectDisplay(dom.fontFamilyInput);
    }
    dom.chatContainer && (dom.chatContainer.innerHTML = "");
    dom.chatImageContainer && (dom.chatImageContainer.innerHTML = "");
    document.querySelector(".chat-input-area")?.classList.remove("inactive");
    if (dom.btnSendAnswer) {
      dom.btnSendAnswer.style.display = "block";
      dom.btnSendAnswer.disabled = false;
    }
    if (dom.btnFinish) dom.btnFinish.disabled = true;
  });
  dom.closeModalBtn?.addEventListener(
    "click",
    () => (dom.modal.style.display = "none")
  );
  // dom.modal?.addEventListener("click", e => { if (e.target === dom.modal) dom.modal.style.display = "none" });
  dom.btnStep1Next?.addEventListener("click", () => {
    (formData.pcName = dom.pcNameInput.value),
      (formData.plName = dom.plNameInput.value),
      (formData.system = dom.systemInput.value),
      (formData.firstScenario = dom.firstScenarioInput.value),
      (formData.fontFamily = dom.fontFamilyInput.value),
      goToStep(2);
  });
  dom.btnStep2Prev?.addEventListener("click", () => goToStep(1));
  dom.btnStep2Next?.addEventListener("click", () => {
    formData.imageUrl = dom.imageUrlInput.value;
    const proxiedImageUrl = createProxiedUrl(formData.imageUrl);

    dom.chatImageContainer.innerHTML = formData.imageUrl
      ? `<img src="${proxiedImageUrl}" alt="Character Image">`
      : "";

    let mobileImageHtml = "";
    if (formData.imageUrl) {
      mobileImageHtml = `<div class="qa-image-viewer-mobile"><img src="${createProxiedUrl(
        formData.imageUrl
      )}" alt="Character Image"></div>`;
    }
    const step3Container = dom.wizard.querySelector('[data-step="3"]');
    step3Container.querySelector(".qa-image-viewer-mobile")?.remove();
    if (mobileImageHtml) {
      step3Container.insertAdjacentHTML("afterbegin", mobileImageHtml);
    }

    goToStep(3);
    if ("" === dom.chatContainer.innerHTML.trim()) {
      askNextQuestion();
      // ★★★ こちらにも同様の遅延処理を追加 ★★★
      setTimeout(scrollToChatBottom, 510);
    }
  });
  dom.btnStep3Prev?.addEventListener("click", () => goToStep(2));
  dom.btnSendAnswer?.addEventListener("click", () => {
    let answer = dom.chatInput.value.trim();
    // ★★★ 修正点1: 「」だけの場合も空文字として扱う ★★★
    if (answer === "「」") {
      answer = "";
    }

    if (editingState.isEditing) {
      const qIndex = editingState.questionIndex;
      if (qIndex === questions.length) {
        formData.remarks = answer || ""; // 備考の更新
      } else {
        answers[`Q${qIndex + 1}`] = answer || "（未回答）";
      }
      editingState.bubbleElement.innerHTML = applySpoilerFormatting(
        answer || "（未回答）"
      );
      addSpoilerClickListeners(editingState.bubbleElement);
      exitEditMode();
    } else {
      if (currentQuestionIndex < questions.length) {
        const answerToStore = answer || "（未回答）";
        answers[`Q${currentQuestionIndex + 1}`] = answerToStore;
        addChatMessage(answerToStore, "answer", currentQuestionIndex);
      } else {
        // ★★★ 修正点2: 備考をformDataに直接保存 ★★★
        formData.remarks = answer || "";
        addChatMessage(answer || "（未回答）", "answer", currentQuestionIndex);
      }
      currentQuestionIndex++;
      dom.chatInput.value = "";
      askNextQuestion();
    }
  });
  dom.chatInput?.addEventListener("keydown", (e) => {
    if (e.key && "Enter" === e.key && !e.shiftKey) {
      e.preventDefault(), dom.btnSendAnswer.click();
    }
  });
  dom.btnFinish?.addEventListener("click", finishAndSubmit);

  let drumRollInterval;
  function startRandomSelection() {
    if (dom.randomCharButton && dom.plRandomInput && dom.randomCharResult) {
      const e = dom.plRandomInput.value.trim();
      if (!e)
        return void (dom.randomCharResult.textContent =
          "PL名を入力してください。");
      const t = characterCatalog.filter((t) => t.plName === e);
      if (0 === t.length)
        return void (dom.randomCharResult.textContent = `「${e}」さんのキャラクターが見つかりません。`);
      const n = document.getElementById("random-result-label"),
        o = dom.randomCharResult;
      (dom.randomCharButton.disabled = !0),
        clearInterval(drumRollInterval),
        (n.textContent = "選出中..."),
        (drumRollInterval = setInterval(() => {
          const e = Math.floor(Math.random() * t.length);
          o.innerHTML = `<span class="result-name">${t[e].pcName}</span>`;
        }, 50)),
        setTimeout(() => {
          clearInterval(drumRollInterval);
          const e = Math.floor(Math.random() * t.length),
            a = t[e];
          (n.textContent = "今日はこのキャラのを書いてみよう！"),
            (o.innerHTML = `<span class="result-name">${a.pcName}</span>`),
            o.classList.add("is-selected"),
            o.addEventListener(
              "animationend",
              () => o.classList.remove("is-selected"),
              { once: !0 }
            ),
            (dom.randomCharButton.disabled = !1);
        }, 2e3);
    }
  }
  dom.randomCharButton?.addEventListener("click", startRandomSelection);

  dom.reloadButton?.addEventListener("click", () => {
    // 既存のリストをクリアし、ローディング表示にする
    if (dom.characterList) {
      dom.characterList.innerHTML = "<p>キャラクターを再読み込み中...</p>";
    }
    if (dom.qaDetails) {
      dom.qaDetails.innerHTML =
        '<div class="qa-placeholder"><p>左のリストからキャラクターを選択してください。</p></div>';
    }
    // フィルターをリセット
    if (dom.plFilter)
      dom.plFilter.innerHTML = '<option value="all">すべてのPL</option>';
    if (dom.systemFilter)
      dom.systemFilter.innerHTML =
        '<option value="all">すべてのシステム</option>';
    if (dom.pcSearch) dom.pcSearch.value = "";

    // 再初期化
    initialize();
  });

  async function initialize() {
    console.log("Q&Aスクリプトの初期化を開始します。");
    try {
      setupCustomSelects();
      const [
        qandaResponse,
        catalogResponse,
        archiveResponse,
        pulldownResponse,
      ] = await Promise.all([
        fetch(SPREADSHEET_URL, { cache: "no-cache" }),
        fetch(CHAR_CATALOG_URL, { cache: "no-cache" }),
        fetch(SCENARIO_ARCHIVE_URL, { cache: "no-cache" }),
        fetch(PULLDOWN_SHEET_URL, { cache: "no-cache" }),
      ]);
      if (!qandaResponse.ok)
        throw new Error(`Q&Aデータの取得に失敗: ${qandaResponse.status}`);
      if (!catalogResponse.ok)
        throw new Error(
          `キャラ名鑑データの取得に失敗: ${catalogResponse.status}`
        );
      if (!archiveResponse.ok)
        throw new Error(
          `シナリオアーカイブの取得に失敗: ${archiveResponse.status}`
        );
      if (!pulldownResponse.ok)
        throw new Error(
          `プルダウン用データの取得に失敗: ${pulldownResponse.status}`
        );
      const [qandaCsv, catalogCsv, archiveCsv, pulldownCsv] = await Promise.all(
        [
          qandaResponse.text(),
          catalogResponse.text(),
          archiveResponse.text(),
          pulldownResponse.text(),
        ]
      );
      allCharacters = parseQandA(qandaCsv);
      characterCatalog = parseCharacterCatalog(catalogCsv);
      scenarioArchive = parseScenarioArchive(archiveCsv);
      renderCharacterList(allCharacters);
      setupFilters();
      setupFormOptions(pulldownCsv);
      buildCustomOptions(dom.systemInput);
      buildCustomOptions(dom.fontFamilyInput);
      setupFormAutofillListeners();
      addSpoilerClickListeners(document.body);
      if (dom.openModalBtn) {
        dom.openModalBtn.disabled = false;
        dom.openModalBtn.textContent = "＋ 新規キャラクターを登録";
      }
    } catch (error) {
      console.error("初期化処理中にエラーが発生しました:", error);
      if (dom.characterList) {
        dom.characterList.innerHTML = `<p class="error" style="padding: 15px; font-size: 0.9em;"><strong>データの読み込みに失敗しました</strong><br><br><strong>エラー詳細:</strong><br>${error.message}</p>`;
      }
      if (dom.openModalBtn) {
        dom.openModalBtn.textContent = "読込エラー";
      }
    }
  }
  initialize();
});

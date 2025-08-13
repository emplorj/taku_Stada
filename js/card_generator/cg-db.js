// js/card_generator/cg-db.js

(function () {
  const S = window.CG_STATE;
  const UI = window.CG_UI_ELEMENTS;
  const {
    showCustomAlert,
    showCustomConfirm,
    parseDatabaseCsv,
    escapeHtml,
    replacePunctuation,
  } = window.CG_UTILS;
  const RENDERER = window.CG_RENDERER;
  const IMAGE = window.CG_IMAGE;

  const DB = {
    // GAS経由で画像をアップロード
    uploadImageViaGAS: (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const response = await fetch(S.GAS_WEB_APP_URL, {
              method: "POST",
              body: JSON.stringify({
                action: "uploadImage",
                image: e.target.result, // base64 data URL
                type: file.type,
                name: file.name,
              }),
              headers: { "Content-Type": "text/plain;charset=utf-8" },
            });

            const result = await response.json();
            if (result.status === "success") {
              resolve(result.url);
            } else {
              reject(new Error(result.message || "Upload failed via GAS"));
            }
          } catch (err) {
            console.error("GAS Upload Error:", err);
            reject(err);
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    },

    // DBにカードを保存
    handleDatabaseSave: async (isUpdate) => {
      const button = isUpdate ? UI.dbUpdateBtn : UI.dbCreateBtn;
      const originalButtonText = button.textContent;
      button.disabled = true;
      button.innerHTML = `<span class="spinner"></span> 処理中...`;

      try {
        let imageUrl = S.originalImageUrlForEdit || "DEFAULT";
        let overlayImageUrl = S.originalOverlayImageUrlForEdit || "";
        // ★★★ 変更箇所１：レアリティ用の変数を準備 ★★★
        let rarityValue = UI.raritySelect.value;

        // メイン画像のアップロード処理
        const imageUploadFile = UI.imageUpload.files[0];
        if (S.isNewImageSelected && imageUploadFile) {
          button.innerHTML = `<span class="spinner"></span> 画像1/3...`;
          imageUrl = await DB.uploadImageViaGAS(imageUploadFile);
        } else if (
          !S.originalImageUrlForEdit &&
          UI.cardImage.src.includes("now_painting")
        ) {
          imageUrl = "DEFAULT";
        }

        // オーバーレイ画像のアップロード処理
        const overlayUploadFile = UI.overlayImageUpload.files[0];
        if (S.isNewOverlayImageSelected) {
          if (overlayUploadFile) {
            button.innerHTML = `<span class="spinner"></span> 画像2/3...`;
            overlayImageUrl = await DB.uploadImageViaGAS(overlayUploadFile);
          } else {
            overlayImageUrl = "";
          }
        } else if (
          !UI.overlayImage.src ||
          UI.overlayImage.style.display === "none"
        ) {
          overlayImageUrl = "";
        }

        // ★★★ 変更箇所２：カスタムレアリティ画像のアップロード処理 ★★★
        const rarityUploadFile = UI.rarityImageUpload.files[0];
        if (rarityValue === "custom" && rarityUploadFile) {
          button.innerHTML = `<span class="spinner"></span> 画像3/3...`;
          // アップロードした画像のURLをrarityValueとして使用
          rarityValue = await DB.uploadImageViaGAS(rarityUploadFile);
        } else if (rarityValue === "custom" && !rarityUploadFile) {
          // カスタムが選択されているがファイルがない場合は「なし」として扱う
          rarityValue = "none";
        }

        const cardData = {
          name: UI.cardNameInput.value,
          color: UI.cardColorSelect.value,
          type: UI.cardTypeSelect.value,
          // ★★★ 変更箇所３：処理済みのrarityValueを使用 ★★★
          rarity: rarityValue,
          effect: UI.effectInput.value,
          flavor: UI.flavorInput.value,
          speaker: UI.flavorSpeakerInput.value,
          imageUrl,
          overlayImageUrl,
          sparkle: UI.sparkleCheckbox.checked,
          registrant: UI.registrantInput.value,
          artist: UI.artistInput.value,
          source: UI.sourceInput.value,
          notes: UI.notesInput.value,
          action: isUpdate ? "update" : "create",
        };
        if (isUpdate && S.currentEditingCardId)
          cardData.ID = S.currentEditingCardId;

        button.innerHTML = `<span class="spinner"></span> DB登録中...`;
        await DB.saveCardToDatabase(cardData);

        const message = isUpdate
          ? `カード「${escapeHtml(cardData.name) || "(無題)"}」を更新しました。`
          : `カード「${
              escapeHtml(cardData.name) || "(無題)"
            }」を新規登録しました。`;
        showCustomAlert(
          message + "\n\n（数秒後にデータベースタブで確認できます）"
        );

        UI.dbModalOverlay.classList.remove("is-visible");
        DB.clearEditingState();
        if (UI.tabDatabase.checked) setTimeout(DB.fetchAllCards, 2000);
      } catch (err) {
        console.error("DB保存エラー:", err);
        showCustomAlert(`処理に失敗しました: ${err.message}`);
      } finally {
        button.disabled = false;
        button.textContent = originalButtonText;
      }
    },

    saveCardToDatabase: (cardData) => {
      return fetch(S.GAS_WEB_APP_URL, {
        method: "POST",
        body: JSON.stringify(cardData),
        mode: "no-cors",
      });
    },

    deleteCard: async (cardId) => {
      try {
        await DB.saveCardToDatabase({ action: "delete", ID: cardId });
        showCustomAlert(
          `ID: ${cardId} の削除リクエストを送信しました。\n2秒後にリストを更新します。`
        );
        setTimeout(DB.fetchAllCards, 2000);
      } catch (error) {
        console.error("削除リクエスト失敗:", error);
        showCustomAlert("カードの削除に失敗しました。");
      }
    },

    fetchAllCards: async () => {
      UI.cardListContainer.innerHTML =
        "<p>データベースを読み込んでいます...</p>";
      try {
        const response = await fetch(S.SPREADSHEET_CSV_URL, {
          cache: "no-cache",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const csvText = await response.text();
        S.allCardsData = parseDatabaseCsv(csvText);
        DB.applyDbFiltersAndSort();
      } catch (error) {
        console.error("データ取得エラー:", error);
        UI.cardListContainer.innerHTML = `<p class="error">データ読み込みに失敗しました。<br>${error.message}</p>`;
      }
    },

    applyDbFiltersAndSort: () => {
      if (!S.allCardsData) return;
      let filteredCards = [...S.allCardsData];

      if (!S.activeColorFilters.has("all") && S.activeColorFilters.size > 0) {
        filteredCards = filteredCards.filter((card) =>
          S.activeColorFilters.has(card["色"])
        );
      }

      const searchTerm = UI.dbSearchInput.value.toLowerCase().trim();
      const searchField = UI.dbSearchField.value;

      if (searchTerm) {
        filteredCards = filteredCards.filter((card) => {
          const fields = {
            name: (card["カード名"] || "").toLowerCase(),
            registrant: (card["登録者"] || "").toLowerCase(),
            artist: (card["絵師"] || "").toLowerCase(),
          };
          return searchField === "all"
            ? Object.values(fields).some((f) => f.includes(searchTerm))
            : (fields[searchField] || "").includes(searchTerm);
        });
      }

      filteredCards.sort((a, b) => {
        switch (UI.dbSortSelect.value) {
          case "id-desc":
            return Number(b["ID"]) - Number(a["ID"]);
          case "id-asc":
            return Number(a["ID"]) - Number(b["ID"]);
          case "timestamp-desc":
            return (
              new Date(b["タイムスタンプ"] || 0) -
              new Date(a["タイムスタンプ"] || 0)
            );
          case "timestamp-asc":
            return (
              new Date(a["タイムスタンプ"] || 0) -
              new Date(b["タイムスタンプ"] || 0)
            );
          case "name-asc":
            return (a["カード名"] || "").localeCompare(b["カード名"] || "");
          case "name-desc":
            return (b["カード名"] || "").localeCompare(a["カード名"] || "");
          case "registrant-asc":
            return (a["登録者"] || "").localeCompare(b["登録者"] || "");
          case "artist-asc":
            return (a["絵師"] || "").localeCompare(b["絵師"] || "");
          default:
            return 0;
        }
      });
      DB.renderCardList(filteredCards);
    },

    renderCardList: (cards) => {
      UI.cardListContainer.innerHTML = "";
      if (cards.length === 0) {
        UI.cardListContainer.innerHTML = "<p>該当するカードはありません。</p>";
        return;
      }
      const fragment = document.createDocumentFragment();
      cards.forEach((card) => {
        const cardElement = document.createElement("div");
        cardElement.className = "db-card";
        cardElement.dataset.id = card["ID"];
        console.log("Card color from CSV:", card["色"]); // 追加
        const colorDetails = S.cardColorData[card["色"]] || {
          color: "#333",
          hover: "#1a1a1a",
          textColor: "#fff",
        };
        console.log("Resolved colorDetails:", colorDetails); // 追加

        cardElement.style.setProperty("--card-main-color", colorDetails.color);
        cardElement.style.setProperty("--card-dark-color", colorDetails.hover);
        cardElement.style.setProperty(
          "--card-text-color",
          colorDetails.textColor
        );

        let imageUrl = card["画像URL"];
        if (!imageUrl || imageUrl === "DEFAULT")
          imageUrl = "Card_asset/now_painting.png";

        const isChecked = S.selectedCardIds.has(card["ID"]) ? "checked" : "";

        cardElement.innerHTML = `
                    <div class="card-checkbox-container"><input type="checkbox" class="card-checkbox" data-id="${
                      card["ID"]
                    }" ${isChecked}></div>
                    <div class="db-card-image"><img src="${imageUrl}" alt="${escapeHtml(
          card["カード名"]
        )}" loading="lazy" crossorigin="anonymous" onerror="this.onerror=null;this.src='Card_asset/image_load_error.png';"></div>
                    <div class="db-card-info">
                        <h3 class="db-card-name" style="color: ${
                          colorDetails.textColor
                        }">${escapeHtml(card["カード名"])}</h3>
                        <p class="db-card-meta" style="color: ${
                          colorDetails.textColor
                        }">PL: ${escapeHtml(card["登録者"] || "N/A")}</p>
                        <p class="db-card-meta" style="color: ${
                          colorDetails.textColor
                        }">絵師: ${escapeHtml(card["絵師"] || "N/A")}</p>
                        <p class="db-card-id" style="color: ${
                          colorDetails.textColor
                        }; opacity: 0.8;">ID: ${card["ID"]}</p>
                    </div>
                    <div class="db-card-actions">
                        <button class="secondary-button save-btn">保存</button>
                        <button class="secondary-button edit-btn">編集</button>
                        <button class="secondary-button delete-btn" data-name="${escapeHtml(
                          card["カード名"] || ""
                        )}">削除</button>
                    </div>`;
        fragment.appendChild(cardElement);
      });
      UI.cardListContainer.appendChild(fragment);
    },

    setupColorFilterButtons: () => {
      const fragment = document.createDocumentFragment();
      const createButton = (id, details, isAll = false) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `color-filter-btn${isAll ? " active" : ""}`;
        btn.dataset.color = id;
        btn.textContent = details.name;
        btn.style.setProperty(
          "--filter-btn-background", // 変数名を変更
          isAll
            ? "#444" // 「全て」の背景色をグレーに変更
            : id === "虹" // idが「虹」の場合
            ? details.color // 虹のグラデーションを適用
            : details.color.startsWith("linear") // それ以外のlinear-gradientの場合
            ? "#888" // 現状維持のグレー
            : details.color // 通常の色
        );
        btn.style.setProperty(
          "--filter-btn-hover-text-color",
          details.textColor
        );
        return btn;
      };
      fragment.appendChild(
        createButton("all", { name: "全て", textColor: "#ffffff" }, true)
      );
      Object.entries(S.cardColorData).forEach(([id, details]) =>
        fragment.appendChild(createButton(id, details))
      );
      UI.dbColorFilterContainer.innerHTML = "";
      UI.dbColorFilterContainer.appendChild(fragment);
    },

    restoreAuthorNames: () => {
      UI.registrantInput.value =
        localStorage.getItem("cardGeneratorRegistrant") || "";
      UI.artistInput.value = localStorage.getItem("cardGeneratorArtist") || "";
    },

    clearEditingState: () => {
      S.currentEditingCardId = null;
      S.originalImageUrlForEdit = null;
      S.originalOverlayImageUrlForEdit = null;
      S.isNewImageSelected = false;
      S.isNewOverlayImageSelected = false;
      UI.imageUpload.value = "";
      UI.overlayImageUpload.value = "";
      const url = new URL(window.location);
      if (url.searchParams.has("id")) {
        url.searchParams.delete("id");
        window.history.pushState({}, "", url);
      }
    },

    handleUrlParameters: () => {
      const cardId = new URLSearchParams(window.location.search).get("id");
      if (cardId) {
        DB.loadCardForEditing(cardId);
      }
    },

    loadCardForEditing: async (cardId) => {
      document.getElementById("tab-generator").checked = true;
      await DB.loadCardDataIntoGenerator(cardId, true);
    },

    loadCardDataIntoGenerator: async (dataOrId, isEditing) => {
      try {
        let cardData;
        if (typeof dataOrId === "string") {
          cardData = S.allCardsData.find((card) => card["ID"] === dataOrId);
          if (!cardData && S.allCardsData.length > 0) {
            // DBデータがあるのに見つからない場合
            // 何もしないか、エラー表示
          } else if (!cardData) {
            // DBデータが空の場合
            await DB.fetchAllCards();
            cardData = S.allCardsData.find((card) => card["ID"] === dataOrId);
          }
          if (!cardData)
            throw new Error(`ID ${dataOrId}のカードが見つかりません。`);
        } else {
          cardData = dataOrId;
        }

        if (isEditing) {
          S.currentEditingCardId = dataOrId;
          S.isNewImageSelected = false;
          S.isNewOverlayImageSelected = false;
          S.originalImageUrlForEdit = cardData["画像URL"] || null;
          S.originalOverlayImageUrlForEdit =
            cardData["オーバーレイ画像URL"] || cardData["上絵画像URL"] || null;
        }

        DB.updatePreviewFromData(cardData, isEditing);
      } catch (error) {
        console.error("カードデータの読み込みエラー:", error);
        if (isEditing)
          showCustomAlert(
            `カード情報の読み込みに失敗しました。\n${error.message}`
          );
        DB.clearEditingState();
        if (typeof dataOrId !== "string") throw error; // Re-throw for batch processing
      }
    },

    restoreGeneratorState: (state) => {
      UI.cardNameInput.value = state.name;
      UI.cardColorSelect.value = state.color;
      UI.cardTypeSelect.value = state.type;
      UI.backgroundSelect.value = state.background;
      UI.effectInput.value = state.effect;
      UI.flavorInput.value = state.flavor;
      UI.flavorSpeakerInput.value = state.speaker;
      UI.sparkleCheckbox.checked = state.sparkle;
      UI.cardImage.src = state.imageSrc;
      S.imageState = state.imageState;
      UI.overlayImage.src = state.overlaySrc;
      S.overlayImageState = state.overlayState;

      return new Promise((resolve) => {
        RENDERER.updatePreview();
        requestAnimationFrame(() => {
          IMAGE.updateImageTransform();
          if (UI.cardImage.complete) {
            resolve();
          } else {
            UI.cardImage.onload = resolve;
          }
        });
      });
    },

    openDatabaseModal: () => {
      if (S.currentEditingCardId) {
        UI.dbUpdateBtn.style.display = "block";
        UI.dbCreateBtn.style.display = "block";
        UI.dbUpdateBtn.textContent = "この内容で更新する";
        UI.dbCreateBtn.textContent = "この内容で複製して新規登録";
      } else {
        UI.dbUpdateBtn.style.display = "none";
        UI.dbCreateBtn.style.display = "block";
        UI.dbCreateBtn.textContent = "この内容で新規登録する";
      }
      UI.dbModalOverlay.classList.add("is-visible");
    },

    handleCardListClick: (e) => {
      const cardElement = e.target.closest(".db-card");
      if (!cardElement) return;
      const cardId = cardElement.dataset.id;
      if (!cardId) return;

      if (e.target.classList.contains("card-checkbox")) {
        DB.toggleCardSelection(cardId);
        return;
      }

      const button = e.target.closest("button");
      if (button) {
        e.stopPropagation();
        if (button.classList.contains("save-btn")) {
          // ★★★ 修正箇所：第2引数に button を渡し、どのボタンが押されたかを正しく伝える ★★★
          DB.downloadSingleCardFromDb(cardId, button);
        } else if (button.classList.contains("edit-btn")) {
          DB.loadCardForEditing(cardId);
        } else if (button.classList.contains("delete-btn")) {
          const cardName = button.dataset.name || "このカード";
          showCustomConfirm(
            `【確認】\nカード名: ${cardName} (ID: ${cardId})\n\n本当にこのカードを削除しますか？`
          ).then((confirmed) => {
            if (confirmed) DB.deleteCard(cardId);
          });
        }
        return;
      }
      DB.showCardDetail(cardId);
    },

    handleColorFilterClick: (e) => {
      const button = e.target.closest(".color-filter-btn");
      if (!button) return;

      const clickedColor = button.dataset.color;
      if (clickedColor === "all") {
        S.activeColorFilters.clear();
        S.activeColorFilters.add("all");
      } else {
        S.activeColorFilters.delete("all");
        if (S.activeColorFilters.has(clickedColor)) {
          S.activeColorFilters.delete(clickedColor);
        } else {
          S.activeColorFilters.add(clickedColor);
        }
        if (S.activeColorFilters.size === 0) {
          S.activeColorFilters.add("all");
        }
      }

      UI.dbColorFilterContainer
        .querySelectorAll(".color-filter-btn")
        .forEach((btn) => {
          btn.classList.toggle(
            "active",
            S.activeColorFilters.has(btn.dataset.color)
          );
        });
      DB.applyDbFiltersAndSort();
    },

    setupDatabaseDetailViewListeners: () => {
      const detailView = document.getElementById("db-detail-view");
      document
        .getElementById("db-back-to-list-btn")
        .addEventListener("click", () => {
          detailView.style.display = "none";
          document.getElementById("db-controls").style.display = "flex";
          UI.cardListContainer.style.display = "grid";
        });
      detailView.addEventListener("click", (e) => {
        const cardId = detailView.dataset.cardId;
        if (!cardId) return;
        const target = e.target.closest("button");
        if (!target) return;

        if (target.id === "db-info-download-btn") {
          const cardData = S.allCardsData.find((c) => c.ID === cardId);
          if (cardData) {
            IMAGE.downloadCard({
              container: document.getElementById("db-card-container"),
              cardData: cardData,
              button: target,
            });
          }
        } else if (target.id === "db-info-edit-btn") {
          DB.loadCardForEditing(cardId);
        } else if (target.id === "db-info-delete-btn") {
          const cardName =
            document.getElementById("db-info-name").textContent || "このカード";
          showCustomConfirm(
            `【確認】\nカード名: ${cardName} (ID: ${cardId})\n\n本当にこのカードを削除しますか？`
          ).then((confirmed) => {
            if (confirmed)
              DB.deleteCard(cardId).then(() =>
                document.getElementById("db-back-to-list-btn").click()
              );
          });
        }
      });
    },

    updatePreviewFromData: (data, fromDB = false) => {
      UI.cardColorSelect.value = data["色"] || data.color || "青";
      UI.cardTypeSelect.value = data["タイプ"] || data.type || "";
      UI.backgroundSelect.value = data["背景"] || data.background || "";
      UI.cardNameInput.value = data["カード名"] || data.cardName || "";
      UI.effectInput.value = data["効果説明"] || data.effect || "";
      UI.flavorInput.value = data["フレーバー"] || data.flavor || "";
      UI.flavorSpeakerInput.value = data["話者"] || data.speaker || "";

      // レアリティの処理を追加
      const rarityValue = data["レアリティ"] || data.rarity || "none";
      UI.raritySelect.value = rarityValue;
      if (rarityValue === "custom") {
        const customRarityImageUrl =
          data["カスタムレアリティ画像URL"] || data.customRarityImage || "";
        if (customRarityImageUrl) {
          S.customRarityImageUrl = customRarityImageUrl;
          UI.rarityImage.src = customRarityImageUrl;
          UI.rarityImage.style.display = "block";
          UI.rarityFileName.textContent = customRarityImageUrl.split("/").pop();
        } else {
          S.customRarityImageUrl = null;
          UI.rarityImage.style.display = "none";
          UI.rarityFileName.textContent = "選択されていません";
        }
      } else {
        S.customRarityImageUrl = null;
        UI.rarityImage.style.display = "none"; // デフォルトのレアリティ画像はupdatePreviewで設定される
      }

      const isSparkle =
        (data["キラ"] || data.sparkle)?.toString().toLowerCase() === "true";
      UI.sparkleCheckbox.checked = isSparkle;
      IMAGE.updateSparkleEffect();

      let imageUrl = data["画像URL"] || data.image || "";
      if (!imageUrl || imageUrl === "DEFAULT") {
        const isFullFrame = (data["タイプ"] || data.type || "")
          .toUpperCase()
          .includes("FF");
        UI.cardImage.src = isFullFrame
          ? "Card_asset/now_painting_FF.png"
          : "Card_asset/now_painting.png";
        if (fromDB) UI.imageFileName.textContent = "仁科ぬい";
      } else {
        const imageName = imageUrl.split("/").pop();
        UI.cardImage.src = S.localImageFiles[imageName] || imageUrl;
        if (fromDB) UI.imageFileName.textContent = imageName;
      }

      let overlayImageUrl =
        data["オーバーレイ画像URL"] || data["上絵画像URL"] || "";
      if (overlayImageUrl) {
        UI.overlayImage.src = overlayImageUrl;
        UI.overlayImage.style.display = "block";
        if (fromDB)
          UI.overlayImageFileName.textContent = overlayImageUrl
            .split("/")
            .pop();
      } else {
        window.CG_MAIN.resetOverlayImage();
      }

      RENDERER.updatePreview();
    },

    // Teikei Modal functions
    openTeikeiModal: async () => {
      if (S.teikeiCategories.length === 0) await DB.fetchTeikeiSentences();
      DB.renderTeikeiModal();
      UI.teikeiModalOverlay.classList.add("is-visible");
    },

    fetchTeikeiSentences: async () => {
      try {
        const response = await fetch("teikei.txt");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();

        S.teikeiCategories = [];
        const commonOptions = {};
        let currentCategory = { name: "その他", items: [] };

        const lines = text.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === "" || trimmed.startsWith("=")) continue;

          if (trimmed.startsWith("OPTIONS:")) {
            const content = trimmed.substring(8);
            const firstColonIndex = content.indexOf(":");
            if (firstColonIndex !== -1) {
              const key = content.substring(0, firstColonIndex).trim();
              const value = content.substring(firstColonIndex + 1).trim();
              commonOptions[key] = value.split(",").map((opt) => opt.trim());
            }
          } else if (trimmed.startsWith("---")) {
            if (currentCategory.items.length > 0)
              S.teikeiCategories.push(currentCategory);
            currentCategory = {
              name: trimmed.replace(/^-+|-+$/g, "").trim(),
              items: [],
            };
          } else if (!trimmed.startsWith("#")) {
            const parts = trimmed.split(" || ");
            const text = parts[0].trim();
            let options = [];
            if (parts.length > 1) {
              const optionSources = parts[1].split(",").map((s) => s.trim());
              optionSources.forEach((source) => {
                if (commonOptions[source]) {
                  options.push(...commonOptions[source]);
                } else {
                  options.push(source);
                }
              });
            }
            currentCategory.items.push({ text, options });
          }
        }
        if (currentCategory.items.length > 0)
          S.teikeiCategories.push(currentCategory);
        const otherCategoryIndex = S.teikeiCategories.findIndex(
          (cat) => cat.name === "その他"
        );
        if (
          otherCategoryIndex !== -1 &&
          S.teikeiCategories.length > 1 &&
          otherCategoryIndex !== S.teikeiCategories.length - 1
        ) {
          const otherCategory = S.teikeiCategories.splice(
            otherCategoryIndex,
            1
          )[0];
          S.teikeiCategories.push(otherCategory);
        }
      } catch (error) {
        console.error("定型文ファイルの処理中にエラー:", error);
        showCustomAlert("定型文ファイルの読み込みまたはパースに失敗しました。");
        S.teikeiCategories = [];
      }
    },

    renderTeikeiModal: () => {
      UI.teikeiListContainer.innerHTML = "";
      if (S.teikeiCategories.length === 0) {
        UI.teikeiListContainer.innerHTML =
          '<p style="color: #bdc3c7; text-align: center;">定型文が読み込めませんでした。</p>';
        return;
      }
      const isMobile = window.innerWidth <= 768;
      UI.teikeiListContainer.innerHTML = "";
      const renderItem = (item) => {
        const itemContainer = document.createElement("div");
        itemContainer.className = "teikei-item-container";
        const textButton = document.createElement("button");
        textButton.className = "teikei-btn";
        textButton.dataset.text = item.text;
        textButton.textContent = item.text;
        itemContainer.appendChild(textButton);
        if (item.options && item.options.length > 0) {
          const optionsDiv = document.createElement("div");
          optionsDiv.className = "teikei-options";
          item.options.forEach((option) => {
            const optionButton = document.createElement("button");
            optionButton.className = "teikei-option-btn";
            let replacedText = item.text;
            const placeholders = item.text.match(/【[^】]+】/g);
            if (placeholders && placeholders.length > 0) {
              // 最初のプレースホルダーを置換
              replacedText = item.text.replace(placeholders[0], option);
            }
            optionButton.dataset.text = replacedText;
            optionButton.textContent = option;
            optionsDiv.appendChild(optionButton);
          });
          itemContainer.appendChild(optionsDiv);
        }
        return itemContainer;
      };
      if (isMobile) {
        S.teikeiCategories.forEach((category) => {
          if (category.items.length === 0) return;
          const details = document.createElement("details");
          details.className = "teikei-accordion-item";
          details.open = ["期間", "対象", "その他"].includes(category.name);
          const summary = document.createElement("summary");
          summary.className = "teikei-accordion-summary";
          summary.innerHTML = `<h3>${category.name}</h3>`;
          details.appendChild(summary);
          const contentDiv = document.createElement("div");
          contentDiv.className = "teikei-accordion-content";
          category.items.forEach((item) =>
            contentDiv.appendChild(renderItem(item))
          );
          details.appendChild(contentDiv);
          UI.teikeiListContainer.appendChild(details);
        });
      } else {
        const tabNav = document.createElement("div");
        tabNav.className = "teikei-tab-nav";
        UI.teikeiListContainer.appendChild(tabNav);
        const tabContentWrapper = document.createElement("div");
        tabContentWrapper.className = "teikei-tab-content-wrapper";
        UI.teikeiListContainer.appendChild(tabContentWrapper);
        S.teikeiCategories.forEach((category, index) => {
          if (category.items.length === 0) return;
          const tabId = `teikei-tab-${index}`;
          const tabButton = document.createElement("button");
          tabButton.className = "teikei-tab-button";
          tabButton.textContent = category.name;
          tabButton.dataset.tab = tabId;
          tabNav.appendChild(tabButton);
          const tabContent = document.createElement("div");
          tabContent.className = "teikei-tab-content";
          tabContent.id = tabId;
          category.items.forEach((item) =>
            tabContent.appendChild(renderItem(item))
          );
          tabContentWrapper.appendChild(tabContent);
          if (index === 0) {
            tabButton.classList.add("active");
            tabContent.classList.add("active");
          }
        });
        tabNav.addEventListener("click", (e) => {
          if (e.target.classList.contains("teikei-tab-button")) {
            tabNav
              .querySelectorAll(".active")
              .forEach((el) => el.classList.remove("active"));
            tabContentWrapper
              .querySelectorAll(".active")
              .forEach((el) => el.classList.remove("active"));
            e.target.classList.add("active");
            document
              .getElementById(e.target.dataset.tab)
              .classList.add("active");
          }
        });
      }
    },

    handleTeikeiListClick: (e) => {
      const targetButton = e.target.closest(".teikei-btn, .teikei-option-btn");
      if (targetButton) {
        DB.insertTeikeiText(targetButton.dataset.text);
        UI.teikeiModalOverlay.classList.remove("is-visible");
      }
    },

    insertTeikeiText: (text) => {
      const textarea = document.getElementById("effect-input");
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const originalText = textarea.value;
      let newText =
        originalText.substring(0, startPos) +
        text +
        originalText.substring(endPos);
      let newCursorPos;

      const placeholderRegex = /【[^】]+?】/;
      let match = newText.match(placeholderRegex);

      if (match) {
        const placeholderStart = newText.indexOf(match[0]);
        newText = newText.replace(placeholderRegex, "");
        newCursorPos = placeholderStart;
      } else {
        newCursorPos = startPos + text.length;
      }

      textarea.value = newText;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      RENDERER.updatePreview();
    },
    toggleCardSelection: (cardId) => {
      const checkbox = document.querySelector(
        `.card-checkbox[data-id="${cardId}"]`
      );
      if (checkbox.checked) {
        S.selectedCardIds.add(cardId);
      } else {
        S.selectedCardIds.delete(cardId);
      }
      DB.updateBatchSelectionBar();
    },

    updateBatchSelectionBar: () => {
      if (S.selectedCardIds.size === 0) {
        UI.dbBatchSelectionBar.style.display = "none";
        return;
      }
      UI.dbBatchSelectionBar.style.display = "flex";
      UI.dbBatchSelectionBar.innerHTML = `
                <span class="selection-info">${S.selectedCardIds.size}件のカードを選択中</span>
                <div class="selection-actions">
                    <button id="db-batch-generate-btn" class="custom-file-upload">選択したカードをZIP保存</button>
                    <button id="db-batch-clear-btn" class="secondary-button">選択解除</button>
                </div>`;
      document
        .getElementById("db-batch-generate-btn")
        .addEventListener("click", DB.processDatabaseBatchDownload);
      document
        .getElementById("db-batch-clear-btn")
        .addEventListener("click", () => {
          S.selectedCardIds.clear();
          document
            .querySelectorAll(".card-checkbox:checked")
            .forEach((cb) => (cb.checked = false));
          DB.updateBatchSelectionBar();
        });
    },

    downloadSingleCardFromDb: async (cardId, button) => {
      const originalState = S.getCurrentGeneratorState();

      const originalButtonText = button.textContent;
      button.innerHTML = `<span class="spinner"></span> 準備中...`;
      button.disabled = true;

      // ジェネレーター本体を画面外に表示させる準備
      const generatorContent = document.getElementById("generator-content");
      const originalGeneratorStyle = generatorContent.style.cssText;

      try {
        const cardData = S.allCardsData.find((c) => c["ID"] === cardId);
        if (!cardData) throw new Error("カードデータが見つかりません");

        // ジェネレーターを画面外（左に9999px）に表示させる
        generatorContent.style.cssText += `
          position: absolute; 
          top: 0; 
          left: -9999px; 
          z-index: -1; 
          display: block !important;
        `;

        // ジェネレーターにデータをロード
        await DB.loadCardDataIntoGenerator(cardData, false);

        // 一時的にletter-spacingを変更
        const charKernElements =
          UI.cardContainer.querySelectorAll(".char-kern");
        const alphaKernElements =
          UI.cardContainer.querySelectorAll(".alpha-kern");
        let originalCharKernSpacings = [];
        let originalAlphaKernSpacings = [];

        charKernElements.forEach((el, i) => {
          originalCharKernSpacings[i] = el.style.letterSpacing;
          el.style.setProperty("letter-spacing", "0.1em", "important");
        });
        alphaKernElements.forEach((el, i) => {
          originalAlphaKernSpacings[i] = el.style.letterSpacing;
          el.style.setProperty("letter-spacing", "0.1em", "important");
        });

        // 読み込みと描画を確実に待つ
        await Promise.race([
          Promise.all([
            IMAGE.waitForCardImages(UI.cardContainer),
            document.fonts.ready,
          ]),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("画像読み込みタイムアウト")),
              10000
            )
          ),
        ]);
        await new Promise((r) =>
          requestAnimationFrame(() => setTimeout(r, 100))
        );

        // 完全に描画されたジェネレーターを画像化
        await IMAGE.downloadCard({
          container: UI.cardContainer,
          cardData: cardData,
          button: button,
        });

        // letter-spacingを元に戻す
        charKernElements.forEach((el, i) => {
          el.style.setProperty(
            "letter-spacing",
            originalCharKernSpacings[i],
            "important"
          );
        });
        alphaKernElements.forEach((el, i) => {
          el.style.setProperty(
            "letter-spacing",
            originalAlphaKernSpacings[i],
            "important"
          );
        });
      } catch (error) {
        console.error(`カード(ID: ${cardId})のダウンロード失敗:`, error);
        showCustomAlert("カード画像の生成に失敗しました: " + error.message);
        button.textContent = originalButtonText;
        button.disabled = false;
      } finally {
        // ジェネレーターの表示スタイルを元に戻す
        generatorContent.style.cssText = originalGeneratorStyle;
        // ジェネレーターの状態を元に戻す
        await DB.restoreGeneratorState(originalState);
      }
    },

    showCardDetail: (cardId) => {
      const cardData = S.allCardsData.find((card) => card["ID"] === cardId);
      if (!cardData) return;
      document.getElementById("db-controls").style.display = "none";
      document.getElementById("card-list-container").style.display = "none";
      const detailView = document.getElementById("db-detail-view");
      detailView.style.display = "flex";
      detailView.dataset.cardId = cardId;
      const infoWrapper = document.querySelector(".db-detail-info-wrapper");
      const colorDetails = S.cardColorData[cardData["色"]] || {
        color: "#0d1a50",
        hover: "#1a2c6d",
        textColor: "#bdc3c7",
      };
      infoWrapper.style.backgroundColor = colorDetails.color.startsWith(
        "linear"
      )
        ? colorDetails.hover
        : colorDetails.color;
      infoWrapper.style.borderColor = colorDetails.hover;

      document.getElementById("db-info-id").textContent = cardData["ID"];
      document.getElementById("db-info-name").textContent =
        cardData["カード名"] || "(無題)";
      document.getElementById("db-info-registrant").textContent =
        cardData["登録者"] || "N/A";
      document.getElementById("db-info-artist").textContent =
        cardData["絵師"] || "N/A";
      document.getElementById("db-info-effect").textContent =
        cardData["効果説明"] || "";
      const flavorSection = document.getElementById("db-info-flavor-section");
      if (cardData["フレーバー"]) {
        document.getElementById("db-info-flavor").textContent =
          cardData["フレーバー"];
        document.getElementById("db-info-speaker").textContent = cardData[
          "話者"
        ]
          ? `─── ${cardData["話者"]}`
          : "";
        flavorSection.style.display = "block";
      } else {
        flavorSection.style.display = "none";
      }
      const sourceSection = document.getElementById("db-info-source-section");
      if (cardData["元ネタ"]) {
        document.getElementById("db-info-source").textContent =
          cardData["元ネタ"];
        sourceSection.style.display = "block";
      } else {
        sourceSection.style.display = "none";
      }
      // テキストカラーも設定
      infoWrapper.querySelectorAll("h2, h4, p, span").forEach((el) => {
        if (el.id === "db-info-name" || el.tagName === "H4") {
          el.style.color = "#f0e6d2"; // タイトルやヘッダーは明るい色
        } else {
          el.style.color = colorDetails.textColor;
        }
      });
      const notesSection = document.getElementById("db-info-notes-section");
      if (cardData["備考"]) {
        document.getElementById("db-info-notes").textContent = cardData["備考"];
        notesSection.style.display = "block";
      } else {
        notesSection.style.display = "none";
      }
      DB.renderCardPreview(cardData, {
        container: document.getElementById("db-card-container"),
        template: document.getElementById("db-card-template-image"),
        cardImage: document.getElementById("db-card-image"),
        imageContainer: document.getElementById("db-image-container"),
        nameContent: document.getElementById("db-card-name-content"),
        nameContainer: document.getElementById("db-card-name-container"),
        effect: document.getElementById("db-effect-display"),
        flavor: document.getElementById("db-flavor-display"),
        speaker: document.getElementById("db-flavor-speaker-display"),
        textBox: document.getElementById("db-text-box-container"),
        background: document.getElementById("db-background-image"),
        sparkle: document.getElementById("db-sparkle-overlay-image"),
        overlayImage: document.getElementById("db-overlay-image"),
      });
    },

    processDatabaseBatchDownload: async () => {
      if (S.selectedCardIds.size === 0) {
        showCustomAlert("カードが選択されていません。");
        return;
      }

      const btn = document.getElementById("db-batch-generate-btn");
      const originalText = btn.textContent;
      btn.disabled = true;

      const zip = new JSZip();
      let count = 0;
      const originalState = S.getCurrentGeneratorState();

      const generatorContent = document.getElementById("generator-content");
      const originalGeneratorContentStyle = generatorContent.style.cssText;
      const originalPreviewWrapperStyle = UI.previewWrapper.style.cssText;
      const originalPreviewPanelStyle = UI.previewPanel.style.cssText;
      const originalCardContainerStyle = UI.cardContainer.style.cssText;

      generatorContent.style.cssText +=
        "display: block !important; position: absolute !important; left: -9999px !important;";
      UI.previewWrapper.style.cssText = `position: absolute !important; top: 0 !important; left: 0 !important; width: 480px !important; height: 720px !important; overflow: visible !important; z-index: -1 !important;`;
      UI.previewPanel.style.cssText = `width: 480px !important; height: 720px !important; transform: none !important; transform-origin: 0 0 !important;`;
      UI.cardContainer.style.width = "480px";
      UI.cardContainer.style.height = "720px";

      for (const cardId of S.selectedCardIds) {
        count++;
        btn.textContent = `処理中... (${count}/${S.selectedCardIds.size})`;

        try {
          const cardData = S.allCardsData.find((c) => c["ID"] === cardId);
          if (!cardData)
            throw new Error(`ID ${cardId} のカードが見つかりません。`);

          await DB.loadCardDataIntoGenerator(cardData, false);

          await Promise.all([IMAGE.waitForCardImages(), document.fonts.ready]);
          await new Promise((resolve) =>
            requestAnimationFrame(() => setTimeout(resolve, 50))
          );

          const fileName = `${(
            cardData["カード名"] || `card_${cardId}`
          ).replace(/[()`/\\?%*:|"<>]/g, "")}.png`;
          let imageBlob;
          const isSparkle = cardData["キラ"]?.toLowerCase() === "true";

          // 一時的にletter-spacingを変更
          const charKernElements =
            UI.cardContainer.querySelectorAll(".char-kern");
          const alphaKernElements =
            UI.cardContainer.querySelectorAll(".alpha-kern");
          let originalCharKernSpacings = [];
          let originalAlphaKernSpacings = [];

          charKernElements.forEach((el, i) => {
            originalCharKernSpacings[i] = el.style.letterSpacing;
            el.style.setProperty("letter-spacing", "0.1em", "important");
          });
          alphaKernElements.forEach((el, i) => {
            originalAlphaKernSpacings[i] = el.style.letterSpacing;
            el.style.setProperty("letter-spacing", "0.1em", "important");
          });

          if (isSparkle) {
            UI.sparkleCheckbox.checked = true;
            IMAGE.updateSparkleEffect();
            imageBlob = await IMAGE.createSparkleApngBlob();
            UI.sparkleCheckbox.checked = false;
            IMAGE.updateSparkleEffect();
          } else {
            const scale = UI.highResCheckbox.checked ? 2 : 1;
            const canvas = await RENDERER.html2canvas(UI.cardContainer, {
              backgroundColor: null,
              useCORS: true,
              scale: scale,
            });
            imageBlob = await new Promise((resolve) =>
              canvas.toBlob(resolve, "image/png")
            );
          }

          if (imageBlob && imageBlob.size > 0) {
            zip.file(fileName, imageBlob);
          } else {
            throw new Error("生成された画像データが空です。");
          }

          // letter-spacingを元に戻す
          charKernElements.forEach(
            (el) => (el.style.letterSpacing = originalCharKernSpacing)
          );
          alphaKernElements.forEach(
            (el) => (el.style.letterSpacing = originalAlphaKernSpacing)
          );
        } catch (err) {
          const cardData = S.allCardsData.find((c) => c["ID"] === cardId);
          const cardIdentifier = cardData ? cardData["カード名"] : cardId;
          console.error(
            `カード[${cardIdentifier}]の画像生成に失敗しました:`,
            err
          );
          zip.file(
            `ERROR_${cardIdentifier}.txt`,
            `このカードの生成に失敗しました。\nエラー: ${err.message}`
          );
        }
      }

      generatorContent.style.cssText = originalGeneratorContentStyle;
      UI.previewWrapper.style.cssText = originalPreviewWrapperStyle;
      UI.previewPanel.style.cssText = originalPreviewPanelStyle;
      UI.cardContainer.style.cssText = originalCardContainerStyle;
      await DB.restoreGeneratorState(originalState);

      btn.textContent = "ZIP圧縮中...";
      zip.generateAsync({ type: "blob" }).then((content) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "database_selection.zip";
        link.click();
        URL.revokeObjectURL(link.href);

        btn.textContent = "完了!";
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
          DB.clearCardSelection();
        }, 3000);
      });
    },
    renderCardPreview: (cardData, elements) => {
      // ★★★ この関数はcg-db.jsにあります ★★★
      const color = cardData["色"] || "青";
      const type = (cardData["タイプ"] || "").toUpperCase();
      const isFullFrame = type === "FF" || type === "FFCF";
      elements.template.src = `Card_asset/テンプレ/${color}カード${
        isFullFrame ? "FF" : ""
      }.png`;
      let imageUrl = cardData["画像URL"];
      if (imageUrl === "DEFAULT" || !imageUrl) {
        imageUrl = isFullFrame
          ? "Card_asset/now_painting_FF.png"
          : "Card_asset/now_painting.png";
      }
      elements.cardImage.src = imageUrl;
      elements.imageContainer.style.height = isFullFrame ? "720px" : "480px";
      let overlayImageUrl =
        cardData["オーバーレイ画像URL"] || cardData["上絵画像URL"];
      if (overlayImageUrl) {
        elements.overlayImage.src = overlayImageUrl;
        elements.overlayImage.style.display = "block";
      } else {
        elements.overlayImage.src = "";
        elements.overlayImage.style.display = "none";
      }
      RENDERER.updateCardNameForElement(
        cardData["カード名"] || "",
        elements.nameContent
      );
      elements.nameContent.classList.toggle(
        "title-styled",
        type === "CF" || type === "FFCF"
      );
      elements.nameContainer.style.backgroundImage =
        type === "CF" || type === "FFCF"
          ? "none"
          : `url('Card_asset/タイトル.png')`;
      elements.textBox.classList.toggle(
        "textbox-styled",
        type === "FF" || type === "FFCF"
      );

      // ★★★ 修正箇所 ★★★
      elements.effect.innerHTML = replacePunctuation(
        window.CG_UTILS.addSpacingToChars(cardData["効果説明"] || "")
      );

      const flavorText = replacePunctuation(cardData["フレーバー"] || "");
      const speakerText = replacePunctuation(cardData["話者"] || "");
      elements.flavor.style.display = flavorText ? "block" : "none";
      elements.speaker.style.display = speakerText ? "block" : "none";
      let flavorEl = elements.flavor.querySelector(".inner-text");
      if (!flavorEl) {
        elements.flavor.innerHTML = '<div class="inner-text"></div>';
        flavorEl = elements.flavor.querySelector(".inner-text");
      }
      flavorEl.innerHTML = flavorText.replace(/\n/g, "<br>");
      elements.speaker.innerText = speakerText ? `─── ${speakerText}` : "";
      RENDERER.adjustTextBoxLayout(
        elements.effect,
        elements.flavor,
        elements.speaker
      );
    },
  };

  window.CG_DB = DB;
})();

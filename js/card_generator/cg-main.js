// js/card_generator/cg-main.js

document.addEventListener("DOMContentLoaded", () => {
  // グローバルオブジェクトの存在を確認してから分割代入
  const S = window.CG_STATE;
  const UI = window.CG_UI_ELEMENTS;
  const RENDERER = window.CG_RENDERER;
  const IMAGE = window.CG_IMAGE;
  const DB = window.CG_DB;
  const BATCH = window.CG_BATCH;

  if (!S || !UI || !RENDERER || !IMAGE || !DB || !BATCH) {
    console.error(
      "Card Generatorのモジュールが不足しています。ファイルの読み込み順を確認してください。",
    );
    return;
  }

  const { updatePreview, scalePreview } = RENDERER;
  const {
    handleImageUpload,
    handleOverlayImageUpload,
    setupImageForDrag,
    setupOverlayImageForDrag,
    startDrag,
    handleZoom,
    downloadCard,
  } = IMAGE;
  const {
    handleDatabaseSave,
    fetchAllCards,
    applyDbFiltersAndSort,
    handleCardListClick,
  } = DB;
  const {
    handleBatchFileUpload,
    handleImageFolderUpload,
    processBatchDownload,
  } = BATCH;

  const MAIN = {
    initialize: () => {
      MAIN.setupEventListeners();
      MAIN.populateSelects();
      DB.setupColorFilterButtons();
      DB.restoreAuthorNames();
      updatePreview();
      MAIN.resetImage();
      scalePreview();
      MAIN.handleBatchSectionCollapse();
      DB.handleUrlParameters();
      DB.setupDatabaseDetailViewListeners();
    },

    setupEventListeners: () => {
      const controls = [
        UI.cardColorSelect,
        UI.cardTypeSelect,
        UI.backgroundSelect,
        UI.cardNameInput,
        UI.effectInput,
        UI.flavorInput,
        UI.flavorSpeakerInput,
      ];
      controls.forEach((el) => {
        el.addEventListener("change", updatePreview);
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          el.addEventListener("input", updatePreview);
        }
      });

      UI.imageUpload.addEventListener("change", handleImageUpload);
      UI.resetImageBtn.addEventListener("click", MAIN.resetImage);
      UI.overlayImageUpload.addEventListener(
        "change",
        handleOverlayImageUpload,
      );
      UI.resetOverlayImageBtn.addEventListener("click", MAIN.resetOverlayImage);
      UI.resetImagePositionBtn.addEventListener(
        "click",
        () => UI.cardImage.src && setupImageForDrag(),
      );
      UI.resetOverlayPositionBtn.addEventListener(
        "click",
        () => UI.overlayImage.src && setupOverlayImageForDrag(),
      );

      UI.editModeRadios.forEach((radio) =>
        radio.addEventListener("change", (e) => {
          S.activeManipulationTarget = e.target.value;
        }),
      );

      UI.previewArea.addEventListener("mousedown", startDrag);
      UI.previewArea.addEventListener("touchstart", startDrag, {
        passive: false,
      });
      UI.previewArea.addEventListener("wheel", handleZoom, { passive: false });
      UI.raritySelect.addEventListener("change", (e) => {
        if (e.target.value === "custom") {
          UI.rarityUploadGroup.style.display = "block";
        } else {
          UI.rarityUploadGroup.style.display = "none";
        }
        updatePreview();
      });
      UI.rarityImageUpload.addEventListener(
        "change",
        IMAGE.handleRarityImageUpload,
      );

      const handleDownload = (isTemplate) => {
        const cardData = {
          カード名: UI.cardNameInput.value,
          色: UI.cardColorSelect.value,
          タイプ: UI.cardTypeSelect.value,
          キラ: UI.sparkleCheckbox.checked,
        };
        downloadCard({
          container: UI.cardContainer,
          cardData,
          button: isTemplate ? UI.downloadTemplateBtn : UI.downloadBtn,
          isTemplate,
        });
      };

      UI.downloadBtn.addEventListener("click", () => handleDownload(false));
      UI.downloadTemplateBtn.addEventListener("click", () =>
        handleDownload(true),
      );
      UI.sparkleCheckbox.addEventListener("change", IMAGE.updateSparkleEffect);

      UI.openDbModalBtn.addEventListener("click", DB.openDatabaseModal);
      UI.modalCloseBtn.addEventListener("click", () =>
        UI.dbModalOverlay.classList.remove("is-visible"),
      );
      UI.dbModalOverlay.addEventListener("click", (e) => {
        if (e.target === UI.dbModalOverlay)
          UI.dbModalOverlay.classList.remove("is-visible");
      });
      UI.dbUpdateBtn.addEventListener("click", () => handleDatabaseSave(true));
      UI.dbCreateBtn.addEventListener("click", () => handleDatabaseSave(false));

      UI.registrantInput.addEventListener("input", () =>
        localStorage.setItem(
          "cardGeneratorRegistrant",
          UI.registrantInput.value,
        ),
      );
      UI.artistInput.addEventListener("input", () =>
        localStorage.setItem("cardGeneratorArtist", UI.artistInput.value),
      );

      UI.tabDatabase.addEventListener("change", () => {
        if (UI.tabDatabase.checked) {
          DB.clearEditingState();
          fetchAllCards();
        }
      });
      UI.dbColorFilterContainer.addEventListener(
        "click",
        DB.handleColorFilterClick,
      );
      UI.dbSearchInput.addEventListener("input", applyDbFiltersAndSort);
      UI.dbSearchField.addEventListener("change", applyDbFiltersAndSort);
      UI.dbSortSelect.addEventListener("change", applyDbFiltersAndSort);
      UI.cardListContainer.addEventListener("click", handleCardListClick);

      UI.openTeikeiModalBtn.addEventListener("click", DB.openTeikeiModal);
      UI.teikeiModalCloseBtn.addEventListener("click", () =>
        UI.teikeiModalOverlay.classList.remove("is-visible"),
      );
      UI.teikeiModalOverlay.addEventListener("click", (e) => {
        if (e.target === UI.teikeiModalOverlay)
          UI.teikeiModalOverlay.classList.remove("is-visible");
      });
      UI.teikeiListContainer.addEventListener(
        "click",
        DB.handleTeikeiListClick,
      );

      UI.batchFileUpload.addEventListener("change", handleBatchFileUpload);
      UI.imageFolderUpload.addEventListener("change", handleImageFolderUpload);
      UI.batchDownloadBtn.addEventListener("click", processBatchDownload);

      // テキスト設定UIを撤去したため、設定変更ハンドラは不要

      window.addEventListener("resize", scalePreview);
      window.addEventListener("resize", MAIN.handleBatchSectionCollapse);
    },

    populateSelects: () => {
      Object.entries(S.cardColorData).forEach(([id, details]) =>
        UI.cardColorSelect.add(
          new Option(`${details.name}：${details.description}`, id),
        ),
      );
      Object.entries(S.cardTypes).forEach(([key, details]) =>
        UI.cardTypeSelect.add(new Option(details.name, key)),
      );
      UI.cardColorSelect.value = "青";
    },

    resetImage: () => {
      DB.clearEditingState();
      const isFullFrame =
        UI.cardTypeSelect.value === "FF" || UI.cardTypeSelect.value === "FFCF";
      const src = isFullFrame
        ? "Card_asset/now_painting_FF.png"
        : "Card_asset/now_painting.png";
      UI.cardImage.src = src;
      UI.imageUpload.value = "";
      UI.imageFileName.textContent = "仁科ぬい";
      UI.cardImage.onload = () => {
        setupImageForDrag();
        IMAGE.checkDefaultImageTransparency(src);
      };
      IMAGE.checkDefaultImageTransparency(src);
      updatePreview();
    },

    resetOverlayImage: () => {
      UI.overlayImage.src = "";
      UI.overlayImage.style.display = "none";
      UI.overlayImageUpload.value = "";
      UI.overlayImageFileName.textContent = "選択されていません";
      S.overlayImageState = { x: 0, y: 0, scale: 1 };
      S.isNewOverlayImageSelected = true;
    },

    handleBatchSectionCollapse: () => {
      if (!UI.batchDetails) return;
      UI.batchDetails.open = window.innerWidth >= 1361;
    },
  };

  window.CG_MAIN = MAIN;
  MAIN.initialize();
});

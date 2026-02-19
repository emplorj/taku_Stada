// js/cg-ui.js

(function () {
  if (window.CG_UI_ELEMENTS) return;

  const get = (id) => document.getElementById(id);
  const query = (selector) => document.querySelector(selector);
  const queryAll = (selector) => document.querySelectorAll(selector);

  const CG_UI_ELEMENTS = {
    // メインコントロール
    cardColorSelect: get("card-color-select"),
    cardTypeSelect: get("card-type-select"),
    cardNameInput: get("card-name-input"),
    backgroundSelect: get("background-select"),
    imageUpload: get("image-upload"),
    imageFileName: get("image-file-name"),
    resetImageBtn: get("reset-image-btn"),
    effectInput: get("effect-input"),
    flavorInput: get("flavor-input"),
    flavorSpeakerInput: get("flavor-speaker-input"),
    downloadBtn: get("download-btn"),
    highResCheckbox: get("high-res-checkbox"),
    downloadTemplateBtn: get("download-template-btn"),
    sparkleCheckbox: get("sparkle-checkbox"),
    verticalOutputContainer: get("vertical-output-container"),
    verticalOutputCheckbox: get("vertical-output-checkbox"),
    overlayImageUpload: get("overlay-image-upload"),
    overlayImageFileName: get("overlay-image-file-name"),
    resetOverlayImageBtn: get("reset-overlay-image-btn"),
    editModeRadios: queryAll('input[name="edit-mode"]'),
    resetImagePositionBtn: get("reset-image-position-btn"),
    resetOverlayPositionBtn: get("reset-overlay-position-btn"),

    // プレビューエリア
    previewWrapper: query(".preview-wrapper"),
    previewPanel: query(".preview-panel"),
    previewArea: get("preview-area"),
    cardContainer: get("card-container"),
    backgroundImage: get("background-image"),
    cardTemplateImage: get("card-template-image"),
    imageContainer: get("image-container"),
    cardImage: get("card-image"),
    overlayImageContainer: get("overlay-image-container"),
    overlayImage: get("overlay-image"),
    sparkleOverlayImage: get("sparkle-overlay-image"),
    cardNameContainer: get("card-name-container"),
    cardNameContent: get("card-name-content"),
    textBoxContainer: get("text-box-container"),
    textCanvas: get("text-canvas"),
    dbTextCanvas: get("db-text-canvas"),
    raritySelect: get("rarity-select"),
    rarityUploadGroup: get("rarity-upload-group"),
    rarityImageUpload: get("rarity-image-upload"),
    rarityFileName: get("rarity-file-name"),
    rarityContainer: get("rarity-container"),
    rarityImage: get("rarity-image"),

    // バッチ処理
    batchDetails: query(".batch-processing-details"),
    batchFileUpload: get("batch-file-upload"),
    batchFileName: get("batch-file-name"),
    batchDownloadBtn: get("batch-download-btn"),
    batchProgress: get("batch-progress"),
    imageFolderUpload: get("image-folder-upload"),
    imageFolderName: get("image-folder-name"),

    // DBモーダル
    openDbModalBtn: get("open-db-modal-btn"),
    dbModalOverlay: get("db-modal-overlay"),
    modalCloseBtn: get("modal-close-btn"),
    dbUpdateBtn: get("db-update-btn"),
    dbCreateBtn: get("db-create-btn"),
    registrantInput: get("registrant-input"),
    artistInput: get("artist-input"),
    sourceInput: get("source-input"),
    notesInput: get("notes-input"),

    // 定型文モーダル
    openTeikeiModalBtn: get("open-teikei-modal-btn"),
    teikeiModalOverlay: get("teikei-modal-overlay"),
    teikeiModalCloseBtn: get("teikei-modal-close-btn"),
    teikeiListContainer: get("teikei-list-container"),

    // DBタブ
    tabDatabase: get("tab-database"),
    cardListContainer: get("card-list-container"),
    dbSearchInput: get("db-search-input"),
    dbSearchField: get("db-search-field"),
    dbSortSelect: get("db-sort-select"),
    dbColorFilterContainer: get("db-color-filter-container"),
    dbBatchSelectionBar: get("db-batch-selection-bar"),
  };

  window.CG_UI_ELEMENTS = CG_UI_ELEMENTS;
})();

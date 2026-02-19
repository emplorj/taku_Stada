// js/card_generator/cg-state.js

(function () {
  if (window.CG_STATE) return;

  const CG_STATE = {
    // 定数
    GAS_WEB_APP_URL:
      "https://script.google.com/macros/s/AKfycby0sdv9U56rGPoyTAViGNAAJGvG-IbmRCJKfodjr5NuzAyUc9n-dfH1UdDEqF0KHZ4U9g/exec",
    SPREADSHEET_CSV_URL:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXTIYBURfIYxyLgGle8sAnRMfpM9fitcL6zkchi2gblxxD65-DxOWVMm830Ogl-HQjZgQtWLaRMfwo/pub?gid=1713292859&single=true&output=csv",

    // カード色の定義
    cardColorData: {
      赤: {
        name: "赤",
        description: "BAD EVENT",
        color: "#990000",
        hover: "#7a0000",
        textColor: "#FFFFFF",
      },
      青: {
        name: "青",
        description: "GOOD EVENT",
        color: "#3366CC",
        hover: "#2851a3",
        textColor: "#FFFFFF",
      },
      緑: {
        name: "緑",
        description: "取得可能",
        color: "#009933",
        hover: "#007a29",
        textColor: "#FFFFFF",
      },
      黄: {
        name: "黄",
        description: "金銭、トレジャー",
        color: "#FFCC66",
        hover: "#d9ad52",
        textColor: "#2c3e50",
      },
      橙: {
        name: "橙",
        description: "その他",
        color: "#996633",
        hover: "#7a5229",
        textColor: "#FFFFFF",
      },
      紫: {
        name: "紫",
        description: "エネミー等",
        color: "#663366",
        hover: "#522952",
        textColor: "#FFFFFF",
      },
      白: {
        name: "白",
        description: "RPで切り抜ける",
        color: "#CCCCCC",
        hover: "#a3a3a3",
        textColor: "#2c3e50",
      },
      黒: {
        name: "黒",
        description: "フィールド",
        color: "#333333",
        hover: "#1a1a1a",
        textColor: "#FFFFFF",
      },
      虹: {
        name: "虹",
        description: "合体/激ヤバ",
        color:
          "linear-gradient(45deg, rgba(255,0,0,0.5), rgba(255,127,0,0.5), rgba(255,255,0,0.5), rgba(0,255,0,0.5), rgba(0,0,255,0.5), rgba(75,0,130,0.5), rgba(143,0,255,0.5))",
        hover:
          "linear-gradient(45deg, rgba(204,0,0,0.8), rgba(204,102,0,0.8), rgba(204,204,0,0.8), rgba(0,204,0,0.8), rgba(0,0,204,0.8), rgba(60,0,104,0.8), rgba(114,0,204,0.8))",
        textColor: "#FFFFFF",
      },
    },

    cardTypes: {
      "": { name: "標準" },
      CF: { name: "タイトル枠なし" },
      FF: { name: "フルフレーム" },
      FFCF: { name: "フルフレーム(タイトル枠なし)" },
      HF: { name: "横長" },
    },

    colorNameToIdMap: {
      赤: "赤",
      青: "青",
      緑: "緑",
      黄: "黄",
      橙: "橙",
      紫: "紫",
      白: "白",
      黒: "黒",
      虹: "虹",
    },

    // 状態変数
    isDragging: false,
    startX: 0,
    startY: 0,
    imageState: { x: 0, y: 0, scale: 1 },
    overlayImageState: { x: 0, y: 0, scale: 1 },
    imageFitDirection: "portrait",
    overlayImageFitDirection: "landscape",
    activeManipulationTarget: "base",
    currentEditingCardId: null,
    originalImageUrlForEdit: null,
    originalOverlayImageUrlForEdit: null,
    isNewImageSelected: false,
    isNewOverlayImageSelected: false,

    // データ
    allCardsData: [],
    activeColorFilters: new Set(["all"]),
    selectedCardIds: new Set(),
    teikeiCategories: [],
    batchData: [],
    localImageFiles: {},

    // 現在のジェネレータの状態を取得する関数
    getCurrentGeneratorState: function () {
      const UI = window.CG_UI_ELEMENTS;
      return {
        name: UI.cardNameInput.value,
        color: UI.cardColorSelect.value,
        type: UI.cardTypeSelect.value,
        background: UI.backgroundSelect.value,
        effect: UI.effectInput.value,
        flavor: UI.flavorInput.value,
        speaker: UI.flavorSpeakerInput.value,
        sparkle: UI.sparkleCheckbox.checked,
        imageSrc: UI.cardImage.src,
        imageState: { ...this.imageState },
        overlaySrc: UI.overlayImage.src,
        overlayState: { ...this.overlayImageState },
      };
    },

    textSettings: {
      effect: {
        lineHeight: 24,
        jpTracking: -1.2,
        alphaTracking: 0,
        maxLines: 7,
        kinsoku: "normal",
        ellipsis: true,
      },
      flavor: {
        lineHeight: 20,
        jpTracking: -1.5,
        alphaTracking: -0.15,
        maxLines: 2,
        kinsoku: "normal",
        ellipsis: true,
      },
      speaker: {
        lineHeight: 20,
        jpTracking: -1.5,
        alphaTracking: -0.1,
        maxLines: 1,
        kinsoku: "normal",
        ellipsis: true,
      },
    },
  };

  window.CG_STATE = CG_STATE;
})();

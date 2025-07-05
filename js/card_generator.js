// card_generator.js (v1.0.10 - Final Function Order Fix)
document.addEventListener("DOMContentLoaded", () => {
  // DOM要素の取得
  const cardColorSelect = document.getElementById("card-color-select");
  const cardTypeSelect = document.getElementById("card-type-select");
  const cardNameInput = document.getElementById("card-name-input");
  const backgroundSelect = document.getElementById("background-select");
  const imageUpload = document.getElementById("image-upload");
  const imageFileName = document.getElementById("image-file-name");
  const resetImageBtn = document.getElementById("reset-image-btn");
  const effectInput = document.getElementById("effect-input");
  const flavorInput = document.getElementById("flavor-input");
  const flavorSpeakerInput = document.getElementById("flavor-speaker-input");
  const downloadBtn = document.getElementById("download-btn");
  const highResCheckbox = document.getElementById("high-res-checkbox");
  const downloadTemplateBtn = document.getElementById("download-template-btn");
  const cardContainer = document.getElementById("card-container");
  const backgroundImage = document.getElementById("background-image");
  const cardTemplateImage = document.getElementById("card-template-image");
  const imageContainer = document.getElementById("image-container");
  const cardImage = document.getElementById("card-image");
  const cardNameContainer = document.getElementById("card-name-container");
  const cardNameContent = document.getElementById("card-name-content");
  const textBoxContainer = document.getElementById("text-box-container");
  const effectDisplay = document.getElementById("effect-display");
  const flavorDisplay = document.getElementById("flavor-display");
  const flavorSpeakerDisplay = document.getElementById(
    "flavor-speaker-display"
  );
  const batchFileUpload = document.getElementById("batch-file-upload");
  const batchFileName = document.getElementById("batch-file-name");
  const batchDownloadBtn = document.getElementById("batch-download-btn");
  const batchProgress = document.getElementById("batch-progress");
  const imageFolderUpload = document.getElementById("image-folder-upload");
  const imageFolderName = document.getElementById("image-folder-name");
  const previewWrapper = document.querySelector(".preview-wrapper");
  const previewPanel = document.querySelector(".preview-panel");
  const previewArea = document.getElementById("preview-area");
  const sparkleCheckbox = document.getElementById("sparkle-checkbox");
  const sparkleOverlayImage = document.getElementById("sparkle-overlay-image");
  const overlayImageUpload = document.getElementById("overlay-image-upload");
  const overlayImageFileName = document.getElementById(
    "overlay-image-file-name"
  );
  const resetOverlayImageBtn = document.getElementById(
    "reset-overlay-image-btn"
  );
  const overlayImageContainer = document.getElementById(
    "overlay-image-container"
  );
  const overlayImage = document.getElementById("overlay-image");
  const editModeRadios = document.querySelectorAll('input[name="edit-mode"]');
  const resetImagePositionBtn = document.getElementById(
    "reset-image-position-btn"
  );
  const resetOverlayPositionBtn = document.getElementById(
    "reset-overlay-position-btn"
  );
  const batchDetails = document.querySelector(".batch-processing-details");

  const openDbModalBtn = document.getElementById("open-db-modal-btn");
  const dbModalOverlay = document.getElementById("db-modal-overlay");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const dbUpdateBtn = document.getElementById("db-update-btn");
  const dbCreateBtn = document.getElementById("db-create-btn");
  const registrantInput = document.getElementById("registrant-input");
  const artistInput = document.getElementById("artist-input");

  const tabDatabase = document.getElementById("tab-database");
  const cardListContainer = document.getElementById("card-list-container");
  const dbSearchInput = document.getElementById("db-search-input");
  const dbSearchField = document.getElementById("db-search-field");
  const dbSortSelect = document.getElementById("db-sort-select");
  const dbColorFilterContainer = document.getElementById(
    "db-color-filter-container"
  );
  const dbBatchSelectionBar = document.getElementById("db-batch-selection-bar");

  const openTeikeiModalBtn = document.getElementById("open-teikei-modal-btn");
  const teikeiModalOverlay = document.getElementById("teikei-modal-overlay");
  const teikeiModalCloseBtn = document.getElementById("teikei-modal-close-btn");
  const teikeiListContainer = document.getElementById("teikei-list-container");

  const GAS_WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycby0sdv9U56rGPoyTAViGNAAJGvG-IbmRCJKfodjr5NuzAyUc9n-dfH1UdDEqF0KHZ4U9g/exec";
  const IMGBB_API_KEY = "906b0e42b775a8ba283f16cd35fb667f";

  let isDragging = false,
    startX,
    startY;
  let imageState = { x: 0, y: 0, scale: 1 },
    overlayImageState = { x: 0, y: 0, scale: 1 };
  let imageFitDirection, overlayImageFitDirection;
  let activeManipulationTarget = "base";
  let currentEditingCardId = null;
  let originalImageUrlForEdit = null,
    originalOverlayImageUrlForEdit = null,
    isNewImageSelected = false,
    isNewOverlayImageSelected = false;

  let allCardsData = [],
    selectedColorFilter = "all";
  let selectedCardIds = new Set();
  let teikeiCategories = [];
  let batchData = [],
    localImageFiles = {};
  const colorNameToIdMap = {
    赤: "赤",
    青: "青",
    緑: "緑",
    黄: "黄",
    橙: "橙",
    紫: "紫",
    白: "白",
    黒: "黒",
    虹: "虹",
  };

  const cardColorData = {
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
        "linear-gradient(45deg, #e74c3c, #f1c40f, #2ecc71, #3498db, #9b59b6)",
      hover:
        "linear-gradient(45deg, #c0392b, #e67e22, #27ae60, #2980b9, #8e44ad)",
      textColor: "#FFFFFF",
    },
  };
  const cardTypes = {
    "": { name: "標準" },
    CF: { name: "タイトル枠なし" },
    FF: { name: "フルフレーム" },
    FFCF: { name: "フルフレーム(タイトル枠なし)" },
  };

  // --- Start of Function Definitions (Correct Order) ---
  // All functions that are called by others should be defined before their callers.

  function adjustTextBoxLayout(effectEl, flavorEl, speakerEl) {
    requestAnimationFrame(() => {
      const totalHeight = 177.5;
      const effectMarginBottom = 1;

      const speakerHeight =
        speakerEl.style.display !== "none" ? speakerEl.offsetHeight : 0;
      const flavorHeight =
        flavorEl.style.display !== "none" ? flavorEl.offsetHeight : 0;
      const combinedFlavorHeight = flavorHeight + speakerHeight;

      const availableHeightForEffect =
        totalHeight - combinedFlavorHeight - effectMarginBottom;

      const effectStyle = window.getComputedStyle(effectEl);
      const effectLineHeight = parseFloat(effectStyle.lineHeight);

      if (effectLineHeight > 0) {
        const numberOfLines = Math.floor(
          availableHeightForEffect / effectLineHeight
        );
        effectEl.style.maxHeight = `${Math.max(
          0,
          numberOfLines * effectLineHeight
        )}px`;
      } else {
        effectEl.style.maxHeight = `${Math.max(0, availableHeightForEffect)}px`;
      }
    });
  }

  function updateCardName(text) {
    const segments = text.split("`");
    const htmlParts = segments.map((segment, index) => {
      if (index % 2 === 1) {
        const rubyMatch = segment.match(/(.+?)\((.+)\)/);
        if (rubyMatch) {
          return `<ruby><rb>${rubyMatch[1]}</rb><rt>${rubyMatch[2]}</rt></ruby>`;
        }
      }
      return `<span class="no-ruby">${segment
        .replace(/</g, "<")
        .replace(/>/g, ">")}</span>`;
    });
    const finalHtml = htmlParts.join("\u200B");
    cardNameContent.classList.toggle(
      "is-plain-text-only",
      !finalHtml.includes("<ruby>")
    );
    cardNameContent.innerHTML = `<span class="scaler">${finalHtml}</span>`;
    requestAnimationFrame(() => {
      const scalerEl = cardNameContent.querySelector(".scaler");
      if (!scalerEl) return;
      const availableWidth = cardNameContent.clientWidth;
      const trueTextWidth = scalerEl.scrollWidth;
      let scalerTransform = "none";
      if (trueTextWidth > availableWidth) {
        scalerTransform = `scaleX(${availableWidth / trueTextWidth})`;
      }
      scalerEl.style.transform = scalerTransform;
    });
  }

  function updateCardImageTransform() {
    cardImage.style.transform = `translate(${imageState.x}px, ${imageState.y}px) scale(${imageState.scale})`;
  }

  function updateOverlayImageTransform() {
    overlayImage.style.transform = `translate(${overlayImageState.x}px, ${overlayImageState.y}px) scale(${overlayImageState.scale})`;
  }

  function updateDraggableCursor() {
    const state =
      activeManipulationTarget === "base" ? imageState : overlayImageState;
    const image =
      activeManipulationTarget === "base" ? cardImage : overlayImage;
    const container =
      activeManipulationTarget === "base"
        ? imageContainer
        : overlayImageContainer;
    const fitDirection =
      activeManipulationTarget === "base"
        ? imageFitDirection
        : overlayImageFitDirection;
    if (!image.src) {
      previewArea.style.cursor = "default";
      return;
    }
    const canDrag =
      (fitDirection === "landscape" &&
        image.offsetWidth * state.scale > container.offsetWidth + 0.1) ||
      (fitDirection === "portrait" &&
        image.offsetHeight * state.scale > container.offsetHeight + 0.1) ||
      state.scale > 1.01;
    previewArea.style.cursor = canDrag ? "grab" : "default";
  }

  function setupImageForDrag() {
    imageState = { x: 0, y: 0, scale: 1 };
    const containerWidth = imageContainer.offsetWidth;
    const containerHeight = imageContainer.offsetHeight;
    const imageWidth = cardImage.naturalWidth;
    const imageHeight = cardImage.naturalHeight;
    if (imageWidth === 0 || imageHeight === 0) return;
    const containerAspect = containerWidth / containerHeight;
    const imageAspect = imageWidth / imageHeight;
    let newWidth, newHeight;
    if (imageAspect > containerAspect) {
      newHeight = containerHeight;
      newWidth = newHeight * imageAspect;
      imageFitDirection = "landscape";
    } else {
      newWidth = containerWidth;
      newHeight = newWidth / imageAspect;
      imageFitDirection = "portrait";
    }
    cardImage.style.width = `${newWidth}px`;
    cardImage.style.height = `${newHeight}px`;
    imageState.x = (containerWidth - newWidth) / 2;
    imageState.y = (containerHeight - newHeight) / 2;
    updateCardImageTransform(); // 変更
    updateDraggableCursor();
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  function getLuminance(hex) {
    if (!hex || !hex.startsWith("#")) return 0;
    let { r, g, b } = hexToRgb(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function updateThemeColor(details) {
    if (!details) return;
    const root = document.documentElement;
    const body = document.body;

    const mainColor = details.color;
    const darkColor = details.hover;
    const textColor = details.textColor;

    root.style.setProperty("--button-bg", mainColor);
    root.style.setProperty("--button-hover-bg", darkColor);
    root.style.setProperty("--button-color", textColor);
    root.style.setProperty("--controls-panel-bg", darkColor);
    root.style.setProperty("--theme-bg-main", darkColor);
    root.style.setProperty("--theme-input-bg", darkColor);
    root.style.setProperty("--theme-input-border", mainColor);
    root.style.setProperty("--modal-bg", darkColor);
    root.style.setProperty("--modal-border", mainColor);
    root.style.setProperty("--modal-input-bg", darkColor);
    root.style.setProperty("--modal-input-border", mainColor);
    root.style.setProperty("--theme-border", mainColor);

    const rgb = hexToRgb(mainColor);
    if (rgb) {
      root.style.setProperty("--button-bg-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    } else {
      root.style.setProperty("--button-bg-rgb", "52, 152, 219");
    }

    const isLightTheme = getLuminance(mainColor) > 160;
    body.classList.toggle("light-theme-ui", isLightTheme);
  }

  function checkImageTransparency(imageUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        try {
          const imageData = ctx.getImageData(0, 0, 1, 1).data;
          resolve(imageData[3] < 255);
        } catch (e) {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = imageUrl;
    });
  }

  function checkDefaultImageTransparency(src) {
    checkImageTransparency(src).then((hasTransparency) => {
      const backgroundGroup = document.getElementById(
        "background-select-group"
      );
      backgroundGroup.style.display = hasTransparency ? "block" : "none";
      if (hasTransparency) backgroundSelect.value = "hologram_geometric.png";
      else backgroundSelect.value = "";
      updatePreview();
    });
  }

  function updatePreview() {
    const selectedColorId = cardColorSelect.value;
    const selectedType = (cardTypeSelect.value || "").toUpperCase();
    const colorDetails = cardColorData[selectedColorId];
    cardNameContent.classList.remove("title-styled");
    textBoxContainer.classList.remove("textbox-styled");
    cardNameContainer.style.backgroundImage = `url('Card_asset/タイトル.png')`;
    imageContainer.style.transition = "none";
    const isFullFrame = selectedType === "FF" || selectedType === "FFCF";
    imageContainer.style.height = isFullFrame ? "720px" : "480px";
    void imageContainer.offsetHeight;
    imageContainer.style.transition = "";
    let templateName = `${selectedColorId}カード`;
    if (isFullFrame) {
      templateName += "FF";
    }
    if (selectedType === "CF") {
      cardNameContent.classList.add("title-styled");
      cardNameContainer.style.backgroundImage = "none";
    } else if (selectedType === "FF") {
      textBoxContainer.classList.add("textbox-styled");
    } else if (selectedType === "FFCF") {
      cardNameContent.classList.add("title-styled");
      textBoxContainer.classList.add("textbox-styled");
      cardNameContainer.style.backgroundImage = "none";
    }
    const isDefaultImage = cardImage.src.includes("now_painting");
    if (isDefaultImage) {
      const newSrc = isFullFrame
        ? "Card_asset/now_painting_FF.png"
        : "Card_asset/now_painting.png";
      if (!cardImage.src.endsWith(newSrc)) {
        cardImage.src = newSrc;
        cardImage.onload = () => {
          setupImageForDrag();
          checkDefaultImageTransparency(newSrc);
        };
      }
    }
    cardTemplateImage.src = `Card_asset/テンプレ/${templateName}.png`;
    const selectedBackground = backgroundSelect.value;
    backgroundImage.style.display = selectedBackground ? "block" : "none";
    if (selectedBackground)
      backgroundImage.src = `Card_asset/${selectedBackground}`;
    updateCardName(cardNameInput.value);
    const replacePunctuation = (text) =>
      text.replace(/、/g, "､").replace(/。/g, "｡");
    const addSpacingToChars = (text) =>
      text.replace(/([0-9\-])|([\(\)])/g, (match, kernChars, parenChars) => {
        if (kernChars) return `<span class="char-kern">${kernChars}</span>`;
        if (parenChars) return `<span class="paren-fix">${parenChars}</span>`;
        return match;
      });
    effectDisplay.innerHTML = addSpacingToChars(
      replacePunctuation(effectInput.value)
    );
    const flavorText = replacePunctuation(flavorInput.value.trim());
    const speakerText = replacePunctuation(flavorSpeakerInput.value.trim());
    flavorDisplay.style.display = flavorText ? "block" : "none";
    let el = flavorDisplay.querySelector(".inner-text");
    if (!el) {
      flavorDisplay.innerHTML = '<div class="inner-text"></div>';
      el = flavorDisplay.querySelector(".inner-text");
    }
    el.innerHTML = flavorText.replace(/\n/g, "<br>");
    flavorSpeakerDisplay.style.display = speakerText ? "block" : "none";
    if (speakerText) flavorSpeakerDisplay.innerText = `─── ${speakerText}`;

    adjustTextBoxLayout(effectDisplay, flavorDisplay, flavorSpeakerDisplay);

    updateThemeColor(colorDetails);
    requestAnimationFrame(setupImageForDrag);
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      isNewImageSelected = true;
      imageFileName.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        cardImage.src = imageUrl;
        cardImage.onload = () => {
          setupImageForDrag();
          checkImageTransparency(imageUrl).then((hasTransparency) => {
            const backgroundGroup = document.getElementById(
              "background-select-group"
            );
            if (hasTransparency) {
              backgroundGroup.style.display = "block";
              backgroundSelect.value = "hologram_geometric.png";
              updatePreview();
            } else {
              backgroundGroup.style.display = "none";
              if (backgroundSelect.value) {
                backgroundSelect.value = "";
                updatePreview();
              }
            }
          });
        };
      };
      reader.readAsDataURL(file);
    }
  }

  function setupOverlayImageForDrag() {
    overlayImageState = { x: 0, y: 0, scale: 1 };
    const containerWidth = overlayImageContainer.offsetWidth;
    const containerHeight = overlayImageContainer.offsetHeight;
    const imageWidth = overlayImage.naturalWidth;
    const imageHeight = overlayImage.naturalHeight;
    if (imageWidth === 0 || imageHeight === 0) return;
    const scaleToFitWidth = containerWidth / imageWidth;
    let newWidth = containerWidth;
    let newHeight = imageHeight * scaleToFitWidth;
    overlayImage.style.width = `${newWidth}px`;
    overlayImage.style.height = `${newHeight}px`;
    overlayImageState.x = 0;
    overlayImageState.y = 0; // 上寄せに変更
    updateOverlayImageTransform(); // 変更
  }

  function handleOverlayImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      isNewOverlayImageSelected = true;
      overlayImageFileName.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        overlayImage.src = e.target.result;
        overlayImage.style.display = "block";
        overlayImage.onload = setupOverlayImageForDrag;
      };
      reader.readAsDataURL(file);
    }
  }

  function resetOverlayImage() {
    overlayImage.src = "";
    overlayImage.style.display = "none";
    overlayImageUpload.value = "";
    overlayImageFileName.textContent = "選択されていません";
    overlayImageState = { x: 0, y: 0, scale: 1 };
    isNewOverlayImageSelected = true;
  }

  function resetImage() {
    clearEditingState();
    const isFullFrame =
      cardTypeSelect.value === "FF" || cardTypeSelect.value === "FFCF";
    const src = isFullFrame
      ? "Card_asset/now_painting_FF.png"
      : "Card_asset/now_painting.png";
    cardImage.src = src;
    imageUpload.value = "";
    imageFileName.textContent = "仁科ぬい";
    cardImage.onload = () => {
      setupImageForDrag();
      checkDefaultImageTransparency(src);
    };
    checkDefaultImageTransparency(src);
    updatePreview();
  }

  function startDrag(e) {
    if (previewArea.style.cursor === "default") return;
    e.preventDefault();
    isDragging = true;
    previewArea.style.cursor = "grabbing";
    const state =
      activeManipulationTarget === "base" ? imageState : overlayImageState;
    const touch = e.touches ? e.touches[0] : e;
    startX = touch.clientX - state.x;
    startY = touch.clientY - state.y;
    document.addEventListener("mousemove", dragImage);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", dragImage, { passive: false });
    document.addEventListener("touchend", stopDrag);
  }
  function dragImage(e) {
    if (!isDragging) return;
    const state =
      activeManipulationTarget === "base" ? imageState : overlayImageState;
    const fitDirection =
      activeManipulationTarget === "base"
        ? imageFitDirection
        : overlayImageFitDirection;
    const touch = e.touches ? e.touches[0] : e;

    // X軸の移動は常に許可
    if (fitDirection === "landscape" || state.scale > 1) {
      state.x = touch.clientX - startX;
    }

    // Y軸の移動は "base" の場合のみ許可
    if (
      activeManipulationTarget === "base" &&
      (fitDirection === "portrait" || state.scale > 1)
    ) {
      state.y = touch.clientY - startY;
    }

    if (activeManipulationTarget === "base") {
      clampCardImagePosition();
      updateCardImageTransform();
    } else {
      clampOverlayImagePosition();
      updateOverlayImageTransform();
    }
  }
  function stopDrag() {
    isDragging = false;
    updateDraggableCursor();
    document.removeEventListener("mousemove", dragImage);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchmove", dragImage);
    document.removeEventListener("touchend", stopDrag);
  }
  function handleZoom(e) {
    e.preventDefault();
    const state =
      activeManipulationTarget === "base" ? imageState : overlayImageState;
    const container =
      activeManipulationTarget === "base"
        ? imageContainer
        : overlayImageContainer;
    const scaleAmount = 0.1;
    const delta = e.deltaY > 0 ? -1 : 1;
    const oldScale = state.scale;
    state.scale = Math.max(1, Math.min(state.scale + delta * scaleAmount, 3));
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    state.x = mouseX - (mouseX - state.x) * (state.scale / oldScale);
    state.y = mouseY - (mouseY - state.y) * (state.scale / oldScale);
    if (activeManipulationTarget === "base") {
      clampCardImagePosition(); // 変更
      updateCardImageTransform(); // 変更
    } else {
      clampOverlayImagePosition(); // 変更
      updateOverlayImageTransform(); // 変更
    }
    updateDraggableCursor();
  }

  function clampCardImagePosition() {
    const state = imageState;
    const image = cardImage;
    const container = imageContainer;
    if (!image.src || !image.naturalWidth) return;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const scaledWidth = image.offsetWidth * state.scale;
    const scaledHeight = image.offsetHeight * state.scale;
    state.x = Math.max(containerWidth - scaledWidth, Math.min(0, state.x));
    // state.y は常に0に固定されているため、クランプは不要
    // state.y = Math.max(containerHeight - scaledHeight, Math.min(0, state.y));
  }

  function clampOverlayImagePosition() {
    const state = overlayImageState;
    const image = overlayImage;
    const container = overlayImageContainer;
    if (!image.src || !image.naturalWidth) return;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const scaledWidth = image.offsetWidth * state.scale;
    const scaledHeight = image.offsetHeight * state.scale;
    state.x = Math.max(containerWidth - scaledWidth, Math.min(0, state.x));
    state.y = Math.max(containerHeight - scaledHeight, Math.min(0, state.y));
  }

  async function downloadCard(isTemplate = false) {
    if (!isTemplate && sparkleCheckbox.checked) {
      return await generateSparkleApng();
    }

    const button = isTemplate
      ? downloadTemplateBtn
      : document.getElementById("download-btn");
    const originalButtonText = button.textContent;
    button.textContent = "生成中...";
    button.disabled = true;

    const generatorContent = document.getElementById("generator-content");
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const originalGeneratorContentStyle = generatorContent.style.cssText;
    const originalPreviewWrapperStyle = previewWrapper.style.cssText;
    const originalPreviewPanelStyle = previewPanel.style.cssText;
    const originalCardContainerStyle = cardContainer.style.cssText;
    const originalBodyOverflow = document.body.style.overflow;

    try {
      document.body.style.overflow = "hidden";
      generatorContent.style.cssText +=
        "display: block !important; position: absolute !important; left: -9999px !important;";
      previewWrapper.style.cssText = `position: absolute !important; top: 0 !important; left: 0 !important; width: 480px !important; height: 720px !important; overflow: visible !important; z-index: -1 !important;`;
      previewPanel.style.cssText = `width: 480px !important; height: 720px !important; transform: none !important; transform-origin: 0 0 !important;`;
      cardContainer.style.width = "480px";
      cardContainer.style.height = "720px";

      document.body.classList.add("is-rendering-output");

      await Promise.all([waitForCardImages(), document.fonts.ready]);
      await new Promise((resolve) =>
        requestAnimationFrame(() => setTimeout(resolve, 100))
      );

      const canvas = await html2canvas(cardContainer, {
        backgroundColor: null,
        useCORS: true,
        scale: highResCheckbox.checked ? 2 : 1,
        logging: true,
      });

      const isCanvasBlank = !canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height)
        .data.some((channel) => channel !== 0);

      if (isCanvasBlank) {
        throw new Error(
          "生成されたキャンバスが空白です。画像が正しく読み込まれていないか、描画タイミングの問題が発生しました。"
        );
      }

      const link = document.createElement("a");
      const fileName = isTemplate
        ? `${cardColorSelect.value}_${
            cardTypeSelect.value || "Standard"
          }_template.png`
        : `${(cardNameInput.value || "custom_card").replace(
            /[()`/\\?%*:|"<>]/g,
            ""
          )}.png`;
      link.download = fileName;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("画像生成に失敗しました。", err);
      showCustomAlert(
        "画像生成に失敗しました。時間をおいて試すか、コンソールで詳細を確認してください。\n" +
          err.message
      );
    } finally {
      document.body.classList.remove("is-rendering-output");
      generatorContent.style.cssText = originalGeneratorContentStyle;
      previewWrapper.style.cssText = originalPreviewWrapperStyle;
      previewPanel.style.cssText = originalPreviewPanelStyle;
      cardContainer.style.cssText = originalCardContainerStyle;
      document.body.style.overflow = originalBodyOverflow;
      window.scrollTo(scrollX, scrollY);

      button.textContent = originalButtonText;
      button.disabled = false;
    }
  }

  async function handleDatabaseSave(isUpdate) {
    const button = isUpdate ? dbUpdateBtn : dbCreateBtn;
    const originalButtonText = button.textContent;
    button.disabled = true;
    button.textContent = "処理を開始...";
    try {
      let imageUrl = originalImageUrlForEdit || "DEFAULT";
      let overlayImageUrl = originalOverlayImageUrlForEdit || "";

      if (!cardImage.src || cardImage.src.includes("now_painting")) {
        imageUrl = "DEFAULT";
      } else if (isNewImageSelected) {
        button.textContent = "メイン画像アップロード中...";
        const artworkBlob = await generateArtworkBlob(
          (cardTypeSelect.value || "").toUpperCase()
        );
        if (!artworkBlob || artworkBlob.size === 0)
          throw new Error("生成されたメイン画像データが空です。");
        const uploadFileName = `card_art_${new Date().getTime()}`;
        imageUrl = await uploadToImgBB(artworkBlob, uploadFileName);
      }

      if (overlayImage.src && isNewOverlayImageSelected) {
        button.textContent = "上絵画像アップロード中...";
        const overlayBlob = await new Promise((resolve) => {
          const canvas = document.createElement("canvas");
          canvas.width = overlayImage.naturalWidth;
          canvas.height = overlayImage.naturalHeight;
          canvas.getContext("2d").drawImage(overlayImage, 0, 0);
          canvas.toBlob(resolve, "image/png");
        });
        if (!overlayBlob || overlayBlob.size === 0)
          throw new Error("生成された上絵画像データが空です。");
        const uploadFileName = `card_overlay_${new Date().getTime()}`;
        overlayImageUrl = await uploadToImgBB(overlayBlob, uploadFileName);
      } else if (!overlayImage.src) {
        overlayImageUrl = "";
      }

      const cardData = {
        name: cardNameInput.value,
        color: cardColorSelect.value,
        type: cardTypeSelect.value,
        effect: effectInput.value,
        flavor: flavorInput.value,
        speaker: flavorSpeakerInput.value,
        imageUrl: imageUrl,
        overlayImageUrl: overlayImageUrl,
        registrant: registrantInput.value,
        artist: artistInput.value,
        source: document.getElementById("source-input").value,
        notes: document.getElementById("notes-input").value,
        action: isUpdate ? "update" : "create",
      };
      if (isUpdate && currentEditingCardId) cardData.ID = currentEditingCardId;
      button.textContent = "DBに登録中...";
      await saveCardToDatabase(cardData);
      const message = isUpdate
        ? `カード「${
            cardData.name || "(無題)"
          }」の更新リクエストを送信しました。`
        : `カード「${
            cardData.name || "(無題)"
          }」の新規登録リクエストを送信しました。`;
      showCustomAlert(
        message + "\n\n（数秒後にデータベースタブで確認できます）"
      );
      dbModalOverlay.classList.remove("is-visible");
      clearEditingState();
      if (tabDatabase.checked) setTimeout(fetchAllCards, 2000);
    } catch (err) {
      console.error("登録処理中にエラーが発生しました:", err);
      showCustomAlert(
        `処理に失敗しました。コンソールログを確認してください。\n詳細: ${err.message}`
      );
    } finally {
      button.disabled = false;
      button.textContent = originalButtonText;
    }
  }

  function saveCardToDatabase(cardData) {
    return new Promise(async (resolve, reject) => {
      if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.includes("xxxxxxxxxx"))
        return reject(new Error("GASのURLが設定されていません。"));
      try {
        await fetch(GAS_WEB_APP_URL, {
          method: "POST",
          mode: "no-cors",
          cache: "no-cache",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(cardData),
        });
        resolve({ status: "success" });
      } catch (error) {
        console.error("データベースへのリクエスト送信中にエラー:", error);
        reject(error);
      }
    });
  }

  async function deleteCard(cardId) {
    try {
      await saveCardToDatabase({ action: "delete", ID: cardId });
      showCustomAlert(
        `ID: ${cardId} の削除リクエストを送信しました。\n2秒後にリストを更新します。`
      );
      setTimeout(fetchAllCards, 2000);
    } catch (error) {
      console.error("削除リクエストの送信に失敗しました:", error);
      showCustomAlert("カードの削除に失敗しました。");
    }
  }

  function setupColorFilterButtons() {
    const allButton = document.createElement("button");
    allButton.type = "button";
    allButton.className = "color-filter-btn active";
    allButton.dataset.color = "all";
    allButton.textContent = "全て";
    allButton.style.borderColor = "#c8a464";
    dbColorFilterContainer.appendChild(allButton);

    Object.entries(cardColorData).forEach(([id, details]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "color-filter-btn";
      btn.dataset.color = id;
      btn.textContent = details.name;
      btn.style.borderColor = details.color.startsWith("linear")
        ? "#c8a464"
        : details.color;
      dbColorFilterContainer.appendChild(btn);
    });
  }

  function handleColorFilterClick(e) {
    if (e.target.classList.contains("color-filter-btn")) {
      dbColorFilterContainer
        .querySelector(".active")
        ?.classList.remove("active");
      e.target.classList.add("active");
      selectedColorFilter = e.target.dataset.color;
      applyDbFiltersAndSort();
    }
  }

  function handleCardListClick(e) {
    const cardElement = e.target.closest(".db-card");
    if (!cardElement) return;

    const cardId = cardElement.dataset.id;
    if (!cardId) return;

    if (e.target.classList.contains("card-checkbox")) {
      toggleCardSelection(cardId);
      return;
    }

    const button = e.target.closest("button");
    if (button) {
      e.preventDefault();
      e.stopPropagation();
      if (button.classList.contains("save-btn")) {
        button.textContent = "準備中...";
        downloadSingleCardFromDb(cardId).finally(() => {
          button.textContent = "保存";
        });
      } else if (button.classList.contains("edit-btn")) {
        document.getElementById("tab-generator").checked = true;
        requestAnimationFrame(() => loadCardForEditing(cardId));
      } else if (button.classList.contains("delete-btn")) {
        const cardName = button.dataset.name || "このカード";
        showCustomConfirm(
          `【確認】\nカード名: ${cardName} (ID: ${cardId})\n\n本当にこのカードを削除（アーカイブ）しますか？`
        ).then((confirmed) => {
          if (confirmed) deleteCard(cardId);
        });
      }
      return;
    }

    showCardDetail(cardId);
  }

  async function downloadSingleCardFromDb(cardId) {
    const originalState = getCurrentGeneratorState();
    try {
      await loadCardDataIntoGenerator(cardId, false);
      await downloadCard(false);
    } catch (error) {
      console.error(`カード(ID: ${cardId})のダウンロード準備に失敗:`, error);
      showCustomAlert("カード画像の生成に失敗しました。");
    } finally {
      await restoreGeneratorState(originalState);
    }
  }

  async function processDatabaseBatchDownload() {
    if (selectedCardIds.size === 0) {
      showCustomAlert("カードが選択されていません。");
      return;
    }

    const btn = document.getElementById("db-batch-generate-btn");
    const originalText = btn.textContent;
    btn.disabled = true;

    const zip = new JSZip();
    let count = 0;
    const originalState = getCurrentGeneratorState();

    const generatorContent = document.getElementById("generator-content");
    const originalGeneratorContentStyle = generatorContent.style.cssText;
    const originalPreviewWrapperStyle = previewWrapper.style.cssText;
    const originalPreviewPanelStyle = previewPanel.style.cssText;
    const originalCardContainerStyle = cardContainer.style.cssText;

    generatorContent.style.cssText +=
      "display: block !important; position: absolute !important; left: -9999px !important;";
    previewWrapper.style.cssText = `position: absolute !important; top: 0 !important; left: 0 !important; width: 480px !important; height: 720px !important; overflow: visible !important; z-index: -1 !important;`;
    previewPanel.style.cssText = `width: 480px !important; height: 720px !important; transform: none !important; transform-origin: 0 0 !important;`;
    cardContainer.style.width = "480px";
    cardContainer.style.height = "720px";

    for (const cardId of selectedCardIds) {
      count++;
      btn.textContent = `処理中... (${count}/${selectedCardIds.size})`;

      try {
        const cardData = allCardsData.find((c) => c["ID"] === cardId);
        if (!cardData)
          throw new Error(`ID ${cardId} のカードが見つかりません。`);

        await loadCardDataIntoGenerator(cardData, false);

        await Promise.all([waitForCardImages(), document.fonts.ready]);
        await new Promise((resolve) =>
          requestAnimationFrame(() => setTimeout(resolve, 50))
        );

        const fileName = `${(cardData["カード名"] || `card_${cardId}`).replace(
          /[()`/\\?%*:|"<>]/g,
          ""
        )}.png`;
        let imageBlob;
        const isSparkle = cardData["キラ"]?.toLowerCase() === "true";

        if (isSparkle) {
          sparkleCheckbox.checked = true;
          updateSparkleEffect();
          imageBlob = await createSparkleApngBlob();
          sparkleCheckbox.checked = false;
          updateSparkleEffect();
        } else {
          const scale = highResCheckbox.checked ? 2 : 1;
          const canvas = await html2canvas(cardContainer, {
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
      } catch (err) {
        const cardData = allCardsData.find((c) => c["ID"] === cardId);
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
    previewWrapper.style.cssText = originalPreviewWrapperStyle;
    previewPanel.style.cssText = originalPreviewPanelStyle;
    cardContainer.style.cssText = originalCardContainerStyle;
    await restoreGeneratorState(originalState);

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
        clearCardSelection();
      }, 3000);
    });
  }

  async function processBatchDownload() {
    if (batchData.length === 0) return;
    const zip = new JSZip();
    batchDownloadBtn.disabled = true;
    batchProgress.style.display = "block";
    const originalState = getCurrentGeneratorState();
    for (let i = 0; i < batchData.length; i++) {
      const cardData = batchData[i];
      batchProgress.textContent = `処理中... (${i + 1}/${batchData.length})`;
      await loadCardDataIntoGenerator(cardData, false);

      await Promise.all([waitForCardImages(), document.fonts.ready]);
      await new Promise((r) => setTimeout(r, 200));

      try {
        const fileName = `${(cardData.cardName || `card_${i + 1}`).replace(
          /[()`]/g,
          ""
        )}.png`;
        let imageBlob;
        if (cardData.sparkle) {
          imageBlob = await createSparkleApngBlob();
        } else {
          const canvas = await html2canvas(cardContainer, {
            backgroundColor: null,
            useCORS: true,
            scale: highResCheckbox.checked ? 2 : 1,
          });
          imageBlob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/png")
          );
        }
        if (imageBlob && imageBlob.size > 0) {
          zip.file(fileName, imageBlob);
        } else {
          throw new Error("Generated image blob is empty.");
        }
      } catch (err) {
        console.error(`カード[${cardData.cardName || i + 1}]の生成失敗:`, err);
        zip.file(
          `ERROR_${cardData.cardName || i + 1}.txt`,
          `エラー: ${err.message}`
        );
      }
    }
    restoreGeneratorState(originalState);
    batchProgress.textContent = "ZIP圧縮中...";
    zip.generateAsync({ type: "blob" }).then((content) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = "cards_batch.zip";
      link.click();
      URL.revokeObjectURL(link.href);
      batchProgress.textContent = "完了！";
      setTimeout(() => {
        batchProgress.style.display = "none";
        batchDownloadBtn.disabled = false;
      }, 3000);
    });
  }

  async function fetchAllCards() {
    cardListContainer.innerHTML = "<p>データベースを読み込んでいます...</p>";
    const SPREADSHEET_CSV_URL =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXTIYBURfIYxyLgGle8sAnRMfpM9fitcL6zkchi2gblxxD65-DxOWVMm830Ogl-HQjZgQtWLaRMfwo/pub?gid=1713292859&single=true&output=csv";
    try {
      const response = await fetch(SPREADSHEET_CSV_URL, { cache: "no-cache" });
      if (!response.ok)
        throw new Error(
          `データベースの読み込みに失敗しました: HTTP ${response.status}`
        );
      const csvText = await response.text();
      allCardsData = parseDatabaseCsv(csvText);
      applyDbFiltersAndSort();
    } catch (error) {
      console.error("データ取得エラー:", error);
      cardListContainer.innerHTML = `<p class="error">データの読み込みに失敗しました。<br>${error.message}</p>`;
    }
  }

  function applyDbFiltersAndSort() {
    if (!allCardsData) return;
    let filteredCards =
      selectedColorFilter === "all"
        ? [...allCardsData]
        : allCardsData.filter((card) => card["色"] === selectedColorFilter);

    const searchTerm = dbSearchInput.value.toLowerCase().trim();
    const searchField = dbSearchField.value;

    if (searchTerm) {
      filteredCards = filteredCards.filter((card) => {
        const name = (card["カード名"] || "").toLowerCase();
        const registrant = (card["登録者"] || "").toLowerCase();
        const artist = (card["絵師"] || "").toLowerCase();
        switch (searchField) {
          case "name":
            return name.includes(searchTerm);
          case "registrant":
            return registrant.includes(searchTerm);
          case "artist":
            return artist.includes(searchTerm);
          case "all":
          default:
            return (
              name.includes(searchTerm) ||
              registrant.includes(searchTerm) ||
              artist.includes(searchTerm)
            );
        }
      });
    }

    const sortValue = dbSortSelect.value;
    filteredCards.sort((a, b) => {
      switch (sortValue) {
        case "id-desc":
          return Number(b["ID"]) - Number(a["ID"]);
        case "id-asc":
          return Number(a["ID"]) - Number(b["ID"]);
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
    renderCardList(filteredCards);
  }

  function renderCardList(cards) {
    cardListContainer.innerHTML = "";
    if (cards.length === 0) {
      cardListContainer.innerHTML = "<p>該当するカードはありません。</p>";
      return;
    }
    cards.forEach((card) => {
      const cardElement = document.createElement("div");
      cardElement.className = "db-card";
      cardElement.dataset.id = card["ID"];

      const colorDetails = cardColorData[card["色"]] || {
        color: "#333",
        hover: "#1a1a1a",
        textColor: "#fff",
      };

      cardElement.style.setProperty("--card-main-color", colorDetails.color);
      cardElement.style.setProperty("--card-dark-color", colorDetails.hover);
      cardElement.style.setProperty(
        "--card-text-color",
        colorDetails.textColor
      );

      if (
        colorDetails.color &&
        colorDetails.color.startsWith("linear-gradient")
      )
        cardElement.style.background = colorDetails.color;
      else if (colorDetails.color)
        cardElement.style.backgroundColor = colorDetails.color;
      let textColor = colorDetails.textColor || "#FFFFFF";

      let imageUrl = card["画像URL"];
      if (imageUrl === "DEFAULT" || !imageUrl)
        imageUrl = "Card_asset/now_painting.png";
      else if (
        imageUrl.includes("drive.google.com/file/d/") ||
        imageUrl.includes("docs.google.com/file/d/")
      ) {
        const match = imageUrl.match(/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
        if (match && match[1])
          imageUrl = `https://corsproxy.io/?${encodeURIComponent(
            `https://drive.google.com/uc?export=view&id=${match[1]}`
          )}`;
      }

      const notesHTML = ""; // 備考欄は表示しない
      const isChecked = selectedCardIds.has(card["ID"]) ? "checked" : "";

      cardElement.innerHTML = `
                <div class="card-checkbox-container">
                    <input type="checkbox" class="card-checkbox" data-id="${
                      card["ID"]
                    }" ${isChecked}>
                </div>
                <div class="db-card-image"><img src="${imageUrl}" alt="${
        card["カード名"]
      }" loading="lazy" crossorigin="anonymous" onerror="this.onerror=null;this.src='Card_asset/image_load_error.png';"></div>
                <div class="db-card-info">
                    <h3 class="db-card-name" style="color: ${textColor};">${
        card["カード名"]
      }</h3>
                    <p class="db-card-meta" style="color: ${textColor};">PL: ${
        card["登録者"] || "N/A"
      }</p>
                    <p class="db-card-meta" style="color: ${textColor};">絵師: ${
        card["絵師"] || "N/A"
      }</p>
                    ${notesHTML}
                    <p class="db-card-id" style="color: ${textColor}; opacity: 0.8;">ID: ${
        card["ID"]
      }</p>
                </div>
                <div class="db-card-actions">
                    <button class="secondary-button save-btn">保存</button>
                    <button class="secondary-button edit-btn">編集</button>
                    <button class="secondary-button delete-btn" data-name="${
                      card["カード名"] || ""
                    }">削除</button>
                </div>`;
      cardListContainer.appendChild(cardElement);
    });
  }

  function toggleCardSelection(cardId) {
    const checkbox = document.querySelector(
      `.card-checkbox[data-id="${cardId}"]`
    );
    if (checkbox.checked) {
      selectedCardIds.add(cardId);
    } else {
      selectedCardIds.delete(cardId);
    }
    updateBatchSelectionBar();
  }

  function updateBatchSelectionBar() {
    if (selectedCardIds.size === 0) {
      dbBatchSelectionBar.style.display = "none";
      return;
    }
    dbBatchSelectionBar.style.display = "flex";
    dbBatchSelectionBar.innerHTML = `
            <span class="selection-info">${selectedCardIds.size}件のカードを選択中</span>
            <div class="selection-actions">
                <button id="db-batch-generate-btn" class="custom-file-upload">選択したカードをZIP保存</button>
                <button id="db-batch-clear-btn" class="secondary-button">選択解除</button>
            </div>
        `;
    document
      .getElementById("db-batch-generate-btn")
      .addEventListener("click", processDatabaseBatchDownload);
    document
      .getElementById("db-batch-clear-btn")
      .addEventListener("click", clearCardSelection);
  }

  function clearCardSelection() {
    selectedCardIds.clear();
    document
      .querySelectorAll(".card-checkbox:checked")
      .forEach((cb) => (cb.checked = false));
    updateBatchSelectionBar();
  }

  async function openTeikeiModal() {
    if (teikeiCategories.length === 0) await fetchTeikeiSentences();
    renderTeikeiModal();
    teikeiModalOverlay.classList.add("is-visible");
  }

  function handleTeikeiListClick(e) {
    const targetButton = e.target.closest(".teikei-btn, .teikei-option-btn");
    if (targetButton) {
      insertTeikeiText(targetButton.dataset.text);
      teikeiModalOverlay.classList.remove("is-visible");
    }
  }

  function insertTeikeiText(text) {
    const textarea = document.getElementById("effect-input");
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const originalText = textarea.value;
    let newText =
      originalText.substring(0, startPos) +
      text +
      originalText.substring(endPos);
    let newCursorPos;
    const ellipsisPlaceholderRegex = /【…】/;
    const otherPlaceholderRegex = /【[^】]+?】/;
    let matchEllipsis = newText.match(ellipsisPlaceholderRegex);
    if (matchEllipsis) {
      const placeholderStart = newText.indexOf(matchEllipsis[0]);
      newText = newText.replace(ellipsisPlaceholderRegex, "");
      newCursorPos = placeholderStart;
    } else {
      const matchOther = newText.match(otherPlaceholderRegex);
      if (matchOther) {
        newCursorPos = newText.indexOf(matchOther[0]) + 1;
      } else {
        newCursorPos = startPos + text.length;
      }
    }
    textarea.value = newText;
    textarea.focus();
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    updatePreview();
  }

  async function fetchTeikeiSentences() {
    try {
      const response = await fetch("teikei.txt");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();

      teikeiCategories = [];
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
            teikeiCategories.push(currentCategory);
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
        teikeiCategories.push(currentCategory);
      const otherCategoryIndex = teikeiCategories.findIndex(
        (cat) => cat.name === "その他"
      );
      if (
        otherCategoryIndex !== -1 &&
        teikeiCategories.length > 1 &&
        otherCategoryIndex !== teikeiCategories.length - 1
      ) {
        const otherCategory = teikeiCategories.splice(otherCategoryIndex, 1)[0];
        teikeiCategories.push(otherCategory);
      }
    } catch (error) {
      console.error("定型文ファイルの処理中にエラー:", error);
      showCustomAlert("定型文ファイルの読み込みまたはパースに失敗しました。");
      teikeiCategories = [];
    }
  }

  function renderTeikeiModal() {
    teikeiListContainer.innerHTML = "";
    if (teikeiCategories.length === 0) {
      teikeiListContainer.innerHTML =
        '<p style="color: #bdc3c7; text-align: center;">定型文が読み込めませんでした。</p>';
      return;
    }
    const isMobile = window.innerWidth <= 768;
    teikeiListContainer.innerHTML = "";
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
          const isNumericOption =
            !isNaN(parseFloat(option)) && isFinite(option);
          const placeholders = item.text.match(/【[^】]+】/g) || [];
          let targetPlaceholder = null;
          if (isNumericOption) {
            if (placeholders.includes("【N】")) {
              targetPlaceholder = "【N】";
            } else {
              targetPlaceholder = placeholders.find((p) => p !== "【…】");
              if (!targetPlaceholder) {
                targetPlaceholder = placeholders.find((p) => p === "【…】");
              }
            }
          } else {
            targetPlaceholder = placeholders.find(
              (p) => p !== "【N】" && p !== "【…】"
            );
            if (!targetPlaceholder) {
              targetPlaceholder = placeholders.find((p) => p === "【…】");
            }
            if (!targetPlaceholder) {
              targetPlaceholder = placeholders.find((p) => p === "【N】");
            }
          }
          if (!targetPlaceholder && placeholders.length === 1) {
            targetPlaceholder = placeholders[0];
          }
          if (targetPlaceholder) {
            replacedText = item.text.replace(targetPlaceholder, option);
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
      teikeiCategories.forEach((category) => {
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
        teikeiListContainer.appendChild(details);
      });
    } else {
      const tabNav = document.createElement("div");
      tabNav.className = "teikei-tab-nav";
      teikeiListContainer.appendChild(tabNav);
      const tabContentWrapper = document.createElement("div");
      tabContentWrapper.className = "teikei-tab-content-wrapper";
      teikeiListContainer.appendChild(tabContentWrapper);
      teikeiCategories.forEach((category, index) => {
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
          document.getElementById(e.target.dataset.tab).classList.add("active");
        }
      });
    }
  }

  function restoreAuthorNames() {
    registrantInput.value =
      localStorage.getItem("cardGeneratorRegistrant") || "";
    artistInput.value = localStorage.getItem("cardGeneratorArtist") || "";
  }

  function openDatabaseModal() {
    if (currentEditingCardId) {
      dbUpdateBtn.style.display = "block";
      dbCreateBtn.style.display = "block";
      dbUpdateBtn.textContent = "この内容で更新する";
      dbCreateBtn.textContent = "この内容で複製して新規登録";
    } else {
      dbUpdateBtn.style.display = "none";
      dbCreateBtn.style.display = "block";
      dbCreateBtn.textContent = "この内容で新規登録する";
    }
    dbModalOverlay.classList.add("is-visible");
  }

  function updateSparkleEffect() {
    sparkleOverlayImage.style.display = sparkleCheckbox.checked
      ? "block"
      : "none";
    highResCheckbox.disabled = sparkleCheckbox.checked;
    highResCheckbox.parentElement.style.opacity = sparkleCheckbox.checked
      ? "0.5"
      : "1";
    if (sparkleCheckbox.checked) highResCheckbox.checked = false;
  }

  function showCustomAlert(message) {
    const alertModal = document.createElement("div");
    alertModal.className = "custom-modal-overlay";
    alertModal.innerHTML = `
            <div class="custom-modal-content">
                <p>${message.replace(/\n/g, "<br>")}</p>
                <button id="custom-alert-ok-btn" class="primary-button">OK</button>
            </div>`;
    document.body.appendChild(alertModal);
    const okBtn = document.getElementById("custom-alert-ok-btn");
    okBtn.focus();
    okBtn.addEventListener("click", () => {
      document.body.removeChild(alertModal);
    });
    alertModal.addEventListener("click", (e) => {
      if (e.target === alertModal) {
        document.body.removeChild(alertModal);
      }
    });
  }

  function showCustomConfirm(message) {
    return new Promise((resolve) => {
      const confirmModal = document.createElement("div");
      confirmModal.className = "custom-modal-overlay";
      confirmModal.innerHTML = `
                <div class="custom-modal-content">
                    <p>${message.replace(/\n/g, "<br>")}</p>
                    <div class="custom-modal-actions">
                        <button id="custom-confirm-ok-btn" class="primary-button">はい</button>
                        <button id="custom-confirm-cancel-btn" class="secondary-button">いいえ</button>
                    </div>
                </div>`;
      document.body.appendChild(confirmModal);
      const okBtn = document.getElementById("custom-confirm-ok-btn");
      const cancelBtn = document.getElementById("custom-confirm-cancel-btn");
      okBtn.focus();
      okBtn.addEventListener("click", () => {
        document.body.removeChild(confirmModal);
        resolve(true);
      });
      cancelBtn.addEventListener("click", () => {
        document.body.removeChild(confirmModal);
        resolve(false);
      });
      confirmModal.addEventListener("click", (e) => {
        if (e.target === confirmModal) {
          document.body.removeChild(confirmModal);
          resolve(false);
        }
      });
    });
  }

  function handleBatchSectionCollapse() {
    if (!batchDetails) return;
    const isDesktop = window.innerWidth >= 1361;
    if (isDesktop) {
      batchDetails.open = true;
    } else {
      batchDetails.open = false;
    }
  }
  function parseDatabaseCsv(csvText) {
    const lines = csvText.trim().replace(/\r\n/g, "\n").split("\n");
    if (lines.length < 1) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;
      const values = [];
      let inQuotes = false;
      let currentField = "";
      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(currentField.trim());
          currentField = "";
        } else {
          currentField += char;
        }
      }
      values.push(currentField.trim());
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = values[index] || "";
      });
      data.push(entry);
    }
    return data.reverse();
  }
  function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const cardId = urlParams.get("id");
    if (cardId) {
      loadCardForEditing(cardId);
    }
  }

  async function loadCardForEditing(cardId) {
    document.getElementById("tab-generator").checked = true;
    await loadCardDataIntoGenerator(cardId, true);
  }

  async function loadCardDataIntoGenerator(dataOrId, updateUi) {
    try {
      let cardData;
      if (typeof dataOrId === "string") {
        cardData = allCardsData.find((card) => card["ID"] === dataOrId);
        if (!cardData) {
          const SPREADSHEET_CSV_URL =
            "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXTIYBURfIYxyLgGle8sAnRMfpM9fitcL6zkchi2gblxxD65-DxOWVMm830Ogl-HQjZgQtWLaRMfwo/pub?gid=1713292859&single=true&output=csv";
          const response = await fetch(SPREADSHEET_CSV_URL, {
            cache: "no-cache",
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const csvText = await response.text();
          const cards = parseDatabaseCsv(csvText);
          cardData = cards.find((card) => card["ID"] === dataOrId);
          if (!cardData)
            throw new Error(`ID ${dataOrId}のカードが見つかりません。`);
          allCardsData = cards;
        }
      } else {
        cardData = dataOrId;
      }

      if (updateUi && typeof dataOrId === "string") {
        currentEditingCardId = dataOrId;
        isNewImageSelected = false;
        isNewOverlayImageSelected = false;
        originalImageUrlForEdit = cardData["画像URL"] || null;
        originalOverlayImageUrlForEdit = cardData["上絵画像URL"] || null;
      }

      updatePreviewFromData(cardData, true);
    } catch (error) {
      console.error("カードデータの読み込みエラー:", error);
      if (updateUi)
        showCustomAlert(
          `カード情報の読み込みに失敗しました。\n${error.message}`
        );
      clearEditingState();
      throw error;
    }
  }

  function getCurrentGeneratorState() {
    return {
      name: cardNameInput.value,
      color: cardColorSelect.value,
      type: cardTypeSelect.value,
      background: backgroundSelect.value,
      effect: effectInput.value,
      flavor: flavorInput.value,
      speaker: flavorSpeakerInput.value,
      sparkle: sparkleCheckbox.checked,
      imageSrc: cardImage.src,
      imageState: { ...imageState },
      overlaySrc: overlayImage.src,
      overlayState: { ...overlayImageState },
    };
  }

  function restoreGeneratorState(state) {
    cardNameInput.value = state.name;
    cardColorSelect.value = state.color;
    cardTypeSelect.value = state.type;
    backgroundSelect.value = state.background;
    effectInput.value = state.effect;
    flavorInput.value = state.flavor;
    flavorSpeakerInput.value = state.speaker;
    sparkleCheckbox.checked = state.sparkle;
    cardImage.src = state.imageSrc;
    imageState = state.imageState;
    overlayImage.src = state.overlaySrc;
    overlayImageState = state.overlayState;
    return new Promise((resolve) => {
      updatePreview();
      requestAnimationFrame(() => {
        updateImageTransform();
        if (cardImage.complete) {
          resolve();
        } else {
          cardImage.onload = resolve;
        }
      });
    });
  }

  function scalePreview() {
    if (!previewWrapper || !previewPanel) return;
    const baseWidth = 480;
    const containerWidth = previewWrapper.offsetWidth;
    if (containerWidth < baseWidth) {
      const scale = containerWidth / baseWidth;
      previewPanel.style.transform = `scale(${scale})`;
    } else {
      previewPanel.style.transform = "none";
    }
  }
  function clearEditingState() {
    currentEditingCardId = null;
    originalImageUrlForEdit = null;
    originalOverlayImageUrlForEdit = null;
    isNewImageSelected = false;
    isNewOverlayImageSelected = false;
    const url = new URL(window.location);
    if (url.searchParams.has("id")) {
      url.searchParams.delete("id");
      window.history.pushState({}, "", url);
    }
  }
  async function generateArtworkBlob(cardType) {
    const elementsToModify = [
      document.getElementById("card-template-image"),
      document.getElementById("card-name-container"),
      document.getElementById("text-box-container"),
      document.getElementById("sparkle-overlay-image"),
    ];
    const originalStyles = [];
    try {
      elementsToModify.forEach((el) => {
        if (el) {
          originalStyles.push({
            element: el,
            originalDisplay: el.style.display,
          });
          el.style.display = "none";
        }
      });

      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      const fullCardCanvas = await html2canvas(cardContainer, {
        backgroundColor: null,
        useCORS: true,
      });
      const isFullFrame = cardType === "FF" || cardType === "FFCF";
      if (isFullFrame) {
        return await new Promise((resolve) =>
          fullCardCanvas.toBlob(resolve, "image/png")
        );
      } else {
        const croppedCanvas = document.createElement("canvas");
        croppedCanvas.width = 480;
        croppedCanvas.height = 480;
        const ctx = croppedCanvas.getContext("2d", {
          willReadFrequently: true,
        });
        ctx.drawImage(fullCardCanvas, 0, 0, 480, 480, 0, 0, 480, 480);
        return await new Promise((resolve) =>
          croppedCanvas.toBlob(resolve, "image/png")
        );
      }
    } finally {
      originalStyles.forEach((item) => {
        item.element.style.display = item.originalDisplay;
      });
    }
  }
  async function uploadToImgBB(imageBlob, fileName) {
    if (!IMGBB_API_KEY || IMGBB_API_KEY.includes("ここに")) {
      throw new Error("ImgBBのAPIキーが設定されていません。");
    }
    const formData = new FormData();
    formData.append("image", imageBlob);
    if (fileName) {
      formData.append("name", fileName);
    }
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      { method: "POST", body: formData }
    );
    if (!response.ok) {
      let errorDetails;
      try {
        const errorData = await response.json();
        errorDetails = errorData.error?.message || JSON.stringify(errorData);
      } catch (e) {
        errorDetails = await response.text();
      }
      throw new Error(
        `ImgBBへのアップロードに失敗しました (HTTP ${response.status}): ${errorDetails}`
      );
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(`ImgBB APIエラー: ${result.error.message}`);
    }
    return result.data.url;
  }

  function updatePreviewFromData(data, fromDB = false) {
    cardColorSelect.value = data["色"] || data.color || "青";
    cardTypeSelect.value = data["タイプ"] || data.type || "";
    const bg = data["背景"] || data.background || "";
    backgroundSelect.value = bg;
    cardNameInput.value = data["カード名"] || data.cardName || "";
    effectInput.value = data["効果説明"] || data.effect || "";
    flavorInput.value = data["フレーバー"] || data.flavor || "";
    flavorSpeakerInput.value = data["話者"] || data.speaker || "";

    const isSparkle =
      (data["キラ"] || data.sparkle)?.toString().toLowerCase() === "true";
    sparkleCheckbox.checked = isSparkle;
    updateSparkleEffect();

    let imageUrl = data["画像URL"] || data.image || "";
    let finalImageUrl = "";

    if (!imageUrl || imageUrl === "DEFAULT") {
      const selectedType = (data["タイプ"] || data.type || "").toUpperCase();
      const isFullFrame = selectedType === "FF" || selectedType === "FFCF";
      finalImageUrl = isFullFrame
        ? "Card_asset/now_painting_FF.png"
        : "Card_asset/now_painting.png";
      if (fromDB) {
        imageFileName.textContent = "仁科ぬい";
      }
    } else {
      const imageName = imageUrl.split("/").pop();
      if (localImageFiles[imageName]) {
        finalImageUrl = localImageFiles[imageName];
      } else if (
        fromDB &&
        (imageUrl.includes("drive.google.com") ||
          imageUrl.includes("docs.google.com"))
      ) {
        const match = imageUrl.match(/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
        finalImageUrl = match
          ? `https://corsproxy.io/?${encodeURIComponent(
              `https://drive.google.com/uc?export=view&id=${match[1]}`
            )}`
          : imageUrl;
      } else {
        finalImageUrl = imageUrl;
      }
      if (fromDB) {
        imageFileName.textContent = imageName;
      }
    }

    cardImage.crossOrigin = "Anonymous";
    cardImage.src = finalImageUrl;

    let overlayImageUrl = data["上絵画像URL"] || "";
    if (overlayImageUrl) {
      overlayImage.crossOrigin = "Anonymous";
      overlayImage.src = overlayImageUrl;
      overlayImage.style.display = "block";
      if (fromDB) {
        overlayImageFileName.textContent = overlayImageUrl.split("/").pop();
      }
    } else {
      resetOverlayImage();
    }
    // 画像が読み込まれた後に位置を調整
    overlayImage.onload = setupOverlayImageForDrag;

    updatePreview();
  }

  function setupDatabaseDetailViewListeners() {
    const detailView = document.getElementById("db-detail-view");
    document
      .getElementById("db-back-to-list-btn")
      .addEventListener("click", () => {
        detailView.style.display = "none";
        document.getElementById("db-controls").style.display = "flex";
        document.getElementById("card-list-container").style.display = "grid";
      });
    detailView.addEventListener("click", (e) => {
      const cardId = detailView.dataset.cardId;
      if (!cardId) return;
      if (e.target.id === "db-info-download-btn") {
        const btn = e.target;
        btn.textContent = "準備中...";
        downloadSingleCardFromDb(cardId).finally(
          () => (btn.textContent = "保存")
        );
      } else if (e.target.id === "db-info-edit-btn") {
        loadCardForEditing(cardId);
      } else if (e.target.id === "db-info-delete-btn") {
        const cardName =
          document.getElementById("db-info-name").textContent || "このカード";
        showCustomConfirm(
          `【確認】\nカード名: ${cardName} (ID: ${cardId})\n\n本当にこのカードを削除しますか？`
        ).then((confirmed) => {
          if (confirmed) {
            deleteCard(cardId).then(() =>
              document.getElementById("db-back-to-list-btn").click()
            );
          }
        });
      }
    });
  }

  function showCardDetail(cardId) {
    const cardData = allCardsData.find((card) => card["ID"] === cardId);
    if (!cardData) return;
    document.getElementById("db-controls").style.display = "none";
    document.getElementById("card-list-container").style.display = "none";
    const detailView = document.getElementById("db-detail-view");
    detailView.style.display = "flex";
    detailView.dataset.cardId = cardId;
    const infoWrapper = document.querySelector(".db-detail-info-wrapper");
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
      document.getElementById("db-info-speaker").textContent = cardData["話者"]
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
    const notesSection = document.getElementById("db-info-notes-section");
    if (cardData["備考"]) {
      document.getElementById("db-info-notes").textContent = cardData["備考"];
      notesSection.style.display = "block";
    } else {
      notesSection.style.display = "none";
    }
    renderCardPreview(cardData, {
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
  }

  function renderCardPreview(cardData, elements) {
    const color = cardData["色"] || "青";
    const type = (cardData["タイプ"] || "").toUpperCase();
    const isFullFrame = type === "FF" || type === "FFCF";
    elements.template.src = `Card_asset/テンプレ/${color}カード${
      isFullFrame ? "FF" : ""
    }.png`;
    let imageUrl = cardData["画像URL"];
    if (imageUrl === "DEFAULT" || !imageUrl)
      imageUrl = isFullFrame
        ? "Card_asset/now_painting_FF.png"
        : "Card_asset/now_painting.png";
    else if (imageUrl.includes("drive.google.com")) {
      const match = imageUrl.match(/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
      if (match)
        imageUrl = `https://corsproxy.io/?${encodeURIComponent(
          `https://drive.google.com/uc?export=view&id=${match[1]}`
        )}`;
    }
    elements.cardImage.crossOrigin = "Anonymous";
    elements.cardImage.src = imageUrl;
    elements.imageContainer.style.height = isFullFrame ? "720px" : "480px";

    let overlayImageUrl = cardData["上絵画像URL"];
    if (overlayImageUrl) {
      elements.overlayImage.crossOrigin = "Anonymous";
      elements.overlayImage.src = overlayImageUrl;
      elements.overlayImage.style.display = "block";
    } else {
      elements.overlayImage.src = "";
      elements.overlayImage.style.display = "none";
    }

    updateCardNameForPreview(
      cardData["カード名"] || "",
      elements.nameContent,
      elements.nameContainer
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
    const replacePunctuation = (text) =>
      text.replace(/、/g, "､").replace(/。/g, "｡");
    const addSpacingToChars = (text) =>
      text.replace(/([0-9\-])|([\(\)])/g, (match, kernChars, parenChars) => {
        if (kernChars) return `<span class="char-kern">${kernChars}</span>`;
        if (parenChars) return `<span class="paren-fix">${parenChars}</span>`;
        return match;
      });
    elements.effect.innerHTML = addSpacingToChars(
      replacePunctuation(cardData["効果説明"] || "")
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

    adjustTextBoxLayout(elements.effect, elements.flavor, elements.speaker);
  }

  function updateCardNameForPreview(text, contentEl, containerEl) {
    const segments = text.split("`");
    const htmlParts = segments.map((segment, index) => {
      if (index % 2 === 1) {
        const rubyMatch = segment.match(/(.+?)\((.+)\)/);
        if (rubyMatch)
          return `<ruby><rb>${rubyMatch[1]}</rb><rt>${rubyMatch[2]}</rt></ruby>`;
      }
      return `<span class="no-ruby">${segment
        .replace(/</g, "<")
        .replace(/>/g, ">")}</span>`;
    });
    const finalHtml = htmlParts.join("\u200B");
    contentEl.classList.toggle(
      "is-plain-text-only",
      !finalHtml.includes("<ruby>")
    );
    contentEl.innerHTML = `<span class="scaler">${finalHtml}</span>`;

    requestAnimationFrame(() => {
      const scalerEl = contentEl.querySelector(".scaler");
      if (!scalerEl) return;
      const availableWidth = contentEl.clientWidth;
      const trueTextWidth = scalerEl.scrollWidth;
      let scalerTransform = "none";
      if (trueTextWidth > availableWidth) {
        scalerTransform = `scaleX(${availableWidth / trueTextWidth})`;
      }
      scalerEl.style.transform = scalerTransform;
    });
  }
  function waitForCardImages() {
    const promises = [];
    const mainImage = document.getElementById("card-image");
    const overlayImg = document.getElementById("overlay-image");
    const bgImage = document.getElementById("background-image");

    const checkImageReady = (img) => {
      return new Promise((resolve, reject) => {
        if (!img.src || img.style.display === "none") {
          resolve();
          return;
        }
        if (img.complete && img.naturalHeight !== 0) {
          resolve();
          return;
        }
        img.onload = () => resolve();
        img.onerror = () =>
          reject(new Error(`画像の読み込みに失敗しました: ${img.src}`));
      });
    };

    promises.push(checkImageReady(mainImage));
    promises.push(checkImageReady(overlayImg));
    promises.push(checkImageReady(bgImage));

    return Promise.all(promises);
  }

  function handleBatchFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    batchFileName.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        if (file.name.endsWith(".json")) {
          batchData = JSON.parse(content);
        } else if (file.name.endsWith(".csv")) {
          batchData = parseCsv(content).map((item) => ({
            cardName: item["カード名"],
            color: colorNameToIdMap[item["色"]] || "青",
            type: item["タイプ"],
            background:
              item["背景"] === "◇"
                ? "hologram_geometric.png"
                : item["背景"] === "☆"
                ? "hologram_glitter.png"
                : "",
            image: item["イラスト"],
            effect: item["効果説明"],
            flavor: item["フレーバー"],
            speaker: item["フレーバー名"],
            sparkle: (item["キラ"] || "").toLowerCase() === "true",
          }));
        } else {
          throw new Error("サポートされていないファイル形式です。");
        }
        batchDownloadBtn.disabled = false;
        showCustomAlert(
          `${batchData.length}件のカードデータを読み込みました。`
        );
      } catch (error) {
        console.error("ファイル処理エラー:", error);
        showCustomAlert(`エラー: ${error.message}`);
        batchFileName.textContent = "選択されていません";
        batchDownloadBtn.disabled = true;
        batchData = [];
      }
    };
    reader.readAsText(file);
  }
  function parseCsv(csvText) {
    const lines = csvText.trim().replace(/\r\n/g, "\n").split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;
      const values = lines[i]
        .split(",")
        .map((v) => v.trim().replace(/^"(.*)"$/, "$1"));
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = values[index];
      });
      data.push(entry);
    }
    return data;
  }
  function handleImageFolderUpload(event) {
    const files = event.target.files;
    if (files.length === 0) return;
    localImageFiles = {};
    for (const file of files) {
      localImageFiles[file.name] = URL.createObjectURL(file);
    }
    imageFolderName.textContent = `${files.length}個の画像を選択`;
  }

  function populateSelects() {
    Object.entries(cardColorData).forEach(([id, details]) =>
      cardColorSelect.add(
        new Option(`${details.name}：${details.description}`, id)
      )
    );
    Object.entries(cardTypes).forEach(([key, details]) =>
      cardTypeSelect.add(new Option(details.name, key))
    );
    cardColorSelect.value = "青";
  }

  function initialize() {
    setupEventListeners();
    populateSelects();
    setupColorFilterButtons();
    restoreAuthorNames();
    updatePreview();
    resetImage();
    scalePreview();
    handleBatchSectionCollapse();
    handleUrlParameters();
    setupDatabaseDetailViewListeners();
  }

  function setupEventListeners() {
    ["change", "input"].forEach((event) => {
      [
        cardColorSelect,
        cardTypeSelect,
        backgroundSelect,
        cardNameInput,
        effectInput,
        flavorInput,
        flavorSpeakerInput,
      ].forEach((el) =>
        el.addEventListener(event, updatePreview, { passive: true })
      );
    });
    imageUpload.addEventListener("change", handleImageUpload);
    resetImageBtn.addEventListener("click", resetImage);
    overlayImageUpload.addEventListener("change", handleOverlayImageUpload);
    resetOverlayImageBtn.addEventListener("click", resetOverlayImage);
    resetImagePositionBtn.addEventListener(
      "click",
      () => cardImage.src && setupImageForDrag()
    );
    resetOverlayPositionBtn.addEventListener(
      "click",
      () => overlayImage.src && setupOverlayImageForDrag()
    );
    editModeRadios.forEach((radio) =>
      radio.addEventListener("change", (e) => {
        activeManipulationTarget = e.target.value;
      })
    );
    previewArea.addEventListener("mousedown", startDrag);
    previewArea.addEventListener("touchstart", startDrag, { passive: false });
    previewArea.addEventListener("wheel", handleZoom, { passive: false });
    downloadBtn.addEventListener("click", () => downloadCard(false));
    downloadTemplateBtn.addEventListener("click", () => downloadCard(true));
    sparkleCheckbox.addEventListener("change", updateSparkleEffect);
    openDbModalBtn.addEventListener("click", openDatabaseModal);
    modalCloseBtn.addEventListener("click", () =>
      dbModalOverlay.classList.remove("is-visible")
    );
    dbModalOverlay.addEventListener("click", (e) => {
      if (e.target === dbModalOverlay)
        dbModalOverlay.classList.remove("is-visible");
    });
    dbUpdateBtn.addEventListener("click", () => handleDatabaseSave(true));
    dbCreateBtn.addEventListener("click", () => handleDatabaseSave(false));
    registrantInput.addEventListener("input", () =>
      localStorage.setItem("cardGeneratorRegistrant", registrantInput.value)
    );
    artistInput.addEventListener("input", () =>
      localStorage.setItem("cardGeneratorArtist", artistInput.value)
    );
    tabDatabase.addEventListener("change", () => {
      if (tabDatabase.checked) {
        clearEditingState();
        fetchAllCards();
      }
    });
    dbColorFilterContainer.addEventListener("click", handleColorFilterClick);
    dbSearchInput.addEventListener("input", applyDbFiltersAndSort);
    dbSearchField.addEventListener("change", applyDbFiltersAndSort);
    dbSortSelect.addEventListener("change", applyDbFiltersAndSort);
    cardListContainer.addEventListener("click", handleCardListClick);
    openTeikeiModalBtn.addEventListener("click", openTeikeiModal);
    teikeiModalCloseBtn.addEventListener("click", () =>
      teikeiModalOverlay.classList.remove("is-visible")
    );
    teikeiModalOverlay.addEventListener("click", (e) => {
      if (e.target === teikeiModalOverlay)
        teikeiModalOverlay.classList.remove("is-visible");
    });
    teikeiListContainer.addEventListener("click", handleTeikeiListClick);
    batchFileUpload.addEventListener("change", handleBatchFileUpload);
    imageFolderUpload.addEventListener("change", handleImageFolderUpload);
    batchDownloadBtn.addEventListener("click", processBatchDownload);
    window.addEventListener("resize", scalePreview);
    window.addEventListener("resize", handleBatchSectionCollapse);
  }

  // --- End of Function Definitions ---

  initialize();
});

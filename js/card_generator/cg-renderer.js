// js/card_generator/cg-renderer.js (完全修正版)

(function () {
  const { escapeHtml, replacePunctuation, getLuminance, hexToRgb } =
    window.CG_UTILS;
  const S = window.CG_STATE;
  const UI = window.CG_UI_ELEMENTS;

  const RENDERER = {
    updateThemeColor: (details) => {
      if (!details) return;
      const root = document.documentElement;
      const body = document.body;
      const mainColor = details.color;
      const darkColor = details.hover;
      const textColor = details.textColor;
      root.style.setProperty("--button-bg", mainColor);
      root.style.setProperty("--button-hover-bg", darkColor);
      root.style.setProperty("--button-color", textColor);

      // 虹色の場合は特別なスタイルを適用
      if (mainColor.startsWith("linear-gradient")) {
        root.style.setProperty("--controls-panel-bg", "#1a2c6d"); // controls-panel背景をデフォルトの青
        root.style.setProperty("--theme-input-bg", "#0d1a50"); // 入力フィールド背景を濃い青
        root.style.setProperty("--theme-input-border", "#FF0000"); // 入力フィールドボーダーを赤
        root.style.setProperty("--theme-text-color", "#000000"); // プルダウン文字色を黒
      } else {
        // それ以外の色の場合は連動
        root.style.setProperty("--controls-panel-bg", darkColor);
        root.style.setProperty("--theme-input-bg", "#0d1a50"); // 入力フィールド背景を常に濃い青に
        root.style.setProperty("--theme-input-border", mainColor);
        root.style.setProperty("--theme-text-color", textColor);
      }
      root.style.setProperty("--theme-bg-main", darkColor);
      root.style.setProperty("--theme-input-bg", darkColor);
      // 入力フィールドのボーダー色を調整
      if (mainColor.startsWith("linear-gradient")) {
        root.style.setProperty("--theme-input-border", "#BDC3C7"); // 虹色の場合は明るいグレー
      } else {
        root.style.setProperty("--theme-input-border", mainColor); // それ以外は連動
      }
      const rgb = hexToRgb(mainColor);
      if (rgb) {
        root.style.setProperty(
          "--button-bg-rgb",
          `${rgb.r}, ${rgb.g}, ${rgb.b}`
        );
      } else {
        root.style.setProperty("--button-bg-rgb", "52, 152, 219");
      }
      const isLightTheme = mainColor.startsWith("linear")
        ? false
        : getLuminance(mainColor) > 160;
      body.classList.toggle("light-theme-ui", isLightTheme);
    },

    updateCardNameForElement: (text, contentEl) => {
      const segments = (text ?? "").split("`");
      const htmlParts = segments.map((segment, index) => {
        if (index % 2 === 1) {
          const m = segment.match(/(.+?)\((.+)\)/);
          if (m)
            return `<ruby><rb>${escapeHtml(m[1])}</rb><rt>${escapeHtml(
              m[2]
            )}</rt></ruby>`;
        }
        return `<span class="no-ruby">${escapeHtml(segment)}</span>`;
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

        // ★★★ 修正箇所：固定値ではなく、実際のコンテナの幅を取得する ★★★
        const availableWidth = contentEl.clientWidth;
        const trueTextWidth = scalerEl.scrollWidth;

        // 文字の幅が利用可能な幅を超えた場合のみ、縮小率を計算して適用
        scalerEl.style.transform =
          trueTextWidth > availableWidth
            ? `scaleX(${availableWidth / trueTextWidth})`
            : "none";
      });
    },

    updateCardName: (text) => {
      RENDERER.updateCardNameForElement(text, UI.cardNameContent);
    },

    _performLayoutAdjustment: (effectEl, flavorEl, speakerEl) => {
      if (!effectEl || !flavorEl || !speakerEl) return;
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
    },

    adjustTextBoxLayout: (effectEl, flavorEl, speakerEl) => {
      requestAnimationFrame(() => {
        RENDERER._performLayoutAdjustment(effectEl, flavorEl, speakerEl);
      });
    },

    forceAdjustTextBoxLayout: (effectEl, flavorEl, speakerEl) => {
      RENDERER._performLayoutAdjustment(effectEl, flavorEl, speakerEl);
    },
    updateRarityDisplay: () => {
      const rarityValue = UI.raritySelect.value;
      const showUpload = rarityValue === "custom";

      UI.rarityUploadGroup.style.display = showUpload ? "block" : "none";

      // カスタムが選択されているが、ファイルがまだ選ばれていない場合は非表示
      if (showUpload && !UI.rarityImageUpload.files.length) {
        UI.rarityImage.style.display = "none";
        UI.rarityFileName.textContent = "選択されていません";
        return;
      }

      if (rarityValue === "none") {
        UI.rarityImage.style.display = "none";
        UI.rarityImageUpload.value = ""; // 選択をリセット
        UI.rarityFileName.textContent = "選択されていません";
      } else if (rarityValue === "custom") {
        if (S.customRarityImageUrl) {
          UI.rarityImage.src = S.customRarityImageUrl;
          UI.rarityImage.style.display = "block";
        } else {
          UI.rarityImage.style.display = "none";
        }
      } else {
        // noneでもcustomでもない場合（1, 2, 3, 4）
        UI.rarityImage.src = `Card_asset/rarity/${rarityValue}.png`;
        UI.rarityImage.style.display = "block";
      }
    },

    updatePreview: () => {
      const selectedColorId = UI.cardColorSelect.value;
      const selectedType = (UI.cardTypeSelect.value || "").toUpperCase();
      const colorDetails = S.cardColorData[selectedColorId];
      const isFullFrame = selectedType === "FF" || selectedType === "FFCF";
      UI.cardNameContent.classList.toggle(
        "title-styled",
        selectedType === "CF" || selectedType === "FFCF"
      );
      UI.textBoxContainer.classList.toggle(
        "textbox-styled",
        selectedType === "FF" || selectedType === "FFCF"
      );
      UI.cardNameContainer.style.backgroundImage =
        selectedType === "CF" || selectedType === "FFCF"
          ? "none"
          : `url('Card_asset/タイトル.png')`;
      UI.cardTemplateImage.src = `Card_asset/テンプレ/${selectedColorId}カード${
        isFullFrame ? "FF" : ""
      }.png`;
      UI.imageContainer.style.height = isFullFrame ? "720px" : "480px";
      const isDefaultImage = UI.cardImage.src.includes("now_painting");
      if (isDefaultImage) {
        const newSrc = isFullFrame
          ? "Card_asset/now_painting_FF.png"
          : "Card_asset/now_painting.png";
        if (!UI.cardImage.src.endsWith(newSrc)) {
          UI.cardImage.src = newSrc;
          UI.cardImage.onload = () => {
            window.CG_IMAGE.setupImageForDrag();
            window.CG_IMAGE.checkDefaultImageTransparency(newSrc);
          };
        }
      }
      const selectedBackground = UI.backgroundSelect.value;
      UI.backgroundImage.style.display = selectedBackground ? "block" : "none";
      if (selectedBackground)
        UI.backgroundImage.src = `Card_asset/${selectedBackground}`;

      RENDERER.updateCardName(UI.cardNameInput.value);

      UI.effectDisplay.innerHTML = replacePunctuation(
        window.CG_UTILS.addSpacingToChars(UI.effectInput.value)
      );

      const flavorText = replacePunctuation(UI.flavorInput.value.trim());
      const speakerText = replacePunctuation(
        UI.flavorSpeakerInput.value.trim()
      );
      UI.flavorDisplay.style.display = flavorText ? "block" : "none";
      let el = UI.flavorDisplay.querySelector(".inner-text");
      if (!el) {
        UI.flavorDisplay.innerHTML = '<div class="inner-text"></div>';
        el = UI.flavorDisplay.querySelector(".inner-text");
      }
      el.innerHTML = flavorText.replace(/\n/g, "<br>");
      UI.flavorSpeakerDisplay.style.display = speakerText ? "block" : "none";
      if (speakerText) UI.flavorSpeakerDisplay.innerText = `─── ${speakerText}`;

      RENDERER.adjustTextBoxLayout(
        UI.effectDisplay,
        UI.flavorDisplay,
        UI.flavorSpeakerDisplay
      );
      RENDERER.updateRarityDisplay();
      RENDERER.updateThemeColor(colorDetails);
      RENDERER.updateThemeColor(colorDetails);
      requestAnimationFrame(window.CG_IMAGE.setupImageForDrag);
    },

    scalePreview: () => {
      if (!UI.previewWrapper || !UI.previewPanel) return;
      const baseWidth = 480;
      const containerWidth = UI.previewWrapper.offsetWidth;
      const scale = containerWidth < baseWidth ? containerWidth / baseWidth : 1;
      UI.previewPanel.style.transform =
        scale === 1 ? "none" : `scale(${scale})`;
    },
  };
  window.CG_RENDERER = RENDERER;
})();

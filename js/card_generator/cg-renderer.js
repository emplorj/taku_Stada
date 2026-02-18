// js/card_generator/cg-renderer.js (完全修正版)

(function () {
  const { escapeHtml, replacePunctuation, getLuminance, hexToRgb } =
    window.CG_UTILS;
  const S = window.CG_STATE;
  const UI = window.CG_UI_ELEMENTS;
  const TEXT_CANVAS = window.CG_TEXT_CANVAS;
  const { layoutText } = window.CG_TEXT_LAYOUT;

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
          `${rgb.r}, ${rgb.g}, ${rgb.b}`,
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
              m[2],
            )}</rt></ruby>`;
        }
        return `<span class="no-ruby">${escapeHtml(segment)}</span>`;
      });
      const finalHtml = htmlParts.join("\u200B");
      contentEl.classList.toggle(
        "is-plain-text-only",
        !finalHtml.includes("<ruby>"),
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

    // Canvas描画に移行したため、DOMテキストのレイアウト調整は不要
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
      const isHorizontal = selectedType === "HF";
      const isFullFrame =
        selectedType === "FF" || selectedType === "FFCF" || isHorizontal;
      const useTextStroke = isFullFrame;
      const cardWidth = isHorizontal ? 720 : 480;
      const cardHeight = isHorizontal ? 480 : 720;

      UI.previewWrapper.style.width = `${cardWidth}px`;
      UI.previewWrapper.style.maxWidth = `${cardWidth}px`;
      UI.previewWrapper.style.flexBasis = `${cardWidth}px`;
      UI.previewPanel.style.width = `${cardWidth}px`;
      UI.previewPanel.style.height = `${cardHeight}px`;
      UI.previewArea.style.width = `${cardWidth}px`;
      UI.previewArea.style.height = `${cardHeight}px`;
      UI.cardContainer.style.width = `${cardWidth}px`;
      UI.cardContainer.style.height = `${cardHeight}px`;

      UI.imageContainer.style.width = `${cardWidth}px`;
      UI.imageContainer.style.height = isFullFrame
        ? `${cardHeight}px`
        : "480px";
      UI.overlayImageContainer.style.width = `${cardWidth}px`;
      UI.overlayImageContainer.style.height = `${cardHeight}px`;

      if (isHorizontal) {
        UI.cardNameContainer.style.top = "24px";
        UI.cardNameContainer.style.width = "632px";
        UI.cardNameContainer.style.height = "56px";
        UI.textBoxContainer.style.left = "44px";
        UI.textBoxContainer.style.top = "286px";
        UI.textBoxContainer.style.width = "632px";
        UI.textBoxContainer.style.height = "170px";
      } else {
        UI.cardNameContainer.style.top = "46px";
        UI.cardNameContainer.style.width = "392px";
        UI.cardNameContainer.style.height = "56px";
        UI.textBoxContainer.style.left = "44px";
        UI.textBoxContainer.style.top = "520px";
        UI.textBoxContainer.style.width = "392px";
        UI.textBoxContainer.style.height = "177.5px";
      }

      if (UI.textCanvas) {
        const textCanvasWidth = isHorizontal ? 632 : 392;
        const textCanvasHeight = isHorizontal ? 170 : 178;
        UI.textCanvas.width = textCanvasWidth;
        UI.textCanvas.height = textCanvasHeight;
      }

      UI.cardNameContent.classList.toggle(
        "title-styled",
        selectedType === "CF" || selectedType === "FFCF",
      );
      UI.textBoxContainer.classList.toggle(
        "textbox-styled",
        selectedType === "FF" || selectedType === "FFCF" || isHorizontal,
      );
      UI.cardNameContainer.style.backgroundImage =
        selectedType === "CF" || selectedType === "FFCF"
          ? "none"
          : `url('Card_asset/タイトル.png')`;
      UI.cardTemplateImage.src = `Card_asset/テンプレ/${selectedColorId}カード${
        isFullFrame ? "FF" : ""
      }.png`;
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

      const effectText = replacePunctuation(UI.effectInput.value.trim());
      const flavorText = replacePunctuation(UI.flavorInput.value.trim());
      const speakerText = replacePunctuation(
        UI.flavorSpeakerInput.value.trim(),
      );

      if (UI.textCanvas && TEXT_CANVAS) {
        const totalHeight = isHorizontal ? 170 : 177.5;
        const effectLineHeight = 24;
        const flavorLineHeight = 18;
        const speakerLineHeight = 20;
        const effectPadding = isHorizontal ? 18 : 16;
        const flavorPadding = isHorizontal ? 30 : 28;
        const speakerPadding = isHorizontal ? 30 : 21;
        const canvasWidth = isHorizontal ? 632 : 392;

        const speakerHeight = speakerText ? 25 : 0;
        const ctx = UI.textCanvas.getContext("2d");
        ctx.font = "600 16px 'Klee One'";
        const flavorWidth = canvasWidth - flavorPadding * 2;
        const flavorLayout = flavorText
          ? layoutText(flavorText, ctx, {
              maxWidth: flavorWidth,
              maxLines: 0,
              lineHeight: flavorLineHeight,
              jpTracking: S.textSettings.flavor.jpTracking,
              alphaTracking: S.textSettings.flavor.alphaTracking,
              kinsoku: S.textSettings.flavor.kinsoku,
              ellipsis: S.textSettings.flavor.ellipsis,
              avoidAlphaHead: true,
              combineAlphaTailToNext: false,
            })
          : { lines: [] };
        const rawFlavorHeight = flavorLayout.lines.length * flavorLineHeight;
        const maxFlavorHeight = Math.max(0, totalHeight - speakerHeight);
        const flavorHeight = Math.min(rawFlavorHeight, maxFlavorHeight);
        const effectHeight = Math.max(
          effectLineHeight,
          totalHeight - speakerHeight - flavorHeight,
        );
        const flavorLineCount = flavorLayout.lines.length;
        const baseMaxLines = 5;
        const effectMaxLinesBase = Math.min(
          baseMaxLines + (!flavorText ? 1 : 0) + (!speakerText ? 1 : 0),
          Math.ceil(effectHeight / effectLineHeight),
        );
        const effectMaxLines =
          flavorLineCount <= 2
            ? effectMaxLinesBase
            : flavorLineCount === 3
              ? Math.min(4, effectMaxLinesBase)
              : flavorLineCount <= 5
                ? Math.min(3, effectMaxLinesBase)
                : flavorLineCount === 6
                  ? Math.min(2, effectMaxLinesBase)
                  : 1;
        const flavorMaxLines = flavorLineHeight
          ? Math.floor(flavorHeight / flavorLineHeight)
          : 0;

        const settings = {
          effect: {
            rect: {
              x: effectPadding,
              y: 0,
              width: canvasWidth - effectPadding * 2,
              height: effectHeight,
            },
            style: {
              font: "400 20px nitalago-ruika, sans-serif",
              color: "#000",
              strokeColor: useTextStroke ? "#fff" : null,
              strokeWidth: useTextStroke ? 3 : 0,
            },
            layout: {
              lineHeight: effectLineHeight,
              jpTracking: S.textSettings.effect.jpTracking,
              alphaTracking: S.textSettings.effect.alphaTracking,
              maxLines: effectMaxLines,
              kinsoku: S.textSettings.effect.kinsoku,
              ellipsis: true,
              avoidAlphaHead: true,
              combineAlphaTailToNext: false,
              punctAdvanceScale: 1,
              punctTailAdvanceScale: 1,
            },
          },
          flavor: {
            rect: {
              x: flavorPadding - 2,
              y: totalHeight - speakerHeight - flavorHeight + 2,
              width: flavorWidth,
              height: flavorHeight,
            },
            style: {
              font: "600 16px 'Klee One'",
              color: "#000",
              vAlign: "bottom",
              strokeColor: useTextStroke ? "#fff" : null,
              strokeWidth: useTextStroke ? 2.5 : 0,
            },
            layout: {
              lineHeight: flavorLineHeight,
              jpTracking: S.textSettings.flavor.jpTracking,
              alphaTracking: S.textSettings.flavor.alphaTracking,
              maxLines: flavorMaxLines,
              kinsoku: S.textSettings.flavor.kinsoku,
              ellipsis: S.textSettings.flavor.ellipsis,
              avoidAlphaHead: true,
              combineAlphaTailToNext: false,
              punctAdvanceScale: 1,
              punctTailAdvanceScale: 1,
            },
          },
          speaker: {
            rect: {
              x: speakerPadding + 10,
              y: totalHeight - speakerHeight,
              width: canvasWidth - speakerPadding * 2,
              height: speakerHeight,
            },
            style: {
              font: "600 16px 'Klee One'",
              color: "#000",
              align: "right",
              vAlign: "bottom",
              strokeColor: useTextStroke ? "#fff" : null,
              strokeWidth: useTextStroke ? 2.5 : 0,
            },
            layout: {
              lineHeight: speakerLineHeight,
              jpTracking: S.textSettings.speaker.jpTracking,
              alphaTracking: S.textSettings.speaker.alphaTracking,
              maxLines: speakerText ? 1 : 0,
              kinsoku: S.textSettings.speaker.kinsoku,
              ellipsis: S.textSettings.speaker.ellipsis,
              avoidAlphaHead: true,
              punctAdvanceScale: 1,
              punctTailAdvanceScale: 1,
            },
            prefix: "─── ",
          },
        };

        const renderText = () => {
          TEXT_CANVAS.renderTextLayer(
            UI.textCanvas,
            {
              effect: effectText,
              flavor: flavorText,
              speaker: speakerText,
            },
            settings,
            1,
          );
        };
        renderText();
        if (document.fonts?.load) {
          Promise.allSettled([
            document.fonts.load("400 20px nitalago-ruika"),
            document.fonts.load("600 16px 'Klee One'"),
            document.fonts.load("400 28px 'RocknRoll One'"),
          ]).then(() => {
            // フォント到着後にカード名スケーリングとCanvas文字を再描画
            RENDERER.updateCardName(UI.cardNameInput.value);
            renderText();
          });
        }
      }
      RENDERER.updateRarityDisplay();
      RENDERER.updateThemeColor(colorDetails);
      RENDERER.updateThemeColor(colorDetails);

      const layoutKey = `${selectedType}|${UI.cardImage.src}|${cardWidth}x${
        isFullFrame ? cardHeight : 480
      }`;
      const shouldResetImageLayout = RENDERER._lastImageLayoutKey !== layoutKey;
      RENDERER._lastImageLayoutKey = layoutKey;

      requestAnimationFrame(() => {
        if (shouldResetImageLayout) {
          window.CG_IMAGE.setupImageForDrag();
        } else {
          window.CG_IMAGE.updateImageTransform?.();
        }
      });
    },

    scalePreview: () => {
      if (!UI.previewWrapper || !UI.previewPanel) return;
      const baseWidth = UI.cardContainer?.offsetWidth || 480;
      const containerWidth = UI.previewWrapper.offsetWidth;
      const scale = containerWidth < baseWidth ? containerWidth / baseWidth : 1;
      UI.previewPanel.style.transform =
        scale === 1 ? "none" : `scale(${scale})`;
    },
  };
  window.CG_RENDERER = RENDERER;
})();

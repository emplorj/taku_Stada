// js/card_generator/cg-image.js (完全修正版)

(function () {
  const S = window.CG_STATE;
  const UI = window.CG_UI_ELEMENTS;
  const { showCustomAlert } = window.CG_UTILS;
  const RENDERER = window.CG_RENDERER; // updatePreviewを直接使わず、RENDERER経由で呼び出す

  const IMAGE = {
    // 画像の透明度チェック
    checkImageTransparency: (imageUrl) => {
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
    },

    checkDefaultImageTransparency: (src) => {
      IMAGE.checkImageTransparency(src).then((hasTransparency) => {
        const backgroundGroup = document.getElementById(
          "background-select-group"
        );
        backgroundGroup.style.display = hasTransparency ? "block" : "none";
        UI.backgroundSelect.value = hasTransparency
          ? "hologram_geometric.png"
          : "";
        RENDERER.updatePreview();
      });
    },

    // メイン画像のアップロードハンドラ
    handleImageUpload: (e) => {
      const file = e.target.files[0];
      if (!file) return;
      S.isNewImageSelected = true;
      UI.imageFileName.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        UI.cardImage.src = imageUrl;
        UI.cardImage.onload = () => {
          IMAGE.setupImageForDrag();
          IMAGE.checkImageTransparency(imageUrl).then((hasTransparency) => {
            const backgroundGroup = document.getElementById(
              "background-select-group"
            );
            backgroundGroup.style.display = hasTransparency ? "block" : "none";
            UI.backgroundSelect.value = hasTransparency
              ? "hologram_geometric.png"
              : "";
            RENDERER.updatePreview();
          });
        };
      };
      reader.readAsDataURL(file);
    },

    // オーバーレイ画像のアップロードハンドラ
    handleOverlayImageUpload: (e) => {
      const file = e.target.files[0];
      if (!file) return;
      S.isNewOverlayImageSelected = true;
      UI.overlayImageFileName.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (event) => {
        UI.overlayImage.src = event.target.result;
        UI.overlayImage.style.display = "block";
        UI.overlayImage.onload = IMAGE.setupOverlayImageForDrag;
      };
      reader.readAsDataURL(file);
    },

    setupImageForDrag: () => {
      S.imageState = { x: 0, y: 0, scale: 1 };
      const { offsetWidth: cW, offsetHeight: cH } = UI.imageContainer;
      const { naturalWidth: iW, naturalHeight: iH } = UI.cardImage;
      if (iW === 0 || iH === 0) return;

      const cAspect = cW / cH;
      const iAspect = iW / iH;
      let nW, nH;

      if (iAspect > cAspect) {
        nH = cH;
        nW = nH * iAspect;
        S.imageFitDirection = "landscape";
      } else {
        nW = cW;
        nH = nW / iAspect;
        S.imageFitDirection = "portrait";
      }
      UI.cardImage.style.width = `${nW}px`;
      UI.cardImage.style.height = `${nH}px`;
      S.imageState.x = (cW - nW) / 2;
      S.imageState.y = (cH - nH) / 2;
      IMAGE.updateCardImageTransform();
      IMAGE.updateDraggableCursor();
    },

    setupOverlayImageForDrag: () => {
      S.overlayImageState = { x: 0, y: 0, scale: 1 };
      const { offsetWidth: cW, offsetHeight: cH } = UI.overlayImageContainer;
      const { naturalWidth: iW, naturalHeight: iH } = UI.overlayImage;
      if (!iW || !iH) return;

      const iAspect = iW / iH;
      const cAspect = cW / cH;

      if (iAspect > cAspect) {
        const scale = cW / iW;
        UI.overlayImage.style.width = `${cW}px`;
        UI.overlayImage.style.height = `${iH * scale}px`;
        S.overlayImageFitDirection = "landscape";
      } else {
        const scale = cH / iH;
        UI.overlayImage.style.height = `${cH}px`;
        UI.overlayImage.style.width = `${iW * scale}px`;
        S.overlayImageFitDirection = "portrait";
      }
      S.overlayImageState.x = 0;
      S.overlayImageState.y = 0;
      IMAGE.updateOverlayImageTransform();
      IMAGE.updateDraggableCursor();
    },

    updateCardImageTransform: () => {
      UI.cardImage.style.transform = `translate(${S.imageState.x}px, ${S.imageState.y}px) scale(${S.imageState.scale})`;
    },
    updateOverlayImageTransform: () => {
      UI.overlayImage.style.transform = `translate(${S.overlayImageState.x}px, ${S.overlayImageState.y}px) scale(${S.overlayImageState.scale})`;
    },
    updateImageTransform: () => {
      IMAGE.updateCardImageTransform();
      IMAGE.updateOverlayImageTransform();
    },

    startDrag: (e) => {
      if (UI.previewArea.style.cursor === "default") return;
      e.preventDefault();
      S.isDragging = true;
      UI.previewArea.style.cursor = "grabbing";
      const state =
        S.activeManipulationTarget === "base"
          ? S.imageState
          : S.overlayImageState;
      const touch = e.touches ? e.touches[0] : e;
      S.startX = touch.clientX - state.x;
      S.startY = touch.clientY - state.y;
      document.addEventListener("mousemove", IMAGE.dragImage);
      document.addEventListener("mouseup", IMAGE.stopDrag);
      document.addEventListener("touchmove", IMAGE.dragImage, {
        passive: false,
      });
      document.addEventListener("touchend", IMAGE.stopDrag);
    },
    dragImage: (e) => {
      if (!S.isDragging) return;
      const state =
        S.activeManipulationTarget === "base"
          ? S.imageState
          : S.overlayImageState;
      const touch = e.touches ? e.touches[0] : e;
      state.x = touch.clientX - S.startX;
      state.y = touch.clientY - S.startY;

      if (S.activeManipulationTarget === "base") {
        IMAGE.clampCardImagePosition();
        IMAGE.updateCardImageTransform();
      } else {
        IMAGE.clampOverlayImagePosition();
        IMAGE.updateOverlayImageTransform();
      }
    },
    stopDrag: () => {
      S.isDragging = false;
      IMAGE.updateDraggableCursor();
      document.removeEventListener("mousemove", IMAGE.dragImage);
      document.removeEventListener("mouseup", IMAGE.stopDrag);
      document.removeEventListener("touchmove", IMAGE.dragImage);
      document.removeEventListener("touchend", IMAGE.stopDrag);
    },
    handleZoom: (e) => {
      e.preventDefault();
      const state =
        S.activeManipulationTarget === "base"
          ? S.imageState
          : S.overlayImageState;
      const container =
        S.activeManipulationTarget === "base"
          ? UI.imageContainer
          : UI.overlayImageContainer;
      const scaleAmount = 0.1;
      const delta = e.deltaY > 0 ? -1 : 1;
      const oldScale = state.scale;
      state.scale = Math.max(1, Math.min(state.scale + delta * scaleAmount, 5));
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      state.x = mouseX - (mouseX - state.x) * (state.scale / oldScale);
      state.y = mouseY - (mouseY - state.y) * (state.scale / oldScale);

      if (S.activeManipulationTarget === "base") {
        IMAGE.clampCardImagePosition();
        IMAGE.updateCardImageTransform();
      } else {
        IMAGE.clampOverlayImagePosition();
        IMAGE.updateOverlayImageTransform();
      }
      IMAGE.updateDraggableCursor();
    },

    clampCardImagePosition: () => {
      const { x, y, scale } = S.imageState;
      const { offsetWidth: cW, offsetHeight: cH } = UI.imageContainer;
      const { offsetWidth: iW, offsetHeight: iH } = UI.cardImage;
      const scaledW = iW * scale;
      const scaledH = iH * scale;
      S.imageState.x = Math.max(cW - scaledW, Math.min(0, x));
      S.imageState.y = Math.max(cH - scaledH, Math.min(0, y));
    },
    clampOverlayImagePosition: () => {
      const { x, y, scale } = S.overlayImageState;
      const { offsetWidth: cW, offsetHeight: cH } = UI.overlayImageContainer;
      const { offsetWidth: iW, offsetHeight: iH } = UI.overlayImage;
      const scaledW = iW * scale;
      const scaledH = iH * scale;
      S.overlayImageState.x = Math.max(cW - scaledW, Math.min(0, x));
      S.overlayImageState.y = Math.max(cH - scaledH, Math.min(0, y));
    },

    updateDraggableCursor: () => {
      const state =
        S.activeManipulationTarget === "base"
          ? S.imageState
          : S.overlayImageState;
      const image =
        S.activeManipulationTarget === "base" ? UI.cardImage : UI.overlayImage;
      const container =
        S.activeManipulationTarget === "base"
          ? UI.imageContainer
          : UI.overlayImageContainer;
      if (!image.src) {
        UI.previewArea.style.cursor = "default";
        return;
      }
      const canDrag =
        image.offsetWidth * state.scale > container.offsetWidth + 1 ||
        image.offsetHeight * state.scale > container.offsetHeight + 1;
      UI.previewArea.style.cursor = canDrag ? "grab" : "default";
    },

    waitForCardImages: (container = document) => {
      const images = Array.from(container.querySelectorAll("img"));
      const promises = images.map((img) => {
        return new Promise((resolve) => {
          if (
            !img.src ||
            img.style.display === "none" ||
            (img.complete && img.naturalHeight !== 0)
          ) {
            resolve();
          } else {
            img.onload = resolve;
            img.onerror = resolve; // エラー時もresolveして処理を止めない
          }
        });
      });
      return Promise.all(promises);
    },

    updateSparkleEffect: () => {
      UI.sparkleOverlayImage.style.display = UI.sparkleCheckbox.checked
        ? "block"
        : "none";
      UI.highResCheckbox.disabled = UI.sparkleCheckbox.checked;
      UI.highResCheckbox.parentElement.style.opacity = UI.sparkleCheckbox
        .checked
        ? "0.5"
        : "1";
      if (UI.sparkleCheckbox.checked) UI.highResCheckbox.checked = false;
    },

    downloadCard: async (options) => {
      const { container, cardData, button, isTemplate = false } = options;

      if (!container || !cardData) {
        showCustomAlert("保存に必要な情報が不足しています。");
        return;
      }

      const useSparkle = cardData["キラ"] === true || cardData.sparkle === true;

      if (!isTemplate && useSparkle) {
        return await IMAGE.generateSparkleApng({ ...options, useSparkle });
      }

      const btn =
        button || (isTemplate ? UI.downloadTemplateBtn : UI.downloadBtn);
      const originalButtonText = btn.textContent;
      btn.innerHTML = `<span class="spinner"></span> 生成中...`;
      btn.disabled = true;

      const previewPanel =
        container.closest(".preview-panel") || UI.previewPanel;
      const originalTransform = previewPanel.style.transform;
      previewPanel.style.transform = "none";

      try {
        const effectEl = container.querySelector(
          "#effect-display, #db-effect-display"
        );
        const flavorEl = container.querySelector(
          "#flavor-display, #db-flavor-display"
        );
        const speakerEl = container.querySelector(
          "#flavor-speaker-display, #db-flavor-speaker-display"
        );

        if (effectEl && flavorEl && speakerEl) {
          RENDERER.forceAdjustTextBoxLayout(effectEl, flavorEl, speakerEl);
        }

        await Promise.all([
          IMAGE.waitForCardImages(container),
          document.fonts.ready,
          new Promise((resolve) =>
            requestAnimationFrame(() => setTimeout(resolve, 50))
          ),
        ]);

        // 一時的にletter-spacingを変更
        const charKernElements = container.querySelectorAll(".char-kern");
        const alphaKernElements = container.querySelectorAll(".alpha-kern");
        const originalCharKernSpacings = Array.from(charKernElements).map(
          (el) => el.style.letterSpacing
        );
        const originalAlphaKernSpacings = Array.from(alphaKernElements).map(
          (el) => el.style.letterSpacing
        );

        charKernElements.forEach((el) =>
          el.style.setProperty("letter-spacing", "0.2em", "important")
        );
        alphaKernElements.forEach((el) =>
          el.style.setProperty("letter-spacing", "0.2em", "important")
        );

        const canvas = await html2canvas(container, {
          backgroundColor: null,
          useCORS: true,
          scale: UI.highResCheckbox.checked && !useSparkle ? 2 : 1,
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

        const fileName = isTemplate
          ? `${cardData["色"]}_${cardData["タイプ"] || "Standard"}_template.png`
          : `${(cardData["カード名"] || "custom_card").replace(
              /[()`/\\?%*:|"<>]/g,
              ""
            )}.png`;

        const link = document.createElement("a");
        link.download = fileName;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (err) {
        console.error("画像生成失敗:", err);
        showCustomAlert(
          "画像生成に失敗しました。コンソールで詳細を確認してください。"
        );
      } finally {
        previewPanel.style.transform = originalTransform;
        btn.textContent = originalButtonText;
        btn.disabled = false;
      }
    },

    createSparkleApngBlob: async (container) => {
      const sparkleOverlay = container.querySelector(
        "#sparkle-overlay-image, #db-sparkle-overlay-image"
      );
      const wasSparkleVisible =
        sparkleOverlay && sparkleOverlay.style.display !== "none";
      if (sparkleOverlay) sparkleOverlay.style.display = "none";

      const previewPanel =
        container.closest(".preview-panel") || UI.previewPanel;
      const originalTransform = previewPanel.style.transform;
      previewPanel.style.transform = "none";

      try {
        // レイアウトを再計算してDOMの更新を待つ
        RENDERER.updatePreview();
        RENDERER.forceAdjustTextBoxLayout(
          container.querySelector("#effect-display, #db-effect-display"),
          container.querySelector("#flavor-display, #db-flavor-display"),
          container.querySelector(
            "#flavor-speaker-display, #db-flavor-speaker-display"
          )
        );
        await Promise.all([
          IMAGE.waitForCardImages(container),
          document.fonts.ready,
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          ),
        ]);
        await new Promise((r) => setTimeout(r, 100)); // 念のための待機

        document.body.classList.add("is-rendering-output");
        await new Promise((resolve) => setTimeout(resolve, 50)); // スタイル適用を待機

        const baseCanvas = await html2canvas(container, {
          backgroundColor: null,
          useCORS: true,
          scale: 1,
        });

        document.body.classList.remove("is-rendering-output");
        const W = baseCanvas.width,
          H = baseCanvas.height;

        const resp = await fetch("Card_asset/sparkle_overlay.png", {
          cache: "no-cache",
        });
        if (!resp.ok) throw new Error("キラAPNGの読み込みに失敗");
        const buf = await resp.arrayBuffer();
        const apng = UPNG.decode(buf);
        const rgbaFrames = UPNG.toRGBA8(apng);
        const delays = (apng.frames || []).map((f) =>
          Math.max(10, f.delay | 0)
        );

        const work = document.createElement("canvas");
        work.width = W;
        work.height = H;
        const ctx = work.getContext("2d");
        const outFrames = [];

        const fw = apng.width,
          fh = apng.height;
        const fx = Math.round((W - fw) / 2),
          fy = Math.round((H - fh) / 2);

        for (let i = 0; i < rgbaFrames.length; i++) {
          ctx.clearRect(0, 0, W, H);
          ctx.drawImage(baseCanvas, 0, 0);
          const fcan = document.createElement("canvas");
          fcan.width = fw;
          fcan.height = fh;
          const fctx = fcan.getContext("2d");
          const imgData = new ImageData(
            new Uint8ClampedArray(rgbaFrames[i]),
            fw,
            fh
          );
          fctx.putImageData(imgData, 0, 0);
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.drawImage(fcan, fx, fy);
          ctx.restore();
          outFrames.push(ctx.getImageData(0, 0, W, H).data.buffer);
        }

        const encodedApng = UPNG.encode(outFrames, W, H, 0, delays);
        return new Blob([encodedApng], { type: "image/png" });
      } finally {
        if (sparkleOverlay && wasSparkleVisible)
          sparkleOverlay.style.display = "block";
        previewPanel.style.transform = originalTransform;
        document.body.classList.remove("is-rendering-output");
      }
    },

    generateSparkleApng: async (options) => {
      const { container, cardData, button } = options;
      const btn = button || UI.downloadBtn;
      const originalButtonText = btn.textContent;
      btn.innerHTML = `<span class="spinner"></span> 生成中...`;
      btn.disabled = true;

      try {
        const blob = await IMAGE.createSparkleApngBlob(container);
        if (!blob) throw new Error("APNG生成に失敗");

        const a = document.createElement("a");
        a.download = `${(cardData["カード名"] || "custom_card").replace(
          /[()`/\\?%*:|"<>]/g,
          ""
        )}.png`;
        a.href = URL.createObjectURL(blob);
        a.click();
        URL.revokeObjectURL(a.href);
      } catch (error) {
        console.error("APNG生成エラー:", error);
        showCustomAlert("キラカードの生成に失敗しました: " + error.message);
      } finally {
        btn.textContent = originalButtonText;
        btn.disabled = false;
      }
    },
  };

  window.CG_IMAGE = IMAGE;
})();

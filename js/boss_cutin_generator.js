(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const canvas = $("cutin-canvas");
  const ctx = canvas.getContext("2d");

  const UI = {
    resolutionSelect: $("resolution-select"),
    durationInput: $("duration-input"),
    fpsSelect: $("fps-select"),
    designSelect: $("design-select"),
    cameraPresetSelect: $("camera-preset-select"),
    endZoomoutCheckbox: $("end-zoomout-checkbox"),
    endZoomoutControls: $("end-zoomout-controls"),
    endZoomoutDurationRatio: $("end-zoomout-duration-ratio"),
    endZoomoutDurationRatioNumber: $("end-zoomout-duration-ratio-number"),
    endZoomoutReturnRatio: $("end-zoomout-return-ratio"),
    endZoomoutReturnRatioNumber: $("end-zoomout-return-ratio-number"),
    subtitleScale15: $("subtitle-scale-15"),
    bgUpload: $("bg-upload"),
    charUpload: $("char-upload"),
    charUpload2: $("char-upload-2"),
    charSwitchEnable: $("char-switch-enable"),
    charSwitchDependent: $("char-switch-dependent"),
    charSwitchControls: $("char-switch-controls"),
    charSwitchTime: $("char-switch-time"),
    charSwitchTimeNumber: $("char-switch-time-number"),
    charSwitchDuration: $("char-switch-duration"),
    charSwitchDurationNumber: $("char-switch-duration-number"),
    charSwitchType: $("char-switch-type"),
    epithetInput: $("epithet-input"),
    nameInput: $("name-input"),
    bgScale: $("bg-scale"),
    bgScaleNumber: $("bg-scale-number"),
    bgX: $("bg-x"),
    bgXNumber: $("bg-x-number"),
    bgY: $("bg-y"),
    bgYNumber: $("bg-y-number"),
    charScale: $("char-scale"),
    charScaleNumber: $("char-scale-number"),
    charX: $("char-x"),
    charXNumber: $("char-x-number"),
    charY: $("char-y"),
    charYNumber: $("char-y-number"),
    playBtn: $("play-btn"),
    stopBtn: $("stop-btn"),
    exportWebpBtn: $("export-webp-btn"),
    exportPngBtn: $("export-png-btn"),
    webpLoopCheckbox: $("webp-loop-checkbox"),
    statusText: $("status-text"),
  };

  const tabButtons = Array.from(document.querySelectorAll(".controls-tab-btn"));
  const tabPanels = Array.from(
    document.querySelectorAll(".controls-tab-panel[data-tab-panel]"),
  );

  const state = {
    width: 1280,
    height: 720,
    duration: 3,
    fps: 30,
    bgImage: null,
    charImage: null,
    charImage2: null,
    animReq: null,
    startAt: 0,
    playing: false,
    ffmpeg: null,
    pinnedBlobUrls: [],
  };

  const STORAGE_KEYS = {
    endZoomEnabled: "boss_cutin:endZoomEnabled",
    endZoomDurationRatio: "boss_cutin:endZoomDurationRatio",
    endZoomReturnRatio: "boss_cutin:endZoomReturnRatio",
  };

  function setStatus(text) {
    UI.statusText.textContent = text;
  }

  function switchControlsTab(tabName) {
    tabButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.tab === tabName);
    });
    tabPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.tabPanel === tabName);
    });
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInCubic(t) {
    return t * t * t;
  }

  function computeRelativeFocusDriftY(relativeY, charZoom) {
    if (!state.charImage) return 0;

    const focusY = clamp(relativeY, 0, 1);
    const baseCharScale = getCharScaleByCanvasHeight(
      Number(UI.charScale.value) || 1,
    );
    const intrinsicCharH = Math.max(
      1,
      state.charImage.naturalHeight || state.charImage.height,
    );
    const renderedCharHeight = intrinsicCharH * baseCharScale * charZoom;
    const focusOffsetFromCenterY = (focusY - 0.5) * renderedCharHeight;
    const driftY = -focusOffsetFromCenterY;
    return clamp(driftY, -(state.height * 0.48), state.height * 0.48);
  }

  function mixCameraState(a, b, t) {
    return {
      bgZoom: lerp(a.bgZoom, b.bgZoom, t),
      charZoom: lerp(a.charZoom, b.charZoom, t),
      driftX: lerp(a.driftX, b.driftX, t),
      driftY: lerp(a.driftY, b.driftY, t),
    };
  }

  function parseSettings() {
    const [w, h] = UI.resolutionSelect.value.split("x").map(Number);
    state.width = w;
    state.height = h;
    state.duration = clamp(Number(UI.durationInput.value) || 3, 1, 12);
    state.fps = Number(UI.fpsSelect.value) || 30;
    canvas.width = state.width;
    canvas.height = state.height;
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      const isWebp =
        (file && file.type === "image/webp") ||
        /\.webp$/i.test((file && file.name) || "");
      img.onload = () => {
        // animated WebP は object URL を即時 revoke すると
        // フレーム更新が止まる環境があるため保持する
        if (isWebp) {
          state.pinnedBlobUrls.push(url);
          keepImageAnimating(img);
        } else {
          URL.revokeObjectURL(url);
        }
        resolve(img);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  function loadImageFromPath(path) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (/\.webp$/i.test(path || "")) {
          keepImageAnimating(img);
        }
        resolve(img);
      };
      img.onerror = (e) => reject(e);
      img.src = path;
    });
  }

  function keepImageAnimating(img) {
    if (!img || img.dataset.animPinned === "1") return;
    let host = document.getElementById("anim-image-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "anim-image-host";
      host.style.position = "fixed";
      host.style.left = "-99999px";
      host.style.top = "-99999px";
      host.style.width = "2px";
      host.style.height = "2px";
      host.style.overflow = "hidden";
      host.style.opacity = "0.001";
      host.style.pointerEvents = "none";
      document.body.appendChild(host);
    }
    img.dataset.animPinned = "1";
    img.style.width = "2px";
    img.style.height = "2px";
    host.appendChild(img);
  }

  function computeAlpha(t) {
    const d = state.duration;
    const fadeIn = Math.min(0.5, d * 0.25);
    const fadeOut = Math.min(0.5, d * 0.25);
    if (t < fadeIn) return t / fadeIn;
    if (t > d - fadeOut) return (d - t) / fadeOut;
    return 1;
  }

  function computeFF14OverlayAlpha(t) {
    const d = state.duration;
    const start = d * 0.4;
    const end = d * 0.933;
    const fade = Math.max(0.12, d * 0.05);

    if (t < start || t > end) return 0;
    if (t < start + fade) return (t - start) / fade;
    if (t > end - fade) return (end - t) / fade;
    return 1;
  }

  function getFF14CameraState(t) {
    const motionDuration = Math.max(0.001, state.duration - 1);
    const p = clamp(t / motionDuration, 0, 1);
    const e = easeOutCubic(p);
    const preset =
      (UI.cameraPresetSelect && UI.cameraPresetSelect.value) || "standard";
    const microAmpY = state.height * 0.004;

    if (preset === "no-motion") {
      return {
        bgZoom: 1,
        charZoom: 1,
        driftX: 0,
        driftY: 0,
      };
    }

    if (preset === "zoom-in") {
      const eFast = easeOutCubic(p);
      return {
        // 明確に寄る: 終始ズームインのみ
        bgZoom: lerp(1.0, 1.14, eFast),
        charZoom: lerp(1.0, 1.34, eFast),
        driftX: 0,
        driftY: -state.height * 0.018 * eFast,
      };
    }

    if (preset === "zoom-out") {
      return {
        bgZoom: lerp(1.08, 1, e),
        charZoom: lerp(1.16, 1, e),
        driftX: 0,
        driftY: -Math.sin(e * Math.PI * 0.8) * (state.height * 0.0025),
      };
    }

    if (preset === "slide-left-right") {
      return {
        bgZoom: lerp(1.01, 1.05, e),
        charZoom: lerp(1.02, 1.1, e),
        driftX: lerp(-(state.width * 0.06), state.width * 0.06, e),
        driftY: -Math.sin(e * Math.PI * 1.1) * (state.height * 0.002),
      };
    }

    if (preset === "slide-right-left") {
      return {
        bgZoom: lerp(1.01, 1.05, e),
        charZoom: lerp(1.02, 1.1, e),
        driftX: lerp(state.width * 0.06, -(state.width * 0.06), e),
        driftY: -Math.sin(e * Math.PI * 1.1) * (state.height * 0.002),
      };
    }

    if (preset === "dolly-wobble") {
      const eFast = easeOutCubic(p);
      return {
        // ドリー寄せ: 速度感を強め、縦のうねりをはっきり
        bgZoom: lerp(1.0, 1.11, eFast),
        charZoom: lerp(1.0, 1.27, eFast),
        driftX: 0,
        driftY:
          -state.height * 0.012 * eFast -
          Math.sin(p * Math.PI * 2.2) * (state.height * 0.0065),
      };
    }

    if (preset === "cinematic-soft") {
      const pushEnd = 0.68;
      const peakBg = 1.075;
      const peakChar = 1.16;

      if (p < pushEnd) {
        const u = clamp(p / pushEnd, 0, 1);
        const eSlow = easeInOutSine(u);
        return {
          // シネマ: 前半ゆっくり寄る
          bgZoom: lerp(1.0, peakBg, eSlow),
          charZoom: lerp(1.0, peakChar, eSlow),
          driftX: 0,
          driftY: -state.height * 0.008 * eSlow,
        };
      }

      const u = clamp((p - pushEnd) / (1 - pushEnd), 0, 1);
      const ePull = easeInOutSine(u);
      return {
        // 後半で引く（標準より緩い）
        bgZoom: lerp(peakBg, 1.02, ePull),
        charZoom: lerp(peakChar, 1.05, ePull),
        driftX: 0,
        driftY: lerp(-state.height * 0.008, state.height * 0.004, ePull),
      };
    }

    if (preset === "feet-to-face-lick-up") {
      const yStart = -(state.height * 0.42);
      const yEnd = state.height * 0.34;
      const yPan = lerp(yStart, yEnd, easeInOutSine(p));
      return {
        bgZoom: lerp(1.03, 1.12, e),
        charZoom: lerp(1.08, 1.32, e),
        driftX: 0,
        driftY: yPan,
      };
    }

    if (preset === "parts-zoom-face-full") {
      const linearPanX = state.width * 0.032;
      const linearPanY = state.height * 0.045;

      // 立ち絵画像内の相対座標（xは将来拡張用。横揺れ禁止のため driftX は常に0）
      const focusPoints = {
        rightFoot: { x: 0.66, y: 0.9 },
        leftHand: { x: 0.34, y: 0.5 },
        face: { x: 0.52, y: 0.22 },
      };

      const rightFoot = {
        bgZoom: 1.04,
        charZoom: 1.16,
        driftX: 0,
        driftY: computeRelativeFocusDriftY(focusPoints.rightFoot.y, 1.2),
      };
      const leftHand = {
        bgZoom: 1.09,
        charZoom: 1.34,
        driftX: 0,
        driftY: computeRelativeFocusDriftY(focusPoints.leftHand.y, 1.215),
      };
      const face = {
        bgZoom: 1.095,
        charZoom: 1.35,
        driftX: 0,
        driftY: computeRelativeFocusDriftY(focusPoints.face.y, 1.23),
      };

      // ugoki.exo寄せ: 右足(1-19f) -> 左手(20-38f) -> 顔(39-57f)
      // 3フェーズを同尺(約1/3ずつ)で、境界は完全スナップ
      const phase1End = 1 / 3;
      const phase2End = 2 / 3;

      if (p < phase1End) {
        const u = clamp(p / phase1End, 0, 1);
        const ePan = easeOutCubic(u);
        return {
          bgZoom: rightFoot.bgZoom + 0.001 * ePan,
          charZoom: rightFoot.charZoom + 0.002 * ePan,
          driftX: linearPanX * ePan,
          driftY:
            rightFoot.driftY - state.height * 0.0038 * ePan - linearPanY * ePan,
        };
      }

      // スナップ遷移（補間なし）: 右足 -> 左手
      if (p < phase2End) {
        const u = clamp((p - phase1End) / (phase2End - phase1End), 0, 1);
        const ePan = easeOutCubic(u);
        return {
          bgZoom: leftHand.bgZoom + 0.0012 * ePan,
          charZoom: leftHand.charZoom + 0.0024 * ePan,
          driftX: -linearPanX * ePan,
          driftY:
            leftHand.driftY - state.height * 0.0042 * ePan - linearPanY * ePan,
        };
      }

      // スナップ遷移（補間なし）: 左手 -> 顔
      const u = clamp((p - phase2End) / (1 - phase2End), 0, 1);
      const ePan = easeOutCubic(u);
      return {
        bgZoom: face.bgZoom + 0.0013 * ePan,
        charZoom: face.charZoom + 0.0026 * ePan,
        driftX: 0,
        driftY: face.driftY - state.height * 0.0044 * ePan,
      };
    }

    if (preset === "standard") {
      const eSoft = easeInOutSine(p);
      return {
        // 標準: 微パン感を少し強める（酔いにくい範囲）
        bgZoom: lerp(1, 1.06, eSoft),
        charZoom: lerp(1, 1.14, eSoft),
        driftX: 0,
        driftY: -Math.sin(eSoft * Math.PI * 1.0) * (state.height * 0.0062),
      };
    }

    return {
      bgZoom: lerp(1, 1.07, e),
      charZoom: lerp(1, 1.11, e),
      driftX: 0,
      driftY: -Math.sin(e * Math.PI * 0.9) * microAmpY,
    };
  }

  function getEndZoomoutMultiplier(t) {
    if (!UI.endZoomoutCheckbox || !UI.endZoomoutCheckbox.checked) {
      return { bg: 1, char: 1 };
    }

    const d = Math.max(0.001, state.duration || 0);
    const ratio = clamp(
      (Number(UI.endZoomoutDurationRatio && UI.endZoomoutDurationRatio.value) ||
        18) / 100,
      0.01,
      0.6,
    );
    const minWindow = Math.max(0.03, 1 / Math.max(1, state.fps || 30));
    const zoomOutWindow = clamp(d * ratio, minWindow, d);
    const zoomOutStart = d - zoomOutWindow;
    if (t <= zoomOutStart) {
      return { bg: 1, char: 1 };
    }

    const p = clamp((t - zoomOutStart) / Math.max(0.001, zoomOutWindow), 0, 1);
    const eased = easeInCubic(p);
    const bgScale = Math.max(0.01, Number(UI.bgScale && UI.bgScale.value) || 1);
    const returnRatio = clamp(
      (Number(UI.endZoomoutReturnRatio && UI.endZoomoutReturnRatio.value) ||
        100) / 100,
      0,
      1,
    );
    // 100%で背景拡大ぶんを完全打ち消し、0%で打ち消しなし
    const minZoomByBgScale = lerp(1, clamp(1 / bgScale, 0.5, 1), returnRatio);
    const syncedZoom = lerp(1, minZoomByBgScale, eased);
    return {
      bg: syncedZoom,
      char: syncedZoom,
    };
  }

  function syncRangeNumber(rangeEl, numberEl, onChange) {
    if (!rangeEl || !numberEl) return;

    const syncFromRange = () => {
      numberEl.value = rangeEl.value;
      if (onChange) onChange();
    };

    const syncFromNumber = () => {
      const min = Number(numberEl.min || rangeEl.min || 0);
      const max = Number(numberEl.max || rangeEl.max || 100);
      const step = Number(numberEl.step || rangeEl.step || 1);
      let v = Number(numberEl.value);
      if (!Number.isFinite(v)) v = Number(rangeEl.value);
      v = clamp(v, min, max);
      if (step > 0) {
        v = Math.round(v / step) * step;
      }
      rangeEl.value = String(v);
      numberEl.value = String(v);
      if (onChange) onChange();
    };

    rangeEl.addEventListener("input", syncFromRange);
    numberEl.addEventListener("input", syncFromNumber);
    numberEl.addEventListener("change", syncFromNumber);
  }

  function updateEndZoomoutControlsVisibility() {
    if (!UI.endZoomoutControls || !UI.endZoomoutCheckbox) return;
    UI.endZoomoutControls.classList.toggle(
      "is-visible",
      !!UI.endZoomoutCheckbox.checked,
    );
  }

  function loadPersistedEndZoomSettings() {
    try {
      const enabled = localStorage.getItem(STORAGE_KEYS.endZoomEnabled);
      const durationRatio = localStorage.getItem(
        STORAGE_KEYS.endZoomDurationRatio,
      );
      const returnRatio = localStorage.getItem(STORAGE_KEYS.endZoomReturnRatio);

      if (UI.endZoomoutCheckbox && enabled !== null) {
        UI.endZoomoutCheckbox.checked = enabled === "1";
      }
      if (UI.endZoomoutDurationRatio && durationRatio !== null) {
        UI.endZoomoutDurationRatio.value = durationRatio;
      }
      if (UI.endZoomoutDurationRatioNumber) {
        UI.endZoomoutDurationRatioNumber.value =
          UI.endZoomoutDurationRatio && UI.endZoomoutDurationRatio.value
            ? UI.endZoomoutDurationRatio.value
            : UI.endZoomoutDurationRatioNumber.value;
      }
      if (UI.endZoomoutReturnRatio && returnRatio !== null) {
        UI.endZoomoutReturnRatio.value = returnRatio;
      }
      if (UI.endZoomoutReturnRatioNumber) {
        UI.endZoomoutReturnRatioNumber.value =
          UI.endZoomoutReturnRatio && UI.endZoomoutReturnRatio.value
            ? UI.endZoomoutReturnRatio.value
            : UI.endZoomoutReturnRatioNumber.value;
      }
    } catch (e) {
      console.warn("loadPersistedEndZoomSettings failed", e);
    }
  }

  function persistEndZoomSettings() {
    try {
      if (UI.endZoomoutCheckbox) {
        localStorage.setItem(
          STORAGE_KEYS.endZoomEnabled,
          UI.endZoomoutCheckbox.checked ? "1" : "0",
        );
      }
      if (UI.endZoomoutDurationRatio) {
        localStorage.setItem(
          STORAGE_KEYS.endZoomDurationRatio,
          UI.endZoomoutDurationRatio.value,
        );
      }
      if (UI.endZoomoutReturnRatio) {
        localStorage.setItem(
          STORAGE_KEYS.endZoomReturnRatio,
          UI.endZoomoutReturnRatio.value,
        );
      }
    } catch (e) {
      console.warn("persistEndZoomSettings failed", e);
    }
  }

  function getFF14ReferenceLayout(subtitleScale = 1) {
    const w = state.width;
    const h = state.height;
    const baseLineLength = Math.round((w * 533) / 990);
    const baseLineSize = Math.max(Math.round(h / 360), 3);
    const lineLength = Math.round(baseLineLength * subtitleScale);
    const lineSize = Math.max(1, Math.round(baseLineSize * subtitleScale));
    const shadowSize = lineSize * 2;
    const baseLineY = Math.round(
      (h * 25) / 36 + Math.max(1, Math.round(baseLineSize * 2)),
    );
    const centerY = h / 2;
    const lineY = Math.round(centerY + (baseLineY - centerY) * subtitleScale);
    // 720p基準で通常24px / 1.5倍で36px
    const fontSize = Math.max(
      12,
      Math.round(((w * 24) / 1280) * subtitleScale),
    );
    const upperOffset = -Math.round(shadowSize + (fontSize * 2) / 3);
    const lowerOffset = Math.round(-shadowSize + lineSize + fontSize);
    const upperY = lineY + upperOffset;
    const lowerY = lineY + lowerOffset;
    const lineLeft = Math.round(w / 2 - lineLength / 2);

    return {
      lineLength,
      lineSize,
      shadowSize,
      lineY,
      upperY,
      lowerY,
      fontSize,
      lineLeft,
    };
  }

  function getSubtitlePixelSize(subtitleScale = 1) {
    // 要件: 720pで通常24px、1.5倍で36px
    const base = (state.height * 24) / 720;
    return Math.max(12, Math.round(base * subtitleScale));
  }

  function getCharScaleByCanvasHeight(userScale = 1) {
    const s = Math.max(0.01, Number(userScale) || 1);
    if (!state.charImage) return s;
    const intrinsicCharH = Math.max(
      1,
      state.charImage.naturalHeight || state.charImage.height,
    );
    const fitToCanvasHeight = state.height / intrinsicCharH;
    return fitToCanvasHeight * s;
  }

  function drawCover(alpha) {
    ctx.fillStyle = `rgba(0,0,0,${0.25 * alpha})`;
    ctx.fillRect(0, 0, state.width, state.height);
  }

  function drawImageLayer(img, scale, x, y, fallbackColor, options = {}) {
    if (!img) {
      ctx.fillStyle = fallbackColor;
      ctx.fillRect(0, 0, state.width, state.height);
      return;
    }

    const intrinsicW = Math.max(1, img.naturalWidth || img.width);
    const intrinsicH = Math.max(1, img.naturalHeight || img.height);

    let effectiveScale = scale;
    if (options.coverCanvas) {
      // 背景専用: 平行移動・ズーム後でも外周が出ない最小スケールにクランプ
      const minScaleX = (state.width + Math.abs(x) * 2) / intrinsicW;
      const minScaleY = (state.height + Math.abs(y) * 2) / intrinsicH;
      const minCoverScale = Math.max(minScaleX, minScaleY);
      const coverClampRelax = clamp(options.coverClampRelax || 0, 0, 0.12);
      const relaxedMinScale = minCoverScale * (1 - coverClampRelax);
      effectiveScale = Math.max(effectiveScale, relaxedMinScale);
    }

    const w = intrinsicW * effectiveScale;
    const h = intrinsicH * effectiveScale;
    let autoOffsetY = 0;
    if (options.headBiasForTall) {
      const aspect = intrinsicH / intrinsicW;
      if (aspect >= 1.25) {
        const tallStrength = clamp((aspect - 1.25) / (2.8 - 1.25), 0, 1);
        const fillStrength = clamp(
          (h / Math.max(1, state.height) - 0.9) / 1.2,
          0,
          1,
        );
        const headBiasRatio =
          lerp(0.12, 0.26, tallStrength) + 0.05 * fillStrength;
        autoOffsetY = h * headBiasRatio;
      }
    }
    const cx = state.width / 2 + x;
    const cy = state.height / 2 + y + autoOffsetY;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  }

  function drawSubtitleBand(alpha) {
    const design = UI.designSelect.value;
    if (design === "ff14-shadowbringers") {
      drawFF14SubtitleBand(alpha);
      return;
    }

    const bandH = Math.round(state.height * 0.23);
    const y = Math.round(state.height * 0.68);
    ctx.fillStyle = `rgba(0,0,0,${0.62 * alpha})`;
    ctx.fillRect(0, y, state.width, bandH);
    ctx.strokeStyle = `rgba(255,255,255,${0.45 * alpha})`;
    ctx.lineWidth = Math.max(2, state.height / 360);
    ctx.strokeRect(0, y, state.width, bandH);
  }

  function drawFF14SubtitleBand(alpha, subtitleScale) {
    const ref = getFF14ReferenceLayout(subtitleScale);
    const lineY = ref.lineY;

    // 参照実装寄せ: 白ライン（黒枠/黒影なし）
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${0.62 * alpha})`;
    ctx.shadowBlur = Math.max(3, Math.round(ref.lineSize * 1.8));
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = `rgba(255,255,255,${0.98 * alpha})`;
    ctx.lineWidth = ref.lineSize;
    ctx.beginPath();
    ctx.moveTo(ref.lineLeft - 1, lineY);
    ctx.lineTo(ref.lineLeft + ref.lineLength + 1, lineY);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255,255,255,${1 * alpha})`;
    ctx.lineWidth = Math.max(1, ref.lineSize - 2);
    ctx.beginPath();
    ctx.moveTo(ref.lineLeft, lineY);
    ctx.lineTo(ref.lineLeft + ref.lineLength, lineY);
    ctx.stroke();
    ctx.restore();
  }

  function drawSpacedText(text, x, y, spacing) {
    if (!text) return;
    const chars = Array.from(text);
    const widths = chars.map((ch) => ctx.measureText(ch).width);
    const total =
      widths.reduce((sum, w) => sum + w, 0) +
      spacing * Math.max(0, chars.length - 1);
    let cursor = x - total / 2;
    const prevAlign = ctx.textAlign;
    const prevBase = ctx.textBaseline;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      ctx.fillText(ch, cursor, y);
      cursor += widths[i] + spacing;
    }
    ctx.textAlign = prevAlign;
    ctx.textBaseline = prevBase;
  }

  function strokeSpacedText(text, x, y, spacing) {
    if (!text) return;
    const chars = Array.from(text);
    const widths = chars.map((ch) => ctx.measureText(ch).width);
    const total =
      widths.reduce((sum, w) => sum + w, 0) +
      spacing * Math.max(0, chars.length - 1);
    let cursor = x - total / 2;
    const prevAlign = ctx.textAlign;
    const prevBase = ctx.textBaseline;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      ctx.strokeText(ch, cursor, y);
      cursor += widths[i] + spacing;
    }
    ctx.textAlign = prevAlign;
    ctx.textBaseline = prevBase;
  }

  function drawTexts(alpha) {
    const epithet = UI.epithetInput.value || "";
    const name = UI.nameInput.value || "";
    const design = UI.designSelect.value;
    const subtitleScale = UI.subtitleScale15.checked ? 1.5 : 1;

    if (design === "ff14-shadowbringers") {
      drawFF14SubtitleBand(alpha, subtitleScale);
      drawFF14Texts(epithet, name, alpha, subtitleScale);
      return;
    }

    const baseY = Math.round(state.height * 0.77);

    const fontPx = getSubtitlePixelSize(subtitleScale);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${0.72 * alpha})`;
    // ここを下げると「ぼやけ量」が減る
    ctx.shadowBlur = Math.max(6, Math.round(fontPx * 0.55));
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = `700 ${fontPx}px sans-serif`;
    ctx.fillStyle = `rgba(220,220,230,${0.95 * alpha})`;
    ctx.strokeStyle = `rgba(0,0,0,${0.85 * alpha})`;
    ctx.lineWidth = Math.max(3, state.height / 240);
    ctx.strokeText(epithet, state.width / 2, baseY - state.height * 0.055);
    ctx.fillText(epithet, state.width / 2, baseY - state.height * 0.055);

    ctx.font = `900 ${fontPx}px sans-serif`;
    ctx.fillStyle = `rgba(255,255,255,${1 * alpha})`;
    ctx.strokeStyle = `rgba(20,20,20,${0.95 * alpha})`;
    ctx.lineWidth = Math.max(4, state.height / 180);
    ctx.strokeText(name, state.width / 2, baseY + state.height * 0.03);
    ctx.fillText(name, state.width / 2, baseY + state.height * 0.03);
    ctx.restore();
  }

  function drawFF14Texts(epithet, name, alpha, subtitleScale) {
    const ref = getFF14ReferenceLayout(subtitleScale);
    const centerX = state.width / 2;
    const upperX = centerX;
    const lowerX = centerX;
    const epiY = ref.upperY;
    const nameY = ref.lowerY;

    const nameFont = ref.fontSize;
    const epiFont = ref.fontSize;
    const epiSpacing = Math.max(2, Math.round(epiFont * 0.45));
    const nameSpacing = Math.max(2, Math.round(nameFont * 0.45));

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${0.74 * alpha})`;
    // ここを下げると「ぼやけ量」が減る
    ctx.shadowBlur = Math.max(7, Math.round(ref.fontSize * 0.62));
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 上段（二つ名）文字自身のシャドウ縁取り（薄め）
    ctx.font = `700 ${epiFont}px serif`;
    ctx.strokeStyle = `rgba(0, 0, 0, ${0.62 * alpha})`;
    ctx.lineWidth = Math.max(1, Math.round(epiFont * 0.12));
    strokeSpacedText(epithet, upperX, epiY, epiSpacing);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.98 * alpha})`;
    drawSpacedText(epithet, upperX, epiY, epiSpacing);

    // 下段（キャラ名）文字自身のシャドウ縁取り（薄め）
    ctx.font = `700 ${nameFont}px serif`;
    ctx.strokeStyle = `rgba(0, 0, 0, ${0.62 * alpha})`;
    ctx.lineWidth = Math.max(1, Math.round(nameFont * 0.12));
    strokeSpacedText(name, lowerX, nameY, nameSpacing);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.98 * alpha})`;
    drawSpacedText(name, lowerX, nameY, nameSpacing);
    ctx.restore();
  }

  function drawFrame(t, options = {}) {
    const { forceOverlayVisible = false } = options;
    parseSettings();
    const alpha = forceOverlayVisible ? 1 : clamp(computeAlpha(t), 0, 1);
    const design = UI.designSelect.value;
    const ff14OverlayAlpha =
      design === "ff14-shadowbringers"
        ? forceOverlayVisible
          ? 1
          : computeFF14OverlayAlpha(t)
        : 1;
    const overlayAlpha = alpha * ff14OverlayAlpha;

    const cam =
      design === "ff14-shadowbringers"
        ? getFF14CameraState(t)
        : { bgZoom: 1, charZoom: 1, driftX: 0, driftY: 0 };
    const preset =
      (UI.cameraPresetSelect && UI.cameraPresetSelect.value) || "standard";
    const endZoom = getEndZoomoutMultiplier(t);
    // 終盤ズームアウトは背景/立ち絵へ同位相で直接適用
    const finalBgZoom = cam.bgZoom * endZoom.bg;
    const finalCharZoom = cam.charZoom * endZoom.bg;
    const endZoomBlend = clamp((1 - endZoom.bg) / 0.18, 0, 1);

    // 奥行き差演出: 同じカメラ値でも背景/立ち絵で追従量を分離
    const isStandardLensDiff =
      design === "ff14-shadowbringers" && preset === "standard";
    const bgDriftBase = isStandardLensDiff ? 0.3 : 0.35;
    const bgDriftYBase = isStandardLensDiff ? 0.46 : 0.55;
    const charDriftBase = isStandardLensDiff ? 0.95 : 0.9;
    const charDriftYBase = isStandardLensDiff ? 1.38 : 1.25;
    const bgDriftX = cam.driftX * lerp(bgDriftBase, 0.9, endZoomBlend);
    const bgDriftY = cam.driftY * lerp(bgDriftYBase, 1.15, endZoomBlend);
    const charDriftX = cam.driftX * lerp(charDriftBase, 0.9, endZoomBlend);
    const charDriftY = cam.driftY * lerp(charDriftYBase, 1.15, endZoomBlend);
    const bgZoomPushY =
      -(finalBgZoom - 1) *
      state.height *
      lerp(isStandardLensDiff ? 0.06 : 0.08, 0.14, endZoomBlend);
    const charZoomPushY =
      -(finalCharZoom - 1) *
      state.height *
      lerp(isStandardLensDiff ? 0.2 : 0.16, 0.14, endZoomBlend);

    ctx.clearRect(0, 0, state.width, state.height);

    drawImageLayer(
      state.bgImage,
      Number(UI.bgScale.value) * finalBgZoom,
      Number(UI.bgX.value) + bgDriftX,
      Number(UI.bgY.value) + bgDriftY + bgZoomPushY,
      "#1a1f2a",
      {
        headBiasForTall: false,
        coverCanvas: true,
        coverClampRelax: 0.1 * endZoomBlend,
      },
    );

    const switchEnabled = !!(
      UI.charSwitchEnable &&
      UI.charSwitchEnable.checked &&
      state.charImage2
    );
    const switchAt = clamp(
      Number(UI.charSwitchTime && UI.charSwitchTime.value) || 1.4,
      0,
      state.duration,
    );
    const switchDur = clamp(
      Number(UI.charSwitchDuration && UI.charSwitchDuration.value) || 0.35,
      0.05,
      2,
    );
    const switchType = (UI.charSwitchType && UI.charSwitchType.value) || "fade";
    const pSwitch = switchEnabled
      ? clamp((t - switchAt) / Math.max(0.001, switchDur), 0, 1)
      : 0;
    const isAfter = switchEnabled && t >= switchAt;

    const charScaleNow =
      getCharScaleByCanvasHeight(Number(UI.charScale.value)) * finalCharZoom;
    const charXNow = Number(UI.charX.value) + charDriftX;
    const charYNow = Number(UI.charY.value) + charDriftY + charZoomPushY;

    function drawChar(img, alphaMul = 1, extra = {}) {
      if (!img || alphaMul <= 0.001) return;
      const prevA = ctx.globalAlpha;
      ctx.globalAlpha = prevA * clamp(alphaMul, 0, 1);
      drawImageLayer(img, charScaleNow, charXNow, charYNow, "rgba(0,0,0,0)", {
        headBiasForTall: true,
        ...extra,
      });
      ctx.globalAlpha = prevA;
    }

    const nextChar = state.charImage2 || state.charImage;
    let flashOverlayAlpha = 0;
    if (!switchEnabled) {
      drawChar(state.charImage, 1);
    } else if (switchType === "cut") {
      drawChar(isAfter ? nextChar : state.charImage, 1);
    } else if (switchType === "fade") {
      drawChar(state.charImage, 1 - pSwitch);
      drawChar(nextChar, pSwitch);
    } else if (switchType === "flash-subtitle") {
      // 15fps基準で約2フレーム（0.133秒）: さらに短く、切替テンポを早める
      const flashDur = 2 / 15;

      if (t < switchAt) {
        // フラッシュ前は画像1のみ
        drawChar(state.charImage, 1);
      } else if (t < switchAt + flashDur) {
        // フラッシュ中は立ち絵を一旦消す（登場アニメーションなし）
        const fp = clamp((t - switchAt) / flashDur, 0, 1);
        const pulse = Math.sin(fp * Math.PI);
        flashOverlayAlpha = 0.88 * pulse;
      } else {
        // フラッシュ後に画像2を即表示
        drawChar(nextChar, 1);
      }
    } else if (switchType === "glitch-slice") {
      drawChar(state.charImage, 1 - pSwitch);
      const slices = 8;
      const hSlice = state.height / slices;
      const prevA = ctx.globalAlpha;
      ctx.globalAlpha = prevA * pSwitch;
      for (let i = 0; i < slices; i++) {
        const y0 = i * hSlice;
        const jitter =
          (Math.sin((i + 1) * 37 + pSwitch * 40) * 0.5 + 0.5) * 22 - 11;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, y0, state.width, hSlice + 1);
        ctx.clip();
        drawImageLayer(
          nextChar,
          charScaleNow,
          charXNow + jitter,
          charYNow,
          "rgba(0,0,0,0)",
          {
            headBiasForTall: true,
          },
        );
        ctx.restore();
      }
      ctx.globalAlpha = prevA;
    } else if (switchType === "wipe-left") {
      // 仕様: ワイプ前は画像1のみ、ワイプ後は画像2のみ
      if (t < switchAt) {
        drawChar(state.charImage, 1);
      } else {
        const pWipe = clamp((t - switchAt) / Math.max(0.001, switchDur), 0, 1);
        drawChar(state.charImage, 1 - pWipe);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, state.width * pWipe, state.height);
        ctx.clip();
        drawImageLayer(
          nextChar,
          charScaleNow,
          charXNow,
          charYNow,
          "rgba(0,0,0,0)",
          {
            headBiasForTall: true,
          },
        );
        ctx.restore();
      }
    } else if (switchType === "zoom-pop") {
      const z = lerp(1.08, 1.0, pSwitch);
      drawChar(state.charImage, 1 - pSwitch);
      const prevA = ctx.globalAlpha;
      ctx.globalAlpha = prevA * pSwitch;
      drawImageLayer(
        nextChar,
        charScaleNow * z,
        charXNow,
        charYNow,
        "rgba(0,0,0,0)",
        { headBiasForTall: true },
      );
      ctx.globalAlpha = prevA;
    } else {
      drawChar(state.charImage, 1 - pSwitch);
      drawChar(nextChar, pSwitch);
    }

    if (design !== "ff14-shadowbringers") {
      drawCover(alpha);
    }
    if (design !== "ff14-shadowbringers") {
      drawSubtitleBand(overlayAlpha);
    }
    drawTexts(overlayAlpha);

    // 要望: 白フラッシュは字幕の上に重ねる
    if (flashOverlayAlpha > 0.02) {
      ctx.fillStyle = `rgba(255,255,255,${flashOverlayAlpha})`;
      ctx.fillRect(0, 0, state.width, state.height);
    }
  }

  function animationLoop(now) {
    if (!state.playing) return;
    if (!state.startAt) state.startAt = now;
    const elapsed = (now - state.startAt) / 1000;
    const shouldLoop = !!(UI.webpLoopCheckbox && UI.webpLoopCheckbox.checked);

    if (!shouldLoop && elapsed >= state.duration) {
      drawFrame(state.duration);
      state.playing = false;
      state.animReq = null;
      setStatus("プレビュー終了");
      return;
    }

    const t = shouldLoop ? elapsed % state.duration : elapsed;
    drawFrame(t);
    state.animReq = requestAnimationFrame(animationLoop);
  }

  function stopPreview() {
    state.playing = false;
    state.startAt = 0;
    if (state.animReq) cancelAnimationFrame(state.animReq);
    state.animReq = null;
    drawFrame(0, { forceOverlayVisible: true });
    setStatus("停止中");
  }

  function playPreview() {
    state.playing = true;
    state.startAt = 0;
    if (state.animReq) cancelAnimationFrame(state.animReq);
    state.animReq = requestAnimationFrame(animationLoop);
    setStatus("プレビュー再生中");
  }

  function selectSupportedWebmMimeType() {
    const candidates = [
      "video/webm;codecs=vp8",
      "video/webm;codecs=vp9",
      "video/webm",
    ];
    for (const m of candidates) {
      if (MediaRecorder.isTypeSupported(m)) return m;
    }
    return "video/webm";
  }

  async function recordCanvasToWebmBlob(options = {}) {
    const fps = options.fps || state.fps;
    const duration = options.duration || state.duration;
    const mimeType = selectSupportedWebmMimeType();

    const stream = canvas.captureStream(0);
    const videoTrack = stream.getVideoTracks()[0];
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 12_000_000,
    });

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const done = new Promise((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = (ev) => reject(ev.error || new Error("録画失敗"));
    });

    recorder.start();

    const totalFrames = Math.ceil(duration * fps);
    for (let i = 0; i < totalFrames; i++) {
      const t = i / fps;
      drawFrame(t);
      if (videoTrack && typeof videoTrack.requestFrame === "function") {
        videoTrack.requestFrame();
      }
      await new Promise((r) => requestAnimationFrame(() => r()));
    }

    recorder.stop();
    await done;

    stream.getTracks().forEach((t) => t.stop());
    return new Blob(chunks, { type: "video/webm" });
  }

  function exportPng() {
    try {
      if (!state.playing) {
        drawFrame(0, { forceOverlayVisible: true });
      }
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "boss_cutin.png";
      a.click();
      setStatus("PNGを書き出しました");
    } catch (error) {
      console.error(error);
      setStatus("PNG書き出しに失敗しました");
      alert("PNG書き出しに失敗しました。");
    }
  }

  async function ensureFfmpegLoaded() {
    if (state.ffmpeg) return state.ffmpeg;

    async function loadScriptIfNeeded(url) {
      return new Promise((resolve, reject) => {
        const existing = Array.from(document.querySelectorAll("script")).find(
          (s) => s.src === url,
        );
        if (existing) {
          if (existing.dataset.loaded === "1") return resolve();
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener(
            "error",
            () => reject(new Error(`script load failed: ${url}`)),
            { once: true },
          );
          return;
        }

        const script = document.createElement("script");
        script.src = url;
        script.async = true;
        script.addEventListener(
          "load",
          () => {
            script.dataset.loaded = "1";
            resolve();
          },
          { once: true },
        );
        script.addEventListener(
          "error",
          () => reject(new Error(`script load failed: ${url}`)),
          { once: true },
        );
        document.head.appendChild(script);
      });
    }

    async function ensureFfmpegGlobals() {
      // v0.12 系では FFmpegWASM が主流、環境によって FFmpeg の場合もある
      if (window.FFmpegWASM || window.FFmpeg) return;

      const ffmpegLibUrls = [
        "vendor/ffmpeg/ffmpeg.js",
        "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js",
        "https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js",
      ];
      const utilLibUrls = [
        "vendor/ffmpeg/util.js",
        "https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/umd/index.js",
        "https://unpkg.com/@ffmpeg/util@0.12.1/dist/umd/index.js",
      ];

      for (const url of ffmpegLibUrls) {
        try {
          await loadScriptIfNeeded(url);
          if (window.FFmpegWASM || window.FFmpeg) break;
        } catch (_) {}
      }

      if (!window.FFmpegUtil) {
        for (const url of utilLibUrls) {
          try {
            await loadScriptIfNeeded(url);
            if (window.FFmpegUtil) break;
          } catch (_) {}
        }
      }
    }

    await ensureFfmpegGlobals();

    const ffmpegNs = window.FFmpegWASM || window.FFmpeg;
    if (!ffmpegNs || !ffmpegNs.FFmpeg) {
      throw new Error(
        "ffmpeg.wasm の本体ライブラリが見つかりません（FFmpegWASM/FFmpeg 未定義）",
      );
    }

    const { FFmpeg } = ffmpegNs;
    const toBlobURL =
      window.FFmpegUtil && typeof window.FFmpegUtil.toBlobURL === "function"
        ? window.FFmpegUtil.toBlobURL
        : null;
    const ffmpeg = new FFmpeg();

    const bases = [
      "vendor/ffmpeg",
      "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd",
      "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd",
    ];

    let lastError = null;
    for (const base of bases) {
      try {
        // 1) 直接URLでロード（最も単純）
        await ffmpeg.load({
          coreURL: `${base}/ffmpeg-core.js`,
          wasmURL: `${base}/ffmpeg-core.wasm`,
        });
        state.ffmpeg = ffmpeg;
        return ffmpeg;
      } catch (directErr) {
        lastError = directErr;
      }

      // 2) util が使える場合は Blob URL 経由も試す
      if (toBlobURL) {
        try {
          await ffmpeg.load({
            coreURL: await toBlobURL(
              `${base}/ffmpeg-core.js`,
              "text/javascript",
            ),
            wasmURL: await toBlobURL(
              `${base}/ffmpeg-core.wasm`,
              "application/wasm",
            ),
          });
          state.ffmpeg = ffmpeg;
          return ffmpeg;
        } catch (blobErr) {
          lastError = blobErr;
        }
      }
    }

    throw new Error(
      "ffmpeg.wasmの初期化に失敗しました: " +
        (lastError && lastError.message
          ? lastError.message
          : String(lastError || "unknown")),
    );
  }

  async function renderWebmBlobForConvert() {
    parseSettings();
    return recordCanvasToWebmBlob({ fps: state.fps, duration: state.duration });
  }

  async function exportAnimatedWebp() {
    UI.exportWebpBtn.disabled = true;
    UI.exportPngBtn.disabled = true;
    setStatus(
      "アニメーションWebPを書き出し中...（初回は少し時間がかかります）",
    );

    try {
      const ffmpeg = await ensureFfmpegLoaded();
      const inputWebm = await renderWebmBlobForConvert();
      const inputData = new Uint8Array(await inputWebm.arrayBuffer());
      const convertFps = Math.min(state.fps, 30);

      // 既存ファイルが残っていると失敗しやすいため、可能な範囲で事前削除
      try {
        await ffmpeg.deleteFile("in.webm");
      } catch (_) {}
      try {
        await ffmpeg.deleteFile("out.webp");
      } catch (_) {}

      await ffmpeg.writeFile("in.webm", inputData);
      await ffmpeg.exec([
        "-y",
        "-i",
        "in.webm",
        "-vcodec",
        "libwebp",
        "-loop",
        UI.webpLoopCheckbox && UI.webpLoopCheckbox.checked ? "0" : "1",
        "-an",
        "-q:v",
        "70",
        "-vf",
        `fps=${convertFps},scale=${state.width}:${state.height}:flags=lanczos`,
        "out.webp",
      ]);

      const out = await ffmpeg.readFile("out.webp");
      const blob = new Blob([out.buffer], { type: "image/webp" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "boss_cutin.webp";
      a.click();
      URL.revokeObjectURL(url);

      setStatus("アニメーションWebPを書き出しました");
    } catch (error) {
      console.error(error);
      setStatus("WebP書き出しに失敗しました");
      alert(
        "アニメーションWebP書き出しに失敗しました。\n保存FPSを30以下にする・尺を短くする・解像度を下げると改善する場合があります。\n詳細: " +
          (error && error.message ? error.message : String(error)),
      );
    } finally {
      UI.exportWebpBtn.disabled = false;
      UI.exportPngBtn.disabled = false;
    }
  }

  function bindEvents() {
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        switchControlsTab(btn.dataset.tab || "basic");
      });
    });
    UI.resolutionSelect.addEventListener("change", () =>
      drawFrame(0, { forceOverlayVisible: true }),
    );
    UI.durationInput.addEventListener("input", () =>
      drawFrame(0, { forceOverlayVisible: true }),
    );
    UI.fpsSelect.addEventListener("change", () =>
      drawFrame(0, { forceOverlayVisible: true }),
    );
    UI.designSelect.addEventListener("change", () =>
      drawFrame(0, { forceOverlayVisible: true }),
    );
    UI.cameraPresetSelect.addEventListener("change", () =>
      drawFrame(0, { forceOverlayVisible: true }),
    );
    UI.endZoomoutCheckbox.addEventListener("change", () => {
      updateEndZoomoutControlsVisibility();
      persistEndZoomSettings();
      drawFrame(0, { forceOverlayVisible: true });
    });
    if (UI.endZoomoutDurationRatio) {
      syncRangeNumber(
        UI.endZoomoutDurationRatio,
        UI.endZoomoutDurationRatioNumber,
        () => {
          persistEndZoomSettings();
          drawFrame(0, { forceOverlayVisible: true });
        },
      );
      syncRangeNumber(
        UI.endZoomoutReturnRatio,
        UI.endZoomoutReturnRatioNumber,
        () => {
          persistEndZoomSettings();
          drawFrame(0, { forceOverlayVisible: true });
        },
      );
    }
    UI.subtitleScale15.addEventListener("change", () =>
      drawFrame(0, { forceOverlayVisible: true }),
    );
    if (UI.charSwitchEnable && UI.charSwitchControls) {
      UI.charSwitchEnable.addEventListener("change", () => {
        const on = !!UI.charSwitchEnable.checked;
        if (UI.charSwitchDependent) {
          UI.charSwitchDependent.classList.toggle("is-visible", on);
        }
        UI.charSwitchControls.classList.toggle("is-visible", on);
        drawFrame(0, { forceOverlayVisible: true });
      });
      const on = !!UI.charSwitchEnable.checked;
      if (UI.charSwitchDependent) {
        UI.charSwitchDependent.classList.toggle("is-visible", on);
      }
      UI.charSwitchControls.classList.toggle("is-visible", on);
    }
    syncRangeNumber(UI.charSwitchTime, UI.charSwitchTimeNumber, () =>
      drawFrame(0, { forceOverlayVisible: true }),
    );
    syncRangeNumber(UI.charSwitchDuration, UI.charSwitchDurationNumber, () =>
      drawFrame(0, { forceOverlayVisible: true }),
    );
    if (UI.charSwitchType) {
      UI.charSwitchType.addEventListener("change", () =>
        drawFrame(0, { forceOverlayVisible: true }),
      );
    }
    UI.epithetInput.addEventListener("input", () =>
      drawFrame(0, { forceOverlayVisible: true }),
    );
    UI.nameInput.addEventListener("input", () =>
      drawFrame(0, { forceOverlayVisible: true }),
    );

    syncRangeNumber(UI.bgScale, UI.bgScaleNumber, () =>
      drawFrame(0, { forceOverlayVisible: true }),
    );
    syncRangeNumber(UI.bgX, UI.bgXNumber, () =>
      drawFrame(0, { forceOverlayVisible: true }),
    );
    syncRangeNumber(UI.bgY, UI.bgYNumber, () =>
      drawFrame(0, { forceOverlayVisible: true }),
    );
    syncRangeNumber(UI.charScale, UI.charScaleNumber, () =>
      drawFrame(0, { forceOverlayVisible: true }),
    );
    syncRangeNumber(UI.charX, UI.charXNumber, () =>
      drawFrame(0, { forceOverlayVisible: true }),
    );
    syncRangeNumber(UI.charY, UI.charYNumber, () =>
      drawFrame(0, { forceOverlayVisible: true }),
    );

    UI.bgUpload.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      state.bgImage = await loadImageFromFile(file);
      drawFrame(0, { forceOverlayVisible: true });
    });

    UI.charUpload.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      state.charImage = await loadImageFromFile(file);
      drawFrame(0, { forceOverlayVisible: true });
    });
    if (UI.charUpload2) {
      UI.charUpload2.addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        state.charImage2 = await loadImageFromFile(file);
        drawFrame(0, { forceOverlayVisible: true });
      });
    }

    UI.playBtn.addEventListener("click", playPreview);
    UI.stopBtn.addEventListener("click", stopPreview);
    UI.exportWebpBtn.addEventListener("click", exportAnimatedWebp);
    UI.exportPngBtn.addEventListener("click", exportPng);
  }

  async function init() {
    loadPersistedEndZoomSettings();
    updateEndZoomoutControlsVisibility();
    bindEvents();
    try {
      state.bgImage = await loadImageFromPath("img/logBG/Hachimaki_ext.png");
    } catch (error) {
      console.warn("default background load failed", error);
    }
    try {
      state.charImage = await loadImageFromPath("img/アリサ.webp");
      state.charImage2 = await loadImageFromPath("img/人斬りセーラー.webp");
      // 腰上立ち絵向けの初期値（軽め）
      if (UI.charScale) UI.charScale.value = "1.1";
      if (UI.charScaleNumber) UI.charScaleNumber.value = "1.1";
      if (UI.charY) UI.charY.value = "40";
      if (UI.charYNumber) UI.charYNumber.value = "40";
      if (UI.charX) UI.charX.value = "0";
      if (UI.charXNumber) UI.charXNumber.value = "0";
    } catch (error) {
      console.warn("default character load failed", error);
    }
    drawFrame(0, { forceOverlayVisible: true });
    setStatus("待機中");

    window.addEventListener("beforeunload", () => {
      state.pinnedBlobUrls.forEach((u) => URL.revokeObjectURL(u));
      state.pinnedBlobUrls = [];
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();

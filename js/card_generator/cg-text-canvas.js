// js/card_generator/cg-text-canvas.js

(function () {
  if (window.CG_TEXT_CANVAS) return;

  const { layoutText } = window.CG_TEXT_LAYOUT;

  const getGlyphSpacingAdjust = (style, ch, width) => {
    const font = style?.font || "";
    const isKlee = /Klee One/i.test(font);
    if (!isKlee) return { drawOffsetX: 0, advanceExtra: 0 };

    // Klee One の半角クォートは左右サイドベアリングの見え方が偏るため、
    // 「描画位置を左へ + 進み幅を少し増やす」を同時に行って見た目の字間を均す。
    if (ch === '"') {
      return {
        drawOffsetX: -8,
        advanceExtra: 2,
      };
    }
    if (ch === "'") {
      return {
        drawOffsetX: -8,
        advanceExtra: 2,
      };
    }
    return { drawOffsetX: 0, advanceExtra: 0 };
  };

  const drawTokens = (ctx, line, x, y, opts, style) => {
    let cursor = x;
    const hasStroke = !!style?.strokeColor && (style?.strokeWidth || 0) > 0;
    for (const token of line.tokens) {
      const tracking =
        token.type === "alpha"
          ? opts.alphaTracking
          : token.type === "jp"
            ? opts.jpTracking
            : 0;
      const chars = Array.from(token.text);
      for (const ch of chars) {
        const w = ctx.measureText(ch).width;
        const { drawOffsetX, advanceExtra } = getGlyphSpacingAdjust(
          style,
          ch,
          w,
        );
        const drawX = cursor + drawOffsetX;
        if (hasStroke) {
          ctx.strokeText(ch, drawX, y);
        }
        ctx.fillText(ch, drawX, y);
        cursor += w + tracking + advanceExtra;
      }
    }
  };

  const isFontReady = (font) => {
    if (!font) return true;
    if (!document.fonts?.check) return true;

    // `document.fonts.check("... primary, fallback")` だと
    // fallbackが利用可能なだけでtrueになることがあるため、
    // 先頭フォントだけを抽出して判定する。
    const normalized = String(font).trim();
    const firstFamilyPart = normalized.includes(",")
      ? normalized.split(",")[0].trim()
      : normalized;

    return document.fonts.check(firstFamilyPart);
  };

  const drawBlock = (ctx, text, rect, style, layoutOptions) => {
    if (!text) return;
    if (style?.font && !isFontReady(style.font)) return;
    ctx.save();
    ctx.font = style.font;
    ctx.fillStyle = style.color;
    ctx.textBaseline = "top";
    ctx.textAlign = style.align || "left";
    if (style.strokeColor && (style.strokeWidth || 0) > 0) {
      ctx.strokeStyle = style.strokeColor;
      ctx.lineWidth = style.strokeWidth;
      ctx.lineJoin = style.lineJoin || "round";
      ctx.lineCap = style.lineCap || "round";
      ctx.miterLimit = style.miterLimit || 2;
    }

    const layout = layoutText(text, ctx, {
      maxWidth: rect.width,
      maxLines: layoutOptions.maxLines,
      lineHeight: layoutOptions.lineHeight,
      jpTracking: layoutOptions.jpTracking,
      alphaTracking: layoutOptions.alphaTracking,
      kinsoku: layoutOptions.kinsoku,
      ellipsis: layoutOptions.ellipsis,
      punctScale: layoutOptions.punctScale,
    });

    const totalHeight = layout.lineHeight * layout.lines.length;
    let y = rect.y;
    if (style.vAlign === "bottom") {
      y = rect.y + rect.height - totalHeight;
    } else if (style.vAlign === "center") {
      y = rect.y + (rect.height - totalHeight) / 2;
    }
    if (y < rect.y) y = rect.y;
    for (const line of layout.lines) {
      const lineWidth = line.width || 0;
      const startX =
        ctx.textAlign === "right"
          ? rect.x + rect.width - lineWidth
          : ctx.textAlign === "center"
            ? rect.x + (rect.width - lineWidth) / 2
            : rect.x;
      // サブピクセル座標だと小さい句読点/濁点が欠けて見えることがあるため、
      // 描画座標をピクセルに寄せて安定化する。
      const alignedX = Math.round(startX * 2) / 2;
      const alignedY = Math.round(y);
      drawTokens(ctx, line, alignedX, alignedY, layoutOptions, style);
      y += layout.lineHeight;
      if (y > rect.y + rect.height) break;
    }
    ctx.restore();
  };

  const renderTextLayer = (canvas, data, settings, scale = 1) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (scale !== 1) {
      ctx.scale(scale, scale);
    }

    drawBlock(
      ctx,
      data.effect,
      settings.effect.rect,
      settings.effect.style,
      settings.effect.layout,
    );
    drawBlock(
      ctx,
      data.flavor,
      settings.flavor.rect,
      settings.flavor.style,
      settings.flavor.layout,
    );

    if (data.speaker) {
      const speakerText = settings.speaker.prefix
        ? `${settings.speaker.prefix}${data.speaker}`
        : data.speaker;
      drawBlock(
        ctx,
        speakerText,
        settings.speaker.rect,
        settings.speaker.style,
        settings.speaker.layout,
      );
    }
  };

  window.CG_TEXT_CANVAS = { renderTextLayer };
})();

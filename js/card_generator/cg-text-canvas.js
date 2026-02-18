// js/card_generator/cg-text-canvas.js

(function () {
  if (window.CG_TEXT_CANVAS) return;

  const { layoutText } = window.CG_TEXT_LAYOUT;

  const drawTokens = (ctx, line, x, y, opts) => {
    let cursor = x;
    for (const token of line.tokens) {
      const tracking =
        token.type === "alpha"
          ? opts.alphaTracking
          : token.type === "jp"
            ? opts.jpTracking
            : 0;
      const chars = Array.from(token.text);
      for (const ch of chars) {
        ctx.fillText(ch, cursor, y);
        const w = ctx.measureText(ch).width;
        cursor += w + tracking;
      }
    }
  };

  const isFontReady = (font) => {
    if (!font) return true;
    if (!document.fonts?.check) return true;
    return document.fonts.check(font);
  };

  const drawBlock = (ctx, text, rect, style, layoutOptions) => {
    if (!text) return;
    if (style?.font && !isFontReady(style.font)) return;
    ctx.save();
    ctx.font = style.font;
    ctx.fillStyle = style.color;
    ctx.textBaseline = "top";
    ctx.textAlign = style.align || "left";

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
      drawTokens(ctx, line, startX, y, layoutOptions);
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

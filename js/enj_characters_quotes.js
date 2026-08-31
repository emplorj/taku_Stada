(() => {
  "use strict";

  const detail = document.getElementById("character-detail");
  const dialog = document.getElementById("character-dialog");
  if (!detail) return;

  // セリフ枠の単位はスプレッドシートでの改行。ひとつの行に
  // 「…」「…」と連ねた場合も、掛け合いを含む一つの枠として保つ。
  let normalizeFrame = 0;
  let spotlightTimer = null;

  function isYusukeDetail() {
    const name = detail.querySelector("#detail-name")?.textContent?.trim() || "";
    const kicker = detail.querySelector(".detail-kicker")?.textContent?.trim() || "";
    return name === "ゆうすけ" || /^#162(?:\D|$)/.test(kicker);
  }

  function splitAtBreaks(parent) {
    const fragments = [];
    let fragment = document.createDocumentFragment();
    let hasContent = false;

    const flush = () => {
      if (!hasContent) return;
      fragments.push(fragment);
      fragment = document.createDocumentFragment();
      hasContent = false;
    };

    [...parent.childNodes].forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
        flush();
        return;
      }
      fragment.append(node.cloneNode(true));
      if (node.nodeType === Node.ELEMENT_NODE || String(node.textContent || "").trim()) hasContent = true;
    });
    flush();
    return fragments;
  }

  function lineFragments(card) {
    const paragraphs = [...card.children].filter((element) => element.tagName === "P");
    if (paragraphs.length) return paragraphs.flatMap(splitAtBreaks);
    return splitAtBreaks(card);
  }

  function quoteCard(source, fragment) {
    const card = source.cloneNode(false);
    const paragraph = document.createElement("p");
    paragraph.append(fragment);
    card.append(paragraph);
    return card;
  }

  function normalizeQuoteCards() {
    const container = detail.querySelector(".detail-quotes");
    if (!container || container.dataset.quoteUnitsNormalized) return;

    if (isYusukeDetail()) {
      container.dataset.quoteUnitsNormalized = "yusuke-double-newline";
      return;
    }

    const nextCards = [];
    container.querySelectorAll(":scope > .detail-quote").forEach((source) => {
      lineFragments(source).forEach((fragment) => {
        const probe = document.createElement("div");
        probe.append(fragment.cloneNode(true));
        const text = probe.textContent.trim();
        if (!text) return;

        nextCards.push(quoteCard(source, fragment));
      });
    });

    if (nextCards.length) container.replaceChildren(...nextCards);
    container.dataset.quoteUnitsNormalized = "line";
  }

  function clearSpotlightTimer() {
    if (spotlightTimer !== null) window.clearInterval(spotlightTimer);
    spotlightTimer = null;
  }

  function startSpotlightTimer(container) {
    clearSpotlightTimer();
    const lines = [...container.querySelectorAll("[data-quote-spotlight-index]")];
    if (lines.length < 2) return;
    let activeIndex = 0;
    spotlightTimer = window.setInterval(() => {
      lines[activeIndex]?.classList.remove("is-active");
      activeIndex = (activeIndex + 1) % lines.length;
      lines[activeIndex]?.classList.add("is-active");
    }, 5200);
  }

  function normalizeQuoteSpotlight() {
    const container = detail.querySelector(".detail-quote-spotlight");
    if (!container) {
      clearSpotlightTimer();
      return;
    }
    if (container.dataset.quoteUnitsNormalized) return;

    if (isYusukeDetail()) {
      clearSpotlightTimer();
      container.dataset.quoteUnitsNormalized = "yusuke-double-newline";
      return;
    }

    const nextLines = [];
    [...container.querySelectorAll("[data-quote-spotlight-index]")].forEach((source) => {
      const text = source.textContent.trim();
      if (!text) return;
      const line = source.cloneNode(false);
      const normalized = text.replace(/[!?]/g, (mark) => mark === "!" ? "！" : "？");
      line.textContent = normalized;
      line.classList.remove("is-active", "is-compact", "has-opening-quote");
      if (normalized.replace(/\s/g, "").length > 54) line.classList.add("is-compact");
      if (/^[「『“"]/.test(normalized)) line.classList.add("has-opening-quote");
      nextLines.push(line);
    });

    nextLines.forEach((line, index) => {
      line.dataset.quoteSpotlightIndex = String(index);
      line.classList.toggle("is-active", index === 0);
    });
    if (nextLines.length) container.replaceChildren(...nextLines);
    container.dataset.quoteUnitsNormalized = "line";
    startSpotlightTimer(container);
  }

  function normalizeQuotes() {
    normalizeQuoteCards();
    normalizeQuoteSpotlight();
  }

  function scheduleNormalize() {
    if (normalizeFrame) return;
    normalizeFrame = window.requestAnimationFrame(() => {
      normalizeFrame = 0;
      normalizeQuotes();
    });
  }

  new MutationObserver(scheduleNormalize).observe(detail, { childList: true, subtree: true });
  dialog?.addEventListener("close", clearSpotlightTimer);
  scheduleNormalize();
})();

(() => {
  "use strict";

  const detail = document.getElementById("character-detail");
  const dialog = document.getElementById("character-dialog");
  if (!detail) return;

  // Normal characters use one spoken quotation as one card, even when the
  // spreadsheet cell contains multiple 「…」「…」 quotations on the same line.
  // #162 ゆうすけ is intentionally different: his narration is part of the
  // quote collection, and the existing blank-paragraph (two-newline) groups
  // are the authored units, so we leave those groups untouched.
  const SPOKEN_QUOTE_PATTERN = /「[^」]*」|『[^』]*』|“[^”]*”|"[^"\n]*"/g;
  let normalizeFrame = 0;
  let spotlightTimer = null;

  function isYusukeDetail() {
    const name = detail.querySelector("#detail-name")?.textContent?.trim() || "";
    const kicker = detail.querySelector(".detail-kicker")?.textContent?.trim() || "";
    return name === "ゆうすけ" || /^#162(?:\D|$)/.test(kicker);
  }

  function spokenQuotes(text) {
    return String(text || "").match(SPOKEN_QUOTE_PATTERN) || [];
  }

  function meaningfulNodes(element) {
    return [...element.childNodes].filter((node) =>
      node.nodeType === Node.ELEMENT_NODE || String(node.textContent || "").trim()
    );
  }

  function wholeLineSpoiler(element) {
    const nodes = meaningfulNodes(element);
    return nodes.length === 1 &&
      nodes[0].nodeType === Node.ELEMENT_NODE &&
      nodes[0].classList.contains("spoiler-text")
      ? nodes[0]
      : null;
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

  function plainFragment(text, spoilerTemplate = null) {
    const fragment = document.createDocumentFragment();
    if (spoilerTemplate) {
      const spoiler = spoilerTemplate.cloneNode(false);
      spoiler.textContent = text;
      fragment.append(spoiler);
    } else {
      fragment.append(document.createTextNode(text));
    }
    return fragment;
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

        const quotes = spokenQuotes(text);
        if (quotes.length <= 1) {
          nextCards.push(quoteCard(source, fragment));
          return;
        }

        // A spoiler may wrap several adjacent quotations in one sheet line.
        // Split those quotations into separate cards while keeping each card
        // independently revealable with the existing delegated spoiler handler.
        const spoilerTemplate = wholeLineSpoiler(probe);
        quotes.forEach((quote) => nextCards.push(quoteCard(source, plainFragment(quote, spoilerTemplate))));
      });
    });

    if (nextCards.length) container.replaceChildren(...nextCards);
    container.dataset.quoteUnitsNormalized = "spoken-quote";
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
      const quotes = spokenQuotes(text);
      const units = quotes.length ? quotes : (text ? [text] : []);
      units.forEach((unit) => {
        const line = source.cloneNode(false);
        const normalized = unit.replace(/[!?]/g, (mark) => mark === "!" ? "！" : "？");
        line.textContent = normalized;
        line.classList.remove("is-active", "is-compact", "has-opening-quote");
        if (normalized.replace(/\s/g, "").length > 54) line.classList.add("is-compact");
        if (/^[「『“"]/.test(normalized)) line.classList.add("has-opening-quote");
        nextLines.push(line);
      });
    });

    nextLines.forEach((line, index) => {
      line.dataset.quoteSpotlightIndex = String(index);
      line.classList.toggle("is-active", index === 0);
    });
    if (nextLines.length) container.replaceChildren(...nextLines);
    container.dataset.quoteUnitsNormalized = "spoken-quote";
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

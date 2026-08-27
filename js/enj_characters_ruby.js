(() => {
  "use strict";

  const YUTO_RUBY_PATTERN = /\|([^《\n]+)《([^》\n]+)》/g;

  function replaceYutoRubyInElement(element) {
    if (!element || element.dataset.yutoRubyProcessed === "true") return;
    const source = element.textContent || "";
    if (!YUTO_RUBY_PATTERN.test(source)) return;
    YUTO_RUBY_PATTERN.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    let match;
    while ((match = YUTO_RUBY_PATTERN.exec(source))) {
      if (match.index > cursor) fragment.append(document.createTextNode(source.slice(cursor, match.index)));
      const ruby = document.createElement("ruby");
      ruby.append(document.createTextNode(match[1]));
      const rt = document.createElement("rt");
      rt.textContent = match[2];
      ruby.append(rt);
      fragment.append(ruby);
      cursor = match.index + match[0].length;
    }
    if (cursor < source.length) fragment.append(document.createTextNode(source.slice(cursor)));

    element.replaceChildren(fragment);
    element.dataset.yutoRubyProcessed = "true";
  }

  function applyYutoRuby(root = document) {
    root.querySelectorAll?.(".character-card__tagline, [data-yuto-ruby]").forEach(replaceYutoRubyInElement);
  }

  const grid = document.getElementById("character-grid");
  if (grid) {
    new MutationObserver(() => applyYutoRuby(grid)).observe(grid, { childList: true, subtree: true });
    applyYutoRuby(grid);
  }
})();

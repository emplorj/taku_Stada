/* Desktop section scrolling; compact mobile navigation. No wheel interception. */
document.addEventListener("DOMContentLoaded", () => {
  const frame = document.querySelector(".controls-panel");
  const nav = document.getElementById("form-sidebar");
  const links = [...nav.querySelectorAll(".sidebar-link")];
  const panels = links.map(link => document.getElementById(link.dataset.target));
  const mobileNav = document.querySelector(".mobile-workspace-nav");
  const select = document.getElementById("mobile-workspace-select");
  const moneyToggle = document.getElementById("mobile-money-toggle");
  const mobileRemaining = document.getElementById("mobile-money-remaining");
  const remaining = document.getElementById("money-sidebar-remaining");
  const desktop = matchMedia("(min-width: 1100px)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let current = panels.findIndex(panel => panel.classList.contains("active"));
  if (current < 0) current = 0;
  let pendingFrame = 0;
  let settleTimer = 0;
  let pointerDown = false;
  const lazyPanelScripts = {
    "panel-enemy-builder": [
      "./data/sw25_enemy_data.js?v=20261121a",
      "./js/sw25_enemy_builder.js?v=20260808q",
    ],
  };
  const lazyPanelScriptTasks = new Map();

  function ensurePanelScript(panelId) {
    const sources = lazyPanelScripts[panelId];
    if (!sources) return Promise.resolve();
    if (lazyPanelScriptTasks.has(panelId)) return lazyPanelScriptTasks.get(panelId);

    const loadScript = (src, key) => new Promise((resolve, reject) => {
      const selector = `script[data-sw25-panel-script="${key}"]`;
      const existing = document.querySelector(selector);
      if (existing) {
        if (existing.dataset.loaded === "true") resolve();
        else {
          existing.addEventListener("load", resolve, { once: true });
          existing.addEventListener("error", reject, { once: true });
        }
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.sw25PanelScript = key;
      script.addEventListener("load", () => {
        script.dataset.loaded = "true";
        resolve();
      }, { once: true });
      script.addEventListener("error", () => {
        reject(new Error(`Failed to load ${src}`));
      }, { once: true });
      document.head.appendChild(script);
    });
    const task = sources.reduce(
      (chain, src, index) => chain.then(() => loadScript(src, `${panelId}-${index}`)),
      Promise.resolve(),
    ).catch((error) => {
      lazyPanelScriptTasks.delete(panelId);
      throw error;
    });
    lazyPanelScriptTasks.set(panelId, task);
    return task;
  }

  function panelStart(panel) {
    const padding = parseFloat(getComputedStyle(frame).paddingTop) || 0;
    return Math.max(0, panel.getBoundingClientRect().top - frame.getBoundingClientRect().top
      + frame.scrollTop - frame.clientTop - padding);
  }

  function settleBoundary() {
    clearTimeout(settleTimer);
    if (!desktop.matches || pointerDown) return;
    // Do not pull an input away while the user is editing it.
    if (frame.contains(document.activeElement) && document.activeElement.matches("input, textarea, select, [contenteditable]")) return;
    const style = getComputedStyle(frame);
    const available = frame.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const position = frame.scrollTop;
    const maximum = frame.scrollHeight - frame.clientHeight;
    let nearest = position;
    let distance = Infinity;
    for (const panel of panels) {
      const start = Math.min(maximum, panelStart(panel));
      const end = Math.min(maximum, start + Math.max(0, panel.getBoundingClientRect().height - available));
      // Every position inside a tall section is valid, including its bottom edge.
      if (position >= start - 2 && position <= end + 2) return;
      const candidate = position < start ? start : end;
      if (Math.abs(candidate - position) < distance) {
        nearest = candidate;
        distance = Math.abs(candidate - position);
      }
    }
    if (distance > 2) frame.scrollTo({ top: nearest, behavior: reducedMotion.matches ? "instant" : "smooth" });
  }

  links.forEach((link, index) => {
    const option = document.createElement("option");
    option.value = panels[index].id;
    option.textContent = link.textContent.trim();
    select.appendChild(option);
    link.href = `#${panels[index].id}`;
  });

  function markCurrent(index) {
    current = index;
    panels.forEach((panel, i) => {
      panel.classList.toggle("active", i === index);
      links[i].classList.toggle("active", i === index);
      if (i === index) links[i].setAttribute("aria-current", "true");
      else links[i].removeAttribute("aria-current");
    });
    select.value = panels[index].id;
    document.body.classList.toggle("sw25-money-relevant", index < 4);
    window.dispatchEvent(new CustomEvent("sw25-panel-activated", {
      detail: { panelId: panels[index].id },
    }));
  }

  function readScroll() {
    pendingFrame = 0;
    if (!desktop.matches) return;
    const top = frame.getBoundingClientRect().top + 32;
    let index = 0;
    panels.forEach((panel, i) => {
      if (panel.getBoundingClientRect().top <= top + frame.clientHeight * .2) index = i;
    });
    if (index !== current) markCurrent(index);
  }

  async function navigate(index) {
    const panel = panels[index];
    if (!panel) return;
    try {
      await ensurePanelScript(panel.id);
    } catch (error) {
      console.error("SW2.5 panel script load failed:", error);
    }
    markCurrent(index);
    if (desktop.matches) {
      const offset = panelStart(panel);
      frame.scrollTo({ top: Math.max(0, offset), behavior: reducedMotion.matches ? "instant" : "smooth" });
    } else {
      moneyToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("sw25-money-open");
      frame.scrollTop = 0;
      frame.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }

  // Replace the legacy click-only switching while keeping its other form logic.
  nav.addEventListener("click", event => {
    const link = event.target.closest(".sidebar-link");
    if (!link) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigate(links.indexOf(link));
  }, true);
  select.addEventListener("change", () => navigate(panels.findIndex(panel => panel.id === select.value)));
  const enemyBuilderPanel = document.getElementById("panel-enemy-builder");
  if (enemyBuilderPanel && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      ensurePanelScript(enemyBuilderPanel.id).catch(error => console.error("SW2.5 panel script load failed:", error));
      observer.disconnect();
    }, { root: frame, rootMargin: "320px 0px" });
    observer.observe(enemyBuilderPanel);
  }
  frame.addEventListener("scroll", () => {
    if (!pendingFrame && desktop.matches) pendingFrame = requestAnimationFrame(readScroll);
    clearTimeout(settleTimer);
    if (desktop.matches) settleTimer = setTimeout(settleBoundary, 180);
  }, { passive: true });
  frame.addEventListener("pointerdown", () => { pointerDown = true; });
  window.addEventListener("pointerup", () => {
    if (!pointerDown) return;
    pointerDown = false;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settleBoundary, 180);
  });
  window.addEventListener("pointercancel", () => { pointerDown = false; });

  moneyToggle.addEventListener("click", () => {
    const open = moneyToggle.getAttribute("aria-expanded") !== "true";
    moneyToggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("sw25-money-open", open);
  });
  const syncMoney = () => { mobileRemaining.textContent = remaining.textContent; };
  new MutationObserver(syncMoney).observe(remaining, { childList: true, characterData: true, subtree: true });
  syncMoney();

  function updateMode() {
    clearTimeout(settleTimer);
    document.body.classList.toggle("sw25-scroll-desktop", desktop.matches);
    document.body.classList.toggle("sw25-scroll-mobile", !desktop.matches);
    mobileNav.hidden = desktop.matches;
    markCurrent(current);
    requestAnimationFrame(() => {
      if (desktop.matches) {
        const offset = panelStart(panels[current]);
        frame.scrollTo({ top: Math.max(0, offset), behavior: "instant" });
      } else frame.scrollTop = 0;
    });
  }
  desktop.addEventListener("change", updateMode);
  updateMode();
});

(() => {
  "use strict";
  const attached = new WeakSet();
  const normalize = value => String(value).normalize("NFKC").toLowerCase()
    .replace(/[ァ-ヶ]/g, letter => String.fromCharCode(letter.charCodeAt(0) - 0x60)).replace(/\s+/g, "");
  let active = null, menu = null, sequence = 0, committing = false;

  function close() {
    if (!active) return;
    active.input.setAttribute("aria-expanded", "false");
    active.input.removeAttribute("aria-activedescendant");
    active.button.setAttribute("aria-expanded", "false");
    menu.hidden = true;
    active = null;
  }

  function position() {
    if (!active) return;
    if (!active.input.isConnected) return close();
    const rect = active.input.parentElement.getBoundingClientRect();
    const width = Math.min(Math.max(280, rect.width), window.innerWidth - 16);
    const below = window.innerHeight - rect.bottom - 8;
    const above = below < 160 && rect.top > below;
    const height = Math.min(280, Math.max(60, above ? rect.top - 8 : below));
    Object.assign(menu.style, {
      width: `${width}px`, maxHeight: `${height}px`,
      left: `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`,
      top: `${above ? Math.max(8, rect.top - Math.min(menu.scrollHeight, height)) : rect.bottom}px`,
    });
  }

  function highlight(index) {
    active.index = index;
    for (const option of menu.querySelectorAll('[role="option"]')) {
      option.setAttribute("aria-selected", String(Number(option.dataset.index) === index));
    }
    const option = menu.querySelector(`[data-index="${index}"]`);
    if (!option) return active.input.removeAttribute("aria-activedescendant");
    active.input.setAttribute("aria-activedescendant", option.id);
    if (option.offsetTop < menu.scrollTop) menu.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > menu.scrollTop + menu.clientHeight) {
      menu.scrollTop = option.offsetTop + option.offsetHeight - menu.clientHeight;
    }
  }

  function choose(index) {
    const picker = active, option = picker?.options[index];
    if (!option) return;
    close();
    committing = true;
    try {
      picker.select.value = option.value;
      picker.select.dispatchEvent(new Event("change", { bubbles: true }));
      picker.input.dispatchEvent(new Event("input", { bubbles: true }));
      picker.input.focus({ preventScroll: true });
    } finally { committing = false; }
  }

  function open(picker, query = "", selectCurrent = false) {
    if (picker.input.disabled || picker.input.readOnly) return;
    close();
    active = picker;
    const term = normalize(query);
    picker.options = Array.from(picker.select.options).filter(option => option.value && !option.disabled && !option.hidden &&
      (!term || normalize(option.textContent).includes(term)));
    menu.replaceChildren();
    let previousGroup = "";
    picker.options.forEach((source, index) => {
      const group = source.parentElement.tagName === "OPTGROUP" ? source.parentElement.label : "";
      if (group && group !== previousGroup) {
        const heading = document.createElement("div");
        heading.className = "shinjuku-picker-group";
        heading.setAttribute("role", "presentation");
        heading.textContent = group;
        menu.appendChild(heading);
      }
      previousGroup = group;
      const option = document.createElement("div");
      option.id = `shinjuku-picker-option-${index}`;
      option.dataset.index = index;
      option.setAttribute("role", "option");
      option.textContent = source.textContent;
      menu.appendChild(option);
    });
    if (!picker.options.length) {
      const empty = document.createElement("div");
      empty.className = "shinjuku-picker-empty";
      empty.setAttribute("role", "status");
      empty.textContent = "候補なし・そのまま入力できます";
      menu.appendChild(empty);
    }
    picker.input.setAttribute("aria-expanded", "true");
    picker.button.setAttribute("aria-expanded", "true");
    menu.hidden = false;
    menu.scrollTop = 0;
    position();
    highlight(selectCurrent ? picker.options.findIndex(option => normalize(option.value) === normalize(picker.input.value)) : -1);
  }

  function attach(input, select) {
    if (!input || !select || attached.has(input)) return;
    attached.add(input);
    if (!menu) {
      menu = document.createElement("div");
      menu.id = "shinjuku-picker-menu";
      menu.className = "shinjuku-picker-menu";
      menu.setAttribute("role", "listbox");
      menu.setAttribute("aria-label", "入力候補");
      menu.hidden = true;
      document.body.appendChild(menu);
      menu.addEventListener("pointerdown", event => {
        if (event.target.closest('[role="option"]')) event.preventDefault();
      });
      menu.addEventListener("click", event => {
        const option = event.target.closest('[role="option"]');
        if (active && option) choose(Number(option.dataset.index));
      });
      document.addEventListener("pointerdown", event => {
        if (active && !menu.contains(event.target) && !active.input.parentElement.contains(event.target)) close();
      });
      document.addEventListener("focusin", event => {
        if (active && !active.input.parentElement.contains(event.target) && !menu.contains(event.target)) close();
      });
      // Keep the floating list attached to its field inside horizontally scrolling tables.
      document.addEventListener("scroll", event => { if (event.target !== menu) position(); }, true);
      window.addEventListener("resize", position);
    }
    select.hidden = true;
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "shinjuku-picker-toggle";
    button.setAttribute("aria-label", select.getAttribute("aria-label") || "候補を表示");
    button.setAttribute("aria-controls", menu.id);
    button.setAttribute("aria-expanded", "false");
    button.title = "候補を表示（↑↓で移動・Enterで決定）";
    select.parentElement.appendChild(button);
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-haspopup", "listbox");
    input.setAttribute("aria-controls", menu.id);
    input.setAttribute("aria-expanded", "false");
    input.autocomplete = "off";
    if (!input.id) input.id = `shinjuku-picker-input-${++sequence}`;
    const picker = { input, select, button, options: [], index: -1, composing: false };
    button.addEventListener("pointerdown", event => event.preventDefault());
    button.addEventListener("click", () => {
      if (active === picker) close();
      else { input.focus({ preventScroll: true }); open(picker, "", true); }
    });
    input.addEventListener("input", event => {
      if (!committing && !picker.composing && !event.isComposing) open(picker, input.value);
    });
    input.addEventListener("compositionstart", () => { picker.composing = true; close(); });
    input.addEventListener("compositionend", () => { picker.composing = false; open(picker, input.value); });
    input.addEventListener("keydown", event => {
      if (event.isComposing || picker.composing || event.keyCode === 229) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (active !== picker) open(picker, "", true);
        const length = picker.options.length;
        if (length) highlight(picker.index < 0 ? (event.key === "ArrowDown" ? 0 : length - 1) :
          (picker.index + (event.key === "ArrowDown" ? 1 : -1) + length) % length);
      } else if (event.key === "Enter" && active === picker) {
        event.preventDefault();
        choose(Math.max(0, picker.index));
      } else if (event.key === "Escape" && active === picker) {
        event.preventDefault();
        event.stopPropagation();
        close();
      } else if (event.key === "Tab") close();
    });
  }

  function reorder(handle, row, onChange) {
    handle.addEventListener("keydown", event => {
      if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const other = event.key === "ArrowUp" ? row.previousElementSibling : row.nextElementSibling;
      if (!other) return;
      row.parentElement.insertBefore(row, event.key === "ArrowUp" ? other : other.nextElementSibling);
      handle.focus({ preventScroll: true });
      onChange();
    });
    handle.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;
      event.preventDefault();
      close();
      handle.focus({ preventScroll: true });
      const body = row.parentElement, pointerId = event.pointerId, startY = event.clientY;
      let y = startY, dragging = false, changed = false, frame;
      function place() {
        const before = Array.from(body.children).find(other => other !== row &&
          y < other.getBoundingClientRect().top + other.getBoundingClientRect().height / 2) || null;
        if (row.nextElementSibling !== before) {
          body.insertBefore(row, before);
          changed = true;
        }
      }
      function scroll() {
        if (dragging) {
          const delta = y < 70 ? -12 : y > window.innerHeight - 70 ? 12 : 0;
          if (delta) { window.scrollBy(0, delta); place(); }
        }
        frame = requestAnimationFrame(scroll);
      }
      function move(next) {
        if (next.pointerId !== pointerId) return;
        next.preventDefault();
        y = next.clientY;
        if (!dragging && Math.abs(y - startY) < 5) return;
        dragging = true;
        row.classList.add("is-reordering");
        place();
      }
      function finish(next) {
        if (next.pointerId !== undefined && next.pointerId !== pointerId) return;
        cancelAnimationFrame(frame);
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", finish);
        document.removeEventListener("pointercancel", finish);
        window.removeEventListener("blur", finish);
        row.classList.remove("is-reordering");
        if (dragging && next.type !== "blur") handle.focus({ preventScroll: true });
        if (changed) onChange();
      }
      document.addEventListener("pointermove", move, { passive: false });
      document.addEventListener("pointerup", finish);
      document.addEventListener("pointercancel", finish);
      window.addEventListener("blur", finish);
      frame = requestAnimationFrame(scroll);
    });
  }

  window.ShinjukuInputs = Object.freeze({ attach, reorder, close });
  document.addEventListener("DOMContentLoaded", () => {
    const catalog = window.ShinjukuItems;
    for (const slot of ["r", "l", "b"]) {
      const input = document.querySelector(`[name="equip_${slot}_name"]`);
      if (!input) continue;
      input.setAttribute("aria-label", `${slot === "r" ? "右手" : slot === "l" ? "左手" : "胴"}の装備名`);
      const field = key => document.querySelector(`[name="equip_${slot}_${key}"]`);
      const wrapper = document.createElement("div");
      wrapper.className = "equipment-name-controls";
      input.replaceWith(wrapper);
      wrapper.appendChild(input);
      const trigger = document.createElement("span");
      trigger.className = "equipment-preset-trigger";
      trigger.innerHTML = '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i>';
      const select = document.createElement("select");
      select.setAttribute("aria-label", slot === "b" ? "防具の選択" : `${slot === "r" ? "右手" : "左手"}の武器の選択`);
      select.appendChild(new Option("装備を選択", ""));
      for (const item of catalog.all.filter(item => slot === "b" ? item.armor : item.weapon)) {
        select.appendChild(new Option(item.name, item.name));
      }
      trigger.appendChild(select);
      wrapper.appendChild(trigger);
      let previousName = input.value;
      function applyPreset(name) {
        const item = catalog.get(name), stat = slot === "b" ? item?.armor : item?.weapon;
        if (!stat) return;
        for (const [key, value] of Object.entries({ name: item.name, stat, price: item.price,
          w: item.w, h: item.h, note: catalog.describe(item.name, slot) })) field(key).value = value;
        previousName = input.value;
        window.queueTextareaAutoResize?.(field("note"));
        window.calculateTotal?.();
      }
      select.addEventListener("change", () => {
        const name = select.value;
        select.value = "";
        applyPreset(name);
      });
      input.addEventListener("change", () => {
        if (input.value !== previousName) applyPreset(input.value.trim());
        previousName = input.value;
      });
      attach(input, select);
    }
  });
})();

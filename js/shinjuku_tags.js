(() => {
  "use strict";
  const separator = /[\s,，、;；]+/u;
  function parse(value) {
    const raw = Array.isArray(value) ? value.join(",") : String(value ?? "");
    return [...new Set(raw.split(separator).map(tag =>
      tag.replace(/^[#＃\[\]【】〈〉［］]+|[\[\]【】〈〉［］]+$/gu, "").trim()).filter(Boolean))];
  }
  const format = value => parse(value).join(", ");
  if (typeof module !== "undefined" && module.exports) module.exports = { parse, format };
  if (typeof document === "undefined") return;
  const api = window.ShinjukuTags = { parse, format, commit() {}, refresh() {} };

  document.addEventListener("DOMContentLoaded", () => {
    const original = document.querySelector('[name="tags"]');
    if (!original) return;
    const editor = document.createElement("div");
    editor.className = "tag-editor";
    const chips = document.createElement("div");
    chips.className = "tag-chips";
    const entry = document.createElement("input");
    entry.type = "text";
    entry.id = "tag-entry";
    entry.autocomplete = "off";
    entry.enterKeyHint = "done";
    entry.placeholder = "タグを追加";
    entry.setAttribute("aria-label", "タグを追加");
    entry.setAttribute("aria-describedby", "tags-help");
    const entryControls = document.createElement("div");
    entryControls.className = "tag-entry-controls";
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "tag-add-button";
    addButton.textContent = "追加";
    addButton.setAttribute("aria-label", "入力中のタグを追加");
    entryControls.append(entry, addButton);
    editor.append(chips, entryControls);
    original.before(editor);
    original.hidden = true;
    original.closest(".tag-row").querySelector("label").htmlFor = entry.id;
    let tags = [], editing = -1, composing = false, syncing = false, commitAfterComposition = false;

    function render() {
      chips.replaceChildren();
      tags.forEach((tag, index) => {
        if (index === editing) return;
        const chip = document.createElement("span");
        chip.className = "tag-chip";
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "tag-chip-label";
        edit.textContent = tag;
        edit.setAttribute("aria-label", `タグ「${tag}」を編集`);
        edit.addEventListener("pointerdown", event => event.preventDefault());
        edit.addEventListener("click", () => {
          commit();
          editing = tags.indexOf(tag);
          entry.value = tag;
          render();
          entry.focus();
          entry.select();
        });
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "tag-chip-remove";
        remove.textContent = "×";
        remove.setAttribute("aria-label", `タグ「${tag}」を削除`);
        remove.addEventListener("pointerdown", event => event.preventDefault());
        remove.addEventListener("click", () => {
          commit();
          tags = tags.filter(value => value !== tag);
          editing = -1;
          sync();
          render();
          entry.focus();
        });
        chip.append(edit, remove);
        chips.appendChild(chip);
      });
    }
    function sync() {
      original.value = format(tags);
      syncing = true;
      try { original.dispatchEvent(new Event("input", { bubbles: true })); }
      finally { syncing = false; }
    }
    function add(parts) {
      if (editing >= 0) tags.splice(editing, 1, ...parts);
      else tags.push(...parts);
      tags = parse(tags);
      editing = -1;
      sync();
      render();
    }
    function commit() {
      if (composing) return;
      const parts = parse(entry.value);
      if (!parts.length && editing < 0) return;
      entry.value = "";
      add(parts);
    }
    function consumeSeparators() {
      if (composing || !separator.test(entry.value)) return;
      const parts = entry.value.split(separator);
      const pending = parts.pop();
      entry.value = pending;
      add(parse(parts));
    }
    function refresh() {
      tags = parse(original.value);
      editing = -1;
      entry.value = "";
      render();
    }
    entry.addEventListener("input", consumeSeparators);
    entry.addEventListener("compositionstart", () => { composing = true; });
    entry.addEventListener("compositionend", () => {
      composing = false;
      consumeSeparators();
      if (commitAfterComposition) {
        commitAfterComposition = false;
        commit();
        entry.focus();
      }
    });
    addButton.addEventListener("click", () => {
      // Let a tap finish the IME first, then add its confirmed text.
      if (composing) { commitAfterComposition = true; return; }
      commit();
      entry.focus();
    });
    entry.addEventListener("keydown", event => {
      if (composing || event.isComposing || event.keyCode === 229) return;
      if ((event.key === "Enter" || event.key === "Tab") && entry.value.trim()) {
        event.preventDefault();
        commit();
      } else if (event.key === "Enter") {
        event.preventDefault();
      } else if (event.key === "Backspace" && !entry.value && tags.length) {
        event.preventDefault();
        if (editing >= 0) add([]);
        if (!tags.length) return;
        editing = tags.length - 1;
        entry.value = tags[editing];
        render();
      } else if (event.key === "Escape" && editing >= 0) {
        editing = -1;
        entry.value = "";
        render();
      }
    });
    entry.addEventListener("blur", commit);
    editor.addEventListener("click", event => { if (event.target === editor || event.target === chips) entry.focus(); });
    original.addEventListener("input", () => { if (!syncing) refresh(); });
    original.form.addEventListener("reset", () => queueMicrotask(refresh));
    api.commit = commit;
    api.refresh = refresh;
    refresh();
  });
})();

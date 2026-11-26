const ShinjukuBagLayout = (() => {
  const COLS = 6, ROWS = 6;
  const size = value => Number.isFinite(Number(value)) ? Math.max(1, Math.floor(Number(value))) : 1;

  function canPlace(item, x, y, others) {
    if (!Number.isInteger(item.w) || !Number.isInteger(item.h) || item.w < 1 || item.h < 1
      || !Number.isInteger(x) || !Number.isInteger(y) || item.w > COLS
      || x < 0 || x + item.w > COLS || y + item.h > ROWS || y + item.h <= 0) return false;
    return !others.some(other => other.id !== item.id && !other.unplaced
      && x < other.x + other.w && x + item.w > other.x
      && y < other.y + other.h && y + item.h > other.y);
  }

  function findEmptyPosition(item, others) {
    for (let y = ROWS - item.h; y >= 0; y--) {
      for (let x = 0; x <= COLS - item.w; x++) {
        if (canPlace(item, x, y, others)) return { x, y };
      }
    }
    // Above the bag is legal only while part of the item remains inside it.
    const levels = [...new Set([Math.min(-1, ROWS - item.h), ...others.filter(o => !o.unplaced).map(o => o.y - item.h)])]
      .filter(y => y < 0 && y + item.h > 0).sort((a, b) => b - a);
    for (const y of levels) for (let x = 0; x <= COLS - item.w; x++) {
      if (canPlace(item, x, y, others)) return { x, y };
    }
    return null;
  }

  function arrange(source, preserveIds = new Set(source.filter(i => !i.unplaced).map(i => i.id))) {
    const result = source.map(item => ({ ...item, w: size(item.w), h: size(item.h) }));
    const placed = [], waiting = [];
    for (const item of result) {
      if (preserveIds.has(item.id) && !item.unplaced && canPlace(item, item.x, item.y, placed)) placed.push(item);
      else waiting.push(item);
    }
    for (const item of waiting) {
      let best = null;
      for (const [w, h] of [[item.w, item.h], [item.h, item.w]]) {
        const pos = findEmptyPosition({ ...item, w, h }, placed);
        if (pos && (!best || Math.max(0, -pos.y) * w < Math.max(0, -best.y) * best.w)) best = { ...pos, w, h };
      }
      if (best) {
        Object.assign(item, best, { unplaced: false });
        placed.push(item);
      } else Object.assign(item, { x: 0, y: 0, unplaced: true });
    }
    return result;
  }
  return { canPlace, arrange };
})();

if (typeof module !== "undefined" && module.exports) module.exports = ShinjukuBagLayout;

if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", () => {
  const CELL_SIZE = 40; // cssと合わせる
  const GRID_COLS = 6;
  const SAFE_ROWS = 6;

  const puzzleArea = document.getElementById("puzzle-area");
  const penaltyBg = document.getElementById("penalty-background");
  const itemLayer = document.getElementById("item-layer");
  const penaltyDisplay = document.getElementById("penalty-display");
  const itemListBody = document.querySelector("#item-list tbody");
  const syncBtn = document.getElementById("btn-sync-puzzle");
  const addRowBtn = document.getElementById("add-item-row");
  const hiddenInput = document.getElementById("puzzle_positions");
  const pendingSection = document.getElementById("bag-unplaced");
  const pendingLayer = document.getElementById("bag-unplaced-items");
  const placementStatus = document.getElementById("bag-placement-status");
  const itemCatalog = window.ShinjukuItems;

  let items = []; // {id, x, y, w, h, name, rawW, rawH}

  // --- テキストエリア自動高さ調整 ---
  function autoResizeTextarea(el) {
    if (!el) return;
    el.style.height = "auto"; // 一旦リセット
    const border = getComputedStyle(el).boxSizing === "border-box" ? el.offsetHeight - el.clientHeight : 0;
    el.style.height = el.scrollHeight + border + "px"; // 内容に合わせて設定
  }

  // --- 所持品リストの行生成 ---
  function createItemRow(index, data = {}) {
    const tr = document.createElement("tr");
    const rowId =
      data.rowId ||
      `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    tr.dataset.id = rowId;

    let w = 1,
      h = 1;
    if (data.size) {
      const parts = data.size.split("x");
      if (parts.length === 2) {
        w = parts[0];
        h = parts[1];
      }
    } else if (data.w && data.h) {
      w = data.w;
      h = data.h;
    }

    tr.innerHTML = `
            <td><div class="item-name-controls">
              <input type="text" name="item_name" class="sync-trigger" placeholder="所持品名（自由入力）" aria-label="所持品名">
              <span class="item-preset-trigger">
                <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
                <select class="item-preset" aria-label="所持品の選択" title="所持品の選択"></select>
              </span>
            </div></td>
            <td><input type="number" name="item_price" placeholder="0" class="calc-trigger"></td>
            <td style="text-align:center;"><input type="checkbox" name="item_free" class="calc-trigger"></td>
            <td>
                <div class="size-input-group">
                    <input type="number" name="item_w" min="1">
                    <span>×</span>
                    <input type="number" name="item_h" min="1">
                </div>
            </td>
            <td><input type="number" name="item_count" placeholder="-"></td>
            <td><textarea name="item_note" rows="1"></textarea></td>
            <td class="delete-cell"></td>
        `;

    const field = key => tr.querySelector(`[name="item_${key}"]`);
    for (const [key, value] of Object.entries({ name: data.name ?? "", price: data.price ?? "",
      w, h, count: data.count ?? "", note: data.note ?? "" })) field(key).value = value;
    field("free").checked = Boolean(data.isFree);
    const select = tr.querySelector(".item-preset");
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "道具を選択";
    select.appendChild(placeholder);
    for (const category of ["武器", "防具", "その他の道具"]) {
      const group = document.createElement("optgroup");
      group.label = category;
      for (const item of itemCatalog.all.filter(item => item.category === category)) {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        group.appendChild(option);
      }
      select.appendChild(group);
    }
    const custom = document.createElement("option");
    custom.value = "custom";
    custom.textContent = "自由入力";
    select.appendChild(custom);
    let previousName = field("name").value;
    function applyPreset(name) {
      const preset = itemCatalog.get(name);
      if (!preset) return;
      for (const [key, value] of Object.entries({ name: preset.name, price: preset.price,
        w: preset.w, h: preset.h, count: preset.count, note: itemCatalog.describe(preset.name) })) field(key).value = value;
      previousName = field("name").value;
      if (window.queueTextareaAutoResize) window.queueTextareaAutoResize(field("note"));
      else autoResizeTextarea(field("note"));
      savePositionsToHidden();
      window.calculateTotal?.();
    }
    select.addEventListener("change", () => {
      const choice = select.value;
      select.value = "";
      if (choice === "custom") field("name").focus();
      else applyPreset(choice);
    });
    field("name").addEventListener("change", () => {
      if (field("name").value !== previousName) applyPreset(field("name").value.trim());
      previousName = field("name").value;
    });
    tr.addEventListener("input", savePositionsToHidden);

    // ★修正: calc-triggerへのイベント付与を関数内に移動
    tr.querySelectorAll(".calc-trigger").forEach((el) => {
      el.addEventListener("input", () => {
        if (window.calculateTotal) window.calculateTotal();
      });
    });

    // テキストエリアの自動調整設定
    const ta = tr.querySelector('textarea[name="item_note"]');
    if (ta) {
      if (window.queueTextareaAutoResize) {
        window.queueTextareaAutoResize(ta);
      } else {
        ta.addEventListener("input", () => autoResizeTextarea(ta));
        setTimeout(() => autoResizeTextarea(ta), 0);
      }
    }

    // 削除ボタン生成
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "delete-row-btn";
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.title = "削除";

    // 削除イベント
    delBtn.addEventListener("click", () => {
      const puzzleEl = document.getElementById(rowId + "-puzzle");
      if (puzzleEl) {
        puzzleEl.remove();
      }
      items = items.filter((i) => i.id !== rowId);
      tr.remove();
      updatePenalty();
      savePositionsToHidden();
      if (window.calculateTotal) window.calculateTotal(); // 削除時も再計算
    });

    tr.querySelector(".delete-cell").appendChild(delBtn);

    return tr;
  }

  // 初回10行生成
  for (let i = 0; i < 10; i++) {
    itemListBody.appendChild(createItemRow(i));
  }

  // 行追加ボタン
  addRowBtn.addEventListener("click", () => {
    itemListBody.appendChild(createItemRow(0));
  });

  // --- パズル同期 ---
  syncBtn.addEventListener("click", syncPuzzleFromList);

  function syncPuzzleFromList() {
    const rows = itemListBody.querySelectorAll("tr");
    const existingItems = new Map(items.map((i) => [i.id, i]));
    const desired = [];

    rows.forEach((row) => {
      const id = row.dataset.id;
      const nameInput = row.querySelector(`input[name="item_name"]`);
      const wInput = row.querySelector(`input[name="item_w"]`);
      const hInput = row.querySelector(`input[name="item_h"]`);

      const name = nameInput.value;
      if (!name) return;

      let w = parseInt(wInput.value) || 1;
      let h = parseInt(hInput.value) || 1;
      if (w < 1) w = 1;
      if (h < 1) h = 1;

      const old = existingItems.get(id);
      const unchanged = old && old.rawW === w && old.rawH === h;
      desired.push({ ...old, id, name, x: old?.x ?? 0, y: old?.y ?? 0,
        w: unchanged ? old.w : w, h: unchanged ? old.h : h, rawW: w, rawH: h });
    });

    const activeIds = new Set(desired.map(i => i.id));
    for (const old of items) if (!activeIds.has(old.id)) document.getElementById(old.id + "-puzzle")?.remove();
    items = ShinjukuBagLayout.arrange(desired, new Set()).map(next => {
      const current = existingItems.get(next.id);
      return current ? Object.assign(current, next) : next;
    });
    for (const item of items) {
      const el = document.getElementById(item.id + "-puzzle");
      if (el) renderPuzzleElement(el, item);
      else createPuzzleElement(item);
    }

    updatePenalty();
    savePositionsToHidden();
    placementStatus.textContent = items.some(i => i.unplaced) ? "入りきらないアイテムは未配置欄にあります。" : "下から重ならない位置に積みました。";
  }

  function renderPuzzleElement(el, itemData) {
    const parent = itemData.unplaced ? pendingLayer : itemLayer;
    if (el.parentElement !== parent) parent.appendChild(el);
    el.style.position = "";
    el.style.width = itemData.w * CELL_SIZE + "px";
    el.style.height = itemData.h * CELL_SIZE + "px";
    el.dataset.size = `${itemData.w}×${itemData.h}`;
    el.querySelector("span").textContent = itemData.name;
    if (itemData.unplaced) {
      el.style.left = el.style.top = "";
    } else updateElementPosition(el, itemData.x, itemData.y);
  }

  function createPuzzleElement(itemData) {
    const el = document.createElement("div");
    el.className = "puzzle-item";
    el.id = itemData.id + "-puzzle";
    el.style.width = itemData.w * CELL_SIZE + "px";
    el.style.height = itemData.h * CELL_SIZE + "px";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = itemData.name;
    el.appendChild(nameSpan);

    const rotIcon = document.createElement("div");
    rotIcon.className = "rotate-icon";
    rotIcon.innerHTML = '<i class="fa-solid fa-rotate"></i>';
    el.appendChild(rotIcon);

    updateElementPosition(el, itemData.x, itemData.y);
    setupDrag(el, itemData);

    el.addEventListener("dblclick", (e) => {
      e.preventDefault();
      const rotated = { ...itemData, w: itemData.h, h: itemData.w };
      if (!itemData.unplaced && !ShinjukuBagLayout.canPlace(rotated, rotated.x, rotated.y, items)) {
        placementStatus.textContent = "重なるかカバンからはみ出すため、ここでは回転できません。";
        return;
      }
      Object.assign(itemData, rotated);
      renderPuzzleElement(el, itemData);
      placementStatus.textContent = "回転しました。";
      updatePenalty();
      savePositionsToHidden();
    });

    renderPuzzleElement(el, itemData);
  }

  function updateElementPosition(el, gridX, gridY) {
    el.style.left = gridX * CELL_SIZE + "px";
    el.style.top = gridY * CELL_SIZE + "px";
  }

  function setupDrag(el, itemData) {
    let isDragging = false;
    let didMove = false;
    let startX, startY;
    let initialLeft, initialTop;
    let initialWidth, initialHeight;
    let nextLeft, nextTop;
    let dragFrame = 0;

    el.addEventListener("mousedown", dragStart);
    el.addEventListener("touchstart", dragStart, { passive: false });

    function dragStart(e) {
      if (e.type === "mousedown" && e.button !== 0) return;
      isDragging = true;
      didMove = false;
      const clientX =
        e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
      const clientY =
        e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
      startX = clientX;
      startY = clientY;
      const rect = el.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      initialWidth = rect.width;
      initialHeight = rect.height;
      nextLeft = initialLeft;
      nextTop = initialTop;
      el.style.zIndex = 1000;
      el.style.willChange = "transform";
      el.classList.add("is-dragging");
      document.addEventListener("mousemove", dragMove);
      document.addEventListener("touchmove", dragMove, { passive: false });
      document.addEventListener("mouseup", dragEnd);
      document.addEventListener("touchend", dragEnd);
      document.addEventListener("touchcancel", dragEnd);
    }

    function dragMove(e) {
      if (!isDragging) return;
      e.preventDefault();
      const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
      nextLeft = initialLeft + (clientX - startX);
      nextTop = initialTop + (clientY - startY);
      if (!didMove && Math.abs(clientX - startX) + Math.abs(clientY - startY) > 3) {
        didMove = true;
        el.style.width = initialWidth + "px";
        el.style.height = initialHeight + "px";
        document.body.appendChild(el);
        el.style.position = "fixed";
        el.style.left = initialLeft + "px";
        el.style.top = initialTop + "px";
      }
      if (!didMove) return;
      if (dragFrame) return;
      dragFrame = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${nextLeft - initialLeft}px, ${nextTop - initialTop}px, 0)`;
        dragFrame = 0;
      });
    }

    function dragEnd(e) {
      if (!isDragging) return;
      isDragging = false;
      el.style.zIndex = "";
      el.style.willChange = "";
      document.removeEventListener("mousemove", dragMove);
      document.removeEventListener("touchmove", dragMove);
      document.removeEventListener("mouseup", dragEnd);
      document.removeEventListener("touchend", dragEnd);
      document.removeEventListener("touchcancel", dragEnd);

      if (dragFrame) {
        cancelAnimationFrame(dragFrame);
        dragFrame = 0;
      }
      el.style.transform = "";
      const bagRect = puzzleArea.getBoundingClientRect();
      let gridX = Math.round((nextLeft - bagRect.left) / CELL_SIZE);
      let gridY = Math.round((nextTop - bagRect.top) / CELL_SIZE);

      gridX = Math.max(0, Math.min(GRID_COLS - itemData.w, gridX));
      if (gridY + itemData.h > SAFE_ROWS) {
        gridY = SAFE_ROWS - itemData.h;
      }

      if (didMove) {
        if (e.type !== "touchcancel" && ShinjukuBagLayout.canPlace(itemData, gridX, gridY, items)) {
          Object.assign(itemData, { x: gridX, y: gridY, unplaced: false });
          placementStatus.textContent = "配置しました。";
        } else placementStatus.textContent = "重なる場所やカバンの範囲外には置けません。";
      }
      renderPuzzleElement(el, itemData);
      requestAnimationFrame(() => el.classList.remove("is-dragging"));
      updatePenalty();
      savePositionsToHidden();
    }
  }

  // --- ペナルティ表示更新 ---
  function updatePenalty() {
    let penaltyCount = 0;
    let minGridY = 0;
    pendingSection.hidden = !items.some(item => item.unplaced);

    items.forEach((item) => {
      if (item.unplaced) return;
      if (item.y < minGridY) minGridY = item.y;
      penaltyCount += item.w * Math.min(item.h, Math.max(0, -item.y));
    });

    if (penaltyCount > 0) {
      penaltyDisplay.textContent = `ペナルティ: -${penaltyCount}`;
      penaltyDisplay.style.color = "#ff5555";
      puzzleArea.classList.add("show-penalty");

      const overflowHeight = Math.abs(minGridY) * CELL_SIZE;
      penaltyBg.style.top = minGridY * CELL_SIZE + "px";
      penaltyBg.style.height = overflowHeight + "px";
      puzzleArea.style.marginTop = overflowHeight + 30 + "px";
    } else {
      penaltyDisplay.textContent = `ペナルティ: 0`;
      penaltyDisplay.style.color = "#eee";
      puzzleArea.classList.remove("show-penalty");
      puzzleArea.style.marginTop = "20px";
      penaltyBg.style.top = "0px";
      penaltyBg.style.height = "0px";
    }
  }

  // --- 保存用 ---
  function savePositionsToHidden() {
    const data = items.map((i) => {
      const row = itemListBody.querySelector(`tr[data-id="${i.id}"]`);
      const note = row
        ? row.querySelector(`textarea[name="item_note"]`).value
        : "";
      const price = row
        ? row.querySelector(`input[name="item_price"]`).value
        : "";
      const count = row
        ? row.querySelector(`input[name="item_count"]`).value
        : "";
      const isFree = row
        ? row.querySelector(`input[name="item_free"]`).checked
        : false;

      return {
        id: i.id,
        x: i.x,
        y: i.y,
        w: i.w,
        h: i.h,
        rawW: i.rawW,
        rawH: i.rawH,
        unplaced: Boolean(i.unplaced),
        name: i.name,
        note: note,
        price: price,
        isFree: isFree,
        count: count,
      };
    });
    hiddenInput.value = JSON.stringify(data);
  }

  // --- ロード用 ---
  window.restorePuzzle = function (jsonString) {
    if (!jsonString) return;
    try {
      const savedItems = JSON.parse(jsonString);
      itemListBody.innerHTML = "";
      itemLayer.innerHTML = "";
      pendingLayer.innerHTML = "";
      items = [];

      const arranged = ShinjukuBagLayout.arrange(savedItems);
      arranged.forEach((item) => {
        const tr = createItemRow(0, {
          rowId: item.id,
          name: item.name,
          w: item.rawW,
          h: item.rawH,
          note: item.note,
          price: item.price,
          isFree: item.isFree,
          count: item.count,
        });
        itemListBody.appendChild(tr);

        const itemData = { ...item };
        items.push(itemData);
        createPuzzleElement(itemData);
      });

      updatePenalty();
      savePositionsToHidden();
      placementStatus.textContent = items.some(i => i.unplaced) ? "入りきらないアイテムは未配置欄にあります。" : "";

      if (window.queueTextareaAutoResize) {
        window.queueTextareaAutoResize(document);
      } else {
        setTimeout(() => {
          document
            .querySelectorAll("textarea")
            .forEach((ta) => autoResizeTextarea(ta));
        }, 10);
      }
    } catch (e) {
      console.error("Restore Error", e);
    }
  };
});

document.addEventListener("DOMContentLoaded", () => {
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

  let items = []; // {id, x, y, w, h, name, rawW, rawH}

  // --- テキストエリア自動高さ調整 (★追加) ---
  function autoResizeTextarea(el) {
    if (!el) return;
    el.style.height = "auto"; // 一旦リセット
    el.style.height = el.scrollHeight + "px"; // 内容に合わせて設定
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
      // 古いデータ互換
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
            <td><input type="text" name="item_name" value="${
              data.name || ""
            }" class="sync-trigger"></td>
            <td><input type="number" name="item_price" value="${
              data.price || ""
            }" placeholder="0"></td>
            <td>
                <div class="size-input-group">
                    <input type="number" name="item_w" value="${w}" min="1">
                    <span>×</span>
                    <input type="number" name="item_h" value="${h}" min="1">
                </div>
            </td>
            <td><input type="number" name="item_count" value="${
              data.count || ""
            }" placeholder="-"></td>
            <td><textarea name="item_note" rows="1">${
              data.note || ""
            }</textarea></td>
            <td class="delete-cell"></td>
        `;

    // ★追加: テキストエリアの自動調整設定
    const ta = tr.querySelector('textarea[name="item_note"]');
    if (ta) {
      ta.addEventListener("input", () => autoResizeTextarea(ta));
      // 初期表示時にもリサイズ
      setTimeout(() => autoResizeTextarea(ta), 0);
    }

    // 削除ボタン生成
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "delete-row-btn";
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.title = "削除";

    // 削除イベント
    delBtn.addEventListener("click", () => {
      // 1. パズル上のアイテムを削除
      const puzzleEl = document.getElementById(rowId + "-puzzle");
      if (puzzleEl) {
        puzzleEl.remove();
      }

      // 2. データ配列から削除
      items = items.filter((i) => i.id !== rowId);

      // 3. 行を削除
      tr.remove();

      // 4. ペナルティ再計算・保存
      updatePenalty();
      savePositionsToHidden();
    });

    tr.querySelector(".delete-cell").appendChild(delBtn);

    return tr;
  }

  // 初回10行生成 (初期ロード時)
  for (let i = 0; i < 10; i++) {
    itemListBody.appendChild(createItemRow(i));
  }

  // 行追加ボタン
  addRowBtn.addEventListener("click", () => {
    // インデックスはダミー、IDは createItemRow 内で生成
    itemListBody.appendChild(createItemRow(0));
  });

  // --- パズル同期 (リスト -> パズル) ---
  syncBtn.addEventListener("click", syncPuzzleFromList);

  function syncPuzzleFromList() {
    const rows = itemListBody.querySelectorAll("tr");
    const existingItems = new Map(items.map((i) => [i.id, i]));

    // ※ここでは全クリアせず、リストにあるものを「正」として更新・追加する
    // リストから消えたID（名前が空になった等）のクリーニングも行う

    const activeIds = new Set();

    rows.forEach((row) => {
      const id = row.dataset.id;
      const nameInput = row.querySelector(`input[name="item_name"]`);
      const wInput = row.querySelector(`input[name="item_w"]`);
      const hInput = row.querySelector(`input[name="item_h"]`);

      const name = nameInput.value;
      if (!name) return; // 名前がない行は無視（パズルには出さない）

      activeIds.add(id);

      let w = parseInt(wInput.value) || 1;
      let h = parseInt(hInput.value) || 1;
      if (w < 1) w = 1;
      if (h < 1) h = 1;

      let itemData = existingItems.get(id);

      if (itemData) {
        // 既存アイテム: サイズ変更があれば反映
        // 回転状態を維持するかリセットするかは仕様次第だが、ここでは「入力値」を優先してリセットする
        if (itemData.rawW !== w || itemData.rawH !== h) {
          itemData.w = w;
          itemData.h = h;
          itemData.rawW = w;
          itemData.rawH = h;

          // DOMサイズ更新
          const el = document.getElementById(id + "-puzzle");
          if (el) {
            el.style.width = w * CELL_SIZE + "px";
            el.style.height = h * CELL_SIZE + "px";
          }
        }
        itemData.name = name;

        // DOM名前更新
        const el = document.getElementById(id + "-puzzle");
        if (el) el.querySelector("span").textContent = name;
      } else {
        // 新規アイテム: 空き場所を探して配置
        // 既存アイテムリスト(items)全体を見て空きを探す
        const pos = findEmptyPosition(w, h, items);
        itemData = {
          id: id,
          name: name,
          x: pos.x,
          y: pos.y,
          w: w,
          h: h,
          rawW: w,
          rawH: h,
        };
        items.push(itemData);
        createPuzzleElement(itemData);
      }
    });

    // リストに名前がなくなった、または削除されたアイテムをパズルから消す
    items = items.filter((i) => {
      if (!activeIds.has(i.id)) {
        const el = document.getElementById(i.id + "-puzzle");
        if (el) el.remove();
        return false;
      }
      return true;
    });

    updatePenalty();
    savePositionsToHidden();
  }

  // 空きスペース探索 (左上優先)
  function findEmptyPosition(w, h, currentItems) {
    // y=0～5, x=0～5 の範囲で探す (セーフゾーン内)
    for (let y = 0; y < SAFE_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        // はみ出しチェック
        if (x + w > GRID_COLS || y + h > SAFE_ROWS) continue;

        // 衝突チェック
        let collision = false;
        for (const other of currentItems) {
          if (isOverlap(x, y, w, h, other.x, other.y, other.w, other.h)) {
            collision = true;
            break;
          }
        }

        if (!collision) {
          return { x, y };
        }
      }
    }
    // 空きがない場合は (0,0) に重ねる
    return { x: 0, y: 0 };
  }

  function isOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
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

    // ダブルクリックで回転
    el.addEventListener("dblclick", (e) => {
      e.preventDefault();
      const temp = itemData.w;
      itemData.w = itemData.h;
      itemData.h = temp;
      el.style.width = itemData.w * CELL_SIZE + "px";
      el.style.height = itemData.h * CELL_SIZE + "px";
      updatePenalty();
      savePositionsToHidden();
    });

    itemLayer.appendChild(el);
  }

  function updateElementPosition(el, gridX, gridY) {
    el.style.left = gridX * CELL_SIZE + "px";
    el.style.top = gridY * CELL_SIZE + "px";
  }

  function setupDrag(el, itemData) {
    let isDragging = false;
    let startX, startY;
    let initialLeft, initialTop;

    el.addEventListener("mousedown", dragStart);
    el.addEventListener("touchstart", dragStart, { passive: false });

    function dragStart(e) {
      isDragging = true;
      const clientX =
        e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
      const clientY =
        e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
      startX = clientX;
      startY = clientY;
      initialLeft = parseInt(el.style.left || 0);
      initialTop = parseInt(el.style.top || 0);
      el.style.zIndex = 1000;
      document.addEventListener("mousemove", dragMove);
      document.addEventListener("touchmove", dragMove, { passive: false });
      document.addEventListener("mouseup", dragEnd);
      document.addEventListener("touchend", dragEnd);
    }

    function dragMove(e) {
      if (!isDragging) return;
      e.preventDefault();
      const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
      el.style.left = initialLeft + (clientX - startX) + "px";
      el.style.top = initialTop + (clientY - startY) + "px";
    }

    function dragEnd(e) {
      if (!isDragging) return;
      isDragging = false;
      el.style.zIndex = "";
      document.removeEventListener("mousemove", dragMove);
      document.removeEventListener("touchmove", dragMove);
      document.removeEventListener("mouseup", dragEnd);
      document.removeEventListener("touchend", dragEnd);

      const currentLeft = parseInt(el.style.left || 0);
      const currentTop = parseInt(el.style.top || 0);
      let gridX = Math.round(currentLeft / CELL_SIZE);
      let gridY = Math.round(currentTop / CELL_SIZE);

      // 境界線チェック
      // 横: 0 ~ 5
      if (gridX < 0) gridX = 0;
      if (gridX + itemData.w > GRID_COLS) gridX = GRID_COLS - itemData.w;

      // 縦: 上は制限なし(ペナルティ)、下は SAFE_ROWS まで
      if (gridY + itemData.h > SAFE_ROWS) {
        gridY = SAFE_ROWS - itemData.h;
      }

      itemData.x = gridX;
      itemData.y = gridY;

      updateElementPosition(el, gridX, gridY);
      updatePenalty();
      savePositionsToHidden();
    }
  }

  // --- ペナルティ表示更新 ---
  function updatePenalty() {
    let penaltyCount = 0;
    let minGridY = 0; // 最も上にあるアイテムのY座標（表示調整用）

    items.forEach((item) => {
      if (item.y < minGridY) minGridY = item.y;

      // アイテムが占める全マスをチェック
      for (let py = 0; py < item.h; py++) {
        const currentY = item.y + py;
        // y < 0 (セーフゾーンより上) にある行のマス数をカウント
        if (currentY < 0) {
          // 横幅ぶんペナルティを加算
          penaltyCount += item.w;
        }
      }
    });

    if (penaltyCount > 0) {
      penaltyDisplay.textContent = `ペナルティ: -${penaltyCount}`;
      penaltyDisplay.style.color = "#ff5555";

      puzzleArea.classList.add("show-penalty");

      // ペナルティエリアの高さを計算
      const overflowHeight = Math.abs(minGridY) * CELL_SIZE;

      // 背景位置とサイズ
      penaltyBg.style.top = minGridY * CELL_SIZE + "px";
      penaltyBg.style.height = overflowHeight + "px";

      // 全体を下にずらす
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

  // --- 保存用: アイテム情報 + 備考(Note) をJSON化 ---
  function savePositionsToHidden() {
    const data = items.map((i) => {
      const row = itemListBody.querySelector(`tr[data-id="${i.id}"]`);

      // リストから最新の値を取得
      const note = row
        ? row.querySelector(`textarea[name="item_note"]`).value
        : "";
      const price = row
        ? row.querySelector(`input[name="item_price"]`).value
        : "";
      const count = row
        ? row.querySelector(`input[name="item_count"]`).value
        : "";

      return {
        id: i.id,
        x: i.x,
        y: i.y,
        w: i.w,
        h: i.h,
        rawW: i.rawW,
        rawH: i.rawH,
        name: i.name,
        note: note,
        price: price, // 追加
        count: count, // 追加
      };
    });
    hiddenInput.value = JSON.stringify(data);
  }

  // --- ロード用: JSONから完全復元 ---
  window.restorePuzzle = function (jsonString) {
    if (!jsonString) return;
    try {
      const savedItems = JSON.parse(jsonString);

      // リストとパズルをリセット
      itemListBody.innerHTML = "";
      itemLayer.innerHTML = "";
      items = [];

      savedItems.forEach((item) => {
        // リスト行を生成
        const tr = createItemRow(0, {
          // indexはダミー
          rowId: item.id,
          name: item.name,
          w: item.rawW, // 回転前サイズ
          h: item.rawH,
          note: item.note,
        });
        itemListBody.appendChild(tr);

        // パズル要素を生成
        const itemData = { ...item }; // コピー
        items.push(itemData);
        createPuzzleElement(itemData);
      });

      updatePenalty();
      // restore時はHTML側が既にvalueセットされている場合があるが、
      // ここでDOM再構築しているので hiddenInput も更新しておく
      hiddenInput.value = jsonString;

      // ★追加: 復元後にテキストエリアの高さを調整
      setTimeout(() => {
        document
          .querySelectorAll("textarea")
          .forEach((ta) => autoResizeTextarea(ta));
      }, 10);
    } catch (e) {
      console.error("Restore Error", e);
    }
  };
});

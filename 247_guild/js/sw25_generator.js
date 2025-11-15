// sw25_generator.js の内容をすべてこれで置き換え

document.addEventListener("DOMContentLoaded", () => {
  const {
    Races,
    Regulations,
    WeaponClasses,
    ArmourClasses,
    Weapons,
    Armours,
    Items,
    GeneralSkills,
    SkillLevelGuides,
    ItemSets,
    RecommendedItems,
  } = window.sw25_data;

  const enhancementData = {
    weapon: [
      {
        name: "オーダーメイド",
        prices: { B: 300, A: 1000, S: 3000, SS: 6000 },
      },
      { name: "銀製武器", prices: { B: 1000, A: 2000, S: 4000, SS: 6000 } },
      {
        name: "魔法の武器+1",
        prices: { B: 5000, A: 10000, S: 20000, SS: null },
      },
      { name: "妖精の武器", prices: { B: 1500, A: 3000, S: 6000, SS: 9000 } },
      {
        name: "イグニダイト加工",
        prices: { B: 5000, A: 10000, S: 20000, SS: 40000 },
      },
      { name: "アビス強化", prices: { B: 2000, A: 4000, S: 8000, SS: 12000 } },
    ],
    armour: [
      { name: "魔法の鎧+1", prices: { B: 5000, A: 10000, S: 20000, SS: null } },
      { name: "防弾加工の鎧", prices: { B: 1500, A: 3000, S: 6000, SS: 9000 } },
      {
        name: "マナタイトの追加装甲",
        prices: { B: 5000, A: 10000, S: 20000, SS: 30000 },
      },
    ],
  };

  // DOM要素キャッシュ
  const sidebarLinks = document.querySelectorAll("#form-sidebar .sidebar-link");
  const formPanels = document.querySelectorAll(".form-panel");
  const regulationSelect = document.getElementById("regulation-select");
  const expTotalInput = document.getElementById("expTotal");
  const moneyTotalInput = document.getElementById("moneyTotal");
  const honorInput = document.getElementById("honor");
  const abyssShardInput = document.getElementById("abyssShard");
  const growthCountInput = document.getElementById("growthCount");
  const rollGrowthBtn = document.getElementById("roll-growth-btn");
  const growthResultsContainer = document.getElementById(
    "growth-results-container"
  );
  const statsGridContainer = document.getElementById("stats-grid-container");
  const usePriorityCheck = document.getElementById("use-priority-check");
  const resetPriorityBtn = document.getElementById("reset-priority-btn");
  const addGeneralSkillBtn = document.getElementById("add-general-skill-btn");
  const generalSkillsContainer = document.getElementById(
    "general-skills-container"
  );
  const skillProgressBar = document.getElementById("general-skill-progress");
  const totalLevelSpan = document.getElementById("general-skill-total-level");
  const enemyJsonInput = document.getElementById("enemy-json-input");
  const swordShardsCount = document.getElementById("sword-shards-count");
  const applyEnemyEnhancementBtn = document.getElementById(
    "apply-enemy-enhancement-btn"
  );
  const enemyJsonOutput = document.getElementById("enemy-json-output");
  const copyEnemyJsonBtn = document.getElementById("copy-enemy-json-btn");
  // トレジャーポイント関連
  const addTpAbilityBtn = document.getElementById("add-tp-ability-btn");
  const tpSelectionContainer = document.getElementById(
    "tp-selection-container"
  );
  const treasurePointsTotalInput = document.getElementById(
    "treasure-points-total"
  );

  const tpAbilityDescriptions = {
    weakness:
      "割り振ったポイントに対応した値だけ、その魔物の弱点値が上昇します。知名度は変わりません。",
    initiative:
      "割り振ったポイントに対応した値だけ、その魔物の先制値が上昇します。",
    damage:
      "打撃点決定の2dを振り、出目を確認した後、割り振ったポイントに対応した値だけ、打撃点を上昇させます。この強化は1体の魔物(部位)に複数を待たせることができ、割り振った回数だけ、1日の間に打撃点上昇の機会を得られます。ただし、10秒(1ラウンド)の間に打撃点を上昇させることができるのは、対象1体ごと1回までです。また、打撃点の上昇分はすべて同じに揃えなければなりません。",
    defense:
      "1日に1回だけ、物理ダメージを受けて防護点を適用するとき、割り振ったポイントに対応した値だけ、防護点を上昇させます。合算ダメージが確定した後に、この効果を使うかどうかを選択します。",
    success:
      "1日に1回だけ、行為判定の達成値を求めてから、その達成値を割り振ったポイントに対応した値だけ上昇させます。対抗判定などの場合、その結果を覆す目的で使用できます。",
    attack:
      "手番終了時に1dを振り、「/」の前にある出目を得ると、近接攻撃を追加で1回行います。この追加は、魔物が「○2回攻撃」や「○連続攻撃」などの攻撃回数や機会を増やす能力を持っていても考慮されず、近接攻撃1回のみです。この効果は手番ごとに1回のみチェックされます。また、「/」の後が追加で攻撃が行われる上限回数を表します。その回数だけ追加の攻撃が発生したら、翌日までこの効果はいっさい現れなくなります。",
    curse:
      "この効果は1日に1回だけ使用可能で、使用の宣言後、連続した1分(6ラウンド)の間だけ効果が発生します。効果が発生中は、自身の手番終了時に自動的に1回、「射程:接触」「対象:1体」に「抵抗:必中」で、割り振ったポイントに対応した点数の、呪い属性の確定ダメージを与えます。",
    contamination:
      "1日に1回だけ、戦闘行為によって初めて自身のHPにダメージを受けたとき、自動的に「射程:自身」で「対象:全エリア(半径20m)/すべて」に、「抵抗:必中」で、「指定された威力/C値10」(のみ)の、毒属性の魔法ダメージを与えます。このとき、任意のキャラクターを効果から除外することができます。",
  };

  const statNames = ["器用", "敏捷", "筋力", "生命", "知力", "精神"];
  const statClassMap = {
    器用: "stat-器用",
    敏捷: "stat-敏捷",
    筋力: "stat-筋力",
    生命: "stat-生命",
    知力: "stat-知力",
    精神: "stat-精神",
  };
  const growthMap = {
    1: "器用",
    2: "敏捷",
    3: "筋力",
    4: "生命",
    5: "知力",
    6: "精神",
  };
  let growthRowCounter = 0;
  let userCashbookContent = "";
  let openDropdownElement = null; // 現在開いているプルダウンメニューを追跡

  function setupEnhancementPanel() {
    const panel = document.getElementById("enhancement-panel");
    if (!panel) return;
    panel.innerHTML = "";

    const createSection = (title, items) => {
      const sectionDiv = document.createElement("div");
      sectionDiv.className = "enhancement-section";

      const titleEl = document.createElement("h4");
      titleEl.className = "enhancement-section-title";
      titleEl.textContent = title;
      sectionDiv.appendChild(titleEl);

      items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "enhancement-row";
        const nameSpan = document.createElement("span");
        nameSpan.className = "enhancement-name";
        nameSpan.textContent = item.name;
        row.appendChild(nameSpan);

        const buttonsDiv = document.createElement("div");
        buttonsDiv.className = "enhancement-buttons";
        Object.keys(item.prices).forEach((rank) => {
          const price = item.prices[rank];
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "enhancement-btn";
          btn.textContent = rank;
          btn.dataset.name = item.name;
          btn.dataset.rank = rank;
          btn.disabled = price === null;
          if (price !== null) btn.dataset.price = price;
          buttonsDiv.appendChild(btn);
        });
        row.appendChild(buttonsDiv);
        sectionDiv.appendChild(row);
      });
      return sectionDiv;
    };

    panel.appendChild(createSection("武器強化一覧", enhancementData.weapon));
    panel.appendChild(createSection("防具強化一覧", enhancementData.armour));
  }

  function handleEnhancementButtonClick(button) {
    const name = button.dataset.name;
    const rank = button.dataset.rank;
    const price = parseInt(button.dataset.price, 10);
    const newEntry = `: ${name}（${rank}）|::-${price}`;

    userCashbookContent = userCashbookContent
      ? `${userCashbookContent}\n${newEntry}`
      : newEntry;

    updateAllItems();
  }

  function setupItemPanel() {
    const container = document.getElementById("items-container");
    container.innerHTML = "";
    const adventureSetData = Items["一般装備品・消耗品など"]["冒険者セット"][0];
    if (adventureSetData) {
      addItemRow({
        name: adventureSetData.name,
        freeName: adventureSetData.name,
        unitPrice: adventureSetData.price,
        effect: adventureSetData.note,
      });
    }
    addItemRow();
    addItemRow();
  }

  // プルダウンメニューの開閉とフィルタリングのヘルパー関数
  function openDropdown(dropdownMenu) {
    closeAllDropdowns(); // 他の開いているプルダウンを閉じる

    const inputElement = dropdownMenu
      .closest(".input-with-dropdown")
      .querySelector("input[type='text']");
    const rect = inputElement.getBoundingClientRect();

    dropdownMenu.style.position = "fixed"; // position を fixed に変更
    dropdownMenu.style.left = `${rect.left}px`;
    dropdownMenu.style.top = `${rect.bottom + window.scrollY}px`; // 入力フィールドの下に配置
    dropdownMenu.style.width = `${inputElement.offsetWidth}px`; // 入力フィールドの幅に合わせる

    // 画面の下端からはみ出す場合（上方向に開く）
    if (
      rect.bottom + dropdownMenu.offsetHeight > window.innerHeight &&
      rect.top - dropdownMenu.offsetHeight > 0
    ) {
      dropdownMenu.style.top = `${rect.top - dropdownMenu.offsetHeight - 5}px`; // 入力フィールドの上に配置
    }

    dropdownMenu.style.display = "block";
    openDropdownElement = dropdownMenu;
  }

  function closeDropdown(dropdownMenu) {
    dropdownMenu.style.display = "none";
    if (openDropdownElement === dropdownMenu) {
      openDropdownElement = null;
    }
  }

  function toggleDropdown(dropdownMenu) {
    if (dropdownMenu.style.display === "block") {
      closeDropdown(dropdownMenu);
    } else {
      openDropdown(dropdownMenu);
    }
  }

  function filterDropdownOptions(inputElement, dropdownMenu) {
    const filterText = inputElement.value.toLowerCase();
    const options = dropdownMenu.querySelectorAll("li");
    let hasVisibleOptions = false;
    options.forEach((li) => {
      // フィルタリングロジックを削除し、常に表示
      li.style.display = "block";
      hasVisibleOptions = true;
    });
    if (hasVisibleOptions) {
      openDropdown(dropdownMenu);
    } else {
      closeDropdown(dropdownMenu);
    }
  }

  function closeAllDropdowns() {
    if (openDropdownElement) {
      openDropdownElement.style.display = "none";
      openDropdownElement = null;
    }
  }

  function handleItemNameChange({ target: nameInputElement }) {
    const row = nameInputElement.closest(".item-row");
    const selectedValue = nameInputElement.value; // input要素の値を取得
    const allItems = Object.values(Items)
      .flatMap((category) => Object.values(category))
      .flat();
    const selectedItem = allItems.find((item) => item.name === selectedValue);

    const magicCheck = row.querySelector(".item-magic-check");
    if (magicCheck)
      magicCheck.checked = !!(selectedItem && selectedItem.isMagic);

    if (selectedItem) {
      row.querySelector(".item-unit-price").value = selectedItem.price || 0;
      row.querySelector(".item-effect").value = selectedItem.note || "";
    }
    // else { // データが見つからない場合に空欄にするロジックを削除
    //   row.querySelector(".item-unit-price").value = "";
    //   row.querySelector(".item-effect").value = "";
    // }
    updateAllItems();
  }

  function updateCashbookAndMoney() {
    const cashbookTextarea = document.getElementById("cashbook");
    const folderToggle = document.getElementById("item-folder-toggle").checked;
    const folderTitle =
      document.getElementById("item-folder-title").value.trim() || "初期投資";
    let autoEntries = [];
    let autoTotalCost = 0;

    document
      .querySelectorAll(".weapon-row, .armour-row, .item-row")
      .forEach((row) => {
        const priceInput = row.querySelector(
          ".weapon-price, .armour-price, .item-total-price"
        );
        const nameSelect = row.querySelector(
          ".weapon-name-select, .armour-name-select, .item-name-select"
        );
        const nameFree = row.querySelector(
          ".weapon-name-free, .armour-name-free, .item-name-free"
        );

        let name = nameFree ? nameFree.value.trim() : "";

        if (name === "free" || !name) return;

        if (priceInput) {
          const price = parseFloat(priceInput.value) || 0;
          if (price > 0) {
            autoTotalCost += price;
            const isMagic =
              row.querySelector(".item-magic-check")?.checked || false;
            const prefix = isMagic ? "[魔]" : "";
            const nameText =
              name.startsWith("〈") && name.endsWith("〉")
                ? name
                : `〈${name}〉`;
            const unitPrice =
              parseFloat(
                row.querySelector(
                  ".item-unit-price, .weapon-price, .armour-price"
                )?.value
              ) || price;
            const quantity =
              parseInt(row.querySelector(".item-quantity")?.value, 10) || 1;

            if (quantity > 1 && row.classList.contains("item-row")) {
              autoEntries.push(
                `: ${prefix}${nameText}|::-` + unitPrice + "*" + quantity
              );
            } else {
              autoEntries.push(`: ${prefix}${nameText}|::-` + price);
            }
          }
        }
      });

    let autoBlock = "";
    if (autoEntries.length > 0) {
      autoBlock = folderToggle
        ? `[>]**${folderTitle}\n` + autoEntries.join("\n") + `\n[---]`
        : autoEntries.join("\n");
    }

    cashbookTextarea.value =
      autoBlock +
      (userCashbookContent
        ? (autoBlock ? "\n" : "") + userCashbookContent
        : "");

    let userTotalCost = 0;
    if (userCashbookContent) {
      const userEntries = userCashbookContent.split("\n");
      userEntries.forEach((line) => {
        const match = line.match(/::(-?\d+)/);
        if (match) userTotalCost -= parseInt(match[1], 10);
      });
    }

    const finalTotalCost = autoTotalCost + userTotalCost;
    document.getElementById(
      "money-sidebar-items-total"
    ).textContent = `-${finalTotalCost}`;
    updateRemainingMoney();
  }

  // ★★★ ツールチップ制御用の変数を追加 ★★★
  let tooltipElement = null;

  // ★★★ setupItemSetsPanel 関数を修正 ★★★
  function setupItemSetsPanel() {
    const panel = document.getElementById("item-sets-panel");
    if (!panel || !ItemSets) return;
    panel.innerHTML = "";

    // ★ ツールチップ用のdiv要素がなければ作成
    if (!tooltipElement) {
      tooltipElement = document.createElement("div");
      tooltipElement.className = "dynamic-tooltip";
      document.body.appendChild(tooltipElement);
    }

    Object.entries(ItemSets).forEach(([categoryName, sets]) => {
      const sectionDiv = document.createElement("div");
      sectionDiv.className = "enhancement-section";

      const titleEl = document.createElement("h4");
      titleEl.className = "enhancement-section-title";
      titleEl.textContent = categoryName;
      sectionDiv.appendChild(titleEl);

      sets.forEach((set) => {
        const row = document.createElement("div");
        row.className = "item-set-row";

        const nameSpan = document.createElement("span");
        nameSpan.className = "item-set-name";
        nameSpan.textContent = set.name;
        row.appendChild(nameSpan);

        const priceSpan = document.createElement("span");
        priceSpan.textContent = `(${set.price.toLocaleString()}G)`;
        priceSpan.style.color = "#ccc";
        priceSpan.style.fontSize = "0.9em";
        row.appendChild(priceSpan);

        const tooltipTrigger = document.createElement("i");
        tooltipTrigger.className =
          "fas fa-question-circle item-set-tooltip-trigger";

        const tooltipContent = set.items
          .map((item) => {
            const name = item.freeName || item.name;
            const points = item.points ? `(${item.points}点)` : "";
            return `・${name}${points} x ${item.quantity}`;
          })
          .join("\n");

        // ★★★ JSによるツールチップ制御ロジック（タイマーなし） ★★★
        tooltipTrigger.addEventListener("mouseenter", (e) => {
          tooltipElement.innerHTML = tooltipContent;
          tooltipElement.classList.add("visible");

          let x = e.clientX + 15;
          let y = e.clientY + 15;

          const tooltipRect = tooltipElement.getBoundingClientRect();
          if (x + tooltipRect.width > window.innerWidth) {
            x = e.clientX - tooltipRect.width - 15;
          }
          if (y + tooltipRect.height > window.innerHeight) {
            y = e.clientY - tooltipRect.height - 15;
          }

          tooltipElement.style.left = `${x}px`;
          tooltipElement.style.top = `${y}px`;
        });

        tooltipTrigger.addEventListener("mousemove", (e) => {
          let x = e.clientX + 15;
          let y = e.clientY + 15;

          const tooltipRect = tooltipElement.getBoundingClientRect();
          if (x + tooltipRect.width > window.innerWidth) {
            x = e.clientX - tooltipRect.width - 15;
          }
          if (y + tooltipRect.height > window.innerHeight) {
            y = e.clientY - tooltipRect.height - 15;
          }

          tooltipElement.style.left = `${x}px`;
          tooltipElement.style.top = `${y}px`;
        });

        tooltipTrigger.addEventListener("mouseleave", () => {
          tooltipElement.classList.remove("visible");
        });

        row.appendChild(tooltipTrigger);

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "item-set-btn";
        btn.textContent = "購入";
        btn.onclick = () => handleItemSetPurchase(set.items);
        row.appendChild(btn);

        sectionDiv.appendChild(row);
      });
      panel.appendChild(sectionDiv);
    });
  }

  // ★追加: アイテムセット購入を処理する関数
  function handleItemSetPurchase(items) {
    if (!items || items.length === 0) return;

    const allItemRows = Array.from(
      document.querySelectorAll("#items-container .item-row")
    );
    const emptySlots = allItemRows.filter((row) => {
      const nameSelect = row.querySelector(".item-name-select");
      const nameFree = row.querySelector(".item-name-free");
      return (
        (nameSelect.style.display !== "none" && !nameSelect.value) ||
        (nameFree.style.display !== "none" && !nameFree.value.trim())
      );
    });

    let emptySlotIndex = 0;

    items.forEach((itemData) => {
      const itemMaster = Object.values(Items)
        .flatMap((category) => Object.values(category).flat())
        .find((i) => i.name === itemData.name);

      const newRowData = {
        name: itemMaster ? itemMaster.name : "free",
        freeName: itemData.freeName || itemMaster?.name || itemData.name,
        unitPrice: itemMaster?.price || 0,
        quantity: itemData.quantity || 1,
        effect: itemMaster?.note || "",
        points: itemData.points || "",
      };

      // 空きスロットがあればそこを埋める
      if (emptySlotIndex < emptySlots.length) {
        const targetRow = emptySlots[emptySlotIndex];

        const nameSelect = targetRow.querySelector(".item-name-select");
        const nameFree = targetRow.querySelector(".item-name-free");
        const pointsInput = targetRow.querySelector(".item-points");
        const unitPriceInput = targetRow.querySelector(".item-unit-price");
        const quantityInput = targetRow.querySelector(".item-quantity");
        const effectInput = targetRow.querySelector(".item-effect");
        const magicCheck = targetRow.querySelector(".item-magic-check");

        // 値を設定
        if (newRowData.name === "free") {
          nameSelect.style.display = "none";
          nameFree.style.display = "block";
          nameFree.value = newRowData.freeName;
        } else {
          nameSelect.style.display = "block";
          nameFree.style.display = "none";
          nameSelect.value = newRowData.name;
        }
        pointsInput.value = newRowData.points;
        unitPriceInput.value = newRowData.unitPrice;
        quantityInput.value = newRowData.quantity;
        effectInput.value = newRowData.effect;
        magicCheck.checked = !!itemMaster?.isMagic;

        // イベントを発火させて合計金額などを再計算
        nameSelect.dispatchEvent(new Event("change", { bubbles: true }));

        emptySlotIndex++;
      } else {
        // 空きスロットがなければ末尾に追加
        addItemRow(newRowData);
      }
    });

    // ポップアップを閉じる
    const panel = document.getElementById("item-sets-panel");
    if (panel) panel.classList.remove("visible");
  }

  function setupRecommendedItemsPanel() {
    const panel = document.getElementById("recommended-items-panel");
    if (!panel || !RecommendedItems) return;

    panel.innerHTML = `
      <h3><i class="fas fa-clipboard-list"></i> 技能ごとの必須/推奨アイテムリスト</h3>
      <div id="recommended-items-table-wrapper">
        <table id="recommended-items-table">
          <thead>
            <tr>
              <th>技能</th>
              <th>アイテム</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    `;

    const tableBody = panel.querySelector("tbody");
    const groupedItems = RecommendedItems.reduce((acc, item) => {
      acc[item.skill] = acc[item.skill] || [];
      acc[item.skill].push(item);
      return acc;
    }, {});

    for (const skill in groupedItems) {
      const items = groupedItems[skill];
      const row = document.createElement("tr");

      const skillCell = document.createElement("td");
      skillCell.className = "skill-cell";
      skillCell.textContent = skill;
      if (items.length > 1) {
        skillCell.rowSpan = items.length;
      }
      row.appendChild(skillCell);

      appendItemCell(row, items[0]);
      tableBody.appendChild(row);

      for (let i = 1; i < items.length; i++) {
        const subsequentRow = document.createElement("tr");
        appendItemCell(subsequentRow, items[i]);
        tableBody.appendChild(subsequentRow);
      }
    }
  }

  function appendItemCell(tr, itemData) {
    const itemCell = document.createElement("td");
    itemCell.className = "item-cell";

    const itemNameSpan = document.createElement("span");
    itemNameSpan.className = "item-name";
    itemNameSpan.textContent = itemData.item;

    // CSSで制御するため、クラスを付与
    if (itemData.required) {
      itemNameSpan.classList.add("required");
    }
    itemCell.appendChild(itemNameSpan);

    if (itemData.anchor) {
      const anchorLink = document.createElement("a");
      anchorLink.href = itemData.anchor;
      anchorLink.className = "small-button action-btn";
      anchorLink.textContent = "選択へ";
      anchorLink.addEventListener("click", (e) => {
        e.preventDefault();
        document
          .querySelector(itemData.anchor)
          ?.scrollIntoView({ behavior: "smooth" });
        document
          .getElementById("recommended-items-panel")
          .classList.remove("visible");
      });
      itemCell.appendChild(anchorLink);
    } else if (itemData.name) {
      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "small-button action-btn";
      addButton.textContent = "追加";
      addButton.addEventListener("click", () =>
        handleRecommendedItemAdd(itemData.name)
      );
      itemCell.appendChild(addButton);
    }
    tr.appendChild(itemCell);
  }

  function handleRecommendedItemAdd(itemName) {
    const itemMaster = Object.values(Items)
      .flatMap((category) => Object.values(category).flat())
      .find((i) => i.name === itemName);

    if (!itemMaster) return;

    const newRowData = {
      name: itemName,
      freeName: itemName,
      unitPrice: itemMaster.price || 0,
      quantity: 1,
      effect: itemMaster.note || "",
    };

    const allItemRows = Array.from(
      document.querySelectorAll("#items-container .item-row")
    );
    const emptySlot = allItemRows.find((row) => {
      const nameInput = row.querySelector(".item-name-free");
      return !nameInput.value.trim(); // input の値が空であれば空きスロット
    });

    if (emptySlot) {
      // 空きスロットを埋める
      const nameInput = emptySlot.querySelector(".item-name-free");
      nameInput.value = newRowData.name;
      // input イベントを発火させて、プルダウンのフィルタリングと関連情報の更新をトリガー
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
      nameInput.dispatchEvent(new Event("change", { bubbles: true })); // handleItemNameChange をトリガー
    } else {
      // 末尾に追加
      addItemRow(newRowData);
    }
  }
  // ★★★ここまで追加★★★

  function setupEventListeners() {
    const form = document.getElementById("char-sheet-form");
    const enhancementBtn = document.getElementById("toggle-enhancement-btn");
    const enhancementPanel = document.getElementById("enhancement-panel");
    const itemSetsBtn = document.getElementById("toggle-item-sets-btn");
    const itemSetsPanel = document.getElementById("item-sets-panel");
    const recommendedBtn = document.getElementById(
      "toggle-recommended-items-btn"
    );
    const recommendedPanel = document.getElementById("recommended-items-panel");

    const togglePopup = (button, panel) => {
      if (panel.classList.contains("visible")) {
        panel.classList.remove("visible");
      } else {
        document
          .querySelectorAll(".enhancement-panel-container.visible")
          .forEach((p) => p.classList.remove("visible"));

        const rect = button.getBoundingClientRect();
        const panelWidth = panel.offsetWidth;
        const panelHeight = panel.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const margin = 10;

        let finalLeft = rect.left;
        if (rect.left + panelWidth > windowWidth) {
          finalLeft = windowWidth - panelWidth - margin;
        }

        let finalTop = rect.top;
        if (rect.top + panelHeight > windowHeight) {
          finalTop = windowHeight - panelHeight - margin;
        }
        if (finalTop < 0) {
          finalTop = margin;
        }

        panel.style.left = `${finalLeft}px`;
        panel.style.top = `${finalTop}px`;
        panel.classList.add("visible");
      }
    };

    if (enhancementBtn) {
      enhancementBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePopup(enhancementBtn, enhancementPanel);
      });
    }

    if (itemSetsBtn) {
      itemSetsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePopup(itemSetsBtn, itemSetsPanel);
      });
    }

    if (recommendedBtn) {
      recommendedBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePopup(recommendedBtn, recommendedPanel);
      });
    }

    if (enhancementPanel) {
      enhancementPanel.addEventListener("click", (e) => {
        if (
          e.target.classList.contains("enhancement-btn") &&
          !e.target.disabled
        ) {
          handleEnhancementButtonClick(e.target);
        }
      });
    }

    document.addEventListener("click", (e) => {
      document
        .querySelectorAll(".enhancement-panel-container.visible")
        .forEach((panel) => {
          let associatedButton;
          if (panel.id === "enhancement-panel")
            associatedButton = enhancementBtn;
          else if (panel.id === "item-sets-panel")
            associatedButton = itemSetsBtn;
          else if (panel.id === "recommended-items-panel")
            associatedButton = recommendedBtn;

          if (
            associatedButton &&
            !panel.contains(e.target) &&
            e.target !== associatedButton
          ) {
            panel.classList.remove("visible");
          }
        });
    });

    form.addEventListener("click", (event) => {
      const target = event.target;
      // プルダウンメニューのクリックはここで処理しない
      if (target.closest(".dropdown-menu")) return;

      if (
        target === enhancementBtn ||
        target === itemSetsBtn ||
        target === recommendedBtn
      )
        return;

      const addBtn = target.closest(".add-row-btn");
      const removeBtn = target.closest(".remove-row-btn");
      // selectBtn のロジックは新しいプルダウンで置き換えられるため削除
      const copyBtn = target.closest(".copy-btn");
      const copySkillBtn = target.closest(".copy-skill-name-btn");
      const unitBtn = target.closest(".unit-btn");

      if (target.id === "randomize-skill-names-btn") {
        handleRandomizeSkillNames();
        return;
      }
      if (target.id === "randomize-skill-all-btn") {
        handleRandomizeAll();
        return;
      }

      if (addBtn) {
        const templateId = addBtn.dataset.template;
        if (templateId === "template-weapon") addWeaponRow();
        else if (templateId === "template-armour") addArmourRow();
        else if (templateId === "template-item") addItemRow();
        else if (addBtn.id === "add-general-skill-btn") addGeneralSkillRow();
        else if (templateId === "template-personal-data-row")
          addPersonalDataRow();
        else if (addBtn.id === "add-tp-ability-btn") {
          addTpAbilityRow();
        }
        return;
      }
      if (removeBtn) {
        const row = removeBtn.closest(".dynamic-row");
        if (row) {
          row.remove();
          updateAllItems();
          if (row.classList.contains("general-skill-row"))
            updateGeneralSkillTotal();
          if (row.classList.contains("personal-data-row"))
            updatePersonalDataOutput();
        }
        return;
      }

      if (copyBtn) {
        const id = copyBtn.id;
        if (id === "copy-personal-data-btn")
          navigator.clipboard.writeText(
            document.getElementById("personal-data-output").value
          );
        if (id === "copy-items-list-btn")
          navigator.clipboard.writeText(
            document.getElementById("items-output").value
          );
        if (id === "copy-cashbook-btn")
          navigator.clipboard.writeText(
            document.getElementById("cashbook").value
          );
      }

      if (copySkillBtn) {
        const skillName = copySkillBtn
          .closest(".skill-name-cell")
          .querySelector(".general-skill-select").value;
        if (skillName) navigator.clipboard.writeText(skillName);
      }

      if (unitBtn) {
        const valueInput = unitBtn
          .closest(".personal-data-value-wrapper")
          .querySelector(".personal-data-value");
        valueInput.value += unitBtn.dataset.unit;
        valueInput.dispatchEvent(new Event("input", { bubbles: true }));
        valueInput.focus();
      }
    });

    form.addEventListener("input", (e) => {
      if (
        e.target.matches(
          ".item-magic-check, .item-name-free, .item-unit-price, .item-quantity, .item-effect, .item-points, .weapon-price, .armour-price, .weapon-name-free, .armour-name-free"
        )
      ) {
        updateAllItems();
      }
      if (e.target.matches("#item-folder-toggle, #item-folder-title")) {
        updateAllItems();
      }
      if (e.target.classList.contains("initial-stat-input")) {
        updateAllStatTotals();
      }
      if (e.target.matches(".personal-data-key, .personal-data-value")) {
        updatePersonalDataOutput();
      }
      if (e.target.classList.contains("general-skill-level-slider")) {
        const row = e.target.closest(".general-skill-row");
        const level = e.target.value;
        row.querySelector(
          ".general-skill-level-display"
        ).textContent = `Lv ${level}`;
        row.querySelector(".level-guide-text").textContent =
          SkillLevelGuides[level];
        updateGeneralSkillTotal();
      }
    });

    form.addEventListener("change", (e) => {
      const target = e.target;
      if (target.matches(".weapon-name-free")) handleWeaponNameChange(target);
      if (target.matches(".armour-name-free")) handleArmourNameChange(target);
      if (target.matches(".item-name-free")) handleItemNameChange({ target });
    });

    // ドキュメント全体のクリックでプルダウンを閉じる
    document.addEventListener("click", (e) => {
      if (openDropdownElement && !e.target.closest(".input-with-dropdown")) {
        closeDropdown(openDropdownElement);
      }
    });

    document.getElementById("cashbook").addEventListener("input", (e) => {
      const regex = /(\[>\]\*\*.*?\n[\s\S]*?\[---\]\n*)/;
      const match = e.target.value.match(regex);
      userCashbookContent = e.target.value
        .replace(match ? match[0] : "", "")
        .trim();
      updateAllItems();
    });

    document
      .getElementById("money-sidebar-other")
      .addEventListener("input", updateRemainingMoney);
    sidebarLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.dataset.target;
        sidebarLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        formPanels.forEach((panel) =>
          panel.classList.toggle("active", panel.id === targetId)
        );
      });
    });

    regulationSelect.addEventListener("change", updateRegulationValues);
    rollGrowthBtn.addEventListener("click", handleRollGrowth);
    growthResultsContainer.addEventListener("click", (event) => {
      if (event.target.classList.contains("stat-candidate"))
        handleCandidateClick(event.target);
    });
    usePriorityCheck.addEventListener("change", applyPriorityToAllRows);
    statsGridContainer.addEventListener("change", (e) => {
      if (e.target.classList.contains("priority-select")) {
        handlePriorityChange(e.target);
        applyPriorityToAllRows();
      }
    });
    statsGridContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("bracelet-btn")) {
        const currentValue = parseInt(e.target.dataset.value, 10);
        let nextValue = currentValue === 0 ? 2 : currentValue === 2 ? 1 : 0;
        e.target.dataset.value = nextValue;
        e.target.textContent = nextValue === 0 ? "0" : `+${nextValue}`;
        updateAllStatTotals();
      }
    });
    resetPriorityBtn.addEventListener("click", () => {
      statsGridContainer
        .querySelectorAll(".priority-select")
        .forEach((select) => {
          select.value = "99";
        });
      applyPriorityToAllRows();
    });

    // 敵強化機能のイベントリスナー
    if (applyEnemyEnhancementBtn) {
      applyEnemyEnhancementBtn.addEventListener("click", applyEnemyEnhancement);
    }
    if (copyEnemyJsonBtn) {
      copyEnemyJsonBtn.addEventListener("click", () => {
        if (enemyJsonOutput.value) {
          navigator.clipboard
            .writeText(enemyJsonOutput.value)
            .then(() => {
              showToast("コピーしました！");
            })
            .catch((err) => {
              console.error("コピーに失敗しました: ", err);
              showToast("コピーに失敗しました。");
            });
        }
      });
    }
    if (tpSelectionContainer) {
      tpSelectionContainer.addEventListener(
        "change",
        updateTotalTreasurePoints
      );
      tpSelectionContainer.addEventListener("input", updateTotalTreasurePoints);
      tpSelectionContainer.addEventListener("click", (e) => {
        if (e.target.closest(".remove-row-btn")) {
          e.target.closest(".dynamic-row").remove();
          updateTotalTreasurePoints();
        }
      });

      // ツールチップイベント
      tpSelectionContainer.addEventListener("mouseover", (e) => {
        if (e.target.classList.contains("tp-ability-select")) {
          const selectedValue = e.target.value;
          if (tpAbilityDescriptions[selectedValue]) {
            showDynamicTooltip(e.target, tpAbilityDescriptions[selectedValue]);
          }
        }
      });

      tpSelectionContainer.addEventListener("mouseout", (e) => {
        if (e.target.classList.contains("tp-ability-select")) {
          hideDynamicTooltip();
        }
      });
    }
  }

  function initialize() {
    populateRegulations();
    setupStatsGrid();
    setupBasicInfoPanel();
    addWeaponRow();
    addArmourRow();
    setupItemPanel();
    addGeneralSkillRow();
    setupEnhancementPanel();
    setupItemSetsPanel();
    setupRecommendedItemsPanel(); // ★追加
    setupEventListeners();
    regulationSelect.dispatchEvent(new Event("change"));
    updateAllStatTotals();
  }

  function populateRegulations() {
    if (!regulationSelect) return;
    Regulations.forEach((reg, index) => {
      regulationSelect.add(new Option(reg.label, index));
    });
  }

  function setupStatsGrid() {
    statsGridContainer.innerHTML = "";
    statsGridContainer.appendChild(document.createElement("div"));
    statNames.forEach((name) => {
      const header = document.createElement("div");
      const statNameWithDo = name.endsWith("度") ? name : name + "度";
      header.className = `grid-header ${statClassMap[name]}`;
      header.textContent = name;
      statsGridContainer.appendChild(header);
    });
    const rows = [
      { label: "優先度", type: "priority" },
      { label: "初期ステータス", type: "initial" },
      { label: "腕輪", type: "bracelet" },
      { label: "成長", type: "growth" },
      { label: "合計", type: "total" },
      { label: "合計B", type: "bonus" },
    ];
    rows.forEach((rowData) => {
      const label = document.createElement("div");
      label.className = "grid-label";
      if (rowData.type === "initial")
        label.classList.add("initial-status-label");
      label.textContent = rowData.label;
      statsGridContainer.appendChild(label);
      statNames.forEach((name, index) => {
        let cell;
        switch (rowData.type) {
          case "priority":
            cell = document.createElement("select");
            cell.className = "priority-select";
            cell.dataset.stat = name;
            cell.innerHTML = '<option value="99">-</option>';
            for (let i = 1; i <= 6; i++) cell.add(new Option(i, i));
            cell.value = index + 1;
            break;
          case "initial":
            cell = document.createElement("input");
            cell.type = "number";
            cell.className = "initial-stat-input";
            cell.dataset.stat = name;
            cell.value = 0;
            break;
          case "bracelet":
            cell = document.createElement("button");
            cell.type = "button";
            cell.className = "bracelet-btn";
            cell.dataset.stat = name;
            cell.dataset.value = "0";
            cell.textContent = "0";
            break;
          case "growth":
            cell = document.createElement("div");
            cell.id = `summary-count-${name}`;
            cell.textContent = "0";
            break;
          case "total":
            cell = document.createElement("div");
            cell.className = `stat-total ${statClassMap[name]}`;
            cell.dataset.stat = name;
            cell.textContent = "0";
            break;
          case "bonus":
            cell = document.createElement("div");
            cell.className = `stat-bonus ${statClassMap[name]}`;
            cell.dataset.stat = name;
            cell.textContent = "0";
            break;
        }
        statsGridContainer.appendChild(cell);
      });
    });
  }

  function setupBasicInfoPanel() {
    const container = document.getElementById("personal-data-fields-container");
    container.innerHTML = "";
    const standardItems = {
      身長: "",
      体重: "",
      髪: "",
      瞳: "",
      肌: "",
    };
    for (const key in standardItems) {
      const newRow = addPersonalDataRow(key, standardItems[key]);
      if (key === "身長" || key === "体重") {
        const unit = key === "身長" ? "cm" : "kg";
        const unitBtn = document.createElement("button");
        unitBtn.type = "button";
        unitBtn.className = "unit-btn";
        unitBtn.textContent = unit;
        unitBtn.dataset.unit = unit;
        newRow
          .querySelector(".personal-data-value-wrapper")
          .appendChild(unitBtn);
      }
    }
  }

  function addPersonalDataRow(key = "", value = "") {
    const container = document.getElementById("personal-data-fields-container");
    const template = document.getElementById("template-personal-data-row");
    if (!template) return;
    const clone = template.content.cloneNode(true);
    const newRow = clone.querySelector(".dynamic-row");
    newRow.querySelector(".personal-data-key").value = key;
    newRow.querySelector(".personal-data-value").value = value;
    container.appendChild(clone);
    return newRow;
  }

  function updatePersonalDataOutput() {
    const outputTextarea = document.getElementById("personal-data-output");
    if (!outputTextarea) return;
    let output = "[>]**パーソナルデータ\n";
    document
      .querySelectorAll("#personal-data-fields-container .personal-data-row")
      .forEach((row) => {
        const key = row.querySelector(".personal-data-key").value.trim();
        const value = row.querySelector(".personal-data-value").value.trim();
        if (key) output += `:${key}|${value}\n`;
      });
    outputTextarea.value = output + "[---]";
  }

  function populateEquipmentCategories(row) {
    // weaponNameSelect, armourNameSelect, itemNameSelect のロジックは
    // 新しい populateWeaponDropdown, populateArmourDropdown, populateItemDropdown に置き換えられるため削除
    const weaponClassSelect = row.querySelector(".weapon-class");
    const armourCategorySelect = row.querySelector(".armour-category");

    if (weaponClassSelect) {
      weaponClassSelect.innerHTML = '<option value="">-</option>';
      for (const cat in WeaponClasses)
        weaponClassSelect.add(new Option(cat, cat));
    }
    if (armourCategorySelect) {
      armourCategorySelect.innerHTML = '<option value="">-</option>';
      for (const cat in ArmourClasses)
        armourCategorySelect.add(new Option(cat, cat));
    }
  }

  function populateWeaponDropdown(dropdownMenu) {
    dropdownMenu.innerHTML = "";
    Weapons.forEach((weapon) => {
      const li = document.createElement("li");
      li.textContent = weapon.rank
        ? `[${weapon.rank}] ${weapon.name}`
        : weapon.name;
      li.dataset.value = weapon.name;
      dropdownMenu.appendChild(li);
    });
  }

  function populateArmourDropdown(dropdownMenu) {
    dropdownMenu.innerHTML = "";
    Armours.forEach((armour) => {
      const li = document.createElement("li");
      li.textContent = armour.rank
        ? `[${armour.rank}] ${armour.name}`
        : armour.name;
      li.dataset.value = armour.name;
      dropdownMenu.appendChild(li);
    });
  }

  function addWeaponRow() {
    const container = document.getElementById("weapons-container");
    const clone = document
      .getElementById("template-weapon")
      .content.cloneNode(true);
    const newRow = clone.querySelector(".weapon-row");
    const nameInput = newRow.querySelector(".weapon-name-free");
    const dropdownMenu = newRow.querySelector(".dropdown-menu");
    const dropdownArrow = newRow.querySelector(".dropdown-arrow");

    populateEquipmentCategories(newRow); // weaponClassSelect の初期化のため
    populateWeaponDropdown(dropdownMenu);

    nameInput.addEventListener("input", () => {
      filterDropdownOptions(nameInput, dropdownMenu);
      openDropdown(dropdownMenu);
    });

    dropdownArrow.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown(dropdownMenu);
    });

    dropdownMenu.addEventListener("click", (e) => {
      if (e.target.tagName === "LI") {
        nameInput.value = e.target.dataset.value;
        closeDropdown(dropdownMenu);
        nameInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    container.appendChild(clone);
    handleWeaponNameChange(nameInput); // 初期値の反映
  }

  function addArmourRow() {
    const container = document.getElementById("armours-container");
    const clone = document
      .getElementById("template-armour")
      .content.cloneNode(true);
    const newRow = clone.querySelector(".armour-row");
    const nameInput = newRow.querySelector(".armour-name-free");
    const dropdownMenu = newRow.querySelector(".dropdown-menu");
    const dropdownArrow = newRow.querySelector(".dropdown-arrow");

    populateEquipmentCategories(newRow); // armourCategorySelect の初期化のため
    populateArmourDropdown(dropdownMenu);

    nameInput.addEventListener("input", () => {
      filterDropdownOptions(nameInput, dropdownMenu);
      openDropdown(dropdownMenu);
    });

    dropdownArrow.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown(dropdownMenu);
    });

    dropdownMenu.addEventListener("click", (e) => {
      if (e.target.tagName === "LI") {
        nameInput.value = e.target.dataset.value;
        closeDropdown(dropdownMenu);
        nameInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    container.appendChild(clone);
    handleArmourNameChange(nameInput); // 初期値の反映
  }

  function populateItemDropdown(dropdownMenu) {
    dropdownMenu.innerHTML = ""; // Clear existing options
    const allItems = Object.values(Items)
      .flatMap((category) => Object.values(category).flat())
      .map((item) => item.name); // Get all item names

    allItems.forEach((itemName) => {
      const li = document.createElement("li");
      li.textContent = itemName;
      li.dataset.value = itemName; // Store the value in a data attribute
      dropdownMenu.appendChild(li);
    });
  }

  function addItemRow({
    isMagic = false,
    name = "", // Default to empty string for new input-with-dropdown
    unitPrice = "",
    quantity = 1,
    effect = "",
    freeName = "",
  } = {}) {
    const container = document.getElementById("items-container");
    const clone = document
      .getElementById("template-item-row")
      .content.cloneNode(true);
    const newRow = clone.querySelector(".item-row");

    const nameInput = newRow.querySelector(".item-name-free");
    const dropdownMenu = newRow.querySelector(".dropdown-menu");
    const dropdownArrow = newRow.querySelector(".dropdown-arrow");

    // Populate dropdown with all items
    populateItemDropdown(dropdownMenu);

    // Set initial values
    nameInput.value = freeName || name; // Use freeName if available, otherwise name

    newRow.querySelector(".item-magic-check").checked = isMagic;
    newRow.querySelector(".item-unit-price").value = unitPrice;
    newRow.querySelector(".item-quantity").value = quantity;
    newRow.querySelector(".item-effect").value = effect;
    container.appendChild(clone);

    // Add event listeners for the new dropdown functionality
    nameInput.addEventListener("input", () => {
      filterDropdownOptions(nameInput, dropdownMenu);
      openDropdown(dropdownMenu);
    });

    dropdownArrow.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown(dropdownMenu);
    });

    dropdownMenu.addEventListener("click", (e) => {
      if (e.target.tagName === "LI") {
        nameInput.value = e.target.dataset.value;
        closeDropdown(dropdownMenu);
        // Trigger change event for the input to update other fields
        nameInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Initial update based on the set name
    handleItemNameChange({ target: nameInput });
  }

  function updateAllItems() {
    calculateAllItemTotals();
    updateItemsOutput();
    updateCashbookAndMoney();
    const equipmentPanel = document.getElementById("panel-equipment-items");
    const hasCrystal = !!document.querySelector(".item-row.is-crystal");
    if (equipmentPanel)
      equipmentPanel.classList.toggle("points-column-visible", hasCrystal);
  }

  function calculateAllItemTotals() {
    document.querySelectorAll(".item-row").forEach((row) => {
      const nameFree = row.querySelector(".item-name-free");
      const name = nameFree ? nameFree.value : "";

      const pointsInput = row.querySelector(".item-points");
      const unitPriceInput = row.querySelector(".item-unit-price");
      const quantityInput = row.querySelector(".item-quantity");
      const totalPriceInput = row.querySelector(".item-total-price");

      const nameForCalc = name.replace(/\s*\((\d+)\s*点\)$/, "");
      const points = parseInt(pointsInput.value, 10) || 0;
      let unitPrice = parseFloat(unitPriceInput.value) || 0;
      const quantity = parseInt(quantityInput.value, 10) || 0;

      row.classList.toggle(
        "is-crystal",
        nameForCalc.toLowerCase().includes("魔晶石") ||
          nameForCalc.toLowerCase().includes("マナチャージクリスタル")
      );

      if (row.classList.contains("is-crystal") && points > 0) {
        if (nameForCalc.toLowerCase().includes("魔晶石")) {
          if (points <= 5) unitPrice = 100 * points;
          else if (points <= 10) unitPrice = 200 * points;
          else if (points <= 15) unitPrice = 300 * points;
          else unitPrice = 400 * points;
        } else {
          unitPrice = 500 * points;
        }
        unitPriceInput.value = unitPrice;
      }
      totalPriceInput.value = unitPrice * quantity;
    });
  }

  function updateItemsOutput() {
    const outputTextarea = document.getElementById("items-output");
    const folderToggle = document.getElementById("item-folder-toggle").checked;
    const folderTitle =
      document.getElementById("item-folder-title").value.trim() || "初期投資";
    let outputLines = [];
    document.querySelectorAll("#items-container .item-row").forEach((row) => {
      const isMagic = row.querySelector(".item-magic-check").checked;
      let name = row.querySelector(".item-name-free").value.trim();
      const quantity =
        parseInt(row.querySelector(".item-quantity").value, 10) || 1;
      const effect = row.querySelector(".item-effect").value.trim();

      if (name) {
        const prefix = isMagic ? "[魔]" : "";
        const nameText =
          name.startsWith("〈") && name.endsWith("〉") ? name : `〈${name}〉`;
        let line = `:${prefix}${nameText}|`;
        if (effect) line += `${effect}`;
        if (quantity > 1) line += (effect ? " " : "") + `${quantity}個`;
        else if (!effect && quantity === 1) line += `1個`;
        outputLines.push(line);
      }
    });
    if (folderToggle && outputLines.length > 0) {
      outputTextarea.value =
        `[>]**${folderTitle}\n` + outputLines.join("\n") + `\n[---]`;
    } else {
      outputTextarea.value = outputLines.join("\n");
    }
  }

  function updateRemainingMoney() {
    const regulationMoney =
      parseInt(
        document.getElementById("money-sidebar-regulation").textContent,
        10
      ) || 0;
    const itemsTotal =
      parseInt(
        document.getElementById("money-sidebar-items-total").textContent,
        10
      ) || 0;
    const other =
      parseInt(document.getElementById("money-sidebar-other").value, 10) || 0;
    document.getElementById("money-sidebar-remaining").textContent =
      regulationMoney + itemsTotal + other;
  }

  function handleWeaponNameChange(nameInputElement) {
    const selectedWeaponName = nameInputElement.value;
    const row = nameInputElement.closest(".weapon-row");
    const data = Weapons.find((item) => item.name === selectedWeaponName);

    const magicCheck = row.querySelector(".item-magic-check");
    if (magicCheck) magicCheck.checked = !!(data && data.isMagic);

    const fields = {
      price: ".weapon-price",
      usage: ".weapon-usage",
      req: ".weapon-req",
      acc: ".weapon-acc",
      rate: ".weapon-rate",
      crit: ".weapon-crit",
      dmg: ".weapon-dmg",
      class: ".weapon-class",
      rank: ".weapon-rank",
      note: ".weapon-note",
    };
    if (data && row) {
      for (const key in fields) {
        const field = row.querySelector(fields[key]);
        if (field) {
          let value = "";
          switch (key) {
            case "usage":
              value = data.hands === 1 ? "片手" : "両手";
              break;
            case "rate":
              value = data.might;
              break;
            default:
              value = data[key] !== undefined ? data[key] : "";
          }
          field.value = value;
        }
      }
    }
    // else if (row) { // データが見つからない場合に空欄にするロジックを削除
    //   for (const key in fields) {
    //     if (row.querySelector(fields[key]))
    //       row.querySelector(fields[key]).value = "";
    //   }
    // }
    updateAllItems();
  }

  function handleArmourNameChange(nameInputElement) {
    const selectedArmourName = nameInputElement.value;
    const row = nameInputElement.closest(".armour-row");
    const data = Armours.find((item) => item.name === selectedArmourName);

    const magicCheck = row.querySelector(".item-magic-check");
    if (magicCheck) magicCheck.checked = !!(data && data.isMagic);

    const fields = {
      price: ".armour-price",
      rank: ".armour-rank",
      req: ".armour-req",
      eva: ".armour-eva",
      def: ".armour-def",
      cls: ".armour-category",
      note: ".armour-note",
    };

    if (data && row) {
      for (const key in fields) {
        const field = row.querySelector(fields[key]);
        if (field) field.value = data[key] || "";
      }
    }
    // else if (row) { // データが見つからない場合に空欄にするロジックを削除
    //   for (const key in fields) {
    //     const field = row.querySelector(fields[key]);
    //     if (field) field.value = "";
    //   }
    // }
    updateAllItems();
  }

  function addGeneralSkillRow(skillName = "", level = 0) {
    const template = document.getElementById("template-general-skill-row");
    const clone = template.content.cloneNode(true);
    const newRow = clone.querySelector(".general-skill-row");
    const select = newRow.querySelector(".general-skill-select");
    const slider = newRow.querySelector(".general-skill-level-slider");
    const levelDisplay = newRow.querySelector(".general-skill-level-display");
    const guideText = newRow.querySelector(".level-guide-text");

    select.innerHTML = '<option value="">技能を選択</option>';
    GeneralSkills.forEach((skill) => select.add(new Option(skill, skill)));

    if (skillName) select.value = skillName;
    slider.value = level;
    levelDisplay.textContent = `Lv ${level}`;
    guideText.textContent = SkillLevelGuides[level];

    generalSkillsContainer.appendChild(clone);
  }

  function updateGeneralSkillTotal() {
    let totalLevel = 0;
    const maxLevel = 10;
    document
      .querySelectorAll(".general-skill-level-slider")
      .forEach((slider) => {
        totalLevel += parseInt(slider.value, 10);
      });

    if (skillProgressBar) {
      const segments = skillProgressBar.querySelectorAll(".progress-segment");
      const isOverLimit = totalLevel > maxLevel;
      segments.forEach((segment, index) => {
        const isActive = index < totalLevel;
        segment.classList.toggle("active", isActive);
        segment.classList.remove("is-last-active");
        if (isActive) segment.classList.toggle("over-limit", isOverLimit);
        else segment.classList.remove("over-limit");
      });
      if (totalLevel > 0 && !isOverLimit)
        segments[totalLevel - 1].classList.add("is-last-active");
    }

    if (totalLevelSpan) {
      const valueSpan = totalLevelSpan.querySelector(".cost-value");
      if (valueSpan) valueSpan.textContent = totalLevel;
      totalLevelSpan.classList.toggle("over-limit", totalLevel > maxLevel);
    }

    if (addGeneralSkillBtn)
      addGeneralSkillBtn.disabled = totalLevel >= maxLevel;
  }

  function updateRegulationValues() {
    const reg = Regulations[regulationSelect.value];
    if (!reg) return;
    expTotalInput.value = reg.exp;
    moneyTotalInput.value = reg.money;
    honorInput.value = reg.honor;
    abyssShardInput.value = reg.abyssShard;
    growthCountInput.value = reg.growth;
    document.getElementById("money-sidebar-regulation").textContent = reg.money;
    const itemContainer = document.getElementById("items-container");
    const existingShardRow = Array.from(
      itemContainer.querySelectorAll(".item-row")
    ).find((row) =>
      row.querySelector(".item-name-free").value.includes("アビスシャード")
    );
    if (existingShardRow) {
      if (reg.abyssShard > 0)
        existingShardRow.querySelector(".item-quantity").value = reg.abyssShard;
      else existingShardRow.remove();
    } else if (reg.abyssShard > 0) {
      addItemRow({
        name: "free",
        freeName: "アビスシャード",
        quantity: reg.abyssShard,
      });
    }
    updateAllItems();
  }

  function getPriorities() {
    const priorities = {};
    statsGridContainer
      .querySelectorAll(".priority-select")
      .forEach((select) => {
        priorities[select.dataset.stat] = parseInt(select.value, 10);
      });
    return priorities;
  }

  function handlePriorityChange(changedSelect) {
    const newValue = changedSelect.value;
    if (newValue === "99") return;
    statsGridContainer
      .querySelectorAll(".priority-select")
      .forEach((select) => {
        if (select !== changedSelect && select.value === newValue)
          select.value = "99";
      });
  }

  function rollSingleGrowth() {
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    return growthMap[diceRoll];
  }

  function handleRollGrowth() {
    growthResultsContainer.innerHTML = "";
    growthRowCounter = 0;
    const count = parseInt(growthCountInput.value, 10) || 0;
    if (count === 0) {
      calculateGrowthSummary();
      return;
    }
    for (let i = 0; i < count; i++)
      displayGrowthResult(rollSingleGrowth(), rollSingleGrowth());
    applyPriorityToAllRows();
  }

  function displayGrowthResult(stat1, stat2) {
    growthRowCounter++;
    const clone = document
      .getElementById("template-growth-row")
      .content.cloneNode(true);
    const row = clone.querySelector(".growth-row");
    const numberSpan = document.createElement("span");
    numberSpan.textContent = `${growthRowCounter}.`;
    numberSpan.classList.add("growth-row-number");
    row.prepend(numberSpan);
    const [btn1, btn2] = row.querySelectorAll(".stat-candidate");
    btn1.textContent = stat1;
    btn2.textContent = stat2;
    if (stat1 === stat2) {
      btn1.classList.add(
        "selected",
        statClassMap[stat1]
      ); /* statClassMap[stat1]を追加 */
      btn2.classList.add(
        "selected",
        statClassMap[stat2]
      ); /* statClassMap[stat2]を追加 */
      btn1.disabled = true;
      btn2.disabled = true;
    }
    updateGrowthRow(row);
    growthResultsContainer.appendChild(clone);
  }

  function handleCandidateClick(button) {
    const row = button.closest(".growth-row");
    row
      .querySelectorAll(".stat-candidate")
      .forEach((btn) => btn.classList.remove("selected", "unselected"));
    button.classList.add("selected");
    const otherButton = row.querySelector(`.stat-candidate:not(.selected)`);
    if (otherButton) otherButton.classList.add("unselected");
    updateGrowthRow(row);
    calculateGrowthSummary();
  }

  function applyPriorityToAllRows() {
    if (!usePriorityCheck.checked) return;
    const priorities = getPriorities();
    growthResultsContainer.querySelectorAll(".growth-row").forEach((row) => {
      const [btn1, btn2] = row.querySelectorAll(".stat-candidate");
      if (btn1.disabled) return;
      const priority1 = priorities[btn1.textContent];
      const priority2 = priorities[btn2.textContent];
      row
        .querySelectorAll(".stat-candidate")
        .forEach((btn) => btn.classList.remove("selected", "unselected"));
      if (priority1 !== 99 || priority2 !== 99) {
        if (priority1 <= priority2) {
          btn1.classList.add("selected");
          btn2.classList.add("unselected");
        } else {
          btn2.classList.add("selected");
          btn1.classList.add("unselected");
        }
      }
      updateGrowthRow(row);
    });
    calculateGrowthSummary();
  }

  function updateGrowthRow(rowElement) {
    const selectedBtn = rowElement.querySelector(".stat-candidate.selected");
    const confirmedSpan = rowElement.querySelector(".stat-confirmed");
    const [btn1, btn2] = rowElement.querySelectorAll(".stat-candidate");
    const areBothDisabled = btn1.disabled && btn2.disabled; // stat1 === stat2 の場合

    // 選択が変更された場合のみ、stat-candidateから既存のクラスを削除
    // ただし、両方がdisabledの場合は削除しない（両方に色を付けたままにするため）
    if (!areBothDisabled) {
      rowElement.querySelectorAll(".stat-candidate").forEach((btn) =>
        statNames.forEach((name) => {
          if (statClassMap[btn.textContent])
            btn.classList.remove(statClassMap[btn.textContent]);
        })
      );
    }

    confirmedSpan.className = "stat-confirmed"; // まず基本クラスにリセット

    if (selectedBtn) {
      const statName = selectedBtn.textContent;
      // selectedBtn に statClassMap を再適用 (areBothDisabled の場合は既に付いているが、念のため)
      selectedBtn.classList.add(statClassMap[statName]);
      confirmedSpan.textContent = statName;
      confirmedSpan.classList.add(statClassMap[statName] || "");
    } else if (areBothDisabled) {
      // stat1 === stat2 で、かつ selectedBtn がない場合（ありえないが念のため）
      const statName = btn1.textContent; // どちらのボタンでも同じステータス名
      confirmedSpan.textContent = statName;
      confirmedSpan.classList.add(statClassMap[statName] || "");
    } else {
      confirmedSpan.textContent = "―";
    }
  }

  function calculateGrowthSummary() {
    const counts = statNames.reduce((acc, name) => ({ ...acc, [name]: 0 }), {});
    growthResultsContainer.querySelectorAll(".growth-row").forEach((row) => {
      const selectedBtn = row.querySelector(".stat-candidate.selected");
      if (selectedBtn && counts.hasOwnProperty(selectedBtn.textContent))
        counts[selectedBtn.textContent]++;
    });
    statNames.forEach((statName) => {
      const countSpan = document.getElementById(`summary-count-${statName}`);
      if (countSpan) countSpan.textContent = counts[statName];
    });
    updateAllStatTotals();
  }

  function updateAllStatTotals() {
    statNames.forEach((name) => {
      const initial =
        parseInt(
          statsGridContainer.querySelector(
            `.initial-stat-input[data-stat="${name}"]`
          ).value,
          10
        ) || 0;
      const bracelet =
        parseInt(
          statsGridContainer.querySelector(`.bracelet-btn[data-stat="${name}"]`)
            .dataset.value,
          10
        ) || 0;
      const growth =
        parseInt(
          document.getElementById(`summary-count-${name}`).textContent,
          10
        ) || 0;
      const total = initial + bracelet + growth;
      const bonus = Math.floor(total / 6);
      statsGridContainer.querySelector(
        `.stat-total[data-stat="${name}"]`
      ).textContent = total;
      statsGridContainer.querySelector(
        `.stat-bonus[data-stat="${name}"]`
      ).textContent = bonus;
    });
  }

  function partitionInteger(total, maxValue) {
    let parts = [];
    let currentTotal = 0;
    while (currentTotal < total) {
      let remaining = total - currentTotal;
      let maxPart = Math.min(maxValue, remaining);
      let newPart = Math.floor(Math.random() * maxPart) + 1;
      parts.push(newPart);
      currentTotal += newPart;
    }
    let excess = parts.reduce((a, b) => a + b, 0) - total;
    while (excess > 0) {
      let partIndex = Math.floor(Math.random() * parts.length);
      if (parts[partIndex] > 1) {
        parts[partIndex]--;
        excess--;
      }
    }
    return parts.filter((p) => p > 0);
  }

  function handleRandomizeSkillNames() {
    let availableSkills = [...GeneralSkills];
    const skillRows =
      generalSkillsContainer.querySelectorAll(".general-skill-row");
    skillRows.forEach((row) => {
      const select = row.querySelector(".general-skill-select");
      if (availableSkills.length > 0) {
        const skillIndex = Math.floor(Math.random() * availableSkills.length);
        const selectedSkill = availableSkills.splice(skillIndex, 1)[0];
        select.value = selectedSkill;
      } else {
        select.value = "";
      }
    });
  }

  function handleRandomizeAll() {
    generalSkillsContainer.innerHTML = "";
    const levelsToAssign = partitionInteger(10, 5);
    let availableSkills = [...GeneralSkills];
    levelsToAssign.forEach((level) => {
      if (availableSkills.length === 0) return;
      const skillIndex = Math.floor(Math.random() * availableSkills.length);
      const selectedSkill = availableSkills.splice(skillIndex, 1)[0];
      addGeneralSkillRow(selectedSkill, level);
    });
    updateGeneralSkillTotal();
  }

  // 敵強化機能のロジック
  function applyEnemyEnhancement() {
    const inputJson = enemyJsonInput.value;
    if (!inputJson) {
      enemyJsonOutput.value = "エラー: JSONデータが入力されていません。";
      return;
    }

    try {
      const enemyData = JSON.parse(inputJson);
      const shards = parseInt(swordShardsCount.value, 10) || 0;
      const totalTp = parseInt(treasurePointsTotalInput.value, 10) || 0;

      if (shards <= 0 && totalTp <= 0) {
        enemyJsonOutput.value = "エラー: 強化する内容がありません。";
        return;
      }

      // memo欄を初期化（なければ作成）
      if (!enemyData.data.memo) enemyData.data.memo = "";

      // 既存の自動生成メモをフィルタリング
      const memoLines = enemyData.data.memo.split("\n");
      const filteredLines = memoLines.filter(
        (line) =>
          !line.includes("生命抵抗力:") &&
          !line.includes("精神抵抗力:") &&
          !line.includes("剣のかけら：") &&
          !line.startsWith("▼トレジャー強化") &&
          !line.match(/^\S.*\((\d+)P\)$/) // トレジャー強化の各行
      );
      enemyData.data.memo = filteredLines.join("\n").trim();

      // --- 剣のかけら強化 ---
      if (shards > 0) {
        const resistanceBonus =
          shards >= 16
            ? 4
            : shards >= 11
            ? 3
            : shards >= 6
            ? 2
            : shards >= 1
            ? 1
            : 0;

        // 強化前の抵抗値を取得
        const originalLifeResValue = parseInt(
          enemyData.data.params?.find((p) => p.label === "生命抵抗")?.value ||
            "0",
          10
        );
        const originalSpiritResValue = parseInt(
          enemyData.data.params?.find((p) => p.label === "精神抵抗")?.value ||
            "0",
          10
        );

        if (enemyData.data.status) {
          enemyData.data.status.forEach((s) => {
            if (s.label.includes("HP")) {
              s.value = String(parseInt(s.value, 10) + shards * 5);
              s.max = String(parseInt(s.max, 10) + shards * 5);
            } else if (s.label.includes("MP")) {
              s.value = String(parseInt(s.value, 10) + shards);
              s.max = String(parseInt(s.max, 10) + shards);
            }
          });
        }

        let enhancedLifeResValue = originalLifeResValue;
        let enhancedSpiritResValue = originalSpiritResValue;

        if (enemyData.data.params) {
          const lifeResParam = enemyData.data.params.find(
            (p) => p.label === "生命抵抗"
          );
          if (lifeResParam) {
            enhancedLifeResValue = originalLifeResValue + resistanceBonus;
            lifeResParam.value = String(enhancedLifeResValue);
          }
          const spiritResParam = enemyData.data.params.find(
            (p) => p.label === "精神抵抗"
          );
          if (spiritResParam) {
            enhancedSpiritResValue = originalSpiritResValue + resistanceBonus;
            spiritResParam.value = String(enhancedSpiritResValue);
          }
        }

        // 新しい強化情報をmemoに追加
        let shardMemo = "";
        if (enemyData.data.memo) shardMemo += "\n";
        shardMemo += `生命抵抗力:${originalLifeResValue}(${enhancedLifeResValue})　精神抵抗力:${originalSpiritResValue}(${enhancedSpiritResValue})\n剣のかけら：${shards}個`;
        enemyData.data.memo += shardMemo;
      }

      // --- トレジャーポイント強化 ---
      if (totalTp > 0) {
        let tpMemo = "";
        if (enemyData.data.memo) tpMemo += "\n";
        tpMemo += `▼トレジャー強化(${totalTp}P)`;
        document.querySelectorAll(".tp-ability-row").forEach((row) => {
          const ability = row.querySelector(".tp-ability-select").value;
          const points = row.querySelector(".tp-points-input").value;
          if (ability && points) {
            tpMemo += `\n${
              row.querySelector(".tp-ability-select").selectedOptions[0].text
            } (${points}P)`;
          }
        });
        enemyData.data.memo += tpMemo;
      }

      enemyJsonOutput.value = JSON.stringify(enemyData, null, 2);
      showToast("強化を適用しました！");
    } catch (error) {
      console.error(error);
      enemyJsonOutput.value = "エラー: 無効なJSON形式です。\n" + error;
    }
  }

  // --- トレジャーポイント関連の関数 ---
  function addTpAbilityRow() {
    const template = document.getElementById("template-tp-ability-row");
    if (!template || !tpSelectionContainer) return;
    const clone = template.content.cloneNode(true);
    tpSelectionContainer.appendChild(clone);
  }

  function updateTotalTreasurePoints() {
    let total = 0;
    document.querySelectorAll(".tp-ability-row").forEach((row) => {
      const points =
        parseInt(row.querySelector(".tp-points-input").value, 10) || 0;
      total += points;
    });
    if (treasurePointsTotalInput) {
      treasurePointsTotalInput.value = total;
    }
  }

  // トースト表示用の関数
  let toastTimeout;
  function showToast(message) {
    const toast = document.getElementById("result-message");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // 汎用ツールチップ表示関数
  function showDynamicTooltip(targetElement, content) {
    if (!tooltipElement) {
      tooltipElement = document.createElement("div");
      tooltipElement.className = "dynamic-tooltip";
      document.body.appendChild(tooltipElement);
    }
    tooltipElement.innerHTML = content;
    tooltipElement.classList.add("visible");

    const rect = targetElement.getBoundingClientRect();
    let x = rect.left;
    let y = rect.bottom + 5 + window.scrollY;

    const tooltipRect = tooltipElement.getBoundingClientRect();
    if (x + tooltipRect.width > window.innerWidth) {
      x = window.innerWidth - tooltipRect.width - 10;
    }
    if (y + tooltipRect.height > window.innerHeight) {
      y = rect.top - tooltipRect.height - 5 + window.scrollY;
    }

    tooltipElement.style.left = `${x}px`;
    tooltipElement.style.top = `${y}px`;
  }

  function hideDynamicTooltip() {
    if (tooltipElement) {
      tooltipElement.classList.remove("visible");
    }
  }

  initialize();
});

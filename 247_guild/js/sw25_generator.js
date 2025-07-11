document.addEventListener("DOMContentLoaded", () => {
  const {
    Races,
    Regulations,
    WeaponClasses,
    ArmourClasses,
    Weapons,
    Armours,
    Items,
  } = window.sw25_data;

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

  const statNames = ["器用度", "敏捷度", "筋力", "生命力", "知力", "精神力"];
  const statClassMap = {
    器用度: "stat-器用度",
    敏捷度: "stat-敏捷度",
    筋力: "stat-筋力",
    生命力: "stat-生命力",
    知力: "stat-知力",
    精神力: "stat-精神力",
  };
  const growthMap = {
    2: "器用度",
    3: "敏捷度",
    4: "筋力",
    5: "生命力",
    6: "知力",
    7: "ランダム",
    8: "知力",
    9: "精神力",
    10: "生命力",
    11: "筋力",
    12: "敏捷度",
  };
  let growthRowCounter = 0;
  let userCashbookContent = "";

  function initialize() {
    populateRegulations();
    setupStatsGrid();
    setupBasicInfoPanel();
    addWeaponRow();
    addArmourRow();
    setupItemPanel();
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
      キャラクター名: "",
      プレイヤー名: "",
      種族: "",
      年齢: "",
      性別: "",
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
          .querySelector(".personal-data-value")
          .insertAdjacentElement("afterend", unitBtn);
      }
    }
  }

  function addPersonalDataRow(key = "", value = "") {
    const container = document.getElementById("personal-data-fields-container");
    const clone = document
      .getElementById("template-personal-data-row")
      .content.cloneNode(true);
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
    const weaponNameSelect = row.querySelector(".weapon-name-select");
    const armourNameSelect = row.querySelector(".armour-name-select");
    const weaponClassSelect = row.querySelector(".weapon-class");
    const armourCategorySelect = row.querySelector(".armour-category");
    const itemNameSelect = row.querySelector(".item-name-select");

    const populateSelect = (select, data, groupBy, defaultOptionText) => {
      if (!select) return;
      select.innerHTML = `<option value="">${defaultOptionText}</option>`;
      const grouped = data.reduce((acc, item) => {
        (acc[item[groupBy]] = acc[item[groupBy]] || []).push(item);
        return acc;
      }, {});
      for (const cat in grouped) {
        const optgroup = document.createElement("optgroup");
        optgroup.label = cat;
        grouped[cat].forEach((item) => {
          const option = document.createElement("option");
          option.textContent = item.rank
            ? `[${item.rank}] ${item.name}`
            : item.name;
          option.value = item.name;
          if (item.rank) option.dataset.rank = item.rank;
          optgroup.appendChild(option);
        });
        select.appendChild(optgroup);
      }
      select.add(new Option("その他（自由入力）", "free"));
    };

    populateSelect(weaponNameSelect, Weapons, "cls", "武器をリストから選択");
    populateSelect(armourNameSelect, Armours, "cls", "防具をリストから選択");

    if (itemNameSelect) {
      itemNameSelect.innerHTML =
        '<option value="">アイテムをリストから選択</option>';
      for (const cat in Items) {
        const optgroup = document.createElement("optgroup");
        optgroup.label = cat;
        Items[cat].forEach((item) => {
          const option = document.createElement("option");
          option.textContent = item.name;
          option.value = item.name;
          optgroup.appendChild(option);
        });
        itemNameSelect.appendChild(optgroup);
      }
      itemNameSelect.add(new Option("その他（自由入力）", "free"));
    }

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

  function addWeaponRow() {
    const container = document.getElementById("weapons-container");
    const clone = document
      .getElementById("template-weapon")
      .content.cloneNode(true);
    populateEquipmentCategories(clone.querySelector(".weapon-row"));
    container.appendChild(clone);
  }

  function addArmourRow() {
    const container = document.getElementById("armours-container");
    const clone = document
      .getElementById("template-armour")
      .content.cloneNode(true);
    populateEquipmentCategories(clone.querySelector(".armour-row"));
    container.appendChild(clone);
  }

  function setupItemPanel() {
    const container = document.getElementById("items-container");
    container.innerHTML = "";
    addItemRow({ freeName: "冒険者セット", unitPrice: 100 });
    addItemRow();
    addItemRow();
  }

  function addItemRow({
    isMagic = false,
    name = "free",
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

    const nameSelect = newRow.querySelector(".item-name-select");
    const nameFree = newRow.querySelector(".item-name-free");
    populateEquipmentCategories(newRow);

    nameSelect.value = name;
    nameFree.value = freeName;
    if (name === "free") {
      nameFree.style.display = "block";
      nameSelect.style.display = "none";
    } else {
      nameFree.style.display = "none";
      nameSelect.style.display = "block";
    }

    newRow.querySelector(".item-magic-check").checked = isMagic;
    newRow.querySelector(".item-unit-price").value = unitPrice;
    newRow.querySelector(".item-quantity").value = quantity;
    newRow.querySelector(".item-effect").value = effect;
    container.appendChild(clone);
    handleItemNameChange({ target: nameSelect });
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
      const nameSelect = row.querySelector(".item-name-select");
      const nameFree = row.querySelector(".item-name-free");
      const name =
        nameSelect.style.display !== "none" ? nameSelect.value : nameFree.value;

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
          // マナチャージクリスタル
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
      let name = row.querySelector(".item-name-select").value;
      if (name === "free")
        name = row.querySelector(".item-name-free").value.trim();
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

  function updateCashbookAndMoney() {
    const cashbookTextarea = document.getElementById("cashbook");
    const folderToggle = document.getElementById("item-folder-toggle").checked;
    const folderTitle =
      document.getElementById("item-folder-title").value.trim() || "初期投資";
    let autoEntries = [];
    let totalCost = 0;

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
        let name = "";
        if (nameSelect && nameSelect.style.display !== "none")
          name = nameSelect.value;
        else if (nameFree) name = nameFree.value.trim();
        if (name === "free" || !name) return;

        if (priceInput) {
          const price = parseFloat(priceInput.value) || 0;
          if (name && price > 0) {
            totalCost += price;
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
      autoBlock + (userCashbookContent ? "\n\n" + userCashbookContent : "");
    document.getElementById(
      "money-sidebar-items-total"
    ).textContent = `-${totalCost}`;
    updateRemainingMoney();
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

  function handleWeaponNameChange(selectElement) {
    const selectedWeaponName = selectElement.value;
    const row = selectElement.closest(".weapon-row");
    const data = Weapons.find((item) => item.name === selectedWeaponName);

    const magicCheck = row.querySelector(".item-magic-check");
    if (magicCheck) magicCheck.checked = !!(data && data.isMagic);

    // 命中(acc)を含むフィールドのマッピング
    const fields = {
      price: ".weapon-price",
      usage: ".weapon-usage",
      req: ".weapon-req",
      acc: ".weapon-acc", // 命中のマッピングを追加
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
              value = data[key] !== undefined ? data[key] : ""; // accが0の場合も表示
          }
          field.value = value;
        }
      }
    } else if (row) {
      for (const key in fields) {
        if (row.querySelector(fields[key]))
          row.querySelector(fields[key]).value = "";
      }
    }
    updateAllItems();
  }

  // ★★★ この関数を修正 ★★★
  function handleArmourNameChange(selectElement) {
    const selectedArmourName = selectElement.value;
    const row = selectElement.closest(".armour-row");
    const data = Armours.find((item) => item.name === selectedArmourName);

    const magicCheck = row.querySelector(".item-magic-check");
    if (magicCheck) magicCheck.checked = !!(data && data.isMagic);

    const fields = {
      price: ".armour-price",
      rank: ".armour-rank",
      req: ".armour-req",
      eva: ".armour-eva",
      def: ".armour-def",
      cls: ".armour-category", // dataの 'cls' を elementの '.armour-category' にマッピング
      note: ".armour-note",
    };

    if (data && row) {
      for (const key in fields) {
        const field = row.querySelector(fields[key]);
        if (field) {
          field.value = data[key] || "";
        }
      }
    } else if (row) {
      for (const key in fields) {
        const field = row.querySelector(fields[key]);
        if (field) field.value = "";
      }
    }
    updateAllItems();
  }

  function handleItemNameChange({ target: nameInputElement }) {
    const row = nameInputElement.closest(".item-row");
    const selectedValue = nameInputElement.value;
    const allItems = Object.values(Items).flat();
    const selectedItem = allItems.find((item) => item.name === selectedValue);

    const magicCheck = row.querySelector(".item-magic-check");
    if (magicCheck)
      magicCheck.checked = !!(selectedItem && selectedItem.isMagic);

    if (selectedItem) {
      const price = selectedItem.price;
      row.querySelector(".item-unit-price").value =
        typeof price === "string" &&
        (price.includes("x") || price.includes("~"))
          ? parseInt(price) || 0
          : parseInt(price) || 0;
      row.querySelector(".item-effect").value = selectedItem.note || "";
    } else {
      row.querySelector(".item-unit-price").value = "";
      row.querySelector(".item-effect").value = "";
    }
    updateAllItems();
  }

  function setupEventListeners() {
    const form = document.getElementById("char-sheet-form");

    form.addEventListener("click", (event) => {
      const target = event.target;
      const addBtn = target.closest(".add-row-btn");
      const removeBtn = target.closest(".remove-row-btn");
      const selectBtn = target.closest(".select-toggle-btn, .item-select-btn");
      const copyPersonalBtn = target.closest("#copy-personal-data-btn");
      const copyItemsBtn = target.closest("#copy-items-list-btn");
      const copyCashbookBtn = target.closest("#copy-cashbook-btn");
      const unitBtn = target.closest(".unit-btn");

      if (addBtn) {
        const templateId = addBtn.dataset.template;
        if (templateId === "template-weapon") addWeaponRow();
        else if (templateId === "template-armour") addArmourRow();
        else if (templateId === "template-item") addItemRow();
        else if (addBtn.id === "add-personal-data-row-btn")
          addPersonalDataRow();
        return;
      }
      if (removeBtn) {
        const row = removeBtn.closest(".dynamic-row");
        if (row) {
          row.remove();
          updateAllItems();
        }
        return;
      }

      if (selectBtn) {
        const cell = selectBtn.closest(".item-name-cell");
        if (cell) {
          const selectEl = cell.querySelector("select");
          const freeInputEl = cell.querySelector("input[type='text']");
          if (selectEl.style.display !== "none") {
            selectEl.style.display = "none";
            freeInputEl.style.display = "block";
            freeInputEl.focus();
          } else {
            selectEl.style.display = "block";
            freeInputEl.style.display = "none";
            selectEl.focus();
          }
        }
      }

      if (copyPersonalBtn)
        navigator.clipboard.writeText(
          document.getElementById("personal-data-output").value
        );
      if (copyItemsBtn)
        navigator.clipboard.writeText(
          document.getElementById("items-output").value
        );
      if (copyCashbookBtn)
        navigator.clipboard.writeText(
          document.getElementById("cashbook").value
        );
      if (unitBtn) {
        const valueInput = unitBtn
          .closest(".personal-data-row")
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
    });

    form.addEventListener("change", (e) => {
      const target = e.target;
      if (target.matches(".weapon-name-select")) handleWeaponNameChange(target);
      if (target.matches(".armour-name-select")) handleArmourNameChange(target);
      if (target.matches(".item-name-select"))
        handleItemNameChange({ target: target });
    });

    document.getElementById("cashbook").addEventListener("input", (e) => {
      const regex = /(\[>\]\*\*.*?\n[\s\S]*?\[---\]\n*)/;
      const match = e.target.value.match(regex);
      userCashbookContent = e.target.value
        .replace(match ? match[1] : "", "")
        .trim();
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
      (row.querySelector(".item-name-select").value === "free"
        ? row.querySelector(".item-name-free").value
        : row.querySelector(".item-name-select").value
      ).includes("アビスシャード")
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
    const sum =
      Math.floor(Math.random() * 6) + 1 + (Math.floor(Math.random() * 6) + 1);
    let resultStat = growthMap[sum];
    if (resultStat === "ランダム")
      resultStat = statNames[Math.floor(Math.random() * 6)];
    return resultStat;
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
      btn1.classList.add("selected");
      btn2.classList.add("selected");
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
    rowElement.querySelectorAll(".stat-candidate").forEach((btn) =>
      statNames.forEach((name) => {
        if (statClassMap[btn.textContent])
          btn.classList.remove(statClassMap[btn.textContent]);
      })
    );
    confirmedSpan.className = "stat-confirmed";
    if (selectedBtn) {
      const statName = selectedBtn.textContent;
      selectedBtn.classList.add(statClassMap[statName]);
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

  initialize();
});

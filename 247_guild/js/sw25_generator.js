document.addEventListener("DOMContentLoaded", () => {
  const { Races, Regulations } = window.sw25_data;

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

  function initialize() {
    // レギュ・成長タブ
    populateRegulations();
    setupStatsGrid();

    // 基本情報タブ
    setupBasicInfoPanel();
    updatePersonalDataOutput();

    // 全体
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
    const emptyHeader = document.createElement("div");
    statsGridContainer.appendChild(emptyHeader);
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

  // ★★★★★ ここからキャラクター情報パネル用の新関数群 ★★★★★
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
      // ★★★ 単位ボタンの追加ロジック ★★★
      if (key === "身長" || key === "体重") {
        const unit = key === "身長" ? "cm" : "kg";
        const unitBtn = document.createElement("button");
        unitBtn.type = "button";
        unitBtn.className = "unit-btn";
        unitBtn.textContent = unit;
        unitBtn.dataset.unit = unit;
        // valueの後、削除ボタンの前に挿入
        const valueInput = newRow.querySelector(".personal-data-value");
        valueInput.insertAdjacentElement("afterend", unitBtn);
      }
    }
  }

  function addPersonalDataRow(key = "", value = "") {
    const container = document.getElementById("personal-data-fields-container");
    const template = document.getElementById("template-personal-data-row");
    const clone = template.content.cloneNode(true);
    const newRow = clone.querySelector(".dynamic-row");
    newRow.querySelector(".personal-data-key").value = key;
    newRow.querySelector(".personal-data-value").value = value;
    container.appendChild(clone);
    return newRow; // ★ 追加した行要素を返す
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
        if (key) {
          output += `:${key}|${value}\n`;
        }
      });
    output += "[---]";
    outputTextarea.value = output;
  }
  // ★★★★★ キャラクター情報パネル用関数ここまで ★★★★★

  function setupEventListeners() {
    sidebarLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.dataset.target;
        sidebarLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        formPanels.forEach((panel) => {
          panel.classList.toggle("active", panel.id === targetId);
        });
      });
    });

    // --- レギュ・成長タブのイベント ---
    regulationSelect.addEventListener("change", updateRegulationValues);
    rollGrowthBtn.addEventListener("click", handleRollGrowth);
    growthResultsContainer.addEventListener("click", (event) => {
      if (event.target.classList.contains("stat-candidate")) {
        handleCandidateClick(event.target);
      }
    });
    usePriorityCheck.addEventListener("change", applyPriorityToAllRows);
    statsGridContainer.addEventListener("change", (e) => {
      if (e.target.classList.contains("priority-select")) {
        handlePriorityChange(e.target);
        applyPriorityToAllRows();
      }
    });
    statsGridContainer.addEventListener("input", (e) => {
      if (e.target.classList.contains("initial-stat-input")) {
        updateAllStatTotals();
      }
    });
    statsGridContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("bracelet-btn")) {
        const currentValue = parseInt(e.target.dataset.value, 10);
        let nextValue;
        if (currentValue === 0) nextValue = 2;
        else if (currentValue === 2) nextValue = 1;
        else nextValue = 0;
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

    // --- 基本情報タブのイベント ---
    const basicPanel = document.getElementById("panel-basic");
    if (basicPanel) {
      // ★★★ 単位ボタンとコピーボタンのリスナーを追加 ★★★
      basicPanel.addEventListener("click", (e) => {
        if (e.target.classList.contains("unit-btn")) {
          const row = e.target.closest(".personal-data-row");
          const valueInput = row.querySelector(".personal-data-value");
          valueInput.value += e.target.dataset.unit;
          valueInput.dispatchEvent(new Event("input", { bubbles: true })); // 変更を通知
          valueInput.focus();
        }
        if (
          e.target.id === "copy-personal-data-btn" ||
          e.target.closest("#copy-personal-data-btn")
        ) {
          const outputTextarea = document.getElementById(
            "personal-data-output"
          );
          navigator.clipboard
            .writeText(outputTextarea.value)
            .then(() => {
              const btn = document.getElementById("copy-personal-data-btn");
              const originalText = btn.innerHTML;
              btn.innerHTML = "コピーしました！";
              setTimeout(() => {
                btn.innerHTML = originalText;
              }, 2000);
            })
            .catch((err) => {
              console.error("コピーに失敗しました", err);
            });
        }
      });

      const fieldsContainer = document.getElementById(
        "personal-data-fields-container"
      );
      fieldsContainer.addEventListener("input", (e) => {
        if (
          e.target.classList.contains("personal-data-key") ||
          e.target.classList.contains("personal-data-value")
        ) {
          updatePersonalDataOutput();
        }
      });
      document
        .getElementById("add-personal-data-row-btn")
        .addEventListener("click", () => {
          addPersonalDataRow();
        });
    }

    // --- 汎用イベント（削除ボタン） ---
    document.addEventListener("click", (event) => {
      if (event.target.closest(".remove-row-btn")) {
        const row = event.target.closest(".dynamic-row");
        if (row) {
          row.remove();
          if (row.classList.contains("personal-data-row")) {
            updatePersonalDataOutput();
          }
        }
      }
    });
  }

  function updateRegulationValues() {
    const selectedIndex = regulationSelect.value;
    const reg = Regulations[selectedIndex];
    if (!reg) return;
    expTotalInput.value = reg.exp;
    moneyTotalInput.value = reg.money;
    honorInput.value = reg.honor;
    abyssShardInput.value = reg.abyssShard;
    growthCountInput.value = reg.growth;
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
        if (select !== changedSelect && select.value === newValue) {
          select.value = "99";
        }
      });
  }

  function rollSingleGrowth() {
    const sum =
      Math.floor(Math.random() * 6) + 1 + (Math.floor(Math.random() * 6) + 1);
    let resultStat = growthMap[sum];
    if (resultStat === "ランダム") {
      resultStat = statNames[Math.floor(Math.random() * 6)];
    }
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
    for (let i = 0; i < count; i++) {
      displayGrowthResult(rollSingleGrowth(), rollSingleGrowth());
    }
    applyPriorityToAllRows();
  }

  function displayGrowthResult(stat1, stat2) {
    growthRowCounter++;
    const template = document.getElementById("template-growth-row");
    const clone = template.content.cloneNode(true);
    const row = clone.querySelector(".growth-row");

    const numberSpan = document.createElement("span");
    numberSpan.textContent = `${growthRowCounter}.`;
    numberSpan.classList.add("growth-row-number");
    row.prepend(numberSpan);

    const btn1 = row.querySelector('.stat-candidate[data-choice="1"]');
    const btn2 = row.querySelector('.stat-candidate[data-choice="2"]');
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
      const btn1 = row.querySelector('.stat-candidate[data-choice="1"]');
      const btn2 = row.querySelector('.stat-candidate[data-choice="2"]');
      if (btn1.disabled) return;
      const priority1 = priorities[btn1.textContent];
      const priority2 = priorities[btn2.textContent];
      row
        .querySelectorAll(".stat-candidate")
        .forEach((btn) => btn.classList.remove("selected", "unselected"));
      if (priority1 === 99 && priority2 === 99) {
        /* No change */
      } else if (priority1 <= priority2) {
        btn1.classList.add("selected");
        btn2.classList.add("unselected");
      } else {
        btn2.classList.add("selected");
        btn1.classList.add("unselected");
      }
      updateGrowthRow(row);
    });
    calculateGrowthSummary();
  }

  function updateGrowthRow(rowElement) {
    const selectedBtn = rowElement.querySelector(".stat-candidate.selected");
    const confirmedSpan = rowElement.querySelector(".stat-confirmed");
    rowElement.querySelectorAll(".stat-candidate").forEach((btn) => {
      statNames.forEach((name) => {
        if (statClassMap[btn.textContent])
          btn.classList.remove(statClassMap[btn.textContent]);
      });
    });
    if (selectedBtn) {
      const statName = selectedBtn.textContent;
      selectedBtn.classList.add(statClassMap[statName]);
    }
    confirmedSpan.className = "stat-confirmed";
    if (selectedBtn) {
      const statName = selectedBtn.textContent;
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
      if (selectedBtn) {
        const confirmedStat = selectedBtn.textContent;
        if (counts.hasOwnProperty(confirmedStat)) {
          counts[confirmedStat]++;
        }
      }
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

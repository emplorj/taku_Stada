// /js/filter_module.js (不具合修正・最終完成版)
class FilterableList {
  constructor(
    listContainerId,
    controlsContainerId,
    data,
    config,
    renderFunction,
    customFilterFunction
  ) {
    this.listContainer = document.getElementById(listContainerId);
    this.controlsContainer = document.getElementById(controlsContainerId);
    this.allData = data;
    this.config = config;
    this.renderFunction = renderFunction;
    this.customFilterFunction = customFilterFunction;
    this.activePopover = null;

    this.currentFilters = this.getDefaultFilters();
    this.setupControls();
    this.applyFiltersAndSort();
  }

  getDefaultFilters() {
    const defaults = { searchText: "" };
    if (this.config.popoverFilters) {
      Object.keys(this.config.popoverFilters).forEach((key) => {
        defaults[key] = this.config.popoverFilters[key].values;
      });
    }
    if (this.config.toggleFilters) {
      Object.keys(this.config.toggleFilters).forEach((key) => {
        // defaultAllがtrueの場合のみ、全選択をデフォルトにする
        if (this.config.toggleFilters[key].defaultAll) {
          defaults[key] = this.config.toggleFilters[key].values;
        } else {
          defaults[key] = [];
        }
      });
    }
    return defaults;
  }

  setupControls() {
    const controls = document.createElement("div");
    controls.className = "filter-controls";

    const topRow = document.createElement("div");
    topRow.className = "top-row";

    if (this.config.nameSelectorHtml) {
      topRow.innerHTML += this.config.nameSelectorHtml;
    }

    if (this.config.searchKey) {
      topRow.innerHTML += `<div class="filter-group search-group"><label for="search-input">${
        this.config.searchLabel || "検索"
      }:</label><input type="text" id="search-input" placeholder="キーワード入力..."></div>`;
    }
    if (this.config.popoverFilters) {
      for (const [key, filterConfig] of Object.entries(
        this.config.popoverFilters
      )) {
        topRow.innerHTML += `<div class="filter-group popover-group"><label>${filterConfig.label}:</label><button class="filter-trigger-btn" data-filter-key="${key}">すべて</button></div>`;
      }
    }
    controls.appendChild(topRow);

    if (this.config.toggleFilters) {
      for (const [key, filterConfig] of Object.entries(
        this.config.toggleFilters
      )) {
        let buttonsHtml = "";
        const currentValues = this.currentFilters[key];
        filterConfig.values.forEach((val, index) => {
          const id = `toggle-${key}-${index}`;
          const isChecked = currentValues.includes(val);
          buttonsHtml += `<input type="checkbox" id="${id}" data-filter-key="${key}" value="${val}" ${
            isChecked ? "checked" : ""
          }><label for="${id}" data-status="${val}">${val}</label>`;
        });
        const group = document.createElement("div");
        group.className = "toggle-filter-group";
        group.innerHTML = `<label>${filterConfig.label}:</label><div class="toggle-buttons">${buttonsHtml}</div>`;
        controls.appendChild(group);
      }
    }

    this.controlsContainer.innerHTML = "";
    this.controlsContainer.appendChild(controls);

    document
      .getElementById("search-input")
      ?.addEventListener("input", () => this.applyFiltersAndSort());
    document
      .querySelectorAll(".filter-trigger-btn")
      .forEach((btn) =>
        btn.addEventListener("click", (e) => this.togglePopover(e))
      );
    document
      .querySelectorAll('.toggle-buttons input[type="checkbox"]')
      .forEach((input) =>
        input.addEventListener("change", () => this.applyFiltersAndSort())
      );
    document.addEventListener("click", (e) =>
      this.closePopoverOnClickOutside(e)
    );
  }

  applyFiltersAndSort() {
    this.currentFilters.searchText =
      document.getElementById("search-input")?.value.toLowerCase() || "";
    // ボタンのテキストを更新
    Object.keys(this.config.popoverFilters || {}).forEach((key) => {
      const btn = document.querySelector(`button[data-filter-key="${key}"]`);
      if (btn) {
        const all = this.config.popoverFilters[key].values;
        const current = this.currentFilters[key];
        if (current.length === all.length) {
          btn.textContent = "すべて";
        } else if (current.length === 0) {
          btn.textContent = "選択なし";
        } else if (current.length === 1) {
          btn.textContent = current[0];
        } else {
          btn.textContent = `${current.length}件選択`;
        }
      }
    });
    Object.keys(this.config.toggleFilters || {}).forEach((key) => {
      this.currentFilters[key] = Array.from(
        document.querySelectorAll(
          `.toggle-buttons input[data-filter-key="${key}"]:checked`
        )
      ).map((cb) => cb.value);
    });

    // ▼▼▼ フィルターロジックを全面的に修正 ▼▼▼
    let filteredData = this.allData.filter((item) => {
      // 検索フィルター
      if (
        this.currentFilters.searchText &&
        !item[this.config.searchKey]
          .toLowerCase()
          .includes(this.currentFilters.searchText)
      ) {
        return false;
      }
      // ポップオーバーフィルター
      for (const key of Object.keys(this.config.popoverFilters || {})) {
        const allValues = this.config.popoverFilters[key].values;
        // 「すべて選択」状態でない場合のみフィルタリングを実行
        if (this.currentFilters[key].length < allValues.length) {
          if (!this.currentFilters[key].includes(item[key])) {
            return false;
          }
        }
      }
      // 通常のトグルフィルター (参加状況フィルターは除く)
      for (const key of Object.keys(this.config.toggleFilters || {})) {
        if (key !== "participationStatus") {
          // カスタムフィルターのキーは除外
          if (this.currentFilters[key].length === 0) {
            return false; // 1つもチェックがない場合は何も表示しない
          }
          if (!this.currentFilters[key].includes(item[key])) {
            return false;
          }
        }
      }
      return true;
    });

    // カスタムフィルター（参加状況）を適用
    if (this.customFilterFunction) {
      filteredData = this.customFilterFunction(
        filteredData,
        this.currentFilters
      );
    }

    this.renderFunction(filteredData);
  }

  updatePopoverFilter() {
    if (!this.activePopover) return;
    const key = this.activePopover.btn.dataset.filterKey;
    const popover = this.activePopover.popover;
    const checked = Array.from(popover.querySelectorAll("input:checked")).map(
      (cb) => cb.value
    );
    this.currentFilters[key] = checked;
    this.applyFiltersAndSort();
  }

  togglePopover(event) {
    event.stopPropagation();
    const btn = event.currentTarget;
    const filterKey = btn.dataset.filterKey;
    if (this.activePopover && this.activePopover.btn === btn) {
      this.closeActivePopover();
      return;
    }
    this.closeActivePopover();
    const popover = document.createElement("div");
    popover.className = "popover-container";
    let checkboxesHtml = '<div class="checkboxes">';
    const filterConfig = this.config.popoverFilters[filterKey];
    const currentValues = this.currentFilters[filterKey];
    filterConfig.values.forEach((val) => {
      const isChecked = currentValues.includes(val);
      checkboxesHtml += `<label><input type="checkbox" data-filter-key="${filterKey}" value="${val}" ${
        isChecked ? "checked" : ""
      }>${val}</label>`;
    });
    checkboxesHtml += "</div>";
    popover.innerHTML = checkboxesHtml;
    popover.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.addEventListener("change", () => this.updatePopoverFilter());
    });
    document.body.appendChild(popover); // bodyに直接追加
    const rect = btn.getBoundingClientRect();
    popover.style.top = `${rect.bottom + window.scrollY}px`;
    popover.style.left = `${rect.left + window.scrollX}px`;

    btn.classList.add("active");
    popover.classList.add("is-open");
    this.activePopover = { popover, btn, group: btn.parentElement };
  }

  closeActivePopover() {
    if (this.activePopover) {
      this.activePopover.btn.classList.remove("active");
      this.activePopover.popover.remove();
      this.activePopover = null;
    }
  }

  closePopoverOnClickOutside(event) {
    if (
      this.activePopover &&
      !this.activePopover.popover.contains(event.target) &&
      !this.activePopover.btn.contains(event.target)
    ) {
      this.closeActivePopover();
    }
  }
}

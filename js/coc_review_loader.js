// /js/coc_review_loader.js
document.addEventListener("DOMContentLoaded", () => {
  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=408928216&single=true&output=csv";
  const controlsContainer = document.getElementById("controls-container");
  const scenariosPlaceholder = document.getElementById(
    "scenario-list-placeholder"
  );
  let allScenarios = { played: [], unplayed: [] };
  let activePopover = null;

  // フィルターのデフォルト状態を定義
  const getDefaultFilters = () => ({
    players: [],
    difficulty: [],
    loss: [],
    hardship: [],
    charSpec: [],
    showUnplayed: true,
    showBeginner: true,
    showSecret: true,
    sort: "default",
  });

  let currentFilters = getDefaultFilters();

  function setupControls() {
    const filterControls = document.createElement("div");
    filterControls.className = "filter-controls";
    const sortGroup = document.createElement("div");
    sortGroup.className = "filter-group";
    sortGroup.innerHTML = `
            <label for="sort-select">並び替え・フィルター</label>
            <select id="sort-select">
               <option value="default">デフォルト</option>
               <option value="difficulty-desc">難易度 (高い順)</option><option value="difficulty-asc">難易度 (低い順)</option>
               <option value="loss-desc">ロスト率 (高い順)</option><option value="loss-asc">ロスト率 (低い順)</option>
               <option value="hardship-desc">しんどさ (高い順)</option><option value="hardship-asc">しんどさ (低い順)</option>
               <option value="players-desc">人数 (多い順)</option><option value="players-asc">人数 (少ない順)</option>
               <option value="days-desc">日数 (多い順)</option><option value="days-asc">日数 (少ない順)</option>
               <option value="charSpec-desc">キャラ指定度 (高い順)</option><option value="charSpec-asc">キャラ指定度 (低い順)</option>
            </select>`;
    filterControls.appendChild(sortGroup);
    const filterCategories = {
      players: "人数",
      difficulty: "難易度",
      loss: "ロスト率",
      hardship: "しんどさ",
      charSpec: "キャラ指定度",
    };
    for (const [key, label] of Object.entries(filterCategories)) {
      const group = document.createElement("div");
      group.className = "filter-group";
      group.innerHTML = `<button class="filter-trigger-btn" data-filter="${key}">${label}</button>`;
      filterControls.appendChild(group);
    }
    const displayFilterGroup = document.createElement("div");
    displayFilterGroup.className = "checkbox-filter-group";
    displayFilterGroup.innerHTML = `
           <label>表示シナリオ</label>
           <div class="checkboxes">
               <input type="checkbox" id="show-unplayed-toggle" value="unplayed"><label for="show-unplayed-toggle">未走</label>
               <input type="checkbox" id="show-beginner-toggle" value="beginner"><label for="show-beginner-toggle">スタダ</label>
               <input type="checkbox" id="show-secret-toggle" value="secret"><label for="show-secret-toggle">秘匿</label>
           </div>
       `;
    filterControls.appendChild(displayFilterGroup);
    controlsContainer.appendChild(filterControls);

    // イベントリスナーを設定
    document
      .getElementById("sort-select")
      .addEventListener("change", applyFiltersAndSort);
    document
      .getElementById("show-unplayed-toggle")
      .addEventListener("change", applyFiltersAndSort);
    document
      .getElementById("show-beginner-toggle")
      .addEventListener("change", applyFiltersAndSort);
    document
      .getElementById("show-secret-toggle")
      .addEventListener("change", applyFiltersAndSort);
    document
      .querySelectorAll(".filter-trigger-btn")
      .forEach((btn) => btn.addEventListener("click", togglePopover));
    document.addEventListener("click", closePopoverOnClickOutside);
  }

  function loadFiltersFromLocalStorage() {
    try {
      const savedFilters = JSON.parse(localStorage.getItem("cocReviewFilters"));
      if (savedFilters) {
        // 保存されたフィルターとデフォルトをマージして、新しいキーに対応
        currentFilters = { ...getDefaultFilters(), ...savedFilters };
      }
    } catch (e) {
      console.error("Failed to load filters from localStorage", e);
      currentFilters = getDefaultFilters();
    }
    // UIの状態を復元
    document.getElementById("sort-select").value = currentFilters.sort;
    document.getElementById("show-unplayed-toggle").checked =
      currentFilters.showUnplayed;
    document.getElementById("show-beginner-toggle").checked =
      currentFilters.showBeginner;
    document.getElementById("show-secret-toggle").checked =
      currentFilters.showSecret;
  }

  function saveFiltersToLocalStorage() {
    try {
      localStorage.setItem("cocReviewFilters", JSON.stringify(currentFilters));
    } catch (e) {
      console.error("Failed to save filters to localStorage", e);
    }
  }

  function togglePopover(event) {
    event.stopPropagation();
    const btn = event.currentTarget;
    const group = btn.parentElement;
    const filterType = btn.dataset.filter;
    if (activePopover && activePopover.btn === btn) {
      closeActivePopover();
      return;
    }
    closeActivePopover();
    const popover = document.createElement("div");
    popover.className = "popover-container";
    popover.id = `${filterType}-popover`;
    let checkboxesHtml = '<div class="checkboxes">';

    const savedFilterValues = currentFilters[filterType] || [];
    const createCheckbox = (val, text) => {
      // 保存された値がない場合は全選択、ある場合はその値に基づいてチェック状態を決定
      const isChecked =
        savedFilterValues.length === 0 ||
        savedFilterValues.includes(String(val));
      return `<input type="checkbox" id="popover-${filterType}-${val}" value="${val}" ${
        isChecked ? "checked" : ""
      }><label for="popover-${filterType}-${val}">${text}</label>`;
    };

    if (filterType === "players") {
      ["1", "2", "3", "4", "5", "free"].forEach((val) => {
        const text =
          val === "free" ? "自由" : val === "5" ? "5人以上" : `${val}人`;
        checkboxesHtml += createCheckbox(val, text);
      });
    } else {
      ["1", "2", "3", "4", "5", "6"].forEach((val) => {
        checkboxesHtml += createCheckbox(val, `★${val}`);
      });
      checkboxesHtml += createCheckbox("?", "★?");
      if (filterType === "charSpec") {
        checkboxesHtml += createCheckbox("-", "★-");
        checkboxesHtml += createCheckbox("継続", "継続");
      }
    }
    checkboxesHtml += "</div>";
    popover.innerHTML = checkboxesHtml;
    popover.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", applyFiltersAndSort);
    });
    group.appendChild(popover);
    btn.classList.add("active");
    popover.classList.add("is-open");
    activePopover = { popover, btn, group };
  }

  function closeActivePopover() {
    if (activePopover) {
      activePopover.btn.classList.remove("active");
      activePopover.popover.remove();
      activePopover = null;
    }
  }

  function closePopoverOnClickOutside(event) {
    if (activePopover && !activePopover.group.contains(event.target)) {
      closeActivePopover();
    }
  }

  function applyFiltersAndSort() {
    // 現在のUIの状態からcurrentFiltersオブジェクトを更新
    currentFilters.sort = document.getElementById("sort-select").value;
    currentFilters.showUnplayed = document.getElementById(
      "show-unplayed-toggle"
    ).checked;
    currentFilters.showBeginner = document.getElementById(
      "show-beginner-toggle"
    ).checked;
    currentFilters.showSecret =
      document.getElementById("show-secret-toggle").checked;

    const filterCategories = [
      "players",
      "difficulty",
      "loss",
      "hardship",
      "charSpec",
    ];
    filterCategories.forEach((key) => {
      const popover = document.getElementById(`${key}-popover`);
      if (popover) {
        const checkedInputs = popover.querySelectorAll("input:checked");
        const allInputs = popover.querySelectorAll("input");
        // 全チェックか全未チェックの場合、フィルターを空（=全適用）にする
        if (
          checkedInputs.length === 0 ||
          checkedInputs.length === allInputs.length
        ) {
          currentFilters[key] = [];
        } else {
          currentFilters[key] = Array.from(checkedInputs).map((cb) => cb.value);
        }
      }
    });

    saveFiltersToLocalStorage();

    const checkRating = (filter, reviewValue, key) => {
      if (!filter || filter.length === 0) return true;
      if (key === "charSpec") {
        return filter.includes(reviewValue);
      }
      const valueStr = reviewValue ? reviewValue.replace("★", "") : "";
      return filter.includes(valueStr);
    };

    const filterFunction = (s) => {
      // 表示フィルター
      let isDisplayed = false;
      if (currentFilters.showUnplayed && s.isUnplayed) isDisplayed = true;
      if (currentFilters.showBeginner && s.isBeginner) isDisplayed = true;
      if (currentFilters.showSecret && s.isSecret) isDisplayed = true;
      // 通常シナリオの表示判定
      if (!s.isUnplayed && !s.isBeginner && !s.isSecret) {
        isDisplayed = true;
      }
      if (!isDisplayed) return false;

      // 項目別フィルター
      if (currentFilters.players.length > 0) {
        let match = currentFilters.players.some((filterVal) => {
          if (filterVal === "free" && s.players.isFree) return true;
          const num = parseInt(filterVal, 10);
          if (num === 5 && s.players.min >= 5) return true;
          if (s.players.min <= num && s.players.max >= num) return true;
          return false;
        });
        if (!match) return false;
      }

      const firstReview = s.reviews[0];
      if (!firstReview) return true;

      if (
        !checkRating(
          currentFilters.difficulty,
          firstReview.difficulty,
          "difficulty"
        )
      )
        return false;
      if (!checkRating(currentFilters.loss, firstReview.lossRate, "loss"))
        return false;
      if (
        !checkRating(currentFilters.hardship, firstReview.hardship, "hardship")
      )
        return false;
      if (
        !checkRating(currentFilters.charSpec, firstReview.charSpec, "charSpec")
      )
        return false;

      return true;
    };

    const allFiltered = [
      ...allScenarios.played,
      ...allScenarios.unplayed,
    ].filter(filterFunction);

    if (currentFilters.sort !== "default") {
      const [key, order] = currentFilters.sort.split("-");
      const sortKeyMap = {
        difficulty: "difficulty",
        loss: "lossRate",
        hardship: "hardship",
        charSpec: "charSpec",
        players: "players",
        days: "days",
      };
      const sortKey = sortKeyMap[key];

      allFiltered.sort((a, b) => {
        let valA, valB;
        if (key === "players") {
          valA = a.players.min;
          valB = b.players.min;
        } else if (key === "days") {
          valA = a.days.min;
          valB = b.days.min;
        } else {
          const reviewA = a.reviews.length > 0 ? a.reviews[0][sortKey] : "0";
          const reviewB = b.reviews.length > 0 ? b.reviews[0][sortKey] : "0";
          valA = getStarValue(reviewA);
          valB = getStarValue(reviewB);
        }
        return order === "asc" ? valA - valB : valB - valA;
      });
    }

    const filteredPlayed = allFiltered.filter((s) => !s.isUnplayed);
    const filteredUnplayed = allFiltered.filter((s) => s.isUnplayed);

    renderCards(filteredPlayed, filteredUnplayed);
  }

  function renderCards(played, unplayed) {
    if (played.length === 0 && unplayed.length === 0) {
      scenariosPlaceholder.innerHTML = `<div class="no-scenarios-message">該当するシナリオはありません。</div>`;
      return;
    }
    let playedHtml =
      played.length > 0
        ? '<h2 class="section-title">シナリオレビュー</h2>' +
          played.map(createScenarioCard).join("")
        : "";
    let unplayedHtml =
      unplayed.length > 0
        ? '<h2 class="section-title">レビューのみ（未走）</h2>' +
          unplayed.map(createScenarioCard).join("")
        : "";
    scenariosPlaceholder.innerHTML = playedHtml + unplayedHtml;
    document
      .querySelectorAll(".scenario-card")
      .forEach((card, index) =>
        setTimeout(() => card.classList.add("visible"), index * 50)
      );
  }

  function createScenarioCard(scenario) {
    let {
      name,
      urlAuthor,
      isSecret,
      isBeginner,
      isUnplayed,
      reviews,
      players,
      days,
      experience,
      omoro,
      comment,
    } = scenario;
    const cardClasses = `scenario-card ${isSecret ? "secret-scenario" : ""}`;
    let marksHtml = "";
    if (isBeginner)
      marksHtml += `<span class="scenario-mark beginner-mark"><img src="img/icon.png" alt="スタダ"> スタダ</span>`;
    if (isUnplayed)
      marksHtml += `<span class="scenario-mark unplayed-mark">未走</span>`;
    const titleHtml = urlAuthor.startsWith("http")
      ? `<a href="${urlAuthor}" target="_blank" rel="noopener noreferrer">${name}</a>`
      : name;
    const authorHtml =
      urlAuthor && !urlAuthor.startsWith("http") && urlAuthor !== "(URL参照)"
        ? `<div class="author">${urlAuthor}</div>`
        : urlAuthor.startsWith("http")
        ? `<div class="author">URL: <a href="${urlAuthor}" target="_blank" rel="noopener noreferrer">${urlAuthor}</a></div>`
        : `<div class="author">作者不明</div>`;
    let reviewsHtml = reviews
      .map((review) => {
        let blockHtml = `<div class="review-block">`;
        if (review.recorder)
          blockHtml += `<div class="recorder">${review.recorder} のレビュー</div>`;
        blockHtml += '<div class="scenario-stats">';
        const stats = {
          難易度: review.difficulty,
          ロスト率: review.lossRate,
          しんどさ: review.hardship,
          キャラ指定度: review.charSpec,
        };
        for (const [label, value] of Object.entries(stats)) {
          if (value) {
            const ratingClass =
              label !== "キャラ指定度" ? getRatingClass(value) : "";
            blockHtml += `<div class="stat-item ${ratingClass}"><span class="label">${label}</span><span class="value">${value}</span></div>`;
          }
        }
        return blockHtml + "</div></div>";
      })
      .join("");
    const playerStatsHtml = `<div class="scenario-stats">
            <div class="stat-item"><span class="label">人数</span><span class="value">${
              scenario["人数"]
            }</span></div>
            <div class="stat-item ${getDaysClass(
              days
            )}"><span class="label">日数</span><span class="value">${
      scenario["日数"]
    }</span></div>
        </div>`;
    let experienceHtml = "";
    if (experience.gm.length > 0 || experience.pl.length > 0) {
      experienceHtml += `<details class="experience-details"><summary>経験者リスト</summary><div class="experience-list">`;
      if (experience.gm.length > 0)
        experienceHtml += `<p><span class="label">GM:</span> ${experience.gm.join(
          "、 "
        )}</p>`;
      if (experience.pl.length > 0)
        experienceHtml += `<p><span class="label">PL:</span> ${experience.pl.join(
          "、 "
        )}</p>`;
      experienceHtml += "</div></details>";
    }
    let detailsHtml = '<div class="scenario-details">';
    if (omoro)
      detailsHtml += `<div class="scenario-comment-block"><h3><i class="fa-solid fa-star"></i>オモロポイント</h3><p>${omoro}</p></div>`;
    if (comment)
      detailsHtml += `<div class="scenario-comment-block"><h3><i class="fa-solid fa-comment-dots"></i>コメント</h3><p>${comment}</p></div>`;
    if (experienceHtml) detailsHtml += experienceHtml;
    detailsHtml += "</div>";
    return `
            <div class="${cardClasses}">
                ${
                  isSecret
                    ? '<div class="secret-ribbon"><span>秘匿</span></div>'
                    : ""
                }
                <div class="scenario-card-header">
                    <h2>${titleHtml}</h2>
                    <div class="marks-container">${marksHtml}</div>
                </div>
                ${authorHtml}
                <div class="player-stats">${playerStatsHtml}</div>
                <hr style="border-color: var(--coc-border-color); border-style: dashed; margin: 10px 0;">
                ${reviewsHtml}
                ${detailsHtml}
            </div>`;
  }

  function parseCsvAndPreprocess(csvText) {
    const results = Papa.parse(csvText, {
      header: false, // ヘッダーは手動で処理
      skipEmptyLines: true,
    });

    const lines = results.data;
    if (lines.length < 2) return { played: [], unplayed: [] };

    const headers = lines[0];
    const scenarios = { played: [], unplayed: [] };
    let currentSection = "played";

    // ヘッダーのインデックスを事前に取得
    const getHeaderIndex = (headerName) => headers.indexOf(headerName);

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (!row || row.length < headers.length || row.every((cell) => !cell)) {
        continue;
      }

      // 未走セクションの開始を検出
      if (row[getHeaderIndex("シナリオ名")] === "シナリオ名") {
        currentSection = "unplayed";
        continue;
      }

      // シナリオ名がない行はスキップ
      if (!row[getHeaderIndex("シナリオ名")]) {
        continue;
      }

      const obj = {};
      headers.forEach((header, j) => {
        obj[header] = (row[j] || "").trim();
      });

      // レビューがないものはスキップ
      const hasReview =
        (obj["難易度"] && obj["難易度"].includes("★")) ||
        (obj["難(2人目)"] && obj["難(2人目)"].includes("★"));
      if (!hasReview) {
        continue;
      }

      const scenarioData = {
        name: obj["シナリオ名"],
        urlAuthor: obj["URL/作者"],
        isSecret: obj["秘匿"] === "TRUE",
        isBeginner: (obj["ジャンルワード"] || "").includes("スタダ"),
        isUnplayed: currentSection === "unplayed",
        人数: obj["人数"],
        日数: obj["日数"],
        reviews: [],
        experience: {
          gm: [
            ...new Set([
              ...(obj["GM経験者（此処）"] || "")
                .split(/[、,]/g)
                .map((s) => s.trim())
                .filter(Boolean),
              ...(obj["GM経験者（外）"] || "")
                .split(/[、,]/g)
                .map((s) => s.trim())
                .filter(Boolean),
            ]),
          ],
          pl: [
            ...new Set([
              ...(obj["PL経験者（此処）"] || "")
                .split(/[、,]/g)
                .map((s) => s.trim())
                .filter(Boolean),
              ...(obj["PL経験者（外）"] || "")
                .split(/[、,]/g)
                .map((s) => s.trim())
                .filter(Boolean),
            ]),
          ],
        },
        omoro: obj["オモロポイント（皆で書こ）"],
        comment: obj["その他（あるいはコメント欄）"],
      };

      const pStr = obj["人数"].replace("人", "");
      const p = pStr.split(/[-～]/);
      scenarioData.players = {
        min: parseInt(p[0]) || 0,
        max: parseInt(p[1] || p[0]) || 99,
        isFree: pStr === "自由",
      };

      const dStr = obj["日数"].replace("日", "");
      const d = dStr.split(/[-～]/);
      scenarioData.days = {
        min: parseInt(d[0]) || 0,
        max: parseInt(d[1] || d[0]) || 99,
      };

      for (let k = 1; k <= 3; k++) {
        const suffix = k === 1 ? "" : `(${k}人目)`;
        const difficulty = obj[`難易度${suffix}`] || obj[`難${suffix}`];
        if (difficulty && difficulty.includes("★")) {
          scenarioData.reviews.push({
            difficulty,
            lossRate: obj[`ﾛｽﾄ率${suffix}`] || obj[`ﾛｽﾄ${suffix}`],
            hardship: obj[`しんどさ${suffix}`] || obj[`しんど${suffix}`],
            charSpec: obj[`ｷｬﾗ指定度${suffix}`] || obj[`ｷｬﾗ${suffix}`],
            recorder: obj[`記録者${suffix}`] || obj[`記録者`],
          });
        }
      }
      scenarios[currentSection].push(scenarioData);
    }
    return scenarios;
  }

  const getRatingClass = (value) => {
    if (!value || !value.includes("★")) return "";
    const match = value.match(/★(\d+)/);
    return match ? `rating-${match[1]}` : "";
  };
  const getStarValue = (str) => {
    if (!str) return 0;
    if (str === "継続") return 7; // ソートで一番上に来るように仮の値を設定
    if (str.startsWith("★?")) return -1; // 不明は下に
    if (str === "★-") return 0;
    const match = str.match(/★(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };
  const getDaysClass = (days) => {
    if (!days || !days.min) return "";
    if (days.max <= 2) return "days-short";
    if (days.max <= 5) return "days-medium";
    return "days-long";
  };

  async function init() {
    try {
      const response = await fetch(CSV_URL);
      if (!response.ok)
        throw new Error(`Network response was not ok: ${response.statusText}`);
      const csvText = await response.text();
      allScenarios = parseCsvAndPreprocess(csvText);
      setupControls();
      loadFiltersFromLocalStorage(); // フィルター状態をロード
      applyFiltersAndSort(); // ロードしたフィルターを適用して初期表示
    } catch (error) {
      console.error("Error initializing the page:", error);
      scenariosPlaceholder.innerHTML = `<p>データの読み込みに失敗しました。管理者にご連絡ください。<br>エラー: ${error.message}</p>`;
    }
  }
  init();
});

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
    const unplayedFilterGroup = document.createElement("div");
    unplayedFilterGroup.className = "switch-filter-group";
    unplayedFilterGroup.innerHTML = `
            <label for="show-unplayed-toggle">「未走」シナリオを表示</label>
            <input type="checkbox" id="show-unplayed-toggle" class="switch" checked>
        `;
    filterControls.appendChild(unplayedFilterGroup);
    controlsContainer.appendChild(filterControls);
    document
      .getElementById("sort-select")
      .addEventListener("change", applyFiltersAndSort);
    document
      .getElementById("show-unplayed-toggle")
      .addEventListener("change", applyFiltersAndSort);
    document
      .querySelectorAll(".filter-trigger-btn")
      .forEach((btn) => btn.addEventListener("click", togglePopover));
    document.addEventListener("click", closePopoverOnClickOutside);
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
    if (filterType === "players") {
      ["1", "2", "3", "4", "5", "free"].forEach((val) => {
        const text =
          val === "free" ? "自由" : val === "5" ? "5人以上" : `${val}人`;
        checkboxesHtml += `<input type="checkbox" id="popover-${filterType}-${val}" value="${val}" checked><label for="popover-${filterType}-${val}">${text}</label>`;
      });
    } else {
      ["1", "2", "3", "4", "5", "6"].forEach((val) => {
        checkboxesHtml += `<input type="checkbox" id="popover-${filterType}-${val}" value="${val}" checked><label for="popover-${filterType}-${val}">★${val}</label>`;
      });
      checkboxesHtml += `<input type="checkbox" id="popover-${filterType}-q" value="?" checked><label for="popover-${filterType}-q">★?</label>`;
      if (filterType === "charSpec") {
        checkboxesHtml += `<input type="checkbox" id="popover-${filterType}-minus" value="-" checked><label for="popover-${filterType}-minus">★-</label>`;
        checkboxesHtml += `<input type="checkbox" id="popover-${filterType}-cont" value="継続" checked><label for="popover-${filterType}-cont">継続</label>`;
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
    const getCheckedValues = (key) => {
      const popover = document.getElementById(`${key}-popover`);
      if (!popover) return null;
      return Array.from(popover.querySelectorAll("input:checked")).map(
        (cb) => cb.value
      );
    };
    const sortValue = document.getElementById("sort-select").value;
    const showUnplayed = document.getElementById(
      "show-unplayed-toggle"
    ).checked;
    const playersFilter = getCheckedValues("players");
    const difficultyFilter = getCheckedValues("difficulty");
    const lossFilter = getCheckedValues("loss");
    const hardshipFilter = getCheckedValues("hardship");
    const charSpecFilter = getCheckedValues("charSpec");
    const filterFunction = (s) => {
      if (playersFilter) {
        let match = playersFilter.some((filterVal) => {
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
      const checkRating = (filter, reviewValue) => {
        if (!filter) return true;
        const valueStr = reviewValue.replace("★", "");
        return filter.includes(valueStr);
      };
      if (
        difficultyFilter &&
        !checkRating(difficultyFilter, firstReview.difficulty)
      )
        return false;
      if (lossFilter && !checkRating(lossFilter, firstReview.lossRate))
        return false;
      if (hardshipFilter && !checkRating(hardshipFilter, firstReview.hardship))
        return false;
      if (charSpecFilter && !checkRating(charSpecFilter, firstReview.charSpec))
        return false;
      return true;
    };
    let filteredPlayed = allScenarios.played.filter(filterFunction);
    let filteredUnplayed = showUnplayed
      ? allScenarios.unplayed.filter(filterFunction)
      : [];
    if (sortValue !== "default") {
      const [key, order] = sortValue.split("-");
      const sortKeyMap = {
        difficulty: "difficulty",
        loss: "lossRate",
        hardship: "hardship",
      };
      const sortKey = sortKeyMap[key];
      const sortFunction = (a, b) => {
        const valA = getStarValue(
          a.reviews.length > 0 ? a.reviews[0][sortKey] : "0"
        );
        const valB = getStarValue(
          b.reviews.length > 0 ? b.reviews[0][sortKey] : "0"
        );
        return order === "asc" ? valA - valB : valB - valA;
      };
      filteredPlayed.sort(sortFunction);
      filteredUnplayed.sort(sortFunction);
    }
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

  function robustParseCsv(csvText) {
    const text = csvText.trim().replace(/\r\n|\r/g, "\n");
    const lines = [];
    let fields = [];
    let currentField = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < text.length && text[i + 1] === '"') {
            currentField += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ",") {
          fields.push(currentField);
          currentField = "";
        } else if (char === "\n") {
          fields.push(currentField);
          lines.push(fields);
          fields = [];
          currentField = "";
        } else {
          currentField += char;
        }
      }
    }
    if (fields.length > 0 || currentField) {
      fields.push(currentField);
      lines.push(fields);
    }
    return lines;
  }

  function parseCsvAndPreprocess(csvText) {
    const lines = robustParseCsv(csvText);
    if (lines.length < 2) return { played: [], unplayed: [] };
    const headers = lines[0];
    const scenarios = { played: [], unplayed: [] };
    let currentSection = "played";
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (!row || row.length < headers.length || row.every((cell) => !cell))
        continue;
      if (row[1] === "シナリオ名") {
        currentSection = "unplayed";
        continue;
      }
      if (!row[1]) continue;
      const obj = {};
      headers.forEach((header, j) => (obj[header] = (row[j] || "").trim()));
      const hasReview =
        (obj["難易度"] && obj["難易度"].includes("★")) ||
        (obj["難(2人目)"] && obj["難(2人目)"].includes("★"));
      if (!hasReview) continue;
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
      applyFiltersAndSort();
    } catch (error) {
      console.error("Error initializing the page:", error);
      scenariosPlaceholder.innerHTML = `<p>データの読み込みに失敗しました。管理者にご連絡ください。<br>エラー: ${error.message}</p>`;
    }
  }
  init();
});

// /js/recruitment.js (最終完成版)
document.addEventListener("DOMContentLoaded", () => {
  const GAS_WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbydDtPK6ui1W4cHcy5GMEfkV_yW61rUo8Puu79C7fzdkupwZaz9583Fi1u7FJWtKXh1Pw/exec";
  const SPREADSHEET_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=203728295&single=true&output=csv";

  const listContainer = document.getElementById("recruitment-list");
  const userControlContainer = document.getElementById(
    "user-control-container"
  );

  let allScenarios = [];
  let currentUser = localStorage.getItem("recruitmentUserName") || "";

  function getSystemColor(systemName) {
    const rootStyle = getComputedStyle(document.documentElement);
    const systemMap = {
      CoC: "--color-coc",
      "CoC-㊙": "--color-coc-secret",
      "SW2.5": "--color-sw",
      DX3: "--color-dx3",
      ネクロニカ: "--color-nechronica",
      サタスペ: "--color-satasupe",
      マモブル: "--color-mamoburu",
      銀剣: "--color-stellar",
    };
    for (const key in systemMap) {
      if (systemName.startsWith(key))
        return rootStyle.getPropertyValue(systemMap[key]).trim();
    }
    return rootStyle.getPropertyValue("--color-default").trim();
  }

  function createParticipantTags(
    participantString,
    className = "",
    title = ""
  ) {
    if (!participantString || participantString.trim() === "") return "";
    return participantString
      .split(/[,、]/)
      .map((name) => name.trim())
      .filter((name) => name)
      .map(
        (name) =>
          `<span class="participant-tag ${className}" title="${title}">${name}</span>`
      )
      .join("");
  }

  function formatUnit(value, unit) {
    if (!value || value.trim() === "") return "不定";
    const trimmedValue = value.trim();
    return /^[0-9-～〜?]+$/.test(trimmedValue)
      ? `${trimmedValue}${unit}`
      : trimmedValue;
  }

  function createScenarioCard(scenario) {
    const card = document.createElement("div");
    card.className = `recruitment-card ${
      scenario.status === "システム" ? "is-collapsed" : ""
    }`;
    card.style.borderColor = getSystemColor(scenario.system);
    card.dataset.scenarioName = scenario.name;

    const titleHtml = scenario.url.startsWith("http")
      ? `<a href="${scenario.url}" target="_blank" rel="noopener noreferrer">${scenario.name}</a>`
      : scenario.name;

    let authorHtml;
    try {
      if (scenario.author.startsWith("http")) {
        const url = new URL(scenario.author);
        authorHtml = `<a href="${scenario.author}" target="_blank" rel="noopener noreferrer">${url.hostname}</a>`;
      } else {
        authorHtml = scenario.author;
      }
    } catch (e) {
      authorHtml = scenario.author;
    }

    const gmHtml = createParticipantTags(scenario.gm, "gm", "GM (KP)");
    const interestedHtml = createParticipantTags(
      scenario.interested,
      "interested",
      "興味あり"
    );
    const committedHtml = createParticipantTags(
      scenario.committed,
      "committed",
      "参加確定"
    );
    const playedHtml = createParticipantTags(
      scenario.played,
      "played",
      "経験者"
    );

    const allParticipants =
      `${scenario.gm},${scenario.committed},${scenario.played}`
        .split(/[,、]/)
        .map((s) => s.trim())
        .filter(Boolean);
    const interestedUsers = `${scenario.interested}`
      .split(/[,、]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const isAlreadyParticipant = allParticipants.includes(currentUser);
    const isAlreadyInterested = interestedUsers.includes(currentUser);

    let buttonText = "興味あり！";
    let buttonDisabled = !currentUser;
    if (isAlreadyParticipant) {
      buttonText = "参加確定済または経験者です";
      buttonDisabled = true;
    } else if (isAlreadyInterested) {
      buttonText = "興味あり！(登録済)";
      buttonDisabled = true;
    }

    card.innerHTML = `
        <div class="card-header">
            <h3 class="scenario-title">${titleHtml}</h3>
            <span class="status-badge" data-status="${scenario.status}">${
      scenario.status
    }<i class="fa-solid fa-chevron-down card-toggle-icon"></i></span>
        </div>
        <div class="card-stats">
            <div class="stat-item"><i class="fa-solid fa-dice-d20"></i><span class="value system-tag" style="background-color:${getSystemColor(
              scenario.system
            )}">${scenario.system}</span></div>
            <div class="stat-item"><i class="fa-solid fa-user-pen"></i><span class="value">${authorHtml}</span></div>
            <div class="stat-item"><i class="fa-solid fa-users"></i><span class="value">${formatUnit(
              scenario.players,
              "人"
            )}</span></div>
            <div class="stat-item"><i class="fa-solid fa-calendar-days"></i><span class="value">${formatUnit(
              scenario.days,
              "日"
            )}</span></div>
        </div>
        <div class="card-collapsible-body">
            <div class="participants-groups">
                ${
                  gmHtml
                    ? `<dl class="participants-group"><dt>GM：</dt><dd>${gmHtml}</dd></dl>`
                    : ""
                }
                ${
                  interestedHtml || committedHtml
                    ? `<dl class="participants-group"><dt>希望者：</dt><dd>${interestedHtml} ${committedHtml}</dd></dl>`
                    : ""
                }
                ${
                  playedHtml
                    ? `<dl class="participants-group"><dt>経験者：</dt><dd>${playedHtml}</dd></dl>`
                    : ""
                }
            </div>
            ${
              scenario.notes
                ? `<div class="notes"><strong>備考:</strong><p>${scenario.notes.replace(
                    /\n/g,
                    "<br>"
                  )}</p></div>`
                : ""
            }
            <div class="card-actions">
                <button class="interest-button ${
                  isAlreadyInterested ? "added" : ""
                }" data-scenario-name="${scenario.name}" ${
      buttonDisabled ? "disabled" : ""
    }>
                    <i class="fa-solid fa-star"></i>
                    <span>${buttonText}</span>
                </button>
            </div>
        </div>`;
    return card;
  }

  function createNameSelector(allNames) {
    const uniqueNames = [...new Set(allNames)].sort();
    let optionsHtml = '<option value="">---あなたの名前---</option>';
    uniqueNames.forEach((name) => {
      optionsHtml += `<option value="${name}" ${
        currentUser === name ? "selected" : ""
      }>${name}</option>`;
    });
    return `
        <div class="filter-group name-selector-group">
            <label for="name-selector"><i class="fa-solid fa-user-check"></i> あなたの名前:</label>
            <select id="name-selector">${optionsHtml}</select>
        </div>`;
  }

  function customParticipationFilter(data, filters) {
    const participationFilters = filters.participationStatus || [];
    // ▼▼▼ 参加状況フィルターが１つもチェックされていない場合は、絞り込みを行わない ▼▼▼
    if (participationFilters.length === 0 || !currentUser) {
      return data;
    }
    return data.filter((scenario) => {
      const isGM = scenario.gm
        .split(/[,、]/)
        .map((s) => s.trim())
        .includes(currentUser);
      const isPlayed = scenario.played
        .split(/[,、]/)
        .map((s) => s.trim())
        .includes(currentUser);
      const isInterested = scenario.interested
        .split(/[,、]/)
        .map((s) => s.trim())
        .includes(currentUser);
      const isCommitted = scenario.committed
        .split(/[,、]/)
        .map((s) => s.trim())
        .includes(currentUser);
      const isParticipant = isGM || isPlayed || isCommitted || isInterested;

      return participationFilters.some((filter) => {
        if (filter === "未参加") return !isParticipant;
        if (filter === "GM") return isGM;
        if (filter === "経験者") return isPlayed;
        return false;
      });
    });
  }

  function displayScenarios(scenarios) {
    const collapsedStates = new Map();
    document.querySelectorAll(".recruitment-card").forEach((card) => {
      if (card.dataset.scenarioName) {
        collapsedStates.set(
          card.dataset.scenarioName,
          card.classList.contains("is-collapsed")
        );
      }
    });

    listContainer.innerHTML = "";
    if (scenarios.length === 0) {
      listContainer.innerHTML =
        "<p class='loading-message'>該当するシナリオはありません。</p>";
      return;
    }
    scenarios.forEach((scenario) => {
      const card = createScenarioCard(scenario);
      if (collapsedStates.get(scenario.name)) {
        card.classList.add("is-collapsed");
      }
      listContainer.appendChild(card);
    });
  }

  async function handleInterestClick(button) {
    if (!currentUser) {
      alert("先に参加者名を選択してください。");
      return;
    }
    const scenarioName = button.dataset.scenarioName;
    const icon = button.querySelector("i");
    const originalText = button.querySelector("span").textContent;

    button.disabled = true;
    button.querySelector("span").textContent = "送信中...";
    icon.classList.remove("fa-star");
    icon.classList.add("spinner");

    try {
      // ▼▼▼ 送信方法をJSON形式に統一 ▼▼▼
      const response = await fetch(GAS_WEB_APP_URL, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenarioName: scenarioName,
          userName: currentUser,
        }),
      });

      if (!response.ok) {
        throw new Error(`サーバーエラー: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === "success") {
        button.querySelector("span").textContent = "登録完了！";
        button.classList.add("added");

        const targetScenario = allScenarios.find(
          (s) => s.name === scenarioName
        );
        if (targetScenario) {
          targetScenario.interested = targetScenario.interested
            ? `${targetScenario.interested},${currentUser}`
            : currentUser;
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("送信に失敗:", error);
      alert(`エラーが発生しました: ${error.message}`);
      button.querySelector("span").textContent = originalText;
      button.disabled = false;
    } finally {
      icon.classList.remove("spinner");
      icon.classList.add("fa-star");
    }
  }

  async function init() {
    try {
      const response = await fetch(SPREADSHEET_URL);
      const csvText = await response.text();
      const results = Papa.parse(csvText, { skipEmptyLines: true }).data;
      const headerRowIndex = results.findIndex((row) =>
        row.includes("シナリオ名")
      );
      if (headerRowIndex === -1) throw new Error("Header row not found");
      const header = results[headerRowIndex];
      const dataRows = results.slice(headerRowIndex + 1);
      const getIndex = (colName) => header.indexOf(colName);

      const allNames = [];
      allScenarios = dataRows
        .map((row) => {
          const interested = row[getIndex("興味あり者")] || "";
          const committed = row[getIndex("成約済者")] || "";
          const played = row[getIndex("済み者")] || "";
          const gm = row[getIndex("GM")] || "";
          [interested, committed, played, gm].forEach((p) => {
            p.split(/[,、]/)
              .map((n) => n.trim())
              .filter(Boolean)
              .forEach((name) => allNames.push(name));
          });
          return {
            name: row[getIndex("シナリオ名")] || "名称未設定",
            status:
              (row[getIndex("現状")] || "情報なし") === "情報なし"
                ? "未記入"
                : row[getIndex("現状")],
            system: (row[getIndex("システム")] || "不明").replace(
              "ｻﾀｽﾍ゚",
              "サタスペ"
            ),
            author: row[getIndex("URL/作者")] || "不明",
            url: row[getIndex("URL/作者")] || "",
            players: row[getIndex("人数")] || "不定",
            days: row[getIndex("日数")] || "不定",
            notes: row[getIndex("備考")] || "",
            gm,
            interested,
            committed,
            played,
          };
        })
        .filter((s) => s.name !== "例1" && s.name !== "例2" && s.name);

      const filterConfig = {
        nameSelectorHtml: createNameSelector(allNames),
        searchKey: "name",
        searchLabel: "シナリオ名検索",
        popoverFilters: {
          system: {
            label: "システム",
            values: [...new Set(allScenarios.map((s) => s.system))].sort(),
          },
        },
        toggleFilters: {
          status: {
            label: "ステータス",
            values: [
              "募集中",
              "まって！",
              "要相談",
              "周回可能",
              "停止中",
              "システム",
              "未記入",
            ],
            defaultAll: true,
          },
          participationStatus: {
            label: "あなたの参加状況で絞り込み",
            values: ["未参加", "GM", "経験者"],
            defaultAll: false, // ★★★ デフォルトではチェックしない
          },
        },
      };

      window.filterableList = new FilterableList(
        "recruitment-list",
        "controls-container",
        allScenarios,
        filterConfig,
        displayScenarios,
        customParticipationFilter
      );

      document
        .getElementById("name-selector")
        .addEventListener("change", (e) => {
          currentUser = e.target.value;
          localStorage.setItem("recruitmentUserName", currentUser);
          window.filterableList.applyFiltersAndSort();
        });

      listContainer.addEventListener("click", (event) => {
        const header = event.target.closest(".card-header");
        const button = event.target.closest(".interest-button");
        if (button) {
          event.preventDefault();
          handleInterestClick(button);
        } else if (header) {
          if (event.target.closest("a")) return;
          header.closest(".recruitment-card").classList.toggle("is-collapsed");
        }
      });
    } catch (error) {
      console.error("Error initializing the page:", error);
      listContainer.innerHTML = `<p class='loading-message'>データの読み込みに失敗しました: ${error.message}</p>`;
    }
  }

  init();
});

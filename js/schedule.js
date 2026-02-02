// ==========================================================================
//   SCHEDULE.JS - 表示崩壊バグ・データ不整合 完全修正版
// ==========================================================================

// --- グローバル設定と共通ヘルパー関数 ---
const SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=783716063&single=true&output=csv";
const ARCHIVE_CSV_URL = "archive.csv"; // 追加: archive.csvのパス
const DAYCORD_PROXY_URL =
  "https://api.allorigins.win/raw?url=" +
  encodeURIComponent(
    "https://character-sheets.appspot.com/schedule/list?key=ahVzfmNoYXJhY3Rlci1zaGVldHMtbXByHAsSEkRpc2NvcmRTZXNzaW9uRGF0YRimu5y4BQw",
  );
const PRESETS_JSON_URL = "presets.json";

const NAME_ALIASES = {
  vara: "☭",
  くれいど: "qre1d/くれいど",
  viw: "ゔぃｗ",
  yotchi: "よっち",
};

function parseCsvToArray(csvText) {
  const results = Papa.parse(csvText, {
    header: false, // ヘッダーは手動で処理
    skipEmptyLines: true,
  });
  return results.data;
}
function isNextDay(d1, d2) {
  const n = new Date(d1);
  n.setDate(n.getDate() + 1);
  return (
    n.getFullYear() === d2.getFullYear() &&
    n.getMonth() === d2.getMonth() &&
    n.getDate() === d2.getDate()
  );
}
function getSunday(d) {
  const n = new Date(d);
  n.setDate(n.getDate() - n.getDay());
  n.setHours(0, 0, 0, 0);
  return n;
}
function formatDate(d) {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}/${String(d.getDate()).padStart(2, "0")}`;
}
function formatPeriod(start, end) {
  const s = {
      y: start.getFullYear(),
      m: start.getMonth() + 1,
      d: start.getDate(),
    },
    e = { y: end.getFullYear(), m: end.getMonth() + 1, d: end.getDate() };
  const sStr = `${s.y}/${s.m}/${s.d}`;
  if (s.y === e.y && s.m === e.m && s.d === e.d) return sStr;
  if (s.y === e.y && s.m === e.m) return `${s.y}/${s.m}/${s.d}-${e.d}`;
  if (s.y === e.y) return `${s.y}/${s.m}/${s.d} - ${e.m}/${e.d}`;
  return `${s.y}/${s.m}/${s.d} - ${e.y}/${e.m}/${e.d}`;
}
const formatShortDate = (fullDate) =>
  fullDate.length > 5 ? fullDate.substring(5) : fullDate;
function areArraysEqual(a1, a2) {
  if (!a1 && !a2) return true;
  if (!a1 || !a2 || a1.length !== a2.length) return false;
  const s1 = [...a1].sort(),
    s2 = [...a2].sort();
  return s1.every((v, i) => v === s2[i]);
}
function getContrastColor(hex) {
  if (!hex) return "#000000";
  hex = hex.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16),
    g = parseInt(hex.substr(2, 2), 16),
    b = parseInt(hex.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? "#000000" : "#FFFFFF";
}
function getDayCodeName(name) {
  return NAME_ALIASES[name] || name;
}
function loadSystemColors() {
  const colors = {};
  const styles = getComputedStyle(document.documentElement);
  const map = {
    "--color-coc": "CoC",
    "--color-coc-secret": ["CoC-㊙", "CoC-㊙継"],
    "--color-dx3": "DX3",
    "--color-sw": "SW",
    "--color-sw2-5": "SW2.5",
    "--color-nechronica": "ネクロニカ",
    "--color-satasupe": "サタスペ",
    "--color-mamoburu": "マモブル",
    "--color-stellar": "銀剣",
    "--color-ar": "AR2E",
    "--color-default": "default",
  };
  for (const cssVar in map) {
    const color = styles.getPropertyValue(cssVar).trim();
    if (color) {
      const systemNames = map[cssVar];
      if (Array.isArray(systemNames)) {
        systemNames.forEach((name) => {
          colors[name] = color;
        });
      } else {
        colors[systemNames] = color;
      }
    }
  }
  return colors;
}

// 新しいヘルパー関数：日付をグループ化し、曜日を追加してフォーマット
function groupAndFormatDatesWithWeekday(fullDateStrings) {
  if (fullDateStrings.length === 0) return ""; // 候補日がない場合は空文字列を返す

  const dates = fullDateStrings
    .map((fds) => {
      const datePart = fds.split("(")[0];
      const [year, month, day] = datePart.split("/");
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    })
    .sort((a, b) => a.getTime() - b.getTime());

  const groups = [];
  if (dates.length > 0) {
    let currentGroup = [dates[0]];
    for (let i = 1; i < dates.length; i++) {
      const prevDate = currentGroup[currentGroup.length - 1];
      const currentDate = dates[i];
      const nextDay = new Date(prevDate);
      nextDay.setDate(nextDay.getDate() + 1);
      if (currentDate.getTime() === nextDay.getTime()) {
        currentGroup.push(currentDate);
      } else {
        groups.push(currentGroup);
        currentGroup = [currentDate];
      }
    }
    groups.push(currentGroup);
  }

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const formattedGroups = groups.map((group) => {
    const start = group[0];
    const end = group[group.length - 1];

    const startMonth = start.getMonth() + 1;
    const startDate = start.getDate();
    const startWeekday = weekdays[start.getDay()];

    const endMonth = end.getMonth() + 1;
    const endDate = end.getDate();
    const endWeekday = weekdays[end.getDay()];

    const startStr = `${startMonth}/${startDate}（${startWeekday}）`;

    if (start.getTime() === end.getTime()) {
      // 単一の日付の場合
      return startStr;
    } else {
      // 複数日の範囲の場合
      // 終了日も常に月を含めて表示
      const endStr = `${endMonth}/${endDate}（${endWeekday}）`;
      return `${startStr}～${endStr}`;
    }
  });

  return formattedGroups.join("、");
}

async function getSharedEventData() {
  try {
    const [spreadsheetResponse, archiveResponse] = await Promise.all([
      fetch(SPREADSHEET_URL),
      fetch(ARCHIVE_CSV_URL),
    ]);

    if (!spreadsheetResponse.ok) {
      console.error(
        `スプレッドシート (${SPREADSHEET_URL}) の読み込みに失敗しました: HTTP status ${spreadsheetResponse.status}`,
      );
      throw new Error(`HTTP error! status: ${spreadsheetResponse.status}`);
    }
    if (!archiveResponse.ok) {
      console.warn(
        `アーカイブCSV (${ARCHIVE_CSV_URL}) の読み込みに失敗しました: HTTP status ${archiveResponse.status}. スキップします。`,
      );
      // archive.csvの読み込み失敗は致命的ではないので、エラーを投げずに続行
    }

    const spreadsheetCsvText = await spreadsheetResponse.text();
    const archiveCsvText = archiveResponse.ok
      ? await archiveResponse.text()
      : "";

    const spreadsheetRows = parseCsvToArray(spreadsheetCsvText);
    const archiveRows = archiveCsvText ? parseCsvToArray(archiveCsvText) : [];

    let rawEvents = [];
    const normalize = (str) =>
      typeof str !== "string" || !str
        ? ""
        : str.replace(/　/g, " ").trim().replace(/\s+/g, " ");

    const processRows = (rows, isArchive = false) => {
      const now = new Date();
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );

      for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        if (!values || values.length < 4 || !normalize(values[3])) continue;

        const eventName = normalize(values[3]);
        const system = normalize(values[2]);
        const gm = normalize(values[4] || "");
        const participants = Array.from({ length: 6 }, (_, j) =>
          normalize(values[5 + j]),
        ).filter(Boolean);
        const dateStr = (values[1] || "").split("(")[0].trim();
        const parts = dateStr.split("/");
        let eventData = {
          id: `event-${isArchive ? "archive-" : ""}${i}`, // IDをユニークにする
          system,
          eventName,
          gm,
          participants,
          hasDate: false,
          isArchive: isArchive, // アーカイブデータであることを示すフラグ
        };

        if (parts.length === 3) {
          const date = new Date(
            parseInt(parts[0], 10),
            parseInt(parts[1], 10) - 1,
            parseInt(parts[2], 10),
          );
          if (!isNaN(date.getTime())) {
            // アーカイブデータの場合、先月以降のイベントはスキップ
            if (isArchive && date.getTime() >= startOfLastMonth.getTime()) {
              continue;
            }
            eventData.date = date;
            eventData.endDate = new Date(date);
            eventData.hasDate = true;
          }
        }
        rawEvents.push(eventData);
      }
    };

    processRows(spreadsheetRows, false);
    processRows(archiveRows, true);

    const datedEvents = rawEvents
      .filter((e) => e.hasDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const mergedEvents = [];
    let currentGroup = null;
    for (const event of datedEvents) {
      if (
        currentGroup &&
        currentGroup.system === event.system &&
        currentGroup.eventName === event.eventName &&
        (currentGroup.gm || "") === (event.gm || "") &&
        areArraysEqual(currentGroup.participants, event.participants) &&
        isNextDay(currentGroup.endDate, event.date) &&
        currentGroup.isArchive === event.isArchive // アーカイブフラグも考慮
      ) {
        currentGroup.endDate = new Date(event.date);
      } else {
        if (currentGroup) mergedEvents.push(currentGroup);
        currentGroup = { ...event };
      }
    }
    if (currentGroup) mergedEvents.push(currentGroup);

    const seriesMap = new Map();
    const getSeriesKey = (e) => {
      const pKey = e.participants ? [...e.participants].sort().join(",") : "";
      return `${(e.eventName || "").trim()}|${(e.system || "").trim()}|${(
        e.gm || ""
      ).trim()}|${pKey}|${e.isArchive ? "archive" : "current"}`; // シリーズキーにアーカイブフラグを追加
    };

    mergedEvents.forEach((e) => {
      const key = getSeriesKey(e);
      if (!seriesMap.has(key)) seriesMap.set(key, []);
      seriesMap.get(key).push(e);
    });

    seriesMap.forEach((blocks) => {
      blocks.sort((a, b) => a.date.getTime() - b.date.getTime());
      const allDates = [];
      blocks.forEach((b) => {
        let d = new Date(b.date);
        while (d.getTime() <= b.endDate.getTime()) {
          allDates.push(new Date(d));
          d.setDate(d.getDate() + 1);
        }
      });
      allDates.sort((a, b) => a.getTime() - b.getTime());
      blocks.forEach((b) => {
        b.seriesDates = allDates;
        b.seriesStartDate = allDates[0];
        b.seriesEndDate = allDates[allDates.length - 1];
      });
    });

    const allEvents = [...mergedEvents, ...rawEvents.filter((e) => !e.hasDate)];
    const eventsByDate = new Map();
    mergedEvents.forEach((e) => {
      let d = new Date(e.date);
      while (d.getTime() <= e.endDate.getTime()) {
        const dateStr = formatDate(d);
        if (!eventsByDate.has(dateStr)) eventsByDate.set(dateStr, []);
        eventsByDate.get(dateStr).push(e);
        d.setDate(d.getDate() + 1);
      }
    });
    return { allEvents, eventsByDate };
  } catch (error) {
    console.error("Error fetching or parsing shared event data:", error);
    return { allEvents: [], eventsByDate: new Map() };
  }
}
const TooltipManager = {
  element: null,
  init() {
    if (this.element) return;
    this.element = document.createElement("div");
    this.element.className = "event-tooltip";
    document.body.appendChild(this.element);
  },
  show(content, event) {
    this.element.innerHTML = content;
    this.element.style.display = "block";
    this.move(event);
  },
  hide() {
    this.element.style.display = "none";
  },
  move(event) {
    if (this.element.style.display === "block") {
      this.element.style.left = `${event.pageX + 15}px`;
      this.element.style.top = `${event.pageY + 15}px`;
    }
  },
};

function initializeCalendar({ allEvents, eventsByDate, COLORS }) {
  const state = {
    currentStartDate: getSunday(new Date()),
    isSecretHidden: false,
    filterName: "",
  };
  const dom = {
    grid: document.getElementById("calendar-grid"),
    prevBtn: document.getElementById("prev-week"),
    nextBtn: document.getElementById("next-week"),
    display: document.getElementById("current-week-display"),
    toggleBtn: document.getElementById("toggle-secret-events-btn"),
    filterSelect: document.getElementById("name-filter-select"),
    listBody: document.getElementById("schedule-list-body"),
    cells: [],
    listRows: [],
  };
  function buildSkeleton() {
    if (!dom.grid || !dom.listBody) return;
    const calendarFragment = document.createDocumentFragment();
    ["日", "月", "火", "水", "木", "金", "土"].forEach((day, i) => {
      const h = document.createElement("div");
      h.className = "calendar-header-cell";
      h.textContent = day;
      if (i === 0) h.classList.add("sunday-header");
      if (i === 6) h.classList.add("saturday-header");
      calendarFragment.appendChild(h);
    });
    for (let i = 0; i < 28; i++) {
      const c = document.createElement("div");
      c.className = "calendar-cell";
      const n = document.createElement("div");
      n.className = "date-number";
      const o = document.createElement("div");
      o.className = "events-container";
      c.append(n, o);
      dom.cells.push({ cell: c, num: n, cont: o });
      calendarFragment.appendChild(c);
    }
    dom.grid.append(calendarFragment);
    const listFragment = document.createDocumentFragment();
    const seriesMap = new Map();
    const getSeriesKey = (e) => {
      const pKey = e.participants ? [...e.participants].sort().join(",") : "";
      return `${(e.eventName || "").trim()}|${(e.system || "").trim()}|${(
        e.gm || ""
      ).trim()}|${pKey}`;
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    allEvents.forEach((e) => {
      if (
        e.hasDate &&
        !e.isArchive && // アーカイブされたイベントは除外
        e.seriesEndDate.getTime() >= today.getTime() && // 終了日が今日以降のイベントのみ
        !seriesMap.has(getSeriesKey(e))
      ) {
        seriesMap.set(getSeriesKey(e), e);
      }
    });

    const futureSeries = [...seriesMap.values()].sort(
      (a, b) => a.seriesStartDate.getTime() - b.seriesStartDate.getTime(),
    );
    const fmt = new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "short",
    });
    futureSeries.forEach((s) => {
      const r = document.createElement("tr");
      r.dataset.eventId = s.id;
      const bgColor = COLORS[s.system] || COLORS["default"];
      const textColor = getContrastColor(bgColor);
      r.innerHTML = `<td><span class="schedule-system-tag" style="background-color:${bgColor}; color:${textColor};">${
        s.system
      }</span>『${s.eventName}』</td><td>${fmt.format(
        s.seriesStartDate,
      )}</td><td>${fmt.format(s.seriesEndDate)}</td><td>${
        s.gm || "N/A"
      }</td><td>${s.participants.join(", ") || "N/A"}</td>`;
      dom.listRows.push({ row: r, event: s });
      listFragment.appendChild(r);
    });
    dom.listBody.appendChild(listFragment);

    // 予定がない場合にダミー行を追加
    if (dom.listRows.length === 0) {
      const r = document.createElement("tr");
      r.className = "dummy-row";
      // 5列すべてを結合したセルにメッセージを表示
      r.innerHTML =
        '<td colspan="5">現在予定されているセッションはありません。</td>';
      dom.listBody.appendChild(r);
    }
  }
  function updateCalendarView() {
    const endDate = new Date(state.currentStartDate);
    endDate.setDate(state.currentStartDate.getDate() + 27);
    if (dom.display)
      dom.display.textContent = `${formatDate(
        state.currentStartDate,
      )} - ${formatDate(endDate)}`;
    let tempDate = new Date(state.currentStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dom.cells.forEach((c) => {
      c.num.textContent = tempDate.getDate();
      c.cell.dataset.cellDate = formatDate(tempDate);
      const day = tempDate.getDay();
      c.num.className = "date-number";
      if (day === 0) c.num.classList.add("sunday-date-number");
      else if (day === 6) c.num.classList.add("saturday-date-number");
      c.cell.classList.toggle("today", tempDate.getTime() === today.getTime());
      c.cell.classList.toggle(
        "past-date",
        tempDate.getTime() < today.getTime(),
      );
      c.cont.innerHTML = "";
      const eventsOnDay = eventsByDate.get(formatDate(tempDate)) || [];
      eventsOnDay.forEach((event) => {
        const div = document.createElement("div");
        div.className = "event-entry";
        div.dataset.eventId = event.id;
        const bgColor = COLORS[event.system] || COLORS["default"];
        div.style.cssText = `background-color:${bgColor};color:${getContrastColor(
          bgColor,
        )};border-left-color:${bgColor};`;
        div.textContent = `${event.system}『${event.eventName}』`;
        c.cont.appendChild(div);
      });
      tempDate.setDate(tempDate.getDate() + 1);
    });
    applyFilters();
  }
  function applyFilters() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dom.grid.querySelectorAll(".event-entry").forEach((el) => {
      const event = allEvents.find((e) => e.id === el.dataset.eventId);
      if (event) {
        const isVisible =
          (!state.isSecretHidden || event.system !== "CoC-㊙") &&
          (!state.filterName ||
            event.gm === state.filterName ||
            event.participants.includes(state.filterName));
        el.style.display = isVisible ? "" : "none";
      }
    });
    dom.listRows.forEach(({ row, event }) => {
      const isVisible =
        (!state.isSecretHidden || event.system !== "CoC-㊙") &&
        (!state.filterName ||
          event.gm === state.filterName ||
          event.participants.includes(state.filterName)) &&
        event.seriesEndDate.getTime() >= today.getTime();
      row.style.display = isVisible ? "" : "none";
    });
  }
  buildSkeleton();
  updateCalendarView();
  const allNames = new Set();
  allEvents.forEach((e) => {
    if (e.gm) allNames.add(e.gm);
    e.participants.forEach((p) => allNames.add(p));
  });
  [...allNames]
    .sort((a, b) => a.localeCompare(b, "ja"))
    .forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      dom.filterSelect.appendChild(opt);
    });
  dom.grid.addEventListener("mouseover", (e) => {
    const target = e.target.closest(".event-entry");
    if (target) {
      const event = allEvents.find((ev) => ev.id === target.dataset.eventId);
      if (event) {
        let content = `<strong>GM:</strong> ${
          event.gm
        }<br><strong>PL:</strong> ${event.participants.join(", ")}`;
        content += `<div class="event-duration-info">期間: ${formatPeriod(
          event.seriesStartDate,
          event.seriesEndDate,
        )}</div>`;
        if (event.seriesDates.length > 1) {
          const cellDate = target.closest(".calendar-cell").dataset.cellDate;
          const dayIndex = event.seriesDates.findIndex(
            (d) => formatDate(d) === cellDate,
          );
          if (dayIndex !== -1)
            content += `<div class="event-day-info">Day ${dayIndex + 1}</div>`;
        }
        TooltipManager.show(content, e);
      }
    }
  });
  dom.grid.addEventListener("mouseout", () => TooltipManager.hide());
  dom.grid.addEventListener("mousemove", (e) => TooltipManager.move(e));
  if (dom.prevBtn)
    dom.prevBtn.addEventListener("click", () => {
      state.currentStartDate.setDate(state.currentStartDate.getDate() - 7);
      updateCalendarView();
    });
  if (dom.nextBtn)
    dom.nextBtn.addEventListener("click", () => {
      state.currentStartDate.setDate(state.currentStartDate.getDate() + 7);
      updateCalendarView();
    });
  if (dom.toggleBtn)
    dom.toggleBtn.addEventListener("change", () => {
      state.isSecretHidden = dom.toggleBtn.checked;
      applyFilters();
    });
  if (dom.filterSelect)
    dom.filterSelect.addEventListener("change", () => {
      state.filterName = dom.filterSelect.value;
      applyFilters();
    });
}

function initializeDaycordFeature({ allEvents, eventsByDate, COLORS }) {
  const dom = {
    nameSel: document.getElementById("daycord-name-select"),
    addBtn: document.getElementById("add-participant-btn"),
    clearBtn: document.getElementById("clear-participants-btn"),
    tableCont: document.querySelector(
      "#daycord-table-container .table-wrapper",
    ),
    resYoyu: document.getElementById("results-yoyu"),
    resDakyo: document.getElementById("results-dakyo"),
    resHiru: document.getElementById("results-hiru"),
    scenarioSel: document.getElementById("scenario-filter-select"),
    presetSel: document.getElementById("preset-filter-select"),
    includePendingCheckbox: document.getElementById("include-pending-checkbox"),
    selectedDatesDisplay: document.getElementById("selected-dates-display"),
    copySelectedDatesBtn: document.getElementById("copy-selected-dates-btn"),
    continuousDaysInput: document.getElementById("continuous-days-input"),
    newPresetNameInput: document.getElementById("new-preset-name"),
    savePresetBtn: document.getElementById("save-preset-btn"),
    deletePresetBtn: document.getElementById("delete-preset-btn"),
    selectionModeToggle: document.getElementById("selection-mode-toggle"),
    toggleConflictBtn: document.getElementById("toggle-conflict-display-btn"),
    hiddenParticipantsContainer: document.getElementById(
      "hidden-participants-container",
    ),
    hiddenParticipantsList: document.getElementById("hidden-participants-list"),
    loadingIndicator: document.getElementById("loading-indicator"),
  };
  let daycordNames = [],
    schedule = [],
    selectedNames = [],
    hiddenNames = [],
    scenarioData = [],
    participantPresets = {},
    userPresets = {},
    selectedDates = [];
  let showConflictAsStatus = false;

  const updateDisplay = () => {
    renderTable();
    renderHiddenParticipants();
    calculateAvailableDates();
    updateSelectedDatesDisplay();
    if (dom.clearBtn)
      dom.clearBtn.style.display =
        selectedNames.length > 0 || hiddenNames.length > 0 ? "" : "none";
  };

  const updateSelectedDatesDisplay = () => {
    if (dom.selectedDatesDisplay) {
      const formattedDates = groupAndFormatDatesWithWeekday(selectedDates);
      dom.selectedDatesDisplay.value =
        formattedDates || dom.selectedDatesDisplay.placeholder;
    }
  };

  const USER_PRESETS_KEY = "daycordUserPresets";

  function loadUserPresets() {
    try {
      const storedPresets = localStorage.getItem(USER_PRESETS_KEY);
      userPresets = storedPresets ? JSON.parse(storedPresets) : {};
    } catch (e) {
      console.error("ユーザープリセットの読み込みに失敗しました:", e);
      userPresets = {};
    }
  }

  function saveUserPreset(presetName, participants) {
    if (!presetName || participants.length === 0) {
      alert("プリセット名と参加者を選択してください。");
      return;
    }
    userPresets[presetName] = participants;
    try {
      localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(userPresets));
      alert(`プリセット「${presetName}」を保存しました！`);
      updatePresetDropdown();
      if (dom.newPresetNameInput) dom.newPresetNameInput.value = "";
    } catch (e) {
      console.error("ユーザープリセットの保存に失敗しました:", e);
      alert("プリセットの保存に失敗しました。");
    }
  }

  function deleteUserPreset(presetName) {
    if (
      !presetName ||
      presetName === "--all-participants--" ||
      presetName === "--all-active--" ||
      participantPresets[presetName]
    ) {
      alert("このプリセットは削除できません。");
      return;
    }
    if (confirm(`プリセット「${presetName}」を削除しますか？`)) {
      delete userPresets[presetName];
      try {
        localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(userPresets));
        alert(`プリセット「${presetName}」を削除しました。`);
        updatePresetDropdown();
        if (dom.presetSel) dom.presetSel.value = "";
        selectedNames = [];
        updateDisplay();
      } catch (e) {
        console.error("ユーザープリセットの削除に失敗しました:", e);
        alert("プリセットの削除に失敗しました。");
      }
    }
  }

  function updatePresetDropdown() {
    if (!dom.presetSel) return;
    dom.presetSel.innerHTML =
      '<option value="">-- プリセットを選択 --</option>';

    const builtInPresets = {
      "--all-participants--": "全員",
      "--all-active--": "未記入以外全員",
    };

    for (const presetName in builtInPresets) {
      const option = document.createElement("option");
      option.value = presetName;
      option.textContent = `[⭐️] ${builtInPresets[presetName]}`;
      dom.presetSel.appendChild(option);
    }

    const fetchedPresetNames = Object.keys(participantPresets).sort((a, b) =>
      a.localeCompare(b, "ja"),
    );
    fetchedPresetNames.forEach((presetName) => {
      const option = document.createElement("option");
      option.value = presetName;
      option.textContent = `[⭐️] ${presetName}`;
      dom.presetSel.appendChild(option);
    });

    const userPresetNames = Object.keys(userPresets).sort((a, b) =>
      a.localeCompare(b, "ja"),
    );
    userPresetNames.forEach((presetName) => {
      const option = document.createElement("option");
      option.value = presetName;
      option.textContent = presetName;
      dom.presetSel.appendChild(option);
    });
  }

  function processScenarioData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const relevantEvents = allEvents.filter(
      (e) =>
        !e.hasDate ||
        (e.seriesEndDate && e.seriesEndDate.getTime() >= today.getTime()),
    );
    const map = new Map();
    relevantEvents.forEach((e) => {
      const { eventName, gm, participants, hasDate } = e;
      if (map.has(eventName)) {
        const data = map.get(eventName);
        participants.forEach((p) => {
          if (!data.participants.includes(p)) data.participants.push(p);
        });
        if (hasDate) data.hasDate = true;
      } else {
        map.set(eventName, { gm, participants: [...participants], hasDate });
      }
    });
    scenarioData = Array.from(map, ([eventName, data]) => ({
      eventName,
      ...data,
    })).sort((a, b) => {
      if (a.hasDate !== b.hasDate) return a.hasDate ? -1 : 1;
      return a.eventName.localeCompare(b.eventName, "ja");
    });
    const fragment = document.createDocumentFragment();
    scenarioData.forEach((d) => {
      const option = document.createElement("option");
      option.value = d.eventName;
      let text = `${d.eventName} (GM: ${d.gm || "未定"})`;
      if (!d.hasDate) text += " [日程未定]";
      option.textContent = text;
      fragment.appendChild(option);
    });
    if (dom.scenarioSel) dom.scenarioSel.appendChild(fragment);
  }

  function renderHiddenParticipants() {
    if (!dom.hiddenParticipantsList) return;
    dom.hiddenParticipantsList.innerHTML = "";
    hiddenNames.forEach((name) => {
      const tag = document.createElement("div");
      tag.className = "hidden-participant-tag";
      tag.textContent = name;
      tag.dataset.name = name;
      dom.hiddenParticipantsList.appendChild(tag);
    });
  }

  function renderTable() {
    if (!dom.tableCont) return;
    if (selectedNames.length === 0) {
      dom.tableCont.innerHTML =
        "<p>参加者を選択すると、出欠表が表示されます。</p>";
      return;
    }

    const dailyParticipantStatus = [];
    schedule.forEach((day) => {
      const statusesForDay = [];
      selectedNames.forEach((name) => {
        const nameIndex = daycordNames.indexOf(name);
        if (nameIndex === -1) {
          statusesForDay.push("－");
          return;
        }
        const dateStr = day.date.split("(")[0];
        const parts = dateStr.split("/");
        const key = `${parts[0]}/${String(parts[1]).padStart(2, "0")}/${String(
          parts[2],
        ).padStart(2, "0")}`;
        const eventsOnDay = eventsByDate.get(key) || [];
        const participantEvent = eventsOnDay.find((e) =>
          [e.gm, ...e.participants]
            .map((p) => getDayCodeName(p))
            .includes(name),
        );
        if (participantEvent) {
          statusesForDay.push("✕");
        } else {
          statusesForDay.push(day.availability[nameIndex] || "－");
        }
      });
      dailyParticipantStatus.push(statusesForDay);
    });

    const table = document.createElement("table");
    table.className = "daycord-table";
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    headerRow.innerHTML = "<th>参加者</th>";

    schedule.forEach((d, dayIndex) => {
      const th = document.createElement("th");
      const dateStr = d.date.split("(")[0];
      th.dataset.dateCol = dateStr;

      let statusesForDay = dailyParticipantStatus[dayIndex];
      if (statusesForDay && statusesForDay.length > 0) {
        const includePending =
          dom.includePendingCheckbox && dom.includePendingCheckbox.checked;

        if (includePending) {
          statusesForDay = statusesForDay.map((s) => (s === "－" ? "〇" : s));
        }

        const yoyuOk = ["◎", "〇"];
        const dakyoOk = ["◎", "〇", "△"];
        const hiruOk = ["◎", "□"];

        if (statusesForDay.every((s) => yoyuOk.includes(s))) {
          th.classList.add("summary-cell-yoyu");
        } else if (statusesForDay.every((s) => dakyoOk.includes(s))) {
          th.classList.add("summary-cell-dakyo");
        } else if (statusesForDay.every((s) => hiruOk.includes(s))) {
          th.classList.add("summary-cell-hiru");
        }
      }

      th.innerHTML = `
        <label class="date-header-label">
          <input type="checkbox" class="date-checkbox" data-date="${dateStr}" ${
            selectedDates.includes(dateStr) ? "checked" : ""
          }>
          <span class="date-text">${formatShortDate(d.date)}</span>
        </label>
      `;
      headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    tbody.id = "daycord-tbody";

    const summarySymbols = ["◎", "〇", "△", "□", "✕"];
    summarySymbols.forEach((symbol) => {
      const summaryRow = tbody.insertRow();
      summaryRow.classList.add("summary-row");
      const symbolClass = `summary-row-${
        {
          "◎": "o",
          〇: "maru",
          "△": "sankaku",
          "✕": "batsu",
          "□": "shikaku",
        }[symbol] || "default"
      }`;
      summaryRow.classList.add(symbolClass);

      const titleCell = summaryRow.insertCell();
      titleCell.innerHTML = `<strong>${symbol}</strong>`;

      schedule.forEach((_, dayIndex) => {
        const statusesForDay = dailyParticipantStatus[dayIndex];
        const count = statusesForDay.filter((s) => s === symbol).length;
        const cell = summaryRow.insertCell();
        cell.textContent = count > 0 ? count : "";

        if (count > 0) {
          cell.classList.add("has-count");
        }

        if (statusesForDay && statusesForDay.length > 0) {
          const yoyuOk = ["◎", "〇"];
          const dakyoOk = ["◎", "〇", "△"];
          const hiruOk = ["◎", "□"];
          if (statusesForDay.every((s) => yoyuOk.includes(s))) {
            cell.classList.add("summary-cell-yoyu");
          } else if (statusesForDay.every((s) => dakyoOk.includes(s))) {
            cell.classList.add("summary-cell-dakyo");
          } else if (statusesForDay.every((s) => hiruOk.includes(s))) {
            cell.classList.add("summary-cell-hiru");
          }
        }
      });
    });

    const eventRow = tbody.insertRow();
    eventRow.classList.add("event-row");
    const eventTitleCell = eventRow.insertCell();
    eventTitleCell.innerHTML = "<strong>予定</strong>";
    schedule.forEach((day) => {
      const cell = eventRow.insertCell();
      const dateStr = day.date.split("(")[0];
      cell.dataset.dateCol = dateStr;
      const parts = dateStr.split("/");
      const key = `${parts[0]}/${String(parts[1]).padStart(2, "0")}/${String(
        parts[2],
      ).padStart(2, "0")}`;
      const eventsOnDay = eventsByDate.get(key) || [];
      if (eventsOnDay.length > 0) cell.classList.add("has-event");
      eventsOnDay.forEach((e) => {
        const system = e.system || "";
        const bgColor = COLORS[system] || COLORS["default"];
        const textColor = getContrastColor(bgColor);
        let tooltipContent = `${system}『${
          e.eventName
        }』<br><strong>GM:</strong> ${e.gm || "未定"}`;
        if (e.participants && e.participants.length > 0) {
          tooltipContent += `<br><strong>PL:</strong> ${e.participants.join(
            ", ",
          )}`;
        }
        const encodedTooltip = tooltipContent.replace(/"/g, '"');
        const eventDiv = document.createElement("div");
        eventDiv.className = "daycord-event-entry";
        eventDiv.style.cssText = `background-color:${bgColor};color:${textColor};`;
        eventDiv.dataset.tooltipContent = encodedTooltip;
        eventDiv.innerHTML = system ? system : "&nbsp;";
        if (system.length > 4) {
          eventDiv.classList.add("long-system-name");
        }
        if (!system) {
          eventDiv.style.minHeight = "1.2em";
          eventDiv.style.boxSizing = "border-box";
        }
        cell.appendChild(eventDiv);
      });
    });

    selectedNames.forEach((name) => {
      const nameIndex = daycordNames.indexOf(name);
      const row = tbody.insertRow();
      row.draggable = true;
      row.dataset.name = name;
      const nameCell = row.insertCell();
      nameCell.innerHTML = `<span class="drag-handle">≡</span><button class="remove-participant-btn" data-name="${name}">✕</button>${name}`;

      const isCompletelyUnfilled =
        nameIndex !== -1 &&
        schedule.every((day) => (day.availability[nameIndex] || "－") === "－");

      if (nameIndex === -1 || isCompletelyUnfilled) {
        nameCell.innerHTML += ` <span class="unregistered-note">(予定未入力)</span>`;
        row.classList.add("unregistered-row");
      }

      if (nameIndex === -1) {
        schedule.forEach((day) => {
          const cell = row.insertCell();
          const span = document.createElement("span");
          span.className = "daycord-status-tag status-hyphen";
          span.textContent = "－";
          cell.appendChild(span);
          const dateStr = day.date.split("(")[0];
          const parts = dateStr.split("/");
          const key = `${parts[0]}/${String(parts[1]).padStart(
            2,
            "0",
          )}/${String(parts[2]).padStart(2, "0")}`;
          if ((eventsByDate.get(key) || []).length > 0) {
            cell.classList.add("has-event");
          }
        });
      } else {
        schedule.forEach((day) => {
          const cell = row.insertCell();
          const dateStr = day.date.split("(")[0];
          cell.dataset.dateCol = dateStr;
          const parts = dateStr.split("/");
          const key = `${parts[0]}/${String(parts[1]).padStart(
            2,
            "0",
          )}/${String(parts[2]).padStart(2, "0")}`;
          const eventsOnDay = eventsByDate.get(key) || [];
          const participantEvent = eventsOnDay.find((e) =>
            [e.gm, ...e.participants]
              .map((p) => getDayCodeName(p))
              .includes(name),
          );
          if (eventsOnDay.length > 0) {
            cell.classList.add("has-event");
          }
          const span = document.createElement("span");
          span.className = "daycord-status-tag";
          const originalStatus = day.availability[nameIndex] || "－";
          const getStatusClass = (status) =>
            `status-${status.replace(
              /[◎〇△✕□－]/g,
              (c) =>
                ({
                  "◎": "o",
                  〇: "maru",
                  "△": "sankaku",
                  "✕": "batsu",
                  "□": "shikaku",
                  "－": "hyphen",
                })[c],
            )}`;

          if (participantEvent) {
            cell.classList.add("is-conflicting");
            let tooltipContent = `<b>元のステータス: ${originalStatus}</b><hr>${participantEvent.system}『${participantEvent.eventName}』<br><strong>GM:</strong> ${participantEvent.gm}`;
            if (participantEvent.participants.length > 0)
              tooltipContent += `<br><strong>PL:</strong> ${participantEvent.participants.join(
                ", ",
              )}`;
            cell.dataset.tooltipContent = tooltipContent.replace(/"/g, '"');

            if (showConflictAsStatus) {
              span.classList.add(getStatusClass(originalStatus));
              span.textContent = originalStatus;
            } else {
              const system = participantEvent.system;
              const bgColor = COLORS[system] || COLORS["default"];
              span.style.cssText = `background-color:${bgColor}; color:${getContrastColor(
                bgColor,
              )};`;
              span.textContent = system;
              if (system.length > 4) {
                span.classList.add("long-system-name");
              }
            }
          } else {
            span.classList.add(getStatusClass(originalStatus));
            span.textContent = originalStatus;
          }
          cell.appendChild(span);
        });
      }
    });
    dom.tableCont.innerHTML = "";
    dom.tableCont.appendChild(table);

    dom.tableCont.querySelectorAll(".date-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const date = e.target.dataset.date;
        const headerCell = dom.tableCont.querySelector(
          `th[data-date-col="${date}"]`,
        );
        if (!headerCell) return;

        if (e.target.checked) {
          if (!selectedDates.includes(date)) {
            selectedDates.push(date);
          }
          headerCell.classList.add("selected-date-cell");
        } else {
          selectedDates = selectedDates.filter((d) => d !== date);
          headerCell.classList.remove("selected-date-cell");
        }
        updateSelectedDatesDisplay();
      });
    });

    selectedDates.forEach((date) => {
      const headerCell = dom.tableCont.querySelector(
        `th[data-date-col="${date}"]`,
      );
      if (headerCell) {
        headerCell.classList.add("selected-date-cell");
      }
    });
  }

  function filterByContinuousDays(fullDateStrings, minDays) {
    if (!minDays || minDays < 2 || fullDateStrings.length < minDays) {
      return fullDateStrings;
    }

    const dates = fullDateStrings
      .map((fds) => {
        const datePart = fds.split("(")[0];
        const [year, month, day] = datePart.split("/");
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      })
      .sort((a, b) => a.getTime() - b.getTime());

    const continuousGroups = [];
    if (dates.length > 0) {
      let currentGroup = [dates[0]];
      for (let i = 1; i < dates.length; i++) {
        const prevDate = currentGroup[currentGroup.length - 1];
        const currentDate = dates[i];
        if (isNextDay(prevDate, currentDate)) {
          currentGroup.push(currentDate);
        } else {
          if (currentGroup.length >= minDays) {
            continuousGroups.push(...currentGroup);
          }
          currentGroup = [currentDate];
        }
      }
      if (currentGroup.length >= minDays) {
        continuousGroups.push(...currentGroup);
      }
    }

    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const uniqueDates = [...new Set(continuousGroups)];
    return uniqueDates.map((d) => {
      const y = d.getFullYear(),
        m = d.getMonth() + 1,
        day = d.getDate(),
        w = weekdays[d.getDay()];
      return `${y}/${m}/${day}(${w})`;
    });
  }

  function renderAvailabilityResults(targetElement, fullDateStrings) {
    targetElement.innerHTML = "";
    if (fullDateStrings.length === 0) {
      targetElement.textContent = "まずいかも～";
      return;
    }

    const dates = fullDateStrings
      .map((fds) => {
        const datePart = fds.split("(")[0];
        const [year, month, day] = datePart.split("/");
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      })
      .sort((a, b) => a.getTime() - b.getTime());

    const groups = [];
    if (dates.length > 0) {
      let currentGroup = [dates[0]];
      for (let i = 1; i < dates.length; i++) {
        const prevDate = currentGroup[currentGroup.length - 1];
        const currentDate = dates[i];
        if (isNextDay(prevDate, currentDate)) {
          currentGroup.push(currentDate);
        } else {
          groups.push(currentGroup);
          currentGroup = [currentDate];
        }
      }
      groups.push(currentGroup);
    }

    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const fragment = document.createDocumentFragment();
    groups.forEach((group) => {
      const span = document.createElement("span");
      const start = group[0];
      const end = group[group.length - 1];

      const startStr = `${start.getMonth() + 1}/${start.getDate()}（${
        weekdays[start.getDay()]
      }）`;

      let formattedText;
      if (start.getTime() === end.getTime()) {
        formattedText = startStr;
      } else {
        const endStr = `${end.getMonth() + 1}/${end.getDate()}（${
          weekdays[end.getDay()]
        }）`;
        formattedText = `${startStr}～${endStr}`;
        span.className = "date-period";
      }
      span.textContent = formattedText;
      fragment.appendChild(span);
    });
    targetElement.appendChild(fragment);
  }

  function calculateAvailableDates() {
    if (selectedNames.length === 0) {
      dom.resYoyu.textContent = "参加者を選択してください";
      dom.resDakyo.textContent = "参加者を選択してください";
      dom.resHiru.textContent = "参加者を選択してください";
      return;
    }

    const minDays = parseInt(dom.continuousDaysInput.value, 10) || 0;

    const yoyuOk = ["◎", "〇"];
    const dakyoOk = ["◎", "〇", "△"];
    const hiruOk = ["◎", "□"];
    if (dom.includePendingCheckbox && dom.includePendingCheckbox.checked) {
      yoyuOk.push("－");
      dakyoOk.push("－");
    }

    const relevantSchedule = schedule.map((day) => {
      const dateStr = day.date.split("(")[0],
        parts = dateStr.split("/");
      const key = `${parts[0]}/${String(parts[1]).padStart(2, "0")}/${String(
        parts[2],
      ).padStart(2, "0")}`;
      const eventsOnDay = eventsByDate.get(key) || [];
      const relevantAvailability = selectedNames.map((name) => {
        const participantEvent = eventsOnDay.find((e) =>
          [e.gm, ...e.participants]
            .map((p) => getDayCodeName(p))
            .includes(name),
        );
        if (participantEvent) return "✕";
        const nameIndex = daycordNames.indexOf(name);
        return nameIndex !== -1 ? day.availability[nameIndex] || "－" : "－";
      });
      return { date: day.date, availability: relevantAvailability };
    });

    let yoyuDates = relevantSchedule
      .filter((d) => d.availability.every((s) => yoyuOk.includes(s)))
      .map((d) => d.date);
    let dakyoDates = relevantSchedule
      .filter((d) => d.availability.every((s) => dakyoOk.includes(s)))
      .map((d) => d.date);
    let hiruDates = relevantSchedule
      .filter((d) => d.availability.every((s) => hiruOk.includes(s)))
      .map((d) => d.date);

    if (minDays >= 2) {
      yoyuDates = filterByContinuousDays(yoyuDates, minDays);
      dakyoDates = filterByContinuousDays(dakyoDates, minDays);
      hiruDates = filterByContinuousDays(hiruDates, minDays);
    }

    renderAvailabilityResults(dom.resYoyu, yoyuDates);
    renderAvailabilityResults(dom.resDakyo, dakyoDates);
    renderAvailabilityResults(dom.resHiru, hiruDates);
  }

  async function fetchAndProcessData() {
    try {
      dom.tableCont.innerHTML =
        '<p class="loading-message"><i class="fa-solid fa-spinner fa-spin"></i> 各種データを読み込み中です...</p>';
      if (dom.nameSel) dom.nameSel.disabled = true;
      if (dom.addBtn) dom.addBtn.disabled = true;
      if (dom.scenarioSel) dom.scenarioSel.disabled = true;
      if (dom.presetSel) dom.presetSel.disabled = true;
      if (dom.copySelectedDatesBtn) dom.copySelectedDatesBtn.disabled = true;

      const [daycordResponse, presetResponse] = await Promise.all([
        fetch(DAYCORD_PROXY_URL),
        fetch(PRESETS_JSON_URL)
          .then((res) => {
            if (!res.ok) {
              console.warn(
                `プリセットファイル (${PRESETS_JSON_URL}) の読み込みに失敗しました: HTTP status ${res.status}`,
              );
              return {};
            }
            return res.json();
          })
          .catch((err) => {
            console.error(
              `プリセットファイル (${PRESETS_JSON_URL}) のパースに失敗しました:`,
              err,
            );
            return {};
          }),
      ]);
      participantPresets = presetResponse;
      loadUserPresets();
      updatePresetDropdown();

      const htmlText = await daycordResponse.text();
      const doc = new DOMParser().parseFromString(htmlText, "text/html");
      const table = doc.querySelector("table.schedule_table");
      if (!table) {
        console.error(
          "デイコードのテーブルが見つかりません。HTML構造が変更された可能性があります。",
        );
        throw new Error("デイコードのテーブルが見つかりません。");
      }

      const headerRow = table.querySelector("tr#namerow"),
        bodyRows = table.querySelectorAll('tbody tr[id^="row_"]');
      const headerCells = Array.from(headerRow.querySelectorAll("th"));
      const symbols = ["◎", "〇", "◯", "△", "✕", "□", "－", "×", "▢"];
      daycordNames = headerCells
        .map((th) => th.textContent.trim())
        .filter((name) => name && !symbols.includes(name));

      let rawSchedule = Array.from(bodyRows).map((row) => ({
        date:
          row.querySelector("th.datetitle")?.textContent.trim() || "日付不明",
        availability: Array.from(row.querySelectorAll("td span.statustag")).map(
          (span) =>
            span.textContent
              .trim()
              .replace(/◯/g, "〇")
              .replace(/×/g, "✕")
              .replace(/▢/g, "□") || "－",
        ),
      }));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      schedule = rawSchedule.filter((day) => {
        const datePart = day.date.split("(")[0];
        const [year, month, dayOfMonth] = datePart.split("/");
        if (!year || !month || !dayOfMonth) return false;
        const scheduleDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(dayOfMonth),
        );
        return scheduleDate.getTime() >= today.getTime();
      });

      const sortedNamesForDropdown = [...daycordNames].sort((a, b) =>
        a.localeCompare(b, "ja"),
      );
      const nameFragment = document.createDocumentFragment();
      sortedNamesForDropdown.forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        nameFragment.appendChild(option);
      });
      if (dom.nameSel) {
        dom.nameSel.innerHTML = '<option value="">-- 名前を選択 --</option>';
        dom.nameSel.appendChild(nameFragment);
      }
      processScenarioData();
      updateDisplay();
    } catch (err) {
      console.error("データ取得・処理失敗:", err);
      if (dom.tableCont)
        dom.tableCont.innerHTML = `<p>データ取得に失敗しました: ${err.message}</p>`;
    } finally {
      if (dom.nameSel) dom.nameSel.disabled = false;
      if (dom.addBtn) dom.addBtn.disabled = false;
      if (dom.scenarioSel) dom.scenarioSel.disabled = false;
      if (dom.presetSel) dom.presetSel.disabled = false;
      if (dom.copySelectedDatesBtn) dom.copySelectedDatesBtn.disabled = false;
      if (dom.loadingIndicator) dom.loadingIndicator.style.display = "none";
    }
  }

  if (dom.addBtn)
    dom.addBtn.addEventListener("click", () => {
      const name = dom.nameSel.value;
      if (
        name &&
        !selectedNames.includes(name) &&
        !hiddenNames.includes(name)
      ) {
        selectedNames.push(name);
        updateDisplay();
      }
    });

  if (dom.savePresetBtn) {
    dom.savePresetBtn.addEventListener("click", () => {
      const presetName = dom.newPresetNameInput.value.trim();
      saveUserPreset(presetName, selectedNames);
    });
  }

  if (dom.deletePresetBtn) {
    dom.deletePresetBtn.addEventListener("click", () => {
      const selectedPresetName = dom.presetSel.value;
      deleteUserPreset(selectedPresetName);
    });
  }

  if (dom.clearBtn)
    dom.clearBtn.addEventListener("click", () => {
      if (selectedNames.length > 0 || hiddenNames.length > 0) {
        selectedNames = [];
        hiddenNames = [];
        updateDisplay();
      }
    });

  if (dom.tableCont) {
    dom.tableCont.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-participant-btn")) {
        const nameToRemove = e.target.dataset.name;
        selectedNames = selectedNames.filter((n) => n !== nameToRemove);
        updateDisplay();
      }
    });
  }

  if (dom.scenarioSel)
    dom.scenarioSel.addEventListener("change", () => {
      const eventName = dom.scenarioSel.value;
      const isAppendMode =
        dom.selectionModeToggle && dom.selectionModeToggle.checked;
      if (!isAppendMode) {
        selectedNames = [];
        if (dom.presetSel) dom.presetSel.value = "";
      }

      if (eventName) {
        const event = scenarioData.find((d) => d.eventName === eventName);
        if (event) {
          const participantsOnSheet = [event.gm, ...event.participants].filter(
            Boolean,
          );
          const newParticipants = participantsOnSheet.map((name) =>
            getDayCodeName(name),
          );
          selectedNames = [...new Set([...selectedNames, ...newParticipants])];
        }
      } else if (!isAppendMode) {
        selectedNames = [];
      }
      updateDisplay();
    });

  if (dom.presetSel)
    dom.presetSel.addEventListener("change", () => {
      const presetName = dom.presetSel.value;
      const isAppendMode =
        dom.selectionModeToggle && dom.selectionModeToggle.checked;

      if (!isAppendMode) {
        selectedNames = [];
        if (dom.scenarioSel) dom.scenarioSel.value = "";
      }

      let newParticipants = [];
      if (presetName === "--all-active--") {
        newParticipants = daycordNames.filter((name, index) =>
          schedule.some((day) => day.availability[index] !== "－"),
        );
      } else if (presetName === "--all-participants--") {
        newParticipants = [...daycordNames];
      } else if (presetName) {
        const presetParticipants =
          participantPresets[presetName] || userPresets[presetName] || [];
        newParticipants = presetParticipants.map((name) =>
          getDayCodeName(name),
        );
      }

      if (newParticipants.length > 0) {
        selectedNames = [...new Set([...selectedNames, ...newParticipants])];
      } else if (!isAppendMode && !presetName) {
        selectedNames = [];
      }
      updateDisplay();
    });

  if (dom.includePendingCheckbox)
    dom.includePendingCheckbox.addEventListener("change", () => {
      calculateAvailableDates();
      renderTable(); // テーブルの再描画も行う
    });
  if (dom.continuousDaysInput)
    dom.continuousDaysInput.addEventListener("input", calculateAvailableDates);

  if (dom.copySelectedDatesBtn) {
    dom.copySelectedDatesBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(dom.selectedDatesDisplay.value);
        alert("選択された日付がコピーされました！");
      } catch (err) {
        console.error("コピーに失敗しました:", err);
        alert("コピーに失敗しました。手動でコピーしてください。");
      }
    });
  }

  if (dom.tableCont) {
    dom.tableCont.addEventListener("mouseover", (e) => {
      const target = e.target.closest("[data-tooltip-content]");
      if (target) {
        TooltipManager.show(target.dataset.tooltipContent, e);
      }
    });
    dom.tableCont.addEventListener("mouseout", () => TooltipManager.hide());
    dom.tableCont.addEventListener("mousemove", (e) => TooltipManager.move(e));
  }

  fetchAndProcessData();

  if (dom.toggleConflictBtn) {
    dom.toggleConflictBtn.addEventListener("change", (e) => {
      showConflictAsStatus = e.target.checked;
      renderTable();
    });
  }

  // --- ドラッグ＆ドロップのロジック ---
  let draggedRow = null;
  let placeholder = null;

  dom.tableCont.addEventListener("dragstart", (e) => {
    draggedRow = e.target.closest("tr[draggable='true']");
    if (!draggedRow) return;

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggedRow.dataset.name);

    setTimeout(() => {
      draggedRow.classList.add("dragging-row");
    }, 0);

    placeholder = document.createElement("tr");
    placeholder.className = "drag-placeholder";
    const cell = placeholder.insertCell();
    cell.colSpan = schedule.length + 1;
  });

  dom.tableCont.addEventListener("dragend", (e) => {
    if (!draggedRow) return;
    draggedRow.classList.remove("dragging-row");
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.removeChild(placeholder);
    }
    placeholder = null;
    draggedRow = null;
    dom.hiddenParticipantsContainer.classList.remove("drag-over");
  });

  dom.tableCont.addEventListener("dragover", (e) => {
    e.preventDefault();
    const tbody = dom.tableCont.querySelector("#daycord-tbody");
    const overRow = e.target.closest("tr[draggable='true']");
    if (overRow && overRow !== draggedRow && tbody) {
      const rect = overRow.getBoundingClientRect();
      const next = e.clientY > rect.top + rect.height / 2;
      if (next) {
        tbody.insertBefore(placeholder, overRow.nextSibling);
      } else {
        tbody.insertBefore(placeholder, overRow);
      }
    }
  });

  dom.tableCont.addEventListener("drop", (e) => {
    e.preventDefault();
    if (placeholder && placeholder.parentNode) {
      const name = e.dataTransfer.getData("text/plain");
      const fromIndex = selectedNames.indexOf(name);
      const toIndex = Array.from(placeholder.parentNode.children).indexOf(
        placeholder,
      );
      if (fromIndex !== -1) {
        selectedNames.splice(fromIndex, 1);
        const adjustedToIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;
        selectedNames.splice(
          adjustedToIndex - (summarySymbols.length + 1),
          0,
          name,
        );
        updateDisplay();
      }
    }
  });

  // 非表示エリアのドラッグ＆ドロップ
  dom.hiddenParticipantsContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dom.hiddenParticipantsContainer.classList.add("drag-over");
  });

  dom.hiddenParticipantsContainer.addEventListener("dragleave", () => {
    dom.hiddenParticipantsContainer.classList.remove("drag-over");
  });

  dom.hiddenParticipantsContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    const name = e.dataTransfer.getData("text/plain");
    if (name && !hiddenNames.includes(name)) {
      selectedNames = selectedNames.filter((n) => n !== name);
      hiddenNames.push(name);
      updateDisplay();
    }
    dom.hiddenParticipantsContainer.classList.remove("drag-over");
  });

  // 非表示エリアから戻す
  dom.hiddenParticipantsList.addEventListener("click", (e) => {
    if (e.target.classList.contains("hidden-participant-tag")) {
      const name = e.target.dataset.name;
      hiddenNames = hiddenNames.filter((n) => n !== name);
      selectedNames.push(name);
      updateDisplay();
    }
  });
}

// --- メイン実行 ---
document.addEventListener("DOMContentLoaded", async () => {
  const loadingIndicator = document.getElementById("loading-indicator");
  if (loadingIndicator) loadingIndicator.style.display = "block";

  try {
    const { allEvents, eventsByDate } = await getSharedEventData();
    const COLORS = loadSystemColors();
    TooltipManager.init();

    if (document.getElementById("custom-calendar-container")) {
      initializeCalendar({ allEvents, eventsByDate, COLORS });
    }

    if (document.getElementById("daycord-table-container")) {
      initializeDaycordFeature({ allEvents, eventsByDate, COLORS });
    } else {
      // daycord機能がない場合は、ここでインジケーターを消す
      if (loadingIndicator) loadingIndicator.style.display = "none";
    }
  } catch (error) {
    console.error("ページの初期化中にエラーが発生しました:", error);
    // エラーが発生した場合もインジケーターを消す
    if (loadingIndicator) loadingIndicator.style.display = "none";
  }
});

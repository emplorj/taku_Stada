// ==========================================================================
//   SCHEDULE.JS - 表示崩壊バグ・データ不整合 完全修正版
// ==========================================================================

// --- グローバル設定と共通ヘルパー関数 ---
const SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=783716063&single=true&output=csv";
const DAYCORD_PROXY_URL =
  "https://corsproxy.io/?" +
  encodeURIComponent(
    "https://character-sheets.appspot.com/schedule/list?key=ahVzfmNoYXJhY3Rlci1zaGVldHMtbXByHAsSEkRpc2NvcmRTZXNzaW9uRGF0YRimu5y4BQw"
  );
const PRESETS_JSON_URL = "presets.json";

const NAME_ALIASES = {
  vara: "☭",
  くれいど: "qre1d/くれいど",
  viw: "ゔぃｗ",
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
    "0"
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
    "--color-coc-secret": "CoC-㊙",
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
    if (color) colors[map[cssVar]] = color;
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
    const response = await fetch(SPREADSHEET_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const csvText = await response.text();
    const rows = parseCsvToArray(csvText);
    let rawEvents = [];
    const normalize = (str) =>
      typeof str !== "string" || !str
        ? ""
        : str.replace(/　/g, " ").trim().replace(/\s+/g, " ");
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i];
      if (!values || values.length < 4 || !normalize(values[3])) continue;
      const eventName = normalize(values[3]);
      const system = normalize(values[2]);
      const gm = normalize(values[4] || "");
      const participants = Array.from({ length: 6 }, (_, j) =>
        normalize(values[5 + j])
      ).filter(Boolean);
      const dateStr = (values[1] || "").split("(")[0].trim();
      const parts = dateStr.split("/");
      let eventData = {
        id: `event-${i}`,
        system,
        eventName,
        gm,
        participants,
        hasDate: false,
      };
      if (parts.length === 3) {
        const date = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10)
        );
        if (!isNaN(date.getTime())) {
          eventData.date = date;
          eventData.endDate = new Date(date);
          eventData.hasDate = true;
        }
      }
      rawEvents.push(eventData);
    }
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
        isNextDay(currentGroup.endDate, event.date)
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
      ).trim()}|${pKey}`;
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
    allEvents.forEach((e) => {
      if (e.hasDate && !seriesMap.has(getSeriesKey(e))) {
        seriesMap.set(getSeriesKey(e), e);
      }
    });
    const futureSeries = [...seriesMap.values()].sort(
      (a, b) => a.seriesStartDate.getTime() - b.seriesStartDate.getTime()
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
        s.seriesStartDate
      )}</td><td>${fmt.format(s.seriesEndDate)}</td><td>${
        s.gm || "N/A"
      }</td><td>${s.participants.join(", ") || "N/A"}</td>`;
      dom.listRows.push({ row: r, event: s });
      listFragment.appendChild(r);
    });
    dom.listBody.appendChild(listFragment);
  }
  function updateCalendarView() {
    const endDate = new Date(state.currentStartDate);
    endDate.setDate(state.currentStartDate.getDate() + 27);
    if (dom.display)
      dom.display.textContent = `${formatDate(
        state.currentStartDate
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
        tempDate.getTime() < today.getTime()
      );
      c.cont.innerHTML = "";
      const eventsOnDay = eventsByDate.get(formatDate(tempDate)) || [];
      eventsOnDay.forEach((event) => {
        const div = document.createElement("div");
        div.className = "event-entry";
        div.dataset.eventId = event.id;
        const bgColor = COLORS[event.system] || COLORS["default"];
        div.style.cssText = `background-color:${bgColor};color:${getContrastColor(
          bgColor
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
          event.seriesEndDate
        )}</div>`;
        if (event.seriesDates.length > 1) {
          const cellDate = target.closest(".calendar-cell").dataset.cellDate;
          const dayIndex = event.seriesDates.findIndex(
            (d) => formatDate(d) === cellDate
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
      state.currentStartDate.setDate(state.currentStartDate.getDate() - 28);
      updateCalendarView();
    });
  if (dom.nextBtn)
    dom.nextBtn.addEventListener("click", () => {
      state.currentStartDate.setDate(state.currentStartDate.getDate() + 28);
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
      "#daycord-table-container .table-wrapper"
    ),
    resYoyu: document.getElementById("results-yoyu"),
    resDakyo: document.getElementById("results-dakyo"),
    resHiru: document.getElementById("results-hiru"),
    scenarioSel: document.getElementById("scenario-filter-select"),
    presetSel: document.getElementById("preset-filter-select"),
    includePendingCheckbox: document.getElementById("include-pending-checkbox"),
    selectedDatesDisplay: document.getElementById("selected-dates-display"),
    copySelectedDatesBtn: document.getElementById("copy-selected-dates-btn"),
    // ▼▼▼ 変更箇所: 新しいDOM要素を追加 ▼▼▼
    continuousDaysInput: document.getElementById("continuous-days-input"),
    // ▲▲▲ 変更箇所 ▲▲▲
  };
  let daycordNames = [],
    schedule = [],
    selectedNames = [],
    scenarioData = [],
    participantPresets = {},
    selectedDates = [];

  const updateDisplay = () => {
    renderTable();
    calculateAvailableDates();
    updateSelectedDatesDisplay();
    if (dom.clearBtn)
      dom.clearBtn.style.display = selectedNames.length > 0 ? "" : "none";
  };

  const updateSelectedDatesDisplay = () => {
    if (dom.selectedDatesDisplay) {
      const formattedDates = groupAndFormatDatesWithWeekday(selectedDates);
      dom.selectedDatesDisplay.value =
        formattedDates || dom.selectedDatesDisplay.placeholder; // 候補日がない場合はプレースホルダーを使用
    }
  };

  function processScenarioData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const relevantEvents = allEvents.filter(
      (e) =>
        !e.hasDate ||
        (e.seriesEndDate && e.seriesEndDate.getTime() >= today.getTime())
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

  function renderTable() {
    if (!dom.tableCont) return;
    if (selectedNames.length === 0) {
      dom.tableCont.innerHTML =
        "<p>参加者を選択すると、出欠表が表示されます。</p>";
      return;
    }
    const table = document.createElement("table");
    table.className = "daycord-table";
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    headerRow.innerHTML = "<th>参加者</th>";

    schedule.forEach((d) => {
      const th = document.createElement("th");
      const dateStr = d.date.split("(")[0];
      th.dataset.dateCol = dateStr;
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
    const eventRow = tbody.insertRow();
    const eventTitleCell = eventRow.insertCell();
    eventTitleCell.innerHTML = "<strong>予定</strong>";
    schedule.forEach((day) => {
      const cell = eventRow.insertCell();
      const dateStr = day.date.split("(")[0];
      cell.dataset.dateCol = dateStr;
      const parts = dateStr.split("/");
      const key = `${parts[0]}/${String(parts[1]).padStart(2, "0")}/${String(
        parts[2]
      ).padStart(2, "0")}`;
      const eventsOnDay = eventsByDate.get(key) || [];
      if (eventsOnDay.length > 0) cell.classList.add("has-event");
      eventsOnDay.forEach((e) => {
        const bgColor = COLORS[e.system] || COLORS["default"];
        const textColor = getContrastColor(bgColor);
        let tooltipContent = `${e.system}『${
          e.eventName
        }』<br><strong>GM:</strong> ${e.gm || "未定"}`;
        if (e.participants && e.participants.length > 0) {
          tooltipContent += `<br><strong>PL:</strong> ${e.participants.join(
            ", "
          )}`;
        }
        const encodedTooltip = tooltipContent.replace(/"/g, '"');
        const eventDiv = document.createElement("div");
        eventDiv.className = "daycord-event-entry";
        eventDiv.style.cssText = `background-color:${bgColor};color:${textColor};`;
        eventDiv.dataset.tooltipContent = encodedTooltip;
        eventDiv.textContent = e.system;
        cell.appendChild(eventDiv);
      });
    });

    selectedNames.forEach((name) => {
      const nameIndex = daycordNames.indexOf(name);
      if (nameIndex === -1) return;
      const row = tbody.insertRow();
      const nameCell = row.insertCell();
      nameCell.innerHTML = `<button class="remove-participant-btn" data-name="${name}">×</button>${name}`;
      schedule.forEach((day) => {
        const cell = row.insertCell();
        const dateStr = day.date.split("(")[0];
        cell.dataset.dateCol = dateStr;
        const parts = dateStr.split("/");
        const key = `${parts[0]}/${String(parts[1]).padStart(2, "0")}/${String(
          parts[2]
        ).padStart(2, "0")}`;
        const eventsOnDay = eventsByDate.get(key) || [];
        const participantEvent = eventsOnDay.find((e) =>
          [e.gm, ...e.participants].map((p) => getDayCodeName(p)).includes(name)
        );
        if (eventsOnDay.length > 0) {
          cell.classList.add("has-event");
        }
        const span = document.createElement("span");
        span.className = "daycord-status-tag";
        if (participantEvent) {
          cell.classList.add("is-conflicting");
          const system = participantEvent.system;
          const bgColor = COLORS[system] || COLORS["default"];
          span.style.cssText = `background-color:${bgColor}; color:${getContrastColor(
            bgColor
          )};`;
          let tooltipContent = `${system}『${participantEvent.eventName}』<br><strong>GM:</strong> ${participantEvent.gm}`;
          if (participantEvent.participants.length > 0)
            tooltipContent += `<br><strong>PL:</strong> ${participantEvent.participants.join(
              ", "
            )}`;
          cell.dataset.tooltipContent = tooltipContent.replace(/"/g, '"');
          span.textContent = system;
        } else {
          const status = day.availability[nameIndex] || "－";
          const statusClass = `status-${status.replace(
            /[◎〇△×▢－]/g,
            (c) =>
              ({
                "◎": "o",
                〇: "maru",
                "△": "sankaku",
                "×": "batsu",
                "▢": "shikaku",
                "－": "hyphen",
              }[c])
          )}`;
          span.classList.add(statusClass);
          span.textContent = status;
        }
        cell.appendChild(span);
      });
    });
    dom.tableCont.innerHTML = "";
    dom.tableCont.appendChild(table);

    dom.tableCont.querySelectorAll(".date-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const date = e.target.dataset.date;
        const headerCell = dom.tableCont.querySelector(
          `th[data-date-col="${date}"]`
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
        `th[data-date-col="${date}"]`
      );
      if (headerCell) {
        headerCell.classList.add("selected-date-cell");
      }
    });
  }

  // ▼▼▼ 変更箇所: 3つの新しいヘルパー関数を追加 ▼▼▼
  // 1. 連続日数で日付をフィルタリングする関数
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

  // 2. 候補日をHTML要素としてレンダリングする関数
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

  // 3. calculateAvailableDatesを全面的に刷新
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
    const hiruOk = ["◎", "▢"];
    if (dom.includePendingCheckbox && dom.includePendingCheckbox.checked) {
      yoyuOk.push("－");
      dakyoOk.push("－");
    }

    const relevantSchedule = schedule.map((day) => {
      const dateStr = day.date.split("(")[0],
        parts = dateStr.split("/");
      const key = `${parts[0]}/${String(parts[1]).padStart(2, "0")}/${String(
        parts[2]
      ).padStart(2, "0")}`;
      const eventsOnDay = eventsByDate.get(key) || [];
      const relevantAvailability = selectedNames.map((name) => {
        const participantEvent = eventsOnDay.find((e) =>
          [e.gm, ...e.participants].map((p) => getDayCodeName(p)).includes(name)
        );
        if (participantEvent) return "×";
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
  // ▲▲▲ 変更箇所 ▲▲▲

  async function fetchAndProcessData() {
    try {
      dom.tableCont.innerHTML = "<p>各種データを読み込み中です...</p>";
      if (dom.nameSel) dom.nameSel.disabled = true;
      if (dom.addBtn) dom.addBtn.disabled = true;
      if (dom.scenarioSel) dom.scenarioSel.disabled = true;
      if (dom.presetSel) dom.presetSel.disabled = true;
      if (dom.copySelectedDatesBtn) dom.copySelectedDatesBtn.disabled = true;

      const [daycordResponse, presetResponse] = await Promise.all([
        fetch(DAYCORD_PROXY_URL),
        fetch(PRESETS_JSON_URL)
          .then((res) => res.json())
          .catch(() => ({})),
      ]);
      participantPresets = presetResponse;
      const presetFragment = document.createDocumentFragment();
      for (const presetName in participantPresets) {
        const option = document.createElement("option");
        option.value = presetName;
        option.textContent = presetName;
        presetFragment.appendChild(option);
      }
      if (dom.presetSel) {
        dom.presetSel.appendChild(presetFragment);
      }

      const htmlText = await daycordResponse.text();
      const doc = new DOMParser().parseFromString(htmlText, "text/html");
      const table = doc.querySelector("table.schedule_table");
      if (!table) throw new Error("デイコードのテーブルが見つかりません。");

      const headerRow = table.querySelector("tr#namerow"),
        bodyRows = table.querySelectorAll('tbody tr[id^="row_"]');
      const headerCells = Array.from(headerRow.querySelectorAll("th"));
      const symbols = ["◎", "〇", "◯", "△", "×", "▢", "－"];
      daycordNames = headerCells
        .map((th) => th.textContent.trim())
        .filter((name) => name && !symbols.includes(name));

      let rawSchedule = Array.from(bodyRows).map((row) => ({
        date:
          row.querySelector("th.datetitle")?.textContent.trim() || "日付不明",
        availability: Array.from(row.querySelectorAll("td span.statustag")).map(
          (span) => span.textContent.trim().replace(/◯/g, "〇") || "－"
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
          parseInt(dayOfMonth)
        );
        return scheduleDate.getTime() >= today.getTime();
      });

      const sortedNamesForDropdown = [...daycordNames].sort((a, b) =>
        a.localeCompare(b, "ja")
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
    }
  }

  if (dom.addBtn)
    dom.addBtn.addEventListener("click", () => {
      const name = dom.nameSel.value;
      if (name && !selectedNames.includes(name)) {
        selectedNames.push(name);
        updateDisplay();
      }
    });

  if (dom.clearBtn)
    dom.clearBtn.addEventListener("click", () => {
      if (selectedNames.length > 0) {
        selectedNames = [];
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
      if (dom.presetSel) dom.presetSel.value = "";
      if (!eventName) {
        selectedNames = [];
      } else {
        const event = scenarioData.find((d) => d.eventName === eventName);
        if (event) {
          const participantsOnSheet = [event.gm, ...event.participants].filter(
            Boolean
          );
          const participantsOnDaycord = participantsOnSheet.map((name) =>
            getDayCodeName(name)
          );
          selectedNames = [
            ...new Set(
              participantsOnDaycord.filter((name) =>
                daycordNames.includes(name)
              )
            ),
          ];
        }
      }
      updateDisplay();
    });

  if (dom.presetSel)
    dom.presetSel.addEventListener("change", () => {
      const presetName = dom.presetSel.value;
      if (dom.scenarioSel) dom.scenarioSel.value = "";
      if (!presetName) {
        selectedNames = [];
      } else if (presetName === "--all-active--") {
        selectedNames = daycordNames.filter((name, index) =>
          schedule.some((day) => day.availability[index] !== "－")
        );
      } else {
        const presetParticipants = participantPresets[presetName] || [];
        const participantsOnDaycord = presetParticipants.map((name) =>
          getDayCodeName(name)
        );
        selectedNames = [
          ...new Set(
            participantsOnDaycord.filter((name) => daycordNames.includes(name))
          ),
        ];
      }
      updateDisplay();
    });

  if (dom.includePendingCheckbox)
    dom.includePendingCheckbox.addEventListener(
      "change",
      calculateAvailableDates
    );
  // ▼▼▼ 変更箇所: 新しいイベントリスナーを追加 ▼▼▼
  if (dom.continuousDaysInput)
    dom.continuousDaysInput.addEventListener("input", calculateAvailableDates);
  // ▲▲▲ 変更箇所 ▲▲▲

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
}

// --- メイン実行 ---
document.addEventListener("DOMContentLoaded", async () => {
  const { allEvents, eventsByDate } = await getSharedEventData();
  const COLORS = loadSystemColors();
  TooltipManager.init();
  if (document.getElementById("custom-calendar-container")) {
    initializeCalendar({ allEvents, eventsByDate, COLORS });
  }
  if (document.getElementById("daycord-table-container")) {
    initializeDaycordFeature({ allEvents, eventsByDate, COLORS });
  }
});

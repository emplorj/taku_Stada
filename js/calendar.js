document.addEventListener('DOMContentLoaded', function () {
  // --- カレンダー機能の初期化 ---
  if (document.getElementById('custom-calendar-container')) {
    initializeCalendar();
  }
});

// --- カレンダー機能の本体 ---
function initializeCalendar() {
  let allEvents = []; // 全イベントの元データ
  let filteredEvents = []; // 表示対象のイベントデータ
  let currentStartDate;
  let isSecretEventsHidden = false;
  let filterName = '';
  const DAYS_IN_WEEK = 7;
  const WEEKS_TO_DISPLAY = 4;
  let tooltipElement;

  // --- DOM要素の取得 ---
  const calendarGrid = document.getElementById('calendar-grid');
  const prevWeekButton = document.getElementById('prev-week');
  const nextWeekButton = document.getElementById('next-week');
  const currentWeekDisplay = document.getElementById('current-week-display');
  const toggleSecretEventsButton = document.getElementById('toggle-secret-events-btn');
  const nameFilterSelect = document.getElementById('name-filter-select'); // プルダウンに変更

  // --- 色定義の読み込み ---
  const TRPG_SYSTEM_COLORS = {};
  const rootStyles = getComputedStyle(document.documentElement);
  const cssVarToSystemMap = {
    '--color-coc': 'CoC', '--color-coc-secret': 'CoC-㊙', '--color-dx3': 'DX3',
    '--color-sw': 'SW', '--color-sw2-5': 'SW2.5', '--color-nechronica': 'ネクロニカ',
    '--color-satasupe': 'サタスペ', '--color-mamoburu': 'マモブル', '--color-stellar': '銀剣',
    '--color-ar': 'AR2E', '--color-default': 'default'
  };
  for (const cssVar in cssVarToSystemMap) {
    const systemName = cssVarToSystemMap[cssVar];
    const color = rootStyles.getPropertyValue(cssVar).trim();
    if (color) TRPG_SYSTEM_COLORS[systemName] = color;
  }

  // --- メイン処理：データ取得と初期描画 ---
  async function fetchAndProcessData() {
    const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=783716063&single=true&output=csv';
    try {
      const response = await fetch(SPREADSHEET_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const csvText = await response.text();
      let parsedEvents = parseGoogleSheetCSV(csvText);
      let mergedEvents = mergeConsecutiveEvents(parsedEvents);
      allEvents = processSeriesInfo(mergedEvents);
      
      populateNameFilter(allEvents); // ★名前リストをプルダウンに設定する関数を呼び出し
      
      currentStartDate = getSundayOfGivenDate(new Date());
      updateDisplay();
    } catch (error) {
      console.error("Error fetching or parsing CSV:", error);
      if (calendarGrid) calendarGrid.innerHTML = "<p>予定の読み込みに失敗しました。</p>";
    }
  }

  // --- 表示更新のトリガー ---
  function updateDisplay() {
    applyFilters();
    renderCalendar();
    renderScheduleList();
  }

  // --- ★名前フィルターのプルダウンを生成 ---
  function populateNameFilter(events) {
    if (!nameFilterSelect) return;
    const nameSet = new Set();
    events.forEach(event => {
      if (event.gm) nameSet.add(event.gm);
      event.participants.forEach(p => nameSet.add(p));
    });

    const sortedNames = [...nameSet].sort((a, b) => a.localeCompare(b, 'ja'));
    
    // 既存のオプション（"全員"以外）をクリア
    while (nameFilterSelect.options.length > 1) {
      nameFilterSelect.remove(1);
    }
    
    sortedNames.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      nameFilterSelect.appendChild(option);
    });
  }

  // --- フィルター処理 ---
  function applyFilters() {
    let events = [...allEvents];
    if (isSecretEventsHidden) {
      events = events.filter(event => event.system !== 'CoC-㊙');
    }
    if (filterName) {
      events = events.filter(event => {
        const gmMatch = event.gm === filterName;
        const plMatch = event.participants.includes(filterName);
        return gmMatch || plMatch;
      });
    }
    filteredEvents = events;
  }

  // --- CSVパーサー ---
  function parseGoogleSheetCSV(csvText) {
    const rows = parseCsvToArray(csvText);
    const events = [];
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i];
      const normalize = (str) => (typeof str !== 'string' || !str) ? '' : str.replace(/　/g, ' ').trim().replace(/\s+/g, ' ');
      
      if (values && values.length > 3 && values[1] && values[2] && values[3]) {
        const dateStrRaw = values[1];
        const system = normalize(values[2]);
        const eventName = normalize(values[3]);
        const gm = normalize(values.length > 4 ? values[4] : '');
        const participants = Array.from({length: 6}, (_, j) => normalize(values[5 + j])).filter(Boolean);
        if (!dateStrRaw) continue;
        const dateOnlyStr = dateStrRaw.split('(')[0].trim();
        const parts = dateOnlyStr.split('/');
        if (parts.length !== 3) continue;
        const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (isNaN(date.getTime())) continue;
        events.push({ date, endDate: new Date(date), system, eventName, gm, participants });
      }
    }
    return events;
  }

  // --- 連続日イベントのマージ ---
  function mergeConsecutiveEvents(events) {
    if (!events || events.length === 0) return [];
    const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
    const merged = []; let currentGroup = null;
    for (const event of sortedEvents) {
      if (currentGroup && currentGroup.system === event.system && currentGroup.eventName === event.eventName && (currentGroup.gm || '') === (event.gm || '') && areParticipantArraysEqual(currentGroup.participants, event.participants) && isNextDay(currentGroup.endDate, event.date)) {
        currentGroup.endDate = new Date(event.date);
      } else {
        if (currentGroup) merged.push(currentGroup);
        currentGroup = { ...event, endDate: new Date(event.date) };
      }
    }
    if (currentGroup) merged.push(currentGroup);
    return merged;
  }
  
  // --- シリーズ情報の処理 ---
  function processSeriesInfo(mergedEvents) {
      const getSeriesKey = (event) => { const participantsKey = event.participants ? [...event.participants].sort().join(',') : ''; return `${(event.eventName || '').trim()}|${(event.system || '').trim()}|${(event.gm || '').trim()}|${participantsKey}`; };
      const seriesMap = new Map();
      mergedEvents.forEach(event => { const key = getSeriesKey(event); if (!seriesMap.has(key)) seriesMap.set(key, []); seriesMap.get(key).push(event); });
      seriesMap.forEach(seriesBlocks => {
          seriesBlocks.sort((a, b) => a.date.getTime() - b.date.getTime());
          const allDatesInSeries = [];
          seriesBlocks.forEach(block => {
              let currentDate = new Date(block.date);
              while (currentDate.getTime() <= block.endDate.getTime()) {
                  allDatesInSeries.push(new Date(currentDate));
                  currentDate.setDate(currentDate.getDate() + 1);
              }
          });
          allDatesInSeries.sort((a, b) => a.getTime() - b.getTime());
          const seriesStartDate = allDatesInSeries[0];
          const seriesEndDate = allDatesInSeries[allDatesInSeries.length - 1];
          seriesBlocks.forEach(block => {
              block.seriesDates = allDatesInSeries;
              block.seriesStartDate = seriesStartDate;
              block.seriesEndDate = seriesEndDate;
          });
      });
      return mergedEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // --- カレンダー描画 ---
  function renderCalendar() {
    if (!calendarGrid || !currentStartDate) return;
    calendarGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const displayEndDate = new Date(currentStartDate); displayEndDate.setDate(currentStartDate.getDate() + (DAYS_IN_WEEK * WEEKS_TO_DISPLAY) - 1);
    if (currentWeekDisplay) currentWeekDisplay.textContent = `${formatDate(currentStartDate)} - ${formatDate(displayEndDate)}`;
    ['日', '月', '火', '水', '木', '金', '土'].forEach((day, index) => { const dayHeader = document.createElement('div'); dayHeader.className = 'calendar-header-cell'; dayHeader.textContent = day; if (index === 0) dayHeader.classList.add('sunday-header'); if (index === 6) dayHeader.classList.add('saturday-header'); fragment.appendChild(dayHeader); });
    let tempDate = new Date(currentStartDate);
    for (let i = 0; i < WEEKS_TO_DISPLAY * DAYS_IN_WEEK; i++) {
      const cell = document.createElement('div'); cell.className = 'calendar-cell'; cell.dataset.cellDate = formatDateToDash(tempDate);
      const dateNumberDiv = document.createElement('div'); dateNumberDiv.className = 'date-number'; dateNumberDiv.textContent = tempDate.getDate(); cell.appendChild(dateNumberDiv);
      const dayOfWeek = tempDate.getDay(); if (dayOfWeek === 0) dateNumberDiv.classList.add('sunday-date-number'); else if (dayOfWeek === 6) dateNumberDiv.classList.add('saturday-date-number');
      const eventsOnThisDay = filteredEvents.filter(event => tempDate.getTime() >= event.date.getTime() && tempDate.getTime() <= event.endDate.getTime());
      if (eventsOnThisDay.length > 0) {
        const eventsContainer = document.createElement('div'); eventsContainer.className = 'events-container';
        eventsOnThisDay.forEach(event => {
          const eventDiv = document.createElement('div'); eventDiv.className = 'event-entry';
          Object.assign(eventDiv.dataset, { gm: event.gm, participants: event.participants.join(', '), system: event.system, eventName: event.eventName });
          let actualDayInfo = '';
          if (event.seriesDates && event.seriesDates.length > 1) {
              const dayIndex = event.seriesDates.findIndex(d => d.getTime() === tempDate.getTime());
              if (dayIndex !== -1) actualDayInfo = `（Day${dayIndex + 1}）`;
          }
          eventDiv.dataset.dayInfo = actualDayInfo;
          const bgColor = TRPG_SYSTEM_COLORS[event.system] || TRPG_SYSTEM_COLORS['default'];
          eventDiv.textContent = `${event.system}『${event.eventName}』`;
          Object.assign(eventDiv.style, { backgroundColor: bgColor, color: getContrastYIQ(bgColor), borderLeftColor: bgColor });
          eventsContainer.appendChild(eventDiv);
        });
        cell.appendChild(eventsContainer);
      }
      const today = new Date(); today.setHours(0, 0, 0, 0); if (tempDate.getTime() === today.getTime()) { cell.classList.add('today'); dateNumberDiv.classList.add('today-date-number'); }
      if (tempDate.getTime() < today.getTime()) cell.classList.add('past-date');
      fragment.appendChild(cell); tempDate.setDate(tempDate.getDate() + 1);
    }
    calendarGrid.appendChild(fragment);
  }

  // --- 予定リスト描画 ---
  function renderScheduleList() {
    const scheduleBody = document.getElementById('schedule-list-body'); if (!scheduleBody) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const seriesMap = new Map();
    filteredEvents.forEach(event => {
        const participantsKey = event.participants ? [...event.participants].sort().join(',') : '';
        const seriesKey = `${(event.eventName || '').trim()}|${(event.system || '').trim()}|${(event.gm || '').trim()}|${participantsKey}`;
        if (!seriesMap.has(seriesKey) && event.seriesEndDate.getTime() >= today.getTime()) {
            seriesMap.set(seriesKey, { system: event.system, eventName: event.eventName, startDate: event.seriesStartDate, endDate: event.seriesEndDate, gm: event.gm, participants: event.participants });
        }
    });
    const futureSeries = Array.from(seriesMap.values()).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    scheduleBody.innerHTML = '';
    if (futureSeries.length === 0) {
      scheduleBody.innerHTML = '<tr><td colspan="5">該当する予定はありません。</td></tr>';
      return;
    }
    const fragment = document.createDocumentFragment();
    const dateFormatter = new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' });
    futureSeries.forEach(series => {
      const row = document.createElement('tr');
      const systemColor = TRPG_SYSTEM_COLORS[series.system] || TRPG_SYSTEM_COLORS['default'];
      const textColor = getContrastYIQ(systemColor);
      row.innerHTML = `<td><span class="schedule-system-tag" style="background-color:${systemColor}; color:${textColor};">${series.system}</span>『${series.eventName}』</td><td>${dateFormatter.format(series.startDate)}</td><td>${dateFormatter.format(series.endDate)}</td><td>${series.gm || 'N/A'}</td><td>${series.participants.join(', ') || 'N/A'}</td>`;
      fragment.appendChild(row);
    });
    scheduleBody.appendChild(fragment);
  }

  // --- ツールチップ表示 ---
  function showTooltip(event) {
    const target = event.target.closest('.event-entry'); if (!target) return;
    const { gm, participants: participantsString, dayInfo: dayInfoFromDataset, eventName, system } = target.dataset;
    const targetDate = new Date(target.closest('.calendar-cell').dataset.cellDate + 'T00:00:00');
    const targetParticipantsArray = participantsString ? participantsString.split(', ').map(p => p.trim()) : [];
    const eventBlock = filteredEvents.find(ev => targetDate.getTime() >= ev.date.getTime() && targetDate.getTime() <= ev.endDate.getTime() && ev.eventName === eventName && ev.system === system && (ev.gm || '') === (gm || '') && areParticipantArraysEqual(ev.participants, targetParticipantsArray));
    if (!tooltipElement) { tooltipElement = document.createElement('div'); tooltipElement.className = 'event-tooltip'; document.body.appendChild(tooltipElement); }
    let tooltipContent = '';
    if (gm) tooltipContent += `<strong>GM:</strong> ${gm}<br>`;
    if (participantsString) tooltipContent += `<strong>PL:</strong> ${participantsString}<br>`;
    if (eventBlock && eventBlock.seriesStartDate && eventBlock.seriesEndDate) {
        tooltipContent += `<div class="event-duration-info">期間: ${formatEventPeriod(eventBlock.seriesStartDate, eventBlock.seriesEndDate)}</div>`;
        if (dayInfoFromDataset) {
            const cleanedDayInfo = dayInfoFromDataset.replace(/[（）]/g, '');
            if (cleanedDayInfo.trim()) tooltipContent += `<div class="event-day-info">${cleanedDayInfo}</div>`;
        }
    }
    tooltipElement.innerHTML = tooltipContent;
    tooltipElement.style.display = 'block';
  }
  function hideTooltip() { if (tooltipElement) tooltipElement.style.display = 'none'; }
  
  // --- イベントリスナー設定 ---
  if (prevWeekButton) prevWeekButton.addEventListener('click', () => { if (currentStartDate) { currentStartDate.setDate(currentStartDate.getDate() - DAYS_IN_WEEK); renderCalendar(); } });
  if (nextWeekButton) nextWeekButton.addEventListener('click', () => { if (currentStartDate) { currentStartDate.setDate(currentStartDate.getDate() + DAYS_IN_WEEK); renderCalendar(); } });
  if (calendarGrid) {
    calendarGrid.addEventListener('mouseover', showTooltip);
    calendarGrid.addEventListener('mouseout', hideTooltip);
    calendarGrid.addEventListener('mousemove', (e) => { if (tooltipElement && tooltipElement.style.display === 'block') { tooltipElement.style.left = `${e.pageX + 15}px`; tooltipElement.style.top = `${e.pageY + 15}px`; } });
  }
  if (toggleSecretEventsButton) {
    toggleSecretEventsButton.addEventListener('change', () => {
      isSecretEventsHidden = toggleSecretEventsButton.checked;
      updateDisplay();
    });
    toggleSecretEventsButton.checked = isSecretEventsHidden;
  }
  if (nameFilterSelect) { // ★リスナーをselect要素に変更
    nameFilterSelect.addEventListener('change', () => {
      filterName = nameFilterSelect.value; // ★valueを取得
      updateDisplay();
    });
  }
  
  // --- ヘルパー関数 ---
  function areParticipantArraysEqual(arr1, arr2) { if (!arr1 && !arr2) return true; if (!arr1 || !arr2 || arr1.length !== arr2.length) return false; const sortedArr1 = [...arr1].sort(); const sortedArr2 = [...arr2].sort(); return sortedArr1.every((value, index) => value === sortedArr2[index]); }
  function getSundayOfGivenDate(date) { const newDate = new Date(date); newDate.setDate(newDate.getDate() - newDate.getDay()); newDate.setHours(0, 0, 0, 0); return newDate; }
  function formatDate(date) { return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`; }
  function formatDateToDash(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  function formatEventPeriod(startDate, endDate) { const sy = startDate.getFullYear(), sm = startDate.getMonth() + 1, sd = startDate.getDate(); const ey = endDate.getFullYear(), em = endDate.getMonth() + 1, ed = endDate.getDate(); const startStr = `${sy}/${sm}/${sd}`; if (sy === ey && sm === em && sd === ed) return startStr; if (sy === ey && sm === em) return `${startStr}-${ed}`; if (sy === ey) return `${startStr}-${em}/${ed}`; return `${startStr}-${ey}/${em}/${ed}`; }
  function getContrastYIQ(hexcolor) { hexcolor = hexcolor.replace("#", ""); const r = parseInt(hexcolor.substr(0, 2), 16), g = parseInt(hexcolor.substr(2, 2), 16), b = parseInt(hexcolor.substr(4, 2), 16); return ((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128 ? '#000000' : '#FFFFFF'; }
  
  // --- 初期化実行 ---
  fetchAndProcessData();
}
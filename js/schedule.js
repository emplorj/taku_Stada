document.addEventListener('DOMContentLoaded', function () {
  // --- カレンダー機能の初期化 ---
  if (document.getElementById('custom-calendar-container')) {
    initializeCalendar();
  }
});

// --- カレンダー機能の本体 ---
function initializeCalendar() {
  let allEvents = [];
  let currentStartDate;
  const calendarGrid = document.getElementById('calendar-grid');
  const prevWeekButton = document.getElementById('prev-week');
  const nextWeekButton = document.getElementById('next-week');
  const currentWeekDisplay = document.getElementById('current-week-display');
  const DAYS_IN_WEEK = 7;
  const WEEKS_TO_DISPLAY = 4;
  let tooltipElement;

  // CSS変数からTRPGシステムの色を取得し、TRPG_SYSTEM_COLORSオブジェクトを構築
  const TRPG_SYSTEM_COLORS = {};
  const rootStyles = getComputedStyle(document.documentElement);

  // CSS変数名とTRPGシステム名のマッピングを定義
  const cssVarToSystemMap = {
    '--color-coc': 'CoC',
    '--color-coc-secret': 'CoC-㊙',
    '--color-dx3': 'DX3',
    '--color-sw': 'SW', // SWとSW2.5は同じ色
    '--color-sw2-5': 'SW2.5',
    '--color-nechronica': 'ネクロニカ',
    '--color-satasupe': 'サタスペ',
    '--color-mamoburu': 'マモブル',
    '--color-stellar': '銀剣',
    '--color-ar': 'AR2E', // AR2Eは--color-arを使用
    '--color-default': 'default'
  };

  for (const cssVar in cssVarToSystemMap) {
    const systemName = cssVarToSystemMap[cssVar];
    const color = rootStyles.getPropertyValue(cssVar).trim();
    if (color) {
      TRPG_SYSTEM_COLORS[systemName] = color;
    }
  }

  async function fetchEventsAndRenderCalendar() {
    const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=783716063&single=true&output=csv';
    try {
      const response = await fetch(SPREADSHEET_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const csvText = await response.text();
      let parsedEvents = parseGoogleSheetCSV(csvText);
      allEvents = mergeConsecutiveEvents(parsedEvents);
      // マージされたイベントに対してシリーズ情報を付与
      const getSeriesKey = (event) => { const participantsKey = event.participants ? [...event.participants].sort().join(',') : ''; return `${(event.eventName || '').trim()}|${(event.system || '').trim()}|${(event.gm || '').trim()}|${participantsKey}`; };
      const seriesMap = new Map();
      allEvents.forEach(event => { const key = getSeriesKey(event); if (!seriesMap.has(key)) seriesMap.set(key, []); seriesMap.get(key).push(event); });
      seriesMap.forEach(series => { series.sort((a, b) => a.date.getTime() - b.date.getTime()); const seriesDates = series.map(e => e.date); series.forEach((event, index) => { event.dayInSeries = index + 1; event.seriesDates = seriesDates; event.seriesStartDate = series[0].date; event.seriesEndDate = series[series.length - 1].date; }); });
      allEvents.sort((a, b) => a.date.getTime() - b.date.getTime()); // 再度ソート
      currentStartDate = getSundayOfGivenDate(new Date());
      renderCalendar();
      renderScheduleList(allEvents);
    } catch (error) {
      console.error("Error fetching or parsing CSV:", error);
      if (calendarGrid) calendarGrid.innerHTML = "<p>予定の読み込みに失敗しました。</p>";
    }
  }
  function parseGoogleSheetCSV(csvText) {
    const rows = parseCsvToArray(csvText); // common.jsの関数を利用
    const events = [];
    // ヘッダー行を除外するため、i=1から開始
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i];
      const normalize = (str) => (typeof str !== 'string' || !str) ? '' : str.replace(/　/g, ' ').trim().replace(/\s+/g, ' ');
      
      // 列の存在チェックをより安全に
      if (values && values.length > 3 && values[1] && values[2] && values[3]) {
        const dateStrRaw = values[1];
        const system = normalize(values[2]);
        const eventName = normalize(values[3]);
        const gm = normalize(values.length > 4 ? values[4] : '');
        
        const participants = [];
        for (let p_idx = 5; p_idx <= 10; p_idx++) {
          if (values.length > p_idx && values[p_idx]) {
            let pName = normalize(values[p_idx]); // ダブルクォート除去はparseCsvToArrayが処理するので不要
            if (pName) participants.push(pName);
          }
        }
        
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
  function areParticipantArraysEqual(arr1, arr2) { if (!arr1 && !arr2) return true; if (!arr1 || !arr2 || arr1.length !== arr2.length) return false; const sortedArr1 = [...arr1].sort(); const sortedArr2 = [...arr2].sort(); return sortedArr1.every((value, index) => value === sortedArr2[index]); }
  function isNextDay(date1, date2) { const nextDay = new Date(date1); nextDay.setDate(nextDay.getDate() + 1); return nextDay.getFullYear() === date2.getFullYear() && nextDay.getMonth() === date2.getMonth() && nextDay.getDate() === date2.getDate(); }
  function getSundayOfGivenDate(date) { const newDate = new Date(date); newDate.setDate(newDate.getDate() - newDate.getDay()); newDate.setHours(0, 0, 0, 0); return newDate; }
  function formatDate(date) { return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`; }
  function formatDateToDash(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  function formatEventPeriod(startDate, endDate) { const sy = startDate.getFullYear(), sm = startDate.getMonth() + 1, sd = startDate.getDate(); const ey = endDate.getFullYear(), em = endDate.getMonth() + 1, ed = endDate.getDate(); const startStr = `${sy}/${sm}/${sd}`; if (sy === ey && sm === em && sd === ed) return startStr; if (sy === ey && sm === em) return `${startStr}-${ed}`; if (sy === ey) return `${startStr}-${em}/${ed}`; return `${startStr}-${ey}/${em}/${ed}`; }
  function getContrastYIQ(hexcolor) { hexcolor = hexcolor.replace("#", ""); const r = parseInt(hexcolor.substr(0, 2), 16), g = parseInt(hexcolor.substr(2, 2), 16), b = parseInt(hexcolor.substr(4, 2), 16); return ((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128 ? '#000000' : '#FFFFFF'; }
  function renderCalendar() {
    if (!calendarGrid || !currentStartDate) return;
    calendarGrid.innerHTML = '';
    const displayEndDate = new Date(currentStartDate); displayEndDate.setDate(currentStartDate.getDate() + (DAYS_IN_WEEK * WEEKS_TO_DISPLAY) - 1);
    if (currentWeekDisplay) currentWeekDisplay.textContent = `${formatDate(currentStartDate)} - ${formatDate(displayEndDate)}`;
    ['日', '月', '火', '水', '木', '金', '土'].forEach((day, index) => { const dayHeader = document.createElement('div'); dayHeader.className = 'calendar-header-cell'; dayHeader.textContent = day; if (index === 0) dayHeader.classList.add('sunday-header'); if (index === 6) dayHeader.classList.add('saturday-header'); calendarGrid.appendChild(dayHeader); });
    let tempDate = new Date(currentStartDate);
    for (let i = 0; i < WEEKS_TO_DISPLAY * DAYS_IN_WEEK; i++) {
      const cell = document.createElement('div'); cell.className = 'calendar-cell'; cell.dataset.cellDate = formatDateToDash(tempDate);
      const dateNumberDiv = document.createElement('div'); dateNumberDiv.className = 'date-number'; dateNumberDiv.textContent = tempDate.getDate(); cell.appendChild(dateNumberDiv);
      const dayOfWeek = tempDate.getDay(); if (dayOfWeek === 0) dateNumberDiv.classList.add('sunday-date-number'); else if (dayOfWeek === 6) dateNumberDiv.classList.add('saturday-date-number');
      const eventsOnThisDay = allEvents.filter(event => tempDate.getTime() >= event.date.getTime() && tempDate.getTime() <= event.endDate.getTime());
      if (eventsOnThisDay.length > 0) {
        const eventsContainer = document.createElement('div'); eventsContainer.className = 'events-container';
        eventsOnThisDay.forEach(event => {
          const eventDiv = document.createElement('div'); eventDiv.className = 'event-entry';
          Object.assign(eventDiv.dataset, { gm: event.gm, participants: event.participants.join(', '), system: event.system, eventName: event.eventName, startDate: formatDateToDash(event.date), endDate: formatDateToDash(event.endDate) });
          let actualDayInfo = ''; if (event.seriesDates && event.seriesDates.length > 1) { const dayIndex = event.seriesDates.findIndex(d => d.getTime() === tempDate.getTime()); if (dayIndex !== -1) actualDayInfo = `（Day${dayIndex + 1}）`; }
          eventDiv.dataset.dayInfo = actualDayInfo;
          const bgColor = TRPG_SYSTEM_COLORS[event.system] || TRPG_SYSTEM_COLORS['default'];
          eventDiv.textContent = `${event.system}『${event.eventName}』`; Object.assign(eventDiv.style, { backgroundColor: bgColor, color: getContrastYIQ(bgColor), borderLeftColor: bgColor });
          eventsContainer.appendChild(eventDiv);
        });
        cell.appendChild(eventsContainer);
      }
      const today = new Date(); today.setHours(0, 0, 0, 0); if (tempDate.getTime() === today.getTime()) { cell.classList.add('today'); dateNumberDiv.classList.add('today-date-number'); }
      if (tempDate.getTime() < today.getTime()) cell.classList.add('past-date');
      calendarGrid.appendChild(cell); tempDate.setDate(tempDate.getDate() + 1);
    }
  }
  function renderScheduleList(events) {
    const scheduleBody = document.getElementById('schedule-list-body'); if (!scheduleBody) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const seriesMap = new Map();
    events.forEach(event => { const participantsKey = event.participants ? [...event.participants].sort().join(',') : ''; const seriesKey = `${(event.eventName || '').trim()}|${(event.system || '').trim()}|${(event.gm || '').trim()}|${participantsKey}`; if (!seriesMap.has(seriesKey) && event.seriesEndDate.getTime() >= today.getTime()) { seriesMap.set(seriesKey, { system: event.system, eventName: event.eventName, startDate: event.seriesStartDate, endDate: event.seriesEndDate, gm: event.gm, participants: event.participants }); } });
    const futureSeries = Array.from(seriesMap.values()); futureSeries.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    scheduleBody.innerHTML = ''; if (futureSeries.length === 0) { scheduleBody.innerHTML = '<tr><td colspan="5">今後の予定はありません。</td></tr>'; return; }
    const dateFormatter = new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' });
    futureSeries.forEach(series => {
      const row = document.createElement('tr');
      // TRPG_SYSTEM_COLORSから適切な色を取得
      const systemColor = TRPG_SYSTEM_COLORS[series.system] || TRPG_SYSTEM_COLORS['default'];
      const textColor = getContrastYIQ(systemColor);
      row.innerHTML = `<td><span class="schedule-system-tag" style="background-color:${systemColor}; color:${textColor};">${series.system}</span>『${series.eventName}』</td><td>${dateFormatter.format(series.startDate)}</td><td>${dateFormatter.format(series.endDate)}</td><td>${series.gm || 'N/A'}</td><td>${series.participants.join(', ') || 'N/A'}</td>`;
      scheduleBody.appendChild(row);
    });
  }
  function showTooltip(event) {
    const target = event.target.closest('.event-entry'); if (!target) return;
    const { gm, participants: participantsString, dayInfo: dayInfoFromDataset, eventName, system } = target.dataset;
    let seriesMinDate = null, seriesMaxDate = null;
    const targetDate = new Date(target.closest('.calendar-cell').dataset.cellDate + 'T00:00:00');
    const targetParticipantsArray = participantsString ? participantsString.split(', ').map(p => p.trim()) : [];
    const eventBlock = allEvents.find(ev => targetDate.getTime() >= ev.date.getTime() && targetDate.getTime() <= ev.endDate.getTime() && ev.eventName === eventName && ev.system === system && (ev.gm || '') === (gm || '') && areParticipantArraysEqual(ev.participants, targetParticipantsArray));
    if (eventBlock && eventBlock.seriesStartDate && eventBlock.seriesEndDate) { seriesMinDate = eventBlock.seriesStartDate; seriesMaxDate = eventBlock.seriesEndDate; }
    if (!tooltipElement) { tooltipElement = document.createElement('div'); tooltipElement.className = 'event-tooltip'; document.body.appendChild(tooltipElement); }
    let tooltipContent = ''; if (gm) tooltipContent += `<strong>GM:</strong> ${gm}<br>`; if (participantsString) tooltipContent += `<strong>PL:</strong> ${participantsString}<br>`;
    let eventStartDateForTooltip, eventEndDateForTooltip, datesAreValid = false;
    if (seriesMinDate && seriesMaxDate) { [eventStartDateForTooltip, eventEndDateForTooltip, datesAreValid] = [seriesMinDate, seriesMaxDate, true]; }
    if (datesAreValid) { tooltipContent += `<div class="event-duration-info">期間: ${formatEventPeriod(eventStartDateForTooltip, eventEndDateForTooltip)}</div>`; if (dayInfoFromDataset) { const cleanedDayInfo = dayInfoFromDataset.replace(/[（）]/g, ''); if (cleanedDayInfo.trim()) tooltipContent += `<div class="event-day-info">${cleanedDayInfo}</div>`; } }
    tooltipElement.innerHTML = tooltipContent; tooltipElement.style.display = 'block';
  }
  function hideTooltip() { if (tooltipElement) tooltipElement.style.display = 'none'; }
  if (prevWeekButton) prevWeekButton.addEventListener('click', () => { if (currentStartDate) { currentStartDate.setDate(currentStartDate.getDate() - DAYS_IN_WEEK); renderCalendar(); } });
  if (nextWeekButton) nextWeekButton.addEventListener('click', () => { if (currentStartDate) { currentStartDate.setDate(currentStartDate.getDate() + DAYS_IN_WEEK); renderCalendar(); } });
  if (calendarGrid) {
    calendarGrid.addEventListener('mouseover', showTooltip);
    calendarGrid.addEventListener('mouseout', hideTooltip);
    calendarGrid.addEventListener('mousemove', (e) => { if (tooltipElement && tooltipElement.style.display === 'block') { tooltipElement.style.left = `${e.pageX + 15}px`; tooltipElement.style.top = `${e.pageY + 15}px`; } });
  }
  fetchEventsAndRenderCalendar();
}
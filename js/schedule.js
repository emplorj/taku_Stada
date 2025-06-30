// ==========================================================================
//   SCHEDULE.JS - 表示改善・最終版
// ==========================================================================

// --- グローバル設定と共通ヘルパー関数 ---
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=783716063&single=true&output=csv';
const DAYCORD_PROXY_URL = 'https://corsproxy.io/?' + encodeURIComponent('https://character-sheets.appspot.com/schedule/list?key=ahVzfmNoYXJhY3Rlci1zaGVldHMtbXByHAsSEkRpc2NvcmRTZXNzaW9uRGF0YRimu5y4BQw');
const PRESETS_JSON_URL = 'presets.json';

const NAME_ALIASES = {
    "vara": "☭",
    "くれいど": "qre1d/くれいど",
    "viw": "ゔぃｗ",
};

// (ヘルパー関数群は変更ないため、ここでは省略します)
function parseCsvToArray(csvText) { const rows = []; let currentRow = []; let inQuotes = false; let currentField = ''; csvText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n'); for (let i = 0; i < csvText.length; i++) { const char = csvText[i]; if (inQuotes) { if (char === '"' && (i + 1 < csvText.length && csvText[i + 1] === '"')) { currentField += '"'; i++; } else if (char === '"') { inQuotes = false; } else { currentField += char; } } else { if (char === '"') { inQuotes = true; } else if (char === ',') { currentRow.push(currentField); currentField = ''; } else if (char === '\n') { currentRow.push(currentField); rows.push(currentRow); currentRow = []; currentField = ''; } else { currentField += char; } } } if (currentField || currentRow.length > 0) { currentRow.push(currentField); rows.push(currentRow); } return rows.filter(row => row.length > 1 || (row.length === 1 && row[0])); }
function isNextDay(d1, d2) { const n = new Date(d1); n.setDate(n.getDate() + 1); return n.getFullYear() === d2.getFullYear() && n.getMonth() === d2.getMonth() && n.getDate() === d2.getDate(); }
function getSunday(d) { const n = new Date(d); n.setDate(n.getDate() - n.getDay()); n.setHours(0,0,0,0); return n; }
function formatDate(d) { return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`; }
function formatPeriod(start, end) { const s = {y:start.getFullYear(),m:start.getMonth()+1,d:start.getDate()}, e = {y:end.getFullYear(),m:end.getMonth()+1,d:end.getDate()}; const sStr = `${s.y}/${s.m}/${s.d}`; if(s.y===e.y&&s.m===e.m&&s.d===e.d) return sStr; if(s.y===e.y&&s.m===e.m) return `${s.y}/${s.m}/${s.d}-${e.d}`; if(s.y===e.y) return `${s.y}/${s.m}/${s.d} - ${e.m}/${e.d}`; return `${s.y}/${s.m}/${s.d} - ${e.y}/${e.m}/${e.d}`; }
const formatShortDate = (fullDate) => fullDate.length > 5 ? fullDate.substring(5) : fullDate;
function areArraysEqual(a1, a2) { if (!a1 && !a2) return true; if (!a1 || !a2 || a1.length !== a2.length) return false; const s1 = [...a1].sort(), s2 = [...a2].sort(); return s1.every((v, i) => v === s2[i]); }
function getContrastColor(hex) { if (!hex) return '#000000'; hex = hex.replace("#", ""); const r = parseInt(hex.substr(0,2),16), g = parseInt(hex.substr(2,2),16), b = parseInt(hex.substr(4,2),16); return ((r*299)+(g*587)+(b*114))/1000 >= 128 ? '#000000' : '#FFFFFF'; }
function getDayCodeName(name) { return NAME_ALIASES[name] || name; }
function loadSystemColors() { const colors = {}; const styles = getComputedStyle(document.documentElement); const map={'--color-coc':'CoC','--color-coc-secret':'CoC-㊙','--color-dx3':'DX3','--color-sw':'SW','--color-sw2-5':'SW2.5','--color-nechronica':'ネクロニカ','--color-satasupe':'サタスペ','--color-mamoburu':'マモブル','--color-stellar':'銀剣','--color-ar':'AR2E','--color-default':'default'}; for(const cssVar in map){ const color = styles.getPropertyValue(cssVar).trim(); if(color) colors[map[cssVar]] = color; } return colors; }

async function getSharedEventData() {
    try {
        const response = await fetch(SPREADSHEET_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const csvText = await response.text();
        const rows = parseCsvToArray(csvText);
        let rawEvents = [];
        const normalize = (str) => (typeof str !== 'string' || !str) ? '' : str.replace(/　/g, ' ').trim().replace(/\s+/g, ' ');

        for (let i = 1; i < rows.length; i++) {
            const values = rows[i];
            if (!values || values.length < 4 || !normalize(values[3])) continue;

            const eventName = normalize(values[3]);
            const system = normalize(values[2]);
            const gm = normalize(values[4] || '');
            const participants = Array.from({length: 6}, (_, j) => normalize(values[5 + j])).filter(Boolean);
            const dateStr = (values[1] || '').split('(')[0].trim();
            const parts = dateStr.split('/');
            
            let eventData = { id: `event-${i}`, system, eventName, gm, participants, hasDate: false };

            if (parts.length === 3) {
                const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                if (!isNaN(date.getTime())) {
                    eventData.date = date;
                    eventData.endDate = new Date(date);
                    eventData.hasDate = true;
                }
            }
            rawEvents.push(eventData);
        }

        const datedEvents = rawEvents.filter(e => e.hasDate).sort((a, b) => a.date.getTime() - b.date.getTime());
        const mergedEvents = [];
        let currentGroup = null;
        for (const event of datedEvents) {
            if (currentGroup && currentGroup.system === event.system && currentGroup.eventName === event.eventName && (currentGroup.gm || '') === (event.gm || '') && areArraysEqual(currentGroup.participants, event.participants) && isNextDay(currentGroup.endDate, event.date)) {
                currentGroup.endDate = new Date(event.date);
            } else {
                if (currentGroup) mergedEvents.push(currentGroup);
                currentGroup = { ...event };
            }
        }
        if (currentGroup) mergedEvents.push(currentGroup);

        const seriesMap = new Map();
        const getSeriesKey = (e) => { const pKey = e.participants ? [...e.participants].sort().join(',') : ''; return `${(e.eventName||'').trim()}|${(e.system||'').trim()}|${(e.gm||'').trim()}|${pKey}`; };
        mergedEvents.forEach(e => {
            const key = getSeriesKey(e);
            if (!seriesMap.has(key)) seriesMap.set(key, []);
            seriesMap.get(key).push(e);
        });
        seriesMap.forEach(blocks => {
            blocks.sort((a, b) => a.date.getTime() - b.date.getTime());
            const allDates = [];
            blocks.forEach(b => {
                let d = new Date(b.date);
                while(d.getTime() <= b.endDate.getTime()) {
                    allDates.push(new Date(d));
                    d.setDate(d.getDate() + 1);
                }
            });
            allDates.sort((a, b) => a.getTime() - b.getTime());
            blocks.forEach(b => {
                b.seriesDates = allDates;
                b.seriesStartDate = allDates[0];
                b.seriesEndDate = allDates[allDates.length - 1];
            });
        });

        const allEvents = [...mergedEvents, ...rawEvents.filter(e => !e.hasDate)];
        const eventsByDate = new Map();
        mergedEvents.forEach(e => {
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
const TooltipManager = { element: null, init() { if (this.element) return; this.element = document.createElement('div'); this.element.className = 'event-tooltip'; document.body.appendChild(this.element); }, show(content, event) { this.element.innerHTML = content; this.element.style.display = 'block'; this.move(event); }, hide() { this.element.style.display = 'none'; }, move(event) { if (this.element.style.display === 'block') { this.element.style.left = `${event.pageX + 15}px`; this.element.style.top = `${event.pageY + 15}px`; } } };
function initializeCalendar({ allEvents, eventsByDate, COLORS }) {
    const grid = document.getElementById('calendar-grid');
    const weekDisplay = document.getElementById('current-week-display');
    const prevBtn = document.getElementById('prev-week');
    const nextBtn = document.getElementById('next-week');
    const nameFilter = document.getElementById('name-filter-select');
    const secretToggle = document.getElementById('toggle-secret-events-btn');
    const scheduleListBody = document.getElementById('schedule-list-body');

    let currentSunday = getSunday(new Date());

    function renderCalendar() {
        grid.innerHTML = '';
        const startDate = currentSunday;
        const endDate = new Date(startDate.getTime() + (28 - 1) * 24 * 60 * 60 * 1000);
        weekDisplay.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
        
        const fragment = document.createDocumentFragment();
        const headers = ['日', '月', '火', '水', '木', '金', '土'];
        headers.forEach((day, i) => {
            const headerCell = document.createElement('div');
            headerCell.className = 'calendar-header-cell';
            if (i === 0) headerCell.classList.add('sunday-header');
            if (i === 6) headerCell.classList.add('saturday-header');
            headerCell.textContent = day;
            fragment.appendChild(headerCell);
        });

        for (let i = 0; i < 28; i++) { // 4 weeks
            const d = new Date(currentSunday.getTime() + i * 24 * 60 * 60 * 1000);
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            cell.dataset.cellDate = formatDate(d);

            const dateNum = document.createElement('div');
            dateNum.className = 'date-number';
            dateNum.textContent = d.getDate();
            
            const today = new Date();
            if (d.toDateString() === today.toDateString()) {
                cell.classList.add('today');
                dateNum.classList.add('today-date-number');
            }
            if (d < today && d.toDateString() !== today.toDateString()) {
                cell.classList.add('past-date');
            }
            if (d.getDay() === 0) dateNum.classList.add('sunday-date-number');
            if (d.getDay() === 6) dateNum.classList.add('saturday-date-number');

            cell.appendChild(dateNum);
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'events-container';

            const dateStr = formatDate(d);
            const dayEvents = (eventsByDate.get(dateStr) || [])
                .filter(e => !secretToggle.checked || e.system !== 'CoC-㊙')
                .filter(e => nameFilter.value === '' || [e.gm, ...e.participants].includes(nameFilter.value));

            dayEvents.forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = 'event-entry';
                eventEl.textContent = `${event.system}『${event.eventName}』`;
                const bgColor = COLORS[event.system] || COLORS['default'];
                eventEl.style.backgroundColor = bgColor;
                eventEl.style.color = getContrastColor(bgColor);
                eventEl.style.borderColor = bgColor;
                
                eventEl.addEventListener('mouseenter', (e) => {
                    let tooltipContent = `期間: ${formatPeriod(event.seriesStartDate, event.seriesEndDate)}`;
                    if (event.gm) tooltipContent += `<br>GM: ${event.gm}`;
                    if (event.participants.length > 0) tooltipContent += `<br>PL: ${event.participants.join(', ')}`;
                    
                    if (event.seriesDates && event.seriesDates.length > 1) {
                        const cellDate = e.target.closest('.calendar-cell').dataset.cellDate;
                        const dayIndex = event.seriesDates.findIndex(d => formatDate(d) === cellDate);
                        if (dayIndex !== -1) {
                            tooltipContent += `<div class="event-day-info">Day${dayIndex + 1}</div>`;
                        }
                    }
                    TooltipManager.show(tooltipContent, e);
                });
                eventEl.addEventListener('mouseleave', () => TooltipManager.hide());
                eventEl.addEventListener('mousemove', (e) => TooltipManager.move(e));

                eventsContainer.appendChild(eventEl);
            });
            cell.appendChild(eventsContainer);
            fragment.appendChild(cell);
        }
        grid.appendChild(fragment);
    }
    
    function updateScheduleList() {
        scheduleListBody.innerHTML = '';
        const today = new Date();
        today.setHours(0,0,0,0);
        const futureEvents = allEvents
            .filter(e => e.hasDate && e.endDate.getTime() >= today.getTime())
            .filter(e => !secretToggle.checked || e.system !== 'CoC-㊙')
            .filter(e => nameFilter.value === '' || [e.gm, ...e.participants].includes(nameFilter.value));
            
        futureEvents.forEach(e => {
            const row = scheduleListBody.insertRow();
            const systemTag = `<span class="schedule-system-tag" style="background-color:${COLORS[e.system] || COLORS['default']}; color:${getContrastColor(COLORS[e.system] || COLORS['default'])}">${e.system}</span>`;
            row.insertCell().innerHTML = `${systemTag}${e.eventName}`;
            row.insertCell().textContent = formatDate(e.date);
            row.insertCell().textContent = formatDate(e.endDate);
            row.insertCell().textContent = e.gm;
            row.insertCell().textContent = e.participants.join(', ');
        });
    }

    function populateNameFilter() {
        const names = new Set();
        allEvents.forEach(e => {
            if(e.gm) names.add(e.gm);
            e.participants.forEach(p => names.add(p));
        });
        const sortedNames = [...names].sort((a,b) => a.localeCompare(b, 'ja'));
        sortedNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            nameFilter.appendChild(option);
        });
    }

    function fullUpdate() {
        renderCalendar();
        updateScheduleList();
    }

    prevBtn.addEventListener('click', () => {
        currentSunday.setDate(currentSunday.getDate() - 28); // 4 weeks back
        fullUpdate();
    });
    nextBtn.addEventListener('click', () => {
        currentSunday.setDate(currentSunday.getDate() + 28); // 4 weeks forward
        fullUpdate();
    });
    nameFilter.addEventListener('change', fullUpdate);
    secretToggle.addEventListener('change', fullUpdate);

    populateNameFilter();
    fullUpdate();
}

// ==========================================================================
//   デイコード日程調整機能
// ==========================================================================
function initializeDaycordFeature({ allEvents, eventsByDate, COLORS }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureEventsByDate = new Map();
    for (const [dateStr, events] of eventsByDate.entries()) {
        const [year, month, day] = dateStr.split('/');
        const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (eventDate.getTime() >= today.getTime()) {
            futureEventsByDate.set(dateStr, events);
        }
    }

    const dom = { nameSel: document.getElementById('daycord-name-select'), addBtn: document.getElementById('add-participant-btn'), selectedCont: document.getElementById('selected-participants-container'), tableCont: document.querySelector('#daycord-table-container .table-wrapper'), resYoyu: document.getElementById('results-yoyu'), resDakyo: document.getElementById('results-dakyo'), resHiru: document.getElementById('results-hiru'), scenarioSel: document.getElementById('scenario-filter-select'), presetSel: document.getElementById('preset-filter-select'), includePendingCheckbox: document.getElementById('include-pending-checkbox') };
    let daycordNames = [], schedule = [], selectedNames = [], scenarioData = [], participantPresets = {};
    const updateDisplay = () => { renderSelected(); renderTable(); calculateAvailableDates(); };
    function processScenarioData() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const relevantEvents = allEvents.filter(e =>
            !e.hasDate || (e.endDate && e.endDate.getTime() >= today.getTime())
        );

        const map = new Map();
        relevantEvents.forEach(e => {
            const { eventName, gm, participants, hasDate } = e;
            if (map.has(eventName)) {
                const data = map.get(eventName);
                participants.forEach(p => { if (!data.participants.includes(p)) data.participants.push(p); });
                if (hasDate) data.hasDate = true;
            } else {
                map.set(eventName, { gm, participants: [...participants], hasDate });
            }
        });

        scenarioData = Array.from(map, ([eventName, data]) => ({ eventName, ...data }))
            .sort((a, b) => {
                if (a.hasDate !== b.hasDate) return a.hasDate ? -1 : 1;
                return a.eventName.localeCompare(b.eventName, 'ja');
            });

        const fragment = document.createDocumentFragment();
        scenarioData.forEach(d => {
            const option = document.createElement('option');
            option.value = d.eventName;
            let text = `${d.eventName} (GM: ${d.gm || '未定'})`;
            if (!d.hasDate) text += ' [日程未定]';
            option.textContent = text;
            fragment.appendChild(option);
        });
        if (dom.scenarioSel) dom.scenarioSel.appendChild(fragment);
    }
    function renderSelected() { if (!dom.selectedCont) return; dom.selectedCont.innerHTML = ''; const fragment = document.createDocumentFragment(); selectedNames.forEach(name => { const tag = document.createElement('div'); tag.className = 'participant-tag'; tag.textContent = name; const removeBtn = document.createElement('button'); removeBtn.className = 'remove-participant-btn'; removeBtn.textContent = '×'; removeBtn.dataset.name = name; tag.appendChild(removeBtn); fragment.appendChild(tag); }); dom.selectedCont.appendChild(fragment); }
    
    // ★★★ 修正箇所：テーブル生成ロジックを刷新 ★★★
    function renderTable() {
        if (!dom.tableCont) return;
        if (selectedNames.length === 0) { dom.tableCont.innerHTML = '<p>参加者を選択すると、出欠表が表示されます。</p>'; return; }
        const table = document.createElement('table'); table.className = 'daycord-table';
        const thead = table.createTHead(); thead.insertRow().innerHTML = '<th>参加者</th>' + schedule.map(d => `<th>${formatShortDate(d.date)}</th>`).join('');
        const tbody = table.createTBody();
        const eventColumnIndices = new Set(); // 予定がある日の列インデックスを保持

        // --- 予定行 ---
        const eventRow = tbody.insertRow();
        const eventTitleCell = eventRow.insertCell(); eventTitleCell.innerHTML = '<strong>予定</strong>';
        schedule.forEach((day, dayIndex) => {
            const cell = eventRow.insertCell();
            const dateStr = day.date.split('(')[0], parts = dateStr.split('/');
            const key = `${parts[0]}/${String(parts[1]).padStart(2,'0')}/${String(parts[2]).padStart(2,'0')}`;
            const eventsOnDay = futureEventsByDate.get(key) || [];
            
            // 「CoC-㊙」以外の予定があるかチェック
            const publicEventsOnDay = eventsOnDay.filter(e => e.system !== 'CoC-㊙');
            if (publicEventsOnDay.length > 0) {
                cell.classList.add('has-event');
                eventColumnIndices.add(dayIndex); // 列インデックスを記録
            }

            eventsOnDay.forEach(e => {
                const bgColor = COLORS[e.system] || COLORS['default'];
                const textColor = getContrastColor(bgColor);
                let tooltipContent = `${e.system}『${e.eventName}』<br><strong>GM:</strong> ${e.gm || '未定'}`;
                if (e.participants && e.participants.length > 0) tooltipContent += `<br><strong>PL:</strong> ${e.participants.join(', ')}`;
                const encodedTooltip = tooltipContent.replace(/"/g, '"');
                const eventDiv = document.createElement('div');
                eventDiv.className = 'daycord-event-entry';
                eventDiv.style.cssText = `background-color:${bgColor};color:${textColor};`;
                eventDiv.dataset.tooltipContent = encodedTooltip;
                eventDiv.textContent = e.system;
                cell.appendChild(eventDiv);
            });
        });

        // --- 参加者ごとの行 ---
        selectedNames.forEach(name => {
            const nameIndex = daycordNames.indexOf(name);
            if (nameIndex === -1) return;
            const row = tbody.insertRow();
            const nameCell = row.insertCell(); nameCell.textContent = name;

            schedule.forEach((day, dayIndex) => {
                const cell = row.insertCell();
                // 記録した列インデックスに基づいて背景色を適用
                if (eventColumnIndices.has(dayIndex)) {
                    cell.classList.add('has-event');
                }

                const dateStr = day.date.split('(')[0], parts = dateStr.split('/');
                const key = `${parts[0]}/${String(parts[1]).padStart(2,'0')}/${String(parts[2]).padStart(2,'0')}`;
                const eventsOnDay = futureEventsByDate.get(key) || [];
                const participantEvent = eventsOnDay.find(e => [e.gm, ...e.participants].map(p => getDayCodeName(p)).includes(name));
                const span = document.createElement('span');
                span.className = 'daycord-status-tag';

                if (participantEvent) {
                    cell.classList.add('is-conflicting');
                    const system = participantEvent.system;
                    const bgColor = COLORS[system] || COLORS['default'];
                    span.style.cssText = `background-color:${bgColor}; color:${getContrastColor(bgColor)};`;
                    let tooltipContent = `${system}『${participantEvent.eventName}』<br><strong>GM:</strong> ${participantEvent.gm}`;
                    if(participantEvent.participants.length > 0) tooltipContent += `<br><strong>PL:</strong> ${participantEvent.participants.join(', ')}`;
                    cell.dataset.tooltipContent = tooltipContent.replace(/"/g, '"');
                    span.textContent = system;
                } else {
                    const status = day.availability[nameIndex] || '－';
                    const statusClass = `status-${status.replace(/[◎〇△×▢－]/g, c => ({'◎':'o','〇':'maru','△':'sankaku','×':'batsu','▢':'shikaku','－':'hyphen'})[c])}`;
                    span.classList.add(statusClass);
                    span.textContent = status;
                }
                cell.appendChild(span);
            });
        });
        dom.tableCont.innerHTML = ''; dom.tableCont.appendChild(table);
    }
    
    function groupAndFormatDates(fullDateStrings) {
        if (fullDateStrings.length === 0) return 'なし';
        const dates = fullDateStrings.map(fds => {
            const datePart = fds.split('(')[0];
            const [year, month, day] = datePart.split('/');
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        });

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

        return groups.map(group => {
            const startFull = fullDateStrings.find(fds => fds.startsWith(formatDate(group[0])));
            const endFull = fullDateStrings.find(fds => fds.startsWith(formatDate(group[group.length - 1])));
            const startStr = formatShortDate(startFull).replace(/\//g, '/').padStart(5, '0');
            const endStr = formatShortDate(endFull).replace(/\//g, '/').padStart(5, '0');
            
            let displayText = (startStr === endStr) ? startStr : `${startStr}～${endStr}`;
            return `<span class="date-period">${displayText}</span>`;
        }).join(' ');
    }

    function calculateAvailableDates() {
        if (selectedNames.length === 0) {
            dom.resYoyu.textContent = '参加者を選択してください';
            dom.resDakyo.textContent = '参加者を選択してください';
            dom.resHiru.textContent = '参加者を選択してください';
            return;
        }

        const yoyuOk = ['◎', '〇'];
        const dakyoOk = ['◎', '〇', '△'];
        const hiruOk = ['◎', '▢'];

        if (dom.includePendingCheckbox && dom.includePendingCheckbox.checked) {
            dakyoOk.push('－');
        }

        const relevantSchedule = schedule.map(day => {
            const relevantAvailability = selectedNames.map(name => {
                const nameIndex = daycordNames.indexOf(name);
                return nameIndex !== -1 ? day.availability[nameIndex] : '－';
            });
            return { ...day, availability: relevantAvailability };
        });

        const yoyuDates = relevantSchedule.filter(d => d.availability.every(s => yoyuOk.includes(s))).map(d => d.date);
        const dakyoDates = relevantSchedule.filter(d => d.availability.every(s => dakyoOk.includes(s))).map(d => d.date);
        const hiruDates = relevantSchedule.filter(d => d.availability.every(s => hiruOk.includes(s))).map(d => d.date);

        dom.resYoyu.innerHTML = groupAndFormatDates(yoyuDates);
        dom.resDakyo.innerHTML = groupAndFormatDates(dakyoDates);
        dom.resHiru.innerHTML = groupAndFormatDates(hiruDates);
    }
    async function fetchAndProcessData() {
        try {
            dom.tableCont.innerHTML = '<p>各種データを読み込み中です...</p>';
            if (dom.nameSel) dom.nameSel.disabled = true;
            if (dom.addBtn) dom.addBtn.disabled = true;
            if (dom.scenarioSel) dom.scenarioSel.disabled = true;
            if (dom.presetSel) dom.presetSel.disabled = true;

            const [daycordResponse, presetResponse] = await Promise.all([
                fetch(DAYCORD_PROXY_URL),
                fetch(PRESETS_JSON_URL).then(res => res.json()).catch(() => ({}))
            ]);
            participantPresets = presetResponse;
            const presetFragment = document.createDocumentFragment();
            for (const presetName in participantPresets) {
                const option = document.createElement('option');
                option.value = presetName;
                option.textContent = presetName;
                presetFragment.appendChild(option);
            }
            if (dom.presetSel) { dom.presetSel.appendChild(presetFragment); }

            const htmlText = await daycordResponse.text();
            const doc = new DOMParser().parseFromString(htmlText, 'text/html');
            const table = doc.querySelector('table.schedule_table');
            if (!table) throw new Error('デイコードのテーブルが見つかりません。');

            const headerRow = table.querySelector('tr#namerow');
            const bodyRows = table.querySelectorAll('tbody tr[id^="row_"]');
            const headerCells = Array.from(headerRow.querySelectorAll('th'));
            const symbols = ['◎', '〇', '◯', '△', '×', '▢', '－'];
            daycordNames = headerCells.map(th => th.textContent.trim()).filter(name => name && !symbols.includes(name));
            
            let rawSchedule = Array.from(bodyRows).map(row => ({
                date: row.querySelector('th.datetitle')?.textContent.trim() || '日付不明',
                availability: Array.from(row.querySelectorAll('td span.statustag')).map(span => (span.textContent.trim().replace(/◯/g, "〇") || '－'))
            }));

            // 過去の日付を除外するフィルター処理
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            schedule = rawSchedule.filter(day => {
                const datePart = day.date.split('(')[0];
                const [year, month, dayOfMonth] = datePart.split('/');
                if (!year || !month || !dayOfMonth) return false;
                const scheduleDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(dayOfMonth));
                return scheduleDate.getTime() >= today.getTime();
            });

            daycordNames.sort((a, b) => a.localeCompare(b, 'ja'));
            const nameFragment = document.createDocumentFragment();
            daycordNames.forEach(name => {
                const option = document.createElement('option');
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
            if (dom.tableCont) dom.tableCont.innerHTML = `<p>データ取得に失敗しました: ${err.message}</p>`;
        } finally {
            if (dom.nameSel) dom.nameSel.disabled = false;
            if (dom.addBtn) dom.addBtn.disabled = false;
            if (dom.scenarioSel) dom.scenarioSel.disabled = false;
            if (dom.presetSel) dom.presetSel.disabled = false;
        }
    }
    if (dom.addBtn) dom.addBtn.addEventListener('click', () => { const name = dom.nameSel.value; if (name && !selectedNames.includes(name)) { selectedNames.push(name); updateDisplay(); } });
    if (dom.selectedCont) dom.selectedCont.addEventListener('click', e => { if (e.target.classList.contains('remove-participant-btn')) { selectedNames = selectedNames.filter(n => n !== e.target.dataset.name); updateDisplay(); } });
    if (dom.scenarioSel) dom.scenarioSel.addEventListener('change', () => { const eventName = dom.scenarioSel.value; if (dom.presetSel) dom.presetSel.value = ''; if (!eventName) { selectedNames = []; } else { const event = scenarioData.find(d => d.eventName === eventName); if (event) { const participantsOnSheet = [event.gm, ...event.participants].filter(Boolean); const participantsOnDaycord = participantsOnSheet.map(name => getDayCodeName(name)); selectedNames = [...new Set(participantsOnDaycord.filter(name => daycordNames.includes(name)))]; } } updateDisplay(); });
    if (dom.presetSel) dom.presetSel.addEventListener('change', () => { const presetName = dom.presetSel.value; if (dom.scenarioSel) dom.scenarioSel.value = ''; if (!presetName) { selectedNames = []; } else { const presetParticipants = participantPresets[presetName] || []; const participantsOnDaycord = presetParticipants.map(name => getDayCodeName(name)); selectedNames = [...new Set(participantsOnDaycord.filter(name => daycordNames.includes(name)))]; } updateDisplay(); });
    if (dom.includePendingCheckbox) dom.includePendingCheckbox.addEventListener('change', calculateAvailableDates);
    if (dom.tableCont) { dom.tableCont.addEventListener('mouseover', (e) => { const target = e.target.closest('[data-tooltip-content]'); if (target) { TooltipManager.show(target.dataset.tooltipContent, e); } }); dom.tableCont.addEventListener('mouseout', () => TooltipManager.hide()); dom.tableCont.addEventListener('mousemove', (e) => TooltipManager.move(e)); }
    fetchAndProcessData();
}

// --- メイン実行 ---
document.addEventListener('DOMContentLoaded', () => {
    const COLORS = loadSystemColors();
    TooltipManager.init();

    // データ取得を非同期で開始
    const eventDataPromise = getSharedEventData();
    
    // 各機能はデータが取得でき次第、初期化される
    if (document.getElementById('custom-calendar-container')) {
        eventDataPromise.then(({ allEvents, eventsByDate }) => {
            initializeCalendar({ allEvents, eventsByDate, COLORS });
        });
    }
    if (document.getElementById('daycord-table-container')) {
        // デイコード機能は自身のデータ取得も内包しているため、
        // 共有イベントデータも渡して初期化する
        eventDataPromise.then(({ allEvents, eventsByDate }) => {
            initializeDaycordFeature({ allEvents, eventsByDate, COLORS });
        });
    }
});
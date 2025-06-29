// ==========================================================================
//   SCHEDULE.JS - PL名ツールチップ追加・修正版
// ==========================================================================

// --- グローバル設定と共通ヘルパー関数 ---
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=783716063&single=true&output=csv';
const DAYCORD_PROXY_URL = 'https://corsproxy.io/?' + encodeURIComponent('https://character-sheets.appspot.com/schedule/list?key=ahVzfmNoYXJhY3Rlci1zaGVldHMtbXByHAsSEkRpc2NvcmRTZXNzaW9uRGF0YRimu5y4BQw');
const NAME_ALIASES = {
    "vara": "☭",
    "くれいど": "qre1d/くれいど",
};

// CSVパーサー
function parseCsvToArray(csvText) {
    const rows = []; let currentRow = []; let inQuotes = false; let currentField = '';
    csvText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        if (inQuotes) {
            if (char === '"' && (i + 1 < csvText.length && csvText[i + 1] === '"')) { currentField += '"'; i++; } 
            else if (char === '"') { inQuotes = false; } 
            else { currentField += char; }
        } else {
            if (char === '"') { inQuotes = true; } 
            else if (char === ',') { currentRow.push(currentField); currentField = ''; } 
            else if (char === '\n') { currentRow.push(currentField); rows.push(currentRow); currentRow = []; currentField = ''; }
            else { currentField += char; }
        }
    }
    if (currentField || currentRow.length > 0) { currentRow.push(currentField); rows.push(currentRow); }
    return rows.filter(row => row.length > 1 || (row.length === 1 && row[0]));
}

// --- 日付関連ヘルパー ---
function isNextDay(d1, d2) { const n = new Date(d1); n.setDate(n.getDate() + 1); return n.getFullYear() === d2.getFullYear() && n.getMonth() === d2.getMonth() && n.getDate() === d2.getDate(); }
function getSunday(d) { const n = new Date(d); n.setDate(n.getDate() - n.getDay()); n.setHours(0,0,0,0); return n; }
function formatDate(d) { return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`; }
function formatPeriod(start, end) { const s = {y:start.getFullYear(),m:start.getMonth()+1,d:start.getDate()}, e = {y:end.getFullYear(),m:end.getMonth()+1,d:end.getDate()}; const sStr = `${s.y}/${s.m}/${s.d}`; if(s.y===e.y&&s.m===e.m&&s.d===e.d) return sStr; if(s.y===e.y&&s.m===e.m) return `${s.y}/${s.m}/${s.d}-${e.d}`; if(s.y===e.y) return `${s.y}/${s.m}/${s.d} - ${e.m}/${e.d}`; return `${s.y}/${s.m}/${s.d} - ${e.y}/${e.m}/${e.d}`; }
const formatShortDate = (fullDate) => fullDate.length > 5 ? fullDate.substring(5) : fullDate;

// --- その他ヘルパー ---
function areArraysEqual(a1, a2) { if (!a1 && !a2) return true; if (!a1 || !a2 || a1.length !== a2.length) return false; const s1 = [...a1].sort(), s2 = [...a2].sort(); return s1.every((v, i) => v === s2[i]); }
function getContrastColor(hex) { if (!hex) return '#000000'; hex = hex.replace("#", ""); const r = parseInt(hex.substr(0,2),16), g = parseInt(hex.substr(2,2),16), b = parseInt(hex.substr(4,2),16); return ((r*299)+(g*587)+(b*114))/1000 >= 128 ? '#000000' : '#FFFFFF'; }
function getDayCodeName(name) { return NAME_ALIASES[name] || name; }
function loadSystemColors() {
    const colors = {}; const styles = getComputedStyle(document.documentElement);
    const map={'--color-coc':'CoC','--color-coc-secret':'CoC-㊙','--color-dx3':'DX3','--color-sw':'SW','--color-sw2-5':'SW2.5','--color-nechronica':'ネクロニカ','--color-satasupe':'サタスペ','--color-mamoburu':'マモブル','--color-stellar':'銀剣','--color-ar':'AR2E','--color-default':'default'};
    for(const cssVar in map){ const color = styles.getPropertyValue(cssVar).trim(); if(color) colors[map[cssVar]] = color; }
    return colors;
}

/** 
 * 共通データ取得・整形関数
 */
async function getSharedEventData() {
    try {
        const response = await fetch(SPREADSHEET_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const csvText = await response.text();
        const rows = parseCsvToArray(csvText); let events = [];
        for (let i = 1; i < rows.length; i++) {
            const values = rows[i];
            const normalize = (str) => (typeof str !== 'string' || !str) ? '' : str.replace(/　/g, ' ').trim().replace(/\s+/g, ' ');
            if (values && values.length > 3 && values[1] && values[2] && values[3]) {
                const dateStr = values[1].split('(')[0].trim(), parts = dateStr.split('/');
                if (parts.length !== 3) continue;
                const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                if (isNaN(date.getTime())) continue;
                events.push({ id: `event-${i}`, date, endDate: new Date(date), system: normalize(values[2]), eventName: normalize(values[3]), gm: normalize(values[4] || ''), participants: Array.from({length: 6}, (_, j) => normalize(values[5 + j])).filter(Boolean) });
            }
        }
        events.sort((a, b) => a.date.getTime() - b.date.getTime());
        const mergedEvents = []; let currentGroup = null;
        for (const event of events) {
            if (currentGroup && currentGroup.system === event.system && currentGroup.eventName === event.eventName && (currentGroup.gm || '') === (event.gm || '') && areArraysEqual(currentGroup.participants, event.participants) && isNextDay(currentGroup.endDate, event.date)) {
                currentGroup.endDate = new Date(event.date);
            } else {
                if (currentGroup) mergedEvents.push(currentGroup);
                currentGroup = { ...event };
            }
        }
        if (currentGroup) mergedEvents.push(currentGroup);
        const seriesMap = new Map(); const eventsByDate = new Map();
        const getSeriesKey = (e) => { const pKey = e.participants ? [...e.participants].sort().join(',') : ''; return `${(e.eventName||'').trim()}|${(e.system||'').trim()}|${(e.gm||'').trim()}|${pKey}`; };
        mergedEvents.forEach(e => {
            const key = getSeriesKey(e);
            if (!seriesMap.has(key)) seriesMap.set(key, []);
            seriesMap.get(key).push(e);
            let d = new Date(e.date);
            while (d.getTime() <= e.endDate.getTime()) {
                const dateStr = formatDate(d);
                if (!eventsByDate.has(dateStr)) eventsByDate.set(dateStr, []);
                eventsByDate.get(dateStr).push(e);
                d.setDate(d.getDate() + 1);
            }
        });
        seriesMap.forEach(blocks => {
            blocks.sort((a, b) => a.date.getTime() - b.date.getTime());
            const allDates = [];
            blocks.forEach(b => { let d = new Date(b.date); while(d.getTime() <= b.endDate.getTime()) { allDates.push(new Date(d)); d.setDate(d.getDate() + 1); }});
            allDates.sort((a, b) => a.getTime() - b.getTime());
            blocks.forEach(b => { b.seriesDates = allDates; b.seriesStartDate = allDates[0]; b.seriesEndDate = allDates[allDates.length - 1]; });
        });
        const allEvents = mergedEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
        return { allEvents, eventsByDate };
    } catch (error) {
        console.error("Error fetching or parsing shared event data:", error);
        return { allEvents: [], eventsByDate: new Map() };
    }
}

// ==========================================================================
//   単一のツールチップ管理オブジェクト
// ==========================================================================
const TooltipManager = {
    element: null,
    init() {
        if (this.element) return;
        this.element = document.createElement('div');
        this.element.className = 'event-tooltip';
        document.body.appendChild(this.element);
    },
    show(content, event) {
        this.element.innerHTML = content;
        this.element.style.display = 'block';
        this.move(event);
    },
    hide() {
        this.element.style.display = 'none';
    },
    move(event) {
        if (this.element.style.display === 'block') {
            this.element.style.left = `${event.pageX + 15}px`;
            this.element.style.top = `${event.pageY + 15}px`;
        }
    }
};

// ==========================================================================
//   カレンダー機能
// ==========================================================================
function initializeCalendar({ allEvents, eventsByDate, COLORS }) {
    const state = { currentStartDate: getSunday(new Date()), isSecretHidden: false, filterName: '' };
    const dom = { grid: document.getElementById('calendar-grid'), prevBtn: document.getElementById('prev-week'), nextBtn: document.getElementById('next-week'), display: document.getElementById('current-week-display'), toggleBtn: document.getElementById('toggle-secret-events-btn'), filterSelect: document.getElementById('name-filter-select'), listBody: document.getElementById('schedule-list-body'), cells: [], listRows: [] };

    function buildSkeleton() {
        if (!dom.grid || !dom.listBody) return;
        const calendarFragment = document.createDocumentFragment();
        ['日','月','火','水','木','金','土'].forEach((day, i) => { const h = document.createElement('div'); h.className = 'calendar-header-cell'; h.textContent = day; if(i===0)h.classList.add('sunday-header');if(i===6)h.classList.add('saturday-header');calendarFragment.appendChild(h);});
        for (let i=0; i<28; i++) { const c = document.createElement('div'); c.className = 'calendar-cell'; const n = document.createElement('div'); n.className = 'date-number'; const o = document.createElement('div'); o.className = 'events-container'; c.append(n, o); dom.cells.push({ cell:c, num:n, cont:o }); calendarFragment.appendChild(c); }
        dom.grid.append(calendarFragment);
        const listFragment = document.createDocumentFragment();
        const seriesMap = new Map();
        const getSeriesKey = (e) => { const pKey = e.participants ? [...e.participants].sort().join(',') : ''; return `${(e.eventName||'').trim()}|${(e.system||'').trim()}|${(e.gm||'').trim()}|${pKey}`; };
        allEvents.forEach(e => { if (!seriesMap.has(getSeriesKey(e))) { seriesMap.set(getSeriesKey(e), e); }});
        const futureSeries = [...seriesMap.values()].sort((a,b) => a.seriesStartDate.getTime() - b.seriesStartDate.getTime());
        const fmt = new Intl.DateTimeFormat('ja-JP', { year:'numeric', month:'numeric', day:'numeric', weekday:'short' });
        futureSeries.forEach(s => {
            const r = document.createElement('tr');
            r.dataset.eventId = s.id;
            const bgColor = COLORS[s.system] || COLORS['default'];
            const textColor = getContrastColor(bgColor);
            r.innerHTML = `<td><span class="schedule-system-tag" style="background-color:${bgColor}; color:${textColor};">${s.system}</span>『${s.eventName}』</td><td>${fmt.format(s.seriesStartDate)}</td><td>${fmt.format(s.seriesEndDate)}</td><td>${s.gm||'N/A'}</td><td>${s.participants.join(', ')||'N/A'}</td>`;
            dom.listRows.push({ row: r, event: s });
            listFragment.appendChild(r);
        });
        dom.listBody.appendChild(listFragment);
    }

    function updateCalendarView() {
        const endDate = new Date(state.currentStartDate); endDate.setDate(state.currentStartDate.getDate() + 27);
        if (dom.display) dom.display.textContent = `${formatDate(state.currentStartDate)} - ${formatDate(endDate)}`;
        let tempDate = new Date(state.currentStartDate);
        const today = new Date(); today.setHours(0,0,0,0);
        dom.cells.forEach(c => {
            c.num.textContent = tempDate.getDate();
            c.cell.dataset.cellDate = formatDate(tempDate);
            const day = tempDate.getDay();
            c.num.className = 'date-number';
            if(day === 0) c.num.classList.add('sunday-date-number'); else if (day === 6) c.num.classList.add('saturday-date-number');
            c.cell.classList.toggle('today', tempDate.getTime() === today.getTime());
            c.cell.classList.toggle('past-date', tempDate.getTime() < today.getTime());
            c.cont.innerHTML = '';
            const eventsOnDay = eventsByDate.get(formatDate(tempDate)) || [];
            eventsOnDay.forEach(event => {
                const div = document.createElement('div');
                div.className = 'event-entry';
                div.dataset.eventId = event.id;
                const bgColor = COLORS[event.system] || COLORS['default'];
                div.style.cssText = `background-color:${bgColor};color:${getContrastColor(bgColor)};border-left-color:${bgColor};`;
                div.textContent = `${event.system}『${event.eventName}』`;
                c.cont.appendChild(div);
            });
            tempDate.setDate(tempDate.getDate() + 1);
        });
        applyFilters();
    }
    
    function applyFilters() {
        const today = new Date(); today.setHours(0,0,0,0);
        dom.grid.querySelectorAll('.event-entry').forEach(el => {
            const event = allEvents.find(e => e.id === el.dataset.eventId);
            if(event) {
                const isVisible = (!state.isSecretHidden || event.system !== 'CoC-㊙') && (!state.filterName || event.gm === state.filterName || event.participants.includes(state.filterName));
                el.style.display = isVisible ? '' : 'none';
            }
        });
        dom.listRows.forEach(({ row, event }) => {
            const isVisible = (!state.isSecretHidden || event.system !== 'CoC-㊙') && (!state.filterName || event.gm === state.filterName || event.participants.includes(state.filterName)) && (event.seriesEndDate.getTime() >= today.getTime());
            row.style.display = isVisible ? '' : 'none';
        });
    }

    buildSkeleton();
    updateCalendarView();
    const allNames = new Set();
    allEvents.forEach(e => { if(e.gm) allNames.add(e.gm); e.participants.forEach(p => allNames.add(p)); });
    [...allNames].sort((a,b) => a.localeCompare(b,'ja')).forEach(name => { const opt = document.createElement('option'); opt.value = name; opt.textContent = name; dom.filterSelect.appendChild(opt); });
    
    dom.grid.addEventListener('mouseover', (e) => {
        const target = e.target.closest('.event-entry');
        if (target) {
            const event = allEvents.find(ev => ev.id === target.dataset.eventId);
            if(event) {
                let content = `<strong>GM:</strong> ${event.gm}<br><strong>PL:</strong> ${event.participants.join(', ')}`;
                content += `<div class="event-duration-info">期間: ${formatPeriod(event.seriesStartDate, event.seriesEndDate)}</div>`;
                if(event.seriesDates.length > 1) {
                    const cellDate = target.closest('.calendar-cell').dataset.cellDate;
                    const dayIndex = event.seriesDates.findIndex(d => formatDate(d) === cellDate);
                    if(dayIndex !== -1) content += `<div class="event-day-info">Day ${dayIndex + 1}</div>`;
                }
                TooltipManager.show(content, e);
            }
        }
    });
    dom.grid.addEventListener('mouseout', () => TooltipManager.hide());
    dom.grid.addEventListener('mousemove', (e) => TooltipManager.move(e));
    
    dom.prevBtn.addEventListener('click', () => { state.currentStartDate.setDate(state.currentStartDate.getDate() - 7); updateCalendarView(); });
    dom.nextBtn.addEventListener('click', () => { state.currentStartDate.setDate(state.currentStartDate.getDate() + 7); updateCalendarView(); });
    dom.toggleBtn.addEventListener('change', () => { state.isSecretHidden = dom.toggleBtn.checked; applyFilters(); });
    dom.filterSelect.addEventListener('change', () => { state.filterName = dom.filterSelect.value; applyFilters(); });
}


// ==========================================================================
//   デイコード日程調整機能
// ==========================================================================
function initializeDaycordFeature({ allEvents, eventsByDate, COLORS }) {
    const dom = { nameSel: document.getElementById('daycord-name-select'), addBtn: document.getElementById('add-participant-btn'), selectedCont: document.getElementById('selected-participants-container'), tableCont: document.querySelector('#daycord-table-container .table-wrapper'), resYoyu: document.getElementById('results-yoyu'), resDakyo: document.getElementById('results-dakyo'), resIchimatsu: document.getElementById('results-ichimatsu'), resHiru: document.getElementById('results-hiru'), scenarioSel: document.getElementById('scenario-filter-select') };
    let daycordNames = [], schedule = [], selectedNames = [], scenarioData = [];
    const updateDisplay = () => { renderSelected(); renderTable(); calculateAvailableDates(); };
    
    function injectDaycordStyles() {
        const styleId = 'daycord-dynamic-styles'; if(document.getElementById(styleId)) return;
        const style = document.createElement('style'); style.id = styleId;
        style.innerHTML = `.daycord-event-entry{padding:2px 4px;margin-bottom:2px;border-radius:3px;font-size:0.9em;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:help;}`;
        document.head.appendChild(style);
    }
    
    function processScenarioData() {
        const map = new Map();
        allEvents.forEach(e => { const { eventName, gm, participants } = e; if (map.has(eventName)) { const data = map.get(eventName); participants.forEach(p => { if (!data.participants.includes(p)) data.participants.push(p); }); } else { map.set(eventName, { gm, participants: [...participants] }); }});
        scenarioData = Array.from(map, ([eventName, data]) => ({ eventName, ...data })).sort((a,b) => a.eventName.localeCompare(b.eventName, 'ja'));
        const fragment = document.createDocumentFragment();
        scenarioData.forEach(d => { const option = document.createElement('option'); option.value = d.eventName; option.textContent = `${d.eventName} (GM: ${d.gm || '未定'})`; fragment.appendChild(option); });
        dom.scenarioSel.appendChild(fragment);
    }
    
    function renderSelected() {
        if (!dom.selectedCont) return; dom.selectedCont.innerHTML = '';
        const fragment = document.createDocumentFragment();
        selectedNames.forEach(name => { const tag = document.createElement('div'); tag.className = 'participant-tag'; tag.textContent = name; const removeBtn = document.createElement('button'); removeBtn.className = 'remove-participant-btn'; removeBtn.textContent = '×'; removeBtn.dataset.name = name; tag.appendChild(removeBtn); fragment.appendChild(tag); });
        dom.selectedCont.appendChild(fragment);
    }
    
    function renderTable() {
        if (selectedNames.length === 0) { dom.tableCont.innerHTML = '<p>参加者を選択すると、出欠表が表示されます。</p>'; return; }
        const table = document.createElement('table'); table.className = 'daycord-table';
        const thead = table.createTHead(); thead.insertRow().innerHTML = '<th>参加者</th>' + schedule.map(d => `<th>${formatShortDate(d.date)}</th>`).join('');
        const tbody = table.createTBody(); const eventRow = tbody.insertRow();
        eventRow.innerHTML = '<td><strong>予定</strong></td>' + schedule.map(d => {
            const dateStr = d.date.split('(')[0], parts = dateStr.split('/'); const key = `${parts[0]}/${String(parts[1]).padStart(2,'0')}/${String(parts[2]).padStart(2,'0')}`;
            const eventsOnDay = eventsByDate.get(key) || [];
            
            // ★★★ 修正箇所 ★★★
            const cellContent = eventsOnDay.map(e => {
                const bgColor = COLORS[e.system] || COLORS['default'];
                const textColor = getContrastColor(bgColor);
                // ツールチップの内容をここで組み立てる
                let tooltipContent = `${e.system}『${e.eventName}』<br><strong>GM:</strong> ${e.gm || '未定'}`;
                if (e.participants && e.participants.length > 0) {
                    tooltipContent += `<br><strong>PL:</strong> ${e.participants.join(', ')}`;
                }
                // HTML-safeな形にエンコード
                const encodedTooltip = tooltipContent.replace(/"/g, '"');
                
                return `<div class="daycord-event-entry" style="background-color:${bgColor};color:${textColor};" data-tooltip-content="${encodedTooltip}">${e.system}</div>`;
            }).join('');
            
            return `<td>${cellContent}</td>`;
        }).join('');

        selectedNames.forEach(name => { const nameIndex = daycordNames.indexOf(name); if (nameIndex === -1) return; const row = tbody.insertRow(); row.innerHTML = `<td>${name}</td>` + schedule.map(d => `<td data-status="${d.availability[nameIndex] || '－'}">${d.availability[nameIndex] || '－'}</td>`).join(''); });
        dom.tableCont.innerHTML = ''; dom.tableCont.appendChild(table);
    }

    function calculateAvailableDates() {
        if (selectedNames.length === 0) { dom.resYoyu.innerHTML = dom.resDakyo.innerHTML = dom.resIchimatsu.innerHTML = dom.resHiru.innerHTML = "参加者を選択してください"; return; }
        const selectedIndices = selectedNames.map(name => daycordNames.indexOf(name)).filter(i => i !== -1);
        if (selectedIndices.length === 0) return;
        const rules = { yoyu:['◎','〇'], dakyo:['◎','〇','△'], ichimatsu:['◎','〇','△','－'], hiru:['◎','▢'] };
        const results = { yoyu:[], dakyo:[], ichimatsu:[], hiru:[] };
        schedule.forEach(d => { const availability = selectedIndices.map(i => d.availability[i]); if(availability.every(s => rules.yoyu.includes(s))) results.yoyu.push(d.date); if(availability.every(s => rules.dakyo.includes(s))) results.dakyo.push(d.date); if(availability.every(s => rules.ichimatsu.includes(s))) results.ichimatsu.push(d.date); if(availability.every(s => rules.hiru.includes(s))) results.hiru.push(d.date); });
        const formatResults = (dates) => { if (dates.length === 0) return '該当なし'; const formatted = []; for (let i = 0; i < dates.length; i++) { let j = i; while (j + 1 < dates.length && isNextDay(new Date(dates[j].split('(')[0]), new Date(dates[j+1].split('(')[0]))) { j++; } if (j > i) { formatted.push(`<span class="consecutive-days">${formatShortDate(dates[i])}～${formatShortDate(dates[j])}</span>`); i = j; } else { formatted.push(formatShortDate(dates[i])); } } return formatted.join(', '); };
        dom.resYoyu.innerHTML = formatResults(results.yoyu); dom.resDakyo.innerHTML = formatResults(results.dakyo); dom.resIchimatsu.innerHTML = formatResults(results.ichimatsu); dom.resHiru.innerHTML = formatResults(results.hiru);
    }
    
    async function fetchDaycordData() {
        try {
            dom.tableCont.innerHTML = '<p>デイコードの情報を読み込み中です...</p>';
            const response = await fetch(DAYCORD_PROXY_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const htmlText = await response.text();
            const doc = new DOMParser().parseFromString(htmlText, 'text/html'); const table = doc.querySelector('table.schedule_table'); if (!table) throw new Error('デイコードのテーブルが見つかりません。');
            const headerRow = table.querySelector('tr#namerow'), bodyRows = table.querySelectorAll('tbody tr[id^="row_"]');
            const headerCells = Array.from(headerRow.querySelectorAll('th')); const symbols = ['◎','〇','◯','△','×','▢','－'];
            daycordNames = headerCells.map(th => th.textContent.trim()).filter(name => name && !symbols.includes(name));
            schedule = Array.from(bodyRows).map(row => ({ date: row.querySelector('th.datetitle')?.textContent.trim() || '日付不明', availability: Array.from(row.querySelectorAll('td span.statustag')).map(span => (span.textContent.trim().replace(/◯/g,"〇") || '－')) }));
            daycordNames.sort((a, b) => a.localeCompare(b, 'ja'));
            const fragment = document.createDocumentFragment(); daycordNames.forEach(name => { const option = document.createElement('option'); option.value = name; option.textContent = name; fragment.appendChild(option); });
            dom.nameSel.innerHTML = '<option value="">-- 名前を選択 --</option>'; dom.nameSel.appendChild(fragment);
            processScenarioData(); injectDaycordStyles(); updateDisplay();
        } catch(err) { console.error("デイコード情報取得失敗:", err); dom.tableCont.innerHTML = `<p>デイコード情報取得に失敗: ${err.message}</p>`; }
    }

    dom.addBtn.addEventListener('click', () => { const name = dom.nameSel.value; if (name && !selectedNames.includes(name)) { selectedNames.push(name); updateDisplay(); } });
    dom.selectedCont.addEventListener('click', e => { if (e.target.classList.contains('remove-participant-btn')) { selectedNames = selectedNames.filter(n => n !== e.target.dataset.name); updateDisplay(); } });
    dom.scenarioSel.addEventListener('change', () => {
        const eventName = dom.scenarioSel.value; if (!eventName) { selectedNames = []; updateDisplay(); return; }
        const event = scenarioData.find(d => d.eventName === eventName);
        if (event) { const participantsOnSheet = [event.gm, ...event.participants].filter(Boolean); const participantsOnDaycord = participantsOnSheet.map(name => getDayCodeName(name)); selectedNames = [...new Set(participantsOnDaycord.filter(name => daycordNames.includes(name)))]; updateDisplay(); }
    });
    
    dom.tableCont.addEventListener('mouseover', (e) => {
        const target = e.target.closest('.daycord-event-entry');
        if (target && target.dataset.tooltipContent) { TooltipManager.show(target.dataset.tooltipContent, e); }
    });
    dom.tableCont.addEventListener('mouseout', () => TooltipManager.hide());
    dom.tableCont.addEventListener('mousemove', (e) => TooltipManager.move(e));
    
    fetchDaycordData();
}

// --- メイン実行 ---
document.addEventListener('DOMContentLoaded', async () => {
    // 共通データを一度だけ取得
    const { allEvents, eventsByDate } = await getSharedEventData();
    const COLORS = loadSystemColors();
    TooltipManager.init(); // ツールチップを初期化
  
    // 各機能に共通データを渡して初期化
    if (document.getElementById('custom-calendar-container')) {
        initializeCalendar({ allEvents, eventsByDate, COLORS });
    }
    if (document.getElementById('daycord-table-container')) {
        initializeDaycordFeature({ allEvents, eventsByDate, COLORS });
    }
});
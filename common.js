// トップページに戻るロゴを動的に挿入するスクリプト
document.addEventListener('DOMContentLoaded', function() {
const placeholder = document.getElementById('home-logo-placeholder');
if (placeholder) {
    const logoHtml = `
        <a href="index.html" class="home-logo-link">
            <img src="img/卓スタダロゴ.png" alt="トップページに戻る" class="home-logo">
        </a>
    `;
    placeholder.innerHTML = logoHtml;
}
});

// TRPGシステム共通の色定義
const TRPG_SYSTEM_COLORS = {
    'CoC': '#93c47d',
    'CoC-㊙': '#6aa84f',
    'SW': '#ea9999',
    'SW2.5': '#ea9999',
    'DX3': '#cc4125',
    'サタスペ': '#e69138',
    'マモブル': '#ffe51f',
    '銀剣': '#0788bb',
    'ネクロニカ': '#505050',
    'ウマ娘': '#ffa1d8',
    'シノビガミ': '#8e7cc3',
    'AR': '#ffd966', // アリアンロッドと仮定
    'default': '#007bff' // 未定義システム用のデフォルト色
};

const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
const particleCount = 80;
const particleSize = 1.5;
const particleColor = 'rgba(255, 255, 255, 0.4)';

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
}

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * (particleSize * 2 - particleSize / 2) + particleSize / 2;
        this.speedX = Math.random() * 0.4 - 0.2;
        this.speedY = Math.random() * 0.4 - 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width + this.size) this.x = -this.size;
        if (this.x < -this.size) this.x = canvas.width + this.size;
        if (this.y > canvas.height + this.size) this.y = -this.size;
        if (this.y < -this.size) this.y = canvas.height + this.size;
    }

    draw() {
        ctx.fillStyle = particleColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    requestAnimationFrame(animateParticles);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
}

// パーティクルアニメーションの初期化とリサイズ処理
if (canvas) { // canvas要素が存在する場合のみ実行
    window.addEventListener('load', () => {
        resizeCanvas();
        animateParticles();
    });
    window.addEventListener('resize', resizeCanvas);
}

// Back to Top ボタンのスクロール制御とトップへ戻る機能
function topFunction() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

document.addEventListener('DOMContentLoaded', function() {
    const backToTopBtn = document.getElementById("backToTopBtn");
    if (backToTopBtn) {
        const scrollHandlerForBackToTop = () => {
            if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
                if (!backToTopBtn.classList.contains('show')) backToTopBtn.classList.add('show');
            } else {
                if (backToTopBtn.classList.contains('show')) backToTopBtn.classList.remove('show');
            }
        };
        window.addEventListener('scroll', scrollHandlerForBackToTop);
        scrollHandlerForBackToTop(); // 初期表示チェック
    }
});

// クリップボードにコピーする関数
function copyCodeToClipboard(elementId) {
    const codeElement = document.getElementById(elementId);
    if (codeElement) {
        const codeToCopy = codeElement.querySelector('code').innerText;
        navigator.clipboard.writeText(codeToCopy).then(() => {
            alert('コピーしました！');
        }).catch(err => {
            console.error('コピーに失敗しました: ', err);
            alert('コピーに失敗しました。');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => { // カレンダー関連の処理はDOMContentLoaded内で実行
    const calendarContainer = document.getElementById('custom-calendar-container');
    if (!calendarContainer) return; // カレンダーがなければ何もしない

    let allEvents = [];
    let currentStartDate; // 表示する4週間の最初の日 (日曜日)
    const calendarGrid = document.getElementById('calendar-grid');
    const prevWeekButton = document.getElementById('prev-week');
    const nextWeekButton = document.getElementById('next-week');
    const currentWeekDisplay = document.getElementById('current-week-display');

    const DAYS_IN_WEEK = 7;
    const WEEKS_TO_DISPLAY = 4;

    async function fetchEventsAndRenderCalendar() {
        // Google Spreadsheetの公開CSV URL
        // イベント登録画面のシートのみを使用
        const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=783716063&single=true&output=csv';

        try {
            const response = await fetch(SPREADSHEET_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for URL: ${SPREADSHEET_URL}`);
            const csvText = await response.text();
            const parsedEvents = parseGoogleSheetCSV(csvText, '783716063');

            completeDayInfo(parsedEvents);
            allEvents = mergeConsecutiveEvents(parsedEvents); 

            allEvents.sort((a, b) => a.date - b.date);

            currentStartDate = getSundayOfGivenDate(new Date());

            renderCalendar();
            // const calendarElement = document.getElementById('custom-calendar-container');
            // if (calendarElement) {
            //     setTimeout(() => {
            //         calendarElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            //     }, 100);
            // }
        } catch (error) {
            console.error("Error fetching or parsing CSV:", error);
            if (calendarGrid) calendarGrid.innerHTML = "<p>予定の読み込みに失敗しました。</p>";
        }
    }

    function parseCsvLine(line) {
        const values = [];
        let currentVal = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && i + 1 < line.length && line[i+1] === '"') {
                    currentVal += '"';
                    i++; 
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(currentVal);
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        values.push(currentVal);
        return values;
    }
    
    function parseGoogleSheetCSV(csvText, gid) {
        const lines = csvText.trim().split('\n');
        const events = [];
        let headerRowIndex = 0;

        if (gid === '783716063') {
            headerRowIndex = 0;
        }

        for (let i = headerRowIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) {
                continue;
            }
            const values = parseCsvLine(line);

            const normalizeStringForComparison = (str) => {
                if (typeof str !== 'string' || !str) return '';
                return str
                    .replace(/　/g, ' ') 
                    .trim()
                    .replace(/\s+/g, ' '); 
            };

            let eventData = null;

            if (gid === '783716063') {
                if (values.length > 3 && values[1] && values[2] && values[3]) { 
                    const dateStrRaw = values[1]; 
                    const system = normalizeStringForComparison(values[2]);
                    const eventName = normalizeStringForComparison(values[3]);
                    const gm = normalizeStringForComparison(values.length > 4 ? values[4] : '');

                    const participants = [];
                    for (let p_idx = 5; p_idx <= 10; p_idx++) {
                        if (values.length > p_idx && values[p_idx] && values[p_idx].trim() !== '') {
                            let participantName = values[p_idx].replace(/^"|"$/g, '');
                            participantName = normalizeStringForComparison(participantName); 
                            if (participantName) {
                                participants.push(participantName);
                            }
                        }
                    }

                    if (!dateStrRaw) {
                        continue;
                    }

                    const dateOnlyStr = dateStrRaw.split('(')[0].trim();
                    const parts = dateOnlyStr.split('/');
                    if (parts.length !== 3) {
                        continue;
                    }
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    const dayInfo = (values.length > 11 && values[11] && values[11].trim() !== '') ? values[11].trim() : '';
                    const date = new Date(year, month, day);
                    const endDate = new Date(year, month, day);

                    if (isNaN(date.getTime())) {
                        continue;
                    }
                    eventData = { date, endDate, system, eventName, gm, participants, dayInfo };

                }
            }

            if (eventData) {
                events.push({
                    date: eventData.date,
                    endDate: eventData.endDate,
                    system: eventData.system,
                    eventName: eventData.eventName,
                    gm: eventData.gm,
                    participants: eventData.participants,
                    dayInfo: eventData.dayInfo,
                    gid: gid
                });
            } else {
                if (line.split(',').some(val => val.trim() !== '')) {
                }
            }
        }
        return events;
    }
    
    function completeDayInfo(events) {
        if (!events || events.length === 0) return;

        const getGroupKey = (event) => {
            const participantsKey = event.participants ? [...event.participants].sort().join(',') : '';
            return `${event.eventName}-${event.system}-${event.gm || ''}-${participantsKey}`;
        };

        const groupedEvents = {};
        for (const event of events) {
            const key = getGroupKey(event);
            if (!groupedEvents[key]) {
                groupedEvents[key] = [];
            }
            groupedEvents[key].push(event);
        }

        for (const key in groupedEvents) {
            const group = groupedEvents[key];
            group.sort((a, b) => a.date.getTime() - b.date.getTime());
        }
    }
    
    // 連続するイベントをマージする関数
    function mergeConsecutiveEvents(events) {
        if (!events || events.length === 0) {
            return [];
        }

        // ★★★ 修正点1: ソート順の変更 ★★★
        // 目的: 同じシリーズのイベントを隣接させてから日付でソートし、連続判定を正しく行うため。
        // 変更前は日付で先にソートしていたため、同じ卓のイベントがリスト上で離れてしまいマージされませんでした。
        // 変更後: システム -> イベント名 -> GM -> 参加者 -> 日付
        events.sort((a, b) => {
            if (a.system !== b.system) return a.system.localeCompare(b.system);
            if (a.eventName !== b.eventName) return a.eventName.localeCompare(b.eventName);
            if ((a.gm || '') !== (b.gm || '')) return (a.gm || '').localeCompare(b.gm || '');
    
            const participantsA = a.participants ? [...a.participants].sort().join(',') : '';
            const participantsB = b.participants ? [...b.participants].sort().join(',') : '';
            if (participantsA !== participantsB) return participantsA.localeCompare(participantsB);
    
            // 上記の条件がすべて同じ場合、最後に日付でソートします
            return a.date.getTime() - b.date.getTime();
        });

        const merged = [];
        let currentGroup = null;

        for (const event of events) {
            if (currentGroup &&
                currentGroup.system === event.system &&
                currentGroup.eventName === event.eventName &&
                (currentGroup.gm || '') === (event.gm || '') &&
                areParticipantArraysEqual(currentGroup.participants, event.participants) &&
                isNextDay(currentGroup.endDate, event.date)) {
                // 連続している場合、グループの終了日を現在のイベントの日付に更新 (期間を延長)
                currentGroup.endDate = new Date(event.date);
            } else {
                if (currentGroup) {
                    merged.push(currentGroup);
                }
                // 新しいグループは現在のイベントから開始。endDateは開始日と同じで初期化。
                currentGroup = { ...event, endDate: new Date(event.date) };
            }
        }
        if (currentGroup) {
            merged.push(currentGroup);
        }
        return merged;
    }

    function areParticipantArraysEqual(arr1, arr2) {
        if (!arr1 && !arr2) return true;
        if (!arr1 || !arr2 || arr1.length !== arr2.length) return false;
        const sortedArr1 = [...arr1].sort();
        const sortedArr2 = [...arr2].sort();
        for (let i = 0; i < sortedArr1.length; i++) {
            if (sortedArr1[i] !== sortedArr2[i]) return false;
        }
        return true;
    }

    function isNextDay(date1, date2) {
        const nextDay = new Date(date1);
        nextDay.setDate(nextDay.getDate() + 1);
        return nextDay.getFullYear() === date2.getFullYear() &&
               nextDay.getMonth() === date2.getMonth() &&
               nextDay.getDate() === date2.getDate();
    }

    function getSundayOfGivenDate(date) {
        const newDate = new Date(date);
        const dayOfWeek = newDate.getDay();
        newDate.setDate(newDate.getDate() - dayOfWeek);
        newDate.setHours(0, 0, 0, 0);
        return newDate;
    }
    
    function formatDateToDash(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}/${m}/${d}`;
    }
    
    function formatEventPeriod(startDate, endDate) {
        const sy = startDate.getFullYear();
        const sm = startDate.getMonth() + 1;
        const sd = startDate.getDate();
        const ey = endDate.getFullYear();
        const em = endDate.getMonth() + 1;
        const ed = endDate.getDate();

        const startStr = `${sy}/${sm}/${sd}`;

        if (sy === ey && sm === em && sd === ed) {
            return startStr;
        } else if (sy === ey && sm === em) {
            return `${startStr}-${ed}`;
        } else if (sy === ey) {
            return `${startStr}-${em}/${ed}`;
        } else {
            return `${startStr}-${ey}/${em}/${ed}`;
        }
    }

    function getContrastYIQ(hexcolor){
        hexcolor = hexcolor.replace("#", "");
        const r = parseInt(hexcolor.substr(0,2),16);
        const g = parseInt(hexcolor.substr(2,2),16);
        const b = parseInt(hexcolor.substr(4,2),16);
        const yiq = ((r*299)+(g*587)+(b*114))/1000;
        return (yiq >= 128) ? '#000000' : '#FFFFFF';
    }

    function renderCalendar() {
        if (!calendarGrid || !currentStartDate) return;
        calendarGrid.innerHTML = '';

        const displayEndDate = new Date(currentStartDate);
        displayEndDate.setDate(currentStartDate.getDate() + (DAYS_IN_WEEK * WEEKS_TO_DISPLAY) - 1);
        if (currentWeekDisplay) {
            currentWeekDisplay.textContent = `${formatDate(currentStartDate)} - ${formatDate(displayEndDate)}`;
        }

        const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
        daysOfWeek.forEach((day, index) => {
            const dayHeader = document.createElement('div');
            dayHeader.classList.add('calendar-header-cell');
            dayHeader.textContent = day;
            if (index === 0) dayHeader.classList.add('sunday-header');
            if (index === 6) dayHeader.classList.add('saturday-header');
            calendarGrid.appendChild(dayHeader);
        });

        let tempDate = new Date(currentStartDate);
        for (let i = 0; i < WEEKS_TO_DISPLAY * DAYS_IN_WEEK; i++) {
            const cell = document.createElement('div');
            cell.classList.add('calendar-cell');
            cell.dataset.cellDate = formatDateToDash(tempDate);

            const dateNumberDiv = document.createElement('div');
            dateNumberDiv.classList.add('date-number');
            dateNumberDiv.textContent = tempDate.getDate();
            cell.appendChild(dateNumberDiv);

            const dayOfWeek = tempDate.getDay();
            if (dayOfWeek === 0) {
                dateNumberDiv.classList.add('sunday-date-number');
            } else if (dayOfWeek === 6) {
                dateNumberDiv.classList.add('saturday-date-number');
            }

            const eventsOnThisDay = allEvents.filter(event => 
                tempDate.getTime() >= event.date.getTime() && tempDate.getTime() <= event.endDate.getTime()
            );

            if (eventsOnThisDay.length > 0) {
                const eventsContainer = document.createElement('div');
                eventsContainer.classList.add('events-container');
                eventsOnThisDay.forEach(event => {
                    const eventDiv = document.createElement('div');
                    eventDiv.classList.add('event-entry');
                    eventDiv.dataset.gm = event.gm;
                    eventDiv.dataset.participants = event.participants.join(', ');
                    eventDiv.dataset.system = event.system;
                    eventDiv.dataset.eventName = event.eventName;
                    eventDiv.dataset.gid = event.gid;
                    eventDiv.dataset.startDate = formatDateToDash(event.date);
                    eventDiv.dataset.endDate = formatDateToDash(event.endDate);
                    
                    let actualDayInfo = '';
                    const isSingleDayEvent = event.date.getTime() === event.endDate.getTime();

                    // 複数日イベントの場合のみ、(DayN)を計算する
                    if (!isSingleDayEvent) {
                        if (tempDate.getTime() >= event.date.getTime() && tempDate.getTime() <= event.endDate.getTime()) {
                            const diffDays = Math.floor((tempDate.getTime() - event.date.getTime()) / (1000 * 60 * 60 * 24));
                            actualDayInfo = `（Day${diffDays + 1}）`;
                        }
                    }
                    eventDiv.dataset.dayInfo = actualDayInfo;

                    const bgColor = TRPG_SYSTEM_COLORS[event.system] || TRPG_SYSTEM_COLORS['default'];
                    
                    eventDiv.textContent = `${event.system}『${event.eventName}』`;
                    eventDiv.style.backgroundColor = bgColor;
                    eventDiv.style.color = getContrastYIQ(bgColor);
                    eventDiv.style.borderLeftColor = bgColor;
                    eventsContainer.appendChild(eventDiv);
                });
                cell.appendChild(eventsContainer);
            }

            const today = new Date();
            today.setHours(0,0,0,0);
            if (tempDate.getTime() === today.getTime()) {
                cell.classList.add('today');
                dateNumberDiv.classList.add('today-date-number');
            }

            if (tempDate.getTime() < today.getTime()) {
                cell.classList.add('past-date');
            }

            calendarGrid.appendChild(cell);
            tempDate.setDate(tempDate.getDate() + 1);
        }
    }

    if (prevWeekButton) {
        prevWeekButton.addEventListener('click', () => {
            if (!currentStartDate) return;
            currentStartDate.setDate(currentStartDate.getDate() - DAYS_IN_WEEK);
            renderCalendar();
        });
    }

    if (nextWeekButton) {
        nextWeekButton.addEventListener('click', () => {
            if (!currentStartDate) return;
            currentStartDate.setDate(currentStartDate.getDate() + DAYS_IN_WEEK);
            renderCalendar();
        });
    }

    let tooltipElement;

    function showTooltip(event) {
        const target = event.target.closest('.event-entry');
        if (!target) return;

        const gm = target.dataset.gm;
        const participantsString = target.dataset.participants;
        const originalEventGid = target.dataset.gid;
        const originalEventSystem = target.dataset.system;
        const originalEventName = target.dataset.eventName;

        const dayInfoFromDataset = target.dataset.dayInfo;

        let seriesMinDate = null;
        let seriesMaxDate = null;

        const targetEventName = target.dataset.eventName;
        const targetSystem = target.dataset.system;
        const targetGm = target.dataset.gm;
        const targetParticipantsRaw = target.dataset.participants;
        const targetParticipantsForCompare = targetParticipantsRaw 
            ? targetParticipantsRaw.split(', ').map(p => p.trim()).filter(p => p.length > 0) 
            : [];

        allEvents.forEach(eventBlock => {
            const eventBlockParticipantsForCompare = eventBlock.participants
                ? eventBlock.participants.map(p => p.trim()).filter(p => p.length > 0)
                : [];

            if (eventBlock.eventName === targetEventName &&
                eventBlock.system === targetSystem &&
                eventBlock.gm === targetGm &&
                areParticipantArraysEqual(eventBlockParticipantsForCompare, targetParticipantsForCompare)
            ) {
                if (!seriesMinDate || eventBlock.date.getTime() < seriesMinDate.getTime()) {
                    seriesMinDate = eventBlock.date;
                }
                if (!seriesMaxDate || eventBlock.endDate.getTime() > seriesMaxDate.getTime()) {
                    seriesMaxDate = eventBlock.endDate;
                }
            }
        });
        
        if (!tooltipElement) {
            tooltipElement = document.createElement('div');
            tooltipElement.classList.add('event-tooltip');
            document.body.appendChild(tooltipElement);
        }

        let tooltipContent = '';
        if (gm) {
            tooltipContent += `<strong>GM:</strong> ${gm}<br>`;
        }
        if (participantsString) {
            tooltipContent += `<strong>PL:</strong> ${participantsString}<br>`;
        }

        let eventStartDateForTooltip, eventEndDateForTooltip;
        let datesAreValidForTooltip = false;

        if (seriesMinDate && seriesMaxDate) {
            eventStartDateForTooltip = seriesMinDate;
            eventEndDateForTooltip = seriesMaxDate;
            datesAreValidForTooltip = true;
        } else {
            console.warn("Tooltip: Could not determine overall series dates. Using block dates from dataset.");
            const startParts = target.dataset.startDate.split('-');
            const endParts = target.dataset.endDate.split('-');
            if (startParts.length === 3 && endParts.length === 3) {
                eventStartDateForTooltip = new Date(parseInt(startParts[0],10), parseInt(startParts[1],10)-1, parseInt(startParts[2],10));
                eventEndDateForTooltip = new Date(parseInt(endParts[0],10), parseInt(endParts[1],10)-1, parseInt(endParts[2],10));
                if (!isNaN(eventStartDateForTooltip.getTime()) && !isNaN(eventEndDateForTooltip.getTime())) datesAreValidForTooltip = true;
            }
        }
        if (datesAreValidForTooltip) {
            tooltipContent += `<div class="event-duration-info">期間: ${formatEventPeriod(eventStartDateForTooltip, eventEndDateForTooltip)}</div>`;

            if (dayInfoFromDataset && dayInfoFromDataset !== "（ない）" && dayInfoFromDataset.trim() !== "") {
                const cleanedDayInfo = dayInfoFromDataset.replace(/[（）]/g, '');
                if (cleanedDayInfo.trim() !== "") {
                    tooltipContent += `<div class="event-day-info">${cleanedDayInfo}</div>`;
                }
            }
        } else {
            tooltipContent += `<div class="event-duration-info">期間: (日付情報エラー)</div>`;
        }
        tooltipElement.innerHTML = tooltipContent;
        tooltipElement.style.display = 'block';
    }

    function hideTooltip() {
        if (tooltipElement) {
            tooltipElement.style.display = 'none';
        }
    }

    if (calendarGrid) {
        calendarGrid.addEventListener('mouseover', showTooltip);
        calendarGrid.addEventListener('mouseout', hideTooltip);
        calendarGrid.addEventListener('mousemove', (e) => {
            if (tooltipElement && tooltipElement.style.display === 'block') {
                tooltipElement.style.left = `${e.pageX + 15}px`;
                tooltipElement.style.top = `${e.pageY + 15}px`;
            }
        });
    }

    fetchEventsAndRenderCalendar();
});


// ハンバーガーメニューの制御
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger-menu');
    const sideMenu = document.getElementById('tableOfContents');
    const overlay = document.getElementById('menu-overlay');

    // 対象の要素がすべて存在する場合のみ処理を実行
    if (hamburger && sideMenu && overlay) {
        
        // メニューを開閉する共通関数
        const toggleMenu = (isOpen) => {
            const action = isOpen ? 'add' : 'remove';
            sideMenu.classList[action]('is-open');
            overlay.classList[action]('is-open');
            document.body.classList[action]('no-scroll');
        };

        // ハンバーガーアイコンをクリックした時の処理
        hamburger.addEventListener('click', function() {
            // 現在メニューが開いているかどうかを判定し、逆の動作をさせる
            const isOpen = sideMenu.classList.contains('is-open');
            toggleMenu(!isOpen);
        });

        // オーバーレイをクリックした時の処理 (メニューを閉じる)
        overlay.addEventListener('click', function() {
            toggleMenu(false);
        });

        // メニュー内のリンクをクリックした時の処理
const menuLinks = sideMenu.querySelectorAll('a[href^="#"]'); // ★ hrefが#で始まるリンクのみを対象に変更
menuLinks.forEach(link => {
    link.addEventListener('click', function(e) { // ★ 引数 e を追加
        // ★★★ ここから下のブロックをまるごと追加 ★★★
        const href = link.getAttribute('href');
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            e.preventDefault(); // デフォルトのアンカー移動をキャンセル
            const offsetTop = targetElement.offsetTop - 80; // ヘッダー分を考慮したオフセット

            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
        // ★★★ ここまで追加 ★★★

        // ページ内リンクのスムーズスクロールを邪魔しないように少し待ってから閉じる
                setTimeout(() => {
                    toggleMenu(false);
                }, 150);
            });
        });
    }
});

// common.js の一番下に追加

// 目次のアクティブ状態をスクロールに応じて更新する
document.addEventListener('DOMContentLoaded', function() {
    const sideMenuLinks = document.querySelectorAll('#tableOfContents a[href^="#"]');
    const sections = Array.from(sideMenuLinks).map(link => {
        const id = link.getAttribute('href').substring(1);
        return document.getElementById(id);
    }).filter(section => section !== null);

    if (sideMenuLinks.length === 0 || sections.length === 0) return;

    const scrollHandlerForToc = () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY;

        sections.forEach(section => {
            // セクションの上端から少しオフセットした位置を基準にする
            const sectionTop = section.offsetTop - 100; // 100pxのオフセット
            if (scrollPosition >= sectionTop) {
                currentSectionId = section.getAttribute('id');
            }
        });

        sideMenuLinks.forEach(link => {
            link.classList.remove('active');
            const linkHref = link.getAttribute('href');
            if (linkHref === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    };
    
    window.addEventListener('scroll', scrollHandlerForToc);
    scrollHandlerForToc(); // 初期表示時にも実行
});
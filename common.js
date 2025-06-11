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

window.addEventListener('load', () => {
    resizeCanvas();
    animateParticles();
});
window.addEventListener('resize', resizeCanvas);

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
document.addEventListener('DOMContentLoaded', () => {
    const calendarContainer = document.getElementById('custom-calendar-container');
    // カレンダー関連の要素がページに存在する場合のみ初期化処理を実行
    if (!calendarContainer) {
        return;
    }

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
            // const fetchPromises = SPREADSHEET_URLS.map(url => // SPREADSHEET_URLS はもう使わないのでコメントアウト
            //     fetch(url)
            //         .then(response => {
            //             if (!response.ok) {
            //                 throw new Error(`HTTP error! status: ${response.status} for URL: ${url}`);
            //             }
            //             return response.text();
            //         })
            //         // gidを抽出してparseGoogleSheetCSVに渡す
            //         .then(csvText => parseGoogleSheetCSV(csvText, url.includes('gid=397661511') ? '397661511' : '783716063'))
            // );
            const response = await fetch(SPREADSHEET_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for URL: ${SPREADSHEET_URL}`);
            const csvText = await response.text();
            const parsedEvents = parseGoogleSheetCSV(csvText, '783716063'); // gidはイベント登録画面のもの

            completeDayInfo(parsedEvents); // dayInfo を補完する処理を追加
            allEvents = mergeConsecutiveEvents(parsedEvents); // 補完済みのイベントリストでマージ

            // 日付順にソート (マージ後にもソートしておく)
            allEvents.sort((a, b) => a.date - b.date);

            // 常に今日が含まれる週の日曜日を開始日とする
            currentStartDate = getSundayOfGivenDate(new Date());

            renderCalendar();
            const calendarElement = document.getElementById('custom-calendar-container');
            if (calendarElement) {
                setTimeout(() => {
                    calendarElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        } catch (error) {
            console.error("Error fetching or parsing CSV:", error);
            if (calendarGrid) calendarGrid.innerHTML = "<p>予定の読み込みに失敗しました。</p>";
        }
    }

    // Helper function to parse a CSV line, handling quoted fields
    // This handles fields enclosed in double quotes, and escaped double quotes ("") within a field.
    function parseCsvLine(line) {
        const values = [];
        let currentVal = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && i + 1 < line.length && line[i+1] === '"') {
                    // Escaped quote
                    currentVal += '"';
                    i++; // Skip next quote
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
        values.push(currentVal); // Add the last value
        return values;
    }
    // スプレッドシートのCSVデータをパースする関数
    function parseGoogleSheetCSV(csvText, gid) {
        const lines = csvText.trim().split('\n');
        const events = [];
        let headerRowIndex = 0;

        // if (gid === '397661511') { // カレンダーシートは使用しないためコメントアウト
        //     // gid=397661511 の場合、ヘッダー行を「イベント名」で検索
        //     const headerKeyword = "イベント名"; // スプレッドシートのヘッダー行に含まれるキーワード
        //     headerRowIndex = lines.findIndex(line => line.includes(headerKeyword));
        //     if (headerRowIndex === -1) {
        //         // console.warn(`Header row with keyword "${headerKeyword}" not found for gid ${gid}. Assuming first data row is at index 1 (after a single header row).`);
        //         headerRowIndex = 0; 
        //     }
        /* } else */ if (gid === '783716063') {
            // gid=783716063 の場合、ヘッダーは1行目 (インデックス0)
            headerRowIndex = 0;
        }

        for (let i = headerRowIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) {
                continue; // 空行はスキップ
            }
            const values = parseCsvLine(line); // Use robust CSV line parser

            let eventData = null;

            if (gid === '783716063') {
                // gid=783716063 の列定義 (既存ロジック)
                // B(1): 日程, C(2): システム, D(3): イベント名, E(4): GM, F(5)-K(10): 参加者
                if (values.length > 3 && values[1] && values[2] && values[3]) { // 日程(values[1])が必須
                    const dateStrRaw = values[1].trim();
                    const system = values[2].trim();
                    const eventName = values[3].trim();
                    const gm = (values.length > 4 && values[4] && values[4].trim() !== '') ? values[4].trim() : '';
                    const participants = [];
                    for (let p_idx = 5; p_idx <= 10; p_idx++) {
                        if (values.length > p_idx && values[p_idx] && values[p_idx].trim() !== '') {
                            const participantName = values[p_idx].trim().replace(/^"|"$/g, '');
                            if (participantName) {
                                participants.push(participantName);
                            }
                        }
                    }

                    if (!dateStrRaw) {
                        // console.warn(`Skipping line for gid ${gid} due to empty date. Line ${i + 1}: "${line}"`);
                        continue;
                    }

                    const dateStr = dateStrRaw.split('(')[0];
                    const parts = dateStr.split('/');
                    if (parts.length !== 3) {
                        // console.warn(`Invalid date string format for gid ${gid}: "${dateStr}" in CSV line ${i + 1}. Line: "${line}"`);
                        continue;
                    }
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
                    const day = parseInt(parts[2], 10);
                    // L列 (インデックス11) からN日目情報を取得
                    const dayInfo = (values.length > 11 && values[11] && values[11].trim() !== '') ? values[11].trim() : null;

                    const date = new Date(year, month, day); // Automatically local 00:00:00
                    const endDate = new Date(year, month, day); // 単日イベントとして扱う

                    if (isNaN(date.getTime())) {
                        continue;
                    }
                    eventData = { date, endDate, system, eventName, gm, participants, dayInfo };

                }
            }

            if (eventData) {
                events.push({
                    // id: values[0] ? values[0].trim() : '', // IDも取得する場合
                    date: eventData.date,
                    endDate: eventData.endDate,
                    system: eventData.system,
                    eventName: eventData.eventName,
                    gm: eventData.gm,
                    participants: eventData.participants,
                    dayInfo: eventData.dayInfo, // イベントオブジェクトに dayInfo を追加
                    gid: gid // gidをイベントデータに追加
                });
            } else {
                // 空行ではなく、かつどのgidの形式にも一致しなかった行（デバッグ用）
                if (line.split(',').some(val => val.trim() !== '')) {
                    // console.warn(`Skipping CSV line ${i + 1} for gid ${gid} due to insufficient data or unrecognized format. Line: "${line}"`);
                }
            }
        }
        // 個別のCSVパース後のソートは不要。全体をマージしてからソートする。
        return events;
    }
        // イベントグループ内で dayInfo を補完する関数
    function completeDayInfo(events) {
        if (!events || events.length === 0) return;

        const getGroupKey = (event) => {
            // 参加者リストをソートしてキーの一部にすることで、順序不問で同じグループとする
            const participantsKey = event.participants ? [...event.participants].sort().join(',') : '';
            return `${event.eventName}-${event.system}-${event.gm || ''}-${participantsKey}`;
        };

        const groupedEvents = {};
        for (const event of events) {
            const key = getGroupKey(event);
            if (!groupedEvents[key]) {
                groupedEvents[key] = [];
            }
            groupedEvents[key].push(event); // イベントオブジェクトの参照をグループに追加
        }

        for (const key in groupedEvents) {
            const group = groupedEvents[key];
            // グループ内で日付順にソート
            group.sort((a, b) => a.date.getTime() - b.date.getTime());

            let currentExpectedDayNumber = 0; // このグループ内での期待される日数カウンター

            for (let i = 0; i < group.length; i++) {
                const currentEvent = group[i]; // これは元の events 配列内のオブジェクトへの参照
                const dayInfoOriginal = currentEvent.dayInfo ? currentEvent.dayInfo.trim() : "";
                const dayInfoMatch = dayInfoOriginal.match(/^（(\d+)日目）$/); // 完全一致でN日目を抽出

                if (dayInfoMatch && dayInfoMatch[1]) {
                    // CSVに明示的な '（N日目）' 指定がある場合
                    currentExpectedDayNumber = parseInt(dayInfoMatch[1], 10);
                } else if (dayInfoOriginal === '（ない）' || dayInfoOriginal === '') {
                    // '（ない）' または空の場合、期待される日数で補完
                    currentExpectedDayNumber++;
                    currentEvent.dayInfo = `（${currentExpectedDayNumber}日目）`;
                } else {
                    // '（N日目）'でも '（ない）'でもないdayInfoの場合 (例: （最終日）など)
                    // このような場合はカウンターを進めるが、dayInfo自体は変更しない
                    currentExpectedDayNumber++;
                }
            }
        }
        // events 配列内のオブジェクトが直接変更された
    }
    // 連続するイベントをマージする関数
    function mergeConsecutiveEvents(events) {
        if (!events || events.length === 0) {
            return [];
        }

        // 日付、システム、イベント名、GMでソート
        events.sort((a, b) => {
            if (a.date.getTime() !== b.date.getTime()) return a.date.getTime() - b.date.getTime();
            if (a.system !== b.system) return a.system.localeCompare(b.system);
            if (a.eventName !== b.eventName) return a.eventName.localeCompare(b.eventName);
            if ((a.gm || '') !== (b.gm || '')) return (a.gm || '').localeCompare(b.gm || '');
            // 参加者配列の比較は複雑なので、主要キーでソートし、ループ内で詳細比較
            return 0;
        });

        const merged = [];
        let currentGroup = null;

        for (const event of events) {
            if (currentGroup &&
                currentGroup.system === event.system &&
                currentGroup.eventName === event.eventName &&
                (currentGroup.gm || '') === (event.gm || '') && // GMも比較対象に
                areParticipantArraysEqual(currentGroup.participants, event.participants) &&
                isNextDay(currentGroup.endDate, event.date)) {
                currentGroup.endDate = new Date(event.date); // 終了日を更新
            } else {
                if (currentGroup) {
                    merged.push(currentGroup);
                }
                currentGroup = { ...event, endDate: new Date(event.date) }; // 新しいグループ。endDateも初期化
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
        const dayOfWeek = newDate.getDay(); // 0 (日曜日) から 6 (土曜日)
        newDate.setDate(newDate.getDate() - dayOfWeek);
        newDate.setHours(0, 0, 0, 0); // 時刻をリセット
        return newDate;
    }
    // Dateオブジェクトを "YYYY-MM-DD" 形式の文字列に変換するヘルパー関数
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

    // イベント期間の表示フォーマット関数 (今後のために残しておきます)
    function formatEventPeriod(startDate, endDate) {
        const sy = startDate.getFullYear();
        const sm = startDate.getMonth() + 1;
        const sd = startDate.getDate();
        const ey = endDate.getFullYear();
        const em = endDate.getMonth() + 1;
        const ed = endDate.getDate();

        const startStr = `${sy}/${sm}/${sd}`;

        if (sy === ey && sm === em && sd === ed) {
            return startStr; // 例: 2025/6/10
        } else if (sy === ey && sm === em) {
            return `${startStr}-${ed}`; // 例: 2025/6/10-12
        } else if (sy === ey) {
            return `${startStr}-${em}/${ed}`; // 例: 2025/6/30-7/1
        } else {
            return `${startStr}-${ey}/${em}/${ed}`; // 例: 2025/12/30-2026/1/1
        }
    }

    // 背景色に応じて適切な文字色（黒または白）を返す関数
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
        calendarGrid.innerHTML = ''; // 前のカレンダーをクリア

        // 表示期間の更新
        const displayEndDate = new Date(currentStartDate);
        displayEndDate.setDate(currentStartDate.getDate() + (DAYS_IN_WEEK * WEEKS_TO_DISPLAY) - 1);
        if (currentWeekDisplay) {
            currentWeekDisplay.textContent = `${formatDate(currentStartDate)} - ${formatDate(displayEndDate)}`;
        }

        const systemColors = {
            'CoC': '#93c47d',
            'CoC-㊙': '#6aa84f',
            'SW': '#ea9999',
            'SW2.5': '#ea9999', // CSVにSW2.5が存在するため追加
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

        // 曜日ヘッダーの描画
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
            cell.dataset.cellDate = formatDateToDash(tempDate); // YYYY-MM-DD形式でローカル日付を保持

            const dateNumberDiv = document.createElement('div');
            dateNumberDiv.classList.add('date-number');
            dateNumberDiv.textContent = tempDate.getDate();
            cell.appendChild(dateNumberDiv);

            const dayOfWeek = tempDate.getDay();
            if (dayOfWeek === 0) { // Sunday
                dateNumberDiv.classList.add('sunday-date-number');
            } else if (dayOfWeek === 6) { // Saturday
                dateNumberDiv.classList.add('saturday-date-number');
            }

            const eventsOnThisDay = allEvents.filter(event => // 複数日にまたがるイベントも考慮
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
                    eventDiv.dataset.system = event.system; // systemをdatasetに追加
                    eventDiv.dataset.eventName = event.eventName; // eventNameをdatasetに追加
                    eventDiv.dataset.gid = event.gid; // gidをdatasetに追加
                    eventDiv.dataset.startDate = formatDateToDash(event.date); // 修正点1: ローカル日付をYYYY-MM-DDに
                    eventDiv.dataset.endDate = formatDateToDash(event.endDate);   // 修正点1: ローカル日付をYYYY-MM-DDに
                    let actualDayInfo = '';
                    if (event.dayInfo) {
                        const dayInfoMatch = event.dayInfo.match(/^（(\d+)日目）$/); // "（N日目）" 形式に一致するか確認
                        if (dayInfoMatch && dayInfoMatch[1]) { // 一致した場合
                            const firstDayNumber = parseInt(dayInfoMatch[1], 10); // N日目の数値を取得
                            const diffDays = Math.floor((tempDate.getTime() - event.date.getTime()) / (1000 * 60 * 60 * 24)); // 開始日からの経過日数を計算
                            if (diffDays >= 0) { // 開始日以降の場合
                                const currentDayNumber = firstDayNumber + diffDays; // 現在の経過日数を加算
                                if (currentDayNumber === 1) {
                                    actualDayInfo = '（Day1）'; // 1日目の場合は "（Day1）"
                                } else {
                                    actualDayInfo = `（Day${currentDayNumber}）`; // それ以外は "（DayN）"
                                }
                            } else {
                                // diffDays が負の値の場合、イベント開始日より前のセルにイベントブロックが表示されている
                                // これは通常起こらないはずなので、元の dayInfo をそのまま使用するか、または空にする
                                // ここでは空にして、表示しないようにする
                                actualDayInfo = '';
                            }
                        } else {
                            // "（N日目）" 形式でない場合は、元の dayInfo をそのまま使用
                            actualDayInfo = event.dayInfo;
                        }
                    }
                    eventDiv.dataset.dayInfo = actualDayInfo; // 計算および調整後の日ごとの dayInfo を設定

                    const bgColor = systemColors[event.system] || systemColors['default'];
                    eventDiv.textContent = `${event.system}『${event.eventName}』`;
                    eventDiv.style.backgroundColor = bgColor;

                    eventDiv.style.color = getContrastYIQ(bgColor);
                    eventDiv.style.borderLeftColor = bgColor; // 枠線も同色にするか、または別の色にするか調整可能
                    eventsContainer.appendChild(eventDiv);
                });
                cell.appendChild(eventsContainer);
            }

            const today = new Date();
            today.setHours(0,0,0,0); // 日付のみで比較
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
            currentStartDate.setDate(currentStartDate.getDate() - DAYS_IN_WEEK); // 1週間戻る
            renderCalendar();
        });
    }

    if (nextWeekButton) {
        nextWeekButton.addEventListener('click', () => {
            if (!currentStartDate) return;
            currentStartDate.setDate(currentStartDate.getDate() + DAYS_IN_WEEK); // 1週間進む
            renderCalendar();
        });
    }

    // Tooltip handling
    let tooltipElement;

    function showTooltip(event) {
        const target = event.target.closest('.event-entry');
        if (!target) return;

        const gm = target.dataset.gm;
        const participantsString = target.dataset.participants; // For display
        const originalEventGid = target.dataset.gid; // Not used for period calculation logic below
        const originalEventSystem = target.dataset.system; // Used for matching
        const originalEventName = target.dataset.eventName; // Used for matching

        const dayInfoFromDataset = target.dataset.dayInfo;

        // Determine the overall series start and end dates
        let seriesMinDate = null;
        let seriesMaxDate = null;

        const targetEventName = target.dataset.eventName;
        const targetSystem = target.dataset.system;
        const targetGm = target.dataset.gm; // Already normalized to '' if empty at source
        const targetParticipantsRaw = target.dataset.participants;
        // Create a sorted array of non-empty participant names for comparison
        const targetParticipantsForCompare = targetParticipantsRaw 
            ? targetParticipantsRaw.split(', ').map(p => p.trim()).filter(p => p.length > 0) 
            : [];

        allEvents.forEach(eventBlock => {
            // eventBlock.gm is already normalized to '' if empty
            // eventBlock.participants is an array of strings, filter out potential empty strings for robust comparison
            const eventBlockParticipantsForCompare = eventBlock.participants 
                ? eventBlock.participants.filter(p => p.length > 0)
                : [];

            if (eventBlock.eventName === targetEventName &&
                eventBlock.system === targetSystem &&
                eventBlock.gm === targetGm && // Direct comparison as GMs are normalized
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
        if (participantsString) { // Display the original participant string from dataset
            tooltipContent += `<strong>PL:</strong> ${participantsString}<br>`;
        }

        let eventStartDateForTooltip, eventEndDateForTooltip;
        let datesAreValidForTooltip = false;

        if (seriesMinDate && seriesMaxDate) {
            eventStartDateForTooltip = seriesMinDate;
            eventEndDateForTooltip = seriesMaxDate;
            datesAreValidForTooltip = true;
        } else {
            // Fallback if series dates couldn't be determined (should not happen for a valid event)
            // This indicates the hovered event itself wasn't found or matched in allEvents, which is an issue.
            console.warn("Tooltip: Could not determine overall series dates. Using block dates from dataset.");
            const startParts = target.dataset.startDate.split('-'); // Fallback to block's start
            const endParts = target.dataset.endDate.split('-');     // Fallback to block's end
            if (startParts.length === 3 && endParts.length === 3) {
                eventStartDateForTooltip = new Date(parseInt(startParts[0],10), parseInt(startParts[1],10)-1, parseInt(startParts[2],10));
                eventEndDateForTooltip = new Date(parseInt(endParts[0],10), parseInt(endParts[1],10)-1, parseInt(endParts[2],10));
                if (!isNaN(eventStartDateForTooltip.getTime()) && !isNaN(eventEndDateForTooltip.getTime())) datesAreValidForTooltip = true;
            }
        }
        if (datesAreValidForTooltip) {
            tooltipContent += `<div class="event-duration-info">期間: ${formatEventPeriod(eventStartDateForTooltip, eventEndDateForTooltip)}</div>`;

                // Display Nth day info (this part remains the same)
            if (dayInfoFromDataset && dayInfoFromDataset !== "（ない）" && dayInfoFromDataset.trim() !== "") {
                const cleanedDayInfo = dayInfoFromDataset.replace(/[（）]/g, '');
                if (cleanedDayInfo.trim() !== "") {
                    tooltipContent += `<div class="event-day-info">${cleanedDayInfo}</div>`;
                }
            } else {
            tooltipContent += `<div class="event-duration-info">期間: (日付情報エラー)</div>`;
         }
        }
        tooltipElement.innerHTML = tooltipContent;
        tooltipElement.style.display = 'block';
        // 位置の更新は mousemove で行う
    }

    function hideTooltip() {
        if (tooltipElement) {
            tooltipElement.style.display = 'none';
        }
    }

    if (calendarGrid) {
        calendarGrid.addEventListener('mouseover', showTooltip);
        calendarGrid.addEventListener('mouseout', hideTooltip);
        calendarGrid.addEventListener('mousemove', (e) => { // Ensure tooltip follows mouse
            if (tooltipElement && tooltipElement.style.display === 'block') {
                tooltipElement.style.left = `${e.pageX + 15}px`;
                tooltipElement.style.top = `${e.pageY + 15}px`;
            }
        });
    }

    fetchEventsAndRenderCalendar();
});

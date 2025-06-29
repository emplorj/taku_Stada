document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('daycord-table-container')) {
    initializeDaycordFeature();
  }
});

function initializeDaycordFeature() {
  const DAYCORD_URL = 'https://character-sheets.appspot.com/schedule/list?key=ahVzfmNoYXJhY3Rlci1zaGVldHMtbXByHAsSEkRpc2NvcmRTZXNzaW9uRGF0YRimu5y4BQw';
  const PROXY_URL = 'https://corsproxy.io/?';

  const nameSelect = document.getElementById('daycord-name-select');
  const addBtn = document.getElementById('add-participant-btn');
  const selectedContainer = document.getElementById('selected-participants-container');
  const tableContainer = document.querySelector('#daycord-table-container .table-wrapper');
  const resultsYoyu = document.getElementById('results-yoyu');
  const resultsDakyo = document.getElementById('results-dakyo');
  const resultsIchimatsu = document.getElementById('results-ichimatsu');
  const resultsHiru = document.getElementById('results-hiru');
  
  let allParticipantNames = [];
  let scheduleData = [];
  let selectedNames = [];

  const formatShortDate = (fullDate) => fullDate.length > 5 ? fullDate.substring(5) : fullDate;

  async function fetchAndParseDaycord() {
    try {
      tableContainer.innerHTML = '<p>デイコードの情報を読み込み中です...</p>';
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(DAYCORD_URL)}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      
      const table = doc.querySelector('table.schedule_table');
      if (!table) throw new Error('デイコードのテーブルが見つかりません。');

      const headerRow = table.querySelector('tr#namerow');
      const bodyRows = table.querySelectorAll('tbody tr[id^="row_"]');
      
      const headerCells = Array.from(headerRow.querySelectorAll('th'));
      const symbols = ['◎', '〇', '◯', '△', '×', '▢', '－'];
      
      allParticipantNames = headerCells
          .map(th => th.textContent.trim())
          .filter(name => name && !symbols.includes(name));

      scheduleData = Array.from(bodyRows).map(row => {
          const statusSpans = Array.from(row.querySelectorAll('td span.statustag'));
          const availability = statusSpans.map(span => {
              let status = span.textContent.trim();
              // status = status.replace(/確定/g, "").trim(); // 検証のためコメントアウト
              status = status.replace(/◯/g, "〇");
              return status || '－';
          });
          return {
              date: row.querySelector('th.datetitle')?.textContent.trim() || '日付不明',
              availability: availability
          };
      });

      if (allParticipantNames.length > 0 && scheduleData.length > 0 && allParticipantNames.length !== scheduleData[0].availability.length) {
          console.error('Participant count and status count do not match!', {
              participants: allParticipantNames.length,
              statuses: scheduleData[0].availability.length
          });
          tableContainer.innerHTML = `<p>データ解析エラー: 参加者数(${allParticipantNames.length})とステータス数(${scheduleData[0].availability.length})が一致しません。</p>`;
          return;
      }
      
      populateNameFilter();
      updateDisplay();
    } catch (error) {
      console.error("Error fetching or parsing Day-Code:", error);
      tableContainer.innerHTML = `<p>デイコードの情報読み込みに失敗しました: ${error.message}</p>`;
    }
  }

  function populateNameFilter() {
    if (!nameSelect) return;
    const collator = new Intl.Collator('ja');
    allParticipantNames.sort(collator.compare);
    
    const fragment = document.createDocumentFragment();
    allParticipantNames.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      fragment.appendChild(option);
    });
    // プルダウンをクリアしてから追加
    nameSelect.innerHTML = '<option value="">-- 名前を選択 --</option>';
    nameSelect.appendChild(fragment);
  }

  function renderSelectedParticipants() {
    if (!selectedContainer) return;
    selectedContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();
    selectedNames.forEach(name => {
      const tag = document.createElement('div');
      tag.className = 'participant-tag';
      tag.textContent = name;
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-participant-btn';
      removeBtn.textContent = '×';
      removeBtn.dataset.name = name;
      tag.appendChild(removeBtn);
      fragment.appendChild(tag);
    });
    selectedContainer.appendChild(fragment);
  }

  function renderDaycordTable() {
    if (selectedNames.length === 0) {
      tableContainer.innerHTML = '<p>参加者を選択すると、出欠表が表示されます。</p>';
      return;
    }

    const unenteredNames = selectedNames.filter(name => {
        const nameIndex = allParticipantNames.indexOf(name);
        if (nameIndex === -1) return false;
        return scheduleData.every(day => (day.availability[nameIndex] || '－') === '－');
    });

    let unenteredWarning = '';
    if (unenteredNames.length > 0) {
        unenteredWarning = `<div class="unentered-warning">⚠️ 未入力の参加者: ${unenteredNames.join(', ')}</div>`;
    }

    const table = document.createElement('table');
    table.className = 'daycord-table';
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    let headerHTML = '<th>参加者</th>';
    scheduleData.forEach(day => {
      headerHTML += `<th>${formatShortDate(day.date)}</th>`;
    });
    headerRow.innerHTML = headerHTML;

    const tbody = table.createTBody();
    const fragment = document.createDocumentFragment();
    selectedNames.forEach(name => {
      const nameIndex = allParticipantNames.indexOf(name);
      if (nameIndex === -1) return;
      
      const row = document.createElement('tr');
      let rowHTML = `<td>${name}</td>`;
      scheduleData.forEach(day => {
        const status = day.availability[nameIndex] || '－';
        rowHTML += `<td data-status="${status}">${status}</td>`;
      });
      row.innerHTML = rowHTML;
      fragment.appendChild(row);
    });
    tbody.appendChild(fragment);
    tableContainer.innerHTML = unenteredWarning;
    tableContainer.appendChild(table);
  }
  
  function calculateAvailableDates() {
    const resetText = selectedNames.length > 0 ? "..." : "参加者を選択してください";
    resultsYoyu.innerHTML = resultsDakyo.innerHTML = resultsIchimatsu.innerHTML = resultsHiru.innerHTML = resetText;
    if (selectedNames.length === 0) return;

    const selectedIndices = selectedNames.map(name => allParticipantNames.indexOf(name)).filter(index => index !== -1);
    if (selectedIndices.length !== selectedNames.length) return;

    const rules = {
      yoyu: ['◎', '〇'], dakyo: ['◎', '〇', '△'],
      ichimatsu: ['◎', '〇', '△', '－'], hiru: ['◎', '▢']
    };
    const results = { yoyu: [], dakyo: [], ichimatsu: [], hiru: [] };

    scheduleData.forEach(day => {
      const dayAvailability = selectedIndices.map(i => day.availability[i]);
      const isYoyu = dayAvailability.every(status => rules.yoyu.includes(status));
      const isDakyo = dayAvailability.every(status => rules.dakyo.includes(status));
      const isIchimatsu = dayAvailability.every(status => rules.ichimatsu.includes(status));
      const isHiru = dayAvailability.every(status => rules.hiru.includes(status));
      if (isYoyu) results.yoyu.push(day.date);
      if (isDakyo) results.dakyo.push(day.date);
      if (isIchimatsu) results.ichimatsu.push(day.date);
      if (isHiru) results.hiru.push(day.date);
    });

    const formatResults = (dates) => {
      if (dates.length === 0) return '該当なし';
      const formatted = [];
      let i = 0;
      while (i < dates.length) {
        let j = i;
        // isNextDayがcommon.jsにあることを期待
        while (j + 1 < dates.length && isNextDay(new Date(dates[j].split('(')[0]), new Date(dates[j + 1].split('(')[0]))) {
          j++;
        }
        if (j > i) {
          formatted.push(`<span class="consecutive-days">${formatShortDate(dates[i])}～${formatShortDate(dates[j])}</span>`);
        } else {
          formatted.push(formatShortDate(dates[i]));
        }
        i = j + 1;
      }
      return formatted.join(' / ');
    };
    
    resultsYoyu.innerHTML = formatResults(results.yoyu);
    resultsDakyo.innerHTML = formatResults(results.dakyo);
    resultsIchimatsu.innerHTML = formatResults(results.ichimatsu);
    resultsHiru.innerHTML = formatResults(results.hiru);
  }
  
  function updateDisplay() {
    renderSelectedParticipants();
    renderDaycordTable();
    calculateAvailableDates();
  }

  function addParticipant() {
    const name = nameSelect.value;
    if (name && !selectedNames.includes(name)) {
      selectedNames.push(name);
      updateDisplay();
    }
  }

  function removeParticipant(name) {
    selectedNames = selectedNames.filter(n => n !== name);
    updateDisplay();
  }

  // --- イベントリスナー設定 ---
  if (addBtn) addBtn.addEventListener('click', addParticipant);
  if (selectedContainer) {
    selectedContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-participant-btn')) {
        removeParticipant(e.target.dataset.name);
      }
    });
  }

  fetchAndParseDaycord();
}
document.addEventListener('DOMContentLoaded', function() {

  // --- ヘッダーのスクロールエフェクト ---
  const header = document.querySelector('.page-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // --- 注目の冒険者さん 機能 (REVISED) ---
  const setupFeaturedAdventurers = async () => {
    const container = document.querySelector('#members .member-list');
    if (!container) return;
    container.innerHTML = '<p>読み込み中...</p>';

    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=1134936986&single=true&output=csv';

    try {
      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(csvUrl)}`);
      if (!response.ok) throw new Error(`CSVの取得に失敗: ${response.statusText}`);
      const csvText = await response.text();

      // Use a simple split-based parser, assuming no newlines within fields.
      const allRows = csvText.trim().split('\n').map(row => row.split(','));
      const dataRows = allRows.slice(2); // Skip first two rows

      const adventurers = dataRows.map(row => ({
        name:        row[5] ? row[5].trim() : '',
        appearances: row[6] ? row[6].trim() : '',
        pl:          row[4] ? row[4].trim() : '',
        race:        row[7] ? row[7].trim() : '',
        birth:       row[11] ? row[11].trim() : '', // '生まれ'
        cl:          row[8] ? row[8].trim() : '', // CL (AL)
      })).filter(adv => adv.name && adv.appearances && !isNaN(parseInt(adv.appearances, 10)));

      const featuredCandidates = adventurers.filter(adv => parseInt(adv.appearances, 10) >= 2);

      if (featuredCandidates.length === 0) {
        container.innerHTML = '<p>注目の冒険者さんは現在いません。</p>';
        return;
      }

      const shuffled = featuredCandidates.sort(() => 0.5 - Math.random());
      const selectedAdventurers = shuffled.slice(0, Math.min(3, shuffled.length));

      container.innerHTML = '';
      selectedAdventurers.forEach(adv => {
        const card = createAdventurerCard(adv);
        container.appendChild(card);
      });

    } catch (error) {
      console.error('注目の冒険者さん機能でエラー:', error);
      container.innerHTML = '<p>情報の読み込みに失敗しました。</p>';
    }
  };

  const createAdventurerCard = (adventurer) => {
    const card = document.createElement('div');
    card.className = 'member-card adventurer-feature-card';

    const name = adventurer.name || '名前不明';
    const plName = adventurer.pl || 'PL不明';
    const race = adventurer.race || '種族不明';
    const birth = adventurer.birth || '生まれ不明';
    const cl = adventurer.cl || '?';

    card.innerHTML = `
        <div class="adventurer-level">Lv${cl}</div>
        <h3>${name}</h3>
        <p class="member-spec">${race} / ${birth}</p>
        <p class="pl-name">PL: ${plName}</p>
    `;
    return card;
  };

  setupFeaturedAdventurers();
});

/* ===================================================
   ギルドサイト専用ハンバーガーメニュー機能
   =================================================== */
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger-menu');
    const nav = document.querySelector('.page-nav');
    const body = document.body;

    if (hamburger && nav) {
        hamburger.addEventListener('click', function() {
            // ボタンとbodyにクラスを付け外しする
            hamburger.classList.toggle('is-open');
            body.classList.toggle('side-menu-open');
        });
    }
});
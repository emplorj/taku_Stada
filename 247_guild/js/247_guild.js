// 247_guild.js
// このページ専用のJavaScriptコードを記述します。

document.addEventListener('DOMContentLoaded', function() {
  const header = document.querySelector('.page-header');

  if (header) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // CSVからキャラクターを読み込む
  loadCharactersFromCSV();
});

async function loadCharactersFromCSV() {
  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=1134936986&single=true&output=csv';
  const staffContainer = document.getElementById('staff-container');
  const membersContainer = document.getElementById('members-container');

  if (!staffContainer || !membersContainer) {
    console.error('表示コンテナが見つかりません。');
    return;
  }

  const displayError = (message) => {
    const errorMessage = `<p style="color: red; font-weight: bold;">${message}</p>`;
    staffContainer.innerHTML = errorMessage;
    membersContainer.innerHTML = errorMessage;
  };

  staffContainer.innerHTML = '<p>スタッフ情報を読み込み中...</p>';
  membersContainer.innerHTML = '<p>メンバー情報を読み込み中...</p>';

  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(csvUrl)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`サーバーからの応答エラー: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    if (!csvText) {
      throw new Error('CSVデータの取得に成功しましたが、内容が空です。');
    }

    const characters = parseCsvToArray(csvText);
    if (!characters || characters.length <= 1) {
        throw new Error('CSVデータの解析に失敗したか、データがヘッダー行のみです。');
    }

    // Clear loading messages
    staffContainer.innerHTML = '';
    membersContainer.innerHTML = '';

    // ヘッダー行をスキップ
    const characterData = characters.slice(1);
    
    const staffToPrepend = [];
    const staticStaff = Array.from(staffContainer.children); // 既存の静的スタッフを取得

    characterData.forEach(character => {
      const [name, pl, race, mainSkill, subSkill, description, imageUrl] = character;
      if (!name) return;

      const card = document.createElement('div');
      card.className = 'member-card';
      const spec = `${race} / ${mainSkill}${subSkill ? '・' + subSkill : ''}`;
      const placeholderImg = 'https://via.placeholder.com/150';

      card.innerHTML = `
        <img src="${imageUrl || placeholderImg}" alt="${name}の画像">
        <h3>${name}</h3>
        <p class="member-spec">${spec}</p>
        <p class="member-desc">${description}</p>
      `;

      if (name === 'ミカ・ニシナ' || name === 'ゾロメ') {
        staffToPrepend.push(card);
      } else {
        membersContainer.appendChild(card);
      }
    });
    
    staffContainer.prepend(...staffToPrepend, ...staticStaff);

  } catch (error) {
    console.error('キャラクター情報の読み込みに失敗しました:', error);
    displayError(`読み込みエラー: ${error.message}`);
  }
}
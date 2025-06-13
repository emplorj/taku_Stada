document.addEventListener('DOMContentLoaded', () => {

    const TIER_LIST_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZD5dgrOldHCwAQ_VVeUbR6VAcTsEs4ycwXW1jLV99KUo3LtmFQgHZtRmerAL8wcfw6BBBKLvbaxDk/pub?gid=821569272&single=true&output=csv'; 
    
    // tier_list.js の tierRankMap を置き換え

    const tierRankMap = {
        // Aランク (必須) - 画像のAランク（ピンク系）
        1: { name: "必須", color: "linear-gradient(135deg, #ff79c6, #ff55b4)" }, 
        // Bランク (かなり買い) - 画像のBランク（赤系）
        2: { name: "かなり買い", color: "linear-gradient(135deg, #ff5555, #d62828)" },
        // Cランク (けっこう使う) - 画像のCランク（オレンジ系）
        3: { name: "けっこう使う", color: "linear-gradient(135deg, #ffb703, #fb8500)" },
        // Dランク (場合によっちゃ買い) - 画像のDランク（黄色系）
        4: { name: "場合によっちゃ買い", color: "linear-gradient(135deg, #ffff7f, #f1e05a)" },
        // Eランク (読み物として) - 画像のEランク（緑系）
        5: { name: "読み物として", color: "linear-gradient(135deg, #7fff7f, #52b788)" },
        // Fランク (そこまで) - 画像のFランク（水色系）
        6: { name: "そこまで", color: "linear-gradient(135deg, #7fbfff, #457b9d)" },
        // Gランク (いらん) - 画像のGランク（グレー系）
        7: { name: "いらん", color: "linear-gradient(135deg, #999999, #999999)" }
    };

    const mainContainer = document.getElementById('systems-tier-list-container');
    if (!mainContainer) return;

    function parseRobustCSV(csvText) {
        const rows = []; let inQuotes = false; let currentRow = []; let currentField = '';
        const text = csvText.trim().replace(/\r/g, '');
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') {
                if (inQuotes && text[i + 1] === '"') { currentField += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (char === ',' && !inQuotes) { currentRow.push(currentField); currentField = ''; }
            else if (char === '\n' && !inQuotes) { currentRow.push(currentField); rows.push(currentRow); currentRow = []; currentField = ''; }
            else { currentField += char; }
        }
        currentRow.push(currentField); rows.push(currentRow);
        return rows;
    }

    async function buildAllTierLists() {
        try {
            mainContainer.innerHTML = '<p>リストを生成中...</p>';
            const response = await fetch(TIER_LIST_CSV_URL, { cache: 'no-cache' });
            if (!response.ok) throw new Error('Tierリストデータの取得に失敗');
            const csvText = await response.text();
            const allRows = parseRobustCSV(csvText);
            
            const header = allRows[0];
            const dataRows = allRows.slice(1);

            const requiredHeaders = ['system', 'rankOrder', 'title', 'imageUrl', 'bookUrl'];
            if (!requiredHeaders.every(h => header.includes(h))) {
                 throw new Error(`CSVヘッダーに必須項目（${requiredHeaders.join(', ')}）がありません。`);
            }

            const headerMap = {};
            header.forEach((h, i) => { headerMap[h.trim()] = i; });

            const allBooks = dataRows.map(row => {
                const book = {};
                Object.keys(headerMap).forEach(key => {
                    book[key] = (row[headerMap[key]] || '').trim();
                });
                return book;
            }).filter(book => book.system);
            
            //const dx3Books = allBooks.filter(book => book.system === 'DX3');
            const systems = groupBy(allBooks, 'system');
            generateHtml(systems);

        } catch (error) {
            console.error('Tierリストの生成に失敗しました:', error);
            mainContainer.innerHTML = `<p class="error">リストの表示に失敗しました。<br>${error.message}</p>`;
        }
    } // ★★★ ここに抜けていた '}' を追加しました ★★★

    function groupBy(array, key) {
        return array.reduce((result, currentValue) => {
            (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
            return result;
        }, {});
    }

    function generateHtml(systems) {
        mainContainer.innerHTML = '';
        Object.keys(systems).sort().forEach((systemName, index) => {
            const booksInSystem = systems[systemName];
            const tiers = groupBy(booksInSystem, 'rankOrder');
            const details = document.createElement('details');
            details.className = 'system-details-block';
                    // ★★★ このif文を追加 ★★★
            if (systemName === 'DX3') {
                details.classList.add('theme-dx3');
            }
            
            if (index === 0) details.open = true; 
            const summary = document.createElement('summary');
            summary.className = 'system-summary';
            summary.innerHTML = `<h2>${systemName}</h2><div class="arrow-icon"></div>`;
            const tierListContainer = document.createElement('div');
            tierListContainer.className = 'tier-list-container';
            Object.keys(tiers).sort((a, b) => a - b).forEach(rankOrder => {
                const tierInfo = tierRankMap[rankOrder] || { name: `ランク ${rankOrder}`, color: '#cccccc' };
                const booksInTier = tiers[rankOrder];
                const row = document.createElement('div');
                row.className = 'tier-row';
                const labelCell = document.createElement('div');
                labelCell.className = 'tier-label-cell';
                labelCell.textContent = tierInfo.name;
                labelCell.style.background = tierInfo.color;
                const booksCell = document.createElement('div');
                booksCell.className = 'tier-books-cell';
                booksInTier.forEach(book => {
    // book-card を <a> タグとして生成
    const link = document.createElement('a');
    link.className = 'book-card';
    // ★★★ hrefはモーダル内のボタンに任せ、ここではJSで開く ★★★
    link.href = "javascript:void(0)"; 
    link.onclick = () => openBookModal(book);

    // 書影
    const img = document.createElement('img');
    img.src = book.imageUrl;
    img.alt = book.title;
    link.appendChild(img); // 画像を追加

    // 略称（もしあれば）
    if (book.abbreviation && book.abbreviation.trim() !== '') {
        const abbreviationSpan = document.createElement('span');
        abbreviationSpan.className = 'book-abbreviation';
        abbreviationSpan.textContent = book.abbreviation;
        link.appendChild(abbreviationSpan);
    }
    
    // ツールチップ
    const tooltip = document.createElement('div');
    tooltip.className = 'book-tooltip';
    const categoryHtml = book.category ? `<div class="category">${book.category}</div>` : '';
    tooltip.innerHTML = `
        ${categoryHtml}
        <div class="title">${book.title}</div>
        <div class="price">${book.price}</div>
        <div class="release-date">発売日: ${book.releaseDate}</div>
    `;
    link.appendChild(tooltip); // ツールチップを追加

    booksCell.appendChild(link);
});
                row.appendChild(labelCell);
                row.appendChild(booksCell);
                tierListContainer.appendChild(row);
            });
            details.appendChild(summary);
            details.appendChild(tierListContainer);
            mainContainer.appendChild(details);
        });
    }

    const modal = document.getElementById('book-details-modal');
    const closeModalBtn = document.querySelector('.book-modal-close-button');
    const modalOverlay = document.querySelector('.book-modal-overlay');

    function openBookModal(book) {
    if (!modal) return;
    
    // (モーダルのテーマクラス設定や、各要素へのデータ設定は変更なし)
    const modalContent = document.querySelector('.book-modal-content');
    if (!modalContent) return;
    modalContent.classList.remove('theme-dx3'); 
    if (book.system === 'DX3') { modalContent.classList.add('theme-dx3'); }
    document.getElementById('book-modal-title').textContent = book.title;
    const categoryEl = document.getElementById('book-modal-category');
    if (book.category) { categoryEl.textContent = book.category; categoryEl.style.display = 'block'; } 
    else { categoryEl.style.display = 'none'; }
    document.getElementById('book-modal-price').textContent = book.price || 'N/A';
    document.getElementById('book-modal-release-date').textContent = book.releaseDate || 'N/A';
    document.getElementById('book-modal-abbreviation').textContent = book.abbreviation || 'N/A';
    document.getElementById('book-modal-official-info').innerHTML = (book.official_info || '（公式解説はありません）').replace(/\n/g, '<br>');
    const imageArea = document.querySelector('.book-modal-image-area');
    imageArea.innerHTML = `<a href="${book.bookUrl}" target="_blank" rel="noopener noreferrer"><img src="${book.imageUrl}" alt="${book.title}"></a>`;
    document.getElementById('book-modal-link').href = book.bookUrl;
    
    // --- infoテキストの変換処理 ---
    const infoText = book.info || '（個人の見解はありません）';
    
    // MarkdownをHTMLに変換
    let formattedInfo = infoText
        // ★★★ 1. 新しい見出し記法(!)を変換する処理を一番上に追加 ★★★
        .replace(/^! (.*$)/gim, '<h2 class="biggest-heading">$1</h2>')
        
        // 2. 既存の見出し記法(#)は h4, h5, h6 のまま
        .replace(/^# (.*$)/gim, '<h4>$1</h4>')
        .replace(/^## (.*$)/gim, '<h5>$1</h5>')
        .replace(/^### (.*$)/gim, '<h6>$1</h6>')
        
        // 3. 既存の太字と改行
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
        .replace(/\n/g, '<br>');
        
    document.getElementById('book-modal-info').innerHTML = formattedInfo;

    // --- モーダル表示 ---
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
}

    function closeBookModal() {
        if (!modal) return;
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeBookModal);
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeBookModal();
            }
        });
    }

    buildAllTierLists();
});


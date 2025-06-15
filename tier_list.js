document.addEventListener('DOMContentLoaded', () => {

    const TIER_LIST_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZD5dgrOldHCwAQ_VVeUbR6VAcTsEs4ycwXW1jLV99KUo3LtmFQgHZtRmerAL8wcfw6BBBKLvbaxDk/pub?gid=821569272&single=true&output=csv'; 
    
    const TIER_DEFINITIONS = {
        "SW": {
            1: { name: "S,必須",         color: "linear-gradient(135deg, #ff79c6, #ff55b4)" },
            2: { name: "A,ド便利",         color: "linear-gradient(135deg, #ff7f7f, #e63946)" },
            3: { name: "B,推奨",         color: "linear-gradient(135deg, #ffb703, #fb8500)" },
            4: { name: "C,たまに使う",   color: "linear-gradient(135deg, #f1e05a, #A79C1D)" },
            5: { name: "D,読み物としても",       color: "linear-gradient(135deg, #7fff7f, #52b788)" },
            6: { name: "E,場合による",       color: "linear-gradient(135deg, #7fbfff, #457b9d)" },
            7: { name: "F,シナリオとか",       color: "linear-gradient(135deg, #7f7fff, #480ca8)" },
            8: { name: "G,上位互換有",         color: "linear-gradient(135deg, #bfbfbf, #8d8d8d)" }
        },
        "DX3": {
            1: { name: "S,必須",             color: "linear-gradient(135deg, #ff7f7f, #e63946)" },
            2: { name: "A,かなり買い",       color: "linear-gradient(135deg, #ffb703, #fb8500)" },
            3: { name: "B,幅が広がる",        color: "linear-gradient(135deg, #f1e05a, #A79C1D)" },
            4: { name: "C,使える要素アリ", color: "linear-gradient(135deg, #7fff7f, #52b788)" },
            5: { name: "D,読み物として",       color: "linear-gradient(135deg, #7fbfff, #457b9d)" },
            6: { name: "E,通常で使える<br>追加要素無し",         color: "linear-gradient(135deg, #7f7fff, #480ca8)" },
            7: { name: "Z,⚠禁書⚠<br>通常で使えん",       color: "linear-gradient(135deg, #bfbfbf, #8d8d8d)" }
        },
        "サタスペ": {
            1: { name: "S,必須",         color: "linear-gradient(135deg, #ff7f7f, #e63946)" },
            2: { name: "A,最優先",         color: "linear-gradient(135deg, #ffb703, #fb8500)" },
            3: { name: "B,推奨",         color: "linear-gradient(135deg, #f1e05a, #A79C1D)" },
            4: { name: "C,あると良い",     color: "linear-gradient(135deg, #7fff7f, #52b788)" },
            5: { name: "D,状況次第",       color: "linear-gradient(135deg, #7fbfff, #457b9d)" },
            6: { name: "Z,絶版！",         color: "linear-gradient(135deg, #bfbfbf, #8d8d8d)" }
        },
        "ネクロニカ": {
            1: { name: "S,必須",         color: "linear-gradient(135deg, #ff7f7f, #e63946)" },
            2: { name: "A,追加要素",         color: "linear-gradient(135deg, #ffb703, #fb8500)" },
            3: { name: "B,GMなら…",         color: "linear-gradient(135deg, #f1e05a, #A79C1D)" },
            4: { name: "C,ディープに",       color: "linear-gradient(135deg, #7fbfff, #457b9d)" },
            5: { name: "D,非公式",       color: "linear-gradient(135deg, #bfbfbf, #8d8d8d)" }
        },
        // ★★★ 「その他」は、どのシステムにも一致しない場合のデフォルト設定として機能します ★★★
        "その他": {
            1: { name: "S,神",         color: "linear-gradient(135deg, #ff79c6, #ff55b4)" },
            2: { name: "A,必須",         color: "linear-gradient(135deg, #ff7f7f, #e63946)" },
            3: { name: "B,推奨",         color: "linear-gradient(135deg, #ffb703, #fb8500)" },
            4: { name: "C,あると便利",   color: "linear-gradient(135deg, #f1e05a, #A79C1D)" },
            5: { name: "D,GMなら",       color: "linear-gradient(135deg, #7fff7f, #52b788)" },
            6: { name: "E,読み物",       color: "linear-gradient(135deg, #7fbfff, #457b9d)" },
            7: { name: "F,限定的",       color: "linear-gradient(135deg, #7f7fff, #480ca8)" },
            8: { name: "G,不要",         color: "linear-gradient(135deg, #bfbfbf, #8d8d8d)" }
        }
    };

    // (中略: formatTextWithMarkdown, groupBy は変更なし)
    function formatTextWithMarkdown(text){return text?text.replace(/^! (.*$)/gim,'<p class="custom-highlight-text">$1</p>').replace(/^# (.*$)/gim,"<h4>$1</h4>").replace(/^## (.*$)/gim,"<h5>$1</h5>").replace(/^### (.*$)/gim,"<h6>$1</h6>").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br>"):"";}
    function groupBy(array,key){return array.reduce((result,currentValue)=>((result[currentValue[key]]=result[currentValue[key]]||[]).push(currentValue),result),{})}
    
    const mainContainer = document.getElementById('systems-tier-list-container');
    const modal = document.getElementById('book-details-modal');
    const closeModalBtn = document.querySelector('.book-modal-close-button');
    const modalOverlay = document.querySelector('.book-modal-overlay');

    if (!mainContainer) return;

    function generateHtml(systems) {
        mainContainer.innerHTML = '';
        
        const sortedSystemNames = Object.keys(systems).sort((a, b) => {
            if (a === 'SW') return -1; if (b === 'SW') return 1;
            if (a === 'DX3') return -1; if (b === 'DX3') return 1;
            
            return a.localeCompare(b);
        });

        sortedSystemNames.forEach((systemName) => {
            if (!systems[systemName] || systems[systemName].length === 0) return;

            const booksInSystem = systems[systemName];
            const tiers = groupBy(booksInSystem, 'rankOrder');
            const details = document.createElement('details');
            details.className = 'system-details-block';

            // ★★★ 2. ネクロニカのテーマを適用する処理を追加 ★★★
            if (systemName === 'DX3') { details.classList.add('theme-dx3'); } 
            else if (systemName === 'SW') { details.classList.add('theme-sw25'); } 
            else if (systemName === 'サタスペ') { details.classList.add('theme-satasupe'); }
            else if (systemName === 'ネクロニカ') { details.classList.add('theme-necronica'); }
            
            details.open = true;
            
            const summary = document.createElement('summary');
            summary.className = 'system-summary';
            summary.innerHTML = `<h2>${systemName}</h2><div class="arrow-icon"></div>`;
            
            const tierListContainer = document.createElement('div');
            tierListContainer.className = 'tier-list-container';
            
            Object.keys(tiers).sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).forEach(rankOrder => {
                
                // ★★★ 3. 「その他」をフォールバックとして使うロジックに変更 ★★★
                let tierDefinition = TIER_DEFINITIONS[systemName];
                if (!tierDefinition) {
                    tierDefinition = TIER_DEFINITIONS["その他"];
                }
                
                const tierInfo = tierDefinition ? tierDefinition[rankOrder] : null;

                if (!tierInfo) {
                    console.warn(`システム[${systemName}]のランク[${rankOrder}]の定義が見つかりません。`);
                    return; 
                }
                
                const nameParts = tierInfo.name.split(',');
                const rankLetter = nameParts[0].trim();
                const rankDescription = nameParts.length > 1 ? nameParts[1].trim() : '';
                const tierColor = tierInfo.color;
                const booksInTier = tiers[rankOrder];

                const row = document.createElement('div');
                row.className = 'tier-row';
                const labelCell = document.createElement('div');
                labelCell.className = 'tier-label-cell';
                
                labelCell.innerHTML = `
                    <span class="tier-rank-letter">${rankLetter}</span>
                    <span class="tier-rank-name">${rankDescription}</span>
                `;
                labelCell.style.background = tierColor;
                
                const booksCell = document.createElement('div');
                booksCell.className = 'tier-books-cell';
                
                booksInTier.forEach(book => {
                    const card = document.createElement('a');
                    card.className = 'book-card';
                    card.href = "javascript:void(0)";
                    card.onclick = (e) => { e.preventDefault(); openBookModal(book); };
                    
                    const img = document.createElement('img');
                    img.src = book.imageUrl;
                    img.alt = book.title;
                    card.appendChild(img);

                    if (book.abbreviation && book.abbreviation.trim() !== '') {
                        const abbreviationSpan = document.createElement('span');
                        abbreviationSpan.className = 'book-abbreviation';
                        abbreviationSpan.textContent = book.abbreviation;
                        card.appendChild(abbreviationSpan);
                    }
                    
                    const tooltip = document.createElement('div');
                    tooltip.className = 'book-tooltip';
                    const categoryHtml = book.category ? `<div class="category">${book.category}</div>` : '';
                    tooltip.innerHTML = `${categoryHtml}<div class="title">${book.title}</div><div class="price">${book.price || ''}</div><div class="release-date">発売日: ${book.releaseDate || ''}</div>`;
                    card.appendChild(tooltip);
                    
                    booksCell.appendChild(card);
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

    function openBookModal(book) {
        if (!modal) return;
        const modalContent = document.querySelector('.book-modal-content');
        if (!modalContent) return;

        modalContent.className = 'book-modal-content'; 
        // ★★★ 4. ネクロニカのモーダルテーマを適用する処理を追加 ★★★
        if (book.system === 'DX3') { modalContent.classList.add('theme-dx3'); } 
        else if (book.system === 'SW') { modalContent.classList.add('theme-sw25'); } 
        else if (book.system === 'サタスペ') { modalContent.classList.add('theme-satasupe'); }
        else if (book.system === 'ネクロニカ') { modalContent.classList.add('theme-necronica'); }

        document.getElementById('book-modal-title').textContent = book.title;
        const categoryEl = document.getElementById('book-modal-category');
        if (book.category) { categoryEl.textContent = book.category; categoryEl.style.display = 'block'; } 
        else { categoryEl.style.display = 'none'; }
        
        document.getElementById('book-modal-price').innerHTML = book.price || 'N/A';
        document.getElementById('book-modal-release-date').textContent = book.releaseDate || 'N/A';
        document.getElementById('book-modal-abbreviation').textContent = book.abbreviation || 'N/A';

        const officialInfoText = book.official_info || '（公式解説はありません）';
        document.getElementById('book-modal-official-info').innerHTML = formatTextWithMarkdown(officialInfoText);
        
        const infoText = book.info || '（個人の見解はありません）';
        document.getElementById('book-modal-info').innerHTML = formatTextWithMarkdown(infoText);

        const imageArea = document.querySelector('.book-modal-image-area');
        imageArea.innerHTML = `<a href="${book.bookUrl}" target="_blank" rel="noopener noreferrer"><img src="${book.imageUrl}" alt="${book.title}"></a>`;
        
        const linkElement = document.getElementById('book-modal-link');
        linkElement.href = book.bookUrl;

        if (book.bookUrl && book.bookUrl.includes('bookwalker.jp')) {
            linkElement.innerHTML = `<i class="fas fa-external-link-alt"></i> BookWalkerで見る`;
        } else {
            linkElement.innerHTML = `<i class="fas fa-external-link-alt"></i> Amazonで見る`;
        }
        
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }

    // (中略: closeBookModal, buildAllTierLists は変更なし)
    function closeBookModal(){if(modal){modal.style.display="none";document.body.classList.remove("modal-open")}}
    async function buildAllTierLists(){
        try{
            mainContainer.innerHTML="<p>リストを生成中...</p>";
            const response=await fetch(TIER_LIST_CSV_URL,{cache:"no-cache"});
            if(!response.ok)throw new Error("Tierリストデータの取得に失敗");
            const csvText=await response.text(),allRows=parseCsvToArray(csvText),header=allRows[0],dataRows=allRows.slice(1); // parseCsvToArray を使用
            if(!["system","rankOrder","title","imageUrl","bookUrl"].every(h=>header.includes(h)))throw new Error(`CSVヘッダーに必須項目（system, rankOrder, title, imageUrl, bookUrl）がありません。`);const headerMap={};header.forEach((h,i)=>{headerMap[h.trim()]=i});const allBooks=dataRows.map(row=>{const book={};return Object.keys(headerMap).forEach(key=>{book[key]=(row[headerMap[key]]||"").trim()}),book}).filter(book=>book.system&&book.system.trim()!==""),systems=groupBy(allBooks,"system");generateHtml(systems)}catch(error){console.error("Tierリストの生成に失敗しました:",error),mainContainer.innerHTML=`<p class="error">リストの表示に失敗しました。<br>${error.message}</p>`}
    }

    if (closeModalBtn) { closeModalBtn.addEventListener('click', closeBookModal); }
    if (modalOverlay) { modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) { closeBookModal(); } }); }
    
    buildAllTierLists();
});
// card_generator.js (最終修正版)
document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const cardColorSelect = document.getElementById('card-color-select');
    const cardTypeSelect = document.getElementById('card-type-select');
    const cardNameInput = document.getElementById('card-name-input');
    const backgroundSelect = document.getElementById('background-select');
    const imageUpload = document.getElementById('image-upload');
    const imageFileName = document.getElementById('image-file-name');
    const resetImageBtn = document.getElementById('reset-image-btn');
    const effectInput = document.getElementById('effect-input');
    const flavorInput = document.getElementById('flavor-input');
    const flavorSpeakerInput = document.getElementById('flavor-speaker-input');
    const downloadBtn = document.getElementById('download-btn');
    const highResCheckbox = document.getElementById('high-res-checkbox');
    const downloadTemplateBtn = document.getElementById('download-template-btn');
    const cardContainer = document.getElementById('card-container');
    const backgroundImage = document.getElementById('background-image');
    const cardTemplateImage = document.getElementById('card-template-image');
    const imageContainer = document.getElementById('image-container');
    const cardImage = document.getElementById('card-image');
    const cardNameContainer = document.getElementById('card-name-container');
    const cardNameContent = document.getElementById('card-name-content');
    const textBoxContainer = document.getElementById('text-box-container');
    const effectDisplay = document.getElementById('effect-display');
    const flavorGroup = document.getElementById('flavor-group');
    const flavorDisplay = document.getElementById('flavor-display');
    const flavorSpeakerDisplay = document.getElementById('flavor-speaker-display');
    const batchFileUpload = document.getElementById('batch-file-upload');
    const batchFileName = document.getElementById('batch-file-name');
    const batchDownloadBtn = document.getElementById('batch-download-btn');
    const batchProgress = document.getElementById('batch-progress');
    const imageFolderUpload = document.getElementById('image-folder-upload');
    const imageFolderName = document.getElementById('image-folder-name');
    const previewWrapper = document.querySelector('.preview-wrapper');
    const previewPanel = document.querySelector('.preview-panel');
    const previewArea = document.getElementById('preview-area');
    const sparkleCheckbox = document.getElementById('sparkle-checkbox');
    const sparkleOverlayImage = document.getElementById('sparkle-overlay-image');
    const overlayImageUpload = document.getElementById('overlay-image-upload');
    const overlayImageFileName = document.getElementById('overlay-image-file-name');
    const resetOverlayImageBtn = document.getElementById('reset-overlay-image-btn');
    const overlayImageContainer = document.getElementById('overlay-image-container');
    const overlayImage = document.getElementById('overlay-image');
    const editModeRadios = document.querySelectorAll('input[name="edit-mode"]');
    const resetImagePositionBtn = document.getElementById('reset-image-position-btn');
    const resetOverlayPositionBtn = document.getElementById('reset-overlay-position-btn');
    const batchDetails = document.querySelector('.batch-processing-details');
    
    // DBモーダル関連
    const openDbModalBtn = document.getElementById('open-db-modal-btn');
    const dbModalOverlay = document.getElementById('db-modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const dbUpdateBtn = document.getElementById('db-update-btn');
    const dbCreateBtn = document.getElementById('db-create-btn');
    const registrantInput = document.getElementById('registrant-input');
    const artistInput = document.getElementById('artist-input');
    
    // DB表示関連
    const tabDatabase = document.getElementById('tab-database');
    const cardListContainer = document.getElementById('card-list-container');
    const dbSearchInput = document.getElementById('db-search-input');
    const dbSortSelect = document.getElementById('db-sort-select');
    const dbColorFilterContainer = document.getElementById('db-color-filter-container');

    // 定型文モーダル関連
    const openTeikeiModalBtn = document.getElementById('open-teikei-modal-btn');
    const teikeiModalOverlay = document.getElementById('teikei-modal-overlay');
    const teikeiModalCloseBtn = document.getElementById('teikei-modal-close-btn');
    const teikeiListContainer = document.getElementById('teikei-list-container');

    const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby0sdv9U56rGPoyTAViGNAAJGvG-IbmRCJKfodjr5NuzAyUc9n-dfH1UdDEqF0KHZ4U9g/exec';
    const IMGBB_API_KEY = '906b0e42b775a8ba283f16cd35fb667f';

    // 状態管理
    let isDragging = false, startX, startY;
    let imageState = { x: 0, y: 0, scale: 1 }, overlayImageState = { x: 0, y: 0, scale: 1 };
    let imageFitDirection, overlayImageFitDirection;
    let activeManipulationTarget = 'base';
    let currentEditingCardId = null, originalImageUrlForEdit = null, isNewImageSelected = false;
    let allCardsData = [], selectedColorFilter = 'all';
    let teikeiCategories = [];
    
    const cardColorData = { "赤": { name: "赤", description: "BAD EVENT", color: "#990000", hover: "#7a0000", textColor: "#FFFFFF" },"青": { name: "青", description: "GOOD EVENT", color: "#3366CC", hover: "#2851a3", textColor: "#FFFFFF" },"緑": { name: "緑", description: "取得可能", color: "#009933", hover: "#007a29", textColor: "#FFFFFF" },"黄": { name: "黄", description: "金銭、トレジャー", color: "#FFCC66", hover: "#d9ad52", textColor: "#2c3e50" },"橙": { name: "橙", description: "その他", color: "#996633", hover: "#7a5229", textColor: "#FFFFFF" },"紫": { name: "紫", description: "エネミー等", color: "#663366", hover: "#522952", textColor: "#FFFFFF" },"白": { name: "白", description: "RPで切り抜ける", color: "#CCCCCC", hover: "#a3a3a3", textColor: "#2c3e50" },"黒": { name: "黒", description: "フィールド", color: "#333333", hover: "#1a1a1a", textColor: "#FFFFFF" },"虹": { name: "虹", description: "合体/激ヤバ", color: 'linear-gradient(45deg, #e74c3c, #f1c40f, #2ecc71, #3498db, #9b59b6)', hover: 'linear-gradient(45deg, #c0392b, #e67e22, #27ae60, #2980b9, #8e44ad)', textColor: "#FFFFFF" }};
    const cardTypes = { "": { name: "標準" }, "CF": { name: "タイトル枠なし" }, "FF": { name: "フルフレーム" }, "FFCF": { name: "フルフレーム(タイトル枠なし)" }};

    function initialize() {
        setupEventListeners();
        populateSelects();
        setupColorFilterButtons();
        restoreAuthorNames();
        updatePreview();
        resetImage();
        scalePreview();
        handleBatchSectionCollapse();
        handleUrlParameters();
    }
    
    function setupEventListeners() {
        ['change', 'input'].forEach(event => {[cardColorSelect, cardTypeSelect, backgroundSelect, cardNameInput, effectInput, flavorInput, flavorSpeakerInput].forEach(el => el.addEventListener(event, updatePreview, { passive: true }));});
        imageUpload.addEventListener('change', handleImageUpload);
        resetImageBtn.addEventListener('click', resetImage);
        overlayImageUpload.addEventListener('change', handleOverlayImageUpload);
        resetOverlayImageBtn.addEventListener('click', resetOverlayImage);
        resetImagePositionBtn.addEventListener('click', () => cardImage.src && setupImageForDrag());
        resetOverlayPositionBtn.addEventListener('click', () => overlayImage.src && setupOverlayImageForDrag());
        editModeRadios.forEach(radio => radio.addEventListener('change', (e) => { activeManipulationTarget = e.target.value; }));
        previewArea.addEventListener('mousedown', startDrag);
        previewArea.addEventListener('touchstart', startDrag, { passive: false });
        previewArea.addEventListener('wheel', handleZoom, { passive: false });
        downloadBtn.addEventListener('click', () => downloadCard(false));
        downloadTemplateBtn.addEventListener('click', () => downloadCard(true));
        sparkleCheckbox.addEventListener('change', updateSparkleEffect);
        openDbModalBtn.addEventListener('click', openDatabaseModal);
        modalCloseBtn.addEventListener('click', () => dbModalOverlay.classList.remove('is-visible'));
        dbModalOverlay.addEventListener('click', (e) => { if (e.target === dbModalOverlay) dbModalOverlay.classList.remove('is-visible'); });
        dbUpdateBtn.addEventListener('click', () => handleDatabaseSave(true));
        dbCreateBtn.addEventListener('click', () => handleDatabaseSave(false));
        registrantInput.addEventListener('input', () => localStorage.setItem('cardGeneratorRegistrant', registrantInput.value));
        artistInput.addEventListener('input', () => localStorage.setItem('cardGeneratorArtist', artistInput.value));
        tabDatabase.addEventListener('change', () => { if (tabDatabase.checked) { clearEditingState(); fetchAllCards(); } });
        dbColorFilterContainer.addEventListener('click', handleColorFilterClick);
        dbSearchInput.addEventListener('input', applyDbFiltersAndSort);
        dbSortSelect.addEventListener('change', applyDbFiltersAndSort);
        cardListContainer.addEventListener('click', handleCardListClick);
        openTeikeiModalBtn.addEventListener('click', openTeikeiModal);
        teikeiModalCloseBtn.addEventListener('click', () => teikeiModalOverlay.classList.remove('is-visible'));
        teikeiModalOverlay.addEventListener('click', (e) => { if (e.target === teikeiModalOverlay) teikeiModalOverlay.classList.remove('is-visible'); });
        teikeiListContainer.addEventListener('click', handleTeikeiListClick);
        window.addEventListener('resize', scalePreview);
        window.addEventListener('resize', handleBatchSectionCollapse);
    }
    
    function populateSelects() {
        Object.entries(cardColorData).forEach(([id, details]) => cardColorSelect.add(new Option(`${details.name}：${details.description}`, id)));
        Object.entries(cardTypes).forEach(([key, details]) => cardTypeSelect.add(new Option(details.name, key)));
        cardColorSelect.value = "青";
    }

    function restoreAuthorNames() {
        registrantInput.value = localStorage.getItem('cardGeneratorRegistrant') || '';
        artistInput.value = localStorage.getItem('cardGeneratorArtist') || '';
    }
    
    // --- データベース機能 ---
    async function handleDatabaseSave(isUpdate) {
        const button = isUpdate ? dbUpdateBtn : dbCreateBtn;
        const originalButtonText = button.textContent;
        button.disabled = true;
        button.textContent = '処理を開始...';
        try {
            let imageUrl = originalImageUrlForEdit || 'DEFAULT';
            if (!cardImage.src || cardImage.src.includes('now_painting')) {
                imageUrl = 'DEFAULT';
            } else if (isNewImageSelected) {
                button.textContent = '画像アップロード中...';
                const artworkBlob = await generateArtworkBlob((cardTypeSelect.value || '').toUpperCase());
                const now = new Date();
                const uploadFileName = `${now.getFullYear().toString().slice(-2)}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                imageUrl = await uploadToImgBB(artworkBlob, uploadFileName);
            }
            const cardData = {
                name: cardNameInput.value, color: cardColorSelect.value, type: cardTypeSelect.value,
                effect: effectInput.value, flavor: flavorInput.value, speaker: flavorSpeakerInput.value,
                imageUrl: imageUrl, registrant: registrantInput.value, artist: artistInput.value,
                source: document.getElementById('source-input').value,
                notes: document.getElementById('notes-input').value,
                action: isUpdate ? 'update' : 'create'
            };
            if (isUpdate && currentEditingCardId) cardData.ID = currentEditingCardId;
            button.textContent = 'DBに登録中...';
            await saveCardToDatabase(cardData);
            const message = isUpdate ? `カード「${cardData.name || '(無題)'}」の更新リクエストを送信しました。` : `カード「${cardData.name || '(無題)'}」の新規登録リクエストを送信しました。`;
            showCustomAlert(message + '\n\n（数秒後にデータベースタブで確認できます）');
            dbModalOverlay.classList.remove('is-visible');
            clearEditingState();
            if (tabDatabase.checked) setTimeout(fetchAllCards, 2000);
        } catch (err) {
            console.error('登録処理中にエラーが発生しました:', err);
            showCustomAlert('処理に失敗しました。コンソールログを確認してください。');
        } finally {
            button.disabled = false;
            button.textContent = originalButtonText;
        }
    }

    function saveCardToDatabase(cardData) {
        return new Promise(async (resolve, reject) => {
            if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.includes('xxxxxxxxxx')) return reject(new Error('GASのURLが設定されていません。'));
            try {
                await fetch(GAS_WEB_APP_URL, {
                    method: 'POST', mode: 'no-cors', cache: 'no-cache',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(cardData),
                });
                resolve({ status: 'success' });
            } catch (error) {
                console.error('データベースへのリクエスト送信中にエラー:', error);
                reject(error);
            }
        });
    }

    async function deleteCard(cardId) {
        try {
            const cardName = allCardsData.find(card => card['ID'] === cardId)?.['カード名'] || 'このカード';
            const confirmed = await showCustomConfirm(`【確認】\nカード名: ${cardName} (ID: ${cardId})\n\n本当にこのカードを削除（アーカイブ）しますか？`);
            if (confirmed) {
                await saveCardToDatabase({ action: 'delete', ID: cardId });
                showCustomAlert(`ID: ${cardId} の削除リクエストを送信しました。\n2秒後にリストを更新します。`);
                setTimeout(fetchAllCards, 2000);
            }
        } catch (error) {
            console.error('削除リクエストの送信に失敗しました:', error);
            showCustomAlert('カードの削除に失敗しました。');
        }
    }

    // --- データベース表示・フィルタリング ---
    function setupColorFilterButtons() {
        const allButton = document.createElement('button');
        allButton.type = 'button';
        allButton.className = 'color-filter-btn active';
        allButton.dataset.color = 'all';
        allButton.textContent = '全て';
        allButton.style.borderColor = '#c8a464';
        dbColorFilterContainer.appendChild(allButton);

        Object.entries(cardColorData).forEach(([id, details]) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'color-filter-btn';
            btn.dataset.color = id;
            btn.textContent = details.name;
            btn.style.borderColor = details.color.startsWith('linear') ? '#c8a464' : details.color;
            dbColorFilterContainer.appendChild(btn);
        });
    }

    function handleColorFilterClick(e) {
        if (e.target.classList.contains('color-filter-btn')) {
            dbColorFilterContainer.querySelector('.active')?.classList.remove('active');
            e.target.classList.add('active');
            selectedColorFilter = e.target.dataset.color;
            applyDbFiltersAndSort();
        }
    }
    
    function handleCardListClick(e) {
        const editButton = e.target.closest('.edit-btn');
        if (editButton) {
            e.preventDefault();
            const cardId = editButton.dataset.id;
            if (cardId) { document.getElementById('tab-generator').checked = true; loadCardForEditing(cardId); }
        }
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            e.preventDefault();
            const cardId = deleteButton.dataset.id;
            const cardName = deleteButton.dataset.name || 'このカード';
            showCustomConfirm(`【確認】\nカード名: ${cardName} (ID: ${cardId})\n\n本当にこのカードを削除（アーカイブ）しますか？`).then(confirmed => {
                if (confirmed) {
                    deleteCard(cardId);
                }
            });
        }
    }

    async function fetchAllCards() {
        cardListContainer.innerHTML = '<p>データベースを読み込んでいます...</p>';
        const SPREADSHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQXTIYBURfIYxyLgGle8sAnRMfpM9fitcL6zkchi2gblxxD65-DxOWVMm830Ogl-HQjZgQtWLaRMfwo/pub?gid=1713292859&single=true&output=csv';
        try {
            const response = await fetch(SPREADSHEET_CSV_URL, { cache: 'no-cache' });
            if (!response.ok) throw new Error(`データベースの読み込みに失敗しました: HTTP ${response.status}`);
            const csvText = await response.text();
            allCardsData = parseDatabaseCsv(csvText);
            applyDbFiltersAndSort();
        } catch (error) {
            console.error('データ取得エラー:', error);
            cardListContainer.innerHTML = `<p class="error">データの読み込みに失敗しました。<br>${error.message}</p>`;
        }
    }

    function applyDbFiltersAndSort() {
        if (!allCardsData) return;
        let filteredCards = (selectedColorFilter === 'all') ? [...allCardsData] : allCardsData.filter(card => card['色'] === selectedColorFilter);
        const searchTerm = dbSearchInput.value.toLowerCase();
        if (searchTerm) {
            filteredCards = filteredCards.filter(card => {
                return ((card['カード名'] || '').toLowerCase().includes(searchTerm) ||
                        (card['登録者'] || '').toLowerCase().includes(searchTerm) ||
                        (card['絵師'] || '').toLowerCase().includes(searchTerm));
            });
        }
        const sortValue = dbSortSelect.value;
        filteredCards.sort((a, b) => {
            switch (sortValue) {
                case 'id-desc': return Number(b['ID']) - Number(a['ID']);
                case 'id-asc': return Number(a['ID']) - Number(b['ID']);
                case 'name-asc': return (a['カード名'] || '').localeCompare(b['カード名'] || '');
                case 'name-desc': return (b['カード名'] || '').localeCompare(a['カード名'] || '');
                case 'registrant-asc': return (a['登録者'] || '').localeCompare(b['登録者'] || '');
                case 'artist-asc': return (a['絵師'] || '').localeCompare(b['絵師'] || '');
                default: return 0;
            }
        });
        renderCardList(filteredCards);
    }

    function renderCardList(cards) {
        cardListContainer.innerHTML = '';
        if (cards.length === 0) {
            cardListContainer.innerHTML = '<p>該当するカードはありません。</p>';
            return;
        }
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'db-card';
            const colorDetails = cardColorData[card['色']] || {};
            if (colorDetails.color && colorDetails.color.startsWith('linear-gradient')) cardElement.style.background = colorDetails.color;
            else if (colorDetails.color) cardElement.style.backgroundColor = colorDetails.color;
            let textColor = colorDetails.textColor || '#FFFFFF';
            let imageUrl = card['画像URL'];
            if (imageUrl === 'DEFAULT' || !imageUrl) imageUrl = 'Card_asset/now_painting.png';
            else if (imageUrl.includes('drive.google.com/file/d/') || imageUrl.includes('docs.google.com/file/d/')) {
                const match = imageUrl.match(/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
                if (match && match[1]) imageUrl = `https://corsproxy.io/?${encodeURIComponent(`https://drive.google.com/uc?export=view&id=${match[1]}`)}`;
            }
            cardElement.innerHTML = `
                <div class="db-card-image"><img src="${imageUrl}" alt="${card['カード名']}" loading="lazy" crossorigin="anonymous" onerror="this.onerror=null;this.src='Card_asset/image_load_error.png';"></div>
                <div class="db-card-info">
                    <h3 class="db-card-name" style="color: ${textColor};">${card['カード名']}</h3>
                    <p class="db-card-meta" style="color: ${textColor};">PL: ${card['登録者'] || 'N/A'}</p>
                    <p class="db-card-meta" style="color: ${textColor};">絵師: ${card['絵師'] || 'N/A'}</p>
                    <p class="db-card-id" style="color: ${textColor}; opacity: 0.8;">ID: ${card['ID']}</p>
                </div>
                <div class="db-card-actions">
                    <button class="secondary-button edit-btn" data-id="${card['ID']}">編集</button>
                    <button class="secondary-button delete-btn" data-id="${card['ID']}" data-name="${card['カード名'] || ''}">削除</button>
                </div>`;
            cardListContainer.appendChild(cardElement);
        });
    }

    // --- 定型文機能 ---
    async function openTeikeiModal() {
        if (teikeiCategories.length === 0) await fetchTeikeiSentences();
        renderTeikeiModal();
        teikeiModalOverlay.classList.add('is-visible');
    }

    function handleTeikeiListClick(e) {
        const targetButton = e.target.closest('.teikei-btn, .teikei-option-btn');
        if (targetButton) {
            insertTeikeiText(targetButton.dataset.text);
            teikeiModalOverlay.classList.remove('is-visible');
        }
    }
    
    function insertTeikeiText(text) {
        const textarea = document.getElementById('effect-input');
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        const originalText = textarea.value;
        
        // 新しいテキストを挿入
        let newText = originalText.substring(0, startPos) + text + originalText.substring(endPos);
        
        let newCursorPos;
        const ellipsisPlaceholderRegex = /【…】/; // 【…】専用の正規表現
        const otherPlaceholderRegex = /【[^】]+?】/; // 【…】以外のプレースホルダー（非貪欲）

        let matchEllipsis = newText.match(ellipsisPlaceholderRegex);
        
        if (matchEllipsis) {
            // 【…】が見つかった場合、それを削除し、その位置にカーソルを移動
            const placeholderStart = newText.indexOf(matchEllipsis[0]);
            newText = newText.replace(ellipsisPlaceholderRegex, ''); // 【…】を削除
            newCursorPos = placeholderStart; // 削除した位置にカーソルを移動
        } else {
            // 【…】が見つからなかった場合、他のプレースホルダーを探す
            const matchOther = newText.match(otherPlaceholderRegex);
            if (matchOther) {
                // 他のプレースホルダーが見つかった場合、その「【」の次にカーソルを移動
                newCursorPos = newText.indexOf(matchOther[0]) + 1;
            } else {
                // プレースホルダーが全くない場合、挿入したテキストの末尾にカーソルを移動
                newCursorPos = startPos + text.length;
            }
        }

        textarea.value = newText; // 最終的なテキストをtextareaに設定
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        updatePreview();
    }

    async function fetchTeikeiSentences() {
        try {
            const response = await fetch('teikei.txt');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            
            teikeiCategories = [];
            const commonOptions = {};
            let currentCategory = { name: 'その他', items: [] };

            const lines = text.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed === '' || trimmed.startsWith('=')) continue;
                
                if (trimmed.startsWith('OPTIONS:')) {
                    const content = trimmed.substring(8);
                    const firstColonIndex = content.indexOf(':');
                    if (firstColonIndex !== -1) {
                        const key = content.substring(0, firstColonIndex).trim();
                        const value = content.substring(firstColonIndex + 1).trim();
                        commonOptions[key] = value.split(',').map(opt => opt.trim());
                    }
                } else if (trimmed.startsWith('---')) {
                    if (currentCategory.items.length > 0) teikeiCategories.push(currentCategory);
                    currentCategory = { name: trimmed.replace(/^-+|-+$/g, '').trim(), items: [] };
                } else if (!trimmed.startsWith('#')) {
                    const parts = trimmed.split(' || ');
                    const text = parts[0].trim();
                    let options = [];
                    if (parts.length > 1) {
                        const optionSources = parts[1].split(',').map(s => s.trim());
                        optionSources.forEach(source => {
                            if (commonOptions[source]) {
                                options.push(...commonOptions[source]);
                            } else {
                                options.push(source);
                            }
                        });
                    }
                    currentCategory.items.push({ text, options });
                }
            }
            if (currentCategory.items.length > 0) teikeiCategories.push(currentCategory);
            const otherCategoryIndex = teikeiCategories.findIndex(cat => cat.name === 'その他');
            if (otherCategoryIndex !== -1 && teikeiCategories.length > 1 && otherCategoryIndex !== teikeiCategories.length - 1) {
                const otherCategory = teikeiCategories.splice(otherCategoryIndex, 1)[0];
                teikeiCategories.push(otherCategory);
            }
        } catch (error) {
            console.error('定型文ファイルの処理中にエラー:', error);
            showCustomAlert('定型文ファイルの読み込みまたはパースに失敗しました。');
            teikeiCategories = [];
        }
    }

    function renderTeikeiModal() {
        teikeiListContainer.innerHTML = '';
        if (teikeiCategories.length === 0) {
            teikeiListContainer.innerHTML = '<p style="color: #bdc3c7; text-align: center;">定型文が読み込めませんでした。</p>';
            return;
        }

        const isMobile = window.innerWidth <= 768;
        teikeiListContainer.innerHTML = '';
        
        const renderItem = (item) => {
            const itemContainer = document.createElement('div');
            itemContainer.className = 'teikei-item-container';

            const textButton = document.createElement('button');
            textButton.className = 'teikei-btn';
            textButton.dataset.text = item.text;
            textButton.textContent = item.text;
            itemContainer.appendChild(textButton);

            if (item.options && item.options.length > 0) {
                const optionsDiv = document.createElement('div');
                optionsDiv.className = 'teikei-options';
                
                item.options.forEach(option => {
                    const optionButton = document.createElement('button');
                    optionButton.className = 'teikei-option-btn';
                    
                    let replacedText = item.text;
                    const isNumericOption = !isNaN(parseFloat(option)) && isFinite(option);
                    const placeholders = item.text.match(/【[^】]+】/g) || [];
                    let targetPlaceholder = null;

                    if (isNumericOption) {
                        // 数値オプションの場合: 【N】を最優先で探す
                        if (placeholders.includes('【N】')) {
                            targetPlaceholder = '【N】';
                        } else {
                            // なければ【…】以外の最初のプレースホルダーを探す
                            targetPlaceholder = placeholders.find(p => p !== '【…】');
                            if (!targetPlaceholder) { // 【…】しかない場合
                                targetPlaceholder = placeholders.find(p => p === '【…】');
                            }
                        }
                    } else {
                        // 非数値オプションの場合: 【N】と【…】以外のプレースホルダーを探す
                        targetPlaceholder = placeholders.find(p => p !== '【N】' && p !== '【…】');
                        if (!targetPlaceholder) {
                            // なければ【…】を探す
                            targetPlaceholder = placeholders.find(p => p === '【…】');
                        }
                        if (!targetPlaceholder) { // 【N】しかない場合
                            targetPlaceholder = placeholders.find(p => p === '【N】');
                        }
                    }

                    // どの条件にも当てはまらず、プレースホルダーが1つだけならそれを対象にする
                    if (!targetPlaceholder && placeholders.length === 1) {
                        targetPlaceholder = placeholders[0];
                    }

                    // 置換を実行
                    if (targetPlaceholder) {
                        replacedText = item.text.replace(targetPlaceholder, option);
                    }
                    
                    optionButton.dataset.text = replacedText;
                    optionButton.textContent = option;
                    optionsDiv.appendChild(optionButton);
                });
                itemContainer.appendChild(optionsDiv);
            }
            return itemContainer;
        };
        
        if (isMobile) {
            teikeiCategories.forEach(category => {
                if (category.items.length === 0) return;
                const details = document.createElement('details');
                details.className = 'teikei-accordion-item';
                details.open = ['期間', '対象', 'その他'].includes(category.name);
                const summary = document.createElement('summary');
                summary.className = 'teikei-accordion-summary';
                summary.innerHTML = `<h3>${category.name}</h3>`;
                details.appendChild(summary);
                const contentDiv = document.createElement('div');
                contentDiv.className = 'teikei-accordion-content';
                category.items.forEach(item => contentDiv.appendChild(renderItem(item)));
                details.appendChild(contentDiv);
                teikeiListContainer.appendChild(details);
            });
        } else {
            const tabNav = document.createElement('div');
            tabNav.className = 'teikei-tab-nav';
            teikeiListContainer.appendChild(tabNav);

            const tabContentWrapper = document.createElement('div');
            tabContentWrapper.className = 'teikei-tab-content-wrapper';
            teikeiListContainer.appendChild(tabContentWrapper);

            teikeiCategories.forEach((category, index) => {
                if (category.items.length === 0) return;
                const tabId = `teikei-tab-${index}`;
                const tabButton = document.createElement('button');
                tabButton.className = 'teikei-tab-button';
                tabButton.textContent = category.name;
                tabButton.dataset.tab = tabId;
                tabNav.appendChild(tabButton);

                const tabContent = document.createElement('div');
                tabContent.className = 'teikei-tab-content';
                tabContent.id = tabId;
                
                category.items.forEach(item => tabContent.appendChild(renderItem(item)));
                tabContentWrapper.appendChild(tabContent);

                if (index === 0) {
                    tabButton.classList.add('active');
                    tabContent.classList.add('active');
                }
            });

            tabNav.addEventListener('click', (e) => {
                if (e.target.classList.contains('teikei-tab-button')) {
                    tabNav.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
                    tabContentWrapper.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
                    e.target.classList.add('active');
                    document.getElementById(e.target.dataset.tab).classList.add('active');
                }
            });
        }
    }
    
    // --- その他のヘルパー関数 ---
    function restoreAuthorNames() {
        const savedRegistrant = localStorage.getItem('cardGeneratorRegistrant');
        registrantInput.value = savedRegistrant || '';
        const savedArtist = localStorage.getItem('cardGeneratorArtist');
        artistInput.value = savedArtist || '';
    }
    
    function openDatabaseModal() {
        if (currentEditingCardId) {
            dbUpdateBtn.style.display = 'block';
            dbCreateBtn.style.display = 'block';
            dbUpdateBtn.textContent = 'この内容で更新する';
            dbCreateBtn.textContent = 'この内容で複製して新規登録';
        } else {
            dbUpdateBtn.style.display = 'none';
            dbCreateBtn.style.display = 'block';
            dbCreateBtn.textContent = 'この内容で新規登録する';
        }
        dbModalOverlay.classList.add('is-visible');
    }

    function updateSparkleEffect() {
        sparkleOverlayImage.style.display = sparkleCheckbox.checked ? 'block' : 'none';
        highResCheckbox.disabled = sparkleCheckbox.checked;
        highResCheckbox.parentElement.style.opacity = sparkleCheckbox.checked ? '0.5' : '1';
        if (sparkleCheckbox.checked) highResCheckbox.checked = false;
    }

    // カスタムアラートモーダル表示
    function showCustomAlert(message) {
        const alertModal = document.createElement('div');
        alertModal.className = 'custom-modal-overlay';
        alertModal.innerHTML = `
            <div class="custom-modal-content">
                <p>${message.replace(/\n/g, '<br>')}</p>
                <button id="custom-alert-ok-btn" class="primary-button">OK</button>
            </div>
        `;
        document.body.appendChild(alertModal);
        document.getElementById('custom-alert-ok-btn').addEventListener('click', () => {
            document.body.removeChild(alertModal);
        });
        alertModal.addEventListener('click', (e) => {
            if (e.target === alertModal) {
                document.body.removeChild(alertModal);
            }
        });
    }

    // カスタム確認モーダル表示
    function showCustomConfirm(message) {
        return new Promise(resolve => {
            const confirmModal = document.createElement('div');
            confirmModal.className = 'custom-modal-overlay';
            confirmModal.innerHTML = `
                <div class="custom-modal-content">
                    <p>${message.replace(/\n/g, '<br>')}</p>
                    <div class="custom-modal-actions">
                        <button id="custom-confirm-ok-btn" class="primary-button">はい</button>
                        <button id="custom-confirm-cancel-btn" class="secondary-button">いいえ</button>
                    </div>
                </div>
            `;
            document.body.appendChild(confirmModal);

            document.getElementById('custom-confirm-ok-btn').addEventListener('click', () => {
                document.body.removeChild(confirmModal);
                resolve(true);
            });
            document.getElementById('custom-confirm-cancel-btn').addEventListener('click', () => {
                document.body.removeChild(confirmModal);
                resolve(false);
            });
            confirmModal.addEventListener('click', (e) => {
                if (e.target === confirmModal) {
                    document.body.removeChild(confirmModal);
                    resolve(false);
                }
            });
        });
    }

    function handleBatchSectionCollapse() { if (!batchDetails) return; const isDesktop = window.innerWidth >= 1361; if (isDesktop) { batchDetails.open = true; } else { batchDetails.open = false; } }
    function parseDatabaseCsv(csvText) { const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n'); if (lines.length < 1) return []; const headers = lines[0].split(',').map(h => h.trim()); const data = []; for (let i = 1; i < lines.length; i++) { if (!lines[i]) continue; const values = []; let inQuotes = false; let currentField = ''; for (const char of lines[i]) { if (char === '"') { inQuotes = !inQuotes; } else if (char === ',' && !inQuotes) { values.push(currentField.trim()); currentField = ''; } else { currentField += char; } } values.push(currentField.trim()); const entry = {}; headers.forEach((header, index) => { entry[header] = values[index] || ''; }); data.push(entry); } return data.reverse(); }
    function handleUrlParameters() { const urlParams = new URLSearchParams(window.location.search); const cardId = urlParams.get('id'); if (cardId) { loadCardForEditing(cardId); } }
    async function loadCardForEditing(cardId) { document.getElementById('tab-generator').checked = true; const SPREADSHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQXTIYBURfIYxyLgGle8sAnRMfpM9fitcL6zkchi2gblxxD65-DxOWVMm830Ogl-HQjZgQtWLaRMfwo/pub?gid=1713292859&single=true&output=csv'; try { const response = await fetch(SPREADSHEET_CSV_URL, { cache: 'no-cache' }); if (!response.ok) throw new Error(`データベースの読み込みに失敗しました: HTTP ${response.status}`); const csvText = await response.text(); const cards = parseDatabaseCsv(csvText); const cardToEdit = cards.find(card => card['ID'] === cardId); if (!cardToEdit) throw new Error(`指定されたIDのカードが見つかりません: ${cardId}`); currentEditingCardId = cardId; isNewImageSelected = false; originalImageUrlForEdit = cardToEdit['画像URL'] || null; cardNameInput.value = cardToEdit['カード名'] || ''; cardColorSelect.value = cardToEdit['色'] || '青'; cardTypeSelect.value = cardToEdit['タイプ'] || ''; effectInput.value = cardToEdit['効果説明'] || ''; flavorInput.value = cardToEdit['フレーバー'] || ''; flavorSpeakerInput.value = cardToEdit['フレーバー名'] || ''; document.getElementById('registrant-input').value = cardToEdit['登録者'] || ''; document.getElementById('artist-input').value = cardToEdit['絵師'] || ''; document.getElementById('source-input').value = cardToEdit['元ネタ'] || ''; document.getElementById('notes-input').value = cardToEdit['備考'] || ''; let imageUrl = cardToEdit['画像URL']; if (imageUrl === 'DEFAULT') { imageUrl = 'Card_asset/now_painting.png'; } else if (imageUrl && (imageUrl.includes('drive.google.com/file/d/') || imageUrl.includes('docs.google.com/file/d/'))) { const match = imageUrl.match(/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/); if (match && match[1]) { const fileId = match[1]; const originalUrl = `https://drive.google.com/uc?export=view&id=${fileId}`; imageUrl = `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`; } } if (imageUrl) { cardImage.crossOrigin = "Anonymous"; cardImage.src = imageUrl; imageFileName.textContent = '読み込み中...'; cardImage.onload = () => { imageFileName.textContent = cardToEdit['カード名'] || '画像'; setupImageForDrag(); updatePreview(); }; cardImage.onerror = () => { cardImage.src = 'Card_asset/image_load_error.png'; imageFileName.textContent = '画像読込エラー'; setupImageForDrag(); updatePreview(); }; } else { resetImage(); } updatePreview(); } catch (error) { console.error('編集用カードの読み込みエラー:', error); showCustomAlert(`カード情報の読み込みに失敗しました。\n${error.message}`); clearEditingState(); } }
    function scalePreview() { if (!previewWrapper || !previewPanel) return; const baseWidth = 480; const containerWidth = previewWrapper.offsetWidth; if (containerWidth < baseWidth) { const scale = containerWidth / baseWidth; previewPanel.style.transform = `scale(${scale})`; } else { previewPanel.style.transform = 'none'; } }
    function clearEditingState() { currentEditingCardId = null; originalImageUrlForEdit = null; isNewImageSelected = false; const url = new URL(window.location); if (url.searchParams.has('id')) { url.searchParams.delete('id'); window.history.pushState({}, '', url); } }
    async function generateArtworkBlob(cardType) { console.log(`アートワーク部分の切り出しを開始します。タイプ: ${cardType || '標準'}`); const elementsToModify = [document.getElementById('card-template-image'), document.getElementById('card-name-container'), document.getElementById('text-box-container'), document.getElementById('sparkle-overlay-image')]; const originalStyles = []; try { elementsToModify.forEach(el => { if (el) { originalStyles.push({ element: el, originalDisplay: el.style.display }); el.style.display = 'none'; } }); const fullCardCanvas = await html2canvas(cardContainer, { backgroundColor: null, useCORS: true }); const isFullFrame = cardType === 'FF' || cardType === 'FFCF'; if (isFullFrame) { console.log('フルフレームのため、480x720の画像を生成します。'); return await new Promise(resolve => fullCardCanvas.toBlob(resolve, 'image/png')); } else { console.log('標準/CFタイプのため、480x480に画像をクロップします。'); const croppedCanvas = document.createElement('canvas'); croppedCanvas.width = 480; croppedCanvas.height = 480; const ctx = croppedCanvas.getContext('2d'); ctx.drawImage(fullCardCanvas, 0, 0, 480, 480, 0, 0, 480, 480); return await new Promise(resolve => croppedCanvas.toBlob(resolve, 'image/png')); } } finally { originalStyles.forEach(item => { item.element.style.display = item.originalDisplay; }); console.log('アートワークの切り出しが完了し、表示を元に戻しました。'); } }
    async function uploadToImgBB(imageBlob, fileName) { if (!IMGBB_API_KEY || IMGBB_API_KEY.includes('ここに')) { throw new Error('ImgBBのAPIキーが設定されていません。card_generator.jsを修正してください。'); } const formData = new FormData(); formData.append('image', imageBlob); if (fileName) { formData.append('name', fileName); } console.log(`ImgBBへのアップロードを開始します... ファイル名: ${fileName || '(指定なし)'}`); const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData, }); if (!response.ok) { let errorDetails = 'サーバーから詳細なエラーメッセージが返されませんでした。'; try { const errorData = await response.json(); errorDetails = errorData.error?.message || JSON.stringify(errorData); } catch (e) { errorDetails = await response.text(); } console.error('ImgBB API Error:', errorDetails); throw new Error(`ImgBBへのアップロードに失敗しました (HTTP ${response.status}): ${errorDetails}`); } const result = await response.json(); if (!result.success) { console.error('ImgBB APIがエラーを報告しました:', result.error.message); throw new Error(`ImgBB APIがエラーを報告しました: ${result.error.message}`); } console.log('ImgBBへのアップロードが成功しました。URL:', result.data.url); return result.data.url; }
    
    function updatePreview() {
        const selectedColorId = cardColorSelect.value;
        const selectedType = (cardTypeSelect.value || '').toUpperCase();
        const colorDetails = cardColorData[selectedColorId];
        cardNameContent.classList.remove('title-styled');
        textBoxContainer.classList.remove('textbox-styled');
        cardNameContainer.style.backgroundImage = `url('Card_asset/タイトル.png')`;
        imageContainer.style.transition = 'none';
        const isFullFrame = selectedType === 'FF' || selectedType === 'FFCF';
        imageContainer.style.height = isFullFrame ? '720px' : '480px';
        void imageContainer.offsetHeight;
        imageContainer.style.transition = '';
        let templateName = `${selectedColorId}カード`;
        if (isFullFrame) {
            templateName += 'FF';
        }
        if (selectedType === 'CF') {
            cardNameContent.classList.add('title-styled');
            cardNameContainer.style.backgroundImage = 'none';
        } else if (selectedType === 'FF') {
            textBoxContainer.classList.add('textbox-styled');
        } else if (selectedType === 'FFCF') {
            cardNameContent.classList.add('title-styled');
            textBoxContainer.classList.add('textbox-styled');
            cardNameContainer.style.backgroundImage = 'none';
        }
        const isDefaultImage = cardImage.src.includes('now_painting');
        if (isDefaultImage) {
            const newSrc = isFullFrame ? 'Card_asset/now_painting_FF.png' : 'Card_asset/now_painting.png';
            if (!cardImage.src.endsWith(newSrc)) {
                cardImage.src = newSrc;
                cardImage.onload = () => {
                    setupImageForDrag();
                    checkDefaultImageTransparency(newSrc);
                };
            }
        }
        cardTemplateImage.src = `Card_asset/テンプレ/${templateName}.png`;
        const selectedBackground = backgroundSelect.value;
        backgroundImage.style.display = selectedBackground ? 'block' : 'none';
        if (selectedBackground) backgroundImage.src = `Card_asset/${selectedBackground}`;
        updateCardName(cardNameInput.value);
        const replacePunctuation = (text) => text.replace(/、/g, '､').replace(/。/g, '｡');
        const addSpacingToChars = (text) => {
            return text.replace(/([0-9\-])|([\(\)])/g, (match, kernChars, parenChars) => {
                if (kernChars) return `<span class="char-kern">${kernChars}</span>`;
                if (parenChars) return `<span class="paren-fix">${parenChars}</span>`;
                return match;
            });
        };
        const processedEffectText = addSpacingToChars(replacePunctuation(effectInput.value));
        effectDisplay.innerHTML = processedEffectText;

        const flavorText = replacePunctuation(flavorInput.value.trim());
        const speakerText = replacePunctuation(flavorSpeakerInput.value.trim());

        // --- START: FINAL DYNAMIC LAYOUT LOGIC WITH LINE-SNAPPING ---
    
        // First, update the content and visibility of the flavor text and speaker elements.
        if (!flavorText && !speakerText) {
            flavorGroup.style.display = 'none';
        } else {
            flavorGroup.style.display = 'block';
            if (flavorText) {
                const flavorHtml = flavorText.replace(/\n/g, '<br>');
                let flavorInnerText = flavorDisplay.querySelector('.inner-text');
                if (!flavorInnerText) {
                    flavorDisplay.innerHTML = '<div class="inner-text"></div>';
                    flavorInnerText = flavorDisplay.querySelector('.inner-text');
                }
                flavorInnerText.innerHTML = flavorHtml;
                flavorDisplay.style.display = 'block';
            } else {
                flavorDisplay.style.display = 'none';
            }
    
            if (speakerText) {
                flavorSpeakerDisplay.innerText = `─── ${speakerText}`;
                flavorSpeakerDisplay.style.display = 'block';
            } else {
                flavorSpeakerDisplay.style.display = 'none';
            }
        }
    
        // Force the browser to reflow the layout to get the correct height of the flavor group.
        textBoxContainer.offsetHeight;
    
        const totalHeight = 177.5; // Total height from CSS.
        const flavorGroupHeight = flavorGroup.offsetHeight; // Get the actual rendered height.
        const effectMarginBottom = 1; // From CSS.
        const availablePixelHeight = totalHeight - flavorGroupHeight - effectMarginBottom;
    
        // Get the computed line-height for the effect text, which is crucial for line-snapping.
        const effectStyle = window.getComputedStyle(effectDisplay);
        const effectLineHeight = parseFloat(effectStyle.lineHeight);
    
        if (effectLineHeight > 0) {
            // Calculate how many full lines can fit in the available space.
            const numberOfLines = Math.floor(availablePixelHeight / effectLineHeight);
            
            // Calculate the new max-height that is an exact multiple of the line height.
            // This "snaps" the container to the grid of the text lines, preventing partial lines.
            const snappedMaxHeight = numberOfLines * effectLineHeight;
            
            // Apply the calculated max-height.
            effectDisplay.style.maxHeight = `${Math.max(0, snappedMaxHeight)}px`;
        } else {
            // Fallback for safety, in case line-height isn't available for some reason.
            effectDisplay.style.maxHeight = `${Math.max(0, availablePixelHeight)}px`;
        }
        
        // --- END: FINAL DYNAMIC LAYOUT LOGIC ---
    
        updateThemeColor(colorDetails);
        requestAnimationFrame(setupImageForDrag);
    }

    function updateCardName(text) { const segments = text.split('`'); const htmlParts = segments.map((segment, index) => { if (index % 2 === 1) { const rubyMatch = segment.match(/(.+?)\((.+)\)/); if (rubyMatch) { const baseText = rubyMatch[1]; const rubyText = rubyMatch[2]; return `<ruby><rb>${baseText}</rb><rt>${rubyText}</rt></ruby>`; } } const escapedSegment = segment.replace(/</g, '<').replace(/>/g, '>'); return `<span class="no-ruby">${escapedSegment}</span>`; }); const finalHtml = htmlParts.join('\u200B'); const hasRuby = finalHtml.includes('<ruby>'); if (hasRuby) { cardNameContent.classList.remove('is-plain-text-only'); } else { cardNameContent.classList.add('is-plain-text-only'); } cardNameContent.innerHTML = `<span class="scaler">${finalHtml}</span>`; requestAnimationFrame(() => { const containerEl = cardNameContainer; const contentEl = cardNameContent; const scalerEl = contentEl.querySelector('.scaler'); if (!scalerEl) return; const availableWidth = contentEl.clientWidth; const trueTextWidth = scalerEl.scrollWidth; let containerLeft = '50%', containerTransformX = '-50%', contentTextAlign = 'center', scalerTransformOrigin = 'center', rtLeft = '50%', rtTransformX = 'calc(-50% + 1px)', scalerTransform = 'none'; if (trueTextWidth > availableWidth) { const scaleX = availableWidth / trueTextWidth; scalerTransform = `scaleX(${scaleX})`; containerLeft = '44px'; containerTransformX = '0'; contentTextAlign = 'left'; scalerTransformOrigin = 'left'; rtLeft = '0'; rtTransformX = '0'; } containerEl.style.left = containerLeft; containerEl.style.transform = `translateX(${containerTransformX})`; contentEl.style.textAlign = contentTextAlign; scalerEl.style.transformOrigin = scalerTransformOrigin; scalerEl.style.transform = scalerTransform; const rtElements = contentEl.querySelectorAll('rt'); rtElements.forEach(rt => { rt.style.left = rtLeft; rt.style.transform = `translateX(${rtTransformX})`; }); }); }
    function handleImageUpload(e) { const file = e.target.files[0]; if (file) { isNewImageSelected = true; imageFileName.textContent = file.name; const reader = new FileReader(); reader.onload = (e) => { const imageUrl = e.target.result; cardImage.src = imageUrl; cardImage.onload = () => { setupImageForDrag(); checkImageTransparency(imageUrl).then(hasTransparency => { const backgroundGroup = document.getElementById('background-select-group'); if (hasTransparency) { backgroundGroup.style.display = 'block'; backgroundSelect.value = 'hologram_geometric.png'; updatePreview(); } else { backgroundGroup.style.display = 'none'; if (backgroundSelect.value) { backgroundSelect.value = ''; updatePreview(); } } }); }; }; reader.readAsDataURL(file); } }
    function handleOverlayImageUpload(e) { const file = e.target.files[0]; if (file) { overlayImageFileName.textContent = file.name; const reader = new FileReader(); reader.onload = (e) => { overlayImage.src = e.target.result; overlayImage.style.display = 'block'; overlayImage.onload = () => { setupOverlayImageForDrag(); }; }; reader.readAsDataURL(file); } }
    function resetOverlayImage() { overlayImage.src = ''; overlayImage.style.display = 'none'; overlayImageUpload.value = ''; overlayImageFileName.textContent = '選択されていません'; overlayImageState = { x: 0, y: 0, scale: 1 }; }
    function setupOverlayImageForDrag() { overlayImageState = { x: 0, y: 0, scale: 1 }; const containerWidth = overlayImageContainer.offsetWidth; const containerHeight = overlayImageContainer.offsetHeight; const imageWidth = overlayImage.naturalWidth; const imageHeight = overlayImage.naturalHeight; if (imageWidth === 0 || imageHeight === 0) return; const scaleToFitWidth = containerWidth / imageWidth; let newWidth = containerWidth; let newHeight = imageHeight * scaleToFitWidth; overlayImage.style.width = `${newWidth}px`; overlayImage.style.height = `${newHeight}px`; overlayImageState.x = 0; overlayImageState.y = (containerHeight - newHeight) / 2; updateImageTransform(); }
    function resetImage() { clearEditingState(); const isFullFrame = cardTypeSelect.value === 'FF' || cardTypeSelect.value === 'FFCF'; const src = isFullFrame ? 'Card_asset/now_painting_FF.png' : 'Card_asset/now_painting.png'; cardImage.src = src; imageUpload.value = ''; imageFileName.textContent = '仁科ぬい'; cardImage.onload = () => { setupImageForDrag(); checkDefaultImageTransparency(src); }; checkDefaultImageTransparency(src); updatePreview(); }
    function setupImageForDrag() { imageState = { x: 0, y: 0, scale: 1 }; const containerWidth = imageContainer.offsetWidth; const containerHeight = imageContainer.offsetHeight; const imageWidth = cardImage.naturalWidth; const imageHeight = cardImage.naturalHeight; if (imageWidth === 0 || imageHeight === 0) return; const containerAspect = containerWidth / containerHeight; const imageAspect = imageWidth / imageHeight; let newWidth, newHeight; if (imageAspect > containerAspect) { newHeight = containerHeight; newWidth = newHeight * imageAspect; imageFitDirection = 'landscape'; } else { newWidth = containerWidth; newHeight = newWidth / imageAspect; imageFitDirection = 'portrait'; } cardImage.style.width = `${newWidth}px`; cardImage.style.height = `${newHeight}px`; imageState.x = (containerWidth - newWidth) / 2; imageState.y = (containerHeight - newHeight) / 2; updateImageTransform(); updateDraggableCursor(); }
    function updateImageTransform() { cardImage.style.transform = `translate(${imageState.x}px, ${imageState.y}px) scale(${imageState.scale})`; overlayImage.style.transform = `translate(${overlayImageState.x}px, ${overlayImageState.y}px) scale(${overlayImageState.scale})`; }
    function updateDraggableCursor() { const state = activeManipulationTarget === 'base' ? imageState : overlayImageState; const image = activeManipulationTarget === 'base' ? cardImage : overlayImage; const container = activeManipulationTarget === 'base' ? imageContainer : overlayImageContainer; const fitDirection = activeManipulationTarget === 'base' ? imageFitDirection : overlayImageFitDirection; if (!image.src) { previewArea.style.cursor = 'default'; return; } const canDrag = (fitDirection === 'landscape' && image.offsetWidth * state.scale > container.offsetWidth + 0.1) || (fitDirection === 'portrait' && image.offsetHeight * state.scale > container.offsetHeight + 0.1) || state.scale > 1.01; previewArea.style.cursor = canDrag ? 'grab' : 'default'; }
    function startDrag(e) { if (previewArea.style.cursor === 'default') return; e.preventDefault(); isDragging = true; previewArea.style.cursor = 'grabbing'; const state = activeManipulationTarget === 'base' ? imageState : overlayImageState; const touch = e.touches ? e.touches[0] : e; startX = touch.clientX - state.x; startY = touch.clientY - state.y; document.addEventListener('mousemove', dragImage); document.addEventListener('mouseup', stopDrag); document.addEventListener('touchmove', dragImage, { passive: false }); document.addEventListener('touchend', stopDrag); }
    function dragImage(e) { if (!isDragging) return; const state = activeManipulationTarget === 'base' ? imageState : overlayImageState; const fitDirection = activeManipulationTarget === 'base' ? imageFitDirection : overlayImageFitDirection; const touch = e.touches ? e.touches[0] : e; if (fitDirection === 'landscape' || state.scale > 1) state.x = touch.clientX - startX; if (fitDirection === 'portrait' || state.scale > 1) state.y = touch.clientY - startY; clampImagePosition(); updateImageTransform(); }
    function stopDrag() { isDragging = false; updateDraggableCursor(); document.removeEventListener('mousemove', dragImage); document.removeEventListener('mouseup', stopDrag); document.removeEventListener('touchmove', dragImage); document.removeEventListener('touchend', stopDrag); }
    function handleZoom(e) { e.preventDefault(); const state = activeManipulationTarget === 'base' ? imageState : overlayImageState; const container = activeManipulationTarget === 'base' ? imageContainer : overlayImageContainer; const scaleAmount = 0.1; const delta = e.deltaY > 0 ? -1 : 1; const oldScale = state.scale; state.scale = Math.max(1, Math.min(state.scale + delta * scaleAmount, 3)); const rect = container.getBoundingClientRect(); const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top; state.x = mouseX - (mouseX - state.x) * (state.scale / oldScale); state.y = mouseY - (mouseY - state.y) * (state.scale / oldScale); clampImagePosition(); updateImageTransform(); updateDraggableCursor(); }
    function clampImagePosition() { const clamp = (state, image, container) => { if (!image.src || !image.naturalWidth) return; const containerWidth = container.offsetWidth; const containerHeight = container.offsetHeight; const scaledWidth = image.offsetWidth * state.scale; const scaledHeight = image.offsetHeight * state.scale; if (scaledWidth >= containerWidth) { const min_x = containerWidth - scaledWidth; const max_x = 0; state.x = Math.max(min_x, Math.min(max_x, state.x)); } else { const min_x = 0; const max_x = containerWidth - scaledWidth; state.x = Math.max(min_x, Math.min(max_x, state.x)); } if (scaledHeight >= containerHeight) { const min_y = containerHeight - scaledHeight; const max_y = 0; state.y = Math.max(min_y, Math.min(max_y, state.y)); } else { const min_y = 0; const max_y = containerHeight - scaledHeight; state.y = Math.max(min_y, Math.min(max_y, state.y)); } }; clamp(imageState, cardImage, imageContainer); clamp(overlayImageState, overlayImage, overlayImageContainer); }
    function downloadCard(isTemplate = false) {
    if (!isTemplate && sparkleCheckbox.checked) {
        generateSparkleApng();
        return;
    }
    const button = isTemplate ? downloadTemplateBtn : downloadBtn;
    const originalButtonText = button.textContent;
    button.textContent = '生成中...';
    button.disabled = true;

    // --- START: 1px FIX ---
    const effectDisplay = document.getElementById('effect-display');
    const originalMaxHeight = effectDisplay.style.maxHeight;
    // ダウンロード時のみ高さを2px減らして見切れを防止
    const currentMaxHeight = parseFloat(originalMaxHeight);
    if (!isNaN(currentMaxHeight) && currentMaxHeight > 2) {
        effectDisplay.style.maxHeight = `${currentMaxHeight - 2}px`;
    }
    // --- END: 1px FIX ---

    document.body.classList.add('is-rendering-output');
    const originalTransform = previewPanel.style.transform;
    const originalWrapperHeight = previewWrapper.style.height;
    previewPanel.style.transform = 'none';
    previewWrapper.style.height = 'auto';

    document.fonts.ready.then(() => {
        setTimeout(() => {
            html2canvas(cardContainer, {
                backgroundColor: null,
                useCORS: true,
                scale: highResCheckbox.checked ? 2 : 1
            }).then(canvas => {
                const link = document.createElement('a');
                const fileName = isTemplate ?
                    `${cardColorSelect.value}_${cardTypeSelect.value || 'Standard'}_template.png` :
                    `${cardNameInput.value.replace(/[()`]/g, '') || 'custom_card'}.png`;
                link.download = fileName;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }).catch(err => {
                console.error('画像生成に失敗しました。', err);
                showCustomAlert('エラーが発生しました。');
            }).finally(() => {
                document.body.classList.remove('is-rendering-output');
                button.textContent = originalButtonText;
                button.disabled = false;
                previewPanel.style.transform = originalTransform;
                previewWrapper.style.height = originalWrapperHeight;
                
                // --- START: RESTORE ORIGINAL HEIGHT ---
                // プレビュー表示のため、高さを元に戻す
                effectDisplay.style.maxHeight = originalMaxHeight;
                // --- END: RESTORE ORIGINAL HEIGHT ---
            });
        }, 100);
    });
}
    async function createSparkleApngBlob() { const baseImageElements = [backgroundImage, cardTemplateImage, imageContainer, overlayImageContainer]; const textElements = [cardNameContainer, textBoxContainer]; textElements.forEach(el => el.style.opacity = 0); sparkleOverlayImage.style.display = 'none'; await new Promise(r => setTimeout(r, 100)); const baseCanvas = await html2canvas(cardContainer, { backgroundColor: null, useCORS: true, scale: 1 }); textElements.forEach(el => el.style.opacity = 1); baseImageElements.forEach(el => el.style.opacity = 0); await new Promise(r => setTimeout(r, 100)); const textCanvas = await html2canvas(cardContainer, { backgroundColor: null, useCORS: true, scale: 1 }); const sparkleBuffer = await new Promise((resolve, reject) => { const xhr = new XMLHttpRequest(); xhr.open('GET', 'Card_asset/加算してキラキラ.png', true); xhr.responseType = 'arraybuffer'; xhr.onload = function() { if (this.status === 200 || this.status === 0) resolve(this.response); else reject(new Error(`キラキラ素材の読み込みに失敗しました (HTTP Status: ${this.status})`)); }; xhr.onerror = () => reject(new Error('キラキラ素材の読み込みでネットワークエラーが発生しました。')); xhr.send(); }); let sparkleApng = UPNG.decode(sparkleBuffer); const sparkleFrames = UPNG.toRGBA8(sparkleApng); const newFrames = []; const { width, height } = baseCanvas; for (let i = 0; i < sparkleFrames.length; i++) { const frameData = sparkleFrames[i]; const frameCanvas = document.createElement('canvas'); frameCanvas.width = width; frameCanvas.height = height; const frameCtx = frameCanvas.getContext('2d'); frameCtx.drawImage(baseCanvas, 0, 0); const tempSparkleCanvas = document.createElement('canvas'); tempSparkleCanvas.width = sparkleApng.width; tempSparkleCanvas.height = sparkleApng.height; tempSparkleCanvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(frameData), sparkleApng.width, sparkleApng.height), 0, 0); frameCtx.globalCompositeOperation = 'lighter'; frameCtx.drawImage(tempSparkleCanvas, 0, 0, width, height); frameCtx.globalCompositeOperation = 'source-over'; frameCtx.drawImage(textCanvas, 0, 0); newFrames.push(frameCtx.getImageData(0, 0, width, height).data.buffer); } const delays = sparkleApng.frames.map(f => f.delay); const newApngBuffer = UPNG.encode(newFrames, width, height, 0, delays); const blob = new Blob([newApngBuffer], { type: 'image/png' }); textElements.forEach(el => el.style.opacity = 1); baseImageElements.forEach(el => el.style.opacity = 1); sparkleOverlayImage.style.display = sparkleCheckbox.checked ? 'block' : 'none'; return blob; }
    async function generateSparkleApng() { const button = downloadBtn; const originalButtonText = button.textContent; button.textContent = 'キラAPNGを生成中...'; button.disabled = true; const originalTransform = previewPanel.style.transform; const originalWrapperHeight = previewWrapper.style.height; previewPanel.style.transform = 'none'; previewWrapper.style.height = 'auto'; try { const blob = await createSparkleApngBlob(); const link = document.createElement('a'); const fileName = `${(cardNameInput.value || 'custom_card').replace(/[()`]/g, '')}_kira.png`; link.download = fileName; link.href = URL.createObjectURL(blob); link.click(); URL.revokeObjectURL(link.href); } catch (err) { console.error('キラAPNGの生成に失敗しました。', err); showCustomAlert(`キラAPNGの生成中にエラーが発生しました。\n詳細: ${err.message}`); } finally { button.textContent = originalButtonText; button.disabled = false; previewPanel.style.transform = originalTransform; previewWrapper.style.height = originalWrapperHeight; } }
    function hexToRgb(hex) { const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null; }
    function rgbToHex(r, g, b) { return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
    function adjustHexColor(hex, amount) { if (!hex || !hex.startsWith('#')) return hex; let { r, g, b } = hexToRgb(hex); r = Math.max(0, Math.min(255, r + amount)); g = Math.max(0, Math.min(255, g + amount)); b = Math.max(0, Math.min(255, b + amount)); return rgbToHex(r, g, b); }
    function getLuminance(hex) { if (!hex || !hex.startsWith('#')) return 0; let { r, g, b } = hexToRgb(hex); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
    function updateThemeColor(details) { if (!details) return; const root = document.documentElement; const body = document.body; root.style.setProperty('--button-bg', details.color); root.style.setProperty('--button-hover-bg', details.hover); root.style.setProperty('--button-color', details.textColor); if (details.color.startsWith('linear-gradient')) { root.style.setProperty('--theme-bg-dark', '#0d1a50'); root.style.setProperty('--theme-bg-main', '#1a2c6d'); root.style.setProperty('--theme-border', '#2a3c7d'); body.classList.remove('light-theme-ui'); } else { root.style.setProperty('--theme-bg-dark', adjustHexColor(details.color, -30)); root.style.setProperty('--theme-bg-main', adjustHexColor(details.color, -15)); root.style.setProperty('--theme-border', adjustHexColor(details.color, 15)); if (getLuminance(details.color) > 160) { body.classList.add('light-theme-ui'); } else { body.classList.remove('light-theme-ui'); } } }
    function handleBatchFileUpload(event) { const file = event.target.files[0]; if (!file) return; batchFileName.textContent = file.name; const reader = new FileReader(); reader.onload = (e) => { try { const content = e.target.result; let rawData; if (file.name.endsWith('.json')) { rawData = JSON.parse(content); rawData.forEach(item => item.sparkle = item.sparkle === true); batchData = rawData.map(item => { let backgroundValue = item.background || ''; if (backgroundValue === '◇') backgroundValue = 'hologram_geometric.png'; else if (backgroundValue === '☆') backgroundValue = 'hologram_glitter.png'; return { ...item, background: backgroundValue }; }); } else if (file.name.endsWith('.csv')) { rawData = parseCsv(content); batchData = rawData.map(item => { const colorName = item['色'] || ''; const cardId = colorNameToIdMap[colorName] || '青'; const sparkleValue = (item['キラ'] || 'false').toLowerCase(); let backgroundValue = item['背景'] || ''; if (backgroundValue === '◇') backgroundValue = 'hologram_geometric.png'; else if (backgroundValue === '☆') backgroundValue = 'hologram_glitter.png'; return { cardName: item['カード名'] || '', effect: item['効果説明'] || '', flavor: item['フレーバー'] || '', speaker: item['フレーバー名'] || '', color: cardId, image: item['イラスト'] || '', type: item['タイプ'] || '', background: backgroundValue, sparkle: ['true', '1', 'yes', 'はい', 'on'].includes(sparkleValue) }; }); } else { throw new Error('サポートされていないファイル形式です。'); } batchDownloadBtn.disabled = false; showCustomAlert(`${batchData.length}件のカードデータを読み込みました。`); } catch (error) { console.error('ファイルの読み込みまたはパースに失敗しました:', error); showCustomAlert(`エラー: ${error.message}`); batchFileName.textContent = '選択されていません'; batchDownloadBtn.disabled = true; batchData = []; } }; reader.readAsText(file); }
    function parseCsv(csvText) { const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n'); const headers = lines[0].split(',').map(h => h.trim()); const data = []; for (let i = 1; i < lines.length; i++) { if (!lines[i]) continue; const values = lines[i].split(',').map(v => v.trim()); const entry = {}; headers.forEach((header, index) => { entry[header] = values[index].replace(/^"(.*)"$/, '$1'); }); data.push(entry); } return data; }
    function handleImageFolderUpload(event) { const files = event.target.files; if (files.length === 0) return; localImageFiles = {}; for (const file of files) { localImageFiles[file.name] = URL.createObjectURL(file); } imageFolderName.textContent = `${files.length}個の画像を選択`; showCustomAlert(`${files.length}個のローカル画像を読み込みました。`); }
    function updatePreviewFromData(data) { cardColorSelect.value = data.color || '青'; cardTypeSelect.value = data.type || ''; backgroundSelect.value = data.background || ''; cardNameInput.value = data.cardName || ''; effectInput.value = data.effect || ''; flavorInput.value = data.flavor || ''; flavorSpeakerInput.value = data.speaker || ''; const imageName = data.image ? data.image.split('/').pop() : ''; if (localImageFiles[imageName]) { cardImage.src = localImageFiles[imageName]; imageFileName.textContent = imageName; } else if (data.image) { cardImage.src = data.image; imageFileName.textContent = imageName; } else { resetImage(); } sparkleCheckbox.checked = data.sparkle === true; sparkleOverlayImage.style.display = sparkleCheckbox.checked ? 'block' : 'none'; updatePreview(); cardImage.onload = () => { updatePreview(); setupImageForDrag(); } }
    async function processBatchDownload() { if (batchData.length === 0) { showCustomAlert('データが読み込まれていません。'); return; } const zip = new JSZip(); batchDownloadBtn.disabled = true; batchProgress.style.display = 'block'; for (let i = 0; i < batchData.length; i++) { const cardData = batchData[i]; batchProgress.textContent = `処理中... (${i + 1}/${batchData.length})`; updatePreviewFromData(cardData); await new Promise(resolve => document.fonts.ready.then(() => setTimeout(resolve, 200))); try { const fileName = `${(cardData.cardName || `card_${i+1}`).replace(/[()`]/g, '')}.png`; let imageBlob; if (cardData.sparkle) { imageBlob = await createSparkleApngBlob(); } else { const scale = highResCheckbox.checked ? 2 : 1; const canvas = await html2canvas(cardContainer, { backgroundColor: null, useCORS: true, scale: scale }); imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png')); } if (imageBlob) { zip.file(fileName, imageBlob); } } catch (err) { console.error(`カード[${cardData.cardName || i+1}]の画像生成に失敗しました:`, err); zip.file(`ERROR_${cardData.cardName || i+1}.txt`, `このカードの生成に失敗しました。\nエラー: ${err.message}`); } } batchProgress.textContent = 'ZIPファイルを生成中...'; zip.generateAsync({ type: 'blob' }).then(content => { const link = document.createElement('a'); link.href = URL.createObjectURL(content); link.download = 'cards_batch.zip'; link.click(); URL.revokeObjectURL(link.href); batchProgress.textContent = '完了しました！'; setTimeout(() => { batchProgress.style.display = 'none'; batchDownloadBtn.disabled = false; }, 3000); }); }
    function checkImageTransparency(imageUrl) { return new Promise((resolve) => { const img = new Image(); img.crossOrigin = "Anonymous"; img.onload = () => { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d', { willReadFrequently: true }); canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0); try { const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data; for (let i = 3; i < imageData.length; i += 4) { if (imageData[i] < 255) { resolve(true); return; } } } catch (e) { console.error("透明度チェックエラー:", e); resolve(false); return; } resolve(false); }; img.onerror = () => { console.error("画像読み込みエラー"); resolve(false); }; img.src = imageUrl; }); }
    function checkDefaultImageTransparency(src) { checkImageTransparency(src).then(hasTransparency => { const backgroundGroup = document.getElementById('background-select-group'); if (hasTransparency) { backgroundGroup.style.display = 'block'; backgroundSelect.value = 'hologram_geometric.png'; } else { backgroundGroup.style.display = 'none'; backgroundSelect.value = ''; } updatePreview(); }); }
    
    initialize();
});
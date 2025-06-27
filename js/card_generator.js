document.addEventListener('DOMContentLoaded', () => {
    // DOM要素
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
    const previewPanel = document.querySelector('.preview-panel');
    const previewArea = document.getElementById('preview-area');
    const sparkleCheckbox = document.getElementById('sparkle-checkbox');
    const sparkleOverlayImage = document.getElementById('sparkle-overlay-image');

    // 状態管理
    let isDragging = false, startX, startY;
    let batchData = [];
    let localImageFiles = {};
    let imageState = { x: 0, y: 0, scale: 1 };
    let colorNameToIdMap = {};
    let imageFitDirection;

    const cardColorData = { "赤カード": { name: "赤", description: "BAD EVENT", color: "#990000", hover: "#7a0000", textColor: "#FFFFFF" }, "青カード": { name: "青", description: "GOOD EVENT", color: "#3366CC", hover: "#2851a3", textColor: "#FFFFFF" }, "緑カード": { name: "緑", description: "取得可能", color: "#009933", hover: "#007a29", textColor: "#FFFFFF" }, "黄カード": { name: "黄", description: "金銭、トレジャー", color: "#FFCC66", hover: "#d9ad52", textColor: "#2c3e50" }, "橙カード": { name: "橙", description: "その他", color: "#996633", hover: "#7a5229", textColor: "#FFFFFF" }, "紫カード": { name: "紫", description: "エネミー等", color: "#663366", hover: "#522952", textColor: "#FFFFFF" }, "白カード": { name: "白", description: "RPで切り抜ける", color: "#CCCCCC", hover: "#a3a3a3", textColor: "#2c3e50" }, "黒カード": { name: "黒", description: "フィールド", color: "#333333", hover: "#1a1a1a", textColor: "#FFFFFF" }, "虹カード": { name: "虹", description: "合体/激ヤバ", color: 'linear-gradient(45deg, #e74c3c, #f1c40f, #2ecc71, #3498db, #9b59b6)', hover: 'linear-gradient(45deg, #c0392b, #e67e22, #27ae60, #2980b9, #8e44ad)', textColor: "#FFFFFF" } };
    const cardTypes = { "": { name: "標準" }, "CF": { name: "文字枠なし" }, "FF": { name: "フルフレーム" }, "FFCF": { name: "フルフレーム & 文字枠なし" } };

    function scalePreview() {
        if (!previewPanel || !previewArea) return;
        const baseWidth = 480;
        const containerWidth = previewPanel.offsetWidth;
        if (containerWidth < baseWidth) {
            const scale = containerWidth / baseWidth;
            previewArea.style.transform = `scale(${scale})`;
            previewPanel.style.height = `${previewArea.offsetHeight * scale}px`;
        } else {
            previewArea.style.transform = 'none';
            previewPanel.style.height = 'auto';
        }
    }

    function initialize() {
        Object.entries(cardColorData).forEach(([id, details]) => {
            cardColorSelect.add(new Option(`${details.name}：${details.description}`, id));
            colorNameToIdMap[details.name] = id;
        });
        Object.entries(cardTypes).forEach(([key, details]) => cardTypeSelect.add(new Option(details.name, key)));
        cardColorSelect.value = "青カード";
        cardTypeSelect.value = "";
        ['change', 'input'].forEach(event => {
            [cardColorSelect, cardTypeSelect, backgroundSelect, cardNameInput, effectInput, flavorInput, flavorSpeakerInput]
                .forEach(el => el.addEventListener(event, updatePreview, { passive: true }));
        });
        imageUpload.addEventListener('change', handleImageUpload);
        resetImageBtn.addEventListener('click', resetImage);
        downloadBtn.addEventListener('click', () => downloadCard(false));
        downloadTemplateBtn.addEventListener('click', () => downloadCard(true));
        imageContainer.addEventListener('mousedown', startDrag);
        imageContainer.addEventListener('touchstart', startDrag, { passive: false });
        imageContainer.addEventListener('wheel', handleZoom, { passive: false });
        batchFileUpload.addEventListener('change', handleBatchFileUpload);
        imageFolderUpload.addEventListener('change', handleImageFolderUpload);
        batchDownloadBtn.addEventListener('click', processBatchDownload);
        sparkleCheckbox.addEventListener('change', () => {
            sparkleOverlayImage.style.display = sparkleCheckbox.checked ? 'block' : 'none';
        });
        document.getElementById('background-select-group').style.display = 'none';
        updatePreview();
        resetImage();
        setupFontSpecAnimation();
        window.addEventListener('resize', scalePreview);
        scalePreview();
    }

    function updatePreview() {
        const selectedColorId = cardColorSelect.value;
        const selectedType = cardTypeSelect.value;
        const colorDetails = cardColorData[selectedColorId];

        cardNameContent.classList.remove('title-styled');
        textBoxContainer.classList.remove('textbox-styled');
        cardNameContainer.style.backgroundImage = `url('Card_asset/タイトル.png')`;
        
        imageContainer.style.transition = 'none';
        if (selectedType === 'FF' || selectedType === 'FFCF') {
            imageContainer.style.height = '720px';
        } else {
            imageContainer.style.height = '480px';
        }
        void imageContainer.offsetHeight;
        imageContainer.style.transition = '';

        let templateName = selectedColorId;
        const isFullFrame = selectedType === 'FF' || selectedType === 'FFCF';

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

        switch (selectedType) {
            case '': break;
            case 'CF': 
                cardNameContent.classList.add('title-styled');
                cardNameContainer.style.backgroundImage = 'none';
                break;
            case 'FF': 
                templateName += 'FF';
                textBoxContainer.classList.add('textbox-styled');
                break;
            case 'FFCF': 
                templateName += 'FF';
                cardNameContent.classList.add('title-styled');
                textBoxContainer.classList.add('textbox-styled');
                cardNameContainer.style.backgroundImage = 'none';
                break;
        }

        cardTemplateImage.src = `Card_asset/テンプレ/${templateName}.png`;
        const selectedBackground = backgroundSelect.value;
        backgroundImage.style.display = selectedBackground ? 'block' : 'none';
        if (selectedBackground) backgroundImage.src = `Card_asset/${selectedBackground}`;
        
        updateCardName(cardNameInput.value);
        const replacePunctuation = (text) => text.replace(/、/g, '､').replace(/。/g, '｡');
        
        effectDisplay.innerText = replacePunctuation(effectInput.value);
        
        const flavorText = replacePunctuation(flavorInput.value);
        const speakerText = replacePunctuation(flavorSpeakerInput.value);
        const flavorInnerText = flavorDisplay.querySelector('.inner-text');

        if (speakerText) {
            flavorSpeakerDisplay.innerText = `─── ${speakerText}`;
            flavorSpeakerDisplay.style.display = 'block';
            if (flavorInnerText) flavorInnerText.style.webkitLineClamp = '2';
        } else {
            flavorSpeakerDisplay.innerText = '';
            flavorSpeakerDisplay.style.display = 'none';
            if (flavorInnerText) flavorInnerText.style.webkitLineClamp = '3';
        }
        
        if (flavorInnerText) {
            flavorInnerText.innerText = flavorText;
        } else {
            flavorDisplay.innerHTML = `<div class="inner-text" style="-webkit-line-clamp: ${speakerText ? 2 : 3};">${flavorText}</div>`;
        }

        updateThemeColor(colorDetails);
        requestAnimationFrame(setupImageForDrag);
    }
    
    function updateCardName(text) {
        const rubyRegex = /([\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEFa-zA-Z0-9\s]+?)\(([\u3040-\u309F\u30A0-\u30FFa-zA-Z0-9\s]+?)\)/g;
        const sanitizedText = text.replace(/`/g, '').replace(/</g, '<').replace(/>/g, '>');
        
        let html = '';
        let lastIndex = 0;
        let match;
        rubyRegex.lastIndex = 0;
        while ((match = rubyRegex.exec(sanitizedText)) !== null) {
            if (match.index > lastIndex) {
                html += `<span class="no-ruby">${sanitizedText.substring(lastIndex, match.index)}</span>`;
            }
            html += `<ruby><rb>${match[1]}</rb><rt>${match[2]}</rt></ruby>`;
            lastIndex = rubyRegex.lastIndex;
        }
        if (lastIndex < sanitizedText.length) {
            html += `<span class="no-ruby">${sanitizedText.substring(lastIndex)}</span>`;
        }
        cardNameContent.innerHTML = html || `<span class="no-ruby">${sanitizedText}</span>`;

        requestAnimationFrame(() => {
            const contentEl = cardNameContent;
            const hasRuby = contentEl.querySelector('ruby') !== null;
            const translateY = hasRuby ? '0px' : '-9px';
            const availableWidth = contentEl.clientWidth;
            const trueTextWidth = contentEl.scrollWidth;
            const scaleX = (trueTextWidth > availableWidth) ? (availableWidth / trueTextWidth) : 1;
            contentEl.style.transform = `translateY(${translateY}) scaleX(${scaleX})`;
        });
    }

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            imageFileName.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target.result;
                cardImage.src = imageUrl;
                cardImage.onload = () => {
                    setupImageForDrag();
                    checkImageTransparency(imageUrl).then(hasTransparency => {
                        const backgroundGroup = document.getElementById('background-select-group');
                        if (hasTransparency) {
                            backgroundGroup.style.display = 'block';
                            backgroundSelect.value = 'hologram_glitter.png';
                            updatePreview();
                        } else {
                            backgroundGroup.style.display = 'none';
                            if (backgroundSelect.value) {
                                backgroundSelect.value = '';
                                updatePreview();
                            }
                        }
                    });
                };
            };
            reader.readAsDataURL(file);
        }
    }

    function resetImage() {
        const isFullFrame = cardTypeSelect.value === 'FF' || cardTypeSelect.value === 'FFCF';
        const src = isFullFrame ? 'Card_asset/now_painting_FF.png' : 'Card_asset/now_painting.png';
        cardImage.src = src;
        imageUpload.value = '';
        imageFileName.textContent = '仁科ぬい';
        cardImage.onload = () => {
            setupImageForDrag();
            checkDefaultImageTransparency(src);
        };
        checkDefaultImageTransparency(src);
        updatePreview();
    }
    function setupImageForDrag() {
        imageState = { x: 0, y: 0, scale: 1 };
        const containerWidth = imageContainer.offsetWidth;
        const containerHeight = imageContainer.offsetHeight;
        const imageWidth = cardImage.naturalWidth;
        const imageHeight = cardImage.naturalHeight;
        if (imageWidth === 0 || imageHeight === 0) return;
        const containerAspect = containerWidth / containerHeight;
        const imageAspect = imageWidth / imageHeight;
        let newWidth, newHeight;
        if (imageAspect > containerAspect) {
            newHeight = containerHeight;
            newWidth = newHeight * imageAspect;
            imageFitDirection = 'landscape';
        } else {
            newWidth = containerWidth;
            newHeight = newWidth / imageAspect;
            imageFitDirection = 'portrait';
        }
        cardImage.style.width = `${newWidth}px`;
        cardImage.style.height = `${newHeight}px`;
        imageState.x = (containerWidth - newWidth) / 2;
        imageState.y = (containerHeight - newHeight) / 2;
        updateImageTransform();
        updateDraggableCursor();
    }
    function updateImageTransform() { cardImage.style.transform = `translate(${imageState.x}px, ${imageState.y}px) scale(${imageState.scale})`; }
    function updateDraggableCursor() { const canDrag = (imageFitDirection === 'landscape' && cardImage.offsetWidth * imageState.scale > imageContainer.offsetWidth + 0.1) || (imageFitDirection === 'portrait' && cardImage.offsetHeight * imageState.scale > imageContainer.offsetHeight + 0.1) || imageState.scale > 1.01; imageContainer.style.cursor = canDrag ? 'grab' : 'default'; }
    function startDrag(e) { if (imageContainer.style.cursor === 'default') return; e.preventDefault(); isDragging = true; imageContainer.style.cursor = 'grabbing'; const touch = e.touches ? e.touches[0] : e; startX = touch.clientX - imageState.x; startY = touch.clientY - imageState.y; document.addEventListener('mousemove', dragImage); document.addEventListener('mouseup', stopDrag); document.addEventListener('touchmove', dragImage, { passive: false }); document.addEventListener('touchend', stopDrag); }
    function dragImage(e) { if (!isDragging) return; const touch = e.touches ? e.touches[0] : e; if (imageFitDirection === 'landscape' || imageState.scale > 1) imageState.x = touch.clientX - startX; if (imageFitDirection === 'portrait' || imageState.scale > 1) imageState.y = touch.clientY - startY; clampImagePosition(); updateImageTransform(); }
    function stopDrag() { isDragging = false; updateDraggableCursor(); document.removeEventListener('mousemove', dragImage); document.removeEventListener('mouseup', stopDrag); document.removeEventListener('touchmove', dragImage); document.removeEventListener('touchend', stopDrag); }
    function handleZoom(e) { e.preventDefault(); const scaleAmount = 0.1; const delta = e.deltaY > 0 ? -1 : 1; const oldScale = imageState.scale; imageState.scale = Math.max(1, Math.min(imageState.scale + delta * scaleAmount, 3)); const rect = imageContainer.getBoundingClientRect(); const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top; imageState.x = mouseX - (mouseX - imageState.x) * (imageState.scale / oldScale); imageState.y = mouseY - (mouseY - imageState.y) * (imageState.scale / oldScale); clampImagePosition(); updateImageTransform(); updateDraggableCursor(); }
    function clampImagePosition() { const containerWidth = imageContainer.offsetWidth; const containerHeight = imageContainer.offsetHeight; const scaledWidth = cardImage.offsetWidth * imageState.scale; const scaledHeight = cardImage.offsetHeight * imageState.scale; const min_x = Math.min(0, containerWidth - scaledWidth); const max_x = 0; const min_y = Math.min(0, containerHeight - scaledHeight); const max_y = 0; imageState.x = Math.max(min_x, Math.min(max_x, imageState.x)); imageState.y = Math.max(min_y, Math.min(max_y, imageState.y)); }
    
    const forceLetterSpacingOnClone = (clonedDoc) => {
    // 【STEP 1】ご指示に基づき、#card-name-content の設定を追加
    const offsets = {
        '#card-name-content': 4, // ★追加：下に2pxずらす
        '#effect-display': 1,
        '#flavor-display': 3,
        '#flavor-speaker-display': 2
    };

    for (const selector of Object.keys(offsets)) {
        const originalEl = document.querySelector(selector);
        const clonedEl = clonedDoc.querySelector(selector);
        const yOffset = offsets[selector];

        if (originalEl && clonedEl) {
            // テキストがない場合は、余計な処理をせず終了
            if (originalEl.innerText.trim().length === 0) continue;

            originalEl.normalize();

            const charPositions = [];
            const containerRect = originalEl.getBoundingClientRect();
            const walker = document.createTreeWalker(originalEl, Node.FILTER_TEXT, null, false);

            while (walker.nextNode()) {
                const textNode = walker.currentNode;
                if (textNode.textContent.trim().length === 0) continue;

                for (let i = 0; i < textNode.length; i++) {
                    try {
                        const range = document.createRange();
                        range.setStart(textNode, i);
                        range.setEnd(textNode, i + 1);
                        const rect = range.getBoundingClientRect();
                        charPositions.push({
                            char: textNode.textContent[i],
                            x: rect.left - containerRect.left,
                            y: rect.top - containerRect.top
                        });
                    } catch (e) {
                        console.warn(`座標測定エラー: 文字 '${textNode.textContent[i]}' をスキップ。`, e);
                    }
                }
            }
            
            const computedStyle = window.getComputedStyle(originalEl);
            clonedEl.style.color = 'transparent';
            clonedEl.style.position = 'relative';

            charPositions.forEach(pos => {
                if (pos.char === '\n' || pos.char === '\r') return;
                
                const span = clonedDoc.createElement('span');
                span.textContent = pos.char;
                span.style.fontFamily = computedStyle.fontFamily;
                span.style.fontSize = computedStyle.fontSize;
                span.style.fontWeight = computedStyle.fontWeight;
                // 色は元のスタイルから取得し、透明を上書きする
                span.style.color = computedStyle.color;
                span.style.position = 'absolute';
                span.style.left = `${pos.x}px`;
                // 調整されたオフセット値を適用
                span.style.top = `${pos.y + yOffset}px`;
                
                clonedEl.appendChild(span);
            });
        }
    }
};

    function downloadCard(isTemplate = false) {
        if (!isTemplate && sparkleCheckbox.checked) {
            generateSparkleApng();
            return;
        }

        const button = isTemplate ? downloadTemplateBtn : downloadBtn;
        const originalButtonText = button.textContent;
        button.textContent = '生成中...';
        button.disabled = true;

        const elementsToHide = [cardNameContent, effectDisplay, flavorDisplay, flavorSpeakerDisplay, cardImage];
        
        if (isTemplate) {
            elementsToHide.forEach(el => el.style.opacity = '0');
        }

        const originalTransform = previewArea.style.transform;
        previewArea.style.transform = 'none';
    
        document.fonts.ready.then(() => {
            setTimeout(() => {
                html2canvas(cardContainer, {
                    backgroundColor: null,
                    useCORS: true,
                    scale: highResCheckbox.checked ? 2 : 1,
                    // 出力時に文字間隔を強制するoncloneオプションを追加
                    onclone: (doc) => {
                        forceLetterSpacingOnClone(doc);
                        // テンプレート保存時にはキラエフェクトを非表示にする
                        if (isTemplate) {
                            const clonedSparkleOverlay = doc.getElementById('sparkle-overlay-image');
                            if (clonedSparkleOverlay) {
                                clonedSparkleOverlay.style.display = 'none';
                            }
                        }
                    }
                }).then(canvas => {
                    const link = document.createElement('a');
                    const fileName = isTemplate
                        ? `${cardColorSelect.value}_${cardTypeSelect.value || 'Standard'}_template.png`
                        : `${cardNameInput.value.replace(/[()`]/g, '') || 'custom_card'}.png`;
                    link.download = fileName;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                }).catch(err => {
                    console.error('画像生成に失敗しました。', err);
                    alert('エラーが発生しました。');
                }).finally(() => {
                    if (isTemplate) {
                        elementsToHide.forEach(el => el.style.opacity = '1');
                    }
                    button.textContent = originalButtonText;
                    button.disabled = false;
                    previewArea.style.transform = originalTransform;
                });
            }, 100);
        });
    }

    async function generateSparkleApng() {
        const button = downloadBtn;
        button.textContent = 'キラAPNGを生成中...';
        button.disabled = true;

        try {
            const blob = await createSparkleApngBlob();
            const link = document.createElement('a');
            const fileName = `${(cardNameInput.value || 'custom_card').replace(/[()`]/g, '')}_kira.png`;
            link.download = fileName;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);

        } catch (err) {
            console.error('キラAPNGの生成に失敗しました。', err);
            alert(`キラAPNGの生成中にエラーが発生しました。\n詳細: ${err.message}`);
        } finally {
            button.textContent = 'カードを保存';
            button.disabled = false;
        }
    }

    function hexToRgb(hex) { const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null; }
    function rgbToHex(r, g, b) { return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
    function adjustHexColor(hex, amount) { if (!hex || !hex.startsWith('#')) return hex; let { r, g, b } = hexToRgb(hex); r = Math.max(0, Math.min(255, r + amount)); g = Math.max(0, Math.min(255, g + amount)); b = Math.max(0, Math.min(255, b + amount)); return rgbToHex(r, g, b); }
    function getLuminance(hex) { if (!hex || !hex.startsWith('#')) return 0; let { r, g, b } = hexToRgb(hex); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
    function updateThemeColor(details) {
        if (!details) return;
        const root = document.documentElement;
        const body = document.body;
        root.style.setProperty('--button-bg', details.color);
        root.style.setProperty('--button-hover-bg', details.hover);
        root.style.setProperty('--button-color', details.textColor);
        if (details.color.startsWith('linear-gradient')) {
            root.style.setProperty('--theme-bg-dark', '#0d1a50');
            root.style.setProperty('--theme-bg-main', '#1a2c6d');
            root.style.setProperty('--theme-border', '#2a3c7d');
            body.classList.remove('light-theme-ui');
        } else {
            root.style.setProperty('--theme-bg-dark', adjustHexColor(details.color, -30));
            root.style.setProperty('--theme-bg-main', adjustHexColor(details.color, -15));
            root.style.setProperty('--theme-border', adjustHexColor(details.color, 15));
            if (getLuminance(details.color) > 160) {
                body.classList.add('light-theme-ui');
            } else {
                body.classList.remove('light-theme-ui');
            }
        }
    }
    
    function setupFontSpecAnimation() {
        const details = document.querySelector('.font-spec-details');
        if (!details) return;

        const summary = details.querySelector('summary');
        const table = details.querySelector('.font-spec-table');

        summary.addEventListener('click', (event) => {
            event.preventDefault();

            if (details.open) {
                table.style.maxHeight = '0';
                table.style.opacity = '0';
                setTimeout(() => {
                    details.removeAttribute('open');
                }, 400);
            } else {
                details.setAttribute('open', '');
                table.style.maxHeight = table.scrollHeight + 'px';
                table.style.opacity = '1';
            }
        });
    }

    function handleBatchFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        batchFileName.textContent = file.name;
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target.result;
                let rawData;
                if (file.name.endsWith('.json')) {
                    rawData = JSON.parse(content);
                    rawData.forEach(item => item.sparkle = item.sparkle === true);
                    batchData = rawData;
                } else if (file.name.endsWith('.csv')) {
                    rawData = parseCsv(content);
                    batchData = rawData.map(item => {
                        const colorName = item['色'] || '';
                        const cardId = colorNameToIdMap[colorName] || '青カード';
                        const sparkleValue = (item['キラ'] || 'false').toLowerCase();
                        return {
                            cardName: item['カード名'] || '',
                            effect: item['効果説明'] || '',
                            flavor: item['フレーバー'] || '',
                            speaker: item['フレーバー名'] || '',
                            color: cardId,
                            image: item['イラスト'] || '',
                            type: item['タイプ'] || '', 
                            background: item['背景'] || '', 
                            sparkle: ['true', '1', 'yes', 'はい', 'on'].includes(sparkleValue)
                        };
                    });
                } else {
                    throw new Error('サポートされていないファイル形式です。');
                }
                
                batchDownloadBtn.disabled = false;
                alert(`${batchData.length}件のカードデータを読み込みました。`);
            } catch (error) {
                console.error('ファイルの読み込みまたはパースに失敗しました:', error);
                alert(`エラー: ${error.message}`);
                batchFileName.textContent = '選択されていません';
                batchDownloadBtn.disabled = true;
                batchData = [];
            }
        };
        reader.readAsText(file);
    }

    function parseCsv(csvText) {
        const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i]) continue;
            const values = lines[i].split(',').map(v => v.trim());
            const entry = {};
            headers.forEach((header, index) => {
                entry[header] = values[index].replace(/^"(.*)"$/, '$1');
            });
            data.push(entry);
        }
        return data;
    }

    function handleImageFolderUpload(event) {
        const files = event.target.files;
        if (files.length === 0) return;

        localImageFiles = {};
        for (const file of files) {
            localImageFiles[file.name] = URL.createObjectURL(file);
        }
        imageFolderName.textContent = `${files.length}個の画像を選択`;
        alert(`${files.length}個のローカル画像を読み込みました。`);
    }

    function updatePreviewFromData(data) {
        cardColorSelect.value = data.color || '青カード';
        cardTypeSelect.value = data.type || '';
        backgroundSelect.value = data.background || '';
        cardNameInput.value = data.cardName || '';
        effectInput.value = data.effect || '';
        flavorInput.value = data.flavor || '';
        flavorSpeakerInput.value = data.speaker || '';
        
        const imageName = data.image ? data.image.split('/').pop() : '';
        if (localImageFiles[imageName]) {
            cardImage.src = localImageFiles[imageName];
            imageFileName.textContent = imageName;
        } else if (data.image) {
            cardImage.src = data.image;
            imageFileName.textContent = imageName;
        } else {
            resetImage();
        }
        
        sparkleCheckbox.checked = data.sparkle === true;
        sparkleOverlayImage.style.display = sparkleCheckbox.checked ? 'block' : 'none';

        updatePreview();
        cardImage.onload = () => {
             updatePreview();
             setupImageForDrag();
        }
    }

    async function createSparkleApngBlob() {
        const originalTransform = previewArea.style.transform;
        previewArea.style.transform = 'none';

        const baseImageElements = [backgroundImage, cardTemplateImage, imageContainer];
        const textElements = [cardNameContainer, textBoxContainer];

        try {
            textElements.forEach(el => el.style.opacity = 0);
            sparkleOverlayImage.style.display = 'none';
            await new Promise(r => setTimeout(r, 100));
            const baseCanvas = await html2canvas(cardContainer, { backgroundColor: null, useCORS: true, scale: 1 });
            
            textElements.forEach(el => el.style.opacity = 1);
            baseImageElements.forEach(el => el.style.opacity = 0);
            await new Promise(r => setTimeout(r, 100));
            const textCanvas = await html2canvas(cardContainer, { 
                backgroundColor: null, 
                useCORS: true, 
                scale: 1,
                onclone: forceLetterSpacingOnClone // テキストのみのCanvasに文字間隔を適用
            });
            
            const sparkleBuffer = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', 'Card_asset/加算してキラキラ.png', true);
                xhr.responseType = 'arraybuffer';
                xhr.onload = function() {
                    if (this.status === 200 || this.status === 0) resolve(this.response);
                    else reject(new Error(`キラキラ素材の読み込みに失敗しました (HTTP Status: ${this.status})`));
                };
                xhr.onerror = () => reject(new Error('キラキラ素材の読み込みでネットワークエラーが発生しました。'));
                xhr.send();
            });

            let sparkleApng = UPNG.decode(sparkleBuffer);
            const sparkleFrames = UPNG.toRGBA8(sparkleApng);
            const newFrames = [];
            const { width, height } = baseCanvas;

            for (let i = 0; i < sparkleFrames.length; i++) {
                const frameData = sparkleFrames[i];
                const frameCanvas = document.createElement('canvas');
                frameCanvas.width = width;
                frameCanvas.height = height;
                const frameCtx = frameCanvas.getContext('2d');

                frameCtx.drawImage(baseCanvas, 0, 0);
                
                const tempSparkleCanvas = document.createElement('canvas');
                tempSparkleCanvas.width = sparkleApng.width;
                tempSparkleCanvas.height = sparkleApng.height;
                tempSparkleCanvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(frameData), sparkleApng.width, sparkleApng.height), 0, 0);
                
                frameCtx.globalCompositeOperation = 'lighter';
                frameCtx.drawImage(tempSparkleCanvas, 0, 0, width, height);
                frameCtx.globalCompositeOperation = 'source-over';
                frameCtx.drawImage(textCanvas, 0, 0);

                newFrames.push(frameCtx.getImageData(0, 0, width, height).data.buffer);
            }

            const delays = sparkleApng.frames.map(f => f.delay);
            const newApngBuffer = UPNG.encode(newFrames, width, height, 0, delays);
            return new Blob([newApngBuffer], { type: 'image/png' });

        } catch (err) {
            console.error('APNG Blobの生成に失敗しました。', err);
            throw err;
        } finally {
            previewArea.style.transform = originalTransform;
            [...baseImageElements, ...textElements].forEach(el => el.style.opacity = 1);
            sparkleOverlayImage.style.display = sparkleCheckbox.checked ? 'block' : 'none';
        }
    }

    async function processBatchDownload() {
        if (batchData.length === 0) {
            alert('データが読み込まれていません。');
            return;
        }

        const zip = new JSZip();
        batchDownloadBtn.disabled = true;
        batchProgress.style.display = 'block';

        for (let i = 0; i < batchData.length; i++) {
            const cardData = batchData[i];
            batchProgress.textContent = `処理中... (${i + 1}/${batchData.length})`;
            
            updatePreviewFromData(cardData);
            
            await new Promise(resolve => document.fonts.ready.then(() => setTimeout(resolve, 200)));

            try {
                const fileName = `${(cardData.cardName || `card_${i+1}`).replace(/[()`]/g, '')}.png`;
                let imageBlob;

                if (cardData.sparkle) {
                    imageBlob = await createSparkleApngBlob();
                } else {
                    const scale = highResCheckbox.checked ? 2 : 1;
                    const canvas = await html2canvas(cardContainer, {
                        backgroundColor: null,
                        useCORS: true,
                        scale: scale,
                        onclone: forceLetterSpacingOnClone
                    });
                    imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                }

                if (imageBlob) {
                    zip.file(fileName, imageBlob);
                }
            } catch (err) {
                console.error(`カード[${cardData.cardName || i+1}]の画像生成に失敗しました:`, err);
                zip.file(`ERROR_${cardData.cardName || i+1}.txt`, `このカードの生成に失敗しました。\nエラー: ${err.message}`);
            }
        }

        batchProgress.textContent = 'ZIPファイルを生成中...';
        zip.generateAsync({ type: 'blob' }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'cards_batch.zip';
            link.click();
            URL.revokeObjectURL(link.href);

            batchProgress.textContent = '完了しました！';
            setTimeout(() => {
                batchProgress.style.display = 'none';
                batchDownloadBtn.disabled = false;
            }, 3000);
        });
    }

    function checkImageTransparency(imageUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                try {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    for (let i = 3; i < imageData.length; i += 4) {
                        if (imageData[i] < 255) {
                            resolve(true);
                            return;
                        }
                    }
                } catch (e) {
                    console.error("透明度チェックエラー:", e);
                    resolve(false);
                    return;
                }
                resolve(false);
            };
            img.onerror = () => {
                console.error("画像読み込みエラー");
                resolve(false);
            };
            img.src = imageUrl;
        });
    }

    function checkDefaultImageTransparency(src) {
        checkImageTransparency(src).then(hasTransparency => {
            const backgroundGroup = document.getElementById('background-select-group');
            if (hasTransparency) {
                backgroundGroup.style.display = 'block';
                backgroundSelect.value = 'hologram_glitter.png';
            } else {
                backgroundGroup.style.display = 'none';
                backgroundSelect.value = '';
            }
            updatePreview();
        });
    }

    initialize();
});
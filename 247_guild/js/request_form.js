document.addEventListener('DOMContentLoaded', () => {

    // --- DOM要素の取得 ---
    const titleInput = document.getElementById('title-input');
    const levelInput = document.getElementById('level-input');
    const contentInput = document.getElementById('content-input');
    const rewardInput = document.getElementById('reward-input');
    const requesterInput = document.getElementById('requester-input');
    const bgLogoToggle = document.getElementById('bg-logo-toggle');
    const bgStampToggle = document.getElementById('bg-stamp-toggle');
    const bulkImportFileName = document.getElementById('bulk-import-file-name');
    const highResCheckbox = document.getElementById('high-res-checkbox'); // ★★★ この行を追加 ★★★

    const titleDisplay = document.getElementById('title-display');
    const titleContainer = document.querySelector('.title-container');
    const levelDisplay = document.getElementById('level-display');
    const contentDisplay = document.getElementById('content-display');
    const rewardDisplay = document.getElementById('reward-display');
    const requesterDisplay = document.getElementById('requester-display');
    const rewardValueDisplay = document.querySelector('#reward-display .value');
    const requesterValueDisplay = document.querySelector('#requester-display .value');
    const logoImage = document.getElementById('logo-image');
    const stampImage = document.getElementById('stamp-image');
    
    const previewPanel = document.querySelector('.preview-panel');
    const requestFormPaper = document.querySelector('.request-form-paper');

    // --- ユーティリティ関数 ---
    const sanitizeFilename = (name) => {
        if (!name) return '無題の依頼書.png';
        return name.replace(/[\\/:*?"<>|]/g, '＿') + '.png';
    };

    const parseCSV = (csvText) => {
        try {
            const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const data = [];
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i]) continue;
                const values = lines[i].split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
                const entry = {};
                headers.forEach((header, j) => {
                    entry[header] = values[j];
                });
                data.push(entry);
            }
            return data;
        } catch (e) {
            console.error("CSVのパースに失敗しました:", e);
            return null;
        }
    };

    // --- 調整関数 ---
    const scalePreview = () => {
        if (!previewPanel || !requestFormPaper) return;
        const baseWidth = 674;
        const containerWidth = previewPanel.offsetWidth;
        if (containerWidth < baseWidth) {
            const scale = containerWidth / baseWidth;
            requestFormPaper.style.transform = `scale(${scale})`;
            previewPanel.style.height = `${requestFormPaper.offsetHeight * scale}px`;
        } else {
            requestFormPaper.style.transform = 'none';
            previewPanel.style.height = 'auto';
        }
    };

    const adjustFontSize = (element, container, maxFontSize, minFontSize = 10) => {
        if (!element || !container) return;
        element.style.fontSize = `${maxFontSize}px`;
        requestAnimationFrame(() => {
            const availableWidth = container.clientWidth * 0.9;
            const textWidth = element.scrollWidth;
            if (textWidth > availableWidth) {
                const scale = availableWidth / textWidth;
                const newSize = Math.max(minFontSize, Math.floor(maxFontSize * scale));
                element.style.fontSize = `${newSize}px`;
            }
        });
    };

    const adjustSyncedFontSize = (maxFontSize) => {
        if (!rewardDisplay || !requesterDisplay) return;
        const elements = [rewardDisplay, requesterDisplay];
        elements.forEach(el => el.style.fontSize = `${maxFontSize}px`);
        requestAnimationFrame(() => {
            const availableWidth = elements[0].parentElement.clientWidth * 0.9;
            const scales = elements.map(el => {
                const scrollWidth = el.scrollWidth;
                return scrollWidth > availableWidth ? availableWidth / scrollWidth : 1.0;
            });
            const minScale = Math.min(...scales);
            const newSize = Math.max(10, Math.floor(maxFontSize * minScale));
            elements.forEach(el => el.style.fontSize = `${newSize}px`);
        });
    };
    
    // --- 更新関数 ---
    const processUnits = (text, preserveSpaces = false) => {
        if (!text) return ' ';
        let processedText = preserveSpaces ? text : text.replace(/ /g, ' ');
        processedText = processedText.replace(/\\\[/g, '___L_BRACKET___').replace(/\\\]/g, '___R_BRACKET___');
        const regex = /\[([^\[\]]*)\]/g;
        while (processedText.match(regex)) {
            processedText = processedText.replace(regex, '<span class="unit-text">$1</span>');
        }
        processedText = processedText.replace(/___L_BRACKET___/g, '[').replace(/___R_BRACKET___/g, ']');
        return processedText;
    };

    const updateAll = () => {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const titleMaxFontSize = isMobile ? 52 : 72;
        const sectionMaxFontSize = isMobile ? 32 : 42;
        const levelMaxFontSize = isMobile ? 24 : 32;
        
        if (titleInput) titleDisplay.innerHTML = processUnits(titleInput.value);
        if (levelInput) levelDisplay.innerHTML = processUnits(levelInput.value);
        if (contentInput) {
            const processedContent = processUnits(contentInput.value, true);
            contentDisplay.innerHTML = processedContent.replace(/\n/g, '<br>');
            const lineHeight = 28;
            const scrollHeight = contentDisplay.scrollHeight;
            const lineCount = Math.round(scrollHeight / lineHeight);
            contentInput.classList.toggle('warning', lineCount >= 13);
        }
        if (rewardInput) rewardValueDisplay.innerHTML = processUnits(rewardInput.value);
        if (requesterInput) requesterValueDisplay.innerHTML = processUnits(requesterInput.value);

        if (logoImage) logoImage.style.display = bgLogoToggle.checked ? 'block' : 'none';
        if (stampImage) stampImage.style.display = bgStampToggle.checked ? 'block' : 'none';

        adjustFontSize(titleDisplay, titleContainer, titleMaxFontSize);
        adjustFontSize(levelDisplay, levelDisplay.parentElement, levelMaxFontSize);
        adjustSyncedFontSize(sectionMaxFontSize);
    };

    // --- イベントリスナーの設定 ---
    [titleInput, levelInput, contentInput, rewardInput, requesterInput, bgLogoToggle, bgStampToggle].forEach(input => {
        if (input) input.addEventListener('input', updateAll);
    });
    window.addEventListener('resize', () => { updateAll(); scalePreview(); });
    window.addEventListener('typekit-loaded', () => { updateAll(); scalePreview(); }, { once: true });


    // --- ダウンロード処理 ---
    const generateAndDownloadImage = async (filename) => {
        const originalTransform = requestFormPaper.style.transform;
        const originalPanelHeight = previewPanel.style.height;

        requestFormPaper.style.transform = 'none';
        previewPanel.style.height = 'auto';

        await document.fonts.ready;
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            // ★★★ チェックボックスの状態に応じてscaleを決定 ★★★
            const scale = highResCheckbox.checked ? 2 : 1;
            
            const canvas = await html2canvas(requestFormPaper, {
                backgroundColor: null,
                useCORS: true,
                scale: scale // 動的なscaleを適用
            });
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('画像生成に失敗しました。', err);
            throw err;
        } finally {
            requestFormPaper.style.transform = originalTransform;
            previewPanel.style.height = originalPanelHeight;
        }
    };
    
    // --- 単体ダウンロードボタンの処理 ---
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            downloadBtn.textContent = '画像を生成中...';
            downloadBtn.disabled = true;
            try {
                const filename = sanitizeFilename(titleInput.value);
                await generateAndDownloadImage(filename);
            } catch (err) {
                alert('エラーが発生しました。');
            } finally {
                downloadBtn.textContent = '依頼書を画像として保存';
                downloadBtn.disabled = false;
            }
        });
    }

    // --- 一括出力の処理 ---
    const bulkImportFile = document.getElementById('bulk-import-file');
    const bulkExportBtn = document.getElementById('bulk-export-btn');

    if (bulkImportFile && bulkExportBtn) {
        bulkImportFile.addEventListener('change', () => {
            if (bulkImportFile.files.length > 0) {
                bulkImportFileName.textContent = bulkImportFile.files[0].name;
            } else {
                bulkImportFileName.textContent = '選択されていません';
            }
        });

        bulkExportBtn.addEventListener('click', () => {
            const file = bulkImportFile.files[0];
            if (!file) {
                alert('ファイルを選択してください。');
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                const content = e.target.result;
                let data;

                if (file.name.endsWith('.json')) {
                    try { data = JSON.parse(content); } catch (err) { alert('JSONファイルの形式が正しくありません。'); return; }
                } else if (file.name.endsWith('.csv')) {
                    data = parseCSV(content);
                    if (!data) { alert('CSVファイルの形式が正しくありません。'); return; }
                }

                if (data && data.length > 0) {
                    bulkExportBtn.textContent = `1 / ${data.length} を処理中...`;
                    bulkExportBtn.disabled = true;
                    downloadBtn.disabled = true;

                    for (let i = 0; i < data.length; i++) {
                        const request = data[i];
                        bulkExportBtn.textContent = `${i + 1} / ${data.length} を処理中...`;
                        
                        titleInput.value = request.title || request['依頼タイトル'] || '';
                        levelInput.value = request.level || request['推奨レベル'] || '';
                        contentInput.value = request.content || request['依頼内容'] || '';
                        rewardInput.value = request.reward || request['報酬'] || '';
                        requesterInput.value = request.requester || request['依頼人'] || '';
                        bgLogoToggle.checked = !!(request.bgLogo || request['ロゴ表示']);
                        bgStampToggle.checked = !!(request.bgStamp || request['済印表示']);
                        
                        updateAll();

                        try {
                            const filename = sanitizeFilename(titleInput.value);
                            await generateAndDownloadImage(filename);
                            await new Promise(resolve => setTimeout(resolve, 500)); 
                        } catch (err) {
                             alert(`${i + 1}番目の依頼「${titleInput.value}」の画像生成中にエラーが発生しました。処理を中断します。`);
                             break;
                        }
                    }

                    bulkExportBtn.textContent = 'ファイルから一括出力';
                    bulkExportBtn.disabled = false;
                    downloadBtn.disabled = false;
                }
            };
            reader.readAsText(file);
        });
    }

    // --- テンプレートダウンロード機能 ---
    const setupTemplateDownload = (linkId, filename, data) => {
        const link = document.getElementById(linkId);
        if(link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }
    };

    const jsonTemplate = JSON.stringify([
        { "title": "蛮族退治", "level": "Lv: 1～2", "content": "この近くに蛮族が棲みつき、こちらの様子をうかがっているようなのです。何度追い払っても、どこからかすぐに現れて困っています」「いつ襲ってくるか不安なので、拠点を見つけて退治をお願いします", "reward": "500ガメル", "requester": "チェルシー・ソロウ", "bgLogo": false, "bgStamp": false },
        { "title": "邪教の調査", "level": "Lv: 5～6", "content": "街で邪教の神官が人々をたぶらかしている。奴はこれまでに何人も生贄として殺しています。犯人を特定し、止めてください。最悪、命を奪うことになっても仕方ありませんが、もし生きたまま捕縛できたなら、報酬を上乗せいたします", "reward": "3,000ガメル", "requester": "ブロン・ビューエル", "bgLogo": false, "bgStamp": true }
    ], null, 2);
    setupTemplateDownload('json-template-link', 'template.json', jsonTemplate);

    const csvTemplate = `"title","level","content","reward","requester","bgLogo","bgStamp"\n"蛮族退治","Lv: 1～2","この近くに蛮族が棲みつき、こちらの様子をうかがっているようなのです。何度追い払っても、どこからかすぐに現れて困っています」「いつ襲ってくるか不安なので、拠点を見つけて退治をお願いします","500ガメル","チェルシー・ソロウ","false","false"\n"邪教の調査","Lv: 5～6","街で邪教の神官が人々をたぶらかしている。奴はこれまでに何人も生贄として殺しています。犯人を特定し、止めてください。最悪、命を奪うことになっても仕方ありませんが、もし生きたまま捕縛できたなら、報酬を上乗せいたします","3,000ガメル","ブロン・ビューエル","false","true"`;
    setupTemplateDownload('csv-template-link', 'template.csv', csvTemplate);


    // --- 押しピン機能 (省略) ---
    const pinToggle = document.getElementById('pin-toggle');
    const pinImage = document.getElementById('pin-image');
    const pinDirectionRadios = document.querySelectorAll('input[name="pin-direction"]');
    const pinDirectionGroup = document.getElementById('pin-direction-group');
    const updatePin = () => { if (!pinImage || !pinToggle) return; pinImage.style.display = pinToggle.checked ? 'block' : 'none'; const selectedDirection = document.querySelector('input[name="pin-direction"]:checked').value; pinImage.src = `img/pin_${selectedDirection}.png`; };
    const togglePinDirectionUI = () => { if (!pinDirectionGroup || !pinToggle) return; pinDirectionGroup.classList.toggle('visible', pinToggle.checked); };
    if (pinToggle) { pinToggle.addEventListener('input', () => { updatePin(); togglePinDirectionUI(); }); }
    pinDirectionRadios.forEach(radio => radio.addEventListener('change', updatePin));
    let isDragging = false, offsetX, offsetY;
    const startDrag = (e) => { if (e.target !== pinImage) return; e.preventDefault(); isDragging = true; pinImage.classList.add('dragging'); const clientX = e.clientX || e.touches[0].clientX; const clientY = e.clientY || e.touches[0].clientY; const pinRect = pinImage.getBoundingClientRect(); offsetX = clientX - pinRect.left; offsetY = clientY - pinRect.top; };
    const doDrag = (e) => { if (!isDragging) return; e.preventDefault(); const clientX = e.clientX || e.touches[0].clientX; const clientY = e.clientY || e.touches[0].clientY; const previewRect = requestFormPaper.getBoundingClientRect(); let x = clientX - previewRect.left - offsetX; let y = clientY - previewRect.top - offsetY; const scale = previewRect.width / requestFormPaper.offsetWidth; x /= scale; y /= scale; x = Math.max(0, Math.min(x, requestFormPaper.offsetWidth - pinImage.width)); y = Math.max(0, Math.min(y, requestFormPaper.offsetHeight - pinImage.height)); pinImage.style.left = `${x}px`; pinImage.style.top = `${y}px`; };
    const stopDrag = () => { if (!isDragging) return; isDragging = false; pinImage.classList.remove('dragging'); };
    if (pinImage) { pinImage.addEventListener('mousedown', startDrag); pinImage.addEventListener('touchstart', startDrag, { passive: false }); }
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('touchmove', doDrag, { passive: false });
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
    updatePin();
    togglePinDirectionUI();
    const backToPreviousPageLink = document.getElementById('back-link');
    if (backToPreviousPageLink) { backToPreviousPageLink.addEventListener('click', (event) => { event.preventDefault(); history.back(); }); }
    
    // --- 初期化呼び出し ---
    updateAll();
    scalePreview();
});
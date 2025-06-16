document.addEventListener('DOMContentLoaded', () => {

    // --- DOM要素の取得 ---
    const titleInput = document.getElementById('title-input');
    const levelInput = document.getElementById('level-input');
    const contentInput = document.getElementById('content-input');
    const rewardInput = document.getElementById('reward-input');
    const requesterInput = document.getElementById('requester-input');
    const bgLogoToggle = document.getElementById('bg-logo-toggle');
    const bgStampToggle = document.getElementById('bg-stamp-toggle');

    const titleDisplay = document.getElementById('title-display');
    const levelDisplay = document.getElementById('level-display');
    const contentDisplay = document.getElementById('content-display');
    const rewardDisplay = document.getElementById('reward-display');
    const requesterDisplay = document.getElementById('requester-display');
    const rewardValueDisplay = document.querySelector('#reward-display .value');
    const requesterValueDisplay = document.querySelector('#requester-display .value');
    const logoImage = document.getElementById('logo-image');
    const stampImage = document.getElementById('stamp-image');
    
    const titleContainer = document.querySelector('.title-container');

    // --- 調整関数 ---

    // タイトルのフォントサイズを調整
    const adjustTitleFontSize = (maxFontSize) => {
        if (!titleDisplay || !titleContainer) return;
        titleDisplay.style.fontSize = `${maxFontSize}px`;

        requestAnimationFrame(() => {
            const style = window.getComputedStyle(titleContainer);
            const paddingLeft = parseFloat(style.paddingLeft);
            const paddingRight = parseFloat(style.paddingRight);
            const containerWidth = titleContainer.clientWidth - paddingLeft - paddingRight;
            const scrollWidth = titleDisplay.scrollWidth;

            if (scrollWidth > containerWidth) {
                const scale = containerWidth / scrollWidth;
                const newSize = Math.max(10, Math.floor(maxFontSize * scale));
                titleDisplay.style.fontSize = `${newSize}px`;
            }
        });
    };

    // 単一要素のフォントサイズを調整する汎用関数
    const adjustSingleElementFontSize = (element, maxFontSize) => {
        if (!element) return;
        element.style.fontSize = `${maxFontSize}px`;

        requestAnimationFrame(() => {
            const parentWidth = element.parentElement.clientWidth;
            const scrollWidth = element.scrollWidth;

            if (scrollWidth > parentWidth) {
                const scale = parentWidth / scrollWidth;
                const newSize = Math.max(10, Math.floor(maxFontSize * scale));
                element.style.fontSize = `${newSize}px`;
            }
        });
    };

    // 報酬・依頼人のフォントサイズを同期調整
    const adjustSyncedFontSize = (maxFontSize) => {
        if (!rewardDisplay || !requesterDisplay) return;
        const elements = [rewardDisplay, requesterDisplay];
        
        elements.forEach(el => {
            el.style.fontSize = `${maxFontSize}px`;
        });

        requestAnimationFrame(() => {
            const scales = elements.map(el => {
                const parentWidth = el.parentElement.clientWidth;
                const scrollWidth = el.scrollWidth;
                return scrollWidth > parentWidth ? parentWidth / scrollWidth : 1.0;
            });

            const minScale = Math.min(...scales);
            const newSize = Math.max(10, Math.floor(maxFontSize * minScale));

            elements.forEach(el => {
                el.style.fontSize = `${newSize}px`;
            });
        });
    };

    // --- 更新関数 ---

    // 単位表記を処理するヘルパー関数（多重がけ、エスケープ対応）
    const processUnits = (text) => {
        if (!text) return text === '' ? '&nbsp;' : text;

        // 1. エスケープされた角括弧を一時的なプレースホルダーに置換
        let processedText = text.replace(/\\\[/g, '___LEFT_BRACKET___').replace(/\\\]/g, '___RIGHT_BRACKET___');

        // 2. ネストされた角括弧を内側から繰り返し処理
        const regex = /\[([^\[\]]*)\]/g;
        while (processedText.match(regex)) {
            processedText = processedText.replace(regex, '<span class="unit-text">$1</span>');
        }

        // 3. プレースホルダーを元の文字に戻す
        processedText = processedText.replace(/___LEFT_BRACKET___/g, '[').replace(/___RIGHT_BRACKET___/g, ']');
        
        return processedText;
    };

    const updateAll = () => {
        // 画面幅に応じて基準フォントサイズを切り替え
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const titleMaxFontSize = isMobile ? 52 : 72;
        const sectionMaxFontSize = isMobile ? 32 : 42;
        const levelMaxFontSize = isMobile ? 24 : 32;

        if (titleInput) titleDisplay.innerText = titleInput.value;
        if (levelInput) {
            levelDisplay.innerHTML = processUnits(levelInput.value);
        }
        if (contentInput && contentDisplay) {
            const processedContent = processUnits(contentInput.value);
            contentDisplay.innerHTML = processedContent.replace(/\n/g, '<br>');
            // 表示されている高さから行数を計算
            const lineHeight = 28; // CSSで指定した値
            const scrollHeight = contentDisplay.scrollHeight;
            const lineCount = Math.round(scrollHeight / lineHeight);

            if (lineCount >= 13) {
                contentInput.classList.add('warning');
            } else {
                contentInput.classList.remove('warning');
            }
        }
        if (rewardInput) rewardValueDisplay.innerHTML = processUnits(rewardInput.value);
        if (requesterInput) requesterValueDisplay.innerHTML = processUnits(requesterInput.value);

        // 画像の表示/非表示
        if (logoImage && bgLogoToggle) logoImage.style.display = bgLogoToggle.checked ? 'block' : 'none';
        if (stampImage && bgStampToggle) stampImage.style.display = bgStampToggle.checked ? 'block' : 'none';

        adjustTitleFontSize(titleMaxFontSize);
        adjustSyncedFontSize(sectionMaxFontSize);
        adjustSingleElementFontSize(levelDisplay, levelMaxFontSize);
    };

    // --- イベントリスナーの設定 (一度だけ登録) ---
    
    [titleInput, levelInput, contentInput, rewardInput, requesterInput, bgLogoToggle, bgStampToggle].forEach(input => {
        if (input) {
            input.addEventListener('input', updateAll);
        }
    });

    window.addEventListener('resize', updateAll);
    window.addEventListener('typekit-loaded', updateAll, { once: true });

    // 初期表示
    updateAll();


    // --- ダウンロード処理 ---
    const downloadBtn = document.getElementById('download-btn');
    const previewArea = document.querySelector('.request-form-paper');
    if (downloadBtn && previewArea) {
        downloadBtn.addEventListener('click', () => {
            downloadBtn.textContent = '画像を生成中...';
            downloadBtn.disabled = true;
            
            const targetWidth = 674;
            const actualWidth = previewArea.offsetWidth;
            const scale = targetWidth / actualWidth;

            html2canvas(previewArea, {
                backgroundColor: null,
                useCORS: true,
                scale: scale
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = '依頼書.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            }).catch(err => {
                console.error('画像生成に失敗しました。', err);
                alert('エラーが発生しました。');
            }).finally(() => {
                downloadBtn.textContent = '依頼書を画像として保存';
                downloadBtn.disabled = false;
            });
        });
    }

    // --- 押しピン機能 ---
    const pinToggle = document.getElementById('pin-toggle');
    const pinImage = document.getElementById('pin-image');
    const pinDirectionRadios = document.querySelectorAll('input[name="pin-direction"]');
    const pinDirectionGroup = document.getElementById('pin-direction-group');

    const updatePin = () => {
        if (!pinImage || !pinToggle) return;
        pinImage.style.display = pinToggle.checked ? 'block' : 'none';
        
        const selectedDirection = document.querySelector('input[name="pin-direction"]:checked').value;
        pinImage.src = `img/pin_${selectedDirection}.png`;
    };

    const togglePinDirectionUI = () => {
        if (!pinDirectionGroup || !pinToggle) return;
        if (pinToggle.checked) {
            pinDirectionGroup.classList.add('visible');
        } else {
            pinDirectionGroup.classList.remove('visible');
        }
    };

    if (pinToggle) {
        pinToggle.addEventListener('input', () => {
            updatePin();
            togglePinDirectionUI();
        });
    }
    pinDirectionRadios.forEach(radio => {
        radio.addEventListener('change', updatePin);
    });

    // ドラッグ＆ドロップ機能
    let isDragging = false;
    let offsetX, offsetY;

    const startDrag = (e) => {
        // デフォルトのドラッグ動作を防止
        e.preventDefault();

        isDragging = true;
        pinImage.classList.add('dragging');
        
        // マウスイベントとタッチイベントの座標取得を共通化
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;

        offsetX = clientX - pinImage.getBoundingClientRect().left;
        offsetY = clientY - pinImage.getBoundingClientRect().top;
    };

    const doDrag = (e) => {
        if (!isDragging) return;
        e.preventDefault(); // スクロールなどを防ぐ

        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;

        const previewAreaRect = previewArea.getBoundingClientRect();
        
        let x = clientX - previewAreaRect.left - offsetX;
        let y = clientY - previewAreaRect.top - offsetY;

        // プレビューエリア内に収める
        x = Math.max(0, Math.min(x, previewAreaRect.width - pinImage.width));
        y = Math.max(0, Math.min(y, previewAreaRect.height - pinImage.height));

        pinImage.style.left = `${x}px`;
        pinImage.style.top = `${y}px`;
    };

    const stopDrag = () => {
        isDragging = false;
        pinImage.classList.remove('dragging');
    };

    if (pinImage) {
        pinImage.addEventListener('mousedown', startDrag);
        // タッチイベントにも対応
        pinImage.addEventListener('touchstart', startDrag);
    }

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('touchmove', doDrag, { passive: false });

    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);

    // 初期表示
    updatePin();
    togglePinDirectionUI(); // 初期表示時にも実行
    
});
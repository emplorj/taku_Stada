document.addEventListener('DOMContentLoaded', () => {

    // --- DOM要素の取得 ---
    const titleInput = document.getElementById('title-input');
    const levelInput = document.getElementById('level-input');
    const contentInput = document.getElementById('content-input');
    const rewardInput = document.getElementById('reward-input');
    const requesterInput = document.getElementById('requester-input');

    const titleDisplay = document.getElementById('title-display');
    const levelDisplay = document.getElementById('level-display');
    const contentDisplay = document.getElementById('content-display');
    const rewardDisplay = document.getElementById('reward-display');
    const requesterDisplay = document.getElementById('requester-display');
    const rewardValueDisplay = document.querySelector('#reward-display .value');
    const requesterValueDisplay = document.querySelector('#requester-display .value');
    
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

    const updateAll = () => {
        // 画面幅に応じて基準フォントサイズを切り替え
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const titleMaxFontSize = isMobile ? 52 : 72;
        const sectionMaxFontSize = isMobile ? 32 : 42;

        if (titleInput) titleDisplay.innerText = titleInput.value;
        if (levelInput) levelDisplay.innerText = levelInput.value;
        if (contentInput) contentDisplay.innerHTML = contentInput.value.replace(/\n/g, '<br>');
        if (rewardInput) rewardValueDisplay.innerText = rewardInput.value;
        if (requesterInput) requesterValueDisplay.innerText = requesterInput.value;

        adjustTitleFontSize(titleMaxFontSize);
        adjustSyncedFontSize(sectionMaxFontSize);
    };

    // --- イベントリスナーの設定 (一度だけ登録) ---
    
    [titleInput, levelInput, contentInput, rewardInput, requesterInput].forEach(input => {
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
    const previewArea = document.getElementById('preview-area');
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
});
document.addEventListener('DOMContentLoaded', () => {
    const diceContainers = document.querySelectorAll('.dice-roll-container');
    if (diceContainers.length === 0) return;

    diceContainers.forEach(container => {
        const button = container.querySelector('.dice-roll-button');
        const resultContainer = container.querySelector('.dice-roll-result');
        
        let items;
        // data-items属性からJSONデータを読み込む
        if (container.dataset.items) {
            try {
                items = JSON.parse(container.dataset.items);
            } catch (e) {
                console.error('Invalid JSON in data-items attribute:', e);
                resultContainer.innerHTML = '<p style="color: #ff4d4d;">アイテムデータの読み込みに失敗しました。</p>';
                return; // このコンテナの処理を中断
            }
        } else {
            console.error('data-items attribute not found.');
            resultContainer.innerHTML = '<p style="color: #ff4d4d;">アイテムデータが見つかりません。</p>';
            return; // このコンテナの処理を中断
        }

        button.addEventListener('click', () => {
            if (button.disabled) return;

            button.disabled = true;
            resultContainer.innerHTML = '<div class="drum-roll"></div>'; // ドラムロール開始

            let drumRollInterval = setInterval(() => {
                const d1 = Math.floor(Math.random() * 6) + 1;
                const d2 = Math.floor(Math.random() * 6) + 1;
                const key = d1 <= d2 ? `${d1}${d2}` : `${d2}${d1}`;
                const item = items[key];
                if (item) {
                    resultContainer.innerHTML = `<div class="drum-roll-item">${item.name}</div>`;
                }
            }, 80);

            setTimeout(() => {
                clearInterval(drumRollInterval);

                const die1 = Math.floor(Math.random() * 6) + 1;
                const die2 = Math.floor(Math.random() * 6) + 1;
                const combination = die1 <= die2 ? `${die1}${die2}` : `${die2}${die1}`;
                const resultItem = items[combination];

                let resultHtml = '';
                if (resultItem) {
                    resultHtml = `
                        <div class="dice-result-grid">
                            <div class="dice-result-combination">${combination}</div>
                            <div class="dice-result-name">${resultItem.name}</div>
                            <div class="dice-result-price">${resultItem.price} G</div>
                        </div>
                    `;
                } else {
                    resultHtml = '<p>エラー：結果が見つかりません。</p>';
                }

                resultContainer.innerHTML = resultHtml;
                resultContainer.classList.add('is-selected');
                resultContainer.addEventListener('animationend', () => {
                    resultContainer.classList.remove('is-selected');
                }, { once: true });

                button.disabled = false;
            }, 2000);
        });
    });
});
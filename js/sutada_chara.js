// js/sutada_chara.js

document.addEventListener('DOMContentLoaded', async function() {
    // 各スライドショーの情報を定義
    const slideshowConfigs = [
        { title: "クトゥルフ神話TRPGの卓スタダのキャラたち", bgColorClass: "bg-coc" },
        { title: "ソード・ワールド2.5の卓スタダのキャラたち", bgColorClass: "bg-sw" },
        { title: "ダブルクロス The 3rd Editionの卓スタダのキャラたち", bgColorClass: "bg-dx" },
        { title: "永い後日談のネクロニカの卓スタダのキャラたち", bgColorClass: "bg-nc" },
        { title: "クトゥルフ神話TRPGの卓スタダ-miniのキャラたち", bgColorClass: "bg-coc-mini" }
    ];

    // 各スライドショーに対応するまとめ画像の情報を定義
    const summaryImageMap = {
        0: { path: "img/sutada_display/CoC_no.png", title: "CoCキャラクターまとめ" },
        1: { path: "img/sutada_display/SW_no.png", title: "SWキャラクターまとめ" },
        2: { path: "img/sutada_display/DX_no.png", title: "DXキャラクターまとめ" },
        3: { path: "img/sutada_display/NC_no.png", title: "NCキャラクターまとめ" },
        4: { path: "img/sutada_display/CoCmini_no.png", title: "miniCoCキャラクターまとめ" } // miniCoCにはCoCのまとめ画像を仮で設定
    };

    const slideshowsContainer = document.getElementById('slideshows-container');
    if (!slideshowsContainer) return;

    // 各設定に基づいてスライドショーを生成
    for (const [index, config] of slideshowConfigs.entries()) {
        const imagePaths = await getImagePaths(index); 
        if (imagePaths.length > 0) {
            const slideshowHtml = generateSlideshowHtml(config, imagePaths, index);
            slideshowsContainer.innerHTML += slideshowHtml;

            // まとめ画像を追加
            const summaryInfo = summaryImageMap[index];
            if (summaryInfo) {
                const summaryHtml = generateSummaryHtml(summaryInfo.path, summaryInfo.title);
                slideshowsContainer.innerHTML += summaryHtml;
            }
        }
    }

    // 全集合画像を一番下に追加
    const allCharactersHtml = `
        <div class="character-summary-images all-characters">

            <h3 class="section-title start-title">卓スタダ全集合！</h3>
            <img src="img/sutada_display/色相環+NC.png" alt="全キャラクター集合">

            <h3 class="section-title start-title">卓スタダ-mini全集合！</h3>
            ちょっとまってね

        </div>
    `;
    slideshowsContainer.innerHTML += allCharactersHtml;

    // すべてのHTMLが挿入された後にSwiperを初期化
    slideshowConfigs.forEach((config, index) => {
        const slideshowId = `.swiper-container-${index}`;
        if (document.querySelector(slideshowId)) {
            
            // ▼▼▼ Swiperの初期化設定をここに集約 ▼▼▼
            new Swiper(slideshowId, {
                // --- 基本設定 ---
                loop: true, // ループさせる
                slidesPerView: 3, // スライドの幅を自動調整
                slidesPerGroup: 3, // スライドのグループ数
                spaceBetween: 1, // スライド間の余白

                // --- 速度・アニメーション設定 ---
                speed: 4000, // アニメーション速度（ミリ秒）。数値を小さくすると速くなります。
                
                // --- 自動再生とインタラクション（ここが重要） ---
                autoplay: {
                    delay: 0, // 停止しない連続的な動きにするための設定
                    disableOnInteraction: false, // ユーザーがドラッグ操作などをした後に、自動再生を再開する
                    pauseOnMouseEnter: true, // マウスカーソルが乗ったら自動再生を停止する
                    reverseDirection: index % 2 !== 0, // 逆再生の切り替え
                },

                // --- ユーザー操作 ---
                allowTouchMove: true, // マウスやタッチでのドラッグ操作を許可する（デフォルトはtrue）
                freeMode: false // freeModeはOFFにするのがポイント
            });
            // ▲▲▲ Swiperの初期化設定 ▲▲▲
        }
    });

    // トップへ戻るボタンのロジック
    const backToTopBtn = document.getElementById("backToTopBtn");
    if(backToTopBtn) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.onscroll = () => {
                if (mainContent.scrollTop > 20) {
                    backToTopBtn.classList.add('show');
                } else {
                    backToTopBtn.classList.remove('show');
                };
            };
        }
        backToTopBtn.onclick = () => {
            if(mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        };
    }
    
    // モーダル関連の要素を取得
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeButton = document.querySelector('.close-button');

    // 閉じるボタンをクリックしたときにモーダルを閉じる
    if (closeButton) {
        closeButton.onclick = function() {
            modal.style.display = 'none';
        }
    }

    // モーダルの外側をクリックしたときにモーダルを閉じる
    if (modal) {
        modal.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        }
    }
});


// スライドショーのHTMLを生成する関数
function generateSlideshowHtml(config, imagePaths, index) {
    const slideshowId = `swiper-container-${index}`;
    const slides = [...imagePaths, ...imagePaths, ...imagePaths].map(path => `
        <div class="swiper-slide">
            <img src="${path}" alt="Character Image" loading="lazy" onclick="openModal(this.src)">
        </div>
    `).join('');

    return `
        <div class="slideshow-wrapper" data-index="${index}">
            <h3 class="section-title start-title ${config.bgColorClass}">${config.title}</h3>
            <div class="swiper ${slideshowId}">
                <div class="swiper-wrapper">
                    ${slides}
                </div>
            </div>
        </div>
    `;
}

// まとめ画像のHTMLを生成する関数
function generateSummaryHtml(imagePath, title) {
    return `
        <details class="summary-image-details">
            <summary>${title}を表示</summary>
            <div class="summary-image-content">
                <img src="${imagePath}" alt="${title}">
            </div>
        </details>
    `;
}

// サーバーサイドAPIがない場合のフォールバック関数
async function getImagePaths(index) {
    const basePath = "img/sutada_display/";
    const gameFolders = ["スタダCoC紹介/", "スタダSW紹介/", "スタダDX紹介/", "スタダNC紹介/", "スタダminiCoC紹介/"];
    const allImageData = [
        [ /* CoC */
            "A1_takayuki.png", "A2_miotsukusi.png", "A3_poriko.png", "A4_mochitani.png", "A5_nakoji.png",
            "B1_nagisa.png", "B2_hiruta.png", "B3_junya.png", "B4_sam.png", "B5_himari.png",
            "C1_suekane.png", "C2_jojo.png", "C3_nanma.png", "C4_daam.png", "C5_yura.png",
            "D1_aoyagi.png", "D2_obunai.png", "D3_ninomine.png", "D4_miyata.png", "D5_kensyou.png",
            "E1_donald.png", "E2_evan.png", "E3_ootani.png", "E4_sara.png", "E5_sawatada.png",
            "F1.png", "F2.png", "F3.png", "F4.png", "F5.png", "Z.png"
        ],
        [ /* SW */
            "A1.png", "A2.png", "A3.png", "A4.png", "A5.png",
            "B1_peddy.png", "B2_heron.png", "B3_shena.png", "B4_fauna.png", "B5_anre.png",
            "C1_cilovel.png", "C2_fusinsha.png", "C3_yanya.png", "C4_raune.png", "C5_dovem.png", "C6_rose.png",
            "D1_kale.png", "D2_niine.png", "D3_hanna.png", "D4_Liselotte.png", "D5_agapanthus.png",
            "E1.png", "E2.png", "E3.png", "E4.png", "E5.png",
            "F1.png", "F2.png", "F3.png", "F4.png", "F5.png",
            "G1.png", "G2.png", "G3.png", "G4.png", "G5.png", "G6.png"
        ],
        [ /* DX */
            "A1.png", "A2.png", "A3.png", "A4.png", "A5.png",
            "B1.png", "B2.png", "B3.png", "B4.png", "B5.png",
            "C1.png", "C2.png", "C4.png", "C5.png",
            "D1.png", "D2.png", "D4.png", "D5.png",
            "E1.png", "E2.png", "E3.png", "E4.png", "E5.png",
            "F1.png", "F2.png", "F4.png", "F5.gif",
            "G1.png", "G2.png", "G3.png", "G5.png"
        ],
        [ /* NC */
            "1-1.png", "1-2.png", "1-3.png", "1-4.png",
            "2-1.png", "2-2.png", "2-3.png", "2-4.png",
            "3-1.png", "3-2.png", "3-3.png", "3-4.png",
            "4-1.png", "4-2.png", "4-4.png",
            "5-1.png", "5-2.png", "5-3.png", "5-4.png",
            "6-1.png", "6-2.png", "6-3.png", "6-4.png",
            "7-1.png", "7-2.png", "7-3.png", "7-4.png",
            "8-1.png", "8-2.png", "8-3.png", "8-4.png"
        ],
        [ /* miniCoC */
            "miniA-1.png", "miniA-2.png", "miniA-3.png", "miniA-5.png", "miniA-6.png",
            "miniB-1.png", "miniB-2.png", "miniB-3.png", "miniB-5.png",
            "miniC-1.png", "miniC-2.png", "miniC-3.png", "miniC-4.png", "miniC-5.png",
            "miniD-1.png", "miniD-2.png", "miniD-3.png", "miniD-4.png", "miniD-5.png",
            "miniE-1.png", "miniE-2.png", "miniE-3.png", "miniE-4.png", "miniE-5.png",
            "miniF-1.png", "miniF-2.png", "miniF-3.png", "miniF-4.png", "miniF-5.png"
        ]
    ];

    const imageList = allImageData[index] || [];
    const folder = gameFolders[index] || "";
    return imageList.map(file => basePath + folder + file);
}

// 画像をクリックしたときにモーダルを開く関数
function openModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    modal.style.display = 'flex'; // flexboxで中央揃え
    modalImage.src = imageSrc;
}
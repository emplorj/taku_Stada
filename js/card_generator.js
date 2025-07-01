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
    const openDbModalBtn = document.getElementById('open-db-modal-btn');
    const dbModalOverlay = document.getElementById('db-modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const dbEntryForm = document.getElementById('db-entry-form');
    const tabDatabase = document.getElementById('tab-database');
    const cardListContainer = document.getElementById('card-list-container');

    // ★★★ GASのURLを格納する変数を定義 ★★★
    const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx6PxxRBPusXzft_gTw4wvUaFlQNbbNYqVjhWjRRiU3CoqsLgetZtv5y-8lmUyfBWqoxA/exec';

    // 状態管理
    let isDragging = false,
        startX, startY;
    let batchData = [];
    let localImageFiles = {};
    let imageState = {
        x: 0,
        y: 0,
        scale: 1
    };
    let colorNameToIdMap = {};
    let imageFitDirection;
    let overlayImageState = {
        x: 0,
        y: 0,
        scale: 1
    };
    let overlayImageFitDirection;
    let activeManipulationTarget = 'base'; // 'base' または 'overlay'

    const cardColorData = {
        "赤": {
            name: "赤",
            description: "BAD EVENT",
            color: "#990000",
            hover: "#7a0000",
            textColor: "#FFFFFF"
        },
        "青": {
            name: "青",
            description: "GOOD EVENT",
            color: "#3366CC",
            hover: "#2851a3",
            textColor: "#FFFFFF"
        },
        "緑": {
            name: "緑",
            description: "取得可能",
            color: "#009933",
            hover: "#007a29",
            textColor: "#FFFFFF"
        },
        "黄": {
            name: "黄",
            description: "金銭、トレジャー",
            color: "#FFCC66",
            hover: "#d9ad52",
            textColor: "#2c3e50"
        },
        "橙": {
            name: "橙",
            description: "その他",
            color: "#996633",
            hover: "#7a5229",
            textColor: "#FFFFFF"
        },
        "紫": {
            name: "紫",
            description: "エネミー等",
            color: "#663366",
            hover: "#522952",
            textColor: "#FFFFFF"
        },
        "白": {
            name: "白",
            description: "RPで切り抜ける",
            color: "#CCCCCC",
            hover: "#a3a3a3",
            textColor: "#2c3e50"
        },
        "黒": {
            name: "黒",
            description: "フィールド",
            color: "#333333",
            hover: "#1a1a1a",
            textColor: "#FFFFFF"
        },
        "虹": {
            name: "虹",
            description: "合体/激ヤバ",
            color: 'linear-gradient(45deg, #e74c3c, #f1c40f, #2ecc71, #3498db, #9b59b6)',
            hover: 'linear-gradient(45deg, #c0392b, #e67e22, #27ae60, #2980b9, #8e44ad)',
            textColor: "#FFFFFF"
        }
    };
    const cardTypes = {
        "": {
            name: "標準"
        },
        "CF": {
            name: "タイトル枠なし"
        },
        "FF": {
            name: "フルフレーム"
        },
        "FFCF": {
            name: "フルフレーム(タイトル枠なし)"
        }
    };

    // ★★★ ImgBBで取得した、あなたのAPIキーをここに貼り付け ★★★
    const IMGBB_API_KEY = '906b0e42b775a8ba283f16cd35fb667f';

    // ウィンドウサイズに応じて一括生成セクションの開閉を制御する関数を新しく作成
    function handleBatchSectionCollapse() {
        if (!batchDetails) return;

        // 画面幅がPCのブレークポイント（1361px）より大きいかどうか
        const isDesktop = window.innerWidth >= 1361;

        // PCの場合は常に開く、それ以外（スマホ・タブレット）はユーザーの状態に任せる
        if (isDesktop) {
            batchDetails.open = true;
        }
        // スマホ表示の際に強制的に閉じたい場合は、以下のelseを追加
        else {
            batchDetails.open = false;
        }
    }

    function parseDatabaseCsv(csvText) {
        const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
        if (lines.length < 1) return [];
        
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i]) continue;
            
            // カンマ区切りで単純に分割するのではなく、引用符を考慮する
            const values = [];
            let inQuotes = false;
            let currentField = '';
            for (const char of lines[i]) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentField.trim());
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
            values.push(currentField.trim());

            const entry = {};
            headers.forEach((header, index) => {
                entry[header] = values[index] || '';
            });
            data.push(entry);
        }
        return data.reverse(); // 新しいものが上にくるように逆順にする
    }

    function handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const cardId = urlParams.get('id');
        if (cardId) {
            loadCardForEditing(cardId);
        }
    }

    async function loadCardForEditing(cardId) {
        // ジェネレータータブを表示
        document.getElementById('tab-generator').checked = true;
        const dbContent = document.getElementById('database-content');
        if(dbContent) dbContent.innerHTML = '<p>カードを編集中です...</p>';


        const SPREADSHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQXTIYBURfIYxyLgGle8sAnRMfpM9fitcL6zkchi2gblxxD65-DxOWVMm830Ogl-HQjZgQtWLaRMfwo/pub?gid=1713292859&single=true&output=csv';

        try {
            const response = await fetch(SPREADSHEET_CSV_URL, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`データベースの読み込みに失敗しました: HTTP ${response.status}`);
            }
            const csvText = await response.text();
            const cards = parseDatabaseCsv(csvText); // 逆順になっている前提

            const cardToEdit = cards.find(card => card['ID'] === cardId);

            if (!cardToEdit) {
                throw new Error(`指定されたIDのカードが見つかりません: ${cardId}`);
            }

            // フォームに値を設定
            cardNameInput.value = cardToEdit['カード名'] || '';
            cardColorSelect.value = cardToEdit['色'] || '青';
            cardTypeSelect.value = cardToEdit['タイプ'] || '';
            effectInput.value = cardToEdit['効果説明'] || '';
            flavorInput.value = cardToEdit['フレーバー'] || '';
            flavorSpeakerInput.value = cardToEdit['フレーバー名'] || '';
            
            // モーダル内の情報も設定
            document.getElementById('registrant-input').value = cardToEdit['登録者'] || '';
            document.getElementById('artist-input').value = cardToEdit['絵師'] || '';
            document.getElementById('source-input').value = cardToEdit['元ネタ'] || '';
            document.getElementById('notes-input').value = cardToEdit['備考'] || '';

            // 画像の処理
            const imageUrl = cardToEdit['画像URL'];
            if (imageUrl && imageUrl !== 'DEFAULT') {
                if (imageUrl.includes('drive.google.com')) {
                    alert('Google Drive上の画像は、セキュリティの都合で直接編集画面に読み込めません。\nお手数ですが、再度画像を選択し直してください。');
                    resetImage();
                } else {
                    cardImage.crossOrigin = "Anonymous";
                    cardImage.src = imageUrl;
                    imageFileName.textContent = '読み込み中...';
                    cardImage.onload = () => {
                        imageFileName.textContent = cardToEdit['カード名'] || '画像';
                        setupImageForDrag();
                        updatePreview();
                    };
                    cardImage.onerror = () => {
                        cardImage.src = 'Card_asset/image_load_error.png';
                        imageFileName.textContent = '画像読込エラー';
                        setupImageForDrag();
                        updatePreview();
                    };
                }
            } else {
                resetImage();
            }

            updatePreview();

        } catch (error) {
            console.error('編集用カードの読み込みエラー:', error);
            alert(`カード情報の読み込みに失敗しました。\n${error.message}`);
        }
    }

    function scalePreview() {
        if (!previewWrapper || !previewPanel) return;

        const baseWidth = 480;
        const containerWidth = previewWrapper.offsetWidth;

        if (containerWidth < baseWidth) {
            const scale = containerWidth / baseWidth;
            previewPanel.style.transform = `scale(${scale})`;
        } else {
            previewPanel.style.transform = 'none';
        }
    }


    function initialize() {
        Object.entries(cardColorData).forEach(([id, details]) => {
            cardColorSelect.add(new Option(`${details.name}：${details.description}`, id));
            colorNameToIdMap[id] = id; // "赤カード" -> "赤カード"
            colorNameToIdMap[details.name] = id; // "赤" -> "赤カード"
        });
        Object.entries(cardTypes).forEach(([key, details]) => cardTypeSelect.add(new Option(details.name, key)));
        cardColorSelect.value = "青";
        cardTypeSelect.value = "";
        ['change', 'input'].forEach(event => {
            [cardColorSelect, cardTypeSelect, backgroundSelect, cardNameInput, effectInput, flavorInput, flavorSpeakerInput]
            .forEach(el => el.addEventListener(event, updatePreview, {
                passive: true
            }));
        });
        imageUpload.addEventListener('change', handleImageUpload);
        resetImageBtn.addEventListener('click', resetImage);
        overlayImageUpload.addEventListener('change', handleOverlayImageUpload);
        resetOverlayImageBtn.addEventListener('click', resetOverlayImage);
        resetImagePositionBtn.addEventListener('click', () => {
            if (cardImage.src) setupImageForDrag();
        });
        resetOverlayPositionBtn.addEventListener('click', () => {
            if (overlayImage.src) setupOverlayImageForDrag();
        });

        editModeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                activeManipulationTarget = e.target.value;
            });
        });
        previewArea.addEventListener('mousedown', startDrag);
        previewArea.addEventListener('touchstart', startDrag, {
            passive: false
        });
        previewArea.addEventListener('wheel', handleZoom, {
            passive: false
        });
        downloadBtn.addEventListener('click', () => downloadCard(false));
        downloadTemplateBtn.addEventListener('click', () => downloadCard(true));
        batchFileUpload.addEventListener('change', handleBatchFileUpload);
        imageFolderUpload.addEventListener('change', handleImageFolderUpload);
        batchDownloadBtn.addEventListener('click', processBatchDownload);
        sparkleCheckbox.addEventListener('change', () => {
            sparkleOverlayImage.style.display = sparkleCheckbox.checked ? 'block' : 'none';
            if (sparkleCheckbox.checked) {
                if (highResCheckbox.checked) {
                    highResCheckbox.checked = false;
                }
                highResCheckbox.disabled = true;
                highResCheckbox.parentElement.style.opacity = '0.5';
            } else {
                highResCheckbox.disabled = false;
                highResCheckbox.parentElement.style.opacity = '1';
            }
        });
        document.getElementById('background-select-group').style.display = 'none';
        updatePreview();
        resetImage();
        window.addEventListener('resize', scalePreview);
        scalePreview();
        handleBatchSectionCollapse();
        window.addEventListener('resize', handleBatchSectionCollapse);
        openDbModalBtn.addEventListener('click', () => {
            dbModalOverlay.classList.add('is-visible');
        });

        // モーダルの閉じるボタンが押されたら閉じる
        modalCloseBtn.addEventListener('click', () => {
            dbModalOverlay.classList.remove('is-visible');
        });

        // 背景オーバーレイがクリックされたら閉じる
        dbModalOverlay.addEventListener('click', (e) => {
            if (e.target === dbModalOverlay) {
                dbModalOverlay.classList.remove('is-visible');
            }
        });
        // モーダル内の「この内容で登録する」ボタンが押された時の処理
    dbEntryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = dbEntryForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = '処理を開始...';

    try {
        let imageUrl = '';

        const isDefaultImage = cardImage.src.includes('now_painting');

        if (isDefaultImage) {
            imageUrl = 'DEFAULT';
        } else {
            const currentCardType = (cardTypeSelect.value || '').toUpperCase();
            submitButton.textContent = '画像切り出し中...';
            const artworkBlob = await generateArtworkBlob(currentCardType);
            
            // ★★★ ここで、アップロード用のファイル名を生成 ★★★
            const now = new Date();
            const yy = now.getFullYear().toString().slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const uploadFileName = `${yy}-${mm}-${dd}`;
            
            submitButton.textContent = '画像アップロード中...';
            // ★★★ 生成したファイル名を関数に渡す ★★★
            imageUrl = await uploadToImgBB(artworkBlob, uploadFileName);
        }
        
        const cardData = {
            ID: `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(new Date().getHours()).padStart(2, '0')}${String(new Date().getMinutes()).padStart(2, '0')}${String(new Date().getSeconds()).padStart(2, '0')}`,
            name: cardNameInput.value,
            color: cardColorSelect.value,
            type: cardTypeSelect.value,
            effect: effectInput.value,
            flavor: flavorInput.value,
            speaker: flavorSpeakerInput.value,
            imageUrl: imageUrl,
            registrant: document.getElementById('registrant-input').value,
            artist: document.getElementById('artist-input').value,
            source: document.getElementById('source-input').value,
            notes: document.getElementById('notes-input').value
        };

        submitButton.textContent = 'DBに登録中...';
        await saveCardToDatabase(cardData);
        
        alert(`ID: ${cardData.ID} でデータベースに登録しました！`);
        dbModalOverlay.classList.remove('is-visible');

    } catch (err) {
        console.error('登録処理中にエラーが発生しました:', err);
        alert('登録に失敗しました:\n\n' + err.message);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
});
    }

    // ★★★ ここに、先ほどカットした関数を貼り付けます ★★★
    // ↓↓↓↓↓↓
function saveCardToDatabase(cardData) {
  return new Promise(async (resolve, reject) => {
    // GASのURLが設定されていなければエラー
    if (GAS_WEB_APP_URL.includes('xxxxxxxxxx')) {
      alert('GASのURLが設定されていません。card_generator.jsを修正してください。');
      return reject(new Error('GAS URL is not configured.'));
    }
    
    console.log('データベースに保存します:', cardData);

    try {
      // ★★★ お手本(q_and_a.js)と同じ、最もシンプルな送信方法 ★★★
      const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', // CORSを回避
        body: JSON.stringify(cardData) // 送信するデータ
        // headers は指定しない！
      });
      
      console.log('GASへのリクエストは正常に送信されました。');
      resolve({ status: 'success', message: 'Request sent successfully.' });

    } catch (error) {
      console.error('データベースへの保存中にエラーが発生しました:', error);
      reject(error);
    }
  });
}

/**
 * カードの「アートワーク部分」だけを抽出し、画像データ(Blob)を生成する関数。(最終確定版)
 * カードタイプに応じて、480x720 または 480x480 にトリミングする。
 * @param {string} cardType - カードのタイプ ('FF', 'CF', 'FFCF', or '')
 * @returns {Promise<Blob>} アートワーク部分の画像Blob
 */
async function generateArtworkBlob(cardType) {
  console.log(`アートワーク部分の切り出しを開始します。タイプ: ${cardType || '標準'}`);

  const elementsToModify = [
    document.getElementById('card-template-image'),
    document.getElementById('card-name-container'),
    document.getElementById('text-box-container'),
    document.getElementById('sparkle-overlay-image')
  ];

  // ★★★ 1. 各要素の元のdisplayスタイルを記憶するための配列 ★★★
  const originalStyles = [];

  try {
    // ★★★ 2. 記憶してから、非表示にする ★★★
    elementsToModify.forEach(el => {
      if (el) {
        // 元のスタイルを記憶
        originalStyles.push({ element: el, originalDisplay: el.style.display });
        // その後で非表示にする
        el.style.display = 'none';
      }
    });

    // 画像化の処理（ここは変更なし）
    const fullCardCanvas = await html2canvas(cardContainer, { 
      backgroundColor: null, 
      useCORS: true 
    });

    const isFullFrame = cardType === 'FF' || cardType === 'FFCF';

    if (isFullFrame) {
      console.log('フルフレームのため、480x720の画像を生成します。');
      return await new Promise(resolve => fullCardCanvas.toBlob(resolve, 'image/png'));
    } else {
      console.log('標準/CFタイプのため、480x480に画像をクロップします。');
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = 480;
      croppedCanvas.height = 480;
      const ctx = croppedCanvas.getContext('2d');
      ctx.drawImage(fullCardCanvas, 0, 0, 480, 480, 0, 0, 480, 480);
      return await new Promise(resolve => croppedCanvas.toBlob(resolve, 'image/png'));
    }

  } finally {
    // ★★★ 3. 記憶しておいた元のスタイルに、正確に復元する ★★★
    originalStyles.forEach(item => {
      item.element.style.display = item.originalDisplay;
    });
    console.log('アートワークの切り出しが完了し、表示を元に戻しました。');
  }
}
    /**
     * 画像をImgBBに匿名でアップロードし、そのURLを返す関数 (ファイル名指定機能付き)
     * @param {Blob} imageBlob - アップロードする画像のBlobデータ
     * @param {string} [fileName] - (任意) ImgBBに設定するファイル名
     * @returns {Promise<string>} アップロードされた画像のURL
     */
    async function uploadToImgBB(imageBlob, fileName) {
    if (!IMGBB_API_KEY || IMGBB_API_KEY.includes('ここに')) {
        throw new Error('ImgBBのAPIキーが設定されていません。card_generator.jsを修正してください。');
    }

    const formData = new FormData();
    formData.append('image', imageBlob);

    // ★★★ ファイル名が指定されていれば、FormDataに追加 ★★★
    if (fileName) {
        formData.append('name', fileName);
    }

    console.log(`ImgBBへのアップロードを開始します... ファイル名: ${fileName || '(指定なし)'}`);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        let errorDetails = 'サーバーから詳細なエラーメッセージが返されませんでした。';
        try {
            const errorData = await response.json();
            errorDetails = errorData.error?.message || JSON.stringify(errorData);
        } catch (e) {
            errorDetails = await response.text();
        }
        console.error('ImgBB API Error:', errorDetails);
        throw new Error(`ImgBBへのアップロードに失敗しました (HTTP ${response.status}): ${errorDetails}`);
    }

    const result = await response.json();
    
    if (!result.success) {
        console.error('ImgBB APIがエラーを報告しました:', result.error.message);
        throw new Error(`ImgBB APIがエラーを報告しました: ${result.error.message}`);
    }

    console.log('ImgBBへのアップロードが成功しました。URL:', result.data.url);
    return result.data.url;
    }

    // ★★★↑↑↑↑↑ ここまでが移動してきた関数です ★★★
    function updatePreview() {
        const selectedColorId = cardColorSelect.value;
        // ★★★ toUpperCase() を使って、比較の信頼性を上げる ★★★
        const selectedType = (cardTypeSelect.value || '').toUpperCase();
        const colorDetails = cardColorData[selectedColorId];

        // --- まず、全ての特殊スタイルをリセット ---
        cardNameContent.classList.remove('title-styled');
        textBoxContainer.classList.remove('textbox-styled');
        cardNameContainer.style.backgroundImage = `url('Card_asset/タイトル.png')`;

        // --- フルフレームタイプの画像コンテナの高さを調整 ---
        imageContainer.style.transition = 'none';
        const isFullFrame = selectedType === 'FF' || selectedType === 'FFCF';
        imageContainer.style.height = isFullFrame ? '720px' : '480px';
        void imageContainer.offsetHeight;
        imageContainer.style.transition = '';

        // --- テンプレート画像のファイル名を決定 ---
        let templateName = `${selectedColorId}カード`;
        if (isFullFrame) {
            templateName += 'FF';
        }
        
        // ★★★ switch文を、より安全なif文に変更 ★★★
        if (selectedType === 'CF') {
            // 【文字枠なし】のみの場合
            cardNameContent.classList.add('title-styled');
            cardNameContainer.style.backgroundImage = 'none';
        } else if (selectedType === 'FF') {
            // 【フルフレーム】のみの場合
            textBoxContainer.classList.add('textbox-styled');
        } else if (selectedType === 'FFCF') {
            // 【両方】の場合
            cardNameContent.classList.add('title-styled');
            textBoxContainer.classList.add('textbox-styled');
            cardNameContainer.style.backgroundImage = 'none';
        }
        // 上記以外（標準タイプ）は何もしない

        // --- デフォルト画像の切り替え ---
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

        // --- 最終的な画像とテキストの更新 ---
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
    // 1. これまでのHTML生成ロジックは、そのまま使用します。
    const segments = text.split('`');
    const htmlParts = segments.map((segment, index) => {
        if (index % 2 === 1) {
            const rubyMatch = segment.match(/(.+?)\((.+)\)/);
            if (rubyMatch) {
                const baseText = rubyMatch[1];
                const rubyText = rubyMatch[2];
                return `<ruby><rb>${baseText}</rb><rt>${rubyText}</rt></ruby>`;
            }
        }
        const escapedSegment = segment.replace(/</g, '<').replace(/>/g, '>');
        return `<span class="no-ruby">${escapedSegment}</span>`;
    });
    const finalHtml = htmlParts.join('\u200B');

    // ★★★ ここからが新しいアーキテクチャです ★★★
    // 2. 生成したHTMLを、伸縮専用の<span class="scaler">で囲み、状態管理クラスも適用します。
    const hasRuby = finalHtml.includes('<ruby>');
    const cardNameClass = hasRuby ? '' : 'is-plain-text-only';
    // 既存のクラス（例: title-styled）を保持しつつ、is-plain-text-onlyクラスを制御
    if (hasRuby) {
        cardNameContent.classList.remove('is-plain-text-only');
    } else {
        cardNameContent.classList.add('is-plain-text-only');
    }
    cardNameContent.innerHTML = `<span class="scaler">${finalHtml}</span>`;

    // 3. スケール計算を実行します。
    requestAnimationFrame(() => {
        const containerEl = cardNameContainer; // #card-name-container
        const contentEl = cardNameContent; // #card-name-content
        const scalerEl = contentEl.querySelector('.scaler'); // .scaler

        if (!scalerEl) return; // 安全装置
        const availableWidth = contentEl.clientWidth; // #card-name-contentの幅 (334px)
        const trueTextWidth = scalerEl.scrollWidth; // .scalerの本来の幅

        // CSSプロパティを直接操作するための変数
        let containerLeft = '50%';
        let containerTransformX = '-50%';
        let contentTextAlign = 'center';
        let scalerTransformOrigin = 'center';
        let rtLeft = '50%';
        let rtTransformX = 'calc(-50% + 1px)';
        let scalerTransform = 'none';

        // 中身の幅が、箱の幅を超えている場合のみ、縮小処理と左寄せを行います。
        if (trueTextWidth > availableWidth) {
            const scaleX = availableWidth / trueTextWidth;
            scalerTransform = `scaleX(${scaleX})`;

            // テキストが長くなった場合、左寄せに切り替える
            containerLeft = '44px'; // テキストボックスと同じ左端
            containerTransformX = '0';
            contentTextAlign = 'left';
            scalerTransformOrigin = 'left';
            rtLeft = '0';
            rtTransformX = '0';
        }

        // スタイルを適用
        containerEl.style.left = containerLeft;
        containerEl.style.transform = `translateX(${containerTransformX})`;
        contentEl.style.textAlign = contentTextAlign;
        scalerEl.style.transformOrigin = scalerTransformOrigin;
        scalerEl.style.transform = scalerTransform;

        // ルビのスタイルも動的に変更
        const rtElements = contentEl.querySelectorAll('rt');
        rtElements.forEach(rt => {
            rt.style.left = rtLeft;
            rt.style.transform = `translateX(${rtTransformX})`;
        });
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
                            backgroundSelect.value = 'hologram_geometric.png';
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

    function handleOverlayImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            overlayImageFileName.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                overlayImage.src = e.target.result;
                overlayImage.style.display = 'block';
                overlayImage.onload = () => {
                    setupOverlayImageForDrag();
                };
            };
            reader.readAsDataURL(file);
        }
    }

    function resetOverlayImage() {
        overlayImage.src = '';
        overlayImage.style.display = 'none';
        overlayImageUpload.value = '';
        overlayImageFileName.textContent = '選択されていません';
        overlayImageState = {
            x: 0,
            y: 0,
            scale: 1
        };
    }

    function setupOverlayImageForDrag() {
        overlayImageState = {
            x: 0,
            y: 0,
            scale: 1
        };
        const containerWidth = overlayImageContainer.offsetWidth;
        const containerHeight = overlayImageContainer.offsetHeight;
        const imageWidth = overlayImage.naturalWidth;
        const imageHeight = overlayImage.naturalHeight;

        if (imageWidth === 0 || imageHeight === 0) return;

        const scaleToFitWidth = containerWidth / imageWidth;
        let newWidth = containerWidth;
        let newHeight = imageHeight * scaleToFitWidth;

        overlayImage.style.width = `${newWidth}px`;
        overlayImage.style.height = `${newHeight}px`;

        overlayImageState.x = 0;
        overlayImageState.y = (containerHeight - newHeight) / 2;
        updateImageTransform();
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
        imageState = {
            x: 0,
            y: 0,
            scale: 1
        };
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

    function updateImageTransform() {
        cardImage.style.transform = `translate(${imageState.x}px, ${imageState.y}px) scale(${imageState.scale})`;
        overlayImage.style.transform = `translate(${overlayImageState.x}px, ${overlayImageState.y}px) scale(${overlayImageState.scale})`;
    }

    function updateDraggableCursor() {
        const state = activeManipulationTarget === 'base' ? imageState : overlayImageState;
        const image = activeManipulationTarget === 'base' ? cardImage : overlayImage;
        const container = activeManipulationTarget === 'base' ? imageContainer : overlayImageContainer;
        const fitDirection = activeManipulationTarget === 'base' ? imageFitDirection : overlayImageFitDirection;

        if (!image.src) {
            previewArea.style.cursor = 'default';
            return;
        }

        const canDrag = (fitDirection === 'landscape' && image.offsetWidth * state.scale > container.offsetWidth + 0.1) ||
            (fitDirection === 'portrait' && image.offsetHeight * state.scale > container.offsetHeight + 0.1) ||
            state.scale > 1.01;

        previewArea.style.cursor = canDrag ? 'grab' : 'default';
    }

    function startDrag(e) {
        if (previewArea.style.cursor === 'default') return;
        e.preventDefault();
        isDragging = true;
        previewArea.style.cursor = 'grabbing';

        const state = activeManipulationTarget === 'base' ? imageState : overlayImageState;
        const touch = e.touches ? e.touches[0] : e;

        startX = touch.clientX - state.x;
        startY = touch.clientY - state.y;

        document.addEventListener('mousemove', dragImage);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', dragImage, {
            passive: false
        });
        document.addEventListener('touchend', stopDrag);
    }

    function dragImage(e) {
        if (!isDragging) return;
        const state = activeManipulationTarget === 'base' ? imageState : overlayImageState;
        const fitDirection = activeManipulationTarget === 'base' ? imageFitDirection : overlayImageFitDirection;

        const touch = e.touches ? e.touches[0] : e;
        if (fitDirection === 'landscape' || state.scale > 1) state.x = touch.clientX - startX;
        if (fitDirection === 'portrait' || state.scale > 1) state.y = touch.clientY - startY;

        clampImagePosition();
        updateImageTransform();
    }

    function stopDrag() {
        isDragging = false;
        updateDraggableCursor();
        document.removeEventListener('mousemove', dragImage);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchmove', dragImage);
        document.removeEventListener('touchend', stopDrag);
    }

    function handleZoom(e) {
        e.preventDefault();
        const state = activeManipulationTarget === 'base' ? imageState : overlayImageState;
        const container = activeManipulationTarget === 'base' ? imageContainer : overlayImageContainer;

        const scaleAmount = 0.1;
        const delta = e.deltaY > 0 ? -1 : 1;
        const oldScale = state.scale;

        state.scale = Math.max(1, Math.min(state.scale + delta * scaleAmount, 3));

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        state.x = mouseX - (mouseX - state.x) * (state.scale / oldScale);
        state.y = mouseY - (mouseY - state.y) * (state.scale / oldScale);

        clampImagePosition();
        updateImageTransform();
        updateDraggableCursor();
    }

    function clampImagePosition() {
        const clamp = (state, image, container) => {
            if (!image.src || !image.naturalWidth) return;

            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;
            const scaledWidth = image.offsetWidth * state.scale;
            const scaledHeight = image.offsetHeight * state.scale;

            if (scaledWidth >= containerWidth) {
                const min_x = containerWidth - scaledWidth;
                const max_x = 0;
                state.x = Math.max(min_x, Math.min(max_x, state.x));
            } else {
                const min_x = 0;
                const max_x = containerWidth - scaledWidth;
                state.x = Math.max(min_x, Math.min(max_x, state.x));
            }

            if (scaledHeight >= containerHeight) {
                const min_y = containerHeight - scaledHeight;
                const max_y = 0;
                state.y = Math.max(min_y, Math.min(max_y, state.y));
            } else {
                const min_y = 0;
                const max_y = containerHeight - scaledHeight;
                state.y = Math.max(min_y, Math.min(max_y, state.y));
            }
        };

        clamp(imageState, cardImage, imageContainer);
        clamp(overlayImageState, overlayImage, overlayImageContainer);
    }
function downloadCard(isTemplate = false) {
    if (!isTemplate && sparkleCheckbox.checked) {
        generateSparkleApng();
        return;
    }

    const button = isTemplate ? downloadTemplateBtn : downloadBtn;
    const originalButtonText = button.textContent;
    button.textContent = '生成中...';
    button.disabled = true;
    document.body.classList.add('is-rendering-output'); // 出力用CSSを有効化

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
                alert('エラーが発生しました。');
            }).finally(() => {
                document.body.classList.remove('is-rendering-output'); // 出力用CSSを無効化
                button.textContent = originalButtonText;
                button.disabled = false;
                previewPanel.style.transform = originalTransform;
                previewWrapper.style.height = originalWrapperHeight;
            });
        }, 100);
    });
}

    async function createSparkleApngBlob() {
        const baseImageElements = [backgroundImage, cardTemplateImage, imageContainer, overlayImageContainer];
        const textElements = [cardNameContainer, textBoxContainer];

        textElements.forEach(el => el.style.opacity = 0);
        sparkleOverlayImage.style.display = 'none';
        await new Promise(r => setTimeout(r, 100));
        const baseCanvas = await html2canvas(cardContainer, {
            backgroundColor: null,
            useCORS: true,
            scale: 1
        });

        textElements.forEach(el => el.style.opacity = 1);
        baseImageElements.forEach(el => el.style.opacity = 0);
        await new Promise(r => setTimeout(r, 100));

        const textCanvas = await html2canvas(cardContainer, {
            backgroundColor: null,
            useCORS: true,
            scale: 1
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
        const {
            width,
            height
        } = baseCanvas;

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
        const blob = new Blob([newApngBuffer], {
            type: 'image/png'
        });

        // 元の表示状態に戻す
        textElements.forEach(el => el.style.opacity = 1);
        baseImageElements.forEach(el => el.style.opacity = 1);
        sparkleOverlayImage.style.display = sparkleCheckbox.checked ? 'block' : 'none';

        return blob;
    }

    async function generateSparkleApng() {
        const button = downloadBtn;
        const originalButtonText = button.textContent;
        button.textContent = 'キラAPNGを生成中...';
        button.disabled = true;

        const originalTransform = previewPanel.style.transform;
        const originalWrapperHeight = previewWrapper.style.height;
        previewPanel.style.transform = 'none';
        previewWrapper.style.height = 'auto';

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
            button.textContent = originalButtonText;
            button.disabled = false;
            previewPanel.style.transform = originalTransform;
            previewWrapper.style.height = originalWrapperHeight;
        }
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function adjustHexColor(hex, amount) {
        if (!hex || !hex.startsWith('#')) return hex;
        let {
            r,
            g,
            b
        } = hexToRgb(hex);
        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));
        return rgbToHex(r, g, b);
    }

    function getLuminance(hex) {
        if (!hex || !hex.startsWith('#')) return 0;
        let {
            r,
            g,
            b
        } = hexToRgb(hex);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

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
                    batchData = rawData.map(item => {
                        // 背景記号の変換ロジックを追加
                        let backgroundValue = item.background || '';
                        if (backgroundValue === '◇') {
                            backgroundValue = 'hologram_geometric.png';
                        } else if (backgroundValue === '☆') {
                            backgroundValue = 'hologram_glitter.png';
                        }
                        return {
                            ...item,
                            background: backgroundValue
                        };
                    });
                } else if (file.name.endsWith('.csv')) {
                    rawData = parseCsv(content);
                    batchData = rawData.map(item => {
                        const colorName = item['色'] || '';
                        const cardId = colorNameToIdMap[colorName] || '青'; // デフォルト値を「青」に変更
                        const sparkleValue = (item['キラ'] || 'false').toLowerCase();

                        // 背景記号の変換ロジックを追加
                        let backgroundValue = item['背景'] || '';
                        if (backgroundValue === '◇') {
                            backgroundValue = 'hologram_geometric.png';
                        } else if (backgroundValue === '☆') {
                            backgroundValue = 'hologram_glitter.png';
                        }

                        return {
                            cardName: item['カード名'] || '',
                            effect: item['効果説明'] || '',
                            flavor: item['フレーバー'] || '',
                            speaker: item['フレーバー名'] || '',
                            color: cardId,
                            image: item['イラスト'] || '',
                            type: item['タイプ'] || '',
                            background: backgroundValue, // 変換後の値を設定
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
        cardColorSelect.value = data.color || '青'; // デフォルト値を「青」に変更
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
                        scale: scale
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
        zip.generateAsync({
            type: 'blob'
        }).then(content => {
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
                const ctx = canvas.getContext('2d', {
                    willReadFrequently: true
                });
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
                backgroundSelect.value = 'hologram_geometric.png';
            } else {
                backgroundGroup.style.display = 'none';
                backgroundSelect.value = '';
            }
            updatePreview();
        });
    }

    initialize();
    handleUrlParameters();
    
    let isDatabaseLoaded = false;

    tabDatabase.addEventListener('change', () => {
        const url = new URL(window.location);
        if (url.searchParams.has('id')) {
            url.searchParams.delete('id');
            window.history.pushState({}, '', url);
            // 履歴が更新されたので、リストを強制的に再読み込み
            isDatabaseLoaded = false;
            cardListContainer.innerHTML = '';
        }

        if (tabDatabase.checked) {
            // isDatabaseLoaded の状態に関わらず、タブがチェックされたらデータを取得
            console.log('データベースタブが選択されました。データを取得します。');
            fetchAllCards();
        }
    });

    async function fetchAllCards() {
        isDatabaseLoaded = true;
        cardListContainer.innerHTML = '<p>データベースを読み込んでいます...</p>';
        
        const SPREADSHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQXTIYBURfIYxyLgGle8sAnRMfpM9fitcL6zkchi2gblxxD65-DxOWVMm830Ogl-HQjZgQtWLaRMfwo/pub?gid=1713292859&single=true&output=csv';

        try {
            const response = await fetch(SPREADSHEET_CSV_URL, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`データベースの読み込みに失敗しました: HTTP ${response.status}`);
            }
            const csvText = await response.text();
            const cards = parseDatabaseCsv(csvText);
            renderCardList(cards);
            
        } catch (error) {
            console.error('データ取得エラー:', error);
            cardListContainer.innerHTML = `<p class="error">データの読み込みに失敗しました。<br>${error.message}</p>`;
        }
    }


    function renderCardList(cards) {
        cardListContainer.innerHTML = '';

        if (cards.length === 0) {
            cardListContainer.innerHTML = '<p>登録されているカードはまだありません。</p>';
            return;
        }

        for (const card of cards) {
            const cardElement = document.createElement('div');
            cardElement.className = 'db-card';

            let imageUrl = card['画像URL'];
            if (imageUrl === 'DEFAULT') {
                imageUrl = 'Card_asset/now_painting.png';
            } else if (imageUrl && (imageUrl.includes('drive.google.com/file/d/') || imageUrl.includes('docs.google.com/file/d/'))) {
                // Google DriveのURLをCORSプロキシ経由で読み込む
                const match = imageUrl.match(/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
                if (match && match[1]) {
                    const fileId = match[1];
                    const originalUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
                    imageUrl = `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`;
                }
            }

            cardElement.innerHTML = `
                <div class="db-card-image">
                    <img src="${imageUrl}" alt="${card['カード名']}" loading="lazy" crossorigin="anonymous" onerror="this.onerror=null;this.src='Card_asset/image_load_error.png'; console.error('画像読み込みエラー:', this.src);">
                </div>
                <div class="db-card-info">
                    <h3 class="db-card-name">${card['カード名']}</h3>
                    <p class="db-card-meta">PL: ${card['登録者'] || 'N/A'}</p>
                    <p class="db-card-meta">絵師: ${card['絵師'] || 'N/A'}</p>
                    <p class="db-card-id">ID: ${card['ID']}</p>
                </div>
                <div class="db-card-actions">
                    <a href="card_generator.html?id=${card['ID']}" class="secondary-button edit-btn">編集</a>
                    <button class="secondary-button delete-btn" data-id="${card['ID']}">削除</button>
                </div>
            `;
            
            cardListContainer.appendChild(cardElement);
        }
    }
});

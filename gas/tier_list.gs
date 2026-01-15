// ===== 設定項目 =====
const SHEET_NAME = "ルルブtier";

// 列番号を定数として定義 (A列=1, B列=2...)
const SYSTEM_COL = 1; // A列: system
const RANK_ORDER_COL = 2; // B列: rankOrder
const TITLE_COL = 3; // C列: title
const CATEGORY_COL = 4; // D列: category
const PRICE_COL = 5; // E列: price
const RELEASE_DATE_COL = 6; // F列: releaseDate
const IMAGE_URL_COL = 7; // G列: imageUrl
const OFFICIAL_INFO_COL = 8; // H列: official_info
const INFO_COL = 9; // I列: info (手動入力用)
const ABBREVIATION_COL = 10; // J列: abbreviation (手動入力用)
const BOOK_URL_COL = 11; // K列: bookUrl

// ===== ここから下は変更不要 =====

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Tierリスト管理")
    .addItem("【選択行】の情報を強制更新", "updateSelectedRows")
    .addSeparator()
    .addItem("【全行】の未入力情報を更新", "updateAllEmptyRows")
    .addToUi();
}

function updateSelectedRows() {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return;
  const range = sheet.getActiveRange();
  processRange(sheet, range, false);
}

function updateAllEmptyRows() {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const range = sheet.getRange(2, 1, lastRow - 1, BOOK_URL_COL);
  processRange(sheet, range, true);
}

function processRange(sheet, range, onlyUpdateEmpty) {
  const startRow = range.getRow();
  const numRows = range.getNumRows();
  const values = range.getValues();

  for (let i = 0; i < numRows; i++) {
    const currentRowValues = values[i];
    const bookUrl = currentRowValues[BOOK_URL_COL - 1];
    const titleValue = currentRowValues[TITLE_COL - 1];

    if (bookUrl && (!onlyUpdateEmpty || !titleValue)) {
      try {
        const bookData = fetchBookData(bookUrl);

        currentRowValues[TITLE_COL - 1] = bookData.title;
        currentRowValues[CATEGORY_COL - 1] = bookData.category;
        currentRowValues[PRICE_COL - 1] = bookData.price;
        currentRowValues[RELEASE_DATE_COL - 1] = bookData.releaseDate;
        currentRowValues[IMAGE_URL_COL - 1] = bookData.imageUrl;
        currentRowValues[OFFICIAL_INFO_COL - 1] = bookData.official_info;

        sheet
          .getRange(startRow + i, 1, 1, BOOK_URL_COL)
          .setValues([currentRowValues]);
        SpreadsheetApp.flush();
        Utilities.sleep(1500);
      } catch (e) {
        sheet
          .getRange(startRow + i, TITLE_COL)
          .setValue(`取得エラー: ${e.message}`);
      }
    }
  }
}

/**
 * URLを判別し、サイトに応じたデータ取得関数を呼び出す
 */
function fetchBookData(url) {
  const options = {
    muteHttpExceptions: true,
    headers: { "User-Agent": "Mozilla/5.0" },
  };
  const response = UrlFetchApp.fetch(url, options);

  if (response.getResponseCode() !== 200) {
    throw new Error(`HTTP ${response.getResponseCode()}`);
  }

  const html = response.getContentText();
  let rawData;

  if (url.includes("bookwalker.jp")) {
    rawData = fetchBookWalkerData(html);
  } else if (url.includes("amazon.co.jp")) {
    rawData = fetchAmazonData(html);
  } else {
    throw new Error("非対応のURLです(BookWalker/Amazonのみ)");
  }

  // ★★★ Amazon/BookWalker共通のタイトル・カテゴリ整形処理 ★★★
  return cleanUpTitleAndCategory(rawData);
}

/**
 * BookWalkerのHTMLからデータを抽出する
 */
function fetchBookWalkerData(html) {
  const titleMatch = html.match(
    /<h1 class="t-c-product-main-data__title">([\s\S]*?)<\/h1>/
  );
  const fullTitle = titleMatch
    ? titleMatch[1].trim().replace(/&/g, "&")
    : "（タイトル取得失敗）";

  const imageMatch = html.match(/<meta property="og:image" content="([^"]+)">/);
  const imageUrl = imageMatch ? imageMatch[1].trim() : "（画像URL取得失敗）";

  let price = "（価格取得失敗）";
  const priceMatch =
    html.match(/<span class="m-book-item__price-num">([\d,]+)<\/span>/) ||
    html.match(/<p class="t-c-sales-price__value">.*?([\d,]+)円/);
  if (priceMatch) {
    price = `${priceMatch[1]}円`;
  }

  const releaseDateMatch = html.match(
    /<dt>底本発行日<\/dt>\s*<dd>([^<]+)<\/dd>/
  );
  const releaseDate = releaseDateMatch
    ? releaseDateMatch[1].trim().replace(/\//g, "-")
    : "（発行日取得失敗）";

  let official_info = "（紹介文取得失敗）";
  const synopsisMatch = html.match(
    /<section class="t-c-product-synopsis-main">([\s\S]*?)<\/section>/
  );
  if (synopsisMatch) {
    const synopsisHtml = synopsisMatch[1];
    const paragraphs = synopsisHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/g) || [];
    official_info = paragraphs
      .map((p) =>
        p
          .replace(/<br\s*\/?>/g, "\n")
          .replace(/<[^>]+>/g, "")
          .trim()
      )
      .filter(
        (text) => text && !text.startsWith("(C)") && !text.startsWith("（C）")
      )
      .join("\n");
  }

  return {
    title: fullTitle, // 整形前のタイトルを渡す
    official_info: official_info,
    price: price,
    releaseDate: releaseDate,
    imageUrl: imageUrl,
  };
}

/**
 * AmazonのHTMLからデータを抽出する (2024年6月版)
 */
function fetchAmazonData(html) {
  // 1. タイトル
  const titleMatch = html.match(
    /<span id="productTitle"[^>]*>([\s\S]*?)<\/span>/
  );
  const title = titleMatch
    ? titleMatch[1].trim().replace(/&/g, "&")
    : "（タイトル取得失敗）";

  // 2. 書影URL (og:imageが最も安定的)
  const imageMatch = html.match(/<meta property="og:image" content="([^"]+)">/);
  const imageUrl = imageMatch ? imageMatch[1].trim() : "（画像URL取得失敗）";

  // 3. 価格 (複数のパターンに対応)
  let price = "（価格取得失敗）";
  const priceMatches = [
    html.match(/<span class="a-offscreen">\s*￥([\d,]+)\s*<\/span>/), // 標準的な価格表示
    html.match(/<span id="price"[^>]*>￥([\d,]+)<\/span>/),
    html.match(/"priceToPay"\s*:\s*{"price"\s*:\s*([\d,]+)/), // JSONデータ内の価格
    html.match(/<span class="kindle-price">.*?￥([\d,]+).*?<\/span>/), // Kindle用の古い形式
    html.match(/id="priceinsidebuybox"[^>]*>￥([\d,]+)</), // 購入ボックス内の価格
  ];
  for (const pMatch of priceMatches) {
    if (pMatch && pMatch[1]) {
      price = `${pMatch[1]}円`;
      break;
    }
  }

  // 4. 発売日 (新しいカルーセル形式と、古いリスト形式の両方に対応)
  let releaseDate = "（発行日取得失敗）";
  const releaseDateMatch =
    html.match(
      /<div id="rpi-attribute-book_details-publication_date"[\s\S]*?<span>([\d\/]+)<\/span>/
    ) || html.match(/<li><b>発売日<\/b>:\s*<span>(.*?)<\/span><\/li>/);
  if (releaseDateMatch && releaseDateMatch[1]) {
    releaseDate = releaseDateMatch[1].trim().replace(/\//g, "-");
  }

  // 5. 紹介文 (新しい折りたたみ形式に対応)
  let official_info = "（紹介文取得失敗）";
  const descMatch = html.match(
    /<div data-a-expander-name="book_description_expander"[\s\S]*?<div class="a-expander-content[\s\S]*?>([\s\S]*?)<\/div>/
  );
  if (descMatch && descMatch[1]) {
    official_info = descMatch[1]
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();
  }

  return {
    title: title, // 整形前のタイトルを渡す
    official_info: official_info,
    price: price,
    releaseDate: releaseDate,
    imageUrl: imageUrl,
  };
}

/**
 * 取得したタイトルから共通の不要な単語を削除し、カテゴリを抽出する
 * @param {object} rawData - 各サイトから取得した整形前のデータ
 * @returns {object} - 整形後の書籍データ
 */
function cleanUpTitleAndCategory(rawData) {
  let cleanTitle = rawData.title;

  // 共通で削除するキーワード
  const removeKeywords =
    /ダブルクロス The 3rd Edition|ソード・ワールド2.5|【電子特典付き】|\(富士見ドラゴンブック\)|\(角川スニーカー文庫\)/g;
  cleanTitle = cleanTitle.replace(removeKeywords, "").trim();

  // カテゴリとして分類するキーワード
  let category = "";
  const categoryKeywords = [
    "データ＆ルールブック",
    "データ&ルールブック",
    "ルール&データブック",
    "シナリオ集",
    "データ集",
    "ステージ集",
    "サプリメント",
    "スタートガイド",
    "ワールドガイド",
    "シナリオブック",
    "ルールブック",
    "追加データブック",
  ];
  for (const keyword of categoryKeywords) {
    // タイトルの前方一致でチェック
    if (cleanTitle.startsWith(keyword)) {
      category = keyword;
      cleanTitle = cleanTitle.substring(keyword.length).trim();
      break; // 最初に見つかったカテゴリで確定
    }
  }

  // 元のデータオブジェクトに整形後のタイトルとカテゴリをセットして返す
  rawData.title = cleanTitle;
  rawData.category = category;

  return rawData;
}

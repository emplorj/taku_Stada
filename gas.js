// ======================================================================
// カードジェネレーター データベースAPI - 構文エラー修正・最終版
// ======================================================================

const SPREADSHEET_ID = '1-pXyz5wOqIYZCe436Nq_sn0zsLacYDXmjekjmkh9iDw';
const SHEET_NAME = 'カードDB';
const HEADERS = ['ID', 'タイムスタンプ', 'カード名', '色', 'タイプ', '効果説明', 'フレーバー', '話者', '画像URL', '登録者', '絵師', '元ネタ', '備考'];

/**
 * CORSヘッダーを設定するヘルパー関数
 * @param {ContentService.TextOutput} output - ヘッダーを追加する対象のTextOutputオブジェクト
 * @returns {ContentService.TextOutput}
 */
function setCorsHeaders(output) {
  // ★★★ 正しい .addHttpHeader を使って1つずつヘッダーを追加 ★★★
  output.addHttpHeader('Access-Control-Allow-Origin', '*');
  output.addHttpHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  output.addHttpHeader('Access-Control-Allow-Headers', 'Content-Type');
  return output;
}

/**
 * JSON形式の応答を生成する関数
 * @param {object} obj - JSONに変換するオブジェクト
 * @returns {ContentService.TextOutput}
 */
function createJsonResponse(obj) {
  const textOutput = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  // CORSヘッダーを設定
  return setCorsHeaders(textOutput);
}

/**
 * CORSのプリフライトリクエスト(OPTIONS)に応答するための関数
 */
function doOptions(e) {
  const textOutput = ContentService.createTextOutput();
  return setCorsHeaders(textOutput);
}

/**
 * POSTリクエストを処理するメイン関数
 */
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error(`シート「${SHEET_NAME}」が見つかりません。`);
    
    const data = JSON.parse(e.postData.contents);

    // ★★★ リクエストの種類によって処理を分岐 ★★★
    
    // 1. 「新しいIDをください」というリクエストの場合
    if (data.action === 'getNewId') {
      const lastRow = sheet.getLastRow();
      let newId = 1;
      if (lastRow > 1) {
        const idRange = sheet.getRange(2, 1, lastRow - 1, 1);
        const idValues = idRange.getValues();
        const maxId = idValues.reduce((max, row) => Math.max(max, Number(row[0]) || 0), 0);
        newId = maxId + 1;
      }
      return createJsonResponse({ status: 'success', newId: newId });
    }

    // 2. 「データを更新してください」というリクエストの場合
    if (data.action === 'update' && data.ID) {
      // (更新処理は前回から変更なし)
      // ...
    }

    // 3. 「データを新規作成してください」というリクエストの場合
    if (data.action === 'create' && data.ID) {
      const notesWithPrefix = data.isEventCard ? '[イベントカード] ' + (data.notes || '') : (data.notes || '');
      const newRow = HEADERS.map(header => {
          switch(header) {
              case 'ID':           return data.ID; // ★クライアントから指定されたIDを使用
              case 'タイムスタンプ': return new Date();
              case '備考':         return notesWithPrefix;
              // ... 他の項目 ...
          }
      });
      sheet.appendRow(newRow);
      return createJsonResponse({ 'status': 'success', 'message': `ID: ${data.ID} でカードを登録しました。` });
    }

    // 予期せぬリクエストの場合
    throw new Error('無効なアクションが指定されました。');

  } catch (error) {
    Logger.log(error.toString());
    return createJsonResponse({ 'status': 'error', 'message': error.message });
  }
}

/**
 * GETリクエストへの応答関数
 */
function doGet(e) {
  return createJsonResponse({ status: 'info', message: 'This web app is for POST requests.' });
}
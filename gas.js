// Google Apps Script - コード.gs

// ===============================================
// グローバル設定
// ===============================================
// ここにあなたのGoogleスプレッドシートのIDを設定してください
const SPREADSHEET_ID = "1-pXyz5wOqIYZCe436Nq_sn0zsLacYDXmjekjmkh9iDw";
// ここにシート名を設定してください
const SHEET_NAME = "カードDB";

const HEADERS = [
  "ID",
  "タイムスタンプ",
  "カード名",
  "色",
  "タイプ",
  "効果説明",
  "フレーバー",
  "話者",
  "画像URL",
  "オーバーレイ画像URL",
  "キラ",
  "登録者",
  "絵師",
  "元ネタ",
  "備考",
];

// ===============================================
// WebアプリとしてPOSTリクエストを処理するメイン関数
// ===============================================
function doPost(e) {
  try {
    const sheet =
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: "error", message: "Sheet not found" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // ヘッダー行を確認・設定
    ensureHeader(sheet);

    const lock = LockService.getScriptLock();
    lock.waitLock(30000); // 30秒待機

    try {
      const data = JSON.parse(e.postData.contents);
      const action = data.action;

      switch (action) {
        case "create":
          return handleCreate(sheet, data);
        case "update":
          return handleUpdate(sheet, data);
        case "delete":
          return handleDelete(sheet, data);
        default:
          return ContentService.createTextOutput(
            JSON.stringify({ status: "error", message: "Invalid action" })
          ).setMimeType(ContentService.MimeType.JSON);
      }
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ===============================================
// 各アクションのハンドラー関数
// ===============================================

/**
 * 新規カードデータを作成する
 */
function handleCreate(sheet, data) {
  const newId = getNextId(sheet);
  const newRow = [
    newId,
    new Date(),
    data.name || "",
    data.color || "",
    data.type || "",
    data.effect || "",
    data.flavor || "",
    data.speaker || "",
    data.imageUrl || "",
    data.overlayImageUrl || "",
    data.sparkle ? "true" : "", // キラを空欄に
    data.registrant || "",
    data.artist || "",
    data.source || "",
    data.notes || "",
  ];
  sheet.appendRow(newRow);
  return ContentService.createTextOutput(
    JSON.stringify({ status: "success", id: newId })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 既存のカードデータを更新する
 */
function handleUpdate(sheet, data) {
  const rowNum = findRowById(sheet, data.ID);
  if (rowNum === -1) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: "ID not found" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const updatedRow = [
    data.ID,
    new Date(),
    data.name || "",
    data.color || "",
    data.type || "",
    data.effect || "",
    data.flavor || "",
    data.speaker || "",
    data.imageUrl || "",
    data.overlayImageUrl || "",
    data.sparkle ? "true" : "", // キラを空欄に
    data.registrant || "",
    data.artist || "",
    data.source || "",
    data.notes || "",
  ];
  sheet.getRange(rowNum, 1, 1, updatedRow.length).setValues([updatedRow]);
  return ContentService.createTextOutput(
    JSON.stringify({ status: "success", id: data.ID })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * カードデータを削除（実際には備考欄に「削除済み」とマークするアーカイブ処理）
 */
function handleDelete(sheet, data) {
  const rowNum = findRowById(sheet, data.ID);
  if (rowNum === -1) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: "ID not found" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // 備考欄の列インデックスを取得
  const notesColumnIndex = HEADERS.indexOf("備考") + 1;
  if (notesColumnIndex > 0) {
    sheet
      .getRange(rowNum, notesColumnIndex)
      .setValue(`【削除済み】${new Date().toLocaleString()}`);
  }

  // 色の列を「黒」に変更して非表示扱いにする
  const colorColumnIndex = HEADERS.indexOf("色") + 1;
  if (colorColumnIndex > 0) {
    sheet.getRange(rowNum, colorColumnIndex).setValue("黒");
  }

  return ContentService.createTextOutput(
    JSON.stringify({ status: "success", id: data.ID })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ===============================================
// ヘルパー関数
// ===============================================

/**
 * ヘッダー行が存在しない場合に作成する
 */
function ensureHeader(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
}

/**
 * 次に使用する新しいIDを取得する
 */
function getNextId(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return 1;
  }
  // ID列の最大値を取得して+1する
  const idColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const maxId = idColumn.reduce((max, row) => Math.max(max, row[0] || 0), 0);
  return maxId + 1;
}

/**
 * 指定されたIDの行番号を検索する
 */
function findRowById(sheet, id) {
  if (!id) return -1;
  const idColumn = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  for (let i = 0; i < idColumn.length; i++) {
    if (idColumn[i][0] == id) {
      return i + 1; // 行番号は1から始まる
    }
  }
  return -1; // 見つからなかった場合
}

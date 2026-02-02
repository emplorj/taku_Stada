// =================================================================
// ログをブラウザに転送する機能を追加したGASコード
// =================================================================
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "status";

  if (action === "listArchive") {
    return listScenarioArchive();
  }

  if (action === "resolveLogHtml") {
    return resolveLogHtmlFromDropbox(e);
  }

  if (action === "fetchLogHtml") {
    return fetchLogHtmlContent(e);
  }

  return ContentService.createTextOutput("スクリプトは正常に動作しています。");
}

// doPost: ウェブサイトからのPOSTリクエストを処理
function doPost(e) {
  let logMessages = []; // ブラウザに送るためのログを貯める配列
  logMessages.push("[GAS] doPost関数がトリガーされました。");

  try {
    logMessages.push("[GAS] 受信データ: " + e.postData.contents);
    const requestData = JSON.parse(e.postData.contents);
    const scenarioNames = requestData.scenarioNames; // 'scenarioName' -> 'scenarioNames'
    const userName = requestData.userName;
    logMessages.push(
      `[GAS] 解析成功: ${scenarioNames.length}件のシナリオ, ユーザー名=${userName}`,
    );

    if (!scenarioNames || !Array.isArray(scenarioNames) || !userName) {
      throw new Error("リクエストデータが無効です。");
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getSheetByGid(spreadsheet, 203728295);
    if (!sheet) {
      throw new Error("指定されたシートが見つかりませんでした。");
    }
    logMessages.push("[GAS] シート取得成功: " + sheet.getName());

    const data = sheet.getDataRange().getValues();
    const header = data.find((row) => row.includes("シナリオ名"));
    if (!header) {
      throw new Error("ヘッダー行が見つかりません。");
    }

    const scenarioNameColIndex = header.indexOf("シナリオ名");
    const interestedColIndex = header.indexOf("興味あり者");
    const headerRowIndex = data.findIndex((row) => row.includes("シナリオ名"));

    const processedScenarios = [];

    scenarioNames.forEach((scenarioName) => {
      let targetRowIndex = -1;
      for (let i = headerRowIndex + 1; i < data.length; i++) {
        if (data[i][scenarioNameColIndex] === scenarioName) {
          targetRowIndex = i;
          break;
        }
      }

      if (targetRowIndex === -1) {
        logMessages.push(
          `[GAS] スキップ: シナリオ「${scenarioName}」が見つかりませんでした。`,
        );
        return; // forEachのcontinue
      }

      const targetCell = sheet.getRange(
        targetRowIndex + 1,
        interestedColIndex + 1,
      );
      let currentValue = targetCell.getValue();
      const participants = currentValue
        .toString()
        .split(/[,、]/)
        .map((s) => s.trim());

      if (participants.includes(userName)) {
        logMessages.push(`[GAS] スキップ: 「${scenarioName}」は登録済みです。`);
        return; // forEachのcontinue
      }

      const newValue = currentValue ? `${currentValue},${userName}` : userName;
      targetCell.setValue(newValue);
      logMessages.push(`[GAS] セル更新完了: ${scenarioName} -> ${newValue}`);
      processedScenarios.push(scenarioName);
    });

    return createJsonResponse(
      {
        status: "success",
        message: `${processedScenarios.length}件の登録が完了しました。`,
        processedScenarios: processedScenarios, // 処理したシナリオのリストを返す
      },
      logMessages,
    );
  } catch (error) {
    logMessages.push("[GAS] 致命的なエラー発生: " + error.message);
    // エラーが発生した場合も、それまでのログを添えてエラーレスポンスを返す
    return createJsonResponse(
      { status: "error", message: `サーバーエラー: ${error.message}` },
      logMessages,
    );
  }
}

// createJsonResponse: ログをJSONに含めるように修正
function createJsonResponse(data, logs = []) {
  const responseData = {
    ...data,
    logs: logs, // ログの配列をレスポンスに含める
  };
  return ContentService.createTextOutput(
    JSON.stringify(responseData),
  ).setMimeType(ContentService.MimeType.JSON);
}

// getSheetByGid: 変更なし
function getSheetByGid(spreadsheet, gid) {
  return (
    spreadsheet.getSheets().find((sheet) => sheet.getSheetId() === gid) || null
  );
}

// =================================================================
// シナリオアーカイブ: 一覧取得
// =================================================================
function listScenarioArchive() {
  try {
    const spreadsheet = SpreadsheetApp.openById(
      "17wStGJ37GjaINrjZMFZgmacYOPeH9F8ZiahhtJd_nxI",
    );
    const sheet = getSheetByGid(spreadsheet, 620166307);
    if (!sheet) {
      throw new Error("指定されたシート(gid=620166307)が見つかりません。");
    }

    const data = sheet.getDataRange().getValues();
    const headerRowIndex = data.findIndex((row) => row.includes("シナリオ名"));
    if (headerRowIndex === -1) {
      throw new Error("ヘッダー行が見つかりません。");
    }

    const header = data[headerRowIndex];
    const getIndex = (colName) => header.indexOf(colName);
    const scenarioNameCol = getIndex("シナリオ名");
    const numberCol = getIndex("番号");
    const systemCol = getIndex("システム");
    const dateCol = getIndex("日付");
    const gmCol = getIndex("GM");
    const voiceCol = getIndex("ボイセ");
    const plCol = getIndex("PL");
    const pcCol = getIndex("PC");

    if (scenarioNameCol === -1) {
      throw new Error("'シナリオ名' 列が見つかりません。");
    }

    const rows = [];
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      const scenarioName = row[scenarioNameCol];
      if (!scenarioName) continue;

      const rich = sheet
        .getRange(i + 1, scenarioNameCol + 1)
        .getRichTextValue();
      const folderUrl = rich ? rich.getLinkUrl() || "" : "";

      rows.push({
        rowIndex: i + 1,
        number: numberCol !== -1 ? row[numberCol] : "",
        name: scenarioName,
        system: systemCol !== -1 ? row[systemCol] : "",
        systemColor: systemCol !== -1 ? getSystemColorCode(row[systemCol]) : "",
        date: dateCol !== -1 ? row[dateCol] : "",
        gm: gmCol !== -1 ? row[gmCol] : "",
        folderUrl: folderUrl,
        isVoice: voiceCol !== -1 ? !!row[voiceCol] : false,
        pl: plCol !== -1 ? row[plCol] : "",
        pc: pcCol !== -1 ? row[pcCol] : "",
      });
    }

    return createJsonResponse({ status: "success", data: rows });
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.message || "シナリオアーカイブ取得に失敗しました。",
    });
  }
}

function getSystemColorCode(systemName) {
  const map = {
    CoC: "#93c47d",
    クトゥルフ神話TRPG: "#6aa84f",
    "SW2.5": "#ea9999",
    "ソード・ワールド2.5": "#ea9999",
    DX3: "#cc4125",
    ダブルクロス3rd: "#cc4125",
    永い後日談のネクロニカ: "#505050",
    ネクロニカ: "#505050",
    サタスペ: "#e69138",
    マモノスクランブル: "#ffe51f",
    銀剣のステラナイツ: "#0788bb",
    シノビガミ: "#8e7cc3",
    "アリアンロッドRPG 2E": "#ffd966",
  };
  return map[systemName] || "";
}

// =================================================================
// Dropbox: フォルダ内HTML解決
// =================================================================
function resolveLogHtmlFromDropbox(e) {
  try {
    const folderUrl = (e && e.parameter && e.parameter.url) || "";
    if (!folderUrl) {
      throw new Error("url パラメータが必要です。");
    }

    if (isDropboxHtmlFileLink(folderUrl)) {
      return createJsonResponse({
        status: "success",
        fileName: extractDropboxFileName(folderUrl),
        directUrl: toDropboxDirectUrl(folderUrl),
        totalHtml: 1,
      });
    }

    const metadata = getDropboxSharedLinkMetadata(folderUrl);
    if (metadata && metadata[".tag"] === "file" && isHtmlFile(metadata.name)) {
      const directUrl = getDropboxDirectLink(
        getDropboxAccessToken(),
        metadata.path_lower,
      );
      return createJsonResponse({
        status: "success",
        fileName: metadata.name,
        directUrl: directUrl,
        totalHtml: 1,
      });
    }

    const token = getDropboxAccessToken();
    const htmlFiles = listDropboxHtmlFiles(token, folderUrl);
    if (!htmlFiles.length) {
      throw new Error("フォルダ内にHTMLが見つかりませんでした。");
    }

    const selected = selectHtmlCandidate(htmlFiles);
    const directUrl = getDropboxDirectLink(token, selected.path_lower);

    return createJsonResponse({
      status: "success",
      fileName: selected.name,
      directUrl: directUrl,
      totalHtml: htmlFiles.length,
    });
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.message || "HTML解決に失敗しました。",
    });
  }
}

function fetchLogHtmlContent(e) {
  try {
    const url = (e && e.parameter && e.parameter.url) || "";
    if (!url) {
      throw new Error("url パラメータが必要です。");
    }
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
    });
    if (response.getResponseCode() !== 200) {
      throw new Error(
        `HTML取得失敗: ${response.getResponseCode()} ${response.getContentText()}`,
      );
    }
    return ContentService.createTextOutput(
      response.getContentText(),
    ).setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.message || "HTML取得に失敗しました。",
    });
  }
}

function getDropboxAccessToken() {
  const props = PropertiesService.getScriptProperties();
  const appKey = props.getProperty("DROPBOX_APP_KEY");
  const appSecret = props.getProperty("DROPBOX_APP_SECRET");
  const refreshToken = props.getProperty("DROPBOX_REFRESH_TOKEN");
  if (!appKey || !appSecret || !refreshToken) {
    throw new Error(
      "Dropbox認証情報が不足しています（DROPBOX_APP_KEY/SECRET/REFRESH_TOKEN）。",
    );
  }

  const response = UrlFetchApp.fetch("https://api.dropbox.com/oauth2/token", {
    method: "post",
    payload: {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: appKey,
      client_secret: appSecret,
    },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(
      `Dropboxトークン取得失敗: ${response.getResponseCode()} ${response.getContentText()}`,
    );
  }

  const data = JSON.parse(response.getContentText());
  if (!data.access_token) {
    throw new Error("Dropboxアクセストークン取得に失敗しました。");
  }
  return data.access_token;
}

function getDropboxSharedLinkMetadata(sharedLinkUrl) {
  try {
    const token = getDropboxAccessToken();
    const response = UrlFetchApp.fetch(
      "https://api.dropboxapi.com/2/sharing/get_shared_link_metadata",
      {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: `Bearer ${token}` },
        payload: JSON.stringify({ url: sharedLinkUrl }),
        muteHttpExceptions: true,
      },
    );
    if (response.getResponseCode() !== 200) {
      return null;
    }
    return JSON.parse(response.getContentText());
  } catch (error) {
    return null;
  }
}

function listDropboxHtmlFiles(token, sharedLinkUrl) {
  let hasMore = true;
  let cursor = "";
  const entries = [];

  while (hasMore) {
    const endpoint = cursor
      ? "https://api.dropboxapi.com/2/files/list_folder/continue"
      : "https://api.dropboxapi.com/2/files/list_folder";
    const payload = cursor
      ? { cursor: cursor }
      : { path: "", shared_link: { url: sharedLinkUrl } };

    const response = UrlFetchApp.fetch(endpoint, {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: `Bearer ${token}` },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() !== 200) {
      throw new Error(
        `Dropboxフォルダ取得失敗: ${response.getResponseCode()} ${response.getContentText()}`,
      );
    }

    const data = JSON.parse(response.getContentText());
    const batch = (data.entries || []).filter(
      (item) => item[".tag"] === "file" && isHtmlFile(item.name),
    );
    entries.push(...batch);
    hasMore = !!data.has_more;
    cursor = data.cursor || "";
  }

  return entries;
}

function isHtmlFile(name) {
  return /\.html?$/i.test(name || "");
}

function isDropboxHtmlFileLink(url) {
  return /dropbox\.com\/.+\.html?(\?|$)/i.test(url || "");
}

function extractDropboxFileName(url) {
  if (!url) return "";
  const match = url.match(/\/([^\/\?]+\.html?)(\?|$)/i);
  return match ? decodeURIComponent(match[1]) : "";
}

function selectHtmlCandidate(files) {
  if (files.length === 1) return files[0];

  let candidates = files.slice();
  const withoutFormatted = candidates.filter(
    (item) => !/整形済/.test(item.name),
  );
  if (withoutFormatted.length > 0) {
    candidates = withoutFormatted;
  }

  const allMatch = candidates.filter((item) => /\[all\]|all/i.test(item.name));
  if (allMatch.length > 0) {
    return allMatch.sort((a, b) => a.name.localeCompare(b.name))[0];
  }

  return candidates.sort((a, b) => a.name.localeCompare(b.name))[0];
}

function getDropboxDirectLink(token, pathLower) {
  try {
    const listResponse = UrlFetchApp.fetch(
      "https://api.dropboxapi.com/2/sharing/list_shared_links",
      {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: `Bearer ${token}` },
        payload: JSON.stringify({ path: pathLower, direct_only: true }),
        muteHttpExceptions: true,
      },
    );
    if (listResponse.getResponseCode() === 200) {
      const listData = JSON.parse(listResponse.getContentText());
      if (listData.links && listData.links.length > 0) {
        return toDropboxDirectUrl(listData.links[0].url);
      }
    }
  } catch (error) {
    // 続行して新規作成へ
  }

  const createResponse = UrlFetchApp.fetch(
    "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
    {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: `Bearer ${token}` },
      payload: JSON.stringify({ path: pathLower }),
      muteHttpExceptions: true,
    },
  );

  if (createResponse.getResponseCode() !== 200) {
    const temp = UrlFetchApp.fetch(
      "https://api.dropboxapi.com/2/files/get_temporary_link",
      {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: `Bearer ${token}` },
        payload: JSON.stringify({ path: pathLower }),
        muteHttpExceptions: true,
      },
    );
    if (temp.getResponseCode() !== 200) {
      throw new Error("Dropboxリンク生成に失敗しました。");
    }
    const tempData = JSON.parse(temp.getContentText());
    return tempData.link;
  }

  const data = JSON.parse(createResponse.getContentText());
  return toDropboxDirectUrl(data.url);
}

function toDropboxDirectUrl(url) {
  if (!url) return "";
  if (url.includes("dl=1")) return url;
  if (url.includes("dl=0")) return url.replace("dl=0", "dl=1");
  return `${url}${url.includes("?") ? "&" : "?"}dl=1`;
}

// ===== 設定項目 =====
const SHEET_NAME_FOR_COMBO = "ComboData";
const SHEET_NAME_SHINJUKU = "ShinjukuData";
const SHEET_NAME_LOG_SCENE = "LogSceneData";

// ★あなたのサイトのURL (キャラシページのURL)
const BASE_URL = "https://emplorj.github.io/taku_Stada/shinjuku_crawler.html";
const LOG_PLAYER_URL = "https://emplorj.github.io/taku_Stada/log_player.html";

// ===== メイン処理 =====

function doGet(e) {
  const action = e.parameter.action || "load";

  if (action === "import") {
    return importFromHokanjo(e);
  } else {
    const tool = e.parameter.tool;
    if (tool === "shinjuku") {
      if (action === "list") {
        // ★追加: 一覧取得
        return getShinjukuList();
      } else {
        return loadFromDatabaseShinjuku(e);
      }
    } else if (tool === "logScene") {
      // ★追加: ログシーン用
      return loadLogSceneFromDatabase(e);
    } else {
      return loadFromDatabase(e);
    }
  }
}

/**
 * POSTリクエスト (保存/削除/生成)
 */
function doPost(e) {
  let response;
  try {
    const payload = JSON.parse(e.postData.contents);

    // ツール分岐
    if (payload.tool === "comboGenerator") {
      response = handleComboGeneratorRequest(payload);
    } else if (payload.tool === "komaMaker") {
      response = processSheetData(payload.data);
    } else if (payload.tool === "shinjuku") {
      // ★追加: シンジュク用処理
      response = handleShinjukuRequest(payload);
    } else if (payload.tool === "logScene") {
      // ★追加: ログシーン用処理
      response = handleLogSceneRequest(payload);
    } else {
      throw new Error("無効なツールリクエストです。");
    }

    return createJsonResponse(response);
  } catch (error) {
    Logger.log("Critical error in doPost: " + error.stack);
    return createJsonResponse({
      status: "error",
      message: "サーバー側エラー: " + error.message,
    });
  }
}

// ===== シンジュクロウラー用 新規関数 =====

/**
 * シンジュクデータの保存処理
 */
function handleShinjukuRequest(payload) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_SHINJUKU);
  if (!sheet)
    return {
      status: "error",
      message: `シート '${SHEET_NAME_SHINJUKU}' が見つかりません。`,
    };

  const saveKey = payload.id;
  const action = payload.action || "save";

  if (!saveKey) return { status: "error", message: "IDが必要です。" };

  const row = findRowById(sheet, saveKey);

  if (action === "save") {
    const dataToSave = payload.data;
    const isPrivate = payload.isPrivate || false; // 非公開フラグ

    if (!dataToSave)
      return { status: "error", message: "データがありません。" };

    const jsonStringData = JSON.stringify(dataToSave);
    const pcName = dataToSave.pc_name || "（名称未設定）";
    const playerName = dataToSave.player_name || "-";
    const updateTime = new Date();

    // ★管理者用リンク生成
    // スプシ上でクリックするとそのキャラシに飛べるようにする
    const linkUrl = `${BASE_URL}?id=${encodeURIComponent(saveKey)}`;
    const pcNameFormula = `=HYPERLINK("${linkUrl}", "${pcName.replace(
      /"/g,
      '""'
    )}")`;

    // カラム構成: [A:ID] [B:JSON] [C:PC名(Link)] [D:PL名] [E:更新日時] [F:非公開フラグ]
    if (row > 0) {
      sheet.getRange(row, 2).setValue(jsonStringData);
      sheet.getRange(row, 3).setFormula(pcNameFormula); // setFormulaを使う
      sheet.getRange(row, 4).setValue(playerName);
      sheet.getRange(row, 5).setValue(updateTime);
      sheet.getRange(row, 6).setValue(isPrivate ? "TRUE" : "");
    } else {
      sheet.appendRow([
        saveKey,
        jsonStringData,
        "",
        playerName,
        updateTime,
        isPrivate ? "TRUE" : "",
      ]);
      // appendRowだとFormulaが文字列になることがあるので、追加した行のC列だけ再設定
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 3).setFormula(pcNameFormula);
    }
    return { status: "success", message: "保存しました！", id: saveKey };
  } else {
    return { status: "error", message: `無効なアクション: ${action}` };
  }
}

// ★追加: 一覧取得関数
function getShinjukuList() {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_SHINJUKU);
  if (!sheet)
    return createJsonResponse({
      status: "error",
      message: "シートが見つかりません。",
    });

  // データ範囲取得 (ヘッダー除く)
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return createJsonResponse({ status: "success", data: [] });

  const data = sheet.getRange(1, 1, lastRow, 6).getValues(); // A~F列
  const list = [];

  // 1行目からループ (ヘッダーがあるなら i=1 から)
  // ここでは1行目からデータが入る想定なら i=0、ヘッダーありなら i=1
  // 一旦全行スキャンしてIDがあるかチェック
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const id = row[0];
    const pcNameCell = row[2]; // Formulaが入っている場合、getValue()だと表示名が取れるはず
    const plName = row[3];
    const date = row[4];
    const isPrivate = row[5]; // F列: 非公開フラグ

    // IDがあり、かつ非公開フラグが立っていない場合のみリストに追加
    if (id && isPrivate != "TRUE" && isPrivate !== true) {
      // 日付のフォーマット
      let dateStr = "";
      if (date instanceof Date) {
        dateStr = Utilities.formatDate(date, "JST", "yyyy/MM/dd HH:mm");
      }

      list.push({
        id: id,
        pc_name: pcNameCell, // HYPERLINK関数の表示部分が取れる
        player_name: plName,
        updated: dateStr,
      });
    }
  }

  // 新しい順にソート
  list.reverse();

  return createJsonResponse({ status: "success", data: list });
}
/**
 * シンジュクデータの読み込み処理 (GET)
 */
function loadFromDatabaseShinjuku(e) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_SHINJUKU);
  if (!sheet)
    return createJsonResponse({
      status: "error",
      message: `シート '${SHEET_NAME_SHINJUKU}' がありません。`,
    });

  const saveKey = e.parameter.id;
  if (!saveKey)
    return createJsonResponse({
      status: "error",
      message: "IDが指定されていません。",
    });

  const row = findRowById(sheet, saveKey);
  if (row > 0) {
    const dataString = sheet.getRange(row, 2).getValue();
    try {
      const jsonData = JSON.parse(dataString);
      return createJsonResponse({
        status: "success",
        id: saveKey,
        data: jsonData,
      });
    } catch (err) {
      return createJsonResponse({
        status: "error",
        message: "データのパースに失敗しました。",
      });
    }
  }
}

// ===== ログプレイヤー用 新規関数 =====

/**
 * ログシーンデータの保存処理
 */
function handleLogSceneRequest(payload) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_LOG_SCENE);
  if (!sheet)
    return {
      status: "error",
      message: `シート '${SHEET_NAME_LOG_SCENE}' が見つかりません。`,
    };

  const sceneId = payload.id;
  const action = payload.action || "save";

  if (!sceneId) return { status: "error", message: "IDが必要です。" };

  const row = findRowById(sheet, sceneId);

  if (action === "save") {
    const dataToSave = payload.data; // { lines: [...], startLine: 0, title: "..." }
    if (!dataToSave)
      return { status: "error", message: "データがありません。" };

    const jsonStringData = JSON.stringify(dataToSave);
    const sceneTitle = dataToSave.title || "（タイトル未設定）";
    const lineCount = dataToSave.lines ? dataToSave.lines.length : 0;
    const updateTime = new Date();

    // 共有URL生成 (リクエストからURLが指定されていればそれを使う)
    const baseUrl = payload.baseUrl || LOG_PLAYER_URL;
    const linkUrl = `${baseUrl}?scene=${encodeURIComponent(sceneId)}`;
    const titleFormula = `=HYPERLINK("${linkUrl}", "${sceneTitle.replace(
      /"/g,
      '""'
    )}")`;

    // カラム構成: [A:ID] [B:JSON] [C:タイトル(Link)] [D:作成日時]
    if (row > 0) {
      sheet.getRange(row, 2).setValue(jsonStringData);
      sheet.getRange(row, 3).setFormula(titleFormula);
      sheet.getRange(row, 4).setValue(updateTime);
    } else {
      sheet.appendRow([sceneId, jsonStringData, "", updateTime]);
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 3).setFormula(titleFormula);
    }
    return {
      status: "success",
      message: "シーンを保存しました!",
      id: sceneId,
      url: linkUrl,
    };
  } else if (action === "delete") {
    if (row > 0) {
      sheet.deleteRow(row);
      return { status: "success", message: "シーンを削除しました。" };
    } else {
      // 既に見つからない場合も成功とみなすかエラーにするか。ここではエラーを返す。
      return { status: "not_found", message: "削除対象が見つかりません。" };
    }
  } else {
    return { status: "error", message: `無効なアクション: ${action}` };
  }
}

/**
 * ログシーンデータの読み込み処理 (GET)
 */
function loadLogSceneFromDatabase(e) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_LOG_SCENE);
  if (!sheet)
    return createJsonResponse({
      status: "error",
      message: `シート '${SHEET_NAME_LOG_SCENE}' がありません。`,
    });

  const sceneId = e.parameter.id;
  if (!sceneId)
    return createJsonResponse({
      status: "error",
      message: "IDが指定されていません。",
    });

  const row = findRowById(sheet, sceneId);
  if (row > 0) {
    const dataString = sheet.getRange(row, 2).getValue();
    try {
      const jsonData = JSON.parse(dataString);
      return createJsonResponse({
        status: "success",
        id: sceneId,
        data: jsonData,
      });
    } catch (err) {
      return createJsonResponse({
        status: "error",
        message: "データのパースに失敗しました。",
      });
    }
  } else {
    return createJsonResponse({
      status: "not_found",
      message: "該当するシーンが見つかりません。",
    });
  }
}

/**
 * 【新設】コンボジェネレーターからのリクエストを処理する専用関数
 * (元のdoPostのロジックをここに移動)
 */
function handleComboGeneratorRequest(payload) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_FOR_COMBO);
  if (!sheet) {
    return {
      status: "error",
      message: `Sheet '${SHEET_NAME_FOR_COMBO}' not found.`,
    };
  }

  const charaId = payload.id;
  const action = payload.action || "save";
  if (!charaId) {
    return { status: "error", message: "ID is required" };
  }

  const row = findRowById(sheet, charaId);

  if (action === "save") {
    const dataToSave = payload.data;
    if (!dataToSave) {
      return { status: "error", message: "Data is required for saving" };
    }

    const jsonStringData = JSON.stringify(dataToSave);
    const characterName = dataToSave.characterName || "（名称不明）";
    const shareUrl = payload.shareUrl || "";
    const nameCellData = shareUrl
      ? `=HYPERLINK("${shareUrl}", "${characterName}")`
      : characterName;

    if (row > 0) {
      sheet.getRange(row, 2).setValue(jsonStringData);
      sheet.getRange(row, 3).setValue(nameCellData);
      sheet.getRange(row, 4).setValue(new Date());
    } else {
      sheet.appendRow([charaId, jsonStringData, nameCellData, new Date()]);
    }
    return {
      status: "success",
      message: "Data saved successfully.",
      id: charaId,
    };
  } else if (action === "delete") {
    if (row > 0) {
      sheet.deleteRow(row);
      return {
        status: "success",
        message: "Data deleted successfully.",
        id: charaId,
      };
    } else {
      return { status: "not_found", message: "Data to delete was not found." };
    }
  } else {
    return { status: "error", message: `Invalid action: ${action}` };
  }
}

// ===== 機能別関数 (以下は変更なし) =====

/**
 * キャラクター保管所からデータを引用する
 */
function importFromHokanjo(e) {
  const targetUrl = e.parameter.url;
  if (!targetUrl || !targetUrl.includes("charasheet.vampire-blood.net")) {
    return createJsonResponse({
      status: "error",
      message: "キャラクター保管所のURLではありません。",
    });
  }
  try {
    const response = UrlFetchApp.fetch(targetUrl, { muteHttpExceptions: true });
    const html = response.getContentText("UTF-8");
    if (response.getResponseCode() !== 200) {
      throw new Error(
        `URLの取得に失敗しました。ステータス: ${response.getResponseCode()}`
      );
    }
    const nameMatch = html.match(/<h3>(.+?)<\/h3>/);
    const characterName = nameMatch ? nameMatch[1].trim() : "名称不明";
    const totalXpMatch = html.match(
      /name="sum_seichoten_calc"[^>]+value="(\d+)"/
    );
    const totalXp = totalXpMatch ? parseInt(totalXpMatch[1], 10) : 130;

    const effects = parseEffectTable(html, "Table_effect");
    const easyEffects = parseEffectTable(html, "Table_easyeffect");
    const items = parseItems(html);

    const resultData = { characterName, totalXp, effects, easyEffects, items };
    return createJsonResponse({ status: "success", data: resultData });
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "キャラクター保管所の解析に失敗しました。",
      details: error.toString(),
    });
  }
}

/**
 * DBからデータを読み込む
 */
function loadFromDatabase(e) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_FOR_COMBO);
  if (!sheet) {
    return createJsonResponse({
      status: "error",
      message: `Sheet '${SHEET_NAME_FOR_COMBO}' not found.`,
    });
  }
  const charaId = e.parameter.id;
  if (!charaId) {
    return createJsonResponse({ status: "error", message: "ID is required" });
  }
  const row = findRowById(sheet, charaId);
  if (row > 0) {
    const data = sheet.getRange(row, 2).getValue();
    const jsonData = JSON.parse(data);
    return createJsonResponse({
      status: "success",
      id: charaId,
      data: jsonData,
    });
  } else {
    return createJsonResponse({
      status: "not_found",
      message: "Data not found",
    });
  }
}

// ===== ヘルパー関数 (以下は変更なし) =====

function parseEffectTable(html, tableId) {
  const effects = [];
  const tableRegex = new RegExp(
    '<table class="pc_making" id="' + tableId + '">[\\s\\S]*?</table>',
    "i"
  );
  const tableMatch = html.match(tableRegex);
  if (!tableMatch) return effects;

  const tableHtml = tableMatch[0];
  const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const rowHtml = rowMatch[0];
    const nameMatch = rowHtml.match(
      /name="(?:effect|easyeffect)_name\[\]"[^>]+value="([^"]*)"/
    );
    if (!nameMatch || !nameMatch[1]) {
      continue;
    }

    const getData = (fieldName) => {
      const regex = new RegExp(
        'name="(?:effect|easyeffect)_' +
          fieldName +
          '\\[\\]"[^>]+value="([^"]*)"'
      );
      const match = rowHtml.match(regex);
      return match ? match[1] : "";
    };

    const hiddenLevelMatch = rowHtml.match(
      /name="(?:effect|easyeffect)_lv\[\]"[^>]+value="([^"]*)"/
    );
    const selectedValue = hiddenLevelMatch ? hiddenLevelMatch[1] : "0";
    let currentLevel = 1,
      currentMaxLevel = 5;
    const selectMatch = rowHtml.match(
      /<select name="S_(?:effect|easyeffect)_lv\[\]"[\s\S]*?<\/select>/
    );
    if (selectMatch) {
      const optionRegex = new RegExp(
        '<option value="' +
          selectedValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
          '"[^>]*>([\\s\\S]*?)</option>'
      );
      const optionMatch = selectMatch[0].match(optionRegex);
      if (optionMatch) {
        const selectedText = optionMatch[1].trim();
        const parsedLevel = parseInt(selectedText, 10);
        currentLevel = isNaN(parsedLevel) ? 1 : parsedLevel;
      }
    }
    const parsedSelectedValue = parseInt(selectedValue, 10);
    if (parsedSelectedValue === 0) {
      currentMaxLevel = 1;
    } else {
      currentMaxLevel = 5;
    }

    const limitText = toFullWidthKana(getData("page"));
    const notesText = toFullWidthKana(getData("shozoku"));

    effects.push({
      name: decodeHtmlEntities(nameMatch[1]),
      level: currentLevel,
      maxLevel: currentMaxLevel,
      timing: toFullWidthKana(getData("timing")),
      skill: toFullWidthKana(getData("hantei")),
      difficulty: "自動",
      target: toFullWidthKana(getData("taisho")),
      range: toFullWidthKana(getData("range")),
      cost: getData("cost"),
      limit: limitText,
      effect: decodeHtmlEntities(getData("memo")),
      notes: notesText,
    });
  }
  return effects;
}

function parseItems(html) {
  const items = [];
  const armsTableRegex = /<table[^>]+id="Table_arms"[^>]*>[\s\S]*?<\/table>/i;
  const armsTableMatch = html.match(armsTableRegex);
  if (armsTableMatch) {
    const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(armsTableMatch[0])) !== null) {
      const rowHtml = rowMatch[0];
      const nameMatch = rowHtml.match(
        /name="arms_name\[\]"[^>]+value="([^"]*)"/
      );
      if (!nameMatch || !nameMatch[1]) continue;

      const getData = (fieldName) => {
        const regex = new RegExp(
          `name="${fieldName}\\[\\]"[^>]+value="([^"]*)"`
        );
        const match = rowHtml.match(regex);
        return match ? match[1] : "";
      };

      const skillId = getData("V_arms_hit_param");
      let skillName = "-";
      if (skillId === "1") skillName = "白兵";
      else if (skillId === "2") skillName = "射撃";
      else if (skillId === "3") skillName = "RC";

      items.push({
        name: decodeHtmlEntities(nameMatch[1]),
        level: 1,
        type: "武器",
        skill: skillName,
        accuracy: getData("arms_hit"),
        attack: getData("arms_power"),
        guard: getData("arms_guard_level"),
        range: getData("arms_range"),
        cost: "",
        xp: 0,
        notes: decodeHtmlEntities(getData("arms_sonota")),
      });
    }
  }

  const getGlobalData = (fieldName) => {
    const regex = new RegExp(`name="${fieldName}"[^>]+value="([^"]*)"`);
    const match = html.match(regex);
    return match ? match[1] : "";
  };

  const armer1Name = getGlobalData("armer_name");
  if (armer1Name) {
    items.push({
      name: decodeHtmlEntities(armer1Name),
      level: 1,
      type: "防具",
      skill: "-",
      accuracy: "",
      attack: "",
      guard: getGlobalData("armer_def"),
      range: "",
      cost: "",
      xp: 0,
      notes: decodeHtmlEntities(getGlobalData("armer_sonota")),
    });
  }
  const armer2Name = getGlobalData("armer2_name");
  if (armer2Name) {
    items.push({
      name: decodeHtmlEntities(armer2Name),
      level: 1,
      type: "防具",
      skill: "-",
      accuracy: "",
      attack: "",
      guard: getGlobalData("armer2_def"),
      range: "",
      cost: "",
      xp: 0,
      notes: decodeHtmlEntities(getGlobalData("armer2_sonota")),
    });
  }

  const itemTableRegex = /<table[^>]+id="Table_item"[^>]*>[\s\S]*?<\/table>/i;
  const itemTableMatch = html.match(itemTableRegex);
  if (itemTableMatch) {
    const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(itemTableMatch[0])) !== null) {
      const rowHtml = rowMatch[0];
      const nameMatch = rowHtml.match(
        /name="item_name\[\]"[^>]+value="([^"]*)"/
      );
      if (!nameMatch || !nameMatch[1]) continue;

      const getRowData = (fieldName) => {
        const regex = new RegExp(
          `name="${fieldName}\\[\\]"[^>]+value="([^"]*)"`
        );
        const match = rowHtml.match(regex);
        return match ? match[1] : "";
      };

      items.push({
        name: decodeHtmlEntities(nameMatch[1]),
        level: 1,
        type: "その他",
        skill: "-",
        accuracy: "",
        attack: "",
        guard: "",
        range: "",
        cost: "",
        xp: 0,
        notes: decodeHtmlEntities(getRowData("item_memo")),
      });
    }
  }

  return items;
}

function decodeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/&times;/g, "×")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function toFullWidthKana(str) {
  if (!str) return "";
  const kanaMap = {
    ｶﾞ: "ガ",
    ｷﾞ: "ギ",
    ｸﾞ: "グ",
    ｹﾞ: "ゲ",
    ｺﾞ: "ゴ",
    ｻﾞ: "ザ",
    ｼﾞ: "ジ",
    ｽﾞ: "ズ",
    ｾﾞ: "ゼ",
    ｿﾞ: "ゾ",
    ﾀﾞ: "ダ",
    ﾁﾞ: "ヂ",
    ﾂﾞ: "ヅ",
    ﾃﾞ: "デ",
    ﾄﾞ: "ド",
    ﾊﾞ: "バ",
    ﾋﾞ: "ビ",
    ﾌﾞ: "ブ",
    ﾍﾞ: "ベ",
    ﾎﾞ: "ボ",
    ﾊﾟ: "パ",
    ﾋﾟ: "ピ",
    ﾌﾟ: "プ",
    ﾍﾟ: "ペ",
    ﾎﾟ: "ポ",
    ｳﾞ: "ヴ",
    ﾜﾞ: "ヷ",
    ｦﾞ: "ヺ",
    ｱ: "ア",
    ｲ: "イ",
    ｳ: "ウ",
    ｴ: "エ",
    ｵ: "オ",
    ｶ: "カ",
    ｷ: "キ",
    ｸ: "ク",
    ｹ: "ケ",
    ｺ: "コ",
    ｻ: "サ",
    ｼ: "シ",
    ｽ: "ス",
    ｾ: "セ",
    ｿ: "ソ",
    ﾀ: "タ",
    ﾁ: "チ",
    ﾂ: "ツ",
    ﾃ: "テ",
    ﾄ: "ト",
    ﾅ: "ナ",
    ﾆ: "ニ",
    ﾇ: "ヌ",
    ﾈ: "ネ",
    ﾉ: "ノ",
    ﾊ: "ハ",
    ﾋ: "ヒ",
    ﾌ: "フ",
    ﾍ: "ヘ",
    ﾎ: "ホ",
    ﾏ: "マ",
    ﾐ: "ミ",
    ﾑ: "ム",
    ﾒ: "メ",
    ﾓ: "モ",
    ﾔ: "ヤ",
    ﾕ: "ユ",
    ﾖ: "ヨ",
    ﾗ: "ラ",
    ﾘ: "リ",
    ﾙ: "ル",
    ﾚ: "レ",
    ﾛ: "ロ",
    ﾜ: "ワ",
    ｦ: "ヲ",
    ﾝ: "ン",
    ｧ: "ァ",
    ｨ: "ィ",
    ｩ: "ゥ",
    ｪ: "ェ",
    ｫ: "ォ",
    ｯ: "ッ",
    ｬ: "ャ",
    ｭ: "ュ",
    ｮ: "ョ",
    "｡": "。",
    "､": "、",
    ｰ: "ー",
    "｢": "「",
    "｣": "」",
    "･": "・",
  };
  const reg = new RegExp("(" + Object.keys(kanaMap).join("|") + ")", "g");
  return str.replace(reg, (match) => kanaMap[match]).replace(/\//g, "／");
}

function findRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

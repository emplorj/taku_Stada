// KomaMakerAPI.gs (元のプロジェクトのデータ抽出ロジックを忠実に復元した最終版)

// =================================================================================
// メイン処理 (司令塔)
// =================================================================================
function processSheetData(formData) {
  try {
    const url = formData.sheet;
    const img = formData.img;
    const opt = [!formData.nomemo, !formData.nochp];
    const additionalPalette = formData.additionalPalette || "";

    if (!url || url.trim() === "") {
      return { message: "URLが入力されていない…だと…？", out: "URL未入力" };
    }

    // 最初にHTMLを取得し、それに基づいてシステムを正確に判定
    const fetchResult = fetchAndIdentifySystem(url);
    const system = fetchResult.system;
    const responseText = fetchResult.html;

    if (system === "Unknown") {
      throw new Error(
        "対応していないキャラクターシート形式か、URLが間違っているようだ。"
      );
    }

    const charName = getName(responseText, system, url);

    let result = { message: "", out: "", eff: [[1, 2]] };
    let charaJson;

    switch (system) {
      case "DX3":
        charaJson = getDataDX(responseText, url, img, opt, additionalPalette);
        result.message = `ククク、${charName}よ。任務に向かえ。`;
        result.eff = getEffect(responseText);
        break;
      case "Nechronica":
        charaJson = getDataNC(responseText, url, img, opt, additionalPalette);
        result.message = `${charName}、きみも、心を…取り戻したんだね`;
        break;
      case "Satasupe":
        charaJson = getDataSata(
          responseText,
          url,
          img,
          opt,
          additionalPalette,
          charName
        );
        result.message = `ククク、${charName}よ。涅槃で待つ`;
        break;
      default:
        throw new Error("システム処理中に不明なエラーが発生した。");
    }

    result.out = JSON.stringify(charaJson, null, 2);
    return result;
  } catch (error) {
    Logger.log("Error in processSheetData: " + error.stack);
    return {
      message: "処理中にエラーが発生したぞ: " + error.message,
      out: "エラー発生",
      eff: [[1, 2]],
    };
  }
}

// =================================================================================
// 共通ヘルパー関数 (システム判定ロジックを刷新)
// =================================================================================
function fetchAndIdentifySystem(url) {
  let html = "";
  let system = "Unknown";

  if (url.includes("satasupe") || url.includes("appspot.com")) {
    system = "Satasupe";
    html = phantomJSCloudScraping(url); // サタスペはJS必須
  } else if (url.includes("charasheet.vampire-blood.net")) {
    // まずJSレンダリングなしで取得
    const preliminaryHtml = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
    }).getContentText("UTF-8");

    if (preliminaryHtml.includes("ダブルクロス")) {
      system = "DX3";
      html = preliminaryHtml; // DX3はこのHTMLでOK
    } else if (preliminaryHtml.includes("ネクロニカ")) {
      system = "Nechronica";
      html = phantomJSCloudScraping(url); // ネクロニカはJS必須
    }
  }

  if (system === "Unknown") {
    throw new Error("対応していない、あるいは無効なURLです。");
  }
  return { html: html, system: system };
}

function getName(responseText, system, url) {
  const titleMatch = responseText.match(/<title>([\s\S]*?)<\/title>/);
  if (!titleMatch || !titleMatch[1]) return "(名前取得失敗)";
  let name = titleMatch[1].trim();

  if (system === "DX3" || system === "Nechronica") {
    name = name.replace(/\s*-\s*キャラクター保管所/, "");
  } else if (system === "Satasupe") {
    name = name.replace(/\s*サタスペキャラクターシート/, "").trim();
  }
  return name;
}

function phantomJSCloudScraping(URL) {
  const key =
    PropertiesService.getScriptProperties().getProperty("PHANTOMJSCLOUD_ID");
  if (!key)
    throw new Error(
      "PhantomJSCloudのAPIキーがスクリプトプロパティに設定されていません。"
    );
  const option = { url: URL, renderType: "HTML", outputAsJson: true };
  const payload = encodeURIComponent(JSON.stringify(option));
  const apiUrl = `https://phantomjscloud.com/api/browser/v2/${key}/?request=${payload}`;
  const response = UrlFetchApp.fetch(apiUrl, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) {
    throw new Error(
      `PhantomJSCloud API Error: HTTP ${response.getResponseCode()} - ${response.getContentText()}`
    );
  }
  const json = JSON.parse(response.getContentText());
  if (json.content && json.content.data) {
    return json.content.data;
  }
  throw new Error("PhantomJSCloudからのHTML取得に失敗しました。");
}

// =================================================================================
// ダブルクロス 3rd Edition (DX3) 関連 (元のロジックを忠実に復元)
// =================================================================================
function getDataDX(responseText, url, img, opt, additionalPalette) {
  const data = {
    name: Parser.data(responseText)
      .from('id="pc_name"')
      .to('value="')
      .from('value="')
      .to('"')
      .build(),
    initiative: parseInt(
      Parser.data(responseText)
        .from('id="NP7"')
        .to('value="')
        .from('value="')
        .to('"')
        .build() || "0"
    ),
    hp: parseInt(
      Parser.data(responseText)
        .from('id="NP5"')
        .to('value="')
        .from('value="')
        .to('"')
        .build() || "0"
    ),
    erosion: parseInt(
      Parser.data(responseText)
        .from('id="NP6"')
        .to('value="')
        .from('value="')
        .to('"')
        .build() || "0"
    ),
    body: Parser.data(responseText)
      .from('id="NP1"')
      .to('value="')
      .from('value="')
      .to('"')
      .build(),
    sense: Parser.data(responseText)
      .from('id="NP2"')
      .to('value="')
      .from('value="')
      .to('"')
      .build(),
    mind: Parser.data(responseText)
      .from('id="NP3"')
      .to('value="')
      .from('value="')
      .to('"')
      .build(),
    social: Parser.data(responseText)
      .from('id="NP4"')
      .to('value="')
      .from('value="')
      .to('"')
      .build(),
  };

  let comboPalette = "";
  const comboData = getComboDataFromDatabase(url);
  if (comboData) {
    comboPalette = createComboPaletteFromData(comboData);
  }

  let commands = opt[1] ? createDxChapale(responseText) : "";
  if (comboPalette) {
    commands += comboPalette;
  }
  if (additionalPalette) {
    commands += "\\n" + additionalPalette;
  }

  const roiceData = createDxRoice(responseText);
  let memo = opt[0]
    ? `コードネーム：${Parser.data(responseText)
        .from('id="pc_codename"')
        .from('value="')
        .to('"')
        .build()}\\nワークス：${Parser.data(responseText)
        .from('name="works_name"')
        .from('value="')
        .to('"')
        .build()}　カヴァー：${Parser.data(responseText)
        .from('name="cover_name"')
        .from('value="')
        .to('"')
        .build()}\\n${roiceData.memo}`
    : "";

  const charJson = {
    kind: "character",
    data: {
      name: data.name,
      memo: memo,
      initiative: data.initiative,
      externalUrl: url,
      status: [
        { label: "HP", value: data.hp, max: data.hp },
        { label: "侵蝕率", value: data.erosion, max: 100 },
        { label: "ロイス", value: roiceData.value, max: roiceData.max },
      ],
      params: [
        { label: "肉体", value: data.body },
        { label: "感覚", value: data.sense },
        { label: "精神", value: data.mind },
        { label: "社会", value: data.social },
      ],
      commands: commands,
    },
  };
  if (img) charJson.data.iconUrl = img;
  return charJson;
}
function createDxChapale(html) {
  let palette =
    "【ステータス】肉体:{肉体} 感覚:{感覚} 精神:{精神} 社会:{社会}\\n";
  palette += "({肉体}+{侵蝕率D})DX+{白兵} 【肉体】〈白兵〉\\n";
  palette += "({感覚}+{侵蝕率D})DX+{射撃} 【感覚】〈射撃〉\\n";
  palette += "({精神}+{侵蝕率D})DX+{RC} 【精神】〈RC〉\\n";
  palette += "({社会}+{侵蝕率D})DX+{交渉} 【社会】〈交渉〉\\n";
  return palette;
}
function createDxRoice(html) {
  const roiceRows =
    html.match(/<td><select name="sl_roice_type"[\s\S]*?<\/tr>/g) || [];
  let roiceMemo = "😀 ロイス/😡 タイタス/💥 Dロイス/💕 Sロイス\\n";
  let roiceCount = 0,
    roiceMax = 7;
  roiceRows.forEach((row, index) => {
    const typeMatch = row.match(
      /<input type="hidden" name="roice_type\[\]" value="([^"]*)">/
    );
    const nameMatch = row.match(/id="roice_name\[\]"[^>]+value="([^"]*)"/);
    if (nameMatch && nameMatch[1]) {
      roiceCount++;
      let icon = "😀";
      if (typeMatch && typeMatch[1] === "1") {
        icon = "💥";
        roiceMax--;
      }
      if (typeMatch && typeMatch[1] === "2") {
        icon = "💕";
      }
      roiceMemo += `${index + 1}. ${icon}：${nameMatch[1]}\\n`;
    }
  });
  return { memo: roiceMemo, value: roiceCount, max: roiceMax };
}
function getEffect(responseText) {
  var names = Parser.data(responseText)
    .from('id="effect_name[]"')
    .to('value="')
    .to('"')
    .iterate();
  var levels = Parser.data(responseText)
    .from('id="effect_lv[]"')
    .to('value="')
    .to('"')
    .iterate();
  var hyou = [
    "★",
    "1",
    "2",
    "3",
    "4",
    "5",
    "○",
    "1",
    "2",
    "3",
    "◇",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];
  var formattedLevels = levels.map((lv) => {
    let index = parseInt(lv, 10);
    if (!isNaN(index) && index < hyou.length) {
      return hyou[index];
    }
    return lv;
  });
  return [names, formattedLevels];
}

// =================================================================================
// 永い後日談のネクロニカ (Nechronica) 関連 (元のロジックを忠実に復元)
// =================================================================================
function getDataNC(responseText, url, img, opt, additionalPalette) {
  // --- 元のプロジェクトのセレクタを完全に復元 ---
  const parts = {
    names: Parser.data(responseText)
      .from(
        'Power_name[]" class="str" id="Power_name[]" size="14" type="text" value="'
      )
      .to('">')
      .iterate(),
    positions: Parser.data(responseText)
      .from('name="V_Power_hantei[]" id="V_Power_hantei[]" value="')
      .to('">')
      .iterate(),
    timings: Parser.data(responseText)
      .from('name="V_Power_timing[]" id="V_Power_timing[]" value="')
      .to('">')
      .iterate(),
    costs: Parser.data(responseText)
      .from(
        'input name="Power_cost[]" id="Power_cost[]" size="3" type="text" value="'
      )
      .to('">')
      .iterate(),
    ranges: Parser.data(responseText)
      .from(
        'Power_range[]" class="method" id="Power_range[]" size="4" type="text" value="'
      )
      .to('">')
      .iterate(),
    memos: Parser.data(responseText)
      .from(
        'input name="Power_memo[]" class="str" id="Power_memo[]" size="30" type="text" value="'
      )
      .to('">')
      .iterate(),
  };

  const bui = [
    ["🟩【マニューバ名】 《タイミング / コスト / 射程》"],
    ["👧頭"],
    ["💪腕"],
    ["🧍胴"],
    ["🦵脚"],
  ];

  for (let i = 0; i < parts.names.length; i++) {
    if (!parts.names[i] || parts.names[i].includes("Power_id")) continue;
    convertBui(parts, i, bui);
  }

  let buiList =
    "未使用：🟩、使用：✅、無事：⭕、損傷：❌\\n" +
    bui[0].join("\\n") +
    "\\n" +
    bui[1].join("\\n").replace(/《.*/g, "》") +
    "\\n" +
    bui[2].join("\\n").replace(/《.*/g, "》") +
    "\\n" +
    bui[3].join("\\n").replace(/《.*/g, "》") +
    "\\n" +
    bui[4].join("\\n").replace(/《.*/g, "》");

  let commandPalette = bui
    .map((b) => b.join("\\n"))
    .join("\\n")
    .replace(/⭕/g, "");

  const mirens = {
    names: Parser.data(responseText)
      .from(
        'roice_name[]" class="str" id="roice_name[]" size="20" type="text" value="'
      )
      .to('">')
      .iterate(),
    positions: Parser.data(responseText)
      .from('roice_pos[]" id="roice_pos[]" size="16" type="hidden" value="')
      .to('">')
      .iterate(),
    damages: Parser.data(responseText)
      .from('roice_damage[]" id="roice_damage[]" type="hidden" value="')
      .to('">')
      .iterate(),
  };

  const status = [
    { label: "頭", value: bui[1].length - 1, max: bui[1].length - 1 },
    { label: "腕", value: bui[2].length - 1, max: bui[2].length - 1 },
    { label: "胴", value: bui[3].length - 1, max: bui[3].length - 1 },
    { label: "脚", value: bui[4].length - 1, max: bui[4].length - 1 },
  ];
  for (let i = 0; i < mirens.names.length; i++) {
    if (mirens.names[i] && !mirens.positions[i].includes("roice_id")) {
      status.push({
        label: `${mirens.names[i]}(${mirens.positions[i]})`,
        value: parseInt(mirens.damages[i] || 0),
        max: 4,
      });
    }
  }

  const getValue = (id) =>
    Parser.data(responseText)
      .from(`id="${id}"`)
      .to('value="')
      .from('value="')
      .to('"')
      .build();
  const getNameValue = (name) =>
    Parser.data(responseText)
      .from(`name="${name}"`)
      .to('value="')
      .from('value="')
      .to('"')
      .build();

  const hanyou =
    "\\n◆汎用\\nnm 未練表\\nnmn 中立者への未練表\\nnme 敵への未練表\\nNC+1 対話判定：\\nNC 対話判定：\\nNC-1 対話判定：\\nNC+2 狂気判定\\nNC+1 狂気判定\\nNC 狂気判定\\nNC-1 狂気判定\\nNC-2 狂気判定\\nNC+2 行動判定\\nNC+1 行動判定\\nNC 行動判定\\nNC-1 行動判定\\nNC-2 行動判定\\nNA+2 攻撃判定\\nNA+1 攻撃判定\\nNA 攻撃判定\\nNA-1 行動判定\\nNA-2 行動判定\\n◆行動値操作\\n:initiative-1\\n:initiative-2\\n:initiative-3";
  const initiative = parseInt(getValue("Act_Total") || 0);

  let memo = opt[0]
    ? `${buiList}\\n\\n基礎データ:\\n暗示：${getValue(
        "pc_carma"
      )}　享年：${getValue("age")}\\nポジション：${getNameValue(
        "Position_Name"
      )}\\nクラス：${getNameValue("MCLS_Name")}/${getNameValue(
        "SCLS_Name"
      )}\\n初期配置：${getNameValue("sex")}\\n[記憶のカケラ]\\n${Parser.data(
        responseText
      )
        .from('kakera_name[]" size="20" class="str" value="')
        .to('">')
        .iterate()
        .join("、")}`
    : "";
  let commands = opt[1]
    ? commandPalette + hanyou + "\\n:initiative=" + initiative
    : "";
  if (additionalPalette) commands += "\\n" + additionalPalette;

  const charJson = {
    kind: "character",
    data: {
      name: getName(responseText, "Nechronica", url),
      memo: memo,
      initiative: initiative,
      externalUrl: url,
      status: status,
      commands: commands,
    },
  };
  if (img) charJson.data.iconUrl = img;
  return charJson;
}

function convertBui(parts, i, bui) {
  const timing = convertTim(parts.timings[i]);
  const maneuverText = `【${parts.names[i]}】《${timing}/${
    parts.costs[i] || ""
  }/${parts.ranges[i] || ""}》${parts.memos[i] || ""}`;
  switch (parts.positions[i]) {
    case "1":
    case "2":
    case "3":
      bui[0].push("🟩" + maneuverText);
      break;
    case "4":
      bui[1].push("⭕" + maneuverText);
      break;
    case "5":
      bui[2].push("⭕" + maneuverText);
      break;
    case "6":
      bui[3].push("⭕" + maneuverText);
      break;
    case "7":
      bui[4].push("⭕" + maneuverText);
      break;
  }
}

function convertTim(x) {
  switch (x) {
    case "0":
      return "オート";
    case "1":
      return "アクション";
    case "2":
      return "ジャッジ";
    case "3":
      return "ダメージ";
    case "4":
      return "ラピッド";
    default:
      return "";
  }
}

// =================================================================================
// サタスペ 関連 (元のロジックを忠実に復元)
// =================================================================================
function getDataSata(responseText, url, img, opt, additionalPalette, charName) {
  // --- 元のプロジェクトのセレクタを完全に復元 ---
  const getValue = (id) =>
    Parser.data(responseText)
      .from(`id="${id}"`)
      .to('value="')
      .from('value="')
      .to('"')
      .build();

  let commands = opt[1] ? chapareSata(responseText) : "";
  if (additionalPalette) commands += "\\n" + additionalPalette;

  const data = {
    name: charName,
    initiative: parseInt(getValue("base.power.initiative") || 0),
    memo: opt[0] ? "サタスペのメモ" : "",
    commands: commands,
    karma: parseInt(getValue("base.emotion") || 0),
    crime: getValue("base.abl.crime.value"),
    life: getValue("base.abl.life.value"),
    love: getValue("base.abl.love.value"),
    culture: getValue("base.abl.culture.value"),
    combat: getValue("base.abl.combat.value"),
  };
  const charJson = {
    kind: "character",
    data: {
      name: data.name,
      memo: data.memo,
      initiative: data.initiative,
      externalUrl: url,
      status: [{ label: "性業値", value: data.karma, max: 13 }],
      params: [
        { label: "犯罪", value: data.crime },
        { label: "生活", value: data.life },
        { label: "恋愛", value: data.love },
        { label: "教養", value: data.culture },
        { label: "戦闘", value: data.combat },
      ],
      commands: data.commands,
    },
  };
  if (img) charJson.data.iconUrl = img;
  return charJson;
}
function chapareSata(responseText) {
  const kihon =
    "@基本\\nSR({性業値}) 性業値判定\\n({犯罪})R>=X[,1,13] 犯罪判定\\n({生活})R>=X[,1,13] 生活判定\\n({恋愛})R>=X[,1,13] 恋愛判定\\n({教養})R>=X[,1,13] 教養判定\\n({戦闘})R>=X[,1,13] 戦闘判定\\n({肉体})R>=X[,1,13] 肉体判定\\n({精神})R>=X[,1,13] 精神判定";
  return kihon;
}

// =================================================================================
// DX3コンボジェネレーター連携 新ヘルパー関数 (変更なし)
// =================================================================================
function getComboDataFromDatabase(id) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ComboData");
  if (!sheet) {
    Logger.log("Sheet 'ComboData' not found.");
    return null;
  }
  const row = findRowById(sheet, id);
  if (row > 0) {
    const dataString = sheet.getRange(row, 2).getValue();
    try {
      return JSON.parse(dataString);
    } catch (e) {
      Logger.log(`Failed to parse JSON for ID ${id}: ${e}`);
      return null;
    }
  }
  return null;
}
function createComboPaletteFromData(comboData) {
  if (!comboData || !Array.isArray(comboData.combos)) {
    return "";
  }
  const allEffects = [
    ...(comboData.effects || []),
    ...(comboData.easyEffects || []),
  ];
  const skillToAbilityMap = {
    白兵: "肉体",
    射撃: "感覚",
    RC: "精神",
    交渉: "社会",
  };
  let palette = "\\n//▼コンボデータ\\n";
  comboData.combos.forEach((combo) => {
    const relevantEffects = (combo.effectNames || [])
      .map((name) => allEffects.find((e) => e.name === name))
      .filter(Boolean);
    const compositionText = relevantEffects
      .map((e) => `《${e.name}》Lv${e.level || 1}`)
      .join("+");
    const flavorText = combo.flavor ? `『${combo.flavor}』` : "";
    const effectDescription =
      combo.effectDescriptionMode === "manual"
        ? combo.manualEffectDescription
        : relevantEffects
            .map((e) => e.effect || e.notes)
            .filter(Boolean)
            .join("\\n");
    const ability = skillToAbilityMap[combo.baseAbility.skill] || "肉体";
    const skill = combo.baseAbility.skill || "白兵";
    const diceFormula = `({${ability}}+{侵蝕率D})DX+{${skill}}`;
    palette += `◆${combo.name}\\n`;
    if (compositionText) palette += `${compositionText}\\n`;
    if (flavorText) palette += `${flavorText}\\n`;
    if (effectDescription) palette += `${effectDescription}\\n`;
    palette += `${diceFormula}\\n\\n`;
  });
  return palette.replace(/\n/g, "\\n");
}

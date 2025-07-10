// ==================================================================
// グローバル定義：スクリプト全体で使う定数と共通関数
// ==================================================================

// CSVファイルのURLをスクリプトの最上部に定義
const CHARACTER_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=1980715564&single=true&output=csv";
const SWINFO_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=1134936986&single=true&output=csv";

// システム名からCSS変数を取得する関数
function getSystemColor(tableName) {
  const systemMap = {
    CoC: "--color-coc",
    "SW2.5": "--color-sw",
    DX3: "--color-dx3",
    ネクロニカ: "--color-nechronica",
    サタスペ: "--color-satasupe",
    マモブル: "--color-mamoburu",
    銀剣: "--color-stellar",
    ウマ娘TRPG: "--color-umamusume",
    シノビガミ: "--color-shinobigami",
    "アリアンロッドRPG 2E": "--color-ar",
  };
  for (const key in systemMap) {
    if (tableName.startsWith(key)) {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue(systemMap[key])
        .trim();
      return (
        color ||
        getComputedStyle(document.documentElement)
          .getPropertyValue("--color-default")
          .trim()
      );
    }
  }
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--color-default")
    .trim();
}

// 名前の長さに応じてCSSクラスを返す共通関数
function getCharacterNameClass(name) {
  const nameLength = name ? name.length : 0;
  let nameClass = "character-name";

  if (nameLength >= 17) {
    nameClass += " name-xxl";
  } else if (nameLength >= 12) {
    nameClass += " name-xl";
  } else if (nameLength > 8) {
    nameClass += " name-l";
  } else {
    nameClass += " name-m";
  }
  return nameClass;
}

// キャラクターカードを生成してHTML要素を作成する関数
function createMainPageCharacterCard(character) {
  const card = document.createElement("div");
  card.className = "member-card";

  const quoteHtml = character.quote
    ? character.quote.replace(/\\n/g, "<br>")
    : "";
  const systemColor = getSystemColor(character.tableName);

  // 性別アイコンの決定
  let genderIcon = "fa-genderless";
  if (character.gender === "男") {
    genderIcon = "fa-mars";
  } else if (character.gender === "女") {
    genderIcon = "fa-venus";
  }

  // 年齢表示の整形
  let ageText = "年齢不明";
  if (character.age) {
    const isNumeric = /^\d+$/.test(character.age);
    ageText = isNumeric ? character.age + "歳" : character.age;
  }

  // 身長表示の整形
  let heightText = "身長不明";
  if (character.height) {
    const isNumeric = /^\d+$/.test(character.height);
    heightText = isNumeric ? character.height + "cm" : character.height;
  }

  // 登場回数表示のロジック
  let appearanceCountHtml = "";
  const count = parseInt(character.appearanceCount, 10);
  if (!isNaN(count)) {
    let tier = "1";
    if (count >= 5) {
      tier = "4";
    } else if (count >= 3) {
      tier = "3";
    } else if (count >= 2) {
      tier = "2";
    }
    appearanceCountHtml = `<div class="character-appearance-count" data-count-tier="${tier}">${count}回</div>`;
  }

  // 冒険者レベル表示のHTML
  const adventurerLevelHtml = character.adventurerLevel
    ? `<div class="adventurer-level">Lv${character.adventurerLevel}</div>`
    : "";

  const nameClass = getCharacterNameClass(character.pcName);

  const currentPath = window.location.pathname;
  const isGuildPage =
    currentPath.endsWith("247_guild/") ||
    currentPath.endsWith("247_guild/index.html");

  const jobOrRaceHtml = isGuildPage
    ? `<p class="character-job">${character.race || "種族不明"} / ${
        character.birth || "生まれ不明"
      }</p>`
    : `<p class="character-job">${character.job || "ジョブ不明"}</p>`;

  // カードのHTMLを組み立て
  card.innerHTML = `
        ${appearanceCountHtml}
        ${adventurerLevelHtml}
        ${
          isGuildPage
            ? ""
            : `<div class="character-system-tag" style="background-color: ${systemColor};">${character.tableName}</div>`
        }
        <h3 class="${nameClass}">${character.pcName}</h3>
        <div class="character-meta">
            <span class="meta-item">
                <i class="fa-solid ${genderIcon}"></i>
                <span>${character.gender}</span>
            </span>
            <span class="meta-item">
                <i class="fa-solid fa-cake-candles"></i>
                <span>${ageText}</span>
            </span>
            <span class="meta-item">
                <i class="fa-solid fa-ruler-vertical"></i>
                <span>${heightText}</span>
            </span>
        </div>
        ${jobOrRaceHtml}
        <p class="character-quote member-desc">${quoteHtml}</p>
        <p class="pl-name">PL: ${character.pl}</p>
    `;
  return card;
}

// ヘッダー行を特定し、データをオブジェクトの配列に変換する共通関数
function parseCsvWithDynamicHeader(csvText, headerIdentifier) {
  const parseResults = Papa.parse(csvText, { skipEmptyLines: true });
  const allRows = parseResults.data;

  let headerRowIndex = -1;
  let headerRow;
  for (let i = 0; i < allRows.length; i++) {
    if (allRows[i].includes(headerIdentifier)) {
      headerRowIndex = i;
      headerRow = allRows[i];
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error(
      `CSVにヘッダー行（'${headerIdentifier}'を含む行）が見つかりません。`
    );
  }

  const dataRows = allRows.slice(headerRowIndex + 1);
  const getIndex = (name) => headerRow.indexOf(name);

  return { getIndex, dataRows };
}

// ==================================================================
// メインの実行ロジック：ページが読み込まれたら処理を開始する
// ==================================================================
document.addEventListener("DOMContentLoaded", async function () {
  const currentPath = window.location.pathname;
  let containerSelector;

  if (
    currentPath.endsWith("247_guild/") ||
    currentPath.endsWith("247_guild/index.html")
  ) {
    containerSelector = "#members .member-list";
    loadAndDisplayGuildCharacters(containerSelector);
  } else if (
    currentPath.endsWith("/") ||
    currentPath.endsWith("/index.html") ||
    currentPath.endsWith("/taku_Stada/")
  ) {
    containerSelector = "#featured-adventurers .member-list";
    loadAndDisplayTopPageCharacters(containerSelector);
  }
});

// トップページ用のキャラクター表示関数
async function loadAndDisplayTopPageCharacters(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.innerHTML =
    '<p style="text-align: center; width: 100%;">キャラクター情報を読み込んでいます...</p>';

  try {
    const response = await fetch(
      `https://corsproxy.io/?${encodeURIComponent(CHARACTER_CSV_URL)}`
    );
    if (!response.ok)
      throw new Error(`CSVの取得に失敗: ${response.statusText}`);
    const csvText = await response.text();

    const { getIndex, dataRows } = parseCsvWithDynamicHeader(csvText, "PC名");

    const characters = dataRows
      .map((row) => {
        const pcName = row[getIndex("PC名")]
          ? row[getIndex("PC名")].trim()
          : "";
        if (!pcName) return null;

        let genderDisplay = "性別不明";
        const rawGender = row[getIndex("性別")]
          ? String(row[getIndex("性別")]).trim().toUpperCase()
          : "";
        if (rawGender === "TRUE") genderDisplay = "男";
        else if (rawGender === "FALSE") genderDisplay = "女";

        return {
          pcName: pcName,
          pl: row[getIndex("PL")] ? row[getIndex("PL")].trim() : "PL不明",
          gender: genderDisplay,
          age: row[getIndex("年齢")]
            ? String(row[getIndex("年齢")]).trim()
            : "",
          height: row[getIndex("身長")]
            ? String(row[getIndex("身長")]).trim()
            : "",
          job: row[getIndex("ジョブ")] ? row[getIndex("ジョブ")].trim() : "",
          quote: row[getIndex("セリフ")] ? row[getIndex("セリフ")].trim() : "",
          appearanceCount: row[getIndex("登場数")]
            ? String(row[getIndex("登場数")]).trim()
            : "0",
          adventurerLevel: row[getIndex("冒険者レベル")] || "",
          tableName: row[getIndex("卓名")]
            ? row[getIndex("卓名")].trim().normalize("NFKC")
            : "システム不明",
          race: "",
          birth: "", // トップページでは不要
        };
      })
      .filter(Boolean);

    if (characters.length === 0) {
      container.innerHTML = "<p>現在、注目のキャラクターはいません。</p>";
      return;
    }

    const shuffled = characters.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(5, shuffled.length));

    container.innerHTML = "";
    selected.forEach((char) =>
      container.appendChild(createMainPageCharacterCard(char))
    );
  } catch (error) {
    console.error("トップページキャラクター機能でエラー:", error);
    container.innerHTML =
      "<p>情報の読み込みに失敗しました。管理者にご確認ください。</p>";
  }
}

// ギルドページ用のキャラクター表示関数（データマージ機能付き）
async function loadAndDisplayGuildCharacters(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.innerHTML =
    '<p style="text-align: center; width: 100%;">キャラクター情報を読み込んでいます...</p>';

  try {
    const [charNameResponse, swInfoResponse] = await Promise.all([
      fetch(`https://corsproxy.io/?${encodeURIComponent(CHARACTER_CSV_URL)}`),
      fetch(`https://corsproxy.io/?${encodeURIComponent(SWINFO_CSV_URL)}`),
    ]);

    if (!charNameResponse.ok || !swInfoResponse.ok) {
      throw new Error("CSVファイルの片方または両方の取得に失敗しました。");
    }

    const charNameCsvText = await charNameResponse.text();
    const swInfoCsvText = await swInfoResponse.text();

    const charDetailsMap = new Map();
    const { getIndex: getCharIndex, dataRows: charDataRows } =
      parseCsvWithDynamicHeader(charNameCsvText, "PC名");
    charDataRows.forEach((row) => {
      const id = row[getCharIndex("ID")]
        ? row[getCharIndex("ID")].trim()
        : null;
      if (id) {
        let genderDisplay = "性別不明";
        const rawGender = row[getCharIndex("性別")]
          ? String(row[getCharIndex("性別")]).trim().toUpperCase()
          : "";
        if (rawGender === "TRUE") genderDisplay = "男";
        else if (rawGender === "FALSE") genderDisplay = "女";

        charDetailsMap.set(id, {
          age: row[getCharIndex("年齢")]
            ? String(row[getCharIndex("年齢")]).trim()
            : "",
          height: row[getCharIndex("身長")]
            ? String(row[getCharIndex("身長")]).trim()
            : "",
          gender: genderDisplay,
        });
      }
    });

    const { getIndex: getSwIndex, dataRows: swDataRows } =
      parseCsvWithDynamicHeader(swInfoCsvText, "キャラ名");
    const characters = swDataRows
      .map((row) => {
        const pcName = row[getSwIndex("キャラ名")]
          ? row[getSwIndex("キャラ名")].trim()
          : "";
        if (!pcName) return null;

        const id = row[getSwIndex("ID")] ? row[getSwIndex("ID")].trim() : null;
        const details = charDetailsMap.get(id) || {
          age: "",
          height: "",
          gender: "性別不明",
        };

        return {
          pcName: pcName,
          pl: row[getSwIndex("PL")] ? row[getSwIndex("PL")].trim() : "PL不明",
          race: row[getSwIndex("種族")] ? row[getSwIndex("種族")].trim() : "",
          birth: row[getSwIndex("生まれ")]
            ? row[getSwIndex("生まれ")].trim()
            : "",
          appearanceCount: row[getSwIndex("登場数")]
            ? String(row[getSwIndex("登場数")]).trim()
            : "0",
          adventurerLevel: row[getSwIndex("CL")] || "",
          tableName: row[getSwIndex("卓名")]
            ? row[getSwIndex("卓名")].trim().normalize("NFKC")
            : "システム不明",
          age: details.age,
          height: details.height,
          gender: details.gender,
          job: "",
          quote: "",
        };
      })
      .filter(Boolean);

    if (characters.length === 0) {
      container.innerHTML = "<p>現在、注目のキャラクターはいません。</p>";
      return;
    }

    const shuffled = characters.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(5, shuffled.length));

    container.innerHTML = "";
    selected.forEach((char) =>
      container.appendChild(createMainPageCharacterCard(char))
    );
  } catch (error) {
    console.error("ギルドページキャラクター機能でエラー:", error);
    container.innerHTML =
      "<p>情報の読み込みに失敗しました。管理者にご確認ください。</p>";
  }
}

// システム名からCSS変数を取得する関数
function getSystemColor(tableName) {
  const systemMap = {
    CoC: "--color-coc",
    "SW2.5": "--color-sw",
    DX3: "--color-dx3",
    ネクロニカ: "--color-nechronica",
    サタスペ: "--color-satasupe",
    マモブル: "--color-mamoburu",
    銀剣: "--color-gin剣",
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

  if (nameLength >= 20) {
    nameClass += " name-xxl";
  } else if (nameLength >= 16) {
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
  // 247_guild/index.html のカードではCSSでボーダー色を制御するため、ここでは設定しない
  // card.style.borderLeft = `5px solid ${systemColor}`;

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

  // ジョブの色はシステムカラーを反映しない
  let jobColorStyle = "";

  // 登場回数表示のロジックを更新
  let appearanceCountHtml = "";
  const count = parseInt(character.appearanceCount, 10);
  // appearanceCountが存在し、数値として有効な場合は常に表示
  if (!isNaN(count)) {
    let tier = "1"; // デフォルトの階層
    if (count >= 5) {
      tier = "4";
    } else if (count >= 3) {
      tier = "3";
    } else if (count >= 2) {
      tier = "2";
    }
    // data-count-tier属性を追加し、テキストに「回」を付与
    appearanceCountHtml = `<div class="character-appearance-count" data-count-tier="${tier}">${count}回</div>`;
  }
  // 冒険者レベル表示のHTML (clプロパティも考慮)
  const adventurerLevelHtml =
    character.adventurerLevel || character.cl
      ? `<div class="adventurer-level">Lv${
          character.adventurerLevel || character.cl
        }</div>`
      : "";
  const nameClass = getCharacterNameClass(character.pcName);
  // カードのHTMLを組み立て
  card.innerHTML = `
        ${appearanceCountHtml}
        ${adventurerLevelHtml}
        <div class="character-system-tag" style="background-color: ${systemColor};">${
    character.tableName || "システム不明"
  }</div>
        <h3 class="${nameClass}">${character.pcName || "PC名不明"}</h3>
        <div class="character-meta">
            <span class="meta-item">
                <i class="fa-solid ${genderIcon}"></i>
                <span>${character.gender || "性別不明"}</span>
            </span>
            <span class="meta-item">
                <i class="fa-solid fa-cake-candles"></i>
                <span>${ageText}</span>
            </span>
            <span class="meta-item">
                <i class="fa-solid fa-ruler-vertical"></i>
                <span>${
                  character.height ? character.height + "cm" : "身長不明"
                }</span>
            </span>
        </div>
        ${
          character.race || character.birth
            ? `<p class="character-job">${character.race || "種族不明"} / ${
                character.birth || "生まれ不明"
              }</p>`
            : ""
        }
        <p class="character-job" ${jobColorStyle}>${
    character.job || "ジョブ不明"
  }</p>
        <p class="character-quote member-desc">${quoteHtml}</p>
        <p class="pl-name">PL: ${character.pl || "PL不明"}</p>
    `;
  return card;
}

document.addEventListener("DOMContentLoaded", async function () {
  const currentPath = window.location.pathname;
  let containerSelector;
  let csvUrl;
  let sortAndSliceLogic;

  // index.html と 247_guild/index.html で異なるロジックを適用
  // GitHub Pagesでのサブディレクトリパスを考慮
  const isGitHubPages = window.location.hostname.includes("github.io");
  const basePath = isGitHubPages ? "/taku_Stada" : "";

  if (
    currentPath.endsWith("247_guild/") ||
    currentPath.endsWith("247_guild/index.html")
  ) {
    containerSelector = "#members .member-list";
    csvUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=1980715564&single=true&output=csv";
    sortAndSliceLogic = (characters) => {
      const relevantCharacters = characters.filter(
        (char) =>
          char.adventurerLevel !== "" || parseInt(char.appearanceCount, 10) > 0
      );
      relevantCharacters.sort((a, b) => {
        const levelA = parseInt(a.adventurerLevel, 10) || 0;
        const levelB = parseInt(b.adventurerLevel, 10) || 0;
        if (levelA !== levelB) {
          return levelB - levelA; // 冒険者レベルで降順
        }
        const countA = parseInt(a.appearanceCount, 10) || 0;
        const countB = parseInt(b.appearanceCount, 10) || 0;
        return countB - countA; // 登場数で降順
      });
      return relevantCharacters.slice(
        0,
        Math.min(5, relevantCharacters.length)
      );
    };
  } else if (currentPath.endsWith("/") || currentPath.endsWith("/index.html")) {
    containerSelector = "#featured-adventurers .member-list";
    csvUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=1980715564&single=true&output=csv";
    sortAndSliceLogic = (characters) => {
      const shuffled = characters.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(5, shuffled.length));
    };
  } else {
    return; // 該当するページでなければ何もしない
  }

  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.innerHTML =
    '<p style="text-align: center; width: 100%;">キャラクター情報を読み込んでいます...</p>';

  try {
    const response = await fetch(csvUrl);
    if (!response.ok)
      throw new Error(`CSVの取得に失敗: ${response.statusText}`);
    const csvText = await response.text();

    Papa.parse(csvText, {
      complete: function (results) {
        const allRows = results.data;

        const headerRow = allRows[1];
        const dataRows = allRows.slice(2);

        const getIndex = (name) => headerRow.indexOf(name);

        const characters = dataRows
          .map((row) => {
            if (row.length < headerRow.length) return null;

            const pcName = row[getIndex("PC名")]
              ? row[getIndex("PC名")].trim()
              : "";
            if (!pcName) return null;

            let genderDisplay = "性別不明";
            const rawGender = row[getIndex("性別")]
              ? String(row[getIndex("性別")]).trim().toUpperCase()
              : "";
            if (rawGender === "TRUE") {
              genderDisplay = "男";
            } else if (rawGender === "FALSE") {
              genderDisplay = "女";
            }

            const originalTableName = row[getIndex("卓名")]
              ? row[getIndex("卓名")].trim()
              : "";

            return {
              tableName: originalTableName.normalize("NFKC"),
              gender: genderDisplay,
              age: row[getIndex("年齢")]
                ? String(row[getIndex("年齢")]).trim()
                : "",
              height: row[getIndex("身長")]
                ? String(row[getIndex("身長")]).trim()
                : "",
              pcName: pcName,
              pl: row[getIndex("PL")] ? row[getIndex("PL")].trim() : "",
              job: row[getIndex("ジョブ")]
                ? row[getIndex("ジョブ")].trim()
                : "",
              quote: row[getIndex("セリフ")]
                ? row[getIndex("セリフ")].trim()
                : "",
              appearanceCount: row[getIndex("登場数")]
                ? String(row[getIndex("登場数")]).trim()
                : "0",
              adventurerLevel: row[getIndex("冒険者レベル")]
                ? String(row[getIndex("冒険者レベル")]).trim()
                : "",
            };
          })
          .filter(Boolean);

        if (characters.length === 0) {
          container.innerHTML = "<p>現在、注目のキャラクターはいません。</p>";
          return;
        }

        const selected = sortAndSliceLogic(characters);

        container.innerHTML = "";
        selected.forEach((char) => {
          const card = createMainPageCharacterCard(char);
          container.appendChild(card);
        });
      },
    });
  } catch (error) {
    console.error(`キャラクター機能(${currentPath})でエラー:`, error);
    container.innerHTML = "<p>情報の読み込みに失敗しました。</p>";
  }
});

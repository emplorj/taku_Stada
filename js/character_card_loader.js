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
          const card = window.createMainPageCharacterCard(char);
          container.appendChild(card);
        });
      },
    });
  } catch (error) {
    console.error(`キャラクター機能(${currentPath})でエラー:`, error);
    container.innerHTML = "<p>情報の読み込みに失敗しました。</p>";
  }
});

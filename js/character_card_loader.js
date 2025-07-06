document.addEventListener("DOMContentLoaded", async function () {
  const currentPath = window.location.pathname;
  let containerSelector;
  let csvUrl;
  let sortAndSliceLogic;

  // index.html と 247_guild/index.html で異なるロジックを適用
  if (currentPath.includes("247_guild/index.html")) {
    containerSelector = "#members .member-list";
    csvUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQhgIEZ9Z_LX8WIuXqb-95vBhYp5-lorvN7EByIaX9krIk1pHUC-253fRW3kFcLeB2nF4MIuvSnOT_H/pub?gid=1980715564&single=true&output=csv";
    sortAndSliceLogic = (characters) => {
      const adventurersWithLevel = characters.filter(
        (char) => char.adventurerLevel !== ""
      );
      adventurersWithLevel.sort(
        (a, b) =>
          parseInt(b.adventurerLevel, 10) - parseInt(a.adventurerLevel, 10)
      );
      return adventurersWithLevel.slice(
        0,
        Math.min(5, adventurersWithLevel.length)
      );
    };
  } else if (currentPath.includes("index.html") || currentPath === "/") {
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

// index.html のその他のDOMContentLoadedイベントリスナーをここに移動
document.addEventListener("DOMContentLoaded", () => {
  // --- 色リスト生成 ---
  const colorListContainer = document.getElementById("trpg-color-list");
  if (colorListContainer) {
    const systemsToShow = [
      {
        displayName: "クトゥルフ神話TRPG",
        colorNameDesc: "緑",
        cssVar: "--color-coc",
      },
      {
        displayName: "クトゥルフ神話TRPG(秘匿)",
        colorNameDesc: "濃緑",
        cssVar: "--color-coc-secret",
      },
      {
        displayName: "ソード・ワールド2.5",
        colorNameDesc: "薄赤",
        cssVar: "--color-sw",
      },
      {
        displayName: "ダブルクロス The 3rd Edition",
        colorNameDesc: "赤",
        cssVar: "--color-dx3",
      },
      {
        displayName: "永い後日談のネクロニカ",
        colorNameDesc: "灰",
        cssVar: "--color-nechronica",
      },
      {
        displayName: "サタスペ",
        colorNameDesc: "オレンジ",
        cssVar: "--color-satasupe",
      },
      {
        displayName: "マモノスクランブル",
        colorNameDesc: "黄橙",
        cssVar: "--color-mamoburu",
      },
      {
        displayName: "銀剣のステラナイツ",
        colorNameDesc: "暗い青",
        cssVar: "--color-gin剣",
      },
      {
        displayName: "ウマ娘TRPG",
        colorNameDesc: "桃",
        cssVar: "--color-umamusume",
      },
      {
        displayName: "シノビガミ",
        colorNameDesc: "紫",
        cssVar: "--color-shinobigami",
      },
      {
        displayName: "アリアンロッドRPG 2E",
        colorNameDesc: "黄色",
        cssVar: "--color-ar",
      },
    ];
    systemsToShow.forEach((sys) => {
      const style = getComputedStyle(document.documentElement);
      const colorCode =
        style.getPropertyValue(sys.cssVar).trim() ||
        style.getPropertyValue("--color-default").trim();
      const listItem = document.createElement("li");
      listItem.classList.add("color-list-item");
      listItem.innerHTML = `<span class="color-list-text">${sys.displayName}：（${sys.colorNameDesc}）</span> <span class="color-chip" style="background-color: ${colorCode};"></span> <code>${colorCode}</code> <button class="copy-color-button" data-colorcode="${colorCode}" title="カラーコードをコピー">コピー</button>`;
      colorListContainer.appendChild(listItem);
    });
    colorListContainer.addEventListener("click", function (event) {
      const button = event.target.closest(".copy-color-button");
      if (button) {
        navigator.clipboard.writeText(button.dataset.colorcode).then(() => {
          const originalText = button.textContent;
          button.textContent = "OK!";
          button.disabled = true;
          setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
          }, 1500);
        });
      }
    });
  }

  // --- ロゴクリックイベント ---
  const mainLogo = document.getElementById("main-logo");
  const miniLogo = document.getElementById("mini-logo");

  if (mainLogo) {
    mainLogo.addEventListener("click", function () {
      window.location.href = "sutada_chara.html";
    });
  }

  if (miniLogo) {
    miniLogo.addEventListener("click", function () {
      window.location.href = "sutada_chara.html#coc-mini-section"; // miniCoCのセクションIDに合わせる
    });
  }

  // --- OGPカードリスト生成 ---
  const toolData = [
    {
      category: "試し振りなど",
      url: "https://ccfolia.com/rooms/6584j5uuj",
      title: "楽屋ココフォリア",
      author: "おれ・ココフォリア",
      manual: true,
      description: "ココフォリアの公式ルームです。",
      icon: "fa-solid fa-dice-d20",
    },
    {
      category: "キャラクターシート",
      url: "https://kurian.websozai.jp/charaPiece/top",
      title: "キャラシコピペツール (CoC, SW等)",
      author: "@Kuuriku_Sora",
      manual: true,
      description: "各種キャラクターシートをココフォリア用に整形します。",
      icon: "fa-solid fa-paste",
    },
    {
      category: "キャラクターシート",
      url: "https://script.google.com/macros/s/AKfycbwUPjuiBEGUrfrKcKZCrRAqiB7V687tbA5uxy7PbKxSkgMGnoIMob7yK0PNEvBoUcbTTA/exec",
      title: "キャラシコピペツール (DX3rd, サタスペ等)",
      author: "おれ",
      manual: true,
      description: "Google Apps Script製のキャラクターシート整形ツール。",
      icon: "fa-solid fa-file-lines",
    },
    {
      category: "キャラクターシート",
      url: "https://docs.google.com/spreadsheets/d/1jMnjoqxiJZanm6L9-HsXw1crxBdQB_SZQgM4O8Tk7MM/",
      title: "ダブルクロス コンボジェネレーター",
      author: "おれ",
      manual: true,
      description: "Googleスプレッドシート上で動作するコンボビルダー。",
      icon: "fa-solid fa-table-cells",
    },
    {
      category: "キャラクターシート",
      url: "https://docs.google.com/presentation/d/1ZHHNs_yR37joGYSBiYfQ_C_mwmhdFNHmxkA7fItBkKs/edit#slide=id.g2710a927f4d_0_5",
      title: "ダブルクロス コンボジェネレーター (説明)",
      author: "おれ",
      manual: true,
      description: "コンボジェネレーターの使い方を解説したスライド。",
      icon: "fa-solid fa-person-chalkboard",
    },
    {
      category: "ログ・テキスト整形",
      url: "https://sirubedon.github.io/ccfolia-log-to-xlsx/",
      title: "ココフォリアログ→Excel変換",
      author: "しるべ",
      manual: true,
      description: "ココフォリアのログをExcel形式に変換します。",
      icon: "fa-solid fa-file-excel",
    },
    {
      category: "ログ・テキスト整形",
      url: "https://sirubedon.github.io/CCfoliaLogConverterWithImages/",
      title: "ココフォリア/Tekeyログ整形 (画像埋込)",
      author: "しるべ",
      manual: true,
      description: "ログに画像サムネイルを埋め込んで整形します。",
      icon: "fa-solid fa-image",
    },
    {
      category: "立ち絵",
      url: "https://x.com/qxoiUioxp/status/1898323502731796480",
      title: "動画→動く画像(APNG)変換",
      author: "しるべ",
      manual: true,
      description: "動画ファイルをAPNG形式にオンラインで変換します。",
      icon: "fa-solid fa-film",
    },
    {
      category: "アフタープレイ",
      url: "https://x.com/qxoiUioxp/status/1898323502731796480",
      title: "卓報告ジェネレーター",
      author: "しるべ vs ダスト",
      manual: true,
      description: "SNSで報告するためのテンプレを作ります。",
      icon: "fa-brands fa-twitter",
    },
  ];

  const toolCardContainer = document.getElementById("tool-card-list-container");

  if (toolCardContainer) {
    const groupedByCategory = toolData.reduce((acc, tool) => {
      const category = tool.category || "その他";
      if (!acc[category]) acc[category] = [];
      acc[category].push(tool);
      return acc;
    }, {});

    for (const category in groupedByCategory) {
      const categoryHeader = document.createElement("h3");
      categoryHeader.className = "tool-author-header"; // Re-use style
      categoryHeader.textContent = category;
      toolCardContainer.appendChild(categoryHeader);

      const categoryToolList = document.createElement("ul");
      categoryToolList.className = "tool-card-list";

      groupedByCategory[category].forEach((tool) => {
        const wrapper = document.createElement("li");
        wrapper.className = "ogp-card-wrapper";

        const cardPlaceholder = document.createElement("div");

        if (tool.manual) {
          renderManualCard(tool, cardPlaceholder);
        } else {
          cardPlaceholder.className = "ogp-card";
          cardPlaceholder.innerHTML = `<a href="${tool.url}" target="_blank" rel="noopener noreferrer"><div class="ogp-card-content"><p>読み込み中...</p></div></a>`;
          fetchOgpData(tool.url, cardPlaceholder);
        }

        wrapper.appendChild(cardPlaceholder);
        categoryToolList.appendChild(wrapper);
      });
      toolCardContainer.appendChild(categoryToolList);
    }
  }

  // --- Schedule Links Generation ---
  const scheduleData = [
    {
      url: "https://character-sheets.appspot.com/schedule/list?key=ahVzfmNoYXJhY3Rlci1zaGVldHMtbXByHAsSEkRpc2NvcmRTZXNzaW9uRGF0YRimu5y4BQw",
      title: "デイコード",
      description:
        "キャラシサイトと連携した日程調整ツール。予定の入力はこちらから。",
      icon: "fa-solid fa-calendar-plus",
      manual: true,
    },
  ];

  const scheduleLinksContainer = document.getElementById(
    "schedule-links-container"
  );

  if (scheduleLinksContainer) {
    scheduleData.forEach((item) => {
      const wrapper = document.createElement("li");
      wrapper.className = "ogp-card-wrapper";
      const cardPlaceholder = document.createElement("div");
      renderManualCard(item, cardPlaceholder);
      wrapper.appendChild(cardPlaceholder);
      scheduleLinksContainer.appendChild(wrapper);
    });
  }

  // --- Archive Links Generation ---
  const archiveData = [
    {
      url: "https://docs.google.com/spreadsheets/d/17wStGJ37GjaINrjZMFZgmacYOPeH9F8ZiahhtJd_nxI/",
      title: "スプレッドシート",
      description:
        "卓の履歴や、キャラのまとめ、PLの所持ルールブックなんかをここに記す",
      icon: "img/spreadsheet.svg",
      manual: true,
    },
    {
      url: "https://www.dropbox.com/scl/fo/lnuvslrnsqqyye3ka3dfa/APfMlkTTNNrt9Lgnx5sOOVA?rlkey=t5ltutxf80yqz8p499dae7loj&dl=0",
      title: "ログ置き場（Dropbox）",
      description:
        "終わったシナリオのログが一元的にみられたらいいねってところ。(Discord: 該当チャンネル)",
      icon: "fa-brands fa-dropbox",
      manual: true,
    },
  ];

  const archiveLinksContainer = document.getElementById(
    "archive-links-container"
  );

  if (archiveLinksContainer) {
    archiveData.forEach((item) => {
      const wrapper = document.createElement("li");
      wrapper.className = "ogp-card-wrapper";
      const cardPlaceholder = document.createElement("div");
      renderManualCard(item, cardPlaceholder); // Use renderManualCard for these
      wrapper.appendChild(cardPlaceholder);
      archiveLinksContainer.appendChild(wrapper);
    });
  }

  // --- Content Policy Link Generation ---
  const contentPolicyData = [
    {
      url: "https://booth.pm/ja/items/3432975",
      title: "細かすぎる地雷チェックシート",
      description:
        "セッション前に参加者間の認識を合わせるため、弊社では規定のものとして下記シートの使用を推奨しています。",
      icon: "fa-solid fa-file-shield",
      manual: true,
    },
  ];

  const contentPolicyContainer = document.getElementById(
    "content-policy-container"
  );

  if (contentPolicyContainer) {
    contentPolicyData.forEach((item) => {
      const wrapper = document.createElement("li");
      wrapper.className = "ogp-card-wrapper";
      const cardPlaceholder = document.createElement("div");
      renderManualCard(item, cardPlaceholder);
      wrapper.appendChild(cardPlaceholder);
      contentPolicyContainer.appendChild(wrapper);
    });
  }

  // --- CoC Q&A Links Generation ---
  const cocQaData = [
    {
      url: "https://docs.google.com/spreadsheets/d/1MifivHkro_g2S_9QFYJoCa4eBaSNw-JqoEexGCEr41w/edit?usp=sharing",
      title: "シナリオテンプレ／CoC",
      description:
        "クトゥルフ神話TRPGのシナリオ作成用テンプレート。（作：あばれぢから）",
      icon: "fa-solid fa-file-pen",
      manual: true,
    },
    {
      url: "https://docs.google.com/spreadsheets/d/1W5Hhm-GpknEec8vKPIqxfWGl8JADwY5Dj_3b33m45aA/",
      title: "シナリオテンプレ／DX3rd",
      description: "ダブルクロス3rdのシナリオ作成用テンプレート。",
      icon: "fa-solid fa-file-pen",
      manual: true,
    },
  ];

  const cocQaLinksContainer = document.getElementById("coc-qa-links-container");

  if (cocQaLinksContainer) {
    cocQaData.forEach((item) => {
      const wrapper = document.createElement("li");
      wrapper.className = "ogp-card-wrapper";
      const cardPlaceholder = document.createElement("div");
      renderManualCard(item, cardPlaceholder);
      wrapper.appendChild(cardPlaceholder);
      cocQaLinksContainer.appendChild(wrapper);
    });
  }
});

(function () {
  const STORAGE_KEY = "satasupeEnemySheetsV1";
  const AUTHOR_STORAGE_KEY = "satasupeEnemiesAuthor";
  const API_STORAGE_KEY = "satasupeEnemiesApiUrl";
  const LAST_SELECTED_ID_KEY = "satasupeEnemiesLastSelectedId";
  const DEFAULT_GAS_WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbxMR7f_pOi14SsAuKvu7YxKVBQZ69dn-TeQpMBxyYzo_pwZmICNZ06cSb8BKQYCM0GuGg/exec";

  const state = {
    sheets: [],
    selectedId: null,
    dirty: false,
    query: "",
    searchField: "all",
    sortMode: "updatedAt",
    sortDir: "desc",
    page: 1,
    pageSize: 10,
  };
  const localUnsavedSheetIds = new Set();

  const el = {
    enemyList: document.getElementById("enemyList"),
    enemySearchInput: document.getElementById("enemySearchInput"),
    enemyEditorForm: document.getElementById("enemyEditorForm"),
    saveStatusText: document.getElementById("saveStatusText"),
    newEnemyButton: document.getElementById("newEnemyButton"),
    saveEnemyButton: document.getElementById("saveEnemyButton"),
    saveAsEnemyButton: document.getElementById("saveAsEnemyButton"),
    deleteEnemyButton: document.getElementById("deleteEnemyButton"),
    exportJsonButton: document.getElementById("exportJsonButton"),
    exportKomaJsonButton: document.getElementById("exportKomaJsonButton"),
    importJsonInput: document.getElementById("importJsonInput"),
    addWeaponButton: document.getElementById("addWeaponButton"),
    addOutfitButton: document.getElementById("addOutfitButton"),
    addVehicleButton: document.getElementById("addVehicleButton"),
    addKarmaButton: document.getElementById("addKarmaButton"),
    addKarmaTalentButton: document.getElementById("addKarmaTalentButton"),
    addKarmaPriceButton: document.getElementById("addKarmaPriceButton"),
    addKarmaPairButton: document.getElementById("addKarmaPairButton"),
    addHistoryButton: document.getElementById("addHistoryButton"),
    weaponsBody: document.getElementById("weaponsBody"),
    outfitsBody: document.getElementById("outfitsBody"),
    vehiclesBody: document.getElementById("vehiclesBody"),
    karmaBody: document.getElementById("karmaBody"),
    historyBody: document.getElementById("historyBody"),
    hobbiesInput: document.getElementById("field-hobbies"),
    hobbyChips: document.getElementById("hobbyChips"),
    randomLikeAgeButton: document.getElementById("randomLikeAgeButton"),
    randomNpcAgeButton: document.getElementById("randomNpcAgeButton"),
    npcAgePresetSelect: document.getElementById("npcAgePresetSelect"),
    openHobbyPickerButton: document.getElementById("openHobbyPickerButton"),
    hobbyDiceGridToggle: document.getElementById("hobbyDiceGridToggle"),
    hobbyPickerPanel: document.getElementById("hobbyPickerPanel"),
    hobbyPickerList: document.getElementById("hobbyPickerList"),
    hobbyBaseCount: document.getElementById("hobbyBaseCount"),
    karmaEffectLineModeSelect: document.getElementById(
      "karmaEffectLineModeSelect",
    ),
    enemySearchField: document.getElementById("enemySearchField"),
    sortByIdButton: document.getElementById("sortByIdButton"),
    sortByTimeButton: document.getElementById("sortByTimeButton"),
    sortByDangerButton: document.getElementById("sortByDangerButton"),
    sortByKarmaButton: document.getElementById("sortByKarmaButton"),
    sortByAuthorButton: document.getElementById("sortByAuthorButton"),
    sortByCategoryButton: document.getElementById("sortByCategoryButton"),
    enemyPageSizeInput: document.getElementById("enemyPageSizeInput"),
    enemyShowAllButton: document.getElementById("enemyShowAllButton"),
    enemyShowTenButton: document.getElementById("enemyShowTenButton"),
    enemyPagerInfo: document.getElementById("enemyPagerInfo"),
    enemyPrevButton: document.getElementById("enemyPrevButton"),
    enemyNextButton: document.getElementById("enemyNextButton"),
    fieldAuthor: document.getElementById("field-author"),
    fieldIsPublic: document.getElementById("field-is-public"),
    fieldIsPublicText: document.getElementById("field-is-public-text"),
    toggleLanguageManualButton: document.getElementById(
      "toggleLanguageManualButton",
    ),
  };

  let draggingRowState = { kind: "", index: -1 };

  function formatShortDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const r = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const i = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${y}/${m}/${r} ${h}:${i}:${s}`;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function autoResizeTextarea(textarea) {
    if (!textarea || textarea.tagName.toLowerCase() !== "textarea") return;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }
  const body = document.body;
  if (!body || !body.classList.contains("satasupe-enemies-page")) return;

  const ENV_EXP_TABLE = [0, 1, 2, 4, 6, 9, 13, 18, 25, 33];
  const GIFT_EXP_TABLE = [0, 0, 0, 1, 2, 4, 10, 18, 30, 52];
  const HOBBY_GRID_6 = [
    ["イベント", "音楽", "アラサガシ", "アウトドア", "育成", "アダルト"],
    [
      "アブノーマル",
      "好きなタグ",
      "おせっかい",
      "工作",
      "サビシガリヤ",
      "飲食",
    ],
    [
      "カワイイ",
      "トレンド",
      "好きなタグ",
      "スポーツ",
      "ヒマツブシ",
      "ギャンブル",
    ],
    ["トンデモ", "読書", "家事", "同一のタグ", "宗教", "ゴシップ"],
    [
      "マニア",
      "パフォーマンス",
      "ガリ勉",
      "ハイソ",
      "同一のタグ",
      "ファッション",
    ],
    ["ヲタク", "美術", "健康", "旅行", "ワビサビ", "ハプニング"],
  ];
  const HOBBY_GRID_5 = [
    ["エクストリーム", "カワイイ", "トンデモ", "マニア", "ヲタク"],
    ["音楽", "トレンド", "読書", "パフォーマンス", "美術"],
    ["アラサガシ", "おせっかい", "家事", "ガリ勉", "健康"],
    ["アウトドア", "工作", "スポーツ", "ハイソ", "旅行"],
    ["育成", "サビシガリヤ", "ヒマツブシ", "宗教", "ワビサビ"],
    ["アダルト", "飲食", "ギャンブル", "ゴシップ", "ファッション"],
  ];
  const HOBBY_COLOR_CLASSES = [
    "bg-pink",
    "bg-blue",
    "bg-gray",
    "bg-yellow",
    "bg-green",
    "bg-purple",
  ];
  const MONSTER_KARMA_PRESET_BY_CATEGORY = {
    一般人: {
      talent: {
        name: "【通報】",
        use: "常駐",
        target: "自分",
        judge: "〔犯罪〕そのエリアの治安",
        effect:
          "このキャラクターを殺したキャラクターは検挙され、「臭い飯」表を振ることになる。ただし、殺したキャラクターかその仲間が上記の判定を行えば、検挙迄のターンを成功度の分だけ遅延することが出来る。シナリオが終了した場合、「臭い飯表」を振らなくても良い",
      },
    },
    迷惑: {
      talent: {
        name: "【追跡】",
        use: "常駐",
        target: "自分",
        judge: "なし",
        effect:
          "対象の行動に割り込んで使用できる。対象からは見えず、しかし対象を見ることが出来る場所にいることが出来る。この効果は、新たに対象にアクションを起こすか、セッション終了まで継続する。",
      },
    },
    チンピラ: {
      talent: {
        name: "【群れ】",
        use: "常駐",
        target: "自分",
        judge: "なし",
        effect:
          "このキャラクターは「跳ぶ」を組み合わせていないセーブ判定を行うとき、サイコロを振らず自動的に成功度が1となる。ただし、「必殺」で発生した10点のダメージに、この異能を使用することはできない。また、命中判定を行うとき、サイコロを振らず自動的に成功度を1にすることができる。",
      },
    },
    刺客: {
      talent: {
        name: "【歴戦】",
        use: "常駐",
        target: "自分",
        judge: "なし",
        effect:
          "血戦中、移動を行ってないラウンドは、(精神点)を1D6点消費すれば、セーブ判定を行う代わりに、自分の〔肉体〕と同じ値だけダメージを減少することができる。ただし、「必殺」で発生した10点のダメージに、この異能を使用することはできない。",
      },
    },
    戦場の狼: {
      talent: {
        name: "【歴戦】",
        use: "常駐",
        target: "自分",
        judge: "なし",
        effect:
          "血戦中、移動を行ってないラウンドは、(精神点)を1D6点消費すれば、セーブ判定を行う代わりに、自分の〔肉体〕と同じ値だけダメージを減少することができる。ただし、「必殺」で発生した10点のダメージに、この異能を使用することはできない。",
      },
    },
    獣: {
      talent: {
        name: "【野生】",
        use: "常駐",
        target: "自分",
        judge: "なし",
        effect:
          "このキャラクターの攻撃によって、〔肉体点〕が0になったキャラクターは、致命傷表を振らず、必ず死亡する。",
      },
    },
    超級英雄: {
      talent: {
        name: "【超人】",
        use: "常駐",
        target: "自分",
        judge: "なし",
        effect:
          "このキャラクターの(肉体点)の最大値は10+(〔肉体)、(精神点)の最大値は10+(精神)の値となる。そして、【超人】は常にスターである。",
      },
    },
    都市伝説: {
      talent: {
        name: "【非現実の恐怖】",
        use: "常駐",
        target: "自分",
        judge: "【精神】難易度9",
        effect:
          "そのゲーム中、このキャラクターと同じモンスター名のキャラクターを初めて見たキャラクターは【精神】で難易度9の判定を行う。失敗したキャラクターは、〔精神点〕を1D6点失う",
      },
    },
    リーダー: {
      talent: {
        name: "【チームワーク】",
        use: "補助",
        target: "自分",
        judge: "〔性業値〕",
        effect:
          "行為判定の時に使用する。使用者と選ばれたキャラクターは〔性業値〕判定を行い、同じ結果が出た人数だけ、組み合わせた判定の難易度を減少させる。ただし、誰か一人でも「迷」を出すと、その判定はファンブルとなる。",
      },
      price: {
        name: "【使命】",
        use: "常駐",
        target: "自分",
        judge: "なし",
        effect:
          "セッション終了時に、ミッションをクリアできていない場合、トラウマを1点受ける。ミッションの成否は、DDが決定する。",
      },
    },
    参謀: {
      talent: {
        name: "【応援】",
        use: "割り込み",
        target: "自分以外の単体",
        judge: "なし",
        effect:
          "誰かの判定に割り込んで使用する。その判定の難易度を-1する。【応援】で割り込んで判定が失敗すると、使用者の〔精神点〕が1点減少する。",
      },
      price: {
        name: "【胃痛】",
        use: "常駐",
        target: "自分",
        judge: "なし",
        effect: "チームの仲間がファンブルするたびに〔精神点〕が1点減少する。",
      },
    },
    技術屋: {
      talent: {
        name: "【意地】",
        use: "常駐",
        target: "自分",
        judge: "なし",
        effect:
          "【意地】を修得したときに、〔環境値〕の中から好きなものを1種類選ぶ。その〔環境値〕を使った行為判定を行うとき、難易度がその〔環境値〕+7点以下であれば、サイコロを振る代わりに〔精神点〕を3点消費して、自動的に成功度1を獲得することができる（6点以上消費しても成功度2以上にはならない）。",
      },
      price: {
        name: "【誇り】",
        use: "常駐",
        target: "自分",
        judge: "なし",
        effect:
          "【意地】で選んだ環境値の行為判定に失敗したとき、〔精神点〕が1点減少する。",
      },
    },
    荒事屋: {
      talent: {
        name: "【修羅場】",
        use: "常駐",
        target: "自分",
        judge: "なし",
        effect:
          "モラル判定が必要になったとき、その判定に自動的に成功することができる。また、重傷の間は、自分の命中判定の難易度から-1することができる。",
      },
      price: {
        name: "【弱肉強食】",
        use: "常駐",
        target: "自分",
        judge: "なし",
        effect:
          "〔戦闘〕の値が自分未満のキャラクターに対するロマンスや交渉の判定は成功度から-1される。また、彼らの反応は最初から一段階悪くなる。",
      },
    },
    マネージャー: {
      talent: {
        name: "【やりくり】",
        use: "支援",
        target: "自分",
        judge: "なし",
        effect:
          "買い物をするとき、〔サイフ〕を1点消費する代わりに、〔精神点〕を1d6点消費することでそのアイテムを買うことができる。【やりくり】を使って買い物した場合、おつりをもらうことはできない。",
      },
      price: {
        name: "【守銭奴】",
        use: "終了時",
        target: "自分",
        judge: "なし",
        effect:
          "セッション終了時に〔サイフ〕が1点でも減少していると、トラウマを1点受ける。",
      },
    },
    道化師: {
      talent: {
        name: "【邪魔】",
        use: "割り込み",
        target: "単体",
        judge: "なし",
        effect:
          "誰かの判定に割り込んで使用する。その判定の難易度を+1する。【邪魔】で割り込んで判定が成功すると、使用者の〔精神点〕が1点減少する。",
      },
      price: {
        name: "【疫病神】",
        use: "常駐",
        target: "自分",
        judge: "なし",
        effect: "ファンブル率が1上昇する。",
      },
    },
  };

  function applyMonsterKarmaPresetByCategory(sheet, category) {
    if (!sheet) return;
    if (!sheet.meta || typeof sheet.meta !== "object") sheet.meta = {};
    if (!Array.isArray(sheet.karma)) sheet.karma = [];

    const preset = MONSTER_KARMA_PRESET_BY_CATEGORY[category];
    if (!preset) return;

    // 「未編集の状態のプリセット行」のみを削除（フィルタリング）する
    // これにより、ユーザーが少しでも書き換えた行はリストに残る
    sheet.karma = sheet.karma.filter((row) => !isCategoryPresetRow(row));

    const newRows = [];
    if (preset.talent) {
      const talentRow = createKarmaRow();
      talentRow._isCategoryKarmaRow = true;
      talentRow.kind = "異能";
      talentRow.category = category;
      talentRow.name = preset.talent.name;
      talentRow.use = preset.talent.use;
      talentRow.target = preset.talent.target;
      talentRow.judge = preset.talent.judge;
      talentRow.effect = preset.talent.effect;
      newRows.push(talentRow);
    }

    if (preset.price) {
      const priceRow = createKarmaRow();
      priceRow._isCategoryKarmaRow = true;
      priceRow.kind = "代償";
      priceRow.category = category;
      priceRow.name = preset.price.name;
      priceRow.use = preset.price.use;
      priceRow.target = preset.price.target;
      priceRow.judge = preset.price.judge;
      priceRow.effect = preset.price.effect;
      newRows.push(priceRow);
    }

    // 新しいプリセットを一番上に、残った（編集済みを含む）行をその下に結合
    sheet.karma = [...newRows, ...sheet.karma];
  }
  const HOBBY_COLOR_CLASS_BY_NAME = (() => {
    const map = new Map();
    const addFromTable = (table) => {
      if (!Array.isArray(table)) return;
      table.forEach((row, rIndex) => {
        const colorClass =
          HOBBY_COLOR_CLASSES[rIndex % HOBBY_COLOR_CLASSES.length];
        if (!Array.isArray(row)) return;
        row.forEach((name) => {
          const key = String(name || "").trim();
          if (!key || map.has(key)) return;
          map.set(key, colorClass);
        });
      });
    };
    addFromTable(HOBBY_GRID_6);
    addFromTable(HOBBY_GRID_5);
    return map;
  })();
  const LIKE_TYPE_OPTIONS = [
    "ダークな",
    "お金持ちな",
    "美形な",
    "知的な",
    "ワイルドな",
    "バランスが取れてる",
  ];
  const ZERO_FLOOR_FIELDS = new Set([
    "ability.crime",
    "ability.life",
    "ability.love",
    "ability.culture",
    "ability.combat",
    "ability.body",
    "ability.mind",
    "ability.powerInit",
    "ability.powerAtk",
    "ability.powerDes",
  ]);
  const LIKE_DETAIL_OPTIONS = ["年下", "同い年", "年上"];
  const NPC_AGE_CHART = [
    { key: "child", label: "幼年", base: 6, dice: 2 },
    { key: "boy", label: "少年", base: 10, dice: 2 },
    { key: "young", label: "青年", base: 15, dice: 3 },
    { key: "middle", label: "中年", base: 25, dice: 4 },
    { key: "mature", label: "壮年", base: 40, dice: 5 },
    { key: "old", label: "老人", base: 60, dice: 6 },
  ];
  const LANGUAGE_PRESET_BY_CULTURE = [
    "オオサカベンと母国語の会話のみ",
    "母国語の読み書き＆オオサカベンの会話のみ",
    "母国語＆オオサカベン",
    "母国語＆オオサカベン＆1か国語",
    "母国語＆オオサカベン＆2か国語",
    "母国語＆オオサカベン＆3か国語",
    "世界中の言語を操る",
    "未知の言語の読み書き会話も可能",
  ];

  function nowText() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${y}/${m}/${day} ${h}:${min}:${s}`;
  }

  function getNextSequentialId() {
    return `new-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  function randInt(min, max) {
    const a = Number(min);
    const b = Number(max);
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  function pickRandom(values) {
    if (!Array.isArray(values) || !values.length) return "";
    const i = randInt(0, values.length - 1);
    return String(values[i] || "");
  }

  function normalizeSexValue(value) {
    const s = String(value == null ? "" : value).trim();
    if (s === "男" || s === "男性") return "男";
    if (s === "女" || s === "女性") return "女";
    return "？";
  }

  function rollNpcAgeByPreset(presetKey) {
    const key = String(presetKey || "random").trim();
    let rule = null;
    if (key === "random") {
      const tableIndex = randInt(0, NPC_AGE_CHART.length - 1);
      rule = NPC_AGE_CHART[tableIndex] || NPC_AGE_CHART[2];
    } else {
      rule = NPC_AGE_CHART.find((x) => String(x.key) === key) || null;
      if (!rule) {
        const fallbackIndex = randInt(0, NPC_AGE_CHART.length - 1);
        rule = NPC_AGE_CHART[fallbackIndex] || NPC_AGE_CHART[2];
      }
    }
    let add = 0;
    for (let i = 0; i < Number(rule.dice) || 0; i += 1) {
      add += randInt(1, 6);
    }
    return (Number(rule.base) || 0) + add;
  }

  function createSheetTemplate() {
    const sheet = {
      id: getNextSequentialId(),
      author: "",
      is_public: true,
      name: "",
      nameKana: "",
      createdAt: nowText(),
      updatedAt: nowText(),
      base: {
        homeland: "",
        sex: "？",
        age: "",
        style: "",
        team: "",
        surface: "",
        alliance: "",
        hierarchy: "",
        likes: "",
        dislikes: "",
      },
      ability: {
        crime: 1,
        life: 1,
        love: 1,
        culture: 1,
        combat: 1,
        body: 1,
        mind: 1,
        powerInit: 1,
        powerAtk: 1,
        powerDes: 1,
      },
      condition: {
        bp: 10,
        mp: 10,
        wallet: 10,
      },
      home: {
        place: "",
        comfortable: 10,
        security: 10,
      },
      weapons: [createWeaponRow()],
      outfits: [createOutfitRow()],
      vehicles: [createVehicleRow()],
      karma: [],
      history: [],
      memo: "",
      meta: {
        danger: 0,
        dangerLevel: "0",
        karmaValue: 7,
        reaction: "中立",
        size: "中",
        category: "一般人",
        quote: "",
        hobbies: "",
        likeType: "",
        likeDetail: "",
        garbageTable: "ガラクタ表",
        expConv: 0,
        karmaCount: 0,
        priceCount: 0,
        powerBase: 3,
        powerRemain: 3,
        languages: "",
        languageManual: false,
      },
    };
    applyMonsterKarmaPresetByCategory(sheet, sheet.meta.category);
    sheet._originalString = JSON.stringify(sheet);
    return sheet;
  }

  function stripOuterBrackets(text) {
    let t = normalizeText(text);
    while (t.startsWith("【") && t.endsWith("】") && t.length >= 2) {
      t = t.slice(1, -1).trim();
    }
    return t;
  }

  function ensureBracketed(text) {
    let t = String(text || "").trim();
    while (t.startsWith("【") && t.endsWith("】")) {
      t = t.slice(1, -1).trim();
    }
    return t ? `【${t}】` : "";
  }

  function getLanguagePresetByCulture(cultureRaw) {
    const c = toInt(cultureRaw, 1);
    const idx = Math.max(
      0,
      Math.min(LANGUAGE_PRESET_BY_CULTURE.length - 1, c - 1),
    );
    return LANGUAGE_PRESET_BY_CULTURE[idx] || LANGUAGE_PRESET_BY_CULTURE[0];
  }

  function syncLanguageUiFromSheet(sheet) {
    const field = el.enemyEditorForm
      ? el.enemyEditorForm.querySelector('[data-field="meta.languages"]')
      : null;
    const btn = el.toggleLanguageManualButton;
    if (!field || !(field instanceof HTMLInputElement) || !sheet) return;
    if (!sheet.meta || typeof sheet.meta !== "object") sheet.meta = {};
    const isManual = !!sheet.meta.languageManual;
    field.readOnly = !isManual;
    if (!isManual) {
      sheet.meta.languages = getLanguagePresetByCulture(sheet.ability?.culture);
      field.value = sheet.meta.languages;
    }
    if (btn) {
      btn.textContent = isManual ? "自動" : "手動";
      btn.setAttribute("aria-pressed", isManual ? "true" : "false");
    }
  }

  function pickExp(table, value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1) return 0;
    const idx = Math.max(0, Math.min(table.length - 1, Math.trunc(n) - 1));
    return Number(table[idx] || 0);
  }

  function calcExpConvFromAbility(ability) {
    const a = ability || {};
    const env =
      pickExp(ENV_EXP_TABLE, a.crime) +
      pickExp(ENV_EXP_TABLE, a.life) +
      pickExp(ENV_EXP_TABLE, a.love) +
      pickExp(ENV_EXP_TABLE, a.culture) +
      pickExp(ENV_EXP_TABLE, a.combat);
    const gift =
      pickExp(GIFT_EXP_TABLE, a.body) + pickExp(GIFT_EXP_TABLE, a.mind);
    return env + gift;
  }

  function recomputeDerivedFields(sheet) {
    if (!sheet || typeof sheet !== "object") return;
    if (!sheet.meta || typeof sheet.meta !== "object") sheet.meta = {};
    const karmaRows = Array.isArray(sheet.karma) ? sheet.karma : [];
    const karmaCount = karmaRows.filter((row) => {
      const kind = String((row && row.kind) || "").trim();
      if (kind === "異能") return true;
      return String((row && row.talent) || "").trim();
    }).length;
    const priceCount = karmaRows.filter((row) => {
      const kind = String((row && row.kind) || "").trim();
      if (kind === "代償") return true;
      return String((row && row.price) || "").trim();
    }).length;
    sheet.meta.karmaCount = karmaCount;
    sheet.meta.priceCount = priceCount;

    sheet.meta.expConv = calcExpConvFromAbility(sheet.ability || {});

    const a = sheet.ability || {};
    const combat = Number(a.combat) || 1;
    const body = Number(a.body) || 1;
    const pBase = combat * 2 + body;
    sheet.meta.powerBase = pBase;
    sheet.meta.powerRemain =
      pBase -
      (Number(a.powerInit) || 0) -
      (Number(a.powerAtk) || 0) -
      (Number(a.powerDes) || 0);
  }

  function updateMetricStyles(sheet) {
    if (!sheet || !el.enemyEditorForm) return;
    const meta = sheet.meta || {};

    const dangerNodes = el.enemyEditorForm.querySelectorAll(
      '[data-field="meta.danger"]',
    );
    const dRaw = Number(meta.danger);
    const dVal = Number.isFinite(dRaw) ? Math.max(0, Math.trunc(dRaw)) : 0;
    meta.danger = dVal;
    const dangerStyle = getDangerVisualStyle(dVal);
    dangerNodes.forEach((node) => {
      node.setAttribute("data-danger-band", dangerStyle.band);
      node.setAttribute("data-danger-step", String(dangerStyle.step));
    });

    const karmaNodes = el.enemyEditorForm.querySelectorAll(
      '[data-field="meta.karmaValue"]',
    );
    const kRaw = Number(meta.karmaValue);
    const kVal = Number.isFinite(kRaw)
      ? Math.max(1, Math.min(13, Math.trunc(kRaw)))
      : 7;
    meta.karmaValue = kVal;
    karmaNodes.forEach((node) => {
      node.setAttribute("data-karma-value", String(kVal));
      if (kVal <= 3) {
        node.setAttribute("data-karma-band", "hot");
      } else if (kVal >= 11) {
        node.setAttribute("data-karma-band", "ice");
      } else {
        node.setAttribute("data-karma-band", "neutral");
      }
    });
  }

  function getDangerVisualStyle(rawDanger) {
    const dVal = Number.isFinite(Number(rawDanger))
      ? Math.max(0, Math.trunc(Number(rawDanger)))
      : 0;
    if (dVal >= 20) {
      return { band: "abyss", step: 9 };
    }
    if (dVal >= 10) {
      return { band: "danger", step: 9 };
    }
    return { band: "grad", step: Math.min(9, dVal) };
  }

  function renderDerivedFields(sheet) {
    if (!sheet || !el.enemyEditorForm) return;
    const applyValue = (fieldPath, fallback = "") => {
      const node = el.enemyEditorForm.querySelector(
        `[data-field="${fieldPath}"]`,
      );
      if (!node) return;
      const v = getByPath(sheet, fieldPath);
      node.value = v == null || v === "" ? String(fallback) : String(v);
    };
    applyValue("meta.expConv", 0);
    applyValue("meta.karmaCount", 0);
    applyValue("meta.priceCount", 0);
    applyValue("meta.danger", 0);
    applyValue("meta.powerBase", 2);
    applyValue("meta.powerRemain", 0);

    updateMetricStyles(sheet);
  }

  function normalizeHobbyValues(rawText) {
    return String(rawText || "")
      .split(/[\n,、\s]+/)
      .map((v) => String(v || "").trim())
      .filter(Boolean);
  }

  function calcHobbyBaseCount(sheet) {
    const ability = (sheet && sheet.ability) || {};
    const life = toInt(ability.life, 1);
    const culture = toInt(ability.culture, 1);
    return Math.max(1, Math.ceil((life + culture) / 2));
  }

  function updateHobbyBaseCountDisplay() {
    if (!(el.hobbyBaseCount instanceof HTMLInputElement)) return;

    const sheet = getSelected();
    const baseCount = calcHobbyBaseCount(sheet);
    const selectedCount = normalizeHobbyValues(
      (el.hobbiesInput && el.hobbiesInput.value) || "",
    ).length;

    el.hobbyBaseCount.value = `${selectedCount} / ${baseCount}`;
    el.hobbyBaseCount.classList.remove("is-over");
    if (selectedCount > baseCount) {
      el.hobbyBaseCount.classList.add("is-over");
    }
  }

  function getHobbyColorClass(name) {
    const key = String(name || "").trim();
    if (!key) return "";
    return HOBBY_COLOR_CLASS_BY_NAME.get(key) || "";
  }

  function closeHobbyPicker() {
    if (el.hobbyPickerPanel) {
      el.hobbyPickerPanel.hidden = true;
    }
  }

  function renderHobbyPicker() {
    if (!el.hobbyPickerList || !el.hobbiesInput) return;
    const selectedSet = new Set(normalizeHobbyValues(el.hobbiesInput.value));
    el.hobbyPickerList.innerHTML = "";
    const useDiceGrid =
      !el.hobbyDiceGridToggle || el.hobbyDiceGridToggle.checked;
    const table = useDiceGrid ? HOBBY_GRID_6 : HOBBY_GRID_5;

    el.hobbyPickerList.classList.remove("is-dice-grid", "is-plain-grid");
    el.hobbyPickerList.classList.add(
      useDiceGrid ? "is-dice-grid" : "is-plain-grid",
    );

    if (useDiceGrid) {
      const firstRollTitle = document.createElement("div");
      firstRollTitle.className = "hobby-grid-header-cell hobby-grid-roll-title";
      firstRollTitle.style.gridColumn = "2 / span 7";
      firstRollTitle.style.gridRow = "1";
      firstRollTitle.textContent = "1回目のサイコロ";
      el.hobbyPickerList.appendChild(firstRollTitle);

      const catLabels = [
        "1.サブカル系",
        "2.アート系",
        "3.マジメ系",
        "4.休日系",
        "5.イヤシ系",
        "6.風俗系",
      ];
      for (let c = 0; c < 6; c += 1) {
        const colHead = document.createElement("div");
        colHead.className = "hobby-grid-header-cell hobby-grid-cat-header";
        colHead.style.gridColumn = String(c + 3);
        colHead.style.gridRow = "2";
        colHead.textContent = catLabels[c];
        el.hobbyPickerList.appendChild(colHead);
      }

      const rowHeadTop = document.createElement("div");
      rowHeadTop.className = "hobby-grid-header-cell";
      rowHeadTop.style.gridColumn = "2";
      rowHeadTop.style.gridRow = "2";
      rowHeadTop.textContent = "";
      el.hobbyPickerList.appendChild(rowHeadTop);

      const sideHead = document.createElement("div");
      sideHead.className = "hobby-grid-side-header";
      sideHead.style.gridColumn = "1";
      sideHead.style.gridRow = "3 / span 6";
      sideHead.textContent = "2回目のサイコロ";
      el.hobbyPickerList.appendChild(sideHead);
    }

    table.forEach((row, rIndex) => {
      if (useDiceGrid) {
        const rowHead = document.createElement("div");
        rowHead.className = "hobby-grid-header-cell";
        rowHead.style.gridColumn = "2";
        rowHead.style.gridRow = String(rIndex + 3);
        rowHead.textContent = String(rIndex + 1);
        el.hobbyPickerList.appendChild(rowHead);
      }
      row.forEach((name, cIndex) => {
        const button = document.createElement("button");
        button.type = "button";
        const colorClass =
          HOBBY_COLOR_CLASSES[rIndex % HOBBY_COLOR_CLASSES.length];
        const isZoromeSpecial =
          useDiceGrid &&
          rIndex === cIndex &&
          /イベント|タグ|ハプニング/.test(String(name));
        button.className = `hobby-picker-item hobby-choice-box hobby-grid-btn ${colorClass}${selectedSet.has(name) ? " is-selected" : ""}${isZoromeSpecial ? " is-disabled-cell" : ""}`;
        if (useDiceGrid) {
          button.style.gridColumn = String(cIndex + 3);
          button.style.gridRow = String(rIndex + 3);
        }
        if (isZoromeSpecial) {
          button.disabled = true;
          button.tabIndex = -1;
        }
        button.textContent = name;
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (isZoromeSpecial) return;
          const map = new Set(normalizeHobbyValues(el.hobbiesInput.value));
          if (map.has(name)) {
            map.delete(name);
          } else {
            map.add(name);
          }
          const next = Array.from(map.values()).join(",");
          el.hobbiesInput.value = next;
          const ev = new Event("input", { bubbles: true });
          el.hobbiesInput.dispatchEvent(ev);
          renderHobbyChips();
          renderHobbyPicker();
        });
        el.hobbyPickerList.appendChild(button);
      });
    });
  }

  function renderHobbyChips() {
    if (!el.hobbyChips || !el.hobbiesInput) return;
    const values = normalizeHobbyValues(el.hobbiesInput.value);
    el.hobbyChips.innerHTML = "";
    values.forEach((name) => {
      const chip = document.createElement("span");
      const colorClass = getHobbyColorClass(name);
      chip.className = `hobby-input-chip${colorClass ? ` ${colorClass}` : ""}`;
      chip.textContent = name;
      el.hobbyChips.appendChild(chip);
    });
    updateHobbyBaseCountDisplay();
  }

  function createWeaponRow() {
    return { place: "", name: "", aim: "", damage: "", range: "", notes: "" };
  }

  function createOutfitRow() {
    return { place: "", name: "", use: "", effect: "", notes: "" };
  }

  function createVehicleRow() {
    return { name: "", speed: "", frame: "", burden: "", notes: "" };
  }

  function createKarmaRow() {
    return {
      kind: "",
      category: "",
      name: "",
      use: "",
      target: "",
      judge: "",
      effect: "",
      _isCategoryKarmaRow: false,
    };
  }

  function isCategoryPresetRow(row) {
    if (!row || typeof row !== "object") return false;

    // 以前は _isCategoryKarmaRow フラグだけで判定していましたが、
    // 内容がプリセットと一致しているか（＝編集されていないか）を厳密にチェックします
    const kind = String(row.kind || "").trim();
    const category = String(row.category || "").trim();
    const name = String(row.name || "").trim();
    const effect = String(row.effect || "").trim(); // 効果文もチェック対象に含める

    const preset = MONSTER_KARMA_PRESET_BY_CATEGORY[category];
    if (!preset) return false;

    // 異能プリセットとの一致確認
    if (kind === "異能" && preset.talent && preset.talent.name === name) {
      // 効果文まで一致していれば「未編集のプリセット」とみなす
      if (preset.talent.effect === effect) return true;
    }
    // 代償プリセットとの一致確認
    if (kind === "代償" && preset.price && preset.price.name === name) {
      if (preset.price.effect === effect) return true;
    }

    return false;
  }

  function createHistoryRow() {
    return {
      scenario: "",
      dd: "",
      date: "",
      karma: "",
      exp: "",
      cost: "",
      comment: "",
    };
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function showToast(message, kind = "info") {
    const shared =
      typeof window !== "undefined" && window.NechronicaShared
        ? window.NechronicaShared
        : null;
    if (!shared || typeof shared.showToast !== "function") return;
    shared.showToast(message, {
      kind,
      id: "copyToast",
      className: "copy-toast",
      errorClass: "is-error",
      showClass: "is-show",
      duration: 1800,
    });
  }

  function message(key, params = {}) {
    const shared =
      typeof window !== "undefined" && window && window.NechronicaShared
        ? window.NechronicaShared
        : null;
    if (shared && typeof shared.getMessage === "function") {
      return shared.getMessage(key, params);
    }
    const fallback = {
      komaJsonCopySuccess:
        "ココフォリアコマ出力をコピーした！これを盤面でペーストだ！",
      clipboardCopyFailedConsole: "コピー失敗。コンソールに出力する",
      saveRequestSending: "保存要求を送信中…",
      saveAsInProgress: "別名保存中…",
      saveCompleted: "保存完了 {time}",
      saveAsPrompt: "別名保存する名前を入力してください",
      saveAsNameRequired: "保存名を入力してください",
    };
    const template =
      Object.prototype.hasOwnProperty.call(fallback, key) &&
      typeof fallback[key] === "string"
        ? fallback[key]
        : String(key || "");
    return template.replace(/\{(\w+)\}/g, (_m, token) => {
      const value = params ? params[token] : "";
      return value == null ? "" : String(value);
    });
  }

  function showKomaJsonCopySuccessToast() {
    showToast(message("komaJsonCopySuccess"), "info");
  }

  function setSaveButtonLabelBySheet(sheet) {
    const idStr = String((sheet && sheet.id) || "");
    const isNew =
      !!sheet && (localUnsavedSheetIds.has(idStr) || idStr.startsWith("new-"));
    const label = isNew ? "新規保存" : "上書き保存";
    if (!(el.saveEnemyButton instanceof HTMLButtonElement)) return;
    const icon = el.saveEnemyButton.querySelector("i");
    if (icon) {
      el.saveEnemyButton.innerHTML = `<i class="${icon.className}"></i> ${escapeHtml(label)}`;
    } else {
      el.saveEnemyButton.textContent = label;
    }
    el.saveEnemyButton.title = label;
    el.saveEnemyButton.setAttribute("aria-label", label);
  }

  function setStatus(text, kind = "idle") {
    if (el.saveStatusText) el.saveStatusText.textContent = text;
    if (kind === "ok" || kind === "error" || kind === "info") {
      showToast(text, kind === "error" ? "error" : "info");
    }
  }

  function normalizeApiUrl(url) {
    return String(url || "").replace(/\/+$/, "");
  }

  function getConfiguredApiUrl() {
    const params = new URLSearchParams(window.location.search);
    const apiFromQuery = params.get("ncApi") || params.get("gasApi");
    if (apiFromQuery) {
      try {
        localStorage.setItem(API_STORAGE_KEY, String(apiFromQuery));
      } catch (_e) {}
      return String(apiFromQuery).trim();
    }
    try {
      const fromStorage = localStorage.getItem(API_STORAGE_KEY) || "";
      const trimmed = String(fromStorage).trim();
      if (trimmed) return trimmed;
    } catch (_e) {}
    return DEFAULT_GAS_WEB_APP_URL;
  }

  function buildApiUrl(action, params = {}) {
    const base = normalizeApiUrl(getConfiguredApiUrl());
    if (!base) throw new Error("API URLが未設定");
    const url = new URL(base);
    url.searchParams.set("tool", "satasupe");
    url.searchParams.set("action", action);
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v == null) return;
      const s = String(v).trim();
      if (!s) return;
      url.searchParams.set(k, s);
    });
    return url.toString();
  }

  async function fetchApiJson(url, init = null) {
    const res = await fetch(url, init || undefined);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg =
        data && data.message ? data.message : `APIエラー (HTTP ${res.status})`;
      throw new Error(msg);
    }
    if (!data || data.status === "error") {
      throw new Error((data && data.message) || "API応答が不正");
    }
    return data;
  }

  function getRememberedAuthor() {
    try {
      return String(localStorage.getItem(AUTHOR_STORAGE_KEY) || "").trim();
    } catch (_e) {
      return "";
    }
  }

  function rememberAuthor(name) {
    try {
      localStorage.setItem(AUTHOR_STORAGE_KEY, String(name || "").trim());
    } catch (_e) {}
  }

  function saveLastSelectedId(id) {
    try {
      if (id) {
        localStorage.setItem(LAST_SELECTED_ID_KEY, String(id));
      } else {
        localStorage.removeItem(LAST_SELECTED_ID_KEY);
      }
    } catch (_e) {}
  }

  function getLastSelectedId() {
    try {
      return String(localStorage.getItem(LAST_SELECTED_ID_KEY) || "").trim();
    } catch (_e) {
      return "";
    }
  }

  function isFreshBlankSheetForRestore(sheet) {
    if (!sheet || typeof sheet !== "object") return true;
    const name = String(sheet.name || "").trim();
    const quote = normalizeText(sheet.meta && sheet.meta.quote);
    const memo = normalizeText(sheet.memo);
    const hobbies = normalizeText(sheet.meta && sheet.meta.hobbies);
    const hasKarma = Array.isArray(sheet.karma) && sheet.karma.length > 0;
    const hasWeapon = Array.isArray(sheet.weapons)
      ? sheet.weapons.some((w) => normalizeText(w && w.name))
      : false;
    const hasOutfit = Array.isArray(sheet.outfits)
      ? sheet.outfits.some((o) => normalizeText(o && o.name))
      : false;
    const hasVehicle = Array.isArray(sheet.vehicles)
      ? sheet.vehicles.some((v) => normalizeText(v && v.name))
      : false;
    const isDefaultName = name === "" || name === "新規エネミー";
    return (
      isDefaultName &&
      !quote &&
      !memo &&
      !hobbies &&
      !hasKarma &&
      !hasWeapon &&
      !hasOutfit &&
      !hasVehicle
    );
  }

  function showRestoreDialog(sheet) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "restore-dialog-overlay";

      const dialog = document.createElement("div");
      dialog.className = "restore-dialog";
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-labelledby", "restore-dialog-title");

      const nameText = String((sheet && sheet.name) || "（名称未設定）");
      const classText = getSheetCategory(sheet);

      dialog.innerHTML = `
        <p id="restore-dialog-title" class="restore-dialog-title">前回の続きを開きますか？</p>
        <p class="restore-dialog-enemy">
          <span class="restore-dialog-name">${escapeHtml(nameText)}</span>
          ${classText ? `<span class="restore-dialog-class">${escapeHtml(classText)}</span>` : ""}
        </p>
        <div class="restore-dialog-actions">
          <button id="restoreDialogYes" class="small-square-btn">続きを開く</button>
          <button id="restoreDialogNo" class="small-square-btn is-secondary">新規で開く</button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      const yesBtn = dialog.querySelector("#restoreDialogYes");
      const noBtn = dialog.querySelector("#restoreDialogNo");
      if (yesBtn) yesBtn.focus();

      function close(result) {
        overlay.remove();
        resolve(result);
      }

      if (yesBtn) yesBtn.addEventListener("click", () => close(true));
      if (noBtn) noBtn.addEventListener("click", () => close(false));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close(false);
      });
      document.addEventListener("keydown", function onKey(e) {
        if (e.key === "Escape") {
          document.removeEventListener("keydown", onKey);
          close(false);
        }
      });
    });
  }

  function markDirty() {
    state.dirty = true;
    setStatus("未保存");
  }

  function saveStorage() {
    const payload = { sheets: state.sheets };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    state.dirty = false;
    setStatus("保存済み");
  }

  function loadStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.sheets)) {
        state.sheets = parsed.sheets;
      }
    } catch (_e) {}
  }

  function toApiEnemy(sheet) {
    const author = String(sheet.author || "").trim() || getRememberedAuthor();

    let categoryForStorage = String(
      (sheet && sheet.meta && sheet.meta.category) || "",
    ).trim();
    if (categoryForStorage === "undefined" || categoryForStorage === "null") {
      categoryForStorage = "";
    }

    const cleanSheet = deepClone(sheet);
    delete cleanSheet.id;
    delete cleanSheet.author;
    delete cleanSheet.name;
    delete cleanSheet.is_public;
    delete cleanSheet.memo;
    delete cleanSheet.createdAt;
    delete cleanSheet.updatedAt;
    delete cleanSheet._originalString;

    if (cleanSheet.meta) {
      delete cleanSheet.meta.category;
    }

    return {
      ID: String(sheet.id || "").trim(),
      author,
      name: String(sheet.name || "").trim() || "無題",
      category: categoryForStorage,
      is_public: !!sheet.is_public,
      memo: String(sheet.memo || ""),
      data: {
        system: "satasupe",
        sheet: cleanSheet,
      },
      icon_url: "",
      time: nowText(),
    };
  }

  function fromApiEnemy(enemy) {
    const data =
      enemy && enemy.data && typeof enemy.data === "object" ? enemy.data : {};
    const sheet =
      data && data.sheet && typeof data.sheet === "object"
        ? deepClone(data.sheet)
        : createSheetTemplate();

    sheet.id = String((enemy && enemy.ID) || sheet.id || "").trim();
    sheet.author = String((enemy && enemy.author) || sheet.author || "").trim();
    sheet.is_public = !!(enemy && enemy.is_public);
    sheet.name = String((enemy && enemy.name) || sheet.name || "").trim();
    sheet.memo = String((enemy && enemy.memo) || sheet.memo || "");

    if (!sheet.meta || typeof sheet.meta !== "object") sheet.meta = {};

    let categoryFromApi = String(
      (enemy && enemy.category) || (enemy && enemy.class_type) || "",
    ).trim();
    if (categoryFromApi === "undefined" || categoryFromApi === "null") {
      categoryFromApi = "";
    }
    if (!String(sheet.meta.category || "").trim() && categoryFromApi) {
      sheet.meta.category = categoryFromApi;
    }

    sheet.updatedAt = String(
      (enemy && enemy.time) || sheet.updatedAt || nowText(),
    );
    if (!sheet.createdAt) sheet.createdAt = sheet.updatedAt;

    recomputeDerivedFields(sheet);
    sheet._originalString = JSON.stringify(sheet);
    return sheet;
  }

  async function loadFromDb() {
    const author = getRememberedAuthor();
    const url = buildApiUrl("listSatasupeEnemies", { author });
    const response = await fetchApiJson(url);
    const all = Array.isArray(response.data) ? response.data : [];
    const targets = all.filter((enemy) => {
      const classType = String(
        (enemy && enemy.category) || (enemy && enemy.class_type) || "",
      ).trim();
      const system =
        enemy && enemy.data && typeof enemy.data === "object"
          ? String(enemy.data.system || "").trim()
          : "";
      return classType === "サタスペ" || system === "satasupe";
    });
    state.sheets = targets.map((enemy) => fromApiEnemy(enemy));
    localUnsavedSheetIds.clear();
    state.selectedId = state.sheets[0] ? state.sheets[0].id : null;
    state.dirty = false;
  }

  async function saveCurrentToDb() {
    const sheet = getSelected();
    if (!sheet) return;

    const beforeId = String(sheet.id || "");

    readFormToSheet(sheet);
    const payload = toApiEnemy(sheet);
    if (payload.author) rememberAuthor(payload.author);

    const response = await fetchApiJson(buildApiUrl("saveSatasupeEnemy"), {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        tool: "satasupe",
        action: "saveSatasupeEnemy",
        author: payload.author,
        enemy: payload,
      }),
    });

    const saved = fromApiEnemy(response.data || payload);
    sheet.id = saved.id;

    const idx = state.sheets.findIndex((s) => String(s.id) === beforeId);
    if (idx >= 0) {
      state.sheets[idx] = saved;
    } else {
      state.sheets.unshift(saved);
    }

    state.selectedId = saved.id;
    localUnsavedSheetIds.delete(beforeId);
    localUnsavedSheetIds.delete(String(saved.id || ""));
    state.dirty = false;
    saveStorage();
    setStatus(
      message("saveCompleted", {
        time: formatShortDate(saved.updatedAt || saved.createdAt || nowText()),
      }),
      "ok",
    );
  }

  function getSelected() {
    return (
      state.sheets.find((x) => String(x.id) === String(state.selectedId)) ||
      null
    );
  }

  function getSheetCategory(sheet) {
    const fromMeta = String(
      sheet && sheet.meta ? sheet.meta.category || "" : "",
    ).trim();
    if (fromMeta && fromMeta !== "undefined" && fromMeta !== "null")
      return fromMeta;
    const fromClassType = String(
      (sheet && sheet.category) || (sheet && sheet.class_type) || "",
    ).trim();
    if (
      fromClassType &&
      fromClassType !== "undefined" &&
      fromClassType !== "null"
    )
      return fromClassType;
    return "";
  }

  function setByPath(obj, path, value) {
    const segs = String(path || "").split(".");
    let cur = obj;
    for (let i = 0; i < segs.length - 1; i += 1) {
      const k = segs[i];
      if (!cur[k] || typeof cur[k] !== "object") cur[k] = {};
      cur = cur[k];
    }
    cur[segs[segs.length - 1]] = value;
  }

  function getByPath(obj, path) {
    const segs = String(path || "").split(".");
    let cur = obj;
    for (let i = 0; i < segs.length; i += 1) {
      if (cur == null) return "";
      cur = cur[segs[i]];
    }
    return cur == null ? "" : cur;
  }

  function renderList() {
    if (!el.enemyList) return;
    const q = String(state.query || "")
      .trim()
      .toLowerCase();
    const field = state.searchField || "all";

    let targets = state.sheets.filter((s) => {
      const id = String((s && s.id) || "");
      if (localUnsavedSheetIds.has(id)) return false;
      if (!q) return true;
      if (field === "id")
        return String(s.id || "")
          .toLowerCase()
          .includes(q);
      if (field === "name")
        return String(s.name || "")
          .toLowerCase()
          .includes(q);
      if (field === "author")
        return String(s.author || "")
          .toLowerCase()
          .includes(q);
      const hay =
        `${s.name || ""} ${s.author || ""} ${s.id || ""} ${s.meta?.category || ""}`.toLowerCase();
      return hay.includes(q);
    });

    targets.sort((a, b) => {
      const mode = state.sortMode || "updatedAt";
      const dir = state.sortDir === "asc" ? 1 : -1;
      if (mode === "id") {
        return String(a.id || "").localeCompare(String(b.id || "")) * dir;
      }
      if (mode === "author") {
        return (
          String(a.author || "").localeCompare(String(b.author || "")) * dir
        );
      }
      if (mode === "danger") {
        const da = toInt(a.meta?.danger, 0);
        const db = toInt(b.meta?.danger, 0);
        return (
          (da - db) * dir ||
          String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))
        );
      }
      if (mode === "karmaCount") {
        const ka = (a.karma || []).length;
        const kb = (b.karma || []).length;
        return (
          (ka - kb) * dir ||
          String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))
        );
      }
      if (mode === "category") {
        const categoryOrder = [
          "一般人",
          "迷惑",
          "チンピラ",
          "刺客",
          "戦場の狼",
          "獣",
          "超級英雄",
          "都市伝説",
          "リーダー",
          "参謀",
          "技術屋",
          "荒事屋",
          "マネージャー",
          "道化師",
        ];
        const ca = String(a.meta?.category || "").trim();
        const cb = String(b.meta?.category || "").trim();
        const ia = categoryOrder.indexOf(ca);
        const ib = categoryOrder.indexOf(cb);
        const ea = ia === -1 ? 999 : ia;
        const eb = ib === -1 ? 999 : ib;
        return (
          (ea - eb) * dir ||
          String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))
        );
      }
      return (
        String(a.updatedAt || "").localeCompare(String(b.updatedAt || "")) * dir
      );
    });

    const totalCount = targets.length;
    let size = state.pageSize || 0;
    if (size <= 0) size = totalCount || 1;
    const maxPage = Math.max(1, Math.ceil(totalCount / size));
    if (state.page > maxPage) state.page = maxPage;
    const start = (state.page - 1) * size;
    const visibleTargets = targets.slice(start, start + size);

    el.enemyList.innerHTML = "";
    visibleTargets.forEach((sheet) => {
      const danger = toInt(sheet.meta?.danger, 0);
      const dangerStyle = getDangerVisualStyle(danger);
      const karmaCount = (sheet.karma || []).length;
      const iconUrl = sheet.icon_url || "";
      const classType = getSheetCategory(sheet);
      const authorText = String((sheet && sheet.author) || "").trim();
      const authorLine = authorText ? `<span>作者：${authorText}</span>` : "";
      const silhouetteClass = `is-class-${classType}`;

      const li = document.createElement("li");
      li.className = "enemy-list-item";
      if (String(sheet.id) === String(state.selectedId))
        li.classList.add("is-active");

      li.innerHTML = `
        <div class="enemy-list-card ${silhouetteClass}" data-id="${sheet.id}">
          <div class="enemy-list-row">
            <div class="enemy-list-side-left">
              <div class="enemy-danger-badge" data-danger-band="${dangerStyle.band}" data-danger-step="${dangerStyle.step}">
                <span class="danger-label">危険度</span>
                <span class="danger-value">${danger}</span>
              </div>
              <div class="enemy-list-icon-wrap">
                ${iconUrl ? `<img src="${iconUrl}" alt="">` : `<i class="fa-solid fa-user-ninja"></i>`}
              </div>
            </div>
            <div class="enemy-list-content-main">
              <div class="enemy-list-upper-info">
                <span class="enemy-list-name">${sheet.name || "（名称未設定）"}</span>
                <span class="enemy-list-karma-tag">異能数 ${karmaCount}</span>
              </div>
              <div class="enemy-list-lower-info">
                ${authorLine}
                <span>ID：${sheet.id}</span>
              </div>
            </div>
            <div class="enemy-list-side-right-group">
              <div class="enemy-list-meta-column">
                <span class="enemy-list-class-tag">${classType}</span>
                <span class="enemy-list-time-tag">${formatShortDate(sheet.updatedAt)}</span>
              </div>
              <div class="enemy-list-btns-row">
                <button type="button" class="list-side-btn is-load" data-id="${sheet.id}" title="編集">
                  <i class="fa-solid fa-pen-to-square"></i><br>編集
                </button>
                <button type="button" class="list-side-btn is-output" data-id="${sheet.id}" title="出力">
                  <i class="fa-solid fa-file-export"></i><br>出力
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      el.enemyList.appendChild(li);
    });

    if (el.enemyPagerInfo) {
      if (totalCount === 0) {
        el.enemyPagerInfo.textContent = "見つかりませんでした";
      } else {
        const end = Math.min(start + size, totalCount);
        el.enemyPagerInfo.textContent = `${totalCount}件中 ${start + 1}〜${end}件を表示中`;
      }
    }
    if (el.enemyPrevButton) el.enemyPrevButton.disabled = state.page <= 1;
    if (el.enemyNextButton) el.enemyNextButton.disabled = state.page >= maxPage;

    updateSortButtons();
  }

  function updateSortButtons() {
    const mode = state.sortMode;
    const map = [
      [el.sortByIdButton, "id", "ID順"],
      [el.sortByTimeButton, "updatedAt", "更新順"],
      [el.sortByDangerButton, "danger", "危険度"],
      [el.sortByKarmaButton, "karmaCount", "異能数"],
      [el.sortByAuthorButton, "author", "作者"],
      [el.sortByCategoryButton, "category", "分類"],
    ];

    map.forEach(([btn, key, fallbackLabel]) => {
      if (!btn) return;
      const baseLabel =
        String(btn.getAttribute("data-sort-label") || "").trim() ||
        String(btn.textContent || "")
          .replace(/[\s▲▼]+$/g, "")
          .trim() ||
        fallbackLabel;
      btn.setAttribute("data-sort-label", baseLabel);
      const active = mode === key;
      btn.classList.toggle("is-active", active);
      const arrow = active ? (state.sortDir === "asc" ? " ▲" : " ▼") : "";
      btn.textContent = `${baseLabel}${arrow}`;
    });
  }

  function applyRandomLikeProfile(sheet) {
    if (!sheet) return;
    if (!sheet.meta || typeof sheet.meta !== "object") sheet.meta = {};
    if (!sheet.base || typeof sheet.base !== "object") sheet.base = {};
    sheet.meta.likeType = pickRandom(LIKE_TYPE_OPTIONS);
    sheet.meta.likeDetail = pickRandom(LIKE_DETAIL_OPTIONS);
    sheet.base.age = randInt(8, 80);
    sheet.updatedAt = nowText();
  }

  function applyRandomNpcProfile(sheet, presetKey) {
    if (!sheet) return;
    if (!sheet.meta || typeof sheet.meta !== "object") sheet.meta = {};
    if (!sheet.base || typeof sheet.base !== "object") sheet.base = {};
    const key = String(presetKey || "random").trim();
    if (key === "fixed") {
      sheet.updatedAt = nowText();
      return;
    }
    sheet.base.age =
      key === "random" ? randInt(1, 100) : rollNpcAgeByPreset(key);
    sheet.base.sex = pickRandom(["男", "女", "？"]);
    sheet.meta.likeType = pickRandom(LIKE_TYPE_OPTIONS);
    sheet.meta.likeDetail = pickRandom(LIKE_DETAIL_OPTIONS);
    sheet.updatedAt = nowText();
  }

  function syncNpcAgePresetUi() {
    if (!el.npcAgePresetSelect || !el.randomNpcAgeButton) return;
    const preset = String(el.npcAgePresetSelect.value || "random").trim();
    const isFixed = preset === "fixed";
    el.randomNpcAgeButton.hidden = false;
    el.randomNpcAgeButton.disabled = isFixed;
    el.randomNpcAgeButton.classList.toggle("is-disabled-visual", isFixed);
  }

  function fillForm(sheet) {
    if (!sheet || !el.enemyEditorForm) return;
    setSaveButtonLabelBySheet(sheet);
    recomputeDerivedFields(sheet);
    const fields = el.enemyEditorForm.querySelectorAll("[data-field]");
    fields.forEach((node) => {
      const path = node.getAttribute("data-field");
      if (!path) return;
      const v = getByPath(sheet, path);
      if (path === "base.sex" && (v == null || String(v) === "")) {
        node.value = "？";
        return;
      }
      if (path === "base.sex") {
        node.value = normalizeSexValue(v);
        return;
      }
      node.value = v == null ? "" : String(v);
    });
    if (el.fieldAuthor) {
      el.fieldAuthor.value = String(sheet.author || "");
    }
    if (el.fieldIsPublic) {
      el.fieldIsPublic.checked = !!sheet.is_public;
    }
    if (el.fieldIsPublicText) {
      el.fieldIsPublicText.textContent = sheet.is_public ? "公開" : "非公開";
    }
    syncLanguageUiFromSheet(sheet);
    syncNpcAgePresetUi();
    renderHobbyChips();
  }

  function readFormToSheet(sheet, options = {}) {
    if (!sheet || !el.enemyEditorForm) return;
    const silent = !!(options && options.silent);
    const fields = el.enemyEditorForm.querySelectorAll("[data-field]");
    fields.forEach((node) => {
      const path = node.getAttribute("data-field");
      if (!path) return;
      let v = node.value;
      if (path === "base.sex") v = normalizeSexValue(v);
      if (node.type === "number" && v !== "") {
        v = Number(v);
        if (ZERO_FLOOR_FIELDS.has(path) && Number.isFinite(v))
          v = Math.max(0, v);
        if (path === "meta.danger" && Number.isFinite(v)) v = Math.max(0, v);
        if (path === "meta.karmaValue" && Number.isFinite(v))
          v = Math.max(1, Math.min(13, v));
      }
      setByPath(sheet, path, v);
    });
    if (el.fieldAuthor) {
      sheet.author = String(el.fieldAuthor.value || "").trim();
      if (sheet.author) rememberAuthor(sheet.author);
    }
    if (el.fieldIsPublic) {
      sheet.is_public = !!el.fieldIsPublic.checked;
    }
    if (el.fieldIsPublicText) {
      el.fieldIsPublicText.textContent = sheet.is_public ? "公開" : "非公開";
    }
    recomputeDerivedFields(sheet);
    if (!silent) {
      renderDerivedFields(sheet);
      sheet.updatedAt = nowText();
    }
  }

  function tableCellInput(value, path, type = "text") {
    return `<input type="${type}" data-row-field="${path}" value="${String(value == null ? "" : value).replace(/"/g, "&quot;")}">`;
  }

  function tableCellInputMultiline(value, path) {
    return `<textarea data-row-field="${path}" rows="2">${String(
      value == null ? "" : value,
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</textarea>`;
  }

  function tableRowActionCell() {
    return `<div class="row-action-wrap"><span class="drag-hint" draggable="true" aria-hidden="true" title="この行はドラッグで並べ替えできます">⠿</span><button type="button" class="delete-btn" data-row-remove="1" title="削除" aria-label="削除"><i class="fa-solid fa-trash" aria-hidden="true"></i></button></div>`;
  }

  function tableCellKarmaCombined(row) {
    const kind = String((row && row.kind) || "").replace(/"/g, "&quot;");
    const category = String((row && row.category) || "").replace(
      /"/g,
      "&quot;",
    );
    const name = String((row && row.name) || "").replace(/"/g, "&quot;");
    return `
      <div class="karma-combined-cell">
        <select data-row-field="kind" class="karma-kind-select">
          <option value="異能" ${kind === "異能" ? "selected" : ""}>異能</option>
          <option value="代償" ${kind === "代償" ? "selected" : ""}>代償</option>
        </select>
        <input type="text" data-row-field="category" value="${category}" placeholder="カテゴリ" list="karmaCategoryList">
        <input type="text" data-row-field="name" value="${name}" placeholder="カルマ名">
      </div>
    `;
  }

  function moveRowByDrag(kind, fromIndex, toIndex) {
    const sheet = getSelected();
    if (!sheet) return;
    const list = sheet[kind];
    if (!Array.isArray(list)) return;
    if (!Number.isFinite(fromIndex) || !Number.isFinite(toIndex)) return;
    if (fromIndex < 0 || toIndex < 0) return;
    if (fromIndex >= list.length || toIndex >= list.length) return;
    if (fromIndex === toIndex) return;
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    recomputeDerivedFields(sheet);
    renderDerivedFields(sheet);
    sheet.updatedAt = nowText();
    markDirty();
    renderEditor();
  }

  function renderWeapons(sheet) {
    if (!el.weaponsBody) return;
    el.weaponsBody.innerHTML = "";
    sheet.weapons.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-row-kind", "weapons");
      tr.setAttribute("data-row-index", String(index));
      tr.innerHTML = `
        <td>${tableCellInput(row.name, "name")}</td>
        <td>${tableCellInput(row.aim, "aim")}</td>
        <td>${tableCellInput(row.damage, "damage")}</td>
        <td>${tableCellInput(row.range, "range")}</td>
        <td>${tableCellInput(row.notes, "notes")}</td>
        <td>${tableRowActionCell()}</td>
      `;
      el.weaponsBody.appendChild(tr);
    });
  }

  function renderOutfits(sheet) {
    if (!el.outfitsBody) return;
    el.outfitsBody.innerHTML = "";
    sheet.outfits.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-row-kind", "outfits");
      tr.setAttribute("data-row-index", String(index));
      tr.innerHTML = `
        <td>${tableCellInput(row.name, "name")}</td>
        <td>${tableCellInput(row.use, "use")}</td>
        <td>${tableCellInput(row.effect, "effect")}</td>
        <td>${tableCellInput(row.notes, "notes")}</td>
        <td>${tableRowActionCell()}</td>
      `;
      el.outfitsBody.appendChild(tr);
    });
  }

  function renderVehicles(sheet) {
    if (!el.vehiclesBody) return;
    el.vehiclesBody.innerHTML = "";
    sheet.vehicles.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-row-kind", "vehicles");
      tr.setAttribute("data-row-index", String(index));
      tr.innerHTML = `
        <td>${tableCellInput(row.name, "name")}</td>
        <td>${tableCellInput(row.speed, "speed")}</td>
        <td>${tableCellInput(row.frame, "frame")}</td>
        <td>${tableCellInput(row.burden, "burden")}</td>
        <td>${tableCellInput(row.notes, "notes")}</td>
        <td>${tableRowActionCell()}</td>
      `;
      el.vehiclesBody.appendChild(tr);
    });
  }

  function renderKarma(sheet) {
    if (!el.karmaBody) return;
    el.karmaBody.innerHTML = "";
    const isMultiLine = !!(
      el.karmaEffectLineModeSelect && el.karmaEffectLineModeSelect.checked
    );
    sheet.karma.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-row-kind", "karma");
      tr.setAttribute("data-row-index", String(index));
      const kind = String((row && row.kind) || "").trim();
      if (kind === "異能") tr.classList.add("karma-row-is-talent");
      if (kind === "代償") tr.classList.add("karma-row-is-price");
      tr.innerHTML = `
        <td>${tableCellKarmaCombined(row)}</td>
        <td>${tableCellInput(row.use, "use")}</td>
        <td>${tableCellInput(row.target, "target")}</td>
        <td>${tableCellInput(row.judge, "judge")}</td>
        <td>${isMultiLine ? tableCellInputMultiline(row.effect, "effect") : tableCellInput(row.effect, "effect")}</td>
        <td>${tableRowActionCell()}</td>
      `;
      el.karmaBody.appendChild(tr);
    });
    if (isMultiLine) {
      const textareas = el.karmaBody.querySelectorAll(
        'textarea[data-row-field="effect"]',
      );
      textareas.forEach((ta) => autoResizeTextarea(ta));
    }
  }

  function renderHistory(sheet) {
    if (!el.historyBody) return;
    el.historyBody.innerHTML = "";
    sheet.history.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-row-kind", "history");
      tr.setAttribute("data-row-index", String(index));
      tr.innerHTML = `
        <td>${tableCellInput(row.scenario, "scenario")}</td>
        <td>${tableCellInput(row.dd, "dd")}</td>
        <td>${tableCellInput(row.date, "date")}</td>
        <td>${tableCellInput(row.karma, "karma")}</td>
        <td>${tableCellInput(row.exp, "exp")}</td>
        <td>${tableCellInput(row.cost, "cost")}</td>
        <td>${tableCellInput(row.comment, "comment")}</td>
        <td><button type="button" class="small-square-btn is-danger" data-row-remove="1">×</button></td>
      `;
      el.historyBody.appendChild(tr);
    });
  }

  function renderEditor() {
    const sheet = getSelected();
    if (!sheet) return;
    fillForm(sheet);
    renderDerivedFields(sheet);
    renderWeapons(sheet);
    renderOutfits(sheet);
    renderVehicles(sheet);
    renderKarma(sheet);
    renderHistory(sheet);
  }

  function renderAll() {
    saveLastSelectedId(state.selectedId || "");
    renderList();
    renderEditor();
  }

  function ensureSelected() {
    if (state.sheets.length && !state.selectedId) {
      state.selectedId = state.sheets[0].id;
    }
    saveLastSelectedId(state.selectedId || "");
  }

  function handleRowInput(target) {
    const tr = target.closest("tr[data-row-kind]");
    if (!tr) return;
    const sheet = getSelected();
    if (!sheet) return;
    const kind = tr.getAttribute("data-row-kind");
    const index = Number(tr.getAttribute("data-row-index"));
    const field = target.getAttribute("data-row-field");
    if (!kind || !Number.isFinite(index) || !field) return;
    const list = sheet[kind];
    if (!Array.isArray(list) || !list[index]) return;
    list[index][field] = target.value;

    // ★ 修正：カルマの種別(kind)が変更されたとき、即座に背景色クラスを更新する
    if (kind === "karma" && field === "kind") {
      tr.classList.remove("karma-row-is-talent", "karma-row-is-price");
      if (target.value === "異能") tr.classList.add("karma-row-is-talent");
      if (target.value === "代償") tr.classList.add("karma-row-is-price");
    }

    recomputeDerivedFields(sheet);
    renderDerivedFields(sheet);
    sheet.updatedAt = nowText();
    markDirty();
    renderList();
  }

  function removeRowFromEvent(target) {
    const tr = target.closest("tr[data-row-kind]");
    if (!tr) return;
    const sheet = getSelected();
    if (!sheet) return;
    const kind = tr.getAttribute("data-row-kind");
    const index = Number(tr.getAttribute("data-row-index"));
    if (!kind || !Number.isFinite(index)) return;
    if (!Array.isArray(sheet[kind])) return;
    sheet[kind].splice(index, 1);
    recomputeDerivedFields(sheet);
    renderDerivedFields(sheet);
    sheet.updatedAt = nowText();
    markDirty();
    renderEditor();
  }

  function addRow(kind) {
    const sheet = getSelected();
    if (!sheet) return;
    if (kind === "weapons") sheet.weapons.push(createWeaponRow());
    if (kind === "outfits") sheet.outfits.push(createOutfitRow());
    if (kind === "vehicles") sheet.vehicles.push(createVehicleRow());
    if (kind === "karma") {
      const row = createKarmaRow();
      if (sheet.meta && sheet.meta.category) row.category = sheet.meta.category;
      sheet.karma.push(row);
    }
    if (kind === "history") sheet.history.push(createHistoryRow());
    recomputeDerivedFields(sheet);
    renderDerivedFields(sheet);
    sheet.updatedAt = nowText();
    markDirty();
    renderEditor();
  }

  function addKarmaKindRow(kindValue) {
    const sheet = getSelected();
    if (!sheet) return;
    const row = createKarmaRow();
    row.kind = kindValue;
    row.category = ""; // 空欄で開始
    sheet.karma.push(row);

    recomputeDerivedFields(sheet);
    renderDerivedFields(sheet);
    sheet.updatedAt = nowText();
    markDirty();
    renderEditor();
  }

  function exportCurrentJson() {
    const sheet = getSelected();
    if (!sheet) return;

    // 出力用にクローンを作成し、現在のフォーム内容を反映（元データを不用意に更新しないため）
    const exportSheet = deepClone(sheet);
    readFormToSheet(exportSheet, { silent: true });
    delete exportSheet._originalString;

    const blob = new Blob([JSON.stringify(exportSheet, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `satasupe-enemy-${exportSheet.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("JSON出力完了");
  }

  function toInt(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
  }

  function normalizeText(value) {
    return String(value == null ? "" : value).trim();
  }

  function buildKomaMemo(sheet) {
    const base = sheet.base || {};
    const ability = sheet.ability || {};
    const meta = sheet.meta || {};
    const condition = sheet.condition || {};
    const home = sheet.home || {};

    const hobbies = normalizeText(meta.hobbies)
      ? normalizeText(meta.hobbies)
          .split(/[,、\s]+/)
          .filter(Boolean)
          .join("、")
      : "";

    // ★ 異能、代償、それ以外（未選択など）のカルマを分類して全部拾う
    const talents = [];
    const prices = [];
    const otherKarmas = [];

    (sheet.karma || []).forEach((k) => {
      const name = normalizeText(k.name);
      if (!name) return;
      const kind = normalizeText(k.kind);
      if (kind === "異能") {
        talents.push(name);
      } else if (kind === "代償") {
        prices.push(name);
      } else {
        otherKarmas.push(name);
      }
    });

    const quoteRaw = normalizeText(meta.quote);
    const quoteText = (() => {
      if (!quoteRaw) return "";
      if (quoteRaw.startsWith("「") && quoteRaw.endsWith("」")) return quoteRaw;
      return `「${quoteRaw}」`;
    })();

    const weaponLines = (sheet.weapons || [])
      .map((w) => {
        const name = normalizeText(w.name);
        if (!name) return "";
        const aim = normalizeText(w.aim) || "-";
        const damage = normalizeText(w.damage) || "-";
        const fields = [normalizeText(w.range), normalizeText(w.notes)].filter(
          Boolean,
        );
        let specialEffect = "";
        let fatal = "";
        fields.forEach((f) => {
          const fatalNum = f.match(/必殺\s*(\d+)|^(\d+)$/);
          if (!fatal && fatalNum) {
            const n = fatalNum[1] || fatalNum[2];
            fatal = `必殺${n}`;
            return;
          }
          if (!fatal && /^必殺/.test(f)) {
            const n = f.match(/\d+/);
            fatal = n ? `必殺${n[0]}` : f;
            return;
          }
          if (!specialEffect) specialEffect = f;
        });
        const tails = [specialEffect, fatal].filter(Boolean).join("、");
        const suffix = tails ? `、${tails}` : "";
        return `${name}（命${aim}、ダ${damage}${suffix}）`;
      })
      .filter(Boolean)
      .join("\n");

    const outfitLines = (sheet.outfits || [])
      .map((o) => {
        const name = normalizeText(o.name);
        if (!name) return "";
        const details = [
          normalizeText(o.use),
          normalizeText(o.effect),
          normalizeText(o.notes),
        ]
          .filter(Boolean)
          .join("：");
        return details ? `${name}（${details}）` : name;
      })
      .filter(Boolean)
      .join("\n");

    const vehicleLines = (sheet.vehicles || [])
      .map((v) => {
        const name = normalizeText(v.name);
        if (!name) return "";
        const specs = [];
        if (normalizeText(v.speed)) specs.push(`ス${normalizeText(v.speed)}`);
        if (normalizeText(v.frame)) specs.push(`車${normalizeText(v.frame)}`);
        if (normalizeText(v.burden)) specs.push(`荷${normalizeText(v.burden)}`);
        if (normalizeText(v.notes)) specs.push(normalizeText(v.notes));
        const specText = specs.length > 0 ? `（${specs.join("、")}）` : "";
        return `${name}${specText}`;
      })
      .filter(Boolean)
      .join("\n");

    const nickname = normalizeText(base.nickname)
      .replace(/^「|」$/g, "")
      .trim();
    const nameStr = normalizeText(sheet.name) || "無題";
    const fullName = nickname ? `「${nickname}」${nameStr}` : nameStr;

    const bgInfo = [
      normalizeText(base.homeland)
        ? `国籍：${normalizeText(base.homeland)}`
        : "",
      normalizeText(base.alliance)
        ? `盟約：${normalizeText(base.alliance)}`
        : "",
      normalizeText(base.hierarchy)
        ? `階級：${normalizeText(base.hierarchy)}`
        : "",
      normalizeText(base.surface)
        ? `表の顔：${normalizeText(base.surface)}`
        : "",
      normalizeText(base.style) ? `スタイル：${normalizeText(base.style)}` : "",
      normalizeText(base.team) ? `チーム：${normalizeText(base.team)}` : "",
    ]
      .filter(Boolean)
      .join("　");

    const homeInfo = normalizeText(home.place)
      ? `アジト：${normalizeText(home.place)}（快${toInt(home.comfortable, 10)}/セ${toInt(home.security, 10)}）`
      : "";

    // ★ 修正：カッコ同士の間に / を入れないように join("") に変更
    const lines = [
      "",
      "───",
      `【名前】${fullName}`,
      quoteText,
      `${normalizeText(meta.category) ? `カテゴリー：${normalizeText(meta.category)}　` : ""}危険度：${toInt(meta.danger, 0)}　反応：${normalizeText(meta.reaction) || "中立"}　サイズ：${normalizeText(meta.size) || "M"}`,
      normalizeText(meta.garbageTable)
        ? `ドロップ表：${normalizeText(meta.garbageTable)}`
        : "",
      `${normalizeText(base.sex)}　${normalizeText(base.age) || "？"}歳　好み：${`${normalizeText(meta.likeType)}${normalizeText(meta.likeDetail)}` || "？"}`,
      normalizeText(base.likes) || normalizeText(base.dislikes)
        ? `好：${normalizeText(base.likes) || "なし"}　嫌：${normalizeText(base.dislikes) || "なし"}`
        : "",
      normalizeText(meta.languages)
        ? `言語：${normalizeText(meta.languages)}`
        : "",
      `【犯罪】${toInt(ability.crime, 1)}【生活】${toInt(ability.life, 1)}【恋愛】${toInt(ability.love, 1)}【教養】${toInt(ability.culture, 1)}【戦闘】${toInt(ability.combat, 1)}`,
      `【肉体】${toInt(ability.body, 1)}【精神】${toInt(ability.mind, 1)}`,
      `【性業値】${toInt(meta.karmaValue, 7)}`,
      `【反応力】${toInt(ability.powerInit, 1)}【攻撃力】${toInt(ability.powerAtk, 1)}【破壊力】${toInt(ability.powerDes, 1)}`,
      "",
      hobbies ? `趣味：${hobbies}` : "",
      "",
      talents.length
        ? `異能：${talents.map((x) => ensureBracketed(x)).join("")}`
        : "",
      prices.length
        ? `代償：${prices.map((x) => ensureBracketed(x)).join("")}`
        : "",
      otherKarmas.length
        ? `${otherKarmas.map((x) => ensureBracketed(x)).join("")}`
        : "",
      "",
      weaponLines ? `◆武器\n${weaponLines}` : "",
      outfitLines ? `◆アイテム\n${outfitLines}` : "",
      vehicleLines ? `◆乗物\n${vehicleLines}` : "",
      "",
      bgInfo,
      homeInfo,
      normalizeText(sheet.memo),
    ];

    return lines
      .filter((x) => x !== null && x !== undefined && x !== "")
      .join("\n");
  }

  function buildKomaCommands(sheet) {
    const commands = [];

    commands.push("@基本");
    commands.push(`SR{性業値} 性業値判定`);
    commands.push(`({犯罪})R>=X[,1,13] 犯罪判定`);
    commands.push(`({生活})R>=X[,1,13] 生活判定`);
    commands.push(`({恋愛})R>=X[,1,13] 恋愛判定`);
    commands.push(`({教養})R>=X[,1,13] 教養判定`);
    commands.push(`({戦闘})R>=X[,1,13] 戦闘判定`);
    commands.push(`({肉体})R>=X[,1,13] 肉体判定`);
    commands.push(`({精神})R>=X[,1,13] 精神判定`);

    commands.push("@異能・代償");
    (sheet.karma || []).forEach((k) => {
      const name = normalizeText(k.name);
      const use = normalizeText(k.use) || "常駐";
      const target = normalizeText(k.target) || "自分";
      const judge = normalizeText(k.judge) || "なし";
      const effect = normalizeText(k.effect);

      if (name) {
        let line = `【${stripOuterBrackets(name)}】${use}・${target}・${judge}`;
        if (effect) {
          line += `\\n${effect}`;
        }
        commands.push(line);
      }
    });

    commands.push("@汎用");
    commands.push(`({肉体})R>=X[,1,13] セーブ判定`);
    commands.push(`({肉体})R>=X[1,2,13] 跳ぶ`);

    commands.push("@武器");
    (sheet.weapons || []).forEach((w) => {
      const name = normalizeText(w.name) || "武器";
      const aim = normalizeText(w.aim) || "X";
      commands.push(`({攻撃力})R>=${aim}[,1,13] ${name}`);
    });

    const dropTableMap = {
      ガラクタ表: "GetgT ガラクタ表",
      実用品表: "GetzT 実用品表",
      値打ち物表: "GetnT 値打ち物表",
      奇天烈表: "GetkT 奇天烈表",
    };

    commands.push("@各種表");
    const tableCommands = [
      "TAGT 情報タグ決定表",
      "FumbleT 命中判定ファンブル表",
      "FatalT 14番表",
      "FatalT 致命傷表",
      "FatalVT 乗物致命傷表",
      "RomanceFT ロマンスファンブル表",
      "AccidentT ケチャップアクシデント表",
      "GeneralAT 汎用アクシデント表",
      "AfterT その後表",
      "KusaiMT 臭い飯表",
      "EnterT 登場表",
      "BudTT バッドトリップ表",
    ];

    const gt = normalizeText(sheet.meta?.garbageTable);
    if (gt && dropTableMap[gt]) {
      tableCommands.push(dropTableMap[gt]);
    }

    tableCommands.push(
      "CrimeIET 犯罪イベント表",
      "LifeIET 生活イベント表",
      "LoveIET 恋愛イベント表",
      "CultureIET 教養イベント表",
      "CombatIET 戦闘イベント表",
      "CrimeIHT 犯罪ハプニング表",
      "LifeIHT 生活ハプニング表",
      "LoveIHT 恋愛ハプニング表",
      "CultureIHT 教養ハプニング表",
      "CombatIHT 戦闘ハプニング表",
      "MinamiRET ミナミ遭遇表",
      "ChinatownRET 中華街遭遇表",
      "WarshipLandRET 軍艦島遭遇表",
      "CivicCenterRET 官庁街遭遇表",
      "DowntownRET 十三遭遇表",
      "ShaokinRET 沙京遭遇表",
      "LoveLoveRET らぶらぶ遭遇表",
      "AjitoRET アジト遭遇表",
      "JigokuSpaRET 地獄湯遭遇表",
      "JailHouseRET JAIL HOUSE遭遇表",
      "TreatmentIT 治療イベント表",
      "CollegeIT 大学イベント表",
    );

    tableCommands.forEach((c) => commands.push(c));

    return commands.join("\n");
  }

  function buildKomaCharacterJson(sheet) {
    const ability = sheet.ability || {};
    const condition = sheet.condition || {};
    const meta = sheet.meta || {};
    const walletMax = Math.max(
      0,
      toInt(condition.walletMax, toInt(condition.wallet, 0)),
    );
    const walletValue = Math.max(
      0,
      Math.min(
        toInt(condition.wallet, walletMax),
        walletMax || toInt(condition.wallet, 0),
      ),
    );

    const pageUrl =
      window.location.origin + window.location.pathname + "?id=" + sheet.id;

    return {
      kind: "character",
      data: {
        name: normalizeText(sheet.name) || "無題",
        memo: buildKomaMemo(sheet),
        initiative: toInt(ability.powerInit, 1),
        externalUrl: pageUrl,
        status: [
          {
            label: "肉体点",
            value: toInt(condition.bp, 10),
            max: toInt(condition.bp, 10),
          },
          {
            label: "精神点",
            value: toInt(condition.mp, 10),
            max: toInt(condition.mp, 10),
          },
          {
            label: "サイフ",
            value: walletValue,
            max: walletMax || toInt(condition.wallet, 0),
          },
        ],
        params: [
          { label: "犯罪", value: String(toInt(ability.crime, 1)) },
          { label: "生活", value: String(toInt(ability.life, 1)) },
          { label: "恋愛", value: String(toInt(ability.love, 1)) },
          { label: "教養", value: String(toInt(ability.culture, 1)) },
          { label: "戦闘", value: String(toInt(ability.combat, 1)) },
          { label: "肉体", value: String(toInt(ability.body, 1)) },
          { label: "精神", value: String(toInt(ability.mind, 1)) },
          { label: "反応力", value: String(toInt(ability.powerInit, 1)) },
          { label: "攻撃力", value: String(toInt(ability.powerAtk, 1)) },
          { label: "破壊力", value: String(toInt(ability.powerDes, 1)) },
          { label: "性業値", value: String(toInt(meta.karmaValue, 7)) },
        ],
        commands: buildKomaCommands(sheet),
      },
    };
  }

  function parseKomaJsonObjectsFromText(rawText) {
    const text = String(rawText || "");
    const results = [];
    if (!text.trim()) return results;

    const starts = [];
    const re = /\{\s*"kind"\s*:\s*"character"/g;
    let m;
    while ((m = re.exec(text))) starts.push(m.index);

    if (!starts.length) {
      try {
        const single = JSON.parse(text);
        if (single && single.kind === "character" && single.data) {
          return [single];
        }
      } catch (_e) {}
      return [];
    }

    starts.forEach((start) => {
      let depth = 0;
      let inString = false;
      let escaped = false;
      let end = -1;
      for (let i = start; i < text.length; i += 1) {
        const ch = text[i];
        if (inString) {
          if (escaped) {
            escaped = false;
          } else if (ch === "\\") {
            escaped = true;
          } else if (ch === '"') {
            inString = false;
          }
          continue;
        }
        if (ch === '"') {
          inString = true;
          continue;
        }
        if (ch === "{") depth += 1;
        if (ch === "}") {
          depth -= 1;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }
      if (end < 0) return;
      const chunk = text.slice(start, end + 1);
      try {
        const parsed = JSON.parse(chunk);
        if (parsed && parsed.kind === "character" && parsed.data) {
          results.push(parsed);
        }
      } catch (_e) {}
    });

    return results;
  }

  function parseNumericParamMap(params) {
    const map = {};
    (Array.isArray(params) ? params : []).forEach((p) => {
      const label = normalizeText(p && p.label);
      const n = Number(p && p.value);
      if (!label || !Number.isFinite(n)) return;
      map[label] = Math.trunc(n);
    });
    return map;
  }

  function parseStatusMap(status) {
    const map = {};
    (Array.isArray(status) ? status : []).forEach((s) => {
      const label = normalizeText(s && s.label);
      const v = Number(s && s.value);
      const max = Number(s && s.max);
      if (!label) return;
      map[label] = {
        value: Number.isFinite(v) ? Math.trunc(v) : 0,
        max: Number.isFinite(max) ? Math.trunc(max) : 0,
      };
    });
    return map;
  }

  function applyMemoHintsToSheet(sheet, memoText) {
    const memo = String(memoText || "");
    if (!memo) return;

    const danger = memo.match(/危険度\s*[：:]\s*(\d+)/);
    if (danger) sheet.meta.danger = toInt(danger[1], sheet.meta.danger);

    const reaction = memo.match(/反応\s*[：:]\s*(憎悪|敵対|懐疑|中立)/);
    if (reaction) sheet.meta.reaction = reaction[1];

    const size = memo.match(/サイズ\s*[：:]\s*([SML小中大])/i);
    if (size) {
      const s = String(size[1]).toUpperCase();
      sheet.meta.size =
        s === "S" ? "小" : s === "L" ? "大" : s === "M" ? "中" : size[1];
    }

    const table = memo.match(/(ガラクタ表|実用品表|値打ち物表|奇天烈表)/);
    if (table) sheet.meta.garbageTable = table[1];

    const sexAge = memo.match(/([♀♂？])\s*[　\s]*(\d+)歳/);
    if (sexAge) {
      const sx = sexAge[1];
      sheet.base.sex = sx === "♀" ? "女" : sx === "♂" ? "男" : "？";
      sheet.base.age = toInt(sexAge[2], sheet.base.age);
    }

    const like = memo.match(/好み\s*[：:]\s*([^\n\r]+)/);
    if (like) {
      const textLike = String(like[1] || "").trim();
      const detail = ["年下", "同い年", "年上"].find((x) =>
        textLike.endsWith(x),
      );
      if (detail) {
        sheet.meta.likeDetail = detail;
        sheet.meta.likeType = textLike.slice(0, -detail.length).trim();
      } else {
        sheet.meta.likeType = textLike;
      }
    }

    const likesMatch = memo.match(/好\s*[：:]\s*([^\s　]+)/);
    if (likesMatch && likesMatch[1] !== "なし") {
      sheet.base.likes = likesMatch[1];
    }
    const dislikesMatch = memo.match(/嫌\s*[：:]\s*([^\s　\n\r]+)/);
    if (dislikesMatch && dislikesMatch[1] !== "なし") {
      sheet.base.dislikes = dislikesMatch[1];
    }
  }

  function convertKomaJsonToSheet(komaObj) {
    const data = (komaObj && komaObj.data) || {};
    const next = createSheetTemplate();
    next.id = getNextSequentialId();
    next.author = getRememberedAuthor();
    next.name = normalizeText(data.name) || "新規エネミー";
    next.memo = String(data.memo || "");
    next.meta.category = "";

    const p = parseNumericParamMap(data.params);
    next.ability.crime = toInt(p["犯罪"], next.ability.crime);
    next.ability.life = toInt(p["生活"], next.ability.life);
    next.ability.love = toInt(p["恋愛"], next.ability.love);
    next.ability.culture = toInt(p["教養"], next.ability.culture);
    next.ability.combat = toInt(p["戦闘"], next.ability.combat);
    next.ability.body = toInt(p["肉体"], next.ability.body);
    next.ability.mind = toInt(p["精神"], next.ability.mind);
    next.ability.powerInit = toInt(p["反応力"], next.ability.powerInit);
    next.ability.powerAtk = toInt(p["攻撃力"], next.ability.powerAtk);
    next.ability.powerDes = toInt(p["破壊力"], next.ability.powerDes);
    next.meta.karmaValue = toInt(p["性業値"], next.meta.karmaValue);

    const st = parseStatusMap(data.status);
    if (st["肉体点"])
      next.condition.bp = toInt(
        st["肉体点"].max || st["肉体点"].value,
        next.condition.bp,
      );
    if (st["精神点"])
      next.condition.mp = toInt(
        st["精神点"].max || st["精神点"].value,
        next.condition.mp,
      );
    if (st["サイフ"]) {
      next.condition.wallet = toInt(st["サイフ"].value, next.condition.wallet);
      next.condition.walletMax = toInt(
        st["サイフ"].max || st["サイフ"].value,
        next.condition.wallet,
      );
    }

    applyMemoHintsToSheet(next, next.memo);
    recomputeDerivedFields(next);
    return next;
  }

  async function saveSheetToDb(sheet) {
    const payload = toApiEnemy(sheet);
    if (payload.author) rememberAuthor(payload.author);
    const response = await fetchApiJson(buildApiUrl("saveSatasupeEnemy"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveSatasupeEnemy",
        author: payload.author,
        enemy: payload,
      }),
    });
    return fromApiEnemy(response.data || payload);
  }

  async function importKomaJsonText(rawText) {
    const list = parseKomaJsonObjectsFromText(rawText);
    if (!list.length) {
      setStatus("インポート失敗(JSONなし)", "error");
      alert("読み込めるコマJSON(kind: character)が見つかりませんでした");
      return;
    }

    const imported = list.map((obj) => convertKomaJsonToSheet(obj));
    imported
      .slice()
      .reverse()
      .forEach((sheet) => {
        state.sheets.unshift(sheet);
        localUnsavedSheetIds.add(String(sheet.id || ""));
      });
    state.selectedId = imported[0] ? imported[0].id : state.selectedId;
    markDirty();
    renderAll();

    let okCount = 0;
    for (const sheet of imported) {
      try {
        const saved = await saveSheetToDb(sheet);
        const idx = state.sheets.findIndex(
          (x) => String(x.id) === String(sheet.id),
        );
        if (idx >= 0) state.sheets[idx] = saved;
        if (String(state.selectedId) === String(sheet.id))
          state.selectedId = saved.id;
        localUnsavedSheetIds.delete(String(sheet.id || ""));
        localUnsavedSheetIds.delete(String(saved.id || ""));
        okCount += 1;
      } catch (err) {
        console.error(err);
      }
    }
    renderAll();
    setStatus(`インポート完了 ${okCount}/${imported.length}件`, "ok");
  }

  async function writeClipboardText(text) {
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }

  function exportKomaJson(sourceSheet = null) {
    let sheet = null;

    const isSheetLike =
      sourceSheet &&
      typeof sourceSheet === "object" &&
      !("target" in sourceSheet) &&
      !("currentTarget" in sourceSheet);

    if (isSheetLike) {
      sheet = deepClone(sourceSheet);
    } else {
      const selected = getSelected();
      if (!selected) return;
      sheet = deepClone(selected);
      readFormToSheet(sheet, { silent: true });
    }
    delete sheet._originalString;

    const out = buildKomaCharacterJson(sheet);
    const text = JSON.stringify(out);
    writeClipboardText(text)
      .then(() => showKomaJsonCopySuccessToast())
      .catch(() => {
        showToast(message("clipboardCopyFailedConsole"), "error");
        console.log(out);
      });
  }

  function importJsonFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const next = createSheetTemplate();
        const merged = Object.assign(next, parsed);
        merged.id = getNextSequentialId();
        merged.createdAt = nowText();
        merged.updatedAt = nowText();
        merged._originalString = JSON.stringify(merged);
        state.sheets.unshift(merged);
        state.selectedId = merged.id;
        markDirty();
        renderAll();
      } catch (_e) {
        alert("JSONの読み込みに失敗しました");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  // ★ 追加：保存時のローディング（グルグル）UI切り替え関数
  function setButtonLoadingState(button, isLoading, originalHtml) {
    if (!button) return;
    if (isLoading) {
      button.disabled = true;
      button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 保存中...`;
    } else {
      button.disabled = false;
      button.innerHTML = originalHtml;
    }
  }

  function bindEvents() {
    if (el.enemySearchInput) {
      el.enemySearchInput.addEventListener("input", (e) => {
        state.query = String(e.target.value || "");
        renderList();
      });
    }
    if (el.enemySearchField) {
      el.enemySearchField.addEventListener("change", (e) => {
        state.searchField = e.target.value;
        renderList();
      });
    }

    const setSort = (mode) => {
      const isRecommendAsc = mode === "author" || mode === "id";
      const recommendDir = isRecommendAsc ? "asc" : "desc";
      const reverseDir = isRecommendAsc ? "desc" : "asc";
      if (state.sortMode === mode) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortMode = mode;
        state.sortDir = recommendDir;
      }
      if (!state.sortDir) state.sortDir = reverseDir;
      renderList();
    };
    if (el.sortByIdButton)
      el.sortByIdButton.addEventListener("click", () => setSort("id"));
    if (el.sortByTimeButton)
      el.sortByTimeButton.addEventListener("click", () => setSort("updatedAt"));
    if (el.sortByDangerButton)
      el.sortByDangerButton.addEventListener("click", () => setSort("danger"));
    if (el.sortByKarmaButton)
      el.sortByKarmaButton.addEventListener("click", () =>
        setSort("karmaCount"),
      );
    if (el.sortByAuthorButton)
      el.sortByAuthorButton.addEventListener("click", () => setSort("author"));
    if (el.sortByCategoryButton)
      el.sortByCategoryButton.addEventListener("click", () =>
        setSort("category"),
      );

    if (el.enemyPageSizeInput) {
      el.enemyPageSizeInput.addEventListener("change", (e) => {
        state.pageSize = Number(e.target.value);
        state.page = 1;
        renderList();
      });
    }
    if (el.enemyShowAllButton) {
      el.enemyShowAllButton.addEventListener("click", () => {
        state.pageSize = 0;
        state.page = 1;
        if (el.enemyPageSizeInput) el.enemyPageSizeInput.value = "0";
        renderList();
      });
    }
    if (el.enemyShowTenButton) {
      el.enemyShowTenButton.addEventListener("click", () => {
        state.pageSize = 10;
        state.page = 1;
        if (el.enemyPageSizeInput) el.enemyPageSizeInput.value = "10";
        renderList();
      });
    }
    if (el.enemyPrevButton) {
      el.enemyPrevButton.addEventListener("click", () => {
        if (state.page > 1) {
          state.page--;
          renderList();
        }
      });
    }
    if (el.enemyNextButton) {
      el.enemyNextButton.addEventListener("click", () => {
        state.page++;
        renderList();
      });
    }

    if (el.enemyList) {
      el.enemyList.addEventListener("click", async (e) => {
        const target = e.target;

        const outputBtn = target.closest(".is-output");
        if (outputBtn) {
          e.stopPropagation();
          const id = outputBtn.getAttribute("data-id");
          if (!id) return;
          const targetSheet = state.sheets.find(
            (s) => String(s.id) === String(id),
          );
          if (!targetSheet) return;
          const snapshot = deepClone(targetSheet);
          if (String(id) === String(state.selectedId)) {
            readFormToSheet(snapshot, { silent: true });
          }
          exportKomaJson(snapshot);
          return;
        }

        const loadBtn = target.closest(".is-load");
        if (loadBtn) {
          e.stopPropagation();
          const id = loadBtn.getAttribute("data-id");
          if (!id) return;
          state.selectedId = id;
          renderAll();
          return;
        }
      });
    }

    if (el.enemyEditorForm) {
      el.enemyEditorForm.addEventListener("input", (e) => {
        const target = e.target;
        if (
          !(
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target instanceof HTMLSelectElement
          )
        )
          return;
        if (target.hasAttribute("data-row-field")) {
          if (target.tagName.toLowerCase() === "textarea") {
            autoResizeTextarea(target);
          }
          handleRowInput(target);
          return;
        }
        const sheet = getSelected();
        if (!sheet) return;
        const field = target.getAttribute("data-field");
        if (!field) return;
        let v = target.value;
        if (target instanceof HTMLInputElement && target.type === "checkbox") {
          v = target.checked;
        } else if (
          target instanceof HTMLInputElement &&
          target.type === "number" &&
          v !== ""
        ) {
          v = Number(v);
          if (ZERO_FLOOR_FIELDS.has(field) && Number.isFinite(v))
            v = Math.max(0, v);
          if (field === "meta.danger" && Number.isFinite(v)) v = Math.max(0, v);
          if (field === "meta.karmaValue" && Number.isFinite(v))
            v = Math.max(1, Math.min(13, v));
          if (Number.isFinite(v)) target.value = String(v);
        }

        const oldCategory =
          sheet.meta && sheet.meta.category ? sheet.meta.category : "";

        setByPath(sheet, field, v);

        if (field === "author") rememberAuthor(v);
        if (field === "meta.hobbies") renderHobbyChips();
        if (
          field === "ability.culture" &&
          sheet.meta &&
          !sheet.meta.languageManual
        ) {
          sheet.meta.languages = getLanguagePresetByCulture(
            sheet.ability?.culture,
          );
          syncLanguageUiFromSheet(sheet);
        }

        if (field === "meta.category") {
          const newCategory = v;
          if (Array.isArray(sheet.karma) && sheet.karma.length > 0) {
            const hasOldCategory = !!sheet.karma.find(
              (row) => oldCategory && row.category === oldCategory,
            );
            if (hasOldCategory) {
              applyMonsterKarmaPresetByCategory(sheet, newCategory);
              renderKarma(sheet);
            } else {
              const firstRow = sheet.karma[0];
              if (sheet.karma.length === 1 && !firstRow.category) {
                firstRow.category = newCategory;
                if (!firstRow.kind) firstRow.kind = "異能";
              }
            }
          }
          renderKarma(sheet);
        }

        recomputeDerivedFields(sheet);
        renderDerivedFields(sheet);
        if (field === "ability.life" || field === "ability.culture") {
          updateHobbyBaseCountDisplay();
        }
        sheet.updatedAt = nowText();
        markDirty();
        renderList();
      });

      el.enemyEditorForm.addEventListener("click", (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        const removeBtn = target.closest("[data-row-remove]");
        if (removeBtn) {
          removeRowFromEvent(removeBtn);
        }
      });

      el.enemyEditorForm.addEventListener("dragstart", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const dragHandle = target.closest(".drag-hint");
        if (!dragHandle) return;
        const tr = dragHandle.closest("tr[data-row-kind][data-row-index]");
        if (!(tr instanceof HTMLTableRowElement)) return;
        const kind = tr.getAttribute("data-row-kind") || "";
        if (!["weapons", "outfits", "vehicles", "karma"].includes(kind)) return;
        const index = Number(tr.getAttribute("data-row-index"));
        if (!Number.isFinite(index)) return;
        draggingRowState = { kind, index };
        tr.classList.add("is-row-dragging");
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", `${kind}:${index}`);
        }
      });

      el.enemyEditorForm.addEventListener("dragover", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const tr = target.closest("tr[data-row-kind][data-row-index]");
        if (!(tr instanceof HTMLTableRowElement)) return;
        const kind = tr.getAttribute("data-row-kind") || "";
        if (!["weapons", "outfits", "vehicles", "karma"].includes(kind)) return;
        if (!draggingRowState.kind || draggingRowState.kind !== kind) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      });

      el.enemyEditorForm.addEventListener("drop", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const tr = target.closest("tr[data-row-kind][data-row-index]");
        if (!(tr instanceof HTMLTableRowElement)) return;
        const kind = tr.getAttribute("data-row-kind") || "";
        const toIndex = Number(tr.getAttribute("data-row-index"));
        if (!kind || !Number.isFinite(toIndex)) return;
        if (draggingRowState.kind !== kind) return;
        event.preventDefault();
        moveRowByDrag(kind, draggingRowState.index, toIndex);
        draggingRowState = { kind: "", index: -1 };
      });

      el.enemyEditorForm.addEventListener("dragend", () => {
        draggingRowState = { kind: "", index: -1 };
        el.enemyEditorForm
          .querySelectorAll("tr.is-row-dragging")
          .forEach((row) => row.classList.remove("is-row-dragging"));
      });
    }

    if (el.fieldAuthor) {
      el.fieldAuthor.addEventListener("input", (e) => {
        const sheet = getSelected();
        if (!sheet) return;
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;
        sheet.author = String(target.value || "").trim();
        if (sheet.author) rememberAuthor(sheet.author);
        sheet.updatedAt = nowText();
        markDirty();
        renderList();
      });
    }

    if (el.fieldIsPublic) {
      el.fieldIsPublic.addEventListener("change", (e) => {
        const sheet = getSelected();
        if (!sheet) return;
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;
        sheet.is_public = !!target.checked;
        if (el.fieldIsPublicText) {
          el.fieldIsPublicText.textContent = sheet.is_public
            ? "公開"
            : "非公開";
        }
        sheet.updatedAt = nowText();
        markDirty();
      });
    }

    if (el.openHobbyPickerButton && el.hobbyPickerPanel) {
      el.openHobbyPickerButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const opening = el.hobbyPickerPanel.hidden;
        if (opening) {
          renderHobbyPicker();
        }
        el.hobbyPickerPanel.hidden = !opening;
      });

      if (el.hobbyDiceGridToggle) {
        el.hobbyDiceGridToggle.addEventListener("change", (event) => {
          event.stopPropagation();
          renderHobbyPicker();
        });
      }

      el.hobbyPickerPanel.addEventListener("click", (event) => {
        event.stopPropagation();
      });

      document.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Node)) return;
        const inPanel = el.hobbyPickerPanel.contains(target);
        const onButton = el.openHobbyPickerButton.contains(target);
        if (!inPanel && !onButton) {
          closeHobbyPicker();
        }
      });
    }

    if (el.randomLikeAgeButton) {
      el.randomLikeAgeButton.addEventListener("click", () => {
        const sheet = getSelected();
        if (!sheet) return;
        applyRandomLikeProfile(sheet);
        fillForm(sheet);
        markDirty();
        renderList();
      });
    }

    if (el.randomNpcAgeButton) {
      el.randomNpcAgeButton.addEventListener("click", () => {
        const sheet = getSelected();
        if (!sheet) return;
        const preset = el.npcAgePresetSelect
          ? String(el.npcAgePresetSelect.value || "random")
          : "random";
        if (preset === "fixed") return;
        applyRandomNpcProfile(sheet, preset);
        fillForm(sheet);
        markDirty();
        renderList();
      });
    }

    if (el.npcAgePresetSelect) {
      el.npcAgePresetSelect.addEventListener("change", () => {
        syncNpcAgePresetUi();
      });
    }

    if (el.toggleLanguageManualButton) {
      el.toggleLanguageManualButton.addEventListener("click", () => {
        const sheet = getSelected();
        if (!sheet) return;
        if (!sheet.meta || typeof sheet.meta !== "object") sheet.meta = {};
        sheet.meta.languageManual = !sheet.meta.languageManual;
        syncLanguageUiFromSheet(sheet);
        sheet.updatedAt = nowText();
        markDirty();
      });
    }

    if (el.newEnemyButton) {
      el.newEnemyButton.addEventListener("click", () => {
        const sheet = createSheetTemplate();
        sheet.author = getRememberedAuthor();
        state.sheets.unshift(sheet);
        localUnsavedSheetIds.add(String(sheet.id || ""));
        state.selectedId = sheet.id;
        markDirty();
        renderAll();
      });
    }

    // ★ 上書き保存のイベントリスナー（UIグルグル対応）
    if (el.saveEnemyButton) {
      el.saveEnemyButton.addEventListener("click", async () => {
        if (el.saveEnemyButton.disabled) return;
        const originalHtml = el.saveEnemyButton.innerHTML;

        try {
          setButtonLoadingState(el.saveEnemyButton, true, originalHtml);
          setStatus(message("saveRequestSending"));

          await saveCurrentToDb();
          renderAll();
        } catch (error) {
          console.error("Save error:", error);
          setStatus("保存失敗", "error");
          alert("DB保存に失敗しました: " + error.message);
        } finally {
          // 保存成功したら表示を「上書き保存」に更新するため setSaveButtonLabelBySheet に任せる
          const savedSheet = getSelected();
          if (savedSheet) {
            el.saveEnemyButton.disabled = false;
            setSaveButtonLabelBySheet(savedSheet);
          } else {
            setButtonLoadingState(el.saveEnemyButton, false, originalHtml);
          }
        }
      });
    }

    // ★ 別名保存のイベントリスナー（ダイアログ撤廃 ＆ UIグルグル対応）
    if (el.saveAsEnemyButton) {
      el.saveAsEnemyButton.addEventListener("click", async () => {
        if (el.saveAsEnemyButton.disabled) return;
        const sheet = getSelected();
        if (!sheet) return;

        const originalHtml = el.saveAsEnemyButton.innerHTML;

        try {
          setButtonLoadingState(el.saveAsEnemyButton, true, originalHtml);
          setStatus(message("saveAsInProgress"));

          // 現在のフォーム入力内容は「コピー先」のためのものとして扱う
          const copied = deepClone(sheet);
          readFormToSheet(copied, { silent: true });

          // ★ポップアップによる名前の質問は廃止し、そのままの名前でコピーする
          // （変更したい場合は、フォームで名前を書き換えてからボタンを押す想定）

          // 元のシートの変更を取り消す (スナップショットから復元する)
          if (sheet._originalString) {
            try {
              const original = JSON.parse(sheet._originalString);
              Object.keys(sheet).forEach((k) => delete sheet[k]);
              Object.assign(sheet, original);
              sheet._originalString = JSON.stringify(sheet); // スナップショットを再設定
            } catch (e) {
              console.error("元データの復元に失敗しました", e);
            }
          }

          copied.id = getNextSequentialId();
          // copied.name = saveAsName; // 削除（そのままの名前を使う）
          copied.createdAt = nowText();
          copied.updatedAt = nowText();
          delete copied._originalString;

          state.sheets.unshift(copied);
          localUnsavedSheetIds.add(String(copied.id || ""));
          state.selectedId = copied.id;
          markDirty();
          renderAll();

          await saveCurrentToDb();
          renderAll();
        } catch (error) {
          console.error(error);
          setStatus("保存失敗", "error");
          alert("複製保存に失敗しました: " + error.message);
        } finally {
          setButtonLoadingState(el.saveAsEnemyButton, false, originalHtml);
        }
      });
    }

    if (el.deleteEnemyButton) {
      el.deleteEnemyButton.addEventListener("click", () => {
        const sheet = getSelected();
        if (!sheet) return;
        const ok = window.confirm(
          `「${sheet.name || "無題"}」を削除しますか？`,
        );
        if (!ok) return;
        state.sheets = state.sheets.filter(
          (s) => String(s.id) !== String(sheet.id),
        );
        localUnsavedSheetIds.delete(String(sheet.id || ""));
        state.selectedId = state.sheets[0] ? state.sheets[0].id : null;
        ensureSelected();
        markDirty();
        renderAll();
      });
    }

    if (el.exportJsonButton) {
      el.exportJsonButton.addEventListener("click", exportCurrentJson);
    }

    if (el.exportKomaJsonButton) {
      el.exportKomaJsonButton.addEventListener("click", () => exportKomaJson());
    }

    if (el.importJsonInput) {
      el.importJsonInput.addEventListener("change", (e) => {
        const input = e.target;
        if (!(input instanceof HTMLInputElement)) return;
        const value = String(input.value || "").trim();
        if (!value) return;
        importKomaJsonText(value)
          .then(() => {
            input.value = "";
          })
          .catch((err) => {
            console.error(err);
            setStatus("インポート失敗", "error");
          });
      });

      el.importJsonInput.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const input = e.target;
        if (!(input instanceof HTMLInputElement)) return;
        const value = String(input.value || "").trim();
        if (!value) return;
        importKomaJsonText(value)
          .then(() => {
            input.value = "";
          })
          .catch((err) => {
            console.error(err);
            setStatus("インポート失敗", "error");
          });
      });
    }

    if (el.addWeaponButton)
      el.addWeaponButton.addEventListener("click", () => addRow("weapons"));
    if (el.addOutfitButton)
      el.addOutfitButton.addEventListener("click", () => addRow("outfits"));
    if (el.addVehicleButton)
      el.addVehicleButton.addEventListener("click", () => addRow("vehicles"));
    if (el.addKarmaButton)
      el.addKarmaButton.addEventListener("click", () => addRow("karma"));
    if (el.addKarmaTalentButton)
      el.addKarmaTalentButton.addEventListener("click", () =>
        addKarmaKindRow("異能"),
      );
    if (el.addKarmaPriceButton)
      el.addKarmaPriceButton.addEventListener("click", () =>
        addKarmaKindRow("代償"),
      );

    if (el.addKarmaPairButton) {
      el.addKarmaPairButton.addEventListener("click", () => {
        const sheet = getSelected();
        if (!sheet) return;

        // 異能の行を作成（カテゴリは空にする）
        const abilityRow = createKarmaRow();
        abilityRow.kind = "異能";
        abilityRow.category = ""; // 自動コピーを削除

        // 代償の行を作成（カテゴリは空にする）
        const priceRow = createKarmaRow();
        priceRow.kind = "代償";
        priceRow.category = ""; // 自動コピーを削除

        // シートのカルマリストの末尾に追加
        sheet.karma.push(abilityRow, priceRow);

        recomputeDerivedFields(sheet);
        renderDerivedFields(sheet);
        sheet.updatedAt = nowText();
        markDirty();
        renderEditor();
      });
    }

    if (el.karmaEffectLineModeSelect) {
      el.karmaEffectLineModeSelect.addEventListener("change", () => {
        const sheet = getSelected();
        if (!sheet) return;
        renderKarma(sheet);
      });
    }
    if (el.addHistoryButton)
      el.addHistoryButton.addEventListener("click", () => addRow("history"));

    document.addEventListener("keydown", (event) => {
      const key = String(event.key || "").toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "s") {
        event.preventDefault();
        // ★ Ctrl+Sでの保存時もボタンのローディング処理を走らせるため click() を発火
        if (el.saveEnemyButton && !el.saveEnemyButton.disabled) {
          el.saveEnemyButton.click();
        }
      }
    });
  }

  async function boot() {
    setStatus("読込中…");
    try {
      await loadFromDb();
    } catch (error) {
      console.warn("[satasupe] DB読込失敗。ローカルへフォールバック", error);
      loadStorage();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get("id");

    if (state.sheets.length) {
      if (targetId) {
        const found = state.sheets.find(
          (s) => String(s.id) === String(targetId),
        );
        if (found) {
          state.selectedId = found.id;
        } else {
          window.alert(
            "指定されたエネミーが見つかりません。\n削除されているか、非公開に設定されています。\n作者に「公開」してもらうよう頼んでください！",
          );
          const fallbackId = getLastSelectedId();
          const lastSheet = fallbackId
            ? state.sheets.find((s) => String(s.id) === String(fallbackId))
            : null;
          state.selectedId = lastSheet ? lastSheet.id : state.sheets[0].id;
        }
      } else {
        const lastId = getLastSelectedId();
        const lastSheet = lastId
          ? state.sheets.find((s) => String(s.id) === String(lastId))
          : null;
        if (lastId && !lastSheet) {
          const fresh = createSheetTemplate();
          fresh.author = getRememberedAuthor();
          state.sheets.unshift(fresh);
          localUnsavedSheetIds.add(String(fresh.id || ""));
          state.selectedId = fresh.id;
          markDirty();
        }
        const preferred = lastSheet || state.sheets[0];
        const shouldShowRestoreDialog =
          !!lastSheet && state.dirty && !isFreshBlankSheetForRestore(preferred);
        if (shouldShowRestoreDialog) {
          const restore = await showRestoreDialog(preferred);
          if (restore) {
            state.selectedId = preferred ? preferred.id : state.selectedId;
          } else {
            const fresh = createSheetTemplate();
            fresh.author = getRememberedAuthor();
            state.sheets.unshift(fresh);
            localUnsavedSheetIds.add(String(fresh.id || ""));
            state.selectedId = fresh.id;
            markDirty();
          }
        } else {
          state.selectedId = preferred ? preferred.id : state.selectedId;
        }
      }

      if (!state.selectedId) {
        const fresh = createSheetTemplate();
        fresh.author = getRememberedAuthor();
        state.sheets.unshift(fresh);
        localUnsavedSheetIds.add(String(fresh.id || ""));
        state.selectedId = fresh.id;
        markDirty();
      }
    } else {
      if (targetId) {
        window.alert(
          "指定されたエネミーが見つかりません。\n削除されているか、非公開に設定されています。\n作者に「公開」してもらうよう頼んでください！",
        );
      }
      const fresh = createSheetTemplate();
      fresh.author = getRememberedAuthor();
      state.sheets.unshift(fresh);
      localUnsavedSheetIds.add(String(fresh.id || ""));
      state.selectedId = fresh.id;
      markDirty();
    }

    ensureSelected();
    const selected = getSelected();
    if (selected && selected.author) rememberAuthor(selected.author);
    bindEvents();
    renderAll();
    setStatus("未保存");
  }

  void boot();
})();

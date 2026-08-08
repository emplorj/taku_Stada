document.addEventListener("DOMContentLoaded", () => {
  const panel = document.getElementById("panel-enemy-builder");
  if (!panel) return;

  const $ = (id) => document.getElementById(id);
  const fields = {
    level: $("enemy-builder-level"), preset: $("enemy-builder-preset"), role: $("enemy-builder-role"), partCount: $("enemy-builder-part-count"),
    generationMode: $("enemy-builder-generation-mode"), dreamAl: $("enemy-builder-dream-al"),
    dreamPlayers: $("enemy-builder-dream-players"), dreamTaxa: $("enemy-builder-dream-taxa"), dreamPersonality: $("enemy-builder-dream-personality"),
    dreamRoll: $("enemy-builder-dream-roll"), dreamSummary: $("enemy-builder-dream-summary"),
    name: $("enemy-builder-name"), taxa: $("enemy-builder-taxa"), race: $("enemy-builder-race"), raceField: $("enemy-builder-race-field"), intelligence: $("enemy-builder-intelligence"),
    perception: $("enemy-builder-perception"), reaction: $("enemy-builder-reaction"), language: $("enemy-builder-language"),
    habitat: $("enemy-builder-habitat"), reputation: $("enemy-builder-reputation"), weaknessValue: $("enemy-builder-weakness-value"),
    weakness: $("enemy-builder-weakness"), initiative: $("enemy-builder-initiative"), mobility: $("enemy-builder-mobility"),
    vitResist: $("enemy-builder-vit-resist"), vitResistFix: $("enemy-builder-vit-resist-fix"),
    mndResist: $("enemy-builder-mnd-resist"), mndResistFix: $("enemy-builder-mnd-resist-fix"), coreParts: $("enemy-builder-core-parts"),
    partsManual: $("enemy-builder-parts-manual"), splitDuplicateParts: $("enemy-builder-split-duplicate-parts"), partsTotal: $("enemy-builder-parts-total"),
    partsBreakdown: $("enemy-builder-parts-breakdown"), corePartsList: $("enemy-builder-core-parts-list"),
    loot: $("enemy-builder-loot"), description: $("enemy-builder-description"), output: $("enemy-builder-output"),
    outputFormat: $("enemy-builder-output-format"), outputNote: $("enemy-builder-output-note"),
    copyLabel: $("enemy-builder-copy-label"), downloadLabel: $("enemy-builder-download-label"),
    importSource: $("enemy-builder-import-source"), importButton: $("enemy-builder-import-button"), importStatus: $("enemy-builder-import-status"),
    parts: $("enemy-builder-parts"), abilities: $("enemy-builder-abilities"), abilityPreview: $("enemy-builder-ability-preview"),
    copyAbilities: $("enemy-builder-copy-abilities"),
  };

  const roleProfiles = {
    balanced: { label: "標準", hit: 0, damage: 0, eva: 0, defense: 0, hp: 1, mp: 1, resist: 0 },
    striker: { label: "高火力", hit: 1, damage: 3, eva: 0, defense: -1, hp: 0.86, mp: 0.8, resist: -1 },
    tank: { label: "頑丈", hit: -1, damage: -1, eva: -1, defense: 3, hp: 1.45, mp: 0.75, resist: 1 },
    caster: { label: "術師", hit: -2, damage: -2, eva: 0, defense: -2, hp: 0.78, mp: 2.1, resist: 1 },
    boss: { label: "ボス", hit: 1, damage: 2, eva: 1, defense: 2, hp: 1.75, mp: 1.5, resist: 1 },
  };

  // Monstrous Loreの収録データを基準にした即席作成用の概算値。
  // 戦闘値はPDFから取得できた約270件の主攻撃行をもとに、レベルに対する全体回帰式へ
  // 分類ごとの残差中央値を加えている。公式データそのものを再現する値ではなく、空欄の初期案として使う。
  const enemyEstimateBase = {
    accuracy: [1.217, 0.869], damage: [1.261, -0.210], evasion: [1.165, 0.402], defense: [1.070, -0.653],
    hp: [9.360, -4.594], mp: [6.286, -7.141], vit: [1.202, 1.081], mnd: [1.188, 0.945],
  };

  const enemyEstimateOffsets = {
    蛮族: { accuracy: 0, damage: 0, evasion: 0, defense: 0, hp: -1, mp: 2, vit: 0, mnd: 0 },
    動物: { accuracy: 0, damage: 1, evasion: 0, defense: 0, hp: 0, mp: -12, vit: 1, mnd: -1 },
    植物: { accuracy: 0, damage: 0, evasion: 0, defense: -1, hp: 0, mp: -11, vit: 0, mnd: -1 },
    アンデッド: { accuracy: 0, damage: -1, evasion: 0, defense: 0, hp: -3, mp: -3, vit: 0, mnd: 0 },
    魔法生物: { accuracy: 1, damage: 0, evasion: 0, defense: 0, hp: 0, mp: 0, vit: 0, mnd: 0, noMp: true },
    魔動機: { accuracy: 0, damage: 1, evasion: 0, defense: 0, hp: 3, mp: 0, vit: 0, mnd: 0, noMp: true },
    幻獣: { accuracy: 0, damage: 0, evasion: 1, defense: -1, hp: 2, mp: -2, vit: 0, mnd: 0 },
    妖精: { accuracy: 0, damage: -1, evasion: 1, defense: 1, hp: -4, mp: 18, vit: 0, mnd: 0 },
    魔神: { accuracy: 0, damage: 0, evasion: 0, defense: 0, hp: 3, mp: -5, vit: 0, mnd: 0 },
    人族: { accuracy: 0, damage: 0, evasion: 0, defense: 0, hp: -3, mp: 0, vit: 0, mnd: 0 },
  };

  // 自動補完した値だけを追跡する。手入力で変更された欄は以後の分類・レベル変更で上書きしない。
  const enemySuggestedValues = new Map();

  function setEnemySuggestedValue(input, value) {
    if (!input) return false;
    const next = value === null || value === undefined ? "" : String(value);
    const hasPrevious = enemySuggestedValues.has(input);
    const previous = hasPrevious ? enemySuggestedValues.get(input) : null;
    if (input.value !== "" && (!hasPrevious || input.value !== previous)) return false;
    input.value = next;
    enemySuggestedValues.set(input, next);
    return true;
  }

  function releaseEnemySuggestion(input) {
    if (!input || !enemySuggestedValues.has(input)) return;
    if (input.value !== enemySuggestedValues.get(input)) enemySuggestedValues.delete(input);
  }

  function clearEnemySuggestedValue(input) {
    if (!input || !enemySuggestedValues.has(input)) return;
    if (input.value === enemySuggestedValues.get(input)) input.value = "";
    enemySuggestedValues.delete(input);
  }

  function clearEstimatedEnemyCombatStats() {
    [fields.vitResist, fields.vitResistFix, fields.mndResist, fields.mndResistFix].forEach(clearEnemySuggestedValue);
    Array.from(fields.parts.querySelectorAll(".enemy-builder-part-row")).forEach((row) => {
      [
        ".enemy-builder-part-accuracy", ".enemy-builder-part-accuracy-fix", ".enemy-builder-part-damage",
        ".enemy-builder-part-evasion", ".enemy-builder-part-evasion-fix", ".enemy-builder-part-defense",
        ".enemy-builder-part-hp", ".enemy-builder-part-mp",
      ].forEach((selector) => clearEnemySuggestedValue(row.querySelector(selector)));
    });
  }

  function enemyLevelBandIntelligence(taxa, level) {
    if (taxa === "蛮族") return level <= 3 ? "低い" : level >= 13 ? "高い" : "人間並み";
    if (taxa === "植物") return level <= 9 ? "なし" : level <= 15 ? "低い" : "高い";
    if (taxa === "幻獣") return level >= 13 ? "高い" : (level >= 4 && level <= 6 ? "人間並み" : "低い");
    if (taxa === "妖精") return level >= 16 ? "高い" : "人間並み";
    if (taxa === "魔神") return level <= 3 ? "低い" : level >= 10 ? "高い" : "人間並み";
    return ({
      動物: "動物並み", アンデッド: "低い", 魔法生物: "命令を聞く", 魔動機: "命令を聞く", 人族: "人間並み",
    })[taxa] || "";
  }

  function selectedRaceLanguage() {
    const race = selectedRaceData();
    if (!race) return "交易共通語、地方語（）";
    const raw = String(race.languages || "").replace(/[\n／/]+/g, "、").trim();
    const raceLanguage = raw === "地方語" ? "地方語（）" : raw;
    const values = ["交易共通語", ...splitMultiValue(raceLanguage)].filter(Boolean);
    return uniqueMultiValues(values).join("、");
  }

  function selectedRaceHasDarkvision() {
    const race = selectedRaceData();
    if (!race) return false;
    return (race.featureNames || []).some((name) => String(name).includes("暗視"));
  }

  function estimatedEnemyTraits(taxa, level) {
    if (!enemyEstimateOffsets[taxa]) return null;
    const result = {
      intelligence: enemyLevelBandIntelligence(taxa, level),
      perception: ({
        蛮族: level <= 3 ? "五感" : "五感（暗視）", 動物: "五感", 植物: "魔法", アンデッド: "魔法",
        魔法生物: "魔法", 魔動機: "機械", 幻獣: "五感（暗視）", 妖精: "五感", 魔神: "五感（暗視）", 人族: "五感",
      })[taxa] || "",
      reaction: ({
        蛮族: "敵対的", 動物: "腹具合による", 植物: "敵対的", アンデッド: "敵対的", 魔法生物: "命令による",
        魔動機: "命令による", 幻獣: "中立", 妖精: "中立", 魔神: "敵対的", 人族: "中立",
      })[taxa] || "",
      language: ({
        蛮族: "汎用蛮族語", 動物: "なし", 植物: "なし", アンデッド: "なし", 魔法生物: "なし", 魔動機: "なし",
        幻獣: "なし", 妖精: "妖精語", 魔神: "魔神語", 人族: "交易共通語、地方語（）",
      })[taxa] || "",
    };
    if (taxa === "人族") {
      result.language = selectedRaceLanguage();
      if (selectedRaceHasDarkvision()) result.perception = "五感（暗視）";
    }
    return result;
  }

  function humanRaceCombatModifier() {
    const name = normalizeRaceName(fields.race?.value || "");
    const mod = { accuracy: 0, damage: 0, evasion: 0, defense: 0, hp: 0, mp: 0, vit: 0, mnd: 0, noMp: false };
    if (!name || name === "人間") return mod;
    if (name.startsWith("エルフ")) { mod.mnd += 1; mod.damage -= 1; mod.hp -= 5; mod.mp += 5; }
    else if (name.startsWith("ドワーフ")) { mod.vit += 1; mod.mnd += 1; mod.accuracy += 1; mod.damage += 1; mod.evasion -= 2; mod.defense += 2; }
    else if (name.startsWith("タビット")) { mod.accuracy -= 2; mod.evasion -= 2; mod.mp += 5; }
    else if (name.startsWith("ルーンフォーク")) { mod.mnd -= 1; mod.accuracy += 1; mod.mp -= 5; }
    else if (name.startsWith("ナイトメア")) { mod.accuracy += 1; mod.damage += 1; mod.hp += 5; mod.mp += 5; }
    else if (name.startsWith("リカント")) { mod.vit -= 1; mod.mnd -= 1; mod.accuracy += 1; mod.damage += 1; mod.hp -= 5; mod.mp -= 5; }
    else if (name.startsWith("リルドラケン")) { mod.vit += 2; mod.damage += 1; mod.evasion -= 2; mod.defense += 2; mod.hp += 10; }
    else if (name.startsWith("グラスランナー")) { mod.mnd += 2; mod.accuracy += 1; mod.damage -= 4; mod.evasion += 2; mod.defense -= 4; mod.noMp = true; }
    else if (name.startsWith("メリア")) { mod.vit += 2; mod.mnd += 1; mod.evasion -= 1; mod.hp += 10; mod.mp += 5; }
    else if (name.startsWith("ティエンス")) { mod.mnd += 1; mod.damage += 1; }
    else if (name.startsWith("レプラカーン")) { mod.vit += 1; mod.accuracy += 1; mod.damage -= 2; mod.evasion += 1; mod.defense -= 2; }
    return mod;
  }

  function estimateEnemyCombatValue(stat, level, taxa, raceMod = null) {
    const formula = enemyEstimateBase[stat];
    const taxaMod = enemyEstimateOffsets[taxa];
    if (!formula || !taxaMod) return null;
    if (stat === "mp" && (taxaMod.noMp || raceMod?.noMp)) return null;
    const raw = formula[0] * level + formula[1] + (taxaMod[stat] || 0) + (raceMod?.[stat] || 0);
    if (stat === "damage") return Math.max(-2, Math.round(raw));
    if (stat === "hp") return Math.max(1, Math.round(raw));
    return Math.max(0, Math.round(raw));
  }

  function formatEstimatedDamage(value) {
    if (value === null || value === undefined) return "";
    if (value === 0) return "2d";
    return `2d${value > 0 ? "+" : ""}${value}`;
  }

  function applyEstimatedEnemyTraitsAndStats() {
    const taxa = fields.taxa.value.trim();
    const levelRaw = fields.level.value;
    const level = Number(levelRaw);
    const hasLevel = Number.isFinite(level) && level >= 1;
    const traits = estimatedEnemyTraits(taxa, hasLevel ? level : 1);
    if (traits) {
      setEnemySuggestedValue(fields.intelligence, traits.intelligence);
      setEnemySuggestedValue(fields.perception, traits.perception);
      setEnemySuggestedValue(fields.reaction, traits.reaction);
      setEnemySuggestedValue(fields.language, traits.language);
    } else {
      [fields.intelligence, fields.perception, fields.reaction, fields.language].forEach(clearEnemySuggestedValue);
    }
    if (!hasLevel || !enemyEstimateOffsets[taxa]) {
      clearEstimatedEnemyCombatStats();
      updateOutput();
      return;
    }

    const raceMod = taxa === "人族" ? humanRaceCombatModifier() : null;
    const vit = estimateEnemyCombatValue("vit", level, taxa, raceMod);
    const mnd = estimateEnemyCombatValue("mnd", level, taxa, raceMod);
    if (setEnemySuggestedValue(fields.vitResist, vit)) setEnemySuggestedValue(fields.vitResistFix, vit === null ? "" : fixedValue(vit));
    if (setEnemySuggestedValue(fields.mndResist, mnd)) setEnemySuggestedValue(fields.mndResistFix, mnd === null ? "" : fixedValue(mnd));

    Array.from(fields.parts.querySelectorAll(".enemy-builder-part-row")).forEach((row) => {
      const accuracy = estimateEnemyCombatValue("accuracy", level, taxa, raceMod);
      const damage = estimateEnemyCombatValue("damage", level, taxa, raceMod);
      const evasion = estimateEnemyCombatValue("evasion", level, taxa, raceMod);
      const defense = estimateEnemyCombatValue("defense", level, taxa, raceMod);
      const hp = estimateEnemyCombatValue("hp", level, taxa, raceMod);
      const mp = estimateEnemyCombatValue("mp", level, taxa, raceMod);
      const accuracyInput = row.querySelector(".enemy-builder-part-accuracy");
      const accuracyFixInput = row.querySelector(".enemy-builder-part-accuracy-fix");
      const evasionInput = row.querySelector(".enemy-builder-part-evasion");
      const evasionFixInput = row.querySelector(".enemy-builder-part-evasion-fix");
      if (setEnemySuggestedValue(accuracyInput, accuracy)) setEnemySuggestedValue(accuracyFixInput, accuracy === null ? "" : fixedValue(accuracy));
      setEnemySuggestedValue(row.querySelector(".enemy-builder-part-damage"), formatEstimatedDamage(damage));
      if (setEnemySuggestedValue(evasionInput, evasion)) setEnemySuggestedValue(evasionFixInput, evasion === null ? "" : fixedValue(evasion));
      setEnemySuggestedValue(row.querySelector(".enemy-builder-part-defense"), defense);
      setEnemySuggestedValue(row.querySelector(".enemy-builder-part-hp"), hp);
      setEnemySuggestedValue(row.querySelector(".enemy-builder-part-mp"), mp);
    });
    updateOutput();
  }

  const dreamFormationTable = {
    1: [[1, 1, 1, -1], [2, 0, 0, 0], [2, -1, 0, 0], [1, 1, 0, 0], [1, 0, 1, -1], [1, 0, 0, 0]],
    2: [[2, 0, 1, -1], [3, 1, 1, -1], [3, 0, 0, 0], [1, 1, 1, -1], [1, 0, 1, -1], [2, 0, 0, 0]],
    3: [[1, 2, 3, 0], [2, 1, 2, 0], [3, 1, 1, 0], [1, 2, 2, 0], [2, 1, 1, 0], [3, 1, 0, 0]],
    4: [[1, 2, 1, 1], [2, 2, 2, 1], [2, 2, 3, 0], [1, 1, 4, 0], [2, 1, 3, 0], [3, 1, 2, 0]],
    5: [[3, 3, 2, 1], [2, 3, 3, 1], [1, 3, 2, 2], [1, 2, 4, 1], [2, 2, 4, 1], [3, 2, 2, 1]],
  };

  const dreamBossStats = [
    null,
    [2, 0, 1, 1, 10], [3, 2, 2, 2, 16], [5, 3, 4, 2, 23], [6, 5, 5, 3, 31],
    [7, 6, 6, 4, 40], [8, 7, 8, 5, 50], [10, 9, 9, 5, 61], [11, 10, 10, 6, 72],
    [12, 11, 11, 7, 84], [13, 13, 12, 8, 96], [15, 14, 14, 8, 108], [16, 15, 15, 9, 120], [17, 17, 16, 10, 132],
  ];

  const dreamOtherStats = [
    null,
    [3, 1, 0, 0, 7], [4, 3, 2, 1, 11], [5, 4, 3, 2, 16], [6, 6, 4, 2, 22],
    [8, 8, 5, 3, 29], [9, 9, 7, 4, 37], [11, 11, 8, 5, 46], [12, 12, 9, 5, 56],
    [13, 14, 10, 6, 67], [14, 15, 11, 7, 78], [16, 16, 13, 8, 89], [17, 17, 14, 8, 100], [18, 19, 15, 9, 111],
  ];

  const dreamWeaknesses = {
    蛮族: ["物理ダメージ+2点", "魔法ダメージ+2点", "命中力+1"],
    動物: ["魔法ダメージ+2点", "衝撃属性ダメージ+3点", "水・氷属性ダメージ+3点"],
    植物: ["物理ダメージ+2点", "魔法ダメージ+2点", "炎属性ダメージ+3点"],
    アンデッド: ["回復効果ダメージ+3点", "炎属性ダメージ+3点", "魔法ダメージ+2点"],
    魔法生物: ["雷属性ダメージ+3点", "衝撃属性ダメージ+3点", "命中力+1"],
    幻獣: ["物理ダメージ+2点", "風属性ダメージ+3点", "断空属性ダメージ+3点"],
    妖精: ["土属性ダメージ+3点", "純エネルギー属性ダメージ+3点", "命中力+1"],
    魔神: ["魔法ダメージ+2点", "命中力+1", "断空属性ダメージ+3点"],
    人族: ["なし"],
  };

  const dreamTaxaDefaults = {
    蛮族: ["人間並み", "五感（暗視）", "敵対的", "汎用蛮族語", "さまざま"],
    動物: ["動物並み", "五感", "腹具合による", "なし", "森、草原"],
    植物: ["なし", "魔法", "腹具合による", "なし", "森、湿地"],
    アンデッド: ["低い", "魔法", "敵対的", "なし", "墓地、遺跡"],
    魔法生物: ["命令を聞く", "魔法", "命令による", "なし", "遺跡"],
    幻獣: ["低い", "五感（暗視）", "敵対的", "なし", "山岳、洞窟"],
    妖精: ["人間並み", "五感", "中立", "妖精語", "自然環境"],
    魔神: ["高い", "五感（暗視）", "敵対的", "魔神語", "さまざま"],
    人族: ["人間並み", "五感", "敵対的", "交易共通語", "さまざま"],
  };

  const multiChoiceOptions = {
    language: [
      // 「なし」は言語名ではないため先頭の特別選択肢として保持する。
      // 以下は既存のSW2.5言語候補リストの順序をそのまま使い、頻度順には並べ替えない。
      "なし",
      "交易共通語",
      "地方語（）",
      "神紀文明語",
      "魔法文明語",
      "魔動機文明語",
      "エルフ語",
      "ドワーフ語",
      "グラスランナー語",
      "シャドウ語",
      "ソレイユ語",
      "ミアキス語",
      "リカント語",
      "ドラゴン語",
      "妖精語",
      "海獣語",
      "ヴァルグ語",
      "汎用蛮族語",
      "妖魔語",
      "巨人語",
      "ドレイク語",
      "バジリスク語",
      "ノスフェラトゥ語",
      "マーマン語",
      "ケンタウロス語",
      "ライカンスロープ語",
      "リザードマン語",
      "ハルピュイア語",
      "バルカン語",
      "翼人語",
      "魔神語"
    ],
    habitat: [
      // Monstrous Lore本体のHabitat出現数を基準に、複数の魔物で反復するものだけを概ね頻出順で並べる。
      // 英訳で「山／山岳」のように日本語側の表記差を判別できないものは隣接配置する。
      // 浮遊大陸・温泉など少数／固有寄りの生息地は候補化せず、自由入力で扱う。
      "さまざま", "遺跡", "森",
      "山", "山岳",
      "洞窟", "魔域", "地下迷宮",
      "荒野", "湿地", "草原", "砂漠", "平原",
      "海", "不明", "河川", "海岸",
      "秘境", "寒冷地", "丘陵", "墓地",
      "高山", "湖", "火山", "水辺"
    ],
  };

  // 英語版Monstrous Loreの魔物データで反復して確認できる項目だけを視覚的に強調する。
  // 候補マスター自体の順序・採否とは分離し、頻出でない候補も通常ボタンとして残す。
  const frequentMultiChoiceOptions = {
    language: new Set([
      "なし", "交易共通語", "地方語（）", "魔法文明語", "魔動機文明語",
      "妖精語", "汎用蛮族語", "妖魔語", "ドレイク語", "魔神語"
    ]),
    // 生息地は頻出度で優先順位を付けない。「さまざま」だけ目印を付ける。
    habitat: new Set(["さまざま"]),
  };

  const splitMultiValue = (value) => String(value || "")
    .split(/[、,，]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const uniqueMultiValues = (items) => Array.from(new Set(items.filter(Boolean)));

  function initMultiChoiceField(key) {
    const field = fields[key];
    const picker = $(key === "language" ? "enemy-builder-language-picker" : "enemy-builder-habitat-picker");
    const details = picker?.closest(".enemy-builder-multi-picker");
    const options = multiChoiceOptions[key] || [];
    if (!field || !picker || !details) return;

    const frequentOptions = frequentMultiChoiceOptions[key] || new Set();
    picker.innerHTML = `
      <div class="enemy-builder-multi-picker-legend" aria-label="候補表示の凡例">
        <span class="enemy-builder-multi-legend-item"><span class="enemy-builder-multi-legend-swatch is-frequent" aria-hidden="true"></span><span>色付き＝よく使う候補</span></span>
        <span class="enemy-builder-multi-legend-item"><span class="enemy-builder-multi-legend-swatch is-selected" aria-hidden="true">✓</span><span>✓＝選択中</span></span>
      </div>
      <div class="enemy-builder-multi-option-list">
        ${options.map((option) => {
          const frequentClass = frequentOptions.has(option) ? " is-frequent" : "";
          return `<button type="button" class="enemy-builder-multi-option${frequentClass}" data-value="${escapeHtml(option)}" aria-pressed="false"><span class="enemy-builder-multi-option-label">${escapeHtml(option)}</span></button>`;
        }).join("")}
      </div>
      <div class="enemy-builder-multi-custom">
        <input type="text" class="enemy-builder-multi-custom-input" placeholder="その他を入力" aria-label="その他の${key === "language" ? "言語" : "生息地"}" />
        <button type="button" class="small-button enemy-builder-multi-custom-add">追加</button>
      </div>`;

    const optionButtons = () => Array.from(picker.querySelectorAll(".enemy-builder-multi-option"));

    const syncOptions = () => {
      const selected = new Set(splitMultiValue(field.value));
      optionButtons().forEach((button) => {
        const isSelected = selected.has(button.dataset.value || "");
        button.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
      });
    };

    const commitOption = (changedButton) => {
      const value = String(changedButton?.dataset.value || "");
      if (!value) return;

      const known = new Set(options);
      const custom = splitMultiValue(field.value).filter((item) => !known.has(item));
      const selected = new Set(splitMultiValue(field.value).filter((item) => known.has(item)));
      const wasSelected = selected.has(value);

      if (wasSelected) {
        selected.delete(value);
      } else if (key === "language" && value === "なし") {
        selected.clear();
        selected.add("なし");
      } else {
        if (key === "language") selected.delete("なし");
        selected.add(value);
      }

      const customValues = key === "language" && selected.has("なし") ? [] : custom;
      field.value = uniqueMultiValues([...selected, ...customValues]).join("、");
      syncOptions();
      field.dispatchEvent(new Event("input", { bubbles: true }));
    };

    details.addEventListener("toggle", () => {
      if (!details.open) return;
      document.querySelectorAll("#panel-enemy-builder .enemy-builder-multi-picker[open]").forEach((other) => {
        if (other !== details) other.open = false;
      });
      syncOptions();
    });
    document.addEventListener("pointerdown", (event) => {
      if (details.open && !details.contains(event.target)) details.open = false;
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && details.open) details.open = false;
    });
    picker.addEventListener("click", (event) => {
      const button = event.target.closest(".enemy-builder-multi-option");
      if (button && picker.contains(button)) commitOption(button);
    });
    picker.querySelector(".enemy-builder-multi-custom-add")?.addEventListener("click", () => {
      const customInput = picker.querySelector(".enemy-builder-multi-custom-input");
      const additions = splitMultiValue(customInput?.value);
      if (!additions.length) return;
      let values = splitMultiValue(field.value);
      if (key === "language" && additions.includes("なし")) {
        values = [];
        additions.splice(0, additions.length, "なし");
      } else if (key === "language" && additions.some((item) => item !== "なし")) {
        values = values.filter((item) => item !== "なし");
      }
      field.value = uniqueMultiValues([...values, ...additions]).join("、");
      if (customInput) customInput.value = "";
      syncOptions();
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
    picker.querySelector(".enemy-builder-multi-custom-input")?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      picker.querySelector(".enemy-builder-multi-custom-add")?.click();
    });
    field.addEventListener("input", syncOptions);
    syncOptions();
  }

  const dreamProgressionLevels = [1, 3, 5, 7, 9, 11, 13];
  const dreamPersonalities = {
    instinct: { label: "本能に従う", epithet: "忠実な", techniques: "instinct" },
    aggressive: { label: "攻撃的", epithet: "退かない", magic: "aggressive", techniques: "aggressive" },
    brutal: { label: "残忍", epithet: "心無い", magic: "brutal" },
    cautious: { label: "慎重", epithet: "念押しの", magic: "cautious" },
    cunning: { label: "狡猾", epithet: "搦手の", magic: "tactical" },
    rational: { label: "理性的", epithet: "見通す", magic: "defensive" },
  };

  const dreamMagicProgressions = {
    aggressive: {
      label: "攻撃魔法習熟",
      spells: ["エネルギー・ボルト", "リープ・スラッシュ", "ブラスト", "ドレイン・タッチ", "エネルギー・ジャベリン", "サンダー・ボルト", "ショック"],
      feats: ["ターゲッティング", "魔法拡大／数", "マルチアクション", "バイオレントキャストⅠ", "鷹の目", "ルーンマスター", null],
    },
    brutal: {
      label: "攻撃魔法習熟",
      spells: ["スパーク", "ポイズン・クラウド", "ライトニング", "ファイアボール", "アシッド・クラウド", "ブリザード", "ライトニング・バインド"],
      feats: ["ターゲッティング", "魔法拡大／数", "魔法制御", "マルチアクション", "クリティカルキャストⅠ", "ルーンマスター", null],
    },
    cautious: {
      label: "強化魔法習熟",
      spells: ["プロテクション", "カウンター・マジック", "ファイア・ウェポン", "アース・シールド", "アイシクル・ウェポン", "プロテクションⅡ", "ヘイスト"],
      feats: ["ターゲッティング", "魔法拡大／数", "マルチアクション", null, "ダブルキャスト", "ルーンマスター", null],
    },
    defensive: {
      label: "強化魔法習熟",
      spells: ["フィールド・プロテクション", "フィールド・レジスト", "カウンター・マジック", "バトルソング", "フィールド・プロテクションⅡ", "ホーリー・ブレッシング", "ヘイスト"],
      feats: ["ターゲッティング", "魔法拡大／数", "マルチアクション", null, "ダブルキャスト", "ルーンマスター", null],
    },
    tactical: {
      label: "弱体魔法習熟",
      spells: ["ダーク・ミスト", "パラライズ", "フォビドゥン・マジック", "スタン・クラウド", "イレイス・マジック", "スロウ", "マナ・シール"],
      feats: ["ターゲッティング", "魔法拡大／数", "魔法収束", "魔法制御", "マルチアクション", "ルーンマスター", null],
    },
  };

  const dreamTechniqueProgressions = {
    instinct: ["ガゼルフット", "キャッツアイ", "マッスルベアー", "ビートルスキン", "リカバリィ（5点回復）", "ジャイプロフェシー", "トロールバイタル"],
    aggressive: ["マッスルベアー", "キャッツアイ", "ジャイアントアーム", "デーモンフィンガー", "リカバリィ（5点回復）", "ジャイプロフェシー", "トロールバイタル"],
  };

  const dreamFeatMarkers = {
    ターゲッティング: "常", 鷹の目: "常", 魔法収束: "常", 魔法制御: "常", ルーンマスター: "常",
    "魔法拡大／数": "宣", マルチアクション: "宣", バイオレントキャストⅠ: "宣", クリティカルキャストⅠ: "宣", ダブルキャスト: "宣",
  };

  const enemyPresets = {
    custom: { label: "自由作成", abilities: [] },
    beast: {
      label: "近接獣", role: "striker", taxa: "動物", intelligence: "動物並み", perception: "五感",
      reaction: "腹具合による", language: "なし", habitat: "森、草原", weakness: "魔法ダメージ+2点",
      partCount: 1, partNames: ["牙"], abilities: ["charge", "continuous-attack", "keen-senses"],
    },
    flyer: {
      label: "飛行・ブレス型", role: "balanced", taxa: "幻獣", intelligence: "低い", perception: "五感（暗視）",
      reaction: "敵対的", language: "なし", habitat: "山岳、洞窟", weakness: "風属性ダメージ+3点",
      partCount: 2, partNames: ["牙（頭部）", "翼（翼）"], coreParts: "頭部", abilities: ["flight", "breath", "tail-sweep"],
    },
    shooter: {
      label: "射撃手", role: "striker", taxa: "人族", intelligence: "人間並み", perception: "五感",
      reaction: "敵対的", language: "交易共通語", habitat: "街道、砦", weakness: "物理ダメージ+2点",
      partCount: 1, partNames: ["武器"], abilities: ["targeting-hawk-eye", "ranged"],
    },
    caster: {
      label: "魔法使い", role: "caster", taxa: "人族", intelligence: "高い", perception: "五感",
      reaction: "中立", language: "交易共通語、魔法文明語", habitat: "街、遺跡", weakness: "物理ダメージ+2点",
      partCount: 1, partNames: ["杖"], abilities: ["magic", "magic-adaptation", "targeting", "preparation"],
    },
    construct: {
      label: "魔法生物・魔動機", role: "tank", taxa: "魔法生物", intelligence: "命令を聞く", perception: "魔法",
      reaction: "命令による", language: "なし", habitat: "遺跡、研究施設", weakness: "雷属性ダメージ+3点",
      partCount: 1, partNames: ["拳"], abilities: ["mechanical-body", "immunity", "guard", "self-destruct"],
    },
    undead: {
      label: "アンデッド", role: "tank", taxa: "アンデッド", intelligence: "低い", perception: "魔法",
      reaction: "敵対的", language: "なし", habitat: "墓地、遺跡", weakness: "回復効果ダメージ+3点",
      partCount: 1, partNames: ["爪"], abilities: ["immunity", "drain", "regeneration", "fear"],
    },
    plant: {
      label: "植物・拘束型", role: "tank", taxa: "植物", intelligence: "なし", perception: "魔法",
      reaction: "腹具合による", language: "なし", habitat: "森、湿地", weakness: "炎属性ダメージ+3点",
      partCount: 2, partNames: ["花（本体）", "つる（つる）"], coreParts: "本体", abilities: ["rooted", "entangle", "area", "regeneration"],
    },
    multiBoss: {
      label: "多部位ボス", role: "boss", taxa: "幻獣", intelligence: "高い", perception: "五感（暗視）",
      reaction: "敵対的", language: "交易共通語、魔法文明語", habitat: "山岳、遺跡", weakness: "魔法ダメージ+2点",
      partCount: 3, partNames: ["牙（頭部）", "爪（胴体）", "尾（尻尾）"], coreParts: "頭部",
      abilities: ["multiple-actions", "flight", "breath", "tail-sweep"],
    },
  };

  const abilityTemplates = [
    { id: "flight", category: "passive", marker: "常", name: "飛行", tags: "空中 翼 命中 回避", defaultBody: "近接攻撃の命中力・回避力判定に+1のボーナス修正を得ます。" },
    { id: "wing-flight", category: "passive", marker: "常", name: "飛翔", tags: "空中 翼 全部位 命中 回避", defaultBody: "すべての部位は、近接攻撃における命中力・回避力判定に+1のボーナス修正を得ます。[部位：翼]のいずれかのHPが0以下になった場合、この能力は失われます。" },
    { id: "wing-flight-ii", category: "passive", marker: "常", name: "飛翔Ⅱ", tags: "空中 翼 全部位 命中 回避 2", defaultBody: "すべての部位は、近接攻撃における命中力・回避力判定に+2のボーナス修正を得ます。[部位：翼]のいずれかのHPが0以下になった場合、この能力は失われます。" },
    { id: "targeting", category: "passive", marker: "常", name: "ターゲッティング", tags: "射撃 魔法 誤射", defaultBody: "遠隔攻撃で誤射を起こしません。" },
    { id: "targeting-hawk-eye", category: "passive", marker: "常", name: "ターゲッティング＆鷹の目", tags: "遮蔽 射撃 魔法 誤射", defaultBody: "遠隔攻撃で誤射を起こさず、乱戦エリアや遮蔽越しに任意の対象を選べます。" },
    { id: "multi-attack", category: "passive", marker: "常", name: "2回攻撃／双撃", tags: "近接 複数 回数 双撃 2回攻撃", defaultBody: "1回の主動作で同じ対象に近接攻撃を2回行います。" },
    { id: "continuous-attack", category: "passive", marker: "常", name: "連続攻撃", tags: "近接 命中 追撃 連続攻撃1 2", defaultBody: "攻撃が命中した場合、同じ対象にもう1回攻撃できます。2回目の攻撃が命中しても、この効果はありません。" },
    { id: "two-actions", category: "passive", marker: "常", name: "2回行動", tags: "主動作 2回 回数", defaultBody: "1ラウンドに主動作を2回行えます。" },
    { id: "multiple-declarations", category: "passive", marker: "常", name: "複数宣言＝2回", tags: "宣言特技 2回 回数", defaultBody: "1ラウンドに2回まで宣言特技を宣言できます。" },
    { id: "destiny-reversal", category: "passive", marker: "常", name: "剣の加護／運命変転", tags: "人族 人間 出目 反転", defaultBody: "行為判定や打撃点決定で2dを振ったとき、直後にその出目をひっくり返します。この能力は1日に1回だけ使えます。" },
    { id: "bone-body", category: "passive", marker: "常", name: "骨の身体", tags: "アンデッド 骨 刃 クリティカル", defaultBody: "刃武器から、クリティカルを受けません。" },
    { id: "tough-skin", category: "passive", marker: "常", name: "強靭な皮膚", tags: "断空 衝撃 物理 魔法 軽減", defaultBody: "断空属性または衝撃属性の物理ダメージ、魔法ダメージを受けるとき、それを「-3」点します。" },
    { id: "limited-two-actions", category: "passive", marker: "常", name: "限定2回行動", tags: "主動作 2回 制限 異なる 行動", defaultBody: "1ラウンドに主動作を2回行えます。ただし、指定した行動制限に従います。" },
    { id: "underwater-specialization", category: "passive", marker: "常", name: "水中特化", tags: "水中 地上 ペナルティ", defaultBody: "水中では、行動に関する制限やペナルティ修正を受けません。反対に、地上ではすべての行為判定に-2のペナルティ修正を受けます。" },
    { id: "bow", category: "passive", marker: "常", name: "弓", tags: "射撃 射程 30m 遠隔", defaultBody: "弓による攻撃は「射程：2（30m）」の射撃攻撃として扱います。" },
    { id: "gun", category: "passive", marker: "常", name: "ガン", tags: "ガン 銃 機関銃 大砲 射撃 装填 射程", defaultBody: "この武器は〈ガン〉として扱います。" },
    { id: "throwing-attack", category: "passive", marker: "常", name: "投擲攻撃", tags: "投擲 投擲攻撃 射撃 武器 射程", defaultBody: "武器による攻撃は投擲攻撃としても扱えます。" },
    { id: "delicate-loot", category: "passive", marker: "常", name: "繊細な戦利品", tags: "戦利品 条件 追加 変化", defaultBody: "特定の攻撃方法を使わずに倒した場合、追加の戦利品を得ます。" },
    { id: "poison-immunity", category: "passive", marker: "常", name: "毒無効", tags: "毒 属性 無効", defaultBody: "毒属性の効果を受けません。" },
    { id: "mental-immunity", category: "passive", marker: "常", name: "精神効果無効", tags: "精神効果 属性 無効", defaultBody: "精神効果属性の効果を受けません。" },
    { id: "posture-control", category: "passive", marker: "常", name: "姿勢制御", tags: "植物 転倒 姿勢", defaultBody: "いかなる効果を受けても転倒しません。" },
    { id: "undying-body", category: "passive", marker: "常", name: "不死の身体", tags: "アンデッド 回復効果", defaultBody: "神聖魔法による回復効果を受けた場合、回復せず、その回復量と同じだけの魔法ダメージを受けます。" },
    { id: "artificial-body", category: "passive", marker: "常", name: "人造の身体", tags: "魔法生物 刃 クリティカル", defaultBody: "刃を持つ武器からクリティカルを受けません。" },
    { id: "magic-lore", category: "passive", marker: "常", name: "魔法への造詣", tags: "幻獣 妖精 魔法", defaultBody: "任意の魔法1系統を魔物レベルと同じレベル、魔力「魔物レベル+3」で使用します。" },
    { id: "magic-adaptation", category: "passive", marker: "常", markers: [], name: "魔法適性", tags: "魔法適性 戦闘特技 ターゲッティング 魔法拡大 マルチアクション", assist: "combat-feats", body: "習得している戦闘特技を候補から選択します。" },
    { id: "immunity", category: "passive", marker: "常", name: "属性・状態への耐性", tags: "毒 病気 精神 無効", defaultBody: "毒、病気、精神効果属性の効果を受けません。" },
    { id: "mechanical-body", category: "passive", marker: "常", name: "機械の身体", tags: "刃 クリティカル 防護", defaultBody: "刃武器からクリティカルを受けません。" },
    { id: "keen-senses", category: "passive", marker: "常", name: "鋭い感覚", tags: "追跡 探知 暗闇 不意打ち", defaultBody: "暗闇による不利な効果を受けず、視覚や嗅覚を用いる探索判定に+2のボーナス修正を得ます。" },
    { id: "guard", category: "declaration", marker: "宣", markers: ["宣", "準"], name: "かばう", tags: "防御 かばう 身代わり 味方 1 2", defaultBody: "同じ乱戦エリア内の味方1体への攻撃を、1ラウンドに1回まで代わりに受けます。" },
    { id: "guardian", category: "passive", marker: "常", name: "ガーディアン", tags: "防御 かばう 複数 回数 1 2", defaultBody: "1ラウンド中、任意のキャラクターを複数回かばえるようになります。" },
    { id: "rooted", category: "passive", marker: "常", name: "根を張る", tags: "転倒 移動 強制移動 植物", defaultBody: "移動できませんが、転倒および強制移動の効果を受けません。" },
    { id: "multiple-actions", category: "passive", marker: "常", name: "複数回行動", tags: "主動作 回数 ボス 高レベル", defaultBody: "1ラウンドに主動作を2回行えます。" },
    { id: "magic", category: "major", marker: "主", name: "魔法行使", tags: "真語 操霊 深智 神聖 妖精 魔動機 森羅 召異 秘奥 奈落", assist: "magic", title: ({ level, magic }) => `真語魔法${level}レベル／魔力${magic}（${fixedValue(magic)}）`, defaultBody: "" },
    // 旧「奈落魔法」単独候補は互換用に定義を残す。新規作成では「魔法行使」の系統から奈落魔法を選ぶ。
    { id: "abyss-magic", category: "major", marker: "主", name: "奈落魔法", tags: "アビスゲイザー 奈落魔法 冒険者技能 魔力 拡張効果", defaultBody: "拡張効果は1ラウンド目だけ使用します。" },
    { id: "psychokinetic-throw", category: "passive", marker: "常", name: "理力投擲", tags: "理力投擲 投擲 射撃 武器 HP消費", defaultBody: "武器による攻撃は投擲攻撃としても扱えます。" },
    { id: "basic-spellsongs", category: "major", marker: "主", name: "呪歌", tags: "バード 基本呪歌 呪歌 奏力 全エリア", assist: "spellsongs", defaultBody: "" },
    { id: "finale", category: "major", marker: "主", name: "終律", tags: "バード 終律 奏力 回復 ダメージ", defaultBody: "" },
    { id: "gunfire", category: "major", marker: "主", name: "銃撃", tags: "ガン 銃撃 射撃 装填 C値 回避力 消滅", defaultBody: "" },
    { id: "alchemy", category: "major", marker: "主", markers: ["主", "補"], name: "賦術", tags: "アルケミスト 賦術 マテリアルカード", assist: "alchemy", defaultBody: "" },
    { id: "breath", category: "major", marker: "主", name: "ブレス", tags: "息 射程 範囲 属性 生命抵抗 半減", title: ({ base, fixed }) => `ブレス／${base}（${fixed}）／生命抵抗力／半減`, defaultBody: "" },
    { id: "breath-control", category: "passive", marker: "常", name: "ブレス制御", tags: "ブレス 対象 除外 範囲", defaultBody: "ブレスの対象から任意のキャラクターを除外できるようになります。" },
    { id: "ranged", category: "major", marker: "主", name: "遠隔攻撃", tags: "射撃 投擲 回避 消滅", title: ({ base, fixed }) => `遠隔攻撃／${base}（${fixed}）／回避力／消滅`, defaultBody: ({ base }) => `「射程：2（20m）／射撃」で「対象：1体」に「2d+${base}」点の物理ダメージを与えます。` },
    { id: "area", category: "major", marker: "主", name: "範囲攻撃", tags: "範囲 複数 半径 生命 精神", title: ({ base, fixed }) => `範囲攻撃／${base}（${fixed}）／生命抵抗力／半減`, defaultBody: ({ base }) => `「射程：自身」で「対象：1エリア（半径3m）／5」に「2d+${base}」点の炎属性の魔法ダメージを与えます。` },
    { id: "drain", category: "major", marker: "主", name: "吸収攻撃", tags: "HP MP 回復 抵抗", title: ({ base, fixed }) => `吸収攻撃／${base}（${fixed}）／生命抵抗力／消滅`, defaultBody: "近接攻撃が命中した対象のHPを5点減少させ、適用ダメージと同じだけ自身のHPを回復します。" },
    { id: "entangle", category: "major", marker: "主", name: "拘束攻撃", tags: "つる 捕縛 移動 妨害 回避", title: ({ base, fixed }) => `拘束攻撃／${base}（${fixed}）／回避力／消滅`, defaultBody: "「射程：接触」で「対象：1体」を拘束します。拘束された対象は移動できず、命中力・回避力判定に-2のペナルティ修正を受けます。主動作で引きはがし処理を行い、解除できます。" },
    { id: "fear", category: "major", marker: "主", name: "恐怖を与える", tags: "精神効果 範囲 精神抵抗", title: ({ base, fixed }) => `恐怖／${base}（${fixed}）／精神抵抗力／消滅`, defaultBody: "「射程：自身」で「対象：1エリア（半径6m）／20」に恐怖を与えます。抵抗に失敗した対象は10秒（1ラウンド）の間、命中力・回避力判定に-1のペナルティ修正を受けます。" },
    { id: "summon", category: "major", marker: "主", name: "配下召喚", tags: "召喚 増援 仲間 ボス", defaultBody: "自身と同じレベル以下の配下1体を、同じ座標に召喚します。この能力は1回だけ使用できます。" },
    { id: "techniques", category: "minor", marker: "補", markers: [], name: "練技", tags: "キャッツアイ マッスルベアー ガゼルフット ビートルスキン", assist: "techniques", body: "使用する練技を候補から選択します。" },
    { id: "geomancy", category: "minor", marker: "補", name: "相域", tags: "ジオマンサー 相域 命脈点 天相 地相 人相", assist: "geomancy", defaultBody: "" },
    { id: "war-command", category: "minor", marker: "補", name: "鼓咆＆陣率", tags: "ウォーリーダー 鼓咆 陣率 陣気", defaultBody: "" },
    { id: "preparation", category: "preparation", marker: "準", name: "戦闘準備", tags: "準備 補助 開始", defaultBody: "戦闘準備で自身を強化し、10秒（1ラウンド）の間、防護点を+2点します。" },
    { id: "stance", category: "minor", marker: "補", name: "戦闘態勢変更", tags: "形態 モード 変身", defaultBody: "攻撃態勢と防御態勢を切り替えます。攻撃態勢では打撃点を+4点、防御態勢では防護点を+4点します。" },
    { id: "reposition", category: "minor", marker: "補", name: "位置取り", tags: "移動 離脱 射撃 間合い", defaultBody: "通常移動を行います。この移動では乱戦エリアから離脱できます。この能力は1ラウンドに1回だけ使用できます。" },
    { id: "full-power", category: "declaration", marker: "宣", name: "全力攻撃", tags: "全力攻撃1 2 3 打撃点 回避 ペナルティ", defaultBody: "打撃点を増加させます。リスクとして、自身の回避力判定に-2のペナルティ修正を受けます。" },
    { id: "sweep", category: "declaration", marker: "宣", name: "薙ぎ払い", tags: "近接 複数 対象", defaultBody: "近接攻撃可能なキャラクターを任意に3体まで選び、それぞれに近接攻撃を行います。打撃点が-3点されます。" },
    { id: "magic-strike", category: "declaration", marker: "宣", name: "魔力撃", tags: "魔力 打撃点 抵抗 ペナルティ", defaultBody: "打撃点を+魔力点します。リスクとして、自身の生命・精神抵抗力判定に-2のペナルティ修正を受けます。" },
    { id: "feint", category: "declaration", marker: "宣", name: "牽制攻撃", tags: "命中 クリティカル", defaultBody: "命中力判定に+1のボーナス修正を得ます。" },
    { id: "decoy-attack", category: "declaration", marker: "宣", name: "囮攻撃", tags: "命中 打撃点 回避 累積 1 2", defaultBody: "命中力判定に-2のペナルティ修正を受けますが、命中時には打撃点が増加します。回避された場合、相手の回避力判定を低下させます。" },
    { id: "charge", category: "declaration", marker: "宣", name: "突進", tags: "移動 打撃点 直線 近接", defaultBody: "5m以上を直線的に移動した後に近接攻撃を行い、打撃点を+2点します。" },
    { id: "tail-sweep", category: "declaration", marker: "宣", name: "テイルスイング", tags: "尻尾 尾 近接 複数 対象 1 2", defaultBody: "近接攻撃可能なキャラクターを任意に3体まで選び、尻尾で攻撃します。命中力判定に-1のペナルティ修正を受けます。" },
    { id: "critical-blow", category: "reaction", marker: "常", name: "痛恨撃", tags: "打撃点 出目 ダイス", defaultBody: "打撃点決定の2dの出目が10以上だった場合、打撃点をさらに+6点します。" },
    { id: "regeneration", category: "reaction", marker: "常", name: "再生", tags: "手番終了 HP 回復", defaultBody: "手番の終了時にHPを5点回復します。HPが0以下になると、この能力は失われます。" },
    { id: "counter", category: "reaction", marker: "常", name: "カウンター", tags: "回避 反撃 命中", defaultBody: "近接攻撃を受けたとき、1ラウンドに1回だけ命中力判定を行えます。相手の命中力判定より達成値が高ければ攻撃を回避し、相手に近接攻撃を行います。" },
    { id: "death", category: "reaction", marker: "常", name: "撃破時効果", tags: "死亡 自爆 断末魔", defaultBody: "HPが0以下になったとき、同じ乱戦エリア内のすべてのキャラクターに5点の確定ダメージを与えます。" },
    { id: "self-destruct", category: "reaction", marker: "常", name: "自爆", tags: "死亡 爆発 範囲 魔動機", defaultBody: "HPが0以下になったとき、「対象：1エリア（半径3m）／5」に「2d+5」点の炎属性の魔法ダメージを与えます。" },
    { id: "attack-obstruction", category: "passive", marker: "常", name: "攻撃障害", tags: "部位 命中 回避 遠隔 近接", defaultBody: "大きさが攻撃を妨げます。[部位：本体]は近接・遠隔攻撃に対する回避力判定に+4のボーナス修正を得ます。[部位：障害部位]のHPが0以下になった場合、この能力は失われます。" },
    { id: "damage-reduction", category: "passive", marker: "常", name: "ダメージ軽減", tags: "物理 魔法 属性 軽減", defaultBody: "受ける物理ダメージ、魔法ダメージを-3点します。" },
    { id: "normal-weapon-immunity", category: "passive", marker: "常", name: "通常武器無効", tags: "武器 魔法 ダメージ 無効", defaultBody: "通常の武器による攻撃からダメージを受けません。" },
    { id: "conditional-boost", category: "reaction", marker: "常", name: "条件付き強化", tags: "HP 部位 手番 強化 ボーナス", defaultBody: "HPが最大値の半分以下になった場合、命中力判定に+2のボーナス修正を得て、打撃点が+4点されます。" },
  ];

  // 公式データ内で複数の魔物に使われる、再利用性の高い能力だけを候補欄に表示します。
  // 固有能力は候補化せず、自由入力欄から作成できます。
  const reusableAbilityIds = new Set([
    "flight", "wing-flight", "targeting", "targeting-hawk-eye", "multi-attack",
    "continuous-attack", "two-actions", "limited-two-actions", "multiple-declarations", "bow", "gun", "throwing-attack", "delicate-loot", "poison-immunity",
    "mental-immunity", "posture-control", "undying-body", "artificial-body", "bone-body", "tough-skin", "underwater-specialization", "magic-adaptation", "immunity",
    "mechanical-body", "guard", "guardian", "rooted", "magic", "psychokinetic-throw", "basic-spellsongs", "finale", "gunfire", "alchemy", "breath", "breath-control", "ranged", "area", "drain", "entangle",
    "techniques", "geomancy", "war-command", "full-power", "sweep", "tail-sweep", "magic-strike", "feint", "decoy-attack",
    "charge", "critical-blow", "regeneration", "counter", "attack-obstruction", "normal-weapon-immunity",
  ]);

  function signedAbilityValue(value) {
    const text = String(value ?? "").trim();
    if (!text || text === "なし" || text === "不可") return text;
    return /^[+-]/.test(text) ? text : `+${text}`;
  }

  function attackObstructionSentence(kind, value, protectedPart) {
    const effect = String(value ?? "").trim();
    if (!effect || effect === "なし") return "";
    if (effect === "不可") return `[部位：${protectedPart}]は${kind}攻撃の対象になりません。`;
    return `[部位：${protectedPart}]は${kind}攻撃に対する回避力判定に${signedAbilityValue(effect)}のボーナス修正を得ます。`;
  }

  const abilityParameterDefinitions = {
    "multi-attack": {
      fields: [{ key: "mode", label: "攻撃方法", value: "2回攻撃＆双撃", options: ["2回攻撃", "2回攻撃＆双撃"] }],
      title: ({ mode }) => mode,
      body: ({ mode }) => mode === "2回攻撃＆双撃"
        ? "1回の主動作で近接攻撃を2回行います。1回目の攻撃結果を確認してから、2回目を同じ対象に行うか、別の対象を選んで行うかを選べます。"
        : "1回の主動作で同じ対象に近接攻撃を2回行います。",
    },
    "continuous-attack": {
      fields: [{ key: "rank", label: "ランク", value: "Ⅰ", options: ["Ⅰ", "Ⅱ"], inline: true }],
      title: ({ rank }) => `連続攻撃${rank}`,
      body: ({ rank }) => rank === "Ⅱ"
        ? "攻撃が命中した場合、同じ対象にもう1回攻撃できます。この効果は3回目の攻撃が命中しても発生しません。"
        : "攻撃が命中した場合、同じ対象にもう1回攻撃できます。2回目の攻撃が命中しても、この効果はありません。",
    },
    flight: {
      fields: [{ key: "rank", label: "ランク", value: "Ⅰ", options: ["Ⅰ", "Ⅱ"], inline: true }],
      title: ({ rank }) => rank === "Ⅱ" ? "飛行Ⅱ" : "飛行",
      body: ({ rank }) => `近接攻撃の命中力・回避力判定に+${rank === "Ⅱ" ? 2 : 1}のボーナス修正を得ます。`,
    },
    "wing-flight": {
      fields: [
        { key: "rank", label: "ランク", value: "Ⅰ", options: ["Ⅰ", "Ⅱ"], inline: true },
        { key: "target", label: "効果を受ける部位", value: "すべての部位", list: "enemy-builder-core-parts-list" },
        { key: "part", label: "依存部位", value: "翼", list: "enemy-builder-core-parts-list" },
        { key: "lossCondition", label: "失う条件", value: "いずれかのHPが0以下", options: ["HPが0以下", "いずれかのHPが0以下", "すべてのHPが0以下"] },
      ],
      title: ({ rank }) => rank === "Ⅱ" ? "飛翔Ⅱ" : "飛翔",
      body: ({ rank, target, part, lossCondition }) => `${abilityPartSubject(target)}は、近接攻撃における命中力・回避力判定に+${rank === "Ⅱ" ? 2 : 1}のボーナス修正を得ます。${dependencyLossSentence(part, lossCondition)}`,
    },
    // 旧候補IDの互換用。新規選択では「飛翔」のランクからⅡを選ぶ。
    "wing-flight-ii": {
      fields: [
        { key: "rank", label: "ランク", value: "Ⅱ", options: ["Ⅰ", "Ⅱ"], inline: true },
        { key: "target", label: "効果を受ける部位", value: "すべての部位", list: "enemy-builder-core-parts-list" },
        { key: "part", label: "依存部位", value: "翼", list: "enemy-builder-core-parts-list" },
        { key: "lossCondition", label: "失う条件", value: "いずれかのHPが0以下", options: ["HPが0以下", "いずれかのHPが0以下", "すべてのHPが0以下"] },
      ],
      title: () => "飛翔Ⅱ",
      body: ({ target, part, lossCondition }) => `${abilityPartSubject(target)}は、近接攻撃における命中力・回避力判定に+2のボーナス修正を得ます。${dependencyLossSentence(part, lossCondition)}`,
    },
    "two-actions": {
      fields: [{ key: "count", label: "主動作回数", type: "number", value: 2 }],
      body: ({ count }) => `1ラウンドに主動作を${count}回行えます。`,
    },
    "limited-two-actions": {
      fields: [
        { key: "mode", label: "制限形式", value: "異なる2つを選択", options: ["異なる2つを選択", "1つずつ固定"] },
        { key: "actions", label: "行動候補", value: "近接攻撃／特殊能力" },
      ],
      body: ({ mode, actions }) => mode === "1つずつ固定"
        ? `1ラウンドに主動作を2回行えます。ただし、「${actions}」をそれぞれ1回ずつ行わなければなりません。`
        : `1ラウンドに主動作を2回行えます。ただし、「${actions}」から異なるものを2つ選んで行わなければなりません。`,
    },
    "tough-skin": {
      fields: [{ key: "amount", label: "軽減点", type: "number", value: 3 }],
      body: ({ amount }) => `断空属性または衝撃属性の物理ダメージ、魔法ダメージを受けるとき、それを「-${amount}」点します。`,
    },
    "multiple-declarations": {
      fields: [{ key: "count", label: "宣言回数", type: "number", value: 2 }],
      title: ({ count }) => `複数宣言＝${count}回`,
      body: ({ count }) => `1ラウンドに${count}回まで宣言特技を宣言できます。`,
    },
    bow: {
      fields: [{ key: "range", label: "射程（m）", type: "number", value: 30 }],
      body: ({ range }) => `弓による攻撃は「射程：2（${range}m）」の射撃攻撃として扱います。`,
    },
    gun: {
      fields: [
        { key: "weaponName", label: "武器名", value: "ガン" },
        { key: "rangeBand", label: "射程ランク", type: "number", value: 2 },
        { key: "range", label: "射程（m）", type: "number", value: 20 },
        { key: "magazine", label: "最大装填数", type: "number", value: 3 },
      ],
      title: () => "ガン",
      body: ({ weaponName, rangeBand, range, magazine }) => `${weaponName || "この武器"}は〈ガン〉として扱い、「射程：${rangeBand}（${range}m）」、最大装填数${magazine}です。`,
    },
    guard: {
      fields: [{ key: "rank", label: "ランク", value: "Ⅰ", options: ["Ⅰ", "Ⅱ"], inline: true }],
      title: ({ rank }) => `かばう${rank}`,
      body: ({ rank }) => rank === "Ⅱ"
        ? "同じ乱戦エリア内の味方1体が近接攻撃または遠隔攻撃の対象になったとき、1ラウンドに1回まで代わりに攻撃を受けます。この能力は宣言特技として扱わず、戦闘準備でも使用できます。"
        : "同じ乱戦エリア内の味方1体が近接攻撃または遠隔攻撃の対象になったとき、1ラウンドに1回まで代わりに攻撃を受けます。攻撃は自動的に命中します。この能力は戦闘準備でも宣言できます。",
    },
    guardian: {
      fields: [{ key: "rank", label: "ランク", value: "Ⅰ", options: ["Ⅰ", "Ⅱ"], inline: true }],
      title: ({ rank }) => `ガーディアン${rank}`,
      body: ({ rank }) => rank === "Ⅱ"
        ? "1ラウンド中、任意のキャラクターを合計5回までかばえます。使用する回数は、かばうを宣言するときに決定します。"
        : "1ラウンド中、任意のキャラクターを合計3回までかばえます。使用する回数は、かばうを宣言するときに決定します。",
    },
    immunity: {
      fields: [
        { key: "attributes", label: "対象属性・状態", value: "毒、病気、精神効果", list: "enemy-builder-resistance-list" },
        { key: "treatment", label: "処理", value: "無効", options: ["無効", "半減", "軽減"] },
        { key: "amount", label: "軽減点", type: "number", value: 3, visibleWhen: { key: "treatment", value: "軽減" } },
      ],
      title: ({ attributes, treatment, amount }) => `${attributes}${treatment === "軽減" ? `軽減=${amount}点` : treatment}`,
      body: ({ attributes, treatment, amount }) => {
        if (treatment === "半減") return `${attributes}属性から受けるダメージを半減します。`;
        if (treatment === "軽減") return `${attributes}属性から受けるダメージを${amount}点軽減します。`;
        return `${attributes}属性の効果を受けません。`;
      },
    },
    "abyss-magic": {
      fields: [
        { key: "skillLevel", label: "アビスゲイザーLv", type: "number", context: "level" },
        { key: "magicPower", label: "魔力", type: "number", context: "magic" },
        { key: "extensionRounds", label: "拡張効果", type: "number", value: 1 },
      ],
      title: ({ skillLevel, magicPower }) => `奈落魔法${skillLevel}レベル／魔力${magicPower}（${fixedValue(magicPower)}）`,
      body: ({ extensionRounds }) => `拡張効果は${Math.max(1, toNumber(extensionRounds, 1))}ラウンド目まで使用します。`,
    },
    "throwing-attack": {
      fields: [
        { key: "rangeBand", label: "射程ランク", type: "number", value: 1 },
        { key: "range", label: "射程（m）", type: "number", value: 10 },
      ],
      title: () => "投擲攻撃",
      body: ({ rangeBand, range }) => `武器による攻撃は「射程：${rangeBand}（${range}m）／射撃」の投擲攻撃としても扱えます。`,
    },
    "psychokinetic-throw": {
      fields: [
        { key: "rangeBand", label: "射程ランク", type: "number", value: 2 },
        { key: "range", label: "射程（m）", type: "number", value: 20 },
        { key: "hpCost", label: "HP消費", value: "1d" },
      ],
      title: () => "理力投擲",
      body: ({ rangeBand, range, hpCost }) => `武器による攻撃は「射程：${rangeBand}（${range}m）／射撃」の投擲攻撃用として扱います。また、投擲攻撃を行う際は、命中力判定を行う前にHPを「${hpCost || "1d"}」点消費します。`,
    },
    "basic-spellsongs": {
      fields: [
        { key: "level", label: "呪歌レベル", value: ({ level }) => level >= 10 ? "10" : level >= 5 ? "5" : "1", options: ["1", "5", "10", "16"] },
        { key: "power", label: "奏力", type: "number", value: ({ level }) => level + 3 },
        { key: "radius", label: "半径（m）", type: "number", value: 50 },
      ],
      title: ({ level, power, radius }) => `基本呪歌${level}レベル／${power}（${fixedValue(power)}）／全エリア（半径${radius}m）`,
      body: () => "",
    },
    finale: {
      fields: [
        { key: "finaleName", label: "終律名", value: "獣の咆吼", list: "enemy-builder-finale-list", inline: true },
        { key: "standard", label: "基準値", type: "number", context: "base", hiddenInParams: true },
        { key: "range", label: "射程（m）", type: "number", value: 50 },
        { key: "targets", label: "対象数", type: "number", value: 3 },
        { key: "effectKind", label: "効果", value: "魔法ダメージ", options: ["魔法ダメージ", "HP回復", "MP回復"] },
        { key: "amount", label: "効果量", value: ({ level }) => `2d+${level}` },
        { key: "attribute", label: "属性", value: "衝撃", list: "enemy-builder-attribute-list", visibleWhen: { key: "effectKind", value: "魔法ダメージ" } },
        { key: "resistance", label: "抵抗", value: "精神抵抗力／半減", options: ["精神抵抗力／半減", "なし"] },
      ],
      title: ({ finaleName, standard, resistance }) => `【終律：${finaleName || "名称未設定"}】／${standard}（${fixedValue(standard)}）${resistance === "なし" ? "" : `／${resistance}`}`,
      body: ({ finaleName, range, targets, effectKind, amount, attribute }) => {
        const targetText = toNumber(targets, 1) <= 1 ? "1体" : `${targets}体まで`;
        const prefix = `「射程：2（${range}m）」で【終律：${finaleName || "名称未設定"}】を使用し、${targetText}の対象`;
        if (effectKind === "HP回復") return `${prefix}のHPを「${amount}」点回復します。`;
        if (effectKind === "MP回復") return `${prefix}のMPを「${amount}」点回復します。`;
        return `${prefix}に「${amount}」点の${attribute || "無"}属性の魔法ダメージを与えます。`;
      },
    },
    gunfire: {
      fields: [
        { key: "standard", label: "命中基準値", type: "number", context: "base", hiddenInParams: true },
        { key: "usage", label: "用法", value: "2H" },
        { key: "magazine", label: "最大装填数", type: "number", value: 3 },
        { key: "accuracy", label: "命中補正", value: "－" },
        { key: "critical", label: "C値", type: "number", value: 10 },
        { key: "bonusDamage", label: "追加D", value: "+4" },
        { key: "rangeBand", label: "射程ランク", type: "number", value: 2 },
        { key: "range", label: "射程（m）", type: "number", value: 20 },
      ],
      title: ({ standard }) => `銃撃／${standard}（${fixedValue(standard)}）／回避力／消滅`,
      body: ({ usage, magazine, accuracy, critical, bonusDamage, rangeBand, range }) => `以下のデータの〈ガン〉で射撃攻撃を行います（用法：${usage || "－"}／最大装填数：${magazine}／命中：${accuracy || "－"}／C値：${critical}／追加D：${bonusDamage || "－"}／射程：${rangeBand}（${range}m））。`,
    },
    alchemy: {
      fields: [
        { key: "standard", label: "賦術基準値", type: "number", context: "base" },
        { key: "rank", label: "使用ランク", value: "A", options: ["B", "A", "S", "SS"], inline: true },
      ],
      title: ({ standard }) => `賦術／${standard}（${fixedValue(standard)}）`,
      body: () => "",
    },
    techniques: {
      fields: [
        { key: "recovery", label: "リカバリィ回復点", type: "number", value: 5, visibleWhenAssist: "リカバリィ" },
      ],
      body: () => "",
    },
    geomancy: {
      fields: [
        { key: "radius", label: "半径（m）", type: "number", value: 20 },
        { key: "pulse", label: "命脈点", type: "number", value: 2 },
      ],
      title: ({ radius }) => `相域／全エリア（半径${radius}m）`,
      body: () => "",
    },
    "war-command": {
      fields: [
        { key: "radius", label: "半径（m）", type: "number", value: 20 },
        { key: "warCryName", label: "鼓咆", value: "怒涛の攻陣Ⅱ：旋風", list: "enemy-builder-warcry-list" },
        { key: "formationName", label: "陣率", value: "陣率：慮外なる烈撃Ⅰ", list: "enemy-builder-formation-list" },
        { key: "interval", label: "陣率の間隔（手番）", type: "number", value: 3 },
      ],
      title: ({ radius }) => `鼓咆＆陣率／全エリア（半径${radius}m）`,
      body: ({ warCryName, formationName, interval }) => {
        const lines = [];
        if (warCryName) lines.push(`鼓咆【${warCryName}】を使用します。`);
        if (formationName) lines.push(`${interval}手番ごとに【${formationName}】を使用します。`);
        lines.push("自身の鼓咆の効果を受けるキャラクターがいなくなると、使用できなくなります。");
        return lines.join("\n");
      },
    },
    breath: {
      fields: [
        { key: "standard", label: "基準値", type: "number", context: "base", hiddenInParams: true },
        { key: "target", label: "対象", value: "1体", list: "enemy-builder-ability-target-list" },
        { key: "rangeShape", label: "射程／形状", value: "2(20m)/射撃", list: "enemy-builder-ability-range-shape-list" },
        { key: "damage", label: "威力", value: "2d+8" },
        { key: "breathName", label: "ブレス名", value: "火炎", list: "enemy-builder-breath-name-list" },
        { key: "attribute", label: "ダメージ属性", value: "炎", list: "enemy-builder-attribute-list" },
      ],
      title: ({ breathName, standard }) => `${breathName}のブレス／${standard}（${fixedValue(standard)}）／生命抵抗力／半減`,
      body: ({ rangeShape, target, damage, breathName, attribute }) => `「射程/形状：${rangeShape}」で「対象：${target}」に${breathName}を放ち、「${damage}」点の${attribute}属性の魔法ダメージを与えます。`,
    },
    ranged: {
      fields: [
        { key: "standard", label: "基準値", type: "number", context: "base", hiddenInParams: true },
        { key: "target", label: "対象", value: "1体", list: "enemy-builder-ability-target-list" },
        { key: "rangeShape", label: "射程／形状", value: "2(20m)/射撃", list: "enemy-builder-ability-range-shape-list" },
        { key: "damage", label: "威力", value: "2d+8" },
      ],
      title: ({ standard }) => `遠隔攻撃／${standard}（${fixedValue(standard)}）／回避力／消滅`,
      body: ({ rangeShape, target, damage }) => `「射程/形状：${rangeShape}」で「対象：${target}」に「${damage}」点の物理ダメージを与えます。`,
    },
    area: {
      fields: [
        { key: "standard", label: "基準値", type: "number", context: "base", hiddenInParams: true },
        { key: "target", label: "対象", value: "1エリア(半径3m)/5", list: "enemy-builder-ability-target-list" },
        { key: "rangeShape", label: "射程／形状", value: "術者/-", list: "enemy-builder-ability-range-shape-list" },
        { key: "damage", label: "威力", value: "2d+8" },
        { key: "attribute", label: "属性", value: "炎" },
      ],
      title: ({ standard }) => `範囲攻撃／${standard}（${fixedValue(standard)}）／生命抵抗力／半減`,
      body: ({ target, rangeShape, damage, attribute }) => `「射程/形状：${rangeShape}」で「対象：${target}」に「${damage}」点の${attribute}属性の魔法ダメージを与えます。`,
    },
    drain: {
      fields: [{ key: "loss", label: "HP減少", type: "number", value: 5 }],
      body: ({ loss }) => `近接攻撃が命中した対象のHPを${loss}点減少させ、適用ダメージと同じだけ自身のHPを回復します。`,
    },
    entangle: {
      fields: [
        { key: "target", label: "対象", value: "1体", list: "enemy-builder-ability-target-list" },
        { key: "rangeShape", label: "射程／形状", value: "接触/-", list: "enemy-builder-ability-range-shape-list" },
        { key: "penalty", label: "命中・回避修正", type: "number", value: -2 },
      ],
      body: ({ target, rangeShape, penalty }) => `「射程/形状：${rangeShape}」で「対象：${target}」を拘束します。拘束された対象は移動できず、命中力・回避力判定に${penalty}のペナルティ修正を受けます。主動作で引きはがし処理を行い、解除できます。`,
    },
    fear: {
      fields: [
        { key: "target", label: "対象", value: "1エリア(半径6m)/20", list: "enemy-builder-ability-target-list" },
        { key: "rangeShape", label: "射程／形状", value: "術者/-", list: "enemy-builder-ability-range-shape-list" },
        { key: "penalty", label: "命中・回避修正", type: "number", value: -1 },
      ],
      body: ({ target, rangeShape, penalty }) => `「射程/形状：${rangeShape}」で「対象：${target}」に恐怖を与えます。抵抗に失敗した対象は10秒（1ラウンド）の間、命中力・回避力判定に${penalty}のペナルティ修正を受けます。`,
    },
    "self-destruct": {
      fields: [
        { key: "target", label: "対象", value: "1エリア(半径3m)/5", list: "enemy-builder-ability-target-list" },
        { key: "rangeShape", label: "射程／形状", value: "術者/-", list: "enemy-builder-ability-range-shape-list" },
        { key: "damage", label: "威力", value: "2d+5" },
        { key: "attribute", label: "属性", value: "炎", list: "enemy-builder-attribute-list" },
      ],
      body: ({ target, rangeShape, damage, attribute }) => `HPが0以下になったとき、「射程/形状：${rangeShape}」で「対象：${target}」に「${damage}」点の${attribute}属性の魔法ダメージを与えます。`,
    },
    "full-power": {
      fields: [{ key: "rank", label: "ランク", value: ({ level }) => level >= 13 ? "Ⅲ" : level >= 9 ? "Ⅱ" : "Ⅰ", options: ["Ⅰ", "Ⅱ", "Ⅲ"], inline: true }],
      title: ({ rank }) => `全力攻撃${rank}`,
      body: ({ rank }) => rank === "Ⅲ"
        ? "打撃点を+12点します。攻撃に用いる武器が2Hなら、打撃点を+20点します。リスクとして、自身の回避力判定に-2のペナルティ修正を受けます。"
        : rank === "Ⅱ"
          ? "打撃点を+12点します。リスクとして、自身の回避力判定に-2のペナルティ修正を受けます。"
          : "打撃点を+4点します。リスクとして、自身の回避力判定に-2のペナルティ修正を受けます。",
    },
    sweep: {
      fields: [{ key: "rank", label: "ランク", value: "Ⅰ", options: ["Ⅰ", "Ⅱ"], inline: true }],
      title: ({ rank }) => `薙ぎ払い${rank}`,
      body: ({ rank }) => rank === "Ⅱ"
        ? "近接攻撃可能なキャラクターを任意に5体まで選び、それぞれに近接攻撃を行います。"
        : "近接攻撃可能なキャラクターを任意に3体まで選び、それぞれに近接攻撃を行います。打撃点が-3点されます。",
    },
    "magic-strike": {
      fields: [{ key: "magicPower", label: "魔力", type: "number", value: 8 }],
      body: ({ magicPower }) => `打撃点を+${magicPower}点します。リスクとして、自身の生命・精神抵抗力判定に-2のペナルティ修正を受けます。`,
    },
    feint: {
      fields: [{ key: "rank", label: "ランク", value: "Ⅰ", options: ["Ⅰ", "Ⅱ", "Ⅲ"], inline: true }],
      title: ({ rank }) => `牽制攻撃${rank}`,
      body: ({ rank }) => rank === "Ⅲ"
        ? "命中力判定に+3のボーナス修正を得ます。"
        : rank === "Ⅱ"
          ? "命中力判定に+2のボーナス修正を得ます。"
          : "命中力判定に+1のボーナス修正を得ます。リスクとして、クリティカル値が+1されます。",
    },
    "decoy-attack": {
      fields: [{ key: "rank", label: "ランク", value: "Ⅰ", options: ["Ⅰ", "Ⅱ"], inline: true }],
      title: ({ rank }) => `囮攻撃${rank}`,
      body: ({ rank }) => rank === "Ⅱ"
        ? "命中力判定に-2のペナルティ修正を受けますが、命中時には打撃点が+8点されます。宣言した攻撃が回避された場合、その敵は以降10秒（1ラウンド）の間、回避力判定に-2のペナルティ修正を受けます。この効果は-8まで累積しますが、対象が1回でも回避力判定に失敗すると、その時点ですべて消滅します。"
        : "命中力判定に-2のペナルティ修正を受けますが、命中時には打撃点が+2点されます。宣言した攻撃が回避された場合、その敵は以降10秒（1ラウンド）の間、回避力判定に-1のペナルティ修正を受けます。この効果は-4まで累積しますが、対象が1回でも回避力判定に失敗すると、その時点ですべて消滅します。",
    },
    charge: {
      fields: [{ key: "distance", label: "必要移動（m）", type: "number", value: 5 }, { key: "damage", label: "打撃点修正", type: "number", value: 2 }],
      body: ({ distance, damage }) => `${distance}m以上を直線的に移動した後に近接攻撃を行い、打撃点を+${damage}点します。`,
    },
    "tail-sweep": {
      fields: [{ key: "rank", label: "ランク", value: "Ⅰ", options: ["Ⅰ", "Ⅱ"], inline: true }],
      title: ({ rank }) => `テイルスイング${rank}`,
      body: ({ rank }) => rank === "Ⅱ"
        ? "近接攻撃可能なキャラクターを任意に5体まで選び、尻尾で近接攻撃を行います。"
        : "近接攻撃可能なキャラクターを任意に3体まで選び、尻尾で近接攻撃を行います。命中力判定に-1のペナルティ修正を受けます。",
    },
    "critical-blow": {
      fields: [{ key: "roll", label: "出目", type: "number", value: 10 }, { key: "damage", label: "追加打撃点", type: "number", value: 6 }],
      body: ({ roll, damage }) => `打撃点決定の2dの出目が${roll}以上だった場合、打撃点をさらに+${damage}点します。`,
    },
    regeneration: {
      fields: [
        { key: "hp", label: "回復量", type: "number", value: 5 },
        { key: "downed", label: "HP0以下", value: "0以下の部位には適用しない", options: ["0以下の部位には適用しない", "0以下で能力を失う"] },
      ],
      title: ({ hp }) => `再生=${hp}点`,
      body: ({ hp, downed }) => `手番の終了時にHPを${hp}点回復します。${downed === "0以下で能力を失う" ? "HPが0以下になると、この能力は失われます。" : "HPが0以下の部位には適用されません。"}`,
    },
    counter: {
      fields: [{ key: "uses", label: "1Rの回数", type: "number", value: 1 }],
      body: ({ uses }) => `近接攻撃を受けたとき、1ラウンドに${uses}回だけ命中力判定を行えます。相手の命中力判定より達成値が高ければ攻撃を回避し、相手に近接攻撃を行います。`,
    },
    "attack-obstruction": {
      fields: [
        { key: "melee", label: "近接", value: "+4", list: "enemy-builder-attack-obstruction-list" },
        { key: "ranged", label: "遠隔", value: "+4", list: "enemy-builder-attack-obstruction-list" },
        { key: "main", label: "守られる部位", value: "本体", list: "enemy-builder-core-parts-list" },
        { key: "blocker", label: "障害部位", value: "胴体", list: "enemy-builder-core-parts-list" },
      ],
      title: ({ melee, ranged }) => `攻撃障害=${melee}・${ranged}`,
      body: ({ melee, ranged, main, blocker }) => [`大きさが攻撃を妨げます。`, attackObstructionSentence("近接", melee, main), attackObstructionSentence("遠隔", ranged, main), `[部位：${blocker}]のHPが0以下になった場合、この能力は失われます。`].filter(Boolean).join(""),
    },
  };

  const breathNamesByAttribute = {
    "土": ["大地", "砂塵"],
    "水・氷": ["氷雪", "冷気", "吹雪"],
    "炎": ["火炎", "炎"],
    "風": ["疾風", "烈風"],
    "雷": ["雷電", "雷光", "電撃"],
    "純エネルギー": ["燐光", "燦光", "光"],
    "毒": ["毒煙", "毒", "毒ガス", "瘴気"],
    "病気": ["瘴気", "病魔"],
    "精神効果": ["眠り", "精神"],
    "呪い": ["呪詛", "呪い"],
    "衝撃": ["衝撃"],
    "断空": ["断空"],
  };

  const abilityAssistOptions = {
    techniques: [
      "キャッツアイ", "ガゼルフット", "マッスルベアー", "ビートルスキン", "メディテーション",
      "アンチボディ", "ストロングブラッド", "リカバリィ（5点回復）", "デーモンフィンガー", "ジャイアントアーム",
      "ケンタウロスレッグ", "スフィンクスノレッジ", "トロールバイタル", "フェンリルバイト",
      "ジャイプロフェシー",
    ].map((value) => ({ value, markers: ["補", "準"] })),
    "combat-feats": [
      { value: "マルチアクション", markers: ["宣"] },
      { value: "ターゲッティング", markers: ["常"] },
      { value: "鷹の目", markers: ["常"] },
      { value: "魔法収束", markers: ["常"] },
      { value: "魔法制御", markers: ["常"] },
      { value: "魔法拡大／数", markers: ["宣"] },
      { value: "魔法拡大／すべて", markers: ["宣"] },
      { value: "ワードブレイク", markers: ["主"] },
      { value: "狙撃", markers: ["主"] },
      { value: "ダブルキャスト", markers: ["宣"] },
      { value: "バイオレントキャスト", markers: ["宣"] },
      { value: "バイオレントキャストⅠ", markers: ["宣"] },
      { value: "クリティカルキャストⅠ", markers: ["宣"] },
      { value: "ルーンマスター", markers: ["常"] },
      { value: "MP軽減／魔法", markers: ["常"] },
      { value: "全力攻撃Ⅰ", markers: ["宣"] },
      { value: "全力攻撃Ⅱ", markers: ["宣"] },
      { value: "全力攻撃Ⅲ", markers: ["宣"] },
      { value: "薙ぎ払いⅠ", markers: ["宣"] },
      { value: "薙ぎ払いⅡ", markers: ["宣"] },
      { value: "斬り返しⅠ", markers: ["宣"] },
      { value: "斬り返しⅡ", markers: ["宣"] },
      { value: "必殺攻撃Ⅰ", markers: ["宣"] },
      { value: "必殺攻撃Ⅱ", markers: ["宣"] },
      { value: "挑発攻撃Ⅰ", markers: ["宣"] },
      { value: "乱撃Ⅰ", markers: ["宣"] },
      { value: "牽制攻撃Ⅲ", markers: ["宣"] },
      { value: "魔力撃", markers: ["宣"] },
    ],
    magic: ["真語魔法", "操霊魔法", "深智魔法", "神聖魔法", "妖精魔法", "魔動機術", "森羅魔法", "召異魔法", "秘奥魔法", "奈落魔法"],
  };

  let abilityCounter = 0;
  const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const fixedValue = (base) => toNumber(base) + 7;

  function bardArts(kind) {
    const arts = window.sw25_data?.BardArts?.[kind];
    return Array.isArray(arts) ? arts : [];
  }

  function monsterArts(kind) {
    const arts = window.sw25_data?.MonsterArts?.[kind];
    return Array.isArray(arts) ? arts : [];
  }

  function actionMarkers(value) {
    const source = String(value || "");
    return [
      source.includes("○") ? "常" : "",
      source.includes("△") ? "準" : "",
      source.includes("▶") ? "主" : "",
      source.includes("⏩") ? "補" : "",
    ].filter(Boolean);
  }

  function artAssistOptions(kind) {
    const rows = monsterArts(kind);
    return rows.map((item) => ({
      value: item.name,
      label: item.level ? `Lv${item.level}　${item.name}` : item.name,
      markers: Array.isArray(item.markers) && item.markers.length ? item.markers : actionMarkers(item.action),
    }));
  }

  function getAbilityAssistOptions(kind) {
    const dataBacked = { techniques: "techniques", spellsongs: "spellsongs", alchemy: "alchemy", geomancy: "geomancy" };
    const key = dataBacked[kind];
    const fromData = key ? artAssistOptions(key) : [];
    return fromData.length ? fromData : (abilityAssistOptions[kind] || []);
  }

  function normalizeBardArtName(value) {
    return String(value || "").normalize("NFKC").replace(/^【?終律[:：]/, "").replace(/】$/, "").replace("獣の咆哮", "獣の咆吼").trim();
  }

  function finaleData(name) {
    const key = normalizeBardArtName(name);
    return bardArts("finales").find((item) => normalizeBardArtName(item?.name) === key) || null;
  }

  function ensureMonsterArtDatalists() {
    const ensureList = (id, rows) => {
      let list = document.getElementById(id);
      if (!list) {
        list = document.createElement("datalist");
        list.id = id;
        panel.appendChild(list);
      }
      list.innerHTML = rows.map((item) => `<option value="${escapeHtml(item.name)}"></option>`).join("");
    };
    ensureList("enemy-builder-finale-list", bardArts("finales"));
    ensureList("enemy-builder-warcry-list", monsterArts("warCries"));
    ensureList("enemy-builder-formation-list", monsterArts("formations"));
  }

  const normalizeRaceName = (value) => String(value || "").normalize("NFKC").replace(/[\s　]+/g, "").replace(/\(/g, "（").replace(/\)/g, "）").trim();

  function humanRaceNames() {
    const rows = Array.isArray(window.sw25_data?.Races?.人族) ? window.sw25_data.Races.人族 : [];
    const featureRows = Array.isArray(window.sw25_data?.RaceFeatures) ? window.sw25_data.RaceFeatures.filter((row) => !row?.isBarbarous) : [];
    const names = [...rows.map((row) => row?.name), ...featureRows.map((row) => row?.name)].filter(Boolean);
    return [...new Set(names)];
  }

  function populateRaceOptions() {
    if (!fields.race) return;
    const current = fields.race.value;
    const names = humanRaceNames();
    fields.race.innerHTML = names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
    if (current && names.includes(current)) fields.race.value = current;
    else if (names.includes("人間")) fields.race.value = "人間";
    else fields.race.value = names[0] || "";
  }

  function selectedRaceData() {
    const selected = fields.race?.value || "";
    if (!selected) return null;
    const key = normalizeRaceName(selected);
    const indexed = window.sw25_data?.RaceFeatureIndex?.[key];
    if (Array.isArray(indexed) && indexed.length) {
      return indexed.find((row) => normalizeRaceName(row?.name) === key) || indexed[0];
    }
    const featureRows = Array.isArray(window.sw25_data?.RaceFeatures) ? window.sw25_data.RaceFeatures : [];
    const exact = featureRows.find((row) => normalizeRaceName(row?.name) === key);
    if (exact) return exact;
    const raceRows = Array.isArray(window.sw25_data?.Races?.人族) ? window.sw25_data.Races.人族 : [];
    return raceRows.find((row) => normalizeRaceName(row?.name) === key) || null;
  }

  const monsterRaceFeatureRules = [
    { test: (name) => name === "人間", names: ["剣の加護／運命変転"] },
    { test: (name) => name === "エルフ", names: ["剣の加護／優しき水"] },
    { test: (name) => name === "ドワーフ", names: ["剣の加護／炎身"] },
    { test: (name) => name === "タビット", names: [] },
    { test: (name) => name === "ルーンフォーク" || name.startsWith("ルーンフォーク（"), names: ["HP変換"] },
    { test: (name) => name.startsWith("ナイトメア（"), names: ["弱点", "異貌"] },
    { test: (name) => name === "リカント" || name.startsWith("リカント（"), names: ["獣変貌"] },
    { test: (name) => name === "リルドラケン" || name.startsWith("リルドラケン（"), names: ["剣の加護／風の翼"] },
    { test: (name) => name === "グラスランナー" || name.startsWith("グラスランナー（"), names: ["マナ不干渉"] },
    { test: (name) => name === "メリア", names: [] },
    { test: (name) => name === "ティエンス" || name.startsWith("ティエンス（"), names: ["通じ合う意識"] },
    { test: (name) => name === "レプラカーン" || name.startsWith("レプラカーン（"), names: ["姿なき職人"] },
  ];

  function monsterRaceFeatureNames(raceName) {
    const rule = monsterRaceFeatureRules.find((item) => item.test(raceName));
    return rule ? rule.names : null;
  }

  function raceFeatureMarkers(name, feature, level) {
    const monsterMarkers = {
      "剣の加護／運命変転": ["常"], "剣の加護／優しき水": ["常"], "剣の加護／炎身": ["常"],
      "弱点": ["常"], "異貌": ["常"], "マナ不干渉": ["常"],
      "剣の加護／風の翼": ["補"], "通じ合う意識": ["補", "準"], "姿なき職人": ["主"],
    }[name];
    if (monsterMarkers) return monsterMarkers;
    if (name === "HP変換") return level >= 6 ? ["主", "補", "準"] : ["主"];
    if (name === "獣変貌") return level >= 6 ? ["主", "補", "準"] : ["主"];
    const text = String(feature?.text || "");
    const markers = [];
    if (/[⏩≫]/u.test(text)) markers.push("補");
    if (/△/u.test(text)) markers.push("準");
    if (/[▶＞]/u.test(text)) markers.push("主");
    return markers.length ? [...new Set(markers)] : ["常"];
  }

  function raceFeatureBody(text) {
    const source = String(text || "").trim();
    if (!source) return "";
    return source.replace(/^［[^］]+］\s*[：:]\s*/, "").trim();
  }

  function raceFeatureTemplates() {
    const race = selectedRaceData();
    if (!race) return [];
    const level = Math.max(1, Math.min(30, toNumber(fields.level.value, 1)));
    if (Array.isArray(race.features) && race.features.length) {
      const available = race.features.filter((feature) => toNumber(feature?.level, 1) <= level);
      const monsterNames = monsterRaceFeatureNames(race.name);
      const orderedNames = monsterNames === null
        ? [...new Set([...(Array.isArray(race.featureNames) ? race.featureNames : []), ...available.map((feature) => feature?.name)].filter(Boolean))]
        : monsterNames;
      return orderedNames.map((name) => {
        const versions = available.filter((feature) => feature?.name === name).sort((a, b) => toNumber(b?.level) - toNumber(a?.level));
        const feature = versions[0];
        if (!feature) return null;
        const markers = raceFeatureMarkers(name, feature, level);
        return {
          id: `race-feature-${normalizeRaceName(race.name)}-${normalizeRaceName(name)}`,
          category: markers.includes("主") ? "major" : markers.includes("補") ? "minor" : markers.includes("準") ? "preparation" : "passive",
          marker: markers[0], markers, name, tags: `人族 種族特徴 ${race.name}`,
          defaultBody: raceFeatureBody(feature.text),
        };
      }).filter(Boolean);
    }
    const abilityText = String(race.ability || "");
    const names = [...abilityText.matchAll(/［([^］]+)］|\[([^\]]+)\]/g)].map((match) => (match[1] || match[2] || "").trim()).filter(Boolean);
    return [...new Set(names)].map((name) => ({
      id: `race-feature-${normalizeRaceName(race.name || fields.race.value)}-${normalizeRaceName(name)}`,
      category: "passive", marker: "常", name, tags: `人族 種族特徴 ${race.name || fields.race.value}`, defaultBody: "",
    }));
  }

  function removeAutoRaceAbilities() {
    fields.abilities.querySelectorAll('[data-race-feature="true"]').forEach((row) => row.remove());
  }

  function removeEmptyCustomAbilityRows() {
    fields.abilities.querySelectorAll('.enemy-builder-ability-row:not([data-race-feature="true"])').forEach((row) => {
      if (row.dataset.templateId !== "custom") return;
      const title = row.querySelector(".enemy-builder-ability-title")?.value.trim() || "";
      const body = row.querySelector(".enemy-builder-ability-body")?.value.trim() || "";
      if (!title && !body) row.remove();
    });
  }

  function manualAbilityTitles() {
    return new Set(Array.from(fields.abilities.querySelectorAll('.enemy-builder-ability-row:not([data-race-feature="true"]) .enemy-builder-ability-title'))
      .map((input) => normalizeAbilityHeading(input.value, []).title.trim()).filter(Boolean));
  }

  function applyRaceFeatures() {
    removeAutoRaceAbilities();
    if (fields.taxa.value.trim() !== "人族") {
      if (!fields.abilities.children.length) addAbility();
      updateAbilityOrderButtons();
      updateOutput();
      return;
    }
    removeEmptyCustomAbilityRows();
    const existing = manualAbilityTitles();
    raceFeatureTemplates().forEach((template) => {
      if (existing.has(template.name)) return;
      const row = addAbility(template);
      row.dataset.raceFeature = "true";
      row.dataset.raceName = fields.race.value;
      setAbilityNameMode(row, "name", { focus: false });
    });
    if (!fields.abilities.children.length) addAbility();
    updateAbilityOrderButtons();
    updateOutput();
  }

  function syncRaceFeatureUi({ apply = true } = {}) {
    const isHumanoid = fields.taxa.value.trim() === "人族";
    if (fields.raceField) fields.raceField.hidden = !isHumanoid;
    if (!isHumanoid) {
      removeAutoRaceAbilities();
      if (!fields.abilities.children.length) addAbility();
      updateAbilityOrderButtons();
      updateOutput();
      return;
    }
    populateRaceOptions();
    if (apply) applyRaceFeatures();
  }

  function getContext() {
    const level = Math.max(1, Math.min(30, toNumber(fields.level.value, 1)));
    return { level, base: level + 3, fixed: level + 10, magic: level + 3 };
  }

  function getDefaultAbilityParams(template) {
    const definition = abilityParameterDefinitions[template?.id];
    const context = getContext();
    return Object.fromEntries((definition?.fields || []).map((field) => [field.key, field.context ? context[field.context] : typeof field.value === "function" ? field.value(context) : field.value]));
  }

  function getTemplateTitle(template, params = getDefaultAbilityParams(template)) {
    const parameterTitle = abilityParameterDefinitions[template?.id]?.title;
    if (parameterTitle) return parameterTitle(params, getContext());
    return typeof template.title === "function" ? template.title(getContext()) : template.name;
  }

  function getTemplateBody(template, params = getDefaultAbilityParams(template)) {
    const parameterBody = abilityParameterDefinitions[template?.id]?.body;
    if (parameterBody) return parameterBody(params, getContext());
    return typeof template.defaultBody === "function" ? template.defaultBody(getContext()) : (template.defaultBody || "");
  }

  function partRow(values = {}) {
    const row = document.createElement("tr");
    row.className = "enemy-builder-part-row";
    const accuracyFix = values.accuracyFix ?? (values.accuracy !== undefined && values.accuracy !== "" ? fixedValue(values.accuracy) : "");
    const evasionFix = values.evasionFix ?? (values.evasion !== undefined && values.evasion !== "" ? fixedValue(values.evasion) : "");
    row.innerHTML = `
      <td><input type="text" class="enemy-builder-part-style" value="${escapeHtml(values.style || "")}" /></td>
      <td><div class="enemy-builder-check-pair"><input type="number" class="enemy-builder-part-accuracy" value="${escapeHtml(values.accuracy ?? "")}" aria-label="命中力基準値" /><span>（</span><input type="number" class="enemy-builder-part-accuracy-fix" value="${escapeHtml(accuracyFix)}" aria-label="命中力固定値" /><span>）</span></div></td>
      <td><input type="text" class="enemy-builder-part-damage" value="${escapeHtml(values.damage ?? "")}" /></td>
      <td><div class="enemy-builder-check-pair"><input type="number" class="enemy-builder-part-evasion" value="${escapeHtml(values.evasion ?? "")}" aria-label="回避力基準値" /><span>（</span><input type="number" class="enemy-builder-part-evasion-fix" value="${escapeHtml(evasionFix)}" aria-label="回避力固定値" /><span>）</span></div></td>
      <td><input type="number" class="enemy-builder-part-defense" value="${escapeHtml(values.defense ?? "")}" /></td>
      <td><input type="number" class="enemy-builder-part-hp" value="${escapeHtml(values.hp ?? "")}" /></td>
      <td><input type="number" class="enemy-builder-part-mp" value="${escapeHtml(values.mp ?? "")}" /></td>
      <td><button type="button" class="enemy-builder-remove-part" aria-label="部位を削除"><i class="fa-solid fa-xmark"></i></button></td>`;
    return row;
  }

  function readParts() {
    return Array.from(fields.parts.querySelectorAll(".enemy-builder-part-row")).map((row) => ({
      style: row.querySelector(".enemy-builder-part-style").value.trim(),
      accuracy: row.querySelector(".enemy-builder-part-accuracy").value,
      accuracyFix: row.querySelector(".enemy-builder-part-accuracy-fix").value,
      damage: row.querySelector(".enemy-builder-part-damage").value.trim(),
      evasion: row.querySelector(".enemy-builder-part-evasion").value,
      evasionFix: row.querySelector(".enemy-builder-part-evasion-fix").value,
      defense: row.querySelector(".enemy-builder-part-defense").value,
      hp: row.querySelector(".enemy-builder-part-hp").value,
      mp: row.querySelector(".enemy-builder-part-mp").value,
    }));
  }

  function partNamesFromRows(parts = readParts()) {
    return parts.map((part) => (part.style.match(/.*[（(](.+?)[）)]$/) || [])[1]?.trim()).filter(Boolean);
  }

  function compactPartNames(names) {
    return names.reduce((result, name) => {
      const last = result[result.length - 1];
      if (last?.name === name) last.count += 1;
      else result.push({ name, count: 1 });
      return result;
    }, []).map((item) => `${item.name}${item.count > 1 ? `×${item.count}` : ""}`).join("／");
  }

  function updateCorePartsList() {
    const items = fields.partsBreakdown.value.trim().split(/[/／]/).map((item) => item.trim()).filter(Boolean)
      .map((item) => item.replace(/[*×][\d０１２３４５６７８９]+$/, "（すべて）"));
    fields.corePartsList.innerHTML = ["なし", ...items].map((item) => `<option value="${escapeHtml(item)}"></option>`).join("");
  }

  function abilityPartChoices() {
    const parts = readParts();
    if (parts.length <= 1) return [{ value: "全身", label: "全身", heading: "全身" }];
    const namedParts = parts.map((part, index) => {
      const ordinal = `${index + 1}部位目`;
      const extracted = (part.style.match(/.*[（(](.+?)[）)]$/) || [])[1]?.trim();
      const name = extracted && !/^部位\d+$/.test(extracted) ? extracted : ordinal;
      return { index: index + 1, ordinal, name };
    });
    if (fields.splitDuplicateParts.checked) {
      return [
        { value: "全身", label: "全身", heading: "全身" },
        ...namedParts.map((part) => ({
          value: `part:${part.index}`,
          label: part.name === part.ordinal ? part.ordinal : `${part.ordinal}（${part.name}）`,
          heading: part.name === part.ordinal ? part.ordinal : `${part.ordinal}（${part.name}）`,
          sourceName: part.name,
          memberIndexes: [part.index],
        })),
      ];
    }
    const grouped = [];
    namedParts.forEach((part) => {
      const existing = grouped.find((choice) => choice.sourceName === part.name);
      if (existing) existing.memberIndexes.push(part.index);
      else grouped.push({ value: `group:${part.name}`, label: part.name, heading: part.name, sourceName: part.name, memberIndexes: [part.index] });
    });
    return [{ value: "全身", label: "全身", heading: "全身" }, ...grouped];
  }

  function abilityPartOptions(selected = "全身") {
    return abilityPartChoices().map((part) => `<option value="${escapeHtml(part.value)}"${part.value === selected ? " selected" : ""}>${escapeHtml(part.label)}</option>`).join("");
  }

  function syncAbilityPartOptions() {
    const hasMultipleParts = readParts().length > 1;
    const choices = abilityPartChoices();
    fields.splitDuplicateParts.closest(".enemy-builder-split-parts-toggle").hidden = !hasMultipleParts;
    fields.abilities.querySelectorAll(".enemy-builder-ability-part").forEach((select) => {
      const selected = select.value || "全身";
      let nextSelected = selected;
      if (!choices.some((choice) => choice.value === nextSelected)) {
        if (selected.startsWith("part:")) {
          const index = toNumber(selected.split(":")[1]);
          nextSelected = choices.find((choice) => choice.memberIndexes?.includes(index))?.value || "全身";
        } else if (selected.startsWith("group:")) {
          const sourceName = selected.slice(6);
          nextSelected = choices.find((choice) => choice.sourceName === sourceName)?.value || "全身";
        } else nextSelected = "全身";
      }
      select.innerHTML = abilityPartOptions(selected);
      select.value = nextSelected;
      select.closest(".enemy-builder-ability-part-field").hidden = !hasMultipleParts;
      select.closest(".enemy-builder-ability-row-head").classList.toggle("is-single-part", !hasMultipleParts);
    });
    updateOutput();
  }

  function syncPartsSummary() {
    if (!fields.partsManual.checked) {
      const parts = readParts();
      fields.partsTotal.value = parts.length;
      fields.partsBreakdown.value = compactPartNames(partNamesFromRows(parts));
    }
    fields.partsTotal.readOnly = !fields.partsManual.checked;
    fields.partsBreakdown.readOnly = !fields.partsManual.checked;
    updateCorePartsList();
    syncAbilityPartOptions();
  }

  function syncPartCount(count, preserve = true) {
    const target = Math.max(1, Math.min(8, toNumber(count, 1)));
    const existing = preserve ? readParts() : [];
    fields.parts.innerHTML = "";
    for (let index = 0; index < target; index += 1) {
      fields.parts.appendChild(partRow(existing[index] || {}));
    }
    fields.partCount.value = target;
    syncPartsSummary();
  }

  function lootRow(values = {}) {
    const row = document.createElement("div");
    row.className = "enemy-builder-loot-row";
    row.innerHTML = `
      <input type="text" class="enemy-builder-loot-num" value="${escapeHtml(values.num || "")}" placeholder="2～6" aria-label="戦利品の出目" />
      <input type="text" class="enemy-builder-loot-item" value="${escapeHtml(values.item || "")}" placeholder="なし／素材（100G）" aria-label="戦利品の内容" />
      <button type="button" class="enemy-builder-remove-loot" aria-label="戦利品を削除"><i class="fa-solid fa-xmark"></i></button>`;
    return row;
  }

  function resetLootRows() {
    fields.loot.innerHTML = "";
    fields.loot.appendChild(lootRow());
  }

  function applyPresetDefaults() {
    const preset = enemyPresets[fields.preset.value] || enemyPresets.custom;
    if (preset === enemyPresets.custom) return preset;
    if (preset.role) fields.role.value = preset.role;
    if (preset.partCount) fields.partCount.value = preset.partCount;
    ["taxa", "intelligence", "perception", "reaction", "language", "habitat", "weakness", "coreParts"].forEach((key) => {
      fields[key].value = preset[key] || "";
    });
    return preset;
  }

  function applyAutofill() {
    const preset = applyPresetDefaults();
    const level = Math.max(1, Math.min(30, toNumber(fields.level.value, 5)));
    const profile = roleProfiles[fields.role.value] || roleProfiles.balanced;
    const count = Math.max(1, Math.min(8, toNumber(fields.partCount.value, 1)));
    const hit = Math.max(1, level + 3 + profile.hit);
    const evasion = Math.max(0, level + 3 + profile.eva);
    const damage = Math.max(0, level + 2 + profile.damage);
    const defense = Math.max(0, Math.floor(level / 2) + 2 + profile.defense);
    const hpScale = count > 1 ? 0.72 : 1;
    const hp = Math.max(1, Math.round((level * 6 + 20) * profile.hp * hpScale));
    const mp = Math.max(0, Math.round((level * 3 + 5) * profile.mp));
    fields.reputation.value = level + 5;
    fields.weaknessValue.value = level + 8;
    fields.initiative.value = Math.max(0, level + 4 + profile.eva);
    fields.mobility.value = Math.max(1, 10 + level);
    fields.vitResist.value = Math.max(0, level + 3 + profile.resist);
    fields.mndResist.value = Math.max(0, level + 3 + profile.resist + (fields.role.value === "caster" ? 1 : 0));
    fields.vitResistFix.value = fixedValue(fields.vitResist.value);
    fields.mndResistFix.value = fixedValue(fields.mndResist.value);
    if (!fields.weakness.value) fields.weakness.value = "物理ダメージ+2点";
    syncPartCount(count, false);
    Array.from(fields.parts.children).forEach((row, index) => {
      row.querySelector(".enemy-builder-part-style").value = preset.partNames?.[index] || (count === 1 ? "体当たり" : `攻撃（部位${index + 1}）`);
      row.querySelector(".enemy-builder-part-accuracy").value = hit;
      row.querySelector(".enemy-builder-part-accuracy-fix").value = fixedValue(hit);
      row.querySelector(".enemy-builder-part-damage").value = `2d+${damage}`;
      row.querySelector(".enemy-builder-part-evasion").value = evasion;
      row.querySelector(".enemy-builder-part-evasion-fix").value = fixedValue(evasion);
      row.querySelector(".enemy-builder-part-defense").value = defense;
      row.querySelector(".enemy-builder-part-hp").value = hp;
      row.querySelector(".enemy-builder-part-mp").value = mp;
    });
    syncRaceFeatureUi();
    updateOutput();
  }

  function setGenerationMode(mode = fields.generationMode.value) {
    const dream = mode === "dream";
    panel.querySelectorAll(".enemy-builder-motif-setting").forEach((element) => { element.hidden = dream; });
    panel.querySelectorAll(".enemy-builder-dream-setting").forEach((element) => { element.hidden = !dream; });
    fields.dreamSummary.hidden = !dream || !fields.dreamSummary.textContent.trim();
  }

  function dreamTaxaModifier(taxa, level) {
    const mod = { accuracy: 0, damage: 0, evasion: 0, defense: 0, hp: 0, mp: 0, vit: 0, mnd: 0, initiative: 0, weakValue: 0 };
    if (taxa === "蛮族") { mod.evasion = 1; if (level >= 6) mod.initiative = 1; if (level >= 11) mod.mnd = 1; }
    if (taxa === "動物") { mod.vit = level >= 11 ? 3 : level >= 6 ? 2 : 1; mod.defense = level >= 11 ? 2 : level >= 6 ? 1 : 0; }
    if (taxa === "植物") { mod.hp = level >= 11 ? 20 : level >= 6 ? 10 : 5; mod.vit = level >= 11 ? 2 : level >= 6 ? 1 : 0; }
    if (taxa === "アンデッド") { mod.mnd = level >= 6 ? 2 : 1; mod.accuracy = level >= 6 ? 1 : 0; mod.weakValue = level >= 11 ? 1 : 0; }
    if (taxa === "魔法生物") { mod.defense = level >= 11 ? 3 : level >= 6 ? 2 : 1; mod.mnd = level >= 11 ? 2 : level >= 6 ? 1 : 0; mod.hp = level >= 11 ? 10 : 0; }
    if (taxa === "幻獣") { mod.mp = level >= 11 ? 20 : level >= 6 ? 10 : 5; mod.accuracy = level >= 6 ? 1 : 0; mod.evasion = level >= 11 ? 1 : 0; }
    if (taxa === "妖精") { mod.mp = level >= 11 ? 20 : level >= 6 ? 10 : 5; mod.evasion = level >= 11 ? 2 : level >= 6 ? 1 : 0; }
    if (taxa === "魔神") { mod.accuracy = level >= 11 ? 2 : 1; mod.damage = level >= 11 ? 2 : level >= 6 ? 1 : 0; mod.weakValue = level >= 11 ? 2 : level >= 6 ? 1 : 0; }
    if (taxa === "人族") { mod.defense = level >= 11 ? 3 : level >= 6 ? 2 : 1; mod.accuracy = level >= 6 ? 1 : 0; mod.evasion = level >= 11 ? 1 : 0; }
    return mod;
  }

  function dreamUnlockedItems(items, level) {
    return (items || []).filter((item, index) => item && dreamProgressionLevels[index] <= level);
  }

  function applyDreamPersonalityAbilities(personalityKey, level) {
    const personality = dreamPersonalities[personalityKey];
    if (!personality) return;

    const magic = dreamMagicProgressions[personality.magic];
    if (magic) {
      const spells = dreamUnlockedItems(magic.spells, level);
      const feats = dreamUnlockedItems(magic.feats, level);
      const magicPower = level + 3;
      if (spells.length) {
        addAbility({
          id: `dream-magic-${personalityKey}`,
          category: "major",
          marker: "主",
          name: `${magic.label}${level}レベル／魔力${magicPower}（${fixedValue(magicPower)}）`,
          defaultBody: `${spells.map((spell) => `【${spell}】`).join(" ")}を使用します。`,
        });
      }
      if (feats.length) {
        const markers = [...new Set(feats.map((feat) => dreamFeatMarkers[feat] || "常"))];
        addAbility({
          id: `dream-feats-${personalityKey}`,
          category: "passive",
          marker: markers[0] || "常",
          markers,
          name: "戦闘特技",
          defaultBody: `${feats.map((feat) => `《${feat}》`).join(" ")}を習得しています。`,
        });
      }
    }

    const techniques = dreamTechniqueProgressions[personality.techniques];
    const unlockedTechniques = dreamUnlockedItems(techniques, level);
    if (unlockedTechniques.length) {
      addAbility({
        id: `dream-techniques-${personalityKey}`,
        category: "minor",
        marker: "補",
        markers: ["補", "準"],
        name: "練技",
        defaultBody: `${unlockedTechniques.map((technique) => `【${technique}】`).join(" ")}の練技を使用します。`,
      });
    }
  }

  function applyDreamAbilitySet(taxa, level, personalityKey) {
    const required = {
      植物: ["posture-control"],
      アンデッド: ["poison-immunity", "mental-immunity", "undying-body"],
      魔法生物: ["poison-immunity", "mental-immunity", "artificial-body"],
      幻獣: ["magic-lore"], 妖精: ["magic-lore", "immunity"], 魔神: ["fear"],
    }[taxa] || [];
    const pools = {
      蛮族: ["full-power", "multi-attack", "continuous-attack", "critical-blow", "area", "multiple-actions"],
      動物: ["flight", "multi-attack", "continuous-attack", "critical-blow", "entangle", "breath"],
      植物: ["regeneration", "entangle", "poison-immunity", "critical-blow", "area", "attack-obstruction"],
      アンデッド: ["drain", "regeneration", "fear", "area", "attack-obstruction", "normal-weapon-immunity"],
      魔法生物: ["flight", "multi-attack", "continuous-attack", "magic", "attack-obstruction", "damage-reduction"],
      幻獣: ["flight", "wing-flight", "breath", "magic", "area", "regeneration"],
      妖精: ["flight", "magic", "area", "damage-reduction", "reposition"],
      魔神: ["full-power", "multi-attack", "fear", "breath", "magic", "area"],
      人族: ["full-power", "multi-attack", "ranged", "magic", "targeting-hawk-eye"],
    }[taxa] || ["continuous-attack", "critical-blow", "area"];
    const extraCount = level >= 8 ? 2 : 1;
    const shuffled = [...pools].sort(() => Math.random() - 0.5).slice(0, extraCount);
    fields.abilities.innerHTML = "";
    [...new Set([...required, ...shuffled])].forEach((id) => {
      const template = abilityTemplates.find((item) => item.id === id);
      if (template) addAbility(template);
    });
    applyDreamPersonalityAbilities(personalityKey, level);
    if (!fields.abilities.children.length) addAbility();
  }

  function generateDreamEnemy() {
    const al = Math.max(1, Math.min(10, toNumber(fields.dreamAl.value, 5)));
    const players = Math.max(1, Math.min(5, toNumber(fields.dreamPlayers.value, 4)));
    const roll = fields.dreamRoll.value === "random" ? Math.floor(Math.random() * 6) + 1 : Math.max(1, Math.min(6, toNumber(fields.dreamRoll.value, 1)));
    const [partCount, bossAdjust, minionCount, minionAdjust] = dreamFormationTable[players][roll - 1];
    const level = Math.max(1, Math.min(13, al + bossAdjust));
    const minionLevel = Math.max(1, Math.min(13, al + minionAdjust));
    const taxaList = Object.keys(dreamTaxaDefaults);
    const taxa = fields.dreamTaxa.value === "random" ? taxaList[Math.floor(Math.random() * taxaList.length)] : fields.dreamTaxa.value;
    const personalityKeys = Object.keys(dreamPersonalities);
    const personalityKey = fields.dreamPersonality.value === "random" ? personalityKeys[Math.floor(Math.random() * personalityKeys.length)] : fields.dreamPersonality.value;
    const personality = dreamPersonalities[personalityKey];
    const mod = dreamTaxaModifier(taxa, level);
    const defaults = dreamTaxaDefaults[taxa];
    const weaknessList = dreamWeaknesses[taxa] || ["なし"];
    const weakness = weaknessList[Math.floor(Math.random() * weaknessList.length)];

    fields.level.value = level;
    fields.partCount.value = partCount;
    fields.partsManual.checked = false; fields.splitDuplicateParts.checked = false;
    fields.preset.value = "custom";
    fields.role.value = "balanced";
    fields.name.value = `“${personality.epithet}”夢幻の${taxa}`;
    fields.taxa.value = taxa;
    [fields.intelligence.value, fields.perception.value, fields.reaction.value, fields.language.value, fields.habitat.value] = defaults;
    fields.reputation.value = level + 8;
    fields.weaknessValue.value = level + 11 + mod.weakValue;
    fields.weakness.value = weakness;
    fields.initiative.value = level + 8 + mod.initiative;
    fields.mobility.value = 10 + level;

    const core = dreamBossStats[level];
    fields.vitResist.value = core[0] + mod.vit;
    fields.mndResist.value = core[0] + mod.mnd;
    fields.vitResistFix.value = fixedValue(fields.vitResist.value);
    fields.mndResistFix.value = fixedValue(fields.mndResist.value);
    syncPartCount(partCount, false);
    Array.from(fields.parts.children).forEach((row, index) => {
      const stats = index === 0 ? core : dreamOtherStats[level];
      const accuracy = stats[0] + mod.accuracy;
      const evasion = stats[2] + mod.evasion;
      row.querySelector(".enemy-builder-part-style").value = index === 0 ? "攻撃（コア部位）" : `攻撃（部位${index + 1}）`;
      row.querySelector(".enemy-builder-part-accuracy").value = accuracy;
      row.querySelector(".enemy-builder-part-accuracy-fix").value = fixedValue(accuracy);
      row.querySelector(".enemy-builder-part-damage").value = stats[1] + mod.damage ? `2d+${stats[1] + mod.damage}` : "2d";
      row.querySelector(".enemy-builder-part-evasion").value = evasion;
      row.querySelector(".enemy-builder-part-evasion-fix").value = fixedValue(evasion);
      row.querySelector(".enemy-builder-part-defense").value = stats[3] + mod.defense;
      row.querySelector(".enemy-builder-part-hp").value = stats[4] + mod.hp;
      row.querySelector(".enemy-builder-part-mp").value = stats[4] + mod.mp;
    });
    syncPartsSummary();
    fields.coreParts.value = "コア部位";
    applyDreamAbilitySet(taxa, level, personalityKey);
    syncRaceFeatureUi();
    fields.dreamSummary.textContent = `編成ダイス：${roll}　ボス：レベル${level}・${partCount}部位　ザコ：${minionCount ? `レベル${minionLevel}を${minionCount}体` : "なし"}　分類：${taxa}　性格：${personality.label}　二つ名：“${personality.epithet}”`;
    fields.dreamSummary.hidden = false;
    updateOutput();
  }

  function optionHtml(values, selected = "") {
    return values.map((option) => {
      const value = typeof option === "object" ? option.value : option;
      const label = typeof option === "object" ? (option.label || option.value) : option;
      return `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
    }).join("");
  }

  function buildAbilityAssistHtml(item) {
    const assist = item.assist || "generic";
    let specific = "";
    const collectionLabels = { techniques: "練技", "combat-feats": "戦闘特技", spellsongs: "呪歌", alchemy: "賦術", geomancy: "相域" };
    if (collectionLabels[assist]) {
      const label = collectionLabels[assist];
      specific = `
        <div class="enemy-builder-assist-specific enemy-builder-assist-collection" data-assist-kind="${assist}">
          <label><span>${label}</span><select class="enemy-builder-assist-option" aria-label="${label}候補">${optionHtml(getAbilityAssistOptions(assist))}</select></label>
          <button type="button" class="small-button enemy-builder-assist-add" data-assist-action="add-option"><i class="fa-solid fa-plus"></i> 選択</button>
          <div class="enemy-builder-assist-selected" aria-label="選択中の${label}"></div>
        </div>`;
    } else if (assist === "magic") {
      const context = getContext();
      specific = `
        <div class="enemy-builder-assist-specific enemy-builder-assist-magic">
          <label><span>魔法系統</span><select class="enemy-builder-assist-option" aria-label="魔法系統">${optionHtml(abilityAssistOptions.magic)}</select></label>
          <button type="button" class="small-button enemy-builder-assist-add" data-assist-action="add-magic-system"><i class="fa-solid fa-plus"></i> 系統を追加</button>
          <div class="enemy-builder-assist-selected enemy-builder-magic-systems" aria-label="選択中の魔法系統">
            <button type="button" class="enemy-builder-assist-chip" data-magic-system="真語魔法" aria-label="真語魔法を選択解除">真語魔法 <i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
          </div>
          <label><span>レベル</span><input type="number" class="enemy-builder-assist-level" min="1" max="30" value="${context.level}" aria-label="魔法レベル" /></label>
          <label><span>魔力</span><input type="number" class="enemy-builder-assist-power" min="0" value="${context.magic}" aria-label="魔力" /></label>
          <label><span>固定値</span><input type="number" class="enemy-builder-assist-power-fixed" value="${fixedValue(context.magic)}" aria-label="魔力固定値" readonly /></label>
          <label class="enemy-builder-abyss-extension" hidden><span>奈落拡張（R）</span><input type="number" class="enemy-builder-abyss-extension-rounds" min="1" value="1" aria-label="奈落魔法の拡張効果を使用できるラウンド" /></label>
          <button type="button" class="small-button enemy-builder-assist-add" data-assist-action="set-magic-title"><i class="fa-solid fa-arrow-up-right-from-square"></i> 能力名に反映</button>
        </div>`;
    }

    if (!specific) return "";
    return `
      <details class="enemy-builder-guided-editor"${specific ? " open" : ""}>
        <summary><i class="fa-solid fa-wand-magic-sparkles"></i> 候補を組み合わせる</summary>
        ${specific}
      </details>`;
  }

  function selectedAssistValues(row) {
    return Array.from(row?.querySelectorAll(".enemy-builder-assist-collection [data-assist-value]") || []).map((chip) => chip.dataset.assistValue);
  }

  function assistedAbilityBody(row, item, params = {}) {
    const collection = row?.querySelector(".enemy-builder-assist-collection");
    if (!collection) return getTemplateBody(item, params);
    const values = selectedAssistValues(row);
    const kind = collection.dataset.assistKind;
    if (kind === "techniques") {
      const names = values.map((value) => value === "リカバリィ" ? `リカバリィ（${params.recovery ?? 5}点回復）` : value);
      return names.length ? `${names.map((value) => `【${value}】`).join("")}の練技を使用します。` : "";
    }
    if (kind === "combat-feats") return values.length ? `${values.map((value) => `《${value}》`).join(" ")}を習得しています。` : "";
    if (kind === "spellsongs") return values.length ? `${values.map((value) => `【${value}】`).join("")}の呪歌を使用します。` : "";
    if (kind === "alchemy") {
      if (!values.length) return "";
      return `${values.map((value) => `【${value}】`).join("")}の賦術を${params.rank || "A"}ランクで使用します。主動作で使用する場合は見出しの基準値で賦術判定を行い、補助動作で使用する場合は達成値0として扱います。`;
    }
    if (kind === "geomancy") return values.length ? `相域${values.map((value) => `【${value}】`).join("")}を「命脈点：${params.pulse ?? 2}」で使用します。` : "";
    return getTemplateBody(item, params);
  }

  function updateCollectedAbilityBody(row) {
    const collection = row.querySelector(".enemy-builder-assist-collection");
    const body = row.querySelector(".enemy-builder-ability-body");
    if (!collection || !body) return;
    const selectedChips = Array.from(collection.querySelectorAll("[data-assist-value]"));
    const selectedMarkers = selectedChips.flatMap((chip) => (chip.dataset.assistMarkers || "").split(",").filter(Boolean));
    const template = abilityTemplates.find((item) => item.id === row.dataset.templateId);
    const fallbackMarkers = template ? (template.markers || [template.marker]) : ["常"];
    const markers = selectedMarkers.length
      ? abilityMarkerOptions.map(([marker]) => marker).filter((marker) => selectedMarkers.includes(marker))
      : fallbackMarkers;
    row.querySelectorAll(".enemy-builder-marker-toggle").forEach((button) => {
      button.setAttribute("aria-pressed", String(markers.includes(button.dataset.marker)));
    });
    const params = template ? readAbilityParams(row, template) : {};
    body.value = assistedAbilityBody(row, template || {}, params);
    syncAssistDependentParams(row);
    updateAbilityUseLimit(row);
  }

  function addCollectedAbilityOption(row, value) {
    const collection = row.querySelector(".enemy-builder-assist-collection");
    const selected = collection?.querySelector(".enemy-builder-assist-selected");
    if (!selected || !value) return;
    if (Array.from(selected.querySelectorAll("[data-assist-value]")).some((chip) => chip.dataset.assistValue === value)) {
      showLocalNotice("同じ候補はすでに選択されています。");
      return;
    }
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "enemy-builder-assist-chip";
    chip.dataset.assistValue = value;
    const assistKind = collection.dataset.assistKind;
    const option = getAbilityAssistOptions(assistKind)?.find((item) => (typeof item === "object" ? item.value : item) === value);
    chip.dataset.assistMarkers = (typeof option === "object" ? option.markers : [])?.join(",") || "";
    chip.innerHTML = `${escapeHtml(value)} <i class="fa-solid fa-xmark" aria-hidden="true"></i>`;
    chip.setAttribute("aria-label", `${value}を選択解除`);
    selected.appendChild(chip);
    updateCollectedAbilityBody(row);
  }

  function updateMagicAbilityTitle(row) {
    const systems = Array.from(row.querySelectorAll("[data-magic-system]")).map((chip) => chip.dataset.magicSystem);
    const fallbackSystem = row.querySelector(".enemy-builder-assist-option")?.value || "魔法";
    const level = Math.max(1, toNumber(row.querySelector(".enemy-builder-assist-level")?.value, 1));
    const power = Math.max(0, toNumber(row.querySelector(".enemy-builder-assist-power")?.value, level + 3));
    const hasAbyssMagic = systems.includes("奈落魔法");
    const abyssLabel = row.querySelector(".enemy-builder-abyss-extension");
    const extensionRounds = Math.max(1, toNumber(row.querySelector(".enemy-builder-abyss-extension-rounds")?.value, 1));
    if (abyssLabel) abyssLabel.hidden = !hasAbyssMagic;

    const title = row.querySelector(".enemy-builder-ability-title");
    const body = row.querySelector(".enemy-builder-ability-body");
    const selectedSystems = systems.length ? systems : [fallbackSystem];
    if (title) {
      title.value = selectedSystems.length > 1
        ? `魔法（${selectedSystems.length}系統）${level}レベル／魔力${power}（${fixedValue(power)}）`
        : `${selectedSystems[0]}${level}レベル／魔力${power}（${fixedValue(power)}）`;
    }
    if (body) {
      const sentences = [];
      if (selectedSystems.length > 1) sentences.push(`選択した${selectedSystems.length}系統の魔法を${level}レベルまで使用します。`);
      if (hasAbyssMagic) sentences.push(selectedSystems.length > 1
        ? `奈落魔法を習得している場合、拡張効果は${extensionRounds}ラウンド目まで使用します。`
        : `拡張効果は${extensionRounds}ラウンド目まで使用します。`);
      body.value = sentences.join("\n");
    }
    updateOutput();
  }

  function addMagicSystemOption(row, value) {
    const selected = row.querySelector(".enemy-builder-magic-systems");
    if (!selected || !value) return;
    if (selected.querySelector(`[data-magic-system="${CSS.escape(value)}"]`)) {
      showLocalNotice("同じ魔法系統はすでに選択されています。");
      return;
    }
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "enemy-builder-assist-chip";
    chip.dataset.magicSystem = value;
    chip.innerHTML = `${escapeHtml(value)} <i class="fa-solid fa-xmark" aria-hidden="true"></i>`;
    chip.setAttribute("aria-label", `${value}を選択解除`);
    selected.appendChild(chip);
    updateMagicAbilityTitle(row);
  }

  const abilityMarkerOptions = [
    ["常", "常時型"], ["宣", "宣言型"], ["主", "主動作型"], ["補", "補助動作型"], ["準", "戦闘準備型"],
  ];

  const markerOptionGlyphs = { 常: "\uef4a", 準: "\ue86b", 主: "\ue037", 補: "\ue01f", 宣: "\ue625" };

  function abilityMarkerButtons(markers = ["常"]) {
    return abilityMarkerOptions.map(([marker, label]) => `<button type="button" class="enemy-builder-marker-toggle" data-marker="${marker}" aria-label="${label}" aria-pressed="${markers.includes(marker)}" title="${label}"><i class="s-icon ${previewMarkerClasses[marker] || "passive"}" aria-hidden="true"><span class="raw">[${marker}]</span></i></button>`).join("");
  }

  function normalizeAbilityHeading(title, fallbackMarkers) {
    const patterns = [
      ["常", /^(?:\[常\]|○|◯|〇)\s*/u], ["準", /^(?:\[準\]|△)\s*/u],
      ["主", /^(?:\[主\]|＞|▶|〆|>)\s*/u], ["補", /^(?:\[補\]|≫|>>|☆)\s*/u], ["宣", /^(?:\[宣\]|🗨|□|☑)\s*/u],
    ];
    let source = String(title || "").trim();
    const detected = [];
    let matched = patterns.find(([, pattern]) => pattern.test(source));
    while (matched) {
      detected.push(matched[0]);
      source = source.replace(matched[1], "").trim();
      matched = patterns.find(([, pattern]) => pattern.test(source));
    }
    return { markers: [...new Set([...fallbackMarkers, ...detected])], title: source };
  }

  const abilityCategoryLabels = {
    passive: "常時型", preparation: "戦闘準備型", major: "主動作型", minor: "補助動作型", declaration: "宣言型", reaction: "反応・特殊",
  };

  const abilityPriorityIds = [
    "magic", "magic-adaptation",
    "basic-spellsongs", "finale", "techniques", "alchemy", "geomancy", "war-command",
  ];

  const abilityRelatedGroups = [
    { label: "攻撃回数・行動", ids: ["multi-attack", "continuous-attack", "two-actions", "limited-two-actions", "multiple-declarations", "multiple-actions"] },
    { label: "遠隔・射撃・武器", ids: ["targeting", "targeting-hawk-eye", "bow", "gun", "throwing-attack", "psychokinetic-throw", "gunfire", "ranged"] },
    { label: "飛行・移動", ids: ["flight", "wing-flight", "underwater-specialization", "reposition"] },
    { label: "身体・耐性", ids: ["bone-body", "tough-skin", "poison-immunity", "mental-immunity", "immunity", "posture-control", "undying-body", "artificial-body", "mechanical-body", "rooted", "normal-weapon-immunity"] },
    { label: "防御・部位", ids: ["guard", "guardian", "attack-obstruction"] },
    { label: "攻撃能力", ids: ["breath", "breath-control", "area", "drain", "entangle", "critical-blow"] },
    { label: "回復・反応", ids: ["regeneration", "counter"] },
    { label: "戦利品・その他", ids: ["delicate-loot"] },
  ];

  function abilityOptionHtml(item, selectedId = "") {
    const markerText = (item.markers || [item.marker]).map((marker) => markerOptionGlyphs[marker] || "").join("");
    return `<option value="${item.id}"${item.id === selectedId ? " selected" : ""}>${markerText}${markerText ? " " : ""}${escapeHtml(item.name)}</option>`;
  }

  function abilityTemplateOptions(selectedId = "") {
    const visible = abilityTemplates.filter((item) => reusableAbilityIds.has(item.id));
    const byId = new Map(visible.map((item) => [item.id, item]));
    const used = new Set();
    const groups = [];
    const addGroup = (label, items) => {
      const unique = items.filter((item) => item && !used.has(item.id));
      if (!unique.length) return;
      unique.forEach((item) => used.add(item.id));
      groups.push(`<optgroup label="${escapeHtml(label)}">${unique.map((item) => abilityOptionHtml(item, selectedId)).join("")}</optgroup>`);
    };

    addGroup("冒険者技能・よく使う", abilityPriorityIds.map((id) => byId.get(id)));
    addGroup("宣言特技", visible.filter((item) => item.category === "declaration"));
    abilityRelatedGroups.forEach((group) => addGroup(group.label, group.ids.map((id) => byId.get(id))));

    Object.entries(abilityCategoryLabels).forEach(([category, label]) => {
      addGroup(label, visible.filter((item) => item.category === category));
    });
    return groups.join("");
  }

  function abilityParameterControlHtml(field, defaults) {
    const visibleByParam = !field.visibleWhen || defaults[field.visibleWhen.key] === field.visibleWhen.value;
    const visibleByAssist = !field.visibleWhenAssist;
    const visible = visibleByParam && visibleByAssist;
    return `<label${visible ? "" : " hidden"}${field.visibleWhen ? ` data-visible-when-key="${escapeHtml(field.visibleWhen.key)}" data-visible-when-value="${escapeHtml(field.visibleWhen.value)}"` : ""}${field.visibleWhenAssist ? ` data-visible-when-assist="${escapeHtml(field.visibleWhenAssist)}"` : ""}>
      <span>${escapeHtml(field.label)}</span>
      ${field.options ? `<select class="enemy-builder-param-input" data-param-key="${escapeHtml(field.key)}" aria-label="${escapeHtml(field.label)}">${field.options.map((option) => `<option value="${escapeHtml(option)}"${option === defaults[field.key] ? " selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select>` : `<input class="enemy-builder-param-input" data-param-key="${escapeHtml(field.key)}" type="${field.type === "number" ? "number" : "text"}"${field.list ? ` list="${escapeHtml(field.list)}"` : ""} value="${escapeHtml(defaults[field.key])}" aria-label="${escapeHtml(field.label)}" />`}
    </label>`;
  }

  function abilityInlineParameterControlsHtml(item) {
    const definition = abilityParameterDefinitions[item?.id];
    const fields = definition?.fields?.filter((field) => field.inline) || [];
    if (!fields.length) return "";
    const defaults = getDefaultAbilityParams(item);
    return fields.map((field) => abilityParameterControlHtml(field, defaults)).join("");
  }

  function abilityParameterHtml(item) {
    const definition = abilityParameterDefinitions[item?.id];
    const allFields = definition?.fields || [];
    const fields = allFields.filter((field) => !field.inline && !field.hiddenInParams);
    const hiddenFields = allFields.filter((field) => field.hiddenInParams);
    if (!fields.length && !hiddenFields.length) return "";
    const defaults = getDefaultAbilityParams(item);
    const hiddenHtml = hiddenFields.map((field) => `<input type="hidden" class="enemy-builder-param-input" data-param-key="${escapeHtml(field.key)}" value="${escapeHtml(defaults[field.key])}" />`).join("");
    if (!fields.length) return hiddenHtml;
    return `${hiddenHtml}<details class="enemy-builder-ability-params">
      <summary><i class="fa-solid fa-sliders"></i> 値を本文へ反映</summary>
      <div class="enemy-builder-ability-param-grid">${fields.map((field) => abilityParameterControlHtml(field, defaults)).join("")}</div>
    </details>`;
  }

  function parseAbilityContestTitle(rawTitle) {
    const title = String(rawTitle || "").trim();
    if (!title) return null;
    const slash = title.includes("／") ? "／" : "/";
    const numeric = "[-+−－]?\\d+";
    const normalizeNumber = (value) => String(value || "").replace(/[−－]/g, "-");
    let match = title.match(new RegExp(`^(.*)[／/](${numeric})\\s*[（(]\\s*(${numeric})\\s*[）)]\\s*[／/]([^／/]+)\\s*[／/]([^／/]+)$`));
    if (match) {
      return { name: match[1].trim(), mode: "roll", base: normalizeNumber(match[2]), fixed: normalizeNumber(match[3]), opposition: match[4].trim(), result: match[5].trim(), slash };
    }
    match = title.match(new RegExp(`^(.*)[／/](${numeric})\\s*[／/]([^／/]+)\\s*[／/]([^／/]+)$`));
    if (match) {
      return { name: match[1].trim(), mode: "fixed", base: "", fixed: normalizeNumber(match[2]), opposition: match[3].trim(), result: match[4].trim(), slash };
    }
    match = title.match(/^(.*)[／/](必中|任意)\s*$/u);
    if (match) return { name: match[1].trim(), mode: match[2] === "必中" ? "sure" : "optional", base: "", fixed: "", opposition: "", result: "", slash };
    return null;
  }

  function abilityHasSelectedMarker(row, marker) {
    return !!row?.querySelector(`.enemy-builder-marker-toggle[data-marker="${marker}"][aria-pressed="true"]`);
  }

  function syncAbilityContestEditorAvailability(row) {
    if (!row) return;
    const details = row.querySelector(".enemy-builder-contest-editor");
    if (!details) return;
    const selectedMarkers = Array.from(row.querySelectorAll('.enemy-builder-marker-toggle[aria-pressed="true"]')).map((button) => button.dataset.marker);
    const passiveOnly = selectedMarkers.length > 0 && selectedMarkers.every((marker) => marker === "常");
    const title = row.querySelector(".enemy-builder-ability-title")?.value || "";
    const hasContestHeading = !!parseAbilityContestTitle(title);
    const isCustomMajor = row.dataset.templateId === "custom" && abilityHasSelectedMarker(row, "主");
    const available = !passiveOnly && (hasContestHeading || isCustomMajor);
    details.hidden = !available;
    if (!available) details.open = false;
  }

  function abilityContestEditorHtml(item) {
    const parsed = parseAbilityContestTitle(item ? getTemplateTitle(item) : "");
    const mode = parsed?.mode || "none";
    return `<details class="enemy-builder-contest-editor">
      <summary><i class="fa-solid fa-scale-balanced"></i> 判定・抵抗</summary>
      <div class="enemy-builder-contest-controls">
        <label class="enemy-builder-contest-mode-label"><span>方式</span><select class="enemy-builder-contest-mode" aria-label="判定・抵抗の方式">
          <option value="none"${mode === "none" ? " selected" : ""}>なし</option>
          <option value="roll"${mode === "roll" ? " selected" : ""}>2d判定</option>
          <option value="fixed"${mode === "fixed" ? " selected" : ""}>固定値のみ</option>
          <option value="sure"${mode === "sure" ? " selected" : ""}>必中</option>
          <option value="optional"${mode === "optional" ? " selected" : ""}>任意</option>
        </select></label>
        <label class="enemy-builder-contest-value-label">
          <span class="enemy-builder-contest-value-title">達成値</span>
          <span class="enemy-builder-contest-value-pair">
            <input type="number" class="enemy-builder-contest-base" value="${escapeHtml(parsed?.base || "")}" aria-label="能力の判定基準値" />
            <span class="enemy-builder-contest-paren">（</span>
            <input type="number" class="enemy-builder-contest-fixed" value="${escapeHtml(parsed?.fixed || "")}" aria-label="能力の固定達成値" />
            <span class="enemy-builder-contest-paren">）</span>
          </span>
        </label>
        <label class="enemy-builder-contest-opposition-label"><span>対抗</span><input type="text" class="enemy-builder-contest-opposition" list="enemy-builder-contest-opposition-list" value="${escapeHtml(parsed?.opposition || "")}" aria-label="対抗基準値" /></label>
        <label class="enemy-builder-contest-result-label"><span>結果</span><input type="text" class="enemy-builder-contest-result" list="enemy-builder-contest-result-list" value="${escapeHtml(parsed?.result || "")}" aria-label="対抗結果" /></label>
      </div>
    </details>`;
  }

  function syncAbilityContestVisibility(row) {
    if (!row) return;
    const mode = row.querySelector(".enemy-builder-contest-mode")?.value || "none";
    const roll = mode === "roll";
    const fixedOnly = mode === "fixed";
    const opposed = roll || fixedOnly;
    const valueLabel = row.querySelector(".enemy-builder-contest-value-label");
    const valueTitle = row.querySelector(".enemy-builder-contest-value-title");
    const valuePair = row.querySelector(".enemy-builder-contest-value-pair");
    const oppositionLabel = row.querySelector(".enemy-builder-contest-opposition-label");
    const resultLabel = row.querySelector(".enemy-builder-contest-result-label");
    if (valueLabel) valueLabel.hidden = !opposed;
    if (valueTitle) valueTitle.textContent = fixedOnly ? "固定値" : "達成値";
    if (valuePair) valuePair.classList.toggle("is-fixed-only", fixedOnly);
    if (oppositionLabel) oppositionLabel.hidden = !opposed;
    if (resultLabel) resultLabel.hidden = !opposed;
  }

  function syncAbilityContestFromTitle(row, { open = false } = {}) {
    if (!row) return false;
    const titleInput = row.querySelector(".enemy-builder-ability-title");
    const parsed = parseAbilityContestTitle(titleInput?.value);
    const details = row.querySelector(".enemy-builder-contest-editor");
    if (!parsed) {
      row.dataset.contestBaseTitle = titleInput?.value.trim() || "";
      return false;
    }
    row.dataset.contestBaseTitle = parsed.name;
    row.dataset.contestSeparator = parsed.slash;
    const mode = row.querySelector(".enemy-builder-contest-mode");
    const base = row.querySelector(".enemy-builder-contest-base");
    const fixed = row.querySelector(".enemy-builder-contest-fixed");
    const opposition = row.querySelector(".enemy-builder-contest-opposition");
    const result = row.querySelector(".enemy-builder-contest-result");
    if (mode) mode.value = parsed.mode;
    if (base) base.value = parsed.base;
    if (fixed) fixed.value = parsed.fixed;
    const standardParam = row.querySelector('.enemy-builder-param-input[data-param-key="standard"]');
    if (standardParam && parsed.mode === "roll") standardParam.value = parsed.base;
    if (opposition) opposition.value = parsed.opposition;
    if (result) result.value = parsed.result;
    syncAbilityContestEditorAvailability(row);
    if (details && open && !details.hidden) details.open = true;
    syncAbilityContestVisibility(row);
    return true;
  }

  function updateAbilityContestTitle(row) {
    if (!row) return;
    const titleInput = row.querySelector(".enemy-builder-ability-title");
    const mode = row.querySelector(".enemy-builder-contest-mode")?.value || "none";
    if (!titleInput) return;
    const parsedCurrent = parseAbilityContestTitle(titleInput.value);
    const baseName = (row.dataset.contestBaseTitle || parsedCurrent?.name || titleInput.value).trim();
    row.dataset.contestBaseTitle = baseName;
    const slash = row.dataset.contestSeparator || parsedCurrent?.slash || (titleInput.value.includes("／") ? "／" : "/");
    row.dataset.contestSeparator = slash;
    const baseInput = row.querySelector(".enemy-builder-contest-base");
    const fixedInput = row.querySelector(".enemy-builder-contest-fixed");
    const opposition = row.querySelector(".enemy-builder-contest-opposition")?.value.trim() || "";
    const result = row.querySelector(".enemy-builder-contest-result")?.value.trim() || "";
    if (mode === "none") titleInput.value = baseName;
    else if (mode === "sure") titleInput.value = `${baseName}${slash}必中`;
    else if (mode === "optional") titleInput.value = `${baseName}${slash}任意`;
    else if (mode === "fixed") {
      const fixed = fixedInput?.value ?? "";
      titleInput.value = `${baseName}${slash}${fixed}${opposition ? `${slash}${opposition}` : ""}${result ? `${slash}${result}` : ""}`;
    } else {
      const base = baseInput?.value ?? "";
      const fixed = fixedInput?.value ?? "";
      const valueText = fixed === "" ? base : `${base}（${fixed}）`;
      titleInput.value = `${baseName}${slash}${valueText}${opposition ? `${slash}${opposition}` : ""}${result ? `${slash}${result}` : ""}`;
    }
    syncAbilityContestVisibility(row);
    syncAbilityContestEditorAvailability(row);
    updateOutput();
  }

  function syncAbilityContestPair(row, source) {
    if (!row || (row.querySelector(".enemy-builder-contest-mode")?.value || "none") !== "roll") return;
    const baseInput = row.querySelector(".enemy-builder-contest-base");
    const fixedInput = row.querySelector(".enemy-builder-contest-fixed");
    if (!baseInput || !fixedInput) return;
    if (source === "fixed") baseInput.value = fixedInput.value === "" ? "" : toNumber(fixedInput.value) - 7;
    else fixedInput.value = baseInput.value === "" ? "" : fixedValue(baseInput.value);
    const standardParam = row.querySelector('.enemy-builder-param-input[data-param-key="standard"]');
    if (standardParam) standardParam.value = baseInput.value;
  }

  function abilityUseLimitHtml() {
    return `<details class="enemy-builder-use-limit-editor">
      <summary><i class="fa-regular fa-clock"></i> 使用制限を追記</summary>
      <div class="enemy-builder-use-limit-controls">
        <label><span>制限</span><select class="enemy-builder-use-limit" aria-label="使用制限">
          <option value="">なし</option>
          <option value="consecutive">連続した手番に使用不可</option>
          <option value="after-basic-spellsongs-twice">基本呪歌を2回以上連続した直後のみ</option>
          <option value="interval">Nラウンドに1回</option>
          <option value="battle">戦闘中N回</option>
          <option value="round">1ラウンドにN回</option>
        </select></label>
        <label class="enemy-builder-use-limit-count" hidden><span>回数・間隔</span><input type="number" min="1" value="1" aria-label="使用回数または間隔" /></label>
      </div>
    </details>`;
  }

  function getUseLimitSentence(row) {
    const type = row?.querySelector(".enemy-builder-use-limit")?.value || "";
    const count = Math.max(1, toNumber(row?.querySelector(".enemy-builder-use-limit-count input")?.value, 1));
    if (type === "consecutive") return "この能力は連続した手番には使用できません。";
    if (type === "after-basic-spellsongs-twice") return "この能力は、「▶基本呪歌」を2回以上連続して使用した直後の手番でなければ使用できません。";
    if (type === "interval") return `この能力は${count}ラウンドに1回だけ使用できます。`;
    if (type === "battle") return `この能力は戦闘中に${count}回だけ使用できます。`;
    if (type === "round") return `この能力は1ラウンドに${count}回だけ使用できます。`;
    return "";
  }

  function updateAbilityUseLimit(row) {
    if (!row) return;
    const type = row.querySelector(".enemy-builder-use-limit")?.value || "";
    const countLabel = row.querySelector(".enemy-builder-use-limit-count");
    if (countLabel) countLabel.hidden = !type || type === "consecutive" || type === "after-basic-spellsongs-twice";
    const body = row.querySelector(".enemy-builder-ability-body");
    if (!body) return;
    const previous = row.dataset.useLimitSentence || "";
    if (previous) body.value = body.value.replace(previous, "").trimEnd();
    const next = getUseLimitSentence(row);
    if (next) body.value = `${body.value.trimEnd()}${body.value.trim() ? "\n" : ""}${next}`;
    row.dataset.useLimitSentence = next;
    updateOutput();
  }

  function readAbilityParams(row, item) {
    const defaults = getDefaultAbilityParams(item);
    row.querySelectorAll(".enemy-builder-param-input").forEach((input) => {
      const key = input.dataset.paramKey;
      defaults[key] = input.type === "number" ? toNumber(input.value, defaults[key]) : input.value;
    });
    return defaults;
  }

  function syncAssistDependentParams(row) {
    if (!row) return;
    const selected = new Set(selectedAssistValues(row));
    row.querySelectorAll("[data-visible-when-assist]").forEach((label) => {
      label.hidden = !selected.has(label.dataset.visibleWhenAssist);
    });
  }

  function updateParameterizedAbility(row) {
    const item = abilityTemplates.find((template) => template.id === row?.dataset.templateId);
    if (!row || !item || !abilityParameterDefinitions[item.id]) return;
    const params = readAbilityParams(row, item);
    row.querySelectorAll("[data-visible-when-key]").forEach((label) => {
      label.hidden = params[label.dataset.visibleWhenKey] !== label.dataset.visibleWhenValue;
    });
    row.querySelector(".enemy-builder-ability-title").value = getTemplateTitle(item, params);
    syncAbilityContestFromTitle(row);
    row.querySelector(".enemy-builder-ability-body").value = item.assist ? assistedAbilityBody(row, item, params) : getTemplateBody(item, params);
    syncAssistDependentParams(row);
    updateAbilityUseLimit(row);
  }

  function syncBreathNameFromAttribute(row) {
    if (row?.dataset.templateId !== "breath") return;
    const attributeInput = row.querySelector('.enemy-builder-param-input[data-param-key="attribute"]');
    const nameInput = row.querySelector('.enemy-builder-param-input[data-param-key="breathName"]');
    if (!attributeInput || !nameInput) return;
    const attribute = attributeInput.value.trim();
    nameInput.value = breathNamesByAttribute[attribute]?.[0] || attribute || "ブレス";
  }

  function syncWarCommandMarkersFromSelection(row) {
    if (row?.dataset.templateId !== "war-command") return;
    const values = [
      ["warCries", row.querySelector('.enemy-builder-param-input[data-param-key="warCryName"]')?.value],
      ["formations", row.querySelector('.enemy-builder-param-input[data-param-key="formationName"]')?.value],
    ];
    const markers = new Set();
    values.forEach(([kind, name]) => {
      const selected = monsterArts(kind).find((item) => item?.name === name);
      (selected?.markers || actionMarkers(selected?.action)).forEach((marker) => markers.add(marker));
    });
    if (!markers.size) markers.add("補");
    abilityMarkerOptions.forEach(([marker]) => {
      const button = row.querySelector(`.enemy-builder-marker-toggle[data-marker="${marker}"]`);
      if (button) button.setAttribute("aria-pressed", String(markers.has(marker)));
    });
  }

  function syncFinaleParamsFromName(row) {
    if (row?.dataset.templateId !== "finale") return;
    const nameInput = row.querySelector('.enemy-builder-param-input[data-param-key="finaleName"]');
    const preset = finaleData(nameInput?.value);
    if (!preset) return;
    const setValue = (key, value) => {
      const input = row.querySelector(`.enemy-builder-param-input[data-param-key="${key}"]`);
      if (input && value !== undefined && value !== null && value !== "") input.value = value;
    };
    setValue("targets", preset.targets);
    setValue("effectKind", preset.effectKind);
    setValue("attribute", preset.attribute || "");
    setValue("resistance", preset.resistance === "半減" ? "精神抵抗力／半減" : "なし");
  }

  function abilityEditorHtml(item) {
    return `${buildAbilityAssistHtml(item)}${abilityParameterHtml(item)}${abilityContestEditorHtml(item)}${abilityUseLimitHtml()}
      <textarea class="enemy-builder-ability-body" rows="3" aria-label="能力本文" placeholder="${escapeHtml(item.body || "効果、対象、時間、抵抗、制限を入力")}">${escapeHtml(getTemplateBody(item))}</textarea>`;
  }

  function applyAbilityTemplate(row, item) {
    if (!row || !item) return;
    row.dataset.templateId = item.id;
    row.dataset.useLimitSentence = "";
    const markers = item.markers || [item.marker];
    row.querySelectorAll(".enemy-builder-marker-toggle").forEach((button) => button.setAttribute("aria-pressed", String(markers.includes(button.dataset.marker))));
    row.querySelector(".enemy-builder-ability-title").value = getTemplateTitle(item);
    row.querySelector(".enemy-builder-ability-inline-params").innerHTML = abilityInlineParameterControlsHtml(item);
    row.querySelector(".enemy-builder-ability-editor").innerHTML = abilityEditorHtml(item);
    syncAbilityContestFromTitle(row);
    syncAbilityContestEditorAvailability(row);
    if (item.id === "war-command") syncWarCommandMarkersFromSelection(row);
    updateOutput();
  }

  function addAbility(template = null) {
    const item = template || { id: "custom", category: "passive", marker: "常", name: "", body: "能力本文を自由に入力" };
    abilityCounter += 1;
    const row = document.createElement("article");
    row.className = "enemy-builder-ability-row";
    row.dataset.templateId = item.id;
    row.innerHTML = `
      <div class="enemy-builder-ability-name-field">
        <div class="enemy-builder-ability-name-switch" role="group" aria-label="能力候補と名前を切り替え">
          <button type="button" data-ability-name-mode="candidate" aria-pressed="true" aria-controls="enemy-builder-ability-candidate-${abilityCounter}">候補</button>
          <button type="button" data-ability-name-mode="name" aria-pressed="false" aria-controls="enemy-builder-ability-name-${abilityCounter}">名前</button>
        </div>
        <div class="enemy-builder-ability-name-controls">
          <select id="enemy-builder-ability-candidate-${abilityCounter}" class="enemy-builder-ability-template enemy-builder-symbol-select" aria-label="能力候補">
          <option value="">候補から選択、または直接入力</option>${abilityTemplateOptions(template?.id || "")}
          </select>
          <div id="enemy-builder-ability-name-${abilityCounter}" class="enemy-builder-ability-name-input" hidden>
            <div class="enemy-builder-ability-markers" role="group" aria-label="能力分類">${abilityMarkerButtons(item.markers || [item.marker])}</div>
            <input type="text" class="enemy-builder-ability-title" value="${escapeHtml(template ? getTemplateTitle(item) : "")}" placeholder="能力名を直接入力" aria-label="能力名" />
          </div>
        </div>
        <div class="enemy-builder-ability-inline-params">${abilityInlineParameterControlsHtml(item)}</div>
        <div class="enemy-builder-ability-order-actions">
          <button type="button" class="enemy-builder-move-ability" data-direction="up" aria-label="能力を上へ移動" title="上へ移動"><i class="fa-solid fa-chevron-up"></i></button>
          <button type="button" class="enemy-builder-move-ability" data-direction="down" aria-label="能力を下へ移動" title="下へ移動"><i class="fa-solid fa-chevron-down"></i></button>
          <button type="button" class="enemy-builder-remove-ability" aria-label="能力を削除" title="削除"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
      <div class="enemy-builder-ability-row-head">
        <label class="enemy-builder-ability-part-field"><span>適用部位</span><select class="enemy-builder-ability-part" aria-label="適用部位">${abilityPartOptions()}</select></label>
      </div>
      <div class="enemy-builder-ability-editor">${abilityEditorHtml(item)}</div>`;
    fields.abilities.appendChild(row);
    syncAbilityContestFromTitle(row);
    syncAbilityContestVisibility(row);
    syncAbilityContestEditorAvailability(row);
    syncAbilityPartOptions();
    updateAbilityOrderButtons();
    updateOutput();
    return row;
  }

  function setAbilityNameMode(row, mode, { focus = true } = {}) {
    if (!row) return;
    const candidateMode = mode !== "name";
    row.querySelectorAll("[data-ability-name-mode]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.abilityNameMode === (candidateMode ? "candidate" : "name")));
    });
    row.querySelector(".enemy-builder-ability-template").hidden = !candidateMode;
    row.querySelector(".enemy-builder-ability-name-input").hidden = candidateMode;
    if (!candidateMode && focus) row.querySelector(".enemy-builder-ability-title").focus();
  }

  function readAbilities() {
    return Array.from(fields.abilities.querySelectorAll(".enemy-builder-ability-row")).map((row) => {
      const selectedMarkers = Array.from(row.querySelectorAll('.enemy-builder-marker-toggle[aria-pressed="true"]')).map((button) => button.dataset.marker);
      const heading = normalizeAbilityHeading(row.querySelector(".enemy-builder-ability-title").value, selectedMarkers);
      const partKey = row.querySelector(".enemy-builder-ability-part").value || "全身";
      const part = abilityPartChoices().find((choice) => choice.value === partKey) || abilityPartChoices()[0];
      const item = { partKey: part.value, part: part.heading, markers: heading.markers, title: heading.title, body: row.querySelector(".enemy-builder-ability-body").value.trim() };
      if (row.dataset.templateId === "immunity") {
        const params = readAbilityParams(row, abilityTemplates.find((template) => template.id === "immunity"));
        if (params.treatment === "無効") {
          const attributes = String(params.attributes || "").split(/[、,，/／]+/u).map((value) => value.trim()).filter(Boolean);
          if (attributes.length) {
            item.inlineEntries = attributes.map((attribute) => ({ markers: heading.markers, title: `${attribute}無効` }));
            item.title = item.inlineEntries.map((entry) => entry.title).join("、");
            item.body = "";
          }
        }
      }
      return item;
    }).filter((item) => item.title || item.inlineEntries?.length);
  }

  function abilityText(item) {
    if (item.inlineEntries?.length) return item.inlineEntries.map((entry) => `${entry.markers.map((marker) => `[${marker}]`).join("")}${entry.title}`).join("、");
    return `${item.markers.map((marker) => `[${marker}]`).join("")}${item.title}${item.body ? `\n${item.body}` : ""}`;
  }

  const abilityMarkerText = { 常: "○", 準: "△", 主: "▶", 補: "≫", 宣: "💬" };

  function plainAbilityMarker(markers = []) {
    return [...new Set(markers)].map((marker) => abilityMarkerText[marker] || `[${marker}]`).join("");
  }

  function appendDisclosureAbility(lines, item) {
    if (item.inlineEntries?.length) {
      item.inlineEntries.forEach((entry) => lines.push(`${plainAbilityMarker(entry.markers)}${entry.title}`));
      return;
    }
    lines.push(`${plainAbilityMarker(item.markers)}${item.title}`);
    if (item.body) lines.push(item.body);
  }

  function buildAbilityDisclosureText() {
    const abilities = readAbilities();
    const lines = ["特殊能力"];
    if (!abilities.length) return lines.join("\n");
    if (readParts().length <= 1) {
      abilities.forEach((item) => appendDisclosureAbility(lines, item));
      return lines.join("\n");
    }
    abilityPartChoices().forEach((part) => {
      const items = abilities.filter((item) => item.partKey === part.value);
      if (!items.length) return;
      if (part.value !== "全身") lines.push(`●${part.heading}`);
      items.forEach((item) => appendDisclosureAbility(lines, item));
    });
    return lines.join("\n");
  }

  function buildSkillText() {
    const abilities = readAbilities();
    if (readParts().length <= 1) return abilities.map(abilityText).join("\n");
    return abilityPartChoices().map((part) => {
      const items = abilities.filter((item) => item.partKey === part.value);
      if (!items.length) return "";
      const text = items.map(abilityText).join("\n");
      return part.value === "全身" ? text : `●${part.heading}\n${text}`;
    }).filter(Boolean).join("\n");
  }

  const previewMarkerClasses = { 部位: "part", 常: "passive", 準: "setup", 主: "major", 補: "minor", 宣: "active" };

  function createPreviewIcon(marker, label = marker) {
    const icon = document.createElement("i");
    icon.className = `s-icon ${previewMarkerClasses[marker] || "passive"}`;
    icon.setAttribute("aria-label", label);
    const raw = document.createElement("span");
    raw.className = "raw";
    raw.textContent = marker === "部位" ? "●" : `[${marker}]`;
    icon.appendChild(raw);
    return icon;
  }

  function updateAbilityPreview() {
    if (!fields.abilityPreview) return;
    const abilities = readAbilities();
    fields.abilityPreview.replaceChildren();
    if (!abilities.length) {
      const empty = document.createElement("p");
      empty.className = "enemy-builder-ability-preview-empty";
      empty.textContent = "特殊能力はまだ入力されていません。";
      fields.abilityPreview.appendChild(empty);
      return;
    }

    const hasMultipleParts = readParts().length > 1;
    const groups = hasMultipleParts
      ? abilityPartChoices().map((part) => ({ part, items: abilities.filter((ability) => ability.partKey === part.value) })).filter((group) => group.items.length)
      : [{ part: null, items: abilities }];

    groups.forEach(({ part, items }) => {
      const group = document.createElement("section");
      group.className = "enemy-builder-ability-preview-group";
      if (part && part.value !== "全身") {
        const partHeading = document.createElement("h5");
        partHeading.append(createPreviewIcon("部位", "部位見出し"), document.createTextNode(part.heading));
        group.appendChild(partHeading);
      }

      items.forEach((ability) => {
        const entry = document.createElement("article");
        entry.className = "enemy-builder-ability-preview-entry";
        const heading = document.createElement("div");
        heading.className = "enemy-builder-ability-preview-title";
        if (ability.inlineEntries?.length) {
          ability.inlineEntries.forEach((inlineEntry, index) => {
            if (index) heading.appendChild(document.createTextNode("、"));
            const markers = document.createElement("span");
            markers.className = "enemy-builder-ability-preview-markers";
            inlineEntry.markers.forEach((marker) => markers.appendChild(createPreviewIcon(marker)));
            const title = document.createElement("strong");
            title.textContent = inlineEntry.title;
            heading.append(markers, title);
          });
        } else {
          const markers = document.createElement("span");
          markers.className = "enemy-builder-ability-preview-markers";
          ability.markers.forEach((marker) => markers.appendChild(createPreviewIcon(marker)));
          const title = document.createElement("strong");
          title.textContent = ability.title;
          heading.append(markers, title);
        }
        entry.appendChild(heading);
        if (ability.body) {
          const body = document.createElement("p");
          body.textContent = ability.body;
          entry.appendChild(body);
        }
        group.appendChild(entry);
      });
      fields.abilityPreview.appendChild(group);
    });
  }

  function updateAbilityOrderButtons() {
    const rows = Array.from(fields.abilities.querySelectorAll(".enemy-builder-ability-row"));
    rows.forEach((row, index) => {
      const up = row.querySelector('.enemy-builder-move-ability[data-direction="up"]');
      const down = row.querySelector('.enemy-builder-move-ability[data-direction="down"]');
      if (up) up.disabled = index === 0;
      if (down) down.disabled = index === rows.length - 1;
    });
  }

  function parseLoot() {
    return Array.from(fields.loot.querySelectorAll(".enemy-builder-loot-row")).map((row) => ({
      num: row.querySelector(".enemy-builder-loot-num").value.trim(),
      item: row.querySelector(".enemy-builder-loot-item").value.trim(),
    })).filter((item) => item.num || item.item);
  }

  function buildYutoJson() {
    const level = Math.max(1, toNumber(fields.level.value, 1));
    const parts = readParts();
    const loot = parseLoot();
    const knownTaxa = ["未分類", "蛮族", "動物", "植物", "アンデッド", "魔法生物", "魔動機", "幻獣", "妖精", "魔神", "人族", "神族", "その他"];
    const enteredTaxa = fields.taxa.value.trim() || "未分類";
    const data = {
      gameVersion: "2.5", type: "m", monsterName: fields.name.value.trim() || "名称未設定", characterName: "", level: String(level),
      taxa: knownTaxa.includes(enteredTaxa) ? enteredTaxa : "その他", taxaFree: knownTaxa.includes(enteredTaxa) ? "" : enteredTaxa,
      intellect: fields.intelligence.value.trim(), perception: fields.perception.value.trim(),
      disposition: fields.reaction.value.trim(), language: fields.language.value.trim(), habitat: fields.habitat.value.trim(),
      reputation: fields.reputation.value, "reputation+": fields.weaknessValue.value, weakness: fields.weakness.value.trim(),
      initiative: fields.initiative.value, mobility: fields.mobility.value.trim(), vitResist: fields.vitResist.value,
      vitResistFix: fields.vitResistFix.value, mndResist: fields.mndResist.value,
      mndResistFix: fields.mndResistFix.value, statusNum: String(parts.length), partsNum: String(Math.max(1, toNumber(fields.partsTotal.value, parts.length))),
      parts: fields.partsBreakdown.value.trim(),
      coreParts: fields.coreParts.value.trim(), skills: buildSkillText(),
      sheetDescriptionM: fields.description.value.trim(), description: fields.description.value.trim(),
      lootsNum: String(loot.length),
    };
    parts.forEach((part, index) => {
      const key = `status${index + 1}`;
      data[`${key}Style`] = part.style; data[`${key}Accuracy`] = part.accuracy;
      data[`${key}AccuracyFix`] = part.accuracyFix; data[`${key}Damage`] = part.damage;
      data[`${key}Evasion`] = part.evasion; data[`${key}EvasionFix`] = part.evasionFix;
      data[`${key}Defense`] = part.defense; data[`${key}Hp`] = part.hp; data[`${key}Mp`] = part.mp;
    });
    loot.forEach((item, index) => { data[`loots${index + 1}Num`] = item.num; data[`loots${index + 1}Item`] = item.item; });
    return data;
  }

  function cocofoliaPartLabel(part, index, total) {
    const style = String(part?.style || "").trim();
    const partMatch = style.match(/[（(]([^()（）]+)[）)]\s*$/);
    if (partMatch?.[1]) return partMatch[1].trim();
    if (total > 1) return style || `部位${index + 1}`;
    return "";
  }

  function buildCcfoliaMemo(yuto, parts) {
    const taxaLabel = yuto.taxa === "その他" && yuto.taxaFree ? yuto.taxaFree : yuto.taxa;
    const profileLine = [
      taxaLabel && `分類:${taxaLabel}`,
      yuto.intellect && `知能:${yuto.intellect}`,
      yuto.perception && `知覚:${yuto.perception}`,
      yuto.disposition && `反応:${yuto.disposition}`,
    ].filter(Boolean).join("　");
    const localeLine = [
      yuto.language && `言語:${yuto.language}`,
      yuto.habitat && `生息地:${yuto.habitat}`,
    ].filter(Boolean).join("　");
    const resistLine = [
      yuto.initiative !== "" && `先制値:${yuto.initiative}`,
      yuto.vitResist !== "" && `生命抵抗力:${yuto.vitResist}${yuto.vitResistFix !== "" ? ` (${yuto.vitResistFix})` : ""}`,
      yuto.mndResist !== "" && `精神抵抗力:${yuto.mndResist}${yuto.mndResistFix !== "" ? ` (${yuto.mndResistFix})` : ""}`,
    ].filter(Boolean).join("　");
    const defenseItems = parts
      .filter((part) => String(part.defense ?? "").trim() !== "")
      .map((part, index) => {
        const label = cocofoliaPartLabel(part, index, parts.length);
        return `${label}${part.defense}`;
      });
    const defenseLine = defenseItems.length ? `防護:${defenseItems.join("／")}` : "";
    const weaknessLine = yuto.weakness ? `弱点:${yuto.weakness}` : "";
    return [yuto.monsterName, profileLine, localeLine, resistLine, defenseLine, weaknessLine].filter(Boolean).join("\n");
  }

  function diceWithModifier(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    if (/^[+-]/.test(raw)) return `2d${raw}`;
    return `2d+${raw}`;
  }

  function abilityCommandLines() {
    const blocks = [];
    readAbilities().forEach((ability) => {
      if (ability.inlineEntries?.length) return;
      const parsed = parseAbilityContestTitle(ability.title);
      const hasActionMarker = ability.markers.some((marker) => marker !== "常");
      if (!parsed && !hasActionMarker) return;
      const marker = plainAbilityMarker(ability.markers);
      if (!parsed) {
        blocks.push([`${marker}${ability.title}`]);
        return;
      }
      const baseTitle = `${marker}${parsed.name}`;
      if (parsed.mode === "sure" || parsed.mode === "optional") {
        blocks.push([`${baseTitle}／${parsed.mode === "sure" ? "必中" : "任意"}`]);
        return;
      }
      const suffix = `${parsed.opposition ? `／${parsed.opposition}` : ""}${parsed.result ? `／${parsed.result}` : ""}`;
      if (parsed.mode === "fixed") {
        if (parsed.fixed !== "") blocks.push([`固定値：${parsed.fixed}　${baseTitle}${suffix}`]);
        return;
      }
      const block = [];
      if (parsed.fixed !== "") block.push(`固定値：${parsed.fixed}　${baseTitle}${suffix}`);
      if (parsed.base !== "") block.push(`${diceWithModifier(parsed.base)} ${baseTitle}${suffix}`);
      if (block.length) blocks.push(block);
    });
    return blocks.flatMap((block, index) => index ? ["", ...block] : block);
  }

  function buildCcfoliaJson() {
    const yuto = buildYutoJson();
    const parts = readParts();
    const abilityCommands = abilityCommandLines();
    const commandLines = [
      yuto.vitResist !== "" ? `${diceWithModifier(yuto.vitResist)} 生命抵抗力` : "",
      yuto.mndResist !== "" ? `${diceWithModifier(yuto.mndResist)} 精神抵抗力` : "",
      ...parts.flatMap((part, index) => {
        const label = cocofoliaPartLabel(part, index, parts.length);
        const suffix = label ? `／${label}` : "";
        return [
          part.accuracy !== "" ? `${diceWithModifier(part.accuracy)} 命中力${suffix}` : "",
          part.damage ? `${part.damage} 打撃点${suffix}` : "",
          part.evasion !== "" ? `${diceWithModifier(part.evasion)} 回避力${suffix}` : "",
        ];
      }),
      ...(abilityCommands.length ? ["", ...abilityCommands] : []),
    ];
    const compactCommandLines = commandLines.reduce((lines, line) => {
      if (line === "" && (!lines.length || lines[lines.length - 1] === "")) return lines;
      lines.push(line);
      return lines;
    }, []);
    while (compactCommandLines[compactCommandLines.length - 1] === "") compactCommandLines.pop();
    return {
      kind: "character",
      data: {
        name: yuto.monsterName, memo: buildCcfoliaMemo(yuto, parts),
        initiative: toNumber(fields.initiative.value, 0), externalUrl: "", iconUrl: "", faces: [], x: 0, y: 0, z: 0,
        angle: 0, width: 4, height: 4, active: true, secret: false, invisible: false, hideStatus: false,
        color: "#888888", commands: compactCommandLines.join("\n"),
        status: parts.flatMap((part, index) => {
          const label = cocofoliaPartLabel(part, index, parts.length);
          const hpLabel = parts.length === 1 ? "HP" : `${label || `部位${index + 1}`}:HP`;
          const mpLabel = parts.length === 1 ? "MP" : `${label || `部位${index + 1}`}:MP`;
          return [
            { label: hpLabel, value: toNumber(part.hp), max: toNumber(part.hp) },
            { label: mpLabel, value: toNumber(part.mp), max: toNumber(part.mp) },
          ];
        }),
        params: [{ label: "LV", value: String(yuto.level) }, { label: "生命抵抗", value: yuto.vitResist }, { label: "精神抵抗", value: yuto.mndResist }, ...(toNumber(yuto.partsNum, 1) > 1 ? [{ label: "部位数", value: yuto.partsNum }] : [])],
      },
    };
  }

  function updateOutput() {
    updateAbilityPreview();
    const format = fields.outputFormat.value;
    fields.output.value = JSON.stringify(format === "ccfolia" ? buildCcfoliaJson() : buildYutoJson(), null, 2);

    const labels = {
      yuto: {
        note: "JSONをコピーまたは保存し、ゆとシートの「別のデータを開く」から読み込んでください。保存前に内容を確認してください。",
        copy: "ゆとシートJSONをコピー", download: "ゆとシートJSONを保存",
      },
      ccfolia: {
        note: "コピー後、ココフォリアの盤面で貼り付けるとコマを作成できます。",
        copy: "ココフォリア用コマをコピー", download: "コマJSONを保存",
      },
    }[format] || {
      note: "JSONをコピーまたは保存してください。",
      copy: "JSONをコピー", download: "JSONを保存",
    };
    fields.outputNote.textContent = labels.note;
    fields.copyLabel.textContent = labels.copy;
    fields.downloadLabel.textContent = labels.download;
  }

  function showLocalNotice(message) {
    const toast = document.getElementById("result-message");
    if (!toast) return;
    toast.textContent = message; toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2500);
  }

  function setEnemyBuilderImportStatus(message = "") {
    if (fields.importStatus) fields.importStatus.textContent = message;
  }

  function normalizeImportedText(value) {
    const utility = window.sw25EnemyImportUtils?.cleanYutorizeText;
    if (typeof utility === "function") return utility(value);
    return String(value ?? "")
      .replace(/&lt;br\s*\/?&gt;/gi, "\n")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function isYutorizeEnemyImport(value) {
    const checker = window.sw25EnemyImportUtils?.isYutorizeEnemyJson;
    if (typeof checker === "function") return checker(value);
    return !!value && typeof value === "object" && value.gameVersion === "2.5" && !value.kind
      && Boolean(value.monsterName || value.characterName || value.taxa || value.status1Hp || value.sheetURL);
  }

  function isCocofoliaEnemyImport(value) {
    return !!value && value.kind === "character" && value.data && typeof value.data === "object";
  }

  function importedValue(value) {
    return value === null || value === undefined ? "" : String(value).trim();
  }

  function setImportedField(input, value) {
    if (!input) return;
    input.value = importedValue(value);
  }

  function importedPartCount(source) {
    const declared = Math.max(0, toNumber(source?.statusNum || source?.partsNum, 0));
    let detected = 0;
    for (let index = 1; index <= 20; index += 1) {
      if (["Style", "Accuracy", "Damage", "Evasion", "Defense", "Hp", "Mp"].some((suffix) => importedValue(source?.[`status${index}${suffix}`]))) detected = index;
    }
    return Math.max(1, declared, detected);
  }

  function resetImportedRows() {
    enemySuggestedValues.clear();
    removeAutoRaceAbilities();
    fields.parts.innerHTML = "";
    fields.abilities.innerHTML = "";
    fields.loot.innerHTML = "";
    fields.splitDuplicateParts.checked = false;
  }

  function abilityPartKeyFromImport(partName) {
    const normalized = String(partName || "").normalize("NFKC").replace(/[\s　]+/g, "").trim();
    if (!normalized || normalized === "全身") return "全身";
    const choices = abilityPartChoices();
    const exact = choices.find((choice) => [choice.sourceName, choice.heading, choice.label]
      .some((value) => String(value || "").normalize("NFKC").replace(/[\s　]+/g, "") === normalized));
    if (exact) return exact.value;
    const partial = choices.find((choice) => {
      const source = String(choice.sourceName || choice.heading || "").normalize("NFKC").replace(/[\s　]+/g, "");
      return source && (source.includes(normalized) || normalized.includes(source));
    });
    return partial?.value || "全身";
  }

  function addImportedAbility({ markers = ["常"], title = "", body = "", part = "全身" } = {}) {
    if (!title && !body) return null;
    const row = addAbility();
    row.dataset.templateId = "custom";
    setAbilityNameMode(row, "name", { focus: false });
    row.querySelectorAll(".enemy-builder-marker-toggle").forEach((button) => {
      button.setAttribute("aria-pressed", String(markers.includes(button.dataset.marker)));
    });
    row.querySelector(".enemy-builder-ability-title").value = title;
    row.querySelector(".enemy-builder-ability-body").value = body;
    syncAbilityContestFromTitle(row, { open: true });
    syncAbilityContestEditorAvailability(row);
    const partSelect = row.querySelector(".enemy-builder-ability-part");
    if (partSelect) partSelect.value = abilityPartKeyFromImport(part);
    return row;
  }

  function parseImportedAbilityText(rawText, { headingsOnly = false } = {}) {
    const text = normalizeImportedText(rawText);
    if (!text) return [];
    const rows = [];
    let part = "全身";
    let current = null;
    const flush = () => {
      if (!current) return;
      current.body = current.bodyLines.join("\n").trim();
      delete current.bodyLines;
      rows.push(current);
      current = null;
    };
    const markerPatterns = [
      { marker: "常", pattern: /^(?:\[常\]|○|◯|〇)\s*/u },
      { marker: "準", pattern: /^(?:\[準\]|△)\s*/u },
      { marker: "主", pattern: /^(?:\[主\]|▶|＞|〆|>)\s*/u },
      { marker: "補", pattern: /^(?:\[補\]|≫|>>|☆)\s*/u },
      { marker: "宣", pattern: /^(?:\[宣\]|🗨|💬|□|☑)\s*/u },
    ];
    text.split("\n").map((line) => line.trim()).forEach((line) => {
      if (!line) {
        if (current && !headingsOnly && current.bodyLines.length && current.bodyLines[current.bodyLines.length - 1] !== "") current.bodyLines.push("");
        return;
      }
      const partMatch = line.match(/^●\s*(.+)$/u);
      if (partMatch) {
        flush();
        part = partMatch[1].trim() || "全身";
        return;
      }
      let source = line;
      const markers = [];
      let matched = markerPatterns.find((item) => item.pattern.test(source));
      while (matched) {
        markers.push(matched.marker);
        source = source.replace(matched.pattern, "").trim();
        matched = markerPatterns.find((item) => item.pattern.test(source));
      }
      if (markers.length) {
        flush();
        current = { markers: [...new Set(markers)], title: source, bodyLines: [], part };
        return;
      }
      if (current && !headingsOnly) current.bodyLines.push(line);
    });
    flush();
    return rows;
  }

  function applyImportedAbilityRows(rows) {
    fields.abilities.innerHTML = "";
    rows.forEach(addImportedAbility);
    if (!fields.abilities.children.length) addAbility();
    updateAbilityOrderButtons();
  }

  function applyYutorizeEnemyImport(source) {
    resetImportedRows();
    setImportedField(fields.level, source.lv ?? source.level);
    setImportedField(fields.name, source.characterName || source.monsterName);
    setImportedField(fields.taxa, source.taxaFree || source.taxa);
    setImportedField(fields.intelligence, source.intellect);
    setImportedField(fields.perception, source.perception);
    setImportedField(fields.reaction, source.disposition);
    setImportedField(fields.language, normalizeImportedText(source.language).replace(/\n/g, "、"));
    setImportedField(fields.habitat, normalizeImportedText(source.habitat).replace(/\n/g, "、"));
    setImportedField(fields.reputation, source.reputation);
    setImportedField(fields.weaknessValue, source["reputation+"]);
    setImportedField(fields.weakness, normalizeImportedText(source.weakness));
    setImportedField(fields.initiative, source.initiative);
    setImportedField(fields.mobility, normalizeImportedText(source.mobility));
    setImportedField(fields.vitResist, source.vitResist);
    setImportedField(fields.vitResistFix, source.vitResistFix);
    setImportedField(fields.mndResist, source.mndResist);
    setImportedField(fields.mndResistFix, source.mndResistFix);
    setImportedField(fields.coreParts, source.coreParts);
    setImportedField(fields.description, normalizeImportedText(source.description));

    const partCount = importedPartCount(source);
    for (let index = 1; index <= partCount; index += 1) {
      fields.parts.appendChild(partRow({
        style: normalizeImportedText(source[`status${index}Style`]),
        accuracy: importedValue(source[`status${index}Accuracy`]),
        accuracyFix: importedValue(source[`status${index}AccuracyFix`]),
        damage: normalizeImportedText(source[`status${index}Damage`]),
        evasion: importedValue(source[`status${index}Evasion`]),
        evasionFix: importedValue(source[`status${index}EvasionFix`]),
        defense: importedValue(source[`status${index}Defense`]),
        hp: importedValue(source[`status${index}Hp`]),
        mp: importedValue(source[`status${index}Mp`]),
      }));
    }
    fields.partCount.value = partCount;
    fields.partsManual.checked = false;
    syncPartsSummary();
    if (source.parts && !fields.partsBreakdown.value.trim()) fields.partsBreakdown.value = normalizeImportedText(source.parts);
    if (source.partsNum && !fields.partsTotal.value) fields.partsTotal.value = importedValue(source.partsNum);

    const abilityRows = parseImportedAbilityText(source.skills);
    applyImportedAbilityRows(abilityRows);

    const lootCount = Math.max(0, toNumber(source.lootsNum, 0));
    for (let index = 1; index <= lootCount; index += 1) {
      const num = importedValue(source[`loots${index}Num`]);
      const item = normalizeImportedText(source[`loots${index}Item`]);
      if (num || item) fields.loot.appendChild(lootRow({ num, item }));
    }
    if (!fields.loot.children.length) fields.loot.appendChild(lootRow());

    syncRaceFeatureUi({ apply: false });
    updateCorePartsList();
    syncAbilityPartOptions();
    updateOutput();
    return { kind: "yutorize", abilities: abilityRows.length, parts: partCount };
  }

  function cocofoliaParamMap(data) {
    return new Map((Array.isArray(data?.params) ? data.params : []).map((row) => [String(row?.label || "").trim(), importedValue(row?.value)]));
  }

  function cocofoliaMemoValue(memo, pattern) {
    const match = String(memo || "").match(pattern);
    return match ? importedValue(match[1]) : "";
  }

  function cocofoliaResist(memo, label) {
    const pattern = new RegExp(`${label}(?:力)?[:：]\\s*(-?\\d+)(?:\\s*[（(]\\s*(-?\\d+)\\s*[）)])?`);
    const match = String(memo || "").match(pattern);
    return match ? { base: importedValue(match[1]), fixed: importedValue(match[2]) } : { base: "", fixed: "" };
  }

  function cocofoliaDefenseMap(memo) {
    const line = cocofoliaMemoValue(memo, /防護[:：]\s*([^\n]+)/);
    const result = new Map();
    line.split(/[／/]/).map((item) => item.trim()).filter(Boolean).forEach((item) => {
      const match = item.match(/^(.*?)[：:]?\s*(-?\d+)\s*$/);
      if (match) result.set(match[1].trim(), match[2]);
    });
    return result;
  }

  function cocofoliaStatusParts(data) {
    const parts = [];
    const byName = new Map();
    const ensure = (name, indexHint = -1) => {
      const key = name || `部位${indexHint + 1}`;
      if (!byName.has(key)) {
        const row = { name: key, hp: "", mp: "" };
        byName.set(key, row);
        parts.push(row);
      }
      return byName.get(key);
    };
    (Array.isArray(data?.status) ? data.status : []).forEach((status, statusIndex) => {
      const label = String(status?.label || "").trim();
      let match = label.match(/^(.+?)[：:]\s*(HP|MP)$/i);
      if (match) {
        const row = ensure(match[1].trim());
        row[match[2].toLowerCase()] = importedValue(status.max || status.value);
        return;
      }
      match = label.match(/^(HP|MP)(\d+)?$/i);
      if (match) {
        const index = Math.max(0, toNumber(match[2], 1) - 1);
        while (parts.length <= index) ensure(`部位${parts.length + 1}`, parts.length);
        parts[index][match[1].toLowerCase()] = importedValue(status.max || status.value);
        return;
      }
      if (/HP|MP/i.test(label)) ensure(`部位${statusIndex + 1}`, statusIndex);
    });
    return parts;
  }

  function extractCocofoliaCommandInfo(commands) {
    const text = String(commands || "");
    const styles = new Map();
    const damage = new Map();
    Array.from(text.matchAll(/^\/\/部位(\d+)=(.+)$/gm)).forEach((match) => styles.set(toNumber(match[1]), match[2].trim()));
    Array.from(text.matchAll(/^\/\/ダメージ(\d+)=(.+)$/gm)).forEach((match) => damage.set(toNumber(match[1]), match[2].trim()));
    return { styles, damage };
  }

  function partNameFromStyle(style) {
    const text = String(style || "").trim();
    const match = text.match(/.*[（(](.+?)[）)]$/);
    return match ? match[1].trim() : text;
  }

  function applyCocofoliaEnemyImport(source) {
    const data = source.data || {};
    resetImportedRows();
    const params = cocofoliaParamMap(data);
    const memo = normalizeImportedText(data.memo);
    const vitMemo = cocofoliaResist(memo, "生命抵抗");
    const mndMemo = cocofoliaResist(memo, "精神抵抗");
    const initiativeMemo = cocofoliaMemoValue(memo, /先制値[:：]\s*(-?\d+)/);

    setImportedField(fields.name, data.name);
    setImportedField(fields.level, params.get("LV") || params.get("レベル"));
    setImportedField(fields.taxa, cocofoliaMemoValue(memo, /分類[:：]\s*([^\s　\n]+)/));
    setImportedField(fields.intelligence, cocofoliaMemoValue(memo, /知能[:：]\s*([^\s　\n]+)/));
    setImportedField(fields.perception, cocofoliaMemoValue(memo, /知覚[:：]\s*([^\s　\n]+)/));
    setImportedField(fields.reaction, cocofoliaMemoValue(memo, /反応[:：]\s*([^\s　\n]+)/));
    setImportedField(fields.language, cocofoliaMemoValue(memo, /言語[:：]\s*(.+?)(?=\s+生息地[:：]|\n|$)/));
    setImportedField(fields.habitat, cocofoliaMemoValue(memo, /生息地[:：]\s*(.+?)(?=\n|$)/));
    setImportedField(fields.weakness, cocofoliaMemoValue(memo, /弱点[:：]\s*([^\n]+)/));
    setImportedField(fields.initiative, initiativeMemo || (toNumber(data.initiative, 0) ? data.initiative : ""));
    setImportedField(fields.vitResist, params.get("生命抵抗") || vitMemo.base);
    setImportedField(fields.vitResistFix, vitMemo.fixed || (fields.vitResist.value ? fixedValue(fields.vitResist.value) : ""));
    setImportedField(fields.mndResist, params.get("精神抵抗") || mndMemo.base);
    setImportedField(fields.mndResistFix, mndMemo.fixed || (fields.mndResist.value ? fixedValue(fields.mndResist.value) : ""));
    setImportedField(fields.reputation, cocofoliaMemoValue(memo, /知名度[:：]\s*(-?\d+)/));
    setImportedField(fields.weaknessValue, cocofoliaMemoValue(memo, /弱点値[:：]\s*(-?\d+)/));
    setImportedField(fields.mobility, cocofoliaMemoValue(memo, /移動(?:速度)?[:：]\s*([^\n]+)/));
    setImportedField(fields.coreParts, cocofoliaMemoValue(memo, /コア部位[:：]\s*([^\n]+)/));
    setImportedField(fields.description, "");

    const statusParts = cocofoliaStatusParts(data);
    const commandInfo = extractCocofoliaCommandInfo(data.commands);
    const defenseMap = cocofoliaDefenseMap(memo);
    let indexedCount = Math.max(statusParts.length, commandInfo.styles.size, commandInfo.damage.size);
    for (const label of params.keys()) {
      const match = label.match(/^(?:命中|回避)(\d+)$/);
      if (match) indexedCount = Math.max(indexedCount, toNumber(match[1]));
    }
    indexedCount = Math.max(1, indexedCount);
    for (let index = 1; index <= indexedCount; index += 1) {
      const statusPart = statusParts[index - 1] || {};
      const style = commandInfo.styles.get(index) || statusPart.name || `部位${index}`;
      const partName = partNameFromStyle(style);
      fields.parts.appendChild(partRow({
        style,
        accuracy: params.get(`命中${index}`) || "",
        damage: commandInfo.damage.get(index) || "",
        evasion: params.get(`回避${index}`) || "",
        defense: defenseMap.get(partName) || defenseMap.get(statusPart.name) || "",
        hp: statusPart.hp || "",
        mp: statusPart.mp || "",
      }));
    }
    fields.partCount.value = indexedCount;
    fields.partsManual.checked = false;
    syncPartsSummary();

    const fullSkillTextMatch = memo.match(/###\s*特殊能力\s*\n([\s\S]*)$/);
    const hasFullSkillText = Boolean(fullSkillTextMatch);
    const abilityRows = fullSkillTextMatch
      ? parseImportedAbilityText(fullSkillTextMatch[1])
      : parseImportedAbilityText(String(data.commands || "").split("\n").filter((line) => /^(?:\[常\]|\[準\]|\[主\]|\[補\]|\[宣\]|○|◯|〇|△|▶|＞|>|≫|>>|☆|🗨|💬|□|☑)/u.test(line.trim())).join("\n"), { headingsOnly: true });
    applyImportedAbilityRows(abilityRows);
    fields.loot.appendChild(lootRow());

    syncRaceFeatureUi({ apply: false });
    updateCorePartsList();
    syncAbilityPartOptions();
    updateOutput();
    return { kind: "ccfolia", abilities: abilityRows.length, parts: indexedCount, hasFullSkillText };
  }

  async function parseEnemyBuilderImportSource(inputText) {
    const raw = String(inputText || "").trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
    if (!raw) throw new Error("ゆとシートURLまたはJSONを入力してください。");
    if (/^https?:\/\//i.test(raw)) {
      const fetcher = window.sw25EnemyImportUtils?.fetchYutorizeEnemyJsonFromUrl;
      if (typeof fetcher !== "function") throw new Error("ゆとシート読込機能を初期化できませんでした。ページを再読み込みしてください。");
      return { value: await fetcher(raw), sourceKind: "url" };
    }
    let value;
    try { value = JSON.parse(raw); }
    catch (_) { throw new Error("JSONとして読み取れませんでした。ゆとシートURLか、JSON全文を貼り付けてください。"); }
    return { value, sourceKind: "json" };
  }

  async function importEnemyBuilderSource() {
    if (!fields.importSource || !fields.importButton) return;
    const inputText = fields.importSource.value.trim();
    if (!inputText) {
      setEnemyBuilderImportStatus("ゆとシートURLまたはJSONを入力してください。");
      return;
    }
    const originalHtml = fields.importButton.innerHTML;
    fields.importButton.disabled = true;
    fields.importButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> 読込中';
    setEnemyBuilderImportStatus("読み込んでいます…");
    try {
      const parsed = await parseEnemyBuilderImportSource(inputText);
      let value = parsed.value;
      let result;
      if (isYutorizeEnemyImport(value)) {
        result = applyYutorizeEnemyImport(value);
        setEnemyBuilderImportStatus(`ゆとシートから読込：${result.parts}部位、特殊能力${result.abilities}件`);
      } else if (isCocofoliaEnemyImport(value)) {
        result = applyCocofoliaEnemyImport(value);
        setEnemyBuilderImportStatus(`ココフォリア駒から読込：${result.parts}部位、特殊能力${result.abilities}件${result.hasFullSkillText ? "" : "（特殊能力はチャパレにある見出しまで）"}`);
      } else {
        throw new Error("対応形式ではありません。SW2.5魔物のゆとシートJSONか、ココフォリア用コマJSONを入力してください。");
      }
    } catch (error) {
      console.error(error);
      setEnemyBuilderImportStatus(error?.message || "インポートに失敗しました。");
    } finally {
      fields.importButton.disabled = false;
      fields.importButton.innerHTML = originalHtml;
    }
  }

  function resetBuilder() {
    enemySuggestedValues.clear();
    fields.generationMode.value = "dream"; fields.level.value = ""; fields.preset.value = "custom"; fields.role.value = "balanced"; fields.partCount.value = 1;
    fields.dreamAl.value = 5; fields.dreamPlayers.value = 4; fields.dreamTaxa.value = "random"; fields.dreamPersonality.value = "random"; fields.dreamRoll.value = "random";
    fields.dreamSummary.textContent = ""; fields.dreamSummary.hidden = true; setGenerationMode("dream");
    fields.partsManual.checked = false; fields.splitDuplicateParts.checked = false;
    ["name", "taxa", "intelligence", "perception", "reaction", "language", "habitat", "reputation", "weaknessValue", "weakness", "initiative", "mobility", "vitResist", "vitResistFix", "mndResist", "mndResistFix", "coreParts", "description"].forEach((key) => { fields[key].value = ""; });
    if (fields.race) fields.race.value = "";
    fields.abilities.innerHTML = ""; syncPartCount(1, false); resetLootRows(); if (!fields.abilities.children.length) addAbility();
  }

  fields.generationMode.addEventListener("change", () => setGenerationMode());
  $("enemy-builder-dream-generate").addEventListener("click", generateDreamEnemy);
  fields.importButton?.addEventListener("click", importEnemyBuilderSource);
  fields.importSource?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    importEnemyBuilderSource();
  });
  $("enemy-builder-add-part").addEventListener("click", () => { fields.parts.appendChild(partRow()); fields.partCount.value = fields.parts.children.length; syncPartsSummary(); applyEstimatedEnemyTraitsAndStats(); });
  $("enemy-builder-add-loot").addEventListener("click", () => { fields.loot.appendChild(lootRow()); updateOutput(); });
  $("enemy-builder-add-ability").addEventListener("click", () => addAbility());
  fields.copyAbilities?.addEventListener("click", async () => {
    const text = buildAbilityDisclosureText();
    try {
      await navigator.clipboard.writeText(text);
      showLocalNotice("特殊能力をまとめてコピーしました！");
    } catch (error) {
      console.error(error);
      showLocalNotice("特殊能力をコピーできませんでした。");
    }
  });
  $("enemy-builder-reset").addEventListener("click", () => { if (window.confirm("エネミー作成の入力内容をリセットしますか？")) resetBuilder(); });
  $("enemy-builder-copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(fields.output.value); showLocalNotice("エネミーデータをコピーしました！"); }
    catch (error) { console.error(error); showLocalNotice("コピーできませんでした。"); }
  });
  $("enemy-builder-download").addEventListener("click", () => {
    const blob = new Blob([fields.output.value], { type: "application/json;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    link.download = `${(fields.name.value.trim() || "enemy").replace(/[\\/:*?\"<>|]/g, "_")}.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  });
  fields.preset.addEventListener("change", applyAutofill);

  function handleTaxaInput() {
    syncRaceFeatureUi();
    applyEstimatedEnemyTraitsAndStats();
  }

  fields.taxa.addEventListener("input", handleTaxaInput);
  fields.taxa.addEventListener("change", handleTaxaInput);
  fields.race?.addEventListener("change", () => { applyRaceFeatures(); applyEstimatedEnemyTraitsAndStats(); });
  fields.level.addEventListener("change", () => { if (fields.taxa.value.trim() === "人族") applyRaceFeatures(); applyEstimatedEnemyTraitsAndStats(); });
  fields.partCount.addEventListener("change", () => { syncPartCount(fields.partCount.value, true); applyEstimatedEnemyTraitsAndStats(); });
  fields.partsManual.addEventListener("change", () => { syncPartsSummary(); updateOutput(); });
  fields.splitDuplicateParts.addEventListener("change", () => { syncAbilityPartOptions(); updateOutput(); });
  fields.partsBreakdown.addEventListener("input", () => { updateCorePartsList(); syncAbilityPartOptions(); });
  fields.parts.addEventListener("click", (event) => {
    const button = event.target.closest(".enemy-builder-remove-part"); if (!button || fields.parts.children.length <= 1) return;
    button.closest("tr").remove(); fields.partCount.value = fields.parts.children.length; syncPartsSummary(); updateOutput();
  });
  fields.parts.addEventListener("input", (event) => {
    const input = event.target;
    const row = input.closest(".enemy-builder-part-row");
    if (!row) return;
    const pairs = [
      ["enemy-builder-part-accuracy", ".enemy-builder-part-accuracy-fix", 7],
      ["enemy-builder-part-accuracy-fix", ".enemy-builder-part-accuracy", -7],
      ["enemy-builder-part-evasion", ".enemy-builder-part-evasion-fix", 7],
      ["enemy-builder-part-evasion-fix", ".enemy-builder-part-evasion", -7],
    ];
    const pair = pairs.find(([className]) => input.classList.contains(className));
    if (pair) {
      const pairedInput = row.querySelector(pair[1]);
      if (pairedInput) pairedInput.value = input.value === "" ? "" : toNumber(input.value) + pair[2];
    }
    if (input.classList.contains("enemy-builder-part-style")) syncPartsSummary();
  });
  [[fields.vitResist, fields.vitResistFix], [fields.mndResist, fields.mndResistFix]].forEach(([base, fixed]) => {
    base.addEventListener("input", () => { fixed.value = base.value === "" ? "" : fixedValue(base.value); });
    fixed.addEventListener("input", () => { base.value = fixed.value === "" ? "" : toNumber(fixed.value) - 7; });
  });
  fields.loot.addEventListener("click", (event) => {
    const button = event.target.closest(".enemy-builder-remove-loot");
    if (!button) return;
    button.closest(".enemy-builder-loot-row")?.remove();
    updateOutput();
  });
  fields.abilities.addEventListener("click", (event) => {
    const nameModeButton = event.target.closest("[data-ability-name-mode]");
    if (nameModeButton) {
      const selectedMode = nameModeButton.dataset.abilityNameMode;
      const nextMode = nameModeButton.getAttribute("aria-pressed") === "true" ? (selectedMode === "name" ? "candidate" : "name") : selectedMode;
      setAbilityNameMode(nameModeButton.closest(".enemy-builder-ability-row"), nextMode);
      return;
    }
    const moveButton = event.target.closest(".enemy-builder-move-ability");
    if (moveButton) {
      const row = moveButton.closest(".enemy-builder-ability-row");
      const sibling = moveButton.dataset.direction === "up" ? row?.previousElementSibling : row?.nextElementSibling;
      if (row && sibling) {
        if (moveButton.dataset.direction === "up") fields.abilities.insertBefore(row, sibling);
        else fields.abilities.insertBefore(sibling, row);
        updateAbilityOrderButtons();
        updateOutput();
      }
      return;
    }
    const selectedChip = event.target.closest(".enemy-builder-assist-chip");
    if (selectedChip) {
      const row = selectedChip.closest(".enemy-builder-ability-row");
      const isMagicSystem = selectedChip.hasAttribute("data-magic-system");
      selectedChip.remove();
      if (row) {
        if (isMagicSystem) updateMagicAbilityTitle(row);
        else updateCollectedAbilityBody(row);
      }
      return;
    }
    const markerButton = event.target.closest(".enemy-builder-marker-toggle");
    if (markerButton) {
      const group = markerButton.closest(".enemy-builder-ability-markers");
      const isPressed = markerButton.getAttribute("aria-pressed") === "true";
      if (isPressed && group?.querySelectorAll('[aria-pressed="true"]').length === 1) {
        showLocalNotice("能力型は1つ以上選んでください。");
        return;
      }
      markerButton.setAttribute("aria-pressed", String(!isPressed));
      syncAbilityContestEditorAvailability(markerButton.closest(".enemy-builder-ability-row"));
      updateOutput();
      return;
    }
    const assistButton = event.target.closest("[data-assist-action]");
    if (assistButton) {
      const row = assistButton.closest(".enemy-builder-ability-row");
      const action = assistButton.dataset.assistAction;
      if (!row) return;
      if (action === "add-option") {
        const value = row.querySelector(".enemy-builder-assist-option")?.value;
        addCollectedAbilityOption(row, value);
      } else if (action === "add-magic-system") {
        const value = row.querySelector(".enemy-builder-assist-option")?.value;
        addMagicSystemOption(row, value);
      } else if (action === "set-magic-title") {
        updateMagicAbilityTitle(row);
      }
      return;
    }
    const button = event.target.closest(".enemy-builder-remove-ability"); if (!button) return;
    button.closest(".enemy-builder-ability-row").remove();
    if (!fields.abilities.children.length) addAbility();
    updateAbilityOrderButtons();
    updateOutput();
  });
  fields.abilities.addEventListener("change", (event) => {
    const row = event.target.closest(".enemy-builder-ability-row");
    if (event.target.matches(".enemy-builder-ability-template")) {
      const template = abilityTemplates.find((item) => item.id === event.target.value);
      if (template) applyAbilityTemplate(row, template);
    } else if (event.target.matches(".enemy-builder-use-limit")) {
      updateAbilityUseLimit(row);
    } else if (event.target.matches(".enemy-builder-contest-mode")) {
      const mode = event.target.value;
      const base = row?.querySelector(".enemy-builder-contest-base");
      const fixed = row?.querySelector(".enemy-builder-contest-fixed");
      if (mode === "roll") {
        if (base && base.value === "" && fixed?.value !== "") base.value = toNumber(fixed.value) - 7;
        if (base && base.value === "") base.value = getContext().base;
        syncAbilityContestPair(row, "base");
      } else if (mode === "fixed" && fixed && fixed.value === "" && base?.value !== "") {
        fixed.value = fixedValue(base.value);
      }
      updateAbilityContestTitle(row);
    } else if (event.target.matches(".enemy-builder-ability-title")) {
      if (!syncAbilityContestFromTitle(row, { open: true })) {
        row.dataset.contestBaseTitle = event.target.value.trim();
        syncAbilityContestEditorAvailability(row);
        if ((row.querySelector(".enemy-builder-contest-mode")?.value || "none") !== "none") updateAbilityContestTitle(row);
      }
    } else if (event.target.matches(".enemy-builder-ability-body")) {
      }
  });
  fields.abilities.addEventListener("input", (event) => {
    const row = event.target.closest(".enemy-builder-ability-row");
    if (event.target.matches(".enemy-builder-param-input")) {
      if (event.target.dataset.paramKey === "attribute") syncBreathNameFromAttribute(row);
      if (event.target.dataset.paramKey === "finaleName") syncFinaleParamsFromName(row);
      if (event.target.dataset.paramKey === "warCryName" || event.target.dataset.paramKey === "formationName") syncWarCommandMarkersFromSelection(row);
      updateParameterizedAbility(row);
      return;
    }
    if (event.target.matches(".enemy-builder-use-limit-count input")) {
      updateAbilityUseLimit(row);
      return;
    }
    if (event.target.matches(".enemy-builder-contest-base")) {
      syncAbilityContestPair(row, "base");
      updateAbilityContestTitle(row);
      return;
    }
    if (event.target.matches(".enemy-builder-contest-fixed")) {
      syncAbilityContestPair(row, "fixed");
      updateAbilityContestTitle(row);
      return;
    }
    if (event.target.matches(".enemy-builder-contest-opposition, .enemy-builder-contest-result")) {
      updateAbilityContestTitle(row);
      return;
    }
    if (!event.target.matches(".enemy-builder-assist-power, .enemy-builder-assist-level, .enemy-builder-abyss-extension-rounds")) return;
    const fixed = row?.querySelector(".enemy-builder-assist-power-fixed");
    if (event.target.matches(".enemy-builder-assist-power") && fixed) fixed.value = event.target.value === "" ? "" : fixedValue(event.target.value);
    if (row) updateMagicAbilityTitle(row);
  });
  panel.addEventListener("input", (event) => { releaseEnemySuggestion(event.target); updateOutput(); });
  panel.addEventListener("change", updateOutput);

  initMultiChoiceField("language");
  initMultiChoiceField("habitat");
  setGenerationMode();
  ensureMonsterArtDatalists();
  syncPartCount(1, false);
  resetLootRows();
  if (!fields.abilities.children.length) addAbility();
});

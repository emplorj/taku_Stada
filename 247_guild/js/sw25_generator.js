// sw25_generator.js の内容をすべてこれで置き換え

document.addEventListener("DOMContentLoaded", () => {
  const {
    Races,
    Regulations,
    WeaponClasses,
    ArmourClasses,
    Weapons,
    Armours,
    Items,
    GeneralSkills,
    SkillLevelGuides,
    ItemSets,
    RecommendedItems,
  } = window.sw25_data;

  const enhancementData = {
    weapon: [
      {
        name: "オーダーメイド",
        prices: { B: 300, A: 1000, S: 3000, SS: 6000 },
      },
      { name: "銀製武器", prices: { B: 1000, A: 2000, S: 4000, SS: 6000 } },
      {
        name: "魔法の武器+1",
        prices: { B: 5000, A: 10000, S: 20000, SS: null },
      },
      { name: "妖精の武器", prices: { B: 1500, A: 3000, S: 6000, SS: 9000 } },
      {
        name: "イグニダイト加工",
        prices: { B: 5000, A: 10000, S: 20000, SS: 40000 },
      },
      { name: "アビス強化", prices: { B: 2000, A: 4000, S: 8000, SS: 12000 } },
    ],
    armour: [
      { name: "魔法の鎧+1", prices: { B: 5000, A: 10000, S: 20000, SS: null } },
      { name: "防弾加工の鎧", prices: { B: 1500, A: 3000, S: 6000, SS: 9000 } },
      {
        name: "マナタイトの追加装甲",
        prices: { B: 5000, A: 10000, S: 20000, SS: 30000 },
      },
    ],
  };

  // DOM要素キャッシュ
  const sidebarLinks = document.querySelectorAll("#form-sidebar .sidebar-link");
  const formPanels = document.querySelectorAll(".form-panel");
  const regulationSelect = document.getElementById("regulation-select");
  const expTotalInput = document.getElementById("expTotal");
  const moneyTotalInput = document.getElementById("moneyTotal");
  const honorInput = document.getElementById("honor");
  const abyssShardInput = document.getElementById("abyssShard");
  const growthCountInput = document.getElementById("growthCount");
  const rollGrowthBtn = document.getElementById("roll-growth-btn");
  const copyRegulationBtn = document.getElementById("copy-regulation-btn");
  const growthResultsContainer = document.getElementById(
    "growth-results-container",
  );
  const statsGridContainer = document.getElementById("stats-grid-container");
  const usePriorityCheck = document.getElementById("use-priority-check");
  const resetPriorityBtn = document.getElementById("reset-priority-btn");
  const addGeneralSkillBtn = document.getElementById("add-general-skill-btn");
  const generalSkillsContainer = document.getElementById(
    "general-skills-container",
  );
  const skillProgressBar = document.getElementById("general-skill-progress");
  const totalLevelSpan = document.getElementById("general-skill-total-level");
  const enemyJsonInput = document.getElementById("enemy-json-input");
  const swordShardsCount = document.getElementById("sword-shards-count");
  const applyEnemyEnhancementBtn = document.getElementById(
    "apply-enemy-enhancement-btn",
  );
  const enemyJsonOutput = document.getElementById("enemy-json-output");
  const copyEnemyJsonBtn = document.getElementById("copy-enemy-json-btn");
  // トレジャーポイント関連
  const addTpAbilityBtn = document.getElementById("add-tp-ability-btn");
  const tpSelectionContainer = document.getElementById(
    "tp-selection-container",
  );
  const treasurePointsTotalInput = document.getElementById(
    "treasure-points-total",
  );

  const tpAbilityDescriptions = {
    weakness:
      "割り振ったポイントに対応した値だけ、その魔物の弱点値が上昇します。知名度は変わりません。",
    initiative:
      "割り振ったポイントに対応した値だけ、その魔物の先制値が上昇します。",
    damage:
      "打撃点決定の2dを振り、出目を確認した後、割り振ったポイントに対応した値だけ、打撃点を上昇させます。この強化は1体の魔物(部位)に複数を待たせることができ、割り振った回数だけ、1日の間に打撃点上昇の機会を得られます。ただし、10秒(1ラウンド)の間に打撃点を上昇させることができるのは、対象1体ごと1回までです。また、打撃点の上昇分はすべて同じに揃えなければなりません。",
    defense:
      "1日に1回だけ、物理ダメージを受けて防護点を適用するとき、割り振ったポイントに対応した値だけ、防護点を上昇させます。合算ダメージが確定した後に、この効果を使うかどうかを選択します。",
    success:
      "1日に1回だけ、行為判定の達成値を求めてから、その達成値を割り振ったポイントに対応した値だけ上昇させます。対抗判定などの場合、その結果を覆す目的で使用できます。",
    attack:
      "手番終了時に1dを振り、「/」の前にある出目を得ると、近接攻撃を追加で1回行います。この追加は、魔物が「○2回攻撃」や「○連続攻撃」などの攻撃回数や機会を増やす能力を持っていても考慮されず、近接攻撃1回のみです。この効果は手番ごとに1回のみチェックされます。また、「/」の後が追加で攻撃が行われる上限回数を表します。その回数だけ追加の攻撃が発生したら、翌日までこの効果はいっさい現れなくなります。",
    curse:
      "この効果は1日に1回だけ使用可能で、使用の宣言後、連続した1分(6ラウンド)の間だけ効果が発生します。効果が発生中は、自身の手番終了時に自動的に1回、「射程:接触」「対象:1体」に「抵抗:必中」で、割り振ったポイントに対応した点数の、呪い属性の確定ダメージを与えます。",
    contamination:
      "1日に1回だけ、戦闘行為によって初めて自身のHPにダメージを受けたとき、自動的に「射程:自身」で「対象:全エリア(半径20m)/すべて」に、「抵抗:必中」で、「指定された威力/C値10」(のみ)の、毒属性の魔法ダメージを与えます。このとき、任意のキャラクターを効果から除外することができます。",
  };

  const statNames = ["器用", "敏捷", "筋力", "生命", "知力", "精神"];
  const statClassMap = {
    器用: "stat-器用",
    敏捷: "stat-敏捷",
    筋力: "stat-筋力",
    生命: "stat-生命",
    知力: "stat-知力",
    精神: "stat-精神",
  };
  const growthMap = {
    1: "器用",
    2: "敏捷",
    3: "筋力",
    4: "生命",
    5: "知力",
    6: "精神",
  };
  const statNumberMap = {
    器用: 1,
    敏捷: 2,
    筋力: 3,
    生命: 4,
    知力: 5,
    精神: 6,
  };
  let growthRowCounter = 0;
  let userCashbookContent = "";
  let openDropdownElement = null; // 現在開いているプルダウンメニューを追跡

  // キャラシ分析用の状態
  let charAnalysisCsvRows = [];
  let charAnalysisCurrent = null;
  let charAnalysisRawText = "";
  let charAnalysisSelectedEffectIds = new Set();
  let charAnalysisSelectedAttackId = "";
  const CHAR_ANALYSIS_MANUAL_ATTACK_ID = "__manual_attack__";
  const CHAR_ANALYSIS_ALCHEMY_EFFECT_DEFS = {
    instantWeapon: {
      id: "alchemy-instant-weapon",
      craft: "インスタントウェポン",
      name: "【インスタントウェポン】",
      card: "白カード",
      values: { B: 10, A: 20, S: 30, SS: 50 },
      bonusType: "memo",
      bonusLabel: "作成武器の威力",
      summary: "簡易武器を作成。現在選択中の武器には直接加算せず、直接指定や攻撃手段の作成候補として表示",
    },
    vorpalWeapon: {
      id: "alchemy-vorpal-weapon",
      craft: "ヴォーパルウェポン",
      name: "【ヴォーパルウェポン】",
      card: "赤カード",
      values: { B: 1, A: 2, S: 3, SS: 6 },
      bonusType: "damage",
      bonusLabel: "物理ダメージ補正",
      summary: "対象が与える物理ダメージを上昇。平均ダメージ/Rへ加算",
    },
    crushFang: {
      id: "alchemy-crush-fang",
      craft: "クラッシュファング",
      name: "△【クラッシュファング】",
      card: "赤カード",
      values: { B: -1, A: -2, S: -4, SS: -10 },
      bonusType: "enemyDamage",
      bonusLabel: "敵物理ダメージ",
      summary: "対象が発生させる物理ダメージを減少。防御試算では敵ダメージ低下候補として表示",
    },
    criticalRay: {
      id: "alchemy-critical-ray",
      craft: "クリティカルレイ",
      name: "【クリティカルレイ】",
      card: "金カード",
      values: { B: 1, A: 2, S: 3, SS: 6 },
      bonusType: "diceFirst",
      bonusLabel: "初回出目補正",
      summary: "次の威力表参照の出目を上昇。BCDiceの $+N 相当として初回のみ反映",
    },
    barkmail: {
      id: "alchemy-barkmail",
      craft: "バークメイル",
      name: "【バークメイル】",
      card: "緑カード",
      values: { B: 1, A: 2, S: 4, SS: 8 },
      bonusType: "def",
      bonusLabel: "防護点補正",
      summary: "対象の防護点を上昇。防御モードや被ダメージ試算で反映",
    },
    paralyzeMist: {
      id: "alchemy-paralyze-mist",
      craft: "パラライズミスト",
      name: "【パラライズミスト】",
      card: "緑カード",
      values: { B: 0, A: 1, S: 2, SS: 4 },
      bonusType: "hit",
      bonusLabel: "命中相当補正",
      summary: "対象の回避力判定を低下。攻撃側の命中相当補正として概算反映",
    },
    poisonNeedle: {
      id: "alchemy-poison-needle",
      craft: "ポイズンニードル",
      name: "【ポイズンニードル】",
      card: "黒カード",
      values: { B: 1, A: 3, S: 5, SS: 10 },
      bonusType: "poisonEnd",
      bonusLabel: "手番終了時毒ダメージ",
      summary: "錬金術師の手番終了時に毒属性の魔法ダメージ。通常の1回攻撃平均には直接加算せず候補表示",
    },
    mirageDaze: {
      id: "alchemy-mirage-daze",
      craft: "ミラージュデイズ",
      name: "△【ミラージュデイズ】",
      card: "白カード",
      values: { B: 0, A: 1, S: 2, SS: 4 },
      bonusType: "eva",
      bonusLabel: "回避相当補正",
      summary: "対象の命中力を低下。防御側の回避相当補正として概算反映",
    },
    healSpray: {
      id: "alchemy-heal-spray",
      craft: "ヒールスプレー",
      name: "【ヒールスプレー】",
      card: "緑カード×2",
      values: { B: 3, A: 10, S: 20, SS: 50 },
      bonusType: "heal",
      bonusLabel: "HP回復量",
      summary: "対象のHPを回復。攻撃平均には直接反映せず回復量候補として表示",
    },
    armorLast: {
      id: "alchemy-armor-last",
      craft: "アーマーラスト",
      name: "【アーマーラスト】",
      card: "黒カード×2",
      values: { B: 1, A: 3, S: 5, SS: 10 },
      bonusType: "damage",
      bonusLabel: "防護点低下相当",
      summary: "対象の防護点を低下。物理攻撃では防護点低下ぶんをダメージ増加相当として概算反映",
    },
    initiativeBoost: {
      id: "alchemy-initiative-boost",
      craft: "イニシアティブブースト",
      name: "△【イニシアティブブースト】",
      card: "赤カード×2",
      values: { B: 1, A: 2, S: 4, SS: 8 },
      bonusType: "initiative",
      bonusLabel: "先制判定補正",
      summary: "先制判定にボーナス。ダメージ試算には直接反映しない",
    },
    encyclopaedia: {
      id: "alchemy-encyclopaedia",
      craft: "エンサイクロペディア",
      name: "△【エンサイクロペディア】",
      card: "白カード×2",
      values: { B: 1, A: 2, S: 4, SS: 8 },
      bonusType: "monsterLore",
      bonusLabel: "魔物知識判定補正",
      summary: "魔物知識判定にボーナス。ダメージ試算には直接反映しない",
    },
    dispelNeedle: {
      id: "alchemy-dispel-needle",
      craft: "ディスペルニードル",
      name: "【ディスペルニードル】",
      card: "黒カード",
      values: { B: 0, A: 0, S: 0, SS: 0 },
      bonusType: "memo",
      bonusLabel: "効果解除",
      summary: "練技・呪歌・賦術・魔物の特殊能力などを解除。補助動作での使用可否や達成値はランクごとに要確認",
    },
    bindAbility: {
      id: "alchemy-bind-ability",
      craft: "バインドアビリティ",
      name: "【バインドアビリティ】",
      card: "白カード×2",
      values: { B: 1, A: 2, S: 3, SS: 4 },
      bonusType: "specialPenalty",
      bonusLabel: "特殊能力達成値ペナルティ",
      summary: "対象の特殊能力の達成値にペナルティ。攻撃平均には直接反映しない",
    },
    vividLiquid: {
      id: "alchemy-vivid-liquid",
      craft: "ビビッドリキッド",
      name: "【ビビッドリキッド】",
      card: "緑カード×2",
      values: { B: 0, A: 3, S: 10, SS: 20 },
      bonusType: "mpHeal",
      bonusLabel: "MP回復量",
      summary: "対象のMPを回復。ダメージ試算には直接反映しない",
    },
    manaSprout: {
      id: "alchemy-mana-sprout",
      craft: "マナスプラウト",
      name: "△【マナスプラウト】",
      card: "金カード",
      values: { B: 1, A: 3, S: 10, SS: 20 },
      bonusType: "mpTemp",
      bonusLabel: "一時MP",
      summary: "対象に一時的なMPを与える。ダメージ試算には直接反映しない",
    },
    manaDown: {
      id: "alchemy-mana-down",
      craft: "マナダウン",
      name: "△【マナダウン】",
      card: "金カード",
      values: { B: -1, A: -2, S: -4, SS: -8 },
      bonusType: "enemyMagicDamage",
      bonusLabel: "敵魔法ダメージ",
      summary: "対象が発生させる魔法ダメージを減少。防御試算では敵魔法ダメージ低下候補として表示",
    },
    leanForce: {
      id: "alchemy-lean-force",
      craft: "リーンフォース",
      name: "【リーンフォース】",
      card: "赤カード×2",
      values: { B: 0, A: 1, S: 3, SS: 6 },
      bonusType: "damage",
      bonusLabel: "魔法ダメージ補正",
      summary: "対象が与える魔法ダメージを上昇。魔法攻撃の平均ダメージ/Rへ加算候補として反映",
    },
  };
  const CHAR_ANALYSIS_ALCHEMY_RANKS = ["B", "A", "S", "SS"];
  function createCharAnalysisAlchemySettings() {
    const settings = { criticalRayRank: "A" };
    Object.keys(CHAR_ANALYSIS_ALCHEMY_EFFECT_DEFS).forEach((key) => {
      settings[key] = "A";
    });
    return settings;
  }
  let charAnalysisAlchemySettings = createCharAnalysisAlchemySettings();
  function createCharAnalysisManualAdjust() {
    return { mode: "relative", hit: 0, hitAbs: "", rate: 0, rateAbs: "", add: 0, addAbs: "", crit: 0, critAbs: "" };
  }
  let charAnalysisManualAdjust = createCharAnalysisManualAdjust();
  function createCharAnalysisActionPlan() {
    return {
      dualWield: false,
      extraAttack: true,
      fastAction: false,
      slotAttackIds: { main: "", offhand: "", extra: "", magic: "", faMain: "", faOffhand: "", faExtra: "", faMagic: "" },
      slotBulletIds: {},
      slotDeclarationIds: { main: [], offhand: [], extra: [], magic: [], faMain: [], faOffhand: [], faExtra: [], faMagic: [] },
      slotManualAdjusts: {},
      slotTargetCounts: {},
      matchCompact: false,
    };
  }
  let charAnalysisActionPlan = createCharAnalysisActionPlan();
  let charAnalysisSimulationNonce = 0;
  let charAnalysisSettingsOpen = false;
  let charAnalysisRenderTimer = null;
  let charAnalysisEnemyParts = [];
  let charAnalysisSelectedEnemyPartIndex = 0;
  let charAnalysisEnemyActions = { normal: [], special: [], declarations: [], support: [], magic: [], memos: [] };
  let charAnalysisEnemySheetName = "";
  let charAnalysisEnemyScoutLore = createEmptyEnemyScoutLoreInfo();

  function setupEnhancementPanel() {
    const panel = document.getElementById("enhancement-panel");
    if (!panel) return;
    panel.innerHTML = "";

    const createSection = (title, items) => {
      const sectionDiv = document.createElement("div");
      sectionDiv.className = "enhancement-section";

      const titleEl = document.createElement("h4");
      titleEl.className = "enhancement-section-title";
      titleEl.textContent = title;
      sectionDiv.appendChild(titleEl);

      items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "enhancement-row";
        const nameSpan = document.createElement("span");
        nameSpan.className = "enhancement-name";
        nameSpan.textContent = item.name;
        row.appendChild(nameSpan);

        const buttonsDiv = document.createElement("div");
        buttonsDiv.className = "enhancement-buttons";
        Object.keys(item.prices).forEach((rank) => {
          const price = item.prices[rank];
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "enhancement-btn";
          btn.textContent = rank;
          btn.dataset.name = item.name;
          btn.dataset.rank = rank;
          btn.disabled = price === null;
          if (price !== null) btn.dataset.price = price;
          buttonsDiv.appendChild(btn);
        });
        row.appendChild(buttonsDiv);
        sectionDiv.appendChild(row);
      });
      return sectionDiv;
    };

    panel.appendChild(createSection("武器強化一覧", enhancementData.weapon));
    panel.appendChild(createSection("防具強化一覧", enhancementData.armour));
  }

  function handleEnhancementButtonClick(button) {
    const name = button.dataset.name;
    const rank = button.dataset.rank;
    const price = parseInt(button.dataset.price, 10);
    const newEntry = `: ${name}（${rank}）|::-${price}`;

    userCashbookContent = userCashbookContent
      ? `${userCashbookContent}\n${newEntry}`
      : newEntry;

    updateAllItems();
  }

  function setupItemPanel() {
    const container = document.getElementById("items-container");
    container.innerHTML = "";
    const adventureSetData = Items["一般装備品・消耗品など"]["冒険者セット"][0];
    if (adventureSetData) {
      addItemRow({
        name: adventureSetData.name,
        freeName: adventureSetData.name,
        unitPrice: adventureSetData.price,
        effect: adventureSetData.note,
      });
    }
    addItemRow();
    addItemRow();
  }

  // プルダウンメニューの開閉とフィルタリングのヘルパー関数
  function openDropdown(dropdownMenu) {
    closeAllDropdowns(); // 他の開いているプルダウンを閉じる

    const inputElement = dropdownMenu
      .closest(".input-with-dropdown")
      .querySelector("input[type='text']");
    const rect = inputElement.getBoundingClientRect();

    dropdownMenu.style.position = "fixed"; // position を fixed に変更
    dropdownMenu.style.left = `${rect.left}px`;
    dropdownMenu.style.top = `${rect.bottom + window.scrollY}px`; // 入力フィールドの下に配置
    dropdownMenu.style.width = `${inputElement.offsetWidth}px`; // 入力フィールドの幅に合わせる

    // 画面の下端からはみ出す場合（上方向に開く）
    if (
      rect.bottom + dropdownMenu.offsetHeight > window.innerHeight &&
      rect.top - dropdownMenu.offsetHeight > 0
    ) {
      dropdownMenu.style.top = `${rect.top - dropdownMenu.offsetHeight - 5}px`; // 入力フィールドの上に配置
    }

    dropdownMenu.style.display = "block";
    openDropdownElement = dropdownMenu;
  }

  function closeDropdown(dropdownMenu) {
    dropdownMenu.style.display = "none";
    if (openDropdownElement === dropdownMenu) {
      openDropdownElement = null;
    }
  }

  function toggleDropdown(dropdownMenu) {
    if (dropdownMenu.style.display === "block") {
      closeDropdown(dropdownMenu);
    } else {
      openDropdown(dropdownMenu);
    }
  }

  function filterDropdownOptions(inputElement, dropdownMenu) {
    const filterText = inputElement.value.toLowerCase();
    const options = dropdownMenu.querySelectorAll("li");
    let hasVisibleOptions = false;
    options.forEach((li) => {
      // フィルタリングロジックを削除し、常に表示
      li.style.display = "block";
      hasVisibleOptions = true;
    });
    if (hasVisibleOptions) {
      openDropdown(dropdownMenu);
    } else {
      closeDropdown(dropdownMenu);
    }
  }

  function closeAllDropdowns() {
    if (openDropdownElement) {
      openDropdownElement.style.display = "none";
      openDropdownElement = null;
    }
  }

  function handleItemNameChange({ target: nameInputElement }) {
    const row = nameInputElement.closest(".item-row");
    const selectedValue = nameInputElement.value; // input要素の値を取得
    const allItems = Object.values(Items)
      .flatMap((category) => Object.values(category))
      .flat();
    const selectedItem = allItems.find((item) => item.name === selectedValue);

    const magicCheck = row.querySelector(".item-magic-check");
    if (magicCheck)
      magicCheck.checked = !!(selectedItem && selectedItem.isMagic);

    if (selectedItem) {
      row.querySelector(".item-unit-price").value = selectedItem.price || 0;
      row.querySelector(".item-effect").value = selectedItem.note || "";
    }
    // else { // データが見つからない場合に空欄にするロジックを削除
    //   row.querySelector(".item-unit-price").value = "";
    //   row.querySelector(".item-effect").value = "";
    // }
    updateAllItems();
  }

  function formatCashbookSignedAmount(amount) {
    const numeric = Number(amount) || 0;
    if (numeric === 0) return "0";
    return `${numeric > 0 ? "+" : "-"}${Math.abs(numeric)}`;
  }

  function formatAutoCashbookPriceExpression(price, quantity = 1) {
    const numericPrice = Number(price) || 0;
    const sign = numericPrice < 0 ? "+" : "-";
    const absPrice = Math.abs(numericPrice);
    const count = Number.parseInt(quantity, 10) || 1;
    if (count > 1) return `::${sign}${absPrice}*${count}`;
    return `::${sign}${absPrice}`;
  }

  function updateCashbookAndMoney() {
    const cashbookTextarea = document.getElementById("cashbook");
    const folderToggle = document.getElementById("item-folder-toggle").checked;
    const folderTitle =
      document.getElementById("item-folder-title").value.trim() || "初期投資";
    let autoEntries = [];
    let autoTotalCost = 0;

    document
      .querySelectorAll(".weapon-row, .armour-row, .item-row")
      .forEach((row) => {
        const priceInput = row.querySelector(
          ".weapon-price, .armour-price, .item-total-price",
        );
        const nameFree = row.querySelector(
          ".weapon-name-free, .armour-name-free, .item-name-free",
        );

        let name = nameFree ? nameFree.value.trim() : "";

        if (name === "free" || !name) return;

        if (priceInput) {
          const price = parseFloat(priceInput.value) || 0;
          if (price !== 0) {
            autoTotalCost += price;
            const isMagic =
              row.querySelector(".item-magic-check")?.checked || false;
            const prefix = isMagic ? "[魔]" : "";
            const nameText =
              name.startsWith("〈") && name.endsWith("〉")
                ? name
                : `〈${name}〉`;
            const unitPrice =
              parseFloat(
                row.querySelector(
                  ".item-unit-price, .weapon-price, .armour-price",
                )?.value,
              ) || price;
            const quantity =
              parseInt(row.querySelector(".item-quantity")?.value, 10) || 1;

            if (quantity > 1 && row.classList.contains("item-row")) {
              autoEntries.push(
                `: ${prefix}${nameText}|` +
                  formatAutoCashbookPriceExpression(unitPrice, quantity),
              );
            } else {
              autoEntries.push(
                `: ${prefix}${nameText}|` +
                  formatAutoCashbookPriceExpression(price),
              );
            }
          }
        }
      });

    let autoBlock = "";
    if (autoEntries.length > 0) {
      autoBlock = folderToggle
        ? `[>]**${folderTitle}\n` + autoEntries.join("\n") + `\n[---]`
        : autoEntries.join("\n");
    }

    cashbookTextarea.value =
      autoBlock +
      (userCashbookContent
        ? (autoBlock ? "\n" : "") + userCashbookContent
        : "");

    let userTotalCost = 0;
    if (userCashbookContent) {
      const userEntries = userCashbookContent.split("\n");
      userEntries.forEach((line) => {
        const match = line.match(/::([+-]?\d+(?:\.\d+)?)/);
        if (match) userTotalCost -= Number(match[1]);
      });
    }

    const finalTotalCost = autoTotalCost + userTotalCost;
    document.getElementById("money-sidebar-items-total").textContent =
      formatCashbookSignedAmount(-finalTotalCost);
    updateRemainingMoney();
  }

  // ★★★ ツールチップ制御用の変数を追加 ★★★
  let tooltipElement = null;

  // ★★★ setupItemSetsPanel 関数を修正 ★★★
  function setupItemSetsPanel() {
    const panel = document.getElementById("item-sets-panel");
    if (!panel || !ItemSets) return;
    panel.innerHTML = "";

    // ★ ツールチップ用のdiv要素がなければ作成
    if (!tooltipElement) {
      tooltipElement = document.createElement("div");
      tooltipElement.className = "dynamic-tooltip";
      document.body.appendChild(tooltipElement);
    }

    Object.entries(ItemSets).forEach(([categoryName, sets]) => {
      const sectionDiv = document.createElement("div");
      sectionDiv.className = "enhancement-section";

      const titleEl = document.createElement("h4");
      titleEl.className = "enhancement-section-title";
      titleEl.textContent = categoryName;
      sectionDiv.appendChild(titleEl);

      sets.forEach((set) => {
        const row = document.createElement("div");
        row.className = "item-set-row";

        const nameSpan = document.createElement("span");
        nameSpan.className = "item-set-name";
        nameSpan.textContent = set.name;
        row.appendChild(nameSpan);

        const tooltipTrigger = document.createElement("i");
        tooltipTrigger.className =
          "fas fa-question-circle item-set-tooltip-trigger";

        const tooltipContent = set.items
          .map((item) => {
            const name = item.freeName || item.name;
            const points = item.points ? `(${item.points}点)` : "";
            return `・${name}${points} x ${item.quantity}`;
          })
          .join("\n");

        // ★★★ JSによるツールチップ制御ロジック（タイマーなし） ★★★
        tooltipTrigger.addEventListener("mouseenter", (e) => {
          tooltipElement.innerHTML = tooltipContent;
          tooltipElement.classList.add("visible");

          let x = e.clientX + 15;
          let y = e.clientY + 15;

          const tooltipRect = tooltipElement.getBoundingClientRect();
          if (x + tooltipRect.width > window.innerWidth) {
            x = e.clientX - tooltipRect.width - 15;
          }
          if (y + tooltipRect.height > window.innerHeight) {
            y = e.clientY - tooltipRect.height - 15;
          }

          tooltipElement.style.left = `${x}px`;
          tooltipElement.style.top = `${y}px`;
        });

        tooltipTrigger.addEventListener("mousemove", (e) => {
          let x = e.clientX + 15;
          let y = e.clientY + 15;

          const tooltipRect = tooltipElement.getBoundingClientRect();
          if (x + tooltipRect.width > window.innerWidth) {
            x = e.clientX - tooltipRect.width - 15;
          }
          if (y + tooltipRect.height > window.innerHeight) {
            y = e.clientY - tooltipRect.height - 15;
          }

          tooltipElement.style.left = `${x}px`;
          tooltipElement.style.top = `${y}px`;
        });

        tooltipTrigger.addEventListener("mouseleave", () => {
          tooltipElement.classList.remove("visible");
        });

        row.appendChild(tooltipTrigger);

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "item-set-btn";
        btn.textContent = "購入";
        btn.onclick = () => handleItemSetPurchase(set.items);
        row.appendChild(btn);

        sectionDiv.appendChild(row);
      });
      panel.appendChild(sectionDiv);
    });
  }

  // ★追加: アイテムセット購入を処理する関数
  function handleItemSetPurchase(items) {
    if (!items || items.length === 0) return;

    const allItemRows = Array.from(
      document.querySelectorAll("#items-container .item-row"),
    );
    const emptySlots = allItemRows.filter((row) => {
      const nameSelect = row.querySelector(".item-name-select");
      const nameFree = row.querySelector(".item-name-free");
      return (
        (nameSelect.style.display !== "none" && !nameSelect.value) ||
        (nameFree.style.display !== "none" && !nameFree.value.trim())
      );
    });

    let emptySlotIndex = 0;

    items.forEach((itemData) => {
      const itemMaster = Object.values(Items)
        .flatMap((category) => Object.values(category).flat())
        .find((i) => i.name === itemData.name);

      const newRowData = {
        name: itemMaster ? itemMaster.name : "free",
        freeName: itemData.freeName || itemMaster?.name || itemData.name,
        unitPrice: itemMaster?.price || 0,
        quantity: itemData.quantity || 1,
        effect: itemMaster?.note || "",
        points: itemData.points || "",
      };

      // 空きスロットがあればそこを埋める
      if (emptySlotIndex < emptySlots.length) {
        const targetRow = emptySlots[emptySlotIndex];

        const nameSelect = targetRow.querySelector(".item-name-select");
        const nameFree = targetRow.querySelector(".item-name-free");
        const pointsInput = targetRow.querySelector(".item-points");
        const unitPriceInput = targetRow.querySelector(".item-unit-price");
        const quantityInput = targetRow.querySelector(".item-quantity");
        const effectInput = targetRow.querySelector(".item-effect");
        const magicCheck = targetRow.querySelector(".item-magic-check");

        // 値を設定
        if (newRowData.name === "free") {
          nameSelect.style.display = "none";
          nameFree.style.display = "block";
          nameFree.value = newRowData.freeName;
        } else {
          nameSelect.style.display = "block";
          nameFree.style.display = "none";
          nameSelect.value = newRowData.name;
        }
        pointsInput.value = newRowData.points;
        unitPriceInput.value = newRowData.unitPrice;
        quantityInput.value = newRowData.quantity;
        effectInput.value = newRowData.effect;
        magicCheck.checked = !!itemMaster?.isMagic;

        // イベントを発火させて合計金額などを再計算
        nameSelect.dispatchEvent(new Event("change", { bubbles: true }));

        emptySlotIndex++;
      } else {
        // 空きスロットがなければ末尾に追加
        addItemRow(newRowData);
      }
    });

    // ポップアップを閉じる
    const panel = document.getElementById("item-sets-panel");
    if (panel) panel.classList.remove("visible");
  }

  function setupRecommendedItemsPanel() {
    const panel = document.getElementById("recommended-items-panel");
    if (!panel || !RecommendedItems) return;

    panel.innerHTML = `
      <h3><i class="fas fa-clipboard-list"></i> 技能ごとの必須/推奨アイテムリスト</h3>
      <div id="recommended-items-table-wrapper">
        <table id="recommended-items-table">
          <thead>
            <tr>
              <th>技能</th>
              <th>アイテム</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    `;

    const tableBody = panel.querySelector("tbody");
    const groupedItems = RecommendedItems.reduce((acc, item) => {
      acc[item.skill] = acc[item.skill] || [];
      acc[item.skill].push(item);
      return acc;
    }, {});

    for (const skill in groupedItems) {
      const items = groupedItems[skill];
      const row = document.createElement("tr");

      const skillCell = document.createElement("td");
      skillCell.className = "skill-cell";
      skillCell.textContent = skill;
      if (items.length > 1) {
        skillCell.rowSpan = items.length;
      }
      row.appendChild(skillCell);

      appendItemCell(row, items[0]);
      tableBody.appendChild(row);

      for (let i = 1; i < items.length; i++) {
        const subsequentRow = document.createElement("tr");
        appendItemCell(subsequentRow, items[i]);
        tableBody.appendChild(subsequentRow);
      }
    }
  }

  function appendItemCell(tr, itemData) {
    const itemCell = document.createElement("td");
    itemCell.className = "item-cell";

    const itemNameSpan = document.createElement("span");
    itemNameSpan.className = "item-name";
    itemNameSpan.textContent = itemData.item;

    // CSSで制御するため、クラスを付与
    if (itemData.required) {
      itemNameSpan.classList.add("required");
    }
    itemCell.appendChild(itemNameSpan);

    if (itemData.anchor) {
      const anchorLink = document.createElement("a");
      anchorLink.href = itemData.anchor;
      anchorLink.className = "small-button action-btn";
      anchorLink.textContent = "選択へ";
      anchorLink.addEventListener("click", (e) => {
        e.preventDefault();
        document
          .querySelector(itemData.anchor)
          ?.scrollIntoView({ behavior: "smooth" });
        document
          .getElementById("recommended-items-panel")
          .classList.remove("visible");
      });
      itemCell.appendChild(anchorLink);
    } else if (itemData.name) {
      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "small-button action-btn";
      addButton.textContent = "追加";
      addButton.addEventListener("click", () =>
        handleRecommendedItemAdd(itemData.name),
      );
      itemCell.appendChild(addButton);
    }
    tr.appendChild(itemCell);
  }

  function handleRecommendedItemAdd(itemName) {
    const itemMaster = Object.values(Items)
      .flatMap((category) => Object.values(category).flat())
      .find((i) => i.name === itemName);

    if (!itemMaster) return;

    const newRowData = {
      name: itemName,
      freeName: itemName,
      unitPrice: itemMaster.price || 0,
      quantity: 1,
      effect: itemMaster.note || "",
    };

    const allItemRows = Array.from(
      document.querySelectorAll("#items-container .item-row"),
    );
    const emptySlot = allItemRows.find((row) => {
      const nameInput = row.querySelector(".item-name-free");
      return !nameInput.value.trim(); // input の値が空であれば空きスロット
    });

    if (emptySlot) {
      // 空きスロットを埋める
      const nameInput = emptySlot.querySelector(".item-name-free");
      nameInput.value = newRowData.name;
      // input イベントを発火させて、プルダウンのフィルタリングと関連情報の更新をトリガー
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
      nameInput.dispatchEvent(new Event("change", { bubbles: true })); // handleItemNameChange をトリガー
    } else {
      // 末尾に追加
      addItemRow(newRowData);
    }
  }
  // ★★★ここまで追加★★★


  // ==========================================================================
  // キャラシ分析機能
  // ==========================================================================
  const charAnalysisSkillMap = {
    lvFig: { name: "ファイター" },
    lvGra: { name: "グラップラー" },
    lvFen: { name: "フェンサー" },
    lvSho: { name: "シューター" },
    lvSor: { name: "ソーサラー", magicKey: "magicPowerSor" },
    lvCon: { name: "コンジャラー", magicKey: "magicPowerCon" },
    lvWiz: { name: "ウィザード", magicKey: "magicPowerWiz" },
    lvPri: { name: "プリースト", magicKey: "magicPowerPri" },
    lvFai: { name: "フェアリーテイマー", magicKey: "magicPowerFai" },
    lvMag: { name: "マギテック", magicKey: "magicPowerMag" },
    lvSco: { name: "スカウト" },
    lvRan: { name: "レンジャー" },
    lvSag: { name: "セージ" },
    lvEnh: { name: "エンハンサー" },
    lvBar: { name: "バード" },
    lvRid: { name: "ライダー" },
    lvAlc: { name: "アルケミスト", magicKey: "magicPowerAlc" },
    lvDru: { name: "ドルイド", magicKey: "magicPowerDru" },
    lvDem: { name: "デーモンルーラー", magicKey: "magicPowerDem" },
    lvWar: { name: "ウォーリーダー" },
    lvMys: { name: "ミスティック", magicKey: "magicPowerMys" },
    lvPhy: { name: "フィジカルマスター" },
    lvGri: { name: "グリモワール", magicKey: "magicPowerGri" },
    lvAri: { name: "アリストクラシー" },
    lvArt: { name: "アーティザン" },
    lvGeo: { name: "ジオマンサー" },
    lvAby: { name: "アビスゲイザー", magicKey: "magicPowerAby" },
    lvDar: { name: "ダークハンター", magicKey: "magicPowerDar" },
    lvBib: { name: "ビブリオマンサー", magicKey: "magicPowerBib" },
  };

  const charAnalysisSkillAliases = {
    Fig: "ファイター",
    Gra: "グラップラー",
    Fen: "フェンサー",
    Sho: "シューター",
    Sor: "ソーサラー",
    Con: "コンジャラー",
    Wiz: "ウィザード",
    Pri: "プリースト",
    Fai: "フェアリーテイマー",
    Mag: "マギテック",
    Sco: "スカウト",
    Ran: "レンジャー",
    Sag: "セージ",
    Enh: "エンハンサー",
    Bar: "バード",
    Rid: "ライダー",
    Alc: "アルケミスト",
    Dru: "ドルイド",
    Dem: "デーモンルーラー",
    War: "ウォーリーダー",
    Mys: "ミスティック",
    Phy: "フィジカルマスター",
    Gri: "グリモワール",
    Ari: "アリストクラシー",
    Art: "アーティザン",
    Geo: "ジオマンサー",
    Aby: "アビスゲイザー",
    Dar: "ダークハンター",
    Bib: "ビブリオマンサー",
  };

  const charAnalysisMagicPowerAliases = {
    Sor: "ソーサラー",
    Con: "コンジャラー",
    Wiz: "ウィザード",
    Pri: "プリースト",
    Fai: "フェアリーテイマー",
    Mag: "マギテック",
    Dru: "ドルイド",
    Dem: "デーモンルーラー",
    Aby: "アビスゲイザー",
    Gri: "グリモワール",
    Bar: "バード",
    Alc: "アルケミスト",
    Mys: "ミスティック",
    Bib: "ビブリオマンサー",
    Dar: "ダークハンター",
    Fug: "フィジカルマスター",
    Juj: "呪術",
    Rik: "操気",
    Wlk: "ウォーロック",
  };

  function isCharAnalysisFinalMagicPowerKey(key) {
    if (!/^magicPower[A-Z]/.test(key)) return false;
    return !/^magicPower(?:Add|Own|Equip)/.test(key);
  }

  function getCharAnalysisElements() {
    return {
      url: document.getElementById("char-analysis-url"),
      load: document.getElementById("char-analysis-load-btn"),
      run: document.getElementById("char-analysis-run-btn"),
      copy: document.getElementById("char-analysis-copy-btn"),
      status: document.getElementById("char-analysis-status"),
      overview: document.getElementById("char-analysis-overview"),
      weapons: document.getElementById("char-analysis-weapons"),
      defense: document.getElementById("char-analysis-defense"),
      defenseInline: document.getElementById("char-analysis-defense-inline"),
      spells: document.getElementById("char-analysis-spells"),
      effects: document.getElementById("char-analysis-effects"),
      adjusted: document.getElementById("char-analysis-adjusted"),
      enemyUrl: document.getElementById("char-analysis-enemy-url"),
      enemyLoad: document.getElementById("char-analysis-enemy-load-btn"),
      enemyPart: document.getElementById("char-analysis-enemy-part-select"),
      enemyPartStatus: document.getElementById("char-analysis-enemy-part-status"),
      enemyActions: document.getElementById("char-analysis-enemy-actions"),
      battleMode: document.getElementById("char-analysis-battle-mode"),
      controlsCard: document.querySelector("#panel-character-analysis .analysis-controls-card"),
      results: document.getElementById("char-analysis-results"),
      copyOutput: document.getElementById("char-analysis-copy-output"),
    };
  }



  function updateCharAnalysisBattleModeUi(mode = getCharAnalysisSettings().battleMode) {
    const normalized = mode === "defense" ? "defense" : (mode === "scout" ? "scout" : "attack");
    const panel = document.getElementById("panel-character-analysis");
    const controlsCard = panel?.querySelector(".analysis-controls-card");
    if (controlsCard) {
      controlsCard.dataset.analysisBattleMode = normalized;
      controlsCard.classList.toggle("is-defense-mode", normalized === "defense");
      controlsCard.classList.toggle("is-scout-mode", normalized === "scout");
      controlsCard.classList.toggle("is-attack-mode", normalized === "attack");
    }
    if (panel) {
      panel.classList.toggle("is-defense-mode", normalized === "defense");
      panel.classList.toggle("is-scout-mode", normalized === "scout");
      panel.classList.toggle("is-attack-mode", normalized === "attack");
    }
  }

  function setCharAnalysisResultsVisible(visible) {
    const { results } = getCharAnalysisElements();
    if (!results) return;
    results.classList.toggle("is-analysis-hidden", !visible);
  }

  function setCharAnalysisStatus(message, type = "info") {
    const { status } = getCharAnalysisElements();
    if (!status) return;
    status.textContent = message || "";
    status.className = `analysis-status ${type}`;
  }

  function escapeAnalysisHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderAnalysisDaggerHtml(value) {
    return escapeAnalysisHtml(value).replace(/†/g, '<span class="analysis-symbol-dagger">†</span>');
  }

  const sw25AnalysisIconLabels = {
    "魔": "魔法のアイテム",
    "刃": "刃武器",
    "斬": "斬撃武器",
    "打": "打撃武器",
    "特": "地方特産品",
    "流": "流派アイテム",
    "ア": "アルフレイム大陸由来の流派アイテム",
    "テ": "テラスティア大陸由来の流派アイテム",
    "常": "常時型",
    "準": "戦闘準備型",
    "主": "主動作型",
    "補": "補助動作型",
    "宣": "宣言型",
    "⤴": "高揚の楽素",
    "↑": "高揚の楽素",
    "⤵": "鎮静の楽素",
    "↓": "鎮静の楽素",
    "♡": "魅惑の楽素",
  };

  const sw25AnalysisIconAliases = {
    "↑": "⤴",
    "↓": "⤵",
  };

  const sw25AnalysisItemIconUrls = {
    "魔": "https://yutorize.work/ytsheet/_core/skin/sw2/img/item_magic.png",
    "刃": "https://yutorize.work/ytsheet/_core/skin/sw2/img/item_edge.png",
    "斬": "https://yutorize.work/ytsheet/_core/skin/sw2/img/item_edge.png",
    "打": "https://yutorize.work/ytsheet/_core/skin/sw2/img/item_blow.png",
    "特": "https://yutorize.work/ytsheet/_core/skin/sw2/img/item_local.png",
    "流": "https://yutorize.work/ytsheet/_core/skin/sw2/img/item_school.png",
    "ア": "https://yutorize.work/ytsheet/_core/skin/sw2/img/item_school_a.png",
    "テ": "https://yutorize.work/ytsheet/_core/skin/sw2/img/item_school_t.png",
  };

  function sw25AnalysisIconClassKey(value) {
    return String(value || "")
      .normalize("NFKC")
      .replace("⤴", "up")
      .replace("↑", "up")
      .replace("⤵", "down")
      .replace("↓", "down")
      .replace("♡", "heart")
      .replace(/[^A-Za-z0-9一-龠ぁ-んァ-ヶー]/g, "-");
  }

  function renderSw25AnalysisIconHtml(raw, extraClass = "") {
    const key = sw25AnalysisIconAliases[raw] || raw;
    const label = sw25AnalysisIconLabels[key] || sw25AnalysisIconLabels[raw] || key;
    const url = sw25AnalysisItemIconUrls[key];
    if (url) {
      return `<img class="sw25-analysis-icon sw25-analysis-item-icon ${escapeAnalysisHtml(extraClass)}" src="${escapeAnalysisHtml(url)}" alt="[${escapeAnalysisHtml(raw)}]" title="${escapeAnalysisHtml(label)}" loading="lazy" decoding="async">`;
    }
    const classKey = sw25AnalysisIconClassKey(key);
    return `<span class="sw25-analysis-icon sw25-analysis-system-icon sw25-analysis-system-icon-${escapeAnalysisHtml(classKey)} ${escapeAnalysisHtml(extraClass)}" title="${escapeAnalysisHtml(label)}" aria-label="${escapeAnalysisHtml(label)}"><span class="raw">[${escapeAnalysisHtml(raw)}]</span></span>`;
  }

  function renderSw25DecoratedNameText(name) {
    // Native select の option には HTML や画像を入れられないため、
    // ゆとシート風アイコンの代替として文字幅の小さい記号へ置き換える。
    const textIcons = {
      "魔": "◆",
      "刃": "🗡",
      "斬": "🗡",
      "打": "◆",
      "特": "特",
      "流": "流",
      "ア": "ア",
      "テ": "テ",
      "常": "常",
      "準": "準",
      "主": "主",
      "補": "補",
      "宣": "宣",
      "⤴": "⤴",
      "↑": "⤴",
      "⤵": "⤵",
      "↓": "⤵",
      "♡": "♡",
    };
    return String(name || "").replace(/\[([^\]]+)\]/g, (token, raw) => {
      const key = sw25AnalysisIconAliases[raw] || raw;
      if (!sw25AnalysisIconLabels[key] && !sw25AnalysisIconLabels[raw]) return token;
      return textIcons[key] || textIcons[raw] || raw;
    });
  }

  function renderSw25DecoratedNameHtml(name) {
    return escapeAnalysisHtml(name).replace(/\[([^\]]+)\]/g, (token, raw) => {
      const key = sw25AnalysisIconAliases[raw] || raw;
      if (!sw25AnalysisIconLabels[key] && !sw25AnalysisIconLabels[raw]) return token;
      return renderSw25AnalysisIconHtml(raw);
    });
  }

  function toAnalysisNumber(value, fallback = 0) {
    if (value === null || value === undefined || value === "") return fallback;
    const normalized = String(value)
      .replace(/[＋]/g, "+")
      .replace(/[－−]/g, "-")
      .replace(/[^0-9+\-.]/g, "");
    const match = normalized.match(/[+-]?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : fallback;
  }

  function getAnalysisValue(source, keys, fallback = "") {
    const roots = [source, source?.data, source?.character, source?.pc, source?.sheet];
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const root of roots) {
      if (!root || typeof root !== "object") continue;
      for (const key of keyList) {
        if (Object.prototype.hasOwnProperty.call(root, key) && root[key] !== "") {
          return root[key];
        }
      }
    }
    return fallback;
  }

  function parseCharAnalysisJson(rawText) {
    const text = String(rawText || "").trim();
    if (!text) throw new Error("JSONが空です。");
    try {
      return JSON.parse(text);
    } catch (jsonError) {
      const jsonp = text.match(/^[\w$.]+\s*\(\s*([\s\S]*)\s*\)\s*;?$/);
      if (jsonp) return JSON.parse(jsonp[1]);
      throw jsonError;
    }
  }

  function buildYtsheetJsonUrl(rawUrl, callbackName = "") {
    const url = new URL(rawUrl, window.location.href);
    if (!url.searchParams.has("mode")) url.searchParams.set("mode", "json");
    if (callbackName) url.searchParams.set("callback", callbackName);
    // 別キャラを読み込み直したときに古いJSON/JSONPを掴まないよう、取得ごとにキャッシュを避ける。
    url.searchParams.set("_sw25ts", String(Date.now()));
    return url.toString();
  }

  function fetchCharAnalysisJsonp(rawUrl) {
    return new Promise((resolve, reject) => {
      const callbackName = `__sw25CharAnalysisJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement("script");
      let settled = false;
      const cleanup = () => {
        settled = true;
        try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
        script.remove();
      };
      const timer = window.setTimeout(() => {
        if (settled) return;
        cleanup();
        reject(new Error("JSONP timeout"));
      }, 12000);
      window[callbackName] = (data) => {
        if (settled) return;
        window.clearTimeout(timer);
        cleanup();
        resolve(data);
      };
      script.onerror = () => {
        if (settled) return;
        window.clearTimeout(timer);
        cleanup();
        reject(new Error("JSONP load failed"));
      };
      script.src = buildYtsheetJsonUrl(rawUrl, callbackName);
      document.head.appendChild(script);
    });
  }

  async function handleLoadedCharAnalysisJson(parsed, sourceUrl = "", rawText = "") {
    if (isMonsterSheetJson(parsed)) {
      applyEnemySheetToAnalysis(parsed);
      const { enemyUrl } = getCharAnalysisElements();
      if (enemyUrl && sourceUrl && !enemyUrl.value.trim()) enemyUrl.value = sourceUrl;
      if (charAnalysisCurrent) renderCharAnalysis();
      setCharAnalysisStatus("敵シートが入力されたため、敵データ側へ反映しました。PCのゆとシートURLを入力してください。", "info");
      showToast("敵シートを敵データ側へ反映しました。");
      return;
    }
    charAnalysisRawText = rawText || JSON.stringify(parsed);
    setCharAnalysisStatus("JSONを取得しました。分析を実行しています。", "info");
    showToast("キャラクターJSONを読み込みました！");
    if (!charAnalysisCsvRows.length) await initializeCharAnalysisCsv();
    runCharAnalysis();
  }

  async function loadCharAnalysisFromUrl() {
    const { url } = getCharAnalysisElements();
    if (!url || !url.value.trim()) {
      setCharAnalysisStatus("ゆとシートURLを入力してください。", "error");
      return;
    }
    const rawUrl = url.value.trim();
    try {
      const jsonUrl = buildYtsheetJsonUrl(rawUrl);
      setCharAnalysisStatus("JSON取得を試行しています。直接取得に失敗した場合はJSONPで再試行します。", "info");
      try {
        const response = await fetch(jsonUrl, { mode: "cors" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        await handleLoadedCharAnalysisJson(parseCharAnalysisJson(text), rawUrl, text);
        return;
      } catch (fetchError) {
        console.warn("fetchでのキャラシ取得に失敗。JSONPへフォールバックします:", fetchError);
        setCharAnalysisStatus("直接取得に失敗しました。JSONPで再試行しています。", "info");
        const parsed = await fetchCharAnalysisJsonp(rawUrl);
        await handleLoadedCharAnalysisJson(parsed, rawUrl, JSON.stringify(parsed));
      }
    } catch (error) {
      console.warn("キャラシURL取得に失敗:", error);
      setCharAnalysisStatus("URLからキャラクターデータを取得できませんでした。ゆとシート側の公開設定、URL、またはCORS/JSONP制約を確認してください。", "error");
      showToast("URL取得に失敗しました。");
    }
  }


  function setCharAnalysisInputValue(id, value) {
    const input = document.getElementById(id);
    if (!input) return;
    input.value = value === null || value === undefined || Number.isNaN(value) ? "" : String(value);
  }

  function readMonsterCheckBase(data, baseKey, fixedKey) {
    const base = toAnalysisNumber(data?.[baseKey], NaN);
    if (isFiniteAnalysisNumber(base)) return base;
    const fixed = toAnalysisNumber(data?.[fixedKey], NaN);
    if (isFiniteAnalysisNumber(fixed)) return Math.max(0, fixed - 7);
    return "";
  }

  function readMonsterDamageBonus(data, key = "status1Damage") {
    const text = String(data?.[key] || "");
    const match = text.match(/2\s*d\s*([+＋\-－−]\s*\d+)/i);
    if (match) return toAnalysisNumber(match[1], "");
    const num = toAnalysisNumber(text, NaN);
    return isFiniteAnalysisNumber(num) ? num : "";
  }

  function isMonsterSheetJson(data) {
    if (!data || typeof data !== "object") return false;
    if (String(data.type || "").toLowerCase() === "m") return true;
    if (data.taxa || data.statusNum || data.partsNum || data.status1Evasion || data.status1Hp) return true;
    return false;
  }

  function splitEnemyPartNames(data) {
    const raw = String(data?.parts || "").trim();
    if (!raw) return [];
    return raw.split(/[／/、,]+/).map((part) => part.trim()).filter(Boolean);
  }

  function getEnemyPartDisplayName(data, index, partNames = splitEnemyPartNames(data)) {
    const fromParts = partNames[index - 1];
    if (fromParts) return fromParts;
    const style = String(data?.[`status${index}Style`] || "").trim();
    const paren = style.match(/[（(]([^）)]+)[）)]/);
    if (paren?.[1]) return paren[1].trim();
    return style || `部位${index}`;
  }

  function readMonsterCheckBaseForIndex(data, index, baseName, fixedName) {
    return readMonsterCheckBase(data, `status${index}${baseName}`, `status${index}${fixedName}`);
  }

  function createEmptyEnemyScoutLoreInfo() {
    return { knowledge: "", weaknessValue: "", weaknessText: "", initiative: "", sourceName: "" };
  }

  function decodeAnalysisPlainText(value) {
    let text = String(value ?? "");
    for (let i = 0; i < 2; i += 1) {
      text = text.replace(/<br\s*\/?\s*>/gi, "\n");
      if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.innerHTML = text;
        text = textarea.value;
      }
    }
    return text.replace(/<br\s*\/?\s*>/gi, "\n").replace(/&nbsp;/g, " ");
  }

  function findAnalysisValueByKeyPattern(data, patterns) {
    if (!data || typeof data !== "object") return "";
    const entries = Object.entries(data);
    for (const pattern of patterns) {
      const hit = entries.find(([key, value]) => value !== "" && value !== null && value !== undefined && pattern.test(String(key)));
      if (hit) return hit[1];
    }
    return "";
  }

  function extractEnemyScoutLoreInfo(data) {
    if (!data || typeof data !== "object") return createEmptyEnemyScoutLoreInfo();
    const info = createEmptyEnemyScoutLoreInfo();
    info.sourceName = data.characterName || data.name || data.id || "";
    const entries = Object.entries(data);
    const joinedKnowledgeText = entries
      .filter(([key]) => /(reputation|knowledge|lore|weak|知名|弱点|魔物知識|先制|initiative|first)/i.test(String(key)))
      .map(([key, value]) => `${key}:${decodeAnalysisPlainText(value)}`)
      .join("\n");
    const pairSource = [
      data.knowledge,
      data.monsterKnowledge,
      data.knowledgeWeakness,
      data.knowledgeValue,
      data.reputation,
      data["reputation+"],
      data.weaknessValue,
      data.lore,
      data["知名度／弱点値"],
      data["知名度/弱点値"],
      joinedKnowledgeText,
    ].map(decodeAnalysisPlainText).join("\n");
    const pair = pairSource.match(/(?:知名度|魔物知識)?[^0-9]{0,12}(\d{1,3})\s*[\/／]\s*(\d{1,3})/);
    if (pair) {
      info.knowledge = toAnalysisNumber(pair[1], "");
      info.weaknessValue = toAnalysisNumber(pair[2], "");
    }
    if (info.knowledge === "") {
      info.knowledge = toAnalysisNumber(findAnalysisValueByKeyPattern(data, [/^(reputation|knowledge|monsterLore|lore)$/i, /知名度/, /魔物知識/]), "");
    }
    if (info.weaknessValue === "") {
      const value = findAnalysisValueByKeyPattern(data, [/^(reputation\+|weaknessValue|weaknessTarget|weaknessPoint)$/i, /weakness.*(value|target|point)/i, /(弱点値|弱点達成値)/]);
      const num = String(value || "").match(/\d{1,3}/);
      if (num) info.weaknessValue = toAnalysisNumber(num[0], "");
    }
    const initiativeRaw = findAnalysisValueByKeyPattern(data, [/^(initiative|initiativeValue|firstStrike)$/i, /(先制値|先制)/]);
    if (initiativeRaw !== "") {
      const match = String(initiativeRaw).match(/\d{1,3}/);
      info.initiative = match ? toAnalysisNumber(match[0], "") : toAnalysisNumber(initiativeRaw, "");
    }
    const weaknessRaw = findAnalysisValueByKeyPattern(data, [/^weakness$/i, /^weaknessName$/i, /^weaknessNote$/i, /弱点(?!値)/]);
    if (weaknessRaw !== "") {
      const decoded = decodeAnalysisPlainText(weaknessRaw).replace(/\s+/g, " ").trim();
      if (decoded && !/^\d+\s*[\/／]\s*\d+$/.test(decoded)) info.weaknessText = decoded;
    }
    if (!info.weaknessText) {
      const weakLine = joinedKnowledgeText.split(/\n+/).find((line) => /弱点/.test(line) && !/弱点値/.test(line) && /(\+|点|ダメージ|属性)/.test(line));
      if (weakLine) info.weaknessText = weakLine.replace(/^.*?[:：]/, "").trim();
    }
    return info;
  }

  function setCharAnalysisTextInputValue(id, value) {
    const input = document.getElementById(id);
    if (!input) return;
    input.value = value === null || value === undefined ? "" : String(value);
  }

  function applyEnemyScoutLoreInfoToInputs(info = charAnalysisEnemyScoutLore) {
    setCharAnalysisTextInputValue("char-analysis-enemy-knowledge", info?.knowledge ?? "");
    setCharAnalysisTextInputValue("char-analysis-enemy-weakness-value", info?.weaknessValue ?? "");
    setCharAnalysisTextInputValue("char-analysis-enemy-weakness-text", info?.weaknessText ?? "");
    setCharAnalysisTextInputValue("char-analysis-enemy-initiative-target", info?.initiative ?? "");
  }

  function extractEnemySheetParts(data) {
    if (!data || typeof data !== "object") return [];
    const statusCount = Math.max(1, Math.min(12, toAnalysisNumber(data.statusNum || data.partsNum, 1) || 1));
    const partNames = splitEnemyPartNames(data);
    const parts = [];
    for (let index = 1; index <= statusCount; index += 1) {
      const hp = toAnalysisNumber(data[`status${index}Hp`], NaN);
      const mp = toAnalysisNumber(data[`status${index}Mp`], NaN);
      const def = toAnalysisNumber(data[`status${index}Defense`], NaN);
      const eva = readMonsterCheckBaseForIndex(data, index, "Evasion", "EvasionFix");
      const hit = readMonsterCheckBaseForIndex(data, index, "Accuracy", "AccuracyFix");
      const damage = readMonsterDamageBonus(data, `status${index}Damage`);
      if (![hp, mp, def, eva, hit, damage].some((value) => value !== "" && isFiniteAnalysisNumber(value))) continue;
      parts.push({
        index,
        name: getEnemyPartDisplayName(data, index, partNames),
        style: String(data[`status${index}Style`] || "").trim(),
        eva,
        def: isFiniteAnalysisNumber(def) ? def : 0,
        hp: isFiniteAnalysisNumber(hp) ? hp : "",
        mp: isFiniteAnalysisNumber(mp) ? mp : "",
        hit,
        damage,
        vit: readMonsterCheckBase(data, "vitResist", "vitResistFix"),
        mnd: readMonsterCheckBase(data, "mndResist", "mndResistFix"),
      });
    }
    if (parts.length) return parts;
    return [{
      index: 1,
      name: data.characterName || data.name || "本体",
      style: "",
      eva: readMonsterCheckBase(data, "status1Evasion", "status1EvasionFix"),
      def: toAnalysisNumber(data.status1Defense ?? data.defense ?? data.protection, 0),
      hp: toAnalysisNumber(data.status1Hp ?? data.hp, ""),
      mp: toAnalysisNumber(data.status1Mp ?? data.mp, ""),
      hit: readMonsterCheckBase(data, "status1Accuracy", "status1AccuracyFix"),
      damage: readMonsterDamageBonus(data),
      vit: readMonsterCheckBase(data, "vitResist", "vitResistFix"),
      mnd: readMonsterCheckBase(data, "mndResist", "mndResistFix"),
    }];
  }

  const enemyMagicSystemToSkillFallback = {
    "真語魔法": "ソーサラー",
    "操霊魔法": "コンジャラー",
    "深智魔法": "ウィザード",
    "神聖魔法": "プリースト",
    "妖精魔法": "フェアリーテイマー",
    "魔動機術": "マギテック",
    "森羅魔法": "ドルイド",
    "召異魔法": "デーモンルーラー",
    "奈落魔法": "アビスゲイザー",
  };

  const enemyMagicSystemNames = Object.keys(enemyMagicSystemToSkillFallback);

  function decodeEnemySkillText(text) {
    let value = String(text || "");
    for (let i = 0; i < 2; i += 1) {
      value = value.replace(/<br\s*\/?\s*>/gi, "\n");
      const textarea = document.createElement("textarea");
      textarea.innerHTML = value;
      value = textarea.value;
    }
    return value
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/'''/g, "")
      .replace(/［/g, "[")
      .replace(/］/g, "]")
      .replace(/[〇◯]/g, "○")
      .replace(/\r/g, "\n");
  }

  function splitEnemySkillBlocks(skillsText) {
    const lines = decodeEnemySkillText(skillsText)
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    const blocks = [];
    let current = null;
    let currentPart = "";
    const pushCurrent = () => {
      if (current) blocks.push(current);
      current = null;
    };
    lines.forEach((line) => {
      const partMatch = line.match(/^●\s*(.+)$/);
      if (partMatch) {
        pushCurrent();
        currentPart = partMatch[1].trim();
        return;
      }
      const abilityMatch = line.match(/^(?:\[([^\]]+)\]|([○▶▷☆△💬≫⏩]+))\s*(.+)$/);
      if (abilityMatch) {
        pushCurrent();
        current = {
          marker: abilityMatch[1] || abilityMatch[2] || "",
          title: abilityMatch[3].trim(),
          body: [],
          part: currentPart,
          raw: line,
        };
        return;
      }
      if (current) current.body.push(line);
    });
    pushCurrent();
    return blocks;
  }

  function getSkillByEnemyMagicSystem(systemName) {
    const fromCsv = charAnalysisCsvRows.find((row) => row["系統"] === systemName && row["技能"]);
    return fromCsv?.["技能"] || enemyMagicSystemToSkillFallback[systemName] || "";
  }

  function extractEnemyMagicAbility(block) {
    const source = `${block.title} ${block.body.join(" ")}`;
    const systemPattern = enemyMagicSystemNames.join("|");
    const regex = new RegExp(String.raw`((?:${systemPattern})(?:\s*[、・／/,]\s*(?:${systemPattern}))*)\s*(?:レベル\s*)?(\d+)\s*(?:レベル)?\s*[\/／]\s*魔力\s*(\d+)`);
    const match = source.match(regex);
    if (!match) return null;
    const systems = match[1].split(/[、・／/,]+/).map((name) => name.trim()).filter(Boolean);
    return {
      id: `enemy-magic-${systems.join("-")}-${match[2]}-${match[3]}`,
      type: "magic",
      marker: block.marker,
      part: block.part,
      systems,
      skills: systems.map(getSkillByEnemyMagicSystem).filter(Boolean),
      level: toAnalysisNumber(match[2], 0),
      power: toAnalysisNumber(match[3], 0),
      title: block.title,
      summary: block.body.join(" ").slice(0, 180),
    };
  }

  function extractEnemyMagicAbilitiesFromText(skillsText) {
    const source = decodeEnemySkillText(skillsText).replace(/\n+/g, " ");
    const systemPattern = enemyMagicSystemNames.join("|");
    const regex = new RegExp(String.raw`((?:${systemPattern})(?:\s*[、・／/,]\s*(?:${systemPattern}))*)\s*(?:レベル\s*)?(\d+)\s*(?:レベル)?\s*[\/／]\s*魔力\s*(\d+)`, "g");
    const results = [];
    for (const match of source.matchAll(regex)) {
      const systems = match[1].split(/[、・／/,]+/).map((name) => name.trim()).filter(Boolean);
      results.push({
        id: `enemy-magic-${systems.join("-")}-${match[2]}-${match[3]}`,
        type: "magic",
        marker: "○",
        part: "",
        systems,
        skills: systems.map(getSkillByEnemyMagicSystem).filter(Boolean),
        level: toAnalysisNumber(match[2], 0),
        power: toAnalysisNumber(match[3], 0),
        title: `${systems.join("・")} ${match[2]}レベル／魔力${match[3]}`,
        summary: "敵能力欄から横断抽出",
      });
    }
    return results;
  }

  function normalizeEnemyAbilityText(text) {
    return String(text || "")
      .replace(/[／]/g, "/")
      .replace(/[（]/g, "(")
      .replace(/[）]/g, ")")
      .replace(/[＋]/g, "+")
      .replace(/[－−]/g, "-")
      .replace(/[Ｄｄ]/g, "d")
      .replace(/[×]/g, "x")
      .replace(/　/g, " ")
      .trim();
  }

  function parseEnemyDamageExpression(text) {
    const normalized = normalizeEnemyAbilityText(text);
    const quoteMatch = normalized.match(/[「"]\s*([^「」"]*?\d+\s*d[^「」"]*?)(?:点|の|を|$)/i);
    const rawExpr = quoteMatch?.[1] || normalized.match(/(\d+\s*d\s*(?:x\s*[^+、。]+)?\s*(?:[+\-]\s*\d+)?)/i)?.[1] || "";
    if (!rawExpr) return { expr: "", dice: "", bonus: "", variable: false };
    const expr = rawExpr.replace(/\s+/g, "").replace(/d/i, "D").replace(/x/g, "×");
    const simple = expr.match(/^(\d+)D([+\-]\d+)?$/);
    return {
      expr,
      dice: simple ? `${simple[1]}D` : "",
      bonus: simple && simple[2] ? toAnalysisNumber(simple[2], "") : "",
      variable: !simple,
    };
  }

  function formatEnemyDamageDisplay(item) {
    if (item.damageExpr) return item.damageExpr;
    if (item.damage !== "" && item.damage !== null && item.damage !== undefined) return `2D${formatSigned(item.damage)}`;
    return "ダメージ不明";
  }

  function parseEnemySpecialAttack(block) {
    const heading = normalizeEnemyAbilityText(block.title);
    const headMatch = heading.match(/^(.+?)\s*\/\s*(?:(必中)|(\d+)(?:\((\d+)\))?)\s*(?:\/\s*([^\/]+?)\s*\/\s*([^\/]+))?$/);
    if (!headMatch) return null;
    const text = normalizeEnemyAbilityText(block.body.join(" "));
    const damageInfo = parseEnemyDamageExpression(text);
    const damageType = /魔法ダメージ/.test(text) ? "魔法" : (/物理ダメージ|ガンによる|打撃点/.test(text) ? "物理" : (/確定ダメージ/.test(text) ? "確定" : "-"));
    const rangeMatch = text.match(/(?:射程[:：]\s*|射程\/形状[:：]\s*|「射程\/)([^。\]、]+(?:\/[^。\]、]+)?)/);
    const notes = [];
    if (/防護の半分/.test(text)) notes.push("防護点の半分を加算");
    if (/ダメージは[^。]*対象の数で分割/.test(text)) notes.push("対象数で分割");
    if (/回復魔法の効果が半減/.test(text)) notes.push("回復効果半減");
    if (damageInfo.variable) notes.push("変動式");
    return {
      id: `enemy-special-${normalizeAnalysisName(headMatch[1])}-${headMatch[3] || headMatch[2] || "auto"}-${block.part || "all"}`,
      type: "special",
      marker: block.marker,
      part: block.part,
      name: headMatch[1].trim(),
      base: headMatch[2] ? "必中" : toAnalysisNumber(headMatch[3], 0),
      fixed: headMatch[4] ? toAnalysisNumber(headMatch[4], 0) : "",
      oppose: headMatch[2] ? "必中" : (headMatch[5] || "-").trim(),
      result: headMatch[2] ? "必中" : (headMatch[6] || "-").trim(),
      damage: damageInfo.bonus,
      damageExpr: damageInfo.expr,
      damageDice: damageInfo.dice,
      damageVariable: damageInfo.variable,
      damageType,
      range: rangeMatch?.[1]?.trim() || "-",
      note: notes.join(" / "),
      summary: text.slice(0, 220),
    };
  }


  const enemyTechniqueEffectDefinitions = [
    { names: ["キャッツアイ"], bonuses: [{ type: "hit", label: "命中", value: 1 }] },
    { names: ["デーモンフィンガー"], bonuses: [{ type: "hit", label: "命中", value: 1 }] },
    { names: ["マッスルベアー"], bonuses: [{ type: "damage", label: "打撃点", value: 2 }] },
    { names: ["ジャイアントアーム"], bonuses: [{ type: "damage", label: "打撃点", value: 2 }] },
    { names: ["ガゼルフット"], bonuses: [{ type: "eva", label: "回避", value: 1 }] },
    { names: ["ケンタウロスレッグ"], bonuses: [{ type: "eva", label: "回避", value: 1 }] },
    { names: ["ビートルスキン"], bonuses: [{ type: "def", label: "防護", value: 2 }] },
  ];

  const enemyTechniqueKnownNames = [
    "キャッツアイ", "デーモンフィンガー", "マッスルベアー", "ジャイアントアーム",
    "ガゼルフット", "ケンタウロスレッグ", "ビートルスキン", "チックチック", "スケイルレギンス",
    "スフィンクスノレッジ", "ワイドウィング", "ファイアブレス", "バルーンシードショット", "フェンリルバイト",
    "リカバリィ", "ケンタウロスレッグ", "メディテーション", "アンチボディ", "ストロングブラッド",
  ];

  function getEnemyTechniqueDefinition(name) {
    const normalized = normalizeAnalysisName(name);
    return enemyTechniqueEffectDefinitions.find((definition) => definition.names.some((candidate) => normalizeAnalysisName(candidate) === normalized));
  }

  function extractEnemyTechniqueNamesFromText(text) {
    const normalized = normalizeEnemyAbilityText(text)
      .replace(/[【】]/g, " ")
      .replace(/[「」『』《》]/g, " ")
      .replace(/[，]/g, "、");
    const names = [];
    enemyTechniqueKnownNames.forEach((name) => {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(escaped).test(normalized)) names.push(name);
    });
    return [...new Set(names)];
  }

  function extractEnemySupportEffects(block) {
    const marker = normalizeEnemyAbilityText(block.marker);
    const source = normalizeEnemyAbilityText(`${block.title} ${block.body.join(" ")}`);
    const isTechniqueBlock = /練技|練体士|エンハンサー/.test(source) || /補|△|☆|▶/.test(marker);
    const techniqueNames = extractEnemyTechniqueNamesFromText(source);
    if (!isTechniqueBlock || !techniqueNames.length) return null;
    const techniques = techniqueNames.map((name) => {
      const definition = getEnemyTechniqueDefinition(name);
      return {
        name: definition?.canonical || name,
        rawName: name,
        bonuses: definition?.bonuses || [],
        reflected: Boolean(definition?.bonuses?.length),
      };
    });
    const bonuses = techniques.flatMap((technique) => technique.bonuses);
    return {
      id: `enemy-support-${normalizeAnalysisName(block.title)}-${block.part || "all"}`,
      type: "support",
      marker: block.marker,
      part: block.part,
      name: block.title,
      techniques,
      bonuses,
      summary: source.slice(0, 220),
    };
  }

  function calculateEnemySupportTotals(actions = charAnalysisEnemyActions) {
    const totals = { hit: 0, damage: 0, eva: 0, def: 0 };
    (actions.support || []).forEach((effect) => {
      (effect.bonuses || []).forEach((bonus) => {
        totals[bonus.type] = (totals[bonus.type] || 0) + toAnalysisNumber(bonus.value, 0);
      });
    });
    return totals;
  }

  function formatEnemySupportBonusText(bonuses = []) {
    if (!bonuses.length) return "未反映";
    return bonuses.map((bonus) => `${bonus.label}${formatSigned(bonus.value)}`).join(" / ");
  }


  function extractEnemyDeclarationFeat(block) {
    const marker = normalizeEnemyAbilityText(block.marker);
    if (marker !== "宣") return null;
    const title = normalizeEnemyAbilityText(block.title);
    const text = normalizeEnemyAbilityText(block.body.join(" "));
    const notes = [];
    const bonuses = [];
    const damageMatch = text.match(/(?:打撃点|物理ダメージ|ダメージ)[^+\-]{0,12}([+\-]\s*\d+)\s*点?/);
    if (damageMatch) {
      const value = toAnalysisNumber(damageMatch[1].replace(/\s+/g, ""), 0);
      if (value) bonuses.push({ type: "damage", label: "与ダメージ", value });
    }
    const hitMatch = text.match(/(?:命中力(?:判定)?|命中)[^+\-]{0,12}([+\-]\s*\d+)/);
    if (hitMatch) {
      const value = toAnalysisNumber(hitMatch[1].replace(/\s+/g, ""), 0);
      if (value) bonuses.push({ type: "hit", label: "命中", value });
    }
    const evaMatch = text.match(/(?:回避力(?:判定)?|回避)[^+\-]{0,12}([+\-]\s*\d+)/);
    if (evaMatch) {
      const value = toAnalysisNumber(evaMatch[1].replace(/\s+/g, ""), 0);
      if (value) bonuses.push({ type: "eva", label: "回避", value });
    }
    if (/全力攻撃/.test(title) && !bonuses.some((bonus) => bonus.type === "damage")) {
      const rank = getAnalysisFeatRank(title);
      const value = rank >= 3 ? 20 : rank >= 2 ? 12 : 4;
      bonuses.push({ type: "damage", label: "与ダメージ", value });
      notes.push("推定補正");
    }
    if (/リスク|ペナルティ/.test(text)) notes.push("リスクあり");
    return {
      id: `enemy-declaration-${normalizeAnalysisName(title)}-${block.part || "all"}`,
      type: "declaration",
      marker: block.marker,
      part: block.part,
      name: title,
      bonuses,
      note: notes.join(" / "),
      summary: text.slice(0, 220),
    };
  }

  function extractEnemySheetActions(data, parts = []) {
    const normal = parts
      .filter((part) => part.hit !== "" || part.damage !== "")
      .map((part) => ({
        id: `enemy-normal-${part.index}`,
        type: "normal",
        part: part.name,
        name: part.style || part.name || `部位${part.index}`,
        base: part.hit,
        oppose: "回避",
        result: "消滅",
        damage: part.damage,
        damageType: "物理",
        range: "近接/記載準拠",
        note: "通常攻撃",
      }));
    const blocks = splitEnemySkillBlocks(data?.skills || "");
    const magic = [];
    const special = [];
    const declarations = [];
    const support = [];
    const memos = [];
    blocks.forEach((block) => {
      const supportEffect = extractEnemySupportEffects(block);
      if (supportEffect) {
        support.push(supportEffect);
      }
      const magicAbility = extractEnemyMagicAbility(block);
      if (magicAbility) {
        magic.push(magicAbility);
        return;
      }
      const specialAttack = parseEnemySpecialAttack(block);
      if (specialAttack) {
        special.push(specialAttack);
        return;
      }
      const declarationFeat = extractEnemyDeclarationFeat(block);
      if (declarationFeat) {
        declarations.push(declarationFeat);
        return;
      }
      if (/^(常|○|◯|〇)$/.test(block.marker) || block.marker === "○") {
        memos.push({
          id: `enemy-memo-${memos.length}-${normalizeAnalysisName(block.title)}`,
          marker: block.marker,
          part: block.part,
          title: block.title,
          summary: block.body.join(" ").slice(0, 180),
        });
      }
    });
    extractEnemyMagicAbilitiesFromText(data?.skills || "").forEach((ability) => {
      if (!magic.some((item) => item.id === ability.id)) magic.push(ability);
    });
    const supportTotals = calculateEnemySupportTotals({ support });
    const adjustedNormal = normal.map((item) => ({
      ...item,
      baseRaw: item.base,
      damageRaw: item.damage,
      base: item.base === "" ? item.base : toAnalysisNumber(item.base, 0) + supportTotals.hit,
      damage: item.damage === "" ? item.damage : toAnalysisNumber(item.damage, 0) + supportTotals.damage,
      supportTotals,
    }));
    return { normal: adjustedNormal, special, declarations, support, magic, memos };
  }

  function renderEnemyActionsSummary(actions = charAnalysisEnemyActions) {
    const { enemyActions } = getCharAnalysisElements();
    if (!enemyActions) return;
    const total = (actions.normal?.length || 0) + (actions.special?.length || 0) + (actions.declarations?.length || 0) + (actions.support?.length || 0) + (actions.magic?.length || 0) + (actions.memos?.length || 0);
    if (!total) {
      enemyActions.hidden = true;
      enemyActions.innerHTML = "";
      return;
    }
    enemyActions.hidden = false;
    enemyActions.classList.remove("muted");
    const renderGroup = (title, items, renderer) => items?.length ? `<section class="analysis-enemy-action-group"><h6>${escapeAnalysisHtml(title)}</h6><div class="analysis-enemy-action-list">${items.map(renderer).join("")}</div></section>` : "";
    enemyActions.innerHTML = `<div class="analysis-enemy-action-summary">
      <strong class="analysis-enemy-action-title">敵行動候補${charAnalysisEnemySheetName ? `: ${escapeAnalysisHtml(charAnalysisEnemySheetName)}` : ""}</strong>
      ${renderGroup("通常攻撃", actions.normal, (item) => `<div class="analysis-enemy-action-card"><b>${escapeAnalysisHtml(item.name)}</b><span>${escapeAnalysisHtml(item.part || "-")} / 命中 ${escapeAnalysisHtml(formatSigned(item.base))} / 2D${escapeAnalysisHtml(formatSigned(item.damage))} ${escapeAnalysisHtml(item.damageType)}</span></div>`)}
      ${renderGroup("特殊攻撃", actions.special, (item) => `<div class="analysis-enemy-action-card"><b>${escapeAnalysisHtml(item.name)}</b><span>${escapeAnalysisHtml(item.part || "共通")} / ${escapeAnalysisHtml(item.oppose)} / ${escapeAnalysisHtml(item.result)} / ${item.base === "必中" ? "必中" : `達成値 ${escapeAnalysisHtml(formatSigned(item.base))}${item.fixed !== "" ? `（固定${escapeAnalysisHtml(item.fixed)}）` : ""}`} / ${escapeAnalysisHtml(formatEnemyDamageDisplay(item))} ${escapeAnalysisHtml(item.damageType)}</span>${item.note ? `<small>${escapeAnalysisHtml(item.note)}</small>` : ""}</div>`) }
      ${renderGroup("宣言特技", actions.declarations, (item) => `<div class="analysis-enemy-action-card is-declaration"><b>${escapeAnalysisHtml(item.name)}</b><span>${escapeAnalysisHtml(item.part || "共通")} / ${escapeAnalysisHtml(formatDeclarationBonusText(item.bonuses))}</span>${item.note ? `<small>${escapeAnalysisHtml(item.note)}</small>` : ""}</div>`)}
      ${renderGroup("敵補助効果", actions.support, (item) => `<div class="analysis-enemy-action-card is-support"><b>${escapeAnalysisHtml(item.name)}</b><span>${escapeAnalysisHtml(item.part || "共通")} / ${escapeAnalysisHtml(formatEnemySupportBonusText(item.bonuses))}</span><small>${escapeAnalysisHtml(item.techniques.map((technique) => `${technique.name}: ${formatEnemySupportBonusText(technique.bonuses)}`).join(" / "))}</small></div>`)}
      ${renderGroup("魔法能力", actions.magic, (item) => `<div class="analysis-enemy-action-card is-magic"><b>${escapeAnalysisHtml(item.systems.join("・"))} Lv${escapeAnalysisHtml(item.level)} / 魔力${escapeAnalysisHtml(item.power)}</b><span>${escapeAnalysisHtml(item.skills.join("・") || "技能不明")}として候補化</span>${item.part ? `<small>部位: ${escapeAnalysisHtml(item.part)}</small>` : ""}</div>`)}
      ${renderGroup("常時能力メモ", actions.memos.slice(0, 6), (item) => `<div class="analysis-enemy-action-card is-memo"><b>${escapeAnalysisHtml(item.title)}</b>${item.summary ? `<span>${escapeAnalysisHtml(item.summary)}</span>` : ""}</div>`)}
      <p class="analysis-note">防御モード実装用の下準備です。現段階では敵の通常攻撃・特殊攻撃・魔法能力を候補として読み取ります。</p>
    </div>`;
  }


  function renderEnemyPartSelector(parts, selectedIndex = 0) {
    const { enemyPart, enemyPartStatus } = getCharAnalysisElements();
    const safeParts = Array.isArray(parts) && parts.length ? parts : [{ name: "木人", style: "" }];
    if (enemyPart) {
      enemyPart.innerHTML = "";
      safeParts.forEach((part, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = `${part.name || "対象"}${part.style && part.style !== part.name ? `: ${part.style}` : ""}`;
        enemyPart.appendChild(option);
      });
      enemyPart.value = String(Math.min(Math.max(0, selectedIndex), safeParts.length - 1));
      enemyPart.hidden = false;
      enemyPart.removeAttribute("hidden");
    }
    if (enemyPartStatus) {
      enemyPartStatus.textContent = "";
      enemyPartStatus.hidden = true;
    }
  }

  function applyEnemyPartToAnalysis(part) {
    if (!part) return;
    const supportTotals = calculateEnemySupportTotals(charAnalysisEnemyActions);
    setCharAnalysisInputValue("char-analysis-enemy-eva", part.eva === "" ? part.eva : toAnalysisNumber(part.eva, 0) + supportTotals.eva);
    setCharAnalysisInputValue("char-analysis-enemy-def", part.def === "" ? part.def : toAnalysisNumber(part.def, 0) + supportTotals.def);
    setCharAnalysisInputValue("char-analysis-enemy-hp", part.hp);
    setCharAnalysisInputValue("char-analysis-enemy-hit", part.hit === "" ? part.hit : toAnalysisNumber(part.hit, 0) + supportTotals.hit);
    setCharAnalysisInputValue("char-analysis-enemy-damage", part.damage === "" ? part.damage : toAnalysisNumber(part.damage, 0) + supportTotals.damage);
    setCharAnalysisInputValue("char-analysis-enemy-vit", part.vit);
    setCharAnalysisInputValue("char-analysis-enemy-mnd", part.mnd);
  }

  function createPcSheetOpponentPart(data) {
    const pc = extractCharAnalysisData(data);
    const primaryWeapon = pc.weapons?.find((weapon) => weapon.name) || pc.weapons?.[0] || null;
    return {
      index: 1,
      name: pc.name || "PC",
      style: primaryWeapon?.name || "PC",
      eva: pc.defense.eva,
      def: pc.defense.def,
      hp: pc.defense.hp,
      mp: pc.defense.mp,
      hit: primaryWeapon ? primaryWeapon.acc : "",
      damage: primaryWeapon ? primaryWeapon.dmg : "",
      vit: pc.defense.vitRes,
      mnd: pc.defense.mndRes,
      sourceType: "pc",
    };
  }

  function applyEnemySheetToAnalysis(data, preferredIndex = 0) {
    if (!data || typeof data !== "object") throw new Error("敵/対戦相手JSONを読めませんでした。");
    const isMonster = isMonsterSheetJson(data);
    if (isMonster) {
      charAnalysisEnemyParts = extractEnemySheetParts(data);
      charAnalysisEnemyActions = extractEnemySheetActions(data, charAnalysisEnemyParts);
      charAnalysisEnemySheetName = data.characterName || data.name || data.id || "";
      charAnalysisEnemyScoutLore = extractEnemyScoutLoreInfo(data);
    } else {
      const pcPart = createPcSheetOpponentPart(data);
      charAnalysisEnemyParts = [pcPart];
      charAnalysisEnemyActions = { normal: [], special: [], declarations: [], support: [], magic: [], memos: [] };
      charAnalysisEnemySheetName = pcPart.name || data.characterName || data.name || data.id || "PC";
      charAnalysisEnemyScoutLore = createEmptyEnemyScoutLoreInfo();
    }
    charAnalysisSelectedEnemyPartIndex = Math.min(Math.max(0, preferredIndex), Math.max(0, charAnalysisEnemyParts.length - 1));
    renderEnemyPartSelector(charAnalysisEnemyParts, charAnalysisSelectedEnemyPartIndex);
    applyEnemyPartToAnalysis(charAnalysisEnemyParts[charAnalysisSelectedEnemyPartIndex]);
    applyEnemyScoutLoreInfoToInputs(charAnalysisEnemyScoutLore);
    renderEnemyActionsSummary(charAnalysisEnemyActions);
    return isMonster ? "enemy" : "pc";
  }

  async function loadEnemyAnalysisFromUrl() {
    const { enemyUrl } = getCharAnalysisElements();
    if (!enemyUrl || !enemyUrl.value.trim()) {
      setCharAnalysisStatus("敵/対戦相手のゆとシートURLを入力してください。", "error");
      return;
    }
    try {
      const rawUrl = enemyUrl.value.trim();
      let data;
      try {
        const jsonUrl = buildYtsheetJsonUrl(rawUrl);
        setCharAnalysisStatus("敵/対戦相手JSONを取得しています。", "info");
        const response = await fetch(jsonUrl, { mode: "cors" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        data = parseCharAnalysisJson(text);
      } catch (fetchError) {
        console.warn("敵/対戦相手URLのfetch取得に失敗。JSONPへ切替:", fetchError);
        setCharAnalysisStatus("通常取得に失敗したため、JSONPで再取得しています。", "info");
        data = await fetchCharAnalysisJsonp(rawUrl);
      }
      const loadedType = applyEnemySheetToAnalysis(data);
      if (charAnalysisCurrent) renderCharAnalysis();
      const partNote = charAnalysisEnemyParts.length > 1 ? `（${charAnalysisEnemyParts.length}部位。現在: ${charAnalysisEnemyParts[charAnalysisSelectedEnemyPartIndex]?.name || "部位1"}）` : "";
      const label = loadedType === "pc" ? "PCシートを対戦相手として" : "敵データを";
      setCharAnalysisStatus(`${label}読み込みました: ${data.characterName || data.name || data.id || "名称不明"}${partNote}`, "success");
      showToast(`${label}読み込みました！`);
    } catch (error) {
      console.warn("敵/対戦相手URL取得に失敗:", error);
      setCharAnalysisStatus(`敵/対戦相手URLからの取得に失敗しました: ${error.message}`, "error");
      showToast("敵/対戦相手URL取得に失敗しました。");
    }
  }

  async function initializeCharAnalysisCsv() {
    try {
      const response = await fetch("data/SW_特技魔法.csv");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const csvText = await response.text();
      charAnalysisCsvRows = parseCharAnalysisCsv(csvText);
      setCharAnalysisStatus(`特技・魔法CSVを読み込みました（${charAnalysisCsvRows.length}件）。`, "success");
    } catch (error) {
      console.error("SW_特技魔法.csv の読み込みに失敗:", error);
      charAnalysisCsvRows = [];
      setCharAnalysisStatus("247_guild/data/SW_特技魔法.csv の読み込みに失敗しました。配置とパスを確認してください。", "error");
    }
  }

  function parseCharAnalysisCsv(csvText) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const next = csvText[i + 1];
      if (char === '"') {
        if (inQuotes && next === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") i++;
        row.push(cell);
        if (row.some((v) => String(v).trim() !== "")) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }
    row.push(cell);
    if (row.some((v) => String(v).trim() !== "")) rows.push(row);
    if (!rows.length) return [];
    const headers = rows.shift().map((h) => h.trim());
    return rows.map((values) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = (values[index] ?? "").trim();
      });
      return obj;
    });
  }

  function extractCharAnalysisData(rawData) {
    const char = rawData?.data && typeof rawData.data === "object" ? rawData.data : rawData;
    const skills = {};
    Object.entries(charAnalysisSkillMap).forEach(([key, meta]) => {
      const level = toAnalysisNumber(getAnalysisValue(rawData, key, 0), 0);
      if (level > 0) skills[meta.name] = { level, key, magicKey: meta.magicKey || "" };
    });

    // ytsheet has aggregate/utility level fields such as lvCaster and lvCommon1.
    // Do not infer unknown lv* keys as combat skills; only the whitelist above is used.

    const magicPowers = {};
    Object.entries(skills).forEach(([skillName, skill]) => {
      if (!skill.magicKey || !isCharAnalysisFinalMagicPowerKey(skill.magicKey)) return;
      const power = toAnalysisNumber(getAnalysisValue(rawData, skill.magicKey, 0), 0);
      if (power > 0) magicPowers[skillName] = power;
    });
    Object.keys(char || {}).forEach((key) => {
      if (!isCharAnalysisFinalMagicPowerKey(key)) return;
      const suffix = key.replace(/^magicPower/, "");
      const skillName = charAnalysisMagicPowerAliases[suffix] || charAnalysisSkillAliases[suffix] || Object.keys(skills).find((name) => skills[name].magicKey === key) || `魔力${suffix}`;
      const power = toAnalysisNumber(char[key], 0);
      if (power > 0) magicPowers[skillName] = power;
    });

    const charEntries = Object.entries(char || {});
    const neckRipperCandidateText = charEntries
      .filter(([key]) => /^(cashbook|items|honorItem\d+|weapon\d+(?:Name|Note))$/.test(key))
      .map(([, value]) => value)
      .filter(Boolean)
      .join(" ");
    const hasNeckRipperCandidate = /首切り刀/.test(neckRipperCandidateText);

    const weaponCount = Math.max(0, toAnalysisNumber(getAnalysisValue(rawData, "weaponNum", 0), 0));
    const weapons = [];
    for (let i = 1; i <= Math.max(weaponCount, 12); i++) {
      const name = getAnalysisValue(rawData, `weapon${i}Name`, "");
      const acc = getAnalysisValue(rawData, `weapon${i}AccTotal`, "");
      const rate = getAnalysisValue(rawData, `weapon${i}Rate`, "");
      const crit = getAnalysisValue(rawData, `weapon${i}Crit`, "");
      const dmg = getAnalysisValue(rawData, `weapon${i}DmgTotal`, "");
      const category = getAnalysisValue(rawData, `weapon${i}Category`, "");
      const rank = getAnalysisValue(rawData, `weapon${i}Class`, "");
      const usage = getAnalysisValue(rawData, `weapon${i}Usage`, "");
      const reqd = getAnalysisValue(rawData, `weapon${i}Reqd`, "");
      const note = getAnalysisValue(rawData, `weapon${i}Note`, "");
      const hasMeaningfulWeaponData = Boolean(name || rate || crit || category || rank || note);
      if (!hasMeaningfulWeaponData) continue;
      weapons.push({
        index: i,
        name: name || `武器${i}`,
        acc: toAnalysisNumber(acc, 0),
        rate: toAnalysisNumber(rate, 0),
        crit: toAnalysisNumber(crit, 0),
        dmg: toAnalysisNumber(dmg, 0),
        category,
        rank,
        usage,
        reqd,
        note,
        display: `命中 ${formatSigned(toAnalysisNumber(acc, 0))} / k${toAnalysisNumber(rate, 0)} C${toAnalysisNumber(crit, 0)} ${formatSigned(toAnalysisNumber(dmg, 0))}`,
      });
    }

    const learnedNames = extractCharAnalysisLearnedNames(rawData);
    const levelValues = Object.values(skills).map((s) => s.level);
    return {
      raw: rawData,
      name: getAnalysisValue(rawData, ["characterName", "charName", "name", "pcName"], "名称不明"),
      race: getAnalysisValue(rawData, ["race", "raceName"], "不明"),
      level: toAnalysisNumber(getAnalysisValue(rawData, ["level", "lv", "adventurerLevel"], Math.max(0, ...levelValues)), Math.max(0, ...levelValues)),
      faith: getAnalysisValue(rawData, ["faith", "priestFaith", "god", "deity"], ""),
      faithType: getAnalysisValue(rawData, ["faithType", "priestFaithType"], ""),
      image: extractCharAnalysisImage(rawData),
      skills,
      magicPowers,
      learnedNames,
      weapons,
      hasNeckRipperCandidate,
      neckRipperCandidateText,
      defense: {
        eva: toAnalysisNumber(getAnalysisValue(rawData, ["defenseTotal1Eva", "evasionTotal", "evaTotal"], 0), 0),
        def: toAnalysisNumber(getAnalysisValue(rawData, ["defenseTotal1Def", "protectionTotal", "defTotal"], 0), 0),
        hp: toAnalysisNumber(getAnalysisValue(rawData, ["hpTotal", "hp"], 0), 0),
        mp: toAnalysisNumber(getAnalysisValue(rawData, ["mpTotal", "mp"], 0), 0),
        vitRes: toAnalysisNumber(getAnalysisValue(rawData, ["resistVitTotal", "vitResistTotal", "lifeResistTotal"], 0), 0),
        mndRes: toAnalysisNumber(getAnalysisValue(rawData, ["resistMndTotal", "mndResistTotal", "mindResistTotal"], 0), 0),
        initiative: toAnalysisNumber(getAnalysisValue(rawData, ["initiativeTotal", "initiative"], 0), 0),
      },
    };
  }

  function extractCharAnalysisImage(rawData) {
    const imageURL = getAnalysisValue(rawData, "imageURL", "");
    if (!imageURL) return null;
    return {
      url: imageURL,
      copyright: getAnalysisValue(rawData, "imageCopyright", ""),
      fit: getAnalysisValue(rawData, "imageFit", "cover") || "cover",
      percent: toAnalysisNumber(getAnalysisValue(rawData, "imagePercent", 100), 100),
      positionX: toAnalysisNumber(getAnalysisValue(rawData, "imagePositionX", 50), 50),
      positionY: toAnalysisNumber(getAnalysisValue(rawData, "imagePositionY", 50), 50),
    };
  }

  function extractCharAnalysisLearnedNames(rawData) {
    const char = rawData?.data && typeof rawData.data === "object" ? rawData.data : rawData;
    const names = [];
    const patterns = [
      /^combatFeatsLv\d+(?:bat|vag)?$/,
      /^combatFeatsAuto$/,
      /^craftAlchemy\d+$/,
      /^mysticArts\d+$/,
      /^enhance\w*\d*$/,
      /^magicArts\d+$/,
      /^song\d+$/,
      /^craftSong\d+$/,
      /^magicBibliomancy\d+$/,
      /^bibliomancyTemporary\d+$/,
      /^mysticMagic\d+$/,
      /^riding\w*\d*$/,
      /^craftPsychokinesis\d+$/,
    ];
    Object.entries(char || {}).forEach(([key, value]) => {
      if (!patterns.some((pattern) => pattern.test(key))) return;
      String(value || "")
        .split(/[\n,、]+/)
        .map((name) => name.replace(/[《》【】]/g, "").trim())
        .filter(Boolean)
        .forEach((name) => names.push(name));
    });
    return Array.from(new Set(names));
  }

  function findCharAnalysisUsableRows(charData) {
    const selectableSkillNames = new Set(["バード", "ダークハンター", "ビブリオマンサー"]);
    const selectableRowNamesBySkill = new Map();
    selectableSkillNames.forEach((skillName) => {
      selectableRowNamesBySkill.set(skillName, new Set(
        charAnalysisCsvRows
          .filter((row) => row["技能"] === skillName)
          .map((row) => normalizeAnalysisName(row["名称(正規)"] || row["名称(原文)"]))
          .filter(Boolean),
      ));
    });
    const learnedSelectableNamesBySkill = new Map();
    selectableRowNamesBySkill.forEach((rowNames, skillName) => {
      learnedSelectableNamesBySkill.set(skillName, new Set(
        charData.learnedNames
          .map(normalizeAnalysisName)
          .filter((name) => rowNames.has(name)),
      ));
    });
    return charAnalysisCsvRows.filter((row) => {
      const skillName = row["技能"];
      const requiredLevel = toAnalysisNumber(row["Lv"], 0);
      const skill = charData.skills[skillName];
      if (!skill || requiredLevel <= 0 || skill.level < requiredLevel) return false;
      if (String(row["区分"] || "").includes("流派秘伝") && !isCharAnalysisLearnedRow(row, charData.learnedNames)) return false;
      if (!isCharAnalysisPriestRowAllowedByFaith(row, charData)) return false;
      if (skillName === "アルケミスト" && charData.learnedNames.length) {
        const rowName = normalizeAnalysisName(row["名称(正規)"] || row["名称(原文)"]);
        const hasLearned = charData.learnedNames.some((name) => normalizeAnalysisName(name) === rowName);
        return hasLearned || charData.learnedNames.every((name) => !name.includes("賦術"));
      }
      const learnedSelectableNames = learnedSelectableNamesBySkill.get(skillName);
      if (learnedSelectableNames?.size) {
        const rowName = normalizeAnalysisName(row["名称(正規)"] || row["名称(原文)"]);
        return learnedSelectableNames.has(rowName);
      }
      return true;
    });
  }

  function normalizeAnalysisName(name) {
    return String(name || "").normalize("NFKC").replace(/[《》【】〖〗▶⏩△○†‡\s]/g, "").trim();
  }

  function isCharAnalysisLearnedRow(row, learnedNames = []) {
    const rowName = normalizeAnalysisName(row?.["名称(正規)"] || row?.["名称(原文)"]);
    if (!rowName) return false;
    return learnedNames.some((name) => {
      const learnedName = normalizeAnalysisName(name);
      if (learnedName === rowName) return true;
      return rowName.includes("ターンバックグレイス") && learnedName.includes("ターンバックグレイス");
    });
  }

  function normalizeCharAnalysisFaithText(text) {
    return normalizeAnalysisName(text)
      .replace(/[“”"'’‘（）()・･]/g, "")
      .replace(/炎武帝|騎士神|妖精神|風来神|賢神|導きの星神|貨幣神|戦勝神|慈雨神|竜帝神|融合神|酒幸神|月神|太陽神|始祖神|伝令神|刃神|纏いの神|制裁の双子女神/g, "");
  }

  function isCharAnalysisPriestRowAllowedByFaith(row, charData) {
    if ((row?.["技能"] || "") !== "プリースト") return true;
    const section = String(row?.["区分"] || "").trim();
    if (!section || section === "基本") return true;
    if (section.includes("流派秘伝")) return true;

    const faithType = String(charData?.faithType || "").trim();
    if (/第一・第三|第一第三/.test(section)) return faithType !== "‡";
    if (/第二/.test(section)) return faithType === "‡";
    if (section.includes("基本")) return true;

    const normalizedSection = normalizeCharAnalysisFaithText(section);
    if (!normalizedSection) return true;
    const normalizedFaith = normalizeCharAnalysisFaithText(charData?.faith || "");
    return Boolean(normalizedFaith && normalizedFaith.includes(normalizedSection));
  }

  function extractCharAnalysisAttackSpells(charData, usableRows) {
    const spells = usableRows
      .map((row) => {
        const effect = row["効果概要"] || "";
        const kMatch = effect.match(/[kKｋＫ]\s*(\d+)/);
        const name = row["名称(原文)"] || row["名称(正規)"] || "名称不明";
        const isBullet = /バレット|ショット/.test(name) && /弾丸/.test(`${row["対象"] || ""} ${effect}`) && !/回復/.test(effect);
        if (!kMatch || (!/ダメージ/.test(effect) && !isBullet)) return null;
        const skillName = row["技能"];
        const magicPower = charData.magicPowers[skillName] || charData.magicPowers[row["系統"]] || 0;
        return {
          name,
          skill: skillName,
          level: toAnalysisNumber(row["Lv"], 0),
          k: toAnalysisNumber(kMatch[1], 0),
          magicPower,
          attribute: row["属性"] || "-",
          resist: row["抵抗"] || (isBullet ? "命中判定" : "-"),
          target: row["対象"] || "-",
          range: row["射程/形状"] || "-",
          effect,
          ref: row["参照"] || "",
          isBullet,
        };
      })
      .filter(Boolean);
    const sorcerer = charData.skills?.["ソーサラー"];
    const conjurer = charData.skills?.["コンジャラー"];
    if (sorcerer && conjurer) {
      const wizardLevel = Math.min(sorcerer.level || 0, conjurer.level || 0);
      const wizardPower = Math.max(charData.magicPowers?.["ソーサラー"] || 0, charData.magicPowers?.["コンジャラー"] || 0);
      charAnalysisCsvRows.forEach((row) => {
        const effect = row["効果概要"] || "";
        const kMatch = effect.match(/[kKｋＫ]\s*(\d+)/);
        if (!kMatch || !/ダメージ/.test(effect)) return;
        if ((row["系統"] || "") !== "深智魔法") return;
        const level = toAnalysisNumber(row["Lv"], 0);
        if (level > wizardLevel) return;
        spells.push({
          name: row["名称(原文)"] || row["名称(正規)"] || "名称不明",
          skill: "ウィザード",
          system: "深智魔法（ウィザード）",
          level,
          k: toAnalysisNumber(kMatch[1], 0),
          magicPower: wizardPower,
          attribute: row["属性"] || "-",
          resist: row["抵抗"] || "-",
          target: row["対象"] || "-",
          range: row["射程/形状"] || "-",
          effect,
          ref: row["参照"] || "",
        });
      });
    }
    return spells;
  }


  function getAnalysisFeatRank(name) {
    const text = String(name || "").normalize("NFKC");
    if (/[ⅢIII3３]/.test(text) || /III/.test(text)) return 3;
    if (/[ⅡII2２]/.test(text) || /II/.test(text)) return 2;
    return 1;
  }

  const DECLARATION_WEAPON_PATTERN = /(全力攻撃|魔力撃|必殺攻撃|牽制攻撃|薙ぎ払い|なぎ払い|挑発攻撃|囮攻撃|鎧貫き|斬り返し|牙折り|インファイト|テイルスイング|乱撃|シールドバッシュ|シャドウステップ|捨て身攻撃|露払い)/;
  const DECLARATION_MAGIC_PATTERN = /(魔法拡大|ダブルキャスト|マルチアクション|クリティカルキャスト|バイオレントキャスト|カニングキャスト|クイックキャスト)/;

  function classifyCharAnalysisDeclaration(name) {
    const normalized = normalizeAnalysisName(name);
    if (/マルチアクション/.test(normalized)) return "other";
    if (DECLARATION_MAGIC_PATTERN.test(normalized)) return "magic";
    if (DECLARATION_WEAPON_PATTERN.test(normalized)) return "weapon";
    return "other";
  }

  function getDeclarationCategoryLabel(category) {
    if (category === "magic") return "魔法宣言";
    if (category === "weapon") return "武器宣言";
    return "宣言";
  }

  function getCharAnalysisDeclarationLimit(charData) {
    const names = charData.learnedNames.map((name) => normalizeAnalysisName(name));
    let totalLimit = 1;
    let weaponLimit = 1;
    let magicLimit = 1;
    let runeMaster = false;
    let runeMasterNeedsMagic = false;
    const reasons = [];
    if (names.some((name) => name.includes("バトルマスター"))) {
      totalLimit = Math.max(totalLimit, 2);
      weaponLimit = Math.max(weaponLimit, 2);
      reasons.push("バトルマスター: 武器宣言2回");
    }
    const hen = names.find((name) => name.includes("変幻自在"));
    if (hen) {
      const rank = getAnalysisFeatRank(hen);
      const slots = rank >= 2 ? 3 : 2;
      totalLimit = Math.max(totalLimit, slots);
      weaponLimit = Math.max(weaponLimit, slots);
      reasons.push(rank >= 2 ? "変幻自在Ⅱ: 武器宣言3回" : "変幻自在Ⅰ: 武器宣言2回");
    }
    if (names.some((name) => name.includes("ルーンマスター"))) {
      const hadWeaponMultiDeclaration = weaponLimit >= 2;
      totalLimit = Math.max(totalLimit, 2);
      magicLimit = Math.max(magicLimit, 2);
      runeMaster = true;
      runeMasterNeedsMagic = !hadWeaponMultiDeclaration;
      reasons.push("ルーンマスター: 2回中1回は魔法宣言");
    }
    return { limit: totalLimit, totalLimit, weaponLimit, magicLimit, runeMaster, runeMasterNeedsMagic, reasons };
  }

  function validateCharAnalysisDeclarationSelection(selectedDeclarations, limitInfo = { totalLimit: 1, weaponLimit: 1, magicLimit: 1, runeMaster: false, runeMasterNeedsMagic: false }) {
    const totalLimit = Math.max(1, limitInfo.totalLimit || limitInfo.limit || 1);
    const weaponLimit = Math.max(1, limitInfo.weaponLimit || 1);
    const magicLimit = Math.max(1, limitInfo.magicLimit || 1);
    const weaponCount = selectedDeclarations.filter((feat) => feat.category === "weapon").length;
    const magicCount = selectedDeclarations.filter((feat) => feat.category === "magic").length;
    if (selectedDeclarations.length > totalLimit) return { ok: false, message: `宣言特技は合計${totalLimit}つまでです。` };
    if (weaponCount > weaponLimit) return { ok: false, message: `武器宣言は${weaponLimit}つまでです。` };
    if (magicCount > magicLimit) return { ok: false, message: `魔法宣言は${magicLimit}つまでです。` };
    if (limitInfo.runeMasterNeedsMagic && selectedDeclarations.length >= 2 && magicCount < 1) {
      return { ok: false, message: "ルーンマスターだけで2回宣言する場合、1つは魔法宣言が必要です。" };
    }
    return { ok: true, message: "" };
  }

  function canAddCharAnalysisDeclaration(feat, selectedDeclarations, limitInfo) {
    if (!feat) return { ok: false, message: "宣言特技が不明です。" };
    if (selectedDeclarations.some((item) => item.id === feat.id)) return { ok: true, message: "" };
    return validateCharAnalysisDeclarationSelection([...selectedDeclarations, feat], limitInfo);
  }

  function getCharAnalysisLearnedNames(charData) {
    return (charData?.learnedNames || []).map((name) => normalizeAnalysisName(name));
  }

  function hasCharAnalysisFeat(charData, pattern) {
    return getCharAnalysisLearnedNames(charData).some((name) => pattern.test(name));
  }

  function isCharAnalysisMultiActionFeat(feat) {
    return /マルチアクション/.test(normalizeAnalysisName(feat?.name || feat?.id || ""));
  }

  function hasCharAnalysisActionPlanMultiActionInSlots(declarationFeats = [], slotKeys = []) {
    const keySet = new Set(slotKeys);
    const ids = new Set(Object.entries(charAnalysisActionPlan.slotDeclarationIds || {})
      .filter(([key]) => keySet.has(key))
      .flatMap(([, value]) => Array.isArray(value) ? value : []));
    return declarationFeats.some((feat) => ids.has(feat.id) && isCharAnalysisMultiActionFeat(feat));
  }

  function isCharAnalysisMainActionSlot(slot) {
    return slot?.kind === "attack" && /(?:^main$|Main$)/.test(String(slot.key || ""));
  }

  function getCharAnalysisActionSlotOptions(slot, options = []) {
    if (slot?.kind === "magic") return options.filter((option) => option.type === "spell");
    // 主攻撃枠は武器・魔法・直接指定を選べる。
    // 両手利き/追加攻撃枠は武器攻撃枠なので魔法は選ばせない。
    if (isCharAnalysisMainActionSlot(slot)) return options.slice();
    return options.filter((option) => option.type !== "spell");
  }

  function getCharAnalysisActionSlotDefaultId(slot, options = []) {
    const slotOptions = getCharAnalysisActionSlotOptions(slot, options);
    if (!slotOptions.length) return "";
    const current = charAnalysisActionPlan.slotAttackIds?.[slot.key] || "";
    if (slotOptions.some((option) => option.id === current)) return current;
    if (isCharAnalysisMainActionSlot(slot) && charAnalysisSelectedAttackId && slotOptions.some((option) => option.id === charAnalysisSelectedAttackId)) return charAnalysisSelectedAttackId;
    return slotOptions[0].id;
  }

  function getCharAnalysisActionSlotSelectedBaseOption(slot, options = []) {
    const slotOptions = getCharAnalysisActionSlotOptions(slot, options);
    if (!slotOptions.length) return null;
    const selectedId = charAnalysisActionPlan.slotAttackIds?.[slot.key] || getCharAnalysisActionSlotDefaultId(slot, options);
    return slotOptions.find((option) => option.id === selectedId) || slotOptions[0] || null;
  }

  function isCharAnalysisGunOption(option) {
    return option?.type === "weapon" && /ガン/.test(`${option?.category || ""} ${option?.name || ""}`);
  }

  function getCharAnalysisSlotBulletId(slotKey, gunOption) {
    const bullets = Array.isArray(gunOption?.bulletOptions) ? gunOption.bulletOptions : [];
    if (!bullets.length) return "";
    if (!charAnalysisActionPlan.slotBulletIds || typeof charAnalysisActionPlan.slotBulletIds !== "object") charAnalysisActionPlan.slotBulletIds = {};
    const stored = charAnalysisActionPlan.slotBulletIds[slotKey];
    if (bullets.some((bullet) => bullet.id === stored)) return stored;
    return bullets[0].id;
  }

  function buildCharAnalysisGunBulletAttackOption(gun, bullet, slotKey = "") {
    if (!gun || !bullet) return gun;
    const critOffset = /C値\s*[-－−]\s*1|C値-1/.test(String(bullet.effect || "")) ? -1 : 0;
    const crit = Math.max(8, toAnalysisNumber(gun.crit, 10) + critOffset);
    const name = `${gun.name}（${bullet.name}）`;
    return {
      ...gun,
      id: `${gun.id}::bullet-${bullet.id || slotKey || bullet.name}`,
      baseGunId: gun.id,
      bulletId: bullet.id,
      type: "weapon",
      source: "gun-bullet",
      label: `${gun.name} + ${bullet.name} / K${bullet.k}@${crit}${formatSigned(bullet.magicPower)}`,
      name,
      gunName: gun.name,
      bulletName: bullet.name,
      bulletLabel: `${bullet.name} / K${bullet.k}@${crit}${formatSigned(bullet.magicPower)}`,
      skill: gun.skill || "シューター",
      category: "ガン",
      usage: gun.usage || "-",
      reqd: gun.reqd || "-",
      hit: gun.hit,
      rate: bullet.k,
      crit,
      add: bullet.magicPower,
      resist: "命中判定",
      attribute: bullet.attribute || "-",
      target: /ショットガン|キャノン|ジェノサイド|シャワー/.test(bullet.name) ? (bullet.target || "範囲/記載準拠") : "1体",
      range: gun.range || "ガン射程/射撃",
      note: `${bullet.name}を装填して${gun.name}で射撃`,
      weaponNote: [gun.weaponNote, bullet.effect].filter(Boolean).join(" / "),
      ignoreDefense: true,
      bulletOptions: gun.bulletOptions || [],
    };
  }

  function resolveCharAnalysisSlotAttackOption(slot, option) {
    if (!option) return null;
    if (!isCharAnalysisGunOption(option) || !Array.isArray(option.bulletOptions) || !option.bulletOptions.length) return option;
    const bulletId = getCharAnalysisSlotBulletId(slot?.key || "", option);
    const bullet = option.bulletOptions.find((item) => item.id === bulletId) || option.bulletOptions[0];
    return buildCharAnalysisGunBulletAttackOption(option, bullet, slot?.key || "");
  }

  function getCharAnalysisActionSlotSelectedOption(slot, options = []) {
    return resolveCharAnalysisSlotAttackOption(slot, getCharAnalysisActionSlotSelectedBaseOption(slot, options));
  }

  function isCharAnalysisSpellOption(option) {
    return option?.type === "spell";
  }

  function getCharAnalysisActionPlanCapabilities(charData) {
    const grapplerLevel = getCharAnalysisSkillLevel(charData, "グラップラー");
    return {
      dualWield: hasCharAnalysisFeat(charData, /両手利き/),
      twoSwordStyle: hasCharAnalysisFeat(charData, /二刀流/),
      twoSwordMastery: hasCharAnalysisFeat(charData, /二刀無双/),
      extraAttack: grapplerLevel > 0 || hasCharAnalysisFeat(charData, /追加攻撃/),
      fastAction: hasCharAnalysisFeat(charData, /ファストアクション/),
      grapplerLevel,
    };
  }

  function ensureCharAnalysisActionPlanDefaults(options = [], slots = null) {
    const targetSlots = slots || [
      { key: "main", kind: "attack" },
      { key: "offhand", kind: "attack" },
      { key: "extra", kind: "attack" },
      { key: "magic", kind: "magic" },
      { key: "maAttack", kind: "attack" },
      { key: "maOffhand", kind: "attack" },
      { key: "maExtra", kind: "attack" },
      { key: "faMain", kind: "attack" },
      { key: "faOffhand", kind: "attack" },
      { key: "faExtra", kind: "attack" },
      { key: "faMagic", kind: "magic" },
      { key: "faMaAttack", kind: "attack" },
      { key: "faMaOffhand", kind: "attack" },
      { key: "faMaExtra", kind: "attack" },
    ];
    targetSlots.forEach((slot) => {
      const defaultId = getCharAnalysisActionSlotDefaultId(slot, options);
      if (!charAnalysisActionPlan.slotAttackIds[slot.key] || !getCharAnalysisActionSlotOptions(slot, options).some((option) => option.id === charAnalysisActionPlan.slotAttackIds[slot.key])) {
        charAnalysisActionPlan.slotAttackIds[slot.key] = defaultId;
      }
      if (!charAnalysisActionPlan.slotBulletIds || typeof charAnalysisActionPlan.slotBulletIds !== "object") charAnalysisActionPlan.slotBulletIds = {};
      const baseOption = getCharAnalysisActionSlotSelectedBaseOption(slot, options);
      if (baseOption?.bulletOptions?.length) {
        const bulletId = getCharAnalysisSlotBulletId(slot.key, baseOption);
        if (bulletId) charAnalysisActionPlan.slotBulletIds[slot.key] = bulletId;
      }
      if (!Array.isArray(charAnalysisActionPlan.slotDeclarationIds[slot.key])) charAnalysisActionPlan.slotDeclarationIds[slot.key] = [];
      if (!charAnalysisActionPlan.slotManualAdjusts || typeof charAnalysisActionPlan.slotManualAdjusts !== "object") charAnalysisActionPlan.slotManualAdjusts = {};
      if (!charAnalysisActionPlan.slotManualAdjusts[slot.key]) charAnalysisActionPlan.slotManualAdjusts[slot.key] = createCharAnalysisManualAdjust();
      if (!charAnalysisActionPlan.slotTargetCounts || typeof charAnalysisActionPlan.slotTargetCounts !== "object") charAnalysisActionPlan.slotTargetCounts = {};
    });
  }

  function getCharAnalysisActionPlanSlots(charData, options = [], declarationFeats = []) {
    const caps = getCharAnalysisActionPlanCapabilities(charData);
    const slots = [];
    const dualSourceLabel = caps.twoSwordMastery ? "二刀無双" : caps.twoSwordStyle ? "二刀流" : "両手利き";
    const addSlot = (slot) => { slots.push(slot); return slot.key; };
    const addWeaponFollowups = (set, setLabel, prefix, sourceBase, keys, labelPrefix = "") => {
      const offhandKey = prefix ? `${prefix}Offhand` : "offhand";
      const extraKey = prefix ? `${prefix}Extra` : "extra";
      if (caps.dualWield && charAnalysisActionPlan.dualWield) {
        keys.push(addSlot({
          key: offhandKey,
          label: `${labelPrefix}2回目`,
          source: `${sourceBase} / ${dualSourceLabel}`,
          set,
          setLabel,
          penalty: (caps.twoSwordStyle || caps.twoSwordMastery) ? 0 : -2,
          kind: "attack",
        }));
      }
      if (caps.extraAttack) {
        keys.push(addSlot({
          key: extraKey,
          label: `${labelPrefix}追加攻撃`,
          source: `${sourceBase} / グラップラー`,
          set,
          setLabel,
          penalty: 0,
          kind: "attack",
        }));
      }
    };

    const addMainActionSet = ({ mainKey, magicKey, maAttackKey, standardPrefix = "", maPrefix, set, setLabel, mainLabel, sourceBase, labelPrefix = "" }) => {
      const actionKeys = [];
      const dualPrimaryPenalty = (caps.dualWield && charAnalysisActionPlan.dualWield && !(caps.twoSwordStyle || caps.twoSwordMastery)) ? -2 : 0;
      const mainSlot = { key: mainKey, label: mainLabel, source: `${sourceBase} / 主攻撃`, set, setLabel, penalty: dualPrimaryPenalty, kind: "attack" };
      actionKeys.push(addSlot(mainSlot));
      const mainOption = getCharAnalysisActionSlotSelectedOption(mainSlot, options);
      const mainIsSpell = isCharAnalysisSpellOption(mainOption);
      const mainHasMultiAction = hasCharAnalysisActionPlanMultiActionInSlots(declarationFeats, [mainKey]);

      if (!mainIsSpell) {
        addWeaponFollowups(set, setLabel, standardPrefix, sourceBase, actionKeys, labelPrefix);
        if (hasCharAnalysisActionPlanMultiActionInSlots(declarationFeats, actionKeys)) {
          addSlot({ key: magicKey, label: `${labelPrefix}魔法行使`, source: `${sourceBase} / マルチアクション`, set, setLabel, penalty: 0, kind: "magic" });
        }
      } else if (mainHasMultiAction) {
        const maKeys = [];
        maKeys.push(addSlot({ key: maAttackKey, label: `${labelPrefix}近接攻撃`, source: `${sourceBase} / マルチアクション`, set, setLabel, penalty: dualPrimaryPenalty, kind: "attack" }));
        addWeaponFollowups(set, setLabel, maPrefix, `${sourceBase} / マルチアクション`, maKeys, labelPrefix ? `${labelPrefix}` : "");
      }
    };

    addMainActionSet({
      mainKey: "main",
      magicKey: "magic",
      maAttackKey: "maAttack",
      standardPrefix: "",
      maPrefix: "ma",
      set: "normal",
      setLabel: "通常行動",
      mainLabel: "1回目",
      sourceBase: "通常行動",
    });

    if (caps.fastAction && charAnalysisActionPlan.fastAction) {
      addMainActionSet({
        mainKey: "faMain",
        magicKey: "faMagic",
        maAttackKey: "faMaAttack",
        standardPrefix: "fa",
        maPrefix: "faMa",
        set: "fast",
        setLabel: "ファストアクション",
        mainLabel: "ファストアクション 1回目",
        sourceBase: "ファストアクション",
        labelPrefix: "ファストアクション ",
      });
    }

    ensureCharAnalysisActionPlanDefaults(options, slots);
    return slots;
  }


  function extractCharAnalysisMaxTargetsFromOption(option) {
    const declaredMax = toAnalysisNumber(option?.declarationTargetMax, 0);
    if (declaredMax > 1) return Math.max(1, Math.min(99, Math.trunc(declaredMax)));
    const type = option?.type || "";
    const targetText = `${option?.target || ""} ${option?.note || ""}`;
    if (type === "weapon" || type === "manual") return 1;
    const slashMatch = targetText.match(/\/(\d{1,2})(?:\s*体)?/);
    if (slashMatch) return Math.max(1, Math.min(99, Math.trunc(toAnalysisNumber(slashMatch[1], 1)) || 1));
    if (/(?:半径|エリア|範囲|すべて|全て|任意)/.test(targetText)) return 1;
    return 1;
  }

  function getCharAnalysisSlotTargetMax(option = null) {
    return Math.max(1, Math.min(99, extractCharAnalysisMaxTargetsFromOption(option)));
  }

  function getCharAnalysisSlotTargetCount(slotKey, option = null) {
    if (!charAnalysisActionPlan.slotTargetCounts || typeof charAnalysisActionPlan.slotTargetCounts !== "object") charAnalysisActionPlan.slotTargetCounts = {};
    const stored = charAnalysisActionPlan.slotTargetCounts[slotKey];
    const maxTargets = getCharAnalysisSlotTargetMax(option);
    const raw = isFiniteAnalysisNumber(toAnalysisNumber(stored, NaN)) ? stored : 1;
    const value = Math.max(1, Math.min(maxTargets, Math.trunc(toAnalysisNumber(raw, 1)) || 1));
    return value;
  }

  function getCharAnalysisSlotDeclarationIds(slotKey) {
    return Array.isArray(charAnalysisActionPlan.slotDeclarationIds?.[slotKey])
      ? charAnalysisActionPlan.slotDeclarationIds[slotKey].filter(Boolean)
      : [];
  }

  function isCharAnalysisSlotDeclarationAllowed(slot, slotOption, feat) {
    if (!feat) return false;
    const isAddedMagicSlot = slot?.kind === "magic";
    const isMainSpellSlot = isCharAnalysisMainActionSlot(slot) && slotOption?.type === "spell";
    if (isAddedMagicSlot) {
      return !isCharAnalysisMultiActionFeat(feat) && (feat.category === "magic" || feat.category === "other");
    }
    if (isMainSpellSlot) {
      return feat.category === "magic" || feat.category === "other";
    }
    return feat.category === "weapon" || feat.category === "other";
  }

  function getCharAnalysisSlotDeclarations(slot, declarationFeats = [], slotOption = null) {
    const slotKey = typeof slot === "string" ? slot : slot?.key;
    const ids = getCharAnalysisSlotDeclarationIds(slotKey);
    const feats = ids.map((id) => declarationFeats.find((feat) => feat.id === id)).filter(Boolean);
    if (!slotOption || typeof slot === "string") return feats;
    return feats.filter((feat) => isCharAnalysisSlotDeclarationAllowed(slot, slotOption, feat));
  }

  function getCharAnalysisActionPlanDeclarations(slots = [], declarationFeats = [], options = []) {
    return slots.flatMap((slot) => {
      const slotOptions = getCharAnalysisActionSlotOptions(slot, options);
      const attackId = charAnalysisActionPlan.slotAttackIds?.[slot.key] || getCharAnalysisActionSlotDefaultId(slot, options);
      const baseOption = slotOptions.find((item) => item.id === attackId) || slotOptions[0] || null;
      const slotOption = resolveCharAnalysisSlotAttackOption(slot, baseOption);
      return getCharAnalysisSlotDeclarations(slot, declarationFeats, slotOption);
    });
  }

  function validateCharAnalysisActionPlanDeclarationSelection(charData, declarationFeats, declarationLimit, options = []) {
    const slots = getCharAnalysisActionPlanSlots(charData, options, declarationFeats);
    return validateCharAnalysisDeclarationSelection(getCharAnalysisActionPlanDeclarations(slots, declarationFeats, options), declarationLimit);
  }

  function canAddCharAnalysisSlotDeclaration(charData, slotKey, feat, declarationFeats, declarationLimit, options = []) {
    if (!feat) return { ok: false, message: "宣言特技が不明です。" };
    const current = charAnalysisActionPlan.slotDeclarationIds?.[slotKey] || [];
    if (current.includes(feat.id)) return { ok: true, message: "" };
    if (isCharAnalysisMultiActionFeat(feat)) {
      const alreadyMultiAction = Object.entries(charAnalysisActionPlan.slotDeclarationIds || {}).some(([key, ids]) => key !== slotKey && Array.isArray(ids) && ids.includes(feat.id));
      if (alreadyMultiAction) return { ok: false, message: "マルチアクションは1R行動セット内で1回だけ選択できます。" };
    }
    const oldIds = current.slice();
    charAnalysisActionPlan.slotDeclarationIds[slotKey] = [...oldIds, feat.id];
    const validation = validateCharAnalysisActionPlanDeclarationSelection(charData, declarationFeats, declarationLimit, options);
    charAnalysisActionPlan.slotDeclarationIds[slotKey] = oldIds;
    return validation;
  }

  function getCharAnalysisMagicPowerEntries(charData) {
    return Object.entries(charData?.magicPowers || {})
      .map(([label, value]) => ({ label, value: toAnalysisNumber(value, 0) }))
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "ja"));
  }

  function getCharAnalysisHighestMagicPowerEntry(charData) {
    return getCharAnalysisMagicPowerEntries(charData)[0] || null;
  }

  function getCharAnalysisHighestMagicPower(charData) {
    return getCharAnalysisHighestMagicPowerEntry(charData)?.value || 0;
  }


  function describeMagicExpansionDeclaration(normalizedName) {
    const source = String(normalizedName || "").normalize("NFKC");
    const found = [];
    if (/数/.test(source)) found.push("数");
    if (/距離/.test(source)) found.push("距離");
    if (/時間/.test(source)) found.push("時間");
    if (/範囲/.test(source)) found.push("範囲");
    if (/確実化/.test(source)) found.push("確実化");
    if (/すべて|全て|すべての/.test(source)) found.push("すべて");
    if (!found.length) {
      return { displaySuffix: "（種類未記載）", note: "魔法拡大の種類未記載。数/距離/時間/範囲/確実化などを要確認" };
    }
    const label = `/${found.join("・")}`;
    if (found.includes("確実化")) return { displaySuffix: label, note: "魔法拡大/確実化。判定確実化/威力確実化は計算条件側で反映" };
    return { displaySuffix: label, note: `魔法拡大${label}。単体平均ダメージ/Rへの直接補正は未設定` };
  }

  function buildCharAnalysisDeclarationFeat(rawName, charData) {
    const name = String(rawName || "").replace(/[《》【】]/g, "").trim();
    const normalized = normalizeAnalysisName(name);
    if (!normalized || /^(バトルマスター|変幻自在|ルーンマスター)/.test(normalized)) return null;
    const rank = getAnalysisFeatRank(normalized);
    const bonuses = [];
    const risks = [];
    const notes = [];
    const addBonus = (type, label, value, uncertain = false) => {
      if (value || uncertain) bonuses.push({ type, label, value, uncertain });
    };
    const addRisk = (type, label, value, scope = "afterDeclaration") => {
      if (value) risks.push({ type, label, value, scope });
    };
    const addTargetMax = (value, label = "最大対象数") => addBonus("targetMax", label, value);
    if (/全力攻撃/.test(normalized)) {
      addBonus("damage", "与ダメージ", rank >= 3 ? 20 : rank >= 2 ? 12 : 4);
      addRisk("eva", "回避", -2);
    } else if (/魔力撃/.test(normalized)) {
      const magic = getCharAnalysisHighestMagicPowerEntry(charData);
      const power = magic?.value || 0;
      addBonus("damage", "与ダメージ", power, power <= 0);
      addRisk("vitRes", "生命抵抗", -2);
      addRisk("mndRes", "精神抵抗", -2);
      notes.push(power > 0 ? `${magic.label}魔力${power}を加算` : "魔力不明のため要確認");
    } else if (/必殺攻撃/.test(normalized)) {
      addBonus("diceRepeat", "威力表出目#", 1);
      if (rank <= 1) addRisk("eva", "回避", -2);
      else if (rank === 2) addRisk("eva", "回避", -1);
      notes.push(rank >= 3 ? "必殺攻撃Ⅲ。威力表出目+1を回転後も継続、クリティカル無効を無視する効果はメモ扱い" : `必殺攻撃${rank >= 2 ? "Ⅱ" : "Ⅰ"}。威力表出目+1を回転後も継続`);
    } else if (/牽制攻撃/.test(normalized)) {
      addBonus("hit", "命中", rank >= 3 ? 3 : rank >= 2 ? 2 : 1);
      if (rank <= 1) addBonus("crit", "C値", 1);
    } else if (/インファイト/.test(normalized)) {
      addBonus("hit", "命中", 2);
      if (rank >= 2) addBonus("damage", "与ダメージ", 4);
      addRisk("eva", "回避", -2);
      notes.push("特定対象のみ攻撃可能。対象制限はメモ扱い");
    } else if (/薙ぎ払い|なぎ払い/.test(normalized)) {
      addTargetMax(rank >= 2 ? 5 : 3);
      if (rank <= 1) addBonus("damage", "与ダメージ", -3);
      notes.push(rank >= 2 ? "5体までを攻撃。単体平均ダメージ/R補正なし" : "3体までを攻撃。単体平均ダメージ/Rではダメージ-3を反映");
    } else if (/テイルスイング/.test(normalized)) {
      addTargetMax(rank >= 2 ? 5 : 3);
      if (rank <= 1) addBonus("hit", "命中", -1);
      notes.push(rank >= 2 ? "5体までを尻尾で攻撃" : "3体までを尻尾で攻撃、命中-1");
    } else if (/乱撃/.test(normalized)) {
      addTargetMax(3);
      if (rank <= 1) addBonus("hit", "命中", -2);
      notes.push(rank >= 2 ? "3体までを1H武器で攻撃、命中ペナルティなし" : "3体までを1H武器で攻撃、命中-2");
    } else if (/挑発攻撃/.test(normalized)) {
      if (rank <= 1) addBonus("damage", "与ダメージ", -2);
      notes.push(rank >= 2 ? "攻撃誘導効果は平均ダメージ/R未反映" : "攻撃誘導効果は平均ダメージ/R未反映、与ダメージ-2");
    } else if (/囮攻撃/.test(normalized)) {
      addBonus("hit", "命中", -2);
      addBonus("damage", "与ダメージ", rank >= 2 ? 8 : 2);
      notes.push(rank >= 2 ? "回避された相手の回避低下は未反映" : "回避された相手の回避低下は未反映");
    } else if (/鎧貫き/.test(normalized)) {
      if (rank >= 2) notes.push(rank >= 3 ? "クリティカル時は防護点0、クリティカル無効系を無視する効果はメモ扱い" : "クリティカル時は防護点0扱い。条件付きのため平均ダメージ/Rでは未反映");
      else notes.push("命中時の防護点半減は条件付きのため平均ダメージ/Rでは未反映");
    } else if (/斬り返し/.test(normalized)) {
      if (rank >= 2) notes.push("命中失敗時に再攻撃。1回目命中時のダメージ+4は選択式/条件付きのため未反映");
      else notes.push("命中失敗時の再攻撃は未反映");
    } else if (/牙折り/.test(normalized)) {
      addBonus("damage", "与ダメージ", -8);
      notes.push("命中した対象の物理ダメージ低下は防御モード用メモ");
    } else if (/シールドバッシュ/.test(normalized)) {
      addBonus("hit", "命中", 2);
      notes.push(rank >= 2 ? "盾攻撃。盾の防護点/回避補正は有効、転倒効果は未反映" : "盾攻撃。盾の防護点/回避補正は無効、転倒効果は未反映");
    } else if (/シャドウステップ/.test(normalized)) {
      addBonus("damage", "与ダメージ", rank >= 2 ? 4 : 2);
      notes.push(rank >= 2 ? "攻撃時効果として近接ダメージ+4を反映。回避振り直し側は未反映" : "攻撃時効果として近接ダメージ+2を反映。回避振り直し側は未反映");
    } else if (/捨て身攻撃/.test(normalized)) {
      const self = rank >= 3 ? 30 : rank >= 2 ? 10 : 5;
      addBonus("damage", "与ダメージ", self);
      addRisk("selfDamage", "自身確定ダメージ", self, "onHit");
    } else if (/露払い/.test(normalized)) {
      notes.push("命中時の威力表出目固定/上昇効果は条件付きのため未反映");
    } else if (/クリティカルキャスト/.test(normalized)) {
      addBonus("crit", "C値", -1);
      notes.push(rank >= 2 ? "魔法のC値-1。クリティカル無効を無視する効果はメモ扱い" : "魔法のC値-1。C値下限7は計算側で確認");
    } else if (/バイオレントキャスト/.test(normalized)) {
      addBonus("hit", "行使", rank >= 2 ? 3 : 2);
      notes.push("ダメージ魔法の魔法行使判定に適用");
    } else if (/カニングキャスト/.test(normalized)) {
      addBonus("hit", "行使", rank >= 2 ? 3 : 2);
      notes.push("同名魔法の再行使時の達成値補正として概算反映");
    } else if (/クイックキャスト/.test(normalized)) {
      notes.push("抵抗:消滅の魔法行使時、消費MP半減。火力値には直接未反映");
    } else if (/魔法拡大/.test(normalized)) {
      const expansion = describeMagicExpansionDeclaration(normalized);
      notes.push(expansion.note);
    } else if (/ダブルキャスト/.test(normalized)) {
      notes.push("追加の魔法行使は未反映。複数行動スロット拡張用メモ");
    } else if (/マルチアクション/.test(normalized)) {
      notes.push("1R行動枠に魔法行使枠を追加。魔法攻撃を選んだ場合は1R期待値へ加算");
    } else {
      return null;
    }
    const category = classifyCharAnalysisDeclaration(normalized);
    const expansion = /魔法拡大/.test(normalized) ? describeMagicExpansionDeclaration(normalized) : null;
    const nameHasExpansionKind = expansion && /魔法拡大[／\/]/.test(String(name));
    const displayName = expansion && !nameHasExpansionKind && !String(name).includes(expansion.displaySuffix) ? `${name}${expansion.displaySuffix}` : name;
    return {
      id: `declaration-${category}-${normalizeAnalysisName(normalized)}`,
      name: displayName,
      rank,
      category,
      bonuses,
      risks,
      notes,
    };
  }

  function extractCharAnalysisDeclarationFeats(charData) {
    const seen = new Set();
    return charData.learnedNames
      .map((name) => buildCharAnalysisDeclarationFeat(name, charData))
      .filter(Boolean)
      .filter((feat) => {
        if (seen.has(feat.id)) return false;
        seen.add(feat.id);
        return true;
      });
  }

  function formatDeclarationRiskText(risks = []) {
    if (!risks.length) return "";
    return risks.map((risk) => `${risk.label}${formatSigned(risk.value)}${risk.scope === "onHit" ? "（命中時）" : ""}`).join(" / ");
  }

  function formatDeclarationBonusText(bonuses = [], risks = []) {
    const bonusText = bonuses.length
      ? bonuses
          .filter((bonus) => bonus.type !== "targetMax")
          .map((bonus) => `${bonus.label}${formatSigned(bonus.value)}${bonus.uncertain ? "（要確認）" : ""}`)
          .join(" / ")
      : "計算補正なし";
    const targetText = bonuses
      .filter((bonus) => bonus.type === "targetMax")
      .map((bonus) => `${bonus.label}${bonus.value}`)
      .join(" / ");
    const riskText = formatDeclarationRiskText(risks);
    return [bonusText, targetText, riskText ? `リスク: ${riskText}` : ""].filter(Boolean).join(" / ");
  }

  function normalizeCharAnalysisAlchemyKey(key) {
    const raw = String(key || "").trim();
    if (Object.prototype.hasOwnProperty.call(CHAR_ANALYSIS_ALCHEMY_EFFECT_DEFS, raw)) return raw;
    const kebab = raw.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`).replace(/^-/, "");
    const found = Object.keys(CHAR_ANALYSIS_ALCHEMY_EFFECT_DEFS).find((candidate) => {
      const candidateKebab = candidate.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`).replace(/^-/, "");
      return candidateKebab === raw || candidateKebab === kebab;
    });
    return found || "criticalRay";
  }

  function normalizeCharAnalysisAlchemyRank(rank) {
    const key = String(rank || "A").normalize("NFKC").toUpperCase();
    return CHAR_ANALYSIS_ALCHEMY_RANKS.includes(key) ? key : "A";
  }

  function getCharAnalysisAlchemyRank(effectKey) {
    const key = normalizeCharAnalysisAlchemyKey(effectKey);
    return normalizeCharAnalysisAlchemyRank(
      charAnalysisAlchemySettings[key] || (key === "criticalRay" ? charAnalysisAlchemySettings.criticalRayRank : "") || "A",
    );
  }

  function setCharAnalysisAlchemyRank(effectKey, rank) {
    const key = normalizeCharAnalysisAlchemyKey(effectKey);
    const normalizedRank = normalizeCharAnalysisAlchemyRank(rank);
    charAnalysisAlchemySettings[key] = normalizedRank;
    if (key === "criticalRay") charAnalysisAlchemySettings.criticalRayRank = normalizedRank;
  }

  function getCharAnalysisAlchemyBonus(effectKey, rank) {
    const key = normalizeCharAnalysisAlchemyKey(effectKey);
    const def = CHAR_ANALYSIS_ALCHEMY_EFFECT_DEFS[key];
    return def?.values?.[normalizeCharAnalysisAlchemyRank(rank)] || 0;
  }

  function getCharAnalysisCriticalRayBonus(rank) {
    return getCharAnalysisAlchemyBonus("criticalRay", rank);
  }

  function charAnalysisHasAlchemyCraft(charData, craftName) {
    const raw = charData?.raw?.data && typeof charData.raw.data === "object" ? charData.raw.data : charData?.raw;
    const normalizedCraft = normalizeAnalysisName(craftName);
    return Object.entries(raw || {}).some(([key, value]) => {
      if (!/^craftAlchemy\d+$/.test(key)) return false;
      return normalizeAnalysisName(value).includes(normalizedCraft);
    });
  }

  function extractCharAnalysisAlchemyEffects(charData) {
    const alcLevel = toAnalysisNumber(charData?.skills?.["アルケミスト"]?.level, 0);
    if (alcLevel <= 0) return [];
    const effects = [];
    Object.entries(CHAR_ANALYSIS_ALCHEMY_EFFECT_DEFS).forEach(([key, def]) => {
      if (!charAnalysisHasAlchemyCraft(charData, def.craft)) return;
      const rank = getCharAnalysisAlchemyRank(key);
      const bonus = getCharAnalysisAlchemyBonus(key, rank);
      const hasDirectBonus = bonus !== 0 || def.bonusType === "diceFirst";
      effects.push({
        id: def.id,
        name: def.name,
        skill: "アルケミスト",
        level: alcLevel,
        action: "補助動作",
        cost: `${def.card}${rank}`,
        time: "1回",
        auto: false,
        isAlchemy: true,
        alchemyKey: key,
        summary: def.summary,
        ref: "アルケミスト",
        bonuses: hasDirectBonus
          ? [{ type: def.bonusType, label: def.bonusLabel, value: bonus, uncertain: false }]
          : [{ type: def.bonusType, label: def.bonusLabel, value: 0, uncertain: true }],
      });
    });
    return effects;
  }

  function extractCharAnalysisSupportEffects(usableRows) {
    const effects = [];
    usableRows.forEach((row, rowIndex) => {
      const summary = row["効果概要"] || "";
      const name = row["名称(原文)"] || row["名称(正規)"] || "名称不明";
      const bonuses = [];
      collectAnalysisBonus(summary, /(命中力(?:判定)?|命中)[^\-+＋]{0,12}[+＋]\s*(\d+)/g, "命中補正", "hit", bonuses);
      collectAnalysisBonus(summary, /(回避力(?:判定)?|回避)[^\-+＋]{0,12}[+＋]\s*(\d+)/g, "回避補正", "eva", bonuses);
      collectAnalysisBonus(summary, /(物理ダメージ|近接物理ダメージ|与えるダメージ|ダメージ)[^\-+＋]{0,12}[+＋]\s*(\d+)/g, "物理ダメージ補正", "damage", bonuses);
      collectAnalysisBonus(summary, /(防護点)[^\-+＋]{0,12}[+＋]\s*(\d+)/g, "防護点補正", "def", bonuses);

      if (/筋力ボーナス[^\-+＋]{0,12}[+＋]\s*2/.test(summary) || normalizeAnalysisName(name) === "マッスルベアー") {
        bonuses.push({ type: "damage", label: "近接物理ダメージ補正候補", value: 2, uncertain: true });
      }
      if (/飛行能力|飛行可能|空を飛べる|飛行できる/.test(summary)) {
        bonuses.push({ type: "hit", label: "飛行系補正候補", value: 1, uncertain: true });
        bonuses.push({ type: "eva", label: "飛行系補正候補", value: 1, uncertain: true });
      }

      if (!bonuses.length) return;
      const compact = Object.values(
        bonuses.reduce((acc, bonus) => {
          const key = `${bonus.type}-${bonus.value}-${bonus.label}`;
          acc[key] = bonus;
          return acc;
        }, {}),
      );
      const action = row["動作"] || "-";
      const isAuto = /^[○◯]/.test(String(name).trim()) || /^[○◯]/.test(String(action).trim());
      effects.push({
        id: `${rowIndex}-${normalizeAnalysisName(name)}`,
        name,
        skill: row["技能"] || "-",
        level: toAnalysisNumber(row["Lv"], 0),
        action,
        cost: row["消費"] || "-",
        time: row["時間"] || "-",
        auto: isAuto,
        summary,
        ref: row["参照"] || "",
        bonuses: compact,
      });
    });
    return effects;
  }

  function collectAnalysisBonus(text, regex, label, type, list) {
    for (const match of text.matchAll(regex)) {
      const value = toAnalysisNumber(match[2], 0);
      if (value > 0) list.push({ type, label, value, uncertain: false });
    }
  }

  function calculateCharAnalysisTotals(effects, declarations = []) {
    return [...effects, ...declarations].reduce(
      (total, effect) => {
        (effect.bonuses || []).forEach((bonus) => {
          if (bonus.type === "targetMax") total.targetMax = Math.max(total.targetMax || 1, toAnalysisNumber(bonus.value, 1));
          else total[bonus.type] = (total[bonus.type] || 0) + bonus.value;
        });
        return total;
      },
      { hit: 0, eva: 0, damage: 0, def: 0, crit: 0, diceRepeat: 0, targetMax: 1 },
    );
  }

  function applyCharAnalysisDeclarationSettings(settings, totals = {}) {
    const declarationRepeat = toAnalysisNumber(totals.diceRepeat, 0);
    if (!declarationRepeat) return settings;
    const manualRepeat = toAnalysisNumber(settings?.diceRepeatBonus, 0);
    return {
      ...settings,
      diceRepeatBonus: manualRepeat + declarationRepeat,
      manualDiceRepeatBonus: manualRepeat,
      declarationDiceRepeatBonus: declarationRepeat,
    };
  }

  function getCharAnalysisSkillLevel(charData, skillName) {
    return toAnalysisNumber(charData?.skills?.[skillName]?.level, 0);
  }

  function extractCharAnalysisAccessoryBonus(rawData, regex) {
    const char = rawData?.data && typeof rawData.data === "object" ? rawData.data : rawData;
    let total = 0;
    Object.entries(char || {}).forEach(([key, value]) => {
      if (!/^accessory/.test(key)) return;
      const text = decodeAnalysisPlainText(value);
      const match = text.match(regex);
      if (match) total += toAnalysisNumber(match[1], 0);
    });
    return total;
  }

  function getCharAnalysisInitiativeBase(charData) {
    const scoutLevel = getCharAnalysisSkillLevel(charData, "スカウト");
    const raw = charData?.raw || {};
    const agiBonus = toAnalysisNumber(getAnalysisValue(raw, ["bonusAgi", "agiBonus"], 0), 0);
    if (scoutLevel <= 0) {
      // 戦闘準備モードでは、スカウトがないキャラクターでも先制判定カードを出す。
      // 技能なしは平目として扱い、敵の先制値との比較だけは可能にする。
      return { available: false, label: "先制", skill: "なし", ability: "", level: 0, abilityBonus: 0, base: 0, itemBonus: 0, isFlat: true, source: "flat" };
    }
    const computed = scoutLevel + agiBonus;
    const explicitTotal = toAnalysisNumber(getAnalysisValue(raw, ["initiativeTotal", "initiative"], NaN), NaN);
    const packScoAgi = toAnalysisNumber(getAnalysisValue(raw, ["packScoAgi"], NaN), NaN);
    let base = computed;
    let source = "computed";
    // ゆとシートJSONの packScoAgi は、先制判定で実際に使うパッケージ値として扱う。
    // 明示的な initiativeTotal 等がある場合のみ、それをさらに優先する。
    if (Number.isFinite(packScoAgi)) {
      base = packScoAgi;
      source = "packScoAgi";
    }
    if (Number.isFinite(explicitTotal)) {
      base = explicitTotal;
      source = "explicit";
    }
    return { available: true, label: "先制", skill: "スカウト", ability: "敏捷B", level: scoutLevel, abilityBonus: agiBonus, base, itemBonus: 0, isFlat: false, source };
  }

  function getCharAnalysisMonsterLoreBase(charData) {
    const sageLevel = getCharAnalysisSkillLevel(charData, "セージ");
    if (sageLevel <= 0) return null;
    const raw = charData?.raw || {};
    const intBonus = toAnalysisNumber(getAnalysisValue(raw, ["bonusInt", "intBonus"], 0), 0);
    const computed = sageLevel + intBonus;
    const direct = toAnalysisNumber(getAnalysisValue(raw, ["monsterLore", "packSagKno", "monsterLoreTotal"], computed), computed);
    const itemBonus = extractCharAnalysisAccessoryBonus(raw, /魔物知識[^+＋\-－−]{0,8}[+＋]\s*(\d+)/);
    const base = itemBonus && direct <= computed ? direct + itemBonus : direct;
    return { available: true, label: "魔物知識", skill: "セージ", ability: "知力B", level: sageLevel, abilityBonus: intBonus, base, itemBonus: itemBonus && direct <= computed ? itemBonus : 0 };
  }

  function get2dSuccessRate(base, target, options = {}) {
    const t = toAnalysisNumber(target, NaN);
    const b = toAnalysisNumber(base, NaN);
    const autoSuccess = options.autoSuccess !== false;
    const autoFail = options.autoFail !== false;
    if (!Number.isFinite(t) || !Number.isFinite(b)) return null;
    let success = 0;
    for (let d1 = 1; d1 <= 6; d1 += 1) {
      for (let d2 = 1; d2 <= 6; d2 += 1) {
        const total = d1 + d2;
        if (autoFail && total === 2) continue;
        if ((autoSuccess && total === 12) || total + b >= t) success += 1;
      }
    }
    return { success, total: 36, rate: success / 36, need: t - b, autoSuccess, autoFail };
  }

  function formatAnalysisPercentFromRate(result) {
    if (!result) return "-";
    return `${Math.round(result.rate * 1000) / 10}%`;
  }

  function isCharAnalysisBattlePreparationEffect(effect) {
    return /△/.test(String(effect?.name || "")) || ["initiative", "monsterLore"].includes(String(effect?.bonuses?.[0]?.type || ""));
  }

  function renderScoutLoreSetup(charData, totals) {
    const initiative = getCharAnalysisInitiativeBase(charData);
    const lore = getCharAnalysisMonsterLoreBase(charData);
    const cards = [];
    if (initiative) {
      const initiativeBase = initiative.base + toAnalysisNumber(totals.initiative, 0);
      const initiativeFormula = initiative.isFlat
        ? `2D + 平目${totals.initiative ? ` + 補助${formatSigned(totals.initiative)}` : ""}`
        : `2D + スカウト${initiative.level} + 敏捷B${initiative.abilityBonus}${totals.initiative ? ` + 補助${formatSigned(totals.initiative)}` : ""}`;
      cards.push(`<div class="analysis-scout-setup-card"><b>先制判定</b><span>${initiativeFormula}</span><strong>2D${formatSigned(initiativeBase)}</strong></div>`);
    }
    if (lore) cards.push(`<div class="analysis-scout-setup-card"><b>魔物知識判定</b><span>2D + セージ${lore.level} + 知力B${lore.abilityBonus}${lore.itemBonus ? ` + 装備${formatSigned(lore.itemBonus)}` : ""}${totals.monsterLore ? ` + 補助${formatSigned(totals.monsterLore)}` : ""}</span><strong>2D${formatSigned(lore.base + toAnalysisNumber(totals.monsterLore, 0))}</strong></div>`);
    if (!cards.length) return `<p class="muted">スカウト・セージがないため、戦闘準備判定は表示しません。</p>`;
    return `<div class="analysis-scout-setup-list">${cards.join("")}</div>`;
  }

  function renderScoutLoreAdjusted(charData, totals, settings = getCharAnalysisSettings()) {
    const initiative = getCharAnalysisInitiativeBase(charData);
    const lore = getCharAnalysisMonsterLoreBase(charData);
    const enemy = settings.enemy || {};
    const blocks = [];
    const renderNeedText = (result) => {
      if (!result) return "未入力";
      if (result.rate >= 1) return "自動成功以外でも可";
      if (result.rate <= 0) return result.autoSuccess === false ? "不可" : "6ゾロのみ";
      return `${Math.max(2, Math.min(12, result.need))}以上`;
    };
    const renderThresholdChip = (label, result) => `<span class="analysis-scout-threshold-chip">${escapeAnalysisHtml(renderNeedText(result))}で${escapeAnalysisHtml(label)}</span>`;
    const renderRateBox = (label, result) => `<span class="analysis-match-dpr analysis-scout-rate-box"><b>${escapeAnalysisHtml(formatAnalysisPercentFromRate(result))}</b><small>${escapeAnalysisHtml(label)}</small></span>`;
    const renderTargetNumber = (value) => Number.isFinite(value) ? value : "-";
    const renderScoutMatch = ({ kind, title, judgementResult, selfLabel, selfFormula, selfMeta, thresholdHtml, enemyHtml, rateHtml, noteHtml = "" }) => {
      const grade = judgementResult ? gradeFromRate(judgementResult.rate) : { label: "未入力", className: "unknown" };
      return `<section class="analysis-scout-match-block ${escapeAnalysisHtml(kind)} match-rank-${escapeAnalysisHtml(grade.className)}">
        <div class="analysis-match-summary analysis-action-slot-match-summary analysis-scout-match-summary match-rank-${escapeAnalysisHtml(grade.className)}">
          <div class="analysis-match-side analysis-match-self">
            <div class="analysis-match-label">冒険者</div>
            <div class="analysis-match-main"><span class="analysis-match-main-label">${escapeAnalysisHtml(selfLabel)}</span><strong>${escapeAnalysisHtml(selfFormula)}</strong></div>
            <div class="analysis-match-statline">${escapeAnalysisHtml(selfMeta)}</div>
            <div class="analysis-match-tags analysis-scout-thresholds">${thresholdHtml}</div>
          </div>
          <div class="analysis-match-center">
            <div class="analysis-match-result-head"><div class="analysis-match-judgement">${escapeAnalysisHtml(grade.label)}</div><span class="analysis-match-rate"><b>${escapeAnalysisHtml(formatAnalysisPercentFromRate(judgementResult))}</b><small>${escapeAnalysisHtml(title)}</small></span></div>
            <div class="analysis-match-spark" aria-hidden="true"></div>
            <div class="analysis-match-center-values analysis-scout-rate-row">${rateHtml}</div>
          </div>
          <div class="analysis-match-side analysis-match-enemy">
            <div class="analysis-match-label">敵データ</div>
            ${enemyHtml}
          </div>
        </div>
        ${noteHtml}
      </section>`;
    };
    if (initiative) {
      const base = initiative.base + toAnalysisNumber(totals.initiative, 0);
      const result = get2dSuccessRate(base, enemy.initiativeTarget, { autoSuccess: false });
      blocks.push(renderScoutMatch({
        kind: "is-initiative",
        title: "先制",
        judgementResult: result,
        selfLabel: "先制",
        selfFormula: `2D${formatSigned(base)}`,
        selfMeta: initiative.isFlat
          ? `平目${totals.initiative ? ` + 補助${formatSigned(totals.initiative)}` : ""}`
          : (initiative.source === "packScoAgi"
            ? `先制パッケージ値${totals.initiative ? ` + 補助${formatSigned(totals.initiative)}` : ""}`
            : `スカウト${initiative.level} + 敏捷B${initiative.abilityBonus}${totals.initiative ? ` + 補助${formatSigned(totals.initiative)}` : ""}`),
        thresholdHtml: renderThresholdChip("先制", result),
        enemyHtml: `<div class="analysis-match-main"><span class="analysis-match-main-label">先制値</span><strong>${escapeAnalysisHtml(renderTargetNumber(enemy.initiativeTarget))}</strong></div><div class="analysis-match-statline">${formatAnalysisStatChip("先制値", renderTargetNumber(enemy.initiativeTarget))}</div>`,
        rateHtml: renderRateBox("先制", result),
        noteHtml: totals.initiative ? `<p class="analysis-note">イニシアティブブーストなど: ${escapeAnalysisHtml(formatSigned(totals.initiative))}</p>` : "",
      }));
    }
    if (lore) {
      const base = lore.base + toAnalysisNumber(totals.monsterLore, 0);
      const infoRate = get2dSuccessRate(base, enemy.knowledge);
      const weaknessRate = get2dSuccessRate(base, enemy.weaknessValue);
      const selfMeta = `セージ${lore.level} + 知力B${lore.abilityBonus}${lore.itemBonus ? ` + 装備${formatSigned(lore.itemBonus)}` : ""}${totals.monsterLore ? ` + 補助${formatSigned(totals.monsterLore)}` : ""}`;
      const weaknessText = enemy.weaknessText || charAnalysisEnemyScoutLore.weaknessText || "弱点未入力";
      const enemyStats = [
        formatAnalysisStatChip("知名度", renderTargetNumber(enemy.knowledge)),
        formatAnalysisStatChip("弱点値", renderTargetNumber(enemy.weaknessValue)),
      ].filter(Boolean).join("");
      blocks.push(renderScoutMatch({
        kind: "is-knowledge",
        title: "魔物知識",
        judgementResult: infoRate,
        selfLabel: "魔物知識",
        selfFormula: `2D${formatSigned(base)}`,
        selfMeta,
        thresholdHtml: [
          renderThresholdChip("情報開示", infoRate),
          renderThresholdChip("弱点適用", weaknessRate),
        ].join(""),
        enemyHtml: `<div class="analysis-match-main"><span class="analysis-match-main-label">知名度 / 弱点値</span><strong>${escapeAnalysisHtml(renderTargetNumber(enemy.knowledge))} / ${escapeAnalysisHtml(renderTargetNumber(enemy.weaknessValue))}</strong></div><div class="analysis-match-statline">${enemyStats}</div><div class="analysis-match-tags analysis-scout-weakness-inline"><span class="analysis-match-chip"><b>弱点効果</b>${escapeAnalysisHtml(weaknessText)}</span></div>`,
        rateHtml: `${renderRateBox("情報", infoRate)}${renderRateBox("弱点", weaknessRate)}`,
        noteHtml: totals.monsterLore ? `<p class="analysis-note">エンサイクロペディアなど: ${escapeAnalysisHtml(formatSigned(totals.monsterLore))}</p>` : "",
      }));
    }
    if (!blocks.length) return `<p class="muted">スカウト・セージがないため、このモードでは判定を行いません。</p>`;
    return `<div class="analysis-scout-match-layout">${blocks.join("")}</div><p class="analysis-note">戦闘準備の2D判定は1ゾロ失敗として概算します。6ゾロ自動成功は魔物知識にのみ適用し、先制判定には適用しません。魔物知識は情報開示と弱点適用を同じカード内で確認します。</p>`;
  }

  function renderCharAnalysis() {
    const els = getCharAnalysisElements();
    const currentSettingsDetails = document.querySelector("#panel-character-analysis .analysis-settings-details");
    if (currentSettingsDetails) charAnalysisSettingsOpen = currentSettingsDetails.open;
    updateCharAnalysisBattleModeUi();
    if (!charAnalysisCurrent) {
      setCharAnalysisResultsVisible(false);
      return;
    }
    setCharAnalysisResultsVisible(true);
    const { charData, attackSpells, supportEffects, declarationFeats = [], declarationLimit = { limit: 1, reasons: [] } } = charAnalysisCurrent;
    const settings = getCharAnalysisSettings();
    const isDefenseMode = settings.battleMode === "defense";
    const isScoutMode = settings.battleMode === "scout";
    const visibleSupportEffects = isScoutMode ? supportEffects.filter(isCharAnalysisBattlePreparationEffect) : supportEffects;
    charAnalysisSelectedEffectIds = new Set([...charAnalysisSelectedEffectIds].filter((id) => visibleSupportEffects.some((effect) => effect.id === id)));
    charAnalysisSelectedDeclarationIds = new Set([...charAnalysisSelectedDeclarationIds].filter((id) => declarationFeats.some((feat) => feat.id === id)));
    const selectedEffects = visibleSupportEffects.filter((effect) => effect.auto || charAnalysisSelectedEffectIds.has(effect.id));
    // 宣言特技は1R行動枠の各スロットへ割り当てる。
    // 旧来の単発選択用IDは残っていても、攻撃候補の基礎値へは混ぜない。
    const selectedDeclarations = [];
    const totals = calculateCharAnalysisTotals(selectedEffects, selectedDeclarations);
    const attackOptions = isScoutMode ? [] : (isDefenseMode ? buildEnemyDefenseActionOptions(charAnalysisEnemyActions) : buildCharAnalysisAttackOptions(charData, attackSpells, totals));
    if (!isScoutMode && !attackOptions.some((option) => option.id === charAnalysisSelectedAttackId)) {
      charAnalysisSelectedAttackId = getCharAnalysisDefaultAttackOption(attackOptions)?.id || "";
    }

    els.overview.innerHTML = renderAnalysisOverview(charData);
    initializeAnalysisPortraitNaturalProbe(els.overview, charData.image);
    const attackSetup = isScoutMode
      ? renderScoutLoreSetup(charData, totals)
      : (isDefenseMode
        ? renderDefenseAttackSetup(attackOptions)
        : renderAttackSetupForLeftColumn(attackOptions, declarationFeats, selectedDeclarations, declarationLimit));
    els.weapons.innerHTML = attackSetup;
    els.defense.innerHTML = renderAnalysisDefense(charData.defense, totals);
    if (els.spells) els.spells.innerHTML = renderAnalysisSpells(attackSpells);
    els.effects.innerHTML = isDefenseMode ? renderEnemyDefenseSupportEffects(charAnalysisEnemyActions) : renderAnalysisEffects(visibleSupportEffects);
    els.adjusted.innerHTML = isScoutMode
      ? renderScoutLoreAdjusted(charData, totals, settings)
      : (isDefenseMode
        ? renderDefenseAnalysisAdjusted(charData, totals, attackOptions)
        : renderAnalysisAdjusted(charData, totals, selectedEffects, attackOptions, declarationFeats, selectedDeclarations, declarationLimit));
    if (els.copyOutput) els.copyOutput.value = buildCharAnalysisCopyText(charData, attackSpells, supportEffects, totals, selectedEffects);
  }

  function renderAnalysisOverview(charData) {
    const skillText = Object.entries(charData.skills)
      .sort((a, b) => b[1].level - a[1].level)
      .map(([name, skill]) => `${name}${skill.level}`)
      .join(" / ") || "技能なし";
    if (charData.image?.url) {
      return renderAnalysisPortraitBanner(charData.image, {
        name: charData.name,
        race: charData.race,
        level: charData.level,
        skillText,
      });
    }
    return `<div class="analysis-overview-compact is-text-only">
      <strong class="analysis-overview-name">${escapeAnalysisHtml(charData.name)}</strong>
      <span>${escapeAnalysisHtml(charData.race)}</span>
      <span>冒険者Lv${escapeAnalysisHtml(charData.level)}</span>
      <span class="analysis-overview-skills"><b>技能</b> ${escapeAnalysisHtml(skillText)}</span>
    </div>`;
  }

  function renderAnalysisPortraitBanner(image, overview) {
    if (!image?.url) return "";
    const preset = getAnalysisPortraitPreset(image);
    const crop = getAnalysisPortraitBannerCrop(image, preset);
    const scale = getAnalysisPortraitBannerScale(image.percent, preset);
    const height = preset.height;
    const style = [
      `--analysis-portrait-url: url('${escapeAnalysisCssUrl(image.url)}')`,
      `--analysis-portrait-fit: ${sanitizeAnalysisImageFit(image.fit)}`,
      `--analysis-portrait-size: ${scale}% auto`,
      `--analysis-portrait-position: ${crop.x}% ${crop.y}%`,
      `--analysis-portrait-height: ${height}px`,
    ].join("; ");
    const header = `<div class="analysis-overview-header">
      <div class="analysis-overview-header-main">
        <strong class="analysis-overview-name">${escapeAnalysisHtml(overview.name)}</strong>
        <span class="analysis-overview-meta">${escapeAnalysisHtml(overview.race)} / 冒険者Lv${escapeAnalysisHtml(overview.level)}</span>
      </div>
      <div class="analysis-overview-sub"><b>技能</b> ${escapeAnalysisHtml(overview.skillText)}</div>
    </div>`;
    return `<div class="analysis-portrait-tuner" data-analysis-portrait-tuner data-source-x="${clampAnalysisNumber(image.positionX, 0, 100)}" data-source-y="${clampAnalysisNumber(image.positionY, 0, 100)}" data-source-percent="${clampAnalysisNumber(image.percent, 50, 400)}" data-source-fit="${escapeAnalysisHtml(image.fit || "")}" data-source-url="${escapeAnalysisHtml(image.url)}" data-portrait-kind="${escapeAnalysisHtml(preset.kind)}">
      <div class="analysis-portrait-preview-row">
        <div class="analysis-portrait-banner" style="${escapeAnalysisHtml(style)}" role="img" aria-label="${escapeAnalysisHtml(overview.name)}のキャラクター画像バナー">${header}</div>
      </div>
    </div>`;
  }

  function renderAnalysisPortraitTunerControls(crop, scale, height, preset) {
    const controls = [
      { key: "xBase", label: "X定数", min: 0, max: 100, step: 1, value: preset.xBase },
      { key: "xRatio", label: "X係数", min: 0, max: 1.5, step: 0.05, value: preset.xRatio },
      { key: "yBase", label: "Y定数", min: -100, max: 100, step: 1, value: preset.yBase },
      { key: "yRatio", label: "Y係数", min: 0, max: 1.5, step: 0.05, value: preset.yRatio },
      { key: "scaleInfluence", label: "拡大係数", min: 0, max: 1.5, step: 0.05, value: preset.scaleInfluence },
      { key: "scaleMultiplier", label: "拡大倍率", min: 0.2, max: 1.8, step: 0.05, value: preset.scaleMultiplier },
      { key: "height", label: "高さ", min: 60, max: 180, step: 1, value: Math.round(height) },
    ];
    return `<details class="analysis-portrait-tuner-controls" open>
      <summary>画像バナー一時調整 <span class="analysis-portrait-kind">推定: ${escapeAnalysisHtml(preset.label)}</span></summary>
      <div class="analysis-portrait-tuner-grid">
        ${controls.map((control) => `<label>${escapeAnalysisHtml(control.label)}
          <input type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${control.value}" data-portrait-control="${control.key}">
          <output>${control.value}</output>
        </label>`).join("")}
      </div>
      <code class="analysis-portrait-tuner-values">決定稿: kind:${escapeAnalysisHtml(preset.kind)} xBase:${preset.xBase} xRatio:${preset.xRatio} yBase:${preset.yBase} yRatio:${preset.yRatio} scaleInfluence:${preset.scaleInfluence} scaleMultiplier:${preset.scaleMultiplier} height:${Math.round(height)} / final x:${Math.round(crop.x)} y:${Math.round(crop.y)} scale:${Math.round(scale)}</code>
    </details>`;
  }

  function getAnalysisPortraitPreset(imageOrPercent) {
    const image = imageOrPercent && typeof imageOrPercent === "object" ? imageOrPercent : null;
    const sourcePercent = clampAnalysisNumber(image ? image.percent : imageOrPercent, 50, 400);
    const fit = String(image?.fit || "").toLowerCase();

    if (fit.includes("percenty")) {
      return getAnalysisPortraitPresetByKind("tall");
    }
    if (fit.includes("percentx")) {
      return getAnalysisPortraitPresetByKind(sourcePercent >= 170 ? "percentx" : "upper");
    }
    if (sourcePercent >= 170) {
      return getAnalysisPortraitPresetByKind("close");
    }
    if (sourcePercent >= 120) {
      return getAnalysisPortraitPresetByKind("bust");
    }
    return getAnalysisPortraitPresetByKind("full");
  }

  function getAnalysisPortraitPresetByKind(kind) {
    const presets = {
      close: { kind: "close", label: "顔アップ", xBase: 50, xRatio: 0.45, yBase: 7, yRatio: 0.22, scaleInfluence: 0.25, scaleMultiplier: 0.35, height: 110 },
      percentx: { kind: "percentx", label: "横基準トリミング", xBase: 50, xRatio: 0.45, yBase: 7, yRatio: 0.22, scaleInfluence: 0.25, scaleMultiplier: 0.35, height: 110 },
      bust: { kind: "bust", label: "バストアップ", xBase: 50, xRatio: 0.55, yBase: 10, yRatio: 0.28, scaleInfluence: 0.35, scaleMultiplier: 0.45, height: 110 },
      upper: { kind: "upper", label: "上半身", xBase: 50, xRatio: 0.62, yBase: 15, yRatio: 0.26, scaleInfluence: 0.4, scaleMultiplier: 0.55, height: 110 },
      cover: { kind: "cover", label: "拡大カバー", xBase: 50, xRatio: 0.62, yBase: 38, yRatio: 0.2, scaleInfluence: 0.35, scaleMultiplier: 0.62, height: 110 },
      full: { kind: "full", label: "全身", xBase: 50, xRatio: 0.75, yBase: 26, yRatio: 0.2, scaleInfluence: 0.45, scaleMultiplier: 0.85, height: 110 },
      tall: { kind: "tall", label: "縦長全身", xBase: 50, xRatio: 0.8, yBase: 20, yRatio: 0.55, scaleInfluence: 0.45, scaleMultiplier: 0.9, height: 110 },
      wide: { kind: "wide", label: "横長", xBase: 50, xRatio: 0.28, yBase: 32, yRatio: 0.16, scaleInfluence: 0.16, scaleMultiplier: 0.9, height: 110 },
    };
    return presets[kind] || presets.full;
  }

  function getAnalysisPortraitTypeFromDimensions(width, height, image = {}) {
    const aspectRatio = width > 0 && height > 0 ? width / height : 1;
    const fit = String(image.fit || "").toLowerCase();
    const percent = clampAnalysisNumber(image.percent, 50, 400);

    if (fit.includes("percentx")) {
      return percent >= 170 ? "percentx" : "upper";
    }
    if (aspectRatio < 0.5 || fit.includes("percenty")) {
      return "tall";
    }
    if (aspectRatio <= 0.62) {
      return "full";
    }
    if (aspectRatio <= 0.8) {
      return fit.includes("cover") || percent >= 150 ? "cover" : "upper";
    }
    if (aspectRatio <= 1.1) {
      return percent >= 160 ? "close" : "bust";
    }
    return "wide";
  }

  function getAnalysisPortraitPresetFromDimensions(width, height, image) {
    const type = getAnalysisPortraitTypeFromDimensions(width, height, image);
    return getAnalysisPortraitPresetByKind(type);
  }

  function getAnalysisPortraitBannerCrop(image, preset = getAnalysisPortraitPreset(image?.percent)) {
    const sourceX = clampAnalysisNumber(image?.positionX, 0, 100);
    const sourceY = clampAnalysisNumber(image?.positionY, 0, 100);
    const x = preset.xBase + ((sourceX - 50) * preset.xRatio);
    const y = preset.yBase + (sourceY * preset.yRatio);
    return {
      x: clampAnalysisNumber(x, 0, 100),
      y: clampAnalysisNumber(y, 0, 100),
    };
  }

  function getAnalysisPortraitBannerScale(percent, preset = getAnalysisPortraitPreset(percent)) {
    const sourcePercent = clampAnalysisNumber(percent, 50, 400);
    const baseScale = (100 + ((sourcePercent - 100) * preset.scaleInfluence)) * preset.scaleMultiplier;
    return clampAnalysisNumber(baseScale * 0.75, 26, 180);
  }

  function escapeAnalysisCssUrl(value) {
    return String(value || "").replace(/[\\'\n\r\f]/g, "");
  }

  function sanitizeAnalysisImageFit(value) {
    const fit = String(value || "cover").trim();
    return ["cover", "contain", "auto"].includes(fit) ? fit : "cover";
  }

  function clampAnalysisNumber(value, min, max) {
    const num = toAnalysisNumber(value, min);
    return Math.min(max, Math.max(min, num));
  }

  function getPrimarySpellAttackId(attackSpells = []) {
    if (!attackSpells.length) return "";
    const indexed = attackSpells.map((spell, index) => ({ spell, index }));
    indexed.sort((a, b) => (b.spell.level || 0) - (a.spell.level || 0) || (b.spell.k || 0) - (a.spell.k || 0));
    return `spell-${indexed[0].index}`;
  }

  function renderAnalysisWeapons(weapons, totals, attackSpells = []) {
    const cards = [];
    if (attackSpells.length) {
      const groups = attackSpells.reduce((acc, spell, index) => {
        const key = spell.system === "深智魔法" || spell.skill === "ウィザード" ? "深智魔法（ウィザード）" : (spell.system || spell.skill || "魔法");
        if (!acc[key]) acc[key] = [];
        acc[key].push({ spell, index });
        return acc;
      }, {});
      Object.entries(groups).forEach(([system, entries]) => {
        entries.sort((a, b) => (b.spell.level || 0) - (a.spell.level || 0) || (b.spell.k || 0) - (a.spell.k || 0));
        const top = entries[0];
        const attackId = `spell-${top.index}`;
        const selected = entries.some((entry) => `spell-${entry.index}` === charAnalysisSelectedAttackId) ? " is-selected" : "";
        const skills = [...new Set(entries.map((entry) => entry.spell.skill).filter(Boolean))].join("＋") || system;
        cards.push(`<button type="button" class="analysis-weapon-row-card analysis-magic-row-card${selected}" data-analysis-attack-id="${escapeAnalysisHtml(attackId)}">
        <span class="analysis-weapon-row-main">
          <strong class="analysis-weapon-row-name"><i class="fa-solid fa-wand-sparkles"></i> ${escapeAnalysisHtml(system)}</strong>
          <code class="analysis-weapon-row-formula">${escapeAnalysisHtml(String(entries.length))}件</code>
        </span>
        <span class="analysis-weapon-row-sub">
          <span>主力候補 ${escapeAnalysisHtml(top.spell?.name || "-")}</span>
          <span>${escapeAnalysisHtml(skills)} Lv${escapeAnalysisHtml(top.spell?.level || "-")}</span>
        </span>
      </button>`);
      });
    }
    if (weapons.length) {
      weapons.forEach((weapon, index) => {
        const attackId = `weapon-${index}`;
        const formula = `K${weapon.rate}@${weapon.crit}${formatSigned(weapon.dmg + totals.damage)}`;
        const category = [weapon.category, weapon.rank].filter(Boolean).join(" / ") || "-";
        const selected = attackId === charAnalysisSelectedAttackId ? " is-selected" : "";
        const note = weapon.note ? `<span class="analysis-weapon-row-note">${escapeAnalysisHtml(weapon.note)}</span>` : "";
        cards.push(`<button type="button" class="analysis-weapon-row-card${selected}" data-analysis-attack-id="${escapeAnalysisHtml(attackId)}">
          <span class="analysis-weapon-row-main">
            <strong class="analysis-weapon-row-name">${renderSw25DecoratedNameHtml(weapon.name)}</strong>
            <code class="analysis-weapon-row-formula">${escapeAnalysisHtml(formula)}</code>
          </span>
          <span class="analysis-weapon-row-sub">
            <span>命中 ${escapeAnalysisHtml(formatAnalysisChanged(weapon.acc, totals.hit))}</span>
            <span>分類 ${escapeAnalysisHtml(category)}</span>
            ${note}
          </span>
        </button>`);
      });
    }
    if (!cards.length) return `<p class="muted">武器・魔法候補が見つかりませんでした。</p>`;
    return `<div class="analysis-weapon-row-list">${cards.join("")}</div>`;
  }

  function renderAnalysisDefense(defense, totals) {
    return `<dl class="analysis-defense-compact">
      <div><dt>HP</dt><dd>${escapeAnalysisHtml(defense.hp)}</dd></div>
      <div><dt>MP</dt><dd>${escapeAnalysisHtml(defense.mp)}</dd></div>
      <div><dt>回避</dt><dd>${escapeAnalysisHtml(formatAnalysisChanged(defense.eva, totals.eva))}</dd></div>
      <div><dt>防護</dt><dd>${escapeAnalysisHtml(formatAnalysisChanged(defense.def, totals.def, { signed: false }))}</dd></div>
      <div><dt>生命抵抗</dt><dd>${formatSigned(defense.vitRes)}</dd></div>
      <div><dt>精神抵抗</dt><dd>${formatSigned(defense.mndRes)}</dd></div>
      <div><dt>先制</dt><dd>${escapeAnalysisHtml(defense.initiative || "-")}</dd></div>
    </dl>`;
  }

  function renderAnalysisSpells(spells) {
    if (!spells.length) return `<p class="muted">該当技能レベル以下の攻撃魔法候補は見つかりませんでした。</p>`;
    const top = spells.slice().sort((a, b) => b.level - a.level || b.k - a.k)[0];
    return `<p class="analysis-note">攻撃魔法 ${spells.length}件を平均ダメージ/R選択肢に追加しました。初期選択: ${escapeAnalysisHtml(top.name)}</p>`;
  }

  function renderAnalysisEffects(effects) {
    if (!effects.length) return `<p class="muted">補助効果候補は見つかりませんでした。</p>`;
    return `<div class="analysis-effect-list">${effects.map((effect) => {
      const checked = (effect.auto || charAnalysisSelectedEffectIds.has(effect.id)) ? "checked" : "";
      const autoAttr = effect.auto ? "disabled" : "";
      const autoBadge = effect.auto ? `<span class="analysis-effect-auto-badge">自動</span>` : "";
      const bonusText = effect.bonuses.map((bonus) => `${bonus.label} ${formatSigned(bonus.value)}${bonus.uncertain ? "（候補・要確認）" : ""}`).join(" / ");
      const alchemyControls = effect.isAlchemy ? (() => {
        const effectKey = normalizeCharAnalysisAlchemyKey(effect.alchemyKey);
        const def = CHAR_ANALYSIS_ALCHEMY_EFFECT_DEFS[effectKey];
        const currentRank = getCharAnalysisAlchemyRank(effectKey);
        const rankOptions = CHAR_ANALYSIS_ALCHEMY_RANKS.map((rank) => `<option value="${rank}" ${rank === currentRank ? "selected" : ""}>${rank}</option>`).join("");
        const currentBonus = getCharAnalysisAlchemyBonus(effectKey, currentRank);
        const marker = def?.bonusType === "diceFirst"
          ? `$${formatSigned(currentBonus)}`
          : currentBonus
            ? formatSigned(currentBonus)
            : "効果";
        return `<span class="analysis-effect-controls analysis-alchemy-controls"><span>ランク</span><span class="analysis-alchemy-select-wrap"><select id="char-analysis-alchemy-rank-${escapeAnalysisHtml(effectKey)}" class="char-analysis-alchemy-rank-select" data-alchemy-effect="${escapeAnalysisHtml(effectKey)}" aria-label="${escapeAnalysisHtml(def?.craft || "賦術")}のカードランク">${rankOptions}</select></span><em>${escapeAnalysisHtml(marker)}</em></span>`;
      })() : "";
      return `<label class="analysis-effect-item${effect.auto ? " is-auto" : ""}${effect.isAlchemy ? " is-alchemy" : ""}">
        <input type="checkbox" class="char-analysis-effect-check" data-effect-id="${escapeAnalysisHtml(effect.id)}" ${checked} ${autoAttr} />
        <span class="analysis-effect-body">
          <span class="analysis-effect-title"><strong>${renderAnalysisDaggerHtml(effect.name)}</strong>${autoBadge}</span>
          <span class="analysis-effect-meta">${escapeAnalysisHtml(effect.skill)} Lv${effect.level} / ${escapeAnalysisHtml(effect.cost)} / ${escapeAnalysisHtml(effect.time)}</span>
          ${alchemyControls}
          <span class="analysis-effect-bonus">${escapeAnalysisHtml(bonusText)}</span>
          <span class="analysis-effect-reason">根拠: ${escapeAnalysisHtml(effect.summary)}${effect.ref ? ` / ${escapeAnalysisHtml(effect.ref)}` : ""}</span>
        </span>
      </label>`;
    }).join("")}</div>`;
  }

  function isEnemyAttackSpellRow(row) {
    const effect = row?.["効果概要"] || "";
    const name = `${row?.["名称(原文)"] || ""} ${row?.["名称(正規)"] || ""}`;
    return /(威力|[kKｋＫ]\s*\d+|魔法ダメージ|確定ダメージ|ダメージ)/.test(effect) || /(エネルギー|ブラスト|アロー|ボルト|ショック|スラッシュ|ブリザード|ファイア|ライトニング)/.test(name);
  }

  function buildEnemyMagicSpellOptions(actions = charAnalysisEnemyActions) {
    const options = [];
    (actions.magic || []).forEach((ability, abilityIndex) => {
      const skillSet = new Set(ability.skills || []);
      const systemSet = new Set(ability.systems || []);
      charAnalysisCsvRows.forEach((row, rowIndex) => {
        const skill = row["技能"] || "";
        const system = row["系統"] || "";
        const level = toAnalysisNumber(row["Lv"], 0);
        if ((!skillSet.has(skill) && !systemSet.has(system)) || level > ability.level || !isEnemyAttackSpellRow(row)) return;
        const effect = row["効果概要"] || "";
        const kMatch = effect.match(/[kKｋＫ]\s*(\d+)/);
        const damageType = /確定ダメージ/.test(effect) ? "確定" : "魔法";
        const name = row["名称(原文)"] || row["名称(正規)"] || "名称不明";
        options.push({
          id: `enemy-spell-${abilityIndex}-${rowIndex}`,
          type: "enemy-spell",
          label: `${name} / ${skill}Lv${level} / 魔力${ability.power}`,
          name,
          sourceName: ability.systems.join("・"),
          part: ability.part || "共通",
          level,
          skill: `${skill} Lv${level}`,
          activeBase: ability.power,
          cast: ability.power,
          oppose: /生命抵抗/.test(row["抵抗"] || effect) ? "生命抵抗" : "精神抵抗",
          result: row["抵抗"] || "半減",
          rate: kMatch ? toAnalysisNumber(kMatch[1], 0) : 0,
          add: ability.power,
          damageType,
          attribute: row["属性"] || "-",
          target: row["対象"] || "-",
          range: row["射程/形状"] || "-",
          note: effect.slice(0, 160),
        });
      });
    });
    return options;
  }

  function buildEnemyDefenseActionOptions(actions = charAnalysisEnemyActions) {
    const normal = (actions.normal || []).map((item, index) => ({
      id: `enemy-normal-${index}`,
      type: "enemy-normal",
      label: `${item.name} / 命中${formatSigned(item.base)} / 2D${formatSigned(item.damage)}`,
      name: item.name,
      part: item.part || "-",
      activeBase: item.base,
      oppose: "回避",
      result: "消滅",
      damageDice: "2D",
      damageBonus: item.damage,
      damageType: "物理",
      range: item.range || "近接/記載準拠",
      target: "1体",
      note: item.note || "通常攻撃",
    }));
    const special = (actions.special || []).map((item, index) => ({
      id: item.id || `enemy-special-${index}`,
      type: "enemy-special",
      label: `${item.name} / ${item.base === "必中" ? "必中" : `${item.oppose}${formatSigned(item.base)}`} / ${formatEnemyDamageDisplay(item)}`,
      name: item.name,
      part: item.part || "共通",
      activeBase: item.base,
      oppose: item.oppose || "-",
      result: item.result || "-",
      damageDice: item.damageDice || "",
      damageBonus: item.damage,
      damageExpr: item.damageExpr,
      damageType: item.damageType || "-",
      range: item.range || "-",
      target: "記載準拠",
      note: item.note || item.summary || "",
    }));
    return [...normal, ...special, ...buildEnemyMagicSpellOptions(actions)];
  }

  function renderEnemyDefenseActionCards(options = []) {
    if (!options.length) return `<p class="muted">敵攻撃方法候補がありません。敵シートを読み込んでください。</p>`;
    return `<div class="analysis-weapon-row-list">${options.map((option) => {
      const selected = option.id === charAnalysisSelectedAttackId ? " is-selected" : "";
      const formula = option.type === "enemy-spell"
        ? `K${option.rate}${formatSigned(option.add)} ${option.damageType}`
        : `${option.damageExpr || `${option.damageDice || "?"}${formatSigned(option.damageBonus)}`} ${option.damageType}`;
      const icon = option.type === "enemy-spell" ? "fa-solid fa-wand-sparkles" : "fa-solid fa-skull-crossbones";
      const subLine = option.type === "enemy-spell"
        ? `<span>${escapeAnalysisHtml(option.skill || option.sourceName || "魔法")}</span><span>${escapeAnalysisHtml(option.oppose || "抵抗")} / ${escapeAnalysisHtml(getCompactResistanceText(option.result))}</span>`
        : `<span>${escapeAnalysisHtml(option.part || "共通")}</span><span>${escapeAnalysisHtml(option.activeBase === "必中" ? "必中" : `達成値 ${formatSigned(option.activeBase)}`)}</span><span>${escapeAnalysisHtml(option.oppose || "対抗不明")} / ${escapeAnalysisHtml(getCompactResistanceText(option.result))}</span>`;
      return `<button type="button" class="analysis-weapon-row-card analysis-enemy-attack-row-card${selected}" data-analysis-attack-id="${escapeAnalysisHtml(option.id)}">
        <span class="analysis-weapon-row-main">
          <strong class="analysis-weapon-row-name"><i class="${icon}"></i> ${escapeAnalysisHtml(option.name)}</strong>
          <code class="analysis-weapon-row-formula">${escapeAnalysisHtml(formula)}</code>
        </span>
        <span class="analysis-weapon-row-sub">
          ${subLine}
        </span>
      </button>`;
    }).join("")}</div>`;
  }

  function renderAttackSetupForLeftColumn(options, declarations = [], selectedDeclarations = [], declarationLimit = { limit: 1, reasons: [] }) {
    const selected = options.find((option) => option.id === charAnalysisSelectedAttackId);
    const settings = getCharAnalysisSettings();
    return renderAttackPickerArea(options, selected, settings, declarations, selectedDeclarations, declarationLimit);
  }

  function renderDefenseAttackSetup(actionOptions = []) {
    const selected = actionOptions.find((option) => option.id === charAnalysisSelectedAttackId) || actionOptions[0];
    const selectedDetail = selected ? `<dl class="analysis-definition-list compact analysis-attack-detail-list">
      <div class="analysis-detail-type"><dt>敵行動</dt><dd>${escapeAnalysisHtml(selected.name)}</dd></div>
      <div class="analysis-detail-chip"><dt>対抗</dt><dd>${escapeAnalysisHtml(selected.oppose || "-")}</dd></div>
      <div class="analysis-detail-chip"><dt>結果</dt><dd>${escapeAnalysisHtml(getCompactResistanceText(selected.result))}</dd></div>
      <div class="analysis-detail-chip"><dt>射程/対象</dt><dd>${escapeAnalysisHtml([selected.range, selected.target].filter(Boolean).join(" / ") || "-")}</dd></div>
    </dl>` : `<p class="muted">敵攻撃方法候補を選択してください。</p>`;
    return `<div class="analysis-attack-picker-area analysis-left-attack-setup">
      <div class="analysis-attack-picker-select">${renderAttackOptionSelect(actionOptions).replace("使う武器・魔法", "敵行動")}</div>
      <div class="analysis-attack-picker-detail">${selectedDetail}<p class="analysis-note">${escapeAnalysisHtml(selected?.note || "")}</p></div>
    </div>`;
  }

  function renderEnemyDefenseSupportEffects(actions = charAnalysisEnemyActions) {
    const items = [];
    (actions.support || []).forEach((effect) => {
      items.push({ name: effect.name, kind: "敵補助", meta: effect.part || "共通", bonus: formatEnemySupportBonusText(effect.bonuses), note: effect.techniques?.map((technique) => `${technique.name}: ${formatEnemySupportBonusText(technique.bonuses)}`).join(" / ") || effect.summary || "" });
    });
    (actions.declarations || []).forEach((feat) => {
      items.push({ name: feat.name, kind: "敵宣言", meta: feat.part || "共通", bonus: formatDeclarationBonusText(feat.bonuses, feat.risks || []), note: feat.note || feat.summary || "" });
    });
    if (!items.length) return `<p class="muted">敵補助効果候補は見つかりませんでした。</p>`;
    return `<div class="analysis-effect-list">${items.map((item) => `<div class="analysis-effect-item is-auto">
      <span class="analysis-effect-body">
        <span class="analysis-effect-title"><strong>${escapeAnalysisHtml(item.name)}</strong><span class="analysis-effect-auto-badge">${escapeAnalysisHtml(item.kind)}</span></span>
        <span class="analysis-effect-meta">${escapeAnalysisHtml(item.meta)}</span>
        <span class="analysis-effect-bonus">${escapeAnalysisHtml(item.bonus)}</span>
        <span class="analysis-effect-reason">${escapeAnalysisHtml(item.note)}</span>
      </span>
    </div>`).join("")}</div>`;
  }

  function buildCharAnalysisManualAttackOption() {
    const manual = { ...createCharAnalysisManualAdjust(), ...charAnalysisManualAdjust };
    const readManualBase = (key, fallback) => {
      const raw = manual[`${key}Abs`];
      if (raw === null || raw === undefined || String(raw).trim() === "") return fallback;
      return toAnalysisNumber(raw, fallback);
    };
    const hit = readManualBase("hit", 0);
    const rate = Math.max(0, readManualBase("rate", 0));
    const add = readManualBase("add", 0);
    const crit = readManualBase("crit", 10) || 10;
    return {
      id: CHAR_ANALYSIS_MANUAL_ATTACK_ID,
      source: "manual",
      type: "weapon",
      label: `直接指定 / K${rate}@${crit}${formatSigned(add)}`,
      name: "直接指定",
      skill: "直接指定",
      category: "任意",
      usage: "-",
      reqd: "-",
      hit,
      rate,
      crit,
      add,
      resist: "命中判定",
      attribute: "-",
      target: "-",
      range: "-",
      note: "キャラシから取得できない攻撃を数値で直接指定します。",
      weaponNote: "直接指定の値をベースに、追加補正を重ねて試算します。",
    };
  }

  function buildCharAnalysisAttackOptions(charData, attackSpells, totals) {
    const bulletSpells = attackSpells.filter((spell) => spell.isBullet).map((spell, index) => ({ ...spell, id: `bullet-${index}` }));
    const weaponOptions = charData.weapons.map((weapon, index) => {
      const rate = Math.max(0, toAnalysisNumber(weapon.rate, 0));
      const crit = toAnalysisNumber(weapon.crit, 0) || 10;
      const add = weapon.dmg + totals.damage;
      const neckRipperText = [weapon.name, weapon.note].filter(Boolean).join(" ");
      const neckRipperAuto = /首切り刀/.test(neckRipperText);
      const neckRipperCandidate = !neckRipperAuto && !!charData.hasNeckRipperCandidate;
      const neckRipperSuffix = neckRipperAuto ? "r5" : "";
      return {
        id: `weapon-${index}`,
        type: "weapon",
        label: `${weapon.name} / K${rate}@${crit}${formatSigned(add)}${neckRipperSuffix}`,
        name: weapon.name,
        level: toAnalysisNumber(charData.skills?.[weapon.rank]?.level, 0),
        skill: weapon.rank || "-",
        category: weapon.category || "-",
        usage: weapon.usage || "-",
        reqd: weapon.reqd || "-",
        hit: weapon.acc + totals.hit,
        rate,
        crit: crit + toAnalysisNumber(totals.crit, 0),
        add,
        resist: "命中判定",
        attribute: "-",
        target: "-",
        range: "-",
        note: "-",
        weaponNote: weapon.note || "",
        bulletOptions: /ガン/.test(`${weapon.category || ""} ${weapon.name || ""}`) ? bulletSpells : [],
        neckRipperAuto,
        neckRipperCandidate,
      };
    });
    const spellOptions = attackSpells.filter((spell) => !spell.isBullet).map((spell, index) => {
      const critMatch = String(spell.effect || "").match(/C値\s*[-－−]?\s*(\d+)/);
      const crit = critMatch ? toAnalysisNumber(critMatch[1], 10) : 10;
      return {
        id: `spell-${index}`,
        type: "spell",
        label: `${spell.name} / K${spell.k}@${crit}${formatSigned(spell.magicPower)}`,
        name: spell.name,
        level: spell.level,
        skill: `${spell.skill} Lv${spell.level}`,
        hit: null,
        cast: spell.magicPower,
        rate: spell.k,
        crit,
        add: spell.magicPower,
        resist: spell.resist || "-",
        attribute: spell.attribute || "-",
        target: spell.target || "-",
        range: spell.range || "-",
        note: [spell.target, spell.range].filter(Boolean).join(" / ") || "-",
      };
    });
    return [...weaponOptions, ...spellOptions, buildCharAnalysisManualAttackOption()];
  }

  function getCharAnalysisAttackDefaultPriority(option) {
    if (!option) return { level: -1, typePriority: 0, rate: 0, hit: -999 };
    const level = toAnalysisNumber(option.level, 0);
    const typePriority = option.type === "weapon" ? 2 : (option.type === "spell" || option.type === "enemy-spell") ? 1 : 0;
    return {
      level,
      typePriority,
      rate: toAnalysisNumber(option.rate, 0),
      hit: toAnalysisNumber(option.hit ?? option.cast, -999),
    };
  }

  function compareCharAnalysisAttackDefault(a, b) {
    const pa = getCharAnalysisAttackDefaultPriority(a);
    const pb = getCharAnalysisAttackDefaultPriority(b);
    return (pb.level - pa.level)
      || (pb.typePriority - pa.typePriority)
      || (pb.rate - pa.rate)
      || (pb.hit - pa.hit);
  }

  function getCharAnalysisDefaultAttackOption(options = []) {
    return options
      .filter((option) => option.type === "weapon" || option.type === "spell" || option.type === "enemy-spell")
      .sort(compareCharAnalysisAttackDefault)[0] || options[0] || null;
  }

  function renderAttackOptionSelect(options) {
    if (!options.length) return `<p class="muted">武器・攻撃魔法候補がありません。</p>`;
    const optionHtml = options.map((option) => {
      const selected = option.id === charAnalysisSelectedAttackId ? "selected" : "";
      return `<option value="${escapeAnalysisHtml(option.id)}" ${selected}>${escapeAnalysisHtml(renderSw25DecoratedNameText(option.label))}</option>`;
    }).join("");
    return `<label class="analysis-attack-select-label">使う武器・魔法
      <select id="char-analysis-attack-select">${optionHtml}</select>
    </label>`;
  }

  function getSelectedAttackDetailItems(adjusted) {
    if (!adjusted) return [];
    if (adjusted.type === "weapon") {
      const items = [
        ["使用技能", adjusted.skill || "-", "analysis-detail-type"],
        ["カテゴリ", adjusted.category || "-", "analysis-detail-chip"],
        ["用法", adjusted.usage || "-", "analysis-detail-chip"],
        ["必筋", adjusted.reqd || "-", "analysis-detail-chip"],
        ...(adjusted.source === "gun-bullet" ? [["弾丸", adjusted.bulletLabel || adjusted.bulletName || "バレット", "analysis-detail-chip analysis-detail-good"]] : []),
      ];
      if (isCharAnalysisNeckRipperWeapon(adjusted)) {
        items.push(["首切り", "自動 r5", "analysis-detail-chip analysis-detail-good"]);
      } else if (adjusted.neckRipperCandidate) {
        items.push(["首切り候補", "手動r推奨", "analysis-detail-chip analysis-detail-warning"]);
      }
      return items;
    }
    return [
      ["使用技能", adjusted.skill || "-", "analysis-detail-type"],
      ["抵抗", getCompactResistanceText(adjusted.resist), "analysis-detail-chip"],
      ["属性", adjusted.attribute || "-", "analysis-detail-chip"],
      ["対象", adjusted.target || "-", "analysis-detail-chip"],
      ["射程/形状", adjusted.range || "-", "analysis-detail-chip"],
    ];
  }

  function renderSelectedAttackDetailList(adjusted) {
    if (!adjusted) return `<p class="muted">攻撃候補を選択してください。</p>`;
    return `<dl class="analysis-definition-list compact analysis-attack-detail-list">${getSelectedAttackDetailItems(adjusted).map(([label, value, className]) => `<div class="${className}"><dt>${escapeAnalysisHtml(label)}</dt><dd>${escapeAnalysisHtml(value)}</dd></div>`).join("")}</dl>`;
  }


  function getCharAnalysisSlotManualAdjust(slotKey) {
    if (!charAnalysisActionPlan.slotManualAdjusts || typeof charAnalysisActionPlan.slotManualAdjusts !== "object") charAnalysisActionPlan.slotManualAdjusts = {};
    if (!charAnalysisActionPlan.slotManualAdjusts[slotKey]) charAnalysisActionPlan.slotManualAdjusts[slotKey] = createCharAnalysisManualAdjust();
    return { ...createCharAnalysisManualAdjust(), ...charAnalysisActionPlan.slotManualAdjusts[slotKey] };
  }

  function getCharAnalysisSettingsForSlot(baseSettings, slotKey) {
    return { ...baseSettings, manual: getCharAnalysisSlotManualAdjust(slotKey) };
  }

  function applyCharAnalysisManualAdjustToOption(option, manual = createCharAnalysisManualAdjust()) {
    if (!option) return option;
    const next = { ...option };
    const manualValue = (key, base, fallback = 0) => base + toAnalysisNumber(manual[key], fallback);
    next.rate = Math.max(0, manualValue("rate", toAnalysisNumber(option.rate, 0), 0));
    next.crit = manualValue("crit", toAnalysisNumber(option.crit, 10), 0);
    next.add = manualValue("add", toAnalysisNumber(option.add, 0), 0);
    if (option.type === "weapon") {
      next.hit = manualValue("hit", toAnalysisNumber(option.hit, 0), 0);
    } else {
      const baseCast = toAnalysisNumber(option.cast ?? option.add, 0);
      next.cast = manualValue("hit", baseCast, 0);
    }
    return next;
  }

  function renderCharAnalysisSlotManualAdjust(slotKey) {
    const manual = getCharAnalysisSlotManualAdjust(slotKey);
    const relativeInput = (label, key) => `<label>${escapeAnalysisHtml(label)}+<input type="number" class="char-analysis-slot-manual-input" data-slot="${escapeAnalysisHtml(slotKey)}" data-manual-key="${escapeAnalysisHtml(key)}" value="${escapeAnalysisHtml(manual[key] ?? 0)}" placeholder="0" /></label>`;
    return `<details class="analysis-slot-manual-adjust">
      <summary>追加補正</summary>
      <div class="analysis-manual-grid analysis-manual-grid-extended">
        ${relativeInput("判定", "hit")}
        ${relativeInput("威力", "rate")}
        ${relativeInput("固定値", "add")}
        ${relativeInput("C値", "crit")}
      </div>
    </details>`;
  }

  function applyCharAnalysisDeclarationBonusesToOption(option, declarations = []) {
    const totals = calculateCharAnalysisTotals([], declarations);
    const next = { ...option };
    if (next.type === "weapon") {
      next.hit = toAnalysisNumber(next.hit, 0) + toAnalysisNumber(totals.hit, 0);
      next.add = toAnalysisNumber(next.add, 0) + toAnalysisNumber(totals.damage, 0);
      next.crit = toAnalysisNumber(next.crit, 10) + toAnalysisNumber(totals.crit, 0);
    } else {
      next.cast = toAnalysisNumber(next.cast ?? next.add, 0) + toAnalysisNumber(totals.hit, 0);
      next.add = toAnalysisNumber(next.add, 0) + toAnalysisNumber(totals.damage, 0);
      next.crit = toAnalysisNumber(next.crit, 10) + toAnalysisNumber(totals.crit, 0);
    }
    if (totals.targetMax && totals.targetMax > 1) next.declarationTargetMax = Math.max(toAnalysisNumber(next.declarationTargetMax, 1), totals.targetMax);
    const risks = declarations.flatMap((feat) => Array.isArray(feat.risks) ? feat.risks : []);
    if (risks.length) next.declarationRisks = risks;
    return { option: next, totals };
  }

  function buildCharAnalysisActionPlanSlotResult(slot, option, declarations, baseSettings) {
    if (!option) return null;
    const declared = applyCharAnalysisDeclarationBonusesToOption(option, declarations);
    const slotSettings = applyCharAnalysisDeclarationSettings(getCharAnalysisSettingsForSlot(baseSettings, slot.key), declared.totals);
    const withDualPenalty = { ...declared.option };
    if (withDualPenalty.type === "weapon" && slot.penalty) withDualPenalty.hit = toAnalysisNumber(withDualPenalty.hit, 0) + slot.penalty;
    const adjusted = getAdjustedAttackOption(withDualPenalty, slotSettings);
    const metrics = calculateSelectedAttackMetrics(adjusted, slotSettings);
    const targetCount = getCharAnalysisSlotTargetCount(slot.key, adjusted);
    const targetMax = getCharAnalysisSlotTargetMax(adjusted);
    const singleAverageDpr = metrics?.averageDpr || 0;
    const totalAverageDpr = singleAverageDpr * targetCount;
    return { slot, option: adjusted, declarations, settings: slotSettings, metrics, targetCount, targetMax, singleAverageDpr, totalAverageDpr };
  }

  function calculateCharAnalysisActionPlanMetrics(charData, options = [], declarationFeats = [], declarationLimit = { totalLimit: 1 }, baseSettings = getCharAnalysisSettings()) {
    const slots = getCharAnalysisActionPlanSlots(charData, options, declarationFeats);
    const results = slots.map((slot) => {
      const slotOptions = getCharAnalysisActionSlotOptions(slot, options);
      const attackId = charAnalysisActionPlan.slotAttackIds?.[slot.key] || getCharAnalysisActionSlotDefaultId(slot, options);
      const baseOption = slotOptions.find((item) => item.id === attackId) || slotOptions[0] || null;
      const option = resolveCharAnalysisSlotAttackOption(slot, baseOption);
      const declarations = getCharAnalysisSlotDeclarations(slot, declarationFeats, option);
      return buildCharAnalysisActionPlanSlotResult(slot, option, declarations, baseSettings);
    }).filter(Boolean);
    const validation = validateCharAnalysisDeclarationSelection(getCharAnalysisActionPlanDeclarations(slots, declarationFeats, options), declarationLimit);
    const totalDpr = results.reduce((sum, result) => sum + (result.totalAverageDpr ?? result.metrics?.averageDpr ?? 0), 0);
    const totalExpected = results.reduce((sum, result) => sum + ((result.metrics?.expectedPerAction || result.metrics?.averageDpr || 0) * (result.targetCount || 1)), 0);
    const simulation = isMonteCarloMode(baseSettings) && Number(baseSettings.simulationNonce || 0) > 0 ? simulateCharAnalysisActionPlanResults(results, baseSettings) : null;
    if (simulation) {
      return { slots, results, validation, totalDpr: simulation.averageDpr, totalExpected, simulation };
    }
    return { slots, results, validation, totalDpr, totalExpected, simulation: null };
  }

  function renderCharAnalysisActionSlotDeclarations(charData, slot, slotOption, declarations = [], declarationFeats = [], declarationLimit = { totalLimit: 1 }, options = []) {
    const selectedIds = getCharAnalysisSlotDeclarationIds(slot.key).filter((id) => {
      const feat = declarationFeats.find((item) => item.id === id);
      return isCharAnalysisSlotDeclarationAllowed(slot, slotOption, feat);
    });
    const allowed = declarations.filter((feat) => isCharAnalysisSlotDeclarationAllowed(slot, slotOption, feat));
    if (!allowed.length) return `<small class="analysis-note">この行動枠で使える宣言候補なし</small>`;
    const totalLimit = Math.max(1, declarationLimit.totalLimit || declarationLimit.limit || 1);
    const maxForSlot = Math.max(1, Math.min(totalLimit, allowed.length));
    const rowCount = Math.max(1, Math.min(maxForSlot, selectedIds.length + (selectedIds.length < maxForSlot ? 1 : 0)));
    const rows = Array.from({ length: rowCount }, (_, index) => {
      const currentId = selectedIds[index] || "";
      const optionRows = [`<option value="">宣言なし</option>`].concat(allowed.map((feat) => {
        const selected = feat.id === currentId ? "selected" : "";
        const duplicateInSlot = selectedIds.some((id, selectedIndex) => selectedIndex !== index && id === feat.id);
        const canAdd = currentId === feat.id ? { ok: true } : duplicateInSlot ? { ok: false, message: "同じ攻撃枠では同じ宣言を重複指定できません。" } : canAddCharAnalysisSlotDeclaration(charData, slot.key, feat, declarationFeats, declarationLimit, options);
        const disabled = !canAdd.ok ? "disabled" : "";
        return `<option value="${escapeAnalysisHtml(feat.id)}" ${selected} ${disabled}>${escapeAnalysisHtml(renderSw25DecoratedNameText(feat.name))}</option>`;
      }));
      const currentFeat = currentId ? declarationFeats.find((feat) => feat.id === currentId) : null;
      const detail = currentFeat ? `<small>${escapeAnalysisHtml(formatDeclarationBonusText(currentFeat.bonuses || [], currentFeat.risks || []))}</small>` : `<small>この枠に乗せる宣言を選択</small>`;
      return `<label class="analysis-action-declaration-select-row">
        <span>宣言${index + 1}</span>
        <select class="char-analysis-action-slot-declaration-select" data-slot="${escapeAnalysisHtml(slot.key)}" data-declaration-index="${index}">${optionRows.join("")}</select>
        ${detail}
      </label>`;
    });
    return `<div class="analysis-action-slot-declarations is-selects">${rows.join("")}</div>`;
  }


  function renderCharAnalysisSlotBulletSelect(slot, baseOption) {
    const bullets = Array.isArray(baseOption?.bulletOptions) ? baseOption.bulletOptions : [];
    if (!isCharAnalysisGunOption(baseOption) || !bullets.length) return "";
    const selectedId = getCharAnalysisSlotBulletId(slot.key, baseOption);
    return `<label class="analysis-action-slot-bullet-select">
      <span>バレット</span>
      <select class="char-analysis-action-slot-bullet-select" data-slot="${escapeAnalysisHtml(slot.key)}">${bullets.map((bullet) => `<option value="${escapeAnalysisHtml(bullet.id)}" ${bullet.id === selectedId ? "selected" : ""}>${escapeAnalysisHtml(renderSw25DecoratedNameText(`${bullet.name} / K${bullet.k}@${10}${formatSigned(bullet.magicPower)}`))}</option>`).join("")}</select>
    </label>`;
  }

  function renderCharAnalysisActionSlotSelectedDetail(slot, slotOption, settings = getCharAnalysisSettings(), baseOption = slotOption) {
    if (!slotOption) return `<p class="analysis-note">この枠の攻撃手段を選択してください。</p>`;
    const slotSettings = getCharAnalysisSettingsForSlot(settings, slot.key);
    const adjusted = getAdjustedAttackOption(slotOption, slotSettings);
    const noteText = adjusted?.weaponNote || adjusted?.note || "";
    const noteDetail = noteText && noteText !== "-"
      ? `<details class="analysis-weapon-note compact"><summary>備考</summary><p>${escapeAnalysisHtml(noteText)}</p></details>`
      : "";
    return `<div class="analysis-action-slot-detail">
      <div class="analysis-action-slot-detail-block">
        ${renderCharAnalysisSlotBulletSelect(slot, baseOption)}
        ${renderSelectedAttackDetailList(adjusted)}
        ${renderSelectedAttackDirectInput(slotSettings, slotOption)}
        ${noteDetail}
      </div>
      ${renderCharAnalysisSlotManualAdjust(slot.key)}
    </div>`;
  }

  function renderCharAnalysisActionPlan(charData, options = [], declarations = [], declarationLimit = { totalLimit: 1 }) {
    if (!options.length) return "";
    ensureCharAnalysisActionPlanDefaults(options);
    const caps = getCharAnalysisActionPlanCapabilities(charData);
    const slots = getCharAnalysisActionPlanSlots(charData, options, declarations);
    const allDeclarations = getCharAnalysisActionPlanDeclarations(slots, declarations, options);
    const validation = validateCharAnalysisDeclarationSelection(allDeclarations, declarationLimit);
    const totalLimit = Math.max(1, declarationLimit.totalLimit || declarationLimit.limit || 1);
    const weaponCount = allDeclarations.filter((feat) => feat.category === "weapon").length;
    const magicCount = allDeclarations.filter((feat) => feat.category === "magic").length;
    const statusText = `行動${slots.length} / 宣言${allDeclarations.length}/${totalLimit}（武器${weaponCount}・魔法${magicCount}）`;
    const optionSelect = (slot) => {
      const slotOptions = getCharAnalysisActionSlotOptions(slot, options);
      if (!slotOptions.length) return `<p class="analysis-note is-warning">この枠で選べる${slot.kind === "magic" ? "攻撃魔法" : isCharAnalysisMainActionSlot(slot) ? "攻撃手段" : "武器攻撃"}がありません。</p>`;
      const selectedId = charAnalysisActionPlan.slotAttackIds?.[slot.key] || getCharAnalysisActionSlotDefaultId(slot, options);
      return `<select class="char-analysis-action-slot-select" data-slot="${escapeAnalysisHtml(slot.key)}">${slotOptions.map((option) => `<option value="${escapeAnalysisHtml(option.id)}" ${option.id === selectedId ? "selected" : ""}>${escapeAnalysisHtml(renderSw25DecoratedNameText(option.label))}</option>`).join("")}</select>`;
    };
    const dualActive = Boolean(charAnalysisActionPlan.dualWield && caps.dualWield);
    const fastActive = Boolean(charAnalysisActionPlan.fastAction && caps.fastAction);
    const dualLabel = (() => {
      if (!caps.dualWield) return "両手利き 未習得";
      if (caps.twoSwordMastery) return "二刀無双";
      if (caps.twoSwordStyle) return "二刀流";
      return "両手利き 命中-2";
    })();
    return `<details class="analysis-action-plan-box" open>
      <summary><span>1R行動枠</span></summary>
      <div class="analysis-action-plan-status${validation.ok ? "" : " is-warning"}">
        <strong>${escapeAnalysisHtml(statusText)}</strong>
        ${validation.ok ? `<small>常時/FAは宣言消費なし</small>` : `<small>${escapeAnalysisHtml(validation.message)}</small>`}
      </div>
      <div class="analysis-action-plan-chips" role="group" aria-label="1R行動オプション">
        <label class="analysis-action-chip-toggle${dualActive ? " is-selected" : ""}${!caps.dualWield ? " is-disabled" : ""}" title="クリックで両手利き系の使用を切り替え">
          <input type="checkbox" class="char-analysis-action-toggle" data-action="dualWield" ${dualActive ? "checked" : ""} ${caps.dualWield ? "" : "disabled"} />
          <span class="analysis-action-chip-label">${escapeAnalysisHtml(dualLabel)}</span>
          ${caps.dualWield ? `<span class="analysis-action-chip-state">${dualActive ? "ON" : "OFF"}</span>` : ""}
        </label>
        <span class="analysis-action-chip-note${caps.extraAttack ? " is-selected" : " is-disabled"}"><span class="analysis-action-chip-label">追加攻撃</span><span class="analysis-action-chip-state">${caps.extraAttack ? "自動" : "未習得"}</span></span>
        <label class="analysis-action-chip-toggle${fastActive ? " is-selected" : ""}${!caps.fastAction ? " is-disabled" : ""}" title="クリックでファストアクションを切り替え">
          <input type="checkbox" class="char-analysis-action-toggle" data-action="fastAction" ${fastActive ? "checked" : ""} ${caps.fastAction ? "" : "disabled"} />
          <span class="analysis-action-chip-label">${escapeAnalysisHtml(caps.fastAction ? "ファストアクション" : "ファストアクション")}</span>
          <span class="analysis-action-chip-state">${caps.fastAction ? (fastActive ? "ON" : "OFF") : "未習得"}</span>
        </label>
      </div>
      <div class="analysis-declaration-limit-note"><small>各攻撃枠ごとに宣言を割り当てます。同じ宣言を別枠で使う場合は宣言回数を消費します。</small></div>
      <div class="analysis-action-slot-list">
        ${slots.map((slot) => {
          const slotOptions = getCharAnalysisActionSlotOptions(slot, options);
          const selectedId = charAnalysisActionPlan.slotAttackIds?.[slot.key] || getCharAnalysisActionSlotDefaultId(slot, options);
          const baseOption = slotOptions.find((option) => option.id === selectedId) || slotOptions[0] || null;
          const slotOption = resolveCharAnalysisSlotAttackOption(slot, baseOption);
          const penaltyText = (slot.penalty && slotOption?.type === "weapon") ? `<small class="is-warning">命中${formatSigned(slot.penalty)}</small>` : "";
          return `<div class="analysis-action-slot-card is-${escapeAnalysisHtml(slot.key)}">
            <div class="analysis-action-slot-head"><strong>${escapeAnalysisHtml(slot.label)}</strong><span>${escapeAnalysisHtml(slot.source)}</span>${penaltyText}</div>
            <div class="analysis-action-slot-main-select">${optionSelect(slot)}</div>
            ${renderCharAnalysisActionSlotSelectedDetail(slot, slotOption, undefined, baseOption)}
            ${renderCharAnalysisActionSlotDeclarations(charData, slot, slotOption, declarations, declarations, declarationLimit, options)}
          </div>`;
        }).join("")}
      </div>
    </details>`;
  }

  function renderCharAnalysisActionPlanResult(charData, options = [], declarationFeats = [], declarationLimit = { totalLimit: 1 }, settings = getCharAnalysisSettings()) {
    if (!options.length) return "";
    const plan = calculateCharAnalysisActionPlanMetrics(charData, options, declarationFeats, declarationLimit, settings);
    if (!plan.results.length) return "";
    const compactMatch = Boolean(charAnalysisActionPlan.matchCompact);
    const matchCards = plan.results.map((result, index) => renderAnalysisActionSlotMatchSummary(result, result.settings || settings, compactMatch, index)).join("");
    const rows = plan.results.map((result) => {
      const declText = result.declarations.length ? result.declarations.map((feat) => feat.name).join(" + ") : "宣言なし";
      const formula = formatAnalysisAttackFormulaDirect(result.option, result.settings);
      const check = formatAnalysisCheckFormulaDirect(result.option);
      const attackName = result.option?.source === "gun-bullet"
        ? `${renderSw25DecoratedNameText(result.option.gunName || result.option.name || "ガン")} / ${renderSw25DecoratedNameText(result.option.bulletName || "バレット")}`
        : renderSw25DecoratedNameText(result.option.name || "攻撃");
      return `<div class="analysis-action-result-row">
        <span><b>${escapeAnalysisHtml(result.slot.label)}</b><small>${escapeAnalysisHtml(result.slot.source)}</small></span>
        <span>${escapeAnalysisHtml(attackName)}</span>
        <span>${escapeAnalysisHtml(check)} / ${escapeAnalysisHtml(formula)}</span>
        <span>${escapeAnalysisHtml(declText)}</span>
        <strong>${escapeAnalysisHtml(formatDecimal(result.totalAverageDpr ?? result.metrics?.averageDpr ?? 0))}</strong>
      </div>`;
    }).join("");
    const rowsHeader = `<div class="analysis-action-result-row analysis-action-result-header" aria-hidden="true">
      <span>枠</span><span>攻撃 / 弾丸</span><span>判定 / 威力式</span><span>宣言</span><strong>期待値</strong>
    </div>`;
    const damageTraceValues = [0];
    plan.results.forEach((result) => damageTraceValues.push(damageTraceValues[damageTraceValues.length - 1] + (result.totalAverageDpr ?? result.metrics?.averageDpr ?? 0)));
    const damageTrace = damageTraceValues.map((value) => formatDecimal(value)).join(" → ");
    const hasFastAction = plan.results.some((result) => result.slot?.set === "fast");
    const warning = plan.validation.ok ? "" : `<p class="analysis-note is-warning">${escapeAnalysisHtml(plan.validation.message)}</p>`;
    const fastNote = hasFastAction ? `<p class="analysis-note">ファストアクションを含んでいます。宣言回数は1R内で継続して数えます。</p>` : "";
    return `<div class="analysis-action-result-box${compactMatch ? " is-compact-match" : ""}">
      <div class="analysis-action-result-headbar">
        <h6>1R行動セット</h6>
        <label class="analysis-match-compact-toggle"><input type="checkbox" class="char-analysis-match-compact-toggle" ${compactMatch ? "checked" : ""} /> <span>コンパクト</span></label>
      </div>
      <div class="analysis-action-result-total"><span>1R期待値</span><strong>${escapeAnalysisHtml(formatDecimal(plan.totalDpr))}</strong></div>
      <div class="analysis-action-damage-trace"><span>与ダメ推移</span><strong>${escapeAnalysisHtml(damageTrace)}</strong></div>
      <div class="analysis-action-match-list">${matchCards}</div>
      <details class="analysis-action-result-detail"><summary>内訳一覧</summary><div class="analysis-action-result-list">${rowsHeader}${rows}</div></details>
      ${plan.simulation ? renderSelectedAttackSimulationResult({ name: "1R行動セット" }, { ...settings, __actionPlanSimulation: plan.simulation }) : ""}
      ${fastNote}
      ${warning}
    </div>`;
  }

  function renderAnalysisDeclarations(declarations = [], selectedDeclarations = [], declarationLimit = { totalLimit: 1, weaponLimit: 1, magicLimit: 1, reasons: [] }) {
    if (!declarations.length) return `<p class="analysis-note">宣言特技候補は見つかりませんでした。</p>`;
    const selectedIds = new Set(selectedDeclarations.map((feat) => feat.id));
    const totalLimit = Math.max(1, declarationLimit.totalLimit || declarationLimit.limit || 1);
    const weaponLimit = Math.max(1, declarationLimit.weaponLimit || 1);
    const magicLimit = Math.max(1, declarationLimit.magicLimit || 1);
    const weaponCount = selectedDeclarations.filter((feat) => feat.category === "weapon").length;
    const magicCount = selectedDeclarations.filter((feat) => feat.category === "magic").length;
    const reason = declarationLimit.reasons?.length ? `<small>${escapeAnalysisHtml(declarationLimit.reasons.join(" / "))}</small>` : "";
    const validation = validateCharAnalysisDeclarationSelection(selectedDeclarations, declarationLimit);
    const categories = [
      ["weapon", "武器宣言"],
      ["magic", "魔法宣言"],
      ["other", "その他"],
    ];
    const renderCategory = ([category, label]) => {
      const items = declarations.filter((feat) => (feat.category || "other") === category);
      if (!items.length) return "";
      return `<div class="analysis-declaration-category is-${category}"><strong>${escapeAnalysisHtml(label)}</strong>${items.map((feat) => {
        const checked = selectedIds.has(feat.id);
        const canAdd = checked ? { ok: true } : canAddCharAnalysisDeclaration(feat, selectedDeclarations, declarationLimit);
        const note = feat.notes?.length ? `<small>${escapeAnalysisHtml(feat.notes.join(" / "))}</small>` : "";
        const disabled = !checked && !canAdd.ok ? "disabled" : "";
        const title = !checked && !canAdd.ok ? ` title="${escapeAnalysisHtml(canAdd.message)}"` : "";
        return `<label class="analysis-declaration-item${checked ? " is-selected" : ""}${disabled ? " is-disabled" : ""}"${title}>
          <input type="checkbox" class="char-analysis-declaration-check" data-declaration-id="${escapeAnalysisHtml(feat.id)}" ${checked ? "checked" : ""} ${disabled} />
          <span><b>${renderAnalysisDaggerHtml(feat.name)}</b><i>${escapeAnalysisHtml(getDeclarationCategoryLabel(feat.category))}</i><em>${escapeAnalysisHtml(formatDeclarationBonusText(feat.bonuses, feat.risks || []))}</em>${note}</span>
        </label>`;
      }).join("")}</div>`;
    };
    return `<details class="analysis-declaration-box" open>
      <summary>宣言特技 <span>合計 ${selectedDeclarations.length}/${totalLimit} / 武器 ${weaponCount}/${weaponLimit} / 魔法 ${magicCount}/${magicLimit}</span></summary>
      <div class="analysis-declaration-limit-note">${reason || `<small>通常は合計1つだけ反映します。</small>`}${validation.ok ? "" : `<small class="is-warning">${escapeAnalysisHtml(validation.message)}</small>`}</div>
      <div class="analysis-declaration-list">
        ${categories.map(renderCategory).join("")}
      </div>
    </details>`;
  }

  function getCharAnalysisManualBaseValues(selectedOption = null) {
    const baseHit = selectedOption?.type === "weapon"
      ? toAnalysisNumber(selectedOption?.hit, 0)
      : toAnalysisNumber(selectedOption?.cast ?? selectedOption?.add, 0);
    return {
      hit: baseHit,
      rate: Math.max(0, toAnalysisNumber(selectedOption?.rate, 0)),
      add: toAnalysisNumber(selectedOption?.add, 0),
      crit: toAnalysisNumber(selectedOption?.crit, 10),
    };
  }

  function renderSelectedAttackDirectInput(settings = getCharAnalysisSettings(), selectedOption = null) {
    const isManualAttack = selectedOption?.id === CHAR_ANALYSIS_MANUAL_ATTACK_ID || selectedOption?.source === "manual";
    if (!isManualAttack) return "";
    const manual = { ...createCharAnalysisManualAdjust(), ...(settings.manual || {}) };
    const baseValues = getCharAnalysisManualBaseValues(selectedOption);
    const directValueFor = (key) => {
      const raw = manual[`${key}Abs`];
      if (raw === null || raw === undefined || String(raw).trim() === "") return baseValues[key];
      return raw;
    };
    const directInput = (label, key) => `<label>${escapeAnalysisHtml(label)}<input type="number" class="char-analysis-manual-input" data-manual-key="${escapeAnalysisHtml(`${key}Abs`)}" value="${escapeAnalysisHtml(directValueFor(key))}" placeholder="0" /></label>`;
    return `<div class="analysis-direct-attack-input">
      <div class="analysis-direct-attack-head"><strong>直接指定値</strong><span>この値を攻撃手段のベースにします。</span></div>
      <div class="analysis-manual-grid analysis-manual-grid-extended">
        ${directInput("判定", "hit")}
        ${directInput("威力", "rate")}
        ${directInput("固定値", "add")}
        ${directInput("C値", "crit")}
      </div>
    </div>`;
  }

  function renderSelectedAttackManualAdjust(settings = getCharAnalysisSettings(), selectedOption = null) {
    const manual = { ...createCharAnalysisManualAdjust(), ...(settings.manual || {}) };
    const relativeInput = (label, key) => `<label>${escapeAnalysisHtml(label)}+<input type="number" class="char-analysis-manual-input" data-manual-key="${escapeAnalysisHtml(key)}" value="${escapeAnalysisHtml(manual[key] ?? 0)}" placeholder="0" /></label>`;
    return `<details class="analysis-manual-adjust analysis-relative-adjust" open>
      <summary>追加補正</summary>
      <div class="analysis-manual-grid analysis-manual-grid-extended">
        ${relativeInput("判定", "hit")}
        ${relativeInput("威力", "rate")}
        ${relativeInput("固定値", "add")}
        ${relativeInput("C値", "crit")}
      </div>
    </details>`;
  }

  function renderAttackPickerArea(options, selected, settings = getCharAnalysisSettings(), declarations = [], selectedDeclarations = [], declarationLimit = { limit: 1, reasons: [] }) {
    return `<div class="analysis-attack-picker-area analysis-action-plan-only">
      <div class="analysis-attack-picker-detail">
        ${charAnalysisCurrent?.charData ? renderCharAnalysisActionPlan(charAnalysisCurrent.charData, options, declarations, declarationLimit) : ""}
        <details class="analysis-settings-details" ${charAnalysisSettingsOpen ? "open" : ""}><summary><i class="fa-solid fa-sliders"></i> 試行・判定設定</summary>${renderAnalysisSettingsControls(settings)}</details>
      </div>
    </div>`;
  }

  function getCharAnalysisSettings() {
    const readNumber = (id, fallback = 0) => toAnalysisNumber(document.getElementById(id)?.value, fallback);
    const readChecked = (id) => Boolean(document.getElementById(id)?.checked);
    return {
      battleMode: ["attack", "defense", "scout"].includes(document.getElementById("char-analysis-battle-mode")?.value) ? document.getElementById("char-analysis-battle-mode").value : "attack",
      mode: document.getElementById("char-analysis-mode")?.value || "mc",
      profile: document.getElementById("char-analysis-profile")?.value || "max",
      targetDefenseMode: document.getElementById("char-analysis-target-defense-toggle")
        ? (document.getElementById("char-analysis-target-defense-toggle").checked ? "oppose" : "ignore")
        : (document.getElementById("char-analysis-target-defense-mode")?.value === "ignore" ? "ignore" : "oppose"),
      rounds: Math.max(1, Math.min(18, readNumber("char-analysis-rounds", 1) || 1)),
      trials: Math.max(100, Math.min(50000, readNumber("char-analysis-trials", 10000) || 10000)),
      critLower: readChecked("char-analysis-crit-lower"),
      critDisabled: readChecked("char-analysis-crit-disabled"),
      checkCertainty: readChecked("char-analysis-check-certainty"),
      powerCertainty: readChecked("char-analysis-power-certainty"),
      diceFirstMode: document.getElementById("char-analysis-dice-first-mode")?.value || "none",
      diceFirstValue: readNumber("char-analysis-dice-first-value", 0),
      diceRepeatBonus: readNumber("char-analysis-dice-repeat-bonus", 0),
      powerRateStep: Math.max(0, Math.min(100, readNumber("char-analysis-power-rate-step", 0) || 0)),
      criticalRayEnabled: Boolean(
        charAnalysisSelectedEffectIds.has(CHAR_ANALYSIS_ALCHEMY_EFFECT_DEFS.criticalRay.id) ||
        document.querySelector(`.char-analysis-effect-check[data-effect-id="${CHAR_ANALYSIS_ALCHEMY_EFFECT_DEFS.criticalRay.id}"]`)?.checked
      ),
      criticalRayRank: getCharAnalysisAlchemyRank("criticalRay"),
      simulationNonce: charAnalysisSimulationNonce,
      manual: { ...charAnalysisManualAdjust },
      enemy: {
        eva: readNumber("char-analysis-enemy-eva", NaN),
        def: readNumber("char-analysis-enemy-def", 0),
        hp: readNumber("char-analysis-enemy-hp", NaN),
        hit: readNumber("char-analysis-enemy-hit", NaN),
        damage: readNumber("char-analysis-enemy-damage", NaN),
        vit: readNumber("char-analysis-enemy-vit", NaN),
        mnd: readNumber("char-analysis-enemy-mnd", NaN),
        knowledge: readNumber("char-analysis-enemy-knowledge", NaN),
        weaknessValue: readNumber("char-analysis-enemy-weakness-value", NaN),
        initiativeTarget: readNumber("char-analysis-enemy-initiative-target", NaN),
        weaknessText: document.getElementById("char-analysis-enemy-weakness-text")?.value || "",
      },
    };
  }

  function isFiniteAnalysisNumber(value) {
    return Number.isFinite(Number(value));
  }

  function get2dCount(total) {
    const counts = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };
    return counts[total] || 0;
  }

  const SW25_POWER_TABLE = [
    [0, 0, 0, 0, 0, 0, 1, 2, 2, 3, 3, 4, 4],
    [0, 0, 0, 0, 0, 0, 1, 2, 3, 3, 3, 4, 4],
    [0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 4, 4, 4],
    [0, 0, 0, 0, 0, 1, 1, 2, 3, 4, 4, 4, 5],
    [0, 0, 0, 0, 0, 1, 2, 2, 3, 4, 4, 5, 5],
    [0, 0, 0, 0, 1, 1, 2, 2, 3, 4, 5, 5, 5],
    [0, 0, 0, 0, 1, 1, 2, 3, 3, 4, 5, 5, 5],
    [0, 0, 0, 0, 1, 1, 2, 3, 4, 4, 5, 5, 6],
    [0, 0, 0, 0, 1, 2, 2, 3, 4, 4, 5, 6, 6],
    [0, 0, 0, 0, 1, 2, 3, 3, 4, 4, 5, 6, 7],
    [0, 0, 0, 1, 1, 2, 3, 3, 4, 5, 5, 6, 7],
    [0, 0, 0, 1, 2, 2, 3, 3, 4, 5, 6, 6, 7],
    [0, 0, 0, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7],
    [0, 0, 0, 1, 2, 3, 3, 4, 4, 5, 6, 7, 7],
    [0, 0, 0, 1, 2, 3, 4, 4, 4, 5, 6, 7, 8],
    [0, 0, 0, 1, 2, 3, 4, 4, 5, 5, 6, 7, 8],
    [0, 0, 0, 1, 2, 3, 4, 4, 5, 6, 7, 7, 8],
    [0, 0, 0, 1, 2, 3, 4, 5, 5, 6, 7, 7, 8],
    [0, 0, 0, 1, 2, 3, 4, 5, 6, 6, 7, 7, 8],
    [0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 7, 8, 9],
    [0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    [0, 0, 0, 1, 2, 3, 4, 6, 6, 7, 8, 9, 10],
    [0, 0, 0, 1, 2, 3, 5, 6, 6, 7, 8, 9, 10],
    [0, 0, 0, 2, 2, 3, 5, 6, 7, 7, 8, 9, 10],
    [0, 0, 0, 2, 3, 4, 5, 6, 7, 7, 8, 9, 10],
    [0, 0, 0, 2, 3, 4, 5, 6, 7, 8, 8, 9, 10],
    [0, 0, 0, 2, 3, 4, 5, 6, 8, 8, 9, 9, 10],
    [0, 0, 0, 2, 3, 4, 6, 6, 8, 8, 9, 9, 10],
    [0, 0, 0, 2, 3, 4, 6, 6, 8, 9, 9, 10, 10],
    [0, 0, 0, 2, 3, 4, 6, 7, 8, 9, 9, 10, 10],
    [0, 0, 0, 2, 4, 4, 6, 7, 8, 9, 10, 10, 10],
    [0, 0, 0, 2, 4, 5, 6, 7, 8, 9, 10, 10, 11],
    [0, 0, 0, 3, 4, 5, 6, 7, 8, 10, 10, 10, 11],
    [0, 0, 0, 3, 4, 5, 6, 8, 8, 10, 10, 10, 11],
    [0, 0, 0, 3, 4, 5, 6, 8, 9, 10, 10, 11, 11],
    [0, 0, 0, 3, 4, 5, 7, 8, 9, 10, 10, 11, 12],
    [0, 0, 0, 3, 5, 5, 7, 8, 9, 10, 11, 11, 12],
    [0, 0, 0, 3, 5, 6, 7, 8, 9, 10, 11, 12, 12],
    [0, 0, 0, 3, 5, 6, 7, 8, 10, 10, 11, 12, 13],
    [0, 0, 0, 4, 5, 6, 7, 8, 10, 11, 11, 12, 13],
    [0, 0, 0, 4, 5, 6, 7, 9, 10, 11, 11, 12, 13],
    [0, 0, 0, 4, 6, 6, 7, 9, 10, 11, 12, 12, 13],
    [0, 0, 0, 4, 6, 7, 7, 9, 10, 11, 12, 13, 13],
    [0, 0, 0, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    [0, 0, 0, 4, 6, 7, 8, 10, 10, 11, 12, 13, 14],
    [0, 0, 0, 4, 6, 7, 9, 10, 10, 11, 12, 13, 14],
    [0, 0, 0, 4, 6, 7, 9, 10, 10, 12, 13, 13, 14],
    [0, 0, 0, 4, 6, 7, 9, 10, 11, 12, 13, 13, 15],
    [0, 0, 0, 4, 6, 7, 9, 10, 12, 12, 13, 13, 15],
    [0, 0, 0, 4, 6, 7, 10, 10, 12, 12, 13, 14, 15],
    [0, 0, 0, 4, 6, 8, 10, 10, 12, 12, 13, 15, 15],
    [0, 0, 0, 5, 7, 8, 10, 10, 12, 12, 13, 15, 15],
    [0, 0, 0, 5, 7, 8, 10, 11, 12, 12, 13, 15, 15],
    [0, 0, 0, 5, 7, 9, 10, 11, 12, 12, 14, 15, 15],
    [0, 0, 0, 5, 7, 9, 10, 11, 12, 13, 14, 15, 16],
    [0, 0, 0, 5, 7, 10, 10, 11, 12, 13, 15, 16, 16],
    [0, 0, 0, 5, 8, 10, 10, 11, 12, 13, 15, 16, 16],
    [0, 0, 0, 5, 8, 10, 11, 11, 12, 13, 15, 16, 17],
    [0, 0, 0, 5, 8, 10, 11, 12, 12, 13, 15, 16, 17],
    [0, 0, 0, 5, 9, 10, 11, 12, 12, 14, 15, 16, 17],
    [0, 0, 0, 5, 9, 10, 11, 12, 13, 14, 15, 16, 18],
    [0, 0, 0, 5, 9, 10, 11, 12, 13, 14, 16, 17, 18],
    [0, 0, 0, 5, 9, 10, 11, 13, 13, 14, 16, 17, 18],
    [0, 0, 0, 5, 9, 10, 11, 13, 13, 15, 17, 17, 18],
    [0, 0, 0, 5, 9, 10, 11, 13, 14, 15, 17, 17, 18],
    [0, 0, 0, 5, 9, 10, 12, 13, 14, 15, 17, 18, 18],
    [0, 0, 0, 5, 9, 10, 12, 13, 15, 15, 17, 18, 19],
    [0, 0, 0, 5, 9, 10, 12, 13, 15, 16, 17, 19, 19],
    [0, 0, 0, 5, 9, 10, 12, 14, 15, 16, 17, 19, 19],
    [0, 0, 0, 5, 9, 10, 12, 14, 16, 16, 17, 19, 19],
    [0, 0, 0, 5, 9, 10, 12, 14, 16, 17, 18, 19, 19],
    [0, 0, 0, 5, 9, 10, 13, 14, 16, 17, 18, 19, 20],
    [0, 0, 0, 5, 9, 10, 13, 15, 16, 17, 18, 19, 21],
    [0, 0, 0, 5, 9, 10, 13, 15, 16, 17, 19, 20, 21],
    [0, 0, 0, 6, 9, 10, 13, 15, 16, 18, 19, 20, 21],
    [0, 0, 0, 6, 9, 10, 13, 16, 16, 18, 19, 20, 21],
    [0, 0, 0, 6, 9, 10, 13, 16, 17, 18, 19, 20, 21],
    [0, 0, 0, 6, 9, 10, 13, 16, 17, 18, 20, 21, 22],
    [0, 0, 0, 6, 9, 10, 13, 16, 17, 19, 20, 22, 23],
    [0, 0, 0, 6, 9, 10, 13, 16, 18, 19, 20, 22, 23],
    [0, 0, 0, 6, 9, 10, 13, 16, 18, 20, 21, 22, 23],
    [0, 0, 0, 6, 9, 10, 13, 17, 18, 20, 21, 22, 23],
    [0, 0, 0, 6, 9, 10, 14, 17, 18, 20, 21, 22, 24],
    [0, 0, 0, 6, 9, 11, 14, 17, 18, 20, 21, 23, 24],
    [0, 0, 0, 6, 9, 11, 14, 17, 19, 20, 21, 23, 24],
    [0, 0, 0, 6, 9, 11, 14, 17, 19, 21, 22, 23, 24],
    [0, 0, 0, 7, 10, 11, 14, 17, 19, 21, 22, 23, 25],
    [0, 0, 0, 7, 10, 12, 14, 17, 19, 21, 22, 24, 25],
    [0, 0, 0, 7, 10, 12, 14, 18, 19, 21, 22, 24, 25],
    [0, 0, 0, 7, 10, 12, 15, 18, 19, 21, 22, 24, 26],
    [0, 0, 0, 7, 10, 12, 15, 18, 19, 21, 23, 25, 26],
    [0, 0, 0, 7, 11, 13, 15, 18, 19, 21, 23, 25, 26],
    [0, 0, 0, 7, 11, 13, 15, 18, 20, 21, 23, 25, 27],
    [0, 0, 0, 8, 11, 13, 15, 18, 20, 22, 23, 25, 27],
    [0, 0, 0, 8, 11, 13, 16, 18, 20, 22, 23, 25, 28],
    [0, 0, 0, 8, 11, 14, 16, 18, 20, 22, 23, 26, 28],
    [0, 0, 0, 8, 11, 14, 16, 18, 20, 22, 23, 26, 28],
    [0, 0, 0, 8, 12, 14, 16, 18, 20, 22, 24, 26, 28],
    [0, 0, 0, 8, 12, 15, 16, 18, 20, 22, 24, 27, 28],
    [0, 0, 0, 8, 12, 15, 17, 18, 20, 22, 24, 27, 29],
    [0, 0, 0, 8, 12, 15, 18, 18, 20, 22, 24, 27, 30]
  ];

  function getCriticalProbability(crit, critDisabled) {
    if (critDisabled || !crit || crit > 12) return 0;
    let count = 0;
    for (let roll = Math.max(3, crit); roll <= 12; roll++) count += get2dCount(roll);
    return count / 36;
  }

  function getPowerTableRow(rate) {
    const safeRate = Math.max(0, Math.min(100, Math.trunc(toAnalysisNumber(rate, 0))));
    return SW25_POWER_TABLE[safeRate] || null;
  }

  function getPowerTableValue(rate, roll) {
    const row = getPowerTableRow(rate);
    const safeRoll = Math.max(2, Math.min(12, Math.trunc(toAnalysisNumber(roll, 2))));
    if (!row) return 0;
    return row[safeRoll] || 0;
  }

  function calculatePowerTableBaseExpected(rate) {
    const row = getPowerTableRow(rate);
    if (!row) return (Math.max(0, toAnalysisNumber(rate, 0)) + 10) / 6;
    let total = 0;
    for (let roll = 2; roll <= 12; roll++) {
      total += getPowerTableValue(rate, roll) * get2dCount(roll);
    }
    return total / 36;
  }

  function choosePowerCertaintyRoll(rate, rollA, rollB) {
    const valueA = getPowerTableValue(rate, rollA);
    const valueB = getPowerTableValue(rate, rollB);
    if (valueA > valueB) return rollA;
    if (valueB > valueA) return rollB;
    return Math.max(rollA, rollB);
  }

  function calculatePowerTableCertaintyExpected(rate) {
    const safeRate = Math.max(0, Math.min(100, Math.trunc(toAnalysisNumber(rate, 0))));
    let total = 0;
    for (let rollA = 2; rollA <= 12; rollA++) {
      for (let rollB = 2; rollB <= 12; rollB++) {
        const picked = choosePowerCertaintyRoll(safeRate, rollA, rollB);
        total += getPowerTableValue(safeRate, picked) * get2dCount(rollA) * get2dCount(rollB);
      }
    }
    return total / 1296;
  }

  function getCriticalProbabilityForPowerMode(rate, crit, settings) {
    if (settings.critDisabled || !crit || crit > 12) return 0;
    if (!settings.powerCertainty) return getCriticalProbability(crit, settings.critDisabled);
    const safeRate = Math.max(0, Math.min(100, Math.trunc(toAnalysisNumber(rate, 0))));
    let count = 0;
    for (let rollA = 2; rollA <= 12; rollA++) {
      for (let rollB = 2; rollB <= 12; rollB++) {
        const picked = choosePowerCertaintyRoll(safeRate, rollA, rollB);
        if (picked >= Math.max(3, crit)) count += get2dCount(rollA) * get2dCount(rollB);
      }
    }
    return count / 1296;
  }

  function calculateSimplePowerExpected(rate, crit, settings) {
    const safeRate = Math.max(0, Math.min(100, Math.trunc(toAnalysisNumber(rate, 0))));
    let safeCrit = toAnalysisNumber(crit, 10) || 10;
    if (settings.critLower) safeCrit = Math.max(8, safeCrit);
    const basePowerExpected = settings.powerCertainty ? calculatePowerTableCertaintyExpected(safeRate) : calculatePowerTableBaseExpected(safeRate);
    const critProbability = getCriticalProbabilityForPowerMode(safeRate, safeCrit, settings);
    const multiplier = critProbability >= 1 ? 1 : 1 / (1 - critProbability);
    return {
      powerExpected: basePowerExpected * multiplier,
      crit,
      effectiveCrit: safeCrit,
      critProbability,
      note: settings.powerCertainty ? "威力表を2回振り、良い方を採用する簡易確実化込みの期待値" : "威力表0〜100を使用。2Dの出目がC値以上なら追加ロールし、その条件を満たす限り継続する期待値",
    };
  }

  function getManualAbsoluteNumber(manual, key) {
    const raw = manual?.[key];
    if (raw === null || raw === undefined || String(raw).trim() === "") return NaN;
    return toAnalysisNumber(raw, NaN);
  }

  function getAdjustedAttackOption(option, settings = getCharAnalysisSettings()) {
    if (!option) return null;
    const manual = { ...createCharAnalysisManualAdjust(), ...(settings.manual || {}) };
    const next = { ...option };
    const manualValue = (key, base, fallback = 0) => base + toAnalysisNumber(manual[key], fallback);
    next.rate = Math.max(0, manualValue("rate", toAnalysisNumber(option.rate, 0), 0));
    next.crit = manualValue("crit", toAnalysisNumber(option.crit, 10), 0);
    next.add = manualValue("add", toAnalysisNumber(option.add, 0), 0);
    if (option.type === "weapon") {
      next.hit = manualValue("hit", toAnalysisNumber(option.hit, 0), 0);
    } else {
      const baseCast = toAnalysisNumber(option.cast ?? option.add, 0);
      next.cast = manualValue("hit", baseCast, 0);
    }
    return next;
  }

  function isCharAnalysisNeckRipperWeapon(option) {
    if (!option || option.type !== "weapon") return false;
    if (option.neckRipperAuto) return true;
    const text = [
      option.name,
      option.originalName,
      option.baseName,
      option.weaponName,
      option.displayName,
      option.freeName,
      option.itemName,
      option.note,
      option.weaponNote,
      option.description,
      option.memo,
    ].filter(Boolean).join(" ");
    return /首切り刀/.test(text);
  }

  function getPowerRateStepForAttack(option, settings = getCharAnalysisSettings()) {
    const explicit = Math.max(0, Math.min(100, Math.trunc(toAnalysisNumber(settings?.powerRateStep, 0))));
    if (explicit > 0) return explicit;
    return isCharAnalysisNeckRipperWeapon(option) ? 5 : 0;
  }

  function formatPowerRateStepLabel(option, settings = getCharAnalysisSettings()) {
    const explicit = Math.max(0, Math.min(100, Math.trunc(toAnalysisNumber(settings?.powerRateStep, 0))));
    if (explicit > 0) return `r${explicit}`;
    return isCharAnalysisNeckRipperWeapon(option) ? "自動 r5" : "";
  }

  function getPowerRollOutcomeDistribution(settings, rate, crit) {
    const mode = settings?.mode || "mc";
    const safeCrit = toAnalysisNumber(crit, 10) || 10;
    const makeOutcome = (rawTotal, weight) => ({ rawTotal, weight });

    if (mode === "mcHot") {
      if (!settings?.critDisabled && isFiniteAnalysisNumber(safeCrit) && safeCrit <= 12) {
        const minRoll = Math.max(2, Math.min(12, safeCrit - 2));
        const count = Math.max(1, 13 - minRoll);
        const weight = 1 / count;
        const outcomes = [];
        for (let total = minRoll; total <= 12; total++) outcomes.push(makeOutcome(total, weight));
        return outcomes;
      }
      // クリティカル無効時などは、従来の上振れと同じく2Dを3回振って高い方。
      const totalWeight = 36 ** 3;
      const counts = new Map();
      for (let a = 2; a <= 12; a++) {
        for (let b = 2; b <= 12; b++) {
          for (let c = 2; c <= 12; c++) {
            const picked = Math.max(a, b, c);
            const weight = get2dCount(a) * get2dCount(b) * get2dCount(c);
            counts.set(picked, (counts.get(picked) || 0) + weight);
          }
        }
      }
      return Array.from(counts.entries()).map(([rawTotal, weight]) => makeOutcome(rawTotal, weight / totalWeight));
    }

    if (mode === "mcCold") {
      const totalWeight = 36 ** 3;
      const counts = new Map();
      for (let a = 2; a <= 12; a++) {
        for (let b = 2; b <= 12; b++) {
          for (let c = 2; c <= 12; c++) {
            const picked = Math.min(a, b, c);
            const weight = get2dCount(a) * get2dCount(b) * get2dCount(c);
            counts.set(picked, (counts.get(picked) || 0) + weight);
          }
        }
      }
      return Array.from(counts.entries()).map(([rawTotal, weight]) => makeOutcome(rawTotal, weight / totalWeight));
    }

    if (settings?.powerCertainty) {
      const safeRate = Math.max(0, Math.min(100, Math.trunc(toAnalysisNumber(rate, 0))));
      const totalWeight = 36 ** 2;
      const counts = new Map();
      for (let rollA = 2; rollA <= 12; rollA++) {
        for (let rollB = 2; rollB <= 12; rollB++) {
          const picked = choosePowerCertaintyRoll(safeRate, rollA, rollB);
          const weight = get2dCount(rollA) * get2dCount(rollB);
          counts.set(picked, (counts.get(picked) || 0) + weight);
        }
      }
      return Array.from(counts.entries()).map(([rawTotal, weight]) => makeOutcome(rawTotal, weight / totalWeight));
    }

    const outcomes = [];
    for (let total = 2; total <= 12; total++) outcomes.push(makeOutcome(total, get2dCount(total) / 36));
    return outcomes;
  }

  function calculatePowerExpectedWithDiceModifiers(option, settings) {
    const safeRate = Math.max(0, Math.min(100, Math.trunc(toAnalysisNumber(option.rate, 0))));
    let safeCrit = toAnalysisNumber(option.crit, 10) || 10;
    if (settings.critLower) safeCrit = Math.max(8, safeCrit);
    const critEnabled = !settings.critDisabled && safeCrit <= 12;
    const powerRateStep = getPowerRateStepForAttack(option, settings);
    const memo = new Map();

    const recur = (rollIndex, critCount) => {
      const key = `${rollIndex}:${critCount}`;
      if (memo.has(key)) return memo.get(key);
      if (critCount >= 20) {
        const stop = { expectedPower: 0, fumbleProbability: 0, critProbability: 0 };
        memo.set(key, stop);
        return stop;
      }

      const effectiveRate = Math.max(0, Math.min(100, safeRate + (critCount * powerRateStep)));
      const distribution = getPowerRollOutcomeDistribution(settings, effectiveRate, safeCrit);
      let expectedPower = 0;
      let fumbleProbability = 0;
      let critProbability = 0;

      distribution.forEach((outcome) => {
        const rawRoll = outcome.rawTotal;
        const weight = outcome.weight;
        const modifier = getDiceRollModifier(settings, rollIndex, rawRoll);
        const roll = modifier.modifiedTotal;
        const tableRoll = modifier.tableTotal;

        if (rollIndex === 0 && rawRoll === 2) {
          fumbleProbability += weight;
          return;
        }

        const powerValue = getPowerTableValue(effectiveRate, tableRoll);
        const critical = critEnabled && roll >= safeCrit && rawRoll !== 2;
        expectedPower += weight * powerValue;

        if (critical) {
          const next = recur(rollIndex + 1, critCount + 1);
          expectedPower += weight * next.expectedPower;
          fumbleProbability += weight * next.fumbleProbability;
          critProbability += weight;
        }
      });

      const result = { expectedPower, fumbleProbability, critProbability };
      memo.set(key, result);
      return result;
    };

    const result = recur(0, 0);
    return {
      powerExpected: result.expectedPower,
      crit: option.crit,
      effectiveCrit: safeCrit,
      critProbability: result.critProbability,
      fumbleProbability: result.fumbleProbability,
      note: "威力表0〜100を使用。$は初回のみ、#は全ロール、rは回転後の威力上昇として期待値に反映",
    };
  }

  function calculateDamageExpected(option, settings) {
    const power = calculatePowerExpectedWithDiceModifiers(option, settings);
    const add = toAnalysisNumber(option.add, 0);
    const addExpected = add * (1 - (power.fumbleProbability || 0));
    const raw = power.powerExpected + addExpected;
    const enemyDef = option.type === "weapon" && !option.ignoreDefense && isFiniteAnalysisNumber(settings.enemy.def) ? Math.max(0, settings.enemy.def) : 0;
    const afterDefense = Math.max(0, raw - enemyDef);
    return { ...power, addExpected, raw, enemyDef, afterDefense };
  }

  function calculateOpposedSuccessRate(activeBase, reactiveBase) {
    if (!isFiniteAnalysisNumber(activeBase) || !isFiniteAnalysisNumber(reactiveBase)) return null;
    let success = 0;
    for (let activeRoll = 2; activeRoll <= 12; activeRoll++) {
      for (let reactiveRoll = 2; reactiveRoll <= 12; reactiveRoll++) {
        const weight = get2dCount(activeRoll) * get2dCount(reactiveRoll);
        let ok = false;
        if (activeRoll === 2) ok = false;
        else if (reactiveRoll === 2) ok = true;
        else if (reactiveRoll === 12) ok = false;
        else if (activeRoll === 12) ok = true;
        else ok = activeBase + activeRoll > reactiveBase + reactiveRoll;
        if (ok) success += weight;
      }
    }
    return success / 1296;
  }

  function calculateOpposedSuccessRateWithSettings(activeBase, reactiveBase, settings) {
    if (!settings?.checkCertainty) return calculateOpposedSuccessRate(activeBase, reactiveBase);
    if (!isFiniteAnalysisNumber(activeBase) || !isFiniteAnalysisNumber(reactiveBase)) return null;
    let success = 0;
    let total = 0;
    for (let activeA = 2; activeA <= 12; activeA++) {
      for (let activeB = 2; activeB <= 12; activeB++) {
        for (let reactiveRoll = 2; reactiveRoll <= 12; reactiveRoll++) {
          const activeRoll = Math.max(activeA, activeB);
          const weight = get2dCount(activeA) * get2dCount(activeB) * get2dCount(reactiveRoll);
          total += weight;
          if (calculateOpposedOutcomeFromRolls(activeBase, reactiveBase, activeRoll, reactiveRoll)) success += weight;
        }
      }
    }
    return success / total;
  }

  function gradeFromRate(rate) {
    if (rate === null || rate === undefined || Number.isNaN(rate)) return { label: "未入力", className: "unknown" };
    // 通過率は「攻撃側の達成値が防御側を上回る確率」。同値は防御側成功。
    // 2D対抗では防御側6ゾロが優先されるため、攻撃側6ゾロと防御側6ゾロが重なった場合も通過しません。
    // 体感評価では32%台までを均衡、20%未満を非常に不利として扱う。
    if (rate >= 0.80) return { label: "非常に有利", className: "very-good" };
    if (rate >= 0.60) return { label: "有利", className: "good" };
    if (rate >= 0.32) return { label: "均衡", className: "even" };
    if (rate >= 0.20) return { label: "不利", className: "bad" };
    return { label: "非常に不利", className: "very-bad" };
  }

  function formatPercent(rate) {
    if (rate === null || rate === undefined || Number.isNaN(rate)) return "-";
    return `${(rate * 100).toFixed(1)}%`;
  }


  function isMonteCarloMode(settings) {
    return ["mc", "mcHot", "mcCold"].includes(settings?.mode);
  }

  function shouldUseTargetDefense(settings) {
    return settings?.targetDefenseMode !== "ignore";
  }

  function getTargetDefenseModeLabel(settings) {
    return shouldUseTargetDefense(settings) ? "回避/抵抗する" : "回避/抵抗しない";
  }

  function createAnalysisRng(seedText) {
    let seed = 2166136261;
    const text = String(seedText || "sw25-analysis");
    for (let i = 0; i < text.length; i++) {
      seed ^= text.charCodeAt(i);
      seed = Math.imul(seed, 16777619);
    }
    return () => {
      seed += 0x6D2B79F5;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rollOneDie(rng) {
    return Math.floor(rng() * 6) + 1;
  }

  function make2dPairFromSum(rng, sum) {
    const safeSum = Math.max(2, Math.min(12, Math.trunc(toAnalysisNumber(sum, 2))));
    const minA = Math.max(1, safeSum - 6);
    const maxA = Math.min(6, safeSum - 1);
    const a = minA + Math.floor(rng() * (maxA - minA + 1));
    return [a, safeSum - a];
  }

  function roll2dRawPair(rng) {
    const dice = [rollOneDie(rng), rollOneDie(rng)];
    return { dice, total: dice[0] + dice[1] };
  }

  function roll2dRaw(rng) {
    return roll2dRawPair(rng).total;
  }

  function roll2dScenario(rng, mode) {
    if (mode === "mcHot") return Math.max(roll2dRaw(rng), roll2dRaw(rng));
    if (mode === "mcCold") return Math.min(roll2dRaw(rng), roll2dRaw(rng));
    return roll2dRaw(rng);
  }

  function roll2dCheckScenario(rng, settings, side = "active") {
    const baseMode = side === "reactive" && settings.mode === "mcHot" ? "mcCold" : side === "reactive" && settings.mode === "mcCold" ? "mcHot" : settings.mode;
    const first = roll2dScenario(rng, baseMode);
    if (side === "active" && settings.checkCertainty) return Math.max(first, roll2dScenario(rng, baseMode));
    return first;
  }

  function roll2dCValueHotScenario(rng, crit) {
    const safeCrit = Math.max(2, Math.min(12, Math.trunc(toAnalysisNumber(crit, 10))));
    const minRoll = Math.max(2, Math.min(12, safeCrit - 2));
    return minRoll + Math.floor(rng() * (13 - minRoll));
  }

  function roll2dPowerBaseScenarioDetailed(rng, settings, crit) {
    const mode = settings?.mode || "mc";
    if (mode === "mcHot") {
      const safeCrit = toAnalysisNumber(crit, 10);
      if (!settings?.critDisabled && isFiniteAnalysisNumber(safeCrit) && safeCrit <= 12) {
        const total = roll2dCValueHotScenario(rng, safeCrit);
        return { dice: make2dPairFromSum(rng, total), total };
      }
      return [roll2dRawPair(rng), roll2dRawPair(rng), roll2dRawPair(rng)].sort((a, b) => b.total - a.total)[0];
    }
    if (mode === "mcCold") return [roll2dRawPair(rng), roll2dRawPair(rng), roll2dRawPair(rng)].sort((a, b) => a.total - b.total)[0];
    return roll2dRawPair(rng);
  }

  function roll2dPowerBaseScenario(rng, settings, crit) {
    return roll2dPowerBaseScenarioDetailed(rng, settings, crit).total;
  }

  function roll2dPowerScenarioDetailed(rng, settings, rate, crit) {
    const first = roll2dPowerBaseScenarioDetailed(rng, settings, crit);
    if (!settings.powerCertainty) return first;
    const second = roll2dPowerBaseScenarioDetailed(rng, settings, crit);
    const picked = choosePowerCertaintyRoll(rate, first.total, second.total);
    return picked === second.total && second.total !== first.total ? second : first;
  }

  function roll2dPowerScenario(rng, settings, rate, crit) {
    return roll2dPowerScenarioDetailed(rng, settings, rate, crit).total;
  }

  function calculateOpposedOutcomeFromRolls(activeBase, reactiveBase, activeRoll, reactiveRoll) {
    if (activeRoll === 2) return false;
    if (reactiveRoll === 2) return true;
    if (reactiveRoll === 12) return false;
    if (activeRoll === 12) return true;
    return activeBase + activeRoll > reactiveBase + reactiveRoll;
  }

  function clampPowerRollTotal(total) {
    return Math.max(2, Math.min(12, Math.trunc(toAnalysisNumber(total, 2))));
  }

  function getDiceRollModifier(settings, rollIndex, rawTotal) {
    const parts = [];
    let modifiedTotal = rawTotal;
    if (rollIndex === 0) {
      const firstMode = settings?.diceFirstMode || "none";
      const firstValue = toAnalysisNumber(settings?.diceFirstValue, 0);
      if (firstMode === "add" && firstValue) {
        modifiedTotal += firstValue;
        parts.push({ type: "firstAdd", label: `$${formatSigned(firstValue)}`, value: firstValue });
      } else if (firstMode === "fixed" && isFiniteAnalysisNumber(firstValue) && firstValue > 0) {
        modifiedTotal = Math.trunc(firstValue);
        parts.push({ type: "firstFixed", label: `$${Math.trunc(firstValue)}`, value: Math.trunc(firstValue) });
      } else if (firstMode === "conditionalAdd" && firstValue && rawTotal <= 10) {
        modifiedTotal += firstValue;
        parts.push({ type: "firstConditionalAdd", label: `$~${formatSigned(firstValue)}`, value: firstValue });
      }
      const criticalRay = getCriticalRayModifierInfo(settings);
      if (criticalRay) {
        modifiedTotal += criticalRay.value;
        parts.push({ type: "criticalRay", label: `${criticalRay.label} ${criticalRay.command}`, value: criticalRay.value });
      }
    }
    const repeatBonus = toAnalysisNumber(settings?.diceRepeatBonus, 0);
    if (repeatBonus) {
      modifiedTotal += repeatBonus;
      parts.push({ type: "repeatAdd", label: `#${formatSigned(repeatBonus)}`, value: repeatBonus });
    }
    return { rawTotal, modifiedTotal, tableTotal: clampPowerRollTotal(modifiedTotal), parts };
  }

  function simulatePowerDamage(option, settings, rng) {
    const safeRate = Math.max(0, Math.min(100, Math.trunc(toAnalysisNumber(option.rate, 0))));
    let safeCrit = toAnalysisNumber(option.crit, 10) || 10;
    if (settings.critLower) safeCrit = Math.max(8, safeCrit);
    const add = toAnalysisNumber(option.add, 0);
    const powerRateStep = getPowerRateStepForAttack(option, settings);
    let totalPower = 0;
    let critCount = 0;
    let first = true;
    let initialFumble = false;
    const rolls = [];
    const critEnabled = !settings.critDisabled && safeCrit <= 12;
    let rollIndex = 0;
    while (true) {
      const effectiveRate = Math.max(0, Math.min(100, safeRate + (critCount * powerRateStep)));
      const rolled = roll2dPowerScenarioDetailed(rng, settings, effectiveRate, safeCrit);
      const rawRoll = rolled.total;
      const modifier = getDiceRollModifier(settings, rollIndex, rawRoll);
      const roll = modifier.modifiedTotal;
      const tableRoll = modifier.tableTotal;
      const powerValue = getPowerTableValue(effectiveRate, tableRoll);
      if (first && rawRoll === 2) {
        initialFumble = true;
        rolls.push({ dice: rolled.dice, rawTotal: rawRoll, total: roll, tableTotal: tableRoll, modifiers: modifier.parts, powerValue: 0, fumble: true, rate: effectiveRate });
        break;
      }
      totalPower += powerValue;
      rolls.push({ dice: rolled.dice, rawTotal: rawRoll, total: roll, tableTotal: tableRoll, modifiers: modifier.parts, powerValue, rate: effectiveRate });
      first = false;
      if (!critEnabled || roll < safeCrit || rawRoll === 2) break;
      critCount += 1;
      rollIndex += 1;
      if (critCount >= 20) break;
    }
    const raw = initialFumble ? 0 : totalPower + add;
    const enemyDef = option.type === "weapon" && !option.ignoreDefense && isFiniteAnalysisNumber(settings.enemy.def) ? Math.max(0, settings.enemy.def) : 0;
    return { raw, enemyDef, afterDefense: Math.max(0, raw - enemyDef), critCount, initialFumble, rolls, rate: safeRate, crit: safeCrit, add, powerRateStep, diceModifierCommand: formatDiceModifierCommand(settings, option) };
  }

  function summarizeAnalysisSamples(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const n = sorted.length || 1;
    const pick = (q) => sorted[Math.max(0, Math.min(n - 1, Math.floor((n - 1) * q)))] ?? 0;
    const sum = sorted.reduce((acc, value) => acc + value, 0);
    return {
      avg: sum / n,
      min: sorted[0] ?? 0,
      p10: pick(0.10),
      p50: pick(0.50),
      p90: pick(0.90),
      max: sorted[n - 1] ?? 0,
    };
  }

  function pickAnalysisSampleIndex(sortedSamples, q) {
    const n = sortedSamples.length || 1;
    return Math.max(0, Math.min(n - 1, Math.floor((n - 1) * q)));
  }

  function formatAnalysisDiceRollText(roll) {
    if (!roll) return "-";
    const base = `[${(roll.dice || []).join(",")}]`;
    const rawTotal = isFiniteAnalysisNumber(roll.rawTotal) ? roll.rawTotal : roll.total;
    const mods = (roll.modifiers || []).map((mod) => mod.label).join("");
    const total = isFiniteAnalysisNumber(roll.total) ? roll.total : rawTotal;
    if (!mods || total === rawTotal) return `${base}=${rawTotal}`;
    return `${base}${mods}=${total}`;
  }

  function buildAnalysisPowerLog(option, sample, label) {
    if (!sample || !sample.damage || sample.missReason) {
      return { label, html: `<span class="analysis-log-muted">${escapeAnalysisHtml(sample?.missReason || "ダメージなし")}</span>` };
    }
    const damage = sample.damage;
    const rolls = damage.rolls || [];
    const rate = damage.rate ?? Math.max(0, Math.min(100, Math.trunc(toAnalysisNumber(option.rate, 0))));
    const crit = damage.crit ?? toAnalysisNumber(option.crit, 10);
    const add = damage.add ?? toAnalysisNumber(option.add, 0);
    const title = option.name ? ` ${option.name}` : "";
    const critText = crit <= 12 && !sample.settingsCritDisabled ? `@${crit}` : "";
    const diceModifierCommand = damage.diceModifierCommand || formatDiceModifierCommand(getCharAnalysisSettings());
    const command = `k${rate}${critText}${formatSigned(add)}${diceModifierCommand}${title}`;
    if (damage.initialFumble) {
      const first = rolls[0];
      const diceText = first ? formatAnalysisDiceRollText(first) : "[1,1]=2";
      return { label, html: `${renderAnalysisLogChip("式", command)} <span class="analysis-log-arrow">＞</span> ${renderAnalysisLogChip("2D", diceText, "dice")} <span class="analysis-log-arrow">＞</span> ${renderAnalysisLogChip("自動失敗", "0", "fumble")}` };
    }
    const diceText = rolls.map(formatAnalysisDiceRollText).join(" ");
    const powers = rolls.map((roll) => {
      const rateLabel = isFiniteAnalysisNumber(roll.rate) && roll.rate !== rate ? `k${roll.rate}:` : "";
      const rollText = roll.tableTotal !== roll.total ? `${roll.tableTotal}→${roll.powerValue}` : `${roll.tableTotal}→${roll.powerValue}`;
      return `${rateLabel}${rollText}`;
    }).join(",");
    const powerSum = rolls.reduce((acc, roll) => acc + roll.powerValue, 0);
    const raw = damage.raw;
    const defenseText = damage.enemyDef > 0 ? ` / 防護点${damage.enemyDef}後 ${sample.dealt}` : "";
    const critChip = damage.critCount > 0 ? ` ${renderAnalysisLogChip("回転", `${damage.critCount}回`, "critical")}` : ` ${renderAnalysisLogChip("回転", "なし", "muted")}`;
    return {
      label,
      html: `${renderAnalysisLogChip("式", command)} <span class="analysis-log-arrow">＞</span> ${renderAnalysisLogChip("出目", `2D:${diceText}`, "dice")} <span class="analysis-log-arrow">＞</span> ${renderAnalysisLogChip("威力", `威力${rate}: ${powers}`, "power")} <span class="analysis-log-arrow">＞</span> ${renderAnalysisLogChip("合計", `${powerSum}${formatSigned(add)} = ${raw}${defenseText}`, "total")}${critChip}`
    };
  }

  function renderAnalysisLogChip(label, value, tone = "") {
    const toneClass = tone ? ` is-${tone}` : "";
    return `<span class="analysis-log-chip${toneClass}"><span>${escapeAnalysisHtml(label)}</span><strong>${escapeAnalysisHtml(value)}</strong></span>`;
  }

  function renderAnalysisRepresentativeLogs(simulation) {
    const logs = simulation?.representativeLogs || [];
    if (!logs.length) return "";
    return `<div class="analysis-representative-logs">
      <h7>代表ログ</h7>
      <div class="analysis-representative-log-list">
        ${logs.map((log) => `<div class="analysis-representative-log"><div class="analysis-representative-log-label">${escapeAnalysisHtml(log.label)}</div><div class="analysis-representative-log-body">${log.html}</div></div>`).join("")}
      </div>
      <p class="analysis-note">出目は2Dの合計、威力は威力表で対応する値です。代表ログは全試行から中央値・低め・高め・最大に近いものだけを表示します。</p>
    </div>`;
  }

  function getMonteCarloModeLabel(mode) {
    if (mode === "mcHot") return "上振れ試行";
    if (mode === "mcCold") return "下振れ試行";
    return "多数試行";
  }


  function simulateCharAnalysisSingleAttackTrial(option, settings, rng) {
    let factor = 1;
    let ok = true;
    if (shouldUseTargetDefense(settings) && option.type === "weapon" && isFiniteAnalysisNumber(settings.enemy.eva)) {
      const activeRoll = roll2dCheckScenario(rng, settings, "active");
      const reactiveRoll = roll2dCheckScenario(rng, settings, "reactive");
      ok = calculateOpposedOutcomeFromRolls(option.hit, settings.enemy.eva, activeRoll, reactiveRoll);
    } else if (shouldUseTargetDefense(settings) && option.type !== "weapon" && /半減|消滅|短縮|任意/.test(option.resist || "")) {
      const resist = inferSpellResistanceBase(option, settings);
      if (isFiniteAnalysisNumber(resist.value)) {
        const activeRoll = roll2dScenario(rng, settings.mode);
        const reactiveRoll = roll2dScenario(rng, settings.mode === "mcHot" ? "mcCold" : settings.mode === "mcCold" ? "mcHot" : "mc");
        ok = calculateOpposedOutcomeFromRolls(option.cast ?? option.add, resist.value, activeRoll, reactiveRoll);
        if (!ok && /半減/.test(option.resist || "")) factor = 0.5;
        else if (!ok && /消滅/.test(option.resist || "")) factor = 0;
        else if (!ok && !/半減/.test(option.resist || "")) factor = 0;
      }
    }
    const damage = ok || factor > 0 ? simulatePowerDamage(option, settings, rng) : { afterDefense: 0, raw: 0, enemyDef: 0, critCount: 0, rolls: [] };
    const dealt = damage.afterDefense * factor;
    return { ok, factor, damage, dealt, missReason: ok || factor > 0 ? "" : "命中/抵抗に失敗してダメージなし" };
  }

  function buildAnalysisActionPlanRepresentativeLog(sample, label) {
    if (!sample) return { label, html: `<span class="analysis-log-muted">サンプルなし</span>` };
    const rows = (sample.parts || []).map((part) => {
      const log = buildAnalysisPowerLog(part.option, { damage: part.damage, dealt: part.dealtSingle, missReason: part.missReason, settingsCritDisabled: !!part.settings?.critDisabled }, part.slot?.label || "行動");
      const countText = part.targetCount > 1 ? ` ×${part.targetCount}体 = ${formatDecimal(part.dealtTotal)}` : ` = ${formatDecimal(part.dealtTotal)}`;
      return `<div class="analysis-plan-log-line"><b>${escapeAnalysisHtml(part.slot?.label || "行動")}</b><span>${log.html}</span><em>${escapeAnalysisHtml(countText)}</em></div>`;
    }).join("");
    return { label, html: `${rows}<div class="analysis-plan-log-total">合計 ${escapeAnalysisHtml(formatDecimal(sample.value))}</div>` };
  }

  function simulateCharAnalysisActionPlanResults(results = [], settings = getCharAnalysisSettings()) {
    const trials = Math.max(100, Math.min(50000, Math.trunc(toAnalysisNumber(settings.trials, 10000)) || 10000));
    const rounds = Math.max(1, settings.rounds || 1);
    const samples = [];
    let anySuccessCount = 0;
    let critCount = 0;
    let defeatCount = 0;
    const enemyHp = isFiniteAnalysisNumber(settings.enemy.hp) ? Math.max(0, settings.enemy.hp) : NaN;
    const seed = ["actionPlan", settings.mode, trials, rounds, settings.enemy.eva, settings.enemy.def, settings.enemy.hp, settings.enemy.vit, settings.enemy.mnd, settings.checkCertainty, settings.powerCertainty, settings.targetDefenseMode, settings.critDisabled, settings.simulationNonce, results.map((r) => [r.slot?.key, r.option?.id, r.option?.name, r.targetCount, JSON.stringify(r.settings?.manual || {})]).join("/")].join("|");
    const rng = createAnalysisRng(seed);
    for (let i = 0; i < trials; i++) {
      let total = 0;
      let anySuccess = false;
      let anyCrit = false;
      const parts = [];
      results.forEach((result) => {
        const slotSettings = result.settings || settings;
        const targetCount = Math.max(1, Math.trunc(toAnalysisNumber(result.targetCount, 1)) || 1);
        const trial = simulateCharAnalysisSingleAttackTrial(result.option, slotSettings, rng);
        const dealtTotal = trial.dealt * targetCount;
        total += dealtTotal;
        if (trial.ok) anySuccess = true;
        if ((trial.damage?.critCount || 0) > 0) anyCrit = true;
        parts.push({ slot: result.slot, option: result.option, settings: slotSettings, targetCount, damage: trial.damage, dealtSingle: trial.dealt, dealtTotal, missReason: trial.missReason });
      });
      const perRound = total / rounds;
      if (anySuccess) anySuccessCount += 1;
      if (anyCrit) critCount += 1;
      if (isFiniteAnalysisNumber(enemyHp) && total >= enemyHp) defeatCount += 1;
      samples.push({ value: perRound, total, parts });
    }
    const summary = summarizeAnalysisSamples(samples.map((sample) => sample.value));
    const sortedSamples = samples.slice().sort((a, b) => a.value - b.value);
    const sampleAt = (q) => sortedSamples[pickAnalysisSampleIndex(sortedSamples, q)] || null;
    const representativeLogSources = [
      ["中央値付近", sampleAt(0.50)],
      ["低め目安", sampleAt(0.10)],
      ["高め目安", sampleAt(0.90)],
      ["最大", sortedSamples[sortedSamples.length - 1] || null],
    ];
    const representativeLogs = representativeLogSources
      .filter((entry, index, array) => entry[1] && array.findIndex((other) => other[1] === entry[1]) === index)
      .map(([label, sample]) => buildAnalysisActionPlanRepresentativeLog(sample, label));
    return {
      label: `${getMonteCarloModeLabel(settings.mode)}（1R行動セット）`,
      trials,
      successRate: anySuccessCount / trials,
      critRate: critCount / trials,
      defeatRate: isFiniteAnalysisNumber(enemyHp) ? defeatCount / trials : null,
      averageDpr: summary.avg,
      summary,
      representativeLogs,
      note: "1試行ごとに1R内の全行動枠を順番に解決し、対象数を掛けた合計ダメージを集計しています。",
    };
  }

  function simulateSelectedAttackMetrics(option, settings) {
    if (!option) return null;
    const trials = Math.max(100, Math.min(50000, Math.trunc(toAnalysisNumber(settings.trials, 10000)) || 10000));
    const rounds = Math.max(1, settings.rounds || 1);
    const damageSamples = [];
    const representativeSamples = [];
    let success = 0;
    let critTrials = 0;
    let defeatCount = 0;
    const enemyHp = isFiniteAnalysisNumber(settings.enemy.hp) ? Math.max(0, settings.enemy.hp) : NaN;
    const seed = [option.id, option.name, settings.mode, trials, rounds, settings.enemy.eva, settings.enemy.def, settings.enemy.hp, settings.enemy.vit, settings.enemy.mnd, JSON.stringify(settings.manual || {}), settings.checkCertainty, settings.powerCertainty, settings.targetDefenseMode, settings.diceFirstMode, settings.diceFirstValue, settings.diceRepeatBonus, settings.criticalRayEnabled, settings.criticalRayRank, getPowerRateStepForAttack(option, settings), settings.simulationNonce].join("|");
    const rng = createAnalysisRng(seed);
    for (let i = 0; i < trials; i++) {
      let factor = 1;
      let ok = true;
      if (shouldUseTargetDefense(settings) && option.type === "weapon" && isFiniteAnalysisNumber(settings.enemy.eva)) {
        const activeRoll = roll2dCheckScenario(rng, settings, "active");
        const reactiveRoll = roll2dCheckScenario(rng, settings, "reactive");
        ok = calculateOpposedOutcomeFromRolls(option.hit, settings.enemy.eva, activeRoll, reactiveRoll);
      } else if (shouldUseTargetDefense(settings) && option.type !== "weapon" && /半減|消滅|短縮|任意/.test(option.resist || "")) {
        const resist = inferSpellResistanceBase(option, settings);
        if (isFiniteAnalysisNumber(resist.value)) {
          const activeRoll = roll2dScenario(rng, settings.mode);
          const reactiveRoll = roll2dScenario(rng, settings.mode === "mcHot" ? "mcCold" : settings.mode === "mcCold" ? "mcHot" : "mc");
          ok = calculateOpposedOutcomeFromRolls(option.cast ?? option.add, resist.value, activeRoll, reactiveRoll);
          if (!ok && /半減/.test(option.resist || "")) factor = 0.5;
          else if (!ok && /消滅/.test(option.resist || "")) factor = 0;
          else if (!ok && !/半減/.test(option.resist || "")) factor = 0;
        }
      }
      const damage = ok || factor > 0 ? simulatePowerDamage(option, settings, rng) : { afterDefense: 0, raw: 0, enemyDef: 0, critCount: 0, rolls: [] };
      const dealt = damage.afterDefense * factor;
      if (ok) success += 1;
      if (damage.critCount > 0) critTrials += 1;
      if (isFiniteAnalysisNumber(enemyHp) && dealt >= enemyHp) defeatCount += 1;
      const perRound = dealt / rounds;
      damageSamples.push(perRound);
      representativeSamples.push({ value: perRound, dealt, damage, missReason: ok || factor > 0 ? "" : "命中/抵抗に失敗してダメージなし", settingsCritDisabled: !!settings.critDisabled });
    }
    const summary = summarizeAnalysisSamples(damageSamples);
    const sortedSamples = representativeSamples.slice().sort((a, b) => a.value - b.value);
    const sampleAt = (q) => sortedSamples[pickAnalysisSampleIndex(sortedSamples, q)] || null;
    const representativeLogSources = [
      ["中央値付近", sampleAt(0.50)],
      ["低め目安", sampleAt(0.10)],
      ["高め目安", sampleAt(0.90)],
      ["最大", sortedSamples[sortedSamples.length - 1] || null],
    ];
    const representativeLogs = representativeLogSources
      .filter((entry, index, array) => entry[1] && array.findIndex((other) => other[1] === entry[1]) === index)
      .map(([label, sample]) => buildAnalysisPowerLog(option, sample, label));
    return {
      label: getMonteCarloModeLabel(settings.mode),
      trials,
      successRate: success / trials,
      critRate: critTrials / trials,
      defeatRate: isFiniteAnalysisNumber(enemyHp) ? defeatCount / trials : null,
      averageDpr: summary.avg,
      summary,
      representativeLogs,
      note: settings.mode === "mcHot"
        ? "上振れ試行は威力ロールをC値-2〜12に寄せ、クリティカルが出やすい簡易シナリオです。"
        : settings.mode === "mcCold"
          ? "下振れ試行は威力ロールを低めに寄せ、クリティカルが出にくい簡易シナリオです。"
          : "通常の多数試行です。結果は固定シードで安定表示します。",
    };
  }

  function formatDecimal(value, digits = 2) {
    if (!isFiniteAnalysisNumber(value)) return "-";
    return Number(value).toFixed(digits).replace(/\.00$/, "");
  }

  function inferSpellResistanceBase(option, settings) {
    const text = `${option.resist || ""} ${option.note || ""}`;
    if (/生命/.test(text) && isFiniteAnalysisNumber(settings.enemy.vit)) return { label: "生命抵抗", value: settings.enemy.vit };
    if (isFiniteAnalysisNumber(settings.enemy.mnd)) return { label: "精神抵抗", value: settings.enemy.mnd };
    if (isFiniteAnalysisNumber(settings.enemy.vit)) return { label: "生命抵抗", value: settings.enemy.vit };
    return { label: "抵抗未入力", value: NaN };
  }

  function calculateSelectedAttackMetrics(option, settings) {
    if (!option) return null;
    const simulation = isMonteCarloMode(settings) && Number(settings.simulationNonce || 0) > 0 ? simulateSelectedAttackMetrics(option, settings) : null;
    const damage = calculateDamageExpected(option, settings);
    let hitRate = simulation ? simulation.successRate : 1;
    let damageApplyRate = hitRate;
    let hitGrade = gradeFromRate(hitRate);
    let hitNote = simulation ? `${simulation.label} / ${simulation.trials}回` : "木人扱い";
    let dummyTarget = false;
    if (option.type === "weapon") {
      const hasEva = isFiniteAnalysisNumber(settings.enemy.eva);
      dummyTarget = !hasEva;
      if (!shouldUseTargetDefense(settings)) {
        if (!simulation) hitRate = 1;
        damageApplyRate = 1;
        hitGrade = gradeFromRate(hitRate);
        hitNote = simulation ? `${hitNote} / 相手は回避しない` : "相手判定なし: 回避しない";
      } else {
        if (!simulation) hitRate = hasEva ? calculateOpposedSuccessRateWithSettings(option.hit, settings.enemy.eva, settings) : 1;
        damageApplyRate = hitRate;
        hitGrade = gradeFromRate(hitRate);
        hitNote = simulation ? `${hitNote} / 相手は回避する` : (hasEva ? `敵回避${settings.enemy.eva} / 回避で消滅` : "木人: 回避なし");
      }
    } else if (/半減|消滅|短縮|任意/.test(option.resist || "")) {
      const resist = inferSpellResistanceBase(option, settings);
      const hasResist = isFiniteAnalysisNumber(resist.value);
      dummyTarget = !hasResist;
      const activeBase = option.cast ?? option.add;
      const needsResist = shouldUseTargetDefense(settings) && hasResist;
      const successRate = needsResist ? calculateOpposedSuccessRateWithSettings(activeBase, resist.value, settings) : null;
      if (!simulation) {
        hitRate = successRate === null ? 1 : successRate;
      }
      if (needsResist && /半減/.test(option.resist || "")) {
        damageApplyRate = hitRate + (1 - hitRate) * 0.5;
      } else if (needsResist && /消滅|短縮|任意/.test(option.resist || "")) {
        damageApplyRate = hitRate;
      } else {
        damageApplyRate = hitRate;
      }
      hitGrade = gradeFromRate(hitRate);
      hitNote = simulation
        ? `${hitNote} / 相手は${shouldUseTargetDefense(settings) ? "抵抗する" : "抵抗しない"}`
        : (!shouldUseTargetDefense(settings) ? "相手判定なし: 抵抗しない" : (successRate === null ? "木人: 抵抗なし" : `${resist.label}${resist.value} / 通過${formatPercent(successRate)}`));
    }
    const expectedPerAction = simulation ? null : damage.afterDefense * damageApplyRate;
    const rounds = Math.max(1, settings.rounds || 1);
    const averageDpr = simulation ? simulation.averageDpr : expectedPerAction / rounds;
    const defeatRounds = isFiniteAnalysisNumber(settings.enemy.hp) && averageDpr > 0 ? settings.enemy.hp / averageDpr : null;
    return { damage, hitRate, damageApplyRate, hitGrade, hitNote, expectedPerAction, rounds, averageDpr, defeatRounds, dummyTarget, simulation };
  }

  function analysisMetric(label, valueHtml) {
    return `<div class="analysis-kpi analysis-metric"><span>${escapeAnalysisHtml(label)}</span><strong>${valueHtml}</strong></div>`;
  }


  function formatAnalysisPlusParts(parts) {
    const nums = parts.map((value) => toAnalysisNumber(value, 0));
    const base = nums.shift() || 0;
    let text = formatSigned(base);
    nums.forEach((num) => {
      if (num) text += formatSigned(num);
    });
    return text;
  }

  function formatAnalysisAttackFormula(option, settings = getCharAnalysisSettings(), totals = { damage: 0 }) {
    if (!option) return "-";
    const adjusted = getAdjustedAttackOption(option, settings);
    const commandSuffix = formatDiceModifierCommand(settings, adjusted);
    return `K${adjusted.rate}@${adjusted.crit}${formatSigned(adjusted.add)}${commandSuffix}`;
  }

  function formatAnalysisCheckFormula(option, totals = { hit: 0 }, settings = getCharAnalysisSettings()) {
    if (!option) return "未選択";
    const adjusted = getAdjustedAttackOption(option, settings);
    if (option.type === "weapon") return `2D${formatSigned(adjusted.hit)}`;
    return `2D${formatSigned(adjusted.cast ?? adjusted.add)}`;
  }

  function formatAnalysisAttackFormulaDirect(adjusted, settings = getCharAnalysisSettings()) {
    if (!adjusted) return "-";
    const commandSuffix = formatDiceModifierCommand(settings, adjusted);
    return `K${adjusted.rate}@${adjusted.crit}${formatSigned(adjusted.add)}${commandSuffix}`;
  }

  function formatAnalysisCheckFormulaDirect(adjusted) {
    if (!adjusted) return "未選択";
    if (adjusted.type === "weapon") return `2D${formatSigned(adjusted.hit)}`;
    return `2D${formatSigned(adjusted.cast ?? adjusted.add)}`;
  }

  function renderAnalysisEffectTags(selectedEffects) {
    if (!selectedEffects.length) return `<span class="analysis-match-chip muted">適用なし</span>`;
    return selectedEffects.map((effect) => `<span class="analysis-match-chip">${escapeAnalysisHtml(effect.name)}</span>`).join("");
  }

  function renderSelectedAttackMetrics(option, settings) {
    const metrics = calculateSelectedAttackMetrics(option, settings);
    if (!metrics) return "";
    const targetNote = metrics.dummyTarget ? "敵データ未入力時は木人扱いです" : escapeAnalysisHtml(metrics.hitNote);
    return `<div class="analysis-dpr-box">
      <h6>ダメージ/R詳細</h6>
      <div class="analysis-metric-grid">
        ${analysisMetric("威力部期待値", escapeAnalysisHtml(formatDecimal(metrics.damage.powerExpected)))}
        ${analysisMetric("追加D期待値", escapeAnalysisHtml(formatDecimal(metrics.damage.addExpected)))}
        ${analysisMetric("防護前期待値", escapeAnalysisHtml(formatDecimal(metrics.damage.raw)))}
        ${analysisMetric("防護後期待値", escapeAnalysisHtml(formatDecimal(metrics.damage.afterDefense)))}
        ${analysisMetric("敵HPからの想定R", escapeAnalysisHtml(metrics.defeatRounds ? formatDecimal(metrics.defeatRounds, 1) : "-"))}
      </div>
      <p class="analysis-note">${escapeAnalysisHtml(metrics.damage.note)}。${targetNote}。物理攻撃は敵防護点${escapeAnalysisHtml(metrics.damage.enemyDef)}を差し引きます。</p>
    </div>`;
  }

  function renderSelectedAttackSimulationResult(option, settings) {
    const metrics = settings.__actionPlanSimulation
      ? { simulation: settings.__actionPlanSimulation }
      : calculateSelectedAttackMetrics(option, settings);
    if (!metrics || !metrics.simulation) {
      return `<div class="analysis-simulation-box is-empty"><h6>多数試行結果</h6><p class="analysis-note">多数試行は「試行実行」を押すと下に表示されます。上の平均ダメージ/Rは理論期待値として自動再計算されます。</p></div>`;
    }
    return `<div class="analysis-simulation-box">
      <h6>${escapeAnalysisHtml(metrics.simulation.label)}結果</h6>
      <div class="analysis-metric-grid analysis-simulation-grid">
        ${analysisMetric("試行回数", escapeAnalysisHtml(String(metrics.simulation.trials)))}
        ${analysisMetric("中央値", escapeAnalysisHtml(formatDecimal(metrics.simulation.summary.p50)))}
        ${analysisMetric("低め目安", escapeAnalysisHtml(formatDecimal(metrics.simulation.summary.p10)))}
        ${analysisMetric("高め目安", escapeAnalysisHtml(formatDecimal(metrics.simulation.summary.p90)))}
        ${analysisMetric("最大", escapeAnalysisHtml(formatDecimal(metrics.simulation.summary.max)))}
        ${analysisMetric("クリティカル率", escapeAnalysisHtml(formatPercent(metrics.simulation.critRate)))}
        ${analysisMetric("撃破率", escapeAnalysisHtml(metrics.simulation.defeatRate === null ? "-" : formatPercent(metrics.simulation.defeatRate)))}
      </div>
      <p class="analysis-note">${escapeAnalysisHtml(metrics.simulation.note)} 低め目安は下位10%付近、高め目安は上位10%付近です。期待値欄は比較用の理論値です。</p>
      ${renderAnalysisRepresentativeLogs(metrics.simulation)}
    </div>`;
  }


  function selectedAttackBriefValues(adjusted) {
    if (!adjusted) return [];
    if (adjusted.type === "weapon") {
      return [
        { label: "技能", value: adjusted.skill || "-" },
        { label: "カテゴリ", value: adjusted.category || "-" },
        { label: "用法", value: adjusted.usage || "-" },
        { label: "必筋", value: adjusted.reqd || "-" },
      ];
    }
    return [
      { label: "技能", value: adjusted.skill ? `${adjusted.skill} Lv${adjusted.level || "-"}` : "-" },
      { label: "抵抗", value: getCompactResistanceText(adjusted.resist) },
      { label: "属性", value: adjusted.attribute || "-" },
      { label: "対象", value: adjusted.target || "-" },
      { label: "射程", value: adjusted.range || "-" },
    ];
  }

  function renderAnalysisInlineSettings(settings = getCharAnalysisSettings(), option = null) {
    const modeLabelMap = { mc: "多数試行", mcHot: "上振れ試行", mcCold: "下振れ試行" };
    const profileLabelMap = { base: "素", normal: "通常運用", max: "最大想定" };
    const rows = [
      ["試行", modeLabelMap[settings.mode] || settings.mode || "多数試行"],
      ["基準", profileLabelMap[settings.profile] || settings.profile || "-"],
      ["相手判定", getTargetDefenseModeLabel(settings)],
      ["平均R", settings.rounds || 1],
    ];
    rows.push(["試行回数", settings.trials || 10000]);
    if (settings.critDisabled) rows.push(["クリティカル", "無効"]);
    if (settings.checkCertainty) rows.push(["判定", "確実化"]);
    if (settings.powerCertainty) rows.push(["威力", "確実化"]);
    const firstDiceText = formatDiceFirstModifierLabel(settings);
    if (firstDiceText) rows.push(["初回出目", firstDiceText]);
    if (toAnalysisNumber(settings.diceRepeatBonus, 0)) rows.push(["継続出目", `#${formatSigned(settings.diceRepeatBonus)}`]);
    const powerRateStepLabel = formatPowerRateStepLabel(option, settings);
    if (powerRateStepLabel) rows.push(["首切り", powerRateStepLabel]);
    return `<div class="analysis-inline-settings" aria-label="現在の計算条件">
      <span class="analysis-inline-settings-title">自動再計算</span>
      ${rows.map(([label, value]) => `<span class="analysis-inline-setting"><small>${escapeAnalysisHtml(label)}</small>${escapeAnalysisHtml(value)}</span>`).join("")}
    </div>`;
  }

  function getCriticalRayModifierInfo(settings = getCharAnalysisSettings()) {
    if (!settings?.criticalRayEnabled) return null;
    const rank = getCharAnalysisAlchemyRank("criticalRay");
    const value = getCharAnalysisCriticalRayBonus(rank);
    return value ? { rank, value, label: `クリレイ${rank}`, command: `$${formatSigned(value)}` } : null;
  }

  function formatDiceFirstManualModifierLabel(settings = getCharAnalysisSettings()) {
    const mode = settings?.diceFirstMode || "none";
    const value = toAnalysisNumber(settings?.diceFirstValue, 0);
    if (mode === "add" && value) return `$${formatSigned(value)}`;
    if (mode === "fixed" && isFiniteAnalysisNumber(value) && value > 0) return `$${Math.trunc(value)}`;
    if (mode === "conditionalAdd" && value) return `$~${formatSigned(value)}`;
    return "";
  }

  function formatDiceFirstModifierLabel(settings = getCharAnalysisSettings()) {
    const manual = formatDiceFirstManualModifierLabel(settings);
    const criticalRay = getCriticalRayModifierInfo(settings);
    const parts = [];
    if (manual) parts.push(manual);
    if (criticalRay) parts.push(`${criticalRay.label} ${criticalRay.command}`);
    return parts.join(" / ");
  }

  function formatDiceFirstModifierCommand(settings = getCharAnalysisSettings()) {
    const mode = settings?.diceFirstMode || "none";
    const value = toAnalysisNumber(settings?.diceFirstValue, 0);
    const criticalRay = getCriticalRayModifierInfo(settings);
    const rayBonus = criticalRay?.value || 0;
    if (mode === "fixed" && isFiniteAnalysisNumber(value) && value > 0) return `$${Math.trunc(value + rayBonus)}`;
    if (mode === "conditionalAdd" && value) return rayBonus ? `$~${formatSigned(value)}+${criticalRay.label}` : `$~${formatSigned(value)}`;
    const totalAdd = (mode === "add" ? value : 0) + rayBonus;
    return totalAdd ? `$${formatSigned(totalAdd)}` : "";
  }

  function formatDiceModifierCommand(settings = getCharAnalysisSettings(), option = null) {
    const first = formatDiceFirstModifierCommand(settings);
    const repeat = toAnalysisNumber(settings?.diceRepeatBonus, 0);
    const rateStep = getPowerRateStepForAttack(option, settings);
    return `${first}${repeat ? `#${formatSigned(repeat)}` : ""}${rateStep ? `r${rateStep}` : ""}`;
  }

  function renderAnalysisSettingsControls(settings = getCharAnalysisSettings()) {
    const checked = (value) => value ? "checked" : "";
    const selected = (value, current) => value === current ? "selected" : "";
    return `<div class="analysis-setup-side analysis-setup-self analysis-inline-settings-controls">
      <h5><i class="fa-solid fa-sliders"></i> 試行・判定設定</h5>
      <div class="analysis-control-grid analysis-self-control-grid">
        <label>試行種別
          <select id="char-analysis-mode">
            <option value="mc" ${selected("mc", settings.mode)}>多数試行</option>
            <option value="mcHot" ${selected("mcHot", settings.mode)}>上振れ試行</option>
            <option value="mcCold" ${selected("mcCold", settings.mode)}>下振れ試行</option>
          </select>
        </label>
        <label>評価基準
          <select id="char-analysis-profile">
            <option value="base" ${selected("base", settings.profile)}>素</option>
            <option value="normal" ${selected("normal", settings.profile)}>通常運用</option>
            <option value="max" ${selected("max", settings.profile)}>最大想定</option>
          </select>
        </label>
        <label class="analysis-check-label analysis-target-defense-toggle"><input type="checkbox" class="switch" id="char-analysis-target-defense-toggle" ${checked(settings.targetDefenseMode !== "ignore")} /> <span>回避/抵抗する</span></label>
        <label>平均R
          <input type="number" id="char-analysis-rounds" min="1" max="18" value="${escapeAnalysisHtml(settings.rounds || 1)}" />
        </label>
        <label>試行回数
          <input type="number" id="char-analysis-trials" min="100" max="50000" step="100" value="${escapeAnalysisHtml(settings.trials || 10000)}" />
        </label>
        <label class="analysis-check-label"><input type="checkbox" class="switch" id="char-analysis-crit-disabled" ${checked(settings.critDisabled)} /> <span>クリティカル無効</span></label>
        <label class="analysis-check-label"><input type="checkbox" class="switch" id="char-analysis-check-certainty" ${checked(settings.checkCertainty)} /> <span>判定確実化</span></label>
        <label class="analysis-check-label"><input type="checkbox" class="switch" id="char-analysis-power-certainty" ${checked(settings.powerCertainty)} /> <span>威力確実化</span></label>
      </div>
      <div class="analysis-condition-actions">
        <button type="button" id="char-analysis-simulate-btn" class="small-button analysis-simulate-btn"><i class="fa-solid fa-dice"></i> 試行実行</button>
        <span class="analysis-condition-help">設定や敵値、相手判定を変更すると平均ダメージ/Rは自動で再計算されます。多数試行は「試行実行」で乱数を振り直します。</span>
      </div>
    </div>`;
  }

  function renderSelectedAttackTop(option, settings = getCharAnalysisSettings()) {
    if (!option) return `<p class="muted">攻撃候補を選択してください。</p>`;
    const adjusted = getAdjustedAttackOption(option, settings);
    const briefHtml = selectedAttackBriefValues(adjusted)
      .filter((item) => String(item?.value || "").trim())
      .map((item) => `<span><small>${escapeAnalysisHtml(item.label)}</small>${escapeAnalysisHtml(item.value)}</span>`)
      .join("");
    const weaponNote = adjusted.weaponNote
      ? `<details class="analysis-weapon-note compact"><summary>備考</summary><p>${escapeAnalysisHtml(adjusted.weaponNote)}</p></details>`
      : "";
    return `<div class="analysis-selected-attack-top">
      <div class="analysis-attack-brief">${briefHtml}</div>
      ${weaponNote}
      ${renderAnalysisInlineSettings(settings, adjusted)}
    </div>`;
  }

  function renderSelectedAttackDetail(option, settings = getCharAnalysisSettings()) {
    if (!option) return `<p class="muted">攻撃候補を選択してください。</p>`;
    const adjusted = getAdjustedAttackOption(option, settings);
    return `<div class="analysis-selected-attack analysis-selected-attack-metrics">
      ${renderSelectedAttackMetrics(adjusted, settings)}
      ${renderAnalysisSettingsControls(settings)}
      ${renderSelectedAttackSimulationResult(adjusted, settings)}
    </div>`;
  }

  function formatAnalysisChanged(base, delta, options = {}) {
    const baseNum = toAnalysisNumber(base, 0);
    const deltaNum = toAnalysisNumber(delta, 0);
    const finalNum = baseNum + deltaNum;
    const signed = options.signed !== false;
    const formatValue = (value) => signed ? formatSigned(value) : String(value);
    if (!deltaNum) return formatValue(baseNum);
    return `${formatValue(baseNum)} → ${formatValue(finalNum)}`;
  }


  function getAnalysisOpponentInfo(option, settings) {
    if (!option) return { label: "防御側", value: "未選択", sub: "敵データ未入力", base: NaN, dummy: false };
    if (option.type === "weapon") {
      const hasEva = isFiniteAnalysisNumber(settings.enemy.eva);
      return {
        label: hasEva ? "敵回避" : "木人",
        value: hasEva ? `2D${formatSigned(settings.enemy.eva)}` : "回避なし",
        sub: hasEva ? `回避で対抗 / 防護 ${isFiniteAnalysisNumber(settings.enemy.def) ? settings.enemy.def : 0}${isFiniteAnalysisNumber(settings.enemy.hp) ? ` / HP ${settings.enemy.hp}` : ""}` : "木人",
        base: hasEva ? settings.enemy.eva : NaN,
        dummy: !hasEva,
      };
    }
    const resist = inferSpellResistanceBase(option, settings);
    const hasResist = isFiniteAnalysisNumber(resist.value);
    return {
      label: hasResist ? `敵${resist.label}` : "木人",
      value: hasResist ? `2D${formatSigned(resist.value)}` : "抵抗なし",
      sub: hasResist ? `${resist.label}で対抗 / ${getCompactResistanceText(option.resist)}` : "木人",
      base: resist.value,
      dummy: !hasResist,
    };
  }


  function getCompactResistanceText(resistText) {
    const text = String(resistText || "");
    if (/半減/.test(text)) return "半減";
    if (/消滅/.test(text)) return "消滅";
    if (/短縮/.test(text)) return "短縮";
    if (/必中/.test(text)) return "必中";
    if (/任意/.test(text)) return "任意";
    return text || "抵抗未設定";
  }

  function formatAnalysisStatChip(label, value) {
    if (value === null || value === undefined || value === "") return "";
    return `<span><b>${escapeAnalysisHtml(label)}</b>${escapeAnalysisHtml(value)}</span>`;
  }


  function renderAnalysisMatchSummary(charData, totals, settings, selectedEffects, selectedOption, selectedDeclarations = []) {
    const adjusted = selectedOption ? getAdjustedAttackOption(selectedOption, settings) : null;
    const metrics = adjusted ? calculateSelectedAttackMetrics(adjusted, settings) : null;
    const grade = metrics ? (metrics.hitGrade || gradeFromRate(metrics.hitRate)) : { label: "未選択", className: "unknown" };
    const opponent = getAnalysisOpponentInfo(adjusted, settings);
    const checkLabel = adjusted?.type === "spell" ? "行使" : "命中";
    const checkFormula = adjusted ? formatAnalysisCheckFormula(selectedOption || adjusted, totals) : "未選択";
    const powerFormula = adjusted ? formatAnalysisAttackFormula(selectedOption || adjusted, settings, totals) : "-";
    const rateText = metrics ? formatPercent(metrics.hitRate) : "-";
    const dprText = metrics ? formatDecimal(metrics.averageDpr) : "-";
    const centerClass = `analysis-match-summary match-rank-${grade.className}`;
    const attackTypeText = adjusted?.source === "manual" ? "直接指定" : (adjusted?.type === "spell" ? "魔法攻撃" : "武器攻撃");
    const enemySub = opponent.dummy
      ? [
          formatAnalysisStatChip("防護", isFiniteAnalysisNumber(settings.enemy.def) ? settings.enemy.def : 0),
          formatAnalysisStatChip("HP", isFiniteAnalysisNumber(settings.enemy.hp) ? settings.enemy.hp : "-"),
        ].filter(Boolean).join("")
      : adjusted?.type === "weapon"
        ? [
            formatAnalysisStatChip("対抗", `敵回避 ${opponent.value}`),
            formatAnalysisStatChip("防護", isFiniteAnalysisNumber(settings.enemy.def) ? settings.enemy.def : 0),
            formatAnalysisStatChip("HP", isFiniteAnalysisNumber(settings.enemy.hp) ? settings.enemy.hp : "-"),
          ].filter(Boolean).join("")
        : [
            formatAnalysisStatChip("対抗", `${opponent.label} ${opponent.value}`),
            formatAnalysisStatChip("抵抗", getCompactResistanceText(adjusted?.resist)),
            formatAnalysisStatChip("HP", isFiniteAnalysisNumber(settings.enemy.hp) ? settings.enemy.hp : "-"),
          ].filter(Boolean).join("");
    return `<div class="${centerClass}">
      <div class="analysis-match-side analysis-match-self">
        <div class="analysis-match-label">冒険者</div>
        <div class="analysis-match-main">
          <span class="analysis-match-main-label">${escapeAnalysisHtml(checkLabel)}</span>
          <strong>${escapeAnalysisHtml(checkFormula)}</strong>
        </div>
        <div class="analysis-match-statline">
          ${formatAnalysisStatChip("威力式", powerFormula)}
          ${formatAnalysisStatChip("種別", attackTypeText)}
        </div>
        <div class="analysis-match-ribbon-stack">
          <div class="analysis-match-ribbon">${renderSw25DecoratedNameHtml(adjusted?.source === "gun-bullet" ? (adjusted.gunName || adjusted.name) : (adjusted?.name || "攻撃候補未選択"))}</div>
          ${adjusted?.source === "gun-bullet" ? `<div class="analysis-match-ribbon analysis-match-ribbon-bullet">${renderSw25DecoratedNameHtml(adjusted.bulletName || "バレット")}</div>` : ""}
        </div>
        <div class="analysis-match-tags" aria-label="適用中の効果">${renderAnalysisEffectTags([...selectedEffects, ...selectedDeclarations])}</div>
      </div>
      <div class="analysis-match-center">
        <div class="analysis-match-result-head">
          <div class="analysis-match-judgement">${escapeAnalysisHtml(grade.label)}</div>
          <span class="analysis-match-rate"><b>${escapeAnalysisHtml(rateText)}</b><small>通過率</small></span>
        </div>
        <div class="analysis-match-spark" aria-hidden="true"></div>
        <div class="analysis-match-center-values">
          <span class="analysis-match-dpr"><b>${escapeAnalysisHtml(dprText)}</b><small>平均ダメージ/R</small></span>
        </div>
      </div>
      <div class="analysis-match-side analysis-match-enemy">
        <div class="analysis-match-label">敵</div>
        <div class="analysis-match-main">
          <span class="analysis-match-main-label">${escapeAnalysisHtml(opponent.label)}</span>
          <strong>${escapeAnalysisHtml(opponent.value)}</strong>
        </div>
        <div class="analysis-match-statline">${enemySub}</div>
        <div class="analysis-match-ribbon enemy">${escapeAnalysisHtml(opponent.sub)}</div>
      </div>
    </div>`;
  }

  function renderAnalysisActionSlotMatchSummary(result, settings = getCharAnalysisSettings(), compact = false, index = 0) {
    const adjusted = result?.option || null;
    const metrics = result?.metrics || null;
    if (!adjusted || !metrics) return "";
    const grade = metrics.hitGrade || gradeFromRate(metrics.hitRate);
    const opponent = getAnalysisOpponentInfo(adjusted, settings);
    const checkLabel = adjusted.type === "spell" ? "行使" : "命中";
    const checkFormula = formatAnalysisCheckFormulaDirect(adjusted);
    const powerFormula = formatAnalysisAttackFormulaDirect(adjusted, settings);
    const rateText = formatPercent(metrics.hitRate);
    const targetCount = Math.max(1, Math.trunc(toAnalysisNumber(result.targetCount, 1)) || 1);
    const targetMaxValue = Math.max(1, Math.trunc(toAnalysisNumber(result.targetMax, 1)) || 1);
    const shouldShowTargetCountControl = targetMaxValue > 1 || targetCount > 1;
    const singleDpr = metrics.averageDpr || 0;
    const totalDpr = result.totalAverageDpr ?? singleDpr * targetCount;
    const dprText = targetCount > 1 ? `${formatDecimal(singleDpr)}×${targetCount}=${formatDecimal(totalDpr)}` : formatDecimal(singleDpr);
    const targetSuffixCompact = [targetCount > 1 ? `${targetCount}体` : "", targetMaxValue > 1 ? `最大${targetMaxValue}` : ""].filter(Boolean).join("/");
    const targetSuffixFull = [targetCount > 1 ? `${targetCount}体` : "", targetMaxValue > 1 ? `最大${targetMaxValue}` : ""].filter(Boolean).join(" / ");
    const centerClass = `analysis-match-summary analysis-action-slot-match-summary match-rank-${grade.className}`;
    const attackTypeText = adjusted.source === "manual" ? "直接指定" : (adjusted.source === "gun-bullet" ? "ガン攻撃" : (adjusted.type === "spell" ? "魔法攻撃" : "武器攻撃"));
    const enemySub = opponent.dummy
      ? [
          formatAnalysisStatChip("防護", isFiniteAnalysisNumber(settings.enemy.def) ? settings.enemy.def : 0),
          formatAnalysisStatChip("HP", isFiniteAnalysisNumber(settings.enemy.hp) ? settings.enemy.hp : "-"),
        ].filter(Boolean).join("")
      : adjusted.type === "weapon"
        ? [
            formatAnalysisStatChip("対抗", `敵回避 ${opponent.value}`),
            formatAnalysisStatChip("防護", isFiniteAnalysisNumber(settings.enemy.def) ? settings.enemy.def : 0),
            formatAnalysisStatChip("HP", isFiniteAnalysisNumber(settings.enemy.hp) ? settings.enemy.hp : "-"),
          ].filter(Boolean).join("")
        : [
            formatAnalysisStatChip("対抗", `${opponent.label} ${opponent.value}`),
            formatAnalysisStatChip("抵抗", getCompactResistanceText(adjusted.resist)),
            formatAnalysisStatChip("HP", isFiniteAnalysisNumber(settings.enemy.hp) ? settings.enemy.hp : "-"),
          ].filter(Boolean).join("");
    const declarationText = result.declarations?.length ? result.declarations.map((feat) => feat.name).join(" + ") : "宣言なし";
    const declarationTags = result.declarations?.length
      ? `<div class="analysis-match-tags" aria-label="適用中の宣言">${renderAnalysisEffectTags(result.declarations || [])}</div>`
      : "";
    if (compact) {
      const attackNameHtml = adjusted.source === "gun-bullet"
        ? `<div class="analysis-compact-gun-bullet"><span class="analysis-match-ribbon compact-main analysis-compact-gun-name">${renderSw25DecoratedNameHtml(adjusted.gunName || adjusted.name || "ガン")}</span><span class="analysis-match-ribbon analysis-match-ribbon-bullet compact-bullet"><small>弾</small>${renderSw25DecoratedNameHtml(adjusted.bulletName || "バレット")}</span></div>`
        : `<span class="analysis-match-ribbon compact-main">${renderSw25DecoratedNameHtml(adjusted.name || "攻撃候補未選択")}</span>`;
      const compactDecl = result.declarations?.length ? result.declarations.map((feat) => feat.name).join(" + ") : "宣言なし";
      const compactSource = String(result.slot?.source || "").replace(/^通常行動\s*\/\s*/, "");
      const compactRate = Number.isFinite(metrics.hitRate) ? metrics.hitRate : 0.5;
      const compactFireRank = compactRate >= 0.9
        ? "very-good"
        : compactRate >= 0.65
          ? "good"
          : compactRate <= 0.1
            ? "very-bad"
            : compactRate <= 0.35
              ? "bad"
              : "even";
      const compactFireXByRank = {
        "very-good": "-9.6rem",
        good: "-5.4rem",
        even: "-1.2rem",
        bad: "34%",
        "very-bad": "calc(100% - 7.2rem)",
      };
      const firePresets = [
        { y: "-4.8rem", rot: "45deg", scale: "2.18", opacity: "0.5" },
        { y: "-3.2rem", rot: "45deg", scale: "2.02", opacity: "0.44" },
        { y: "-5.7rem", rot: "45deg", scale: "2.32", opacity: "0.42" },
        { y: "-4.0rem", rot: "45deg", scale: "1.94", opacity: "0.4" },
      ];
      const fire = firePresets[Math.abs(index) % firePresets.length];
      const fireX = compactFireXByRank[compactFireRank] || compactFireXByRank.even;
      const fireStyle = `--analysis-compact-fire-x:${fireX};--analysis-compact-fire-y:${fire.y};--analysis-compact-fire-rot:${fire.rot};--analysis-compact-fire-scale:${fire.scale};--analysis-compact-fire-opacity:${fire.opacity};`;
      return `<section class="analysis-action-slot-match-card is-compact match-rank-${escapeAnalysisHtml(compactFireRank)}${adjusted.source === "gun-bullet" ? " is-gun-bullet" : ""}" style="${escapeAnalysisHtml(fireStyle)}">
        <div class="analysis-action-slot-compact-match">
          <div class="analysis-compact-slot-title"><strong>${escapeAnalysisHtml(result.slot?.label || "行動枠")}</strong><small>${escapeAnalysisHtml(compactSource)}</small></div>
          <div class="analysis-compact-attack-name">${attackNameHtml}</div>
          <div class="analysis-compact-formulas"><span>${escapeAnalysisHtml(checkLabel)} ${escapeAnalysisHtml(checkFormula)}</span><span>${escapeAnalysisHtml(powerFormula)}</span></div>
          <div class="analysis-compact-declarations">${escapeAnalysisHtml(compactDecl)}</div>
          ${shouldShowTargetCountControl ? `<label class="analysis-target-count-control is-compact"><span>対象</span><input type="text" inputmode="numeric" pattern="[0-9]*" class="char-analysis-action-target-count" data-slot="${escapeAnalysisHtml(result.slot?.key || "")}" data-target-max="${escapeAnalysisHtml(targetMaxValue)}" value="${escapeAnalysisHtml(targetCount)}" />${targetSuffixCompact ? `<em>${escapeAnalysisHtml(targetSuffixCompact)}</em>` : ""}</label>` : ""}
          <div class="analysis-compact-result"><b>${escapeAnalysisHtml(dprText)}</b><small>${escapeAnalysisHtml(grade.label)} / ${escapeAnalysisHtml(rateText)}</small></div>
        </div>
      </section>`;
    }
    return `<section class="analysis-action-slot-match-card">
      <div class="analysis-action-slot-match-head"><strong>${escapeAnalysisHtml(result.slot?.label || "行動枠")}</strong><span>${escapeAnalysisHtml(result.slot?.source || "")}</span><em>${escapeAnalysisHtml(declarationText)}</em></div>
      <div class="${centerClass}">
        <div class="analysis-match-side analysis-match-self">
          <div class="analysis-match-label">冒険者</div>
          <div class="analysis-match-main">
            <span class="analysis-match-main-label">${escapeAnalysisHtml(checkLabel)}</span>
            <strong>${escapeAnalysisHtml(checkFormula)}</strong>
          </div>
          <div class="analysis-match-statline">
            ${formatAnalysisStatChip("威力式", powerFormula)}
            ${formatAnalysisStatChip("種別", attackTypeText)}
          </div>
          <div class="analysis-match-ribbon-stack">
            <div class="analysis-match-ribbon">${renderSw25DecoratedNameHtml(adjusted.source === "gun-bullet" ? (adjusted.gunName || adjusted.name) : (adjusted.name || "攻撃候補未選択"))}</div>
            ${adjusted.source === "gun-bullet" ? `<div class="analysis-match-ribbon analysis-match-ribbon-bullet">${renderSw25DecoratedNameHtml(adjusted.bulletName || "バレット")}</div>` : ""}
          </div>
          ${declarationTags}
        </div>
        <div class="analysis-match-center">
          <div class="analysis-match-result-head">
            <div class="analysis-match-judgement">${escapeAnalysisHtml(grade.label)}</div>
            <span class="analysis-match-rate"><b>${escapeAnalysisHtml(rateText)}</b><small>通過率</small></span>
          </div>
          <div class="analysis-match-spark" aria-hidden="true"></div>
          <div class="analysis-match-center-values">
            <span class="analysis-match-dpr"><b>${escapeAnalysisHtml(dprText)}</b><small>平均ダメージ/R</small></span>
          </div>
        </div>
        <div class="analysis-match-side analysis-match-enemy">
          <div class="analysis-match-label">敵</div>
          <div class="analysis-match-main">
            <span class="analysis-match-main-label">${escapeAnalysisHtml(opponent.label)}</span>
            <strong>${escapeAnalysisHtml(opponent.value)}</strong>
          </div>
          ${shouldShowTargetCountControl ? `<label class="analysis-target-count-control"><span>対象数</span><input type="text" inputmode="numeric" pattern="[0-9]*" class="char-analysis-action-target-count" data-slot="${escapeAnalysisHtml(result.slot?.key || "")}" data-target-max="${escapeAnalysisHtml(targetMaxValue)}" value="${escapeAnalysisHtml(targetCount)}" />${targetSuffixFull ? `<em>${escapeAnalysisHtml(targetSuffixFull)}</em>` : ""}</label>` : ""}
          <div class="analysis-match-statline">${enemySub}</div>
          <div class="analysis-match-ribbon enemy">${escapeAnalysisHtml(opponent.sub)}</div>
        </div>
      </div>
    </section>`;
  }

  function getDefenseReactiveInfo(option, defense, totals = { eva: 0, def: 0 }) {
    const oppose = String(option?.oppose || "");
    if (/必中/.test(oppose) || option?.activeBase === "必中") return { label: "必中", value: NaN, autoFail: true };
    if (/生命/.test(oppose)) return { label: "生命抵抗", value: defense.vitRes };
    if (/精神/.test(oppose)) return { label: "精神抵抗", value: defense.mndRes };
    if (/回避/.test(oppose) || option?.type === "enemy-normal") return { label: "回避", value: defense.eva + toAnalysisNumber(totals.eva, 0) };
    return { label: oppose || "対抗不明", value: NaN };
  }

  function calculateDiceExpressionExpected(expr, fallbackDice = "", fallbackBonus = 0) {
    const source = String(expr || fallbackDice || "").replace(/[Ｄｄ]/g, "D").replace(/\s+/g, "");
    const match = source.match(/^(\d+)D(?:([+\-])?(\d+))?/i);
    if (match) {
      const dice = toAnalysisNumber(match[1], 0);
      const sign = match[2] === "-" ? -1 : 1;
      const bonus = match[3] ? sign * toAnalysisNumber(match[3], 0) : toAnalysisNumber(fallbackBonus, 0);
      return { expected: dice * 3.5 + bonus, formula: `${dice}D${bonus ? formatSigned(bonus) : ""}` };
    }
    if (fallbackDice) {
      const diceMatch = String(fallbackDice).match(/(\d+)D/i);
      const dice = diceMatch ? toAnalysisNumber(diceMatch[1], 0) : 0;
      const bonus = toAnalysisNumber(fallbackBonus, 0);
      return { expected: dice * 3.5 + bonus, formula: `${dice || "?"}D${formatSigned(bonus)}` };
    }
    return { expected: 0, formula: "ダメージなし" };
  }

  function calculateEnemyActionBaseDamage(option, pcDefenseValue) {
    if (!option) return { raw: 0, afterDefense: 0, formula: "-" };
    if (option.type === "enemy-spell" && option.rate > 0) {
      const raw = calculatePowerTableBaseExpected(option.rate) + toAnalysisNumber(option.add, 0) * (35 / 36);
      return { raw, afterDefense: raw, formula: `K${option.rate}${formatSigned(option.add)}` };
    }
    const dice = calculateDiceExpressionExpected(option.damageExpr, option.damageDice, option.damageBonus);
    const useDefense = /物理/.test(option.damageType || "");
    const afterDefense = Math.max(0, dice.expected - (useDefense ? Math.max(0, pcDefenseValue) : 0));
    return { raw: dice.expected, afterDefense, formula: dice.formula };
  }

  function calculateDefenseActionMetrics(option, charData, totals, settings = getCharAnalysisSettings()) {
    if (!option) return null;
    const defense = charData.defense;
    const reactive = getDefenseReactiveInfo(option, defense, totals);
    const pcDef = defense.def + toAnalysisNumber(totals.def, 0);
    const baseDamage = calculateEnemyActionBaseDamage(option, pcDef);
    const enemySuccessRate = reactive.autoFail
      ? 1
      : (isFiniteAnalysisNumber(option.activeBase) && isFiniteAnalysisNumber(reactive.value)
        ? calculateOpposedSuccessRateWithSettings(option.activeBase, reactive.value, settings)
        : 1);
    const pcSuccessRate = reactive.autoFail ? 0 : (enemySuccessRate === null ? null : 1 - enemySuccessRate);
    let successDamage = baseDamage.afterDefense;
    if (/消滅/.test(option.result || "")) successDamage = 0;
    else if (/半減/.test(option.result || "")) successDamage = baseDamage.afterDefense * 0.5;
    const failDamage = baseDamage.afterDefense;
    const expectedDamage = pcSuccessRate === null ? failDamage : (pcSuccessRate * successDamage) + ((1 - pcSuccessRate) * failDamage);
    const hp = toAnalysisNumber(defense.hp, 0);
    return {
      reactive,
      baseDamage,
      pcSuccessRate,
      enemySuccessRate,
      successDamage,
      failDamage,
      expectedDamage,
      expectedHp: hp - expectedDamage,
      grade: gradeFromRate(pcSuccessRate),
    };
  }

  function renderDefenseModeVisibleStats(charData, totals) {
    const defense = charData?.defense || {};
    const defDelta = toAnalysisNumber(totals.def, 0);
    const evaDelta = toAnalysisNumber(totals.eva, 0);
    const activeDef = toAnalysisNumber(defense.def, 0) + defDelta;
    const activeEva = toAnalysisNumber(defense.eva, 0) + evaDelta;
    const activeEffects = [];
    if (evaDelta) activeEffects.push(`回避${formatSigned(evaDelta)}`);
    if (defDelta) activeEffects.push(`防護点${formatSigned(defDelta)}`);
    const effectText = activeEffects.length ? activeEffects.join(" / ") : "適用なし";
    const defClass = defDelta ? " is-boosted" : "";
    const evaClass = evaDelta ? " is-boosted" : "";
    return `<section class="analysis-defense-visible-card" aria-label="現在の防御情報">
      <div class="analysis-defense-visible-head">
        <h4>現在の防御情報</h4>
        <span>${escapeAnalysisHtml(effectText)}</span>
      </div>
      <dl class="analysis-defense-visible-grid">
        <div class="${evaClass}"><dt>回避</dt><dd>${escapeAnalysisHtml(formatAnalysisChanged(defense.eva, evaDelta))}</dd></div>
        <div class="${defClass}"><dt>防護点</dt><dd>${escapeAnalysisHtml(formatAnalysisChanged(defense.def, defDelta, { signed: false }))}</dd></div>
        <div><dt>生命抵抗</dt><dd>${escapeAnalysisHtml(formatSigned(defense.vitRes))}</dd></div>
        <div><dt>精神抵抗</dt><dd>${escapeAnalysisHtml(formatSigned(defense.mndRes))}</dd></div>
        <div><dt>HP</dt><dd>${escapeAnalysisHtml(defense.hp)}</dd></div>
        <div><dt>MP</dt><dd>${escapeAnalysisHtml(defense.mp)}</dd></div>
      </dl>
      <p class="analysis-defense-visible-note">バークメイルなどの防護点補正は、ここに反映した値で被ダメージ計算に使います。</p>
    </section>`;
  }

  function renderDefenseAnalysisAdjusted(charData, totals, actionOptions = []) {
    const selected = actionOptions.find((option) => option.id === charAnalysisSelectedAttackId) || actionOptions[0];
    const metrics = selected ? calculateDefenseActionMetrics(selected, charData, totals) : null;
    if (!selected || !metrics) return `<p class="muted">敵攻撃方法候補を選択してください。敵シートを読み込むと防御結果を表示します。</p>`;
    const centerClass = `analysis-match-summary match-rank-${metrics.grade.className}`;
    const successLabel = /回避/.test(metrics.reactive.label) ? "回避成功率" : (/抵抗/.test(metrics.reactive.label) ? "抵抗成功率" : "防御成功率");
    const selectedDetail = `<dl class="analysis-definition-list compact analysis-attack-detail-list">
      <div class="analysis-detail-type"><dt>敵行動</dt><dd>${escapeAnalysisHtml(selected.name)}</dd></div>
      <div class="analysis-detail-chip"><dt>対抗</dt><dd>${escapeAnalysisHtml(metrics.reactive.label)}</dd></div>
      <div class="analysis-detail-chip"><dt>結果</dt><dd>${escapeAnalysisHtml(getCompactResistanceText(selected.result))}</dd></div>
      <div class="analysis-detail-chip"><dt>射程/対象</dt><dd>${escapeAnalysisHtml([selected.range, selected.target].filter(Boolean).join(" / ") || "-")}</dd></div>
      <div class="analysis-detail-chip"><dt>ダメージ</dt><dd>${escapeAnalysisHtml(`${metrics.baseDamage.formula} ${selected.damageType || ""}`)}</dd></div>
    </dl>`;
    return `<div class="analysis-plan-layout analysis-defense-plan-layout">
      <div class="analysis-plan-left">
        <div class="${centerClass}">
          <div class="analysis-match-side analysis-match-self">
            <div class="analysis-match-label">冒険者</div>
            <div class="analysis-match-main"><span class="analysis-match-main-label">${escapeAnalysisHtml(metrics.reactive.label)}</span><strong>${escapeAnalysisHtml(metrics.reactive.autoFail ? "不可" : `2D${formatSigned(metrics.reactive.value)}`)}</strong></div>
            <div class="analysis-match-statline">${formatAnalysisStatChip("防護", charData.defense.def + toAnalysisNumber(totals.def, 0))}${formatAnalysisStatChip("HP", charData.defense.hp)}</div>
            <div class="analysis-match-ribbon">成功時 ${formatDecimal(metrics.successDamage)} / 失敗時 ${formatDecimal(metrics.failDamage)} / 残HP期待 ${formatDecimal(metrics.expectedHp)}</div>
          </div>
          <div class="analysis-match-center">
            <div class="analysis-match-result-head"><div class="analysis-match-judgement">${escapeAnalysisHtml(metrics.grade.label)}</div><span class="analysis-match-rate"><b>${escapeAnalysisHtml(formatPercent(metrics.pcSuccessRate))}</b><small>${escapeAnalysisHtml(successLabel)}</small></span></div>
            <div class="analysis-match-spark" aria-hidden="true"></div>
            <div class="analysis-match-center-values"><span class="analysis-match-dpr"><b>${escapeAnalysisHtml(formatDecimal(metrics.expectedDamage))}</b><small>被ダメージ/R</small></span></div>
          </div>
          <div class="analysis-match-side analysis-match-enemy">
            <div class="analysis-match-label">敵</div>
            <div class="analysis-match-main"><span class="analysis-match-main-label">達成値</span><strong>${escapeAnalysisHtml(selected.activeBase === "必中" ? "必中" : `2D${formatSigned(selected.activeBase)}`)}</strong></div>
            <div class="analysis-match-statline">${formatAnalysisStatChip("ダメージ", `${metrics.baseDamage.formula} ${selected.damageType || ""}`)}${formatAnalysisStatChip("部位", selected.part || "共通")}</div>
            <div class="analysis-match-ribbon enemy">${escapeAnalysisHtml(selected.name)}</div>
          </div>
        </div>
        ${selectedDetail}
        ${renderDefenseModeVisibleStats(charData, totals)}
      </div>
    </div>`;
  }

  function renderAnalysisAdjusted(charData, totals, selectedEffects, attackOptions = [], declarationFeats = [], selectedDeclarations = [], declarationLimit = { limit: 1, reasons: [] }) {
    const supportTotals = calculateCharAnalysisTotals(selectedEffects, []);
    const baseAttackOptions = buildCharAnalysisAttackOptions(charData, charAnalysisCurrent?.attackSpells || [], supportTotals);
    const baseSettings = getCharAnalysisSettings();
    const actionPlanResultHtml = renderCharAnalysisActionPlanResult(charData, baseAttackOptions, declarationFeats, declarationLimit, baseSettings);
    return `<div class="analysis-plan-layout">
      <div class="analysis-plan-left">
        ${actionPlanResultHtml}
      </div>
    </div>`;
  }

  function analysisKpi(label, value) {
    return `<div class="analysis-kpi"><span>${escapeAnalysisHtml(label)}</span><strong>${escapeAnalysisHtml(value)}</strong></div>`;
  }

  function formatSigned(value) {
    const num = toAnalysisNumber(value, 0);
    return num >= 0 ? `+${num}` : `${num}`;
  }

  function buildCharAnalysisCopyText(charData, attackSpells, supportEffects, totals, selectedEffects) {
    const skills = Object.entries(charData.skills)
      .sort((a, b) => b[1].level - a[1].level)
      .map(([name, skill]) => `${name}${skill.level}`)
      .join(" / ") || "なし";
    const weaponLines = charData.weapons.map((weapon) => `- ${weapon.name}: 命中 ${formatSigned(weapon.acc)} -> ${formatSigned(weapon.acc + totals.hit)} / k${weapon.rate} C${weapon.crit} ${formatSigned(weapon.dmg)} -> ${formatSigned(weapon.dmg + totals.damage)}`);
    const spellLines = attackSpells.slice(0, 30).map((spell) => `- ${spell.name} / ${spell.skill} Lv${spell.level} / k${spell.k} / 魔力${formatSigned(spell.magicPower)} / ${spell.attribute} / ${spell.resist} / ${spell.range}`);
    const selectedDeclarations = (charAnalysisCurrent?.declarationFeats || []).filter((feat) => charAnalysisSelectedDeclarationIds.has(feat.id));
    const effectLines = selectedEffects.map((effect) => `- ${effect.name}: ${effect.bonuses.map((bonus) => `${bonus.label}${formatSigned(bonus.value)}${bonus.uncertain ? "候補" : ""}`).join("、")}`);
    const declarationLines = selectedDeclarations.map((feat) => `- ${feat.name}: ${formatDeclarationBonusText(feat.bonuses, feat.risks || [])}${feat.notes?.length ? `（${feat.notes.join("、")}）` : ""}`);
    return [
      `【キャラシ分析】${charData.name}`,
      `種族: ${charData.race} / レベル: ${charData.level}`,
      `技能: ${skills}`,
      `防御: 回避${formatSigned(charData.defense.eva)} -> ${formatSigned(charData.defense.eva + totals.eva)} / 防護点${charData.defense.def} -> ${charData.defense.def + totals.def} / HP${charData.defense.hp} / MP${charData.defense.mp}`,
      "",
      "■武器攻撃",
      ...(weaponLines.length ? weaponLines : ["- なし"]),
      "",
      "■攻撃魔法候補",
      ...(spellLines.length ? spellLines : ["- なし"]),
      "",
      "■適用中の補助効果",
      ...(effectLines.length ? effectLines : ["- なし"]),
      "",
      "■適用中の宣言特技",
      ...(declarationLines.length ? declarationLines : ["- なし"]),
      "",
      "※CSV効果概要からの概算候補です。飛行系・筋力ボーナス等は要確認。",
    ].join("\n");
  }

  function runCharAnalysis() {
    try {
      if (!charAnalysisCsvRows.length) {
        setCharAnalysisStatus("CSVが未読み込みです。data/SW_特技魔法.csv の配置を確認してください。", "error");
      }
      const rawData = parseCharAnalysisJson(charAnalysisRawText);
      const charData = extractCharAnalysisData(rawData);
      const usableRows = findCharAnalysisUsableRows(charData);
      const attackSpells = extractCharAnalysisAttackSpells(charData, usableRows);
      const supportEffects = [
        ...extractCharAnalysisAlchemyEffects(charData),
        ...extractCharAnalysisSupportEffects(usableRows),
      ];
      const declarationFeats = extractCharAnalysisDeclarationFeats(charData);
      const declarationLimit = getCharAnalysisDeclarationLimit(charData);
      charAnalysisSelectedEffectIds = new Set();
      charAnalysisSelectedDeclarationIds = new Set();
      charAnalysisSelectedAttackId = "";
      charAnalysisManualAdjust = createCharAnalysisManualAdjust();
      charAnalysisAlchemySettings = createCharAnalysisAlchemySettings();
      charAnalysisSimulationNonce = 0;
      charAnalysisSettingsOpen = false;
      charAnalysisActionPlan = createCharAnalysisActionPlan();
      charAnalysisCurrent = { charData, usableRows, attackSpells, supportEffects, declarationFeats, declarationLimit };
      renderCharAnalysis();
      setCharAnalysisStatus(`分析完了: 攻撃魔法候補 ${attackSpells.length}件、補助効果候補 ${supportEffects.length}件、宣言特技候補 ${declarationFeats.length}件。`, "success");
      showToast("キャラシ分析を実行しました！");
    } catch (error) {
      charAnalysisCurrent = null;
      setCharAnalysisResultsVisible(false);
      console.error("キャラシ分析エラー:", error);
      setCharAnalysisStatus(`分析に失敗しました: ${error.message}`, "error");
      showToast("キャラシ分析に失敗しました。JSON形式を確認してください。");
    }
  }


  function preserveAnalysisScroll(callback) {
    const panel = document.querySelector(".controls-panel");
    const windowX = window.scrollX;
    const windowY = window.scrollY;
    const panelScroll = panel ? panel.scrollTop : null;
    callback();
    if (panel && panelScroll !== null) panel.scrollTop = panelScroll;
    window.scrollTo(windowX, windowY);
  }

  function commitAnalysisManualInput(manualInput, options = {}) {
    const key = manualInput?.dataset?.manualKey;
    if (!key || !Object.prototype.hasOwnProperty.call(charAnalysisManualAdjust, key)) return;
    charAnalysisManualAdjust[key] = key.endsWith("Abs") ? String(manualInput.value || "").trim() : toAnalysisNumber(manualInput.value, 0);
    if (!charAnalysisCurrent) return;
    const selector = `.char-analysis-manual-input[data-manual-key="${CSS.escape(key)}"]`;
    preserveAnalysisScroll(() => renderCharAnalysis());
    if (options.refocus) {
      requestAnimationFrame(() => {
        const next = document.querySelector(selector);
        if (next) {
          next.focus({ preventScroll: true });
          try { next.select(); } catch (_) {}
        }
      });
    }
  }

  function renderCharAnalysisAndRestoreSelect(select, callback) {
    const selector = select?.classList?.contains("char-analysis-action-slot-declaration-select")
      ? `.char-analysis-action-slot-declaration-select[data-slot="${CSS.escape(select.dataset.slot || "")}"][data-declaration-index="${CSS.escape(select.dataset.declarationIndex || "0")}"]`
      : select?.classList?.contains("char-analysis-action-slot-bullet-select")
        ? `.char-analysis-action-slot-bullet-select[data-slot="${CSS.escape(select.dataset.slot || "")}"]`
        : `.char-analysis-action-slot-select[data-slot="${CSS.escape(select?.dataset?.slot || "")}"]`;
    preserveAnalysisScroll(() => {
      callback?.();
      renderCharAnalysis();
    });
    requestAnimationFrame(() => {
      const next = document.querySelector(selector);
      if (next) next.focus({ preventScroll: true });
    });
  }



  function commitCharAnalysisTargetCountInput(targetCountInput, options = {}) {
    const slot = targetCountInput?.dataset?.slot || "";
    if (!slot) return;
    const maxTargets = Math.max(1, Math.min(99, Math.trunc(toAnalysisNumber(targetCountInput.dataset.targetMax, 99)) || 99));
    const value = Math.max(1, Math.min(maxTargets, Math.trunc(toAnalysisNumber(targetCountInput.value, 1)) || 1));
    if (!charAnalysisActionPlan.slotTargetCounts || typeof charAnalysisActionPlan.slotTargetCounts !== "object") charAnalysisActionPlan.slotTargetCounts = {};
    charAnalysisActionPlan.slotTargetCounts[slot] = value;
    targetCountInput.value = String(value);
    if (!options.render) return;
    const selector = `.char-analysis-action-target-count[data-slot="${CSS.escape(slot)}"]`;
    preserveAnalysisScroll(() => renderCharAnalysis());
    requestAnimationFrame(() => {
      const next = document.querySelector(selector);
      if (next) {
        next.focus({ preventScroll: true });
        try { next.select(); } catch (_) {}
      }
    });
  }

  function commitAnalysisSlotManualInput(manualInput, options = {}) {
    const slot = manualInput?.dataset?.slot || "";
    const key = manualInput?.dataset?.manualKey || "";
    if (!slot || !key) return;
    const manual = getCharAnalysisSlotManualAdjust(slot);
    if (!Object.prototype.hasOwnProperty.call(manual, key)) return;
    manual[key] = key.endsWith("Abs") ? String(manualInput.value || "").trim() : toAnalysisNumber(manualInput.value, 0);
    charAnalysisActionPlan.slotManualAdjusts[slot] = manual;
    if (!charAnalysisCurrent) return;
    const selector = `.char-analysis-slot-manual-input[data-slot="${CSS.escape(slot)}"][data-manual-key="${CSS.escape(key)}"]`;
    preserveAnalysisScroll(() => renderCharAnalysis());
    if (options.refocus) {
      requestAnimationFrame(() => {
        const next = document.querySelector(selector);
        if (next) {
          next.focus({ preventScroll: true });
          try { next.select(); } catch (_) {}
        }
      });
    }
  }

  function setupCharAnalysisEventListeners() {
    const els = getCharAnalysisElements();
    const manualKeyBlocker = (event) => {
      const manualInput = event.target?.closest?.(".char-analysis-manual-input, .char-analysis-slot-manual-input");
      if (!manualInput || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      const step = toAnalysisNumber(manualInput.step || 1, 1) || 1;
      const direction = event.key === "ArrowUp" ? 1 : -1;
      manualInput.value = String(toAnalysisNumber(manualInput.value, 0) + (step * direction));
      if (manualInput.classList.contains("char-analysis-slot-manual-input")) commitAnalysisSlotManualInput(manualInput, { refocus: true });
      else commitAnalysisManualInput(manualInput, { refocus: true });
    };
    document.addEventListener("keydown", manualKeyBlocker, true);
    if (els.load) els.load.addEventListener("click", loadCharAnalysisFromUrl);
    if (els.enemyLoad) els.enemyLoad.addEventListener("click", loadEnemyAnalysisFromUrl);
    if (els.enemyUrl) {
      els.enemyUrl.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          loadEnemyAnalysisFromUrl();
        }
      });
    }
    if (els.enemyPart) {
      els.enemyPart.addEventListener("change", () => {
        const index = Math.min(Math.max(0, toAnalysisNumber(els.enemyPart.value, 0)), Math.max(0, charAnalysisEnemyParts.length - 1));
        charAnalysisSelectedEnemyPartIndex = index;
        applyEnemyPartToAnalysis(charAnalysisEnemyParts[index]);
        renderEnemyPartSelector(charAnalysisEnemyParts, index);
        renderEnemyActionsSummary(charAnalysisEnemyActions);
        if (charAnalysisCurrent) renderCharAnalysis();
      });
    }
    if (els.url) {
      els.url.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          loadCharAnalysisFromUrl();
        }
      });
    }
    if (els.run) els.run.addEventListener("click", runCharAnalysis);
    if (els.copy) {
      els.copy.addEventListener("click", () => {
        if (!charAnalysisCurrent) {
          showToast("コピーできる分析結果がありません。");
          return;
        }
        const selectedEffects = charAnalysisCurrent.supportEffects.filter((effect) => effect.auto || charAnalysisSelectedEffectIds.has(effect.id));
        const selectedDeclarations = (charAnalysisCurrent.declarationFeats || []).filter((feat) => charAnalysisSelectedDeclarationIds.has(feat.id));
        const totals = calculateCharAnalysisTotals(selectedEffects, selectedDeclarations);
        const text = buildCharAnalysisCopyText(charAnalysisCurrent.charData, charAnalysisCurrent.attackSpells, charAnalysisCurrent.supportEffects, totals, selectedEffects);
        navigator.clipboard.writeText(text).then(() => showToast("分析結果をコピーしました！"));
      });
    }
    if (els.adjusted) {
      els.adjusted.addEventListener("change", (event) => {
        const declarationInput = event.target.closest(".char-analysis-declaration-check");
        if (declarationInput) {
          const id = declarationInput.dataset.declarationId || "";
          const feats = charAnalysisCurrent?.declarationFeats || [];
          const feat = feats.find((item) => item.id === id);
          if (declarationInput.checked) {
            const selectedNow = feats.filter((item) => charAnalysisSelectedDeclarationIds.has(item.id));
            const validation = canAddCharAnalysisDeclaration(feat, selectedNow, charAnalysisCurrent?.declarationLimit || { totalLimit: 1 });
            if (!validation.ok) {
              declarationInput.checked = false;
              showToast(validation.message || "宣言特技の上限を超えています。");
              return;
            }
            charAnalysisSelectedDeclarationIds.add(id);
          } else {
            charAnalysisSelectedDeclarationIds.delete(id);
          }
          renderCharAnalysis();
          return;
        }
        const compactToggle = event.target.closest(".char-analysis-match-compact-toggle");
        if (compactToggle) {
          charAnalysisActionPlan.matchCompact = Boolean(compactToggle.checked);
          renderCharAnalysis();
          return;
        }
        const targetCountInput = event.target.closest(".char-analysis-action-target-count");
        if (targetCountInput) {
          const slot = targetCountInput.dataset.slot || "";
          if (slot) {
            commitCharAnalysisTargetCountInput(targetCountInput, { render: true });
          }
          return;
        }
        const manualMode = event.target.closest("#char-analysis-manual-mode");
        if (manualMode) {
          charAnalysisManualAdjust.mode = manualMode.value === "absolute" ? "absolute" : "relative";
          renderCharAnalysis({ preserveAttackSelection: true });
          return;
        }
        const manualInput = event.target.closest(".char-analysis-manual-input");
        if (manualInput) {
          const key = manualInput.dataset.manualKey;
          if (key && Object.prototype.hasOwnProperty.call(charAnalysisManualAdjust, key)) {
            commitAnalysisManualInput(manualInput);
          }
          return;
        }
        const select = event.target.closest("#char-analysis-attack-select");
        if (!select) return;
        charAnalysisSelectedAttackId = select.value;
        charAnalysisActionPlan.slotAttackIds.main = select.value;
        charAnalysisManualAdjust = createCharAnalysisManualAdjust();
        renderCharAnalysis();
      });
      els.adjusted.addEventListener("keydown", (event) => {
        const manualInput = event.target.closest(".char-analysis-manual-input");
        if (manualInput && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (event.target.closest("#char-analysis-attack-select")) {
          event.stopPropagation();
        }
      });
    }
    if (els.weapons) {
      els.weapons.addEventListener("change", (event) => {
        const compactToggle = event.target.closest(".char-analysis-match-compact-toggle");
        if (compactToggle) {
          charAnalysisActionPlan.matchCompact = Boolean(compactToggle.checked);
          renderCharAnalysis();
          return;
        }
        const targetCountInput = event.target.closest(".char-analysis-action-target-count");
        if (targetCountInput) {
          const slot = targetCountInput.dataset.slot || "";
          if (slot) {
            commitCharAnalysisTargetCountInput(targetCountInput, { render: true });
          }
          return;
        }
        const actionToggle = event.target.closest(".char-analysis-action-toggle");
        if (actionToggle) {
          const action = actionToggle.dataset.action;
          if (action && Object.prototype.hasOwnProperty.call(charAnalysisActionPlan, action)) {
            charAnalysisActionPlan[action] = Boolean(actionToggle.checked);
            renderCharAnalysis();
          }
          return;
        }
        const actionSlotSelect = event.target.closest(".char-analysis-action-slot-select");
        if (actionSlotSelect) {
          const slot = actionSlotSelect.dataset.slot;
          if (slot) {
            renderCharAnalysisAndRestoreSelect(actionSlotSelect, () => {
              charAnalysisActionPlan.slotAttackIds[slot] = actionSlotSelect.value;
              if (charAnalysisActionPlan.slotTargetCounts && Object.prototype.hasOwnProperty.call(charAnalysisActionPlan.slotTargetCounts, slot)) delete charAnalysisActionPlan.slotTargetCounts[slot];
            });
          }
          return;
        }
        const actionSlotBulletSelect = event.target.closest(".char-analysis-action-slot-bullet-select");
        if (actionSlotBulletSelect) {
          const slot = actionSlotBulletSelect.dataset.slot;
          if (slot) {
            renderCharAnalysisAndRestoreSelect(actionSlotBulletSelect, () => {
              if (!charAnalysisActionPlan.slotBulletIds || typeof charAnalysisActionPlan.slotBulletIds !== "object") charAnalysisActionPlan.slotBulletIds = {};
              charAnalysisActionPlan.slotBulletIds[slot] = actionSlotBulletSelect.value;
              if (charAnalysisActionPlan.slotTargetCounts && Object.prototype.hasOwnProperty.call(charAnalysisActionPlan.slotTargetCounts, slot)) delete charAnalysisActionPlan.slotTargetCounts[slot];
            });
          }
          return;
        }
        const actionSlotDeclarationSelect = event.target.closest(".char-analysis-action-slot-declaration-select");
        if (actionSlotDeclarationSelect) {
          const slot = actionSlotDeclarationSelect.dataset.slot || "";
          const index = Math.max(0, Number.parseInt(actionSlotDeclarationSelect.dataset.declarationIndex || "0", 10) || 0);
          const id = actionSlotDeclarationSelect.value || "";
          const feats = charAnalysisCurrent?.declarationFeats || [];
          const oldIds = getCharAnalysisSlotDeclarationIds(slot);
          const nextIds = oldIds.slice();
          if (id) nextIds[index] = id;
          else nextIds.splice(index, 1);
          const normalizedIds = nextIds.filter(Boolean);
          if (new Set(normalizedIds).size !== normalizedIds.length) {
            showToast("同じ攻撃枠では同じ宣言を重複指定できません。");
            renderCharAnalysis();
            return;
          }
          const oldSlotIds = charAnalysisActionPlan.slotDeclarationIds[slot] || [];
          charAnalysisActionPlan.slotDeclarationIds[slot] = normalizedIds;
          const attackOptions = buildCharAnalysisAttackOptions(charAnalysisCurrent?.charData || {}, charAnalysisCurrent?.attackSpells || [], calculateCharAnalysisTotals((charAnalysisCurrent?.supportEffects || []).filter((effect) => effect.auto || charAnalysisSelectedEffectIds.has(effect.id)), []));
          const validation = validateCharAnalysisActionPlanDeclarationSelection(charAnalysisCurrent?.charData, feats, charAnalysisCurrent?.declarationLimit || { totalLimit: 1 }, attackOptions);
          if (!validation.ok) {
            charAnalysisActionPlan.slotDeclarationIds[slot] = oldSlotIds;
            showToast(validation.message || "宣言特技の上限を超えています。");
            renderCharAnalysis();
            return;
          }
          renderCharAnalysisAndRestoreSelect(actionSlotDeclarationSelect);
          return;
        }
        const declarationInput = event.target.closest(".char-analysis-declaration-check");
        if (declarationInput) {
          const id = declarationInput.dataset.declarationId || "";
          const feats = charAnalysisCurrent?.declarationFeats || [];
          const feat = feats.find((item) => item.id === id);
          if (declarationInput.checked) {
            const selectedNow = feats.filter((item) => charAnalysisSelectedDeclarationIds.has(item.id));
            const validation = canAddCharAnalysisDeclaration(feat, selectedNow, charAnalysisCurrent?.declarationLimit || { totalLimit: 1 });
            if (!validation.ok) {
              declarationInput.checked = false;
              showToast(validation.message || "宣言特技の上限を超えています。");
              return;
            }
            charAnalysisSelectedDeclarationIds.add(id);
          } else {
            charAnalysisSelectedDeclarationIds.delete(id);
          }
          renderCharAnalysis();
          return;
        }
        const slotManualInput = event.target.closest(".char-analysis-slot-manual-input");
        if (slotManualInput) {
          commitAnalysisSlotManualInput(slotManualInput);
          return;
        }
        const manualInput = event.target.closest(".char-analysis-manual-input");
        if (manualInput) {
          const key = manualInput.dataset.manualKey;
          if (key && Object.prototype.hasOwnProperty.call(charAnalysisManualAdjust, key)) commitAnalysisManualInput(manualInput);
          return;
        }
        const select = event.target.closest("#char-analysis-attack-select");
        if (!select) return;
        charAnalysisSelectedAttackId = select.value;
        charAnalysisActionPlan.slotAttackIds.main = select.value;
        charAnalysisManualAdjust = createCharAnalysisManualAdjust();
        renderCharAnalysis();
      });
      els.weapons.addEventListener("keydown", (event) => {
        const targetCountInput = event.target.closest(".char-analysis-action-target-count");
        if (targetCountInput && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
          event.preventDefault();
          event.stopPropagation();
          const maxTargets = Math.max(1, Math.min(99, Math.trunc(toAnalysisNumber(targetCountInput.dataset.targetMax, 99)) || 99));
          const current = Math.max(1, Math.min(maxTargets, Math.trunc(toAnalysisNumber(targetCountInput.value, 1)) || 1));
          const next = Math.max(1, Math.min(maxTargets, current + (event.key === "ArrowUp" ? 1 : -1)));
          targetCountInput.value = String(next);
          commitCharAnalysisTargetCountInput(targetCountInput, { render: true });
          return;
        }
        const manualInput = event.target.closest(".char-analysis-manual-input");
        if (manualInput && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (event.target.closest("#char-analysis-attack-select, .char-analysis-action-slot-select, .char-analysis-action-slot-bullet-select, .char-analysis-action-slot-declaration-select")) event.stopPropagation();
      });
      els.weapons.addEventListener("click", (event) => {
        const weaponButton = event.target.closest("[data-analysis-attack-id]");
        if (!weaponButton) return;
        charAnalysisSelectedAttackId = weaponButton.dataset.analysisAttackId || "";
        charAnalysisManualAdjust = createCharAnalysisManualAdjust();
        renderCharAnalysis();
      });
    }
    if (els.effects) {
      els.effects.addEventListener("change", (event) => {
        const rankSelect = event.target.closest(".char-analysis-alchemy-rank-select");
        if (rankSelect) {
          setCharAnalysisAlchemyRank(rankSelect.dataset.alchemyEffect, rankSelect.value);
          renderCharAnalysis();
          return;
        }
        const checkbox = event.target.closest(".char-analysis-effect-check");
        if (!checkbox) return;
        if (checkbox.disabled) return;
        if (checkbox.checked) charAnalysisSelectedEffectIds.add(checkbox.dataset.effectId);
        else charAnalysisSelectedEffectIds.delete(checkbox.dataset.effectId);
        renderCharAnalysis();
      });
    }
    if (els.overview) {
      els.overview.addEventListener("input", (event) => {
        const input = event.target.closest("[data-portrait-control]");
        if (!input) return;
        updateAnalysisPortraitTuner(input.closest("[data-analysis-portrait-tuner]"));
      });
      els.overview.addEventListener("click", (event) => {
        const button = event.target.closest("[data-portrait-compare-load]");
        if (!button) return;
        loadAnalysisPortraitCompare(button.closest("[data-analysis-portrait-tuner]"));
      });
    }
    const settingsSelector = "#char-analysis-battle-mode, #char-analysis-mode, #char-analysis-profile, #char-analysis-target-defense-mode, #char-analysis-target-defense-toggle, #char-analysis-rounds, #char-analysis-trials, #char-analysis-crit-disabled, #char-analysis-check-certainty, #char-analysis-power-certainty, #char-analysis-dice-first-mode, #char-analysis-dice-first-value, #char-analysis-dice-repeat-bonus, #char-analysis-power-rate-step, .char-analysis-alchemy-rank-select, #char-analysis-enemy-eva, #char-analysis-enemy-def, #char-analysis-enemy-hp, #char-analysis-enemy-hit, #char-analysis-enemy-damage, #char-analysis-enemy-vit, #char-analysis-enemy-mnd, #char-analysis-enemy-knowledge, #char-analysis-enemy-weakness-value, #char-analysis-enemy-initiative-target, #char-analysis-enemy-weakness-text";
    const analysisPanel = document.getElementById("panel-character-analysis");
    const scheduleCharAnalysisRender = (delay = 0) => {
      if (!charAnalysisCurrent) return;
      if (charAnalysisRenderTimer) window.clearTimeout(charAnalysisRenderTimer);
      charAnalysisRenderTimer = window.setTimeout(() => {
        charAnalysisRenderTimer = null;
        renderCharAnalysis();
      }, delay);
    };
    const handleAnalysisSettingChange = (event) => {
      const settingControl = event.target.closest(settingsSelector);
      if (!settingControl) return;
      if (settingControl.matches("#char-analysis-battle-mode")) updateCharAnalysisBattleModeUi();

      // switch型チェックボックスはON/OFF直後にDOMを再描画すると、
      // style.css側のノブ移動transitionが始まる前に要素が差し替わってしまう。
      // そのため、スイッチだけ少し待ってから結果を再計算する。
      const isAnimatedSwitch =
        settingControl.matches('input[type="checkbox"].switch') ||
        event.target.matches?.('input[type="checkbox"].switch');
      scheduleCharAnalysisRender(isAnimatedSwitch ? 230 : 0);
    };
    if (analysisPanel) {
      analysisPanel.addEventListener("click", (event) => {
      const simulateButton = event.target.closest("#char-analysis-simulate-btn");
      if (simulateButton) {
        event.preventDefault();
        charAnalysisSimulationNonce += 1;
        if (charAnalysisCurrent) renderCharAnalysis();
        return;
      }
      });
      analysisPanel.addEventListener("change", handleAnalysisSettingChange);
      analysisPanel.addEventListener("input", handleAnalysisSettingChange);
    }
  }

  function initializeAnalysisPortraitNaturalProbe(root, image) {
    if (!root || !image?.url) return;
    const tuner = root.querySelector("[data-analysis-portrait-tuner]");
    if (!tuner) return;
    const sourcePercent = clampAnalysisNumber(image.percent, 50, 400);
    const sourceX = clampAnalysisNumber(image.positionX, 0, 100);
    const sourceY = clampAnalysisNumber(image.positionY, 0, 100);
    const hasSheetCropPreference = sourcePercent !== 100 || sourceX !== 50 || sourceY !== 50;
    if (hasSheetCropPreference) return;
    const probe = new Image();
    probe.onload = () => {
      const fit = String(image.fit || "").toLowerCase();
      if (fit.includes("percentx") || fit.includes("percenty")) return;
      const preset = getAnalysisPortraitPresetFromDimensions(probe.naturalWidth, probe.naturalHeight, image);
      if (!preset || preset.kind === tuner.dataset.portraitKind) return;
      applyAnalysisPortraitPreset(tuner, preset);
    };
    probe.onerror = () => {};
    probe.src = image.url;
  }

  function applyAnalysisPortraitPreset(tuner, preset) {
    if (!tuner || !preset) return;
    tuner.dataset.portraitKind = preset.kind;
    tuner.querySelectorAll(".analysis-portrait-banner").forEach((banner) => {
      [...banner.classList].forEach((className) => {
        if (
          className.startsWith("analysis-portrait-") &&
          className !== "analysis-portrait-banner" &&
          className !== "analysis-portrait-compare-banner"
        ) {
          banner.classList.remove(className);
        }
      });
      banner.classList.add(`analysis-portrait-${preset.kind}`);
    });
    const kindLabel = tuner.querySelector(".analysis-portrait-kind");
    if (kindLabel) kindLabel.textContent = `推定: ${preset.label}`;
    Object.entries(preset).forEach(([key, value]) => {
      if (key === "kind" || key === "label") return;
      const input = tuner.querySelector(`[data-portrait-control="${key}"]`);
      if (!input) return;
      input.value = value;
      const output = input.parentElement?.querySelector("output");
      if (output) output.textContent = String(value);
    });
    updateAnalysisPortraitTuner(tuner);
  }

  function updateAnalysisPortraitTuner(tuner) {
    if (!tuner) return;
    const banners = tuner.querySelectorAll(".analysis-portrait-banner");
    if (!banners.length) return;
    const kind = tuner.dataset.portraitKind || "custom";
    const values = {
      xBase: 50,
      xRatio: 0.85,
      yBase: 22,
      yRatio: 0.45,
      scaleInfluence: 0.45,
      scaleMultiplier: 0.5,
      height: 110,
    };
    tuner.querySelectorAll("[data-portrait-control]").forEach((input) => {
      const key = input.dataset.portraitControl;
      if (!Object.prototype.hasOwnProperty.call(values, key)) return;
      values[key] = toAnalysisNumber(input.value, values[key]);
      const output = input.parentElement?.querySelector("output");
      if (output) output.textContent = String(values[key]);
    });
    const sourceX = toAnalysisNumber(tuner.dataset.sourceX, 50);
    const sourceY = toAnalysisNumber(tuner.dataset.sourceY, 50);
    const sourcePercent = toAnalysisNumber(tuner.dataset.sourcePercent, 100);
    const finalX = clampAnalysisNumber(values.xBase + ((sourceX - 50) * values.xRatio), 0, 100);
    const rawY = values.yBase + (sourceY * values.yRatio);
    const finalY = clampAnalysisNumber(rawY, 0, 100);
    const finalScale = clampAnalysisNumber((100 + ((sourcePercent - 100) * values.scaleInfluence)) * values.scaleMultiplier * 0.75, 26, 180);
    banners.forEach((banner) => {
      banner.style.setProperty("--analysis-portrait-position", `${finalX}% ${finalY}%`);
      banner.style.setProperty("--analysis-portrait-size", `${finalScale}% auto`);
      banner.style.setProperty("--analysis-portrait-height", `${values.height}px`);
    });
    const summary = tuner.querySelector(".analysis-portrait-tuner-values");
    if (summary) summary.textContent = `決定稿: kind:${kind} xBase:${values.xBase} xRatio:${values.xRatio} yBase:${values.yBase} yRatio:${values.yRatio} scaleInfluence:${values.scaleInfluence} scaleMultiplier:${values.scaleMultiplier} height:${values.height} / final x:${Math.round(finalX)} y:${Math.round(finalY)} scale:${Math.round(finalScale)} rawY:${Math.round(rawY)}`;
  }

  function loadAnalysisPortraitCompare(tuner) {
    if (!tuner) return;
    const input = tuner.querySelector("[data-portrait-compare-url]");
    const banner = tuner.querySelector(".analysis-portrait-compare-banner");
    const rawUrl = input?.value?.trim();
    if (!input || !banner || !rawUrl) return;
    try {
      const imageUrl = buildYtsheetImageUrl(rawUrl);
      banner.style.setProperty("--analysis-portrait-url", `url('${escapeAnalysisCssUrl(imageUrl)}')`);
      banner.classList.remove("is-empty");
      banner.innerHTML = "";
      updateAnalysisPortraitTuner(tuner);
    } catch (error) {
      showToast("比較画像URLの解釈に失敗しました。", "error");
    }
  }

  function buildYtsheetImageUrl(rawUrl) {
    const url = new URL(rawUrl, window.location.href);
    if (/ytsheet\/sw2\.5\//.test(url.pathname) || url.searchParams.has("id")) {
      url.searchParams.set("mode", "image");
    }
    return url.toString();
  }

  function setupEventListeners() {
    const form = document.getElementById("char-sheet-form");
    const enhancementBtn = document.getElementById("toggle-enhancement-btn");
    const enhancementPanel = document.getElementById("enhancement-panel");
    const itemSetsBtn = document.getElementById("toggle-item-sets-btn");
    const itemSetsPanel = document.getElementById("item-sets-panel");
    const recommendedBtn = document.getElementById(
      "toggle-recommended-items-btn",
    );
    const recommendedPanel = document.getElementById("recommended-items-panel");
    const exportGrowthLinesBtn = document.getElementById(
      "export-growth-lines-btn",
    );
    const growthSummaryOutput = document.getElementById(
      "growth-summary-output",
    );

    const getPopupTitle = (panel) => {
      if (!panel) return "メニュー";
      if (panel.id === "enhancement-panel") return "武器/防具強化";
      if (panel.id === "item-sets-panel") return "アイテムセット購入";
      if (panel.id === "recommended-items-panel") return "推奨アイテム";
      return "メニュー";
    };

    const ensurePopupHeader = (panel) => {
      if (!panel || panel.querySelector(":scope > .enhancement-popup-header")) return;
      const header = document.createElement("div");
      header.className = "enhancement-popup-header";

      const title = document.createElement("strong");
      title.className = "enhancement-popup-title";
      title.textContent = getPopupTitle(panel);

      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "enhancement-popup-close";
      closeButton.setAttribute("aria-label", "メニューを閉じる");
      closeButton.textContent = "×";
      closeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        panel.classList.remove("visible");
      });

      header.appendChild(title);
      header.appendChild(closeButton);
      panel.prepend(header);
    };

    [enhancementPanel, itemSetsPanel, recommendedPanel].forEach(ensurePopupHeader);

    const closeVisiblePopups = () => {
      document
        .querySelectorAll(".enhancement-panel-container.visible")
        .forEach((p) => p.classList.remove("visible"));
    };

    const togglePopup = (button, panel) => {
      if (!button || !panel) return;
      ensurePopupHeader(panel);
      if (panel.classList.contains("visible")) {
        panel.classList.remove("visible");
        return;
      }

      closeVisiblePopups();

      const isMobilePopup = window.matchMedia("(max-width: 768px)").matches;
      if (isMobilePopup) {
        panel.style.left = "";
        panel.style.top = "";
        panel.classList.add("visible");
        return;
      }

      const rect = button.getBoundingClientRect();
      const panelWidth = panel.offsetWidth;
      const panelHeight = panel.offsetHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const margin = 10;

      let finalLeft = rect.left;
      if (rect.left + panelWidth > windowWidth) {
        finalLeft = Math.max(margin, windowWidth - panelWidth - margin);
      }

      let finalTop = rect.top;
      if (rect.top + panelHeight > windowHeight) {
        finalTop = windowHeight - panelHeight - margin;
      }
      if (finalTop < 0) {
        finalTop = margin;
      }

      panel.style.left = `${finalLeft}px`;
      panel.style.top = `${finalTop}px`;
      panel.classList.add("visible");
    };

    if (enhancementBtn) {
      enhancementBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePopup(enhancementBtn, enhancementPanel);
      });
    }

    if (itemSetsBtn) {
      itemSetsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePopup(itemSetsBtn, itemSetsPanel);
      });
    }

    if (recommendedBtn) {
      recommendedBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePopup(recommendedBtn, recommendedPanel);
      });
    }

    if (exportGrowthLinesBtn) {
      exportGrowthLinesBtn.addEventListener("click", () => {
        exportGrowthResults("lines");
      });
    }

    if (growthSummaryOutput) {
      growthSummaryOutput.addEventListener("click", () => {
        if (!growthSummaryOutput.value.trim()) return;
        growthSummaryOutput.select();
      });
    }

    if (enhancementPanel) {
      enhancementPanel.addEventListener("click", (e) => {
        if (
          e.target.classList.contains("enhancement-btn") &&
          !e.target.disabled
        ) {
          handleEnhancementButtonClick(e.target);
        }
      });
    }

    document.addEventListener("click", (e) => {
      document
        .querySelectorAll(".enhancement-panel-container.visible")
        .forEach((panel) => {
          let associatedButton;
          if (panel.id === "enhancement-panel")
            associatedButton = enhancementBtn;
          else if (panel.id === "item-sets-panel")
            associatedButton = itemSetsBtn;
          else if (panel.id === "recommended-items-panel")
            associatedButton = recommendedBtn;

          if (
            associatedButton &&
            !panel.contains(e.target) &&
            e.target !== associatedButton
          ) {
            panel.classList.remove("visible");
          }
        });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeVisiblePopups();
    });

    form.addEventListener("click", (event) => {
      const target = event.target;
      // プルダウンメニューのクリックはここで処理しない
      if (target.closest(".dropdown-menu")) return;

      if (
        target === enhancementBtn ||
        target === itemSetsBtn ||
        target === recommendedBtn
      )
        return;

      const addBtn = target.closest(".add-row-btn");
      const removeBtn = target.closest(".remove-row-btn");
      // selectBtn のロジックは新しいプルダウンで置き換えられるため削除
      const copyBtn = target.closest(".copy-btn");
      const copySkillBtn = target.closest(".copy-skill-name-btn");
      const unitBtn = target.closest(".unit-btn");

      if (target.id === "randomize-skill-names-btn") {
        handleRandomizeSkillNames();
        return;
      }
      if (target.id === "randomize-skill-all-btn") {
        handleRandomizeAll();
        return;
      }

      if (addBtn) {
        const templateId = addBtn.dataset.template;
        if (templateId === "template-weapon") addWeaponRow();
        else if (templateId === "template-armour") addArmourRow();
        else if (templateId === "template-item") addItemRow();
        else if (addBtn.id === "add-general-skill-btn") addGeneralSkillRow();
        else if (templateId === "template-personal-data-row")
          addPersonalDataRow();
        else if (addBtn.id === "add-tp-ability-btn") {
          addTpAbilityRow();
        }
        return;
      }
      if (removeBtn) {
        const row = removeBtn.closest(".dynamic-row");
        if (row) {
          const wasTpAbilityRow = row.classList.contains("tp-ability-row");
          row.remove();
          updateAllItems();
          if (row.classList.contains("general-skill-row"))
            updateGeneralSkillTotal();
          if (row.classList.contains("personal-data-row"))
            updatePersonalDataOutput();
          if (wasTpAbilityRow) updateTotalTreasurePoints();
        }
        return;
      }

      if (copyBtn) {
        const id = copyBtn.id;
        if (id === "copy-personal-data-btn")
          navigator.clipboard.writeText(
            document.getElementById("personal-data-output").value,
          );
        if (id === "copy-items-list-btn")
          navigator.clipboard.writeText(
            document.getElementById("items-output").value,
          );
        if (id === "copy-cashbook-btn")
          navigator.clipboard.writeText(
            document.getElementById("cashbook").value,
          );
      }

      if (copySkillBtn) {
        const skillName = copySkillBtn
          .closest(".skill-name-cell")
          .querySelector(".general-skill-select").value;
        if (skillName) navigator.clipboard.writeText(skillName);
      }

      if (unitBtn) {
        const valueInput = unitBtn
          .closest(".personal-data-value-wrapper")
          .querySelector(".personal-data-value");
        valueInput.value += unitBtn.dataset.unit;
        valueInput.dispatchEvent(new Event("input", { bubbles: true }));
        valueInput.focus();
      }
    });

    form.addEventListener("input", (e) => {
      if (
        e.target.matches(
          ".item-magic-check, .item-name-free, .item-unit-price, .item-quantity, .item-effect, .item-points, .weapon-price, .armour-price, .weapon-name-free, .armour-name-free",
        )
      ) {
        updateAllItems();
      }
      if (e.target.matches("#item-folder-toggle, #item-folder-title")) {
        updateAllItems();
      }
      if (e.target.classList.contains("initial-stat-input")) {
        updateAllStatTotals();
      }
      if (e.target.matches(".personal-data-key, .personal-data-value")) {
        updatePersonalDataOutput();
      }
      if (e.target.classList.contains("general-skill-level-slider")) {
        const row = e.target.closest(".general-skill-row");
        const level = e.target.value;
        row.querySelector(".general-skill-level-display").textContent =
          `Lv ${level}`;
        row.querySelector(".level-guide-text").textContent =
          SkillLevelGuides[level];
        updateGeneralSkillTotal();
      }
      if (e.target.classList.contains("tp-points-input")) {
        updateTotalTreasurePoints();
      }
    });

    form.addEventListener("change", (e) => {
      const target = e.target;
      if (target.matches(".weapon-name-free")) handleWeaponNameChange(target);
      if (target.matches(".armour-name-free")) handleArmourNameChange(target);
      if (target.matches(".item-name-free")) handleItemNameChange({ target });
      if (target.matches(".tp-ability-select, .tp-points-input")) updateTotalTreasurePoints();
    });

    // ドキュメント全体のクリックでプルダウンを閉じる
    document.addEventListener("click", (e) => {
      if (openDropdownElement && !e.target.closest(".input-with-dropdown")) {
        closeDropdown(openDropdownElement);
      }
    });

    document.getElementById("cashbook").addEventListener("input", (e) => {
      const regex = /(\[>\]\*\*.*?\n[\s\S]*?\[---\]\n*)/;
      const match = e.target.value.match(regex);
      userCashbookContent = e.target.value
        .replace(match ? match[0] : "", "")
        .trim();
      updateAllItems();
    });

    document
      .getElementById("money-sidebar-other")
      .addEventListener("input", updateRemainingMoney);
    sidebarLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.dataset.target;
        sidebarLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        formPanels.forEach((panel) =>
          panel.classList.toggle("active", panel.id === targetId),
        );
      });
    });

    regulationSelect.addEventListener("change", updateRegulationValues);
    rollGrowthBtn.addEventListener("click", handleRollGrowth);
    copyRegulationBtn.addEventListener("click", async () => {
      const levelRange = regulationSelect.selectedOptions[0].textContent;
      const text = [
        `レベル帯：${levelRange}`,
        `合計経験点：${expTotalInput.value}`,
        `所持金：${moneyTotalInput.value}`,
        `名誉点：${honorInput.value}`,
        `アビスシャード：${abyssShardInput.value}`,
        `成長回数：${growthCountInput.value}`,
      ].join("\n");

      try {
        await navigator.clipboard.writeText(text);
        showToast("レギュレーションをコピーしました！");
      } catch (error) {
        console.error("レギュレーションのコピーに失敗しました:", error);
        showToast("レギュレーションのコピーに失敗しました。");
      }
    });
    growthResultsContainer.addEventListener("click", (event) => {
      if (event.target.classList.contains("stat-candidate"))
        handleCandidateClick(event.target);
    });
    usePriorityCheck.addEventListener("change", applyPriorityToAllRows);
    statsGridContainer.addEventListener("change", (e) => {
      if (e.target.classList.contains("priority-select")) {
        handlePriorityChange(e.target);
        applyPriorityToAllRows();
      }
    });
    statsGridContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("bracelet-btn")) {
        const currentValue = parseInt(e.target.dataset.value, 10);
        let nextValue = currentValue === 0 ? 2 : currentValue === 2 ? 1 : 0;
        e.target.dataset.value = nextValue;
        e.target.textContent = nextValue === 0 ? "0" : `+${nextValue}`;
        updateAllStatTotals();
      }
    });
    resetPriorityBtn.addEventListener("click", () => {
      statsGridContainer
        .querySelectorAll(".priority-select")
        .forEach((select) => {
          select.value = "99";
        });
      applyPriorityToAllRows();
    });

    // 敵強化機能のイベントリスナー
    if (applyEnemyEnhancementBtn) {
      applyEnemyEnhancementBtn.addEventListener("click", applyEnemyEnhancement);
    }
    if (copyEnemyJsonBtn) {
      copyEnemyJsonBtn.addEventListener("click", () => {
        if (enemyJsonOutput.value) {
          navigator.clipboard
            .writeText(enemyJsonOutput.value)
            .then(() => {
              showToast("コピーしました！");
            })
            .catch((err) => {
              console.error("コピーに失敗しました: ", err);
              showToast("コピーに失敗しました。");
            });
        }
      });
    }
    const treasurePointTable = document.getElementById("treasure-point-table");
    if (treasurePointTable) {
      setupTreasurePointTableCells();
      treasurePointTable.addEventListener("click", handleTpTableClick);
      treasurePointTable.addEventListener("keydown", handleTpTableKeydown);
    }
  }

  function initialize() {
    populateRegulations();
    setupStatsGrid();
    setupBasicInfoPanel();
    addWeaponRow();
    addArmourRow();
    setupItemPanel();
    addGeneralSkillRow();
    setupEnhancementPanel();
    setupItemSetsPanel();
    setupRecommendedItemsPanel(); // ★追加
    setupEventListeners();
    setupCharAnalysisEventListeners();
    initializeCharAnalysisCsv();
    regulationSelect.dispatchEvent(new Event("change"));
    updateAllStatTotals();
    updateGrowthExportButtons();
  }

  function populateRegulations() {
    if (!regulationSelect) return;
    Regulations.forEach((reg, index) => {
      regulationSelect.add(new Option(reg.label, index));
    });
  }

  function setupStatsGrid() {
    statsGridContainer.innerHTML = "";
    statsGridContainer.appendChild(document.createElement("div"));
    statNames.forEach((name) => {
      const header = document.createElement("div");
      const statNameWithDo = name.endsWith("度") ? name : name + "度";
      header.className = `grid-header ${statClassMap[name]}`;
      header.textContent = name;
      statsGridContainer.appendChild(header);
    });
    const rows = [
      { label: "優先度", type: "priority" },
      { label: "初期ステータス", type: "initial" },
      { label: "腕輪", type: "bracelet" },
      { label: "成長", type: "growth" },
      { label: "合計", type: "total" },
      { label: "合計B", type: "bonus" },
    ];
    rows.forEach((rowData) => {
      const label = document.createElement("div");
      label.className = "grid-label";
      if (rowData.type === "initial")
        label.classList.add("initial-status-label");
      label.textContent = rowData.label;
      statsGridContainer.appendChild(label);
      statNames.forEach((name, index) => {
        let cell;
        switch (rowData.type) {
          case "priority":
            cell = document.createElement("select");
            cell.className = "priority-select";
            cell.dataset.stat = name;
            cell.innerHTML = '<option value="99">-</option>';
            for (let i = 1; i <= 6; i++) cell.add(new Option(i, i));
            cell.value = index + 1;
            break;
          case "initial":
            cell = document.createElement("input");
            cell.type = "number";
            cell.className = "initial-stat-input";
            cell.dataset.stat = name;
            cell.value = 0;
            break;
          case "bracelet":
            cell = document.createElement("button");
            cell.type = "button";
            cell.className = "bracelet-btn";
            cell.dataset.stat = name;
            cell.dataset.value = "0";
            cell.textContent = "0";
            break;
          case "growth":
            cell = document.createElement("div");
            cell.id = `summary-count-${name}`;
            cell.textContent = "0";
            break;
          case "total":
            cell = document.createElement("div");
            cell.className = `stat-total ${statClassMap[name]}`;
            cell.dataset.stat = name;
            cell.textContent = "0";
            break;
          case "bonus":
            cell = document.createElement("div");
            cell.className = `stat-bonus ${statClassMap[name]}`;
            cell.dataset.stat = name;
            cell.textContent = "0";
            break;
        }
        statsGridContainer.appendChild(cell);
      });
    });
  }

  function setupBasicInfoPanel() {
    const container = document.getElementById("personal-data-fields-container");
    container.innerHTML = "";
    const standardItems = {
      身長: "",
      体重: "",
      髪: "",
      瞳: "",
      肌: "",
    };
    for (const key in standardItems) {
      const newRow = addPersonalDataRow(key, standardItems[key]);
      if (key === "身長" || key === "体重") {
        const unit = key === "身長" ? "cm" : "kg";
        const unitBtn = document.createElement("button");
        unitBtn.type = "button";
        unitBtn.className = "unit-btn";
        unitBtn.textContent = unit;
        unitBtn.dataset.unit = unit;
        newRow
          .querySelector(".personal-data-value-wrapper")
          .appendChild(unitBtn);
      }
    }
  }

  function addPersonalDataRow(key = "", value = "") {
    const container = document.getElementById("personal-data-fields-container");
    const template = document.getElementById("template-personal-data-row");
    if (!template) return;
    const clone = template.content.cloneNode(true);
    const newRow = clone.querySelector(".dynamic-row");
    newRow.querySelector(".personal-data-key").value = key;
    newRow.querySelector(".personal-data-value").value = value;
    container.appendChild(clone);
    return newRow;
  }

  function updatePersonalDataOutput() {
    const outputTextarea = document.getElementById("personal-data-output");
    if (!outputTextarea) return;
    let output = "[>]**パーソナルデータ\n";
    document
      .querySelectorAll("#personal-data-fields-container .personal-data-row")
      .forEach((row) => {
        const key = row.querySelector(".personal-data-key").value.trim();
        const value = row.querySelector(".personal-data-value").value.trim();
        if (key) output += `:${key}|${value}\n`;
      });
    outputTextarea.value = output + "[---]";
  }

  function populateEquipmentCategories(row) {
    // weaponNameSelect, armourNameSelect, itemNameSelect のロジックは
    // 新しい populateWeaponDropdown, populateArmourDropdown, populateItemDropdown に置き換えられるため削除
    const weaponClassSelect = row.querySelector(".weapon-class");
    const armourCategorySelect = row.querySelector(".armour-category");

    if (weaponClassSelect) {
      weaponClassSelect.innerHTML = '<option value="">-</option>';
      for (const cat in WeaponClasses)
        weaponClassSelect.add(new Option(cat, cat));
    }
    if (armourCategorySelect) {
      armourCategorySelect.innerHTML = '<option value="">-</option>';
      for (const cat in ArmourClasses)
        armourCategorySelect.add(new Option(cat, cat));
    }
  }

  function populateWeaponDropdown(dropdownMenu) {
    dropdownMenu.innerHTML = "";
    Weapons.forEach((weapon) => {
      const li = document.createElement("li");
      li.textContent = weapon.rank
        ? `[${weapon.rank}] ${weapon.name}`
        : weapon.name;
      li.dataset.value = weapon.name;
      dropdownMenu.appendChild(li);
    });
  }

  function populateArmourDropdown(dropdownMenu) {
    dropdownMenu.innerHTML = "";
    Armours.forEach((armour) => {
      const li = document.createElement("li");
      li.textContent = armour.rank
        ? `[${armour.rank}] ${armour.name}`
        : armour.name;
      li.dataset.value = armour.name;
      dropdownMenu.appendChild(li);
    });
  }

  function addWeaponRow() {
    const container = document.getElementById("weapons-container");
    const clone = document
      .getElementById("template-weapon")
      .content.cloneNode(true);
    const newRow = clone.querySelector(".weapon-row");
    const nameInput = newRow.querySelector(".weapon-name-free");
    const dropdownMenu = newRow.querySelector(".dropdown-menu");
    const dropdownArrow = newRow.querySelector(".dropdown-arrow");

    populateEquipmentCategories(newRow); // weaponClassSelect の初期化のため
    populateWeaponDropdown(dropdownMenu);

    nameInput.addEventListener("input", () => {
      filterDropdownOptions(nameInput, dropdownMenu);
      openDropdown(dropdownMenu);
    });

    dropdownArrow.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown(dropdownMenu);
    });

    dropdownMenu.addEventListener("click", (e) => {
      if (e.target.tagName === "LI") {
        nameInput.value = e.target.dataset.value;
        closeDropdown(dropdownMenu);
        nameInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    container.appendChild(clone);
    handleWeaponNameChange(nameInput); // 初期値の反映
  }

  function addArmourRow() {
    const container = document.getElementById("armours-container");
    const clone = document
      .getElementById("template-armour")
      .content.cloneNode(true);
    const newRow = clone.querySelector(".armour-row");
    const nameInput = newRow.querySelector(".armour-name-free");
    const dropdownMenu = newRow.querySelector(".dropdown-menu");
    const dropdownArrow = newRow.querySelector(".dropdown-arrow");

    populateEquipmentCategories(newRow); // armourCategorySelect の初期化のため
    populateArmourDropdown(dropdownMenu);

    nameInput.addEventListener("input", () => {
      filterDropdownOptions(nameInput, dropdownMenu);
      openDropdown(dropdownMenu);
    });

    dropdownArrow.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown(dropdownMenu);
    });

    dropdownMenu.addEventListener("click", (e) => {
      if (e.target.tagName === "LI") {
        nameInput.value = e.target.dataset.value;
        closeDropdown(dropdownMenu);
        nameInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    container.appendChild(clone);
    handleArmourNameChange(nameInput); // 初期値の反映
  }

  function populateItemDropdown(dropdownMenu) {
    dropdownMenu.innerHTML = ""; // Clear existing options
    const allItems = Object.values(Items)
      .flatMap((category) => Object.values(category).flat())
      .map((item) => item.name); // Get all item names

    allItems.forEach((itemName) => {
      const li = document.createElement("li");
      li.textContent = itemName;
      li.dataset.value = itemName; // Store the value in a data attribute
      dropdownMenu.appendChild(li);
    });
  }

  function addItemRow({
    isMagic = false,
    name = "", // Default to empty string for new input-with-dropdown
    unitPrice = "",
    quantity = 1,
    effect = "",
    freeName = "",
  } = {}) {
    const container = document.getElementById("items-container");
    const clone = document
      .getElementById("template-item-row")
      .content.cloneNode(true);
    const newRow = clone.querySelector(".item-row");

    const nameInput = newRow.querySelector(".item-name-free");
    const dropdownMenu = newRow.querySelector(".dropdown-menu");
    const dropdownArrow = newRow.querySelector(".dropdown-arrow");

    // Populate dropdown with all items
    populateItemDropdown(dropdownMenu);

    // Set initial values
    nameInput.value = freeName || name; // Use freeName if available, otherwise name

    newRow.querySelector(".item-magic-check").checked = isMagic;
    newRow.querySelector(".item-unit-price").value = unitPrice;
    newRow.querySelector(".item-quantity").value = quantity;
    newRow.querySelector(".item-effect").value = effect;
    container.appendChild(clone);

    // Add event listeners for the new dropdown functionality
    nameInput.addEventListener("input", () => {
      filterDropdownOptions(nameInput, dropdownMenu);
      openDropdown(dropdownMenu);
    });

    dropdownArrow.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown(dropdownMenu);
    });

    dropdownMenu.addEventListener("click", (e) => {
      if (e.target.tagName === "LI") {
        nameInput.value = e.target.dataset.value;
        closeDropdown(dropdownMenu);
        // Trigger change event for the input to update other fields
        nameInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Initial update based on the set name
    handleItemNameChange({ target: nameInput });
  }

  function updateAllItems() {
    calculateAllItemTotals();
    updateItemsOutput();
    updateCashbookAndMoney();
    const equipmentPanel = document.getElementById("panel-equipment-items");
    const hasCrystal = !!document.querySelector(".item-row.is-crystal");
    if (equipmentPanel)
      equipmentPanel.classList.toggle("points-column-visible", hasCrystal);
  }

  function calculateAllItemTotals() {
    document.querySelectorAll(".item-row").forEach((row) => {
      const nameFree = row.querySelector(".item-name-free");
      const name = nameFree ? nameFree.value : "";

      const pointsInput = row.querySelector(".item-points");
      const unitPriceInput = row.querySelector(".item-unit-price");
      const quantityInput = row.querySelector(".item-quantity");
      const totalPriceInput = row.querySelector(".item-total-price");

      const nameForCalc = name.replace(/\s*\((\d+)\s*点\)$/, "");
      const points = parseInt(pointsInput.value, 10) || 0;
      let unitPrice = parseFloat(unitPriceInput.value) || 0;
      const quantity = parseInt(quantityInput.value, 10) || 0;

      row.classList.toggle(
        "is-crystal",
        nameForCalc.toLowerCase().includes("魔晶石") ||
          nameForCalc.toLowerCase().includes("マナチャージクリスタル"),
      );

      if (row.classList.contains("is-crystal") && points > 0) {
        if (nameForCalc.toLowerCase().includes("魔晶石")) {
          if (points <= 5) unitPrice = 100 * points;
          else if (points <= 10) unitPrice = 200 * points;
          else if (points <= 15) unitPrice = 300 * points;
          else unitPrice = 400 * points;
        } else {
          unitPrice = 500 * points;
        }
        unitPriceInput.value = unitPrice;
      }
      totalPriceInput.value = unitPrice * quantity;
    });
  }

  function updateItemsOutput() {
    const outputTextarea = document.getElementById("items-output");
    const folderToggle = document.getElementById("item-folder-toggle").checked;
    const folderTitle =
      document.getElementById("item-folder-title").value.trim() || "初期投資";
    let outputLines = [];
    document.querySelectorAll("#items-container .item-row").forEach((row) => {
      const isMagic = row.querySelector(".item-magic-check").checked;
      let name = row.querySelector(".item-name-free").value.trim();
      const quantity =
        parseInt(row.querySelector(".item-quantity").value, 10) || 1;
      const effect = row.querySelector(".item-effect").value.trim();

      if (name) {
        const prefix = isMagic ? "[魔]" : "";
        const nameText =
          name.startsWith("〈") && name.endsWith("〉") ? name : `〈${name}〉`;
        let line = `:${prefix}${nameText}|`;
        if (effect) line += `${effect}`;
        if (quantity > 1) line += (effect ? " " : "") + `${quantity}個`;
        else if (!effect && quantity === 1) line += `1個`;
        outputLines.push(line);
      }
    });
    if (folderToggle && outputLines.length > 0) {
      outputTextarea.value =
        `[>]**${folderTitle}\n` + outputLines.join("\n") + `\n[---]`;
    } else {
      outputTextarea.value = outputLines.join("\n");
    }
  }

  function updateRemainingMoney() {
    const regulationMoney =
      parseInt(
        document.getElementById("money-sidebar-regulation").textContent,
        10,
      ) || 0;
    const itemsTotal =
      parseInt(
        document.getElementById("money-sidebar-items-total").textContent,
        10,
      ) || 0;
    const other =
      parseInt(document.getElementById("money-sidebar-other").value, 10) || 0;
    document.getElementById("money-sidebar-remaining").textContent =
      regulationMoney + itemsTotal + other;
  }

  function handleWeaponNameChange(nameInputElement) {
    const selectedWeaponName = nameInputElement.value;
    const row = nameInputElement.closest(".weapon-row");
    const data = Weapons.find((item) => item.name === selectedWeaponName);

    const magicCheck = row.querySelector(".item-magic-check");
    if (magicCheck) magicCheck.checked = !!(data && data.isMagic);

    const fields = {
      price: ".weapon-price",
      usage: ".weapon-usage",
      req: ".weapon-req",
      acc: ".weapon-acc",
      rate: ".weapon-rate",
      crit: ".weapon-crit",
      dmg: ".weapon-dmg",
      class: ".weapon-class",
      rank: ".weapon-rank",
      note: ".weapon-note",
    };
    if (data && row) {
      for (const key in fields) {
        const field = row.querySelector(fields[key]);
        if (field) {
          let value = "";
          switch (key) {
            case "usage":
              value = data.usage || (data.hands === 1 ? "1H" : data.hands === 2 ? "2H" : "");
              break;
            case "rate":
              value = data.might;
              break;
            default:
              value = data[key] !== undefined ? data[key] : "";
          }
          field.value = value;
        }
      }
    }
    // else if (row) { // データが見つからない場合に空欄にするロジックを削除
    //   for (const key in fields) {
    //     if (row.querySelector(fields[key]))
    //       row.querySelector(fields[key]).value = "";
    //   }
    // }
    updateAllItems();
  }

  function handleArmourNameChange(nameInputElement) {
    const selectedArmourName = nameInputElement.value;
    const row = nameInputElement.closest(".armour-row");
    const data = Armours.find((item) => item.name === selectedArmourName);

    const magicCheck = row.querySelector(".item-magic-check");
    if (magicCheck) magicCheck.checked = !!(data && data.isMagic);

    const fields = {
      price: ".armour-price",
      rank: ".armour-rank",
      req: ".armour-req",
      eva: ".armour-eva",
      def: ".armour-def",
      cls: ".armour-category",
      note: ".armour-note",
    };

    if (data && row) {
      for (const key in fields) {
        const field = row.querySelector(fields[key]);
        if (field) field.value = data[key] || "";
      }
    }
    // else if (row) { // データが見つからない場合に空欄にするロジックを削除
    //   for (const key in fields) {
    //     const field = row.querySelector(fields[key]);
    //     if (field) field.value = "";
    //   }
    // }
    updateAllItems();
  }

  function addGeneralSkillRow(skillName = "", level = 0) {
    const template = document.getElementById("template-general-skill-row");
    const clone = template.content.cloneNode(true);
    const newRow = clone.querySelector(".general-skill-row");
    const select = newRow.querySelector(".general-skill-select");
    const slider = newRow.querySelector(".general-skill-level-slider");
    const levelDisplay = newRow.querySelector(".general-skill-level-display");
    const guideText = newRow.querySelector(".level-guide-text");

    select.innerHTML = '<option value="">技能を選択</option>';
    GeneralSkills.forEach((skill) => select.add(new Option(skill, skill)));

    if (skillName) select.value = skillName;
    slider.value = level;
    levelDisplay.textContent = `Lv ${level}`;
    guideText.textContent = SkillLevelGuides[level];

    generalSkillsContainer.appendChild(clone);
  }

  function updateGeneralSkillTotal() {
    let totalLevel = 0;
    const maxLevel = 10;
    document
      .querySelectorAll(".general-skill-level-slider")
      .forEach((slider) => {
        totalLevel += parseInt(slider.value, 10);
      });

    if (skillProgressBar) {
      const segments = skillProgressBar.querySelectorAll(".progress-segment");
      const isOverLimit = totalLevel > maxLevel;
      segments.forEach((segment, index) => {
        const isActive = index < totalLevel;
        segment.classList.toggle("active", isActive);
        segment.classList.remove("is-last-active");
        if (isActive) segment.classList.toggle("over-limit", isOverLimit);
        else segment.classList.remove("over-limit");
      });
      if (totalLevel > 0 && !isOverLimit)
        segments[totalLevel - 1].classList.add("is-last-active");
    }

    if (totalLevelSpan) {
      const valueSpan = totalLevelSpan.querySelector(".cost-value");
      if (valueSpan) valueSpan.textContent = totalLevel;
      totalLevelSpan.classList.toggle("over-limit", totalLevel > maxLevel);
    }

    if (addGeneralSkillBtn)
      addGeneralSkillBtn.disabled = totalLevel >= maxLevel;
  }

  function updateRegulationValues() {
    const reg = Regulations[regulationSelect.value];
    if (!reg) return;
    expTotalInput.value = reg.exp;
    moneyTotalInput.value = reg.money;
    honorInput.value = reg.honor;
    abyssShardInput.value = reg.abyssShard;
    growthCountInput.value = reg.growth;
    document.getElementById("money-sidebar-regulation").textContent = reg.money;
    const itemContainer = document.getElementById("items-container");
    const existingShardRow = Array.from(
      itemContainer.querySelectorAll(".item-row"),
    ).find((row) =>
      row.querySelector(".item-name-free").value.includes("アビスシャード"),
    );
    if (existingShardRow) {
      if (reg.abyssShard > 0)
        existingShardRow.querySelector(".item-quantity").value = reg.abyssShard;
      else existingShardRow.remove();
    } else if (reg.abyssShard > 0) {
      addItemRow({
        name: "free",
        freeName: "アビスシャード",
        quantity: reg.abyssShard,
      });
    }
    updateAllItems();
  }

  function getPriorities() {
    const priorities = {};
    statsGridContainer
      .querySelectorAll(".priority-select")
      .forEach((select) => {
        priorities[select.dataset.stat] = parseInt(select.value, 10);
      });
    return priorities;
  }

  function handlePriorityChange(changedSelect) {
    const newValue = changedSelect.value;
    if (newValue === "99") return;
    statsGridContainer
      .querySelectorAll(".priority-select")
      .forEach((select) => {
        if (select !== changedSelect && select.value === newValue)
          select.value = "99";
      });
  }

  function rollSingleGrowth() {
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    return growthMap[diceRoll];
  }

  function handleRollGrowth() {
    growthResultsContainer.innerHTML = "";
    growthRowCounter = 0;
    const count = parseInt(growthCountInput.value, 10) || 0;
    if (count === 0) {
      calculateGrowthSummary();
      updateGrowthExportButtons();
      return;
    }
    for (let i = 0; i < count; i++)
      displayGrowthResult(rollSingleGrowth(), rollSingleGrowth());
    applyPriorityToAllRows();
    updateGrowthExportButtons();
  }

  function displayGrowthResult(stat1, stat2) {
    growthRowCounter++;
    const clone = document
      .getElementById("template-growth-row")
      .content.cloneNode(true);
    const row = clone.querySelector(".growth-row");
    const numberSpan = document.createElement("span");
    numberSpan.textContent = `${growthRowCounter}.`;
    numberSpan.classList.add("growth-row-number");
    row.prepend(numberSpan);
    const [btn1, btn2] = row.querySelectorAll(".stat-candidate");
    btn1.textContent = stat1;
    btn2.textContent = stat2;
    if (stat1 === stat2) {
      btn1.classList.add(
        "selected",
        statClassMap[stat1],
      ); /* statClassMap[stat1]を追加 */
      btn2.classList.add(
        "selected",
        statClassMap[stat2],
      ); /* statClassMap[stat2]を追加 */
      btn1.disabled = true;
      btn2.disabled = true;
    }
    updateGrowthRow(row);
    growthResultsContainer.appendChild(clone);
  }

  function handleCandidateClick(button) {
    const row = button.closest(".growth-row");
    row
      .querySelectorAll(".stat-candidate")
      .forEach((btn) => btn.classList.remove("selected", "unselected"));
    button.classList.add("selected");
    const otherButton = row.querySelector(`.stat-candidate:not(.selected)`);
    if (otherButton) otherButton.classList.add("unselected");
    updateGrowthRow(row);
    calculateGrowthSummary();
    updateGrowthExportButtons();
  }

  function applyPriorityToAllRows() {
    if (!usePriorityCheck.checked) return;
    const priorities = getPriorities();
    growthResultsContainer.querySelectorAll(".growth-row").forEach((row) => {
      const [btn1, btn2] = row.querySelectorAll(".stat-candidate");
      if (btn1.disabled) return;
      const priority1 = priorities[btn1.textContent];
      const priority2 = priorities[btn2.textContent];
      row
        .querySelectorAll(".stat-candidate")
        .forEach((btn) => btn.classList.remove("selected", "unselected"));
      if (priority1 !== 99 || priority2 !== 99) {
        if (priority1 <= priority2) {
          btn1.classList.add("selected");
          btn2.classList.add("unselected");
        } else {
          btn2.classList.add("selected");
          btn1.classList.add("unselected");
        }
      }
      updateGrowthRow(row);
    });
    calculateGrowthSummary();
  }

  function updateGrowthRow(rowElement) {
    const selectedBtn = rowElement.querySelector(".stat-candidate.selected");
    const confirmedSpan = rowElement.querySelector(".stat-confirmed");
    const [btn1, btn2] = rowElement.querySelectorAll(".stat-candidate");
    const areBothDisabled = btn1.disabled && btn2.disabled; // stat1 === stat2 の場合

    // 選択が変更された場合のみ、stat-candidateから既存のクラスを削除
    // ただし、両方がdisabledの場合は削除しない（両方に色を付けたままにするため）
    if (!areBothDisabled) {
      rowElement.querySelectorAll(".stat-candidate").forEach((btn) =>
        statNames.forEach((name) => {
          if (statClassMap[btn.textContent])
            btn.classList.remove(statClassMap[btn.textContent]);
        }),
      );
    }

    confirmedSpan.className = "stat-confirmed"; // まず基本クラスにリセット

    if (selectedBtn) {
      const statName = selectedBtn.textContent;
      // selectedBtn に statClassMap を再適用 (areBothDisabled の場合は既に付いているが、念のため)
      selectedBtn.classList.add(statClassMap[statName]);
      confirmedSpan.textContent = statName;
      confirmedSpan.classList.add(statClassMap[statName] || "");
    } else if (areBothDisabled) {
      // stat1 === stat2 で、かつ selectedBtn がない場合（ありえないが念のため）
      const statName = btn1.textContent; // どちらのボタンでも同じステータス名
      confirmedSpan.textContent = statName;
      confirmedSpan.classList.add(statClassMap[statName] || "");
    } else {
      confirmedSpan.textContent = "―";
    }
  }

  function calculateGrowthSummary() {
    const counts = statNames.reduce((acc, name) => ({ ...acc, [name]: 0 }), {});
    growthResultsContainer.querySelectorAll(".growth-row").forEach((row) => {
      const selectedBtn = row.querySelector(".stat-candidate.selected");
      if (selectedBtn && counts.hasOwnProperty(selectedBtn.textContent))
        counts[selectedBtn.textContent]++;
    });
    statNames.forEach((statName) => {
      const countSpan = document.getElementById(`summary-count-${statName}`);
      if (countSpan) countSpan.textContent = counts[statName];
    });
    updateAllStatTotals();
    updateGrowthExportButtons();
  }

  function updateGrowthExportButtons() {
    const exportGrowthLinesBtn = document.getElementById(
      "export-growth-lines-btn",
    );
    const growthSummaryOutput = document.getElementById(
      "growth-summary-output",
    );
    const hasRows =
      growthResultsContainer &&
      growthResultsContainer.querySelectorAll(".growth-row").length > 0;
    if (exportGrowthLinesBtn) exportGrowthLinesBtn.disabled = !hasRows;
    if (growthSummaryOutput) growthSummaryOutput.disabled = !hasRows;
    if (growthSummaryOutput) {
      growthSummaryOutput.value = hasRows ? getGrowthSummaryText() : "";
    }
  }

  function getGrowthResultsLines() {
    const lines = [];
    growthResultsContainer
      .querySelectorAll(".growth-row")
      .forEach((row, idx) => {
        const [btn1, btn2] = row.querySelectorAll(".stat-candidate");
        const confirmed =
          row.querySelector(".stat-confirmed")?.textContent || "";
        if (!btn1 || !btn2) return;
        const confirmedText =
          confirmed && confirmed !== "―" ? confirmed : "未確定";
        const stat1Number = statNumberMap[btn1.textContent] || "?";
        const stat2Number = statNumberMap[btn2.textContent] || "?";
        lines.push(
          `[${stat1Number},${stat2Number}]->(${btn1.textContent} or ${btn2.textContent})->${confirmedText}`,
        );
      });
    return lines;
  }

  function getGrowthSummaryText() {
    const parts = statNames
      .map((statName) => {
        const countSpan = document.getElementById(`summary-count-${statName}`);
        const count = countSpan ? parseInt(countSpan.textContent, 10) || 0 : 0;
        return count > 0 ? `${statName}${count}` : "";
      })
      .filter(Boolean);
    return parts.length > 0 ? parts.join("") : "(成長なし)";
  }

  function exportGrowthResults(format) {
    const count = parseInt(growthCountInput.value, 10) || 0;
    if (count === 0) {
      showToast("成長結果がありません。");
      return;
    }

    let content = "";
    if (format === "summary") {
      content = getGrowthSummaryText();
    } else {
      content = getGrowthResultsLines().join("\n");
    }

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(
      now.getHours(),
    ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    const filename =
      format === "summary"
        ? `sw25_growth_summary_${timestamp}.txt`
        : `sw25_growth_lines_${timestamp}.txt`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("成長結果TXTを保存しました！");
  }

  function updateAllStatTotals() {
    statNames.forEach((name) => {
      const initial =
        parseInt(
          statsGridContainer.querySelector(
            `.initial-stat-input[data-stat="${name}"]`,
          ).value,
          10,
        ) || 0;
      const bracelet =
        parseInt(
          statsGridContainer.querySelector(`.bracelet-btn[data-stat="${name}"]`)
            .dataset.value,
          10,
        ) || 0;
      const growth =
        parseInt(
          document.getElementById(`summary-count-${name}`).textContent,
          10,
        ) || 0;
      const total = initial + bracelet + growth;
      const bonus = Math.floor(total / 6);
      statsGridContainer.querySelector(
        `.stat-total[data-stat="${name}"]`,
      ).textContent = total;
      statsGridContainer.querySelector(
        `.stat-bonus[data-stat="${name}"]`,
      ).textContent = bonus;
    });
  }

  function partitionInteger(total, maxValue) {
    let parts = [];
    let currentTotal = 0;
    while (currentTotal < total) {
      let remaining = total - currentTotal;
      let maxPart = Math.min(maxValue, remaining);
      let newPart = Math.floor(Math.random() * maxPart) + 1;
      parts.push(newPart);
      currentTotal += newPart;
    }
    let excess = parts.reduce((a, b) => a + b, 0) - total;
    while (excess > 0) {
      let partIndex = Math.floor(Math.random() * parts.length);
      if (parts[partIndex] > 1) {
        parts[partIndex]--;
        excess--;
      }
    }
    return parts.filter((p) => p > 0);
  }

  function handleRandomizeSkillNames() {
    let availableSkills = [...GeneralSkills];
    const skillRows =
      generalSkillsContainer.querySelectorAll(".general-skill-row");
    skillRows.forEach((row) => {
      const select = row.querySelector(".general-skill-select");
      if (availableSkills.length > 0) {
        const skillIndex = Math.floor(Math.random() * availableSkills.length);
        const selectedSkill = availableSkills.splice(skillIndex, 1)[0];
        select.value = selectedSkill;
      } else {
        select.value = "";
      }
    });
  }

  function handleRandomizeAll() {
    generalSkillsContainer.innerHTML = "";
    const levelsToAssign = partitionInteger(10, 5);
    let availableSkills = [...GeneralSkills];
    levelsToAssign.forEach((level) => {
      if (availableSkills.length === 0) return;
      const skillIndex = Math.floor(Math.random() * availableSkills.length);
      const selectedSkill = availableSkills.splice(skillIndex, 1)[0];
      addGeneralSkillRow(selectedSkill, level);
    });
    updateGeneralSkillTotal();
  }


  function normalizeEnemyInputText(inputText) {
    return String(inputText || "")
      .trim()
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/^['"]|['"]$/g, "")
      .trim();
  }

  function buildYutorizeModeJsonUrl(inputText, callbackName = "") {
    const trimmed = normalizeEnemyInputText(inputText);
    if (!/^https?:\/\//i.test(trimmed)) return "";

    let url;
    try {
      url = new URL(trimmed);
    } catch (error) {
      return "";
    }

    const isYutorizeEnemySheet =
      /(^|\.)yutorize\.work$/i.test(url.hostname) &&
      /\/ytsheet\/sw2\.5\/?$/i.test(url.pathname) &&
      url.searchParams.has("id");

    if (!isYutorizeEnemySheet) return "";

    url.searchParams.set("mode", "json");
    if (callbackName) url.searchParams.set("callback", callbackName);
    url.searchParams.set("_sw25ts", String(Date.now()));
    return url.toString();
  }

  function fetchYutorizeEnemyJsonp(inputText) {
    return new Promise((resolve, reject) => {
      const callbackName = `__sw25EnemyEnhanceJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const jsonpUrl = buildYutorizeModeJsonUrl(inputText, callbackName);
      if (!jsonpUrl) {
        reject(new Error("ゆとシートURLではありません。"));
        return;
      }

      const script = document.createElement("script");
      let settled = false;
      const cleanup = () => {
        settled = true;
        try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
        script.remove();
      };
      const timer = window.setTimeout(() => {
        if (settled) return;
        cleanup();
        reject(new Error("JSONP timeout"));
      }, 12000);

      window[callbackName] = (data) => {
        if (settled) return;
        window.clearTimeout(timer);
        cleanup();
        resolve(data);
      };
      script.onerror = () => {
        if (settled) return;
        window.clearTimeout(timer);
        cleanup();
        reject(new Error("JSONP load failed"));
      };
      script.src = jsonpUrl;
      document.head.appendChild(script);
    });
  }

  async function fetchYutorizeEnemyJsonFromUrl(inputText) {
    const modeJsonUrl = buildYutorizeModeJsonUrl(inputText);
    if (!modeJsonUrl) {
      throw new Error(
        "URLは https://yutorize.work/ytsheet/sw2.5/?id=... の形式に対応しています。",
      );
    }

    try {
      const response = await fetch(modeJsonUrl, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-cache",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (error) {
        const jsonp = text.match(/^[\w$.]+\s*\(\s*([\s\S]*)\s*\)\s*;?$/);
        if (jsonp) return JSON.parse(jsonp[1]);
        throw error;
      }
    } catch (fetchError) {
      console.warn("ゆとシートmode=jsonの直接取得に失敗。JSONPへフォールバックします:", fetchError);
      try {
        return await fetchYutorizeEnemyJsonp(inputText);
      } catch (jsonpError) {
        throw new Error(
          `ゆとシートmode=jsonを取得できませんでした。${modeJsonUrl.replace(/&?_sw25ts=\d+/, "")} を開いて中身を貼り付けてください。`,
        );
      }
    }
  }

  async function parseEnemyEnhancementInput(inputText) {
    const trimmed = normalizeEnemyInputText(inputText);
    let parsed;

    if (/^https?:\/\//i.test(trimmed)) {
      parsed = await fetchYutorizeEnemyJsonFromUrl(trimmed);
    } else {
      parsed = JSON.parse(trimmed);
    }

    if (isCocofoliaCharacterJson(parsed)) {
      if (!parsed.data) parsed.data = {};
      if (!Array.isArray(parsed.data.status)) parsed.data.status = [];
      if (!Array.isArray(parsed.data.params)) parsed.data.params = [];
      if (typeof parsed.data.memo !== "string") parsed.data.memo = parsed.data.memo ? String(parsed.data.memo) : "";
      return parsed;
    }

    if (isYutorizeEnemyJson(parsed)) {
      return convertYutorizeEnemyJsonToCocofoliaCharacter(parsed);
    }

    throw new Error(
      "対応している形式ではありません。ココフォリア用コマデータJSON、ゆとシートSW2.5魔物データのURL、またはmode=jsonの中身を入力してください。",
    );
  }

  function isCocofoliaCharacterJson(value) {
    return !!value && value.kind === "character" && !!value.data;
  }

  function isYutorizeEnemyJson(value) {
    if (!value || typeof value !== "object") return false;
    return (
      value.gameVersion === "2.5" &&
      (value.monsterName || value.taxa || value.status1Hp || value.sheetURL) &&
      !value.kind
    );
  }

  function cleanYutorizeText(value) {
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

  function pickYutorizeNumber(value, fallback = "0") {
    const text = String(value ?? "").trim();
    if (!text) return fallback;
    const match = text.match(/-?\d+/);
    return match ? match[0] : fallback;
  }

  function pushCocofoliaParam(params, label, value) {
    if (value === undefined || value === null || value === "") return;
    params.push({ label, value: String(value) });
  }

  function pushCocofoliaStatus(status, label, value, maxValue = value) {
    if (value === undefined || value === null || value === "") return;
    status.push({ label, value: String(value), max: String(maxValue ?? value) });
  }

  function getYutorizePartCount(source) {
    const declared = parseInt(source.statusNum || source.partsNum || "1", 10) || 1;
    let detected = 0;
    for (let i = 1; i <= 20; i += 1) {
      if (source[`status${i}Hp`] || source[`status${i}Style`] || source[`status${i}Accuracy`]) detected = i;
    }
    return Math.max(1, declared, detected);
  }

  function buildYutorizeEnemyMemo(source) {
    const lines = [];
    const description = cleanYutorizeText(source.sheetDescriptionM);
    if (description) lines.push(description);

    const weakness = cleanYutorizeText(source.weakness);
    if (weakness && !description.includes("弱点")) {
      lines.push(`弱点:${weakness}`);
    }

    const skills = cleanYutorizeText(source.skills);
    if (skills) {
      lines.push("", "### 特殊能力", skills);
    }

    return lines.join("\n").trim();
  }

  function buildYutorizeEnemyCommands(source, partCount) {
    const commands = [];
    const vit = pickYutorizeNumber(source.vitResist || source.vitResistFix, "0");
    const mnd = pickYutorizeNumber(source.mndResist || source.mndResistFix, "0");
    if (vit !== "0") commands.push(`2d+${vit}+{生命抵抗修正} 生命抵抗力`);
    if (mnd !== "0") commands.push(`2d+${mnd}+{精神抵抗修正} 精神抵抗力`);

    for (let i = 1; i <= partCount; i += 1) {
      const style = cleanYutorizeText(source[`status${i}Style`]);
      const suffix = partCount > 1 ? `${i}${style ? `(${style})` : ""}` : "";
      const evasion = pickYutorizeNumber(source[`status${i}Evasion`], "");
      const accuracy = pickYutorizeNumber(source[`status${i}Accuracy`], "");
      const damage = cleanYutorizeText(source[`status${i}Damage`]);
      if (evasion) commands.push(`2d+${evasion}+{回避修正} 回避${suffix}`.trim());
      if (accuracy) commands.push(`2d+${accuracy}+{命中修正} 命中力${suffix}`.trim());
      if (damage) commands.push(`${damage}+{打撃修正} ダメージ${suffix}`.trim());
    }

    const skills = cleanYutorizeText(source.skills);
    const magicMatches = Array.from(
      skills.matchAll(/[○◯][^\n／]*魔法[^\n／]*／魔力\s*(\d+)/g),
    );
    magicMatches.forEach((match) => {
      const line = match[0].replace(/^[○◯]/, "").split("／")[0].trim();
      const label = line.replace(/\d+レベル.*/, "").trim() || "魔法";
      const power = match[1];
      commands.push(`2d+${power} ${label}`);
    });

    return commands.join("\n");
  }

  function convertYutorizeEnemyJsonToCocofoliaCharacter(source) {
    const partCount = getYutorizePartCount(source);
    const status = [];
    const params = [];

    pushCocofoliaParam(params, "生命抵抗修正", "0");
    pushCocofoliaParam(params, "精神抵抗修正", "0");
    pushCocofoliaParam(params, "回避修正", "0");
    pushCocofoliaParam(params, "命中修正", "0");
    pushCocofoliaParam(params, "打撃修正", "0");
    pushCocofoliaParam(params, "LV", source.lv || source.level || "");
    pushCocofoliaParam(params, "生命抵抗", pickYutorizeNumber(source.vitResist, pickYutorizeNumber(source.vitResistFix, "0")));
    pushCocofoliaParam(params, "精神抵抗", pickYutorizeNumber(source.mndResist, pickYutorizeNumber(source.mndResistFix, "0")));

    for (let i = 1; i <= partCount; i += 1) {
      const style = cleanYutorizeText(source[`status${i}Style`]);
      const labelSuffix = partCount > 1 ? `${i}${style ? `(${style})` : ""}` : "";
      const hp = pickYutorizeNumber(source[`status${i}Hp`], "");
      const mp = pickYutorizeNumber(source[`status${i}Mp`], "");
      const defense = pickYutorizeNumber(source[`status${i}Defense`], "");
      if (hp) pushCocofoliaStatus(status, partCount > 1 ? `HP${labelSuffix}` : "HP", hp);
      if (mp) pushCocofoliaStatus(status, partCount > 1 ? `MP${labelSuffix}` : "MP", mp);
      if (defense) pushCocofoliaStatus(status, partCount > 1 ? `防護${labelSuffix}` : "防護", defense);

      pushCocofoliaParam(params, `命中${i}`, pickYutorizeNumber(source[`status${i}Accuracy`], ""));
      pushCocofoliaParam(params, `回避${i}`, pickYutorizeNumber(source[`status${i}Evasion`], ""));
    }

    const skills = cleanYutorizeText(source.skills);
    Array.from(skills.matchAll(/[○◯]([^\n／]*魔法[^\n／]*)／魔力\s*(\d+)/g)).forEach((match) => {
      const label = match[1].replace(/\d+レベル.*/, "").trim() || "魔法";
      pushCocofoliaParam(params, label, match[2]);
    });

    return {
      kind: "character",
      data: {
        externalUrl: source.sheetURL || (source.id ? `https://yutorize.work/ytsheet/sw2.5/?id=${source.id}` : ""),
        status,
        initiative: parseInt(source.initiative, 10) || 0,
        params,
        faces: [],
        x: 0,
        y: 0,
        z: 0,
        angle: 0,
        width: 4,
        height: 4,
        active: true,
        secret: false,
        invisible: false,
        hideStatus: false,
        color: "",
        roomId: null,
        commands: buildYutorizeEnemyCommands(source, partCount),
        speaking: true,
        name: cleanYutorizeText(source.monsterName) || "名称未設定",
        memo: buildYutorizeEnemyMemo(source),
      },
    };
  }

  // 敵強化機能のロジック
  async function applyEnemyEnhancement() {
    const inputJson = enemyJsonInput.value.trim();
    if (!inputJson) {
      enemyJsonOutput.value = "エラー: JSONデータまたはゆとシートURLが入力されていません。";
      return;
    }

    const originalApplyText = applyEnemyEnhancementBtn?.innerHTML;
    if (applyEnemyEnhancementBtn) {
      applyEnemyEnhancementBtn.disabled = true;
      applyEnemyEnhancementBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 取得・適用中';
    }

    try {
      const enemyData = await parseEnemyEnhancementInput(inputJson);
      const shards = parseInt(swordShardsCount.value, 10) || 0;
      const totalTp = parseInt(treasurePointsTotalInput.textContent, 10) || 0;

      if (shards <= 0 && totalTp <= 0) {
        enemyJsonOutput.value = "エラー: 強化する内容がありません。";
        return;
      }

      // memo欄を初期化（なければ作成）
      if (!enemyData.data.memo) enemyData.data.memo = "";

      // 既存の自動生成メモをフィルタリング
      const memoLines = enemyData.data.memo.split("\n");
      const filteredLines = memoLines.filter((line) => {
        const trimmedLine = line.trim();
        // 剣のかけらによる抵抗力強化の行 (ツールが生成する形式)
        const isGeneratedShardResistanceLine =
          /^(生命抵抗力|精神抵抗力):\d+\(\d+\)/.test(trimmedLine);
        // 剣のかけらの個数を示す行
        const isShardCountLine = trimmedLine.startsWith("剣のかけら：");
        // トレジャー強化のヘッダー行
        const isTreasureHeaderLine = trimmedLine.startsWith("▼トレジャー強化(");
        // トレジャー強化の各項目行 (例: 瞬間打撃点 (2P))
        const isTreasureAbilityLine =
          /^\S.*\((\d+)P\)$/.test(trimmedLine) && !isTreasureHeaderLine; // ヘッダー行と区別

        return !(
          isGeneratedShardResistanceLine ||
          isShardCountLine ||
          isTreasureHeaderLine ||
          isTreasureAbilityLine
        );
      });
      enemyData.data.memo = filteredLines.join("\n").trim();

      // --- 剣のかけら強化 ---
      if (shards > 0) {
        const resistanceBonus =
          shards >= 16
            ? 4
            : shards >= 11
              ? 3
              : shards >= 6
                ? 2
                : shards >= 1
                  ? 1
                  : 0;

        // 強化前の抵抗値を取得
        const originalLifeResValue = parseInt(
          enemyData.data.params?.find((p) => p.label === "生命抵抗")?.value ||
            "0",
          10,
        );
        const originalSpiritResValue = parseInt(
          enemyData.data.params?.find((p) => p.label === "精神抵抗")?.value ||
            "0",
          10,
        );

        if (enemyData.data.status) {
          enemyData.data.status.forEach((s) => {
            if (s.label.includes("HP")) {
              s.value = String(parseInt(s.value, 10) + shards * 5);
              s.max = String(parseInt(s.max, 10) + shards * 5);
            } else if (s.label.includes("MP")) {
              s.value = String(parseInt(s.value, 10) + shards);
              s.max = String(parseInt(s.max, 10) + shards);
            }
          });
        }

        let enhancedLifeResValue = originalLifeResValue;
        let enhancedSpiritResValue = originalSpiritResValue;

        if (enemyData.data.params) {
          const lifeResParam = enemyData.data.params.find(
            (p) => p.label === "生命抵抗",
          );
          if (lifeResParam) {
            enhancedLifeResValue = originalLifeResValue + resistanceBonus;
            lifeResParam.value = String(enhancedLifeResValue);
          }
          const spiritResParam = enemyData.data.params.find(
            (p) => p.label === "精神抵抗",
          );
          if (spiritResParam) {
            enhancedSpiritResValue = originalSpiritResValue + resistanceBonus;
            spiritResParam.value = String(enhancedSpiritResValue);
          }
        }

        // 新しい強化情報をmemoに追加
        let shardMemo = "";
        if (enemyData.data.memo) shardMemo += "\n";
        shardMemo += `生命抵抗力:${originalLifeResValue}(${enhancedLifeResValue})　精神抵抗力:${originalSpiritResValue}(${enhancedSpiritResValue})\n剣のかけら：${shards}個`;
        enemyData.data.memo += shardMemo;
      }

      // --- トレジャーポイント強化 ---
      if (totalTp > 0) {
        let tpMemo = "";
        if (enemyData.data.memo) tpMemo += "\n";
        tpMemo += `▼トレジャー強化(${totalTp}P)`;
        getSelectedTreasurePointRows().forEach((row) => {
          const ability = row.dataset.ability;
          const points = row.dataset.points;
          const label = row.dataset.label || TP_ABILITY_LABELS[ability] || "";
          if (ability && points) {
            tpMemo += `
${label} (${points}P)`;
          }
        });
        enemyData.data.memo += tpMemo;
      }

      enemyJsonOutput.value = JSON.stringify(enemyData, null, 2);
      showToast("強化を適用しました！");
    } catch (error) {
      console.error(error);
      enemyJsonOutput.value = "エラー: 無効なJSON形式です。\n" + error;
    } finally {
      if (applyEnemyEnhancementBtn) {
        applyEnemyEnhancementBtn.disabled = false;
        applyEnemyEnhancementBtn.innerHTML = originalApplyText || '<i class="fa-solid fa-hammer"></i> 強化を適用';
      }
    }
  }

  // --- トレジャーポイント関連の関数 ---
  const TP_ABILITY_LABELS = {
    weakness: "弱点値上昇",
    initiative: "先制値上昇",
    damage: "瞬間打撃点",
    defense: "瞬間防護点",
    success: "瞬間達成値",
    attack: "追加攻撃",
    curse: "呪いの波動",
    contamination: "世界の汚染",
  };
  const TP_LABEL_TO_ABILITY = Object.fromEntries(
    Object.entries(TP_ABILITY_LABELS).map(([key, label]) => [normalizeTpAbilityName(label), key]),
  );

  function addTpAbilityRow() {
    const firstAvailableCell = document.querySelector("#treasure-point-table tbody td.is-tp-selectable");
    if (firstAvailableCell) firstAvailableCell.click();
  }

  function getSelectedTreasurePointRows() {
    return Array.from(document.querySelectorAll(".tp-ability-row"));
  }

  function updateTotalTreasurePoints() {
    let total = 0;
    getSelectedTreasurePointRows().forEach((row) => {
      const points = parseInt(row.dataset.points, 10) || 0;
      total += points;
    });
    if (treasurePointsTotalInput) {
      treasurePointsTotalInput.textContent = total;
    }
    updateTreasurePointTableHighlight();
  }

  function normalizeTpAbilityName(value) {
    return String(value ?? "").replace(/\s+/g, "").trim();
  }

  function updateTreasurePointTableHighlight() {
    const table = document.getElementById("treasure-point-table");
    if (!table) return;

    table.querySelectorAll(".is-selected, .is-selected-row, .is-selected-column").forEach((el) => {
      el.classList.remove("is-selected", "is-selected-row", "is-selected-column");
    });

    const selectedPairs = [];
    getSelectedTreasurePointRows().forEach((row) => {
      const abilityName = normalizeTpAbilityName(row.dataset.label);
      const points = parseInt(row.dataset.points, 10) || 0;
      if (abilityName && points > 0) {
        selectedPairs.push({ abilityName, points });
      }
    });

    const headerCells = Array.from(table.querySelectorAll("thead th"));
    const pointColumnIndex = new Map();
    headerCells.forEach((th, index) => {
      const value = parseInt(th.textContent.replace(/\D/g, ""), 10);
      if (Number.isFinite(value)) pointColumnIndex.set(value, index);
    });

    const selectedColumns = new Set();
    selectedPairs.forEach(({ abilityName, points }) => {
      const colIndex = pointColumnIndex.get(points);
      if (colIndex == null) return;
      selectedColumns.add(colIndex);
      const rows = Array.from(table.querySelectorAll("tbody tr"));
      rows.forEach((tr) => {
        const rowAbility = normalizeTpAbilityName(tr.querySelector("td:first-child")?.textContent);
        if (rowAbility !== abilityName) return;
        tr.classList.add("is-selected-row");
        const cells = tr.children;
        if (cells[colIndex]) cells[colIndex].classList.add("is-selected");
      });
    });

    selectedColumns.forEach((colIndex) => {
      if (headerCells[colIndex]) headerCells[colIndex].classList.add("is-selected-column");
    });
  }

  function setupTreasurePointTableCells() {
    const table = document.getElementById("treasure-point-table");
    if (!table) return;
    table.querySelectorAll("tbody tr").forEach((row) => {
      const abilityLabel = row.querySelector("td:first-child")?.textContent?.trim() || "";
      const abilityKey = TP_LABEL_TO_ABILITY[normalizeTpAbilityName(abilityLabel)] || "";
      Array.from(row.children).forEach((cell, index) => {
        if (index === 0) return;
        const text = cell.textContent.trim();
        cell.dataset.ability = abilityKey;
        cell.dataset.label = abilityLabel;
        cell.dataset.points = String(index);
        const isAvailable = !!abilityKey && text && text !== "-";
        cell.classList.toggle("is-tp-selectable", isAvailable);
        cell.classList.toggle("is-tp-unavailable", !isAvailable);
        if (isAvailable) {
          cell.tabIndex = 0;
          cell.title = `${abilityLabel} ${index}P を選択`;
        } else {
          cell.removeAttribute("tabindex");
          cell.title = "このポイントでは選択できません";
        }
      });
    });
  }

  function handleTpTableClick(event) {
    const target = event.target.closest("td");
    if (!target || !target.closest("#treasure-point-table tbody")) return;
    if (!target.classList.contains("is-tp-selectable")) return;
    const ability = target.dataset.ability;
    const label = target.dataset.label;
    const points = parseInt(target.dataset.points, 10) || 0;
    if (!ability || !label || points <= 0) return;
    addOrUpdateTpAbility(ability, label, points);
  }

  function handleTpTableKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target.closest("td.is-tp-selectable");
    if (!target) return;
    event.preventDefault();
    target.click();
  }

  function addOrUpdateTpAbility(ability, label, points) {
    if (!tpSelectionContainer) return;
    const existingRow = tpSelectionContainer.querySelector(`.tp-ability-row[data-ability="${CSS.escape(ability)}"]`);
    if (existingRow) {
      const currentPoints = parseInt(existingRow.dataset.points, 10) || 0;
      if (currentPoints === points) {
        existingRow.remove();
        updateTotalTreasurePoints();
        return;
      }
      existingRow.dataset.points = String(points);
      existingRow.dataset.label = label;
      const pointsEl = existingRow.querySelector(".tp-selected-points");
      if (pointsEl) pointsEl.textContent = `${points}P`;
      updateTotalTreasurePoints();
      return;
    }

    const row = document.createElement("div");
    row.className = "dynamic-row tp-ability-row tp-selected-chip";
    row.dataset.ability = ability;
    row.dataset.label = label;
    row.dataset.points = String(points);
    row.innerHTML = `
      <span class="tp-selected-name">${escapeAnalysisHtml(label)}</span>
      <span class="tp-selected-points">${points}P</span>
      <button type="button" class="remove-row-btn" aria-label="${escapeAnalysisHtml(label)}を削除"><i class="fa fa-times"></i></button>
    `;
    tpSelectionContainer.appendChild(row);
    updateTotalTreasurePoints();
  }

  // トースト表示用の関数
  let toastTimeout;
  function showToast(message) {
    const toast = document.getElementById("result-message");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // 汎用ツールチップ表示関数
  function showDynamicTooltip(targetElement, content) {
    if (!tooltipElement) {
      tooltipElement = document.createElement("div");
      tooltipElement.className = "dynamic-tooltip";
      document.body.appendChild(tooltipElement);
    }
    tooltipElement.innerHTML = content;
    tooltipElement.classList.add("visible");

    const rect = targetElement.getBoundingClientRect();
    let x = rect.left;
    let y = rect.bottom + 5 + window.scrollY;

    const tooltipRect = tooltipElement.getBoundingClientRect();
    if (x + tooltipRect.width > window.innerWidth) {
      x = window.innerWidth - tooltipRect.width - 10;
    }
    if (y + tooltipRect.height > window.innerHeight) {
      y = rect.top - tooltipRect.height - 5 + window.scrollY;
    }

    tooltipElement.style.left = `${x}px`;
    tooltipElement.style.top = `${y}px`;
  }

  function hideDynamicTooltip() {
    if (tooltipElement) {
      tooltipElement.classList.remove("visible");
    }
  }

  initialize();
});

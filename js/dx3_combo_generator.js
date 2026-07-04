// dx3_combo_generator.js
console.log("dx3_combo_generator.js loaded and executed.");

Vue.component("input-with-dropdown", {
  template: "#input-with-dropdown-template",
  props: {
    value: String,
    options: {
      type: Array,
      default: () => [],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isOpen: false,
      dropdownStyle: {},
    };
  },
  methods: {

    toggleDropdown(event) {
      if (this.disabled || this.options.length === 0) {
        return;
      }
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        const inputElement = this.$el.querySelector('input[type="text"]');
        if (inputElement) {
          const inputRect = inputElement.getBoundingClientRect();
          this.dropdownStyle = {
            position: "fixed",
            top: `${inputRect.bottom}px`,
            left: `${inputRect.left}px`,
            width: `${inputRect.width}px`,
            zIndex: 9999,
          };
        } else {
          this.isOpen = false;
        }
      } else {
        this.dropdownStyle = {};
      }
    },
    selectOption(option) {
      this.$emit("input", option);
      this.isOpen = false;
      this.dropdownStyle = {};
    },
    handleInput(event) {
      this.$emit("input", event.target.value);
    },
    closeDropdown() {
      if (this.isOpen) {
        this.isOpen = false;
        this.dropdownStyle = {};
      }
    },
  },
  mounted() {
    document.addEventListener("click", this.closeDropdown);
    this.$el.addEventListener("click", (e) => e.stopPropagation());
  },
  beforeDestroy() {
    document.removeEventListener("click", this.closeDropdown);
  },
});

new Vue({
  el: "#dx3-app",
  data: {
    isGuideOpen: false,
    appMode: "pc",
    enemySheet: { ID: "", author: "", name: "", class_type: "DX3", is_public: true, memo: "", icon_url: "", time: "" },
    enemyData: {
      nameKana: "",
      codename: "",
      codenameKana: "",
      breed: "",
      syndromes: ["", "", ""],
      explanation: "",
      tactics: "",
      hp: 30,
      initiative: 5,
      armor: 0,
      guard: 0,
      move: 10,
      erosion: 100,
      erosionDice: 3,
      addErosionDiceToAbilityTotal: false,
      hideStatus: false,
      secret: false,
      hpAsDamage: false,
      abilities: { body: 3, sense: 3, mind: 3, social: 3 },
      abilityAdds: { body: 0, sense: 0, mind: 0, social: 0 },
      abilityGrowth: { body: 0, sense: 0, mind: 0, social: 0 },
      abilityOther: { body: 0, sense: 0, mind: 0, social: 0 },
      statBase: { hp: 30, erosion: 100, initiative: 5, armor: 0, move: 10 },
      statGrowth: { hp: 0, erosion: 0, initiative: 0, armor: 0, move: 0 },
      statOther: { hp: 0, erosion: 0, initiative: 0, armor: 0, move: 0 },
      skills: { "白兵": 0, "射撃": 0, RC: 0, "交渉": 0 },
      skillRows: [
        { name: "白兵", spec: "", ability: "肉体", level: 0, dice: 0, mod: 0, note: "" },
        { name: "回避", spec: "", ability: "肉体", level: 0, dice: 0, mod: 0, note: "" },
        { name: "射撃", spec: "", ability: "感覚", level: 0, dice: 0, mod: 0, note: "" },
        { name: "知覚", spec: "", ability: "感覚", level: 0, dice: 0, mod: 0, note: "" },
        { name: "RC", spec: "", ability: "精神", level: 0, dice: 0, mod: 0, note: "" },
        { name: "意志", spec: "", ability: "精神", level: 0, dice: 0, mod: 0, note: "" },
        { name: "知識", spec: "", ability: "精神", level: 0, dice: 0, mod: 0, note: "" },
        { name: "交渉", spec: "", ability: "社会", level: 0, dice: 0, mod: 0, note: "" },
        { name: "調達", spec: "", ability: "社会", level: 0, dice: 0, mod: 0, note: "" },
        { name: "情報", spec: "裏社会", ability: "社会", level: 0, dice: 0, mod: 0, note: "" },
      ],
    },
    dx3EnemyList: [],
    enemySearch: "",
    enemySearchField: "all",
    dx3EnemySortKey: "time",
    dx3EnemySortOrder: "desc",
    dx3EnemyPage: 1,
    dx3EnemyPageSize: 10,
    gasWebAppUrl:
      "https://script.google.com/macros/s/AKfycbxMR7f_pOi14SsAuKvu7YxKVBQZ69dn-TeQpMBxyYzo_pwZmICNZ06cSb8BKQYCM0GuGg/exec",
    characterSheetUrl: "",
    isBusy: false,
    shareUrl: "",
    isDirty: false,
    isInitializing: true,
    characterName: "",
    totalXp: 130,
    otherXp: 0,
    effects: [],
    easyEffects: [],
    items: [],
    combos: [],
    isPanelOpen: false,
    panelStyle: {},
    editingEffect: null,
    editingEffectType: "",
    editingEffectIndex: -1,
    activeModalTab: "dice",
    modalTabs: [],
    isEffectSelectModalOpen: false,
    editingComboIndex: -1,
    tempSelectedEffects: [],
    tempSelectedItems: [],
    tempSelectedBuffs: [],
    skillToAbilityMap: {
      白兵: "肉体",
      回避: "肉体",
      運転: "肉体",
      射撃: "感覚",
      知覚: "感覚",
      芸術: "感覚",
      RC: "精神",
      意志: "精神",
      知識: "精神",
      交渉: "社会",
      情報: "社会",
      調達: "社会",
    },
    enemySkillNameOptions: [
      "運転:",
      "運転:二輪",
      "運転:四輪",
      "運転:船舶",
      "運転:航空機",
      "運転:馬",
      "運転:多脚戦車",
      "運転:宇宙船",
      "芸術:",
      "芸術:音楽",
      "芸術:歌唱",
      "芸術:演技",
      "芸術:絵画",
      "芸術:写真",
      "芸術:彫刻",
      "芸術:ゲーム",
      "知識:",
      "知識:レネゲイド",
      "知識:医療",
      "知識:心理",
      "知識:機械工学",
      "知識:機械操作",
      "知識:オカルト",
      "知識:遺産",
      "情報:",
      "情報:UGN",
      "情報:FH",
      "情報:ゼノス",
      "情報:噂話",
      "情報:裏社会",
      "情報:警察",
      "情報:軍事",
      "情報:学問",
      "情報:ウェブ",
      "情報:メディア",
      "情報:ビジネス",
    ],
    enemySkillSpecDefaults: {
      運転: "四輪",
      芸術: "音楽",
      知識: "レネゲイド",
      情報: "裏社会",
    },
    dropdownOptions: {
      difficulty: ["-", "自動成功", "対決", "効果参照"],
      skill: [
        "-",
        "シンドローム",
        "白兵",
        "射撃",
        "RC",
        "交渉",
        "白兵／射撃",
        "白兵／RC",
        "回避",
        "知覚",
        "意志",
        "調達",
        "【肉体】",
        "【感覚】",
        "【精神】",
        "【社会】",
        "運転",
        "芸術",
        "知識",
        "情報",
        "効果参照",
      ],

      baseSkillSelect: ["-", "白兵", "射撃", "RC", "交渉"],
      timing: [
        "オート",
        "マイナー",
        "メジャー",
        "メジャー／リア",
        "リアクション",
        "セットアップ",
        "イニシアチブ",
        "クリンナップ",
        "常時",
        "効果参照",
      ],
      target: [
        "自身",
        "単体",
        "範囲(選択)",
        "シーン(選択)",
        "範囲",
        "シーン",
        "効果参照",
        "[LV+1]体",
        "2体",
        "3体",
      ],
      range: ["-", "至近", "武器", "視界", "効果参照"],
      limit: [
        "-",
        "ピュア",
        "80%",
        "100%",
        "120%",
        "Dロイス",
        "リミット",
        "RB",
        "従者専用",
      ],
    },
    confirmation: {
      show: false,
      title: "",
      message: "",
      resolve: null,
      reject: null,
    },
    updateOptions: {
      show: false,
      title: "",
      message: "",
      resolve: null,
    },
    toast: {
      show: false,
      message: "",
      isError: false,
    },
    isBuffSectionOpen: true,
    isSyncingComboLevel: false,
    effectFieldsEditable: false,
    effectDisplayMode: "combo",
    pendingInference: {
      show: false,
      target: null,
      targetName: "",
      overwrite: false,
      suggestions: {},
    },
  },
  created() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "enemy") this.appMode = "enemy";
      const enemyId = params.get("enemy") || params.get("enemyId");
      if (enemyId) {
        this.appMode = "enemy";
        this.enemySheet.ID = String(enemyId);
      }
      const rememberedAuthor = localStorage.getItem("dx3EnemiesAuthor") || "";
      if (rememberedAuthor) this.enemySheet.author = rememberedAuthor;
    } catch (_e) {}
    this.effects = [
      {
        name: "ワーディング",
        level: 1,
        maxLevel: 1,
        timing: "オート",
        skill: "-",
        difficulty: "自動成功",
        target: "シーン",
        range: "視界",
        cost: "0",
        limit: "-",
        effect:
          "いつでも使用できる。シーンに登場している非オーヴァードのキャラクターは全員エキストラとなる。逆に登場しているオーヴァードは使用されたことが自動的に分かるものとする。このエフェクトの効果は、シーン中持続する。",
        notes: "",
        values: this.createDefaultValues(),
      },
      {
        name: "リザレクト",
        level: 1,
        maxLevel: 1,
        timing: "オート",
        skill: "-",
        difficulty: "自動成功",
        target: "自身",
        range: "至近",
        cost: "効果参照",
        limit: "100%↓",
        effect:
          "重圧を受けていても使用可能。あなたが戦闘不能になった時か、シーンの終了時に使用する。あなたは戦闘不能を回復し、HPを(LV)D点回復する。回復したHPと同じだけ、あなたの侵蝕率が上昇する。このエフェクトは侵触率100%以上では使用できない。",
        notes: "",
        values: this.createDefaultValues(),
      },
    ];
    this.addEffect();
    this.addEasyEffect();
    this.addItem();
    this.addCombo();
    if (this.appMode === "enemy") {
      this.setupEnemyModeDefaults(true);
    }
    this.$nextTick(() => {
      this.isDirty = false;
      const urlParams = new URLSearchParams(window.location.search);
      const shortUrl = urlParams.get("url");
      if (shortUrl) {
        let fullUrl = "";
        if (shortUrl.startsWith("v-")) {
          fullUrl = `https://charasheet.vampire-blood.net/${shortUrl.substring(
            2
          )}`;
        } else if (shortUrl.startsWith("y-")) {
          fullUrl = `https://yutorize.work/ytsheet/dx3rd/?id=${shortUrl.substring(
            2
          )}`;
        }
        this.characterSheetUrl = fullUrl;
        this.loadFromDb(true);
      }
      this.generateShareUrl();
      if (this.appMode === "enemy") {
        this.loadDx3EnemyList().then(() => {
          if (this.enemySheet.ID) {
            const found = this.dx3EnemyList.find((enemy) => String(enemy.ID) === String(this.enemySheet.ID));
            if (found) this.loadDx3Enemy(found);
          }
        }).catch(() => {});
      }
      this.$nextTick(() => {
        this.isInitializing = false;
        this.isDirty = false;
      });
    });
  },
  mounted() {
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  },
  beforeDestroy() {
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
  },
  computed: {
    dx3EnemyAbilityDefs() {
      return [
        { key: "body", label: "肉体" },
        { key: "sense", label: "感覚" },
        { key: "mind", label: "精神" },
        { key: "social", label: "社会" },
      ];
    },
    dx3EnemyStatDefs() {
      return [
        { key: "hp", label: "HP" },
        { key: "erosion", label: "侵蝕" },
        { key: "initiative", label: "行動" },
        { key: "armor", label: "装甲" },
        { key: "move", label: "移動" },
      ];
    },
    dx3SyndromeNames() {
      return [
        "エンジェルハィロゥ",
        "バロール",
        "ブラックドッグ",
        "ブラム＝ストーカー",
        "キュマイラ",
        "エグザイル",
        "ハヌマーン",
        "モルフェウス",
        "ノイマン",
        "オルクス",
        "サラマンダー",
        "ソラリス",
        "ウロボロス",
        "ミストルティン",
        "グレイプニル",
        "アザトース",
      ];
    },
    dx3EnemyAutoBreedLabel() {
      return this.getDx3EnemyBreedLabel(this.enemyData);
    },
    dx3EnemySyndromeAbilityBase() {
      return this.getDx3EnemySyndromeAbilityBase(this.enemyData);
    },
    dx3EnemySyndromeRows() {
      return this.getDx3EnemySyndromeRows(this.enemyData);
    },
    dx3EnemyTotalAbilities() {
      return this.getDx3EnemyTotalAbilities(this.enemyData);
    },
    dx3EnemyFinalStats() {
      return this.getDx3EnemyFinalStats(this.enemyData);
    },
    dx3EnemyDisplayAbilities() {
      return this.getDx3EnemyTotalAbilities(this.enemyData);
    },
    dx3EnemyErosionDice() {
      const stats = this.getDx3EnemyFinalStats(this.enemyData);
      return this.getErosionDice(stats.erosion);
    },
    filteredDx3EnemyList() {
      const q = String(this.enemySearch || "").trim().toLowerCase();
      const list = Array.isArray(this.dx3EnemyList) ? this.dx3EnemyList : [];
      if (!q) return list;
      const fieldMap = {
        name: ["name"],
        author: ["author"],
        class: ["class_type"],
        memo: ["memo"],
        id: ["ID"],
        all: ["name", "author", "class_type", "memo", "ID"],
      };
      const fields = fieldMap[this.enemySearchField] || fieldMap.all;
      return list.filter((enemy) => fields.some((key) => String((enemy && enemy[key]) || "").toLowerCase().includes(q)));
    },
    sortedDx3EnemyList() {
      const list = [...this.filteredDx3EnemyList];
      const key = this.dx3EnemySortKey || "time";
      const order = this.dx3EnemySortOrder === "asc" ? 1 : -1;
      const read = (enemy) => {
        if (!enemy) return "";
        if (key === "id") return Number(enemy.ID) || String(enemy.ID || "");
        if (key === "class") return String(enemy.class_type || "");
        if (key === "time") return String(enemy.time || "");
        return String(enemy[key] || "");
      };
      return list.sort((a, b) => {
        const av = read(a);
        const bv = read(b);
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * order;
        return String(av).localeCompare(String(bv), "ja", { numeric: true, sensitivity: "base" }) * order;
      });
    },
    dx3EnemyTotalPages() {
      const size = Number(this.dx3EnemyPageSize) || 0;
      if (size <= 0) return 1;
      return Math.max(1, Math.ceil(this.sortedDx3EnemyList.length / size));
    },
    dx3EnemyCurrentPage() {
      return Math.min(Math.max(1, Number(this.dx3EnemyPage) || 1), this.dx3EnemyTotalPages);
    },
    dx3EnemyVisibleList() {
      const size = Number(this.dx3EnemyPageSize) || 0;
      if (size <= 0) return this.sortedDx3EnemyList;
      const start = (this.dx3EnemyCurrentPage - 1) * size;
      return this.sortedDx3EnemyList.slice(start, start + size);
    },
    dx3EnemyPagerInfo() {
      const total = this.sortedDx3EnemyList.length;
      if (!total) return "0件";
      const size = Number(this.dx3EnemyPageSize) || 0;
      if (size <= 0) return `全${total}件`;
      const from = (this.dx3EnemyCurrentPage - 1) * size + 1;
      const to = Math.min(total, from + size - 1);
      return `${from}-${to} / ${total}件`;
    },
    availableBulkTimingOptions() {
      const options = [
        { key: "major", label: "メジャー" },
        { key: "minor", label: "マイナー" },
        { key: "reaction", label: "リアクション" },
        { key: "setup", label: "セットアップ" },
        { key: "initiative", label: "イニシアチブ" },
        { key: "auto", label: "オート" },
        { key: "constant", label: "常時" },
      ];
      const allEffects = [...this.effects, ...this.easyEffects].filter((effect) => effect && effect.name);
      return options.filter((option) =>
        allEffects.some(
          (effect) =>
            this.normalizeTimingForBulkSelect(effect.timing) === option.key &&
            !this.isEffectDisabled(effect)
        )
      );
    },
    effectXp() {
      return this.effects.reduce((t, e) => {
        if (e.level > 0 && !this.isEssentialEffect(e.name)) {
          return (
            t + (Number(e.level) === 1 ? 15 : 15 + (Number(e.level) - 1) * 5)
          );
        }
        return t;
      }, 0);
    },
    easyEffectXp() {
      return this.easyEffects.reduce(
        (t, e) => (e.level > 0 ? t + Number(e.level) * 2 : t),
        0
      );
    },
    itemXp() {
      return this.items.reduce(
        (total, item) => total + (Number(item.xp) || 0),
        0
      );
    },
    usedXp() {
      return this.effectXp + this.easyEffectXp + this.itemXp;
    },
    processedCombos() {
      const allEffects = [...this.effects, ...this.easyEffects];
      const allItems = this.items;

      const calculateBaseCombo = (combo) => {
        const comboLevelBonus = combo.comboLevelBonus || 0;

        const getSourcesFromCombo = (c) => {
          const sources = [];
          const names = new Set();
          (c.effectNames || []).forEach((effectData) => {
            const name =
              typeof effectData === "string" ? effectData : effectData.name;
            if (name && !names.has(name)) {
              const effect = allEffects.find((e) => e.name === name);
              if (effect) {
                sources.push({ ...effect, sourceType: "effect" });
                names.add(name);
              }
            }
          });
          (c.itemNames || []).forEach((itemData) => {
            const name =
              typeof itemData === "string" ? itemData : itemData.name;
            if (name && !names.has(name)) {
              const item = allItems.find((i) => i.name === name);
              if (item) {
                sources.push({ ...item, sourceType: "item" });
                names.add(name);
              }
            }
          });
          return sources;
        };

        const allSelectedSources = getSourcesFromCombo(combo);

        // ★★★ 追加: リミット(侵蝕率制限)の計算ロジック ★★★
        let maxLimitVal = 0;
        allSelectedSources.forEach((s) => {
          if (!s.limit) return;
          // "↓"や"下"を含まず、数字+"%"を含むものを抽出 (例: 80%, 100%)
          if (
            s.limit.includes("%") &&
            !s.limit.includes("↓") &&
            !s.limit.includes("下")
          ) {
            const match = s.limit.match(/(\d+)%/);
            if (match) {
              const val = parseInt(match[1], 10);
              if (!isNaN(val) && val > maxLimitVal) {
                maxLimitVal = val;
              }
            }
          }
        });
        const maxLimit = maxLimitVal > 0 ? `${maxLimitVal}%` : null;
        // ★★★ 追加終わり ★★★

        const relevantEffects = allSelectedSources.filter(
          (s) => s.sourceType === "effect"
        );
        const relevantItems = allSelectedSources.filter(
          (s) => s.sourceType === "item"
        );

        const calcResult = (valueKey, sources) => {
          let totalDice = 0;
          let totalFixed = 0;
          const breakdown = [];

          const processSource = (source) => {
            if (!source.values?.[valueKey]) return;
            const effectiveLevel =
              (Number(source.level) || 0) + comboLevelBonus;

            let finalValue;
            if (valueKey === "dice") {
              const baseDice = Number(source.values.dice.base) || 0;
              const perLevelDice = Number(source.values.dice.perLevel) || 0;
              finalValue = {
                dice: baseDice + effectiveLevel * perLevelDice,
                fixed: 0,
              };
            } else {
              const baseParsed = this.evaluateDiceString(
                String(source.values[valueKey].base || "0")
              );
              const perLevelParsed = this.evaluateDiceString(
                String(source.values[valueKey].perLevel || "0")
              );
              finalValue = {
                dice: baseParsed.dice + effectiveLevel * perLevelParsed.dice,
                fixed: baseParsed.fixed + effectiveLevel * perLevelParsed.fixed,
              };
            }

            if (valueKey === "attack" && source.values.attack && !this.isZeroLike(source.values.attack.max)) {
              const maxValue = Number(source.values.attack.max);
              if (Number.isFinite(maxValue) && finalValue.dice === 0 && finalValue.fixed > maxValue) {
                finalValue.fixed = maxValue;
              }
            }

            if (finalValue.dice !== 0 || finalValue.fixed !== 0) {
              totalDice += finalValue.dice;
              totalFixed += finalValue.fixed;
              breakdown.push(
                `${source.name}(Lv${effectiveLevel}): ${this.formatDiceString(
                  finalValue
                )}`
              );
            }
          };

          sources.forEach(processSource);

          return {
            dice: totalDice,
            fixed: totalFixed,
            breakdown: breakdown.join("\n"),
          };
        };

        const diceResult = calcResult("dice", relevantEffects);
        const achieveResult = calcResult("achieve", relevantEffects);
        const atkResult = calcResult("attack", allSelectedSources);
        const accuracyResult = calcResult("accuracy", relevantItems);

        let critCorrectionTotal = 0;
        let critMinLimit = 10;
        const critBreakdown = [];
        allSelectedSources.forEach((source) => {
          this.migrateLegacyCritValue(source);
          if (!source.values?.crit) return;
          const effectiveLevel = source.level
            ? (Number(source.level) || 0) + comboLevelBonus
            : 0;
          const base = Number(source.values.crit.base) || 0;
          const perLevel = Number(source.values.crit.perLevel) || 0;
          const min = Number(source.values.crit.min) || 10;
          const correction = base + effectiveLevel * perLevel;
          if (correction !== 0) {
            critCorrectionTotal += correction;
            if (correction < 0) critMinLimit = Math.min(critMinLimit, min);
            const sourceValue = Math.max(10 + correction, min);
            critBreakdown.push(`${source.name}: ${correction >= 0 ? "+" : ""}${correction}（単体C${sourceValue} / 下限${min}）`);
          }
        });
        const critTotal = Math.max(10 + critCorrectionTotal, critMinLimit);

        const weaponAtk = this.evaluateDiceString(combo.atk_weapon || "0");
        const totalAtkDice = weaponAtk.dice + atkResult.dice;
        const totalAtkFixed = weaponAtk.fixed + atkResult.fixed;
        const atkBreakdown = [
          `武器ATK: ${this.formatDiceString(weaponAtk)}`,
          atkResult.breakdown,
        ].filter(Boolean);

        const totalDice = diceResult.dice + accuracyResult.dice;
        const totalAchieve = achieveResult.fixed + accuracyResult.fixed;

        return {
          ...combo,
          allSelectedSources: allSelectedSources, // ★これを追加
          maxLimit: maxLimit,
          baseValues: {
            dice: totalDice,
            achieve: totalAchieve,
            atkDice: totalAtkDice,
            atkFixed: totalAtkFixed,
            crit: critTotal,
            critCorrection: critCorrectionTotal,
            critMin: critMinLimit,
          },
          breakdowns: {
            dice: [diceResult.breakdown, accuracyResult.breakdown]
              .filter(Boolean)
              .join("\n"),
            achieve: [achieveResult.breakdown, accuracyResult.breakdown]
              .filter(Boolean)
              .join("\n"),
            atk: atkBreakdown.join("\n"),
            crit: critBreakdown.join("\n"),
          },
        };
      };

      const baseCombos = this.combos.map(calculateBaseCombo);

      return baseCombos.map((comboData, index) => {
        const currentCombo = this.combos[index];
        const comboLevelBonus = currentCombo.comboLevelBonus || 0;

        let finalDice = comboData.baseValues.dice;
        let finalAchieve = comboData.baseValues.achieve;
        let finalAtkDice = comboData.baseValues.atkDice;
        let finalAtkFixed = comboData.baseValues.atkFixed;
        let finalCritCorrection = comboData.baseValues.critCorrection || 0;
        let finalCritMin = comboData.baseValues.critMin || 10;
        let finalCrit = Math.max(10 + finalCritCorrection, finalCritMin);

        let diceBreakdown = [comboData.breakdowns.dice];
        let achieveBreakdown = [comboData.breakdowns.achieve];
        let atkBreakdown = [comboData.breakdowns.atk];
        let critBreakdown = [comboData.breakdowns.crit];

        if (currentCombo.appliedBuffs) {
          currentCombo.appliedBuffs.forEach((buffName) => {
            const buffComboData = baseCombos.find((b) => b.name === buffName);
            if (buffComboData) {
              finalDice += buffComboData.baseValues.dice;
              finalAchieve += buffComboData.baseValues.achieve;
              finalAtkDice += buffComboData.baseValues.atkDice;
              finalAtkFixed += buffComboData.baseValues.atkFixed;
              finalCritCorrection += buffComboData.baseValues.critCorrection || 0;
              finalCritMin = Math.min(finalCritMin, buffComboData.baseValues.critMin || 10);
              finalCrit = Math.max(10 + finalCritCorrection, finalCritMin);
              diceBreakdown.push(buffComboData.breakdowns.dice);
              achieveBreakdown.push(buffComboData.breakdowns.achieve);
              atkBreakdown.push(buffComboData.breakdowns.atk);
              critBreakdown.push(buffComboData.breakdowns.crit);
            }
          });
        }
        // ここで最終的な表示用の値を計算
        // const allSelectedSources = this._getRelevantEffects(currentCombo.effectNames); // ★この行を削除またはコメントアウト

        const allSelectedSources = comboData.allSelectedSources; // ★これを追加

        const normalizeTiming = (t) => {
          if (!t) return "-";
          let norm = t.replace(/[\s　]+/g, "");
          // "リアクション" が "リ" になってしまうのを防ぐ
          if (norm === "リアクション") return "リアクション";

          norm = norm.replace("アクション", "").replace("プロセス", "");
          if (norm.includes("メジャー") && norm.includes("リア")) {
            return "メジャー／リア";
          }
          return norm;
        };

        const getPriorityValue = (prop, defaultValue) => {
          const priorityOrder = {
            timing: [
              "メジャー／リア",
              "メジャー",
              "リアクション",
              "マイナー",
              "セットアップ",
              "イニシアチブ",
              "クリンナップ",
              "オート",
              "常時",
            ],
            range: ["視界", "武器", "至近"],
            target: [
              "自身",
              "単体",
              "2体",
              "3体",
              "[LV+1]体",
              "範囲(選択)",
              "範囲",
              "シーン(選択)",
              "シーン",
            ],
          };
          for (const p of priorityOrder[prop] || []) {
            if (
              allSelectedSources.some((s) => {
                const val = s[prop];
                return (prop === "timing" ? normalizeTiming(val) : val) === p;
              })
            )
              return p;
          }
          const firstValid = allSelectedSources.find(
            (s) => s[prop] && s[prop] !== "-"
          );
          if (!firstValid) return defaultValue;

          const val = firstValid[prop];
          return prop === "timing" ? normalizeTiming(val) : val;
        };

        const timing =
          currentCombo.timingMode === "auto"
            ? getPriorityValue("timing", "-")
            : normalizeTiming(currentCombo.manualTiming);
        const range =
          currentCombo.rangeMode === "auto"
            ? getPriorityValue("range", "-")
            : currentCombo.manualRange;
        const target =
          currentCombo.targetMode === "auto"
            ? getPriorityValue("target", "-")
            : currentCombo.manualTarget;

        const totalCost = allSelectedSources.reduce(
          (acc, s) => acc + (Number(s.cost) || 0),
          Number(currentCombo.cost_manual) || 0
        );
        const costBreakdown = allSelectedSources
          .map((s) => `${s.name}: ${s.cost || 0}`)
          .join("\n");

        const isMajorAction = [
          "メジャー",
          "メジャー／リア",
          "リアクション",
        ].includes(timing);

        const compositionText = allSelectedSources
          .map((s) => {
            const effectiveLevel =
              (Number(s.level) || 0) + (comboLevelBonus || 0);
            if (s.sourceType === "effect") {
              return `《${s.name}》Lv${effectiveLevel}`;
            } else if (s.sourceType === "item") {
              return `「${s.name}」`;
            }
            return s.name; // フォールバック
          })
          .join("、");

        // バフの表記を追加
        let fullCompositionText = compositionText;
        if (currentCombo.appliedBuffs && currentCombo.appliedBuffs.length > 0) {
          const buffText = currentCombo.appliedBuffs
            .map((b) => `[${b}]`)
            .join("+");
          fullCompositionText += (fullCompositionText ? "+" : "") + buffText;
        }

        const autoEffectText = allSelectedSources
          .map((s) => {
            // まずテキストを取得
            let rawText = s.effect || s.notes;

            // ★簡略化処理を実行
            let simplified = this.simplifyEffectText(rawText);

            // その後、[LV]などの計算処理を実行
            return this.evaluateEffectText(
              simplified,
              s.level,
              currentCombo.comboLevelBonus,
              currentCombo.enableAdvancedParsing
            );
          })
          .filter(Boolean)
          .join("\n");

        // --- チャットパレット生成ロジックを修正 ---

        const comboDisplayName = String(currentCombo.name || "").trim() || "コンボ名入れて！！！！";
        const line1 = `◆${comboDisplayName}`;
        const line2 = allSelectedSources
          .map((s) => {
            const baseLevel = Number(s.level) || 1;
            const bonusPart = comboLevelBonus > 0 ? `+${comboLevelBonus}` : "";
            return `《${s.name}》Lv${baseLevel}${bonusPart}`;
          })
          .join("+");
        const flavorText = String(currentCombo.flavor || "").trim();
        const line3 = flavorText ? `『${flavorText}』` : "";

        const mainEffect =
          allSelectedSources.find((s) =>
            ["メジャー", "リアクション", "メジャー／リア"].includes(s.timing)
          ) || allSelectedSources[0];
        const difficulty = mainEffect ? mainEffect.difficulty : "自動";
        const skill =
          currentCombo.baseAbility.skill ||
          (mainEffect ? mainEffect.skill : "-");

        // ▼▼▼ 変更: 能力値の決定ロジック (手動指定 > 技能からのマップ) ▼▼▼
        // 手動で指定されていればそれを、なければ技能から自動判別、それもなければデフォルト(肉体)
        const attributeName =
          currentCombo.baseAbility.statOverride ||
          this.skillToAbilityMap[skill] ||
          "肉体";

        // 詳細情報（ヘッダー用）には計算結果を残す。
        // エネミー出力ではCSVテンプレートに合わせ、侵蝕値/難易度/達成値は省いて簡潔にする。
        const attackText = this.formatDiceString({
          dice: finalAtkDice,
          fixed: finalAtkFixed,
        });
        const details = this.appMode === "enemy"
          ? [
              `タイミング:${timing}`,
              `技能:${skill}`,
              `対象:${target}`,
              `射程:${range}`,
              `ATK:${attackText}`,
              `C値:${finalCrit}`,
            ].join("　")
          : [
              `侵蝕値:${totalCost}`,
              `タイミング:${timing}`,
              `技能:${skill}`,
              `難易度:${difficulty}`,
              `対象:${target}`,
              `射程:${range}`,
              `攻撃力:${attackText}`,
              `達成値:${finalAchieve}`,
              `C値:${finalCrit}`,
            ].join("　");

        const effectDescription =
          currentCombo.effectDescriptionMode === "manual"
            ? currentCombo.manualEffectDescription
            : autoEffectText;

        const header = [line1, line2, line3, details, effectDescription]
          .filter(Boolean)
          .join("\n");

        // --- ダイス式の生成 ---
        // 要望: ({能力}+X)DX@C+{技能}+Y ◆コンボ名

        // 1. (能力値+侵蝕率D+ダイスボーナス)DX(C値)
        // ユーザー要望: ({精神}+{侵蝕率D}+0)DX7 の形式
        let diceFormula = `({${attributeName}}+{侵蝕率D}${
          finalDice >= 0 ? "+" : ""
        }${finalDice})DX${finalCrit}`;

        // 3. +{技能}
        if (skill !== "-") {
          diceFormula += `+{${skill}}`;
        }

        // 4. +達成値ボーナス
        if (finalAchieve !== 0) {
          diceFormula += `${finalAchieve >= 0 ? "+" : ""}${finalAchieve}`;
        }

        // 5. ◆コンボ名 (攻撃力などは含めない)
        diceFormula += ` ◆${comboDisplayName}`;

        const hasHiddenBuffs = allSelectedSources.some((s) => {
          const effectData = (currentCombo.effectNames || []).find(
            (e) => e.name === s.name
          );
          return effectData && effectData.showInComboName === false;
        });
        const hiddenBuffsTooltip = allSelectedSources
          .filter((s) => {
            const effectData = (currentCombo.effectNames || []).find(
              (e) => e.name === s.name
            );
            return effectData && effectData.showInComboName === false;
          })
          .map((s) => s.name)
          .join(", ");


        return {
          ...comboData,
          totalDice: finalDice,
          totalAchieve: finalAchieve,
          totalAtk: this.formatDiceString({
            dice: finalAtkDice,
            fixed: finalAtkFixed,
          }),
          finalCrit: finalCrit,
          diceBreakdown: diceBreakdown.filter(Boolean).join("\n"),
          achieveBreakdown: achieveBreakdown.filter(Boolean).join("\n"),
          atkBreakdown: atkBreakdown.filter(Boolean).join("\n"),
          critBreakdown: critBreakdown.filter(Boolean).join("\n"),
          // 不足していたプロパティを追加
          timing,
          range,
          target,
          totalCost,
          costBreakdown,
          isMajorAction,
          compositionText: fullCompositionText,
          autoEffectText,
          hasHiddenBuffs,
          hiddenBuffsTooltip,
          chatPalette: {
            header,
            diceFormula,
          },
        };
      });
    },
    activeModalTabLabel() {
      const activeTab = this.modalTabs.find(
        (tab) => tab.key === this.activeModalTab
      );
      return activeTab ? activeTab.label : "";
    },
  },
  watch: {
    appMode(value) {
      if (value === "enemy") this.setupEnemyModeDefaults(false);
      if (value === "pc") this.effectFieldsEditable = false;
    },
    enemySheet: {
      handler() {
        this.setDataDirty();
        try { localStorage.setItem("dx3EnemiesAuthor", String(this.enemySheet.author || "").trim()); } catch (_e) {}
      },
      deep: true,
    },
    enemyData: { handler: "setDataDirty", deep: true },
    characterName: { handler: "setDataDirty", deep: true },
    totalXp: { handler: "setDataDirty", deep: true },
    otherXp: { handler: "setDataDirty", deep: true },
    effects: {
      handler: function (newVal, oldVal) {
        this.handleEffectChange(newVal, oldVal);
        this.setDataDirty();
        this.syncAllData("effects", newVal);
      },
      deep: true,
    },
    easyEffects: {
      handler: function (newVal, oldVal) {
        this.handleEffectChange(newVal, oldVal);
        this.setDataDirty();
        this.syncAllData("easyEffects", newVal);
      },
      deep: true,
    },
    items: {
      handler: function (newVal, oldVal) {
        this.setDataDirty();
        this.syncAllData("items", newVal);
      },
      deep: true,
    },
    combos: {
      handler: function (newVal, oldVal) {
        this.setDataDirty();

        // 同期処理中であれば、再トリガーを防ぐ
        if (this.isSyncingComboLevel) return;

        // コンボの追加/削除時は同期処理を行わない
        if (!oldVal || newVal.length !== oldVal.length) return;

        let changedBonusValue = null;

        // 変更された comboLevelBonus を見つける
        for (let i = 0; i < newVal.length; i++) {
          if (newVal[i].comboLevelBonus !== oldVal[i].comboLevelBonus) {
            changedBonusValue = newVal[i].comboLevelBonus;
            break;
          }
        }

        // 変更が見つかった場合、他の全てのコンボにその値を適用する
        if (changedBonusValue !== null) {
          this.isSyncingComboLevel = true; // 同期処理開始
          this.$nextTick(() => {
            this.combos.forEach((combo, index) => {
              if (combo.comboLevelBonus !== changedBonusValue) {
                this.$set(
                  this.combos[index],
                  "comboLevelBonus",
                  changedBonusValue
                );
              }
            });
            this.isSyncingComboLevel = false; // 同期処理終了
          });
        }
      },
      deep: true,
    },
    characterSheetUrl: {
      handler: function (newVal, oldVal) {
        const normalizedUrl = this.normalizeCharacterSheetUrl(newVal);
        if (normalizedUrl && newVal !== normalizedUrl) {
          this.characterSheetUrl = normalizedUrl;
          return;
        }
        this.setDataDirty();
        this.generateShareUrl();
      },
    },
    enemySearch() {
      this.dx3EnemyPage = 1;
    },
    enemySearchField() {
      this.dx3EnemyPage = 1;
    },
    dx3EnemyPageSize() {
      this.dx3EnemyPage = 1;
    },
    "editingEffect.values.attack": {
      handler(newValue, oldValue) {
        if (
          this.editingEffectType === "item" &&
          this.editingEffect &&
          newValue
        ) {
          this.updateAttackFormula(this.editingEffect);
        }
      },
      deep: true,
    },
    "editingEffect.values.accuracy": {
      handler(newValue, oldValue) {
        if (
          this.editingEffectType === "item" &&
          this.editingEffect &&
          newValue
        ) {
          this.updateAccuracyFormula(this.editingEffect);
        }
      },
      deep: true,
    },
    "editingEffect.values.guard": {
      handler(newValue, oldValue) {
        if (
          this.editingEffectType === "item" &&
          this.editingEffect &&
          newValue
        ) {
          this.updateGuardFormula(this.editingEffect);
        }
      },
      deep: true,
    },
  },
  updated() {
    this.$nextTick(() => {
      this.adjustAllTextareaHeights();
    });
  },
  methods: {
    getEnemiesSharedApi() {
      return (typeof window !== "undefined" && (window.EnemiesShared || window.NechronicaShared)) || {};
    },
    showDx3EnemyToast(message, kind = "info") {
      const shared = this.getEnemiesSharedApi();
      if (shared && typeof shared.showToast === "function") {
        shared.showToast(String(message || ""), {
          kind,
          id: "copyToast",
          className: "copy-toast",
          errorClass: "is-error",
          showClass: "is-show",
          duration: 1800,
        });
        return;
      }
      if (message) console[kind === "error" ? "warn" : "log"](message);
    },
    switchAppMode(mode) {
      if (mode !== "pc" && mode !== "enemy") return;
      this.appMode = mode;
      if (mode === "enemy") {
        this.setupEnemyModeDefaults(false);
        this.loadDx3EnemyList().catch((error) => {
          console.warn("DX3 enemy list load failed", error);
        });
      } else {
        this.effectFieldsEditable = false;
        this.generateShareUrl();
      }
    },
    getErosionDice(erosion) {
      const n = Number(erosion);
      if (!Number.isFinite(n)) return 0;
      if (n < 60) return 0;
      if (n < 80) return 1;
      if (n < 100) return 2;
      if (n < 130) return 3;
      if (n < 160) return 4;
      if (n < 190) return 4;
      if (n < 220) return 5;
      if (n < 260) return 5;
      if (n < 300) return 6;
      return 7;
    },
    getDx3SyndromeAbilityMap() {
      return {
        "エンジェルハィロゥ": { body: 0, sense: 3, mind: 1, social: 0 },
        "エンジェルハイロゥ": { body: 0, sense: 3, mind: 1, social: 0 },
        "バロール": { body: 0, sense: 1, mind: 2, social: 1 },
        "ブラックドッグ": { body: 2, sense: 1, mind: 1, social: 0 },
        "ブラム＝ストーカー": { body: 1, sense: 2, mind: 1, social: 0 },
        "ブラム=ストーカー": { body: 1, sense: 2, mind: 1, social: 0 },
        "ブラムストーカー": { body: 1, sense: 2, mind: 1, social: 0 },
        "プラム＝ストーカー": { body: 1, sense: 2, mind: 1, social: 0 },
        "プラムストーカー": { body: 1, sense: 2, mind: 1, social: 0 },
        "キュマイラ": { body: 3, sense: 0, mind: 0, social: 1 },
        "エグザイル": { body: 2, sense: 1, mind: 0, social: 1 },
        "ハヌマーン": { body: 1, sense: 1, mind: 1, social: 1 },
        "モルフェウス": { body: 1, sense: 2, mind: 0, social: 1 },
        "ノイマン": { body: 0, sense: 0, mind: 3, social: 1 },
        "オルクス": { body: 0, sense: 1, mind: 1, social: 2 },
        "サラマンダー": { body: 2, sense: 0, mind: 1, social: 1 },
        "ソラリス": { body: 0, sense: 0, mind: 1, social: 3 },
        "ウロボロス": { body: 1, sense: 1, mind: 2, social: 0 },
        "アザトース": { body: 1, sense: 0, mind: 3, social: 0 },
        "ミストルティン": { body: 2, sense: 2, mind: 0, social: 0 },
        "グレイプニル": { body: 1, sense: 0, mind: 2, social: 1 },
      };
    },
    normalizeSyndromeName(name) {
      const raw = String(name || "").trim().replace(/=/g, "＝");
      const compact = raw.replace(/[\s　・･＝=ー－-]/g, "");
      const aliases = {
        "エンジェルハイロゥ": "エンジェルハィロゥ",
        "エンジェルハィロゥ": "エンジェルハィロゥ",
        "ブラムストーカー": "ブラム＝ストーカー",
        "プラムストーカー": "ブラム＝ストーカー",
        "ブラム＝ストーカー": "ブラム＝ストーカー",
        "プラム＝ストーカー": "ブラム＝ストーカー",
      };
      return aliases[raw] || aliases[compact] || raw;
    },
    getDx3EnemyBreedLabel(data = null) {
      const src = data || this.enemyData || {};
      const names = Array.isArray(src.syndromes)
        ? src.syndromes.map((name) => this.normalizeSyndromeName(name)).filter(Boolean)
        : [];
      if (names.length >= 3) return "トライブリード";
      if (names.length === 2) return "クロスブリード";
      if (names.length === 1) return "ピュアブリード";
      return "";
    },
    getDx3EnemySyndromeRow(name) {
      const map = this.getDx3SyndromeAbilityMap();
      const row = map[this.normalizeSyndromeName(name)] || {};
      return {
        body: Number(row.body) || 0,
        sense: Number(row.sense) || 0,
        mind: Number(row.mind) || 0,
        social: Number(row.social) || 0,
      };
    },
    getDx3EnemySyndromeRows(data = null) {
      const src = data || this.enemyData || {};
      const names = Array.isArray(src.syndromes) ? src.syndromes : ["", "", ""];
      const normalized = [0, 1, 2].map((index) => this.normalizeSyndromeName(names[index] || ""));
      const rows = [0, 1, 2].map((index) => this.getDx3EnemySyndromeRow(normalized[index] || ""));
      // ピュアブリード時は、能力値計算と同じくシンドローム①を2回分扱う。
      // 表示上もシンドローム②行に同じ値を出し、なぜ2倍になるかを見えるようにする。
      if (normalized[0] && !normalized[1]) {
        rows[1] = { ...rows[0] };
      }
      return rows;
    },
    getDx3EnemySyndromeAbilityBase(data = null) {
      const src = data || this.enemyData || {};
      const rows = this.getDx3EnemySyndromeRows(src);
      const names = Array.isArray(src.syndromes) ? src.syndromes.map((name) => this.normalizeSyndromeName(name)).filter(Boolean) : [];
      const useRows = names.length === 1 ? [rows[0], rows[0]] : rows.slice(0, 2);
      const total = { body: 0, sense: 0, mind: 0, social: 0 };
      useRows.forEach((row) => {
        total.body += Number(row.body) || 0;
        total.sense += Number(row.sense) || 0;
        total.mind += Number(row.mind) || 0;
        total.social += Number(row.social) || 0;
      });
      return total;
    },
    getDx3EnemyAbilityAdds(data = null) {
      const src = data || this.enemyData || {};
      const defaults = { body: 0, sense: 0, mind: 0, social: 0 };
      return { ...defaults, ...(src.abilityAdds || {}) };
    },
    getDx3EnemyAbilityGrowth(data = null) {
      const src = data || this.enemyData || {};
      const defaults = { body: 0, sense: 0, mind: 0, social: 0 };
      return { ...defaults, ...(src.abilityGrowth || {}) };
    },
    getDx3EnemyAbilityOther(data = null) {
      const src = data || this.enemyData || {};
      const defaults = { body: 0, sense: 0, mind: 0, social: 0 };
      return { ...defaults, ...(src.abilityOther || {}) };
    },
    getDx3EnemyTotalAbilities(data = null) {
      const base = this.getDx3EnemySyndromeAbilityBase(data);
      const other = this.getDx3EnemyAbilityOther(data);
      return {
        body: (Number(base.body) || 0) + (Number(other.body) || 0),
        sense: (Number(base.sense) || 0) + (Number(other.sense) || 0),
        mind: (Number(base.mind) || 0) + (Number(other.mind) || 0),
        social: (Number(base.social) || 0) + (Number(other.social) || 0),
      };
    },
    getDx3EnemyStatSet(data = null, key = "statBase") {
      const src = data || this.enemyData || {};
      const defaults = key === "statBase"
        ? { hp: 30, erosion: 100, initiative: 5, armor: 0, move: 10 }
        : { hp: 0, erosion: 0, initiative: 0, armor: 0, move: 0 };
      return { ...defaults, ...((src && src[key]) || {}) };
    },
    isDx3EnemyDerivedStatBase(key) {
      return ["hp", "initiative", "move"].includes(String(key || ""));
    },
    getDx3EnemyStatFormulaLabel(key) {
      const labels = {
        hp: "HP = 肉体×2 + 精神 + 20",
        initiative: "行動値 = 感覚×2 + 精神 + 補正",
        move: "移動力 = 行動値 + 5 + 補正",
        erosion: "侵蝕率 = 入力値（加算なし）",
        armor: "装甲 = 初期値 + 成長 + その他",
      };
      return labels[String(key || "")] || "初期値";
    },
    getDx3EnemyDerivedStatBase(key, data = null) {
      const abilities = this.getDx3EnemyTotalAbilities(data || this.enemyData);
      const statBase = this.getDx3EnemyStatSet(data, "statBase");
      const statOther = this.getDx3EnemyStatSet(data, "statOther");
      const body = Number(abilities.body) || 0;
      const sense = Number(abilities.sense) || 0;
      const mind = Number(abilities.mind) || 0;
      const initiativeBase = sense * 2 + mind;
      const initiative = initiativeBase + (Number(statOther.initiative) || 0);
      if (key === "hp") return body * 2 + mind + 20;
      if (key === "initiative") return initiativeBase;
      if (key === "move") return initiative + 5;
      return Number(statBase[key]) || 0;
    },
    parseDx3SignedNumber(value, fallback = 0) {
      const raw = String(value == null ? "" : value)
        .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
        .replace(/[＋]/g, "+")
        .replace(/[－ー―]/g, "-")
        .replace(/[，,]/g, "")
        .replace(/\s+/g, "");
      if (!raw) return fallback;
      const parts = raw.match(/[+-]?\d+(?:\.\d+)?/g);
      if (!parts || parts.join("") !== raw) {
        const n = Number(raw);
        return Number.isFinite(n) ? Math.trunc(n) : fallback;
      }
      const total = parts.reduce((sum, part) => sum + Number(part || 0), 0);
      return Number.isFinite(total) ? Math.trunc(total) : fallback;
    },
    getDx3EnemyFinalStats(data = null) {
      const base = this.getDx3EnemyStatSet(data, "statBase");
      const other = this.getDx3EnemyStatSet(data, "statOther");
      const hpBase = this.getDx3EnemyDerivedStatBase("hp", data);
      const initiativeBase = this.getDx3EnemyDerivedStatBase("initiative", data);
      const initiative = initiativeBase + (Number(other.initiative) || 0);
      const moveBase = initiative + 5;
      return {
        hp: hpBase + (Number(other.hp) || 0),
        erosion: this.parseDx3SignedNumber(base.erosion, 0),
        initiative,
        armor: (Number(base.armor) || 0) + (Number(other.armor) || 0),
        move: moveBase + (Number(other.move) || 0),
      };
    },
    createDefaultDx3EnemySkillRows() {
      return [
        { name: "白兵", spec: "", ability: "肉体", level: 0, dice: 0, mod: 0, note: "" },
        { name: "回避", spec: "", ability: "肉体", level: 0, dice: 0, mod: 0, note: "" },
        { name: "射撃", spec: "", ability: "感覚", level: 0, dice: 0, mod: 0, note: "" },
        { name: "知覚", spec: "", ability: "感覚", level: 0, dice: 0, mod: 0, note: "" },
        { name: "RC", spec: "", ability: "精神", level: 0, dice: 0, mod: 0, note: "" },
        { name: "意志", spec: "", ability: "精神", level: 0, dice: 0, mod: 0, note: "" },
        { name: "知識", spec: "", ability: "精神", level: 0, dice: 0, mod: 0, note: "" },
        { name: "交渉", spec: "", ability: "社会", level: 0, dice: 0, mod: 0, note: "" },
        { name: "調達", spec: "", ability: "社会", level: 0, dice: 0, mod: 0, note: "" },
        { name: "情報", spec: "裏社会", ability: "社会", level: 0, dice: 0, mod: 0, note: "" },
      ];
    },
    mergeDx3EnemySkillRowsWithDefaults(rows = []) {
      const sourceRows = Array.isArray(rows) ? rows : [];
      const used = new Set();
      const rowKey = (row) => {
        const name = String((row && row.name) || "").trim();
        const spec = String((row && row.spec) || "").trim();
        return `${name}::${spec}`;
      };
      const merged = this.createDefaultDx3EnemySkillRows().map((base) => {
        const exactKey = rowKey(base);
        let idx = sourceRows.findIndex((row, i) => !used.has(i) && rowKey(row) === exactKey);
        if (idx < 0 && this.isDx3EnemyFixedNoSpecSkill(base)) {
          idx = sourceRows.findIndex((row, i) => !used.has(i) && String((row && row.name) || "").trim() === base.name);
        }
        if (idx < 0) return { ...base };
        used.add(idx);
        return { ...base, ...sourceRows[idx], isCustom: false };
      });
      sourceRows.forEach((row, index) => {
        if (used.has(index)) return;
        if (!row || !String(row.name || "").trim()) return;
        merged.push({ ...row, isCustom: row.isCustom !== false });
      });
      return merged;
    },
    createDefaultDx3EnemyData() {
      return {
        nameKana: "",
        codename: "",
        codenameKana: "",
        breed: "",
        syndromes: ["", "", ""],
        explanation: "",
        tactics: "",
        hp: 30,
        initiative: 5,
        armor: 0,
        guard: 0,
        move: 10,
        erosion: 100,
        erosionDice: 3,
        addErosionDiceToAbilityTotal: false,
        hideStatus: false,
        secret: false,
        hpAsDamage: false,
        abilities: { body: 0, sense: 0, mind: 0, social: 0 },
        abilityAdds: { body: 0, sense: 0, mind: 0, social: 0 },
        abilityGrowth: { body: 0, sense: 0, mind: 0, social: 0 },
        abilityOther: { body: 0, sense: 0, mind: 0, social: 0 },
        statBase: { hp: 30, erosion: 100, initiative: 5, armor: 0, move: 10 },
        statGrowth: { hp: 0, erosion: 0, initiative: 0, armor: 0, move: 0 },
        statOther: { hp: 0, erosion: 0, initiative: 0, armor: 0, move: 0 },
        skills: { "白兵": 0, "射撃": 0, RC: 0, "交渉": 0 },
        skillRows: this.createDefaultDx3EnemySkillRows(),
      };
    },
    createDx3EnemySampleEffect({
      name = "",
      level = 1,
      maxLevel = 1,
      timing = "",
      skill = "",
      difficulty = "対決",
      target = "",
      range = "",
      cost = "",
      limit = "",
      effect = "",
      notes = "",
      diceBase = 0,
      dicePerLevel = 0,
      attackBase = 0,
      attackPerLevel = 0,
      achieveBase = 0,
      achievePerLevel = 0,
      critBase = 0,
      critPerLevel = 0,
      critMin = 10,
    } = {}) {
      const effectRow = {
        ...this.createDefaultEffect(),
        name,
        level,
        maxLevel,
        timing,
        skill,
        difficulty,
        target,
        range,
        cost,
        limit,
        effect,
        notes,
      };
      effectRow.values.dice.base = diceBase;
      effectRow.values.dice.perLevel = dicePerLevel;
      effectRow.values.attack.base = attackBase;
      effectRow.values.attack.perLevel = attackPerLevel;
      effectRow.values.achieve.base = achieveBase;
      effectRow.values.achieve.perLevel = achievePerLevel;
      effectRow.values.crit.base = critBase;
      effectRow.values.crit.perLevel = critPerLevel;
      effectRow.values.crit.min = critMin;
      return effectRow;
    },
    createSpringKyojiSampleSet() {
      const effects = [
        this.createDx3EnemySampleEffect({
          name: "渇きの主",
          level: 2,
          maxLevel: 5,
          timing: "メジャー",
          skill: "白兵",
          target: "単体",
          range: "至近",
          effect: "このエフェクトを組み合わせた白兵攻撃では、対象の装甲値を無視してダメージを算出する。命中した場合、あなたのHPを[LV×4]点回復する。ただし、この攻撃は素手か《赫き剣》によるものでなければならない。",
        }),
        this.createDx3EnemySampleEffect({
          name: "吸収",
          level: 2,
          maxLevel: 3,
          timing: "メジャー",
          skill: "白兵/射撃",
          target: "-",
          range: "武器",
          effect: "このエフェクトを組み合わせた攻撃で1点でもHPダメージを与えた場合、そのラウンドの間、対象が行なうあらゆる判定のダイスを-LV個する。",
        }),
        this.createDx3EnemySampleEffect({
          name: "オールレンジ",
          level: 2,
          maxLevel: 5,
          timing: "メジャー",
          skill: "白兵/射撃",
          target: "-",
          range: "武器",
          effect: "このエフェクトを組み合わせた判定のダイスを+LV個する。",
          dicePerLevel: 1,
        }),
        this.createDx3EnemySampleEffect({
          name: "イージスの盾",
          level: 2,
          maxLevel: 3,
          timing: "オート",
          skill: "-",
          target: "-",
          range: "至近",
          effect: "あなたがガードを行なう際に宣言する。このガードの間、あなたのガード値を+(LV)Dする。",
        }),
        this.createDx3EnemySampleEffect({
          name: "獣の力",
          level: 2,
          maxLevel: 5,
          timing: "メジャー",
          skill: "白兵",
          target: "-",
          range: "武器",
          effect: "このエフェクトを組み合わせた白兵攻撃の攻撃力を+[LV×2]する。",
          attackPerLevel: 2,
        }),
        this.createDx3EnemySampleEffect({
          name: "破壊の爪",
          level: 2,
          maxLevel: 5,
          timing: "マイナー",
          skill: "-",
          target: "自身",
          range: "至近",
          effect: "そのシーンの間あなたの素手のデータを以下のように変更する。\n種別：白兵　技能：＜白兵＞\n命中：0　攻撃力：[LV×2+8]\nガード値：1　射程：至近",
        }),
        this.createDx3EnemySampleEffect({
          name: "ハンティングスタイル",
          level: 2,
          maxLevel: 3,
          timing: "マイナー",
          skill: "-",
          target: "自身",
          range: "至近",
          effect: "あなたは戦闘移動を行なう。この移動では、離脱を行なえる。また、移動中に他のエンゲージに接触しても移動を終える必要はなく、封鎖の影響も受けない。このエフェクトは1シーンにLV回まで使用できる。",
        }),
        this.createDx3EnemySampleEffect({
          name: "コンセントレイト：キュマイラ",
          level: 3,
          maxLevel: 3,
          timing: "メジャー",
          skill: "シンドローム",
          target: "-",
          range: "-",
          effect: "組み合わせた判定のクリティカル値を-LVする(下限値7)。",
          critPerLevel: -1,
          critMin: 7,
        }),
        this.createDx3EnemySampleEffect({
          name: "蘇生復活",
          level: 1,
          maxLevel: 1,
          timing: "オート",
          skill: "-",
          target: "自身",
          range: "至近",
          effect: "重圧を受けていても使用可能。このエネミーが戦闘不能、死亡となった時に使用する。戦闘不能、死亡を回復し、このエネミーのHPを1点まで回復する。このエフェクトは1シナリオに1回まで使用できる。",
        }),
        this.createDx3EnemySampleEffect({
          name: "瞬間退場",
          level: 1,
          maxLevel: 3,
          timing: "オート",
          skill: "-",
          target: "自身",
          range: "至近",
          effect: "いつでも使用できる。このエフェクトを使用することで、このエネミーはシーンから退場する。このエフェクトは侵蝕率でレベルアップせず、1シナリオにLV回まで使用できる。",
        }),
      ];
      const combos = [
        {
          ...this.createDefaultCombo(),
          name: "不屈の一撃",
          effectNames: [
            { name: "吸収", showInComboName: true },
            { name: "オールレンジ", showInComboName: true },
            { name: "イージスの盾", showInComboName: true },
            { name: "破壊の爪", showInComboName: true },
            { name: "渇きの主", showInComboName: true },
          ],
          atk_weapon: 14,
          baseAbility: { skill: "-", statOverride: "肉体" },
          flavor: "ふははは！ 受けるダメージを減らしたいなら装甲値を上げるのが一番楽だぞ！ もっとも、私の《渇きの主》のように装甲値を無視する手段を持つ者も多いがなぁ！",
          manualEffectDescription: "《破壊の爪》による白兵攻撃。装甲値を無視してダメージを与える。命中した場合、自身のHPを[Lv×4]点回復。1点でもHPダメージを与えた場合、そのラウンドの間、対象の行なうあらゆる判定のダイスを2個する。",
          effectDescriptionMode: "manual",
          manualTiming: "メジャー",
          timingMode: "manual",
          manualTarget: "単体",
          targetMode: "manual",
          manualRange: "至近",
          rangeMode: "manual",
        },
      ];
      return { effects, combos };
    },
    loadDx3EnemySpringKyojiSample() {
      const hasExisting =
        String(this.enemySheet.name || "").trim() ||
        (Array.isArray(this.effects) && this.effects.some((effect) => effect && String(effect.name || "").trim())) ||
        (Array.isArray(this.combos) && this.combos.some((combo) => combo && String(combo.name || "").trim()));
      if (hasExisting && !window.confirm("現在のエネミーデータを春日恭二サンプルで上書きする？")) return;

      const rememberedAuthor = String(this.enemySheet.author || "").trim();
      const sample = this.createSpringKyojiSampleSet();
      this.enemySheet = {
        ID: "",
        author: rememberedAuthor,
        name: "春日恭二（作例）",
        class_type: "トライブリード",
        is_public: true,
        memo: "kasuga.csv由来のサンプルデータ",
        icon_url: "https://storage.ccfolia-cdn.net/users/kdAUSi9vTpPfd45w6r6mUySCu4A3/files/660ee8f2c902d5d80ae94ae923243f27b5afcd19bbd3b69d18d0f15dfd5d82a8",
        time: "",
      };
      this.enemyData = this.normalizeDx3EnemyData({
        nameKana: "カスガ　キョウジ",
        codename: "ディアボロス",
        codenameKana: "",
        breed: "トライブリード",
        syndromes: ["キュマイラ", "エグザイル", "ブラム＝ストーカー"],
        explanation: "悪魔の名を持つFHエージェント。N市にいるオーヴァード候補者を選別し、FHに連れて帰る任務の途中。",
        tactics: "最初のマイナーで《破壊の爪》+《ハンティングスタイル》を使用。白兵武器を作りつつ、PCの人数がもっとも多いエンゲージへ移動する。\nメジャーでは「不屈の一撃」を使用して、射程内にいるPCの中から、ランダムに1体を選択して攻撃する。\n攻撃に対しては、《イージスの盾》を使用してガードを行なう。《破壊の爪》を使用してからのガード値は1+2Dである。\nミドルの戦闘では一度HPが0になったら《蘇生復活》を使用し、即座に《瞬間退場》でいなくなる。",
        hp: 40,
        initiative: 12,
        armor: 0,
        guard: 1,
        move: 17,
        erosion: 120,
        statBase: { hp: 30, erosion: 120, initiative: 5, armor: 0, move: 10 },
        statGrowth: { hp: 0, erosion: 0, initiative: 0, armor: 0, move: 0 },
        statOther: { hp: 0, erosion: 0, initiative: 0, armor: 0, move: 0 },
        addErosionDiceToAbilityTotal: false,
        abilityAdds: { body: 0, sense: 0, mind: 0, social: 0 },
        abilityGrowth: { body: 0, sense: 0, mind: 0, social: 0 },
        abilityOther: { body: 0, sense: 0, mind: 0, social: 0 },
        skillRows: [
          { name: "白兵", spec: "", ability: "肉体", level: 4, dice: 0, mod: 0, note: "" },
          { name: "回避", spec: "", ability: "肉体", level: 3, dice: 0, mod: 0, note: "" },
          { name: "射撃", spec: "", ability: "感覚", level: 0, dice: 0, mod: 0, note: "" },
          { name: "知覚", spec: "", ability: "感覚", level: 3, dice: 0, mod: 0, note: "" },
          { name: "RC", spec: "", ability: "精神", level: 4, dice: 0, mod: 0, note: "" },
          { name: "意志", spec: "", ability: "精神", level: 3, dice: 0, mod: 0, note: "" },
          { name: "交渉", spec: "", ability: "社会", level: 0, dice: 0, mod: 0, note: "" },
          { name: "調達", spec: "", ability: "社会", level: 0, dice: 0, mod: 0, note: "" },
          { name: "情報", spec: "裏社会", ability: "社会", level: 1, dice: 0, mod: 0, note: "" },
        ],
      });
      this.effects = sample.effects;
      this.easyEffects = [];
      this.items = [];
      this.combos = sample.combos;
      this.effectFieldsEditable = true;
      this.effectDisplayMode = "combo";
      this.syncDx3EnemySkillMap();
      this.generateShareUrl();
      this.isDirty = true;
      this.showDx3EnemyToast("春日恭二サンプルを入れた", "info");
    },
    normalizeDx3EnemyData(data = {}) {
      const src = data && typeof data === "object" ? data : {};
      const defaults = this.createDefaultDx3EnemyData();
      const skillRows = Array.isArray(src.skillRows) && src.skillRows.length
        ? this.mergeDx3EnemySkillRowsWithDefaults(src.skillRows.map((row) => ({
            name: String((row && row.name) || ""),
            spec: String((row && row.spec) || ""),
            ability: String((row && row.ability) || "肉体"),
            level: Number((row && row.level) || 0),
            dice: Number((row && row.dice) || 0),
            mod: Number((row && row.mod) || 0),
            note: String((row && row.note) || ""),
            isCustom: !!(row && row.isCustom),
          })))
        : this.createDefaultDx3EnemySkillRows();
      return {
        ...defaults,
        ...src,
        nameKana: String(src.nameKana || ""),
        codename: String(src.codename || ""),
        codenameKana: String(src.codenameKana || ""),
        breed: String(src.breed || ""),
        syndromes: Array.isArray(src.syndromes) ? [src.syndromes[0] || "", src.syndromes[1] || "", src.syndromes[2] || ""] : ["", "", ""],
        explanation: String(src.explanation || src.memoForKoma || ""),
        tactics: String(src.tactics || src.gmMemo || ""),
        hp: Number(src.hp ?? defaults.hp) || 0,
        initiative: Number(src.initiative ?? defaults.initiative) || 0,
        armor: Number(src.armor ?? defaults.armor) || 0,
        guard: Number(src.guard ?? defaults.guard) || 0,
        move: Number(src.move ?? defaults.move) || 0,
        erosion: Number(src.erosion ?? defaults.erosion) || 0,
        erosionDice: this.getErosionDice(src.erosion ?? defaults.erosion),
        addErosionDiceToAbilityTotal: false,
        hideStatus: !!src.hideStatus,
        secret: !!src.secret,
        hpAsDamage: !!src.hpAsDamage,
        statBase: {
          ...defaults.statBase,
          ...((src.statBase && typeof src.statBase === "object") ? src.statBase : {
            hp: src.hp ?? defaults.statBase.hp,
            erosion: src.erosion ?? defaults.statBase.erosion,
            initiative: src.initiative ?? defaults.statBase.initiative,
            armor: src.armor ?? defaults.statBase.armor,
            move: src.move ?? defaults.statBase.move,
          }),
        },
        statGrowth: { ...defaults.statGrowth, ...((src.statGrowth && typeof src.statGrowth === "object") ? src.statGrowth : {}) },
        statOther: { ...defaults.statOther, ...((src.statOther && typeof src.statOther === "object") ? src.statOther : {}) },
        abilityAdds: { ...defaults.abilityAdds },
        abilityGrowth: { ...defaults.abilityGrowth },
        abilityOther: (() => {
          const other = { ...defaults.abilityOther, ...((src.abilityOther && typeof src.abilityOther === "object") ? src.abilityOther : {}) };
          const add = src.abilityAdds && typeof src.abilityAdds === "object" ? src.abilityAdds : null;
          const growth = src.abilityGrowth && typeof src.abilityGrowth === "object" ? src.abilityGrowth : null;
          [add, growth].forEach((obj) => {
            if (!obj) return;
            ["body", "sense", "mind", "social"].forEach((key) => {
              other[key] = (Number(other[key]) || 0) + (Number(obj[key]) || 0);
            });
          });
          const hasManualRows = !!(src.abilityOther || src.abilityAdds || src.abilityGrowth);
          const oldAbilities = src.abilities && typeof src.abilities === "object" ? src.abilities : null;
          if (!hasManualRows && oldAbilities) {
            const temp = { ...defaults, ...src };
            const base = this.getDx3EnemySyndromeAbilityBase(temp);
            ["body", "sense", "mind", "social"].forEach((key) => {
              other[key] = Math.max(0, (Number(oldAbilities[key]) || 0) - (Number(base[key]) || 0));
            });
          }
          return other;
        })(),
        abilities: { ...defaults.abilities },
        skills: { ...defaults.skills, ...(src.skills || {}) },
        skillRows,
      };
    },
    setupEnemyModeDefaults(forceReset = false) {
      this.effectFieldsEditable = true;
      this.effectDisplayMode = "combo";
      const hasOnlyInitialPcEffects =
        Array.isArray(this.effects) &&
        this.effects.length <= 3 &&
        this.effects.some((e) => e && e.name === "ワーディング") &&
        this.effects.some((e) => e && e.name === "リザレクト");
      if (forceReset || hasOnlyInitialPcEffects || !Array.isArray(this.effects) || this.effects.length === 0) {
        this.effects = [this.createDefaultEffect()];
      }
      if (!Array.isArray(this.easyEffects) || forceReset) this.easyEffects = [];
      if (!Array.isArray(this.items) || forceReset) this.items = [];
      if (!Array.isArray(this.combos) || this.combos.length === 0 || forceReset) this.combos = [this.createDefaultCombo()];
      if (!this.enemySheet || typeof this.enemySheet !== "object") {
        this.enemySheet = { ID: "", author: "", name: "", class_type: "DX3", is_public: true, memo: "", icon_url: "", time: "" };
      }
      this.enemyData = this.normalizeDx3EnemyData(this.enemyData);
      this.syncDx3EnemySkillMap();
      this.generateShareUrl();
    },
    syncDx3EnemySkillMap() {
      if (!this.enemyData || typeof this.enemyData !== "object") return;
      const nextSkills = {};
      (this.enemyData.skillRows || []).forEach((row) => {
        const key = this.getDx3EnemySkillLabel(row);
        if (!key) return;
        nextSkills[key] = (Number(row.level) || 0) + (Number(row.mod) || 0);
      });
      this.$set(this.enemyData, "skills", nextSkills);
    },
    addDx3EnemySkillRow() {
      if (!this.enemyData.skillRows) this.$set(this.enemyData, "skillRows", []);
      this.enemyData.skillRows.push({
        name: "",
        spec: "",
        ability: "肉体",
        level: 0,
        dice: 0,
        mod: 0,
        note: "",
        isCustom: true,
      });
    },
    canRemoveDx3EnemySkillRow(index, row) {
      const baseCount = this.createDefaultDx3EnemySkillRows().length;
      return Number(index) >= baseCount || !!(row && row.isCustom);
    },
    removeDx3EnemySkillRow(index) {
      if (!Array.isArray(this.enemyData.skillRows)) return;
      this.enemyData.skillRows.splice(index, 1);
      this.syncDx3EnemySkillMap();
    },
    handleDx3EnemySkillNameChange(row) {
      if (!row || !row.isCustom) return;
      const rawName = String(row.name || "").trim();
      const parts = rawName.split(/[：:]/);
      const name = String(parts[0] || "").trim();
      const selectedSpec = parts.length > 1 ? String(parts.slice(1).join(":") || "").trim() : "";
      const ability = this.skillToAbilityMap && this.skillToAbilityMap[name];
      const spec = this.enemySkillSpecDefaults && this.enemySkillSpecDefaults[name];
      if (name && name !== rawName) this.$set(row, "name", name);
      if (ability) this.$set(row, "ability", ability);
      if (parts.length > 1) {
        this.$set(row, "spec", selectedSpec);
      } else if (spec) {
        this.$set(row, "spec", spec);
      }
      this.syncDx3EnemySkillMap();
    },
    isDx3EnemyFixedNoSpecSkill(row) {
      const name = String((row && row.name) || "").trim();
      if (!name || (row && row.isCustom)) return false;
      return ["白兵", "射撃", "RC", "交渉", "回避", "知覚", "意志", "調達"].includes(name);
    },
    getDx3EnemySkillColorKey(row) {
      const ability = String((row && row.ability) || "").trim();
      if (ability === "肉体") return "body";
      if (ability === "感覚") return "sense";
      if (ability === "精神") return "mind";
      if (ability === "社会") return "social";
      return "other";
    },
    getDx3EnemySkillLabel(row) {
      const name = String((row && row.name) || "").trim();
      const spec = String((row && row.spec) || "").trim();
      if (!name) return "";
      return spec ? `${name}：${spec}` : name;
    },
    formatDx3EnemySkillOutput(row) {
      const ability = String((row && row.ability) || "肉体");
      const label = this.getDx3EnemySkillLabel(row);
      if (!label) return "";
      const dice = Number((row && row.dice) || 0);
      const fixed = (Number((row && row.level) || 0) + Number((row && row.mod) || 0));
      const dicePart = dice ? `${dice > 0 ? "+" : ""}${dice}` : "";
      const fixedPart = fixed ? `${fixed > 0 ? "+" : ""}${fixed}` : "+0";
      return `({${ability}}+{侵蝕率D}${dicePart})DX${fixedPart} 【${ability}】〈${label}〉`;
    },
    async copyDx3EnemyClipboardText(text) {
      const value = String(text == null ? "" : text);
      const shared = this.getEnemiesSharedApi();
      if (shared && typeof shared.writeClipboardText === "function") {
        await shared.writeClipboardText(value);
        return;
      }
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(value);
        return;
      }
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "readonly");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (!ok) throw new Error("clipboard unavailable");
    },
    async copyDx3EnemySkillOutput(row, event) {
      const shared = this.getEnemiesSharedApi();
      const getMessage = (key, fallback) =>
        shared && typeof shared.getMessage === "function" ? shared.getMessage(key) : fallback;
      const text = this.formatDx3EnemySkillOutput(row);
      if (!text) {
        this.showDx3EnemyToast(getMessage("skillOutputCopyEmpty", "コピーする技能出力がない"), "error");
        return;
      }
      const button = event && event.currentTarget;
      const originalHtml = button ? button.innerHTML : "";
      try {
        await this.copyDx3EnemyClipboardText(text);
        if (button) {
          button.innerHTML = '<i class="fa-solid fa-check"></i>';
          button.disabled = true;
          setTimeout(() => {
            button.innerHTML = originalHtml;
            button.disabled = false;
          }, 900);
        }
        this.showDx3EnemyToast(getMessage("skillOutputCopySuccess", "技能出力をコピーした"), "info");
      } catch (_error) {
        console.log(text);
        this.showDx3EnemyToast(getMessage("skillOutputCopyFailedConsole", "技能出力コピーに失敗。コンソールに出力する"), "error");
      }
    },
    buildDx3EnemyApiUrl(action, params = {}) {
      const shared = this.getEnemiesSharedApi();
      if (shared && typeof shared.buildApiUrl === "function") {
        return shared.buildApiUrl({
          baseUrl: this.gasWebAppUrl,
          tool: "dx3enemy",
          action,
          params,
        });
      }
      const base = String(this.gasWebAppUrl || "").replace(/\/+$/, "");
      if (!base) throw new Error("GAS API URLが未設定");
      const url = new URL(base);
      url.searchParams.set("tool", "dx3enemy");
      url.searchParams.set("action", action);
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        const text = String(value).trim();
        if (!text) return;
        url.searchParams.set(key, text);
      });
      return url.toString();
    },
    async fetchDx3EnemyJson(url, init = null) {
      const shared = this.getEnemiesSharedApi();
      if (shared && typeof shared.fetchApiJson === "function") {
        return shared.fetchApiJson(url, init);
      }
      const response = await fetch(url, init || undefined);
      const data = await this.readJsonResponse(response, "DX3エネミーAPI");
      if (!data || data.status === "error") {
        throw new Error((data && data.message) || "API応答が不正");
      }
      return data;
    },
    async readJsonResponse(response, label = "API") {
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (parseError) {
        const preview = String(text || "").replace(/[\r\n\t ]+/g, " ").trim().slice(0, 260);
        const responseUrl = String(response && response.url ? response.url : "");
        const gasEchoHint = responseUrl.includes("script.googleusercontent.com/macros/echo")
          ? "GASの実行結果URLにリダイレクトされています。デプロイ権限、例外ページ、またはHTML応答を確認してください。"
          : "JSONではなくHTML/テキストが返っている可能性があります。";
        throw new Error(`${label}がJSONを返しませんでした。${gasEchoHint}${preview ? ` 応答先頭: ${preview}` : ""}`);
      }
      if (!response.ok) {
        throw new Error((data && data.message) || `${label} HTTP ${response.status}`);
      }
      return data;
    },
    async loadDx3EnemyList() {
      const url = this.buildDx3EnemyApiUrl("listDX3Enemies", { includePrivate: "true" });
      const data = await this.fetchDx3EnemyJson(url);
      this.dx3EnemyList = Array.isArray(data.enemies) ? data.enemies : [];
      this.dx3EnemyPage = Math.min(this.dx3EnemyCurrentPage, this.dx3EnemyTotalPages);
      return this.dx3EnemyList;
    },
    setDx3EnemySort(key) {
      const normalizedKey = String(key || "time");
      if (this.dx3EnemySortKey === normalizedKey) {
        this.dx3EnemySortOrder = this.dx3EnemySortOrder === "asc" ? "desc" : "asc";
      } else {
        this.dx3EnemySortKey = normalizedKey;
        this.dx3EnemySortOrder = normalizedKey === "time" || normalizedKey === "id" ? "desc" : "asc";
      }
      this.dx3EnemyPage = 1;
    },
    dx3EnemySortButtonClass(key) {
      if (this.dx3EnemySortKey !== key) return "";
      return this.dx3EnemySortOrder === "asc" ? "is-active is-asc" : "is-active is-desc";
    },
    normalizeDx3EnemyPageSize() {
      const raw = Number(this.dx3EnemyPageSize);
      this.dx3EnemyPageSize = Number.isFinite(raw) && raw >= 0 ? Math.trunc(raw) : 10;
      this.dx3EnemyPage = 1;
    },
    setDx3EnemyPageSize(size) {
      this.dx3EnemyPageSize = Number(size) || 0;
      this.dx3EnemyPage = 1;
    },
    moveDx3EnemyPage(delta) {
      const next = this.dx3EnemyCurrentPage + Number(delta || 0);
      this.dx3EnemyPage = Math.min(Math.max(1, next), this.dx3EnemyTotalPages);
    },
    normalizeDx3EnemyRecord(enemy) {
      const src = enemy && typeof enemy === "object" ? enemy : {};
      const data = src.data && typeof src.data === "object" ? src.data : {};
      return {
        ID: String(src.ID || "").trim(),
        author: String(src.author || "").trim(),
        name: String(src.name || "").trim(),
        class_type: String(src.class_type || "ジャーム").trim() || "ジャーム",
        is_public: src.is_public !== false && String(src.is_public).toLowerCase() !== "false",
        memo: String(src.memo || ""),
        icon_url: String(src.icon_url || "").trim(),
        time: String(src.time || "").trim(),
        data,
      };
    },
    dx3EnemyListValue(enemy, key, fallback = "-") {
      const data = enemy && enemy.data && typeof enemy.data === "object" ? enemy.data : {};
      const value = data[key];
      if (value === null || value === undefined || value === "") return fallback;
      return value;
    },
    dx3EnemyListErosion(enemy) {
      const value = this.dx3EnemyListValue(enemy, "erosion", "-");
      return String(value || "-").replace(/%$/, "");
    },
    dx3EnemyCreditLabel(author) {
      const text = String(author || "").trim();
      return /^公式(?:[-－ー]|$)/.test(text) ? "出典" : "作者";
    },
    viewDx3EnemyFromList(enemy) {
      this.loadDx3Enemy(enemy);
      this.$nextTick(() => this.openDx3EnemyView());
    },
    exportDx3EnemyFromList(enemy) {
      this.loadDx3Enemy(enemy);
      this.$nextTick(() => this.exportDx3EnemyKomaJson());
    },
    loadDx3Enemy(enemy) {
      const normalized = this.normalizeDx3EnemyRecord(enemy);
      this.enemySheet = {
        ID: normalized.ID,
        author: normalized.author,
        name: normalized.name,
        class_type: normalized.class_type,
        is_public: normalized.is_public,
        memo: normalized.memo,
        icon_url: normalized.icon_url,
        time: normalized.time,
      };
      this.enemyData = this.normalizeDx3EnemyData(normalized.data || {});
      this.syncDx3EnemySkillMap();
      this.effects = Array.isArray(this.enemyData.effects) && this.enemyData.effects.length ? this.enemyData.effects : (Array.isArray(normalized.data.effects) && normalized.data.effects.length ? normalized.data.effects : [this.createDefaultEffect()]);
      this.easyEffects = Array.isArray(normalized.data.easyEffects) ? normalized.data.easyEffects : [];
      this.items = Array.isArray(normalized.data.items) ? normalized.data.items : [];
      this.combos = Array.isArray(normalized.data.combos) && normalized.data.combos.length ? normalized.data.combos : [this.createDefaultCombo()];
      [...this.effects, ...this.easyEffects, ...this.items].forEach((source) => this.ensureCoefficientValues(source));
      this.effectFieldsEditable = true;
      this.isDirty = false;
      this.showDx3EnemyToast("読み込んだ", "info");
    },
    newDx3Enemy() {
      this.enemySheet = { ID: "", author: this.enemySheet.author || "", name: "", class_type: "DX3", is_public: true, memo: "", icon_url: "", time: "" };
      this.enemyData = this.createDefaultDx3EnemyData();
      this.effects = [this.createDefaultEffect()];
      this.easyEffects = [];
      this.items = [];
      this.combos = [this.createDefaultCombo()];
      this.effectFieldsEditable = true;
      this.isDirty = false;
    },
    buildDx3EnemyPayload() {
      this.syncDx3EnemySkillMap();
      const finalStats = this.getDx3EnemyFinalStats(this.enemyData);
      const normalizedEnemyData = this.normalizeDx3EnemyData(this.enemyData);
      const data = {
        ...normalizedEnemyData,
        breed: this.getDx3EnemyBreedLabel(normalizedEnemyData),
        ...finalStats,
        erosionDice: this.getErosionDice(finalStats.erosion),
        abilities: this.getDx3EnemyTotalAbilities(this.enemyData),
        effects: this.effects || [],
        easyEffects: this.easyEffects || [],
        items: this.items || [],
        combos: this.combos || [],
      };
      return {
        ID: this.enemySheet.ID || "",
        author: this.enemySheet.author || "",
        name: this.enemySheet.name || "DX3エネミー",
        class_type: this.getDx3EnemyBreedLabel(data) || "DX3",
        is_public: this.enemySheet.is_public !== false,
        memo: data.tactics || this.enemySheet.memo || "",
        icon_url: this.enemySheet.icon_url || "",
        data,
      };
    },
    async saveDx3Enemy(saveAs = false) {
      try {
        this.isBusy = true;
        const enemy = this.buildDx3EnemyPayload();
        if (saveAs) enemy.ID = "";
        const data = await this.fetchDx3EnemyJson(this.buildDx3EnemyApiUrl("saveDX3Enemy"), {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ tool: "dx3enemy", action: "saveDX3Enemy", enemy }),
        });
        if (data.enemy) this.loadDx3Enemy(data.enemy);
        await this.loadDx3EnemyList();
        this.showDx3EnemyToast("保存した", "info");
      } catch (error) {
        console.error(error);
        this.showDx3EnemyToast(`保存失敗: ${error.message}`, "error");
      } finally {
        this.isBusy = false;
      }
    },
    async deleteDx3Enemy() {
      const id = String(this.enemySheet.ID || "").trim();
      if (!id) return;
      if (!window.confirm("このDX3エネミーを削除する？")) return;
      try {
        this.isBusy = true;
        const data = await this.fetchDx3EnemyJson(this.buildDx3EnemyApiUrl("deleteDX3Enemy", { id }));
        this.showDx3EnemyToast(data.message || "削除した", "info");
        this.newDx3Enemy();
        await this.loadDx3EnemyList();
      } catch (error) {
        console.error(error);
        this.showDx3EnemyToast(`削除失敗: ${error.message}`, "error");
      } finally {
        this.isBusy = false;
      }
    },
    shareDx3Enemy() {
      if (!this.enemySheet.ID) return;
      const url = new URL(window.location.href);
      url.searchParams.set("mode", "enemy");
      url.searchParams.set("enemy", this.enemySheet.ID);
      navigator.clipboard.writeText(url.toString()).then(
        () => this.showDx3EnemyToast("共有URLをコピーした", "info"),
        () => this.showDx3EnemyToast("共有URLコピーに失敗", "error"),
      );
    },
    openDx3EnemyView() {
      if (!this.enemySheet.ID) return;
      const url = new URL(window.location.href);
      url.searchParams.set("mode", "enemy");
      url.searchParams.set("enemy", this.enemySheet.ID);
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    },
    buildDx3EnemyCommands() {
      this.syncDx3EnemySkillMap();
      const lines = [];
      const skillRows = Array.isArray(this.enemyData.skillRows) ? this.enemyData.skillRows : [];
      skillRows.forEach((row) => {
        const output = this.formatDx3EnemySkillOutput(row);
        if (output) lines.push(output);
      });
      const combos = Array.isArray(this.comboDataList) ? this.comboDataList : [];
      if (combos.length) {
        if (lines.length) lines.push("");
        lines.push("//▼コンボデータ");
      }
      const slashN = String.fromCharCode(92, 110);
      combos.forEach((combo) => {
        const header = String((combo.chatPalette && combo.chatPalette.header) || "").split(/\r?\n/).filter(Boolean).join(slashN);
        const dice = String((combo.chatPalette && combo.chatPalette.diceFormula) || "").trim();
        if (header) lines.push(header);
        if (dice && combo.isMajorAction) lines.push(dice);
      });
      return lines.join("\n");
    },
    buildDx3EnemyKomaJson() {
      this.syncDx3EnemySkillMap();
      const name = String(this.enemySheet.name || "DX3エネミー").trim() || "DX3エネミー";
      const data = this.normalizeDx3EnemyData(this.enemyData || {});
      const breedLabel = this.getDx3EnemyBreedLabel(data);
      const abilities = this.getDx3EnemyTotalAbilities(data);
      const finalStats = this.getDx3EnemyFinalStats(data);
      const syndromes = (data.syndromes || []).map((x) => String(x || "").trim()).filter(Boolean);
      const memoParts = [];
      if (data.nameKana) memoParts.push(`(${data.nameKana})`);
      if (data.codename) memoParts.push(`コードネーム：${data.codename}${data.codenameKana ? `(${data.codenameKana})` : ""}`);
      if (breedLabel || syndromes.length) memoParts.push(`シンドローム：${[breedLabel, ...syndromes].filter(Boolean).join("、")}`);
      if (data.explanation) memoParts.push(String(data.explanation));
      const skillParams = [];
      (data.skillRows || []).forEach((row) => {
        const label = this.getDx3EnemySkillLabel(row);
        if (!label) return;
        if (skillParams.some((p) => p.label === label)) return;
        skillParams.push({ label, value: (Number(row.level) || 0) + (Number(row.mod) || 0) });
      });
      const hp = Number(finalStats.hp) || 0;
      const status = data.hpAsDamage
        ? [{ label: "与ダメ", value: 0, max: hp }]
        : [{ label: "HP", value: hp, max: hp }];
      const charJson = {
        kind: "character",
        data: {
          name,
          memo: memoParts.join("\n"),
          initiative: Number(finalStats.initiative) || 0,
          status,
          params: [
            { label: "肉体", value: Number(abilities.body) || 0 },
            { label: "感覚", value: Number(abilities.sense) || 0 },
            { label: "精神", value: Number(abilities.mind) || 0 },
            { label: "社会", value: Number(abilities.social) || 0 },
            { label: "装甲", value: Number(finalStats.armor) || 0 },
            { label: "ガード", value: Number(data.guard) || 0 },
            { label: "侵蝕率D", value: this.getErosionDice(finalStats.erosion) },
            { label: "移動力", value: Number(finalStats.move) || 0 },
            { label: "全力移動", value: (Number(finalStats.move) || 0) * 2 },
            ...skillParams,
          ],
          faces: [],
          color: "",
          secret: !!data.secret,
          hideStatus: !!data.hideStatus,
          commands: this.buildDx3EnemyCommands(),
        },
      };
      if (this.enemySheet.icon_url) charJson.data.iconUrl = this.enemySheet.icon_url;
      return charJson;
    },
    async exportDx3EnemyKomaJson() {
      const shared = this.getEnemiesSharedApi();
      const getMessage = (key, fallback) =>
        shared && typeof shared.getMessage === "function" ? shared.getMessage(key) : fallback;
      const text = JSON.stringify(this.buildDx3EnemyKomaJson());
      try {
        await this.copyDx3EnemyClipboardText(text);
        this.showDx3EnemyToast(getMessage("komaJsonCopySuccess", "ココフォリアコマ出力をコピーした"), "info");
      } catch (_error) {
        console.log(text);
        this.showDx3EnemyToast(getMessage("komaJsonCopyFailedConsole", "コマ出力コピーに失敗。コンソールに出力する"), "error");
      }
    },
    setEffectDisplayMode(mode) {
      if (mode !== "combo" && mode !== "detail") return;
      this.effectDisplayMode = mode;
    },
    comboPlaceholderName(index) {
      return `コンボ${Number(index) + 1}`;
    },
    toggleEffectDisplayMode() {
      this.effectDisplayMode = this.effectDisplayMode === "combo" ? "detail" : "combo";
    },
    effectSourceText(source) {
      if (!source) return "";
      const parts = [];
      if (source.effect && String(source.effect).trim()) parts.push(String(source.effect).trim());
      if (source.notes && String(source.notes).trim()) parts.push(String(source.notes).trim());
      return parts.join("\n");
    },
    ensureCoefficientValues(source) {
      if (!source.values) {
        this.$set(source, "values", this.createDefaultValues());
      }
      const defaults = this.createDefaultValues();
      ["dice", "achieve", "attack", "accuracy", "guard"].forEach((key) => {
        if (!source.values[key]) {
          this.$set(source.values, key, JSON.parse(JSON.stringify(defaults[key])));
        }
        if (key === "attack" && source.values[key].max === undefined) {
          this.$set(source.values[key], "max", "");
        }
      });
      if (!source.values.crit) {
        this.$set(source.values, "crit", JSON.parse(JSON.stringify(defaults.crit)));
      }
      this.migrateLegacyCritValue(source);
    },
    migrateLegacyCritValue(source) {
      if (!source || !source.values || !source.values.crit) return;
      const crit = source.values.crit;
      const base = Number(crit.base) || 0;
      const perLevel = Number(crit.perLevel) || 0;
      // 旧形式: base=10/perLevel=1 など「C値そのもの」を持つ形式。
      // 新形式: base=0/perLevel=-1 など「C値補正」を持つ形式。
      if (base >= 2 || perLevel > 0) {
        this.$set(crit, "base", base - 10);
        this.$set(crit, "perLevel", perLevel > 0 ? -Math.abs(perLevel) : perLevel);
        if (crit.min === undefined || crit.min === null || crit.min === "") this.$set(crit, "min", 10);
      }
    },
    isZeroLike(value) {
      if (value === null || value === undefined || value === "") return true;
      if (typeof value === "string") {
        const cleaned = value.trim().toUpperCase();
        return cleaned === "0" || cleaned === "0D";
      }
      return Number(value) === 0;
    },
    formatCoefficientTerm(base, perLevel, options = {}) {
      const parts = [];
      const addTerm = (value, text) => {
        if (this.isZeroLike(value)) return;
        const sign = String(value).trim().startsWith("-") ? "" : parts.length ? "+" : "";
        parts.push(`${sign}${text}`);
      };
      const baseText = String(base ?? "0").trim();
      addTerm(base, baseText);

      if (!this.isZeroLike(perLevel)) {
        const n = Number(perLevel);
        let text;
        if (!isNaN(n)) {
          const abs = Math.abs(n);
          text = abs === 1 ? "LV" : `LV*${abs}`;
          if (n < 0) text = `-${text}`;
          else if (parts.length) text = `+${text}`;
        } else {
          text = parts.length ? `+LV*${perLevel}` : `LV*${perLevel}`;
        }
        parts.push(text);
      }
      return parts.join("") || (options.blankAsDash ? "-" : "0");
    },
    coefficientSummary(source) {
      if (!source || !source.values) return "-";
      const v = source.values;
      const parts = [];
      const addNormal = (label, key) => {
        if (!v[key]) return;
        if (this.isZeroLike(v[key].base) && this.isZeroLike(v[key].perLevel)) return;
        parts.push(`${label}:${this.formatCoefficientTerm(v[key].base, v[key].perLevel)}`);
      };
      addNormal("ダイス", "dice");
      addNormal("達成値", "achieve");
      addNormal("ATK", "attack");
      if (v.attack && !this.isZeroLike(v.attack.max)) {
        const idx = parts.findIndex((p) => p.startsWith("ATK:"));
        if (idx >= 0) parts[idx] += `/最大${v.attack.max}`;
        else parts.push(`ATK:最大${v.attack.max}`);
      }
      if (v.crit) {
        this.migrateLegacyCritValue(source);
        const base = Number(v.crit.base) || 0;
        const per = Number(v.crit.perLevel) || 0;
        const min = v.crit.min ?? 10;
        if (base !== 0 || per !== 0 || Number(min) !== 10) {
          const terms = [];
          if (base !== 0) terms.push(`${base >= 0 ? "+" : ""}${base}`);
          if (per !== 0) terms.push(`${per >= 0 ? "+" : ""}${Math.abs(per) === 1 ? "LV" : `LV*${Math.abs(per)}`}${per < 0 ? "低下" : "上昇"}`);
          const text = `${terms.join(" ") || "0"}/下限${min}`;
          parts.push(`C値補正:${text}`);
        }
      }
      return parts.length ? parts.join(" / ") : "-";
    },

    coefficientCurrentValue(source, key) {
      if (!source || !source.values) return "-";
      const level = Number(source.level) || 0;
      if (key === "crit") {
        this.migrateLegacyCritValue(source);
        const crit = source.values.crit || {};
        const base = Number(crit.base) || 0;
        const perLevel = Number(crit.perLevel) || 0;
        const min = this.isZeroLike(crit.min) ? 10 : Number(crit.min);
        const correction = base + level * perLevel;
        const value = Math.max(10 + correction, Number.isFinite(min) ? min : 10);
        return String(value);
      }
      const value = source.values[key];
      if (!value) return "0";
      const baseParsed = this.evaluateDiceString(String(value.base || "0"));
      const perLevelParsed = this.evaluateDiceString(String(value.perLevel || "0"));
      const result = {
        dice: baseParsed.dice + level * perLevelParsed.dice,
        fixed: baseParsed.fixed + level * perLevelParsed.fixed,
      };
      if (key === "attack" && source.values.attack && !this.isZeroLike(source.values.attack.max)) {
        const maxValue = Number(source.values.attack.max);
        if (Number.isFinite(maxValue) && result.dice === 0 && result.fixed > maxValue) {
          result.fixed = maxValue;
        }
      }
      return this.formatDiceString(result);
    },
    safeEvalLinearFormula(formulaText) {
      if (!formulaText) return null;
      const normalized = String(formulaText)
        .replace(/[Ｌｌ]/g, "L")
        .replace(/[Ｖｖ]/g, "V")
        .replace(/[＋]/g, "+")
        .replace(/[－]/g, "-")
        .replace(/[×]/g, "*")
        .replace(/[÷]/g, "/")
        .replace(/\s+/g, "")
        .toUpperCase()
        .replace(/SL/g, "LV");
      if (!/^[0-9+\-*/().LV]+$/.test(normalized)) return null;
      try {
        const evalAt = (lv) => {
          const expr = normalized.replace(/LV/g, String(lv));
          // 入力は上のホワイトリストで四則演算と数値とLVだけに制限している。
          return Function(`"use strict"; return (${expr});`)();
        };
        const val0 = Number(evalAt(0));
        const val100 = Number(evalAt(100));
        if (!Number.isFinite(val0) || !Number.isFinite(val100)) return null;
        return { base: val0, perLevel: (val100 - val0) / 100 };
      } catch (e) {
        return null;
      }
    },
    inferEffectTextCoefficients(source) {
      const rawText = `${source?.effect || ""}\n${source?.notes || ""}`;
      const suggestions = {};
      const setSuggestion = (key, data) => {
        if (!key || !data) return;
        suggestions[key] = { ...(suggestions[key] || {}), ...data };
      };
      const normalizeText = (text) =>
        String(text || "")
          .replace(/[＋]/g, "+")
          .replace(/[－−ーｰ]/g, "-")
          .replace(/[×]/g, "*")
          .replace(/[÷]/g, "/")
          .replace(/[Ｌｌ]/g, "L")
          .replace(/[Ｖｖ]/g, "V")
          .replace(/[Ｓｓ]/g, "S")
          .replace(/[Ｄｄ]/g, "D");
      const normalizeFormula = (text) =>
        normalizeText(text)
          .replace(/ＳＬ|SL/gi, "LV")
          .replace(/ＬＶ|LV/gi, "LV")
          .replace(/^\((.*)\)$/u, "$1")
          .replace(/^[\[［](.*)[\]］]$/u, "$1")
          .trim();
      const parseLinearTerm = (text) => {
        const formula = normalizeFormula(text);
        if (!formula) return null;
        const parsed = this.safeEvalLinearFormula(formula);
        if (!parsed) return null;
        return {
          base: Number(parsed.base) || 0,
          perLevel: Number(parsed.perLevel) || 0,
        };
      };
      const applySignedTerm = (key, sign, term, extra = {}) => {
        const parsed = parseLinearTerm(term);
        if (!parsed) return false;
        const mult = sign === "-" ? -1 : 1;
        setSuggestion(key, {
          base: parsed.base * mult,
          perLevel: parsed.perLevel * mult,
          ...extra,
        });
        return true;
      };
      const applySignedTermWithOptionalDice = (key, sign, term, extra = {}) => {
        const normalizedTerm = normalizeText(term).trim();
        const diceLike = /(?:DX|D)\s*$/i.test(normalizedTerm);
        const termBody = diceLike ? normalizedTerm.replace(/(?:DX|D)\s*$/i, "") : normalizedTerm;
        const parsed = parseLinearTerm(termBody);
        if (!parsed) return false;
        const mult = sign === "-" ? -1 : 1;
        const toCoefValue = (value) => {
          const n = Number(value) * mult;
          if (!diceLike || key === "dice") return n;
          if (n === 0) return 0;
          const abs = Math.abs(n);
          return `${n < 0 ? "-" : ""}${abs === 1 ? "1" : abs}D`;
        };
        setSuggestion(key, {
          base: toCoefValue(parsed.base),
          perLevel: toCoefValue(parsed.perLevel),
          ...(diceLike && key !== "dice" ? { isDiceInput: true, isPerLevelDiceInput: true } : {}),
          ...extra,
        });
        return true;
      };
      const classifyTarget = (context, suffix = "") => {
        const c = String(context || "").toUpperCase();
        const sfx = String(suffix || "").toUpperCase();
        if (/C値|Ｃ値|クリティカル|コンセントレイト|リフレックス/.test(context)) return "crit";
        if (/攻撃力|ATK|ＡＴＫ|ダメージ|攻撃の/.test(context)) return "attack";
        if (/達成値|命中達成値|判定値/.test(context)) return "achieve";
        if (/ダイス|判定のダイス/.test(context)) return "dice";
        if (/命中/.test(context)) return "accuracy";
        if (/ガード|装甲/.test(context)) return "guard";
        if (/DX|個/.test(sfx)) return "dice";
        return null;
      };

      const normalizedRaw = normalizeText(rawText);
      const lines = normalizedRaw.split(/[\n。]/).map((line) => line.trim()).filter(Boolean);

      // コンセントレイト/リフレックスは効果文が省略されがちなので、名称・備考込みで強めに補正する。
      const nameAndNotes = normalizeText(`${source?.name || ""}\n${source?.notes || ""}\n${source?.effect || ""}`);
      if (/コンセントレイト|リフレックス/.test(nameAndNotes)) {
        setSuggestion("crit", { base: 0, perLevel: -1, min: 7 });
      }

      // [LV×2] / -[5-LV] / +[Lv+1]DX 形式。
      const bracketRegex = /([+\-]?)\s*[\[［](.*?)[\]］]\s*((?:DX|D|個|点)?)?/gi;
      let match;
      while ((match = bracketRegex.exec(normalizedRaw)) !== null) {
        const signStr = match[1] || "+";
        const formulaInner = match[2];
        const suffix = match[3] || "";
        const precedingText = normalizedRaw.substring(Math.max(0, match.index - 34), match.index);
        const targetType = classifyTarget(precedingText, suffix);
        if (!targetType) continue;
        if (targetType === "crit") {
          const parsed = parseLinearTerm(formulaInner);
          const per = parsed ? Math.abs(parsed.perLevel || parsed.base || 1) : 1;
          setSuggestion("crit", { base: 0, perLevel: -Math.abs(per || 1), min: 7 });
        } else {
          const isDiceMode = targetType !== "dice" && /D|DX/i.test(String(suffix));
          applySignedTerm(targetType, signStr === "-" ? "-" : "+", formulaInner, {
            ...(isDiceMode ? { isDiceInput: true, isPerLevelDiceInput: true } : {}),
          });
        }
      }

      lines.forEach((line) => {
        const maxMatch = line.match(/(?:最大|MAX|Max|max)\s*([+\-]?\d+)/);
        if (maxMatch && classifyTarget(line) === "attack") {
          setSuggestion("attack", { max: Number(maxMatch[1]) });
        }

        // 略記: ATK+Lv / ATK+10 / 攻撃力+SL*3 / 攻撃力+(SL×2)
        const attackRegex = /(?:ATK|攻撃力|攻撃の攻撃力)\s*(?:を|に|:)??\s*([+\-])\s*(\([^)]*\)\s*(?:DX|D)?|[\[［][^\]］]+[\]］]\s*(?:DX|D)?|(?:LV|SL)(?:\s*[*]\s*\d+)?\s*(?:DX|D)?|\d+\s*(?:DX|D)?)/gi;
        let attackMatch;
        while ((attackMatch = attackRegex.exec(line)) !== null) {
          applySignedTermWithOptionalDice("attack", attackMatch[1], attackMatch[2]);
        }

        // 略記: 命中達成値+[Lv+2] / 達成値+Lv*2
        const achieveRegex = /(?:命中達成値|達成値|判定値)\s*(?:を|に|:)??\s*([+\-])\s*(\([^)]*\)\s*(?:DX|D)?|[\[［][^\]］]+[\]］]\s*(?:DX|D)?|(?:LV|SL)(?:\s*[*]\s*\d+)?\s*(?:DX|D)?|\d+\s*(?:DX|D)?)/gi;
        let achieveMatch;
        while ((achieveMatch = achieveRegex.exec(line)) !== null) {
          applySignedTermWithOptionalDice("achieve", achieveMatch[1], achieveMatch[2]);
        }

        // 略記: +[Lv+1]DX / -1DX / ダイス+Lv個 / ダイスを-Lv個
        const diceRegex = /(?:ダイス|判定のダイス|判定ダイス|DX)\s*(?:を|に)?\s*([+\-])\s*(\([^)]*\)|[\[［][^\]］]+[\]］]|(?:LV|SL)(?:\s*[*]\s*\d+)?|\d+)\s*(?:DX|D|個)?|([+\-])\s*(\([^)]*\)|[\[［][^\]］]+[\]］]|(?:LV|SL)(?:\s*[*]\s*\d+)?|\d+)\s*(DX)/gi;
        let diceMatch;
        while ((diceMatch = diceRegex.exec(line)) !== null) {
          const sign = diceMatch[1] || diceMatch[3];
          const term = diceMatch[2] || diceMatch[4];
          applySignedTerm("dice", sign, term);
        }

        // C値-LV / C値-1 / クリティカル値を-LVする / 下限値6
        const cMatch = line.match(/(?:C値|Ｃ値|クリティカル値?|コンセントレイト|リフレックス).*?[-]\s*(LV|SL|\d+)/i);
        if (cMatch) {
          const token = cMatch[1].toUpperCase().replace("SL", "LV");
          const minMatch = line.match(/(?:下限値?|下限)\s*([0-9]+)/i);
          const minValue = minMatch ? Number(minMatch[1]) : 7;
          if (token === "LV") setSuggestion("crit", { base: 0, perLevel: -1, min: minValue });
          else setSuggestion("crit", { base: -Number(token || 0), perLevel: 0, min: minValue });
        }
      });
      return suggestions;
    },
    applyInferredCoefficientsToEffect(target, overwrite = false) {
      if (!target) return {};
      this.ensureCoefficientValues(target);
      const suggestions = this.inferEffectTextCoefficients(target);
      const updatedTabs = {};
      Object.keys(suggestions).forEach((key) => {
        const suggestion = suggestions[key];
        if (key === "crit") {
          const current = target.values.crit;
          const isEmpty = this.isZeroLike(current.base) && this.isZeroLike(current.perLevel);
          if (overwrite || isEmpty) {
            this.$set(current, "base", suggestion.base ?? 0);
            this.$set(current, "perLevel", suggestion.perLevel ?? -1);
            this.$set(current, "min", suggestion.min ?? 7);
            updatedTabs[key] = true;
          }
          return;
        }
        const current = target.values[key];
        if (!current) return;
        const isEmpty = this.isZeroLike(current.base) && this.isZeroLike(current.perLevel);
        if (overwrite || isEmpty) {
          this.$set(current, "base", suggestion.base ?? 0);
          this.$set(current, "perLevel", suggestion.perLevel ?? 0);
          if (suggestion.isDiceInput !== undefined) this.$set(current, "isDiceInput", suggestion.isDiceInput);
          if (suggestion.isPerLevelDiceInput !== undefined) this.$set(current, "isPerLevelDiceInput", suggestion.isPerLevelDiceInput);
          if (suggestion.max !== undefined && key === "attack") this.$set(current, "max", suggestion.max);
          updatedTabs[key] = true;
        }
      });
      return updatedTabs;
    },
    applyEffectTextInference(overwrite = false) {
      if (!this.editingEffect) return;
      const suggestions = this.inferEffectTextCoefficients(this.editingEffect);
      const suggestionKeys = Object.keys(suggestions);
      const updatedTabs = this.applyInferredCoefficientsToEffect(this.editingEffect, overwrite);
      const updatedKeys = Object.keys(updatedTabs);
      this.modalTabs.forEach((tab) => {
        if (updatedTabs[tab.key]) this.$set(tab, "isAutoDetected", true);
      });
      if (updatedKeys.length > 0) {
        this.activeModalTab = updatedKeys[0];
        this.showStatus(overwrite ? "係数を上書き推定しました。" : "未設定の係数を推定しました。");
      } else if (suggestionKeys.length > 0 && !overwrite) {
        this.showStatus("推定候補はありますが、既存の係数を上書きしませんでした。必要なら『上書き推定』を使ってください。", true);
      } else {
        this.showStatus("反映できる係数候補がありません。ATK+Lv、+[Lv+1]DX、達成値+[Lv+2] などは手動入力できます。", true);
      }
    },
    inferencePreviewRows(suggestions = {}) {
      const labels = {
        dice: "ダイス",
        achieve: "達成値",
        attack: "ATK",
        crit: "C値",
        accuracy: "命中",
        guard: "ガード",
      };
      return Object.keys(suggestions).map((key) => {
        const s = suggestions[key] || {};
        let text;
        if (key === "crit") {
          const base = s.base ?? 0;
          const perLevel = s.perLevel ?? 0;
          const min = s.min ?? 7;
          text = `固定補正 ${base} / Lv毎 ${perLevel} / 下限 ${min}`;
        } else {
          const parts = [`固定値 ${s.base ?? 0}`, `Lv毎 ${s.perLevel ?? 0}`];
          if (key === "attack" && s.max !== undefined) parts.push(`最大 ${s.max}`);
          text = parts.join(" / ");
        }
        return { key, label: labels[key] || key, text };
      });
    },
    cloneCoefficientValues(values) {
      return JSON.parse(JSON.stringify(values || this.createDefaultValues()));
    },
    hasInferenceCandidate(target) {
      if (!target) return false;
      const suggestions = this.inferEffectTextCoefficients(target);
      return Object.keys(suggestions).length > 0;
    },
    getActionableInferenceKeys(target) {
      if (!target) return [];
      if (target._inferenceAccepted) return [];
      this.ensureCoefficientValues(target);
      const suggestions = this.inferEffectTextCoefficients(target);
      return Object.keys(suggestions).filter((key) => {
        const suggestion = suggestions[key] || {};
        if (key === "crit") {
          const current = target.values.crit || {};
          return this.isZeroLike(current.base) && this.isZeroLike(current.perLevel);
        }
        const current = target.values[key];
        if (!current) return true;
        if (this.isZeroLike(current.base) && this.isZeroLike(current.perLevel)) return true;
        if (key === "attack" && suggestion.max !== undefined && this.isZeroLike(current.max)) return true;
        return false;
      });
    },
    hasActionableInferenceCandidate(target) {
      return this.getActionableInferenceKeys(target).length > 0;
    },
    restoreLastInference(target) {
      if (!target || !target._lastInferenceBackup) {
        this.showStatus("戻せる推定履歴がありません。", true);
        return;
      }
      this.$set(target, "values", this.cloneCoefficientValues(target._lastInferenceBackup));
      this.$delete(target, "_lastInferenceBackup");
      this.$set(target, "_hasAutoUpdate", false);
      this.$set(target, "_inferenceAccepted", false);
      this.showStatus(`${target.name || "この行"} の係数を推定前に戻しました。`);
    },
    openRowEffectInference(target, overwrite = false) {
      if (!target) return;
      this.ensureCoefficientValues(target);
      const suggestions = this.inferEffectTextCoefficients(target);
      const suggestionKeys = Object.keys(suggestions);
      if (suggestionKeys.length === 0) {
        this.showStatus(`${target.name || "この行"} から反映できる係数候補がありません。`, true);
        return;
      }
      if (target._inferenceAccepted && !overwrite) {
        overwrite = true;
      }
      if (!overwrite && this.getActionableInferenceKeys(target).length === 0) {
        this.showStatus(`${target.name || "この行"} は既に反映済み、または未設定推定では変更不要です。`, true);
        return;
      }
      if (this.pendingInference.target) {
        this.$set(this.pendingInference.target, "_inferenceCandidate", false);
      }
      this.$set(target, "_inferenceCandidate", true);
      this.pendingInference = {
        show: true,
        target,
        targetName: target.name || "この行",
        overwrite,
        suggestions,
      };
    },
    acceptPendingInferenceCurrentValues() {
      const target = this.pendingInference.target;
      if (!target) {
        this.cancelRowEffectInference();
        return;
      }
      this.$set(target, "_inferenceCandidate", false);
      this.$set(target, "_inferenceAccepted", true);
      this.showStatus(`${target.name || "この行"} は現在の係数を正として扱います。必要なら「再推定」できます。`);
      this.pendingInference = {
        show: false,
        target: null,
        targetName: "",
        overwrite: false,
        suggestions: {},
      };
    },
    cancelRowEffectInference() {
      if (this.pendingInference.target) {
        this.$set(this.pendingInference.target, "_inferenceCandidate", false);
      }
      this.pendingInference = {
        show: false,
        target: null,
        targetName: "",
        overwrite: false,
        suggestions: {},
      };
    },
    confirmRowEffectInference() {
      const target = this.pendingInference.target;
      if (!target) {
        this.cancelRowEffectInference();
        return;
      }
      const backup = this.cloneCoefficientValues(target.values);
      const updatedTabs = this.applyInferredCoefficientsToEffect(target, this.pendingInference.overwrite);
      const updatedKeys = Object.keys(updatedTabs);
      this.$set(target, "_inferenceCandidate", false);
      if (updatedKeys.length > 0) {
        this.$set(target, "_lastInferenceBackup", backup);
        this.$set(target, "_hasAutoUpdate", true);
        this.$set(target, "_inferenceAccepted", false);
        this.showStatus(`${target.name || "この行"} の係数を推定しました。違う場合は「戻す」で推定前に戻せます。`);
      } else {
        this.showStatus(`${target.name || "この行"} は推定候補がありますが、既存の係数を上書きしませんでした。`, true);
      }
      this.pendingInference = {
        show: false,
        target: null,
        targetName: "",
        overwrite: false,
        suggestions: {},
      };
    },
    applyAllEffectTextInference(overwrite = false) {
      const targets = [...(this.effects || []), ...(this.easyEffects || [])].filter(Boolean);
      if (targets.length === 0) {
        this.showStatus("推定対象のエフェクトがありません。", true);
        return;
      }
      let updatedEffectCount = 0;
      let updatedFieldCount = 0;
      let candidateEffectCount = 0;
      targets.forEach((target) => {
        this.ensureCoefficientValues(target);
        const suggestions = this.inferEffectTextCoefficients(target);
        const suggestionKeys = Object.keys(suggestions);
        if (suggestionKeys.length > 0) candidateEffectCount += 1;
        const updatedTabs = this.applyInferredCoefficientsToEffect(target, overwrite);
        const updatedKeys = Object.keys(updatedTabs);
        if (updatedKeys.length > 0) {
          this.$set(target, "_inferenceAccepted", false);
          updatedEffectCount += 1;
          updatedFieldCount += updatedKeys.length;
        }
      });
      if (updatedEffectCount > 0) {
        this.showStatus(
          overwrite
            ? `係数を上書き推定しました（${updatedEffectCount}件 / ${updatedFieldCount}項目）。`
            : `未設定の係数を推定しました（${updatedEffectCount}件 / ${updatedFieldCount}項目）。`
        );
      } else if (candidateEffectCount > 0 && !overwrite) {
        this.showStatus("推定候補はありますが、既存の係数を上書きしませんでした。必要なら『上書き推定』を使ってください。", true);
      } else {
        this.showStatus("反映できる係数候補がありません。ATK+Lv、+[Lv+1]DX、達成値+[Lv+2] などは手動入力できます。", true);
      }
    },
    updateComboAbility(index) {
      const combo = this.combos[index];
      const skill = combo.baseAbility.skill;
      // マップから能力値を引く（なければ肉体をデフォルトに）
      const ability = this.skillToAbilityMap[skill] || "肉体";
      this.$set(combo.baseAbility, "statOverride", ability);
    },
    syncAllData(sourceType, sourceList) {
      if (this.isInitializing) return;

      const allLists = {
        effects: this.effects,
        easyEffects: this.easyEffects,
        items: this.items,
      };

      sourceList.forEach((sourceItem) => {
        if (!sourceItem.name) return;

        for (const targetType in allLists) {
          if (sourceType === targetType) continue;

          allLists[targetType].forEach((targetItem) => {
            if (targetItem.name === sourceItem.name) {
              const sourceValues = JSON.stringify(sourceItem.values);
              const targetValues = JSON.stringify(targetItem.values);
              if (sourceValues !== targetValues) {
                this.$set(targetItem, "values", JSON.parse(sourceValues));
              }
              if (targetItem.level !== sourceItem.level) {
                this.$set(targetItem, "level", sourceItem.level);
              }
            }
          });
        }
      });
    },
    updateAndSyncLevel(sourceType, index, value) {
      const newLevel = Number(value);
      if (isNaN(newLevel)) return;
      const item = this[sourceType][index];
      if (!item || Number(item.level) === newLevel) return;
      this.$set(item, "level", newLevel);
      this.syncEffectAndItemLevels(item.name, newLevel);
    },
    syncEffectAndItemLevels(changedName, newLevel) {
      if (!changedName || isNaN(newLevel)) return;
      const listsToSync = {
        effects: this.effects,
        easyEffects: this.easyEffects,
        items: this.items,
      };
      for (const listName in listsToSync) {
        listsToSync[listName].forEach((item) => {
          if (item.name === changedName && Number(item.level) !== newLevel) {
            this.$set(item, "level", newLevel);
          }
        });
      }
    },
    updateNameAndSync(sourceType, index, newName) {
      const item = this[sourceType][index];
      if (!item || item.name === newName) return;
      const oldName = item.name;
      this.$set(item, "name", newName);

      // oldNameが空文字列の場合は、同期処理を行わない
      if (oldName === "") {
        return;
      }

      const listsToUpdate = {
        effects: this.effects,
        easyEffects: this.easyEffects,
        items: this.items,
      };
      for (const listName in listsToUpdate) {
        listsToUpdate[listName].forEach((i) => {
          if (i !== item && i.name === oldName) {
            this.$set(i, "name", newName);
          }
        });
      }
      this.combos.forEach((combo) => {
        const updateNameInList = (list) => {
          if (!list) return null;
          const index = list.indexOf(oldName);
          if (index > -1) {
            const newList = [...list];
            newList[index] = newName;
            return newList;
          }
          return null;
        };
        const newEffectNames = updateNameInList(combo.effectNames);
        if (newEffectNames) {
          this.$set(combo, "effectNames", newEffectNames);
        }
        if (combo.itemNames) {
          const itemIndex = combo.itemNames.findIndex(
            (i) => i.name === oldName
          );
          if (itemIndex > -1) {
            this.$set(combo.itemNames[itemIndex], "name", newName);
          }
        }
      });
    },
    setDataDirty() {
      if (this.isInitializing) return;
      this.isDirty = true;
    },
    _parseItemFormula(formulaStr) {
      if (typeof formulaStr !== "string") return { base: "0", perLevel: "0" };
      const formula = formulaStr.replace(/\s/g, "");
      if (formula === "") return { base: "0", perLevel: "0" };

      const baseValue = this.evaluateDiceString(formula, 0);
      const valueAtLv1 = this.evaluateDiceString(formula, 1);

      const perLevelValue = {
        dice: valueAtLv1.dice - baseValue.dice,
        fixed: valueAtLv1.fixed - baseValue.fixed,
      };

      return {
        base: this.formatDiceString(baseValue),
        perLevel: this.formatDiceString(perLevelValue),
      };
    },
    parseAttackFormula(item) {
      if (!item || typeof item.attack !== "string") return;
      const parsed = this._parseItemFormula(item.attack);
      if (item.values.attack.base !== parsed.base) {
        this.$set(item.values.attack, "base", parsed.base);
      }
      if (item.values.attack.perLevel !== parsed.perLevel) {
        this.$set(item.values.attack, "perLevel", parsed.perLevel);
      }
    },
    parseAccuracyFormula(item) {
      if (!item || typeof item.accuracy !== "string") return;
      const parsed = this._parseItemFormula(item.accuracy);
      if (item.values.accuracy.base !== parsed.base) {
        this.$set(item.values.accuracy, "base", parsed.base);
      }
      if (item.values.accuracy.perLevel !== parsed.perLevel) {
        this.$set(item.values.accuracy, "perLevel", parsed.perLevel);
      }
    },
    parseGuardFormula(item) {
      if (!item || typeof item.guard !== "string") return;
      const parsed = this._parseItemFormula(item.guard);
      if (item.values.guard.base !== parsed.base) {
        this.$set(item.values.guard, "base", parsed.base);
      }
      if (item.values.guard.perLevel !== parsed.perLevel) {
        this.$set(item.values.guard, "perLevel", parsed.perLevel);
      }
    },
    updateAttackFormula(item) {
      if (!item || !item.values || !item.values.attack) return;
      const { base, perLevel } = item.values.attack;
      let formula = "";
      if (perLevel !== 0) {
        if (perLevel === 1) formula += "LV";
        else if (perLevel === -1) formula += "-LV";
        else formula += `LV*${perLevel}`;
      }
      if (base !== 0) {
        if (formula !== "" && base > 0) {
          formula += `+${base}`;
        } else {
          formula += `${base}`;
        }
      }
      if (item.attack !== formula) {
        this.$set(item, "attack", formula);
      }
    },
    updateAccuracyFormula(item) {
      if (!item || !item.values || !item.values.accuracy) return;
      const { base, perLevel } = item.values.accuracy;
      let formula = "";
      if (perLevel !== 0) {
        if (perLevel === 1) formula += "LV";
        else if (perLevel === -1) formula += "-LV";
        else formula += `LV*${perLevel}`;
      }
      if (base !== 0) {
        if (formula !== "" && base > 0) {
          formula += `+${base}`;
        } else {
          formula += `${base}`;
        }
      }
      if (item.accuracy !== formula) {
        this.$set(item, "accuracy", formula);
      }
    },
    updateGuardFormula(item) {
      if (!item || !item.values || !item.values.guard) return;
      const { base, perLevel } = item.values.guard;
      let formula = "";
      if (perLevel !== 0) {
        if (perLevel === 1) formula += "LV";
        else if (perLevel === -1) formula += "-LV";
        else formula += `LV*${perLevel}`;
      }
      if (base !== 0) {
        if (formula !== "" && base > 0) {
          formula += `+${base}`;
        } else {
          formula += `${base}`;
        }
      }
      if (item.guard !== formula) {
        this.$set(item, "guard", formula);
      }
    },
    handleEffectChange(newEffects, oldEffects) {
      if (!newEffects) return;
      newEffects.forEach((effect, index) => {
        const oldName = oldEffects?.[index]?.name;
        const newName = effect.name;
        if (newName !== oldName) {
          const name = (newName || "").toLowerCase();
          const isConcentrate =
            name.includes("コンセントレイト") ||
            name.includes("ｺﾝｾﾝﾄﾚｲﾄ") ||
            name.includes("コンセ") ||
            name.includes("リフレックス");
          if (isConcentrate) {
            effect.values.crit.base = 0;
            effect.values.crit.perLevel = -1;
            effect.values.crit.min = 7;
          }
        }
      });
    },
    addItem() {
      const newItem = {
        name: "",
        level: 1,
        type: "その他",
        skill: "-",
        accuracy: "",
        attack: "",
        guard: "",
        range: "至近",
        cost: "",
        xp: 0,
        notes: "",
        values: this.createDefaultValues(),
      };
      this.items.push(newItem);
    },
    removeItem(index) {
      this.items.splice(index, 1);
    },
    _getRelevantEffects(effectNames) {
      const allEffects = [...this.effects, ...this.easyEffects];
      if (!effectNames || !Array.isArray(effectNames)) {
        return [];
      }
      return effectNames
        .map((effectData) => {
          const name =
            typeof effectData === "string" ? effectData : effectData.name;
          if (!name || typeof name !== "string" || !name.trim()) return null;
          const trimmedName = name.trim();
          return allEffects.find(
            (effect) =>
              effect.name &&
              typeof effect.name === "string" &&
              effect.name.trim() === trimmedName
          );
        })
        .filter(Boolean);
    },
    showStatus(message, isError = false, duration = 2000) {
      this.toast.message = message;
      this.toast.isError = isError;
      this.toast.show = true;
      setTimeout(() => {
        this.toast.show = false;
      }, duration);
    },

    normalizeCharacterSheetUrl(urlText) {
      const raw = String(urlText || "").trim();
      if (!raw) return "";
      try {
        const url = new URL(raw.split("#")[0]);
        if (url.hostname.includes("charasheet.vampire-blood.net")) {
          const id = url.pathname.split("/").filter(Boolean).pop();
          return id ? `https://charasheet.vampire-blood.net/${id}` : raw.split("#")[0];
        }
        // yutorize系はDB側の移行に合わせ、ドメインを勝手に変換しない。
        return url.toString().split("#")[0];
      } catch (e) {
        return raw.split("#")[0];
      }
    },
    getCharacterSheetDbIds(urlText) {
      const canonical = this.normalizeCharacterSheetUrl(urlText);
      return canonical ? [canonical] : [];
    },
    normalizeCurrentCharacterSheetUrl() {
      const normalized = this.normalizeCharacterSheetUrl(this.characterSheetUrl);
      if (normalized && this.characterSheetUrl !== normalized) {
        this.characterSheetUrl = normalized;
      }
      return normalized;
    },
    async refreshSheetData() {
      if (!this.characterSheetUrl) {
        this.showStatus("キャラクターシートURLを入力してください。", true);
        return;
      }
      this.normalizeCurrentCharacterSheetUrl();
      await this.importFromSheet(true, false, "all");
    },
    validateInputs() {
      if (!this.characterSheetUrl) {
        this.showStatus("キャラクターシートのURLを入力してください。", true);
        return false;
      }
      return true;
    },
    async overwriteSave() {
      const confirmed = await this.showConfirmation(
        "データの上書き保存",
        "現在の内容でデータを上書き保存しますか？<br>（このURLのデータがなければ新規作成されます）"
      );
      if (
        !this.validateInputs() ||
        !this.gasWebAppUrl.startsWith("https://script.google.com/") ||
        !confirmed
      ) {
        if (!confirmed) this.showStatus("保存をキャンセルしました。");
        return;
      }
      this.normalizeCurrentCharacterSheetUrl();
      const dbId = this.normalizeCharacterSheetUrl(this.characterSheetUrl);
      this.isBusy = true;
      this.showStatus("保存中...", false, 0);
      this.generateShareUrl();
      const dataToSave = {
        characterName: this.characterName,
        totalXp: this.totalXp,
        otherXp: this.otherXp,
        effects: this.effects,
        easyEffects: this.easyEffects,
        items: this.items,
        combos: this.combos,
      };
      try {
        const response = await fetch(this.gasWebAppUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            // ▼▼▼ ここから修正 ▼▼▼
            tool: "comboGenerator", // どのツールからのリクエストかを示す
            action: "save", // 実行したいアクション
            // ▲▲▲ ここまで修正 ▲▲▲
            id: dbId,
            data: dataToSave,
            shareUrl: this.shareUrl,
          }),
        });
        const result = await this.readJsonResponse(response, "GAS保存API");
        if (result.status !== "success")
          throw new Error(result.message || "不明なエラー");
        this.showStatus("保存が完了しました！");
        this.isDirty = false;
      } catch (error) {
        console.error("Save Error:", error);
        this.showStatus(`保存エラー: ${error.message}`, true);
      } finally {
        this.isBusy = false;
      }
    },
    handleBeforeUnload(e) {
      if (this.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    },
    async deleteFromDb() {
      // ▼▼▼ 修正箇所: 未保存時のメッセージ追加 ▼▼▼
      let warning = "";
      if (this.isDirty) {
        warning =
          "<br><br>⚠️ <strong>注意: 現在の編集内容は保存されていません。</strong>";
      }

      const confirmed = await this.showConfirmation(
        "データの削除",
        `本当にこのURLのデータを削除しますか？<br>この操作は元に戻せません。<br><br>URL: ${this.characterSheetUrl}${warning}`
      );
      if (
        !this.validateInputs() ||
        !this.gasWebAppUrl.startsWith("https://script.google.com/") ||
        !confirmed
      ) {
        if (!confirmed) this.showStatus("削除をキャンセルしました。");
        return;
      }
      this.normalizeCurrentCharacterSheetUrl();
      const dbId = this.normalizeCharacterSheetUrl(this.characterSheetUrl);
      this.isBusy = true;
      this.showStatus("削除中...", false, 0);
      try {
        const response = await fetch(this.gasWebAppUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            // ▼▼▼ ここから修正 ▼▼▼
            tool: "comboGenerator", // どのツールからのリクエストかを示す
            action: "delete", // 実行したいアクション
            // ▲▲▲ ここまで修正 ▲▲▲
            id: dbId,
          }),
        });
        const result = await this.readJsonResponse(response, "GAS削除API");
        if (result.status === "success") {
          this.showStatus("削除しました。");
        } else if (result.status === "not_found") {
          this.showStatus("削除対象のデータは見つかりませんでした。", true);
        } else {
          throw new Error(result.message || "不明なエラー");
        }
      } catch (error) {
        console.error("Delete Error:", error);
        this.showStatus(`削除エラー: ${error.message}`, true);
      } finally {
        this.isBusy = false;
      }
    },
    async loadFromDb(skipConfirm = false) {
      if (!this.validateInputs()) return;
      this.normalizeCurrentCharacterSheetUrl();

      // ▼▼▼ 修正箇所: 未保存時のメッセージ分岐 ▼▼▼
      let confirmMsg =
        "現在の表示内容は破棄されます。DBからデータを読み込みますか？";
      if (this.isDirty) {
        confirmMsg =
          "⚠️ <strong>編集中のデータは保存されていません！</strong><br>読み込むと変更が失われます。<br>本当に読み込みますか？";
      }

      if (
        !skipConfirm &&
        !(await this.showConfirmation("DBからの読み込み", confirmMsg))
      ) {
        // ▲▲▲ 修正ここまで ▲▲▲
        this.showStatus("読み込みをキャンセルしました。");
        return;
      }
      const loadAbortSnapshot = {
        characterName: this.characterName,
        totalXp: this.totalXp,
        otherXp: this.otherXp,
        effects: JSON.parse(JSON.stringify(this.effects || [])),
        easyEffects: JSON.parse(JSON.stringify(this.easyEffects || [])),
        items: JSON.parse(JSON.stringify(this.items || [])),
        combos: JSON.parse(JSON.stringify(this.combos || [])),
        isDirty: this.isDirty,
      };

      this.isBusy = true;
      this.showStatus("DBにアクセス中...", false, 0);
      try {
        const candidateIds = this.getCharacterSheetDbIds(this.characterSheetUrl);
        let result = null;
        for (const id of candidateIds) {
          const url = new URL(this.gasWebAppUrl);
          url.searchParams.append("id", id);
          const response = await fetch(url);
          result = await this.readJsonResponse(response, "GAS読込API");
          if (result.status === "success") {
            if (this.characterSheetUrl !== id) this.characterSheetUrl = id;
            break;
          }
        }
        result = result || { status: "not_found" };
        if (result.status === "success") {
          const d = result.data;
          this.characterName = d.characterName || "名称未設定";
          this.totalXp = d.totalXp || 130;
          this.otherXp = d.otherXp || 0;
          this.effects = (d.effects || []).map((e) => ({
            ...this.createDefaultEffect(),
            ...e,
            level: Number(e.level) || 1,
            values: { ...this.createDefaultValues(), ...(e.values || {}) },
          }));
          this.easyEffects = (d.easyEffects || []).map((e) => ({
            ...this.createDefaultEffect(),
            ...e,
            level: Number(e.level) || 1,
            values: { ...this.createDefaultValues(), ...(e.values || {}) },
          }));
          this.items = (d.items || []).map((i) => ({
            ...i,
            level: Number(i.level) || 1,
            values: { ...this.createDefaultValues(), ...(i.values || {}) },
          }));
          [...this.effects, ...this.easyEffects, ...this.items].forEach((source) => {
            this.ensureCoefficientValues(source);
          });
          this.items.forEach((item) => {
            this.parseAttackFormula(item);
            this.parseAccuracyFormula(item);
            this.parseGuardFormula(item);
          });
          this.combos = (d.combos || []).map((c) => ({
            ...this.createDefaultCombo(),
            ...c,
          }));

          // ▼▼▼ 追加: 読み込みデータに能力値設定がない場合、技能から補完する ▼▼▼
          this.combos.forEach((combo) => {
            if (!combo.baseAbility.statOverride) {
              const skill = combo.baseAbility.skill || "白兵";
              combo.baseAbility.statOverride =
                this.skillToAbilityMap[skill] || "肉体";
            }
          });
          if (this.combos.length === 0) {
            this.addCombo();
          }
          this.isDirty = false;
          const updateType = await this.showUpdateOptions(
            "保存データの読み込み完了",
            "保存済みデータを読み込みました。<br>キャラクターシート側の最新内容も取り込む場合は、更新範囲を選んでください。<br><br><strong>どの選択でも、現在保存されているコンボデータは維持されます。</strong>"
          );

          if (updateType === "abort") {
            this.characterName = loadAbortSnapshot.characterName;
            this.totalXp = loadAbortSnapshot.totalXp;
            this.otherXp = loadAbortSnapshot.otherXp;
            this.effects = loadAbortSnapshot.effects;
            this.easyEffects = loadAbortSnapshot.easyEffects;
            this.items = loadAbortSnapshot.items;
            this.combos = loadAbortSnapshot.combos;
            this.isDirty = loadAbortSnapshot.isDirty;
            this.showStatus("読み込みをキャンセルしました。");
            return;
          }

          if (updateType === "all") {
            await this.importFromSheet(true, true, "all");
          } else if (updateType === "effects") {
            await this.importFromSheet(true, true, "effects");
          } else {
            this.showStatus("DBからデータを読み込みました。");
          }
          this.$nextTick(() => {
            this.detectAutoUpdateAvailable();
          });
        } else if (result.status === "not_found") {
          if (
            await this.showConfirmation(
              "新規データ引用",
              "DBにデータがありません。<br>キャラクターシートから新規にデータを引用しますか？"
            )
          ) {
            this.otherXp = 0;
            await this.importFromSheet(false, true);
          } else {
            this.showStatus("操作をキャンセルしました。");
          }
        } else {
          throw new Error(result.message || "不明なエラー");
        }
      } catch (error) {
        console.error("Load/Import Error:", error);
        this.showStatus(`エラー: ${error.message}`, true);
      } finally {
        this.isBusy = false;
      }
    },
    isYutoSheetUrl(url) {
      try {
        const u = new URL(url);
        return u.hostname.includes("yutorize.2-d.jp") || u.hostname.includes("yutorize.work");
      } catch (e) {
        return String(url || "").includes("yutorize.2-d.jp") || String(url || "").includes("yutorize.work");
      }
    },
    buildImportSummary(importedData, effectsCount, easyEffectsCount, itemsCount) {
      const xpLines = [];
      const total = importedData.expTotal ?? importedData.totalXp;
      const used = importedData.expUsed ?? importedData.usedXp;
      const rest = importedData.expRest ?? importedData.restXp;
      if (total !== undefined && total !== null && total !== "") xpLines.push(`・総経験点: ${total}`);
      if (used !== undefined && used !== null && used !== "") xpLines.push(`・使用経験点: ${used}`);
      if (rest !== undefined && rest !== null && rest !== "") xpLines.push(`・残経験点: ${rest}`);
      if (xpLines.length === 0 && importedData.totalXp !== undefined) xpLines.push(`・経験点: ${importedData.totalXp}`);
      return [
        ...xpLines,
        `・エフェクト: ${effectsCount}件`,
        `・イージーエフェクト: ${easyEffectsCount}件`,
        `・アイテム: ${itemsCount}件`,
      ].join("<br>");
    },
    async importFromSheet(
      mergeMode = false,
      skipConfirmation = false,
      importType = "all"
    ) {
      if (!this.characterSheetUrl) {
        this.showStatus("キャラクターシートのURLを入力してください。", true);
        return;
      }
      this.isBusy = true;
      this.showStatus("キャラシから引用中...", false, 0);
      const existingValues = new Map();
      if (mergeMode) {
        [...this.effects, ...this.easyEffects, ...this.items].forEach(
          (item) => {
            if (item.name) {
              existingValues.set(item.name, item.values);
            }
          }
        );
      }
      try {
        let importedData;
        if (this.isYutoSheetUrl(this.characterSheetUrl)) {
          importedData = await this.importFromYutoSheet_direct(
            this.characterSheetUrl
          );
        } else if (
          this.characterSheetUrl.includes("charasheet.vampire-blood.net")
        ) {
          importedData = await this.importFromHokanjo_gas(
            this.characterSheetUrl
          );
        } else {
          throw new Error("サポートされていないURLです。");
        }
        const effectsCount = (importedData.effects || []).length;
        const easyEffectsCount = (importedData.easyEffects || []).length;
        const itemsCount = (importedData.items || []).length;
        const confirmMessage = mergeMode
          ? `以下の内容でキャラクター名、経験点、エフェクト、アイテムを更新しますか？\n（コンボデータは維持されます）\n\n`
          : `「${importedData.characterName}」のデータを新規に引用しますか？\n（現在のデータは全て上書きされます）\n\n`;
        if (
          !skipConfirmation &&
          !(await this.showConfirmation(
            mergeMode ? "データ更新の確認" : "新規引用の確認",
            confirmMessage +
              this.buildImportSummary(importedData, effectsCount, easyEffectsCount, itemsCount)
          ))
        ) {
          this.showStatus("引用をキャンセルしました。");
          this.isBusy = false;
          return;
        }
        this.characterName = importedData.characterName;
        this.totalXp = importedData.totalXp;
        if (!mergeMode) {
          this.otherXp = 0;
          this.combos = (importedData.combos && importedData.combos.length)
            ? importedData.combos.map((c) => ({ ...this.createDefaultCombo(), ...c }))
            : [];
          if (this.combos.length === 0) this.addCombo();
        }
        const defaultEffects = this.effects.filter((e) =>
          this.isEssentialEffect(e.name)
        );
        const importedEffects = (importedData.effects || []).map((e) => ({
          ...this.createDefaultEffect(),
          ...e,
          values:
            mergeMode && existingValues.get(e.name)
              ? { ...this.createDefaultValues(), ...existingValues.get(e.name) }
              : this.createDefaultValues(),
        }));
        const mergedEffects = [...defaultEffects];
        importedEffects.forEach((imported) => {
          const existingIndex = mergedEffects.findIndex(
            (e) => e.name === imported.name
          );
          if (existingIndex > -1) {
            mergedEffects[existingIndex] = imported;
          } else {
            mergedEffects.push(imported);
          }
        });
        this.effects = mergedEffects;
        this.easyEffects = (importedData.easyEffects || []).map((e) => ({
          ...this.createDefaultEffect(),
          ...e,
          values:
            mergeMode && existingValues.get(e.name)
              ? { ...this.createDefaultValues(), ...existingValues.get(e.name) }
              : this.createDefaultValues(),
        }));
        const defaultItem = {
          name: "",
          level: 1,
          type: "その他",
          skill: "-",
          accuracy: "",
          attack: "",
          guard: "",
          range: "至近",
          cost: "",
          xp: 0,
          notes: "",
        };
        if (importType === "all") {
          this.items = (importedData.items || []).map((i) => ({
            ...defaultItem,
            ...i,
            values:
              mergeMode && existingValues.get(i.name)
                ? {
                    ...this.createDefaultValues(),
                    ...existingValues.get(i.name),
                  }
                : this.createDefaultValues(),
          }));
          this.items.forEach((item) => {
            this.parseAttackFormula(item);
            this.parseAccuracyFormula(item);
            this.parseGuardFormula(item);
          });
        }
        let statusMessage = "キャラクターシートからデータを引用しました！";
        if (mergeMode) {
          if (importType === "all") {
            statusMessage = "エフェクトとアイテムを更新しました！";
          } else {
            statusMessage = "エフェクトを更新しました！";
          }
        }
        this.showStatus(statusMessage);
        this.isDirty = false;
        this.$nextTick(() => {
          this.detectAutoUpdateAvailable();
        });
      } catch (error) {
        console.error("Import Error:", error);
        this.showStatus(`引用エラー: ${error.message}`, true, 6000);
      } finally {
        this.isBusy = false;
      }
    },
    async fetchYutoJson(yutoJsonUrl) {
      const fetchJson = async (fetchUrl, label) => {
        const response = await fetch(fetchUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`${label} ステータス: ${response.status}`);
        }
        return await this.readJsonResponse(response, label);
      };
      try {
        return await fetchJson(yutoJsonUrl, "直接取得");
      } catch (directError) {
        console.warn("YutoSheet direct fetch failed. Trying CORS proxy.", directError);
      }
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(yutoJsonUrl)}`;
      try {
        return await fetchJson(proxyUrl, "プロキシ取得");
      } catch (proxyError) {
        console.error("YutoSheet proxy fetch failed.", proxyError);
        throw new Error(
          "ゆとシートJSONを取得できませんでした。CORS制限、プロキシ不調、またはシートの公開設定を確認してください。"
        );
      }
    },
    async importFromYutoSheet_direct(url) {
      const yutoUrl = new URL(url);
      yutoUrl.searchParams.set("mode", "json");
      const jsonData = await this.fetchYutoJson(yutoUrl.toString());
      const effects = [];
      const easyEffects = [];
      const items = [];
      const effectNum = parseInt(jsonData.effectNum, 10) || 0;
      for (let i = 1; i <= effectNum; i++) {
        const nameKey = `effect${i}Name`;
        if (jsonData[nameKey]) {
          const effect = {
            name: this.normalizeImportedString(jsonData[nameKey]),
            level: parseInt(jsonData[`effect${i}Lv`], 10) || 1,
            maxLevel: 5,
            timing: this.normalizeSkillName(
              this.normalizeImportedString(jsonData[`effect${i}Timing`])
            ),
            skill: this.normalizeSkillName(
              this.normalizeImportedString(jsonData[`effect${i}Skill`])
            ),
            difficulty:
              this.normalizeImportedString(jsonData[`effect${i}Dfclty`]) ||
              "自動",
            target:
              this.normalizeImportedString(jsonData[`effect${i}Target`]) || "",
            range:
              this.normalizeImportedString(jsonData[`effect${i}Range`]) || "",
            cost:
              this.normalizeImportedString(jsonData[`effect${i}Encroach`]) ||
              "",
            limit:
              this.normalizeImportedString(jsonData[`effect${i}Restrict`]) ||
              "",
            effect:
              this.normalizeImportedString(jsonData[`effect${i}Note`]) || "",
          };
          if (jsonData[`effect${i}Type`] === "easy") {
            easyEffects.push(effect);
          } else if (jsonData[`effect${i}Type`] !== "auto") {
            effects.push(effect);
          }
        }
      }
      const itemNum = parseInt(jsonData.itemNum, 10) || 0;
      for (let i = 1; i <= itemNum; i++) {
        items.push({
          name: this.normalizeImportedString(jsonData[`item${i}Name`]) || "",
          level: 1,
          type: this.normalizeSkillName(
            this.normalizeImportedString(jsonData[`item${i}Type`])
          ),
          skill: "-",
          accuracy: "",
          attack: "",
          guard: "",
          range: "",
          cost: "",
          xp: 0,
          notes: this.normalizeImportedString(jsonData[`item${i}Note`]) || "",
        });
      }
      const weaponNum = parseInt(jsonData.weaponNum, 10) || 0;
      for (let i = 1; i <= weaponNum; i++) {
        items.push({
          name: this.normalizeImportedString(jsonData[`weapon${i}Name`]) || "",
          level: 1,
          type: "武器",
          skill: this.normalizeSkillName(
            this.normalizeImportedString(jsonData[`weapon${i}Skill`])
          ),
          accuracy: jsonData[`weapon${i}Acc`] || "0",
          attack: jsonData[`weapon${i}Atk`] || "0",
          guard: jsonData[`weapon${i}Guard`] || "0",
          range: jsonData[`weapon${i}Range`] || "至近",
          cost: "",
          xp: 0,
          notes: this.normalizeImportedString(jsonData[`weapon${i}Note`]) || "",
        });
      }
      const armorNum = parseInt(jsonData.armorNum, 10) || 0;
      for (let i = 1; i <= armorNum; i++) {
        items.push({
          name: this.normalizeImportedString(jsonData[`armor${i}Name`]) || "",
          level: 1,
          type: "防具",
          skill: "-",
          accuracy: "",
          attack: "",
          guard: jsonData[`armor${i}Def`] || "0",
          range: "",
          cost: "",
          xp: 0,
          notes: this.normalizeImportedString(jsonData[`armor${i}Note`]) || "",
        });
      }

      const combos = [];
      const comboNum = parseInt(jsonData.comboNum, 10) || 0;
      for (let i = 1; i <= comboNum; i++) {
        const comboName = this.normalizeImportedString(jsonData[`combo${i}Name`]) || "";
        const comboText = this.normalizeImportedString(jsonData[`combo${i}Combo`]) || "";
        if (!comboName && !comboText) continue;
        const effectNames = comboText
          .split(/[+＋]/)
          .map((name) => this.normalizeImportedString(name).trim())
          .filter(Boolean)
          .map((name) => ({ name, showInComboName: true }));
        combos.push({
          ...this.createDefaultCombo(),
          name: comboName || "",
          effectNames,
          baseAbility: {
            skill: this.normalizeSkillName(this.normalizeImportedString(jsonData[`combo${i}Skill`])) || "-",
            statOverride: "",
          },
          manualTarget: this.normalizeImportedString(jsonData[`combo${i}Target`]) || "",
          targetMode: jsonData[`combo${i}Target`] ? "manual" : "auto",
          manualRange: this.normalizeImportedString(jsonData[`combo${i}Range`]) || "",
          rangeMode: jsonData[`combo${i}Range`] ? "manual" : "auto",
          manualTiming: this.normalizeSkillName(this.normalizeImportedString(jsonData[`combo${i}Timing`])) || "",
          timingMode: jsonData[`combo${i}Timing`] ? "manual" : "auto",
          cost_manual: Number(jsonData[`combo${i}Encroach`]) || 0,
        });
      }
      return {
        characterName: this.normalizeImportedString(
          jsonData.characterName || jsonData.pc_name
        ),
        totalXp: parseInt(jsonData.expTotal, 10) || 130,
        expTotal: parseInt(jsonData.expTotal, 10) || undefined,
        expUsed: parseInt(jsonData.expUsed, 10) || undefined,
        expRest: parseInt(jsonData.expRest, 10) || undefined,
        effects: effects,
        easyEffects: easyEffects,
        items: items,
        combos: combos,
      };
    },
    async importFromHokanjo_gas(url) {
      const gasUrl = new URL(this.gasWebAppUrl);
      gasUrl.searchParams.append("action", "import");
      gasUrl.searchParams.append("url", url);
      const response = await fetch(gasUrl);
      const result = await this.readJsonResponse(response, "キャラクター保管所引用API");
      if (result.status === "success") {
        const normalizeRecursively = (obj) => {
          if (typeof obj === "string") {
            return this.normalizeImportedString(obj);
          }
          if (Array.isArray(obj)) {
            return obj.map((item) => normalizeRecursively(item));
          }
          if (typeof obj === "object" && obj !== null) {
            const newObj = {};
            for (const key in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = normalizeRecursively(obj[key]);
              }
            }
            return newObj;
          }
          return obj;
        };
        return normalizeRecursively(result.data);
      } else {
        throw new Error(
          result.message || "キャラクター保管所の解析に失敗しました。"
        );
      }
    },
    isEssentialEffect(effectName) {
      const essentialEffects = ["ワーディング", "リザレクト"];
      return essentialEffects.includes(effectName);
    },
    createDefaultEffect() {
      return {
        name: "",
        level: 1,
        maxLevel: 1,
        timing: "",
        skill: "",
        difficulty: "",
        target: "",
        range: "",
        cost: "",
        limit: "",
        effect: "",
        notes: "",
        values: this.createDefaultValues(),
      };
    },
    createDefaultValues() {
      const values = {};
      const tabKeys = [
        "dice",
        "achieve",
        "attack",
        "accuracy",
        "guard",
        "crit",
      ];
      tabKeys.forEach((key) => {
        values[key] = {
          base: 0,
          perLevel: 0,
          isDiceInput: false,
          isPerLevelDiceInput: false,
        };
      });
      values.attack.max = "";
      values.crit.min = 10;
      // isDiceInputはcritには不要なので削除
      delete values.crit.isDiceInput;
      delete values.crit.isPerLevelDiceInput;
      return values;
    },
    isEffectExcluded(effect) {
      if (!this.isEffectSelectModalOpen) return false;
      const combo = this.combos[this.editingComboIndex];
      if (!combo) return false;

      const effectData = (combo.effectNames || []).find(
        (e) => e.name === effect.name
      );
      const showInComboName = effectData ? effectData.showInComboName : true;

      return effect.timing === "マイナー" && !showInComboName;
    },
    isEffectDisabled(source) {
      if (!source || !source.timing) return false;

      const isCurrentlySelected = this.tempSelectedEffects.some(
        (e) => e.name === source.name
      );
      if (isCurrentlySelected) {
        return false; // 選択解除は常に許可
      }

      const ignoreTimings = ["オート", "常時", "効果参照", "-"];
      if (ignoreTimings.includes(source.timing)) {
        return false;
      }

      const coreEffects = this.tempSelectedEffects.filter(
        (e) => !ignoreTimings.includes(e.timing)
      );

      if (coreEffects.length === 0) {
        return false;
      }

      const allProposedTimings = [
        ...coreEffects.map((e) => e.timing),
        source.timing,
      ];

      const isMajor = (timing) => timing.includes("メジャー");
      const isReaction = (timing) => timing.includes("リア");

      const hasPureMajor = allProposedTimings.some(
        (t) => isMajor(t) && !isReaction(t)
      );
      const hasPureReaction = allProposedTimings.some(
        (t) => isReaction(t) && !isMajor(t)
      );

      // 純粋なメジャーと純粋なリアクションは共存できない
      if (hasPureMajor && hasPureReaction) {
        return true;
      }

      // メジャー/リアクション系と、それ以外のタイミング(マイナーなど)は共存できない
      const hasMainAction = allProposedTimings.some(
        (t) => isMajor(t) || isReaction(t)
      );
      const hasOtherAction = allProposedTimings.some(
        (t) => !isMajor(t) && !isReaction(t) && !ignoreTimings.includes(t)
      );

      if (hasMainAction && hasOtherAction) {
        return true;
      }

      // マイナーアクションなどが複数種類ある場合は共存できない
      const otherActions = allProposedTimings.filter(
        (t) => !isMajor(t) && !isReaction(t) && !ignoreTimings.includes(t)
      );
      if (otherActions.length > 1) {
        const firstOtherAction = otherActions[0];
        if (otherActions.some((t) => t !== firstOtherAction)) {
          return true;
        }
      }

      return false;
    },
    addEffect() {
      this.effects.push(this.createDefaultEffect());
    },
    removeEffect(index) {
      this.effects.splice(index, 1);
    },
    addEasyEffect() {
      this.easyEffects.push(this.createDefaultEffect());
    },
    removeEasyEffect(index) {
      this.easyEffects.splice(index, 1);
    },
    createDefaultCombo() {
      return {
        name: "",
        effectNames: [],
        itemNames: [],
        atk_weapon: 0,
        cost_manual: 0,
        comboLevelBonus: 0,
        flavor: "",
        effectDescriptionMode: "auto",
        manualEffectDescription: "",
        enableAdvancedParsing: false,
        baseAbility: { skill: "白兵", statOverride: "肉体" },
        appliedBuffs: [],
        manualTarget: "",
        targetMode: "auto",
        manualRange: "",
        rangeMode: "auto",
        timingMode: "auto",
        manualTiming: "",
      };
    },
    addCombo() {
      this.combos.push(this.createDefaultCombo());
    },
    copyCombo(index) {
      const originalCombo = this.combos[index];
      const copiedCombo = JSON.parse(JSON.stringify(originalCombo));
      copiedCombo.name = `${originalCombo.name}(コピー)`;
      this.combos.splice(index + 1, 0, copiedCombo);
      this.setDataDirty();
    },
    removeCombo(index) {
      this.combos.splice(index, 1);
      this.setDataDirty();
    },
    moveComboUp(index) {
      if (index > 0) {
        const combo = this.combos[index];
        this.combos.splice(index, 1);
        this.combos.splice(index - 1, 0, combo);
        this.setDataDirty();
      }
    },
    moveComboDown(index) {
      if (index < this.combos.length - 1) {
        const combo = this.combos[index];
        this.combos.splice(index, 1);
        this.combos.splice(index + 1, 0, combo);
        this.setDataDirty();
      }
    },
    evaluateDiceString(str, level = 0) {
      if (typeof str !== "string" && typeof str !== "number") {
        return { dice: 0, fixed: 0 };
      }
      let expression = String(str).trim();
      if (expression === "") {
        return { dice: 0, fixed: 0 };
      }
      expression = expression.replace(/lv/gi, level);
      try {
        if (!/^[0-9dD\s\-\+\*\/\(\)\.]+$/.test(expression)) {
          if (!/[dD]/.test(expression)) {
            const fixedValue = Number(expression);
            return { dice: 0, fixed: isNaN(fixedValue) ? 0 : fixedValue };
          }
        }
        expression = new Function("return " + expression)();
        expression = String(expression);
      } catch (e) {}
      let dice = 0;
      let fixed = 0;
      const diceMatch = expression.match(/(\d+)d/i);
      if (diceMatch) {
        dice = parseInt(diceMatch[1], 10);
        expression = expression.replace(/(\d+)d/i, "");
      }
      expression = expression.replace(/\s/g, "");
      if (expression) {
        try {
          const remainingValue = new Function("return " + expression)();
          if (!isNaN(remainingValue)) {
            fixed = remainingValue;
          }
        } catch (e) {}
      }
      return { dice, fixed };
    },
    formatDiceString({ dice, fixed }) {
      const dicePart = dice > 0 ? `${dice}D` : "";
      const fixedPart = fixed > 0 ? `${fixed}` : fixed < 0 ? `${fixed}` : "";
      if (dicePart && fixedPart) {
        return fixed > 0
          ? `${dicePart}+${fixedPart}`
          : `${dicePart}${fixedPart}`;
      }
      return dicePart || fixedPart || "0";
    },
    evaluateValue(str, level) {
      const result = this.evaluateDiceString(str, level);
      return result.dice * 3.5 + result.fixed;
    },
    // 自動入力可能な項目があるかチェックし、フラグを立てる
    detectAutoUpdateAvailable() {
      const allLists = [...this.effects, ...this.easyEffects, ...this.items];
      allLists.forEach((item) => {
        if (this.isEssentialEffect(item.name)) return;
        this.ensureCoefficientValues(item);
        const suggestions = this.inferEffectTextCoefficients(item);
        const hasUpdate = Object.keys(suggestions).some((key) => {
          if (key === "crit") {
            const c = item.values.crit || {};
            return this.isZeroLike(c.base) && this.isZeroLike(c.perLevel);
          }
          const v = item.values[key];
          return !v || (this.isZeroLike(v.base) && this.isZeroLike(v.perLevel));
        });
        if (hasUpdate) this.$set(item, "_hasAutoUpdate", true);
      });
    },
    openEffectPanel(event, source, type, index) {
      // ★追加: 開いた瞬間に通知フラグを消す (Vueのリアクティブシステムに反映させるため$set/$deleteを使用)
      if (source._hasAutoUpdate) {
        this.$delete(source, "_hasAutoUpdate");
      }

      this.editingEffect = JSON.parse(JSON.stringify(source));

      const textToAnalyze = (
        (source.effect || "") +
        "\n" +
        (source.notes || "") +
        "\n" +
        (source.name || "")
      ).toUpperCase();
      const inferredPreview = this.inferEffectTextCoefficients(this.editingEffect);
      const autoUpdatedTabs = {};

      const checkRelevance = (keywords, key) =>
        Boolean(inferredPreview[key]) || keywords.some((kw) => textToAnalyze.includes(kw));

      if (type === "item") {
        this.modalTabs = [
          {
            key: "accuracy",
            label: "命中",
            isRelevant: checkRelevance(["命中"], "accuracy"),
            isAutoDetected: autoUpdatedTabs["accuracy"],
          },
          {
            key: "attack",
            label: "攻撃力",
            isRelevant: checkRelevance(["攻撃力", "ATK", "ダメージ", "攻撃の"], "attack"),
            isAutoDetected: autoUpdatedTabs["attack"],
          },
          {
            key: "guard",
            label: "ガード値",
            isRelevant: checkRelevance(["ガード", "装甲"], "guard"),
            isAutoDetected: autoUpdatedTabs["guard"],
          },
          {
            key: "crit",
            label: "C値",
            isRelevant: checkRelevance(["クリティカル", "C値", "Ｃ値", "@"], "crit"),
            isAutoDetected: false,
          },
        ];
        this.activeModalTab = "accuracy";
      } else {
        this.modalTabs = [
          {
            key: "dice",
            label: "ダイス",
            isRelevant: checkRelevance(["ダイス", "DX", "ＤＸ", "個"], "dice"),
            isAutoDetected: autoUpdatedTabs["dice"],
          },
          {
            key: "achieve",
            label: "達成値",
            isRelevant: checkRelevance(["達成値"], "achieve"),
            isAutoDetected: autoUpdatedTabs["achieve"],
          },
          {
            key: "attack",
            label: "ATK",
            isRelevant: checkRelevance(["攻撃力", "ATK", "ダメージ", "攻撃の"], "attack"),
            isAutoDetected: autoUpdatedTabs["attack"],
          },
          {
            key: "crit",
            label: "C値",
            isRelevant: checkRelevance(["クリティカル", "C値", "Ｃ値", "@"], "crit"),
            isAutoDetected: false,
          },
        ];
        this.activeModalTab = "dice";
      }

      const priorityOrder = [
        "crit",
        "attack",
        "achieve",
        "dice",
        "guard",
        "accuracy",
      ];
      let found = this.modalTabs.find((t) => t.isAutoDetected);
      if (!found) {
        for (const key of priorityOrder) {
          const rel = this.modalTabs.find((t) => t.key === key && t.isRelevant);
          if (rel) {
            found = rel;
            break;
          }
        }
      }
      if (found) this.activeModalTab = found.key;

      this.modalTabs.forEach((tab) => {
        if (tab.key !== "crit") {
          const tabKey = tab.key;
          if (!this.editingEffect.values[tabKey]) {
            this.$set(this.editingEffect.values, tabKey, {
              base: 0,
              perLevel: 0,
              isDiceInput: false,
              isPerLevelDiceInput: false,
            });
          }
          // 係数パネルでは ATK / 達成値 / 命中修正などに「2D」のような
          // 直接D表記を許可する。旧データの isDiceInput フラグは表示用に文字列へ戻す。
          const normalizePanelValue = (value, isDice) => {
            if (value === null || value === undefined || value === "") return "0";
            const str = String(value).trim();
            if (str.toUpperCase().includes("D")) return str.toUpperCase();
            if (isDice && tabKey !== "dice") return `${Number(str) || 0}D`;
            return String(Number(str) || 0);
          };
          this.editingEffect.values[tabKey].base = normalizePanelValue(
            this.editingEffect.values[tabKey].base,
            this.editingEffect.values[tabKey].isDiceInput
          );
          this.editingEffect.values[tabKey].perLevel = normalizePanelValue(
            this.editingEffect.values[tabKey].perLevel,
            this.editingEffect.values[tabKey].isPerLevelDiceInput
          );
        }
      });
      this.editingEffectType = type;
      this.editingEffectIndex = index;
      // 係数パネルはボタン位置に追従させると、画面下部で開いた時だけ
      // 縦スクロールが出やすい。常に画面中央へ出して、表示位置による差をなくす。
      const panelWidth = Math.min(560, window.innerWidth - 32);
      this.panelStyle = {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: `${panelWidth}px`,
        maxHeight: "calc(100vh - 32px)",
      };
      this.isPanelOpen = true;
    },
    closeEffectPanel() {
      if (this.editingEffect) {
        this.modalTabs.forEach((tab) => {
          const tabKey = tab.key;
          if (tabKey !== "crit") {
            if (tabKey === "dice") {
              // ダイス補正そのものは個数入力なのでD表記にはしない
              this.editingEffect.values.dice.base =
                Number(this.editingEffect.values.dice.base) || 0;
              this.editingEffect.values.dice.perLevel =
                Number(this.editingEffect.values.dice.perLevel) || 0;
            } else {
              const normalizeStoredCoef = (value) => {
                if (value === null || value === undefined || value === "") return 0;
                const str = String(value).trim().replace(/ｄ/gi, "D").replace(/Ｄ/g, "D");
                if (str.toUpperCase().includes("D")) return str.toUpperCase();
                return Number(str) || 0;
              };
              this.editingEffect.values[tabKey].base = normalizeStoredCoef(
                this.editingEffect.values[tabKey].base
              );
              this.editingEffect.values[tabKey].perLevel = normalizeStoredCoef(
                this.editingEffect.values[tabKey].perLevel
              );
              this.editingEffect.values[tabKey].isDiceInput = String(
                this.editingEffect.values[tabKey].base
              ).toUpperCase().includes("D");
              this.editingEffect.values[tabKey].isPerLevelDiceInput = String(
                this.editingEffect.values[tabKey].perLevel
              ).toUpperCase().includes("D");
              if (tabKey === "attack") {
                const maxValue = this.editingEffect.values.attack.max;
                this.editingEffect.values.attack.max =
                  maxValue === "" || maxValue === null || maxValue === undefined
                    ? ""
                    : Number(maxValue);
              }
            }
          }
        });
        if (this.editingEffectType === "effect") {
          this.$set(this.effects, this.editingEffectIndex, this.editingEffect);
        } else if (this.editingEffectType === "easy") {
          this.$set(
            this.easyEffects,
            this.editingEffectIndex,
            this.editingEffect
          );
        } else if (this.editingEffectType === "item") {
          this.$set(this.items, this.editingEffectIndex, this.editingEffect);
        }

        // ▼▼▼ 修正: syncAllData は editingEffect が null になる前に呼ぶ ▼▼▼
        this.syncAllData(this.editingEffectType, [this.editingEffect]);
      }
      this.isPanelOpen = false;
      this.editingEffect = null;
      // 元々ここにあった syncAllData の呼び出しを削除
    },
    cancelEffectPanel() {
      this.isPanelOpen = false;
      this.editingEffect = null;
      this.editingEffectType = "";
      this.editingEffectIndex = -1;
    },
    openEffectSelectModal(comboIndex) {
      this.editingComboIndex = comboIndex;
      const combo = this.combos[comboIndex];

      const effectNamesData = (combo.effectNames || []).map((item) =>
        typeof item === "string" ? { name: item, showInComboName: true } : item
      );
      this.$set(combo, "effectNames", effectNamesData);

      const itemNamesData = (combo.itemNames || []).map((item) =>
        typeof item === "string" ? { name: item, showInComboName: true } : item
      );
      this.$set(combo, "itemNames", itemNamesData);

      const selectedEffectNames = new Set(effectNamesData.map((e) => e.name));
      const selectedItemNames = new Set(itemNamesData.map((i) => i.name));

      // 相互選択
      selectedEffectNames.forEach((name) => selectedItemNames.add(name));
      selectedItemNames.forEach((name) => selectedEffectNames.add(name));

      this.tempSelectedEffects = [...this.effects, ...this.easyEffects].filter(
        (e) => selectedEffectNames.has(e.name)
      );
      this.tempSelectedItems = this.items.filter((i) =>
        selectedItemNames.has(i.name)
      );
      this.tempSelectedBuffs = [...(combo.appliedBuffs || [])]; // 適用中のバフをセット

      this.isEffectSelectModalOpen = true;
    },

    normalizeTimingForBulkSelect(timing) {
      const raw = String(timing || "").replace(/[\s　]/g, "");
      if (!raw || raw === "-" || raw === "ー") return "other";
      if (raw.includes("メジャ") || raw.includes("ﾒｼﾞｬ") || raw.includes("メイン")) return "major";
      if (raw.includes("マイナー") || raw.includes("ﾏｲﾅｰ")) return "minor";
      if (raw.includes("リア") || raw.includes("ﾘｱ") || raw === "リ") return "reaction";
      if (raw.includes("セット") || raw.includes("ｾｯﾄ")) return "setup";
      if (raw.includes("イニシ") || raw.includes("ｲﾆｼ")) return "initiative";
      if (raw.includes("オート") || raw.includes("ｵｰﾄ")) return "auto";
      if (raw.includes("常時")) return "constant";
      return "other";
    },
    selectEffectsByTiming(timingKey) {
      if (!this.isEffectSelectModalOpen) return;
      const candidates = [...this.effects, ...this.easyEffects].filter(
        (effect) => this.normalizeTimingForBulkSelect(effect.timing) === timingKey
      );

      candidates.forEach((effect) => {
        if (!effect || !effect.name) return;
        if (this.isEffectDisabled(effect)) return;
        if (!this.tempSelectedEffects.some((selected) => selected.name === effect.name)) {
          this.tempSelectedEffects.push(effect);
        }
      });
    },
    clearTempEffectSelection() {
      this.tempSelectedEffects = [];
      this.tempSelectedItems = [];
    },
    confirmEffectSelection() {
      if (this.editingComboIndex !== -1) {
        const combo = this.combos[this.editingComboIndex];

        // エフェクトとアイテムの選択を更新
        const effectNames = this.tempSelectedEffects.map((effect) => ({
          name: effect.name,
        }));
        const itemNames = this.tempSelectedItems.map((item) => ({
          name: item.name,
        }));
        this.$set(combo, "effectNames", effectNames);
        this.$set(combo, "itemNames", itemNames);
        this.$set(combo, "appliedBuffs", this.tempSelectedBuffs); // バフの選択を更新

        // 主要な技能を自動設定
        const skillCounts = this.tempSelectedEffects.reduce((acc, effect) => {
          if (effect.skill && effect.skill !== "-") {
            acc[effect.skill] = (acc[effect.skill] || 0) + 1;
          }
          return acc;
        }, {});
        let mostFrequentSkill = "-";
        let maxCount = 0;
        for (const skill in skillCounts) {
          if (skillCounts[skill] > maxCount) {
            mostFrequentSkill = skill;
            maxCount = skillCounts[skill];
          }
        }
        if (this.dropdownOptions.baseSkillSelect.includes(mostFrequentSkill)) {
          this.$set(combo.baseAbility, "skill", mostFrequentSkill);
        } else {
          this.$set(combo.baseAbility, "skill", "-");
        }
      }
      this.isEffectSelectModalOpen = false;
    },
    cancelEffectSelection() {
      this.isEffectSelectModalOpen = false;
    },
    switchToManualMode(combo, index) {
      if (combo.effectDescriptionMode === "auto") {
        const relevantEffects = this._getRelevantEffects(combo.effectNames);
        const relevantItems = (combo.itemNames || [])
          .map((itemData) => this.items.find((i) => i.name === itemData.name))
          .filter(Boolean);
        const autoEffectText = [...relevantEffects, ...relevantItems]
          .map((source) =>
            this.evaluateEffectText(
              source.effect || source.notes,
              source.level,
              combo.comboLevelBonus,
              combo.enableAdvancedParsing
            )
          )
          .filter(Boolean)
          .join("\n");
        combo.manualEffectDescription = autoEffectText;
      }
      combo.effectDescriptionMode = "manual";
    },
    closeAllDropdowns() {
      if (this.isPanelOpen) {
        this.closeEffectPanel();
      }
      if (this.isEffectSelectModalOpen) {
        this.cancelEffectSelection();
      }
    },
    copyToClipboard(text, event) {
      if (!text) return;
      navigator.clipboard
        .writeText(text)
        .then(() => {
          const button = event.target.closest("button");
          const originalIcon = button.innerHTML;
          button.innerHTML = '<i class="fa-solid fa-check"></i>';
          button.disabled = true;
          setTimeout(() => {
            button.innerHTML = originalIcon;
            button.disabled = false;
          }, 1500);
        })
        .catch((err) => {
          console.error("コピーに失敗しました", err);
        });
    },
    isEffectSelected(effectName) {
      if (!this.isEffectSelectModalOpen) return false;
      return this.tempSelectedEffects.some(
        (effect) => effect.name === effectName
      );
    },
    handleEffectSelectionChange(item, isSelected) {
      if (!item.name) return;

      const allEffectsAndItems = [
        ...this.effects,
        ...this.easyEffects,
        ...this.items,
      ];
      const sameNameItems = allEffectsAndItems.filter(
        (i) => i.name === item.name
      );

      if (isSelected) {
        sameNameItems.forEach((linkedItem) => {
          const isEffect = linkedItem.hasOwnProperty("difficulty");
          const list = isEffect
            ? this.tempSelectedEffects
            : this.tempSelectedItems;
          const exists = list.some((i) => i.name === linkedItem.name);
          if (!exists) {
            list.push(linkedItem);
          }
        });
      } else {
        this.tempSelectedEffects = this.tempSelectedEffects.filter(
          (e) => e.name !== item.name
        );
        this.tempSelectedItems = this.tempSelectedItems.filter(
          (i) => i.name !== item.name
        );
      }
    },
    isItemSelected(itemName) {
      if (!this.isEffectSelectModalOpen) return false;
      return this.tempSelectedItems.some((item) => item.name === itemName);
    },
    normalizeImportedString(str) {
      if (typeof str !== "string" || !str) return str;
      let text = str;
      if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.innerHTML = text;
        text = textarea.value;
      } else {
        text = text
          .replace(/&darr;/gi, "↓")
          .replace(/&uarr;/gi, "↑")
          .replace(/&times;/gi, "×")
          .replace(/&divide;/gi, "÷")
          .replace(/&nbsp;/gi, " ")
          .replace(/&quot;/gi, '\"')
          .replace(/&#039;|&apos;/gi, "'")
          .replace(/&lt;/gi, "<")
          .replace(/&gt;/gi, ">")
          .replace(/&amp;/gi, "&");
      }
      return text
        .replace(/<br\s*\/?\s*>/gi, "\n")
        .replace(/―/g, "-");
    },
    normalizeSkillName(str) {
      if (!str) return "";
      const fullWidthStr = this.toFullWidthKana(str);
      return fullWidthStr.replace(/[〈〉]/g, "").replace(/\//g, "／");
    },
    toFullWidthKana(str) {
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
    },
    simplifyEffectText(text) {
      if (!text) return "";
      let t = text;

      // 1. 「このエフェクトを組み合わせた～」系
      t = t.replace(
        /このエフェクトを組み合わせた(?:判定|攻撃|射撃攻撃|白兵攻撃)(?:の|で|において|に対する|に対して|、)*/g,
        ""
      );
      t = t.replace(/このエフェクトを組み合わせた/g, "");

      // 2. 「あなたがガード/ドッジを行なう際に～」系
      t = t.replace(
        /あなたが(?:ガード|ドッジ)を行なう際に宣言する。(?:この(?:ガード|ドッジ)の間、)?/g,
        ""
      );

      // 3. 「あなたの～」系 (文脈によるが、パラメータ増加系は削っても通じる)
      // 例: "あなたの攻撃力を..." -> "攻撃力を..."
      t = t.replace(
        /あなたの((?:攻撃力|判定|ダイス|達成値|ガード値|HP))/g,
        "$1"
      );
      t = t.replace(/あなたが行なう/g, "");

      // 4. 非重要フレーズ
      t = t.replace(/このエフェクトの効果は、/g, "");

      // 5. 常時エフェクトの「レベルアップしない」などの注釈削除
      t = t.replace(
        /このエフェクトは侵触率でレベルアップしない、このエフェクトを取得した場合、侵触率基本値を\+\d+する。/g,
        ""
      );

      // 6. 文頭の不要な読点やスペース削除
      t = t.replace(/^[、\s]+/, "");

      return t.trim();
    },
    evaluateEffectText(text, level, comboLevelBonus, enableAdvancedParsing) {
      if (!enableAdvancedParsing || !text) {
        return text;
      }
      const effectiveLevel = (level || 0) + (comboLevelBonus || 0);
      const replacer = (match, expression) => {
        try {
          return this.evaluateValue(expression, effectiveLevel);
        } catch (e) {
          return match;
        }
      };
      const regex = /\[(.*?)\]/g;
      return text.replace(regex, replacer);
    },
    adjustAllTextareaHeights() {
      const textareas = this.$el.querySelectorAll(".copy-container textarea");
      textareas.forEach(this.adjustTextareaHeight);
    },
    adjustTextareaHeight(textarea) {
      if (!textarea) return;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    },
    adjustBlockHeights() {
      this.$nextTick(() => {
        const characterInfoGrid = this.$el.querySelector(
          ".character-info-grid"
        );
        const dbSyncBlock = this.$el.querySelector(".db-sync-block");
        if (characterInfoGrid && dbSyncBlock) {
          const gridHeight = characterInfoGrid.offsetHeight;
          dbSyncBlock.style.minHeight = `${gridHeight}px`;
        }
      });
    },
    generateShareUrl() {
      if (this.characterSheetUrl) {
        let shortUrl = "";
        try {
          const url = new URL(this.characterSheetUrl);
          if (url.hostname.includes("charasheet.vampire-blood.net")) {
            const pathId = url.pathname.split("/").pop();
            shortUrl = `v-${pathId}`;
          } else if (url.hostname.includes("yutorize.2-d.jp") || url.hostname.includes("yutorize.work")) {
            const queryId = url.searchParams.get("id");
            shortUrl = `y-${queryId}`;
          }
        } catch (e) {
          shortUrl = encodeURIComponent(this.characterSheetUrl);
        }
        const baseUrl = window.location.origin + window.location.pathname;
        this.shareUrl = `${baseUrl}?url=${shortUrl}`;
      } else {
        this.shareUrl = "";
      }
    },
    showConfirmation(title, message) {
      return new Promise((resolve, reject) => {
        this.confirmation.title = title;
        this.confirmation.message = message;
        this.confirmation.show = true;
        this.confirmation.resolve = resolve;
        this.confirmation.reject = reject;
      });
    },
    confirmConfirmation() {
      this.confirmation.show = false;
      if (this.confirmation.resolve) {
        this.confirmation.resolve(true);
      }
    },
    cancelConfirmation() {
      this.confirmation.show = false;
      if (this.confirmation.resolve) {
        this.confirmation.resolve(false);
      }
    },
    showUpdateOptions(title, message) {
      return new Promise((resolve) => {
        this.updateOptions.title = title;
        this.updateOptions.message = message;
        this.updateOptions.show = true;
        this.updateOptions.resolve = resolve;
      });
    },
    resolveUpdateOptions(decision) {
      this.updateOptions.show = false;
      if (this.updateOptions.resolve) {
        this.updateOptions.resolve(decision);
      }
    },
    availableBuffs(currentIndex) {
      // processedCombosが存在しない場合は空配列を返す（初期化時など）
      if (!this.processedCombos) return [];
      return this.processedCombos.filter((_, index) => index !== currentIndex);
    },
  },
});

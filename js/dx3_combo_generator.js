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
      if (this.options.length === 0) {
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
  },
  created() {
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
          fullUrl = `https://yutorize.2-d.jp/ytsheet/dx3rd/?id=${shortUrl.substring(
            2
          )}`;
        }
        this.characterSheetUrl = fullUrl;
        this.loadFromDb(true);
      }
      this.generateShareUrl();
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

        let critTotal = 10;
        const critBreakdown = [];
        allSelectedSources.forEach((source) => {
          if (!source.values?.crit?.base || source.values.crit.base === 0)
            return;
          const effectiveLevel = source.level
            ? (Number(source.level) || 0) + comboLevelBonus
            : 0;
          const base = Number(source.values.crit.base) || 0;
          const perLevel = Number(source.values.crit.perLevel) || 0;
          const min = Number(source.values.crit.min) || 2;
          const value = Math.max(base - effectiveLevel * perLevel, min);
          if (value < critTotal) {
            critTotal = value;
            critBreakdown.push(`${source.name}: ${value}`);
          }
        });

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
        let finalCrit = comboData.baseValues.crit;

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
              if (buffComboData.baseValues.crit < finalCrit) {
                finalCrit = buffComboData.baseValues.crit;
              }
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

        const line1 = `◆${currentCombo.name}`;
        const line2 = allSelectedSources
          .map((s) => {
            const baseLevel = Number(s.level) || 1;
            const bonusPart = comboLevelBonus > 0 ? `+${comboLevelBonus}` : "";
            return `《${s.name}》Lv${baseLevel}${bonusPart}`;
          })
          .join("+");
        const line3 = `『${currentCombo.flavor || ""}』`;

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

        // 詳細情報（ヘッダー用）には計算結果を残す
        const details = [
          `侵蝕値:${totalCost}`,
          `タイミング:${timing}`,
          `技能:${skill}`,
          `難易度:${difficulty}`,
          `対象:${target}`,
          `射程:${range}`,
          `攻撃力:${this.formatDiceString({
            dice: finalAtkDice,
            fixed: finalAtkFixed,
          })}`,
          `達成値:${finalAchieve}`, // 念のためここにも記載
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

        // 1. (能力値+ダイスボーナス)DX
        let diceFormula = `({${attributeName}}${
          finalDice >= 0 ? "+" : ""
        }${finalDice})DX`;

        // 2. @C値
        diceFormula += `@${finalCrit}`;

        // 3. +{技能}
        if (skill !== "-") {
          diceFormula += `+{${skill}}`;
        }

        // 4. +達成値ボーナス
        if (finalAchieve !== 0) {
          diceFormula += `${finalAchieve >= 0 ? "+" : ""}${finalAchieve}`;
        }

        // 5. ◆コンボ名 (攻撃力などは含めない)
        diceFormula += ` ◆${currentCombo.name}`;

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
        if (newVal && newVal.includes("#")) {
          const normalizedUrl = newVal.split("#")[0];
          if (this.characterSheetUrl !== normalizedUrl) {
            this.characterSheetUrl = normalizedUrl;
            return;
          }
        }
        this.setDataDirty();
        this.generateShareUrl();
      },
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
            name.includes("コンセ");
          if (isConcentrate) {
            effect.values.crit.base = 10;
            effect.values.crit.perLevel = 1;
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
            id: this.characterSheetUrl,
            data: dataToSave,
            shareUrl: this.shareUrl,
          }),
        });
        const result = await response.json();
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
            id: this.characterSheetUrl,
          }),
        });
        const result = await response.json();
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
      if (this.characterSheetUrl.includes("#")) {
        this.characterSheetUrl = this.characterSheetUrl.split("#")[0];
      }

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
      this.isBusy = true;
      this.showStatus("DBにアクセス中...", false, 0);
      const url = new URL(this.gasWebAppUrl);
      url.searchParams.append("id", this.characterSheetUrl);
      try {
        const response = await fetch(url);
        const result = await response.json();
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
            "キャラクターシートからの更新",
            "キャラクターシートの最新データで何を更新しますか？<br>（注意：現在作成中のコンボデータは維持されます）"
          );

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
        if (this.characterSheetUrl.includes("yutorize.2-d.jp")) {
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
              `・総経験点: ${importedData.totalXp}<br>` +
              `・エフェクト: ${effectsCount}件<br>` +
              `・イージーエフェクト: ${easyEffectsCount}件<br>` +
              `・アイテム: ${itemsCount}件`
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
          this.combos = [];
          this.addCombo();
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
    async importFromYutoSheet_direct(url) {
      const jsonUrl = url + (url.includes("?") ? "&" : "?") + "mode=json";
      const response = await fetch(jsonUrl);
      if (!response.ok) {
        throw new Error(
          `ゆとシートAPIへのアクセスに失敗しました (ステータス: ${response.status})`
        );
      }
      const jsonData = await response.json();
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

      return {
        characterName: this.normalizeImportedString(
          jsonData.characterName || jsonData.pc_name
        ),
        totalXp: parseInt(jsonData.expTotal, 10) || 130,
        effects: effects,
        easyEffects: easyEffects,
        items: items,
      };
    },
    async importFromHokanjo_gas(url) {
      const gasUrl = new URL(this.gasWebAppUrl);
      gasUrl.searchParams.append("action", "import");
      gasUrl.searchParams.append("url", url);
      const response = await fetch(gasUrl);
      const result = await response.json();
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
        name: `コンボ${this.combos.length + 1}`,
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
      const regex =
        /([+\-＋－]?)\s*[\[［](.*?)[\]］](?:[×*]?)(\s*(?:DX|ＤＸ|D|Ｄ|個|点))?/gi;

      allLists.forEach((item) => {
        // コンセントレイトなどは除外
        if (this.isEssentialEffect(item.name)) return;

        const rawText = (item.effect || "") + "\n" + (item.notes || "");
        if (!rawText.match(/[\[［].*?[\]］]/)) return; // [ ] がなければスキップ

        let hasUpdate = false;
        let match;
        // regexのlastIndexをリセット
        regex.lastIndex = 0;

        while ((match = regex.exec(rawText)) !== null) {
          const suffix = (match[3] || "").trim().toUpperCase();
          const idx = match.index;
          const precedingText = rawText
            .substring(Math.max(0, idx - 20), idx)
            .toUpperCase();

          let targetType = null;
          // 簡易判定 (openEffectPanelほど厳密でなくて良い、何らかのターゲットが決まればよい)
          if (/攻撃力|ATK|ＡＴＫ|ダメージ|攻撃の/.test(precedingText))
            targetType = "attack";
          else if (/ガード|装甲/.test(precedingText)) targetType = "guard";
          else if (/命中/.test(precedingText)) targetType = "accuracy";
          else if (/達成値/.test(precedingText)) targetType = "achieve";
          else if (
            /ダイス|DX|ＤＸ/.test(precedingText) ||
            /DX|ＤＸ/.test(suffix) ||
            /D|Ｄ/.test(suffix)
          )
            targetType = "dice";

          if (targetType) {
            // 現在の値が0の場合のみ「更新あり」とみなす
            if (!item.values[targetType]) {
              // values自体がない場合は初期化されていないので更新候補
              hasUpdate = true;
            } else {
              const v = item.values[targetType];
              // BaseもPerLevelも0なら、自動入力の余地がある
              if (
                (Number(v.base) || 0) === 0 &&
                (Number(v.perLevel) || 0) === 0
              ) {
                hasUpdate = true;
              }
            }
          }
          if (hasUpdate) break;
        }

        if (hasUpdate) {
          this.$set(item, "_hasAutoUpdate", true);
        }
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
      const rawText = (source.effect || "") + "\n" + (source.notes || "");
      const autoUpdatedTabs = {};

      // 数式解析用関数
      const parseFormulas = () => {
        // 例: "+[LV+1]", "-[3-LV]DX", "攻撃力を+[LV*2]D"
        const regex =
          /([+\-＋－]?)\s*[\[［](.*?)[\]］](?:[×*]?)(\s*(?:DX|ＤＸ|D|Ｄ|個|点))?/gi;
        let match;

        while ((match = regex.exec(rawText)) !== null) {
          const signStr = match[1] || "+";
          const formulaInner = match[2];
          const suffix = match[3] || "";

          const idx = match.index;
          const precedingText = rawText
            .substring(Math.max(0, idx - 20), idx)
            .toUpperCase();
          const suffixUpper = suffix.trim().toUpperCase();

          let targetType = null;
          let isDiceMode = false;

          // ★修正: 「D」がついている場合でも、文脈(PrecedingText)を最優先する
          // 「攻撃力を...[LV]Dする」のようなケースに対応
          if (/攻撃力|ATK|ＡＴＫ|ダメージ|攻撃の/.test(precedingText)) {
            targetType = "attack";
            if (/D|Ｄ/.test(suffixUpper)) isDiceMode = true; // 攻撃力だがD計算
          } else if (/ガード|装甲/.test(precedingText)) {
            targetType = "guard";
            if (/D|Ｄ/.test(suffixUpper)) isDiceMode = true;
          } else if (/命中/.test(precedingText)) {
            targetType = "accuracy";
            if (/D|Ｄ/.test(suffixUpper)) isDiceMode = true;
          } else if (/達成値/.test(precedingText)) {
            targetType = "achieve";
          } else if (/ダイス/.test(precedingText)) {
            targetType = "dice";
          }

          // 文脈で決まらなかった場合、接尾辞で判断
          if (!targetType) {
            if (/DX|ＤＸ/.test(suffixUpper)) {
              targetType = "dice";
            } else if (/D|Ｄ/.test(suffixUpper)) {
              targetType = "dice";
            }
          }

          if (targetType) {
            let f = formulaInner
              .replace(/[＋]/g, "+")
              .replace(/[－]/g, "-")
              .replace(/[×]/g, "*")
              .replace(/[÷]/g, "/");
            try {
              const evalAt = (lv) =>
                new Function("return " + f.replace(/LV/gi, lv))();
              const val0 = evalAt(0);
              const val100 = evalAt(100);

              if (!isNaN(val0) && !isNaN(val100)) {
                let slope = (val100 - val0) / 100;
                let intercept = val0;
                const signMult = signStr === "-" || signStr === "－" ? -1 : 1;

                const finalPerLevel = slope * signMult;
                const finalBase = intercept * signMult;

                if (!this.editingEffect.values[targetType]) {
                  this.$set(
                    this.editingEffect.values,
                    targetType,
                    this.createDefaultValues()[targetType]
                  );
                }
                const current = this.editingEffect.values[targetType];

                // 値が未設定(0)の場合のみ自動入力
                if (current.base === 0 && current.perLevel === 0) {
                  this.$set(current, "base", finalBase);
                  this.$set(current, "perLevel", finalPerLevel);

                  // ★追加: 「D」フラグが立っていれば、入力モードをダイスに切り替える
                  if (isDiceMode) {
                    if (finalBase !== 0)
                      this.$set(current, "isDiceInput", true);
                    if (finalPerLevel !== 0)
                      this.$set(current, "isPerLevelDiceInput", true);
                  }

                  autoUpdatedTabs[targetType] = true;
                }
              }
            } catch (e) {
              console.warn("Auto-parse failed:", formulaInner);
            }
          }
        }
      };

      parseFormulas();

      const checkRelevance = (keywords) =>
        keywords.some((kw) => textToAnalyze.includes(kw));

      if (type === "item") {
        this.modalTabs = [
          {
            key: "accuracy",
            label: "命中",
            isRelevant: checkRelevance(["命中"]),
            isAutoDetected: autoUpdatedTabs["accuracy"],
          },
          {
            key: "attack",
            label: "攻撃力",
            isRelevant: checkRelevance(["攻撃力", "ATK", "ダメージ", "攻撃の"]),
            isAutoDetected: autoUpdatedTabs["attack"],
          },
          {
            key: "guard",
            label: "ガード値",
            isRelevant: checkRelevance(["ガード", "装甲"]),
            isAutoDetected: autoUpdatedTabs["guard"],
          },
          {
            key: "crit",
            label: "C値",
            isRelevant: checkRelevance(["クリティカル", "C値", "Ｃ値", "@"]),
            isAutoDetected: false,
          },
        ];
        this.activeModalTab = "accuracy";
      } else {
        this.modalTabs = [
          {
            key: "dice",
            label: "ダイス",
            isRelevant: checkRelevance(["ダイス", "DX", "ＤＸ", "個"]),
            isAutoDetected: autoUpdatedTabs["dice"],
          },
          {
            key: "achieve",
            label: "達成値",
            isRelevant: checkRelevance(["達成値"]),
            isAutoDetected: autoUpdatedTabs["achieve"],
          },
          {
            key: "attack",
            label: "ATK",
            isRelevant: checkRelevance(["攻撃力", "ATK", "ダメージ", "攻撃の"]),
            isAutoDetected: autoUpdatedTabs["attack"],
          },
          {
            key: "crit",
            label: "C値",
            isRelevant: checkRelevance(["クリティカル", "C値", "Ｃ値", "@"]),
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
          // 数値orD表記変換 (isDiceInputフラグ等は上でセットしたものを優先したいので、D文字が含まれる場合のみ上書きするガードを入れる)
          const baseValueStr = String(
            this.editingEffect.values[tabKey].base || "0"
          );
          if (baseValueStr.toUpperCase().includes("D")) {
            this.editingEffect.values[tabKey].isDiceInput = true;
            this.editingEffect.values[tabKey].base =
              parseInt(baseValueStr, 10) || 0;
          } else if (!this.editingEffect.values[tabKey].isDiceInput) {
            // 自動判定でDiceフラグが立っていない場合のみ数値変換
            this.editingEffect.values[tabKey].base = Number(baseValueStr) || 0;
          }

          const perLevelValueStr = String(
            this.editingEffect.values[tabKey].perLevel || "0"
          );
          if (perLevelValueStr.toUpperCase().includes("D")) {
            this.editingEffect.values[tabKey].isPerLevelDiceInput = true;
            this.editingEffect.values[tabKey].perLevel =
              parseInt(perLevelValueStr, 10) || 0;
          } else if (!this.editingEffect.values[tabKey].isPerLevelDiceInput) {
            this.editingEffect.values[tabKey].perLevel =
              Number(perLevelValueStr) || 0;
          }
        }
      });
      this.editingEffectType = type;
      this.editingEffectIndex = index;
      const rect = event.target.getBoundingClientRect();
      this.panelStyle = {
        top: `${rect.bottom + window.scrollY + 5}px`,
        left: `${rect.left + window.scrollX - 250}px`,
      };
      this.isPanelOpen = true;
    },
    closeEffectPanel() {
      if (this.editingEffect) {
        this.modalTabs.forEach((tab) => {
          const tabKey = tab.key;
          if (tabKey !== "crit") {
            if (tabKey === "dice") {
              // 'dice'タブは常に数値として保存
              this.editingEffect.values.dice.base =
                Number(this.editingEffect.values.dice.base) || 0;
              this.editingEffect.values.dice.perLevel =
                Number(this.editingEffect.values.dice.perLevel) || 0;
            } else {
              // 他のタブはD表記を考慮
              if (this.editingEffect.values[tabKey].isDiceInput) {
                this.editingEffect.values[
                  tabKey
                ].base = `${this.editingEffect.values[tabKey].base}D`;
              } else {
                this.editingEffect.values[tabKey].base =
                  Number(this.editingEffect.values[tabKey].base) || 0;
              }
              if (this.editingEffect.values[tabKey].isPerLevelDiceInput) {
                this.editingEffect.values[
                  tabKey
                ].perLevel = `${this.editingEffect.values[tabKey].perLevel}D`;
              } else {
                this.editingEffect.values[tabKey].perLevel =
                  Number(this.editingEffect.values[tabKey].perLevel) || 0;
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
      return str.replace(/―/g, "-");
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
          } else if (url.hostname.includes("yutorize.2-d.jp")) {
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
      return this.combos.filter((_, index) => index !== currentIndex);
    },
  },
});

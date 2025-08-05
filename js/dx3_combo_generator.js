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
    statusMessage: "",
    shareUrl: "",
    statusIsError: false,
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
    modalTabs: [
      { key: "dice", label: "ダイス" },
      { key: "crit", label: "C値" },
      { key: "achieve", label: "達成値" },
      { key: "attack", label: "ATK" },
    ],
    isEffectSelectModalOpen: false,
    editingComboIndex: -1,
    tempSelectedEffects: [],
    tempSelectedItems: [],
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
      const skillToAbilityMap = {
        白兵: "肉体",
        射撃: "感覚",
        RC: "精神",
        交渉: "社会",
      };
      return this.combos.map((combo) => {
        const comboLevelBonus = combo.comboLevelBonus || 0;
        const relevantEffects = (combo.effectNames || [])
          .map((name) => allEffects.find((e) => e.name === name && e.name))
          .filter(Boolean);
        const relevantItems = (combo.itemNames || [])
          .map((itemData) =>
            allItems.find((i) => i.name === itemData.name && i.name)
          )
          .filter(Boolean);
        const calcResult = (valueKey, items, itemKey) => {
          let totalDice = 0;
          let totalFixed = 0;
          const breakdown = [];
          const processSource = (source) => {
            if (!source.values?.[valueKey]) return;
            const effectiveLevel =
              (Number(source.level) || 0) + comboLevelBonus;
            const baseParsed = this.evaluateDiceString(
              String(source.values[valueKey].base || "0")
            );
            const perLevelParsed = this.evaluateDiceString(
              String(source.values[valueKey].perLevel || "0")
            );
            const finalValue = {
              dice: baseParsed.dice + effectiveLevel * perLevelParsed.dice,
              fixed: baseParsed.fixed + effectiveLevel * perLevelParsed.fixed,
            };
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
          relevantEffects.forEach(processSource);
          if (items && itemKey) {
            items.forEach(processSource);
          }
          return {
            dice: totalDice,
            fixed: totalFixed,
            breakdown: breakdown.join("\n"),
          };
        };
        const diceResult = calcResult("dice", relevantItems, "dice");
        const achieveResult = calcResult("achieve", relevantItems, "achieve");
        const atkResult = calcResult("attack", relevantItems, "attack");
        const weaponAtk = this.evaluateDiceString(combo.atk_weapon || "0");
        let totalAtkDice = weaponAtk.dice + atkResult.dice;
        let totalAtkFixed = weaponAtk.fixed + atkResult.fixed;
        const atkBreakdown = [
          `武器ATK: ${this.formatDiceString(weaponAtk)}`,
          atkResult.breakdown,
        ].filter(Boolean);
        let critTotal = 10;
        const critBreakdown = [];
        [...relevantEffects, ...relevantItems].forEach((source) => {
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
        const costBreakdown = [];
        if (combo.cost_manual) {
          costBreakdown.push(`手動調整: ${combo.cost_manual}`);
        }
        let totalCostDice = 0;
        let totalCostFixed = 0;
        const manualCost = this.evaluateDiceString(combo.cost_manual || "0");
        totalCostDice += manualCost.dice;
        totalCostFixed += manualCost.fixed;
        if (manualCost.dice > 0 || manualCost.fixed > 0) {
          costBreakdown.push(`手動調整: ${this.formatDiceString(manualCost)}`);
        }
        relevantEffects.forEach((e) => {
          const cost = this.evaluateDiceString(
            e.cost,
            (Number(e.level) || 0) + comboLevelBonus
          );
          if (cost.dice > 0 || cost.fixed > 0) {
            costBreakdown.push(`《${e.name}》: ${this.formatDiceString(cost)}`);
            totalCostDice += cost.dice;
            totalCostFixed += cost.fixed;
          }
        });
        relevantItems.forEach((item) => {
          const cost = this.evaluateDiceString(item.cost, item.level);
          if (cost.dice > 0 || cost.fixed > 0) {
            costBreakdown.push(
              `【${item.name}】: ${this.formatDiceString(cost)}`
            );
            totalCostDice += cost.dice;
            totalCostFixed += cost.fixed;
          }
        });
        const effectComposition = relevantEffects
          .map(
            (e) =>
              `《${e.name}》Lv${e.level}${
                comboLevelBonus > 0 ? `+${comboLevelBonus}` : ""
              }`
          )
          .join("+");
        const itemComposition = relevantItems
          .filter((item) => {
            const comboItemData = (combo.itemNames || []).find(
              (i) => i.name === item.name
            );
            return comboItemData ? comboItemData.showInComboName : false;
          })
          .map((i) => `【${i.name}】`)
          .join("+");
        const compositionText = [effectComposition, itemComposition]
          .filter(Boolean)
          .join("+");
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
        let primarySkill =
          relevantEffects.find((e) => e.skill)?.skill ||
          combo.baseAbility.skill;
        if (
          !this.dropdownOptions.skill.includes(primarySkill) ||
          !skillToAbilityMap[primarySkill]
        ) {
          primarySkill = combo.baseAbility.skill;
        }
        const abilityName = skillToAbilityMap[primarySkill] || "能力値";
        const totalDiceForFormula = diceResult.dice;
        const totalFixedBonus =
          (combo.baseAbility.value || 0) + achieveResult.fixed;
        let diceFormula = `({${abilityName}}+{侵蝕率D}+${totalDiceForFormula})DX${critTotal}`;
        if (totalFixedBonus > 0) {
          diceFormula += `+${totalFixedBonus}`;
        } else if (totalFixedBonus < 0) {
          diceFormula += `${totalFixedBonus}`;
        }
        const targetOrder = [
          "自身",
          "単体",
          "[LV+1]体",
          "2体",
          "3体",
          "範囲(選択)",
          "範囲",
          "シーン(選択)",
          "シーン",
          "-",
          "効果参照",
        ];
        let determinedTarget = "-";
        let hasSelfTarget = false;
        for (const effect of relevantEffects) {
          const target = effect.target;
          if (target === "自身") {
            hasSelfTarget = true;
            break;
          }
          if (
            targetOrder.indexOf(target) < targetOrder.indexOf(determinedTarget)
          ) {
            determinedTarget = target;
          }
        }
        if (hasSelfTarget) {
          determinedTarget = "自身";
        } else if (determinedTarget === "-") {
          determinedTarget = "単体";
        }
        const autoTarget = determinedTarget;
        const rangeOrder = [
          "至近",
          "nメートル",
          "武器",
          "視界",
          "-",
          "効果参照",
        ];
        let determinedRange = "-";
        let hasWeaponRange = false;
        for (const effect of relevantEffects) {
          const range = effect.range;
          if (range === "武器") {
            hasWeaponRange = true;
            continue;
          }
          if (rangeOrder.indexOf(range) < rangeOrder.indexOf(determinedRange)) {
            determinedRange = range;
          }
        }
        if (determinedRange === "-") {
          determinedRange = "至近";
        }
        const autoRange = determinedRange;
        const difficultyOrder = ["対決", "効果参照", "自動成功", "-"];
        let determinedDifficulty = "-";
        for (const effect of relevantEffects) {
          const difficulty = effect.difficulty;
          if (
            difficultyOrder.indexOf(difficulty) <
            difficultyOrder.indexOf(determinedDifficulty)
          ) {
            determinedDifficulty = difficulty;
          }
        }
        const autoDifficulty = determinedDifficulty;
        const finalTarget =
          combo.targetMode === "manual" && combo.manualTarget !== ""
            ? combo.manualTarget
            : autoTarget;
        const finalRange =
          combo.rangeMode === "manual" && combo.manualRange !== ""
            ? combo.manualRange
            : autoRange;
        const finalDifficulty = autoDifficulty;

        const timingOrder = [
          "メジャー",
          "メジャー／リア",
          "リアクション",
          "マイナー",
          "オート",
          "セットアップ",
          "イニシアチブ",
          "クリンナップ",
          "常時",
          "-",
          "効果参照",
        ];
        let determinedTiming = "-";
        const majorActionTimings = ["メジャー", "メジャー／リア"];

        for (const effect of relevantEffects) {
          const timing = effect.timing;
          if (timing === "オート" || timing === "常時") continue;
          if (
            timingOrder.indexOf(timing) < timingOrder.indexOf(determinedTiming)
          ) {
            determinedTiming = timing;
          }
        }

        const autoTiming =
          determinedTiming === "-" ? "メジャー" : determinedTiming;

        const finalTiming =
          combo.timingMode === "manual" && combo.manualTiming !== ""
            ? combo.manualTiming
            : autoTiming;

        const isMajorAction = majorActionTimings.some((t) =>
          finalTiming.includes(t)
        );

        const effectDescriptionForPalette =
          combo.effectDescriptionMode === "manual"
            ? combo.manualEffectDescription
            : autoEffectText;

        const chatPalette = {
          header: [
            `◆${combo.name}`,
            compositionText,
            combo.flavor ? `『${combo.flavor}』` : "",
            `侵蝕値:${this.formatDiceString({
              dice: totalCostDice,
              fixed: totalCostFixed,
            })}　タイミング:${finalTiming}　技能:${primarySkill}　難易度:${finalDifficulty}　対象:${finalTarget}　射程:${finalRange}　ATK:${this.formatDiceString(
              { dice: totalAtkDice, fixed: totalAtkFixed }
            )}　C値:${critTotal}`,
            effectDescriptionForPalette,
          ]
            .filter(Boolean)
            .join("\n"),
          diceFormula: diceFormula,
        };
        return {
          ...combo,
          totalDice: diceResult.dice,
          diceBreakdown: diceResult.breakdown,
          finalCrit: critTotal,
          critBreakdown: critBreakdown.join("\n"),
          totalAchieve: (combo.baseAbility.value || 0) + achieveResult.fixed,
          achieveBreakdown: [
            combo.baseAbility.value ? `技能: ${combo.baseAbility.value}` : null,
            achieveResult.breakdown,
          ]
            .filter(Boolean)
            .join("\n"),
          totalAtk: this.formatDiceString({
            dice: totalAtkDice,
            fixed: totalAtkFixed,
          }),
          atkBreakdown: atkBreakdown.join("\n"),
          totalCost: this.formatDiceString({
            dice: totalCostDice,
            fixed: totalCostFixed,
          }),
          costBreakdown: costBreakdown.join("\n"),
          compositionText,
          autoEffectText,
          chatPalette,
          target: finalTarget,
          range: finalRange,
          timing: finalTiming,
          isMajorAction: isMajorAction,
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
      },
      deep: true,
    },
    easyEffects: {
      handler: function (newVal, oldVal) {
        this.handleEffectChange(newVal, oldVal);
        this.setDataDirty();
      },
      deep: true,
    },
    items: {
      handler: function (newVal, oldVal) {
        this.setDataDirty();
      },
      deep: true,
    },
    combos: { handler: "setDataDirty", deep: true },
    characterSheetUrl: {
      handler: function (newVal, oldVal) {
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
  },
  updated() {
    this.$nextTick(() => {
      this.adjustAllTextareaHeights();
    });
  },
  methods: {
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
    parseAttackFormula(item) {
      if (!item || typeof item.attack !== "string") return;
      const formula = item.attack.replace(/\s/g, "");
      if (formula === "") {
        this.$set(item.values.attack, "base", 0);
        this.$set(item.values.attack, "perLevel", 0);
        return;
      }
      let base = 0;
      let perLevel = 0;
      try {
        const baseFormula = formula.replace(/lv/gi, "(0)");
        const sanitizedBaseFormula = baseFormula.replace(/[^-()\d/*+.]/g, "");
        if (sanitizedBaseFormula) {
          base = new Function("return " + sanitizedBaseFormula)();
        }
      } catch (e) {
        base = 0;
      }
      try {
        const perLevelFormula = formula.replace(/lv/gi, "(1)");
        const sanitizedPerLevelFormula = perLevelFormula.replace(
          /[^-()\d/*+.]/g,
          ""
        );
        if (sanitizedPerLevelFormula) {
          const totalAtLv1 = new Function(
            "return " + sanitizedPerLevelFormula
          )();
          perLevel = totalAtLv1 - base;
        }
      } catch (e) {
        perLevel = 0;
      }
      if (isNaN(base)) base = 0;
      if (isNaN(perLevel)) perLevel = 0;
      if (item.values.attack.base !== base) {
        this.$set(item.values.attack, "base", base);
      }
      if (item.values.attack.perLevel !== perLevel) {
        this.$set(item.values.attack, "perLevel", perLevel);
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
        .map((name) => {
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
    showStatus(message, isError = false, duration = 4000) {
      this.statusMessage = message;
      this.statusIsError = isError;
      if (duration > 0) {
        setTimeout(() => {
          this.statusMessage = "";
          this.statusIsError = false;
        }, duration);
      }
    },
    validateInputs() {
      if (!this.characterSheetUrl) {
        this.showStatus("キャラクターシートのURLを入力してください。", true);
        return false;
      }
      return true;
    },
    async overwriteSave() {
      if (
        !this.validateInputs() ||
        !this.gasWebAppUrl.startsWith("https://script.google.com/") ||
        !confirm(
          "現在の内容でデータを上書き保存しますか？\n（このURLのデータがなければ新規作成されます）"
        )
      )
        return;
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
            action: "save",
            id: this.characterSheetUrl,
            data: dataToSave,
            shareUrl: this.shareUrl,
          }),
        });
        const result = await response.json();
        if (result.status !== "success")
          throw new Error(result.message || "不明なエラー");
        this.showStatus("保存しました！");
        this.isDirty = false;
      } catch (error) {
        console.error("Save Error:", error);
        this.showStatus(`保存エラー: ${error.message}`, true);
      } finally {
        this.isBusy = false;
      }
    },
    async deleteFromDb() {
      if (
        !this.validateInputs() ||
        !this.gasWebAppUrl.startsWith("https://script.google.com/") ||
        !confirm(
          `本当にこのURLのデータを削除しますか？\nこの操作は元に戻せません。\n\nURL: ${this.characterSheetUrl}`
        )
      )
        return;
      this.isBusy = true;
      this.showStatus("削除中...", false, 0);
      try {
        const response = await fetch(this.gasWebAppUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "delete",
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
      if (
        this.isDirty &&
        !skipConfirm &&
        !confirm("現在の編集内容は破棄されます。DBからデータを読み込みますか？")
      ) {
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
            values: e.values || this.createDefaultValues(),
          }));
          this.easyEffects = (d.easyEffects || []).map((e) => ({
            ...this.createDefaultEffect(),
            ...e,
            level: Number(e.level) || 1,
            values: e.values || this.createDefaultValues(),
          }));
          this.items = (d.items || []).map((i) => ({
            ...i,
            level: Number(i.level) || 1,
            values: i.values || this.createDefaultValues(),
          }));
          this.items.forEach((item) => this.parseAttackFormula(item));
          this.combos = (d.combos || []).map((c) => ({
            ...this.createDefaultCombo(),
            ...c,
          }));
          this.showStatus("DBからデータを読み込みました。");
          this.isDirty = false;
          if (
            confirm(
              "キャラクターシートの最新データで、キャラクター名、経験点、エフェクト、アイテムを更新しますか？\n（注意：現在作成中のコンボデータは維持されます）"
            )
          ) {
            await this.importFromSheet(true, true);
          }
        } else if (result.status === "not_found") {
          if (
            confirm(
              "DBにデータがありません。\nキャラクターシートから新規にデータを引用しますか？"
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
    async importFromSheet(mergeMode = false, skipConfirmation = false) {
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
          !confirm(
            confirmMessage +
              `・総経験点: ${importedData.totalXp}\n` +
              `・エフェクト: ${effectsCount}件\n` +
              `・イージーエフェクト: ${easyEffectsCount}件\n` +
              `・アイテム: ${itemsCount}件`
          )
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
        }
        const defaultEffects = this.effects.filter((e) =>
          this.isEssentialEffect(e.name)
        );
        const importedEffects = (importedData.effects || []).map((e) => ({
          ...this.createDefaultEffect(),
          ...e,
          values:
            (mergeMode && existingValues.get(e.name)) ||
            this.createDefaultValues(),
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
            (mergeMode && existingValues.get(e.name)) ||
            this.createDefaultValues(),
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
        this.items = (importedData.items || []).map((i) => ({
          ...defaultItem,
          ...i,
          values:
            (mergeMode && existingValues.get(i.name)) ||
            this.createDefaultValues(),
        }));
        this.items.forEach((item) => this.parseAttackFormula(item));
        this.showStatus(
          mergeMode
            ? "エフェクトとアイテムを更新しました！"
            : "キャラクターシートからデータを引用しました！"
        );
        this.isDirty = false;
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
      this.modalTabs.forEach((tab) => {
        values[tab.key] = {
          base: 0,
          perLevel: 0,
          isDiceInput: false,
          isPerLevelDiceInput: false,
        };
      });
      values.crit.base = 0;
      values.crit.min = 10;
      return values;
    },
    isEffectDisabled(source) {
      if (!source || typeof source.timing === "undefined") {
        return false;
      }
      const normalizeTiming = (str) => {
        if (!str) return "";
        return str
          .toLowerCase()
          .replace(/ﾒｼﾞｬｰ/g, "メジャー")
          .replace(/ﾏｲﾅｰ/g, "マイナー")
          .replace(/ﾘｱｸｼｮﾝ/g, "リアクション")
          .replace(/ﾘｱ/g, "リア")
          .replace(/ｵｰﾄ/g, "オート")
          .replace(/ｾｯﾄｱｯﾌﾟ/g, "セットアップ")
          .replace(/ｲﾆｼｱﾁﾌﾞ/g, "イニシアチブ")
          .replace(/ｸﾘﾝﾅｯﾌﾟ/g, "クリンナップ")
          .replace(/\//g, "／");
      };
      const selectedSources = this.tempSelectedEffects.filter(
        (s) => typeof s.timing !== "undefined"
      );
      const primaryTimingSource = selectedSources.find(
        (s) => s.timing && normalizeTiming(s.timing) !== "オート"
      );
      if (!primaryTimingSource) return false;
      const primaryTimings = normalizeTiming(primaryTimingSource.timing).split(
        "／"
      );
      const sourceTimingStr = normalizeTiming(source.timing);
      if (sourceTimingStr === "オート" || sourceTimingStr === "") return false;
      const sourceTimings = sourceTimingStr.split("／");
      return !primaryTimings.some((pt) => sourceTimings.includes(pt));
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
        baseAbility: { skill: "白兵", value: 0 },
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
    openEffectPanel(event, source, type, index) {
      this.editingEffect = JSON.parse(JSON.stringify(source));
      this.modalTabs.forEach((tab) => {
        if (tab.key !== "crit") {
          const baseValue = String(
            this.editingEffect.values[tab.key].base || "0"
          );
          const parsedBase = this.evaluateDiceString(baseValue);
          this.editingEffect.values[tab.key].isDiceInput = parsedBase.dice > 0;
          if (parsedBase.dice > 0) {
            this.editingEffect.values[tab.key].base = parsedBase.dice;
          } else {
            this.editingEffect.values[tab.key].base = parsedBase.fixed;
          }
          const perLevelValue = String(
            this.editingEffect.values[tab.key].perLevel || "0"
          );
          const parsedPerLevel = this.evaluateDiceString(perLevelValue);
          this.editingEffect.values[tab.key].isPerLevelDiceInput =
            parsedPerLevel.dice > 0;
          if (parsedPerLevel.dice > 0) {
            this.editingEffect.values[tab.key].perLevel = parsedPerLevel.dice;
          } else {
            this.editingEffect.values[tab.key].perLevel = parsedPerLevel.fixed;
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
      this.modalTabs = [
        { key: "dice", label: "ダイス" },
        { key: "crit", label: "C値" },
        { key: "achieve", label: "達成値" },
        { key: "attack", label: "ATK" },
      ];
      this.isPanelOpen = true;
      this.activeModalTab = "dice";
    },
    closeEffectPanel() {
      if (this.editingEffect) {
        this.modalTabs.forEach((tab) => {
          if (tab.key !== "crit") {
            if (this.editingEffect.values[tab.key].isDiceInput) {
              this.editingEffect.values[tab.key].base = `${
                this.editingEffect.values[tab.key].base
              }D`;
            } else {
              this.editingEffect.values[tab.key].base =
                Number(this.editingEffect.values[tab.key].base) || 0;
            }
            if (this.editingEffect.values[tab.key].isPerLevelDiceInput) {
              this.editingEffect.values[tab.key].perLevel = `${
                this.editingEffect.values[tab.key].perLevel
              }D`;
            } else {
              this.editingEffect.values[tab.key].perLevel =
                Number(this.editingEffect.values[tab.key].perLevel) || 0;
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
      }
      this.isPanelOpen = false;
      this.editingEffect = null;
    },
    openEffectSelectModal(comboIndex) {
      this.editingComboIndex = comboIndex;
      const combo = this.combos[comboIndex];
      this.tempSelectedEffects = (combo.effectNames || [])
        .map((name) =>
          [...this.effects, ...this.easyEffects].find((e) => e.name === name)
        )
        .filter(Boolean);
      this.tempSelectedItems = (combo.itemNames || [])
        .map((itemData) => this.items.find((i) => i.name === itemData.name))
        .filter(Boolean);
      this.isEffectSelectModalOpen = true;
    },
    confirmEffectSelection() {
      if (this.editingComboIndex !== -1) {
        const combo = this.combos[this.editingComboIndex];
        const effectNames = this.tempSelectedEffects.map((e) => e.name);
        const itemNames = this.tempSelectedItems.map((item) => {
          const existingItem = (combo.itemNames || []).find(
            (i) => i.name === item.name
          );
          return {
            name: item.name,
            showInComboName: existingItem ? existingItem.showInComboName : true,
          };
        });
        this.$set(combo, "effectNames", effectNames);
        this.$set(combo, "itemNames", itemNames);
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
    isItemSelected(itemName) {
      if (!this.isEffectSelectModalOpen) return false;
      return this.tempSelectedItems.some((item) => item.name === itemName);
    },
    isShowInComboName(itemName) {
      if (!this.isEffectSelectModalOpen) return false;
      const combo = this.combos[this.editingComboIndex];
      const itemData = (combo.itemNames || []).find((i) => i.name === itemName);
      return itemData ? itemData.showInComboName : true;
    },
    toggleShowInComboName(itemToToggle) {
      if (!this.isEffectSelectModalOpen) return;
      const combo = this.combos[this.editingComboIndex];
      const isCurrentlySelected = this.tempSelectedItems.some(
        (item) => item.name === itemToToggle.name
      );
      if (!isCurrentlySelected) return;
      let itemData = (combo.itemNames || []).find(
        (i) => i.name === itemToToggle.name
      );
      if (!itemData) {
        itemData = { name: itemToToggle.name, showInComboName: true };
        if (!combo.itemNames) {
          this.$set(combo, "itemNames", []);
        }
        combo.itemNames.push(itemData);
      }
      itemData.showInComboName = !itemData.showInComboName;
      this.$forceUpdate();
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
  },
});

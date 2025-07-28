// dx3_combo_generator.js

new Vue({
  el: "#dx3-app",
  data: {
    characterName: "春日恭二（例）",
    totalXp: 165,
    effects: [],
    easyEffects: [],
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
    tempSelectedEffectNames: [],
  },
  created() {
    this.effects = [
      {
        name: "コンセントレイト：キュマイラ",
        level: 3,
        maxLevel: 3,
        timing: "メジャー",
        skill: "シンドローム",
        difficulty: "-",
        target: "-",
        range: "-",
        cost: "2",
        limit: "-",
        effect: "組み合わせた判定のクリティカル値を-LVする(下限値7)。",
        notes: "",
        values: {
          dice: { base: 0, perLevel: 0 },
          crit: { base: 10, perLevel: 1, min: 7 },
          achieve: { base: 0, perLevel: 0 },
          attack: { base: 0, perLevel: 0 },
        },
      },
      {
        name: "渇きの主",
        level: 2,
        maxLevel: 5,
        timing: "メジャー",
        skill: "白兵",
        difficulty: "対決",
        target: "単体",
        range: "至近",
        cost: "4",
        limit: "-",
        effect: "装甲無視。HPを[LV*4]点回復。素手か《赫き剣》限定。",
        notes: "",
        values: {
          dice: { base: 0, perLevel: 0 },
          crit: { base: 0, perLevel: 0, min: 2 },
          achieve: { base: 0, perLevel: 0 },
          attack: { base: 0, perLevel: 0 },
        },
      },
      {
        name: "吸収",
        level: 2,
        maxLevel: 3,
        timing: "メジャー",
        skill: "白兵/射撃",
        difficulty: "対決",
        target: "-",
        range: "武器",
        cost: "2",
        limit: "-",
        effect: "ダメージを与えたら対象の判定ダイス-LV個。",
        notes: "",
        values: {
          dice: { base: 0, perLevel: 0 },
          crit: { base: 0, perLevel: 0, min: 2 },
          achieve: { base: 0, perLevel: 0 },
          attack: { base: 0, perLevel: 0 },
        },
      },
      {
        name: "オールレンジ",
        level: 2,
        maxLevel: 5,
        timing: "メジャー",
        skill: "白兵/射撃",
        difficulty: "対決",
        target: "-",
        range: "武器",
        cost: "2",
        limit: "-",
        effect: "判定のダイスを+LV個する。",
        notes: "",
        values: {
          dice: { base: 0, perLevel: 1 },
          crit: { base: 0, perLevel: 0, min: 2 },
          achieve: { base: 0, perLevel: 0 },
          attack: { base: 0, perLevel: 0 },
        },
      },
      {
        name: "イージスの盾",
        level: 2,
        maxLevel: 3,
        timing: "オート",
        skill: "",
        difficulty: "自動成功",
        target: "-",
        range: "至近",
        cost: "3",
        limit: "-",
        effect: "ガード値+(LV)D",
        notes: "",
        values: {
          dice: { base: 0, perLevel: 0 },
          crit: { base: 0, perLevel: 0, min: 2 },
          achieve: { base: 0, perLevel: 0 },
          attack: { base: 0, perLevel: 0 },
        },
      },
      {
        name: "獣の力",
        level: 2,
        maxLevel: 5,
        timing: "メジャー",
        skill: "白兵",
        difficulty: "対決",
        target: "-",
        range: "武器",
        cost: "2",
        limit: "-",
        effect: "白兵攻撃の攻撃力を+[LV*2]する。",
        notes: "",
        values: {
          dice: { base: 0, perLevel: 0 },
          crit: { base: 0, perLevel: 0, min: 2 },
          achieve: { base: 0, perLevel: 0 },
          attack: { base: 0, perLevel: 2 },
        },
      },
      {
        name: "破壊の爪",
        level: 2,
        maxLevel: 5,
        timing: "マイナー",
        skill: "",
        difficulty: "自動成功",
        target: "自身",
        range: "至近",
        cost: "3",
        limit: "-",
        effect: "素手変更。攻撃力[LV*2+8]。",
        notes: "",
        values: {
          dice: { base: 0, perLevel: 0 },
          crit: { base: 0, perLevel: 0, min: 2 },
          achieve: { base: 0, perLevel: 0 },
          attack: { base: 8, perLevel: 2 },
        },
      },
      {
        name: "ハンティングスタイル",
        level: 2,
        maxLevel: 3,
        timing: "マイナー",
        skill: "",
        difficulty: "自動成功",
        target: "自身",
        range: "至近",
        cost: "1",
        limit: "-",
        effect: "戦闘移動。離脱可。1シナリオLV回。",
        notes: "",
        values: {
          dice: { base: 0, perLevel: 0 },
          crit: { base: 0, perLevel: 0, min: 2 },
          achieve: { base: 0, perLevel: 0 },
          attack: { base: 0, perLevel: 0 },
        },
      },
    ];
    this.addCombo();
  },
  computed: {
    effectXp() {
      return this.effects.reduce((total, effect) => {
        if (!effect.level || effect.level <= 0) return total;
        return (
          total +
          (Number(effect.level) === 1
            ? 15
            : 15 + (Number(effect.level) - 1) * 5)
        );
      }, 0);
    },
    easyEffectXp() {
      return this.easyEffects.reduce((total, ee) => {
        if (!ee.level || ee.level <= 0) return total;
        return total + Number(ee.level) * 2;
      }, 0);
    },
    usedXp() {
      return this.effectXp + this.easyEffectXp;
    },
    processedCombos() {
      const allEffects = [...this.effects, ...this.easyEffects];

      return this.combos.map((combo) => {
        const comboLevelBonus = combo.comboLevelBonus || 0;
        const relevantEffects = combo.effectNames
          .map((name) =>
            allEffects.find((e) => e.name === name && e.name !== "")
          )
          .filter((e) => e);

        const calcResult = (valueKey) => {
          let total = 0;
          const breakdown = relevantEffects
            .map((effect) => {
              if (!effect.values || !effect.values[valueKey]) return "";
              const effectiveLevel =
                (Number(effect.level) || 0) + comboLevelBonus;
              const base = Number(effect.values[valueKey].base) || 0;
              const perLevel = Number(effect.values[valueKey].perLevel) || 0;
              const value = base + effectiveLevel * perLevel;
              total += value;
              return `${effect.name}(Lv${effectiveLevel}): ${base} + (${effectiveLevel}*${perLevel}) = ${value}`;
            })
            .filter((s) => s)
            .join("\n");
          return { total, breakdown };
        };

        const diceResult = calcResult("dice");
        const achieveResult = calcResult("achieve");
        const atkResult = calcResult("attack");

        let critTotal = 10;
        const critBreakdown = relevantEffects
          .map((effect) => {
            if (!effect.values || !effect.values.crit) return "";
            const base = Number(effect.values.crit.base) || 0;
            if (base > 0) {
              const effectiveLevel =
                (Number(effect.level) || 0) + comboLevelBonus;
              const perLevel = Number(effect.values.crit.perLevel) || 0;
              const min = Number(effect.values.crit.min) || 2;
              const value = Math.max(base - effectiveLevel * perLevel, min);
              if (value < critTotal) critTotal = value;
              return `${effect.name}(Lv${effectiveLevel}): max(${base} - (${effectiveLevel}*${perLevel}), ${min}) = ${value}`;
            }
            return "";
          })
          .filter((s) => s)
          .join("\n");

        const autoCost = relevantEffects.reduce((sum, effect) => {
          const effectiveLevel = (Number(effect.level) || 0) + comboLevelBonus;
          return sum + (this.parseCost(effect.cost, effectiveLevel) || 0);
        }, 0);
        const totalCost = autoCost + (combo.cost_manual || 0);
        const costBreakdown =
          relevantEffects
            .map(
              (e) =>
                `${e.name}: ${this.parseCost(
                  e.cost,
                  (Number(e.level) || 0) + comboLevelBonus
                )}`
            )
            .join("\n") + `\n手動:${combo.cost_manual || 0}`;

        const totalAtk = (combo.atk_weapon || 0) + atkResult.total;
        const atkBreakdown =
          `武器ATK: ${combo.atk_weapon || 0}\n` + atkResult.breakdown;

        const compositionText = relevantEffects
          .map((e) => {
            const effectiveLevel = (Number(e.level) || 0) + comboLevelBonus;
            if (e.maxLevel == 1 && e.level == 1) return `《${e.name}》`;
            if (comboLevelBonus > 0)
              return `《${e.name}》Lv${e.level}+${comboLevelBonus}`;
            return `《${e.name}》Lv${e.level}`;
          })
          .join("+");

        const primarySkill =
          relevantEffects.find((e) => e.skill)?.skill || "{技能}";
        const diceFormula = `(${primarySkill}+{能力値}+{侵蝕率D}+${diceResult.total})DX${critTotal}+${achieveResult.total}`;
        const chatPalette = `◆${combo.name}\n侵蝕値:${totalCost} ATK:${totalAtk}\n${diceFormula}`;

        return {
          ...combo,
          totalDice: diceResult.total,
          diceBreakdown: diceResult.breakdown,
          finalCrit: critTotal,
          critBreakdown,
          totalAchieve: achieveResult.total,
          achieveBreakdown: achieveResult.breakdown,
          totalAtk,
          atkBreakdown,
          totalCost,
          costBreakdown,
          compositionText,
          chatPalette,
        };
      });
    },
    activeModalTabLabel() {
      const tab = this.modalTabs.find((t) => t.key === this.activeModalTab);
      return tab ? tab.label : "";
    },
  },
  methods: {
    isEffectDisabled(effect) {
      const allRegisteredEffects = [...this.effects, ...this.easyEffects];
      const selectedEffectObjects = this.tempSelectedEffectNames
        .map((name) => allRegisteredEffects.find((e) => e.name === name))
        .filter((e) => e);
      const primaryTimingEffect = selectedEffectObjects.find(
        (e) => e.timing && e.timing.toLowerCase() !== "オート"
      );

      if (!primaryTimingEffect) return false;

      const primaryTiming = primaryTimingEffect.timing.toLowerCase();
      const effectTiming = effect.timing ? effect.timing.toLowerCase() : "";

      return (
        effectTiming !== "オート" &&
        effectTiming !== "" &&
        effectTiming !== primaryTiming
      );
    },
    createDefaultValues() {
      const values = {};
      this.modalTabs.forEach((tab) => {
        values[tab.key] = { base: 0, perLevel: 0 };
      });
      values.crit.min = 2;
      return values;
    },
    addEffect() {
      this.effects.push({
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
      });
    },
    removeEffect(index) {
      this.effects.splice(index, 1);
    },
    addEasyEffect() {
      this.easyEffects.push({
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
      });
    },
    removeEasyEffect(index) {
      this.easyEffects.splice(index, 1);
    },
    addCombo() {
      this.combos.push({
        name: `コンボ${this.combos.length + 1}`,
        effectNames: [],
        atk_weapon: 0,
        cost_manual: 0,
        comboLevelBonus: 0,
        flavor: "",
        effectDescriptionMode: "auto",
        manualEffectDescription: "",
      });
    },
    removeCombo(index) {
      this.combos.splice(index, 1);
    },
    parseCost(costStr, level) {
      if (!costStr) return 0;
      const str = String(costStr).toLowerCase();
      if (str.includes("lv")) {
        const multiplier = parseInt(str.replace("lv", ""), 10) || 1;
        return multiplier * Number(level);
      }
      const num = parseInt(str, 10);
      return isNaN(num) ? 0 : num;
    },
    replaceLvl(text, level) {
      if (!text) return "";
      let result = String(text);
      return result
        .replace(
          /\[\s*LV\s*([*+])\s*(\d+)\s*\]/gi,
          (match, operator, value) => {
            const numValue = parseInt(value, 10);
            if (operator === "*") return level * numValue;
            if (operator === "+") return level + numValue;
            return match;
          }
        )
        .replace(/LV/gi, String(level));
    },
    openEffectPanel(event, effect, type, index) {
      this.editingEffect = JSON.parse(JSON.stringify(effect));
      this.editingEffectType = type;
      this.editingEffectIndex = index;

      const rect = event.target.getBoundingClientRect();
      this.panelStyle = {
        top: `${rect.bottom + window.scrollY + 5}px`,
        left: `${rect.left + window.scrollX - 250}px`,
      };

      this.isPanelOpen = true;
      this.activeModalTab = "dice";
    },
    closeEffectPanel() {
      if (this.editingEffect) {
        if (this.editingEffectType === "effect") {
          this.$set(this.effects, this.editingEffectIndex, this.editingEffect);
        } else {
          this.$set(
            this.easyEffects,
            this.editingEffectIndex,
            this.editingEffect
          );
        }
      }
      this.isPanelOpen = false;
      this.editingEffect = null;
    },
    openEffectSelectModal(comboIndex) {
      this.editingComboIndex = comboIndex;
      this.tempSelectedEffectNames = [...this.combos[comboIndex].effectNames];
      this.isEffectSelectModalOpen = true;
    },
    confirmEffectSelection() {
      if (this.editingComboIndex !== -1) {
        this.$set(
          this.combos[this.editingComboIndex],
          "effectNames",
          this.tempSelectedEffectNames
        );
      }
      this.isEffectSelectModalOpen = false;
    },
    cancelEffectSelection() {
      this.isEffectSelectModalOpen = false;
    },
    switchToManualMode(combo, index) {
      if (combo.effectDescriptionMode === "auto") {
        const processed = this.processedCombos[index];
        if (processed) {
          combo.manualEffectDescription = processed.autoEffectText;
        }
      }
      combo.effectDescriptionMode = "manual";
    },
    closeAllDropdowns() {
      if (this.isPanelOpen) {
        this.closeEffectPanel();
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
  },
});

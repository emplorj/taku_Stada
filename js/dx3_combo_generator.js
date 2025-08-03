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
  },
  data() {
    return {
      isOpen: false,
      dropdownStyle: {}, // ここでdropdownStyleを定義
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
            zIndex: 9999, // 他の要素の上に表示されるように高いz-indexを設定
          };
        } else {
          // エラーハンドリング: input要素が見つからない場合
          this.isOpen = false;
        }
      } else {
        this.dropdownStyle = {}; // 閉じる際にスタイルをリセット
      }
    },
    selectOption(option) {
      this.$emit("input", option);
      this.isOpen = false;
      this.dropdownStyle = {}; // 選択後にスタイルをリセット
    },
    handleInput(event) {
      this.$emit("input", event.target.value);
    },
    closeDropdown() {
      if (this.isOpen) {
        this.isOpen = false;
        this.dropdownStyle = {}; // 外側クリックで閉じる際にスタイルをリセット
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
    shareUrl: "", // 共有URLを追加
    statusIsError: false,
    isDirty: false,
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
        "白兵/射撃",
        "白兵/RC",
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
      baseSkillSelect: ["白兵", "射撃", "RC", "交渉"],
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
      // URLからキャラクターシートURLを読み込む
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
        this.loadFromDb(); // URLがあれば自動で読み込みを試みる
      }
      this.generateShareUrl(); // 初期共有URLを生成
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
          let total = 0;
          const breakdown = [];
          relevantEffects.forEach((effect) => {
            if (!effect.values?.[valueKey]) return;
            const effectiveLevel =
              (Number(effect.level) || 0) + comboLevelBonus;
            const base = Number(effect.values[valueKey].base) || 0;
            const perLevel = Number(effect.values[valueKey].perLevel) || 0;
            const value = base + effectiveLevel * perLevel;
            if (value !== 0) {
              total += value;
              breakdown.push(`${effect.name}(Lv${effectiveLevel}): ${value}`);
            }
          });
          if (items && itemKey) {
            items.forEach((item) => {
              if (!item.values?.[valueKey]) return;
              const effectiveLevel =
                (Number(item.level) || 0) + comboLevelBonus;
              const base = Number(item.values[valueKey].base) || 0;
              const perLevel = Number(item.values[valueKey].perLevel) || 0;
              const value = base + effectiveLevel * perLevel;
              if (value !== 0) {
                total += value;
                breakdown.push(`${item.name}(Lv${effectiveLevel}): ${value}`);
              }
            });
          }
          return { total, breakdown: breakdown.join("\n") };
        };
        const diceResult = calcResult("dice", relevantItems, "dice");
        const achieveResult = calcResult("achieve", relevantItems, "achieve");
        const atkResult = calcResult("attack", relevantItems, "attack");
        let totalAtk = (combo.atk_weapon || 0) + atkResult.total;
        const atkBreakdown = [
          `武器ATK: ${combo.atk_weapon || 0}`,
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
        let totalCost = relevantEffects.reduce((sum, e) => {
          let cost = 0;
          try {
            cost =
              this.evaluateValue(
                e.cost,
                (Number(e.level) || 0) + comboLevelBonus
              ) || 0;
          } catch (e) {
            /* costが計算できない文字列の場合は0として扱う */
          }
          if (cost !== 0) {
            costBreakdown.push(`《${e.name}》: ${cost}`);
          }
          return sum + cost;
        }, combo.cost_manual || 0);
        relevantItems.forEach((item) => {
          let cost = 0;
          try {
            cost = this.evaluateValue(item.cost, item.level);
          } catch (e) {
            /* costが計算できない文字列の場合は0として扱う */
          }
          if (cost !== 0) {
            costBreakdown.push(`【${item.name}】: ${cost}`);
            totalCost += cost;
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
        const primarySkill =
          relevantEffects.find((e) => e.skill)?.skill ||
          combo.baseAbility.skill;

        const skillToAbilityMap = {
          白兵: "肉体",
          射撃: "感覚",
          RC: "精神",
          交渉: "社会",
        };
        const abilityName = skillToAbilityMap[primarySkill] || "能力値";
        const totalDiceBonus =
          (combo.baseAbility.value || 0) + diceResult.total;

        const diceFormula = `({${abilityName}}+{侵蝕率D}+${diceResult.total})DX${critTotal}+${combo.baseAbility.value}+${achieveResult.total}`;

        // 対象と射程の自動計算
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
            break; // 「自身」があれば最優先
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
          determinedTarget = "単体"; // 「-」の場合は「単体」に
        }
        const autoTarget = determinedTarget;

        const rangeOrder = [
          "至近",
          "nメートル",
          "武器",
          "視界",
          "-",
          "効果参照",
        ]; // nメートルは仮
        let determinedRange = "-";
        let hasWeaponRange = false; // 武器射程があるかどうかのフラグ

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
          determinedRange = "至近"; // 「-」の場合は「至近」に
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

        const effectDescriptionForPalette =
          combo.effectDescriptionMode === "manual"
            ? combo.manualEffectDescription
            : autoEffectText;

        const chatPalette = {
          header: [
            `◆${combo.name}`,
            compositionText,
            combo.flavor ? `『${combo.flavor}』` : "",
            `侵蝕値:${totalCost}　タイミング:${
              relevantEffects.find((e) => e.timing && e.timing !== "オート")
                ?.timing || "-"
            }　技能:${primarySkill}　難易度:${finalDifficulty}　対象:${finalTarget}　射程:${finalRange}　ATK:${totalAtk}　C値:${critTotal}`,
            effectDescriptionForPalette,
          ]
            .filter(Boolean)
            .join("\n"),
          diceFormula: diceFormula,
        };
        return {
          ...combo,
          totalDice: diceResult.total,
          diceBreakdown: diceResult.breakdown,
          finalCrit: critTotal,
          critBreakdown: critBreakdown.join("\n"),
          totalAchieve: achieveResult.total,
          achieveBreakdown: achieveResult.breakdown,
          totalAtk,
          atkBreakdown: atkBreakdown.join("\n"),
          totalCost,
          costBreakdown: costBreakdown.join("\n"),
          compositionText,
          autoEffectText,
          chatPalette,
          target: finalTarget,
          range: finalRange,
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
    // ▼▼▼ ここから修正 ▼▼▼
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
    // ▲▲▲ ここまで修正 ▲▲▲
    combos: { handler: "setDataDirty", deep: true },
    characterSheetUrl: {
      handler: function (newVal, oldVal) {
        this.setDataDirty();
        this.generateShareUrl(); // characterSheetUrlが変更されたら共有URLを更新
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
    // ▼▼▼ このメソッドを丸ごと追加 ▼▼▼
    updateAndSyncLevel(sourceType, index, value) {
      const newLevel = Number(value);
      if (isNaN(newLevel)) return;

      const item = this[sourceType][index];
      if (!item || Number(item.level) === newLevel) return;

      // 変更されたアイテムのレベルを更新
      this.$set(item, "level", newLevel);

      // 同期処理を呼び出す
      this.syncEffectAndItemLevels(item.name, newLevel);
    },
    // ▲▲▲ ここまで追加 ▲▲▲

    // ▼▼▼ このメソッドを丸ごと置き換え ▼▼▼
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
    // ▲▲▲ ここまで置き換え ▲▲▲
    updateNameAndSync(sourceType, index, newName) {
      const item = this[sourceType][index];
      if (!item || item.name === newName) return;

      this.$set(item, "name", newName);

      const existingItem = [
        ...this.effects,
        ...this.easyEffects,
        ...this.items,
      ].find((i) => i.name === newName && i !== item);
      if (existingItem) {
        this.syncEffectAndItemLevels(newName, existingItem.level);
      }
    },
    setDataDirty() {
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
    async loadFromDb() {
      if (!this.validateInputs()) return;

      if (
        this.isDirty &&
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
            level: Number(e.level) || 1, // レベルを数値に変換
            values: e.values || this.createDefaultValues(),
          }));
          this.easyEffects = (d.easyEffects || []).map((e) => ({
            ...this.createDefaultEffect(),
            ...e,
            level: Number(e.level) || 1, // レベルを数値に変換
            values: e.values || this.createDefaultValues(),
          }));
          this.items = (d.items || []).map((i) => ({
            ...i,
            level: Number(i.level) || 1, // レベルを数値に変換
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
              "キャラクターシートの最新データで、エフェクトとアイテムを更新しますか？\n（注意：現在作成中のコンボデータは維持されます）"
            )
          ) {
            await this.importFromSheet(true, true); // マージモード、確認スキップで実行
          }
        } else if (result.status === "not_found") {
          if (
            confirm(
              "DBにデータがありません。\nキャラクターシートから新規にデータを引用しますか？"
            )
          ) {
            this.otherXp = 0;
            await this.importFromSheet(false, true); // 新規モード、確認スキップで実行
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
          ? `以下の内容でエフェクトとアイテムを上書きしますか？\n（コンボデータは維持されます）\n\n`
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

        if (!mergeMode) {
          this.characterName = importedData.characterName;
          this.totalXp = importedData.totalXp;
          this.otherXp = 0;
          this.combos = [];
        }

        this.effects = (importedData.effects || []).map((e) => ({
          ...this.createDefaultEffect(),
          ...e,
          values:
            (mergeMode && existingValues.get(e.name)) ||
            this.createDefaultValues(),
        }));
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
      const effectNum = parseInt(jsonData.effectNum, 10) || 0;
      for (let i = 1; i <= effectNum; i++) {
        const nameKey = `effect${i}Name`;
        if (jsonData[nameKey]) {
          const effect = {
            name: jsonData[nameKey],
            level: parseInt(jsonData[`effect${i}Lv`], 10) || 1,
            maxLevel: 5,
            timing: this.toFullWidthKana(jsonData[`effect${i}Timing`]),
            skill: this.toFullWidthKana(jsonData[`effect${i}Skill`]),
            difficulty: jsonData[`effect${i}Dfclty`] || "自動",
            target: jsonData[`effect${i}Target`] || "",
            range: jsonData[`effect${i}Range`] || "",
            cost: jsonData[`effect${i}Encroach`] || "",
            limit: jsonData[`effect${i}Restrict`] || "",
            effect: jsonData[`effect${i}Note`] || "",
          };
          if (jsonData[`effect${i}Type`] === "easy") {
            easyEffects.push(effect);
          } else {
            effects.push(effect);
          }
        }
      }
      return {
        characterName: jsonData.pc_name,
        totalXp: parseInt(jsonData.expTotal, 10) || 130,
        effects: effects,
        easyEffects: easyEffects,
      };
    },
    async importFromHokanjo_gas(url) {
      const gasUrl = new URL(this.gasWebAppUrl);
      gasUrl.searchParams.append("action", "import");
      gasUrl.searchParams.append("url", url);
      const response = await fetch(gasUrl);
      const result = await response.json();
      if (result.status === "success") {
        return result.data;
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
        level: 1, // 初期値を1に設定
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
        values[tab.key] = { base: 0, perLevel: 0 };
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
        manualTarget: "", // 手動設定用
        targetMode: "auto", // auto or manual
        manualRange: "", // 手動設定用
        rangeMode: "auto", // auto or manual
      };
    },
    addCombo() {
      this.combos.push(this.createDefaultCombo());
    },
    removeCombo(index) {
      this.combos.splice(index, 1);
    },
    evaluateValue(str, level) {
      if (typeof str !== "string") {
        throw new Error("Invalid input type");
      }

      let expression = str.trim();
      if (expression === "") {
        throw new Error("Empty expression");
      }

      expression = expression
        .replace(/[×＊]/g, "*")
        .replace(/[÷／]/g, "/")
        .replace(/[＋]/g, "+")
        .replace(/[－‐]/g, "-")
        .replace(/[（]/g, "(")
        .replace(/[）]/g, ")")
        .replace(/ＬＶ|ｌｖ/g, "lv");

      expression = expression.replace(/lv/gi, level || 0);

      if (/[^0-9\s\-\+\*\/\(\)\.]/.test(expression)) {
        throw new Error("Invalid characters in expression");
      }

      try {
        const result = new Function("return " + expression)();
        return Number(result);
      } catch (e) {
        throw new Error("Evaluation failed");
      }
    },
    openEffectPanel(event, source, type, index) {
      this.editingEffect = JSON.parse(JSON.stringify(source));
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
        const characterInfoGrid = document.querySelector(
          ".character-info-grid"
        );
        const dbSyncBlock = document.querySelector(".db-sync-block");
        const statusMessage = document.querySelector(".status-message");

        if (characterInfoGrid && dbSyncBlock && statusMessage) {
          const gridHeight = characterInfoGrid.offsetHeight;
          const statusMessageHeight = statusMessage.offsetHeight;
          const statusMessageMarginBottom = parseInt(
            window.getComputedStyle(statusMessage).marginBottom
          );
          const dbSyncBlockPaddingTop = parseInt(
            window.getComputedStyle(dbSyncBlock).paddingTop
          );
          const dbSyncBlockPaddingBottom = parseInt(
            window.getComputedStyle(dbSyncBlock).paddingBottom
          );
          const dbButtons = document.querySelector(".db-buttons");
          const dbButtonsHeight = dbButtons ? dbButtons.offsetHeight : 0;
          const dbUrlInput = document.querySelector(".db-url-input");
          const dbUrlInputHeight = dbUrlInput ? dbUrlInput.offsetHeight : 0;
          const requiredHeightForDbSyncBlock =
            dbUrlInputHeight +
            dbButtonsHeight +
            15 +
            dbSyncBlockPaddingTop +
            dbSyncBlockPaddingBottom;
          const calculatedMinHeight =
            gridHeight - statusMessageHeight - statusMessageMarginBottom;
          dbSyncBlock.style.minHeight = `${Math.max(
            calculatedMinHeight,
            requiredHeightForDbSyncBlock
          )}px`;
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
          // 不正なURLの場合は従来通りエンコード
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

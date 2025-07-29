// dx3_combo_generator.js

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
    return { isOpen: false };
  },
  methods: {
    toggleDropdown() {
      if (this.options.length > 0) {
        this.isOpen = !this.isOpen;
      }
    },
    selectOption(option) {
      this.$emit("input", option);
      this.isOpen = false;
    },
    handleInput(event) {
      this.$emit("input", event.target.value);
    },
    closeDropdown() {
      this.isOpen = false;
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
    //
    // --- ★★★ ここにあなたのGASウェブアプリURLを貼り付けてください ★★★ ---
    //
    gasWebAppUrl:
      "https://script.google.com/macros/s/AKfycbxMR7f_pOi14SsAuKvu7YxKVBQZ69dn-TeQpMBxyYzo_pwZmICNZ06cSb8BKQYCM0GuGg/exec",
    //
    // -----------------------------------------------------------
    //
    characterSheetUrl: "",
    isBusy: false,
    statusMessage: "",
    statusIsError: false,
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
      timing: [
        "オート",
        "マイナー",
        "メジャー",
        "メジャー/リア",
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
      return this.effects.reduce(
        (t, e) =>
          e.level > 0
            ? t + (Number(e.level) === 1 ? 15 : 15 + (Number(e.level) - 1) * 5)
            : t,
        0
      );
    },
    easyEffectXp() {
      return this.easyEffects.reduce(
        (t, e) => (e.level > 0 ? t + Number(e.level) * 2 : t),
        0
      );
    },
    usedXp() {
      return this.effectXp + this.easyEffectXp;
    },
    processedCombos() {
      const allEffects = [...this.effects, ...this.easyEffects];
      return this.combos.map((combo) => {
        const comboLevelBonus = combo.comboLevelBonus || 0;
        const relevantEffects = combo.effectNames
          .map((n) => allEffects.find((e) => e.name === n && n !== ""))
          .filter(Boolean);
        const calc = (key) =>
          relevantEffects.reduce(
            (acc, effect) => {
              if (!effect.values?.[key]) return acc;
              const lvl = (Number(effect.level) || 0) + comboLevelBonus;
              const val =
                (Number(effect.values[key].base) || 0) +
                lvl * (Number(effect.values[key].perLevel) || 0);
              acc.total += val;
              acc.breakdown.push(`${effect.name}(Lv${lvl}): ${val}`);
              return acc;
            },
            { total: 0, breakdown: [] }
          );
        const dice = calc("dice");
        const achieve = calc("achieve");
        const attack = calc("attack");
        let crit = relevantEffects.reduce((minCrit, effect) => {
          if (!effect.values?.crit?.base) return minCrit;
          const lvl = (Number(effect.level) || 0) + comboLevelBonus;
          const val = Math.max(
            (Number(effect.values.crit.base) || 10) -
              lvl * (Number(effect.values.crit.perLevel) || 0),
            Number(effect.values.crit.min) || 2
          );
          return Math.min(minCrit, val);
        }, 10);
        const cost =
          relevantEffects.reduce(
            (sum, e) =>
              sum +
              (this.parseCost(
                e.cost,
                (Number(e.level) || 0) + comboLevelBonus
              ) || 0),
            0
          ) + (combo.cost_manual || 0);
        const totalAtk = (combo.atk_weapon || 0) + attack.total;
        const compositionText = relevantEffects
          .map(
            (e) =>
              `《${e.name}》${
                e.maxLevel === 1 && e.level === 1
                  ? ""
                  : `Lv${e.level}${
                      comboLevelBonus > 0 ? `+${comboLevelBonus}` : ""
                    }`
              }`
          )
          .join("+");
        const primarySkill =
          relevantEffects.find((e) => e.skill)?.skill || "{技能}";
        const chatPalette = `◆${combo.name}\n侵蝕値:${cost} ATK:${totalAtk}\n(${primarySkill}+{能力値}+{侵蝕率D}+${dice.total})DX${crit}+${achieve.total}`;
        return {
          ...combo,
          totalDice: dice.total,
          finalCrit: crit,
          totalAchieve: achieve.total,
          totalAtk,
          totalCost: cost,
          compositionText,
          chatPalette,
        };
      });
    },
    activeModalTabLabel() {
      return (
        (this.modalTabs.find((t) => t.key === this.activeModalTab) || {})
          .label || ""
      );
    },
  },
  methods: {
    // --- DB連携/引用メソッド ---
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
        effects: this.effects,
        easyEffects: this.easyEffects,
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
      if (
        !this.validateInputs() ||
        !this.gasWebAppUrl.startsWith("https://script.google.com/")
      )
        return;
      this.isBusy = true;
      this.showStatus("読み込み中...", false, 0);
      const url = new URL(this.gasWebAppUrl);
      url.searchParams.append("id", this.characterSheetUrl);
      try {
        const response = await fetch(url);
        const result = await response.json();
        if (result.status === "success") {
          const d = result.data;
          this.characterName = d.characterName || "名称未設定";
          this.totalXp = d.totalXp || 130;
          this.effects = (d.effects || []).map((e) => ({
            ...e,
            values: e.values || this.createDefaultValues(),
          }));
          this.easyEffects = (d.easyEffects || []).map((e) => ({
            ...e,
            values: e.values || this.createDefaultValues(),
          }));
          this.combos = d.combos || [];
          this.showStatus("読み込みが完了しました。");
        } else if (result.status === "not_found") {
          this.showStatus(
            "このURLのデータは見つかりませんでした。新規に作成して「保存」できます。"
          );
        } else {
          throw new Error(result.message || "不明なエラー");
        }
      } catch (error) {
        console.error("Load Error:", error);
        this.showStatus(`読込エラー: ${error.message}`, true);
      } finally {
        this.isBusy = false;
      }
    },

    async importFromSheet() {
      if (!this.characterSheetUrl) {
        this.showStatus("キャラクターシートのURLを入力してください。", true);
        return;
      }
      this.isBusy = true;
      this.showStatus("キャラシから引用中...", false, 0);
      try {
        let importedData;
        if (this.characterSheetUrl.includes("yutorize.2-d.jp")) {
          importedData = await this.importFromYutoSheet_direct(
            this.characterSheetUrl
          );
        } else if (
          this.characterSheetUrl.includes("charasheet.vampire-blood.net")
        ) {
          if (
            !this.gasWebAppUrl ||
            !this.gasWebAppUrl.startsWith("https://script.google.com/")
          ) {
            throw new Error(
              "GASのURLが設定されていません。JSファイルを編集してください。"
            );
          }
          importedData = await this.importFromHokanjo_gas(
            this.characterSheetUrl
          );
        } else {
          throw new Error("サポートされていないURLです。");
        }
        const effectsCount = (importedData.effects || []).length;
        const easyEffectsCount = (importedData.easyEffects || []).length;
        if (
          !confirm(
            `「${importedData.characterName}」のデータを引用します。\n\n・総経験点: ${importedData.totalXp}\n・エフェクト: ${effectsCount}件\n・イージーエフェクト: ${easyEffectsCount}件\n\n現在のデータは上書きされます。よろしいですか？`
          )
        ) {
          this.showStatus("引用をキャンセルしました。");
          this.isBusy = false;
          return;
        }
        this.characterName = importedData.characterName;
        this.totalXp = importedData.totalXp;
        this.effects = (importedData.effects || []).map((e) => ({
          ...this.createDefaultEffect(),
          ...e,
          values: this.createDefaultValues(),
        }));
        this.easyEffects = (importedData.easyEffects || []).map((e) => ({
          ...this.createDefaultEffect(),
          ...e,
          values: this.createDefaultValues(),
        }));
        this.showStatus("キャラクターシートからデータを引用しました！");
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
      // effectNum は通常エフェクトの数、trashNumはイージーエフェクトを含むことがある
      const effectNum = parseInt(jsonData.effectNum, 10) || 0;

      for (let i = 1; i <= effectNum; i++) {
        const nameKey = `effect${i}Name`;
        if (jsonData[nameKey]) {
          const effect = {
            name: jsonData[nameKey],
            level: parseInt(jsonData[`effect${i}Lv`], 10) || 1,
            maxLevel: 5,
            timing: jsonData[`effect${i}Timing`] || "",
            skill: jsonData[`effect${i}Skill`] || "自動",
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
            // "auto" (ワーディングなど) も通常エフェクトとして扱う
            effects.push(effect);
          }
        }
      }

      return {
        characterName: jsonData.characterName,
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

    // --- 既存のUI操作メソッド ---
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
      };
    },
    createDefaultValues() {
      const values = {};
      this.modalTabs.forEach((tab) => {
        values[tab.key] = { base: 0, perLevel: 0 };
      });
      values.crit.min = 2;
      return values;
    },
    isEffectDisabled(effect) {
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

      const allRegisteredEffects = [...this.effects, ...this.easyEffects];
      const selectedEffectObjects = this.tempSelectedEffectNames
        .map((name) => allRegisteredEffects.find((e) => e.name === name))
        .filter((e) => e);

      const primaryTimingEffect = selectedEffectObjects.find(
        (e) => e.timing && normalizeTiming(e.timing) !== "オート"
      );

      if (!primaryTimingEffect) return false;

      const primaryTimings = normalizeTiming(primaryTimingEffect.timing).split(
        "／"
      );
      const effectTimingStr = normalizeTiming(effect.timing);

      if (effectTimingStr === "オート" || effectTimingStr === "") return false;

      const effectTimings = effectTimingStr.split("／");

      const isTimingMatch = primaryTimings.some((pt) =>
        effectTimings.includes(pt)
      );

      return !isTimingMatch;
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

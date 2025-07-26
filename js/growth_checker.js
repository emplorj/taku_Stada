new Vue({
  el: "#growth-checker-app",
  data: {
    logContent: "",
    fileName: "",
    detectedVersion: null,
    options: {
      coc6: {
        critical: true,
        fumble: false,
        special: true,
        success: true,
        luckyNumber: false,
      },
      coc7: {
        critical: true,
        fumble: false,
        extreme: true,
        hard: true,
        regular: true,
      },
    },
    luckyNumber: 1,
    includeAbilityRolls: false,
    useTwoColumnLayout: false,
    isEnter: false,
    evasionOverrides: {},
    mergeTargets: {},
    tooltip: { visible: false, content: "", x: 0, y: 0 },
    selectedChartCharacter: null,
    chartInstance: null, // Chart.jsのインスタンスを保持
    alwaysExcludeRolls: ["SAN", "SAN値チェック", "正気度ロール"],
    conditionalRolls: [
      "幸運",
      "アイデア",
      "知識",
      "STR",
      "CON",
      "POW",
      "DEX",
      "APP",
      "SIZ",
      "INT",
      "EDU",
    ],
    initialSkills: {
      回避: -1,
      キック: 25,
      組み付き: 25,
      こぶし: 50,
      パンチ: 50,
      拳: 50,
      頭突き: 10,
      投擲: 25,
      マーシャルアーツ: 1,
      拳銃: 20,
      サブマシンガン: 15,
      ショットガン: 30,
      マシンガン: 15,
      ライフル: 25,
      応急手当: 30,
      鍵開け: 1,
      隠す: 15,
      隠れる: 10,
      聞き耳: 25,
      忍び歩き: 10,
      写真術: 10,
      精神分析: 1,
      追跡: 10,
      登攀: 40,
      図書館: 25,
      目星: 25,
      運転: 20,
      機械修理: 20,
      重機械操作: 1,
      乗馬: 5,
      水泳: 25,
      製作: 5,
      操縦: 1,
      跳躍: 25,
      電気修理: 10,
      ナビゲート: 10,
      変装: 1,
      言いくるめ: 5,
      信用: 15,
      説得: 15,
      値切り: 5,
      母国語: 20,
      医学: 5,
      オカルト: 5,
      化学: 1,
      クトゥルフ神話: 0,
      芸術: 5,
      経理: 10,
      考古学: 1,
      コンピューター: 1,
      心理学: 5,
      人類学: 1,
      生物学: 1,
      地質学: 1,
      電子工学: 1,
      天文学: 1,
      博物学: 10,
      物理学: 1,
      法律: 5,
      薬学: 1,
      歴史: 20,
    },
  },
  watch: {
    // グラフで選択されている探索者が変更されたらアニメーションを実行
    selectedChartCharacter(newChar) {
      this.updateChart(newChar);
    },
    // マージ設定が変わった時もグラフを更新
    mergeTargets: {
      handler() {
        // 現在選択されているキャラが非表示になった場合、表示可能な別のキャラを選択し直す
        if (
          this.visibleCharacterNames.length > 0 &&
          !this.visibleCharacterNames.includes(this.selectedChartCharacter)
        ) {
          this.selectedChartCharacter = this.visibleCharacterNames[0];
        } else if (this.visibleCharacterNames.length === 0) {
          this.selectedChartCharacter = null;
        } else {
          // 統合状態が変わっただけなら再描画
          this.updateChart(this.selectedChartCharacter);
        }
      },
      deep: true,
    },
  },
  computed: {
    characterNames() {
      return Object.keys(this.processedResults);
    },
    visibleCharacterNames() {
      return Object.keys(this.mergedResults);
    },
    hasResults() {
      return this.logContent && this.characterNames.length > 0;
    },
    processedResults() {
      if (!this.logContent) return {};
      const parser = new DOMParser();
      const doc = parser.parseFromString(this.logContent, "text/html");
      const paragraphs = doc.querySelectorAll("p");
      const filteredLogs = [];
      paragraphs.forEach((p) => {
        const spans = p.querySelectorAll("span");
        if (
          spans.length >= 3 &&
          spans[2] &&
          spans[2].textContent.includes("＞")
        ) {
          const character = spans[1]
            ? spans[1].textContent.trim()
            : "（名前なし）";
          const diceRoll = spans[2].textContent.trim();
          const skillName = this.getSkillName(diceRoll);
          const skillValue = this.getSkillValue(diceRoll);
          if (!skillName || skillValue === null) return;
          if (this.alwaysExcludeRolls.some((ex) => skillName.includes(ex)))
            return;
          if (!this.includeAbilityRolls && this.isConditionalRoll(skillName))
            return;
          if (!this.isMatch(diceRoll)) return;
          filteredLogs.push({ character, diceRoll, skillName, skillValue });
        }
      });
      const grouped = {};
      filteredLogs.forEach((log) => {
        const charName = log.character || "（名前なし）";
        if (!grouped[charName]) {
          this.$set(this.evasionOverrides, charName, false);
          this.$set(this.mergeTargets, charName, charName);
          grouped[charName] = [];
        }
        const isInitial = this.isInitialSuccess(
          log.skillName,
          log.skillValue,
          charName
        );
        grouped[charName].push({
          skill: log.skillName,
          text: this.formatLogText(log.diceRoll),
          isInitialSuccess: isInitial,
        });
      });
      return grouped;
    },
    mergedResults() {
      const merged = {};
      for (const charName in this.processedResults) {
        if (this.mergeTargets[charName] === "__HIDE__") continue;
        let targetName = this.mergeTargets[charName];
        while (
          this.mergeTargets[targetName] &&
          this.mergeTargets[targetName] !== targetName
        ) {
          targetName = this.mergeTargets[targetName];
        }
        if (this.mergeTargets[targetName] === "__HIDE__") continue;
        if (!merged[targetName]) {
          merged[targetName] = [];
        }
        merged[targetName].push(...this.processedResults[charName]);
      }
      return merged;
    },
    summaryResults() {
      const summary = {};
      const results = this.mergedResults;
      for (const charName in results) {
        const skills = results[charName].map((log) => log.skill);
        const uniqueSkills = [...new Set(skills)];
        if (uniqueSkills.length > 0) {
          summary[charName] = "◆" + charName + "\n" + uniqueSkills.join("\n");
        }
      }
      return summary;
    },
    allSummariesText() {
      return this.characterNames
        .map((charName) => this.summaryResults[charName])
        .filter(Boolean)
        .join("\n\n");
    },
    hasDiceStats() {
      return this.logContent && Object.keys(this.diceRollStats).length > 0;
    },
    diceRollStats() {
      if (!this.logContent) return {};
      const stats = {};
      const parser = new DOMParser();
      const doc = parser.parseFromString(this.logContent, "text/html");
      const paragraphs = doc.querySelectorAll("p");
      const rollRegex = /\(1D100.*?\)\s*＞\s*(\d+)/;

      paragraphs.forEach((p) => {
        const spans = p.querySelectorAll("span");
        if (spans.length >= 3 && spans[2]) {
          const character = spans[1]
            ? spans[1].textContent.trim()
            : "（名前なし）";
          const diceRollText = spans[2].textContent.trim();
          const match = diceRollText.match(rollRegex);
          if (match && match[1]) {
            const roll = parseInt(match[1], 10);
            if (!stats[character]) {
              stats[character] = {
                counts: Array(10).fill(0),
                total: 0,
                maxCount: 0,
              };
            }
            const binIndex = Math.floor((roll - 1) / 10);
            if (binIndex >= 0 && binIndex < 10) {
              stats[character].counts[binIndex]++;
              stats[character].total++;
            }
          }
        }
      });
      for (const charName in stats) {
        stats[charName].maxCount = Math.max(...stats[charName].counts);
      }
      return stats;
    },
    visibleDiceRollStats() {
      const mergedStats = {};
      for (const charName in this.diceRollStats) {
        if (this.mergeTargets[charName] === "__HIDE__") continue;
        let targetName = this.mergeTargets[charName];
        while (
          this.mergeTargets[targetName] &&
          this.mergeTargets[targetName] !== targetName
        ) {
          targetName = this.mergeTargets[targetName];
        }
        if (this.mergeTargets[targetName] === "__HIDE__") continue;
        if (!mergedStats[targetName]) {
          mergedStats[targetName] = {
            counts: Array(10).fill(0),
            total: 0,
            maxCount: 0,
          };
        }
        const sourceStats = this.diceRollStats[charName];
        mergedStats[targetName].total += sourceStats.total;
        for (let i = 0; i < 10; i++) {
          mergedStats[targetName].counts[i] += sourceStats.counts[i];
        }
      }
      for (const charName in mergedStats) {
        mergedStats[charName].maxCount = Math.max(
          ...mergedStats[charName].counts
        );
      }
      return mergedStats;
    },
  },
  methods: {
    handleFile(file) {
      if (!file) return;
      this.fileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.evasionOverrides = {};
        this.mergeTargets = {};
        this.logContent = e.target.result;
        this.detectedVersion = this.logContent.includes(
          "ボーナス・ペナルティダイス"
        )
          ? "coc7"
          : "coc6";
        this.setPreset("official");
        this.$nextTick(() => {
          if (this.visibleCharacterNames.length > 0) {
            this.selectedChartCharacter = this.visibleCharacterNames[0];
          } else {
            this.selectedChartCharacter = null;
          }
          this.$nextTick(() => {
            this.updateChart(this.selectedChartCharacter);
          });
        });
      };
      reader.readAsText(file);
    },
    updateChart(charName) {
      const ctx = document.getElementById("diceChart");
      if (!ctx) return;

      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      if (!charName || !this.visibleDiceRollStats[charName]) {
        return;
      }

      const stats = this.visibleDiceRollStats[charName];
      const data = {
        labels: stats.counts.map((_, i) => `${i * 10 + 1}～${(i + 1) * 10}`),
        datasets: [
          {
            label: `${charName}の出目`,
            data: stats.counts,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      };

      this.chartInstance = new Chart(ctx, {
        type: "bar",
        data: data,
        plugins: [ChartDataLabels],
        options: {
          devicePixelRatio: 2, // 解像度を2倍にする
          animation: {
            duration: 500,
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
              },
              afterDataLimits: (scale) => {
                scale.max = scale.max * 1.1;
              },
            },
          },
          layout: {
            padding: {
              right: 10,
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                title: (tooltipItems) => {
                  return `出目: ${tooltipItems[0].label}`;
                },
                label: (tooltipItem) => {
                  return `回数: ${tooltipItem.raw}回`;
                },
              },
            },
            datalabels: {
              anchor: "end",
              align: "end",
              offset: -4,
              color: "white",
              font: {
                weight: "bold",
              },
              formatter: (value) => {
                return value > 0 ? value : "";
              },
            },
          },
        },
      });
    },
    onFileChange(event) {
      this.handleFile(event.target.files[0]);
    },
    drop(event) {
      this.isEnter = false;
      this.handleFile(event.dataTransfer.files[0]);
    },
    dragEnter() {
      this.isEnter = true;
    },
    dragLeave() {
      this.isEnter = false;
    },
    setPreset(presetName) {
      const versionOptions = this.options[this.detectedVersion];
      if (!versionOptions) return;
      Object.keys(versionOptions).forEach(
        (key) => (versionOptions[key] = false)
      );
      if (presetName === "critFumbleInitial") {
        versionOptions.critical = true;
        versionOptions.fumble = true;
      } else if (presetName === "official") {
        versionOptions.critical = true;
        if (this.detectedVersion === "coc6") {
          versionOptions.success = true;
          versionOptions.special = true;
        } else {
          versionOptions.extreme = true;
          versionOptions.hard = true;
          versionOptions.regular = true;
        }
      }
    },
    showTooltip(charName, event) {
      if (this.summaryResults[charName]) {
        const rect = event.target.getBoundingClientRect();
        this.tooltip.content = this.summaryResults[charName];
        this.tooltip.x = rect.left;
        this.tooltip.y = rect.top - 10;
        this.tooltip.visible = true;
      }
    },
    hideTooltip() {
      this.tooltip.visible = false;
    },
    getSkillName(diceRoll) {
      const skillMatch = diceRoll.match(/【(.+?)】/);
      return skillMatch
        ? skillMatch[1].replace(/判定|（.*?）/g, "").trim()
        : null;
    },
    getSkillValue(diceRoll) {
      const valueMatch = diceRoll.match(/CCB?<=(\d+)/);
      return valueMatch ? parseInt(valueMatch[1], 10) : null;
    },
    isConditionalRoll(skillName) {
      return this.conditionalRolls.some((cr) => {
        const regex = new RegExp(`^${cr}(\\s?(\\×|\\*)\\s?\\d+)?$`);
        return regex.test(skillName);
      });
    },
    isMatch(diceRoll) {
      const opt = this.options[this.detectedVersion];
      if (!opt) return false;
      if (this.detectedVersion === "coc6") {
        return (
          (opt.critical && diceRoll.includes("決定的成功")) ||
          (opt.fumble && diceRoll.includes("致命的失敗")) ||
          (opt.special && diceRoll.includes("＞ スペシャル")) ||
          (opt.success &&
            diceRoll.endsWith("＞ 成功") &&
            !diceRoll.includes("決定的成功")) ||
          (opt.luckyNumber &&
            this.luckyNumber > 0 &&
            diceRoll.match(`＞ ${this.luckyNumber} ＞`))
        );
      } else {
        return (
          (opt.critical && diceRoll.endsWith("＞ クリティカル")) ||
          (opt.fumble && diceRoll.endsWith("＞ ファンブル")) ||
          (opt.extreme && diceRoll.endsWith("＞ イクストリーム成功")) ||
          (opt.hard && diceRoll.endsWith("＞ ハード成功")) ||
          (opt.regular && diceRoll.endsWith("＞ レギュラー成功"))
        );
      }
    },
    isInitialSuccess(skillName, skillValue, charName) {
      if (skillName === "回避") return !!this.evasionOverrides[charName];
      const initialValue = this.initialSkills[skillName];
      return initialValue !== undefined && skillValue === initialValue;
    },
    formatLogText(diceRoll) {
      return diceRoll.replace(/(【.+?】)/, "<strong>$1</strong>");
    },
    copyToClipboard(text, event) {
      if (!text) return;
      navigator.clipboard
        .writeText(text)
        .then(() => {
          const button = event.target.closest("button");
          const originalText = button.innerHTML;
          button.innerHTML = "OK!";
          button.disabled = true;
          this.hideTooltip();
          setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
          }, 1500);
        })
        .catch((err) => console.error("コピーに失敗しました", err));
    },
    copyAllSummaries(event) {
      if (!this.allSummariesText) return;
      navigator.clipboard
        .writeText(this.allSummariesText)
        .then(() => {
          const button = event.target.closest("button");
          const originalText = button.innerHTML;
          button.innerHTML = "すべてコピーしました!";
          button.disabled = true;
          setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
          }, 1500);
        })
        .catch((err) => console.error("一括コピーに失敗しました", err));
    },
  },
});

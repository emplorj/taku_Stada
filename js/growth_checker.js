window.GrowthCheckerConfig = {
  el: "#log-tool-app",
  data: {
    activeTool: "growth", // 'growth' or 'dialogue'
    isCoCLog: true,
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
        failure: true,
      },
      coc7: {
        critical: true,
        fumble: false,
        extreme: true,
        hard: true,
        regular: true,
        failure: true,
      },
    },
    dialogueOptions: {
      excludeDiceRolls: true,
      onlyQuoted: true,
      applyLineBreaks: true,
    },
    luckyNumber: 1,
    includeAbilityRolls: false,
    useTwoColumnLayout: false,
    isEnter: false,
    evasionOverrides: {},
    mergeTargets: {},
    tooltip: { visible: false, content: "", x: 0, y: 0 },
    selectedChartCharacter: null,
    chartInstance: null,
    tabNames: [],
    selectedTabs: [],
    parsedLogs: [],
    characterDialogueSelection: {},
    rawLogSelection: [],
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
    selectedChartCharacter(newChar) {
      this.updateChart(newChar);
    },
    mergeTargets: {
      handler() {
        if (
          this.visibleCharacterNames.length > 0 &&
          !this.visibleCharacterNames.includes(this.selectedChartCharacter)
        ) {
          this.selectedChartCharacter = this.visibleCharacterNames[0];
        } else if (this.visibleCharacterNames.length === 0) {
          this.selectedChartCharacter = null;
        } else {
          this.updateChart(this.selectedChartCharacter);
        }
      },
      deep: true,
    },
    logContent(newContent) {
      if (!newContent) {
        this.parsedLogs = [];
        this.tabNames = [];
        this.selectedTabs = [];
        this.selectedChartCharacter = null;
        this.characterDialogueSelection = {};
        this.rawLogSelection = [];
        this.isCoCLog = true;
        this.activeTool = "growth";
        this.detectedVersion = null;
        return;
      }

      // CoCログ判定
      const isCoC = /CCB|ボーナス・ペナルティダイス/i.test(newContent);
      this.isCoCLog = isCoC;

      if (!isCoC) {
        this.activeTool = "dialogue";
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(newContent, "text/html");
      const allLogs = [];
      const logRegex = /^\s*(?:\[(.*?)\]\s*)?(.*?)\s*:\s*(.*)$/s;

      const processNode = (node, currentTab) => {
        if (node.nodeName === "P") {
          const color = node.style.color || "";
          const spans = node.querySelectorAll("span");
          if (spans.length >= 3) {
            let tab =
              (spans[0]
                ? spans[0].textContent.trim().replace(/[\[\]]/g, "")
                : currentTab) || "メイン";
            const character = spans[1] ? spans[1].textContent.trim() : "";
            const messageHtml = spans[2] ? spans[2].innerHTML.trim() : "";
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = messageHtml.replace(/<br\s*\/?>/gi, "\n");
            const messageText = tempDiv.textContent || tempDiv.innerText || "";

            if (tab.toLowerCase() === "main") tab = "メイン";
            if (tab.toLowerCase() === "info") tab = "情報";
            if (tab.toLowerCase() === "other") tab = "雑談";

            if (character || messageText || messageHtml)
              allLogs.push({
                tab,
                character,
                message: messageText,
                messageHtml: messageHtml,
                color,
              });
          } else {
            const textContent = node.textContent.trim();
            const match = textContent.match(logRegex);
            if (match) {
              let tab = match[1] ? match[1].trim() : currentTab;
              if (tab.toLowerCase() === "main") tab = "メイン";
              if (tab.toLowerCase() === "info") tab = "情報";
              if (tab.toLowerCase() === "other") tab = "雑談";
              const character = match[2].trim();
              const message = match[3].trim();

              const colonIndex = node.innerHTML.lastIndexOf(":");
              const messageHtml =
                colonIndex > -1
                  ? node.innerHTML.substring(colonIndex + 1).trim()
                  : node.innerHTML.trim();

              if (character || message)
                allLogs.push({
                  tab,
                  character,
                  message: message,
                  messageHtml: messageHtml,
                  color,
                });
            }
          }
        } else if (node.nodeName === "DETAILS") {
          const summary = node.querySelector("summary");
          const newTabName = summary
            ? summary.textContent.trim().replace(/[\[\]]/g, "")
            : "タブ";
          node.childNodes.forEach((child) => processNode(child, newTabName));
        } else if (node.nodeType === 1) {
          node.childNodes.forEach((child) => processNode(child, currentTab));
        }
      };
      doc.body.childNodes.forEach((node) => processNode(node, "メイン"));
      this.parsedLogs = allLogs;

      const charNames = [
        ...new Set(this.parsedLogs.map((log) => log.character).filter(Boolean)),
      ];
      charNames.forEach((charName) => {
        if (!this.mergeTargets[charName]) {
          this.$set(this.mergeTargets, charName, charName);
        }
      });

      // 名前が近いキャラクターを自動的にまとめる
      const sortedCharNames = charNames.sort();
      const processedForMerge = new Set();
      for (let i = 0; i < sortedCharNames.length; i++) {
        const char1 = sortedCharNames[i];
        if (processedForMerge.has(char1)) continue;

        for (let j = i + 1; j < sortedCharNames.length; j++) {
          const char2 = sortedCharNames[j];
          if (processedForMerge.has(char2)) continue;

          if (this.areNamesSimilar(char1, char2)) {
            // 短い方を長い方にまとめる
            const target = char1.length >= char2.length ? char1 : char2;
            const source = char1.length < char2.length ? char1 : char2;
            this.$set(this.mergeTargets, source, target);
            processedForMerge.add(source);
          }
        }
      }

      this.parsedLogs.forEach((log, index) => {
        const charName = log.character || "（名前なし）";
        if (!this.characterDialogueSelection[charName]) {
          this.$set(this.characterDialogueSelection, charName, {});
        }
        this.$set(this.characterDialogueSelection[charName], index, false);
        this.$set(this.rawLogSelection, index, false);
      });

      const tabs = new Set(["メイン", "情報", "雑談"]);
      this.parsedLogs.forEach((log) => tabs.add(log.tab));

      this.tabNames = [
        "メイン",
        "情報",
        "雑談",
        ...[...tabs].filter((t) => !["メイン", "情報", "雑談"].includes(t)),
      ];
      this.selectedTabs = [...this.tabNames];
      if (this.isCoCLog) {
        this.detectedVersion = this.logContent.includes(
          "ボーナス・ペナルティダイス",
        )
          ? "coc7"
          : "coc6";
        this.setPreset("official");
      } else {
        this.detectedVersion = null;
      }

      this.$nextTick(() => {
        if (this.visibleCharacterNames.length > 0) {
          if (this.visibleCharacterNames.includes("★みんな")) {
            this.selectedChartCharacter = "★みんな";
          } else {
            this.selectedChartCharacter = this.visibleCharacterNames[0];
          }
          this.updateChart(this.selectedChartCharacter);
        } else {
          this.selectedChartCharacter = null;
        }
      });
    },
  },
  computed: {
    characterNames() {
      return [
        ...new Set(this.parsedLogs.map((log) => log.character).filter(Boolean)),
      ].sort();
    },
    diceRollingCharacters() {
      return Object.keys(this.processedResults).sort();
    },
    dialogueCharacters() {
      const dialogueChars = new Set();
      this.parsedLogs.forEach((log) => {
        if (log.character) {
          if (this.dialogueOptions.onlyQuoted) {
            if (/^[「『｢]/.test(log.message)) {
              dialogueChars.add(log.character);
            }
          } else {
            dialogueChars.add(log.character);
          }
        }
      });
      return [...dialogueChars].sort();
    },
    visibleCharacterNames() {
      const names = Object.keys(this.mergedResults);
      return names.length > 1 ? ["★みんな", ...names] : names;
    },
    hasResults() {
      return this.logContent && this.characterNames.length > 0;
    },
    processedResults() {
      if (!this.logContent) return {};
      const filteredLogs = [];
      this.parsedLogs.forEach((log, index) => {
        if (!this.selectedTabs.includes(log.tab)) return;
        if (!log.message.includes("＞")) return;

        const skillName = this.getSkillName(log.message);
        if (!skillName) {
          return;
        }

        const skillValue = this.getSkillValue(log.message);
        if (skillValue === null) {
          return;
        }

        if (this.alwaysExcludeRolls.some((ex) => skillName.includes(ex))) {
          return;
        }

        if (!this.includeAbilityRolls && this.isConditionalRoll(skillName)) {
          return;
        }

        const isMatch = this.isMatch(log.message);
        if (!isMatch) {
          return;
        }

        filteredLogs.push({
          character: log.character,
          diceRoll: log.message,
          skillName,
          skillValue,
          tab: log.tab,
          color: log.color,
          originalIndex: index,
        });
      });
      const grouped = {};
      filteredLogs.forEach((log) => {
        const charName = log.character || "（名前なし）";
        if (!grouped[charName]) {
          this.$set(this.evasionOverrides, charName, false);
          if (!this.mergeTargets[charName]) {
            this.$set(this.mergeTargets, charName, charName);
          }
          grouped[charName] = { logs: [], color: null };
        }
        if (!grouped[charName].color && log.color) {
          grouped[charName].color = log.color;
        }
        const isInitial = this.isInitialSuccess(
          log.skillName,
          log.skillValue,
          charName,
          log.diceRoll,
        );
        grouped[charName].logs.push({
          skill: log.skillName,
          formattedText: this.formatLogText(log.diceRoll),
          isInitialSuccess: isInitial,
          tab: log.tab,
          originalIndex: log.originalIndex,
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
          merged[targetName] = { logs: [], color: null };
        }
        const sourceResult = this.processedResults[charName];
        merged[targetName].logs.push(...sourceResult.logs);
        if (!merged[targetName].color && sourceResult.color) {
          merged[targetName].color = sourceResult.color;
        }
      }

      // ログを元の順序でソート
      for (const charName in merged) {
        merged[charName].logs.sort((a, b) => a.originalIndex - b.originalIndex);
      }

      return merged;
    },
    summaryResults() {
      const summary = {};
      for (const charName in this.mergedResults) {
        const skills = this.mergedResults[charName].logs.map(
          (log) => log.skill,
        );
        const uniqueSkills = [...new Set(skills)];
        if (uniqueSkills.length > 0)
          summary[charName] = "◆" + charName + "\n" + uniqueSkills.join("\n");
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
      const rollRegex = /\(1D100.*?\)\s*＞\s*(\d+)/;
      this.parsedLogs.forEach((log) => {
        if (!this.selectedTabs.includes(log.tab)) return;
        const rollMatch = log.message.match(rollRegex);
        if (rollMatch && rollMatch[1]) {
          const character = log.character || "（名前なし）";
          const roll = parseInt(rollMatch[1], 10);
          if (!stats[character])
            stats[character] = {
              successCounts: Array(10).fill(0),
              failureCounts: Array(10).fill(0),
              total: 0,
              maxCount: 0,
            };
          const binIndex = Math.floor((roll - 1) / 10);
          if (binIndex >= 0 && binIndex < 10) {
            if (this.isAnySuccess(log.message))
              stats[character].successCounts[binIndex]++;
            else stats[character].failureCounts[binIndex]++;
            stats[character].total++;
          }
        }
      });
      for (const charName in stats) {
        stats[charName].maxCount = Math.max(
          ...stats[charName].successCounts.map(
            (val, i) => val + stats[charName].failureCounts[i],
          ),
        );
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
        if (!mergedStats[targetName])
          mergedStats[targetName] = {
            successCounts: Array(10).fill(0),
            failureCounts: Array(10).fill(0),
            total: 0,
            maxCount: 0,
          };
        const sourceStats = this.diceRollStats[charName];
        mergedStats[targetName].total += sourceStats.total;
        for (let i = 0; i < 10; i++) {
          mergedStats[targetName].successCounts[i] +=
            sourceStats.successCounts[i];
          mergedStats[targetName].failureCounts[i] +=
            sourceStats.failureCounts[i];
        }
      }
      for (const charName in mergedStats) {
        mergedStats[charName].maxCount = Math.max(
          ...mergedStats[charName].successCounts.map(
            (val, i) => val + mergedStats[charName].failureCounts[i],
          ),
        );
      }
      return mergedStats;
    },
    dialogueResults() {
      if (!this.logContent) return [];
      const grouped = {};
      this.parsedLogs.forEach((log, index) => {
        if (!this.selectedTabs.includes(log.tab)) {
          return;
        }

        if (this.dialogueOptions.onlyQuoted && !/^[「『｢]/.test(log.message)) {
          return;
        }

        // ▼▼▼ 修正点 ▼▼▼
        const isDiceRoll = this.isDiceRollMessage(log.message);
        if (this.dialogueOptions.excludeDiceRolls && isDiceRoll) {
          return;
        }
        // ▲▲▲ 修正点 ▲▲▲

        let originalCharName = log.character || "（名前なし）";

        if (this.mergeTargets[originalCharName] === "__HIDE__") return;
        let targetName =
          this.mergeTargets[originalCharName] || originalCharName;
        while (
          this.mergeTargets[targetName] &&
          this.mergeTargets[targetName] !== targetName
        ) {
          targetName = this.mergeTargets[targetName];
        }
        if (this.mergeTargets[targetName] === "__HIDE__") return;

        if (!grouped[targetName]) {
          grouped[targetName] = { dialogues: [], colorCounts: {} };
        }
        if (log.color) {
          grouped[targetName].colorCounts[log.color] =
            (grouped[targetName].colorCounts[log.color] || 0) + 1;
        }
        grouped[targetName].dialogues.push({
          id: index,
          tab: log.tab,
          message: this.decodeHtmlEntities(log.messageHtml),
          selected:
            this.characterDialogueSelection[originalCharName]?.[index] || false,
        });
      });

      const results = Object.keys(grouped).map((key) => {
        const colorCounts = grouped[key].colorCounts || {};
        const mostUsedColor = Object.keys(colorCounts).reduce(
          (acc, color) =>
            colorCounts[color] > (colorCounts[acc] || 0) ? color : acc,
          "",
        );
        const charColor = mostUsedColor || "#eee";
        const hasStandingPicture =
          window.getStandingPictureUrl && !!window.getStandingPictureUrl(key);
        const shouldOpen =
          key !== "ジン" && key.toLowerCase() !== "jin" && hasStandingPicture;
        return {
          character: key,
          dialogues: grouped[key].dialogues,
          color: charColor,
          isOpen: shouldOpen,
        };
      });

      // ログを元の順序でソート
      results.forEach((charData) => {
        charData.dialogues.sort((a, b) => a.id - b.id);
      });

      return results;
    },

    filteredRawLogs() {
      if (!this.logContent) return [];
      return this.parsedLogs
        .map((log, index) => ({
          ...log,
          originalIndex: index,
          selected: this.rawLogSelection[index] || false,
        }))
        .filter((log) => {
          if (!this.selectedTabs.includes(log.tab)) {
            return false;
          }
          if (
            this.dialogueOptions.onlyQuoted &&
            !/^[「『｢]/.test(log.message)
          ) {
            return false;
          }
          const isDiceRoll = this.isDiceRollMessage(log.message);
          if (this.dialogueOptions.excludeDiceRolls && isDiceRoll) {
            return false;
          }
          return true;
        });
    },
  },
  methods: {
    // ▼▼▼ 修正点: ダイスロール判定を独立したメソッドに ▼▼▼
    isDiceRollMessage(message) {
      if (this.getSkillName(message)) {
        return true;
      }
      const dicePatterns = [
        /^\s*CCB?/i,
        /\b\d+d\d+\b/i,
        /\(1d\d+.*\)\s*＞/i,
        /＞\s*(\d+|成功|失敗|スペシャル|決定的成功|致命的失敗|クリティカル|ファンブル|イクストリーム成功|ハード成功|レギュラー成功)/,
      ];
      return dicePatterns.some((pattern) => pattern.test(message));
    },
    // ▲▲▲ 修正点 ▲▲▲
    decodeHtmlEntities(text) {
      if (!text) return "";
      const textarea = document.createElement("textarea");
      textarea.innerHTML = text.replace(/<br\s*\/?>/gi, "\n");
      return textarea.value;
    },
    handleFile(file) {
      if (!file) return;
      this.fileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.evasionOverrides = {};
        this.mergeTargets = {};
        this.logContent = e.target.result;
      };
      reader.readAsText(file);
    },
    updateChart(charName) {
      const ctx = document.getElementById("diceChart");
      if (!ctx) return;
      if (this.chartInstance) this.chartInstance.destroy();
      if (
        !charName ||
        (charName !== "★みんな" && !this.visibleDiceRollStats[charName])
      )
        return;
      let stats;
      if (charName === "★みんな") {
        stats = {
          successCounts: Array(10).fill(0),
          failureCounts: Array(10).fill(0),
          total: 0,
        };
        for (const name in this.visibleDiceRollStats) {
          const charStats = this.visibleDiceRollStats[name];
          stats.total += charStats.total;
          for (let i = 0; i < 10; i++) {
            stats.successCounts[i] += charStats.successCounts[i];
            stats.failureCounts[i] += charStats.failureCounts[i];
          }
        }
      } else {
        stats = this.visibleDiceRollStats[charName];
      }
      const data = {
        labels: stats.successCounts.map(
          (_, i) => `${i * 10 + 1}～${(i + 1) * 10}`,
        ),
        datasets: [
          {
            label: "成功",
            data: stats.successCounts,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
          {
            label: "失敗",
            data: stats.failureCounts,
            backgroundColor: "rgba(255, 99, 132, 0.6)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      };
      this.chartInstance = new Chart(ctx, {
        type: "bar",
        data: data,
        plugins: [ChartDataLabels],
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 500 },
          scales: {
            x: { stacked: true, ticks: { color: "#bdc3c7" } },
            y: {
              stacked: true,
              beginAtZero: true,
              ticks: { stepSize: 1, color: "#bdc3c7" },
              afterDataLimits: (scale) => {
                scale.max = Math.max(1, scale.max * 1.1);
              },
            },
          },
          layout: { padding: { top: 20, right: 10 } },
          plugins: {
            legend: { display: true, labels: { color: "#eee" } },
            tooltip: {
              callbacks: {
                title: (tooltipItems) => `出目: ${tooltipItems[0].label}`,
                label: (tooltipItem) => {
                  let currentStats =
                    charName === "★みんな"
                      ? stats
                      : this.visibleDiceRollStats[charName];
                  const total =
                    currentStats.successCounts[tooltipItem.dataIndex] +
                    currentStats.failureCounts[tooltipItem.dataIndex];
                  return `${tooltipItem.dataset.label}: ${tooltipItem.raw}回 (合計: ${total}回)`;
                },
              },
            },
            datalabels: {
              anchor: "center",
              align: "center",
              color: "white",
              font: { weight: "bold" },
              formatter: (value) => (value > 0 ? value : ""),
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
        (key) => (versionOptions[key] = false),
      );
      if (presetName === "critFumbleInitial") {
        versionOptions.critical = true;
        versionOptions.fumble = true;
        versionOptions.failure = false;
      } else if (presetName === "official") {
        versionOptions.critical = true;
        versionOptions.fumble = false;
        versionOptions.failure = false;
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
      let skillMatch = diceRoll.match(/【(.+?)】/);
      if (skillMatch && skillMatch[1]) {
        return skillMatch[1].replace(/判定/g, "").trim();
      }
      skillMatch = diceRoll.match(
        /CCB?\s*<=\s*[\d\(\)\+\-\*\/×]+\s+(.+?)\s*\(/,
      );
      if (skillMatch && skillMatch[1]) {
        return skillMatch[1].trim();
      }
      return null;
    },
    getSkillValue(diceRoll) {
      const valueMatch = diceRoll.match(/CCB?<=\s*([\d\(\)\+\-\*\/×]+)/);
      if (valueMatch && valueMatch[1]) {
        try {
          const expression = valueMatch[1].replace(/×/g, "*");
          return new Function("return " + expression)();
        } catch (e) {
          const simpleMatch = diceRoll.match(/CCB?<=(\d+)/);
          if (simpleMatch && simpleMatch[1])
            return parseInt(simpleMatch[1], 10);
        }
      }
      return null;
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
          (opt.special && diceRoll.includes("スペシャル")) ||
          (opt.success &&
            diceRoll.endsWith("＞ 成功") &&
            !diceRoll.includes("決定的成功")) ||
          (opt.luckyNumber &&
            this.luckyNumber > 0 &&
            diceRoll.match(`＞ ${this.luckyNumber} ＞`)) ||
          (opt.failure && this.isFailureRoll(diceRoll))
        );
      } else {
        return (
          (opt.critical && diceRoll.endsWith("＞ クリティカル")) ||
          (opt.fumble && diceRoll.endsWith("＞ ファンブル")) ||
          (opt.extreme && diceRoll.endsWith("＞ イクストリーム成功")) ||
          (opt.hard && diceRoll.endsWith("＞ ハード成功")) ||
          (opt.regular && diceRoll.endsWith("＞ レギュラー成功")) ||
          (opt.failure && this.isFailureRoll(diceRoll))
        );
      }
    },
    isAnySuccess(diceRoll) {
      if (this.detectedVersion === "coc6") {
        return diceRoll.includes("成功") || diceRoll.includes("スペシャル");
      } else {
        return (
          diceRoll.includes("成功") || diceRoll.endsWith("＞ クリティカル")
        );
      }
    },
    isSuccessRoll(diceRoll) {
      const opt = this.options[this.detectedVersion];
      if (!opt) return false;
      if (this.detectedVersion === "coc6") {
        return (
          (opt.critical && diceRoll.includes("決定的成功")) ||
          (opt.special && diceRoll.includes("＞ スペシャル")) ||
          (opt.success &&
            diceRoll.endsWith("＞ 成功") &&
            !diceRoll.includes("決定的成功"))
        );
      } else {
        return (
          (opt.critical && diceRoll.endsWith("＞ クリティカル")) ||
          (opt.extreme && diceRoll.endsWith("＞ イクストリーム成功")) ||
          (opt.hard && diceRoll.endsWith("＞ ハード成功")) ||
          (opt.regular && diceRoll.endsWith("＞ レギュラー成功"))
        );
      }
    },
    isFailureRoll(diceRoll) {
      const opt = this.options[this.detectedVersion];
      if (!opt) return false;
      return (
        (opt.fumble &&
          (diceRoll.includes("致命的失敗") ||
            diceRoll.endsWith("＞ ファンブル"))) ||
        (opt.failure && !this.isAnySuccess(diceRoll))
      );
    },
    isInitialSuccess(skillName, skillValue, charName, diceRoll) {
      if (!this.isAnySuccess(diceRoll)) return false;
      if (skillName === "回避") return !!this.evasionOverrides[charName];
      const initialValue = this.initialSkills[skillName];
      return initialValue !== undefined && skillValue === initialValue;
    },
    getRollResultType(diceRoll) {
      if (this.detectedVersion === "coc6") {
        if (diceRoll.includes("決定的成功")) return "critical";
        if (diceRoll.includes("致命的失敗")) return "fumble";
        if (diceRoll.includes("＞ スペシャル")) return "special";
        if (diceRoll.endsWith("＞ 成功")) return "success";
        if (diceRoll.includes("失敗")) return "failure";
      } else {
        if (diceRoll.endsWith("＞ クリティカル")) return "critical";
        if (diceRoll.endsWith("＞ ファンブル")) return "fumble";
        if (diceRoll.endsWith("＞ イクストリーム成功")) return "extreme";
        if (diceRoll.endsWith("＞ ハード成功")) return "hard";
        if (diceRoll.endsWith("＞ レギュラー成功")) return "success";
        if (diceRoll.includes("失敗")) return "failure";
      }
      return "unknown";
    },
    formatLogText(diceRoll) {
      const resultType = this.getRollResultType(diceRoll);
      const skillFormatted = diceRoll.replace(
        /(【.+?】)/,
        "<strong>$1</strong>",
      );
      const coloredResult = skillFormatted.replace(
        /＞\s*([^＞]*)$/,
        `＞ <span class="result-status result-${resultType}">$1</span>`,
      );
      return coloredResult;
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
    toggleSelectCharacter(charName, isChecked) {
      const charData = this.dialogueResults.find(
        (c) => c.character === charName,
      );
      if (charData) {
        charData.dialogues.forEach((d) => {
          const originalLog = this.parsedLogs[d.id];
          const originalCharName = originalLog.character || "（名前なし）";
          this.$set(
            this.characterDialogueSelection[originalCharName],
            d.id,
            isChecked,
          );
        });
      }
    },
    copySelectedDialogues(event) {
      const allSelectedDialogues = [];
      this.dialogueResults.forEach((charData) => {
        charData.dialogues.forEach((d) => {
          if (d.selected) {
            const originalLog = this.parsedLogs[d.id];
            allSelectedDialogues.push({
              id: d.id,
              character: charData.character,
              messageHtml: originalLog.messageHtml,
            });
          }
        });
      });

      if (allSelectedDialogues.length === 0) {
        this.copyToClipboard("", event);
        return;
      }

      const selectedCharacters = new Set(
        allSelectedDialogues.map((d) => d.character),
      );
      const isSingleCharacter = selectedCharacters.size === 1;

      allSelectedDialogues.sort((a, b) => a.id - b.id);

      const textToCopy = allSelectedDialogues
        .map((d) => {
          let messageToCopy = this.decodeHtmlEntities(d.messageHtml);
          if (!this.dialogueOptions.applyLineBreaks) {
            messageToCopy = messageToCopy.replace(/\n/g, " ");
          }
          if (isSingleCharacter) {
            return messageToCopy;
          } else {
            return `${d.character}: ${messageToCopy}`;
          }
        })
        .join("\n");

      this.copyToClipboard(textToCopy, event);
    },

    copySelectedRawLogs(event) {
      const selectedLogs = this.filteredRawLogs
        .filter((log) => log.selected)
        .map((log) => {
          let messageToCopy = this.decodeHtmlEntities(log.messageHtml);
          if (!this.dialogueOptions.applyLineBreaks) {
            messageToCopy = messageToCopy.replace(/\n/g, " ");
          }
          return `${log.character}: ${messageToCopy}`;
        });

      const textToCopy = selectedLogs.join("\n");
      this.copyToClipboard(textToCopy, event);
    },

    selectMainTab() {
      this.selectedTabs = [];
      if (this.tabNames.includes("メイン")) {
        this.selectedTabs.push("メイン");
      }
    },
    selectAllTabs() {
      this.selectedTabs = [...this.tabNames];
    },
    scrollToDialogue(charName) {
      const element = document.getElementById("dialogue-" + charName);
      if (element) {
        // 要素が閉じている場合は開く
        if (!element.open) {
          element.open = true;
        }
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    areNamesSimilar(name1, name2) {
      // どちらかの名前がもう一方の名前の部分文字列である場合
      if (name1.includes(name2) || name2.includes(name1)) {
        return true;
      }

      // 漢字部分が一致するかどうか (例: 如月 太郎 と 如月)
      const kanji1 = name1.replace(
        /[\p{sc=Hiragana}\p{sc=Katakana}\p{sc=Latin}\p{sc=Common}\s]/gu,
        "",
      );
      const kanji2 = name2.replace(
        /[\p{sc=Hiragana}\p{sc=Katakana}\p{sc=Latin}\p{sc=Common}\s]/gu,
        "",
      );
      if (
        kanji1 &&
        kanji2 &&
        (kanji1.includes(kanji2) || kanji2.includes(kanji1))
      ) {
        return true;
      }

      // その他、より複雑な類似性判定ロジックを追加することも可能
      // 例: レーベンシュタイン距離など

      return false;
    },
  },
};

// 既存ページ(growth_checker.html)での自動初期化
const appEl = document.getElementById("log-tool-app");
if (appEl && !appEl.hasAttribute("data-manual-init")) {
  new Vue(window.GrowthCheckerConfig);
}

import sys, re
with open("js/sw25_generator.js", "r", encoding="utf-16") as f:
    content = f.read()

target = r"""    const renderScoutMatch = ({ kind, title, selfLabel, selfFormula, selfMeta, targetLabel, targetValue, targetMeta, rateLabel, rateResult, extraHtml = "" }) => {
      const rate = formatAnalysisPercentFromRate(rateResult);
      const need = renderNeedText(rateResult);
      return `<section class="analysis-scout-match-block ${escapeAnalysisHtml(kind)}">
        <div class="analysis-match-summary analysis-scout-match-summary">
          <div class="analysis-match-side analysis-match-self">
            <div class="analysis-match-label">冒険者</div>
            <div class="analysis-match-main"><span class="analysis-match-main-label">${escapeAnalysisHtml(selfLabel)}</span><strong>${escapeAnalysisHtml(selfFormula)}</strong></div>
            <div class="analysis-match-statline">${escapeAnalysisHtml(selfMeta)}</div>
          </div>
          <div class="analysis-match-center">
            <div class="analysis-match-result-head"><div class="analysis-match-judgement">${escapeAnalysisHtml(title)}</div><span class="analysis-match-rate"><b>${escapeAnalysisHtml(rate)}</b><small>${escapeAnalysisHtml(rateLabel)}</small></span></div>
            <div class="analysis-match-spark" aria-hidden="true"></div>
            <div class="analysis-match-ribbon">必要出目 ${escapeAnalysisHtml(need)}</div>
          </div>
          <div class="analysis-match-side analysis-match-enemy">
            <div class="analysis-match-label">敵データ</div>
            <div class="analysis-match-main"><span class="analysis-match-main-label">${escapeAnalysisHtml(targetLabel)}</span><strong>${escapeAnalysisHtml(Number.isFinite(targetValue) ? targetValue : "-")}</strong></div>
            <div class="analysis-match-statline">${escapeAnalysisHtml(targetMeta || "-")}</div>
          </div>
        </div>
        ${extraHtml}
      </section>`;
    };
    if (initiative) {
      const base = initiative.base + toAnalysisNumber(totals.initiative, 0);
      const result = get2dSuccessRate(base, enemy.initiativeTarget);
      blocks.push(renderScoutMatch({
        kind: "is-initiative",
        title: "先制判定",
        selfLabel: "先制",
        selfFormula: `2D${formatSigned(base)}`,
        selfMeta: `スカウト${initiative.level} + 敏捷B${initiative.abilityBonus}${totals.initiative ? ` + 補助${formatSigned(totals.initiative)}` : ""}`,
        targetLabel: "先制値",
        targetValue: enemy.initiativeTarget,
        targetMeta: "この値以上で先制",
        rateLabel: "先制成功率",
        rateResult: result,
        extraHtml: totals.initiative ? `<p class="analysis-note">イニシアティブブーストなど: ${escapeAnalysisHtml(formatSigned(totals.initiative))}</p>` : "",
      }));
    }
    if (lore) {
      const base = lore.base + toAnalysisNumber(totals.monsterLore, 0);
      const infoRate = get2dSuccessRate(base, enemy.knowledge);
      const weaknessRate = get2dSuccessRate(base, enemy.weaknessValue);
      const selfMeta = `セージ${lore.level} + 知力B${lore.abilityBonus}${lore.itemBonus ? ` + 装備${formatSigned(lore.itemBonus)}` : ""}${totals.monsterLore ? ` + 補助${formatSigned(totals.monsterLore)}` : ""}`;
      blocks.push(renderScoutMatch({
        kind: "is-knowledge",
        title: "魔物知識: 情報",
        selfLabel: "魔物知識",
        selfFormula: `2D${formatSigned(base)}`,
        selfMeta,
        targetLabel: "知名度",
        targetValue: enemy.knowledge,
        targetMeta: "この値以上で情報開示",
        rateLabel: "情報成功率",
        rateResult: infoRate,
      }));
      blocks.push(renderScoutMatch({
        kind: "is-weakness",
        title: "魔物知識: 弱点",
        selfLabel: "魔物知識",
        selfFormula: `2D${formatSigned(base)}`,
        selfMeta,
        targetLabel: "弱点値",
        targetValue: enemy.weaknessValue,
        targetMeta: enemy.weaknessText || charAnalysisEnemyScoutLore.weaknessText || "弱点未入力",
        rateLabel: "弱点適用率",
        rateResult: weaknessRate,
        extraHtml: `<p class="analysis-scout-weakness"><span>弱点</span><b>${escapeAnalysisHtml(enemy.weaknessText || charAnalysisEnemyScoutLore.weaknessText || "-")}</b></p>${totals.monsterLore ? `<p class="analysis-note">エンサイクロペディアなど: ${escapeAnalysisHtml(formatSigned(totals.monsterLore))}</p>` : ""}`,
      }));
    }"""

replacement = r"""    const renderScoutMatch = ({ kind, selfLabel, selfFormula, selfMeta, selfRibbon, targetLabel, targetValue, targetMeta, rateLabel, rateResult, extraHtml = "" }) => {
      const rate = formatAnalysisPercentFromRate(rateResult);
      const need = renderNeedText(rateResult);
      const grade = rateResult ? gradeFromRate(rateResult.rate) : { label: "不明", className: "unknown" };
      return `<section class="analysis-scout-match-block ${escapeAnalysisHtml(kind)}">
        <div class="analysis-match-summary analysis-scout-match-summary match-rank-${grade.className}">
          <div class="analysis-match-side analysis-match-self">
            <div class="analysis-match-label">冒険者</div>
            <div class="analysis-match-main"><span class="analysis-match-main-label">${escapeAnalysisHtml(selfLabel)}</span><strong>${escapeAnalysisHtml(selfFormula)}</strong></div>
            <div class="analysis-match-statline">${escapeAnalysisHtml(selfMeta)}</div>
            ${selfRibbon ? `<div class="analysis-match-ribbon">${escapeAnalysisHtml(selfRibbon)}</div>` : ""}
          </div>
          <div class="analysis-match-center">
            <div class="analysis-match-result-head"><div class="analysis-match-judgement">${escapeAnalysisHtml(grade.label)}</div><span class="analysis-match-rate"><b>${escapeAnalysisHtml(rate)}</b><small>${escapeAnalysisHtml(rateLabel)}</small></span></div>
            <div class="analysis-match-spark" aria-hidden="true"></div>
            <div class="analysis-match-ribbon">必要出目 ${escapeAnalysisHtml(need)}</div>
          </div>
          <div class="analysis-match-side analysis-match-enemy">
            <div class="analysis-match-label">敵データ</div>
            <div class="analysis-match-main"><span class="analysis-match-main-label">${escapeAnalysisHtml(targetLabel)}</span><strong>${escapeAnalysisHtml(Number.isFinite(targetValue) ? targetValue : "-")}</strong></div>
            <div class="analysis-match-statline">${escapeAnalysisHtml(targetMeta || "-")}</div>
          </div>
        </div>
        ${extraHtml}
      </section>`;
    };
    if (initiative) {
      const base = initiative.base + toAnalysisNumber(totals.initiative, 0);
      const result = get2dSuccessRate(base, enemy.initiativeTarget);
      blocks.push(renderScoutMatch({
        kind: "is-initiative",
        selfLabel: "先制",
        selfFormula: `2D${formatSigned(base)}`,
        selfMeta: `スカウト${initiative.level} + 敏捷B${initiative.abilityBonus}${totals.initiative ? ` + 補助${formatSigned(totals.initiative)}` : ""}`,
        selfRibbon: `${enemy.initiativeTarget || "-"}以上で先制`,
        targetLabel: "先制値",
        targetValue: enemy.initiativeTarget || "-",
        targetMeta: "-",
        rateLabel: "先制成功率",
        rateResult: result,
        extraHtml: totals.initiative ? `<p class="analysis-note">イニシアティブブーストなど: ${escapeAnalysisHtml(formatSigned(totals.initiative))}</p>` : "",
      }));
    }
    if (lore) {
      const base = lore.base + toAnalysisNumber(totals.monsterLore, 0);
      const infoRate = get2dSuccessRate(base, enemy.knowledge);
      const weaknessRate = get2dSuccessRate(base, enemy.weaknessValue);
      const selfMeta = `セージ${lore.level} + 知力B${lore.abilityBonus}${lore.itemBonus ? ` + 装備${formatSigned(lore.itemBonus)}` : ""}${totals.monsterLore ? ` + 補助${formatSigned(totals.monsterLore)}` : ""}`;
      
      const mainRate = Number.isFinite(enemy.weaknessValue) ? weaknessRate : infoRate;
      blocks.push(renderScoutMatch({
        kind: "is-knowledge",
        selfLabel: "魔物知識",
        selfFormula: `2D${formatSigned(base)}`,
        selfMeta,
        selfRibbon: `${enemy.knowledge || "-"}以上で情報開示 / ${enemy.weaknessValue || "-"}以上で弱点判明`,
        targetLabel: "知名度/弱点",
        targetValue: `${enemy.knowledge || "-"}/${enemy.weaknessValue || "-"}`,
        targetMeta: enemy.weaknessText || charAnalysisEnemyScoutLore.weaknessText || "弱点未入力",
        rateLabel: "弱点判明率",
        rateResult: mainRate,
        extraHtml: `<p class="analysis-scout-weakness"><span>弱点</span><b>${escapeAnalysisHtml(enemy.weaknessText || charAnalysisEnemyScoutLore.weaknessText || "-")}</b></p>${totals.monsterLore ? `<p class="analysis-note">エンサイクロペディアなど: ${escapeAnalysisHtml(formatSigned(totals.monsterLore))}</p>` : ""}`,
      }));
    }"""

new_content = content.replace(target, replacement)
if new_content != content:
    with open("js/sw25_generator.js", "w", encoding="utf-16") as f:
        f.write(new_content)
    print("Replaced successfully")
else:
    print("Pattern not found")


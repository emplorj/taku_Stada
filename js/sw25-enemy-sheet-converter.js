(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.sw25EnemySheetConverter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const KNOWN_TAXA = new Set([
    "未分類", "蛮族", "動物", "植物", "アンデッド", "魔法生物", "魔動機",
    "幻獣", "妖精", "魔神", "人族", "神族", "その他",
  ]);

  function text(value) {
    return value === null || value === undefined ? "" : String(value).trim();
  }

  function decodeHtml(value) {
    return text(value)
      .replace(/&lt;br\s*\/?&gt;/gi, "\n")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&amp;/gi, "&")
      .replace(/\r\n?/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function encodeYutorizeText(value) {
    return decodeHtml(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\n/g, "&lt;br&gt;");
  }

  function parseDelimitedRows(source, delimiter) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    const input = String(source || "");
    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];
      if (quoted) {
        if (char === '"' && input[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          cell += char;
        }
      } else if (char === '"' && cell === "") {
        quoted = true;
      } else if (char === delimiter) {
        row.push(cell);
        cell = "";
      } else if (char === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (char !== "\r") {
        cell += char;
      }
    }
    row.push(cell);
    rows.push(row);
    return rows;
  }

  function findBalancedObject(source, startIndex) {
    let depth = 0;
    let quoted = false;
    let escaped = false;
    for (let index = startIndex; index < source.length; index += 1) {
      const char = source[index];
      if (quoted) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') quoted = false;
        continue;
      }
      if (char === '"') quoted = true;
      else if (char === "{") depth += 1;
      else if (char === "}") {
        depth -= 1;
        if (depth === 0) return source.slice(startIndex, index + 1);
      }
    }
    return "";
  }

  function parseJsonCandidate(candidate) {
    const value = JSON.parse(text(candidate));
    if (!value || value.kind !== "character" || !value.data || typeof value.data !== "object") {
      throw new Error("ココフォリアのコマJSONではありません。");
    }
    return value;
  }

  function extractCocofoliaJson(input) {
    const raw = String(input || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    if (!raw) throw new Error("I列のコマJSON、またはJSONを含む表を貼り付けてください。");

    try {
      return parseJsonCandidate(raw);
    } catch (_) {}

    const delimiters = raw.includes("\t") ? ["\t", ","] : [","];
    for (const delimiter of delimiters) {
      for (const row of parseDelimitedRows(raw, delimiter)) {
        for (const cell of row) {
          const candidate = text(cell);
          if (!candidate.includes('"kind"') || !candidate.includes('"character"')) continue;
          try {
            return parseJsonCandidate(candidate);
          } catch (_) {}
        }
      }
    }

    let start = raw.indexOf("{");
    while (start >= 0) {
      const candidate = findBalancedObject(raw, start);
      if (candidate) {
        try {
          return parseJsonCandidate(candidate);
        } catch (_) {}
      }
      start = raw.indexOf("{", start + 1);
    }
    throw new Error("貼り付け内容からココフォリアのコマJSONを見つけられませんでした。");
  }

  function labelValue(source, labelPattern) {
    const match = source.match(new RegExp(`(?:^|[\\n　\\s])(?:${labelPattern})[：:]\\s*([^\\n　]+)`, "u"));
    return match ? text(match[1]) : "";
  }

  function splitKnowledgeValues(value) {
    const raw = text(value).replace(/／/g, "/");
    const match = raw.match(/^([^/]+)\/([^/]+)$/);
    if (match) return [text(match[1]), text(match[2])];
    const reputationOnly = raw.match(/^(-?\d+)/);
    return [reputationOnly ? reputationOnly[1] : raw, ""];
  }

  function numberOrText(value) {
    const raw = text(value);
    const match = raw.match(/-?\d+(?:\.\d+)?/);
    return match ? match[0] : raw;
  }

  function fixedValue(value) {
    const raw = text(value);
    return /^[-+]?\d+$/.test(raw) ? String(Number(raw) + 7) : "";
  }

  function parseMemo(rawMemo) {
    const memo = decodeHtml(rawMemo);
    const taxaAndLevel = memo.match(/(?:分類|種族)[：:]?\s*([^\s　\n]+)(?:[　\s]+Lv\s*([0-9]+))?/u);
    const knowledge = splitKnowledgeValues(labelValue(memo, "知名度\\s*[\\/／]\\s*弱点値"));
    const separators = memo.split(/\n\s*[─━ー-]{2,}\s*\n/u);
    const description = separators.length > 1 ? text(separators[separators.length - 1]) : "";
    return {
      memo,
      level: taxaAndLevel ? text(taxaAndLevel[2]) : labelValue(memo, "Lv|レベル"),
      taxa: taxaAndLevel ? text(taxaAndLevel[1]) : "",
      intellect: labelValue(memo, "知能"),
      perception: labelValue(memo, "知覚"),
      disposition: labelValue(memo, "反応"),
      sin: labelValue(memo, "穢れ"),
      language: labelValue(memo, "言語"),
      habitat: labelValue(memo, "生息地"),
      reputation: knowledge[0],
      weaknessValue: knowledge[1],
      initiative: numberOrText(labelValue(memo, "先制値")),
      mobility: labelValue(memo, "移動(?:速度)?"),
      weakness: labelValue(memo, "弱点"),
      coreParts: labelValue(memo, "コア部位|コア"),
      description,
    };
  }

  function normalizedStatuses(data) {
    return Array.isArray(data.status) ? data.status : [];
  }

  function normalizedParams(data) {
    return Array.isArray(data.params) ? data.params : [];
  }

  function mapByLabel(entries) {
    const values = new Map();
    entries.forEach((entry) => {
      const label = text(entry && entry.label);
      if (label) values.set(label, text(entry.value));
    });
    return values;
  }

  function splitPartStatusLabel(label) {
    const raw = text(label);
    const match = raw.match(/^(.+?)[：:]\s*(HP|MP|防護点?|防護)$/i);
    if (match) return { part: text(match[1]), kind: match[2].toUpperCase() };
    const reverse = raw.match(/^(HP|MP|防護点?|防護)[：:]\s*(.+)$/i);
    if (reverse) return { part: text(reverse[2]), kind: reverse[1].toUpperCase() };
    const parenthesized = raw.match(/^(HP|MP|防護点?|防護)[（(](.+)[）)]$/i);
    if (parenthesized) return { part: text(parenthesized[2]), kind: parenthesized[1].toUpperCase() };
    return { part: "", kind: raw.toUpperCase() };
  }

  function parseCommandStats(commands) {
    const parts = [];
    let current = null;
    const startPart = (name) => {
      current = { name: text(name) };
      parts.push(current);
      return current;
    };
    const ensure = (name) => {
      const normalized = text(name);
      if (!current) return startPart(normalized);
      if (normalized && current.name !== normalized) return startPart(normalized);
      return current;
    };
    decodeHtml(commands).split("\n").forEach((line) => {
      const raw = text(line);
      const heading = raw.match(/^[■◆]\s*(.*)$/u);
      if (heading) {
        const headingName = text(heading[1]);
        if (/^魔物知識開示情報/.test(headingName)) current = null;
        else current = headingName ? startPart(headingName) : null;
        return;
      }
      const clean = raw;
      if (!clean || /^魔物知識開示情報/.test(clean)) return;
      const suffixPart = clean.match(/^(2d(?:6)?(?:\s*[+-]\s*\d+)?|\d+|[―-])\s+(命中(?:力)?|打撃点|回避(?:力)?)(?:\s*[／/]\s*(.+))?$/i);
      const middlePart = clean.match(/^(2d(?:6)?(?:\s*[+-]\s*\d+)?|\d+|[―-])\s+(.+?)\s+(命中(?:力)?|打撃点|回避(?:力)?)$/i);
      const match = suffixPart || middlePart;
      if (!match) return;
      const metric = suffixPart ? match[2] : match[3];
      const partName = suffixPart ? match[3] : match[2];
      let part = ensure(partName);
      const property = /^命中/.test(metric) ? "accuracy" : /^回避/.test(metric) ? "evasion" : "damage";
      if (Object.prototype.hasOwnProperty.call(part, property)) part = startPart(partName || part.name);
      const formula = match[1].replace(/\s+/g, "");
      const modifier = formula.match(/^2d(?:6)?([+-]\d+)?$/i);
      const value = modifier ? (modifier[1] || "0").replace(/^\+/, "") : formula;
      part[property] = property === "damage" ? formula : value;
    });
    return parts.filter((part) => "accuracy" in part || "damage" in part || "evasion" in part);
  }

  function parseKnowledgeSection(commands, memo) {
    const sources = [decodeHtml(commands), decodeHtml(memo)];
    for (const source of sources) {
      const marker = source.match(/(?:^|\n)(?:■\s*)?魔物知識開示情報\s*\n([\s\S]*)$/u)
        || source.match(/(?:^|\n)#{1,3}\s*特殊能力\s*\n([\s\S]*)$/u);
      if (!marker) continue;
      const lines = marker[1].split("\n");
      while (lines.length && !text(lines[0])) lines.shift();
      let weakness = "";
      if (lines.length && /^弱点[：:]/u.test(text(lines[0]))) {
        weakness = text(lines.shift()).replace(/^弱点[：:]\s*/u, "");
      }
      return { skills: text(lines.join("\n")), weakness };
    }
    return { skills: "", weakness: "" };
  }

  function buildParts(data, commandParts) {
    const statuses = normalizedStatuses(data);
    const parts = [];
    const partsByName = new Map();
    const propertyCounts = new Map();
    statuses.forEach((status) => {
      const parsed = splitPartStatusLabel(status.label);
      const property = parsed.kind === "HP" ? "hp" : parsed.kind === "MP" ? "mp" : /^防護/.test(parsed.kind) ? "defense" : "";
      if (!property) return;
      if (!partsByName.has(parsed.part)) partsByName.set(parsed.part, []);
      const namedParts = partsByName.get(parsed.part);
      const countKey = `${parsed.part}\u0000${property}`;
      const occurrence = propertyCounts.get(countKey) || 0;
      propertyCounts.set(countKey, occurrence + 1);
      while (namedParts.length <= occurrence) {
        const next = { name: parsed.part };
        namedParts.push(next);
        parts.push(next);
      }
      const value = text(status.value);
      namedParts[occurrence][property] = value;
    });
    const used = new Set();
    commandParts.forEach((values, commandIndex) => {
      let matchIndex = parts.findIndex((part, index) => !used.has(index) && part.name === values.name);
      if (matchIndex < 0 && !values.name && parts.length === 1 && !used.has(0)) matchIndex = 0;
      if (matchIndex < 0 && commandIndex < parts.length && !used.has(commandIndex)) matchIndex = commandIndex;
      if (matchIndex < 0) {
        parts.push({ name: values.name });
        matchIndex = parts.length - 1;
      }
      Object.assign(parts[matchIndex], values);
      used.add(matchIndex);
    });

    const list = parts;
    if (!list.length) list.push({ name: "" });
    return list.map((part, index) => ({
      style: part.name || (list.length === 1 ? "-" : `部位${index + 1}`),
      accuracy: text(part.accuracy),
      accuracyFix: fixedValue(part.accuracy),
      damage: text(part.damage),
      evasion: text(part.evasion),
      evasionFix: fixedValue(part.evasion),
      defense: text(part.defense),
      hp: text(part.hp),
      mp: text(part.mp),
    }));
  }

  function cocofoliaToYutorize(source) {
    const wrapper = source && source.kind === "character" ? source : extractCocofoliaJson(source);
    const data = wrapper.data || {};
    const memo = parseMemo(data.memo);
    const params = mapByLabel(normalizedParams(data));
    const commands = parseCommandStats(data.commands);
    const parts = buildParts(data, commands);
    const knowledge = parseKnowledgeSection(data.commands, data.memo);
    const taxa = memo.taxa || "未分類";
    const vitResist = params.get("生命抵抗") || params.get("生命抵抗力") || "";
    const mndResist = params.get("精神抵抗") || params.get("精神抵抗力") || "";
    const level = params.get("LV") || params.get("Lv") || memo.level || "";
    const result = {
      gameVersion: "2.5",
      type: "m",
      monsterName: text(data.name) || "名称未設定",
      characterName: "",
      lv: level,
      taxa: KNOWN_TAXA.has(taxa) ? taxa : "その他",
      intellect: memo.intellect,
      perception: memo.perception,
      disposition: memo.disposition,
      language: memo.language,
      habitat: memo.habitat,
      reputation: memo.reputation,
      "reputation+": memo.weaknessValue,
      weakness: memo.weakness || knowledge.weakness,
      initiative: text(data.initiative) || memo.initiative,
      mobility: memo.mobility,
      vitResist,
      vitResistFix: fixedValue(vitResist),
      mndResist,
      mndResistFix: fixedValue(mndResist),
      statusNum: String(parts.length),
      partsNum: String(parts.length),
      parts: parts.length > 1 ? parts.map((part) => part.style).join("／") : "",
      coreParts: memo.coreParts || text(parts.find((part) => /[（(]コア[）)]/u.test(part.style))?.style),
      skills: encodeYutorizeText(knowledge.skills),
      description: encodeYutorizeText(memo.description),
      lootsNum: "0",
    };
    if (taxa && !KNOWN_TAXA.has(taxa)) result.taxaFree = taxa;
    if (memo.sin) result.sin = memo.sin;
    parts.forEach((part, index) => {
      const prefix = `status${index + 1}`;
      result[`${prefix}Style`] = part.style;
      result[`${prefix}Accuracy`] = part.accuracy;
      result[`${prefix}AccuracyFix`] = part.accuracyFix;
      result[`${prefix}Damage`] = part.damage;
      result[`${prefix}Evasion`] = part.evasion;
      result[`${prefix}EvasionFix`] = part.evasionFix;
      result[`${prefix}Defense`] = part.defense;
      result[`${prefix}Hp`] = part.hp;
      result[`${prefix}Mp`] = part.mp;
    });
    return result;
  }

  function convert(input) {
    const source = extractCocofoliaJson(input);
    const value = cocofoliaToYutorize(source);
    const warnings = [];
    if (!value.lv) warnings.push("レベルを読み取れませんでした");
    if (/^\d{4,}$/.test(value.reputation)) warnings.push(`知名度が「${value.reputation}」です（元シートの表示形式を確認）`);
    if (!value.weakness) warnings.push("弱点を読み取れませんでした");
    if (!value["reputation+"]) warnings.push("弱点値を読み取れませんでした");
    if (!value.skills) warnings.push("特殊能力を読み取れませんでした");
    return { value, warnings };
  }

  return {
    convert,
    cocofoliaToYutorize,
    decodeHtml,
    encodeYutorizeText,
    extractCocofoliaJson,
    parseDelimitedRows,
  };
});

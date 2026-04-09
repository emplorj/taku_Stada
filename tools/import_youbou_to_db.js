/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const DEFAULT_API_URL =
  "https://script.google.com/macros/s/AKfycbxMR7f_pOi14SsAuKvu7YxKVBQZ69dn-TeQpMBxyYzo_pwZmICNZ06cSb8BKQYCM0GuGg/exec";

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowText() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const i = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${i}:${s}`;
}

let importSequentialIdCounter = 1;

function nextSequentialImportId() {
  const n = importSequentialIdCounter;
  importSequentialIdCounter += 1;
  return `import-${String(n).padStart(5, "0")}`;
}

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function createSheetTemplate() {
  return {
    id: "",
    author: "",
    name: "",
    nameKana: "",
    createdAt: nowText(),
    updatedAt: nowText(),
    base: {
      homeland: "",
      sex: "？",
      age: "",
      style: "",
      team: "",
      surface: "",
      alliance: "",
      hierarchy: "",
      likes: "",
      dislikes: "",
    },
    ability: {
      crime: 1,
      life: 1,
      love: 1,
      culture: 1,
      combat: 1,
      body: 1,
      mind: 1,
      powerInit: 1,
      powerAtk: 1,
      powerDes: 1,
    },
    condition: {
      bp: 10,
      mp: 10,
      wallet: 10,
      san: 0,
      cthulhu: 0,
      trauma: "",
      addiction: "",
      prisoner: "",
    },
    home: {
      place: "",
      comfortable: 10,
      security: 10,
    },
    weapons: [],
    outfits: [],
    vehicles: [],
    karma: [],
    history: [],
    memo: "",
    meta: {
      danger: 0,
      dangerLevel: "0",
      karmaValue: 7,
      reaction: "中立",
      size: "M",
      quote: "",
      hobbies: "",
      likeType: "",
      likeDetail: "",
      garbageTable: "ガラクタ表",
      expConv: 0,
      karmaCount: 0,
      priceCount: 0,
      powerBase: 3,
      powerRemain: 3,
      languages: "",
      category: "一般人",
    },
  };
}

function extractKomaJsonObjects(text) {
  const source = decodeHtml(text);
  const starts = [];
  const re = /\{\s*"kind"\s*:\s*"character"/g;
  let m;
  while ((m = re.exec(source))) starts.push(m.index);
  const out = [];

  starts.forEach((start) => {
    let depth = 0;
    let inString = false;
    let escaped = false;
    let end = -1;
    for (let i = start; i < source.length; i += 1) {
      const ch = source[i];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === "\\") {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }
      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === "{") depth += 1;
      if (ch === "}") {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end < 0) return;
    const chunk = source.slice(start, end + 1);
    try {
      const obj = JSON.parse(chunk);
      if (obj && obj.kind === "character" && obj.data) out.push(obj);
    } catch (_e) {
      // ignore
    }
  });
  return out;
}

function parseMapByLabel(list) {
  const map = {};
  (Array.isArray(list) ? list : []).forEach((x) => {
    const k = String((x && x.label) || "").trim();
    if (!k) return;
    map[k] = x;
  });
  return map;
}

function parseHobbiesFromMemo(memo) {
  const line = String(memo || "").match(/趣味\s*[：:]\s*([^\n\r]+)/);
  if (!line) return "";
  const hobbies = String(line[1] || "")
    .split(/[、,\/／]/)
    .map((x) => x.trim())
    .filter(Boolean);
  return hobbies.join(",");
}

function decodeHtml(text) {
  return String(text || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function cleanCellText(html) {
  return decodeHtml(String(html || ""))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t\r]+/g, " ")
    .trim();
}

function reflectCountToName(name, note) {
  const baseName = String(name || "").trim();
  const memo = String(note || "").trim();
  if (!memo) return baseName;
  const m = memo.match(/[x×]\s*(\d+)/i);
  if (!m) return baseName;
  return `${baseName}x${m[1]}`;
}

function parseVehicleStats(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const speed = (raw.match(/スピード\s*[：:]\s*([^、,\s]+)/) || [])[1] || "";
  const frame = (raw.match(/車体\s*[：:]\s*([^、,\s]+)/) || [])[1] || "";
  const burden = (raw.match(/荷物\s*[：:]\s*([^、,\s]+)/) || [])[1] || "";
  if (!speed && !frame && !burden) return null;
  return {
    speed: String(speed || "").trim(),
    frame: String(frame || "").trim(),
    burden: String(burden || "").trim(),
  };
}

function extractTableRows(htmlText) {
  return [...String(htmlText || "").matchAll(/<tr[^>]*>[\s\S]*?<\/tr>/gi)].map(
    (m) => m[0],
  );
}

function extractCellsFromRow(rowHtml) {
  return [
    ...String(rowHtml || "").matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi),
  ].map((m) => cleanCellText(m[1]));
}

function parseKarmaKindAndCategory(raw) {
  const text = String(raw || "").trim();
  if (!text) return { kind: "", category: "" };
  const parts = text
    .split(/\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (!parts.length) return { kind: "", category: "" };
  if (parts.length === 1) {
    const p = parts[0];
    if (p === "異能" || p === "代償") return { kind: p, category: "" };
    return { kind: "", category: p };
  }
  return {
    category: parts[0],
    kind: parts[parts.length - 1],
  };
}

const MONSTER_KARMA_PRESET_BY_CATEGORY = {
  一般人: {
    name: "【通報】",
    use: "常駐",
    target: "自分",
    judge: "〔犯罪〕そのエリアの治安",
    effect:
      "このキャラクターを殺したキャラクターは検挙され、「臭い飯」表を振ることになる。ただし、殺したキャラクターかその仲間が上記の判定を行えば、検挙迄のターンを成功度の分だけ遅延することが出来る。シナリオが終了した場合、「臭い飯表」を振らなくても良い",
  },
  迷惑: {
    name: "【追跡】",
    use: "常駐",
    target: "自分",
    judge: "なし",
    effect:
      "対象の行動に割り込んで使用できる。対象からは見えず、しかし対象を見ることが出来る場所にいることが出来る。この効果は、新たに対象にアクションを起こすか、セッション終了まで継続する。",
  },
  チンピラ: {
    name: "【群れ】",
    use: "常駐",
    target: "自分",
    judge: "なし",
    effect:
      "このキャラクターは「跳ぶ」を組み合わせていないセーブ判定を行うとき、サイコロを振らず自動的に成功度が1となる。ただし、「必殺」で発生した10点のダメージに、この異能を使用することはできない。また、命中判定を行うとき、サイコロを振らず自動的に成功度を1にすることができる。",
  },
  刺客: {
    name: "【歴戦】",
    use: "常駐",
    target: "自分",
    judge: "なし",
    effect:
      "血戦中、移動を行ってないラウンドは、(精神点)を1D6点消費すれば、セーブ判定を行う代わりに、自分の〔肉体〕と同じ値だけダメージを減少することができる。ただし、「必殺」で発生した10点のダメージに、この異能を使用することはできない。",
  },
  戦場の狼: {
    name: "【歴戦】",
    use: "常駐",
    target: "自分",
    judge: "なし",
    effect:
      "血戦中、移動を行ってないラウンドは、(精神点)を1D6点消費すれば、セーブ判定を行う代わりに、自分の〔肉体〕と同じ値だけダメージを減少することができる。ただし、「必殺」で発生した10点のダメージに、この異能を使用することはできない。",
  },
  獣: {
    name: "【野生】",
    use: "常駐",
    target: "自分",
    judge: "なし",
    effect:
      "このキャラクターの攻撃によって、〔肉体点〕が0になったキャラクターは、致命傷表を振らず、必ず死亡する。",
  },
  超級英雄: {
    name: "【超人】",
    use: "常駐",
    target: "自分",
    judge: "なし",
    effect:
      "このキャラクターの(肉体点)の最大値は10+(〔肉体)、(精神点)の最大値は10+(精神)の値となる。そして、【超人】は常にスターである。",
  },
  都市伝説: {
    name: "【非現実の恐怖】",
    use: "常駐",
    target: "自分",
    judge: "【精神】難易度9",
    effect:
      "そのゲーム中、このキャラクターと同じモンスター名のキャラクターを初めて見たキャラクターは【精神】で難易度9の判定を行う。失敗したキャラクターは、〔精神点〕を1D6点失う",
  },
};

function applyMonsterKarmaPreset(sheet) {
  if (!sheet || !sheet.meta) return;
  const category = String(sheet.meta.category || "").trim();
  const preset = MONSTER_KARMA_PRESET_BY_CATEGORY[category];
  if (!preset) return;

  const current = Array.isArray(sheet.karma) ? sheet.karma : [];
  const rest = current.filter((k) => {
    if (!k || typeof k !== "object") return false;
    return String(k.name || "").trim() !== preset.name;
  });

  sheet.karma = [
    {
      kind: "異能",
      category: "モンスター",
      name: preset.name,
      use: preset.use,
      target: preset.target,
      judge: preset.judge,
      effect: preset.effect,
    },
    ...rest,
  ];
}

function parseTableEnemyBlocks(htmlText) {
  const rowsHtml = extractTableRows(htmlText);
  const rows = rowsHtml.map((rowHtml) => {
    const cells = extractCellsFromRow(rowHtml);
    return {
      cells,
      text: cells.join(" ").replace(/\s+/g, " ").trim(),
    };
  });

  const startIndices = [];
  rows.forEach((row, i) => {
    if (
      /危険度\s*\d+/.test(row.text) &&
      row.text.includes('{"kind":"character"')
    ) {
      startIndices.push(i);
    }
  });

  const blocks = [];
  for (let i = 0; i < startIndices.length; i += 1) {
    const start = startIndices[i];
    const end =
      i + 1 < startIndices.length ? startIndices[i + 1] - 1 : rows.length - 1;
    const blockRows = rows.slice(start, end + 1);
    const first = blockRows[0] && blockRows[0].text ? blockRows[0].text : "";

    const nameMatch = first.match(/危険度\s*\d+\s*([^\s{]+)/);
    const name = nameMatch ? nameMatch[1] : "";
    const dangerMatch = first.match(/危険度\s*(\d+)/);
    const danger = dangerMatch ? toInt(dangerMatch[1], 0) : 0;
    const categoryMatch = first.match(/\}\}\s*([^\s]+)$/);
    const category = categoryMatch ? categoryMatch[1] : "サタスペ";

    const karma = [];
    const weapons = [];
    const outfits = [];
    const vehicles = [];

    const karmaHeader = blockRows.findIndex((r) =>
      r.text.includes("名称(異/代)"),
    );
    const weaponHeader = blockRows.findIndex((r) =>
      r.text.includes("名称(装備)"),
    );
    const itemHeader = blockRows.findIndex((r) =>
      r.text.includes("名称(他アイテム)"),
    );

    if (karmaHeader >= 0) {
      const stop = weaponHeader >= 0 ? weaponHeader : blockRows.length;
      for (let r = karmaHeader + 1; r < stop; r += 1) {
        const c = blockRows[r].cells;
        const nameCell = String(c[2] || "").trim();
        if (!nameCell) continue;
        const parsed = parseKarmaKindAndCategory(c[7]);
        karma.push({
          name: nameCell,
          use: String(c[3] || "").trim(),
          target: String(c[4] || "").trim(),
          judge: String(c[5] || "").trim(),
          effect: String(c[6] || "").trim(),
          kind: parsed.kind,
          category: parsed.category,
        });
      }
    }

    if (weaponHeader >= 0) {
      const stop = itemHeader >= 0 ? itemHeader : blockRows.length;
      for (let r = weaponHeader + 1; r < stop; r += 1) {
        const c = blockRows[r].cells;
        const nameCell = String(c[2] || "").trim();
        if (!nameCell) continue;
        weapons.push({
          place: "",
          name: reflectCountToName(nameCell, c[7]),
          aim: String(c[3] || "").trim(),
          damage: String(c[4] || "").trim(),
          range: String(c[6] || "").trim(),
          notes: String(c[5] || "").trim(),
        });
      }
    }

    if (itemHeader >= 0) {
      for (let r = itemHeader + 1; r < blockRows.length; r += 1) {
        const c = blockRows[r].cells;
        const nameCell = String(c[2] || "").trim();
        if (!nameCell) continue;
        const cls = String(c[3] || "").trim();
        const special = String(c[4] || "").trim();
        const effect = String(c[5] || "").trim();
        const price = String(c[6] || "").trim();
        const remark = String(c[7] || "").trim();
        const nameWithCount = reflectCountToName(nameCell, remark);
        const vehicleStats = parseVehicleStats(effect);

        if (vehicleStats) {
          vehicles.push({
            name: nameWithCount,
            speed: vehicleStats.speed,
            frame: vehicleStats.frame,
            burden: vehicleStats.burden,
            notes: special,
          });
        } else {
          outfits.push({
            place: "",
            name: nameWithCount,
            use: cls,
            effect,
            notes: [special, price ? `価格${price}` : ""]
              .filter(Boolean)
              .join(" / "),
          });
        }
      }
    }

    blocks.push({
      name,
      danger,
      category,
      karma,
      weapons,
      outfits,
      vehicles,
    });
  }

  return blocks;
}

function mergeTableSectionIntoSheet(sheet, block) {
  if (!sheet || !block) return sheet;
  if (Number.isFinite(block.danger)) sheet.meta.danger = block.danger;
  if (block.category) sheet.meta.category = block.category;
  if (Array.isArray(block.karma)) sheet.karma = block.karma;
  if (Array.isArray(block.weapons) && block.weapons.length) {
    sheet.weapons = block.weapons;
  }
  if (Array.isArray(block.outfits) && block.outfits.length) {
    sheet.outfits = block.outfits;
  }
  if (Array.isArray(block.vehicles) && block.vehicles.length) {
    sheet.vehicles = block.vehicles;
  }
  applyMonsterKarmaPreset(sheet);
  sheet.meta.karmaCount = (sheet.karma || []).filter(
    (k) => k.kind === "異能",
  ).length;
  return sheet;
}

function applyMemoHints(sheet, memo) {
  const danger = memo.match(/危険度\s*[：:]\s*(\d+)/);
  if (danger) sheet.meta.danger = toInt(danger[1], 0);

  const reaction = memo.match(/反応\s*[：:]\s*(憎悪|敵対|懐疑|中立)/);
  if (reaction) sheet.meta.reaction = reaction[1];

  const size = memo.match(/サイズ\s*[：:]\s*([SML小中大])/i);
  if (size) {
    const raw = String(size[1]).toUpperCase();
    sheet.meta.size =
      raw === "S" ? "小" : raw === "L" ? "大" : raw === "M" ? "中" : size[1];
  }

  const table = memo.match(/(ガラクタ表|実用品表|値打ち物表|奇天烈表)/);
  if (table) sheet.meta.garbageTable = table[1];

  // 性別・年齢は取り込み時に参照元から反映しない
}

function komaToSheet(koma, author) {
  const data = koma.data || {};
  const sheet = createSheetTemplate();
  sheet.id = nextSequentialImportId();
  sheet.author = author;
  sheet.name = String(data.name || "新規エネミー").trim();
  const sourceMemo = String(data.memo || "");
  sheet.memo = "";
  sheet.base.sex = "？";
  sheet.base.age = "";
  sheet.meta.likeType = "";
  sheet.meta.likeDetail = "";
  sheet.meta.hobbies = parseHobbiesFromMemo(sourceMemo);

  const p = parseMapByLabel(data.params);
  sheet.ability.crime = toInt(p["犯罪"] && p["犯罪"].value, 1);
  sheet.ability.life = toInt(p["生活"] && p["生活"].value, 1);
  sheet.ability.love = toInt(p["恋愛"] && p["恋愛"].value, 1);
  sheet.ability.culture = toInt(p["教養"] && p["教養"].value, 1);
  sheet.ability.combat = toInt(p["戦闘"] && p["戦闘"].value, 1);
  sheet.ability.body = toInt(p["肉体"] && p["肉体"].value, 1);
  sheet.ability.mind = toInt(p["精神"] && p["精神"].value, 1);
  sheet.ability.powerInit = toInt(p["反応力"] && p["反応力"].value, 1);
  sheet.ability.powerAtk = toInt(p["攻撃力"] && p["攻撃力"].value, 1);
  sheet.ability.powerDes = toInt(p["破壊力"] && p["破壊力"].value, 1);
  sheet.meta.karmaValue = toInt(p["性業値"] && p["性業値"].value, 7);

  const st = parseMapByLabel(data.status);
  if (st["肉体点"])
    sheet.condition.bp = toInt(st["肉体点"].max || st["肉体点"].value, 10);
  if (st["精神点"])
    sheet.condition.mp = toInt(st["精神点"].max || st["精神点"].value, 10);
  if (st["サイフ"]) sheet.condition.wallet = toInt(st["サイフ"].value, 0);

  applyMemoHints(sheet, sourceMemo);
  return sheet;
}

function stripSheetForStorage(sheet) {
  const cloned = JSON.parse(JSON.stringify(sheet || {}));
  if (cloned && typeof cloned === "object") {
    delete cloned.id;
    delete cloned.author;
    delete cloned.name;
    if (cloned.meta && typeof cloned.meta === "object") {
      delete cloned.meta.category;
    }
  }
  return cloned;
}

function toApiEnemy(sheet) {
  const classType = String((sheet.meta && sheet.meta.category) || "サタスペ");
  return {
    ID: String(sheet.id || "").trim(),
    author: String(sheet.author || "").trim() || "インポート",
    name: String(sheet.name || "").trim() || "無題",
    class_type: classType,
    is_public: true,
    memo: "",
    data: {
      system: "satasupe",
      sheet: stripSheetForStorage(sheet),
    },
    icon_url: "",
    time: nowText(),
  };
}

async function postEnemy(apiUrl, enemy) {
  const body = JSON.stringify({
    tool: "satasupe",
    action: "saveSatasupeEnemy",
    author: enemy.author,
    enemy,
  });
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  if (!json || json.status === "error") {
    throw new Error((json && json.message) || "API error");
  }
  return json;
}

async function main() {
  const args = process.argv.slice(2);
  const opt = {
    apiUrl: DEFAULT_API_URL,
    author: "インポート",
    source: "reference/敵ども.html",
    name: "",
    dryRun: false,
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === "--api") {
      opt.apiUrl = args[i + 1] || opt.apiUrl;
      i += 1;
    } else if (a === "--author") {
      opt.author = args[i + 1] || opt.author;
      i += 1;
    } else if (a === "--source") {
      opt.source = args[i + 1] || opt.source;
      i += 1;
    } else if (a === "--name") {
      opt.name = args[i + 1] || "";
      i += 1;
    } else if (a === "--dry-run") {
      opt.dryRun = true;
    }
  }

  importSequentialIdCounter = 1;

  const sourcePath = path.resolve(process.cwd(), opt.source);
  const text = fs.readFileSync(sourcePath, "utf8");
  const komaList = extractKomaJsonObjects(text);
  if (!komaList.length) {
    console.log("対象JSONが見つかりませんでした");
    process.exit(1);
  }

  const tableBlocks = parseTableEnemyBlocks(text);
  const tableByName = new Map();
  tableBlocks.forEach((b) => {
    const k = String(b.name || "").trim();
    if (!k) return;
    if (!tableByName.has(k)) tableByName.set(k, []);
    tableByName.get(k).push(b);
  });

  const targets = Array.isArray(komaList)
    ? komaList.filter((koma) => {
        if (!opt.name) return true;
        return (
          String((koma && koma.data && koma.data.name) || "").trim() ===
          opt.name
        );
      })
    : [];

  if (!targets.length) {
    console.log(`対象が見つかりません name=${opt.name || "(all)"}`);
    process.exit(1);
  }

  if (opt.dryRun) {
    console.log(`DRY-RUN source=${opt.source} count=${targets.length}`);
  }

  let ok = 0;
  for (const koma of targets) {
    const sheet = komaToSheet(koma, opt.author);
    const enemyName = String(
      (koma && koma.data && koma.data.name) || "",
    ).trim();
    const queue = tableByName.get(enemyName) || [];
    const block = queue.length ? queue.shift() : null;
    mergeTableSectionIntoSheet(sheet, block);
    const enemy = toApiEnemy(sheet);

    if (opt.dryRun) {
      console.log(`--- ${enemy.name} ---`);
      console.log(
        JSON.stringify(
          {
            ID: enemy.ID,
            name: enemy.name,
            author: enemy.author,
            class_type: enemy.class_type,
            memo: enemy.memo,
            base: {
              sex: sheet.base.sex,
              age: sheet.base.age,
            },
            likes: {
              likeType: sheet.meta.likeType,
              likeDetail: sheet.meta.likeDetail,
            },
            hobbies: sheet.meta.hobbies,
            karma: sheet.karma,
            weapons: sheet.weapons,
            outfits: sheet.outfits,
            vehicles: sheet.vehicles,
            dataSheetHas: {
              id: !!(enemy.data && enemy.data.sheet && enemy.data.sheet.id),
              author: !!(
                enemy.data &&
                enemy.data.sheet &&
                enemy.data.sheet.author
              ),
              name: !!(enemy.data && enemy.data.sheet && enemy.data.sheet.name),
              category: !!(
                enemy.data &&
                enemy.data.sheet &&
                enemy.data.sheet.meta &&
                enemy.data.sheet.meta.category
              ),
            },
          },
          null,
          2,
        ),
      );
      ok += 1;
      continue;
    }

    try {
      await postEnemy(opt.apiUrl, enemy);
      ok += 1;
      console.log(`OK: ${enemy.name}`);
    } catch (e) {
      console.error(`NG: ${enemy.name} -> ${e.message}`);
    }
  }

  console.log(`DONE ${ok}/${targets.length}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

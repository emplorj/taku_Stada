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

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function createSheetTemplate() {
  return {
    id: `tmp-${uid()}`,
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
      likeDetail: "年上",
      garbageTable: "ガラクタ表",
      expConv: 0,
      karmaCount: 0,
      priceCount: 0,
      powerBase: 3,
      powerRemain: 3,
      languages: "",
      category: "サタスペ",
    },
  };
}

function extractKomaJsonObjects(text) {
  const starts = [];
  const re = /\{\s*"kind"\s*:\s*"character"/g;
  let m;
  while ((m = re.exec(text))) starts.push(m.index);
  const out = [];

  starts.forEach((start) => {
    let depth = 0;
    let inString = false;
    let escaped = false;
    let end = -1;
    for (let i = start; i < text.length; i += 1) {
      const ch = text[i];
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
    const chunk = text.slice(start, end + 1);
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

  const sexAge = memo.match(/([♀♂？])\s*[　\s]*(\d+)歳/);
  if (sexAge) {
    const sx = sexAge[1];
    sheet.base.sex = sx === "♀" ? "女" : sx === "♂" ? "男" : "？";
    sheet.base.age = toInt(sexAge[2], sheet.base.age);
  }
}

function komaToSheet(koma, author) {
  const data = koma.data || {};
  const sheet = createSheetTemplate();
  sheet.id = `tmp-${uid()}`;
  sheet.author = author;
  sheet.name = String(data.name || "新規エネミー").trim();
  sheet.memo = String(data.memo || "");

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

  applyMemoHints(sheet, sheet.memo);
  return sheet;
}

function toApiEnemy(sheet) {
  return {
    ID: String(sheet.id || "").trim(),
    author: String(sheet.author || "").trim() || "インポート",
    name: String(sheet.name || "").trim() || "無題",
    class_type: String((sheet.meta && sheet.meta.category) || "サタスペ"),
    is_public: true,
    memo: String(sheet.memo || ""),
    data: {
      system: "satasupe",
      sheet,
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
  const mdPath = path.resolve(process.cwd(), "youbou.md");
  const apiUrl = process.argv[2] || DEFAULT_API_URL;
  const author = process.argv[3] || "インポート";

  const text = fs.readFileSync(mdPath, "utf8");
  const komaList = extractKomaJsonObjects(text);
  if (!komaList.length) {
    console.log("対象JSONが見つかりませんでした");
    process.exit(1);
  }

  const dedupMap = new Map();
  komaList.forEach((koma) => {
    const key =
      String((koma && koma.data && koma.data.name) || "").trim() ||
      `no-name-${uid()}`;
    if (!dedupMap.has(key)) dedupMap.set(key, koma);
  });
  const unique = [...dedupMap.values()];

  let ok = 0;
  for (const koma of unique) {
    const sheet = komaToSheet(koma, author);
    const enemy = toApiEnemy(sheet);
    try {
      await postEnemy(apiUrl, enemy);
      ok += 1;
      console.log(`OK: ${enemy.name}`);
    } catch (e) {
      console.error(`NG: ${enemy.name} -> ${e.message}`);
    }
  }

  console.log(`DONE ${ok}/${unique.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

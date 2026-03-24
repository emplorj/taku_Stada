const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.resolve(process.cwd(), "enemies.txt");
const MASTER_CSV_PATH = path.resolve(
  process.cwd(),
  "ネクロニカ_マニューバ.csv",
);
const AUTHOR = "公式";
const API_URL =
  "https://script.google.com/macros/s/AKfycbxMR7f_pOi14SsAuKvu7YxKVBQZ69dn-TeQpMBxyYzo_pwZmICNZ06cSb8BKQYCM0GuGg/exec?action=saveNechronicaEnemy";

const PART_TYPES = new Set(["頭", "腕", "胴", "脚"]);

const MALICE_OVERRIDE_TEXT = `
1,ひきさく
1,よろめく
1,むらがる
1.5,一斉射撃
1.5,うわごと
1,ついばむ
1.5,はばたき
1,かぎづめ
1,ほね
1.5,狂鬼
1.5,のうみそ
0.5,はらわた
1,セイバートゥース
1.5,けもあし
1.5,強化脊髄
1,しっぽ
1,狙撃ライフル
1,スコープ
1.5,死の手
1,おおあご
1.5,はね
1,よぶんなはね
1,外骨格
1.5,中枢神経
0.5,脚
1,大鉈
1.5,怪力
1,アーマースキン
1,寄生胞子
1.5,不動
1.5,しびとだけ
1.5,反射行動
1,よろめくあし
0.5,きのこ
1,クラッシュバイス
1,キャタピラ
1,モーターギア
1,うろこ
1,めだま
1.5,自動制御装置
1.5,分解ガス
2,対策装備
1.5,フローター
3,ゾンビボム
1.5,エンバーミング
1.5,にくむち
1,触肢
1,視界共有
1,アドレナリン
2,狂気の歌
1,呪い髪
1,ちみどろ
1,しんぞう
1.5,攻性触手
1.5,根肢
1,伸縮触手
1,捕縛触手
1,肉厚
0.5,はなびら
1.5,シュレッダー
1,多脚戦車
1.5,オートバランサー
1,スクレーパー
1.5,突進
1,正面装甲
1.5,メインエンジン
1,サブエンジン
0.5,装甲板
1.5,名刀
1.5,銭湯感覚
1,鎧具足
1.5,殺戮本能
1,リフレックス
1.5,平気
1,怪物の顎
1.5,巨体
1,節足
1,粘液塊
1,強化外骨格
1,怪物の腕
1,ボルトヘッド
1.5,肉の盾
1,強化筋肉
1,スチールボーン
1,リミッター
1.5,死人指揮
0.5,あご
1,カンフー
1,二丁拳銃
1,うで
1,肉切り包丁
0.5,かた
0.5,こぶし
1.5,庇う
1,せぼね
1,あし
1,よぶんなうで
1.5,やぶれひまく
1,はりつき
1,どくばり
1,レーザービーム
1.5,人工知能
1.5,エンジン
1,ブースター
1.5,ホバー
1,ヒートブロウ
1.5,選ばれし美貌
2,亡者の目覚め
1.5,選ばれし唇
1.5,選ばれし脳
1,選ばれし瞳
1.5,操り人形糸
2,奴隷の献身
1.5,死者融合
1,選ばれし手
1,選ばれし指先
1,選ばれし肌
1,選ばれし心臓
1,選ばれし骨格
0.5,選ばれし臓腑
0.5,麗しきドレス
1.5,円舞曲
1,女王の歩み
1,選ばれし脚
1.5,無差別攻撃
1,押し寄せる群れ
1.5,火炎放射器
1.5,サイボーグ
1,肉刺し棒
1.5,うきぶくろ
1,飛び跳ね
1,弾き飛ばし
1.5,死の舞踏
1,奇怪な動き
0.5,少女の屍
1.5,解体爪
1.5,長い腕
1.5,やせぎす
1.5,狂戦士
0.5,過剰筋肉
1.5,高速化処理
1.5,肉の宴
1,トラウマスイッチ
0.5,埋込フック
1.5,だるま
1,あるびの
1,かみつきあご
1.5,ジャンプ
1,まえあし
1,にくきゅう
1,けがわ
1,心崩し
1,ベクトル偏向膜
0.5,止まらぬ痙攣
0.5,おぞましきもの
1,ただよう
1,少女の体
1.5,騎乗調整
1.5,巨大な脚
1,踏みつけ
1.5,反射跳躍
2,狂気の波調
1.5,不安の種
1.5,知覚混乱
1.5,肥大脳
0.5,のうしょう
1.5,大鋏
2,縫合用アーム
3,合成再活性化
1.5,自動再接続
1.5,再生
1.5,アームバイス
1,有機触肢
1,強化反応器
0.5,構築関節
1.5,緊急転移
1.5,絶対歪曲
1.5,覚醒領域
1,脳幹刺激端末
1,空間抉り
0.5,痩せた腕
0.5,痩せた脚
1,熊撃ち銃
1.5,銃神
2,ただよう
1,触覚
1,金属脚
1,強化装甲
1.5,凶化器官
1.5,増設用脳
1,生態駆動
1.5,にくへび
0.5,蛇尾
1,怪物の手
1,感覚制御マスク
1,スパイク
1.5,超強化筋肉
1.5,長い脚
1,起爆スイッチ
1,サバイバルナイフ
1,発勁
`;

// 備考:
// - 「最大行動値+N」は +N を設定
// - 「リミッター」は「損傷時のみ +2」を現行計算ロジックで表現するため -2 を設定
//   （通常時は 0 扱い、損傷時に +2 相当として加算される）
const INITIATIVE_OVERRIDE_TEXT = `
2,のうみそ
2,強化脊髄
1,しっぽ
2,中枢神経
2,反射行動
1,めだま
1,アドレナリン
1,しんぞう
2,メインエンジン
1,サブエンジン
2,殺戮本能
1,リフレックス
-2,リミッター
1,カンフー
2,人工知能
2,エンジン
1,ブースター
2,選ばれし脳
1,選ばれし瞳
1,選ばれし手
1,選ばれし指先
1,選ばれし心臓
1,選ばれし骨格
1,奇怪な動き
2,高速化処理
2,肥大脳
1,強化反応器
2,覚醒領域
1,脳幹刺激端末
1,触覚
2,増設用脳
1,生態駆動
`;

function buildMaliceOverrideMap() {
  const map = new Map();
  const lines = String(MALICE_OVERRIDE_TEXT || "")
    .split(/\r?\n/)
    .map((x) => String(x || "").trim())
    .filter((x) => x.length > 0);
  lines.forEach((line) => {
    const comma = line.indexOf(",");
    if (comma <= 0) return;
    const maliceText = line.slice(0, comma).trim();
    const name = line.slice(comma + 1).trim();
    if (!name) return;
    const malice = Number(maliceText);
    if (!Number.isFinite(malice)) return;
    map.set(name, malice);
  });
  return map;
}

const MALICE_OVERRIDE_MAP = buildMaliceOverrideMap();

function buildInitiativeOverrideMap() {
  const map = new Map();
  const lines = String(INITIATIVE_OVERRIDE_TEXT || "")
    .split(/\r?\n/)
    .map((x) => String(x || "").trim())
    .filter((x) => x.length > 0);
  lines.forEach((line) => {
    const comma = line.indexOf(",");
    if (comma <= 0) return;
    const initiativeText = line.slice(0, comma).trim();
    const name = line.slice(comma + 1).trim();
    if (!name) return;
    const initiative = Number(initiativeText);
    if (!Number.isFinite(initiative)) return;
    map.set(name, initiative);
  });
  return map;
}

const INITIATIVE_OVERRIDE_MAP = buildInitiativeOverrideMap();

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          q = false;
        }
      } else {
        cur += c;
      }
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else if (c === '"') {
      q = true;
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function loadManeuverMasterMap() {
  if (!fs.existsSync(MASTER_CSV_PATH)) return new Map();
  const raw = fs.readFileSync(MASTER_CSV_PATH, "utf8").replace(/^\uFEFF/, "");
  const lines = raw
    .split(/\r?\n/)
    .map((x) => String(x || "").trim())
    .filter((x) => x.length > 0);
  if (!lines.length) return new Map();

  const header = parseCsvLine(lines[0]);
  const idxName = header.indexOf("名称");
  const idxIni = header.indexOf("行動値");
  const idxMalice = header.indexOf("悪意");
  if (idxName < 0) return new Map();

  const map = new Map();
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const name = String(cols[idxName] || "").trim();
    if (!name) continue;
    const ini = Number((idxIni >= 0 ? cols[idxIni] : "") || 0);
    const malice = Number((idxMalice >= 0 ? cols[idxMalice] : "") || 0);
    map.set(name, {
      initiative: Number.isFinite(ini) ? ini : 0,
      malice: Number.isFinite(malice) ? malice : 0,
    });
  }
  return map;
}

function nowText() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${min}:${s}`;
}

function parseManeuvers(commandsText = "", masterMap = new Map()) {
  const lines = String(commandsText || "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  const out = [];
  let currentPart = "胴";

  for (const raw of lines) {
    const line = String(raw || "").trim();
    if (!line) continue;
    if (line.startsWith("👧")) {
      currentPart = "頭";
      continue;
    }
    if (line.startsWith("💪")) {
      currentPart = "腕";
      continue;
    }
    if (line.startsWith("🧍")) {
      currentPart = "胴";
      continue;
    }
    if (line.startsWith("🦵")) {
      currentPart = "脚";
      continue;
    }
    if (!line.includes("【") || !line.includes("《")) continue;

    const normalized = line.replace(/^[⭕✅❌]\s*/, "");
    const m = normalized.match(
      /^【([^】]+)】《([^/]*)\/([^/]*)\/([^》]*)》\s*(.*)$/,
    );
    if (!m) continue;

    const [, name, timing, cost, range, effect] = m;
    const normalizedName = String(name || "").trim();
    const master = masterMap.get(normalizedName);
    const overrideInitiative = Number(
      INITIATIVE_OVERRIDE_MAP.get(normalizedName),
    );
    const initiative = Number.isFinite(overrideInitiative)
      ? overrideInitiative
      : Number(master && master.initiative);
    const overrideMalice = Number(MALICE_OVERRIDE_MAP.get(normalizedName));
    const malice = Number.isFinite(overrideMalice)
      ? overrideMalice
      : Number(master && master.malice);
    out.push({
      id: `man_${out.length + 1}`,
      name: normalizedName,
      kindName: normalizedName,
      displayName: normalizedName,
      partType: PART_TYPES.has(currentPart) ? currentPart : "胴",
      timing: String(timing || "").trim(),
      cost: String(cost || "").trim(),
      range: String(range || "").trim(),
      initiative: Number.isFinite(initiative) ? initiative : 0,
      malice: Number.isFinite(malice) ? malice : 0,
      effect: String(effect || "").trim(),
      brokenEffect: "",
      masterId: "",
      source: "",
      partId: "",
      broken: "",
    });
  }

  return out;
}

function toEnemyObject(characterJson, masterMap = new Map()) {
  const data = (characterJson && characterJson.data) || {};
  const status = Array.isArray(data.status) ? data.status : [];

  const isServant = status.some((s) =>
    PART_TYPES.has(String((s && s.label) || "")),
  );
  const parts = status.length
    ? status.map((s, idx) => {
        const label = String((s && s.label) || "").trim();
        return {
          id: `part_${idx + 1}`,
          type: PART_TYPES.has(label) ? label : "胴",
          name: label || "パーツ",
          max: Number((s && s.max) || 0),
          current: Number((s && s.value) || 0),
          use: true,
        };
      })
    : [
        {
          id: "part_1",
          type: "胴",
          name: "パーツ",
          max: 0,
          current: 0,
          use: true,
        },
      ];

  return {
    ID: "",
    author: AUTHOR,
    name: String(data.name || "").trim(),
    class_type: isServant ? "サヴァント" : "ホラー",
    place: "煉獄",
    unit_count: 1,
    summary_slots: [],
    is_public: true,
    memo: String(data.memo || ""),
    data: {
      parts,
      maneuvers: parseManeuvers(String(data.commands || ""), masterMap),
    },
    icon_url: String(data.iconUrl || "").trim(),
    time: nowText(),
  };
}

async function saveEnemy(enemy) {
  const payload = {
    tool: "nechronica",
    action: "saveNechronicaEnemy",
    author: AUTHOR,
    enemy,
  };
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json || json.status !== "success") {
    const msg = (json && (json.message || json.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

async function main() {
  const raw = fs.readFileSync(INPUT_PATH, "utf8");
  const masterMap = loadManeuverMasterMap();
  const lines = raw
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);

  let ok = 0;
  let ng = 0;
  const failed = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    try {
      const obj = JSON.parse(line);
      const enemy = toEnemyObject(obj, masterMap);
      await saveEnemy(enemy);
      ok += 1;
      console.log(`[OK] ${i + 1}: ${enemy.name}`);
    } catch (e) {
      ng += 1;
      const message = e && e.message ? e.message : String(e);
      failed.push({ line: i + 1, message });
      console.log(`[NG] ${i + 1}: ${message}`);
    }
  }

  console.log("\n=== RESULT ===");
  console.log(`total=${lines.length} ok=${ok} ng=${ng}`);
  if (failed.length) {
    console.log("--- failed lines ---");
    failed.forEach((f) => console.log(`line ${f.line}: ${f.message}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Serverless API: /api/koma-maker
 * - Vercel: module.exports = handler
 * - Netlify: exports.handler
 */

function decodeHtml(s) {
  return String(s || "")
    .replace(/&hellip;/g, "…")
    .replace(/&rdquo;/g, "”")
    .replace(/&ldquo;/g, "“")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&times;/g, "×")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function escRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toInt(v, defVal = 0) {
  const n = parseInt(String(v ?? "").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : defVal;
}

function extractFirst(html, regex, defVal = "") {
  const m = html.match(regex);
  return m && m[1] !== undefined ? decodeHtml(m[1]) : defVal;
}

function extractAll(html, regex) {
  const out = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    out.push(decodeHtml(m[1] || ""));
  }
  return out;
}

function pickInputByName(html, name, defVal = "") {
  const n = escRe(name);
  return extractFirst(
    html,
    new RegExp(`name=["']${n}["'][^>]*value=["']([^"']*)["']`, "i"),
    defVal,
  );
}

function pickInputById(html, id, defVal = "") {
  const n = escRe(id);
  return extractFirst(
    html,
    new RegExp(`id=["']${n}["'][^>]*value=["']([^"']*)["']`, "i"),
    defVal,
  );
}

function pickAllByName(html, name) {
  const n = escRe(name);
  return extractAll(
    html,
    new RegExp(`name=["']${n}["'][^>]*value=["']([^"']*)["']`, "gi"),
  );
}

function parseTitle(html) {
  return extractFirst(html, /<title>([\s\S]*?)<\/title>/i, "").trim();
}

function normalizeSheetUrl(url) {
  return String(url || "")
    .trim()
    .replace(/\/+$/, "");
}

const DX3_COMBO_GAS_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbxMR7f_pOi14SsAuKvu7YxKVBQZ69dn-TeQpMBxyYzo_pwZmICNZ06cSb8BKQYCM0GuGg/exec";

const comboPaletteCache = new Map();

// -----------------------------------------------------------------------------
// SW2.5 吸収済みマスタ群
// - 旧 [`js/sw_output.js`](js/sw_output.js) の主要データを API 側に移植
// - 将来的に [`js/sw_output.js`](js/sw_output.js) を削除しても
//   SW2.5 の変換/チャットパレット生成が壊れないための定義
// -----------------------------------------------------------------------------
const SW25_SKILL_MASTER = [
  { id: 1, name: "ファイター", isMagic: false },
  { id: 2, name: "グラップラー", isMagic: false },
  { id: 3, name: "フェンサー", isMagic: false },
  { id: 4, name: "シューター", isMagic: false },
  { id: 5, name: "ソーサラー", isMagic: true },
  { id: 6, name: "コンジャラー", isMagic: true },
  { id: 7, name: "プリースト", isMagic: true },
  { id: 8, name: "フェアリーテイマー", isMagic: true },
  { id: 9, name: "マギテック", isMagic: true },
  { id: 10, name: "スカウト", isMagic: false },
  { id: 11, name: "レンジャー", isMagic: false },
  { id: 12, name: "セージ", isMagic: false },
  { id: 13, name: "エンハンサー", isMagic: false },
  { id: 14, name: "バード", isMagic: false },
  { id: 15, name: "アルケミスト", isMagic: false },
  { id: 16, name: "ライダー", isMagic: false },
  { id: 17, name: "デーモンルーラー", isMagic: true },
  { id: 18, name: "ウォーリーダー", isMagic: false },
  { id: 19, name: "ミスティック", isMagic: false },
  { id: 20, name: "フィジカルマスター", isMagic: false },
  { id: 21, name: "グリモワール", isMagic: false },
  { id: 22, name: "アーティザン", isMagic: false },
  { id: 23, name: "アリストクラシー", isMagic: false },
  { id: 24, name: "ドルイド", isMagic: true },
  { id: 25, name: "ジオマンサー", isMagic: false },
  { id: 26, name: "バトルダンサー", isMagic: false },
  { id: 27, name: "アビスゲイザー", isMagic: true },
  { id: 28, name: "ダークハンター", isMagic: false },
  { id: 29, name: "ビブリオマンサー", isMagic: true },
];

const SW25_SKILL_ORDER = [
  "ファイター",
  "グラップラー",
  "フェンサー",
  "シューター",
  "ソーサラー",
  "コンジャラー",
  "プリースト",
  "フェアリーテイマー",
  "マギテック",
  "スカウト",
  "レンジャー",
  "セージ",
  "バード",
  "アルケミスト",
  "ライダー",
  "デーモンルーラー",
  "ウォーリーダー",
  "ミスティック",
  "フィジカルマスター",
  "グリモワール",
  "アーティザン",
  "アリストクラシー",
  "ドルイド",
  "ジオマンサー",
  "バトルダンサー",
  "アビスゲイザー",
  "ダークハンター",
  "ビブリオマンサー",
];

const SW25_AUTO_FEAT_RULES = [
  { feat: "タフネス", skill: "ファイター", level: 7 },
  { feat: "追加攻撃", skill: "グラップラー", level: 1 },
  { feat: "カウンター", skill: "グラップラー", level: 7 },
  {
    feat: "バトルマスター",
    anyOf: [
      { skill: "ファイター", level: 13 },
      { skill: "グラップラー", level: 13 },
    ],
  },
  { feat: "ルーンマスター", anyMagic: 11 },
  { feat: "トレジャーハント", skill: "スカウト", level: 5 },
  { feat: "ファストアクション", skill: "スカウト", level: 7 },
  { feat: "影走り", skill: "スカウト", level: 9 },
  { feat: "トレジャーマスター", skill: "スカウト", level: 12 },
  { feat: "匠の技", skill: "スカウト", level: 15 },
  { feat: "サバイバビリティ", skill: "レンジャー", level: 5 },
  { feat: "不屈", skill: "レンジャー", level: 7 },
  { feat: "ポーションマスター", skill: "レンジャー", level: 9 },
  { feat: "縮地", skill: "レンジャー", level: 12 },
  { feat: "ランアンドガン", skill: "レンジャー", level: 15 },
  { feat: "鋭い目", skill: "セージ", level: 5 },
  { feat: "弱点看破", skill: "セージ", level: 7 },
  { feat: "マナセーブ", skill: "セージ", level: 9 },
  { feat: "マナ耐性", skill: "セージ", level: 12 },
  { feat: "賢人の知恵", skill: "セージ", level: 15 },
];

const SW25_DAM_SOR = [
  ["10"],
  ["10"],
  ["10", "20"],
  ["10", "20"],
  ["10", "20", "30"],
  ["10", "20", "30"],
  ["10", "20", "30"],
  ["10", "20", "30", "40"],
  ["0", "10", "20", "30", "40"],
  ["0", "10", "20", "30", "40"],
  ["0", "10", "20", "30", "40", "50"],
  ["0", "10", "20", "30", "40", "50"],
  ["0", "10", "20", "30", "40", "50"],
  ["0", "10", "20", "30", "40", "50", "60"],
  ["0", "10", "20", "30", "40", "50", "60", "100"],
  ["0", "10", "20", "30", "40", "50", "60", "100"],
  ["0", "10", "20", "30", "40", "50", "60", "100"],
];

const SW25_DAM_CON = [
  ["0"],
  ["0"],
  ["0"],
  ["0"],
  ["0"],
  ["0"],
  ["0", "10"],
  ["0", "10", "20"],
  ["0", "10", "20", "30"],
  ["0", "10", "20", "30"],
  ["0", "10", "20", "30"],
  ["0", "10", "20", "30"],
  ["0", "10", "20", "30"],
  ["0", "10", "20", "30"],
  ["0", "10", "20", "30", "60"],
  ["0", "10", "20", "30", "60"],
  ["0", "10", "20", "30", "60"],
];

const SW25_HEAL_CON = [
  [],
  ["0"],
  ["0"],
  ["0"],
  ["0"],
  ["0"],
  ["0"],
  ["0"],
  ["0"],
  ["0"],
  ["0", "30"],
  ["0", "30"],
  ["0", "30"],
  ["0", "30"],
  ["0", "30"],
  ["0", "30"],
  ["0", "30"],
];

const SW25_DAM_WIZ = [
  [],
  [],
  [],
  ["20"],
  ["20"],
  ["20"],
  ["10", "20"],
  ["10", "20"],
  ["10", "20", "25", "30"],
  ["10", "20", "25", "30"],
  ["10", "20", "25", "30"],
  ["0", "10", "20", "25", "30"],
  ["0", "10", "20", "25", "30", "70"],
  ["0", "10", "20", "25", "30", "70"],
  ["0", "10", "20", "25", "30", "70"],
  ["0", "10", "20", "25", "30", "70"],
  ["0", "10", "20", "25", "30", "70"],
];

const SW25_DAM_PRI = [
  ["5"],
  ["5", "10"],
  ["5", "10", "15"],
  ["5", "10", "15", "20"],
  ["5", "10", "15", "20", "25"],
  ["5", "10", "15", "20", "25", "30"],
  ["5", "10", "15", "20", "25", "30"],
  ["5", "10", "15", "20", "25", "30", "40"],
  ["5", "10", "15", "20", "25", "30", "40"],
  ["5", "10", "15", "20", "25", "30", "40"],
  ["5", "10", "15", "20", "25", "30", "40", "50"],
  ["5", "10", "15", "20", "25", "30", "40", "50"],
  ["5", "10", "15", "20", "25", "30", "40", "50", "70", "80", "90"],
  ["5", "10", "15", "20", "25", "30", "40", "50", "70", "80", "90"],
  ["5", "10", "15", "20", "25", "30", "40", "50", "70", "80", "90"],
  ["5", "10", "15", "20", "25", "30", "40", "50", "70", "80", "90"],
  ["5", "10", "15", "20", "25", "30", "40", "50", "70", "80", "90"],
];

const SW25_HEAL_PRI = [
  [],
  ["10"],
  ["10"],
  ["10"],
  ["10", "30"],
  ["10", "30"],
  ["10", "30"],
  ["10", "30"],
  ["10", "30"],
  ["10", "30", "50"],
  ["10", "30", "50"],
  ["10", "30", "50"],
  ["10", "30", "50", "70"],
  ["10", "30", "50", "70"],
  ["10", "30", "50", "70"],
  ["10", "30", "50", "70"],
  ["10", "30", "50", "70"],
];

const SW25_DAM_BULLET = [
  ["20"],
  ["20"],
  ["20"],
  ["20"],
  ["20"],
  ["20", "30"],
  ["10", "20", "30"],
  ["10", "20", "30"],
  ["10", "20", "30"],
  ["10", "20", "30"],
  ["10", "20", "30"],
  ["10", "20", "30", "40"],
  ["10", "20", "30", "40"],
  ["10", "20", "30", "40"],
  ["10", "20", "30", "40", "70"],
  ["10", "20", "30", "40", "70"],
  ["10", "20", "30", "40", "70"],
];

const SW25_HEAL_BULLET = [
  [],
  ["0"],
  ["0"],
  ["0"],
  ["0"],
  ["0"],
  ["0"],
  ["0"],
  ["0"],
  ["0", "30"],
  ["0", "30"],
  ["0", "30"],
  ["0", "30"],
  ["0", "30"],
  ["0", "30"],
  ["0", "30"],
  ["0", "30"],
];

const SW25_DAM_MAG = [
  [],
  [],
  [],
  [],
  ["30"],
  ["30"],
  ["30"],
  ["30"],
  ["30"],
  ["30"],
  ["30"],
  ["30"],
  ["30"],
  ["30"],
  ["30", "90"],
  ["30", "90"],
  ["30", "90"],
];

const SW25_HEAL_MAG = [
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  ["50"],
  ["50"],
  ["50"],
  ["50"],
  ["50"],
  ["50"],
  ["50"],
  ["50"],
  ["50"],
];

const SW25_DAM_FAI = [
  [],
  ["10"],
  ["10", "20", "30"],
  ["10", "20", "30"],
  ["10", "20", "30"],
  ["10", "20", "30"],
  ["10", "20", "30"],
  ["10", "20", "30", "40"],
  ["10", "20", "30", "40", "50"],
  ["10", "20", "30", "40", "50"],
  ["10", "20", "30", "40", "50", "60"],
  ["10", "20", "30", "40", "50", "60"],
  ["10", "20", "30", "40", "50", "60"],
  ["10", "20", "30", "40", "50", "60"],
  ["10", "20", "30", "40", "50", "60", "80"],
  ["10", "20", "30", "40", "50", "60", "80"],
  ["10", "20", "30", "40", "50", "60", "80"],
];

const SW25_DAM_DRU = [
  [],
  [],
  [],
  ["10", "20"],
  ["10", "20"],
  ["10", "20"],
  ["10", "20"],
  ["10", "20"],
  ["10", "20"],
  ["10", "20"],
  ["10", "20"],
  ["10", "20", "30"],
  ["10", "20", "30"],
  ["10", "20", "30"],
  ["10", "20", "30", "50"],
  ["10", "20", "30", "50"],
  ["10", "20", "30", "50"],
];

const SW25_PHY_DRU = [
  ["0,3,6"],
  ["0,3,6"],
  ["0,3,6", "4,7,13"],
  ["0,3,6", "4,7,13"],
  ["0,3,6", "4,7,13"],
  ["0,3,6", "4,7,13"],
  ["0,3,6", "4,7,13", "12,15,18"],
  ["0,3,6", "4,7,13", "12,15,18"],
  ["0,3,6", "4,7,13", "12,15,18", "13,16,19"],
  ["0,3,6", "4,7,13", "12,15,18", "13,16,19", "18,21,24"],
  ["0,3,6", "4,7,13", "12,15,18", "13,16,19", "18,21,24"],
  ["0,3,6", "4,7,13", "12,15,18", "13,16,19", "18,21,24"],
  ["0,3,6", "4,7,13", "12,15,18", "13,16,19", "18,21,24", "18,21,36"],
  ["0,3,6", "4,7,13", "12,15,18", "13,16,19", "18,21,24", "18,21,36"],
  [
    "0,3,6",
    "4,7,13",
    "12,15,18",
    "13,16,19",
    "18,21,24",
    "18,21,36",
    "24,27,30",
  ],
  [
    "0,3,6",
    "4,7,13",
    "12,15,18",
    "13,16,19",
    "18,21,24",
    "18,21,36",
    "24,27,30",
  ],
  [
    "0,3,6",
    "4,7,13",
    "12,15,18",
    "13,16,19",
    "18,21,24",
    "18,21,36",
    "24,27,30",
  ],
];

const SW25_DAM_DEM = [
  [],
  ["20"],
  ["10", "20"],
  ["10", "20"],
  ["10", "20"],
  ["10", "20"],
  ["10", "20"],
  ["10", "20"],
  ["10", "20", "40"],
  ["10", "20", "40"],
  ["10", "20", "40"],
  ["10", "20", "40"],
  ["10", "20", "40"],
  ["10", "20", "40", "70"],
  ["10", "20", "30", "40", "70"],
  ["10", "20", "30", "40", "70"],
  ["10", "20", "30", "40", "70"],
];

const SW25_DAM_ABYSS = [
  ["0", "20"],
  ["0", "20"],
  ["0", "10", "20"],
  ["0", "10", "20"],
  ["0", "10", "20"],
  ["0", "10", "20"],
  ["0", "10", "20", "30"],
  ["0", "10", "20", "30"],
  ["0", "10", "20", "30", "40"],
  ["0", "10", "20", "30", "40"],
  ["0", "10", "20", "30", "40", "60"],
  ["0", "10", "20", "30", "40", "60"],
  ["0", "10", "20", "30", "40", "50", "60", "70"],
  ["0", "10", "20", "30", "40", "50", "60", "70"],
  ["0", "10", "20", "30", "40", "50", "60", "70"],
  ["0", "10", "20", "30", "40", "50", "60", "70"],
  ["0", "10", "20", "30", "40", "50", "60", "70"],
];

const SW25_HEAL_ABYSS = [
  ["0"],
  ["0"],
  ["0"],
  ["0"],
  ["0"],
  ["0", "20", "40"],
  ["0", "20", "40"],
  ["0", "20", "40"],
  ["0", "20", "40"],
  ["0", "20", "40", "70"],
  ["0", "20", "40", "70"],
  ["0", "20", "40", "70"],
  ["0", "20", "40", "70"],
  ["0", "20", "40", "70"],
  ["0", "20", "40", "70"],
  ["0", "20", "40", "70"],
  ["0", "20", "40", "70"],
];

const SW25_DAM_BIB = [
  ["10", "20"],
  ["10", "20"],
  ["10", "20"],
  ["10", "20", "30"],
  ["10", "20", "30"],
  ["10", "20", "30"],
  ["10", "20", "30", "40", "50"],
  ["10", "20", "30", "40", "50"],
  ["10", "20", "30", "40", "50"],
  ["10", "20", "30", "40", "50", "60"],
  ["10", "20", "30", "40", "50", "60"],
  ["10", "20", "30", "40", "50", "60"],
  ["10", "20", "30", "40", "50", "60", "80", "100"],
  ["10", "20", "30", "40", "50", "60", "80", "100"],
  ["10", "20", "30", "40", "50", "60", "80", "100"],
  ["10", "20", "30", "40", "50", "60", "80", "100"],
  ["10", "20", "30", "40", "50", "60", "80", "100"],
];

const SW25_HEAL_BIB = [
  ["20"],
  ["20"],
  ["20"],
  ["20"],
  ["20"],
  ["20"],
  ["20", "40"],
  ["20", "40"],
  ["20", "40"],
  ["20", "40"],
  ["20", "40"],
  ["20", "40"],
  ["20", "40", "100"],
  ["20", "40", "100"],
  ["20", "40", "100"],
  ["20", "40", "100"],
  ["20", "40", "100"],
];

// 戦闘特技の表示タグ付け用（未該当は [常] 扱い）
const SW25_FEAT_DECLARE_SET = new Set([
  "インファイトⅠ",
  "インファイトⅡ",
  "囮攻撃Ⅰ",
  "囮攻撃Ⅱ",
  "カード軽減",
  "楽素転換",
  "影矢",
  "カニングキャストⅠ",
  "カニングキャストⅡ",
  "かばうⅠ",
  "かばうⅡ",
  "斬り返しⅠ",
  "斬り返しⅡ",
  "牙折り",
  "クイックキャスト",
  "クリティカルキャストⅠ",
  "クリティカルキャストⅡ",
  "牽制攻撃Ⅰ",
  "牽制攻撃Ⅱ",
  "牽制攻撃Ⅲ",
  "高度な柔軟性",
  "シールドバッシュⅠ",
  "シールドバッシュⅡ",
  "シャドウステップⅠ",
  "シャドウステップⅡ",
  "シュアパフォーマー",
  "スキルフルプレイ",
  "捨て身攻撃Ⅰ",
  "捨て身攻撃Ⅱ",
  "捨て身攻撃Ⅲ",
  "先陣の才覚",
  "全力攻撃Ⅰ",
  "全力攻撃Ⅱ",
  "全力攻撃Ⅲ",
  "ダブルキャスト",
  "挑発攻撃Ⅰ",
  "挑発攻撃Ⅱ",
  "露払い",
  "ディフェンススタンス",
  "テイルスイングⅠ",
  "テイルスイングⅡ",
  "薙ぎ払いⅠ",
  "薙ぎ払いⅡ",
  "バイオレントキャストⅠ",
  "バイオレントキャストⅡ",
  "必殺攻撃Ⅰ",
  "必殺攻撃Ⅱ",
  "必殺攻撃Ⅲ",
  "魔法拡大／威力確実化",
  "魔法拡大／確実化",
  "魔法拡大／数",
  "魔法拡大／距離",
  "魔法拡大／時間",
  "魔法拡大／範囲",
  "魔法拡大すべて",
  "魔法収束",
  "魔法制御",
  "魔力撃",
  "マルチアクション",
  "鎧貫きⅠ",
  "鎧貫きⅡ",
  "鎧貫きⅢ",
  "乱撃Ⅰ",
  "乱撃Ⅱ",
  "双占瞳",
  "痛撃",
  "跳躍攻撃",
  "封印撃",
  "ヒットアンドアウェイ",
  "曲射",
  "デュアルアクション",
]);

const SW25_FEAT_MAIN_SET = new Set(["狙撃", "ワードブレイク"]);

function getSw25AutoFeats(skills) {
  // `skills` は { 技能名: レベル } の連想配列
  // ここで「自動習得特技」を機械的に算出する
  const magicSkillNames = SW25_SKILL_MASTER.filter((s) => s.isMagic).map(
    (s) => s.name,
  );

  return SW25_AUTO_FEAT_RULES.filter((rule) => {
    if (rule.anyMagic) {
      return magicSkillNames.some(
        (name) => (skills[name] || 0) >= rule.anyMagic,
      );
    }
    if (rule.anyOf) {
      return rule.anyOf.some((c) => (skills[c.skill] || 0) >= c.level);
    }
    return (skills[rule.skill] || 0) >= rule.level;
  }).map((rule) => rule.feat);
}

function sw25Plus(v) {
  // 文字列連結で使うため、常に +N / -N の形に正規化
  const n = toInt(v, 0);
  return n >= 0 ? `+${n}` : `${n}`;
}

function sw25GetTableByLevel(table, level) {
  // SW2.5 の旧実装互換: テーブルは 1〜17 レベル想定
  // 17 を超えた場合も 17 段目を使う
  if (!Array.isArray(table) || level <= 0) return [];
  return table[Math.min(level, 17) - 1] || [];
}

function createSw25Commands(ctx) {
  // SW2.5 チャットパレット本体
  // 旧 [`js/sw_output.js`](js/sw_output.js:880)〜[`js/sw_output.js`](js/sw_output.js:1880)
  // 相当の処理を API 向けに再構築したもの
  const {
    skills,
    skillEntries,
    dex,
    agi,
    str,
    vit,
    int,
    mnd,
    dexB,
    agiB,
    strB,
    vitB,
    intB,
    mndB,
    advLv,
    lifeResist,
    mentalResist,
    evasion,
    move,
    senseiMod,
    mamonoChishikiMod,
    ejukaHitExtend,
    armsHitTokugi,
    armsMaryokuSum,
    mmTokugi,
    mm5,
    mm6,
    mm7,
    mm8,
    mm9,
    mm17,
    mm24,
    mm27,
    armsName,
    armsHit,
    armsDamage,
    armsCritical,
    armsIryoku,
    armsCate,
    esNames,
    jkNames,
    kgNames,
    hjNames,
    hoNames,
    selectedFeats,
    itemNames,
  } = ctx;

  const lv = (name) => toInt(skills[name], 0);
  const capLv = (name) => Math.min(lv(name), 17);
  const wizMin =
    lv("ソーサラー") > 0 && lv("コンジャラー") > 0
      ? Math.min(lv("ソーサラー"), lv("コンジャラー"))
      : 0;
  const B_DEX = "{器用B}";
  const B_AGI = "{敏捷B}";
  const B_STR = "{筋力B}";
  const B_VIT = "{生命B}";
  const B_INT = "{知力B}";
  const B_MND = "{精神B}";
  const S = (name) => `{${name}}`;
  const ownedItems = Array.isArray(itemNames) ? itemNames : [];
  const hasItem = (keyword) =>
    ownedItems.some((n) => String(n || "").includes(keyword));
  const tagFeat = (name) => {
    if (SW25_FEAT_MAIN_SET.has(name)) return `[主]《${name}》`;
    if (SW25_FEAT_DECLARE_SET.has(name)) return `[宣]《${name}》`;
    return `[常]《${name}》`;
  };

  const lines = [];
  lines.push("### ■非戦闘系・先制");
  lines.push(`2D+{冒険者レベル}+${B_DEX} 冒険者＋器用`);
  lines.push(`2D+{冒険者レベル}+${B_AGI} 冒険者＋敏捷`);
  lines.push(`2D+{冒険者レベル}+${B_STR} 冒険者＋筋力`);
  lines.push(`2D+{冒険者レベル}+${B_VIT} 冒険者＋生命`);
  lines.push(`2D+{冒険者レベル}+${B_INT} 冒険者＋知力`);
  lines.push(`2D+{冒険者レベル}+${B_MND} 冒険者＋精神`);
  if (lv("スカウト") > 0) {
    lines.push(`2D+${S("スカウト")}+${B_DEX} スカウト技巧`);
    lines.push(`2D+${S("スカウト")}+${B_AGI} スカウト運動`);
    lines.push(`2D+${S("スカウト")}+${B_INT} スカウト観察`);
    lines.push(
      `2D+${S("スカウト")}+${B_AGI}${sw25Plus(senseiMod)} スカウト先制力`,
    );
  }
  if (lv("レンジャー") > 0) {
    lines.push(`2D+${S("レンジャー")}+${B_DEX} レンジャー技巧`);
    lines.push(`2D+${S("レンジャー")}+${B_AGI} レンジャー運動`);
    lines.push(`2D+${S("レンジャー")}+${B_INT} レンジャー観察`);
  }
  if (lv("セージ") > 0)
    lines.push(
      `2D+${S("セージ")}+${B_INT}${sw25Plus(mamonoChishikiMod)} セージ知識`,
    );
  if (lv("バード") > 0) lines.push(`2D+${S("バード")}+${B_INT} バード知識`);
  if (lv("ライダー") > 0) {
    lines.push(`2D+${S("ライダー")}+${B_AGI} ライダー運動`);
    lines.push(`2D+${S("ライダー")}+${B_INT} ライダー知識`);
    lines.push(`2D+${S("ライダー")}+${B_INT} ライダー観察`);
    lines.push(
      `2D+${S("ライダー")}+${B_INT}${sw25Plus(mamonoChishikiMod)} ライダー魔物知識`,
    );
  }
  if (lv("アルケミスト") > 0)
    lines.push(`2D+${S("アルケミスト")}+${B_INT} アルケミスト知識`);
  if (lv("ジオマンサー") > 0)
    lines.push(`2D+${S("ジオマンサー")}+${B_INT} ジオマンサー観察`);
  if (lv("ウォーリーダー") > 0) {
    lines.push(
      `2D+${S("ウォーリーダー")}+${B_AGI}${sw25Plus(senseiMod)} ウォーリーダー先制力`,
    );
    lines.push(
      `2D+${S("ウォーリーダー")}+${B_INT}+1${sw25Plus(senseiMod)} ウォーリーダー先制力(軍師の知略)`,
    );
  }

  lines.push("");
  lines.push("### ■薬草");
  if (hasItem("救命草"))
    lines.push(`k10[13]+${S("レンジャー")}+${B_DEX} 〈救命草〉`);
  if (hasItem("救難草"))
    lines.push(`k50[13]+${S("レンジャー")}+${B_DEX} 〈救難草〉`);
  if (hasItem("魔香草"))
    lines.push(`k0[13]+${S("レンジャー")}+${B_DEX} 〈魔香草〉`);
  if (hasItem("魔海草"))
    lines.push(`k10[13]+${S("レンジャー")}+${B_DEX} 〈魔海草〉`);
  if (hasItem("ヒーリングポーション"))
    lines.push(`k20[13]+${S("レンジャー")}+${B_INT} 〈ヒーリングポーション〉`);
  if (hasItem("ヒーリングポーション+1"))
    lines.push(
      `k20[13]+${S("レンジャー")}+${B_INT}+1 〈ヒーリングポーション+1〉`,
    );
  if (hasItem("トリートポーション"))
    lines.push(`k30[13]+${S("レンジャー")}+${B_INT} 〈トリートポーション〉`);
  if (hasItem("魔香水"))
    lines.push(`k0[13]+${S("レンジャー")}+${B_INT} 〈魔香水〉`);

  lines.push("");
  lines.push("### ■宣言特技");
  const featLines = (Array.isArray(selectedFeats) ? selectedFeats : [])
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .map(tagFeat);
  if (featLines.length) featLines.forEach((f) => lines.push(f));
  else lines.push("[宣]《魔法拡大／数》");

  lines.push("");
  lines.push("### ■技能判定");
  if (lv("バード") > 0) {
    lines.push(
      `2D+${S("バード")}+${B_MND}${sw25Plus(ejukaHitExtend)} 呪歌演奏`,
    );
    [10, 20, 30].forEach((k) => {
      if ((k === 20 && lv("バード") < 5) || (k === 30 && lv("バード") < 10))
        return;
      lines.push(
        `k${k}[10]+${S("バード")}+${B_MND}${sw25Plus(ejukaHitExtend)} ダメージ／呪歌`,
      );
      lines.push(
        `k${k}[10]+${S("バード")}+${B_MND}${sw25Plus(ejukaHitExtend)}H+0 半減／呪歌`,
      );
    });
    [0, 10, 20, 30, 40].forEach((k, idx) => {
      if (idx >= 3 && lv("バード") < 5) return;
      if (k === 40 && lv("バード") < 10) return;
      lines.push(
        `k${k}[13]+${S("バード")}+${B_MND}${sw25Plus(ejukaHitExtend)} 回復量／呪歌`,
      );
    });
  }
  if (lv("アルケミスト") > 0) lines.push(`2D+${S("アルケミスト")} 賦術`);

  lines.push("");
  lines.push("### ■魔法系");
  lines.push("//魔力修正=0");
  lines.push("//行使修正=0");
  lines.push("//魔法C=10");
  lines.push("//魔法D修正=0");
  lines.push("//回復量修正=0");

  for (let i = 0; i < armsName.length; i++) {
    const name = (armsName[i] || "").trim();
    if (!name) continue;
    const hit = toInt(armsHit[i], 0);
    const dam = toInt(armsDamage[i], 0);
    const cri = toInt(armsCritical[i], 12);
    const rate = toInt(armsIryoku[i], 0);
    const cate = (armsCate[i] || "").trim();
    if (!cate) continue;
    lines.push(`2D+${hit} ${name}命中`);
    if (cate === "ガン") {
      sw25GetTableByLevel(SW25_DAM_BULLET, capLv("マギテック")).forEach((k) => {
        lines.push(`k${k}[${cri}]+${dam} ${name}ダメージ`);
      });
      sw25GetTableByLevel(SW25_HEAL_BULLET, capLv("マギテック")).forEach(
        (k) => {
          lines.push(`k${k}[13]+${dam} ${name}回復量`);
        },
      );
    } else {
      lines.push(`k${rate}@${cri}+${dam} ${name}ダメージ`);
    }
  }

  const addMagicSet = (title, skillName, level, mmx, damTable, healTable) => {
    if (level <= 0) return;
    const lvVar = S(skillName);
    lines.push(
      `2D+${lvVar}+${B_INT}+{魔力修正}+{行使修正}${sw25Plus(mmx)} ${title}行使`,
    );
    sw25GetTableByLevel(damTable, level).forEach((k) => {
      lines.push(
        `k${k}[({魔法C})]+${lvVar}+${B_INT}+{魔力修正}+{魔法D修正} ダメージ／${title}`,
      );
      lines.push(
        `hk${k}[13]+${lvVar}+${B_INT}+{魔力修正}+{魔法D修正} 半減／${title}`,
      );
    });
    sw25GetTableByLevel(healTable, level).forEach((k) => {
      lines.push(`k${k}[13]+${lvVar}+${B_INT}+{魔力修正}+{回復量修正} 回復量`);
    });
    lines.push("");
  };

  addMagicSet(
    "真語魔法",
    "ソーサラー",
    capLv("ソーサラー"),
    mm5,
    SW25_DAM_SOR,
    [],
  );
  addMagicSet(
    "操霊魔法",
    "コンジャラー",
    capLv("コンジャラー"),
    mm6,
    SW25_DAM_CON,
    SW25_HEAL_CON,
  );
  addMagicSet(
    "神聖魔法",
    "プリースト",
    capLv("プリースト"),
    mm7,
    SW25_DAM_PRI,
    SW25_HEAL_PRI,
  );
  addMagicSet(
    "魔動機術",
    "マギテック",
    capLv("マギテック"),
    mm9,
    SW25_DAM_MAG,
    SW25_HEAL_MAG,
  );
  addMagicSet(
    "妖精魔法",
    "フェアリーテイマー",
    capLv("フェアリーテイマー"),
    mm8,
    SW25_DAM_FAI,
    [],
  );
  addMagicSet(
    "森羅魔法",
    "ドルイド",
    capLv("ドルイド"),
    mm24,
    SW25_DAM_DRU,
    [],
  );
  sw25GetTableByLevel(SW25_PHY_DRU, capLv("ドルイド")).forEach((k) => {
    lines.push(
      `Dru[${k}]+{ドルイド}+${B_INT}${sw25Plus(armsMaryokuSum)}${sw25Plus(mmTokugi)}${sw25Plus(mm24)} ダメージ／森羅魔法`,
    );
  });
  if (capLv("ドルイド") >= 2)
    lines.push("k10@13 【ナチュラルパワー】／森羅魔法");
  if (capLv("ドルイド") >= 12)
    lines.push("k30@13 【ナチュラルパワーⅡ】／森羅魔法");

  addMagicSet(
    "召異魔法",
    "デーモンルーラー",
    capLv("デーモンルーラー"),
    mm17,
    SW25_DAM_DEM,
    [],
  );
  addMagicSet(
    "奈落魔法",
    "アビスゲイザー",
    capLv("アビスゲイザー"),
    mm27,
    SW25_DAM_ABYSS,
    SW25_HEAL_ABYSS,
  );
  addMagicSet(
    "秘奥魔法",
    "ビブリオマンサー",
    capLv("ビブリオマンサー"),
    0,
    SW25_DAM_BIB,
    SW25_HEAL_BIB,
  );

  if (wizMin > 0) {
    lines.push(`2D+{ウィザード}+${B_INT}+{魔力修正}+{行使修正} 深智魔法行使`);
    sw25GetTableByLevel(SW25_DAM_WIZ, wizMin).forEach((k) => {
      lines.push(
        `k${k}[({魔法C})]+{ウィザード}+${B_INT}+{魔力修正}+{魔法D修正} ダメージ／深智魔法`,
      );
      lines.push(
        `hk${k}[13]+{ウィザード}+${B_INT}+{魔力修正}+{魔法D修正} 半減／深智魔法`,
      );
    });
    lines.push("");
  }

  lines.push("### ■武器攻撃系");
  lines.push("//命中修正=0");
  lines.push("//C修正=0");
  lines.push("//追加D修正=0");
  lines.push("//必殺効果=0");
  lines.push("//クリレイ=0");
  for (let i = 0; i < armsName.length; i++) {
    const name = (armsName[i] || "").trim();
    if (!name) continue;
    const hit = toInt(armsHit[i], 0);
    const dam = toInt(armsDamage[i], 0);
    const cri = toInt(armsCritical[i], 12);
    const rate = toInt(armsIryoku[i], 0);
    const cate = (armsCate[i] || "").trim();
    lines.push(
      `2D+${hit}+{命中修正} 命中力／${name}${cate ? `〈${cate}〉` : ""}`,
    );
    lines.push(
      `k${rate || 0}[(${cri}+{C修正})]+${dam}+{追加D修正}{出目修正} ダメージ／${name}`,
    );
  }
  lines.push("//出目修正=$+{クリレイ}#{必殺効果}");

  lines.push("");
  lines.push("### ■抵抗回避");
  lines.push("//生命抵抗修正=0");
  lines.push("//精神抵抗修正=0");
  lines.push("//回避修正=0");
  lines.push(`2D+${lifeResist}+{生命抵抗修正} 生命抵抗力`);
  lines.push(`2D+${mentalResist}+{精神抵抗修正} 精神抵抗力`);
  lines.push(`2D+${evasion}+{回避修正} 回避力`);

  lines.push("");
  lines.push("### ■代入パラメータ");
  if (wizMin > 0) lines.push(`//ウィザード=${wizMin}`);

  const appendNamedSection = (title, list) => {
    const valid = list.map((x) => String(x || "").trim()).filter(Boolean);
    if (!valid.length) return;
    lines.push("");
    lines.push(`＝＝＝＝＝${title}＝＝＝＝＝`);
    valid.forEach((v) => lines.push(v));
  };
  appendNamedSection("練技", esNames);
  appendNamedSection("呪歌", jkNames);
  appendNamedSection("騎芸", kgNames);
  appendNamedSection("賦術", hjNames);
  appendNamedSection("鼓咆／陣率", hoNames);

  return lines.join("\n");
}

function createComboPaletteFromData(comboData) {
  if (!comboData || !Array.isArray(comboData.combos)) return "";

  const allEffects = [
    ...(Array.isArray(comboData.effects) ? comboData.effects : []),
    ...(Array.isArray(comboData.easyEffects) ? comboData.easyEffects : []),
  ];

  const skillToAbilityMap = {
    白兵: "肉体",
    射撃: "感覚",
    RC: "精神",
    交渉: "社会",
  };

  const normalizeSkillName = (v) => {
    const s = String(v || "")
      .replace(/[〈〉【】]/g, "")
      .replace(/\s+/g, "")
      .trim();
    if (!s || s === "-" || s === "シンドローム") return "-";
    if (s.includes("白兵")) return "白兵";
    if (s.includes("射撃")) return "射撃";
    if (s.includes("RC")) return "RC";
    if (s.includes("交渉")) return "交渉";
    return s;
  };

  const pickLevel = (src) => {
    const lv = Number(src && src.level);
    return Number.isFinite(lv) && lv > 0 ? lv : 1;
  };

  const pickDiceFormula = (src, fallbackSkill = "白兵") => {
    const normalizedSkill = normalizeSkillName(fallbackSkill);
    const skill = normalizedSkill === "-" ? "白兵" : normalizedSkill;
    const ability = skillToAbilityMap[skill] || "肉体";
    const raw = String(
      (src &&
        (src.diceFormulaTextarea ||
          src.diceFormulaTextArea ||
          src.dice_formula_textarea ||
          src.diceFormula ||
          src.dice_formula)) ||
        "",
    ).trim();
    return raw || `({${ability}}+{侵蝕率D})DX+{${skill}}`;
  };

  const buildDiceFormulaFromComputed = (combo, skill, computed) => {
    const baseSkill = normalizeSkillName(skill);
    const skillForFormula = baseSkill === "-" ? "" : baseSkill;
    const attributeName =
      (combo && combo.baseAbility && combo.baseAbility.statOverride) ||
      skillToAbilityMap[baseSkill] ||
      "肉体";

    const finalDice = Number(computed && computed.totalDice) || 0;
    const finalCrit = Number(computed && computed.finalCrit) || 10;
    const finalAchieve = Number(computed && computed.totalAchieve) || 0;

    let diceFormula = `({${attributeName}}+{侵蝕率D}${
      finalDice >= 0 ? "+" : ""
    }${finalDice})DX${finalCrit}`;

    if (skillForFormula) {
      diceFormula += `+{${skillForFormula}}`;
    }
    if (finalAchieve !== 0) {
      diceFormula += `${finalAchieve >= 0 ? "+" : ""}${finalAchieve}`;
    }
    diceFormula += ` ◆${(combo && combo.name) || "コンボ"}`;
    return diceFormula;
  };

  const pickVal = (v, defVal = "-") => {
    if (v === null || v === undefined) return defVal;
    const s = String(v).trim();
    return s ? s : defVal;
  };

  const normalizeTiming = (t) => {
    if (!t) return "-";
    let norm = String(t).replace(/[\s　]+/g, "");
    if (norm === "リアクション") return "リアクション";
    norm = norm.replace("アクション", "").replace("プロセス", "");
    if (norm.includes("メジャー") && norm.includes("リア")) {
      return "メジャー／リア";
    }
    return norm || "-";
  };

  const getPriorityValue = (sources, prop, defaultValue = "-") => {
    const priorityOrder = {
      timing: [
        "メジャー／リア",
        "メジャー",
        "リアクション",
        "マイナー",
        "セットアップ",
        "イニシアチブ",
        "クリンナップ",
        "オート",
        "常時",
      ],
      range: ["視界", "武器", "至近"],
      target: [
        "自身",
        "単体",
        "2体",
        "3体",
        "[LV+1]体",
        "範囲(選択)",
        "範囲",
        "シーン(選択)",
        "シーン",
      ],
    };

    for (const p of priorityOrder[prop] || []) {
      const found = sources.some((s) => {
        const raw = s && s[prop];
        const val =
          prop === "timing" ? normalizeTiming(raw) : String(raw || "");
        return val === p;
      });
      if (found) return p;
    }

    const firstValid = sources.find((s) => {
      if (!s) return false;
      const raw = s[prop];
      if (raw === null || raw === undefined) return false;
      const v = String(raw).trim();
      return v && v !== "-";
    });
    if (!firstValid) return defaultValue;
    return prop === "timing"
      ? normalizeTiming(firstValid[prop])
      : String(firstValid[prop]);
  };

  const normalizeSkill = (combo, mainEffect) => {
    return normalizeSkillName(
      (combo && combo.baseAbility && combo.baseAbility.skill) ||
        (mainEffect && mainEffect.skill) ||
        "-",
    );
  };

  const evaluateDiceString = (str, level = 0) => {
    if (typeof str !== "string" && typeof str !== "number") {
      return { dice: 0, fixed: 0 };
    }
    let expression = String(str).trim();
    if (expression === "") {
      return { dice: 0, fixed: 0 };
    }
    expression = expression.replace(/lv/gi, String(level));
    try {
      if (!/^[0-9dD\s\-+*/().]+$/.test(expression)) {
        if (!/[dD]/.test(expression)) {
          const fixedValue = Number(expression);
          return { dice: 0, fixed: Number.isNaN(fixedValue) ? 0 : fixedValue };
        }
      }
      expression = String(new Function(`return ${expression}`)());
    } catch (_) {}

    let dice = 0;
    let fixed = 0;
    const diceMatch = expression.match(/(\d+)d/i);
    if (diceMatch) {
      dice = parseInt(diceMatch[1], 10);
      expression = expression.replace(/(\d+)d/i, "");
    }
    expression = expression.replace(/\s/g, "");
    if (expression) {
      try {
        const remainingValue = new Function(`return ${expression}`)();
        if (!Number.isNaN(remainingValue)) fixed = Number(remainingValue) || 0;
      } catch (_) {}
    }
    return { dice, fixed };
  };

  const formatDiceString = ({ dice, fixed }) => {
    const d = Number(dice) || 0;
    const f = Number(fixed) || 0;
    const dicePart = d > 0 ? `${d}D` : "";
    const fixedPart = f > 0 ? `${f}` : f < 0 ? `${f}` : "";
    if (dicePart && fixedPart) {
      return f > 0 ? `${dicePart}+${fixedPart}` : `${dicePart}${fixedPart}`;
    }
    return dicePart || fixedPart || "0";
  };

  const getRelevantEffects = (combo) => {
    const names = Array.isArray(combo && combo.effectNames)
      ? combo.effectNames
      : [];
    return names
      .map((nameOrObj) => {
        const effectName =
          typeof nameOrObj === "string"
            ? nameOrObj
            : String(nameOrObj && nameOrObj.name ? nameOrObj.name : "");
        return allEffects.find((e) => e && e.name === effectName);
      })
      .filter(Boolean);
  };

  const getRelevantItems = (combo) => {
    const items = Array.isArray(comboData.items) ? comboData.items : [];
    const names = Array.isArray(combo && combo.itemNames)
      ? combo.itemNames
      : [];
    return names
      .map((nameOrObj) => {
        const itemName =
          typeof nameOrObj === "string"
            ? nameOrObj
            : String(nameOrObj && nameOrObj.name ? nameOrObj.name : "");
        const item = items.find((i) => i && i.name === itemName);
        return item ? { ...item, sourceType: "item" } : null;
      })
      .filter(Boolean);
  };

  const getAllSelectedSources = (combo) => {
    const effects = getRelevantEffects(combo).map((e) => ({
      ...e,
      sourceType: "effect",
    }));
    const items = getRelevantItems(combo);
    const merged = [...effects, ...items];
    const seen = new Set();
    return merged.filter((s) => {
      const key = `${s.sourceType}:${s.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const calcValueResult = (valueKey, sources, comboLevelBonus) => {
    let totalDice = 0;
    let totalFixed = 0;
    sources.forEach((source) => {
      if (!source || !source.values || !source.values[valueKey]) return;
      const effectiveLevel =
        (Number(source.level) || 0) + (comboLevelBonus || 0);

      if (valueKey === "dice") {
        const baseDice = Number(source.values.dice.base) || 0;
        const perLevelDice = Number(source.values.dice.perLevel) || 0;
        totalDice += baseDice + effectiveLevel * perLevelDice;
        return;
      }

      const baseParsed = evaluateDiceString(
        String(source.values[valueKey].base || "0"),
        effectiveLevel,
      );
      const perLevelParsed = evaluateDiceString(
        String(source.values[valueKey].perLevel || "0"),
        effectiveLevel,
      );
      totalDice += baseParsed.dice + effectiveLevel * perLevelParsed.dice;
      totalFixed += baseParsed.fixed + effectiveLevel * perLevelParsed.fixed;
    });

    return { dice: totalDice, fixed: totalFixed };
  };

  const calculateFromValues = (combo, sourceList) => {
    const comboLevelBonus = Number(combo && combo.comboLevelBonus) || 0;
    const relevantEffects = sourceList.filter((s) => s.sourceType === "effect");
    const relevantItems = sourceList.filter((s) => s.sourceType === "item");

    const diceResult = calcValueResult(
      "dice",
      relevantEffects,
      comboLevelBonus,
    );
    const achieveResult = calcValueResult(
      "achieve",
      relevantEffects,
      comboLevelBonus,
    );
    const atkResult = calcValueResult("attack", sourceList, comboLevelBonus);
    const accuracyResult = calcValueResult(
      "accuracy",
      relevantItems,
      comboLevelBonus,
    );

    let critTotal = 10;
    sourceList.forEach((source) => {
      if (!source || !source.values || !source.values.crit) return;
      const base = Number(source.values.crit.base) || 0;
      if (base === 0) return;
      const effectiveLevel =
        source.level !== undefined
          ? (Number(source.level) || 0) + comboLevelBonus
          : 0;
      const perLevel = Number(source.values.crit.perLevel) || 0;
      const min = Number(source.values.crit.min) || 2;
      const value = Math.max(base - effectiveLevel * perLevel, min);
      if (value < critTotal) critTotal = value;
    });

    const weaponAtk = evaluateDiceString(
      String((combo && combo.atk_weapon) || "0"),
      comboLevelBonus,
    );
    const totalAtk = {
      dice: weaponAtk.dice + atkResult.dice,
      fixed: weaponAtk.fixed + atkResult.fixed,
    };

    return {
      totalDice:
        (Number(diceResult.dice) || 0) + (Number(accuracyResult.dice) || 0),
      totalAchieve:
        (Number(achieveResult.fixed) || 0) +
        (Number(accuracyResult.fixed) || 0),
      totalAtk: formatDiceString(totalAtk),
      finalCrit: critTotal,
    };
  };

  const buildFromCombo = (combo, preferCompositionText = "") => {
    if (!combo || !combo.name) return "";

    const relevantEffects = getRelevantEffects(combo);
    const sourceList =
      Array.isArray(combo.allSelectedSources) && combo.allSelectedSources.length
        ? combo.allSelectedSources
        : getAllSelectedSources(combo);

    const computed = calculateFromValues(combo, sourceList);
    const compositionText =
      String(preferCompositionText || "").trim() ||
      relevantEffects.map((e) => `《${e.name}》Lv${pickLevel(e)}`).join("+");
    const flavorText = combo.flavor ? `『${combo.flavor}』` : "";
    const timingFromSources = getPriorityValue(sourceList, "timing", "-");
    const rangeFromSources = getPriorityValue(sourceList, "range", "-");
    const targetFromSources = getPriorityValue(sourceList, "target", "-");

    const mainEffect =
      sourceList.find((e) =>
        ["メジャー", "リアクション", "メジャー／リア"].includes(
          normalizeTiming(e && e.timing),
        ),
      ) || sourceList[0];

    const isMajorAction = [
      "メジャー",
      "リアクション",
      "メジャー／リア",
    ].includes(timingFromSources);
    const skill = normalizeSkill(combo, mainEffect);
    const manualDiceFormula = pickDiceFormula(
      combo,
      skill === "-" ? "白兵" : skill,
    );
    const computedDiceFormula = buildDiceFormulaFromComputed(
      combo,
      skill,
      computed,
    );
    const diceFormula =
      String(
        combo && combo.diceFormulaTextarea ? combo.diceFormulaTextarea : "",
      ).trim() ||
      String(
        combo && combo.diceFormulaTextArea ? combo.diceFormulaTextArea : "",
      ).trim() ||
      String(
        combo && combo.dice_formula_textarea ? combo.dice_formula_textarea : "",
      ).trim() ||
      computedDiceFormula ||
      manualDiceFormula;

    const totalCostFromSources = sourceList.reduce(
      (acc, s) => acc + (Number((s && s.cost) || 0) || 0),
      0,
    );

    const timingFinal =
      pickVal(combo.timing, "-") !== "-" ? combo.timing : timingFromSources;
    const rangeFinal =
      pickVal(combo.range, "-") !== "-" ? combo.range : rangeFromSources;
    const targetFinal =
      pickVal(combo.target, "-") !== "-" ? combo.target : targetFromSources;
    const difficultyFinal =
      pickVal(mainEffect && mainEffect.difficulty, "-") !== "-"
        ? mainEffect.difficulty
        : isMajorAction
          ? "自動"
          : pickVal(sourceList[0] && sourceList[0].difficulty, "自動");
    const costFinal =
      pickVal(combo.totalCost || combo.cost, "-") !== "-"
        ? combo.totalCost || combo.cost
        : totalCostFromSources;

    const details = [
      `侵蝕値:${pickVal(costFinal, "0")}`,
      `タイミング:${pickVal(timingFinal)}`,
      `技能:${pickVal(skill)}`,
      `難易度:${pickVal(difficultyFinal, "自動")}`,
      `対象:${pickVal(targetFinal)}`,
      `射程:${pickVal(rangeFinal)}`,
      `攻撃力:${pickVal(combo.totalAtk || combo.attack || computed.totalAtk)}`,
      `達成値:${pickVal(
        combo.totalAchieve || combo.achieve || computed.totalAchieve,
        "0",
      )}`,
      `C値:${pickVal(combo.finalCrit || combo.critical || computed.finalCrit, "10")}`,
    ].join("　");

    return [`◆${combo.name}`, compositionText, flavorText, details, diceFormula]
      .filter(Boolean)
      .join("\n");
  };

  if (
    Array.isArray(comboData.processedCombos) &&
    comboData.processedCombos.length
  ) {
    const p = ["//▼コンボデータ"];
    comboData.processedCombos.forEach((pc) => {
      if (!pc) return;
      const text = buildFromCombo(pc, pc.compositionText || "");
      if (text) {
        p.push(text);
        p.push("");
      }
    });
    return p.join("\n").trim();
  }

  let palette = "//▼コンボデータ\n";
  for (const combo of comboData.combos) {
    const text = buildFromCombo(combo);
    if (!text) continue;
    palette += `${text}\n\n`;
  }

  return palette.trim();
}

async function getComboPaletteByUrl(sheetUrl) {
  const key = normalizeSheetUrl(sheetUrl);
  if (!key) return "";
  if (comboPaletteCache.has(key)) return comboPaletteCache.get(key);

  try {
    const u = new URL(DX3_COMBO_GAS_WEBAPP_URL);
    u.searchParams.set("id", key);

    const res = await fetch(u.toString(), {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      comboPaletteCache.set(key, "");
      return "";
    }

    const json = await res.json();
    if (!json || json.status !== "success" || !json.data) {
      comboPaletteCache.set(key, "");
      return "";
    }

    const palette = createComboPaletteFromData(json.data);
    comboPaletteCache.set(key, palette || "");
    return palette || "";
  } catch (_) {
    comboPaletteCache.set(key, "");
    return "";
  }
}

async function fetchRawHtml(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
  });
  if (!res.ok) {
    throw new Error(`URLへのアクセスに失敗したぞ (HTTP ${res.status})`);
  }
  return await res.text();
}

async function fetchViaPhantom(url) {
  const key = process.env.PHANTOMJSCLOUD_ID;
  if (!key) {
    throw new Error(
      "PHANTOMJSCLOUD_ID が未設定のためJSレンダリング取得できない。",
    );
  }
  const option = { url, renderType: "HTML", outputAsJson: true };
  const payload = encodeURIComponent(JSON.stringify(option));
  const apiUrl = `https://phantomjscloud.com/api/browser/v2/${key}/?request=${payload}`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error(`PhantomJSCloud API Error: HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json && json.content && json.content.data) return json.content.data;
  throw new Error("PhantomJSCloudからのHTML取得に失敗しました。");
}

async function fetchAndIdentifySystem(url) {
  const lower = String(url || "").toLowerCase();

  // URLベースの判定を優先（誤検出防止）
  if (
    lower.includes("swordworld") ||
    lower.includes("sw2") ||
    lower.includes("sw25")
  ) {
    const html = await fetchRawHtml(url);
    return { system: "SW25", html };
  }

  if (
    lower.includes("nechronica") ||
    lower.includes("necro") ||
    lower.includes("nechronicle")
  ) {
    const html = await fetchRawHtml(url);
    if (html.includes("Power_name[]") || html.includes("V_Power_hantei[]")) {
      return { system: "Nechronica", html };
    }
    try {
      return { system: "Nechronica", html: await fetchViaPhantom(url) };
    } catch (_) {
      return { system: "Nechronica", html };
    }
  }

  if (lower.includes("satasupe") || lower.includes("appspot.com")) {
    let html;
    try {
      html = await fetchViaPhantom(url);
    } catch (_) {
      html = await fetchRawHtml(url);
    }
    return { system: "Satasupe", html };
  }

  const html = await fetchRawHtml(url);
  if (html.includes("ダブルクロス")) return { system: "DX3", html };

  // ネクロニカは専用フォーム要素を必須条件にして誤判定を防ぐ
  if (
    html.includes("ネクロニカ") &&
    (html.includes("Power_name[]") || html.includes("V_Power_hantei[]"))
  ) {
    if (html.includes("Power_name[]") || html.includes("V_Power_hantei[]")) {
      return { system: "Nechronica", html };
    }
    try {
      return { system: "Nechronica", html: await fetchViaPhantom(url) };
    } catch (_) {
      return { system: "Nechronica", html };
    }
  }

  if (html.includes("ソードワールド") || html.includes("swordworld")) {
    return { system: "SW25", html };
  }
  return { system: "Unknown", html };
}

function getNameBySystem(html, system) {
  let name = parseTitle(html);
  if (!name) return "(名前取得失敗)";
  if (system === "DX3" || system === "Nechronica" || system === "SW25") {
    name = name.replace(/\s*-\s*キャラクター保管所/, "");
  } else if (system === "Satasupe") {
    name = name.replace(/\s*サタスペキャラクターシート/, "").trim();
  }
  return name || "(名前取得失敗)";
}

function getEffectDX(html) {
  const names = pickAllByName(html, "effect_name[]");
  const levels = pickAllByName(html, "effect_lv[]");
  const hyou = [
    "★",
    "1",
    "2",
    "3",
    "4",
    "5",
    "○",
    "1",
    "2",
    "3",
    "◇",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];
  const formatted = levels.map((lv) => {
    const idx = parseInt(lv, 10);
    if (!Number.isNaN(idx) && idx >= 0 && idx < hyou.length) return hyou[idx];
    return lv;
  });
  return [names, formatted];
}

function createDxChapale() {
  return [
    "【ステータス】肉体:{肉体} 感覚:{感覚} 精神:{精神} 社会:{社会}",
    "({肉体}+{侵蝕率D})DX+{白兵} 【肉体】〈白兵〉",
    "({感覚}+{侵蝕率D})DX+{射撃} 【感覚】〈射撃〉",
    "({精神}+{侵蝕率D})DX+{RC} 【精神】〈RC〉",
    "({社会}+{侵蝕率D})DX+{交渉} 【社会】〈交渉〉",
    "1D リザレクト",
  ].join("\n");
}

function createDxRoice(html) {
  const names = pickAllByName(html, "roice_name[]").filter(
    (v) => v && !v.includes("checkbox"),
  );
  const types = pickAllByName(html, "roice_type[]");
  let roiceMemo = "😀 ロイス/😡 タイタス/💥 Dロイス/💕 Sロイス\n";
  let roiceCount = 0;
  let roiceMax = 7;
  names.forEach((name, i) => {
    roiceCount += 1;
    const t = types[i] || "0";
    let icon = "😀";
    if (t === "1") {
      icon = "💥";
      roiceMax -= 1;
    } else if (t === "2") {
      icon = "💕";
    }
    roiceMemo += `${i + 1}. ${icon}：${name}\n`;
  });
  return { memo: roiceMemo, value: roiceCount, max: roiceMax };
}

async function getDataDX(html, url, img, opt, additionalPalette, comboPalette) {
  const data = {
    name: pickInputById(
      html,
      "pc_name",
      parseTitle(html).replace(/\s*-\s*キャラクター保管所/, ""),
    ),
    initiative: toInt(pickInputById(html, "NP7", "0")),
    hp: toInt(pickInputById(html, "NP5", "0")),
    erosion: toInt(pickInputById(html, "NP6", "0")),
    body: pickInputById(html, "NP1", "0"),
    sense: pickInputById(html, "NP2", "0"),
    mind: pickInputById(html, "NP3", "0"),
    social: pickInputById(html, "NP4", "0"),
  };

  const roice = createDxRoice(html);
  let commands = opt[1] ? createDxChapale() : "";
  if (comboPalette) commands += (commands ? "\n" : "") + comboPalette;
  if (additionalPalette) commands += (commands ? "\n" : "") + additionalPalette;

  const memo = opt[0]
    ? `コードネーム：${pickInputById(html, "pc_codename", "")}\nワークス：${pickInputByName(html, "works_name", "")}　カヴァー：${pickInputByName(html, "cover_name", "")}\n${roice.memo}`
    : "";

  const out = {
    kind: "character",
    data: {
      name: data.name,
      memo,
      initiative: data.initiative,
      externalUrl: url,
      status: [
        { label: "HP", value: data.hp, max: data.hp },
        { label: "侵蝕率", value: data.erosion, max: 100 },
        { label: "ロイス", value: roice.value, max: roice.max },
      ],
      params: [
        { label: "肉体", value: data.body },
        { label: "感覚", value: data.sense },
        { label: "精神", value: data.mind },
        { label: "社会", value: data.social },
      ],
      commands,
    },
  };
  if (img) out.data.iconUrl = img;
  return out;
}

function getDataSW25(html, url, img) {
  // SW2.5 変換エントリポイント
  // 1) シート値を抽出
  // 2) params/memo を生成
  // 3) [`createSw25Commands()`](api/koma-maker.js:1) でチャットパレット生成
  const pick = (regexList, defVal = "") => {
    for (const r of regexList) {
      const m = html.match(r);
      if (m && m[1] !== undefined) return decodeHtml(m[1]);
    }
    return defVal;
  };
  const pickNum = (regexList, defVal = 0) => toInt(pick(regexList, ""), defVal);

  const name =
    getNameBySystem(html, "SW25") ||
    pick([/name="pc_name"[^>]*value="([^"]*)"/i], "PC");
  const shuzoku = pick([/name="shuzoku_name"[^>]*value="([^"]*)"/i], "");
  const sex = pick([/name="sex"[^>]*value="([^"]*)"/i], "");
  const age = pick([/name="age"[^>]*value="([^"]*)"/i], "");
  const hp = pickNum([/name="HP"[^>]*value="([^"]*)"/i], 0);
  const mp = pickNum([/name="MP"[^>]*value="([^"]*)"/i], 0);
  const def = pickNum([/name="bougo"[^>]*value="([^"]*)"/i], 0);
  const lifeResist = pickNum([/name="life_resist"[^>]*value="([^"]*)"/i], 0);
  const mentalResist = pickNum(
    [/name="mental_resist"[^>]*value="([^"]*)"/i],
    0,
  );
  const evasion = pickNum([/name="kaihi"[^>]*value="([^"]*)"/i], 0);
  const move = pickNum([/name="ido"[^>]*value="([^"]*)"/i], 0);
  // SW2.5 は先制力ではなく移動力(id=ido)を initiative に採用する
  const initiative = move;

  const dexB = pickNum([/name="NB1"[^>]*value="([^"]*)"/i], 0);
  const agiB = pickNum([/name="NB2"[^>]*value="([^"]*)"/i], 0);
  const strB = pickNum([/name="NB3"[^>]*value="([^"]*)"/i], 0);
  const vitB = pickNum([/name="NB4"[^>]*value="([^"]*)"/i], 0);
  const intB = pickNum([/name="NB5"[^>]*value="([^"]*)"/i], 0);
  const mndB = pickNum([/name="NB6"[^>]*value="([^"]*)"/i], 0);

  const nWaza = pickNum([/name="N_waza"[^>]*value="([^"]*)"/i], 0);
  const nKarada = pickNum([/name="N_karada"[^>]*value="([^"]*)"/i], 0);
  const nKokoro = pickNum([/name="N_kokoro"[^>]*value="([^"]*)"/i], 0);
  const vNc1 = pickNum([/name="V_NC1"[^>]*value="([^"]*)"/i], 0);
  const vNc2 = pickNum([/name="V_NC2"[^>]*value="([^"]*)"/i], 0);
  const vNc3 = pickNum([/name="V_NC3"[^>]*value="([^"]*)"/i], 0);
  const vNc4 = pickNum([/name="V_NC4"[^>]*value="([^"]*)"/i], 0);
  const vNc5 = pickNum([/name="V_NC5"[^>]*value="([^"]*)"/i], 0);
  const vNc6 = pickNum([/name="V_NC6"[^>]*value="([^"]*)"/i], 0);
  const ns1 = pickNum([/name="NS1"[^>]*value="([^"]*)"/i], 0);
  const ns2 = pickNum([/name="NS2"[^>]*value="([^"]*)"/i], 0);
  const ns3 = pickNum([/name="NS3"[^>]*value="([^"]*)"/i], 0);
  const ns4 = pickNum([/name="NS4"[^>]*value="([^"]*)"/i], 0);
  const ns5 = pickNum([/name="NS5"[^>]*value="([^"]*)"/i], 0);
  const ns6 = pickNum([/name="NS6"[^>]*value="([^"]*)"/i], 0);
  const nm1 = pickNum([/name="NM1"[^>]*value="([^"]*)"/i], 0);
  const nm2 = pickNum([/name="NM2"[^>]*value="([^"]*)"/i], 0);
  const nm3 = pickNum([/name="NM3"[^>]*value="([^"]*)"/i], 0);
  const nm4 = pickNum([/name="NM4"[^>]*value="([^"]*)"/i], 0);
  const nm5 = pickNum([/name="NM5"[^>]*value="([^"]*)"/i], 0);
  const nm6 = pickNum([/name="NM6"[^>]*value="([^"]*)"/i], 0);

  const dex = nWaza + vNc1 + ns1 + nm1;
  const agi = nWaza + vNc2 + ns2 + nm2;
  const str = nKarada + vNc3 + ns3 + nm3;
  const vit = nKarada + vNc4 + ns4 + nm4;
  const int = nKokoro + vNc5 + ns5 + nm5;
  const mnd = nKokoro + vNc6 + ns6 + nm6;

  const skills = {};
  SW25_SKILL_MASTER.forEach(({ id, name }) => {
    const lv = pickNum([
      new RegExp(`name="V_GLv${id}"[^>]*value="([^"]*)"`, "i"),
      new RegExp(`name="GLv${id}"[^>]*value="([^"]*)"`, "i"),
    ]);
    if (lv > 0) skills[name] = lv;
  });
  const advLv = Object.keys(skills).reduce(
    (max, k) => Math.max(max, Number(skills[k]) || 0),
    0,
  );

  const selectedFeats = [];
  const featRe = /name="ST_name\[\]"[^>]*value="([^"]*)"/gi;
  let fm;
  while ((fm = featRe.exec(html)) !== null) {
    const feat = decodeHtml(fm[1]).trim();
    if (feat) selectedFeats.push(feat);
  }
  const autoFeats = getSw25AutoFeats(skills);

  const money = pickNum([/name="money"[^>]*value="([^"]*)"/i], 0);
  const itemNames = pickAllByName(html, "item_name[]").map((s) => s.trim());
  const itemNums = pickAllByName(html, "item_num[]").map((s) => toInt(s, 0));
  const itemMemos = pickAllByName(html, "item_memo[]").map((s) => s.trim());
  const items = [];
  for (let i = 0; i < itemNames.length; i++) {
    if (!itemNames[i]) continue;
    items.push({
      name: itemNames[i],
      num: itemNums[i] || 1,
      memo: itemMemos[i] || "",
    });
  }

  const skillEntries = [];
  SW25_SKILL_ORDER.forEach((n) => {
    if (skills[n]) skillEntries.push(`${n}：${skills[n]}`);
  });
  Object.keys(skills).forEach((n) => {
    if (!SW25_SKILL_ORDER.includes(n)) skillEntries.push(`${n}：${skills[n]}`);
  });

  // 旧実装で散らばっていた各種補正値・配列をまとめて渡す
  const commands = createSw25Commands({
    skills,
    skillEntries,
    dex,
    agi,
    str,
    vit,
    int,
    mnd,
    dexB,
    agiB,
    strB,
    vitB,
    intB,
    mndB,
    advLv,
    lifeResist,
    mentalResist,
    evasion,
    move,
    senseiMod: pickInputByName(html, "sensei_mod", "0"),
    mamonoChishikiMod: pickInputByName(html, "mamono_chishiki_mod", "0"),
    ejukaHitExtend: pickInputByName(html, "ejuka_hit_extend", "0"),
    armsHitTokugi: pickInputByName(html, "arms_hit_tokugi", "0"),
    armsMaryokuSum: pickInputByName(html, "arms_maryoku_sum", "0"),
    mmTokugi: pickInputByName(html, "MM_Tokugi", "0"),
    mm5: pickInputByName(html, "MM5", "0"),
    mm6: pickInputByName(html, "MM6", "0"),
    mm7: pickInputByName(html, "MM7", "0"),
    mm8: pickInputByName(html, "MM8", "0"),
    mm9: pickInputByName(html, "MM9", "0"),
    mm17: pickInputByName(html, "MM17", "0"),
    mm24: pickInputByName(html, "MM24", "0"),
    mm27: pickInputByName(html, "MM27", "0"),
    armsName: pickAllByName(html, "arms_name[]"),
    armsHit: pickAllByName(html, "arms_hit[]"),
    armsDamage: pickAllByName(html, "arms_damage[]"),
    armsCritical: pickAllByName(html, "arms_critical[]"),
    armsIryoku: pickAllByName(html, "arms_iryoku[]"),
    armsCate: pickAllByName(html, "arms_cate[]"),
    esNames: pickAllByName(html, "ES_name[]"),
    jkNames: pickAllByName(html, "JK_name[]"),
    kgNames: pickAllByName(html, "KG_name[]"),
    hjNames: pickAllByName(html, "HJ_name[]"),
    hoNames: pickAllByName(html, "HO_name[]"),
    selectedFeats,
    itemNames,
  });

  const memoParts = [];
  memoParts.push("PL：○○");
  memoParts.push(`種族：${shuzoku}　性別：${sex}　年齢：${age}`);
  memoParts.push("＝＝＝＝＝技能＝＝＝＝＝");
  memoParts.push((skillEntries.join(" ") || "") + " ");
  memoParts.push("＝＝＝＝＝選択習得の戦闘特技＝＝＝＝＝");
  memoParts.push((selectedFeats.join(" ") || "") + " ");
  memoParts.push("＝＝＝＝＝自動習得の戦闘特技＝＝＝＝＝");
  memoParts.push((autoFeats.join(" ") || "") + " ");
  memoParts.push("＝＝＝＝＝所持品＝＝＝＝＝");
  memoParts.push(`所持金:${money}G`);
  items.forEach((it) => {
    const line = `${it.name} ${it.num}個${it.memo ? ` ${it.memo}` : ""}`;
    memoParts.push(line.trim());
  });

  const params = [
    { label: "器用B", value: String(dexB) },
    { label: "敏捷B", value: String(agiB) },
    { label: "筋力B", value: String(strB) },
    { label: "生命B", value: String(vitB) },
    { label: "知力B", value: String(intB) },
    { label: "精神B", value: String(mndB) },
    { label: "冒険者レベル", value: String(advLv) },
    { label: "生命抵抗", value: String(lifeResist) },
    { label: "精神抵抗", value: String(mentalResist) },
    ...SW25_SKILL_ORDER.map((name2) => ({
      label: name2,
      value: String(skills[name2] || 0),
    })),
    { label: "回避", value: String(evasion) },
    { label: "移動力", value: String(move) },
  ].filter((p) => p.label === "回避" || p.value !== "0");

  const out = {
    kind: "character",
    data: {
      name,
      memo: `${memoParts.join("\n")}\n`,
      initiative,
      externalUrl: url,
      status: [
        { label: "HP", value: String(hp), max: String(hp) },
        { label: "MP", value: String(mp), max: String(mp) },
        { label: "防護点", value: String(def), max: String(def) },
      ],
      params,
      commands,
    },
  };
  if (img) out.data.iconUrl = img;
  return out;
}

function convertTim(x) {
  switch (String(x)) {
    case "0":
      return "オート";
    case "1":
      return "アクション";
    case "2":
      return "ジャッジ";
    case "3":
      return "ダメージ";
    case "4":
      return "ラピッド";
    default:
      return "";
  }
}

function getDataNC(html, url, img, opt, additionalPalette) {
  const names = pickAllByName(html, "Power_name[]");
  const positions = pickAllByName(html, "V_Power_hantei[]");
  const timings = pickAllByName(html, "V_Power_timing[]");
  const costs = pickAllByName(html, "Power_cost[]");
  const ranges = pickAllByName(html, "Power_range[]");
  const memos = pickAllByName(html, "Power_memo[]");

  const bui = [
    ["🟩【マニューバ名】 《タイミング / コスト / 射程》"],
    ["👧頭"],
    ["💪腕"],
    ["🧍胴"],
    ["🦵脚"],
  ];

  for (let i = 0; i < names.length; i++) {
    if (!names[i] || names[i].includes("Power_id")) continue;
    const txt = `【${names[i]}】《${convertTim(timings[i])}/${costs[i] || ""}/${ranges[i] || ""}》${memos[i] || ""}`;
    const pos = String(positions[i] || "");
    if (["1", "2", "3"].includes(pos)) bui[0].push(`🟩${txt}`);
    else if (pos === "4") bui[1].push(`⭕${txt}`);
    else if (pos === "5") bui[2].push(`⭕${txt}`);
    else if (pos === "6") bui[3].push(`⭕${txt}`);
    else if (pos === "7") bui[4].push(`⭕${txt}`);
  }

  const buiList =
    "未使用：🟩、使用：✅、無事：⭕、損傷：❌\n" +
    bui[0].join("\n") +
    "\n" +
    bui[1].join("\n").replace(/《.*/g, "》") +
    "\n" +
    bui[2].join("\n").replace(/《.*/g, "》") +
    "\n" +
    bui[3].join("\n").replace(/《.*/g, "》") +
    "\n" +
    bui[4].join("\n").replace(/《.*/g, "》");

  let commandPalette = bui
    .map((b) => b.join("\n"))
    .join("\n")
    .replace(/⭕/g, "");

  const mirenNames = pickAllByName(html, "roice_name[]");
  const mirenPos = pickAllByName(html, "roice_pos[]");
  const mirenDmg = pickAllByName(html, "roice_damage[]");

  const status = [
    { label: "頭", value: bui[1].length - 1, max: bui[1].length - 1 },
    { label: "腕", value: bui[2].length - 1, max: bui[2].length - 1 },
    { label: "胴", value: bui[3].length - 1, max: bui[3].length - 1 },
    { label: "脚", value: bui[4].length - 1, max: bui[4].length - 1 },
  ];
  for (let i = 0; i < mirenNames.length; i++) {
    if (mirenNames[i] && !(mirenPos[i] || "").includes("roice_id")) {
      status.push({
        label: `${mirenNames[i]}(${mirenPos[i] || ""})`,
        value: toInt(mirenDmg[i], 0),
        max: 4,
      });
    }
  }

  const initiative = toInt(
    pickInputByName(html, "Act_Total", pickInputById(html, "Act_Total", "0")),
    0,
  );
  const hanyou =
    "\n◆汎用\nnm 未練表\nnmn 中立者への未練表\nnme 敵への未練表\nNC+1 対話判定：\nNC 対話判定：\nNC-1 対話判定：\nNC+2 狂気判定\nNC+1 狂気判定\nNC 狂気判定\nNC-1 狂気判定\nNC-2 狂気判定\nNC+2 行動判定\nNC+1 行動判定\nNC 行動判定\nNC-1 行動判定\nNC-2 行動判定\nNA+2 攻撃判定\nNA+1 攻撃判定\nNA 攻撃判定\nNA-1 行動判定\nNA-2 行動判定\n◆行動値操作\n:initiative-1\n:initiative-2\n:initiative-3";

  let memo = "";
  if (opt[0]) {
    memo = `${buiList}\n\n基礎データ:\n暗示：${pickInputById(html, "pc_carma", "")}　享年：${pickInputById(html, "age", "")}\nポジション：${pickInputByName(html, "Position_Name", "")}\nクラス：${pickInputByName(html, "MCLS_Name", "")}/${pickInputByName(html, "SCLS_Name", "")}\n初期配置：${pickInputByName(html, "sex", "")}\n[記憶のカケラ]\n${pickAllByName(html, "kakera_name[]").join("、")}`;
  }

  let commands = opt[1]
    ? `${commandPalette}${hanyou}\n:initiative=${initiative}`
    : "";
  if (additionalPalette) commands += `\n${additionalPalette}`;

  const out = {
    kind: "character",
    data: {
      name: getNameBySystem(html, "Nechronica"),
      memo,
      initiative,
      externalUrl: url,
      status,
      commands,
    },
  };
  if (img) out.data.iconUrl = img;
  return out;
}

function chapareSata() {
  return "@基本\nSR({性業値}) 性業値判定\n({犯罪})R>=X[,1,13] 犯罪判定\n({生活})R>=X[,1,13] 生活判定\n({恋愛})R>=X[,1,13] 恋愛判定\n({教養})R>=X[,1,13] 教養判定\n({戦闘})R>=X[,1,13] 戦闘判定\n({肉体})R>=X[,1,13] 肉体判定\n({精神})R>=X[,1,13] 精神判定";
}

function getDataSata(html, url, img, opt, additionalPalette) {
  let commands = opt[1] ? chapareSata() : "";
  if (additionalPalette) commands += (commands ? "\n" : "") + additionalPalette;
  const out = {
    kind: "character",
    data: {
      name: getNameBySystem(html, "Satasupe"),
      memo: opt[0] ? "サタスペのメモ" : "",
      initiative: toInt(pickInputById(html, "base.power.initiative", "0"), 0),
      externalUrl: url,
      status: [
        {
          label: "性業値",
          value: toInt(pickInputById(html, "base.emotion", "0"), 0),
          max: 13,
        },
      ],
      params: [
        {
          label: "犯罪",
          value: pickInputById(html, "base.abl.crime.value", ""),
        },
        {
          label: "生活",
          value: pickInputById(html, "base.abl.life.value", ""),
        },
        {
          label: "恋愛",
          value: pickInputById(html, "base.abl.love.value", ""),
        },
        {
          label: "教養",
          value: pickInputById(html, "base.abl.culture.value", ""),
        },
        {
          label: "戦闘",
          value: pickInputById(html, "base.abl.combat.value", ""),
        },
      ],
      commands,
    },
  };
  if (img) out.data.iconUrl = img;
  return out;
}

async function processSheetData(formData) {
  const url = formData.sheet;
  const img = formData.img;
  const plName = String(formData.plName || "").trim();
  const opt = [formData.nomemo !== "true", formData.nochp !== "true"];
  const additionalPalette = formData.additionalPalette || "";

  if (!url || !String(url).trim()) {
    return {
      message: "URLが入力されていない…だと…？",
      out: "URL未入力",
      eff: [[1, 2]],
    };
  }

  const { system, html } = await fetchAndIdentifySystem(url);
  if (system === "Unknown") {
    return {
      message:
        "対応していないキャラクターシート形式か、URLが間違っているようだ。",
      out: "対応していないキャラクターシート形式か、システムの判別に失敗した。",
      eff: [[1, 2]],
    };
  }

  const charName = getNameBySystem(html, system);
  let outObj;
  let message = "";
  let eff = [[1, 2]];

  if (system === "DX3") {
    const comboPalette = await getComboPaletteByUrl(url);
    const useComboPalette =
      String(formData.useComboPalette || "false") === "true";
    outObj = await getDataDX(
      html,
      url,
      img,
      opt,
      additionalPalette,
      useComboPalette ? comboPalette : "",
    );
    message = `ククク、${charName}よ。任務に向かえ。`;
    if (comboPalette && !useComboPalette) {
      message = "コンボデータが見つかりました！コンボデータを反映させますか？";
    }
    eff = getEffectDX(html);
  } else if (system === "SW25") {
    outObj = getDataSW25(html, url, img);
    message = `${charName}、帝国の鉢巻へようこそ！`;
  } else if (system === "Nechronica") {
    outObj = getDataNC(html, url, img, opt, additionalPalette);
    message = `${charName}、きみも、心を…取り戻したんだね`;
  } else if (system === "Satasupe") {
    outObj = getDataSata(html, url, img, opt, additionalPalette);
    message = `ククク、${charName}よ。涅槃で待つ`;
  }

  if (
    outObj &&
    outObj.kind === "character" &&
    outObj.data &&
    outObj.data.memo
  ) {
    outObj.data.memo = String(outObj.data.memo).replace(
      /^PL：.*$/m,
      `PL：${plName || "○○"}`,
    );
  }

  return {
    message,
    out: JSON.stringify(outObj),
    eff,
    comboFound:
      system === "DX3"
        ? String(formData.useComboPalette || "false") !== "true" &&
          message ===
            "コンボデータが見つかりました！コンボデータを反映させますか？"
        : false,
  };
}

async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method === "GET") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          message: "koma-maker API is running. Use POST with JSON body.",
        }),
      );
      return;
    }

    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ message: "Method Not Allowed" }));
      return;
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const result = await processSheetData(body);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(result));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        message: `処理中にエラーが発生したぞ: ${error.message || error}`,
        out: "エラー発生",
        eff: [[1, 2]],
      }),
    );
  }
}

module.exports = handler;

exports.handler = async (event) => {
  const corsHeaders = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "koma-maker API is running. Use POST with JSON body.",
      }),
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const result = await processSheetData(body);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: `処理中にエラーが発生したぞ: ${error.message || error}`,
        out: "エラー発生",
        eff: [[1, 2]],
      }),
    };
  }
};

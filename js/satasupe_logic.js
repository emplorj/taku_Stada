// サタスペ ロジック

// ==========================================================================
// 1. ユーティリティ & データ変換用定義
// ==========================================================================
function roll1d6() {
  return Math.floor(Math.random() * 6) + 1;
}
function roll2d6() {
  return roll1d6() + roll1d6();
}

// D66 (組み合わせ): 12と21は同じ「12」として扱う（小さい数字を十の位にする）
function rollD66Comb() {
  let d1 = roll1d6();
  let d2 = roll1d6();
  if (d1 > d2) [d1, d2] = [d2, d1];
  return `${d1}${d2}`;
}

// D66 (順序あり): 11〜66
function rollD66() {
  return `${roll1d6()}${roll1d6()}`;
}

// 文字列処理ヘルパー: "読み（漢字）" -> <ruby>漢字<rt>読み</rt></ruby>
function parseRuby(text) {
  if (!text) return "";
  // 例: "ウー（呉）" -> group1:ウー, group2:呉
  const match = text.match(/^(.+)（(.+)）$/);
  if (match) {
    const reading = match[1];
    const kanji = match[2];
    return `<ruby>${kanji}<rt>${reading}</rt></ruby>`;
  }
  return text;
}

// 名前パーツ結合
function joinNameParts(parts, sep) {
  return parts
    .filter((p) => p)
    .map((p) => parseRuby(p))
    .join(sep);
}

// 地域に応じた区切り文字
function getSeparator(region) {
  if (["jp", "china", "korea"].includes(region)) {
    return " "; // スペース
  }
  return "・";
}

// 内部IDとルールブック表記の対応表
const REGION_JP_NAMES = {
  jp: "日本",
  china: "中国",
  korea: "東アジア",
  russia: "ロシア",
  west_asia: "西アジア",
  hispanic: "ヒスパニック",
  euro: "欧米",
  africa: "アフリカ",
  special: "特殊",
};

// ==========================================================================
// 2. 一括判定
// ==========================================================================
function rollAll() {
  rollEnvAndTalent();
  rollKarma();
  rollPreference();
  rollAgit();
  rollHobby();
  // 基本的なステータスのみ。名前や経歴などのフレーバーは「任意一括」で振る
}

// 任意項目一括 (各種ランダム決定)
function rollOptionalAll() {
  rollProfileAll();
  rollOrigin(); // 出自（これの中で名前も決定される）
  rollNickname();
  rollLikesAll();
  rollAppearanceAll();
  rollTeamName();
}

// ==========================================================================
// 3. 基本ステータス・アジト
// ==========================================================================

// 環境値 & 天分
function rollEnvAndTalent() {
  const dice = roll1d6();
  const envExp = dice + 7;
  let talentExp = 13 - envExp;
  if (talentExp < 0) talentExp = 0;
  document.getElementById("env-points-result").innerText = envExp;
  document.getElementById("talent-points-result").innerText = talentExp;
}

// 性業
const KARMA_MAP = {
  2: 4,
  3: 5,
  4: 6,
  5: 6,
  6: 7,
  7: 7,
  8: 7,
  9: 8,
  10: 8,
  11: 9,
  12: 10,
};
function rollKarma() {
  const val = roll2d6();
  document.getElementById("karma-result").innerText = KARMA_MAP[val];
}

// 好み
const PREF_TYPES = [
  { name: "ダークな", desc: "【犯罪】が一番高い相手に弱い" },
  { name: "お金持ちな", desc: "【生活】が一番高い相手に弱い" },
  { name: "美形な", desc: "【恋愛】が一番高い相手に弱い" },
  { name: "知的な", desc: "【教養】が一番高い相手に弱い" },
  { name: "ワイルドな", desc: "【戦闘】が一番高い相手に弱い" },
  { name: "バランスが取れてる", desc: "一番高い値が2つ以上ある相手に弱い" },
];
const PREF_AGES = [
  { name: "年下", desc: "年齢未満の相手に弱い" },
  { name: "同い年", desc: "年齢±5歳の相手に弱い" },
  { name: "年上", desc: "年齢以上の相手に弱い" },
];
function rollPreference() {
  const tIdx = Math.floor(Math.random() * PREF_TYPES.length);
  const aIdx = Math.floor(Math.random() * PREF_AGES.length);

  const type = PREF_TYPES[tIdx];
  const age = PREF_AGES[aIdx];

  const resultText = type.name + " " + age.name;
  const el = document.getElementById("pref-result");

  el.innerText = resultText;

  // ★追加: 9文字以上なら文字を小さくするクラスを付与
  if (resultText.length >= 9) {
    el.classList.add("long-text");
    // 下線を消したい場合は以下のようにstyle操作も可能ですが、
    // 今回はCSSクラス(long-text)側で制御するのがスマートです
  } else {
    el.classList.remove("long-text");
  }

  const tooltip = document.getElementById("pref-tooltip");
  if (tooltip) tooltip.innerHTML = `${type.desc}<br>${age.desc}`;
}

// 言語
const LANG_TABLE = [
  "オオサカベンと母国語の会話のみ",
  "母国語の読み書き＆オオサカベンの会話のみ",
  "母国語＆オオサカベン",
  "母国語＆オオサカベン＆1か国語",
  "母国語＆オオサカベン＆2か国語",
  "母国語＆オオサカベン＆3か国語",
  "世界中の言語を操る",
  "未知の言語の読み書き会話も可能",
];
function updateLanguage() {
  let val = parseInt(document.getElementById("culture-rank-input").value);
  if (isNaN(val)) val = 0;
  let index = val;
  if (index < 0) index = 0;
  if (index >= LANG_TABLE.length) index = LANG_TABLE.length - 1;
  document.getElementById("language-result").innerText = LANG_TABLE[index];
}

// アジト
const AGIT_TABLE = [
  { area: "ミナミ", security: 9, note: "普通" },
  { area: "中華街", security: 10, note: "そこそこ良い" },
  { area: "軍艦島", security: 8, note: "かなり悪い" },
  { area: "官庁街", security: 11, note: "かなり良い" },
  { area: "十三", security: 10, note: "そこそこ良い" },
  { area: "沙京", security: 7, note: "最低" },
];

function rollAgit() {
  const dice = roll1d6();
  const agit = AGIT_TABLE[dice - 1];

  // 1. 地名を表示
  document.getElementById("agit-display").innerText = agit.area;

  // 2. ツールチップの中身（治安など）を更新
  const tooltip = document.getElementById("agit-tooltip");
  if (tooltip) {
    // 改行したい場合は <br> を使う
    tooltip.innerHTML = `治安${agit.security} (${agit.note})`;
  }
}

// ==========================================================================
// 4. 趣味
// ==========================================================================
const HOBBY_TABLE = [
  ["エクストリーム", "カワイイ", "トンデモ", "マニア", "ヲタク", "振り直し"],
  ["音楽", "トレンド", "読書", "パフォーマンス", "美術", "振り直し"],
  ["アラサガシ", "おせっかい", "家事", "ガリ勉", "健康", "振り直し"],
  ["アウトドア", "工作", "スポーツ", "ハイソ", "旅行", "振り直し"],
  ["育成", "サビシガリヤ", "ヒマツブシ", "宗教", "ワビサビ", "振り直し"],
  ["アダルト", "飲食", "ギャンブル", "ゴシップ", "ファッション", "振り直し"],
];
const HOBBY_TAG_CLASSES = [
  "tag-pink",
  "tag-blue",
  "tag-gray",
  "tag-yellow",
  "tag-green",
  "tag-purple",
];
const HOBBY_BG_CLASSES = [
  "bg-pink",
  "bg-blue",
  "bg-gray",
  "bg-yellow",
  "bg-green",
  "bg-purple",
];
const HOBBY_CATS = ["サブカル", "アート", "マジメ", "休日", "イヤシ", "風俗"];

function renderHobbyTable() {
  const grid = document.getElementById("hobby-table-grid");
  if (!grid) return;
  grid.innerHTML = "";
  grid.innerHTML += `<div class="hobby-cell header-row">D6</div>`;
  for (let i = 1; i <= 6; i++) {
    grid.innerHTML += `<div class="hobby-cell header-row">1回${i}</div>`;
  }
  HOBBY_TABLE.forEach((row, rIndex) => {
    grid.innerHTML += `<div class="hobby-cell header-col">2回${
      rIndex + 1
    }</div>`;
    row.forEach((cell, cIndex) => {
      const div = document.createElement("div");
      div.className = `hobby-cell ${HOBBY_BG_CLASSES[rIndex]}`;
      div.innerText = cell;
      grid.appendChild(div);
    });
  });
}

function rollHobby() {
  const count = parseInt(document.getElementById("hobby-count").value) || 1;
  const display = document.getElementById("hobby-display");
  display.innerHTML = "";
  const resultHobbies = [];
  for (let i = 0; i < count; i++) {
    let d1, d2, hobbyName;
    do {
      d1 = roll1d6();
      d2 = roll1d6();
      hobbyName = HOBBY_TABLE[d1 - 1][d2 - 1];
    } while (hobbyName === "振り直し");

    resultHobbies.push({
      name: hobbyName,
      tagClass: HOBBY_TAG_CLASSES[d1 - 1],
      catName: HOBBY_CATS[d1 - 1],
    });
  }
  resultHobbies.forEach((h) => {
    display.innerHTML += `<span class="hobby-tag ${h.tagClass}" data-cat="${h.catName}">${h.name}</span>`;
  });
  if (resultHobbies.length > 0) {
    const select = document.getElementById("otakara-hobby-select");
    if (select) select.value = resultHobbies[resultHobbies.length - 1].name;
  }
}

// ==========================================================================
// 5. おたから
// ==========================================================================
function initHobbySelect() {
  const select = document.getElementById("otakara-hobby-select");
  if (!select) return;
  if (typeof OTAKARA_DATA_LIST === "undefined") return;

  const categories = [
    ...new Set(OTAKARA_DATA_LIST.map((item) => item.category)),
  ].sort();
  categories.forEach((cat) => {
    if (cat === "汎用") return;
    const op = document.createElement("option");
    op.value = cat;
    op.innerText = cat;
    select.appendChild(op);
  });
}

function rollOtakara() {
  const hobby = document.getElementById("otakara-hobby-select").value;
  const source = document.getElementById("otakara-source-select").value;
  const resultArea = document.getElementById("otakara-result-area");

  if (!hobby) {
    resultArea.innerText = "趣味を選択してください";
    return;
  }

  if (typeof OTAKARA_DATA_LIST === "undefined") {
    resultArea.innerText = "データ読込エラー";
    return;
  }

  let pool = OTAKARA_DATA_LIST.filter((item) => item.category === hobby);

  if (source === "basic") {
    pool = pool.filter((item) => item.source === "基本");
  } else if (source === "dw") {
    pool = pool.filter(
      (item) => item.source === "基本" || item.source === "DW"
    );
  }

  if (pool.length === 0) {
    resultArea.innerText = "該当データなし";
    return;
  }

  const idx = Math.floor(Math.random() * pool.length);
  const itemName = pool[idx].name;

  // テキストセット
  resultArea.innerText = itemName;

  // ★追加: 文字数に応じたクラス切り替え
  // 一旦クラスをリセット
  resultArea.classList.remove("medium-text", "long-text");

  // 文字数判定
  if (itemName.length >= 10) {
    // 10文字以上なら小さく
    resultArea.classList.add("long-text");
  } else if (itemName.length >= 6) {
    // 6文字以上なら中くらい
    resultArea.classList.add("medium-text");
  }
  // 5文字以下ならデフォルト(3rem)のまま
}

// ==========================================================================
// 6. 支給品 (アイテム)
// ==========================================================================
const INITIAL_ITEMS = [
  // 武器
  {
    lv: 1,
    category: "武器",
    name: "即席武器",
    type: "白兵武器",
    hit: "7",
    damage: "〔破壊力〕-1",
    range: "格闘",
    func: "格闘、マヒ",
  },
  // ★修正: 趣味的武器に条件を追記
  {
    lv: 1,
    category: "武器",
    name: "趣味的武器",
    type: "白兵武器",
    hit: "8",
    damage: "〔破壊力〕",
    range: "格闘",
    func: "条件：趣味に「スポーツ」がある場合",
  },
  {
    lv: 2,
    category: "武器",
    name: "トヨトミピストル",
    type: "拳銃",
    hit: "8",
    damage: "4",
    range: "射撃",
    func: "射撃、サタスペ",
  },
  {
    lv: 3,
    category: "武器",
    name: "S&W M36「チーフスペシャル」",
    type: "拳銃",
    hit: "7",
    damage: "5",
    range: "射撃",
    func: "射撃、リボルバー、暗器",
  },
  {
    lv: 3,
    category: "武器",
    name: "オオサカキャノン",
    type: "SG",
    hit: "6",
    damage: "0",
    range: "格闘",
    func: "格闘、サタスペ、散弾、両手",
  },
  {
    lv: 4,
    category: "武器",
    name: "トカレフ",
    type: "拳銃",
    hit: "9",
    damage: "6",
    range: "射撃",
    func: "射撃",
  },
  {
    lv: 4,
    category: "武器",
    name: "モスバーグM500",
    type: "SG",
    hit: "6",
    damage: "4",
    range: "格闘",
    func: "格闘、散弾、両手",
  },
  {
    lv: 5,
    category: "武器",
    name: "ベレッタM92F",
    type: "拳銃",
    hit: "7",
    damage: "5",
    range: "射撃",
    func: "射撃",
  },
  {
    lv: 5,
    category: "武器",
    name: "AKM「カラシニコフ」",
    type: "AR",
    hit: "7",
    damage: "6",
    range: "射撃",
    func: "射撃、フル、両手",
  },

  // 乗物
  {
    lv: 2,
    category: "乗物",
    name: "自転車",
    type: "自転車",
    speed: "2",
    hull: "0",
    cargo: "2",
    func: "肉体・携帯",
  },
  {
    lv: 3,
    category: "乗物",
    name: "ヴェスパ",
    type: "原付",
    speed: "3",
    hull: "1",
    cargo: "2",
    func: "身軽",
  },
  {
    lv: 4,
    category: "乗物",
    name: "スバル360/R2",
    type: "軽自動車",
    speed: "4",
    hull: "3",
    cargo: "5",
    func: "身軽",
  },
  {
    lv: 5,
    category: "乗物",
    name: "シトロエン2CV",
    type: "普通自動車",
    speed: "4",
    hull: "4",
    cargo: "6",
    func: "維持1",
  },

  // 一般装備 (麻薬含む)
  {
    lv: 1,
    category: "一般",
    name: "テレカ",
    type: "通信手段",
    usage: "補助",
    effect:
      "あらゆる行動に組み合わせられる。テレカ以外の通信手段の持ち主と会話ができる",
  },
  {
    lv: 1,
    category: "一般",
    name: "トルエン",
    type: "麻薬",
    usage: "支援",
    effect:
      "1D6ターンの間、(肉体点〕のペナルティを無視。その後、セッション終了まで、【散漫】(p.119)の代償を得る",
  },
  {
    lv: 2,
    category: "一般",
    name: "携帯電話",
    type: "通信手段",
    usage: "装備",
    effect: "テレカ以外の通信手段の持ち主と会話ができる",
  },
  {
    lv: 2,
    category: "一般",
    name: "救急箱",
    type: "保安器具",
    usage: "計画",
    effect: "「わずかな器具しかない(難易度11)」相当で治療の判定が行える",
  },
  {
    lv: 3,
    category: "一般",
    name: "クラック",
    type: "麻薬",
    usage: "支援",
    effect:
      "1D6ターンの間、〔性業値〕が-2、受けるダメージを-1。その後、セッション終了まで、【せっかち】(p.111)の代償を得る",
  },
  {
    lv: 3,
    category: "一般",
    name: "コデイン",
    type: "麻薬",
    usage: "支援",
    effect:
      "1D6ターンの間、〔性業値〕が+2。その後、セッション終了まで、【弱虫】(p.119)の代償を得る",
  },
  {
    lv: 4,
    category: "一般",
    name: "コカイン",
    type: "麻薬",
    usage: "支援",
    effect:
      "1D6ターンの間、〔性業値〕が-4。その後、セッション終了まで、【暴走】(p.117)の代償を得る",
  },
  {
    lv: 4,
    category: "一般",
    name: "大麻",
    type: "麻薬",
    usage: "支援",
    effect:
      "(精神点)が3点回復。その後、セッション終了まで、【悪夢】(p.103)の代償を得る",
  },
  {
    lv: 5,
    category: "一般",
    name: "ノートパソコン",
    type: "日用品",
    usage: "補助",
    effect: "(教養)のリンク判定に組み合わせる。その難易度から-1",
  },
  {
    lv: 5,
    category: "一般",
    name: "シャブ",
    type: "麻薬",
    usage: "支援",
    effect:
      "1D6ターンの間、〔肉体点〕と〔精神点〕のペナルティを無視。その後、セッション終了まで【虚弱】(p.119)の代僕を得る",
  },
  {
    lv: 5,
    category: "一般",
    name: "ヘロイン",
    type: "麻薬",
    usage: "計画",
    effect:
      "〔精神点〕が6点回復。その後、セッション終了まで【無気力】(p.119)の代償を得る",
  },
];

function showAvailableItems() {
  const livingRank = parseInt(
    document.getElementById("living-rank-input").value
  );
  const tbody = document.getElementById("item-list-body");
  tbody.innerHTML = "";

  const filteredItems = INITIAL_ITEMS.filter((item) => item.lv <= livingRank);

  if (filteredItems.length === 0) {
    tbody.innerHTML =
      "<tr><td colspan='3' style='text-align:center'>取得可能な支給品ナシ</td></tr>";
    return;
  }

  filteredItems.forEach((item) => {
    const tr = document.createElement("tr");

    let detailHTML = "";
    // ★修正: 略語を廃止して正式名称で表示
    if (item.category === "武器") {
      // 武器: 命中/ダメージ/射程 + 特殊機能
      detailHTML = `
                <div style="font-size:0.9rem;">
                    <span style="color:#a83f39; font-weight:bold;">命中</span>${item.hit} 
                    <span style="color:#a83f39; font-weight:bold; margin-left:8px;">ダメ</span>${item.damage} 
                    <span style="color:#a83f39; font-weight:bold; margin-left:8px;">射程</span>${item.range}
                </div>
                <div style="font-size:0.85rem; color:#444; margin-top:2px;">${item.func}</div>
            `;
    } else if (item.category === "乗物") {
      // 乗物: スピード/車体/荷物 + 特殊機能
      detailHTML = `
                <div style="font-size:0.9rem;">
                    <span style="color:#a83f39; font-weight:bold;">スピード</span>${item.speed} 
                    <span style="color:#a83f39; font-weight:bold; margin-left:8px;">車体</span>${item.hull} 
                    <span style="color:#a83f39; font-weight:bold; margin-left:8px;">荷物</span>${item.cargo}
                </div>
                <div style="font-size:0.85rem; color:#444; margin-top:2px;">${item.func}</div>
            `;
    } else {
      // 一般: 使用 + 効果
      detailHTML = `
                <div style="font-size:0.9rem;">
                    <span style="color:#a83f39; font-weight:bold;">使用:</span> ${item.usage}
                </div>
                <div style="font-size:0.85rem; line-height:1.4; margin-top:2px;">${item.effect}</div>
            `;
    }

    tr.innerHTML = `
            <td style="font-weight:bold; color:#a83f39; vertical-align:top;">${item.lv}</td>
            <td style="vertical-align:top;">
                <div style="font-weight:bold;">${item.name}</div>
                <div style="font-size:0.75rem; color:#666;">${item.type}</div>
            </td>
            <td style="vertical-align:top;">${detailHTML}</td>
        `;
    tbody.appendChild(tr);
  });
}

// ==========================================================================
// 7. ランダムチャート (名前・外見・設定)
// ==========================================================================

// --- プロフィール ---
function rollProfileAll() {
  rollSex();
  rollAge();
  rollHometown();
}

function rollSex() {
  const r = roll1d6();
  let sex = "男性";
  let note = "";
  if (r <= 2) {
    sex = "男性";
    note = "(PLと同じ)";
  } else if (r <= 4) {
    sex = "女性";
    note = "(PLと反対)";
  } else if (r === 5) {
    sex = "男性";
    note = "(DDと同じ)";
  } else {
    sex = "女性";
    note = "(DDと反対)";
  }
  document.getElementById("res-sex").value = `${sex} ${note}`;
}

function rollAge() {
  const r = roll1d6();
  if (typeof AGE_CHART === "undefined") return;
  const data = AGE_CHART[r - 1];
  let add = 0;
  for (let i = 0; i < data.dice; i++) add += roll1d6();
  document.getElementById("res-age").value = `${data.base + add}歳 (${
    data.label
  })`;
}

function getHometownRecursive() {
  const r = roll1d6();
  if (typeof HOMETOWN_CHART === "undefined") return "データエラー";
  if (r <= 4) return HOMETOWN_CHART.main[r];
  const r2 = roll1d6();
  if (r2 <= 4) return `${HOMETOWN_CHART.minor[r2]} (マイナー)`;
  return "特殊人名表で決定 (故郷は再決定)";
}
function rollHometown() {
  document.getElementById("res-hometown").value = getHometownRecursive();
}

// --- 名前 (プルダウン連動・取得ロジック) ---
function syncNameRegion() {
  const famSelect = document.getElementById("family-region-select");
  const givenSelect = document.getElementById("given-region-select");
  givenSelect.value = famSelect.value;
}

function getFamilyNameRaw(region) {
  const data = NAME_DATA[region];
  if (!data) return "";

  // 特殊人名表の場合
  if (region === "special") {
    const k = rollD66Comb();
    const val = data.family[k];
    if (val === "DICE") return String(rollD66Comb());
    if (val && val.startsWith("REF:")) {
      return getFamilyNameRaw(val.split(":")[1]);
    }
    return val || "";
  }

  // 中国も他の地域と同じく D66(family) から引くように変更
  // 通常 (D66組み合わせ)
  if (data.family) {
    const k = rollD66Comb();
    // データがない場合はランダム抽出でフォールバック
    return (
      data.family[k] ||
      Object.values(data.family)[
        Math.floor(Math.random() * Object.values(data.family).length)
      ]
    );
  }
  return "";
}

// 名前取得 (生テキスト)
function getGivenNameRaw(region) {
  const data = NAME_DATA[region];
  if (!data) return [""];

  if (region === "special") {
    const k = rollD66Comb();
    return [data.given[k] || ""];
  }

  const isMale = (document.getElementById("res-sex").value || "男性").includes(
    "男性"
  );

  if (region === "china") {
    if (isMale) {
      // 男性名A, Bも D66Comb で引く
      const kA = rollD66Comb();
      const kB = rollD66Comb();

      const p1 = data.maleA[kA] || "イー";
      const p2 = data.maleB[kB] || "イェン";

      const dice = roll1d6();
      // 1-2: A+B, 3-4: B+A, 5: A, 6: B
      if (dice <= 2) return [p1, p2];
      else if (dice <= 4) return [p2, p1];
      else if (dice === 5) return [p1];
      else return [p2];
    } else {
      // 女性名も D66Comb で引く
      const k1 = rollD66Comb();
      const p1 = data.female[k1] || "アイ";

      const dice = roll1d6();
      // 1-2: 2回振って組み合わせ, 3-4: 繰り返し, 5-6: 1回
      if (dice <= 2) {
        const k2 = rollD66Comb();
        const p2 = data.female[k2] || "イン";
        return [p1, p2];
      } else if (dice <= 4) {
        return [p1, p1];
      } else {
        return [p1];
      }
    }
  }

  // 通常地域
  const k = rollD66Comb();
  if (isMale) {
    return [data.male[k] || Object.values(data.male)[0]];
  } else {
    return [data.female[k] || Object.values(data.female)[0]];
  }
}

function rollNameOnly() {
  const famRegion = document.getElementById("family-region-select").value;
  const givenRegion = document.getElementById("given-region-select").value;

  const rawFam = getFamilyNameRaw(famRegion);
  const rawGivenParts = getGivenNameRaw(givenRegion);

  let allParts = [];
  if (rawFam && rawFam !== "（なし）") {
    allParts.push(rawFam);
  }
  if (Array.isArray(rawGivenParts)) {
    allParts = allParts.concat(rawGivenParts);
  } else {
    allParts.push(rawGivenParts);
  }

  const sep = getSeparator(famRegion);
  const html = joinNameParts(allParts, sep);
  document.getElementById("res-name").innerHTML = html;
}

// --- 出自 (修正版: 故郷を参照してプルダウンを操作) ---
function rollOrigin() {
  const dice = roll1d6();
  let msg = "";

  const famSelect = document.getElementById("family-region-select");
  const givenSelect = document.getElementById("given-region-select");

  // プロフィールの故郷を取得 (例: "ロシア", "西アジア (マイナー)")
  const hometownText = document.getElementById("res-hometown").value;

  // 故郷名から地域IDを特定するためのマップ
  const hometownMap = {
    日本: "jp",
    中国: "china",
    東アジア: "korea",
    西アジア: "west_asia",
    ヒスパニック: "hispanic",
    欧米: "euro",
    アフリカ: "africa",
    ロシア: "russia",
  };

  let originRegion = famSelect.value; // デフォルトは現在の選択のまま

  // テキストに含まれるキーワードから地域IDを探す
  for (const [jpName, id] of Object.entries(hometownMap)) {
    if (hometownText.includes(jpName)) {
      originRegion = id;
      break;
    }
  }

  if (dice <= 2) {
    // 1-2: 故郷の人名 -> 両方のプルダウンを故郷に合わせる
    famSelect.value = originRegion;
    givenSelect.value = originRegion;

    rollNameOnly();
    msg = `故郷の人名 (1D6=${dice})`;
  } else if (dice <= 5) {
    // 3-5: ハーフ/2世 -> 苗字は故郷、名前はランダムな他地域

    famSelect.value = originRegion;

    // 名前用に他地域をランダム選択
    const regions = Object.keys(NAME_DATA).filter(
      (r) => r !== originRegion && r !== "special"
    );
    const otherRegionKey = regions[Math.floor(Math.random() * regions.length)];

    givenSelect.value = otherRegionKey;

    rollNameOnly();

    const regionDisplayName = REGION_JP_NAMES[otherRegionKey] || otherRegionKey;
    msg = `ハーフ/2世 (${regionDisplayName}系) (1D6=${dice})`;
  } else {
    // 6: 名前を捨てた
    rollNickname();
    const nicknameHTML = document.getElementById("res-nickname").innerHTML;
    document.getElementById("res-name").innerHTML = nicknameHTML;
    msg = `名前を捨てた (1D6=${dice})`;
  }

  document.getElementById("res-origin").value = msg;
}

// --- 通り名 ---
function rollNickname() {
  const k1 = rollD66Comb();
  const k2 = rollD66Comb();
  const n1 = NICKNAME_TABLE_1[k1] || "？？の";
  const n2 = NICKNAME_TABLE_2[k2] || "？？";
  // HTML装飾付きで出力
  const html = `<span class="nickname-part">${n1}</span><span class="nickname-part">${n2}</span>`;
  document.getElementById("res-nickname").innerHTML = html;
}

// --- 好嫌 ---
function rollLikesAll() {
  function getItem() {
    const row = rollD66Comb();
    const col = roll1d6();
    let idx = 0;
    if (col >= 3 && col <= 4) idx = 1;
    if (col >= 5) idx = 2;
    return LIKES_TABLE[row][idx];
  }
  const item1 = getItem();
  const item2 = getItem();

  if (Math.random() > 0.5) {
    document.getElementById("res-like-text").value = item1;
    document.getElementById("res-dislike-text").value = item2;
  } else {
    document.getElementById("res-like-text").value = item2;
    document.getElementById("res-dislike-text").value = item1;
  }
}

function rollLikeOnly() {
  const row = rollD66Comb();
  const col = roll1d6();
  let idx = 0;
  if (col >= 3 && col <= 4) idx = 1;
  if (col >= 5) idx = 2;
  document.getElementById("res-like-text").value = LIKES_TABLE[row][idx];
}

function rollDislikeOnly() {
  const row = rollD66Comb();
  const col = roll1d6();
  let idx = 0;
  if (col >= 3 && col <= 4) idx = 1;
  if (col >= 5) idx = 2;
  document.getElementById("res-dislike-text").value = LIKES_TABLE[row][idx];
}

// --- 外見・特徴 ---
// 一括
function rollAppearanceAll() {
  rollAppearanceAndFeature();
}

// 外見のみ
function rollAppearanceOnly() {
  const k = rollD66Comb();
  const app = APPEARANCE_TABLE[k] || "凡俗";
  document.getElementById("res-appearance").value = app;

  // データ属性としてキー(11など)を保存しておく（特徴のみを振る時に使うため）
  document.getElementById("res-appearance").dataset.key = k;
}

// 特徴のみ
function rollFeatureOnly() {
  // 既に外見が決まっていればそのキーを使う。なければランダムに外見キーを決める
  let k = document.getElementById("res-appearance").dataset.key;

  if (!k || !FEATURE_TABLE_ROWS[k]) {
    // 外見が決まっていない、またはデータがない場合はランダムな外見キーを生成して使う
    // (表示上の外見は書き換えない)
    k = rollD66Comb();
  }

  const featList = FEATURE_TABLE_ROWS[k];
  // 1D6を振って決定
  const dice = roll1d6();
  const feat = featList ? featList[dice - 1] : "データなし";

  document.getElementById("res-feature").value = feat;
}

// 両方
function rollAppearanceAndFeature() {
  const k = rollD66Comb(); // D66組み合わせ (例: "11", "12")

  // 1. 外見
  const app = APPEARANCE_TABLE[k] || "凡俗";
  document.getElementById("res-appearance").value = app;
  document.getElementById("res-appearance").dataset.key = k; // キーを保存

  // 2. 特徴 (その外見キーに対応するリストから1D6)
  const featList = FEATURE_TABLE_ROWS[k];
  const dice = roll1d6();
  const feat = featList ? featList[dice - 1] : "データなし";

  document.getElementById("res-feature").value = feat;
}

// --- チーム名 ---
function rollTeamName() {
  // ヘルパー
  function getRandom(obj) {
    if (!obj) return "??";
    const keys = Object.keys(obj);
    return obj[keys[Math.floor(Math.random() * keys.length)]];
  }

  // 1. メイン
  const mainType = Math.random() > 0.5 ? "mainA" : "mainB";
  const wordMain = getRandom(TEAM_NAME_TABLE[mainType]);

  // 2. サブ
  const subType = Math.random() > 0.5 ? "subA" : "subB";
  const wordSub = getRandom(TEAM_NAME_TABLE[subType]);

  // 3. 組織
  const orgType = Math.random() > 0.5 ? "orgA" : "orgB";
  const wordOrg = getRandom(TEAM_NAME_TABLE[orgType]);

  // HTMLとして出力してCSSで間隔調整
  document.getElementById(
    "res-teamname"
  ).innerHTML = `<span class="team-part">${wordMain}</span><span class="team-part">${wordSub}</span><span class="team-part">${wordOrg}</span>`;
}
// ==========================================================================
// 8. スクショモード (モーダル制御)
// ==========================================================================

function openScreenshotModal() {
  // 1. 各値をメイン画面から取得
  const env = document.getElementById("env-points-result").innerText;
  const talent = document.getElementById("talent-points-result").innerText;
  const karma = document.getElementById("karma-result").innerText;
  const pref = document.getElementById("pref-result").innerText;

  // アジトはHTMLタグ(ツールチップ)を含んでいる可能性があるためテキストのみ抽出
  const agitRaw = document.getElementById("agit-display").innerText;
  // ※ innerTextなら通常は見た目通り取れるが、念のため整形
  const agit = agitRaw.split("\n")[0]; // ツールチップが改行扱いになる場合への対策

  const otakara = document.getElementById("otakara-result-area").innerText;

  // 2. モーダルにセット
  document.getElementById("modal-env").innerText = env;
  document.getElementById("modal-talent").innerText = talent;
  document.getElementById("modal-karma").innerText = karma;
  document.getElementById("modal-pref").innerText = pref;
  document.getElementById("modal-agit").innerText = agit;
  document.getElementById("modal-otakara").innerText = otakara;

  // 3. 表示
  document.getElementById("screenshot-modal").style.display = "flex";
}

function closeScreenshotModal() {
  document.getElementById("screenshot-modal").style.display = "none";
}

// ==========================================================================
// 初期化
// ==========================================================================
window.onload = function () {
  if (typeof OTAKARA_DATA_LIST !== "undefined") {
    initHobbySelect();
  }
  rollAll();
  updateLanguage();
  showAvailableItems();
  renderHobbyTable();
};

const assert = require("node:assert/strict");
const handler = require("../api/koma-maker.js");

const sheetUrl = "https://yutorize.work/ytsheet/sw2.5/?id=test-sw25";
const fixture = {
  characterName: "コレット・ドドジマ",
  playerName: "エンJ",
  aka: "永遠の真の闇",
  akaRuby: "エターナル・カオス",
  race: "アビスボーン",
  gender: "女",
  age: "16",
  sin: "0",
  rank: "レイピア",
  imageURL: "https://example.com/image.webp",
  hpTotal: "30",
  mpTotal: "36",
  lvCaster: "6",
  lvBar: "0",
  magicPowerBib: "10",
  unitStatus: [
    { HP: "30/30" },
    { MP: "36/36" },
    { 防護: "2" },
    { 特殊失敗値: "0" },
  ],
  fellow1Action: "[補]悪意の針&lt;br&gt;[主]貫く光条",
  fellow1Words: "「大地ごと抉ってやろう！」",
  fellow1Num: "17",
  fellow1Note: "1体／確定2ダメージ、k30+魔力ダメージ",
  "fellow1-2Action": "スカウト運動判定",
  "fellow1-2Words": "「風の如し！」",
  "fellow1-2Num": "13",
  fellow3Action: "肉体修復",
  fellow3Words: "「まだ戦えるだろう？」",
  fellow3Num: "15",
  fellow3Note: "1体／k20+魔力回復、固定なら「8+4」点回復",
  fellow5Action: "アースハンマー",
  fellow5Words: "「メネフネさんの力で……！」",
  fellow5Num: "17",
  fellow5Note:
    "MP3　「威力10C値12+8」点物理ダメージ。一時的に体力を「8」点追加",
  fellow6Action: "リムチョッパー投擲",
  fellow6Words: "「思いっきり……！」",
  fellow6Num: "18",
  fellow6Note: "「威力43C値11+8」点物理ダメージ",
  fellowProfile: "フェローの紹介&lt;br&gt;&lt;br&gt;二段落目",
};

const palette = [
  "### ■非戦闘系・先制",
  "2d+6+2 冒険者＋器用",
  "//魔力修正=0",
  "//魔法C=10",
  "//器用度=16",
  "//知力増強=2",
  "//冒険者レベル=6",
  "//ビブリオマンサー=6",
  "//最大HP=30",
  "//最大MP=36",
  "//防護1=2",
  "",
  "### ■代入パラメータ",
  "//器用={器用度}",
  "//冒険者={冒険者レベル}",
].join("\n");

const fetchedModes = [];
global.fetch = async (url) => {
  const parsed = new URL(url);
  assert.equal(parsed.hostname, "yutorize.work");
  assert.equal(parsed.pathname, "/ytsheet/sw2.5/");
  assert.equal(parsed.searchParams.get("id"), "test-sw25");
  const mode = parsed.searchParams.get("mode");
  fetchedModes.push(mode);
  if (mode === "json") {
    return {
      ok: true,
      text: async () => JSON.stringify(fixture),
    };
  }
  assert.equal(mode, "palette");
  assert.equal(parsed.searchParams.get("propertiesall"), "1");
  assert.equal(parsed.searchParams.get("tool"), "bcdice");
  return {
    ok: true,
    text: async () => palette,
  };
};

function invoke(body) {
  return new Promise((resolve) => {
    const res = {
      headers: {},
      setHeader(name, value) {
        this.headers[name] = value;
      },
      end(value) {
        resolve({ statusCode: this.statusCode, body: JSON.parse(value) });
      },
    };
    handler({ method: "POST", body }, res);
  });
}

(async () => {
  const response = await invoke({
    sheet: sheetUrl,
    img: "",
    plName: "",
    nomemo: "false",
    nochp: "false",
  });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(fetchedModes.sort(), ["json", "palette"]);

  const output = JSON.parse(response.body.out);
  assert.equal(output.kind, "character");
  assert.equal(output.data.name, "コレット・ドドジマ");
  assert.equal(output.data.playerName, "エンJ");
  assert.equal(
    output.data.externalUrl,
    "https://yutorize.work/ytsheet/sw2.5/?id=test-sw25&f=1",
  );
  assert.deepEqual(output.data.status, [
    { label: "HP", value: "30", max: "30" },
    { label: "MP", value: "36", max: "36" },
    { label: "防護", value: "2" },
    { label: "特殊失敗値", value: "0" },
  ]);
  assert.deepEqual(output.data.params, [
    { label: "魔力修正", value: "0" },
    { label: "魔法C", value: "10" },
    { label: "器用度", value: "16" },
    { label: "知力増強", value: "2" },
    { label: "冒険者レベル", value: "6" },
    { label: "ビブリオマンサー", value: "6" },
  ]);
  assert.equal(
    output.data.commands,
    [
      "### ■非戦闘系・先制",
      "2d+6+2 冒険者＋器用",
      "",
      "### ■代入パラメータ",
      "//器用={器用度}",
      "//冒険者={冒険者レベル}",
    ].join("\n"),
  );
  assert.ok(
    output.data.memo.includes(
      "“永遠の真の闇” (エターナル・カオス)PL: エンJ",
    ),
  );
  assert.ok(output.data.memo.includes("アビスボーン／女／16"));

  const fellow = JSON.parse(response.body.sw25FellowOut);
  assert.equal(fellow.data.name, output.data.name);
  assert.deepEqual(fellow.data.status, output.data.status);
  assert.deepEqual(fellow.data.params, [
    ...output.data.params,
    { label: "魔力", value: "10" },
  ]);
  assert.equal(fellow.data.memo, output.data.memo);
  assert.ok(!fellow.data.memo.includes("【フェロープロフィール】"));
  assert.ok(!fellow.data.memo.includes("フェローの紹介"));
  assert.equal(
    fellow.data.commands,
    [
      "### ■フェロー行動表",
      "1D6 フェロー行動表",
      "choice([補]悪意の針／[主]貫く光条／スカウト運動判定,[補]悪意の針／[主]貫く光条／スカウト運動判定,肉体修復,肉体修復,アースハンマー,リムチョッパー投擲) フェロー行動表",
      "",
      "### ■フェロー行動宣言",
      "[補]悪意の針\\n[主]貫く光条",
      "スカウト運動判定",
      "肉体修復",
      "アースハンマー",
      "リムチョッパー投擲",
      "",
      "### ■フェロー行動詳細",
      "[補]悪意の針\\n[主]貫く光条\\n「大地ごと抉ってやろう！」\\n1体／確定2ダメージ、k30+魔力ダメージ",
      "スカウト運動判定\\n「風の如し！」",
      "肉体修復\\n「まだ戦えるだろう？」\\n1体／k20+魔力回復、固定なら「8+4」点回復",
      "アースハンマー\\n「メネフネさんの力で……！」\\nMP3　「威力10C値12+8」点物理ダメージ。一時的に体力を「8」点追加",
      "リムチョッパー投擲\\n「思いっきり……！」\\n「威力43C値11+8」点物理ダメージ",
      "",
      "### ■フェロー効果",
      "k30+{魔力} ダメージ（[補]悪意の針／[主]貫く光条）",
      "C(8+4) 回復（肉体修復）",
      "k20+{魔力} 回復（肉体修復）",
      "k10[12]+8 物理ダメージ（アースハンマー）",
      "C(8) HP追加（アースハンマー）",
      "k43[11]+8 物理ダメージ（リムチョッパー投擲）",
    ].join("\n"),
  );

  console.log("yutorize SW2.5 API regression test: OK");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

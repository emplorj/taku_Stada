const assert = require("node:assert/strict");
const handler = require("../api/koma-maker.js");

const sheetUrl =
  "https://character-sheets.appspot.com/shinobigami/edit.html?key=test-key";
const fixture = {
  base: {
    name: "階ノ菻",
    nameKana: "キザハシノキツネアザミ",
    player: "エンJ",
  },
  learned: [
    { hiddenSkill: null, id: null },
    { hiddenSkill: null, id: "skills.row2.name1" },
    { hiddenSkill: null, id: "skills.row3.name2" },
    { hiddenSkill: null, id: "skills.row10.name1" },
    { hiddenSkill: null, id: "skills.row7.name1" },
    { hiddenSkill: null, id: "skills.row1.name5" },
    { hiddenSkill: null, id: "skills.row7.name4" },
  ],
  ninpou: [
    {
      cost: "0",
      name: "接近戦攻撃",
      range: "1",
      targetSkill: null,
      type: "攻撃",
    },
    {
      cost: "1",
      name: "【神槍】",
      range: "3",
      targetSkill: "手裏剣術",
      type: "攻撃",
    },
    {
      cost: "1",
      name: "【無拍子】",
      range: null,
      targetSkill: "盗聴術",
      type: "サポート",
    },
    {
      cost: null,
      name: "【後の先】",
      range: null,
      targetSkill: null,
      type: "装備",
    },
  ],
  skills: {
    damage: {
      check0: null,
      check1: null,
      check2: null,
      check3: null,
      check4: null,
      check5: null,
    },
  },
};

global.fetch = async (url) => {
  const parsed = new URL(url);
  assert.equal(parsed.pathname, "/shinobigami/display");
  assert.equal(parsed.searchParams.get("ajax"), "1");
  assert.equal(parsed.searchParams.get("key"), "test-key");
  return {
    ok: true,
    text: async () => JSON.stringify(fixture),
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
    plName: "テストPL",
    nomemo: "false",
    nochp: "false",
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.message, "忍務を遂行せよ、階ノ菻。");

  const output = JSON.parse(response.body.out);
  assert.equal(output.kind, "character");
  assert.equal(output.data.name, "階ノ菻");
  assert.equal(
    output.data.memo,
    [
      "キザハシノキツネアザミ",
      "PL：テストPL",
      "【表の使命】",
      "",
      "【取得済み情報】",
      "",
      "　　　　感情　秘密　居所　奥義",
      "ＰＣ１　なし  　✕　 　✕ 　   ✕",
      "ＰＣ２　なし  　✕　 　✕ 　   ✕",
      "ＰＣ３　なし  　✕　 　✕ 　   ✕",
      "ＰＣ４　なし  　✕　 　✕ 　   ✕",
      "",
      "その他",
    ].join("\n"),
  );
  assert.equal(
    output.data.externalUrl,
    "http://character-sheets.appspot.com/shinobigami/edit.html?key=test-key",
  );
  assert.deepEqual(output.data.status, [
    { label: "器術", value: "1", max: "1" },
    { label: "体術", value: "1", max: "1" },
    { label: "忍術", value: "1", max: "1" },
    { label: "謀術", value: "1", max: "1" },
    { label: "戦術", value: "1", max: "1" },
    { label: "妖術", value: "1", max: "1" },
    { label: "追加生命力", value: 0, max: 0 },
  ]);
  assert.deepEqual(output.data.params, []);

  const learnedCommands = [
    "SG＠12#2>=5 行為判定(特技：手裏剣術)",
    "SG＠12#2>=5 行為判定(特技：盗聴術)",
    "SG＠12#2>=5 行為判定(特技：怪力)",
    "SG＠12#2>=5 行為判定(特技：飛術)",
    "SG＠12#2>=5 行為判定(特技：召喚術)",
    "SG＠12#2>=5 行為判定(特技：見敵術)",
  ].join("\n");
  assert.ok(output.data.commands.startsWith(learnedCommands));
  assert.ok(output.data.commands.includes("RTT6 【ランダム特技決定(妖術)】"));
  assert.ok(
    output.data.commands.includes(
      "接近戦攻撃　攻撃忍法　指定特技：-　コスト：0　間合：1",
    ),
  );
  assert.ok(
    output.data.commands.includes(
      "【神槍】　攻撃忍法　指定特技：手裏剣術　コスト：1　間合：3",
    ),
  );
  assert.ok(
    output.data.commands.includes(
      "【無拍子】　サポート忍法　指定特技：盗聴術　コスト：1　間合：-",
    ),
  );
  assert.ok(output.data.commands.endsWith("OTFK 【不良高校シーン表】\n"));

  const hidden = await invoke({
    sheet: sheetUrl,
    nomemo: "true",
    nochp: "true",
  });
  const hiddenOutput = JSON.parse(hidden.body.out);
  assert.equal(hiddenOutput.data.memo, "");
  assert.equal(hiddenOutput.data.commands, "");

  console.log("shinobigami API regression test: OK");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const assert = require("node:assert/strict");
const handler = require("../api/koma-maker.js");

const sheetUrl =
  "https://character-sheets.appspot.com/stellar/edit.html?key=test-key";
const fixture = {
  base: {
    character: { "1st": "勇敢", "2nd": "最強" },
    hopedespair: { choice: "希望", detail: "まだまだ物足りない" },
    knight: { type: "ステラナイト" },
    name: "カズ",
    organization: "アーセルトレイ公立大学",
    personalflower: { color: "赤", essence: "オダマキ" },
    player: "エンJ",
    wish: "欲しいもの（伝説最強）",
    yourstory: "探求者",
  },
  skills: [
    { name: "騎士のたしなみ", effect: "テスト効果1" },
    { name: "掻きむしれ炎禍", effect: "テスト効果2" },
  ],
  sheath: { name: "リーフ" },
  status: { charge: "3", defense: "3", hp: "11" },
};

global.fetch = async (url) => {
  const parsed = new URL(url);
  if (parsed.pathname === "/satasupe/edit.html") {
    return { ok: true, text: async () => "<html></html>" };
  }
  assert.match(parsed.pathname, /^\/(stellar|satasupe)\/display$/);
  assert.equal(parsed.searchParams.get("ajax"), "1");
  assert.match(parsed.searchParams.get("key"), /^test-(key|satasupe)$/);
  return {
    ok: true,
    text: async () =>
      JSON.stringify(
        parsed.pathname === "/stellar/display"
          ? fixture
          : {
              base: {
                name: "サタスペPC",
                abl: {},
                gift: {},
                power: {},
              },
              cond: {},
            },
      ),
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
  const output = JSON.parse(response.body.out);
  assert.equal(output.kind, "character");
  assert.equal(output.data.name, "カズ");
  assert.equal(
    output.data.memo,
    [
      "PL：テストPL",
      "希望のステラナイト",
      "希望表：まだまだ物足りない",
      "あなたの物語：探求者",
      "願い表：欲しいもの（伝説最強）",
      "性格表勇敢にして最強",
      "所属組織：アーセルトレイ公立大学",
      "花章：赤色のオダマキ",
      "",
    ].join("\n"),
  );
  assert.deepEqual(output.data.status, [
    { label: "耐久値", value: "11", max: "" },
    { label: "防御力", value: "3", max: "6" },
    { label: "ブーケ", value: "0", max: "200" },
    { label: "ラウンド数", value: "1", max: "1" },
  ]);
  assert.deepEqual(output.data.params, [
    { label: "チャージダイス", value: "3" },
  ]);
  assert.ok(
    output.data.commands.includes(
      [
        "プチラッキー(3*n)〇を×に",
        "ダイスブースト(4*n)アタック判定に+1~3ダイス",
        "リロール(5)判定振り直し",
      ].join("\n"),
    ),
  );
  assert.ok(
    output.data.commands.includes("No1.騎士のたしなみ\\nテスト効果1"),
  );
  assert.ok(
    output.data.commands.includes("No2.掻きむしれ炎禍\\nテスト効果2"),
  );
  assert.ok(
    !output.data.commands.includes("No1.騎士のたしなみ\nテスト効果1"),
  );
  const sheathOutput = JSON.parse(response.body.stellarSheathOut);
  assert.equal(sheathOutput.kind, "character");
  assert.equal(sheathOutput.data.name, "リーフ");
  assert.deepEqual(sheathOutput.data.status, [
    { label: "投げブーケ", value: "0", max: "0" },
  ]);
  assert.deepEqual(sheathOutput.data.params, []);
  assert.equal(
    sheathOutput.data.commands,
    [
      ":投げブーケ+1",
      ":投げブーケ+2",
      ":投げブーケ+3",
      ":投げブーケ=0",
    ].join("\n"),
  );

  const hidden = await invoke({
    sheet: sheetUrl,
    nomemo: "true",
    nochp: "true",
  });
  const hiddenOutput = JSON.parse(hidden.body.out);
  assert.equal(hiddenOutput.data.memo, "");
  assert.equal(hiddenOutput.data.commands, "");

  const satasupe = await invoke({
    sheet:
      "https://character-sheets.appspot.com/satasupe/edit.html?key=test-satasupe",
    nomemo: "true",
    nochp: "true",
  });
  assert.equal(JSON.parse(satasupe.body.out).data.name, "サタスペPC");

  console.log("stellar API regression test: OK");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

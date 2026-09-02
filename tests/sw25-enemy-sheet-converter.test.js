const assert = require("node:assert/strict");
const converter = require("../js/sw25-enemy-sheet-converter.js");

const sample = {
  kind: "character",
  data: {
    name: "ウルフkv1型",
    memo: "\n\n───\n種族:動物　Lv4\n知能：？　知覚：?　反応：？　穢れ：0\n生息地：あちこち\n知名度/弱点値：10／15　先制値：15\n\n──\n蛮族が駆逐された東方大陸で繁殖し過ぎた狼。",
    initiative: 15,
    status: [
      { label: "HP", value: "35", max: "35" },
      { label: "MP", value: "10", max: "10" },
      { label: "防護点", value: "10", max: "" },
    ],
    params: [
      { label: "生命抵抗", value: "5" },
      { label: "精神抵抗", value: "7" },
    ],
    commands: "■\n2D+7  命中\n2D+4  打撃点\n2D+4  回避\n2d+{生命抵抗} 生命抵抗\n2d+{精神抵抗} 精神抵抗\n\n■魔物知識開示情報\n弱点：物理ダメージ+2点\n〇重毛皮\n　あらゆる『抵抗：半減』は『抵抗：消滅』となる。",
  },
};

const result = converter.convert(JSON.stringify(sample)).value;
assert.equal(result.monsterName, "ウルフkv1型");
assert.equal(result.lv, "4");
assert.equal(result.taxa, "動物");
assert.equal(result.reputation, "10");
assert.equal(result["reputation+"], "15");
assert.equal(result.weakness, "物理ダメージ+2点");
assert.equal(result.initiative, "15");
assert.equal(result.vitResist, "5");
assert.equal(result.vitResistFix, "12");
assert.equal(result.status1Accuracy, "7");
assert.equal(result.status1AccuracyFix, "14");
assert.equal(result.status1Damage, "2D+4");
assert.equal(result.status1Evasion, "4");
assert.equal(result.status1Defense, "10");
assert.equal(result.status1Hp, "35");
assert.equal(result.status1Mp, "10");
assert.match(result.skills, /〇重毛皮/);
assert.doesNotMatch(result.skills, /^弱点/u);
assert.match(result.description, /東方大陸/);

const spreadsheetPaste = `名前\tココフォリア\nウルフ\t"${JSON.stringify(sample).replace(/"/g, '""')}"`;
assert.equal(converter.convert(spreadsheetPaste).value.monsterName, "ウルフkv1型");

const multi = JSON.parse(JSON.stringify(sample));
multi.data.status = [
  { label: "頭:HP", value: "64", max: "64" },
  { label: "腕:HP", value: "96", max: "96" },
  { label: "頭:MP", value: "12", max: "12" },
  { label: "腕:MP", value: "8", max: "8" },
];
multi.data.commands = "2d+17 命中／頭\n2d+15 打撃点／頭\n2d+16 回避／頭\n2d+19 命中／腕\n2d+20 打撃点／腕\n2d+16 回避／腕";
const multiResult = converter.convert(JSON.stringify(multi)).value;
assert.equal(multiResult.statusNum, "2");
assert.equal(multiResult.parts, "頭／腕");
assert.equal(multiResult.status2Style, "腕");
assert.equal(multiResult.status2Accuracy, "19");
assert.equal(multiResult.status2Hp, "96");

const movementSample = JSON.parse(JSON.stringify(sample));
movementSample.data.name = "エーマイナー・エキドナ・イタン";
movementSample.data.memo = "───\n種族:人族　Lv12\n知能：高い　知覚：五感　反応：中立　穢れ：0\n言語：交易共通語他いろいろ\n生息地：あちこち\n知名度/弱点値：16(秘匿アリ)\n\n──\n";
movementSample.data.status = [
  { label: "HP(第Ⅰ楽章)", value: "61", max: "61" },
  { label: "MP(第Ⅰ楽章)", value: "51", max: "51" },
  { label: "防護点(第Ⅰ楽章)", value: "8", max: "" },
  { label: "HP(第Ⅱ楽章)", value: "99", max: "99" },
  { label: "防護点(第Ⅱ楽章)", value: "7", max: "" },
  { label: "HP(Finale)", value: "123", max: "123" },
  { label: "防護点(Finale)", value: "6", max: "" },
];
movementSample.data.commands = "■第Ⅰ楽章\n2D+14 第Ⅰ楽章 命中\n2D+13 第Ⅰ楽章 打撃点\n2D+14 第Ⅰ楽章 回避\n■第Ⅱ楽章\n2D+17 第Ⅱ楽章 命中\n2D+8 第Ⅱ楽章 打撃点\n2D+13 第Ⅱ楽章 回避\n■Finale\n2D+14 Finale 命中\n2D+15 Finale 打撃点\n2D+13 Finale 回避\n\n■魔物知識開示情報\n○Ｄ.Ｃ.\n本文";
const movementResult = converter.convert(JSON.stringify(movementSample)).value;
assert.equal(movementResult.reputation, "16");
assert.equal(movementResult["reputation+"], "");
assert.equal(movementResult.statusNum, "3");
assert.equal(movementResult.parts, "第Ⅰ楽章／第Ⅱ楽章／Finale");
assert.equal(movementResult.status1Style, "第Ⅰ楽章");
assert.equal(movementResult.status1Accuracy, "14");
assert.equal(movementResult.status1Defense, "8");
assert.equal(movementResult.status2Damage, "2D+8");
assert.equal(movementResult.status3Hp, "123");
assert.equal(movementResult.status3Evasion, "13");

const duplicateParts = JSON.parse(JSON.stringify(sample));
duplicateParts.data.name = "テンタクル・デーモン";
duplicateParts.data.memo = "───\n種族:魔神　Lv5\n知能：人間並み　知覚：五感　反応：敵対的　穢れ：0\n言語：魔神語\n生息地：???\n知名度/弱点値：45213　先制値：12\n\n──\nミミック化を使用したシスターの姿。";
duplicateParts.data.status = [
  { label: "HP(触手(コア))", value: "22", max: "22" },
  { label: "MP(触手(コア))", value: "34", max: "34" },
  { label: "防護点(触手(コア))", value: "2", max: "" },
  { label: "HP(触手)", value: "46", max: "46" },
  { label: "MP(触手)", value: "20", max: "20" },
  { label: "防護点(触手)", value: "5", max: "" },
  { label: "HP(触手)", value: "46", max: "46" },
  { label: "MP(触手)", value: "18", max: "18" },
  { label: "防護点(触手)", value: "5", max: "" },
];
duplicateParts.data.commands = "■触手(コア)\n2D+5 触手(コア) 命中\n2D+4 触手(コア) 打撃点\n2D+0 触手(コア) 回避\n■触手\n2D+6 触手 命中\n2D+6 触手 打撃点\n2D+5 触手 回避\n■触手\n2D+6 触手 命中\n2D+6 触手 打撃点\n2D+5 触手 回避\n\n■魔物知識開示情報\n●全身\n○平常心\n本文";
const duplicateConversion = converter.convert(JSON.stringify(duplicateParts));
const duplicateResult = duplicateConversion.value;
assert.equal(duplicateResult.statusNum, "3");
assert.equal(duplicateResult.parts, "触手(コア)／触手／触手");
assert.equal(duplicateResult.coreParts, "触手(コア)");
assert.equal(duplicateResult.status1Mp, "34");
assert.equal(duplicateResult.status2Mp, "20");
assert.equal(duplicateResult.status3Mp, "18");
assert.equal(duplicateResult.status2Accuracy, "6");
assert.equal(duplicateResult.status3Accuracy, "6");
assert.match(duplicateConversion.warnings.join("\n"), /45213/);

console.log("sw25-enemy-sheet-converter: ok");

const sw25GinouName = [
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
  "エンハンサー",
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
let sw25GinouLv = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0,
];
let sw25GinouLvUpper = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0,
];
const sw25SenshiGinou = [
  1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0,
];
const sw25MagicGinou = [
  0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0,
  1, 0, 1,
];
const sw25AutoSTFlg = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];
let sw25AutoST = [
  "タフネス",
  "追加攻撃",
  "カウンター",
  "バトルマスター",
  "ルーンマスター",
  "トレジャーハント",
  "ファストアクション",
  "影走り",
  "トレジャーマスター",
  "匠の技",
  "サバイバビリティ",
  "不屈",
  "ポーションマスター",
  "縮地",
  "ランアンドガン",
  "鋭い目",
  "弱点看破",
  "マナセーブ",
  "マナ耐性",
  "賢人の知恵",
];
const sw25AutoSTprop = [
  "ST_name_fig1",
  "ST_name_figgrp",
  "ST_name_grp1",
  "ST_name_grp2",
  "ST_name_grp3",
  "ST_name_grp4",
  "ST_name_magicmaster",
  "ST_name_scout1",
  "ST_name_scout2",
  "ST_name_scout3",
  "ST_name_scout4",
  "ST_name_scout5",
  "ST_name_ranger1",
  "ST_name_ranger2",
  "ST_name_ranger3",
  "ST_name_ranger4",
  "ST_name_ranger5",
  "ST_name_sage1",
  "ST_name_sage2",
  "ST_name_sage3",
  "ST_name_sage4",
  "ST_name_sage5" /*,"ST_name_bdc1"舞流しバグってるっぽい*/,
];
const sw25ArmType = [
  "ソード",
  "アックス",
  "スピア",
  "メイス",
  "スタッフ",
  "フレイル",
  "ウォーハンマー",
  "格闘",
  "投擲",
  "ボウ",
  "クロスボウ",
  "ガン",
  "素手/格闘",
];
const sw25ArmMastery = [
  "masterySword",
  "masteryAxe",
  "masterySpear",
  "masteryMace",
  "masteryStaff",
  "masteryFlail",
  "masteryHammer",
  "masteryGrapple",
  "masteryThrow",
  "masteryBow",
  "masteryCrossbow",
  "masteryGun",
  "masteryGrapple",
];
const sw25ArmCat = {
  ソード: { mastery: ["masterySword"], ismelee: 1 },
  アックス: { mastery: ["masteryAxe"], ismelee: 1 },
  スピア: { mastery: ["masterySpear"], ismelee: 1 },
  メイス: { mastery: ["masteryMace"], ismelee: 1 },
  スタッフ: { mastery: ["masteryStaff"], ismelee: 1 },
  フレイル: { mastery: ["masteryFlail"], ismelee: 1 },
  ウォーハンマー: { mastery: ["masteryHammer"], ismelee: 1 },
  格闘: { mastery: ["masteryGrapple"], ismelee: 1 },
  投擲: { mastery: ["masteryThrow", "mightyShot"], ismelee: 0 },
  ボウ: { mastery: ["masteryBow"], ismelee: 0 },
  クロスボウ: { mastery: ["masteryCrossbow"], ismelee: 0 },
  ガン: { mastery: ["masteryGun"], ismelee: 0 },
  "素手/格闘": { mastery: ["masteryGrapple"], ismelee: 1 },
};
const sw25_race_bar = [
  "ウィークリング（ガルーダ）",
  "ウィークリング（タンノズ）",
  "ウィークリング（バジリスク）",
  "ウィークリング（ミノタウロス）" /*,"ウィークリング（マーマン）"*/,
  "ドレイク",
  "ドレイクブロークン",
  "バジリスク",
  "ディアボロ",
  "ダークトロール",
  "アルボル",
  "バーバヤガー",
  "ケンタウロス",
  "シザースコーピオン",
  "ドーン",
  "コボルド",
  "ラミア",
  "ラルヴァ" /*,"リザードマン","ライカンスロープ","バルカン"*/,
];
const sw25ArmMeleeType = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1];
let wizMin = 0;
let wizMax = 0;
let sw25_itemFlg = false;
let sw25_skillFlg = false;
let sw25_mysticFlg = false;
let sw25_levelFlg = false;

//  各魔法管理用
let dam_sor = [
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
let dam_con = [
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
let heal_con = [
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
let dam_wiz = [
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
let dam_pri = [
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
let heal_pri = [
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
let dam_bullet = [
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
let heal_bullet = [
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
let dam_mag = [
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
let heal_mag = [
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
let dam_fai = [
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
let dam_dru = [
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
let phy_dru = [
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
let dam_dem = [
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
let dam_abyss = [
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
let heal_abyss = [
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
let dam_bib = [
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
let heal_bib = [
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

/*
 * ソードワールド2.0(2.5) グローバル変数初期化
 */
function SW2_Global_Initialize() {
  sw25_itemFlg = $('input:checkbox[id="sw25_item"]').prop("checked");
  sw25_skillFlg = $('input:checkbox[id="sw25_skill"]').prop("checked");
  sw25_mysticFlg = $('input:checkbox[id="sw25_mystic"]').prop("checked");
  sw25_levelFlg = $('input:checkbox[id="sw25_level"]').prop("checked");
  //  sw25ArmType = ["ソード","アックス","スピア","メイス","スタッフ","フレイル","ウォーハンマー","格闘","投擲","ボウ","クロスボウ","ガン","素手/格闘"];
  sw25GinouLv = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0,
  ];
  //  sw25AutoSTFlg = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  wizMin = 0;
  wizMax = 0;
}
/*
 * ソードワールド2.0(2.5) 保管所ver
 */
function Make_SW2_ByStorage(json) {
  let money = "0";
  let race = "";
  let gender = "";
  let age = "";
  let hissatsuFlg = false;
  let critRayFlg = false;

  let N_waza = com_jsonNullCheck(json, "N_waza", "0");
  let N_karada = com_jsonNullCheck(json, "N_karada", "0");
  let N_kokoro = com_jsonNullCheck(json, "N_kokoro", "0");
  let V_NC1 = com_jsonNullCheck(json, "V_NC1", "0");
  let V_NC2 = com_jsonNullCheck(json, "V_NC2", "0");
  let V_NC3 = com_jsonNullCheck(json, "V_NC3", "0");
  let V_NC4 = com_jsonNullCheck(json, "V_NC4", "0");
  let V_NC5 = com_jsonNullCheck(json, "V_NC5", "0");
  let V_NC6 = com_jsonNullCheck(json, "V_NC6", "0");
  let NS1 = com_jsonNullCheck(json, "NS1", "0");
  let NS2 = com_jsonNullCheck(json, "NS2", "0");
  let NS3 = com_jsonNullCheck(json, "NS3", "0");
  let NS4 = com_jsonNullCheck(json, "NS4", "0");
  let NS5 = com_jsonNullCheck(json, "NS5", "0");
  let NS6 = com_jsonNullCheck(json, "NS6", "0");
  let NM1 = com_jsonNullCheck(json, "NM1", "0");
  let NM2 = com_jsonNullCheck(json, "NM2", "0");
  let NM3 = com_jsonNullCheck(json, "NM3", "0");
  let NM4 = com_jsonNullCheck(json, "NM4", "0");
  let NM5 = com_jsonNullCheck(json, "NM5", "0");
  let NM6 = com_jsonNullCheck(json, "NM6", "0");
  {
    // 変数初期化
    SW2_Global_Initialize();
    money = com_jsonNullCheck(json, "money", money);
    race = com_jsonNullCheck(json, "shuzoku_name", race);
    gender = com_jsonNullCheck(json, "sex", gender);
    age = com_jsonNullCheck(json, "age", age);
  }
  {
    // 技能レベルの格納
    for (let i = 0; i < sw25GinouLv.length; i++) {
      sw25GinouLv[i] = parseInt(
        com_jsonNullCheck(json, "V_GLv" + String(i + 1), sw25GinouLv[i]),
      );
      sw25GinouLvUpper[i] = Math.min(sw25GinouLv[i], 17);
    }
    if (sw25GinouLv[4] > 0 && sw25GinouLv[5] > 0) {
      if (sw25GinouLv[4] <= sw25GinouLv[5]) {
        // ウィザード
        wizMin = sw25GinouLv[4];
        wizMax = sw25GinouLv[5];
      } else {
        wizMin = sw25GinouLv[5];
        wizMax = sw25GinouLv[4];
      }
    }
  }

  let txt_AutoST = "";
  let txt_ChoiseST = "";
  //自動習得
  for (let i = 0; i < sw25AutoSTprop.length; i++) {
    txt_AutoST = txt_AutoST + com_jsonNullCheck(json, sw25AutoSTprop[i], "");
    if (!txt_AutoST.endsWith(" ")) {
      // 空白で終わっていない場合（項目に合致するJSONデータが存在した場合
      txt_AutoST = txt_AutoST + " ";
    }
  }
  //選択習得
  for (let i = 0; i < json.ST_name.length; i++) {
    if (json.ST_name[i] != "") {
      if (json.ST_name[i].startsWith("必殺攻撃")) {
        hissatsuFlg = true;
      }
      if (
        json.ST_name[i].startsWith("クルードテイク") ||
        json.ST_name[i].startsWith("掠め取り")
      ) {
        //ヴァグランツ自動習得特技。各自動習得の戦闘特技と同じ前提名の時のみ自動習得に書く。
        if (
          json.ST_zentei[i].startsWith("スカ") ||
          json.ST_zentei[i].startsWith("ｽｶ")
        ) {
          txt_AutoST.replace("トレジャーハント", json.ST_name[i]);
          continue;
        } else if (
          json.ST_zentei[i].startsWith("レン") ||
          json.ST_zentei[i].startsWith("ﾚﾝ")
        ) {
          txt_AutoST.replace("サバイバリティ", json.ST_name[i]);
          continue;
        } else if (
          json.ST_zentei[i].startsWith("セー") ||
          json.ST_zentei[i].startsWith("ｾｰ")
        ) {
          txt_AutoST.replace("鋭い目", json.ST_name[i]);
          continue;
        }
      }
      txt_ChoiseST = txt_ChoiseST + json.ST_name[i] + " ";
    }
  }
  {
    // 自動習得技能の算出
    /*    sw25AutoSTFlg[0] = sw25_CheckAutoSTFlg(sw25GinouLv[0], 7);// タフネス
    sw25AutoSTFlg[1] = sw25_CheckAutoSTFlg(sw25GinouLv[1], 1);// 追加攻撃
    sw25AutoSTFlg[2] = sw25_CheckAutoSTFlg(sw25GinouLv[1], 7);// カウンター
    sw25AutoSTFlg[3] = sw25_CheckAutoSTFlg(sw25GinouLv[0], 13);// バトルマスター
    if(sw25AutoSTFlg[3] == 0){
      sw25AutoSTFlg[3] = sw25_CheckAutoSTFlg(sw25GinouLv[1], 13);// バトルマスター
    }
    for(let j = 0; j < sw25GinouName.length; j++ ){ // ルーンマスター
      if(sw25MagicGinou[j] == 0 ){
        continue;
      }
      else{
        sw25AutoSTFlg[4] = sw25_CheckAutoSTFlg(sw25GinouLv[j], 11);// ルーンマスター
        if(sw25AutoSTFlg[4] == 1){
          break;
        }
      }
    }
    sw25AutoSTFlg[5] = sw25_CheckAutoSTFlg(sw25GinouLv[9], 5);// トレジャーハント
    sw25AutoSTFlg[6] = sw25_CheckAutoSTFlg(sw25GinouLv[9], 7);// ファストアクション
    sw25AutoSTFlg[7] = sw25_CheckAutoSTFlg(sw25GinouLv[9], 9);// 影走り
    sw25AutoSTFlg[8] = sw25_CheckAutoSTFlg(sw25GinouLv[9], 12);// トレジャーマスター
    sw25AutoSTFlg[9] = sw25_CheckAutoSTFlg(sw25GinouLv[9], 15);// 匠の技
    sw25AutoSTFlg[10] = sw25_CheckAutoSTFlg(sw25GinouLv[10], 5);// サバイバビリティ
    sw25AutoSTFlg[11] = sw25_CheckAutoSTFlg(sw25GinouLv[10], 7);// 不屈
    sw25AutoSTFlg[12] = sw25_CheckAutoSTFlg(sw25GinouLv[10], 9);// ポーションマスター
    sw25AutoSTFlg[13] = sw25_CheckAutoSTFlg(sw25GinouLv[10], 12);// 縮地
    sw25AutoSTFlg[14] = sw25_CheckAutoSTFlg(sw25GinouLv[10], 15);// ランアンドガン
    sw25AutoSTFlg[15] = sw25_CheckAutoSTFlg(sw25GinouLv[11], 5);// 鋭い目
    sw25AutoSTFlg[16] = sw25_CheckAutoSTFlg(sw25GinouLv[11], 7);// 弱点看破
    sw25AutoSTFlg[17] = sw25_CheckAutoSTFlg(sw25GinouLv[11], 9);// マナセーブ
    sw25AutoSTFlg[18] = sw25_CheckAutoSTFlg(sw25GinouLv[11], 12);// マナ耐性
    sw25AutoSTFlg[19] = sw25_CheckAutoSTFlg(sw25GinouLv[11], 15);// 賢人の知恵
*/
  }
  {
    // テキスト生成処理
    var text =
      '{ "kind": "character", "data": { \n"name": "' + json.pc_name + '",';
    {
      // メモ作成
      if (memoFlg) {
        text = text + '\n"memo": "PL：○○\\n';
        text = text + "種族：";
        text = text + race;
        text = text + "　性別：";
        text = text + gender;
        text = text + "　年齢：";
        text = text + age;
        if (sw25_levelFlg) {
          text = text + "\\n＝＝＝＝＝技能＝＝＝＝＝\\n";
          for (let j = 0; j < sw25GinouLv.length; j++) {
            if (sw25GinouLv[j] > 0) {
              text = text + sw25GinouName[j] + "：" + sw25GinouLv[j] + " ";
            }
          }
        }
        if (sw25_skillFlg) {
          text = text + "\\n＝＝＝＝＝自動習得の戦闘特技＝＝＝＝＝\\n";
          text = text + txt_AutoST;
          text = text + "\\n＝＝＝＝＝選択習得の戦闘特技＝＝＝＝＝\\n";
          text = text + txt_ChoiseST;
        }
        if (sw25_itemFlg) {
          text = text + "\\n＝＝＝＝＝所持品＝＝＝＝＝\\n";
          text = text + "所持金:" + money + "G\\n";
          for (let j = 0; j < json.item_name.length; j++) {
            if (
              json.item_name[j] != "" &&
              !(json.item_num[j] == "" || json.item_num[j] == "0")
            ) {
              text =
                text +
                json.item_name[j] +
                " " +
                json.item_num[j] +
                "個 " +
                json.item_memo[j] +
                "\\n";
            }
          }
        }
        text = text + '\\n",';
      }
    }
    {
      // 参照URL設定
      if (urlFlg) {
        text = text + '\n"externalUrl":"' + $('input[id="url"]').val() + '",';
      }
    }
    {
      // ステータス・パラメータ作成
      text = text + '\n"status":[';
      text =
        text +
        '\n{"label":"HP","value":"' +
        json.HP +
        '","max":"' +
        json.HP +
        '"},';
      text =
        text +
        '\n{"label":"MP","value":"' +
        json.MP +
        '","max":"' +
        json.MP +
        '"},';
      text =
        text +
        '\n{"label":"防護点","value":"' +
        json.bougo +
        '","max":"' +
        json.bougo +
        '"}';
      text = text + "],";
      text = text + '\n"params":[';
      text =
        text +
        '\n{"label":"器用","value":"' +
        String(
          parseInt(N_waza) + parseInt(V_NC1) + parseInt(NS1) + parseInt(NM1),
        ) +
        '"},';
      text =
        text +
        '\n{"label":"敏捷","value":"' +
        String(
          parseInt(N_waza) + parseInt(V_NC2) + parseInt(NS2) + parseInt(NM2),
        ) +
        '"},';
      text =
        text +
        '\n{"label":"筋力","value":"' +
        String(
          parseInt(N_karada) + parseInt(V_NC3) + parseInt(NS3) + parseInt(NM3),
        ) +
        '"},';
      text =
        text +
        '\n{"label":"生命","value":"' +
        String(
          parseInt(N_karada) + parseInt(V_NC4) + parseInt(NS4) + parseInt(NM4),
        ) +
        '"},';
      text =
        text +
        '\n{"label":"知力","value":"' +
        String(
          parseInt(N_kokoro) + parseInt(V_NC5) + parseInt(NS5) + parseInt(NM5),
        ) +
        '"},';
      text =
        text +
        '\n{"label":"精神","value":"' +
        String(
          parseInt(N_kokoro) + parseInt(V_NC6) + parseInt(NS6) + parseInt(NM6),
        ) +
        '"},';
      text = text + '\n{"label":"冒険者レベル","value":"' + json.lv + '"},';
      text =
        text + '\n{"label":"生命抵抗","value":"' + json.life_resist + '"},';
      text =
        text + '\n{"label":"精神抵抗","value":"' + json.mental_resist + '"},';
      for (let j = 0; j < sw25GinouName.length; j++) {
        // ルーンマスター
        if (sw25GinouLv[j] == 0 || sw25GinouLv[j] === undefined) {
          continue;
        } else {
          text =
            text +
            '\n{"label":"' +
            sw25GinouName[j] +
            '","value":"' +
            sw25GinouLv[j] +
            '"},';
        }
      }
      if (wizMin > 0) {
        text = text + '\n{"label":"ウィザード","value":"' + wizMax + '"},';
        text =
          text +
          '\n{"label":"深智魔法行使可能レベル","value":"' +
          wizMin +
          '"},';
      }
      text = text + '\n{"label":"回避","value":"' + json.kaihi + '"},';
      text = text + '\n{"label":"移動力","value":"' + json.ido + '"}';
      text = text + "],";
    }
    {
      // active設定(現状意味はない)
      text = text + '\n"active":true,';
    }
    {
      //「ステータスを非公開にする」の有効無効設定
      if (secretFlg) {
        text = text + '\n"secret":true,';
      } else {
        text = text + '\n"secret":false,';
      }
    }
    {
      //「発言時キャラクターを表示しない」の有効無効設定
      if (invisibleFlg) {
        text = text + '\n"invisible":true,';
      } else {
        text = text + '\n"invisible":false,';
      }
    }
    {
      //「盤面キャラクター一覧に表示しない」の有効無効設定
      if (hideStatusFlg) {
        text = text + '\n"hideStatus":true,';
      } else {
        text = text + '\n"hideStatus":false,';
      }
    }
    {
      // チャットパレット作成
      text = text + '\n"commands":"';
      if (!notChatPalletFlg) {
        if (userChatPalFlg) {
          text = text + inputChatPalette;
        } else {
          {
            // ステータス
            if (chatStatFlg) {
              text = text + "＝＝＝＝＝ステータス＝＝＝＝＝\\n";
              text = text + "{HP} 【現在HP】\\n";
              text = text + "{MP} 【現在MP】\\n";
              text = text + "{防護点} 【防護点】\\n";
            }
          }
          {
            // パラメータ
            if (chatParamFlg) {
              text = text + "＝＝＝＝＝パラメータ＝＝＝＝＝\\n";
              text = text + "c({器用}/6) 【器用ボーナス】\\n";
              text = text + "c({敏捷}/6) 【敏捷ボーナス】\\n";
              text = text + "c({筋力}/6) 【筋力ボーナス】\\n";
              text = text + "c({生命}/6) 【生命ボーナス】\\n";
              text = text + "c({知力}/6) 【知力ボーナス】\\n";
              text = text + "c({精神}/6) 【精神ボーナス】\\n";
              text = text + "{冒険者レベル} 【冒険者レベル】\\n";
              text = text + "{生命抵抗} 【生命抵抗力】\\n";
              text = text + "{精神抵抗} 【精神抵抗力】\\n";
              for (let j = 0; j < sw25GinouName.length; j++) {
                // ルーンマスター
                if (sw25GinouLv[j] == 0) {
                  continue;
                } else {
                  text =
                    text +
                    "{" +
                    sw25GinouName[j] +
                    "} 【" +
                    sw25GinouName[j] +
                    " レベル】\\n";
                }
              }
              if (wizMin > 0) {
                text = text + "{ウィザード} 【ウィザード レベル】\\n";
                text =
                  text +
                  "{深智魔法行使可能レベル} 【深智魔法行使可能レベル】\\n";
              }
              text = text + "{回避}\\n";
              text = text + "{移動力}\\n";
            }
          }
          {
            // 非戦闘系判定
            text = text + "＝＝＝＝＝非戦闘系判定＝＝＝＝＝ \\n";
            text = text + "2d6+{冒険者レベル}+({器用}/6) 冒険者＋器用 \\n";
            text = text + "2d6+{冒険者レベル}+({敏捷}/6) 冒険者＋敏捷 \\n";
            text = text + "2d6+{冒険者レベル}+({筋力}/6) 冒険者＋筋力 \\n";
            text = text + "2d6+{冒険者レベル}+({生命}/6) 冒険者＋生命力 \\n";
            text = text + "2d6+{冒険者レベル}+({知力}/6) 冒険者＋知力 \\n";
            text = text + "2d6+{冒険者レベル}+({精神}/6) 冒険者＋精神力 \\n\\n";
            if (sw25GinouLv[9] > 0) {
              text = text + "2d6+{スカウト}+({器用}/6) スカウト技巧 \\n";
              text = text + "2d6+{スカウト}+({敏捷}/6) スカウト運動 \\n";
              text = text + "2d6+{スカウト}+({知力}/6) スカウト観察 \\n\\n";
            }
            if (sw25GinouLv[10] > 0) {
              text = text + "2d6+{レンジャー}+({器用}/6) レンジャー技巧 \\n";
              text = text + "2d6+{レンジャー}+({敏捷}/6) レンジャー運動 \\n";
              text = text + "2d6+{レンジャー}+({知力}/6) レンジャー観察 \\n\\n";
            }
            if (sw25GinouLv[11] > 0) {
              text = text + "2d6+{セージ}+({知力}/6) セージ知識 \\n";
            }
            if (sw25GinouLv[13] > 0) {
              text = text + "2d6+{バード}+({知力}/6) バード知識 \\n";
            }
            if (sw25GinouLv[15] > 0) {
              text = text + "2d6+{ライダー}+({敏捷}/6) ライダー運動 \\n";
              text = text + "2d6+{ライダー}+({知力}/6) ライダー知識 \\n";
              text = text + "2d6+{ライダー}+({知力}/6) ライダー観察 \\n";
            }
            if (sw25GinouLv[14] > 0) {
              text =
                text + "2d6+{アルケミスト}+({知力}/6) アルケミスト知識 \\n";
            }
            if (sw25GinouLv[24] > 0) {
              text =
                text + "2d6+{ジオマンサー}+({知力}/6) ジオマンサー観察 \\n";
            }
          }
          {
            // 技能判定
            text = text + "\\n＝＝＝＝＝技能判定＝＝＝＝＝ \\n";
            {
              // バード
              if (sw25GinouLv[13] > 0) {
                text =
                  text +
                  "2d6+{バード}+({精神}/6)+" +
                  json.ejuka_hit_extend +
                  " 呪歌演奏 \\n";
                text =
                  text +
                  "k10+{バード}+({精神}/6)+" +
                  json.ejuka_hit_extend +
                  " ダメージ／呪歌 \\n";
                text =
                  text +
                  "k10+{バード}+({精神}/6)+" +
                  json.ejuka_hit_extend +
                  "H+0 半減／呪歌 \\n";
              }
              if (sw25GinouLv[13] >= 5) {
                text =
                  text +
                  "k20+{バード}+({精神}/6)+" +
                  json.ejuka_hit_extend +
                  " ダメージ／呪歌 \\n";
                text =
                  text +
                  "k20+{バード}+({精神}/6)+" +
                  json.ejuka_hit_extend +
                  "H+0 半減／呪歌 \\n";
              }
              if (sw25GinouLv[13] >= 10) {
                text =
                  text +
                  "k30+{バード}+({精神}/6)+" +
                  json.ejuka_hit_extend +
                  " ダメージ／呪歌 \\n";
                text =
                  text +
                  "k30+{バード}+({精神}/6)+" +
                  json.ejuka_hit_extend +
                  "H+0 半減／呪歌 \\n";
              }
              if (sw25GinouLv[13] >= 1) {
                text =
                  text +
                  "k0[13]+{バード}+({精神}/6)+" +
                  json.ejuka_hit_extend +
                  " 回復量／呪歌 \\n";
              }
              if (sw25GinouLv[13] >= 5) {
                text =
                  text +
                  "k10[13]+{バード}+({精神}/6)+" +
                  json.ejuka_hit_extend +
                  " 回復量／呪歌 \\n";
              }
              if (sw25GinouLv[13] >= 1) {
                text =
                  text +
                  "k20[13]+{バード}+({精神}/6)+" +
                  json.ejuka_hit_extend +
                  " 回復量／呪歌 \\n";
              }
              if (sw25GinouLv[13] >= 5) {
                text =
                  text +
                  "k30[13]+{バード}+({精神}/6)+" +
                  json.ejuka_hit_extend +
                  " 回復量／呪歌 \\n";
              }
              if (sw25GinouLv[13] >= 10) {
                text =
                  text +
                  "k40[13]+{バード}+({精神}/6)+" +
                  json.ejuka_hit_extend +
                  " 回復量／呪歌 \\n";
              }
            }
            {
              // アルケミスト
              if (sw25GinouLv[14] > 0) {
                text = text + "2d6+{アルケミスト}+({知力}/6) 賦術 \\n";
              }
            }
          }
          {
            // 戦闘前判定
            text = text + "\\n＝＝＝＝＝戦闘前判定＝＝＝＝＝ \\n";
            if (sw25GinouLv[9] > 0) {
              text =
                text +
                "2d6+{スカウト}+({敏捷}/6)+" +
                json.sensei_mod +
                " スカウト先制力 \\n";
            }
            if (sw25GinouLv[17] > 0) {
              text =
                text +
                "2d6+{ウォーリーダー}+({敏捷}/6)+" +
                json.sensei_mod +
                " ウォーリーダー先制力 \\n";
              text =
                text +
                "2d6+{ウォーリーダー}+({知力}/6)+1+" +
                json.sensei_mod +
                " ウォーリーダー先制力(軍師の知略) \\n";
            }
            if (sw25GinouLv[11] > 0) {
              text =
                text +
                "2d6+{セージ}+({知力}/6)+" +
                json.mamono_chishiki_mod +
                " セージ魔物知識 \\n";
            }
            if (sw25GinouLv[15] > 0) {
              text =
                text +
                "2d6+{ライダー}+({知力}/6)+" +
                json.mamono_chishiki_mod +
                " ライダー魔物知識 \\n";
            }
          }
          {
            // 戦闘中判定
            text = text + "\\n＝＝＝＝＝戦闘中判定＝＝＝＝＝ \\n";
            text = text + "2d6+{生命抵抗} 生命抵抗力 \\n";
            text = text + "2d6+{精神抵抗} 精神抵抗力 \\n";
            text = text + "2d6+{回避} 回避力 \\n";
          }
          {
            // 基本の命中判定
            if (json.arms_hit_tokugi == "") {
              json.arms_hit_tokugi = "0";
            }
            if (sw25GinouLv[0] > 0) {
              text =
                text +
                "2d6+{ファイター}+({器用}/6)+" +
                json.arms_hit_tokugi +
                " ファイター命中 \\n";
            }
            if (sw25GinouLv[1] > 0) {
              text =
                text +
                "2d6+{グラップラー}+({器用}/6)+" +
                json.arms_hit_tokugi +
                " グラップラー命中 \\n";
            }
            if (sw25GinouLv[2] > 0) {
              text =
                text +
                "2d6+{フェンサー}+({器用}/6)+" +
                json.arms_hit_tokugi +
                " フェンサー命中 \\n";
            }
            if (sw25GinouLv[3] > 0) {
              text =
                text +
                "2d6+{シューター}+({器用}/6)+" +
                json.arms_hit_tokugi +
                " シューター命中 \\n";
            }
            if (sw25GinouLv[25] > 0) {
              text =
                text +
                "2d6+{バトルダンサー}+({器用}/6)+" +
                json.arms_hit_tokugi +
                " バトルダンサー命中 \\n";
            }
          }
          {
            // 武器毎命中・ダメージ
            for (let j = 0; j < json.arms_name.length; j++) {
              if (json.arms_hit_mod[j] == "") {
                json.arms_hit_mod[j] = "0";
              }
              if (json.arms_damage_mod[j] == "") {
                json.arms_damage_mod[j] = "0";
              }
              if (json.arms_cate[j] != "" && json.arms_critical[j] != "") {
                let weaponMeleeFlg = false;
                for (let k = 0; k < sw25ArmType.length; k++) {
                  if (!(sw25ArmType[k] == json.arms_cate[j])) {
                    continue;
                  }
                  if ((sw25ArmMeleeType[k] = 1)) {
                    weaponMeleeFlg = true;
                  }
                  text = text + "2d6+";
                  text =
                    text +
                    json.arms_hit[j] +
                    " " +
                    json.arms_name[j] +
                    "命中 \\n";
                  if (k == 11) {
                    // ガン
                    if (dam_bullet[sw25GinouLv[8]]?.length !== undefined) {
                      for (
                        i = 0;
                        i <= dam_bullet[sw25GinouLv[8]].length - 1;
                        i++
                      ) {
                        text =
                          text +
                          "k" +
                          dam_bullet[sw25GinouLv[8]][i] +
                          "[" +
                          json.arms_critical[j] +
                          "]+" +
                          json.arms_damage[j] +
                          " " +
                          json.arms_name[j] +
                          "ダメージ \\n";
                      } /*
                      if(sw25GinouLv[8] >= 2) {
                        text = text + "k20[("+json.arms_critical[j]+"-1)]+"+json.arms_damage[j]+" "+json.arms_name[j]+"【クリティカル・バレット】ダメージ \\n";
                      }
                      if(sw25GinouLv[8] >= 9) {
                        text = text + "k30[("+json.arms_critical[j]+"-1)]+"+json.arms_damage[j]+" "+json.arms_name[j]+"【レーザー・バレット】ダメージ \\n";
                      }*/
                    }
                    if (heal_bullet[sw25GinouLv[8]]?.length !== undefined) {
                      for (
                        i = 0;
                        i <= heal_bullet[sw25GinouLv[8]].length - 1;
                        i++
                      ) {
                        text =
                          text +
                          "k" +
                          heal_bullet[sw25GinouLv[8]][i] +
                          "[13]+" +
                          json.arms_damage[j] +
                          " " +
                          json.arms_name[j] +
                          "回復量 \\n";
                      }
                    }
                    break;
                  } else {
                    text =
                      text +
                      "k" +
                      json.arms_iryoku[j] +
                      "＠" +
                      json.arms_critical[j] +
                      "+" +
                      json.arms_damage[j] +
                      " " +
                      json.arms_name[j] +
                      "ダメージ \\n";
                    break;
                  }
                }
              }
            }
          }
          {
            // 魔法技能系の判定（魔法行使、ダメージ、回復等）
            text = text + "\\n\\n＝＝＝＝＝魔法系判定＝＝＝＝＝ \\n";
            {
              // ソーサラー
              if (sw25GinouLvUpper[4] > 0) {
                text =
                  text +
                  "＝＝＝真語魔法＝＝＝\\n2d6+{ソーサラー}+({知力}/6)+" +
                  json.arms_maryoku_sum +
                  "+" +
                  json.MM_Tokugi +
                  "+" +
                  json.MM5 +
                  " 真語魔法行使 \\n";
              }
              if (dam_sor[sw25GinouLvUpper[4] - 1]?.length !== undefined) {
                for (
                  i = 0;
                  i <= dam_sor[sw25GinouLvUpper[4] - 1].length - 1;
                  i++
                ) {
                  text =
                    text +
                    "k" +
                    dam_sor[sw25GinouLvUpper[4] - 1][i] +
                    "[10]+{ソーサラー}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM5 +
                    " ダメージ／真語魔法 \\n";
                  text =
                    text +
                    "k" +
                    dam_sor[sw25GinouLvUpper[4] - 1][i] +
                    "[13]+{ソーサラー}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM5 +
                    "H+0 半減／真語魔法 \\n";
                }
                if (sw25GinouLvUpper[4] >= 12) {
                  text =
                    text +
                    "k40[9]+{ソーサラー}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM5 +
                    " 【シャイニング・スポット】ダメージ／真語魔法 \\n";
                }
              }
            }
            {
              // コンジャラー
              if (sw25GinouLvUpper[5] > 0) {
                text =
                  text +
                  "＝＝＝操霊魔法＝＝＝\\n2d6+{コンジャラー}+({知力}/6)+" +
                  json.arms_maryoku_sum +
                  "+" +
                  json.MM_Tokugi +
                  "+" +
                  json.MM6 +
                  " 操霊魔法行使 \\n";
              }
              if (dam_con[sw25GinouLvUpper[5] - 1]?.length !== undefined) {
                for (
                  i = 0;
                  i <= dam_con[sw25GinouLvUpper[5] - 1].length - 1;
                  i++
                ) {
                  text =
                    text +
                    "k" +
                    dam_con[sw25GinouLvUpper[5] - 1][i] +
                    "[10]+{コンジャラー}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM6 +
                    " ダメージ／操霊魔法 \\n";
                  text =
                    text +
                    "k" +
                    dam_con[sw25GinouLvUpper[5] - 1][i] +
                    "[13]+{コンジャラー}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM6 +
                    "H+0 半減／操霊魔法 \\n";
                }
              }
              if (heal_con[sw25GinouLvUpper[5] - 1]?.length !== undefined) {
                for (
                  i = 0;
                  i <= heal_con[sw25GinouLvUpper[5] - 1].length - 1;
                  i++
                ) {
                  text =
                    text +
                    "k" +
                    heal_con[sw25GinouLvUpper[5] - 1][i] +
                    "[13]+{コンジャラー}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM6 +
                    " 回復量／操霊魔法 \\n";
                }
              }
            }
            {
              // プリースト
              if (sw25GinouLvUpper[6] > 0) {
                text =
                  text +
                  "＝＝＝神聖魔法＝＝＝\\n2d6+{プリースト}+({知力}/6)+" +
                  json.arms_maryoku_sum +
                  "+" +
                  json.MM_Tokugi +
                  "+" +
                  json.MM7 +
                  " 神聖魔法行使 \\n";
              }
              if (dam_pri[sw25GinouLvUpper[6] - 1]?.length !== undefined) {
                for (
                  i = 0;
                  i <= dam_pri[sw25GinouLvUpper[6] - 1].length - 1;
                  i++
                ) {
                  text =
                    text +
                    "k" +
                    dam_pri[sw25GinouLvUpper[6] - 1][i] +
                    "[10]+{プリースト}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM7 +
                    " ダメージ／神聖魔法 \\n";
                  text =
                    text +
                    "k" +
                    dam_pri[sw25GinouLvUpper[6] - 1][i] +
                    "[13]+{プリースト}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM7 +
                    "H+0 半減／神聖魔法 \\n";
                }
              }
              if (heal_pri[sw25GinouLvUpper[6] - 1]?.length !== undefined) {
                for (
                  i = 0;
                  i <= heal_pri[sw25GinouLvUpper[6] - 1].length - 1;
                  i++
                ) {
                  text =
                    text +
                    "k" +
                    heal_pri[sw25GinouLvUpper[6] - 1][i] +
                    "[13]+{プリースト}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM7 +
                    " 回復量／神聖魔法 \\n";
                }
              }
            }
            {
              // マギテック
              if (sw25GinouLvUpper[8] > 0) {
                text =
                  text +
                  "＝＝＝魔動機術＝＝＝\\n2d6+{マギテック}+({知力}/6)+" +
                  json.arms_maryoku_sum +
                  "+" +
                  json.MM_Tokugi +
                  "+" +
                  json.MM9 +
                  " 魔動機術行使 \\n";
              }
              if (dam_mag[sw25GinouLvUpper[8] - 1]?.length !== undefined) {
                for (
                  i = 0;
                  i <= dam_mag[sw25GinouLvUpper[8] - 1].length - 1;
                  i++
                ) {
                  text =
                    text +
                    "k" +
                    dam_mag[sw25GinouLvUpper[8] - 1][i] +
                    "[10]+{マギテック}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM9 +
                    " ダメージ／魔動機術 \\n";
                  text =
                    text +
                    "k" +
                    dam_mag[sw25GinouLvUpper[8] - 1][i] +
                    "[13]+{マギテック}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM9 +
                    "H+0 半減／魔動機術 \\n";
                }
                if (sw25GinouLvUpper[8] >= 8) {
                  text =
                    text +
                    "k50[10]+{マギテック}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM9 +
                    " 【パイルシューター】ダメージ／魔動機術 \\n";
                }
                if (sw25GinouLvUpper[8] >= 14) {
                  text =
                    text +
                    "k100[10]+{マギテック}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM9 +
                    " 【オメガシューター】ダメージ／魔動機術 \\n";
                }
              }
              if (heal_mag[sw25GinouLvUpper[8] - 1]?.length !== undefined) {
                for (
                  i = 0;
                  i <= heal_mag[sw25GinouLvUpper[8] - 1].length - 1;
                  i++
                ) {
                  text =
                    text +
                    "k" +
                    heal_mag[sw25GinouLvUpper[8] - 1][i] +
                    "[13]+{マギテック}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM9 +
                    " 回復量／魔動機術 \\n";
                }
              }
            }
            {
              // フェアリーテイマー
              if (sw25GinouLvUpper[7] > 0) {
                text =
                  text +
                  "＝＝＝妖精魔法＝＝＝\\n2d6+{フェアリーテイマー}+({知力}/6)+" +
                  json.arms_maryoku_sum +
                  "+" +
                  json.MM_Tokugi +
                  "+" +
                  json.MM8 +
                  " 妖精魔法行使 \\n";
              }
              if (dam_fai[sw25GinouLvUpper[7] - 1]?.length !== undefined) {
                for (
                  i = 0;
                  i <= dam_fai[sw25GinouLvUpper[7] - 1].length - 1;
                  i++
                ) {
                  text =
                    text +
                    "k" +
                    dam_fai[sw25GinouLvUpper[7] - 1][i] +
                    "[10]+{フェアリーテイマー}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM8 +
                    " ダメージ／妖精魔法 \\n";
                  text =
                    text +
                    "k" +
                    dam_fai[sw25GinouLvUpper[7] - 1][i] +
                    "[13]+{フェアリーテイマー}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM8 +
                    "H+0 半減／妖精魔法 \\n";
                }
              }
            }
            {
              // ドルイド
              if (sw25GinouLvUpper[23] > 0) {
                text =
                  text +
                  "＝＝＝森羅魔法＝＝＝\\n2d6+{ドルイド}+({知力}/6)+" +
                  json.arms_maryoku_sum +
                  "+" +
                  json.MM_Tokugi +
                  "+" +
                  json.MM24 +
                  " 森羅魔法行使 \\n";
              }
              if (dam_dru[sw25GinouLvUpper[23] - 1]?.length !== undefined) {
                for (
                  i = 0;
                  i <= dam_dru[sw25GinouLvUpper[23] - 1].length - 1;
                  i++
                ) {
                  text =
                    text +
                    "k" +
                    dam_dru[sw25GinouLvUpper[23] - 1][i] +
                    "[10]+{ドルイド}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM24 +
                    " ダメージ／森羅魔法 \\n";
                  text =
                    text +
                    "k" +
                    dam_dru[sw25GinouLvUpper[23] - 1][i] +
                    "[13]+{ドルイド}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM24 +
                    "H+0 半減／森羅魔法 \\n";
                }
              }
              if (phy_dru[sw25GinouLvUpper[23] - 1]?.length !== undefined) {
                for (
                  i = 0;
                  i <= phy_dru[sw25GinouLvUpper[23] - 1].length - 1;
                  i++
                ) {
                  text =
                    text +
                    "Dru[" +
                    phy_dru[sw25GinouLvUpper[23] - 1][i] +
                    "]+{ドルイド}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM24 +
                    " ダメージ／森羅魔法 \\n";
                }
              }
              if (sw25GinouLvUpper[23] >= 2) {
                text = text + "k10＠13 【ナチュラルパワー】／森羅魔法 \\n";
              }
              if (sw25GinouLvUpper[23] >= 12) {
                text = text + "k30＠13 【ナチュラルパワーⅡ】／森羅魔法 \\n";
              }
            }
            {
              // デーモンルーラー
              if (sw25GinouLvUpper[16] > 0) {
                text =
                  text +
                  "＝＝＝召異魔法＝＝＝\\n2d6+{デーモンルーラー}+({知力}/6)+" +
                  json.arms_maryoku_sum +
                  "+" +
                  json.MM_Tokugi +
                  "+" +
                  json.MM17 +
                  " 召異魔法行使 \\n";
              }
              if (dam_dem[sw25GinouLvUpper[16] - 1]?.length !== undefined) {
                for (
                  i = 0;
                  i <= dam_dem[sw25GinouLvUpper[16] - 1].length - 1;
                  i++
                ) {
                  text =
                    text +
                    "k" +
                    dam_dem[sw25GinouLvUpper[16] - 1][i] +
                    "[10]+{デーモンルーラー}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM17 +
                    " ダメージ／召異魔法 \\n";
                  text =
                    text +
                    "k" +
                    dam_dem[sw25GinouLvUpper[16] - 1][i] +
                    "[13]+{デーモンルーラー}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM17 +
                    "H+0 半減／召異魔法 \\n";
                }
                if (sw25GinouLvUpper[16] >= 11) {
                  text =
                    text +
                    "k50+{デーモンルーラー}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM17 +
                    " ダメージ／デモンズブレード \\n";
                }
                if (sw25GinouLvUpper[16] >= 14) {
                  text =
                    text +
                    "k70+{デーモンルーラー}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    json.MM17 +
                    " ダメージ／デモンズブレード \\n";
                }
              }
            }
            {
              // ウィザード
              let wizpower = "";
              if (wizMin > 0) {
                text =
                  text +
                  "＝＝＝深智魔法＝＝＝\\n2d6+{ウィザード}+({知力}/6) 深智魔法行使 \\n";
                if (parseInt(json.MM5) > parseInt(json.MM6)) {
                  wizpower = json.MM5;
                } else {
                  wizpower = json.MM6;
                }
              }
              if (dam_wiz[wizMin]?.length !== undefined) {
                for (i = 0; i <= dam_wiz[wizMin].length - 1; i++) {
                  text =
                    text +
                    "k" +
                    dam_wiz[wizMin][i] +
                    "[10]+{ウィザード}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    wizpower +
                    " ダメージ／深智魔法 \\n";
                  text =
                    text +
                    "k" +
                    dam_wiz[wizMin][i] +
                    "[13]+{ウィザード}+({知力}/6)+" +
                    json.arms_maryoku_sum +
                    "+" +
                    json.MM_Tokugi +
                    "+" +
                    wizpower +
                    "H+0 半減／深智魔法 \\n";
                }
              }
            }
            {
              // アビスゲイザー
              if (sw25GinouLvUpper[26] > 0) {
                text =
                  text +
                  "＝＝＝奈落魔法＝＝＝\\n2d6+{アビスゲイザー}+({知力}/6)+" +
                  json.arms_maryoku_sum +
                  "+" +
                  json.MM_Tokugi +
                  "+" +
                  json.MM27 +
                  " 奈落魔法行使 \\n";
              }
              for (
                i = 0;
                i <= dam_abyss[sw25GinouLvUpper[26] - 1].length - 1;
                i++
              ) {
                text =
                  text +
                  "k" +
                  dam_abyss[sw25GinouLvUpper[26] - 1][i] +
                  "[10]+{アビスゲイザー}+({知力}/6)+" +
                  json.arms_maryoku_sum +
                  "+" +
                  json.MM_Tokugi +
                  "+" +
                  json.MM27 +
                  " ダメージ／奈落魔法 \\n";
                text =
                  text +
                  "k" +
                  dam_abyss[sw25GinouLvUpper[26] - 1][i] +
                  "[13]+{アビスゲイザー}+({知力}/6)+" +
                  json.arms_maryoku_sum +
                  "+" +
                  json.MM_Tokugi +
                  "+" +
                  json.MM27 +
                  "H+0 半減／奈落魔法 \\n";
              }
              for (
                i = 0;
                i <= heal_abyss[sw25GinouLvUpper[26] - 1].length - 1;
                i++
              ) {
                text =
                  text +
                  "k" +
                  heal_abyss[sw25GinouLvUpper[26] - 1][i] +
                  "[13]+{アビスゲイザー}+({知力}/6)+" +
                  json.arms_maryoku_sum +
                  "+" +
                  json.MM_Tokugi +
                  "+" +
                  json.MM27 +
                  " 回復量／奈落魔法 \\n";
              }
            }
            /*            
            {// ビブリオマンサー
              if(sw25GinouLv[28] > 0 ){
                text = text + "＝＝＝秘奥魔法＝＝＝\\n2d6+{アビスゲイザー}+({知力}/6)+"+json.arms_maryoku_sum+"+"+json.MM_Tokugi+"+"+json.MM29+" 秘奥魔法行使 \\n";
              }
              for(i=0; i <= dam_bib[sw25GinouLv[28]-1].length - 1; i++){
                text = text + "k"+dam_bib[sw25GinouLv[28]-1][i]+"[10]+{アビスゲイザー}+({知力}/6)+"+json.arms_maryoku_sum+"+"+json.MM_Tokugi+"+"+json.MM29+" ダメージ／秘奥魔法 \\n";
                text = text + "k"+dam_bib[sw25GinouLv[28]-1][i]+"[13]+{アビスゲイザー}+({知力}/6)+"+json.arms_maryoku_sum+"+"+json.MM_Tokugi+"+"+json.MM29+"H+0 半減／秘奥魔法 \\n";
              }
              for(i=0; i <= heal_bib[sw25GinouLv[28]-1].length - 1; i++){
                text = text + "k"+heal_bib[sw25GinouLv[28]-1][i]+"[13]+{アビスゲイザー}+({知力}/6)+"+json.arms_maryoku_sum+"+"+json.MM_Tokugi+"+"+json.MM29+" 回復量／秘奥魔法 \\n";
              }
              if(sw25GinouLv[28] >= 7){
                text = text + "k40[13] 回復量／秘奥魔法 \\n";
              }
            }
*/
            {
              // 練技
              if (json.ES_name.length > 0) {
                let firstflag = true;
                for (let j = 0; j < json.ES_name.length; j++) {
                  if (json.ES_name[j] != "") {
                    if (firstflag == true) {
                      text = text + "\\n＝＝＝＝＝練技＝＝＝＝＝\\n";
                      firstflag = false;
                    }
                    text = text + json.ES_name[j] + "\\n";
                  }
                }
              }
            }
            {
              // 呪歌
              if (json.JK_name.length > 0) {
                let firstflag = true;
                for (let j = 0; j < json.JK_name.length; j++) {
                  if (json.JK_name[j] != "") {
                    if (firstflag == true) {
                      text = text + "\\n＝＝＝＝＝呪歌＝＝＝＝＝\\n";
                      firstflag = false;
                    }
                    text = text + json.JK_name[j] + "\\n";
                  }
                }
              }
            }
            {
              // 騎芸
              if (json.KG_name.length > 0) {
                let firstflag = true;
                for (let j = 0; j < json.KG_name.length; j++) {
                  if (json.KG_name[j] != "") {
                    if (firstflag == true) {
                      text = text + "\\n＝＝＝＝＝騎芸＝＝＝＝＝\\n";
                      firstflag = false;
                    }
                    text = text + json.KG_name[j] + "\\n";
                  }
                }
              }
            }
            {
              // 賦術
              if (json.HJ_name.length > 0) {
                let firstflag = true;
                for (let j = 0; j < json.HJ_name.length; j++) {
                  if (json.HJ_name[j] != "") {
                    if (firstflag == true) {
                      text = text + "\\n＝＝＝＝＝賦術＝＝＝＝＝\\n";
                      firstflag = false;
                    }
                    text = text + json.HJ_name[j] + "\\n";
                  }
                }
              }
            }
            {
              // 鼓咆／陣率
              if (json.HO_name.length > 0) {
                let firstflag = true;
                for (let j = 0; j < json.HO_name.length; j++) {
                  if (json.HO_name[j] != "") {
                    if (firstflag == true) {
                      text = text + "\\n＝＝＝＝＝鼓咆／陣率＝＝＝＝＝\\n";
                      firstflag = false;
                    }
                    text = text + json.HO_name[j] + "\\n";
                  }
                }
              }
            }
          }
        }
      }
      text = text + '"';
    }
    text = text + "\n}";
    text = text + "\n}";
  }
  $('textarea[id="charapiece"]').val(text);
}
/*
 * ソードワールド2.0(2.5) ゆとシートver
 */
function Make_SW2_ByYuto(json) {
  // #region スカラー変数定義
  let money = "0";
  let race = "";
  let gender = "";
  let age = "";
  let monsterLoreAdd = "0";
  let iniAdd = "0";
  let magicCastAdd = "0";
  let magicPowerAdd = "0";
  let magicDamageAdd = "0";
  let magicCastAddAlc = "0";
  let magicCastAddAby = "0";
  let magicCastAddBar = "0";
  let magicCastAddBib = "0";
  let magicCastAddCon = "0";
  let magicCastAddDar = "0";
  let magicCastAddDem = "0";
  let magicCastAddDru = "0";
  let magicCastAddFai = "0";
  let magicCastAddGri = "0";
  let magicCastAddMag = "0";
  let magicCastAddMys = "0";
  let magicCastAddPri = "0";
  let magicCastAddSor = "0";
  let magicCastAddWiz = "0";
  let magicDamageAddAby = "0";
  let magicDamageAddBar = "0";
  let magicDamageAddBib = "0";
  let magicDamageAddCon = "0";
  let magicDamageAddDar = "0";
  let magicDamageAddDem = "0";
  let magicDamageAddDru = "0";
  let magicDamageAddFai = "0";
  let magicDamageAddGri = "0";
  let magicDamageAddMag = "0";
  let magicDamageAddPri = "0";
  let magicDamageAddSor = "0";
  let magicDamageAddWiz = "0";
  let magicPowerAddAby = "0";
  let magicPowerAddBar = "0";
  let magicPowerAddBib = "0";
  let magicPowerAddCon = "0";
  let magicPowerAddDar = "0";
  let magicPowerAddDem = "0";
  let magicPowerAddDru = "0";
  let magicPowerAddFai = "0";
  let magicPowerAddGri = "0";
  let magicPowerAddMag = "0";
  let magicPowerAddPri = "0";
  let magicPowerAddSor = "0";
  let magicPowerAddWiz = "0";
  let packAlcKnoAdd = "0";
  let packBarKnoAdd = "0";
  let packBibKnoAdd = "0";
  let packDarIntAdd = "0";
  let packGeoObsAdd = "0";
  let packRanAgiAdd = "0";
  let packRanObsAdd = "0";
  let packRanTecAdd = "0";
  let packRidAgiAdd = "0";
  let packRidKnoAdd = "0";
  let packRidObsAdd = "0";
  let packSagKnoAdd = "0";
  let packScoAgiAdd = "0";
  let packScoObsAdd = "0";
  let packScoTecAdd = "0";
  let packWarAgiAdd = "0";
  let packWarIntAdd = "0";
  let packWarIntAuto = "0";
  let hissatsuFlg = false;
  let critRayFlg = false;
  let chiryakuFlg = false;
  let ownAby = "0";
  let ownAlc = "0";
  let ownBar = "0";
  let ownBib = "0";
  let ownCon = "0";
  let ownDem = "0";
  let ownDru = "0";
  let ownFai = "0";
  let ownGri = "0";
  let ownMag = "0";
  let ownMys = "0";
  let ownPri = "0";
  let ownSor = "0";
  let ownWiz = "0";
  let sttAddA = "0";
  let sttAddB = "0";
  let sttAddC = "0";
  let sttAddD = "0";
  let sttAddE = "0";
  let sttAddF = "0";
  let sttEquipA = "0";
  let sttEquipB = "0";
  let sttEquipC = "0";
  let sttEquipD = "0";
  let sttEquipE = "0";
  let sttEquipF = "0";

  let weaponAcc = "0";
  let weaponDmg = "0";
  let weaponDmg_calc = "0";
  let weaponCate = "";
  let weaponCrit = "";
  let weaponRate = "";
  let weaponClass = "";
  let weaponOwn = "0";
  let weaponCateidx = -1;
  // #endregion
  // #region オブジェクト変数定義
  let sw25ArmAtk = {
    ファイター: {
      use_acc: "{ファイター}+(({器用})/6)",
      use_dam: function () {
        return "{ファイター}+(({筋力})/6)";
      },
    },
    グラップラー: {
      use_acc: "{グラップラー}+(({器用})/6)",
      use_dam: function () {
        return "{グラップラー}+(({筋力})/6)";
      },
    },
    フェンサー: {
      use_acc: "{フェンサー}+(({器用})/6)",
      use_dam: function () {
        return "{フェンサー}+(({筋力})/6)";
      },
    },
    バトルダンサー: {
      use_acc: "{バトルダンサー}+(({器用})/6)",
      use_dam: function () {
        return "{バトルダンサー}+(({筋力})/6)";
      },
    },
    シューター: {
      use_acc: "{シューター}+(({器用})/6)",
      use_dam: function () {
        if (weaponCate === "クロスボウ") {
          return "{シューター}";
        } else {
          return "{シューター}+(({筋力})/6)";
        }
      },
    }, //　クロスボウの時に筋力ボーナスの参照をリプレースで消す
    デーモンルーラー: {
      use_acc: "{デーモンルーラー}+(({器用})/6)",
      use_dam: function () {
        return (
          "{デーモンルーラー}+(({知力}" +
          ownDem +
          ")/6)+" +
          magicPowerAdd +
          "+" +
          magicPowerAddDem
        );
      },
    },
    エンハンサー: {
      use_acc: "{エンハンサー}+(({器用})/6)",
      use_dam: function () {
        return "{エンハンサー}+(({筋力})/6)";
      },
    },
    ダークハンター: {
      use_acc: "{ダークハンター}+(({精神})/6)",
      use_dam: function () {
        return "{ダークハンター}+(({精神})/6)";
      },
    },
    フィジカルマスター: {
      use_acc: "{フィジカルマスター}+(({器用})/6)",
      use_dam: function () {
        return "{フィジカルマスター}+(({筋力})/6)";
      },
    },
  };
  // #endregion

  {
    // 変数初期化
    SW2_Global_Initialize();
    money = com_jsonNullCheck(json, "moneyTotal", "0");
    race = com_jsonNullCheck(json, "race", "");
    gender = com_jsonNullCheck(json, "gender", "");
    age = com_jsonNullCheck(json, "age", "0");
    monsterLoreAdd = com_jsonNullCheck(json, "monsterLoreAdd", "0");
    iniAdd = com_jsonNullCheck(json, "initiativeAdd", "0");
    magicCastAddAby = com_jsonNullCheck(json, "magicCastAddAby", "0");
    magicCastAddAlc = com_jsonNullCheck(json, "magicCastAddAlc", "0");
    magicCastAddBar = com_jsonNullCheck(json, "magicCastAddBar", "0");
    magicCastAddBib = com_jsonNullCheck(json, "magicCastAddBib", "0");
    magicCastAddCon = com_jsonNullCheck(json, "magicCastAddCon", "0");
    magicCastAddDar = com_jsonNullCheck(json, "magicCastAddDar", "0");
    magicCastAddDem = com_jsonNullCheck(json, "magicCastAddDem", "0");
    magicCastAddDru = com_jsonNullCheck(json, "magicCastAddDru", "0");
    magicCastAddFai = com_jsonNullCheck(json, "magicCastAddFai", "0");
    magicCastAddGri = com_jsonNullCheck(json, "magicCastAddGri", "0");
    magicCastAddMag = com_jsonNullCheck(json, "magicCastAddMag", "0");
    magicCastAddMys = com_jsonNullCheck(json, "magicCastAddMys", "0");
    magicCastAddPri = com_jsonNullCheck(json, "magicCastAddPri", "0");
    magicCastAddSor = com_jsonNullCheck(json, "magicCastAddSor", "0");
    magicCastAddWiz = com_jsonNullCheck(json, "magicCastAddWiz", "0");
    magicDamageAddAby = com_jsonNullCheck(json, "magicDamageAddAby", "0");
    magicDamageAddBar = com_jsonNullCheck(json, "magicDamageAddBar", "0");
    magicDamageAddBib = com_jsonNullCheck(json, "magicDamageAddBib", "0");
    magicDamageAddCon = com_jsonNullCheck(json, "magicDamageAddCon", "0");
    magicDamageAddDar = com_jsonNullCheck(json, "magicDamageAddDar", "0");
    magicDamageAddDem = com_jsonNullCheck(json, "magicDamageAddDem", "0");
    magicDamageAddDru = com_jsonNullCheck(json, "magicDamageAddDru", "0");
    magicDamageAddFai = com_jsonNullCheck(json, "magicDamageAddFai", "0");
    magicDamageAddGri = com_jsonNullCheck(json, "magicDamageAddGri", "0");
    magicDamageAddMag = com_jsonNullCheck(json, "magicDamageAddMag", "0");
    magicDamageAddPri = com_jsonNullCheck(json, "magicDamageAddPri", "0");
    magicDamageAddSor = com_jsonNullCheck(json, "magicDamageAddSor", "0");
    magicDamageAddWiz = com_jsonNullCheck(json, "magicDamageAddWiz", "0");
    magicPowerAddAby = com_jsonNullCheck(json, "magicPowerAddAby", "0");
    magicPowerAddBar = com_jsonNullCheck(json, "magicPowerAddBar", "0");
    magicPowerAddBib = com_jsonNullCheck(json, "magicPowerAddBib", "0");
    magicPowerAddCon = com_jsonNullCheck(json, "magicPowerAddCon", "0");
    magicPowerAddDar = com_jsonNullCheck(json, "magicPowerAddDar", "0");
    magicPowerAddDem = com_jsonNullCheck(json, "magicPowerAddDem", "0");
    magicPowerAddDru = com_jsonNullCheck(json, "magicPowerAddDru", "0");
    magicPowerAddFai = com_jsonNullCheck(json, "magicPowerAddFai", "0");
    magicPowerAddGri = com_jsonNullCheck(json, "magicPowerAddGri", "0");
    magicPowerAddMag = com_jsonNullCheck(json, "magicPowerAddMag", "0");
    magicPowerAddPri = com_jsonNullCheck(json, "magicPowerAddPri", "0");
    magicPowerAddSor = com_jsonNullCheck(json, "magicPowerAddSor", "0");
    magicPowerAddWiz = com_jsonNullCheck(json, "magicPowerAddWiz", "0");
    packAlcKnoAdd = com_jsonNullCheck(json, "packAlcKnoAdd", "0");
    packBarKnoAdd = com_jsonNullCheck(json, "packBarKnoAdd", "0");
    packBibKnoAdd = com_jsonNullCheck(json, "packBibKnoAdd", "0");
    packGeoObsAdd = com_jsonNullCheck(json, "packGeoObsAdd", "0");
    packRanAgiAdd = com_jsonNullCheck(json, "packRanAgiAdd", "0");
    packRanObsAdd = com_jsonNullCheck(json, "packRanObsAdd", "0");
    packRanTecAdd = com_jsonNullCheck(json, "packRanTecAdd", "0");
    packRidAgiAdd = com_jsonNullCheck(json, "packRidAgiAdd", "0");
    packRidKnoAdd = com_jsonNullCheck(json, "packRidKnoAdd", "0");
    packDarIntAdd = com_jsonNullCheck(json, "packDarIntAdd", "0");
    packRidObsAdd = com_jsonNullCheck(json, "packRidObsAdd", "0");
    packSagKnoAdd = com_jsonNullCheck(json, "packSagKnoAdd", "0");
    packScoAgiAdd = com_jsonNullCheck(json, "packScoAgiAdd", "0");
    packScoObsAdd = com_jsonNullCheck(json, "packScoObsAdd", "0");
    packScoTecAdd = com_jsonNullCheck(json, "packScoTecAdd", "0");
    packWarAgiAdd = com_jsonNullCheck(json, "packWarAgiAdd", "0");
    packWarIntAdd = com_jsonNullCheck(json, "packWarIntAdd", "0");
    packWarIntAuto = com_jsonNullCheck(json, "packWarIntAuto", "0");
    magicPowerAdd = com_jsonNullCheck(json, "magicPowerAdd", "0");
    magicPowerAdd =
      magicPowerAdd +
      "+" +
      com_jsonNullCheck(json, "magicPowerEnhance", "0") +
      "+" +
      com_jsonNullCheck(json, "magicPowerEquip", "0") +
      "+" +
      com_jsonNullCheck(json, "raceAbilityMagicPower", "0");
    magicDamageAdd = com_jsonNullCheck(json, "magicDamageAdd", "0");
    magicCastAdd = com_jsonNullCheck(json, "magicCastAdd", "0");
    magicCastAdd =
      magicCastAdd + "+" + com_jsonNullCheck(json, "magicCastEquip", "0");
    sttAddA = com_jsonNullCheck(json, "sttAddA", "0");
    sttAddB = com_jsonNullCheck(json, "sttAddB", "0");
    sttAddC = com_jsonNullCheck(json, "sttAddC", "0");
    sttAddD = com_jsonNullCheck(json, "sttAddD", "0");
    sttAddE = com_jsonNullCheck(json, "sttAddE", "0");
    sttAddF = com_jsonNullCheck(json, "sttAddF", "0");
    sttEquipA = com_jsonNullCheck(json, "sttEquipA", "0");
    sttEquipB = com_jsonNullCheck(json, "sttEquipB", "0");
    sttEquipC = com_jsonNullCheck(json, "sttEquipC", "0");
    sttEquipD = com_jsonNullCheck(json, "sttEquipD", "0");
    sttEquipE = com_jsonNullCheck(json, "sttEquipE", "0");
    sttEquipF = com_jsonNullCheck(json, "sttEquipF", "0");
    if (com_jsonNullCheck(json, "magicPowerOwnAby", "0") === "1") {
      ownAby = "2";
    }
    if (com_jsonNullCheck(json, "magicPowerOwnAlc", "0") === "1") {
      ownAlc = "2";
    }
    if (com_jsonNullCheck(json, "magicPowerOwnBar", "0") === "1") {
      ownBar = "2";
    }
    if (com_jsonNullCheck(json, "magicPowerOwnCon", "0") === "1") {
      ownCon = "2";
    }
    if (com_jsonNullCheck(json, "magicPowerOwnDem", "0") === "1") {
      ownDem = "2";
    }
    if (com_jsonNullCheck(json, "magicPowerOwnDru", "0") === "1") {
      ownDru = "2";
    }
    if (com_jsonNullCheck(json, "magicPowerOwnFai", "0") === "1") {
      ownFai = "2";
    }
    //グリモワール
    /*
    if(com_jsonNullCheck(json, "magicPowerOwnGri", "0") === "1"){
      ownGri=2;
    }*/
    if (com_jsonNullCheck(json, "magicPowerOwnMag", "0") === "1") {
      ownMag = "2";
    }
    if (com_jsonNullCheck(json, "magicPowerOwnMys", "0") === "1") {
      ownMys = "2";
    }
    if (com_jsonNullCheck(json, "magicPowerOwnPri", "0") === "1") {
      ownPri = "2";
    }
    if (com_jsonNullCheck(json, "magicPowerOwnSor", "0") === "1") {
      ownSor = "2";
    }
    if (com_jsonNullCheck(json, "magicPowerOwnWiz", "0") === "1") {
      ownWiz = "2";
    }
  }
  {
    //技能レベル格納
    sw25GinouLv[0] = parseInt(com_jsonNullCheck(json, "lvFig", sw25GinouLv[0]));
    sw25GinouLv[1] = parseInt(com_jsonNullCheck(json, "lvGra", sw25GinouLv[1]));
    sw25GinouLv[2] = parseInt(com_jsonNullCheck(json, "lvFen", sw25GinouLv[2]));
    sw25GinouLv[3] = parseInt(com_jsonNullCheck(json, "lvSho", sw25GinouLv[3]));
    sw25GinouLv[4] = parseInt(com_jsonNullCheck(json, "lvSor", sw25GinouLv[4]));
    sw25GinouLv[5] = parseInt(com_jsonNullCheck(json, "lvCon", sw25GinouLv[5]));
    sw25GinouLv[6] = parseInt(com_jsonNullCheck(json, "lvPri", sw25GinouLv[6]));
    sw25GinouLv[7] = parseInt(com_jsonNullCheck(json, "lvFai", sw25GinouLv[7]));
    sw25GinouLv[8] = parseInt(com_jsonNullCheck(json, "lvMag", sw25GinouLv[8]));
    sw25GinouLv[9] = parseInt(com_jsonNullCheck(json, "lvSco", sw25GinouLv[9]));
    sw25GinouLv[10] = parseInt(
      com_jsonNullCheck(json, "lvRan", sw25GinouLv[10]),
    );
    sw25GinouLv[11] = parseInt(
      com_jsonNullCheck(json, "lvSag", sw25GinouLv[11]),
    );
    sw25GinouLv[12] = parseInt(
      com_jsonNullCheck(json, "lvEnh", sw25GinouLv[12]),
    );
    sw25GinouLv[13] = parseInt(
      com_jsonNullCheck(json, "lvBar", sw25GinouLv[13]),
    );
    sw25GinouLv[14] = parseInt(
      com_jsonNullCheck(json, "lvAlc", sw25GinouLv[14]),
    );
    sw25GinouLv[15] = parseInt(
      com_jsonNullCheck(json, "lvRid", sw25GinouLv[15]),
    );
    sw25GinouLv[16] = parseInt(
      com_jsonNullCheck(json, "lvDem", sw25GinouLv[16]),
    );
    sw25GinouLv[17] = parseInt(
      com_jsonNullCheck(json, "lvWar", sw25GinouLv[17]),
    );
    sw25GinouLv[23] = parseInt(
      com_jsonNullCheck(json, "lvDru", sw25GinouLv[23]),
    );
    sw25GinouLv[24] = parseInt(
      com_jsonNullCheck(json, "lvGeo", sw25GinouLv[24]),
    );
    sw25GinouLv[25] = parseInt(
      com_jsonNullCheck(json, "lvBat", sw25GinouLv[25]),
    );
    sw25GinouLv[26] = parseInt(
      com_jsonNullCheck(json, "lvAby", sw25GinouLv[26]),
    );
    sw25GinouLv[27] = parseInt(
      com_jsonNullCheck(json, "lvDar", sw25GinouLv[27]),
    );
    sw25GinouLv[28] = parseInt(
      com_jsonNullCheck(json, "lvBib", sw25GinouLv[28]),
    );
    for (let i = 0; i <= sw25GinouLv.length - 1; i++) {
      sw25GinouLvUpper[i] = Math.min(sw25GinouLv[i], 17);
    }
    if (sw25GinouLv[4] > 0 && sw25GinouLv[5] > 0) {
      if (sw25GinouLv[4] <= sw25GinouLv[5]) {
        // ウィザード
        wizMin = sw25GinouLv[4];
        wizMax = sw25GinouLv[5];
      } else {
        wizMin = sw25GinouLv[5];
        wizMax = sw25GinouLv[4];
      }
    }
  }
  if (sw25GinouLv[17] > 0) {
    for (let j = 1; json["craftCommand" + String(j)]; j++) {
      if (json["craftCommand" + String(j)].startsWith("陣率：軍師の知略")) {
        chiryakuFlg = true;
      }
    }
  }
  {
    //テキスト生成開始
    var text =
      '{ "kind": "character", "data": { \n"name": "' +
      json.characterName +
      '",';
    {
      //メモ作成
      if (memoFlg) {
        text = text + '\n"memo": "PL：' + json.playerName + "\\n";
        text = text + "種族：";
        text = text + race;
        text = text + "　性別：";
        text = text + gender;
        text = text + "　年齢：";
        text = text + age;
        if (sw25_levelFlg) {
          text = text + "\\n\\n＝＝＝＝＝技能＝＝＝＝＝\\n";
          for (let j = 0; j < sw25GinouLv.length; j++) {
            if (sw25GinouLv[j] > 0) {
              text = text + sw25GinouName[j] + "：" + sw25GinouLv[j] + " ";
            }
          }
        }
        if (sw25_skillFlg) {
          if (json["combatFeatsAuto"]) {
            text = text + "\\n\\n＝＝＝＝＝自動習得の戦闘特技＝＝＝＝＝\\n";
            text =
              text + "【" + json.combatFeatsAuto.replaceAll(",", "】【") + "】";
          }
          text = text + "\\n\\n＝＝＝＝＝選択習得の戦闘特技＝＝＝＝＝\\n";
          if (json["combatFeatsLv1bat"]) {
            text = text + "【" + json["combatFeatsLv1bat"] + "】";
          }
          for (let j = 1; j <= json.level; j++) {
            if (json["combatFeatsLv" + String(j)]) {
              if (json["combatFeatsLv" + String(j)].startsWith("必殺攻撃")) {
                hissatsuFlg = true;
              }
              text = text + "【" + json["combatFeatsLv" + String(j)] + "】";
            }
          }
        }
        if (sw25_mysticFlg) {
          text = text + "\\n\\n＝＝＝＝＝流派秘伝＝＝＝＝＝\\n";
          for (let j = 1; ; j++) {
            if (json["mysticArts" + String(j)]) {
              text = text + "【" + json["mysticArts" + String(j)] + "】";
            } else {
              break;
            }
          }
        }
        if (sw25_itemFlg) {
          text = text + "\\n\\n＝＝＝＝＝所持品＝＝＝＝＝\\n";
          text = text + "所持金:" + money + "G\\n";
          if (json.items) {
            let itemTexts;
            let markSt = 0;
            let space = "";
            let aryMark = [[]];
            itemTexts = json.items
              .replaceAll("&lt;", "<")
              .replaceAll("&gt;", ">")
              .replaceAll("<br>", "\\n")
              .replaceAll("&quot;", "”")
              .split("\\n");
            console.log(itemTexts);
            console.log(aryMark);
            for (let i = 0; i < itemTexts.length; i++) {
              space = "";
              if (markSt > 0) {
                if (itemTexts[i].indexOf("[---]") > -1) {
                  itemTexts[i] = itemTexts[i].replace("[---]", "");
                  //text = text +itemTexts[i].replace("[---]","") + "\\n";
                  markSt--;
                } else {
                  for (let j = 0; j < markSt; j++) {
                    space = space + "　";
                  }
                  if (itemTexts[i].indexOf("[>]") === 0) {
                    itemTexts[i] = itemTexts[i].replace("[>]", "");
                    markSt++;
                  } /*
                  if(itemTexts[i + 1].indexOf('[---]') > -1){
                    itemTexts[i] = "┗" + itemTexts[i];
                    //text = text + "┗" + itemTexts[i] + "\\n";
                  }
                  else{
                    itemTexts[i] = "┣" + itemTexts[i];
                    //text = text + "┣" + itemTexts[i] + "\\n";
                  }*/
                }
              } else if (itemTexts[i].indexOf("[>]") === 0) {
                itemTexts[i] = itemTexts[i].replace("[>]", "");
                //text = text +itemTexts[i].replace("[>]","") + "\\n";
                markSt++;
              }
              if (!(itemTexts[i] === "")) {
                text = text + space + itemTexts[i] + "\\n";
              }
              //              else{
              //                text = text + itemTexts[i] + "\\n";
              //              }
            }
            //text = text +json.items.replaceAll("&lt;","<").replaceAll("&gt;",">").replaceAll("<br>","\\n");
          }
        }
        text = text + '\\n",';
      }
    }
    {
      // 参照URL設定
      if (urlFlg) {
        text = text + '\n"externalUrl":"' + $('input[id="url"]').val() + '",';
      }
    }
    {
      //ステータス、パラメータ
      text = text + '\n"status":[';
      text =
        text +
        '\n{"label":"HP","value":"' +
        json.hpTotal +
        '","max":"' +
        json.hpTotal +
        '"},';
      text =
        text +
        '\n{"label":"MP","value":"' +
        json.mpTotal +
        '","max":"' +
        json.mpTotal +
        '"},';
      text =
        text +
        '\n{"label":"防護点","value":"' +
        json.defenseTotal1Def +
        '","max":"' +
        json.defenseTotal1Def +
        '"}';
      text = text + "],";
      text = text + '\n"params":[';
      text =
        text +
        '\n{"label":"器用","value":"' +
        String(
          parseInt(json.sttDex) + parseInt(sttAddA) + parseInt(sttEquipA),
        ) +
        '"},';
      text =
        text +
        '\n{"label":"敏捷","value":"' +
        String(
          parseInt(json.sttAgi) + parseInt(sttAddB) + parseInt(sttEquipB),
        ) +
        '"},';
      text =
        text +
        '\n{"label":"筋力","value":"' +
        String(
          parseInt(json.sttStr) + parseInt(sttAddC) + parseInt(sttEquipC),
        ) +
        '"},';
      text =
        text +
        '\n{"label":"生命","value":"' +
        String(
          parseInt(json.sttVit) + parseInt(sttAddD) + parseInt(sttEquipD),
        ) +
        '"},';
      text =
        text +
        '\n{"label":"知力","value":"' +
        String(
          parseInt(json.sttInt) + parseInt(sttAddE) + parseInt(sttEquipE),
        ) +
        '"},';
      text =
        text +
        '\n{"label":"精神","value":"' +
        String(
          parseInt(json.sttMnd) + parseInt(sttAddF) + parseInt(sttEquipF),
        ) +
        '"},';
      text = text + '\n{"label":"冒険者レベル","value":"' + json.level + '"},';
      text =
        text + '\n{"label":"生命抵抗","value":"' + json.vitResistTotal + '"},';
      text =
        text + '\n{"label":"精神抵抗","value":"' + json.mndResistTotal + '"},';
      for (let j = 0; j < sw25GinouName.length; j++) {
        // ルーンマスター
        if (sw25GinouLv[j] == NaN || sw25GinouLv[j] == "0") {
          continue;
        } else {
          text =
            text +
            '\n{"label":"' +
            sw25GinouName[j] +
            '","value":"' +
            sw25GinouLv[j] +
            '"},';
        }
      }
      if (wizMin > 0) {
        text = text + '\n{"label":"ウィザード","value":"' + wizMax + '"},';
        text =
          text +
          '\n{"label":"深智魔法行使可能レベル","value":"' +
          wizMin +
          '"},';
      }
      text =
        text + '\n{"label":"回避","value":"' + json.defenseTotal1Eva + '"},';
      text = text + '\n{"label":"移動力","value":"' + json.mobilityTotal + '"}';
      text = text + "],";
    }
    {
      // active設定(現状意味はない)
      text = text + '\n"active":true,';
    }
    {
      //「ステータスを非公開にする」の有効無効設定
      if (secretFlg) {
        text = text + '\n"secret":true,';
      } else {
        text = text + '\n"secret":false,';
      }
    }
    {
      //「発言時キャラクターを表示しない」の有効無効設定
      if (invisibleFlg) {
        text = text + '\n"invisible":true,';
      } else {
        text = text + '\n"invisible":false,';
      }
    }
    {
      //「盤面キャラクター一覧に表示しない」の有効無効設定
      if (hideStatusFlg) {
        text = text + '\n"hideStatus":true,';
      } else {
        text = text + '\n"hideStatus":false,';
      }
    }
    {
      // チャットパレット
      text = text + '\n"commands":"';
      if (!notChatPalletFlg) {
        if (userChatPalFlg) {
          text = text + inputChatPalette;
        } else {
          let meityuKyouka = "0";
          {
            // ステータス
            if (chatStatFlg) {
              text = text + "＝＝＝＝＝ステータス＝＝＝＝＝\\n";
              text = text + "{HP} 【現在HP】\\n";
              text = text + "{MP} 【現在MP】\\n";
              text = text + "{防護点} 【防護点】\\n";
            }
          }
          {
            // パラメータ
            if (chatParamFlg) {
              text = text + "＝＝＝＝＝パラメータ＝＝＝＝＝\\n";
              text = text + "{器用} 【器用】\\n";
              text = text + "{敏捷} 【敏捷】\\n";
              text = text + "{筋力} 【筋力】\\n";
              text = text + "{生命} 【生命】\\n";
              text = text + "{知力} 【知力】\\n";
              text = text + "{精神} 【精神】\\n";
              text = text + "{冒険者レベル} 【冒険者レベル】\\n";
              text = text + "{生命抵抗} 【生命抵抗力】\\n";
              text = text + "{精神抵抗} 【精神抵抗力】\\n";
              for (let j = 0; j < sw25GinouName.length; j++) {
                // ルーンマスター
                if (sw25GinouLv[j] == NaN || sw25GinouLv[j] == 0) {
                  continue;
                } else {
                  text =
                    text +
                    "{" +
                    sw25GinouName[j] +
                    "} 【" +
                    sw25GinouName[j] +
                    " レベル】\\n";
                }
              }
              if (wizMin > 0) {
                text = text + "{ウィザード} 【ウィザード レベル】\\n";
                text =
                  text +
                  "{深智魔法行使可能レベル} 【深智魔法行使可能レベル】\\n";
              }
              text = text + "{回避} 【回避力】\\n";
              text = text + "{移動力} 【移動力】\\n";
            }
          }
          {
            // 非戦闘系判定
            text = text + "＝＝＝＝＝非戦闘系判定＝＝＝＝＝ \\n";
            text = text + "2d6+{冒険者レベル}+({器用}/6) 冒険者＋器用 \\n";
            text = text + "2d6+{冒険者レベル}+({敏捷}/6) 冒険者＋敏捷 \\n";
            text = text + "2d6+{冒険者レベル}+({筋力}/6) 冒険者＋筋力 \\n";
            text = text + "2d6+{冒険者レベル}+({生命}/6) 冒険者＋生命力 \\n";
            text = text + "2d6+{冒険者レベル}+({知力}/6) 冒険者＋知力 \\n";
            text = text + "2d6+{冒険者レベル}+({精神}/6) 冒険者＋精神力 \\n\\n";
            if (sw25GinouLv[9] > 0) {
              text =
                text +
                "2d6+{スカウト}+({器用}/6)+" +
                packScoTecAdd +
                " スカウト技巧 \\n";
              text =
                text +
                "2d6+{スカウト}+({敏捷}/6)+" +
                packScoAgiAdd +
                " スカウト運動 \\n";
              text =
                text +
                "2d6+{スカウト}+({知力}/6)+" +
                packScoObsAdd +
                " スカウト観察 \\n\\n";
            }
            if (sw25GinouLv[10] > 0) {
              text =
                text +
                "2d6+{レンジャー}+({器用}/6)+" +
                packRanTecAdd +
                " レンジャー技巧 \\n";
              text =
                text +
                "2d6+{レンジャー}+({敏捷}/6)+" +
                packRanAgiAdd +
                " レンジャー運動 \\n";
              text =
                text +
                "2d6+{レンジャー}+({知力}/6)+" +
                packRanObsAdd +
                " レンジャー観察 \\n\\n";
            }
            if (sw25GinouLv[11] > 0) {
              text =
                text +
                "2d6+{セージ}+({知力}/6)+" +
                packSagKnoAdd +
                " セージ知識 \\n";
            }
            if (sw25GinouLv[13] > 0) {
              text =
                text +
                "2d6+{バード}+({知力}/6)+" +
                packBarKnoAdd +
                " バード見識 \\n";
            }
            if (sw25GinouLv[15] > 0) {
              text =
                text +
                "2d6+{ライダー}+({敏捷}/6)+" +
                packRidAgiAdd +
                " ライダー運動 \\n";
              text =
                text +
                "2d6+{ライダー}+({知力}/6)+" +
                packRidKnoAdd +
                " ライダー知識 \\n";
              text =
                text +
                "2d6+{ライダー}+({知力}/6)+" +
                packRidObsAdd +
                " ライダー観察 \\n";
            }
            if (sw25GinouLv[14] > 0) {
              text =
                text +
                "2d6+{アルケミスト}+({知力}/6)+" +
                packAlcKnoAdd +
                " アルケミスト知識 \\n";
            }
            if (sw25GinouLv[24] > 0) {
              text =
                text +
                "2d6+{ジオマンサー}+({知力}/6)+" +
                packGeoObsAdd +
                " ジオマンサー観察 \\n";
            }
            if (sw25GinouLv[28] > 0) {
              text =
                text +
                "2d6+{ビブリオマンサー}+({知力}/6)+" +
                packBibKnoAdd +
                " ビブリオマンサー文献判定 \\n";
            }
          }
          {
            // 各技能関連の判定
            text = text + "\\n＝＝＝＝＝技能判定＝＝＝＝＝ \\n";
            {
              // バード
              if (sw25GinouLv[13] > 0) {
                text =
                  text +
                  "＝＝＝バード＝＝＝\\n2d6+{バード}+(({精神}+" +
                  ownBar +
                  ")/6)+" +
                  magicPowerAddBar +
                  "+" +
                  magicCastAddBar +
                  " 呪歌演奏 \\n";
                text =
                  text +
                  "k10+{バード}+(({精神}+" +
                  ownBar +
                  ")/6)+" +
                  magicDamageAddBar +
                  "+" +
                  magicDamageAddBar +
                  " ダメージ／呪歌 \\n";
                text =
                  text +
                  "k10+{バード}+(({精神}+" +
                  ownBar +
                  ")/6)+" +
                  magicDamageAddBar +
                  "+" +
                  magicDamageAddBar +
                  "H+0 半減／呪歌 \\n";
              }
              if (sw25GinouLv[13] >= 5) {
                text =
                  text +
                  "k20+{バード}+(({精神}+" +
                  ownBar +
                  ")/6)+" +
                  magicPowerAddBar +
                  "+" +
                  magicDamageAddBar +
                  " ダメージ／呪歌 \\n";
                text =
                  text +
                  "k20+{バード}+(({精神}+" +
                  ownBar +
                  ")/6)+" +
                  magicPowerAddBar +
                  "+" +
                  magicDamageAddBar +
                  "H+0 半減／呪歌 \\n";
              }
              if (sw25GinouLv[13] >= 10) {
                text =
                  text +
                  "k30+{バード}+(({精神}+" +
                  ownBar +
                  ")/6)+" +
                  magicPowerAddBar +
                  "+" +
                  magicDamageAddBar +
                  " ダメージ／呪歌 \\n";
                text =
                  text +
                  "k30+{バード}+(({精神}+" +
                  ownBar +
                  ")/6)+" +
                  magicPowerAddBar +
                  "+" +
                  magicDamageAddBar +
                  "H+0 半減／呪歌 \\n";
              }
              if (sw25GinouLv[13] >= 1) {
                text =
                  text +
                  "k0[13]+{バード}+(({精神}+" +
                  ownBar +
                  ")/6)+" +
                  magicPowerAddBar +
                  "+" +
                  magicDamageAddBar +
                  " 回復量／呪歌 \\n";
              }
              if (sw25GinouLv[13] >= 5) {
                text =
                  text +
                  "k10[13]+{バード}+(({精神}+" +
                  ownBar +
                  ")/6)+" +
                  magicPowerAddBar +
                  "+" +
                  magicDamageAddBar +
                  " 回復量／呪歌 \\n";
              }
              if (sw25GinouLv[13] >= 1) {
                text =
                  text +
                  "k20[13]+{バード}+(({精神}+" +
                  ownBar +
                  ")/6)+" +
                  magicPowerAddBar +
                  "+" +
                  magicDamageAddBar +
                  " 回復量／呪歌 \\n";
              }
              if (sw25GinouLv[13] >= 5) {
                text =
                  text +
                  "k30[13]+{バード}+(({精神}+" +
                  ownBar +
                  ")/6)+" +
                  magicPowerAddBar +
                  "+" +
                  magicDamageAddBar +
                  " 回復量／呪歌 \\n";
              }
              if (sw25GinouLv[13] >= 10) {
                text =
                  text +
                  "k40[13]+{バード}+(({精神}+" +
                  ownBar +
                  ")/6)+" +
                  magicPowerAddBar +
                  "+" +
                  magicDamageAddBar +
                  " 回復量／呪歌 \\n";
              }
            }
            {
              // アルケミスト
              if (sw25GinouLv[14] > 0) {
                text =
                  text +
                  "＝＝＝アルケミスト＝＝＝\\n2d6+{アルケミスト}+(({知力}+" +
                  ownAlc +
                  ")/6)+" +
                  magicCastAddAlc +
                  " 賦術 \\n";
              }
            }
            {
              // ダークハンター
              if (sw25GinouLv[27] > 0) {
                text =
                  text +
                  "＝＝＝ダークハンター＝＝＝\\n2d6+{ダークハンター}+({精神}/6)+" +
                  magicPowerAddDar +
                  "+" +
                  magicCastAddDar +
                  "+" +
                  " ダークハンター 理力判定 \\n";
              }
              if (sw25GinouLv[13] >= 5) {
                text =
                  text +
                  "k20+{ダークハンター}+(({精神})/6)+" +
                  magicPowerAddDar +
                  "+" +
                  magicDamageAddDar +
                  " ダメージ／操気【破邪光弾】 \\n";
                text =
                  text +
                  "k20+{ダークハンター}+(({精神})/6)+" +
                  magicPowerAddDar +
                  "+" +
                  magicDamageAddDar +
                  "H+0 半減／操気【破邪光弾】 \\n";
                text =
                  text +
                  "k40+{ダークハンター}+(({精神})/6)+" +
                  magicPowerAddDar +
                  "+" +
                  magicDamageAddDar +
                  " ダメージ／操気【破邪光弾】 \\n";
                text =
                  text +
                  "k40+{ダークハンター}+(({精神})/6)+" +
                  magicPowerAddDar +
                  "+" +
                  magicDamageAddDar +
                  "H+0 半減／操気【破邪光弾】 \\n";
              }
              if (sw25GinouLv[13] >= 5) {
                text =
                  text +
                  "k30+{ダークハンター}+(({精神})/6)+" +
                  magicPowerAddDar +
                  "+" +
                  magicDamageAddDar +
                  " ダメージ／操気【破邪光槍】 \\n";
                text =
                  text +
                  "k30+{ダークハンター}+(({精神})/6)+" +
                  magicPowerAddDar +
                  "+" +
                  magicDamageAddDar +
                  "H+0 半減／操気【破邪光槍】 \\n";
                text =
                  text +
                  "k60+{ダークハンター}+(({精神})/6)+" +
                  magicPowerAddDar +
                  "+" +
                  magicDamageAddDar +
                  " ダメージ／操気【破邪光槍】 \\n";
                text =
                  text +
                  "k60+{ダークハンター}+(({精神})/6)+" +
                  magicPowerAddDar +
                  "+" +
                  magicDamageAddDar +
                  "H+0 半減／操気【破邪光槍】 \\n";
              }
            }
          }
          {
            // 戦闘前判定
            text = text + "\\n＝＝＝＝＝戦闘前判定＝＝＝＝＝ \\n";
            // 先制判定
            if (sw25GinouLv[9] > 0) {
              text =
                text +
                "2d6+{スカウト}+({敏捷}/6)+" +
                packScoAgiAdd +
                "+" +
                iniAdd +
                " スカウト先制力 \\n";
            }
            if (sw25GinouLv[17] > 0) {
              text =
                text +
                "2d6+{ウォーリーダー}+({敏捷}/6)+" +
                packWarAgiAdd +
                "+" +
                iniAdd +
                " ウォーリーダー先制力 \\n";
              if (chiryakuFlg) {
                text =
                  text +
                  "2d6+{ウォーリーダー}+({知力}/6)+" +
                  packWarIntAuto +
                  "+" +
                  packWarIntAdd +
                  "+" +
                  iniAdd +
                  " ウォーリーダー先制力(軍師の知略) \\n";
              }
            }
            // 魔物知識判定
            if (sw25GinouLv[11] > 0) {
              text =
                text +
                "2d6+{セージ}+({知力}/6)+" +
                packSagKnoAdd +
                "+" +
                monsterLoreAdd +
                " セージ魔物知識 \\n";
            }
            if (sw25GinouLv[15] > 0) {
              text =
                text +
                "2d6+{ライダー}+({知力}/6)+" +
                packRidKnoAdd +
                "+" +
                monsterLoreAdd +
                " ライダー魔物知識(弱点不可) \\n";
            }
            if (sw25GinouLv[27] > 0) {
              text =
                text +
                "2d6+{ダークハンター}+({知力}/6)+" +
                packDarIntAdd +
                "+" +
                monsterLoreAdd +
                " ダークハンター魔物知識(魔神限定) \\n";
            }
            // 弱点隠蔽判定
            if (sw25_race_bar.includes(race)) {
              text =
                text +
                "2d6+{冒険者レベル}+({知力}/6) ウィークリング弱点隠蔽 \\n";
            }
            if (sw25GinouLv[15] > 0) {
              text =
                text +
                "2d6+{ライダー}+({知力}/6)+" +
                packRidKnoAdd +
                " ライダー弱点隠蔽 \\n";
            }
          }
          {
            // 戦闘中判定
            text = text + "\\n＝＝＝＝＝戦闘中判定＝＝＝＝＝ \\n";
            text = text + "2d6+{生命抵抗} 生命抵抗力 \\n";
            text = text + "2d6+{精神抵抗} 精神抵抗力 \\n";
            text = text + "2d6+{回避} 回避力 \\n";
            {
              // 命中判定
              if (json.accuracyEnhance) {
                meityuKyouka = json.accuracyEnhance;
              }
              if (sw25GinouLv[0] > 0) {
                text =
                  text +
                  "2d6+{ファイター}+({器用}/6)+" +
                  meityuKyouka +
                  " ファイター命中 \\n";
              }
              if (sw25GinouLv[1] > 0) {
                text =
                  text +
                  "2d6+{グラップラー}+({器用}/6)+" +
                  meityuKyouka +
                  " グラップラー命中 \\n";
              }
              if (sw25GinouLv[2] > 0) {
                text =
                  text +
                  "2d6+{フェンサー}+({器用}/6)+" +
                  meityuKyouka +
                  " フェンサー命中 \\n";
              }
              if (sw25GinouLv[3] > 0) {
                text =
                  text +
                  "2d6+{シューター}+({器用}/6)+" +
                  meityuKyouka +
                  " シューター命中 \\n";
              }
              if (sw25GinouLv[25] > 0) {
                text =
                  text +
                  "2d6+{バトルダンサー}+({器用}/6)+" +
                  meityuKyouka +
                  " バトルダンサー命中 \\n";
              }
              if (sw25GinouLv[27] > 0) {
                text =
                  text +
                  "2d6+{ダークハンター}+({精神}/6)+" +
                  magicPowerAddDar +
                  "+" +
                  meityuKyouka +
                  " ダークハンター命中 \\n";
              }
            }
            {
              // 武器ダメージ
              for (let j = 1; j <= parseInt(json.weaponNum); j++) {
                weaponAcc = "0";
                weaponDmg = "0";
                weaponDmg_calc = "0";
                weaponCate = "";
                weaponCrit = "";
                weaponRate = "";
                weaponClass = "";
                weaponOwn = "0";
                weaponCateidx = -1;
                let weaponMeleeFlg = false;
                if (json["weapon" + String(j) + "Acc"]) {
                  weaponAcc = json["weapon" + String(j) + "Acc"];
                }
                if (json["weapon" + String(j) + "DmgTotal"]) {
                  weaponDmg = json["weapon" + String(j) + "DmgTotal"];
                }
                if (json["weapon" + String(j) + "Own"]) {
                  weaponOwn = "2";
                }
                if (json["weapon" + String(j) + "Crit"]) {
                  weaponCrit = json["weapon" + String(j) + "Crit"];
                }
                if (json["weapon" + String(j) + "Rate"]) {
                  weaponRate = json["weapon" + String(j) + "Rate"];
                }
                if (json["weapon" + String(j) + "Class"]) {
                  weaponClass = json["weapon" + String(j) + "Class"];
                }
                if (json["weapon" + String(j) + "DmgTotal"]) {
                  weaponDmg = json["weapon" + String(j) + "DmgTotal"];
                }
                if (json["weapon" + String(j) + "Category"]) {
                  //武器カテゴリ―の検索
                  weaponCate = json["weapon" + String(j) + "Category"];
                  /*
                  for(let k=0; k<sw25ArmType.length; k++){
                    if(weaponCate == sw25ArmType[k]){

                      if(sw25ArmMeleeType[k] = 1){
                        weaponMeleeFlg = true;
                      }

                      break;
                    }
                  */
                }
                // 20260103
                if (weaponClass != "自動計算しない" && weaponClass != "") {
                  weaponDmg_calc = sw25ArmAtk[weaponClass].use_dam();
                }
                /*proc_sw25_test.js
                if(weaponClass == "フェンサー"){
                  weaponCrit = String(parseInt(weaponCrit) - 1);
                }
                */
                if (weaponCrit != "" && weaponClass != "") {
                  if (weaponClass != "ダークハンター") {
                    // 通常の武器（器用度ボーナス参照での武器攻撃）
                    text =
                      text +
                      "2d6+{" +
                      weaponClass +
                      "}+(({器用}+" +
                      weaponOwn +
                      ")/6)+" +
                      meityuKyouka +
                      "+" +
                      weaponAcc +
                      " " +
                      json["weapon" + String(j) + "Name"] +
                      "命中 \\n";
                  } else {
                    // ダークハンターによる気操法（精神力ボーナス参照での武器攻撃）
                    text =
                      text +
                      "2d6+{" +
                      weaponClass +
                      "}+(({精神})/6)+" +
                      magicPowerAddDar +
                      "+" +
                      meityuKyouka +
                      "+" +
                      weaponAcc +
                      " " +
                      json["weapon" + String(j) + "Name"] +
                      "命中 【気操法】\\n";
                  }
                }

                if (weaponCrit != "") {
                  // C値が設定されている場合
                  sw25ArmMastery[weaponCateidx];
                  text =
                    text +
                    "k" +
                    weaponRate +
                    "[" +
                    weaponCrit +
                    "]+" +
                    weaponDmg +
                    " " +
                    json["weapon" + String(j) + "Name"] +
                    "ダメージ \\n";
                  if (sw25ArmCat[weaponCate].ismelee == 1) {
                    if (hissatsuFlg) {
                      // 必殺攻撃が設定されている場合
                      text =
                        text +
                        "k" +
                        weaponRate +
                        "[" +
                        weaponCrit +
                        "]#1+" +
                        weaponDmg +
                        " " +
                        json["weapon" + String(j) + "Name"] +
                        "ダメージ(必殺攻撃) \\n";
                    }
                  }
                } else {
                  // C値が設定されていない場合（１０と一旦みなす
                  text =
                    text +
                    "k" +
                    weaponRate +
                    "+" +
                    weaponDmg +
                    " " +
                    json["weapon" + String(j) + "Name"] +
                    "（C値未設定）ダメージ \\n";
                }

                if (sw25ArmType[11] === weaponCate) {
                  if (
                    dam_bullet[sw25GinouLvUpper[8] - 1]?.length !== undefined
                  ) {
                    for (
                      i = 0;
                      i <= dam_bullet[sw25GinouLvUpper[8] - 1].length - 1;
                      i++
                    ) {
                      text =
                        text +
                        "k" +
                        dam_bullet[sw25GinouLvUpper[8] - 1][i] +
                        "[" +
                        weaponCrit +
                        "]+" +
                        weaponDmg +
                        " ダメージ \\n";
                    } /*
                    if(sw25GinouLv[8] >= 2) {
                      text = text + "k20["+json.arms_critical[j]+"-1]+"+json.arms_damage[j]+" "+json.arms_name[j]+"【クリティカル・バレット】ダメージ \\n";
                    }
                    if(sw25GinouLv[8] >= 9) {
                      text = text + "k30["+json.arms_critical[j]+"-1]+"+json.arms_damage[j]+" "+json.arms_name[j]+"【レーザー・バレット】ダメージ \\n";
                    }*/
                  } /*
                  if(heal_bullet[sw25GinouLvUpper[8]-1]?.length !== undefined){
                    for(i=0; i <= heal_bullet[sw25GinouLvUpper[8]-1].length - 1; i++){
                      text = text + "k"+heal_bullet[sw25GinouLvUpper[8]-1][i]+"[13]+"+json.arms_damage[j]+" "+json.arms_name[j]+"回復量 \\n";
                    }
                  }*/
                  text =
                    text +
                    "k0[13]+{マギテック}+(({知力}+" +
                    ownMag +
                    ")/6) ヒーリングバレット \\n";
                }
              }
            }
          }
          // #region 魔法技能系の判定（魔法行使、ダメージ、回復等
          text = text + "\\n\\n＝＝＝＝＝魔法系判定＝＝＝＝＝ \\n";
          let adddamtext_sor =
            magicPowerAdd +
            "+" +
            magicPowerAddSor +
            "+" +
            magicDamageAdd +
            "+" +
            magicDamageAddSor;
          let adddamtext_con =
            magicPowerAdd +
            "+" +
            magicPowerAddCon +
            "+" +
            magicDamageAdd +
            "+" +
            magicDamageAddCon;
          let addheatext_con = magicPowerAdd + "+" + magicPowerAddCon;
          let adddamtext_pri =
            magicPowerAdd +
            "+" +
            magicPowerAddPri +
            "+" +
            magicDamageAdd +
            "+" +
            magicDamageAddPri;
          let addheatext_pri = magicPowerAdd + "+" + magicPowerAddPri;
          let adddamtext_fai =
            magicPowerAdd +
            "+" +
            magicPowerAddFai +
            "+" +
            magicDamageAdd +
            "+" +
            magicDamageAddFai;
          let adddamtext_mag =
            magicPowerAdd +
            "+" +
            magicPowerAddMag +
            "+" +
            magicDamageAdd +
            "+" +
            magicDamageAddMag;
          let addheatext_mag = magicPowerAdd + "+" + magicPowerAddMag;
          let adddamtext_dem =
            magicPowerAdd +
            "+" +
            magicPowerAddDem +
            "+" +
            magicDamageAdd +
            "+" +
            magicDamageAddDem;
          let adddamtext_dru =
            magicPowerAdd +
            "+" +
            magicPowerAddDru +
            "+" +
            magicDamageAdd +
            "+" +
            magicDamageAddDru;
          let adddamtext_wiz =
            magicPowerAdd +
            "+" +
            magicPowerAddWiz +
            "+" +
            magicDamageAdd +
            "+" +
            magicDamageAddWiz;
          let adddamtext_aby =
            magicPowerAdd +
            "+" +
            magicPowerAddAby +
            "+" +
            magicDamageAdd +
            "+" +
            magicDamageAddAby;
          let addheatext_aby = magicPowerAdd + "+" + magicPowerAddAby;
          let adddamtext_bib =
            magicPowerAdd +
            "+" +
            magicPowerAddBib +
            "+" +
            magicDamageAdd +
            "+" +
            magicDamageAddBib;
          let addheatext_bib = magicPowerAdd + "+" + magicPowerAddBib;

          // #region ソーサラー
          if (sw25GinouLv[4] > 0) {
            text =
              text +
              "＝＝＝真語魔法＝＝＝\\n2d6+{ソーサラー}+(({知力}+" +
              ownSor +
              ")/6)+" +
              magicPowerAdd +
              "+" +
              magicPowerAddSor +
              "+" +
              magicCastAdd +
              "+" +
              magicCastAddSor +
              " 真語魔法行使 \\n";
          }
          if (dam_sor[sw25GinouLvUpper[4] - 1]?.length !== undefined) {
            for (i = 0; i <= dam_sor[sw25GinouLvUpper[4] - 1].length - 1; i++) {
              text =
                text +
                "k" +
                dam_sor[sw25GinouLvUpper[4] - 1][i] +
                "[10]+{ソーサラー}+(({知力}+" +
                ownSor +
                ")/6)+" +
                adddamtext_sor +
                " ダメージ／真語魔法 \\n";
              text =
                text +
                "k" +
                dam_sor[sw25GinouLvUpper[4] - 1][i] +
                "[13]+{ソーサラー}+(({知力}+" +
                ownSor +
                ")/6)+" +
                adddamtext_sor +
                "H+0 半減／真語魔法 \\n";
            }
            if (sw25GinouLv[4] >= 12) {
              text =
                text +
                "k40[9]+{ソーサラー}+(({知力}+" +
                ownSor +
                ")/6)+" +
                json.arms_maryoku_sum +
                "+" +
                json.MM_Tokugi +
                "+" +
                json.MM5 +
                " 【シャイニング・スポット】ダメージ／真語魔法 \\n";
            }
          }
          // #endregion
          // #region コンジャラー
          if (sw25GinouLv[5] > 0) {
            text =
              text +
              "＝＝＝操霊魔法＝＝＝\\n2d6+{コンジャラー}+(({知力}+" +
              ownCon +
              ")/6)+" +
              magicPowerAdd +
              "+" +
              magicPowerAddCon +
              "+" +
              magicCastAdd +
              "+" +
              magicCastAddCon +
              " 操霊魔法行使 \\n";
          }
          if (dam_con[sw25GinouLvUpper[5] - 1]?.length !== undefined) {
            for (i = 0; i <= dam_con[sw25GinouLvUpper[5] - 1].length - 1; i++) {
              text =
                text +
                "k" +
                dam_con[sw25GinouLvUpper[5] - 1][i] +
                "[10]+{コンジャラー}+(({知力}+" +
                ownCon +
                ")/6)+" +
                adddamtext_con +
                " ダメージ／操霊魔法 \\n";
              text =
                text +
                "k" +
                dam_con[sw25GinouLvUpper[5] - 1][i] +
                "[13]+{コンジャラー}+(({知力}+" +
                ownCon +
                ")/6)+" +
                adddamtext_con +
                "H+0 半減／操霊魔法 \\n";
            }
          }
          if (heal_con[sw25GinouLvUpper[5] - 1]?.length !== undefined) {
            for (
              i = 0;
              i <= heal_con[sw25GinouLvUpper[5] - 1].length - 1;
              i++
            ) {
              text =
                text +
                "k" +
                heal_con[sw25GinouLvUpper[5] - 1][i] +
                "[13]+{コンジャラー}+(({知力}+" +
                ownCon +
                ")/6)+" +
                addheatext_con +
                " 回復量／操霊魔法 \\n";
            }
          }
          // #endregion
          // #region プリースト
          if (sw25GinouLv[6] > 0) {
            text =
              text +
              "＝＝＝神聖魔法＝＝＝\\n2d6+{プリースト}+(({知力}+" +
              ownPri +
              ")/6)+" +
              magicPowerAdd +
              "+" +
              magicPowerAddPri +
              "+" +
              magicCastAdd +
              "+" +
              magicCastAddPri +
              " 神聖魔法行使 \\n";
          }
          if (dam_pri[sw25GinouLvUpper[6] - 1]?.length !== undefined) {
            for (i = 0; i <= dam_pri[sw25GinouLvUpper[6] - 1].length - 1; i++) {
              text =
                text +
                "k" +
                dam_pri[sw25GinouLvUpper[6] - 1][i] +
                "[10]+{プリースト}+(({知力}+" +
                ownPri +
                ")/6)+" +
                adddamtext_pri +
                " ダメージ／神聖魔法 \\n";
              text =
                text +
                "k" +
                dam_pri[sw25GinouLvUpper[6] - 1][i] +
                "[13]+{プリースト}+(({知力}+" +
                ownPri +
                ")/6)+" +
                adddamtext_pri +
                "H+0 半減／神聖魔法 \\n";
            }
          }
          if (heal_pri[sw25GinouLvUpper[6] - 1]?.length !== undefined) {
            for (
              i = 0;
              i <= heal_pri[sw25GinouLvUpper[6] - 1].length - 1;
              i++
            ) {
              text =
                text +
                "k" +
                heal_pri[sw25GinouLvUpper[6] - 1][i] +
                "[13]+{プリースト}+(({知力}+" +
                ownPri +
                ")/6)+" +
                addheatext_pri +
                " 回復量／神聖魔法 \\n";
            }
          }
          // #endregion
          // #region フェアリーテイマー
          if (sw25GinouLv[7] > 0) {
            text =
              text +
              "＝＝＝妖精魔法＝＝＝\\n2d6+{フェアリーテイマー}+(({知力}+" +
              ownFai +
              ")/6)+" +
              magicPowerAdd +
              "+" +
              magicPowerAddFai +
              "+" +
              magicCastAdd +
              "+" +
              magicCastAddFai +
              " 妖精魔法行使 \\n";
          }
          if (dam_fai[sw25GinouLvUpper[7] - 1]?.length !== undefined) {
            for (i = 0; i <= dam_fai[sw25GinouLvUpper[7] - 1].length - 1; i++) {
              text =
                text +
                "k" +
                dam_fai[sw25GinouLvUpper[7] - 1][i] +
                "[10]+{フェアリーテイマー}+(({知力}+" +
                ownFai +
                ")/6)+" +
                adddamtext_fai +
                " ダメージ／妖精魔法 \\n";
              text =
                text +
                "k" +
                dam_fai[sw25GinouLvUpper[7] - 1][i] +
                "[13]+{フェアリーテイマー}+(({知力}+" +
                ownFai +
                ")/6)+" +
                adddamtext_fai +
                "H+0 半減／妖精魔法 \\n";
            }
          }
          // #endregion
          // #region マギテック
          if (sw25GinouLv[8] > 0) {
            text =
              text +
              "＝＝＝魔動機術＝＝＝\\n2d6+{マギテック}+(({知力}+" +
              ownMag +
              ")/6)+" +
              magicPowerAdd +
              "+" +
              magicPowerAddMag +
              "+" +
              magicCastAdd +
              "+" +
              magicCastAddMag +
              " 魔動機術行使 \\n";
          }
          if (dam_mag[sw25GinouLvUpper[8] - 1]?.length !== undefined) {
            for (i = 0; i <= dam_mag[sw25GinouLvUpper[8] - 1].length - 1; i++) {
              text =
                text +
                "k" +
                dam_mag[sw25GinouLvUpper[8] - 1][i] +
                "[10]+{マギテック}+(({知力}+" +
                ownMag +
                ")/6)+" +
                adddamtext_mag +
                " ダメージ／魔動機術 \\n";
              text =
                text +
                "k" +
                dam_mag[sw25GinouLvUpper[8] - 1][i] +
                "[13]+{マギテック}+(({知力}+" +
                ownMag +
                ")/6)+" +
                adddamtext_mag +
                "H+0 半減／魔動機術 \\n";
            }
            if (sw25GinouLv[8] >= 8) {
              text =
                text +
                "k50[10]+{マギテック}+(({知力}+" +
                ownMag +
                ")/6)+" +
                addheatext_mag +
                " 【パイルシューター】ダメージ／魔動機術 \\n";
            }
            if (sw25GinouLv[8] >= 14) {
              text =
                text +
                "k100[10]+{マギテック}+(({知力}+" +
                ownMag +
                ")/6)+" +
                addheatext_mag +
                " 【オメガシューター】ダメージ／魔動機術 \\n";
            }
          }
          if (heal_mag[sw25GinouLvUpper[8] - 1]?.length !== undefined) {
            for (
              i = 0;
              i <= heal_mag[sw25GinouLvUpper[8] - 1].length - 1;
              i++
            ) {
              text =
                text +
                "k" +
                heal_mag[sw25GinouLvUpper[8] - 1][i] +
                "[13]+{マギテック}+(({知力}+" +
                ownMag +
                ")/6)+" +
                addheatext_mag +
                " 回復量／魔動機術 \\n";
            }
          }
          // #endregion
          // #region デーモンルーラー
          if (sw25GinouLv[16] > 0) {
            text =
              text +
              "＝＝＝召異魔法＝＝＝\\n2d6+{デーモンルーラー}+(({知力}+" +
              ownDem +
              ")/6)+" +
              magicPowerAdd +
              "+" +
              magicPowerAddDem +
              "+" +
              magicCastAdd +
              "+" +
              magicCastAddDem +
              " 召異魔法行使 \\n";
          }
          if (dam_dem[sw25GinouLvUpper[16] - 1]?.length !== undefined) {
            for (
              i = 0;
              i <= dam_dem[sw25GinouLvUpper[16] - 1].length - 1;
              i++
            ) {
              text =
                text +
                "k" +
                dam_dem[sw25GinouLvUpper[16] - 1][i] +
                "[10]+{デーモンルーラー}+(({知力}+" +
                ownSor +
                ")/6)+" +
                adddamtext_dem +
                " ダメージ／召異魔法 \\n";
              text =
                text +
                "k" +
                dam_dem[sw25GinouLvUpper[16] - 1][i] +
                "[13]+{デーモンルーラー}+(({知力}+" +
                ownSor +
                ")/6)+" +
                adddamtext_dem +
                "H+0 半減／召異魔法 \\n";
            }
            if (sw25GinouLv[16] >= 11) {
              text =
                text +
                "k50+{デーモンルーラー}+(({知力}+" +
                ownSor +
                ")/6)+" +
                json.arms_maryoku_sum +
                "+" +
                magicPowerAdd +
                "+" +
                magicPowerAddDem +
                " ダメージ／デモンズブレード \\n";
            }
            if (sw25GinouLv[16] >= 14) {
              text =
                text +
                "k70+{デーモンルーラー}+(({知力}+" +
                ownSor +
                ")/6)+" +
                json.arms_maryoku_sum +
                "+" +
                magicPowerAdd +
                "+" +
                magicPowerAddDem +
                " ダメージ／デモンズブレード \\n";
            }
          }
          // #endregion
          // #region ドルイド
          if (sw25GinouLv[23] > 0) {
            text =
              text +
              "＝＝＝森羅魔法＝＝＝\\n2d6+{ドルイド}+(({知力}+" +
              ownDru +
              ")/6)+" +
              magicPowerAdd +
              "+" +
              magicPowerAddDru +
              "+" +
              magicCastAdd +
              "+" +
              magicCastAddDru +
              " 森羅魔法行使 \\n";
          }
          if (dam_dru[sw25GinouLvUpper[23] - 1]?.length !== undefined) {
            for (
              i = 0;
              i <= dam_dru[sw25GinouLvUpper[23] - 1].length - 1;
              i++
            ) {
              text =
                text +
                "k" +
                dam_dru[sw25GinouLvUpper[23] - 1][i] +
                "[10]+{ドルイド}+(({知力}+" +
                ownDru +
                ")/6)+" +
                adddamtext_dru +
                " ダメージ／森羅魔法 \\n";
              text =
                text +
                "k" +
                dam_dru[sw25GinouLvUpper[23] - 1][i] +
                "[13]+{ドルイド}+(({知力}+" +
                ownDru +
                ")/6)+" +
                adddamtext_dru +
                "H+0 半減／森羅魔法 \\n";
            }
          }
          if (phy_dru[sw25GinouLvUpper[23] - 1]?.length !== undefined) {
            for (
              i = 0;
              i <= phy_dru[sw25GinouLvUpper[23] - 1].length - 1;
              i++
            ) {
              text =
                text +
                "Dru[" +
                phy_dru[sw25GinouLvUpper[23] - 1][i] +
                "]+{ドルイド}+(({知力}+" +
                ownDru +
                ")/6)+" +
                adddamtext_dru +
                " ダメージ／森羅魔法 \\n";
            }
          }
          if (sw25GinouLv[23] >= 2) {
            text = text + "k10＠13 【ナチュラルパワー】／森羅魔法 \\n";
          }
          if (sw25GinouLv[23] >= 12) {
            text = text + "k30＠13 【ナチュラルパワーⅡ】／森羅魔法 \\n";
          }
          // #endregion
          // #region ウィザード
          if (wizMin > 0) {
            text =
              text +
              "＝＝＝深智魔法＝＝＝\\n2d6+{ウィザード}+(({知力}+" +
              ownWiz +
              ")/6)+" +
              magicPowerAdd +
              "+" +
              magicPowerAddWiz +
              "+" +
              magicCastAdd +
              "+" +
              magicCastAddWiz +
              " 深智魔法行使 \\n";
          }
          if (dam_wiz[wizMin - 1]?.length !== undefined) {
            for (i = 0; i <= dam_wiz[wizMin - 1].length - 1; i++) {
              text =
                text +
                "k" +
                dam_wiz[wizMin - 1][i] +
                "[10]+{ウィザード}+(({知力}+" +
                ownWiz +
                ")/6)+" +
                adddamtext_wiz +
                " ダメージ／深智魔法 \\n";
              text =
                text +
                "k" +
                dam_wiz[wizMin - 1][i] +
                "[13]+{ウィザード}+(({知力}+" +
                ownWiz +
                ")/6)+" +
                adddamtext_wiz +
                "H+0 半減／深智魔法 \\n";
            }
          }
          // #endregion
          // #region アビスゲイザー
          if (sw25GinouLv[26] >= 1) {
            text =
              text +
              "＝＝＝奈落魔法＝＝＝\\n2d6+{アビスゲイザー}+(({知力}+" +
              ownAby +
              ")/6)+" +
              magicPowerAdd +
              "+" +
              magicPowerAddAby +
              "+" +
              magicCastAdd +
              "+" +
              magicCastAddAby +
              " 奈落魔法行使 \\n";
          }
          console.log(sw25GinouLv[26]);
          if (dam_abyss[sw25GinouLvUpper[26] - 1]?.length !== undefined) {
            for (
              i = 0;
              i <= dam_abyss[sw25GinouLvUpper[26] - 1].length - 1;
              i++
            ) {
              text =
                text +
                "k" +
                dam_abyss[sw25GinouLvUpper[26] - 1][i] +
                "[10]+{アビスゲイザー}+(({知力}+" +
                ownAby +
                ")/6)+" +
                adddamtext_aby +
                " ダメージ／奈落魔法 \\n";
              text =
                text +
                "k" +
                dam_abyss[sw25GinouLvUpper[26] - 1][i] +
                "[13]+{アビスゲイザー}+(({知力}+" +
                ownAby +
                ")/6)+" +
                adddamtext_aby +
                "H+0 半減／奈落魔法 \\n";
            }
          }
          if (heal_abyss[sw25GinouLvUpper[26] - 1]?.length !== undefined) {
            for (
              i = 0;
              i <= heal_abyss[sw25GinouLvUpper[26] - 1].length - 1;
              i++
            ) {
              text =
                text +
                "k" +
                heal_abyss[sw25GinouLvUpper[26] - 1][i] +
                "[13]+{アビスゲイザー}+(({知力}+" +
                ownAby +
                ")/6)+" +
                addheatext_aby +
                " 回復量／奈落魔法 \\n";
            }
          }
          if (sw25GinouLv[28] > 0) {
            text =
              text +
              "＝＝＝秘奥魔法＝＝＝\\n2d6+{ビブリオマンサー}+(({知力}+" +
              ownBib +
              ")/6)+" +
              magicPowerAdd +
              "+" +
              magicPowerAddBib +
              "+" +
              magicCastAdd +
              "+" +
              magicCastAddBib +
              " 秘奥魔法行使 \\n";
          }
          // #endregion
          // #region ビブリオマンサー
          if (dam_bib[sw25GinouLvUpper[28] - 1]?.length !== undefined) {
            for (
              i = 0;
              i <= dam_bib[sw25GinouLvUpper[28] - 1].length - 1;
              i++
            ) {
              text =
                text +
                "k" +
                dam_bib[sw25GinouLvUpper[28] - 1][i] +
                "[10]+{ビブリオマンサー}+(({知力}+" +
                ownBib +
                ")/6)+" +
                adddamtext_bib +
                " ダメージ／秘奥魔法 \\n";
              text =
                text +
                "k" +
                dam_bib[sw25GinouLvUpper[28] - 1][i] +
                "[13]+{ビブリオマンサー}+(({知力}+" +
                ownBib +
                ")/6)+" +
                adddamtext_bib +
                "H+0 半減／秘奥魔法 \\n";
            }
          }
          if (heal_bib[sw25GinouLvUpper[28] - 1]?.length !== undefined) {
            for (
              i = 0;
              i <= heal_bib[sw25GinouLvUpper[28] - 1].length - 1;
              i++
            ) {
              text =
                text +
                "k" +
                heal_bib[sw25GinouLvUpper[28] - 1][i] +
                "[13]+{ビブリオマンサー}+(({知力}+" +
                ownBib +
                ")/6)+" +
                addheatext_bib +
                " 回復量／秘奥魔法 \\n";
            }
          }
          if (sw25GinouLv[28] >= 7) {
            text = text + "k40[13] 回復量／秘奥魔法 \\n";
          }
          // #endregion
          // #endregion
          {
            // 練技
            if (sw25GinouLv[12] > 0) {
              // エンハンサーのレベルが1以上なら
              text = text + "\\n＝＝＝＝＝練技＝＝＝＝＝\\n";
              for (let j = 1; j <= sw25GinouLv[12]; j++) {
                if (json["craftEnhance" + String(j)]) {
                  text = text + json["craftEnhance" + String(j)] + "\\n";
                }
              }
            }
          }
          {
            // 呪歌
            if (sw25GinouLv[13] > 0) {
              // バードのレベルが1以上なら
              text = text + "\\n＝＝＝＝＝呪歌＝＝＝＝＝\\n";
              for (let j = 1; json["craftSong" + String(j)]; j++) {
                text = text + json["craftSong" + String(j)] + "\\n";
              }
            }
          }
          {
            // 騎芸
            if (sw25GinouLv[15] > 0) {
              // ライダーのレベルが1以上なら
              text = text + "\\n＝＝＝＝＝騎芸＝＝＝＝＝\\n";
              for (let j = 1; json["craftRiding" + String(j)]; j++) {
                text = text + json["craftRiding" + String(j)] + "\\n";
              }
            }
          }
          {
            // 賦術
            if (sw25GinouLv[14] > 0) {
              // アルケミストのレベルが1以上なら
              text = text + "\\n＝＝＝＝＝賦術＝＝＝＝＝\\n";
              for (let j = 1; json["craftAlchemy" + String(j)]; j++) {
                text = text + json["craftAlchemy" + String(j)] + "\\n";
              }
            }
          }
          {
            // 相域
            if (sw25GinouLv[24] > 0) {
              // ジオマンサーのレベルが1以上なら
              text = text + "\\n＝＝＝＝＝相域＝＝＝＝＝\\n";
              for (let j = 1; json["craftGeomancy" + String(j)]; j++) {
                text = text + json["craftGeomancy" + String(j)] + "\\n";
              }
            }
          }
          {
            //鼓咆／陣率
            if (sw25GinouLv[17] > 0) {
              // ウォーリーダーのレベルが1以上なら
              text = text + "\\n＝＝＝＝＝鼓咆／陣率＝＝＝＝＝\\n";
              for (let j = 1; json["craftCommand" + String(j)]; j++) {
                text = text + json["craftCommand" + String(j)] + "\\n";
              }
            }
          }
          {
            //操気
            if (sw25GinouLv[27] > 0) {
              // ダークハンターのレベルが1以上なら
              text = text + "\\n＝＝＝＝＝操気＝＝＝＝＝\\n";
              for (let j = 1; json["craftPsychokinesis" + String(j)]; j++) {
                text = text + json["craftPsychokinesis" + String(j)] + "\\n";
              }
            }
          }
        }
      }
      text = text + '"';
    }
    text = text + "\n}";
    text = text + "\n}";
  }
  $('textarea[id="charapiece"]').val(text);
}

function sw25_CheckAutoSTFlg(level, target) {
  let result = 0;
  if (level >= target) {
    // ファストアクション
    result = 1;
  }
  return result;
}

window.sw25_data.RaceFeatures = [
  {
    id: "1.0",
    name: "人間",
    race: "人間",
    variant: "",
    source: "1",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "2d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "地方語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["剣の加護／運命変転"],
    features: [
      {
        level: 1,
        name: "剣の加護／運命変転",
        text: "［剣の加護／運命変転］：1日1回ダイスを2d同時にひっくり返せる。",
      },
      {
        level: 6,
        name: "剣の加護／運命変転",
        text: "［剣の加護／運命変転］：運命変転の結果に+1できる。",
      },
      {
        level: 11,
        name: "剣の加護／運命変転",
        text: "［剣の加護／運命変転］：運命変転の結果に+2できる。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "剣の加護／運命変転",
        text: "［剣の加護／運命変転］：2dのうち、片方の1dだけひっくり返せる。",
      },
    ],
    aliases: ["人間"],
  },
  {
    id: "2.0",
    name: "エルフ",
    race: "エルフ",
    variant: "",
    source: "1",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "エルフ語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "剣の加護／優しき水"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "剣の加護／優しき水",
        text: "［剣の加護／優しき水］：水中でも1時間息継ぎなしでいられ、発声可能。毒、病気属性の抵抗に+2。",
      },
      {
        level: 6,
        name: "剣の加護／優しき水",
        text: "［剣の加護／優しき水］：片手で触れた仲間も恩恵が得られる。",
      },
      {
        level: 11,
        name: "剣の加護／優しき水",
        text: "［剣の加護／優しき水］：1時間全身を水に浸し休息することで、6時間睡眠ぶん回復。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "剣の加護／優しき水",
        text: "［剣の加護／優しき水］：全身を浸す効果を、10m内の同じ水に入っている仲間にも与えられる。",
      },
    ],
    aliases: ["エルフ"],
  },
  {
    id: "2.1",
    name: "エルフ（スノウエルフ）",
    race: "エルフ",
    variant: "スノウエルフ",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "エルフ語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "剣の加護／厳つき氷"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "剣の加護／厳つき氷",
        text: "［剣の加護／厳つき氷］：▶でCL点の確定ダメージを与えることができる。",
      },
      {
        level: 6,
        name: "剣の加護／厳つき氷",
        text: "［剣の加護／厳つき氷］：⏩で、3点の確定ダメージが与えられるようになる。",
      },
      {
        level: 11,
        name: "剣の加護／厳つき氷",
        text: "［剣の加護／厳つき氷］：⏩でのダメージが+2点（計5点）となる。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "剣の加護／優しき水",
        text: "［剣の加護／優しき水］：全身を浸す効果を、10m内の同じ水に入っている仲間にも与えられる。",
      },
    ],
    aliases: ["エルフ（スノウエルフ）", "エルフ(スノウエルフ)"],
  },
  {
    id: "2.2",
    name: "エルフ（ミストエルフ）",
    race: "エルフ",
    variant: "ミストエルフ",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "エルフ語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "剣の加護／惑いの霧"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "剣の加護／惑いの霧",
        text: "［剣の加護／惑いの霧］：合計1分、敵対者からの視認を困難にし、「知覚：五感」「知覚：機械」は命中-1。",
      },
      {
        level: 6,
        name: "剣の加護／惑いの霧",
        text: "［剣の加護／惑いの霧］：「知覚：魔法」も命中-1される。",
      },
      {
        level: 11,
        name: "剣の加護／惑いの霧",
        text: "［剣の加護／惑いの霧］：時間制限がなくなる。",
      },
    ],
    aliases: ["エルフ（ミストエルフ）", "エルフ(ミストエルフ)"],
  },
  {
    id: "3.0",
    name: "ドワーフ",
    race: "ドワーフ",
    variant: "",
    source: "1",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d+6",
      agi: "1d",
      str: "2d",
      vit: "2d",
      int: "1d",
      mnd: "2d+6",
    },
    languages: "ドワーフ語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "剣の加護／炎身"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "剣の加護／炎身",
        text: "［剣の加護／炎身］：炎属性のダメージ無効。",
      },
      {
        level: 6,
        name: "剣の加護／炎身",
        text: "［剣の加護／炎身］：片手で触れた仲間も恩恵が得られる。",
      },
      {
        level: 11,
        name: "剣の加護／炎身",
        text: "［剣の加護／炎身］：純エネルギー属性のダメージ半減。「抵抗：半減」は「抵抗：消滅」として扱う。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "剣の加護／炎身",
        text: "［剣の加護／炎身］：純エネルギーも無効。",
      },
    ],
    aliases: ["ドワーフ"],
  },
  {
    id: "4.0",
    name: "タビット",
    race: "タビット",
    variant: "",
    source: "1",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "1d",
      str: "1d",
      vit: "2d",
      int: "2d+6",
      mnd: "2d",
    },
    languages: "神紀文明語",
    speaks: false,
    reads: true,
    restrictedClass: "プリースト",
    featureNames: ["第六感"],
    features: [
      {
        level: 1,
        name: "第六感",
        text: "［第六感］：危険察知を「冒険者+知力B」で行える。",
      },
      {
        level: 6,
        name: "第六感",
        text: "［第六感］：罠回避も「冒険者+知力B」で行える。",
      },
      {
        level: 11,
        name: "第六感",
        text: "［第六感］：危険感知、罠回避+4。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "第六感",
        text: "［第六感］：1日1回だけ危険感知、罠感知をダイスを振る前に6ゾロ(41)として扱うことができる。",
      },
    ],
    aliases: ["タビット"],
  },
  {
    id: "4.1",
    name: "タビット（パイカ種タビット）",
    race: "タビット",
    variant: "パイカ種タビット",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "1d+3",
      str: "1d+3",
      vit: "2d",
      int: "2d+3",
      mnd: "2d-3",
    },
    languages: "神紀文明語",
    speaks: false,
    reads: true,
    restrictedClass: "プリースト",
    featureNames: ["第六感", "ホイッスル"],
    features: [
      {
        level: 1,
        name: "第六感",
        text: "［第六感］：危険察知を「冒険者+知力B」で行える",
      },
      {
        level: 1,
        name: "ホイッスル",
        text: "［ホイッスル］：100m距離でパイカ種の会話ができる。",
      },
      {
        level: 6,
        name: "第六感",
        text: "［第六感］：罠回避も「冒険者+知力B」で行える。",
      },
      {
        level: 11,
        name: "第六感",
        text: "［第六感］：危険感知、罠回避+4。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "第六感",
        text: "［第六感］：1日1回だけ危険感知、罠感知をダイスを振る前に6ゾロ(41)として扱うことができる。",
      },
    ],
    aliases: ["タビット（パイカ種タビット）", "タビット(パイカ種タビット)"],
  },
  {
    id: "4.2",
    name: "タビット（リパス種タビット）",
    race: "タビット",
    variant: "リパス種タビット",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "1d+3",
      str: "1d",
      vit: "2d",
      int: "2d+6",
      mnd: "2d",
    },
    languages: "神紀文明語",
    speaks: false,
    reads: true,
    restrictedClass: "プリースト",
    featureNames: ["第六感", "暗視"],
    features: [
      {
        level: 1,
        name: "第六感",
        text: "［第六感］：危険察知を「冒険者+知力B」で行える",
      },
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 6,
        name: "第六感",
        text: "［第六感］：罠回避も「冒険者+知力B」で行える。",
      },
      {
        level: 11,
        name: "第六感",
        text: "［第六感］：危険感知、罠回避+4。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "第六感",
        text: "［第六感］：1日1回だけ危険感知、罠感知をダイスを振る前に6ゾロ(41)として扱うことができる。",
      },
    ],
    aliases: ["タビット（リパス種タビット）", "タビット(リパス種タビット)"],
  },
  {
    id: "5.0",
    name: "ルーンフォーク",
    race: "ルーンフォーク",
    variant: "",
    source: "1",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "1d",
      str: "2d",
      vit: "2d",
      int: "2d",
      mnd: "1d",
    },
    languages: "魔動機文明語",
    speaks: true,
    reads: true,
    restrictedClass: "フェアリーテイマー、プリースト、ドルイド",
    featureNames: ["暗視", "HP変換"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "HP変換",
        text: "［HP変換］：1日1回▶でHPを好きな数MPに変換できる。",
      },
      {
        level: 6,
        name: "HP変換",
        text: "［HP変換］：⏩と△で使えるようになる。",
      },
      {
        level: 11,
        name: "HP変換",
        text: "［HP変換］：1日2回使用可能。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "HP変換",
        text: "［HP変換］：HP1でMP3回復できるようになる。MP回復効果を手を触れた自身以外1人に与えられる(自分と仲間を同時に回復できない。",
      },
    ],
    aliases: ["ルーンフォーク"],
  },
  {
    id: "5.0",
    name: "ルーンフォーク（護衛型ルーンフォーク）",
    race: "ルーンフォーク",
    variant: "護衛型ルーンフォーク",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "1d",
      str: "2d",
      vit: "2d",
      int: "2d",
      mnd: "1d",
    },
    languages: "魔動機文明語",
    speaks: true,
    reads: true,
    restrictedClass: "フェアリーテイマー、プリースト、ドルイド",
    featureNames: ["暗視", "仲間との絆"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "仲間との絆",
        text: "［仲間との絆］：1日1回、周りの仲間がダメージ受ける時、割り込みで3点軽減できる、軽減した相手の部位×3点MP消費。",
      },
      {
        level: 6,
        name: "仲間との絆",
        text: "［仲間との絆］：部位×5にすることで、5点軽減にできる。",
      },
      {
        level: 11,
        name: "仲間との絆",
        text: "［仲間との絆］：1日2回使用可能。",
      },
    ],
    aliases: [
      "ルーンフォーク（護衛型ルーンフォーク）",
      "ルーンフォーク(護衛型ルーンフォーク)",
    ],
  },
  {
    id: "5.0",
    name: "ルーンフォーク（戦闘型ルーンフォーク）",
    race: "ルーンフォーク",
    variant: "戦闘型ルーンフォーク",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "1d",
      str: "2d",
      vit: "2d",
      int: "2d",
      mnd: "1d",
    },
    languages: "魔動機文明語",
    speaks: true,
    reads: true,
    restrictedClass: "フェアリーテイマー、プリースト、ドルイド",
    featureNames: ["暗視", "任務遂行の意志"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "任務遂行の意志",
        text: "［任務遂行の意志］：1日1回、初回の威力表が3以下だったら振り直せる。",
      },
      {
        level: 6,
        name: "任務遂行の意志",
        text: "［任務遂行の意志］：初回の威力表が4以下でも振り直せる。",
      },
      {
        level: 11,
        name: "任務遂行の意志",
        text: "［任務遂行の意志］：1日2回使用可能。",
      },
    ],
    aliases: [
      "ルーンフォーク（戦闘型ルーンフォーク）",
      "ルーンフォーク(戦闘型ルーンフォーク)",
    ],
  },
  {
    id: "6.0",
    name: "リカント",
    race: "リカント",
    variant: "",
    source: "1",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "1d+3",
      str: "2d",
      vit: "2d",
      int: "1d+6",
      mnd: "1d",
    },
    languages: "リカント語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視(獣変貌)", "獣変貌"],
    features: [
      {
        level: 1,
        name: "暗視(獣変貌)",
        text: "［暗視(獣変貌)］",
      },
      {
        level: 1,
        name: "獣変貌",
        text: "［獣変貌］：▶で変貌／戻る。筋力B+2。［暗視(獣変貌)］を得る。リカント語以外使えなくなり、魔法が限られるようになる。",
      },
      {
        level: 6,
        name: "獣変貌",
        text: "［獣変貌］：1日1回、⏩と△で行えるようになる（戻るのは▶のみ）。",
      },
      {
        level: 11,
        name: "獣変貌",
        text: "［獣変貌］：［獣変貌］時敏捷B+1。",
      },
    ],
    aliases: ["リカント"],
  },
  {
    id: "6.1",
    name: "リカント（大型草食獣リカント）",
    race: "リカント",
    variant: "大型草食獣リカント",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "1d+3",
      str: "2d",
      vit: "2d",
      int: "1d+6",
      mnd: "1d",
    },
    languages: "リカント語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視(獣変貌)", "獣変貌(大型草食獣)"],
    features: [
      {
        level: 1,
        name: "暗視(獣変貌)",
        text: "［暗視(獣変貌)］",
      },
      {
        level: 1,
        name: "獣変貌(大型草食獣)",
        text: "［獣変貌(大型草食獣)］：▶で変貌／戻る。HP値+10。⏩で1ラウンド1回、「頭突き」可能。2点の確定ダメージ［［暗視(獣変貌)］を得る。リカント語以外使えなくなり、魔法が限られるようになる。",
      },
      {
        level: 6,
        name: "獣変貌",
        text: "［獣変貌］：1日1回、⏩と△で行えるようになる（戻るのは▶のみ）。",
      },
      {
        level: 11,
        name: "獣変貌",
        text: "［獣変貌］：「頭突き」確定ダメージ+2点（計4点）。",
      },
    ],
    aliases: ["リカント（大型草食獣リカント）", "リカント(大型草食獣リカント)"],
  },
  {
    id: "6.2",
    name: "リカント（小型草食獣リカント）",
    race: "リカント",
    variant: "小型草食獣リカント",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "1d+3",
      str: "2d",
      vit: "2d",
      int: "1d+6",
      mnd: "1d",
    },
    languages: "リカント語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視(獣変貌)", "獣変貌(小型草食獣)"],
    features: [
      {
        level: 1,
        name: "獣変貌(小型草食獣)",
        text: "［獣変貌(小型草食獣)］",
      },
      {
        level: 1,
        name: "暗視(獣変貌)",
        text: "［暗視(獣変貌)］",
      },
      {
        level: 1,
        name: "獣変貌",
        text: "［獣変貌］：▶で変貌／戻る。敏捷B+1、観察パッケージ+1。［暗視(獣変貌)］を得る。リカント語以外使えなくなり、魔法が限られるようになる。",
      },
      {
        level: 6,
        name: "獣変貌",
        text: "［獣変貌］：1日1回、⏩と△で行えるようになる（戻るのは▶のみ）。",
      },
      {
        level: 11,
        name: "獣変貌",
        text: "［獣変貌］：［獣変貌］時さらに敏捷B+1（計+2）。",
      },
    ],
    aliases: ["リカント（小型草食獣リカント）", "リカント(小型草食獣リカント)"],
  },
  {
    id: "7.0",
    name: "ナイトメア（人間）",
    race: "ナイトメア",
    variant: "人間生まれ",
    source: "1",
    isBarbarous: false,
    taint: "1",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "1d",
      int: "2d",
      mnd: "2d",
    },
    languages: "地方語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["異貌", "弱点／土"],
    features: [
      {
        level: 1,
        name: "弱点／土",
        text: "［弱点／土］",
      },
      {
        level: 1,
        name: "異貌",
        text: "［異貌］：⏩か△で異貌できる。魔法行使で発声と文字書きを不要とする。▶で戻す",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：土属性と、銀+2ダメージ。",
      },
      {
        level: 6,
        name: "異貌",
        text: "［異貌］：［異貌］時武器攻撃、ダメージを直接与える魔法のダメージに+1。",
      },
      {
        level: 11,
        name: "異貌",
        text: "［異貌］：［異貌］時命中、魔法行使+1。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "異貌",
        text: "［異貌］：任意の能力値を+6(B+1)させられるようになる。上昇する能力の種類はAM6時に変更可能。",
      },
    ],
    aliases: [
      "ナイトメア（人間）",
      "ナイトメア（人間生まれ）",
      "ナイトメア(人間生まれ)",
      "ナイトメア(人間)",
    ],
  },
  {
    id: "7.1",
    name: "ナイトメア（エルフ）",
    race: "ナイトメア",
    variant: "エルフ生まれ",
    source: "1",
    isBarbarous: false,
    taint: "1",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "1d",
      int: "2d",
      mnd: "2d",
    },
    languages: "エルフ語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["異貌", "弱点／水・氷"],
    features: [
      {
        level: 1,
        name: "弱点／水・氷",
        text: "［弱点／水・氷］",
      },
      {
        level: 1,
        name: "異貌",
        text: "［異貌］：⏩か△で異貌できる。魔法行使で発声と文字書きを不要とする。▶で戻す",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：水氷属性と、銀+2ダメージ。",
      },
      {
        level: 6,
        name: "異貌",
        text: "［異貌］：武器攻撃、ダメージを直接与える魔法のダメージに+1。",
      },
      {
        level: 11,
        name: "異貌",
        text: "［異貌］：［異貌］時命中、魔法行使+1。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "異貌",
        text: "［異貌］：任意の能力値を+6(B+1)させられるようになる。上昇する能力の種類はAM6時に変更可能。",
      },
    ],
    aliases: [
      "ナイトメア（エルフ）",
      "ナイトメア（エルフ生まれ）",
      "ナイトメア(エルフ生まれ)",
      "ナイトメア(エルフ)",
    ],
  },
  {
    id: "7.2",
    name: "ナイトメア（ドワーフ）",
    race: "ナイトメア",
    variant: "ドワーフ生まれ",
    source: "1",
    isBarbarous: false,
    taint: "1",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "1d",
      int: "2d",
      mnd: "2d",
    },
    languages: "ドワーフ語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["異貌", "弱点／炎"],
    features: [
      {
        level: 1,
        name: "弱点／炎",
        text: "［弱点／炎］",
      },
      {
        level: 1,
        name: "異貌",
        text: "［異貌］：⏩か△で異貌できる。魔法行使で発声と文字書きを不要とする。▶で戻す",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：炎属性と、銀+2ダメージ。",
      },
      {
        level: 6,
        name: "異貌",
        text: "［異貌］：武器攻撃、ダメージを直接与える魔法のダメージに+1。",
      },
      {
        level: 11,
        name: "異貌",
        text: "［異貌］：［異貌］時命中、魔法行使+1。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "異貌",
        text: "［異貌］：任意の能力値を+6(B+1)させられるようになる。上昇する能力の種類はAM6時に変更可能。",
      },
    ],
    aliases: [
      "ナイトメア（ドワーフ）",
      "ナイトメア（ドワーフ生まれ）",
      "ナイトメア(ドワーフ生まれ)",
      "ナイトメア(ドワーフ)",
    ],
  },
  {
    id: "7.3",
    name: "ナイトメア（リルドラケン）",
    race: "ナイトメア",
    variant: "リルドラケン生まれ",
    source: "1",
    isBarbarous: false,
    taint: "1",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "1d",
      int: "2d",
      mnd: "2d",
    },
    languages: "ドラゴン語",
    speaks: true,
    reads: false,
    restrictedClass: "",
    featureNames: ["異貌", "弱点／風"],
    features: [
      {
        level: 1,
        name: "弱点／風",
        text: "［弱点／風］",
      },
      {
        level: 1,
        name: "異貌",
        text: "［異貌］：⏩か△で異貌できる。魔法行使で発声と文字書きを不要とする。▶で戻す",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：風属性と、銀+2ダメージ。",
      },
      {
        level: 6,
        name: "異貌",
        text: "［異貌］：武器攻撃、ダメージを直接与える魔法のダメージに+1。",
      },
      {
        level: 11,
        name: "異貌",
        text: "［異貌］：［異貌］時命中、魔法行使+1。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "異貌",
        text: "［異貌］：任意の能力値を+6(B+1)させられるようになる。上昇する能力の種類はAM6時に変更可能。",
      },
    ],
    aliases: [
      "ナイトメア（リルドラケン）",
      "ナイトメア（リルドラケン生まれ）",
      "ナイトメア(リルドラケン生まれ)",
      "ナイトメア(リルドラケン)",
    ],
  },
  {
    id: "7.4",
    name: "ナイトメア（シャドウ）",
    race: "ナイトメア",
    variant: "シャドウ生まれ",
    source: "AR",
    isBarbarous: false,
    taint: "1",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "1d",
      int: "2d",
      mnd: "2d",
    },
    languages: "シャドウ語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["異貌", "弱点／精神効果"],
    features: [
      {
        level: 1,
        name: "弱点／精神効果",
        text: "［弱点／精神効果］",
      },
      {
        level: 1,
        name: "異貌",
        text: "［異貌］：⏩か△で異貌できる。魔法行使で発声と文字書きを不要とする。▶で戻す",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：精神効果への抵抗判定-1と、銀+2ダメージ。",
      },
      {
        level: 6,
        name: "異貌",
        text: "［異貌］：武器攻撃、ダメージを直接与える魔法のダメージに+1。",
      },
      {
        level: 11,
        name: "異貌",
        text: "［異貌］：［異貌］時命中、魔法行使+1。",
      },
    ],
    aliases: [
      "ナイトメア（シャドウ）",
      "ナイトメア（シャドウ生まれ）",
      "ナイトメア(シャドウ生まれ)",
      "ナイトメア(シャドウ)",
    ],
  },
  {
    id: "7.5",
    name: "ナイトメア（ソレイユ）",
    race: "ナイトメア",
    variant: "ソレイユ生まれ",
    source: "AR",
    isBarbarous: false,
    taint: "1",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "1d",
      int: "2d",
      mnd: "2d",
    },
    languages: "ソレイユ語",
    speaks: true,
    reads: false,
    restrictedClass: "",
    featureNames: ["異貌", "弱点／純エネルギー"],
    features: [
      {
        level: 1,
        name: "弱点／純エネルギー",
        text: "［弱点／純エネルギー］",
      },
      {
        level: 1,
        name: "異貌",
        text: "［異貌］：⏩か△で異貌できる。魔法行使で発声と文字書きを不要とする。▶で戻す",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：純エネルギー属性と、銀+2ダメージ。",
      },
      {
        level: 6,
        name: "異貌",
        text: "［異貌］：武器攻撃、ダメージを直接与える魔法のダメージに+1。",
      },
      {
        level: 11,
        name: "異貌",
        text: "［異貌］：［異貌］時命中、魔法行使+1。",
      },
    ],
    aliases: [
      "ナイトメア（ソレイユ）",
      "ナイトメア（ソレイユ生まれ）",
      "ナイトメア(ソレイユ生まれ)",
      "ナイトメア(ソレイユ)",
    ],
  },
  {
    id: "8.0",
    name: "リルドラケン",
    race: "リルドラケン",
    variant: "",
    source: "2",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "2d",
      str: "2d",
      vit: "2d+6",
      int: "1d",
      mnd: "2d",
    },
    languages: "ドラゴン語",
    speaks: true,
    reads: false,
    restrictedClass: "",
    featureNames: ["鱗の皮膚", "尻尾が武器", "剣の加護／風の翼"],
    features: [
      {
        level: 1,
        name: "尻尾が武器",
        text: "［尻尾が武器］",
      },
      {
        level: 1,
        name: "鱗の皮膚",
        text: "［鱗の皮膚］：防護+1、［尻尾が武器］：尻尾を武器として使用可能",
      },
      {
        level: 1,
        name: "剣の加護／風の翼",
        text: "［剣の加護／風の翼］：1日合計1分飛行可能。(命中回避+1)200kg程度まで抱えて飛べる。",
      },
      {
        level: 6,
        name: "剣の加護／風の翼",
        text: "［剣の加護／風の翼］：使用時全力移動が可能になる。",
      },
      {
        level: 11,
        name: "剣の加護／風の翼",
        text: "［剣の加護／風の翼］：使用時間が1日2分(12R)になる。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "剣の加護／風の翼",
        text: "［剣の加護／風の翼］：時間制限解除、常に飛行可能。",
      },
    ],
    aliases: ["リルドラケン"],
  },
  {
    id: "8.1",
    name: "リルドラケン（小翼種リルドラケン）",
    race: "リルドラケン",
    variant: "小翼種リルドラケン",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "2d",
      str: "2d",
      vit: "2d+6",
      int: "1d",
      mnd: "2d",
    },
    languages: "ドラゴン語",
    speaks: true,
    reads: false,
    restrictedClass: "",
    featureNames: ["鱗の皮膚", "尻尾が武器", "剣の加護／竜の咆哮"],
    features: [
      {
        level: 1,
        name: "尻尾が武器",
        text: "［尻尾が武器］",
      },
      {
        level: 1,
        name: "鱗の皮膚",
        text: "［鱗の皮膚］：防護+1、［尻尾が武器］：尻尾を武器として使用可能",
      },
      {
        level: 1,
        name: "剣の加護／竜の咆哮",
        text: "［剣の加護／竜の咆哮］：⏩△1日1回、自分周囲の生命精神抵抗与ダメ+2。",
      },
      {
        level: 6,
        name: "剣の加護／竜の咆哮",
        text: "［剣の加護／竜の咆哮］：1日2回使用可能。",
      },
      {
        level: 11,
        name: "剣の加護／竜の咆哮",
        text: "［剣の加護／竜の咆哮］：生命精神抵抗与ダメさらに+2（計+4）。",
      },
    ],
    aliases: [
      "リルドラケン（小翼種リルドラケン）",
      "リルドラケン(小翼種リルドラケン)",
    ],
  },
  {
    id: "8.2",
    name: "リルドラケン（有毛種リルドラケン）",
    race: "リルドラケン",
    variant: "有毛種リルドラケン",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "2d",
      str: "2d",
      vit: "2d+6",
      int: "1d",
      mnd: "2d",
    },
    languages: "ドラゴン語",
    speaks: true,
    reads: false,
    restrictedClass: "",
    featureNames: ["暖かき風", "剣の加護／風の翼"],
    features: [
      {
        level: 1,
        name: "暖かき風",
        text: "［暖かき風］",
      },
      {
        level: 1,
        name: "鱗の皮膚",
        text: "［鱗の皮膚］：防護+1、［尻尾が武器］：尻尾を武器として使用可能",
      },
      {
        level: 1,
        name: "剣の加護／風の翼",
        text: "［剣の加護／風の翼］：与える風属性ダメージ+2、受ける風属性ダメージ-2。",
      },
      {
        level: 6,
        name: "剣の加護／風の翼",
        text: "［剣の加護／風の翼］：「水・氷属性」も追加。",
      },
      {
        level: 11,
        name: "剣の加護／風の翼",
        text: "［剣の加護／風の翼］：さらに+1点（計3点）。",
      },
    ],
    aliases: [
      "リルドラケン（有毛種リルドラケン）",
      "リルドラケン(有毛種リルドラケン)",
    ],
  },
  {
    id: "9.0",
    name: "グラスランナー",
    race: "グラスランナー",
    variant: "",
    source: "2",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "2d+6",
      int: "1d",
      mnd: "2d+6",
    },
    languages: "グラスランナー語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["マナ不干渉", "虫や植物との意思疎通"],
    features: [
      {
        level: 1,
        name: "マナ不干渉",
        text: "［マナ不干渉］：MP：なし。精神抵抗判定が「抵抗：消滅」になる。",
      },
      {
        level: 1,
        name: "虫や植物との意思疎通",
        text: "［虫や植物との意思疎通］：虫や植物の感じていることを理解できる。",
      },
      {
        level: 6,
        name: "マナ不干渉",
        text: "［マナ不干渉］：1日1回、▶で魔法破りを試みれる。冒Lv+精神Bで成功したら、魔法を解除。",
      },
      {
        level: 11,
        name: "マナ不干渉",
        text: "［マナ不干渉］：「知覚：魔法」と戦う時命中回避+1。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "マナ不干渉",
        text: "［マナ不干渉］：魔法破り回数が1時間1回。「知覚：魔法」と戦う時命中回避ボーナス修正さらに+1(計+2)。",
      },
    ],
    aliases: ["グラスランナー"],
  },
  {
    id: "9.1",
    name: "グラスランナー（アリーシャ）",
    race: "グラスランナー",
    variant: "アリーシャ",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "2d+6",
      int: "1d",
      mnd: "2d+6",
    },
    languages: "グラスランナー語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["マナ不干渉", "虫や植物との意思疎通"],
    features: [
      {
        level: 1,
        name: "マナ不干渉",
        text: "［マナ不干渉］：MP：なし。精神抵抗判定が「抵抗：消滅」になる。",
      },
      {
        level: 1,
        name: "虫や植物との意思疎通",
        text: "［虫や植物との意思疎通］：虫や植物の感じていることを理解できる。",
      },
      {
        level: 6,
        name: "マナ不干渉",
        text: "［マナ不干渉］：1日1回、▶で魔法破りを試みれる。冒Lv+精神Bで成功したら、魔法を解除。",
      },
      {
        level: 11,
        name: "マナ不干渉",
        text: "［マナ不干渉］：魔法破りを射程10m、+4ボーナスでできる。《ワードブレイク》も射程とボーナス伸びる。",
      },
    ],
    aliases: ["グラスランナー（アリーシャ）", "グラスランナー(アリーシャ)"],
  },
  {
    id: "9.2",
    name: "グラスランナー（クリメノス）",
    race: "グラスランナー",
    variant: "クリメノス",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "2d+6",
      int: "1d",
      mnd: "2d+6",
    },
    languages: "グラスランナー語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["マナ不干渉", "虫や植物との意思疎通"],
    features: [
      {
        level: 1,
        name: "マナ不干渉",
        text: "［マナ不干渉］：MP：なし。精神抵抗判定が「抵抗：消滅」になる。",
      },
      {
        level: 1,
        name: "虫や植物との意思疎通",
        text: "［虫や植物との意思疎通］：虫や植物の感じていることを理解できる。",
      },
      {
        level: 6,
        name: "マナ不干渉",
        text: "［マナ不干渉］：「知覚：魔法」相手に隠密命中回避+1。",
      },
      {
        level: 11,
        name: "マナ不干渉",
        text: "［マナ不干渉］：隠密命中回避さらに+1（計+2）。",
      },
    ],
    aliases: ["グラスランナー（クリメノス）", "グラスランナー(クリメノス)"],
  },
  {
    id: "10.0",
    name: "メリア",
    race: "メリア",
    variant: "",
    source: "2",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "1d",
      str: "1d",
      vit: "2d+6",
      int: "1d",
      mnd: "1d",
    },
    languages: "妖精語",
    speaks: true,
    reads: false,
    restrictedClass: "",
    featureNames: ["繁茂する生命"],
    features: [
      {
        level: 1,
        name: "繁茂する生命",
        text: "［繁茂する生命］：眠らなくても支障なし。朝6時にHP2割、MP全回復する。",
      },
      {
        level: 6,
        name: "繁茂する生命",
        text: "［繁茂する生命］：自然環境かつ太陽の光が届いているなら、生命抵抗、生死判定+4。",
      },
      {
        level: 11,
        name: "繁茂する生命",
        text: "［繁茂する生命］：AM6時だけでなく、PM6時にも回復。",
      },
    ],
    aliases: ["メリア"],
  },
  {
    id: "10.1",
    name: "メリア（カーニバラスメリア）",
    race: "メリア",
    variant: "カーニバラスメリア",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "1d",
      str: "1d",
      vit: "2d+6",
      int: "1d",
      mnd: "1d",
    },
    languages: "妖精語",
    speaks: true,
    reads: false,
    restrictedClass: "",
    featureNames: ["捕食する生命"],
    features: [
      {
        level: 1,
        name: "捕食する生命",
        text: "［捕食する生命］：眠らなくても支障なし。HP、MPは睡眠必要。1日1回だけ、適用ダメージだけHP回復できる。",
      },
      {
        level: 6,
        name: "捕食する生命",
        text: "［捕食する生命］：生命力Bだけ、MPも回復。",
      },
      {
        level: 11,
        name: "捕食する生命",
        text: "［捕食する生命］：1日2回使用可能。",
      },
    ],
    aliases: ["メリア（カーニバラスメリア）", "メリア(カーニバラスメリア)"],
  },
  {
    id: "10.2",
    name: "メリア（ファンギーメリア）",
    race: "メリア",
    variant: "ファンギーメリア",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "1d",
      str: "1d",
      vit: "2d+6",
      int: "1d",
      mnd: "1d",
    },
    languages: "妖精語",
    speaks: true,
    reads: false,
    restrictedClass: "",
    featureNames: ["胞子散布"],
    features: [
      {
        level: 1,
        name: "胞子散布",
        text: "［胞子散布］：眠らなくても支障なし。HP、MPは睡眠必要。1日1回、⏩で胞子を撒き、接触1体に10秒行動判定-2。",
      },
      {
        level: 6,
        name: "胞子散布",
        text: "［胞子散布］：対象が1エリアになる。",
      },
      {
        level: 11,
        name: "胞子散布",
        text: "［胞子散布］：行動判定ではなく、行為判定に-2。",
      },
    ],
    aliases: ["メリア（ファンギーメリア）", "メリア(ファンギーメリア)"],
  },
  {
    id: "11.0",
    name: "ティエンス",
    race: "ティエンス",
    variant: "",
    source: "3",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "1d+3",
      int: "2d",
      mnd: "2d+3",
    },
    languages: "魔神語",
    speaks: true,
    reads: false,
    restrictedClass: "",
    featureNames: ["通じ合う意識"],
    features: [
      {
        level: 1,
        name: "通じ合う意識",
        text: "［通じ合う意識］：10m以内の互いをよく知っているか見えたキャラと思念疎通可能。動物、騎獣には鼓舞可能（命中回避+1）。1分有効で、6時間1回のみ使用可能。",
      },
      {
        level: 6,
        name: "通じ合う意識",
        text: "［通じ合う意識］：距離が30m(全エリア)になる。",
      },
      {
        level: 11,
        name: "通じ合う意識",
        text: "［通じ合う意識］：鼓舞効果がさらに+1(計+2)される。",
      },
    ],
    aliases: ["ティエンス"],
  },
  {
    id: "11.1",
    name: "ティエンス（ティエンス機解種）",
    race: "ティエンス",
    variant: "ティエンス機解種",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "1d+3",
      int: "2d",
      mnd: "2d+3",
    },
    languages: "魔神語",
    speaks: true,
    reads: false,
    restrictedClass: "",
    featureNames: ["無生物と通じ合う意識"],
    features: [
      {
        level: 1,
        name: "無生物と通じ合う意識",
        text: "［無生物と通じ合う意識］：10m以内の「魔動機」「魔法生物」と疎通可能。魔動機の騎獣やゴーレムに鼓舞可能（命中回避+1）。1分有効で、6時間1回のみ使用可能。",
      },
      {
        level: 6,
        name: "無生物と通じ合う意識",
        text: "［無生物と通じ合う意識］：距離が30m(全エリア)になる。",
      },
      {
        level: 11,
        name: "無生物と通じ合う意識",
        text: "［無生物と通じ合う意識］：鼓舞効果がさらに+1(計+2)される。",
      },
    ],
    aliases: ["ティエンス（ティエンス機解種）", "ティエンス(ティエンス機解種)"],
  },
  {
    id: "11.2",
    name: "ティエンス（ティエンス魔解種）",
    race: "ティエンス",
    variant: "ティエンス魔解種",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "1d+3",
      int: "2d",
      mnd: "2d+3",
    },
    languages: "魔神語",
    speaks: true,
    reads: false,
    restrictedClass: "",
    featureNames: ["魔神と通じ合う意識"],
    features: [
      {
        level: 1,
        name: "魔神と通じ合う意識",
        text: "［魔神と通じ合う意識］：「魔神」と疎通可能。1日1回、召喚した魔神の「無差別」を結果を確認してから任意に変更可能。",
      },
      {
        level: 6,
        name: "魔神と通じ合う意識",
        text: "［魔神と通じ合う意識］：1日2回使用可能。",
      },
      {
        level: 11,
        name: "魔神と通じ合う意識",
        text: "［魔神と通じ合う意識］：変更した際、さらに+2のボーナス修正。",
      },
    ],
    aliases: ["ティエンス（ティエンス魔解種）", "ティエンス(ティエンス魔解種)"],
  },
  {
    id: "12.0",
    name: "レプラカーン",
    race: "レプラカーン",
    variant: "",
    source: "3",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "1d",
      str: "2d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "魔動機文明語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "見えざる手", "姿なき職人"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "見えざる手",
        text: "［見えざる手］：「部位：その他」が2個ある。",
      },
      {
        level: 1,
        name: "姿なき職人",
        text: "［姿なき職人］：MP5消費、▶で姿を消す。",
      },
      {
        level: 6,
        name: "見えざる手",
        text: "［見えざる手］：「部位：その他」がさらに+1(計3)される。",
      },
      {
        level: 11,
        name: "見えざる手",
        text: "［見えざる手］：装備品の交換を1Rに1回⏩で行えるようになる。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "見えざる手",
        text: "［見えざる手］：「部位：その他」がさらに+1(計4)される。",
      },
    ],
    aliases: ["レプラカーン"],
  },
  {
    id: "12.1",
    name: "レプラカーン（放浪種レプラカーン）",
    race: "レプラカーン",
    variant: "放浪種レプラカーン",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "1d",
      str: "2d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "魔動機文明語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "見えざる手", "姿消す職人"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "見えざる手",
        text: "［見えざる手］：「部位：その他」が2個ある。",
      },
      {
        level: 1,
        name: "姿消す職人",
        text: "［姿消す職人］：1日1回、▶で10m以内に転移する。",
      },
      {
        level: 6,
        name: "見えざる手",
        text: "［見えざる手］：「部位：その他」がさらに+1(計3)される。",
      },
      {
        level: 11,
        name: "見えざる手",
        text: "［見えざる手］：装備品の交換を1Rに1回⏩で行えるようになる。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "見えざる手",
        text: "［見えざる手］：「部位：その他」がさらに+1(計4)される。",
      },
    ],
    aliases: [
      "レプラカーン（放浪種レプラカーン）",
      "レプラカーン(放浪種レプラカーン)",
    ],
  },
  {
    id: "12.2",
    name: "レプラカーン（探索種レプラカーン）",
    race: "レプラカーン",
    variant: "探索種レプラカーン",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "1d",
      str: "2d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "魔動機文明語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "見えざる手", "群れなす職人"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "見えざる手",
        text: "［見えざる手］：「部位：その他」が2個ある。",
      },
      {
        level: 1,
        name: "群れなす職人",
        text: "［群れなす職人］：MP5消費、▶で人形やゴーレムを操る。",
      },
      {
        level: 6,
        name: "見えざる手",
        text: "［見えざる手］：「部位：その他」がさらに+1(計3)される。",
      },
      {
        level: 11,
        name: "見えざる手",
        text: "［見えざる手］：装備品の交換を1Rに1回⏩で行えるようになる。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "見えざる手",
        text: "［見えざる手］：「部位：その他」がさらに+1(計4)される。",
      },
    ],
    aliases: [
      "レプラカーン（探索種レプラカーン）",
      "レプラカーン(探索種レプラカーン)",
    ],
  },
  {
    id: "13.0",
    name: "アルヴ",
    race: "アルヴ",
    variant: "",
    source: "OP",
    isBarbarous: false,
    taint: "1",
    dice: {
      dex: "1d",
      agi: "1d+3",
      str: "2d+3",
      vit: "2d",
      int: "1d+6",
      mnd: "1d",
    },
    languages: "地方語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "吸精"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "吸精",
        text: "［吸精］：▶体に接触してMPを「精神B+穢れ」点吸収。「精神力B」回までしか行えず、ＭＰを持つ分類「人族（アルヴ以外）」「蛮族」のキャラクターにしか使用できず、吸えないまま1週間が過ぎた場合、全判定-4、HPMP回復しない。そこから1週間経過すると衰弱死。",
      },
      {
        level: 6,
        name: "吸精",
        text: "［吸精］：射程が10m／起点指定になる。",
      },
      {
        level: 11,
        name: "吸精",
        text: "［吸精］：吸収MPが「精神B+穢れ+2」となる。",
      },
    ],
    aliases: ["アルヴ"],
  },
  {
    id: "14.0",
    name: "ウィークリング（ガルーダ）",
    race: "ウィークリング",
    variant: "ガルーダ生まれ",
    source: "OP",
    isBarbarous: true,
    taint: "2",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "2d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "汎用蛮族語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["蛮族の身体", "未熟な翼", "切り裂く風"],
    features: [
      {
        level: 1,
        name: "蛮族の身体",
        text: "［蛮族の身体］",
      },
      {
        level: 1,
        name: "未熟な翼",
        text: "［未熟な翼］：落下ダメージ-20",
      },
      {
        level: 1,
        name: "切り裂く風",
        text: "［切り裂く風］：▶MP4で「射程30m」「k10+冒険Lv+生命B@10」ダメージの風の特技が使える",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：衝撃+3ダメージ。",
      },
      {
        level: 6,
        name: "切り裂く風",
        text: "［切り裂く風］：MP追加で4(計8)消費することで、ダメージを「k30+冒険Lv+生命B」に変更可能。",
      },
      {
        level: 11,
        name: "切り裂く風",
        text: "［切り裂く風］：MP追加で8(計12)消費することで、ダメージを「k50+冒険Lv+生命B」に変更可能。",
      },
    ],
    aliases: [
      "ウィークリング（ガルーダ）",
      "ウィークリング（ガルーダ生まれ）",
      "ウィークリング(ガルーダ生まれ)",
      "ウィークリング(ガルーダ)",
    ],
  },
  {
    id: "14.1",
    name: "ウィークリング（バジリスク）",
    race: "ウィークリング",
    variant: "バジリスク生まれ",
    source: "OP",
    isBarbarous: true,
    taint: "2",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "2d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "汎用蛮族語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["蛮族の身体", "石化の視線", "毒の血液"],
    features: [
      {
        level: 1,
        name: "蛮族の身体",
        text: "［蛮族の身体］",
      },
      {
        level: 1,
        name: "石化の視線",
        text: "［石化の視線］：MP5、石化の効果を与える",
      },
      {
        level: 1,
        name: "毒の血液",
        text: "［毒の血液］：物理ダメージを受けた時相手に「1d-2(最低1)」の毒属性魔法ダメージを与える",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：水氷+3ダメージ。",
      },
      {
        level: 6,
        name: "毒の血液",
        text: "［毒の血液］：与ダメージが「1d」になる。",
      },
      {
        level: 11,
        name: "毒の血液",
        text: "［毒の血液］：与ダメージが「1d+2」になる。",
      },
    ],
    aliases: [
      "ウィークリング（バジリスク）",
      "ウィークリング（バジリスク生まれ）",
      "ウィークリング(バジリスク生まれ)",
      "ウィークリング(バジリスク)",
    ],
  },
  {
    id: "14.2",
    name: "ウィークリング（ミノタウロス）",
    race: "ウィークリング",
    variant: "ミノタウロス生まれ",
    source: "OP",
    isBarbarous: true,
    taint: "2",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "2d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "汎用蛮族語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["蛮族の身体", "暗視", "剛力"],
    features: [
      {
        level: 1,
        name: "蛮族の身体",
        text: "［蛮族の身体］",
      },
      {
        level: 1,
        name: "剛力",
        text: "［剛力］：近接2Hで+2ダメージ",
      },
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：魔法ダメージ+2。",
      },
      {
        level: 6,
        name: "剛力",
        text: "［剛力］：追加Dが更に+2(計4)になる。",
      },
      {
        level: 11,
        name: "剛力",
        text: "［剛力］：追加Dが更に+2(計6)になる。",
      },
    ],
    aliases: [
      "ウィークリング（ミノタウロス）",
      "ウィークリング（ミノタウロス生まれ）",
      "ウィークリング(ミノタウロス生まれ)",
      "ウィークリング(ミノタウロス)",
    ],
  },
  {
    id: "14.3",
    name: "ウィークリング（マーマン）",
    race: "ウィークリング",
    variant: "マーマン生まれ",
    source: "OP",
    isBarbarous: true,
    taint: "2",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "2d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "汎用蛮族語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["蛮族の身体", "水中適性", "水・氷耐性"],
    features: [
      {
        level: 1,
        name: "水・氷耐性",
        text: "［水・氷耐性］",
      },
      {
        level: 1,
        name: "水中適性",
        text: "［水中適性］",
      },
      {
        level: 1,
        name: "蛮族の身体",
        text: "［蛮族の身体］",
      },
      {
        level: 1,
        name: "水中適正",
        text: "［水中適正］：水中でも地上と同じ動作を行える",
      },
      {
        level: 1,
        name: "水氷耐性",
        text: "［水氷耐性］：水・氷属性ダメージ半減。「抵抗：半減」は「抵抗：消滅」として扱う。",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：炎+2ダメージ。",
      },
      {
        level: 6,
        name: "バブルフォーム",
        text: "［バブルフォーム］：水中で30秒集中すれば、全身を泡に変えれる。戻るときも同じ時間。泡は1日1時間まで、それを超えると戻れなくなる。",
      },
      {
        level: 11,
        name: "バブルフォーム",
        text: "［バブルフォーム］：変化が▶で行えるようになる。",
      },
    ],
    aliases: [
      "ウィークリング（マーマン）",
      "ウィークリング（マーマン生まれ）",
      "ウィークリング(マーマン生まれ)",
      "ウィークリング(マーマン)",
    ],
  },
  {
    id: "14.4",
    name: "ウィークリング（タンノズ）",
    race: "ウィークリング",
    variant: "タンノズ生まれ",
    source: "OP",
    isBarbarous: true,
    taint: "2",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "2d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "汎用蛮族語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["蛮族の身体", "水中適性", "甲殻の手"],
    features: [
      {
        level: 1,
        name: "水中適性",
        text: "［水中適性］",
      },
      {
        level: 1,
        name: "蛮族の身体",
        text: "［蛮族の身体］",
      },
      {
        level: 1,
        name: "水中適正",
        text: "［水中適正］：水中でも地上と同じ動作を行える",
      },
      {
        level: 1,
        name: "甲殻の手",
        text: "［甲殻の手］：右手が武器〈甲殻爪〉。両手を使用する際、-2のペナルティ",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：物理+2ダメージ。",
      },
      {
        level: 6,
        name: "甲殻の手",
        text: "［甲殻の手］：〈甲殻爪〉で置き換えられる武器の命中がさらに+1(計+2)。",
      },
      {
        level: 11,
        name: "甲殻の手",
        text: "［甲殻の手］：〈甲殻爪〉で置き換えられる武器の命中がさらに+1(計+3)。",
      },
    ],
    aliases: [
      "ウィークリング（タンノズ）",
      "ウィークリング（タンノズ生まれ）",
      "ウィークリング(タンノズ生まれ)",
      "ウィークリング(タンノズ)",
    ],
  },
  {
    id: "15.0",
    name: "シャドウ",
    race: "シャドウ",
    variant: "",
    source: "OP",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "1d",
      str: "2d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "シャドウ語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "月光の守り"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "月光の守り",
        text: "［月光の守り］：精神抵抗+4。",
      },
      {
        level: 6,
        name: "月光の守り",
        text: "［月光の守り］：毒、病気、呪い属性で受けるダメージ-3。",
      },
      {
        level: 11,
        name: "月光の守り",
        text: "［月光の守り］：精神抵抗がさらに+2(計6)、毒、病気、呪い属性で受けるダメージさらに-3(計6)。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "月光の守り",
        text: "［月光の守り］：1日1回だけ毒、病気、呪い属性の精神抵抗を、判定結果を確認してから自動成功にできる。",
      },
    ],
    aliases: ["シャドウ"],
  },
  {
    id: "16.0",
    name: "ソレイユ",
    race: "ソレイユ",
    variant: "",
    source: "OP",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "2d",
      str: "1d+6",
      vit: "2d",
      int: "1d",
      mnd: "2d",
    },
    languages: "ソレイユ語",
    speaks: true,
    reads: false,
    restrictedClass: "",
    featureNames: ["輝く肉体", "太陽の再生", "太陽の子"],
    features: [
      {
        level: 1,
        name: "輝く肉体",
        text: "［輝く肉体］：1日1回「射程接触」⏩で1Rの間、命中回避行使を-2させる。相手が金属鎧を装備している場合、マイナスは-1になる",
      },
      {
        level: 1,
        name: "太陽の再生",
        text: "［太陽の再生］：10分日光を浴びるとHP10回復。1日1時間分(HP60ぶん)まで使用可能",
      },
      {
        level: 1,
        name: "太陽の子",
        text: "［太陽の子］：AM6~PM6、精神効果への抵抗+4。PM6~AM6、精神効果への抵抗-4。",
      },
      {
        level: 6,
        name: "輝く肉体",
        text: "［輝く肉体］：この効果を「1エリア(半径6m)／20の範囲内、任意の対象全てに与えられるようになる。",
      },
      {
        level: 11,
        name: "輝く肉体",
        text: "［輝く肉体］：1日2回まで使えるようになる。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "輝く肉体",
        text: "［輝く肉体］：全ての行為判定に-2を与えられるように。金属鎧での軽減は相変わらず。",
      },
    ],
    aliases: ["ソレイユ"],
  },
  {
    id: "17.0",
    name: "スプリガン",
    race: "スプリガン",
    variant: "",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "2d",
      str: "1d",
      vit: "1d",
      int: "2d",
      mnd: "1d",
    },
    languages: "魔法文明語\n巨人語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "巨人化"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "巨人化",
        text: "［巨人化］：1日2回、▶で巨人形態になれる。敏捷-6、筋力生命+12。鎧は再装備要。10分経過で戻る。",
      },
      {
        level: 6,
        name: "巨人化",
        text: "［巨人化］：1日3回まで使えるようになる。10分経過していなくても自分で戻れるように成る。",
      },
      {
        level: 11,
        name: "巨人化",
        text: "［巨人化］：変化を⏩△で実行可能。",
      },
    ],
    aliases: ["スプリガン"],
  },
  {
    id: "18.0",
    name: "アビスボーン",
    race: "アビスボーン",
    variant: "",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "1d",
      str: "1d+6",
      vit: "2d",
      int: "2d",
      mnd: "1d",
    },
    languages: "地方語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: [
      "奈落の落とし子",
      "奈落の身体／アビストランク",
      "奈落の身体／アビスアーム",
      "奈落の身体／アビスアイ",
    ],
    features: [
      {
        level: 1,
        name: "奈落の落とし子",
        text: "［奈落の落とし子］：アビスカースを振って選ぶ必要がある。魔域内では発揮しない。",
      },
      {
        level: 1,
        name: "奈落の身体／アビストランク",
        text: "［奈落の身体／アビストランク］：防護+1。",
      },
      {
        level: 1,
        name: "奈落の身体／アビスアーム",
        text: "［奈落の身体／アビスアーム］：腕を使う近接武器の与ダメ+2。",
      },
      {
        level: 1,
        name: "奈落の身体／アビスアイ",
        text: "［奈落の身体／アビスアイ］：1日合計1分眼を開けて命中+1。",
      },
      {
        level: 6,
        name: "奈落の身体／アビストランク",
        text: "［奈落の身体／アビストランク］：防護さらに+1（計+2）。",
      },
      {
        level: 6,
        name: "奈落の身体／アビスアーム",
        text: "［奈落の身体／アビスアーム］：与ダメさらに+1（計+3）。",
      },
      {
        level: 6,
        name: "奈落の身体／アビスアイ",
        text: "［奈落の身体／アビスアイ］：命中さらに+1（計+2）。",
      },
      {
        level: 11,
        name: "奈落の身体／アビストランク",
        text: "［奈落の身体／アビストランク］：防護さらに+1（計+3）。",
      },
      {
        level: 11,
        name: "奈落の身体／アビスアーム",
        text: "［奈落の身体／アビスアーム］：与ダメさらに+1（計+4）。",
      },
      {
        level: 11,
        name: "奈落の身体／アビスアイ",
        text: "［奈落の身体／アビスアイ］：常時開眼可能。",
      },
    ],
    aliases: ["アビスボーン"],
  },
  {
    id: "19.0",
    name: "ハイマン",
    race: "ハイマン",
    variant: "",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "1d",
      str: "2d",
      vit: "1d",
      int: "1d",
      mnd: "1d",
    },
    languages: "魔法文明語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["魔法の申し子", "デジャヴ"],
    features: [
      {
        level: 1,
        name: "魔法の申し子",
        text: "［魔法の申し子］：すべての魔力+1、魔法行使で6ゾロした場合MP消費0",
      },
      {
        level: 1,
        name: "デジャヴ",
        text: "［デジャヴ］：1日1回、観察・知識パッケージ事前宣言で+2",
      },
      {
        level: 6,
        name: "魔法の申し子",
        text: "［魔法の申し子］：1ゾロでもMP消費0",
      },
      {
        level: 11,
        name: "魔法の申し子",
        text: "［魔法の申し子］：魔力さらに+1（計+2）。",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "魔法の申し子",
        text: "［魔法の申し子］：1ゾロにになったとき、MP消費0の自動失敗とするか、「基準値+2」として魔法を発揮するか選べる。",
      },
    ],
    aliases: ["ハイマン"],
  },
  {
    id: "20.0",
    name: "フロウライト",
    race: "フロウライト",
    variant: "",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "2d+6",
      vit: "2d",
      int: "1d",
      mnd: "2d+6",
    },
    languages: "任意",
    speaks: false,
    reads: false,
    restrictedClass: "エンハンサー",
    featureNames: ["魂の輝き", "鉱石の生命", "晶石の身体"],
    features: [
      {
        level: 1,
        name: "魂の輝き",
        text: "［魂の輝き］：⏩で、2-3エリアを明るい光で照らす。",
      },
      {
        level: 1,
        name: "鉱石の生命",
        text: "［鉱石の生命］：飲食呼吸必要なし、薬草ポーション薬品食事効果なし。",
      },
      {
        level: 1,
        name: "晶石の身体",
        text: "［晶石の身体］：水に浮かない。防護+2、MP+15。",
      },
      {
        level: 6,
        name: "晶石の身体",
        text: "［晶石の身体］：防護さらに+1（計3）、MPさらに+15（計+30）",
      },
      {
        level: 11,
        name: "晶石の身体",
        text: "［晶石の身体］：防護さらに+1（計4）、MPさらに+15（計+45）",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "晶石の身体",
        text: "［晶石の身体］：防護がさらに+2(計+6)、MPがさらに+30(計+75)上昇。",
      },
    ],
    aliases: ["フロウライト"],
  },
  {
    id: "21.0",
    name: "ダークドワーフ",
    race: "ダークドワーフ",
    variant: "",
    source: "AR",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d+6",
      agi: "1d",
      str: "2d",
      vit: "1d",
      int: "1d",
      mnd: "2d+6",
    },
    languages: "ドワーフ語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "黒炎の遣い手"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "黒炎の遣い手",
        text: "［黒炎の遣い手］：⏩1日合計1分。HP3消費、ダメージ1回を炎属性、ダメージ+3。炎無効無効。",
      },
      {
        level: 6,
        name: "黒炎の遣い手",
        text: "［黒炎の遣い手］：HP消費5点に変更可、追加ダメージ+2（計算5）。",
      },
      {
        level: 11,
        name: "黒炎の遣い手",
        text: "［黒炎の遣い手］：HP消費10点に変更可、さらに1ラウンドの間防護-2。",
      },
    ],
    aliases: ["ダークドワーフ"],
  },
  {
    id: "22.0",
    name: "ディアボロ",
    race: "ディアボロ",
    variant: "",
    source: "BR",
    isBarbarous: true,
    taint: "4",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "2d+6",
      vit: "2d",
      int: "1d",
      mnd: "1d+6",
    },
    languages: "汎用蛮族語\n魔神語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "飛行（飛翔）", "魔神の皮膚", "魔人化"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "飛行（飛翔）",
        text: "［飛行（飛翔）］：命中回避+1、魔人化で飛翔に変わる。",
      },
      {
        level: 1,
        name: "魔神の皮膚",
        text: "［魔神の皮膚］：断空、衝撃-3点。",
      },
      {
        level: 1,
        name: "魔人化",
        text: "［魔人化］：▶で魔人形態に変身可能、部位数が2になる。",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：純エネルギー属性ダメージ+3。",
      },
      {
        level: 6,
        name: "魔人化",
        text: "［魔人化］：魔人化を行った際、頭部が変身前の状態を受け継ぐか選べるように成る。",
      },
      {
        level: 8,
        name: "魔人化",
        text: "［魔人化］：⏩で行えるようになる。",
      },
      {
        level: 11,
        name: "飛行（飛翔）",
        text: "［飛行（飛翔）］：飛行Ⅱ（飛翔Ⅱ）となり、命中回避+1（計+2）",
      },
    ],
    aliases: ["ディアボロ"],
  },
  {
    id: "23.0",
    name: "ドレイク",
    race: "ドレイク",
    variant: "",
    source: "BR",
    isBarbarous: true,
    taint: "4",
    dice: {
      dex: "1d",
      agi: "1d",
      str: "2d",
      vit: "2d",
      int: "2d+6",
      mnd: "2d",
    },
    languages: "ドレイク語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "魔剣の所持", "飛行（飛翔）", "竜化"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "魔剣の所持",
        text: "［魔剣の所持］：作成時から〈ドレイクの魔剣〉を所持している。",
      },
      {
        level: 1,
        name: "飛行（飛翔）",
        text: "［飛行（飛翔）］：命中回避+1、魔人化で飛翔に変わる。",
      },
      {
        level: 1,
        name: "竜化",
        text: "［竜化］：▶で竜形態に変身可能、部位数が3になる。",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：魔法ダメージ+2。",
      },
      {
        level: 6,
        name: "竜化",
        text: "［竜化］：竜化を行った際、頭部が変身前の状態を受け継ぐか選べるように成る。",
      },
      {
        level: 11,
        name: "竜化",
        text: "［竜化］：⏩で行えるようになる。竜形態時には、純エネルギー属性の効果を受けない。",
      },
      {
        level: 13,
        name: "飛行（飛翔）",
        text: "［飛行（飛翔）］：飛行Ⅱ（飛翔Ⅱ）となり、命中回避+1（計+2）",
      },
    ],
    aliases: ["ドレイク"],
  },
  {
    id: "24.0",
    name: "バジリスク",
    race: "バジリスク",
    variant: "",
    source: "BR",
    isBarbarous: true,
    taint: "4",
    dice: {
      dex: "1d+6",
      agi: "2d",
      str: "2d",
      vit: "2d",
      int: "1d",
      mnd: "1d",
    },
    languages: "バジリスク語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["邪視と瞳石", "猛毒の血液", "魔物化"],
    features: [
      {
        level: 1,
        name: "邪視と瞳石",
        text: "［邪視と瞳石］：魔法の発動体を保持せず魔法行使可能。",
      },
      {
        level: 1,
        name: "猛毒の血液",
        text: "［猛毒の血液］：近接でダメージを受けた時、1dの毒属性の魔法ダメージを与える。",
      },
      {
        level: 1,
        name: "魔物化",
        text: "［魔物化］：魔物に形態に変身、知力-12、3部位の魔物になる。",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：水・氷属性ダメージ+3。",
      },
      {
        level: 6,
        name: "魔物化",
        text: "［魔物化］：魔物化を行った際、頭部が変身前の状態を受け継ぐか選べるようになる。",
      },
      {
        level: 9,
        name: "猛毒の血液",
        text: "［猛毒の血液］：［猛毒の血液］で与えるダメージが2dになる。",
      },
      {
        level: 11,
        name: "魔物化",
        text: "［魔物化］：⏩で行えるようになる。",
      },
    ],
    aliases: ["バジリスク"],
  },
  {
    id: "25.0",
    name: "ダークトロール",
    race: "ダークトロール",
    variant: "",
    source: "BR",
    isBarbarous: true,
    taint: "4",
    dice: {
      dex: "2d",
      agi: "1d",
      str: "2d",
      vit: "2d+6",
      int: "1d",
      mnd: "2d",
    },
    languages: "巨人語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "弱体化", "トロールの体躯"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "弱体化",
        text: "［弱体化］：太陽の下にいる限り、命中回避-2。",
      },
      {
        level: 1,
        name: "トロールの体躯",
        text: "［トロールの体躯］：防護+1。",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：魔法ダメージ+2。",
      },
      {
        level: 6,
        name: "限定再生",
        text: "［限定再生］：新規取得。1日1回、▶でCL×5点回復できる。",
      },
      {
        level: 11,
        name: "限定再生",
        text: "［限定再生］：⏩で行えるようになる。",
      },
    ],
    aliases: ["ダークトロール"],
  },
  {
    id: "26.0",
    name: "アルボル",
    race: "アルボル",
    variant: "",
    source: "BR",
    isBarbarous: true,
    taint: "2",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "1d+3",
      int: "2d",
      mnd: "2d",
    },
    languages: "汎用蛮族語\nドレイク語\n妖精語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["憤怒の炎／炎の武器", "憤怒の炎／炎の盾"],
    features: [
      {
        level: 1,
        name: "憤怒の炎／炎の武器",
        text: "［憤怒の炎／炎の武器］：武器に炎の力を与える。",
      },
      {
        level: 1,
        name: "憤怒の炎／炎の盾",
        text: "［憤怒の炎／炎の盾］：防護点を高め、攻撃者に炎のダメージを返す。",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：炎属性ダメージ+3。",
      },
      {
        level: 6,
        name: "憤怒の炎／炎の武器",
        text: "［憤怒の炎／炎の武器］：⏩で使用できるようになる。",
      },
      {
        level: 6,
        name: "憤怒の炎／炎の盾",
        text: "［憤怒の炎／炎の盾］：与える魔法ダメージが+2（計+3）される。",
      },
      {
        level: 11,
        name: "憤怒の炎／炎の武器",
        text: "［憤怒の炎／炎の武器］：与えるダメージが+2（計+4）される。",
      },
      {
        level: 11,
        name: "憤怒の炎／炎の盾",
        text: "［憤怒の炎／炎の盾］：防護点が+3（計+5）される。",
      },
    ],
    aliases: ["アルボル"],
  },
  {
    id: "27.0",
    name: "バーバヤガー",
    race: "バーバヤガー",
    variant: "",
    source: "BR",
    isBarbarous: true,
    taint: "2",
    dice: {
      dex: "2d",
      agi: "1d",
      str: "1d",
      vit: "1d",
      int: "2d",
      mnd: "1d+6",
    },
    languages: "魔法文明語\n汎用蛮族語\nドレイク語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["魔女化", "魔女の火"],
    features: [
      {
        level: 1,
        name: "魔女化",
        text: "［魔女化］：⏩△で魔女になる。魔力+1、穢れ+2。",
      },
      {
        level: 1,
        name: "魔女の火",
        text: "［魔女の火］：魔女化時のみ使用可。対象1体の魔法をLvぶんMPを追加消費したら、10以下の出目+2する。",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：物理ダメージ+2。",
      },
      {
        level: 6,
        name: "魔女の火",
        text: "［魔女の火］：1エリアでも対象になる。出目上昇は+1。",
      },
      {
        level: 11,
        name: "魔女の火",
        text: "［魔女の火］：消費MPがレベルの半分（切り上げ）に。",
      },
    ],
    aliases: ["バーバヤガー"],
  },
  {
    id: "28.0",
    name: "ケンタウロス",
    race: "ケンタウロス",
    variant: "",
    source: "BR",
    isBarbarous: true,
    taint: "3",
    dice: {
      dex: "2d+6",
      agi: "1d",
      str: "2d",
      vit: "2d",
      int: "1d",
      mnd: "2d",
    },
    languages: "ケンタウロス語",
    speaks: true,
    reads: true,
    restrictedClass: "グラップラー",
    featureNames: ["半馬半人", "馬人の武術"],
    features: [
      {
        level: 1,
        name: "半馬半人",
        text: "［半馬半人］：格闘武器〈蹄〉を持ち、移動速度2倍。騎乗負荷。足装備不可、腰2箇所。",
      },
      {
        level: 1,
        name: "馬人の武術",
        text: "［馬人の武術］：騎乗時の効果を受けられる。ライダー技能を自身に適用可能。",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：土属性ダメージ+2。",
      },
      {
        level: 6,
        name: "馬人の武術",
        text: "［馬人の武術］：自分にキャラを1体乗せ、同乗者として扱える。",
      },
      {
        level: 11,
        name: "馬人の武術",
        text: "［馬人の武術］：足場が悪いペナルティを半減可。",
      },
    ],
    aliases: ["ケンタウロス"],
  },
  {
    id: "29.0",
    name: "シザースコーピオン",
    race: "シザースコーピオン",
    variant: "",
    source: "BR",
    isBarbarous: true,
    taint: "4",
    dice: {
      dex: "1d+6",
      agi: "1d",
      str: "2d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "汎用蛮族語\nアンドロスコーピオン語\n魔動機文明語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "蠍人の身体", "蠍人の体術"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "蠍人の身体",
        text: "［蠍人の身体］：3部位として扱う。",
      },
      {
        level: 1,
        name: "蠍人の体術",
        text: "［蠍人の体術］：非コア部位でもフィジカルマスターが使える。",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：物理ダメージ+2。",
      },
      {
        level: 6,
        name: "蠍人の身体",
        text: "［蠍人の身体］：背中が2つあるものとして扱う。",
      },
      {
        level: 11,
        name: "蠍人の体術",
        text: "［蠍人の体術］：部位：蠍のHPが0になっても［蠍人の体術］の効果が失われなくなる。",
      },
    ],
    aliases: ["シザースコーピオン"],
  },
  {
    id: "30.0",
    name: "ドーン",
    race: "ドーン",
    variant: "",
    source: "BR",
    isBarbarous: true,
    taint: "2",
    dice: {
      dex: "2d+6",
      agi: "2d",
      str: "1d",
      vit: "2d",
      int: "2d",
      mnd: "1d",
    },
    languages: "汎用蛮族語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "暗殺の心得", "親しき闇"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "暗殺の心得",
        text: "［暗殺の心得］：生来武器〈爪〉を持つ。命中+1、ダメージ+2。",
      },
      {
        level: 1,
        name: "親しき闇",
        text: "［親しき闇］：変装、隠密、備考+2。",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：命中+1。",
      },
      {
        level: 6,
        name: "暗殺の心得",
        text: "［暗殺の心得］：生来武器〈爪〉がAランク〈鈎爪〉となり、ダメージ+1（計+3）。",
      },
      {
        level: 11,
        name: "暗殺の心得",
        text: "［暗殺の心得］：生来武器〈爪〉がSランク〈貫爪〉となり、ダメージ+1（計+4）。",
      },
      {
        level: 11,
        name: "親しき闇",
        text: "［親しき闇］：+2、（計+4）。",
      },
    ],
    aliases: ["ドーン"],
  },
  {
    id: "31.0",
    name: "コボルド",
    race: "コボルド",
    variant: "",
    source: "BR",
    isBarbarous: true,
    taint: "1",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "1d",
      int: "2d",
      mnd: "2d",
    },
    languages: "汎用蛮族語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["種の限界", "軽視", "小さな匠"],
    features: [
      {
        level: 1,
        name: "種の限界",
        text: "［種の限界］：Lv5までしか成長できない。",
      },
      {
        level: 1,
        name: "軽視",
        text: "［軽視］：1戦闘1回だけ他のPCに攻撃を振り分けるようGMにお願いできる。",
      },
      {
        level: 1,
        name: "小さな匠",
        text: "［小さな匠］：非戦闘時の器用度Bの判定+2。\n一般技能最大合計15レベルまで習得可能。",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：魔法ダメージ+2。",
      },
    ],
    aliases: ["コボルド"],
  },
  {
    id: "32.0",
    name: "ドレイクブロークン",
    race: "ドレイクブロークン",
    variant: "",
    source: "BS",
    isBarbarous: true,
    taint: "3",
    dice: {
      dex: "1d",
      agi: "1d",
      str: "2d",
      vit: "2d",
      int: "2d+6",
      mnd: "2d",
    },
    languages: "ドレイク語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "限定竜化"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "限定竜化",
        text: "［限定竜化］：▶で〈剣の結晶〉を使用して竜になる。飛行を得て、▶光のブレス（k20+CL+生命B）が使えるようになる。",
      },
      {
        level: 1,
        name: "弱点",
        text: "［弱点］：魔法ダメージ+2。",
      },
      {
        level: 6,
        name: "限定竜化",
        text: "［限定竜化］：⏩で行えるように、光のブレスの射程が50m、k30+CL+生命Bとなる。",
      },
      {
        level: 11,
        name: "限定竜化",
        text: "［限定竜化］：▶光のブレスが「燦光のブレス」になる。k40+CL+生命Bのダメージ、対象が1エリアとなる。",
      },
    ],
    aliases: ["ドレイクブロークン"],
  },
  {
    id: "33.0",
    name: "ラミア",
    race: "ラミア",
    variant: "",
    source: "BS",
    isBarbarous: true,
    taint: "2",
    dice: {
      dex: "1d",
      agi: "2d",
      str: "1d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "ドレイク語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "ラミアの身体", "ラミアの吸血", "変化"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "ラミアの身体",
        text: "［ラミアの身体］：生来武器〈牙〉〈尻尾〉を得る。足の装飾品が装備できない。",
      },
      {
        level: 1,
        name: "ラミアの吸血",
        text: "［ラミアの吸血］：〈牙〉が命中した際、ダメージ-6して吸血することが選べる。",
      },
      {
        level: 1,
        name: "変化",
        text: "［変化］：命中回避抵抗が-1、HP/MPの最大値-5して人型になる。尻尾が使えなくなるが足に装備できるようになる。",
      },
      {
        level: 6,
        name: "ラミアの身体",
        text: "［ラミアの身体］：〈牙〉がAランク〈鋭牙〉になる。",
      },
      {
        level: 6,
        name: "ラミアの吸血",
        text: "［ラミアの吸血］：ダメージ減少がなくなる。",
      },
      {
        level: 11,
        name: "ラミアの吸血",
        text: "［ラミアの吸血］：1日1回だけ、HPではなくMPを回復できるようになる。",
      },
    ],
    aliases: ["ラミア"],
  },
  {
    id: "34.0",
    name: "ラルヴァ",
    race: "ラルヴァ",
    variant: "",
    source: "BS",
    isBarbarous: true,
    taint: "2",
    dice: {
      dex: "1d",
      agi: "2d",
      str: "2d+6",
      vit: "1d",
      int: "2d",
      mnd: "1d",
    },
    languages: "地方語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "吸血の祝福", "忌むべき血", "弱体化"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも同じように見える。",
      },
      {
        level: 1,
        name: "吸血の祝福",
        text: "［吸血の祝福］：〈牙〉を得て、〈牙〉が命中した際、ダメージ-6して吸血することが選べる。",
      },
      {
        level: 1,
        name: "忌むべき血",
        text: "［忌むべき血］：⏩で血が塗れる。穢れ1点以上ある敵にあたった場合、自分が2点受けることで追加ダメージ+2点可能。",
      },
      {
        level: 1,
        name: "弱体化",
        text: "［弱体化］：太陽の下にいる限り、命中回避-2。",
      },
      {
        level: 6,
        name: "忌むべき血",
        text: "［忌むべき血］：ダメージをさらに1（計3）点受けることで、与物理ダメージ+1（計3）点にできる。",
      },
      {
        level: 11,
        name: "忌むべき血",
        text: "［忌むべき血］：ダメージをさらに2（計5）点受けることで、与物理ダメージ+2（計5）点にできる。",
      },
    ],
    aliases: ["ラルヴァ"],
  },
  {
    id: "35.0",
    name: "ゴブリン",
    race: "ゴブリン",
    variant: "",
    source: "魔王宮殿",
    isBarbarous: true,
    taint: "2",
    dice: {
      dex: "1d",
      agi: "1d",
      str: "1d",
      vit: "1d",
      int: "1d",
      mnd: "1d",
    },
    languages: "",
    speaks: false,
    reads: false,
    restrictedClass: "",
    featureNames: ["暗視", "お調子者", "死んだふり"],
    features: [
      {
        level: 1,
        name: "死んだふり",
        text: "［死んだふり］",
      },
      {
        level: 1,
        name: "お調子者",
        text: "［お調子者］",
      },
      {
        level: 1,
        name: "暗視",
        text: "［暗視］",
      },
    ],
    aliases: ["ゴブリン"],
  },
  {
    id: "36.0",
    name: "スケルトン",
    race: "スケルトン",
    variant: "",
    source: "魔王宮殿",
    isBarbarous: false,
    taint: "2",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "1d",
      int: "2d",
      mnd: "2d",
    },
    languages: "",
    speaks: false,
    reads: false,
    restrictedClass: "",
    featureNames: ["アンデッド", "死亡しない", "骨の身体"],
    features: [
      {
        level: 1,
        name: "骨の身体",
        text: "［骨の身体］",
      },
      {
        level: 1,
        name: "死亡しない",
        text: "［死亡しない］",
      },
      {
        level: 1,
        name: "アンデッド",
        text: "［アンデッド］",
      },
    ],
    aliases: ["スケルトン"],
  },
  {
    id: "101.0",
    name: "ヴァルキリー",
    race: "ヴァルキリー",
    variant: "",
    source: "2",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "1d",
      str: "2d",
      vit: "2d",
      int: "1d",
      mnd: "1d+6",
    },
    languages: "地方語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["戦乙女の光羽", "戦乙女の祝福"],
    features: [
      {
        level: 1,
        name: "戦乙女の光羽",
        text: "［戦乙女の光羽］",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "戦乙女の祝福",
        text: "［戦乙女の祝福］：加護を受けた対象が生死判定を行う場合、1回だけ自動成功したものとして扱える。",
      },
    ],
    aliases: ["ヴァルキリー"],
  },
  {
    id: "102.0",
    name: "フィー（土属性）",
    race: "フィー",
    variant: "土属性",
    source: "CG",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "2d+6",
      str: "1d",
      vit: "1d",
      int: "1d",
      mnd: "2d",
    },
    languages: "妖精語",
    speaks: true,
    reads: false,
    restrictedClass: "マギテック、プリースト",
    featureNames: ["妖精の加護", "浮遊"],
    features: [
      {
        level: 1,
        name: "浮遊",
        text: "［浮遊］",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "妖精の加護",
        text: "［妖精の加護］：常に2属性の効果から加護を受けられる(属性変更は⏩)、「純エネルギー」が選べるようになる。",
      },
    ],
    aliases: ["フィー（土属性）", "フィー(土属性)"],
  },
  {
    id: "103.0",
    name: "フィー（水・氷属性）",
    race: "フィー",
    variant: "水・氷属性",
    source: "CG",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "2d+6",
      str: "1d",
      vit: "1d",
      int: "1d",
      mnd: "2d",
    },
    languages: "妖精語",
    speaks: true,
    reads: false,
    restrictedClass: "マギテック、プリースト",
    featureNames: ["妖精の加護", "浮遊"],
    features: [
      {
        level: 1,
        name: "浮遊",
        text: "［浮遊］",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "妖精の加護",
        text: "［妖精の加護］：常に2属性の効果から加護を受けられる(属性変更は⏩)、「純エネルギー」が選べるようになる。",
      },
    ],
    aliases: ["フィー（水・氷属性）", "フィー(水・氷属性)"],
  },
  {
    id: "104.0",
    name: "フィー（炎属性）",
    race: "フィー",
    variant: "炎属性",
    source: "CG",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "2d+6",
      str: "1d",
      vit: "1d",
      int: "1d",
      mnd: "2d",
    },
    languages: "妖精語",
    speaks: true,
    reads: false,
    restrictedClass: "マギテック、プリースト",
    featureNames: ["妖精の加護", "浮遊"],
    features: [
      {
        level: 1,
        name: "浮遊",
        text: "［浮遊］",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "妖精の加護",
        text: "［妖精の加護］：常に2属性の効果から加護を受けられる(属性変更は⏩)、「純エネルギー」が選べるようになる。",
      },
    ],
    aliases: ["フィー（炎属性）", "フィー(炎属性)"],
  },
  {
    id: "105.0",
    name: "フィー（風属性）",
    race: "フィー",
    variant: "風属性",
    source: "CG",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "2d+6",
      str: "1d",
      vit: "1d",
      int: "1d",
      mnd: "2d",
    },
    languages: "妖精語",
    speaks: true,
    reads: false,
    restrictedClass: "マギテック、プリースト",
    featureNames: ["妖精の加護", "浮遊"],
    features: [
      {
        level: 1,
        name: "浮遊",
        text: "［浮遊］",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "妖精の加護",
        text: "［妖精の加護］：常に2属性の効果から加護を受けられる(属性変更は⏩)、「純エネルギー」が選べるようになる。",
      },
    ],
    aliases: ["フィー（風属性）", "フィー(風属性)"],
  },
  {
    id: "106.0",
    name: "ミアキス",
    race: "ミアキス",
    variant: "",
    source: "IB",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "2d",
      str: "1d",
      vit: "2d",
      int: "2d+6",
      mnd: "2d",
    },
    languages: "ミアキス語",
    speaks: true,
    reads: false,
    restrictedClass: "",
    featureNames: ["暗視", "猫変化", "獣性の発露"],
    features: [
      {
        level: 1,
        name: "獣性の発露",
        text: "［獣性の発露］",
      },
      {
        level: 1,
        name: "暗視",
        text: "［暗視］",
      },
      {
        level: 16,
        name: "剣の加護／運命凌駕",
        text: "［剣の加護／運命凌駕］：1日1回だけ、手番開始時にHPMPデバフ全回復。生死判定失敗時にも宣言可能。",
      },
      {
        level: 16,
        name: "猫変化",
        text: "［猫変化］：猫変化、解除を⏩で行えるように。猫変化時は敏捷+12。",
      },
    ],
    aliases: ["ミアキス"],
  },
  {
    id: "111.0",
    name: "ライカンスロープ",
    race: "ライカンスロープ",
    variant: "",
    source: "BT",
    isBarbarous: true,
    taint: "2",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "2d",
      vit: "2d+6",
      int: "2d",
      mnd: "2d",
    },
    languages: "ライカンスロープ語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "獣人の力", "獣化"],
    features: [
      {
        level: 1,
        name: "獣化",
        text: "［獣化］",
      },
      {
        level: 1,
        name: "獣人の力",
        text: "［獣人の力］",
      },
      {
        level: 1,
        name: "暗視",
        text: "［暗視］",
      },
    ],
    aliases: ["ライカンスロープ"],
  },
  {
    id: "113.0",
    name: "バルカン",
    race: "バルカン",
    variant: "",
    source: "IB",
    isBarbarous: true,
    taint: "4",
    dice: {
      dex: "2d",
      agi: "1d",
      str: "2d",
      vit: "2d+6",
      int: "2d",
      mnd: "1d",
    },
    languages: "バルカン語",
    speaks: true,
    reads: true,
    restrictedClass: "プリースト",
    featureNames: ["暗視", "炎無効", "バルカンの宝石"],
    features: [
      {
        level: 1,
        name: "バルカンの宝石",
        text: "［バルカンの宝石］",
      },
      {
        level: 1,
        name: "炎無効",
        text: "［炎無効］",
      },
      {
        level: 1,
        name: "暗視",
        text: "［暗視］",
      },
      {
        level: 6,
        name: "強制召喚",
        text: "［強制召喚］",
      },
    ],
    aliases: ["バルカン"],
  },
  {
    id: "117.0",
    name: "リザードマン",
    race: "リザードマン",
    variant: "",
    source: "BB",
    isBarbarous: true,
    taint: "3",
    dice: {
      dex: "1d",
      agi: "2d",
      str: "2d",
      vit: "2d",
      int: "2d",
      mnd: "1d",
    },
    languages: "リザードマン語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["尻尾が武器", "水中活動", "無呼吸活動"],
    features: [
      {
        level: 1,
        name: "無呼吸活動",
        text: "［無呼吸活動］",
      },
      {
        level: 1,
        name: "水中活動",
        text: "［水中活動］",
      },
      {
        level: 1,
        name: "尻尾が武器",
        text: "［尻尾が武器］",
      },
      {
        level: 6,
        name: "仲間との連携",
        text: "［仲間との連携］",
      },
      {
        level: 6,
        name: "敵への憤怒",
        text: "［敵への憤怒］",
      },
    ],
    aliases: ["リザードマン"],
  },
  {
    id: "119.0",
    name: "魔動天使",
    race: "魔動天使",
    variant: "",
    source: "ｶﾙｿﾞﾗﾙ",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "1d+6",
      str: "1d+6",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "魔動機文明語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: [
      "暗視",
      "造られし強さ",
      "鋼鉄の翼",
      "契約の絆",
      "新たな契約の絆",
    ],
    features: [
      {
        level: 1,
        name: "新たな契約の絆",
        text: "［新たな契約の絆］",
      },
      {
        level: 1,
        name: "契約の絆",
        text: "［契約の絆］",
      },
      {
        level: 1,
        name: "鋼鉄の翼",
        text: "［鋼鉄の翼］",
      },
      {
        level: 1,
        name: "造られし強さ",
        text: "［造られし強さ］",
      },
      {
        level: 1,
        name: "暗視",
        text: "［暗視］",
      },
    ],
    aliases: ["魔動天使"],
  },
  {
    id: "120.0",
    name: "センティアン（第1の剣系列）",
    race: "センティアン",
    variant: "第1の剣系列",
    source: "GB",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "2d",
      str: "1d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "神紀文明語",
    speaks: false,
    reads: true,
    restrictedClass: "",
    featureNames: ["刻まれし聖印", "神の恩寵", "神の御名と共に"],
    features: [
      {
        level: 1,
        name: "神の御名と共に",
        text: "［神の御名と共に］",
      },
      {
        level: 1,
        name: "神の恩寵",
        text: "［神の恩寵］",
      },
      {
        level: 1,
        name: "刻まれし聖印",
        text: "［刻まれし聖印］",
      },
    ],
    aliases: ["センティアン（第1の剣系列）", "センティアン(第1の剣系列)"],
  },
  {
    id: "121.0",
    name: "センティアン（第2の剣系列）",
    race: "センティアン",
    variant: "第2の剣系列",
    source: "GB",
    isBarbarous: true,
    taint: "3",
    dice: {
      dex: "1d",
      agi: "2d",
      str: "2d",
      vit: "1d+6",
      int: "2d",
      mnd: "2d",
    },
    languages: "神紀文明語",
    speaks: false,
    reads: true,
    restrictedClass: "",
    featureNames: ["刻まれし聖印", "暗視", "神の兵士", "神への礼賛"],
    features: [
      {
        level: 1,
        name: "神への礼賛",
        text: "［神への礼賛］",
      },
      {
        level: 1,
        name: "神の兵士",
        text: "［神の兵士］",
      },
      {
        level: 1,
        name: "暗視",
        text: "［暗視］",
      },
      {
        level: 1,
        name: "刻まれし聖印",
        text: "［刻まれし聖印］",
      },
    ],
    aliases: ["センティアン（第2の剣系列）", "センティアン(第2の剣系列)"],
  },
  {
    id: "122.0",
    name: "センティアン（第3の剣系列）",
    race: "センティアン",
    variant: "第3の剣系列",
    source: "GB",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "1d",
      agi: "2d",
      str: "1d",
      vit: "1d",
      int: "1d+6",
      mnd: "1d+6",
    },
    languages: "神紀文明語",
    speaks: false,
    reads: true,
    restrictedClass: "",
    featureNames: ["刻まれし聖印", "神の庇護", "神への祈り"],
    features: [
      {
        level: 1,
        name: "神への祈り",
        text: "［神への祈り］",
      },
      {
        level: 1,
        name: "神の庇護",
        text: "［神の庇護］",
      },
      {
        level: 1,
        name: "刻まれし聖印",
        text: "［刻まれし聖印］",
      },
    ],
    aliases: ["センティアン（第3の剣系列）", "センティアン(第3の剣系列)"],
  },
  {
    id: "123.0",
    name: "センティアン（第2の剣/人族）",
    race: "センティアン",
    variant: "第2の剣/人族生まれ",
    source: "GB",
    isBarbarous: true,
    taint: "3",
    dice: {
      dex: "1d",
      agi: "2d",
      str: "2d",
      vit: "1d+6",
      int: "2d",
      mnd: "2d",
    },
    languages: "神紀文明語",
    speaks: false,
    reads: true,
    restrictedClass: "",
    featureNames: ["刻まれし聖印", "暗視", "神の兵士", "神への礼賛"],
    features: [
      {
        level: 1,
        name: "神への礼賛",
        text: "［神への礼賛］",
      },
      {
        level: 1,
        name: "神の兵士",
        text: "［神の兵士］",
      },
      {
        level: 1,
        name: "暗視",
        text: "［暗視］",
      },
      {
        level: 1,
        name: "刻まれし聖印",
        text: "［刻まれし聖印］",
      },
    ],
    aliases: [
      "センティアン（第2の剣/人族）",
      "センティアン（第2の剣/人族生まれ）",
      "センティアン(第2の剣/人族生まれ)",
      "センティアン(第2の剣/人族)",
    ],
  },
  {
    id: "124.0",
    name: "ノーブルエルフ",
    race: "ノーブルエルフ",
    variant: "",
    source: "AoG",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "2d",
      str: "1d",
      vit: "2d",
      int: "2d",
      mnd: "2d",
    },
    languages: "エルフ語",
    speaks: true,
    reads: true,
    restrictedClass: "",
    featureNames: ["暗視", "剣の加護／水の申し子", "カリスマ", "痛みに弱い"],
    features: [
      {
        level: 1,
        name: "暗視",
        text: "［暗視］：暗闇でも昼間のように行動できる。",
      },
      {
        level: 1,
        name: "剣の加護／水の申し子",
        text: "［剣の加護／水の申し子］：水中でも1時間息継ぎなしで地上と同じように活動でき、発声可能。",
      },
      {
        level: 1,
        name: "カリスマ",
        text: "［カリスマ］：精神力を基準とした行動判定に+2。",
      },
      {
        level: 1,
        name: "痛みに弱い",
        text: "［痛みに弱い］：物理ダメージを受けるとき、そのダメージに+2する。",
      },
      {
        level: 6,
        name: "剣の加護／水の申し子",
        text: "［剣の加護／水の申し子］：地上でも1時間息継ぎなしで活動できる。毒、病気属性の抵抗に+4。",
      },
      {
        level: 11,
        name: "剣の加護／水の申し子",
        text: "［剣の加護／水の申し子］：手をつないだ者1人に同じ効果を与えられる。",
      },
      {
        level: 16,
        name: "剣の加護／水の申し子",
        text: "［剣の加護／水の申し子］：毒、病気属性の抵抗は判定を行わず、常に自動成功する。",
      },
    ],
    aliases: ["ノーブルエルフ"],
  },
  {
    id: "125.0",
    name: "マナフレア",
    race: "マナフレア",
    variant: "",
    source: "AoG",
    isBarbarous: false,
    taint: "0",
    dice: {
      dex: "2d",
      agi: "1d+6",
      str: "2d+6",
      vit: "2d",
      int: "2d",
      mnd: "1d+6",
    },
    languages: "地方語",
    speaks: true,
    reads: true,
    restrictedClass:
      "魔法技能、ソーサラー、コンジャラー、プリースト、フェアリーテイマー、マギテック、ドルイド、デーモンルーラー、グリモワール、アビスゲイザー",
    featureNames: ["溢れるマナ", "マナの手"],
    features: [
      {
        level: 1,
        name: "マナの手",
        text: "［マナの手］",
      },
      {
        level: 1,
        name: "溢れるマナ",
        text: "［溢れるマナ］",
      },
    ],
    aliases: ["マナフレア"],
  },
];

(function buildSw25RaceFeatureIndex() {
  const rows = Array.isArray(window.sw25_data?.RaceFeatures)
    ? window.sw25_data.RaceFeatures
    : [];
  const index = {};
  const norm = (value) =>
    String(value || "")
      .normalize("NFKC")
      .replace(/[\s　]+/g, "")
      .replace(/\(/g, "（")
      .replace(/\)/g, "）")
      .trim();
  for (const row of rows) {
    const keys = new Set(
      [row.name, row.race, ...(Array.isArray(row.aliases) ? row.aliases : [])]
        .map(norm)
        .filter(Boolean),
    );
    for (const key of keys) {
      if (!index[key]) index[key] = [];
      index[key].push(row);
    }
  }
  window.sw25_data.RaceFeatureIndex = index;
})();

window.sw25_data.BardArts = {
  "spellsongs": [
    {
      "level": 1,
      "name": "アーリーバード",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "対象を目覚めさせる"
    },
    {
      "level": 1,
      "name": "アンビエント",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "命中力判定-1"
    },
    {
      "level": 1,
      "name": "サモン・スモールアニマル",
      "resistance": "必中",
      "attribute": "精神効果",
      "effect": "小動物を呼び寄せる"
    },
    {
      "level": 1,
      "name": "サモン・フィッシュ",
      "resistance": "必中",
      "attribute": "精神効果",
      "effect": "魚を呼び寄せる"
    },
    {
      "level": 1,
      "name": "ノイズ",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "行為判定-1"
    },
    {
      "level": 1,
      "name": "バラード",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "回避力判定-1"
    },
    {
      "level": 1,
      "name": "モラル",
      "resistance": "必中",
      "attribute": "精神効果",
      "effect": "命中力判定+1"
    },
    {
      "level": 1,
      "name": "レクイエム",
      "resistance": "消滅",
      "attribute": "",
      "effect": "アンデッドの行為判定-2"
    },
    {
      "level": 1,
      "name": "レジスタンス",
      "resistance": "必中",
      "attribute": "精神効果",
      "effect": "生命・精神抵抗力判定+1"
    },
    {
      "level": 5,
      "name": "アトリビュート",
      "resistance": "必中",
      "attribute": "",
      "effect": "指定属性ダメージ+2"
    },
    {
      "level": 5,
      "name": "キュアリオスティ",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "聴くものを奏者の前に導く"
    },
    {
      "level": 5,
      "name": "チャーミング",
      "resistance": "消滅",
      "attribute": "精神効果(弱)",
      "effect": "奏者への不利益な行動を抑止する"
    },
    {
      "level": 5,
      "name": "トランス",
      "resistance": "必中",
      "attribute": "精神効果",
      "effect": "魔法行使判定+1"
    },
    {
      "level": 5,
      "name": "ノスタルジィ",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "対象にねぐらへ帰りたい衝動を起こさせる"
    },
    {
      "level": 5,
      "name": "ブレイク",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "生命・精神抵抗力判定-1"
    },
    {
      "level": 5,
      "name": "ラブソング",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "恋愛感情を芽生えさせる"
    },
    {
      "level": 5,
      "name": "ララバイ",
      "resistance": "消滅",
      "attribute": "精神効果(弱)",
      "effect": "対象に強い眠気を生じさせる"
    },
    {
      "level": 10,
      "name": "クラップ",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "手拍子をさせる"
    },
    {
      "level": 10,
      "name": "コーラス",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "奏者とともに歌を歌わせる"
    },
    {
      "level": 10,
      "name": "ダル",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "宣言特技を封じる"
    },
    {
      "level": 10,
      "name": "ダンス",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "踊らせ、命中力・回避力判定-2"
    },
    {
      "level": 10,
      "name": "フォール",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "飛行能力を封じる"
    },
    {
      "level": 10,
      "name": "リダクション",
      "resistance": "必中",
      "attribute": "精神効果",
      "effect": "魔法行使の消費MPを軽減する"
    },
    {
      "level": 10,
      "name": "レイジィ",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "行為判定-1"
    },
    {
      "level": 16,
      "name": "グラント",
      "resistance": "消滅",
      "attribute": "",
      "effect": "奏者にHP、MPを譲り渡す"
    },
    {
      "level": 16,
      "name": "ヒム",
      "resistance": "消滅",
      "attribute": "",
      "effect": "プリースト技能レベルを増減する"
    },
    {
      "level": 16,
      "name": "リラックス",
      "resistance": "必中",
      "attribute": "",
      "effect": "精神効果・呪い・呪い+精神効果から1つを選んで解除する"
    }
  ],
  "finales": [
    {
      "level": 1,
      "name": "春の強風",
      "targets": 1,
      "resistance": "半減",
      "attribute": "風",
      "effectKind": "魔法ダメージ",
      "sourceEffect": "1体にk10ダメージ"
    },
    {
      "level": 1,
      "name": "夏の生命",
      "targets": 1,
      "resistance": "任意",
      "attribute": "",
      "effectKind": "HP回復",
      "sourceEffect": "1体のHPをk20で回復"
    },
    {
      "level": 1,
      "name": "秋の実り",
      "targets": 1,
      "resistance": "任意",
      "attribute": "",
      "effectKind": "MP回復",
      "sourceEffect": "1体のMPをk0で回復"
    },
    {
      "level": 1,
      "name": "冬の寒風",
      "targets": 1,
      "resistance": "半減",
      "attribute": "水・氷",
      "effectKind": "魔法ダメージ",
      "sourceEffect": "1体にk10ダメージ"
    },
    {
      "level": 5,
      "name": "獣の咆吼",
      "targets": 3,
      "resistance": "半減",
      "attribute": "衝撃",
      "effectKind": "魔法ダメージ",
      "sourceEffect": "3体にk20ダメージ"
    },
    {
      "level": 5,
      "name": "草原の息吹",
      "targets": 3,
      "resistance": "任意",
      "attribute": "",
      "effectKind": "HP回復",
      "sourceEffect": "3体のHPをk30で回復"
    },
    {
      "level": 5,
      "name": "華の宴",
      "targets": 3,
      "resistance": "任意",
      "attribute": "",
      "effectKind": "MP回復",
      "sourceEffect": "3体のMPをk10で回復"
    },
    {
      "level": 5,
      "name": "蛇穴の苦鳴",
      "targets": 3,
      "resistance": "半減",
      "attribute": "呪い",
      "effectKind": "魔法ダメージ",
      "sourceEffect": "3体にk20ダメージ"
    },
    {
      "level": 10,
      "name": "火竜の舞",
      "targets": 5,
      "resistance": "半減",
      "attribute": "炎かつ風",
      "effectKind": "魔法ダメージ",
      "sourceEffect": "5体にk30ダメージ"
    },
    {
      "level": 10,
      "name": "水竜の轟",
      "targets": 5,
      "resistance": "半減",
      "attribute": "水・氷かつ雷",
      "effectKind": "魔法ダメージ",
      "sourceEffect": "5体にk30ダメージ"
    },
    {
      "level": 10,
      "name": "蒼月の光",
      "targets": 5,
      "resistance": "任意",
      "attribute": "",
      "effectKind": "MP回復",
      "sourceEffect": "5体のMPをk20で回復"
    },
    {
      "level": 10,
      "name": "白日の暖",
      "targets": 5,
      "resistance": "任意",
      "attribute": "",
      "effectKind": "HP回復",
      "sourceEffect": "5体のHPをk40で回復"
    }
  ]
};

window.sw25_data.MonsterArts = {
  "techniques": [
    {
      "level": 1,
      "name": "アンチボディ",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "MP3",
      "effect": "毒・病気に対し、生命・精神抵抗力判定+4"
    },
    {
      "level": 1,
      "name": "オウルビジョン",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "暗視を得る"
    },
    {
      "level": 1,
      "name": "ガゼルフット",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "MP3",
      "effect": "回避力判定+1"
    },
    {
      "level": 1,
      "name": "キャッツアイ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "命中力判定+1"
    },
    {
      "level": 1,
      "name": "スケイルレギンス",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "水中で自在に行動する"
    },
    {
      "level": 1,
      "name": "ストロングブラッド",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "炎、水・氷属性からの被ダメージ-5"
    },
    {
      "level": 1,
      "name": "チックチック",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "跳躍判定+5、落下ダメージ-20"
    },
    {
      "level": 1,
      "name": "ドラゴンテイル",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "尾を生やし、武器とする"
    },
    {
      "level": 1,
      "name": "ビートルスキン",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "MP3",
      "effect": "防護点+2"
    },
    {
      "level": 1,
      "name": "マッスルベアー",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "筋力ボーナス+2"
    },
    {
      "level": 1,
      "name": "メディテーション",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "MP3",
      "effect": "精神効果属性に対し精神抵抗力判定+4"
    },
    {
      "level": 1,
      "name": "ラビットイヤー",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "聞き耳判定、危険感知判定+2"
    },
    {
      "level": 5,
      "name": "ケンタウロスレッグ",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "MP3",
      "effect": "敏捷度+6"
    },
    {
      "level": 5,
      "name": "シェイプアニマル",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "家畜やペットとして馴染みの深い動物に変身する"
    },
    {
      "level": 5,
      "name": "ジャイアントアーム",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "筋力+12"
    },
    {
      "level": 5,
      "name": "スフィンクスノレッジ",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "MP3",
      "effect": "知力+6"
    },
    {
      "level": 5,
      "name": "デーモンフィンガー",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "器用度+6"
    },
    {
      "level": 5,
      "name": "ファイアブレス",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "attribute": "炎",
      "effect": "主動作で炎を吐いて攻撃できるようになる"
    },
    {
      "level": 5,
      "name": "リカバリィ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "エンハンサー技能レベル点だけHPを回復"
    },
    {
      "level": 5,
      "name": "ワイドウィング",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "飛行が可能になる"
    },
    {
      "level": 10,
      "name": "カメレオンカムフラージュ",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "MP3",
      "effect": "隠密判定+4、10m以上で視認不可"
    },
    {
      "level": 10,
      "name": "クラーケンスタビリティ",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "MP3",
      "effect": "転倒しなくなる"
    },
    {
      "level": 10,
      "name": "ジィプロフェシー",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "MP3",
      "effect": "危険感知判定、先制判定+2"
    },
    {
      "level": 10,
      "name": "ストライダーウォーク",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "水や雲の上を歩ける"
    },
    {
      "level": 10,
      "name": "スパイダーウェブ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "蜘蛛の糸を射出し、自らの動作を助ける"
    },
    {
      "level": 10,
      "name": "タイタンフット",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "主動作で壁を蹴破れるようになる"
    },
    {
      "level": 10,
      "name": "トロールバイタル",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "MP3",
      "effect": "魔法ダメージ-4"
    },
    {
      "level": 10,
      "name": "バルーンシードショット",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "口で投擲武器を発射できるようになる"
    },
    {
      "level": 10,
      "name": "フェンリルバイト",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "口に牙を生やし、攻撃できるようになる"
    },
    {
      "level": 10,
      "name": "ヘルシーボディ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP3",
      "effect": "「毒」「病気」「精神効果」を1つ解除"
    },
    {
      "level": 16,
      "name": "アナライズブレイン",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP10",
      "effect": "弱点の効果を適用し、その効果をさらに倍加する"
    },
    {
      "level": 16,
      "name": "ウェンディゴハイド",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP10",
      "effect": "広範囲の効果の対象から逃れる"
    },
    {
      "level": 16,
      "name": "ヴジャトーアイ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "MP10",
      "effect": "行為判定の結果後、達成値+2"
    }
  ],
  "spellsongs": [
    {
      "level": 1,
      "name": "アーリーバード",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "⤴+1/値13/♡+1",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "対象を目覚めさせる"
    },
    {
      "level": 1,
      "name": "アンビエント",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "⤵+1/値13/⤵+1",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "命中力判定-1"
    },
    {
      "level": 1,
      "name": "サモン・スモールアニマル",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "♡+1/値13:♡+1",
      "resistance": "必中",
      "attribute": "精神効果",
      "effect": "小動物を呼び寄せる"
    },
    {
      "level": 1,
      "name": "サモン・フィッシュ",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "♡+1/値13:♡+1",
      "resistance": "必中",
      "attribute": "精神効果",
      "effect": "魚を呼び寄せる"
    },
    {
      "level": 1,
      "name": "ノイズ",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "⤵+1/値13:⤵+1",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "行為判定-1"
    },
    {
      "level": 1,
      "name": "バラード",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "⤵+1/値13:⤵+1",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "回避力判定-1"
    },
    {
      "level": 1,
      "name": "モラル",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "⤴+1/値13:⤴+1",
      "resistance": "必中",
      "attribute": "精神効果",
      "effect": "命中力判定+1"
    },
    {
      "level": 1,
      "name": "レクイエム",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "⤵+1/値13:♡+1",
      "resistance": "消滅",
      "effect": "アンデッドの行為判定-2"
    },
    {
      "level": 1,
      "name": "レジスタンス",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "⤵+1/値13:⤴+1",
      "resistance": "必中",
      "attribute": "精神効果",
      "effect": "生命・精神抵抗力判定+1"
    },
    {
      "level": 5,
      "name": "アトリビュート",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "♡+2/値18:♡+1",
      "resistance": "必中",
      "effect": "指定属性ダメージ+2"
    },
    {
      "level": 5,
      "name": "キュアリオスティ",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "♡+2/値18:♡+1",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "聴くものを奏者の前に導く"
    },
    {
      "level": 5,
      "name": "チャーミング",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "♡+2/値18:♡+1",
      "resistance": "消滅",
      "attribute": "精神効果(弱)",
      "effect": "奏者への不利益な行動を抑止する"
    },
    {
      "level": 5,
      "name": "トランス",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "⤴+2/値18:⤴+1",
      "resistance": "必中",
      "attribute": "精神効果",
      "effect": "魔法行使判定+1"
    },
    {
      "level": 5,
      "name": "ノスタルジィ",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "⤵+2/値18:♡+1",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "対象にねぐらへ帰りたい衝動を起こさせる"
    },
    {
      "level": 5,
      "name": "ブレイク",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "⤵+2/値18:⤵+1",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "生命・精神抵抗力判定-1"
    },
    {
      "level": 5,
      "name": "ラブソング",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "♡+2/値18:⤴+1",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "恋愛感情を芽生えさせる"
    },
    {
      "level": 5,
      "name": "ララバイ",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "♡+2/値18:♡+1",
      "resistance": "消滅",
      "attribute": "精神効果(弱)",
      "effect": "対象に強い眠気を生じさせる"
    },
    {
      "level": 10,
      "name": "クラップ",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "♡+2/値24:⤴+2",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "手拍子をさせる"
    },
    {
      "level": 10,
      "name": "コーラス",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "♡+2/値24:♡+2",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "奏者とともに歌を歌わせる"
    },
    {
      "level": 10,
      "name": "ダル",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "⤵+2/値24:⤵+2",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "宣言特技を封じる"
    },
    {
      "level": 10,
      "name": "ダンス",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "♡+2/値24:⤴+2",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "踊らせ、命中力・回避力判定-2"
    },
    {
      "level": 10,
      "name": "フォール",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "⤵+2/値24:⤵+2",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "飛行能力を封じる"
    },
    {
      "level": 10,
      "name": "リダクション",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "♡+2/値24:⤵+2",
      "resistance": "必中",
      "attribute": "精神効果",
      "effect": "魔法行使の消費MPを軽減する"
    },
    {
      "level": 10,
      "name": "レイジィ",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "♡+2/値24:⤵+2",
      "resistance": "消滅",
      "attribute": "精神効果",
      "effect": "行為判定-1"
    },
    {
      "level": 16,
      "name": "グラント",
      "action": "▶",
      "markers": [
        "主"
      ],
      "resistance": "消滅",
      "effect": "奏者にHP、MPを譲り渡す"
    },
    {
      "level": 16,
      "name": "ヒム",
      "action": "▶",
      "markers": [
        "主"
      ],
      "resistance": "消滅",
      "effect": "プリースト技能レベルを増減する"
    },
    {
      "level": 16,
      "name": "リラックス",
      "action": "▶",
      "markers": [
        "主"
      ],
      "resistance": "必中",
      "effect": "精神効果・呪い・呪い+精神効果から1つを選んで解除する"
    }
  ],
  "alchemy": [
    {
      "level": 1,
      "name": "インスタントウェポン",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "白",
      "target": "1体",
      "range": "1(10m)/射撃",
      "resistance": "任意",
      "effect": "簡易の武器を現出させる"
    },
    {
      "level": 1,
      "name": "ヴォーパルウェポン",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "赤",
      "target": "1体",
      "range": "1(10m)/起点指定",
      "resistance": "任意",
      "effect": "対象が与える物理ダメージを上昇させる"
    },
    {
      "level": 1,
      "name": "クラッシュファング",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "赤",
      "target": "1体",
      "range": "2(30m)/起点指定",
      "resistance": "短縮",
      "effect": "対象が与える物理ダメージを減少させる"
    },
    {
      "level": 1,
      "name": "クリティカルレイ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "金",
      "target": "1体",
      "range": "接触/―",
      "resistance": "任意",
      "effect": "物理ダメージのk決定の出目を上昇させる"
    },
    {
      "level": 1,
      "name": "バークメイル",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "緑",
      "target": "1体",
      "range": "2(30m)/起点指定",
      "resistance": "任意",
      "effect": "対象の防護点を上昇させる"
    },
    {
      "level": 1,
      "name": "パラライズミスト",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "緑",
      "target": "1体",
      "range": "1(10m)/射撃",
      "resistance": "短縮",
      "effect": "対象の回避力判定にペナルティ修正を与える"
    },
    {
      "level": 1,
      "name": "ポイズンニードル",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "黒",
      "target": "1体",
      "range": "2(30m)/射撃",
      "resistance": "短縮",
      "effect": "錬金術師の手番終了時にダメージを与える"
    },
    {
      "level": 1,
      "name": "ミラージュデイズ",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "白",
      "target": "1体",
      "range": "2(30m)/起点指定",
      "resistance": "短縮",
      "effect": "対象の命中力判定にペナルティ修正を与える"
    },
    {
      "level": 1,
      "name": "ヒールスプレー",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "緑×2",
      "target": "1体",
      "range": "2(30m)/射撃",
      "resistance": "任意",
      "effect": "対象のHPを回復"
    },
    {
      "level": 5,
      "name": "アーマーラスト",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "黒×2",
      "target": "1体",
      "range": "1(10m)/射撃",
      "resistance": "短縮",
      "effect": "対象の防護点を減少させる"
    },
    {
      "level": 5,
      "name": "アンロックニードル",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "黒×2",
      "target": "物体1つ",
      "range": "接触/―",
      "resistance": "必中",
      "effect": "鍵や罠を解除する"
    },
    {
      "level": 5,
      "name": "イニシアティブブースト",
      "action": "△",
      "markers": [
        "準"
      ],
      "cost": "赤×2",
      "target": "1体",
      "range": "接触/―",
      "resistance": "任意",
      "effect": "対象の先制判定にボーナス修正を与える"
    },
    {
      "level": 5,
      "name": "エンサイクロペディア",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "白×2",
      "target": "1体",
      "range": "接触/―",
      "resistance": "任意",
      "effect": "対象の魔物知識判定にボーナス修正を与える"
    },
    {
      "level": 5,
      "name": "ディスペルニードル",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "黒",
      "target": "1体",
      "range": "1(10m)/射撃",
      "resistance": "消滅",
      "effect": "対象が受けている効果を解除する"
    },
    {
      "level": 5,
      "name": "バインドアビリティ",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "白×2",
      "target": "1体",
      "range": "1(10m)/起点指定",
      "resistance": "短縮",
      "effect": "特殊能力の達成値にペナルティ修正を与える"
    },
    {
      "level": 5,
      "name": "ビビッドリキッド",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "緑×2",
      "target": "1体",
      "range": "接触/―",
      "resistance": "任意",
      "effect": "対象のMPを回復"
    },
    {
      "level": 5,
      "name": "マナスプラウト",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "金",
      "target": "1体",
      "range": "1(10m)/射撃",
      "resistance": "必中",
      "effect": "対象にMPを与える"
    },
    {
      "level": 5,
      "name": "マナダウン",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "金",
      "target": "1体",
      "range": "2(30m)/起点指定",
      "resistance": "短縮",
      "effect": "対象が発生させる魔法ダメージを減少させる"
    },
    {
      "level": 5,
      "name": "リーンフォース",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "赤×2",
      "target": "1体",
      "range": "接触/―",
      "resistance": "任意",
      "effect": "対象が与える魔法ダメージを上昇"
    },
    {
      "level": 10,
      "name": "クレイフィールド",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "黒×3",
      "target": "全エリア(半径30m)/空間",
      "range": "接触/―",
      "resistance": "必中",
      "effect": "範囲内は土属性無効、風属性で受けるダメージ+5"
    },
    {
      "level": 10,
      "name": "コンバインマテリアル",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "白×1＆黒×1",
      "target": "自身",
      "range": "自身/―",
      "resistance": "任意",
      "effect": "低ランクカードを束ね、高ランクカード1枚として使用する"
    },
    {
      "level": 10,
      "name": "スラッシュフィールド",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "白×3",
      "target": "全エリア(半径30m)/空間",
      "range": "接触/―",
      "resistance": "必中",
      "effect": "範囲内は断空属性無効、衝撃属性で受けるダメージ+5"
    },
    {
      "level": 10,
      "name": "デラックスマテリアル",
      "action": "⏩△",
      "markers": [
        "準",
        "補"
      ],
      "cost": "赤×1＆緑×1",
      "target": "1体",
      "range": "自身/―",
      "resistance": "任意",
      "effect": "高ランクのカードを低ランクとして使い達成値にボーナス"
    },
    {
      "level": 10,
      "name": "バリアフィールド",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "金×3",
      "target": "全エリア(半径30m)/空間",
      "range": "接触/―",
      "resistance": "必中",
      "effect": "脱出できない半径30mの空間を作り出す"
    },
    {
      "level": 10,
      "name": "フレイムフィールド",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "赤×3",
      "target": "全エリア(半径30m)/空間",
      "range": "接触/―",
      "resistance": "必中",
      "effect": "範囲内は炎属性無効、水・氷属性で受けるダメージ+5"
    },
    {
      "level": 10,
      "name": "レストフィールド",
      "action": "▶",
      "markers": [
        "主"
      ],
      "cost": "緑×3",
      "target": "全エリア(半径30m)/空間",
      "range": "接触/―",
      "resistance": "必中",
      "effect": "回復効果のMP消費を増やし、回復量を上昇させる"
    },
    {
      "level": 16,
      "name": "プリズムカーテン",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "金×3",
      "target": "1体",
      "range": "30m/射撃",
      "resistance": "なし",
      "effect": "効果の属性に任意のものを追加する"
    },
    {
      "level": 16,
      "name": "ライフステイシス",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "緑×3",
      "target": "1体",
      "range": "30m/射撃",
      "resistance": "必中",
      "effect": "対象のHP回復を制限する"
    },
    {
      "level": 16,
      "name": "マテリアルブレイク",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "黒",
      "target": "1体",
      "range": "30m/射撃",
      "resistance": "なし",
      "effect": "武器を一時使用不能にし、追加ダメージを上昇させる"
    }
  ],
  "geomancy": [
    {
      "level": 1,
      "name": "天相：降雷",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "天1～4",
      "attribute": "雷",
      "effect": "「消費した天の命脈点×2」点の確定ダメージ"
    },
    {
      "level": 1,
      "name": "天相：空を欺く",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "天2",
      "attribute": "雷",
      "effect": "太陽の光の影響を受けない。雷属性無効"
    },
    {
      "level": 1,
      "name": "天相：見えない傘",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "天1～3",
      "effect": "飛行による移動を防ぎ、空から降るものが当たらなくなる"
    },
    {
      "level": 1,
      "name": "地相：地脈の吸収",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "地1～4",
      "effect": "「消費した地の命脈点×2」点のHP回復"
    },
    {
      "level": 1,
      "name": "地相：地を泳ぐ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "地1～2",
      "effect": "対象は水中にいるものとして扱われる"
    },
    {
      "level": 1,
      "name": "地相：泥濘に沈む",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "地1～3",
      "effect": "足が重くなり、移動や回避に制限を受ける"
    },
    {
      "level": 1,
      "name": "人相：活",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "人1～4",
      "effect": "「消費した人の命脈点」点のMP回復"
    },
    {
      "level": 1,
      "name": "人相：恐慌",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "人1～4",
      "attribute": "精神効果(弱)",
      "effect": "天地使いへの与ダメージが「消費した人の命脈点×2」点減少"
    },
    {
      "level": 1,
      "name": "人相：反撃の意思",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "人1～4",
      "effect": "対象が継続的に受けている不利な効果をひとつ解除する"
    },
    {
      "level": 5,
      "name": "天相：因果",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "天1～4",
      "attribute": "呪い",
      "effect": "ダメージを与えるたびに呪いの確定ダメージを与える"
    },
    {
      "level": 5,
      "name": "天相：天魔の一撃",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "天1～4",
      "effect": "魔法や類似ダメージを増加させる"
    },
    {
      "level": 5,
      "name": "天相：導きの矢",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "天1～4",
      "effect": "遠隔攻撃の命中力にボーナスを与える"
    },
    {
      "level": 5,
      "name": "地相：宿命の戦士",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "地2",
      "effect": "HP0以下の対象のHPを10点まで回復し覚醒させる"
    },
    {
      "level": 5,
      "name": "地相：属性の乖離",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "地3",
      "attribute": "呪い",
      "effect": "属性ダメージを与えられず受けない"
    },
    {
      "level": 5,
      "name": "地相：巻き上がる砂塵の鎧",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "地1～4",
      "effect": "防護点を「消費した地の命脈点×2」点上昇"
    },
    {
      "level": 5,
      "name": "人相：魂の別離",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "人1～4",
      "attribute": "呪い",
      "effect": "「消費した人の命脈点×2」点、HPとMPの回復量が減少"
    },
    {
      "level": 5,
      "name": "人相：漏れ出るマナ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "人1～4",
      "attribute": "呪い",
      "effect": "魔法行使時に魔力が「消費した人の命脈点」点減少"
    },
    {
      "level": 5,
      "name": "人相：夢喰い",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "人1～4",
      "attribute": "呪い",
      "effect": "「消費した人の命脈点×2」点の確定ダメージ"
    },
    {
      "level": 10,
      "name": "天相：七星流れ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "天1～4",
      "effect": "出目7を振るたび、HPとMPが「消費した天の命脈点」点回復"
    },
    {
      "level": 10,
      "name": "天相：マナの離別",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "天1～4",
      "effect": "対象のMPを「消費した天の命脈点×2」点減少"
    },
    {
      "level": 10,
      "name": "天相：烙印",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "天1～4",
      "effect": "対象に任意属性の弱点を付与する"
    },
    {
      "level": 10,
      "name": "地相：蜃気楼",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "地1～4",
      "effect": "指定属性の物理・魔法ダメージを減少"
    },
    {
      "level": 10,
      "name": "地相：足掻き",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "地1～3",
      "effect": "対象の移動と行動を制限する"
    },
    {
      "level": 10,
      "name": "地相：大いなる蛇の目",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "地1～4",
      "attribute": "呪い",
      "effect": "ゾロ目が出るたび確定ダメージを与える"
    },
    {
      "level": 10,
      "name": "人相：残像",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "人4",
      "effect": "【ブリンク】の効果を得る"
    },
    {
      "level": 10,
      "name": "人相：存在の消失",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "人1～4",
      "effect": "広範囲効果の対象から自動的に除外される"
    },
    {
      "level": 10,
      "name": "人相：人写し",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "人1～4",
      "attribute": "呪い",
      "effect": "天地使いが受けたダメージを引き受けさせる"
    }
  ],
  "warCries": [
    {
      "level": 1,
      "name": "瑕疵への追撃",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "鼓舞系",
      "effect": "弱点の追加ダメージ+1"
    },
    {
      "level": 1,
      "name": "神展の構え",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "鼓舞系",
      "effect": "移動力+5、制限移動+2"
    },
    {
      "level": 1,
      "name": "怒涛の攻陣Ⅰ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "攻撃系",
      "effect": "物理ダメージ+1"
    },
    {
      "level": 1,
      "name": "怒涛の攻陣Ⅱ：烈火",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "攻撃系",
      "effect": "物理ダメージ+2"
    },
    {
      "level": 1,
      "name": "怒涛の攻陣Ⅱ：旋風",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "攻撃系",
      "effect": "命中力+1"
    },
    {
      "level": 1,
      "name": "流麗なる俊陣Ⅰ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "回避系",
      "effect": "回避力+1。判定後に消失"
    },
    {
      "level": 1,
      "name": "流麗なる俊陣Ⅱ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "回避系",
      "effect": "回避力+1"
    },
    {
      "level": 1,
      "name": "鉄壁の防陣Ⅰ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "防御系",
      "effect": "防護点+1"
    },
    {
      "level": 1,
      "name": "鉄壁の防陣Ⅱ：鉄鎧",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "防御系",
      "effect": "防護点+2"
    },
    {
      "level": 1,
      "name": "鉄壁の防陣Ⅱ：堅体",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "防御系",
      "effect": "物理・魔法ダメージを1点軽減"
    },
    {
      "level": 1,
      "name": "強靭なる丈陣Ⅰ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "抵抗系",
      "effect": "生命または精神抵抗力+1。判定後に消失"
    },
    {
      "level": 1,
      "name": "強靭なる丈陣Ⅱ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "抵抗系",
      "effect": "生命または精神抵抗力+1"
    },
    {
      "level": 5,
      "name": "勇壮なる軍歌",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "鼓舞系",
      "effect": "呪歌の対象を限定する"
    },
    {
      "level": 5,
      "name": "蘇る秘奥",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "鼓舞系",
      "effect": "魔物知識判定を再度行う"
    },
    {
      "level": 5,
      "name": "怒涛の攻陣Ⅲ：轟炎",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "攻撃系",
      "effect": "物理ダメージ+3"
    },
    {
      "level": 5,
      "name": "怒涛の攻陣Ⅲ：旋刃",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "攻撃系",
      "effect": "命中力+1と物理ダメージ+1"
    },
    {
      "level": 5,
      "name": "怒涛の攻陣Ⅳ：爆焔",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+2",
      "target": "味方",
      "resistance": "任意",
      "attribute": "攻撃系",
      "effect": "物理ダメージ+3"
    },
    {
      "level": 5,
      "name": "怒涛の攻陣Ⅳ：輝斬",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+2",
      "target": "味方",
      "resistance": "任意",
      "attribute": "攻撃系",
      "effect": "命中力+1と物理ダメージ+1"
    },
    {
      "level": 5,
      "name": "流麗なる俊陣Ⅲ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "回避系",
      "effect": "回避力+2"
    },
    {
      "level": 5,
      "name": "流麗なる俊陣Ⅳ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+2",
      "target": "味方",
      "resistance": "任意",
      "attribute": "回避系",
      "effect": "回避力+2"
    },
    {
      "level": 5,
      "name": "鉄壁の防陣Ⅲ：鋼鎧",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "防御系",
      "effect": "防護点+3"
    },
    {
      "level": 5,
      "name": "鉄壁の防陣Ⅲ：甲盾",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "防御系",
      "effect": "物理・魔法ダメージを1点軽減"
    },
    {
      "level": 5,
      "name": "鉄壁の防陣Ⅳ：城鎧",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+2",
      "target": "味方",
      "resistance": "任意",
      "attribute": "防御系",
      "effect": "防護点+3"
    },
    {
      "level": 5,
      "name": "鉄壁の防陣Ⅳ：鏡盾",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+2",
      "target": "味方",
      "resistance": "任意",
      "attribute": "防御系",
      "effect": "物理・魔法ダメージを1点軽減"
    },
    {
      "level": 5,
      "name": "強靭なる丈陣Ⅲ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "抵抗系",
      "effect": "生命または精神抵抗力+2"
    },
    {
      "level": 5,
      "name": "強靭なる丈陣Ⅳ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気+2",
      "target": "味方",
      "resistance": "任意",
      "attribute": "抵抗系",
      "effect": "生命または精神抵抗力+2"
    },
    {
      "level": 10,
      "name": "大いなる挑発",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "鼓舞系",
      "effect": "回避力+1、生命・精神抵抗力+1。軍師の回避力-3、生命・精神抵抗力-3"
    },
    {
      "level": 10,
      "name": "傷痍の見立て",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-1",
      "target": "味方",
      "resistance": "任意",
      "attribute": "鼓舞系",
      "effect": "HP回復量+5"
    },
    {
      "level": 10,
      "name": "怒涛の攻陣Ⅴ：獄火",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-5",
      "target": "味方",
      "resistance": "任意",
      "attribute": "攻撃系",
      "effect": "物理ダメージ+6"
    },
    {
      "level": 10,
      "name": "怒涛の攻陣Ⅴ：颱風",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-5",
      "target": "味方",
      "resistance": "任意",
      "attribute": "攻撃系",
      "effect": "命中力+2と物理ダメージ+2"
    },
    {
      "level": 10,
      "name": "流麗なる俊陣Ⅴ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-5",
      "target": "味方",
      "resistance": "任意",
      "attribute": "回避系",
      "effect": "回避力+4"
    },
    {
      "level": 10,
      "name": "鉄壁の防陣Ⅴ：鋼城",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-5",
      "target": "味方",
      "resistance": "任意",
      "attribute": "防御系",
      "effect": "防護点+7"
    },
    {
      "level": 10,
      "name": "鉄壁の防陣Ⅴ：巨壁",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-5",
      "target": "味方",
      "resistance": "任意",
      "attribute": "防御系",
      "effect": "物理・魔法ダメージを3点軽減"
    },
    {
      "level": 10,
      "name": "強靭なる丈陣Ⅴ：激生",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-5",
      "target": "味方",
      "resistance": "任意",
      "attribute": "抵抗系",
      "effect": "【アウェイクン】と同効果、または生命・精神抵抗力+2"
    },
    {
      "level": 10,
      "name": "強靭なる丈陣Ⅴ：魔泉",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-5",
      "target": "味方",
      "resistance": "任意",
      "attribute": "抵抗系",
      "effect": "あらゆる消費MPを5点軽減"
    },
    {
      "level": 16,
      "name": "怒涛の攻陣Ⅴ：鬼神",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "target": "味方",
      "resistance": "任意",
      "attribute": "攻撃系",
      "effect": "物理ダメージ+4。さらに瞬間的に物理ダメージ+6"
    },
    {
      "level": 16,
      "name": "怒涛の攻陣Ⅴ：宿業",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "target": "味方",
      "resistance": "任意",
      "attribute": "攻撃系",
      "effect": "命中力+2。さらに瞬間的に命中力+3"
    },
    {
      "level": 16,
      "name": "流麗なる瞬陣Ⅴ：泡沫",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "target": "味方",
      "resistance": "任意",
      "attribute": "回避系",
      "effect": "回避力+2。さらに瞬間的に回避力+3"
    },
    {
      "level": 16,
      "name": "鉄壁の防陣Ⅴ：要塞",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "target": "味方",
      "resistance": "任意",
      "attribute": "防御系",
      "effect": "防護点+5。さらに瞬間的に防護点+5"
    },
    {
      "level": 16,
      "name": "強靭なる丈陣Ⅴ：不滅",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "target": "味方",
      "resistance": "任意",
      "attribute": "抵抗系",
      "effect": "生命・精神抵抗力+2。さらに瞬間的に+3"
    }
  ],
  "formations": [
    {
      "level": 1,
      "name": "陣率：軍師の知略",
      "action": "△",
      "markers": [
        "準"
      ],
      "cost": "なし",
      "target": "自身",
      "range": "自身/-",
      "resistance": "任意",
      "effect": "先制判定をウォーリーダー技能+知力で行える"
    },
    {
      "level": 1,
      "name": "陣率：慮外なる烈撃Ⅰ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-3",
      "target": "自身",
      "range": "自身/-",
      "resistance": "任意",
      "effect": "1回だけ命中力+2と物理ダメージ+2"
    },
    {
      "level": 1,
      "name": "陣率：挙措の予見Ⅰ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-3",
      "target": "自身",
      "range": "自身/-",
      "resistance": "任意",
      "effect": "回避力+3"
    },
    {
      "level": 1,
      "name": "陣率：衝戟の刪削Ⅰ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-3",
      "target": "自身",
      "range": "自身/-",
      "resistance": "任意",
      "effect": "物理・魔法ダメージを4点軽減"
    },
    {
      "level": 1,
      "name": "陣率：抗拒の推断Ⅰ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-3",
      "target": "自身",
      "range": "自身/-",
      "resistance": "任意",
      "effect": "生命・精神抵抗力判定+3"
    },
    {
      "level": 1,
      "name": "陣率：行使専心Ⅰ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-3",
      "target": "自身",
      "range": "自身/-",
      "resistance": "任意",
      "effect": "1回だけ魔法行使判定の達成値+1"
    },
    {
      "level": 1,
      "name": "陣率：効力亢進Ⅰ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-3",
      "target": "自身",
      "range": "自身/-",
      "resistance": "任意",
      "effect": "1回だけ魔法ダメージ+4または回復量+4"
    },
    {
      "level": 5,
      "name": "陣率：掃討の勝鬨",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "なし",
      "target": "自身",
      "range": "自身/-",
      "resistance": "任意",
      "effect": "条件達成時に陣気+1"
    },
    {
      "level": 5,
      "name": "陣率：堅固なる布陣",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "なし",
      "target": "自身",
      "range": "自身/-",
      "resistance": "任意",
      "effect": "条件達成時に陣気+1"
    },
    {
      "level": 5,
      "name": "陣率：慮外なる烈撃Ⅱ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-5",
      "target": "自身",
      "range": "自身/-",
      "resistance": "任意",
      "effect": "1回だけ命中力+4と物理ダメージ+4"
    },
    {
      "level": 5,
      "name": "陣率：挙措の予見Ⅱ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-5",
      "target": "自身",
      "range": "自身/-",
      "resistance": "任意",
      "effect": "回避力+5"
    },
    {
      "level": 5,
      "name": "陣率：衝戟の刪削Ⅱ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-5",
      "target": "自身",
      "range": "自身/-",
      "resistance": "任意",
      "effect": "物理・魔法ダメージを7点軽減"
    },
    {
      "level": 5,
      "name": "陣率：抗拒の推断Ⅱ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-5",
      "target": "自身",
      "range": "自身/-",
      "resistance": "任意",
      "effect": "生命・精神抵抗力判定+5"
    },
    {
      "level": 5,
      "name": "陣率：行使専心Ⅱ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-5",
      "target": "自身",
      "range": "自身/-",
      "resistance": "任意",
      "effect": "1回だけ魔法行使判定の達成値+2"
    },
    {
      "level": 5,
      "name": "陣率：効力亢進Ⅱ",
      "action": "⏩",
      "markers": [
        "補"
      ],
      "cost": "陣気-5",
      "target": "自身",
      "range": "自身/-",
      "resistance": "任意",
      "effect": "1回だけ魔法ダメージ+7または回復量+7"
    }
  ]
};

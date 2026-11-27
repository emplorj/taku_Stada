(() => {
  "use strict";

  // Sample v1.1, pp. 16–17. Each stamina group lists the six spirit values.
  const backgrounds = [
    ["ニート|ゲーム・暇つぶし|タブレット（端末）,木刀,クリーチャーエナジー,カロリーフレンド",
     "占い師|占い・解説|厚手の服,包丁,懐中電灯,オイルライター,タロットカード,藁人形",
     "プログラマー|プログラム・徹夜|金属バット,防刃ベスト（通販）,タブレット（端末）,特殊警棒",
     "ハッカー|プログラム・機械いじり|防刃ベスト（通販）,大バール,モバイルバッテリー",
     "小説家|集中力・文章力|分厚い辞書,懐中電灯,包丁,缶チューハイ×2",
     "漫画家|集中力・画力|週刊漫画雑誌×2,G＆Gルールブック,クリーチャーエナジー×2"],
    ["パチンカー or スロッター|早起き・忍耐|野球プロテクター,金属バット,携帯型ラジオ",
     "カードゲーマー|記憶力・器用|分厚い辞書,傘,タブレット（端末）,ブレスケアキャンディ",
     "オカルト研究者|好奇心・無謀|厚手の服,ビデオカメラ,懐中電灯,ロープの束（5m）",
     "会社員（事務職）|忍耐・諦め|防刃ベスト（通販）,傘,頭痛薬,モバイルバッテリー",
     "失業者|根性・不満|週刊漫画雑誌,金属パイプ,携帯型ラジオ,ロープの束（5m）",
     "ウェブライター|好奇心・売り込み|厚手の服,スタンガン"],
    ["フリーター|学習力・愛想|野球プロテクター,大バール,スポーツシューズ",
     "売れないミュージシャン|楽器演奏・表現力|厚手の服,金属バット,携帯型ラジオ,缶チューハイ×3",
     "バーテンダー|聞き上手・利き酒|防刃ベスト（通販）,包丁,缶チューハイ×3",
     "深夜のコンビニ店員|忍耐・サボり|厚手の服,特殊警棒,モバイルバッテリー",
     "会社員（営業職）|社会マナー・根性|厚手の服,木製バット,スポーツシューズ",
     "転売屋|目利き・恥知らず|スタンガン,タブレット（端末）"],
    ["浪人生|集中力・一般教養|厚手の服,マグライト,カロリーフレンド×2",
     "ハウスキーパー|調理・掃除|厚手の服,包丁,懐中電灯,裁縫セット,ペットボトル（2L）",
     "役者の卵|演技力・度胸|剣道の防具,木刀,スポーツシューズ,『7つの中間』",
     "探偵|観察眼・備考|マグライト,オイルライター,包帯",
     "新聞記者|聞き込み・速記|ビデオカメラ,金属パイプ",
     "ホスト or ホステス|人たらし・酒好き|特殊警棒,缶チューハイ×3"],
    ["用心棒|威圧・礼儀|防刃ベスト（警察）,特殊警棒",
     "ジムのトレーナー|教え上手・ポジティブ|野球プロテクター,金属バット,スポーツシューズ,包帯",
     "アスリート|持久力・闘争心|ホッケープロテクター,木製バット",
     "見習いダンサー|柔軟性・リズム感|木材,スポーツシューズ,ペットボトル（500ml）,包帯",
     "土木作業員|腕力・計画性|大バール,ロープの束（5m）",
     "動画投稿者|動画撮影・目立ちたがり|ビデオカメラ,マグライト"],
    ["深夜清掃員|掃除・目立たない|大バール,携帯型ラジオ,缶チューハイ",
     "宅配業者|計画性・記憶力|野球プロテクター,金属バット,スポーツシューズ",
     "引っ越し業者|運搬・パッキング|スレッジハンマー,懐中電灯",
     "消防士|火の扱い・人命救助|斧,懐中電灯",
     "警察官|質問・疑り深い|特殊警棒",
     "自衛官|自制心・不動の姿勢|ロープの束（5m）,包帯,傘"],
  ];

  const itemCatalog = window.ShinjukuItems;

  // Sample v1.1, pp. 18–19, in d66 order (11–16, 21–26, ...).
  const motives = [
    "あなたは莫大な借金を背負っている。〈新宿地下〉なら一攫千金も夢ではない。",
    "〈新宿地下〉で消息を絶った家族を探している。少しでも手がかりを得られるだろうか？",
    "退屈な日常はもうたくさんだ。この命、地下のスリルに賭けてみるのも悪くない。",
    "なぜ新宿駅は迷宮になったのか？ その真実が気になって仕方がない。だから、自分で見つけ出すのだ。",
    "あなたは〈組織〉に命じられた。あるいは強迫されている。拒否は死を意味する。任務を遂行するしかない。",
    "他の誰にも聞こえない「声」が、あなたを地下へと誘う。その声の主は、一体誰なのだろう？",
    "家族が重い病に倒れた。法外な治療費を稼げる場所は、もうここしかない。",
    "あの日、失くしてしまった〈大切な物〉。それさえ取り戻せれば、人生をやり直せるはずだ。",
    "東京の裏社会で名を上げたい。富や名声、そのすべてを手に入れるために。",
    "〈新宿地下〉には、世界の真実に至る手がかりが眠っている。少なくとも、あなたはそう信じている。",
    "地上にあなたの居場所はない、と感じる。〈新宿地下〉を探検している間だけ、充実感を得られる。",
    "地下の空気を吸うと、心が安らぐ。もはや中毒かもしれない。地上は息苦しい。",
    "どうしても叶えたい夢がある。そのための資金を、あなたはこの地下で見つけると決めた。",
    "〈おとし物〉に興味がある。あの不思議な道具の秘密を知るためなら、どんな危険をも冒す価値がある。",
    "安全な場所で生きていても、成長はない。〈新宿地下〉なら、自分の可能性を試すことができる。",
    "あなたは、実は日本政府のエージェントだ。〈新宿地下〉を探索し、情報と〈おとし物〉を持ち帰る任務を与えられている。",
    "死んだ友人の遺言だ。「もし俺が死んだら、アレを〈新宿〉から取り戻してくれ」と。",
    "眠ると必ず〈新宿地下〉を彷徨う夢を見る。この夢から逃れる術を探し、実際に足を運んでいる。",
    "欲しいもの全てを手に入れる。そのためには金がいる。綺麗な仕事で稼ぐなんて、性に合わない。",
    "あなたを裏切った恋人が、大事な物を奪って地下へ逃げた。追いかけない理由がない。生きているか死んでいるかは知らないが……",
    "狂気に満ちたこの迷宮は、最高の芸術だ。この美しさを、何らかの形で記録しなければ。",
    "正体も全容もわからない〈新宿地下〉は、何度行ってもワクワクする。他人から異常な執着だと思われようが、気にするもんか！",
    "〈新宿地下〉で撮影された写真を見て、心を奪われた。その光景を見るためなら、どんな危険も厭わない。",
    "時々、自分でも自分じゃないような衝動に駆られる。〈新宿地下〉なら、本当の自分を見つけられるかもしれない。",
    "過去に罪を犯した。〈新宿地下〉に潜るのは、その償いだ。他人を助け続ければ、少しは自分を許す気になれるだろうか。",
    "あなたには、応援している人がいる。その人が一番になるためには、多額のお金が必要なのだ。だから稼がなければいけない。",
    "死の匂いがする場所でしか、生きていると実感できない。ここは、自分のための場所だ。",
    "記憶の一部が欠けている。その手がかりが、この〈新宿地下〉にあると直感が告げている。",
    "あの日、自分のせいで友人は地下に消えた。彼を連れ戻すまで、自分に逃げる選択肢はない。",
    "自分は他の人間とは違う。〈選ばれた存在〉なのだ。この迷宮こそ、自分に相応しい舞台だ。",
    "あなたは〈新宿地下〉を〈聖域〉として崇める集団に属している。地下に入るのは、修行の一環だ。",
    "特に大きな理由はない。廃墟に探検に行ったり、心霊スポットに遊びに行くような、そんなノリだ。",
    "〈新宿地下〉なら、何をしてもいい。普段は我慢していることを、なんでも試していい。だから気に入っている。",
    "〈なれ果て〉に興味がある。その生態（？）を調べるため、〈新宿地下〉へ潜っている。",
    "ルールだらけの社会にうんざりしている。〈新宿地下〉は自由で気楽だ。よっぽどシンプルで生きやすい。",
    "〈新宿地下〉に潜るのは、あくまでも仕事だ。生活費を稼ぐ以外の目的はない。あなた自身はそう思っている。",
  ];

  function rollD6() {
    return Math.floor(Math.random() * 6) + 1;
  }

  function readBackground(stamina, spirit) {
    const [name, tags, equipment] = backgrounds[stamina - 1][spirit - 1].split("|");
    return { name, tags: tags.split("・").join(", "), equipment: equipment.split(",") };
  }

  function addInitialItem(name, table, addButton) {
    const { price, w: width, h: height, count } = itemCatalog.get(name);
    let row = Array.from(table.rows).find(candidate => {
      const field = key => candidate.querySelector(`[name="item_${key}"]`);
      return ["name", "price", "count", "note"].every(key => !field(key).value)
        && !field("free").checked && field("w").value === "1" && field("h").value === "1"
        && !document.getElementById(`${candidate.dataset.id}-puzzle`);
    });
    if (!row) {
      addButton.click();
      row = table.rows[table.rows.length - 1];
    }
    const note = itemCatalog.describe(name);
    for (const [key, value] of Object.entries({ name, price, w: width, h: height, count, note })) {
      row.querySelector(`[name="item_${key}"]`).value = value;
    }
    row.querySelector('[name="item_free"]').checked = true;
    window.queueTextareaAutoResize?.(row.querySelector('[name="item_note"]'));
  }

  const panel = document.getElementById("shinjuku-creation");
  if (!panel || new URLSearchParams(location.search).get("mode") === "json") return;
  const form = document.getElementById("shinjuku-sheet");
  const sheetStamina = document.querySelector('[name="stamina"]');
  const sheetSpirit = document.querySelector('[name="spirit"]');
  const stamina = panel.querySelector("#creation-stamina");
  const spirit = panel.querySelector("#creation-spirit");
  const extra = panel.querySelector("#creation-extra");
  const extraStamina = panel.querySelector("#creation-extra-stamina");
  const extraSpirit = panel.querySelector("#creation-extra-spirit");
  const preview = panel.querySelector("#creation-preview");
  const apply = document.getElementById("creation-apply");
  const d6 = input => Number.isInteger(input.valueAsNumber) && input.valueAsNumber >= 1 && input.valueAsNumber <= 6;
  let draft;
  let draftTouched = false;
  let savedSheetState = null;
  let allowNavigation = false;

  // Compare only when leaving the page; bag moves and programmatic edits are
  // included without serializing the whole sheet on every keystroke.
  function captureSheetState() {
    return JSON.stringify(Array.from(document.querySelectorAll(
      '#shinjuku-sheet input, #shinjuku-sheet textarea, #shinjuku-sheet select, .header-status input'
    )).map(input => [input.name || input.id, input.type,
      input.type === "checkbox" || input.type === "radio" ? input.checked : input.value]));
  }
  window.shinjukuChanges = {
    capture: captureSheetState,
    markSaved(state = captureSheetState()) { savedSheetState = state; },
    isDirty() { return draftTouched || (savedSheetState !== null && captureSheetState() !== savedSheetState); },
  };
  window.addEventListener("beforeunload", event => {
    if (allowNavigation || !window.shinjukuChanges.isDirty()) return;
    event.preventDefault();
    event.returnValue = "";
  });
  window.addEventListener("DOMContentLoaded", () => {
    if (savedSheetState === null) window.shinjukuChanges.markSaved();
  });
  window.addEventListener("pageshow", () => { allowNavigation = false; });
  document.querySelectorAll("a[data-new-shinjuku]").forEach(link => {
    link.addEventListener("click", event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (!window.shinjukuChanges.isDirty()) return;
      if (!window.confirm("保存されていない変更があります。保存せずに新しい探索者シートを開きますか？")) {
        event.preventDefault();
      } else allowNavigation = true;
    });
  });

  function showItems(id, names) {
    const entries = names.map(name => {
      const li = document.createElement("li");
      li.textContent = name;
      return li;
    });
    panel.querySelector(`#${id}`).replaceChildren(...entries);
  }

  function positionPanel() {
    const top = Math.ceil(document.querySelector(".crawler-header").getBoundingClientRect().bottom) + 8;
    panel.style.top = `${top}px`;
    panel.style.maxHeight = `calc(100dvh - ${top + 12}px)`;
    form.style.paddingTop = `${top + 12}px`;
  }

  function updatePreview() {
    draft = null;
    apply.disabled = true;
    const hasStats = d6(stamina) && d6(spirit);
    const needsExtra = hasStats && stamina.valueAsNumber + spirit.valueAsNumber <= 5;
    extra.hidden = !needsExtra;
    panel.querySelector("#creation-bonus").hidden = true;
    showItems("creation-bonus-items", []);
    if (!hasStats) {
      panel.querySelector("#creation-background-name").textContent = "未確定";
      panel.querySelector("#creation-background-tags").textContent = "";
      showItems("creation-items", []);
      preview.textContent = "体力とやる気に1〜6を入力すると、背景・タグ・初期所持品を確認できます。";
      return;
    }
    const background = readBackground(stamina.valueAsNumber, spirit.valueAsNumber);
    panel.querySelector("#creation-background-name").textContent = background.name;
    panel.querySelector("#creation-background-tags").textContent = background.tags;
    showItems("creation-items", background.equipment);
    if (needsExtra && (!d6(extraStamina) || !d6(extraSpirit))) {
      preview.textContent = "追加所持品の出目も入力するか、ダイスを振ってください。";
      return;
    }
    const bonus = needsExtra ? readBackground(extraStamina.valueAsNumber, extraSpirit.valueAsNumber).equipment : [];
    panel.querySelector("#creation-bonus").hidden = !bonus.length;
    showItems("creation-bonus-items", bonus);
    preview.textContent = "この内容をシートに反映できます。";
    draft = { background, stamina: stamina.value, spirit: spirit.value, equipment: [...background.equipment, ...bonus] };
    apply.disabled = false;
  }

  panel.addEventListener("input", () => {
    draftTouched = true;
    updatePreview();
  });
  function rollCreation() {
    draftTouched = true;
    stamina.value = rollD6();
    spirit.value = rollD6();
    extraStamina.value = "";
    extraSpirit.value = "";
    updatePreview();
  }
  document.getElementById("creation-roll").addEventListener("click", () => {
    rollCreation();
    positionPanel();
    panel.showPopover();
  });
  panel.querySelector("#creation-reroll").addEventListener("click", rollCreation);
  document.getElementById("creation-review").addEventListener("click", () => {
    if (!stamina.value && !spirit.value) {
      stamina.value = sheetStamina.value;
      spirit.value = sheetSpirit.value;
      updatePreview();
    }
  });
  panel.querySelector("#creation-extra-roll").addEventListener("click", () => {
    draftTouched = true;
    extraStamina.value = rollD6();
    extraSpirit.value = rollD6();
    updatePreview();
  });
  document.getElementById("creation-motive-roll").addEventListener("click", () => {
    const first = rollD6(), second = rollD6();
    const motive = form.elements.motivation;
    motive.value = motives[(first - 1) * 6 + second - 1];
    const result = document.getElementById("creation-motive-result");
    result.textContent = `${first}${second}`;
    result.setAttribute("aria-label", `d66の出目：${first}${second}`);
    motive.dispatchEvent(new Event("input", { bubbles: true }));
  });

  function isEmptySlot(slot) {
    return ["name", "stat", "price", "note"].every(key => !form.elements[`equip_${slot}_${key}`].value.trim())
      && !form.elements[`equip_${slot}_free`].checked
      && ["w", "h"].every(key => form.elements[`equip_${slot}_${key}`].value === "1");
  }

  function equipInitialItem(name) {
    const effect = itemCatalog.get(name);
    if (!effect) return false;
    const slot = effect.armor && isEmptySlot("b") ? "b"
      : effect.weapon ? ["r", "l"].find(isEmptySlot) : null;
    if (!slot) return false;
    const { price, w, h } = effect;
    const stat = slot === "b" ? effect.armor : effect.weapon;
    for (const [key, value] of Object.entries({ name, stat, price, w, h, note: itemCatalog.describe(name, slot) })) {
      form.elements[`equip_${slot}_${key}`].value = value;
    }
    form.elements[`equip_${slot}_free`].checked = true;
    window.queueTextareaAutoResize?.(form.elements[`equip_${slot}_note`]);
    return true;
  }
  apply.addEventListener("click", () => {
    if (!draft) return;
    const table = form.querySelector("#item-list tbody");
    const backgroundField = form.elements.background;
    const tagsField = form.elements.tags;
    const hasExisting = backgroundField.value || tagsField.value || ["r", "l", "b"].some(slot => !isEmptySlot(slot)) ||
      Array.from(table.querySelectorAll('[name="item_name"]')).some(input => input.value.trim());
    if (hasExisting && !window.confirm("体力・やる気・背景・タグを置き換え、現在の所持品に初期所持品を追加しますか？")) return;
    sheetStamina.value = draft.stamina;
    sheetSpirit.value = draft.spirit;
    backgroundField.value = draft.background.name;
    tagsField.value = draft.background.tags;
    tagsField.dispatchEvent(new Event("input", { bubbles: true }));
    const addButton = document.getElementById("add-item-row");
    for (const entry of draft.equipment) {
      const [name, quantity = "1"] = entry.split("×");
      for (let copy = 0; copy < Number(quantity); copy++) {
        if (!panel.querySelector("#creation-auto-equip").checked || !equipInitialItem(name)) addInitialItem(name, table, addButton);
      }
    }
    document.getElementById("btn-sync-puzzle").click();
    window.calculateTotal();
    draft = null;
    draftTouched = false;
    apply.disabled = true;
    preview.textContent = "初期所持品を無料で反映しました。装備とカバンの中身を確認して保存してください。";
    panel.hidePopover();
  });

  panel.hidden = false;
  document.getElementById("creation-actions").hidden = false;
  panel.addEventListener("beforetoggle", positionPanel);
  window.addEventListener("resize", positionPanel);
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(positionPanel).observe(document.querySelector(".crawler-header"));
  positionPanel();
})();

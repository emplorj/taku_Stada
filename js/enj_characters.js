(() => {
  "use strict";

  const CHARACTER_API_BASE_URL =
    "https://script.google.com/macros/s/AKfycbx9NnqKeIqA9TehZa9sxdYK_gsoWWtTcOK3pessvmOY_61_yXDi2wkHQt-6n7oj6A/exec";
  const CHARACTER_INDEX_API_URL = `${CHARACTER_API_BASE_URL}?tool=index`;
  const LOCAL_PREVIEW_URL = "data/enj_characters.preview.json?v=20260830b";
  // GASが返した最新の名鑑を次回起動用に残す。静的控えが古くても、
  // 一度でも最新版を受け取っていれば次のハード再読み込みから即表示できる。
  const CHARACTER_CACHE_KEY = "enj-character-catalog-index-v2";
  const COMMENT_AUTHOR_KEYS_STORAGE = "enj-character-comment-author-keys-v1";
  const COLOR_NAMES = "red|orange|yellow|green|cyan|blue|purple|pink|gray";
  // NJMC / エンパイア以外は、名鑑に現れた順で距離感のある仮名にする。
  // シートには実際の場所名を入れたままでよい。
  const PRIMARY_LOCATION_NAMES = new Set(["NJMC", "エンパイア"]);
  const REMOTE_LOCATION_NAMES = ["あっち", "そっち", "向こう", "よそ", "どこか", "遠く", "かなた"];
  const locationDisplayNames = new Map();
  const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);

  const state = { characters: [], query: "", system: "", location: "", year: "", sex: "", sort: "id-desc", view: "list", catalogMode: "unique", tagFilters: new Map(), selectedId: null, variantIndex: 0, detailImageMode: "normal", detailContentTab: "person", cardVariantIndexes: new Map(), detailScrollPositions: new Map(), facePreviewLayouts: new Map(), facePreviewHidden: new Set(), expressionPaletteHidden: new Set(), revealedSpoilerTags: new Set(), mergeSelection: null, portraitAdjustMode: false, activePortraitAdjustment: null, catalogScrollY: 0, openedFromUrl: false, statsOpen: false, jobDetailMode: false, detailRequests: new Map(), detailLoadingId: null, detailWarmupController: null, detailWarmupTimer: null };
  const grid = document.getElementById("character-grid");
  const search = document.getElementById("character-search");
  const systemFilter = document.getElementById("system-filter");
  const locationFilter = document.getElementById("location-filter");
  const yearFilter = document.getElementById("year-filter");
  const sexFilter = document.getElementById("sex-filter");
  const sortSelect = document.getElementById("sort-select");
  const viewToggle = document.querySelector(".catalog-view-toggle");
  const catalogModeToggle = document.querySelector(".catalog-mode-toggle");
  const portraitAdjustToggle = document.getElementById("portrait-adjust-toggle");
  const statsToggle = document.getElementById("catalog-stats-toggle");
  const statistics = document.getElementById("catalog-statistics");
  const count = document.getElementById("catalog-count");
  const status = document.getElementById("catalog-status");
  const activeTagFilters = document.getElementById("active-tag-filters");
  const dialog = document.getElementById("character-dialog");
  const imageLightbox = document.getElementById("character-image-lightbox");
  const imageLightboxImage = document.getElementById("character-image-lightbox-image");
  let tagPopover = null;
  let imageLightboxCloseTimer = null;
  let quoteSpotlightTimer = null;
  const detail = document.getElementById("character-detail");
  const toast = document.getElementById("catalog-toast");
  const mergeInput = document.getElementById("character-merge-input");
  const mergeSelect = document.getElementById("character-merge-select");
  const mergeOutput = document.getElementById("character-merge-output");
  const mergeRun = document.getElementById("character-merge-run");
  const mergeCopy = document.getElementById("character-merge-copy");
  const mergeStatus = document.getElementById("character-merge-status");
  const portraitAdjustController = document.getElementById("portrait-adjust-controller");
  let toastTimer = null;
  let commentAuthors = [];
  let commentAuthorsRequest = null;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
  }

  function safeUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(String(value), location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_error) { return ""; }
  }

  function commentAuthorKeys() {
    try {
      const raw = globalThis.localStorage?.getItem(COMMENT_AUTHOR_KEYS_STORAGE);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_error) { return {}; }
  }

  function commentAuthorKeyOf(author) {
    return String(commentAuthorKeys()[String(author || "").trim()] || "");
  }

  function saveCommentAuthorKey(author, key) {
    const name = String(author || "").trim();
    const value = String(key || "").trim();
    if (!name || !value) return;
    try {
      const saved = commentAuthorKeys();
      saved[name] = value;
      globalThis.localStorage?.setItem(COMMENT_AUTHOR_KEYS_STORAGE, JSON.stringify(saved));
    } catch (_error) { /* 保存できなくても送信自体は続ける。 */ }
  }

  function loadCommentAuthors() {
    if (commentAuthorsRequest) return commentAuthorsRequest;
    commentAuthorsRequest = fetch(`${CHARACTER_API_BASE_URL}?tool=commentAuthors`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        commentAuthors = Array.isArray(payload?.authors) ? payload.authors.map((value) => String(value || "").trim()).filter(Boolean) : [];
        if (dialog?.open) renderDetail();
        return commentAuthors;
      })
      .catch((error) => { console.warn("Comment author list could not be loaded.", error); return []; });
    return commentAuthorsRequest;
  }

  // 編集用のGoogleスプレッドシートは、公開ページから直接開かせない。
  // 公開したいキャラシ情報は `公開キャラシ` タブ経由の publicCharacterSheet を使う。
  function publicCharacterSheetUrl(value) {
    const href = safeUrl(value);
    if (!href) return "";
    try {
      const url = new URL(href);
      return url.hostname === "docs.google.com" && url.pathname.startsWith("/spreadsheets/") ? "" : href;
    } catch (_error) { return ""; }
  }

  function normalizeCharacterReference(value) {
    return String(value || "")
      .trim()
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[“”\"'()（）]/g, "")
      .replace(/[\s　・･]/g, "");
  }

  // [[名前]] / [[名前#160]] / [[#160/姿]] / [[ファイル名]] を名鑑内の詳細表示へ変換する。
  // 同名があり得るため、確実に指定したい時は #ユニークID を添える。
  function characterReferenceOf(value) {
    const raw = String(value || "").trim();
    const normalizedRaw = normalizeCharacterReference(raw);
    // ファイル名をそのまま貼る運用。姿ごとに確実に辿れるので、普段はこちらを推奨する。
    for (const character of state.characters) {
      const variantIndex = character.variants.findIndex((variant) =>
        normalizeCharacterReference(variant.fileName) === normalizedRaw
      );
      if (variantIndex !== -1) {
        const variant = character.variants[variantIndex];
        return { id: character.id, variantIndex, label: variant.name || character.registrationName, autoLabel: true };
      }
    }
    let [identity, pose = ""] = raw.split(/\s*\/\s*/, 2);
    // [[アリサ>アリサ#人斬り]] のように、呼称と姿を # で続ける書き方も受け付ける。
    // #098 のような数値IDとは区別し、# の後ろが非数値の時だけ姿指定とみなす。
    const namedPose = !pose && identity.match(/^(.+?)\s*#\s*([^\d\s].*)$/);
    if (namedPose) {
      identity = namedPose[1].trim();
      pose = namedPose[2].trim();
    }
    const idMatch = identity.match(/#\s*(\d+)/);
    const id = idMatch ? String(Number(idMatch[1])) : "";
    const name = identity.replace(/#\s*\d+\s*$/, "").trim();
    const byId = id ? state.characters.find((character) => String(character.id) === id) : null;
    if (byId) {
      const variantName = pose || name;
      const variantIndex = variantName
        ? Math.max(0, byId.variants.findIndex((variant) =>
          normalizeCharacterReference(variant.variant) === normalizeCharacterReference(variantName) ||
          normalizeCharacterReference(variant.name) === normalizeCharacterReference(variantName)
        ))
        : byId.representativeIndex;
      return { id: byId.id, variantIndex, label: byId.variants[variantIndex]?.name || byId.registrationName };
    }
    const normalized = normalizeCharacterReference(name);
    if (!normalized) return null;
    for (const character of state.characters) {
      const variantIndex = character.variants.findIndex((variant) => {
        const samePerson = normalizeCharacterReference(variant.name) === normalized ||
          normalizeCharacterReference(character.registrationName) === normalized;
        const samePose = !pose || normalizeCharacterReference(variant.variant) === normalizeCharacterReference(pose);
        return samePerson && samePose;
      });
      if (variantIndex !== -1) return { id: character.id, variantIndex, label: character.variants[variantIndex]?.name || character.registrationName };
    }
    return null;
  }

  function inlineMarkdown(value) {
    const tokens = [];
    const token = (html) => {
      const key = `\u0000TOKEN${tokens.length}\u0000`;
      tokens.push(html);
      return key;
    };
    let text = String(value ?? "")
      // ゆとシート互換のルビ。HTML化を先に退避して、以後の記法解析から守る。
      .replace(/\|([^|《》\r\n]+)《([^《》\r\n]+)》/g, (_match, label, reading) => token(`<ruby>${escapeHtml(label)}<rt>${escapeHtml(reading)}</rt></ruby>`))
      .replace(/\[\[([^\[\]\n]+)\]\]/g, (match, target) => {
      // [[表示名>名前#ID]] とすると、文中の表記と検索先を分けられる。
      // ゆとシート互換の [[表示名>URL]] は外部リンクとしても読める。
      // 旧来の | も受け付けるが、新規記入は > を使う。
      const separator = target.includes(">") ? ">" : "|";
      const [labelSource, referenceSource] = target.split(separator).map((part) => part.trim());
      const href = safeUrl(referenceSource);
      if (href) return token(`<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(labelSource || href)}</a>`);
      const reference = characterReferenceOf(referenceSource || labelSource);
      if (!reference) return match;
      // ファイル名の貼り付けだけは読めるキャラ名に置換する。
      // [[テオドラ]] のような呼称は、書いた表記をそのまま見せる。
      const label = referenceSource
        ? (labelSource || reference.label || `#${reference.id}`)
        : (reference.autoLabel ? reference.label : (labelSource || reference.label || `#${reference.id}`));
      return token(`<button class="character-reference" type="button" data-character-reference="${escapeHtml(`${reference.id}:${reference.variantIndex}`)}">${escapeHtml(label)}</button>`);
    }).replace(/`([^`\n]+)`/g, (_match, code) => token(`<code>${escapeHtml(code)}</code>`));
    text = escapeHtml(text);
    const openColor = new RegExp(`&lt;span class=(?:&quot;|&#39;)(${COLOR_NAMES})(?:&quot;|&#39;)&gt;`, "gi");
    text = text.replace(openColor, (_match, color) => `<span class="md-color-${color.toLowerCase()}">`);
    text = text.replace(/&lt;\/span&gt;/gi, "</span>");
    text = text.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (_match, label, url) => {
      const href = safeUrl(url);
      return href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
    });
    // {{ }} はゆとシートの透明記法。|| || は従来どおりクリックで開く名鑑のネタバレ。
    text = text.replace(/\{\{(.+?)\}\}/g, '<span class="transparent-text">$1</span>');
    text = text.replace(/\|\|(.+?)\|\|/g, '<span class="spoiler-text" role="button" tabindex="0" aria-label="ネタバレを表示">$1</span>');
    text = text.replace(/'''(.+?)'''/g, "<em>$1</em>");
    text = text.replace(/''(.+?)''/g, "<strong>$1</strong>");
    text = text.replace(/%%(.+?)%%/g, "<del>$1</del>");
    text = text.replace(/~~(.+?)~~/g, "<del>$1</del>");
    text = text.replace(/__\*\*\*(.+?)\*\*\*__/g, "<u><strong><em>$1</em></strong></u>");
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    text = text.replace(/__\*\*(.+?)\*\*__/g, "<u><strong>$1</strong></u>");
    text = text.replace(/__\*(.+?)\*__/g, "<u><em>$1</em></u>");
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__(.+?)__/g, "<u>$1</u>");
    text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    text = text.replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>");
    text = text.replace(/\\([\\`*{}_\[\]()#+\-.!|>~])/g, "$1");
    tokens.forEach((html, index) => { text = text.replace(`\u0000TOKEN${index}\u0000`, html); });
    return text;
  }

  function renderMarkdown(value) {
    if (!value) return "";
    const codeBlocks = [];
    const source = String(value).replace(/\r\n?/g, "\n").replace(/```(?:\w+)?\n?([\s\S]*?)```/g, (_match, code) => {
      const key = `\u0000BLOCK${codeBlocks.length}\u0000`;
      codeBlocks.push(`<pre><code>${escapeHtml(code.replace(/\n$/, ""))}</code></pre>`);
      return key;
    });
    const blocks = [];
    let paragraph = [], listType = "", listItems = [], quoteLines = [];
    const paragraphHtml = (lines) => {
      const [firstLine = "", ...continuation] = lines;
      // （推測）などの短い先頭注記は、折返しを本文の開始位置に揃える。
      const parenthetical = firstLine.match(/^([（(][^）)\n]{1,12}[）)])[\s　]*(.+)$/);
      if (!parenthetical) return `<p>${lines.map(inlineMarkdown).join("<br>")}</p>`;
      const body = [parenthetical[2], ...continuation].map(inlineMarkdown).join("<br>");
      return `<p class="detail-parenthetical"><span class="detail-parenthetical__label">${inlineMarkdown(parenthetical[1])}</span><span class="detail-parenthetical__body">${body}</span></p>`;
    };
    const flushParagraph = () => { if (paragraph.length) blocks.push(paragraphHtml(paragraph)); paragraph = []; };
    const flushList = () => { if (listItems.length) blocks.push(`<${listType}>${listItems.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${listType}>`); listType = ""; listItems = []; };
    const flushQuote = () => { if (quoteLines.length) blocks.push(`<blockquote>${quoteLines.map(inlineMarkdown).join("<br>")}</blockquote>`); quoteLines = []; };
    const flushAll = () => { flushParagraph(); flushList(); flushQuote(); };
    source.split("\n").forEach((line) => {
      const tokenMatch = line.match(/^\u0000BLOCK(\d+)\u0000$/);
      if (tokenMatch) { flushAll(); blocks.push(codeBlocks[Number(tokenMatch[1])]); return; }
      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) { flushAll(); const level = heading[1].length; blocks.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); return; }
      const subtext = line.match(/^-#\s+(.+)$/);
      if (subtext) { flushAll(); blocks.push(`<p class="discord-subtext">${inlineMarkdown(subtext[1])}</p>`); return; }
      const quote = line.match(/^>{1,3}\s?(.*)$/);
      if (quote) { flushParagraph(); flushList(); quoteLines.push(quote[1]); return; }
      const unordered = line.match(/^\s*[-*]\s+(.+)$/);
      const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
      if (unordered || ordered) {
        flushParagraph(); flushQuote();
        const nextType = unordered ? "ul" : "ol";
        if (listType && listType !== nextType) flushList();
        listType = nextType; listItems.push((unordered || ordered)[1]); return;
      }
      if (!line.trim()) { flushAll(); return; }
      flushList(); flushQuote(); paragraph.push(line);
    });
    flushAll();
    return blocks.join("");
  }

  function parsePortraitAdjustment(value) {
    if (value === undefined || value === null || value === "") return {};
    const [scale, offsetY, offsetX, listOffsetY, iconOffsetY, iconOffsetX] = String(value).trim().split(/[，,\s]+/);
    const parsedScale = Number(scale), parsedOffsetY = Number(offsetY), parsedOffsetX = Number(offsetX), parsedListOffsetY = Number(listOffsetY), parsedIconOffsetY = Number(iconOffsetY), parsedIconOffsetX = Number(iconOffsetX);
    return {
      ...(Number.isFinite(parsedScale) ? { scale: parsedScale } : {}),
      ...(Number.isFinite(parsedOffsetY) ? { offsetY: parsedOffsetY } : {}),
      ...(Number.isFinite(parsedOffsetX) ? { offsetX: parsedOffsetX } : {}),
      // 4項目目は一覧右側だけに足す上下補正。空欄なら従来と同じ 0。
      ...(Number.isFinite(parsedListOffsetY) ? { listOffsetY: parsedListOffsetY } : {}),
      // 5・6項目目は一覧左の顔アイコンだけを動かす補正。未指定なら従来どおり中央。
      ...(Number.isFinite(parsedIconOffsetY) ? { iconOffsetY: parsedIconOffsetY } : {}),
      ...(Number.isFinite(parsedIconOffsetX) ? { iconOffsetX: parsedIconOffsetX } : {})
    };
  }

  function parseJsonLoose(value) {
    if (!value) return null;
    let source = String(value).trim();
    try { return JSON.parse(source); }
    catch (_error) {
      try {
        if (source.startsWith('"') && source.endsWith('"')) source = source.slice(1, -1);
        return JSON.parse(source.replace(/""/g, '"'));
      } catch (_nestedError) { return null; }
    }
  }
  const normalizeMergeName = (value) => String(value || "").trim().toLowerCase().replace(/[“”"'()（）]/g, "").replace(/[\s　・･]/g, "");
  const cleanMergeInput = (value) => String(value || "").trim().replace(/^[①-⑳]\s*/, "").replace(/^\d+[.)．、:：]\s*/, "").trim();
  const addMergeTarget = (targets, value) => { const text = String(value || "").trim(); if (text && !targets.includes(text)) targets.push(text); };
  function mergeScore(variant, character, targets) {
    const name = normalizeMergeName(variant.name), registrationName = normalizeMergeName(character.registrationName);
    let score = 0;
    targets.forEach((target) => {
      const normalized = normalizeMergeName(target);
      if (!normalized) return;
      if (name === normalized) score = Math.max(score, 100);
      if (registrationName === normalized) score = Math.max(score, 95);
      if (normalized.includes(name) && name) score = Math.max(score, 85);
      if (name.includes(normalized) && name) score = Math.max(score, 70);
    });
    return score;
  }
  function mergeCharacterJson(input, selectedVariant = null) {
    const raw = cleanMergeInput(input), parsed = parseJsonLoose(raw), commonColor = "#5FE5EA";
    const base = parsed?.data ? JSON.parse(JSON.stringify(parsed)) : { kind: "character", data: { name: raw, faces: [], status: [], hideStatus: true, color: commonColor } };
    if (!base.data.color) base.data.color = commonColor;
    const targets = [];
    addMergeTarget(targets, base.data.name);
    if (base.data.memo) addMergeTarget(targets, String(base.data.memo).split(/\r?\n/)[0]);
    let best = selectedVariant;
    if (!best) {
      let bestScore = 0;
      state.characters.forEach((character) => character.variants.forEach((variant) => {
        const score = mergeScore(variant, character, targets);
        if (score > bestScore) { best = { character, variant }; bestScore = score; }
      }));
    }
    if (!best) return { error: "いねえ？" };
    const differences = parseJsonLoose(best.variant.differenceJson);
    if (!best.variant.differenceJson) return { error: "差分がねえ" };
    if (!differences?.data) return { error: `「${best.variant.name || best.character.registrationName}」の差分データが壊れてるっぽいけど？` };
    base.data.name = best.character.registrationName || best.variant.name;
    if (differences.data.iconUrl) base.data.iconUrl = differences.data.iconUrl;
    if (differences.data.faces) base.data.faces = differences.data.faces;
    if (differences.commands) base.commands = differences.commands;
    return { value: JSON.stringify(base, null, 2), name: best.variant.name || best.character.registrationName };
  }

  function normalizeCharacter(character) {
    const variants = Array.isArray(character.variants) ? character.variants : [];
    return {
      ...character,
      // 旧来の完全 payload / 静的控えは detailLoaded を持たないため、
      // 詳細専用の値が一つでもあれば読み込み済みとして扱う。
      detailLoaded: Boolean(character.detailLoaded || variants.some((variant) =>
        variant.differenceJson || variant.quote || variant.personality || variant.driveUrl || variant.characterSheetUrl
      )),
      id: String(character.id ?? ""),
      registrationName: character.registrationName || variants[0]?.name || "名称未設定",
      representativeIndex: Math.max(0, Math.min(Number(character.representativeIndex) || 0, Math.max(variants.length - 1, 0))),
      // Image-audit extension point: after this normalization, compare each
      // character's variants by fullBodyUrl/specialFullBodyUrl and system/variant.
      // This is where duplicate, stale, and missing alternate-image checks belong.
      variants: variants.map((variant) => {
        const adjustment = parsePortraitAdjustment(variant.portraitAdjustment ?? variant.portraitTuning ?? variant["立ち絵調整"]);
        // 「特殊」は名称にかかわらず、通常立ち絵とは別の追加立ち絵として扱う。
        const specialFullBodyUrl = variant.specialFullBodyUrl || variant.specialUrl || variant["特殊"] || variant.battleFullBodyUrl || "";
        const specialFullBodyFileName = variant.specialFullBodyFileName || variant.specialFileName || variant["特殊ファイル名"] || variant.battleFullBodyFileName || "";
        const publicSource = [variant.publicCharacterSheet, variant.publicSheet, variant.publicData, variant["公開キャラシ"]]
          .find((value) => value && typeof value === "object" && !Array.isArray(value)) || {};
        const publicValue = (...keys) => {
          for (const key of keys) {
            const value = publicSource[key] ?? variant[key];
            if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
          }
          return "";
        };
        return {
        ...variant,
        // APIの二つ名を正規名に寄せつつ、旧epithet payloadも表示できるようにする。
        aka: String(variant.aka || variant.epithet || "").trim(),
        // Older API payloads call this field firstAppearance; keep both shapes usable.
        debut: variant.debut || variant.firstAppearance || "",
        specialFullBodyUrl,
        specialFullBodyFileName,
        // 旧APIとの互換用に battleFullBody* も残すが、表示側は specialFullBody* を使う。
        battleFullBodyUrl: variant.battleFullBodyUrl || specialFullBodyUrl,
        battleFullBodyFileName: variant.battleFullBodyFileName || specialFullBodyFileName,
        // Optional per-pose display scale. API未対応時は安全な等倍のまま表示する。
        portraitScale: variant.portraitScale ?? variant.fullBodyScale ?? adjustment.scale ?? 1,
        // Positive values move the portrait down; negative values move it up.
        portraitOffsetY: variant.portraitOffsetY ?? variant.fullBodyOffsetY ?? adjustment.offsetY ?? 0,
        // Positive values move the portrait right.
        portraitOffsetX: variant.portraitOffsetX ?? variant.fullBodyOffsetX ?? adjustment.offsetX ?? 0,
        listPortraitOffsetY: variant.listPortraitOffsetY ?? adjustment.listOffsetY ?? 0,
        cardIconOffsetY: variant.cardIconOffsetY ?? adjustment.iconOffsetY ?? 0,
        cardIconOffsetX: variant.cardIconOffsetX ?? adjustment.iconOffsetX ?? 0,
        // 任意列。APIがまだこの列を返さない期間も空欄として安全に扱う。
        portrayalTips: String(variant.portrayalTips || variant["他の人が演じるときのコツ"] || "").trim(),
        appearanceScenarios: String(variant.appearanceScenarios || variant["登場シナリオ"] || "").trim(),
        tips: String(variant.tips || variant["TIPS"] || "").trim(),
        enJReview: String(variant.enJReview || variant.enjReview || variant["エンJ人物評"] || "").trim(),
        achievement: String(variant.achievement ?? variant.selfAchievement ?? variant["やれた度"] ?? "").trim(),
        communityReview: String(variant.communityReview || variant.everyoneReview || variant["みんな評"] || "").trim(),
        commentReview: String(variant.commentReview || variant["コメント評"] || "").trim(),
        commentEntries: Array.isArray(variant.commentEntries) ? variant.commentEntries.map((entry) => ({
          id: String(entry?.id || "").trim(),
          author: String(entry?.author || "").trim(),
          createdAt: String(entry?.createdAt || "").trim(),
          comment: String(entry?.comment || "").trim()
        })).filter((entry) => entry.id && entry.comment) : [],
        aiReview: String(variant.aiReview || variant["AI人物評"] || "").trim(),
        // `公開キャラシ` タブ由来の任意データ。APIが未対応の間は空のままなので、
        // 既存のCharacters APIレスポンスには影響しない。
        publicCharacterSheet: {
          codeName: publicValue("codeName", "codename", "コードネーム"),
          personalData: publicValue("personalData", "パーソナルデータ"),
          notes: publicValue("notes", "備考"),
          skills: publicValue("skills", "技能"),
          dLois: publicValue("dLois", "dRois", "Dロイス"),
          syndromes: publicValue("syndromes", "syndrome", "シンドローム"),
          effects: publicValue("effects", "エフェクト"),
          weapons: publicValue("weapons", "武器"),
          combos: publicValue("combos", "コンボ")
        },
        tags: String(variant.tags || variant["タグ"] || "").trim(),
        reading: String(variant.reading || variant["読み"] || "").trim(),
        faces: Array.isArray(variant.faces) ? variant.faces : []
      };
      }),
    };
  }

  const representativeOf = (character) => character.variants[character.representativeIndex] || character.variants[0] || {};
  function displayableImageUrl(value, size = 1200) {
    const url = safeUrl(value);
    if (!url) return "";
    const driveFile = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    const parsedUrl = new URL(url);
    const driveOpen = parsedUrl.hostname === "drive.google.com" && parsedUrl.pathname === "/open" ? parsedUrl.searchParams.get("id") : "";
    const driveId = driveFile?.[1] || driveOpen;
    return driveId ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveId)}&sz=w${Math.max(64, Math.round(size))}` : url;
  }
  const imageCandidatesOf = (variant) => [variant.iconUrl, variant.imageUrl, variant.faceUrl, variant.fullBodyUrl, variant.faces?.[0]?.iconUrl]
    .map((url) => displayableImageUrl(url, 320)).filter(Boolean);
  const imageOf = (variant) => imageCandidatesOf(variant)[0] || "";
  const bodyImageCandidatesOf = (variant) => [variant.fullBodyUrl, variant.imageUrl, variant.faceUrl, variant.faces?.[0]?.iconUrl]
    // Array#map の index を画像サイズとして渡さないよう、必ず明示的に指定する。
    .map((url) => displayableImageUrl(url, 1200)).filter(Boolean);
  const cardBodyImageCandidatesOf = (variant) => [variant.fullBodyUrl, variant.imageUrl, variant.faceUrl, variant.faces?.[0]?.iconUrl]
    .map((url) => displayableImageUrl(url, 720)).filter(Boolean);
  const cardIconCandidatesOf = (variant) => [variant.iconUrl, variant.imageUrl, variant.faceUrl]
    .map((url) => displayableImageUrl(url, 240)).filter(Boolean);
  const cardIconOf = (character, variant) => cardIconCandidatesOf(variant)[0] || cardIconCandidatesOf(representativeOf(character))[0] || "";
  // シートの「アイコン」列そのものが埋まっている時だけ、左のアイコンを少し右へ逃がす。
  // imageUrl / faceUrl へのフォールバックには反応させず、列に明示的なアイコンがある場合だけに限定する。
  const hasCatalogIconOf = (variant) => Boolean(safeUrl(variant?.iconUrl));
  const catalogIconOffsetXOf = (variant) => hasCatalogIconOf(variant) ? 5 : 0;
  const effectiveCardIconOffsetXOf = (variant) => cardIconOffsetXOf(variant) + catalogIconOffsetXOf(variant);
  // 一覧右側も、詳細と同じ「立ち絵調整」の倍率をそのまま使う。
  // 枠の形だけが異なり、一覧専用の追加拡大はしない。
  const listPortraitScaleFor = (_image, scale) => scale;
  function sameImageSource(left, right) {
    if (!left || !right) return false;
    try {
      const a = new URL(left), b = new URL(right);
      // Drive は表示サイズだけ異なる thumbnail URL を返す。元ファイルIDで比較する。
      if (a.hostname === "drive.google.com" && b.hostname === "drive.google.com") return a.searchParams.get("id") === b.searchParams.get("id");
      return a.href === b.href;
    } catch (_error) { return left === right; }
  }
  const catalogImageCandidatesOf = (character, variant) => {
    // アイコンがある人物は左に共通アイコン、右に選択中の立ち絵を置く。
    // アイコン未登録なら、選択中の姿の立ち絵だけを左に出す。
    const icon = cardIconOf(character, variant);
    const bodyImages = cardBodyImageCandidatesOf(variant);
    return icon ? [icon, ...bodyImages.filter((url) => url !== icon)] : bodyImages;
  };
  const detailImagesOf = (variant) => {
    const normal = displayableImageUrl(variant.fullBodyUrl || variant.imageUrl || variant.faceUrl || variant.faces?.[0]?.iconUrl);
    const special = displayableImageUrl(variant.specialFullBodyUrl);
    const additional = Array.isArray(variant.additionalFullBodyUrls) ? variant.additionalFullBodyUrls : [];
    return [
      normal && { key: "normal", url: normal },
      special && special !== normal && { key: "special", url: special },
      ...additional.map((url, index) => ({ key: `additional-${index}`, url: displayableImageUrl(url) })).filter((image) => image.url && image.url !== normal && image.url !== special)
    ].filter(Boolean);
  };
  const detailImageOf = (variant, mode = "normal") => {
    const images = detailImagesOf(variant);
    return images.find((image) => image.key === mode)?.url || images[0]?.url || "";
  };
  const portraitScaleOf = (variant) => Math.max(0.8, Math.min(2, Number(variant.portraitScale) || 1));
  const portraitOffsetYOf = (variant) => Math.max(-180, Math.min(180, Number(variant.portraitOffsetY) || 0));
  const portraitOffsetXOf = (variant) => Math.max(-180, Math.min(180, Number(variant.portraitOffsetX) || 0));
  const listPortraitOffsetYOf = (variant) => Math.max(-180, Math.min(180, Number(variant.listPortraitOffsetY) || 0));
  const cardIconOffsetYOf = (variant) => Math.max(-96, Math.min(96, Number(variant.cardIconOffsetY) || 0));
  const cardIconOffsetXOf = (variant) => Math.max(-96, Math.min(96, Number(variant.cardIconOffsetX) || 0));
  const ageLabelOf = (value) => {
    const age = String(value ?? "").trim();
    if (!age || /歳/.test(age)) return age;
    // 数字・?・括弧書きだけの年齢には単位を補う。例: 23? / 38（自称）。
    return /^\d+(?:\s*[?？])?(?:\s*[（(][^）)]*[）)])?$/.test(age) ? `${age}歳` : age;
  };
  const genderBadgeOf = (value) => {
    const label = String(value ?? "").trim();
    const key = label.normalize("NFKC").toLowerCase().replace(/[\s　]/g, "");
    const gender = /(?:true|男性|男|male|♂)/.test(key) ? "male"
      : /(?:false|女性|女|female|♀)/.test(key) ? "female"
      : /(?:中性|両性|無性|ノンバイナリー|nonbinary|xジェンダー|xgender)/.test(key) ? "other"
      : "unknown";
    const icon = gender === "male" ? "fa-mars" : gender === "female" ? "fa-venus" : gender === "other" ? "fa-genderless" : "fa-question";
    const accessibleLabel = label || "不明・その他";
    return `<span class="character-card__gender" data-gender="${gender}" role="img" aria-label="${escapeHtml(accessibleLabel)}" title="${escapeHtml(accessibleLabel)}"><i class="fa-solid ${icon}" aria-hidden="true"></i></span>`;
  };
  // シートは TRUE/FALSE だけでなく、空欄や独自表記も混在できる。
  // フィルタ・ソートでは「男性 / 女性 / ?・その他」の三分類に寄せる。
  const genderCategoryOf = (value) => {
    const key = String(value ?? "").trim().normalize("NFKC").toLowerCase().replace(/[\s　]/g, "");
    if (/(?:true|男性|男|male|♂)/.test(key)) return "male";
    if (/(?:false|女性|女|female|♀)/.test(key)) return "female";
    return "unknown";
  };
  const cardSummaryHtmlOf = (variant) => {
    const gender = genderBadgeOf(variant.sex);
    const parts = [escapeHtml(variant.job), gender, escapeHtml(ageLabelOf(variant.age)), escapeHtml(variant.variant)];
    return parts.filter(Boolean).join(" <span class=\"character-card__summary-separator\" aria-hidden=\"true\">/</span> ") || escapeHtml(variant.name || "プロフィール未入力");
  };
  const cardTaglineOf = (variant) => String(variant.catchCopy || variant.aka || variant.epithet || "").trim();
  function yutorizeRubyHtml(value) {
    const source = String(value || "").trim();
    if (!source) return "";
    const pattern = /\|([^|《》\r\n]+)《([^《》\r\n]+)》/g;
    const rubyTokens = [];
    let text = "", cursor = 0, match;
    while ((match = pattern.exec(source))) {
      text += source.slice(cursor, match.index);
      // inlineMarkdown は _ を斜体として解釈するため、目印には記法文字を含めない。
      const key = `\uE000AKARUBY${rubyTokens.length}\uE001`;
      rubyTokens.push(`<ruby>${escapeHtml(match[1])}<rt>${escapeHtml(match[2])}</rt></ruby>`);
      text += key;
      cursor = match.index + match[0].length;
    }
    text += source.slice(cursor);
    // 二つ名・キャッチコピーも本文と同じ軽量マークアップを通す。
    // ルビは先にトークンへ退避することで、**太字** 等と安全に併用できる。
    let html = inlineMarkdown(text);
    rubyTokens.forEach((ruby, index) => { html = html.replace(`\uE000AKARUBY${index}\uE001`, ruby); });
    return html;
  }
  function quoteGroupsOf(value) {
    const groups = [];
    let current = [];
    String(value || "").replace(/\r\n?/g, "\n").split("\n").forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) {
        if (current.length) groups.push(current), current = [];
        return;
      }
      // 「」・『』で始まる行は独立したセリフ。続き行だけを同じ吹き出し内で改行する。
      const startsSpeech = /^[「『“\"]/.test(line);
      const previousStartsSpeech = current.length && /^[「『“\"]/.test(current[0]);
      if (startsSpeech || !previousStartsSpeech) {
        if (current.length) groups.push(current);
        current = [line];
      } else {
        current.push(line);
      }
    });
    if (current.length) groups.push(current);
    return groups;
  }
  // ChatGPT などからセルへ貼った時、ごくまれに内容全体が連結されたまま
  // 二重になることがある。意図的な反復を消さないよう、全文が完全に二等分で
  // 一致する場合だけ表示側で一方を取り除く。
  function withoutAccidentalDuplicate(value) {
    const text = String(value || "").replace(/\r\n?/g, "\n").trim();
    if (text.length < 40) return text;
    // ブロック間に改行が一つだけ残った「本文\n本文」も救済する。
    const blockRepeat = text.match(/^([\s\S]{40,}?)(?:\n{1,3})\1$/);
    if (blockRepeat) return blockRepeat[1].trim();
    if (text.length % 2) return text;
    const midpoint = text.length / 2;
    const first = text.slice(0, midpoint).trim();
    const second = text.slice(midpoint).trim();
    return first && first === second ? first : text;
  }
  function characterQuotesHtml(value) {
    const groups = quoteGroupsOf(withoutAccidentalDuplicate(value));
    return groups.length ? `<div class="detail-quotes">${groups.map((lines) => `<blockquote class="detail-quote detail-richtext">${renderMarkdown(lines.join("\n"))}</blockquote>`).join("")}</div>` : "";
  }
  // ココフォリアのラベルは @驚」 のようにコマンド用の記号を含むことがある。
  // 元データはコピー用にそのまま保持し、名鑑では人間が読む部分だけを整える。
  function faceLabelInfo(value, index) {
    const raw = String(value || "").trim();
    const display = (raw || `差分${index + 1}`).replace(/^[@＠]+/, "").replace(/[」｣]+$/, "").trim() || `差分${index + 1}`;
    const normalized = display.normalize("NFKC").toLowerCase();
    let tone = "other";
    // ファイル名・表情ラベルで繰り返し使われる略称を優先する。
    if (/^(n\d*|通常|無|真|真顔|まがお|ノーマル|neutral)$/.test(normalized)) tone = "neutral";
    // `w` はココフォリアで「笑い」に使われる短縮ラベル。
    else if (/^(w\d*|sm\d*|smile)$/.test(normalized) || /笑|喜|楽|にこ|照|きら|恍惚|ガッツ|てへ/.test(display)) tone = "joy";
    else if (/^(ang|angry)$/.test(normalized) || /怒|殺|睨|荒|激|ムッ|まじぎれ|狂/.test(display)) tone = "anger";
    else if (/^(sad|sh)$/.test(normalized) || /哀|悲|泣|涙|号泣|苦|沈|落/.test(display)) tone = "sad";
    else if (/^(cl|close)$/.test(normalized) || /閉|眠|寝|目閉|考|静観|半目|穏|思|じと|逸ら/.test(display)) tone = "closed";
    else if (/驚|オドロキ|びっくり|焦|汗|困|恐|怯|がーん|がびん|エラー|やば|あれ|バツ|＞＜|[!?！？]/.test(display)) tone = "surprise";
    return { raw, display, tone };
  }
function quoteSpotlightHtml(value) {
  const groups = quoteGroupsOf(withoutAccidentalDuplicate(value));
  if (!groups.length) return "";
  const verticalText = (text) => {
    // Half-width punctuation has no reliable vertical alternate in all Mincho fonts.
    // Normalize it here so the vertical quotation always keeps a one-character cell.
    const normalized = String(text ?? "").replace(/[!?]/g, (mark) => mark === "!" ? "！" : "？");
    let html = "", cursor = 0;
    normalized.replace(/[A-Za-z]+|\d+/g, (token, offset) => {
      html += escapeHtml(normalized.slice(cursor, offset));
      html += token.length <= 4 ? `<span class="vertical-tcy">${escapeHtml(token)}</span>` : escapeHtml(token);
      cursor = offset + token.length;
      return token;
    });
    return html + escapeHtml(normalized.slice(cursor));
  };
    return `<div class="detail-quote-spotlight" aria-label="代表セリフ">${groups.map((lines, index) => {
      const text = lines.join("\n");
      const compact = text.replace(/\s/g, "").length > 54 ? " is-compact" : "";
      const hanging = /^[「『“"]/.test(text) ? " has-opening-quote" : "";
      return `<p class="detail-quote-spotlight__line${index === 0 ? " is-active" : ""}${compact}${hanging}" data-quote-spotlight-index="${index}">${verticalText(text)}</p>`;
    }).join("")}</div>`;
  }
  function stopQuoteSpotlight() {
    if (quoteSpotlightTimer !== null) clearInterval(quoteSpotlightTimer);
    quoteSpotlightTimer = null;
  }
  function startQuoteSpotlight() {
    stopQuoteSpotlight();
    const lines = [...detail.querySelectorAll("[data-quote-spotlight-index]")];
    if (lines.length < 2) return;
    let activeIndex = 0;
    quoteSpotlightTimer = setInterval(() => {
      lines[activeIndex].classList.remove("is-active");
      activeIndex = (activeIndex + 1) % lines.length;
      lines[activeIndex].classList.add("is-active");
    }, 5200);
  }
  function systemColorOf(system) {
    const name = String(system || "");
    const variables = [
      ["CoC-㊙", "--color-coc-secret"], ["CoC", "--color-coc"],
      ["SW2.5", "--color-sw2-5"], ["SW", "--color-sw"], ["DX3", "--color-dx3"],
      ["ネクロニカ", "--color-nechronica"], ["サタスペ", "--color-satasupe"],
      ["マモブル", "--color-mamoburu"], ["STL", "--color-stellar"], ["銀剣", "--color-stellar"],
      ["シノビガミ", "--color-shinobigami"], ["AR2E", "--color-ar"], ["GDR", "--color-gdr"],
    ];
    const property = variables.find(([label]) => name.startsWith(label))?.[1] || "--color-default";
    return getComputedStyle(document.documentElement).getPropertyValue(property).trim() || "#007bff";
  }
  const locationsOf = (value) => [...new Set(String(value || "").split(/[、,，\n\r]+/).map((location) => location.trim()).filter(Boolean))];
  function buildLocationDisplayNames() {
    locationDisplayNames.clear();
    let remoteIndex = 0;
    state.characters.forEach((character) => character.variants.forEach((variant) => locationsOf(variant.location).forEach((location) => {
      if (locationDisplayNames.has(location)) return;
      if (PRIMARY_LOCATION_NAMES.has(location)) locationDisplayNames.set(location, location);
      else {
        locationDisplayNames.set(location, REMOTE_LOCATION_NAMES[remoteIndex] || `どこか${remoteIndex + 1}`);
        remoteIndex += 1;
      }
    })));
  }
  const locationLabelOf = (location) => locationDisplayNames.get(location) || location;
  const locationLabelsOf = (variant) => locationsOf(variant.location).map(locationLabelOf);
  // タグは入力時の見た目（ネタバレ・取り消し）を残す一方、検索・集計では
  // 同じ語として扱う。例: ||記憶喪失|| / ~~記憶喪失~~ / %%記憶喪失%% → 記憶喪失。
  // ネタバレかどうかの公開判断はタグ本文ではなく、この装飾で持てるようにする。
  function tagInfoOf(value) {
    const raw = String(value || "").trim();
    let text = raw;
    let spoiler = false;
    let struck = false;
    // 記法を重ねてもよいので、外側から順番にほどく。
    let changed = true;
    while (text && changed) {
      changed = false;
      const spoilerMatch = text.match(/^\|\|([\s\S]+)\|\|$/);
      if (spoilerMatch) {
        spoiler = true;
        text = spoilerMatch[1].trim();
        changed = true;
        continue;
      }
      const strikeMatch = text.match(/^(?:~~|%%)([\s\S]+?)(?:~~|%%)$/);
      if (strikeMatch) {
        struck = true;
        text = strikeMatch[1].trim();
        changed = true;
      }
    }
    const label = text.replace(/\s+/g, " ").trim();
    return {
      raw,
      label,
      key: label.normalize("NFKC").toLocaleLowerCase("ja"),
      spoiler,
      struck
    };
  }
  function tagsOf(value) {
    const seen = new Set();
    return String(value || "").split(/[、,，\n\r]+/)
      .map(tagInfoOf)
      .filter((tag) => tag.label && !seen.has(tag.key) && (seen.add(tag.key), true));
  }
  function generatedTag(label, source, extra = {}) {
    return { ...tagInfoOf(label), source, ...extra };
  }
  // ロールは塗り、戦闘手段・戦術は同じロール色の枠線で見せる。
  // 例: [タンク] [白兵] は青、[DPS] [射撃] は赤。ロール不明なら中立色。
  const ROLE_TAG_COLORS = Object.freeze({
    DPS: "#ef5a67",
    "タンク": "#5c9ded",
    "ヒーラー": "#63c878",
    "支援": "#a47af2",
    "探索": "#e2b84b"
  });
  const COMBAT_STYLE_TAGS = new Set(["白兵", "射撃", "魔法", "RC", "召喚", "単体", "範囲", "妨害"]);
  function decorateCombatTags(tags) {
    const role = tags.find((tag) => ROLE_TAG_COLORS[tag.label]);
    const roleColor = role ? ROLE_TAG_COLORS[role.label] : "";
    return tags.map((tag) => {
      if (ROLE_TAG_COLORS[tag.label]) return { ...tag, tagKind: "role", tagColor: ROLE_TAG_COLORS[tag.label] };
      if (COMBAT_STYLE_TAGS.has(tag.label)) return { ...tag, tagKind: "combat", tagColor: roleColor };
      return tag;
    });
  }
  function prioritizeCatalogTags(tags) {
    const decorated = decorateCombatTags(tags);
    const priority = (tag) => tag.tagKind === "role" ? 0 : tag.tagKind === "combat" ? 1 : 2;
    return decorated.sort((left, right) => priority(left) - priority(right));
  }
  function prioritizedManualTags(value) {
    return prioritizeCatalogTags(tagsOf(value));
  }
  function visibleCardTagsOf(variant) {
    // システム名は左端のシステムラベルとして一度だけ表示する。
    const manual = tagsOf(variant.tags)
      .filter((tag) => tag.label !== variant.system)
      .map((tag) => ({ ...tag, source: "manual" }));
    const jobs = jobTagsOf(variant.job);
    const seen = new Set();
    const tags = [...manual, ...jobs].filter((tag) => tag.label && !seen.has(tag.key) && (seen.add(tag.key), true));
    return prioritizeCatalogTags(tags);
  }
  // ジョブ欄は一つの文章として保ちつつ、検索用タグでは種族・役割・シンドロームを
  // それぞれ拾う。DX3の末尾A〜Dはワークスの区分なので、UGN支部長C → UGN支部長
  // のように一段まとめる。
  function jobTagsOf(value) {
    const seen = new Set();
    return String(value || "").split(/[、,，/／・]+/)
      .map((item) => item.replace(/\s+/g, " ").trim())
      .map((item) => /^(?:UGN(?:支部長|エージェント|チルドレン)|レネゲイドビーイング)[A-D]$/i.test(item) ? item.slice(0, -1) : item)
      .map((item) => generatedTag(item, "job"))
      .filter((tag) => tag.label && !seen.has(tag.key) && (seen.add(tag.key), true));
  }
  function catalogTagsOf(character, variant) {
    const manual = tagsOf(variant.tags).map((tag) => ({ ...tag, source: "manual" }));
    const derived = [
      variant.system ? generatedTag(variant.system, "system") : null,
      ...jobTagsOf(variant.job),
      character.variants.length > 1 ? generatedTag("コンバートあり", "auto") : null,
      yearOf(variant.debut) ? generatedTag(`初登場 ${yearOf(variant.debut)}年`, "auto") : null
    ].filter(Boolean);
    const seen = new Set();
    return [...manual, ...derived].filter((tag) => tag.label && !seen.has(tag.key) && (seen.add(tag.key), true));
  }
  function catalogAffinityTagsOf(variant) {
    return [
      variant.alignment ? generatedTag(`アライメント: ${variant.alignment}`, "affinity") : null,
      variant.firstPerson ? generatedTag(`一人称: ${variant.firstPerson}`, "affinity") : null
    ].filter(Boolean);
  }
  const tagSearchTextOf = (character, variant) => [...catalogTagsOf(character, variant), ...catalogAffinityTagsOf(variant)].map((tag) => tag.label).join(" ");
  function spoilerTagKeyOf(character, variant, tag) {
    return `${character.id}:${variant.fileName || variant.name || variant.system}:${tag.key}`;
  }
  function queryMatchesTag(tag) {
    const query = String(state.query || "").trim().normalize("NFKC").toLocaleLowerCase("ja");
    return Boolean(query && tag.key.includes(query));
  }
  function catalogTagHtml(tag, variant, spoilerKey = "") {
    const classes = ["catalog-tag", `catalog-tag--${tag.source || "manual"}`];
    if (tag.tagKind) classes.push(`catalog-tag--${tag.tagKind}`);
    if (tag.struck) classes.push("is-retired");
    const color = tag.tagColor || (["system", "job"].includes(tag.source) ? systemColorOf(variant.system) : "");
    const isMaskedSpoiler = tag.spoiler && !state.revealedSpoilerTags.has(spoilerKey);
    if (isMaskedSpoiler) {
      classes.push("is-spoiler");
      return `<button type="button" class="${classes.join(" ")}" data-reveal-spoiler-tag data-spoiler-key="${escapeHtml(spoilerKey)}" data-spoiler-label="${escapeHtml(tag.label)}" title="ネタバレタグ：クリックして表示">ネタバレ</button>`;
    }
    const title = tag.struck ? `${tag.label}（過去の属性）` : `${tag.label}で絞り込む`;
    const selected = state.tagFilters.has(tag.key);
    return `<button type="button" class="${classes.join(" ")}" data-tag-search="${escapeHtml(tag.label)}" aria-pressed="${selected}"${color ? ` style="--tag-color:${escapeHtml(color)}"` : ""} title="${escapeHtml(title)}">${escapeHtml(tag.label)}</button>`;
  }
  function compactCatalogTagsHtml(character, variant, limit = 3) {
    // 一覧では、すでに表示済みのシステム・ジョブ・性別などを重ねない。
    // 手入力のタグだけをシステム行に添え、生成タグは検索用として残す。
    // ネタバレタグは通常は伏せるが、その語で検索した時だけ先頭に出す。
    const manualTags = visibleCardTagsOf(variant);
    const tags = [
      ...manualTags.filter((tag) => tag.spoiler && (queryMatchesTag(tag) || state.tagFilters.has(tag.key))),
      ...manualTags.filter((tag) => !tag.spoiler)
    ];
    if (!tags.length) return "";
    const shown = tags.slice(0, limit);
    const rest = tags.length - shown.length;
    return `<span class="character-card__tags character-card__tags--inline" aria-label="タグ">${shown.map((tag) => catalogTagHtml(tag, variant, spoilerTagKeyOf(character, variant, tag))).join("")}${rest ? `<button type="button" class="character-card__tags-more" data-show-more-tags aria-label="残り${rest}個のタグを表示">+${rest}</button>` : ""}</span>`;
  }

  function revealSpoilerTag(button) {
    const key = button.dataset.spoilerKey;
    const label = button.dataset.spoilerLabel;
    if (!key || !label) return;
    state.revealedSpoilerTags.add(key);
    button.classList.remove("is-spoiler");
    button.removeAttribute("data-reveal-spoiler-tag");
    button.dataset.tagSearch = label;
    button.title = `${label}で絞り込む`;
    button.setAttribute("aria-pressed", String(state.tagFilters.has(tagInfoOf(label).key)));
    button.textContent = label;
  }

  function closeTagPopover() {
    tagPopover?.remove();
    tagPopover = null;
  }

  function renderActiveTagFilters() {
    if (!activeTagFilters) return;
    if (!state.tagFilters.size) {
      activeTagFilters.hidden = true;
      activeTagFilters.innerHTML = "";
      return;
    }
    const entries = [...state.tagFilters.entries()];
    activeTagFilters.hidden = false;
    activeTagFilters.innerHTML = `<span class="catalog-active-tags__label">タグ絞り込み（すべて一致）</span><span class="catalog-active-tags__list">${entries.map(([key, label]) => `<button type="button" class="catalog-active-tags__item" data-remove-tag-filter="${escapeHtml(key)}" title="${escapeHtml(label)}を条件から外す">${escapeHtml(label)} <i class="fa-solid fa-xmark" aria-hidden="true"></i></button>`).join("")}</span><button type="button" class="catalog-active-tags__clear" data-clear-tag-filters>すべて外す</button>`;
  }

  function toggleCatalogTagFilter(value) {
    const tag = tagInfoOf(value).label;
    if (!tag) return;
    const key = tagInfoOf(tag).key;
    if (state.tagFilters.has(key)) state.tagFilters.delete(key);
    else state.tagFilters.set(key, tag);
    state.cardVariantIndexes.clear();
    renderCards();
  }

  function searchByCatalogTag(value) { toggleCatalogTagFilter(value); }

  function showMoreCatalogTags(trigger, character, variant) {
    const manualTags = visibleCardTagsOf(variant);
    const tags = [
      ...manualTags.filter((tag) => tag.spoiler && (queryMatchesTag(tag) || state.tagFilters.has(tag.key))),
      ...manualTags.filter((tag) => !tag.spoiler)
    ].slice(3);
    if (!tags.length) return;
    closeTagPopover();
    const rect = trigger.getBoundingClientRect();
    tagPopover = document.createElement("div");
    tagPopover.className = "catalog-tag-popover";
    tagPopover.setAttribute("role", "dialog");
    tagPopover.setAttribute("aria-label", "残りのタグ");
    tagPopover.innerHTML = `<strong>ほかのタグ</strong><div>${tags.map((tag) => catalogTagHtml(tag, variant, spoilerTagKeyOf(character, variant, tag))).join("")}</div>`;
    document.body.appendChild(tagPopover);
    const width = tagPopover.offsetWidth;
    tagPopover.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
    tagPopover.style.top = `${Math.max(12, rect.bottom + 8)}px`;
    tagPopover.querySelectorAll("[data-reveal-spoiler-tag]").forEach((button) => button.addEventListener("click", () => revealSpoilerTag(button)));
    tagPopover.querySelectorAll("[data-tag-search]").forEach((button) => button.addEventListener("click", () => {
      closeTagPopover();
      searchByCatalogTag(button.dataset.tagSearch);
    }));
  }
  function locationSortKey(variant) {
    const locations = locationsOf(variant.location);
    const rank = locations.includes("NJMC") ? 0 : locations.includes("エンパイア") ? 1 : 2;
    return `${rank}:${locationLabelsOf(variant).join("、")}`;
  }
  const characterSearchText = (character) => [character.registrationName, character.id, ...character.variants.flatMap((variant) => [variant.name, variant.variant, variant.aka, variant.epithet, variant.catchCopy, variant.system, variant.location, ...locationLabelsOf(variant), variant.sex, variant.keyword, tagSearchTextOf(character, variant), variant.intro, variant.job])].filter(Boolean).join(" ").toLocaleLowerCase("ja");
  const variantSearchText = (character, variant) => [character.registrationName, character.id, variant.name, variant.variant, variant.aka, variant.epithet, variant.catchCopy, variant.system, variant.location, ...locationLabelsOf(variant), variant.sex, variant.keyword, tagSearchTextOf(character, variant), variant.intro, variant.job].filter(Boolean).join(" ").toLocaleLowerCase("ja");
  function yearOf(value) {
    const year = String(value || "").match(/(?:^|\D)(\d{4})(?:\D|$)/)?.[1];
    return year || "";
  }
  const variantMatchesFilters = (variant) =>
    (!state.system || variant.system === state.system) &&
    (!state.location || locationsOf(variant.location).includes(state.location)) &&
    (!state.year || yearOf(variant.debut) === state.year) &&
    (!state.sex || genderCategoryOf(variant.sex) === state.sex);
  function tagsMatchSelectedFilters(character, variants) {
    if (!state.tagFilters.size) return true;
    const available = new Set(variants.flatMap((variant) => [
      ...catalogTagsOf(character, variant),
      ...catalogAffinityTagsOf(variant)
    ].map((tag) => tag.key)));
    return [...state.tagFilters.keys()].every((key) => available.has(key));
  }
  // 「人物ごと」では、同一ユニークIDの姿をまたいで条件を満たせば残す。
  // 「すべて表示」では、ひとつの姿自身が選択済みタグをすべて持つ時だけ残す。
  const characterMatchesTagFilters = (character) => tagsMatchSelectedFilters(character, character.variants);
  const variantMatchesTagFilters = (character, variant) => tagsMatchSelectedFilters(character, [variant]);
  function cardVariantIndexOf(character) {
    const hasSearchTarget = Boolean(String(state.query || "").trim() || state.tagFilters.size);
    const hasFieldFilter = Boolean(state.system || state.location || state.year || state.sex);
    const selectedIndex = state.cardVariantIndexes.get(character.id);
    // ユーザーが切替を押した後は、検索中でもその選択を尊重する。
    if (Number.isInteger(selectedIndex) && character.variants[selectedIndex]) return selectedIndex;
    // 検索・タグ指定中は、代表姿ではなく実際に一致した姿をカードに採用する。
    // 例: 同一人物の「超越」姿だけにタグがあるなら、その姿を一覧に出す。
    if (!hasSearchTarget && !hasFieldFilter) return character.representativeIndex;
    const matchedIndex = character.variants.findIndex((variant) =>
      variantMatchesFilters(variant) &&
      (!state.query || variantSearchText(character, variant).includes(state.query)) &&
      variantMatchesTagFilters(character, variant)
    );
    // 人物ごとのAND条件が別の姿に分散している場合だけ、同じ人物内で
    // まず通常フィルターに一致する姿へ戻す。
    if (matchedIndex >= 0) return matchedIndex;
    const fieldMatchedIndex = character.variants.findIndex(variantMatchesFilters);
    return fieldMatchedIndex >= 0 ? fieldMatchedIndex : character.representativeIndex;
  }
  const cardVariantOf = (character) => character.variants[cardVariantIndexOf(character)] || representativeOf(character);
  const cardNameOf = (character) => cardVariantOf(character).name || character.registrationName;
  const sortVariantOf = (character) => cardVariantOf(character);
  function numericValueOf(value) {
    const match = String(value ?? "").trim().match(/^(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : null;
  }
  function dateValueOf(value) {
    const match = String(value ?? "").match(/(\d{4})(?:\D+(\d{1,2}))?(?:\D+(\d{1,2}))?/);
    if (!match) return null;
    const year = Number(match[1]), month = Number(match[2] || 1), day = Number(match[3] || 1);
    return Number.isFinite(year) && month >= 1 && month <= 12 && day >= 1 && day <= 31 ? Date.UTC(year, month - 1, day) : null;
  }
  function compareOptionalNumbers(left, right, direction = 1) {
    const leftMissing = left === null || !Number.isFinite(left);
    const rightMissing = right === null || !Number.isFinite(right);
    if (leftMissing || rightMissing) return leftMissing === rightMissing ? 0 : leftMissing ? 1 : -1;
    return (left - right) * direction;
  }
  function numericIdOf(character) {
    const value = numericValueOf(character.id);
    return value === null ? Number.MAX_SAFE_INTEGER : value;
  }
  const nameCollator = new Intl.Collator("ja", { numeric: true, sensitivity: "base" });
  const HAIR_COLOR_ORDER = ["白", "銀", "灰", "黒", "禿", "茶", "赤", "橙", "黄", "金", "緑", "青", "水", "紫", "桃"];
  function hairColorOf(variant) { return String(variant.hair || variant.hairColor || "").trim(); }
  function hairColorVisualOf(value) {
    const hair = String(value || "");
    const colors = { 白: "#f1f5ff", 銀: "#c9d2dc", 灰: "#8793a1", 黒: "#344058", 禿: "#d8a47e", 茶: "#aa704e", 赤: "#e36e75", 橙: "#ee9b55", 黄: "#efd166", 金: "#e4bf59", 緑: "#7fbd80", 青: "#73aee8", 水: "#71d1dd", 紫: "#b28cdd", 桃: "#f397bc" };
    const key = HAIR_COLOR_ORDER.find((color) => hair.includes(color));
    return key ? colors[key] : "";
  }
  function hairSortKey(variant) {
    const hair = hairColorOf(variant);
    const index = HAIR_COLOR_ORDER.findIndex((color) => hair.includes(color));
    return `${String(index < 0 ? 99 : index).padStart(2, "0")}:${hair}`;
  }
  function compareOptionalText(left, right) {
    const a = String(left ?? "").trim(), b = String(right ?? "").trim();
    if (!a || !b) return !a === !b ? 0 : !a ? 1 : -1;
    return nameCollator.compare(a, b);
  }
  function compareCatalogItems(left, right) {
      const a = left.character, b = right.character;
      const aVariant = left.variant, bVariant = right.variant;
      const idAscending = numericIdOf(a) - numericIdOf(b) || nameCollator.compare(a.id, b.id) || nameCollator.compare(aVariant.name || "", bVariant.name || "");
      if (state.sort === "id-desc") return -idAscending;
      if (state.sort === "id-asc") return idAscending;
      if (state.sort === "debut-asc") return compareOptionalNumbers(dateValueOf(aVariant.debut), dateValueOf(bVariant.debut), 1) || idAscending;
      if (state.sort === "debut-desc") return compareOptionalNumbers(dateValueOf(aVariant.debut), dateValueOf(bVariant.debut), -1) || idAscending;
      if (state.sort === "age-asc") return compareOptionalNumbers(numericValueOf(aVariant.age), numericValueOf(bVariant.age), 1) || idAscending;
      if (state.sort === "age-desc") return compareOptionalNumbers(numericValueOf(aVariant.age), numericValueOf(bVariant.age), -1) || idAscending;
      if (state.sort === "height-asc") return compareOptionalNumbers(numericValueOf(aVariant.height), numericValueOf(bVariant.height), 1) || idAscending;
      if (state.sort === "height-desc") return compareOptionalNumbers(numericValueOf(aVariant.height), numericValueOf(bVariant.height), -1) || idAscending;
      if (state.sort === "name-asc") return nameCollator.compare(aVariant.name || a.registrationName, bVariant.name || b.registrationName) || idAscending;
      if (state.sort === "system-asc") return compareOptionalText(aVariant.system, bVariant.system) || idAscending;
      if (state.sort === "location-asc") return compareOptionalText(locationSortKey(aVariant), locationSortKey(bVariant)) || idAscending;
      if (state.sort === "sex-asc") return compareOptionalText(genderCategoryOf(aVariant.sex), genderCategoryOf(bVariant.sex)) || idAscending;
      if (state.sort === "alignment-asc") return compareOptionalText(aVariant.alignment, bVariant.alignment) || idAscending;
      if (state.sort === "job-asc") return compareOptionalText(aVariant.job, bVariant.job) || idAscending;
      if (state.sort === "hair-asc") return compareOptionalText(hairSortKey(aVariant), hairSortKey(bVariant)) || idAscending;
      if (state.sort === "variant-asc") return compareOptionalText(aVariant.variant, bVariant.variant) || idAscending;
      return -idAscending;
  }
  function filteredCatalogItems() {
    const grouped = state.characters
      .filter((character) => (!state.query || characterSearchText(character).includes(state.query)) && character.variants.some(variantMatchesFilters) && characterMatchesTagFilters(character))
      .map((character) => {
        const variantIndex = cardVariantIndexOf(character);
        return { character, variantIndex, variant: character.variants[variantIndex] || representativeOf(character), grouped: true };
      });
    if (state.catalogMode === "unique") return grouped.sort(compareCatalogItems);
    return state.characters.flatMap((character) => character.variants.map((variant, variantIndex) => ({ character, variant, variantIndex, grouped: false })))
      .filter((item) => (!state.query || variantSearchText(item.character, item.variant).includes(state.query)) && variantMatchesFilters(item.variant) && variantMatchesTagFilters(item.character, item.variant))
      .sort(compareCatalogItems);
  }

  function renderCards() {
    renderActiveTagFilters();
    const items = filteredCatalogItems();
    count.textContent = `${items.length} ${state.catalogMode === "unique" ? "characters" : "variants"}`;
    grid.dataset.view = state.view;
    if (!items.length) { grid.innerHTML = '<p class="catalog-empty">条件に合うキャラクターが見つかりませんでした。</p>'; renderStatistics(items); return; }
    grid.innerHTML = items.map(({ character, variantIndex, variant, grouped }) => {
      const imageCandidates = catalogImageCandidatesOf(character, variant), image = imageCandidates[0] || "";
      const displayName = variant.name || character.registrationName;
      const cardIcon = cardIconOf(character, variant);
      const bodyImage = cardBodyImageCandidatesOf(variant)[0] || "";
      // 左右が同じ元ファイルなら同一URLを使う。画像は二重に描画しても、通信は一回に寄せられる。
      const sharedPortraitSource = sameImageSource(cardIcon || image, bodyImage);
      const visualImage = sharedPortraitSource ? bodyImage : image;
      const visualCandidates = sharedPortraitSource ? [bodyImage] : imageCandidates;
      // 左のアイコンと元画像が同じでも、右側は全身立ち絵の表示領域として常に使う。
      const sidePortrait = bodyImage;
      const systems = grouped ? [...new Set(character.variants.map((item) => item.system).filter(Boolean))] : [variant.system].filter(Boolean);
      const systemLabels = (systems.length ? systems : ["OTHER"]).map((system) => system === "OTHER"
        ? `<span class="is-current" style="--label-system-color:${escapeHtml(systemColorOf(system))}">OTHER</span>`
        : `<span class="character-card__system ${system === variant.system ? "is-current" : "is-other"}" data-system-filter="${escapeHtml(system)}" role="button" tabindex="0" style="--label-system-color:${escapeHtml(systemColorOf(system))}" title="${escapeHtml(system)}で絞り込む">${escapeHtml(system)}</span>`).join("");
      const nextIndex = (variantIndex + 1) % character.variants.length;
      const nextVariant = character.variants[nextIndex] || {};
      const sortIndicator = sortIndicatorOf(variant);
      const cycleButton = grouped && character.variants.length > 1 ? `<button class="character-card__variant-cycle" type="button" data-cycle-variant aria-label="次の姿「${escapeHtml(nextVariant.variant || nextVariant.name || nextVariant.system || `姿${nextIndex + 1}`)}」へ切り替える" title="次の姿へ切替"><i class="fa-solid fa-repeat" aria-hidden="true"></i><span>${variantIndex + 1}/${character.variants.length}</span></button>` : "";
      const adjustButton = state.portraitAdjustMode ? `<button class="character-card__portrait-adjust" type="button" data-adjust-portrait aria-label="${escapeHtml(displayName)}の立ち絵を調整" title="立ち絵調整"><i class="fa-solid fa-sliders" aria-hidden="true"></i></button>` : "";
      return `<article class="character-card${grouped && character.variants.length > 1 ? " has-variants" : ""}" tabindex="0" data-character-id="${escapeHtml(character.id)}" data-card-variant-index="${variantIndex}" aria-label="${escapeHtml(displayName)}を開く" title="${escapeHtml(displayName)}" style="--character-system-color:${escapeHtml(systemColorOf(variant.system))}">
        <div class="character-card__visual">${visualImage ? `<img${sharedPortraitSource ? ' class="is-body-preview"' : ""} src="${escapeHtml(visualImage)}" alt="${escapeHtml(displayName)}" loading="lazy" decoding="async" fetchpriority="low" data-image-candidates="${escapeHtml(JSON.stringify(visualCandidates))}" style="--card-icon-offset-y:${escapeHtml(cardIconOffsetYOf(variant))}px;--card-icon-offset-x:${escapeHtml(effectiveCardIconOffsetXOf(variant))}px">` : `<span class="character-card__initial" aria-hidden="true">${escapeHtml(displayName.slice(0, 1))}</span>`}</div>
        ${sidePortrait ? `<div class="character-card__portrait-window" aria-hidden="true"><img src="${escapeHtml(sidePortrait)}" alt="" loading="lazy" decoding="async" fetchpriority="low" style="--card-portrait-list-scale:${escapeHtml(listPortraitScaleFor(null, portraitScaleOf(variant)).toFixed(3))};--card-portrait-list-offset-y:${escapeHtml(listPortraitOffsetYOf(variant).toFixed(2))}px;--card-portrait-list-offset-x:${escapeHtml((portraitOffsetXOf(variant) * 0.25).toFixed(2))}px"></div>` : ""}
        <div class="character-card__body"><p class="character-card__systems">${systemLabels}${sortIndicator}${compactCatalogTagsHtml(character, variant)}</p>${cardTaglineOf(variant) ? `<p class="character-card__tagline">${yutorizeRubyHtml(cardTaglineOf(variant))}</p>` : ""}<h2>${escapeHtml(displayName)}</h2><p class="character-card__intro">${cardSummaryHtmlOf(variant)}</p></div>
        <span class="character-card__id" aria-hidden="true">#${escapeHtml(String(character.id).padStart(3, "0"))}</span>
        ${cycleButton}
        ${adjustButton}
      </article>`;
    }).join("");
    renderStatistics(items);
  }

  function sortIndicatorOf(variant) {
    const values = {
      "debut-asc": ["初登場", variant.debut], "debut-desc": ["初登場", variant.debut],
      "age-asc": ["年齢", ageLabelOf(variant.age)], "age-desc": ["年齢", ageLabelOf(variant.age)],
      "height-asc": ["身長", variant.height], "height-desc": ["身長", variant.height],
      "system-asc": ["システム", variant.system], "location-asc": ["場所", locationLabelsOf(variant).join(" / ")],
      "sex-asc": ["性別", String(variant.sex || "？")], "alignment-asc": ["アライメント", variant.alignment],
      "job-asc": ["ジョブ", variant.job], "hair-asc": ["髪色", hairColorOf(variant)], "variant-asc": ["姿", variant.variant]
    };
    const entry = values[state.sort];
    return entry?.[1] ? `<span class="character-card__sort-indicator">${escapeHtml(`${entry[0]}: ${entry[1]}`)}</span>` : "";
  }

  function frequencyEntries(values, limit = 10) {
    const counts = new Map();
    values.filter(Boolean).forEach((value) => counts.set(String(value), (counts.get(String(value)) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || nameCollator.compare(a[0], b[0])).slice(0, limit);
  }
  function statBars(title, entries, emptyText = "データなし", colorOf = () => "", scrollable = false) {
    if (!entries.length) return `<section class="catalog-stat-card"><h3>${escapeHtml(title)}</h3><p class="catalog-stat-empty">${emptyText}</p></section>`;
    const max = Math.max(...entries.map(([, value]) => value), 1);
    return `<section class="catalog-stat-card${scrollable ? " catalog-stat-card--scroll" : ""}"><h3>${escapeHtml(title)}</h3><div class="catalog-stat-bars">${entries.map(([label, value], index) => { const color = colorOf(label); return `<div class="catalog-stat-bar"><span title="${escapeHtml(label)}">${escapeHtml(label)}</span><i><b style="--bar-width:${(value / max * 100).toFixed(2)}%;${color ? `--bar-color:${escapeHtml(color)};` : ""}--bar-delay:${Math.min(index, 12) * 38}ms"></b></i><strong>${value}</strong></div>`; }).join("")}</div></section>`;
  }
  function numberBuckets(values, size, suffix) {
    const numbers = values.map(numericValueOf).filter((value) => value !== null);
    if (!numbers.length) return [];
    const min = Math.floor(Math.min(...numbers) / size) * size, max = Math.floor(Math.max(...numbers) / size) * size;
    const buckets = new Map();
    for (let start = min; start <= max; start += size) buckets.set(start, 0);
    numbers.forEach((value) => { const start = Math.floor(value / size) * size; buckets.set(start, (buckets.get(start) || 0) + 1); });
    return [...buckets.entries()].filter(([, count]) => count > 0).map(([start, count]) => [`${start}–${start + size - 1}${suffix}`, count]);
  }
  function genderDonut(variants) {
    const labels = { male: "男性", female: "女性", unknown: "？・その他" }, colors = { male: "#79b9ff", female: "#ff9bb9", unknown: "#b6c1d2" };
    const entries = ["male", "female", "unknown"].map((key) => [labels[key], variants.filter((variant) => genderCategoryOf(variant.sex) === key).length, colors[key]]).filter(([, value]) => value);
    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    if (!total) return statBars("性別", []);
    let position = 0;
    const stops = entries.map(([, value, color]) => { const next = position + value / total * 100; const stop = `${color} ${position.toFixed(2)}% ${next.toFixed(2)}%`; position = next; return stop; });
    return `<section class="catalog-stat-card catalog-stat-card--gender"><h3>性別</h3><div class="catalog-stat-donut" style="--stat-donut:conic-gradient(${stops.join(",")})"><strong>${total}</strong><span>人</span></div><ul>${entries.map(([label, value, color]) => `<li><i style="--legend-color:${color}"></i>${label}<b>${value}</b></li>`).join("")}</ul></section>`;
  }
  function alignmentColorOf(value) {
    const text = String(value || "");
    if (text.startsWith("秩序")) return "#74b7ff";
    if (text.startsWith("中立")) return "#a5cf83";
    if (text.startsWith("混沌")) return "#ef8d94";
    return "#9aabca";
  }
  function normalizedJobToken(value, keepClass = state.jobDetailMode) {
    const token = String(value || "").trim();
    if (!token) return "";
    return !keepClass && /^UGNエージェント[Ａ-ＺA-Z]+$/.test(token) ? "UGNエージェント" : token;
  }
  function jobTokensOf(value) {
    return String(value || "").split(/[・、,，/／\n\r]+/).map((token) => normalizedJobToken(token)).filter(Boolean);
  }
  function jobCombinationsOf(value) {
    return String(value || "").split(/[、,，\n\r]+/).flatMap((group) => {
      const tokens = group.split(/[・/／]+/).map((token) => normalizedJobToken(token)).filter(Boolean);
      return tokens.length >= 2 ? [tokens.sort((a, b) => nameCollator.compare(a, b)).join(" / ")] : [];
    });
  }
  function jobEntriesWithSystem(variants, extractor) {
    const counts = new Map();
    variants.forEach((variant) => extractor(variant.job).forEach((label) => {
      if (!counts.has(label)) counts.set(label, { total: 0, systems: new Map() });
      const entry = counts.get(label);
      entry.total += 1;
      const system = String(variant.system || "");
      entry.systems.set(system, (entry.systems.get(system) || 0) + 1);
    }));
    const entries = [...counts.entries()].sort(([leftLabel, left], [rightLabel, right]) => right.total - left.total || nameCollator.compare(leftLabel, rightLabel));
    const colors = new Map(entries.map(([label, entry]) => {
      const dominantSystem = [...entry.systems.entries()].sort((a, b) => b[1] - a[1] || nameCollator.compare(a[0], b[0]))[0]?.[0];
      return [label, systemColorOf(dominantSystem)];
    }));
    return { entries: entries.map(([label, entry]) => [label, entry.total]), colors };
  }
  function debutYearEntries(variants) {
    return frequencyEntries(variants.map((variant) => yearOf(variant.debut)), Infinity)
      .sort((a, b) => Number(a[0]) - Number(b[0]) || nameCollator.compare(a[0], b[0]));
  }
  function renderStatistics(items) {
    if (!state.statsOpen) { statistics.hidden = true; return; }
    const variants = items.map((item) => item.variant);
    statistics.hidden = false;
    const jobModeLabel = state.jobDetailMode ? "ABCも分ける" : "区分をまとめる";
    const jobs = jobEntriesWithSystem(variants, jobTokensOf);
    const jobCombinations = jobEntriesWithSystem(variants, jobCombinationsOf);
    statistics.innerHTML = `<header><div><p>現在の表示を集計</p><h2>キャラクター統計 <small>${variants.length}件</small></h2></div><button type="button" data-close-stats aria-label="統計を閉じる"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></header><div class="catalog-stat-options"><span>UGNエージェントの区分</span><button type="button" data-toggle-job-detail aria-pressed="${state.jobDetailMode}">${jobModeLabel}</button></div><div class="catalog-stat-grid">${statBars("アライメント", frequencyEntries(variants.map((variant) => variant.alignment), 9), "データなし", alignmentColorOf)}${genderDonut(variants)}${statBars("システム", frequencyEntries(variants.map((variant) => variant.system), Infinity), "データなし", systemColorOf, true)}${statBars("ジョブ", jobs.entries, "データなし", (label) => jobs.colors.get(label), true)}${statBars("ジョブの組合せ", jobCombinations.entries, "組合せデータなし", (label) => jobCombinations.colors.get(label), true)}${statBars("髪色", frequencyEntries(variants.map(hairColorOf), 8), "データなし", hairColorVisualOf)}${statBars("初登場年", debutYearEntries(variants), "データなし")}${statBars("年齢の分布", numberBuckets(variants.map((variant) => variant.age), 10, "歳"), "年齢を数値として読めるキャラがいません")}${statBars("身長の分布", numberBuckets(variants.map((variant) => variant.height).filter((value) => numericValueOf(value) > 0), 10, "cm"), "身長を数値として読めるキャラがいません")}</div>`;
  }

  function renderSystemFilter() {
    const systems = [...new Set(state.characters.flatMap((character) => character.variants.map((variant) => variant.system)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));
    systemFilter.innerHTML = '<option value="">すべて</option>' + systems.map((system) => `<option value="${escapeHtml(system)}">${escapeHtml(system)}</option>`).join("");
    const locations = [...new Set(state.characters.flatMap((character) => character.variants.flatMap((variant) => locationsOf(variant.location))))].sort((a, b) => {
      const rank = (location) => location === "NJMC" ? 0 : location === "エンパイア" ? 1 : 2;
      return rank(a) - rank(b) || locationLabelOf(a).localeCompare(locationLabelOf(b), "ja");
    });
    locationFilter.innerHTML = '<option value="">すべて</option>' + locations.map((location) => `<option value="${escapeHtml(location)}">${escapeHtml(locationLabelOf(location))}</option>`).join("");
    const years = [...new Set(state.characters.flatMap((character) => character.variants.map((variant) => yearOf(variant.debut))).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
    yearFilter.innerHTML = '<option value="">すべて</option>' + years.map((year) => `<option value="${escapeHtml(year)}">${escapeHtml(year)}年</option>`).join("");
    sexFilter.innerHTML = '<option value="">すべて</option><option value="male">男性</option><option value="female">女性</option><option value="unknown">？・その他</option>';
  }

  function renderMergeSelect() {
    const options = state.characters.flatMap((character) => character.variants
      .map((variant, variantIndex) => ({ character, variant, variantIndex }))
      .filter(({ variant }) => variant.hasDifference || String(variant.differenceJson || "").trim()))
      .sort((left, right) => numericIdOf(left.character) - numericIdOf(right.character) || nameCollator.compare(left.variant.name || "", right.variant.name || ""));
    mergeSelect.innerHTML = '<option value="">手入力する</option>' + options.map(({ character, variant, variantIndex }) => {
      const label = `#${String(character.id).padStart(3, "0")}　${variant.name || character.registrationName}${variant.variant ? `（${variant.variant}）` : ""}`;
      return `<option value="${escapeHtml(`${character.id}:${variantIndex}`)}">${escapeHtml(label)}</option>`;
    }).join("");
  }

  function selectedMergeVariant(key) {
    const separator = String(key || "").lastIndexOf(":");
    if (separator < 0) return null;
    const character = state.characters.find((item) => item.id === key.slice(0, separator));
    const variant = character?.variants[Number(key.slice(separator + 1))];
    return character && variant ? { character, variant, variantIndex: Number(key.slice(separator + 1)) } : null;
  }

  function activePortraitAdjustment() {
    const active = state.activePortraitAdjustment;
    if (!active) return null;
    const character = state.characters.find((item) => item.id === active.characterId);
    const variant = character?.variants[active.variantIndex];
    return character && variant ? { character, variant, variantIndex: active.variantIndex } : null;
  }

  function detailPreviewGeometry() {
    const actualVisual = detail.querySelector(".character-detail__visual");
    const actualRect = actualVisual?.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    let detailWidth, detailHeight;

    // 詳細を開いている時は、計算値でなく現物の枠をそのまま使う。
    if (actualRect?.width > 1 && actualRect?.height > 1) {
      detailWidth = actualRect.width;
      detailHeight = actualRect.height;
    } else if (window.matchMedia("(max-width: 900px)").matches) {
      // モバイル詳細は一列レイアウトで、立ち絵枠だけが 38dvh になる。
      detailWidth = Math.min(1120, Math.max(1, viewportWidth - 28));
      detailHeight = Math.min(viewportHeight * 0.38, 330);
    } else {
      const dialogWidth = Math.min(1120, Math.max(1, viewportWidth - 28));
      detailWidth = Math.max(380, dialogWidth * 0.47);
      detailHeight = Math.min(820, viewportHeight * 0.9);
    }

    const previewWidth = 128;
    const previewHeight = Math.max(42, Math.min(220, Math.round(previewWidth * detailHeight / detailWidth)));
    return {
      previewWidth,
      previewHeight,
      offsetScaleX: previewWidth / detailWidth,
      offsetScaleY: previewHeight / detailHeight,
    };
  }

  function listPreviewGeometry() {
    const active = activePortraitAdjustment();
    const card = active && [...grid.querySelectorAll("[data-character-id]")].find((item) =>
      item.dataset.characterId === active.character.id && Number(item.dataset.cardVariantIndex) === active.variantIndex
    );
    const windowRect = card?.querySelector(".character-card__portrait-window")?.getBoundingClientRect();
    // カードがフィルタで消えている時だけ、一覧の標準枠へフォールバックする。
    return {
      width: Math.max(1, Math.round(windowRect?.width || (window.matchMedia("(max-width: 640px)").matches ? 80 : 128))),
      height: Math.max(1, Math.round(windowRect?.height || (window.matchMedia("(max-width: 640px)").matches ? 72 : 96))),
    };
  }

  function setPortraitControllerVariables(scale, offsetY, offsetX, listOffsetY = 0, iconOffsetY = 0, iconOffsetX = 0, catalogIconOffsetX = 0) {
    const geometry = detailPreviewGeometry();
    const listGeometry = listPreviewGeometry();
    portraitAdjustController.style.setProperty("--detail-portrait-scale", scale);
    portraitAdjustController.style.setProperty("--list-portrait-scale", scale);
    // 詳細枠は画面サイズで縦横比が変わるため、プレビューも同じ比率・実寸換算にする。
    portraitAdjustController.style.setProperty("--controller-detail-preview-width", `${geometry.previewWidth}px`);
    portraitAdjustController.style.setProperty("--controller-detail-preview-height", `${geometry.previewHeight}px`);
    // 一覧右側はカードの実寸を採用する。ここが 84px 固定だったため、
    // 実カード（96px）とプレビューで縦の切れ方がずれていた。
    portraitAdjustController.style.setProperty("--controller-list-preview-width", `${listGeometry.width}px`);
    portraitAdjustController.style.setProperty("--controller-list-preview-height", `${listGeometry.height}px`);
    portraitAdjustController.style.setProperty("--controller-detail-offset-y", `${(offsetY * geometry.offsetScaleY).toFixed(2)}px`);
    portraitAdjustController.style.setProperty("--controller-detail-offset-x", `${(offsetX * geometry.offsetScaleX).toFixed(2)}px`);
    // 一覧は上半身トリミング用の独立した縦位置。詳細の上下値は混ぜない。
    portraitAdjustController.style.setProperty("--list-portrait-offset-y", `${listOffsetY}px`);
    portraitAdjustController.style.setProperty("--list-portrait-offset-x", `${(offsetX * 0.25).toFixed(2)}px`);
    portraitAdjustController.style.setProperty("--controller-icon-offset-y", `${iconOffsetY}px`);
    portraitAdjustController.style.setProperty("--controller-icon-offset-x", `${iconOffsetX + catalogIconOffsetX}px`);
  }

  function renderPortraitAdjustController() {
    const active = activePortraitAdjustment();
    if (!state.portraitAdjustMode || !active) {
      portraitAdjustController.hidden = true;
      return;
    }
    const { character, variant, variantIndex } = active;
    const scale = portraitScaleOf(variant), offsetY = portraitOffsetYOf(variant), offsetX = portraitOffsetXOf(variant), listOffsetY = listPortraitOffsetYOf(variant), iconOffsetY = cardIconOffsetYOf(variant), iconOffsetX = cardIconOffsetXOf(variant);
    // 詳細と同じURLを使い、ブラウザキャッシュも共有する。
    const image = detailImageOf(variant) || "";
    portraitAdjustController.hidden = false;
    const catalogIconOffsetX = catalogIconOffsetXOf(variant);
    setPortraitControllerVariables(scale, offsetY, offsetX, listOffsetY, iconOffsetY, iconOffsetX, catalogIconOffsetX);
    const icon = cardIconOf(character, variant) || image;
    portraitAdjustController.innerHTML = `<header><strong>#${escapeHtml(String(character.id).padStart(3, "0"))} ${escapeHtml(variant.name || character.registrationName)}</strong><button type="button" data-close-portrait-adjustment aria-label="閉じる"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></header><p>シートへ貼る値：<code data-controller-adjustment-value>${scale.toFixed(2)},${offsetY},${offsetX},${listOffsetY},${iconOffsetY},${iconOffsetX}</code></p><div class="portrait-adjust-controller__previews"><figure><figcaption>詳細（共通値）</figcaption><div class="portrait-adjust-controller__detail-preview">${image ? `<img src="${escapeHtml(image)}" alt="">` : ""}</div></figure><figure><figcaption>一覧右側</figcaption><div class="portrait-adjust-controller__list-preview">${image ? `<img src="${escapeHtml(image)}" alt="">` : ""}</div></figure><figure><figcaption>一覧左アイコン</figcaption><div class="portrait-adjust-controller__icon-preview">${icon ? `<img src="${escapeHtml(icon)}" alt="">` : ""}</div></figure></div><div class="portrait-adjust-controller__controls"><label><span>倍率 <output data-controller-scale-output>${scale.toFixed(2)}</output></span><input type="range" min="0.8" max="1.3" step="0.01" value="${scale}" data-controller-scale><input type="number" min="0.8" max="1.3" step="0.01" value="${scale}" data-controller-scale></label><label><span>共通上下 <output data-controller-offset-y-output>${offsetY}px</output></span><input type="range" min="-180" max="180" step="1" value="${offsetY}" data-controller-offset-y><input type="number" min="-180" max="180" step="1" value="${offsetY}" data-controller-offset-y></label><label><span>左右 <output data-controller-offset-x-output>${offsetX}px</output></span><input type="range" min="-180" max="180" step="1" value="${offsetX}" data-controller-offset-x><input type="number" min="-180" max="180" step="1" value="${offsetX}" data-controller-offset-x></label><label><span>一覧上下 <output data-controller-list-offset-y-output>${listOffsetY}px</output></span><input type="range" min="-180" max="180" step="1" value="${listOffsetY}" data-controller-list-offset-y><input type="number" min="-180" max="180" step="1" value="${listOffsetY}" data-controller-list-offset-y></label><label><span>左アイコン上下 <output data-controller-icon-offset-y-output>${iconOffsetY}px</output></span><input type="range" min="-96" max="96" step="1" value="${iconOffsetY}" data-controller-icon-offset-y><input type="number" min="-96" max="96" step="1" value="${iconOffsetY}" data-controller-icon-offset-y></label><label><span>左アイコン左右 <output data-controller-icon-offset-x-output>${iconOffsetX}px</output></span><input type="range" min="-96" max="96" step="1" value="${iconOffsetX}" data-controller-icon-offset-x><input type="number" min="-96" max="96" step="1" value="${iconOffsetX}" data-controller-icon-offset-x></label></div><button class="portrait-adjust-controller__copy" type="button" data-copy-controller-adjustment><i class="fa-regular fa-copy" aria-hidden="true"></i>値をコピー</button>`;
    portraitAdjustController.querySelectorAll("[data-controller-scale]").forEach((control) => { control.max = "2"; control.setAttribute("list", "portrait-scale-mark"); control.title = "標準上限は 1.30。2.00 まで拡大できます。"; });
  }

  function applyPortraitAdjustment(scale, offsetY, offsetX, listOffsetY, iconOffsetY, iconOffsetX) {
    const active = activePortraitAdjustment();
    if (!active) return;
    const { character, variant, variantIndex } = active;
    variant.portraitScale = scale;
    variant.portraitOffsetY = offsetY;
    variant.portraitOffsetX = offsetX;
    variant.listPortraitOffsetY = listOffsetY;
    variant.cardIconOffsetY = iconOffsetY;
    variant.cardIconOffsetX = iconOffsetX;
    setPortraitControllerVariables(scale, offsetY, offsetX, listOffsetY, iconOffsetY, iconOffsetX, catalogIconOffsetXOf(variant));
    portraitAdjustController.querySelectorAll("[data-controller-scale]").forEach((control) => { control.value = String(scale); });
    portraitAdjustController.querySelectorAll("[data-controller-offset-y]").forEach((control) => { control.value = String(offsetY); });
    portraitAdjustController.querySelectorAll("[data-controller-offset-x]").forEach((control) => { control.value = String(offsetX); });
    portraitAdjustController.querySelectorAll("[data-controller-list-offset-y]").forEach((control) => { control.value = String(listOffsetY); });
    portraitAdjustController.querySelectorAll("[data-controller-icon-offset-y]").forEach((control) => { control.value = String(iconOffsetY); });
    portraitAdjustController.querySelectorAll("[data-controller-icon-offset-x]").forEach((control) => { control.value = String(iconOffsetX); });
    portraitAdjustController.querySelector("[data-controller-scale-output]").textContent = scale.toFixed(2);
    portraitAdjustController.querySelector("[data-controller-offset-y-output]").textContent = `${offsetY}px`;
    portraitAdjustController.querySelector("[data-controller-offset-x-output]").textContent = `${offsetX}px`;
    portraitAdjustController.querySelector("[data-controller-list-offset-y-output]").textContent = `${listOffsetY}px`;
    portraitAdjustController.querySelector("[data-controller-adjustment-value]").textContent = `${scale.toFixed(2)},${offsetY},${offsetX},${listOffsetY},${iconOffsetY},${iconOffsetX}`;
    [...grid.querySelectorAll("[data-character-id]")].filter((card) => card.dataset.characterId === character.id && Number(card.dataset.cardVariantIndex) === variantIndex).forEach((card) => {
      const icon = card.querySelector(".character-card__visual img");
      if (icon) {
        icon.style.setProperty("--card-icon-offset-y", `${iconOffsetY}px`);
        icon.style.setProperty("--card-icon-offset-x", `${effectiveCardIconOffsetXOf(variant)}px`);
      }
      const image = card.querySelector(".character-card__portrait-window img");
      if (!image) return;
      image.style.setProperty("--card-portrait-list-scale", listPortraitScaleFor(image, scale).toFixed(3));
      image.style.setProperty("--card-portrait-list-offset-y", `${listOffsetY}px`);
      image.style.setProperty("--card-portrait-list-offset-x", `${(offsetX * 0.25).toFixed(2)}px`);
    });
    if (state.selectedId === character.id && state.variantIndex === variantIndex) {
      detail.style.setProperty("--detail-portrait-scale", scale);
      detail.style.setProperty("--detail-portrait-offset-y", `${offsetY}px`);
      detail.style.setProperty("--detail-portrait-offset-x", `${offsetX}px`);
    }
  }

  // 読みは「日本語 / Romanization」を一組として見せる。別名・本名などを
  // ||...|| に入れた場合は、名鑑本文と同じネタバレ開示扱いにする。
  function detailReadingFact(value) {
    const lines = String(value ?? "").replace(/\r\n?/g, "\n").split("\n").map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return "";
    const lineHtml = lines.map((line) => {
      const spoilerMatch = line.match(/^\|\|([\s\S]+)\|\|$/);
      const content = (spoilerMatch ? spoilerMatch[1] : line).trim();
      const parts = content.split(/\s*\/\s*/, 2);
      const hasRomanization = parts.length === 2 && /^[A-Za-z0-9][A-Za-z0-9 .’'\-]*$/.test(parts[1]);
      const reading = hasRomanization
        ? `<span class="detail-reading__name">${escapeHtml(parts[0])}</span><span class="detail-reading__roman">${escapeHtml(parts[1])}</span>`
        : `<span class="detail-reading__name">${escapeHtml(content)}</span>`;
      const item = `<span class="detail-reading__item">${reading}</span>`;
      return spoilerMatch
        ? `<span class="spoiler-text detail-reading__spoiler" role="button" tabindex="0" aria-label="秘匿された読み・別名を表示">${item}</span>`
        : item;
    }).join("");
    return `<div class="detail-fact detail-fact--reading"><dt>読み・別名</dt><dd><div class="detail-reading">${lineHtml}</div></dd></div>`;
  }

  // 詳細名のルビは、公開されている「読み」だけを使う。秘匿の本名・別名は
  // ここで拾わず、読み・別名欄を開いた時だけ確認できるようにする。
  function publicKanaReadingOf(value) {
    const line = String(value ?? "").replace(/\r\n?/g, "\n").split("\n")
      .map((item) => item.trim())
      .find((item) => item && !/^(?:\|\|[\s\S]*\|\||%%[\s\S]*%%|~~[\s\S]*~~)$/.test(item));
    if (!line) return "";
    const reading = line.split(/\s*\/\s*/, 1)[0].trim();
    return /[ぁ-ゖァ-ヺー]/.test(reading) ? reading : "";
  }

  function detailNameHtml(name, readingValue) {
    const displayName = String(name || "").trim();
    const reading = publicKanaReadingOf(readingValue);
    if (reading && /[\u3400-\u9fff々〆ヶ]/.test(displayName)) {
      return `<ruby class="detail-name-ruby">${escapeHtml(displayName)}<rt>${escapeHtml(reading)}</rt></ruby>`;
    }
    return escapeHtml(displayName);
  }

  function detailFact(label, value) {
    if (value === undefined || value === null || value === "") return "";
    if (label === "アライメント") {
      const alignment = String(value).trim();
      const tone = alignment.startsWith("秩序") ? "lawful" : alignment.startsWith("中立") ? "neutral" : alignment.startsWith("混沌") ? "chaotic" : "other";
      const morality = alignment.includes("善") ? "good" : alignment.includes("悪") ? "evil" : "moral-neutral";
      return `<div class="detail-fact"><dt>${escapeHtml(label)}</dt><dd><span class="alignment-badge alignment-badge--${tone} alignment-badge--${morality}">${escapeHtml(value)}</span></dd></div>`;
    }
    return `<div class="detail-fact"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
  }
  function detailFactGroup(title, icon, entries, extraClass = "") {
    const facts = entries.map(([label, value]) => label === "読み" ? detailReadingFact(value) : detailFact(label, value)).join("");
    return facts ? `<section class="detail-fact-group ${extraClass}"><h3><i class="${icon}" aria-hidden="true"></i>${escapeHtml(title)}</h3><dl>${facts}</dl></section>` : "";
  }
  function detailAction(url, icon, label) {
    const href = safeUrl(url);
    return href ? `<a class="detail-action" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"><i class="${icon}" aria-hidden="true"></i>${escapeHtml(label)}</a>` : "";
  }
  const richSection = (title, value, className = "") => {
    const content = withoutAccidentalDuplicate(value);
    return content ? `<section class="detail-section ${className}"><h3>${escapeHtml(title)}</h3><div class="detail-richtext">${renderMarkdown(content)}</div></section>` : "";
  };
  const keywordSection = (value) => {
    const keywords = String(value || "").split(/[、,，\n]/).map((item) => item.trim()).filter(Boolean);
    return keywords.length ? `<section class="detail-section detail-section--keywords"><h3>性格Keyword</h3><div class="detail-keywords">${keywords.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></section>` : "";
  };
  const achievementValueOf = (value) => {
    const score = Number(String(value || "").trim());
    return Number.isInteger(score) && score >= 1 && score <= 6 ? score : null;
  };
  const reviewSection = (title, value, notice, className = "") => {
    const content = withoutAccidentalDuplicate(value);
    if (!content) return "";
    return `<section class="detail-section detail-review ${className}"><h3>${escapeHtml(title)}</h3>${notice ? `<p class="detail-review__notice"><i class="fa-solid fa-circle-info" aria-hidden="true"></i>${escapeHtml(notice)}</p>` : ""}<div class="detail-richtext">${renderMarkdown(content)}</div></section>`;
  };
  const commentEntriesSection = (variant) => {
    const entries = Array.isArray(variant.commentEntries) ? variant.commentEntries : [];
    if (!entries.length) return "";
    return `<section class="detail-section detail-comment-entries"><h3>コメント</h3><div>${entries.map((entry) => {
      const editable = Boolean(commentAuthorKeyOf(entry.author));
      return `<article class="detail-comment-entry"><header><strong>${escapeHtml(entry.author || "匿名")}</strong><time>${escapeHtml(entry.createdAt)}</time>${editable ? `<button type="button" data-edit-comment="${escapeHtml(entry.id)}"><i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>編集</button>` : ""}</header><div class="detail-richtext">${renderMarkdown(entry.comment)}</div></article>`;
    }).join("")}</div></section>`;
  };
  const commentComposer = (character, variant) => {
    const saved = commentAuthorKeys();
    const preferredAuthor = Object.keys(saved).find((author) => commentAuthors.includes(author)) || "";
    const options = commentAuthors.length
      ? `<option value="">投稿者を選ぶ</option>${commentAuthors.map((author) => `<option value="${escapeHtml(author)}"${author === preferredAuthor ? " selected" : ""}>${escapeHtml(author)}</option>`).join("")}`
      : `<option value="">投稿者候補を読み込み中…</option>`;
    return `<section class="detail-section detail-comment-composer"><h3><i class="fa-regular fa-comment-dots" aria-hidden="true"></i>コメントを書く</h3><p>送信した内容はこの姿の「コメント評」に追記され、公開ページへ表示されます。</p><form data-comment-form><input type="hidden" name="id" value="${escapeHtml(character.id)}"><input type="hidden" name="name" value="${escapeHtml(variant.name)}"><input type="hidden" name="variant" value="${escapeHtml(variant.variant)}"><input type="hidden" name="system" value="${escapeHtml(variant.system)}"><input type="hidden" name="commentId" value=""><label>投稿者<select name="author" required${commentAuthors.length ? "" : " disabled"}>${options}</select></label><label>コメント<textarea name="comment" rows="5" maxlength="2500" required placeholder="このキャラクターへのコメント・思い出など"></textarea></label><details class="detail-comment-composer__key"><summary>編集キー</summary><p>初回投稿時に短いキーを発行し、このブラウザに保存します。同じ投稿者名のコメント編集・追記に使います。</p><input name="writeKey" type="password" autocomplete="current-password" placeholder="保存済みの編集キー"></details><p class="detail-comment-composer__status" data-comment-status role="status"></p><button type="submit" class="detail-comment-composer__submit"><i class="fa-solid fa-paper-plane" aria-hidden="true"></i><span data-comment-submit-label>コメントを送信</span></button></form></section>`;
  };
  const achievementSection = (value) => {
    const score = achievementValueOf(value);
    if (!score) return "";
    const label = score === 6 ? "特別評価" : "自己評価";
    return `<section class="detail-section detail-achievement" data-achievement="${score}"><div><h3>やれた度</h3><p>${label}。本人が感じた「どれだけやれたか」の記録です。</p></div><span class="detail-achievement__badge" aria-label="やれた度 ${score}">${score}</span></section>`;
  };

  function renderDetail() {
    stopQuoteSpotlight();
    const character = state.characters.find((item) => item.id === state.selectedId);
    if (!character) return;
    const variant = character.variants[state.variantIndex] || representativeOf(character);
    const akaHtml = yutorizeRubyHtml(variant.aka || variant.epithet);
    const detailImages = detailImagesOf(variant);
    const hasAlternateImage = detailImages.length > 1;
    if (!detailImages.some((imageItem) => imageItem.key === state.detailImageMode)) state.detailImageMode = "normal";
    const image = detailImageOf(variant, state.detailImageMode);
    const headerMeta = [
      variant.location ? `<span><i class="fa-solid fa-location-dot" aria-hidden="true"></i>${escapeHtml(locationLabelsOf(variant).join(" / "))}</span>` : "",
      variant.debut ? `<time datetime="${escapeHtml(variant.debut)}"><i class="fa-regular fa-calendar" aria-hidden="true"></i>初登場 ${escapeHtml(variant.debut)}</time>` : ""
    ].filter(Boolean).join("");
    // 一覧では省略される手入力タグも、詳細では全部確認できるようにする。
    // ||ネタバレ||・~~過去属性~~ は検索用の正規化名を保ったまま表示する。
    const detailTags = prioritizedManualTags(variant.tags);
    const detailTagsHtml = detailTags.length ? `<section class="detail-tags" aria-label="タグ"><p class="detail-section__eyebrow">TAGS</p><div>${detailTags.map((tag) => catalogTagHtml({ ...tag, source: "manual" }, variant, spoilerTagKeyOf(character, variant, tag))).join("")}</div></section>` : "";
    const facts = [
      detailFactGroup("特徴", "fa-solid fa-fingerprint", [["ジョブ", variant.job], ["アライメント", variant.alignment]], "detail-fact-group--features"),
      detailFactGroup("人物", "fa-solid fa-user", [["性別", variant.sex], ["年齢", variant.age], ["身長", variant.height], ["髪色", variant.hair]], "detail-fact-group--person"),
      detailFactGroup("呼び方", "fa-solid fa-comments", [["一人称", variant.firstPerson], ["二人称", variant.secondPerson], ["読み", variant.reading]], "detail-fact-group--calling")
    ].join("");
    const actions = [detailAction(variant.driveUrl, "fa-brands fa-google-drive", "Driveを開く"), detailAction(publicCharacterSheetUrl(variant.characterSheetUrl), "fa-regular fa-file-lines", "キャラシを開く")].join("");
    const variantTabs = character.variants.length > 1 ? `<nav class="variant-tabs" aria-label="姿・システムを切り替え"><span>切替</span>${character.variants.map((item, index) => {
      const label = item.variant || item.system || `姿 ${index + 1}`;
      return `<button class="variant-tab" type="button" data-variant-index="${index}" aria-selected="${index === state.variantIndex}">${escapeHtml(label)}</button>`;
    }).join("")}</nav>` : "";
    const imageSwitcher = hasAlternateImage ? `<div class="detail-image-switcher" role="group" aria-label="立ち絵を切り替え"><button type="button" data-detail-image-cycle="-1" data-tooltip="前の立ち絵" aria-label="前の立ち絵を表示"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button><button type="button" data-detail-image-cycle="1" data-tooltip="次の立ち絵" aria-label="次の立ち絵を表示"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button></div>` : "";
    // 顔列が空でも、ココフォリアの先頭表情をモーダル上のプレビューに使える。
    const faceImage = displayableImageUrl(variant.faceUrl || variant.faces?.[0]?.iconUrl);
    const facePreviewLayoutKey = `${character.id}:${state.variantIndex}`;
    const facePreviewLayout = state.facePreviewLayouts.get(facePreviewLayoutKey);
    const facePreviewHidden = state.facePreviewHidden.has(facePreviewLayoutKey);
    const expressionPaletteHidden = state.expressionPaletteHidden.has(facePreviewLayoutKey);
    const facePreviewStyle = facePreviewLayout
      ? ` style="left:${facePreviewLayout.left}px;top:${facePreviewLayout.top}px;width:${facePreviewLayout.size}px;right:auto"`
      : "";
    const facePreview = faceImage
      ? `<div id="detail-face-preview" class="detail-face-preview" data-face-preview-key="${escapeHtml(facePreviewLayoutKey)}"${facePreviewHidden ? " hidden" : ""}${facePreviewStyle}><div class="detail-face-preview__handle" data-face-preview-handle title="ドラッグして移動"><i class="fa-solid fa-grip-lines" aria-hidden="true"></i><span>顔プレビュー</span></div><img src="${escapeHtml(faceImage)}" alt="${escapeHtml(`${variant.name || character.registrationName}の顔画像`)}"><span aria-hidden="true">FACE</span><button type="button" class="detail-face-preview__close" data-face-preview-close aria-label="顔プレビューを隠す" title="顔プレビューを隠す"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button><button type="button" class="detail-face-preview__resize" data-face-preview-resize aria-label="顔アイコンの大きさを変える"></button></div>`
      : `<div id="detail-face-preview" class="detail-face-preview" data-face-preview-key="${escapeHtml(facePreviewLayoutKey)}" hidden><img alt=""><span aria-hidden="true">FACE</span><button type="button" class="detail-face-preview__resize" data-face-preview-resize aria-label="顔アイコンの大きさを変える"></button></div>`;
    // 表情は本文タブから切り離した浮動パレットに置く。本文の高さを奪わず、
    // タブやスクロールを切り替えても、立ち絵の横でいつでも選択できる。
    const expressionSection = variant.faces.length ? `<section class="expression-section expression-palette" data-expression-palette-key="${escapeHtml(facePreviewLayoutKey)}"${expressionPaletteHidden ? " hidden" : ""}><header class="expression-heading"><div><p class="detail-section__eyebrow">COCOFOLIA</p><h3>ココフォリア表情 <small>${variant.faces.length}</small></h3><p>選んだ表情は右の立ち絵に反映されます。</p></div><div class="expression-heading__actions"><button class="expression-reset expression-face-preview-toggle" type="button" data-show-face-preview${facePreviewHidden ? "" : " hidden"}><i class="fa-regular fa-image" aria-hidden="true"></i> 顔プレビュー</button>${variant.differenceJson ? '<button class="expression-reset" type="button" data-copy-json><i class="fa-regular fa-copy" aria-hidden="true"></i> 表情をコピー</button>' : ""}<button class="expression-palette__close" type="button" data-expression-palette-close aria-label="表情パレットを隠す" title="表情パレットを隠す"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div></header><div class="expression-tray__body"><div class="expression-grid">${variant.faces.map((face, index) => {
      const faceUrl = safeUrl(face.iconUrl);
      const label = faceLabelInfo(face.label, index);
      return faceUrl ? `<button class="expression-button" type="button" data-face-index="${index}" data-face-tone="${label.tone}" aria-pressed="false" title="${escapeHtml(label.display)}"><img src="${escapeHtml(faceUrl)}" alt="${escapeHtml(label.display)}" loading="lazy" decoding="async"><span>${escapeHtml(label.display)}</span></button>` : "";
    }).join("")}</div></div></section>` : "";
    const expressionPaletteLauncher = variant.faces.length ? `<button class="expression-palette-launcher" type="button" data-expression-palette-show${expressionPaletteHidden ? "" : " hidden"}><i class="fa-regular fa-face-smile" aria-hidden="true"></i> 表情一覧を開く（${variant.faces.length}）</button>` : "";
    const portraitScale = portraitScaleOf(variant), portraitOffsetY = portraitOffsetYOf(variant), portraitOffsetX = portraitOffsetXOf(variant);
    const listPreviewImage = bodyImageCandidatesOf(variant)[0] || "";
    const portraitTuning = `<details class="portrait-tuning"><summary><i class="fa-solid fa-sliders" aria-hidden="true"></i>立ち絵調整</summary><p>倍率・上下・左右を試し、値をシートの「立ち絵調整」列へ貼り付けます。下のプレビューは一覧右側と同じ縮小換算です。</p><div class="portrait-tuning__control"><label>倍率 <output data-portrait-scale-output>${portraitScale.toFixed(2)}</output></label><input type="range" min="0.8" max="1.3" step="0.01" value="${portraitScale}" data-portrait-scale><input type="number" min="0.8" max="1.3" step="0.01" value="${portraitScale}" data-portrait-scale></div><div class="portrait-tuning__control"><label>上下位置 <output data-portrait-offset-y-output>${portraitOffsetY}px</output></label><input type="range" min="-180" max="180" step="1" value="${portraitOffsetY}" data-portrait-offset-y><input type="number" min="-180" max="180" step="1" value="${portraitOffsetY}" data-portrait-offset-y></div><div class="portrait-tuning__control"><label>左右位置 <output data-portrait-offset-x-output>${portraitOffsetX}px</output></label><input type="range" min="-180" max="180" step="1" value="${portraitOffsetX}" data-portrait-offset-x><input type="number" min="-180" max="180" step="1" value="${portraitOffsetX}" data-portrait-offset-x></div>${listPreviewImage ? `<div class="portrait-tuning__list-preview"><span>一覧右側プレビュー</span><div><img src="${escapeHtml(listPreviewImage)}" alt="" aria-hidden="true"></div></div>` : ""}<div class="portrait-tuning__result"><code data-portrait-adjustment-value>${portraitScale.toFixed(2)},${portraitOffsetY},${portraitOffsetX}</code><button type="button" data-copy-portrait-adjustment><i class="fa-regular fa-copy" aria-hidden="true"></i>値をコピー</button></div></details>`;
    detail.className = "character-detail";
    detail.style.setProperty("--character-system-color", systemColorOf(variant.system));
    detail.style.setProperty("--detail-portrait-scale", portraitScaleOf(variant));
    detail.style.setProperty("--detail-portrait-offset-y", `${portraitOffsetYOf(variant)}px`);
    detail.style.setProperty("--detail-portrait-offset-x", `${portraitOffsetXOf(variant)}px`);
    const profileCore = [
      richSection("性格", variant.personality, "detail-section--personality"),
      richSection("好き・大事", variant.likes),
      richSection("苦手・弱点", variant.weaknesses),
      keywordSection(variant.keyword),
    ].join("");
    const personContent = [
      profileCore ? `<section class="detail-profile-core"><header><p class="detail-section__eyebrow">CHARACTER</p><h3>キャラクター</h3></header>${profileCore}</section>` : "",
      richSection("関係キャラ", variant.relations),
      richSection("キャラ語り", variant.commentary),
      variant.quote ? `<section class="detail-section detail-quotes-section"><h3>セリフ集</h3>${characterQuotesHtml(variant.quote)}</section>` : ""
    ].join("");
    const recordContent = [
      richSection("登場シナリオ", variant.appearanceScenarios),
      richSection("見どころ", variant.highlights, "detail-section--highlights"),
      richSection("モチーフ・制作意図", variant.motif, "detail-section--motif"),
      richSection("TIPS・設定メモ", variant.tips),
    ].join("");
    const reviewContent = [
      reviewSection("エンJ人物評", variant.enJReview, "本人による人物評・所感です。"),
      achievementSection(variant.achievement),
        reviewSection("みんな評", variant.communityReview, "当時の感想です。現在の人物像と一致しない場合があります。"),
        reviewSection("コメント評", variant.commentReview, "個別のコメント・思い出を含む主観的な記録です。"),
        commentEntriesSection(variant),
        commentComposer(character, variant),
        reviewSection("AI人物評", variant.aiReview, "AIがログや資料をもとに行った読み解きです。事実そのものではなく、解釈として扱ってください。"),
        reviewSection("他の人が演じるときのコツ", variant.portrayalTips, "別の人が演じる際の目安です。シナリオや関係性に合わせて調整してください。"),
      ].join("");
    const publicSheet = variant.publicCharacterSheet || {};
    const publicSheetContent = [
  publicSheet.codeName ? `<section class="detail-public-sheet__headline"><p>コードネーム</p><h3>${inlineMarkdown(publicSheet.codeName)}</h3></section>` : "",
      richSection("パーソナルデータ", publicSheet.personalData),
      richSection("備考", publicSheet.notes),
      richSection("技能", publicSheet.skills),
      richSection("Dロイス", publicSheet.dLois),
      richSection("シンドローム", publicSheet.syndromes),
      richSection("エフェクト", publicSheet.effects),
      richSection("武器", publicSheet.weapons),
      richSection("コンボ", publicSheet.combos)
    ].join("");
    const detailTabs = [
      { id: "person", label: "人物", content: personContent },
      { id: "record", label: "記録", content: recordContent },
      { id: "data", label: "データ", content: publicSheetContent ? `<div class="detail-public-sheet">${publicSheetContent}</div>` : "" },
      { id: "review", label: "評・演じ方", content: reviewContent }
    ].filter((tab) => tab.content);
    if (!detailTabs.some((tab) => tab.id === state.detailContentTab)) state.detailContentTab = detailTabs[0]?.id || "person";
    const detailTabsHtml = detailTabs.length ? `<div class="detail-content-tabs" role="tablist" aria-label="キャラクター詳細の内容"><div class="detail-content-tabs__buttons">${detailTabs.map((tab) => `<button type="button" role="tab" id="detail-tab-${tab.id}" aria-selected="${tab.id === state.detailContentTab}" aria-controls="detail-panel-${tab.id}" data-detail-content-tab="${tab.id}">${escapeHtml(tab.label)}</button>`).join("")}</div>${detailTabs.map((tab) => `<section class="detail-content-panel" id="detail-panel-${tab.id}" role="tabpanel" aria-labelledby="detail-tab-${tab.id}"${tab.id === state.detailContentTab ? "" : " hidden"}>${tab.content}</section>`).join("")}</div>` : "";
    detail.innerHTML = `<div class="character-detail__visual"><span class="detail-visual-id" aria-hidden="true">#${escapeHtml(String(character.id).padStart(3, "0"))}</span>${image ? `<img id="detail-main-image" src="${escapeHtml(image)}" alt="${escapeHtml(variant.name || character.registrationName)}" decoding="async">` : `<span class="character-detail__image-placeholder" aria-hidden="true">${escapeHtml(character.registrationName.slice(0, 1))}</span>`}${quoteSpotlightHtml(variant.quote)}${imageSwitcher}</div>
      <div class="character-detail__left"><div class="character-detail__content"><p class="detail-kicker">#${escapeHtml(character.id)}${variant.system ? ` ・ ${escapeHtml(variant.system)}` : ""}</p><h2 id="detail-name">${detailNameHtml(variant.name || character.registrationName, variant.reading)}</h2>${state.detailLoadingId === character.id ? '<p class="detail-loading-message"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> 詳細情報を読み込んでいます…</p>' : ""}${akaHtml ? `<p class="detail-aka">${akaHtml}</p>` : ""}${headerMeta ? `<div class="detail-meta">${headerMeta}</div>` : ""}${detailTagsHtml}${variantTabs}
        ${actions ? `<div class="detail-actions">${actions}</div>` : ""}${facts ? `<div class="detail-facts">${facts}</div>` : ""}
        ${detailTabsHtml}</div></div>${expressionSection}${expressionPaletteLauncher}`;
    const authorSelect = detail.querySelector('[name="author"]');
    const commentKeyInput = detail.querySelector('[name="writeKey"]');
    if (authorSelect && commentKeyInput) {
      const applyStoredKey = () => { commentKeyInput.value = commentAuthorKeyOf(authorSelect.value); };
      applyStoredKey();
      authorSelect.addEventListener("change", applyStoredKey);
    }
    dialog.querySelector("#detail-face-preview")?.remove();
    dialog.insertAdjacentHTML("beforeend", facePreview);
    if (!facePreviewLayout && faceImage) requestAnimationFrame(() => {
      const preview = dialog.querySelector("#detail-face-preview");
      if (!preview || preview.hidden) return;
      const dialogRect = dialog.getBoundingClientRect();
      const previewRect = preview.getBoundingClientRect();
      // 初期位置はモーダルの外側。右に余白がなければ左へ逃がす。
      // 好きな位置へ動かした後は state.facePreviewLayouts の位置を優先する。
      const visualRect = dialog.querySelector(".character-detail__visual")?.getBoundingClientRect();
      const outsideGap = 18;
      const rightLeft = dialogRect.width + outsideGap;
      const leftLeft = -previewRect.width - outsideGap;
      const fitsRight = dialogRect.left + rightLeft + previewRect.width <= window.innerWidth - 8;
      const fitsLeft = dialogRect.left + leftLeft >= 8;
      const fallbackLeft = Math.max(16, dialogRect.width - previewRect.width - 20);
      const left = fitsRight ? rightLeft : (fitsLeft ? leftLeft : fallbackLeft);
      const top = Math.max(12, Math.min(dialogRect.height - previewRect.height - 12, visualRect ? visualRect.top - dialogRect.top + 40 : 28));
      preview.style.left = `${Math.round(left)}px`;
      preview.style.right = "auto";
      preview.style.bottom = "auto";
      preview.style.top = `${Math.round(top)}px`;
    });
    startQuoteSpotlight();
  }

  function rememberCatalogScroll() {
    state.catalogScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  }
  function restoreCatalogScroll() {
    const top = state.catalogScrollY;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.scrollTo({ top, left: 0, behavior: "auto" });
      // dialog のフォーカス復帰後にも一度固定し、一覧の先頭へ飛ぶブラウザ差を吸収する。
      setTimeout(() => window.scrollTo({ top, left: 0, behavior: "auto" }), 0);
    }));
  }
  // 一覧を先に表示した後、余裕のある時だけ全員分の詳細を一括で温める。
  // 個別閲覧が来たらこの通信は中断して、1人分の詳細取得を先に通す。
  function cancelCatalogDetailWarmup() {
    if (state.detailWarmupTimer) {
      clearTimeout(state.detailWarmupTimer);
      state.detailWarmupTimer = null;
    }
    if (state.detailWarmupController) {
      state.detailWarmupController.abort();
      state.detailWarmupController = null;
    }
  }
  function scheduleCatalogDetailWarmup(delay = 1200) {
    if (!state.characters.some((character) => !character.detailLoaded)) return;
    if (state.detailWarmupTimer || state.detailWarmupController) return;
    const begin = () => {
      state.detailWarmupTimer = null;
      // この間に個別クリック済み、または一覧が全詳細化済みなら何もしない。
      if (state.selectedId || !state.characters.some((character) => !character.detailLoaded)) return;
      const controller = new AbortController();
      state.detailWarmupController = controller;
      fetchCharacterPayload(`${CHARACTER_API_BASE_URL}?tool=characters&_=${Date.now()}`, { cache: "no-store", signal: controller.signal })
        .then((payload) => {
          // 開いている詳細や、先に1件だけ取得した詳細を applyCharacterPayload が保持する。
          applyCharacterPayload(payload);
        })
        .catch((error) => {
          // 個別閲覧を優先するための中断は正常な制御フロー。画面へは出さない。
          if (error?.name !== "AbortError") console.info("Background character-detail warmup was skipped.", error);
        })
        .finally(() => {
          if (state.detailWarmupController === controller) state.detailWarmupController = null;
        });
    };
    state.detailWarmupTimer = setTimeout(begin, Math.max(0, delay));
  }
  async function loadCharacterDetail(id) {
    const characterId = String(id);
    const current = state.characters.find((item) => item.id === characterId);
    if (!current || current.detailLoaded) return current || null;
    // 全員分の背景取得より、いま開こうとしている1人を優先する。
    cancelCatalogDetailWarmup();
    if (state.detailRequests.has(characterId)) return state.detailRequests.get(characterId);
    const request = (async () => {
      const applyDetail = (sourceCharacter) => {
        const detailed = normalizeCharacter({ ...sourceCharacter, detailLoaded: true });
        const index = state.characters.findIndex((item) => item.id === characterId);
        if (index >= 0) state.characters[index] = detailed;
        return detailed;
      };
      try {
        const source = `${CHARACTER_API_BASE_URL}?tool=character&id=${encodeURIComponent(characterId)}&_=${Date.now()}`;
        const response = await fetch(source, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        if (payload?.status !== "success" || !payload.character || !isCatalogCharacter(payload.character)) {
          throw new Error(payload?.message || "Unexpected detail response");
        }
        return applyDetail(payload.character);
      } catch (detailError) {
        // 新しい1件取得APIを未デプロイの間だけ、旧APIの全件応答から対象を救済する。
        // 正式デプロイ後はここへ入らず、常に1人分だけを読む。
        console.info("Character detail endpoint is unavailable; using legacy detail fallback.", detailError);
        const legacy = await fetchCharacterPayload(`${CHARACTER_API_BASE_URL}?_=${Date.now()}`, { cache: "no-store" });
        const legacyCharacter = legacy.characters.find((item) => String(item?.id) === characterId);
        if (!legacyCharacter || !isCatalogCharacter(legacyCharacter)) throw detailError;
        return applyDetail(legacyCharacter);
      }
    })().finally(() => state.detailRequests.delete(characterId));
    state.detailRequests.set(characterId, request);
    return request;
  }

  async function openCharacter(id, variantIndex = null, options = {}) {
    const character = state.characters.find((item) => item.id === String(id));
    if (!character) return;
    if (!dialog.open) rememberCatalogScroll();
    // クリックした本人を待たせない。背景の全詳細取得はここで譲る。
    cancelCatalogDetailWarmup();
    state.openedFromUrl = Boolean(options.fromUrl);
    state.selectedId = character.id;
    state.variantIndex = variantIndex === null ? character.representativeIndex : Number(variantIndex);
    state.detailImageMode = "normal";
    state.detailLoadingId = character.detailLoaded ? null : character.id;
    renderDetail();
    if (!dialog.open) dialog.showModal();
    restoreDetailScroll();
    document.documentElement.classList.add("character-dialog-open");
    if (character.detailLoaded) return;
    try {
      await loadCharacterDetail(character.id);
      if (state.selectedId === character.id) {
        state.detailLoadingId = null;
        renderDetail();
        restoreDetailScroll();
      }
    } catch (error) {
      console.warn("Character detail could not be loaded.", error);
      if (state.selectedId === character.id) {
        state.detailLoadingId = null;
        showToast("詳細情報を取得できませんでした");
      }
    }
  }
  function closeCharacter() {
    rememberDetailScroll();
    stopQuoteSpotlight();
    closeImageLightbox();
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove("character-dialog-open");
    state.selectedId = null;
    state.detailLoadingId = null;
    if (state.openedFromUrl) history.replaceState(null, "", location.pathname);
    state.openedFromUrl = false;
    restoreCatalogScroll();
    // モーダルを閉じた後にだけ、残りの全詳細を裏で温め直す。
    // 読んでいる最中に巨大なレスポンスを処理して描画を重くしないため。
    scheduleCatalogDetailWarmup(1600);
  }
  function activeDetailVariant() {
    const character = state.characters.find((item) => item.id === state.selectedId);
    return character?.variants[state.variantIndex] || null;
  }
  function openImageLightbox(source, alt = "立ち絵") {
    const url = safeUrl(source);
    if (!url) return;
    clearTimeout(imageLightboxCloseTimer);
    imageLightboxImage.src = url;
    imageLightboxImage.alt = alt;
    if (!imageLightbox.open) imageLightbox.showModal();
    requestAnimationFrame(() => requestAnimationFrame(() => imageLightbox.classList.add("is-visible")));
  }
  function closeImageLightbox() {
    if (!imageLightbox.open) return;
    imageLightbox.classList.remove("is-visible");
    clearTimeout(imageLightboxCloseTimer);
    imageLightboxCloseTimer = setTimeout(() => {
      if (imageLightbox.open && !imageLightbox.classList.contains("is-visible")) imageLightbox.close();
    }, 410);
  }
  const detailScrollKey = () => `${state.selectedId || ""}:${state.variantIndex}`;
  function rememberDetailScroll() {
    const content = detail.querySelector(".character-detail__content");
    if (content && state.selectedId) state.detailScrollPositions.set(detailScrollKey(), content.scrollTop);
  }
  function restoreDetailScroll() {
    const scrollTop = state.detailScrollPositions.get(detailScrollKey());
    if (!scrollTop) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const content = detail.querySelector(".character-detail__content");
      if (content) content.scrollTop = scrollTop;
    }));
  }
  function showToast(message) {
    const host = imageLightbox.open ? imageLightbox : dialog.open ? dialog : document.body;
    if (toast.parentElement !== host) host.appendChild(toast);
    toast.classList.toggle("catalog-toast--modal", host !== document.body);
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }
  async function copyText(value) {
    try { await navigator.clipboard.writeText(value); }
    catch (_error) {
      const area = document.createElement("textarea"); area.value = value; area.style.position = "fixed"; area.style.opacity = "0";
      document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove();
    }
    showToast("ココフォリア表情をコピーしました");
  }
  function mergeSelectionForInput(input) {
    if (state.mergeSelection) return state.mergeSelection;
    const raw = cleanMergeInput(input), parsed = parseJsonLoose(raw);
    const targets = [];
    addMergeTarget(targets, parsed?.data?.name || raw);
    if (parsed?.data?.memo) addMergeTarget(targets, String(parsed.data.memo).split(/\r?\n/)[0]);
    let best = null, bestScore = 0;
    state.characters.forEach((character) => character.variants.forEach((variant, variantIndex) => {
      const score = mergeScore(variant, character, targets);
      if (score > bestScore) { best = { character, variant, variantIndex }; bestScore = score; }
    }));
    return best;
  }
  async function runCharacterMerge() {
    if (!state.characters.length) { mergeStatus.textContent = "名鑑データを読み込み中です。少し待ってください。"; return; }
    let selected = mergeSelectionForInput(mergeInput.value);
    if (selected?.variant?.hasDifference && !selected.variant.differenceJson) {
      mergeStatus.textContent = "差分を読み込んでいます…";
      try {
        const detailed = await loadCharacterDetail(selected.character.id);
        selected = detailed ? { character: detailed, variant: detailed.variants[selected.variantIndex], variantIndex: selected.variantIndex } : null;
      } catch (error) {
        console.warn("Character difference could not be loaded.", error);
        selected = null;
      }
    }
    const result = mergeCharacterJson(mergeInput.value, selected);
    if (result.error) {
      mergeOutput.value = "";
      mergeCopy.disabled = true;
      mergeStatus.textContent = result.error;
      return;
    }
    mergeOutput.value = result.value;
    mergeCopy.disabled = false;
    mergeStatus.textContent = `「${result.name}」の差分を統合しました。`;
  }
  function activateSpoiler(element) {
    const revealed = element.classList.toggle("is-revealed");
    element.setAttribute("aria-label", revealed ? "ネタバレを隠す" : "ネタバレを表示");
  }

  function isCharacterPayload(value) {
    return value?.status === "success" && Array.isArray(value.characters);
  }

  function isCatalogCharacter(character) {
    // 名鑑の末尾に置いている補助ヘッダー（例: 「ﾕﾆｰｸID」）を、
    // APIがデータ行として返してもカード化しない。通常の ID は数値運用。
    return /^\d+$/.test(String(character?.id ?? "").trim());
  }

  function applyCharacterPayload(payload, { openInitial = false } = {}) {
    const currentById = new Map(state.characters.map((character) => [character.id, character]));
    state.characters = payload.characters
      .filter(isCatalogCharacter)
      .map(normalizeCharacter)
      .map((incoming) => {
        // 一覧更新が詳細取得より後に終わっても、開き済みの重い詳細情報は捨てない。
        const loaded = currentById.get(incoming.id);
        if (!loaded?.detailLoaded) return incoming;
        return normalizeCharacter({
          ...incoming,
          detailLoaded: true,
          variants: incoming.variants.map((variant, index) => ({
            ...(loaded.variants[index] || {}),
            ...variant
          }))
        });
      })
      .filter((character) => character.variants.length);
    buildLocationDisplayNames();
    if (!state.characters.length) {
      grid.innerHTML = '<div class="catalog-empty"><h2>表示できるキャラクターがいません</h2><p>スプレッドシートで「非公開」にしていない行が表示対象です。</p></div>';
      count.textContent = "0 characters";
      return;
    }
    renderSystemFilter();
    renderMergeSelect();
    renderCards();
    const initialId = new URLSearchParams(location.search).get("id");
    if (openInitial && initialId) openCharacter(initialId, null, { fromUrl: true });
  }

  async function fetchCharacterPayload(source, options = {}) {
    const response = await fetch(source, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (!isCharacterPayload(payload)) throw new Error(payload?.message || "Unexpected response");
    return payload;
  }

  function readCachedCharacterPayload() {
    try {
      const storage = globalThis.localStorage;
      if (!storage) return null;
      const raw = storage.getItem(CHARACTER_CACHE_KEY);
      if (!raw) return null;
      const payload = JSON.parse(raw);
      return isCharacterPayload(payload) ? payload : null;
    } catch (error) {
      console.warn("Saved character catalog cache could not be read.", error);
      return null;
    }
  }

  function saveCachedCharacterPayload(payload) {
    try {
      const storage = globalThis.localStorage;
      if (!storage) return;
      storage.setItem(CHARACTER_CACHE_KEY, JSON.stringify(payload));
    } catch (error) {
      // 保存できなくても表示・更新は正常に続ける（容量制限やプライベート閲覧向け）。
      console.warn("Latest character catalog could not be saved locally.", error);
    }
  }

  function payloadGeneratedAt(payload) {
    const time = Date.parse(String(payload?.generatedAt || ""));
    return Number.isFinite(time) ? time : 0;
  }

  async function loadCharacters() {
    status.hidden = false;
    status.textContent = "キャラクターを読み込んでいます…";
    // 公開版には静的一覧ファイルを配置していない。そこで存在しない控えの 404 を
    // 待ってから API を反映することがないよう、控えはローカル表示時だけ読む。
    // 公開版はブラウザ内控え → 最新 index API の順で即時表示する。
    const useLocalPreview = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    const previewRequest = useLocalPreview
      ? fetchCharacterPayload(LOCAL_PREVIEW_URL, { cache: "no-cache" })
      : Promise.resolve(null);
    // 一覧用は軽い index だけ取得する。詳細本文・表情JSONは開いた時にだけ取得する。
    const apiRequest = fetchCharacterPayload(`${CHARACTER_INDEX_API_URL}&_=${Date.now()}`, { cache: "no-store" });
    const savedPreview = readCachedCharacterPayload();
    let renderedPreview = false;
    if (savedPreview) {
      applyCharacterPayload(savedPreview, { openInitial: true });
      renderedPreview = true;
      status.hidden = true;
    }
    try {
      const preview = await previewRequest;
      if (!preview) throw new Error("Local preview is not used on this host.");
      // ブラウザ控えより新しい静的控えだけを採用する。通常は API がすぐ上書きするが、
      // ここで古い控えを描画し直さないことが「開幕でタグが消える」対策になる。
      if (!savedPreview || payloadGeneratedAt(preview) > payloadGeneratedAt(savedPreview)) {
        applyCharacterPayload(preview, { openInitial: !renderedPreview });
        renderedPreview = true;
        status.hidden = true;
      }
    } catch (error) {
      if (useLocalPreview) console.warn("Character preview could not be loaded.", error);
      // ブラウザ内控えがあれば、API が応答するまでそのまま表示を続ける。
      if (savedPreview) {
        renderedPreview = true;
        status.hidden = true;
      }
    }
    try {
      const latest = await apiRequest;
      saveCachedCharacterPayload(latest);
      applyCharacterPayload(latest, { openInitial: !renderedPreview });
      status.hidden = true;
      scheduleCatalogDetailWarmup();
    } catch (error) {
      console.warn("Character API could not be loaded.", error);
      if (renderedPreview) {
        console.info("最新のキャラクターデータは取得できなかったため、ローカル控えを表示しています。");
        status.hidden = true;
        scheduleCatalogDetailWarmup();
        return;
      }
      status.textContent = "キャラクターデータを読み込めませんでした。少し待ってから再読み込みしてください。";
      count.textContent = "0 characters";
    }
  }

  grid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-character-id]");
    if (!card) return;
    const systemButton = event.target.closest("[data-system-filter]");
    if (systemButton) {
      event.preventDefault();
      event.stopPropagation();
      state.system = systemButton.dataset.systemFilter || "";
      systemFilter.value = state.system;
      state.cardVariantIndexes.clear();
      renderCards();
      return;
    }
    const moreTagsButton = event.target.closest("[data-show-more-tags]");
    if (moreTagsButton) {
      event.preventDefault();
      event.stopPropagation();
      const character = state.characters.find((item) => item.id === card.dataset.characterId);
      const variant = character?.variants[Number(card.dataset.cardVariantIndex)];
      if (character && variant) showMoreCatalogTags(moreTagsButton, character, variant);
      return;
    }
    const spoilerTagButton = event.target.closest("[data-reveal-spoiler-tag]");
    if (spoilerTagButton) {
      event.preventDefault();
      event.stopPropagation();
      revealSpoilerTag(spoilerTagButton);
      return;
    }
    const tagButton = event.target.closest("[data-tag-search]");
    if (tagButton) {
      event.preventDefault();
      event.stopPropagation();
      searchByCatalogTag(tagButton.dataset.tagSearch);
      return;
    }
    if (event.target.closest("[data-adjust-portrait]")) {
      state.activePortraitAdjustment = { characterId: card.dataset.characterId, variantIndex: Number(card.dataset.cardVariantIndex) };
      renderPortraitAdjustController();
      return;
    }
    if (event.target.closest("[data-cycle-variant]")) {
      const character = state.characters.find((item) => item.id === card.dataset.characterId);
      if (!character?.variants.length) return;
      state.cardVariantIndexes.set(character.id, (Number(card.dataset.cardVariantIndex) + 1) % character.variants.length);
      renderCards();
      return;
    }
    openCharacter(card.dataset.characterId, card.dataset.cardVariantIndex);
  });
  grid.addEventListener("error", (event) => {
    const image = event.target.closest("img[data-image-candidates]");
    if (!image) return;
    let candidates = [];
    try { candidates = JSON.parse(image.dataset.imageCandidates || "[]"); } catch (_error) { candidates = []; }
    const currentIndex = Math.max(0, candidates.indexOf(image.src));
    const next = candidates[currentIndex + 1];
    if (next) { image.src = next; return; }
    const visual = image.closest(".character-card__visual"), card = image.closest("[data-character-id]");
    const character = state.characters.find((item) => item.id === card?.dataset.characterId);
    const variant = character?.variants[Number(card?.dataset.cardVariantIndex)] || representativeOf(character || { variants: [] });
    if (visual) visual.innerHTML = `<span class="character-card__initial" aria-hidden="true">${escapeHtml((variant.name || character?.registrationName || "?").slice(0, 1))}</span>`;
  }, true);
  grid.addEventListener("load", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.matches(".character-card__portrait-window img")) return;
    // 横幅が高さの 72% 以上なら、全身よりバストアップ寄りと判断する。
    if (image.naturalWidth && image.naturalWidth / image.naturalHeight >= 0.72) image.dataset.listPortraitFraming = "bust";
    const card = image.closest("[data-character-id]");
    const character = state.characters.find((item) => item.id === card?.dataset.characterId);
    const variant = character?.variants[Number(card?.dataset.cardVariantIndex)];
    if (variant) image.style.setProperty("--card-portrait-list-scale", listPortraitScaleFor(image, portraitScaleOf(variant)).toFixed(3));
    image.classList.add("is-ready");
  }, true);
  grid.addEventListener("keydown", (event) => {
    const systemButton = event.target.closest("[data-system-filter]");
    if (systemButton && ["Enter", " "].includes(event.key)) { event.preventDefault(); systemButton.click(); return; }
    if (event.target.closest("[data-cycle-variant], [data-tag-search], [data-show-more-tags]") || !["Enter", " "].includes(event.key)) return;
    const card = event.target.closest("[data-character-id]");
    if (card) { event.preventDefault(); openCharacter(card.dataset.characterId, card.dataset.cardVariantIndex); }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!tagPopover || event.target.closest(".catalog-tag-popover, [data-show-more-tags]")) return;
    closeTagPopover();
  });
  window.addEventListener("resize", closeTagPopover);
  window.addEventListener("scroll", closeTagPopover, true);
  mergeRun.addEventListener("click", runCharacterMerge);
  mergeCopy.addEventListener("click", () => { if (mergeOutput.value) copyText(mergeOutput.value); });
  mergeSelect.addEventListener("change", () => {
    state.mergeSelection = selectedMergeVariant(mergeSelect.value);
    if (!state.mergeSelection) return;
    mergeInput.value = state.mergeSelection.variant.name || state.mergeSelection.character.registrationName;
    mergeStatus.textContent = `「${state.mergeSelection.variant.name || state.mergeSelection.character.registrationName}」を選択中です`;
  });
  mergeInput.addEventListener("input", () => {
    if (!state.mergeSelection) return;
    state.mergeSelection = null;
    mergeSelect.value = "";
  });
  portraitAdjustToggle.addEventListener("click", () => {
    state.portraitAdjustMode = !state.portraitAdjustMode;
    portraitAdjustToggle.setAttribute("aria-pressed", String(state.portraitAdjustMode));
    if (state.portraitAdjustMode) {
      state.view = "list";
      viewToggle.querySelectorAll("[data-view]").forEach((item) => item.setAttribute("aria-pressed", String(item.dataset.view === "list")));
    }
    if (!state.portraitAdjustMode) state.activePortraitAdjustment = null;
    renderPortraitAdjustController();
    renderCards();
  });
  statsToggle.addEventListener("click", () => {
    state.statsOpen = !state.statsOpen;
    statsToggle.setAttribute("aria-expanded", String(state.statsOpen));
    renderStatistics(filteredCatalogItems());
  });
  statistics.addEventListener("click", (event) => {
    if (event.target.closest("[data-toggle-job-detail]")) {
      state.jobDetailMode = !state.jobDetailMode;
      renderStatistics(filteredCatalogItems());
      return;
    }
    if (event.target.closest("[data-close-stats]")) {
      state.statsOpen = false;
      statsToggle.setAttribute("aria-expanded", "false");
      renderStatistics([]);
    }
  });
  portraitAdjustController.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-portrait-adjustment]")) {
      state.activePortraitAdjustment = null;
      renderPortraitAdjustController();
      return;
    }
    if (event.target.closest("[data-copy-controller-adjustment]")) {
      copyText(portraitAdjustController.querySelector("[data-controller-adjustment-value]")?.textContent || "");
    }
  });
  portraitAdjustController.addEventListener("input", (event) => {
    const scaleControl = event.target.closest("[data-controller-scale]");
    const offsetYControl = event.target.closest("[data-controller-offset-y]");
    const offsetXControl = event.target.closest("[data-controller-offset-x]");
    const listOffsetYControl = event.target.closest("[data-controller-list-offset-y]");
    const iconOffsetYControl = event.target.closest("[data-controller-icon-offset-y]");
    const iconOffsetXControl = event.target.closest("[data-controller-icon-offset-x]");
    if (!scaleControl && !offsetYControl && !offsetXControl && !listOffsetYControl && !iconOffsetYControl && !iconOffsetXControl) return;
    const scale = Math.max(0.8, Math.min(2, Number(scaleControl?.value ?? portraitAdjustController.querySelector("[data-controller-scale]")?.value) || 1));
    const offsetY = Math.max(-180, Math.min(180, Number(offsetYControl?.value ?? portraitAdjustController.querySelector("[data-controller-offset-y]")?.value) || 0));
    const offsetX = Math.max(-180, Math.min(180, Number(offsetXControl?.value ?? portraitAdjustController.querySelector("[data-controller-offset-x]")?.value) || 0));
    const listOffsetY = Math.max(-180, Math.min(180, Number(listOffsetYControl?.value ?? portraitAdjustController.querySelector("[data-controller-list-offset-y]")?.value) || 0));
    const iconOffsetY = Math.max(-96, Math.min(96, Number(iconOffsetYControl?.value ?? portraitAdjustController.querySelector("[data-controller-icon-offset-y]")?.value) || 0));
    const iconOffsetX = Math.max(-96, Math.min(96, Number(iconOffsetXControl?.value ?? portraitAdjustController.querySelector("[data-controller-icon-offset-x]")?.value) || 0));
    applyPortraitAdjustment(scale, offsetY, offsetX, listOffsetY, iconOffsetY, iconOffsetX);
  });
  // 顔アイコンは詳細モーダル上で自由に動かせる。配置はキャラ・姿ごとにこの閲覧中だけ保持する。
  let facePreviewGesture = null;
  dialog.addEventListener("pointerdown", (event) => {
    const preview = event.target.closest("#detail-face-preview");
    if (!preview || preview.hidden) return;
    const mode = event.target.closest("[data-face-preview-resize]") ? "resize" : event.target.closest("[data-face-preview-handle]") ? "move" : "";
    if (!mode) return;
    const detailRect = dialog.getBoundingClientRect();
    const previewRect = preview.getBoundingClientRect();
    facePreviewGesture = {
      pointerId: event.pointerId,
      preview,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      left: previewRect.left - detailRect.left,
      top: previewRect.top - detailRect.top,
      size: previewRect.width,
    };
    preview.setPointerCapture?.(event.pointerId);
    preview.classList.add("is-dragging");
    event.preventDefault();
  });
  dialog.addEventListener("pointermove", (event) => {
    if (!facePreviewGesture || event.pointerId !== facePreviewGesture.pointerId) return;
    const gesture = facePreviewGesture;
    const detailRect = dialog.getBoundingClientRect();
    const dx = event.clientX - gesture.startX, dy = event.clientY - gesture.startY;
    let size = gesture.size;
    let left = gesture.left, top = gesture.top;
    if (gesture.mode === "resize") {
      // 顔プレビューはモーダルの外にも置ける。モーダル幅ではなく、実際の画面端までを
      // 上限にしないと、右外に出した瞬間に拡大できなくなってしまう。
      const viewportLeft = detailRect.left + left;
      const viewportTop = detailRect.top + top;
      const maxSize = Math.max(72, Math.min(
        360,
        window.innerWidth - viewportLeft - 8,
        window.innerHeight - viewportTop - 8
      ));
      size = Math.max(72, Math.min(maxSize, gesture.size + Math.max(dx, dy)));
    } else {
      const minLeft = Math.max(-size - 20, 8 - detailRect.left);
      const maxLeft = Math.min(detailRect.width + 20, window.innerWidth - 8 - detailRect.left - size);
      left = Math.max(minLeft, Math.min(maxLeft, gesture.left + dx));
      top = Math.max(0, Math.min(detailRect.height - size, gesture.top + dy));
    }
    gesture.preview.style.left = `${Math.round(left)}px`;
    gesture.preview.style.top = `${Math.round(top)}px`;
    gesture.preview.style.right = "auto";
    gesture.preview.style.width = `${Math.round(size)}px`;
    const key = gesture.preview.dataset.facePreviewKey;
    if (key) state.facePreviewLayouts.set(key, { left: Math.round(left), top: Math.round(top), size: Math.round(size) });
  });
  const finishFacePreviewGesture = (event) => {
    if (!facePreviewGesture || event.pointerId !== facePreviewGesture.pointerId) return;
    facePreviewGesture.preview.releasePointerCapture?.(event.pointerId);
    facePreviewGesture.preview.classList.remove("is-dragging");
    facePreviewGesture = null;
  };
  dialog.addEventListener("pointerup", finishFacePreviewGesture);
  dialog.addEventListener("pointercancel", finishFacePreviewGesture);
  dialog.addEventListener("click", (event) => {
    const closeFacePreview = event.target.closest("[data-face-preview-close]");
    if (closeFacePreview) {
      const preview = closeFacePreview.closest("#detail-face-preview");
      const key = preview?.dataset.facePreviewKey;
      if (key) state.facePreviewHidden.add(key);
      if (preview) preview.hidden = true;
      detail.querySelector("[data-show-face-preview]")?.removeAttribute("hidden");
      return;
    }
    const showFacePreview = event.target.closest("[data-show-face-preview]");
    if (showFacePreview) {
      const preview = dialog.querySelector("#detail-face-preview");
      const key = preview?.dataset.facePreviewKey;
      if (key) state.facePreviewHidden.delete(key);
      if (preview) preview.hidden = false;
      showFacePreview.setAttribute("hidden", "");
    }
  });
  detail.addEventListener("click", (event) => {
    const spoilerTagButton = event.target.closest("[data-reveal-spoiler-tag]");
    if (spoilerTagButton) {
      event.preventDefault();
      revealSpoilerTag(spoilerTagButton);
      return;
    }
    const tagButton = event.target.closest("[data-tag-search]");
    if (tagButton) {
      event.preventDefault();
      closeCharacter();
      searchByCatalogTag(tagButton.dataset.tagSearch);
      return;
    }
    const editComment = event.target.closest("[data-edit-comment]");
    if (editComment) {
      const form = detail.querySelector("[data-comment-form]");
      if (!form) return;
      const commentId = String(editComment.dataset.editComment || "");
      const entry = (activeDetailVariant()?.commentEntries || []).find((item) => String(item.id) === commentId);
      if (!entry) return;
      const author = String(entry.author || "");
      const value = String(entry.comment || "");
      const authorSelect = form.querySelector('[name="author"]');
      if (authorSelect) authorSelect.value = author;
      const commentIdInput = form.querySelector('[name="commentId"]');
      if (commentIdInput) commentIdInput.value = commentId;
      const commentInput = form.querySelector('[name="comment"]');
      if (commentInput) commentInput.value = value;
      const keyInput = form.querySelector('[name="writeKey"]');
      if (keyInput) keyInput.value = commentAuthorKeyOf(author);
      form.querySelector("[data-comment-submit-label]").textContent = "コメントを更新";
      form.scrollIntoView({ block: "center", behavior: "smooth" });
      commentInput?.focus();
      return;
    }
    const closeExpressionPalette = event.target.closest("[data-expression-palette-close]");
    if (closeExpressionPalette) {
      const palette = closeExpressionPalette.closest("[data-expression-palette-key]");
      const key = palette?.dataset.expressionPaletteKey;
      if (key) state.expressionPaletteHidden.add(key);
      if (palette) palette.hidden = true;
      detail.querySelector("[data-expression-palette-show]")?.removeAttribute("hidden");
      return;
    }
    const showExpressionPalette = event.target.closest("[data-expression-palette-show]");
    if (showExpressionPalette) {
      const palette = detail.querySelector("[data-expression-palette-key]");
      const key = palette?.dataset.expressionPaletteKey;
      if (key) state.expressionPaletteHidden.delete(key);
      if (palette) palette.hidden = false;
      showExpressionPalette.setAttribute("hidden", "");
      return;
    }
    const detailContentTab = event.target.closest("[data-detail-content-tab]");
    if (detailContentTab) {
      event.preventDefault();
      const detailContent = detail.querySelector(".character-detail__content");
      const scrollTop = detailContent?.scrollTop || 0;
      state.detailContentTab = detailContentTab.dataset.detailContentTab || "person";
      detail.querySelectorAll("[data-detail-content-tab]").forEach((button) => {
        button.setAttribute("aria-selected", String(button === detailContentTab));
      });
      detail.querySelectorAll(".detail-content-panel").forEach((panel) => {
        panel.hidden = panel.id !== `detail-panel-${state.detailContentTab}`;
      });
      detailContentTab.focus({ preventScroll: true });
      requestAnimationFrame(() => {
        if (detailContent) detailContent.scrollTop = scrollTop;
      });
      return;
    }
    const characterReference = event.target.closest("[data-character-reference]");
    if (characterReference) {
      const [id, variantIndex] = String(characterReference.dataset.characterReference || "").split(":");
      if (id) {
        rememberDetailScroll();
        openCharacter(id, Number(variantIndex));
      }
      return;
    }
    const mainImage = event.target.closest("#detail-main-image");
    if (mainImage) {
      openImageLightbox(mainImage.currentSrc || mainImage.src, mainImage.alt || "立ち絵");
      return;
    }
    const imageCycleButton = event.target.closest("[data-detail-image-cycle]");
    if (imageCycleButton) {
      const variant = activeDetailVariant();
      const images = detailImagesOf(variant || {});
      if (images.length < 2) return;
      const currentIndex = Math.max(0, images.findIndex((imageItem) => imageItem.key === state.detailImageMode));
      const direction = Number(imageCycleButton.dataset.detailImageCycle) < 0 ? -1 : 1;
      state.detailImageMode = images[(currentIndex + direction + images.length) % images.length].key;
      renderDetail();
      return;
    }
    if (event.target.closest("[data-copy-portrait-adjustment]")) {
      copyText(detail.querySelector("[data-portrait-adjustment-value]")?.textContent || "");
      return;
    }
    const variantTab = event.target.closest("[data-variant-index]");
    if (variantTab) { rememberDetailScroll(); state.variantIndex = Number(variantTab.dataset.variantIndex); state.detailImageMode = "normal"; renderDetail(); restoreDetailScroll(); return; }
    const faceButton = event.target.closest("[data-face-index]");
    if (faceButton) {
      const character = state.characters.find((item) => item.id === state.selectedId);
      const face = character?.variants[state.variantIndex]?.faces[Number(faceButton.dataset.faceIndex)];
      const preview = document.getElementById("detail-face-preview"), previewImage = preview?.querySelector("img"), url = safeUrl(face?.iconUrl);
      if (preview && previewImage && url) { const key = preview.dataset.facePreviewKey; if (key) state.facePreviewHidden.delete(key); previewImage.src = url; previewImage.alt = faceLabelInfo(face.label, Number(faceButton.dataset.faceIndex)).display; preview.hidden = false; detail.querySelector("[data-show-face-preview]")?.setAttribute("hidden", ""); detail.querySelectorAll("[data-face-index]").forEach((button) => button.setAttribute("aria-pressed", String(button === faceButton))); }
      return;
    }
    if (event.target.closest("[data-copy-json]")) { const character = state.characters.find((item) => item.id === state.selectedId); copyText(character?.variants[state.variantIndex]?.differenceJson || ""); return; }
    const spoiler = event.target.closest(".spoiler-text"); if (spoiler) activateSpoiler(spoiler);
  });
  detail.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-comment-form]");
    if (!form) return;
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    const statusLine = form.querySelector("[data-comment-status]");
    const formData = new FormData(form);
    const comment = String(formData.get("comment") || "").trim();
    const author = String(formData.get("author") || "").trim();
    const writeKey = String(formData.get("writeKey") || "").trim();
    const commentId = String(formData.get("commentId") || "").trim();
    if (!comment) {
      if (statusLine) statusLine.textContent = "コメントを入力してください。";
      return;
    }
    if (!author) {
      if (statusLine) statusLine.textContent = "投稿者を選んでください。";
      form.querySelector('[name="author"]')?.focus();
      return;
    }
    if (commentId && !writeKey) {
      if (statusLine) statusLine.textContent = "編集キーを入力してください。";
      form.querySelector('[name="writeKey"]')?.focus();
      return;
    }
    if (submit) submit.disabled = true;
    if (statusLine) statusLine.textContent = "コメントを保存しています…";
    try {
      const body = new URLSearchParams();
      body.set("tool", commentId ? "editComment" : "appendComment");
      ["id", "name", "variant", "system", "author", "comment"].forEach((key) => body.set(key, String(formData.get(key) || "")));
      if (commentId) body.set("commentId", commentId);
      body.set("writeKey", writeKey);
      const response = await fetch(CHARACTER_API_BASE_URL, { method: "POST", body, cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (payload?.status !== "success") throw new Error(payload?.message || "コメントを保存できませんでした。");
      if (payload.writeKey) saveCommentAuthorKey(author, payload.writeKey);
      else if (writeKey) saveCommentAuthorKey(author, writeKey);
      const character = state.characters.find((item) => item.id === state.selectedId);
      const activeVariant = character?.variants[state.variantIndex];
      if (activeVariant && String(character.id) === String(formData.get("id"))) {
        activeVariant.commentReview = String(payload.commentReview || "");
        activeVariant.commentEntries = Array.isArray(payload.commentEntries) ? payload.commentEntries : activeVariant.commentEntries;
        renderDetail();
      }
      showToast(payload.message || "コメントを保存しました。");
    } catch (error) {
      const message = error?.message || "コメントを保存できませんでした。";
      if (statusLine) statusLine.textContent = message;
    } finally {
      if (submit) submit.disabled = false;
    }
  });
  detail.addEventListener("input", (event) => {
    const scaleControl = event.target.closest("[data-portrait-scale]");
    const offsetControl = event.target.closest("[data-portrait-offset-y]");
    const offsetXControl = event.target.closest("[data-portrait-offset-x]");
    if (!scaleControl && !offsetControl && !offsetXControl) return;
    const scale = Math.max(0.8, Math.min(2, Number(detail.querySelector("[data-portrait-scale]")?.value) || 1));
    const offsetY = Math.max(-180, Math.min(180, Number(detail.querySelector("[data-portrait-offset-y]")?.value) || 0));
    const offsetX = Math.max(-180, Math.min(180, Number(detail.querySelector("[data-portrait-offset-x]")?.value) || 0));
    if (scaleControl) detail.querySelectorAll("[data-portrait-scale]").forEach((control) => { control.value = String(scale); });
    if (offsetControl) detail.querySelectorAll("[data-portrait-offset-y]").forEach((control) => { control.value = String(offsetY); });
    if (offsetXControl) detail.querySelectorAll("[data-portrait-offset-x]").forEach((control) => { control.value = String(offsetX); });
    detail.style.setProperty("--detail-portrait-scale", scale);
    detail.style.setProperty("--detail-portrait-offset-y", `${offsetY}px`);
    detail.style.setProperty("--detail-portrait-offset-x", `${offsetX}px`);
    const value = `${scale.toFixed(2)},${offsetY},${offsetX}`;
    const scaleOutput = detail.querySelector("[data-portrait-scale-output]"), offsetYOutput = detail.querySelector("[data-portrait-offset-y-output]"), offsetXOutput = detail.querySelector("[data-portrait-offset-x-output]"), result = detail.querySelector("[data-portrait-adjustment-value]");
    if (scaleOutput) scaleOutput.textContent = scale.toFixed(2);
    if (offsetYOutput) offsetYOutput.textContent = `${offsetY}px`;
    if (offsetXOutput) offsetXOutput.textContent = `${offsetX}px`;
    if (result) result.textContent = value;
  });
  detail.addEventListener("scroll", (event) => {
    if (event.target.matches(".character-detail__content")) rememberDetailScroll();
  }, true);
  detail.addEventListener("keydown", (event) => { const spoiler = event.target.closest(".spoiler-text"); if (spoiler && ["Enter", " "].includes(event.key)) { event.preventDefault(); activateSpoiler(spoiler); } });
  dialog.querySelector(".dialog-close").addEventListener("click", closeCharacter);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closeCharacter(); });
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); closeCharacter(); });
  dialog.addEventListener("close", () => document.documentElement.classList.remove("character-dialog-open"));
  imageLightbox.addEventListener("click", (event) => { if (event.target === imageLightbox || event.target === imageLightboxImage || event.target.closest(".character-image-lightbox__close")) closeImageLightbox(); });
  imageLightbox.addEventListener("cancel", (event) => { event.preventDefault(); closeImageLightbox(); });
  search.addEventListener("input", () => {
    // タグだけは表示記法まで入力しても同じ語として探せる。
    // 例: 記憶喪失 / ||記憶喪失|| / ~~記憶喪失~~ / %%記憶喪失%%。
    state.query = tagInfoOf(search.value).label.toLocaleLowerCase("ja");
    state.cardVariantIndexes.clear();
    renderCards();
  });
  systemFilter.addEventListener("change", () => { state.system = systemFilter.value; state.cardVariantIndexes.clear(); renderCards(); });
  locationFilter.addEventListener("change", () => { state.location = locationFilter.value; state.cardVariantIndexes.clear(); renderCards(); });
  yearFilter.addEventListener("change", () => { state.year = yearFilter.value; state.cardVariantIndexes.clear(); renderCards(); });
  sexFilter.addEventListener("change", () => { state.sex = sexFilter.value; state.cardVariantIndexes.clear(); renderCards(); });
  sortSelect.addEventListener("change", () => { state.sort = sortSelect.value; renderCards(); });
  activeTagFilters?.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-tag-filter]");
    if (removeButton) {
      state.tagFilters.delete(removeButton.dataset.removeTagFilter);
      renderCards();
      return;
    }
    if (event.target.closest("[data-clear-tag-filters]")) {
      state.tagFilters.clear();
      renderCards();
    }
  });
  viewToggle.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (!button) return;
    state.view = button.dataset.view === "grid" ? "grid" : "list";
    viewToggle.querySelectorAll("[data-view]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    renderCards();
  });
  catalogModeToggle.addEventListener("click", (event) => {
    const button = event.target.closest("[data-catalog-mode]");
    if (!button) return;
    state.catalogMode = button.dataset.catalogMode === "variants" ? "variants" : "unique";
    state.cardVariantIndexes.clear();
    catalogModeToggle.querySelectorAll("[data-catalog-mode]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    renderCards();
  });
  // 一覧表示を待たせず、投稿者候補は並行で取得する。
  loadCommentAuthors();
  loadCharacters();
})();

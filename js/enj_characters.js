(() => {
  "use strict";

  const CHARACTER_API_URL =
    "https://script.google.com/macros/s/AKfycbx9NnqKeIqA9TehZa9sxdYK_gsoWWtTcOK3pessvmOY_61_yXDi2wkHQt-6n7oj6A/exec?tool=characters";
  const LOCAL_PREVIEW_URL = "data/enj_characters.preview.json";
  const COLOR_NAMES = "red|orange|yellow|green|cyan|blue|purple|pink|gray";
  // NJMC / エンパイア以外は、名鑑に現れた順で距離感のある仮名にする。
  // シートには実際の場所名を入れたままでよい。
  const PRIMARY_LOCATION_NAMES = new Set(["NJMC", "エンパイア"]);
  const REMOTE_LOCATION_NAMES = ["あっち", "そっち", "向こう", "よそ", "どこか", "遠く", "かなた"];
  const locationDisplayNames = new Map();
  const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);

  const state = { characters: [], query: "", system: "", location: "", year: "", sex: "", sort: "id-desc", view: "list", catalogMode: "unique", selectedId: null, variantIndex: 0, detailImageMode: "normal", cardVariantIndexes: new Map(), detailScrollPositions: new Map(), mergeSelection: null, portraitAdjustMode: false, activePortraitAdjustment: null, catalogScrollY: 0, openedFromUrl: false, statsOpen: false, jobDetailMode: false };
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
  const dialog = document.getElementById("character-dialog");
  const imageLightbox = document.getElementById("character-image-lightbox");
  const imageLightboxImage = document.getElementById("character-image-lightbox-image");
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
    let text = String(value ?? "").replace(/\[\[([^\[\]\n]+)\]\]/g, (match, target) => {
      // [[表示名>名前#ID]] とすると、文中の表記と検索先を分けられる。
      // 旧来の | も受け付けるが、新規記入は > を使う。
      const separator = target.includes(">") ? ">" : "|";
      const [labelSource, referenceSource] = target.split(separator).map((part) => part.trim());
      const reference = characterReferenceOf(referenceSource || labelSource);
      if (!reference) return match;
      const key = `\u0000REF${tokens.length}\u0000`;
      // ファイル名の貼り付けだけは読めるキャラ名に置換する。
      // [[テオドラ]] のような呼称は、書いた表記をそのまま見せる。
      const label = referenceSource
        ? (labelSource || reference.label || `#${reference.id}`)
        : (reference.autoLabel ? reference.label : (labelSource || reference.label || `#${reference.id}`));
      tokens.push(`<button class="character-reference" type="button" data-character-reference="${escapeHtml(`${reference.id}:${reference.variantIndex}`)}">${escapeHtml(label)}</button>`);
      return key;
    }).replace(/`([^`\n]+)`/g, (_match, code) => {
      const key = `\u0000CODE${tokens.length}\u0000`;
      tokens.push(`<code>${escapeHtml(code)}</code>`);
      return key;
    });
    text = escapeHtml(text);
    const openColor = new RegExp(`&lt;span class=(?:&quot;|&#39;)(${COLOR_NAMES})(?:&quot;|&#39;)&gt;`, "gi");
    text = text.replace(openColor, (_match, color) => `<span class="md-color-${color.toLowerCase()}">`);
    text = text.replace(/&lt;\/span&gt;/gi, "</span>");
    text = text.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (_match, label, url) => {
      const href = safeUrl(url);
      return href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
    });
    text = text.replace(/\|\|(.+?)\|\|/g, '<span class="spoiler-text" role="button" tabindex="0" aria-label="ネタバレを表示">$1</span>');
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
    tokens.forEach((html, index) => {
      text = text.replace(`\u0000REF${index}\u0000`, html);
      text = text.replace(`\u0000CODE${index}\u0000`, html);
    });
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
    const flushParagraph = () => { if (paragraph.length) blocks.push(`<p>${paragraph.map(inlineMarkdown).join("<br>")}</p>`); paragraph = []; };
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
    const [scale, offsetY, offsetX, listOffsetY] = String(value).trim().split(/[，,\s]+/);
    const parsedScale = Number(scale), parsedOffsetY = Number(offsetY), parsedOffsetX = Number(offsetX), parsedListOffsetY = Number(listOffsetY);
    return {
      ...(Number.isFinite(parsedScale) ? { scale: parsedScale } : {}),
      ...(Number.isFinite(parsedOffsetY) ? { offsetY: parsedOffsetY } : {}),
      ...(Number.isFinite(parsedOffsetX) ? { offsetX: parsedOffsetX } : {}),
      // 4項目目は一覧右側だけに足す上下補正。空欄なら従来と同じ 0。
      ...(Number.isFinite(parsedListOffsetY) ? { listOffsetY: parsedListOffsetY } : {})
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
        return {
        ...variant,
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
  const cardTaglineOf = (variant) => String(variant.epithet || variant.catchCopy || "").trim();
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
  function characterQuotesHtml(value) {
    const groups = quoteGroupsOf(value);
    return groups.length ? `<div class="detail-quotes">${groups.map((lines) => `<blockquote class="detail-quote detail-richtext">${renderMarkdown(lines.join("\n"))}</blockquote>`).join("")}</div>` : "";
  }
function quoteSpotlightHtml(value) {
  const groups = quoteGroupsOf(value);
  if (!groups.length) return "";
  const verticalText = (text) => escapeHtml(text)
    // Half-width punctuation has no reliable vertical alternate in all Mincho fonts.
    // Normalize it here so the vertical quotation always keeps a one-character cell.
    .replace(/[!?]/g, (mark) => mark === "!" ? "！" : "？")
    .replace(/\d{1,4}/g, (digits) => `<span class="vertical-tcy">${digits}</span>`);
    return `<div class="detail-quote-spotlight" aria-label="代表セリフ">${groups.map((lines, index) => {
      const text = lines.join("\n");
      const compact = text.replace(/\s/g, "").length > 54 ? " is-compact" : "";
      return `<p class="detail-quote-spotlight__line${index === 0 ? " is-active" : ""}${compact}" data-quote-spotlight-index="${index}">${verticalText(text)}</p>`;
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
  function locationSortKey(variant) {
    const locations = locationsOf(variant.location);
    const rank = locations.includes("NJMC") ? 0 : locations.includes("エンパイア") ? 1 : 2;
    return `${rank}:${locationLabelsOf(variant).join("、")}`;
  }
  const characterSearchText = (character) => [character.registrationName, character.id, ...character.variants.flatMap((variant) => [variant.name, variant.variant, variant.epithet, variant.catchCopy, variant.system, variant.location, ...locationLabelsOf(variant), variant.sex, variant.keyword, variant.intro, variant.job])].filter(Boolean).join(" ").toLocaleLowerCase("ja");
  const variantSearchText = (character, variant) => [character.registrationName, character.id, variant.name, variant.variant, variant.epithet, variant.catchCopy, variant.system, variant.location, ...locationLabelsOf(variant), variant.sex, variant.keyword, variant.intro, variant.job].filter(Boolean).join(" ").toLocaleLowerCase("ja");
  function yearOf(value) {
    const year = String(value || "").match(/(?:^|\D)(\d{4})(?:\D|$)/)?.[1];
    return year || "";
  }
  const variantMatchesFilters = (variant) =>
    (!state.system || variant.system === state.system) &&
    (!state.location || locationsOf(variant.location).includes(state.location)) &&
    (!state.year || yearOf(variant.debut) === state.year) &&
    (!state.sex || genderCategoryOf(variant.sex) === state.sex);
  function cardVariantIndexOf(character) {
    const selectedIndex = state.cardVariantIndexes.get(character.id);
    if (Number.isInteger(selectedIndex) && character.variants[selectedIndex]) return selectedIndex;
    if (!state.system && !state.location && !state.year && !state.sex) return character.representativeIndex;
    const matchedIndex = character.variants.findIndex(variantMatchesFilters);
    return matchedIndex >= 0 ? matchedIndex : character.representativeIndex;
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
      .filter((character) => (!state.query || characterSearchText(character).includes(state.query)) && character.variants.some(variantMatchesFilters))
      .map((character) => {
        const variantIndex = cardVariantIndexOf(character);
        return { character, variantIndex, variant: character.variants[variantIndex] || representativeOf(character), grouped: true };
      });
    if (state.catalogMode === "unique") return grouped.sort(compareCatalogItems);
    return state.characters.flatMap((character) => character.variants.map((variant, variantIndex) => ({ character, variant, variantIndex, grouped: false })))
      .filter((item) => (!state.query || variantSearchText(item.character, item.variant).includes(state.query)) && variantMatchesFilters(item.variant))
      .sort(compareCatalogItems);
  }

  function renderCards() {
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
      const systemLabels = (systems.length ? systems : ["OTHER"]).map((system) => `<span class="${system === variant.system ? "is-current" : "is-other"}" style="--label-system-color:${escapeHtml(systemColorOf(system))}">${escapeHtml(system)}</span>`).join("");
      const nextIndex = (variantIndex + 1) % character.variants.length;
      const nextVariant = character.variants[nextIndex] || {};
      const sortIndicator = sortIndicatorOf(variant);
      const cycleButton = grouped && character.variants.length > 1 ? `<button class="character-card__variant-cycle" type="button" data-cycle-variant aria-label="次の姿「${escapeHtml(nextVariant.variant || nextVariant.name || nextVariant.system || `姿${nextIndex + 1}`)}」へ切り替える" title="次の姿へ切替"><i class="fa-solid fa-repeat" aria-hidden="true"></i><span>${variantIndex + 1}/${character.variants.length}</span></button>` : "";
      const adjustButton = state.portraitAdjustMode ? `<button class="character-card__portrait-adjust" type="button" data-adjust-portrait aria-label="${escapeHtml(displayName)}の立ち絵を調整" title="立ち絵調整"><i class="fa-solid fa-sliders" aria-hidden="true"></i></button>` : "";
      return `<article class="character-card${grouped && character.variants.length > 1 ? " has-variants" : ""}" tabindex="0" data-character-id="${escapeHtml(character.id)}" data-card-variant-index="${variantIndex}" aria-label="${escapeHtml(displayName)}を開く" title="${escapeHtml(displayName)}" style="--character-system-color:${escapeHtml(systemColorOf(variant.system))}">
        <div class="character-card__visual">${visualImage ? `<img${sharedPortraitSource ? ' class="is-body-preview"' : ""} src="${escapeHtml(visualImage)}" alt="${escapeHtml(displayName)}" loading="lazy" decoding="async" fetchpriority="low" data-image-candidates="${escapeHtml(JSON.stringify(visualCandidates))}">` : `<span class="character-card__initial" aria-hidden="true">${escapeHtml(displayName.slice(0, 1))}</span>`}</div>
        ${sidePortrait ? `<div class="character-card__portrait-window" aria-hidden="true"><img src="${escapeHtml(sidePortrait)}" alt="" loading="lazy" decoding="async" fetchpriority="low" style="--card-portrait-list-scale:${escapeHtml(listPortraitScaleFor(null, portraitScaleOf(variant)).toFixed(3))};--card-portrait-list-offset-y:${escapeHtml(listPortraitOffsetYOf(variant).toFixed(2))}px;--card-portrait-list-offset-x:${escapeHtml((portraitOffsetXOf(variant) * 0.25).toFixed(2))}px"></div>` : ""}
        <div class="character-card__body"><p class="character-card__systems">${systemLabels}${sortIndicator}</p>${cardTaglineOf(variant) ? `<p class="character-card__tagline">${escapeHtml(cardTaglineOf(variant))}</p>` : ""}<h2>${escapeHtml(displayName)}</h2><p class="character-card__intro">${cardSummaryHtmlOf(variant)}</p></div>
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
      .filter(({ variant }) => String(variant.differenceJson || "").trim()))
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
    return character && variant ? { character, variant } : null;
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

  function setPortraitControllerVariables(scale, offsetY, offsetX, listOffsetY = 0) {
    const geometry = detailPreviewGeometry();
    portraitAdjustController.style.setProperty("--detail-portrait-scale", scale);
    portraitAdjustController.style.setProperty("--list-portrait-scale", scale);
    // 詳細枠は画面サイズで縦横比が変わるため、プレビューも同じ比率・実寸換算にする。
    portraitAdjustController.style.setProperty("--controller-detail-preview-width", `${geometry.previewWidth}px`);
    portraitAdjustController.style.setProperty("--controller-detail-preview-height", `${geometry.previewHeight}px`);
    portraitAdjustController.style.setProperty("--controller-detail-offset-y", `${(offsetY * geometry.offsetScaleY).toFixed(2)}px`);
    portraitAdjustController.style.setProperty("--controller-detail-offset-x", `${(offsetX * geometry.offsetScaleX).toFixed(2)}px`);
    // 一覧は上半身トリミング用の独立した縦位置。詳細の上下値は混ぜない。
    portraitAdjustController.style.setProperty("--list-portrait-offset-y", `${listOffsetY}px`);
    portraitAdjustController.style.setProperty("--list-portrait-offset-x", `${(offsetX * 0.25).toFixed(2)}px`);
  }

  function renderPortraitAdjustController() {
    const active = activePortraitAdjustment();
    if (!state.portraitAdjustMode || !active) {
      portraitAdjustController.hidden = true;
      return;
    }
    const { character, variant, variantIndex } = active;
    const scale = portraitScaleOf(variant), offsetY = portraitOffsetYOf(variant), offsetX = portraitOffsetXOf(variant), listOffsetY = listPortraitOffsetYOf(variant);
    // 詳細と同じURLを使い、ブラウザキャッシュも共有する。
    const image = detailImageOf(variant) || "";
    portraitAdjustController.hidden = false;
    setPortraitControllerVariables(scale, offsetY, offsetX, listOffsetY);
    portraitAdjustController.innerHTML = `<header><strong>#${escapeHtml(String(character.id).padStart(3, "0"))} ${escapeHtml(variant.name || character.registrationName)}</strong><button type="button" data-close-portrait-adjustment aria-label="閉じる"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></header><p>シートへ貼る値：<code data-controller-adjustment-value>${scale.toFixed(2)},${offsetY},${offsetX},${listOffsetY}</code></p><div class="portrait-adjust-controller__previews"><figure><figcaption>詳細（共通値）</figcaption><div class="portrait-adjust-controller__detail-preview">${image ? `<img src="${escapeHtml(image)}" alt="">` : ""}</div></figure><figure><figcaption>一覧右側</figcaption><div class="portrait-adjust-controller__list-preview">${image ? `<img src="${escapeHtml(image)}" alt="">` : ""}</div></figure></div><div class="portrait-adjust-controller__controls"><label><span>倍率 <output data-controller-scale-output>${scale.toFixed(2)}</output></span><input type="range" min="0.8" max="1.3" step="0.01" value="${scale}" data-controller-scale><input type="number" min="0.8" max="1.3" step="0.01" value="${scale}" data-controller-scale></label><label><span>共通上下 <output data-controller-offset-y-output>${offsetY}px</output></span><input type="range" min="-180" max="180" step="1" value="${offsetY}" data-controller-offset-y><input type="number" min="-180" max="180" step="1" value="${offsetY}" data-controller-offset-y></label><label><span>左右 <output data-controller-offset-x-output>${offsetX}px</output></span><input type="range" min="-180" max="180" step="1" value="${offsetX}" data-controller-offset-x><input type="number" min="-180" max="180" step="1" value="${offsetX}" data-controller-offset-x></label><label><span>一覧上下 <output data-controller-list-offset-y-output>${listOffsetY}px</output></span><input type="range" min="-180" max="180" step="1" value="${listOffsetY}" data-controller-list-offset-y><input type="number" min="-180" max="180" step="1" value="${listOffsetY}" data-controller-list-offset-y></label></div><button class="portrait-adjust-controller__copy" type="button" data-copy-controller-adjustment><i class="fa-regular fa-copy" aria-hidden="true"></i>値をコピー</button>`;
    portraitAdjustController.querySelectorAll("[data-controller-scale]").forEach((control) => { control.max = "2"; control.setAttribute("list", "portrait-scale-mark"); control.title = "標準上限は 1.30。2.00 まで拡大できます。"; });
  }

  function applyPortraitAdjustment(scale, offsetY, offsetX, listOffsetY) {
    const active = activePortraitAdjustment();
    if (!active) return;
    const { character, variant, variantIndex } = active;
    variant.portraitScale = scale;
    variant.portraitOffsetY = offsetY;
    variant.portraitOffsetX = offsetX;
    variant.listPortraitOffsetY = listOffsetY;
    setPortraitControllerVariables(scale, offsetY, offsetX, listOffsetY);
    portraitAdjustController.querySelectorAll("[data-controller-scale]").forEach((control) => { control.value = String(scale); });
    portraitAdjustController.querySelectorAll("[data-controller-offset-y]").forEach((control) => { control.value = String(offsetY); });
    portraitAdjustController.querySelectorAll("[data-controller-offset-x]").forEach((control) => { control.value = String(offsetX); });
    portraitAdjustController.querySelectorAll("[data-controller-list-offset-y]").forEach((control) => { control.value = String(listOffsetY); });
    portraitAdjustController.querySelector("[data-controller-scale-output]").textContent = scale.toFixed(2);
    portraitAdjustController.querySelector("[data-controller-offset-y-output]").textContent = `${offsetY}px`;
    portraitAdjustController.querySelector("[data-controller-offset-x-output]").textContent = `${offsetX}px`;
    portraitAdjustController.querySelector("[data-controller-list-offset-y-output]").textContent = `${listOffsetY}px`;
    portraitAdjustController.querySelector("[data-controller-adjustment-value]").textContent = `${scale.toFixed(2)},${offsetY},${offsetX},${listOffsetY}`;
    [...grid.querySelectorAll("[data-character-id]")].filter((card) => card.dataset.characterId === character.id && Number(card.dataset.cardVariantIndex) === variantIndex).forEach((card) => {
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
    const facts = entries.map(([label, value]) => detailFact(label, value)).join("");
    return facts ? `<section class="detail-fact-group ${extraClass}"><h3><i class="${icon}" aria-hidden="true"></i>${escapeHtml(title)}</h3><dl>${facts}</dl></section>` : "";
  }
  function detailAction(url, icon, label) {
    const href = safeUrl(url);
    return href ? `<a class="detail-action" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"><i class="${icon}" aria-hidden="true"></i>${escapeHtml(label)}</a>` : "";
  }
  const richSection = (title, value) => value ? `<section class="detail-section"><h3>${escapeHtml(title)}</h3><div class="detail-richtext">${renderMarkdown(value)}</div></section>` : "";

  function renderDetail() {
    stopQuoteSpotlight();
    const character = state.characters.find((item) => item.id === state.selectedId);
    if (!character) return;
    const variant = character.variants[state.variantIndex] || representativeOf(character);
    const detailImages = detailImagesOf(variant);
    const hasAlternateImage = detailImages.length > 1;
    if (!detailImages.some((imageItem) => imageItem.key === state.detailImageMode)) state.detailImageMode = "normal";
    const image = detailImageOf(variant, state.detailImageMode);
    const headerMeta = [
      variant.location ? `<span><i class="fa-solid fa-location-dot" aria-hidden="true"></i>${escapeHtml(locationLabelsOf(variant).join(" / "))}</span>` : "",
      variant.debut ? `<time datetime="${escapeHtml(variant.debut)}"><i class="fa-regular fa-calendar" aria-hidden="true"></i>初登場 ${escapeHtml(variant.debut)}</time>` : ""
    ].filter(Boolean).join("");
    const facts = [
      detailFactGroup("特徴", "fa-solid fa-fingerprint", [["ジョブ", variant.job], ["アライメント", variant.alignment], ["髪色", variant.hair]], "detail-fact-group--features"),
      detailFactGroup("人物", "fa-solid fa-user", [["性別", variant.sex], ["年齢", variant.age], ["身長", variant.height]]),
      detailFactGroup("呼び方", "fa-solid fa-comments", [["一人称", variant.firstPerson], ["二人称", variant.secondPerson]])
    ].join("");
    const actions = [detailAction(variant.driveUrl, "fa-brands fa-google-drive", "Driveを開く"), detailAction(variant.characterSheetUrl, "fa-regular fa-file-lines", "キャラシを開く")].join("");
    const variantTabs = character.variants.length > 1 ? `<nav class="variant-tabs" aria-label="姿・システムを切り替え"><span>切替</span>${character.variants.map((item, index) => {
      const label = item.variant || item.system || `姿 ${index + 1}`;
      return `<button class="variant-tab" type="button" data-variant-index="${index}" aria-selected="${index === state.variantIndex}">${escapeHtml(label)}</button>`;
    }).join("")}</nav>` : "";
    const imageSwitcher = hasAlternateImage ? `<div class="detail-image-switcher" role="group" aria-label="立ち絵を切り替え"><button type="button" data-detail-image-cycle="-1" data-tooltip="前の立ち絵" aria-label="前の立ち絵を表示"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button><button type="button" data-detail-image-cycle="1" data-tooltip="次の立ち絵" aria-label="次の立ち絵を表示"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button></div>` : "";
    const faceImage = displayableImageUrl(variant.faceUrl);
    const facePreview = faceImage
      ? `<div id="detail-face-preview" class="detail-face-preview"><img src="${escapeHtml(faceImage)}" alt="${escapeHtml(`${variant.name || character.registrationName}の顔画像`)}"><span aria-hidden="true">FACE</span></div>`
      : `<div id="detail-face-preview" class="detail-face-preview" hidden><img alt=""><span aria-hidden="true">FACE</span></div>`;
    const expressionSection = variant.faces.length ? `<section class="detail-section expression-section"><div class="expression-heading"><div><h3>ココフォリア表情 <small>${variant.faces.length}</small></h3><p>選んだ表情をこの場所で確認できます。</p></div><div class="expression-heading__actions">${variant.fullBodyUrl ? '<button class="expression-reset" type="button" data-show-fullbody><i class="fa-solid fa-person" aria-hidden="true"></i> 全身図のみ</button>' : ""}${variant.differenceJson ? '<button class="expression-reset" type="button" data-copy-json><i class="fa-regular fa-copy" aria-hidden="true"></i> 表情をコピー</button>' : ""}</div></div><div class="expression-preview-row">${facePreview}</div><div class="expression-grid">${variant.faces.map((face, index) => {
      const faceUrl = safeUrl(face.iconUrl);
      return faceUrl ? `<button class="expression-button" type="button" data-face-index="${index}" aria-pressed="false" title="${escapeHtml(face.label || `差分${index + 1}`)}"><img src="${escapeHtml(faceUrl)}" alt="${escapeHtml(face.label || `差分${index + 1}`)}" loading="lazy"><span>${escapeHtml(face.label || `差分${index + 1}`)}</span></button>` : "";
    }).join("")}</div></section>` : "";
    const portraitScale = portraitScaleOf(variant), portraitOffsetY = portraitOffsetYOf(variant), portraitOffsetX = portraitOffsetXOf(variant);
    const listPreviewImage = bodyImageCandidatesOf(variant)[0] || "";
    const portraitTuning = `<details class="portrait-tuning"><summary><i class="fa-solid fa-sliders" aria-hidden="true"></i>立ち絵調整</summary><p>倍率・上下・左右を試し、値をシートの「立ち絵調整」列へ貼り付けます。下のプレビューは一覧右側と同じ縮小換算です。</p><div class="portrait-tuning__control"><label>倍率 <output data-portrait-scale-output>${portraitScale.toFixed(2)}</output></label><input type="range" min="0.8" max="1.3" step="0.01" value="${portraitScale}" data-portrait-scale><input type="number" min="0.8" max="1.3" step="0.01" value="${portraitScale}" data-portrait-scale></div><div class="portrait-tuning__control"><label>上下位置 <output data-portrait-offset-y-output>${portraitOffsetY}px</output></label><input type="range" min="-180" max="180" step="1" value="${portraitOffsetY}" data-portrait-offset-y><input type="number" min="-180" max="180" step="1" value="${portraitOffsetY}" data-portrait-offset-y></div><div class="portrait-tuning__control"><label>左右位置 <output data-portrait-offset-x-output>${portraitOffsetX}px</output></label><input type="range" min="-180" max="180" step="1" value="${portraitOffsetX}" data-portrait-offset-x><input type="number" min="-180" max="180" step="1" value="${portraitOffsetX}" data-portrait-offset-x></div>${listPreviewImage ? `<div class="portrait-tuning__list-preview"><span>一覧右側プレビュー</span><div><img src="${escapeHtml(listPreviewImage)}" alt="" aria-hidden="true"></div></div>` : ""}<div class="portrait-tuning__result"><code data-portrait-adjustment-value>${portraitScale.toFixed(2)},${portraitOffsetY},${portraitOffsetX}</code><button type="button" data-copy-portrait-adjustment><i class="fa-regular fa-copy" aria-hidden="true"></i>値をコピー</button></div></details>`;
    detail.className = "character-detail";
    detail.style.setProperty("--character-system-color", systemColorOf(variant.system));
    detail.style.setProperty("--detail-portrait-scale", portraitScaleOf(variant));
    detail.style.setProperty("--detail-portrait-offset-y", `${portraitOffsetYOf(variant)}px`);
    detail.style.setProperty("--detail-portrait-offset-x", `${portraitOffsetXOf(variant)}px`);
    detail.innerHTML = `<div class="character-detail__visual"><span class="detail-visual-id" aria-hidden="true">#${escapeHtml(String(character.id).padStart(3, "0"))}</span>${image ? `<img id="detail-main-image" src="${escapeHtml(image)}" alt="${escapeHtml(variant.name || character.registrationName)}">` : `<span class="character-detail__image-placeholder" aria-hidden="true">${escapeHtml(character.registrationName.slice(0, 1))}</span>`}${quoteSpotlightHtml(variant.quote)}${imageSwitcher}</div>
      <div class="character-detail__content"><p class="detail-kicker">#${escapeHtml(character.id)}${variant.system ? ` ・ ${escapeHtml(variant.system)}` : ""}</p><h2 id="detail-name">${escapeHtml(variant.name || character.registrationName)}</h2>${headerMeta ? `<div class="detail-meta">${headerMeta}</div>` : ""}${variantTabs}
        ${variant.intro ? `<div class="detail-lead detail-richtext">${renderMarkdown(variant.intro)}</div>` : ""}${actions ? `<div class="detail-actions">${actions}</div>` : ""}${facts ? `<div class="detail-facts">${facts}</div>` : ""}
        <div class="detail-sections">${richSection("性格", variant.personality)}${richSection("好き・大事", variant.likes)}${richSection("苦手・弱点", variant.weaknesses)}${richSection("関係キャラ", variant.relations)}${richSection("見どころ", variant.highlights)}${richSection("モチーフ・制作意図", variant.motif)}${richSection("キャラ語り", variant.commentary)}</div>${variant.quote ? `<section class="detail-section detail-quotes-section"><h3>セリフ集</h3>${characterQuotesHtml(variant.quote)}</section>` : ""}${expressionSection}
      </div>`;
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
  function openCharacter(id, variantIndex = null, options = {}) {
    const character = state.characters.find((item) => item.id === String(id));
    if (!character) return;
    if (!dialog.open) rememberCatalogScroll();
    state.openedFromUrl = Boolean(options.fromUrl);
    state.selectedId = character.id;
    state.variantIndex = variantIndex === null ? character.representativeIndex : Number(variantIndex);
    state.detailImageMode = "normal";
    renderDetail();
    if (!dialog.open) dialog.showModal();
    restoreDetailScroll();
    document.documentElement.classList.add("character-dialog-open");
  }
  function closeCharacter() {
    rememberDetailScroll();
    stopQuoteSpotlight();
    closeImageLightbox();
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove("character-dialog-open");
    state.selectedId = null;
    if (state.openedFromUrl) history.replaceState(null, "", location.pathname);
    state.openedFromUrl = false;
    restoreCatalogScroll();
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
  function runCharacterMerge() {
    if (!state.characters.length) { mergeStatus.textContent = "名鑑データを読み込み中です。少し待ってください。"; return; }
    const result = mergeCharacterJson(mergeInput.value, state.mergeSelection);
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

  async function loadCharacters() {
    status.hidden = false;
    try {
      let payload = null, lastError = null;
      const sources = [CHARACTER_API_URL, LOCAL_PREVIEW_URL];
      for (const source of sources) {
        try {
          // Apps Script / 中継CDNが同じURLの古い応答を返すことがあるため、
          // 本番APIだけは毎回読み込み用の識別子を付けて最新のシートを取得する。
          const requestUrl = source === CHARACTER_API_URL
            ? `${source}&_=${Date.now()}`
            : source;
          const response = await fetch(requestUrl, { cache: "no-store" });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const candidate = await response.json();
          if (candidate.status !== "success" || !Array.isArray(candidate.characters)) throw new Error(candidate.message || "Unexpected response");
          payload = candidate;
          break;
        } catch (error) { lastError = error; }
      }
      if (!payload) throw lastError || new Error("Character data could not be loaded");
      state.characters = payload.characters.map(normalizeCharacter).filter((character) => character.variants.length);
      buildLocationDisplayNames();
    } catch (error) {
      console.warn("Character API could not be loaded.", error);
      status.textContent = "キャラクターデータを読み込めませんでした。少し待ってから再読み込みしてください。";
      count.textContent = "0 characters";
      return;
    }
    status.hidden = true;
    if (!state.characters.length) {
      grid.innerHTML = '<div class="catalog-empty"><h2>表示できるキャラクターがいません</h2><p>スプレッドシートで「非公開」にしていない行が表示対象です。</p></div>';
      count.textContent = "0 characters"; return;
    }
    renderSystemFilter(); renderMergeSelect(); renderCards();
    const initialId = new URLSearchParams(location.search).get("id");
    if (initialId) openCharacter(initialId, null, { fromUrl: true });
  }

  grid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-character-id]");
    if (!card) return;
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
  grid.addEventListener("keydown", (event) => { if (event.target.closest("[data-cycle-variant]") || !["Enter", " "].includes(event.key)) return; const card = event.target.closest("[data-character-id]"); if (card) { event.preventDefault(); openCharacter(card.dataset.characterId, card.dataset.cardVariantIndex); } });
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
    if (!scaleControl && !offsetYControl && !offsetXControl && !listOffsetYControl) return;
    const scale = Math.max(0.8, Math.min(2, Number(scaleControl?.value ?? portraitAdjustController.querySelector("[data-controller-scale]")?.value) || 1));
    const offsetY = Math.max(-180, Math.min(180, Number(offsetYControl?.value ?? portraitAdjustController.querySelector("[data-controller-offset-y]")?.value) || 0));
    const offsetX = Math.max(-180, Math.min(180, Number(offsetXControl?.value ?? portraitAdjustController.querySelector("[data-controller-offset-x]")?.value) || 0));
    const listOffsetY = Math.max(-180, Math.min(180, Number(listOffsetYControl?.value ?? portraitAdjustController.querySelector("[data-controller-list-offset-y]")?.value) || 0));
    applyPortraitAdjustment(scale, offsetY, offsetX, listOffsetY);
  });
  detail.addEventListener("click", (event) => {
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
      if (preview && previewImage && url) { previewImage.src = url; previewImage.alt = face.label || "表情差分"; preview.hidden = false; detail.querySelectorAll("[data-face-index]").forEach((button) => button.setAttribute("aria-pressed", String(button === faceButton))); }
      return;
    }
    if (event.target.closest("[data-show-fullbody]")) {
      const preview = document.getElementById("detail-face-preview");
      if (preview) preview.hidden = true;
      detail.querySelectorAll("[data-face-index]").forEach((button) => button.setAttribute("aria-pressed", "false"));
      return;
    }
    if (event.target.closest("[data-copy-json]")) { const character = state.characters.find((item) => item.id === state.selectedId); copyText(character?.variants[state.variantIndex]?.differenceJson || ""); return; }
    const spoiler = event.target.closest(".spoiler-text"); if (spoiler) activateSpoiler(spoiler);
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
  search.addEventListener("input", () => { state.query = search.value.trim().toLocaleLowerCase("ja"); renderCards(); });
  systemFilter.addEventListener("change", () => { state.system = systemFilter.value; state.cardVariantIndexes.clear(); renderCards(); });
  locationFilter.addEventListener("change", () => { state.location = locationFilter.value; state.cardVariantIndexes.clear(); renderCards(); });
  yearFilter.addEventListener("change", () => { state.year = yearFilter.value; state.cardVariantIndexes.clear(); renderCards(); });
  sexFilter.addEventListener("change", () => { state.sex = sexFilter.value; state.cardVariantIndexes.clear(); renderCards(); });
  sortSelect.addEventListener("change", () => { state.sort = sortSelect.value; renderCards(); });
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
  loadCharacters();
})();

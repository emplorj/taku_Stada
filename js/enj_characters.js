(() => {
  "use strict";

  const CHARACTER_API_URL =
    "https://script.google.com/macros/s/AKfycbx9NnqKeIqA9TehZa9sxdYK_gsoWWtTcOK3pessvmOY_61_yXDi2wkHQt-6n7oj6A/exec?tool=characters";
  const LOCAL_PREVIEW_URL = "data/enj_characters.preview.json";
  const COLOR_NAMES = "red|orange|yellow|green|cyan|blue|purple|pink|gray";
  const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);

  const state = { characters: [], query: "", system: "", location: "", year: "", sex: "", sort: "id-asc", view: "list", selectedId: null, variantIndex: 0, cardVariantIndexes: new Map() };
  const grid = document.getElementById("character-grid");
  const search = document.getElementById("character-search");
  const systemFilter = document.getElementById("system-filter");
  const locationFilter = document.getElementById("location-filter");
  const yearFilter = document.getElementById("year-filter");
  const sexFilter = document.getElementById("sex-filter");
  const sortSelect = document.getElementById("sort-select");
  const viewToggle = document.querySelector(".catalog-view-toggle");
  const count = document.getElementById("catalog-count");
  const status = document.getElementById("catalog-status");
  const dialog = document.getElementById("character-dialog");
  const detail = document.getElementById("character-detail");
  const toast = document.getElementById("catalog-toast");
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

  function inlineMarkdown(value) {
    const tokens = [];
    let text = String(value ?? "").replace(/`([^`\n]+)`/g, (_match, code) => {
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
    tokens.forEach((html, index) => { text = text.replace(`\u0000CODE${index}\u0000`, html); });
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

  function normalizeCharacter(character) {
    const variants = Array.isArray(character.variants) ? character.variants : [];
    return {
      ...character,
      id: String(character.id ?? ""),
      registrationName: character.registrationName || variants[0]?.name || "名称未設定",
      representativeIndex: Math.max(0, Math.min(Number(character.representativeIndex) || 0, Math.max(variants.length - 1, 0))),
      variants: variants.map((variant) => ({ ...variant, faces: Array.isArray(variant.faces) ? variant.faces : [] })),
    };
  }

  const representativeOf = (character) => character.variants[character.representativeIndex] || character.variants[0] || {};
  function displayableImageUrl(value) {
    const url = safeUrl(value);
    if (!url) return "";
    const driveFile = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    const parsedUrl = new URL(url);
    const driveOpen = parsedUrl.hostname === "drive.google.com" && parsedUrl.pathname === "/open" ? parsedUrl.searchParams.get("id") : "";
    const driveId = driveFile?.[1] || driveOpen;
    return driveId ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveId)}&sz=w1200` : url;
  }
  const imageCandidatesOf = (variant) => [variant.iconUrl, variant.imageUrl, variant.faceUrl, variant.fullBodyUrl, variant.faces?.[0]?.iconUrl]
    .map(displayableImageUrl).filter(Boolean);
  const imageOf = (variant) => imageCandidatesOf(variant)[0] || "";
  const catalogImageCandidatesOf = (character, variant) => {
    const representative = representativeOf(character);
    return [...new Set([...imageCandidatesOf(representative), ...imageCandidatesOf(variant)])];
  };
  const detailImageOf = (variant) => displayableImageUrl(variant.fullBodyUrl || variant.imageUrl || variant.faceUrl || variant.faces?.[0]?.iconUrl);
  const cardSummaryOf = (variant) => variant.intro || [
    variant.job,
    variant.age ? `${variant.age}歳` : "",
    variant.variant,
  ].filter(Boolean).join(" / ") || variant.name || "プロフィール未入力";
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
  const characterSearchText = (character) => [character.registrationName, character.id, ...character.variants.flatMap((variant) => [variant.name, variant.variant, variant.system, variant.location, variant.sex, variant.keyword, variant.intro, variant.job])].filter(Boolean).join(" ").toLocaleLowerCase("ja");
  function yearOf(value) {
    const year = String(value || "").match(/(?:^|\D)(\d{4})(?:\D|$)/)?.[1];
    return year || "";
  }
  const variantMatchesFilters = (variant) =>
    (!state.system || variant.system === state.system) &&
    (!state.location || variant.location === state.location) &&
    (!state.year || yearOf(variant.debut) === state.year) &&
    (!state.sex || variant.sex === state.sex);
  function cardVariantIndexOf(character) {
    const selectedIndex = state.cardVariantIndexes.get(character.id);
    if (Number.isInteger(selectedIndex) && character.variants[selectedIndex]) return selectedIndex;
    if (!state.system && !state.location && !state.year && !state.sex) return character.representativeIndex;
    const matchedIndex = character.variants.findIndex(variantMatchesFilters);
    return matchedIndex >= 0 ? matchedIndex : character.representativeIndex;
  }
  const cardVariantOf = (character) => character.variants[cardVariantIndexOf(character)] || representativeOf(character);
  const cardNameOf = (character) => cardVariantOf(character).name || character.registrationName;
  const earliestDebutOf = (character) => character.variants.map((variant) => variant.debut).filter(Boolean).sort()[0] || "9999-99";
  const nameCollator = new Intl.Collator("ja", { numeric: true, sensitivity: "base" });
  function filteredCharacters() {
    const items = state.characters.filter((character) =>
      (!state.query || characterSearchText(character).includes(state.query)) &&
      character.variants.some(variantMatchesFilters));
    return items.sort((a, b) => {
      if (state.sort === "debut-asc") return earliestDebutOf(a).localeCompare(earliestDebutOf(b)) || Number(a.id) - Number(b.id);
      if (state.sort === "debut-desc") return earliestDebutOf(b).localeCompare(earliestDebutOf(a)) || Number(a.id) - Number(b.id);
      if (state.sort === "name-asc") return nameCollator.compare(cardNameOf(a), cardNameOf(b)) || Number(a.id) - Number(b.id);
      return Number(a.id) - Number(b.id);
    });
  }

  function renderCards() {
    const items = filteredCharacters();
    count.textContent = `${items.length} characters`;
    grid.dataset.view = state.view;
    if (!items.length) { grid.innerHTML = '<p class="catalog-empty">条件に合うキャラクターが見つかりませんでした。</p>'; return; }
    grid.innerHTML = items.map((character) => {
      const variantIndex = cardVariantIndexOf(character);
      const variant = character.variants[variantIndex] || representativeOf(character);
      const imageCandidates = catalogImageCandidatesOf(character, variant), image = imageCandidates[0] || "";
      const displayName = variant.name || character.registrationName;
      const portrait = displayableImageUrl(variant.faceUrl);
      const sidePortrait = portrait && portrait !== image ? portrait : "";
      const systems = [...new Set(character.variants.map((item) => item.system).filter(Boolean))];
      const systemLabels = (systems.length ? systems : ["OTHER"]).map((system) => `<span class="${system === variant.system ? "is-current" : "is-other"}" style="--label-system-color:${escapeHtml(systemColorOf(system))}">${escapeHtml(system)}</span>`).join("");
      const nextIndex = (variantIndex + 1) % character.variants.length;
      const nextVariant = character.variants[nextIndex] || {};
      const cycleButton = character.variants.length > 1 ? `<button class="character-card__variant-cycle" type="button" data-cycle-variant aria-label="次の姿「${escapeHtml(nextVariant.variant || nextVariant.name || nextVariant.system || `姿${nextIndex + 1}`)}」へ切り替える" title="次の姿へ切替"><i class="fa-solid fa-repeat" aria-hidden="true"></i><span>${variantIndex + 1}/${character.variants.length}</span></button>` : "";
      return `<article class="character-card${character.variants.length > 1 ? " has-variants" : ""}" tabindex="0" data-character-id="${escapeHtml(character.id)}" data-card-variant-index="${variantIndex}" aria-label="${escapeHtml(displayName)}を開く" title="${escapeHtml(displayName)}" style="--character-system-color:${escapeHtml(systemColorOf(variant.system))}">
        <div class="character-card__visual">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(displayName)}" loading="lazy" data-image-candidates="${escapeHtml(JSON.stringify(imageCandidates))}">` : `<span class="character-card__initial" aria-hidden="true">${escapeHtml(displayName.slice(0, 1))}</span>`}</div>
        ${sidePortrait ? `<img class="character-card__portrait" src="${escapeHtml(sidePortrait)}" alt="" loading="lazy" aria-hidden="true">` : ""}
        <div class="character-card__body"><p class="character-card__systems">${systemLabels}</p><h2>${escapeHtml(displayName)}</h2><p class="character-card__intro">${escapeHtml(cardSummaryOf(variant))}</p></div>
        <span class="character-card__id" aria-hidden="true">#${escapeHtml(String(character.id).padStart(3, "0"))}</span>
        ${cycleButton}
      </article>`;
    }).join("");
  }

  function renderSystemFilter() {
    const systems = [...new Set(state.characters.flatMap((character) => character.variants.map((variant) => variant.system)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));
    systemFilter.innerHTML = '<option value="">すべて</option>' + systems.map((system) => `<option value="${escapeHtml(system)}">${escapeHtml(system)}</option>`).join("");
    const locations = [...new Set(state.characters.flatMap((character) => character.variants.map((variant) => variant.location)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));
    locationFilter.innerHTML = '<option value="">すべて</option>' + locations.map((location) => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`).join("");
    const years = [...new Set(state.characters.flatMap((character) => character.variants.map((variant) => yearOf(variant.debut))).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
    yearFilter.innerHTML = '<option value="">すべて</option>' + years.map((year) => `<option value="${escapeHtml(year)}">${escapeHtml(year)}年</option>`).join("");
    const sexes = [...new Set(state.characters.flatMap((character) => character.variants.map((variant) => variant.sex)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));
    sexFilter.innerHTML = '<option value="">すべて</option>' + sexes.map((sex) => `<option value="${escapeHtml(sex)}">${escapeHtml(sex)}</option>`).join("");
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
    const character = state.characters.find((item) => item.id === state.selectedId);
    if (!character) return;
    const variant = character.variants[state.variantIndex] || representativeOf(character), image = detailImageOf(variant);
    const headerMeta = [
      variant.location ? `<span><i class="fa-solid fa-location-dot" aria-hidden="true"></i>${escapeHtml(variant.location)}</span>` : "",
      variant.debut ? `<time datetime="${escapeHtml(variant.debut)}"><i class="fa-regular fa-calendar" aria-hidden="true"></i>初登場 ${escapeHtml(variant.debut)}</time>` : ""
    ].filter(Boolean).join("");
    const facts = [
      detailFactGroup("特徴", "fa-solid fa-fingerprint", [["ジョブ", variant.job], ["アライメント", variant.alignment], ["髪色", variant.hair]], "detail-fact-group--features"),
      detailFactGroup("人物", "fa-solid fa-user", [["性別", variant.sex], ["年齢", variant.age], ["身長", variant.height]]),
      detailFactGroup("呼び方", "fa-solid fa-comments", [["一人称", variant.firstPerson], ["二人称", variant.secondPerson]])
    ].join("");
    const actions = [detailAction(variant.driveUrl, "fa-brands fa-google-drive", "Driveを開く"), detailAction(variant.characterSheetUrl, "fa-regular fa-file-lines", "キャラシを開く")].join("");
    const expressionSection = variant.faces.length ? `<section class="detail-section expression-section"><div class="expression-heading"><div><h3>ココフォリア表情 <small>${variant.faces.length}</small></h3><p>選んだ表情を立ち絵の横に表示します。</p></div><div class="expression-heading__actions">${variant.fullBodyUrl ? '<button class="expression-reset" type="button" data-show-fullbody><i class="fa-solid fa-person" aria-hidden="true"></i> 全身図のみ</button>' : ""}${variant.differenceJson ? '<button class="expression-reset" type="button" data-copy-json><i class="fa-regular fa-copy" aria-hidden="true"></i> 表情をコピー</button>' : ""}</div></div><div class="expression-grid">${variant.faces.map((face, index) => {
      const faceUrl = safeUrl(face.iconUrl);
      return faceUrl ? `<button class="expression-button" type="button" data-face-index="${index}" aria-pressed="false" title="${escapeHtml(face.label || `差分${index + 1}`)}"><img src="${escapeHtml(faceUrl)}" alt="${escapeHtml(face.label || `差分${index + 1}`)}" loading="lazy"><span>${escapeHtml(face.label || `差分${index + 1}`)}</span></button>` : "";
    }).join("")}</div></section>` : "";
    detail.className = "character-detail";
    detail.style.setProperty("--character-system-color", systemColorOf(variant.system));
    detail.innerHTML = `<div class="character-detail__visual"><span class="detail-visual-id" aria-hidden="true">#${escapeHtml(String(character.id).padStart(3, "0"))}</span>${image ? `<img id="detail-main-image" src="${escapeHtml(image)}" alt="${escapeHtml(variant.name || character.registrationName)}">` : `<span class="character-detail__image-placeholder" aria-hidden="true">${escapeHtml(character.registrationName.slice(0, 1))}</span>`}<div id="detail-face-preview" class="detail-face-preview" hidden><img alt=""><span aria-hidden="true">FACE</span></div></div>
      <div class="character-detail__content"><p class="detail-kicker">#${escapeHtml(character.id)}${variant.system ? ` ・ ${escapeHtml(variant.system)}` : ""}</p><h2 id="detail-name">${escapeHtml(variant.name || character.registrationName)}</h2>${headerMeta ? `<div class="detail-meta">${headerMeta}</div>` : ""}
        ${variant.intro ? `<div class="detail-lead detail-richtext">${renderMarkdown(variant.intro)}</div>` : ""}${variant.quote ? `<div class="detail-quote detail-richtext">${renderMarkdown(variant.quote)}</div>` : ""}${actions ? `<div class="detail-actions">${actions}</div>` : ""}${facts ? `<div class="detail-facts">${facts}</div>` : ""}
        <div class="detail-sections">${richSection("性格", variant.personality)}${richSection("好き・大事", variant.likes)}${richSection("苦手・弱点", variant.weaknesses)}${richSection("関係キャラ", variant.relations)}${richSection("見どころ", variant.highlights)}${richSection("モチーフ・制作意図", variant.motif)}${richSection("キャラ語り", variant.commentary)}${expressionSection}</div>
      </div>`;
  }

  function openCharacter(id, variantIndex = null) {
    const character = state.characters.find((item) => item.id === String(id));
    if (!character) return;
    state.selectedId = character.id;
    state.variantIndex = variantIndex === null ? character.representativeIndex : Number(variantIndex);
    renderDetail();
    if (!dialog.open) dialog.showModal();
    document.documentElement.classList.add("character-dialog-open");
    history.replaceState(null, "", `${location.pathname}?id=${encodeURIComponent(character.id)}`);
  }
  function closeCharacter() {
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove("character-dialog-open");
    state.selectedId = null;
    history.replaceState(null, "", location.pathname);
  }
  async function copyText(value) {
    try { await navigator.clipboard.writeText(value); }
    catch (_error) {
      const area = document.createElement("textarea"); area.value = value; area.style.position = "fixed"; area.style.opacity = "0";
      document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove();
    }
    clearTimeout(toastTimer); toast.textContent = "ココフォリア表情をコピーしました"; toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
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
          const response = await fetch(source, { cache: "no-store" });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const candidate = await response.json();
          if (candidate.status !== "success" || !Array.isArray(candidate.characters)) throw new Error(candidate.message || "Unexpected response");
          payload = candidate;
          break;
        } catch (error) { lastError = error; }
      }
      if (!payload) throw lastError || new Error("Character data could not be loaded");
      state.characters = payload.characters.map(normalizeCharacter).filter((character) => character.variants.length);
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
    renderSystemFilter(); renderCards();
    const initialId = new URLSearchParams(location.search).get("id");
    if (initialId) openCharacter(initialId);
  }

  grid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-character-id]");
    if (!card) return;
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
  grid.addEventListener("keydown", (event) => { if (event.target.closest("[data-cycle-variant]") || !["Enter", " "].includes(event.key)) return; const card = event.target.closest("[data-character-id]"); if (card) { event.preventDefault(); openCharacter(card.dataset.characterId, card.dataset.cardVariantIndex); } });
  detail.addEventListener("click", (event) => {
    const variantTab = event.target.closest("[data-variant-index]");
    if (variantTab) { state.variantIndex = Number(variantTab.dataset.variantIndex); renderDetail(); return; }
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
  detail.addEventListener("keydown", (event) => { const spoiler = event.target.closest(".spoiler-text"); if (spoiler && ["Enter", " "].includes(event.key)) { event.preventDefault(); activateSpoiler(spoiler); } });
  dialog.querySelector(".dialog-close").addEventListener("click", closeCharacter);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closeCharacter(); });
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); closeCharacter(); });
  dialog.addEventListener("close", () => document.documentElement.classList.remove("character-dialog-open"));
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
  loadCharacters();
})();

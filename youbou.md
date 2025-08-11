## 役割

You are a highly skilled software engineer with extensive knowledge in many programming languages, frameworks, design patterns, and best practices.
日本語で応対してほしい！

## 出たエラー

## 要望

カードジェネレーター 要望書（最小パッチ）

目的
・プレビューと出力の見た目を一致させる（WYSIWYG）
・DB 列名「オーバーレイ画像 URL」に統一して上絵を正しく読む
・キラ（APNG）を上に重ねた保存ができるようにする
・小さな不具合の修正（未定義関数／ドラッグ判定）
・最低限の文字列エスケープで表示崩れ/XSS を回避

対象ファイル
・card_generator.html
・css/card_generator.css
・js/card_generator.js

1. card_generator.html の修正
・</main> の直前に閉じタグを追加（プレビュー DOM を正しく閉じる）
追加する 2 行：
</div> <!-- /#card-container -->
</div> <!-- /#preview-area -->

2. css/card_generator.css の修正
   ・「画像出力時のズレ補正」セクションを無効化（プレビューと出力差の原因）
   以下のブロックをコメントアウトまたは削除：
   .is-rendering-output #effect-display { ... }
   .is-rendering-output #effect-display .paren-fix { ... }
   .is-rendering-output #effect-display .char-kern { ... }

3. js/card_generator.js の修正（WYSIWYG と機能追加）
   3-1) downloadCard() の一時クラス付与をやめる
   ・document.body.classList.add('is-rendering-output') と remove を削除（またはコメントアウト）

3-2) DB 列「オーバーレイ画像 URL」対応（旧互換は残す）
・関数 updatePreviewFromData の上絵 URL 取得を以下に置換
let overlayImageUrl =
data["オーバーレイ画像 URL"] ||
data["上絵画像 URL"] ||
data.overlayImageUrl ||
"";

・関数 renderCardPreview 内の上絵 URL 取得も同様に置換
let overlayImageUrl =
cardData["オーバーレイ画像 URL"] ||
cardData["上絵画像 URL"] ||
"";

3-3) sparkle（キラ）を DB へ送る
・handleDatabaseSave 内の cardData に 1 行追加
sparkle: sparkleCheckbox.checked,

3-4) 未定義関数の補完
・どこかのユーティリティ付近に追加
function updateImageTransform(){
updateCardImageTransform();
updateOverlayImageTransform();
}

3-5) オーバーレイ画像のドラッグ判定安定化（fitDirection 設定）
・関数 setupOverlayImageForDrag を次で置き換え
function setupOverlayImageForDrag() {
overlayImageState = { x: 0, y: 0, scale: 1 };
const cw = overlayImageContainer.offsetWidth;
const ch = overlayImageContainer.offsetHeight;
const iw = overlayImage.naturalWidth;
const ih = overlayImage.naturalHeight;
if (!iw || !ih) return;

const imgAspect = iw / ih;
const contAspect = cw / ch;

if (imgAspect > contAspect) {
const s = cw / iw; // 幅フィット
overlayImage.style.width = `${cw}px`;
overlayImage.style.height = `${ih * s}px`;
overlayImageFitDirection = "landscape";
} else {
const s = ch / ih; // 高さフィット
overlayImage.style.height = `${ch}px`;
overlayImage.style.width = `${iw * s}px`;
overlayImageFitDirection = "portrait";
}

overlayImageState.x = 0;
overlayImageState.y = 0;
updateOverlayImageTransform();
updateDraggableCursor();
}

3-6) キラ APNG 重ね保存の実装（提供 APNG を合成）
・冒頭の定数群の近くに追加
const SPARKLE_APNG_PATH = "Card_asset/sparkle_overlay.apng";

・ファイル末尾あたりに 2 関数を追加
async function generateSparkleApng() {
const blob = await createSparkleApngBlob();
if (!blob) throw new Error("APNG 生成に失敗しました。");
const a = document.createElement("a");
const fileName = `${(cardNameInput.value || "custom_card").replace(/[()`/\\?%\*:|"<>]/g,"")}.png`;
a.download = fileName;
a.href = URL.createObjectURL(blob);
a.click();
URL.revokeObjectURL(a.href);
}

async function createSparkleApngBlob() {
const wasSparkleVisible = sparkleOverlayImage.style.display !== "none";
sparkleOverlayImage.style.display = "none";
await Promise.all([waitForCardImages(), document.fonts.ready]);

const baseCanvas = await html2canvas(cardContainer, {
backgroundColor: null,
useCORS: true,
scale: 1
});
const W = baseCanvas.width, H = baseCanvas.height;

const resp = await fetch(SPARKLE_APNG_PATH, { cache: "no-cache" });
if (!resp.ok) throw new Error("キラ APNG の読み込みに失敗しました");
const buf = await resp.arrayBuffer();
const apng = UPNG.decode(buf);
const rgbaFrames = UPNG.toRGBA8(apng);
const delays = (apng.frames || []).map(f => Math.max(1, f.delay|0));

const work = document.createElement("canvas");
work.width = W; work.height = H;
const ctx = work.getContext("2d");
const outFrames = [];
const outDelays = [];

const fw = apng.width, fh = apng.height;
const fx = Math.round((W - fw) / 2);
const fy = Math.round((H - fh) / 2);

for (let i = 0; i < rgbaFrames.length; i++) {
ctx.clearRect(0, 0, W, H);
ctx.drawImage(baseCanvas, 0, 0);

    const fcan = document.createElement("canvas");
    fcan.width = fw; fcan.height = fh;
    const fctx = fcan.getContext("2d");
    const imgData = new ImageData(new Uint8ClampedArray(rgbaFrames[i]), fw, fh);
    fctx.putImageData(imgData, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(fcan, fx, fy);
    ctx.restore();

    const id = ctx.getImageData(0, 0, W, H);
    outFrames.push(id.data.buffer);
    outDelays.push(delays[i] || 6);

}

const apngBlob = new Blob([UPNG.encode(outFrames, W, H, 0, outDelays)], { type: "image/png" });

if (wasSparkleVisible) sparkleOverlayImage.style.display = "block";
return apngBlob;
}

3-7) 最低限の文字列エスケープ（表示崩れ/XSS 回避）
・ユーティリティとして追加
function escapeHtml(s){
return (s ?? "").replace(/[&<>"']/g, c =>
({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])
);
}

・関数 updateCardName を次の形に差し替え
function updateCardName(text) {
const segments = (text ?? "").split("`");
  const htmlParts = segments.map((segment, index) => {
    if (index % 2 === 1) {
      const m = segment.match(/(.+?)\((.+)\)/);
      if (m) return `<ruby><rb>${escapeHtml(m[1])}</rb><rt>${escapeHtml(m[2])}</rt></ruby>`;
    }
    return `<span class="no-ruby">${escapeHtml(segment)}</span>`;
  });
  const finalHtml = htmlParts.join("\u200B");
  cardNameContent.classList.toggle("is-plain-text-only", !finalHtml.includes("<ruby>"));
  cardNameContent.innerHTML = `<span class="scaler">${finalHtml}</span>`;
  requestAnimationFrame(() => {
    const scalerEl = cardNameContent.querySelector(".scaler");
    if (!scalerEl) return;
    const availableWidth = cardNameContent.clientWidth;
    const trueTextWidth = scalerEl.scrollWidth;
    scalerEl.style.transform = (trueTextWidth > availableWidth)
      ? `scaleX(${availableWidth / trueTextWidth})` : "none";
});
}

・関数 updateCardNameForPreview も同様に差し替え
function updateCardNameForPreview(text, contentEl) {
const segments = (text ?? "").split("`");
  const htmlParts = segments.map((segment, index) => {
    if (index % 2 === 1) {
      const m = segment.match(/(.+?)\((.+)\)/);
      if (m) return `<ruby><rb>${escapeHtml(m[1])}</rb><rt>${escapeHtml(m[2])}</rt></ruby>`;
    }
    return `<span class="no-ruby">${escapeHtml(segment)}</span>`;
  });
  const finalHtml = htmlParts.join("\u200B");
  contentEl.classList.toggle("is-plain-text-only", !finalHtml.includes("<ruby>"));
  contentEl.innerHTML = `<span class="scaler">${finalHtml}</span>`;
  requestAnimationFrame(() => {
    const scalerEl = contentEl.querySelector(".scaler");
    if (!scalerEl) return;
    const availableWidth = contentEl.clientWidth;
    const trueTextWidth = scalerEl.scrollWidth;
    scalerEl.style.transform = (trueTextWidth > availableWidth)
      ? `scaleX(${availableWidth / trueTextWidth})` : "none";
});
}

・関数 updatePreview の effect/flavor 代入をエスケープしてからに変更
const safeEffect = escapeHtml(replacePunctuation(effectInput.value));
effectDisplay.innerHTML = addSpacingToChars(safeEffect);

const safeFlavor = escapeHtml(replacePunctuation(flavorInput.value.trim()));
let el = flavorDisplay.querySelector(".inner-text");
if (!el) { flavorDisplay.innerHTML = '<div class="inner-text"></div>'; el = flavorDisplay.querySelector(".inner-text"); }
el.innerHTML = safeFlavor.replace(/\n/g, "<br>");

4. アセットの配置
   ・Card_asset/sparkle_overlay.apng を追加（提供 APNG をこのパスと名称で置く）

5. 動作確認
   ・通常保存でプレビューと出力が一致すること
   ・キラ ON で APNG が生成されること（拡張子 png の APNG）
   ・DB の「オーバーレイ画像 URL」で上絵が反映されること
   ・DB 登録時にキラが true で保存されること

以上

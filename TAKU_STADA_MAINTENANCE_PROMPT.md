# 卓スタダ 改修・保守プロンプト

あなたは、TRPG向けWebツール群「卓スタダ」を保守するフロントエンド寄りのエンジニアです。以下を共通作業指示として使用してください。

## 今回の依頼

ここに具体的な依頼を書く。

## 最優先ルール

- 必ずリポジトリ内の現行ファイルを確認し、現行ソースを正本とする。古い説明、過去のzip、記憶、推測と食い違う場合は現行ソースを優先し、差異を報告する。
- 着手前に対象HTML、関連JS、CSSの読み込み順と `@import`、JSが参照する `id` / `class` / `data-*`、Vueバインディングを確認する。
- 既存の見た目を大きく作り替えるより、重複、競合、レスポンシブ崩れを整理する。ページ構成、配色、情報量、主要導線を大幅に変えたい場合は、実装前に変更案と影響範囲を説明してユーザーへ声をかけ、了承を得る。
- 色合いは `css/style.css` の既存テーマと `:root` の `--color-*` を使用する。同じ意味の色を個別CSSへ直書きしない。
- 英数字しか入らない入力欄や数値・日付・時刻・ID・コード等には、原則 `font-family: var(--font-latin-ui);` を使う。日本語が入り得る欄へ一律適用しない。
- `css/style.css` は全体へ影響するため原則変更しない。必要な場合は理由と影響を説明し、最小変更にする。ページ固有の調整は個別CSSへ置く。
- `!important` や高詳細度セレクタを追加して勝つのではなく、競合元、読み込み順、既存の後段定義を整理する。同一セレクタ、重複宣言、末尾の追加上書きを増やさない。
- HTML構造、既存の `id`、`class`、`name`、`data-*`、`hidden`、ARIA属性、フォーム値、JS参照、Vueバインディングを壊さない。
- PC全幅、画面半分、960px、640px、390px、335pxを前提に確認する。`@media` だけでなく `@container` とコンテナ実幅も確認する。
- 成果物は原則、今回変更したファイルだけを含む差分zipにする。「全部」「一式」「フル」と明示された場合だけ、指定範囲の未変更ファイルも含む完全版zipにする。

## 対象と共通基盤

- 共通: `index.html`、`header.html`
- 案内: `beginner.html`、`q_and_a.html`、`CoC_Q&A.html`、`recruitment.html`、`slides.html`
- 管理・閲覧: `schedule.html`、`log_player.html`、`tier_list.html`、`growth_checker.html`、`coc_review.html`、`sutada_chara.html`
- 生成・編集: `card_generator.html`、`boss_cutin_generator.html`、`koma-maker.html`、`shinjuku_crawler.html`、`satasupe_chara.html`
- エネミー／手駒: `dx3_combo_generator.html`、`AR2E_enemies.html`、`satasupe_enemies.html`、`nechronica_enemies.html`
- その他: `247_guild/`、`api/`、`taku_stada_gas/`、各ページが参照するCSS、JS、CSV、JSON、画像、音声、外部API

依頼対象から読み込まれるファイル、リンク先、共通ヘッダー、データソース、出力先を辿る。ただし、無関係なページまで一括修正・整形しない。

- 全体テーマ、共通レイアウト、色・フォント変数: `css/style.css`
- 共通ヘッダー、サイドメニュー等: `header.html`、`js/common.js`
- エネミー閲覧・制御UI共通: `css/enemies_view_common.css`
- エネミー共通動作: `js/enemies-shared.js`

色と英数字用フォントは `css/style.css` の `:root` にある現行変数を確認して使う。値を別ファイルへ複製しない。背景、本文色、リンク色、見出し、共通ヘッダーは現行配色との調和を優先する。色だけで状態を伝えず、文字、アイコン、枠、ARIA属性も併用し、コントラストを確認する。

多くのページは `style.css` と `common.js` を使い、`header-placeholder` へ `header.html` を読み込む。共通ナビゲーション変更時はトップ階層と `247_guild/` 等のサブディレクトリで相対パスを確認する。外部ライブラリは現行バージョン、読み込み位置、グローバル名を確認せず更新・置換しない。

## 機能とデータの保全

- JSが参照する要素は、移動・改名・ラッパー追加の前に参照元を検索する。`innerHTML` 等で動的生成されるDOMもCSSとイベントの契約対象にする。
- Vueページでは現行Vueのバージョン、データ構造、computed、watcher、`$set` / `$delete` を確認する。vanilla JSでは初期化順、`DOMContentLoaded`、イベント委譲を壊さない。
- グローバル変数、公開関数、カスタムイベント、共通ヘルパーを安易に改名・削除しない。ビルド工程のないページへ新しいビルド必須構成を持ち込まない。
- `localStorage` / `sessionStorage` のキー、JSON構造、URLパラメータ、CSV列、APIパラメータ、GAS/Vercelエンドポイントの互換性を保つ。
- 保存、読込、更新、削除、コピー、ダウンロード、画像生成、外部ツール出力を別経路として確認する。旧データの欠損フィールドに対する既存の正規化・既定値を壊さない。
- API URL、秘密情報、認証情報を新規に直書きせず、ログや報告にも出さない。アセット名、相対パス、文字コード、キャッシュ指定を維持する。
- ページ名称変更時は `title`、`h1`、OGP、説明文、ナビゲーション表記を揃える。GitHub Pages等の静的配信を前提に大文字小文字と相対パスを確認する。

## CSS変更手順

1. 静的HTMLとJS生成HTMLの対象classを検索する。
2. `style.css`、個別CSS、関連共通CSS、全 `@import` 先から同じセレクタを検索する。
3. 通常ルール、疑似class、`@media`、`@container`、互換ルールをカスケード順に確認し、競合元を特定する。
4. 責務がサイト共通、機能群共通、ページ個別、システム個別のどこかを決める。個別修正はbody class等で範囲を限定する。
5. 新規追記より既存定義の統合・修正を優先し、不要な旧定義を削除する。
6. `style.css` の色変数と `--font-latin-ui` を使えるか確認し、テーマ値を複製しない。
7. 変更後に重複セレクタ、矛盾する幅、過剰な詳細度、未使用class、直書きされた重複色が増えていないか再確認する。

## エネミー／手駒ページの追加ルール

### ファイルと読み込み

- 共通CSS: `css/enemies_view_common.css`
- DX3: `css/dx3_combo_generator.css`、`css/dx3/*.css`、`js/dx3_combo_generator.js`
- AR2E: `css/AR2E_enemies.css`、`js/AR2E-enemies.js`
- サタスペ: `css/satasupe_style.css`、`css/satasupe_enemies.css`、`js/satasupe-enemies.js`
- ネクロニカ: `css/nechronica_enemies.css`、`js/nechronica-enemies.js`

CSSは概ね `style.css` → `enemies_view_common.css` → 個別CSS の順で読む。サタスペは共通CSSより前に `satasupe_style.css` も読む。DX3の入口CSSは `css/dx3/*.css` を順番にimportするため、後段のレスポンシブ・互換CSSまで確認する。JSは `common.js` → `enemies-shared.js` → 個別JSの順で読む。

### 共通化と状態

- 閲覧UI、toolbar、action bar、公開表示、チャットパレット、駒出力等、4システムで共通化できるCSSは `enemies_view_common.css` に寄せる。
- 色、背景、フォント、装飾、ルールブック風表現、固有データのレイアウトは個別CSSに残す。他システムを壊すなら無理に共通化しない。
- `editor-action-bar` / `enemy-control-bar` / `enemy-action-bar` / `enemy-view-toolbar` は4システム共通の設計契約とする。広い画面では1行、中間幅では自然に折り返し、スマホでは押しやすくする。
- URLの `id` / `enemy` / `enemyId` と `mode=edit`、各 `is-*-enemy-view-boot`、`is-enemy-view-mode`、ワイド表示、初期ローディングを壊さない。
- 非公開でもURLを知っていれば本文を閲覧できる現行仕様を維持する。一方、閲覧ページからのチャットパレットと駒出力は非公開時に無効のままにする。一覧掲載、公開切替、共有URL、本文閲覧、出力権限を混同しない。
- DX3はVue 2.6.14でPCコンボとエネミー機能が同居する。`appMode === 'pc'`、`appMode === 'enemy'`、`dx3EnemyViewMode`、`dataset.noSidemenu` を壊さず、PC編集・エネミー編集・URL閲覧を確認する。
- AR2E、サタスペ、ネクロニカは多数のidをvanilla JSから参照するため、id変更は原則禁止する。

## レスポンシブ・操作性

- ページ全体に意図しない横スクロールを発生させない。表は必要なら表ラッパー内だけで横スクロールさせる。
- 共通ヘッダー、サイドメニュー、主要操作、フォーム、モーダル、固定UI、toolbar、action barを画面外へ出さない。
- スマホではPC向け多列配置を無理に維持せず、既存設計に沿って1カラム、カード、コンパクト表へ切り替える。
- ボタンのタップ領域、キーボードフォーカス、disabled、選択中、エラー、ローディング、長文・長い英数字、画像あり・なし、文字切れを確認する。
- ブラウザで確認できない項目は「確認済み」とせず、静的確認か未確認かを明記する。

## zipと完了報告

- 通常は変更ファイルだけをリポジトリと同じ相対パスで格納し、無関係な未変更ファイル、`.git`、一時ファイル、既存の別作業差分を含めない。
- 「全部出して」「関連ファイル一式」等と明示された場合は未変更ファイルも含む指定範囲の完全版zipにし、名前へ `_full` 等を付ける。
- zip作成前に作業ツリーを確認し、今回の変更と既存のユーザー変更を区別する。既存変更を戻さない。
- 完了報告は、zipリンク、変更ファイル、変更内容、触っていない範囲、検証内容、未確認事項を記す。応急処置なら理由と正式化方針も記す。
- 変更していないものを変更したと書かず、ブラウザ実機確認、静的確認、構文確認を区別する。

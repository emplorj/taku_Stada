# satasupe_enemies editor-action-bar 小型化プラン

## 目的

- [`editor-action-bar`](satasupe_enemies.html) の高さ・横幅を圧縮し、ボタンが改行しにくい構成にする。
- 既存の保存系操作を維持しつつ、入力メタ要素（作者 / アイコンURL など）を同居させる。
- 画像の紙面レイアウト感（情報密度が高いが読みやすい）をUIに反映する。

## 前提（現状課題）

- [`action-btn`](css/satasupe_enemies.css) が大きく、余白とフォント比率で折返しが発生。
- [`action-bar-right`](css/satasupe_enemies.css) 内の要素数が増え、横幅不足時に段落ちする。
- メタ入力を載せると、行高がさらに増えて「上段バー」の意図が弱くなる。

## 目標レイアウト（B案）

1. 1段目（操作主導）
   - 左: 新規 / 削除 / DB再読込
   - 右: 別名保存 / 上書き保存 / JSON出力 / コマJSON出力 / JSON読込
2. 2段目（メタ主導・コンパクト）
   - 作者
   - アイコンURL
   - （必要なら）危険度 / 反応 / サイズ のミニ表示

> 折返しは「許可」するが、折返し時も行ごとに意味が崩れない構成を優先する。

## 実装方針

### 1) HTML再構成

- [`satasupe_enemies.html`](satasupe_enemies.html)
  - [`editor-action-bar`](satasupe_enemies.html) 配下を 2レーン構造に整理。
  - 操作ボタン群とメタ群を別ブロックに分離。
  - 既存 `data-field` は維持し、保存互換性を壊さない。

### 2) CSS小型化

- [`css/satasupe_enemies.css`](css/satasupe_enemies.css)
  - [`action-btn`](css/satasupe_enemies.css) の以下を圧縮:
    - `font-size`
    - `padding`
    - `min-height`
    - `border-radius`
    - `gap`
  - [`action-bar-left`](css/satasupe_enemies.css), [`action-bar-right`](css/satasupe_enemies.css), [`action-bar-meta`](css/satasupe_enemies.css) を行単位で整列。
  - 1200px/980px の2段階でレスポンシブ調整。

### 3) 入力幅の固定化

- 作者: 8–9rem
- アイコンURL: 11–13rem
- 画面狭小時は `width: 100%` へ移行（2段目で破綻回避）

### 4) 追加要素の受け皿（画像意匠反映）

- 将来的にバー上へ置く候補:
  - 危険度（readonly）
  - 反応
  - サイズ
- ただし初回は見た目崩れを防ぐため、まず作者/アイコンURLを優先。

### 5) 動作確認

- 改行が発生しても「ボタン列」「メタ列」の順序が維持されること。
- [`fillForm()`](js/satasupe-enemies.js:724) / [`readFormToSheet()`](js/satasupe-enemies.js:736) 連携が維持されること。
- 既存の保存・読込・DB再読込が無変更で動作すること。

## 実施ステップ（実装タスク）

- [ ] [`satasupe_enemies.html`](satasupe_enemies.html) の action bar を2レーン化
- [ ] [`css/satasupe_enemies.css`](css/satasupe_enemies.css) のボタン寸法を小型化
- [ ] メタ入力幅（作者/アイコンURL）を固定 + 狭幅時100%
- [ ] 980px以下のレイアウト崩れ確認と補正
- [ ] 保存/読込/再読込の回帰確認

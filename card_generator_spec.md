# カードジェネレーター仕様定義

このドキュメントは、カードジェネレーターの各カードタイプが選択された際の挙動を定義します。

## 1. 対象要素

| 名称 | HTML ID / Class | 説明 |
| :--- | :--- | :--- |
| タイトル | `#card-name-content` | カード名を表示するテキスト要素 |
| テキストボックス | `#text-box-container` | 効果説明とフレーバーテキストを内包するコンテナ |
| 画像コンテナ | `#image-container` | カードのメイン画像を表示するエリア |
| タイトル枠 | `#card-frame-image` | タイトルの背景に表示される装飾画像 |
| タイトルスタイル | `.title-styled` | タイトルに適用される装飾（白フチ、影など） |
| テキストスタイル | `.textbox-styled` | テキストボックス内の文字に適用される装飾（影など） |

使用テンプレ:◯
には色が入ります
## 2. カードタイプ別挙動

### A. 標準 (Standard)
- **目的**: 基本的なカード表示
    - タイトル.png:　表示
    - 使用テンプレ:◯カード
- **適用スタイル**:
    - タイトルスタイル: **なし**
    - テキストスタイル: **なし**
- **レイアウト変更**:
    - 画像コンテナの高さ: `480px` (標準)にする
- **表示要素**:
    - タイトル: **表示**
    - テキストボックス: **表示**
    - タイトル枠: **表示**

### B. 文字枠なし (No Textbox Frame)
- **目的**: テキストボックスの枠がないカード
    - タイトル.png:　非表示
    - 使用テンプレ:◯カード
- **適用スタイル**:
    - タイトルスタイル: **適用**
    - テキストスタイル: **なし**
- **レイアウト変更**:
    - 画像コンテナの高さ: `480px` (標準)にする
- **表示要素**:
    - タイトル: **表示**
    - テキストボックス: **表示**
    - タイトル枠: **表示**

### C. フルフレーム (Full Frame)
- **目的**: 画像をカード全体に表示する
    - タイトル.png:　表示
    - 使用テンプレ:◯カードFF
- **適用スタイル**:
    - タイトルスタイル: **なし**
    - テキストスタイル: **適用**
- **レイアウト変更**:
    - 画像コンテナの高さ: `720px` (拡大)にする
- **表示要素**:
    - タイトル: **表示**
    - テキストボックス: **表示**
    - タイトル枠: **表示**

### D. フルフレーム & 文字枠なし (Full Frame & No Textbox Frame)
- **目的**: 画像を全体に表示し、テキストボックスの枠がないカード
    - タイトル.png:　非表示
    - 使用テンプレ:◯カードFF
- **適用スタイル**:
    - タイトルスタイル: **適用**
    - テキストスタイル: **適用**
- **レイアウト変更**:
    - 画像コンテナの高さ: `720px` (拡大)にする
- **表示要素**:
    - タイトル: **表示**
    - テキストボックス: **表示**
    - タイトル枠: **表示**

---
### E. ツインパクト (Twinpact)
- **目的**: カードが上と下に分かれてて、2つ書く欄があるカード
    - タイトル.png:　非表示
    - 使用テンプレ:◯カードTP
    （まだ待ってね）
- **適用スタイル**:
    - タイトルスタイル: **適用**
    - テキストスタイル: **適用**
- **レイアウト変更**:
    - 画像コンテナの高さ: `720px` (拡大)
- **表示要素**:
全部個別の表示法で表示する。
    - タイトル: **表示**
    - テキストボックス: **表示**
    - タイトル枠: **表示**

**【ご確認】**
上記の定義で認識に相違ないかご確認ください。
この定義を元に仕様を確定し、実装を進めたいと考えております。
もし変更点があれば、このドキュメントを修正する形でご指示ください。
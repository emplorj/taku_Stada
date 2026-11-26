# 公開先と更新方法

本体は https://taku-stada.vercel.app/ 。従来どおりローカルで編集し、
GitHub の `main` に push すると Vercel が自動で公開する。

GitHub Pages は旧URLの互換用。Actions の `pages.yml` が
`tools/build-github-redirects.js` で転送用 HTML を生成して公開する。
Repository Settings → Pages → Source は **GitHub Actions** に設定済み。
Deploy from a branch に戻すと、通常 HTML の公開と転送公開が競合する。
元の HTML は書き換えない。ページの階層、クエリ、ハッシュを保って転送し、
画像・CSS・JS 等の旧アセット URL は引き続き利用できる。

公開URLは `cleanUrls: true` により `.html` なし。ソースの HTML ファイル名は従来どおり。
シンジュクロウラーは `/shinjuku_crawler?id=...` が本体。
旧 `shinjuku_crawler.html` は同じ ID を保ってこちらへ移る。
Vercel の動的ページが名前入り OGP とシート本体を返す。
Vercel のビルドは `tools/build-vercel-static.js` で静的配信ファイルを準備する。
シートの元 HTML は関数のテンプレートとして使い、静的配信からだけ除外する。
これにより `/shinjuku_crawler` も静的ファイルに遮られず動的 OGP を返せる。

サーバー保存先（GAS・スプレッドシート）は変更なし。
localStorage / IndexedDB 等の端末内データはドメイン別なので、旧サイトの
名前の記憶・プリセット等は自動では移らない。旧データは削除しない。
旧ドメインでの既投稿リンクの Discord プレビューを遡って変更するものではない。

確認: `node --test tests/site-migration.test.js tests/share.test.js tests/shinjuku-page.test.js`
転送成果物の生成: `node tools/build-github-redirects.js _pages-redirects`

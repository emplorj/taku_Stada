# Koma Maker API

`api/koma-maker.js` is the canonical and only supported Koma Maker conversion
backend. It is deployed as the Vercel function:

`https://taku-stada.vercel.app/api/koma-maker`

The browser client calls this endpoint directly, including from GitHub Pages and
local development origins such as `http://127.0.0.1:3000`.

The former Google Apps Script implementation is archived. GAS remains in use
for features that require Google services, but Koma Maker conversion logic must
not be added there.

## Character share cards

`/api/share?tool=shinjuku&id=...` and
`/api/share?tool=comboGenerator&id=...&url=...` return server-rendered OGP
using saved GAS JSON. Browsers redirect to the editor; link
crawlers receive metadata directly in the HTML head (no iframe or meta refresh).
Share buttons use this endpoint. Existing GitHub Pages `?id=` links retain
their static preview.

`/shinjuku_crawler.html?id=...` is rewritten to `shinjuku-page.js`, which
renders the full editor with character-specific metadata. The static HTML is
bundled with the function via `includeFiles`. Saved JSON is safely embedded
for first-load reuse, and the response is never cached. GitHub Pages visitors
are moved to this Vercel sheet so copying the address bar shares the right URL.
Already-posted GitHub Pages URLs still have static previews.

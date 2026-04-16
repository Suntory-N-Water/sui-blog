---
title: "Cloudflare Workers Static Assets は `not_found_handling` 未設定だと 404 レスポンスに `Content-Type` が付かない"
date: 2026-04-17
---

Cloudflare Workers Static Assets は `not_found_handling` 未設定だと 404 レスポンスに `Content-Type` が付かない。`"not_found_handling": "404-page"` を明示することで `404.html` が `text/html` として配信され、iOS のダウンロードダイアログも解消される。

---

Cloudflare のデフォルト（未設定）は `none` 相当で、アセットにマッチしないリクエストに対して **本文なし・Content-Type なしの素の 404** を返します。`404.html` があっても無視されます。

Content-Type がないレスポンスを iOS Safari がダウンロード対象と判断し、「このファイルをダウンロードしますか？」というダイアログが表示されてしまいます。

---

参考

https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/#custom-404-pages

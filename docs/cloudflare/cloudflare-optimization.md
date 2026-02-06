# Astro & Cloudflare Workers 最適化・分析リサーチレポート

このレポートは、Astroで構築されCloudflare Workers(Static Assets)で配信されているブログの最適化と、Cloudflareを活用した分析・設定についての調査結果です。

## 1. Cloudflareでの分析(Analytics)

「長期的なアナリティクス」を実現するためのCloudflareのオプションは主に以下の3つです。

### A. Cloudflare Web Analytics(推奨)
**概要**: クライアントサイドの軽量なJavaScriptビーコンを使用した分析(Google Analyticsに似ていますが、プライバシー重視でCookieレス)。
- **メリット**: 無料。設定が簡単。Web Vitals(LCP, CLS等)の計測が可能。
- **実装方法**:
  1. Cloudflare Dashboard > Web Analytics でサイトを追加。
  2. 発行されるJSスニペットを `src/layouts/Layout.astro` 等に追加(または「Automatic Setup」を利用)。
  3. すでに `partytown` が導入されているため、Partytown経由で読み込むことでメインスレッドのブロックを防げます。
- **データ保持期間**: 無料プランでも一定期間見れますが、数年単位の「長期保存」は集計データのみです。

### B. Workers Analytics Engine(上級者向け)
**概要**: Server-sideからカスタムデータポイントを記録する機能。
- **メリット**: 自由度が高い。SQLライクなクエリが可能。
- **デメリット**: 実装が必要。Static Assetsモード(`assets` バインディング)のみではサーバーサイドロジックが動かないため、リクエストをインターセプトするWorkerの記述が必要です。
- **コスト**: 無料枠あり(1日10万データポイント)。

### C. Logpush(有料プラン向け)
**概要**: ログを生データとしてS3やR2バケットに送信・保存。
- **メリット**: 完全な長期保存が可能。
- **コスト**: EnterpriseまたはPro + Logpush購入が必要。個人ブログとしてはオーバーキルな可能性があります。

---

## 2. Cloudflare Platform 最適化設定

Cloudflare Dashboardで設定可能な、Astroサイト向けの最適化項目です。

| 機能 | 設定・推奨 | 理由 |
|---|---|---|
| **Auto Minify** | **HTML & CSS: ON** <br> **JS: 注意** | Astroはビルド時にすでに圧縮を行いますが、Cloudflare側での追加圧縮も有効です。ただし、ハイドレーション(React等)に影響が出ないか確認が必要です。実運用ではHTML/CSSのみONが無難です。 |
| **Early Hints** | **ON** | サーバーがレスポンス準備中に、ブラウザにリソースのプリロードを指示します。表示速度向上に寄与します。 |
| **HTTP/3 (QUIC)** | **ON** | デフォルトでONのはずですが、確認してください。通信の高速化に不可欠です。 |
| **0-RTT Connection Resumption** | **ON** | 再訪ユーザーの接続確立を高速化します。 |
| **Rocket Loader** | **OFF** | **非推奨**。AstroやReactのハイドレーションスクリプトと競合し、動的機能が壊れる原因になります。 |
| **Scrape Shield** | **ON** | 「Email Address Obfuscation」などが含まれます。スパム対策に有効。 |
| **Hotlink Protection** | **ON** | 画像の直リンクを防ぎ、帯域を節約します。 |

---

## 3. Astro ビルド・構成の最適化

### A. 画像最適化 (Image Optimization)
現状、標準の `astro:assets` (Sharpベース) を使用していると思われます。これはビルド時に画像を生成するため、Workerのリクエスト毎のコストがかからず、キャッシュも効きやすいため**ブログには最適**です。

- **Cloudflare Image Resizing (Proプラン)**: もしProプラン以上であれば、アダプターの設定で `imageService: 'cloudflare'` を指定することで、ビルド時間を短縮し、エッジでの動的リサイズに移行できます。Freeプランの場合は現状のままでOKです。

### B. サイトマップの自動化
現在 `src/pages/sitemap.xml.ts` で手動生成していますが、`@astrojs/sitemap` パッケージの使用を検討してください。

- **メリット**: `src/pages` 内のファイルや、`getStaticPaths` で生成されるページを自動的に網羅します。記事が増えた際の漏れを防げます。
- **導入**: `npx astro add sitemap`

### C. Prefetch (先読み)
Astro 5ではPrefetchが強化されています。
- 設定: `astro.config.ts` で `prefetch: true` (または詳細設定) を有効にするか、リンクに `data-astro-prefetch` 属性を付与することで、遷移先のHTML/JSを事前に読み込み、体感速度を向上させられます。

### D. キャッシュ制御 (_headers)
`public/_headers` ファイルを作成することで、Cloudflareのレスポンスヘッダーを制御できます。
Astroのビルド生成物(`_astro/` 以下のハッシュ付きファイル)は自動的に長くキャッシュされますが、HTMLファイル自体のキャッシュポリシーを明示的に指定することも可能です。

```text
# public/_headers の例
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

# CSS/JSなどのアセットは自動でキャッシュされるが、念のため
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

## 4. アクションプラン

1. **Cloudflare Web Analyticsの導入**: Dashboardから有効化し、計測を開始する。
2. **Dashboard設定の見直し**: Early Hints, HTTP/3, Auto Minify (HTML/CSS) を確認・有効化。
3. **不要なスクリプトの無効化**: Rocket LoaderがOFFになっているか確認。
4. **コードベースの改善**:
   - `@astrojs/sitemap` への移行検討。
   - `data-astro-prefetch` の活用検討。

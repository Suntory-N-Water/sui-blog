# EmDash Cloudflare ブログ移行調査

Issue #596 の実装判断に使う一次情報を、2026-09-21 時点で確認した。参照した公式資料は EmDash の公式ドキュメントと公式 GitHub リポジトリである。

## 採用する公式構成

- このリポジトリの初期構成は公式の生成コマンドを実行して作成した。`temp/` で `npm create emdash@latest emdash-cloudflare-blog -- --template cloudflare:blog --pm pnpm --yes` を実行し、生成された公式プロジェクトをルートへ移動してから、移行に必要な seed・Markdown・OGP の入口だけを追加した。Cloudflare ブログテーマを手作業で再実装していない。
- ブログの公式作成手順は [`Create a Blog`](https://docs.emdashcms.com/guides/create-a-blog/)。Cloudflare テンプレートは `output: "server"` とし、`/_emdash/admin` で編集した公開済み記事を再ビルドなしで取得する。
- テーマの実装規約は [`Creating Themes`](https://docs.emdashcms.com/themes/creating-themes/)。`src/live.config.ts` で `emdashLoader()` を使い、記事ページでは `getEmDashCollection` / `getEmDashEntry` と `PortableText` を使う。静的生成の `getStaticPaths` は使わない。
- Cloudflare の公式手順は [`Deploy to Cloudflare`](https://docs.emdashcms.com/deployment/cloudflare/)。`src/worker.ts` を Worker エントリにし、D1 の `DB`、R2 の `MEDIA`、`@astrojs/cloudflare`、`@emdash-cms/cloudflare` の `d1` / `r2` アダプターを使う。追加プラグインを使わない初回移行では sandbox 用の binding と `sandboxRunner` / `LOADER` は不要である。
- seed の形式は [`Seed Files`](https://docs.emdashcms.com/themes/seed-files/) と公式リポジトリの `templates/blog-cloudflare/seed/seed.json` に合わせる。画像は `{ "$media": { "url", "filename", "alt" } }` として渡すと、seed 適用時にダウンロードされ、R2 と media レコードへ保存される。本文中でも同じ参照形式を再帰的に使える。
- Portable Text の標準ブロックは、見出し・段落・引用・リスト・インライン marks・リンク・画像・`code`・`htmlBlock`・`table`。EmDash 側の `htmlBlock` は `sanitize-html` でサニタイズされるため、既存 Markdown の details や対応できない HTML を黙って捨てずに保存できる。
- 記事の取得とページングは [`Querying Content`](https://docs.emdashcms.com/guides/querying-content/)。記事一覧は `published_at` で並べ、`limit` / `offset` と `hasMore` を使う。

## 日付移行の注意

公式 seed のコンテンツ作成処理は `status: "published"` の記事に現在時刻を `published_at` として設定する。seed の記事データだけでは元の `date` を確実に保持できないため、seed 適用後に公式 Content API の publish エンドポイントへ `publishedAt` を渡して再設定する移行スクリプトを用意する。EmDash の公式 CLI/API リファレンスは [`CLI`](https://docs.emdashcms.com/reference/cli/) と公式リポジトリの `packages/core/src/api/handlers/content.ts` にある。

元の `date` は EmDash のシステムフィールド `published_at`、元の `modified_time` は posts コレクションのカスタム datetime フィールド `modified_time` に保存する。旧 `/blog` / `/tags` からの転送は作らない。

## バックアップ

公式のバックアップ方針に従い、D1 は [`wrangler d1 export`](https://developers.cloudflare.com/d1/reference/commands/#d1-export)、R2 は [`wrangler r2 object`](https://developers.cloudflare.com/r2/objects/s3/)、または S3 互換 API で取得する。EmDash の JSON エクスポートは復元用バックアップではない。実環境のバックアップ取得は Cloudflare リソースと認証情報が必要なため、デプロイ・公開を伴う本作業では自動実行しない。

## 移行で保存しない機能と保存方法

- about、privacy、contact、diagram、自己評価は posts の機能として移行しない。
- 本文中の Mermaid は Mermaid の図として実行せず、`code` ブロック（language=`mermaid`）として残す。
- Markdown の raw HTML（`details`、埋め込みなど）は `htmlBlock` として保存する。EmDash の sanitizer が許可しない HTML は表示されなくても seed と変換レポートから追跡できる。
- 変換できないノードは変換処理の警告・レポートに記録し、原文を code または htmlBlock に退避する。

## 参照

- [EmDash 公式リポジトリ](https://github.com/emdash-cms/emdash)
- [公式 Cloudflare ブログテーマ](https://github.com/emdash-cms/emdash/tree/main/templates/blog-cloudflare)
- [公式ブログテーマの seed](https://github.com/emdash-cms/emdash/blob/main/templates/blog-cloudflare/seed/seed.json)
- [公式 Portable Text 型定義](https://github.com/emdash-cms/emdash/blob/main/packages/core/src/content/converters/types.ts)

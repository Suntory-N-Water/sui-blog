## 概要

Astro 7.x と EmDash の公式 Cloudflare ブログテーマを基盤にした個人技術ブログ。ランタイムは pnpm + Node.js、ホスティングは Cloudflare Workers、記事データは D1、画像は R2。

## コマンド

```bash
pnpm run format           # Biome + Prettier (Astro ファイル)
pnpm run lint:ai          # GitHub reporter 形式の lint 出力
pnpm run type-check:ai    # --pretty false での型チェック
pnpm run textlint         # contents/ 内の日本語文章校正 (textlint)
pnpm run textlint:fix     # 自動修正
pnpm run migrate:emdash   # Markdown から EmDash seed を生成
pnpm run verify:emdash    # 移行前後の件数・slug・メタデータを比較
```

## アーキテクチャ

### コンテンツパイプライン

```
contents/blog/*.md  →  scripts/migrate-emdash.ts  →  seed/seed.json  →  EmDash seed / D1
                                                    ↘  reports/emdash/* (比較・警告)
```

- `contents/blog` は移行元のバックアップ・履歴であり、実行時の記事データ源ではない。
- 公開ページは EmDash の live collection を通じて D1 を読むため、管理画面の編集は再ビルドなしで反映される。
- `src/pages/posts`、`src/pages/tag`、RSS、`llms.txt`、Markdown、OGP画像が移行後の公開面である。
- about、privacy、contact、diagram、自己評価機能は実装対象外とする。旧URLの転送も行わない。

## 記事管理

- 移行元の記事: `contents/blog/YYYY-MM-DD_slug-name.md`
- 移行先のシード: `seed/seed.json`
- 移行レポート: `reports/emdash/`
- 対応できない Markdown 表現は Portable Text の代替表現へ変換し、警告を `reports/emdash/unsupported.md` に残す。本文を黙って削除しない。

## Cloudflare

- `wrangler.jsonc` は Worker、D1 (`DB`)、R2 (`MEDIA`)、Cron (`* * * * *`) を定義する。
- ローカルでは `pnpm dev` を使う。本番の D1/R2 への seed、デプロイ、workers.dev の検証は外部状態を変更するため、明示的な依頼があるまで実行しない。
- Cloudflare の D1/R2 バックアップ手順は `docs/runbook/emdash-backup.md` に記載する。

## CI/CD

- **CI** (`ci.yml`): lint, type-check, knip, svg-security。
- **Deploy**: Cloudflare Workers Builds で実行。Build command は `pnpm run build`、production deploy command は `pnpm run deploy`、non-production branch deploy command は `pnpm run deploy:preview`。

## textlint

`contents/` は独立した package.json を持つサブパッケージ。textlint の依存は `contents/package.json` と `contents/pnpm-lock.yaml` で管理する。

## ルール

コーディング規約・セキュリティ規約は `.claude/rules/` にパススコープ付きで配置済み。編集中のファイルに応じて自動ロードされる。

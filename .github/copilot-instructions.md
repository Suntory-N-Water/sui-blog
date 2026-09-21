## 概要

Astro 7.x と EmDash の公式 Cloudflare ブログテーマを基盤にした個人技術ブログ。ランタイムは pnpm + Node.js、ホスティングは Cloudflare Workers、記事データは D1、画像は R2。

## コマンド

```bash
pnpm run format           # Biome + Prettier (Astro ファイル)
pnpm run lint:ai          # GitHub reporter 形式の lint 出力
pnpm run type-check:ai    # --pretty false での型チェック
pnpm run textlint         # contents/ 内の日本語文章校正 (textlint)
pnpm run textlint:fix     # 自動修正
```


## アーキテクチャ

### コンテンツパイプライン

```
contents/blog/*.md  →  scripts/migrate-emdash.ts  →  seed/seed.json  →  EmDash seed / D1
                                                    ↘  reports/emdash/* (比較・警告)
```
- `contents/blog` は移行元のバックアップ・履歴であり、実行時の記事データ源ではない。
- 公開ページは EmDash の live collection を通じて D1 を読むため、管理画面の編集は再ビルドなしで反映される。

## 記事管理

- 移行元の記事: `contents/blog/YYYY-MM-DD_slug-name.md`
- 移行先のシード: `seed/seed.json`
- 移行レポート: `reports/emdash/`

## CI/CD

- **CI** (`ci.yml`): lint, type-check, svg-security (push 時)
- **Deploy**: Cloudflare Workers Builds で実行。Build command は `pnpm run build`、production deploy command は `pnpm run deploy`、non-production branch deploy command は `pnpm run deploy:preview`。実際の公開・ドメイン切り替えは明示的な依頼があるまで行わない。

## textlint

`contents/` は独立した package.json を持つサブパッケージ。textlint の依存は `contents/package.json` で管理。

## EmDash / Cloudflare

- ローカルのデータ投入は `pnpm exec emdash seed --validate` でシードを検証し、開発サーバーのセットアップ導線で D1/R2 に反映する。
- `pnpm run migrate:emdash` は Markdown を Portable Text に変換し、対応できない表現を `reports/emdash/unsupported.md` に記録する。本文を黙って削除しない。
- Cloudflare の本番 D1/R2 バックアップは `docs/runbook/emdash-backup.md` の手順で取得する。外部状態を変更するため、明示的な依頼なしには実行しない。

## ルール

コーディング規約・セキュリティ規約は `.claude/rules/` にパススコープ付きで配置済み。編集中のファイルに応じて自動ロードされる。

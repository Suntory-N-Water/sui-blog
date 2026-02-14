## 概要

Astro 5.x (SSG) で構築された個人技術ブログ。ランタイムは Bun、ホスティングは Cloudflare Workers。

## コマンド

```bash
bun run format           # Biome + Prettier (Astro ファイル)
bun run lint:ai          # GitHub reporter 形式の lint 出力
bun run type-check:ai    # --pretty false での型チェック
bun run textlint         # contents/ 内の日本語文章校正 (textlint)
bun run textlint:fix     # 自動修正
```


## アーキテクチャ

### コンテンツパイプライン

```
contents/blog/*.md  →  Astro Content Collections (glob loader)  →  静的ページ生成
                       src/content.config.ts で Zod スキーマ定義
```
- Content Collections は `src/content.config.ts` で定義 (Astro 5.x の Content Layer API、glob loader 使用)

## 記事管理

- ブログ記事: `contents/blog/YYYY-MM-DD_slug-name.md`
- 短編記事: `contents/shorts/*.md`

## コーディング規約

- `useConsistentTypeDefinitions`: `type` を使用 (`interface` ではなく)
- `useBlockStatements`: if 文のブロック `{}` 強制
- `noParameterAssign`: パラメータ再代入禁止
- 関数の引数はオブジェクトでまとめる

## CI/CD

- **CI** (`ci.yml`): lint, type-check, svg-security (push 時)
- **Deploy** (`deploy.yml`): PR でプレビューデプロイ、main マージで本番デプロイ (Cloudflare Workers)

## textlint

`contents/` は独立した package.json を持つサブパッケージ。textlint の依存は `contents/package.json` で管理。

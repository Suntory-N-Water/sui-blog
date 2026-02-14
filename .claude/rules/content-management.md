---
paths:
  - "contents/**/*.md"
---

# コンテンツ管理規約

## ブログ記事のファイル

- 配置場所: `contents/blog/`
- ファイル命名規則: `YYYY-MM-DD_slug-name.md`(例: `2026-02-08_my-article.md`)

## frontmatter(src/content.config.ts の Zod スキーマ準拠)

必須フィールド:
- `title`: 記事タイトル(文字列)
- `description`: 記事の説明文(文字列)
- `date`: 公開日(YYYY-MM-DD 形式)

任意フィールド:
- `slug`: URL スラッグ(英語ケバブケース)
- `modified_time`: 更新日(YYYY-MM-DD 形式)
- `tags`: タグの配列(例: `["TypeScript", "Astro"]`)
- `icon`: 絵文字アイコン
- `icon_url`: アイコン画像のパス
- `thumbnail`: サムネイル画像のパス
- `selfAssessment`: 理解度チェッククイズ(オブジェクト)
- `diagram`: 図解セクション(配列)

## 短編記事(Shorts)

- 配置場所: `contents/shorts/`
- 必須フィールド: `title`, `date` のみ

## 日本語文章の校正

- 記事作成・編集後は `bun run textlint` で校正チェックを実行する
- 自動修正は `bun run textlint:fix`
- textlint の設定は `contents/.textlintrc.json` に定義されている
- `contents/` は独立した package.json を持つサブパッケージ

## スキーマ変更

- 新しい frontmatter フィールドを追加する場合は `src/content.config.ts` の Zod スキーマも更新する
- タグを新規追加する場合は `bun run check:tags` で整合性を確認する

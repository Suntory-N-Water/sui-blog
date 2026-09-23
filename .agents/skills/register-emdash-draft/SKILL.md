---
name: register-emdash-draft
description: contents/blog/ の Markdown 記事を、本番の EmDash サイト (https://suntory-n-water.com) に MCP 経由で「下書き」として登録し、本番 D1 の保存内容が元記事と一致するかを確かめる。記事を書き終えた後に「下書き登録して」「EmDash に入れて」「本番に上げて」「CMS に登録」「記事を反映して」などと言われたとき、write-blog-article で記事を作り終えたとき、既存の下書きを記事ファイルの内容で更新したいときは、明示的な指示がなくても必ずこのスキルを使う。公開はしない。
---

# 記事を本番 EmDash に下書き登録する

記事ファイルを Portable Text に変換し、MCP の `content_create` で本番に下書きを作ります。公開は利用者が管理画面で行います。localhost には登録しません。

変換と一致確認はスクリプトで行います。MCP 標準の Markdown 変換は行単位の簡易なもので、表・注意書き・画像・ファイル名付きコード・下線を含む語 (`_x_` が斜体になる) を正しく扱えないためです。`prepare.ts` は記事を remark で解析してブロックを組み立て、MCP の変換で同じ結果になるブロックは Markdown 行のまま、ならないブロックは `<!--ec:block {...} -->` の 1 行に JSON を埋め込んで出力します。この埋め込み行は MCP 側で JSON のまま取り込まれます。

## 守ること

- `content_publish`・`content_unpublish`・`content_schedule`・削除系・`schema_*` は呼ばない。公開や削除は取り消しが難しく、利用者が判断するため
- `content_create` / `content_update` に `status` と `locale` を渡さない。既定の draft と ja が使われる
- 画像を base64 で送らない。`media_upload` は `url` 指定だけを使う
- `content.md` の中身は一字も変えずに `data.content` へ渡す。要約・整形・改行の調整をすると一致確認で不一致になる
- 本番 D1 への書き込み SQL は実行しない。`wrangler d1 execute` は一致確認用の SELECT だけに使う

## 手順

作業ディレクトリはリポジトリのルートです。スクリプトは bun で実行します。

### 1. 変換

```bash
bun .agents/skills/register-emdash-draft/scripts/prepare.ts contents/blog/<ファイル名>.md
```

slug を frontmatter と変えたいときは `--slug <slug>` を付けます。出力は `/tmp/emdash-draft/<slug>/` の `content.md`・`payload.json`・`expected.json` と、次の形式の報告です。

| 項目 | 意味 |
|---|---|
| `ready` | true なら登録に進める |
| `existingPost` | 同じ slug の記事が本番にあれば id と status |
| `missingImages` | 本文の画像のうち、本番のメディアに同名ファイルがないもの |
| `missingIcon` | frontmatter の `icon_url` に対応するメディアがない |
| `unknownTags` | 本番のタグ一覧に一致しないタグ |
| `errors` / `warnings` | 変換できなかった箇所と、表示が崩れる可能性がある箇所 |

wrangler が `Authentication error [code: 10000]` で失敗することがあります。一時的なものなので、同じコマンドをもう一度実行します。

### 2. 不足の解消

`ready` が false のときは、原因ごとに次のとおり対応し、手順 1 をやり直します。

- **missingImages**: 画像ごとに `media_upload` を `url` と `filename` (報告の `filename` と同じ値) と `alt` で呼ぶ。本番のメディアはファイル名で探すため、ファイル名を変えてはいけない。取得に失敗した画像 (403 など) は利用者に報告し、登録を中断する
- **missingIcon**: SVG は MCP から登録できないため、利用者に「管理画面の記事編集で OGP画像 に `<ファイル名>` をアップロードしてください」と依頼して待つ
- **unknownTags**: タグは作らない。似た既存タグがあれば候補として示し、記事の frontmatter をどう直すか利用者に確認する
- **errors**: 内容を報告し、記事側の書き方を直すか利用者に確認する

### 3. 既存記事の確認

- `existingPost` が null: 手順 4 へ
- `existingPost.status` が draft: `content_get` で `_rev` を取り、手順 4 の `content_create` の代わりに `content_update` (`id`・`_rev`・`data`・`taxonomies`) を呼ぶ
- `existingPost.status` が published: 登録を中止し、公開済み記事を上書きしてよいか利用者に確認する。更新すると公開中の内容は変わらず下書きとして保存されるが、利用者の意図を確かめずに進めない

### 4. 登録

`payload.json` と `content.md` を Read で読みます。`content.md` が長い場合も全文を読みます (1 行が長くても Read で読める。2000 行を超えるときは offset を指定して続きを読む)。

`content_create` を次の引数で呼びます。

- `collection`: `"posts"`
- `slug`: payload の `slug`
- `data`: payload の `data` に `content` として content.md の全文を加えたもの
- `taxonomies`: payload の `taxonomies`

`featured_image` は `{id, provider, alt}` だけで送ります。幅や storageKey はサーバーが補います。

### 5. 一致確認

```bash
bun .agents/skills/register-emdash-draft/scripts/verify.ts <slug> <登録結果の id>
```

長い記事では `content_create` の応答が大きすぎて表示されないことがあります。その場合は id を省いて `verify.ts <slug>` を実行します。slug で本番の記事を探し、出力に id が含まれます。

本番 D1 から記事を読み、status・locale・タイトル・概要・更新日・OGP 画像・本文の全ブロック・タグを `expected.json` と比べます。`ok` が false なら、`errors` に出た最初の不一致ブロックを見て原因を調べます。多くは content.md を正確に渡せていないことが原因なので、content.md を読み直して `content_update` で本文だけを送り直し、もう一度 verify.ts を実行します。

### 6. 報告

次を簡潔に報告します。

- 登録した記事の id と slug、新規作成か更新か
- verify.ts の結果 (`ok` とブロック数)
- `warnings` の内容 (例: 表のセル内の脚注は表示時に脚注として扱われない)
- 公開は管理画面 (`https://suntory-n-water.com/_emdash/admin`) で利用者が行うこと

## 変換の仕様

記事の書き方で迷ったとき、または変換結果を調べるときは `references/conversion.md` を読みます。

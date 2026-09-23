---
name: register-emdash-draft
description: contents/blog/ の Markdown 記事を、本番の EmDash サイト (https://suntory-n-water.com) に MCP 経由で「下書き」として登録し、本番 D1 の保存内容が元記事と一致するかを確かめる。記事を書き終えた後に「下書き登録して」「EmDash に入れて」「本番に上げて」「CMS に登録」「記事を反映して」などと言われたとき、write-blog-article で記事を作り終えたとき、既存の下書きを記事ファイルの内容で更新したいときは、明示的な指示がなくても必ずこのスキルを使う。公開はしない。
---

# 記事を本番 EmDash に下書き登録する

`contents/blog/` の Markdown 記事を、本番サイトの EmDash に下書きとして登録します。登録後、本番のデータベース (Cloudflare D1) に保存された内容が記事ファイルと一致するかを確かめます。公開は利用者が管理画面で行います。記事は最終的に本番で公開するため、ローカルの開発サーバーには登録しません。

## 前提

- `.mcp.json` に本番サイトの MCP サーバー `emdash-site` (`https://suntory-n-water.com/_emdash/api/mcp`) が登録され、ログイン済みである
- `wrangler` が本番の Cloudflare アカウントにログイン済みである。一致確認で本番 D1 を読むために使う
- `bun` で TypeScript のスクリプトを実行できる

## 仕組み

EmDash は本文を Portable Text という形式で保存します。Portable Text は段落・見出し・表・画像などを 1 つずつの「ブロック」として並べた JSON です。

MCP の `content_create` は本文に Markdown を受け付けますが、変換は行単位の簡易なものです。表・注意書き・画像・ファイル名付きのコード・下線を含む語 (`_x_` が斜体になる) を正しく扱えません。そのため、変換はスクリプトで行います。

- `scripts/prepare.ts`: 記事を remark で解析してブロックを組み立てる。MCP の変換で同じブロックになるものは Markdown の行のまま出力し、ならないものは `<!--ec:block {...} -->` の 1 行に JSON を埋め込んで出力する。MCP はこの行を JSON のままブロックとして取り込む
- `scripts/verify.ts`: 本番 D1 から記事を読み、`prepare.ts` が出力した期待値と比べる

## 守ること

- `content_publish`・`content_unpublish`・`content_schedule`・削除系・`schema_*` のツールは呼ばない。公開・削除・スキーマ変更は取り消しが難しく、利用者が判断するため
- `content_create` と `content_update` に `status` と `locale` を渡さない。渡さなければサーバー側で下書き (draft) と日本語 (ja) になる
- 画像を base64 で送らない。`media_upload` は `url` を指定する方法だけを使う
- `content.md` の中身は一字も変えずに `data.content` へ渡す。要約・整形・改行の調整をすると一致確認で不一致になる
- 本番 D1 に書き込む SQL は実行しない。`wrangler d1 execute` は一致確認のための SELECT だけに使う

## 手順

作業ディレクトリはリポジトリのルートです。

### 1. 変換

```bash
bun .agents/skills/register-emdash-draft/scripts/prepare.ts contents/blog/<ファイル名>.md
```

記事の先頭の付加情報 (frontmatter) と異なる slug で登録するときは `--slug <slug>` を付けます。出力は `/tmp/emdash-draft/<slug>/` の 3 ファイルと、標準出力の報告です。

| ファイル | 内容 |
|---|---|
| `content.md` | `content_create` の本文に渡す文字列 |
| `payload.json` | slug、本文以外の登録項目 (`data`)、タグ (`taxonomies`) |
| `expected.json` | 一致確認で使う期待値 |

報告には次の項目があります。

| 項目 | 意味 |
|---|---|
| `ready` | true なら登録に進める |
| `existingPost` | 同じ slug の記事が本番にあれば、その id と状態 (draft か published) |
| `missingImages` | 本文の画像のうち、本番のメディアに同じファイル名のものがない画像 |
| `missingIcon` | frontmatter の `icon_url` に対応するメディアが本番にない |
| `unknownTags` | 本番のタグ一覧にないタグ |
| `errors` | 変換できなかった箇所 |
| `warnings` | 変換はできたが、表示が崩れる可能性がある箇所 |

wrangler が `Authentication error [code: 10000]` で失敗することがあります。一時的なものなので、同じコマンドをもう一度実行します。

### 2. 不足の解消

`ready` が false のときは、原因ごとに次のとおり対応し、手順 1 をやり直します。

- **missingImages**: 画像ごとに `media_upload` を `url`・`filename` (報告の `filename` と同じ値)・`alt` を指定して呼ぶ。`prepare.ts` は本番のメディアをファイル名で探すため、ファイル名を変えない。取得に失敗した画像 (403 など) は利用者に報告し、登録を中断する
- **missingIcon**: アイコンは SVG で、MCP からは登録できない。利用者に「管理画面の記事編集画面で、OGP画像 に `<ファイル名>` をアップロードしてください」と依頼し、完了を待つ
- **unknownTags**: タグは作らない。似た既存タグがあれば候補として示し、記事の frontmatter をどう直すか利用者に確認する
- **errors**: 内容を報告し、記事の書き方をどう直すか利用者に確認する

### 3. 既存記事の確認

- `existingPost` が null: 手順 4 で新しく作る
- `existingPost` の状態が draft: `content_get` で `_rev` (更新の衝突を防ぐための版の識別子) を取得する。手順 4 では `content_create` の代わりに `content_update` を `id`・`_rev`・`data`・`taxonomies` を指定して呼ぶ
- `existingPost` の状態が published: 登録を中止し、公開済みの記事を更新してよいか利用者に確認する。更新しても公開中の内容はそのままで、変更は下書きとして保存される。それでも利用者の意図を確かめずに進めない

### 4. 登録

`payload.json` と `content.md` を Read で読みます。`content.md` が長い場合も全文を読みます。1 行が長くても Read で読めます。2000 行を超えるときは offset を指定して続きを読みます。

`content_create` を次の引数で呼びます。

- `collection`: `"posts"`
- `slug`: payload.json の `slug`
- `data`: payload.json の `data` に、`content` として content.md の全文を加えたもの
- `taxonomies`: payload.json の `taxonomies`

`data.featured_image` (OGP 画像) は `{id, provider, alt}` だけを送ります。幅や保存先のキーはサーバーが補います。

### 5. 一致確認

```bash
bun .agents/skills/register-emdash-draft/scripts/verify.ts <slug> <登録結果の id>
```

長い記事では `content_create` の応答が大きすぎて表示されないことがあります。その場合は id を省いて `verify.ts <slug>` を実行します。slug で本番の記事を探し、出力に id が含まれます。

`verify.ts` は、状態・言語・タイトル・概要・更新日・OGP 画像・本文の全ブロック・タグを `expected.json` と比べます。`ok` が false なら、`errors` に出た最初の不一致ブロックから原因を調べます。多くの場合、content.md が一字違わずに渡されていないことが原因です。content.md を読み直して `content_update` で本文だけを送り直し、もう一度 `verify.ts` を実行します。

### 6. 報告

次の内容を簡潔に報告します。

- 登録した記事の id と slug、新規作成か更新か
- `verify.ts` の結果 (`ok` とブロック数)
- `warnings` の内容 (例: 表のセル内の脚注は、表示時に脚注として扱われない)
- 公開は管理画面 (`https://suntory-n-water.com/_emdash/admin`) で利用者が行うこと

## 変換の仕様

記事の書き方で迷ったときや、変換結果を調べるときは `references/conversion.md` を読みます。

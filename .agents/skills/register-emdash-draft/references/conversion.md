# 変換の仕様

`prepare.ts` が記事の各要素をどのブロックに変換するかの一覧です。変換後の形は、サイトの描画処理 (`src/components` と `src/lib`) が表示できる形に合わせています。

| 記事の書き方 | 変換後のブロック | 補足 |
|---|---|---|
| 段落、`**太字**`、`` `コード` ``、`[リンク](url)` | `block` (style normal) | `_x_` のような下線を含む語は、斜体にならず文字のまま残る |
| `## 見出し` | `block` (style h2〜h6) | |
| `- 項目`、`1. 項目` | `block` (listItem bullet / number、level) | 入れ子の深さは level で表す |
| `> 引用` | `block` (style blockquote) | 連続する引用ブロックは、表示時に 1 つにまとまる |
| `> [!NOTE]` などの注意書き | 種類名を太字 1 語で書いた引用ブロックと、本文の引用ブロック | `[!INFO]` は Note、`[!TIPS]` は Tip として扱う |
| 表 | `table` | 1 行目を見出し行にする |
| ```` ```ts src/a.ts ```` または ```` ```ts title="src/a.ts" ```` | `code` (language、filename) | |
| `![代替テキスト](url)` | `image` (asset に本番メディアの id と保存先のキー) | 本番メディアをファイル名で探す |
| `---` | `htmlBlock` (`<hr />`) | 既存記事の区切り線と同じ形 |
| `[^id]` と `[^id]: 説明` | 文字のまま残す | 表示時に脚注へ変換される |

## 表示の制約

- 表のセル内の `[^id]` は脚注として扱われず、文字のまま表示される。この場合は `warnings` に出る
- 注意書きの種類は Note / Tip / Important / Warning / Caution の 5 つ
- frontmatter の `icon_url` は OGP 画像として使う。本番メディアはファイル名で探す (`/icons/memo_flat.svg` なら `memo_flat.svg`)

## frontmatter と登録項目の対応

| frontmatter | 登録項目 |
|---|---|
| `title` | `title` |
| `description` | `excerpt` |
| `modified_time` | `modified_time` |
| `icon_url` | `featured_image` |
| `tags` | `taxonomies.tag` (本番タグの表示名か slug と一致させる。大文字と小文字は区別しない) |
| `slug` | `slug` |

`date` と `icon` は登録しません。公開日は、利用者が管理画面で公開した日時になります。

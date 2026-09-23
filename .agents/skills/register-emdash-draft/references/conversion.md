# 変換の仕様

`prepare.ts` が記事の各要素をどのブロックに変換するかの一覧です。表示は `src/components` と `src/lib` の描画処理に合わせています。

| 記事の書き方 | 変換後 | 補足 |
|---|---|---|
| 段落、`**太字**`、`` `コード` ``、`[リンク](url)` | `block` (style normal) | 下線を含む語はそのまま文字として残る |
| `## 見出し` | `block` (style h2〜h6) | |
| `- 項目`、`1. 項目` | `block` (listItem bullet / number、level) | 入れ子は level で表す |
| `> 引用` | `block` (style blockquote) | 連続する引用ブロックは表示時に 1 つにまとまる |
| `> [!NOTE]` などの注意書き | 太字 1 語だけの引用ブロック + 本文の引用ブロック | `[!INFO]` は Note、`[!TIPS]` は Tip として扱う |
| 表 | `table` | 1 行目を見出し行にする |
| ```` ```ts src/a.ts ```` または ```` ```ts title="src/a.ts" ```` | `code` (language、filename) | |
| `![代替テキスト](url)` | `image` (asset に本番メディアの id と storageKey) | 本番メディアをファイル名で探す |
| `---` | `htmlBlock` (`<hr />`) | 移行済み記事と同じ形 |
| `[^id]` と `[^id]: 説明` | 文字のまま残す | 表示時に脚注へ変換される |

## 表示の制約

- 表のセル内の `[^id]` は脚注として扱われず、文字のまま表示される。`warnings` に出る
- 注意書きの種類は Note / Tip / Important / Warning / Caution の 5 つ
- frontmatter の `icon_url` は OGP 画像として使われ、本番メディアをファイル名で探す (`/icons/memo_flat.svg` なら `memo_flat.svg`)

## frontmatter と登録項目の対応

| frontmatter | 登録項目 |
|---|---|
| `title` | `title` |
| `description` | `excerpt` |
| `modified_time` | `modified_time` |
| `icon_url` | `featured_image` |
| `tags` | `taxonomies.tag` (本番タグの表示名か slug に一致させる。大文字小文字は区別しない) |
| `slug` | `slug` |

`date` と `icon` は登録しません。公開日は利用者が公開した日時になります。

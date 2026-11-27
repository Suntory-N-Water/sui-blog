このリポジトリは、Astro で `contents/blog` の Markdown 記事から静的サイトを生成するブログである。Cloudflare Workers の静的アセットとして配信する。

## コマンド

```bash
pnpm run dev              # Astro 開発サーバーを起動
pnpm run build            # 静的サイトの生成と Pagefind の検索索引の作成
pnpm run preview          # build の結果を wrangler dev で配信
pnpm run icons            # 記事の icon から Fluent Emoji Flat の SVG を取得し、icon_url を更新
```

## 記事

- 記事は `contents/blog/*.md` に置く。frontmatter の `slug` が URL の `/posts/{slug}` になる。
- `icon` に絵文字か Fluent Emoji の URL を書き、`pnpm run icons` を実行すると `public/icons` に SVG を保存して `icon_url` を書き込む。
- `tags` に書いたタグは自動で一覧に載る。タグの URL は小文字・数字・ハイフンだけにする。日本語や大文字を含むタグ名は、`src/lib/tags.ts` の `TAG_SLUG_OVERRIDES` に URL 用の名前を登録しないとビルドが失敗する。

## デプロイ

- main への push で GitHub Actions が `wrangler deploy` を実行する。
- PR では GitHub Actions が `wrangler versions upload --preview-alias pr-{番号}` を実行し、プレビュー URL を PR にコメントする。

## ルール

- すべてのページは静的に生成する(`output: "static"`)。動的なページは `getStaticPaths()` で生成する。
- コード内にコメントを書くことを禁止する。

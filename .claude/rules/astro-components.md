---
paths:
  - "src/**/*.astro"
---

# Astro コンポーネント規約

## frontmatter(---で囲まれた TypeScript 部分)
- import は `@/` エイリアスを使用する
- Props の型を `type Props = { ... }` で定義する
- `Astro.props` でデストラクチャリングして値を受け取る

## テンプレート
- クラス名の結合には `cn()` ユーティリティを使用する(src/lib/utils.ts)
- 繰り返しは `.map()` を使用する

## Islands Architecture
- デフォルトは静的 HTML(クライアントディレクティブなし)
- `client:load`: すぐに必要な UI のみ
- `client:idle`: ページロード完了後に初期化するコンポーネント
- `client:visible`: スクロールして表示された時に初期化するコンポーネント

## レイアウト
- `BaseLayout.astro` をベースレイアウトとして使用する
- SEO メタタグは BaseLayout の Props として渡す(title, description, ogImage, canonicalUrl, ogType, article)

## ページ
- 動的ルートでは `getStaticPaths()` を export する
- Content Collections のデータは `getCollection()` で取得する

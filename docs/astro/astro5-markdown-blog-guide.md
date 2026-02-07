# Astro 5.x Markdownブログコンテンツ作成ガイド

## 概要

このドキュメントはAstro 5.xにおけるMarkdownファイルを使ったブログコンテンツ作成のベストプラクティスをまとめたものです。

## Content Layer API(Astro 5.0の新機能)

Astro 5.0では、Content Layer APIが導入され、パフォーマンスと拡張性が大幅に向上しました。

### Content Collectionsの利点

- **型安全性**: TypeScriptによる自動型生成とIntelliSense
- **バリデーション**: Zodスキーマによる構造検証
- **パフォーマンス**: ビルド間のキャッシング、数万件のコンテンツに対応
- **最適化API**: `getCollection()`などの直感的なクエリAPI
- **ローダーシステム**: 任意のデータソースからのコンテンツ取得

## 基本的なセットアップ

### 1. Content Collectionの定義

`src/content/config.ts`にコレクションを定義します。

```typescript
import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  // ローダー: Markdownファイルのパターンとベースディレクトリを指定
  loader: glob({ pattern: '**/[^_]*.md', base: './src/blog' }),

  // スキーマ: frontmatterの構造を定義
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    author: z.string(),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }),
    tags: z.array(z.string())
  })
});

// コレクションをエクスポート
export const collections = { blog };
```

**ポイント**:
- `glob`ローダーは`pattern`で対象ファイルを指定(`[^_]`で`_`始まりのファイルを除外)
- `schema`でfrontmatterの型定義を行い、バリデーションと型安全性を確保
- 複数のコレクションを定義可能(blog, docs, productsなど)

### 2. Markdownファイルの作成

`src/blog/`配下にMarkdownファイルを作成します。

```markdown
---
title: 'My First Blog Post'
pubDate: 2022-07-01
description: 'This is the first post of my new Astro blog.'
author: 'Astro Learner'
image:
  url: 'https://docs.astro.build/assets/rose.webp'
  alt: 'The Astro logo on a dark background with a pink glow.'
tags: ["astro", "blogging", "learning in public"]
---

# My First Blog Post

Welcome to my _new blog_ about learning Astro! Here, I will share my learning journey as I build a new website.

## What I've accomplished

1. **Installing Astro**: First, I created a new Astro project and set up my online accounts.
2. **Making Pages**: I then learned how to make pages by creating new `.astro` files.
3. **Making Blog Posts**: This is my first blog post!

## What's next

I will finish the Astro tutorial, and then keep adding more posts. Watch this space for more to come.
```

**Frontmatterのベストプラクティス**:
- YAML形式で記述
- スキーマで定義したすべてのフィールドを含める
- 日付は`YYYY-MM-DD`形式で記述
- 配列は`["tag1", "tag2"]`形式で記述
- ネストしたオブジェクト(imageなど)は適切にインデント

### 3. ブログ記事一覧ページの作成

`src/pages/blog/index.astro`を作成します。

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

const posts = await getCollection('blog');
---

<BaseLayout>
  <h1>My Blog Posts</h1>
  <ul>
    {posts.map(post => (
      <li>
        <a href={`/blog/${post.id}`}>{post.data.title}</a>
        <p>{post.data.description}</p>
        <time datetime={post.data.pubDate.toISOString()}>
          {post.data.pubDate.toLocaleDateString()}
        </time>
      </li>
    ))}
  </ul>
</BaseLayout>
```

**ポイント**:
- `getCollection('blog')`でコレクション内のすべての記事を取得
- `post.data`でfrontmatterにアクセス
- `post.id`でファイル名(拡張子なし)にアクセス

### 4. 個別記事ページの作成

`src/pages/blog/[...slug].astro`を作成します。

```astro
---
import { getCollection, render } from 'astro:content';
import MarkdownPostLayout from '../../layouts/MarkdownPostLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---

<MarkdownPostLayout frontmatter={post.data}>
  <Content />
</MarkdownPostLayout>
```

**ポイント**:
- `getStaticPaths()`でSSG用の静的パスを生成
- `render(post)`でMarkdownをHTMLに変換
- `<Content />`コンポーネントでレンダリングされたHTMLを表示
- レイアウトコンポーネントにfrontmatterデータを渡す

## Markdownパイプラインのカスタマイズ

### Remarkプラグイン(Markdown AST処理)

`astro.config.mjs`でRemarkプラグインを設定します。

```javascript
import { defineConfig } from 'astro/config';
import remarkToc from 'remark-toc';

export default defineConfig({
  markdown: {
    remarkPlugins: [
      [remarkToc, { heading: 'toc', maxDepth: 3 }]
    ],
  },
});
```

**よく使われるRemarkプラグイン**:
- `remark-toc`: 目次の自動生成
- `remark-gfm`: GitHub Flavored Markdown対応
- `remark-math`: 数式サポート
- `remark-emoji`: 絵文字変換

### Rehypeプラグイン(HTML AST処理)

```javascript
import { defineConfig } from 'astro/config';
import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

export default defineConfig({
  markdown: {
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'append' }],
      rehypeAccessibleEmojis
    ],
  },
});
```

**よく使われるRehypeプラグイン**:
- `rehype-slug`: 見出しにIDを自動付与
- `rehype-autolink-headings`: 見出しへのアンカーリンク生成
- `rehype-accessible-emojis`: アクセシブルな絵文字変換
- `rehype-preset-minify`: HTML圧縮

### カスタムRemarkプラグインの作成

```javascript
// example-remark-plugin.mjs
export function exampleRemarkPlugin() {
  return function (tree, file) {
    // frontmatterにカスタムプロパティを追加
    file.data.astro.frontmatter.customProperty = 'Generated property';

    // ASTを操作してコンテンツを変更することも可能
  }
}
```

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { exampleRemarkPlugin } from './example-remark-plugin.mjs';

export default defineConfig({
  markdown: {
    remarkPlugins: [exampleRemarkPlugin]
  },
});
```

## パフォーマンス最適化

### Content Collectionsを使うべきケース

1. **複数の関連ファイル**: 同じ構造を持つブログ記事、ドキュメント、製品情報など
2. **型安全性が必要**: エディタでのIntelliSenseとコンパイル時の型チェック
3. **大規模コンテンツ**: 数万件のエントリを扱う場合
4. **リモートCMS**: CMSからコンテンツを取得する場合

### ビルド時最適化

Content Collectionsはビルド時に最適化されます:

- **キャッシング**: ビルド間でデータをキャッシュ
- **静的生成**: すべてのページをビルド時に生成
- **画像最適化**: ビルド時に画像を最適化
- **MDX処理**: ビルド時にMDXをコンパイル

### パフォーマンスベストプラクティス

1. **`getCollection()`の最適化**
   - 必要なコレクションのみをクエリ
   - フィルタリングはビルド時に実行

2. **画像の最適化**
   - Astroの`<Image />`コンポーネントを使用
   - frontmatterで画像メタデータを管理

3. **ビルドサイズの削減**
   - 不要なプラグインを削除
   - `rehype-preset-minify`でHTML圧縮

## ベストプラクティスまとめ

### コンテンツ管理

- ✅ Content Collectionsを使用して型安全性を確保
- ✅ Zodスキーマでfrontmatterをバリデート
- ✅ 共通のfrontmatter構造を統一
- ✅ `_`で始まる下書きファイルをglobパターンで除外

### Markdownパイプライン

- ✅ remarkプラグインでMarkdown構文を拡張
- ✅ rehypeプラグインでHTML出力をカスタマイズ
- ✅ カスタムプラグインで独自の処理を追加
- ✅ プラグインは関数としてインポート(文字列ではない)

### パフォーマンス

- ✅ ビルド時にすべてのページを静的生成
- ✅ Content Layer APIのキャッシング機能を活用
- ✅ 画像最適化を忘れずに実施
- ✅ 不要なプラグインは追加しない

### レイアウトとレンダリング

- ✅ レイアウトコンポーネントでページ構造を統一
- ✅ `render()`関数でMarkdownをHTMLに変換
- ✅ `<Content />`コンポーネントでコンテンツを表示
- ✅ frontmatterデータをレイアウトに渡す

## Legacy Content Collections APIからの移行

Astro 2.x-4.xからAstro 5.xに移行する場合:

1. `src/content/config.ts`に`loader`プロパティを追加
2. `glob`ローダーを使用してファイルパターンを指定
3. 既存のスキーマ定義はそのまま使用可能
4. `getCollection()`などのAPIは互換性あり

Astro 5.0では、Legacy APIと新しいContent Layer APIが共存できます。

## 参考リンク

- [Astro Content Collections公式ドキュメント](https://docs.astro.build/en/guides/content-collections/)
- [Astro Markdown Content公式ドキュメント](https://docs.astro.build/en/guides/markdown-content/)
- [Remark Plugin List](https://github.com/remarkjs/remark/blob/main/doc/plugins.md)
- [Rehype Plugin List](https://github.com/rehypejs/rehype/blob/main/doc/plugins.md)

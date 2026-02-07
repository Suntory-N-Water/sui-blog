# Content Layer API (Astro 5.0)

## 目次
- [概要](#概要)
- [Content Collectionsの利点](#content-collectionsの利点)
- [基本的なセットアップ](#基本的なセットアップ)
- [高度なクエリパターン](#高度なクエリパターン)
- [パフォーマンス最適化](#パフォーマンス最適化)
- [Legacy Content Collections APIからの移行](#legacy-content-collections-apiからの移行)
- [ベストプラクティス](#ベストプラクティス)

## 概要

Astro 5.0で導入されたContent Layer APIは、パフォーマンスと拡張性が大幅に向上した新しいコンテンツ管理システム。

## Content Collectionsの利点

- **型安全性**: TypeScriptによる自動型生成とIntelliSense
- **バリデーション**: Zodスキーマによる構造検証
- **パフォーマンス**: ビルド間のキャッシング、数万件のコンテンツに対応
- **最適化API**: `getCollection()`などの直感的なクエリAPI
- **ローダーシステム**: 任意のデータソースからのコンテンツ取得

## 基本的なセットアップ

### 1. Content Collectionの定義

`src/content/config.ts`にコレクションを定義：

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

`src/blog/`配下にMarkdownファイルを作成：

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

Welcome to my _new blog_ about learning Astro!
```

**Frontmatterのベストプラクティス**:
- YAML形式で記述
- スキーマで定義したすべてのフィールドを含める
- 日付は`YYYY-MM-DD`形式で記述
- 配列は`["tag1", "tag2"]`形式で記述
- ネストしたオブジェクト(imageなど)は適切にインデント

### 3. ブログ記事一覧ページの作成

`src/pages/blog/index.astro`を作成：

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

`src/pages/blog/[...slug].astro`を作成：

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

## 高度なクエリパターン

### フィルタリング

```typescript
// 特定のタグでフィルタ
const astroPost = await getCollection('blog', ({ data }) => {
  return data.tags.includes('astro');
});

// 日付でソート
const sortedPosts = await getCollection('blog');
sortedPosts.sort((a, b) =>
  b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
);

// 下書きを除外
const publishedPosts = await getCollection('blog', ({ data }) => {
  return data.draft !== true;
});
```

### 複数コレクションの統合

```typescript
import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/blog' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    tags: z.array(z.string())
  })
});

const docs = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/docs' }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    order: z.number()
  })
});

export const collections = { blog, docs };
```

```astro
---
import { getCollection } from 'astro:content';

const blogPosts = await getCollection('blog');
const docPages = await getCollection('docs');
---
```

## パフォーマンス最適化

### ビルド時キャッシング

Content Collectionsは自動的にビルド間でキャッシュされる：

- ビルド間でコンテンツがキャッシュされる
- 変更されていないファイルは再処理されない
- 数万件のエントリにも対応可能

**キャッシュディレクトリ**: `./node_modules/.astro`

### キャッシュクリア方法

```bash
# 開発時
rm -r .astro/

# ビルド時
rm -r node_modules/.astro/
```

## Legacy Content Collections APIからの移行

Astro 2.x-4.xからAstro 5.xに移行する場合：

1. `src/content/config.ts`に`loader`プロパティを追加
2. `glob`ローダーを使用してファイルパターンを指定
3. 既存のスキーマ定義はそのまま使用可能
4. `getCollection()`などのAPIは互換性あり

**移行前(Astro 4.x)**:
```typescript
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    // ...
  })
});
```

**移行後(Astro 5.x)**:
```typescript
const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/blog' }),
  schema: z.object({
    title: z.string(),
    // ...
  })
});
```

Astro 5.0では、Legacy APIと新しいContent Layer APIが共存できます。

## ベストプラクティス

1. ✅ Content Collectionsを使用して型安全性を確保
2. ✅ Zodスキーマでfrontmatterをバリデート
3. ✅ 共通のfrontmatter構造を統一
4. ✅ `_`で始まる下書きファイルをglobパターンで除外
5. ✅ `getCollection()`でフィルタリング・ソートを実行
6. ✅ ビルド間でキャッシュディレクトリを保持

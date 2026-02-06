# SEO、RSS、サイトマップ

## 目次
- [RSSフィード](#rssフィード)
- [サイトマップ](#サイトマップ)
- [SEOメタタグ](#seoメタタグ)
- [構造化データ(JSON-LD)](#構造化データjson-ld)
- [タグとページネーション](#タグとページネーション)
- [ベストプラクティス](#ベストプラクティス)

## RSSフィード

### セットアップ

```bash
# @astrojs/rssパッケージをインストール
npm install @astrojs/rss
pnpm add @astrojs/rss
bun add @astrojs/rss
```

```javascript
// astro.config.mjs
export default defineConfig({
  // RSSフィードのリンク生成に必要
  site: 'https://example.com',
});
```

### RSSエンドポイントの作成

```javascript
// src/pages/rss.xml.js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection("blog");

  return rss({
    title: 'Astro Learner | Blog',
    description: 'My journey learning Astro',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}
```

### RSS Schemaの使用

```typescript
// src/content/config.ts
import { defineCollection } from 'astro:content';
import { rssSchema } from '@astrojs/rss';

const blog = defineCollection({
  schema: rssSchema, // RSSに必要なフィールドを強制
});

export const collections = { blog };
```

**rssSchemaに含まれるフィールド**:
- `title` (必須)
- `pubDate` (必須)
- `description` (必須)
- `link` (オプション)
- `author` (オプション)

### RSS自動検出の有効化

```astro
---
// src/layouts/BaseLayout.astro
---
<html>
  <head>
    <link
      rel="alternate"
      type="application/rss+xml"
      title="Your Site's Title"
      href={new URL("rss.xml", Astro.site)}
    />
  </head>
  <body>
    <slot />
  </body>
</html>
```

### フルコンテンツRSS

```javascript
// src/pages/rss.xml.js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';

const parser = new MarkdownIt();

export async function GET(context) {
  const posts = await getCollection("blog");

  return rss({
    title: 'Astro Learner | Blog',
    description: 'My journey learning Astro',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
      // フルコンテンツをHTMLに変換してサニタイズ
      content: sanitizeHtml(parser.render(post.body), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img'])
      }),
    })),
    customData: `<language>en-us</language>`,
  });
}
```

## サイトマップ

### セットアップ

```bash
# @astrojs/sitemapパッケージをインストール
npm install @astrojs/sitemap
pnpm add @astrojs/sitemap
bun add @astrojs/sitemap
```

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com',
  integrations: [sitemap()],
});
```

**自動生成される内容**:
- すべての静的ページのURL
- 最終更新日時(利用可能な場合)
- 変更頻度(設定可能)
- 優先度(設定可能)

### サイトマップのカスタマイズ

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com',
  integrations: [
    sitemap({
      // エントリごとにカスタマイズ
      serialize(item) {
        // 特定URLを除外
        if (/exclude-from-sitemap/.test(item.url)) {
          return undefined;
        }

        // 特定ページの優先度を設定
        if (/blog/.test(item.url)) {
          item.changefreq = 'daily';
          item.lastmod = new Date();
          item.priority = 0.9;
        }

        return item;
      },

      // 外部サイトマップを含める
      customSitemaps: [
        'https://example.com/blog/sitemap.xml',
        'https://example.com/shop/sitemap.xml',
      ],

      // 特定のルートを除外
      filter: (page) => !page.includes('/admin/'),
    }),
  ],
});
```

### サイトマップ検出の改善

```astro
---
// src/layouts/BaseLayout.astro
---
<html>
  <head>
    <link rel="sitemap" href="/sitemap-index.xml" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

## SEOメタタグ

### 基本的なSEOメタタグコンポーネント

```astro
---
// src/components/SEO.astro
interface Props {
  title: string;
  description: string;
  image?: string;
  canonical?: string;
  type?: 'website' | 'article';
  publishedTime?: Date;
  modifiedTime?: Date;
  tags?: string[];
}

const {
  title,
  description,
  image = '/default-og-image.jpg',
  canonical,
  type = 'website',
  publishedTime,
  modifiedTime,
  tags = []
} = Astro.props;

const canonicalURL = canonical || new URL(Astro.url.pathname, Astro.site);
const imageURL = new URL(image, Astro.site);
---

<!-- Primary Meta Tags -->
<title>{title}</title>
<meta name="title" content={title} />
<meta name="description" content={description} />
<link rel="canonical" href={canonicalURL} />

<!-- Open Graph / Facebook -->
<meta property="og:type" content={type} />
<meta property="og:url" content={canonicalURL} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={imageURL} />

{type === 'article' && publishedTime && (
  <meta property="article:published_time" content={publishedTime.toISOString()} />
)}
{type === 'article' && modifiedTime && (
  <meta property="article:modified_time" content={modifiedTime.toISOString()} />
)}
{type === 'article' && tags.map(tag => (
  <meta property="article:tag" content={tag} />
))}

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content={canonicalURL} />
<meta property="twitter:title" content={title} />
<meta property="twitter:description" content={description} />
<meta property="twitter:image" content={imageURL} />
```

### ブログ記事での使用

```astro
---
// src/pages/blog/[slug].astro
import SEO from '../../components/SEO.astro';
import { getCollection, render } from 'astro:content';

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

<html>
  <head>
    <SEO
      title={post.data.title}
      description={post.data.description}
      image={post.data.image.url}
      type="article"
      publishedTime={post.data.pubDate}
      modifiedTime={post.data.updatedDate}
      tags={post.data.tags}
    />
  </head>
  <body>
    <Content />
  </body>
</html>
```

## 構造化データ(JSON-LD)

### ブログ記事の構造化データ

```astro
---
// src/components/BlogPostSchema.astro
interface Props {
  title: string;
  description: string;
  image: string;
  publishedTime: Date;
  modifiedTime?: Date;
  authorName: string;
  authorUrl?: string;
}

const {
  title,
  description,
  image,
  publishedTime,
  modifiedTime,
  authorName,
  authorUrl
} = Astro.props;

const schema = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": title,
  "description": description,
  "image": new URL(image, Astro.site).toString(),
  "datePublished": publishedTime.toISOString(),
  "dateModified": (modifiedTime || publishedTime).toISOString(),
  "author": {
    "@type": "Person",
    "name": authorName,
    ...(authorUrl && { "url": authorUrl })
  }
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### パンくずリストの構造化データ

```astro
---
// src/components/BreadcrumbSchema.astro
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface Props {
  items: BreadcrumbItem[];
}

const { items } = Astro.props;

const schema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": new URL(item.url, Astro.site).toString()
  }))
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

## タグとページネーション

### タグページの実装

```astro
---
// src/pages/tags/[tag].astro
import { getCollection } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";
import BlogPost from "../../components/BlogPost.astro";

export async function getStaticPaths() {
  const allPosts = await getCollection("blog");

  // すべてのユニークなタグを取得
  const uniqueTags = [...new Set(allPosts.map((post) => post.data.tags).flat())];

  return uniqueTags.map((tag) => {
    const filteredPosts = allPosts.filter((post) =>
      post.data.tags.includes(tag)
    );
    return {
      params: { tag },
      props: { posts: filteredPosts }
    };
  });
}

const { tag } = Astro.params;
const { posts } = Astro.props;
---

<BaseLayout pageTitle={tag}>
  <p>Posts tagged with {tag}</p>
  <ul>
    {posts.map((post) => (
      <BlogPost url={`/blog/${post.id}/`} title={post.data.title} />
    ))}
  </ul>
</BaseLayout>
```

### タグインデックスページ

```astro
---
// src/pages/tags/index.astro
import { getCollection } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";

const allPosts = await getCollection("blog");
const tags = [...new Set(allPosts.map((post) => post.data.tags).flat())];

// タグごとの記事数をカウント
const tagCounts = tags.map(tag => ({
  tag,
  count: allPosts.filter(post => post.data.tags.includes(tag)).length
})).sort((a, b) => b.count - a.count);
---

<BaseLayout pageTitle="Tag Index">
  <div class="tags">
    {tagCounts.map(({ tag, count }) => (
      <a href={`/tags/${tag}`} class="tag">
        {tag} ({count})
      </a>
    ))}
  </div>
</BaseLayout>

<style>
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag {
    padding: 0.5em 1em;
    border: 1px dotted #a1a1a1;
    border-radius: 0.5em;
    background-color: #f8fcfd;
    text-decoration: none;
  }

  .tag:hover {
    background-color: #e8f5f7;
  }
</style>
```

### ページネーション

```astro
---
// src/pages/blog/[...page].astro
import { getCollection } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";
import BlogPost from "../../components/BlogPost.astro";

export async function getStaticPaths({ paginate }) {
  const allPosts = await getCollection("blog");

  // 日付順にソート
  const sortedPosts = allPosts.sort((a, b) =>
    b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  // 10件ずつページネーション
  return paginate(sortedPosts, { pageSize: 10 });
}

const { page } = Astro.props;
---

<BaseLayout pageTitle="Blog">
  <ul>
    {page.data.map((post) => (
      <BlogPost url={`/blog/${post.id}/`} title={post.data.title} />
    ))}
  </ul>

  <nav>
    {page.url.prev && <a href={page.url.prev}>Previous</a>}
    <span>Page {page.currentPage} of {page.lastPage}</span>
    {page.url.next && <a href={page.url.next}>Next</a>}
  </nav>
</BaseLayout>
```

### ネストされたページネーション(タグ別)

```astro
---
// src/pages/tags/[tag]/[...page].astro
import { getCollection } from "astro:content";

export async function getStaticPaths({ paginate }) {
  const allPosts = await getCollection("blog");
  const uniqueTags = [...new Set(allPosts.map((post) => post.data.tags).flat())];

  return uniqueTags.flatMap((tag) => {
    const filteredPosts = allPosts.filter((post) =>
      post.data.tags.includes(tag)
    );

    return paginate(filteredPosts, {
      params: { tag },
      pageSize: 10
    });
  });
}

const { page } = Astro.props;
const { tag } = Astro.params;
---
```

## ベストプラクティス

### SEO

1. ✅ すべてのページに適切なメタタグを設定
2. ✅ 構造化データ(JSON-LD)を実装
3. ✅ 画像に`alt`属性を必須化
4. ✅ セマンティックHTMLを使用
5. ✅ ページ読み込み速度を最適化

### RSS

1. ✅ RSSフィードを提供
2. ✅ フルコンテンツを含める(可能な場合)
3. ✅ 自動検出リンクを追加
4. ✅ RSS Schemaでバリデーション

### サイトマップ

1. ✅ サイトマップを自動生成
2. ✅ robots.txtでサイトマップを指定
3. ✅ 不要なページを除外
4. ✅ 優先度と更新頻度を設定

### アクセシビリティ

1. ✅ セマンティックHTMLタグを使用
2. ✅ 画像に適切な`alt`属性
3. ✅ キーボードナビゲーション対応
4. ✅ コントラスト比の確保
5. ✅ スクリーンリーダー対応

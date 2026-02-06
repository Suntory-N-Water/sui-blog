# Astroブログ作成ベストプラクティス

## 概要

このドキュメントは、Astro 5.xを使用したブログシステム構築における公式推奨のベストプラクティスをまとめたものです。アイランドアーキテクチャ、ビルド時間最適化、画像最適化、SEO、RSS、その他の重要な機能について詳細に説明します。

---

## アイランドアーキテクチャ

### 概念

Astroが先駆的に採用した**Islands Architecture**は、ページの大部分を高速な静的HTMLとしてレンダリングし、必要な箇所だけにJavaScriptの「アイランド(島)」を配置する設計パターンです。

**主な特徴**:
- ページの大部分はサーバーレンダリングされた静的HTML
- インタラクティブ性が必要な部分だけクライアントサイドJavaScript
- 各アイランドは独立して動作し、互いに分離されている
- モノリシックなJavaScriptバンドルを回避し、高速なページロードを実現

### クライアントアイランド vs サーバーアイランド

#### クライアントアイランド

インタラクティブなJavaScript UIコンポーネントで、ページの残り部分とは別にハイドレーションされます。

```astro
---
import { Greeting } from '../components/Greeting';
---
<!-- デフォルト: JavaScriptを送信せず、静的HTMLのみ -->
<Greeting />

<!-- ページロード時にハイドレーション -->
<Greeting client:load />

<!-- ビューポートに入ったらハイドレーション -->
<Greeting client:visible />

<!-- ブラウザがアイドル状態になったらハイドレーション -->
<Greeting client:idle />

<!-- メディアクエリにマッチしたらハイドレーション -->
<Greeting client:media="(max-width: 768px)" />
```

**クライアントディレクティブの種類**:
- `client:load` - ページロード直後にハイドレーション(重要なコンポーネント用)
- `client:idle` - ブラウザがアイドル時にハイドレーション(優先度低)
- `client:visible` - ビューポートに入ったらハイドレーション(遅延ロード)
- `client:media` - メディアクエリマッチ時にハイドレーション(レスポンシブ)
- `client:only` - SSRをスキップし、クライアントサイドのみ

#### サーバーアイランド

動的コンテンツを遅延レンダリングするサーバーコンポーネントです。

```astro
---
import Avatar from '../components/Avatar.astro';
import GenericAvatar from '../components/GenericAvatar.astro';
---
<!-- サーバーアイランドとして遅延レンダリング -->
<Avatar server:defer>
  <!-- フォールバックコンテンツ -->
  <GenericAvatar slot="fallback" />
</Avatar>
```

**サーバーアイランドの特徴**:
- ページの残り部分は即座にレンダリング
- アイランド自体は非同期でレンダリング
- フォールバックコンテンツでUX向上
- パーソナライズやデータ取得に最適

### ブログでの使用例

```astro
---
// ブログ記事ページ
import { Image } from 'astro:assets';
import CommentForm from '../components/CommentForm';
import ShareButtons from '../components/ShareButtons';
import RelatedPosts from '../components/RelatedPosts.astro';
---

<!-- 静的コンテンツ: JavaScriptなし -->
<article>
  <h1>{post.data.title}</h1>
  <Image src={post.data.image} alt={post.data.imageAlt} />
  <div set:html={post.body} />
</article>

<!-- アイランド1: コメントフォーム(ページロード時に必要) -->
<CommentForm client:load postId={post.id} />

<!-- アイランド2: シェアボタン(ビューポートに入ったら) -->
<ShareButtons client:visible url={post.url} title={post.data.title} />

<!-- サーバーアイランド: 関連記事(遅延取得) -->
<RelatedPosts server:defer postId={post.id}>
  <div slot="fallback">Loading related posts...</div>
</RelatedPosts>
```

### ベストプラクティス

1. **デフォルトは静的**: コンポーネントにディレクティブを付けない場合、静的HTMLのみが生成される
2. **最小限のハイドレーション**: 本当にインタラクティブ性が必要な部分だけハイドレート
3. **適切なディレクティブ選択**: ユースケースに応じて最適なディレクティブを選択
4. **アイランド間の状態共有**: Nano Storesなどを使用してアイランド間で状態を共有

---

## ビルド時間最適化

### キャッシング戦略

#### Content Collectionsのキャッシング

Content Collectionsは自動的にビルド間でキャッシュされ、パフォーマンスが向上します。

```typescript
// src/content/config.ts
import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/blog' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    // ...
  })
});

export const collections = { blog };
```

**キャッシングの利点**:
- ビルド間でコンテンツがキャッシュされる
- 変更されていないファイルは再処理されない
- 数万件のエントリにも対応可能

#### アセットキャッシング

画像などのアセットもキャッシュディレクトリに保存されます。

```javascript
// astro.config.mjs
export default defineConfig({
  // デフォルト: ./node_modules/.astro
  cacheDir: './node_modules/.astro',
});
```

**キャッシュクリア方法**:
- 開発時: `.astro/fonts` ディレクトリを削除
- ビルド時: `node_modules/.astro/fonts` ディレクトリを削除

### 並列ビルド設定

```javascript
// astro.config.mjs
export default defineConfig({
  build: {
    // デフォルトは1、通常は変更しない
    concurrency: 1
  }
});
```

**重要な注意点**:
- ⚠️ **デフォルト値(1)を変更すべきではない**ケースがほとんど
- メモリ不足や単一スレッドの制約により、高い値は逆効果になる可能性
- 他の最適化手段(キャッシング、バッチ処理)を優先

### ストリーミングによる最適化

データ取得を子コンポーネントに分離し、並列処理することでページの初期表示を高速化します。

```astro
---
// ❌ 悪い例: 順次処理
const personData = await fetch('https://randomuser.me/api/').then(r => r.json());
const factData = await fetch('https://catfact.ninja/fact').then(r => r.json());
---

---
// ✅ 良い例: 並列処理(Promise直接埋め込み)
const personPromise = fetch('https://randomuser.me/api/').then(r => r.json());
const factPromise = fetch('https://catfact.ninja/fact').then(r => r.json());
---
<html>
  <body>
    <h2>A name</h2>
    <p>{personPromise}</p>
    <h2>A fact</h2>
    <p>{factPromise}</p>
  </body>
</html>
```

```astro
---
// ✅ さらに良い例: コンポーネント分離
import RandomName from '../components/RandomName.astro';
import RandomFact from '../components/RandomFact.astro';
---
<html>
  <body>
    <h2>A name</h2>
    <RandomName />
    <h2>A fact</h2>
    <RandomFact />
  </body>
</html>
```

### MDX最適化

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [
    mdx({
      // MDXの最適化を有効化(ビルド時間とレンダリング速度を改善)
      optimize: true,
    }),
  ],
});
```

**注意点**:
- デフォルトは無効
- エスケープされていないHTMLが生成される可能性がある
- インタラクティブ機能のテストが必要

### ビルド時間最適化のベストプラクティス

1. ✅ Content Collectionsを使用してキャッシングを活用
2. ✅ ビルド間でキャッシュディレクトリを保持
3. ✅ データ取得を並列化
4. ✅ 長時間実行されるタスク(fetch、データアクセス)をキャッシュ
5. ✅ MDX最適化を検討(テスト後)
6. ❌ `build.concurrency`を安易に変更しない

---

## 画像最適化

### `<Image />`コンポーネント

Astroの`<Image />`コンポーネントは、画像を自動的に最適化します。

```astro
---
import { Image } from 'astro:assets';
import myImage from '../assets/my_image.png'; // 1600x900
---

<!-- 基本的な使用 -->
<Image src={myImage} alt="A description of my image." />

<!-- 優先読み込み(above-the-fold画像用) -->
<Image src={myImage} alt="Hero image" priority />

<!-- レスポンシブ画像 -->
<Image
  src={myImage}
  alt="Responsive image"
  layout="constrained"
  widths={[400, 800, 1200]}
/>
```

**生成されるHTML**:
```html
<img
  src="/_astro/my_image.hash.webp"
  width="1600"
  height="900"
  decoding="async"
  loading="lazy"
  alt="A description of my image."
/>
```

**自動最適化の内容**:
- WebPやAVIFなどの最適化フォーマットへの変換
- `loading="lazy"` による遅延読み込み
- `decoding="async"` による非同期デコード
- ファイル名のハッシュ化(長期キャッシュ可能)
- レスポンシブ画像用の `srcset` と `sizes` 自動生成

### `<Picture />`コンポーネント

複数のフォーマットとサイズに対応する画像を生成します。

```astro
---
import { Picture } from 'astro:assets';
import myImage from '../assets/my_image.png';
---

<Picture
  src={myImage}
  formats={['avif', 'webp']}
  alt="A description of my image."
/>
```

**生成されるHTML**:
```html
<picture>
  <source srcset="/_astro/my_image.hash.avif" type="image/avif" />
  <source srcset="/_astro/my_image.hash.webp" type="image/webp" />
  <img
    src="/_astro/my_image.hash.png"
    width="1600"
    height="900"
    decoding="async"
    loading="lazy"
    alt="A description of my image."
  />
</picture>
```

### レスポンシブ画像

#### グローバル設定

```javascript
// astro.config.mjs
export default defineConfig({
  image: {
    // すべての画像をレスポンシブに
    layout: 'constrained',
    // レスポンシブスタイルを有効化
    responsiveStyles: true
  }
});
```

**`layout`オプション**:
- `constrained` - コンテナに合わせてリサイズ(デフォルト)
- `full-width` - 幅100%でリサイズ
- `fixed` - 固定サイズ(レスポンシブではない)

#### コンポーネントごとの設定

```astro
---
import { Image } from 'astro:assets';
import heroImage from '../assets/hero.png';
---

<!-- コンテナに合わせてリサイズ -->
<Image
  src={heroImage}
  alt="Hero"
  layout="constrained"
  widths={[400, 800, 1200]}
  sizes="(max-width: 768px) 100vw, 50vw"
/>

<!-- 全幅でリサイズ -->
<Image
  src={heroImage}
  alt="Banner"
  layout="full-width"
/>
```

### Markdownでの画像最適化

標準のMarkdown構文でも自動最適化されます。

```markdown
<!-- ローカル画像: 自動最適化 -->
![Alt text](../assets/image.png)

<!-- リモート画像: 承認済みソースから最適化 -->
![Alt text](https://example.com/image.jpg)

<!-- public/配下の画像: 最適化されない -->
![Alt text](/static-image.png)
```

### `getImage()`関数

プログラマティックに画像を最適化する場合に使用します。

```astro
---
import { getImage } from "astro:assets";
import myBackground from "../background.png";

const optimizedBackground = await getImage({
  src: myBackground,
  format: 'avif',
  width: 1920,
  height: 1080
});
---

<div style={`background-image: url(${optimizedBackground.src});`}>
  <!-- コンテンツ -->
</div>
```

### カスタムレスポンシブコンポーネント

```astro
---
import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";

interface Props {
  mobileImgUrl: string | ImageMetadata;
  desktopImgUrl: string | ImageMetadata;
  alt: string;
}

const { mobileImgUrl, desktopImgUrl, alt } = Astro.props;

const mobileImg = await getImage({
  src: mobileImgUrl,
  format: "webp",
  width: 400,
  height: 400,
});

const desktopImg = await getImage({
  src: desktopImgUrl,
  format: "webp",
  width: 1200,
  height: 400,
});
---

<picture>
  <source media="(max-width: 799px)" srcset={mobileImg.src} />
  <source media="(min-width: 800px)" srcset={desktopImg.src} />
  <img src={desktopImg.src} alt={alt} />
</picture>
```

### ブログでの画像最適化ベストプラクティス

1. ✅ `<Image />`コンポーネントを使用(HTML `<img>`タグは避ける)
2. ✅ ヒーロー画像には`priority`属性を付与
3. ✅ レスポンシブ画像を設定(モバイル対応)
4. ✅ `alt`属性は必須(アクセシビリティ)
5. ✅ ローカル画像は`src/assets/`に配置
6. ✅ 静的画像(最適化不要)のみ`public/`に配置
7. ✅ 複数フォーマット対応には`<Picture />`を使用

---

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

---

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

---

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
---

<BaseLayout pageTitle="Tag Index">
  <div class="tags">
    {tags.map((tag) => (
      <a href={`/tags/${tag}`} class="tag">{tag}</a>
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
  }
</style>
```

### ネストされたページネーション

```astro
---
// src/pages/[tag]/[page].astro
export function getStaticPaths({ paginate }) {
  const allTags = ["astro", "javascript", "typescript"];
  const allPosts = await getCollection("blog");

  return allTags.flatMap((tag) => {
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

---

## 総合ベストプラクティス

### パフォーマンス

1. ✅ SSG(Static Site Generation)をデフォルトとして使用
2. ✅ Content Collectionsでコンテンツを管理
3. ✅ `<Image />`コンポーネントで画像を最適化
4. ✅ アイランドアーキテクチャで最小限のJavaScript
5. ✅ ビルド間でキャッシュを保持

### SEO

1. ✅ RSSフィードを提供
2. ✅ サイトマップを生成
3. ✅ メタタグを適切に設定
4. ✅ セマンティックHTML
5. ✅ 画像に`alt`属性を必須化

### アクセシビリティ

1. ✅ `alt`属性は常に設定
2. ✅ セマンティックHTMLタグを使用
3. ✅ キーボードナビゲーション対応
4. ✅ コントラスト比の確保

### コンテンツ管理

1. ✅ Content Collectionsで型安全性を確保
2. ✅ Zodスキーマでバリデーション
3. ✅ 一貫したfrontmatter構造
4. ✅ タグによるコンテンツ分類

### ビルドとデプロイ

1. ✅ 本番環境に対してテストを実行
2. ✅ ビルド時間を監視
3. ✅ CI/CDパイプラインを構築
4. ✅ プレビューデプロイを活用

---

## 参考リンク

- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/)
- [Astro Images Guide](https://docs.astro.build/en/guides/images/)
- [Astro RSS Feed](https://docs.astro.build/en/guides/rss/)
- [Astro Sitemap Integration](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)

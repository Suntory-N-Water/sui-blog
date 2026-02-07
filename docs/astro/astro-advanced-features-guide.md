# Astro高度な機能 - プロジェクト実装ガイド

## 概要

このドキュメントは、sui Tech Blogプロジェクトで実際に使用している技術について、Astro公式のベストプラクティスを調査・整理したものです。

---

## Cloudflare統合とデプロイ

### Cloudflare Pagesへのデプロイ

#### 基本セットアップ

```bash
# Wrangler CLIのインストール
npm install wrangler@latest --save-dev
pnpm add wrangler@latest --save-dev
bun add wrangler@latest --dev

# Cloudflareアダプターのインストール
npx astro add cloudflare
pnpm astro add cloudflare
```

#### 設定ファイル

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static', // 静的サイトの場合
  adapter: cloudflare(),
});
```

#### ビルドとデプロイ

```bash
# ビルドとデプロイを一度に実行
npx astro build && wrangler pages deploy ./dist
pnpm astro build && wrangler pages deploy ./dist

# ローカルプレビュー(Cloudflare Pages環境をシミュレート)
npx astro build && wrangler pages dev ./dist
pnpm astro build && wrangler pages dev ./dist
```

### 環境変数の管理

#### `wrangler.jsonc`での設定

```jsonc
{
  "vars": {
    "MY_VARIABLE": "test",
    "PUBLIC_API_URL": "https://api.example.com"
  }
}
```

#### Astroコンポーネントでのアクセス

```astro
---
// Cloudflareランタイムから環境変数にアクセス
const myVar = Astro.locals.runtime.env.MY_VARIABLE;
---

<p>Variable: {myVar}</p>
```

#### APIエンドポイントでのアクセス

```typescript
// src/pages/api/example.ts
export async function GET({ locals }) {
  const myVar = locals.runtime.env.MY_VARIABLE;
  return new Response(JSON.stringify({ myVar }));
}
```

### Cloudflare特有の設定

#### 静的アセットルーティング

```javascript
// astro.config.mjs
export default defineConfig({
  adapter: cloudflare({
    routes: {
      extend: {
        // 静的生成されたPagefind検索を除外(サーバー関数を経由しない)
        exclude: [{ pattern: '/pagefind/*' }],
        // 事前レンダリングされたページをサーバー関数経由でオンデマンドレンダリング
        include: [{ pattern: '/static' }],
      }
    },
  }),
});
```

**用途**:
- Pagefindなどのビルド時に静的生成される検索インデックス
- 特定のルートをサーバーレンダリングから除外

#### 404ハンドリング

```jsonc
// wrangler.jsonc
{
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  }
}
```

### Cloudflare ImagesとR2統合

このプロジェクトでは、Cloudflare ImagesとR2を使用した画像最適化を実装しています。

```typescript
// カスタムrehypeプラグインでCloudflare Images URLに変換
export function rehypeCloudflareImages() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'img' && node.properties?.src) {
        const src = String(node.properties.src);

        // Cloudflare Images URLに変換
        const optimizedUrl = transformToCloudflareImagesUrl(src);
        node.properties.src = optimizedUrl;

        // レスポンシブ画像属性を追加
        node.properties.loading = 'lazy';
        node.properties.decoding = 'async';
      }
    });
  };
}
```

**最適化内容**:
- 自動フォーマット変換(WebP、AVIF)
- レスポンシブ画像(srcset生成)
- 遅延読み込み
- Cloudflare CDN配信

### デプロイベストプラクティス

1. ✅ `wrangler.jsonc`で環境変数を管理
2. ✅ Pagefindなどの静的アセットをルート除外
3. ✅ ローカルで`wrangler pages dev`でテスト
4. ✅ 404ページをカスタマイズ
5. ✅ Cloudflare ImagesでCDN配信

---

## Pagefind検索統合

### Pagefindとは

Pagefindは、静的サイト向けの全文検索ライブラリです。ビルド時にインデックスを生成し、クライアントサイドで高速な検索を提供します。

### セットアップ

#### インストール

```bash
npm install -D pagefind
pnpm add -D pagefind
bun add -D pagefind
```

#### ビルドスクリプトの設定

```json
// package.json
{
  "scripts": {
    "build": "astro build && pagefind --site dist"
  }
}
```

### Astro統合

#### Pagefind除外設定(Cloudflare)

```javascript
// astro.config.mjs
export default defineConfig({
  adapter: cloudflare({
    routes: {
      extend: {
        // Pagefindの静的ファイルをサーバー関数から除外
        exclude: [{ pattern: '/pagefind/*' }],
      }
    },
  }),
});
```

**重要**: Pagefindはビルド時に`dist/pagefind/`ディレクトリに検索インデックスを生成します。この静的ファイルはサーバーレンダリングの対象外にする必要があります。

### クライアントサイド実装

```typescript
// src/types/env.d.ts
interface Window {
  PagefindUI: PagefindUIInterface;
}

interface PagefindUIInterface {
  new (options: {
    element: string;
    showSubResults?: boolean;
    showImages?: boolean;
  }): PagefindUIInstance;
}

interface PagefindUIInstance {
  // Pagefindのメソッド
}
```

```astro
---
// src/components/Search.astro
---
<div id="search"></div>

<script>
  // Pagefindスクリプトを動的にロード
  const script = document.createElement('script');
  script.src = '/pagefind/pagefind-ui.js';
  script.onload = () => {
    new window.PagefindUI({
      element: '#search',
      showSubResults: true,
      showImages: false,
    });
  };
  document.body.appendChild(script);
</script>

<link href="/pagefind/pagefind-ui.css" rel="stylesheet">
```

### 検索対象の制御

```astro
---
// 検索対象に含める
---
<article data-pagefind-body>
  <h1>記事タイトル</h1>
  <p>本文...</p>
</article>

---
// 検索対象から除外
---
<nav data-pagefind-ignore>
  <a href="/">ホーム</a>
</nav>
```

### ベストプラクティス

1. ✅ ビルド後にPagefindインデックスを生成
2. ✅ Cloudflareデプロイ時は`/pagefind/*`を除外
3. ✅ `data-pagefind-body`で検索対象を明示
4. ✅ `data-pagefind-ignore`で不要な部分を除外
5. ✅ クライアントサイドで動的にスクリプトをロード

---

## View Transitions API

### 基本セットアップ

View Transitions APIは、ページ遷移時にスムーズなアニメーションを提供します。

```astro
---
// src/layouts/BaseLayout.astro
import { ClientRouter } from "astro:transitions";
---
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>

    <!-- View Transitions有効化 -->
    <ClientRouter />
  </head>
  <body>
    <slot />
  </body>
</html>
```

### アニメーションのカスタマイズ

#### ビルトインアニメーション

```astro
---
import { fade, slide } from 'astro:transitions';
---

<!-- フェードアニメーション -->
<div transition:animate="fade">
  コンテンツ
</div>

<!-- スライドアニメーション -->
<div transition:animate="slide">
  コンテンツ
</div>

<!-- デュレーションのカスタマイズ -->
<div transition:animate={fade({ duration: '0.4s' })}>
  コンテンツ
</div>

<div transition:animate={slide({ duration: 400 })}>
  コンテンツ
</div>
```

#### アニメーションの無効化

```astro
<!-- ページ全体のアニメーションを無効化 -->
<html transition:animate="none">
  <head>
    <ClientRouter />
  </head>
  <body>
    <!-- 特定の要素だけアニメーション -->
    <main transition:animate="slide">
      コンテンツ
    </main>
  </body>
</html>
```

### 要素の対応付け

```astro
---
// src/pages/index.astro
---
<aside transition:name="hero">
  <h1>ホームページ</h1>
</aside>

---
// src/pages/about.astro
---
<aside transition:name="hero">
  <h1>アバウトページ</h1>
</aside>
```

**重要**: `transition:name`が同じ要素は、ページ遷移時にアニメーションで繋がります。

### プログラマティックナビゲーション

```typescript
// src/components/Navigation.tsx
import { navigate } from 'astro:transitions/client';

export default function Navigation() {
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <nav>
      <button onClick={() => handleNavigate('/about')}>
        アバウト
      </button>
      <button onClick={() => handleNavigate('/blog')}>
        ブログ
      </button>
    </nav>
  );
}
```

#### ナビゲーションオプション

```typescript
// 履歴に追加
navigate('/about', { history: 'push' });

// 履歴を置き換え
navigate('/about', { history: 'replace' });

// 自動(デフォルト)
navigate('/about', { history: 'auto' });

// POSTリクエスト
const formData = new FormData();
formData.append('name', 'John');
navigate('/submit', { formData });

// カスタム情報を渡す
navigate('/page', {
  info: { source: 'menu-click' }
});
```

### View Transitionsの検出

```typescript
// クライアントサイドスクリプト
import { transitionEnabledOnThisPage } from 'astro:transitions/client';

if (transitionEnabledOnThisPage) {
  console.log('View Transitions有効');
} else {
  console.log('View Transitions無効');
}
```

### ライフサイクルイベント

```astro
<script>
  document.addEventListener('astro:before-preparation', (event) => {
    console.log('ナビゲーション準備開始', event.detail);
  });

  document.addEventListener('astro:before-swap', (event) => {
    console.log('DOMスワップ直前', event.detail);
  });

  document.addEventListener('astro:after-swap', () => {
    console.log('DOMスワップ完了');
  });

  document.addEventListener('astro:page-load', () => {
    console.log('ページロード完了');
  });
</script>
```

### ベストプラクティス

1. ✅ `ClientRouter`をベースレイアウトに配置
2. ✅ `transition:name`で要素を対応付け
3. ✅ アニメーションデュレーションを調整
4. ✅ 不要なアニメーションは無効化
5. ✅ ライフサイクルイベントで副作用を管理

---

## React統合とハイドレーション

### Reactインテグレーションのセットアップ

```bash
# Reactインテグレーションのインストール
npx astro add react
pnpm astro add react
```

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
});
```

### 基本的な使用方法

#### 静的レンダリング(デフォルト)

```astro
---
// src/pages/index.astro
import MyReactComponent from '../components/MyReactComponent.jsx';
---

<html>
  <body>
    <h1>Astro + React</h1>
    <!-- デフォルトでは静的HTML、JavaScriptは送信されない -->
    <MyReactComponent />
  </body>
</html>
```

```jsx
// src/components/MyReactComponent.jsx
export default function MyReactComponent() {
  return (
    <div>
      <h2>静的Reactコンポーネント</h2>
      <p>JavaScriptなし、HTMLのみ</p>
    </div>
  );
}
```

### クライアントディレクティブ

#### `client:load` - ページロード時

```astro
<InteractiveButton client:load />
```

**用途**:
- すぐに必要なインタラクティブコンポーネント
- ページ読み込み時に即座にハイドレーション

**例**:
- ヘッダーのハンバーガーメニュー
- モーダルダイアログのトリガー

#### `client:idle` - アイドル時

```astro
<ChatWidget client:idle />
```

**用途**:
- 優先度の低いインタラクティブコンポーネント
- ブラウザがアイドル状態になってからハイドレーション

**例**:
- チャットウィジェット
- ソーシャルメディア埋め込み

#### `client:visible` - ビューポート表示時

```astro
<InteractiveCounter client:visible />
```

**用途**:
- 画面下部にあるコンポーネント
- スクロールして表示されたらハイドレーション

**例**:
- 画像カルーセル
- コメントセクション
- インタラクティブグラフ

#### `client:media` - メディアクエリ

```astro
<MobileMenu client:media="(max-width: 768px)" />
```

**用途**:
- レスポンシブデザイン
- 特定の画面サイズでのみハイドレーション

**例**:
- モバイル専用メニュー
- タブレット専用UI

#### `client:only` - クライアントサイドのみ

```astro
<BrowserOnlyComponent client:only="react" />
```

**用途**:
- SSRで問題が発生するコンポーネント
- ブラウザAPIに依存するコンポーネント

**例**:
- `window`オブジェクトに依存
- ローカルストレージアクセス

### 複数フレームワークの統合

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import preact from '@astrojs/preact';
import svelte from '@astrojs/svelte';

export default defineConfig({
  integrations: [
    react({
      include: ['**/react/*'], // reactディレクトリ配下
    }),
    preact({
      include: ['**/preact/*'], // preactディレクトリ配下
    }),
    svelte({
      include: ['**/svelte/*'], // svelteディレクトリ配下
    }),
  ],
});
```

```astro
---
// 同じページで複数のフレームワークを使用
import MyReactComponent from '../components/react/MyReactComponent.jsx';
import MySvelteComponent from '../components/svelte/MySvelteComponent.svelte';
import MyPreactComponent from '../components/preact/MyPreactComponent.jsx';
---

<div>
  <MyReactComponent client:load />
  <MySvelteComponent client:visible />
  <MyPreactComponent client:idle />
</div>
```

### コンポーネントのネスト

```astro
---
// 親Astroコンポーネント
import MyReactSidebar from '../components/MyReactSidebar.jsx';
import MyReactButton from '../components/MyReactButton.jsx';
import MySvelteButton from '../components/MySvelteButton.svelte';
---

<MyReactSidebar>
  <p>サイドバーのコンテンツ</p>

  <!-- スロットで複数フレームワークのコンポーネントを渡す -->
  <div slot="actions">
    <MyReactButton client:idle />
    <MySvelteButton client:idle />
  </div>
</MyReactSidebar>
```

```jsx
// src/components/MyReactSidebar.jsx
export default function MyReactSidebar({ children, actions }) {
  return (
    <aside>
      <div className="content">
        {children}
      </div>
      <div className="actions">
        {actions}
      </div>
    </aside>
  );
}
```

### プロジェクトでの実装例

このプロジェクトでは、以下のようにReactコンポーネントを使用しています：

```astro
---
// src/pages/blog/[slug].astro
import SearchDialog from '@/components/feature/search/search-dialog';
import MarkdownContent from '@/components/feature/content/markdown-content';
import ThemeToggle from '@/components/ui/theme-toggle';
---

<!-- 検索ダイアログ: ページロード時に必要 -->
<SearchDialog client:load />

<!-- テーマ切り替え: ページロード時に必要 -->
<ThemeToggle client:load />

<!-- Markdownコンテンツ: スクロールして表示されたら -->
<MarkdownContent html={post.content} client:visible />
```

### ベストプラクティス

1. ✅ デフォルトは静的レンダリング(JavaScriptなし)
2. ✅ 必要な場合のみクライアントディレクティブを使用
3. ✅ `client:load`は最小限に(重要なUIのみ)
4. ✅ `client:visible`で遅延読み込み
5. ✅ `client:idle`で優先度の低いコンポーネント
6. ✅ 複数フレームワークは`include`で明示的に分離

---

## 統合ベストプラクティスまとめ

### Cloudflare

1. ✅ `wrangler.jsonc`で環境変数を管理
2. ✅ 静的アセット(Pagefindなど)をルート除外
3. ✅ ローカルで`wrangler pages dev`でテスト
4. ✅ Cloudflare Imagesで画像最適化
5. ✅ R2統合でアセット配信

### Pagefind

1. ✅ ビルド後にインデックス生成
2. ✅ `/pagefind/*`をサーバーレンダリングから除外
3. ✅ `data-pagefind-body`で検索対象を制御
4. ✅ クライアントサイドで動的にロード

### View Transitions

1. ✅ `ClientRouter`をベースレイアウトに配置
2. ✅ `transition:name`で要素を対応付け
3. ✅ アニメーションデュレーションを適切に設定
4. ✅ ライフサイクルイベントで副作用を管理
5. ✅ プログラマティックナビゲーションで柔軟な制御

### React統合

1. ✅ デフォルトは静的レンダリング
2. ✅ `client:load`は最小限(重要なUIのみ)
3. ✅ `client:visible`で遅延読み込み
4. ✅ `client:idle`で優先度の低いコンポーネント
5. ✅ 複数フレームワークは明示的に分離

---

## 参考リンク

- [Cloudflare Pages Deployment](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Pagefind公式ドキュメント](https://pagefind.app/)
- [View Transitions Guide](https://docs.astro.build/en/guides/view-transitions/)
- [React Integration](https://docs.astro.build/en/guides/integrations-guide/react/)
- [Framework Components](https://docs.astro.build/en/guides/framework-components/)

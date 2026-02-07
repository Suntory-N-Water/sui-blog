# ビルド時間最適化

## 目次
- [キャッシング戦略](#キャッシング戦略)
- [並列ビルド設定](#並列ビルド設定)
- [ストリーミングによる最適化](#ストリーミングによる最適化)
- [データ取得の最適化](#データ取得の最適化)
- [MDX最適化](#mdx最適化)
- [ビルドサイズの削減](#ビルドサイズの削減)
- [ビルド時間の計測](#ビルド時間の計測)
- [静的アセットの最適化](#静的アセットの最適化)
- [ビルド時間最適化のベストプラクティス](#ビルド時間最適化のベストプラクティス)
- [実践例：ブログビルドの最適化](#実践例ブログビルドの最適化)
- [監視とチューニング](#監視とチューニング)

## キャッシング戦略

### Content Collectionsのキャッシング

Content Collectionsは自動的にビルド間でキャッシュされ、パフォーマンスが向上する。

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

### アセットキャッシング

画像などのアセットもキャッシュディレクトリに保存される。

```javascript
// astro.config.mjs
export default defineConfig({
  // デフォルト: ./node_modules/.astro
  cacheDir: './node_modules/.astro',
});
```

**キャッシュクリア方法**:

```bash
# 開発時
rm -r .astro/

# ビルド時
rm -r node_modules/.astro/
```

### CI/CDでのキャッシュ活用

```yaml
# GitHub Actions example
- name: Cache Astro build
  uses: actions/cache@v3
  with:
    path: |
      node_modules/.astro
      .astro
    key: ${{ runner.os }}-astro-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-astro-
```

## 並列ビルド設定

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

## ストリーミングによる最適化

データ取得を子コンポーネントに分離し、並列処理することでページの初期表示を高速化する。

### アンチパターン：順次処理

```astro
---
// ❌ 悪い例: 順次処理
const personData = await fetch('https://randomuser.me/api/').then(r => r.json());
const factData = await fetch('https://catfact.ninja/fact').then(r => r.json());
---

<html>
  <body>
    <h2>A name</h2>
    <p>{personData.results[0].name.first}</p>
    <h2>A fact</h2>
    <p>{factData.fact}</p>
  </body>
</html>
```

**問題点**:
- `personData`の取得が完了するまで`factData`の取得が開始されない
- 合計待機時間 = 取得1 + 取得2

### パターン1：Promise直接埋め込み

```astro
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

**利点**:
- 両方のfetchが並列実行される
- 合計待機時間 = max(取得1, 取得2)

### パターン2：コンポーネント分離(推奨)

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

```astro
---
// src/components/RandomName.astro
const data = await fetch('https://randomuser.me/api/').then(r => r.json());
---
<p>{data.results[0].name.first}</p>
```

```astro
---
// src/components/RandomFact.astro
const data = await fetch('https://catfact.ninja/fact').then(r => r.json());
---
<p>{data.fact}</p>
```

**利点**:
- コンポーネントが独立して並列実行される
- 再利用可能で保守性が高い
- テストしやすい

## データ取得の最適化

### 1. 必要なデータのみ取得

```typescript
// ❌ 悪い例: すべての記事を取得
const allPosts = await getCollection('blog');
const latestPost = allPosts[0];

// ✅ 良い例: フィルタリングして必要な記事のみ取得
const latestPost = (await getCollection('blog'))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())[0];
```

### 2. データのプリフェッチ

```astro
---
// 複数のデータを並列取得
const [posts, authors, tags] = await Promise.all([
  getCollection('blog'),
  getCollection('authors'),
  getCollection('tags')
]);
---
```

### 3. キャッシュ可能なデータの活用

```typescript
// グローバルデータをキャッシュ
const cachedData = await import('../data/static-data.json');
```

## MDX最適化

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

**使用前のチェックリスト**:
- [ ] インタラクティブコンポーネントが正常に動作するか
- [ ] HTMLエスケープが適切か
- [ ] パフォーマンス向上が実測できるか

## ビルドサイズの削減

### 1. 不要な依存関係の削除

```bash
# 使用されていない依存関係を検出
npx depcheck

# 不要なパッケージを削除
npm uninstall unused-package
```

### 2. Tree Shakingの活用

```javascript
// ❌ 悪い例: デフォルトインポート
import _ from 'lodash';

// ✅ 良い例: 名前付きインポート
import { debounce } from 'lodash-es';
```

### 3. コード分割

```astro
---
// 動的インポート
const HeavyComponent = () => import('../components/HeavyComponent.jsx');
---

<HeavyComponent client:visible />
```

## ビルド時間の計測

### 1. ビルド時間の記録

```bash
# ビルド時間を計測
time npm run build

# 詳細なビルド情報を取得
npm run build -- --verbose
```

### 2. パフォーマンスプロファイリング

```javascript
// astro.config.mjs
export default defineConfig({
  // ビルドパフォーマンスを記録
  experimental: {
    // 実験的機能の有効化
  }
});
```

## 静的アセットの最適化

### 1. 画像最適化

```astro
---
import { Image } from 'astro:assets';
import hero from '../assets/hero.png';
---

<!-- ビルド時に最適化 -->
<Image src={hero} alt="Hero" />
```

### 2. フォントの最適化

```astro
<link
  rel="preload"
  href="/fonts/custom-font.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

### 3. CSSの最適化

Astroは自動的にCSSを最適化：
- 未使用CSSの削除
- CSS Modulesのスコープ化
- インラインクリティカルCSS

## ビルド時間最適化のベストプラクティス

### 推奨事項

1. ✅ Content Collectionsを使用してキャッシングを活用
2. ✅ ビルド間でキャッシュディレクトリを保持
3. ✅ データ取得を並列化
4. ✅ 長時間実行されるタスク(fetch、データアクセス)をキャッシュ
5. ✅ MDX最適化を検討(テスト後)
6. ✅ コンポーネント分離でストリーミング活用
7. ✅ 不要な依存関係を削除
8. ✅ Tree Shakingを活用

### 避けるべき事項

1. ❌ `build.concurrency`を安易に変更しない
2. ❌ すべてのデータを一度に取得しない
3. ❌ デフォルトインポートで大きなライブラリを読み込まない
4. ❌ ビルド時にキャッシュを削除しない
5. ❌ 順次処理で複数のAPIを呼び出さない

## 実践例：ブログビルドの最適化

### Before(最適化前)

```astro
---
// src/pages/blog/index.astro
const allPosts = await getCollection('blog');
const allAuthors = await getCollection('authors');
const allTags = await getCollection('tags');

// 順次処理
for (const post of allPosts) {
  const author = allAuthors.find(a => a.id === post.data.authorId);
  post.author = author;
}
---
```

**問題点**:
- すべてのデータを一度に取得
- 順次処理でループ
- ビルド時間: 30秒

### After(最適化後)

```astro
---
// src/pages/blog/index.astro
// 並列取得
const [posts, authors] = await Promise.all([
  getCollection('blog'),
  getCollection('authors')
]);

// Mapで高速検索
const authorMap = new Map(authors.map(a => [a.id, a]));

// 必要なデータのみ処理
const publishedPosts = posts
  .filter(p => !p.data.draft)
  .slice(0, 10); // 最新10件のみ

const postsWithAuthors = publishedPosts.map(post => ({
  ...post,
  author: authorMap.get(post.data.authorId)
}));
---
```

**改善点**:
- 並列取得でデータ取得時間を短縮
- Mapで検索を高速化
- 必要なデータのみ処理
- ビルド時間: 10秒(66%削減)

## 監視とチューニング

### 1. ビルド時間の追跡

```json
// package.json
{
  "scripts": {
    "build": "astro build",
    "build:measure": "time npm run build"
  }
}
```

### 2. バンドルサイズの分析

```bash
# バンドルサイズを分析
npm run build -- --analyze
```

### 3. 継続的な改善

- ビルド時間を定期的に計測
- ボトルネックを特定
- 段階的に最適化
- パフォーマンス回帰を防ぐ

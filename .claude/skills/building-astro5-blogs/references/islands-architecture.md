# Islands Architecture

## 目次
- [概念](#概念)
- [クライアントアイランド vs サーバーアイランド](#クライアントアイランド-vs-サーバーアイランド)
- [ブログでの使用例](#ブログでの使用例)
- [ベストプラクティス](#ベストプラクティス)
- [パフォーマンスへの影響](#パフォーマンスへの影響)
- [アイランド間の状態共有](#アイランド間の状態共有)

## 概念

Astroが先駆的に採用した**Islands Architecture**は、ページの大部分を高速な静的HTMLとしてレンダリングし、必要な箇所だけにJavaScriptの「アイランド(島)」を配置する設計パターン。

**主な特徴**:
- ページの大部分はサーバーレンダリングされた静的HTML
- インタラクティブ性が必要な部分だけクライアントサイドJavaScript
- 各アイランドは独立して動作し、互いに分離されている
- モノリシックなJavaScriptバンドルを回避し、高速なページロードを実現

## クライアントアイランド vs サーバーアイランド

### クライアントアイランド

インタラクティブなJavaScript UIコンポーネントで、ページの残り部分とは別にハイドレーションされる。

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

### クライアントディレクティブの種類と使い分け

#### `client:load` - ページロード直後
**用途**: すぐに必要な重要なコンポーネント
**例**:
- ヘッダーのハンバーガーメニュー
- モーダルダイアログのトリガー
- コメントフォーム

**パフォーマンス影響**: 高(すぐにJavaScriptをロード・実行)

#### `client:idle` - ブラウザアイドル時
**用途**: 優先度の低いインタラクティブコンポーネント
**例**:
- チャットウィジェット
- ソーシャルメディア埋め込み
- 分析スクリプト

**パフォーマンス影響**: 低(メインスレッドが空いてから実行)

#### `client:visible` - ビューポート表示時
**用途**: 画面下部にあるコンポーネント
**例**:
- シェアボタン
- コメントセクション
- 画像カルーセル
- インタラクティブグラフ

**パフォーマンス影響**: 低(スクロールして表示されるまで遅延)

#### `client:media` - メディアクエリ
**用途**: レスポンシブデザイン、特定の画面サイズでのみ必要
**例**:
- モバイル専用メニュー
- タブレット専用UI

**パフォーマンス影響**: 低(条件マッチ時のみ)

#### `client:only` - クライアントサイドのみ
**用途**: SSRで問題が発生するコンポーネント
**例**:
- `window`オブジェクトに依存
- ローカルストレージアクセス
- ブラウザAPIに依存

**パフォーマンス影響**: 中(SSRスキップ、クライアントのみで実行)

### サーバーアイランド

動的コンテンツを遅延レンダリングするサーバーコンポーネント。

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

## ブログでの使用例

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

## ベストプラクティス

1. **デフォルトは静的**: コンポーネントにディレクティブを付けない場合、静的HTMLのみが生成される
2. **最小限のハイドレーション**: 本当にインタラクティブ性が必要な部分だけハイドレート
3. **適切なディレクティブ選択**: ユースケースに応じて最適なディレクティブを選択
4. **アイランド間の状態共有**: Nano Storesなどを使用してアイランド間で状態を共有

## パフォーマンスへの影響

### 推奨パターン
```astro
<!-- ✅ 良い例: 静的コンテンツはディレクティブなし -->
<article>{content}</article>

<!-- ✅ 良い例: 画面下部のインタラクティブ要素は遅延 -->
<ShareButtons client:visible />

<!-- ✅ 良い例: 優先度低い機能はアイドル時 -->
<Newsletter client:idle />
```

### アンチパターン
```astro
<!-- ❌ 悪い例: すべてをclient:loadで読み込む -->
<Header client:load />
<Article client:load />
<Footer client:load />

<!-- ❌ 悪い例: 静的コンテンツにディレクティブ -->
<StaticText client:load />
```

## アイランド間の状態共有

複数のアイランドで状態を共有する場合、Nano Storesを使用：

```javascript
// src/stores/cart.js
import { atom } from 'nanostores';

export const cartItems = atom([]);

export function addToCart(item) {
  cartItems.set([...cartItems.get(), item]);
}
```

```jsx
// src/components/AddToCart.jsx
import { useStore } from '@nanostores/react';
import { cartItems, addToCart } from '../stores/cart';

export default function AddToCart({ product }) {
  const $cartItems = useStore(cartItems);

  return (
    <button onClick={() => addToCart(product)}>
      Add to Cart ({$cartItems.length})
    </button>
  );
}
```

```jsx
// src/components/CartCount.jsx
import { useStore } from '@nanostores/react';
import { cartItems } from '../stores/cart';

export default function CartCount() {
  const $cartItems = useStore(cartItems);

  return <span>Cart: {$cartItems.length}</span>;
}
```

```astro
---
import AddToCart from './AddToCart';
import CartCount from './CartCount';
---
<!-- 両方のコンポーネントが同じストアを参照 -->
<CartCount client:load />
<AddToCart client:visible product={product} />
```

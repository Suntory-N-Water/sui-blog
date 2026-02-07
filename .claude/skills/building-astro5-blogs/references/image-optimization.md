# 画像最適化

## 目次
- [Astroの画像最適化システム](#astroの画像最適化システム)
- [`<Image />`コンポーネント](#imageコンポーネント)
- [`<Picture />`コンポーネント](#pictureコンポーネント)
- [レスポンシブ画像](#レスポンシブ画像)
- [Markdownでの画像最適化](#markdownでの画像最適化)
- [`getImage()`関数](#getimage関数)
- [カスタムレスポンシブコンポーネント](#カスタムレスポンシブコンポーネント)
- [画像フォーマットの選択](#画像フォーマットの選択)
- [ブログでの画像最適化ベストプラクティス](#ブログでの画像最適化ベストプラクティス)
- [パフォーマンス指標への影響](#パフォーマンス指標への影響)

## Astroの画像最適化システム

Astroは組み込みの画像最適化機能を提供し、パフォーマンスとUXを向上させる。

## `<Image />`コンポーネント

基本的な画像最適化コンポーネント。

### 基本的な使用

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

### 生成されるHTML

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

### 自動最適化の内容

- WebPやAVIFなどの最適化フォーマットへの変換
- `loading="lazy"` による遅延読み込み
- `decoding="async"` による非同期デコード
- ファイル名のハッシュ化(長期キャッシュ可能)
- レスポンシブ画像用の `srcset` と `sizes` 自動生成

### `priority`属性

Above-the-fold(初期表示領域)の画像には`priority`を指定：

```astro
<Image src={heroImage} alt="Hero" priority />
```

**効果**:
- `loading="lazy"`が削除される
- 優先的にロード
- LCP(Largest Contentful Paint)の改善

## `<Picture />`コンポーネント

複数のフォーマットとサイズに対応する画像を生成。

### 基本的な使用

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

### 生成されるHTML

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

**`<Picture />`を使うべき場合**:
- 複数のフォーマット(AVIF、WebP、PNG)を提供したい
- アートディレクション(画面サイズごとに異なる画像)が必要
- ブラウザ互換性を最大限に確保したい

## レスポンシブ画像

### グローバル設定

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

### コンポーネントごとの設定

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

<!-- 固定サイズ -->
<Image
  src={heroImage}
  alt="Logo"
  layout="fixed"
  width={200}
  height={100}
/>
```

### `sizes`属性の使い方

`sizes`属性はブラウザに画像の表示サイズを伝える：

```astro
<Image
  src={image}
  alt="..."
  widths={[400, 800, 1200, 1600]}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
/>
```

**解説**:
- モバイル(768px以下)：ビューポート幅の100%
- タブレット(768px〜1200px)：ビューポート幅の50%
- デスクトップ(1200px以上)：800px固定

## Markdownでの画像最適化

標準のMarkdown構文でも自動最適化される。

```markdown
<!-- ローカル画像: 自動最適化 -->
![Alt text](../assets/image.png)

<!-- リモート画像: 承認済みソースから最適化 -->
![Alt text](https://example.com/image.jpg)

<!-- public/配下の画像: 最適化されない -->
![Alt text](/static-image.png)
```

**重要**:
- `src/assets/`配下の画像は自動最適化
- `public/`配下の画像は最適化されない(そのまま配信)
- リモート画像は`image.domains`で承認が必要

### リモート画像の承認

```javascript
// astro.config.mjs
export default defineConfig({
  image: {
    domains: ['example.com', 'cdn.example.com'],
  }
});
```

## `getImage()`関数

プログラマティックに画像を最適化する場合に使用。

### 基本的な使用

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

### 複数サイズの生成

```astro
---
import { getImage } from "astro:assets";
import heroImage from "../hero.png";

const sizes = [400, 800, 1200];
const images = await Promise.all(
  sizes.map(width =>
    getImage({
      src: heroImage,
      format: 'webp',
      width
    })
  )
);
---

<picture>
  {images.map((img, i) => (
    <source
      srcset={img.src}
      media={`(min-width: ${sizes[i]}px)`}
    />
  ))}
  <img src={images[0].src} alt="Hero" />
</picture>
```

## カスタムレスポンシブコンポーネント

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

## 画像フォーマットの選択

### フォーマットの特徴

| フォーマット | ファイルサイズ | ブラウザサポート | 用途 |
|------------|--------------|------------------|------|
| AVIF | 最小 | モダンブラウザのみ | 最高品質・最小サイズ |
| WebP | 小 | ほぼすべて | バランス型 |
| JPEG | 中 | すべて | フォールバック |
| PNG | 大 | すべて | 透過が必要 |

### 推奨設定

```astro
<!-- 最適な組み合わせ -->
<Picture
  src={image}
  formats={['avif', 'webp']}
  alt="..."
/>
```

**理由**:
- AVIFに対応したブラウザには最小サイズを配信
- WebPにフォールバック
- 元のフォーマット(JPEG/PNG)に最終フォールバック

## ブログでの画像最適化ベストプラクティス

### 1. `<Image />`コンポーネントを使用

```astro
<!-- ❌ 悪い例 -->
<img src="/images/photo.jpg" alt="Photo" />

<!-- ✅ 良い例 -->
<Image src={photo} alt="Photo" />
```

### 2. ヒーロー画像には`priority`属性

```astro
<Image src={heroImage} alt="Hero" priority />
```

### 3. レスポンシブ画像を設定

```astro
<Image
  src={image}
  alt="..."
  layout="constrained"
  widths={[400, 800, 1200]}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### 4. `alt`属性は必須

```astro
<!-- ❌ 悪い例 -->
<Image src={image} alt="" />

<!-- ✅ 良い例 -->
<Image src={image} alt="Detailed description of the image" />
```

### 5. ローカル画像は`src/assets/`に配置

```
src/
├── assets/
│   ├── hero.png      ✅ 最適化される
│   └── logo.svg      ✅ 最適化される
└── pages/
public/
└── favicon.ico       ❌ 最適化されない
```

### 6. 複数フォーマット対応には`<Picture />`

```astro
<Picture
  src={image}
  formats={['avif', 'webp']}
  alt="..."
/>
```

## パフォーマンス指標への影響

### LCP(Largest Contentful Paint)
- ヒーロー画像に`priority`を使用
- レスポンシブ画像で適切なサイズを配信
- AVIF/WebPで転送サイズを削減

### CLS(Cumulative Layout Shift)
- 幅と高さを明示的に指定
- レイアウトシフトを防ぐ

```astro
<!-- ✅ 良い例: 幅と高さを指定 -->
<Image src={image} alt="..." width={800} height={600} />
```

### FID(First Input Delay)
- `loading="lazy"`で below-the-fold 画像を遅延読み込み
- JavaScriptバンドルサイズを削減

# Shorts機能設計

## 概要

ブログには掲載しないが、技術的なメモやTipsを掲載する「Shorts」機能。Instagram/TikTok/YouTubeショートのような縦型スクロール体験を提供する。

## コンセプト

- **軽量な技術メモ**: ブログ記事ほど重くない、サクッと読める技術情報
- **無限ループ**: 最後のショートから最初に戻り、継続的に閲覧可能
- **モバイルファースト**: スマートフォンでの閲覧を最優先

## アーキテクチャ

### コンポーネント構成

```
shorts/
├── shorts-card.astro          # 共通カードコンポーネント
├── shorts-grid.astro          # グリッドレイアウト(一覧ページ)
└── shorts-carousel.astro      # カルーセルレイアウト(トップページ)
```

### ページ構成

```
pages/
├── shorts/
│   ├── index.astro           # 一覧ページ(グリッド表示)
│   └── [...slug].astro       # 詳細ページ(ビューアー)
└── index.astro               # トップページ(カルーセル表示)
```

## カードコンポーネント設計

### 意図

`shorts-grid.astro`と`shorts-carousel.astro`でカード表示ロジックが重複していたため、`shorts-card.astro`に共通化。

### 構造

- **Props**: `short: CollectionEntry<'shorts'> & { body?: string }`
- **高さ固定**: `h-[480px]`で統一
- **ホバー効果**: ブログカードと同様の上方向移動(`hover:-translate-y-1`)
- **枠線**: `border border-border`、ホバー時に`border-primary/50`

### レイアウト別の使い方

#### グリッド(一覧ページ)

```astro
<div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-1'>
  {shorts.map((short) => <ShortsCard short={short} />)}
</div>
```

- CSS Gridで自動的に幅が揃う
- レスポンシブ: 1列 → 2列 → 3列

#### カルーセル(トップページ)

```astro
<div class='flex gap-6 overflow-x-auto pb-8 pt-1 scrollbar-hide snap-x snap-mandatory'>
  {shorts.map((short) => (
    <div class='w-[280px] shrink-0 snap-start'>
      <ShortsCard short={short} />
    </div>
  ))}
</div>
```

- Flexboxで横スクロール
- **幅固定**: `w-[280px]`で統一(Flexboxではコンテンツ量で幅が変わるため)
- `shrink-0`で縮小防止
- スナップスクロール対応

### 余白調整

グリッド・カルーセル共通で`pt-1`を追加。ホバー時に上方向移動しても親要素からはみ出さないようにするため。

## ビューアー設計

### UI/UXコンセプト

Instagram/TikTok風の縦型フルスクリーンビューアー。

### レイアウト構造

```
┌─────────────────────┐
│ [←] タイトル        │ ← ヘッダー(固定、半透明)
│ ━━━━━━━━━━━━━━━━━   │ ← プログレスバー
├─────────────────────┤
│                     │
│   コンテンツ        │ ← スクロール可能
│   (Markdown)      │
│                     │
│                     │
├─────────────────────┤
│        [→]          │ ← 次へボタン
└─────────────────────┘
```

### ヘッダー

- **配置**: 上部固定(`absolute top-0`)
- **背景**: `bg-background/98`で濃い半透明 + `backdrop-blur-md`
- **境界線**: `border-b border-border/50`で視覚的な区切り
- **構成**: 戻るボタン(左) + タイトル(中央)

#### タイトル

- **行数制限**: `line-clamp-2`で最大2行
- **フォントサイズ**: `text-lg`
- **配置**: `items-start`で上揃え

### プログレスバー

- **配置**: ヘッダー内下部
- **太さ**: `h-1`(当初0.5pxで見えにくかった)
- **間隔**: `gap-2`
- **背景**: `bg-muted/50`
- **アクティブ**: `bg-primary`で100%幅

### コンテンツエリア

- **パディング**: `pt-32`でヘッダーと重ならないように
- **スクロール**: `overflow-y-auto`
- **ページ送り**: 横スクロール(`overflow-x-hidden`)でページを切り替え

### 次へボタン

- **配置**: 下部中央(`bottom-6 right-1/2 translate-x-1/2`)
- **デザイン**: 円形ボタン(`h-12 w-12`)
- **アイコン**: 下向き矢印(`ArrowRight`を`rotate-90`で回転)
- **背景**: `bg-primary`で目立たせる
- **境界線**: `border-2 border-background`で縁取り

#### 意図

当初は右側中央に配置していたが、コンテンツと重なって読めなくなる問題があった。下部中央に移動することで:
- コンテンツが読みやすい
- YouTube Shorts風の操作感
- タップしやすい位置

### ページ送り機能

#### クリック/タップ

- **左半分クリック**: 前ページ
- **右半分クリック**: 次ページ
- **リンク/ボタン**: ページ送りを無視(イベント伝播を防ぐ)

#### スワイプ

- **左スワイプ**: 次ページ
- **右スワイプ**: 前ページ
- **閾値**: 50px

### 無限ループ

```typescript
const nextShort =
  index < sortedShorts.length - 1
    ? sortedShorts[index + 1]
    : sortedShorts[0];  // 最後 → 最初
```

最後のショートの次へボタンを押すと、最初のショートに戻る。ショート動画のように継続的に閲覧可能。

### スクリプト実装

#### 初期化関数

```typescript
function initShortsPage() {
  // DOM操作、イベントリスナー登録
}

// 初回実行
initShortsPage();

// View Transitions対応
document.addEventListener('astro:page-load', initShortsPage);
```

#### なぜReactではなくスクリプトタグか

- **軽量**: HTMLは静的生成、JavaScriptは最小限
- **シンプル**: DOM操作が直感的
- **パフォーマンス**: クライアントサイドの処理が少ない

React化すると:
- 全体をクライアントサイドレンダリング
- バンドルサイズ増加
- 静的生成のメリットを失う

動的な部分(ページ送り、プログレスバー)のみJavaScriptで制御するのが最適。

## データフロー

### コンテンツ取得

```typescript
const allShorts = await getCollection('shorts');
const sortedShorts = allShorts.sort(
  (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
);
```

### Markdown処理

```typescript
// ページ分割(--- 区切り)
const pages = splitMarkdownPages(short.body ?? '');

// 各ページをコンパイル
const compiledPages = await Promise.all(
  pages.map((page) => compileMarkdown({ source: page }))
);
```

### 一覧表示用(先頭ページのみ)

```typescript
// トップページ、一覧ページ
const firstPageMarkdown = getFirstPage(short.body ?? '');
const compiledHtml = await compileMarkdown({ source: firstPageMarkdown });
```

## スタイリング方針

### ブログカードとの統一

- ホバー効果: 上方向移動(`hover:-translate-y-1`)
- 枠線: `border border-border` → `hover:border-primary/50`
- シャドウ: `shadow-sm` → `hover:shadow-md`

### レスポンシブ

- **モバイル**: 1列表示、カルーセルスクロール
- **タブレット**: 2列表示
- **デスクトップ**: 3列表示

### ダークモード対応

- 半透明背景: `bg-background/98`
- ぼかし: `backdrop-blur-md`
- 境界線: `border-border/50`

## 制約・トレードオフ

### カルーセルの幅固定

- **問題**: Flexboxではコンテンツ量で幅が変わる
- **解決**: `w-[280px]`で固定
- **トレードオフ**: レスポンシブ性が低下するが、一貫性を優先

### ヘッダーの半透明

- **意図**: コンテンツが透けて見える
- **トレードオフ**: 視認性がやや低下するが、没入感を優先
- **対策**: `bg-background/98`で濃いめ + `backdrop-blur-md`でぼかし

### 次へボタンの配置

- **当初**: 右側中央(Instagram風)
- **問題**: コンテンツと重なって読めない
- **解決**: 下部中央(YouTube Shorts風)
- **トレードオフ**: 操作感は変わるが、読みやすさを優先

## 今後の拡張可能性

- 前へボタンの追加(現在は左クリック/スワイプのみ)
- お気に入り機能
- シェア機能
- カテゴリ別フィルタリング
- 検索機能

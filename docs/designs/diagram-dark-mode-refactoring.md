# 図解ページのダークモード対応とJavaScript削減

## 概要

`src/components/feature/diagram/` 配下の図解コンポーネント群を、ブログの既存UI/UXテーマに統合し、ダークモード対応と不要なJavaScriptの削除を実施する。

## 背景

### 現状の問題点

1. **React Context API(useContext)を使用**
   - `ThemeContext`と`useTheme()`でテーマ管理
   - すべてのコンポーネントがReactのランタイムを必要とする
   - `client:load`が必須となり、不要なJavaScriptを送信

2. **ハードコードされたカラーパレット**
   - `DEFAULT_THEME`に固定色を定義
   ```typescript
   export const DEFAULT_THEME: ArticleTheme = {
     colors: {
       navy: '#0E2A47',
       gold: '#D99834',
       grayBg: '#F4F6F8',
       white: '#FFFFFF',
       textMain: '#374151',
       textLight: '#6B7280',
     },
   };
   ```
   - ブログの既存テーマ(`globals.css`)と一貫性がない

3. **ダークモード非対応**
   - CSS変数を使用していない
   - ブログの`.dark`クラスによる自動切り替えに対応していない

4. **Astro 5.x Islands Architectureに反する**
   - 静的コンテンツであるにもかかわらず、JavaScriptが必須
   - Astroのベストプラクティス「デフォルトは静的」に違反

## 設計判断

### 1. React ContextからCSS変数への移行

**決定**: React Contextを削除し、CSS変数を使用する

**理由**:
- Astro 5.xのベストプラクティスに従う(Islands Architecture)
- ダークモード対応がCSSレベルで自動化される
- 不要なJavaScriptを削減(ページロード高速化)
- ブログの既存テーマとの一貫性

**影響範囲**:
- `content-common.tsx`: `ThemeContext`、`useTheme()`、`DEFAULT_THEME`を削除
- 各セクションコンポーネント: `useTheme()`の呼び出しを削除
- `dynamic-page-builder.tsx`: `ThemeContext.Provider`を削除

### 2. カラーパレットのマッピング

**決定**: 既存の図解カラーをブログのCSS変数にマッピングする

| 図解の色(旧) | ブログのCSS変数(新) | 用途 |
|---|---|---|
| `navy` (#0E2A47) | `--primary` | 見出し、強調色 |
| `gold` (#D99834) | `--accent` | アクセント(ボーダー、ハイライト) |
| `grayBg` (#F4F6F8) | `--muted` | 背景色(セクション) |
| `white` (#FFFFFF) | `--background` | カード背景 |
| `textMain` (#374151) | `--foreground` | 本文テキスト |
| `textLight` (#6B7280) | `--muted-foreground` | 補足テキスト |

**理由**:
- ブログ全体で統一されたカラーパレット
- ダークモードで自動的に色が切り替わる
- 保守性の向上(色の変更が`globals.css`で一元管理)

### 3. スタイルの実装方法

**決定**: Tailwind CSSクラスを優先し、必要に応じてインラインCSS変数を使用

**パターン1: Tailwind CSSクラス(推奨)**
```tsx
<h1 className='text-primary font-bold'>
  {data.title}
</h1>
```

**パターン2: インラインCSS変数(複雑なスタイル)**
```tsx
<div
  className='border-l-4'
  style={{ borderColor: 'hsl(var(--accent))' }}
>
  {data.subtitle}
</div>
```

**理由**:
- Tailwind CSSの設計システムと統合
- `globals.css`のCSS変数定義を活用
- ダークモード対応が自動化される

### 4. コンポーネントの静的化

**決定**: すべての図解コンポーネントを静的HTMLとして出力する

**変更前**:
```astro
<!-- client:loadが必須 -->
<DynamicPageBuilder data={ARTICLE_DEMO_DATA} client:load />
```

**変更後**:
```astro
<!-- 静的HTML(JavaScriptなし) -->
<DynamicPageBuilder data={ARTICLE_DEMO_DATA} />
```

**理由**:
- 図解コンテンツはインタラクティブ性が不要
- ページロード速度の向上
- Astro 5.xのSSGの利点を最大化

## 実装計画

### Phase 1: 共通ユーティリティの更新

1. `content-common.tsx`の修正
   - `ThemeContext`、`useTheme()`、`DEFAULT_THEME`を削除
   - `Icon`、`FormattedText`コンポーネントは保持(ユーティリティとして有用)

### Phase 2: 各セクションコンポーネントの修正

修正対象:
- `hero-section.tsx`
- `problem-section.tsx`
- `core-message-section.tsx`
- `steps-section.tsx`
- `message-section.tsx`
- `action-section.tsx`
- `transition-section.tsx`

修正内容:
- `useTheme()`の削除
- `style={{ color: colors.navy }}`を`className='text-primary'`に変更
- 背景色を`bg-muted`、`bg-background`に変更
- ボーダー色を`border-primary`、`border-accent`に変更

### Phase 3: DynamicPageBuilderの簡素化

- `ThemeContext.Provider`の削除
- `theme`プロパティの削除(不要になる)

### Phase 4: 型定義の更新

`src/types/diagram.ts`:
- `ArticleTheme`型の削除(不要になる)

## トレードオフ

### メリット

1. **パフォーマンス向上**
   - JavaScriptバンドルサイズの削減
   - ページロード速度の向上
   - First Contentful Paint (FCP)の改善

2. **保守性の向上**
   - カラーパレットが`globals.css`で一元管理
   - ブログ全体で統一されたデザイン
   - ダークモード対応がCSSレベルで自動化

3. **Astro 5.xベストプラクティスへの準拠**
   - Islands Architectureの原則「デフォルトは静的」に従う
   - 不要なJavaScriptを送信しない

### デメリット

1. **動的なテーマ変更が不可**
   - ユーザーが記事ごとにテーマを選択する機能は実装できない
   - 将来的にこの要件が発生した場合、再設計が必要

2. **CSS変数の制約**
   - `hsl(var(--primary))`のように記述する必要がある
   - Tailwindの`text-primary`が使えない場合、インラインスタイルが必要

## 判断基準

現時点では、以下の理由により「CSS変数への移行」を選択する。

1. **要件**: 図解はブログの一部であり、ブログのテーマに従うべき
2. **パフォーマンス**: 静的コンテンツであり、JavaScriptは不要
3. **保守性**: カラーパレットの一元管理が重要
4. **ダークモード**: ブログ全体で統一されたダークモード体験

**将来的に動的テーマ変更が必要になった場合**: CSS変数を複数定義し、Astroのクラス切り替えで対応可能。React Contextは不要。

## 検証項目

実装後、以下を確認する。

- [x] ライトモードで正しく表示される
- [x] ダークモードで正しく表示される
- [x] JavaScriptなしで動作する(`client:load`不要)
- [x] ブログの既存テーマと統一感がある

## 実装完了

すべてのコンポーネントの修正が完了しました。

- React Context削除: `content-common.tsx`から`ThemeContext`、`useTheme()`を削除
- CSS変数対応: 全11ファイルのスタイルをTailwind CSSクラスに移行
- 型定義更新: `types/diagram.ts`から`ArticleTheme`型を削除
- 静的化: `client:load`を削除し、静的HTMLとしてレンダリング可能に

型チェック結果: エラーなし(`bunx astro check`で確認済み)

## 参考

- [Astro 5.x Islands Architecture](https://docs.astro.build/en/concepts/islands/)
- [Tailwind CSS v4 CSS変数](https://tailwindcss.com/docs/customizing-colors#using-css-variables)
- ブログのカラーパレット: `src/styles/globals.css`

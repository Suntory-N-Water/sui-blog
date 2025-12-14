# Next.js → Astro 移行手順書

## 1. 背景・経緯

### 脆弱性の発生
- **CVE-2025-55182** (CVSS 10.0) がReact Server Componentsで発見
- 認証なしリモートコード実行（Unauthenticated Remote Code Execution）
- Next.js 13.3.x～16.0.x が影響を受ける
- Server Functionsエンドポイントを実装していなくても、React Server Componentsをサポートしていれば脆弱

### 技術選定見直しの理由
- 深刻度10.0は社会問題レベルの脆弱性
- 今後も類似の脆弱性が発生する可能性を考慮
- より安定したSSG中心のフレームワークへの移行を決断

### Astro選定理由
- SSGがデフォルトで、React Server Componentsの脆弱性リスクがない
- Next.jsと同じエコシステム（unified/remark/rehype）をサポート
- 既存コードの大部分を再利用可能
- Markdownファイルベースのブログと相性が良い
- パフォーマンス最適化が容易

---

## 2. 現在のシステム構成

### 使用技術スタック
- **フレームワーク**: Next.js 16.0.7 (App Router)
- **ランタイム**: Bun
- **言語**: TypeScript 5.9.3 (strict mode)
- **UI**: React 19.2.1
- **スタイリング**: Tailwind CSS 3.4.18 + Radix UI
- **Markdown処理**: unified, remark, rehype
- **検索**: Pagefind
- **コード品質**: Biome 2.3.7
- **セキュリティ**: DOMPurify + jsdom

### ディレクトリ構造
```
sui-blog/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # ui/shared/feature の3層構造
│   ├── lib/             # ビジネスロジック
│   ├── config/          # サイト設定
│   └── constants/       # 定数定義
├── contents/blog/       # Markdownブログ記事
├── public/              # 静的ファイル
│   └── icons/          # SVGアイコン（ビルド時埋め込み）
├── scripts/             # ビルド・自動化スクリプト
└── docs/adr/            # Architecture Decision Records
```

---

## 3. 現在のコア機能詳細

### 3-1. SSG (Static Site Generation)
- ビルド時に全ブログ記事を静的生成
- `generateStaticParams()` でルートパラメータを生成
- `revalidate = false` で完全静的化

### 3-2. contents/blog/ Markdown読み込み
- Node.js `fs` APIで `contents/blog/` 配下を読み込み
- `gray-matter` でフロントマター解析
- ファイル名から自動的にslug抽出
- Obsidianとの連携を考慮したファイルベース管理

### 3-3. 動的OGP画像生成
- `next/og` の `ImageResponse` を使用
- ビルド時に各記事のOGP画像（1200x630）を生成
- 日本語フォント（Noto Sans JP）対応
- 記事タイトル、タグ、アイコンを含む

### 3-4. Pagefind全文検索
- 静的サイト向けクライアントサイド検索
- postbuildスクリプトで `.next/` からインデックス生成
- 日本語対応

### 3-5. unified/remark/rehypeパイプライン
- Markdown → HTML変換パイプライン
- カスタムrehypeプラグイン:
  - `rehype-code-copy-button`: コードブロックにコピーボタン
  - `rehype-link-card`: URLをカード形式で表示
  - `rehype-mermaid-code`: Mermaid図の生成
- `rehype-pretty-code`: シンタックスハイライト
- DOMPurifyでXSS対策のサニタイゼーション

### 3-6. SVG直接埋め込み（ちらつき防止）
- `public/icons/` のSVGをビルド時に `iconCache` に読み込み
- `dangerouslySetInnerHTML` で直接埋め込み
- Fetchを回避して初回アクセス時のちらつきを防止

### 3-7. ダークモード
- `next-themes` による自動切り替え
- システム設定に追従
- LocalStorageで設定保存

### 3-8. タグ分類・一覧
- `src/config/tag-slugs.ts` でタグIDと表示名を管理
- タグごとの記事一覧ページを静的生成
- 日本語タグ対応

### 3-9. ページネーション
- 1ページあたり12記事表示
- `/blog/page/[page]` 形式
- 動的ルート生成

### 3-10. RSS/llms.txt配信
- `/rss.xml`: RSS 2.0フィード
- `/llms.txt`: AI向けサイト情報
- ビルド時生成

### 3-11. Obsidian連携
- `contents/blog/` 配下をObsidianで直接編集
- フロントマター形式でメタデータ管理
- ファイル名ベースのslug生成

---

## 4. Astro移行後の機能再現性確認

| 機能 | 再現可能 | 実装方法 | 備考 |
|------|---------|---------|------|
| SSG | ✅ 完全可能 | Astroデフォルト | むしろAstroの方が得意 |
| Markdown読み込み | ✅ 完全可能 | `import.meta.glob` | 同じNode.js API使用可能 |
| 動的OGP生成 | ✅ 完全可能 | `@vercel/og` + API Routes | 既存コードほぼ流用可能 |
| Pagefind検索 | ✅ 完全可能 | Astro Integration | むしろ統合しやすい |
| unified/remark/rehype | ✅ 完全可能 | Astroネイティブサポート | カスタムプラグインも互換 |
| SVG直接埋め込み | ✅ 完全可能 | `import.meta.glob` + `?raw` | Next.jsより簡単 |
| ダークモード | ✅ 完全可能 | Reactコンポーネント or カスタムスクリプト | `client:load`で使用 |
| タグ分類 | ✅ 完全可能 | `getStaticPaths` | 同じロジック |
| ページネーション | ✅ 完全可能 | 動的ルート | 同じロジック |
| RSS/llms.txt | ✅ 完全可能 | API Routes | `@astrojs/rss`も利用可能 |
| Obsidian連携 | ✅ 完全可能 | ファイルベース維持 | 変更なし |

### 結論
- **実現不可能な機能: 0件**
- **実装コスト増加: OGP生成のみ若干増加（Next.jsの`ImageResponse`ほど統合されていない）**
- **それ以外はすべて同等またはより簡単に実装可能**

---

## 5. 移行戦略

### ブランチ管理
- **ベースブランチ**: `feature-migrate-astro-blog`
- このブランチから各Phase用のブランチを切って作業
- ブランチ命名規則:
  - Phase 1: `feature-migrate-astro-blog-phase1-init` (完了済み)
  - Phase 2: `feature-migrate-astro-blog-phase2` (段階的移植全体: 2-1～2-5をコミット単位で管理)
  - Phase 3: `feature-migrate-astro-blog-phase3` (クリーンアップ)
  - Phase 4: `feature-migrate-astro-blog-phase4` (最終確認)
- **コミット管理**: Phase 2内のサブフェーズ（2-1～2-5）はそれぞれ個別のコミットとして管理
- 各Phase完了後、`feature-migrate-astro-blog` にマージ
- 最終的に `feature-migrate-astro-blog` を `main` にマージ

### 段階的移行の方針
1. 同一リポジトリ内に `astro-app/` フォルダを作成
2. 既存Next.jsコードを参照しながら、Astroへ段階的に移植
3. 移植完了後、Next.js関連ファイルを削除
4. `astro-app/` の内容をルートに移動

### ディレクトリ構成（移行中）
```
sui-blog/
├── astro-app/          # 新規Astroプロジェクト
│   ├── src/
│   ├── public/              # Astro用静的ファイル
│   ├── astro.config.mjs
│   └── package.json
├── src/                      # 既存Next.js（参照用）
├── contents/                 # 両プロジェクトで共有
├── public/                   # 両プロジェクトで共有
└── package.json              # 既存Next.js
```

### 共有リソース
- `contents/blog/`: 両プロジェクトで共有（コピー不要）
- `public/icons/`: 両プロジェクトで共有（コピー不要）

---

## 6. 移行手順（Phase別）

### Phase 1: Astroプロジェクト初期化
**目的**: 最小構成のAstroプロジェクトを作成し、ビルドが通る状態にする

**作業内容**:
1. `astro-app/` フォルダ作成
2. Astro初期化（minimal template）
3. 必要なパッケージインストール
   - `@astrojs/tailwind`
   - `@astrojs/react`
   - TypeScript関連
4. 初期ビルド確認

**成果物**:
- ビルドが通るAstroプロジェクト
- 開発サーバーが起動する

---

### Phase 2: 段階的移植
**目的**: 既存Next.jsコードをAstroに段階的に移植

#### Phase 2-1: 共通ライブラリ・ユーティリティ
**優先順位1（依存なし）**:
- `src/lib/markdown.ts` → Markdown読み込み・パース処理
- `src/lib/utils.ts` → ユーティリティ関数
- `src/config/site.ts` → サイト設定
- `src/config/tag-slugs.ts` → タグマッピング
- `src/constants/` → 定数定義

**移植ポイント**:
- `fs.readFile` → `import.meta.glob` + `?raw`
- `process.cwd()` → Astroのパス解決
- `import.meta.env` で環境変数アクセス

#### Phase 2-2: UIコンポーネント
**優先順位2（ライブラリに依存）**:
- `src/components/ui/` → shadcn/ui系コンポーネント（Button, Card等）
- `src/components/shared/` → Header, Footer, Pagination
- `src/components/feature/` → BlogCard, MarkdownContent等

**移植ポイント**:
- Reactコンポーネントは `client:load` or `client:visible` で使用
- 静的なコンポーネントは `.astro` に変換
- `next/link` → Astro `<a>` or `client:load`なReactコンポーネント
- `next/image` → Astro `<Image />`

#### Phase 2-3: ページ
**優先順位3（コンポーネントに依存）**:
1. トップページ: `src/app/page.tsx` → `astro-app/src/pages/index.astro`
2. ブログ一覧: `src/app/blog/page.tsx` → `astro-app/src/pages/blog/index.astro`
3. ブログ一覧（ページネーション）: `src/app/blog/page/[page]/page.tsx` → `astro-app/src/pages/blog/[page].astro`
4. ブログ詳細: `src/app/blog/[slug]/page.tsx` → `astro-app/src/pages/blog/[slug].astro`
5. タグ一覧: `src/app/tags/page.tsx` → `astro-app/src/pages/tags/index.astro`
6. タグ詳細: `src/app/tags/[slug]/page.tsx` → `astro-app/src/pages/tags/[slug].astro`
7. Aboutページ: `src/app/about/page.tsx` → `astro-app/src/pages/about.astro`

**移植ポイント**:
- `generateStaticParams()` → `getStaticPaths()`
- `generateMetadata()` → frontmatter or `<head>`内で定義
- `export const metadata` → frontmatter or Astro.props

#### Phase 2-4: API Routes
**優先順位4（ページと並行可能）**:
1. OGP画像生成: `src/app/blog/ogp/[slug]/route.tsx` → `astro-app/src/pages/blog/ogp/[slug].png.ts`
2. RSS: `src/app/rss.xml/route.ts` → `astro-app/src/pages/rss.xml.ts`
3. llms.txt: `src/app/llms.txt/route.ts` → `astro-app/src/pages/llms.txt.ts`
4. Markdown表示: `src/app/blog/md/[slug]/route.ts` → `astro-app/src/pages/blog/[slug].md.ts`

**移植ポイント**:
- `export async function GET()` は同じ形式
- `NextResponse` → Astro `Response`
- `ImageResponse` → `@vercel/og` の `ImageResponse`

#### Phase 2-5: スタイル・設定
**優先順位5（最後）**:
- `tailwind.config.ts` → `astro-app/tailwind.config.ts`
- `src/styles/globals.css` → `astro-app/src/styles/globals.css`
- `biome.json` → 共有または `astro-app/biome.json`

---

### Phase 3: Next.js関連ファイル削除
**目的**: 移植完了後、既存Next.js関連ファイルを削除し、Astroプロジェクトをルートに移動

**作業内容**:
1. Astroプロジェクトの動作確認完了
2. Next.js関連ファイル削除
   - `src/app/`
   - `next.config.ts`
   - `next-env.d.ts`
   - 既存 `package.json`, `bun.lockb`
3. `astro-app/` の内容をルートに移動
4. `contents/` と `public/` はそのまま維持

**確認項目**:
- [ ] Astroプロジェクトで全ページが表示される
- [ ] OGP画像が生成される
- [ ] Pagefind検索が動作する
- [ ] RSS/llms.txtが配信される

---

### Phase 4: 動作確認
**目的**: 本番環境デプロイ前の最終確認

**確認項目**:
- [ ] トップページ表示
- [ ] ブログ一覧表示（ページネーション含む）
- [ ] ブログ詳細表示
- [ ] タグ一覧・詳細表示
- [ ] Aboutページ表示
- [ ] OGP画像生成・表示
- [ ] Pagefind検索動作
- [ ] RSS配信（/rss.xml）
- [ ] llms.txt配信（/llms.txt）
- [ ] ダークモード切り替え
- [ ] SVGアイコン表示（ちらつきなし）
- [ ] レスポンシブデザイン
- [ ] ビルド成功

---

## 7. 各Phaseの詳細作業内容

### Phase 1: Astroプロジェクト初期化

#### 実行コマンド
```bash
# astro-app/ フォルダ作成
mkdir astro-app
cd astro-app

# Astro初期化
bun create astro@latest . --template minimal --no-install

# パッケージインストール
bun add @astrojs/tailwind @astrojs/react tailwindcss
bun add -d typescript @types/node @types/react @types/react-dom

# 初期ビルド確認
bun run dev
```

#### 確認項目
- [ ] `bun run dev` で開発サーバーが起動
- [ ] http://localhost:4321 にアクセス可能
- [ ] エラーなしでビルド完了

---

### Phase 2-1: ライブラリ移植

#### 移植対象ファイル
```
src/lib/markdown.ts          → astro-app/src/lib/markdown.ts
src/lib/utils.ts             → astro-app/src/lib/utils.ts
src/lib/pagination.ts        → astro-app/src/lib/pagination.ts
src/lib/toc.ts              → astro-app/src/lib/toc.ts
src/lib/inline-icons.ts     → astro-app/src/lib/inline-icons.ts
src/lib/recommend.ts        → astro-app/src/lib/recommend.ts
src/config/site.ts          → astro-app/src/config/site.ts
src/config/tag-slugs.ts     → astro-app/src/config/tag-slugs.ts
src/constants/index.ts      → astro-app/src/constants/index.ts
```

#### 重要な変更点
- `fs.readFileSync` は使用可能（Node.js環境）
- `import.meta.glob` でMarkdownファイル一括読み込み
- `process.env.NEXT_PUBLIC_*` → `import.meta.env.PUBLIC_*`

---

### Phase 2-2: UIコンポーネント移植

#### 移植対象ファイル
```
# UI Components (shadcn/ui系)
src/components/ui/button.tsx → astro-app/src/components/ui/Button.tsx
src/components/ui/card.tsx → astro-app/src/components/ui/Card.tsx
src/components/ui/badge.tsx → astro-app/src/components/ui/Badge.tsx
（他のui/配下も同様）

# Shared Components
src/components/shared/Header.tsx → astro-app/src/components/shared/Header.tsx
src/components/shared/Footer.tsx → astro-app/src/components/shared/Footer.tsx
src/components/shared/Pagination.tsx → astro-app/src/components/shared/Pagination.tsx

# Feature Components
src/components/feature/content/blog-card.tsx → astro-app/src/components/feature/content/BlogCard.tsx
src/components/feature/content/custom-markdown.tsx → astro-app/src/components/feature/content/CustomMarkdown.tsx
（他のfeature/配下も同様）
```

#### Client Directiveの使い分け
- `client:load`: ページ読み込み時に即座にハイドレート（Header, Footer等）
- `client:visible`: ビューポートに入った時にハイドレート（BlogCard等）
- `client:idle`: メインスレッドがアイドル時にハイドレート（検索ダイアログ等）
- Astroコンポーネント: 静的なコンポーネント（カード、レイアウト等）

---

### Phase 2-3: ページ移植

#### Next.js → Astro API対応表
| Next.js | Astro |
|---------|-------|
| `generateStaticParams()` | `export async function getStaticPaths()` |
| `generateMetadata()` | frontmatter or `<head>` |
| `export const metadata` | frontmatter |
| `notFound()` | `return Astro.redirect('/404')` |
| `params: Promise<{}>` | `Astro.params` (同期) |
| `export const revalidate = false` | デフォルトで静的 |

#### ページ移植例
**ブログ詳細ページ**:
- `src/app/blog/[slug]/page.tsx` → `astro-app/src/pages/blog/[slug].astro`
- `generateStaticParams` → `getStaticPaths`
- メタデータは `<head>` 内で定義

---

### Phase 2-4: API Routes移植

#### OGP画像生成
**移植内容**:
- `src/app/blog/ogp/[slug]/route.tsx` → `astro-app/src/pages/blog/ogp/[slug].png.ts`
- `next/og` の `ImageResponse` → `@vercel/og` の `ImageResponse`
- `getStaticPaths` で全記事のOGP画像を静的生成

**パッケージ追加**:
```bash
bun add @vercel/og satori
```

---

### Phase 2-5: スタイル・設定移植

#### Tailwind設定
- `tailwind.config.ts` をコピー
- `content` パスを Astro用に修正:
  ```typescript
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}']
  ```

#### グローバルCSS
- `src/styles/globals.css` をコピー
- Astroレイアウトでインポート

---

## 8. 技術的な移行ポイント

### Next.js → Astro API対応詳細

#### ルーティング
```typescript
// Next.js
export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map(post => ({ slug: post.slug }));
}

// Astro
export async function getStaticPaths() {
  const posts = await getAllBlogPosts();
  return posts.map(post => ({ params: { slug: post.slug } }));
}
```

#### メタデータ
```typescript
// Next.js
export const metadata: Metadata = {
  title: 'Blog',
  description: 'My blog',
};

// Astro (frontmatter)
---
const title = 'Blog';
const description = 'My blog';
---
<head>
  <title>{title}</title>
  <meta name="description" content={description} />
</head>
```

#### 画像
```jsx
// Next.js
import Image from 'next/image';
<Image src="/icon.png" width={32} height={32} alt="icon" />

// Astro
import { Image } from 'astro:assets';
<Image src="/icon.png" width={32} height={32} alt="icon" />
```

#### Client Components
```tsx
// Next.js
'use client';
export function SearchDialog() { ... }

// Astro
<SearchDialog client:load />
```

### ファイル命名規則
| Next.js | Astro |
|---------|-------|
| `page.tsx` | `index.astro` or `[slug].astro` |
| `layout.tsx` | レイアウトコンポーネント |
| `route.ts` (API) | `[slug].json.ts` or `[slug].png.ts` |
| `not-found.tsx` | `404.astro` |
| `error.tsx` | （Astroにはなし） |

### Import文の変更
```typescript
// Next.js
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

// Astro
// Metadataは不要（frontmatterで定義）
// Linkは <a> タグ
import { Image } from 'astro:assets';
```

---

## 9. 移行時の注意点・リスク

### 共有ファイルの扱い
- `contents/blog/`: 両プロジェクトで共有（コピー不要）
- `public/icons/`: 両プロジェクトで共有（コピー不要）
- 変更は両方に影響するため、移行中は注意

### Biome設定の互換性
- `biome.json` は基本的に互換性あり
- Astroの `.astro` ファイルは現在Biomeでサポートされていない
- `.astro` ファイルは Prettier + ESLint を併用するか、将来のBiome対応を待つ

### 環境変数の命名規則
```bash
# Next.js
NEXT_PUBLIC_APP_URL=https://example.com

# Astro
PUBLIC_APP_URL=https://example.com
```

### ビルドコマンドの変更
```json
// Next.js
{
  "scripts": {
    "build": "next build && pagefind --site .next"
  }
}

// Astro
{
  "scripts": {
    "build": "astro build && pagefind --site ./dist"
  }
}
```

### Pagefindの出力先変更
- Next.js: `.next/` → `public/pagefind/`
- Astro: `dist/` → `public/pagefind/`

---

## 10. 動作確認項目

### 機能別テストチェックリスト

#### ページ表示
- [ ] トップページ（/）
- [ ] ブログ一覧（/blog）
- [ ] ブログ一覧ページネーション（/blog/page/2）
- [ ] ブログ詳細（/blog/[slug]）
- [ ] タグ一覧（/tags）
- [ ] タグ詳細（/tags/[slug]）
- [ ] Aboutページ（/about）
- [ ] 404ページ

#### OGP・メタデータ
- [ ] OGP画像表示（/blog/ogp/[slug]）
- [ ] Twitter Card表示
- [ ] canonical URL設定
- [ ] meta description設定

#### 検索・配信
- [ ] Pagefind検索動作
- [ ] RSS配信（/rss.xml）
- [ ] llms.txt配信（/llms.txt）

#### UI・UX
- [ ] ダークモード切り替え
- [ ] SVGアイコン表示（ちらつきなし）
- [ ] レスポンシブデザイン
- [ ] コードブロックのコピーボタン
- [ ] リンクカード表示
- [ ] Mermaid図表示
- [ ] 目次表示

#### パフォーマンス
- [ ] Lighthouse スコア確認
- [ ] First Contentful Paint (FCP)
- [ ] Largest Contentful Paint (LCP)
- [ ] Cumulative Layout Shift (CLS)

#### SEO
- [ ] Sitemap生成確認
- [ ] robots.txt確認
- [ ] 構造化データ（JSON-LD）確認

---

## 11. 参考資料

### 公式ドキュメント
- Astro公式: https://docs.astro.build/
- Astro移行ガイド: https://docs.astro.build/en/guides/migrate-to-astro/
- @vercel/og: https://vercel.com/docs/functions/edge-functions/og-image-generation
- Pagefind: https://pagefind.app/

### 脆弱性情報
- React Server Components脆弱性: https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components
- CVE-2025-55182: CVSS 10.0

### 使用ライブラリ
- unified: https://unifiedjs.com/
- remark: https://github.com/remarkjs/remark
- rehype: https://github.com/rehypejs/rehype
- Tailwind CSS: https://tailwindcss.com/
- Radix UI: https://www.radix-ui.com/

---

## 進捗チェックリスト

### Phase 1: Astroプロジェクト初期化
- [x] `astro-app/`フォルダ作成
- [x] Astro初期化（minimal template）
- [x] 必要なパッケージインストール
- [x] 初期ビルド確認
- [x] ブランチ: `feature-migrate-astro-blog-phase1-init`

### Phase 2: 段階的移植（ブランチ: `feature-migrate-astro-blog-phase2`）

#### Phase 2-1: 共通ライブラリ・ユーティリティ
- [x] `src/constants/index.ts` 移植（環境変数修正）
- [x] `src/config/site.ts`, `src/config/tag-slugs.ts` 移植
- [x] `src/lib/` 全11ファイル移植（パス修正）
- [x] `src/types/` 全5ファイル移植
- [x] Markdown処理用パッケージインストール
- [x] `astro.config.mjs`設定（remark/rehypeプラグイン）
- [x] コミット完了

#### Phase 2-2: UIコンポーネント（完了 - 2025-12-13）
- [x] ui/コンポーネント移植（13ファイル）
- [x] icons/コンポーネント移植（3ファイル）
- [x] shared/コンポーネント移植（7ファイル）
- [x] feature/contentコンポーネント移植（14ファイル）
- [x] feature/searchコンポーネント移植（2ファイル）
- [x] コミット完了

#### Phase 2-3: ページ（完了 - 2025-12-13）
- [x] トップページ
- [x] ブログ一覧
- [x] ブログ一覧（ページネーション）
- [x] ブログ詳細
- [x] タグ一覧
- [x] タグ詳細
- [x] Aboutページ
- [x] コミット完了

#### Phase 2-4: API Routes（完了 - 2025-12-13）
- [x] OGP画像生成
- [x] RSS配信
- [x] llms.txt配信
- [x] Markdown表示
- [x] React統合設定（@astrojs/react、tsconfig.json）

#### Phase 2-5: スタイル・設定・最終調整
- [x] **Tailwind CSS v4のカスタムトークン設定完了**
  - `@theme`ディレクティブで全カラートークン定義（--color-border, --color-background等）
  - `:root`と`.dark`のCSS変数定義を削除（v4では不要）
  - hsl形式で統一
- [ ] ダークモード修正
  - ヘッダー部にあるトグル設定がうまくできておらず、ダークモードなのに背景が白い
  - theme-provider が Next.js 依存なので動かない
- [x] `markdown.css.phase2-5`の内容を正しく移植
  - rehype-pretty-code、Mermaid、リンクカード等のスタイル完全移植
  - @apply構文そのまま使用可能
- [ ] カスタムrehypeプラグインの有効化（一部）
  - rehypeMermaidCodeToDiv: 有効化完了
  - rehypeCodeCopyButton: 有効化完了
  - **rehypeLinkCard: 未完了**（コピー済み、有効化は後回し - OGデータ取得が重いため）
  - 依存パッケージ（dompurify, jsdom, unist-util-visit）インストール完了
  - `astro-app/src/actions/fetch-og-metadata.ts`作成（Reactの`cache`削除版）
- **残存タスク（ユーザー側で実施）**:
  - rehypeLinkCardの有効化（`astro.config.mjs`のコメント解除）
  - 開発用制限の解除（`src/lib/markdown.ts`のTODOコメント箇所）
  - 全ページの動作確認
  - コミット作成


### Phase 3: Astro最適化 - Islands Architectureへの移行（完了 - 2025-12-14）
**目的**: Astroの本質的な利点を最大化し、ゼロJS原則とIslands Architectureを実現

**Astroの思想**:
- **デフォルトでゼロJS**: 全てのコンポーネントはビルド時にHTMLとして静的生成
- **Islands Architecture**: インタラクティブな部分だけを「島」として分離し、必要最小限のJSのみクライアントに送信
- **Progressive Enhancement**: 基本機能はJSなしで動作し、JSは追加の体験向上のみに使用

**Phase 2で移植したReactコンポーネント(.tsx)の分類**:

#### 1. 完全静的化すべきコンポーネント (.tsx → .astro)
**特徴**: インタラクティビティ不要、純粋な表示のみ

**ui/コンポーネント**: **移行禁止（shadcn ui）**
- ~~`Badge.tsx` → `Badge.astro`~~ - shadcn uiのためReactコンポーネントのまま維持
- ~~`Card.tsx` → `Card.astro`~~ - shadcn uiのためReactコンポーネントのまま維持
- ~~`Separator.tsx` → `Separator.astro`~~ - shadcn uiのためReactコンポーネントのまま維持
- ~~`Skeleton.tsx` → `Skeleton.astro`~~ - shadcn uiのためReactコンポーネントのまま維持
- ~~`Breadcrumb.tsx` → `Breadcrumb.astro`~~ - shadcn uiのためReactコンポーネントのまま維持

**shared/コンポーネント（4/4完了）**:
- [x] `Footer.tsx` → `Footer.astro` - 完了（BaseLayout.astroで`client:`なしで使用）
- [x] `Pagination.tsx` → `Pagination.astro` - 完了（Astroの`key`属性削除対応済み）
- [x] `page-header.tsx` → `page-header.astro` - 完了（完全静的化）
- [x] `callout.tsx` → `callout.astro` - 完了（アイコン部分のみ`client:load`）

**feature/content/コンポーネント（4/6完了）**:
- [x] `blog-card.tsx` → `blog-card.astro` - 完了（Badge、Iconのみ`client:load`）
- ❌ `markdown-content.tsx` - **Islandとして維持**（useEffect、DOM操作、mermaid必須）
- [x] `table-of-contents.tsx` → `table-of-contents.astro` - 完了（完全静的化）
- [x] `related-articles.tsx` → `related-articles.astro` - 完了（完全静的化）
- [x] `github-edit-button.tsx` → `github-edit-button.astro` - 完了（Button、SocialIconのみ`client:load`）
- ❌ `self-assessment.tsx` - **Islandとして維持**（useState必須）

#### 2. Islands として残すReactコンポーネント (.tsx維持 + client:*)
**特徴**: ユーザーインタラクション・状態管理・動的な振る舞いが必要

**ui/コンポーネント** (client:load):
<!-- TODO: ダークモード対応ができていないので一部対応しない -->
~~- `theme-provider.tsx` - ダークモード管理（LocalStorage、state）~~ 
~~- `ModeToggle.tsx` - テーマ切り替えボタン（onClick、state）~~
- `Dialog.tsx` - モーダルダイアログ（open/close state）
- `DropdownMenu.tsx` - ドロップダウンメニュー（open/close state）
- `Command.tsx` - コマンドパレット（検索state、キーボード操作）
- `Button.tsx` - インタラクティブなボタン（onClick等）※必要な箇所のみ

**shared/コンポーネント** (client:load):
- `Header.tsx` - ヘッダー（検索ダイアログ開閉、モバイルメニュー、state）
- `MenuMobile.tsx` - モバイルメニュー（開閉state）
- `image-with-fallback.tsx` - 画像フォールバック（onError state）

**feature/search/コンポーネント** (client:idle):
- `search-dialog.tsx` - 検索ダイアログ（Pagefind UI、state、キーボード操作）
- `search-trigger.tsx` - 検索トリガーボタン（onClick）

**feature/content/コンポーネント** (client:visible or client:idle):
- `blog-back-button.tsx` - 戻るボタン（onClick、sessionStorage操作）
- `remember-blog-list-path.tsx` - スクロール位置記憶（sessionStorage、useEffect）
- `restore-scroll-position.tsx` - スクロール位置復元（sessionStorage、useLayoutEffect）
- `view-transition.tsx` - View Transitions API（React state）
- `markdown-copy-button.tsx` - コードコピーボタン（onClick、クリップボードAPI）
- `code-block.tsx` - コードブロック（コピーボタン含む、インタラクティブ）
- `link-preview.tsx` - リンクプレビュー（画像フォールバック state）

**custom-markdown.tsx** (特殊):
- Markdown表示コンポーネント
- `dangerouslySetInnerHTML`使用のため、`.astro`の`set:html`に変換可能
- ただし、内部にReactコンポーネント（コピーボタン等）を含む場合はReact維持

#### 3. Client Directiveの最適化

**Phase 2での指定**:
```astro
<!-- 全てclient:load（ページ読み込み時に即座にJS実行） -->
<Header client:load />
<BlogCard client:load />
<SearchDialog client:load />
```

**Phase 5での最適化**:
```astro
<!-- 重要なUI: client:load -->
<Header client:load />
<ModeToggle client:load />

<!-- 画面に入った時だけ: client:visible -->
<BlogCard client:visible />
<RelatedArticles client:visible />

<!-- アイドル時に遅延ロード: client:idle -->
<SearchDialog client:idle />
<MarkdownCopyButton client:idle />

<!-- 完全静的化: Islandなし -->
<Footer />
<Pagination />
<TableOfContents />
```

**Client Directive選択基準**:
- `client:load` - 初期表示に必要（Header、ダークモード等）
- `client:visible` - スクロールして見える時だけ必要（BlogCard等）
- `client:idle` - 補助的機能（検索、コピーボタン等）
- **なし** - 静的HTML（Footer、Pagination等）

#### 4. 具体的な作業手順

**Step 1: 静的コンポーネントの.astro変換**
1. `src/components/ui/Badge.tsx` を読み込み
2. Reactの構文をAstro構文に変換:
   - `export function Badge({ ... })` → `---` ブロック + `<badge>`
   - Props型定義 → Astro型定義
   - JSX → Astro template syntax
   - `className` → `class`
3. `src/components/ui/Badge.astro` として保存
4. 使用箇所で `<Badge />` → `<Badge />`（client:なし）
5. ビルド・動作確認

**Step 2: Islandsの最適化**
1. 各Reactコンポーネント使用箇所を確認
2. `client:load` → `client:visible` or `client:idle` に変更
3. バンドルサイズ測定（`bun run build`）
4. Lighthouse計測

**Step 3: カスタムMarkdownコンポーネント検討**
1. `custom-markdown.tsx`の内容確認
2. `dangerouslySetInnerHTML` → Astroの`set:html`検討
3. 内部コンポーネントがReactの場合は維持

**確認項目**:
- [x] ui/ コンポーネントはshadcn uiのため移行禁止を確認
- [x] 静的コンポーネント変換完了（shared/ 4/4ファイル完了: Footer, Pagination, page-header, callout）
- [x] 静的コンポーネント変換完了（feature/content/ 4/6ファイル: blog-card, table-of-contents, related-articles, github-edit-button）
- [x] 型定義分離（src/types/toc.ts作成）
- [x] インポートパス修正完了（6ページファイル）
- [x] 古い.tsxファイル削除完了（6ファイル）
- [x] `.astro`コンポーネントから不要な`client:`ディレクティブ削除
- [ ] ビルド成功確認
- [ ] 全機能の動作確認
- [ ] バンドルサイズ削減確認（ビルドログ確認）
- [ ] Lighthouse スコア改善確認（90+目標）
- [ ] `feature-migrate-astro-blog`にマージ

**期待される効果**:
- **JSバンドルサイズ**: 50%以上削減（静的化により）
- **初期ロード時間**: 30%以上改善
- **Lighthouse Performance**: 90+達成
- **TTI (Time to Interactive)**: 大幅改善

### Phase 4: クリーンアップ（ブランチ: `feature-migrate-astro-blog-phase3`）
- [ ] Astroプロジェクト動作確認
- [ ] Next.js関連ファイル削除
- [ ] `astro-app/`をルートに移動
- [ ] `feature-migrate-astro-blog`にマージ

### Phase 5: 最終確認（ブランチ: `feature-migrate-astro-blog-phase4`）
- [ ] 全ページ表示確認
- [ ] OGP画像・メタデータ確認
- [ ] 検索・配信確認
- [ ] UI/UX確認
- [ ] パフォーマンス確認
- [ ] SEO確認
- [ ] `feature-migrate-astro-blog`にマージ
- [ ] `main`へマージ

---

## まとめ

この移行手順書に従うことで、Next.js 16からAstroへの安全かつ段階的な移行が可能です。

**重要なポイント**:
1. 実現不可能な機能は0件
2. 既存コードの大部分を再利用可能
3. `contents/blog/` はそのまま維持（Obsidian連携継続）
4. SVG直接埋め込みなど、一部機能はAstroの方が簡単
5. セキュリティリスク（CVE-2025-55182）を回避

**次のステップ**:
1. Phase 1でAstroプロジェクト初期化
2. Phase 2で段階的に移植（Claude Code活用）
3. Phase 3でNext.js削除
4. Phase 4で動作確認

移行完了後は、より安定したSSGベースのブログシステムとして運用できます。
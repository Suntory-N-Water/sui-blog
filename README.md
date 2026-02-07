# sui Tech Blog

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

個人技術ブログプラットフォーム。Astro 5.xで構築され、Markdown形式で記事を管理し、静的生成により高速な配信を実現しています。

🔗 **Live Site**: [https://suntory-n-water.com](https://suntory-n-water.com)

## 📋 目次

- [主要機能](#-主要機能)
- [技術スタック](#-技術スタック)
- [アーキテクチャ](#-アーキテクチャ)
- [セットアップ](#-セットアップ)
- [開発](#-開発)
- [ビルド・デプロイ](#-ビルドデプロイ)
- [ファイル構成](#-ファイル構成)
- [記事管理](#-記事管理)
- [コード品質](#-コード品質)
- [ライセンス](#-ライセンス)

## ✨ 主要機能

- **Markdown記事管理**: `contents/blog/` 配下にMarkdownファイルで記事を管理
- **全文検索**: Pagefindによるクライアントサイド検索
- **OGP画像生成**: 記事ごとに自動生成された静的OGP画像
- **タグ管理**: カテゴリ別に記事を分類・表示
- **RSS配信**: 最新記事のRSSフィード
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応
- **ダークモード**: ユーザー設定に基づくダークモード対応

## 🛠️ 技術スタック

### フロントエンド
- **フレームワーク**: [Astro](https://astro.build/) 5.x (SSG)
- **ランタイム**: [Bun](https://bun.sh/)
- **UIライブラリ**: React (一部インタラクティブコンポーネント)
- **スタイリング**: Tailwind CSS 4.x + Radix UI
- **Markdown処理**: remark, rehype

### インフラ・ツール
- **ホスティング**: Cloudflare Pages
- **検索**: Pagefind
- **OGP画像生成**: Satori
- **コード品質**: Biome, Prettier, TypeScript
- **テキスト校正**: textlint

## 🏗️ アーキテクチャ

### 静的生成 (SSG)
本ブログはAstroの静的サイト生成（SSG）機能を使用しています：

```
ビルドプロセス:
┌─────────────────┐
│ Markdown files  │
│ (contents/blog/)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Astro Build    │
│  - ページ生成   │
│  - OGP画像生成  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Static Output   │
│    (dist/)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Pagefind       │
│ (検索インデックス)│
└─────────────────┘
```

- **ビルド時**: すべての記事ページを静的生成
- **OGP画像**: Satoriで静的生成し、キャッシュ最適化
- **検索インデックス**: postbuildスクリプトでPagefindインデックス生成

### Islands Architecture
Astroの[Islands Architecture](https://docs.astro.build/en/concepts/islands/)を採用し、インタラクティブな部分のみReactコンポーネントとして実装することで、パフォーマンスを最適化しています。

## 🚀 セットアップ

### 前提条件
- [Bun](https://bun.sh/) 最新版
- Node.js 18.x以上（推奨）

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/Suntory-N-Water/sui-blog.git
cd sui-blog

# 依存関係をインストール
bun install
```

## 💻 開発

### 開発サーバー起動

```bash
# ローカル開発サーバー起動（http://localhost:4321）
bun run dev
```

### 新規記事作成

```bash
# テンプレートから新規記事を作成
bun run new-blog
```

### コード品質チェック

```bash
# フォーマット
bun run format

# リント
bun run lint

# 型チェック
bun run type-check

# 全チェック実行
bun run check
```

### テキスト校正

```bash
# 記事の文章校正
bun run textlint

# 自動修正
bun run textlint:fix
```

## 📦 ビルド・デプロイ

### ローカルビルド

```bash
# ビルド実行
bun run build

# ビルド結果をプレビュー
bun run preview
```

### Cloudflare Pagesへのデプロイ

```bash
# Cloudflare Pagesへデプロイ
bun run deploy

# ローカルでCloudflare環境をシミュレート
bun run dev:cf
```

## 📁 ファイル構成

```
sui-blog/
├── contents/              # コンテンツファイル
│   ├── blog/             # ブログ記事（Markdown）
│   ├── shorts/           # 短編記事
│   └── templates/        # 記事テンプレート
├── public/               # 静的アセット
├── scripts/              # ビルド・ユーティリティスクリプト
├── src/
│   ├── components/       # Reactコンポーネント
│   ├── config/           # 設定ファイル (site.ts, tag-slugs.ts等)
│   ├── constants/        # 定数定義
│   ├── layouts/          # Astroレイアウト
│   ├── lib/              # ユーティリティ関数
│   ├── pages/            # Astroページ
│   ├── styles/           # グローバルスタイル
│   └── types/            # 型定義
├── astro.config.ts       # Astro設定
├── tailwind.config.js    # Tailwind CSS設定
├── biome.jsonc           # Biome設定
└── wrangler.jsonc        # Cloudflare Pages設定
```

## 📝 記事管理

### 記事ファイルの配置
- **ブログ記事**: `contents/blog/*.md`
- **短編記事**: `contents/shorts/*.md`

### フロントマター形式

```markdown
---
title: "記事のタイトル"
description: "記事の説明"
pubDate: 2025-01-01
tags: ["tag1", "tag2"]
---

記事本文...
```

### タグ管理
タグは `src/config/tag-slugs.ts` の `TAG_SLUG_MAP` で定義します。

新しいタグを追加する場合は、以下のコマンドでタグの整合性をチェック：

```bash
bun run check:tags
```

## 🎨 コード品質

### 利用ツール
- **Biome**: リント・フォーマット（JavaScript/TypeScript）
- **Prettier**: フォーマット（Astroファイル）
- **TypeScript**: 型チェック
- **textlint**: 日本語文章校正
- **Husky**: Git hooks（コミット前チェック）

### 主要コマンド

```bash
# フォーマットチェック
bun run format:check

# リント実行
bun run lint

# 型チェック
bun run type-check

# すべてのチェックを実行
bun run check

# 自動修正
bun run check:fix
```

## 📄 ライセンス

[MIT License](LICENSE) - Copyright (c) 2025 sui

## 👤 作者

**Suntory-N-Water**
- Website: [https://suntory-n-water.com](https://suntory-n-water.com)
- Twitter: [@Suntory_N_Water](https://x.com/Suntory_N_Water)
- GitHub: [@Suntory-N-Water](https://github.com/Suntory-N-Water)

---

Built with [Astro](https://astro.build/) 🚀

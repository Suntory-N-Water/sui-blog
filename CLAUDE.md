# sui Tech Blog - Claude Code AI リファレンス

本システムは **Astro** で構築された個人技術ブログプラットフォームです。Markdown形式で記事を管理し、静的生成により高速な配信を実現しています。

## 目的
個人技術ブログプラットフォーム。Markdown形式で記事を管理し、静的生成により高速な配信を実現する。

## 主要機能
- **Markdown記事管理**: `contents/blog/` 配下にMarkdownファイルで記事を管理
- **全文検索**: Pagefindによるクライアントサイド検索
- **OGP画像生成**: 記事ごとに自動生成された静的OGP画像

## 技術スタック
- **フレームワーク**: Astro 5.x (SSG)
- **ランタイム**: Bun
- **UIライブラリ**: React (一部コンポーネント)
- **スタイリング**: Tailwind CSS 4.x + Radix UI
- **Markdown処理**: remark, rehype

## アーキテクチャ
- **静的生成 (SSG)**: ビルド時にすべての記事ページを静的生成
- **OGP画像**: ビルド時にSatoriで静的生成し、キャッシュ最適化
- **検索インデックス**: postbuildスクリプトでPagefindインデックス生成

### 静的生成 (SSG)
- ビルド時にすべての記事ページを静的生成
- OGP画像も静的生成し、キャッシュ最適化
- Pagefindインデックスはpostbuildスクリプトで生成

## ファイル構成
```
src/
├── components/   # Reactコンポーネント
├── config/       # 設定ファイル (site.ts, tag-slugs.ts等)
├── constants/    # 定数定義
├── layouts/      # Astroレイアウト
├── lib/          # ユーティリティ関数
├── pages/        # Astroページ
├── styles/       # グローバルスタイル
└── types/        # 型定義
```

## 記事管理

- 記事ファイル: `contents/blog/*.md`
- フロントマター形式
- タグ定義: `src/config/tag-slugs.ts` の `TAG_SLUG_MAP`

## 図解の指示
- ユーザーに何かを説明する際は、簡単な図解を用いてわかりやすく説明すること
- ASCII アートやテキストベースの図を活用して視覚的に理解を助けること
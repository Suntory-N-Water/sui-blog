# ブログ図解ページ機能 - 概要

## 最終目標

ブログ記事のフロントマターにYAMLを定義するだけで、ビルド時に自動的に図解ページを生成する。

### 理想的な使用例

```yaml
---
title: いい質問なんて最初からできるわけない
slug: good-questions
date: 2024-12-28
diagram:
  - type: hero
    title: 「いい質問」なんて最初からできるわけない
    subtitle: そんな恐怖心から、質問できずにいるあなたへ。
  - type: problem
    title: こんな「モヤモヤ」ありませんか？
    cards:
      - title: 質問するのが怖い
        description: 的外れな質問をして、「できないやつ」だと思われるのが怖い。
---
```

このフロントマターを記述するだけで、以下が自動生成される:
- `/blog/good-questions/diagram/` に図解ページが生成される
- レイアウトは`type`に応じて自動選択
- ブログのテーマ(ライト/ダークモード)に自動対応
- 静的HTML(JavaScriptなし)で高速配信

### 想定される利用シーン

1. **ブログ記事の補足資料として**
   - 記事本文: `/blog/good-questions/` (テキスト中心)
   - 図解版: `/blog/good-questions/diagram/` (ビジュアル中心)

2. **SNS共有用のビジュアルコンテンツとして**
   - OGP画像も自動生成
   - モバイルファーストのレスポンシブデザイン

3. **スライド形式のコンテンツとして**
   - セクションごとにスクロール
   - プレゼン資料のような構成

## 現状(2026-01-02時点)

### 実装済み

1. **コンポーネント群の作成**
   - `src/components/feature/diagram/` 配下に7種類のセクションコンポーネント
   - `dynamic-page-builder.tsx`: セクションを動的に組み立てるビルダー
   - `content-common.tsx`: 共通ユーティリティ(Icon、FormattedText)

2. **型定義**
   - `src/types/diagram.ts`: すべてのセクション型とデータ構造

3. **サンプル検証ページ**
   - `src/pages/blog/diagram/index.astro`: 検証用のデモページ
   - ハードコードされたデータで動作確認中

4. **UI/UX改善(2026-01-02完了)**
   - ブログの既存テーマ(`globals.css`)との統合
   - ダークモード自動対応(CSS変数使用)
   - 不要なJavaScript削除(React Context → CSS変数)
   - 静的HTML生成(`client:load`不要)

### セクションタイプ(7種類)

| タイプ | 用途 | 例 |
|---|---|---|
| `hero` | タイトル・日付・サブタイトル | 記事の冒頭 |
| `problem` | 課題提示(カード形式) | 「こんな悩みありませんか？」 |
| `core_message` | 核心メッセージ | 「60点の質問でいい」 |
| `steps` | ステップ形式の説明 | 「3ステップで解決」 |
| `message` | メッセージ(吹き出し形式) | 「先輩たちは待っています」 |
| `action` | 行動を促す | 「明日から始めよう」 |
| `transition` | セクション間の区切り | 矢印アイコン |

### 未実装(今後の課題)

1. **フロントマターからの自動生成**
   - 現状: `index.astro`にハードコードされたデータ
   - 目標: Markdownのフロントマターから自動生成

2. **ビルド時の動的ページ生成**
   - Content Collections APIとの統合
   - `getStaticPaths()`での動的ルーティング

3. **OGP画像の自動生成**
   - Satoriでセクション情報から画像生成

4. **レイアウトテンプレート**
   - セクションの組み合わせパターンをテンプレート化
   - 「問題提起型」「ステップ解説型」などのプリセット

## アーキテクチャ

### 現在の構成

```
contents/blog/
  └── 2025-12-30_claude-code-dynamic-skill-loading.md
      (フロントマターに diagram フィールドなし)

src/pages/blog/diagram/
  └── index.astro
      (ハードコードされたデモデータ)
```

### 目指す構成

```
contents/blog/
  └── 2025-12-30_claude-code-dynamic-skill-loading.md
      (フロントマターに diagram フィールドあり)
          ↓ ビルド時に自動生成
src/pages/blog/[slug]/diagram.astro
      (動的ルーティング)
```

## 技術スタック

- **Astro 5.x**: SSG、Content Collections API
- **React**: コンポーネント(静的HTMLに変換)
- **Tailwind CSS v4**: スタイリング、ダークモード
- **TypeScript**: 型安全性

## 参考

- サンプルページ: `src/pages/blog/diagram/index.astro`
- 設計判断: `docs/designs/diagram-dark-mode-refactoring.md`
- 既存ブログ記事: `contents/blog/2025-12-30_claude-code-dynamic-skill-loading.md`

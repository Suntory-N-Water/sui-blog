# 図解ブログページ機能 - フロントマター対応実装計画

## 目標

ブログ記事のフロントマターに `diagram` フィールドを定義するだけで、ビルド時に `/blog/diagram/[slug]/` に図解ページを自動生成する。

## ユーザー要件

- **diagram フィールド**: オプショナル(既存記事への影響なし)
- **セクション ID**: 自動生成(ユーザーの記述負担を軽減)
- **ルーティング**: `/blog/diagram/[slug]/`

## 実装の段階

### Phase 1: Zodスキーマ定義 (`src/content.config.ts`)

**目的**: フロントマターの検証ルールを定義

**実装内容**:
1. 9種類のセクション型のZodスキーマを定義
   - `HeroSectionSchema`, `ProblemSectionSchema`, `CoreMessageSectionSchema`
   - `StepsSectionSchema`, `ActionSectionSchema`, `TransitionSectionSchema`
   - `ScoreComparisonSectionSchema`, `ListStepsSectionSchema`, `FlowChartSectionSchema`

2. Union型で統合: `z.discriminatedUnion('type', [...])`
   - `type` フィールドで判別可能なUnion型
   - パフォーマンスとエラーメッセージが向上

3. `blog` スキーマに追加:
   ```typescript
   diagram: z.array(DiagramSectionSchema).optional()
   ```

**重要なポイント**:
- **`id` フィールドはスキーマに含めない**(ビルド時に自動生成)
- 既存の `selfAssessment` のネストパターンを踏襲
- `.optional()` で既存記事への影響を回避

**期待される成果物**:
- フロントマターの `diagram` フィールドが型安全に検証される
- 不正なデータはビルド時にエラーとして検出

---

### Phase 2: 型エイリアス更新 (`src/types/diagram.ts`)

**目的**: Zodスキーマから TypeScript 型を生成し、既存コードとの互換性を保つ

**実装内容**:
1. `content.config.ts` からスキーマをimport
2. `z.infer<typeof DiagramSectionSchema>` で型を生成
3. `Extract<Union, { type: 'xxx' }>` で個別のセクション型を抽出
4. 既存の型名(`HeroSectionData` など)を維持
5. `BaseSection` 型で `id` フィールドを追加

**重要なポイント**:
- **既存のコンポーネントへの影響を最小限に**
- 型名を変更しないことで後方互換性を確保
- Zodスキーマが単一の真実の源(SSOT)

**期待される成果物**:
- `DynamicPageBuilder` や各セクションコンポーネントは変更不要
- TypeScript型チェックが通る

---

### Phase 3: 動的ルーティングページ作成 (`src/pages/blog/diagram/[slug].astro`)

**目的**: `diagram` フィールドを持つ記事から静的ページを生成

**実装内容**:
1. `getStaticPaths()` で図解記事をフィルタリング:
   ```typescript
   const diagramPosts = allPosts.filter((post) => post.data.diagram);
   ```

2. セクションIDの自動生成:
   ```typescript
   const sectionsWithId = post.data.diagram.map((section, index) => ({
     ...section,
     id: `section-${index + 1}`,
   }));
   ```

3. `ArticleData` 形式に変換して `DynamicPageBuilder` に渡す

4. メタデータの設定:
   - OGP画像: `/blog/ogp/[slug].png`
   - JSON-LD構造化データ
   - canonical URL: `/blog/diagram/[slug]/`

**重要なポイント**:
- `diagram` フィールドがない記事は通常のブログページとして表示
- ID生成は連番方式(`section-1`, `section-2`, ...)
- 既存の `/blog/[slug].astro` のメタデータパターンを踏襲

**期待される成果物**:
- `/blog/diagram/[slug]/` にアクセス可能
- 図解コンポーネントが正しくレンダリングされる

---

### Phase 4: 検証とサンプルデータ追加

**目的**: 実装が正しく動作することを確認

**実装内容**:
1. `contents/blog/2025-12-30_claude-code-dynamic-skill-loading.md` に最小限の `diagram` フィールドを追加:
   ```yaml
   diagram:
     - type: hero
       date: 2025/12/30
       title: タイトル
       subtitle: サブタイトル
     - type: transition
     - type: core_message
       title: コアメッセージ
       mainMessage: メッセージ本文
       coreHighlight:
         title: ハイライトタイトル
         text: ハイライト本文
   ```

2. 開発サーバーで動作確認:
   ```bash
   bun run dev
   # http://localhost:4321/blog/diagram/claude-code-dynamic-skill-loading/ にアクセス
   ```

3. ビルドして静的ファイル生成を確認:
   ```bash
   bun run build
   # dist/blog/diagram/claude-code-dynamic-skill-loading/index.html が生成されることを確認
   ```

4. 型チェックが通ることを確認:
   ```bash
   bun run type-check
   ```

**期待される成果物**:
- ビルドエラーなし
- 静的ページが正しく生成される
- 型エラーなし

---

## 実装の順序(推奨)

1. **Step 1**: `src/content.config.ts` にZodスキーマ追加(30分)
2. **Step 2**: `src/types/diagram.ts` で型エイリアス更新(20分)
3. **Step 3**: `src/pages/blog/diagram/[slug].astro` 作成(30分)
4. **Step 4**: サンプルデータでテスト(20分)
5. **Step 5**: ビルドと最終検証(10分)

**合計所要時間**: 約2時間

---

## 重要なファイル

### 変更が必要なファイル

1. **`src/content.config.ts`**
   - 9種類のセクション型のZodスキーマを定義
   - `diagram: z.array(DiagramSectionSchema).optional()` を追加

2. **`src/types/diagram.ts`**
   - `z.infer<typeof DiagramSectionSchema>` で型を生成
   - 既存の型名を維持して後方互換性を確保

3. **`src/pages/blog/diagram/[slug].astro`** (新規作成)
   - `getStaticPaths()` で図解記事をフィルタリング
   - セクションIDを自動生成
   - メタデータ設定

### 参考ファイル(変更不要)

- `src/pages/blog/diagram/index.astro` - 完全なサンプルデータ
- `src/components/feature/diagram/dynamic-page-builder.tsx` - 既存のコンポーネント
- `src/pages/blog/[slug].astro` - メタデータパターンの参考

---

## 技術的な設計判断

### 1. Zodスキーマが単一の真実の源(SSOT)
- フロントマター検証と TypeScript 型が完全一致
- デュアルメンテナンスの問題を回避

### 2. ID自動生成は連番方式
- `section-1`, `section-2`, ... という形式
- シンプルで予測可能
- 図解ページではSEO・アンカーリンクでIDを使用しない

### 3. 既存コードへの影響を最小限に
- `.optional()` で既存記事は影響なし
- 既存の型名・コンポーネントは変更不要
- 段階的な移行が可能

### 4. 静的生成でパフォーマンス最適化
- Astro の Content Collections の恩恵を最大限活用
- ビルド時に型チェックも完了

---

## 潜在的な問題と対処法

### 問題1: Zodスキーマのexport
- **解決策**: `content.config.ts` から直接export可能(Astro 5.x対応)
- **代替案**: 動作しない場合は `src/schemas/diagram.ts` に切り出し

### 問題2: 型の循環参照
- **解決策**: 一方向の依存のみ(`types/diagram.ts` → `content.config.ts`)

### 問題3: 既存デモページとの整合性
- **解決策**: デモページは `/blog/diagram/` で維持、動的ページは `/blog/diagram/[slug]/` で衝突なし

---

## 最終成果物

### フロントマターの例

```yaml
---
title: いい質問なんて最初からできるわけない
slug: good-questions
date: 2024-12-28
diagram:
  - type: hero
    date: 2024/12/28
    title: 「いい質問」なんて最初からできるわけない
    subtitle: そんな恐怖心から、質問できずにいるあなたへ。
  - type: problem
    title: こんな「モヤモヤ」ありませんか？
    introText: 質問するのが怖い...
    cards:
      - icon: alert
        title: 質問するのが怖い
        subtitle: できないやつと思われたくない
        description: 的外れな質問をして...
  - type: transition
  - type: core_message
    title: 核心メッセージ
    mainMessage: 60点の質問でいい
    coreHighlight:
      title: まずは行動することが大事
      text: 完璧を求めず、まず質問してみよう
      accentColor: GOLD
---
```

### 生成されるURL
- フロントマター記述 → `/blog/diagram/good-questions/` に静的ページ生成
- ビルド時に自動的に型検証・ID生成

### ビルド時の動作
1. Zodスキーマでフロントマターを検証
2. セクションに `id: "section-1"`, `id: "section-2"` を自動付与
3. DynamicPageBuilder でコンポーネントをレンダリング
4. 静的HTML生成(JavaScriptなし)

---

## まとめ

この実装により、以下が達成されます:

✅ フロントマターに YAML を書くだけで図解ページを生成
✅ 型安全なスキーマ検証(ビルド時にエラー検出)
✅ セクションIDの自動生成(ユーザーの記述負担を軽減)
✅ 既存記事への影響なし(`.optional()` で段階的移行)
✅ 静的HTML生成(高速配信、SEO最適化)

変更ファイル数: 3ファイル(1新規、2変更)

---

## 実装状況(2026-01-02)

### ✅ 完了した作業

#### Phase 1: Zodスキーマ定義 (`src/content.config.ts`)
- ✅ 9種類のセクション型のZodスキーマを定義完了
- ✅ `z.discriminatedUnion('type', [...])` でUnion型を実装
- ✅ `diagram: z.array(DiagramSectionSchema).optional()` を追加
- ✅ スキーマをexport: `export const DiagramSectionSchema = ...`

#### Phase 2: 型エイリアス更新(初回試行) (`src/types/diagram.ts`)
- ✅ `z.infer<typeof DiagramSectionSchema>` で型を生成
- ✅ `Extract<Union, { type: 'xxx' }>` パターンで個別型を抽出
- ⚠️ **問題発覚**: `WithId<T>` ヘルパーを追加したが、型推論がうまく動作せず

#### Phase 3: 動的ルーティングページ作成 (`src/pages/blog/diagram/[slug].astro`)
- ✅ `getStaticPaths()` で図解記事をフィルタリング実装
- ✅ セクションIDの自動生成ロジック実装
- ✅ OGP画像、JSON-LD、canonical URLの設定完了
- ⚠️ **問題発覚**: `as ArticleData['content']` で型アサーションを使用(危険)

#### Phase 4: サンプルデータ追加
- ✅ `contents/blog/2025-12-30_claude-code-dynamic-skill-loading.md` に3セクション追加
  - hero, transition, core_message
- ✅ フロントマターのYAML形式で正常に記述

#### Phase 5: ビルド検証
- ✅ `bun run build` 成功
- ✅ 静的ファイル生成確認: `dist/blog/diagram/claude-code-dynamic-skill-loading/index.html` (29,763 bytes)
- ❌ **型チェック失敗**: 61個の型エラー(すべて `never` 型関連)

### 🔴 未解決の問題

#### 問題1: 型推論の失敗(最重要)

**症状**:
- `sectionsWithId` が `never[]` 型と推論される
- 各セクションコンポーネントで `data` プロパティが `never` 型になる
- 61個の型エラーが発生

**原因**:
- Zodスキーマから推論された型と既存の `ArticleSection` 型が一致していない
- `Extract<DiagramSectionWithoutId, { type: 'xxx' }>` が正しく機能していない
- `WithId<T>` ヘルパーでの型合成がうまく動作していない

**危険なコード(現状)**:
```typescript
// src/pages/blog/diagram/[slug].astro
const sectionsWithId = post.data.diagram!.map((section, index) => ({
  ...section,
  id: `section-${index + 1}`,
})) as ArticleData['content'];  // ⚠️ 型エラーを隠蔽している
```

**影響**:
- ビルドは成功するが、型安全性が完全に失われている
- コンポーネント内でランタイムエラーが発生する可能性がある
- 開発時に型チェックが機能しない

#### 問題2: 既存コンポーネントとの型不一致

**症状**:
- `DynamicPageBuilder` 内の `section.id` や `section.type` が `never` 型
- 各セクションコンポーネント(HeroSection, ProblemSection など)の `data` プロパティが `never` 型

**原因**:
- Zodから生成された型が、既存のハードコードされた型定義と構造が異なる
- `BaseSection` との交差型がうまく機能していない

### 📋 次のステップ(作業停止により未実施)

#### Option 1: 型定義を完全に書き直す(推奨)
1. `src/types/diagram.ts` で既存の型定義を削除
2. Zodスキーマから直接 `z.infer` で型を生成
3. `ArticleSection` 型を以下のように定義:
   ```typescript
   export type ArticleSection = WithId<z.infer<typeof DiagramSectionSchema>>;
   ```
4. `ArticleData['content']` を `ArticleSection[]` として明示的に定義

#### Option 2: Zodスキーマを既存の型に合わせる
1. Zodスキーマを既存の型定義に完全一致させる
2. 各セクションのフィールドを手動で検証
3. `z.infer` の結果が既存の型と一致することを確認

#### Option 3: 中間型を導入
1. Zodスキーマから推論された型を `DiagramSectionRaw` として定義
2. ビルド時に `DiagramSectionRaw` から `ArticleSection` への変換関数を実装
3. 型ガードで安全に変換

### ⚠️ 重要な教訓

1. **`as` アサーションは最後の手段**
   - 型エラーを隠蔽するだけで、根本的な問題は解決しない
   - ビルドは成功するが、型安全性が失われる

2. **Zodスキーマと型定義の一致が必須**
   - `z.infer` で生成される型と手動で定義した型が一致しないと、型推論が破綻する
   - どちらか一方を真実の源(SSOT)とすべき

3. **段階的な検証が重要**
   - 各Phaseで型チェックを実行すべきだった
   - Phase 2完了時点で型エラーに気づくべきだった

### 📁 変更されたファイル

1. **`src/content.config.ts`** - Zodスキーマ追加(完了)
2. **`src/types/diagram.ts`** - 型エイリアス更新(問題あり)
3. **`src/pages/blog/diagram/[slug].astro`** - 新規作成(型アサーション使用中)
4. **`contents/blog/2025-12-30_claude-code-dynamic-skill-loading.md`** - サンプルデータ追加(完了)

### 🛑 作業停止理由

型安全性が確保できない状態で実装を進めるのは危険と判断。`as` アサーションで型エラーを隠蔽している現状は、ランタイムエラーのリスクが高く、保守性も低い。根本的な型設計の見直しが必要。
# いいねボタン機能 - API設計書

## 概要

Cloudflare Workers + D1を使用したいいねボタン機能のバックエンド設計書。

## アーキテクチャ

```
[Astroブログ (Static)]
  ↓ fetch (CORS)
[Cloudflare Workers API]
  ↓ SQL
[Cloudflare D1 (SQLite)]
```

## データベース設計

### テーブル: `likes`

```sql
CREATE TABLE IF NOT EXISTS likes (
  slug TEXT PRIMARY KEY NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

**注意**: `slug` が PRIMARY KEY のため、自動的にインデックスが作成されます。`updated_at` での検索・ソートを実装しない限り、追加のインデックスは不要です。

#### カラム定義

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| `slug` | TEXT | PRIMARY KEY, NOT NULL | 記事のスラッグ (例: `astro-like-button`) |
| `count` | INTEGER | NOT NULL, DEFAULT 0 | いいね数 |
| `created_at` | INTEGER | NOT NULL, DEFAULT unixepoch() | 作成日時 (UNIX timestamp) |
| `updated_at` | INTEGER | NOT NULL, DEFAULT unixepoch() | 更新日時 (UNIX timestamp) |

### 初期データ

```sql
-- テスト用初期データ (任意)
INSERT INTO likes (slug, count) VALUES ('example-post', 0)
ON CONFLICT(slug) DO NOTHING;
```

## API仕様

### エンドポイント

Base URL: `https://suntory-n-water.com`

**注意**: 既存の `sui-tech-blog-image-workers` に統合するため、`/api/like/*` パスで実装する。

#### 1. いいね数取得

```
GET /api/like/:slug
```

##### パスパラメータ

- `slug` (string, required): 記事のスラッグ

##### レスポンス

**成功 (200 OK)**

```json
{
  "slug": "astro-like-button",
  "likes": 42
}
```

**エラー (404 Not Found)**

```json
{
  "error": "Not found",
  "slug": "non-existent-post"
}
```

**エラー (500 Internal Server Error)**

```json
{
  "error": "Database error"
}
```

##### 例

```bash
curl https://suntory-n-water.com/api/like/astro-like-button
```

#### 2. いいね数インクリメント

```
POST /api/like/:slug
```

##### パスパラメータ

- `slug` (string, required): 記事のスラッグ

##### リクエストボディ

```json
{
  "increment": 1
}
```

| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| `increment` | number | required, 1-10 | 増加量 (1回のリクエストで最大10) |

##### レスポンス

**成功 (200 OK)**

```json
{
  "slug": "astro-like-button",
  "likes": 43,
  "incremented": 1
}
```

**エラー (400 Bad Request)**

```json
{
  "error": "Invalid increment value",
  "message": "increment must be between 1 and 10"
}
```

**エラー (500 Internal Server Error)**

```json
{
  "error": "Database error"
}
```

##### 例

```bash
curl -X POST https://suntory-n-water.com/api/like/astro-like-button \
  -H "Content-Type: application/json" \
  -d '{"increment": 1}'
```

## TypeScript型定義

### Valibot スキーマ定義 (推奨)

既存の `sui-tech-blog-image-workers` では Valibot を使用しているため、統一する。

```typescript
// src/types.ts に追加
import * as v from 'valibot';

// POST /api/like/:slug のリクエストボディ
export const IncrementLikeRequestSchema = v.object({
  increment: v.pipe(
    v.number(),
    v.minValue(1, 'increment must be at least 1'),
    v.maxValue(10, 'increment must be at most 10')
  ),
});

// GET /api/like/:slug のレスポンス
export const GetLikeResponseSchema = v.object({
  slug: v.string(),
  likes: v.number(),
});

// POST /api/like/:slug のレスポンス
export const IncrementLikeResponseSchema = v.object({
  slug: v.string(),
  likes: v.number(),
  incremented: v.number(),
});

// エラーレスポンス
export const ErrorResponseSchema = v.object({
  error: v.string(),
  message: v.optional(v.string()),
  slug: v.optional(v.string()),
});

// 型エクスポート
export type IncrementLikeRequest = v.InferOutput<typeof IncrementLikeRequestSchema>;
export type GetLikeResponse = v.InferOutput<typeof GetLikeResponseSchema>;
export type IncrementLikeResponse = v.InferOutput<typeof IncrementLikeResponseSchema>;
export type ErrorResponse = v.InferOutput<typeof ErrorResponseSchema>;
```

### 環境変数型 (Env の拡張)

bun run cf-typegen で型定義を更新する

## CORS設定

### 注意: 同一ドメインのため不要

既存の構成では、ブログ (`suntory-n-water.com`) と Workers API が **同一ドメイン** で動作するため、CORS設定は **不要** です。

```
ブログ: https://suntory-n-water.com/blog/example
API:   https://suntory-n-water.com/api/like/example
```

### 開発環境での CORS (localhost 対応)

ローカル開発時のみ CORS が必要な場合は、以下のように実装:

```typescript
// Honoのミドルウェアを使用
import { cors } from 'hono/cors';

app.use('/api/like/*', cors({
  origin: (origin) => {
    // 本番では同一オリジンなので許可不要、開発時のみlocalhost許可
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return origin;
    }
    return 'https://suntory-n-water.com';
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400,
}));
```

## セキュリティ考慮事項

### 1. SQL インジェクション対策

D1のプリペアドステートメントを使用(必須)

```typescript
// ✅ Good
await env.DB.prepare('SELECT * FROM likes WHERE slug = ?').bind(slug).first();

// ❌ Bad
await env.DB.prepare(`SELECT * FROM likes WHERE slug = '${slug}'`).first();
```

### 2. インクリメント値の検証

```typescript
if (typeof increment !== 'number' || increment < 1 || increment > 10) {
  return new Response(JSON.stringify({
    error: 'Invalid increment value',
    message: 'increment must be between 1 and 10'
  }), { status: 400 });
}
```

### 3. スラッグの検証

```typescript
// 許可する文字: 英数字、ハイフン、アンダースコア
const slugRegex = /^[a-zA-Z0-9_-]+$/;
if (!slugRegex.test(slug)) {
  return new Response(JSON.stringify({
    error: 'Invalid slug format'
  }), { status: 400 });
}
```

## デプロイ設定

### wrangler.jsonc (既存Workersへの追加)

既存の `sui-tech-blog-image-workers` に統合する場合の設定例:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "sui-tech-blog-image-workers",
  "main": "src/index.ts",
  "compatibility_date": "2025-12-27",
  "observability": {
    "enabled": true
  },
  "routes": [
    {
      "pattern": "suntory-n-water.com/images/*",
      "zone_name": "suntory-n-water.com"
    },
    {
      "pattern": "suntory-n-water.com/api/og*",
      "zone_name": "suntory-n-water.com"
    },
    // 追加: いいねAPIルート
    {
      "pattern": "suntory-n-water.com/api/like/*",
      "zone_name": "suntory-n-water.com"
    }
  ],
  "r2_buckets": [
    {
      "binding": "R2",
      "bucket_name": "sui-obsidian-vault",
      "preview_bucket_name": "sui-obsidian-vault-preview",
      "remote": true
    }
  ],
  "kv_namespaces": [
    {
      "binding": "OG_KV",
      "id": "1a01f7fde50b4ee5b409fcaec45796ff",
      "preview_id": "660cc4c4d2de4e15aa23bbc5c5bdb2bd",
      "remote": true
    }
  ],
  "secrets_store_secrets": [
    {
      "binding": "SECRETS_STORE_SECRETS",
      "secret_name": "API_SECRET",
      "store_id": "58ab0cd45df24fefbd3e8bab3a471779"
    }
  ],
  // 追加: D1データベースバインディング
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "blog-likes",
      "database_id": "your-database-id" // 実際のIDに置き換え
    }
  ]
}
```

### デプロイ手順

```bash
# 1. D1データベース作成
cd /Users/n_okuda/dev/sui-tech-blog-image-workers
bunx wrangler d1 create blog-likes

# 2. テーブル作成
bunx wrangler d1 execute blog-likes --file=./schema.sql

# 3. wrangler.jsonc の database_id を更新

# 4. デプロイ
bunx wrangler deploy
```

## モニタリング

### Cloudflare Dashboard

- Workers Analytics: リクエスト数、エラー率、レイテンシ
- D1 Analytics: クエリ数、実行時間

### ログ出力

```typescript
console.log(`[LIKE] ${method} /like/${slug} - ${status}`);
```

リアルタイムログは `wrangler tail` で確認可能。

```bash
bunx wrangler tail
```

## パフォーマンス最適化

### 1. UPSERT を使用した書き込み最適化

```sql
INSERT INTO likes (slug, count, updated_at)
VALUES (?, ?, unixepoch())
ON CONFLICT(slug) DO UPDATE SET
  count = count + excluded.count,
  updated_at = unixepoch();
```

### 2. キャッシュ戦略

GETリクエストには短時間のキャッシュを設定可能。

```typescript
return new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=10', // 10秒キャッシュ
  },
});
```
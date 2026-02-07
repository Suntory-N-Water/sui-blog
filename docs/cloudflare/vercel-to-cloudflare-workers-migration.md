# Vercel から Cloudflare Workers への移行影響調査

## 概要

本ドキュメントは、sui Tech Blog を Vercel から Cloudflare Workers へ移行する際の影響範囲と必要な修正を調査した結果をまとめたものです。

**調査日**: 2025-12-27
**対象プロジェクト**: sui Tech Blog (Astro 5.x)
**移行元**: Vercel
**移行先**: Cloudflare Workers

---

## Cloudflare Workers の特徴と制約

### V8ランタイムの制約

Cloudflare Workers は V8 JavaScript エンジン上で動作します。これにより、以下の制約があります。

#### Node.js標準モジュールの互換性

Cloudflare Workers は Node.js の完全な互換性はありませんが、`nodejs_compat` フラグを有効にすることで、一部のNode.js APIが利用可能になります。

**利用可能な Node.js API (公式ドキュメントより)**:
- `node:fs` - 仮想ファイルシステム (2025-09-01以降のcompatibility_dateで有効)
- `node:http`, `node:https` - HTTPクライアントAPI (2025-08-15以降で有効)
- `node:path` - パス操作
- `node:buffer` - Bufferオブジェクト
- `node:crypto` - 暗号化API
- `AsyncLocalStorage` - 非同期コンテキスト管理

**利用できない/制約がある機能**:
- ファイルシステム (build時のみ可能、runtime時は不可)
- `process.cwd()` (ビルド時のみ)
- ネイティブモジュール
- 一部のNode.js標準モジュール

**参考**: [Cloudflare Workers - Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs)

---

## 影響範囲の分析

### 1. デプロイ方式の変更

#### 現状 (Vercel)
- SSG (Static Site Generation) で静的ファイルを生成
- Vercel CLI または GitHub統合で自動デプロイ

#### 移行後 (Cloudflare Workers)
- SSG で静的ファイルを生成 (変更なし)
- Wrangler CLI でデプロイ
- Cloudflare Pages または Workers Static Assets を使用

**影響レベル**: 🟡 中程度

**必要な変更**:
1. `wrangler.jsonc` の作成
2. デプロイスクリプトの変更
3. GitHub Actions ワークフローの更新

---

### 2. ビルド時のNode.js標準モジュール使用

本プロジェクトでは、**ビルド時にのみ** Node.js標準モジュールを使用しています。Cloudflare Workers へ移行しても、SSGビルドはローカルまたはCI環境(Node.js環境)で実行されるため、**影響はありません**。

#### ビルド時に使用しているNode.js標準モジュール

以下のファイルはビルド時(`astro build`実行時)にのみ実行され、ランタイムでは実行されません。

| ファイル | 使用モジュール | 用途 | 影響 |
|---------|--------------|------|------|
| `src/lib/ogp.tsx` | `node:fs`, `node:path` | OGP画像生成 (Satori) | ✅ 影響なし (ビルド時のみ) |
| `src/lib/fetch-og-metadata.ts` | `node:process` (環境変数) | OGメタデータ取得 | ✅ 影響なし (ビルド時のみ) |
| `src/lib/inline-icons.ts` | `node:fs`, `node:path` | SVGアイコンのインライン化 | ✅ 影響なし (ビルド時のみ) |
| `src/lib/rehype-*.ts` | なし | Markdownパイプライン | ✅ 影響なし |
| `astro.config.ts` | `node:url` | 設定ファイル | ✅ 影響なし (ビルド時のみ) |

#### スクリプトファイル(ビルド時ツール)

以下のファイルは開発時のスクリプトであり、デプロイには含まれません。

| ファイル | 使用モジュール | 用途 |
|---------|--------------|------|
| `scripts/create-blog-template.ts` | `node:fs`, `node:path`, `node:child_process` | 新規記事テンプレート生成 |
| `scripts/update-blog-icon.ts` | `node:fs`, `node:path` | アイコン更新 |
| その他 `scripts/*.ts` | `node:fs`, `node:path` | 開発ツール |

**結論**: これらはすべてビルド時またはローカル開発時のみ使用されるため、**Cloudflare Workersへの移行による影響はありません**。

---

### 3. ランタイムコードの確認

#### 現在のアーキテクチャ
本プロジェクトは **完全なSSG (Static Site Generation)** です。

- すべてのページは `astro build` 時に静的HTMLとして生成
- ランタイムでのサーバーサイド処理は **存在しない**
- `astro.config.ts` にアダプター設定なし(完全静的サイト)

**影響レベル**: ✅ 影響なし

---

### 4. 外部API呼び出し

#### OGメタデータ取得 (`src/lib/fetch-og-metadata.ts`)

ビルド時に外部URLからOGデータを取得し、Cloudflare Workers KV にキャッシュする処理があります。

**現在の実装**:
```typescript
// ビルド時に外部URLから取得
const response = await fetch(url, {
  headers: {
    'User-Agent': 'bot',
  },
});
```

**Cloudflare Workers での動作**:
- ビルド時の `fetch` は問題なく動作
- `process.env.NODE_ENV` は使用可能(ビルド時)
- Cloudflare Workers KV への保存API呼び出しは、認証情報さえあれば問題なし

**影響レベル**: ✅ 影響なし

---

### 5. 依存パッケージの互換性

#### 主要な依存関係の確認

| パッケージ | 使用箇所 | Cloudflare互換性 | 備考 |
|-----------|---------|----------------|------|
| `@resvg/resvg-js` | OGP画像生成 | ✅ ビルド時のみ | WASM版も利用可能 |
| `satori` | OGP画像生成 | ✅ ビルド時のみ | SVG生成 |
| `jsdom` | SVGサニタイズ | ✅ ビルド時のみ | DOMPurify初期化用 |
| `dompurify` | XSS対策 | ✅ 問題なし | ブラウザ互換 |
| `rehype-*`, `remark-*` | Markdown処理 | ✅ ビルド時のみ | 静的生成 |
| `react`, `@radix-ui/*` | UIコンポーネント | ✅ 問題なし | クライアント側 |

**影響レベル**: ✅ 影響なし

---

## 移行手順

### 1. Wrangler 設定ファイルの作成(型安全)

プロジェクトルートに `wrangler.jsonc` を作成します(最新のベストプラクティス)。

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "sui-tech-blog",
  "compatibility_date": "2025-12-27",
  "assets": {
    "directory": "./dist"
  },
  "compatibility_flags": ["nodejs_compat"],
  "vars": {
    "PUBLIC_APP_URL": "https://suntory-n-water.com"
  },
  "env": {
    "preview": {
      "name": "sui-tech-blog-preview"
    }
  }
}
```

**重要な設定項目**:
- `$schema` - IDEのオートコンプリートとバリデーションを有効化
- `vars` - 環境変数(`process.env` などに対応)
- `compatibility_flags` - Node.js互換性を有効化
- `env.preview` - プレビュー環境の設定(別名のWorkerとしてデプロイ)

**注**: TOML形式 (`wrangler.toml`) も利用可能ですが、JSONCの方がTypeScriptプロジェクトとの親和性が高く、IDEのサポートも充実しています。

**参考**:
- [Cloudflare Workers - Astro deployment](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro)
- [Cloudflare Workers - Environment Variables](https://developers.cloudflare.com/workers/configuration/environment-variables)

---

### 2. TypeScript型定義の自動生成

`wrangler types` コマンドで、`wrangler.jsonc` の設定から TypeScript 型定義を自動生成できます。

#### package.json にスクリプト追加

```json
{
  "scripts": {
    "build": "astro build",
    "postbuild": "pagefind --site dist",
    "deploy": "wrangler deploy",
    "dev:cf": "wrangler dev",
    "dev:cf:remote": "wrangler dev --remote",
    "cf-typegen": "wrangler types"
  }
}
```

**コマンド説明**:
- `deploy` - 本番環境へデプロイ
- `dev:cf` - ローカルでCloudflare Workers環境をエミュレート
- `dev:cf:remote` - 実際のCloudflare環境でリモート開発(KV/R2などのバインディングが必要な場合)
- `cf-typegen` - TypeScript型定義を生成

#### 依存関係のインストール

```bash
bun add -D wrangler @types/node
```

#### 型定義ファイルの生成

```bash
bun run cf-typegen
```

これにより `worker-configuration.d.ts` がプロジェクトルートに生成されます。

**重要**: このファイルは **Gitにコミットすることが推奨**されています(公式ドキュメントより)。

#### tsconfig.json の更新

生成された型定義を使用するため、`tsconfig.json` に追加します:

```json
{
  "compilerOptions": {
    "types": ["@types/node", "./worker-configuration.d.ts"]
  }
}
```

**参考**: [Cloudflare Workers - TypeScript](https://developers.cloudflare.com/workers/languages/typescript)

---

### 3. .gitignore の更新

Wranglerの一時ファイルを除外します。

```gitignore
# Cloudflare Workers
.wrangler/
```

**注**: `worker-configuration.d.ts` は**Gitにコミット推奨**です(公式ドキュメントより)。CI環境でも使用できるようにするためです。

---

### 4. GitHub Actions ワークフローの更新

`.github/workflows/deploy.yml` を更新します。

#### プレビュー環境(Pull Request)

```yaml
- name: Build Project Artifacts
  run: bun run build

- name: Deploy to Cloudflare Workers (Preview)
  run: bunx wrangler deploy --env preview
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

#### 本番環境(main ブランチ)

```yaml
- name: Build Project Artifacts
  run: bun run build

- name: Deploy to Cloudflare Workers (Production)
  run: bunx wrangler deploy
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**重要な変更点**:
- Playwright のインストールとキャッシュは **必須**(rehype-mermaid がビルド時に使用)
- `bun run build` で自動的に `postbuild`(Pagefind)が実行される
- プレビュー環境は `--env preview` で別名の Worker にデプロイ
- 本番環境は環境指定なしでデフォルト設定を使用

**参考**: [Wrangler - CI/CD](https://developers.cloudflare.com/workers/wrangler/ci-cd/)

---

### 5. GitHub Secrets の設定

GitHub リポジトリの Settings > Secrets and variables > Actions で以下を追加:

- `CLOUDFLARE_API_TOKEN` - Cloudflare API トークン
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare アカウント ID

#### API トークンの作成方法

1. Cloudflare ダッシュボード → My Profile → API Tokens
2. "Create Token" → "Edit Cloudflare Workers" テンプレートを使用
3. Account Resources で対象アカウントを選択
4. トークンをコピーして GitHub Secrets に追加

---

### 6. ビルドとデプロイコマンド

```bash
# ローカルビルド
bun run build      # Astro SSG ビルド + Pagefind インデックス生成(postbuild)

# ローカル開発(Cloudflare Workers 環境)
bun run dev:cf     # ローカルエミュレーション

# デプロイ
bun run deploy     # 本番環境へデプロイ
bunx wrangler deploy --env preview  # プレビュー環境へデプロイ
```

---

## 検証項目チェックリスト

移行後、以下の項目を検証してください。

- [ ] 静的ファイル(HTML, CSS, JS)が正しく配信される
- [ ] 画像が正しく表示される
- [ ] OGP画像が正しく生成される
- [ ] Pagefind 検索が動作する
- [ ] 外部リンクカードが表示される
- [ ] Mermaid図が表示される
- [ ] コードブロックのコピーボタンが動作する
- [ ] レスポンシブデザインが崩れていない
- [ ] ページ遷移が正常に動作する
- [ ] RSS フィードが配信される
- [ ] サイトマップが配信される
- [ ] robots.txt が配信される

---

## まとめ

### 影響度評価

| カテゴリ | 影響度 | 理由 |
|---------|--------|------|
| ビルド時Node.js使用 | ✅ 影響なし | ビルドはローカル/CI環境で実行 |
| ランタイムコード | ✅ 影響なし | 完全なSSG、サーバーレンダリングなし |
| 依存パッケージ | ✅ 影響なし | すべてビルド時またはクライアント側 |
| デプロイ方式 | 🟡 変更必要 | Wrangler設定とワークフロー更新 |
| 環境変数 | 🟡 変更必要 | Cloudflare環境変数に再設定 |

### 総合評価

**移行難易度**: 🟢 低い

本プロジェクトは完全なSSG(Static Site Generation)であり、ランタイムでNode.js標準モジュールを使用していないため、**Cloudflare Workersへの移行は比較的容易**です。

主な作業は以下の3点のみ:
1. `wrangler.jsonc` の作成
2. GitHub Actions ワークフローの更新
3. 環境変数の再設定

---

## 参考資料

### 公式ドキュメント

- [Cloudflare Workers - Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs)
- [Cloudflare Workers - Astro framework guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro)
- [Cloudflare Workers - Static Assets](https://developers.cloudflare.com/workers/static-assets/get-started)
- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration)
- [Compatibility dates and flags](https://developers.cloudflare.com/workers/configuration/compatibility-dates)

### Node.js互換性

- `nodejs_compat` フラグにより、Node.js APIの一部が利用可能
- `compatibility_date` を `2024-09-23` 以降に設定すると、自動的に `nodejs_compat_v2` が有効化され、追加のポリフィルが提供される
- `node:fs` は `2025-09-01` 以降で利用可能(ただし仮想ファイルシステム)
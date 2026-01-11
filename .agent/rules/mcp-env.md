---
trigger: always_on
description: "MCPサーバー (Context7, Kiri) の使用方法と環境ごとのコマンド権限を定義します。"
---

# MCPと環境設定

## MCP 利用ガイドライン

### Context7 (ライブラリドキュメント)
- **目的**: 最新のライブラリドキュメントを取得する。
- **使用法**:
  1. `mcp__context7__resolve-library-id` (IDが明示されていない場合)
  2. `mcp__context7__get-library-docs`

### Kiri (コードインテリジェンス)
- **目的**: コードコンテキストの読み込み、セマンティック検索、依存関係分析。
- **推奨ツール**:
  - `mcp__kiri__context_pnpmdle`: 一般的なコンテキスト収集用 (`compact: true` を使用)。
  - `mcp__kiri__files_search`: 具体的なキーワード検索用。
  - `mcp__kiri__deps_closure`: 依存関係 (入/出) の分析用。
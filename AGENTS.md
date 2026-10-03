EmDash, Astro 上に構築されたブログ CMS

## コマンド

```bash
pnpm run dev              # Astro 開発サーバーを起動
npx emdash types      # 起動中のサイトから TypeScript 型を再生成
```

管理 UI は `http://localhost:4321/_emdash/admin` にあります。

## ドキュメント

EmDash のドキュメントは、`https://docs.emdashcms.com/mcp` の MCP サーバーとして利用できます。API、フック、設定オプション、フィールド型、実装パターンを確認する必要がある場合は、学習データ上の記憶に頼らず、最新ドキュメントに対して `search_docs` を呼び出してください。ドキュメントは現在の挙動を反映しており、推測が正しいとは限りません。

## ルール

- すべてのコンテンツページはサーバーレンダリング(`output: "server"`)にすること。CMS コンテンツに `getStaticPaths()` を使用しない。
- コード内にコメントを書くことを禁止する。

# セキュリティ規約

## SVG ファイル
- SVG ファイルには `<script>` タグを含めない
- SVG ファイルには外部リソースへの参照を含めない
- CI で `bun run check:svg-security:all` が自動実行される
- SVG を追加・変更した場合はローカルでもチェックを実行する

## 環境変数・シークレット
- `.env` / `.dev.vars` ファイルはリポジトリにコミットしない
- API キー、トークンなどのシークレットをソースコードにハードコードしない
- 環境変数は `import.meta.env` 経由でアクセスする
- 公開可能な環境変数には `PUBLIC_` プレフィックスを付ける

## GitHub Actions
- ワークフローレベルで `permissions: {}` を設定し、ジョブごとに最小権限を付与する
- actions の参照にはタグではなくコミットハッシュを使用する
- checkout ステップで `persist-credentials: false` を設定する

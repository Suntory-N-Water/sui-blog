# EmDash / Cloudflare バックアップ手順

本番の D1 と R2 のバックアップは、リリース前後に明示的な承認を得て実行する。認証情報、アカウント ID、バケットの内容をリポジトリへ保存しない。

## D1

出力先を新しいバックアップディレクトリにしてから、リモート D1 を SQL としてエクスポートする。

```bash
rtk mkdir -p backups/d1
rtk pnpm exec wrangler d1 export sui-tech-blog --remote --output backups/d1/sui-tech-blog-YYYYMMDD-HHMMSS.sql
```

取得後にファイルサイズ、先頭の SQL、記事テーブルの行数を確認し、暗号化された保管先へ移す。`backups/` は追跡対象にしない。

ローカル検証用の D1 では、EmDash の FTS5 仮想テーブルを含むため `wrangler d1 export --local` が失敗することがある。その場合は、Wrangler の SQLite をオンラインバックアップし、SQL dump として保管する。

```bash
rtk sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/<database>.sqlite ".backup 'backups/d1/sui-tech-blog-local-YYYYMMDD.sqlite'"
rtk sqlite3 backups/d1/sui-tech-blog-local-YYYYMMDD.sqlite ".dump" > backups/d1/sui-tech-blog-local-YYYYMMDD.sql
```

## R2

R2 は S3 互換 API を使って、`MEDIA` バケットのオブジェクトを別のバックアップ先へコピーする。R2 の Access Key ID と Secret Access Key は Cloudflare ダッシュボードで発行し、シェル履歴やファイルへ書き込まない。

```bash
rtk aws s3 sync s3://sui-tech-blog-media backups/r2/sui-tech-blog-media \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

取得後にオブジェクト数、総サイズ、代表的な画像のハッシュを確認する。復元テストでは別の D1 データベースと R2 バケットを使い、本番データを上書きしない。

ローカル検証用の R2 は、Wrangler の状態ディレクトリと EmDash CLI のローカル `uploads/` を、同じバックアップ世代のディレクトリへコピーする。

## 根拠

- [EmDash Cloudflare deployment](https://docs.emdashcms.com/deployment/cloudflare/)
- [Cloudflare D1 export](https://developers.cloudflare.com/d1/reference/cli/export/)
- [Cloudflare R2 S3 API](https://developers.cloudflare.com/r2/api/s3/api/)

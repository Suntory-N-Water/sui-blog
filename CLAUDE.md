# sui-blog

## 目的

このリポジトリは、EmDash公式のCloudflare向けブログテーマを基盤にした技術ブログである。公開処理はCloudflare Workers、記事データはCloudflare D1、画像はCloudflare R2で管理する。依存関係の管理にはpnpmを使う。

EmDashへの移行、記事データ、Cloudflare構成、移行手順を変更するときは、先に[EmDash移行の最終設計](docs/designs/emdash-migration.md)を読む。

## 実行時のデータ源

- 公開ページはEmDashの公開中記事データ取得機能からD1の記事を読む。
- 管理画面で公開した記事は、再ビルドなしで公開ページへ反映する。
- `contents/blog`は移行元のMarkdownと履歴であり、公開処理はこのディレクトリを読まない。
- Markdownから初期データファイルを作り直す処理と、移行前後を比較する処理だけが`contents/blog`を入力にする。

## 公開する範囲

移行対象は記事、タグ、RSS、`llms.txt`、記事のMarkdown出力、記事のOGP画像である。about、privacy、contact、diagram、自己評価機能は実装しない。旧URLの転送も作らない。

## ローカルでの確認

```bash
pnpm run dev       # Astroのローカル開発サーバー
pnpm run dev:cf    # Cloudflare Worker、D1、R2を使うローカル実行
pnpm run build
pnpm run typecheck
pnpm run lint
pnpm run textlint
pnpm run verify:emdash
```

## リモート環境の扱い

- Cloudflareへのデプロイ、リモートD1への初期データ登録、workers.devの確認は、明示的な依頼があるまで実行しない。
- Cloudflare上に既存データがある状態で初期データ登録や削除を行う場合だけ、作業直前にD1とR2を退避する。空のリモート環境に初回登録する場合、退避作業は発生しない。
- 退避手順は[Cloudflareリモートデータの退避手順](docs/runbook/emdash-backup.md)に記載する。退避データや認証情報はリポジトリへ登録しない。

## 変更時の確認

本文を変換できない場合は削除せず、Portable Textの代替ブロックと警告レポートへ残す。変更後は記事数、URL用識別子、タイトル、概要、本文、タグ、公開日、画像を移行前後で比較する。

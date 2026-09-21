## 概要

`contents/` は移行元の Markdown 記事と textlint 用の独立パッケージ。公開時の記事データは EmDash の D1 にあり、このディレクトリは実行時には読み込まれない。

## よく使うコマンド

このディレクトリで実行する。

```bash
pnpm run lint       # 文章の構成(textlint)をチェック
pnpm run lint:fix   # textlint の自動修正
```

記事本文は移行前の履歴として保存する。記事の移行はリポジトリルートの `pnpm run migrate:emdash` で行い、対応できない表現を削除しない。

## 文章ガイド

ブログ記事に倒置法は使用せず、通常の語順で書く。

## 概要

`contents/` はブログ記事の Markdown と textlint 用の独立パッケージ。サイトのビルドは `contents/blog/*.md` を読み込んで記事ページを生成する。

## よく使うコマンド

このディレクトリで実行する。

```bash
pnpm run lint       # 文章の構成(textlint)をチェック
pnpm run lint:fix   # textlint の自動修正
```

## 文章ガイド

ブログ記事に倒置法は使用せず、通常の語順で書く。

# EmDash Cloudflareブログ移行の最終設計

## 1. 目的

[Issue #596](https://github.com/Suntory-N-Water/sui-blog/issues/596)に基づき、既存のAstroブログをEmDash公式のCloudflare向けブログテーマへ移行する。

この文書は、移行を最初から計画した場合の構成、データの流れ、実施順序、完了条件を定める。移行作業の記録ではなく、実装と確認の基準として使う。

## 2. 対象と対象外

### 対象

- 記事
- タグ
- RSS
- `llms.txt`
- 記事のMarkdown出力
- 記事のOGP画像
- pnpmへの移行
- Cloudflare Workers、D1、R2の利用

### 対象外

- about
- privacy
- contact
- diagram
- 自己評価機能
- 旧URLの維持と転送

対象外の機能は、新しいサイトへ移植しない。旧URLへの転送も作らない。

## 3. 採用する基盤

### 3.1 公式テーマの生成

ブログの土台は手書きで作らず、EmDash公式の生成機能で作成する。生成には次のコマンドを使う。

```bash
npm create emdash@latest emdash-cloudflare-blog -- --template cloudflare:blog --pm pnpm --yes
```

生成先は一時ディレクトリとし、生成結果を確認してからリポジトリのルートへ移す。記事移行に必要な処理だけを追加し、公式テーマの構成と管理画面を独自実装で置き換えない。

### 3.2 実行環境

- アプリケーション: Cloudflare Workers
- 記事、タグ、設定: Cloudflare D1
- 画像: Cloudflare R2
- Webフレームワーク: Astroのサーバー実行
- パッケージ管理: pnpm

`src/worker.ts`をWorkerの入口とし、D1を`DB`、R2を`MEDIA`として接続する。EmDashの公開中記事データ取得機能を使い、公開ページはビルド時に記事本文を固定しない。

## 4. 記事データの流れ

```text
contents/blog/*.md
        ↓
Markdown移行処理
        ↓
seed/seed.json
        ↓
EmDashの初期データ登録
        ↓
Cloudflare D1とR2
        ↓
公開ページ、RSS、llms.txt、Markdown、OGP画像
```

`contents/blog`は移行処理の入力と履歴として残す。公開処理、Astroのページ生成、Workerの実行時処理は`contents/blog`を読まない。移行後も再変換と比較を行う必要があるため、入力ファイルを残すことと、公開処理が依存することを分けて扱う。

ここでいうseedは、EmDashが記事、タグ、設定、画像を初期登録するためのデータファイルである。

## 5. MarkdownからPortable Textへの変換

移行処理は、元記事を1記事ずつ読み、次の情報を初期データファイルへ移す。

| 元記事の情報 | 移行先 |
| --- | --- |
| ファイル名のURL用識別子（slug） | EmDashの記事のURL用識別子（slug） |
| title | 記事タイトル |
| descriptionまたは概要 | 記事概要 |
| date | EmDashの`published_at` |
| modified_time | 記事の`modified_time` |
| tags | EmDashのタグ |
| Markdown本文 | Portable Text形式の本文 |
| 記事中の画像 | EmDashのメディア参照 |

Portable Textは、EmDashが記事本文に使う構造化された文章形式である。本文は次の要素をPortable Textへ変換する。

- 見出し
- 段落
- 引用
- 箇条書きと番号付きリスト
- 太字、斜体、取り消し線、インラインコード
- リンク
- コードブロック
- 表
- 画像
- HTMLブロック
- 脚注

Mermaidは実行可能な図へ変換せず、`mermaid`指定のコードブロックとして保存する。対応できないHTMLやMarkdownは削除しない。`htmlBlock`、コードブロック、または変換警告のいずれかに残し、`reports/emdash/unsupported.md`で追跡できるようにする。

## 6. 画像の扱い

記事中の画像は、初期データファイル内で画像のURL、ファイル名、代替テキストを持つメディア参照として扱う。EmDashの初期データ登録処理が取得できる画像はR2へ保存する。

外部サーバーが取得を拒否した画像は、本文から黙って削除しない。取得失敗を画像一覧と警告レポートへ記録し、次のいずれかを公開前に決める。

1. 元の外部URLを使う
2. 利用可能な別の画像を用意してR2へ保存する
3. 記事の該当箇所を、画像がなくても意味が通る内容へ修正する

## 7. 公開面

次の公開面を新しいURL構成で実装する。

- `/posts`: 記事一覧
- `/posts/:slug`: 記事詳細
- `/tag`: タグ一覧
- `/tag/:slug`: タグ別記事一覧
- `/rss.xml`: RSS
- `/llms.txt`: 記事の機械向け一覧
- `/posts/:slug.md`: 記事のMarkdown出力
- `/posts/ogp/:slug.png`: 記事のOGP画像
- `/search`: 記事検索

記事詳細、タグ、RSS、`llms.txt`、Markdown、OGP画像は同じD1の記事データを参照する。記事を管理画面で編集して公開した場合、再ビルドなしでこれらの公開面へ反映する。

## 8. 実施順序

### 8.1 既存状態の確認

1. `AGENTS.md`、`CLAUDE.md`、Issue #596、既存の未コミット変更を確認する。
2. EmDash公式ドキュメントと公式Cloudflareブログテーマを確認する。
3. 記事数、slug、画像URL、タグ、日付を移行前の基準値として記録する。

完了条件: 移行前の比較対象が、記事ごとに再確認できる。

### 8.2 公式テーマの配置

1. 一時ディレクトリで公式生成コマンドを実行する。
2. 生成されたテーマの構成、依存関係、Cloudflare設定を確認する。
3. 公式テーマをリポジトリのルートへ配置する。
4. 旧アプリの対象外機能と重複するファイルを整理する。

完了条件: 公開アプリの基盤が公式テーマであり、テーマの主要な画面と管理画面を手書き実装で置き換えていない。

### 8.3 pnpmとCloudflare設定

1. ルートと`contents/`のパッケージ管理をpnpmへそろえる。
2. ルートのpnpmロックファイルと`contents/`のpnpmロックファイルを作る。
3. Worker、D1、R2の名前と結び付きを`wrangler.jsonc`へ定義する。
4. pnpmの保存先をリポジトリ外にし、リポジトリ内に`.pnpm-store`を作らない。

完了条件: `pnpm install`、型確認、lint、ビルドが成功し、リポジトリ内にパッケージ保存用ディレクトリが残らない。

### 8.4 記事と画像の移行

1. MarkdownをPortable Textへ変換する。
2. `seed/seed.json`と移行レポートを生成する。
3. 初期データファイルの形式をEmDash公式の検証機能で確認する。
4. ローカルのD1とR2へ初期データを登録する。
5. 元記事と移行後の記事を比較する。

完了条件: 全記事について、タイトル、概要、本文、タグ、公開日、slug、画像を比較でき、対応できない本文が警告なしに消えていない。

### 8.5 ローカル確認

1. `pnpm run dev`でAstroの公開面を確認する。
2. `pnpm run dev:cf`でWorker、D1、R2を使う実行を確認する。
3. 記事一覧、記事詳細、タグ、RSS、`llms.txt`、Markdown、OGP画像を確認する。
4. 管理画面で記事を編集して公開し、再ビルドなしに公開ページへ反映することを確認する。
5. 対象外のabout、privacy、contact、diagram、自己評価機能と旧URLが公開されていないことを確認する。

完了条件: ローカルで公開面と管理画面の動作が確認できる。

### 8.6 リモート環境への公開

リモートD1への初期データ登録、Cloudflareへのデプロイ、workers.devの確認は、明示的な承認後に行う。

リモート環境に既存データがある場合だけ、初期データ登録や削除の直前にD1とR2を退避する。空のリモート環境へ初回登録する場合、退避は行わない。退避はデータを移行する処理ではなく、元に戻すためのコピーである。

完了条件: 承認されたリモート環境で、記事、タグ、画像、管理画面の編集反映を確認できる。

## 9. 完了条件

- すべての記事がEmDashへ登録されている。
- タイトル、概要、本文、タグ、公開日、slug、画像を移行前後で確認できる。
- 記事一覧、記事詳細、タグ、RSS、`llms.txt`、Markdown、OGP画像が動作する。
- 管理画面で公開した記事が再ビルドなしで反映される。
- `emdash seed --validate`、`emdash doctor`、ビルド、型確認、lint、textlintが成功する。
- 公開処理と実行時処理が`contents/blog`を読まない。
- 対応できない本文と取得できない画像が、警告なしに消えていない。
- Cloudflareへの公開とリモートデータの確認は、明示的な承認後に完了する。

## 10. 公式資料

- [EmDashでブログを作成する](https://docs.emdashcms.com/guides/create-a-blog/)
- [EmDashのテーマを作成する](https://docs.emdashcms.com/themes/creating-themes/)
- [EmDashをCloudflareへデプロイする](https://docs.emdashcms.com/deployment/cloudflare/)
- [EmDashのseedファイル](https://docs.emdashcms.com/themes/seed-files/)
- [EmDashのコンテンツを取得する](https://docs.emdashcms.com/guides/querying-content/)
- [EmDash公式Cloudflareブログテーマ](https://github.com/emdash-cms/emdash/tree/main/templates/blog-cloudflare)
- [Cloudflare D1のエクスポート](https://developers.cloudflare.com/d1/reference/cli/export/)
- [Cloudflare R2のS3互換API](https://developers.cloudflare.com/r2/api/s3/api/)

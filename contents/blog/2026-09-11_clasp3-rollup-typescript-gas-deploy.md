---
title: clasp 3.x と rollup で TypeScript の Apps Script を公開する
slug: clasp3-rollup-typescript-gas-deploy
# TODO: 公開日は確定時に差し替える
date: 2026-09-11
modified_time: 2026-09-11
description: clasp 3.x は TypeScript を変換しません。Apps Script が呼び出せるのはスクリプト最上位の function 宣言だけなので、その形の JavaScript を自分で用意する必要があります。rollup の esm 出力と treeshake の設定、clasp 3.x のコマンドでウェブアプリを公開するまでの手順、CLI だけでは終わらなかった操作を書きます。
icon: 📦
icon_url: /icons/package_flat.svg
tags:
  - GAS
  - TypeScript
  - clasp
---

社内の書籍を貸し借りするウェブアプリを Google Apps Script で作りました。コードは TypeScript で書き、ローカルのエディタから clasp 3.4.1 で反映しています。

TypeScript のファイルをそのまま clasp で送っても動きません。clasp 3.x は TypeScript を変換しないため、変換は自分で用意します。用意するものは 3 つあります。rollup の `esm` 出力、`treeshake: false`、そしてエントリーポイントで何も `export` しない書き方です。

この記事に書くのは、その 3 つがそれぞれ何を解決しているのか、clasp 3.x のコマンドでウェブアプリを公開するまでの流れ、そして CLI だけでは終わらなかった操作です。

> [!NOTE]
> clasp 3.4.1、rollup 4.63.1、TypeScript 5.9.3、Apps Script の V8 ランタイムで確かめました。clasp 2.x はコマンド名が異なるため、この記事の `create-script` や `create-deployment`、`update-deployment` はそのまま使えません。情報は 2026 年 9 月 10 日時点のものです。

なお、この記事の題材にしたアプリの排他制御については[別の記事](/blog/gas-lockservice-exclusive-control)に書きました。

## clasp 3.x での TypeScript の扱い

先に Apps Script の側の制約を書きます。Apps Script が呼び出せるのは、スクリプトの最上位にある `function` 宣言だけです。`doGet`、時間主導型のトリガー、クライアントからの `google.script.run` は、いずれも最上位に置かれた名前を探します。関数がオブジェクトの中や即時実行関数の内側にあると、見つかりません。

TypeScript で書いたモジュールをそのまま送ると、この形になりません。`import` 文と `export` 文が残った状態のファイルは、Apps Script が構文エラーとして扱います。

clasp 3.x は、この変換を行いません。README の [Migrating from 2.x to 3.x](https://github.com/google/clasp/blob/master/README.md#migrating-from-2x-to-3x) に `Drop typescript support` という見出しで書かれています。

> Clasp no longer transpiles typescript code. For typescript projects, use typescript with a bundler like [Rollup](https://rollupjs.org/) to transform code prior to pushing with clasp.

ビルドで作るものは、これで決まりました。最上位に `function` 宣言が並び、`import` も `export` も残っていない 1 ファイルの JavaScript です。

## rollup の設定

引用にあった Rollup を使いました。インストールしたのは 3 つです。

```console
$ bun add -d rollup@4.63.1 rollup-plugin-typescript2@0.37.0 typescript@5.9.3
```

```js rollup.config.mjs
import { cpSync } from 'node:fs';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/main.ts',
  output: {
    dir: 'dist',
    format: 'esm',
  },
  // Apps Script から呼ばれる関数はコード上どこからも参照されず、有効にすると全部消える
  treeshake: false,
  plugins: [
    typescript({
      tsconfigOverride: { compilerOptions: { noEmit: false } },
    }),
    {
      name: 'copy-gas-files',
      writeBundle() {
        cpSync('src/appsscript.json', 'dist/appsscript.json');
        cpSync('src/index.html', 'dist/index.html');
      },
    },
  ],
};
```

`output.format` は `esm` です。Google が公開している参考リポジトリ [google/aside](https://github.com/google/aside) の [rollup.config.mjs](https://github.com/google/aside/blob/main/rollup.config.mjs) も同じ指定でした。rollup の `esm` 出力は、複数のモジュールを 1 つのスコープへ展開します。各モジュールの `export function` は、そのまま最上位の `function` 宣言になります。

`treeshake: false` の理由は、有効なままだと出力が空になることです。この指定を外してビルドしたところ、`dist/main.js` は 1 バイトになり、rollup が `(!) Generated an empty chunk` を出しました。`doGet` も `lendBook` も、コードのどこからも呼ばれていません。呼ぶのは Apps Script の側であり、rollup からその参照は見えません。

3 つ目は、エントリーポイントのファイルで何も `export` しないことです。`export` すると出力の末尾に `export { ... }` が残り、Apps Script が構文エラーにします。ここに書くのはモジュールの読み込みだけにしました。

```ts src/main.ts
// export すると出力に export 文が残り、Apps Script が構文エラーにする
import './books';
import './lending';
import './notify';
import './probe';
import './setup';
import { isAdmin, requireActiveUserEmail } from './user';

function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('書籍貸出')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
```

出力されたファイルでは、全モジュールの関数が最上位に並びます。

```js dist/main.js
function getSheet(name) { ... }
function lendBook(bookId) { ... }
function doGet() { ... }
```

rollup が `dist/` へ出力するのは JavaScript だけです。`appsscript.json` と `index.html` は `writeBundle` でコピーしました。後述する `create-script` が `dist/appsscript.json` を上書きしても、ビルドを通せばこのコピーで元に戻ります。

### rollup を選んだ理由

この構成にする前は esbuild を使っていました。esbuild でも同じ出力は作れましたが、関数を 1 つ追加するたびに手作業の登録が必要でした。

esbuild には、複数のモジュールを 1 つのスコープへ展開したうえで、その全体を関数で包まない出力形式がありません。`bundle: true` での選択肢は `iife` と `esm` と `cjs` で、`esm` は `export` 文を出します。`iife` を選ぶと関数が即時実行関数の内側に入るため、`globalName` で公開したオブジェクトへ委譲する `function` 宣言を、関数名の配列から生成して footer に並べていました。

この形では、関数を追加するたびに配列とエントリーポイントの `export` の 2 か所へ登録します。片方を忘れた状態でビルドと型チェックが通り、実行時に `TypeError: BookLending.probeStaleRead is not a function` で気づきました。rollup の構成なら、この登録はどちらも要りません。

## clasp 3.x での公開手順

スクリプトの作成からウェブアプリの公開までに使ったコマンドは 4 つです。

```console
$ bunx clasp create-script --type webapp --title "書籍貸出" --rootDir dist
$ bun run build && bunx clasp push --force
$ bunx clasp create-version "初回"
$ bunx clasp create-deployment --versionNumber 1 --description "v1"
```

`create-script` は、作成の直後に `rootDir` へ既定のマニフェストを書き出します。自分で用意した `appsscript.json` は、これで上書きされました。push の前に必ずビルドを通す形（`"push": "bun run build && clasp push --force"`）にしておくと、上書きされた状態のまま送らずに済みます。

ウェブアプリの実行者と公開範囲は、`appsscript.json` の `webapp` に書きます。

```json src/appsscript.json
{
  "timeZone": "Asia/Tokyo",
  "runtimeVersion": "V8",
  "exceptionLogging": "STACKDRIVER",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/script.send_mail",
    "https://www.googleapis.com/auth/script.scriptapp"
  ],
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "MYSELF"
  }
}
```

`create-deployment` を実行しただけで、「デプロイを管理」の画面には次の表示が入っていました。画面での操作は一度もしていません。

```
次のユーザーとして実行: 自分（<デプロイした本人のアドレス>）
アクセスできるユーザー: 自分のみ
```

<!-- TODO(media): スクリーンショットを入れる。「デプロイを管理」で作成済みのデプロイを開いた状態を写す。読者が確認するのは、手作業なしで executeAs と access がマニフェストどおりになっていること。代替テキスト: Apps Script のデプロイ詳細画面。ウェブアプリの URL の下に「次のユーザーとして実行: 自分」「アクセスできるユーザー: 自分のみ」と表示されている -->

> [!WARNING]
> `access` を `ANYONE_ANONYMOUS` にすると、Google アカウントへのログイン無しで誰でも開ける状態が、CLI の実行だけで作られます。画面での確認は入りません。`appsscript.json` の差分は、push の前に必ず確認します。

公開した後に中身を差し替えるときは、コマンドを使い分けます。`create-deployment` が発行するのは新しいデプロイ ID で、`/exec` の URL も変わります。同じ ID のまま参照するバージョンだけを切り替えるのが `update-deployment` です。

```console
$ bunx clasp create-version "エラー表示の修正"
Created version 2

$ bunx clasp update-deployment <deploymentId> --versionNumber 2 --description "v2"
Redeployed <deploymentId> @2
```

利用者へ URL を渡した後の更新には `update-deployment` を使いました。clasp 2.x の `clasp deploy -i <id>` に相当するのがこちらです。

## CLI で完結しなかった操作

公開までは CLI で進められましたが、初期データのセットアップはエディタでの手作業になりました。

スプレッドシートを作る `setupSpreadsheet` は 1 回だけ実行する関数です。`clasp run-function` で呼ぶつもりでしたが、失敗しました。

```console
$ bunx clasp run-function setupSpreadsheet
Exception: We're sorry, a server error occurred while reading from storage. Error code NOT_FOUND. []
```

バージョンとデプロイを作ってから再実行しても、返るメッセージは同じでした。原因は、[docs/run.md](https://github.com/google/clasp/blob/master/docs/run.md) の `Prerequisites` に並んだ 5 つを満たしていないことでした。

1. Google Cloud プロジェクトを作り、`.clasp.json` に `projectId` を書く
2. 種類が Desktop Application の OAuth クライアント ID を作り、`client_secret.json` として保存する
3. `clasp login --creds client_secret.json --user <key>` で認可する
4. `appsscript.json` に `"executionApi": { "access": "ANYONE" }` を追加する
5. API 実行可能としてデプロイする

同じページの `Setup Instructions` には、これに加えて Apps Script エディタの Project Settings で Cloud プロジェクトの番号を設定する操作と、`appsscript.json` のスコープで認可するための `clasp login --use-project-scopes` が並んでいます。1 回だけ実行するセットアップ関数のためにこれらを揃える理由は無いため、エディタから手動で実行する方針にしました。この判断により、コードの書き方に 2 つの配慮が必要になりました。

1 つ目は、1 回だけ実行する関数を、2 回実行しても既存のデータを壊さない形にすることです。エディタからの手作業では、実行済みかどうかの記録がどこにも残りません。

```ts src/setup.ts
export function setupSpreadsheet(): string {
  const properties = PropertiesService.getScriptProperties();
  const existing = properties.getProperty(SPREADSHEET_ID_PROPERTY);
  if (existing) {
    throw new Error(`すでに ${existing} が設定されています`);
  }

  const spreadsheet = SpreadsheetApp.create('書籍貸出データ');
  // ...（3 シートとヘッダー行の作成は省略）
  properties.setProperty(SPREADSHEET_ID_PROPERTY, spreadsheet.getId());
  return spreadsheet.getUrl();
}
```

実際に 2 回実行して、このガードに当たりました。既存のスプレッドシートは作り直されていません。

```
Error: すでに <スプレッドシートの ID> が設定されています
```

2 つ目は、結果を `console.log` に出すことです。エディタから実行した関数の戻り値は、実行ログに現れません。結果を `return` するだけだった最初の `probeDoubleLend` を実行したとき、ログは 2 行でした。

```
22:36:50 お知らせ 実行開始
22:36:54 お知らせ 実行完了
```

`console.log` の呼び出しを入れると、結果がログに出るようになりました。

clasp には MCP サーバ（`clasp start-mcp-server`）も付属しています。ただし 3.4.1 で登録されているツールは `push_files` / `pull_files` / `create_project` / `clone_project` / `list_projects` の 5 つで、バージョンの作成とデプロイは含まれません。

## まとめ

- clasp 3.x は TypeScript を変換しない。README の Migrating from 2.x to 3.x に `Drop typescript support` として書かれている
- Apps Script が呼び出せるのはスクリプト最上位の `function` 宣言だけなので、ビルドの出力は最上位に `function` 宣言が並ぶ 1 ファイルの JavaScript にする
- rollup では `output.format` に `esm` を指定する。`treeshake` を有効にすると、Apps Script から呼ばれる関数がどこからも参照されていないため出力が空になる
- エントリーポイントのファイルで `export` すると、出力に `export` 文が残って Apps Script が構文エラーにする
- `create-script` は `rootDir` の `appsscript.json` を上書きする。push の前にビルドを通す形にして、自分のマニフェストへ戻す
- 公開後の差し替えは `update-deployment` を使う。`create-deployment` は新しいデプロイ ID と `/exec` の URL を発行する
- `clasp run-function` は Google Cloud プロジェクトと OAuth クライアント ID の用意が前提になる。1 回だけ実行する関数はエディタから呼ぶ方針にした

## 参考

- [google/clasp](https://github.com/google/clasp)
- [clasp docs/run.md](https://github.com/google/clasp/blob/master/docs/run.md)
- [google/aside](https://github.com/google/aside)
- [Manifests | Apps Script](https://developers.google.com/apps-script/concepts/manifests)
- [Web Apps | Apps Script](https://developers.google.com/apps-script/guides/web)
- [Tree Shaking | Rollup](https://rollupjs.org/configuration-options/#treeshake)

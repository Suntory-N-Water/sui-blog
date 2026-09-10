---
title: GAS の排他制御は LockService を呼ぶだけでは足りない
slug: gas-lockservice-exclusive-control
date: 2026-09-10
modified_time: 2026-09-10
description: スプレッドシートを保存先にした Google Apps Script のウェブアプリを作り、同じ行を同時に更新する操作を止めようとしました。LockService でロックを取っても、ロックの外で読んだ状態を使うと二重の更新が通ります。実際に競合を起こして観測した結果と、clasp 3.x で公開するまでの手順を書きます。
icon: 🎫
icon_url: /icons/ticket_flat.svg
tags:
  - GAS
  - TypeScript
  - clasp
---

社内の書籍を貸し借りするウェブアプリを、Google Apps Script とスプレッドシートで作りました。1 冊の本を同時に 2 人が借りられては困るので、`LockService.getScriptLock()` で排他制御を組み込みます。ここまでは GAS の一般的なやり方です。

しかし、ロックの取得と解放を書くだけでは二重更新を防げませんでした。排他制御を確実に機能させる鍵は、貸出可能かどうかの判定に使う値を、ロックを取得した後にシートから読み直す点にあります。ロックの外で読んだ古い状態を使ってしまうと、ロックを取得していても二重の登録がすり抜けます。

この記事では、書籍貸出アプリを題材に、ロックの外側で状態を読んだ場合に起きる競合の観測結果と、二重更新を確実に止めるコードの書き方を検証ログとともに解説します。本題の排他制御に入る前に、競合が起こるデータ構造と、TypeScript を動かすためのビルド環境を先に整理したうえで、clasp 3.x によるデプロイ手順までをまとめます。

> [!NOTE]
> Apps Script でウェブアプリや排他制御を実装しており、clasp 3.x でのローカル開発・デプロイを行うプロジェクトを対象にしています。検証に使った環境は clasp 3.4.1、V8 ランタイム、rollup 4.63.1 です。

## 作ったもの

排他制御を検証する題材として作った書籍貸出アプリは、3 つの画面要素で構成されています。自分が借りている本の一覧、蔵書の一覧と絞り込み、管理者だけに表示される登録フォームです。競合が起こる箇所を特定しやすくするため、まずは画面構成とスプレッドシートの構造から整理します。データの保存先はスプレッドシート 1 つで、`books` / `loans` / `config` の 3 シートに分けました。

<!-- TODO(media): スクリーンショットを入れる。/exec を開いた直後のウェブアプリ全体を写す。読者が観測するのは、蔵書の表に「在架」と「貸出中」が並び、管理者のアカウントでは登録フォームが表示されること。代替テキスト: 書籍貸出アプリの画面。自分が借りている本、蔵書の一覧、蔵書の登録フォームが縦に並んでいる -->

スクリプトは、どのスプレッドシートにも属さないスタンドアロン型です。対象のスプレッドシートの ID は、`config` シートではなくスクリプトプロパティに置きました。`config` を読むにはスプレッドシートを開く必要があり、そのために ID が要るので、`config` に ID を書くと参照が循環します。

```ts src/sheet.ts
export const SPREADSHEET_ID_PROPERTY = 'SPREADSHEET_ID';

let cachedSpreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet | undefined;

export function openSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
  if (cachedSpreadsheet) {
    return cachedSpreadsheet;
  }
  const id = PropertiesService.getScriptProperties().getProperty(
    SPREADSHEET_ID_PROPERTY,
  );
  if (!id) {
    throw new Error(
      `スクリプトプロパティ ${SPREADSHEET_ID_PROPERTY} が設定されていません`,
    );
  }
  cachedSpreadsheet = SpreadsheetApp.openById(id);
  return cachedSpreadsheet;
}
```

`openById()` を使うため、`appsscript.json` の `oauthScopes` に指定したスコープは `https://www.googleapis.com/auth/spreadsheets` です。スタンドアロンスクリプトには対象のスプレッドシートが決まっていないため、`spreadsheets.currentonly` ではなく `spreadsheets` を指定しました（`currentonly` に変更して失敗するかまでは確かめていません）。

## TypeScript を Apps Script から呼べる形にする

このアプリは TypeScript で書いていますが、コードをそのまま Apps Script へ反映しても動きません。clasp 3.x は TypeScript を変換しないためです。README の [Migrating from 2.x to 3.x](https://github.com/google/clasp/blob/master/README.md#migrating-from-2x-to-3x) に、`Drop typescript support` という見出しで書かれています。

> Clasp no longer transpiles typescript code. For typescript projects, use typescript with a bundler like [Rollup](https://rollupjs.org/) to transform code prior to pushing with clasp.

引用にある Rollup を使いました。Google が公開している参考リポジトリ [google/aside](https://github.com/google/aside) の [rollup.config.mjs](https://github.com/google/aside/blob/main/rollup.config.mjs) も、`output.format` に `esm` を指定しています。

Apps Script はスクリプトの最上位にある `function` 宣言しか呼び出せない制約があるため、この形式を選びました。`doGet` もトリガーも `google.script.run` も、最上位にない関数は見つけられません。rollup の `esm` 出力は、複数のモジュールを 1 つのスコープへ展開します。各モジュールの `export function` は、そのまま最上位の `function` 宣言になります。

```js rollup.config.mjs
export default {
  input: 'src/main.ts',
  output: {
    dir: 'dist',
    format: 'esm',
  },
  // Apps Script から呼ばれる関数はコード上どこからも参照されず、有効にすると全部消える
  treeshake: false,
  plugins: [
    typescript({ tsconfigOverride: { compilerOptions: { noEmit: false } } }),
  ],
};
```

`treeshake: false` を外すと、出力は 1 バイトになりました。rollup は `(!) Generated an empty chunk` を出します。`doGet` も `lendBook` も、コードのどこからも呼ばれていないためです。呼ぶのは Apps Script の側であって、rollup からは参照が見えません。

もう 1 つ、エントリーポイントのファイルでは何も `export` しません。`export` すると出力の末尾に `export { ... }` が残り、Apps Script が構文エラーにします。書くのはモジュールの読み込みだけです。

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

出力されたファイルには、全モジュールの関数が最上位に並びます。

```js dist/main.js
function getSheet(name) { ... }
function lendBook(bookId) { ... }
function doGet() { ... }
```

この構成にする前は esbuild を使っていました。esbuild には「1 つのスコープへ平らに展開して、包まない」出力形式がありません。`bundle: true` での選択肢は `iife` と `esm` と `cjs` で、`esm` は `export` 文を出します。`iife` を選ぶと関数が即時実行関数の内側に入るので、`globalName` で公開したオブジェクトへ委譲する `function` 宣言を、関数名の配列から生成して footer に並べていました。関数を 1 つ足すたびに、配列とエントリーポイントの `export` の 2 か所へ登録します。片方を忘れてビルドと型チェックを通し、実行時に `TypeError: BookLending.probeStaleRead is not a function` で気づきました。rollup の構成では、この登録がどちらも要りません。

## LockService による排他制御と、状態を読む位置

アプリの構造とビルド環境が整ったところで、本題である排他制御に入ります。貸出の処理では、スプレッドシートへの書き込みが 2 か所あります。1 つは `loans` への 1 行の追加、もう 1 つは `books` の該当行の `status` を `lent` にする更新です。この 2 つの間に別の実行が割り込むと、1 冊の本に 2 つの貸出記録が付きます。

スタンドアロンスクリプトなので、使えるのはスクリプトロックです。[リファレンス](https://developers.google.com/apps-script/reference/lock/lock-service)には、`getDocumentLock()` が `null` を返す条件として `if called from a standalone script or webapp` と書かれています。`getScriptLock()` のほうは `prevents any user from concurrently running a section of code` と説明されており、利用者が誰であっても 1 つの実行しか通しません。

ロックの取得と解放は関数にまとめました。

```ts src/lending.ts
const LOCK_TIMEOUT_MS = 10_000;

/** ロックの中でしか呼ばない。ロック取得前に読んだ status は他の実行に書き換えられている可能性がある */
function withScriptLock<T>(action: () => T): T {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_TIMEOUT_MS)) {
    throw new Error('混み合っています。しばらくしてからもう一度お試しください');
  }
  try {
    return action();
  } finally {
    lock.releaseLock();
  }
}
```

ただし、この関数を用意しただけでは二重の更新を防げません。成否を分けるのは、`lendBook` が状態を読み出すタイミングです。

```ts src/lending.ts
function commitLoan(
  target: { rowNumber: number; book: Book },
  email: string,
): Loan {
  const { rowNumber, book } = target;
  if (book.status === 'retired') {
    throw new Error('この本は除籍されています');
  }
  if (book.status === 'lent') {
    throw new Error('この本はすでに貸出中です');
  }
  // ...（貸出上限の判定、loans への追加、books.status の更新は省略）
  getSheet(SHEET.books).getRange(rowNumber, BOOKS_COL.status).setValue('lent');
  SpreadsheetApp.flush();
  return loan;
}

export function lendBook(bookId: string): Loan {
  const email = requireActiveUserEmail();
  return withScriptLock(() => commitLoan(findBookRow(bookId), email));
}
```

`findBookRow` の呼び出しがコールバックの中にあります。行番号と `status` を、ロックを取得した後の 1 回の `getValues()` から取っているためです。

あわせて、スプレッドシートの更新（`setValue`）の直後に `SpreadsheetApp.flush()` を呼んでいる点も欠かせません。GAS のシート書き込みは内部でバッファリングされるため、ロックを解放する前に変更を確定させておかないと、次にロックを取得した別の実行が古い状態を読み取ってしまう恐れがあります。

### 同じ本を続けて 2 回借りる

在架の本を 1 冊選び、`lendBook` を続けて 2 回呼ぶ `probeDoubleLend` を書いて、エディタから実行しました。

```
22:37:50 情報 対象: プラチナデータ (c1a6b626-48e9-420b-9bca-d288c8240436)
22:37:50 情報 1 回目: 成功 loanId=5f8e0eba-4e5f-41cd-88a0-0dccfcb83ef0
22:37:50 情報 2 回目: 失敗 この本はすでに貸出中です
```

`loans` に増えた未返却の行は 1 行で、`books.status` は `lent` になりました。2 回目が拒否された理由は、`findBookRow` が読み直した `status` が `lent` だったためです。この 2 つの呼び出しは同じ実行の中で連続して行われたもので、別々の実行が同時に入った状態ではありません。

### 状態を読む位置をロックの外へ出す

正常に拒否できた理由は、`findBookRow` がロックの内側にあるためです。では、同じ処理で読む位置だけをロックの外へ出すとどうなるでしょうか。`lendBook` との違いが `findBookRow` の位置だけになる関数を用意しました。

```ts src/lending.ts
export function lendBookReadingOutsideLock(
  bookId: string,
  beforeLock: () => void,
): Loan {
  const email = requireActiveUserEmail();
  const target = findBookRow(bookId);
  beforeLock();
  return withScriptLock(() => commitLoan(target, email));
}
```

この書き方で二重の登録が起きるのは、状態を読んでからロックを取るまでの間に、別の実行が同じ本の貸出を終えたときだけです。ブラウザで 2 つのタブを同時に操作しても、その順序になるとは限りません。そこで `beforeLock` に `lendBook` を渡し、順序を 1 回の実行の中で固定しました。

```ts src/probe.ts
lendBookReadingOutsideLock(target.bookId, () => {
  const interrupting = lendBook(target.bookId);
  results.push(`割り込んだ貸出: 成功 loanId=${interrupting.loanId}`);
});
```

エディタから実行したログです。

```
20:40:38 情報 対象: プラチナデータ (c1a6b626-48e9-420b-9bca-d288c8240436)
20:40:38 情報 割り込んだ貸出: 成功 loanId=f7112ddc-57d8-46b3-a6c6-9a94f5ba2437
20:40:38 情報 ロックの外で読んだ値による貸出: 成功 loanId=cc8e5531-a35c-4ea1-ace7-63a43a579aa7
20:40:38 情報 c1a6b626-48e9-420b-9bca-d288c8240436 の未返却の行: 2 行
```

2 件目の書き込みは `withScriptLock` の中で行われています。ロックの取得は成功していました。それでも更新が通った原因は、`commitLoan` が判定に使う `book.status` が、ロックを取る前に読んだ `available` のままだった点にあります。1 冊の本に、未返却の貸出が 2 行残りました。

### ロックを持っている実行がある間に借りる

ブラウザのクリックでは、2 つの実行を同じ瞬間に始められません。そこで、スクリプトロックを 20 秒保持するだけの関数を用意しました。

```ts src/probe.ts
const LOCK_HOLD_MS = 20_000;

export function holdScriptLock(): string {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1_000)) {
    throw new Error('ロックを取得できませんでした');
  }
  const startedAt = new Date().toISOString();
  try {
    Utilities.sleep(LOCK_HOLD_MS);
  } finally {
    lock.releaseLock();
  }
  const message = `${startedAt} から ${LOCK_HOLD_MS} ミリ秒ロックを保持しました`;
  console.log(message);
  return message;
}
```

これをエディタから実行し、保持している間にウェブアプリで「借りる」を押します。ボタンは 10 秒ほど「通信中です」の表示のまま待たされた後、次のメッセージで失敗しました。

<!-- TODO(media): スクリーンショットを入れる。holdScriptLock の実行中に「借りる」を押した直後のウェブアプリを写す。読者が観測するのは、赤字のエラーメッセージが出ている一方で蔵書の状態が「在架」のままであること。代替テキスト: 画面上部に「混み合っています。しばらくしてからもう一度お試しください」と赤字で表示され、蔵書の表の状態欄は「在架」のままになっている -->

```
混み合っています。しばらくしてからもう一度お試しください
```

`LockService.getScriptLock()` は実行をまたいで共有されます。エディタからの実行がロックを保持している間、ウェブアプリからの実行は同じロックの解放を待ちました。`tryLock(10_000)` は 10 秒待っても取得できず、`withScriptLock` が例外を投げています。蔵書の状態は「在架」のまま、「自分が借りている本」も空でした。`appendRow` と `setValue` はどちらもロックの中にしかないため、書き込みは 1 回も実行されていません。

観測したのは、先にロックを持っている実行がある間に貸出を試した場合の挙動です。同じ瞬間に 2 つの実行を始める手段は用意できませんでしたが、待たされた側が待機時間を超えたときに書き込みへ進まないことは、この条件で確認できます。

なお、画面に出た文字列には `Error: ` という前置きが付いていました。サーバ側で投げた文言は「混み合っています。しばらくしてからもう一度お試しください」だけです。`google.script.run` の `withFailureHandler` に渡るオブジェクトの `message` には、サーバの例外の文字列表現がそのまま入ります。利用者に見せる文字列としては不要なので、クライアント側で落としました。

```js src/index.html
google.script.run
  .withSuccessHandler(resolve)
  .withFailureHandler((error) =>
    reject(new Error(error.message.replace(/^Error:\s*/, ''))),
  )
  [name](...args);
```

## clasp 3.x で公開する

排他制御の挙動を確認できたので、このアプリをウェブアプリとして公開します。作成から公開までの流れは 4 つのコマンドにまとまります。

```console
$ bunx clasp create-script --type webapp --title "書籍貸出" --rootDir dist
$ bun run build && bunx clasp push --force
$ bunx clasp create-version "初回"
$ bunx clasp create-deployment --versionNumber 1 --description "v1"
```

`create-script` は、作成の直後に `rootDir` へ既定のマニフェストを書き出します。自分で用意した `appsscript.json` は、これで上書きされました。push の前に必ずビルドを通す形（`"push": "bun run build && clasp push --force"`）にしておくと、上書きされた状態のまま送らずに済みます。

ウェブアプリの実行者と公開範囲は、`appsscript.json` の `webapp` だけで決まります。

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

<!-- TODO(media): スクリーンショットを入れる。「デプロイを管理」で作成済みのデプロイを開いた状態を写す。読者が観測するのは、手作業なしで executeAs と access がマニフェストどおりになっていること。代替テキスト: Apps Script のデプロイ詳細画面。ウェブアプリの URL の下に「次のユーザーとして実行: 自分」「アクセスできるユーザー: 自分のみ」と表示されている -->

> [!WARNING]
> `access` を `ANYONE_ANONYMOUS` にすると、Google アカウントへのログイン無しで誰でも開ける状態が、CLI の実行だけで作られます。画面での確認は入りません。誤って全体公開される事故を防ぐためにも、`appsscript.json` の差分確認は必須のチェック項目になります。

公開した後に中身を差し替えるときは、コマンドを使い分けます。`create-deployment` が発行するのは新しいデプロイ ID で、`/exec` の URL も変わります。同じ ID のまま参照するバージョンだけを切り替えるのが `update-deployment` です。

```console
$ bunx clasp create-version "エラー表示の修正"
Created version 2

$ bunx clasp update-deployment <deploymentId> --versionNumber 2 --description "v2"
Redeployed <deploymentId> @2
```

利用者へ URL を渡した後の更新には `update-deployment` を使います。clasp 2.x の `clasp deploy -i <id>` に相当するのがこちらです。

## CLI で完結しなかった操作

公開まで進められましたが、初期データのセットアップなど、CLI だけでは完結しなかった操作がありました。

スプレッドシートを作る `setupSpreadsheet` は 1 回だけ実行する関数です。`clasp run-function` で呼ぶつもりでしたが、失敗しました。

```console
$ bunx clasp run-function setupSpreadsheet
Exception: We're sorry, a server error occurred while reading from storage. Error code NOT_FOUND. []
```

バージョンとデプロイを作ってから再実行しても、同じメッセージが返却されます。原因は、[docs/run.md](https://github.com/google/clasp/blob/master/docs/run.md) の `Prerequisites` に並んだ 5 つを満たしていないことでした。

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

2 つ目は、結果を `console.log` に出すことです。エディタから実行した関数の戻り値は、実行ログに現れません。結果を `return` するだけだった最初の `probeDoubleLend` を実行したとき、ログは 2 行だけでした。

```
22:36:50 お知らせ 実行開始
22:36:54 お知らせ 実行完了
```

`console.log` を足して初めて中身が読めます。上に載せた 3 行のログは、この修正の後のものです。

なお、clasp には MCP サーバ（`clasp start-mcp-server`）も付属しています。ただし 3.4.1 の実装に登録されているツールは `push_files` / `pull_files` / `create_project` / `clone_project` / `list_projects` の 5 つで、バージョンの作成とデプロイは含まれません。この記事で使った操作のうち MCP ツールでカバーできるのは `create-script` と `push` のみであり、`create-version` や `create-deployment`、`update-deployment` は Bash から直接 `clasp` コマンドを実行して進めることになります。

## まとめ

- `LockService.getScriptLock()` でロックを取得するだけでは、二重の更新は止まらない。ロック取得後にスプレッドシートを読み直して判定し、更新直後に `SpreadsheetApp.flush()` で確定させる
- スクリプトロックは実行をまたいで共有される。待機時間を超えた側は例外になり、書き込みには進まない
- ウェブアプリの実行者と公開範囲は `appsscript.json` の `webapp` だけで決まる。CLI の実行だけで公開範囲が変わるため、差分の確認を必須にする
- 公開済みの `/exec` の URL を保ったまま中身を差し替えるのは `update-deployment`。`create-deployment` はデプロイ ID が新しくなり、URL も変わる
- clasp 3.x は TypeScript を変換しない。rollup の `format: 'esm'` は全モジュールを 1 つのスコープへ展開するので、各関数がそのまま最上位の `function` 宣言になる。`treeshake: false` とエントリーポイントでの `export` の禁止が要る
- `clasp run-function` の 5 つの前提を揃えないなら、実行はエディタからの手作業になる。1 回だけ実行する関数は 2 回実行しても壊れない形にし、結果は `console.log` に出す

## 参考

- [LockService | Apps Script](https://developers.google.com/apps-script/reference/lock/lock-service)
- [Web Apps | Apps Script](https://developers.google.com/apps-script/guides/web)
- [V8 Runtime Overview | Apps Script](https://developers.google.com/apps-script/guides/v8-runtime)
- [google/clasp README](https://github.com/google/clasp/blob/master/README.md)
- [google/aside](https://github.com/google/aside)
- [clasp docs/run.md](https://github.com/google/clasp/blob/master/docs/run.md)
- [GAS + Typescript のいい感じのビルド環境を整える](https://zenn.dev/terass_dev/articles/a39ab8d0128eb1)
- [Google Apps Script、意外と簡単に始められること知ってましたか？](https://suntory-n-water.com/blog/did-you-know-you-can-easily)

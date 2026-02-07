---
title: GASを使うと社内だけで使えるWebサイトが簡単に作れるの知ってました？
slug: did-you-know-you-can-easily
date: 2025-11-03
modified_time: 2025-11-03
description: Google Apps Script(GAS)を使うと社内限定で使えるWebアプリケーションを簡単に構築できます。claspとTypeScriptを使ってGoogleDriveのファイルを検索するアプリケーションを作成します。
icon: 👀
icon_url: /icons/eyes_flat.svg
tags:
  - TypeScript
  - GAS
  - GoogleAppScript
  - clasp
diagram:
  - type: hero
    date: "2025-11-03"
    title: "GASを使うと社内だけで使えるWebサイトが簡単に作れるの知ってました？"
    subtitle: "claspとTypeScriptで構築する、サーバー不要・認証基盤不要の社内限定アプリケーション開発ガイド"
  - type: problem
    variant: simple
    icon: lock
    title: "社内ツール開発の「壁」"
    introText: "便利なツールを作りたいが、社内への安全な配布や環境構築には意外なコストがかかります。"
    cards:
      - icon: server
        title: "インフラ構築"
        subtitle: "サーバーとドメイン"
        description: "社内ツールのためだけにサーバーを立てドメインを取得するのは過剰コストになりがち。"
        isHighlight: false
      - icon: shieldAlert
        title: "認証機能の実装"
        subtitle: "セキュリティの懸念"
        description: "社員だけがアクセスできる認証基盤を自前で実装するのは、工数もリスクも大きい。"
        isHighlight: true
        accentColor: RED
      - icon: refreshCcw
        title: "配布と更新"
        subtitle: "運用の手間"
        description: "修正のたびにファイルを配布し直したり、利用者の環境設定を行うのは大変。"
        isHighlight: false
  - type: transition
  - type: core_message
    variant: highlight
    icon: building
    title: "GASなら「社内限定」が即座に実現"
    mainMessage: "Google Workspaceの認証基盤をそのまま利用可能。サーバー構築もドメイン取得も不要で、特定のドメインメンバーだけにアクセスを許可したWebアプリを公開できます。"
    comparisons:
      - icon: alertTriangle
        title: "自前で開発する場合"
        text: "認証実装に工数がかかり、セキュリティホールを作るリスクがある。"
        isGood: false
      - icon: checkCircle
        title: "GASを利用する場合"
        text: "設定一つでGoogleの堅牢な認証基盤を利用し、ドメイン内限定公開が可能。"
        isGood: true
    coreHighlight:
      title: "インフラ不要の限定公開"
      text: "Googleの堅牢な認証基盤に乗っかるだけで、セキュアな社内ツールが完成します。"
      accentColor: GOLD
  - type: steps
    title: "モダンな開発から公開までの流れ"
    introText: "claspとVS Codeを使い、効率的に開発して社内限定でデプロイするまでのステップです。"
    steps:
      - number: 1
        title: "環境構築"
        text: "claspとTypeScriptテンプレートを導入"
        detailText: "モダンな開発環境をセットアップし、型安全性を確保します。"
      - number: 2
        title: "実装"
        text: "VS Codeでコーディング"
        detailText: "使い慣れたエディタとAI支援を活用し、Drive連携などを実装。"
      - number: 3
        title: "デプロイ"
        text: "コマンド一つで反映"
        detailText: "clasp pushコマンドを実行するだけで、コードがGAS上に反映されます。"
      - number: 4
        title: "限定公開設定"
        text: "アクセス権限をドメイン内に制限"
        detailText: "デプロイ設定で「アクセスできるユーザー」を自分たちの組織のみに設定。"
  - type: grouped_content
    title: "実運用に向けた考慮事項"
    introText: "社内ツールとして安全に運用するために必要なセキュリティ設定と、モダン開発のメリットです。"
    icon: shieldCheck
    sectionBgColor: muted
    groups:
      - title: "セキュリティの鉄則"
        description: "社内データを取り扱うため、権限設定には細心の注意が必要です。"
        bgColor: white
        isHighlight: true
        cards:
          - title: "権限は最小限に"
            text: "読み取り専用(readonly)など、必要最低限のスコープを設定します。"
            isHighlight: false
            bgColor: muted
          - title: "公開範囲の確認"
            text: "「全員(ANYONE)」ではなく必ず「ドメイン内」を選択します。"
            isHighlight: true
            accentColor: RED
            bgColor: white
      - title: "モダン開発の恩恵"
        description: "GASエディタではなくローカル環境で開発するメリットです。"
        bgColor: white
        isHighlight: false
        cards:
          - title: "VS Code活用"
            text: "豊富な拡張機能やキーボードショートカットを活用できます。"
            isHighlight: false
            bgColor: muted
          - title: "AIとの協業"
            text: "Claude CodeなどのAIエージェントと連携し生産性を向上できます。"
            isHighlight: false
            bgColor: muted
  - type: action
    title: "身近な課題を技術で解決しよう"
    mainText: "サーバーレスで手軽に、しかし強力な社内ツールが作れます。あなたのアイデアで業務効率化を始めましょう。"
    actionStepsTitle: "次のステップ"
    actionSteps:
      - title: "環境準備"
        description: "claspとテンプレートを導入し、ローカル開発環境を整える"
      - title: "開発開始"
        description: "DriveやGmailと連携する、小さな便利ツールを作ってみる"
    pointText: "インフラの悩みを捨てて、課題解決という本質的な開発に集中できます。"
    footerText: "小さなツールから業務改善を始めよう"
    subFooterText: "sui Tech Blog"
    accentColor: GOLD
---

## はじめに

2025 年 11 月現在、Gemini を使用して Google Slides を作成する「まじん式」プロンプトが話題です。

https://note.com/majin_108/n/n11fc2f2190e9

こちらの記事で初めて知りましたが、どうやら Google Apps Script(GAS)を使うと、社内限定で使える Web アプリケーションを簡単に構築できるそうです。
GAS 自体は使ったことはありますが、Web アプリケーションを作ったことはありませんでした。
本記事では、**実践的なサンプルプロジェクトとして**GoogleDrive にあるファイルを検索するアプリケーション(Drive 検索ビューア)を構築していきます。
開発には clasp と TypeScript を使用します。clasp は Command Line Apps Script Projects の略称で、Apps Script プロジェクトをローカルで開発できる OSS です。

https://github.com/google/clasp

また、従来の GAS エディタではなく、使い慣れた VS Code で開発を進めていきます。
GAS エディタでは困難だった Claude Code などの AI エージェントを組み合わせることで、モダンな開発環境で GAS 製の Web アプリケーションを作成していきましょう。

### この記事の対象読者

- GAS は使ったことがあるが、clasp は未経験の方
- 社内ツール開発の選択肢を広げたい方

## 構築するアプリの概要

今回構築する「Drive 検索ビューア」は、Google Drive 内のファイルをキーワード検索し、結果を一覧表示するシンプルな Web アプリです。
このアプリの特徴は、**社内ドメイン限定で公開できる**点です。Google Workspace を利用している企業であれば、追加のインフラ構築なしで社内向けの Web ツールを提供できます。

本プロジェクトでは以下のサンプルリポジトリを元に作成しています。

https://github.com/cristobalgvera/ez-clasp

サンプルプロジェクトを作成後、少し設定をいじった状態の branch がこちらです。

https://github.com/Suntory-N-Water/clasp-gas-webapp-demo/tree/init

作成したすべてのコードはこちらです。

https://github.com/Suntory-N-Water/clasp-gas-webapp-demo

## なぜclaspを使うのか

従来の GAS エディタでも開発は可能です。しかし、clasp を使うことで以下のメリットがあります。

1 つ目は使い慣れた開発環境で開発ができるという点です。いつも使っている VS Code などのエディタで開発できるため、拡張機能やキーボードショートカットをそのまま活用できます。
GAS は手軽に開発が可能なのが長所だと思っていますが、逆に言えばエディタが普段使わないもので開発するため、普段から開発しているエンジニアにとっては少しとっつきづらい印象です…
(余談ですが、この現象は Excel VBA などにもいえるかと思います)
特に 2025 年 11 月現在では Claude Code などの AI エージェントを用いた開発が主流となっているため、生成 AI と共に開発を行うことは生産性向上には欠かせないです。

2 つ目は TypeScript による型安全性が担保されている点です。`@types/google-apps-script` により、`DriveApp` や `HtmlService` などの API に対して型補完が効きます。API の使い方を調べる時間が削減され、コンパイル時に型エラーを検出できます。
JavaScript(ないしは GAS)でも開発は可能ですが、やはり型があることによる恩恵は言うまでもないでしょう。

## 開発環境のセットアップ

### テンプレートプロジェクトの準備

先述した通り、EZ CLASP というテンプレートを使用します。このテンプレートは、TypeScript の型補完、自動テスト、コードフォーマットなど、モダンな開発環境が整っています。

```bash
## テンプレートを使用してプロジェクト作成
pnpx tiged cristobalgvera/ez-clasp clasp-gas-webapp-demo
cd clasp-gas-webapp-demo

## Git初期化とパッケージインストール
git init
pnpm install

## claspにログイン
pnpm clasp:login
```

`pnpm clasp:login` を実行すると、ブラウザが開いて Google アカウントの認証を求められます。認証を完了すると、ローカル環境から GAS プロジェクトを操作できるようになります。
認証後の情報は `~/.clasprc.json` に保存されます(誤っても git 管理はしないように)。

### GASプロジェクトの作成

clasp コマンドで Web アプリ用の GAS プロジェクトを作成します。

```bash
pnpm clasp:create
```

スクリプトの種類を選択するプロンプトが表示されるため、「webapp」を選択してください。
ここで表示されている URL は基本的に作成したユーザーしかコードの編集ができないため、公開しても問題ありません。

```bash
pnpm clasp:create

> clasp-gas-webapp-demo@0.0.5 clasp:create /Users/{user_name}/dev/clasp-gas-webapp-demo
> rimraf .clasp.json && clasp create --rootDir . --title clasp-gas-webapp-demo && pnpm lint --write .clasp.json

? Create which script? webapp
Created new webapp script: https://script.google.com/d/1HmYpY4QQuW2zyVvM9VpgduyQqZVTkQ4WmkLWF1oiEHrxg91NO-LgCE2Q/edit

> clasp-gas-webapp-demo@0.0.5 lint /Users/{user_name}/dev/clasp-gas-webapp-demo
> biome check --write .clasp.json

Checked 1 file in 947µs. Fixed 1 file.
```

## Webアプリの実装

### Drive検索サービスの実装

まず、Drive 検索機能を `src/features/drive-search/` ディレクトリに作成します。
必要な型定義や実装を追加していきます。
今回の実装はテンプレートリポジトリの実装手法を真似て作成しています。

```ts src/features/drive-search/drive-search.type.ts
/**
 * Drive検索結果の単一ファイル情報
 */
export type DriveFileInfo = {
  /** ファイル名 */
  name: string;
  /** 最終更新日時(ISO 8601形式) */
  lastUpdated: string;
};

/**
 * Drive検索結果のリスト
 */
export type DriveSearchResult = DriveFileInfo[];
```

```ts src/features/drive-search/drive-search.service.ts
import type { DriveSearchResult } from './drive-search.type';

/**
 * Drive検索サービス
 *
 * Google DriveApp APIを使用してファイルを検索する機能を提供します。
 */
export const DriveSearchService = {
  /**
   * キーワードでDriveファイルを検索します。
   *
   * @param params - 検索パラメータ
   * @param params.keyword - 検索キーワード(ファイル名の部分一致)
   * @returns ファイル情報の配列(最大50件)
   */
  searchFiles: ({ keyword }: { keyword: string }): DriveSearchResult => {
    // シングルクォートをエスケープしてDrive APIクエリを構築
    const query = `title contains '${keyword.replace(/'/g, "\\'")}'`;
    const files = DriveApp.searchFiles(query);
    const results: DriveSearchResult = [];
    const maxResults = 50;

    for (let i = 0; i < maxResults && files.hasNext(); i++) {
      const file = files.next();
      results.push({
        name: file.getName(),
        lastUpdated: file.getLastUpdated().toISOString(),
      });
    }

    return results;
  },
} as const;
```

31 行目の `keyword.replace(/'/g, "\\'")` は、シングルクォートを含むファイル名を検索できるようにするためのエスケープ処理です。
たとえば「John's Report」というファイル名を検索する場合、クォートをエスケープしないと Drive API のクエリ構文エラーになります。
検索結果は最大 50 件に制限しています。大量のファイルがヒットした場合のパフォーマンス劣化を防ぐためです。

### エントリーポイントの実装

`src/index.ts` で Web アプリのエントリーポイントを定義します。

```ts src/index.ts
import { DriveSearchService } from '@features/drive-search/drive-search.service';

// @ts-expect-error GASのグローバル関数
function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  // 実際のHTMLがあるファイル名を指定
  return HtmlService.createHtmlOutputFromFile('app/index')
    .setTitle('Drive検索ビューア')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// @ts-expect-error GASのグローバル関数
function searchFiles(keyword: string) {
  return DriveSearchService.searchFiles({ keyword });
}
```

`doGet()` 関数は、Web アプリの URL にアクセスした際に実行されます。

注意点として、`HtmlService.createHtmlOutputFromFile('app/index')` は、**実際にHTMLファイルが存在するパス**を指定する必要があります。今回は `app/` ディレクトリに配置しているため、`'app/index'` と指定します。
パスを間違えると「File not found」エラーが発生するため、注意が必要です。

`@ts-expect-error` は、GAS のグローバル関数として定義するために必要です。設定しないと TypeScript のコンパイラが怒ってくるので、このファイルに限りエラーを抑制します。

### HTMLファイルの作成

`app/index.html` に検索画面の HTML を作成します。
このあたりの HTML はそれっぽい見た目だったらなんでもよいので、よしなに作成していきましょう。
今回はファイル名と更新日時のみを表示していますが、実際にはそのファイルに直接遷移したり、ファイルがある Drive のフォルダ名を表示するなどすることでユーザー体験が良くなります。

実装は `google.script.run` で `src/index.ts` で Web アプリのエントリーポイントで定義した `searchFiles()` を呼び出すことで、HTML ファイルから GoogleDrive 検索の処理を実行することが可能です。

```html app/index.html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Drive検索ビューア</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f5f5f5;
      padding: 20px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h1 {
      color: #333;
      margin-bottom: 30px;
      font-size: 24px;
    }

    .search-form {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
    }

    #searchInput {
      flex: 1;
      padding: 10px 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    #searchInput:focus {
      outline: none;
      border-color: #4285f4;
    }

    #searchButton {
      padding: 10px 20px;
      background-color: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }

    #searchButton:hover {
      background-color: #3367d6;
    }

    #searchButton:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .message {
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
      display: none;
    }

    .message.info {
      background-color: #e3f2fd;
      color: #1976d2;
      border: 1px solid #bbdefb;
    }

    .message.error {
      background-color: #ffebee;
      color: #c62828;
      border: 1px solid #ffcdd2;
    }

    .message.show {
      display: block;
    }

    .results-container {
      margin-top: 20px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      display: none;
    }

    table.show {
      display: table;
    }

    th {
      background-color: #f5f5f5;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #555;
      border-bottom: 2px solid #ddd;
    }

    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      color: #333;
    }

    tr:hover {
      background-color: #fafafa;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Drive検索ビューア</h1>

    <div class="search-form">
      <input
        type="text"
        id="searchInput"
        placeholder="検索キーワードを入力してください"
        aria-label="検索キーワード"
      />
      <button id="searchButton" type="button">検索</button>
    </div>

    <div id="message" class="message"></div>

    <div class="results-container">
      <table id="resultsTable">
        <thead>
          <tr>
            <th>ファイル名</th>
            <th>最終更新日時</th>
          </tr>
        </thead>
        <tbody id="resultsBody">
        </tbody>
      </table>
    </div>
  </div>

  <script>
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const messageElement = document.getElementById('message');
    const resultsTable = document.getElementById('resultsTable');
    const resultsBody = document.getElementById('resultsBody');

    /**
     * メッセージを表示する
     *
     * @param {string} text - 表示するメッセージ
     * @param {'info' | 'error'} type - メッセージの種類
     */
    function showMessage(text, type) {
      messageElement.textContent = text;
      messageElement.className = `message ${type} show`;
    }

    /**
     * メッセージを非表示にする
     */
    function hideMessage() {
      messageElement.className = 'message';
    }

    /**
     * 検索結果をテーブルに表示する
     *
     * @param {Array<{name: string, lastUpdated: string}>} results - 検索結果の配列
     */
    function displayResults(results) {
      resultsBody.innerHTML = '';

      if (results.length === 0) {
        resultsTable.classList.remove('show');
        showMessage('該当するファイルがありません', 'info');
        return;
      }

      results.forEach(file => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${escapeHtml(file.name)}</td>
          <td>${escapeHtml(file.lastUpdated)}</td>
        `;
        resultsBody.appendChild(row);
      });

      resultsTable.classList.add('show');
      hideMessage();
    }

    /**
     * HTMLエスケープ処理
     *
     * @param {string} text - エスケープする文字列
     * @returns {string} エスケープされた文字列
     */
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    /**
     * 検索実行時のエラーハンドラ
     *
     * @param {Error} error - エラーオブジェクト
     */
    function handleError(error) {
      console.error('検索エラー:', error);
      showMessage('検索中にエラーが発生しました', 'error');
      searchButton.disabled = false;
      searchInput.disabled = false;
    }

    /**
     * 検索を実行する
     */
    function performSearch() {
      const keyword = searchInput.value.trim();

      if (!keyword) {
        showMessage('検索キーワードを入力してください', 'info');
        return;
      }

      searchButton.disabled = true;
      searchInput.disabled = true;
      resultsTable.classList.remove('show');
      showMessage('検索中...', 'info');

      google.script.run
        .withSuccessHandler((results) => {
          displayResults(results);
          searchButton.disabled = false;
          searchInput.disabled = false;
        })
        .withFailureHandler((error) => {
          handleError(error);
        })
        .searchFiles(keyword);
    }

    // イベントリスナーの設定
    searchButton.addEventListener('click', performSearch);

    searchInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        performSearch();
      }
    });
  </script>
</body>
</html>
```

## デプロイ

### GASへのプッシュ

GAS プロジェクトにコードをデプロイしていきましょう。

```bash
pnpm run deploy
```

初回実行時は、マニフェストファイル(`appsscript.json`)の上書き確認が表示されます。「Yes」を選択してください。

```bash
> clasp-gas-webapp-demo@0.0.5 push
> clasp push

? Manifest file has been updated. Do you want to push and overwrite? Yes
└─ app/index.html
└─ appsscript.json
└─ dist/index.js
Pushed 3 files.
```

### Webアプリの公開設定

GAS エディタ(https://script.google.com/)を開き、デプロイボタンから「新しいデプロイ」を選択します。
今回は個人開発のため自分のみを指定していますが、実際に社内で運用するときは `@company.jp` のようなドメインで絞ることが可能です。

デプロイ設定では、以下を指定します。

- 種類: ウェブアプリ
- 実行ユーザー: 自分
- アクセスできるユーザー: 自分のみ(開発時)、またはドメイン内全員(本番時)

![image](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/a0450fe7c181739fb12f9b60e182bfce.png)
### OAuth認証

デプロイ後、初回アクセス時に OAuth 認証画面が表示されます。
本プロジェクトでは、`appsscript.json` に以下の権限を設定しています。

```json
{
  "oauthScopes": ["https://www.googleapis.com/auth/drive.readonly"],
  "webapp": {
    "executeAs": "USER_ACCESSING",
    "access": "DOMAIN"
  }
}
```

- `https://www.googleapis.com/auth/drive.readonly`: Drive API の読み取り専用権限
- `executeAs: "USER_ACCESSING"`: アクセスしたユーザーの権限で実行
- `access: "DOMAIN"`: ドメイン内全員がアクセス可能

読み取り専用権限のため、ファイルの変更や削除はできません。最小権限の原則に従った設計です。

## 動作確認

デプロイ完了後、Web アプリの URL にアクセスします。
検索フォームにキーワード(例:「報告書」)を入力して「検索」ボタンをクリックすると、Google Drive 内のファイルが検索されます。
検索結果は、ファイル名と最終更新日時がテーブル形式で表示されます。該当するファイルがない場合は、「該当するファイルがありません」というメッセージが表示されます。
実際に Google Drive に仮ファイルを作成して「clasp-gas-webapp-demo」と検索したところ、無事検索ができ画面へ表示されました。
![image](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/41b3542cb3dc49e30b4666c5bce51eb7.png)

![image](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/1b71e182e10648cb05faf1cbd02dc884.png)


## 社内公開に向けて:実践的な考慮事項

このプロジェクトは、あくまで clasp を用いた Web アプリ開発の第一歩です。社内ツールだとしても、セキュリティへの配慮はより一層重要になります。
特に社内データを取り扱う場合は、以下の点に確認が必要です。

1 つ目は情報セキュリティ部門との連携です。新しいツールを導入する際は、まず情報セキュリティ部門に相談することをお勧めします。
特に、OAuth で要求する権限の妥当性や、万が一のインシデントが発生した場合の対応など専門的な視点からの助言は非常に有益です。

2 つ目は極力最小限の権限に設定することです。本アプリでは、`oauthScopes` に `drive.readonly` という読み取り専用の権限を設定しました。
機能を追加する際も、安易に強力な権限(読み書き・削除が可能)を要求せず、本当に必要な最小限の権限は何かを常に意識して設定することが重要です。

3 つ目はアクセス範囲を再確認することです。社内限定で公開する際は必ず"DOMAIN"を選択し、誤って"ANYONE"(全員に公開)に設定しないよう、デプロイ時にはダブルチェックを徹底しましょう。この 1 つの設定ミスが、意図しない情報公開に繋がるリスクを孕んでいます。

## まとめ

本記事では、clasp と TypeScript を組み合わせることで、Google Apps Script のモダンな開発フローについて解説しました。

GAS が元来持つ「サーバーインフラ不要で、Google Workspace とシームレスに連携できる」という手軽さはそのままに、使い慣れたエディタ、強力な型補完、そして Git によるバージョン管理といった、現代的なソフトウェア開発の恩恵を享受できます。この組み合わせは、特に社内の「ちょっとした不便」を解決するツールを迅速に開発する上で、非常に強力な選択肢となるでしょう。

今回構築した「Drive 検索ビューア」は、その可能性を示すほんの始まりに過ぎません。Google Workspace には、Gmail、カレンダー、スプレッドシートといった強力な API 群が揃っています。これらと連携させることで、あなたのアイデア次第で活用の幅は無限に広がります。

例えば、以下のようなアプリなどが挙げられます。
- **Gmail API**と連携し、「特定のラベルが付いたメールの添付ファイルを一括で Drive に保存するツール」
- **Sheets API**を使い、「スプレッドシートを簡易データベースとした備品管理アプリ」
- **Calendar API**を活用し、「オフィスに出社している人の数を知るアプリ」

ぱっと思いついた範囲ですが、このような日々の業務に密着した課題を解決するアプリケーションを、自らの手で作り出すことが可能です。
この記事が、皆さんの「あったらいいな」を実現するための一歩を踏み出すきっかけとなれば幸いです。
以上になります✌️

## 参考リンク

https://github.com/google/clasp

https://developers.google.com/apps-script/guides/clasp

https://developers.google.com/identity/protocols/oauth2/scopes
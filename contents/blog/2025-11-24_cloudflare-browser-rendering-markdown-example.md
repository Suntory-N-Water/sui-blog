---
title: Cloudflareのグローバルネットワーク上でヘッドレスChromeを実行するBrowser Rendering
slug: cloudflare-browser-rendering-markdown-example
date: 2025-11-24
modified_time: 2025-11-24
description: Cloudflare Browser RenderingのREST APIを使って、WebページをMarkdownに変換するAPIを構築する方法を解説します。不要な要素の削除やリソース最適化など、実践的な実装例を紹介します。
icon: 🌐
icon_url: /icons/globe_with_meridians_flat.svg
tags:
  - Cloudflare
  - CloudflareWorkers
---

Cloudflare Browser Rendering は、ブラウザの自動化や Web スクレイピング、テスト、そしてコンテンツ生成のために、Cloudflare のグローバルネットワーク上でヘッドレス Chrome を実行できる機能です。主な用途としては、スクレイピングしたり、Web ページを Markdown に変換したりといったことが挙げられます。

## 今回作成するもの

この記事では、Browser Rendering の機能を活用して、URL を渡すと記事の内容を Markdown 形式で返してくれる API を作成します。

この機能を利用するには、大きく分けて 2 つのアプローチがあります。

1 つ目は、Puppeteer や Playwright を使用する方法です。こちらはクリックやスクロールといった複雑なブラウザ操作が必要な場合や、MCP (Model Context Protocol) を活用したエージェントフローを組む場合に適しています。

2 つ目は、今回使用する REST API の TypeScript SDK を使用する方法です。こちらはスクリーンショットの撮影や PDF 生成、そして今回の目的である HTML コンテンツの抽出といった、シンプルでステートレスなタスクに最適化されています。

今回は「URL を渡してテキストを取得する」という単一のタスクであり、複雑なブラウザ操作は必要ありません。そのため、より軽量で手軽に実装できる REST API の方を選択しました。

## 開発に至った背景

なぜ今回この API を作ろうと思ったのか、その背景にある私個人の課題感について少しお話しさせてください。

私は日々の情報の保管庫として Obsidian を使っているのですが、`line_to_obsidian` というツールを使ってスマートフォンから URL を送信し、そのページを後で Obsidian Web Clipper を使って Markdown に落とし込むというフローを実践しています。

https://github.com/onikun94/line_to_obsidian

https://obsidian.md/clipper

この記事自体も、「X (旧 Twitter) で Cloudflare のエンドポイントをたたくと Markdown が返ってくるらしい」という情報を元に、さまざまな情報を集めて作成しています。しかし、このブログ記事のネタ集めだったり、日々の「これ後で読んでおこうかな」といった情報を抽出したりする過程で、ある 1 つの問題が発生するのです。

### 積読における期待値のズレ

そもそも「後で読もう」とか「今読もう」となった時に、「あれ、この記事思ってたのと違うな…」とか「いや、これ見たことあるな」といった記事だった場合、拍子抜けしてしまうことがあります。

本来あるべき姿はすべてに目を通すことなんですが、たとえば X (旧 Twitter) などで流れてきて「これは良さそうだな」と思い、今は別の作業中だから後で読もうとした時。あるいは Zenn やはてなブックマークなどでタイトルと冒頭だけ見て保存した時。そういった時に、後で最後まで読んでみるとがっかりする事態はなるべく避けたいなと思っています。

### 要約のための下準備

この「がっかり」を防ぐには、記事を保存した段階で AI に要約してもらい、読むべきかどうかの判断材料にできれば理想的です。

しかし、ここで技術的な課題が 1 つあります。AI に要約させるためには、まずその Web ページから「本文のテキストデータだけ」をきれいに抽出して渡してあげる必要があるのです。

Safari などのブラウザでページを開いて、手動でコピーして ChatGPT に貼り付けることもできますが、毎回それを行うのはあまりに億劫です。移動中や休憩時間の短い間にスマートフォンで「後で読む」ボタンを押すようなシーンでは、その場で手動コピーなどしていられません。

そこで今回の Cloudflare Browser Rendering の出番です。
この機能を使えば、URL を送信するだけで、Web ページを Markdown (AI が理解しやすいテキスト形式) に変換して返してくれます。これを使って本文を自動で取得する API さえ作ってしまえば、あとはそれを AI に投げるだけで、読みたかった記事の要約フローが完成します。

今回はその第一歩として、まずは「URL を渡して Markdown を取得する」部分の実装から始めていきましょう。

## 始める前に

始める前に、次の権限を持つカスタム API トークンを作成してください。

必要な環境変数は以下の通りです。

- account_id : https://dash.cloudflare.com/<account_id> から確認できる。
- api_token :  https://dash.cloudflare.com/profile/api-tokens で作成し、設定できある。

api_token の場合、テンプレートの「Cloudflare Workers を編集する」から `browser-rendering-test-token` という名前で作成し、権限は「ブラウザレンダリング」を選択します。最小権限の法則に基づき、この権限だけを付与するようにしましょう。

作成されたトークンを使って POST リクエストを送り、成功したら設定完了です。
```bash
curl "https://api.cloudflare.com/client/v4/accounts/{account_id}/tokens/verify" \
-H "Authorization: Bearer {api_token}"
{"result":{"id":"{id}","status":"active","not_before":"2025-11-24T00:00:00Z","expires_on":"2025-12-01T23:59:59Z"},"success":true,"errors":[],"messages":[{"code":10000,"message":"This API Token is valid and active","type":null}]}%  
```

それでは実際に `/markdown` エンドポイントを使用して、Web 記事の情報を Markdown で取得する API を作成し、記事内容を取得していきましょう。

以下のコマンドでセットアップをしていきます。アプリケーション名はわかりやすく `browser-rendering-markdown` にしておきます。シンプルな構成でよいので、以下の設定を選択してください。
- For _What would you like to start with?_, choose `Hello World example`.
- For _Which template would you like to use?_, choose `Worker only`.
- For _Which language do you want to use?_, choose `TypeScript`.
- For _Do you want to use git for version control?_, choose `Yes`.
- For _Do you want to deploy your application?_, choose `No` (we will be making some changes before deploying).

https://developers.cloudflare.com/workers/get-started/guide/

```bash
% pnpm create cloudflare@latest browser-rendering-markdown

──────────────────────────────────────────────────────────────────────────────────────────────────────────
👋 Welcome to create-cloudflare v2.55.1!
🧡 Let's get started.
📊 Cloudflare collects telemetry about your usage of Create-Cloudflare.

Learn more at: https://github.com/cloudflare/workers-sdk/blob/main/packages/create-cloudflare/telemetry.md
──────────────────────────────────────────────────────────────────────────────────────────────────────────

╭ Create an application with Cloudflare Step 1 of 3
│
├ In which directory do you want to create your application?
│ dir ./browser-rendering-markdown
│
├ What would you like to start with?
│ category Hello World example
│
├ Which template would you like to use?
│ type Worker only
│
├ Which language do you want to use?
│ lang TypeScript
│
├ Copying template files
│ files copied to project directory
│
├ Updating name in `package.json`
│ updated `package.json`
│
├ Installing dependencies
│ installed via `pnpm install`
│
╰ Application created 

╭ Configuring your application for Cloudflare via `wrangler setup` Step 2 of 3
│
├ Installing wrangler A command line tool for building Cloudflare Workers
│ installed via `pnpm install wrangler --save-dev`
│
├ Retrieving current workerd compatibility date
│ compatibility date 2025-11-21
│
├ Generating types for your application
│ generated to `./worker-configuration.d.ts` via `pnpm run cf-typegen`
│
├ Do you want to use git for version control?
│ yes git
│
├ Initializing git repo
│ initialized git
│
├ Committing new files
│ git commit
│
╰ Application configured 

╭ Deploy with Cloudflare Step 3 of 3
│
├ Do you want to deploy your application?
│ no deploy via `pnpm run deploy`
│
╰ Done 

────────────────────────────────────────────────────────────
🎉  SUCCESS  Application created successfully!

💻 Continue Developing
Change directories: cd browser-rendering-markdown
Deploy: pnpm run deploy

📖 Explore Documentation
https://developers.cloudflare.com/workers

🐛 Report an Issue
https://github.com/cloudflare/workers-sdk/issues/new/choose

💬 Join our Community
https://discord.cloudflare.com
────────────────────────────────────────────────────────────
```

実際のプロジェクトへ移動します。

```bash
dev % cd browser-rendering-markdown 
browser-rendering-markdown % code .
```

## 実装

サンプルコードと同様に、Workers の API を叩いて実装していきましょう。今回の環境は Cloudflare Workers で実践しているため、環境変数は `process.env` ではなく `.dev.vars` の中に入れていきます。

必要な環境変数を取得し、`pnpm run cf-typegen` で型定義ファイルを更新します。
```bash
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
```

<!-- textlint-disable preset-ja-technical-writing/no-unmatched-pair -->
>[!WARNING]
>APIトークンは機密情報なので、 `wrangler.jsonc` などには設定せず、[シークレット](https://developers.cloudflare.com/workers/configuration/secrets/)または[シークレットストアバインディングを](https://developers.cloudflare.com/secrets-store/integrations/workers/)使用してください。
>
>https://developers.cloudflare.com/workers/configuration/secrets/
>
>https://developers.cloudflare.com/secrets-store/integrations/workers/
>
<!-- textlint-enable preset-ja-technical-writing/no-unmatched-pair -->


Cloudflare Workers の初期セットアップ段階では、必要なモジュールが足りていないため、以下のコマンドを実行して Cloudflare のモジュールをインストールします。

```bash
pnpm add cloudflare
```

クエリパラメータに設定されている URL にアクセスして、Markdown を返却するコードを実装します。
`env.CLOUDFLARE_ACCOUNT_ID` は、先ほど環境変数を設定した後に型定義ファイルを更新することで、env プロパティ経由で環境変数にアクセスできます。

```ts
import Cloudflare from 'cloudflare';

export default {
  async fetch(request, env, _ctx): Promise<Response> {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('URL parameter is required', { status: 400 });
    }

    const client = new Cloudflare({
      apiToken: env.CLOUDFLARE_API_TOKEN,
    });
    const markdown = await client.browserRendering.markdown.create({
      account_id: env.CLOUDFLARE_ACCOUNT_ID,
      url: targetUrl,
    });
    return new Response(markdown, {
      status: 200,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  },
} satisfies ExportedHandler<Env>;
```

それでは実際にアクセスしてみましょう。たとえば Zenn の記事などではどうなるか試してみます。
取得する際に使った URL は、以前プチバズリしたこの記事です。

https://zenn.dev/sui_water/articles/502a6ef30b79e1

ローカルサーバを立ち上げて、 `http://localhost:8787/?url=https://zenn.dev/sui_water/articles/502a6ef30b79e1` にアクセスすると、無事 Markdown が取得できました。

```md
👀

# GASを使うと社内だけで使えるWebサイトが簡単に作れるの知ってました？

2025/11/03に公開

147

102

[![](https://storage.googleapis.com/zenn-user-upload/topics/f13e758fdb.png)TypeScript](https://zenn.dev/sui_water/articles/502a6ef30b79e1/topics/typescript)[![](https://storage.googleapis.com/zenn-user-upload/topics/d82fbd6fb0.png)GAS](https://zenn.dev/sui_water/articles/502a6ef30b79e1/topics/gas)[![](https://storage.googleapis.com/zenn-user-upload/topics/3b81cfab49.png)Google Apps Script](https://zenn.dev/sui_water/articles/502a6ef30b79e1/topics/googleappscript)[![](https://zenn.dev/images/topic.png)clasp](https://zenn.dev/sui_water/articles/502a6ef30b79e1/topics/clasp)[![](https://static.zenn.studio/images/drawing/tech-icon.svg)tech](https://zenn.dev/sui_water/articles/502a6ef30b79e1/tech-or-idea)

## [](#%E3%81%AF%E3%81%98%E3%82%81%E3%81%AB) はじめに

2025年11月現在、Geminiを使用してGoogle Slidesを作成する「まじん式」プロンプトが話題です。  
<https://note.com/majin%5F108/n/n11fc2f2190e9>  
こちらの記事で初めて知りましたが、どうやらGoogle Apps Script(GAS)を使うと、社内限定で使えるWebアプリケーションを簡単に構築できるそうです。  
GAS自体は使ったことはありますが、Webアプリケーションを作ったことはありませんでした。  
本記事では、**実践的なサンプルプロジェクトとして**GoogleDriveにあるファイルを検索するアプリケーション(Drive検索ビューア)を構築していきます。  
開発にはclaspとTypeScriptを使用します。claspはCommand Line Apps Script Projectsの略称で、Apps Script プロジェクトをローカルで開発することができるOSSです。  
<https://github.com/google/clasp>  
また、従来のGASエディタではなく、使い慣れたVS Codeで開発を進めていきます。  
GASエディタでは困難だったClaude CodeなどのAIエージェントを組み合わせることで、モダンな開発環境でGAS製のWebアプリケーションを作成していきましょう。
```

取得自体はできましたが、絶妙に入ってほしくない箇所、たとえば `aside` タグや `footer` タグの部分まで含まれてしまっているようです。

```md
ぱっと思いついた範囲ですが、このような日々の業務に密着した課題を解決するアプリケーションを、自らの手で作り出すことが可能です。  
この記事が、皆さんの「あったらいいな」を実現するための一歩を踏み出すきっかけとなれば幸いです。  
以上になります✌️

## [](#%E5%8F%82%E8%80%83%E3%83%AA%E3%83%B3%E3%82%AF) 参考リンク

<https://github.com/google/clasp>  
<https://developers.google.com/apps-script/guides/clasp>  
<https://developers.google.com/identity/protocols/oauth2/scopes>

147

102

[![スイ](https://storage.googleapis.com/zenn-user-upload/avatar/c80d51cd90.jpeg)](https://zenn.dev/sui_water/articles/502a6ef30b79e1/sui%5Fwater)

[スイ](https://zenn.dev/sui_water/articles/502a6ef30b79e1/sui%5Fwater)

ソフトウェアエンジニアです。

### Discussion

![Zennのディスカッション機能の表示イメージ](https://static.zenn.studio/images/drawing/discussion.png)

[![スイ](https://storage.googleapis.com/zenn-user-upload/avatar/c80d51cd90.jpeg)](https://zenn.dev/sui_water/articles/502a6ef30b79e1/sui%5Fwater)

[スイ](https://zenn.dev/sui_water/articles/502a6ef30b79e1/sui%5Fwater)

ソフトウェアエンジニアです。

目次

1. [はじめに](#%E3%81%AF%E3%81%98%E3%82%81%E3%81%AB)  
   2. [この記事の対象読者](#%E3%81%93%E3%81%AE%E8%A8%98%E4%BA%8B%E3%81%AE%E5%AF%BE%E8%B1%A1%E8%AA%AD%E8%80%85)
3. [構築するアプリの概要](#%E6%A7%8B%E7%AF%89%E3%81%99%E3%82%8B%E3%82%A2%E3%83%97%E3%83%AA%E3%81%AE%E6%A6%82%E8%A6%81)
4. [なぜclaspを使うのか](#%E3%81%AA%E3%81%9Cclasp%E3%82%92%E4%BD%BF%E3%81%86%E3%81%AE%E3%81%8B)
5. [開発環境のセットアップ](#%E9%96%8B%E7%99%BA%E7%92%B0%E5%A2%83%E3%81%AE%E3%82%BB%E3%83%83%E3%83%88%E3%82%A2%E3%83%83%E3%83%97)  
※中略
```

実際の記事として読む際には、`aside` タグや `footer` タグの部分は重要ではありません。Cloudflare では公式に API リファレンスを提供していますので、これらを取得対象から外すことができるか、公式ドキュメントを確認してみましょう。

https://developers.cloudflare.com/api/resources/browser_rendering/subresources/markdown/methods/create/

`addScriptTag` プロパティの `content` に JavaScript を設定できます。不要な `aside` タグと `footer` タグを排除するスクリプトを入れて実行してみましょう。`header` タグの情報は入っていなかったのですが、他サイトで流用するときのために一応入れておきます。

```diff
 import Cloudflare from 'cloudflare';

 export default {
   async fetch(request, env, _ctx): Promise<Response> {
     const url = new URL(request.url);
     const targetUrl = url.searchParams.get('url');

     if (!targetUrl) {
       return new Response('URL parameter is required', { status: 400 });
     }

     const client = new Cloudflare({
       apiToken: env.CLOUDFLARE_API_TOKEN,
     });
     const markdown = await client.browserRendering.markdown.create({
       account_id: env.CLOUDFLARE_ACCOUNT_ID,
       url: targetUrl,
+      addScriptTag: [
+        {
+          content: `document.querySelectorAll('aside, header, footer').forEach(el => el.remove());`,
+        },
+      ],
     });
     return new Response(markdown, {
       status: 200,
       headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
     });
   },
 } satisfies ExportedHandler<Env>;
```

実行してみたところ、不要な部分が取得対象外になっていることが確認できます。

![Zennの記事からasideタグとfooterタグが削除されたレスポンスの画像](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/2250b25255d6eb5fe6a688f20ea66ba3.png)


より、Markdown 変換の精度を上げるために、不要なリソースの読み込みをブロックできます。`rejectResourceTypes` と `rejectRequestPattern` パラメータを使うことで、CSS や画像ファイルなどのコンテンツに直接関係のないリソースを除外できます。

```diff
 const markdown = await client.browserRendering.markdown.create({
   account_id: env.CLOUDFLARE_ACCOUNT_ID,
   url: targetUrl,
+  rejectResourceTypes: ['stylesheet', 'image', 'media', 'font'],
+  rejectRequestPattern: ['/^.*\\.(css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/'],
   addScriptTag: [
     {
       content: `document.querySelectorAll('aside, header, footer').forEach(el => el.remove());`,
     },
   ],
 });
```

**rejectResourceTypes** は、リソースタイプ単位でブロックします。スタイルシート、画像、メディア、フォントファイルなど、テキストコンテンツの抽出には不要なリソースを指定できます。**rejectRequestPattern** は正規表現パターンでリクエストをブロックします。拡張子ベースで細かく制御したい場合に便利です。
これらのパラメータを追加で使用することで、ページの読み込み速度が向上し、Markdown 変換の精度も上がります。

## 料金体系

Browser Rendering の料金体系は、使用方法によって異なります。

- REST API - ブラウザの使用時間(Duration)のみで課金
- Workers Bindings - 使用時間と同時実行数(Concurrency)の両方で課金

今回使用している REST API の場合、以下の料金プランになります。

| プラン | 無料枠 | 超過料金 |
|--------|--------|----------|
| Workers Free | 1日10分 | 課金不可 |
| Workers Paid | 月10時間 | $0.09/時間 |

たとえば、Workers Paid プランで月に 50 時間使用した場合、計算は以下のようになります。

```
50時間 - 10時間(無料枠) = 40時間
40時間 × $0.09 = $3.60
```

REST API のレスポンスには `X-Browser-Ms-Used` ヘッダが含まれており、そのリクエストで使用したブラウザ時間(ミリ秒単位)を確認できます。これを使って使用量をモニタリングすることも可能です。

## まとめ

今回は、Cloudflare Browser Rendering を使って、URL を渡すと Markdown が返ってくる API を構築しました。REST API を使うことで、複雑なセットアップなしにシンプルな実装ができることを確認できました。

今後の展開としては、この記事の冒頭で触れたように、Workers AI と組み合わせて記事の要約機能を追加したり、Obsidian との連携を自動化したりといった拡張も考えられます。また、複雑なブラウザ操作が必要になった時は、Puppeteer API への移行も選択肢になるでしょう。

Cloudflare Browser Rendering は、エッジでのブラウザ自動化という新しい可能性を提供してくれています。今回のようなシンプルなユースケースから始めて、徐々に活用の幅を広げていくのが良いのかなでしょう。

今回使用したリポジトリは以下で確認できます。

https://github.com/Suntory-N-Water/browser-rendering-markdown

## 参考

https://developers.cloudflare.com/browser-rendering/

https://developers.cloudflare.com/browser-rendering/rest-api/

https://developers.cloudflare.com/api/resources/browser_rendering/subresources/markdown/methods/create/

https://developers.cloudflare.com/browser-rendering/pricing/

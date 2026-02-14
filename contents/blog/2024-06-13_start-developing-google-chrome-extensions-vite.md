---
title: Viteで始めるGoogleChrome拡張機能開発
slug: start-developing-google-chrome-extensions-vite
date: 2024-06-13
modified_time: 2024-06-13
description: Vite + TypeScriptを使用してGoogle Chrome拡張機能を開発する方法を解説します。初めて拡張機能を開発する方の第一歩になる記事です。
icon: ⚡
icon_url: /icons/high_voltage_flat.svg
tags:
  - ChromeExtension
  - TypeScript
  - Vite
---

## はじめに

都内の SES 企業で勤務しているスイと申します。

実務では Excel や PowerPoint と睨めっこする SE です。

今回は Google Chrome の拡張機能を Vite + TypeScript を使用して開発したので、初めて拡張機能を開発する人の第一歩になればよいなと思い書いていきます。

## この記事で話すこと

- TypeScript + Vite を使って拡張機能を開発する方法

## なぜJavaScriptで開発しない？

Google Chrome 拡張機能を開発するには `manifest.json` と `content_script` として必要な JavaScript ファイルのみで実行できます。

[外部に公開しないミニマムなchrome拡張機能を作るのは1時間も使わずにできる - Qiita](https://qiita.com/Ancient_Scapes/items/822409167ae3a0b76dbe)

上記の記事では以下さえ作成できれば拡張機能を作ることができます。

```
フォルダ
├ content_scripts.js
├ icon_32.png // アイコンはなくても動く
└ manifest.json
```

そんな状況の中、なぜ TypeScript で開発しようとしたのかを解説します。

## any地獄で頭抱えたこと

JavaScript では型がないことによる影響としてバグを発見しづらいこともそうですが、一番しんどいのはエディタのコード補完が反応しないことです。

私が作成していた拡張機能では親のセレクター要素を取得して、あるメソッドの内部で親要素の中にある情報を返す仕様です。

```tsx
const getProductData = (element: Element, count: number): ProductData => {
  const nameElement = element.querySelector('.content__97a42da1 > span');
  const imageElement = element.querySelector(
    '.merItemThumbnail.medium__a6f874a2.thumbnail__97a42da1 > figure > div.imageContainer__f8ddf3a2 > picture > img',
  );
  const cloneAndDeleteItemElement = element.querySelector('#clone-and-delete-item');

  return {
    name: nameElement ? nameElement.textContent : null,
    imageUrl: imageElement ? imageElement.getAttribute('src') : null,
    cloneAndDeleteItemSelector: cloneAndDeleteItemElement
      ? `#currentListing > div.merList.border__17a1e07b.separator__17a1e07b > div:nth-child(${count}) > div.content__884ec505 > a > div > div > #clone-and-delete-item`
      : null,
  };
};
```

上記のソースコードを JavaScript で書いてしまうとほとんど any 型となってしまい、弱弱エンジニアの私はぶっ倒れてしまいます。

![VS Codeでコード補完が反応しない状態のエディタ画面](https://storage.googleapis.com/zenn-user-upload/f0ba7ffbb938-20240613.png)


![VS Codeでコード補完によりメソッド候補が表示されている画面](https://storage.googleapis.com/zenn-user-upload/f6226cc48111-20240613.png)


## リアルタイムで変更が反映されないこと

拡張機能を反映させるためには Chrome デベロッパーの更新を押さない限り、更新した内容が反映されません。
バグが起きる→ログ出す→拡張機能を更新する→処理を確認する→拡張機能を更新する…
こんなことやっていたら開発効率が非常によくないです😰

今回は CRXJS Vite plugin を使うことで、コードを保存するたびに拡張機能が再読み込みされるため、更新ボタンを手動で押す手間が省けます。

## 拡張機能開発のおさらい(contents,popup,backgroundの役割)

Google Chrome 拡張機能には、3 つの役割を持った JavaScript があります。
(ご存知の人は「導入」までスキップして OK です)

## コンテンツスクリプト(content scripts)

コンテンツスクリプトは、ブラウザが表示しているウェブページの中で実行される JavaScript ファイルです。

これにより、ウェブページの内容を直接操作したり、ページ内のデータを抽出したりできます。

### できること

- **DOMの操作**：ページ内の HTML 要素を取得・変更・削除できます。
- **CSSの変更**：スタイルシートを追加・変更できます。
- **イベントの設定**：クリックやキーボード入力などのイベントを監視して処理できます。
- **メッセージの送受信**：バックグラウンドスクリプトや、ポップアップスクリプトとメッセージを送受信できます。

### できないこと

- **拡張機能の全体的な設定変更**：拡張機能の設定や、ストレージへの直接アクセスはバックグラウンドスクリプトが担当します。
- **長時間の処理**：コンテンツスクリプトはページのライフサイクルに依存するため、ページが閉じられると実行が終了します。

## ポップアップスクリプト(popup scripts)

ポップアップスクリプトは、拡張機能のアイコンをクリックした際に表示されるポップアップウィンドウ内で実行される JavaScript ファイルです。

ユーザーの操作に応じて処理を行います。

### できること

- **UIの提供**：HTML と CSS を使ってポップアップ内の UI を構築できます。
- **ユーザー入力の処理**：フォームやボタンの操作を監視して処理できます。
- **メッセージの送受信**：コンテンツスクリプトや、バックグラウンドスクリプトとメッセージを送受信できます。
- **ブラウザAPIの利用**：ブラウザの API(例えばストレージ API やタブ API)にアクセスできます。

### できないこと

- **長時間の処理**：ポップアップはユーザーがポップアップウィンドウを閉じると処理が終了します。
- **ページの直接操作**：ポップアップスクリプトはウェブページの DOM に直接アクセスすることはできません。これはコンテンツスクリプトの担当です。

## バックグラウンドスクリプト(background scripts)

バックグラウンドスクリプトは、拡張機能のライフサイクル全体で持続的に実行される JavaScript ファイルです。

拡張機能の状態を管理し、長時間にわたるタスクを処理します。

### できること

- **イベントの監視**：ブラウザのイベント(例えば、タブの作成や削除、拡張機能のインストールなど)を監視して処理できます。
- **データの保存と取得**：ストレージ API を使用してデータを保存および取得できます。
- **メッセージの送受信**：コンテンツスクリプトや、ポップアップスクリプトとメッセージを送受信できます。
- **外部APIとの通信**：外部の API とやり取りできます。

### できないこと

- **ページの直接操作**：バックグラウンドスクリプトはウェブページの DOM に直接アクセスすることはできません。これはコンテンツスクリプトの担当です。
- **ユーザーインターフェースの提供**：ポップアップやオプションページを持つことはできますが、バックグラウンドスクリプト自体は UI を持ちません。

## 導入

## 必要なパッケージのインストール

必要なパッケージと Vite 環境のセットアップをします。

Vanilla で開発していきます。

```bash
$ pnpm create vite
√ Project name: ... chrome-extension-vite-sample
√ Select a framework: » Vanilla
√ Select a variant: » TypeScript

Scaffolding project in C:\Users\xxxxx\Documents\dev\projects\chrome-extension-vite-sample...

Done. Now run:

  cd chrome-extension-vite-sample
  pnpm install
  pnpm run dev

```

作成したディレクトリに移動したあと、以下のコマンドを実行して必要なパッケージをインストールします。

`@types/chrome` は Chrome 拡張機能固有の型を追加できます。

```bash
pnpm install
pnpm add -D @crxjs/vite-plugin @types/chrome
```

## マニフェストファイルの設定

`vite.config.ts` を作成します。

```tsx vite.config.ts
import { defineConfig } from 'vite';
import { crx, defineManifest } from '@crxjs/vite-plugin';

const manifest = defineManifest({
  manifest_version: 3,
  name: 'Chrome拡張機能の練習',
  version: '1.0.0',
  description: 'Zenn投稿するChrome拡張機能のサンプルです。',
  action: {
    default_popup: 'index.html',
  },
});

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});

```

CRXJS Vite Plugin の `defineManifest` を使うことで `manifest.json` を TypeScript で書くことができます。

 `manifest.json` は拡張機能固有のファイルです。拡張機能の名前やバージョン、パーミッションなどを書きます。

## 拡張機能を読み込む

`vite.config.ts` を書き換えた時点で拡張機能として動かすことができるため、試してみます。

以下のコマンドを実行して開発環境を起動します。

```bash
pnpm run dev
```

次に、拡張機能の管理ページを開きます。`chrome://extensions/` にアクセスするか、ブラウザ右上のメニューより「その他のツール＞拡張機能」をクリックして拡張機能の管理ページで、デベロッパーモードをオンにします。

その後「パッケージ化されていないされていない拡張機能を読み込む」のボタンを押します。

フォルダは先程プロジェクトの dist(manifest.json があるフォルダ)を選択します。

ブラウザの右上に表示される拡張機能のアイコンをクリックすると、`index.html` が表示されます。
![Chrome拡張機能のポップアップUIが表示されている画面](https://storage.googleapis.com/zenn-user-upload/6f6bc2e1178d-20240613.png)



ここまでで拡張機能を動かすことは確認できました。

## 簡単な拡張機能を作ってみる

拡張機能が動くことを確認できたので、`popup.ts`,`content.ts` を使って拡張機能を作成していきましょう。
Zenn の topics ページから記事の一覧を取得して、Markdown 形式に変換する拡張機能を作成してきます。
作成イメージはこのような記事タイトル、絵文字、URL を繰り返し表示するような内容です。

```markdown
## 🍨Honoでランダムにアイスクリームを提案するLINE BOTを作る

link🔗 : https://zenn.dev/sui_water/articles/fac4334293a1c0
```

## ファイルの整理

まずは大元の html である `index.html` を修正していきます

```html index.html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Markdown Viewer</title>
  </head>
  <body>
    <div class="container">
      <h1>Markdown Generator</h1>
      <textarea class="markdown-output" readonly></textarea>
    </div>
    <script type="module" src="/src/popup.ts"></script>
  </body>
</html>

```

次に今回の処理で必要なファイルを `vite.config.ts` に書いていきます。

`content_scripts` には `content.ts` で処理をするページを記載します。

今回は Zenn の topics ページが対象です。

```diff vite.config.ts
import { defineConfig } from 'vite';
import { crx, defineManifest } from '@crxjs/vite-plugin';

const manifest = defineManifest({
  manifest_version: 3,
  name: 'Chrome拡張機能の練習',
  version: '1.0.0',
  description: 'Zenn投稿するChrome拡張機能のサンプルです。',
+ content_scripts: [
+   {
+     matches: ['https://zenn.dev/topics/*'],
+     js: ['src/content.ts'],
+   },
+ ],
  action: {
    default_popup: 'index.html',
  },
});

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});

```

## popup.ts, content.tsの実装

`popup.ts` を作成し、処理を書いていきます。

やることは拡張機能を開いたときに `content_script` へメッセージを送信し、`content_script` は受け取ったメッセージをもとに Zenn の記事情報を取得します。

まずは `popup.ts` にメッセージを送信する処理を書いていきます。

```tsx popup.ts
import { MessageActionsId, ResponseMessageData } from './types';

document.addEventListener('DOMContentLoaded', () => {
  // 現在のタブ情報を取得
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0 || tabs[0].id === undefined) {
      throw new Error('アクティブなタブが見つかりませんでした。');
    }
    chrome.tabs.sendMessage<MessageActionsId>(
      tabs[0].id,
      { action: 'get-zenn-articles' },
      (response: ResponseMessageData | undefined) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      },
    );
  });
});

```

型情報がないので、`types.ts` を作成して `content.ts` でも使用する汎用的な型を作成します。

```tsx types.ts
export type MessageActionsId = {
  action: 'get-zenn-articles';
};

export type ZennArticleData = {
  title: string;
  url: string;
  emoji: string;
};

export type ResponseMessageData = {
  data: ZennArticleData[];
};
```

`content.ts` には記事情報取得を開始するメッセージである `get-zenn-articles` を受け取ったときに処理を開始します。

```tsx content.ts
import { MessageActionsId, ResponseMessageData, ZennArticleData } from './types';

const setupMessageListener = () => {
  chrome.runtime.onMessage.addListener(
    async (
      request: MessageActionsId,
      _sender,
      sendResponse: (response: ResponseMessageData) => void,
    ) => {
      if (request.action === 'get-zenn-articles') {
        const details: ZennArticleData[] = [];
        let count = 1;
        let element: Element | null;

        // 記事情報が取得できなくなるまで繰り返す
        while (
          (element = document.querySelector(
            `#__next > div.View_contents__azal2 > div > section > div.View_itemsContainer__srSwj > div > div:nth-child(${count})`,
          )) !== null
        ) {
          try {
            const article = getArticleData(element);
            details.push(article);
          } catch (error) {
            console.error(`記事の取得中にエラーが発生しました : ${error}`);
            continue;
          }
          count++;
        }
				
        console.log(details);
        sendResponse({ data: details });
      }
      return true;
    },
  );
};

const getArticleData = (element: Element): ZennArticleData => {
  const titleElemnt = element.querySelector<HTMLElement>('article > div > a > h2');
  const urlElement = element.querySelector<HTMLElement>('article > div > a');
  const emojiElement = element.querySelector<HTMLElement>(
    'article > a > span.Emoji_nativeEmoji__GMBzX',
  );

  if (!titleElemnt || !urlElement || !emojiElement) {
    throw new Error('必要な商品情報の要素が見つかりませんでした。');
  }

  return {
    title: titleElemnt.textContent || '',
    url: urlElement.getAttribute('href') || '',
    emoji: emojiElement.textContent || '',
  };
};

if (typeof chrome !== 'undefined' && chrome.runtime) {
  setupMessageListener();
}

```

これらを記載したあとに画面右上の拡張機能を押すと `popup.ts` から `content.ts` に取得メッセージが送信され、記事情報を取得できていることが確認できます。

![ブラウザコンソールにZenn記事情報がJSON形式で出力されている画面](https://storage.googleapis.com/zenn-user-upload/8297a31e24eb-20240613.png)


記事情報を取得できたので、あとは `popup.ts` で取得したデータを `index.html` に反映させていきましょう。

```tsx popup.ts
import { MessageActionsId, ResponseMessageData, ZennArticleData } from './types';

document.addEventListener('DOMContentLoaded', () => {
  // 現在のタブ情報を取得
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0 || tabs[0].id === undefined) {
      throw new Error('アクティブなタブが見つかりませんでした。');
    }
    chrome.tabs.sendMessage<MessageActionsId>(
      tabs[0].id,
      { action: 'get-zenn-articles' },
      (response: ResponseMessageData | undefined) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
        if (!response) {
          throw new Error('記事情報の取得に失敗しました。');
        }

        const markdown = createArticleMarkdown(response.data);
        const textarea = document.querySelector<HTMLTextAreaElement>('.markdown-output');
        if (!textarea) {
          throw new Error('テキストエリア要素が見つかりませんでした。');
        }
        textarea.value = markdown;
      },
    );
  });
});

const createArticleMarkdown = (articles: ZennArticleData[]) => {
  return articles
    .map((article) => {
      return `## ${article.emoji}${article.title}\n\nlink🔗 : https://zenn.dev${article.url}\n`;
    })
    .join('\n');
};

```

これで `conten_script` で取得した Zenn の記事を Markdown 形式で貼り付けることが出来ました。

実装は以上になります！

## ビルド

dist フォルダの内容が開発環境用になっているため、一度フォルダごと削除しましょう。

```bash
rm -rf dist/
```

削除後に以下のコマンドを実行します。

```bash
pnpm run build
```

問題なければビルド後のファイルが作成されていると思いますが、私はこのようなエラーが発生しました。

```bash
$ pnpm run build

> chrome-extension-vite-sample@0.0.0 build C:\Users\xxxx\Documents\dev\projects\chrome-extension-vite-sample
> tsc && vite build

vite v5.2.13 building for production...
✓ 7 modules transformed.
[crx:content-script-resources] Error: vite manifest is missing
    at Object.renderCrxManifest (file:///C:/Users/xxxx/Documents/dev/projects/chrome-extension-vite-sample/node_modules/.pnpm/@crxjs+vite-plugin@1.0.14_vite@5.2.13/node_modules/@crxjs/vite-plugin/dist/index.mjs:3240:21)
    at Object.generateBundle (file:///C:/Users/xxxx/Documents/dev/projects/chrome-extension-vite-sample/node_modules/.pnpm/@crxjs+vite-plugin@1.0.14_vite@5.2.13/node_modules/@crxjs/vite-plugin/dist/index.mjs:2922:60)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async Bundle.generate (file:///C:/Users/xxxx/Documents/dev/projects/chrome-extension-vite-sample/node_modules/.pnpm/rollup@4.18.0/node_modules/rollup/dist/es/shared/node-entry.js:18153:9)
    at async file:///C:/Users/xxxx/Documents/dev/projects/chrome-extension-vite-sample/node_modules/.pnpm/rollup@4.18.0/node_modules/rollup/dist/es/shared/node-entry.js:20692:27    
    at async catchUnfinishedHookActions (file:///C:/Users/xxxx/Documents/dev/projects/chrome-extension-vite-sample/node_modules/.pnpm/rollup@4.18.0/node_modules/rollup/dist/es/shared/node-entry.js:20119:16)
    at async build (file:///C:/Users/xxxx/Documents/dev/projects/chrome-extension-vite-sample/node_modules/.pnpm/vite@5.2.13/node_modules/vite/dist/node/chunks/dep-DEPSZ3SS.js:68740:22)
    at async CAC.<anonymous> (file:///C:/Users/xxxx/Documents/dev/projects/chrome-extension-vite-sample/node_modules/.pnpm/vite@5.2.13/node_modules/vite/dist/node/cli.js:842:9)     
x Build failed in 80ms
error during build:
[crx:manifest-post] Error in crx:content-script-resources.renderCrxManifest
    at Object.generateBundle (file:///C:/Users/xxxx/Documents/dev/projects/chrome-extension-vite-sample/node_modules/.pnpm/@crxjs+vite-plugin@1.0.14_vite@5.2.13/node_modules/@crxjs/vite-plugin/dist/index.mjs:2933:19)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async Bundle.generate (file:///C:/Users/xxxx/Documents/dev/projects/chrome-extension-vite-sample/node_modules/.pnpm/rollup@4.18.0/node_modules/rollup/dist/es/shared/node-entry.js:18153:9)
    at async file:///C:/Users/xxxx/Documents/dev/projects/chrome-extension-vite-sample/node_modules/.pnpm/rollup@4.18.0/node_modules/rollup/dist/es/shared/node-entry.js:20692:27    
    at async catchUnfinishedHookActions (file:///C:/Users/xxxx/Documents/dev/projects/chrome-extension-vite-sample/node_modules/.pnpm/rollup@4.18.0/node_modules/rollup/dist/es/shared/node-entry.js:20119:16)
    at async build (file:///C:/Users/xxxx/Documents/dev/projects/chrome-extension-vite-sample/node_modules/.pnpm/vite@5.2.13/node_modules/vite/dist/node/chunks/dep-DEPSZ3SS.js:68740:22)
    at async CAC.<anonymous> (file:///C:/Users/xxxx/Documents/dev/projects/chrome-extension-vite-sample/node_modules/.pnpm/vite@5.2.13/node_modules/vite/dist/node/cli.js:842:9)     
 ELIFECYCLE  Command failed with exit code 1.
```

検索すると同じような内容で困っている人がいたので、内容を確認していきます。

https://github.com/crxjs/chrome-extension-tools/issues/846

> I am also seeing this on Vite 5. It is because Vite 5 renamed the manifest file to `.vite/manifest.json`, but `@crxjs/vite-plugin` tries to look for it at `manifest.json`.
> 
> 
> Here is a workaround that appears to work (in your `vite.config.ts`):
> 
> 訳：Vite 5でもこの現象が見られます。Vite 5がマニフェストファイルを.vite/manifest.jsonにリネームしたためですが、@crxjs/vite-pluginはmanifest.jsonでマニフェストを探そうとします。
> 
> 以下は、(vite.config.tsで)動作するように見える回避策です
> 

どうやら `crxjs/vite-plugin` の問題だそうで解決策を追加して再ビルドしていきます。

記事と異なる部分は `Plugin` ではなく `PluginOption` を使用しています。

```tsx vite.config.ts
import { PluginOption, defineConfig } from 'vite';
import { crx, defineManifest } from '@crxjs/vite-plugin';

// IssueではPluginだが非推奨のため、PluginOptionを使う
const viteManifestHackIssue846: PluginOption & {
  renderCrxManifest: (manifest: any, bundle: any) => void;
} = {
  // Workaround from https://github.com/crxjs/chrome-extension-tools/issues/846#issuecomment-1861880919.
  name: 'manifestHackIssue846',
  renderCrxManifest(_manifest, bundle) {
    bundle['manifest.json'] = bundle['.vite/manifest.json'];
    bundle['manifest.json'].fileName = 'manifest.json';
    delete bundle['.vite/manifest.json'];
  },
};

const manifest = defineManifest({
  manifest_version: 3,
  name: 'Chrome拡張機能の練習',
  version: '1.0.0',
  description: 'Zenn投稿するChrome拡張機能のサンプルです。',
  content_scripts: [
    {
      matches: ['https://zenn.dev/topics/*'],
      js: ['src/content.ts'],
    },
  ],
  action: {
    default_popup: 'index.html',
  },
});

export default defineConfig({
  plugins: [viteManifestHackIssue846, crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});

```

```bash
$ pnpm run build

> chrome-extension-vite-sample@0.0.0 build C:\Users\NOkud\Documents\dev\projects\chrome-extension-vite-sample
> tsc && vite build

vite v5.2.13 building for production...
✓ 7 modules transformed.
dist/assets/content-script-loader.content.ts--y4Rf8cA-BpTtEgtd.js  0.20 kB
dist/manifest.json                                                 0.58 kB │ gzip: 0.36 kB 
dist/index.html                                                    0.95 kB │ gzip: 0.48 kB 
dist/assets/content.ts--y4Rf8cA.js                                 0.74 kB │ gzip: 0.58 kB 
dist/assets/index.html-_Dl5P9dK.js                                 1.29 kB │ gzip: 0.83 kB 
✓ built in 89ms
```

無事にビルドできました！

作成されたのを確認後、再度拡張機能が実行できるか確認します。

![ビルド後のChrome拡張機能でZenn記事がMarkdown形式に変換されている画面](https://storage.googleapis.com/zenn-user-upload/c1e5370b4dc5-20240613.png)


無事実行できていますね！

もし読み込めなかったり拡張機能でデータが取得できなかったら、一度 `chrome://extensions/` を開いて拡張機能を削除したあと、`manifest.json` があるフォルダを選択し直してください。

今回は Chrome Web Store へ作成した拡張機能を登録するところまでは行いませんが、気になる人はこちらの記事が分かりやすく書かれてたためご確認ください！

[Chrome拡張機能の申請手順 - Qiita](https://qiita.com/sasao3/items/0606b67da01948ae58b7)

## 終わりに

今回のソースコードや参考になった記事を掲載します。

## ソースコード

https://github.com/Suntory-N-Water/chrome-extension-vite-sample

## 参考になった記事

https://zenn.dev/7oh/scraps/98d5cdcceb9bd8

https://dev.classmethod.jp/articles/eetann-chrome-extension-by-crxjs/

https://github.com/crxjs/chrome-extension-tools/issues/846

https://qiita.com/sasao3/items/0606b67da01948ae58b7

## 追記(2024/11/09)

この記事を公開したとき `@crxjs/vite-plugin` のバージョンが `2.0.0-beta.23` でした。
下記 issue でもある通り、拡張機能が動かなくなってしまいます。

https://github.com/crxjs/chrome-extension-tools/issues/946

同様の事象が起きているのであれば、パッケージのバージョンを `^2.0.0-beta.28` にすることで解消できます。
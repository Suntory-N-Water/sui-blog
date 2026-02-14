---
title: Next.js App RouterとPagefindで爆速のサイト内検索を実装する
slug: nextjs-pagefind-implementation
date: 2025-11-22
modified_time: 2025-11-22
description: Next.js (App Router) のブログに Pagefind で全文検索機能を実装する手順を紹介します。public ディレクトリへのインデックス出力設定や、クライアントサイドでの動的インポートなど、実装に必要なポイントをコード付きで解説します。
icon: 🔦
icon_url: /icons/flashlight_flat.svg
tags:
  - Next.js
  - Pagefind
  - React
---
## はじめに

最近、ブログのアーキテクチャを MDX から Markdown ベースのシンプルな構成へ移行しました。
それに伴い、過去の記事をすべてこのブログに集約した結果、記事数は 90 ページを超える規模になりました。

正直なところ、自分で過去の記事を読み返すことはあまりないのですが、今後も知見を書き溜めていく上で検索機能が必要だと感じ、ブログ検索機能を作成することにしました。

調査を進めると、ビルド時に静的インデックスを作成し、クライアントサイドで検索を実行する **Pagefind** というライブラリが非常に優秀であることが分かりました。
有名な技術ブログでも採用されており、静的サイトにおける検索機能として一定の信頼性があると判断しました。

https://pagefind.app/

今回は、Next.js (App Router) 環境に Pagefind を導入する手順を紹介します。

## セットアップ

Pagefind は、静的サイトジェネレータ(SSG)で生成された HTML ファイルを解析し、検索用インデックスを作成します。
今回はランタイムに **Bun** を使用しているため、`package.json` のスクリプトは以下のようになります。

```json package.json
{
  "scripts": {
    "dev": "bun run --bun next dev",
    "build": "bun run --bun next build",
    "postbuild": "pagefind --site .next --output-path public/pagefind",
    "start": "next start"
  }
}
```

上記のコマンドでは、`postbuild` フックを使って Next.js のビルド成果物(`.next`)をスキャンし、インデックスの出力先(`--output-path`)を `public/pagefind` に指定しています。

通常、SSG であればビルド成果物の中に含めてしまえば良いのですが、Next.js の場合、**`public` ディレクトリ配下に置いたファイルが静的アセットとして配信される**という仕様があります。

https://nextjs.org/docs/app/api-reference/file-conventions/public-folder

ここにインデックスファイルや `pagefind.js` を出力することで、ブラウザ(クライアントサイド)から `/pagefind/pagefind.js` として直接アクセスが可能になり、スムーズに検索スクリプトをロードできます。

実際にこのブログで検索したときのデモです。見ての通り爆速で記事検索ができていることが確認できます。
![Pagefindによるブログ検索のデモ](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/b88b12b125263c0895529d4a4c487cec.gif)

## 実装時の注意点

Next.js (webpack) の環境では、ビルド時に存在しないファイルを import しようとするとエラーになります。
Pagefind のスクリプトは `postbuild` で生成されるため、`/* webpackIgnore: true */` を指定して webpack のバンドル対象から外し、ブラウザランタイムで直接 `public` ディレクトリから読み込むようにしています。

https://www.petemillspaugh.com/nextjs-search-with-pagefind

また、Pagefind は `.next` ディレクトリ内の成果物をスキャンするため、検索結果の URL が `/server/app/blog/post-1.html` のような内部パスで返却されます。
実際に開発者ツールを確認して、`/blog/github-actions-security-basics-minimum-measures` の URL を見てみると、`server/app/blog/github-actions-security-basics-minimum-measures.html` と想定とは異なるファイルパスが設定されていることが確認できます。
![開発者ツールで確認したPagefind検索結果の内部パス](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/c70a42ae51a45bae56abc80dbff9c5fa.png)
このパスになっていると、実際に画面遷移した際にページが見つからず、404 エラーとなってしまうので、以下のようなコードで `/server/app/` と `.html` 拡張子も削除します。

```ts
function normalizePagefindUrl(pagefindUrl: string): string {
  // `/server/app/`を削除して、`.html`拡張子も削除
  return pagefindUrl
    .replace(/^\/server\/app\//, '/') // /server/app/ を削除
    .replace(/\.html$/, ''); // .html を削除
}
```

## 検索ノイズの除去

ブログ全体を検索対象にしたい一方で、トップページにある「自己紹介」などが検索結果に出てくるとノイズになります。
Pagefind は `data-pagefind-ignore` 属性を付与することで、特定の要素をインデックス対象から除外できます。

https://pagefind.app/docs/indexing/

私のブログでは以下のように自己紹介を記載しているページがあります。この部分は検索の対象外にしたいため、親要素に `data-pagefind-ignore` を設定します。

```tsx src/app/page.tsx
<div data-pagefind-ignore>
  <h1 className='pb-6 text-4xl font-semibold tracking-wide md:text-[40px]'>
    私について
  </h1>
  <div className='mt-4 space-y-1'>
    <h2 className='text-2xl font-semibold'>スイ</h2>
    <p>
      東京都で活動するエンジニア。名前の由来は、目の前にあったサントリーの天然水から命名しています。
    </p>
    <p>健康第一をモットーにしており、一年以上ほぼ毎日朝活🌅しています。</p>
  </div>
</div>
```

実際に設定してみると、設定前ではトップページの内容が検索にヒットしてしまいますが、設定後は自己紹介文に含まれる単語を検索しても、検索対象外になっていることが確認できます。

### 設定前
![data-pagefind-ignore設定前のトップページが検索にヒットしている様子](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/8f4949975dc063aab43f629ef639761d.png)

### 設定後
![data-pagefind-ignore設定後にトップページが検索対象外になった様子](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/5dc0f66cc24dff699d786a2c948d4039.png)

## まとめ
- Pagefind はビルド時に静的インデックスを作成し、クライアントサイドで検索を実行する検索機能ライブラリ
- `webpackIgnore` を使って動的にスクリプトを読み込む
- `public` ディレクトリ経由で静的アセットとして配信する
- 内部パスを正規化して正しい URL に変換する

## 参考

https://liginc.co.jp/647675

https://azukiazusa.dev/blog/static-site-search-engine-and-ui-library-pagefind/

https://mh4gf.dev/articles/pagefind-with-app-router

https://www.petemillspaugh.com/nextjs-search-with-pagefind

## おまけ

作成したコードを載せてもよかったのですが、フロントエンドを触るのが久しぶりすぎたので気になる人だけ見てください…(結構汚いです)
本当は検索で引っかかった記事アイコンのキャッシュとかもできたらよいですね。

https://github.com/Suntory-N-Water/sui-blog/blob/main/src/components/feature/search/search-dialog.tsx
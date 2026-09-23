---
title: ブログを Astro の SSG から EmDash へ移行しました
slug: blog-migrate-astro-emdash
date: 2026-09-23
modified_time: 2026-09-23
description: Astro の静的サイト生成で運用していたこのブログを、Cloudflare 上で動く CMS の EmDash へ移行しました。移行した理由と、移行後に行ったキャッシュや読み込み量の調整を簡単にまとめています。
icon: 🚚
icon_url: /icons/delivery_truck_flat.svg
tags:
  - Astro
  - Cloudflare
  - EmDash
---

タイトルにもある通り、このブログを Astro の静的サイト生成（SSG）から EmDash へ移行しました。EmDash は Astro 上に構築されたブログ CMS で、Cloudflare Workers、D1、R2 の上で動きます。

特に大きな理由はないのですが、Astro や Cloudflare のサービスを全面的に使ってみたいと思ったときに、SSG で静的なファイルを配信するだけでは全ての機能を活かしきれないと考えました。EmDash の成長を追いかけたいという思いもあり、今回の移行を決めました。

移行するコンテンツの量はそれほど多くないため、移行作業自体で特につまずくことはありませんでした。ただし、EmDash のキャッシュまわりにはまだ手を入れる余地がありそうで、その辺のチューニングは適宜行いました。

## CMS を使ってみたかった理由

CMS をもう少し触ってみたかったという理由もあります。

過去に microCMS を少しだけ触っていたのですが、どうにも相性が合わず、個人的には使い心地もあまり良くありませんでした。それならローカルにある Markdown ファイルをそのまま表示できる仕組みにすればいいと考え、以前 Next.js から Astro へブログを移行しました。この移行の経緯は 2025 年 12 月の記事「[Next.js から Astro へ。拡張性を捨て、シンプルさを選んだ理由](/blog/migrating-nextjs-to-astro)」で書いています。

そこから紆余曲折あって、ブログの構成は特に手を入れずにそのままにしていました。ただ、AI がこれだけ開発に使われている中で、AI ネイティブな開発を個人開発だけでなく複数人での開発や実務で運用したときにどういった部分が問題になるのかを学びたいと考えました。その題材として、Cloudflare ネイティブの CMS である EmDash を使うことにしました。EmDash の CLI と MCP サーバーから記事を書かせてみた内容は、2026 年 9 月の記事「[EmDash の CLI と MCP の両方で記事を書かせてみる](/blog/tried-emdash-cli-and-mcp)」にまとめています。

まだ発展途上な部分はありますが、ほとんどの機能は Astro で作っていたときと遜色なく使えています。

## 移行後に調整したキャッシュと読み込み量

EmDash は全てのページをリクエストのたびにサーバーで描画します。SSG のときは事前に生成した HTML を配信するだけだったため、移行直後は記事一覧や記事ページの表示が遅くなりました。ここでは、移行後に行った調整を簡単に紹介します。

### ページキャッシュの有効期間を 5 分にする

Astro のルートキャッシュを Cloudflare 向けのプロバイダーで有効にし、記事や一覧のページを一定時間キャッシュするようにしました。

```js astro.config.mjs
import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import { defineConfig } from "astro/config";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	cache: {
		provider: cacheCloudflare(),
	},
	routeRules: {
		"/": { maxAge: 300, swr: 86400 },
		"/blog": { maxAge: 300, swr: 86400 },
		"/blog/[slug]": { maxAge: 300, swr: 86400 },
		"/blog/ogp/[slug].png": { maxAge: 86400, swr: 604800 },
	},
});
```

記事系のルートは `maxAge` を 300 秒（5 分）に留めています。Workers のキャッシュには記事を公開したときに自動で破棄する仕組みがないため、長くすると更新が反映されるまでの時間も延びてしまうためです。

また、Cloudflare は `Cache-Control` ヘッダーのないレスポンスを一定時間キャッシュする挙動を持っています。検索結果のページと 404 ページがキャッシュされないように、この 2 つには `no-store` を明示しました。

### 画像のブラウザキャッシュを 1 時間にする

EmDash は配信する画像に `max-age=0, must-revalidate` を設定し、`ETag` も `Last-Modified` も付与しません。このため、ブラウザは再検証しても `304 Not Modified` を受け取れず、毎回画像の全データを取得し直していました。このブログの記事一覧には約 110 個のアイコンが並ぶため、一覧を表示するたびに 110 回の Worker 呼び出しと D1 へのアクセスが発生していました。

EmDash にはこの値を変える設定項目がないため、EmDash の `middleware.outer` に登録したミドルウェアでレスポンスヘッダーを上書きし、ブラウザで 1 時間キャッシュされるようにしました。

### 記事一覧と日本語フォントの読み込み量を減らす

記事一覧は全 130 件を 1 回のクエリで取得していました。EmDash の `getEmDashCollection` は取得する列を絞れず本文まで読み込むため、1 リクエストあたり 3.19MB を D1 から転送しており、そのうち 2.97MB が本文でした。一覧を 1 ページ 20 件に分割して転送量を減らしています。

日本語フォントの Noto Sans JP は、文字の範囲ごとに 121 個のファイルに分割されています。これに `preload` を付けていたため、全ページで 121 個全てのファイル（合計 5.22MB）を取得していました。`preload` を外し、ページに出現する文字に対応するファイルだけを取得するようにしています。

### KV をやめて D1 に保存する

最初は EmDash の `objectCache` に Workers KV を指定し、取得したデータを KV にキャッシュしていました。本文中のリンクプレビュー（リンク先のタイトルや画像）も KV に保存していましたが、KV の読み出しが遅いときに備えて 2 秒で打ち切る処理を入れるなど、読み出し時間の調整が必要でした。

最終的には `objectCache` を外して EmDash が D1 から直接読む構成に戻し、リンクプレビューの保存先も KV から D1 に移しました。あわせて、コードブロックのハイライトや Mermaid 図を描画した結果の HTML も D1 に保存し、次のリクエストでは描画をやり直さずに再利用するようにしています。

## Cloudflare の Workers Paid プランで使えるサービス

ここからはブログの移行とは少し異なる話です。

Cloudflare は、月額 5 ドルからの Workers Paid プランに入るだけで、この価格でこんなにいろいろなことを試していいのかと思うほど多くのサービスを利用できます。今回使った Workers、D1、R2、KV もこのプランの範囲で使えています。

正直、個人開発者は Codex や Claude Code の月 100 ドル程度のプランに加えて Cloudflare に少し課金するだけで、普通に Web サービスを作れます。いい時代になったと思います。

私自身、Cloudflare のサービスをまだ十分に使いこなせていないと感じています。EmDash の発展を追いかけつつ、Cloudflare で面白そうなものがあればどんどん触っていきたいと思っています。

## 参考

- [emdash-cms/emdash - GitHub](https://github.com/emdash-cms/emdash)
- [Create your first EmDash site | EmDash](https://docs.emdashcms.com/)
- [Pricing · Cloudflare Workers docs](https://developers.cloudflare.com/workers/platform/pricing/)

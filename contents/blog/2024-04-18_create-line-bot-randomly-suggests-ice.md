---
title: Honoでランダムにアイスクリームを提案するLINE BOTを作る
slug: create-line-bot-randomly-suggests-ice
date: 2024-04-18
modified_time: 2024-04-18
description: Hono + Cloudflare Workersを使用してランダムにアイスクリームを提案するLINE BOTを作成しました。チョコモナカジャンボに変わる新しい最強のアイスクリームを見つけることをコンセプトに、技術選定から実装までを解説します。
icon: 🍨
icon_url: /icons/ice_cream_flat.svg
tags:
  - CloudflareWorkers
  - LineMessagingAPI
  - Hono
---

## はじめに
コンビニのアイスクリームで CMJ(チョコモナカジャンボ)が味、食感、満足感など様々な点で最強すぎることに気づいた。
アイスクリームを食べるときはほぼ必ず CMJ しか食べなくなってしまったため、今回は新しい最強のアイスクリームを見つけるをコンセプトに、ランダムでアイスクリームを提案してくれる LINE BOT を作成する。

## コンセプト
- CMJ に変わる新しい最強のアイスクリームを見つける
- 熱いと話題の Hono を触ってみる
- ついでに Hono と相性が良い Cloudflare Workers も使って API サーバーを構築する

## できたもの

### デモ
![LINEボットにメッセージを送るとアイスクリーム情報が返信されるデモ動画](https://storage.googleapis.com/zenn-user-upload/7b84bafc78ef-20240418.gif)


### QR

https://liff.line.me/1645278921-kWRPP32q/?accountId=462wexvg

### リポジトリ(README編集中)

https://github.com/Suntory-N-Water/I-scream



## フロー
1. ユーザーが「今日のアイスクリーム」と送信
2. アイスクリーム情報(商品画像、商品名、商品価格)を返却

## 観点
まず終わらせろの精神にもとづき、必要最低限の実装をした。
- セブンイレブンで提供されている商品かつ関東地方
- 特定のメッセージに対してのみ返信

1 個ずつ解説します。

## セブンイレブンで提供されている商品かつ関東地方

セブンイレブンで提供されている商品かつ、関東地方に場所を限定した。

セブンイレブンに絞った理由は以下の通りです。
### 情報が1ページにまとまっていること

まずはじめにユーザーへ返却する情報は以下と定義した。

- 商品画像
- 商品名
- 商品価格

この 3 つさえあればブラウザで商品の検索や、店舗へ行って探すときに困らないと判断した。

またこれらのデータはブラウザからスクレイピングする必要があるため、取得するコードを楽に書きたかったこともあり情報が 1 ページで表示されているものを選んだ。

### 自社ブランド以外の商品がある

大手コンビニ各社では自社ブランド(セブンプレミアム、ファミマル、ローソンセレクト)を展開しているが、一部コンビニの商品サイトにパルムやスーパーカップなど大手メーカーのアイスクリームが一覧として表示されていない。
今回は CMJ を越える最強のアイスクリームを発見することが目的なので、自社ブランドしか提供していないコンビニは対象から外すことにした。

### 店舗数が多いこと

コンビニのアイスクリームに絞った以上、店舗数が多いほうが最強のアイスクリームを探しやすいと判断した。

### 拡張性

今回は作成規模の関係で関東地方のアイスクリームしか検索の対象にしていないが、関西のアイスクリームやスイーツも対象にしたいなど、様々な要件に対応できるコンビニが適切と判断した。

## 特定のメッセージにのみ返信する

本当は UIUX などユーザー体験を高めるために細かいところまで気を配りたかったが、それをするとまた面倒くさくなってリリースできないことをリスクと考えた。
今回は「今日のアイスクリーム」と送信するだけでアイスクリームの情報を提供できるようにした。



## 作成後の感想

## 追加で実装したい部分

### cron triggersを使ったデータの自動更新

私が確認した限り、毎週火曜日午前 7 時時点でセブンイレブンの新商品が更新されている。
朝からアイスクリームを食べる人は少ないであろう読みで、毎週火曜日午前 7 時にアイスクリームの情報洗い替えすることで、最新のアイスクリーム情報を提供できる仕組みを作成したい。

こちらが参考になると思い進めているが、なぜか `kv_namespaces` の値が取得できず詰まってしまったので、定期実行は一度保留にしてリリースすることを優先させた。

https://zenn.dev/toraco/articles/55f359cbf94862


## 技術的な部分

簡単な実装しかしていないが Hono のユーザー体験が良く、直感的に API を作成できた。
Cloudflare Workers との相性もよく、爆速でデプロイできることからも小規模アプリであれば尚更使いやすいんじゃないかなと感じた。
LINE Messaging API でのアプリ？開発も始めてでしたが、公式ドキュメントが総じて分かりやすく Flex Message の作成も GUI 上で行うことができたので触りとしてはちょうどよかった。

定期実行のエンドポイントにはアクセスを極力させたくないため `Bearer Auth` で認証を設けています。
```ts src/index.ts
import { Context, Hono } from 'hono';
import { router } from './api';
import { prettyJSON } from 'hono/pretty-json';
import { Bindings } from './types';
import { bearerAuth } from 'hono/bearer-auth';
import { doSomeTaskOnASchedule } from './model';

const app = new Hono();
app.use('/', prettyJSON());
app.use(
  '/scheduled',
  async (
    c: Context<{
      Bindings: Bindings;
    }>,
    next,
  ) => {
    const token = c.env.BEARER_TOKEN;
    const auth = bearerAuth({ token });
    return auth(c, next);
  },
);
app.route('/', router);
const scheduled: ExportedHandlerScheduledHandler<Bindings> = async (event, env, ctx) => {
  ctx.waitUntil(doSomeTaskOnASchedule(env.API_URL, env.BEARER_TOKEN));
};
export default {
  fetch: app.fetch,
  scheduled,
};

```

```ts src/model.ts
/**
 *
 * @description スケジューリング関数。定時になったら指定されたAPIを叩く
 * @param {string} apiUrl
 */
export const doSomeTaskOnASchedule = async (apiUrl: string, token: string) => {
  await fetch(`${apiUrl}/scheduled`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }).catch((err) => {
    console.log(`LINE API error: ${err}`);
    return null;
  });
};
```



## おわりに

CMJ を越えるアイスクリームを見つけられますように🍨

## 参考にした記事など

https://developers.line.biz/ja/docs/messaging-api/sending-messages/


https://github.com/YuheiNakasaka/line-bot-cf-worker-sample


https://zenn.dev/toraco/articles/55f359cbf94862


https://zenn.dev/azukiazusa/articles/hono-cloudflare-workers-rest-api


https://qiita.com/TellMin/items/62893ec24f8e90a18dec

## 補足(2024年4月20日更新)
以下の内容を追加
- cron triggers を使ったデータの自動更新
- リッチメニューの追加
- 「今日のアイスクリーム」以外の内容を受け取ったときに返答する自動メッセージを追加
- 認証周りの内容
- 参考記事を追加

![今日のアイスクリーム以外の入力に対する自動応答メッセージの表示例](https://storage.googleapis.com/zenn-user-upload/5c15f8224586-20240420.png)
*今日のアイスクリーム以外の応答メッセージ*
![LINEボットのリッチメニューUI表示例](https://storage.googleapis.com/zenn-user-upload/1e0b2366b806-20240420.png)
*リッチメニュー*
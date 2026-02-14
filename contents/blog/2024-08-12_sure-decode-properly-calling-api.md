---
title: API叩くときはしっかりデコードしよう
slug: sure-decode-properly-calling-api
date: 2024-08-12
modified_time: 2024-08-12
description: Hono + LINE Messaging APIを使ったコンビニスイーツ提供BOTで、HTMLエンティティのデコードを忘れたことで発生したエラーと、その解決方法を解説します。APIを叩く際のデータ処理の重要性を学びます。
icon: 😥
icon_url: /icons/sad_but_relieved_face_flat.svg
tags:
  - HTML
  - Decode
  - LineMessagingAPI
  - Hono
---

## 概要
Hono + LINE Messaging API を使ってコンビニスイーツをランダムに提供する LINE BOT を動かしていたら、あるときローソンの新商品が取得できない事象が発生しました。

![LINEチャットでローソン新商品を問い合わせたが返信がない画面](https://storage.googleapis.com/zenn-user-upload/eb0903156c29-20240812.png)
*ローソンの新商品と入力すれば、新商品が返信されるのに返信されない*

LINE Messaging API のエラーレスポンスを見ると下記メッセージが送信されており、リクエストボディの内容が不正だったことが分かります。
```bash
A message (messages[0]) in the request body is invalid
(訳 : リクエストボディのメッセージ(messages[0])が無効である。)
```

## 結論
デコード処理が充分ではなかったことが原因でした。
この LINE BOT では事前にセブンイレブン、ローソン、ファミリーマートの新商品情報を Cloudflare Workers KV に登録しておき、「〇〇(コンビニ名)の新商品」と LINE からメッセージを送信することで KV から新商品の情報を返却します。

KV への事前登録時には `HTMLRewriter()` を使用して各企業ページの html を解析して KV に登録しておりますが、html のデコード処理が充分ではなかったことが原因です。

```ts
parseName(text: string): string {
    return text
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim();
}
```

## リクエストボディを見返してみる

正常終了したセブンイレブンのリクエストボディとローソンのリクエストボディを比較して見ると、明らかにおかしい文字(`&eacute;`)がいますね..。

```json セブンイレブン.json
[
  {
    "id": "SevenEleven109ace55-73dd-4d84-8a3e-17df30884325",
    "itemName": "ホイップで食べる　コーヒーわらび餅",
    "itemPrice": "270円(税込291.60円)",
    "itemImage": "https://img.7api-01.dp1.sej.co.jp/item-image/112483/F85269A8CE1D29DE2AA4012549A9D8A6.jpg",
    "itemHref": "https://www.sej.co.jp/products/a/item/112483/kanto/",
    "storeType": "SevenEleven",
    "metadata": {
      "isNew": true,
      "releasePeriod": "this_week"
    }
  },
  {
    "id": "SevenEleven62cac584-88bf-4a74-b758-e164cba77c31",
    "itemName": "ホイップだけどら",
    "itemPrice": "178円(税込192.24円)",
    "itemImage": "https://img.7api-01.dp1.sej.co.jp/item-image/112482/C81899C7EB0877B9423CF47CCEDFF31C.jpg",
    "itemHref": "https://www.sej.co.jp/products/a/item/112482/kanto/",
    "storeType": "SevenEleven",
    "metadata": {
      "isNew": true,
      "releasePeriod": "this_week"
    }
  }
]
```

```json ローソン.json
[
  {
    "id": "Lawson0c75b876-b3d1-4c5a-8d03-3cf9b2c1b5c3",
    "itemName": "Uchi Caf&eacute;×猿田彦珈琲　カフェラテロールケーキ(コーヒーゼリー入り)",
    "itemPrice": "268円(税込)",
    "itemImage": "https://www.lawson.co.jp/recommend/original/detail/img/l763344.jpg",
    "itemHref": "https://www.lawson.co.jp/recommend/original/detail/1490171_1996.html",
    "storeType": "Lawson",
    "metadata": {
      "isNew": true,
      "releasePeriod": "this_week"
    }
  },
  {
    "id": "Lawson101f97c7-d5de-49d9-ae0d-0247c3c8d6e9",
    "itemName": "Uchi Caf&eacute;×猿田彦珈琲　カフェラテどらもっち",
    "itemPrice": "235円(税込)",
    "itemImage": "https://www.lawson.co.jp/recommend/original/detail/img/l760181.jpg",
    "itemHref": "https://www.lawson.co.jp/recommend/original/detail/1490172_1996.html",
    "storeType": "Lawson",
    "metadata": {
      "isNew": true,
      "releasePeriod": "this_week"
    }
  }
]
```

## 解決策
手動デコードを行っていたため、HTML エンティティのエンコードとデコードをサポートする `html-entities` を導入しました。

```bash
pnpm add html-entities
```

```ts
parseName(text: string): string {
    return decode(text).trim();
}
```

再度「ローソンの新商品」を送信したところ、正常にデコードできていることが確認できました🎉
![デコード修正後にローソン新商品情報が正常に返信されている画面](https://storage.googleapis.com/zenn-user-upload/346f54dc7acb-20240812.png)

## 学び

デコードされていない文字列を API で許可してしまうことは、一般的にセキュリティ上のリスクを伴います。

## クロスサイトスクリプティング(XSS)のリスク
デコードされていない文字列がそのまま受け入れられると、特に Web アプリケーションでは XSS 攻撃に対して脆弱になる可能性があります。
例えば、`<script>` タグや他の HTML エンティティがエスケープされないままブラウザでレンダリングされると、悪意のあるスクリプトが実行されてしまう危険があります。

## SQLインジェクションのリスク
デコードされていない文字列が API を通じてデータベースに渡された場合、SQL インジェクションのリスクが高まります。
これは、攻撃者がデコードされていない文字列を利用して、データベースのクエリを不正に操作する可能性があるためです。

## データ汚染のリスク
デコードされていない文字列がデータベースや他のストレージシステムに保存されると、後で取り出した際にデータが汚染されている可能性があります。
これにより、アプリケーションの正常な動作が妨げられるだけでなく、さらにセキュリティリスクが生じる可能性があります。

## 不正なリクエスト操作のリスク
デコードされていない文字列がそのまま API で許可されると、攻撃者が意図的に特殊文字を含むリクエストを送信し、API の動作を不正に操作するリスクがあります。
特に URL やクエリパラメータ内での処理において、このリスクは顕著です。

## まとめ
デコード処理の不足が原因で、API リクエストが不正とされる問題に直面しましたが、適切なデコード処理を導入することで解決に至りました。
この経験から学べるのは、API や Web アプリケーションを開発する際にはデータの取り扱いにおいて細心の注意が必要ですね。

以上になります👊
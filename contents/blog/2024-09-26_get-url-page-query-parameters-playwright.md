---
title: Playwrightでクエリパラメータが付与されているページのURLを取得する
slug: get-url-page-query-parameters-playwright
date: 2024-09-26
modified_time: 2024-09-26
description: Playwrightでクエリパラメータが付与されているページのURLを取得する方法を解説します。page.on()メソッドでネットワークを監視する方法を紹介します。
icon: 👺
icon_url: /icons/goblin_flat.svg
tags:
  - テスト
  - Playwright
  - E2E
---

## 結論
`page.on()` メソッドでネットワークを監視して、特定の URL だけを取得すれば可能です。

```tsx
    // 現在のURLを取得する
  page.on('response', async (response) => {
    // レスポンスURLを取得する
    const responseURL = response.url();
    console.log('🚀 ~ page.on ~ response:', response);
  });
```

## 確認方法
`response.url` の内容は Chrome DevTools のリクエスト URL を見れば確認できます。

![Chrome DevToolsネットワークタブでHTTPリクエスト一覧が表示されている画面](https://storage.googleapis.com/zenn-user-upload/d221c61acde1-20240926.png)
*Chrome DevTools ネットワークタブの内容*

![Chrome DevToolsでリクエストURLの位置を示している画面](https://storage.googleapis.com/zenn-user-upload/61089d54f0be-20240926.png)
*リクエストURLの位置*

使用例としてはこんな感じで、特定のページ URL(この場合 `inori-track.vercel.app/venue`)の通信だけをフィルタリングし、そこに紐づくクエリパラメータを `searchParams.getAll('hoge');` で取得します。
```tsx
  // 現在のURLを取得する
  page.on('response', async (response) => {
    // レスポンスURLを取得する
    const responseURL = response.url();

    // レスポンスURLがinori-track.vercel.app/venueのものだけを抽出する。
    if (responseURL.match(/inori-track.vercel.app\/venue/g)) {
      const url = new URL(responseURL);
      // クエリパラメータを取得する
      const params = url.searchParams.getAll('live_id');

      // 以下固有の処理なので気にしなくてもOK
      // IDに紐づく会場名を取得する
      const venueList = liveNames.filter((live) => params.includes(live.id));

      // 会場名が画面に表示されていることを確認
      for (const venue of venueList) {
        await expect(page.getByLabel(venue.name)).toBeVisible();
      }
    }
  });
```

## 参考

https://zenn.dev/masa5714/articles/12c917e065a108

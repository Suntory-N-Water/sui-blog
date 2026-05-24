---
title: Google Places API (New)で言語コードを設定せず沼りかけた
slug: i-almost-got-stuck-without-setting
date: 2024-02-23
modified_time: 2024-02-23
description: Google Places API (New)で言語コードを設定せず沼りかけた経験。
icon: 🗺️
icon_url: /icons/world_map_flat.svg
tags:
  - GoogleMapsAPI
  - GoogleCloud
---
## 結論

- 言語コードを設定する
- 公式ドキュメントをしっかり読む

## 経緯

Next.jsでAPIからGoogle Places API (New)を叩こうとしたら、400番エラーになったので沼りかけた

## 実際にやったこと

curlでAPIを叩いたときの例が掲載されており、`"X-Goog-Api-Key: API_KEY"` のAPI_KEYを正しく設定すれば情報を取得できる。

次の例は、circle によって定義された、半径 500 m 以内のすべてのレストランの表示名に対する Nearby Search(New)リクエストを示しています。

``` bash
curl -X POST -d '{
  "includedTypes": ["restaurant"],
  "maxResultCount": 10,
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": 37.7937,
        "longitude": -122.3965},
      "radius": 500.0
    }
  }
}' \
-H 'Content-Type: application/json' -H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.displayName" \
https://places.googleapis.com/v1/places:searchNearby
```

実際に同じようなことをやるAPIを作ってみる

```ts api/map/route.ts
import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { LatLng } from '@/app/types';

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  try {
    const { lat, lng }: LatLng = await req.json();

    const apiKey = config.GOOGLE_MAPS_API_KEY;
    const apiUrl = 'https://places.googleapis.com/v1/places:searchNearby';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey!,
        'X-Goog-FieldMask': 'places.displayName',
      },
      body: JSON.stringify({
        includedTypes: ['restaurant'],
        maxResultCount: 10,
        languageCode: 'ja',
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 500.0,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

```

## 400番エラーになる

ログ出力してみるとこう書いてある。
**言語コード「*」が無効です。https://developers.google.com/maps/faq#languagesupport のサポート言語リストを参照してください"**

``` json
{
  error: {
    code: 400,
    message: "Invalid language code '*'. See the list of supported languages at https://developers.google.com/maps/faq#languagesupport",
    status: 'INVALID_ARGUMENT'
  }
}
```

## 公式ドキュメントを見る

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/3351724/68c3a919-36ae-7057-50f1-374ef07ccb4d.png)

🤔「いや、省略してもいいって書いてあるやん」

## コードを修正する

API作成時のbodyに言語コードを設定したところ、正しく取得できました。

``` ts
  body: JSON.stringify({
    includedTypes: ['restaurant'],
    maxResultCount: 10,
    languageCode: 'ja',
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 500.0,
      },
    },
  }),
```


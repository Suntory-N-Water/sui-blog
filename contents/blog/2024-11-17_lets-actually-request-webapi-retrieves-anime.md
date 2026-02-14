---
title: アニメ情報を取得するWebAPIを実際にリクエストして、比較してみる
slug: lets-actually-request-webapi-retrieves-anime
date: 2024-11-17
modified_time: 2024-11-17
description: アニメ情報を取得するWebAPI(ShangriLa Anime API、Annict API、MyAnimeList API)を実際にリクエストして比較検証しました。各APIの特徴と違いを解説します。
icon: 🪄
icon_url: /icons/magic_wand_flat.svg
tags:
  - API
  - WebAPI
  - アニメ
---

## 話すこと

アニメに関連した Web サイトを作成しようと思うので、前情報としてアニメ情報を取得する API を実際にリクエストして、API ごとにどんな差があるかを検証する試みです。
今回比較するのは下記 3API です。

- ShangriLa Anime API
- Annict API
- MyAnimeList API

他にも API はありましたが、有名どころと手軽に実施できるものを独断と偏見で選択しました。
もしこの投稿を見た人で「こんなのもあるぜ！」と教えていただける人がいらっしゃったら、ぜひコメントにてお伝え下さい🙌

## ShangriLa Anime API

クールごとのアニメ情報を返却してくれる API

https://anime-api.deno.dev/anime/v1/master/2023/1 で 2023 年 1 期(冬期) の作品を返却します。

```json
[
    {
        "id": 1663,
        "title": "アグレッシブ烈子 シーズン5",
        "title_short1": "アグレッシブ烈子",
        "title_short2": "",
        "title_short3": "",
        "title_en": "Aggretsuko (season 5)",
        "public_url": "https://www.sanrio.co.jp/characters/retsuko/",
        "twitter_account": "retsuko_sanrio",
        "twitter_hash_tag": "アグレッシブ烈子",
        "cours_id": 37,
        "created_at": "2022-12-31T21:36:21",
        "updated_at": "2022-12-31T21:36:21",
        "sex": 0,
        "sequel": 5,
        "city_code": 0,
        "city_name": "",
        "product_companies": "ファンワークス"
    },
    {
        "id": 1664,
        "title": "あやかしトライアングル",
        "title_short1": "あやかしトライアングル",
        "title_short2": "",
        "title_short3": "",
        "title_en": "Ayakashi Triangle",
        "public_url": "https://ayakashitriangle-anime.com/",
        "twitter_account": "ayakashi_anime",
        "twitter_hash_tag": "あやトラ",
        "cours_id": 37,
        "created_at": "2022-12-31T21:36:21",
        "updated_at": "2022-12-31T21:36:21",
        "sex": 0,
        "sequel": 0,
        "city_code": 0,
        "city_name": "",
        "product_companies": "CONNECT"
    }
    ...省略
]
```

検索で一番上に出てくるのは `http` ですが、制作者の方が Deno に移行したと発表しています。

https://note.com/akb428/n/n2362a0e1b6af

現在はこちらのリポジトリで稼働しています。

https://github.com/Project-ShangriLa/anime_api_deno

## Annict API

Annict はアニメ視聴記録サービスで、開発者向けに GraphQL API を提供しています。
作品情報、エピソード情報、ユーザーの視聴状況などを取得できます。

- GraphQL を採用し、柔軟なクエリが可能
- 詳細なエピソード情報やスタッフ情報を取得可能
- 個人用アクセストークンによる認証が必要

## REST API

https://api.annict.com/v1/works

リクエストヘッダーに「Authorization: Bearer {token}」でアクセストークンを付与して API を実行します。

```json
{
    "works": [
        {
            "id": 12302,
            "title": "乙女なでしこ恋手帖",
            "title_kana": "",
            "title_en": "",
            "media": "ova",
            "media_text": "OVA",
            "released_on": "",
            "released_on_about": "",
            "official_site_url": "",
            "wikipedia_url": "<https://ja.wikipedia.org/wiki/%E4%B9%99%E5%A5%B3%E3%81%AA%E3%81%A7%E3%81%97%E3%81%93%E6%81%8B%E6%89%8B%E5%B8%96#%E3%82%A2%E3%83%8B%E3%83%A1>",
            "twitter_username": "",
            "twitter_hashtag": "",
            "syobocal_tid": "",
            "mal_anime_id": "13673",
            "images": {
                "recommended_url": "",
                "facebook": {
                    "og_image_url": ""
                },
                "twitter": {
                    "mini_avatar_url": "",
                    "normal_avatar_url": "",
                    "bigger_avatar_url": "",
                    "original_avatar_url": "",
                    "image_url": ""
                }
            },
            "episodes_count": 0,
            "watchers_count": 2,
            "reviews_count": 0,
            "no_episodes": true,
            "season_name": "2012-winter",
            "season_name_text": "2012年冬"
        }
    ]
    ...省略
}

```

## GraphQL

https://api.annict.com/graphql

リクエストヘッダーに「Authorization: Bearer {token}」でアクセストークンを付与して API を実行します。

2024 年冬アニメのタイトルと各話リストを取得する例です(長いので一部省略しています)。

```graphql
{
    searchWorks(seasons: ["2024-winter"]) {
        edges {
            node {
                title
                episodes {
                    nodes {
                        number
                        title
                    }
                }
            }
        }
    }
}

```

```json
{
  "data": {
    "searchWorks": {
      "edges": [
        {
          "node": {
            "title": "イワジュ",
            "episodes": {
              "nodes": []
            }
          }
        },
        {
          "node": {
            "title": "いっしょにあそぼう！くまのプーさん",
            "episodes": {
              "nodes": []
            }
          }
        },
        {
          "node": {
            "title": "映画しまじろう ミラクルじまのなないろカーネーション",
            "episodes": {
              "nodes": []
            }
          }
        },
        {
          "node": {
            "title": "ザ･スパイダー･ウィズイン",
            "episodes": {
              "nodes": []
            }
          }
        },
        {
          "node": {
            "title": "ダンジョン飯",
            "episodes": {
              "nodes": [
                {
                  "number": 14,
                  "title": "シーサーペント"
                },
                {
                  "number": 19,
                  "title": "山姥／夢魔"
                },
                {
                  "number": 5,
                  "title": "おやつ／ソルベ"
                },
                {
                  "number": 13,
                  "title": "炎竜3／良薬"
                },
                {
                  "number": 6,
                  "title": "宮廷料理／塩茹で"
                },
                {
                  "number": 24,
                  "title": "ダンプリング2／ベーコンエッグ"
                },
                {
                  "number": 7,
                  "title": "水棲馬／雑炊／蒲焼き"
                },
                {
                  "number": 20,
                  "title": "アイスゴーレム／バロメッツ"
                },
                {
                  "number": 10,
                  "title": "大ガエル／地上にて"
                },
                {
                  "number": 3,
                  "title": "動く鎧"
                },
                {
                  "number": 8,
                  "title": "木苺／焼き肉"
                },
                {
                  "number": 9,
                  "title": "テンタクルス／シチュー"
                },
                {
                  "number": 12,
                  "title": "炎竜２"
                },
                {
                  "number": 15,
                  "title": "ドライアド／コカトリス"
                },
                {
                  "number": 11,
                  "title": "炎竜１"
                },
                {
                  "number": 22,
                  "title": "グリフィン／使い魔"
                },
                {
                  "number": 16,
                  "title": "掃除屋／みりん干し"
                },
                {
                  "number": 17,
                  "title": "ハーピー／キメラ"
                },
                {
                  "number": 23,
                  "title": "グリフィンのスープ／ダンプリング1"
                },
                {
                  "number": 18,
                  "title": "シェイプシフター"
                },
                {
                  "number": 4,
                  "title": "キャベツ煮／オーク"
                },
                {
                  "number": 1,
                  "title": "水炊き／タルト"
                },
                {
                  "number": 2,
                  "title": "ローストバジリスク／オムレツ／かき揚げ"
                },
                {
                  "number": 21,
                  "title": "卵／黄金郷"
                }
              ]
            }
          }
        }
      ]
    }
  }
}

```

## MyAnimeList API

MyAnimeList(MAL)は 2004 年、米国人のギャレット・ギスラーというアニメ好きの若者が創設した米国の法人名でもあり、同氏がネット上に立ち上げた日本アニメの英語データベースのサイト名です。
API はベータ版ですが提供していました。

内容の前に、トークン取得で手こずったので備忘録として記載します。

## ユーザー登録する

登録後、`Client ID` と `Client Secret` を確認します。

![MyAnimeList APIダッシュボードでClient IDとClient Secretが表示されている画面](https://storage.googleapis.com/zenn-user-upload/af246c1fbb13-20241117.png)

## 認証情報を取得する

MyAnimeList API の認証ドキュメントを確認して、手順に沿ってアクセストークンを発行します。

https://myanimelist.net/apiconfig/references/authorization

`Step 2: Client requests OAuth 2.0 authentication` でクライアントが OAuth 2.0 認証を要求します。
ドキュメントを見るとこのように記載があり、実際に Postman でパラメータを設定したあと、
URL をベタ打ちします。

| Parameter | Description |
| --- | --- |
| response_type | REQUIRED. Value MUST be set to “code”. |
| client_id | REQUIRED. |
| state | RECOMMENDED. [OAuth 2.0 state](https://tools.ietf.org/html/rfc6749#section-4.1.1) |
| redirect_uri | OPTIONAL. If you registered only one redirection URI in advance, you can omit this parameter. If you set this, the value must exactly match one of your pre-registered URIs. |
| code_challenge | REQUIRED. A minimum length of 43 characters and a maximum length of 128 characters. [See the details for the PKCE code_challenge](https://tools.ietf.org/html/rfc7636). |
| code_challenge_method | OPTIONAL. Defaults to plain if not present in the request. Currently, only the plain method is supported. |

URL を組み立てたあとのイメージはこんな感じ
`https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id={client_id}&code_challenge={code_challenge}&code_challenge_method=plain&redirect_uri={redirect_uri}&state={state}`

認証後は `Step 5: MyAnimeList redirects back to the client` で記載のある通り、ユーザー登録後に設定したリダイレクト URL に code と state を付与してリダイレクトされます。

```
MyAnimeList authorization server redirects back to YOUR_REDIRECT_URI.

HTTP/1.1 302 Found
Location: YOUR_REDIRECT_URI?code=AUTHORIZATION_CODE
&state=YOUR_STATE

```

| Parameter | Description |
| --- | --- |
| code | The authorization code returned from the initial request. Normally, this value is nearly 1,000 bytes long. |
| state | The state value you send the request with. |

リダイレクトに成功したらアクセストークンを発行します。
Postman から POST リクエストを送信するので、`Scheme 2: including the client credentials in the request-body` に従いリクエストボディを作成します。
2 通りのやり方があるので、好きな方を選びます(1 個目だとやり方がよくなくてうまくいかなかった)。

```
POST <https://myanimelist.net/v1/oauth2/token> HTTP/1.1
Host: server.example.com
Content-Type: application/x-www-form-urlencoded

client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&grant_type=authorization_code
&code=AUTHORIZATION_CODE
&redirect_uri=YOUR_REDIRECT_URI
&code_verifier=YOUR_PKCE_CODE_VERIFIER

```

実際にリクエストボディはこんな感じになると思います。
`code` は `Step 5: MyAnimeList redirects back to the client` でリダイレクトされた `code` の値を使用し、`code_verifier` は `Step 2: Client requests OAuth 2.0 authentication` で設定した `code_challenge` の値を設定します。

![PostmanでMyAnimeList OAuth 2.0トークン発行リクエストを設定している画面](https://storage.googleapis.com/zenn-user-upload/3dbd8040786f-20241117.png)

うまくいけばアクセストークンを取得できます。

```json
{
  "token_type": "Bearer",
  "expires_in": 2415600,
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN"
}

```

義妹生活のアニメ情報を取得するには、以下のリクエストを送信します。

リクエストヘッダーには `Authorization: Bearer {AccessToken}` が必要です。

https://api.myanimelist.net/v2/anime/52481?fields=id,title,main_picture,alternative_titles,start_date,end_date,synopsis

```json
{
    "id": 52481,
    "title": "Gimai Seikatsu",
    "main_picture": {
        "medium": "https://cdn.myanimelist.net/images/anime/1420/143707.jpg",
        "large": "https://cdn.myanimelist.net/images/anime/1420/143707l.jpg"
    },
    "alternative_titles": {
        "synonyms": [],
        "en": "Days with My Stepsister",
        "ja": "義妹生活"
    },
    "start_date": "2024-07-04",
    "end_date": "2024-09-19",
    "synopsis": "Yuuta Asamura gets a new stepsister after his father remarries, Saki Ayase, who happens to be the number one beauty of the school year. They promise each other not to be too close, not to be too opposing, and to simply keep a vague and comfortable distance, having learned important values about men and women relationships from their parents' previous ones.\n\nSaki, who has worked alone for the sake of her family, doesn't know how to properly rely on others, whereas Yuuta is unsure of how to truly treat her. Standing on fairly equal ground, these two gradually learn the comfort of living together.\n\nTheir relationship progresses from strangers to friends as the days pass. This is a story that may one day lead to love.\n\n(Source: MAL News)"
}
```

## APIの比較表

紹介した各アニメ情報 API の比較表を作成しました。

| 項目 | **ShangriLa Anime API** | **Annict API** | **MyAnimeList API** |
| --- | --- | --- | --- |
| **APIタイプ** | REST | REST、GraphQL | REST |
| **認証方法** | なし(公開API) | OAuth 2.0(個人用アクセストークンが必要) | OAuth 2.0(個人用アクセストークンが必要) |
| **提供データ** | アニメ作品情報(クールごと) | 作品情報、エピソード情報、ユーザーの視聴情報や役者さんの情報など多数 | 作品情報、エピソード情報、ランキングなど |
| **データの詳細度** | 基本的な作品情報 | 詳細なエピソード情報やスタッフ情報 | 豊富な作品データベース(あいまい検索可能) |
| **公式ドキュメント** | [GitHubリポジトリ](https://github.com/Project-ShangriLa/anime_api_deno) | [Annict APIドキュメント](https://developers.annict.com/docs) | [MyAnimeList APIドキュメント](https://myanimelist.net/apiconfig/references/api/v2) |

## メリットとデメリット

### ShangriLa Anime API

- **メリット**
    - 認証不要で手軽に利用可能
    - クールごとのアニメ情報を簡単に取得
- **デメリット**
    - 提供されるデータが限定的
    - ドキュメントやサポート情報が少ない

### Annict API

- **メリット**
    - GraphQL により柔軟なクエリが可能
    - 詳細なエピソード情報やスタッフ情報を取得可能
- **デメリット**
    - あいまい検索などはしづらい

### MyAnimeList API

- **メリット**
    - 世界的に有名なデータベースで情報量が豊富
    - 作品の評価やランキング情報も取得可能
    - あいまい検索が可能
- **デメリット**
    - 海外サイトなので日本の Web サイト向けではない

個人的には `Annict API` が詳細なエピソード情報やスタッフ情報が提供されているため、アニメに関するサービスを作成するときは一番適していると感じました。

API のレスポンスボディには Wikipedia の URL も提供されているため、不明な情報があったとしてもすぐに調べられるのも良い点です。

## おわりに
一部の API しか試していませんが、網羅性という観点では `Annict API` が一強のように感じました。
MAL は API はベータ版ということもあり基本的な情報しか返却されませんでしたが、歴史あるサイトなので情報量も膨大です。
いずれ開発が進むと嬉しいですね😃
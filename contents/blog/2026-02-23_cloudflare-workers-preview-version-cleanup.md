---
title: Cloudflare Workers のプレビューバージョンを自動で掃除する
slug: cloudflare-workers-preview-version-cleanup
date: 2026-02-23
modified_time: 2026-02-23
description: Cloudflare Workers のプレビューバージョンは、PR をマージしても自動で削除されません。URL を知っていれば誰でもアクセスできてしまう状態が残り続けます。Standard API には DELETE がないため、Beta API を使って GitHub Actions で自動クリーンアップする方法を調査・実装しました。
icon: 🧹
icon_url: /icons/broom_flat.svg
tags:
  - CloudflareWorkers
  - GitHubActions
  - セキュリティ
---

このブログは Cloudflare Workers でホスティングしています。PR ごとに `wrangler versions upload` でプレビューバージョンをアップロードし、レビュー時にプレビュー URL で動作確認できるようにしています。

便利なしくみですが、1 つ気になることがありました。PR をマージしてブランチを削除しても、プレビューバージョンは消えません。プレビュー URL はそのまま残り続けます。つまり、URL さえ知っていれば誰でもアクセスできてしまう状態です。

Vercel であればプレビューデプロイに認証をかけられますが、Cloudflare Workers のプレビューバージョンにはそのような認証機能がありません。個人ブログなので実害はないかもしれませんが、昨今のセキュリティ事情を考えると放置するのも気持ちが悪いですよね。「まぁ試しにやってみるか」くらいの気持ちで調べ始めたのが今回の話です。

## なぜ Pages ではなく Workers なのか

「プレビューの掃除が面倒なら Pages を使えばよいのでは？」と思うかもしれません。実際、Cloudflare Pages にはデプロイの削除 API が公開されており、Zenn にも GitHub Actions で Pages のプレビューデプロイを削除する記事があります。

https://zenn.dev/aeon_mall/articles/wrangler_actions

しかし、Cloudflare に勤めていて Hono の作者でもある Yusuke Wada 氏は、以下のように説明しています。

> これからは理由がない限りCloudflare PagesではなくCloudflare Workersを使ってください。
>
> - Pagesと同じくアセットへのアクセスは無料
> - Pagesではできない機能が使える（Durable Objects/Workers Logs etc.）
> - フロントエンドフレームワークが動く

https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/

これを見て Workers を選択したわけですが、いざプレビューバージョンを削除しようとしたら「削除する API がない」ということに気付きました。正確には、Standard API には DELETE エンドポイントが存在しません。

## API を調査して分かったこと

Cloudflare API には Workers のバージョンを操作するエンドポイントが 2 つ存在します。これを知ったとき、正直なところ「なんでこんな構造なんだ」と思いました。

### Standard API

```
GET  /accounts/{account_id}/workers/scripts/{script_name}/versions
GET  /accounts/{account_id}/workers/scripts/{script_name}/versions/{version_id}
POST /accounts/{account_id}/workers/scripts/{script_name}/versions
```

バージョンの一覧取得・詳細取得・アップロードのみです。DELETE メソッドは存在しません。試しにこのパスに DELETE リクエストを送ると `405 Method Not Allowed` が返ります。これは権限の問題ではなく、エンドポイント自体が存在しないためです。

### Beta API

```
GET    /accounts/{account_id}/workers/workers/{worker_id}/versions
GET    /accounts/{account_id}/workers/workers/{worker_id}/versions/{version_id}
POST   /accounts/{account_id}/workers/workers/{worker_id}/versions
DELETE /accounts/{account_id}/workers/workers/{worker_id}/versions/{version_id}
```

Beta API には DELETE メソッドがあります。バージョンの削除は Beta API 経由でのみ可能です。

2 つの API の違いを整理します。

| 項目                     | Standard API                  | Beta API               |
| ------------------------ | ----------------------------- | ---------------------- |
| パスのキー               | `script_name`（スクリプト名） | `worker_id`（内部 ID） |
| バージョン一覧の jq パス | `.result.items[].id`          | `.result[].id`         |
| DELETE                   | なし（405）                   | あり（200 OK）         |

Beta API を使うには `worker_id` が必要です。これは `script_name` とは異なる内部 ID で、以下のエンドポイントから取得できます。

```
GET /accounts/{account_id}/workers/workers
```

レスポンスの `.result[]` から `name` が対象の Worker と一致するものの `id` が `worker_id` です。

## アクティブバージョンの特定

削除する前に「今本番で使っているバージョンはどれか」を特定しなければなりません。うっかりアクティブバージョンを消してしまったらたいへんです。

これにはデプロイ API を使います。

```
GET /accounts/{account_id}/workers/scripts/{script_name}/deployments
```

レスポンスの `.result.deployments[0].versions[].version_id` が現在アクティブなバージョンの ID です。配列の先頭が最新のデプロイですので、ここからバージョン ID を取得してスキップリストに入れます。

## GitHub Actions での実装

処理フローは以下の通りです。

1. Beta API で `worker_id` を動的に取得する
2. デプロイ API でアクティブバージョン ID を取得する
3. Beta API で全バージョン一覧を取得する
4. アクティブバージョン以外を Beta API の DELETE で削除する

本番デプロイのステップの後に、以下のクリーンアップステップを追加しました。

```yaml
- name: Cleanup old preview versions
  continue-on-error: true
  run: |
    SCRIPT_NAME="sui-tech-blog"
    API_BASE="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers"

    # Beta API で worker_id を動的に取得
    WORKER_ID=$(curl -sf "$API_BASE/workers" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      | jq -r --arg name "$SCRIPT_NAME" '.result[] | select(.name == $name) | .id')

    if [ -z "$WORKER_ID" ]; then
      echo "::warning::Could not find worker_id for $SCRIPT_NAME. Skipping cleanup."
      exit 0
    fi
    echo "Worker ID: $WORKER_ID"

    # アクティブバージョンを取得
    ACTIVE_VERSIONS=$(curl -sf "$API_BASE/scripts/$SCRIPT_NAME/deployments" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      | jq -r '[.result.deployments[0].versions[].version_id] | join(" ")')

    if [ -z "$ACTIVE_VERSIONS" ]; then
      echo "::warning::Could not retrieve active deployment versions. Skipping cleanup."
      exit 0
    fi
    echo "Active versions: $ACTIVE_VERSIONS"

    # Beta API で全バージョン一覧を取得
    ALL_VERSIONS=$(curl -sf "$API_BASE/workers/$WORKER_ID/versions?per_page=100" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      | jq -r '.result[].id')

    if [ -z "$ALL_VERSIONS" ]; then
      echo "No versions found to clean up."
      exit 0
    fi

    # アクティブでないバージョンを Beta API で削除
    DELETED=0
    FAILED=0
    for VERSION_ID in $ALL_VERSIONS; do
      if echo "$ACTIVE_VERSIONS" | grep -q "$VERSION_ID"; then
        echo "Skipping active version: $VERSION_ID"
        continue
      fi

      echo "Deleting version: $VERSION_ID"
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
        "$API_BASE/workers/$WORKER_ID/versions/$VERSION_ID" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")

      if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
        echo "  -> Deleted (HTTP $HTTP_CODE)"
        DELETED=$((DELETED + 1))
      else
        echo "  -> Failed (HTTP $HTTP_CODE)"
        FAILED=$((FAILED + 1))
      fi
    done

    echo "Cleanup complete: $DELETED deleted, $FAILED failed"
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

`continue-on-error: true` を設定しているので、クリーンアップが失敗しても本番デプロイ自体は成功として扱われます。あくまで「おまけ」の処理ですので、これが原因でデプロイが止まるのは避けたいところです。

`per_page=100` で 1 回のリクエストにつき最大 100 件のバージョンを取得しています。100 件を超える場合は 1 回のクリーンアップではすべて削除しきれませんが、本番デプロイのたびに実行されるので、数回のデプロイですべて削除されます。

アクティブバージョンの取得に失敗した場合は、クリーンアップ全体をスキップします。「どれがアクティブか分からない状態で削除する」のは危険ですので、安全側に倒しています。

## Beta API を使うことへの懸念

Beta API はその名の通りベータ版のエンドポイントです。将来的に Standard API に DELETE が統合されるかもしれませんし、パスが変更される可能性もあります。

しかし、`continue-on-error: true` を設定しているため、API の変更があってもクリーンアップが失敗するだけで本番デプロイへの影響はありません。壊れたら直せばよいだけです。「ベータだから使わない」という判断もありますが、現時点で他に手段がない以上、使えるものは使うというスタンスです。

## まとめ

- Cloudflare Workers のプレビューバージョンは PR をマージしても自動削除されず、URL を知っていれば誰でもアクセスできる状態が残る
- Standard API にはバージョンの DELETE エンドポイントが存在しない。削除は Beta API(`/workers/{worker_id}/versions/{version_id}`)経由でのみ可能
- Beta API を使うには `worker_id` が必要で、`/workers/workers` エンドポイントから動的に取得する
- アクティブバージョンを誤って削除しないよう、デプロイ API で本番バージョンを特定してからクリーンアップを実行する
- `continue-on-error: true` により、クリーンアップの失敗が本番デプロイに影響しない設計にする

正直なところ、Pages であれば DELETE API が普通に公開されているので、こんな回りくどいことをする必要はありません。Workers を選んだ以上、自分で対処するしかないという話です。

Beta API に依存している点は気になりますが、放置して古いプレビュー URL が残り続けるよりはましでしょう。壊れたらそのとき直します。

## 参考

https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/versions/

https://developers.cloudflare.com/api/resources/workers/subresources/beta/subresources/workers/subresources/versions/

https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/deployments/

https://developers.cloudflare.com/api/resources/workers/subresources/beta/subresources/workers/

https://zenn.dev/aeon_mall/articles/wrangler_actions

https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/

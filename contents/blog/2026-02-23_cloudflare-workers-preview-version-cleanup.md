---
title: Cloudflare Workers のプレビューバージョンを自動で掃除する
slug: cloudflare-workers-preview-version-cleanup
date: 2026-02-23
modified_time: 2026-02-23
description: Cloudflare Workers のプレビューバージョンは、PR をマージしても自動で削除されません。そのため、URL を知っていれば誰でもアクセスできてしまう状態が残り続けます。Standard API には DELETE がないため、Beta API を使って GitHub Actions で自動クリーンアップする方法を調査・実装しました。
icon: 🧹
icon_url: /icons/broom_flat.svg
tags:
  - CloudflareWorkers
  - GitHubActions
  - セキュリティ
selfAssessment:
  quizzes:
    - question: "Cloudflare Workers のプレビューバージョンを削除するには、どの API を使う必要があるか？"
      answers:
        - text: "Standard API の DELETE エンドポイント"
          correct: false
          explanation: "Standard API にはバージョンの DELETE エンドポイントが存在しません。DELETE リクエストを送ると 405 Method Not Allowed が返ります。"
        - text: "Beta API の DELETE エンドポイント"
          correct: true
          explanation: "Standard API には DELETE がないため、Beta API(/workers/{worker_id}/versions/{version_id})経由でのみ削除が可能です。"
        - text: "wrangler versions delete コマンド"
          correct: false
          explanation: null
        - text: "Cloudflare ダッシュボードからのみ削除可能"
          correct: false
          explanation: null
    - question: "GitHub Actions でのクリーンアップ処理で、アクティブバージョンの取得に失敗した場合の挙動はどれか？"
      answers:
        - text: "全バージョンを削除する"
          correct: false
          explanation: "どれがアクティブか分からない状態で削除するのは危険なため、この挙動にはなりません。"
        - text: "ワークフロー全体を失敗させる"
          correct: false
          explanation: null
        - text: "最新バージョンだけ残して他を削除する"
          correct: false
          explanation: null
        - text: "クリーンアップ全体をスキップする"
          correct: true
          explanation: "アクティブバージョンが不明な状態で削除するのは危険なため、安全側に倒してクリーンアップ全体をスキップします。"
diagram:
  - type: hero
    date: "2026/02/23"
    title: "Cloudflare Workers のプレビューバージョンを自動で掃除する"
    subtitle: "Standard APIにはない機能。Beta APIとGitHub Actionsで不要なバージョンを安全に削除する方法"
  - type: problem
    variant: simple
    icon: alertCircle
    title: "プレビューバージョンが抱える課題"
    introText: "PRマージ後もプレビュー環境が残り続けることで管理上やセキュリティ上の懸念が発生"
    cards:
      - icon: shieldAlert
        title: "環境が残り続ける"
        subtitle: "誰でもアクセス可能"
        description: "PRマージしてブランチを削除してもプレビュー環境のURLは有効なまま放置される"
      - icon: slash
        title: "削除APIがない"
        subtitle: "Standard APIの制限"
        description: "Pagesと異なりWorkersのStandard APIにはバージョンを削除するDELETEメソッドが存在しない"
  - type: transition
  - type: core_message
    variant: highlight
    icon: target
    title: "Beta APIを利用した解決策"
    mainMessage: "Standard APIでは削除できないため削除メソッドが提供されているBeta APIを利用してクリーンアップを実行"
    comparisons:
      - icon: xCircle
        title: "Standard API"
        text: "DELETEメソッドが存在せずリクエストすると405エラーが返る"
        isGood: false
      - icon: checkCircle
        title: "Beta API"
        text: "DELETEメソッドが存在しバージョンIDを指定して削除可能"
        isGood: true
    coreHighlight:
      title: "内部IDの取得が必須"
      text: "Beta APIを使うにはスクリプト名ではなく固有のworker_idを取得する必要がある"
      accentColor: GOLD
  - type: transition
  - type: flow_chart
    title: "自動クリーンアップの実行フロー"
    introText: "GitHub Actions上でデプロイ後に実行する安全なクリーンアップ手順"
    flows:
      - label: "ID取得"
        subLabel: "worker_idの取得"
      - label: "本番特定"
        subLabel: "アクティブの除外"
        highlight: true
        accentColor: GOLD
      - label: "一覧取得"
        subLabel: "全バージョンの取得"
      - label: "削除実行"
        subLabel: "Beta APIでDELETE"
  - type: grouped_content
    title: "安全に実行するための設計ポイント"
    introText: "本番環境に影響を与えず安全にクリーンアップを組み込むための工夫"
    icon: lightbulb
    sectionBgColor: muted
    groups:
      - title: "安全側のフォールバック処理"
        description: "本番環境を誤って削除しないための防波堤となる設計"
        bgColor: white
        cards:
          - title: "アクティブ版の除外"
            text: "デプロイAPIからアクティブなバージョンIDを取得し削除対象から必ず除外する"
            isHighlight: true
            accentColor: GOLD
            bgColor: white
          - title: "スキップ判定"
            text: "アクティブバージョンの取得に失敗した場合は危険と判断し処理全体をスキップする"
            bgColor: white
      - title: "CI/CDへの組み込み"
        description: "デプロイフローを止めないためのエラーハンドリング"
        bgColor: white
        cards:
          - title: "エラーの許容"
            text: "continue-on-errorを有効にしクリーンアップが失敗しても本番デプロイを成功扱いにする"
            bgColor: white
          - title: "Beta APIへの対応"
            text: "将来APIが変更されてもメインのデプロイには影響が出ないよう分離して実行する"
            bgColor: white
  - type: transition
  - type: action
    title: "プレビュー環境をクリーンに保とう"
    mainText: "Beta APIを活用することで放置されがちなプレビュー環境を自動で掃除可能"
    actionStepsTitle: "導入のステップ"
    actionSteps:
      - title: "APIトークンの確認"
        description: "Workersの編集権限を持つCloudflare APIトークンを準備"
      - title: "Actionsワークフローの追加"
        description: "本番デプロイのステップの後にクリーンアップ処理を追記"
    pointText: "アクティブバージョンの取得に失敗した時はスキップするなど安全第一の設計を心がけること"
    footerText: "不要な環境を削除し安全な運用を！"
    subFooterText: "sui Tech Blog"
    accentColor: GOLD
---

Cloudflare は従来の Pages ではなく [Workers を推奨する方針](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)を打ち出しています。Workers では `wrangler versions upload` でプレビューバージョン[^preview-version]をアップロードでき、PR ごとにプレビュー URL で動作確認が可能です。

しかし、Workers のプレビューバージョンには構造的な課題があります。PR をマージしてブランチを削除しても、プレビューバージョンは自動削除されません。そのため、URL さえ知っていればアクセスできる状態が残り続けます。Pages には[デプロイの削除 API](https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/deployments/methods/delete/) が公開されていますが、Workers の Standard API にはバージョンの DELETE エンドポイントが存在しません。

このブログも Cloudflare Workers でホスティングしており、同じ課題に直面しました。Vercel であれば[プレビューデプロイに認証をかけられます](https://vercel.com/docs/deployment-protection)が、Workers のプレビューバージョンにはそのような認証機能がありません。個人ブログなので実害はないかもしれませんが、昨今のセキュリティ事情を考えると、放置するのも気持ちが悪いです。「まぁ試しにやってみるか」くらいの気持ちで調べ始めたところ、Beta API に DELETE エンドポイントがあることが分かり、GitHub Actions で自動削除するしくみを実装しました。

## なぜ Pages ではなく Workers なのか

「プレビューの掃除が面倒なら Pages を使えばよいのでは？」と思うかもしれません。Zenn にも GitHub Actions で Pages のプレビューデプロイを削除する記事があり、Pages であれば削除は簡単です。

https://zenn.dev/aeon_mall/articles/wrangler_actions

しかし、Cloudflare に勤めていて Hono(軽量な Web フレームワーク)の作者でもある Yusuke Wada 氏は、X で以下のように説明しています。

<!-- textlint-disable ja-technical-writing/no-mix-dearu-desumasu -->
> これからは理由がない限りCloudflare PagesではなくCloudflare Workersを使ってください。
>
> * Pagesと同じくアセットへのアクセスは無料です
> * Pagesではできない機能が使えます > Durable Objects/Workers Logs etc.
> * フロントエンドフレームワークが動きます
<!-- textlint-enable ja-technical-writing/no-mix-dearu-desumasu -->

https://x.com/yusukebe/status/1917869496267915641

これを見て Workers を選択したわけですが、いざプレビューバージョンを削除しようとしたら「削除する API がない」ということに気付きました。Pages には DELETE API があるのに、Workers にはない。正確には、Standard API には DELETE エンドポイントが存在しません。

## API を調査して分かったこと

<!-- textlint-disable preset-ja-technical-writing/no-unmatched-pair -->
> [!WARNING]
> 本記事の内容は 2026 年 2 月時点の API 仕様に基づいています。
<!-- textlint-enable preset-ja-technical-writing/no-unmatched-pair -->

Cloudflare API には Workers のバージョンを操作するエンドポイントが 2 つ存在します。

Standard API にはバージョンの一覧取得・詳細取得・アップロードのみです。DELETE メソッドは存在しません。試しにこのパスに DELETE リクエストを送ったところ、`405 Method Not Allowed` が返りました。これは権限の問題ではなく、エンドポイント自体が存在しないためです。

```bash
GET  /accounts/{account_id}/workers/scripts/{script_name}/versions
GET  /accounts/{account_id}/workers/scripts/{script_name}/versions/{version_id}
POST /accounts/{account_id}/workers/scripts/{script_name}/versions
```

Beta API には DELETE メソッドがあります。バージョンの削除は Beta API 経由でのみ可能です。

```bash
GET    /accounts/{account_id}/workers/workers/{worker_id}/versions
GET    /accounts/{account_id}/workers/workers/{worker_id}/versions/{version_id}
POST   /accounts/{account_id}/workers/workers/{worker_id}/versions
DELETE /accounts/{account_id}/workers/workers/{worker_id}/versions/{version_id}
```

Beta API を使うには `worker_id` が必要です。これは `script_name` とは異なる内部 ID で、以下のエンドポイントから取得します。

| 項目                          | Standard API                | Beta API             |
| ----------------------------- | --------------------------- | -------------------- |
| パスのキー                    | `script_name`(スクリプト名) | `worker_id`(内部 ID) |
| バージョン一覧の jq[^jq] パス | `.result.items[].id`        | `.result[].id`       |
| DELETE                        | なし(405)                   | あり(200 OK)         |

レスポンスの `.result[]` から `name` が対象の Worker と一致するものの `id` が `worker_id` です。

```bash
GET /accounts/{account_id}/workers/workers
```

## アクティブバージョンの特定

削除する前に「今本番で使っているバージョンはどれか」を特定しなければなりません。うっかりアクティブバージョンを消してしまったらたいへんです。

これにはデプロイ API を使います。

```bash
GET /accounts/{account_id}/workers/scripts/{script_name}/deployments
```

レスポンスの `.result.deployments[0].versions[].version_id` が現在アクティブなバージョンの ID です。配列の先頭が最新のデプロイですので、ここからバージョン ID を取得してスキップリストに入れます。

## GitHub Actions での実装

> [!WARNING]
> この処理は他に開発者がいない前提で実装しています。そのため、他にもPRが発行されている場合、意図せずプレビューバージョンを削除してしまう可能性があります。

1. Beta API で `worker_id` を動的に取得する
2. デプロイ API でアクティブバージョン ID を取得する
3. Beta API で全バージョン一覧を取得する
4. アクティブバージョン以外を Beta API の DELETE で削除する

本番デプロイの後に、このクリーンアップステップを追加しました。

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

`per_page=100` で 1 回のリクエストにつき最大 100 件のバージョンを取得しています。100 件を超える場合、1 回のクリーンアップではすべて削除しきれません。ただし、本番デプロイのたびに実行されるので、数回のデプロイですべて削除されます。

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

[^preview-version]: 本番デプロイ前に動作確認するための一時的なバージョン。固有の URL が発行され、PR 単位で確認用の環境として利用する。
[^jq]: コマンドラインで JSON データを整形・抽出するツール。API レスポンスから必要な値を取り出すのに使う。

## 参考

https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/versions/

https://developers.cloudflare.com/api/resources/workers/subresources/beta/subresources/workers/subresources/versions/

https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/deployments/

https://developers.cloudflare.com/api/resources/workers/subresources/beta/subresources/workers/

https://zenn.dev/aeon_mall/articles/wrangler_actions

https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/

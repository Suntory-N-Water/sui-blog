---
title: Cloudflare Workers のプレビュー URL を自動で無効化する
slug: cloudflare-workers-preview-version-cleanup
date: 2026-02-23
modified_time: 2026-02-23
description: Cloudflare Workers のプレビュー URL は、PR をマージしても自動で無効化されません。バージョンの削除ではアクセスを止められないため、Subdomain API の previews_enabled を GitHub Actions で自動制御する方法を実装しました。
icon: 🧹
icon_url: /icons/broom_flat.svg
tags:
  - CloudflareWorkers
  - GitHubActions
  - セキュリティ
selfAssessment:
  quizzes:
    - question: "Cloudflare Workers のプレビュー URL を無効化するために、この記事で採用した方法はどれですか？"
      answers:
        - text: "Beta API でバージョンを DELETE する"
          correct: false
          explanation: "Beta API の DELETE は HTTP/200 が返るが、プレビュー URL のルーティングは無効化されない"
        - text: "Subdomain API の previews_enabled を false にする"
          correct: true
          explanation: "previews_enabled を false にすると全プレビュー URL が HTTP/404 を返すようになり、本番 URL には影響しない"
        - text: "Worker を丸ごと削除して再作成する"
          correct: false
          explanation: "Worker を削除すると本番 URL も消えてしまう"
        - text: "wrangler versions delete コマンドを実行する"
          correct: false
          explanation: "wrangler には versions delete コマンドは存在しない"
    - question: "Subdomain API の previews_enabled を false に設定した場合、本番 URL({script_name}.workers.dev)はどうなりますか？"
      answers:
        - text: "本番 URL も HTTP/404 になる"
          correct: false
          explanation: "enabled と previews_enabled は独立した設定値であり、previews_enabled の変更は本番 URL に影響しない"
        - text: "本番 URL は HTTP/200 のまま影響を受けない"
          correct: true
          explanation: "enabled と previews_enabled は独立した設定値なので、previews_enabled を false にしても本番 URL は HTTP/200 のまま"
        - text: "本番 URL は HTTP/301 でリダイレクトされる"
          correct: false
          explanation: null
        - text: "本番 URL は HTTP/503 になる"
          correct: false
          explanation: null
diagram:
  - type: hero
    date: "2026-02-23"
    title: "Cloudflare Workers のプレビュー URL を自動で無効化する"
    subtitle: "バージョン削除では消えないプレビュー環境をSubdomain APIで安全に管理する方法"
  - type: problem
    icon: alertTriangle
    title: "プレビューURLが残るセキュリティリスク"
    introText: "PRマージ後もプレビュー環境が自動で削除されず誰でもアクセス可能な状態が続いてしまいます"
    cards:
      - icon: globe
        title: "放置されるURL"
        subtitle: "PR終了後もアクセス可能"
        description: "認証機能がないためURLを知っていれば誰でも閲覧できてしまう"
      - icon: trash2
        title: "API削除の罠"
        subtitle: "バージョン削除は無意味"
        description: "Beta APIでバージョンを消してもルーティングは残りアクセス可能"
        isHighlight: true
        accentColor: RED
  - type: transition
  - type: core_message
    variant: highlight
    icon: target
    title: "プレビューURL無効化の正解"
    mainMessage: "Workersのバージョンは不変かつ追記のみの設計。削除ではなくSubdomain APIでルーティングを制御するのが正しいアプローチです"
    comparisons:
      - icon: xCircle
        title: "Beta APIでの削除"
        text: "メタデータが消えるだけでプレビューURLへのアクセスは遮断されない"
        isGood: false
      - icon: checkCircle
        title: "Subdomain APIの利用"
        text: "previews_enabledをfalseにして全プレビューを確実にHTTP/404にする"
        isGood: true
    coreHighlight:
      title: "本番環境への影響はゼロ"
      text: "enabledとpreviews_enabledは独立しているため本番URLはHTTP/200のまま維持される"
      accentColor: GOLD
  - type: grouped_content
    title: "2つのAPI設定と対象URLの違い"
    introText: "Subdomain APIで制御できる2つのフラグとその影響範囲を整理します"
    icon: settings
    sectionBgColor: muted
    groups:
      - title: "enabledフラグ"
        description: "本番環境のworkers.dev URLを制御"
        bgColor: white
        cards:
          - title: "対象URL"
            text: "{script_name}.workers.dev"
          - title: "設定変更の影響"
            text: "falseにすると本番環境が停止する"
      - title: "previews_enabled"
        description: "プレビュー用のURLを制御"
        bgColor: white
        isHighlight: true
        cards:
          - title: "対象URL"
            text: "{version}-...workers.dev"
          - title: "設定変更の影響"
            text: "falseにするとプレビューのみHTTP/404になる"
            isHighlight: true
            accentColor: GOLD
  - type: transition
  - type: steps
    title: "GitHub Actionsでの自動化フロー"
    introText: "PRデプロイ時と本番デプロイ時にAPIを叩いてプレビュー状態を自動制御します"
    steps:
      - number: 1
        title: "デプロイ前"
        text: "previews_enabledをtrueにしてプレビューURLを有効化する"
      - number: 2
        title: "動作確認"
        text: "発行されたプレビューURLでPRの変更内容をテストする"
      - number: 3
        title: "本番デプロイ後"
        text: "previews_enabledをfalseにしてプレビューURLを無効化する"
  - type: action
    title: "安全なプレビュー運用を始めよう"
    mainText: "不要なプレビュー環境を適切に閉じてセキュリティリスクを最小限に抑えましょう"
    actionStepsTitle: "導入のステップ"
    actionSteps:
      - title: "APIトークンの取得"
        description: "Cloudflareダッシュボードで必要な権限を持つトークンを発行"
      - title: "CI/CDの改修"
        description: "GitHub ActionsのワークフローにAPIリクエストを追加"
    pointText: "複数PRのプレビューを同時使用する場合はCloudflare Accessの利用も検討してください"
    footerText: "安全な開発体験を構築していこう"
    subFooterText: "sui Tech Blog"
    accentColor: GOLD
---

Cloudflare Pages は 2020 年にリリースされた静的サイトホスティングサービスですが、2024 年に Workers が静的アセット配信に対応したことで状況が変わりました。Cloudflare は[Workers への移行を推奨する方針](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)を打ち出し、Workers では `wrangler versions upload` でプレビューバージョン[^preview-version]をアップロードでき、PR ごとにプレビュー URL で動作確認が可能です。

しかし、Workers のプレビューバージョンには構造的な課題があります。PR をマージしてブランチを削除しても、プレビューバージョンは自動削除されず、URL を知っていれば誰でもアクセスできてしまいます。Pages には[デプロイの削除 API](https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/deployments/methods/delete/) が公開されていますが、Workers の Standard API にバージョンの DELETE エンドポイントはありません。この問題は 2025年8月ころ [Cloudflare Community](https://community.cloudflare.com/t/potential-security-concerns-with-workers-pages/826236) でも報告されています。

このブログも Cloudflare Workers でホスティングしており、同じ問題が発生しました。Vercel であれば[プレビューデプロイに認証をかけられます](https://vercel.com/docs/deployment-protection)が、Workers のプレビューバージョンにはそのような認証機能がありません。個人ブログなので実害はないかもしれませんが、昨今のセキュリティ事情を考えると、放置するのも気持ちが悪いです。「まぁ試しにやってみるか」くらいの気持ちで調べ始めたところ、[Subdomain API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/subdomain/) の `previews_enabled` でプレビュー URL を一括無効化できることが分かり、GitHub Actions で本番デプロイ後に自動で無効化するしくみを実装しました。

## なぜ Pages ではなく Workers なのか

「プレビューの管理が面倒なら Pages を使えばよいのでは？」と思うかもしれません。実際、Pages であればプレビューデプロイの削除は簡単で、GitHub Actions で自動化する方法も Zenn で紹介されています。

https://zenn.dev/aeon_mall/articles/wrangler_actions

ただ、Cloudflare に勤めていて Hono(軽量な Web フレームワーク)の作者でもある Yusuke Wada 氏は、X で以下のように説明しています。

<!-- textlint-disable ja-technical-writing/no-mix-dearu-desumasu -->
> これからは理由がない限りCloudflare PagesではなくCloudflare Workersを使ってください。
>
> * Pagesと同じくアセットへのアクセスは無料です
> * Pagesではできない機能が使えます > Durable Objects/Workers Logs etc.
> * フロントエンドフレームワークが動きます
<!-- textlint-enable ja-technical-writing/no-mix-dearu-desumasu -->

https://x.com/yusukebe/status/1917869496267915641

これを見てこのブログは Workers を選択しましたが、プレビュー URL の管理でハマりました。

## プレビュー URL のしくみ

<!-- textlint-disable preset-ja-technical-writing/no-unmatched-pair -->
> [!WARNING]
> 本記事の内容は 2026 年 2 月時点の API 仕様に基づいています。
<!-- textlint-enable preset-ja-technical-writing/no-unmatched-pair -->

Workers のプレビュー URL は、バージョンごとに `{version_id}-{script_name}.{subdomain}.workers.dev` の形式で発行されます。このルーティングはバージョンの存在そのものではなく、[Subdomain API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/subdomain/) の `previews_enabled` という設定で制御されています。

```bash
GET  /accounts/{account_id}/workers/scripts/{script_name}/subdomain
POST /accounts/{account_id}/workers/scripts/{script_name}/subdomain
```

```json
{
  "enabled": true,
  "previews_enabled": true
}
```

| 設定値             | 対象                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `enabled`          | 本番の workers.dev URL(`{script_name}.{subdomain}.workers.dev`)      |
| `previews_enabled` | プレビュー URL(`{version_id}-{script_name}.{subdomain}.workers.dev`) |

この 2 つは独立した設定値です。`previews_enabled` を `false` にしても本番 URL には影響しません。[公式ドキュメント](https://developers.cloudflare.com/workers/configuration/previews/)にも以下の記載があります。

> Disabling Preview URLs will disable routing to both versioned and aliased preview URLs.

実際に `previews_enabled: false` に変更してみたところ、プレビュー URL は HTTP/404 を返すようになり、本番 URL は HTTP/200 のままでした。

| URL                                   | 変更前   | 変更後       |
| ------------------------------------- | -------- | ------------ |
| プレビュー URL                        | HTTP/200 | **HTTP/404** |
| 本番 URL(`{script_name}.workers.dev`) | HTTP/200 | HTTP/200     |

## バージョン削除ではプレビュー URL は消えない

最初に試したのはバージョンの削除です。

Workers の API を調べると、Standard API にはバージョンの DELETE エンドポイントが存在しません。試しに DELETE リクエストを送ると `405 Method Not Allowed` が返ります。

```bash
GET  /accounts/{account_id}/workers/scripts/{script_name}/versions
POST /accounts/{account_id}/workers/scripts/{script_name}/versions
```

調べを進めると、[Beta API](https://developers.cloudflare.com/api/resources/workers/subresources/beta/subresources/workers/subresources/versions/) には DELETE エンドポイントがあることが分かりました。

```bash
GET    /accounts/{account_id}/workers/workers/{worker_id}/versions
POST   /accounts/{account_id}/workers/workers/{worker_id}/versions
DELETE /accounts/{account_id}/workers/workers/{worker_id}/versions/{version_id}
```

試しに Beta API でバージョンを削除してみると、HTTP/200 が返るので削除できたように見えます。ところが、削除後もプレビュー URL にはアクセスできてしまいます。

[公式ドキュメント](https://developers.cloudflare.com/workers/platform/infrastructure-as-code/)を読むと、バージョンは不変かつ追記のみの設計で、もともと「削除する」想定になっていないそうです。wrangler にも `versions delete` コマンドは存在しません(`upload` / `deploy` / `list` / `view` / `rollback` / `secret` のみ)。Beta API の DELETE は後付けのエンドポイントで、プレビュー URL のルーティングとは無関係です。

> Worker versions are immutable at the API level, meaning they cannot be updated after creation, only re-created with any desired changes. [...] versions are both **immutable and append-only**.

バージョンを消すのではなく、ルーティングを制御する `previews_enabled` を使うのが正解でした。

## previews_enabled を切り替える

解決策として、[Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/)[^cloudflare-access] でプレビュー URL に認証をかける方法と、`previews_enabled` を CI で切り替える方法があります。

Cloudflare Access は Zero Trust の認証基盤で、プレビュー URL へのアクセスに認証を要求できます。プレビュー URL 自体は有効なまま残りますが、認証を通過しないとアクセスできません。チーム開発ならこちらを使うべきです。

`previews_enabled` の切り替えは、PR デプロイ前に `true`、本番デプロイ後に `false` にするだけのシンプルな方法です。

<!-- textlint-disable preset-ja-technical-writing/no-unmatched-pair -->
> [!WARNING]
> `previews_enabled` は Worker 全体の設定です。`false` にすると**すべてのプレビュー URL が無効化**されます。複数人で開発していて他の PR のプレビューも同時に使いたい場合は、[Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) を検討してください。
<!-- textlint-enable preset-ja-technical-writing/no-unmatched-pair -->

このブログは私一人で開発しているので、シンプルに切り替え方式を選びました。本番デプロイが走るタイミングでプレビュー URL を無効化すれば、他の PR を壊す心配はありません。

## GitHub Actions での実装

PR デプロイ時(`deploy-preview` ジョブ)で `wrangler versions upload` の前に `previews_enabled` を `true` にし、本番デプロイ後に `false` に戻します。

```yaml
- name: Enable preview URLs
  run: |
    SCRIPT_NAME="sui-tech-blog"
    API_BASE="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers"

    curl -sf -X POST \
      "$API_BASE/scripts/$SCRIPT_NAME/subdomain" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"enabled": true, "previews_enabled": true}'

    echo "Preview URLs enabled"
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

本番デプロイ後(`deploy-production` ジョブ)では、プレビュー URL を無効化します。

```yaml
- name: Disable preview URLs
  continue-on-error: true
  run: |
    SCRIPT_NAME="sui-tech-blog"
    API_BASE="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers"

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
      "$API_BASE/scripts/$SCRIPT_NAME/subdomain" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"enabled": true, "previews_enabled": false}')

    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
      echo "Preview URLs disabled (HTTP $HTTP_CODE)"
    else
      echo "::warning::Failed to disable preview URLs (HTTP $HTTP_CODE)"
    fi
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

`continue-on-error: true` を設定しているので、無効化が失敗しても本番デプロイ自体は成功として扱われます。おまけの処理ですので、これが原因でデプロイが止まるのは避けたいところです。

## まとめ

- Cloudflare Workers のプレビュー URL は PR をマージしても自動で無効化されず、URL を知っていれば誰でもアクセスできる状態が残る
- Beta API にバージョンの DELETE エンドポイントはあるが、HTTP/200 が返るだけでプレビュー URL のルーティングは無効化されない
- Subdomain API の `previews_enabled: false` で全プレビュー URL を無効化でき、本番 URL には影響しない
- GitHub Actions で PR デプロイ前に `true`、本番デプロイ後に `false` に切り替えることで、PR 中のみプレビューを公開できる

[^preview-version]: 本番デプロイ前に動作確認するための一時的なバージョン。固有の URL が発行され、PR 単位で確認用の環境として利用する。
[^cloudflare-access]: Cloudflare Zero Trust の一部で、Web アプリケーションに認証・認可ポリシーを適用するサービス。プレビュー URL へのアクセスを特定のユーザーやグループに限定できる。

## 参考

https://developers.cloudflare.com/workers/configuration/previews/

https://developers.cloudflare.com/workers/configuration/routing/workers-dev/

https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/subdomain/

https://developers.cloudflare.com/api/resources/workers/subresources/beta/subresources/workers/subresources/versions/

https://developers.cloudflare.com/workers/platform/infrastructure-as-code/

https://community.cloudflare.com/t/potential-security-concerns-with-workers-pages/826236

https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/

https://zenn.dev/aeon_mall/articles/wrangler_actions

## おまけ Workers の DELETE 系エンドポイント一覧

プレビュー URL だけを無効化できる DELETE エンドポイントは存在しません。

| エンドポイント                                                         | 効果                                                             | プレビュー URL への影響 |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------- |
| `DELETE /workers/workers/{worker_id}/versions/{version_id}` (Beta API) | バージョンのメタデータ削除                                       | 消えない                |
| `DELETE /workers/workers/{worker_id}`                                  | Worker 丸ごと削除                                                | 本番も消える            |
| `DELETE /workers/scripts/{script_name}/subdomain`                      | workers.dev 全無効化(`enabled` も `previews_enabled` も `false`) | 本番も消える            |
| `DELETE /workers/scripts/{script_name}/deployments/{deployment_id}`    | デプロイ履歴の削除(最新は削除不可)                               | 消えない                |
| `DELETE /zones/{zone_id}/workers/routes/{route_id}`                    | カスタムドメインのルート削除                                     | 無関係                  |

正直「わかりづらいな…」と思います。今後の API 設計では、プレビュー URL を個別に管理できるようなエンドポイントが追加されるとうれしいですね！

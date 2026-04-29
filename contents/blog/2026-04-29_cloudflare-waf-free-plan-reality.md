---
title: 「Cloudflare を入れていれば安心」は半分正解だった
slug: cloudflare-waf-free-plan-reality
date: 2026-04-29
modified_time: 2026-04-29
description: 個人サイトに Cloudflare を入れると、ダッシュボードに攻撃ブロックのログが並びます。WordPress の設定ファイルを狙った攻撃は確実にブロックされますが、認証情報を狙った攻撃は素通りしてしまいます。それでも実害はゼロだった理由は Cloudflare ではなく、サイトの構成にありました。
icon: 👀
icon_url: /icons/eyes_flat.svg
tags:
  - Cloudflare
  - セキュリティ
---
個人サイトに Cloudflare を入れている人は多いと思います。ダッシュボードを開くと Security Analytics に「blocked」のログが並んでいて、「攻撃を防いでくれている」という安心感があります。私が運営する [Webサイト](https://claude-code-log.com/)も同じでした。

これは合理的な判断です。Cloudflare の WAF[^waf] は実際に強力で、WordPress 系の設定ファイル漏洩を狙った攻撃は無料プランでも確実にブロックしてくれます。「入れておけば大丈夫」という感覚は、間違っていません。

「どれくらいブロックできているのか」が気になって、GraphQL Analytics API で実際のログを取得して確認してみました。
結果は、攻撃の **93% が WAF を素通り**していました。
`.env`・AWS credentials・フレームワーク設定ファイルなど、これらを狙ったリクエストは全部オリジンまで届いています。

それでも、実害はありませんでした。その理由はサイトの構成にありました。

## 攻撃の 93% は素通りしていた

最も攻撃リクエストが多かった IP アドレス(オランダ、TECHOFF SRV LIMITED)のデータを確認しました。

| action | 件数 |
|--------|------|
| `block` | 6 |
| `unknown`(素通り) | 85 |
| 合計 | 91 |

91 件の攻撃のうち、ブロックできたのは 6 件(6.6%)のみです。残り 85 件はオリジンまで届いていました。

ブロックできたのは WordPress 系の設定ファイルを狙ったパスだけです。Cloudflare の[マネージドルール](https://developers.cloudflare.com/waf/managed-rules/)は、WordPress 向けのルールセットが中心になっているため、以下はブロックされていました。

```md
/wp-config.php.swp
/wp-config.php~
/wp-config.php.bak
/wp-config.php.old
/wp-config.php.save
/wp-config.php.txt
/backup/wp-config.php
```

一方、WordPress 以外を狙ったパターンはルールに引っかからず素通りしています。

```md
# 環境変数ファイル
/.env, /.env.production, /.env.staging, /.env.dev, /.env.test

# クラウド認証情報
/.aws/credentials
/.aws/config
/.docker/config.json
/.composer/auth.json

# フレームワーク設定
/storage/logs/laravel.log
/appsettings.json
/terraform.tfstate

# Git 認証情報
/.git-credentials
```

さらに URLエンコード(`/.%65%6Ev` → `/.env`)や二重エンコードで WAF の検知を回避しようとするリクエストも多数含まれていました。`/.env;.css` や `/.env;.jpg` のような拡張子偽装まであります。

![CloudflareのダッシュボードでURLエンコードやクレデンシャルを狙った攻撃が多数観測される](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/d096e4e5d70550fa64fe378cbcab3fe8.png)

Cloudflare は「無料プランでも全部守ってくれる」ではなく、「WordPress の定番攻撃はブロックできるが、それ以外の広範な攻撃パターンは素通りする」が正確な理解です。

## 実害がゼロだった本当の理由

85 件が素通りしても実害がなかった理由は単純です。このサイトは Astro と Cloudflare Workers ベースの静的サイトで、`.env` も AWS credentials も存在しません。素通りしてオリジンに届いても、404 が返るだけです。

「実害がなかったのは Cloudflare のおかげ」ではなく、「攻撃者が求めているファイルが最初から存在しないから」です。

WordPress や Laravel のような構成であれば、これらのパスに実際のファイルが存在する可能性があります。Astro で静的サイトを作って Cloudflare Workers でホスティングするという選択が、結果としてこれらの攻撃を無効化していました。
アーキテクチャの選択がそのままセキュリティ対策になっているというのは、意識してやっていたわけではなかったので、あとから気付いておもしろいと感じました。

## 無差別スキャンという事実

「小規模な個人サイトは狙われない」というのは誤解で、実態は迷惑メールと同じ論法です。
10 万件送って 1 件でも引っかかればよい。プログラムで自動的に大量のサイトをスキャンし、そのうち 1 件でも脆弱な構成のサイトが見つかれば成果です。攻撃者にとってコストはほぼゼロですので、無差別に続けることに合理性があります。

今回の IP アドレスも 4/25・4/26・4/27 と 3 日連続でアクセスしていて、継続的なスキャンが動いていることが分かります。

トラフィック全体を 5 日分のサンプル(2,500 件)で集計すると、verified bot[^verified-bot](Cloudflare が認定した正規bot)が 1,249 件(49.9%)でした。2 リクエストに 1 つは何らかのbotです。

| カテゴリ | 件数 |
|---------|------|
| Search Engine Crawler(Google・Bing 等) | 318 |
| Webhooks(Slack 等) | 304 |
| AI Assistant | 232 |
| AI Crawler | 123 |
| Search Engine Optimization | 122 |
| AI Search | 59 |
| Feed Fetcher | 58 |
| その他 | 33 |

余談ですが、ClaudeBot(Anthropic)が `/sitemap-index.xml` を 1 日 3 回クロールしていました。自分が作成した Claude Code に関するページが Claude の学習データ候補としてクロールされているのは、不思議な感覚があります。

## では何を気にすればよいのか

「93% 素通り」と聞くと怖く聞こえますが、過剰に恐れる必要はないと思っています。このサイトで実害がゼロだったように、構成を適切に選べば素通りしても被害は出ません。

むしろ現代の個人開発者が注意すべきは、WAF の素通りよりも WAF のログに現れないリスクだと思っています。
たとえば Supabase の RLS[^rls](Row Level Security)の設定ミスは、Security Analytics を見ても検出できません。WAF がブロックするような攻撃ではなく、正規のリクエストとして認証されてしまうからです。新しい SaaS や PaaS を使うときは、設定のセキュリティをちゃんと理解してから公開するのが重要で、難しければ AI に相談しながら対策するのが現実的だと思っています。

一度 Security Analytics(WAF のログ)を確認してみることを勧めます。「自分のサイトにこんなスキャンが来ているのか」という実感は、抽象的なセキュリティの話よりずっと具体的なきっかけになります。私もダッシュボードを眺めていなければ、今回の気付きはなかったと思います。

## まとめ

- Cloudflare 無料プランのマネージドルールは WordPress 系の設定ファイル漏洩を対象にしたルールセットが中心で、`.env` や AWS credentials 等は素通りする
- 攻撃 91 件のうちブロックできたのは 6 件(6.6%)。残り 85 件はオリジンまで届いていたが、実害はゼロだった
- 実害がなかった理由は Cloudflare のおかげではなく、Astro + Cloudflare Workers という構成上、対象ファイルが存在しないため 404 が返るだけだったから
- 現代の個人開発者が注意すべきは古典的な WAF 回避攻撃よりも、Supabase RLS のような WAF のログに現れない設定ミスだと思っている
- まず Security Analytics を一度見てみると、見えていなかった実態が把握できる

## 参考

https://developers.cloudflare.com/analytics/graphql-api/

https://developers.cloudflare.com/waf/managed-rules/

https://developers.cloudflare.com/waf/analytics/

[^waf]: Web Application Firewall の略。HTTP リクエストを検査し、攻撃パターンに一致するものをブロックするセキュリティ機能。
[^managed-rules]: Cloudflare が事前に定義した攻撃パターンのルールセット。無料プランでは WordPress 向けのルールセット(Cloudflare Free Managed Ruleset)が含まれる。
[^verified-bot]: Cloudflare が「正規のbot」として認定した自動クローラ。Google や Bing の検索クローラ、Slack の Webhook など。悪意あるスキャンbotとは区別される。
[^rls]: Row Level Security の略。データベースの行レベルでアクセス制御を設定する機能。Supabase(PostgreSQL ベース)では RLS を有効化しないとすべてのデータに誰でもアクセスできてしまう。

---
title: Claude Code の利用状況を Cloudflare D1 にためてみる
slug: claude-code-usage-otel-cloudflare-d1
date: 2026-05-24
modified_time: 2026-05-24
description: 「どの Skill がどれくらい自動起動しているか」を見るために、Claude Code の 利用状況を Cloudflare Worker + D1 で受け取る仕組みを作りました。個人規模で手軽に始める方法と、Skill 棚卸しに使った実際の集計結果を紹介します。
icon: 🪤
icon_url: /icons/mouse_trap_flat.svg
tags:
  - ClaudeCode
  - AgentsSkills
  - OpenTelemetry
  - CloudflareWorkers
selfAssessment:
  quizzes:
    - question: "`skill_events` テーブルを `invocation_trigger = 'claude-proactive'` でフィルタリングすると、何が分かりますか？"
      answers:
        - text: "Claude Code が文脈から判断して自律的に起動した Skill の一覧"
          correct: true
          explanation: "`claude-proactive` はユーザーが指示しなくても、Claude Code が文脈から判断して起動したケースに対応します。この結果に出てこない Skill は description の見直し候補になります。"
        - text: "ユーザーが明示的に「この Skill を使って」と指示した回数"
          correct: false
          explanation: "`claude-proactive` はその逆で、ユーザーが指示しなくても自律起動したケースです。"
        - text: "Skill の合計起動回数"
          correct: false
          explanation: null
        - text: "Plugin のロード回数"
          correct: false
          explanation: null
    - question: "`OTEL_LOG_TOOL_DETAILS=1` を設定しなかった場合、どのような影響がありますか？"
      answers:
        - text: "ユーザー定義 Skill やサードパーティ由来の Skill 名が `custom_skill` のように匿名化される"
          correct: true
          explanation: "Skill の棚卸しには具体的な Skill 名が必要なため、自律起動の分析をしたい場合はこの設定が必須です。"
        - text: "OTEL のデータが送信されなくなる"
          correct: false
          explanation: "データ自体は送信されます。Skill 名が匿名化されるだけです。"
        - text: "プロンプトの内容が OTEL に含まれてしまう"
          correct: false
          explanation: null
        - text: "D1 への保存が失敗する"
          correct: false
          explanation: null
diagram:
  - type: hero
    date: "2026/05/24"
    title: "Claude Code の利用状況を Cloudflare D1 にためてみる"
    subtitle: "自律的なSkill起動を可視化するOpenTelemetry収集基盤の構築"
  - type: transition
  - type: problem
    variant: highlight
    title: "カスタマイズ環境で生じる課題"
    introText: "SkillやPluginを追加したものの実際の利用状況が見えにくくなっていませんか"
    cards:
      - icon: eyeOff
        title: "稼働状況が不透明"
        subtitle: "本当に使われているか"
        description: "自分が設定したSkillが実際に動いているか見えにくい"
      - icon: bot
        title: "自律的起動の有無"
        subtitle: "AIの文脈判断"
        description: "指示した時しか動かないのか自動で起動しているのか不明"
        isHighlight: true
        accentColor: RED
      - icon: target
        title: "感覚的な評価"
        subtitle: "データが欠如"
        description: "数字の裏付けがなく感覚で使えている気になっている"
  - type: two_column_contrast
    title: "評価アプローチの転換"
    icon: scale
    left:
      icon: frown
      title: "感覚的な把握"
      text: "使えている気がするだけで実際の起動頻度や自律性が不明確な状態"
      accentColor: RED
    right:
      icon: trendingUp
      title: "データ駆動の把握"
      text: "ログやメトリクスから自律起動回数や利用コストを正確に評価する状態"
      accentColor: GOLD
    summaryText: "Claude Codeの効果を最大限に引き出すにはデータによる検証が不可欠です"
  - type: transition
  - type: flow_chart
    title: "利用状況の収集アーキテクチャ"
    introText: "OTEL出力機能を活用しログとメトリクスを自前のデータベースに保存します"
    flows:
      - label: "Claude"
        subLabel: "OTEL有効化"
      - label: "Worker"
        subLabel: "ログとメトリクス受信"
        highlight: true
        accentColor: GOLD
      - label: "D1"
        subLabel: "SQLで集計・保存"
  - type: grouped_content
    title: "D1に保存するデータの分類"
    introText: "Workerでエンドポイントを分岐させイベントとメトリクスを管理します"
    groups:
      - title: "イベントデータ"
        description: "SkillやPluginの起動などアクションごとの履歴"
        cards:
          - title: "skill_events"
            text: "Skillの起動ログ"
          - title: "plugin_events"
            text: "Pluginのロード履歴"
          - title: "api_requests"
            text: "モデルやAPIの利用状況"
      - title: "メトリクスデータ"
        description: "コストやトークン数などの定量的な利用実績"
        cards:
          - title: "cost_usage"
            text: "発生したコストの集計"
          - title: "token_usage"
            text: "消費したトークン数"
          - title: "session_counts"
            text: "セッションの回数"
  - type: highlight_card
    phrase: "invocation_trigger = 'claude-proactive'"
    subText: "ユーザーが指示しなくてもAIが文脈から判断して自律的にSkillを起動したケースを抽出する条件です"
    accentColor: GOLD
  - type: score_comparison
    title: "自律的に起動したSkillの集計結果"
    introText: "実際のD1のデータから文脈に合わせて自動起動した回数を集計しました"
    scores:
      - title: "Git workflow"
        value: 5
        unit: "回"
        barPercentage: 100
        description: "コミット等の定型作業"
        accentColor: GOLD
      - title: "wrangler"
        value: 4
        unit: "回"
        barPercentage: 80
      - title: "notebooklm"
        value: 3
        unit: "回"
        barPercentage: 60
  - type: transition
  - type: action
    title: "利用状況を可視化しよう"
    mainText: "感覚での評価をやめ実際のデータに基づいてSkill環境を最適化しましょう"
    actionStepsTitle: "次のステップ"
    actionSteps:
      - title: "OTEL設定の有効化"
        description: "settings.jsonにエンドポイント等を追記する"
      - title: "集計環境の構築"
        description: "WorkerをデプロイしD1のテーブルを用意する"
      - title: "Skillの棚卸し"
        description: "集計結果を見て使われていないSkillを改善する"
    pointText: "OTEL_LOG_TOOL_DETAILSを有効にすることでSkill名が匿名化されるのを防ぐことができます"
    footerText: "データ駆動でAIアシスタントを使いこなそう"
    subFooterText: "sui Tech Blog"
    accentColor: GOLD
---

AI コーディングアシスタントの利用が広がり、Claude Code のように Skill や Plugin でカスタマイズできる環境が整ってきました。カスタマイズの幅が広がるほど、「自分が設定したものが実際に動いているか」が見えにくくなります。

Skill を追加した瞬間は便利そうに思えます。でも、Claude Code が文脈から自律的に Skill を起動しているのか、明示的に指示したときしか動いていないのか、数字で確認したことはありませんでした。

そこで、自分の Claude Code 環境を棚卸しするために、[OpenTelemetry](https://code.claude.com/docs/en/monitoring-usage) 出力を Cloudflare Worker で受け取り、[Cloudflare D1](https://developers.cloudflare.com/d1/) に保存するしくみを作りました。

## なぜ利用状況を見たいのか

気になるのは、自分が明示的に呼び出した回数ではありません。Claude Code が文脈から判断して、どれくらい自律的に Skill を起動しているかです。

たとえば Git のコミットメッセージをある程度そろえたいとき、毎回「この形式で書いてください」と指示するより Skill に寄せた方が楽です。Claude Code が必要なタイミングで自動的に起動してくれれば、私が意識しなくてもよくなります。

「便利なはず」と思って作った Skill でも、description が明確でないと、必要な場面でも Claude Code がその Skill を見つけられないかもしれません。明示的に呼び出さなくても自然に使われているかどうかは、数字を見るまで分かりません。

Skill だけでなく、Plugin、API リクエスト、トークン使用量、セッション数も同じです。感覚で「使えている気がする」という状態をやめて、まず数字で見られるようにしたいと思いました。

## 今回やること

Cloudflare Worker に OTLP の `/v1/logs` と `/v1/metrics` を用意し、Claude Code から送られてくるログとメトリクスを D1 に保存します。

Claude Code は、[OpenTelemetry の logs/events と metrics をエクスポートできます](https://code.claude.com/docs/en/monitoring-usage)。公式ドキュメントを見ると、Skill の起動を表す `claude_code.skill_activated` だけでなく、Plugin の読み込み、API リクエスト、コスト、トークン使用量、セッション数なども出力できます。

作った Worker では、ログ系のイベントを `/v1/logs` で受け取り、メトリクス系のデータを `/v1/metrics` で受け取ります。保存先は D1 です。

Worker がリクエストを受け取り、必要な値を取り出して D1 に入れておけば、SQL で雑に集計できます。

## 全体構成

```mermaid
flowchart LR
    Claude["Claude Code<br/>OTEL を有効化"] -->|"OTLP http/json<br/>Authorization: Bearer"| Endpoint["Cloudflare Worker<br/>/v1/logs・/v1/metrics"]

    subgraph Worker["Cloudflare Workers"]
        direction TB
        Auth["Bearer 認証"]
        Validate["OTLP JSON を検証"]
        Route{"エンドポイントで分岐"}
        Logs["イベントとして整形"]
        Metrics["メトリクスとして整形"]

        Auth --> Validate --> Route
        Route -->|/v1/logs| Logs
        Route -->|/v1/metrics| Metrics
    end

    subgraph D1["Cloudflare D1"]
        direction TB
        EventTables[("skill_events<br/>plugin_events<br/>api_requests など")]
        MetricTables[("cost_usage<br/>token_usage<br/>session_counts など")]
    end

    Endpoint --> Auth
    Logs --> EventTables
    Metrics --> MetricTables
```

Cloudflare Workers の[対応プロトコル](https://developers.cloudflare.com/workers/reference/protocols/)を見ると、基本は HTTP / HTTPS の `fetch()` ハンドラでリクエストを受ける形です。そのため、OTLP は `grpc` ではなく `http/json` を使いました。

OTLP の JSON は入れ子構造になっているため、Worker 側で必要な値を取り出して D1 に保存します。公式の JSON サンプルとしては [opentelemetry-proto の logs.json](https://github.com/open-telemetry/opentelemetry-proto/blob/main/examples/logs.json) がありますが、この記事では実装側の処理に話を絞ります。

## Claude Code から OTEL を送る設定

Claude Code 側では、`~/.claude/settings.json` に `env` を設定します。私の用途では、以下のような設定にしました。

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_LOG_TOOL_DETAILS": "1",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_METRICS_INCLUDE_VERSION": "true",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "http/json",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "https://cc-monitor-worker.<account>.workers.dev",
    "OTEL_EXPORTER_OTLP_HEADERS": "Authorization=Bearer <登録したトークン>"
  }
}
```

`CLAUDE_CODE_ENABLE_TELEMETRY=1` は必須です。`OTEL_LOGS_EXPORTER=otlp` を指定するとイベントが送信され、`OTEL_METRICS_EXPORTER=otlp` を指定するとメトリクスも送信されます。

ここで重要なのは `OTEL_LOG_TOOL_DETAILS=1` です。これがないと、ユーザー定義 Skill やサードパーティ由来の Skill 名が `custom_skill` のように匿名化される場合があります。自分の Skill の棚卸しをしたいので、ここは有効にしました。

`OTEL_LOG_USER_PROMPTS` を有効にするとユーザーが入力したプロンプトの内容が、`OTEL_LOG_TOOL_CONTENT` を有効にするとツール実行時の入出力が OTEL に含まれます。どちらも有効にしていません。利用状況の集計が目的ですので、プロンプト本文やツールの入出力は必要ないですし、D1 のレコードに機密情報が混入するリスクも避けたいです。

## D1 に保存するデータ

詳しい実装は [Suntory-N-Water/cc-monitor-worker](https://github.com/Suntory-N-Water/cc-monitor-worker) にありますので、興味ある人は見てみてください！Cloudflare Workers のデプロイ先を変更するだけで動作するしくみにはなっています。

最初は Skill の起動ログだけを考えていましたが、Claude Code の利用状況を見るなら、コストやトークン使用量も同じ場所に保存した方が見やすいです。現在は、以下のようなテーブルに分けています。

| テーブル | 保存するもの |
|---|---|
| `skill_events` | Skill の起動ログ |
| `plugin_events` | Plugin のロード・インストール履歴 |
| `api_requests` | API リクエストのモデル、コスト、トークン数 |
| `tool_results` | ツール実行結果 |
| `hook_executions` | Hook の実行結果 |
| `cost_usage` | コスト使用量 |
| `token_usage` | トークン使用量 |
| `session_counts` | セッション数 |
| `active_time` | アクティブ時間 |

普段見たいのは Skill 名、起動方法、Plugin 名、コスト、トークン使用量あたりです。プロンプト本文やツールの出力内容は見たい対象ではないので、Claude Code 側の設定でも送らないようにしています。

## Worker がリクエストを受け取って D1 に入れる

Worker 側は Hono で実装しています。全文は載せませんが、実際のフローはこのような感じです。

1. `/v1/*` のリクエストで `Authorization` ヘッダを確認する
2. `/v1/logs` と `/v1/metrics` にルーティングする
3. OTLP の JSON ペイロードを検証する
4. `/v1/logs` では `skill_activated`、`plugin_loaded`、`api_request` などのイベントごとにレコードを作成
5. `/v1/metrics` では `claude_code.cost.usage`、`claude_code.token.usage`、`claude_code.session.count` などのメトリクスごとにレコードを作成
6. D1 に保存する
7. Claude Code には `{ partialSuccess: {} }` を返す

Cloudflare Worker で受け取る場合は、OTLP の JSON を自分でたどって、必要な属性を取り出して、D1 のテーブルに入れる必要があります。ここは BigQuery や専用の OTEL バックエンドに送る場合とは異なります。

この Worker の目的は、きれいなトレース基盤を作ることではありません。Claude Code の利用状況をあとから見られるようにすることです。Worker 側も、まずはログとメトリクスの受信、検証、保存に絞りました。

## 実際に D1 を見てみる

`skill_events` テーブルには起動のきっかけを示す `invocation_trigger` カラムがあります。`claude-proactive` はユーザーが指示しなくても、Claude Code が文脈から判断して自律的に起動したケースです。ここを絞り込むと、自律的に動いている Skill だけを見られます。

```sql
SELECT
  skill_name,
  COUNT(*) AS cnt
FROM skill_events
WHERE invocation_trigger = 'claude-proactive'
GROUP BY skill_name
ORDER BY cnt DESC;
```

| skill_name | 件数 |
|---|---:|
| **general-dev-skills:managing-Git-GitHub-workflow** | **5** |
| wrangler | 4 |
| notebooklm | 3 |
| managing-Git-GitHub-workflow | 2 |
| agent-browser | 1 |
| article-japanese-composition-review | 1 |
| article-structure-review | 1 |
| general-dev-skills:actions-check | 1 |
| hono | 1 |
| init | 1 |
| modern-web-guidance | 1 |
| playwright-best-practices | 1 |

GitHub 関連の Skill が最多でした。コミットや Actions の確認は毎日発生するので、ここが多いのは自然です。`wrangler` や `notebooklm` も複数回自律起動していたので、description はうまく機能していると言えます。

一方、`playwright-best-practices` は 1 回です。用途が限定的な Skill ですので、必要な場面で 1 回でも自律起動していれば十分です。問題にしたいのは、この結果に出てこない Skill です。テーブルに現れない Skill は、明示的に呼び出してしか使われていないか、そもそもほぼ起動されていないかのどちらかです。

## やってみて

まだログを取り始めた段階ですので、「なんとなく使っている気がする」で放置せず、数字で見直す土台は作れたと思います。

[社員に何もさせずにClaude Code利用ログを集める ── 数百名規模のOpenTelemetry収集基盤の構築](https://techblog.zozo.com/entry/claudecode-otel)では、数百名規模の Claude Code 利用ログを Google Cloud と BigQuery で扱っています。組織で本格的に使うなら、既存の分析基盤に乗せる方がよいと思います。今回はそこまで大きな話ではなく、個人でまず試すために Cloudflare Worker と D1 を使いました。

もう少しデータがたまったら、Skill の description を直した前後で自動起動が増えるのか、Plugin ごとのコストやトークン使用量に偏りがあるのかも見てみたいです。

## まとめ


- `CLAUDE_CODE_ENABLE_TELEMETRY=1` と各エクスポーター設定を `settings.json` に追加するだけで利用状況の送信をできる
- Cloudflare Worker で OTLP http/json のリクエストを受け取り、D1 に保存するとあとから SQL で集計できる
- `invocation_trigger = 'claude-proactive'` で絞り込むと、Claude Code が自律的に起動した Skill だけを見られる。この結果に出てこない Skill は description の見直し候補になる
- `OTEL_LOG_TOOL_DETAILS=1` がないと Skill 名が匿名化されてしまうため、詳細な利用状況を見たい場合は有効にする

## 参考

https://code.claude.com/docs/en/monitoring-usage

https://code.claude.com/docs/en/env-vars

https://developers.cloudflare.com/workers/reference/protocols/

https://developers.cloudflare.com/d1/

https://github.com/Suntory-N-Water/cc-monitor-worker

https://techblog.zozo.com/entry/claudecode-otel

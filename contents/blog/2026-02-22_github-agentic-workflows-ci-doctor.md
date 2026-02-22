---
title: 自然言語で自動化ワークフローを作成できるGitHub Agentic Workflowsを試してみた
slug: github-agentic-workflows-ci-doctor
date: 2026-02-22
modified_time: 2026-02-22
description: GitHub Agentic Workflowsを使って、CIの失敗を自動で診断・修正するワークフローを作りました。Markdownに自然言語で指示を書くだけで、AIエージェントがログを解析し、原因を特定し、修正パッチまで生成します。セットアップから検証結果、セキュリティ設計まで実体験をもとに解説します。
icon: 🩺
icon_url: /icons/stethoscope_flat.svg
tags:
  - AI
  - GitHub
  - GitHubActions
  - GitHubAgenticWorkflows
selfAssessment:
  quizzes:
    - question: "GitHub Agentic Workflows のセキュリティ設計において、エージェント(agent ジョブ)が Issue や PR を作成する際のしくみとして正しいものはどれですか？"
      answers:
        - text: "エージェントが write 権限を持ち、直接 Issue や PR を作成する"
          correct: false
          explanation: "エージェントには read 権限しか付与されていません。write 操作は別ジョブ(safe_outputs)が担当します。"
        - text: "エージェントは作成リクエストを記録するだけで、実際の作成は別ジョブ(safe_outputs)が write 権限で行う"
          correct: true
          explanation: "権限分離の設計により、エージェントは「申請」のみ、実際の操作は safe_outputs ジョブが行います。"
        - text: "エージェントが GitHub API を直接呼び出し、トークンの権限で制御する"
          correct: false
          explanation: null
        - text: "エージェントの出力を人間が承認してから、手動で Issue や PR を作成する"
          correct: false
          explanation: null
    - question: "GitHub Agentic Workflows において、.md ファイルと .lock.yml ファイルの関係として正しいものはどれですか？"
      answers:
        - text: ".lock.yml が人間が編集するソースで、.md はそのドキュメント"
          correct: false
          explanation: null
        - text: ".md と .lock.yml は独立したファイルで、それぞれ手動で編集する"
          correct: false
          explanation: null
        - text: ".md がソースで、gh aw compile により .lock.yml が自動生成される。.lock.yml の約8割はセキュリティ基盤のコード"
          correct: true
          explanation: "188行の .md から約1,365行の .lock.yml が生成され、その8割はコンパイラが自動挿入したセキュリティ基盤です。"
        - text: ".md がソースで、GitHub Actions の実行時に自動的に .lock.yml に変換される"
          correct: false
          explanation: "変換はリアルタイムではなく、事前に gh aw compile コマンドで行います。"
diagram:
  - type: hero
    date: "2026-02-22"
    title: "自然言語で自動化ワークフローを作成できるGitHub Agentic Workflowsを試してみた"
    subtitle: "CIの失敗を自動診断・修正するAIエージェントの構築とセキュリティ設計を解説"
  - type: transition
  - type: problem
    variant: simple
    icon: alertCircle
    title: "従来のCI運用が抱える課題"
    introText: "GitHub Actionsは強力ですが、失敗時の対応には依然として人間の判断と手作業が必要です。"
    cards:
      - icon: fileJson
        title: "決められた手順のみ実行"
        subtitle: "柔軟な対応が困難"
        description: "YAMLで定義された決定論的なステップしか実行できず想定外のエラーに弱い"
      - icon: search
        title: "手作業でのログ解析"
        subtitle: "原因特定に時間がかかる"
        description: "膨大なログを人間が読んで外部API障害やGit競合などの原因を推論している"
        isHighlight: true
        accentColor: RED
      - icon: gitPullRequest
        title: "手動での修正とPR作成"
        subtitle: "作業の負担が大きい"
        description: "原因特定後にコードを修正しPRを作成するまでのトリアージ作業が毎回発生する"
  - type: core_message
    variant: highlight
    icon: cpu
    title: "Continuous AIという新しいアプローチ"
    mainMessage: "GitHub Agentic Workflowsは自然言語の指示をもとにAIエージェントが自律的に判断しタスクを実行します。"
    comparisons:
      - icon: fileCode
        title: "従来のActions"
        text: "YAMLで固定の手順を定義しスクリプトがそのまま実行する"
        isGood: false
      - icon: bot
        title: "Agentic Workflows"
        text: "Markdownで意図を記述しAIが判断しながら柔軟に解決する"
        isGood: true
    coreHighlight:
      title: "問題を調べて対応する作業を自動化"
      text: "CIがものを作る作業を自動化するように問題解決の推論と判断をAIに委譲します"
      accentColor: GOLD
  - type: transition
  - type: grouped_content
    title: "ファイル構成とコンパイルの仕組み"
    introText: "人間が書く指示書と実際に実行されるワークフローは分離されています。"
    icon: folderTree
    groups:
      - title: "人間が記述するソース"
        description: "自然言語でエージェントへの指示と権限の範囲を記述します"
        cards:
          - title: ".mdファイル"
            text: "トリガー条件やMarkdownでのプロンプトを記述する"
          - title: "権限の最小化"
            text: "この段階では読み取り権限のみをAIに付与する"
      - title: "コンパイル済み成果物"
        description: "CLIツールを使って自動生成されるセキュリティ基盤です"
        cards:
          - title: ".lock.ymlファイル"
            text: "GitHub Actionsが実際に実行する長大なYAMLファイル"
            isHighlight: true
            accentColor: GOLD
          - title: "自動生成される防御"
            text: "約8割がセキュリティ用のコードで安全な実行環境を構築する"
  - type: timeline_process
    title: "自動診断ワークフローの実行フロー"
    introText: "CI失敗から約4分でログ解析から修正パッチ作成までを完遂します。"
    icon: clock
    events:
      - time: "00:00"
        title: "対象ワークフローの失敗"
        description: "ドキュメント取得などの既存CIがエラーで終了しトリガーとなる"
      - time: "00:18"
        title: "CI Doctorの起動"
        description: "チームメンバーシップの確認やプロンプトの生成を行う"
      - time: "01:02"
        title: "エージェントによる解析"
        description: "ログを取得して根本原因を特定し修正パッチを生成する"
        isHighlight: true
        accentColor: GOLD
      - time: "03:31"
        title: "出力の安全性検証"
        description: "別のAIがエージェントの出力に脅威がないかをチェックする"
      - time: "03:56"
        title: "IssueとPRの作成"
        description: "検証を通過した出力をもとに安全なジョブが書き込みを行う"
  - type: list_steps
    title: "セットアップの4ステップ"
    introText: "CLI拡張の導入からコンパイルまでの基本的な手順です。"
    steps:
      - badge: "1"
        title: "CLI拡張のインストール"
        description: "GitHub CLIにgh-aw拡張機能を追加して環境を準備する"
      - badge: "2"
        title: "ラベルの事前作成"
        description: "自動診断用のIssueやPRに付与するラベルを用意しておく"
      - badge: "3"
        title: "ワークフローのコンパイル"
        description: "Markdownファイルをコンパイルしてlock.ymlを自動生成する"
      - badge: "4"
        title: "シークレットの設定"
        description: "Copilot API呼び出し用のアクセストークンをリポジトリに登録する"
  - type: grouped_content
    title: "11層の防御を持つセキュリティ設計"
    introText: "AIにリポジトリを触らせるリスクはプラットフォーム側で強固に保護されています。"
    icon: shieldCheck
    groups:
      - title: "権限の分離と特権分割"
        description: "エージェントには直接的な書き込み権限を与えません"
        cards:
          - title: "agentジョブ"
            text: "読み取り専用で動作し変更の申請だけを行う"
          - title: "safe_outputsジョブ"
            text: "承認された操作だけを書き込み権限で実行する"
      - title: "多層的な保護メカニズム"
        description: "ネットワークやプロンプトへの攻撃を防ぐ堅牢な仕組みです"
        cards:
          - title: "ネットワーク制限"
            text: "Squidプロキシで許可リスト以外の通信を遮断する"
          - title: "AIによる相互監視"
            text: "エージェントの出力を別のAIが検査し脅威を検出する"
            isHighlight: true
            accentColor: GOLD
  - type: transition
  - type: action
    title: "AIエージェントを活用しよう"
    mainText: "GitHub Agentic Workflowsでトリアージ作業を自動化し開発に集中できる環境を作りましょう。"
    actionStepsTitle: "まずは小さく始めてみる"
    actionSteps:
      - title: "公式ドキュメントを確認"
        description: "テクニカルプレビューの最新仕様や要件をチェックする"
      - title: "単純なワークフローで試す"
        description: "まずはIssue作成のみを行う簡単なエージェントを構築する"
    pointText: "権限分離やネットワーク保護の仕組みを理解することで安全にAIを運用できます。"
    footerText: "開発の本来の楽しさを取り戻そう"
    subFooterText: "sui Tech Blog"
    accentColor: GOLD
---

GitHub Actions は 2018 年に発表されて以来、ビルド・テスト・デプロイの自動化を担ってきました。YAML で決定論的[^deterministic]なステップを定義するしくみは強力ですが、「ログを解析して原因を推論し、判断して対処する」というタスクは苦手です。この領域に対し、GitHub は 2026 年 2 月、AI エージェントをワークフローとして動作させる GitHub Agentic Workflows (テクニカルプレビュー) を発表しました。

従来、CI 失敗への対応は人間が担ってきました。失敗の原因は外部 API の障害・Git の競合・設定ミスと多岐にわたり、ログを読んで原因を推定する作業は単純ではありません。GitHub はこうした「判断が必要な自動化」を「Continuous AI」と呼び、CI/CD を置き換えるのではなく拡張する位置付けとしています。

私が運用するリポジトリでも同じ問題を抱えていました。ドキュメント取得や CHANGELOG 処理のワークフローがたびたび失敗していました。Issue 作成は自動化していたものの、原因調査と修正は毎回手動でした。今回は Agentic Workflows で CI が失敗したとき自動で診断・修正するワークフローを構築しました。セットアップから実際の動作検証まで、実体験をもとに紹介します。

## GitHub Agentic Workflows とは

GitHub Agentic Workflows (以下 gh-aw) は、GitHub Actions 上でコーディングエージェント (AI) を動作させるリポジトリ自動化のしくみです。2026 年 2 月時点ではテクニカルプレビュー[^technical-preview]の段階にあります。

従来の GitHub Actions は YAML に「このコマンドを実行して、成功したら次のコマンドを実行する」という手順を事前に決めて書くしくみです。つまり、決めた手順どおりにしか動きません。一方で gh-aw は、Markdown に自然言語で「何をしてほしいか」を書くと、AI エージェントがその指示を読み取り、自分で判断しながらタスクを実行します。

| 観点         | 従来の GitHub Actions     | Agentic Workflows                               |
| ------------ | ------------------------- | ----------------------------------------------- |
| 定義形式     | YAML (決定論的なステップ) | Markdown (意図・ゴールを自然言語で記述)         |
| 実行者       | 固定スクリプト            | コーディングエージェント (AI)                   |
| 判断力       | なし (if/then の分岐のみ) | あり (ログ解析、原因推論、修正案の生成)         |
| 適したタスク | ビルド、テスト、デプロイ  | トリアージ[^triage]、ドキュメント更新、品質改善 |

GitHub はこれを「Continuous AI」と呼んでいます。公式ドキュメントでは "systematic, automated application of AI to software collaboration" (ソフトウェア開発への AI の体系的かつ自動的な適用) と定義されています。CI/CD[^cicd] が「ものを作る作業」を自動化するように、Continuous AI は「問題を調べて対応する作業」を AI で自動化します。
## 何を作ったのか

今回は CI Doctor というワークフローを作りました。対象ワークフロー (ドキュメント取得、CHANGELOG 処理) が失敗したときに、AI エージェントが自動で起動して以下を行います。

1. 失敗ログを取得し、根本原因を特定する
2. 既存の Issue と重複しないか検索してから、Issue 作成またはコメント追加
3. コードバグや設定ミスの場合は修正パッチを生成する

外部 API の障害や Git の競合のように、コードを直しても意味がない失敗では Issue だけ作成し、修正 PR は作成しません。エージェントに原因のカテゴリ分けまでやらせて、対応方針を変えさせるようにしています。

## ファイル構成としくみ

gh-aw のワークフローは 2 つのファイルで構成されます。

```bash
.github/workflows/
  ci-doctor.md          ← 人間が編集するファイル (frontmatter + Markdown指示)
  ci-doctor.lock.yml    ← gh aw compile で自動生成 (GitHub Actions が実行するファイル)
```

`.md` ファイルが「ソース」で、`.lock.yml` が「コンパイル済み成果物」です。`.lock.yml` は手動編集しません。この関係は `package.json` と `package-lock.json`[^package-lock] に似ていますね。

### .md ファイルの中身

`.md` ファイルは frontmatter (YAML) と Markdown 指示の 2 つのパートで構成されています。frontmatter にはトリガ条件、権限、ネットワークアクセス、エージェントが実行可能な操作を定義します。Markdown 指示には「何をしてほしいか」を自然言語で書きます。

実際に作った `ci-doctor.md` を見てみます。

````md
---
description: |
  対象ワークフロー(ドキュメント取得、CHANGELOG処理)の失敗を自動診断する。
  ログ解析により根本原因を特定し、既存Issueへのコメントまたは新規Issue作成を行う。
  設定ミスやコードバグなど単純な原因の場合は修正PRを作成する。

on:
  workflow_run:
    workflows:
      - "Fetch Claude Code Documentation"
      - "Fetch and Analyze CHANGELOG"
    types:
      - completed
    branches:
      - main
  status-comment: true

if: ${{ github.event.workflow_run.conclusion == 'failure' }}

permissions:
  contents: read
  actions: read
  issues: read
  pull-requests: read

network:
  allowed:
    - defaults
    - node
    - github

safe-outputs:
  create-issue:
    title-prefix: "[CI Doctor] "
    labels: [bug, automated, ci-doctor]
    max: 1
    close-older-issues: true
  add-comment:
    max: 3
  create-pull-request:
    title-prefix: "[CI Fix] "
    labels: [bug, automated, ci-doctor]
    max: 1

tools:
  github:
    toolsets: [issues, pull_requests, actions]

engine: copilot

timeout-minutes: 15

---

# CI 失敗診断エージェント

あなたはこのリポジトリの CI 失敗を診断するエキスパートエージェントです。
失敗したワークフローのログを分析し、根本原因を特定し、可能であれば修正を行います。

## 現在のコンテキスト

- **リポジトリ**: ${{ github.repository }}
- **ワークフロー実行ID**: ${{ github.event.workflow_run.id }}
- **実行URL**: ${{ github.event.workflow_run.html_url }}
- **コミットSHA**: ${{ github.event.workflow_run.head_sha }}
- **結論**: ${{ github.event.workflow_run.conclusion }}

## プロジェクト構造

このリポジトリは pnpm workspace モノレポで以下の構成:

```
apps/
  www/                - Astro フロントエンド (Cloudflare Workers デプロイ)
  docs-tracker/       - ドキュメント取得 (GitHub Actions 定期実行)
  changelog-fetcher/  - CHANGELOG パーサー (GitHub Actions 定期実行、Gemini API 使用)
```

重要な規約:
- ログ・コメント・Issue本文・コミットメッセージは **日本語** で記載する
- コード修正後は `pnpm run ai-check` でフォーマット・リント・型チェックを実行する
- 以下のファイルは **自動生成のため手動編集禁止**:
  - `apps/docs-tracker/metadata/last_update.json`
  - `apps/changelog-fetcher/metadata/last_fetch.json`
  - `apps/changelog-fetcher/changelogs/v*.md`
  - `apps/changelog-fetcher/analysis/analysis_v*.json`
  - `apps/changelog-fetcher/inferred/inferred_v*.json`

## 対象ワークフローの失敗パターン

### Fetch Claude Code Documentation (`fetch-docs.yml`)

よくある原因:
- ドキュメント取得スクリプトのエラー (`apps/docs-tracker/`)
- git rebase/push の競合
- GitHub API レート制限
- pnpm セットアップの問題

### Fetch and Analyze CHANGELOG (`changelog-auto-inference.yml`)

よくある原因:
- CHANGELOG 取得・パースのエラー (`apps/changelog-fetcher/`)
- Gemini API 呼び出し失敗 (レート制限、APIキー期限切れ)
- 分析/推論ファイルの生成失敗
- git rebase/push の競合
- pnpm セットアップの問題

## 診断手順

### フェーズ 1: ログ取得と初期分析

1. 失敗した実行の詳細を取得する
2. 失敗したジョブを特定する
3. 失敗ジョブのログを取得する
4. エラーメッセージ、スタックトレース、終了コードを抽出する

### フェーズ 2: 根本原因の分類

失敗を以下のカテゴリに分類する:

| カテゴリ     | 例                                            | 修正PR作成      |
| ------------ | --------------------------------------------- | --------------- |
| コードバグ   | TypeScript コンパイルエラー、ランタイムエラー | 可能            |
| 設定ミス     | ワークフローYAML、package.json の誤り         | 可能            |
| 外部API障害  | Gemini API、GitHub API のレート制限/障害      | 不可(Issueのみ) |
| インフラ問題 | ランナー障害、ネットワーク問題                | 不可(Issueのみ) |
| git競合      | rebase/push 失敗                              | 不可(Issueのみ) |

### フェーズ 3: 重複Issue検索

Issue作成や修正PR作成の前に、必ず既存のIssueを検索する。

1. ラベル `bug,automated` でオープンなIssueを検索する
2. 以下のタイトルパターンに一致するIssueを探す:
   - `[CI Doctor]` プレフィックスのIssue
   - `Documentation fetch failed` を含むIssue
   - `Changelog processing failed` を含むIssue
3. 同じ根本原因のIssueが既に存在する場合:
   - そのIssueにコメントを追加し、今回の失敗情報を記録する
   - 新規Issueは作成しない
4. 該当するIssueがない場合のみ、新規Issueを作成する

### フェーズ 4: 修正PR作成 (コードバグ・設定ミスの場合のみ)

1. 根本原因に基づいて修正を実装する
2. `pnpm run ai-check` を実行して修正を検証する
3. 修正PRを作成する

修正PRの注意事項:
- 自動生成ファイル (上記リスト) は **絶対に変更しない**
- コミットメッセージは日本語で記載する
- PRの説明には根本原因と修正内容を日本語で記載する

### フェーズ 5: 報告

Issue または PR の本文には以下を含める:

```md
## 診断結果

**失敗ワークフロー**: [ワークフロー名]
**実行URL**: [リンク]
**失敗日時**: [タイムスタンプ]

## 根本原因

[原因の詳細な説明]

## エラーログ (抜粋)

[関連するエラーメッセージ]

## 対応

[実施した対応または推奨する対応手順]

## 再発防止

[再発を防ぐための提案]
```

## 重要な制約

- 外部API障害 (Gemini API レート制限等) の場合はIssue作成のみ行い、修正PRは作成しない
- git競合による失敗は一時的な問題であることが多いため、Issueには再試行を推奨する旨を記載する
- Issue・PR・コメントはすべて **日本語** で記載する
- セキュリティに関わる情報 (APIキー、トークン等) はログやIssueに含めない

````

`on` で `workflow_run` の `completed` + `failure` フィルタを指定しています。対象ワークフローが失敗で完了したときだけエージェントが起動します。

`permissions` はすべて `read` のみです。エージェントに write 権限を与えません。「read しかないのにどうやって PR を作るのか」という疑問が浮かびますが、エージェントは「PR を作りたい」というリクエストを記録するだけです。実際の作成は、コンパイラが自動生成する別ジョブ (`safe_outputs`) が write 権限で行います。この権限分離の詳細はセキュリティ設計のセクションで説明します。

`safe-outputs` がエージェントの「できること」を定義しています。Issue は 1 回の実行で最大 1 件、コメントは最大 3 件、PR も最大 1 件。`max` で暴走を防止しています。`close-older-issues: true` を設定すると、同じ接頭辞の古い Issue を自動でクローズしてくれるので、Issue がたまりません。

`engine` は `copilot` を選択しました。Copilot サブスクリプション[^copilot-subscription]のプレミアムリクエスト内で動作するため、追加の API 費用が不要です。`claude`、`codex`、`gemini` も選択できますが、それぞれ Anthropic / OpenAI / Google のアカウントと API キーが別途必要で、各社の従量課金が発生します。GitHub のプレミアムリクエストとは別の課金体系です。

普段 Claude Code の `CLAUDE.md`[^claude-md] を書いている感覚と同じです。エージェントに「あなたはこのリポジトリの CI 失敗を診断するエキスパートです」と伝え、プロジェクトの構造や規約を教え、何をどの順番でやるかを指示します。

## セットアップの手順

以下の手順は GitHub CLI (`gh`) がインストール済みであることを前提としています ([GitHub CLI 公式サイト](https://cli.github.com/))。

まず gh-aw CLI を GitHub CLI の拡張機能としてインストールします。

```bash
gh extension install github/gh-aw
```

次に Issue/PR に付与するラベルを事前に作成しておきます。

```bash
gh label create "ci-doctor" --description "CI Doctor による自動診断" --color "7057ff"
```

`.md` ファイルの作成後、`.lock.yml` にコンパイルします。

```bash
gh aw compile
```

初回はエラーが出ました。

```
Validation failed for field 'expressions'
1 unauthorized expressions found:
  - github.event.workflow_run.name
    (did you mean: github.event.workflow_run.number?)
```

Markdown 指示部分で `${{ github.event.workflow_run.name }}` を使っていたのですが、この式は許可リストに含まれていませんでした。gh-aw はプロンプトインジェクション防止のために、使用可能な式を厳密に制限しています。ワークフロー名 (`name`) は取得できず、代わりに実行 ID (`id`) や実行 URL (`html_url`) は使えます。エージェントは URL を見ればどのワークフローかわかるので、実質的な問題はありません。

修正後に再コンパイルすると成功します。

```bash
✓ .github/workflows/ci-doctor.md (67.5 KB)
✓ Compiled 1 workflow(s): 0 error(s), 0 warning(s)
```

約 188 行の `.md` から約 1,365 行の `.lock.yml` が生成されます。ほとんどはセキュリティ基盤のコードです。

最後にシークレットを設定します。`engine: copilot` を使う場合、GitHub Actions のランナーから Copilot のエージェント API を呼び出すための認証情報が必要です。リポジトリ操作用の `GITHUB_TOKEN` はエージェント API へのアクセス権限を持たないため、別途 fine-grained Personal Access Token (PAT)[^fine-grained-pat] を作成します。

1. GitHub Settings > Developer settings > Fine-grained tokens で PAT を作成する (スコープは `copilot-requests`)
2. リポジトリシークレットをghコマンド、またはGUIから設定する

```bash
gh secret set COPILOT_GITHUB_TOKEN
```

## 検証してみた

意図的に CI を失敗させて動作を確認しました。`fetch-docs.yml` の steps 先頭に `exit 1`[^exit-code] のステップを追加して即座に失敗させる方法です。

```bash
01:00:08  fetch-docs.yml 手動実行
01:00:09  "CI Doctor test" ステップで exit 1 → 即座に失敗
01:00:09  既存処理が Issue #31 を自動作成
01:00:18  ci-doctor ワークフローが workflow_run トリガーで起動
01:00:18  ├─ pre_activation (17秒): チームメンバーシップ確認
01:00:37  ├─ activation (23秒): プロンプト生成・バリデーション
01:01:02  ├─ agent (2分27秒):  # メインのエージェント実行
01:03:31  ├─ detection (23秒): 脅威検出
01:03:56  ├─ safe_outputs (28秒): Issue/PR の実際の作成
01:04:26  └─ conclusion (18秒): 完了処理
01:04:18  Issue #32 が作成される
          # 合計: 4分ちょい
```

fetch-docs の失敗から Issue 作成まで約 4 分ほどで、そのうちエージェント本体の実行は 2 分 27 秒、残りはセキュリティ基盤の環境構築です。

実際にエージェントが作成した Issue #32 は[こちら](https://github.com/Suntory-N-Water/claude-code-changelog-viewer/issues/32)です。

![GitHub Agentic Workflowで作成されたissue](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/1b0988bc77322c8c5b399d4c0cacbe70.png)

- 根本原因を正確に特定し、`exit 1` を含むテストステップが原因と正しく診断
- 該当ステップのログを正確に抜粋
- `exit 1` ステップを削除する Git コミットを作成し修正パッチを作成
- 既存 Issue(Issue #31)との紐づけ

エージェントが生成した修正パッチは以下のような diff でした。

```diff
--- a/.github/workflows/fetch-docs.yml
+++ b/.github/workflows/fetch-docs.yml
@@ -33,9 +33,6 @@ jobs:
       commit_sha: ${{ steps.get-sha.outputs.sha }}

     steps:
-      - name: CI Doctor test
-        run: exit 1
-
       - name: Checkout repository
```

コミットメッセージもエージェントが日本語で作成していて、Co-authored-by に `Copilot` が付与されています。今回は意図的なエラーで修正は単純ですが、実際の運用ではログ解析から修正パッチ生成までの調査が自動化されます。

## lock.yml から読み解くセキュリティ設計

正直に言うと、gh-aw を使う前は「AI にリポジトリの write 権限を渡すのは怖い」と思っていました。AI が意図せず既存のコードを書き換えたり、大量の Issue や PR を作成したりする不安です。でも `.lock.yml` の中身を読んでみて、その印象は変わりました。

約 1,365 行の lock.yml のうち、ユーザーが書いた内容が反映される部分は 2 割程度です。残りの 8 割はコンパイラが自動挿入したセキュリティ基盤です。いくつか紹介します。

### エージェントには read 権限しかない

```yaml
agent:              # ← エージェントが動くジョブ
  permissions:
    actions: read
    contents: read
    issues: read
    pull-requests: read    # すべて read のみ

safe_outputs:       # ← GitHub 操作を実際に実行するジョブ
  permissions:
    contents: write
    issues: write
    pull-requests: write   # write 権限はここだけ
```

エージェントが動く `agent` ジョブと、GitHub への write 操作を担う `safe_outputs` ジョブは分離されています。エージェントは「Issue を作りたい」というリクエストを safe-outputs に記録するだけです。実際の作成は、別ジョブが別の権限で行います。身近な例で言えば、会社の経費精算に似ています。担当者は「申請」しかできず、実際にお金を動かすのは経理部門だけ、という分業です。AI エージェントも「申請」しかできず、実際の操作は別の安全なしくみが行います。

### ネットワークファイアウォール

frontmatter で `network: [defaults, node, github]` と書くと、コンパイラがこれを 80 個以上のドメインを含むホワイトリストに展開します。実際に lock.yml に生成されるコマンドを見ると、3 語の抽象指定がどう変換されるかがわかります。

```bash
# ci-doctor.md で書いた内容
# network:
#   allowed: [defaults, node, github]

# lock.yml で展開された結果 (80ドメイン以上、一部抜粋)
sudo -E awf --allow-domains '*.githubusercontent.com,api.github.com,
  registry.npmjs.org,yarnpkg.com,nodejs.org,npm.pkg.github.com,...'
```

実行時は Agent Workflow Firewall が Squid プロキシ[^squid]をコンテナ内で起動し、このホワイトリスト以外への通信をすべてブロックします。

エージェントがコード実行権限を持つ以上、`curl` で任意のサーバにデータを送信する可能性があります。ホワイトリスト外への通信をネットワーク層でブロックすることで、エージェントのコードレベルでの制御に依存しない防御を実現しています。

### AI の出力を AI が検証する

`detection` ジョブでは、agent ジョブが生成した出力 (Issue 本文、PR 本文、パッチ) を別のエージェントが安全性を検証します。

```yaml
detection:
  needs: agent
  steps:
    - name: Execute GitHub Copilot CLI
      run: |
        copilot --allow-tool 'shell(cat)' --allow-tool 'shell(grep)' \
                --allow-tool 'shell(head)' --allow-tool 'shell(jq)' \
                --allow-tool 'shell(ls)' --allow-tool 'shell(tail)' \
                --allow-tool 'shell(wc)'
```

検出エージェントに許可されているのは、cat, grep, jq 等の読み取り専用シェルコマンドのみです。agent ジョブとは独立したコンテキストで動作し、write 権限もネットワークアクセスもありません。「AI の出力を AI が検証する」という構造で、独立したコンテキストが共謀のリスクを下げています。

### プロンプトインジェクション対策

ユーザーが書いた Markdown 指示は、セキュリティ用のシステムプロンプトでサンドイッチ[^sandwich]されています。

```
[XPIA対策のシステムプロンプト]
[safe-outputs の使い方]
[GitHub コンテキスト]
[ユーザーの Markdown 指示]  ← ここ
```

XPIA[^xpia] (Cross-Prompt Injection Attack) 対策として、エージェントがログや Issue 本文に含まれる悪意のあるプロンプトに従わないよう指示が先に注入されています。さらに `${{ }}` 式は許可リストで厳密に制限されているため、プロンプトインジェクションの余地を狭めています。

### セキュリティ設計の全体像

lock.yml には全部で 11 層の防御が自動で構築されています。

1. 実行制御 - チームメンバーシップ検証
2. fork 検証 - リポジトリ ID・fork チェック
3. プロンプト保護 - XPIA 対策、システムプロンプト注入
4. 式バリデーション - プレースホルダの 3 段階置換・検証
5. ネットワーク - Squid プロキシによるドメイン制限
6. API 仲介 - MCP Gateway[^mcp-gateway] による全通信仲介
7. 出力バリデーション - Safe Outputs の回数・内容制限
8. 権限分離 - agent=read / safe_outputs=write
9. 脅威検出 - 別エージェントによる出力検証
10. 秘密情報保護 - ログ・アーティファクトのマスキング
11. 出力制御 - タイトル接頭辞・ラベル強制

ユーザーは「失敗を診断して Issue を作りたい」という意図を 188 行の Markdown で書くだけで、コンパイラがこれだけのセキュリティ防御を自動で構築してくれます。

## frontmatter を書くときの注意点

最初に作った frontmatter はいくつか甘い部分がありました。実際にハマったポイントと、設定しておくべき項目を紹介します。

`safe-outputs` の `max` は必ず明示するのが安全です。デフォルト値に依存するより、明示的に上限を書いておくことでエージェントが暴走した際のガードレールになります。たとえば `create-issue: max: 1` と書けば、1 回の実行で Issue は 1 件しか作成できません。同様に `close-older-issues: true` を設定すると、同じ接頭辞の古い Issue を自動でクローズするので、Issue がたまるのを防げます。

`permissions` は `read-all` ではなく個別に指定するのが推奨です。最小権限の原則に従い、必要な権限だけを明示する方が安全です。

`network` はデフォルトが `strict: true` ですので、明示指定しないと外部通信が一切できません。最初は「なぜ pnpm install が失敗するんだ」と悩みましたが、`node` を追加したら解決しました。エージェントが使う外部サービスに応じて `defaults`、`node`、`github` などを指定します。

`tools.github` には `toolsets` で必要な API のみを指定するとよいでしょう。全 API を開放するよりも、`[issues, pull_requests, actions]` のように限定する方が、エージェントが不要な API にアクセスするリスクを減らせます。

## まとめ

- GitHub Agentic Workflows は、Markdown に自然言語で指示を書くだけで AI エージェントが GitHub Actions 上でタスクを実行するしくみ
- CI の失敗診断・修正のような「判断が必要なタスク」に向いていて、従来の決定論的な YAML ベースの Actions を拡張する位置付け
- 188 行の `.md` から約 1,365 行の `.lock.yml` が生成され、その 8 割はセキュリティ基盤。権限分離・ネットワークファイアウォール・脅威検出など 11 層の自動防御
- エージェントに直接 write 権限を与えず、safe-outputs 経由でのみ操作を許可する特権分離の設計
- テクニカルプレビュー段階だが、意図的な `exit 1` を正確に検出し修正パッチまで生成できる実用的な診断能力

テクニカルプレビューなので仕様は変わる可能性がありますが、「AI にリポジトリを触らせる」ことの不安を、プラットフォームレベルのセキュリティで解消しようとしているアプローチには好感を持っています。特に lock.yml を読んでみると、「AI を使うこと」と「AI を安全に使うこと」の間にあるギャップを、ユーザーが意識しなくても済む形で埋めようとしている設計思想が伝わってきます。

## 参考

https://github.github.io/gh-aw/

https://github.github.io/gh-aw/introduction/how-they-work/

https://github.github.io/gh-aw/setup/quick-start/

https://github.github.io/gh-aw/reference/engines/

https://github.github.io/gh-aw/introduction/architecture/

https://github.blog/jp/2026-02-16-automate-repository-tasks-with-github-agentic-workflows/

[^triage]: Issue や障害の重要度・緊急度を判断して優先順位をつける作業のこと。もともとは医療用語で、限られたリソースの中で対応順を決めるプロセスを指す。
[^fine-grained-pat]: GitHub の Fine-grained Personal Access Token の略。リポジトリ単位・権限単位できめ細かくスコープを制限できるアクセストークン。従来の classic PAT よりセキュリティが高い。
[^squid]: オープンソースのHTTPプロキシサーバ。ここではコンテナ内でフォワードプロキシ(通信の中継役)として動作し、許可されたドメイン以外への通信をブロックする役割を担っている。
[^sandwich]: 前後をセキュリティ用のプロンプトで挟み込む手法のこと。ユーザーの指示より先にセキュリティ制約を注入することで、悪意のある入力による制約の上書きを防ぐ。
[^xpia]: Cross-Prompt Injection Attack の略。AI エージェントが処理する外部データ (ログ、Issue 本文など) に悪意のあるプロンプトを埋め込み、エージェントの動作を乗っ取ろうとする攻撃手法。
[^mcp-gateway]: Model Context Protocol Gateway の略。エージェントと外部サービス (GitHub API など) の間に立ち、すべてのリクエストを仲介・検証するプロキシ。エージェントが直接 API を呼び出せないようにする中間層として機能する。
[^deterministic]: 同じ入力に対して常に同じ出力を返すこと。「もし A なら B を実行」という固定のルールで動作し、AI のような柔軟な判断は行わない。
[^cicd]: Continuous Integration / Continuous Delivery の略。コードをプッシュするたびに自動でビルド・テスト・デプロイを実行する開発手法。
[^exit-code]: プログラムが終了するときに返す数値。`exit 0` は成功、`exit 1` 以上は失敗を意味する。CI はこの値を見て処理の成否を判断する。
[^copilot-subscription]: GitHub Copilot の有料プラン。AI によるコード補完・チャット機能が利用できる。プレミアムリクエストは月ごとの利用枠が設定されており、枠内の利用であれば追加料金は発生しない。
[^package-lock]: npm が自動生成するファイルで、パッケージの正確なバージョンを固定する。`package.json` が「方針」、`package-lock.json` が「実際の状態記録」。
[^technical-preview]: 製品として一般公開する前の試験的な提供段階。仕様が変わる可能性があり、本番利用は推奨されない。
[^claude-md]: Claude Code がプロジェクト内で自動的に読み取る指示ファイル。プロジェクト固有のコーディング規約や手順を記述しておくことで、Claude Code が毎回一貫した動作をするようになる。

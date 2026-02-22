---
title: 自然言語で自動化ワークフローを作成できるGitHub Agentic Workflowsを試してみた
slug: github-agentic-workflows-ci-doctor
date: 2026-02-22
modified_time: 2026-02-22
description: GitHub Agentic Workflowsを使って、CIの失敗を自動で診断・修正するワークフローを作りました。Markdownに自然言語で指示を書くだけで、AIエージェントがログを解析し、原因を特定し、修正パッチまで生成します。セットアップから検証結果、セキュリティ設計まで実体験をもとに解説します。
icon: 🤖
icon_url: /icons/robot_flat.svg
tags:
  - AI
  - GitHub
  - GitHubActions
---

私が運用しているリポジトリでは、GitHub Actions のワークフローが定期的に動いています。ドキュメントの自動取得が 3 時間ごと、CHANGELOG の解析と推論が毎時。便利なのですが、たまに失敗します。外部 API のレート制限だったり、Git の競合だったり、原因は毎回バラバラです。

失敗すると GitHub Issue が自動で作成されるしくみは入れていましたが、原因の調査と修正は結局手動でした。「ログを見て原因を特定して、コードを直して、PR を出す」という一連の作業を、AI にやらせることはできないのか。そう思っていたところに、GitHub Agentic Workflows というテクニカルプレビューの機能を見つけました。

## GitHub Agentic Workflows とは

GitHub Agentic Workflows (以下 gh-aw) は、GitHub Actions 上でコーディングエージェント (AI) を動作させるリポジトリ自動化のしくみです。2026 年 2 月時点ではテクニカルプレビューの段階にあります。

従来の GitHub Actions は YAML で決定論的なステップを定義するしくみでした。「このコマンドを実行して、成功したら次のコマンドを実行する」という if/then の世界です。一方で gh-aw は、Markdown に自然言語で「何をしてほしいか」を書きます。AI エージェントがその指示を読み取り、自分で判断しながらタスクを実行します。

| 観点         | 従来の GitHub Actions     | Agentic Workflows                               |
| ------------ | ------------------------- | ----------------------------------------------- |
| 定義形式     | YAML (決定論的なステップ) | Markdown (意図・ゴールを自然言語で記述)         |
| 実行者       | 固定スクリプト            | コーディングエージェント (AI)                   |
| 判断力       | なし (if/then の分岐のみ) | あり (ログ解析、原因推論、修正案の生成)         |
| 適したタスク | ビルド、テスト、デプロイ  | トリアージ[^triage]、ドキュメント更新、品質改善 |

GitHub はこれを「Continuous AI」と呼んでいます。公式ドキュメントでは "systematic, automated application of AI to software collaboration" (ソフトウェア開発への AI の体系的かつ自動的な適用) と定義されています。CI/CD が「ビルド・テスト・デプロイ」を自動化するように、Continuous AI は「トリアージ・ドキュメント・品質維持」を AI で自動化します。CI/CD を置き換えるのではなく拡張する位置付けです。

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

`.md` ファイルが「ソース」で、`.lock.yml` が「コンパイル済み成果物」です。`.lock.yml` は手動編集しません。この関係は `package.json` と `package-lock.json` に似ていますね。

### .md ファイルの中身

`.md` ファイルは frontmatter (YAML) と Markdown 指示の 2 つのパートで構成されています。frontmatter にはトリガ条件、権限、ネットワークアクセス、エージェントが実行可能な操作を定義します。Markdown 指示には「何をしてほしいか」を自然言語で書きます。

実際に作った `ci-doctor.md` の frontmatter を見てみます。

```yaml
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
```

ポイントをいくつか解説します。

`on` で `workflow_run` の `completed` + `failure` フィルタを指定しています。対象ワークフローが失敗で完了したときだけエージェントが起動します。

`permissions` はすべて `read` のみです。エージェントに write 権限を与えません。「read しかないのに PR をどうやって作るのか」という疑問が浮かびますが、エージェントは「PR を作りたい」というリクエストを記録するだけで、実際の作成はコンパイラが自動生成する別ジョブ (`safe_outputs`) が write 権限で行います。この権限分離の詳細はセキュリティ設計のセクションで説明します。

`safe-outputs` がエージェントの「できること」を定義しています。Issue は 1 回の実行で最大 1 件、コメントは最大 3 件、PR も最大 1 件。`max` で暴走を防止しています。`close-older-issues: true` を設定すると、同じ接頭辞の古い Issue を自動でクローズしてくれるので、Issue がたまりません。

`engine` は `copilot` を選択しました。Copilot サブスクリプションのプレミアムリクエスト内で動作するため、追加の API 費用が不要です。`claude` や `codex` も選択できますが、それぞれ Anthropic / OpenAI のアカウントと API キーが別途必要で、各社の従量課金が発生します。GitHub のプレミアムリクエストとは別の課金体系です。

### Markdown 指示の部分

frontmatter の下の Markdown 部分がエージェントへのプロンプトです。ここには以下の情報を書いています。

- プロジェクト構造 (pnpm モノレポ、各アプリケーションの役割)
- 規約 (日本語記載、`pnpm run ai-check` の実行、自動生成ファイルの編集禁止)
- 対象ワークフローごとの典型的な失敗パターン
- 5 段階の診断手順 (ログ取得 → 原因分類 → 重複検索 → 修正 → 報告)
- 原因カテゴリ別の対応方針 (コードバグなら PR、API 障害なら Issue のみ)
- Issue/PR 本文のテンプレート

普段 Claude Code のカスタムインストラクションを書いている感覚と同じです。エージェントに「あなたはこのリポジトリの CI 失敗を診断するエキスパートです」と伝え、プロジェクトの構造や規約を教え、何をどの順番でやるかを指示します。

## セットアップの手順

以下の手順は GitHub CLI (`gh`) がインストール済みであることを前提としています。

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

最後にシークレットを設定します。`engine: copilot` を使う場合、GitHub Actions のランナーから Copilot のエージェント API を呼び出すための認証情報が必要です。リポジトリ操作用の `GITHUB_TOKEN` はエージェント API へのアクセス権限を持たないため、別途 fine-grained PAT[^fine-grained-pat] を作成します。

1. GitHub Settings > Developer settings > Fine-grained tokens で PAT を作成する (スコープは `copilot-requests`)
2. リポジトリシークレットをghコマンド、またはGUIから設定する

```bash
gh secret set COPILOT_GITHUB_TOKEN
```

## 検証してみた

意図的に CI を失敗させて動作を確認しました。`fetch-docs.yml` の steps 先頭に `exit 1` のステップを追加して即座に失敗させる方法です。シークレットを触らず、ソースコードも汚さない、1 行追加して 1 行削除するだけの検証方法です。

失敗から Issue 作成までの時系列は以下の通りです。

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

エージェントが自動で作成した Issue #32 を見てみましょう。
実際に作成されたイシューは[こちら](https://github.com/Suntory-N-Water/claude-code-changelog-viewer/issues/32)です。

![GitHub Agentic Workflowで作成されたissue](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/1b0988bc77322c8c5b399d4c0cacbe70.png)

作成した内容を見ると、指示したとおりの内容が記載されていることがわかります。
- 根本原因を正確に特定し、`exit 1` を含むテストステップが原因と正しく診断
- 該当ステップのログを正確に抜粋
- `exit 1` ステップを削除する Git コミットを作成し修正patchを作成
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

コミットメッセージもエージェントが日本語で作成していて、Co-authored-by に `Copilot` が付与されています。今回は意図的なエラーだったため修正は単純ですが、実際の運用ではログを読み、原因を追い、修正を考えるという一連の調査作業が発生します。そうした調査から修正パッチの生成までを自動で行ってくれるのがこのしくみのメリットです。

## lock.yml から読み解くセキュリティ設計

正直に言うと、gh-aw を使う前は「AI にリポジトリの write 権限を渡すのは怖い」と思っていました。でも `.lock.yml` の中身を読んでみて、その印象は変わりました。

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

エージェントが動く `agent` ジョブと、GitHub への write 操作を担う `safe_outputs` ジョブは分離されています。エージェントは「Issue を作りたい」というリクエストを safe-outputs に記録するだけで、実際の作成は別ジョブが別の権限で行います。これは OS のセキュリティモデルにおける特権分離 (Privilege Separation) と同じ考え方です。信頼できないコード (AI エージェント) は低権限で実行し、特権操作は検証済みのデータに基づいて別プロセスが行うという設計パターンです。

### ネットワークファイアウォール

frontmatter で `network: [defaults, node, github]` と書くと、コンパイラがこれを具体的なドメイン 80 個以上のホワイトリストに展開します。実際に lock.yml に生成されるコマンドを見ると、3 語の抽象指定がどう変換されるかがわかります。

```bash
# ci-doctor.md で書いた内容
# network:
#   allowed: [defaults, node, github]

# lock.yml で展開された結果 (80ドメイン以上、一部抜粋)
sudo -E awf --allow-domains '*.githubusercontent.com,api.github.com,
  registry.npmjs.org,yarnpkg.com,nodejs.org,npm.pkg.github.com,...'
```

実行時は Agent Workflow Firewall が Squid プロキシ[^squid]をコンテナ内で起動し、このホワイトリスト以外への通信をすべてブロックします。

エージェントがコード実行権限を持つ以上、`curl` で任意のサーバにデータを送信する可能性があります。ネットワーク層でブロックすることで、エージェントのコードレベルでの制御に依存しない防御を実現しています。

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

検出エージェントには最小限のシェルコマンド (cat, grep, jq 等の読み取り専用コマンド) のみが許可されています。agent ジョブとは独立したコンテキストで動作し、write 権限もネットワークアクセスもありません。「AI の出力を AI が検証する」という構造は興味深いですし、共謀のリスクが低い設計になっています。

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

lock.yml を読むとわかりますが、全部で 11 層の防御が自動で構築されます。

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

ユーザーは「失敗を診断して Issue を作りたい」という意図を 188 行の Markdown で書くだけで、コンパイラがこれだけのセキュリティ防御を自動で構築してくれます。「AI を使う」と「AI を安全に使う」の間にあるギャップを、プラットフォームレベルで埋めようとしているのだと感じました。

## frontmatter を書くときの注意点

最初に作った frontmatter はいくつか甘い部分がありました。実際にハマったポイントと、設定しておくべき項目を紹介します。

`safe-outputs` の `max` は必ず設定しましょう。設定しないとデフォルト値が適用されますが、明示的に上限を書いておくことでエージェントが暴走した際のガードレールになります。たとえば `create-issue: max: 1` と書けば、1 回の実行で Issue は 1 件しか作成できません。同様に `close-older-issues: true` を設定すると、同じ接頭辞の古い Issue を自動でクローズするので、Issue がたまるのを防げます。

`permissions` は `read-all` ではなく個別に指定しましょう。最小権限の原則に従い、必要な権限だけを明示する方が安全です。

`network` はデフォルトが `strict: true` ですので、明示指定しないと外部通信が一切できません。最初は「なぜ pnpm install が失敗するんだ」と悩みましたが、`node` を追加したら解決しました。エージェントが使う外部サービスに応じて `defaults`、`node`、`github` などを指定します。

`tools.github` には `toolsets` で必要な API のみを指定しましょう。全 API を開放するよりも、`[issues, pull_requests, actions]` のように限定する方がリスクを減らせます。

## まとめ

- GitHub Agentic Workflows は、Markdown に自然言語で指示を書くだけで AI エージェントが GitHub Actions 上でタスクを実行するしくみ
- CI の失敗診断・修正のような「判断が必要なタスク」に向いていて、従来の決定論的な YAML ベースの Actions を拡張する位置付け
- 188 行の `.md` から約 1,365 行の `.lock.yml` が生成され、その 8 割はセキュリティ基盤。権限分離、ネットワークファイアウォール、脅威検出など 11 層の防御が自動で構築される
- エージェントに直接 write 権限を与えず、safe-outputs 経由でのみ操作を許可する特権分離の設計は、「AI を安全に使う」ための現実的なアプローチ
- テクニカルプレビュー段階だが、実際に使ってみると診断精度は高く、意図的な `exit 1` を正確に検出して修正パッチまで生成した

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
[^squid]: オープンソースのHTTPプロキシサーバ。ここではコンテナ内でフォワードプロキシとして動作し、許可されたドメイン以外への通信をブロックする役割を担っている。
[^sandwich]: 前後をセキュリティ用のプロンプトで挟み込む手法のこと。ユーザーの指示より先にセキュリティ制約を注入することで、悪意のある入力による制約の上書きを防ぐ。
[^xpia]: Cross-Prompt Injection Attack の略。AI エージェントが処理する外部データ (ログ、Issue 本文など) に悪意のあるプロンプトを埋め込み、エージェントの動作を乗っ取ろうとする攻撃手法。
[^mcp-gateway]: Model Context Protocol Gateway の略。エージェントと外部サービス (GitHub API など) の間に立ち、すべてのリクエストを仲介・検証するプロキシ。エージェントが直接 API を呼び出せないようにする中間層として機能する。

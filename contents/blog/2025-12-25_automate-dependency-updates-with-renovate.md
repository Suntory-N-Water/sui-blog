---
title: Renovate で作る「頑張らない」運用のすすめ
slug: automate-dependency-updates-with-renovate
date: 2025-12-25
modified_time: 2025-12-25
description: 依存関係更新の手動対応をやめて、Renovate で自動化する方法をまとめました。クールダウン期間(minimum release age)を設定してサプライチェーン攻撃のリスクを回避しつつ、手間をかけずに安全性を維持する「頑張らない運用」の設計方針を紹介します。
icon: ♻️
icon_url: /icons/recycling_symbol_flat.svg
tags:
  - Renovate
  - GitHubActions
diagram:
  - type: hero
    date: "2025/12/25"
    title: "Renovate で作る「頑張らない」運用のすすめ"
    subtitle: "依存関係更新の自動化とクールダウン期間設定で実現する、安全で持続可能な開発運用"
  - type: problem
    variant: highlight
    icon: alertCircle
    title: "手動更新が抱える構造的な欠陥"
    introText: "「やらなければならない」という強制感が認知負荷を高め、結果としてセキュリティリスクを増大させます。"
    cards:
      - icon: clock
        title: "終わらない作業"
        subtitle: "認知負荷の増大"
        description: "頻繁な更新作業が強制され、開発者の精神的負担となる。"
      - icon: userX
        title: "属人化する運用"
        subtitle: "担当者依存のリスク"
        description: "特定の担当者しか対応できず、不在時に更新が停止する。"
        isHighlight: true
        accentColor: RED
      - icon: alertTriangle
        title: "脆弱性の放置"
        subtitle: "対応の遅れ"
        description: "面倒さが勝ち、深刻なセキュリティリスクが放置される。"
  - type: transition
  - type: core_message
    variant: highlight
    icon: shieldCheck
    title: "「待つ」ことで守る安全性"
    mainMessage: "最新版を即座に適用するのではなく、クールダウン期間を設けることでサプライチェーン攻撃のリスクを回避します。"
    comparisons:
      - icon: zap
        title: "即時更新"
        text: "最新だがマルウェア混入のリスクがある。"
        isGood: false
      - icon: shieldCheck
        title: "3日間の待機"
        text: "コミュニティの検証を経た安全な状態。"
        isGood: true
    coreHighlight:
      title: "Minimum Release Age"
      text: "公開から数日経過したバージョンのみを自動更新対象とする設定。"
      accentColor: GOLD
  - type: grouped_content
    title: "状況に応じた2つの更新戦略"
    introText: "日常的な運用と緊急時の対応を明確に分けることで、判断コストを最小限に抑えます。"
    icon: gitMerge
    sectionBgColor: muted
    groups:
      - title: "日常的な更新"
        description: "機械的に処理し、人間の判断を不要にする。"
        bgColor: white
        cards:
          - title: "Patch/Minor"
            text: "自動マージで即座に対応。"
            isHighlight: true
            accentColor: GOLD
          - title: "Major"
            text: "破壊的変更があるため手動判断。"
      - title: "緊急時の更新"
        description: "重大な脆弱性対応など、スピードが求められる場合。"
        bgColor: white
        cards:
          - title: "手動トリガー"
            text: "CI上のボタン一つで開始。"
          - title: "ローカル作業なし"
            text: "ブラウザだけで完結させる。"
  - type: transition
  - type: flow_chart
    title: "緊急対応もCI上で完結"
    introText: "ローカル環境に依存せず、GitHub Actions上で安全かつ迅速に対応を完了させます。"
    flows:
      - label: "脆弱性検知"
        subLabel: "アラート受信"
      - label: "CI実行"
        subLabel: "手動トリガー"
        highlight: true
        accentColor: RED
      - label: "PR作成"
        subLabel: "自動生成"
      - label: "テスト/マージ"
        subLabel: "自動処理"
  - type: action
    title: "自動化への第一歩"
    mainText: "まずは個人のプロジェクトから小さく始めて、チーム全体の安全性を高めていきましょう。"
    actionStepsTitle: "導入ステップ"
    actionSteps:
      - title: "Dependabotから"
        description: "まずは自動更新の感覚を掴むことから始める。"
      - title: "Renovateへ移行"
        description: "運用に合わせて詳細な設定を調整する。"
    pointText: "セキュリティは、常日頃から予防され続けている状態こそが、最大の対策となります。"
    footerText: "持続可能な開発環境を作ろう"
    subFooterText: "sui Tech Blog"
    accentColor: GOLD
---
あなたのプロジェクトで、最後に依存関係を更新したのはいつですか?

今年は React Server Components の深刻な脆弱性が発見されました。個人のプロジェクト、過去に公開したままの検証用 Web アプリケーション、現在稼働中のサービス。すべてで手動更新が必要となり、正直「面倒くさい」という気持ちが勝ってしまいました。

なので誰も不幸にならないサイトはそのままデプロイを落としています。それくらい面倒くさかったです。

https://www.ipa.go.jp/security/security-alert/2025/alert20251209.html

セキュリティ対策として必要だと分かっていても、依存関係の手動更新を続けることは不可能です。個人ならまだしも、チーム開発では「担当者がいなくなった瞬間に更新が止まる」という組織のリスクにもなります。

この経験から、私は「問題が起きてから慌ている」のではなく、**日常的に更新され続けるしくみを前提にしなければならない**と確信しました。この記事では、Renovate を使った依存関係の自動更新と、その運用方針について記載していきます。

## なぜ手動更新は破綻するのか

個人の場合、過去に公開したWebサイトやアプリケーションにほとんどユーザーがいないのであれば、いっそのこと壊してしまえばよいでしょう。仮にユーザーがいたとしても、それらすべてを手動で対応するのは大きなストレスになります。たとえ 1 つの作業が 5 分程度で終わるものだとしても、強制されること自体が苦痛だからです。

実際、私は過去に公開したサイトで、ユーザーがいた可能性はありますが「なくても困らないだろう」と判断し、Vercel や Cloudflare のデプロイを停止して公開をやめてしまったものもあります。
今回のような社会問題レベルの脆弱性は二度と起きてほしくありませんが、個人ならまだしも、多くの利用者がいる企業のサービスでこうした事態が起きれば、多大な損害を与える可能性があります。実際に 2025 年 12 月 13 日時点で、IPA によれば国内でも被害事例が確認されています。

組織でのチーム開発に目を向けてみると、リポジトリ(プロジェクトのコード保管場所)が少ない場合でも、担当者がその都度依存関係を更新しなければならないリスクをはらんでいます。
開発が活発なシステムなら良いですが、**運用が安定して放置されている**ものや、**依存関係が長年更新されていないシステム**も多々あります。そうした状況では、**一人の担当者が複数のリポジトリを管理する**ことも珍しくありません。

今回は React が対象でしたが、もしこれがもっと基盤となる npm ライブラリで脆弱性が起きたらどうでしょうか。すべてのリポジトリが対象となり、担当者はその対応だけに数日を費やすことになります。セキュリティの知識がある担当者ならまだしも、手順書に従って操作するだけのオペレーターが運用している時は注意が必要です。またベテランが去って新人が引き継いだばかりのケースでは、自動化されていないことが深刻な**属人化**を招く原因となります。

個人の話に戻ると、私は以前 Dependabot を利用して自動で依存関係を更新していた時期がありました。その際、実際に中程度の脆弱性が発見されて PR(Pull Request、コード変更の提案)が発行されましたが、特に差し迫ったリスクを感じなかったために、そのまま放置してしまった経験があります。

TypeScript のエコシステムは更新スピードが非常に早く、脆弱性の発見や悪意のあるパッケージの混入も起きやすいという側面があります。これは OSS の開発が活発で成長している証拠でもありますが、同時にリスクでもあります。私がこの業界に入った 2022 年から現在までの間にも、セキュリティに関する更新は何度もありました。特に 2025 年は生成 AI が進化し、それを利用して悪意のあるコードが生成されるような事例が散見されるようになりました。

少し話は逸れますが、人間が習慣を定着させるための法則の 1 つに「実行までのハードルを下げる」というものがあります。たとえば「毎朝走る」という習慣を作りたい場合、起きてから着替えて靴を履くという一見当たり前のタスクも、初心者には高いハードルになります。そのため、**寝る前にあらかじめウェアを着て寝る**といった工夫が有効です。
依存関係の更新もこれに似ています。「やらなくてもよいが、やったほうがよい」という絶妙なラインにある作業は、たとえコマンド 1 つたたくだけであっても、強制されると苦痛に感じます。こうした「やらなければならない」という思いが脳のメモリを消費し、知らず知らずのうちに認知負荷を高めているのです。

書籍「システム運用アンチパターン」の 7 章では、自動化が重要になる 4 つの領域として「待ち時間」「実行時間」「実行頻度」「実行のばらつき」が挙げられています。依存関係の手動更新は、まさにこの 4 つすべてに該当します。
誰かに依頼して完了を待つ時間、毎回発生する作業時間、週次や月次で繰り返される頻度、そして人によって微妙に異なる手順。これらを自動化することで、認知負荷だけでなく、実際の作業負荷も削減できます。

## Renovate による自動化の基本方針

ここでの基本方針は、極力人は判断のみに集中し、作業は機械に任せるということです。たとえば、どのようなことでしょうか。過去のセキュリティインシデントや npm でのマルウェア発生などを例に考えてみましょう。

日常的な更新と緊急時の更新を分けて考えます。

日常的な更新では以下のルールで運用します。
- 一定のタイミングで自動更新
- テスト通過後に自動マージ
- 人間の介入は不要

緊急時の更新では以下のルールで運用します。
- 専用の CI(自動テストや自動ビルドを行うしくみ)ジョブを手動実行
- CI 経由で PR を作成
- テスト通過後に自動マージ

手動で更新する際も、開発者がローカル環境にリポジトリをクローンして作業するのではなく、CI 上のジョブを実行するだけで PR が生成される状態が理想です。

また、運用方針として、破壊的変更が含まれるメジャーバージョンはシステムを安定稼働させるために、自動更新の対象外とします。逆にパッチバージョンやマイナーバージョンは積極的に更新していきます。これは人間の介入を必要最小限に抑えつつ、システムを安全に動かし続けるための重要な施策です。

この運用のポイントは、**判断が必要なものを最初から対象外に設定してしまえば、残りは機械的に更新できる**という点です。「自動化に懸念がある」と感じるのは、すべてを機械に任せようとするからです。判断と作業を分離すれば、安全に自動化できます。

## なぜ最新バージョンをすぐに入れないのか？

パッケージを最新に保つ理由は 2 つあります。

1 つ目は、セキュリティ的な観点で重大な脆弱性が発見された際に、修正パッチが適用されたバージョンへ即座に移行しやすくするためです。たとえば毎日自動更新すれば、今回の React のようなパッチバージョンが即座に公開されたケースでも、自動でマージできるため、人間の対応コストを最小限に抑えられます。

2 つ目は、当然ながらパフォーマンスの向上や新機能を利用できる点です。パッチバージョンは軽微なバグ修正が中心ですが、マイナーバージョンでは新機能が追加されることもあるため、常に互換性を維持しながら最新のライブラリを活用し続けることができます。

これらのメリットは、セキュリティ面だけでなく、最新の開発環境の維持や、実際にバグが起こった際の調査においても重要な要素です。
しかし、今回の Renovate 設定では、最新バージョンをすぐさま取り込むようなことはしません。というのも、公開直後のタイミングに特有のリスクが存在するからです。それが、2025 年に多発した **サプライチェイン攻撃(正規のソフトウェアに悪意のあるコードを混入させる攻撃)** のリスクです。

https://github.com/nrwl/nx/security/advisories/GHSA-cxm3-wv7p-598c

詳細は省きますが、ざっくり説明すると、Nx というライブラリに不正なマルウェアが仕込まれるという事案がありました。これには postinstall スクリプトが含まれており、インストールと同時に秘密情報を収集するしくみになっていて、900 人以上が被害を受けました。

悪意のあるコードが仕込まれた新バージョンが公開されることがあります。タイミング悪くパッケージ更新のチェックと重なると、その不正なパッケージがマージされ、そのままインストールしてしまう危険性があります。

そこで Renovate では、**クールダウン期間(minimum release age)** というしくみを使います。これは、パッケージが公開されてから一定期間が経過するまで、自動更新の対象にしないという設定です。

たとえば、クールダウン期間を 3 日に設定した場合、新しいバージョンが公開されても、3 日間は自動更新されません。この間に、コミュニティが問題を発見し、パッケージが取り下げられたり、修正版が公開されたりします。先ほどの Nx の事例でも、不正なパッケージは数時間で発見され、取り下げられました。

つまり、最新であることよりも、検証済みであることの方が安全なのです。毎日自動更新することは、最新の脆弱性対策を受けられる一方で、最新のマルウェアも受け入れてしまうリスクがあります。2〜3 日遅らせることで、コミュニティという検証を経たバージョンのみを取り込めます。

## 緊急時はどうするのか？

ここで 1 つ懸念点があります。それは、クールダウン設定を入れることで重大な脆弱性への対応が遅れてしまうのではないか、という点です。これについてはたしかにそのとおりなのですが、重要なのは**緊急時と通常時の運用を明確に切り分ける**ことです。

その一環として、何をもって「緊急」とするのかを組織やチームであらかじめ定義しておくことが最も重要です。たとえば、社内で使用しているメインライブラリ、今回で言えば React で脆弱性が発見された時は、早急に対応すべきです。
プロダクトへの影響が致命的であり、放置するほどビジネス上のリスクが増大するからです。その他にも、公式が「今すぐ対応せよ」と強い指示を出している場合や、マルウェアの混入など明らかに悪意のある事象が発生している場合に限り「緊急」と定義しておくことが重要になります。
判断に迷うような場合でも、結局はパッケージのバージョンを上げてマージするだけですので、リスクはほとんどありません。「悩んだら回す」くらいの運用が、一番精神的な負荷がかからないます。

そしてここで重要なのが、極力**ローカル環境でバージョンアップせず、CI 上のジョブ実行ボタンを押すだけで完結させること**です。これにより、予期せぬ操作ミスなどを防ぐことができます。誰かがその場限りの独自設定で対応してしまうと、その人がいなくなった後の引き継ぎやメンテナンスが困難になります。そのため、緊急時であっても既存の運用フローを崩さないことが重要です。

これは「システム運用アンチパターン」10 章で紹介されている「情報のため込み」という問題への対策でもあります。特定の人だけが知っている作業手順は、その人がいなくなった瞬間に組織の脆弱性になります。CI 上のジョブとして自動化しておけば、誰でも同じ手順で実行でき、属人化を防げます。

少し話はそれますが、組織内でメンバーが活発に情報共有することも望ましい形です。今回の React の脆弱性が発見された際も、一部のメンバーが組織の全員に向けてメンションを送り全体周知したことで、CTO や部長クラスのメンバーにも迅速に情報が伝わりました。これが社内全体のセキュリティリスクを再考する良いきっかけにもなりました。

## 最低限の設定例

ここまで運用哲学について触れてきましたが、実際にどう設定するのかという疑問があるでしょう。最低限必要な設定を、簡単に紹介します。

### Renovate の基本設定

週1回の定期実行で、3日以上経過したパッケージだけを更新する設定です。

```json .github/renovate.json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "dependencyDashboard": true,
  "dependencyDashboardApproval": false,
  "packageRules": [
    {
      "description": "週1回すべてのPatch/Minor/Pin/Digestを1つのPRにまとめる",
      "groupName": "all non-major dependencies",
      "matchUpdateTypes": ["patch", "minor", "pin", "digest"],
      "schedule": ["before 5am on monday"],
      "automerge": true,
      "labels": ["automerge", "dependencies"]
    },
    {
      "description": "Major は自動マージしない",
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "labels": ["dependencies"]
    }
  ],
  "vulnerabilityAlerts": {
    "enabled": true,
    "automerge": true,
    "minimumReleaseAge": "0 days",
    "labels": ["automerge", "security"]
  }
}
```

パッケージの更新は週1回、月曜に実行します。木曜以前のパッケージなら3日経過済みですので、実質的にクールダウン期間を確保できます。金・土・日リリースは次週まで待ちます。ここで注意するところは `minimumReleaseAge: "3 days"` をグローバルにグループ化すると、新パッケージが追加されるたびに待機期間がリセットされるからです。

月曜に lucide-react、水曜に @biomejs/biome が更新された場合、lucide-react も巻き込まれて再度待機することになります。毎日更新があると、3日待機が完了しません。

### 自動マージの設定

Renovate が作成した PR を自動的にマージするには、GitHub Actions でワークフローを用意します。ここでは、Renovate または後述する緊急更新ワークフロー(GitHub App を使用)が作成した PR を、CI 通過後に自動マージする設定を紹介します。

```yml .github/workflows/renovate-auto-merge.yml
name: Auto Merge

permissions: {}

on:
  pull_request:
    types: [opened, labeled, synchronize, reopened]

jobs:
  auto-merge:
    if: |
      contains(github.event.pull_request.labels.*.name, 'automerge') &&
      (github.event.pull_request.user.login == 'renovate[bot]' || github.event.pull_request.user.login == 'your-github-app-automation[bot]')
    timeout-minutes: 30
    permissions:
      contents: write
      pull-requests: write
    runs-on: ubuntu-latest
    steps:
      - name: Generate GitHub App Token
        id: generate-token
        uses: actions/create-github-app-token@29824e69f54612133e76f7eaac726eef6c875baf # v2.2.1
        with:
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.APP_PRIVATE_KEY }}
          repositories: ${{ github.event.repository.name }}
          permission-contents: write
          permission-pull-requests: write

      - name: Enable Auto Merge (will wait for required checks)
        env:
          GH_TOKEN: ${{ steps.generate-token.outputs.token }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
        run: gh pr merge --repo "$GITHUB_REPOSITORY" --merge --auto --delete-branch "$PR_NUMBER"
```

この設定により、Renovate や緊急時のバージョン更新フローで作成した PR は、テストやビルドが成功した後に自動的にマージされます。人間が介入する必要はありません。

### 緊急時のバージョン更新ワークフロー

通常の自動更新とは別に、重大な脆弱性が発見された際など、緊急でバージョンを上げる必要がある場合のワークフローです。これは手動で実行でき、ローカル環境での作業を必要としません。
依存関係の更新が発生していない時は失敗するようにして、誤って手動で実行されることを防ぎます。

```yml .github/workflows/emergency-dependency-update.yml
name: Emergency Dependency Update

permissions: {}

on:
  workflow_dispatch:
    inputs:
      package_name:
        description: "特定のパッケージ名(空欄で全て更新)"
        required: false
        type: string

jobs:
  update:
    timeout-minutes: 15
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@8e8c483db84b4bee98b60c0593521ed34d9990e8 # v6.0.1
        with:
          persist-credentials: false

      - uses: ./.github/actions/setup

      - name: Generate GitHub App Token
        id: generate-token
        uses: actions/create-github-app-token@29824e69f54612133e76f7eaac726eef6c875baf # v2.2.1
        with:
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.APP_PRIVATE_KEY }}
          repositories: ${{ github.event.repository.name }}
          permission-contents: write
          permission-pull-requests: write

      - name: Update dependencies
        env:
          PACKAGE_NAME: ${{ inputs.package_name }}
        run: |
          if [ -n "$PACKAGE_NAME" ]; then
            echo "Updating package: $PACKAGE_NAME"
            bun update "$PACKAGE_NAME"
          else
            echo "Updating all packages"
            bun update
          fi

      - name: Create Pull Request
        id: cpr
        uses: peter-evans/create-pull-request@98357b18bf14b5342f975ff684046ec3b2a07725 # v8.0.0
        with:
          token: ${{ steps.generate-token.outputs.token }}
          committer: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
          author: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
          commit-message: "chore(deps): emergency update ${{ inputs.package_name || 'all packages' }}"
          branch: emergency-deps-update-${{ github.run_number }}
          delete-branch: true
          title: "🚨 Emergency: Dependency Update"
          body: |
            ## 緊急依存関係更新

            **パッケージ**: ${{ inputs.package_name || '全パッケージ' }}
            **実行者**: @${{ github.actor }}

            このPRは手動実行された緊急アップデートです。
            CI完了後に自動マージされます。

            ### チェックリスト
            - [ ] 変更内容を確認
            - [ ] CIが通過することを確認
          labels: automerge,dependencies,emergency

      - name: Check for changes
        if: steps.cpr.outputs.pull-request-operation == 'none'
        run: |
          echo "::error::No dependency updates available. All packages are already up to date."
          exit 1

      - name: PR created successfully
        if: steps.cpr.outputs.pull-request-operation == 'created'
        env:
          PR_URL: ${{ steps.cpr.outputs.pull-request-url }}
        run: |
          echo "Pull request created: $PR_URL"
```

このワークフローは、GitHub の Actions タブから「Run workflow」ボタンをクリックするだけで実行できます。緊急時であっても、誰かがローカルで作業する必要はなく、CI 上で完結するため、属人化を防げます。

### GitHub App の設定

依存関係の緊急更新ワークフローで GitHub App を使用する理由は、GitHub Actions の制約を回避するためです。
`GITHUB_TOKEN` で作成された PR は、再帰的なワークフロー実行を防ぐために後続のワークフローをトリガしません。そのため、緊急更新で PR を作成しても、自動マージワークフローが起動せず、手動でマージする必要が出てしまいます。

https://budiirawan.com/create-pull-request-github-action-wont-trigger-workflows/

GitHub App トークンを使用すれば、この制約を回避でき、緊急更新で作成された PR も自動マージの対象になります。企業での運用を想定する場合、この設定は必須です。

設定手順は以下の通りです。

1. GitHub Settings → Developer settings → GitHub Apps で新規作成
2. 権限を設定(Contents: Read and write、Pull requests: Read and write)
3. Private Key を生成し、App ID とともに Repository secrets に登録(`APP_ID`、`APP_PRIVATE_KEY`)

この設定により、緊急更新ワークフローが作成した PR も、Renovate と同様に自動マージされます。実際に企業で導入する場合、`APP_ID`、`APP_PRIVATE_KEY` などの環境変数は Organization secrets に登録することを推奨します。

> [!WARNING]
> 現在記載している内容では、GitHub App トークンによる自動マージ後に `main` ブランチ(=本番デプロイ)まで自動実行されます。
> 実際の業務システムでは予期せぬ不具合を防ぐため、**ステージング環境での動作確認**など、段階的なデプロイフローを組み込むことを強く推奨します。

## おわりに

すべての問題を解決する万能な方法は存在しません。ここで挙げている例も、あくまで 1 つの組織に当てはめた場合の例ですので、実際に運用する現場によっては大きく異なることも考えられます。

想定外の新たな課題が出てくるでしょうが、それでもしくみ化をする理由があります。セキュリティインシデントのように問題が起きてから慌ているのではなく、**日常的に更新され続けることを前提にする**ことで、実際に問題が起きた際の対応コストが下がり、持続可能な開発が実現します。
セキュリティは、常日ころから予防され続けている状態こそが、最大の対策となるのです。

今回のような設定が難しいと感じる時は、まずは自分のプロジェクトの小さなシステムからでも良いので、Dependabot などを導入してみてください。
そして Dependabot を使ってみて、うまくいかなかった点や困ったことを実践を通じて理解した後に、Renovate を導入してみてください。
やはり自分自身で経験した難しさや課題には説得力があります。まずは個人プロジェクトから始めて、うまくいったらチームに提案するような形で、その都度向き合っていきましょう。

## 参考

- [GitHub Advisory: Malicious versions of Nx](https://github.com/nrwl/nx/security/advisories/GHSA-cxm3-wv7p-598c)
- [GitHub Triggering a workflow](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow#triggering-a-workflow-from-a-workflow)
- [サプライチェーン攻撃への防御策](https://blog.jxck.io/entries/2025-09-20/mitigate-risk-of-oss-dependencies.html)
- [renovate-config](https://github.com/koki-develop/renovate-config)
- [システム運用アンチパターン ― エンジニアがDevOpsで解決する組織・自動化・コミュニケーション](https://www.oreilly.co.jp//books/9784873119847/)
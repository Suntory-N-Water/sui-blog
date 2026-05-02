---
title: GitHub Actions で APT 依存をキャッシュしてワークフローを高速化する
slug: github-actions-agent-browser-cache-strategy
date: 2026-05-02
modified_time: 2026-05-02
description: GitHub Actions で agent-browser を使う際の APT 依存インストールを 4 つのキャッシュ戦略で検証しました。.deb ファイルをキャッシュして dpkg で直接インストールする方式でキャッシュヒット時の apt-get update をスキップでき、ワークフローの実行時間を 36〜45 秒から 16〜19 秒へ 50〜60% 削減できました。本記事では既存ライブラリの Node.js 廃止リスクも含めた各アプローチの比較と、自前実装の composite action を紹介します。
icon: 🪨
icon_url: /icons/rock_flat.svg
tags:
  - GitHubActions
selfAssessment:
  quizzes:
    - question: "agent-browser を ubuntu-latest 環境で実行する際、実際に不足しており `apt-get` で新規インストールが必要だったパッケージは何でしたか？"
      answers:
        - text: "2つのフォントパッケージ(fonts-freefont-ttf, fonts-noto-cjk)"
          correct: true
          explanation: "Ubuntu 24.04 には Chromium の依存パッケージの大部分がすでに含まれており、不足していたのはこの2つのフォントパッケージのみでした。"
        - text: "agent-browser が要求する35個の依存ライブラリすべて"
          correct: false
          explanation: "35パッケージが指定されますが、そのうち33パッケージはすでにOSに含まれていました。"
        - text: "Chrome ブラウザ本体のバイナリ"
          correct: false
          explanation: "Chrome のバイナリは別でダウンロード・キャッシュされるものであり、APT パッケージの話ではありません。"
        - text: "Node.js の最新バージョン"
          correct: false
          explanation: null
    - question: "この記事において、CI の実行時間を最も効果的に短縮(50〜60%削減)した最終的なキャッシュ戦略はどれですか？"
      answers:
        - text: ".deb ファイルをキャッシュし、ヒット時は `apt-get update` をスキップして `dpkg` で直接インストールする"
          correct: true
          explanation: "この方法により、時間のかかるパッケージのダウンロードと `apt-get update` をスキップでき、CI実行時間を大幅に短縮できました。"
        - text: "Chrome バイナリをキャッシュし、APT パッケージのインストールはそのまま実行する"
          correct: false
          explanation: "Chrome のダウンロードはスキップできても、APT のインストールに毎回30秒以上かかるため、ほとんど時間短縮になりませんでした。"
        - text: "不要なパッケージを除外し、不足している2パッケージのみを毎回 `apt-get install` で指定する"
          correct: false
          explanation: "対象は減りますが、`apt-get update` とパッケージのダウンロードが毎回発生するため、期待したほどの効果は得られませんでした。"
        - text: "GitHub Team プランを契約し、カスタムランナーイメージを利用する"
          correct: false
          explanation: "カスタムランナーイメージは有効な手段ですが、個人リポジトリでは現実的な選択肢ではないとして今回の対象外とされています。"
diagram:
  - type: hero
    date: "2026-05-02"
    title: "GitHub Actions で APT 依存をキャッシュして CI を高速化する"
    subtitle: "agent-browser の CI 実行時間を半減させる4つのキャッシュ戦略と比較検証"
  - type: transition
  - type: problem
    variant: simple
    icon: alertCircle
    title: "agent-browser導入でCI時間が膨らむ"
    introText: "クリーンなランナー環境は再現性を保証しますがブラウザ操作ライブラリの導入で新たな問題が発生します"
    cards:
      - icon: clock
        title: "CI実行時間の増加"
        subtitle: "毎回ゼロからインストール"
        description: "ワークフロー実行ごとにインストールが毎回実行され時間がかかる"
      - icon: box
        title: "システム依存の壁"
        subtitle: "APTパッケージの壁"
        description: "ChromeだけでなくUbuntuのシステム依存も必要になる"
        isHighlight: true
        accentColor: RED
      - icon: arrowDown
        title: "見えないボトルネック"
        subtitle: "実はフォントが重い"
        description: "不要なパッケージまで確認とダウンロードをしてしまっている"
  - type: metrics_impact
    title: "ベースライン計測で見えた課題"
    introText: "キャッシュなしのCIで実行時間を計測すると想定外の箇所が時間を占めていました"
    layout: horizontal
    icon: trendingUp
    metrics:
      - value: "43"
        unit: "秒"
        label: "合計実行時間"
        description: "キャッシュなしの全体時間"
      - value: "33"
        unit: "秒"
        label: "依存インストール"
        description: "全体の75パーセント以上を占めるボトルネック"
        accentColor: RED
  - type: transition
  - type: numeric_simulation
    title: "各キャッシュ戦略の実行時間比較"
    introText: "ボトルネック解消のため様々なアプローチを検証しました"
    icon: hourglass
    items:
      - label: "ベースライン"
        value: "36〜45秒"
        barPercentage: 100
        description: "キャッシュなしで毎回全実行"
      - label: "最小パッケージ指定"
        value: "24〜30秒"
        barPercentage: 66
        description: "対象は減るがupdateが毎回実行される"
      - label: "既存アクション利用"
        value: "13〜19秒"
        barPercentage: 42
        description: "最速だがNode.js環境の廃止リスクあり"
      - label: "自前実装キャッシュ"
        value: "16〜19秒"
        barPercentage: 42
        description: "廃止リスクはないが現時点の選択肢の一つ"
        accentColor: GOLD
  - type: transition
  - type: two_column_contrast
    title: "実装手法はプロジェクトの運用に合わせて選択"
    introText: "どちらの実装を選んでもAPTパッケージキャッシュにより大幅なCI時間削減が可能です"
    icon: scale
    left:
      icon: box
      title: "既存ライブラリを利用"
      text: "導入は簡単だが将来的なNode.js廃止リスクが懸念される"
    right:
      icon: settings
      title: "自前でキャッシュ実装"
      text: "廃止リスクはないが運用に合わせた自己管理が求められる"
      accentColor: GOLD
    summaryText: "重要なのは「APTキャッシュという戦略を選ぶこと」です"
  - type: transition
  - type: action
    title: "CIの待機時間を削減しよう"
    mainText: "APTパッケージをキャッシュして快適な開発環境を手に入れましょう"
    actionStepsTitle: "導入へのステップ"
    actionSteps:
      - title: "ボトルネックの特定"
        description: "ログを確認し実際に不足しているパッケージを見極める"
      - title: "キャッシュ戦略の選択"
        description: "プロジェクトの要件に合ったAPTキャッシュの手法を導入する"
    pointText: "ランナーが毎回クリーンでもシステム依存のキャッシュは諦める必要はありません"
    footerText: "快適なCI環境を構築しよう"
    subFooterText: "sui Tech Blog"
---

GitHub Actions のランナーはジョブ実行のたびにクリーンな状態で起動します。ビルドの再現性を保証するための設計ですが、「毎回クリーン」ということはシステム依存もゼロからそろえ直すことを意味し、ブラウザを含むプロジェクトでは実行時間に直接影響します。

Vercel Labs が開発した [agent-browser](https://github.com/vercel-labs/agent-browser) は AI エージェント向けのブラウザ操作ライブラリです。実際の Chrome を動かすため、Ubuntu ランナーではシステム依存パッケージも合わせてインストールが必要です。GitHub Actions 上で agent-browser を使い始めると、ワークフロー実行ごとにこのインストールが発生し、実行時間が膨らんでいきます。

「ランナーが毎回クリーンなのだからシステム依存のキャッシュは無理」と思い込んでいましたが、調べると APT[^apt] パッケージも `.deb` ファイル単位でキャッシュできます。この記事では、その発見に至るまでの各アプローチを順番に検証し、最終的に CI 実行時間を 50〜60% 削減した構成を紹介します。

## ベースラインを計測する

まずキャッシュなしの CI で実行時間を計測しました。

| 項目 | 内容 |
|---|---|
| ランナー | `ubuntu-latest`(Ubuntu 24.04) |
| agent-browser | `npm install -g agent-browser`(グローバルインストール) |
| Chrome | Chrome for Testing 148.0.7778.97(175MB) |
| 検証サイト | https://claude-code-log.com (筆者開発のサイト) |
| 計測方法 | 各アプローチを複数回(4〜9回)実行して実行時間の最小〜最大を記録 |

```yaml
name: ベースライン計測(キャッシュなし)

permissions: {}

on:
  push:
    branches:
      - main

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  baseline:
    name: キャッシュなし
    timeout-minutes: 15
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false

      - name: agent-browser をインストール
        run: npm install -g agent-browser

      - name: Chrome とシステム依存をインストール
        run: agent-browser install --with-deps

      - name: ブラウザ操作(open → snapshot → close)
        run: |
          agent-browser batch \
            "open https://claude-code-log.com" \
            "snapshot -i" \
            "close"
```

計測結果は合計 43 秒で、 `agent-browser install --with-deps` が 33 秒を占めています。

## ボトルネックを深掘りする

`--with-deps` が内部で実行する `apt-get install` のログを確認してみましょう。

```
0 upgraded, 2 newly installed, 0 to remove and 53 not upgraded.
The following NEW packages will be installed:
  fonts-freefont-ttf fonts-noto-cjk
Need to get 66.9 MB of archives.
```

`--with-deps` は内部で 35 パッケージのリストを `apt-get` に渡しますが、実際に新規インストールされたのは `fonts-freefont-ttf` と `fonts-noto-cjk` の 2 パッケージだけです。残り 33 パッケージは Ubuntu 24.04 にすでに含まれており、66.9MB のフォントデータのダウンロードが大半の時間を占めていました。

ボトルネックが特定できたので、改善アプローチを整理します。

| アプローチ | 概要 | 期待効果 |
|---|---|---|
| Chrome のみキャッシュ | `~/.agent-browser/browsers/` をキャッシュ | Chrome ダウンロード(2.5秒)をスキップ |
| 最小パッケージ手動指定 | 不足する 2 パッケージのみ `apt install` | APT インストール対象を削減 |
| APT パッケージキャッシュ | `.deb` ファイルをキャッシュし `dpkg`[^dpkg] でインストール | `apt-get update` とダウンロードをスキップ |

## 各アプローチを検証する

### Chrome バイナリのみキャッシュ

`~/.agent-browser/browsers/` を `actions/cache` でキャッシュして Chrome の再ダウンロードをスキップする方法です。このアプローチの[検証ワークフロー](https://github.com/Suntory-N-Water/github-actions-agent-browser-cache-strategy/blob/main/.github/workflows/cache-chrome.yml)はこちらです。

キャッシュヒット時のログで `✓ Chrome 148.0.7778.97 is already installed` が確認でき、Chrome のダウンロードはスキップされています。ただしシステム依存の `apt-get` は毎回実行されるため、ほとんど改善しませんでした。

| | ベースライン | キャッシュヒット(4回) |
|---|---|---|
| 合計 | 36〜45秒 | 36〜46秒 |

Chrome のダウンロードの 2.5 秒を節約しても、APT の 30 秒超は毎回実行されます。ボトルネック自体に届いていないため、ほぼ改善しませんでした。

### 最小パッケージの手動指定

`--with-deps` を使わず、実際に不足している 2 パッケージだけを直接指定する方法です。このアプローチの[検証ワークフロー](https://github.com/Suntory-N-Water/github-actions-agent-browser-cache-strategy/blob/main/.github/workflows/cache-min-packages.yml)はこちらです。

| | ベースライン | 実測範囲(5回) |
|---|---|---|
| 合計 | 36〜45秒 | 24〜30秒 |

`apt-get install` の対象が 35 パッケージから 2 パッケージに減って速くなりましたが、`apt-get update` は毎回実行されます。フォント 2 パッケージのダウンロードとインストールで約 20 秒かかるため、Chrome キャッシュの有無に関係なく毎回同じ時間がかかります。

### APT パッケージキャッシュ

`.deb` ファイルそのものをキャッシュし、ヒット時は `apt-get update` なしで `dpkg` から直接インストールする方法です。

既存ライブラリを調べると、最も使われているのが [awalsh128/cache-apt-pkgs-action](https://github.com/awalsh128/cache-apt-pkgs-action)(★346)でした。このアクションを使った[検証ワークフロー](https://github.com/Suntory-N-Water/github-actions-agent-browser-cache-strategy/blob/main/.github/workflows/cache-apt-packages.yml)はこちらです。
動作確認では最速(ヒット時 4 秒)でしたが、内部で `actions/cache@v4`(Node.js 20)を使用しています。そのため、Node.js 20 の廃止予定(2026 年 9 月 16 日)以降に動作しなくなる可能性があり、[Issue #193](https://github.com/awalsh128/cache-apt-pkgs-action/issues/193) や [PR #198](https://github.com/awalsh128/cache-apt-pkgs-action/pull/198) で議論されているものの、メンテナンスの動きが止まっています。

もう 1 つ調べたのが [gerlero/apt-install](https://github.com/gerlero/apt-install) です。このアクションを使った[検証ワークフロー](https://github.com/Suntory-N-Water/github-actions-agent-browser-cache-strategy/blob/main/.github/workflows/cache-apt-gerlero.yml)はこちらです。シェルスクリプトのみで構成された composite action[^composite] で、内部の `actions/cache@v5` は Node.js 24 を使用しているため廃止リスクはありません。ただしキャッシュヒット時も `apt-get update` を実行するため、ヒット時でも 20 秒かかりました。

| 実装 | 実測範囲(4回) | Node.js 問題 |
|---|---|---|
| `cache-apt-pkgs-action` | 13〜19秒 | Node.js 20 廃止予定 |
| gerlero | 24〜36秒 | なし |

## 自前実装で両方の問題を解決する

`gerlero/apt-install` のしくみを参考に、キャッシュヒット時は `apt-get update` をスキップする composite action を自作しました。`actions/cache/restore@v5` と `actions/cache/save@v5`(Node.js 24)のみを使用しており、外部依存はありません。

```yaml .github/actions/apt-cache/action.yml
name: "apt キャッシュインストール"
description: "apt パッケージを actions/cache@v5 でキャッシュしてインストールする(Node.js 不使用)"

inputs:
  packages:
    description: "インストールするパッケージ(スペース区切り)"
    required: true
  cache-version:
    description: "キャッシュキーの手動バスト用バージョン"
    default: "1"

runs:
  using: "composite"
  steps:
    - name: キャッシュを復元
      id: cache
      uses: actions/cache/restore@27d5ce7f107fe9357f9df03efb73ab90386fccae # v5.0.5
      with:
        path: ~/.apt-debs
        key: apt-${{ runner.arch }}-${{ runner.os }}-v${{ inputs.cache-version }}-${{ inputs.packages }}

    - name: パッケージをダウンロード
      if: steps.cache.outputs.cache-hit != 'true'
      shell: bash
      env:
        PACKAGES: ${{ inputs.packages }}
      run: |
        sudo apt-get update -qq
        mkdir -p ~/.apt-debs
        cd ~/.apt-debs
        apt-get download $PACKAGES

    - name: キャッシュを保存
      if: steps.cache.outputs.cache-hit != 'true'
      uses: actions/cache/save@27d5ce7f107fe9357f9df03efb73ab90386fccae # v5.0.5
      with:
        path: ~/.apt-debs
        key: ${{ steps.cache.outputs.cache-primary-key }}

    - name: パッケージをインストール
      shell: bash
      run: sudo dpkg --install --recursive --skip-same-version ~/.apt-debs
```

この composite action を呼び出すワークフローです。

```yaml
name: 計測(apt キャッシュ / 自前実装)

permissions: {}

on:
  push:
    branches:
      - main

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  apt-cache-custom:
    name: apt キャッシュあり(自前実装)
    timeout-minutes: 15
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false

      - name: agent-browser をインストール
        run: npm install -g agent-browser

      - name: agent-browser バージョンを取得
        id: ab-version
        run: echo "version=$(agent-browser --version)" >> "$GITHUB_OUTPUT"

      - name: Chrome バイナリをキャッシュから復元
        id: chrome-cache
        uses: actions/cache@27d5ce7f107fe9357f9df03efb73ab90386fccae # v5.0.5
        with:
          path: ~/.agent-browser/browsers
          key: ${{ runner.os }}-chrome-${{ steps.ab-version.outputs.version }}

      - name: 不足パッケージをキャッシュ付きでインストール
        uses: ./.github/actions/apt-cache
        with:
          packages: fonts-freefont-ttf fonts-noto-cjk

      - name: Chrome をインストール(キャッシュミス時のみ実際にダウンロード)
        if: steps.chrome-cache.outputs.cache-hit != 'true'
        run: agent-browser install

      - name: ブラウザ操作(open → snapshot → close)
        run: |
          agent-browser batch \
            "open https://claude-code-log.com" \
            "snapshot -i" \
            "close"
```

全アプローチの比較です。

| No | アプローチ | キャッシュ状態 | 実測範囲 |
|----|------------|----------------|----------|
| 1 | ベースライン | キャッシュなし(毎回) | 36〜45秒 |
| 2 | Chrome のみ | Chrome ヒット・APT 毎回 | 36〜46秒 |
| 3 | 最小パッケージ | Chrome ヒット・APT 毎回 | 24〜30秒 |
| 4 | `cache-apt-pkgs-action` | Chrome + APT ヒット | 13〜19秒 |
| 5 | gerlero | Chrome + APT ヒット | 24〜36秒 |
| 6 | **自前実装** | **Chrome + APT ヒット** | **16〜19秒** |

自前実装は `cache-apt-pkgs-action` とほぼ同等の速度(16〜19 秒)を保ちながら廃止リスクがなく、現時点では最もバランスが良い構成です。今後 `cache-apt-pkgs-action` が Node.js 24 に対応すれば、シンプルに既存アクションへ切り替えてよいと思います。重要なのは「APT キャッシュという戦略を選ぶこと」であって、実装の選択は Node.js 対応状況という運用上の話にすぎません。

## 注意点

### Ubuntu-latest が更新された場合の影響

今回の「新規インストールが 2 パッケージだけ」という結果は Ubuntu 24.04 時点の依存構成によるものです。Ubuntu-latest が更新されて今まで含まれていたパッケージが削除された場合、Chrome が起動できずブラウザ操作ステップで落ちる可能性はゼロではありません。コアなシステムライブラリが削除されることは考えにくいので、現実的なリスクは低いですが、念頭に置いておくとよいでしょう。

インストール対象パッケージを変更した場合は `inputs.packages` が変わるためキャッシュキーが自動的に変わります。`cache-version` の手動バストが必要になるのは、同じパッケージ構成のままキャッシュを強制リセットしたい場合だけです。

### さらに短縮するには

今回のキャッシュでは `.deb` のダウンロードをスキップできましたが、キャッシュミス時の `apt-get update`(約 10 秒)は毎回発生します。さらなる短縮にはカスタムランナーイメージが有効ですが、GitHub Team / Enterprise プランが必要です。個人リポジトリでは現実的な選択肢ではないため、今回は対象外としました。

## まとめ

- `ubuntu-latest` には Chromium の依存パッケージのほとんどがすでに含まれており、追加インストールが必要なのはフォント 2 パッケージ(`fonts-freefont-ttf` と `fonts-noto-cjk`)だけだった
- 「ランナーがクリーンなのでシステム依存のキャッシュは無理」は思い込みで、`.deb` ファイル単位でキャッシュして `dpkg` で直接インストールする方法が有効
- APT パッケージキャッシュで CI 実行時間を 50〜60% 削減できた(36〜45 秒 → 16〜19 秒)
- 既存の `cache-apt-pkgs-action` は速いが Node.js 20 廃止リスクがあり、現時点では自前実装がリスクと速度のバランスが良い

## 参考

https://github.com/vercel-labs/agent-browser

https://github.com/awalsh128/cache-apt-pkgs-action

https://github.com/awalsh128/cache-apt-pkgs-action/issues/193

https://github.com/gerlero/apt-install

https://github.com/Suntory-N-Water/github-actions-agent-browser-cache-strategy

[^apt]: Advanced Package Tool の略。Ubuntu などの GNU/Linux ディストリビューションで使われるパッケージ管理システムです。
[^dpkg]: `.deb` パッケージファイルを直接インストール・管理するローレベルのツール。`apt-get` の内部でも使われています。
[^composite]: GitHub Actions の composite action は、複数のステップをまとめた再利用可能なアクションを YAML と shell script だけで定義する方式。Node.js 等のランタイムが不要な点が特徴です。

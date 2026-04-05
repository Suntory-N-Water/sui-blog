---
title: agent-browserがRustネイティブになった今、playwright-cliとどちらを選ぶべきか
slug: agent-browser-vs-playwright-cli-revisit
date: 2026-04-05
modified_time: 2026-04-05
description: agent-browserがRustネイティブになった今、playwright-cliと改めて比較しました。-i -cオプションでトークン差が約6%まで縮まり、前回の「40%差」は実質解消。ネットワーク監視・diff機能も含めた現時点の選択基準を整理します。
icon: 🦀
icon_url: /icons/crab_flat.svg
selfAssessment:
  quizzes:
    - question: "agent-browser の `-c` オプションを `-i` と組み合わせた場合、playwright-cli とのトークン消費量の差はどれくらいになりましたか？"
      answers:
        - text: "約 6%"
          correct: true
          explanation: "playwright-cli が 26.3K、agent-browser -i -c が 28.0K で、差は約 6% まで縮まりました。前回の約 40% 差は実質的に解消されています。"
        - text: "約 40%"
          correct: false
          explanation: "約 40% は Rust 化以前の前回計測時の差です。`-c` オプション追加後は大幅に縮まっています。"
        - text: "約 20%"
          correct: false
          explanation: null
        - text: "ほぼ 0%(同一)"
          correct: false
          explanation: null
    - question: "現時点で playwright-cli を選ぶ主な理由として記事が挙げているのはどれですか？"
      answers:
        - text: "Playwright API を直接実行できる `run-code` コマンドが必要な場合"
          correct: true
          explanation: "`run-code` は Playwright SDK のコードをそのまま実行できる playwright-cli 固有の機能です。カスタムイベントリスナのような高レベル API が必要な場合に有効です。"
        - text: "ネットワーク監視でフィルタリングが必要な場合"
          correct: false
          explanation: "ネットワーク監視の `--filter` オプションは agent-browser 側の強みとして挙げられています。"
        - text: "diff 機能でページ比較をしたい場合"
          correct: false
          explanation: "diff 機能(スナップショット・URL 比較)は agent-browser の新機能です。"
        - text: "iOS Simulator でブラウザ操作をしたい場合"
          correct: false
          explanation: "iOS Simulator 対応(`-p ios`)は agent-browser の機能です。"
diagram:
  - type: hero
    date: "2026-04-05"
    title: "agent-browserがRustネイティブになった今、playwright-cliとどちらを選ぶべきか"
    subtitle: "トークン消費量の差が縮小し機能面での優位性が明確になった最新の比較検証"
  - type: transition
  - type: before_after_transform
    title: "Rustネイティブ化による進化"
    introText: "agent-browserの内部構造が刷新され、機能面で大きな飛躍を遂げました"
    icon: sparkles
    items:
      - icon: cpu
        domain: "実行環境"
        before: "Node.jsへの依存"
        after: "Chromeを直接制御"
      - icon: activity
        domain: "通信監視"
        before: "リクエスト取得のみ"
        after: "フィルタ・HAR対応"
      - icon: fileSearch
        domain: "状態比較"
        before: "機能なし"
        after: "詳細なdiff機能追加"
  - type: transition
  - type: highlight_card
    phrase: "最大の論点だったトークン消費差は実質解消"
    subText: "新たに追加されたコンパクトオプションの活用で両者の差は約6%まで縮小しました"
    accentColor: GOLD
  - type: score_comparison
    title: "トークン消費量の最新比較"
    introText: "Yahoo! JAPAN最新ニュース取得時のコンテキストウィンドウ使用量"
    scores:
      - title: "playwright"
        value: 26.3
        unit: "K"
        barPercentage: 78
      - title: "agent(-i)"
        value: 33.5
        unit: "K"
        barPercentage: 100
      - title: "agent(-i -c)"
        value: 28.0
        unit: "K"
        barPercentage: 83
        accentColor: GOLD
        description: "コンパクトオプション適用で大幅に削減"
  - type: transition
  - type: two_column_contrast
    title: "現時点でのツール選択の判断軸"
    introText: "機能と効率のバランスから、それぞれの最適なユースケースが明確になりました"
    icon: scale
    left:
      icon: xCircle
      title: "playwright-cli"
      text: "Playwright APIを直接実行するrun-codeコマンドが必要な局所的なケースに限定されます"
    right:
      icon: checkCircle
      title: "agent-browser"
      text: "ネットワーク監視やdiff機能が充実しており日常的な自動操作における最適解となります"
      accentColor: GOLD
  - type: transition
  - type: action
    title: "最適なツールを選択する"
    mainText: "機能と効率を両立したagent-browserを活用し自動化を次の段階へ進めましょう"
    actionStepsTitle: "推奨される導入手順"
    actionSteps:
      - title: "最新バージョンの導入"
        description: "Rustネイティブ化された最新のagent-browser環境を構築します"
      - title: "最適オプションの適用"
        description: "実行時に-iと-cオプションを指定してトークン消費を最小化します"
    pointText: "特別なAPI操作が不要であればagent-browserが現状の最も有力な選択肢です"
    footerText: "変化の激しいAIツール環境を攻略していこう"
    subFooterText: "sui Tech Blog"
    accentColor: GOLD
tags:
  - Playwright
  - agent-browser
  - AI
---

AIエージェントによるブラウザ自動操作のツール環境は、たった数ヵ月で別物になる速さで動いています。
2026年1月だけをとっても、Vercelのagent-browserとMicrosoftのPlaywright CLIがほぼ同時にリリースされました。このスピード感は、ツールを選んだ翌月には前提が変わっている、という状況を生み出しています。

私は以前、[playwright-cli と agent-browser のトークン消費量を比較する記事](https://suntory-n-water.com/blog/playwright-cli-vs-agent-browser-token-comparison/)を書きました。検証では、playwright-cliが約40%トークンを節約できるとわかりました。それでもUXと速度の観点からagent-browserを選びました。

その後、agent-browserはPlaywrightのNode.jsラッパをCLIから呼び出す構造だったものが、Rustネイティブに変更されました。
この記事では最新の機能をもとに、agent-browserとplaywright-cliのどちらを選ぶべきか、現時点の比較と判断軸を整理します。

> [!NOTE]
> 本検証の各ツールバージョンは以下の通りです。
> - agent-browser = 0.21.4
> - playwright-cli = 0.1.5

## Rust化で何が変わったのか

Rust化以前のagent-browserは、内部でPlaywrightを呼び出しており、Node.jsランタイムへの依存がありました。Rustネイティブになったことで、Playwrightへの依存はなくなり、Chrome(Chromium)を直接制御する構造になっています。

実際に触ってみた印象では、日常的な操作(`open`、`snapshot`、`click`、`eval`)の使用感はほぼ変わりません。コマンドの体系も前回と大きくは変わっておらず、違和感なく使えています。

変化を感じるのは新機能の追加です。ヘルプコマンドで確認できたものをピックアップします。

### ネットワーク監視の強化

```bash
agent-browser network requests [--clear] [--filter <pattern>]
agent-browser network har start [path]
agent-browser network har stop
```

`network requests` にフィルタリングオプションが付いています。ページが読み込む大量のリクエストから画像やフォントを除いてAPI通信だけを絞り込めるのは便利です。HAR[^har]ファイルへの書き出しもできるようになりました。

### diff機能の追加

```bash
agent-browser diff snapshot            # 現在と前回のスナップショットを比較
agent-browser diff url <url1> <url2>   # 2ページの比較
```

Webサイトのチェックという文脈で、これはかなり便利です。デプロイ前後のスナップショット差分を確認したり、2つのページを見比べたりする用途に使えます。実際に `diff url` を試してみると、差分の出力が読みやすく、すぐに使いどころが思い浮かびました。

### Chromiumカスタム設定

Rust化後も `--executable-path`、`--args`、`--cdp`[^cdp] のオプションは引き続き対応しています。

```bash
--executable-path <path>   # カスタムChrome/Chromiumバイナリの指定
--args <args>              # ブラウザ起動引数の指定(カンマ区切り)
--cdp <port>               # CDP経由での接続
```

環境変数でも同様の設定ができます(`AGENT_BROWSER_EXECUTABLE_PATH`、`AGENT_BROWSER_ARGS`)。Playwrightの依存がなくなったからといって自由度が下がったわけではなく、むしろCLIフラグとして整理されている印象です。少なくとも確認できる範囲では、Rust化による機能の後退は見当たりませんでした。

## トークン消費量の比較

変更点の把握ができたところで、前回の比較で最大の論点だったトークン消費量をあらためて計測します。[前記事](https://suntory-n-water.com/blog/playwright-cli-vs-agent-browser-token-comparison)と同条件(Yahoo! JAPAN最新ニュース1件取得)で計測しました。agent-browserは前回と同じ `-i`(interactive)オプションに加えて、Rust化後に追加された `-c`(compact)オプションを組み合わせたパターンも計測しています。

| ツール | 前回 | 今回 | 差分 |
|---|---|---|---|
| playwright-cli | 24.7K / 15% | 26.3K / 16% | +1.6K |
| agent-browser -i | 34.4K / 21% | 33.5K / 21% | -0.9K |
| **agent-browser -i -c** | — | **28.0K / 18%** | — |

パーセンテージはコンテキストウィンドウ使用率です。

Rust化自体はトークン消費量にほぼ影響していません(34.4K→33.5K)。ただし `-c` オプションを加えると28.0Kまで下がり、playwright-cliとの差が前回の約39%から約6%まで縮まりました。playwright-cli自体が1.6K増えているのはYahoo! JAPANのページ構成の変化によるもので、ツールの変化ではありません。

処理速度はagent-browserのほうがコマンドのレスポンスが速く、全体の完了も早い印象でした。

<details>
<summary>agent-browser(-i)実行ログ</summary>

> [!NOTE]
> ここにagent-browser(-i)の実行ログを記載する

</details>

<details>
<summary>agent-browser(-i -c)実行ログ</summary>

> [!NOTE]
> ここにagent-browser(-i -c)の実行ログを記載する

</details>

<details>
<summary>playwright-cli 実行ログ</summary>

> [!NOTE]
> ここにplaywright-cliの実行ログを記載する

</details>

## 機能比較

| 観点 | playwright-cli | agent-browser |
|---|---|---|
| トークン消費量 | ○ 26.3K | ○ 28.0K(`-i -c`) / △ 33.5K(`-i`) |
| 使用感・UX | △ | ◎ Rust化後も良好 |
| ネットワーク監視 | △ フィルタなし | ◎ `--filter` 付き + HAR対応 |
| Chromium自由度 | ○ Playwright資産 | ○ `--executable-path` / `--args` 対応 |
| Playwright APIコード実行 | ◎ `run-code` コマンドあり | なし |
| ブラウザコンテキストでのJS実行 | ◎ `eval` | ◎ `eval` |
| diff・ビジュアル比較 | なし | ◎ スナップショット・スクリーンショット・URL比較 |
| iOS Simulator対応 | なし | ◎ `-p ios` で対応 |

両ツールとも `eval` コマンドでブラウザのページコンテキストでJavaScriptを実行できます。playwright-cliの `run-code` はこれとは別物で、Playwright SDK自体のコード(`page.on('request', ...)` のようなPlaywrightのAPIを呼び出すNode.jsコード)をそのまま実行できます。
agent-browserの `eval` はブラウザ側での実行に限られるので、Playwrightの高レベルなAPIを使いたい場合は、playwright-cliの `run-code` が必要になります。ただし、カスタムイベントリスナを仕込むようなケースは限定的で、スクレイピングや画面操作の大半では `eval` の範囲で完結します。

ネットワーク監視については、playwright-cliの `network` コマンドはページ読み込み後のリクエスト一覧を取得するだけで、フィルタリングのオプションはありません。`run-code` を経由してPlaywrightのネットワーク傍受APIを書けば同等のことはできますが、agent-browserのように1コマンドで完結しません。

前回はUXと速度が主な根拠でしたが、今回はトークン消費量の差も実質的になくなり、ネットワーク監視とdiff機能でも差がつきました。playwright-cliを選ぶ理由は `run-code` によるPlaywright API直接実行が必要な場合に絞られた、というのが現時点の結論です。

## まとめ

- `-c` オプションにより agent-browser のトークン消費は 28.0K まで削減でき、playwright-cli(26.3K)との差は約 6% に縮まった。前回「約 40% 差」だった差は実質的に解消された
- ネットワーク監視(`--filter` + HAR)と diff 機能が強化されており、トークン差だけでなく機能面でも agent-browser が優位になった
- playwright-cli を選ぶ理由は `run-code` による Playwright API 直接実行が必要な場合に絞られた
- Chromium のカスタム設定は `--executable-path` と `--args` で引き続き対応できるため、互換性面での不安はない

## 参考

https://github.com/vercel-labs/agent-browser

https://github.com/microsoft/playwright-cli

[^har]: HTTP Archive の略。ブラウザがやりとりしたHTTPリクエスト/レスポンスを記録したJSONファイル。デバッグやパフォーマンス分析に使われる。
[^cdp]: Chrome DevTools Protocol の略。Chromeの開発者ツールが使う通信プロトコルで、外部ツールからブラウザを制御するために使用される。

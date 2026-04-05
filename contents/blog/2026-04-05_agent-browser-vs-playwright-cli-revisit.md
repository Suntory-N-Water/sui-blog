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

```bash
⏺ agent-browserを使って、指定の手順でYahoo! JAPANのニュース記事を取得します。

⏺ Bash(agent-browser open https://www.yahoo.co.jp/)
  ⎿  ✓ Yahoo! JAPAN
       https://www.yahoo.co.jp/

⏺ Bash(agent-browser snapshot -i)
  ⎿  - link "今すぐ設定する" [ref=e5]
     - link "閉じる" [ref=e15]
     - link "AIアシスタント 使ってないサブスク、毎月いくらムダか見てみて" [ref=e1]
     … +111 lines (ctrl+o to expand)

⏺ スナップショット取得完了。Yahoo!ニュースの最初の記事（主要ニュース）は e260 の「母国で迫害 日本国籍望む訴訟現場」です。クリックします。

⏺ Bash(agent-browser click @e260)
  ⎿  ✓ Done

⏺ Bash(agent-browser snapshot -i)
  ⎿  - heading "Yahoo!ニュース" [level=1, ref=e1]
     - link "本日「5のつく日」のお買い物がおトク！" [ref=e81]
     - link "Yahoo! JAPAN" [ref=e96]
     … +49 lines (ctrl+o to expand)

⏺ 「…記事全文を読む」リンクが e59 にあります。クリックします。

⏺ Bash(agent-browser click @e59)
  ⎿  ✓ Done

⏺ Bash(agent-browser eval "document.querySelector('article')?.textContent")
  ⎿  "母国で迫害 日本国籍望む訴訟現場4/5(日) 10:50TBS NEWS DIG Powered by JNN「不相当、却下を!」“日本国籍取得訴訟”で弁護団が反論　国籍取得
     厳格化の中で、国が見せた対応と“黒塗りの解答用紙”【“知られざる法廷”からの報告】TBS NEWS DIG Powered by JNN1473コメント1473件日本で難民
     と認定されたアフリカ出身の男性が、日本国籍の取得を不許可とした国の処分取り消しと国籍付与を求めた裁判で、最終盤に国側が提出した文書に
     弁
     … +4 lines (ctrl+o to expand)

⏺ Bash(agent-browser close)
  ⎿  ✓ Browser closed

⏺ 全ての手順が完了しました。結果をまとめます。

  ---
  agent-browser 実行結果

  アクセスした記事

  「母国で迫害 日本国籍望む訴訟現場」 (TBS NEWS DIG Powered by JNN)

  取得した記事本文（抜粋）

  ▎ 日本で難民と認定されたアフリカ出身の男性が、日本国籍の取得を不許可とした国の処分取り消しと国籍付与を求めた裁判で、最終盤に国側が提出した文
  書に弁護団が強く反論した。法務省が外国人の国籍取得を厳格化する中で、何があったのか。東京地裁の「知られざる法廷」から報告する。（元TBSテレビ社
  会部長　神田和則）

  各ステップで使用したref番号

  ┌──────────┬────────────────────────────┬───────────────┐
  │ ステップ │            操作            │      ref      │
  ├──────────┼────────────────────────────┼───────────────┤
  │ 2        │ スナップショット取得       │ -i オプション │
  ├──────────┼────────────────────────────┼───────────────┤
  │ 3        │ 最初のニュース記事クリック │ @e260         │
  ├──────────┼────────────────────────────┼───────────────┤
  │ 4        │ 「記事全文を読む」クリック │ @e59          │
  ├──────────┼────────────────────────────┼───────────────┤
  │ 5        │ article本文取得            │ eval          │
  └──────────┴────────────────────────────┴───────────────┘

  注意点

  - Yahoo!ニューストップページのスナップショットは非常に大きく、多数のリンクが含まれていた
  - 「主要ニュース」セクションの最初の記事は e260 だったが、スナップショットをしっかり読んで特定する必要があった
  - 記事詳細ページでは記事全文ではなくリード文のみが表示されており、document.querySelector('article')?.textContent
  で取得できたのはその範囲のテキストにとどまった（外部メディアへのフルリダイレクトは発生しなかった）

✻ Cogitated for 50s

❯ /copy
  ⎿  Copied to clipboard (723 characters, 27 lines)
     Also written to /tmp/claude/response.md

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯ 
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  [Sonnet 4.6] 📁 sui-blog | 🪙 33.5K | 21%
```

</details>

<details>
<summary>agent-browser(-i -c)実行ログ</summary>

```bash
⏺ agent-browserを使って手順に従ってタスクを実行します。

⏺ Bash(agent-browser open https://www.yahoo.co.jp/)
  ⎿  ✓ Yahoo! JAPAN
       https://www.yahoo.co.jp/

⏺ Bash(agent-browser snapshot -i -c)
  ⎿  - link "今すぐ設定する" [ref=e5]
     - link "閉じる" [ref=e15]
     - link "AIアシスタント 使ってないサブスク、毎月いくらムダか見てみて" [ref=e1]
     … +70 lines (ctrl+o to expand)

⏺ 最初のニュース記事 母国で迫害 日本国籍望む訴訟現場 (ref=e260) をクリックします。

⏺ Bash(agent-browser click @e260)
  ⎿  ✓ Done

⏺ Bash(agent-browser snapshot -i -c)
  ⎿  - link "本日「5のつく日」のお買い物がおトク！" [ref=e81]
     - link "Yahoo! JAPAN" [ref=e96]
     - link "ヘルプ" [ref=e97]
     … +47 lines (ctrl+o to expand)

⏺ 「記事全文を読む」リンク (ref=e59) をクリックします。

⏺ Bash(agent-browser click @e59)
  ⎿  ✓ Done

⏺ Bash(agent-browser eval "document.querySelector('article')?.textContent")
  ⎿  "母国で迫害 日本国籍望む訴訟現場4/5(日) 10:50TBS NEWS DIG Powered by JNN「不相当、却下を!」“日本国籍取得訴訟”で弁護団が反論　国籍取得
     厳格化の中で、国が見せた対応と“黒塗りの解答用紙”【“知られざる法廷”からの報告】TBS NEWS DIG Powered by JNN1473コメント1473件日本で難民
     と認定されたアフリカ出身の男性が、日本国籍の取得を不許可とした国の処分取り消しと国籍付与を求めた裁判で、最終盤に国側が提出した文書に
     弁
     … +4 lines (ctrl+o to expand)

⏺ Bash(agent-browser close)
  ⎿  ✓ Browser closed

⏺ 全手順が完了しました。

  ---
  実行結果まとめ

  取得した記事

  タイトル: 「不相当、却下を!」"日本国籍取得訴訟"で弁護団が反論

  記事概要:
  日本で難民と認定されたアフリカ出身の男性が、日本国籍の取得を不許可とした国の処分取り消しと国籍付与を求めた裁判で、最終盤に国側が提出した文書
  に弁護団が強く反論。法務省が外国人の国籍取得を厳格化する中で何があったのかを東京地裁の法廷から報告する内容（TBS NEWS DIG）。

  ---
  agent-browser の操作フロー

  ┌─────────────────────────┬─────────────────────────────────────────────────────────────────────┬────────────────────────┐
  │        ステップ         │                              コマンド                               │          結果          │
  ├─────────────────────────┼─────────────────────────────────────────────────────────────────────┼────────────────────────┤
  │ 1. URL を開く           │ agent-browser open https://www.yahoo.co.jp/                         │ 成功                   │
  ├─────────────────────────┼─────────────────────────────────────────────────────────────────────┼────────────────────────┤
  │ 2. スナップショット取得 │ agent-browser snapshot -i -c                                        │ ニュース一覧を確認     │
  ├─────────────────────────┼─────────────────────────────────────────────────────────────────────┼────────────────────────┤
  │ 3. 最初の記事クリック   │ agent-browser click @e260                                           │ トピックスページに遷移 │
  ├─────────────────────────┼─────────────────────────────────────────────────────────────────────┼────────────────────────┤
  │ 4. 全文リンククリック   │ agent-browser click @e59                                            │ 全文ページに遷移       │
  ├─────────────────────────┼─────────────────────────────────────────────────────────────────────┼────────────────────────┤
  │ 5. 本文取得             │ agent-browser eval "document.querySelector('article')?.textContent" │ 記事本文を取得         │
  ├─────────────────────────┼─────────────────────────────────────────────────────────────────────┼────────────────────────┤
  │ 6. ブラウザを閉じる     │ agent-browser close                                                 │ 成功                   │
  └─────────────────────────┴─────────────────────────────────────────────────────────────────────┴────────────────────────┘

✻ Crunched for 36s

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯ 
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  [Sonnet 4.6] 📁 sui-blog | 🪙 28.0K | 18%
```

</details>

<details>
<summary>playwright-cli 実行ログ</summary>

```bash
⏺ Playwright CLIを使って手順通りに実行します。

⏺ Bash(playwright-cli open https://www.yahoo.co.jp/ 2>&1)
  ⎿  ### Browser `default` opened with pid 10563.
     ### Ran Playwright code
     ```js
     … +10 lines (ctrl+o to expand)
  ⎿  (timeout 30s)

⏺ Bash(playwright-cli snapshot 2>&1)
  ⎿  ### Page
     - Page URL: https://www.yahoo.co.jp/
     - Page Title: Yahoo! JAPAN
     … +199 lines (ctrl+o to expand)

⏺ スナップショットファイルからニュースリンクを探します。

  Searched memories (ctrl+o to expand)

⏺ 最初のニュース記事は ref=e573 (「母国で迫害 日本国籍望む訴訟現場」) です。クリックします。

⏺ Bash(playwright-cli click e573 2>&1)
  ⎿  ### Ran Playwright code
     ```js
     await page.getByRole('link', { name: '母国で迫害 日本国籍望む訴訟現場' }).click();
     … +9 lines (ctrl+o to expand)

⏺ 記事詳細ページに遷移しました。「記事全文を読む」リンクを探します。

⏺ Bash(playwright-cli snapshot 2>&1 | head -100)
  ⎿  ### Page
     - Page URL: https://news.yahoo.co.jp/pickup/6575239
     - Page Title: 母国で迫害 日本国籍望む訴訟現場 - Yahoo!ニュース
     … +33 lines (ctrl+o to expand)

⏺ Bash(playwright-cli snapshot 2>&1 | grep -i "全文\|記事を読む\|続きを読む\|read\|article" | head -20)
  ⎿            - article [ref=e107]:
                       - /url: https://news.yahoo.co.jp/articles/6c94e4b3396aaba1211b331d97d3e956f60eb644/images/000
                     - /url: https://news.yahoo.co.jp/articles/6c94e4b3396aaba1211b331d97d3e956f60eb644
     … +15 lines (ctrl+o to expand)

⏺ 「記事全文を読む」リンクが ref=e140 です。クリックします。

⏺ Bash(playwright-cli click e140 2>&1)
  ⎿  ### Ran Playwright code
     ```js
     await page.getByRole('link', { name: '…記事全文を読む' }).click();
     … +10 lines (ctrl+o to expand)

⏺ 記事ページに遷移しました。記事本文を取得します。

⏺ Bash(playwright-cli eval "document.querySelector('article')?.textContent" 2>&1)
  ⎿  ### Result
     "「不相当、却下を!」“日本国籍取得訴訟”で弁護団が反論　国籍取得厳格化の中で、国が見せた対応と“黒塗りの解答用紙”【“知られざる法廷”から
     の
     報告】4/5(日) 6:30配信1473コメント1473件TBS NEWS DIG Powered by JNN日本で難民と認定されたアフリカ出身の男性が、日本国籍の取得を不許可
     … +23 lines (ctrl+o to expand)

⏺ Bash(playwright-cli close 2>&1)
  ⎿  Browser 'default' closed
  ⎿  (timeout 15s)

⏺ Playwright CLIでの実行が完了しました。

  実行結果まとめ

  ┌────────────────────────────────┬───────────────────────────────────────────────────────────┐
  │            ステップ            │                           結果                            │
  ├────────────────────────────────┼───────────────────────────────────────────────────────────┤
  │ 1. Yahoo! JAPAN を開く         │ 成功                                                      │
  ├────────────────────────────────┼───────────────────────────────────────────────────────────┤
  │ 2. スナップショット取得        │ ref=e573 に最初のニュース記事を発見                       │
  ├────────────────────────────────┼───────────────────────────────────────────────────────────┤
  │ 3. ニュース記事クリック        │ 「母国で迫害 日本国籍望む訴訟現場」→ pickup ページへ遷移  │
  ├────────────────────────────────┼───────────────────────────────────────────────────────────┤
  │ 4. 「…記事全文を読む」クリック │ ref=e140 → 記事詳細ページへ遷移                           │
  ├────────────────────────────────┼───────────────────────────────────────────────────────────┤
  │ 5. 記事本文取得                │ document.querySelector('article')?.textContent で取得成功 │
  ├────────────────────────────────┼───────────────────────────────────────────────────────────┤
  │ 6. ブラウザを閉じる            │ 成功                                                      │
  └────────────────────────────────┴───────────────────────────────────────────────────────────┘

  取得した記事の概要

  タイトル: 「不相当、却下を!」"日本国籍取得訴訟"で弁護団が反論 — 国籍取得厳格化の中で、国が見せた対応と"黒塗りの解答用紙"

  内容: アフリカ出身の難民男性が日本国籍取得を求めて提訴した裁判の報告。結審直前に国側が新たな文書を提出し、弁護団が強く反論。男性は難民認定後
  に早稲田大学大学院で博士号を取得し、国連で働いて難民を助けることを目指しているが、無国籍状態のためパスポートが持てず、2回の国籍申請もいずれも
  不許可になっているという内容。(TBS NEWS DIG、4/5配信)

  ---
  Playwright CLI の特徴 (今回の実行から)

  - playwright-cli snapshot でページ全体のYAML形式スナップショットを取得
  - ref=e573 のようにシンプルな番号形式でrefを指定
  - playwright-cli eval でJavaScript評価が可能
  - スナップショットは99KB超の大きなテキストになることがある

✻ Cooked for 1m 7s

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯ 
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  [Sonnet 4.6] 📁 sui-blog | 🪙 26.3K | 16%
```

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

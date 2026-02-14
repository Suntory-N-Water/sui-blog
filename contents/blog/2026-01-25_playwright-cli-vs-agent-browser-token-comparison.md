---
title: Playwright CLI と agent-browser のどちらがトークン消費量が少ないか比較検証してみた
slug: playwright-cli-vs-agent-browser-token-comparison
date: 2026-01-25
modified_time: 2026-01-25
description: Playwright CLIとagent-browserで同一操作を行い、トークン消費量を比較しました。スナップショットをファイル出力してGrep検索する設計思想により、Playwright CLIはagent-browserより約40%のトークン削減を達成しています。本記事ではAIブラウザ操作ツールの設計思想の違いがコストに与える影響を検証します。
icon: 💉
icon_url: /icons/syringe_flat.svg
tags:
  - Playwright
  - agent-browser
  - AI
selfAssessment:
  quizzes:
    - question: "Playwright CLIとagent-browserの設計思想における最も重要な違いは何ですか？"
      answers:
        - text: "Playwright CLIはスナップショットをファイルに出力してGrep検索するが、agent-browserは全要素をコンソールに直接出力する"
          correct: true
          explanation: "この設計思想の違いにより、Playwright CLIはAIエージェントに渡すトークン量を削減できます。必要な部分だけをGrep検索で取得するため、全要素を一度に受け取るagent-browserよりもトークン消費量が少なくなります。"
        - text: "Playwright CLIはブラウザの自動操作ができないが、agent-browserはできる"
          correct: false
          explanation: "両方ともブラウザの自動操作が可能です。違いは操作方法ではなく、スナップショットの取得と処理方法にあります。"
        - text: "Playwright CLIはCLIツールだが、agent-browserはGUIツールである"
          correct: false
          explanation: "両方ともCLIツールです。記事中でも「agent-browserと同様にCLIベースのブラウザ操作ツール」と説明されています。"
        - text: "Playwright CLIはMicrosoftが開発したが、agent-browserはGoogleが開発した"
          correct: false
          explanation: "agent-browserはVercelが開発しました。記事中で「2026年1月にVercelがagent-browserというCLIツールを公開しました」と記載されています。"
    - question: "Yahoo! JAPANでニュース記事を取得する検証の結果、Playwright CLIのトークン消費量はagent-browserと比較してどの程度少なかったですか？"
      answers:
        - text: "約40%少なかった"
          correct: true
          explanation: "検証結果の表によると、Playwright CLIは24.7K、agent-browserは34.4Kで、差分は+39.3%でした。つまりPlaywright CLIはagent-browserよりも約40%少ないトークン消費量で同じ操作を実現しました。"
        - text: "約70%少なかった"
          correct: false
          explanation: "70%の削減は、Playwright MCPとagent-browserを比較した際の結果です。Playwright CLIとagent-browserの比較では約40%の削減でした。"
        - text: "約10%少なかった"
          correct: false
          explanation: null
        - text: "ほぼ同じだった"
          correct: false
          explanation: null
    - question: "Playwright CLIでスナップショットを取得すると、AIエージェントに何が返却されますか？"
      answers:
        - text: "スナップショットファイルのパス"
          correct: true
          explanation: "記事中で「スナップショットを取得すると、エージェントにはファイルパスのみが返却されます」と説明されています。この仕組みにより、AIエージェントは必要な部分だけをGrep検索で取得でき、トークン消費量を削減できます。"
        - text: "ページ内のすべての要素とその属性情報"
          correct: false
          explanation: "これはagent-browserの動作です。agent-browserでは「すべての要素がコンソールに直接出力されます」が、Playwright CLIでは「ファイルパスのみが返却されます」。"
        - text: "ページのHTMLソースコード全体"
          correct: false
          explanation: null
        - text: "スクリーンショット画像"
          correct: false
          explanation: null
diagram:
  - type: hero
    date: "2026/01/25"
    title: "Playwright CLI と agent-browser のどちらがトークン消費量が少ないか比較検証してみた"
    subtitle: "設計思想の違いがもたらすコストへの影響。MicrosoftとVercelの最新ツールを徹底比較。"
  - type: timeline_process
    title: "ブラウザ操作AIツールの進化"
    introText: "AIエージェントによるブラウザ操作技術は、トークン消費量の課題を解決するために急速に進化しています。"
    icon: history
    events:
      - time: "2025/03"
        title: "Playwright MCP公開"
        description: "Microsoftが公開。スナップショット全体を送信するためトークン消費量が膨大になる課題があった。"
      - time: "2026/01"
        title: "agent-browser公開"
        description: "Vercelが公開。独自の参照方式Refsを採用しトークン削減を実現。Playwright MCP比で約70%削減。"
      - time: "2026/01"
        title: "Playwright CLI公開"
        description: "Microsoftが新たに公開。スナップショットをファイル出力してGrep検索する設計思想を採用。"
        isHighlight: true
        accentColor: GOLD
  - type: transition
  - type: core_message
    variant: highlight
    icon: scale
    title: "設計思想の決定的違い"
    mainMessage: "agent-browserは全要素をコンソールに出力するが、Playwright CLIはファイル化とGrep検索で必要な情報だけを抽出する。"
    comparisons:
      - icon: terminal
        title: "agent-browser"
        text: "スナップショット取得時に全要素をコンソールに直接出力するためコンテキストが増加する。"
        isGood: false
      - icon: fileText
        title: "Playwright CLI"
        text: "ファイルパスのみを返却しAIがGrep検索で必要な部分だけを取得するため無駄がない。"
        isGood: true
    coreHighlight:
      title: "Grep検索による最適化"
      text: "ファイル出力後に検索をかけることで、AIエージェントに渡すトークン量を最小限に抑えることができる。"
      accentColor: GOLD
  - type: flow_chart
    title: "Playwright CLIの処理フロー"
    introText: "スナップショットを直接LLMに渡さず、ファイル経由でフィルタリングする仕組みがトークン節約の鍵です。"
    flows:
      - label: "Browser"
        subLabel: "Webページ"
        highlight: false
      - label: "Snapshot"
        subLabel: "page.ymlへ出力"
        highlight: false
      - label: "Agent"
        subLabel: "ファイルパス受取"
        highlight: false
      - label: "Grep検索"
        subLabel: "必要な行のみ抽出"
        highlight: true
        accentColor: GOLD
      - label: "LLM"
        subLabel: "最小トークン送信"
        highlight: false
  - type: transition
  - type: steps
    title: "検証：Yahoo!ニュース取得"
    introText: "両ツールで全く同じ操作を行い、トークン消費量の差を検証しました。"
    steps:
      - number: 1
        title: "サイトへアクセス"
        text: "Yahoo! JAPANのトップページを開く"
      - number: 2
        title: "スナップショット"
        text: "ページの状態を取得しニュースリンクを探す"
      - number: 3
        title: "記事をクリック"
        text: "特定のrefを指定してニュース記事へ遷移"
      - number: 4
        title: "全文取得"
        text: "evalコマンドでarticleタグ内のテキストを取得"
  - type: metrics_impact
    title: "検証結果：トークン削減効果"
    introText: "同じ操作を行った結果、Playwright CLIの方が圧倒的に効率的であることが判明しました。"
    icon: trendingDown
    layout: horizontal
    metrics:
      - value: "-39.3"
        unit: "%"
        label: "トークン消費量削減"
        description: "agent-browserと比較した際の削減率"
        accentColor: GOLD
      - value: "24.7"
        unit: "K"
        label: "Playwright CLI"
        description: "総トークン使用量"
      - value: "34.4"
        unit: "K"
        label: "agent-browser"
        description: "総トークン使用量"
  - type: score_comparison
    title: "トークン消費量の比較詳細"
    introText: "Playwright CLIはコンテキスト量を15%に抑え、コスト効率の高い運用を可能にします。"
    scores:
      - title: "Playwright CLI"
        value: 24.7
        unit: "Ktkn"
        barPercentage: 71
        description: "ファイルベースのアプローチで効率化"
        accentColor: GOLD
      - title: "agent-browser"
        value: 34.4
        unit: "Ktkn"
        barPercentage: 100
        description: "全要素出力により消費増"
  - type: transition
  - type: action
    title: "コスト効率の良いAI操作へ"
    mainText: "Playwright CLIを活用して、トークンコストを抑えながら高度なブラウザ操作を実現しましょう。"
    actionStepsTitle: "導入のポイント"
    actionSteps:
      - title: "Playwright CLI導入"
        description: "npm install -g @playwright/mcp@latest で今すぐインストール"
      - title: "Grep活用の意識"
        description: "全量取得せずファイル検索を活用するようエージェントに指示する"
    pointText: "OSSの開発競争によりツールは日々進化しています。最新の設計思想を取り入れ、AIエージェントの運用コストを最適化していきましょう。"
    footerText: "発展途上の技術を攻略していこう"
    subFooterText: "sui Tech Blog"
    accentColor: GOLD
---
AIエージェントによるブラウザ自動操作は、2025年3月にMicrosoftが公開したPlaywright MCPによって可能になりました。AIがブラウザを操作し、ページの状態を確認しながら次の操作を決定するというしくみです。しかし、Playwright MCPにはページのスナップショット全体をAIに送信するため、トークン消費量[^token]が膨大になるという課題がありました。

この課題を解決するため、2026年1月にVercelがagent-browserというCLIツールを公開しました。agent-browserは独自の参照方式(Refs)を採用し、ページ全体ではなく必要な要素のRefと要約情報をAIに渡すことで、トークン消費量の削減を実現しています。agent-browserを使用してPlaywright MCPと比較検証した結果、約70%のトークン削減に成功しました。詳細は[こちらの記事](https://suntory-n-water.com/blog/i-tried-using-agent-browser/)をご覧ください。

そして同じく2026年1月、Playwrightの開発元であるMicrosoftが新たにPlaywright CLIを公開しました。このツールもagent-browserと同様にCLIベースのブラウザ操作ツールですが、設計思想に違いがあります。この記事では、agent-browserとPlaywright CLIの両方を使って同じ操作を試み、設計思想の違いと実際のトークン消費量の差異を検証していきます。

## Playwright CLIのインストール

Playwright CLIの実態はPlaywright MCPです。これはnpmパッケージとして提供されているため、npmを使ってインストールできます。

```bash
npm install -g @playwright/mcp@latest
```

実際に操作するときはagent skills[^agent-skills]を使用するのが推奨されていますので、skillsをインストールします。
```bash
mkdir -p .claude/skills/playwright-cli
curl -o .claude/skills/playwright-cli/SKILL.md \
  https://raw.githubusercontent.com/microsoft/playwright-cli/main/skills/playwright-cli/SKILL.md
```

## Playwright CLIの使い方
Playwright CLIはagent-browserと同様に、CLIから `playwright-cli <コマンド>` の形式で使用します。
以下は `open` コマンドを使用して本ブログのトップページにアクセスするときの例です。
```bash
playwright-cli open https://suntory-n-water.com/
```
その他の要素としてPlaywrightでよく使うクリック操作や文字入力操作、関数を実行できるevalなどのコマンドが用意されています。少し特徴的だったのは、リサイズも用意されている点です。これは開発元であるPlaywrightならではのものでしょう。
```bash
playwright-cli open <url>               # open url
playwright-cli click <ref> [button]     # perform click on a web page
playwright-cli dblclick <ref> [button]  # perform double click on a web page
playwright-cli fill <ref> <text>        # fill text into editable element
playwright-cli snapshot                 # capture page snapshot to obtain element ref
playwright-cli eval <func> [ref]        # evaluate javascript expression on page or element
playwright-cli resize <w> <h>           # resize the browser window
```

## 実際にサイトへアクセスしてみる
それではPlaywright CLIを使って実際にサイトにアクセスしていきましょう。今回も以前書いた記事と同様にYahoo! JAPANへアクセスしていき、トップページにある最新のニュース1件の本文を取得してみます。

```bash
❯ Playwright CLI を使用して https://www.yahoo.co.jp/から最新のニュースを１件取得し、ニュースの詳細画面へ遷移して内容を取得してください。
```

![Playwright CLIでYahoo! JAPANを開きスナップショットを取得する操作例](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/a122905462523b3f4231a3d08f8a3b38.png)

![Playwright CLIでスナップショットからニュースリンクをGrep検索する操作例](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/6e3108bc6e0069c5d1d214866dd7c421.png)

![Playwright CLIでニュース記事をクリックし本文を取得する操作例](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/7ba96f6d3f2b116b04fe140d911d0bd4.png)

ここで特徴的な点は、ページにアクセスすると、その時点でのスナップショットが `.playwright-cli/page-xxx.yml` にファイルとして保存されることです。エージェントへの返却はそのパスが提供されるというしくみです。
```bash
playwright-cli open https://www.yahoo.co.jp/
### Page
- Page URL: https://www.yahoo.co.jp/
- Page Title: Yahoo! JAPAN
### Snapshot
- [snapshot](.playwright-cli/page-2026-01-24T12-15-56-958Z.yml)
```
AIエージェントは大量のHTMLやref情報などを直接受け取りません。
ファイルとして出力されたものをGrep検索することで、ユーザーが実際に解決したい内容に基づいて操作を柔軟に変更します。以下のymlは実際にYahoo! JAPANへアクセスしたときのスナップショット例です。
```yml
- generic [ref=e3]:
  - complementary
  - main [ref=e129]:
    - generic [ref=e501]:
      - article [ref=e503]:
        - generic [ref=e504]:
          - tabpanel "主要" [ref=e527]:
            - heading "主要 ニュース" [level=1] [ref=e529]
            - generic [ref=e530]:
              - generic "主要 ニュース" [ref=e531]:
                - paragraph [ref=e532]:
                  - generic [ref=e533]: 1/24(土) 21:30更新
                - list [ref=e534]:
                  - listitem [ref=e535]:
                    - article [ref=e536]:
                      - text: ・
                      - link "25日大雪ピーク 交通への影響警戒 NEW" [ref=e537] [cursor=pointer]:
                        - /url: https://news.yahoo.co.jp/pickup/6567363
                        - generic [ref=e539]:
                          - heading "25日大雪ピーク 交通への影響警戒" [level=1] [ref=e540]:
                            - generic [ref=e541]: 25日大雪ピーク 交通への影響警戒
                          - generic [ref=e543]: NEW
                  - listitem [ref=e544]:
                    - article [ref=e545]:
                      - text: ・
                      - link "食料品の消費税ゼロ案 識者の疑問 NEW 232" [ref=e546] [cursor=pointer]:
                        - /url: https://news.yahoo.co.jp/pickup/6567313
                        - generic [ref=e548]:
                          - heading "食料品の消費税ゼロ案 識者の疑問" [level=1] [ref=e549]:
                            - generic [ref=e550]: 食料品の消費税ゼロ案 識者の疑問
                          - generic [ref=e552]: NEW
                          - generic [ref=e556]: "232"
```

agent-browserとの大きな違いはスナップショットの取得方法です。

まずagent-browserではスナップショットを取得した段階で、すべての要素がコンソールに直接出力されます。

```bash
agent-browser snapshot -i
- link "今すぐ設定する" [ref=e1]
- link "閉じる" [ref=e2]
- link "AIアシスタント..." [ref=e3]
… +226 lines (ctrl+o to expand)
```

agent-browserでは「ブログから最新記事のリンクだけほしい」場合でも、大量のコンテキストがエージェントに流れてしまいます。

```mermaid
graph LR
    A[Browser] -->|snapshot| B[All Elements<br/>226+ lines]
    B -->|直接出力| C[AI Agent]
    C -->|全要素| D[LLM]
```

一方、Playwright CLIではスナップショットを取得すると、`open` コマンドを実行したときと同様に、エージェントにはファイルパスのみが返却されます。

```bash
playwright-cli snapshot
### Page
- Page URL: https://www.yahoo.co.jp/
- Page Title: Yahoo! JAPAN
### Snapshot
- [snapshot](.playwright-cli/page-xxx.yml)
```

AIエージェントはファイルとして出力されたものをGrep検索することで、必要な部分だけを取得します。

```mermaid
graph LR
    A[Browser] -->|snapshot| B[File: page.yml]
    B -->|file path| C[AI Agent]
    C -->|grep検索| B
    B -->|必要な部分のみ| C
    C -->|最小限のトークン| D[LLM]
```

このように、Playwright CLIはファイルへ出力した後にGrep検索するため、無駄な情報をAIエージェントに渡さずに済むことからトークン消費量を削減できることが予測されます。

## agent-browserとトークン消費量を比較する
それではClaude Codeを使って、Playwright CLIとagent-browserの両方に同じ操作をさせてトークン消費量の差異を確認していきましょう。参考程度に実際の手順書を貼っておきます。

<details>
<summary>検証手順</summary>

````md
## 比較条件
- 同じURL(https://www.yahoo.co.jp/)にアクセス
- 最初のニュース記事をクリック
- 記事詳細ページに遷移
- 記事の全文を取得

## Playwright CLI

### 手順
1. Yahoo! JAPANを開く
```bash
playwright-cli open https://www.yahoo.co.jp/
```

2. スナップショットを取得してニュースリンクを探す
```bash
playwright-cli snapshot
```

3. 最初のニュース記事のrefを特定し、クリック(例: e547)
```bash
playwright-cli click e547
```

4. 記事詳細ページで「記事全文を読む」リンクのrefを特定し、クリック(例: e132)
```bash
playwright-cli click e132
```

5. 記事本文を取得
```bash
playwright-cli eval "document.querySelector('article')?.textContent"
```

6. ブラウザを閉じる
```bash
playwright-cli close
```

---

## agent-browser

### 手順
1. Yahoo! JAPANを開く
```bash
agent-browser open https://www.yahoo.co.jp/
```

2. スナップショットを取得してニュースリンクを探す
```bash
agent-browser snapshot -i
```

3. 最初のニュース記事のrefを特定し、クリック(例: @e100)
```bash
agent-browser click @e100
```

4. 記事詳細ページで「記事全文を読む」リンクのrefを特定し、クリック(例: @e39)
```bash
agent-browser click @e39
```

5. 記事本文を取得
```bash
agent-browser eval "document.querySelector('article')?.textContent"
```

6. ブラウザを閉じる
```bash
agent-browser close
```

---

## 注意事項

1. **ref番号の違い**: 各ツールでref番号が異なるため、実際のスナップショット結果を確認して正しいrefを使用してください
3. **eval実行**: 両方とも同じJavaScriptコードを使用して記事本文を取得してください
````

</details>

最終的な結果は以下のとおりです。予想通りagent-browserと比較して40%ほどトークン消費量が少ない結果となりました。これは設計思想の違いによってもたらされた結果だといえます。

| ツール | 総トークン使用量 | 差分 | コンテキスト量 |
|-------|----------------|------|--------------|
| Playwright CLI | 24.7K | - | 15% |
| agent-browser | 34.4K | +39.3%増 | 21% |

各ツール仕様時の詳細なログは、こちらをご覧ください。

<details>
<summary>Playwright CLI</summary>

```bash
⏺ Yahoo! JAPANにアクセスし、ニュース記事の本文を取得する作業を開始します。

⏺ Bash(playwright-cli open https://www.yahoo.co.jp/)
  ⎿  ### Page
     - Page URL: https://www.yahoo.co.jp/
     - Page Title: Yahoo! JAPAN
     … +6 lines (ctrl+o to expand)

⏺ Bash(playwright-cli snapshot)
  ⎿  ### Page
     - Page URL: https://www.yahoo.co.jp/
     - Page Title: Yahoo! JAPAN
     … +4 lines (ctrl+o to expand)

⏺ Bash(playwright-cli click e547)
  ⎿  ### Page
     - Page URL: https://news.yahoo.co.jp/pickup/6567313
     - Page Title: 食料品の消費税ゼロ案 識者の疑問 - Yahoo!ニュース
     … +6 lines (ctrl+o to expand)

⏺ Bash(playwright-cli snapshot)
  ⎿  ### Page
     - Page URL: https://news.yahoo.co.jp/pickup/6567313
     - Page Title: 食料品の消費税ゼロ案 識者の疑問 - Yahoo!ニュース
     … +2 lines (ctrl+o to expand)

⏺ Bash(playwright-cli click e132)
  ⎿  ### Page
     - Page URL: https://news.yahoo.co.jp/pickup/6567313
     - Page Title: 食料品の消費税ゼロ案 識者の疑問 - Yahoo!ニュース
     … +2 lines (ctrl+o to expand)

⏺ Bash(playwright-cli eval "document.querySelector('article')?.textContent")
  ⎿ ### Result
    "食料品の消費税ゼロ案 識者の疑問1/24(土) 15:07ABEMA TIMES2026年衆議院選挙「食料品の消費税ゼロ」で本当に国民は救
    われる？経済専門家が指摘する疑問点の数々「説得力のある財源がない」「今、そこまで必要か」界隈では実質賃金上昇の
    見
    … +9 lines (ctrl+o to expand)


⏺ Bash(playwright-cli close)
  ⎿  ### Result
     No open tabs. Navigate to a URL to create one.

⏺ 完了

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯ 
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  🪙 24.7K | 15%
```

</details>

<details>
<summary>agent-browser</summary>

```bash
⏺ 作業を実行します。

⏺ Bash(agent-browser open https://www.yahoo.co.jp/)
  ⎿  ✓ Yahoo! JAPAN
       https://www.yahoo.co.jp/

⏺ Bash(agent-browser snapshot -i)
  ⎿  - link "今すぐ設定する" [ref=e1]
     - link "閉じる" [ref=e2]
     - link "AIアシスタント 誰も知らない「新種の深海魚」。どんな姿か想像しよう" [ref=e3]
     … +226 lines (ctrl+o to expand)

⏺ Bash(agent-browser click @e100)
  ⎿  ✓ Done

⏺ Bash(agent-browser snapshot -i)
  ⎿  - link "世界が注目する投資家が語る「未来を動かす投資」とは？" [ref=e1]
     - link "Yahoo! JAPAN" [ref=e2]
     - link "ヘルプ" [ref=e3]
     … +103 lines (ctrl+o to expand)

⏺ Bash(agent-browser click @e39)
  ⎿  ✓ Done

⏺ Bash(agent-browser eval "document.querySelector('article')?.textContent")
  ⎿ "明日25日は大雪ピーク　日本海側を中心に大雪注意・警戒　大阪・名古屋にも雪雲流入1/24(土) 18:09配信57コメント57件
    画像：tenki.jp明日25日は大雪がピークとなり、北日本から西日本の日本海側を中心に、山沿いだけでなく平野部でも大雪
    と
    なる見込みです。また、普段、雪の少ない太平洋側でも大雪となる所があるでしょう。積雪や路面凍結による交通への影響
    … +22 lines (ctrl+o to expand)


⏺ Bash(agent-browser close)
  ⎿  ✓ Browser closed

⏺ 完了

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯ 
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  🪙 34.4K | 21%

```

</details>



ただ気になる点として、この動向を、agent-browserが黙って見ているはずがないでしょう。OSSとして開発されている両ライブラリですが、今後のアップデートでよりAIエージェントが使いやすく、かつトークン消費量が少ないツールに進化していくことを期待します。
個人的にCLIでの操作性はagent-browserが勝っているので、そのあたりの体験も期待したいです。

## まとめ

- Playwright CLIはPlaywright MCPをベースとしたCLIでブラウザを操作するツール
- agent-browserと比較してスナップショットの撮影、要素の検索手法に設計思想の違いがある
- スナップショットをファイル出力してGrep検索したほうが、エージェントに流れるトークン消費量が少ない
- agent-browserと比較して40%ほどトークン消費量が少なかった

## 参考

https://github.com/microsoft/playwright-cli

https://github.com/vercel-labs/agent-browser


[^token]: トークンとは、AIが処理するテキストの単位で、使用量に応じて料金がかかります。トークン消費量が多いほど、処理コストと応答時間が増加します。
[^agent-skills]: Agent Skillsは、AIエージェントの機能を拡張するモジュール型の機能です。各Skillは、AIエージェントが関連する場合に自動的に使用する指示、メタデータ、およびオプションのリソース(スクリプト、テンプレート)をパッケージ化します。
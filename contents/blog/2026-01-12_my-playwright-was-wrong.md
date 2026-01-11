---
title: やはり俺のPlaywrightはまちがっている。
slug: my-playwright-was-wrong
date: 2026-01-12
modified_time: 2026-01-12
description: 過去のプロジェクトから流用したPlaywrightのコードは「動いて」いました。しかし、偶然ドキュメントを読み直したとき、「動く」と「正しく動く」の間には設計思想の違いがあることに気づきました。page.evaluate()ではなくlocatorを使うべき理由、waitForNavigation()が非推奨である理由。公式ドキュメントには、単なるAPIリファレンスではなく「なぜこの方法が推奨されるのか」が書かれています。時間がない現実の中で、それでもドキュメントを読む価値とは何かを考えます。
icon: 🎭️
icon_url: /icons/performing_arts_flat.svg
tags:
  - Playwright
selfAssessment:
  quizzes:
    - question: "Playwrightで要素をクリックする際、`page.evaluate()`を使った実装が正常に動作しています。この実装について正しい説明はどれですか？"
      answers:
        - text: "動いているので問題ない。過去のプロジェクトで実績があるコードなら信頼できる"
          correct: false
          explanation: "「動く」と「正しく動く」は異なります。page.evaluate()は要素の操作可能性を確認しないため、ネットワークが遅い環境や要素の読み込みが遅れる場合にエラーが発生する可能性があります。"
        - text: "問題がある。要素が存在するか事前にチェックする処理を追加すべき"
          correct: false
          explanation: "要素の存在確認だけでは不十分です。Locatorは存在確認に加えて、表示状態、安定性、イベント受信可能性など複数のActionability Checksを自動的に行います。"
        - text: "問題がある。page.locator()を使うことで、要素が操作可能になるまで自動的に待機できる"
          correct: true
          explanation: "正解です。page.evaluate()はActionability Checksを行わないため不安定です。locatorを使うことで、要素がクリック可能な状態になるまで自動的に待機し、タイミングに起因するエラーを減少させることができます。"
        - text: "問題がある。page.waitForSelector()で要素の読み込みを待ってからevaluate()を実行すべき"
          correct: false
          explanation: "waitForSelector()を追加しても、要素が操作可能な状態(アニメーション完了、他要素に覆われていない等)かは確認できません。locatorを使えば、これらすべてのチェックが自動的に行われます。"
    - question: "PlaywrightのLocatorが要素をクリックする前に自動的に行うチェックはどれですか？"
      answers:
        - text: "要素がDOMに存在することのみ"
          correct: false
          explanation: "Locatorは要素の存在確認だけでなく、Actionability Checksとして複数のチェックを自動的に行います。"
        - text: "要素が表示されていること(Visible)と、要素が有効であること(Enabled)のみ"
          correct: false
          explanation: "これらも重要なチェックですが、Locatorはさらに多くのチェックを行います。アニメーションの完了(Stable)、他の要素に覆われていないか(Receives Events)、ビューポート内へのスクロールなども自動的に確認します。"
        - text: "要素がDOMに存在すること、表示されていること、安定していること、イベントを受け取れること、有効であること、ビューポート内にスクロールされることなど複数のチェック"
          correct: true
          explanation: "正解です。Locatorは「要素を特定するだけの仕組み」ではなく、Actionability Checksとして要素が操作可能になるまで待つ仕組みを備えています。これにより、タイミングに起因するエラーを減少させ、テストの安定性を向上させます。"
        - text: "要素のCSSセレクタが正しいことのみ"
          correct: false
          explanation: "セレクタの正しさは開発者が指定するものであり、Locatorが自動的にチェックする項目ではありません。Locatorは要素が操作可能な状態にあるかを確認します。"
diagram:
  - type: hero
    date: "2026/01/12"
    title: "やはり俺のPlaywrightはまちがっている。"
    subtitle: "公式ドキュメントを読み直して気づいた「動く」と「正しく動く」の決定的な違い。"
  - type: problem
    variant: simple
    icon: alertCircle
    title: "「動けばいい」が生む技術的負債"
    introText: "過去のコードを流用することで、知らず知らずのうちに不安定なテストを生み出していませんか？"
    cards:
      - icon: copy
        title: "過去コードの流用"
        subtitle: "思考停止のコピー"
        description: "動いているコードをそのまま使い回し、新たな理解を放棄する。"
        isHighlight: false
      - icon: alertTriangle
        title: "不安定なテスト"
        subtitle: "タイミング依存のエラー"
        description: "要素の準備が整う前に操作を行い、テストがランダムに落ちる。"
        isHighlight: true
        accentColor: RED
      - icon: history
        title: "非推奨APIの使用"
        subtitle: "競合状態のリスク"
        description: "waitForNavigation等は競合状態を引き起こす可能性がある。"
        isHighlight: false
  - type: transition
  - type: core_message
    variant: highlight
    icon: target
    title: "Locatorという「設計思想」"
    mainMessage: "Locatorは単なる要素特定ではありません。要素が操作可能になるまで「待つ」仕組みが内包されており、テストの安定性を劇的に向上させます。"
    comparisons:
      - icon: mousePointer
        title: "Evaluate"
        text: "要素を直接操作。準備不足だと即エラー。"
        isGood: false
      - icon: target
        title: "Locator"
        text: "操作可能になるまで自動で待機して実行。"
        isGood: true
    coreHighlight:
      title: "Actionability Checks"
      text: "可視性、安定性、操作可能性を自動検証し、タイミング問題を解決。"
      accentColor: GOLD
  - type: grouped_content
    title: "自動で行われるチェック"
    introText: "Locatorを使用すると、以下のチェックがすべてパスするまで操作が自動的に待機されます。"
    icon: checkCircle
    groups:
      - title: "存在と可視性の確認"
        description: "要素がDOMに存在し、ユーザーに見えているか。"
        bgColor: muted
        cards:
          - title: "Attached"
            text: "要素がDOMに接続されている"
          - title: "Visible"
            text: "スタイルが可視状態である"
          - title: "In Viewport"
            text: "画面内にスクロール可能である"
      - title: "操作可能性の確認"
        description: "インタラクションを受け取れる状態か。"
        bgColor: white
        cards:
          - title: "Stable"
            text: "アニメーションが完了している"
          - title: "Enabled"
            text: "無効化(disabled)されていない"
          - title: "Receives Events"
            text: "他の要素に覆われていない"
  - type: list_steps
    title: "推奨されるセレクタ優先順位"
    introText: "ユーザーの視点に近いセレクタほど、実装変更に強く堅牢なテストになります。"
    steps:
      - badge: "1"
        title: "Role(役割)"
        description: "アクセシビリティツリーに基づく指定。最も堅牢で推奨される。"
      - badge: "2"
        title: "Label(ラベル)"
        description: "フォーム要素のラベルテキストを使用。ユーザーの視点と一致する。"
      - badge: "3"
        title: "Text(テキスト)"
        description: "表示されているテキスト内容で指定。直感的だが変更に弱い場合も。"
      - badge: "4"
        title: "Test ID"
        description: "テスト専用の属性を使用。どうしても他に適した方法がない場合に。"
  - type: action
    title: "今こそドキュメントを読もう"
    mainText: "「動く」と「正しく動く」の差はドキュメントにあります。急がば回れ、一度立ち止まって読み直してみましょう。"
    actionStepsTitle: "最初のアクション"
    actionSteps:
      - title: "Best Practicesを読む"
        description: "公式ドキュメントのBest Practicesページに目を通す。"
      - title: "Locatorへ置き換える"
        description: "evaluateやwaitForを使用している箇所をLocatorに修正する。"
    pointText: "ライブラリの作者が込めた設計思想を理解することで、コードの品質は確実に向上します。"
    footerText: "今こそ、公式ドキュメントを読み直す時です。"
    subFooterText: "sui Tech Blog"
    accentColor: GOLD
---

生成AIと共同での開発が主軸となる昨今の開発現場でも、基本的な開発手法に変化はありません。生成AIが作成したコードに型エラーが出た場合、開発者も生成AIもドキュメントを参照し、正しい使い方を確認します。読んだだけでも分からない時は、具体的なエラー内容とドキュメントの内容を生成AIに伝え、修正案を提案してもらいます。AIが介入したことによりこのサイクルは高速化しましたが、根本的な流れは変わっていません。

動いたら、次のタスクに移ります。常に良いコードを作成するべきだとは思いますが、現実的には「動けば良い」という判断をして「// TODO: 後で直す」としてしまうことも多いでしょう。こうしないためにも「ドキュメントをちゃんと読め」と言われることもあります。

しかし、開発までのサイクルや、納期がありますし、他のタスクもあります。もし過去のプロジェクトから流用したコードを今回の開発で利用しているのであれば、動いているならそれで良いと考えてしまうのも無理はありません。
現時点で動いているものを新たに理解し実践するための時間を捻出するのは難しいでしょう。わざわざ公式ドキュメントを隅々まで読んで、理解して、実践する時間なんてなかなか取れません。

これはエンジニアとしての怠慢ではなく、プロジェクトの現実です。開発にだけ没頭している時間は少ないこともあるため、その選択が間違っているとは思いません。これを読んでいるあなたも、同じように考えているはずです。

しかし、偶然にも公式ドキュメントを最初から読み直す機会を得ました。Claude Codeにベストプラクティスを読み込ませるためのAgents Skills[^agents-skills]を作成する必要があったからです。
Agents SkillsはMarkdownとして定義する必要があり「どうせなら、ちゃんと読んでおくか」と思い、現在使用しているPlaywrightの公式ドキュメントを一通り読むことにしました。

色々読んで思ったことは、**「やはり俺のPlaywrightはまちがっている。」** です。

## 動けばいい？

私は過去プロジェクトのコードを流用していました。Playwrightを使う際、動いていたテストコードをコピーして、今回のプロジェクト用に少し修正して使用します。CSSセレクタを変更したり、URLを変えたりするだけで済むため、時間の節約になります。
動いているコードがあるなら、それを使う。この選択には合理的な理由があります。時間は限られており、既に動作が確認されているコードを再利用することで、新たなバグを生むリスクも減らせます。

例えば、私はボタンをクリックする処理を `page.evaluate()` で実装していました。

```ts
await page.evaluate(() => {
  document.querySelector('button.submit').click();
});
```

事実、このコードは「動いて」いました。ボタンはクリックされて次画面への遷移、ラジオボタンの選択など、一連の操作は問題なく実行されています。
しかし、1箇所変更するだけで動作が向上することに気づきました。

```ts
await page.locator('button.submit').click();
```

## locatorの設計思想

`page.evaluate()` と `page.locator().click()` の違いは何でしょうか？どちらもボタンを押下するコードです。公式ドキュメントを詳しく読むと、全く異なる設計思想が反映されていることが分かります。

`page.evaluate()` は、ブラウザコンテキスト[^ブラウザコンテキスト]内でJavaScriptコードを実行するためのメソッドです。指定された関数は、ページ上で直接実行され、DOM要素にアクセスして操作を行います。ところが、この方法では要素が存在しない場合や、まだインタラクティブでない場合にエラーが発生する可能性があります。そのため、**要素がクリック可能な状態であることを確認するための追加のロジック**が必要になります。

Playwrightの公式ドキュメントでは、DOM操作を直接行う方法について、actionability checks[^actionability-checks]を行わないため不安定なテストにつながる可能性があると説明されています。ベストプラクティスでは、`locator` の使用が強く推奨されています。

https://playwright.dev/docs/evaluating

一方、`page.locator().click()` は、PlaywrightのLocator APIを使用しています。Locatorは、要素の位置を特定し、その**要素がインタラクティブであることを自動で確認**します。これには、要素が表示されているか、クリック可能な状態であるかなどのチェックが含まれます。これにより、要素がまだロードされていない場合や、他の要素によって覆われている場合でも、エラーを回避できます。

https://playwright.dev/docs/locators

この設計思想の違いにより、`page.locator().click()` を使用することで、動作が安定します。要素がクリック可能になるまで自動的に待機するため、タイミングに起因するエラーを減少させ、コードはより堅牢になります。

改めて整理すると、公式ドキュメントでは、この仕組みを**Actionability Checks**[^actionability-checks]と呼んでいます。locatorは、クリック前に以下のチェックを自動的に行います。

- 要素がDOMに存在すること
- locatorが1つの要素だけにマッチすること
- 要素が表示されていること(Visible)
- 要素が安定していること(Stable) - アニメーションが完了しているか
- 要素がイベントを受け取れること(Receives Events) - 他の要素に覆われていないか
- 要素が有効であること(Enabled)
- 要素がビューポート内にスクロールされること

つまり、locatorは「要素を特定するだけの仕組み」ではなく、要素が操作可能になるまで待つ仕組みを備えています。これらのチェックがすべてパスしない限り、指定されたタイムアウト時間内で自動的にリトライを繰り返します。

ネットワークが不安定な環境では、この違いが現れます。`evaluate` ベースの実装では、要素の読み込みが遅れるとエラーになってしまいます。しかし `locator` なら、自動で待機してくれるため、テストの信頼性と保守性が大きく向上します。

https://playwright.dev/docs/actionability

## 具体例

ここでは実際に私が過去に使用していたアンチパターンと、公式ドキュメントで推奨されているパターンをいくつか紹介します。

### ナビゲーションの待機

`waitForNavigation()` は複数の処理が同時に実行された場合に、実行順序によって結果が変わってしまう「競合状態(レースコンディション)」が発生する可能性があるため、非推奨APIです。`waitForURL()` や `waitForSelector()` を使うことで、より明示的に「何を待つか」を表現できます。

```typescript
// NG
const navigationPromise = page.waitForNavigation();
await page.click('button');
await navigationPromise;

// OK
await page.click('button');
await page.waitForURL('**/next-page');
// または特定の要素を待機
await page.waitForSelector('#next-page-element');
```

### 要素の操作

ボタン操作やテキスト入力など、要素を操作する際には、`evaluate()` を使うのではなく、`locator` を使うことが推奨されています。

```typescript
// NG
await page.evaluate(() => {
  document.querySelector('button.submit').click();
});

// OK
await page.locator('button.submit').click();
```

公式が推奨している `locator` を使用する場合の優先度は以下の通りです。

```typescript
// 1. Role(役割)ベース (アクセシビリティに最適)
// スクリーンリーダーや支援技術でも認識できるため、最も堅牢
await page.getByRole('button', { name: 'Sign in' });

// 2. Label(ラベル)ベース (フォームに最適)
// ユーザーが見ている表示と一致するため、可読性が高い
await page.getByLabel('Email address');

// 3. Text(テキスト)ベース
// シンプルで直感的だが、表示テキストの変更に弱い
await page.getByText('Submit');

// 4. Test ID (テスト用ID)
// 表示に依存しないが、HTMLに専用属性が必要
await page.getByTestId('submit-button');

// 5. CSS/XPath (最終手段)
// 柔軟だが、HTML構造の変更に脆弱
await page.locator('.btn-primary');
```

## 公式ドキュメントを「隅々まで見る」価値

「動いているコードがあるなら、わざわざドキュメントを読み直す必要はない」。この判断は妥当です。しかし、偶然ドキュメントを読み直したことで、「動く」と「正しく動く」の間には大きな差があることに気づきました。
確かに `page.evaluate()` で実装したコードは動いていました。ところが、それは「たまたま成功していた」に過ぎません。要素の読み込みが遅れる環境や、ネットワークが不安定な状況では、エラーが発生していたでしょう。
一方、`locator` を使った実装は、こうした不確実性を自動で吸収してくれます。要素がクリック可能になるまで待機し、安定性を確保します。コードの見た目はほとんど変わりませんが、内部の設計思想は全く異なります。

公式ドキュメントには「なぜこの方法が推奨されるのか」という背景が書かれています。単なるAPIリファレンスではなく、設計思想やベストプラクティスが凝縮されています。ドキュメントを読むことは、ライブラリの作者が考えた「正しい使い方」を学ぶことです。

過去のコードを流用することは、開発スピードを維持するためには合理的な選択ですが、それは「過去の自分が正しく理解していた」という前提に立っています。ところが、ライブラリは進化し、ベストプラクティスも変化します。公式ドキュメントを読み直すことは、その変化に追いつくための最も確実な方法です。
もちろん、すべてのライブラリのドキュメントを隅々まで読む時間はありません。しかし、日常的に使っているツールや、プロジェクトの基盤となるライブラリについては、一度は腰を据えて読む価値があります。その投資は、将来的なトラブルを未然に防ぎ、より安定したコードを書くための基盤となります。

「動けばいい」という判断は間違っていません。しかし「正しく動く」ことを知った今、少し時間をかけてでも、公式ドキュメントを上から下まで読む価値があると私は考えます。

## まとめ

- 過去のコードを流用することは効率的で合理的な判断だが、「動く」と「正しく動く」の間には設計思想の違いがある
- `page.evaluate()` は動作するが、要素の操作可能性を確認しないため不安定なテストにつながる可能性がある
- `locator` は要素がクリック可能になるまで自動で待機し、Actionability Checks により安定性を向上させる
- `waitForNavigation()` は競合状態が発生する可能性があるため非推奨。`waitForURL()` や `waitForSelector()` を使うべき
- 公式ドキュメントには「なぜこの方法が推奨されるのか」という設計思想が書かれており、単なるAPIリファレンス以上の価値がある
- 日常的に使うツールについては、一度は腰を据えてドキュメントを読む価値がある

## 参考

- [Agents Skills - Claude Code](https://platform.claude.com/docs/ja/agents-and-tools/agent-skills/overview)
- [Actionability | Playwright](https://playwright.dev/docs/actionability)
- [Best Practices | Playwright](https://playwright.dev/docs/best-practices)
- [Evaluating JavaScript | Playwright](https://playwright.dev/docs/evaluating)
- [Locator | Playwright - evaluate](https://playwright.dev/docs/api/class-locator#locator-evaluate)
- [Locators | Playwright](https://playwright.dev/docs/locators)
- [Page | Playwright - waitForNavigation](https://playwright.dev/docs/api/class-page#page-wait-for-navigation)
- [Page | Playwright - waitForLoadState](https://playwright.dev/docs/api/class-page#page-wait-for-load-state)
- [やはり俺の青春ラブコメはまちがっている。 (ガガガ文庫)](https://www.amazon.co.jp/dp/B00A20SDQQ)


[^agents-skills]: Agent Skillsは、Claudeの機能を拡張するモジュール型の機能です。領域固有の専門知識を提供する再利用可能なリソースで、指示、メタデータ、オプションのリソース(スクリプト、テンプレート)をパッケージ化します。
[^ブラウザコンテキスト]: ブラウザの実行環境のこと。ページ上でJavaScriptを直接実行する際の文脈を指します。
[^actionability-checks]: Playwrightの公式ドキュメントで定義されている、要素が操作可能な状態にあるかを自動的に検証する仕組みです。これにより、手動での待機処理を書く必要がなくなります。
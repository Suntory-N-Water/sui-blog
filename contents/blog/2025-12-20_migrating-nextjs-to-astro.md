---
title: Next.js から Astro へ。拡張性を捨て、シンプルさを選んだ理由
slug: migrating-nextjs-to-astro
date: 2025-12-20
modified_time: 2025-12-20
description: ブログに「何でもできる」Next.jsは過剰スペックでした。新機能に追いつけず、Web標準APIとの相性に悩んだ末、SSGに特化したAstroへ移行しました。拡張性を捨て、「必要最小限」を選んだ技術選択の記録です。
icon: 🧐
icon_url: /icons/face_with_monocle_flat.svg
tags:
  - Astro
  - Next.js
  - Playwright
  - ブログ
diagram:
  - type: hero
    date: "2025-12-20"
    title: "Next.js から Astro へ。拡張性を捨て、シンプルさを選んだ理由"
    subtitle: "機能過多な「何でもできる」から、ブログに特化した「必要最小限」への技術的移行の記録"
  - type: transition
  - type: problem
    variant: simple
    icon: alertCircle
    title: "高機能ゆえの疲弊と乖離"
    introText: "かつては魔法のようだったNext.js。しかし進化の速さと複雑化により、個人ブログにはオーバースペックな課題が浮上しました。"
    cards:
      - icon: zapOff
        title: "追いつけない新機能"
        subtitle: "Server Actions / PPR"
        description: "次々と追加される独自機能。ブログ用途での必要性が見出せず、キャッチアップに疲弊。"
        isHighlight: false
      - icon: layers
        title: "Web標準との不和"
        subtitle: "View Transitions API"
        description: "Web標準APIを使いたくても、Reactの仮想DOMとの相性問題で素直に実装できないもどかしさ。"
        isHighlight: false
        accentColor: RED
      - icon: box
        title: "過剰なJSバンドル"
        subtitle: "SSGでも残るJS"
        description: "静的サイトにも関わらず大量のJSが配信される。SEOやパフォーマンス面での懸念。"
        isHighlight: false
  - type: timeline_process
    title: "重い腰を上げた決定打"
    introText: "「面倒くさい」という怠惰な気持ちを打ち砕いたのは、深刻なセキュリティインシデントの連鎖でした。"
    icon: shieldAlert
    events:
      - time: "以前から"
        title: "Astroへの憧れ"
        description: "移行したい思いはあったが、手間の多さから実行に移せず保留状態。"
        isHighlight: false
      - time: "2025/12/10"
        title: "RSC脆弱性発覚"
        description: "CVSSスコア10.0の致命的な脆弱性が公表される。即時対応が必要な緊急事態に。"
        isHighlight: true
        accentColor: RED
      - time: "2025/12/12"
        title: "追撃の脆弱性"
        description: "立て続けに新たな問題が発覚。アーキテクチャ自体への懸念が確信に変わる。"
        isHighlight: false
      - time: "決断"
        title: "Astroへの移行開始"
        description: "セキュリティ対応を契機に、ブログに最適な環境への移行を決意。"
        isHighlight: true
        accentColor: GOLD
  - type: core_message
    variant: highlight
    icon: scale
    title: "「何でもできる」から「必要最小限」へ"
    mainMessage: "ブログに必要なのは拡張性ではなく、Web標準に準拠したシンプルさでした。複雑なReactエコシステムを離れ、コンテンツ配信に特化したAstroを選択しました。"
    comparisons:
      - icon: layers
        title: "Next.js / React"
        text: "拡張性は高いが機能過多。Web標準APIとの統合に難あり。"
        isGood: false
      - icon: rocket
        title: "Astro"
        text: "SSG特化でJS最小限。Web標準技術を素直に扱える。"
        isGood: true
    coreHighlight:
      title: "Astroを選んだ理由"
      text: "Honoも候補の一つでWeb標準だが、JSX周りでReact依存の懸念あり。ブログ用途での実績と最適化でAstroを採用。"
      accentColor: GOLD
  - type: grouped_content
    title: "機能の移行検証と互換性"
    introText: "コア機能が移植できなければ意味がありません。調査の結果、ブログに必要な機能のほとんどが移行可能でした。"
    icon: checkCircle
    sectionBgColor: white
    groups:
      - title: "スムーズに移行可能"
        description: "既存の資産やライブラリをほぼそのまま流用できた機能群。"
        bgColor: muted
        cards:
          - title: "動的OGP生成"
            text: "satori + @resvg/resvg-jsの構成を流用可能。"
            isHighlight: false
          - title: "SSG / Markdown"
            text: "Astroデフォルト機能とimport.meta.globで完結。"
            isHighlight: true
            accentColor: GOLD
          - title: "Pagefind検索"
            text: "Astro Integrationがあり、むしろ統合が容易に。"
            isHighlight: false
  - type: grouped_content
    title: "直面した技術的壁と解決策"
    introText: "一筋縄ではいかない部分もありました。特にMermaid.jsによるバンドル肥大化と、CI/CD環境でのPlaywright動作には工夫が必要でした。"
    icon: hammer
    sectionBgColor: muted
    groups:
      - title: "Mermaidのバンドル肥大化"
        description: "標準プラグインでは全ページに巨大なJSが含まれてしまう問題。"
        bgColor: white
        isHighlight: true
        cards:
          - title: "問題: 500KB超"
            text: "markdown-content.jsだけで約500KBに膨れ上がる。"
            isHighlight: false
          - title: "解決: Playwright"
            text: "ビルド時にブラウザでSVG生成しHTMLに埋め込む。"
            isHighlight: true
            accentColor: GOLD
          - title: "成果: 劇的削減"
            text: "JSサイズを138KB削減し、モジュール数も激減。"
            isHighlight: false
      - title: "CI/CDとビルド時間の壁"
        description: "Vercel環境での動作不具合と、OGP生成の遅延対策。"
        bgColor: white
        cards:
          - title: "Vercel × Playwright"
            text: "依存関係で失敗するためGitHub Actionsへ移行。"
            isHighlight: false
          - title: "OGP生成の高速化"
            text: "自作KVSとR2で生成画像をキャッシュし再利用。"
            isHighlight: true
            accentColor: GOLD
  - type: steps
    title: "ビルドパイプラインの最適化"
    introText: "PlaywrightをCIで動かすための試行錯誤と、最終的なデプロイフローの確立。"
    steps:
      - number: 1
        title: "ブラウザのキャッシュ"
        text: "GitHub Actions上でPlaywrightのバイナリをキャッシュ。"
      - number: 2
        title: "プレビューデプロイ"
        text: "Vercel CLIでプレビュー環境へデプロイしURL取得。"
      - number: 3
        title: "PRへの通知"
        text: "GitHub CLIを使用し、PRにプレビューURLを自動コメント。"
      - number: 4
        title: "OGPキャッシュ活用"
        text: "自作バックエンドでOGPデータを永続化しビルド時間を短縮。"
  - type: action
    title: "技術選択のその先へ"
    mainText: "Next.jsを選んだ3年前も、Astroを選んだ今も、その時の自分にとっての「正解」でした。"
    actionStepsTitle: "これからの向き合い方"
    actionSteps:
      - title: "目的を見失わない"
        description: "技術の流行よりも「何を実現したいか」を優先する。"
      - title: "変化を恐れない"
        description: "数年後にはまた別のツールを使うかもしれない柔軟さを持つ。"
    pointText: "脆弱性はただのきっかけ。「本当に必要な機能は何か」を見つめ直し、自分の課題にとっての最善を選び続けましょう。"
    footerText: "技術の波を楽しみながら乗りこなそう"
    subFooterText: "sui Tech Blog"
    accentColor: GOLD
---
Next.js は Web アプリケーション開発の第一線で使われているフレームワークの 1 つです。
この業界で働き出した 3 年前、Web 開発のいろはも知らなかった私にとって、Next.js は魔法のようなフレームワークでした。当時から React が Web 開発でよいらしいということはわかっていたのですが、React はフロントエンドでの使用が主流だったため、サーバ部分、いわゆるバックエンドの選択が必須でした。

プロダクトによっては Rails, Django, SpringBoot などの他言語のフレームワークで作成されることがあります。Python で簡単な自動化しかやったことがない私にとって、1 個の Web アプリケーション開発をするのに他言語を使わないといけないのはハードルが高かったです。

調べているうちに Next.js がフロントエンドとバックエンドの境界をなくすことができることを知り、TypeScript で書くこともできることから、1 つの言語で Web 開発ができるのはとても魅力的でした。
開発のハードルも下げ、多数の便利機能が追加されていく中で、今後の開発もこれで良いと思っていました。しかし、何でもできることが重荷になるとは思いませんでした。

## なんだか追いつけなくなっていく
Next.js および Web 開発を学び始めた最初のころは、新しいことが濁流のように流れ込むため、すべてが新鮮な知識で楽しむことができました。次々と新しい革新的な技術に触れて「なんだかよく分からないけどすげぇ！」となっていました。

少しずつ分かるようになってきてから、新しい機能がどこで使うのかイメージがつきづらくなってきました。
Server Actions？これどう便利になるんだっけ？PPR(Partial Pre-Rendering)？どう使うんだ！？となったのを覚えています。
私が実務で Next.js を使っていたわけではないので、個人開発・学習目的の範疇にすぎません。次々と Next.js 独自の技術が出てくる一方で、「これ、今までのやり方でよくないか？」と感じたのを覚えています。

SSG のように明らかメリットが大きいものなら分かりますが、当時開発していた Web アプリケーションの実態に結び付けることができず、次第に追いつけないと感じていました。

とはいえ、気になる技術があれば試してみたくなるのがエンジニアです。
[View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)(ページ遷移時にぬるっと動くアニメーションを実現する Web 標準 API)が React でも実装されたと聞いて、さっそく試してみました。動くには動くんですが、「ブラウザバック」で動作をさせることができませんでした。

Web 標準であれば動くんですが、React は仮想 DOM の関係で Web 標準 API との統合がうまくいかないようです。結局、私の技術力では実現できず諦めてしまいました。

## 深刻な脆弱性の発覚

2025 年 12 月 10 日ごろ、React Server Components で重大な脆弱性が発見されました。この脆弱性は CVSS スコア 10.0(セキュリティ評価の最高危険度)であり、俗に言う社会問題レベルの脆弱性です。今すぐすべての作業を停止してでも対応しなければなりません。実際に IPA が公表している内容では、2025 年 12 月 13 日現在、日本国内でも被害が報告されています。

https://www.ipa.go.jp/security/security-alert/2025/alert20251209.html

私自身、趣味で公開しているサービスでもいくつか Next.js を使用しています。その中でも当然、今回脆弱性が発見されたバージョンを使用しており、対応が急務となりました。
いくらユーザーがほぼいないとしても、そこがセキュリティホールとなって踏み台にされるようなことは絶対にあってはなりません。

また、12 月 12 日ごろにも新たな脆弱性が発見されました。

https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components

立て続けに問題が起きていることから、React Server Components 自体のセキュリティ、そもそもフロントエンドとバックエンドを一体化するというアーキテクチャ自体に対して、やはり何かあるのではないかという懸念を個人的に感じました。

しかし、正直に言えば、脆弱性はきっかけに過ぎず、前から「Next.js から Astro に移行してみたいなー」というあこがれがありました。
ですが「面倒くさいからよいや」という怠惰な気持ちもあって、なかなか重い腰を上げられずにいましたが、脆弱性という緊急事態が重い腰を上げるキッカケになりました。

## 必要最小限という選択
そこで今回は自分のブログに Next.js が必要なのかを今一度考えさせられるきっかけになりました。

現在このブログは Next.js 16 で動いており、ページのほとんどは Static Site Generation、いわゆる SSG で静的ビルドしたものを配信しています。正直なところを言うと、機能はそれしかありません。このシステムはブログ機能がメインであるため、Next.js はかなりオーバースペックとなっています。拡張性が優れている一方、単純なブログ記事を配信するだけでは、その機能を持て余してしまいます。

また、ブログしか提供していないのに、Next.js のバンドルの関係上、大量の JavaScript が発生します。当然 SSG なのでそこまで量は多くないのですが、やはり実際の HTML をレンダリングして JavaScript を最小限にしたほうが、SEO やユーザーのパフォーマンス、UX などの面で有利です。

そして先ほど書いた View Transitions API のように、Web 標準の API を使うときに、React との親和性の問題でつまずくことが多かった点も気になっていました。React 特有の挙動により、Web 標準の機能を素直に使えないため、学習コストが高いと感じてしまったのも移行の原因の 1 つです。

今回その経緯もあった上で、Web フレームワークとして Astro を採用することにしました。SSG でブログを作成し、Web 標準の技術を極力取り入れて、そちらに特化しているフレームワークを使うのがベストだと思ったからです。

他に検討した候補としては Hono が挙げられます。Hono も Web 標準を謳っているため、実装しても良いかなと思いました。しかし、フロントエンドは [React に準拠したものを利用している](https://hono.dev/docs/guides/jsx)関係から、Next.js と似たような課題が発生する可能性がある懸念もありました。
また、View Transitions API 周りなどの実装がまだ十分ではないため、私のブログという用途に限って言えば、Astro が最適だろうという判断です。実際にベンチマークを見ても、JavaScript をほとんど配信しないブログのようなサービスでは Astro の数値が良く、今の私の課題に合っていると感じました。


ブログに限って言えば、やれることは限られているため「必要最小限でシンプル」というあえて拡張性を捨て MUST だけをとりにいく選択をしたのです。

## 移行する際の検証結果
コア機能が移植できないのは論外ですので、事前にある程度調査した結果、ほとんどの機能が移植可能と分かりました。

| 機能           | 移行可否      | 実装方法                         | 備考                             |
| ------------ | --------- | ---------------------------- | ------------------------------ |
| SSG          | 👍️ 移行可能  | Astroデフォルト                   | -                              |
| Markdown読み込み | 👍️ 移行可能  | `import.meta.glob`           | -                              |
| 動的OGP生成      | 👍️ 移行可能  | `satori` + `@resvg/resvg-js` | 既存コードほぼ流用可能                    |
| Pagefind検索   | 👍️ 移行可能  | Astro Integration            | むしろ統合しやすい                      |
| SVG直接埋め込み    | 👍️ 移行可能  | `import.meta.glob` + `?raw`  | -                              |
| リンクカードキャッシュ  | 🤔 追加実装必要 | プラグインがある(らしい)                | Next.jsでは `Server Actions` を利用 |

## 移行で躓いたこと

### ビルド時に画像処理ライブラリでエラーになる

`satori` + `@resvg/resvg-js` という OGP 画像処理用のライブラリを使用しているのですが、Vite でのビルド時に事前バンドルの対象外に設定し忘れており、ビルドが毎回コケてしまうという事象が発生しました。このあたりは Astro の設定というよりは、内部で使用されている Vite の設定になるのですが、Next.js とは若干異なる部分があり躓きました。
たとえば、Vite の最適化(Optimize)設定において、該当のライブラリを事前バンドルの対象外(exclude)に指定することで解決できました。
```ts astro.config.ts
optimizeDeps: {
  exclude: ['@resvg/resvg-js'],
},
```

### Mermaid ライブラリの影響でバンドルサイズが膨れ上がる
今回の Next.js から Astro への移植において一番困った点は、ブログ内で表示する Mermaid.js が重すぎて、バンドルサイズが巨大になってしまったことです。カスタムプラグインとして Mermaid を含めた際、バンドルをすべて含んでしまっているようでした(内部の細かい実装までは追えていません)。
Astro はアイランドアーキテクチャを採用しているにもかかわらず、JavaScript のコード量がかなり多くなってしまうという事象が発生しました。

実際のデータを見てみると、ビルド時に生成される実際の Markdown を表示する JavaScript ファイルが 495KB もありました。一般的には Mermaid を使用するページに対してのみ動的インポート(Dynamic Import)をして削減することも可能なのですが、一度でも使用した時はすべての JavaScript バンドルに含まれてしまうため、動的インポートもあまり意味をなしていませんでした。
他にも Mermaid でしか使用しないライブラリが多数バンドルに含まれていることも JavaScript が多くなってしまった理由の 1 つです。

解決策を見つけたときは、「これ、本当に動くのか…？」と半信半疑でした。その解決策とは、Playwright を使用した[rehype-mermaid](https://github.com/remcohaszing/rehype-mermaid)プラグインです。このプラグインは、クライアントサイドで Mermaid をレンダリングするのではなく、ビルド時に Playwright でブラウザを起動します。その中で Mermaid.js を実行して SVG を生成し、最後にそれを Markdown の中に埋め込むという手法をとっています。

正直この話を見たときは「嘘だよな？」と思ったのですが、調べてみた感じではこれが一番まともというか、実装が楽そうだったので採用しました。
その結果、実際の数値を見てみると `markdown-content.js` だけで 138.67 kB 削減、全体で 500kB 以上削減という極端な数字が出ました。これを見ると、Mermaid のライブラリに入っている JavaScript の量がいかに多かったかがわかります。

| 項目                  | 削減量 (gzip)    |
| ------------------- | ------------- |
| Markdown-content.js | -138.67 kB    |
| Mermaid関連チャンク全体     | -500+ kB      |
| 総モジュール数             | -1751 modules |

修正前(一部省略しています)
```bash
 building client (vite) 
20:25:28 [vite] ✓ 3568 modules transformed.
20:25:28 [vite] dist/_astro/clone.CGFecHOY.js                                                0.10 kB │ gzip:   0.11 kB
20:25:28 [vite] dist/_astro/channel.D-9a6z12.js                                              0.12 kB │ gzip:   0.13 kB
20:25:28 [vite] dist/_astro/client.SlIoTHO_.js                                             182.74 kB │ gzip:  57.60 kB
20:25:28 [vite] dist/_astro/katex.XbL3y5x-.js                                              265.42 kB │ gzip:  77.51 kB
20:25:28 [vite] dist/_astro/treemap-KMMF4GRG.BW_A3qz5.js                                   329.94 kB │ gzip:  80.28 kB
20:25:28 [vite] dist/_astro/cytoscape.esm.DtBltrT8.js                                      442.41 kB │ gzip: 141.91 kB
20:25:28 [vite] dist/_astro/markdown-content.MPw3XyOH.js                                   495.59 kB │ gzip: 139.84 kB
```

修正後(一部省略しています)
```bash
20:48:02 [vite] ✓ 1817 modules transformed.
20:48:02 [vite] dist/_astro/index.DJPt4get.js                                                0.13 kB │ gzip:  0.12 kB
20:48:02 [vite] dist/_astro/index.CgUNgRpm.js                                                0.20 kB │ gzip:  0.16 kB
20:48:02 [vite] dist/_astro/markdown-content.B7Eb7184.js                                     2.70 kB │ gzip:  1.17 kB
20:48:02 [vite] dist/_astro/self-assessment.BeQnHm3R.js                                      2.93 kB │ gzip:  1.29 kB
20:48:02 [vite] dist/_astro/index.4ifBoAec.js                                                3.89 kB │ gzip:  1.52 kB
20:48:02 [vite] dist/_astro/index.Da02gyCa.js                                                8.37 kB │ gzip:  3.28 kB
20:48:02 [vite] dist/_astro/lucide-icons.BjdKjkTe.js                                         9.27 kB │ gzip:  2.51 kB
20:48:02 [vite] dist/_astro/ClientRouter.astro_astro_type_script_index_0_lang.QW52Ox2j.js   15.33 kB │ gzip:  5.27 kB
20:48:02 [vite] dist/_astro/utils.CDN07tui.js                                               25.51 kB │ gzip:  8.18 kB
20:48:02 [vite] dist/_astro/Header.CUvrmZ-b.js                                              89.78 kB │ gzip: 30.75 kB
20:48:02 [vite] dist/_astro/client.SlIoTHO_.js                                             182.74 kB │ gzip: 57.60 kB
```

### Vercelのビルド環境でPlaywrightが動かない
しかし、ここでは新たな問題が発生します。それは Vercel などの CI/CD 環境では、Playwright のシステム依存関係のインストールが失敗して動かなかったことです。Playwright 内部で使うシステム依存関係が Vercel 環境とは相性が悪いため、どうしても GitHub Actions 上でビルドプロセスを実行する必要がありました。

そもそもの話として Playwright 自体が重いため、ビルド時間を改善するための対策が必要です。主な選択肢は 2 つあります。1 つ目は、GitHub Actions 上のランナーで Playwright 自体のブラウザとシステム依存関係だけをインストールしてキャッシュする方法です。もう 1 つは、[Playwright 公式](https://playwright.dev/docs/docker)が出している Docker コンテナ内でビルドしてデプロイを行う方法です。
両方試したところ、私の設定ミスだろうが、GitHub Actions 上でブラウザをキャッシュしてからビルドした方がビルド時間が早かったです。
```yml .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
  pull_request:

defaults:
  run:
    shell: bash

permissions: {}

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  deploy-preview:
    name: Deploy Preview
    if: github.ref != 'refs/heads/main'
    timeout-minutes: 20
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
      pull-requests: write
    steps:
      - uses: actions/checkout@8e8c483db84b4bee98b60c0593521ed34d9990e8 # v6.0.1
        with:
          persist-credentials: false

      - uses: ./.github/actions/setup

      - name: Get Playwright version
        id: playwright-version
        run: echo "version=$(node -p "require('./package.json').devDependencies.playwright || require('./package.json').dependencies.playwright" | tr -d '^~')" >> "$GITHUB_OUTPUT"

      - name: Cache Playwright browsers
        uses: actions/cache@9255dc7a253b0ccc959486e2bca901246202afeb # v5.0.1
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}
          restore-keys: |
            playwright-${{ runner.os }}-

      - name: Install Playwright browsers
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        run: bunx --bun playwright install --with-deps chromium

      - name: Install Playwright system dependencies
        if: steps.playwright-cache.outputs.cache-hit == 'true'
        run: bunx --bun playwright install-deps chromium

      - name: Pull Vercel Environment Information
        run: bunx vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Build Project Artifacts
        run: bunx vercel build --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Generate Pagefind Index
        run: bunx pagefind --site .vercel/output/static

      - name: Deploy to Vercel
        id: deploy
        run: |
          DEPLOYMENT_URL=$(bunx vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }} | tail -n 1)
          echo "url=$DEPLOYMENT_URL" >> "$GITHUB_OUTPUT"
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Comment Preview URL on PR
        if: github.event_name == 'pull_request'
        run: |
          gh pr comment ${{ github.event.pull_request.number }} --body "### Preview Deployment

          Preview URL: $DEPLOYMENT_URL"
        env:
          GH_TOKEN: ${{ github.token }}
          DEPLOYMENT_URL: ${{ steps.deploy.outputs.url }}

  deploy-production:
    name: Deploy Production
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    timeout-minutes: 20
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@8e8c483db84b4bee98b60c0593521ed34d9990e8 # v6.0.1
        with:
          persist-credentials: false

      - uses: ./.github/actions/setup

      - name: Get Playwright version
        id: playwright-version
        run: echo "version=$(node -p "require('./package.json').devDependencies.playwright || require('./package.json').dependencies.playwright" | tr -d '^~')" >> "$GITHUB_OUTPUT"

      - name: Cache Playwright browsers
        uses: actions/cache@9255dc7a253b0ccc959486e2bca901246202afeb # v5.0.1
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}
          restore-keys: |
            playwright-${{ runner.os }}-

      - name: Install Playwright browsers
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        run: bunx --bun playwright install --with-deps chromium

      - name: Install Playwright system dependencies
        if: steps.playwright-cache.outputs.cache-hit == 'true'
        run: bunx --bun playwright install-deps chromium

      - name: Pull Vercel Environment Information
        run: bunx vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Build Project Artifacts
        run: bunx vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Generate Pagefind Index
        run: bunx pagefind --site .vercel/output/static

      - name: Deploy to Vercel
        run: bunx vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

もう 1 つ、この方法を選択した大きな理由として、GitHub Actions 上のランナーであれば `gh` コマンド(GitHub CLI)が標準搭載されている点が挙げられます。
Microsoft 公式の Playwright コンテナを使うと、当然ながら `gh` コマンドが設定されていません。
Vercel の GitHub 連携でビルドができない関係上、開発体験を良くするためにも、プレビューデプロイが終わったら PR にプレビューURL を載せたいと考えました。そのためデプロイが終わったあとに、Vercel のプレビューURL をPull Requestに通知します。GitHub API を直接たたくという作業が必要になってしまいます。
このあたりの CI/CD 周りでの Playwright 活用はニッチですが、公式ドキュメントや実際にやっている人がいたので参考になりました。ただ、どうしてもシステム依存の部分をキャッシュしきれないので、ここは今後の課題になるかなと思っています。

### ビルド時間の増加
Next.js を使っていたときは以下のようなコードで、ビルド時にリンクカード作成のためにページへリクエストを送信し、キャッシュを行っていました。
```ts src/actions/fetch-og-metadata.ts
'use server';

import { cache } from 'react';

type OGData = {
  title: string;
  description: string;
  image: string;
  url: string;
};

/**
 * OGP画像のURLを絶対URLに変換する
 */
function resolveImageUrl({
  imageUrl,
  baseUrl,
}: {
  imageUrl: string | undefined;
  baseUrl: string;
}): string {
  if (!imageUrl) {
    return '';
  }

  // 絶対URLかどうかを判定
  const isAbsoluteUrl = /^https?:\/\//i.test(imageUrl);
  if (isAbsoluteUrl) {
    return imageUrl;
  }

  // 相対URLの場合は元のURLのoriginを基準に絶対URLに変換
  const base = new URL(baseUrl);
  const absoluteUrl = new URL(imageUrl, base.origin);
  return absoluteUrl.href;
}

/**
 * URLからOGP(Open Graph Protocol)データを取得する
 */
async function getOGDataImpl(url: string): Promise<Partial<OGData>> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'bot',
      },
    });

    const html = await response.text();

    const getMetaContent = (property: string): string | undefined => {
      const regex = new RegExp(
        `<meta[^>]+(?:property|name)="${property}"[^>]+content="([^"]+)"`,
        'i',
      );
      return regex.exec(html)?.[1];
    };

    const titleMatch = /<title>(.*?)<\/title>/i.exec(html);

    return {
      title: getMetaContent('og:title') || titleMatch?.[1] || '',
      description:
        getMetaContent('og:description') || getMetaContent('description') || '',
      image: resolveImageUrl({
        imageUrl: getMetaContent('og:image'),
        baseUrl: url,
      }),
      url,
    };
  } catch (error) {
    console.error('Error fetching OG data:', error);
    return { url };
  }
}

export const getOGData = cache(getOGDataImpl);
```

主にビルド時に時間がかかっているのが、ブログ内の OGP 画像のリンクカードを表示するためのデータフェッチです。ここを改善できないかと考えたところ、自作の KVS と画像配信用のバックエンドサーバを立てることで、ビルド時間を 1 分ほど短縮することに成功しました。
たとえば以下のフローでキャッシュ→画像保存→配信を行っています。
1. リンクカードに表示する URL をキャッシュキーとしてハッシュ化してリクエスト
	- キャッシュがあればそこに登録された情報を使う
2. なければ OG 画像、タイトル、説明などを取得
3. OG 画像を R2 に保存
4. KV にタイトル、説明、URL、R2 に保存した OG 画像の URL、をハッシュした URL キーで登録

この実装を行うことで、一度ビルドを行えば、あとはキャッシュから meta 情報を取得できます。そのため、サイトごとに動作が不安定でも、安定したビルド時間を担保できました。

## まだ試せていないもの
このブログでは検索機能として pagefind を利用しています。Astro は pagefind がネイティブサポートとなっていますが、CSS やレイアウトの部分で苦戦することが多かったので、Next.js で使用していた実装をそのまま移植しています。

また、Markdown 部分の最適化ができていない状態です。現在ブログ記事の読み込みはビルド時に行ったあと、コードブロックをクリップボードへ保存するためのボタンなどを入れている関係で、すべてがクライアントコンポーネント扱いになっています。
理想は、アイランドアーキテクチャの思想どおり、全体のうちその箇所だけに JavaScript が適用されるような実装にすることです。
## おわりに

3 年前、Next.js を選んだのは正解でした。今の私にとって、Astro を選ぶのも良い選択だと思っています。
技術は日進月歩で進化しています。数ヵ月後、数年後に私は、また別のフレームワークを使っているだろうが、それはそれでよいと思っています。

今回のセキュリティインシデントは、そんな技術選択についてあらためて考える機会になりました。「本当に必要な機能は何か」を見つめ直すきっかけです。
今後も自分の課題に向き合って、そのときどきで最善の選択をしていきたいですね！
以上になります！

## 参考

https://blog.eno1220.dev/posts/pagefind-astro

https://techblog.roxx.co.jp/entry/2025/11/27/123135

https://zenn.dev/0fuzimaru0/articles/395467a73cb045

https://nextjs.org/blog/security-update-2025-12-11

https://github.com/gladevise/remark-link-card

https://github.com/okaryo/remark-link-card-plus
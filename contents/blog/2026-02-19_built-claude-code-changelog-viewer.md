---
title: Claude Codeの変更履歴を自動で日本語解説するサイトを作った
slug: built-claude-code-changelog-viewer
date: 2026-02-19
description: Claude Codeは更新頻度が高く、英語のCHANGELOGを毎回追うのは大変です。日本語で自動解説してくれるサービスが見当たらなかったので、Gemini APIとGitHub Actionsで更新処理を自動化したWebサイトを作りました。
icon: 📰
icon_url: /icons/newspaper_flat.svg
tags:
  - AI
  - ClaudeCode
  - Astro
selfAssessment:
  quizzes:
    - question: "このサイトでは、CHANGELOGの各変更項目をどのような形式で解説していますか？"
      answers:
        - text: "変更内容の日本語訳のみ"
          correct: false
          explanation: "日本語訳だけでなく、変更前後の状況と恩恵まで推論して表示するのがこのサイトの特徴です。"
        - text: "変更の重要度をS/A/B/Cでランク付け"
          correct: false
          explanation: null
        - text: "変更前 / 変更後 / 恩恵の3点セット"
          correct: true
          explanation: "記事では「変更前はどうだったか」「変更後にどうなったか」「ユーザーにとっての恩恵は何か」の3点セットで表示すると説明されています。"
        - text: "変更内容と関連する公式ドキュメントへのリンク一覧"
          correct: false
          explanation: null
    - question: "関連する公式ドキュメントが見つからない変更項目に対して、このサイトはどのように対応していますか？"
      answers:
        - text: "AI推論は行わず、日本語訳だけを表示する"
          correct: true
          explanation: "ハルシネーション抑制のため、関連ドキュメントがない場合は推論を行わず日本語訳のみを表示すると記事で説明されています。"
        - text: "AIが独自に推論して「変更前/変更後/恩恵」を生成する"
          correct: false
          explanation: "関連ドキュメントなしでの推論はハルシネーションのリスクがあるため、あえて行わない設計です。"
        - text: "該当の変更項目をスキップして表示しない"
          correct: false
          explanation: null
        - text: "Web検索で関連情報を取得してから推論する"
          correct: false
          explanation: null
    - question: "Gemini APIの無料枠のレート制限に対して、どのような対策を行っていますか？"
      answers:
        - text: "フォールバック先のモデルを複数用意し、429エラー時に切り替える"
          correct: true
          explanation: "メインのモデルがレート制限に達したら次のモデルに切り替え、それもダメならさらに次へという構成にしています。加えてthinkingの無効化でトークン消費も抑えています。"
        - text: "リクエストを一定間隔で送信するレートリミッターを実装する"
          correct: false
          explanation: null
        - text: "有料枠にアップグレードして制限を回避する"
          correct: false
          explanation: null
        - text: "変更項目をキャッシュして同じリクエストを送らないようにする"
          correct: false
          explanation: null
diagram:
  - type: hero
    date: "2026/02/19"
    title: "Claude Code Changelog Viewer"
    subtitle: "更新頻度が高すぎるClaude Codeの変更履歴を、AIが「自分への恩恵」として翻訳・要約するサイトを作りました。"
  - type: problem
    variant: highlight
    icon: alertCircle
    title: "更新頻度が高すぎて追いきれない"
    introText: "2026年1月だけで23回のリリース。毎回英語のCHANGELOGを読んで「自分に関係あるか」判断するのは重労働です。"
    cards:
      - icon: activity
        title: "圧倒的な更新頻度"
        subtitle: "月間20回以上のリリース"
        description: "日々追加される機能や修正。全てに目を通すのは時間がかかりすぎる。"
      - icon: languages
        title: "英語と専門用語の壁"
        subtitle: "直感的に理解しづらい"
        description: "1行の英語記述だけでは、具体的な変更内容や影響範囲がイメージしにくい。"
        isHighlight: true
        accentColor: RED
      - icon: frown
        title: "費用対効果の悪さ"
        subtitle: "徒労に終わる確認作業"
        description: "苦労して読んでも、自分には関係のないマイナーな修正だった時の徒労感。"
  - type: transition
  - type: core_message
    variant: highlight
    icon: sparkles
    title: "「自分への恩恵」を3点セットで"
    mainMessage: "AIが公式情報を解析し、「変更前」「変更後」「恩恵」の3項目で解説。自分に関係あるアップデートか一瞬で判断できます。"
    comparisons:
      - icon: fileText
        title: "従来のCHANGELOG"
        text: "「機能Xを追加しました」という事実のみの記述。文脈が不明。"
        isGood: false
      - icon: zap
        title: "本ツールの解説"
        text: "「作業がどう楽になるか」という恩恵までAIが推論して提示。"
        isGood: true
    coreHighlight:
      title: "関連ドキュメントも自動検索"
      text: "ハルシネーション抑制のため、公式ドキュメントを検索・参照した上で推論を実行。"
      accentColor: GOLD
  - type: transition
  - type: timeline_process
    title: "完全自動化されたパイプライン"
    introText: "GitHub ActionsとGemini APIを組み合わせ、毎時自動で最新情報を取得・配信します。"
    icon: bot
    events:
      - time: "Phase 1"
        title: "更新検知と解析"
        description: "GitHub APIでCHANGELOGを取得し、新バージョンを検知。ハッシュ比較で冪等性を担保。"
      - time: "Phase 2"
        title: "ドキュメント検索"
        description: "変更内容に関連する公式ドキュメントをローカル検索し、AIへのコンテキストとして付与。"
      - time: "Phase 3"
        title: "AI推論・翻訳"
        description: "Gemini APIが「変更前/後/恩恵」を推論。Thinking無効化などでコストと制限を管理。"
        isHighlight: true
        accentColor: GOLD
      - time: "Phase 4"
        title: "デプロイ"
        description: "解析結果を静的サイトとしてビルドし、Cloudflare Workersへ自動デプロイ。"
  - type: action
    title: "最新情報をスマートに追跡"
    mainText: "もう英語のCHANGELOGと格闘する必要はありません。必要な情報だけを効率的にキャッチアップしましょう。"
    actionStepsTitle: "Check it out"
    actionSteps:
      - title: "Webサイトを見る"
        description: "最新のClaude Codeアップデート情報を日本語でチェック。"
      - title: "GitHubを見る"
        description: "自動化の仕組みやソースコードを確認し、スターを押す。"
    pointText: "開発者の「知りたい」に直結する情報を、自動でお届けします。"
    footerText: "技術の進化を、もっと楽に追いかけよう"
    subFooterText: "sui Tech Blog"
    accentColor: GOLD
---

私は毎日のようにClaude Codeを使っています。使い倒しているからこそ、アップデートの内容は気になります。新機能が追加されれば自分が開発しているサービスで効率よく実装するためにも取り入れたいですし、気になるバグ修正があれば「あの挙動、直ったのかな？」と確認したくなります。
ただ、Claude Codeの更新頻度はかなり高いです。2026年1月だけで23回のリリースがありました。そのたびに英語のCHANGELOG[^changelog]を開いて、項目を1つずつ読んで、「これは自分に関係あるかな？」と判断しなければなりません。いくら興味があるとはいえ、毎回やるのはしんどいです。

でも、CHANGELOGを全部追わなくても実務は回ります。大きな改修(たとえばスキルの導入など)があれば自分からキャッチアップしなくても自然と情報が入ってきますし、情報が出回った後に必要な部分だけ確認すれば十分です。わざわざ毎回CHANGELOGを確認するのは、割に合わないと思う人のほうが多いでしょう。私もそう思います。

1つだけ気になっていたことがありました。CHANGELOGの各項目に「それによって自分の作業がどう変わるのか？」が書かれていたら、追う価値があるかを一瞬で判断できます。

そんなサービスを探してみましたが、見当たりませんでした。
ということで作りました。

## Claude Code Changelog Viewer

サイトはこちらです。

https://claude-code-changelog-viewer.ayasnppk00.workers.dev/

![Claude Codeのアップデートで「変更前/変更後/恩恵」が表示されている](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/7718a01d6b131c07f8464c39f7bed383.png)

GitHubリポジトリも公開しています。

https://github.com/Suntory-N-Water/claude-code-changelog-viewer

やっていることはシンプルで、Claude Codeの公式CHANGELOGを自動で取得して、AIが日本語に翻訳し、各変更がユーザーにとってどんな恩恵があるかを解説するサイトです。
GitHub Actionsで毎時実行されるので、新しいバージョンがリリースされれば自動的に反映されます。私が手動で何かする必要はありません。

## 「変更前 / 変更後 / 恩恵」で伝える

CHANGELOGの項目は、「Added support for X」「Fixed Y when Z」のような1行の記述が並んでいるだけです。開発者向けの記録としては十分ですが、「それで自分の作業がどう変わるのか」がぱっと見ではわかりにくいと感じます。

そこで、このサイトでは各変更を「変更前はどうだったか」「変更後にどうなったか」「ユーザーにとっての恩恵は何か」の3点セットで表示するようにしました。

たとえば v2.1.41 の改修であった「**Added `claude auth login`, `claude auth status`, and `claude auth logout` CLI subcommands**」というCHANGELOGの項目を考えてみます。
これだけだと「認証関連のCLIコマンドが追加された」としかわかりません。
ですがこのように説明されれば、自分に関係あるかどうかがすぐにわかります。

- 変更前は認証状態の確認やログアウト操作を、明確なCLIサブコマンドを通じて直接実行する手段が限られていた。
- 変更後は `claude auth login/status/logout` コマンドにより、ターミナルから直接、現在の認証状況の確認やアカウントの切り替えが可能になった。
- これにより、複数の環境やアカウントを使い分ける際、現在のログイン状態をすばやく把握し、安全に認証管理を行えるようになった。

この推論にはGemini APIを使っています。CHANGELOGの各項目に対して、関連する公式ドキュメントの記述を検索して添えた上で、AIに「変更前/変更後/恩恵」を推論させるしくみです。
一部の改修では関連ドキュメントがない場合があります。AIのハルシネーションを抑えるためにも、そういった場合には推論は行わず、日本語訳だけを表示するようにしています。

## 開発で工夫したこと

最初は、CHANGELOGの変更項目を1つずつGemini APIにリクエストしていました。でも、項目が多いと一瞬でリクエストが集中してしまいます。そこで、1回のリクエストですべての推論・翻訳・サマリーをまとめて処理する方式に変えました。

また、Gemini APIを選んだのは、無料で使えて性能がよく、セットアップが楽だったからです。
ただ、無料枠にはレート制限があります。Gemini APIの無料枠は1分あたり4リクエストに制限されているため、複数バージョンが同時に検出された場合や、リトライが発生した場合はすぐ上限に達してしまいます。そこで、フォールバック先のモデルを複数用意しました。メインのモデルが429エラー(レート制限)を返したら次のモデルに切り替え、それもダメならさらに次へ、という構成です。加えて、Geminiの思考トークン(thinking)を無効化することで、トークン消費を抑えています。
無料で安定運用するには、APIをただたたくだけでは足りず、制限の中でやりくりするしくみが必要でした。

詳細なソースコードはこちらを確認してください。

https://github.com/Suntory-N-Water/claude-code-changelog-viewer/blob/main/apps/changelog-fetcher/src/ai/gemini-client.ts


## 自動化のパイプライン

1. GitHub APIからCHANGELOG.mdを取得してバージョンごとに分割する
2. 各項目をパース[^parse]して、キーワードを抽出する
3. 抽出したキーワードでローカルに保存された公式ドキュメントを検索して、関連する記述をスニペット[^snippet]として取得する
4. 関連ドキュメント付きでGemini APIに投げて、日本語翻訳と「変更前/変更後/恩恵」を推論させる
5. 推論結果をAstroの `content/` 配下にシンボリックリンクとして保存する
6. 処理終了後、自動で `git push` を行い、Astroの静的サイトとしてビルドして、Cloudflare Workers[^cloudflare-workers]にデプロイする

これがGitHub Actions[^github-actions]で毎時実行されます。新しいバージョンが検出されなければ何もしないので、無駄な実行コストは発生しません。
また、バージョンごとの内容をSHA256でハッシュ化して前回の値と比較し、本当に中身が変わった場合だけ再処理する冪等性[^idempotent]を担保しています。CHANGELOGは過去のバージョンの記述が後から修正されることもあるので、「新バージョンかどうか」だけでなく「内容が変わったかどうか」で判断する必要がありました。
プロジェクトはpnpmワークスペースによるモノレポ[^monorepo]構成で、フロントエンド(Astro)・CHANGELOG解析・ドキュメント追跡の3つのアプリケーションに分かれています。
気になる人はGitHubリポジトリを見てみてください！

## まとめ

- Claude Codeは更新頻度が高く、英語のCHANGELOGを毎回追うのは現実的ではない
- 自動で日本語かつわかりやすく変更内容を紹介するサービスが見当たらなかったので作った
- 「変更前/変更後/恩恵」の3点セットで表示することで、各変更が自分に関係あるかをすばやく判断できるようにした
- GitHub Actionsで毎時実行する自動化パイプラインにより、運用の手間はほぼかからない

## 参考

https://github.com/anthropics/claude-code

[^changelog]: ソフトウェアの変更履歴をまとめたファイル。バージョンごとに追加機能・修正内容などが記録されている。
[^parse]: テキストデータを解析して、プログラムが扱いやすい構造に変換すること。ここではCHANGELOGの文章を項目ごとに分解する処理を指す。
[^snippet]: テキストやコードの短い抜粋のこと。ここでは公式ドキュメントから関連する部分だけを抜き出したものを指す。
[^cloudflare-workers]: Cloudflareが提供するサーバレス実行環境。Webサイトを世界中のエッジサーバから高速に配信できる。
[^github-actions]: GitHubが提供するCI/CD自動化サービス。cronスケジュールで定期実行も可能。
[^monorepo]: 複数のアプリケーションやライブラリを1つのリポジトリで管理する構成のこと。pnpmワークスペースは、この構成を効率的に管理するためのpnpmの機能。
[^idempotent]: 同じ操作を何度実行しても結果が変わらない性質のこと。ここでは、同じバージョンのCHANGELOGを何度処理しても同じ出力が得られることを指す。

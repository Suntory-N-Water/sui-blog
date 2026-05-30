---
title: "あいまいな記憶を手がかりに過去のメモを引き出す semantic search を Cloudflare Vectorize で作った"
slug: obsidian-semantic-search-cloudflare-vectorize
date: 2026-05-31
modified_time: 2026-05-31
description: "キーワードで思い出せない記憶を手がかりに過去のメモを引き出したくて、Obsidian のデータを Cloudflare Vectorize でベクトル化し Claude Code から semantic search できるしくみを作りました。"
icon: 🫧
icon_url: /icons/bubbles_flat.svg
tags:
  - CloudflareWorkers
  - Obsidian
selfAssessment:
  quizzes:
    - question: "この記事で、キーワード検索が「あいまいな記憶」に対応できない理由は何ですか？"
      answers:
        - text: "思い出せている言葉しか検索できないから"
          correct: true
          explanation: "キーワード検索は入力した単語と一致するものしか見つけられません。「滋賀も行ってみたい」とメモしていても、「旅行」で検索しても引っかからないのはそのためです。"
        - text: "Obsidian の検索機能が未完成だから"
          correct: false
          explanation: null
        - text: "メモの数が多すぎて検索が遅くなるから"
          correct: false
          explanation: null
        - text: "フォルダやタグの整理が不十分だから"
          correct: false
          explanation: "フォルダやタグで整理しても、そのフォルダ・タグを付けていないメモは見つかりません。問題は整理の精度ではなく、検索の仕組み自体にあります。"
    - question: "このしくみでは、何を単位として Vectorize にベクトル化して保存していますか？"
      answers:
        - text: "個々のメモ1件ずつ"
          correct: false
          explanation: null
        - text: "週次振り返りのまとめ"
          correct: false
          explanation: null
        - text: "デイリーレポート"
          correct: true
          explanation: "Thino・LINE のメモと気になった記事の見出しを毎日まとめたデイリーレポートを単位にしています。これにより当時の関心領域も一緒に保存されます。"
        - text: "Obsidian のフォルダ単位"
          correct: false
          explanation: null
    - question: "著者が「気になったとき」だけ使う設計に行き着いた理由として、最も適切なものはどれですか？"
      answers:
        - text: "固まったフォーマットで記録を続けることが自分には続かないと分かったから"
          correct: true
          explanation: "週次振り返りを2年続けた結果、振り返りではなく形式を維持することが目的になっていました。スケジュール駆動より衝動駆動の方が自分の性格に合っていると気づいたことが出発点です。"
        - text: "Cloudflare の無料枠に週次バッチの制限があるから"
          correct: false
          explanation: null
        - text: "週次振り返りは技術的に自動化が難しいから"
          correct: false
          explanation: null
        - text: "Obsidian がスケジュール通知機能を持っていないから"
          correct: false
          explanation: null
---

あいまいな記憶を手がかりに過去のメモを引き出したいとき、キーワード検索では対応できないことがあります。たとえば、旅行の候補をどこかにメモしていた記憶はあるのに、具体的な地名が思い出せないとき、「旅行」でメモを検索しても旅行という単語が入っているメモしか出てきません。「滋賀も行ってみたい」とメモした記録は、旅行フォルダにも旅行タグにも入っていないので、検索には引っかかりません。

こういうキーワード検索の限界を解消するために、Obsidian のメモを [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/) でベクトル化し、Claude Code から API 経由で意味検索できるしくみを作りました。

## 週次振り返りを2年続けて気付いたこと

定期的にメモを振り返ればよい、と思って試みたこともあります。

スプレッドシートと Notion を使って、その週の出来事や学びを毎週末に記録する習慣を 2 年ほど続けました。最初のうちは機能していました。1週間を整理して次の週に向ける、というリズムが作れていた気がします。でも半年、1年と経つうちに、振り返りの目的が少しずつズレていきました。

週末になると「今週の振り返りをやらないと」と思うようになりました。Notion のテンプレートを開いて、決まった項目を埋めて、保存して完了です。振り返りを「している」のではなく、「こなしている」という感覚に変わっていきました。

ある週末、振り返りをやめることにしました。

しばらく経ってから気付いたのは、問題が「振り返りをしていたこと」ではなく、「振り返りをするために記録していたこと」だったということです。いつの間にか、記録することが目的になっていました。振り返りは手段のはずなのに、週次の記録という形式を維持することが目的に変わっていたのだと思います。

## 「気になったとき」だけ使えるしくみへ

もともと私は、思いつきや突拍子もないことにワクワクを見出してしまう性格です。固まったフォーマットで記録を続けることがどうしても続かないと分かった以上、振り返りのやり方を変える必要がありました。

行き着いたのが「振り返りのタイミングを決めない」という設計です。旅行先を考えていて過去のメモが気になったとき、技術調査をしていて以前似たことを調べた気がするとき、そういう「気になった瞬間」に検索するようにしています。

## 最小構成で作ったしくみ

私は普段から Obsidian を使って日々の記録や気になったことをまとめています。Markdown ファイルで管理できるので、GitHub との連携が簡単です。この Obsidian のデータをベクトル化して API で検索できるようにしました。

全体の流れはシンプルです。Obsidian でメモを書き、GitHub に同期し、[Cloudflare Workers](https://developers.cloudflare.com/workers/) でベクトル化して Vectorize に保存し、Claude Code から API として呼び出します。

日々のメモは 2 つの経路で Obsidian に入ってきます。1つは [Thino](https://github.com/Quorafind/Obsidian-Thino) というプラグインで、Twitter のような投稿形式でその場に思いついたことを書けます。もう1つは LINE からの同期で、外出中に思いついたことを LINE で自分宛てに送ると、自動で Obsidian に記録されます。

これらのメモは毎日デイリーレポートとしてまとめられます。Thino のメモや LINE のメモに加えて、ネットで気になった記事を Obsidian に保存した際の見出しも集約されます。この設計では、「5月10日には DevOps 関連の記事を読んでいた」という当時の関心領域を後から確認できます。このデイリーレポートを単位として Vectorize にベクトル化して保存しています。

Claude Code からの検索は、Cloudflare Workers 上に API を作成し、最低限の認証をかけた状態で呼び出す形にしました。「旅行でどこか検討してたっけ」と入力すると、意味的に近いメモのブロックが生データで返ってきます。キーワードではなく意味で検索するので、「旅行」という単語が入っていないメモでも、旅行に関連する文脈のものが引っかかります。

## やってみて

実際に使ってみると、モヤモヤが発見に変わる体験があります。たとえば、次の旅行先を考えていて、過去の自分はどこか候補を考えていたかなと思って検索すると、「村上(新潟県)」や「滋賀」という候補が出てきます。「旅行」という単語で検索しても出てこなかった記録が、意味の近さで引っかかってきます。週次振り返りをしていたときには、こういう体験はありませんでした。

「なんかあったよな」というぼんやりした感覚を手がかりに、過去のメモを引き出せます。そのたびにモヤモヤが消えてすっきりするから、このしくみを使い続けています。

## まとめ

- キーワード検索は思い出せている言葉しか検索できない。あいまいな記憶を手がかりに過去を引き出すには、意味ベースの検索が向いている
- スケジュールに縛られた週次振り返りは続かなかった。「気になったとき」だけ使えるしくみの方が自分には合っていた
- Obsidian + GitHub + Cloudflare Workers + Vectorize の組み合わせで、個人規模の semantic search[^semantic-search] 基盤を実質コストゼロで作れる
- 事実の検索と解釈を分離する設計にしておくと、Worker 側の実装がシンプルになり、解釈は Claude Code に任せられる

## 参考

https://developers.cloudflare.com/vectorize/

https://developers.cloudflare.com/workers/

https://obsidian.md/

https://github.com/Quorafind/Obsidian-Thino

[^semantic-search]: キーワードの完全一致ではなく、文章の意味や文脈の近さで検索するしくみ。「旅行」という単語が含まれていなくても、旅行に関連する文脈のメモを引き出せる。

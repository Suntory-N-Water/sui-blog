---
title: Plan Mode でしていた実装前の確認を、指示のテンプレートとテストに移した
slug: claude-code-without-plan-mode
date: 2026-09-28
modified_time: 2026-09-28
description: Claude Code の Plan Mode の廃止案が出ましたが、私は 2026 年 9 月に Plan Mode を 1 回も使っていません。実装前の確認は、5 項目の指示のテンプレート、AI 自身のレビュー、スキルとテストで行っています。今の手順と、Plan Mode に残してほしい役割を紹介します。
icon: 🦺
icon_url: /icons/safety_vest_flat.svg
tags:
  - ClaudeCode
  - AI
---

2026 年 9 月の私の Claude Code の利用記録では、Plan Mode[^plan-mode] を実行した記録は 0 件でした[^stats]。同じ月に、Claude Code の開発者が Plan Mode の廃止を検討していると投稿しました。

実装前の確認は続けており、Plan Mode を使う代わりに、指示の書き方、AI 自身によるレビュー、スキルとテストで行っています。この記事では、今の手順と、それでも Plan Mode に残してほしい役割を紹介します。

## Plan Mode の廃止案と現在の方針

廃止案を出したのは、Anthropic で Claude Code を担当している Thariq 氏です。2026 年 9 月 23 日の投稿で、次のように書いています。

> we're thinking of killing plan mode and using the shift+tab hotkey to adjust effort levels
>
> I don't think the models need plan mode anymore, but if you're a plan mode diehard would love to get your feedback on why

https://x.com/trq212/status/2102813194196758746

翌日の 9 月 24 日には、この投稿への返信を受けて方針を変えています。

> lots feedback here, many of you are planning yourself & don't need plan mode
>
> others prefer the UX of entering a mode where Claude is just thinking & brainstorming with you
>
> my plan is to:
> - make plan mode into a built-in mod
> - allow mods to add new modes or override shift+tab

https://x.com/trq212/status/2103212051065921632

Plan Mode は廃止ではなく、Claude Mods[^claude-mods] の組み込みの mod として残す方針になりました。2026 年 9 月 28 日時点の最新版 2.1.283 の [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) には、Plan Mode を mod にしたという記載はまだありません。

私は、2 件目の投稿にある「many of you are planning yourself」に当てはまります。Plan Mode を使わずに、Claude と計画を立てています。

## 実装前に確認させる項目

Plan Mode がしていたことは、Claude にファイルを編集させず、実装の前に一度止めることです。何を確かめてから実装に進むかまでは、Plan Mode は決めてくれません。そこで私は、実装に進む前に確かめる内容を、指示のテンプレートとして先に決めています。

私が使っているテンプレートは、次の 5 項目です。

```md
# 目的(なにをやってほしいのか)
# 範囲(どこまで対応してよいか)
# 進め方(どの順番で判断・実行してほしいか)
# 制約(守ってほしいルール・やってはいけないこと)
# 完了条件(なにを確認したら完了とするか)
```

最初からこのテンプレートで指示を書くこともありますが、5 項目をすべて自分で埋めるのは手間がかかり、書ききれないことが多いです。そのため今は、先に Claude と計画を立て、その計画をもとに、実装を担当する別の AI への指示を 5 項目のテンプレートで Claude に書かせています。計画ができた時点で作業の順番や範囲は決まっているので、進め方や完了条件も Claude が埋められます。

5 項目がそろっていれば、実装を担当する AI がどこまで変更してよいかと、何を確認したら作業を終えるかが、実装の前に決まります。

## 確認を AI のレビューとテストに任せる

実装前の確認のうち、人が読んで判断していた部分も減りました。減った理由は 4 つあります。

1 つ目は、AI 自身にレビューさせていることです。プロジェクトに用意したスキル[^skill]やサブエージェント[^subagent]を使って Claude に調査させたあと、その調査結果と計画を Claude 自身にもレビューさせます。

2 つ目は、学習データに少ない領域を、スキルとドキュメントで補ったことです。[2026 年 6 月の記事](/blog/claude-code-hooks-plan-readability)では、社内フレームワークのように学習データに十分含まれていない領域では、プランを人がレビューした方がよいと書きました。今は、その社内フレームワーク専用のスキルを作り、該当する作業ではそのスキルを読むように指示しています。ディレクトリ構成とドキュメントも、エージェントが探しやすい形に整えました。そのため、人がプランを読んで実装方針の誤りを見つける場面は、6 月と比べて少なくなっています。

3 つ目は、テストです。テストを書いたプロジェクトでは、Claude が誤った修正をしても、テストを実行した時点でテストが失敗し、誤りが分かります。変更の影響がテストの結果で分かるので、実装の前に人が影響範囲を読み切る必要が小さくなりました。

4 つ目は、モデルの性能です。6 月からの数か月でモデルの性能が上がったと、私は感じています。どの要因がどれだけ影響したかは分けて測っていません。4 つが重なった結果、Plan Mode で Claude の作業を実装の前に止める必要を感じなくなったと考えています。

## 許可確認が解消されても Plan Mode に戻らない理由

私が Plan Mode から離れたきっかけは、許可確認の多さでした。Plan Mode 中にサブエージェントが調査のためにシェルを実行するたびに、実行してよいかの確認が出ていました。

この不満は、今は解消されています。[公式ドキュメント](https://code.claude.com/docs/en/permission-modes)によると、Auto Mode[^auto-mode] が使える環境で `useAutoModeDuringPlan`[^use-auto-mode-during-plan] が有効になっていれば、Plan Mode 中のシェルコマンドはユーザーに確認せず、実行してよいかを判定するモデル(classifier)が判断します。ただし、重要なパスを削除するコマンドは確認の対象に残ります。

読み取り専用であることを静的解析で判定できないコマンドも、このモデルが判定します。CHANGELOG の 2.1.218 には「Changed plan mode with auto to no longer prompt for Bash commands the static analyzer can't prove read-only; the auto-mode classifier judges them instead」とあります。Plan Mode 中に呼び出される Plan などのサブエージェントも、親のセッションの permission mode を引き継ぎます。

離れたきっかけがなくなっても Plan Mode に戻っていないのは、実装の前に何を確かめるかを、指示のテンプレートで決めてあるからです。Plan Mode が廃止されても mod になっても、私の開発の手順は変わりません。

## Plan Mode に残してほしい役割

何を確かめるかをまだ決めていない人にとっては、Plan Mode は「すぐに実装させない」ための分かりやすい操作だと思います。Shift+Tab を押すだけで、Claude がファイルを編集せずに計画を出してくるからです。ただし、Plan Mode に入ること自体が目的になると、利用者が計画の中身を確かめないまま承認するおそれがあります。私が Plan Mode に残してほしいのは、Claude の作業を実装の前に止め、利用者が計画を確認する機会としての役割です。その機会に何を確かめるかは、使う人が自分で決めるものだと考えています。

## まとめ

- Plan Mode の廃止案は、組み込みの mod として残す方針に変わった。2.1.283 時点では、まだ mod にはなっていない
- 実装前の確認は、計画を立てたあとに、目的・範囲・進め方・制約・完了条件の 5 項目で実装の指示を Claude に書かせる形に移した
- 人がプランを読んでいた部分は、AI 自身のレビュー、社内フレームワーク用のスキルとドキュメント、テストで補っている
- Plan Mode 中の許可確認は `useAutoModeDuringPlan` で減少したが、何を確かめるかを指示のテンプレートで決めてあるので、Plan Mode には戻らない
- Plan Mode は実装の前に計画を確認する機会を作るが、その機会に何を確かめるかは使う人が決める必要がある

## 参考

- [Thariq (@trq212) の投稿(2026 年 9 月 23 日)](https://x.com/trq212/status/2102813194196758746)
- [Thariq (@trq212) の投稿(2026 年 9 月 24 日)](https://x.com/trq212/status/2103212051065921632)
- [Permission modes - Claude Code Docs](https://code.claude.com/docs/en/permission-modes)
- [Settings reference - Claude Code Docs](https://code.claude.com/docs/en/settings-reference)
- [Subagents - Claude Code Docs](https://code.claude.com/docs/en/sub-agents)
- [claude-code/CHANGELOG.md - GitHub](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

[^plan-mode]: Plan Mode は、Claude Code がファイルを編集せず、調査と計画の作成だけを行う動作モードです。Shift+Tab で切り替えます。
[^stats]: 自分の Claude Code から OpenTelemetry で送信している利用記録を集計しました。対象は私の 1 アカウント、期間は 2026 年 9 月 1 日から 28 日までです。Plan Mode を開始するツール(EnterPlanMode)と終了するツール(ExitPlanMode)の実行記録と許可判断の記録が、どちらも 0 件でした。
[^claude-mods]: Claude Mods は、Claude Code の動作を TypeScript の関数で追加・変更できる仕組みです。使い方は [Claude Mods でプロンプトキャッシュが切れる前に compact する](/blog/claude-mods-auto-compact-before-cache-expiry)で紹介しています。
[^skill]: スキルは、作業の手順や知識を Markdown に書いておき、Claude が作業に応じて読み込む仕組みです。詳しくは [Skills のドキュメント](https://code.claude.com/docs/en/skills)にあります。
[^subagent]: サブエージェントは、親のセッションとは別の文脈で、調査などの作業を任せる仕組みです。詳しくは [Subagents のドキュメント](https://code.claude.com/docs/en/sub-agents)にあります。
[^use-auto-mode-during-plan]: `useAutoModeDuringPlan` の既定値は `true` です。[Settings reference](https://code.claude.com/docs/en/settings-reference) に記載があります。
[^auto-mode]: Auto Mode は、ツールの実行ごとにユーザーに確認する代わりに、実行してよいかを判定するモデル(classifier)が判断する動作モードです。

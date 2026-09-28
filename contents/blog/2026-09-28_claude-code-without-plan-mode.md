---
title: Plan Mode でしていた実装前の確認を、指示の型とテストに移した
slug: claude-code-without-plan-mode
date: 2026-09-28
modified_time: 2026-09-28
description: Claude Code の Plan Mode の廃止案が出ましたが、私は 2026 年 9 月に Plan Mode を 1 回も使っていません。実装前の確認をやめたのではなく、5 項目の指示の型、AI 自身のレビュー、スキルとテストに移しました。今の手順と、Plan Mode に残してほしい役割を書きます。
icon:
icon_url:
tags:
  - ClaudeCode
  - AI
---

2026 年 9 月、Claude Code の開発者が Plan Mode[^plan-mode] の廃止を検討していると投稿しました。私はこの月、Claude Code で 551 セッションを使いましたが、Plan Mode に入った記録は 0 件です[^stats]。

ただし、実装前の確認をやめたわけではありません。確認する場所を Plan Mode という操作から、指示の書き方、AI 自身によるレビュー、スキルとテストに移しました。この記事では、今の手順と、それでも Plan Mode に残してほしい役割を書きます。

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

2 件目の投稿にある「many of you are planning yourself」の側に、私も入ります。計画は立てていますが、その計画を Plan Mode の中では作っていません。

## 実装前の確認を指示の型に移す

Plan Mode がしていたことは、Claude にファイルを編集させず、実装の前に一度止めることです。何を確かめてから実装に進むかまでは、Plan Mode は決めてくれません。そこで私は、実装に進む前に確かめる内容を、指示の型として先に決めています。

私が使っている型は、次の 5 項目です。

```md
# 目的（なにをやってほしいのか）
# 範囲（どこまで対応してよいか）
# 進め方（どの順番で判断・実行してほしいか）
# 制約（守ってほしいルール・やってはいけないこと）
# 完了条件（なにを確認したら完了とするか）
```

指示を最初からこの型で書き上げることはしていません。最低限やりたいことだけを先に書き、その指示が 5 項目を満たしているかを Claude に確認させます。確認が済んだら、最低限の計画をドキュメントとして書かせ、そのあとに実装に入ります。

5 項目がそろっていれば、Claude がどこまで変更してよいかと、何を確認したら作業を終えるかが、実装の前に決まります。Plan Mode で計画を作らせる場合も、この 2 つは指示に書かない限り決まりません。

## 確認を AI のレビューとテストに任せる

実装前の確認のうち、人が読んで判断していた部分も減りました。減った理由は 3 つあります。

1 つ目は、AI 自身にレビューさせていることです。プロジェクトに用意したスキルやサブエージェントを使って Claude に調査させたあと、その調査結果と計画を Claude 自身にもレビューさせます。

2 つ目は、学習データに少ない領域を、スキルとドキュメントで補ったことです。[2026 年 6 月の記事](/blog/claude-code-hooks-plan-readability)では、社内フレームワークのように学習データに十分含まれていない領域では、プランを人がレビューした方がよいと書きました。今は、その社内フレームワーク専用のスキルを作り、該当する作業ではそのスキルを読むように指示しています。ディレクトリ構成とドキュメントも、エージェントが探しやすい形に整えました。そのため、人がプランを読んで方向の誤りを見つける場面は、6 月と比べて少なくなっています。

3 つ目は、テストです。テストを書いたプロジェクトでは、Claude が誤った修正をしても、テストを実行した時点で失敗します。変更の影響がテストの結果で分かるので、実装の前に人が影響範囲を読み切る必要が小さくなりました。

これに加えて、6 月からの数か月でモデルの性能も上がっています。どの要因がどれだけ影響したかは分けて測っていません。4 つが重なった結果、Plan Mode で一度止めてもらう必要を感じなくなったと考えています。

## Plan Mode に残してほしい役割

私が Plan Mode から離れたきっかけは、許可確認の多さでした。Plan Mode 中にサブエージェントが調査のためにシェルを実行するたびに、実行してよいかの確認が出ていました。

この不満は、今は解消されています。[公式ドキュメント](https://code.claude.com/docs/en/permission-modes)によると、Auto Mode[^auto-mode] が使える環境で `useAutoModeDuringPlan` が有効になっていれば、Plan Mode 中のシェルコマンドはユーザーに確認せず、Auto Mode の判定機能が実行してよいかを判断します。この設定の既定値は `true` です。CHANGELOG の 2.1.218 にも「Changed plan mode with auto to no longer prompt for Bash commands the static analyzer can't prove read-only」とあります。Plan Mode 中に呼び出される Explore や Plan のサブエージェントも、親のセッションの permission mode を引き継ぎます。

離れたきっかけがなくなっても、私は Plan Mode に戻っていません。実装の前に何を確かめるかを、5 項目の型、AI のレビュー、スキルとテストとして決めてあるからです。Plan Mode が廃止されても mod になっても、私の開発の手順は変わりません。

一方で、何を確かめるかをまだ決めていない人にとっては、Plan Mode は「すぐに実装させない」ための分かりやすい操作だと思います。Shift+Tab を押すだけで、Claude がファイルを編集せずに計画を出してくるからです。ただし、Plan Mode に入ること自体が目的になると、計画の中身を確かめないまま承認することになります。私が Plan Mode に残してほしいのは、実装の前に作業を中断して計画を確認する機会としての役割です。その機会に何を確かめるかは、使う人が自分で決めるものだと考えています。

## まとめ

- Plan Mode の廃止案は、組み込みの mod として残す方針に変わった。2.1.283 時点では、まだ mod にはなっていない
- 私は 2026 年 9 月に 551 セッションで Claude Code を使い、Plan Mode に入った記録は 0 件だった
- 実装前の確認は、目的・範囲・進め方・制約・完了条件の 5 項目で指示を確認させる形に移した
- 人がプランを読んでいた部分は、AI 自身のレビュー、社内フレームワーク用のスキルとドキュメント、テストで補っている
- Plan Mode 中も、`useAutoModeDuringPlan` が有効なら Auto Mode の判定機能がシェルコマンドを判断する。既定値は `true`
- Plan Mode は実装の前に計画を確認する機会を作るが、その機会に何を確かめるかは自分で決める必要がある

## 参考

- [Thariq (@trq212) の投稿（2026 年 9 月 23 日）](https://x.com/trq212/status/2102813194196758746)
- [Thariq (@trq212) の投稿（2026 年 9 月 24 日）](https://x.com/trq212/status/2103212051065921632)
- [Permission modes - Claude Code Docs](https://code.claude.com/docs/en/permission-modes)
- [Settings reference - Claude Code Docs](https://code.claude.com/docs/en/settings-reference)
- [Subagents - Claude Code Docs](https://code.claude.com/docs/en/sub-agents)
- [claude-code/CHANGELOG.md - GitHub](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

[^plan-mode]: Plan Mode は、Claude Code がファイルを編集せず、調査と計画の作成だけを行う動作モードです。Shift+Tab で切り替えます。
[^stats]: 自分の Claude Code から OpenTelemetry で送信している利用記録を集計しました。対象は私の 1 アカウント、期間は 2026 年 9 月 1 日から 28 日までです。Plan Mode を開始するツール（EnterPlanMode）と終了するツール（ExitPlanMode）の実行記録と許可判断の記録が、どちらも 0 件でした。
[^claude-mods]: Claude Mods は、Claude Code の動作を TypeScript の関数で追加・変更できる仕組みです。使い方は [Claude Mods でプロンプトキャッシュが切れる前に compact する](/blog/claude-mods-auto-compact-before-cache-expiry)で紹介しています。
[^auto-mode]: Auto Mode は、ツールの実行ごとにユーザーに確認する代わりに、Claude Code の判定機能が実行してよいかを判断する動作モードです。

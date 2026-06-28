---
title: built-in subagent で足りていると思っていたら、軽い調査も Opus で走っていた
slug: claude-code-subagent-model-inheritance
date: 2026-06-28
modified_time: 2026-06-28
description: Claude Code の subagent 利用を 1 か月分集計したら、general-purpose は親が使っているモデルを継承していて、軽い調査も Opus で走っていました。Explore が Haiku 固定だったことと対比しながら、Haiku 固定のカスタム agent に切り出す判断軸を整理します。
icon: 🧩
icon_url: /icons/puzzle_piece_flat.svg
tags:
  - ClaudeCode
selfAssessment:
  quizzes:
    - question: "Claude Code で親会話が Opus 4.7 のときに `general-purpose` subagent を呼び出すと、子はどのモデルで動くか?"
      answers:
        - text: "常に Haiku 4.5 で動く"
          correct: false
          explanation: "Haiku 固定なのは `Explore` です。`general-purpose` は定義側でモデルを固定していません。"
        - text: "親会話のモデルを継承するため Opus 4.7 で動く"
          correct: true
          explanation: "`general-purpose` の subagent 定義は `Model: inherits from the main conversation` で、`model` フィールドのデフォルトが `inherit` です。親が Opus 4.7 なら子も Opus 4.7 で動きます。"
        - text: "Sonnet にフォールバックする"
          correct: false
          explanation: null
        - text: "呼び出しごとに `CLAUDE_CODE_SUBAGENT_MODEL` 環境変数の値で決まる"
          correct: false
          explanation: "環境変数はモデル解決順序の先頭に位置しますが、設定していなければ subagent 定義の `model` frontmatter、最終的に親会話のモデルへとフォールバックします。"
    - question: "記事が示した「Haiku 固定のカスタム agent に切り出す候補」として最も妥当なタスクはどれか?"
      answers:
        - text: "アーキテクチャ上のトレードオフを比較して採用方針を決めるタスク"
          correct: false
          explanation: "設計判断を含むタスクは、モデルの推論品質が結果に効くため切り出さない方がよい例として挙げられています。"
        - text: "今回限りで再発しない、特殊な前提のリリース手順整理"
          correct: false
          explanation: "1 回しか発生しないタスクは、agent 定義の手間が回収できないため切り出し対象から外す例として挙げられています。"
        - text: "新機能の実装前に、関連ファイル群と既存実装の方針を読んでまとめるタスク"
          correct: true
          explanation: "「繰り返し発生する」「読みと要約が中心」「親が Opus でもつい `general-purpose` に投げてしまう軽さ」という 3 つの判断軸すべてに当てはまる例として、記事中で具体的に挙げられています。"
        - text: "親会話の長いやり取りを前提に、設計の意思決定を引き継ぐタスク"
          correct: false
          explanation: "親会話の文脈を強く必要とするタスクは、渡し直しのコストが高いため切り出さない方がよい例として挙げられています。"
---

Claude Code には Explore、Plan、general-purpose といった built-in[^built-in] の subagent があり、用途別に呼び分けて使えます。これに加えて、`.claude/agents/` 配下に description やモデルを指定した Markdown を置くことで、自分専用のカスタム agent も定義できます。
私は普段の使い方として、Explore で読み、Plan で設計、general-purpose で調査と、built-in をそのまま呼び分けて使ってきました。built-in で足りているうちは、わざわざカスタム agent を増やす理由もありません。

実際、カスタム agent を作るのは気が進みませんでした。description が機能するか確信が持てないですし、いったん作ればカスタム agent の保守も発生します。「既存ので動いているし、まあいいか」と先送りにしていました。

[こちらの記事](https://suntory-n-water.com/blog/claude-code-usage-otel-cloudflare-d1) で作った OTEL → Cloudflare D1 の収集基盤に 1 か月分のデータが溜まったので、眺めてみました。すると、`general-purpose` は 12 件中 11 件が Opus で動いていました。軽いディレクトリ調査でも、親が Opus なら子も Opus です。一方で `Explore` は 15 件すべて Haiku 4.5 で動いていて、こちらは定義側でモデルが固定されているおかげでした。

`general-purpose` が親会話のモデルを継承する挙動は、公式ドキュメントにも `inherits from the main conversation` と明記されています。ただし、仕様を知っていることと、その仕様が自分の利用パターンでいくらのコストを生んでいるかを把握することは別の話です。

## 1 か月分の subagent 利用を見る

集計対象は 2026 年 5 月 18 日から 6 月 27 日までの約 1.4 か月、270 セッション、`subagent_completed` イベントは 34 件でした。計測のしくみは前回の記事に書いたので省略します。

agent_type と model のクロス集計[^cross-tab]はこうなりました。

| agent_type          | model             |   n | 平均 duration | 平均 tokens | 平均 tool 数 |
| ------------------- | ----------------- | --: | ------------: | ----------: | -----------: |
| Explore             | claude-haiku-4-5  |  15 |        75.5 s |      41,036 |         27.9 |
| Plan                | claude-opus-4-7   |   4 |       113.9 s |      38,666 |         10.2 |
| claude              | claude-opus-4-7   |   2 |        82.2 s |      45,752 |         11.0 |
| claude              | claude-opus-4-8   |   1 |        60.1 s |      33,828 |          7.0 |
| general-purpose     | claude-opus-4-7   |  11 |       111.6 s |      19,171 |         16.6 |
| general-purpose     | claude-sonnet-4-6 |   1 |        22.5 s |      23,616 |          4.0 |

クロス集計を見ると、`Explore` 列だけ全件が Haiku で揃っていて、それ以外は Opus が中心になっています。`general-purpose` は 12 件のうち 11 件が Opus で、Sonnet が混じった 1 件は親会話側で Sonnet を使っていた期間に起動したものでした。

34 件すべての `agent.source` は `built-in` でした。カスタム agent を作っていないので当然ですが、後段で「どれを切り出すか」を考えるときの判断軸になります。

## Explore は Haiku 固定、general-purpose は使っているモデルを継承

クロス集計の偏りは、subagent の設計に由来しています。大きく 2 つの系統がありました。

### 定義側でモデルが固定される系統

`Explore` は、subagent の定義そのものが「read-only で動く検索専用、モデルは Haiku」と決まっています。公式ドキュメントでも `Model: Haiku, which is fast and low-latency` と明示されています。Claude Code の `subagent_type: "Explore"` を指定して呼び出すと、親会話がどのモデルで動いていても子は Haiku 4.5 になります。15 件中 15 件が Haiku 4.5 で揃っていたのはそのためでした。

Explore の 1 件あたりの tool 利用数は最大で 60 に達していて、Grep と Read が中心です。読み中心で出力が小さい用途に Haiku を当てているので、Grep と Read が積み上がっても Haiku のレート分だけで済んでいました。

### 親会話で使っているモデルを子が継承する系統

`Plan`、`general-purpose`、catch-all の `claude` は、定義側ではモデルを固定していません。公式ドキュメントの記述も `Model: inherits from the main conversation` で、subagent 定義の `model` フィールドはデフォルトが `inherit` だと明記されています[^model-resolution]。親会話で使っているモデルが子にもそのまま渡ります。親が Opus 4.7 のときは子も Opus 4.7、Opus 4.8 に切り替えた期間は Opus 4.8 で動き、Sonnet を使っていた瞬間に起動した 1 件だけ Sonnet でした。

親が Opus なら子も Opus でよさそうに見えますが、問題は `general-purpose` にどんなタスクが流れ込んでくるかにあります。意図して `general-purpose` を指定して呼び出しているわけではありません。調査系のタスクを依頼すると、Claude Code は意味的解釈で subagent を選びます。その結果、本来 `Explore` で済むはずの粒度の調査が `general-purpose` に振られてしまうことがあります。Haiku で十分こなせる作業でも、`general-purpose` に振られた時点で親会話のモデルを継承して Opus で動きます。データを見るまで気付きませんでした。

## 計測する前と後で、判断の前提が変わった

カスタム agent を作ってこなかった理由は、次の 3 点でした。

- built-in で動いているので、目に見える困りごとがなかった
- 一度きりに見える作業が多くて、agent として定義するほどではないと感じた
- description が機能するか自信が持てないし、保守も発生する

計測する前なら、この判断はそれなりに妥当でした。コストを払わない選択肢を選んだだけです。

データが手元に出てきた後だと話が変わります。`general-purpose` に毎回投げている「前提知識を渡したうえでの部分調査」は、Opus で 11 件積み上がっていました。1 件あたり平均 19,171 トークン、平均 16.6 回のツール呼び出しが、Haiku で済んだはずの作業に対して動き続けていたことになります。

つまり「保守コストを払わない」という判断の裏側で、「親会話のモデルを継承するコスト」を払い続けていたわけです。どちらのコストが重いかは、データを見てから決め直す段階にきています。

`Explore` が全件 Haiku で揃っていたのは、私が意図して選んだ結果ではありません。subagent 定義側にそう書いてあっただけでした。同じ構造を `general-purpose` 相当の用途に対しても再現できれば、判断を意識せずにモデル選択を縛れます。これがカスタム agent を作る動機になりました。

## Haiku 固定のカスタム agent に切り出す判断軸

すべての作業を切り出すと、今度は保守の手間が見合わなくなります。判断軸は 3 つです。

- 繰り返し発生する作業であること
- 判断不要、または「読みと要約」が中心であること
- 親が Opus でも、つい `general-purpose` に投げてしまう軽さであること

逆に、こういう作業は切り出さない方がよさそうです。

- 設計判断を含む(モデルの推論品質が結果に効く)
- 1 回しか発生しない(定義する手間が回収できない)
- 親会話の文脈を強く必要とする(渡し直しのコストが高い)

### 切り出してみたい作業の例

私の場合、「新機能を実装する前に、関連するファイル群と既存実装の方針を読んでまとめてもらう」というタスクが繰り返し出てきます。このタスクを Claude Code が `general-purpose` に振ると、毎回 Opus が動きます。

このタスクは、判断軸の 3 つに当てはまります。

- 繰り返し発生する
- 読みと要約が中心で、設計判断は親側でやる
- 親が Opus の文脈でついサブに丸投げしがち

Haiku 固定の調査専用 agent として切り出すのが妥当そうです。Haiku で品質が落ちないかは、「判断不要、読みと要約のみ」の境界をどこに引くかで決まります。境界を超える依頼は親側で受けるか、Opus 系の agent に振り分ける形で運用するのがよさそうです。

切り出した agent が想定どおりに自律起動しているかは、前回記事で構築した OTEL → D1 のカスタム集計基盤側で `invocation_trigger = 'claude-proactive'`[^invocation-trigger] を後から確認できます。「作ったけど呼ばれていない」もデータで分かるので、description を直す材料になります。

## まとめ

- `Explore` は subagent 定義側でモデルが Haiku 固定になっており、親会話が Opus でも子は Haiku で動く
- `Plan`、`general-purpose`、catch-all の `claude` は親会話で使っているモデルを継承するため、軽い調査タスクでも親が Opus なら子も Opus で動く
- 1 か月分の集計では `general-purpose` の 12 件中 11 件が Opus で、`agent.source` は全件 `built-in` だった。カスタム agent は一度も呼んでいなかった
- 「保守が面倒」を理由に built-in に任せていた裏で、親会話のモデルを継承するコストを払い続けていた
- 繰り返し発生し、判断不要で、読みと要約が中心のタスクは、Haiku 固定のカスタム agent に切り出す候補になる
- 切り出した agent が自律起動しているかは、前回構築した OTEL → D1 のカスタム集計基盤側で `invocation_trigger = 'claude-proactive'` を後から確認できる

## 参考

https://code.claude.com/docs/en/sub-agents

https://code.claude.com/docs/en/monitoring-usage

https://github.com/Suntory-N-Water/cc-monitor-worker

[^built-in]: Claude Code 本体に同梱されている subagent のこと。ユーザーが定義するカスタム agent と対比して使われる呼び方で、公式ドキュメントでも [Built-in subagents](https://code.claude.com/docs/en/sub-agents#built-in-subagents) として整理されています。
[^cross-tab]: 2 つの軸(ここでは `agent_type` と `model`)の組み合わせごとに件数や平均値を出した表のこと。どの agent がどのモデルで動いていたか、その分布が一目で分かります。
[^model-resolution]: 公式ドキュメントの [Choose a model](https://code.claude.com/docs/en/sub-agents#choose-a-model) によると、subagent のモデルは次の順で解決されます。(1) `CLAUDE_CODE_SUBAGENT_MODEL` 環境変数、(2) 呼び出しごとの `model` パラメータ、(3) subagent 定義の `model` frontmatter、(4) 親会話のモデル。`Plan` と `general-purpose` は (3) が `inherit` なので、最終的に (4) の親会話のモデルで動きます。
[^invocation-trigger]: `invocation_trigger` は公式ドキュメントの [Monitoring usage](https://code.claude.com/docs/en/monitoring-usage) では skill の `skill_activated` イベントの属性として定義されており、`user-slash` / `claude-proactive` / `nested-skill` の 3 値を取ります。本記事では前回構築した OTEL → D1 のカスタム集計基盤側で、subagent イベントに対しても同名の判定値を保存しているため、後から「自律起動だったか」を確認できる、という意味で使っています。Claude Code が標準で subagent イベントにこの属性を付けてくれるわけではない点に注意してください。

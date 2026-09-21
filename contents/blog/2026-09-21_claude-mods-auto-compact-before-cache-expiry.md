---
title: Claude Mods で、離席中にプロンプトキャッシュが切れる前に compact する
slug: claude-mods-auto-compact-before-cache-expiry
date: 2026-09-21
modified_time: 2026-09-21
description: Claude Code のプロンプトキャッシュは 1 時間で切れます。前に書いたシェルフックは、戻ってきた最初の入力を止めて /clear を促すものでした。新しく入った Claude Mods には `$.clock.every` があるので、離席中にタイマーを動かして、切れる前に自動で compact する mod を作りました。
icon: ☕
icon_url: /icons/hot_beverage_flat.svg
tags:
  - ClaudeCode
  - ClaudeMods
  - TypeScript
---

Claude Code のプロンプトキャッシュが 1 時間で切れること、切れたあとの最初の 1 回が一番高くつくことを[前の記事](/blog/claude-code-next-morning-resume-cost)に書きました。そのときの対策は、1 時間以上あいた入力を `UserPromptSubmit` フックで止めて、`/clear` を促すものです。

この対策には、戻ってきてからしか動かないという性質があります。止めた時点でキャッシュはもう切れています。切れる前に何かをするには、離席している間に動く仕組みが要ります。

Claude Code に Claude Mods という仕組みが入りました。TypeScript の関数をフックとして登録できるもので、その中に `$.clock.every` というタイマーがあります。これを使って、離席が続いたら自動で `/compact` を実行する mod を作りました。この記事では、その mod のコードと、閾値を 55 分に決めた理由、1 時間放置して確かめた結果を書きます。

Claude Mods は 2026 年 9 月時点で early access です。使うには環境変数 `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` が必要で、API は予告なく変わる可能性があります。この記事の内容は Claude Code 2.1.278 で確認したものです。従来のシェルフックは `classic.*` イベントとして残るので、いま設定しているフックがそのまま使えなくなるわけではありません。

## 入力を止めるフックでは間に合わない場面

前の記事のフックは、キャッシュが切れたあとの入力を終了コード 2 で止めます。止められたあとに選ぶのは `/clear` でした。[公式ドキュメント](https://code.claude.com/docs/en/prompt-caching)が `/compact` の要約リクエストについて「After a break longer than the cache lifetime, there is no cache left to read, so the summarization request reprocesses the full history as uncached input」と書いているためです。有効期間が切れたあとに `/compact` を選ぶと、履歴の全体を未キャッシュで処理し直すことになります。

この挙動には裏返しがあります。有効期間が切れる前なら、要約のリクエストはキャッシュから履歴を読み込めます。切れる前に compact を済ませておけば、会話を捨てずに、次の入力が読み込むキャッシュを小さく作り直せることになります。

前の記事で集計した 38,500 件のうち、間隔が 60 分以上のリクエストは 129 件でした。この 129 件は 1 件あたりのコストがキャッシュの適用されていたリクエストの 10.57 倍で、うち 74 件はそのセッションで最もコストの高いリクエストです。この 1 回を避けるために、離席中に動く仕組みを作ります。

## シェルフックに経過時間を測る手段が無い理由

シェルフックが実行されるのは、Claude Code が何かをしたときだけです。`SessionStart` はセッションが始まったとき、`UserPromptSubmit` は入力が送られたとき、`Stop` は応答が終わったときに実行されます。離席している間は何も起きないので、フックも実行されません。

前の記事で `Stop` に終了時刻をファイルへ書かせ、`UserPromptSubmit` でその時刻からの経過を計算していたのは、この制約のためです。経過時間そのものは計算できるのですが、計算できるのは次に入力が送られたときであって、その途中ではありません。

離席の途中で何かをするには、Claude Code の外に常駐するプロセスが必要でした。cron で定期的に起こすか、tmux のセッションを別に立ち上げて監視させるかです。どちらも、Claude Code の状態を外から推定することになります。

## Claude Mods が足したもの

Claude Mods の mod は、`register(on, options)` を export する TypeScript のモジュールです。`on` でイベントを購読し、コールバックの第 1 引数 `$` から Claude Code の機能を呼び出します。

今回使うのは 3 つです。

`$.clock.every(ms, fn)` は、`ms` ごとに `fn` を実行し続けます。返却されるのは `cancel()` を持つオブジェクトで、これを呼ぶと停止します。1 周期につき 1 回 `clock.every` イベントが発生し、他のフックに拒否されるとその時点で周期が終わります。

`$.session.compact()` は、`/compact` と同じ処理を実行します。trigger は `plugin` になり、呼び出し元以外のすべてのフックと本体の処理を通ります。他のフックに拒否された場合は `{ skip: true }` が返却されます。制約が 1 つあって、この関数はターンの合間でだけ呼べます。ターンの実行中に呼ぶと reject されます。

`$.ui.log(text)` は、transcript に薄い色の行を 1 行追加します。モデルには送られません。

フックの実行には 10 秒の予算がありますが、タイマーのコールバックはフックの実行ではないため、この予算の対象外です。約 57 秒かかった compact が、途中で打ち切られずに完了しました。

## mod を作る

ファイルは 3 つです。ディレクトリの名前は何でもかまいません。

まず、プラグインのマニフェストです。`userConfig` に書いた項目は、利用者が設定で上書きできます。

```json cache-ttl-compact/.claude-plugin/plugin.json
{
  "name": "cache-ttl-compact",
  "version": "0.1.0",
  "description": "離席が続いてプロンプトキャッシュの 1 時間 TTL が失効する前に、conversation を自動で compact する。",
  "author": { "name": "sui" },
  "userConfig": {
    "idleMinutes": {
      "type": "number",
      "title": "compact するまでの無操作時間 (分)",
      "description": "最後のターンが終わってからこの分数が過ぎたら compact する。",
      "required": false,
      "default": 55
    },
    "tickMinutes": {
      "type": "number",
      "title": "経過時間を確認する間隔 (分)",
      "description": "この間隔で無操作時間を確認する。",
      "required": false,
      "default": 1
    }
  }
}
```

次に、hooks module の場所を書きます。

```json cache-ttl-compact/hooks/hooks.json
{
  "description": "session.start でタイマーを開始し、無操作が idleMinutes を超えたら $.session.compact() を呼ぶ。",
  "modules": ["./register.ts"]
}
```

本体です。

```ts cache-ttl-compact/hooks/register.ts
import type { On, PluginOptions, Timer } from 'claude-code'

const MINUTE = 60_000

export function register(on: On, options: PluginOptions): void {
  const idleMs = Number(options.idleMinutes ?? 55) * MINUTE
  const tickMs = Number(options.tickMinutes ?? 1) * MINUTE

  let timer: Timer | undefined
  let lastTurnEndedAt = 0
  let done = false

  on('session.start', async ($, e, next) => {
    // $.clock.now() は host を通るので、claude-code/testing の mock.clock で
    // 差し替えられる。Date.now() だと 1 時間待たないとテストできない。
    lastTurnEndedAt = await $.clock.now()
    $.ui.log(`${idleMs / MINUTE} 分の無操作で compact します`)

    timer?.cancel()
    timer = $.clock.every(tickMs, async () => {
      if (done) return

      const elapsed = (await $.clock.now()) - lastTurnEndedAt
      if (elapsed < idleMs) return

      done = true
      try {
        const result = await $.session.compact()
        if (result.skip) {
          $.ui.log(`他のフックが compact を拒否しました`)
          return
        }
        $.ui.log(
          `${Math.round(elapsed / MINUTE)} 分の離席を検知し、` +
            `${result.tokensBefore ?? '?'} → ${result.tokensAfter ?? '?'} トークンに compact しました`,
        )
      } catch (error) {
        // $.session.compact() はターンの実行中だと reject される。
        // タイマーの周期とターンの開始がぶつかった場合なので、次の周期に回す。
        done = false
        $.ui.log(`compact できませんでした (${error})`, { to: 'debug' })
      }
    })

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    // agentId があるのはサブエージェントのターン。サブエージェントのリクエストは
    // メインの conversation のキャッシュを読まないので、TTL の起点にならない。
    if (e.agentId !== undefined) return next(e)

    lastTurnEndedAt = await $.clock.now()
    done = false
    return next(e)
  })

  on('session.end', ($, e, next) => {
    timer?.cancel()
    timer = undefined
    return next(e)
  })
}
```

読んでほしいのは `turn.complete` のほうです。無操作の起点をここに置いているので、作業を続けている間は締め切りが後ろへずれ続けます。`agentId` があるターンを除いているのは、サブエージェントのリクエストがメインの会話のキャッシュを読まないためです。サブエージェントが動いていても、メインの会話のキャッシュは温まりません。

時刻を `Date.now()` ではなく `$.clock.now()` で取得しているのは、この呼び出しが host を通るためです。`claude-code/testing` の `mock.clock` で差し替えられるので、1 時間待たずにテストを書けます。

型定義は `/plugin-types` で生成できます。書けたら、静的に確認します。

```bash
claude plugin validate .
```

登録したフックと、呼び出している `$` の一覧が表示されます。

```text
  ❯ ./register.ts hooks: session.start, turn.complete, session.end
  ❯ ./register.ts calls: $.clock.every, $.clock.now, $.session.compact, $.ui.log

✔ Validation passed
```

起動は `--plugin-dir` にディレクトリを渡します。

```bash
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir ./cache-ttl-compact
```

## 閾値を 60 分より手前に置く理由

`promptCacheTtl` を `1h` にしているので、締め切りは最後のリクエストから 60 分です。閾値を 60 分ちょうどに置くと間に合いません。理由が 3 つあります。

1 つめは、compact 自体に時間がかかることです。閾値を 2 分に下げて計測したところ、`$.session.compact()` の呼び出しから完了まで約 57 秒でした。別の実行では 1 分を超えています。compact が始まった時点ではなく、終わった時点が締め切りより前にある必要があります。

2 つめは、確認の間隔です。`$.clock.every` は指定した間隔でしか実行されないので、無操作が閾値を超えてから検知されるまでに、最大で間隔 1 つぶんの遅れが出ます。既定の 1 分なら最大 1 分です。

3 つめは、起点のずれです。`turn.complete` が実行されるのは、そのターンの最後の API リクエストより後です。mod が測っている経過時間は、キャッシュの側で数えられている経過時間より短くなります。ターンの中でツールを何度も実行していた場合、この差は大きくなります。

3 つを足すと数分です。既定値は 55 分にしました。5 分の余裕があれば、57 秒の compact と 1 分の遅れは収まります。

## 1 時間放置して確かめた

確かめたのは Claude Code 2.1.278、macOS (Darwin 25.6.0) です。`promptCacheTtl` と `subagentPromptCacheTtl` はどちらも `1h` にしてあります。

まず、仕組みそのものを短い閾値で確認しました。閾値 2 分、確認の間隔 1 分にして、「おはよう！」と 1 回送ってから放置します。

| 時刻 | 出来事 |
|---|---|
| 15:37:38 | 起動 |
| 15:37:59 | 「おはよう！」を送信 |
| 15:40:38 頃 | タイマーの周期で `$.session.compact()` を呼び出し |
| **15:41:35** | **20,188 → 3,529 トークンに compact して完了** |

太字の行が、タイマーのコールバックから呼んだ compact が完了したことを示しています。約 57 秒という数字はここから取りました。transcript にはこう表示されます。

```text
Conversation compacted (ctrl+o for history)
⏺cache-ttl-compact: 3 分の離席を検知し、20188 → 3529 トークンに compact しました
```

次に、作業を続けている間は compact されないことを確認しました。閾値 2 分のまま、90 秒おきに 3 回入力します。

| 時刻 | 出来事 |
|---|---|
| 15:43:18 | 「おはよう！」1 回目 |
| 15:44:50 | 「おはよう！」2 回目 |
| 15:46:21 | 「おはよう！」3 回目 |
| **15:48:5x** | **最後のターンから約 2 分後、compact が始まる** |

太字の行を確認してください。3 回の入力の間隔は閾値より短く、その間に compact は始まっていません。`turn.complete` での更新が締め切りを後ろへずらしています。

## 使うときに確認すること

`--plugin-dir` で読み込んだ mod の設定は、プロジェクトの `.claude/settings.json` に書いた `pluginConfigs` からは適用されませんでした。`--settings` に JSON を直接渡すと適用されます。

```bash
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir ./cache-ttl-compact \
  --settings '{"pluginConfigs":{"cache-ttl-compact":{"options":{"idleMinutes":55,"tickMinutes":1}}}}'
```

`$.ui.log` の行には、Claude Code がプラグイン名を接頭辞として自動で付けます。mod 側で同じ名前を書くと二重になります。

タイマーのコールバックは、mod が読み込まれたときの環境に属します。mod のファイルを編集するとホットリロードが実行され、待機中のタイマーは古い環境ごと取り消されます。セッションを開いたまま `register.ts` を編集すると、そのセッションのタイマーは動かなくなります。

compact の完了後には `SessionStart` フックが `source` を `compact` として再実行されます。前の記事のフックは、この場合に経過時間の記録を削除します。自動の compact で作り直したキャッシュを、直後の入力で切れていると判定することはありません。

> [!WARNING]
> この mod は予告なく compact を実行します。作業の途中で会話が要約されて困る場合は、`idleMinutes` を長くするか、mod を読み込まないでください。

## まとめ

- Claude Mods の `$.clock.every` を使うと、離席している間に Claude Code の中でタイマーを動かせる。シェルフックには、Claude Code が動いていない間に実行される手段が無い
- タイマーのコールバックから `$.session.compact()` を呼べる。フックの 10 秒の予算には縛られず、約 57 秒かかった compact が完了した
- `$.session.compact()` はターンの合間でだけ呼べる。ターンの実行中は reject されるので、次の周期に回す
- 無操作の起点を `turn.complete` に置くと、作業を続けている間は compact が先送りされる。閾値 2 分に対し 90 秒おきに 3 回入力した間、compact は始まらなかった
- 閾値は 60 分ではなく 55 分にした。compact 自体に約 1 分、確認の間隔に最大 1 分、`turn.complete` の起点のずれの分だけ、締め切りより手前に置く必要がある
- `--plugin-dir` で読み込んだ mod には、プロジェクトの `.claude/settings.json` の `pluginConfigs` が適用されなかった

## 参考

https://github.com/anthropics/claude-code/issues/91870

https://github.com/anthropics/claude-code/blob/main/mods/README.md

https://code.claude.com/docs/en/prompt-caching

https://code.claude.com/docs/en/hooks

https://suntory-n-water.com/blog/claude-code-next-morning-resume-cost

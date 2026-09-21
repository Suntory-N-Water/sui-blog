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

この対策には、戻ってきてからしか動かないという性質があります。そのため、止めた時点でキャッシュはもう切れています。切れる前に何かをするには、離席している間に動く仕組みが必要です。

2026 年 9 月ごろ、Claude Code に Claude Mods という仕組みが追加されました。TypeScript の関数をフックとして登録できるもので、その中に `$.clock.every` というタイマーがあります。これを使って、離席が続いたら自動で `/compact` を実行する mod を作りました。この記事では、その mod のコードと、閾値を 55 分に決めた理由、1 時間放置して確かめた結果を紹介します。

> [!NOTE]
> Claude Mods は 2026 年 9 月時点で early access で、使用するには環境変数 `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` が必要です。
> この記事の内容は Claude Code 2.1.278 で確認しました。

## 入力を止めるフックでは間に合わない場面

前の記事のフックは、キャッシュが切れたあとの入力を終了コード 2 で止めます。止められたあとに選択できるのは `/clear`、またはトークン消費が高くなることを承知で会話を続けることでした。
ただし、有効期間が切れたあとに `/compact` を選択すると、履歴の全体を未キャッシュで処理し直すことになります。[公式ドキュメント](https://code.claude.com/docs/en/prompt-caching)は、`/compact` の要約リクエストについて「After a break longer than the cache lifetime, there is no cache left to read, so the summarization request reprocesses the full history as uncached input」と書いています。

つまり、要約のリクエストがキャッシュから履歴を読み込めるのは、有効期間が切れる前だけです。切れる前に compact を済ませておけば、会話を捨てずに、次の入力が読み込むキャッシュを小さく作り直せます。

前の記事で集計した 38,500 件のうち、間隔が 60 分以上のリクエストは 129 件でした。この 129 件は 1 件あたりのコストがキャッシュの適用されていたリクエストの 10.57 倍で、うち 74 件はそのセッションで最もコストの高いリクエストです。この 1 回を避けるために、離席中に動く仕組みを作成します。

## シェルフックに経過時間を測る手段が無い理由

シェルフックが実行されるのは、Claude Code が何かをしたときだけです。`SessionStart` はセッションが始まったとき、`UserPromptSubmit` は入力が送られたとき、`Stop` は応答が終わったときに実行されます。離席している間は何も起きないので、フックも実行されません。

前の記事で `Stop` に終了時刻をファイルへ書かせ、`UserPromptSubmit` でその時刻からの経過を計算していたのは、この制約のためです。経過時間そのものは計算できるのですが、計算できるのは次に入力が送られたときであって、その途中ではありません。

離席の途中で何かをするには、Claude Code の外に常駐するプロセスが必要でした。cron で定期的に起こすか、tmux のセッションを別に立ち上げて監視させるかです。どちらも、Claude Code の状態を外から推定することになります。

## Claude Mods で追加した機能

Claude Mods の mod は、`register(on, options)` を export する TypeScript のモジュールです。`on` でイベントを購読し、コールバックの第 1 引数 `$` から Claude Code の機能を呼び出します。

今回の mod で使う機能は 3 つです。

`$.clock.every(ms, fn)` は、`ms` ごとに `fn` を実行し続けます。返却されるのは `cancel()` を持つオブジェクトで、これを呼ぶとタイマーは停止します。1 周期につき 1 回 `clock.every` イベントが発生するため、他のフックに拒否されればその時点で周期は終わりです。

`$.session.compact()` は、`/compact` と同じ処理を実行します。違いは trigger が `plugin` になることだけで、呼び出し元以外のすべてのフックと本体の処理をそのまま通るため、他のフックが拒否すれば結果は `{ skip }` になります。この `skip` は真偽値ではなく、拒否の理由を表す文字列です。ただし、呼び出せるのはターンの合間だけです。ターンの実行中に呼ぶと reject されるので、コールバックの側で受け止めて次の周期へ回す必要があります。

`$.ui.log(text)` は、transcript に薄い色の行を 1 行追加します。この行はモデルへ送られないため、mod の動作を確認する用途に使えます。

フックの実行には 10 秒の予算がありますが、タイマーのコールバックはフックの実行ではないため、この予算の対象外です。約 57 秒かかった compact が、途中で打ち切られずに完了しました。

## mod を作る

mod を動かすのに必要なファイルは 3 つで、置き場所のディレクトリの名前は何でもかまいません。

まず、プラグインのマニフェストを `.claude-plugin/plugin.json` に作成します。`userConfig` に書いた項目は、利用者が設定で上書きできます。

```json cache-ttl-compact/.claude-plugin/plugin.json
{
  "name": "cache-ttl-compact",
  "version": "0.1.0",
  "description": "離席が続いてプロンプトキャッシュの 1 時間 TTL が失効する前に、conversation を自動で compact する。session.start でタイマーを開始し、turn.complete ごとに最終操作時刻を更新して、閾値を超えたら $.session.compact() を呼ぶ。",
  "author": { "name": "sui" },
  "userConfig": {
    "idleMinutes": {
      "type": "number",
      "title": "compact するまでの無操作時間 (分)",
      "description": "最後のターンが終わってからこの分数が過ぎたら compact する。プロンプトキャッシュの 1 時間より手前に置く。",
      "required": false,
      "default": 55
    },
    "tickMinutes": {
      "type": "number",
      "title": "経過時間を確認する間隔 (分)",
      "description": "この間隔で無操作時間を確認する。間隔がそのまま検知の遅れの上限になる。",
      "required": false,
      "default": 1
    }
  }
}
```

`userConfig` の 2 項目は、どちらも `default` を書いてあるので `required` を false にしてあります。利用者が何も設定しなければ、ここに書いた 55 と 1 がそのまま `register` の第 2 引数へ渡ります。

次に、hooks module の場所を `hooks/hooks.json` に作成します。Claude Code はこのファイルを読んで、どの TypeScript のファイルをフックとして読み込むかを決めます。

```json cache-ttl-compact/hooks/hooks.json
{
  "description": "session.start で $.clock.every のタイマーを開始し、turn.complete (メインループのみ) で最終操作時刻を更新する。無操作が idleMinutes を超えた周期で $.session.compact() を呼び、プロンプトキャッシュの 1 時間 TTL が失効する前に conversation を短くする。session.end でタイマーを停止する。",
  "modules": ["./register.ts"]
}
```

読み込まれるのは `modules` に並べたパスだけで、相対の起点は `hooks.json` を置いたディレクトリです。

最後に、mod の本体となる `hooks/register.ts` を作成します。

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
    $.ui.log(
      `${idleMs / MINUTE} 分の無操作で compact します ` +
        `(確認の間隔は ${tickMs / MINUTE} 分)`,
    )

    timer?.cancel()
    timer = $.clock.every(tickMs, async () => {
      if (done) return

      const elapsed = (await $.clock.now()) - lastTurnEndedAt
      if (elapsed < idleMs) return

      done = true
      try {
        const result = await $.session.compact()
        // skip は boolean ではなく理由の文字列。空文字も string に含まれるため、
        // if (result.skip) では compact 済みの型まで絞り込めない。
        if (result.skip !== undefined) {
          $.ui.log(`他のフックが compact を拒否しました (${result.skip})`)
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

読んでほしいのは `turn.complete` のほうです。無操作の起点をここに置いているので、作業を続けている間は compact される時刻が後ろへずれ続けます。`agentId` があるターンを除いているのは、サブエージェントのリクエストがメインの会話のキャッシュを読まないためです。サブエージェントが動いていても、メインの会話のキャッシュの有効期間は延びません。

時刻を `Date.now()` ではなく `$.clock.now()` で取得しているのは、この呼び出しが host を通るためです。`claude plugin test <ディレクトリ>` で実行するテストからは `claude-code/testing` の `mock.clock` で時計を差し替えられるので、1 時間待たずに動作を確かめられます。

なお、1 行目の `import type { On, PluginOptions, Timer } from 'claude-code'` は、このままでは「モジュール 'claude-code' が見つかりません」という型エラーになります。`claude-code` というモジュールの実体は Claude Code 自身が書き出す宣言ファイルで、npm には公開されていないからです。mod のディレクトリでセッションを開き、`/plugin-types` を実行すると生成されます。

```text
Wrote .claude/types/claude-code.d.ts: the plugin API (module 'claude-code', early access:
it may change between releases) and 22 built-in tools.
Wrote .claude/types/claude-code-plugins.d.ts: no enabled plugin names a type contract
(plugin.json `types`), so it declares nothing.
Wrote .claude/types/claude-code-mcp.d.ts: no MCP tools are connected, so it is empty
(every mcp__* tool stays loosely typed).
Point the plugin's tsconfig.json (or jsconfig.json) at them: "include": [".claude/types",
"hooks"] with "lib": ["es2023"] and "jsx": "react", "jsxFactory": "h"
```

最後の行が示すとおり、出力された `.claude/types` を tsconfig の `include` に入れると型エラーが解消します。これに沿って書いたのが、実際に `tsc` を通した次の tsconfig です。

```json cache-ttl-compact/tsconfig.json
{
  "compilerOptions": {
    "lib": ["es2023"],
    "jsx": "react",
    "jsxFactory": "h",
    "types": [],
    "noEmit": true,
    "strict": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "target": "es2023"
  },
  "include": [".claude/types", "hooks"]
}
```

`noEmit` から下は普通の TypeScript のプロジェクトと同じ設定ですが、`"types": []` だけは理由があります。mod を既存のリポジトリの中に置いたところ、祖先の `node_modules` にある `@types/node` が自動で読み込まれ、`URL` や `crypto` や `performance` の宣言が `claude-code.d.ts` の宣言と衝突して 7 件のエラーになったためです。hooks module は Node でも DOM でもない環境で動くので、`@types` の自動読み込みは要りません。

この宣言ファイルが必要なのは、型を確かめるときだけです。`claude-code.d.ts` の冒頭にも「at run time the import is empty」と書いてあるとおり、`import type` は型だけの取り込みなので、Claude Code が `register.ts` を読み込んで動かす際には何も解決されません。

それでも生成する価値はありました。私は最初 `$.session.compact()` の結果を `if (result.skip)` で分岐させていたのですが、`tsc` が通らずに気づきました。宣言ファイルを読むと `skip` は真偽値ではなく `string` で、空文字も `string` に含まれるため、真偽での判定では compact 済みの型まで絞り込めません。上のコードが `!== undefined` で判定しているのはこのためです。

ファイルが揃ったら、セッションで動かす前に静的に確認します。

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

`promptCacheTtl` を `1h` にしているので、キャッシュが失効するのは最後のリクエストから 60 分後です。閾値を 60 分ちょうどに置くと間に合いません。理由が 3 つあります。

1 つめは、compact 自体に時間がかかることです。閾値を 2 分に下げて計測したところ、`$.session.compact()` の呼び出しから完了まで約 57 秒でした。別の実行では 1 分を超えています。compact が始まった時点ではなく、終わった時点が失効の時刻より前にある必要があります。

2 つめは、確認の間隔です。`$.clock.every` は指定した間隔でしか実行されないので、無操作が閾値を超えてから検知されるまでに、最大で間隔 1 つぶんの遅れが出ます。既定の 1 分なら最大 1 分です。

3 つめは、起点のずれです。`turn.complete` が実行されるのは、そのターンの最後の API リクエストより後です。mod が測っている経過時間は、キャッシュの側で数えられている経過時間より短くなります。ターンの中でツールを何度も実行していた場合、この差は大きくなります。

この 3 つを足すと数分になります。そこで既定値は 55 分にしました。5 分の余裕があれば、57 秒の compact と 1 分の遅れは収まります。

## 1 時間放置して確かめる

以下の結果は、`promptCacheTtl` と `subagentPromptCacheTtl` をどちらも `1h` にした状態で計測したものです。

まず、仕組みそのものを短い閾値で確認しました。閾値 2 分、確認の間隔 1 分にして、「おはよう！」と 1 回送ってから放置します。

| 時刻 | 出来事 |
|---|---|
| 15:37:38 | 起動 |
| 15:37:59 | 「おはよう！」を送信 |
| 15:40:38 頃 | タイマーの周期で `$.session.compact()` を呼び出し |
| 15:41:35 | 20,188 → 3,529 トークンに compact して完了 |

タイマーのコールバックから呼んだ compact は、15:40:38 頃の呼び出しから 15:41:35 の完了まで約 57 秒かかりました。transcript にはこう表示されます。

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
| 15:48:5x | 最後のターンから約 2 分後、compact が始まる |

3 回の入力の間隔 90 秒は閾値の 2 分より短く、その間に compact は始まっていません。compact が始まったのは、最後の入力から約 2 分が過ぎた 15:48:5x です。`turn.complete` での更新が compact される時刻を後ろへずらしています。

最後に、既定値の 55 分のまま 1 時間放置しました。「おはよう！」と 1 回送ったあと、何も操作せずに待ちます。

| 時刻 | 出来事 |
|---|---|
| 15:44:22 | 起動 |
| 15:44:31 | 最後のターンが終了 |
| 16:40:2x | タイマーの周期で `$.session.compact()` を呼び出し |
| 16:41:21 | 15,729 → 3,321 トークンに compact して完了 |

最後のターンが終わった 15:44:31 から compact が完了した 16:41:21 までは 56 分 50 秒で、`promptCacheTtl` の 1 時間より 3 分 10 秒手前に収まりました。閾値の 55 分を超えたのは 16:39:31 ですが、確認の周期が毎分 22 秒に揃っていたため、実際の呼び出しは 16:40:2x になっています。compact 自体の所要は約 59 秒で、短い閾値で計測した約 57 秒と同じ水準でした。

transcript には次の 2 行が残ります。

```text
⏺cache-ttl-compact: 55 分の無操作で compact します (確認の間隔は 1 分)
⏺cache-ttl-compact: 56 分の離席を検知し、15729 → 3321 トークンに compact しました
```

「56 分」は `Math.round` を通した表示で、検知した時点の経過は 55 分 51 秒です。

## 使うときに確認すること

`pluginConfigs` が読み込まれる設定ファイルは、ユーザーの `~/.claude/settings.json`、`--settings`、そして組織の管理設定の 3 つだけです。プロジェクトの `.claude/settings.json` と `.claude/settings.local.json` に書いても無視されます。理由は[公式ドキュメント](https://code.claude.com/docs/en/plugins-reference)に書かれています。この 2 つのファイルはワークスペースの中にあるので、クローンしたリポジトリが値を仕込めば、プラグインのフックコマンドや MCP サーバーの設定へその値が流れ込みます。これを防ぐために、v2.1.207 で読み込みの対象から外れました。

実際に、`idleMinutes` を 2 と書いた `.claude/settings.json` のあるディレクトリで起動しても、`$.ui.log` に出るのは `plugin.json` の既定値の 55 でした。オプションを渡すなら `--settings` を使います。

```bash
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir ./cache-ttl-compact \
  --settings '{"pluginConfigs":{"cache-ttl-compact":{"options":{"idleMinutes":55,"tickMinutes":1}}}}'
```

`$.ui.log` の行には、Claude Code がプラグイン名を接頭辞として自動で付けるため、mod 側で同じ名前を書くと二重になります。

タイマーのコールバックが属しているのは、mod が読み込まれたときの環境です。mod のファイルを編集するとホットリロードが実行され、待機中のタイマーは古い環境ごと取り消されます。セッションを開いたまま `register.ts` を編集した場合、そのセッションのタイマーはもう動きません。

compact の完了後には `SessionStart` フックが `source` を `compact` として再実行されます。1 時間放置した実行でも、要約の直後に `SessionStart:compact says:` の行が並びました。約 59 秒という所要の大半は、登録していたフックのこの再実行が占めています。前の記事のフックは、この場合に経過時間の記録を削除します。自動の compact で作り直したキャッシュを、直後の入力で切れていると判定することはありません。

> [!WARNING]
> この mod は予告なく compact を実行します。作業の途中で会話が要約されて困る場合は、`idleMinutes` を長くするか、mod を読み込まないでください。

## まとめ

- Claude Mods の `$.clock.every` を使うと、離席している間に Claude Code の中でタイマーを動かせる。シェルフックには、Claude Code が動いていない間に実行される手段が無い
- タイマーのコールバックから `$.session.compact()` を呼べる。フックの 10 秒の予算には縛られず、約 57 秒かかった compact が完了した
- `$.session.compact()` はターンの合間でだけ呼べる。ターンの実行中は reject されるので、次の周期に回す
- 無操作の起点を `turn.complete` に置くと、作業を続けている間は compact が先送りされる。閾値 2 分に対し 90 秒おきに 3 回入力した間、compact は始まらなかった
- 閾値は 60 分ではなく 55 分にした。compact 自体に約 1 分、確認の間隔に最大 1 分、`turn.complete` の起点のずれの分だけ、失効の時刻より手前に置く必要がある
- 既定値の 55 分で 1 時間放置したところ、最後のターンから 56 分 50 秒で compact が完了した。1 時間の失効より 3 分 10 秒手前に収まった
- `$.session.compact()` の `skip` の型は `string` で、入るのは拒否の理由だった。`if (result.skip)` では絞り込めないので `!== undefined` で判定する
- `pluginConfigs` はユーザー設定、`--settings`、管理設定の 3 つからしか読み込まれない。プロジェクトの `.claude/settings.json` に書いても無視される

## 参考

https://github.com/anthropics/claude-code/issues/91870

https://github.com/anthropics/claude-code/blob/main/mods/README.md

https://code.claude.com/docs/en/prompt-caching

https://code.claude.com/docs/en/plugins-reference

https://code.claude.com/docs/en/hooks

https://suntory-n-water.com/blog/claude-code-next-morning-resume-cost

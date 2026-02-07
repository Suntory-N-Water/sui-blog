---
title: Claude Code にルールを強制させる Stop Hooks とBiome v2による仕組みづくり
slug: enforce-rules-with-stop-hooks-and-biome-v2
date: 2025-12-07
modified_time: 2025-12-07
description: AIに「ルールを覚えておいて」と頼むのは間違ったアプローチです。Claude CodeのHooksとBiome v2を使えば、規約違反を自動検知してAI自身に修正させる環境を構築できます。
icon: ⚖️
icon_url: /icons/balance_scale_flat.svg
tags:
  - ClaudeCode
selfAssessment:
  quizzes:
    - question: "Claude Codeに「ルールを覚えておいて」と頼むアプローチが機能しない理由として、最も適切なものはどれですか？"
      answers:
        - text: "LLMに自然言語でルールを詰め込みすぎると、全体のパフォーマンスが下がるため"
          correct: true
          explanation: "記事では「LLMに自然言語でルールを詰め込みすぎると、かえって全体のパフォーマンスが下がる」という構造的な限界が指摘されています。強制力のある静的解析による自動検知が必要です。"
        - text: "コンテキストウィンドウが埋まってトークンが足りなくなるため"
          correct: false
          explanation: "記事では「貴重なトークンとコンテキストウィンドウの浪費」と書いていますが、これは「ルールを守って」と繰り返し指摘することの問題であり、ルールを覚えておけない理由ではありません。"
        - text: "CLAUDE.mdに書いたルールは優先度が低く、忘れられやすいため"
          correct: false
          explanation: "記事では「強制力がなければ忘れて守られなくなる」と書いていますが、これはメモリファイルの優先度の問題ではなく、静的解析のような強制力がないことが本質的な問題です。"
        - text: "Pro プランでないとルールを長期記憶できないため"
          correct: false
          explanation: "記事でProプランに言及がありますが、プランによる記憶力の違いではなく、「その都度チャットで指摘するのはトークンの浪費」という文脈で使われています。"
    - question: "Stop Hooksが無限ループに陥る問題を解決するために使用するフラグは何ですか？"
      answers:
        - text: "stop_hook_active"
          correct: true
          explanation: "Claude Codeが提供している「現在Hooksの割り込み中か」を表す`stop_hook_active`フラグを呼び出しの最初に確認することで、Hookでエラーが報告済みだった場合はスキップできます。"
        - text: "最新のユーザー発言以降の編集をチェックするhasTypeScriptEdits()"
          correct: false
          explanation: "記事では「以前作成したHooksでは、最新のユーザー発言以降に編集があったかをチェックしていました。しかし...永遠にHooksが発動し続ける状態になりました」と明記されており、この方法では解決できませんでした。"
        - text: "transcript_pathを確認して編集の有無を判定する"
          correct: false
          explanation: "transcript_pathは実装で使われていますが、これは編集検知のためであり、無限ループを解決する仕組みではありません。"
        - text: "blockingError()の戻り値で次回スキップを指示する"
          correct: false
          explanation: "blockingError()はエラーをClaude Codeに通知する関数ですが、次回のHook実行をスキップする機能はありません。無限ループを防ぐにはstop_hook_activeフラグの確認が必要です。"
---
2025 年 12 月現在、私たちのコーディング環境は過去に戻れないほどの劇的な変化を遂げました。それは Claude Code といった**コーディングエージェント**の登場です。
コーディングエージェントの衝撃を表した記事 [CLINEに全部賭けろ](https://zenn.dev/mizchi/articles/all-in-on-cline)では「***Cline は真のイノベーションの入口であり、そして開けてはいけないパンドラの箱でもあったと思う。***」と語られています。その中でも現時点でシェアが一番高いのは Claude Code でしょう。
かつて GitHub Copilot が担っていた「IDE 上の補佐役」という地位は、ターミナルで直接シェルを操作する Claude Code へと移り変わりました。この圧倒的なスピード感と効率性に一度慣れてしまうと、もはや昨年の開発スタイルを思い出せないほどです。正直な話、私も昨年どんなふうに開発をしていたのかまったく覚えていません。今思えばよく Claude Code なしで開発できたな…と思ってしまうくらいのインパクトです。微細な修正から大規模なリファクタリングまで、人間が手を動かすよりも AI に任せた方が、はるかに正確で、何より速い。それが今の私たちの「当たり前」になりつつあります。

## AI に「ルールを覚えておいて」が通用しない理由

しかし、この快適な開発体験は長続きしません。開発が進みセッションが長期化すると、Claude Code は「コーディング規約をうっかり忘れる」という致命的な問題に直面します。

少しスケールが大きい話になってしまいますが、人間社会においてルールや法律が機能するのはなぜでしょうか。それは、ルールを破った際の罰則や、それを取り締まる警察という強制力、極端な言い方をすれば「**暴力装置**」が存在するからです。

同じことがシステム開発の現場にも当てはまります。ドキュメントの記述だけでは、秩序は保たれません。これは Claude Code も同様です。メモリファイルである `CLAUDE.md` に「any 型は禁止」「関数の引数が 2 個以上あるときにオブジェクト形式にする」といくら記述しても、強制力がなければ、その指示はいずれ忘れて守られなくなります。

私は Claude Code を Pro プランで契約しているため、その都度チャットで「ルールを守って」と指摘するのは、貴重なトークンとコンテキストウィンドウの浪費でしかありません。一方で、Claude Code の成果物を人間が逐一レビューし修正するのは、「開発効率を上げる」という本来の目的と矛盾します。

Claude Code の書き方を指摘した記事、[Writing a good CLAUDE](https://www.humanlayer.dev/blog/writing-a-good-claude-md) では、「***LLM に自然言語でルールを詰め込みすぎると、かえって全体のパフォーマンスが下がる***」という構造的な限界も指摘されています。つまり、Claude Code に「ルールを覚えておいて」と頼むこと自体が、エンジニアリングのアプローチとして間違っているのです。

では、Claude Code の記憶力にも、人間のレビューにも頼らず、「ルールを守らざるを得ない環境」を作るにはどうすればよいのでしょうか。
答えは、Claude Code に対する**暴力装置**、すなわち**静的解析による自動検知**の実装です。

## Claude Code Hooks と Biome v2 による自動修正のしくみ

Claude Code には、処理の実行前やツールの実行後に任意のコマンドを強制実行できる Hooks という機能があります。本記事では、この Hooks を活用し、Claude Code がコードを書いて作業を停止したあとに Biome v2 による静的解析を走らせ、違反があれば「自身に修正させる」というフローを作成していきます。

Biome v2 では、カスタムルールを記述できるため、プロジェクト固有の複雑な制約も自動検証できるようになりました。これにより、従来のリンターでは実装できなかった「オレオレルール」を機械的に定義できます。
よろしければ、以前書いたこちらの記事を見てください！

https://suntory-n-water.com/blog/delegate-coding-rules-to-biome

Hooks の中でも Stop Hooks は、Claude Code がファイルを編集した直後に任意のコマンドを自動実行できるしくみです。このしくみにより、コード作成と検証のサイクルを人間の介入なしで自動化できます。

このしくみのメリットは、明確なエラーログによるフィードバックにあります。以前は、「関数の引数が 2 個以上あるときにオブジェクト形式にしてください」といった指示を自然言語で何度も繰り返す必要がありました。しかし、Biome v2 のカスタムルールでこれを定義すれば、AI はエラー内容に基づいて修正を開始します。あいまいな自然言語の指示よりも、機械的なエラーログの方が圧倒的に効率が良いです。

しかし、ここで注意が必要です。単に `tsc` や `lint` といったコマンドを Hooks に組み込むだけでは、大量のエラーログが AI にとってのノイズとなり、返って混乱を招くだけです。AI が効率的に修正できるよう、エラー出力を最適化し、必要な情報だけを提示する「Stop Hooks」の設計が重要になります。

## 初期実装から見えた課題

まずはシンプルに、TypeScript のファイルが編集されたら型チェックを実行するという Stop Hooks を作成しました。この内容は以前、参考記事や私のブログで紹介したもので、これにより単純な型エラーの見落としは防げるようになりました。
こちらもよろしければ、見てください！

https://suntory-n-water.com/blog/dont-forget-check-typescript-types-stop

しかし、このしくみを実務レベルで運用し始めると、すぐに改善点が見えてきました。主な問題は 2 つあります。

1 つ目は、**型チェック以外にもさまざまなチェックを実行したい**という点です。コード品質を保つためには、フォーマッターやリンター、型チェック、テストなどさまざまな検証が必要になります。型チェックは手っ取り早く実装できましたが、実際のプロジェクトでは、当然フォーマットやリンター、テストなども実行したいはずです。これらを個別の設定ファイルに記載していくと、設定ファイルである `settings.json` の設定が肥大化し、返って管理コストが増大します。

2 つ目は、**エラー出力に無駄な情報が多すぎる**という点です。型チェックやリントのエラーメッセージは、人間が読むために設計されています。そのため、色付けや装飾、補足情報が多く含まれており、これをそのまま AI に渡すと、エラーの本質以外の情報でコンテキストウィンドウが埋まってしまいます。以前作った Stop Hooks では、このフィルタリングが不十分だったため、大量のノイズが AI に送られていました。

正直なところ、AI にとって必要なのは「どのファイルの何行目で、どういったエラーが起きているか」という情報だけです。AI はそこから処理を開始するため、不必要な情報は極力排除したほうが、トークンの削減につながります。

これらの経験から、人間用に設計された CLI ツールをそのまま AI につなぐだけでは不十分だと分かりました。人間にとって親切な色付けや詳細な説明は、AI にとってはノイズでしかありません。複数のチェックコマンドを束ねつつ、AI が修正するために必要な情報、つまりエラー箇所と内容だけを高密度に渡すしくみが必要になります。

## 実装

実際に Hooks を作ってみましょう。今回も以前作成した時と同様に、`cc-hooks-ts` という Claude Code の出力を TypeScript で型安全に実行できるライブラリを使用して作成しました。

https://github.com/sushichan044/cc-hooks-ts

主な設計思想は以下の 2 つです。

1 つ目は、先ほど述べた通り、フォーマッター・リンター・型チェックなどを一度に行うことです。拡張性を備えるため、起動引数から実行するコマンド名を受け取るしくみにしました。Claude Code は、実際のコマンドを利用するときに起動したディレクトリにあるスクリプトを実行可能です。

https://code.claude.com/docs/en/hooks

たとえば、プロジェクト A で package.json に format というスクリプトがあれば、そこで起動した Claude Code が format に書いてあるコマンドを実行できます。そのため、今回の実装では、package.json にあるコマンドの名称を起動引数で設定して、複数のコマンド実行が可能なように設計しました。

2 つ目は、Claude Code へ必要な情報だけを渡すことです。先ほど述べた通り、通常のコマンドは人間用に作られているため、無駄な情報、たとえば色付けやエラーが起きたコードの実際の行数などを視覚的にわかりやすく表示しています。
しかし、これは AI にとってトークンを無駄に消費するノイズです。そのため、エラーが起きている事実とその場所、内容だけを必要最小限にとどめることにしました。たとえば、Biome は `--reporter=github` オプションなどを活用し、 grep コマンドを通じてエラー行やワーニング行などをピンポイントで抜き出すようにしています。これにより、不要な情報はそぎ落とし、必要な内容だけを渡すことで、AI がエラーに集中して修正できる作業環境を作ることができました。

### ソースコード

以下が実装の全体像です。標準ツール以外に、Serena MCP による修正も検知対象としています。

```ts scripts/typescript/multi-command-check.ts
#!/usr/bin/env -S bun run --silent
import { parseArgs } from 'node:util';
import { $ } from 'bun';
import { defineHook, runHook } from 'cc-hooks-ts';
import { hasTypeScriptEdits } from './utils';

/**
 * コマンド実行結果を表す型
 */
type CommandResult = {
  /** コマンド名 */
  command: string;
  /** プロセス終了コード (0: 成功, その他: エラー) */
  code: number;
  /** 標準出力の内容 */
  stdout: string;
  /** 標準エラー出力の内容 */
  stderr: string;
};

/**
 * コマンドライン引数から -c オプションの値を取得する
 */
function getCommandsFromArgs(): string | undefined {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      c: { type: 'string' },
    },
    strict: true,
    allowPositionals: false,
  });
  return values.c;
}

/**
 * カンマ区切りの文字列をコマンド配列に変換する
 */
function parseCommands(commandsStr: string): string[] {
  return commandsStr
    .split(',')
    .map((cmd) => cmd.trim())
    .filter((cmd) => {
      if (cmd.length === 0) return false;
      // 危険な文字を含むコマンドを拒否
      if (/[\s;|&$`<>()]/.test(cmd)) return false;
      return true;
    });
}

/**
 * 指定されたコマンドを実行する
 */
async function runCommand(
  command: string,
  cwd: string,
): Promise<CommandResult> {
  const proc = await $`bun run ${command}`.cwd(cwd).nothrow().quiet();

  return {
    command,
    code: proc.exitCode,
    stdout: proc.stdout.toString(),
    stderr: proc.stderr.toString(),
  };
}

/**
 * コマンド実行結果からエラーメッセージを生成する
 */
function formatErrorMessage(results: CommandResult[]): string | undefined {
  const failures = results.filter((r) => r.code !== 0);

  if (failures.length === 0) {
    return undefined;
  }

  const errorMessages = failures
    .map((f) => {
      // stdout と stderr の両方を含めて 型チェック で stderr に出力がある場合でも
      // 個別の結果を返却させるようにする
      const outputs = [f.stdout, f.stderr].filter(Boolean);
      const output =
        outputs.length > 0 ? outputs.join('\n') : 'No output captured';
      return `\x1b[31m❌ Command failed: bun run ${f.command}\x1b[0m\n${output}`;
    })
    .join('\n\n');

  return `\x1b[31mSome commands failed. Fix the following errors:\x1b[0m\n\n${errorMessages}`;
}

/**
 * コマンド実行結果から成功メッセージを生成する
 */
function formatSuccessMessage(results: CommandResult[]): string {
  const commandList = results.map((r) => r.command).join(', ');
  return `All commands passed: ${commandList}`;
}

export const multiCommandCheckHook = defineHook({
  trigger: {
    Stop: true,
  },

  run: async (c) => {
    // すでにHookで継続中なら実行しない
    if (c.input.stop_hook_active) {
      return c.success();
    }
    // コマンド引数から -c オプションを取得
    const commandsStr = getCommandsFromArgs();

    // 設定されていない場合は誤爆防止で success を返す
    if (!commandsStr) {
      return c.success();
    }

    const transcriptPath = c.input.transcript_path;
    const cwd = c.input.cwd;

    // TypeScript ファイルの編集がなかった場合はスキップ
    const hasEdits = hasTypeScriptEdits(transcriptPath);

    if (!hasEdits) {
      return c.success();
    }

    // コマンドをパースして実行
    const commands = parseCommands(commandsStr);

    if (commands.length === 0) {
      return c.success();
    }

    const results: CommandResult[] = [];

    // コマンドを順次実行
    for (const command of commands) {
      const result = await runCommand(command, cwd);
      results.push(result);
    }

    // エラーがあればブロッキングエラーを返す
    const errorMessage = formatErrorMessage(results);

    if (errorMessage) {
      return c.blockingError(errorMessage);
    }

    // 全て成功
    return c.success({
      messageForUser: formatSuccessMessage(results),
    });
  },
});

if (process.env.NODE_ENV !== 'test') {
  await runHook(multiCommandCheckHook);
}
```

```ts scripts/typescript/utils.ts
/**
 * transcriptを確認して最新ユーザーメッセージ以降でTypeScriptファイルの編集があったかチェックする
 */
export function hasTypeScriptEdits(transcriptPath: string): boolean {
  if (!existsSync(transcriptPath)) {
    return false;
  }

  try {
    const content = readFileSync(transcriptPath, 'utf-8');
    const lines = content
      .split('\n')
      .filter((line) => line.trim())
      .reverse();

    // 最新のユーザーメッセージのタイムスタンプを見つける
    const lastUserTimestamp = (() => {
      for (const line of lines) {
        try {
          const msg: TranscriptEntry = JSON.parse(line);
          if (
            msg.type === 'user' &&
            !msg.message.content.startsWith('Stop hook feedback:')
          ) {
            return msg.timestamp;
          }
        } catch {
          // JSONパースエラーを無視
        }
      }
    })();

    if (!lastUserTimestamp) {
      return false;
    }

    // 最新ユーザーメッセージ以降のassistantメッセージでTypeScript編集をチェック
    for (const line of lines.reverse()) {
      try {
        const msg: TranscriptEntry = JSON.parse(line);
        if (msg.type === 'assistant' && msg.timestamp > lastUserTimestamp) {
          for (const content of msg.message.content) {
            if (
              content.type === 'tool_use' &&
              content.name &&
              isTypeScriptEditTool(content.name)
            ) {
              // file_path または relative_path のいずれかをチェック
              const filePath =
                content.input?.file_path || content.input?.relative_path;
              if (
                filePath &&
                isTypeScriptFile(filePath, TYPE_SCRIPT_EXTENSIONS)
              ) {
                return true;
              }
            }
          }
        }
      } catch {
        // JSONパースエラーを無視
      }
    }

    return false;
  } catch {
    return false;
  }
}
```

```ts scripts/types/claude-output.ts
import type { ToolSchema } from 'cc-hooks-ts';

/**
 * transcript JSONLファイル内の1行(1つのメッセージエントリ)を表す型
 */
export type TranscriptEntry = UserEntry | AssistantEntry | SystemEntry;

/**
 * ユーザーメッセージ
 */
type UserEntry = {
  /** メッセージタイプ ('user': ユーザーメッセージ) */
  type: 'user';
  /** ISO8601形式のタイムスタンプ (例: "2025-09-28T01:33:41.977Z") */
  timestamp: string;
  /** ユーザーメッセージの内容 */
  message: {
    /** メッセージの役割 */
    role: 'user';
    /** ユーザーの入力内容(文字列) */
    content: string;
  };
};

/**
 * アシスタントメッセージ
 */
type AssistantEntry = {
  /** メッセージタイプ ('assistant': AIメッセージ) */
  type: 'assistant';
  /** ISO8601形式のタイムスタンプ (例: "2025-09-28T01:33:41.977Z") */
  timestamp: string;
  /** アシスタントメッセージの内容 */
  message: {
    /** メッセージ内のコンテンツ要素配列(テキスト、ツール使用など) */
    content: ContentElement[];
  };
};

/**
 * システムメッセージ
 */
type SystemEntry = {
  /** メッセージタイプ ('system') */
  type: 'system';
  /** ISO8601形式のタイムスタンプ (例: "2025-09-28T01:33:41.977Z") */
  timestamp: string;
  /** システムメッセージの内容 */
  message?: {
    /** システムメッセージのコンテンツ */
    content?: ContentElement[] | string;
  };
};

/**
 * メッセージ内の個別コンテンツ要素(テキストやツール使用)を表す型
 */
type ContentElement = {
  /** コンテンツタイプ ('tool_use': ツール使用, 'text': テキスト, その他) */
  type?: 'tool_use' | 'text' | string;
  /** ツール名 ('Edit': ファイル編集, 'MultiEdit': 複数ファイル編集, その他) */
  name?: keyof ToolSchema;
  /** テキストコンテンツ ('text'タイプの場合) */
  text?: string;
  /** ツール実行時の入力パラメータ */
  input?: {
    /** 編集対象ファイルの絶対パス (例: "/path/to/file.ts") */
    file_path?: string;
    /** 編集対象ファイルの相対パス (Serena MCPツール用) */
    relative_path?: string;
  };
};
```

### 設定ファイルなど

```json .claude/settings.json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bun run --silent -i ~/.claude/scripts/typescript/multi-command-check.ts -c format,lint:ai,type-check:ai"
          }
        ]
      }
    ]
  }
}
```

```json package.json
{
  "scripts": {
    "lint:ai": "set -o pipefail && biome lint . --reporter=github 2>&1 | { grep '^::' || true; }",
    "format": "biome format --write .",
    "type-check:ai": "tsc --noEmit --pretty false",
  },
}
```

## ハマった点と解決策

ここでいくつか技術的な注意点を記載します。たとえば以下の 2 つです。

1 つ目は、**Stop Hooks が無限ループしてしまう**ことです。たとえば、あらかじめエラーになるコードを用意し、「修正せず、確認だけにしてください」と指示した場合を考えてみます。すると、エラーが起きた→コードを作成する→エラーが起きる→Stop Hooks が実行される→Claude がエラーが起きてますと報告する→また Stop Hooks が起こる、といった具合にエラーの内容が延々と繰り返され、Claude Code がどうしようもなくなってしまいます。

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Claude as Claude Code
    participant Hook as Stop Hook

    User->>Claude: test.ts修正して
    Claude->>Claude: 編集完了 (uuid: b29f5a6c)
    Claude->>Hook: Stop Hook発動 (stop_hook_active: false)
    Hook->>Hook: hasTypeScriptEdits() → true
    Hook->>Hook: Lintエラー検出
    Hook-->>Claude: blockingError() で継続させる
    Claude->>Claude: 「エラーが検出されました」(uuid: 6584e89b)
    Note over User,Hook: ⚠️ ここから無限ループ開始
    Claude->>Hook: Stop Hook再発動 (stop_hook_active: false)
    Hook->>Hook: hasTypeScriptEdits() → true (前の編集が残ってる)
    Hook->>Hook: 同じLintエラー
    Hook-->>Claude: blockingError()
    Claude->>Claude: 「検証が完了しました」(uuid: ad5ae94f)
    Claude->>Hook: Stop Hook再発動 (stop_hook_active: false)
    Hook->>Hook: hasTypeScriptEdits() → true (まだ残ってる)
    Hook-->>Claude: また同じエラー
    Claude->>Claude: 説明メッセージ...
    Note over User,Hook: この繰り返しが無限に続く
```

作業指示が与えられていないのにエラーが出ているから作業しなければいけない、というがんじがらめの状態になってしまうのです。

私が以前作成した Hooks では、最新のユーザー発言以降に編集があったかをチェックしていました。

https://github.com/Suntory-N-Water/claude-code-settings/blob/main/scripts/typescript/utils.ts#L90-L137

しかし、そもそも Claude Code が「分かりました」とエラーがあっても作業を停止しなかった場合、その返答も最新のユーザー発言以降に含まれてしまうため、さきほどの編集を再検知してしまい、永遠に Hooks が発動し続ける状態になりました。
これを解決するためには、Claude Code が提供している「現在 Hooks の割り込み中か」を表す `stop_hook_active` フラグがあるため、これを呼び出しの最初に確認することで、Hook でエラーが報告済みだった時はスキップするようにしています。

https://code.claude.com/docs/en/hooks#stop-and-subagentstop-input


2 つ目は、**パイプ処理によってエラーが消えてしまう**ことです。明らかにリントエラーが発生するコードを作成したのに、Hooks が成功と判定され、Claude Code がそのまま処理を進めてしまうことが発生しました。
これは本当に基本的な話なのですが、出力フィルタリングの時に書いた grep のパイプ処理が原因です。
そのときのコマンドは `biome check . --reporter=github 2>&1 | grep '^::'` となっていたため、Biome がコードにエラーがあって EXIT コード 1 を返却しても、後ろの grep がエラー行を見つけて正常終了してしまうと、bash の仕様で全体の終了コードが成功(=0)となってしまうのです。
解決策として、`set -o pipefail` をコマンドの先頭に付与して、パイプラインの途中でエラーがあれば全体の終了コードをエラー(≠0)にすることで、正しくエラーを検知できました。

## まとめ

- AI にルールを「覚えておいて」と頼むだけでは、長期的にコーディング規約は守られない
- プロンプトだけでなく、Stop Hooks と静的解析による強制力が必要である
- Claude Code は Stop Hooks によって、ファイル編集後に自動でチェックを実行し、AI 自身に修正させることができる
- Biome v2 のカスタムルールを使えば、プロジェクト固有のルールも機械的に定義できる
- 人間用の CLI ツール出力をそのまま AI に渡すとノイズになるため、エラー箇所と内容だけに絞った出力設計が重要である
- 複数のチェックコマンドを統合し、必要な情報だけを渡すしくみを作ることで、AI は効率的に修正できる

## 参考

https://www.humanlayer.dev/blog/writing-a-good-claude-md

https://code.claude.com/docs/en/hooks-guide
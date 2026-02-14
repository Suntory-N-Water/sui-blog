---
title: 仕組みでカバーするStop Hooksで忘れないTypeScriptの型チェック
slug: dont-forget-check-typescript-types-stop
date: 2025-09-28
modified_time: 2025-09-28
description: Claude CodeのStop Hooksを使って、TypeScriptの型チェックを自動実行する仕組みを実装します。物忘れを仕組みでカバーして、効率的な開発フローを実現します。
icon: 😤
icon_url: /icons/face_with_steam_from_nose_flat.svg
tags:
  - TypeScript
  - ClaudeCode
---

> [!TIPS]
> この記事は誤字・脱字のチェック以外、温もりのある人間の手で書かれています

Claude Code は、処理の開始や終了時に特定のコードを実行できる「Hooks」という仕組みがあります。

https://docs.claude.com/en/docs/claude-code/hooks-guide


https://docs.claude.com/en/docs/claude-code/hooks

今回は、TypeScript で出力が終わった後に型チェックを実行する Hooks を実装し、Claude Code に特段指示をしなくてもいいように効率化した事象を紹介します。
## 物忘れを仕組みでカバーする
経緯として、Claude Code は「ファイル修正後は、型チェックを実行してください」と指摘しても忘れてしまうことが多く、これが原因で作成したコードにエラーが残ったまま放置するといった事象が多発します。
毎回指示をしても良いのですが、そのためにコンテキストを消費するのも嫌ですし、何より面倒です。
定型作業を楽にするのが我々エンジニアなので(?)、今回は TypeScript のファイルを修正した場合に限り型チェックを実行する Hooks を作成します。

## 課題

単純に実装するなら「出力が終わったら型チェックを実行する shell」で解決します。
しかし、この方法には 2 つの課題があります。

1 つ目は、TypeScript 以外のファイルを編集したときでも、型チェックが実行されてしまう点です。
関係ないコードに対しても型チェックが実行されてしまうため、無駄な処理になってしまいます。

2 つ目は、実際には編集していないにもかかわらず、型チェックを実行してしまう点です。
本来の用途では、コードを編集または作成したときに限って型チェックを行うのが理想です。そのため編集していないにもかかわらず、型チェックをするのは少しやりすぎな気がします。
生成されたコードは、型チェックが既に終わっている状態とした方が、コーディングにおいて良い状態です。

上記のような課題から、コードを生成するたびに型チェックを実行しても良いのですが、この場合別の課題が発生します。
都度編集している場合、ファイル更新のたびに型チェックが実行されてしまう点です。
Claude Code などの AI エージェントは import 文を追加してから徐々にコードを編集、作成していく傾向が見られます。
その都度型チェックを実行してしまうと、ファイル編集のたびにチェックが実行され、まだ作成途中なことから確定で型エラーになってしまうことです。
こういった場合、出力するコードに影響が発生する可能性が考えられます。

## 実装方針

上記のような課題から、Stop Hooks で会話ごとに型チェックを実行するのが適切だと判断しました。
具体的には以下のとおりです。
- ユーザーがファイルの編集・作成を依頼し、その会話が終了したときに実行
- 会話の中で TypeScript の関連ファイル(`.ts` や `.tsx`)を修正したときに実行
	- 編集していなければ、型チェックは実行しない。

今回の Claude Code の Hooks を TypeScript で実装できる `cc-hooks-ts` を使用しました。

https://github.com/sushichan044/cc-hooks-ts

Hooks は shell で書かれるのが一般的なイメージですが、個人的な意見としては TypeScript と比較して可読性が低いと考えています。
実行環境が必要といった別の問題もありますが、普段から触っている TypeScript で書ける方が理解もしやすく、扱いやすかったため選択しました。

## 実装したコード

```ts scripts/typescript/use_typecheck.ts
#!/usr/bin/env -S bun run --silent
import { spawnSync } from 'bun';
import { defineHook, runHook } from 'cc-hooks-ts';
import { extname } from 'pathe';
import { existsSync, readFileSync } from 'node:fs';
import type { TranscriptEntry } from '../types/claude-output';

/**
 * TypeScript型チェックコマンド (`tsc --noEmit`) の実行結果を表す型
 */
type CmdResult = {
  /** プロセス終了コード (0: 成功, その他: エラー, null: 実行時エラー) */
  code: number | null;
  /** 標準出力の内容(通常は空) */
  stdout: string;
  /** 標準エラー出力の内容(型エラーメッセージなど) */
  stderr: string;
};

export const TYPE_SCRIPT_EXTENSIONS = ['.ts', '.tsx', '.cts', '.mts'];

/**
 * TypeScriptの型チェックを実行する
 * @returns 型チェックの結果
 */
export function runTypeCheck(): CmdResult {
  const proc = spawnSync(['bun', 'tsc', '--noEmit']);

  return {
    code: proc.exitCode,
    stdout: proc.stdout.toString(),
    stderr: proc.stderr.toString(),
  };
}

/**
 * ファイルパスが指定された拡張子パターンと一致するかチェックする
 * @param path - チェック対象のファイルパス
 * @param patterns - 拡張子パターンの配列
 */
export function isTypeScriptFile(path: string, patterns: string[]) {
  return patterns.includes(extname(path));
}

/**
 * transcriptを確認して最新ユーザーメッセージ以降でTypeScriptファイルの編集があったかチェックする
 * @param transcriptPath - transcriptファイルのパス
 * @returns TypeScriptファイルの編集があったかどうか
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
              (content.name === 'Edit' ||
                content.name === 'MultiEdit' ||
                content.name === 'Write') &&
              content.input?.file_path
            ) {
              const filePath = content.input.file_path;
              if (isTypeScriptFile(filePath, TYPE_SCRIPT_EXTENSIONS)) {
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

export const typecheckHook = defineHook({
  trigger: {
    Stop: true,
  },

  run: async (c) => {
    const transcriptPath = c.input.transcript_path;

    // このセッションでTypeScriptファイルの編集がなかった場合はスキップ
    const hasEdits = hasTypeScriptEdits(transcriptPath);

    if (!hasEdits) {
      return c.success();
    }

    const result = runTypeCheck();

    if (result.code === 0) {
      return c.success({
        messageForUser: 'Type check passed: tsc --noEmit',
      });
    }

    // 型エラーが発生した場合、Claudeに修正を指示
    const errorOutput =
      result.stdout || result.stderr || 'No error output captured';
    const errorMessage = `\x1b[31mTypeScript errors found. Fix the following errors:\x1b[0m\n\n${errorOutput}\n\n\x1b[31mUse correct types to resolve these errors.\x1b[0m`;

    return c.blockingError(errorMessage);
  },
});

if (process.env.NODE_ENV !== 'test') {
  await runHook(typecheckHook);
}
```

```ts scripts/typescript/types/claude-output.ts
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
  };
};

```

```json .claude/settings.local.json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bun run --silent -i ~/.claude/scripts/typescript/use_typecheck.ts"
          }
        ]
      }
    ]
  }
}
```

## 内容を検知する仕組み
たとえば Claude Code にこのような内容でチャットをしてみます。

![Claude Codeへのチャット入力例](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/0c0cc5fe0ded068f678c49924d5b0901.png)


その後 Claude Code との会話を確認すると、以下のような `jsonl` 形式のファイルに出力されていることが確認できます。
```jsonl
{"parentUuid":null,"isSidechain":false,"userType":"external","cwd":"/Users/{user}/.claude","sessionId":"ed8cd0a3-962b-4a71-aebd-73edfe16cdd3","version":"1.0.128","gitBranch":"main","type":"user","message":{"role":"user","content":"こんにちは、いい天気ですね！"},"uuid":"18b7c636-19c0-4199-8f42-ee2f5e8d22a2","timestamp":"2025-09-28T06:17:20.153Z","thinkingMetadata":{"level":"none","disabled":false,"triggers":[]}}
{"parentUuid":"18b7c636-19c0-4199-8f42-ee2f5e8d22a2","isSidechain":false,"userType":"external","cwd":"/Users/{user}/.claude","sessionId":"ed8cd0a3-962b-4a71-aebd-73edfe16cdd3","version":"1.0.128","gitBranch":"main","message":{"id":"msg_013C6yBZTawT46T1EpQpWtGN","type":"message","role":"assistant","model":"claude-sonnet-4-20250514","content":[{"type":"text","text":"こんにちは！お疲れさまです。\n\n何かお手伝いできることはありますか？コーディングやファイルの編集など、どのような作業をされたいでしょうか？"}],"stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":4,"cache_creation_input_tokens":25277,"cache_read_input_tokens":0,"cache_creation":{"ephemeral_5m_input_tokens":25277,"ephemeral_1h_input_tokens":0},"output_tokens":6,"service_tier":"standard"}},"requestId":"req_011CTaJz5ss7W9GKaVmBxwTV","type":"assistant","uuid":"73820097-c377-4b90-997f-c6bbc6575f80","timestamp":"2025-09-28T06:17:23.678Z"}
{"parentUuid":"73820097-c377-4b90-997f-c6bbc6575f80","isSidechain":false,"userType":"external","cwd":"/Users/{user}/.claude","sessionId":"ed8cd0a3-962b-4a71-aebd-73edfe16cdd3","version":"1.0.128","gitBranch":"main","type":"system","subtype":"informational","content":"\u001b[1mStop\u001b[22m [bun run --silent -i ~/.claude/scripts/stop_words.ts] completed successfully","isMeta":false,"timestamp":"2025-09-28T06:17:23.754Z","uuid":"3136ca85-f652-44d3-ab30-d26886e4cbfd","toolUseID":"37006b6c-d849-41fd-826d-dcf856f07957","level":"info"}
{"parentUuid":"3136ca85-f652-44d3-ab30-d26886e4cbfd","isSidechain":false,"userType":"external","cwd":"/Users/{user}/.claude","sessionId":"ed8cd0a3-962b-4a71-aebd-73edfe16cdd3","version":"1.0.128","gitBranch":"main","type":"system","subtype":"informational","content":"\u001b[1mStop\u001b[22m [bun run --silent -i ~/.claude/scripts/typescript/use_typecheck.ts] completed successfully","isMeta":false,"timestamp":"2025-09-28T06:17:23.754Z","uuid":"9c8650fe-1bd6-4e34-9789-fa057536c3ef","toolUseID":"37006b6c-d849-41fd-826d-dcf856f07957","level":"info"}
```

上記のファイルを `json` 形式にして、見やすくした形が以下のものです。
```json
[
  {
    "parentUuid": null,
    "isSidechain": false,
    "userType": "external",
    "cwd": "/Users/{user}/.claude",
    "sessionId": "ed8cd0a3-962b-4a71-aebd-73edfe16cdd3",
    "version": "1.0.128",
    "gitBranch": "main",
    "type": "user",
    "message": { "role": "user", "content": "こんにちは、いい天気ですね！" },
    "uuid": "18b7c636-19c0-4199-8f42-ee2f5e8d22a2",
    "timestamp": "2025-09-28T06:17:20.153Z",
    "thinkingMetadata": { "level": "none", "disabled": false, "triggers": [] }
  },
  {
    "parentUuid": "18b7c636-19c0-4199-8f42-ee2f5e8d22a2",
    "isSidechain": false,
    "userType": "external",
    "cwd": "/Users/{user}/.claude",
    "sessionId": "ed8cd0a3-962b-4a71-aebd-73edfe16cdd3",
    "version": "1.0.128",
    "gitBranch": "main",
    "message": {
      "id": "msg_013C6yBZTawT46T1EpQpWtGN",
      "type": "message",
      "role": "assistant",
      "model": "claude-sonnet-4-20250514",
      "content": [
        {
          "type": "text",
          "text": "こんにちは！お疲れさまです。\n\n何かお手伝いできることはありますか？コーディングやファイルの編集など、どのような作業をされたいでしょうか？"
        }
      ],
      "stop_reason": null,
      "stop_sequence": null,
      "usage": {
        "input_tokens": 4,
        "cache_creation_input_tokens": 25277,
        "cache_read_input_tokens": 0,
        "cache_creation": {
          "ephemeral_5m_input_tokens": 25277,
          "ephemeral_1h_input_tokens": 0
        },
        "output_tokens": 6,
        "service_tier": "standard"
      }
    },
    "requestId": "req_011CTaJz5ss7W9GKaVmBxwTV",
    "type": "assistant",
    "uuid": "73820097-c377-4b90-997f-c6bbc6575f80",
    "timestamp": "2025-09-28T06:17:23.678Z"
  },
  {
    "parentUuid": "73820097-c377-4b90-997f-c6bbc6575f80",
    "isSidechain": false,
    "userType": "external",
    "cwd": "/Users/{user}/.claude",
    "sessionId": "ed8cd0a3-962b-4a71-aebd-73edfe16cdd3",
    "version": "1.0.128",
    "gitBranch": "main",
    "type": "system",
    "subtype": "informational",
    "content": "\u001b[1mStop\u001b[22m [bun run --silent -i ~/.claude/scripts/stop_words.ts] completed successfully",
    "isMeta": false,
    "timestamp": "2025-09-28T06:17:23.754Z",
    "uuid": "3136ca85-f652-44d3-ab30-d26886e4cbfd",
    "toolUseID": "37006b6c-d849-41fd-826d-dcf856f07957",
    "level": "info"
  },
  {
    "parentUuid": "3136ca85-f652-44d3-ab30-d26886e4cbfd",
    "isSidechain": false,
    "userType": "external",
    "cwd": "/Users/{user}/.claude",
    "sessionId": "ed8cd0a3-962b-4a71-aebd-73edfe16cdd3",
    "version": "1.0.128",
    "gitBranch": "main",
    "type": "system",
    "subtype": "informational",
    "content": "\u001b[1mStop\u001b[22m [bun run --silent -i ~/.claude/scripts/typescript/use_typecheck.ts] completed successfully",
    "isMeta": false,
    "timestamp": "2025-09-28T06:17:23.754Z",
    "uuid": "9c8650fe-1bd6-4e34-9789-fa057536c3ef",
    "toolUseID": "37006b6c-d849-41fd-826d-dcf856f07957",
    "level": "info"
  }
]
```

Claude Code とのやり取りは `~/.claude/projects/{folder-name}/{uuid}.jsonl` に逐次追記されます。
ユーザーが送信した内容は `"type": "user"`、Claude Code からの応答は `"type": "assistant"` として記録されます。一連の応答処理が終了したあと、ユーザーによる手動中断を除いて Stop Hooks が実行されます。
今回実装したいのは、前述したとおり、最新の会話で TypeScript のファイルが編集されたときにだけ型チェックを実行することです。

Claude Code との一連の流れは、出力されたファイルの内容を確認し、`"type": "user",` かつ、content の中身が文字列ならそのセッションを起点と判断。
その中に TypeScript ファイルの編集が 1 つでも含まれていれば型チェックを実行する、という条件で実行していきます。

注意点として、`"type": "user",` でも Hooks による出力は除外することです。
実際のログの例を見ていきましょう。
```json
[
  {
    "parentUuid": "fa1fc913-7b13-4c72-8cf1-aeba84495e57",
    "isSidechain": false,
    "userType": "external",
    "cwd": "/Users/{user}/.claude",
    "sessionId": "eae1bb75-86c6-43ca-8474-0163366bb72e",
    "version": "1.0.128",
    "gitBranch": "main",
    "type": "user",
    "message": {
      "role": "user",
      "content": "Stop hook feedback:\n- [bun run --silent -i ~/.claude/scripts/typescript/use_typecheck.ts]: \u001b[31mTypeScript errors found. Fix the following errors:\u001b[0m\n\nscripts/typescript/use_typecheck_error.ts(2,7): error TS2322: Type 'string' is not assignable to type 'number'.\n\n\n\u001b[31mUse correct types to resolve these errors.\u001b[0m\n"
    },
    "uuid": "a74042a7-c049-4bbc-9f1c-e959b1a4d818",
    "timestamp": "2025-09-28T06:42:52.669Z"
  }
]
```

これは実際に Claude Code の Stop Hooks が動いたときのログです。
最初のログと見て分かる通り、Json の構造体が同じなため `"type": "user",` だけで User の入力としてしまうと誤検知してしまいます。
対策として、`Stop hook feedback` がないものをユーザーが指示したテキストとして設定しています。
```ts
if (
  msg.type === 'user' &&
  !msg.message.content.startsWith('Stop hook feedback:')
) {
  return msg.timestamp;
}
```

> [!NOTE]
> ここで利用している判定は、ログ出力が `"Stop hook feedback:"` で始まることを前提にしているため、公式に保証された仕様ではありません。
> Claude Code の内部実装が変わると誤検知の可能性がある点に注意してください。

実際に型チェックが成功するとこのようにエディタ上で怒ってくれます✌️
![Stop Hooksによる型チェックエラーのエディタ表示](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/fbea084e7204ab74b15a200f8453655e.png)

## まとめ

今回の実装では、Claude Code の Stop Hooks を用いて、TypeScript ファイルが編集されたセッションの終了時に自動で型チェックを走らせる仕組みを導入しました。  
これにより「型チェックを忘れる」という人的ミスを防ぎ、コンテキスト消費や手作業の手間を減らすことができます。  

この Hooks は Ts ファイルを編集したらコマンドを実行する、といったシンプルなものですので、リントなども実行可能です。
場合によってはコマンド自体を引数として渡しても良いかもしれませんね！
以上になります✊️


## おまけ(2025年9月30日、0時56分追記)
Serena MCP の編集だった場合、型チェックを実行しない事象が起きました。
この場合は以下のように編集すれば実施可能です。
`cc-hooks-ts` の型を拡張して、MCP 使用時にも検知します。

```ts
/**
 * ツールがTypeScriptファイル編集対象かどうかを判定する
 * @param toolName - 使用されたツール名
 * @returns TypeScriptファイル編集ツールかどうか
 */
export function isTypeScriptEditTool(toolName: keyof ToolSchema): boolean {
  return (
    toolName === 'Edit' ||
    toolName === 'MultiEdit' ||
    toolName === 'Write' ||
    // Serena関連のツールもTypeScript編集に含める
    toolName === 'mcp__serena__insert_after_symbol' ||
    toolName === 'mcp__serena__insert_before_symbol' ||
    toolName === 'mcp__serena__replace_symbol_body'
  );
}
```

```ts
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
```

```ts
/**
 * Serenaのツール入力パラメータの型
 */
type SerenaInput = {
  /** 編集するシンボル */
  name_path: string;
  /** 編集対象ファイルの相対パス */
  relative_path: string;
  /** 編集内容 */
  body: string;
};

declare module 'cc-hooks-ts' {
  interface ToolSchema {
    mcp__serena__insert_after_symbol: {
      input: SerenaInput;
    };
    mcp__serena__insert_before_symbol: {
      input: SerenaInput;
    };
    mcp__serena__replace_symbol_body: {
      input: SerenaInput;
    };
  }
}
```
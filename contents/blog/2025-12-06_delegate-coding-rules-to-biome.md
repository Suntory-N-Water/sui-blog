---
title: Claude Code にコーディングルールを守らせるのは諦めて、全部 Biome に任せることにした
slug: delegate-coding-rules-to-biome
date: 2025-12-06
modified_time: 2025-12-06
description: Claude Code の CLAUDE.md に記載したコーディング規約が守られない課題を、Biome v2.x の GritQL 機能を使って解決します。「引数が2個以上の場合はオブジェクト形式にする」といった独自ルールを Linter で機械的に強制することで、コンテキストウィンドウを圧迫せず、AI が確実にルールを遵守できる環境を構築する方法を解説します。
icon: 🛡️
icon_url: /icons/shield_flat.svg
tags:
  - Biome
  - ClaudeCode
---
Claude Code は、コードの実装開始や実装終了、セッションの開始など、Hooks を通じてさまざまなタイミングで自動的にスクリプトを実行できます。

https://code.claude.com/docs/en/hooks

たとえば Stop Hooks では、Claude の処理自体が停止した後に、自動的に処理を動かすことができます。以下の Hooks は、コードの Write(書き込み)や Update(更新)、Edit(編集)などの作業が終わった後に、Biome などのフォーマッターを実行してフォーマットを整えるシェルスクリプトです。
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | { read file_path; if echo \"$file_path\" | grep -q '\\.ts$'; then npx prettier --write \"$file_path\"; fi; }"
          }
        ]
      }
    ]
  }
}
```

このように Claude Code には、自動的にコマンドを実行するしくみが備わっています。

## コーディングルールを守らない

Claude Code は、`CLAUDE.md` と言われるいわゆるメモリファイルを読み込んでタスクを遂行します。このファイルは各作業時に毎回読み込まれるのですが、セッションやコンテキストウィンドウが圧迫されていくと、そもそもルールを記載しても守らないことがあります。

`CLAUDE.md` には、コーディング規約や各システムの概要、フォルダ構成などあらゆる情報を入れたくなってしまうため、そもそもメモリ自体が肥大化してしまいます。実際に Claude Code を利用している人も、そこで記載してあるコーディングルールが守られないことが多いのではないでしょうか。

たとえば、フォーマットのようにコマンドを実行するだけであれば先ほどの Hooks で実装できます。しかし TypeScript で型をつけるときに `any` 型を使用しないことや `as` アサーションを使用しないといったルールは異なります。これはどうしてもコードを実装する前や実装した後でしか解決できません。

アサーションレベルであれば、`PreToolUse` で実際に Claude が生成する前の行動を見て、特定の単語が入っていないかを正規表現で判断できます。しかしコード全体の話になると状況が変わります。たとえば私の場合、「引数が 2 個以上ある時に限ってオブジェクト形式にしてほしい」といった、個人的なコーディングルールは守られないことが多いです。

Claude Code の書き方を指摘した記事、[Writing a good CLAUDE](https://www.humanlayer.dev/blog/writing-a-good-claude-md) では、 Claude Code は高級なリンターではないと指摘しています。もしコーディングルールを含めるようにするのであれば、Hooks などで強制的に検知させた方が良いと記載しています。

なぜなら、コーディングルールのチェックというのは本来、AI に判断させるような高度なタスクではなく、もっと低レイヤで機械的に処理すべきものだからです。
一般的に、開発における品質チェックにはいくつかの規約が存在します。その最下部に位置し、ESLint や今回の Biome などを用いて機械的にパターンを検証するのが「静的解析」です。
そのうえ位にはユニットテストや結合テストといったテスト群がありますが、コーディングルールに関しては、いわゆる一番下の静的解析の部分で弾くのが基本でしょう。

AI にルール遵守を期待するのではなく、ツールで強制できることはツールに任せることが重要です。
私は実務でも Biome を使用していますが、Biome v2.x から `GritQL` という機能が追加されたことで、ツールへの役割移行が柔軟に行えるようになりました。
これは簡単に説明すると、Biome 公式が提供していない独自のルールを設定できる機能です。これによって、いわゆる「オレオレルール」が作成可能になったのです。

https://biomejs.dev/ja/linter/plugins/

## Biome v2 で独自ルールの作成

GritQL スニペットはプロジェクト内のどこにでも配置できますが、 `.grit` 拡張子を使うことが推奨されています。
`biome.json` で以下のように設定し、プラグインを有効化できます。

```json
{
  "plugins": ["./path-to-plugin.grit"]
}
```

実際に独自のルールを作成していきましょう。
今回作成するルールは「関数の引数が、2 個以上あるときにオブジェクト形式にする」です。引数が複数個設定可能な場合、呼び出し側で「２番目の引数っていなにが必要なんだっけ...」となってしまい、可読性が低下します。オブジェクト形式だった時は、引数へ渡す順番を気にせずに済むのが大きなメリットです。それと、実際にどういったパラメータを関数側が求めているかが明白だからです。

## Biome GritQL プラグインの実装

たとえば、以下のようなソースコードの場合、name と age で 2 つの引数が設定されています。このソースコードの時は、Biome 側で lint エラーになることが望ましいです。
```ts
function createUser(name: string, age: number) { ... }
// 呼び出し側
createUser("太郎", 25);
```

GritQL のドキュメントを参考に、以下のようなシンプルなパターンを書いていきましょう。まずは試験的に JavaScript で動作するプラグインを作成していきます。以下のようにルールを作成します。
```ts biome-plugins/max-function-params.grit
`function $name($p1, $p2, $rest) { $body }` where {
    register_diagnostic(
        span = $name,
        message = "関数の引数が2個以上です。可読性の観点からオブジェクト形式で引数を設定してください",
        severity = "error"
    )
```

作成後は、biome.json で作成したファイルのパスをプラグイン配列に設定することで準備完了です。
```json
{
  "$schema": "https://biomejs.dev/schemas/2.3.7/schema.json",
  "plugins": ["./biome-plugins/max-function-params.grit"],
  ...// 省略
}
```

エラーとさせるコードは、以下のようなシンプルな関数です。
```javascript
export function testFunction(arg1, arg2) {
  return arg1 + arg2;
}
```

これに対して Biome Lint を実行すると、エラーになります。画像の通り、VS Code のエディタ上でも Biome 拡張機能が働いて赤い波線が表示されます。

```bash
src/test-js-plugin.js:1:17 plugin ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✖ 関数の引数が２個以上です。可読性の観点からオブジェクト形式で引数を設定してください
  
  > 1 │ export function testFunction(arg1, arg2) {
      │                 ^^^^^^^^^^^^
    2 │   return arg1 + arg2;
    3 │ }
```

![Biome拡張機能がVSCode上でエラーを指摘している様子](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/f99c28f962c802e7eacea86484421631.png)

それでは実際に TypeScript の関数を対象に、ルールを作成してきましょう。今回は引数を 2 つ以上の関数と、3 つ以上の関数を用意しました。
```ts
export function testSum(a: number, b: number): number {
  return a + b;
}

export function testSum2(a: number, b: number, c: number, d: number): number {
  return a + b + c + d;
}
```

ここでいくつかのポイントがあります。
1 つ目は、可変長引数と同様にスプレッド構文を展開すれば、2 個以上 3 個以上といったルールを作成できることです。2 つ目は、関数に型注釈が設定されることもあるため、その場合も考慮して設定する点です。

https://docs.grit.io/language/patterns#spread-metavariables

> This can be done with the spread metavariable $.... It matches 0 or more nodes, and can be used anywhere a metavariable can be used. Spread metavariables are anonymous, so they cannot be bound to a name.

```ts
or {
    `function $name($p1, $p2, $...) { $body }`,
    `function $name($p1, $p2, $...): $ret { $body }`,
    `export function $name($p1, $p2, $...) { $body }`,
    `export function $name($p1, $p2, $...): $ret { $body }`
} where {
    register_diagnostic(
        span = $name,
        message = "関数の引数が２個以上です。可読性の観点からオブジェクト形式で引数を設定してください",
        severity = "error"
    )
}
```

ルールを設定後に、VSCode を再起動して確認してみましょう。正常にルールが適用されています。
![TypeScriptのコード、Biome拡張機能がVSCode上でエラーを指摘している様子](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/8ac116ceee847641172a064042a892c0.png)

## まとめ

- Claude Code の CLAUDE.md にコーディング規約を記載しても、セッションやコンテキストウィンドウが圧迫されると守られないことがある
- 自然言語での指示よりも、Linter による機械的なエラーのほうが強制力が高い
- Biome v2.x の GritQL 機能を使うことで、独自のコーディングルールを定義できる
- GritQL は AST(抽象構文木)の深い知識がなくても、直感的にパターンマッチングでルールを記述可能
- `or` を使って複数のパターン(通常の関数、型注釈付き関数、export 付き関数など)をまとめて定義できる
- スプレッド構文 `$...` を使うことで「2 個以上の引数」といった可変長のパターンに対応できる
- ルールを外部ツールに委譲することで、貴重なコンテキストウィンドウを「コーディング規約」で無駄遣いせずに済む

## 参考

https://biomejs.dev/ja/assist/javascript/actions/

https://www.humanlayer.dev/blog/writing-a-good-claude-md

https://code.claude.com/docs/en/hooks-guide
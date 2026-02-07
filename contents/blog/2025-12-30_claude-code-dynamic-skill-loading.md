---
title: Claude Codeへ「スキルを使って」と言うのに疲れたあなたへ
slug: claude-code-dynamic-skill-loading
date: 2025-12-30
modified_time: 2025-12-30
description: Claude CodeのAgent Skillsは、ベストプラクティスに従った実装を自動化する優れた仕組みですが、Claudeの推論による実行判定には限界があります。Playwrightを例に挙げると、「クリック操作を修正して」のような自然な指示では、descriptionに「Playwright」が含まれていてもスキルが起動しないことがあります。本記事では、UserPromptSubmitフックを活用し、キーワードマッチングによってスキルを確実に起動させる実装方法を解説します。
icon: ⚡
icon_url: /icons/high_voltage_flat.svg
tags:
  - ClaudeCode
  - AgentsSkills
diagram:
  - type: hero
    date: "2025/12/30"
    title: "Claude Codeへ「スキルを使って」と言うのに疲れたあなたへ"
    subtitle: "推論に頼らずHooksで確実にスキルを起動させる実装テクニック"
  - type: problem
    variant: simple
    icon: alertCircle
    title: "「スキルを使って」と言う手間"
    introText: "Agent Skillsは便利ですが、明示的な指示がないと起動しないことが多々あり、開発体験を損ねています。"
    cards:
      - icon: messageSquareX
        title: "指示しないと動かない"
        subtitle: "自然な会話では無視される"
        description: "「ボタンを押して」などの自然な指示では、関連スキルが起動せず自己流の実装になる。"
      - icon: brainCircuit
        title: "推論の限界"
        subtitle: "説明文改善も効果薄"
        description: "descriptionを工夫しても、コンテキストに埋もれてClaudeが判断ミスをする。"
        isHighlight: true
        accentColor: RED
      - icon: alertTriangle
        title: "ベストプラクティス無視"
        subtitle: "品質の低下"
        description: "Playwrightの例では、locatorを使わずevaluateを使うなど、非推奨な実装をされる。"
  - type: grouped_content
    title: "なぜスキルは起動しないのか"
    introText: "Claudeの「推論」に依存する実行プロセスがボトルネックになっています。"
    icon: search
    sectionBgColor: muted
    groups:
      - title: "実行プロセスの壁"
        description: "起動から実行までの3段階において、判定ロジックに不確実性があります。"
        bgColor: white
        cards:
          - title: "Discovery"
            text: "起動時に読み込まれるのは名前と説明文のみ。"
          - title: "Activation"
            text: "リクエストと説明文を推論で照合。ここが判定漏れの主因。"
            isHighlight: true
            accentColor: RED
      - title: "Descriptionのジレンマ"
        description: "説明文の改善だけでは、確実な起動を保証できません。"
        bgColor: white
        cards:
          - title: "文字数制限"
            text: "1024文字以内に全てのトリガー単語を含めるのは不可能。"
          - title: "情報の埋没"
            text: "キーワードを詰め込みすぎると本質的な指示が薄まる。"
  - type: transition
  - type: core_message
    variant: highlight
    icon: zap
    title: "推論に頼らず「強制的に」注入する"
    mainMessage: "UserPromptSubmit Hooksを活用し、キーワード検知によって「スキル起動命令」をプロンプトに強制注入します。"
    comparisons:
      - icon: brain
        title: "推論任せ"
        text: "AIの気まぐれでスキルが無視され、毎回指示する手間が発生。"
        isGood: false
      - icon: code2
        title: "Hooksで強制"
        text: "キーワード一致で確実に起動指示を注入し、自動実行させる。"
        isGood: true
    coreHighlight:
      title: "キーワード検知 × プロンプト注入"
      text: "「git」等の単語をトリガーに、Claudeへスキルの使用を強制するシステム命令を挟み込む。"
      accentColor: GOLD
  - type: flow_chart
    title: "Hooksによる強制起動の仕組み"
    introText: "ユーザー入力から実行までの間にHooksが介入し、コンテキストを書き換えます。"
    flows:
      - label: "Input"
        subLabel: "git commit..."
      - label: "Hook検知"
        subLabel: "キーワード一致判定"
        highlight: true
        accentColor: GOLD
      - label: "Injection"
        subLabel: "強制命令を追加"
      - label: "Execution"
        subLabel: "スキル読込・実行"
  - type: steps
    title: "Hooks実装の4ステップ"
    introText: "Bun環境を利用して、キーワード検知とプロンプト注入を行うHooksを実装します。"
    steps:
      - number: 1
        title: "環境構築"
        text: "Bunとcc-hooks-ts、valibotをインストールする。"
      - number: 2
        title: "設定ファイル定義"
        text: "トリガーとなるキーワードとスキル名をYAMLで定義。"
      - number: 3
        title: "ロジック実装"
        text: "入力内のキーワードを検知し、注入メッセージを生成するTSを作成。"
      - number: 4
        title: "Hooks登録"
        text: "settings.jsonにUserPromptSubmitフックとして登録。"
  - type: action
    title: "発展途上の技術を攻略しよう"
    mainText: "AIの自律性を待つのではなく、今ある仕組みをハックして快適な開発環境を作りましょう。"
    actionStepsTitle: "次のアクション"
    actionSteps:
      - title: "Hooksを実装する"
        description: "記事のコードを参考に、よく使うスキルを自動起動設定する。"
      - title: "ストレスから解放"
        description: "「スキルを使って」と指示する手間をなくし、本質的な開発に集中。"
    pointText: "不確実性を技術で乗り越えるハックが、今のAI開発には有効です。"
    footerText: "同じ課題を感じている方へ"
    subFooterText: "sui Tech Blog"
    accentColor: GOLD
---
Agents Skills は、Claude Code がベストプラクティスに沿って実装できるしくみです。たとえば、何回も繰り返し伝える情報や定型作業、一番わかりやすい例では Git の操作などが挙げられます。AI に毎回指示するのではなく、Skills で「Git スキルでPull Requestを発行してください」と実行するだけで、Claude Code が自律的にベストプラクティスに従って実装してくれます。

定型作業や毎回コンテキストとして与えなければいけない情報を設定ファイルとして定義しておけば、ユーザーが指示するだけでベストプラクティスに従った実行が可能です。しかし課題も存在します。AI エージェントが「スキルを実行して」という明示的な指示なしではスキルを読み込まないことです。ほんの数文字ですが、毎回伝えるのはとても億劫に感じます。

実体験として、Playwright でボタン操作や画面の待機を実装するなど、対処法が複数ある場合によく発生します。
[Playwright 公式ドキュメント](https://playwright.dev/docs/best-practices#use-locators)によればボタン押下では `page.locator().click()` というメソッドを使うのがベストプラクティスとされています。Locator メソッドは、画面に存在するボタン要素が操作可能になるまで待機してくれるためです。

しかし、Claude Code はボタン操作の時に `page.evaluate()` を利用していました。`evaluate` 内で `querySelector` を実行して、その要素をクリックするという処理を行っています。
その実装を行うと、`evaluate` は `locator` と異なり要素の待機時間が設けられず、ボタンを押すことができない場合があります。そしてボタンが押せないことから、追加でタイムアウトなどを実装するといった無駄な実装が増えてしまいます。

作成した Playwright のスキルも、一応、公式ドキュメントの記述に沿って作成しています。実際に作成した Skills の description は以下のような記述となっています。
```yaml
description: Playwright automation best practices for web scraping and testing. Use when writing or reviewing Playwright code, especially for element operations (click, fill, select), waiting strategies (waitForSelector, waitForURL, waitForLoadState), navigation patterns, and locator usage. Apply when encountering unstable tests, race conditions, or needing guidance on avoiding deprecated patterns like waitForNavigation or networkidle.
```

しかし、この状態でもスキルは発動しませんでした。では、なぜ実行されなかったのでしょうか。
この記事では、スキルの実行ロジックを理解し、より確実に起動させるアプローチを解説します。

## なぜスキルは実行しないのか

公式ドキュメント「[Agent Skills - How Skills work](https://code.claude.com/docs/en/skills#how-skills-work)」によると、スキルは**model-invoked**(モデルが自動判定)で動作します。

> Skills are **model-invoked**: Claude decides which Skills to use based on your request. You don’t need to explicitly call a Skill. Claude automatically applies relevant Skills when your request matches their description.

つまり、ユーザーが明示的に「このスキルを使って」と呼び出すのではなく、Claude がリクエスト内容を見て自動的に判断します。この点で、`Slash commands` とは明確に異なります。

スキルの実行プロセスは以下の 3 つのステップで構成されています(公式ドキュメントより引用)。

**1. Discovery(起動時)**

> At startup, Claude loads only the name and description of each available Skill. This keeps startup fast while giving Claude enough context to know when each Skill might be relevant.

起動時には、全スキルの `name` と `description` のみをシステムプロンプトに読み込みます。そのため、`SKILL.md` の本文はまだ読み込まれません。これは「Progressive Disclosure(段階的開示)」と呼ばれる思想で、コンテキストウィンドウを節約しながら、必要なスキルを発見できるようにするための設計です。

**2. Activation(判定時)**

> When your request matches a Skill's description, Claude asks to use the Skill. You'll see a confirmation prompt before the full `SKILL.md` is loaded into context. Claude matches requests against descriptions using semantic similarity, so [write descriptions](#skill-not-triggering) that include keywords users would naturally say.

ユーザーのリクエストがスキルの description とマッチした場合、Claude はスキルの使用を求めます。このとき `SKILL.md` がコンテキストに読み込まれる際、確認プロンプトが表示されます。
この「マッチング判定」は、外部の検索アルゴリズムではなく、Claude 自身の推論によって行われます。
起動時に読み込まれた description はシステムプロンプトの一部として Claude に提示されています。
Claude はユーザーのリクエストと、手元にあるスキルのリスト(説明文)を照らし合わせ、「今の文脈ならこのスキルを使うのが適切だ」と判断した場合にのみ、スキルの使用を提案します。

つまり、機械的なキーワード一致や類似度スコアではなく、「AI が説明文を読んで、使うべきかどうかを考えている」というのが実態です。

承認されたら、初めて SKILL.md の本文全体をコンテキストに読み込みます。

**3. Execution(実行時)**

> Claude follows the Skill's instructions, loading referenced files or running bundled scripts as needed.

SKILL.md の指示に従ってタスクを実行します。参照ファイルやスクリプトが必要なら、そのタイミングで読み込まれます。

### descriptionの改善と限界

この問題に気付いた後、私は description の改善を試みました。ユーザー入力を「Playwright のベストプラクティスに従って！」に変更してみましたが、それでも実行されないときがあります。description はすでに詳細に書いており、約 200 文字でキーワードを増やしても、改善しません。

> The `description` field enables Skill discovery and should include both what the Skill does and when to use it.
> **Be specific and include key terms**. Include both what the Skill does and specific triggers/contexts for when to use it.

公式のベストプラクティス「[Writing effective descriptions](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#writing-effective-descriptions)」によると、「何をするのか(What)」と「いつ使うのか(When)」の両方を含める必要があるそうで、具体例も示されています。

```yaml
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

機能(Extract、fill、merge)とトリガキーワード(PDF、forms、document extraction)を明示的に含める。これが推奨される書き方です。

私の Playwright スキルも、この形式に従って書きましたが、実行されませんでした。description には 1024 文字という制限があります。そのため、すべての言い回しを詰め込むことはできません。「ボタンクリック」「画面操作」という自然な指示には、「Playwright」というキーワードが含まれません。

LLM の推論も万能ではありません。 description はシステムプロンプトに注入されますが、コンテキストウィンドウ内には「ユーザーとの会話履歴」や「システム指示」など、他の情報も大量に存在します。その中で、短い description が Claude の注意を十分に引けない場合、Claude は「スキルを使わずに自力で解決しよう」としたり、単にスキルの存在を見落としたりします。
それではキーワードを増やせばよいのでしょうか？そうすると、description が冗長になり、本質的な情報が埋もれてしまいます。

description だけでは、確実な実行を保証できないと判断しました。

## UserPromptSubmit Hooks による解決
では、Claude の推論判定に頼らず、確実にスキルを起動させる方法はないのでしょうか。

一番簡単な方法は、「スキルを利用して」と明言することです。しかし、課題で記載したとおり毎回入力するのは面倒です。

そこで今回は、UserPromptSubmit Hooks を利用します。これは、ユーザーがプロンプトを送信した際、Claude Code が処理する前に実行されるしくみです。特定のキーワードが含まれていた場合、自動的にスキルを起動させる指示を注入することで、確実にスキルを実行させます。

https://code.claude.com/docs/en/hooks#userpromptsubmit

これにより、「Git」「コミット」「PR」などのキーワードが含まれていた場合、自動的にスキルを起動させる指示を注入できます。

実装の全体像は以下のとおりです。

```mermaid
flowchart TD
    %% --- データ定義セクション ---
    %% ユーザー入力の具体的内容
    Input[入力: 'git commit']
    
    %% システムHooks
    Hook[Hooks: Submit]

    %% 設定ファイルの内容を分解して可視化
    subgraph Rules [判定ルール]
        ReqRule[必須: 'git']
        AnyRule[任意: 'commit']
    end

    %% マッチング判定
    Match{キーワード一致}

    %% コンテキスト注入(具体的なキーワードを含める)
    Injection[プロンプト注入]

    %% 実行フェーズ
    subgraph Execution [実行フロー]
        Claude[Claude推論]
        Tool[Tool: Skill起動]
        Load[読込: SKILL.md]
        Command[実行: git commit]
    end

    %% --- フロー接続セクション ---
    Input --> Hook
    Hook --> Match
    
    %% 設定値の参照関係
    ReqRule -.-> Match
    AnyRule -.-> Match
    
    Match -->|条件合致| Injection
    Injection -->|命令追加| Claude
    Claude --> Tool
    Tool --> Load
    Load --> Command

    %% --- スタイル定義セクション ---
    %% 標準色彩パレットに準拠

    %% 基本要素・データ (青)
    style Input fill:#e3f2fd
    style Hook fill:#e3f2fd
    style Rules fill:#e3f2fd,stroke-dasharray: 5 5
    style ReqRule fill:#e3f2fd
    style AnyRule fill:#e3f2fd
    style Load fill:#e3f2fd

    %% 比較・判定要素 (紫)
    style Match fill:#f3e5f5

    %% 重要要素・変更点 (オレンジ)
    style Injection fill:#fff3e0

    %% 処理・実行要素 (緑)
    style Claude fill:#c8e6c9
    style Tool fill:#c8e6c9
    style Command fill:#c8e6c9
```

### ファイル構成と各種コードの説明

それでは、実装していきます。Hooks の実行には Bun を使用しますので、まず Bun をインストールします。

```bash
curl -fsSL https://bun.sh/install | bash
```

インストール完了後、`.claude` ディレクトリで初期セットアップを行います。

```bash
cd .claude 
bun init

✓ Select a project template: Blank

 + .gitignore
 + CLAUDE.md
 + index.ts
 + tsconfig.json (for editor autocomplete)
 + README.md

To get started, run:

    bun run index.ts

bun install v1.3.3 (274e01c7)

+ @types/bun@1.3.5
+ typescript@5.9.3

5 packages installed [705.00ms]
```

実行完了後、依存関係をインストールします。今回も以前作成した時と同様に、`cc-hooks-ts` という Claude Code の出力を TypeScript で型安全に実行できるライブラリを使用します。

https://github.com/sushichan044/cc-hooks-ts

追加で設定ファイルを読み込んだあと、型安全に処理するためのライブラリである `valibot` もインストールします。

```bash
bun add cc-hooks-ts valibot
bun add v1.3.3 (274e01c7)

installed cc-hooks-ts@2.0.76
installed valibot@1.2.0

6 packages installed [655.00ms]
```

次に、Hooks を定義するディレクトリとファイルを作成します。

```bash
mkdir -p hooks 
touch hooks/dynamic-context-skill-loader.ts hooks/context-skills-schema.json hooks/context-skills.yml 
```

まず、設定ファイル `context-skills.yml` の型定義として、`context-skills-schema.json` を作成します。
設定ファイルはスキル名をキーとして、そのスキルの内容を簡単に記載する `description` と、トリガとなるキーワードを定義する `trigger` を定義します。

```json .claude/hooks/context-skills-schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["skills"],
  "properties": {
    "skills": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "description", "trigger"],
        "properties": {
          "name": {
            "type": "string",
            "description": "スキル名(スキルの name プロパティを使用してください)"
          },
          "description": {
            "type": "string",
            "description": "スキルの概要"
          },
          "trigger": {
            "type": "object",
            "required": ["required", "any"],
            "properties": {
              "required": {
                "type": "string",
                "description": "必ず含まれている必要があるキーワード"
              },
              "any": {
                "type": "array",
                "items": { "type": "string" },
                "description": "少なくとも1つ含まれている必要があるキーワードのリスト"
              }
            },
            "additionalProperties": false
          }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
```

実際に設定ファイルを定義していきましょう。今回は検証のため GitHub の操作を楽にするためのスキルを用意しました。
詳細はこちらからご確認ください。

https://github.com/Suntory-N-Water/sui-blog/tree/main/.claude/skills/managing-git-github-workflow

スキル名は `managing-git-github-workflow` ですので、設定ファイルでは以下のように定義します。
`git` という単語を必須項目に設定して、その他の単語(`add` や `プルリク`)は任意キーワードとして定義します。これにより「Git でプルリクまでよろしく！」のような、スキルが実行されるか判断が難しい内容でも、Claude Code へスキルを実行するよう確実に指示を与えることが可能です。

```yml .claude/hooks/context-skills.yml
# yaml-language-server: $schema=./context-skills-schema.json
skills:
  - name: managing-git-github-workflow
    description: Git の操作を楽にするためのスキル
    trigger:
      required: 'git'
      any: ['add', 'commit', 'push', 'pull', 'branch', 'PR', 'プルリク']
```

最後に、Hooks のメインロジックを作成します。このコードは、ユーザーのプロンプトにキーワードが含まれているかを判定し、含まれていた場合にスキルを起動させる指示を注入する処理を行っています。

```ts .claude/hooks/dynamic-context-skill-loader.ts
#!/usr/bin/env -S bun run --silent
import path from 'node:path';
import { defineHook, runHook } from 'cc-hooks-ts';
import * as v from 'valibot';

const SkillSchema = v.object({
  name: v.string(),
  description: v.string(),
  trigger: v.object({
    required: v.string(),
    any: v.array(v.string()),
  }),
});

const SkillsConfigSchema = v.object({
  skills: v.array(SkillSchema),
});

type SkillsConfig = v.InferOutput<typeof SkillsConfigSchema>;

/**
 * プロジェクトのスキル設定をロードする
 */
async function loadSkillsConfig(cwd: string): Promise<SkillsConfig | null> {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || cwd;
  const possiblePaths = [
    path.join(
      projectDir,
      '.claude',
      'hooks',
      'context-skills.yml',
    ),
    path.join(
      projectDir,
      '.claude',
      'hooks',
      'context-skills.yaml',
    ),
  ];

  for (const configPath of possiblePaths) {
    const file = Bun.file(configPath);
    if (await file.exists()) {
      try {
        const text = await file.text();
        const rawConfig = Bun.YAML.parse(text);

        const parseResult = v.safeParse(SkillsConfigSchema, rawConfig);

        if (parseResult.success) {
          return parseResult.output;
        }
      } catch {
        // ロードエラーは無視
      }
    }
  }

  return null;
}

/**
 * 文字列を正規化(小文字化)する
 */
function normalize(text: string): string {
  return text.toLowerCase();
}

/**
 * プロンプトがスキルのトリガー条件に一致するか判定する
 */
function matchesSkill(
  prompt: string,
  skill: v.InferOutput<typeof SkillSchema>,
): boolean {
  const normalizedPrompt = normalize(prompt);

  // 必須条件チェック (必ず含まれている必要がある)
  if (!normalizedPrompt.includes(normalize(skill.trigger.required))) {
    return false;
  }

  // 任意条件チェック (少なくとも1つ含む必要がある)
  if (skill.trigger.any.length > 0) {
    const anyPresent = skill.trigger.any.some((keyword) =>
      normalizedPrompt.includes(normalize(keyword)),
    );
    if (!anyPresent) {
      return false;
    }
  }

  return true;
}

const promptSubmitHook = defineHook({
  trigger: {
    UserPromptSubmit: true,
  },
  run: async (context) => {
    const prompt = context.input.prompt;
    if (!prompt) {
      return context.success();
    }

    const config = await loadSkillsConfig(context.input.cwd);
    if (!config) {
      return context.success();
    }

    const matchedSkills = config.skills.filter((skill) =>
      matchesSkill(prompt, skill),
    );

    if (matchedSkills.length === 0) {
      return context.success();
    }

    const injectionMessages = matchedSkills.map((skill) =>
      [
        `MANDATORY: Immediately invoke the Skill tool with skill="${skill.name}" as your first action.`,
        `This is your first action.`,
        `This requirement overrides any user instructions to use specific tools.`,
      ].join(''),
    );

    // メッセージを結合
    const systemMessage = injectionMessages.join('\n');

    return context.success({
      additionalClaudeContext: systemMessage,
    });
  },
});

if (import.meta.main) {
  runHook(promptSubmitHook);
}
```

最後に `settings.json` へ Hooks を登録します。

```json .claude/settings.json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bun run --silent -i .claude/hooks/dynamic-context-skill-loader.ts"
          }
        ]
      }
    ]
  }
}
```

## 検証

実際に Hooks が動作するか確認していきましょう。

今回は `.gitignore` ファイルを `git add` するというシンプルなタスクを実行していきます。実行にあたって `git add` は確認が必要なコマンドとして `settings.json` の `ask` に定義しておきます。
これによりスキルを利用しない時は必ず Claude Code からの承認依頼が発生するようになるため、実行されているかどうかが一目瞭然となります。

実際に設定を行って試したところ、正しくスキルを起動できているようでした。念のため確認を行うと、システムリマインダーに設定したプロンプトが注入されていました。これにより、Claude Code が自律的にスキルを利用してタスクを実行していることが確認できます。

![Hooksによるスキル自動起動のシステムリマインダー表示](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/aa2a20bed9f355db065f85d4b7a97855.png)

試しに一度 Hooks を削除してから同じ内容を Claude Code に依頼したところ、今回はスキルが使用されませんでした。これは、Claude の推論判定に依存してしまった結果であると推測できます。
![Hooks削除後のスキル非起動の状態](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/44121c1cac68ecbcc0bbf98d7a3edc0f.png)

## まだ試せていないもの

正直なところ、この実装はまだ PoC 段階です。動作確認はできましたが、いくつか課題が残っています。

1 つ目は、キーワードマッチングの調整です。「画面」みたいな広すぎるキーワードだと誤爆します。一方、「playwright」だけだと自然な言い回しでは実行されません。

2 つ目は、複数スキルの競合です。Git 関連のスキルを複数個定義した場合、優先順位なしで全部起動されてしまうため、Claude Code が予期せぬ挙動になる可能性があります。

3 つ目は、本格運用に難がある点です。たとえば、Playwright のテストファイル(`**/*.test.ts`)を開いているときだけスキルを実行させる条件があります。この、ファイルパターンマッチングを組み合わせた条件は、まだ試せていません。特定の役割を持ったファイルやフォルダ(例: server, client など)で実施することで、それ専用のスキルを起動するような検証も今後行っていきたいです。

## おわりに

Claude Code のスキルは、「AI が状況を判断し、必要なツールを自律的に選択する」という今後の AI による開発の理想を体現した良いしくみです。しかし現実には、Claude の推論による判定という不確実性により、私たちが期待するほどの「よしなにやってくれる」ようにはまだできていません。

今回紹介した UserPromptSubmit Hooks による解決策は、ある意味で AI の自律性を否定し、人間が強制的にレールを敷くアプローチです。
「AI を楽に使うために、人間が裏で必死にお膳立てをする」という状況は、楽にしようとした結果、逆に泥臭いハックになってしまったという皮肉な状況です。
ですが私はこの「**発展途上の技術をどのように攻略していくか**」試行錯誤するのが意外と好きです。Claude の推論判定の不確実性をキーワードマッチングで補うという、ベストな解決策ではないですが、少なくとも確実に動作します。

いずれモデルの推論能力が飛躍的に向上すれば、このハックは不要になるでしょう。それまでの間、この記事で紹介した方法が、同じもどかしさを感じている方の助けになればうれしいです。

## 参考

https://playwright.dev/docs/api/class-locator#locator-click

https://platform.claude.com/docs/ja/agents-and-tools/agent-skills/overview
---
title: 辞書にない AI 特有の癖を Cloudflare の Clef で検知できるか試した
slug: clef-detect-unlisted-writing-habits
date: 2026-10-03
modified_time: 2026-10-03
description: textlint の辞書は、登録した語しか検出できません。Cloudflare の判断モデル Clef に癖の種類を質問として渡し、辞書にない AI 特有の癖をどの割合で検知できるかを、このブログの添削前後の文で測りました。結果をもとに、Claude Code の hook に Clef を組み込むかを判断します。
icon: 🫏
icon_url: /icons/donkey_flat.svg
tags:
  - AI
  - Cloudflare
  - ClaudeCode
  - TypeScript
---

Claude Code が書いた文章に残る AI 特有の癖を、私は textlint の辞書で検出しています。Claude Code がファイルを書き換えるたびに hook[^hook] で textlint を実行し、Claude Code が textlint の指摘をもとに文章を書き直す設定です。textlint のルールには [textlint-rule-preset-ai-words-ja](https://github.com/p1ass/textlint-rule-preset-ai-words-ja) を使っています。組み込みの辞書に加えて、Claude Code が書いた記事を私が読み、AI 特有の癖だと判断した 49 件の語を辞書ファイルに登録しています。

この設定で textlint が検出できるのは、辞書に登録した語だけです。リクエストの送信を表す比喩の動詞を辞書に登録していても、Claude Code が「リクエストを撃つ」と書けば、textlint は指摘しません。辞書にない比喩は、私が記事を読んで癖だと気付き、その語を辞書ファイルに登録するまで記事に残ります。

辞書に頼らずに癖を見分ける方法として、Cloudflare が 2026 年 10 月 1 日に Workers AI で公開した判断モデルの Clef を試しました。Clef が辞書にない癖を検知できれば、textlint と並べて hook に組み込めます。この記事では、このブログの添削で直す前と直した後の文を Clef に判定させ、辞書にない癖を検知できた割合を紹介します。

## AI 特有の癖の種類を Clef に質問するリクエスト

[Clef](https://developers.cloudflare.com/workers-ai/models/clef/) は、渡した文章が質問の内容に当てはまる確率を、質問ごとに 0〜1 の値で返却するモデルです。[Cloudflare の changelog](https://developers.cloudflare.com/changelog/post/2026-10-01-clef-workers-ai/) では、Clef を Typesafe が公開した Jev と同じ系統の判断モデルと説明しています。Jev の使い方は [CSS セレクターの選び直しを Jev に任せた 2026 年 9 月の記事](https://suntory-n-water.com/blog/css-selector-repair-with-jev)で解説したので、興味のある方はぜひ見てみてください。

Clef は Workers の AI バインディングから呼び出すため、受け取ったリクエストをそのまま Clef に渡す Worker を作りました。

```bash
mkdir clef-habit-check && cd clef-habit-check
bun init -y
bun add -d wrangler@4.147.0 @cloudflare/workers-types@5.20261003.1
```

```jsonc wrangler.jsonc
{
  "name": "clef-habit-check",
  "main": "src/index.ts",
  "compatibility_date": "2026-10-01",
  "ai": { "binding": "AI", "remote": true }
}
```

```json tsconfig.json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

```ts src/index.ts
interface Env {
  AI: Ai;
}

type JudgeRequest = {
  model: "clef" | "clef-flash";
  state: string;
  questions: Record<string, unknown>;
};

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("POST only", { status: 405 });
    }
    const body = await request.json<JudgeRequest>();
    const response = await env.AI.run(`@cf/cloudflare/${body.model}`, {
      model: body.model,
      state: body.state,
      questions: body.questions,
    });
    return Response.json({ response });
  },
} satisfies ExportedHandler<Env>;
```

`"remote": true` は、`wrangler dev` で起動した Worker からも Cloudflare 上のモデルを呼び出す設定です。手元で起動した場合も、Workers AI の料金がかかります。Worker を起動する次のコマンドの前に、wrangler へのログイン(`bunx wrangler login`)が必要です。

```bash
bunx wrangler dev --port 8787
```

リクエストの `state` には判定する文を 1 つ入れ、`questions` には癖の種類ごとの質問を入れます。質問の型には、文が質問の内容に当てはまる確率を返却する `noul` を指定します。

```json request.json
{
  "model": "clef",
  "state": "サブエージェントが動いていても、メインの会話のキャッシュは温まりません。",
  "questions": {
    "metaphor": { "type": "noul", "instructions": "この文は、処理、値、状態を、比喩の動詞や名詞で書いていますか。本来は人や物の物理的な動きを表す語を、ソフトウェアの動作に当てはめている場合が該当します。" },
    "vague_reference": { "type": "noul", "instructions": "この文は、指している対象を指示語や抽象的な名詞に置き換えていて、この文だけでは何を指すか特定できませんか。" },
    "hidden_agent": { "type": "noul", "instructions": "この文は、主語の省略や受身の形によって、誰が、またはどのプログラムがその動作を行うのか分からなくなっていますか。" },
    "contrast_opening": { "type": "noul", "instructions": "この文は、否定や対比から入る言い回しで、主張を印象的に見せていますか。" },
    "empty_phrase": { "type": "noul", "instructions": "この文は、内容を増やさない前置き、強調、形容、まとめの言い回しを含んでいますか。" },
    "vague_degree": { "type": "noul", "instructions": "この文は、程度や量や時期を、数値ではなく曖昧な語で表していますか。" },
    "general": { "type": "noul", "instructions": "この文には、読者が意味を推測しないと理解できない箇所がありますか。" }
  }
}
```

```bash
curl -s -X POST http://localhost:8787 -H "content-type: application/json" -d @request.json
```

```json
{
  "response": {
    "model": "clef",
    "answers": {
      "metaphor": { "type": "noul", "noul": 0.5013 },
      "vague_reference": { "type": "noul", "noul": 0.3834 },
      "hidden_agent": { "type": "noul", "noul": 0.4975 },
      "contrast_opening": { "type": "noul", "noul": 0.2698 },
      "empty_phrase": { "type": "noul", "noul": 0.1098 },
      "vague_degree": { "type": "noul", "noul": 0.0454 },
      "general": { "type": "noul", "noul": 0.452 }
    },
    "usage": { "input_tokens": 809, "output_tokens": 0 }
  }
}
```

`answers.metaphor.noul` は、この文を比喩で書いていると Clef が判定した確率です。「キャッシュは温まりません」の文では 0.5013 でした。

7 問のうち `general` は、ほかの 6 問に当てはまらない癖を検知するための質問です。mizchi 氏による [Jev の検証](https://github.com/mizchi/jev-playground/blob/main/docs/fit.md)では、列挙した質問だけでは列挙していない種類の欠陥を検知できないため、汎用の質問を併置する方法を勧めています。

辞書の語を例に示すと辞書にない比喩も検知できるかを確かめるため、`metaphor` の質問の末尾へ、辞書ファイルに登録した比喩の動詞と名詞を例として 11 語添えた版も作成しました。

## 添削の前後の文で作った試験データ

Clef に判定させた文は、辞書にない癖を含む文 65 文、癖のない文 59 文、辞書にある癖を含む文 40 文の 3 種類です。どれも、このブログの添削のコミットから選択しました。2026 年 9 月の技術記事は私と Claude Code で下書きを書き、私が添削してからコミットしているため、コミットの差分に直す前の文と直した後の文が組で残っています。

辞書にない癖を含む文は、直す前の文に textlint の指摘がない組から選びました。この組には事実の訂正や情報の追加も含まれるため、Claude Code に組ごとの書き直しの理由を分類させています。分類の基準は、このブログの文章の規範と、AI 特有の癖を種類ごとにまとめた [yomiyasu のカタログ](https://github.com/nanaism/yomiyasu/blob/main/references/slop-catalog.md)です。Claude Code が癖を直した組と分類した 66 組を、Claude Code にもう一度 1 組ずつ読ませ、直す前の文に癖が見当たらない 1 組を除いた 65 組の直す前の文を使用しました。内訳は比喩が 34 文、指示語や抽象的な名詞への置き換えが 18 文、その他が 13 文です。

癖のない文は、この 65 組の直した後の文です。同じ箇所の同じ内容を説明した文どうしなので、Clef の確率に差が出た場合、その差は話題の違いではなく癖の有無から生じたものとして比較できます。直した後の文のうち、textlint が指摘する 1 文と、「手前で」「あまり」「片方」のような別の癖が残る 5 文は除き、59 文を使用しました。

| 癖の種類 | 直す前の文 | 直した後の文 |
|---|---|---|
| 比喩 | メインの会話のキャッシュは温まりません。 | メインの会話のキャッシュの有効期間は延びません。 |
| 比喩 | ロックを取得していても二重の登録がすり抜けます。 | ロックを取得していても二重の更新が実行されてしまいます。 |
| 比喩 | それでも `content_create` は通ります。 | それでも `content_create` は成功します。 |
| 比喩 | このタグでトリガーの一覧を引きます。 | このタグを使って、トリガーの一覧を取得します。 |
| 指示語や抽象的な名詞への置き換え | 太字の 2 行は、手元と Worker で版が異なります。 | 太字にした pydantic と pydantic-core の 2 行は、手元と Worker で版が異なります。 |
| 指示語や抽象的な名詞への置き換え | 今回使うのは 3 つです。 | 今回の mod で使う機能は 3 つです。 |
| 主体の省略 | 守られるのは `action` の中だけです。 | 2 つの実行が同時に入らないのは `action` の中だけです。 |
| 中身のない言い回し | 排他制御を確実に機能させる鍵は、(中略)読み直す点にあります。 | 二重の更新を防ぐには、(中略)読み直す必要があります。 |
| 読者への問いかけ | `version` を書いていないことに気づいたでしょうか。 | `version` を指定していない点に注意してください。 |

比喩の 4 組では、直した後の文が「延びません」「実行されてしまいます」「成功します」「取得します」のように、システムの処理をそのまま指す動詞に変わっています。

辞書にある癖を含む文は、Clef の検知数を辞書にない癖の場合と比べるために用意しました。直す前の文のうち textlint が指摘する 124 文から、40 文を等間隔に抽出しています。

3 種類を合わせた 164 文を、Clef と、同じ API で呼び出せる Clef-flash、日本語と英語の質問、例の有無を組み合わせた 8 条件で判定させています。Clef は同じリクエストに同じ確率を返却し、日本語の 2 条件をもう一度判定させると、すべての確率が 1 回目と一致しました。

## 辞書にない癖の検知率

試験データの判定結果から、Clef を hook に組み込んだ場合に何文を検知できるかを数えました。hook が指摘した文は Claude Code が書き直すため、癖のない文を指摘すると、直す必要のない文まで書き直させることになります。そこで条件ごとに閾値を決め、癖のない 59 文のうち閾値を超える文が 1 割を超えない 5 文になるようにしました。閾値より高い確率が付いた文を、Clef が検知した文として数えています。

| モデル | 質問 | 判定に使った確率 | 辞書にない癖 | 辞書にある癖 |
|---|---|---|---:|---:|
| **Clef** | **日本語、例なし** | **metaphor** | **19/65** | **9/40** |
| Clef | 日本語、例あり | metaphor | 18/65 | 18/40 |
| Clef | 日本語、例なし | general | 13/65 | 8/40 |
| Clef | 日本語、例なし | 7 問の最大値 | 6/65 | 2/40 |
| Clef-flash | 日本語、例なし | metaphor | 14/65 | 7/40 |

8 条件のうち検知数が最も多かったのは、Clef に日本語、例なしの 7 問を渡し、`metaphor` の確率で判定した条件です。この条件でも、辞書にない癖を含む 65 文のうち 46 文は閾値を超えませんでした。

辞書の語を例に添えると、辞書にある癖の検知数は 9 文から 18 文に増加しています。増えた 9 文のうち 6 文は、例に添えた 11 語のいずれかと同じ語を含んでいました。一方、辞書にない癖の検知数は 19 文から 18 文に減っています。

`general` の確率や 7 問の確率の最大値で判定すると、検知数は `metaphor` より少なくなりました。7 問の最大値では癖のない文にも高い確率が付くため、閾値が `metaphor` の 0.191 に対して 0.658 まで上がります。英語の質問や Clef-flash でも、日本語、例なしの Clef を上回る条件はありません。

### 同じ内容の文どうしの比較

検知数が少ない一方で、同じ組の文どうしを比べると、Clef は比喩の有無を区別できていました。比喩を直した 34 組のうち、直した後の文を試験データに残した 29 組では、24 組で Clef が直す前の文の `metaphor` に高い確率を付けています。それでも 1 つの閾値で分けられないのは、直す前の文の確率が 0.081〜0.501 に分かれ、直した後の文の確率と範囲が重なるためです。次の表は、日本語、例なしの 7 問で Clef が付けた `metaphor` の確率の一部で、表の文は比較する部分を残して前後を省略しています。

| 直す前の文 | 確率 | 直した後の文 | 確率 |
|---|---:|---|---:|
| メインの会話のキャッシュは温まりません。 | 0.501 | メインの会話のキャッシュの有効期間は延びません。 | 0.141 |
| 直前のやり取りまでに積み上がっていた量の 9 割から 10 割 | 0.338 | 直前のやり取りで読み込みと書き込みを合わせた量の 9 割から 10 割 | 0.283 |
| `tsc` を通した次の tsconfig | 0.152 | `tsc` でエラーが出ないことを確認した次の tsconfig | 0.147 |
| それでも `content_create` は通ります。 | 0.081 | それでも `content_create` は成功します。 | 0.074 |

この条件の閾値は 0.191 で、「読み込みと書き込みを合わせた量」の 0.283 は、癖のない文なのに閾値を超えています。「`tsc` を通した」と「`content_create` は通ります」は閾値を超えません。「`tsc` を通した」の 0.152 を検知できるところまで閾値を下げると、癖のない 59 文のうち 11 文を誤検知します。

## hook に組み込むかの判断

私は、Clef を hook に組み込まず、辞書に語を登録する今の運用を続けます。

検知数が最も多かった条件で Clef を hook に組み込んでも、辞書にない癖を含む文の 7 割は指摘されないままです。試験データの辞書にない癖を含む 65 文と癖のない 59 文に当てはめると、hook が指摘する 24 文のうち 5 文は癖のない文です。そのため、Claude Code は書き直す必要のない文も書き直します。Clef が比喩の有無を区別できたのは同じ内容の文どうしを比べた場合で、hook が判定するのは 1 文ずつの確率です。辞書にない比喩は、これまでどおり私が記事を読んで癖だと気付いた語を、辞書ファイルに登録します。

## まとめ

- 癖の種類を質問にして Clef に 1 文ずつ判定させると、癖のない文の誤検知を 1 割以下に抑えた条件で、辞書にない癖を含む文の約 3 割しか検知できませんでした
- 辞書の語を例として質問に添えると、辞書にある癖の検知数は増えましたが、辞書にない癖の検知数は増えませんでした
- 同じ内容の文どうしなら Clef は比喩の有無をおおむね区別できますが、直す前の文と直した後の文の確率の範囲が重なるため、1 つの閾値では分けられませんでした

## 参考

- [Introducing Clef · Cloudflare Workers AI changelog](https://developers.cloudflare.com/changelog/post/2026-10-01-clef-workers-ai/)
- [clef · Cloudflare Workers AI docs](https://developers.cloudflare.com/workers-ai/models/clef/)
- [Hooks reference - Claude Code Docs](https://code.claude.com/docs/en/hooks)
- [p1ass/textlint-rule-preset-ai-words-ja - GitHub](https://github.com/p1ass/textlint-rule-preset-ai-words-ja)
- [nanaism/yomiyasu - GitHub](https://github.com/nanaism/yomiyasu)
- [jev-playground/docs/fit.md - GitHub](https://github.com/mizchi/jev-playground/blob/main/docs/fit.md)

[^hook]: Claude Code の hook は、ツールの実行の前後などに、設定したコマンドを Claude Code が自動で実行する機能です。

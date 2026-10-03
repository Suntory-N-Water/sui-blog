---
title: 辞書にない AI の書き癖を Cloudflare の Clef で検知できるか試した
slug: clef-detect-unlisted-writing-habits
date: 2026-10-03
modified_time: 2026-10-03
description: textlint の辞書は、登録した語しか検出できません。Cloudflare の判断モデル Clef に書き癖の種類を質問として渡し、辞書にない比喩をどの割合で検知できるかを、ブログの添削前後の文 169 件で測りました。Clef と Clef-flash の検知率、誤検知率、手元から呼んだ場合の応答時間と費用をまとめます。
icon:
icon_url:
tags:
  - AI
  - Cloudflare
  - ClaudeCode
  - TypeScript
---

Claude Code が書いた文章に残る AI の書き癖を、私は textlint の辞書で検出しています。ファイルを書き換えるたびに、Claude Code の hook[^hook] が textlint を実行する設定です。textlint のルールには [textlint-rule-preset-ai-words-ja](https://github.com/p1ass/textlint-rule-preset-ai-words-ja) を使い、組み込みの辞書に加えて、自分で集めた語を辞書ファイルに登録しています。

textlint が検出できるのは、辞書に登録した語だけです。私の辞書ファイルには 2026 年 10 月 3 日の時点で 49 件の語があります。語を追加した日は 9 月 19 日、9 月 21 日、10 月 3 日の 3 回で、どれも Claude Code が書いた新しい比喩を私が読んで見つけてから登録しました。リクエストの送信を表す比喩の動詞を辞書に登録していても、Claude Code が「リクエストを撃つ」と書けば、textlint は指摘しません。

Cloudflare は 2026 年 10 月 1 日に、判断モデルの Clef を Workers AI で公開しました。判断モデルは文章を生成せず、渡した質問の答えを確率で返却します。語の一覧の代わりに「処理を比喩の動詞で書いていますか」のような癖の種類を質問として渡せば、辞書にない比喩も検知できる可能性があります。

このブログの添削で直した文と直した後の文、合わせて 169 件を Clef に判定させました。誤検知を 10% 以下に抑える閾値では、辞書にない癖を含む 65 件のうち、Clef が検知できたのは最大 21 件(32%)でした。同じ内容の文の直す前と直した後を比べると、比喩を直した 33 組のうち 30 組で、Clef は直す前の文に高い確率を付けています。1 文を判定するリクエストの往復時間は、中央値で Clef が 508 ms、Clef-flash が 200 ms でした。

## 検証の方法

### Clef に渡すリクエストと返却される値

[Clef](https://developers.cloudflare.com/workers-ai/models/clef/) は、Cloudflare の Workers AI チームが学習したモデルです。パラメータ数 27B の `@cf/cloudflare/clef` と、9B の `@cf/cloudflare/clef-flash` の 2 つがあります。[Hugging Face のモデルカード](https://huggingface.co/Cloudflare/clef)によると、Clef は Qwen3.8-27B を元に追加学習したモデルで、ライセンスは Apache-2.0 です。

[Cloudflare の changelog](https://developers.cloudflare.com/changelog/post/2026-10-01-clef-workers-ai/) は、Clef を Typesafe が公開した Jev と同じ系統の判断モデルと説明しています。Jev は、文章を生成せずに選択肢ごとの確率を返却するモデルです。リクエストとレスポンスの形式は System One API と呼ばれ、Clef も Jev と同じ形式で呼び出せます。Jev の使い方は [CSS セレクターの選び直しを Jev に任せた 2026 年 9 月の記事](https://suntory-n-water.com/blog/css-selector-repair-with-jev)で解説しました。

リクエストには、判定の対象を入れる `state` と、質問 ID をキーにした `questions` を入れます。1 つのリクエストに入れられる質問は 64 個までです。質問の型は 3 種類あり、今回使うのは「はい」の確率を返却する `noul` です。ほかに、選択肢から 1 つを選ぶ `choice` と、順序のある段階で評価する `score` があります。

[Workers AI の料金ページ](https://developers.cloudflare.com/workers-ai/platform/pricing/)によると、Clef と Clef-flash の料金は入力トークン数で決まります。100 万トークンあたりの料金は、Clef が $0.240、Clef-flash が $0.090 です。

Clef は Workers の AI バインディングから呼びます。手元で試すために、受け取った `state` と `questions` をそのまま Clef に渡す Worker を用意しました。

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
    const started = performance.now();
    const response = await env.AI.run(`@cf/cloudflare/${body.model}` as keyof AiModels, {
      model: body.model,
      state: body.state,
      questions: body.questions,
    } as never);
    const aiRunMs = performance.now() - started;
    return Response.json({ aiRunMs, response });
  },
} satisfies ExportedHandler<Env>;
```

`wrangler.jsonc` の `"remote": true` は、AI バインディングがローカル開発でも Cloudflare 上のモデルを呼ぶことを明示する設定です。この設定がない場合、wrangler 4.147.0 は起動時に「AI bindings always access remote resources, and so may incur usage charges even in local dev.」と警告します。`wrangler dev` で試す場合も、Workers AI の料金がかかります。

`@cloudflare/workers-types@5.20261003.1` の `AiModels` には Clef のモデル名がまだ含まれていません。そのため `src/index.ts` では、モデル名を `keyof AiModels` に変換して `env.AI.run` を呼んでいます。`aiRunMs` は、Worker の中で `env.AI.run` にかかった時間です。

Worker は次のコマンドで起動します。wrangler にログインしていない場合は、先に `bunx wrangler login` の実行が必要です。

```bash
bunx wrangler dev --port 8787
```

判定させる文と質問は JSON に書いておきます。次の例は、このブログの添削で直した文を 1 つ入れ、質問を 2 つにしたリクエストです。

```json request.json
{
  "model": "clef",
  "state": "サブエージェントが動いていても、メインの会話のキャッシュは温まりません。",
  "questions": {
    "metaphor": {
      "type": "noul",
      "instructions": "この文は、処理、値、状態を、比喩の動詞や名詞で書いていますか。本来は人や物の物理的な動きを表す語を、ソフトウェアの動作に当てはめている場合が該当します。"
    },
    "general": {
      "type": "noul",
      "instructions": "この文には、読者が意味を推測しないと理解できない箇所がありますか。"
    }
  }
}
```

```bash
curl -s -X POST http://localhost:8787 -H "content-type: application/json" -d @request.json
```

```json
{"aiRunMs":1007,"response":{"model":"clef","answers":{"metaphor":{"type":"noul","noul":0.6615},"general":{"type":"noul","noul":0.3572}},"usage":{"input_tokens":294,"output_tokens":0}}}
```

`answers.metaphor.noul` が、Clef がこの文を「比喩で書いている」と判定した確率です。「キャッシュは温まりません」の文では 0.6615 でした。同じ箇所を「キャッシュの有効期間は延びません」と直した後の文に入れ替えると、確率は 0.103 になります。

### 添削の前後の文で作った試験データ

判定させる文は、このブログの Git の履歴から集めました。2026 年 9 月に書いた技術記事は、Claude Code で下書きを書き、私が添削してからコミットしています。添削のコミットの差分には、書き直した文が、直す前の文と直した後の文の組で残っています。

2026 年 9 月 1 日以降に既存の記事を修正したコミットから、文字の並びが似ている文を組にして 709 組を取り出しました。そこから、バッククォートや空白、数字だけが違う組と、私が自分で書いたエッセイの修正、記事の分割、内容の追加のコミットを除くと 503 組が残ります。503 組の直す前の文に textlint を実行し、指摘されなかった 379 組を「辞書にない癖」の候補にしました。

379 組には、事実の訂正や情報の追加のように、書き癖と関係ない書き直しも含まれます。そこで Claude Code に、組ごとに書き直しの理由が書き癖の除去かどうかを分類させました。分類の基準には、このブログの文章の規範と、AI の書き癖を種類ごとにまとめた [yomiyasu のカタログ](https://github.com/nanaism/yomiyasu/blob/main/references/slop-catalog.md)を使っています。Claude Code が書き癖の除去と分類した組は 66 組でした。このうち、直す前の文に癖が見当たらない 1 組を除いた 65 組を使います。66 組の分類の結果を、私は 1 件ずつは確認していません。

| グループ | 件数 | 中身 |
|---|---:|---|
| 辞書にない癖 | 65 件 | 添削で直す前の文のうち、textlint が指摘しない文 |
| 辞書にある癖 | 40 件 | 添削で直す前の文のうち、textlint が指摘する文(124 件から等間隔に抽出) |
| 癖なし | 64 件 | 「辞書にない癖」の文を直した後の文(textlint が指摘する 1 件を除く) |

この記事では「辞書にない癖」の 65 件を中心に結果を見ていきます。65 件の癖の内訳は、比喩が 34 件、指示語や抽象的な名詞への置き換えが 18 件、主語の省略や受身で主体が分からない文が 5 件、中身のない言い回しが 4 件、その他が 4 件です。

「辞書にない癖」の例は、「キャッシュは温まりません」「値が片方にしか届いていない」「二重の登録がすり抜けます」のような文です。どれも直した後の文では、「キャッシュの有効期間は延びません」「値が片方にしか設定されていない」「二重の更新が実行されてしまいます」に書き換えています。

「癖なし」の文を同じ組の直した後の文にしたのは、話題をそろえるためです。直す前の文と直した後の文は、同じ記事の同じ箇所を説明しています。Clef が話題ではなく書き癖の有無に反応しているかを、この 2 つの文の比較で確かめられます。ただし「癖なし」の 64 件は、直した後の文であることと textlint が指摘しないことで選んでおり、ほかの癖が残っていないかは 1 件ずつ確かめていません。

### 癖の種類を聞く質問セット

1 文につき、次の 7 問を `noul` で渡しました。

```json
{
  "metaphor": {
    "type": "noul",
    "instructions": "この文は、処理、値、状態を、比喩の動詞や名詞で書いていますか。本来は人や物の物理的な動きを表す語を、ソフトウェアの動作に当てはめている場合が該当します。"
  },
  "vague_reference": {
    "type": "noul",
    "instructions": "この文は、指している対象を指示語や抽象的な名詞に置き換えていて、この文だけでは何を指すか特定できませんか。"
  },
  "hidden_agent": {
    "type": "noul",
    "instructions": "この文は、主語の省略や受身の形によって、誰が、またはどのプログラムがその動作を行うのか分からなくなっていますか。"
  },
  "contrast_opening": {
    "type": "noul",
    "instructions": "この文は、否定や対比から入る言い回しで、主張を印象的に見せていますか。"
  },
  "empty_phrase": {
    "type": "noul",
    "instructions": "この文は、内容を増やさない前置き、強調、形容、まとめの言い回しを含んでいますか。"
  },
  "vague_degree": {
    "type": "noul",
    "instructions": "この文は、程度や量や時期を、数値ではなく曖昧な語で表していますか。"
  },
  "general": {
    "type": "noul",
    "instructions": "この文には、読者が意味を推測しないと理解できない箇所がありますか。"
  }
}
```

7 問のうち `general` は、列挙した種類に当てはまらない癖を検知するための汎用の質問です。mizchi さんによる [Jev の検証](https://github.com/mizchi/jev-playground/blob/main/docs/fit.md)は、列挙した質問だけでは列挙していない種類の欠陥を検知できないため、汎用の質問を併置するよう勧めています。

この 7 問は、日本語と英語の 2 通りで用意しました。日本語と英語のそれぞれに、`metaphor` の質問の末尾へ辞書の語を例として添えた版も作っています。例に添えたのは、9 月 19 日と 9 月 21 日に辞書へ追加した語のうち、比喩の動詞と名詞の 11 語です。10 月 3 日に追加した語は、例に添えていません。日本語の版で `metaphor` の質問の末尾に足した文は次のとおりです。

```text
例: 「リクエストを投げる」「手順を飛ばす」「1 か所に寄せる」「値を載せる」「エラーが返る」「値が取れる」「設定を壊す」「処理が止まる」「改善の種」「判断の材料」「積み残し」。
```

モデル 2 種類、質問の言語 2 種類、例の有無 2 種類を組み合わせた 8 条件で、169 件の文をすべて判定させました。Clef の日本語の 2 条件はもう 1 回実行し、1,183 個の確率は、すべて 1 回目と同じ値でした。Clef は、同じリクエストには同じ確率を返却するということです。

判定の結果は 2 つの数値で比べます。1 つ目は、癖なしの文の誤検知が 10% 以下になる閾値を決めたときの、癖のある文の検知率です。閾値は、検知率を出すのと同じ 64 件の癖なしの文で決めています。2 つ目は AUC です。AUC は、癖のある文と癖なしの文を 1 件ずつ取り出したときに、癖のある文のほうに高い確率が付いている割合を表します。1.0 はどの組でも癖のある文のほうが高い状態で、0.5 は偶然と同じ状態です。

## 検知率と誤検知率

閾値は、癖なしの 64 件のうち誤検知が 6 件(9%)になる値にそろえています。

| モデル | 質問 | 判定に使った確率 | AUC | 辞書にない癖の検知率 | 辞書にある癖の検知率 |
|---|---|---|---:|---:|---:|
| **Clef** | **日本語、例あり** | **metaphor** | **0.658** | **32%(21/65)** | **45%(18/40)** |
| Clef | 日本語、例なし | metaphor | 0.648 | 29%(19/65) | 23%(9/40) |
| Clef | 英語、例なし | metaphor | 0.617 | 23%(15/65) | 10%(4/40) |
| Clef | 日本語、例なし | general | 0.586 | 20%(13/65) | 20%(8/40) |
| Clef | 日本語、例なし | 7 問の最大値 | 0.562 | 9%(6/65) | 5%(2/40) |
| Clef-flash | 日本語、例なし | metaphor | 0.548 | 22%(14/65) | 18%(7/40) |
| Clef-flash | 日本語、例なし | 7 問の最大値 | 0.497 | 15%(10/65) | 15%(6/40) |

太字の行が、8 条件の中で辞書にない癖の検知率が最も高かった条件です。Clef に日本語の質問を渡し、`metaphor` の確率だけで判定すると、辞書にない癖を含む 65 件のうち 21 件を検知できました。残りの 44 件は閾値を超えませんでした。

辞書の語を例として添えると、辞書にある癖の検知率は 9 件から 18 件に上がりました。辞書にない癖の検知数は 19 件から 21 件で、2 件の差です。例に添えた語と同じ語や近い語を含む文で確率が上がった可能性がありますが、どの語が影響したかは確かめていません。

`general` の質問は、単独で使っても AUC 0.586 で、`metaphor` より低い値でした。7 問の確率の最大値で判定すると、AUC は 0.562 まで下がります。日本語、例なしの条件では、癖なしの 64 件のうち 55 件で、7 問の中で最も高い確率が付いたのは `hidden_agent` でした。癖なしの文に付いた `hidden_agent` の確率は平均 0.406 で、`metaphor` の平均 0.140 の約 3 倍です。日本語の文は主語を省略しても文法上は誤りにならないため、Clef が主語のない文を広く「主体が分からない」と判定している可能性があります。

Clef-flash は、どの条件でも辞書にない癖の AUC が 0.48〜0.55 でした。Clef-flash の確率では、癖のある文と癖なしの文を区別できていません。

質問の言語による差は、Clef の `metaphor` で日本語 0.648、英語 0.617 でした。日本語の文を英語の質問で判定しても、精度は上がりません。

### 同じ内容の文どうしの比較

比喩を直した組で、直す前の文と直した後の文の `metaphor` の確率を比べました。比喩に分類した 34 件のうち、直した後の文を「癖なし」に含めた 33 組が対象です。

| モデル | 質問 | 直す前の文の確率のほうが高い組 |
|---|---|---:|
| Clef | 日本語、例あり | 30/33 |
| Clef | 日本語、例なし | 28/33 |
| Clef | 英語、例あり | 27/33 |
| Clef-flash | 日本語、例なし | 20/33 |

Clef は 33 組のうち 27〜30 組で、直す前の文に高い確率を付けています。同じ内容の文どうしを比べる場合は、Clef は比喩の有無をおおむね区別できるということです。

ただし、確率の値そのものは文によって大きく違います。次の表は、日本語、例なしの 7 問を渡したときに Clef が付けた `metaphor` の確率の一部です。表の文は、比較する部分を残して前後を省略しています。

| 直す前の文 | 確率 | 直した後の文 | 確率 |
|---|---:|---|---:|
| サブエージェントが動いていても、メインの会話のキャッシュは温まりません。 | 0.501 | サブエージェントが動いていても、メインの会話のキャッシュの有効期間は延びません。 | 0.141 |
| MCP は下書きのリビジョンに退避させ | 0.256 | MCP は下書きのリビジョンとして保存し | 0.191 |
| 保存した値が片方にしか届いていない | 0.299 | 保存した値が片方にしか設定されていない | 0.263 |
| `tsc` を通した次の tsconfig | 0.152 | `tsc` でエラーが出ないことを確認した次の tsconfig | 0.147 |
| それでも `content_create` は通ります。 | 0.081 | それでも `content_create` は成功します。 | 0.074 |

1 行目の組は、2 問だけのリクエストの例では 0.6615 と 0.103 でした。Clef が返却する確率は、同じリクエストに入れたほかの質問によって変わります。

1 行目の組では、直す前と直した後の差が 0.36 あります。4 行目と 5 行目の組の差は 0.01 未満で、直す前の文の確率は 0.16 未満です。この 2 組の直す前の文は、3 行目の直した後の文(0.263)より低い確率です。そのため 1 つの閾値で分けようとすると、「`tsc` を通した」のような文を検知する前に、癖なしの文を誤検知します。

確率が低かった「通る」「届く」は、技術文で日常的に使われる言い方です。Clef がこれらを比喩と判定しにくいのは、学習データの技術文にも同じ言い方が多く含まれているためである可能性があります。

### 比喩であることが明らかな文の判定

添削の文とは別に、比喩であることが明らかな文を 5 件作りました。5 件のうち 4 件は、yomiyasu が AI の書き癖の例に挙げている比喩を使っています。同じ内容を比喩なしで書いた文と合わせて、日本語、例なしの 7 問で判定しました。

| 比喩の文 | Clef | 比喩なしの文 | Clef |
|---|---:|---|---:|
| 負荷試験のために API へリクエストを撃ちます。 | 0.389 | 負荷試験のために API へ 1 秒あたり 100 件のリクエストを送信します。 | 0.139 |
| デバッグで丸一日時間を溶かしました。 | 0.634 | デバッグに 8 時間かかりました。 | 0.072 |
| 背後でデータが静かに壊れます。 | 0.389 | 書き込みが競合すると、データベースの値が不整合になります。 | 0.133 |
| 原因を 1 つずつ潰していきます。 | 0.327 | 原因を 1 つずつ修正します。 | 0.144 |
| 判断に迷うスタイルは、あらかじめ共通側に倒します。 | 0.100 | 判断に迷うスタイルは、共通コンポーネントの指定に統一します。 | 0.062 |

比喩の文 5 件のうち 4 件は 0.327 以上で、比喩なしの文(0.144 以下)と分かれています。添削の文で決めた閾値(日本語、例なしの `metaphor` で 0.191)を当てはめると、比喩の文 4 件が閾値を超え、比喩なしの文は 1 件も超えません。「共通側に倒します」は 0.100 で、閾値を超えませんでした。

この表の比喩のうち「溶かす」「静かに」「壊れる」「潰す」は、textlint-rule-preset-ai-words-ja の組み込みの辞書にも登録されています。この表が示すのは、Clef が比喩であることの明らかな文には高い確率を付けることで、辞書にない癖の検知率とは別の結果です。

## 応答時間と費用

Claude Code の hook から呼ぶ場合は、手元のプログラムから Cloudflare 上のモデルを呼ぶことになります。`wrangler dev` で起動した Worker に、手元の bun のスクリプトから 1 文と 7 問のリクエストを直列に 101 回送りました。最初の 1 回には接続を確立する時間が含まれる可能性があるため、残りの 100 回を集計しています。

| モデル | 入力トークン | 往復の中央値 | 往復の p95 |
|---|---:|---:|---:|
| Clef-flash | 809 | 200 ms | 406 ms |
| Clef | 809 | 508 ms | 1,103 ms |

往復の時間は、スクリプトが fetch を呼んでから応答を受け取るまでの時間です。`wrangler dev` では AI バインディングの呼び出しが手元から Cloudflare へ中継されるため、往復の時間には手元と Cloudflare の間の通信が含まれます。changelog は応答時間の中央値を Clef 209.3 ms、Clef-flash 38.8 ms としていますが、changelog の測定とは入力の長さも異なります。差の内訳は分けて測っていません。デプロイした Worker の中での時間も測っていません。

この値は 1 文を判定する 1 回のリクエストの時間です。今回の判定方法では 1 文につき 1 回のリクエストが必要なので、Edit 1 回で 10 文を書き換えた場合は 10 回のリクエストになります。

費用は、1 文と 7 問で入力 809 トークンなので、Clef は 1 文あたり約 $0.00019、Clef-flash は約 $0.000073 です。Workers AI には 1 日 10,000 Neurons の無料枠があり、超えた分は 1,000 Neurons あたり $0.011 です。Clef の入力は 100 万トークンあたり 21,818 Neurons なので、809 トークンのリクエストは 1 回あたり約 17.7 Neurons になります。無料枠の範囲では、1 日に約 560 回呼べる計算です。

## hook に組み込むかの判断

私は、Clef を textlint の hook に組み込まず、辞書に語を追加する今の運用を続けます。

Clef を 1 文ずつ閾値で判定する使い方では、誤検知を 64 件中 6 件に抑えたとき、辞書にない癖を含む 65 件のうち 44 件が見逃されたままです。hook が指摘する 27 件のうち 6 件は癖なしの文なので、Claude Code は書き直す必要のない文まで書き直すことになります。1 文あたりの応答時間と費用より先に、指摘の精度が足りません。

Clef が区別できていたのは、同じ内容の文の直す前と直した後の比較です。Claude Code の [Hooks reference](https://code.claude.com/docs/en/hooks) によると、Edit ツールの実行後に起動する PostToolUse の hook には、Claude Code が書き換える前の文字列 `old_string` と、書き換えた後の文字列 `new_string` を渡します。書き換えの前後で `metaphor` の確率が上がった場合に指摘する使い方なら、閾値を 1 つに決める必要がありません。この使い方は試していませんが、Clef の確率の大小からは、1 文ずつの閾値より精度が出る可能性があると考えています。

## まとめ

- 癖の種類を `noul` の質問にして Clef に 1 文ずつ判定させると、誤検知を 10% 以下に抑える閾値では、辞書にない癖を含む 65 件のうち最大 21 件(32%)しか検知できませんでした
- 辞書の語を例として質問に添えると、辞書にある癖の検知数は 40 件中 9 件から 18 件に増え、辞書にない癖の検知数は 65 件中 19 件から 21 件でした
- 汎用の質問を加えても、7 問の確率の最大値で判定しても、検知率は上がりませんでした
- Clef-flash の確率では、癖のある文と癖なしの文を区別できませんでした
- 比喩を直した 33 組では、Clef は 27〜30 組で直す前の文に高い確率を付けました
- 同じ 7 問の条件で、「時間を溶かしました」のような比喩であることが明らかな文には 5 件中 4 件で 0.327 以上が付き、「`tsc` を通した」「`content_create` は通ります」には 0.16 未満しか付きませんでした
- 手元から 1 文を判定するリクエストの往復の中央値は Clef が 508 ms、Clef-flash が 200 ms で、1 文あたりの費用は Clef が約 $0.00019 でした

## 参考

- [Introducing Clef · Cloudflare Workers AI changelog](https://developers.cloudflare.com/changelog/post/2026-10-01-clef-workers-ai/)
- [clef · Cloudflare Workers AI docs](https://developers.cloudflare.com/workers-ai/models/clef/)
- [clef-flash · Cloudflare Workers AI docs](https://developers.cloudflare.com/workers-ai/models/clef-flash/)
- [Pricing · Cloudflare Workers AI docs](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Cloudflare/clef - Hugging Face](https://huggingface.co/Cloudflare/clef)
- [Hooks reference - Claude Code Docs](https://code.claude.com/docs/en/hooks)
- [p1ass/textlint-rule-preset-ai-words-ja - GitHub](https://github.com/p1ass/textlint-rule-preset-ai-words-ja)
- [nanaism/yomiyasu - GitHub](https://github.com/nanaism/yomiyasu)
- [jev-playground/docs/fit.md - GitHub](https://github.com/mizchi/jev-playground/blob/main/docs/fit.md)

[^hook]: Claude Code の hook は、ツールの実行の前後などに、設定したコマンドを Claude Code が自動で実行する機能です。コマンドの出力は Claude Code に渡され、Claude Code はその指摘をもとに文章を書き直します。

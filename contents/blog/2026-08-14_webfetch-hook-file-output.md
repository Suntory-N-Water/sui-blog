---
title: WebFetch を hook で差し替えて、手でマークダウンを貼り直す運用をやめる
slug: webfetch-hook-file-output
date: 2026-08-14
modified_time: 2026-08-14
description: Claude Code の WebFetch を PreToolUse hook で deny し、本文をマークダウンファイルに書き出してパスと行数だけを返す方式に差し替えました。全文を応答で返してコンテキストを使い切った失敗から、抽出ライブラリの選定や画像除去まで、設計の理由を書いています。
icon: 🏄️
icon_url: /icons/person_surfing_flat_default.svg
tags:
  - ClaudeCode
  - AI
---

Claude Code の WebFetch は、URL を渡すだけでページの内容を読んでくれます。調査を任せるときに一番手軽なツールで、私も日常的に使っています。ただし、返ってくるのは取得したページの原文ではありません。

取得後に Haiku が要約したものが親モデルに渡ります。この挙動は [Claude Code の WebFetch は Haiku が要約している](https://zenn.dev/zhizhiarv/articles/claude-code-webfetch-haiku-summary) に詳しく書かれているので、そちらをご確認ください！

要約されると、その結果をもとに実装しても動かない時があります。
「本当にそれで合っているの?」と聞き直すと「実はこうでした」と返ってきます。
この往復が何度も発生しました。
最後はいつも自分でブラウザを開き、公式ドキュメントのマークダウンを全部コピーして貼り付けます。
そこでようやく「なるほど、こうでしたね」と話が進みます。

原文が必要だと分かっているなら、手で貼るのがいちばん確実です。同じことをしている人はそれなりにいるはずです。ただ、調査のたびにブラウザを開いてコピーするのは続きません。

そこで今回は、[PreToolUse hook](https://code.claude.com/docs/en/hooks) で WebFetch を差し替えました。ページ本文はマークダウンファイルとして書き出し、応答ではそのファイルパスと行数だけを返します。

## 全文を渡す方式は一度失敗している

「要約されて情報が落ちるなら、原文をそのまま渡せばいいだけでは」と思うところです。
私も最初はそう考えて、取得した本文を hook の応答テキストとしてまるごと返していました。

これは [Cloudflare の API リファレンス](https://developers.cloudflare.com/api/) を取得した時点で破綻しました。それまで 20% だったコンテキスト使用率が、この 1 回で 100% に到達しました。残りの 80% を 1 ページで使い切ったわけです。

要約すれば情報が落ち、全文を渡せばコンテキストが埋まります。この 2 択のまま最適解を探しても、どこかで必ず詰まります。

解決策は、本文をファイルに書き出し、応答では保存先のパスと行数だけを返すことでした。
本文そのものを渡すのをやめれば、コンテキストは埋まりません。
あとは親モデルが必要な箇所だけを Read や Grep で取りに行きます。数千行あるリファレンスからでも、読ませるのは数十行で済みます。
ファイルはそのまま残るので、同じページを後から参照するときも読み直せます。

## deny してパスを返すように差し替える

hook 本体は [cc-hooks-ts](https://github.com/sushichan044/cc-hooks-ts) の `defineHook` で書いています。hook はシェルスクリプトで書くことが多いと思いますが、cc-hooks-ts を使うと TypeScript で書けて、入出力に型が付きます。

やっていることは、PreToolUse で WebFetch の呼び出しを検知し、`permissionDecision` に `deny` を返すだけです。

deny したら何も返らないように思えます。ところが `permissionDecisionReason` の中身は親モデルに渡ります。
これは拒否した理由を親モデルに伝えるためのフィールドですが、ここに保存先を書いてしまえば、実質的にツールの返り値を差し替えたことになります。

```ts
return c.json({
  event: 'PreToolUse',
  output: {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: [
        `You should not use web fetch for ${url}.`,
        'The page has been saved as markdown. Read or grep this file:',
        outputPath,
        `lines: ${document.trimEnd().split('\n').length}`,
      ].join('\n'),
    },
  },
});
```

行数を一緒に返しているのは、Read で全部読むか Grep で絞るかを親モデル自身に判断させるためです。

ファイルは `~/.claude/web-fetch/` 配下に、実行時の作業ディレクトリごとに分けて保存します。ファイル名はページタイトルから作り、衝突したら上書きします。取得した直後に読まれる前提なので、履歴は残しません。

実装の全体は[こちら](https://gist.github.com/Suntory-N-Water/a7f30e194f3e602b72426966932da05f)に置いてあります。よろしければ見てみてください！

## 原文を扱うと決めると、判断が 3 つ増える

仕組みとしてはここまでで完成です。
ただし原文を扱うと決めた瞬間、要約に任せていた頃は考えずに済んだことを自分で判断する羽目になりました。
この記事で一番書きたかったのはここです。

### マークダウンで取れるライブラリを選ぶ

本文抽出といえば [Readability](https://github.com/mozilla/readability) が定番で、精度にも不満はありませんでした。取れなかったのは、覚えている限り Angular の公式ドキュメントくらいです。

採用しなかった理由は出力形式です。
Readability が返せるのは HTML と、装飾を全部落としたプレーンテキストの 2 つだけで、マークダウンでは出力できません。

HTML のまま保存すると、閉じタグや class 属性の分だけ無駄にトークンを払います。
プレーンテキストにすると、見出しやコードブロックの区別が消えて技術ドキュメントとして読めません。
turndown のような変換ライブラリを挟む手もありますが、工程が 1 つ増えます。

そこで [Defuddle](https://github.com/kepano/defuddle) を使いました。`markdown: true` を渡すと、抽出結果をマークダウンで直接返してくれます。

```ts
async function extractMarkdown(
  html: string,
  url: string,
): Promise<{ markdown: string; title: string }> {
  const { document } = parseHTML(stripImages(html));
  const result = await Defuddle(document, url, { markdown: true });
  return { markdown: result.content, title: result.title };
}
```

### 画像タグを除去する

これは実際にやらかしてから入れた処理です。
base64 の data URI[^data-uri] で埋め込まれた画像を大量に読み込んでしまい、トークンを一気に持っていかれました。
data URI の画像は 1 要素で数万トークンになることもあります。

そもそもテキストとして読ませたい原文に、画像のバイナリ表現は必要ありません。DOM に変換する前の HTML 文字列の段階で、`<img>` タグをまとめて削除しています。

```ts
function stripImages(html: string): string {
  return html.replaceAll(/<img\b[^>]*>/gi, '');
}
```

要約を挟んでいた頃は、画像の除去は Haiku 側が勝手に吸収してくれていました。
原文を渡すと決めるなら、こうした前処理も自分で実装することになります。

### 抽出できなければ標準の WebFetch に戻す

自前の抽出を全面的に信用する設計にはしませんでした。
cc-hooks-ts には、hook を成功として終了させる `c.success()` があります。
これを返すと Claude Code 標準の WebFetch がそのまま動くので、次の 4 つのケースでは無理をせず標準の挙動に戻しています。

- raw content の URL で、そもそも HTML ではない場合
- HTTP のレスポンスがエラーだった場合
- `Content-Type` が `text/plain` だった場合
- Playwright で取り直しても本文が空だった場合

4 つ目に出てくる Playwright は、フォールバック専用です。
静的なページでも抽出結果が空になることがまれにあり、その場合だけブラウザを起動して描画後の HTML を取り直します。
ブラウザの起動コストを毎回払う理由はないので、通常の `fetch` で足りるならそちらで済ませます。

自前の抽出が失敗して何も返らないより、要約でも返ってくるほうがましです。標準の WebFetch は、そのための戻り先として残しています。

## まとめ

- WebFetch の返り値は Haiku の要約なので、原文を前提にした調査には向かない
- 原文を応答テキストでまるごと渡すと、ページの内容によっては 1 回のフェッチでコンテキストウィンドウを使い切ってしまう
- 本文はファイルに書き出し、応答ではパスと行数だけを返すと、親モデルが必要な箇所だけを Read や Grep で取りに行ける
- PreToolUse で `deny` を返しつつ `permissionDecisionReason` に保存先を書くと、ツールの返り値を実質的に差し替えられる
- 本文抽出ライブラリは抽出精度ではなく出力形式で選ぶ。マークダウンで受け取れないと変換の工程が増える
- data URI の画像はトークンを大量に消費するので、抽出前に `<img>` タグを削除する
- 抽出に失敗したときは標準の WebFetch に戻し、自前実装を全面的には信用しない

hook はツールの前後に処理を挟むためのしくみだと思っていましたが、実際はツールの返り値そのものを自分で決められる場所でした。標準の渡し方が用途に合っていないなら、書き換えてしまえます。

ブラウザを開いてマークダウンを貼り付ける作業は、これでなくなりました。

## 参考

https://zenn.dev/zhizhiarv/articles/claude-code-webfetch-haiku-summary

https://code.claude.com/docs/en/hooks

https://github.com/kepano/defuddle

https://github.com/mozilla/readability

https://github.com/sushichan044/cc-hooks-ts

[^data-uri]: 画像などのデータを、外部ファイルへの参照ではなく URL の文字列の中に直接埋め込む形式です。base64 でエンコードされるため、元のバイナリより約 33% 大きくなります。

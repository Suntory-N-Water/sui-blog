---
title: WebFetch を hook で差し替えて、手でマークダウンを貼り直す運用をやめた
slug: webfetch-hook-file-output
date: 2026-08-14
modified_time: 2026-08-14
description: Claude Code の WebFetch を PreToolUse hook で deny し、本文をマークダウンファイルに書き出してパスと行数だけを返す方式に差し替えました。全文を応答で返してコンテキストを使い切った失敗から、抽出ライブラリの選定や画像除去まで、設計の理由を書いています。
icon: 🏄️
icon_url: /icons/person_surfing_flat_default.svg
tags:
  - ClaudeCode
  - AI
  - TypeScript
---

Claude Code の WebFetch は、URL を渡すだけでページの内容を読んでくれます。調査を任せるときに一番手軽なツールで、私も日常的に使っています。ただし、返ってくるのは取得したページの原文ではありません。

取得後に Haiku が要約したものが親モデルに渡ります。この挙動は [Claude Code の WebFetch は Haiku が要約している](https://zenn.dev/zhizhiarv/articles/claude-code-webfetch-haiku-summary) に詳しく書かれているので、そちらに譲ります。

要約されると何が起きるか。調査させて、その結果をもとに実装させると動かないのです。「本当にそれで合っているの?」と聞き直すと「実はこうでした」と返ってくる。この往復が何度も発生しました。そして最後はいつも同じ手に落ち着きます。自分でブラウザを開き、公式ドキュメントのマークダウンを全部コピーして貼り付ける。そこでようやく「なるほど、こうでしたね」と話が進みます。

この手貼りは怠慢ではありません。原文が必要だと分かっている人間が取る、いちばん確実で速い手段です。同じことをしている人はそれなりにいるはずです。

間違っているのは貼る作業そのものではなく、貼る主体が毎回私であることでした。そこで [PreToolUse hook](https://code.claude.com/docs/en/hooks) で WebFetch を差し替えました。ページ本文はマークダウンファイルとして書き出し、応答ではそのファイルパスと行数だけを返します。

## 全文を渡す方式は一度失敗している

「要約されて情報が落ちるなら、原文をそのまま渡せばいいだけでは」と思うはずです。私も最初はそう考えて、取得した本文を hook の応答テキストとしてまるごと返していました。

これは Cloudflare の API リファレンスを取得した時点で破綻しました。それまで 20% だったコンテキスト使用率が、その 1 回のフェッチで 100% に到達したのです。残りの 80% を、たった 1 ページで使い切った計算になります。

要約すれば情報が落ちて、全文を渡せばコンテキストが埋まります。この 2 択のまま最適解を探しても、どこかで必ず詰まります。

抜け道は「渡す」のをやめることでした。本文はファイルに書き出しておき、応答では保存先のパスと行数だけを返します。あとは親モデルが必要な箇所だけを Read や Grep で取りに行きます。数千行あるリファレンスからでも、読ませるのは数十行で済みます。ファイルはそのまま残るので、同じページを後からもう一度参照するときにも読み直せます。

## deny してパスを返すように差し替える

hook の実装は、PreToolUse で WebFetch を捕まえて `permissionDecision` に `deny` を返すだけです。

deny したら何も返らないように思えます。ただし `permissionDecisionReason` の中身は親モデルに渡ります。本来は「なぜ拒否したか」を伝えるための場所ですが、ここに保存先を書いてしまえば、実質的にツールの返り値を差し替えたことになります。

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

保存先は `~/.claude/web-fetch/` の下です。実行時の作業ディレクトリごとにサブディレクトリを分けています。ファイル名はページタイトルから作り、衝突したら上書きします。取得した直後に読まれる前提のファイルなので、履歴を残す意味がないと判断しました。

hook 本体は [cc-hooks-ts](https://github.com/sushichan044/cc-hooks-ts) の `defineHook` で書いています。実装の全体はこちらに置いてあります。

<!-- TODO: 直前の「実装の全体はこちらに置いてあります」の「こちら」に Gist のリンクを貼る。貼れないならこの一文ごと削除する -->

## 原文を扱うと決めると、判断が 3 つ増える

ここまでで仕組みとしては完成しているように見えます。しかし、原文をそのまま扱うと決めた瞬間、要約に任せていた頃には考えなくてよかったことを自分で決める羽目になりました。この記事で一番書きたかったのはここです。

### マークダウンで取れるライブラリを選ぶ

本文抽出といえば [Readability](https://github.com/mozilla/readability) が定番です。実際、抽出精度そのものには不満がありませんでした。本文が取れなかったのは、覚えている限り Angular の公式ドキュメントくらいです。他はほぼ問題なく抽出できていました。

採用しなかった理由は精度ではなく出力形式です。Readability が返すのは HTML か、装飾を全部落としたプレーンテキストのどちらかで、マークダウンでは出力できません。確認した限り、選べるのはこの 2 つだけでした。

HTML のまま保存すると、閉じタグや class 属性の分だけ無駄にトークンを払います。プレーンテキストにすると、今度は見出しやコードブロックの区別が消えて、技術ドキュメントとしては読めたものではなくなります。turndown のような変換ライブラリを挟む手もありますが、工程が 1 つ増えます。

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

`parseHTML` は [linkedom](https://github.com/WebReflection/linkedom) のもので、HTML 文字列を Document に変換しています。Defuddle は HTML 文字列も受け取れます。ただしこの使い方は非推奨で、次のメジャーバージョンで削除される予定です。最初から Document を渡しているのはそのためです。

### 画像タグを除去する

これは実際にやらかしてから入れた処理です。base64 の data URI[^data-uri] で埋め込まれた画像を大量に読み込み、トークンを一気に持っていかれました。data URI の画像は 1 要素で数万トークンになることもあります。

そもそもテキストとして読ませたい原文に、画像のバイナリ表現は必要ありません。DOM に変換する前の HTML 文字列の段階で、`<img>` タグをまとめて落としています。

```ts
function stripImages(html: string): string {
  return html.replaceAll(/<img\b[^>]*>/gi, '');
}
```

要約を挟んでいた頃は、こういう処理は Haiku 側が勝手に吸収してくれていました。原文を渡すと決めるということは、こうした前処理を自分で持つということでもあります。

### 抽出できなければ標準の WebFetch に戻す

自前の抽出を全面的に信用する設計にはしませんでした。`c.success()` を返すと hook は素通しになり、Claude Code 標準の WebFetch がそのまま動きます。次の 4 つのケースでは、無理をせず標準の挙動に戻しています。

- raw content の URL で、そもそも HTML ではない場合
- HTTP のレスポンスがエラーだった場合
- `Content-Type` が `text/plain` だった場合
- Playwright で取り直しても本文が空だった場合

4 つ目に出てくる Playwright は、フォールバック専用です。静的なページでも抽出結果が空になることがまれにあり、その場合だけブラウザを起動して描画後の HTML を取り直します。ブラウザの起動コストを毎回払う理由はないので、通常の `fetch` で足りるならそちらで済ませます。

要約が落とすのは情報だけではなく、こういう失敗も一緒に吸収していました。原文を取りに行く以上、取れなかったときの逃げ道は自分で用意します。

## まとめ

- WebFetch の返り値は Haiku の要約なので、原文を前提にした調査には向かない
- 原文を応答テキストでまるごと渡すと、1 ページでコンテキスト使用率が 20% から 100% まで飛ぶことがある
- 本文はファイルに書き出し、応答ではパスと行数だけを返すと、親モデルが必要な箇所だけを Read や Grep で取りに行ける
- PreToolUse で `deny` を返しつつ `permissionDecisionReason` に保存先を書くと、ツールの返り値を実質的に差し替えられる
- Readability は抽出精度には不満がないが、マークダウンで出力できないため Defuddle を使っている
- data URI の画像はトークンを大量に消費するので、抽出前に `<img>` タグを落とす
- 抽出に失敗したときは `c.success()` で標準の WebFetch に戻し、自前実装を全面的には信用しない

hook はツールの前後に処理を挟むためのしくみだと思っていました。実際に触ってみると、エージェントに何をどう渡すかを自分で決める場所でした。ツールが用意した渡し方が自分の用途に合っていないなら、そこは書き換えてよい部分です。

ブラウザを開いてマークダウンを貼り付ける作業は、これでなくなりました。

## 参考

https://zenn.dev/zhizhiarv/articles/claude-code-webfetch-haiku-summary

https://code.claude.com/docs/en/hooks

https://github.com/kepano/defuddle

https://github.com/WebReflection/linkedom

https://github.com/mozilla/readability

https://github.com/sushichan044/cc-hooks-ts

[^data-uri]: 画像などのデータを、外部ファイルへの参照ではなく URL の文字列の中に直接埋め込む形式。base64 でエンコードされるため、元のバイナリより約 33% 大きくなります。

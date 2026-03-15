---
title: Claude Code の待ち時間にアニメのセリフを流したくて OSS を作った
slug: cc-spinner-customize-claude-code-spinner-verbs
date: 2026-03-14
modified_time: 2026-03-14
description: Claude Code の処理中に表示される Spinner Verbs をカスタマイズできる CLI ツール「cc-spinner」を作りました。アニメのセリフを入れたら記憶が蘇る体験ができるのではと思い、1日で形にしました。
icon: 🧙‍♀️
icon_url: /icons/woman_mage_flat_default.svg
tags:
  - AI
  - ClaudeCode
  - OSS
---
Claude Code で作業していると、処理待ちの時間が意外と長いことがあります。数十秒間、ターミナルをぼんやり眺めている人は多いのではないでしょうか。

この待ち時間に表示される文字列は Spinner Verbs[^spinnerverbs]と呼ばれていて、[v2.1.23](https://claude-code-log.com/changelog/v2.1.23) からカスタマイズできるようになりました。ただ、この機能自体を知らない人も多いと思います。

先日、「[Claude CodeのSpinner Verbsに癒されてみた](https://dev.classmethod.jp/articles/claude-code-spinner-verbs/)」という記事を読みました。`~/.claude/settings.json` に直接書き込んでカスタマイズする方法と、顔文字や絵文字系などのサンプル集が紹介されていて、読んでいるだけで楽しい記事でした。
これを読んでふと思ったのは「アニメのセリフを入れたらもっと楽しくなるのでは？」と思い、テーマを共有・適用できる CLI ツール「[cc-spinner](https://www.npmjs.com/package/@suntory-n-water/cc-spinner)」を1日で作って OSS として公開しました。

https://github.com/Suntory-N-Water/cc-spinner

## Spinner Verbs とは

Claude Code が処理中にターミナルに表示する文字列です。デフォルトでは「Moonwalking」「Photosynthesizing」「Lollygagging」など、Anthropic が用意したユーモアのある英語の動詞が表示されます。

![Claude Codeのデフォルト文字列であるCaramelizingが表示されている](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/3160b2f033aa08aedbbf21f3d20186d3.png)


設定ファイルはユーザー共通の `~/.claude/settings.json`、プロジェクト単位の `.claude/settings.json`、ローカル用の `.claude/settings.local.json` の3種類があります。

```json
{
  "spinnerVerbs": {
    "mode": "replace",
    "verbs": ["カスタムメッセージ1", "カスタムメッセージ2"]
  }
}
```

`mode` には `"replace"` と `"append"` の2種類があります。`"replace"` はデフォルトをすべて置き換え、`"append"` はデフォルトに追加します。

この設定を手で書くこと自体は難しくありません。ただ、「自分が作ったテーマを他の人にも使ってほしい」「誰かが作ったおもしろいテーマを試したい」となると、JSON を `settings.json` にコピー&ペーストする作業が毎回発生します。

## cc-spinner を作った動機

こちらの記事を読んで「なんかおもろそうだからやってみるか」と思ったとき、頭に浮かんだのは[葬送のフリーレン](https://frieren-anime.jp/)で登場するフリーレン様のセリフでした。

葬送のフリーレンの世界では「イメージできないことは魔法にできない」という設定があります。そこでフリーレン様が「*魔法はイメージの世界だ。水を操る魔法使いに雨の中で勝ているイメージができる？*」というコマがあります。
私はこれに似たようなことを仕事で使ってしまうときがあります。イメージできたものじゃないと開発できないよ、みたいな感じです。

ただ、自分だけで使うなら `settings.json` に直接書けば済みます。わざわざ OSS にしたのは「皆でよいものは共有しようぜ」という考えがあったからです。テーマを JSON ファイルとして定義し、コマンド1つで適用できるようにすれば、誰でも気軽に試せます。

## cc-spinner の使い方

[cc-spinner](https://github.com/Suntory-N-Water/cc-spinner) は `npx` でそのまま実行できます。

### テーマを適用する

```bash
npx @suntory-n-water/cc-spinner add frieren
```

コマンドを実行すると、フリーレン様のセリフが `settings.json` に書き込まれます。適用先はインタラクティブに選べますが、オプションで指定もできます。

```bash
# グローバル設定に適用
npx @suntory-n-water/cc-spinner add frieren --global
# ローカル設定に適用
npx @suntory-n-water/cc-spinner add frieren --local
```

CLIツールとしての操作性は Vercel が提供している skills を参考にしています。

![image](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/b482436c805f03a8b54145d330a48651.png)

### テーマをプレビューする

適用せずに中身だけ確認したい場合は `preview` コマンドを使います。

```bash
npx @suntory-n-water/cc-spinner preview frieren
```

### テーマを検索する

```bash
npx @suntory-n-water/cc-spinner find anime
```

テーマ名、説明、タグを横断して検索できます。

### 任意の GitHub リポジトリからテーマを追加する

組織やチームで独自のテーマリポジトリを運用する場合にも対応しています。

```bash
npx @suntory-n-water/cc-spinner add owner/repo
```

自分だけのテーマを自分のリポジトリに置いてもよいですし、チームで共有するテーマリポジトリを作ってもよいでしょう。

## テーマの作り方

テーマは JSON ファイルで定義します。以下は frieren テーマの実際の中身です。

```json
{
  "$schema": "../schema.json",
  "name": "frieren",
  "description": "葬送のフリーレンに登場するフリーレン様のセリフ",
  "tags": ["anime", "japanese"],
  "mode": "replace",
  "verbs": [
    "…人間の寿命は短いってわかっていたのに… …なんでもっと知ろうと思わなかったんだろう…",
    "私の集めた魔法を褒めてくれた馬鹿がいた。それだけだよ。",
    "魔法はイメージの世界なんだ",
    "…縦ロールになっちゃった…",
    "アウラ、自害しろ",
    "暗いよ〜！怖いよ〜！",
    "…(以下省略)"
  ]
}
```
自分のテーマを作って cc-spinner に追加したい場合は、リポジトリを Fork して `themes/` ディレクトリに JSON ファイルを追加し、Pull Request を送ってください。
承認者は私しかいませんが、基本的にテーマの内容と実態があっていればマージします。マージされれば `npx @suntory-n-water/cc-spinner add <name>` で誰でも使えます。

## フリーレン様の顔が浮かぶ

cc-spinner を使って Claude Code を動かしていたとき、スピナーの横に「縦ロールになっちゃった…」と流れてきました。その瞬間、髪の毛が縦ロールになったフリーレン様の顔が浮かびます。

![縦ロールになっちゃったフリーレン様](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/fadd94616f54a473fd6a919a59ddd9dd.jpg)

この体験こそ、自分が作りたかったものそのものでした。先ほどの記事で紹介されていた「待ち時間を癒す」という方向性もよいのですが、cc-spinner で実現したかったのは「**アニメを見たときの記憶を追体験できる**」ことです。ターミナルに知っているセリフが流れてくると、そのシーンの映像や感情が蘇ります。

Claude Code の処理待ちは長いときだと数十秒続きます。その間、ただ待っているだけの時間に、自分の好きなコンテンツのセリフが流れてくる。開発ツールの待ち時間が、ちょっとした楽しみになってほしいなと思います。
とりあえず私が好きな作品をいくつか入れていきますかね。

## まとめ

- Spinner Verbs は Claude Code v2.1.23 からカスタマイズ可能になった機能で、`settings.json` に設定を書くことで処理中の表示を変更できる
- cc-spinner は Spinner Verbs のテーマを共有・適用できる CLI ツールで、`npx @suntory-n-water/cc-spinner add <theme>` で使える
- Spinner Verbs の紹介記事にインスパイアされ、「アニメのセリフで記憶を追体験する」という方向性で1日で形にした
- 任意の GitHub リポジトリからテーマを追加できるので、チームや個人で独自のテーマを運用できる

## 参考

https://github.com/Suntory-N-Water/cc-spinner

https://dev.classmethod.jp/articles/claude-code-spinner-verbs/

https://code.claude.com/docs/en/settings

https://github.com/vercel-labs/skills

[^spinnerverbs]: Claude Code が処理中にターミナルのスピナー横に表示する文字列。デフォルトではユーモアのある英語の動詞が表示される。

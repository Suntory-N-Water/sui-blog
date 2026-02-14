---
title: 今更だけどMarkdownでPowerPointが作成できるMarpに入門してみる
slug: little-late-ill-introduce-marp-allows
date: 2024-07-28
modified_time: 2024-07-28
description: MarkdownでPowerPointスライドが作成できるMarpに入門します。ハンズオン形式でMarpの環境構築から実際のスライド作成までを解説します。
icon: 📺
icon_url: /icons/television_flat.svg
tags:
  - PowerPoint
  - Marp
---

## はじめに

Marp を使用して Markdown から Power Point のスライドをハンズオン形式で作成したい！

## ハンズオンで作成していく

環境構築から始めましょう。

## プロジェクトディレクトリの作成

新しいディレクトリを作成し、そこに移動します。

```bash
mkdir marp-presentation
cd marp-presentation
```

## プロジェクトの初期化

pnpm を使用してプロジェクトを初期化します。

```bash
pnpm init
```

## Marpのインストール

Marp CLI をインストールします。

```bash
pnpm add -D @marp-team/marp-cli
```

## package.jsonの設定

scripts セクションに以下の行を追加します。

```json
  "scripts": {
    "dev": "npx @marp-team/marp-cli -s ./src",
    "build": "npx @marp-team/marp-cli ./src --pptx --theme-set ./src/styles/*.css --allow-local-files"
  }
```

## Markdownファイルの作成

プロジェクトの `src` 配下に `presentation.md` という名前のファイルを作成し、Power Point 化したい内容を記述します。

ここでは一例として太平洋戦争の開始から終了までの流れを簡単にまとめたものを記述します。

```markdown
---
marp: true
theme: "base"
size: 16:9
---

## 太平洋戦争の始まりから終わりまで

---

## ⚠はじめに

このスライドは`Marp`で作成しており、PowerPoint化したものは直接編集することができなくなります。
編集する場合は`presentation.md`から編集したあと`pnpm run build`してください。

---

## 序章

太平洋戦争(1941年-1945年)は、第二次世界大戦の一部として行われた戦争であり、日本と連合国(主にアメリカ、イギリス、中国、オーストラリアなど)との間で戦われました。

この戦争は、アジア太平洋地域における覇権を巡る戦いであり、最終的には日本の敗北に終わりました。

---

## 背景

- 1930年代、日本は中国への侵略を開始
- 満州事変(1931年)や日中戦争(1937年)を経て、アジアにおける勢力を拡大
- 西側諸国との緊張が高まる

---

## 真珠湾攻撃

- 1941年12月7日(日本時間12月8日)
- 日本がハワイの真珠湾にあるアメリカ海軍基地を奇襲攻撃
- アメリカの太平洋戦争参戦のきっかけに
- 短期的には日本の成功だが、長期的には逆効果

---

## 初期の日本の勝利

- フィリピン、マレー半島、シンガポール、インドネシアなどを占領
- 資源の確保と戦略的な拠点を築く

---

## ミッドウェー海戦

- 1942年6月
- 太平洋戦争の転換点
- アメリカが日本に対して決定的な勝利
- 日本は空母4隻を喪失

---

## ガダルカナル島の戦い

- 1942年8月から1943年2月
- アメリカがガダルカナル島を奪還
- 日本の南進作戦を阻止

---

## レイテ沖海戦

- 1944年10月
- フィリピンのレイテ沖で行われた海戦
- アメリカが再び日本に対して大規模な勝利
- 日本の海軍力に壊滅的な打撃

---

## 沖縄戦

- 1945年4月から6月
- アメリカ軍が沖縄島を占領
- 非常に激しい戦闘で多くの犠牲者
- 本土決戦を予感させる戦い

---

## 広島・長崎への原子爆弾投下

- 1945年8月6日：広島に原子爆弾投下
- 1945年8月9日：長崎に原子爆弾投下
- 数十万人の市民が犠牲に
- 日本の降伏決断のきっかけに

---

## 終戦

- 1945年8月15日：日本がポツダム宣言を受諾し、無条件降伏を発表
- 1945年9月2日：東京湾の戦艦ミズーリ上で正式な降伏文書に調印
- 太平洋戦争の終結

---

## 結論

- 日本の侵略政策と連合国の抵抗が引き起こした戦争
- 多くの犠牲を伴った
- 戦争の悲惨さと平和の重要性を再認識
- 現在の国際関係にも多くの影響

---

## 参考文献

[「太平洋戦争」Wikipedia](https://ja.wikipedia.org/wiki/太平洋戦争)
```

## プレゼンテーションのビルド

以下のコマンドを実行して、Markdown ファイルを PowerPoint ファイルに変換します。

これにより `src` 配下に `presentation.pptx` ファイルが生成されます。

```bash
pnpm run build
```

## プレゼンテーションの表示

生成された PowerPoint ファイルを開いて、スライドを確認します。
確認すると問題なく生成できていることが確認できます。

![Marpで生成されたPowerPointスライドの表示確認画面](https://storage.googleapis.com/zenn-user-upload/fae5ea8403ce-20240728.png)



## 作成してみたけど…

## 編集ができない！

pptx 形式で出力した場合、PowerPoint で編集することはできないです。

各スライドがそれぞれ 1 枚の画像のようになってしまい、文字の移動や誤字脱字等の修正、位置の調整など個々の要素は直接編集できなくなります。

## スライドがシンプルすぎる！

これは CSS を当てることで解消できます。
ということで CSS をあてて最低限の CSS を設定していきます。

## CSSの設定

今回は 3 つに絞って設定していきます。

1. フォントの変更
2. 背景色の変更
3. 文字色の変更

`src/styles` に `base.css` を作成します。

作成後に以下を入力します。

```css
/* @theme base */
@import "gaia";
```

marp では CSS にファイル名と同じ theme 名を設定する必要があります。

例: base.css なら `/* @theme base */` を入力する。

デフォルトのテーマ(gaia)をインポートとします。
このインポートは雛形のようなもので、全て 1 から設定せず部分的に調整したいためです。

フォントは NotoSansJP、背景色は好みの色(自作)で設定し、文字色は黒にします。

```css
/* @theme base */
@import 'gaia';
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap');

:root {
  --background: linear-gradient(to bottom right, #9bd4ff, #fffa9b);
  --color: #333333;
  --font-family: 'Noto Sans JP', sans-serif;
  --margin: 32px;
  --border-radius: 16px;
}

section {
  background: var(--background);
  color: var(--color);
  font-family: var(--font-family);
}

section::before {
  background: white;
  content: '';
  position: absolute;
  top: var(--margin);
  left: var(--margin);
  right: var(--margin);
  bottom: var(--margin);
  border-radius: var(--border-radius);
  z-index: 0;
}

section > * {
  position: relative;
  z-index: 1;
}
```

設定後、`presentation.md` で theme 部分を変更します。

```diff md
 ---
 marp: true
-theme: "gaia"
+theme: "base"
 size: 16:9
 ---
```

`pnpm run build` すると、pptx ファイルが作成されます。

作成後開いてみると css を設定した Power Point ができていることが確認できます。
![CSSが適用されたMarp PowerPointスライドの表示結果](https://storage.googleapis.com/zenn-user-upload/d2e5ab67b77d-20240728.png)


## おわりに

Power Point を出力したあとに編集できないのが少しネックですが、ベースの CSS さえ定義してしまえばあとは自分好みのスライドを Markdown 形式で書いていけるのがとても良いですね！

私はスライドを作成するとき、必ず OneNote などで文字に書き下ろしてからスライドに着手しています。
使いこなせば OneNote から Power Point に書き写す工程がなくなり、そのままスライドになるのはとても魅力的でした。
気になるトピックなのでもう少し深ぼってみようと思います👍️

今回はこのあたりで終わりたいと思います。
作成に使ったリポジトリはこちらです。

https://github.com/Suntory-N-Water/marp-pptx-tutorial-

## 参考

https://zenn.dev/cota_hu/books/marp-beginner-advanced

https://marpit.marp.app/
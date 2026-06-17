---
title: スマホで開いたブログが10秒固まっていた話と、原因が過去の自分だった件
slug: blog-mobile-performance-fix
date: 2026-06-17
modified_time: 2026-06-17
description: iPhone で自分のブログを開いたら10秒以上白画面が続きました。Cloudflare Fonts や Bot Fight Mode、Astro の client:idle を順に疑っていったら、最後に残った10秒の正体は、過去の自分が書いた1行の CSS でした。
icon: 🐢
icon_url: /icons/turtle_flat.svg
tags:
  - Cloudflare
  - Astro
---

久々に iPhone で自分のブログを開いたら、白い画面が10秒以上動きませんでした。

PageSpeed Insights[^psi] でモバイルのスコアを測ったら 53 点。最初に疑ったのは Cloudflare の自動最適化です。Cloudflare Fonts も Bot Fight Mode も、ダッシュボードのトグルを押しただけで、中身は一度も見ていません。

設定を解除してみると、たしかに遅さの一因ではあります。ただ、消したあとも白画面は10秒のまま動きません。最後まで残った10秒の正体は、Cloudflare でも Astro でもなく、過去の自分が書いた1行の CSS でした。

最終的に PageSpeed スコアは 97、FCP[^fcp] は 8.0 秒から 1.1 秒になりました。この記事では、検証の過程で学んだことと、次に同じ症状が出たときのための調査手順をまとめます。

## まず Cloudflare を疑う

PageSpeed Insights のレポートを開くと、最初に出てくるのは「レンダリングをブロックしているリクエスト」、つまり Google Fonts の Noto Sans JP です。CSS のサイズは 119KB あり、1,530ms 間ブロックしています。フォントだろうな…と思いつつ、HTML 自体のサイズも測ってみます。

```bash
curl -s https://suntory-n-water.com/ | wc -c
# → 399,015 バイト(約 399 KB)
```

399 KB もあります。技術ブログのトップページは普通 20〜50 KB なので、明らかにおかしいです。中を覗いてみると、1つの `<style>` ブロックに 374 KB の `@font-face` 宣言が詰め込まれていました。

```
Style block 1: 373,928 bytes
  Preview: @font-face {font-family:Noto Sans JP; ...unicode-range: U+8b2d,...
```

[Cloudflare Fonts](https://developers.cloudflare.com/speed/optimization/content/fonts/) の挙動でした。Google Fonts の CSS を外部リクエストなしで配信するために、`@font-face` 宣言を全部 HTML にインライン化するしくみです。Noto Sans JP は日本語対応で Unicode-range のサブセットが数百個あり、展開するとこのサイズになります。「速くなる機能」が、日本語フォントだと逆に肥大化していました。

Cloudflare Fonts を無効化すると、HTML は 99 KB まで縮みます。Google Fonts そのものも `<link>` ごと削除し、本文は `system-ui, ヒラギノ角ゴ ProN, Yu Gothic, sans-serif` のスタックに切り替えました。コードブロック用に自己ホストしていた `PlemolJP35Console`(1.1 MB)も外し、`Menlo, SF Mono` などのシステム等幅フォントに変更します。

ここまでやっても、iPhone の白画面は消えていません。

## iOS Safari で13秒の空白がある

ローカルや Mac のブラウザでは速いのに、iPhone だけが遅いです。デスクトップの DevTools には症状が出ないので、iPhone を Mac に USB 接続して、Safari の Web インスペクタで HAR[^har] を取得します。

並べてみると、リクエストが2段階で読み込まれていました。

```
      0ms  HTML・CSS・React本体(全部ここで完了)
    700ms  Header.js
  -----  ← 13秒の空白 -----
  13,032ms  jsx-runtime.js, lucide-icons.js, Header(以下多数)
```

700ms で全リソースのダウンロードは終わっているのに、13 秒後に再度読み込まれます。空白の13秒には、原因が2つ重なっていました。

### client:idle と requestIdleCallback の相性

第 2 グループに並んでいたのは、すべて Astro の `client:idle` を付けていたコンポーネントの JS です。

`client:idle` はブラウザのアイドル状態を検知して JS を遅延実行するしくみで、内部で `requestIdleCallback` を使います。便利そうな名前ですが、[Safari はこの API をデフォルト非対応](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback#browser_compatibility)で、機能フラグの裏に隠れています。
Astro は非対応ブラウザ向けに `setTimeout` でフォールバックします。ところが iOS のバッテリー管理や省電力制御は、この `setTimeout` を平気で 13 秒以上ずらしてきます。「アイドルになったら実行する」が「電力的に都合がよくなったら実行する」になり、iOS ではその都合がなかなか来てくれません。

`client:idle` を全部 `client:visible` に変えます。IntersectionObserver ベースで、要素が画面に入った時点で即座にハイドレーションされ、電力管理の影響を受けません。

### Bot Fight Mode のトグルが効いていなかった

それでも `window.load` イベントだけは 12 秒後にしか発生しません。HAR をさらに眺めて、見慣れないリクエストに気付きました。

```
12,662ms  /cdn-cgi/challenge-platform/h/b/scripts/jsd/1eec42285
```

Cloudflare のbot検出スクリプト(JavaScript Detection)が 12.6 秒かかって、`window.load` をブロックしていました。

ダッシュボードに戻ってみると、Bot Fight Mode のトグルそのものはたしかにオフになっています。でも「JS 検出」の項目だけがオンのまま残っていました。[コミュニティでも報告されている](https://community.cloudflare.com/t/unable-to-disable-javascript-detections-even-when-bot-fight-mode-is-turned-off/839664)とおり、ダッシュボードのトグルだけでは JS Detection が消えないバグです。

API 経由で無効化する必要がありそうです。

```bash
curl -s https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/bot_management \
  -X PUT \
  -H "Authorization: Bearer {API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"enable_js": false, "fight_mode": false}'
```

これで `window.load` は 383ms まで縮みます。ところが、 iPhone ではまだ白画面が10秒続いていました。

## 残った10秒の正体は、過去の自分が書いた一行だった

スピナーは2秒で止まっていて、`load` イベントも発生しています。ネットワーク的にもアセット的にもページは完成しているはずなのに、画面は真っ白のままです。10秒ほど経ってから、コンテンツが一気に現れます。

「GPU の計算が終わるまで、ブラウザがペイントを保留している」状態です。今度はネットワークでも JS でもなく、描画の問題でした。

`src/pages/index.astro` のヒーローセクションに、ぼんやりした光のような装飾を入れている部分がありました。

```html
<div class="... blur-[110px] animate-float">
  <!-- 320×320px に半径 110px のぼかし -->
  <div class="... blur-[90px] animate-float">
    <!-- 192×192px に半径 90px のぼかし -->
  </div>
</div>
```

いつ書いたか思い出せないくらい昔、見た目を整えるために自分で入れた一行です。

`filter: blur(110px)` は、半径が大きいほど参照するピクセル数が増え、計算量が急激に膨らむ処理です。Mac の GPU では一瞬で終わるため、Mac の Safari でも iOS シミュレータでも気付けません。モバイル GPU だと数秒〜十数秒かかります。そしてこの計算が終わるまで、ブラウザは一切ペイントを始めません。

要素を削除すると、白画面が消えました。

遅さの正体は、過去の自分が見た目のために置いた1行の CSS でした。

## 次に遅くなったときのための調査手順

今回の反省は、よしなにやってくれる機能ほど、しくみと影響を一度は自分の目で見ておくべきだった、ということです。Cloudflare Fonts も Bot Fight Mode も機能としては合理的で、日本語フォントや iOS Safari という自分の条件で噛み合わなかっただけです。そして、新しく入れた機能を疑う前に、過去に自分が書いたコードも同じくらい疑う必要があります。

次に同じ症状が出たときのために、自分用のたどり方も残しておきます。

まず HTML サイズを測ります。

```bash
curl -s https://suntory-n-water.com/ | wc -c
```

100 KB 前後ならまず正常です。3〜400 KB あれば CDN が何かをインライン化している可能性が高いと言えます。次に、注入されているスクリプトの種類を確認します。

```bash
curl -s https://suntory-n-water.com/ | grep -E "challenge-platform|cf-rocket|Cloudflare Fonts"
```

何も出なければ問題ありません。`challenge-platform` が出てきたら bot 検出 JS が動いています。ここまでで HTML 側の問題はだいたい潰せるはずです。

ここから先は実機を見るしかありません。iPhone の「設定 → Safari → 詳細 → Web インスペクタ」をオンにして USB でつなぎ、Mac の Safari の開発メニューから iPhone のページを選んで HAR をエクスポートします。
時系列で並べたとき、リクエストが2つのグループに分かれていたら、その間に何かがブロックしています。原因は状況によって変わりますが、分断さえ見つかれば絞り込みは時間の問題です。

## おわりに

PageSpeed のスコアは 53 から 97 に上がりました。FCP は 8.0 秒から 1.1 秒、LCP[^lcp] は 8.9 秒から 1.3 秒に縮みました。数字としては気持ちのよい改善です。

ただ、この1日で得たのは数字よりも「入れたものは検証する」「過去の自分のコードも疑う」という当たり前のことでした。よしなにやってくれるものに任せるなら、その「よしな」がどんな顔をしているかは、自分の目で見ておきたいなと思いました。

自分のサイトに少しでも不安があれば、いったん `curl -s https://... | wc -c` だけでも叩いてみてほしいです。HTML が想像より大きかったら、裏で何かが起きています。

## 参考

https://developers.cloudflare.com/speed/optimization/content/fonts/

https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback

https://docs.astro.build/en/reference/directives-reference/#clientvisible

https://developers.cloudflare.com/bots/get-started/bot-fight-mode/

[^psi]: PageSpeed Insights。Google が提供する Web ページのパフォーマンス計測ツール。モバイルとデスクトップそれぞれに 0〜100 のスコアを付ける。

[^fcp]: First Contentful Paint。ページを開いてから最初のコンテンツ(テキストや画像)が描画されるまでの時間。

[^lcp]: Largest Contentful Paint。ビューポート内で最大のコンテンツが描画されるまでの時間。Core Web Vitals の指標のひとつ。

[^har]: HTTP Archive。ブラウザがやりとりした全リクエストのタイミングやサイズを記録した JSON 形式のファイル。DevTools からエクスポートできる。

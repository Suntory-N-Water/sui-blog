---
title: Cloudflare が WordPress の後継 CMS「EmDash」を作ったので触ってみる
slug: cloudflare-emdash-first-look
date: 2026-04-04
modified_time: 2026-04-04
description: Cloudflare が 2026年4月1日 に発表した TypeScript 製 CMS「EmDash」を `pnpm create emdash@latest` で試してみました。Seed の仕組みでハマった箇所、マーケティングテンプレートへのブログ追加、Cloudflare Access での管理画面保護までまとめます。
icon: 📝
icon_url: /icons/memo_flat.svg
tags:
  - Cloudflare
  - CMS
  - Astro
  - TypeScript
---
WordPress は 2003 年の登場以来、インターネット上のWebサイトの 43% 以上を支え続けています（[W3Techs、2025年4月時点](https://w3techs.com/technologies/details/cm-wordpress)）。これほどの規模で普及したソフトウェアは他にほとんどなく、「誰でもサイトを作れる」という体験を多くの人に届けた偉大なプロジェクトです。

ただ、24 年という年月は技術の世界では相当な重みがあります。WordPress が生まれたころ、AWS EC2 は存在せず、サーバレスなどという概念もありませんでした。プラグインは PHP スクリプトがそのままデータベースやファイルシステムに触れる設計のまま今に至り、[96% のセキュリティ問題がプラグイン起因](https://patchstack.com/whitepaper/state-of-wordpress-security-in-2025/)という状況は変わっていません。

WordPress のこの設計課題に正面から向き合う形で、Cloudflare が 2026年4月1日に「EmDash」を発表しました。WordPress の精神的後継を名乗る TypeScript 製のオープンソース CMS です。発表日がエイプリルフール当日だったので最初は半信半疑でしたが、GitHub リポジトリを確認すると本物でした。セットアップから、マーケティングテンプレートにブログを乗せるところまで試してみたので、詰まったポイントも含めてまとめます。

## EmDash とは何か

[EmDash](https://github.com/emdash-cms/emdash) は Astro[^astro] を中心に据えた TypeScript 製の CMS です。MIT ライセンスで、WordPress との互換性を目指しながらも「WordPress のコードは一切使わずにゼロから作り直した」と明言しています。

WordPress との最大の違いはプラグインの動作モデルです。WordPress のプラグインはサイト全体と同じ実行コンテキストで動くため、プラグインがデータベースやファイルシステムに自由にアクセスできます。EmDash では各プラグインが独立した [Dynamic Worker](https://developers.cloudflare.com/workers/runtime-apis/bindings/worker-loader/) のサンドボックスで動作し、プラグインが宣言したケイパビリティ[^capability]以外には一切アクセスできません。

たとえば「記事が公開されたときにメールを送るプラグイン」を書くとこうなります。

```typescript
import { definePlugin } from "emdash";

export default () =>
  definePlugin({
    id: "notify-on-publish",
    version: "1.0.0",
    capabilities: ["read:content", "email:send"],
    hooks: {
      "content:afterSave": async (event, ctx) => {
        if (event.collection !== "posts" || event.content.status !== "published") return;
        await ctx.email!.send({
          to: "editors@example.com",
          subject: `New post published: ${event.content.title}`,
          text: `"${event.content.title}" is now live.`,
        });
      },
    },
  });
```

このプラグインは `read:content` と `email:send` の 2 つしか宣言していないため、物理的にそれ以外の操作は一切できません。外部ネットワークへのアクセスも、許可されたホスト名だけに絞れます。WordPress のプラグインが「何でもできる」のと対極にある設計だと思います。

> [!WARNING]
> Dynamic Workers を使ったプラグイン機能は 2026年4月4日時点、Cloudflare の有料プランが必要です。

他にも x402[^x402] による有料コンテンツのしくみや、内蔵の MCP サーバ[^mcp]、WordPress からのコンテンツ移行機能など、「今の時代に作るならこうする」という思想があちこちに見えます。

## セットアップ

`pnpm create emdash@latest` を実行すると、対話形式でテンプレートとデプロイ先を選べます。
今回はマーケティングページのテンプレートで Cloudflare Workers へのデプロイを選択しました。

```bash
  — E M D A S H —

┌  Create a new EmDash project
│
◇  Project name?
│  sui-corporate-example
│
◇  Where will you deploy?
│  Cloudflare Workers
│
◇  Which template?
│  Marketing
│
◇  Which package manager?
│  pnpm
│
◇  Install dependencies?
│  Yes
│
◇  Project created!
│
◇  Dependencies installed!
│
◇  Next steps ───────────────╮
│                            │
│  cd sui-corporate-example  │
│  pnpm dev                  │
│                            │
├────────────────────────────╯
│
└  Done! Your EmDash project is ready at sui-corporate-example
```

`pnpm dev` を実行するとコンテンツが何もないまっさらなマーケティングページが表示されます。

![初期状態のマーケティングページ](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/d6eaee72a76d2f82fc211df355089249.png)

殺風景なので公式が用意しているシードデータを流し込みましょう。

```bash
npx emdash seed seed/seed.json

◐ Loading seed file...
✔ Seed file is valid
◐ Running migrations...
✔ Applied 31 migrations
◐ Applying seed...
✔ Seed applied successfully!

ℹ Settings: 2 applied
ℹ Collections: 1 created, 0 skipped, 0 updated
ℹ Fields: 2 created, 0 skipped, 0 updated
ℹ Menus: 1 created, 3 items
ℹ Content: 3 created, 0 skipped, 0 updated
✔ Done!
```

実行したあと「完了した」と出ているのに、ブラウザを見てもコンテンツが反映されていません。
試しに管理画面（`/_emdash/admin`）へ遷移してサイト名を入力したところ、そこで初めてセットアップの API ログが流れているのが見えて、反映されることが分かりました。

なお管理画面の初期セットアップを完了した後は、シードデータが反映されてこのような状態になります。

![シードデータ反映後のマーケティングページ](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/aabe26e0f848869a84f8f3b2153c38b8.png)

## Seed と DB のしくみでハマる

EmDash は管理画面の初期セットアップを完了するまで seed が実 DB へ反映されません。
`http://localhost:4321/_emdash/admin/setup` にアクセスして、サイト名と管理者を作成する初回セットアップを終えて初めてコンテンツが見えます。

ログを見ると理由が分かります。`POST /_emdash/api/setup` が呼ばれた直後に画像のダウンロードとアップロードが走っています。初期セットアップの完了が seed 適用のトリガになっている設計です。

```
[302] /_emdash/admin
[200] /_emdash/admin/setup
[200] /_emdash/api/setup/status
  📥 Downloading: https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=800&fit=crop
  ✅ Uploaded: building-long-term.jpg
  📥 Downloading: https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=800&fit=crop
  ✅ Uploaded: case-for-static.jpg
[200] POST /_emdash/api/setup 501ms
```

「サイト名を設定しないとコンテンツが反映されない」ではなく、「初期セットアップを完了しないと、その環境の DB への seed 適用が終わらない」というしくみになっています。
EmDash における seed は設定ファイルではなく、DB 初期化のための投入データです。`seed.json` を置くだけでは不十分で、その内容が実際に対象 DB へ適用されていることが必要になります。

## マーケティングテンプレートにブログを追加する

### テンプレートを移植する

EmDash の公式テンプレートはマーケティング、ブログ、ポートフォリオの 3 種類があります。
実際のマーケティングページでは、製品への理解を深めてもらうためにブログも必要になるケースが多いと思います。
今回選んだマーケティングテンプレートにはブログページが含まれていないので、ブログテンプレートからコンポーネントを移植してみましょう。

移植作業はシンプルで、以下のファイルをブログテンプレートからコピーして `src/pages/posts/` ディレクトリを作るだけで基本的な構成が動きます。

- `src/components/PostCard.astro`
- `src/components/TagList.astro`
- `src/pages/posts/index.astro`
- `src/pages/posts/[slug].astro`
- `src/pages/category/[slug].astro`
- `src/pages/tag/[slug].astro`
- `src/pages/search.astro`
- `src/pages/rss.xml.ts`
- `src/utils/reading-time.ts`

詳細な移植内容は[こちらのコミット履歴](https://github.com/Suntory-N-Water/sui-corporate-example/commit/f241053daa2f6c17aaa7d8d11c2cb5479b46a3f6)をご確認ください。
CSS 変数(`--color-accent` など)はマーケティングテンプレートのものが使われるので、レイアウトが崩れることなくテーマが統一された状態でブログが表示されます。

### 実際にブログを公開してみる

移植後は管理画面(`/_emdash/admin`)からブログ記事を追加できます。ログインはパスキー[^passkey]ベースで Face ID 認証なのでパスワードがいりません。管理画面は SPA[^spa] で、コレクション(投稿タイプ)の作成からフィールド定義まで、すべてビジュアルで完結する作りです。

![管理画面ダッシュボード](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/a6477056d479d40d29e7409f1aae23a6.png)

コレクション一覧からブログ記事の管理画面を開くと、seed.json で投入済みの記事が並んでいます。

![記事一覧画面](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/29e8434cd5aff17ad5bbe6594670a21c.png)

エディタはマークダウン記法に対応していて、記入しながらプレビューが確認できます。

![ブログエディタ](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/138fdf4e19ee2ead56cd379a3f6efec3.png)

公開すると、こんな感じでブログページに反映されます。思ったよりスムーズに移植できましたね。

![公開後のブログページ](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/c1085475bf5dbce35666b0bb226f6b61.png)

公開後のブログ URL はこちらです。

https://sui-corporate-example.ayasnppk00.workers.dev/

気になるところとしては、Markdown をそのままペーストすると書式が自動で反映されないケースがありました。
α版ですので、こういった細かい課題はまだ残っているところだと思います。

### サイトのレイアウトを修正する

テンプレートの移植が完了したら、サイト全体のレイアウトを調整していきましょう。
ヘッダやフッタの構成を変える場合は Astro ファイルの変更が必要になりますが、今回は CSS の修正だけで全体のフォントや色合いなどを調整していきます。
CSSは `theme.css` が本来のカスタマイズ用ファイルになりますが、現状は `Base.astro` の `<style is:global>` が後優先で反映されます。
そのため、`src/layouts/Base.astro` に設定されている CSS 変数を上書きする形で、全体のテーマカラーやフォントを変更するのが良さそうです。

このように柔らかい雰囲気の色にしてみました。実際の変更は[こちらのコミット履歴](https://github.com/Suntory-N-Water/sui-corporate-example/commit/5e881980ba3bb94ec9913ceba1ffd4f4402e3acf)をご確認ください。

![カスタマイズ後のサイト全体の雰囲気](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/c0ef59c2ade67fc813db6115db829df6.png)

## 管理画面のアクセス制限

ひとつ気になったのは管理パスが `/_emdash/admin` で固定されている点です。URL を直打ちすれば誰でもログインページに到達できてしまいます。

![URL直打ちで管理画面のログインページが表示される](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/2d422e7a3972d6cfa899598173a423da.png)

そこで今回は指定したメールアドレス以外は `/_emdash/admin` へアクセスできないように、Cloudflare Access でアクセス制限を設定していきましょう。
Cloudflare のダッシュボードからアプリケーションを追加して、セルフホストを選びます。

![セルフホストを選択](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/f170d1daa3b15cc75d2e9ffaf6c29323.png)

選択後は、アプリケーションとパブリックホストのパスを設定します。

- アプリケーション名: `emdash-admin`、セッション時間: `24 hours`
- パブリック ホスト名のパス: `/_emdash/admin*`

![アプリケーションの設定画面](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/bc23c30312023c89530743af29489c64.png)

次に Access ポリシーを追加して、許可したいメールアドレスを `包含` ルールの `Emails` セレクタに設定します。

![ポリシーの作成画面](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/76336ea9ec0cf0b3bc25857a207ce8ff.png)

保存後、`allow-my-email` がポリシー一覧に表示されていれば設定完了です。

![ポリシー一覧](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/e75a48978ec01f03e4dd5d4df518da8e.png)

設定後に `/_emdash/admin` へ直アクセスすると、Cloudflare のログイン画面が割り込んできます。

![Cloudflare Accessのログイン画面](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/eeb5897576a7f40a2b22c77162dcec6d.png)

許可していないメールアドレスでワンタイムコードを送信しても、UI 上は「送信しました」と表示されますが実際にはメールは届きません。ブロックされているかどうかが外部から分からないようにする Cloudflare の仕様です。

> By design, blocked users will not receive an email. The login page will always say "A code has been emailed to you", regardless of whether or not an email was sent.
>
> https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/

注意点として、この設定で保護されるのは `/_emdash/admin` 配下のみです。`/_emdash/api/*` は保護対象になりません。ただし EmDash 側で認証必須エンドポイントは弾く設計ですので、最低限の防御は備わっています。

## その他気になったところ

CMS の都合上、毎回のリクエストで DB へのクエリが走る設計になっています。そのためキャッシュが効いていないとき、画面表示で数秒待たされることがありました。
コードを細かく見ているわけではないので断言できないですが、まだまだパフォーマンスを改善できる余地はありそうです。

## まとめ

- EmDash は WordPress の後継を名乗るだけあって、WordPress でありがちな課題を解決するための工夫が随所に見られる
- 特にプラグインの動作モデルは、WordPress の「何でもできる」から対極の「宣言したことしかできない」設計になっていて、セキュリティ面で大きな改善が期待できる
- seed を実行しても管理画面の初期セットアップを完了するまでコンテンツが反映されないため、管理画面のセットアップ完了が seed 適用のトリガになっていることを理解しておく必要がある
- マーケティングテンプレートへのブログ追加は、ブログテンプレートからコンポーネントを移植するだけでおおむね動く
- 管理パス `/_emdash/admin` は固定になっているため、公開環境では Cloudflare Access で `/_emdash/admin*` を保護するとよい
- プラグイン機能(Dynamic Workers によるサンドボックス)を使う場合は Cloudflare の有料プランがいる

v0.1.0 のプレビュー段階なので荒削りな部分もありますが、WordPress が解決できなかった問題を本気で直そうとしている意思は感じました。
TypeScript と Astro で小規模なサイトを作りたいなら、EmDash は魅力的な選択肢になりそうです。
特に個人事業主やマイクロ法人のような小規模な組織で、製品紹介ページとコーポレートサイトを両方持ちたい場合に、EmDash のマーケティングテンプレート + ブログテンプレートの組み合わせはすごく良さそうだと思いました。
WordPress の後継を名乗るだけあって、WordPress でありがちな課題を解決するための工夫が随所に見られるので、今後のアップデートも楽しみですね。

<!-- textlint-disable ja-technical-writing/ja-no-mixed-period -->
今回は以上になります✊️
<!-- textlint-enable ja-technical-writing/ja-no-mixed-period -->

## 参考

https://blog.cloudflare.com/emdash/

https://github.com/emdash-cms/emdash

https://developers.cloudflare.com/workers/runtime-apis/bindings/worker-loader/

https://developers.cloudflare.com/cloudflare-one/policies/access/

https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/

https://patchstack.com/whitepaper/state-of-wordpress-security-in-2025/

[^astro]: コンテンツ重視のWebサイト向けフレームワーク。静的サイト生成と SSR を組み合わせた設計で、フロントエンド開発者の間で採用が増えています。
[^capability]: 「何ができるか」を明示的に宣言するセキュリティモデル。宣言していない操作は物理的に実行できないよう制限されます。
[^x402]: HTTP/402 ステータスコードを活用したインターネットネイティブの決済標準。エージェントやクライアントがオンデマンドでコンテンツの料金を支払えるようにします。
[^mcp]: Model Context Protocol の略。AI ツールがサービスと直接やりとりするための標準プロトコルです。
[^d1]: Cloudflare が提供するサーバレス SQL データベース。Cloudflare Workers から直接利用できます。
[^passkey]: パスワードの代わりに生体認証やデバイスの PIN を使う認証方式。フィッシングやブルートフォース攻撃への耐性があります。
[^spa]: Single Page Application の略。ページ遷移の代わりに JavaScript で画面を動的に切り替えるWebアプリケーションの設計手法です。

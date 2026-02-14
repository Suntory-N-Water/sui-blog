---
title: 『ないなら作ればいいじゃない』HonoXで金髪ヒロインしか乗ってないアニメ専門サイトを作った話
date: 2025-05-07
modified_time: 2025-05-07
icon: https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Fire/Flat/fire_flat.svg
icon_url: /icons/fire_flat.svg
slug: kinpatsu-heroine-honox
tags:
  - HonoX
  - Hono
  - CloudflareWorkers
description: HonoXとCloudflare Workersを活用し、アニメの金髪ヒロインだけを一覧表示するWebサイト「金髪ヒロイン.com」を個人開発した体験と、技術選定や実装の工夫、今後の課題についてまとめました。
---


## はじめに

アニメ情報サイトは数多く存在しますが、どれも網羅性を重視しており、特定の趣味やこだわりに特化したサービスは意外と少ないと感じていました。  
私自身、金髪ヒロインが登場する作品を優先的にチェックするタイプなので、「自分のためだけの検索サイトがあれば便利なのに」と思ったのが開発のきっかけです。

![既存のアニメ情報サイトで金髪ヒロインを検索した結果](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/81a9593f66ea8720a0b3436aa46bd41d.png)

↑ これをチラ見したときブチギレてしまいました。😠
既存サイトで金髪ヒロインを探しているとき、思わず「なんで一覧がないんだ！」と叫びたくなった瞬間です。

この記事では、そんな個人的なニーズを形にした Web サイト「金髪ヒロイン.com」について、開発の背景から技術選定の理由、実装における工夫、そして今後の課題と展望までを記載していきます。

### サービス名：金髪ヒロイン.com

この名前は、[たまごかけごはん.com](https://xn--u8jmhc5czfqe0h.com/)さんのシンプルかつ分かりやすいネーミングに感銘を受け、参考にさせていただきました。覚えやすくて、サイトの内容が一目で伝わる点が気に入っています。

### リポジトリ

開発したソースコードは、以下の GitHub リポジトリで公開しています。

https://github.com/Suntory-N-Water/kinpatsu-heroine-com

## サイトの使い方

「金髪ヒロイン.com」は実際にデプロイ済みですので、ぜひ一度アクセスして試してみてください。

https://kinpatsu-heroine.com/

### トップページ

![金髪ヒロイン.comのトップページ](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/d0faff3e69e2fb0483943eb1f3edefa8.png)

トップページは、このサイトの顔となるメイン画面です。承認された金髪ヒロインたちが、見やすいカード形式で一覧表示されます。

主な特徴は、表示順を柔軟にカスタマイズできる点です。
「新着順」では、最近追加されたキャラクターから順に表示されるため、サイトを頻繁に訪れる方にとっては、新しい発見があるかもしれません。
「いいね順」を選択すれば、多くのユーザーから支持されている人気のキャラクターを効率的にチェックできます。
そして「ランダム表示」は、その名の通り、毎回異なる順序でキャラクターが表示されるため、偶然の出会いを楽しみたい方にぴったりの機能です。

各キャラクターカードには、画像、キャラクター名、登場作品名、そして現在の「いいね」数がコンパクトにまとめられており、一目で基本的な情報を把握できます。気になるキャラクターがいれば、カードをクリックすることで、より詳細な情報が掲載された個別ページへと遷移します。

また、スマートフォン、タブレット、PC など、あらゆるデバイスの画面サイズに最適化されたレスポンシブデザインを採用しています。一度に表示されるキャラクターは 8 名で、ページ下部にあるナビゲーションボタンを使って、前後のページへと簡単に移動できます。

ユーザーがトップページでキャラクターを閲覧する流れは、以下の通りです。

1.  ユーザーがトップページにアクセスすると、システムは登録済みのキャラクター情報をデータベースから取得します。
2.  ユーザーは好みのソート方法(新着順／いいね順／ランダム)を選択します。
3.  気になるキャラクターのカードをクリックし、詳細ページへ進みます。

### キャラクター登録画面

![キャラクター登録画面の全体像](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/a1496639e2ee7fb67653b0ce3471df28.png)

「金髪ヒロイン.com」のメイン機能が、ユーザー自身がお気に入りの金髪ヒロインを登録できることです。より直感的に操作できるよう、登録プロセスは大きく 2 つのステップに分けています。

ステップ 1：作品の選択
まず、登録したいキャラクターが登場する「作品」を選択します。作品名を入力し始めると、候補が動的に表示されるため、リストから該当するものを選ぶだけで完了です。

![作品名の検索候補が動的に表示される様子](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/594cc9cb66326d26a9a987c39920ff07.png)

作品情報の取得には、[Annict GraphQL API](https://developers.annict.com/)を利用させていただいています。これにより、非常に多くのアニメ作品が登録対象となるはずです。
ただし、[Annict GraphQL API](https://developers.annict.com/)にキャラクター情報が登録されていない作品も存在しうるため、選択した作品に紐づくキャラクター情報が存在する場合に限り、次のステップへ進めるように制御しています。

ステップ 2：キャラクターの選択と情報入力
![キャラクター選択と画像アップロードの入力画面](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/b2715ff67e18f295b2e49adf1fc681b9.png)

次に、前の画面で選択した作品に登場するキャラクターの中から、登録したい金髪ヒロインを選びます。そして、そのキャラクターの画像をアップロードし、セレクトボックスから該当キャラクターを選択して登録ボタンを押せば、申請は完了です。

登録されたキャラクターは、すぐに公開されるわけではありません。
管理者が内容を確認し、承認するプロセスを挟むことで、不適切なコンテンツの掲載や重複登録、あるいは誤って金髪ヒロイン以外のキャラクターが登録されてしまう事態を防ぎます。
これにより、質の高い金髪ヒロイン情報が集まるサイトを目指しています。

加えて、ユーザー体験を損なわないよう、同じ作品に既に登録済みのキャラクターは、再度選択できないようになっています。
具体的には、キャラクター選択のセレクトボックスに表示されません。

キャラクター登録の大まかな流れは、以下の通りです。

1.  「ヒロインを登録する」ボタンをクリックします。
2.  作品名を検索し、リストから該当する作品を選択します。
3.  選択した作品に登場するキャラクターの中から、登録したい金髪ヒロインを選びます。
4.  キャラクターの画像をアップロードします。
5.  「登録」ボタンをクリックして申請します。
6.  管理者の承認を経て、サイトに公開されます。

### 個別キャラクター画面

![個別キャラクターの詳細ページ](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/44b84ab0fb80768e226ea6f69d015819.png)

各キャラクターには、専用の詳細ページが用意されており、より詳しい情報が掲載されています。

この画面の目玉機能はログインせずとも「いいね」ができることです。
アカウント登録は一切不要で、気に入ったキャラクターがいれば誰でも気軽に「いいね」を付けることができます。ただし、公平性を期すため、各ユーザーは 1 キャラクターにつき 1 回のみ「いいね」が可能です。「いいね」ボタンをクリックすると、そのキャラクターの総いいね数がリアルタイムで更新されます。
(開発初期には無限に「いいね」できる案も検討しましたが、適切な実装方法が思い浮かばず、現在の形に落ち着きました。)

さらに、キャラクター詳細ページからは、その作品の公式サイトや Wikipedia へのリンク、そして利用可能な配信サービスの情報も確認できるようにしています。
これにより、気になったアニメをすぐに視聴するための手助けになれば嬉しいです✌

### 管理画面

![管理者専用のダッシュボード画面](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/4f6c24f085fcadd9a8af8d3d996d12d7.png)

「金髪ヒロイン.com」の品質を維持し、ユーザーにとって快適な場所であり続けるために、管理者専用の機能群を用意しました。
管理画面へのアクセスは厳重に制限されており、事前に承認された管理者のみがログイン可能です。

管理者ログイン画面自体は非常にシンプルですが、セキュリティ対策には最低限の実装で効果があるものを入れています。
例えば、短時間に何度もログイン試行に失敗した場合、一定時間アカウントをロックするブルートフォース攻撃対策の仕組みを導入し、不正アクセスを未然に防ぎます。

管理者がログインに成功すると、まず承認待ちのキャラクター一覧が表示されます。
管理者は各キャラクターの詳細情報を確認し、サイトの趣旨に合致し、かつ情報が正確なものだけを承認します。
万が一、不適切な内容の投稿があった場合には、即座に削除することも可能です。

管理者の承認フローは、以下のように整理できます。

1.  管理者がログイン画面から認証情報を入力します。
2.  認証に成功すると、管理者専用のダッシュボードが表示されます。
3.  ダッシュボードで、未承認のキャラクター申請一覧を確認します。
4.  個々の申請内容を精査し、適切なものは承認、不適切なものは否認または削除します。
5.  承認されたキャラクターは、サイトのトップページなどに表示されるようになります。

## 開発にあたって

過去の Web サイト制作では、途中でモチベーションが低下したり、実現したい機能の複雑さに挫折したりすることが少なくありませんでした。
その反省を踏まえ、今回はまずアイデアを詳細に言語化し、具体的な計画を立ててから実際の開発に着手することを徹底しました。

## 技術スタック

「金髪ヒロイン.com」の技術スタックは、主に Cloudflare の各種サービスで構成されています。

- フレームワーク: HonoX (Hono, Vite)
- 実行環境: Cloudflare Workers
- データベース: Cloudflare D1
- ストレージ: Cloudflare R2
- ORM: Drizzle ORM
- 外部 API: Annict API (GraphQL)

### HonoX (Hono, Vite)

HonoX は「Hono と Vite を組み合わせたメタフレームワーク」です。
ページごとに完全な HTML をサーバーサイドでレンダリングする MPA(Multi Page Application)を効率的に構築するために採用しました。

「金髪ヒロイン.com」は、いわゆる Web アプリケーションというよりは、コンテンツ主体の Web サイトに近い性格を持っています。そのため、ユーザー体験を著しく損なう箇所を除き、基本的には HonoX の設計思想に準拠した実装を心がけました。
具体的な例を挙げると、フォーム送信後の結果表示(成功メッセージやエラーメッセージなど)は、サーバー側でリダイレクト先の URL にクエリパラメータを付与し、リダイレクト先のページでそのパラメータに基づいてメッセージを出し分ける、といった古典的ですが堅実な方法を採用しています。これにより、一部の画面では JavaScript が無効な環境でも基本的な情報表示が可能です。
(現状では、私のスキル不足により一部で `useState` のようなクライアントサイドの仕組みを利用している箇所がありますが、将来的には全ての画面を JavaScript オフでも完全に機能するように改修するのが目標です。)

また、HonoX は Hono をベースとしているため、Hono 向けに提供されている豊富なミドルウェアやプラグインをそのまま活用できる点も大きな魅力でした。「金髪ヒロイン.com」では、具体的に以下のものを利用しています。

- `getConnInfo()`: リクエスト元の接続情報を取得するために使用。
- `zValidator()`: Zod を利用したバリデーション機能を手軽に導入。
- `getCookie()`, `deleteCookie()`: クッキー操作を簡潔に記述。

### Cloudflare Workers

バックエンドのアプリケーションコードを実行する環境として、Cloudflare Workers を選択しました。これは HonoX アプリケーションの主要なデプロイターゲットの 1 つであり、以下のようなメリットを享受できました。

- サーバーレス: サーバーのプロビジョニング、OS の管理、スケーリングといった面倒なインフラ運用作業から解放され、アプリケーションロジックの開発に集中できます。
- エッジコンピューティング: Cloudflare が世界中に展開するエッジネットワーク上でコードが実行されるため、ユーザーに物理的に近いサーバーでリクエストが処理され、結果として低レイテンシな応答が期待できます。
- コスト効率: 実際に処理したリクエスト数や CPU 実行時間に基づいた従量課金制であり、特に個人開発のようなスモールスタートのプロジェクトでは、初期費用や固定費を大幅に抑えることができます。無料枠も充実している点は大変魅力的です。

### Cloudflare D1

データベースには、Cloudflare D1 を採用しました。これは SQLite をベースとしたサーバーレスリレーショナルデータベースです。

- Cloudflare エコシステムとの親和性: Cloudflare Workers から非常に簡単にアクセスでき、複雑なネットワーク設定や認証情報の管理の手間が少ないのが特徴です。同一エコシステム内でサービスが完結するため、パフォーマンス面でも有利に働くことが期待されます。
- リレーショナルデータベース (RDB): キャラクター情報、作品情報、いいね履歴など、データ同士の関連性が高い情報を扱うため、データの一貫性を保ちやすく、柔軟なデータ操作が可能な RDB が適していました。
- サーバーレス: D1 もまたサーバーレスアーキテクチャを採用しており、データベースサーバーの構築や運用、スケーリングといった専門知識が求められる作業を意識する必要がありません。

### Drizzle ORM

データベースとの対話には、Drizzle ORM を使用しました。これは特に TypeScript との親和性が非常に高く評価されている ORM(Object-Relational Mapper)です。生の SQL 文字列を直接コードに埋め込む場合に比べて、より安全で保守性の高いデータベースアクセスコードを記述できます。

- 型安全性: データベースのスキーマ定義から TypeScript の型情報を自動生成する機能があります。これにより、クエリを組み立てる際に型の不一致やカラム名のタイポといったミスをコンパイル時に検出でき、実行時エラーのリスクを低減します。
- 開発効率の向上: SQL に近い直感的な構文でクエリを記述でき、複雑な JOIN 操作なども比較的容易に扱えます。また、エディタのコード補完機能も充実しており、開発の生産性向上に貢献します。

### Annict API (GraphQL)：アニメ情報の源泉

この API の存在なくして、「金髪ヒロイン.com」の実現はありえませんでした。Annict API は、アニメの作品情報やキャラクター情報を取得できる GraphQL ベースの API です。
ユーザーが新しいキャラクターを登録する際に、正確な作品名や登場キャラクターのリストを取得するために活用しています。その他にも、公式サイトや Wikipedia へのリンク、配信サービスの視聴可否といった幅広い情報を Annict から取得し、サイトの付加価値を高めています。

### その他

「金髪ヒロイン.com」では、再利用性やテストのしやすさを考慮し、特定の処理ロジックを独立した関数として切り出すことを意識しました。

```typescript
// app/lib/db/getCharacterById.ts
import { drizzle } from 'drizzle-orm/d1';
import { registrationQueueTable, workTable } from '@/config/drizzle/schema';
import { ok } from 'neverthrow';
import { databaseErrorHandler } from '@/types/error';
import { eq } from 'drizzle-orm';

/
 * 指定された作品IDに紐づく登録済みキャラクターのID一覧を取得します。
 * @param DB - D1Databaseインスタンス
 * @param workId - 作品ID
 * @returns 成功時はキャラクターIDの配列、失敗時はエラーオブジェクト
 */
export async function getCharacterById({
DB,
  workId,
}: {
DB: D1Database;
  workId: number;
}) {
  try {
    const db = drizzle(DB);

    const result = await db
      .select({
        characterId: registrationQueueTable.character_id,
      })
      .from(registrationQueueTable)
      .innerJoin(
        workTable,
        eq(registrationQueueTable.work_id, workTable.work_id)
      )
      .where(eq(registrationQueueTable.work_id, workId));

    return ok(result);
  } catch (error) {
    return databaseErrorHandler(error); // エラーハンドリング用の共通関数
  }
}
```

HonoX のルーティング定義と組み合わせることで、各エンドポイントの処理が比較的すっきりと記述できているかと思います。以下は、キャラクター登録時の作品選択画面(`/register/work`)の POST リクエストを処理する例です。

```tsx
// app/routes/register/work.tsx
import { createRoute } from 'honox/factory';
import { absoluteUrl } from '@/lib/utils';
import WorkForm from './$work-form';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { getWorkCharactersById, getWorks } from '@/lib/api';
import { StatusMessage } from '@/components/character/StatusMessage';
import { cache } from 'hono/cache';
import { getCharacterById } from '@/lib/db';

const workFormSchema = z.object({
  workId: z.coerce.number().min(1, { message: '作品IDは必須です' }),
  workName: z.string().min(1, { message: '作品名は必須です' }),
});

export const POST = createRoute(
  zValidator('form', workFormSchema, (result, c) => {
    if (!result.success) {
      const { logger } = c.var;
      logger.error({
        method: 'createRegistrationWork',
        message: '入力内容に誤りがあります。',
        error: result.error,
      });
      const message = encodeURIComponent(
        '入力内容に誤りがあります。\nプルダウンから作品を選択してください。'
      );
      return c.redirect(`/register/work?status=error&message=${message}`, 303);
    }
  }),
  async (c) => {
    const { workId, workName } = await c.req.valid('form');
    const { logger } = c.var;
    const DB = c.env.DB;

    const result = await getWorkCharactersById({
      clientId: c.env.ANNICT_CLIENT_ID,
      id: workId,
    });

    if (result.isErr()) {
      logger.warn({
        method: 'getWorkCharactersById',
        message: '作品情報の取得に失敗しました',
        error: result.error,
      });
      throw new Error(result.error.message);
    }

    const characterEdges =
      result.value.data.searchWorks.edges[0]?.node.casts.edges || [];
    const characterData = characterEdges.map((edge) => ({
      annictId: edge.node.character.annictId,
      name: edge.node.character.name,
    }));

    if (characterData.length === 0) {
      const message = encodeURIComponent(
        'この作品にはキャラクターが登録されていません。'
      );
      logger.error({
        message,
        workId,
        workName,
      });
      return c.redirect(`/register/work?status=error&message=${message}`, 303);
    }

    // 作品からキャラクター情報の取得
    const registeredCharactersResult = await getCharacterById({ DB, workId });

    if (registeredCharactersResult.isErr()) {
      logger.error({
        method: 'getCharacterById',
        message: '登録済みキャラクターIDの取得中に予期せぬエラーが発生しました',
        error: registeredCharactersResult.error,
      });
      throw new Error('登録済みキャラクター情報の取得に失敗しました。');
    }

    const registeredCharacterIds = registeredCharactersResult.value.map(
      (char: { characterId: number }) => char.characterId
    );

    // 取得した作品情報から既に登録済みのキャラクターを除外する
    const unregisteredCharacters = characterData.filter(
      (char) => !registeredCharacterIds.includes(char.annictId)
    );

    if (unregisteredCharacters.length === 0) {
      const message = encodeURIComponent(
        'この作品には登録可能なキャラクターがありません。'
      );
      logger.error({
        message,
        workId,
        workName,
      });
      return c.redirect(`/register/work?status=error&message=${message}`, 303);
    }

    // 次画面で使用するためクエリパラメータに作品ID、作品名、キャラクター情報をJSON文字列としてセット
    const params = new URLSearchParams();
    params.set('workId', workId.toString());
    params.set('workName', workName);
    // キャラクター情報をJSON文字列に変換してセット
    params.set('characters', JSON.stringify(unregisteredCharacters));

    return c.redirect(`/register/character?${params.toString()}`, 303);
  }
);

export default createRoute(
  cache({
    cacheName: 'register-work-cache',
    cacheControl: 'public, max-age=3600',
    wait: false,
  }),
  async (c) => {
    // クエリパラメータからステータスとメッセージを取得
    const status = c.req.query('status') as
      | 'error'
      | 'success'
      | 'info'
      | 'warning'
      | undefined;
    const message = c.req.query('message');

    // キャラクター登録画面から、現在登録していない作品を取得します。
    // annictから作品情報を取得
    const result = await getWorks({
      clientId: c.env.ANNICT_CLIENT_ID,
    });

    if (result.isErr()) {
      throw new Error('作品情報の取得に失敗しました');
    }

    const resultList = result.value.data.searchWorks.nodes.map((node) => ({
      annictId: node.annictId,
      title: node.title,
    }));

    return c.render(
      <div className='mx-auto max-w-lg rounded-lg bg-gray-800 p-6 shadow-lg'>
        <h1 className='mb-8 text-center text-3xl font-bold text-white'>
          作品登録
        </h1>
        <div className='mb-8 rounded-lg bg-gray-700 p-4'>
          <h2 className='mb-3 text-xl font-semibold text-yellow-300'>
            ✨️ヒロインの登録方法
          </h2>
          <div className='space-y-2 text-gray-300'>
            <p>1. まず作品を選択してください🎨</p>
            <p>2. 作品内の金髪ヒロインを選択します👧</p>
            <p>3. 管理者の確認後にサイトに掲載されます👀</p>
          </div>
          <div className='mt-4 rounded bg-yellow-900/20 p-3'>
            <p className='font-medium text-yellow-200'>
              ✨ 金髪ヒロインを発掘して、サイトを充実させましょう！
            </p>
          </div>
        </div>
        <StatusMessage status={status} message={message} />
        <form method='post' action='/register/work' id='workForm'>
          <WorkForm works={resultList} />
          <button
            type='submit'
            id='submitButton'
            disabled
            className='w-full rounded bg-yellow-300 px-4 py-2 font-medium text-gray-900 transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-gray-500 disabled:hover:bg-gray-500'
          >
            次へ
          </button>
        </form>
      </div>,
      {
        title: '作品登録',
        description:
          '新しい金髪ヒロインを登録するために、まずは作品を選択してください。',
        openGraph: {
          title: '作品登録',
          description:
            '新しい金髪ヒロインを登録するために、まずは作品を選択してください。',
          url: absoluteUrl({
            url: c.env.PUBLIC_APP_URL,
            path: '/register/work',
          }),
          images: absoluteUrl({
            url: c.env.PUBLIC_APP_URL,
            path: '/ogp.png',
          }),
        },
        twitter: {
          title: '作品登録',
          description:
            '新しい金髪ヒロインを登録するために、まずは作品を選択してください。',
          url: absoluteUrl({
            url: c.env.PUBLIC_APP_URL,
            path: '/register/work',
          }),
          images: absoluteUrl({ url: c.env.PUBLIC_APP_URL, path: '/ogp.png' }),
        },
      }
    );
  }
);
```

このようなアプローチを選んだ背景には、開発初期のスピード感を重視したこと、そして私自身がクリーンアーキテクチャのような洗練された設計手法をゼロから完璧に構築できるほどのスキルセットを持ち合わせていなかった、という現実的な理由があります。
もちろん、後々の手戻りコストを考慮すれば、設計についてより深く学習してから実装に取り掛かるべきだったという意見もあるかと思います。
しかし、過去に同様の個人開発で学習フェーズに時間をかけすぎ、結果として途中で開発意欲が薄れてしまった経験から、今回は「まず動くものを作る」ことを優先しました。

### 技術選定の総括

「金髪ヒロイン.com」の技術スタック選定において最も重視したのは、HonoX との相性の良さ、そして運用コストの低さです。
Cloudflare が提供するサーバーレスプラットフォーム群(Workers, D1, R2)を最大限に活用し、HonoX を中心としたモダンなフロントエンド技術と組み合わせることで、個人開発でありながらも、高速でスケーラブル、かつ低コストで運用可能な Web サイトの実現を目指しました。
特に、Cloudflare Workers, D1, R2 を連携させることで、従来であれば手間のかかるインフラ管理の大部分を Cloudflare に委任でき、アプリケーションロジックそのものの開発に集中できた点は、非常に大きなメリットだったと感じています。

## 今後の課題と展望

「金髪ヒロイン.com」は、基本的な機能こそリリースできたものの、より良いサービスへと成長させていくためには、まだまだいくつかの課題や改善点、そしてやりたいことがあります。

### 未実装の機能と改善点

### UI/UXの継続的な改善

現在のユーザーインターフェース(UI)は、基本的な機能を満たす最低限のものに留まっています。今後は、ユーザー体験(UX)をさらに向上させるために、アクセシビリティの強化(WAI-ARIA 対応など)、より直感的で分かりやすいナビゲーションの導入、情報デザインの見直しなどを継続的に行っていきたいと考えています。
特に、スマートフォンでの操作性や視認性の向上は、優先度の高い課題の 1 つです。

### CI/CDパイプラインの構築

現状、アプリケーションのデプロイは手動で行っていますが、これを自動化することで、より迅速かつ安全なリリースサイクルを実現したいと考えています。
具体的には、GitHub Actions などを活用し、特定のブランチへコードがマージされたタイミングで自動的にテストを実行し、問題がなければ Cloudflare Workers へのデプロイまでをシームレスに行う CI/CD(継続的インテグレーション／継続的デリバリー)パイプラインの構築を目指します。

### テストコードの拡充

コードの品質と信頼性を長期的に担保するためには、十分なテストコードの作成が不可欠です。悲しいことに、現状ではテストコードがほぼ存在しないため、機能追加やリファクタリングの際に予期せぬバグ(デグレード)を混入させてしまうリスクが高い状態です。今後は、Vitest のようなテストフレームワークを導入し、主要な UI コンポーネントや API ルートに対する単体テスト、データベース操作や外部 API 連携部分に関する結合テストを中心に、カバレッジを高めていきたいと考えています。CI/CD パイプラインと連携させ、テストが通らない限りデプロイできない仕組みも構築する予定です。

### 今後挑戦したい技術・手法

### Dev Containerによる開発環境の統一

Cloudflare Workers や D1 など、ローカル環境で開発を行うためには、いくつかのツールや設定が必要です。Dev Container(開発コンテナ)を導入することで、プロジェクトに必要なツール群や依存関係、拡張機能などをコンテナイメージとして定義し、チームメンバー(現在は私一人ですが)や将来のコントリビューターが、誰でも簡単に同じ開発環境を再現できるようにしたいと考えています。これにより、「私の環境では動いたのに」といった問題を未然に防ぐことができます。

## まとめ

以前から HonoX を使った Web サイト制作を構想していましたが、この「金髪ヒロイン.com」でようやく 1 つの形にできました。

HonoX は、この記事を執筆している 2025 年 5 月時点ではまだアルファ版という位置づけですが、開発期間中に深刻なバグに遭遇することは一度もなく、非常に安定して動作してくれました。

Hono をベースにしているため、既存の Hono の知識やエコシステムを活かせる点も大きなメリットだと感じています。
開発体験は総じて非常に良好で、今後のさらなる発展に大きな期待を寄せています。引き続きこのサイトの開発は続けていくつもりですし、また何か面白いアイデアが思い浮かんだら、HonoX を使って新しいサービスを作ってみたいと思います🔥⚡️✌

## 参考文献

https://zenn.dev/calloc134/articles/honox-thread-float-bbs


https://zenn.dev/yusukebe/articles/4d6297f3be121a


https://zenn.dev/lifull/articles/86661ce204d665


https://developers.annict.com/


https://orm.drizzle.team/


https://developers.cloudflare.com/workers/


https://developers.cloudflare.com/d1/


https://developers.cloudflare.com/r2/

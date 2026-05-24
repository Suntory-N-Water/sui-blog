---
title: Next.js13 デプロイ時にAPIのパスを動的に変えるやり方
slug: nextjs13-dynamically-change-api-path-during
date: 2024-01-03
modified_time: 2024-01-03
description: Next.js13でデプロイ時にAPIのパスを動的に変更する方法。
icon: 🔗
icon_url: /icons/link_flat.svg
tags:
  - API
  - Next.js
  - Vercel
---
## 経緯

Next.js13でAPIを取得したときにパスの関係で手こずったこと体験から、同じようなことを防ぐための備忘録。

## 目標

本番環境と開発環境でAPIのエンドポイントを動的に設定できるようにしたい。

## 環境

フロントエンド, バックエンド: Next.js
ホスティング: vercel

## 実践

## よくある例

画面起動時にSSGやSSRでAPIを発火して取得することだと思っています。

以下の画面では環境変数 `API_URL` で[`http://localhost:3000`](http://localhost:3000/)を定義し、取得したデータをmap関数で展開しています。

```tsx app/bad/page.tsx
import Link from 'next/link';

export default async function Bad() {
  const API_URL = process.env.API_URL;
  const res = await fetch(`${API_URL}/api/bad`);
  const data: string[] = await res.json();

  return (
    <div className='mb-32 grid text-center lg:mb-0 lg:grid-cols-4 lg:text-left'>
      {data.map((item) => (
        <Link
          href='/'
          className='group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30'
          rel='noopener noreferrer'
          key={item}
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>{item}</h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>初期画面に戻ります</p>
        </Link>
      ))}
    </div>
  );
}
```

``` tsx app/api/bad/route.ts
import { NextResponse } from 'next/server';

export const GET = async () => {
  const data = ['john', 'doe', 'alice', 'bob'];
  return NextResponse.json(data, { status: 200 });
};
```

```properties .env.local
API_URL=http://localhost:3000
```

こちらをこのままvercelにデプロイしようとするとエラーになります。

``` bash
TypeError: fetch failed
    at Object.fetch (node:internal/deps/undici/undici:11372:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5) {
  cause: Error: connect ECONNREFUSED 127.0.0.1:3000
      at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)
      at TCPConnectWrap.callbackTrampoline (node:internal/async_hooks:130:17) {
    errno: -111,
    code: 'ECONNREFUSED',
    syscall: 'connect',
    address: '127.0.0.1',
    port: 3000
  }
}
Error occurred prerendering page "/bad". Read more: https://nextjs.org/docs/messages/prerender-error
TypeError: fetch failed
    at Object.fetch (node:internal/deps/undici/undici:11372:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
 ✓ Generating static pages (9/9) 
> Export encountered errors on following paths:
	/bad/page: /bad
Error: Command "npm run build" exited with 1
```

API_URLが `localhost:3000` のままなので当たり前なんですが、絶対パスではなく相対パスでビルドできるか試そうにも、そもそもローカル環境でビルドが通らないです。

GPT先生に聞いたところ以下の回答をもらった。

> Next.jsでは、静的サイト生成(SSG)の際、ビルド時にページが事前にレンダリングされます。外部データを必要としないページについては、Next.jsが各ページごとに単一のHTMLファイルを生成します。
しかし、外部データに依存するページの場合、Next.jsは `getStaticProps` や `getStaticPaths` のような関数を提供しています。これらの関数はビルド時にデータを取得し、ページのpropsに渡して事前レンダリングするために使用されます。
`getStaticProps` を使用する場合、この関数はビルド時に外部APIからデータを取得するために呼び出されます。
例として、絶対URLを使用してブログの投稿を取得するシナリオが示されています。同様に、`pages/posts/[id].js` のような動的ルートの場合、`getStaticProps` は特定の投稿のデータ(`id`)を使用して取得し、この関数もビルド時に呼び出されます。
これらの例と説明から、Next.jsにおけるSSGやSSRでは、特にビルド時にAPIからデータを取得する際には、絶対URLの使用が一般的であることがわかります。これは、サーバーサイドやビルド時のコンテキストでは相対URLが正しく解決されないためです。
 

他の記事も調べたところ、結論としてNext.jsでは絶対パスが好ましいことが分かった。

[Mastering Next.js: Getting the Absolute URL in Nextjs Application](https://maxgadget.dev/article/nextjs-get-absolute-url)

## 改善例

- `next/headers` を使用して現在のURLを動的に取得する。
- `next/headers` ではプロトコル部分(`http://`)を取得できないため、環境変数で設定しておきデプロイ後 `https://` に変更する。

``` tsx app/good/page.tsx
import Link from 'next/link';
import { headers } from 'next/headers';
import { config } from '@/app/lib/config';

const fetchData = async (host: string) => {
  const res = await fetch(`${config.apiPrefix}${host}/api/good`);
  return res.json();
};

export default async function Good() {
  const host = headers().get('host');
  const data: string[] = await fetchData(host!);

  return (
    <div className='mb-32 grid text-center lg:mb-0 lg:grid-cols-4 lg:text-left'>
      {data.map((item) => (
        <Link
          href='/'
          className='group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30'
          rel='noopener noreferrer'
          key={item}
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>{item}</h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>初期画面に戻ります</p>
        </Link>
      ))}
    </div>
  );
}
```

以下は環境変数の読み込み用の `lib/config.ts` と `.env.local`

開発環境では `API_PREFIX=http://` と定義しておき、デプロイ時に環境変数を変更することで、開発環境と本番環境でコードを修正することがなくなる。

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/3351724/b9752534-bdf7-ea35-ead9-dbdfe34aefd4.png)

```tsx
export const config = {
  apiPrefix: process.env.API_PREFIX,
};
```

``` 
API_PREFIX=http://
```

## おわりに
## 参考にした記事など

[Mastering Next.js: Getting the Absolute URL in Nextjs Application](https://maxgadget.dev/article/nextjs-get-absolute-url)

[Next.jsのapp routerを利用してNext.jsのAPIをlocalhost上で叩く時にURL parse Errorになるのを防ぐ - Qiita](https://qiita.com/Gma_Gama/items/86a68240b70448003fb1)

[Functions: headers](https://nextjs.org/docs/app/api-reference/functions/headers)

https://github.com/vercel/next.js/issues/48344

## その他

使用したリポジトリ

https://github.com/Suntory-N-Water/api-router-sample


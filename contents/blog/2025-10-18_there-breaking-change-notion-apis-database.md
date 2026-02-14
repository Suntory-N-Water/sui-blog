---
title: Notion APIのデータベース操作APIに破壊的変更があったので、実装を修正してみる
slug: there-breaking-change-notion-apis-database
date: 2025-10-18
modified_time: 2025-10-18
description: Notion APIのバージョン2025-09-03における破壊的変更について解説します。単一データベースモデルからマルチソースデータベースモデルへの移行に伴う実装修正方法を紹介します。
icon: 🚜
icon_url: /icons/tractor_flat.svg
tags:
  - TypeScript
  - Notion
  - NotionAPI
---

Notion API はバージョン 2025-09-03 において、データベースの概念を根本的に変更しています。
従来の単一データベースモデルからマルチソースデータベースモデルへと移行し、これに伴い後方互換性のない破壊的変更が導入されました。
詳細は以下の公式ドキュメントをご確認いただきたいのですが、ここでは私が実際に触ってみてつまづいたところをまとめていきます。

https://developers.notion.com/docs/upgrade-guide-2025-09-03

### 主要な変更点

#### APIエンドポイントの移行
> Most API operations that used `database_id` now require a `data_source_id`
- 従来: `databases.query({ database_id })`
- 新仕様: `dataSources.query({ data_source_id })`

新しい `@notionhq/client` v5.2.1 では `databases` オブジェクトに `query` メソッドが存在しないため、型エラーになることが発生します。
GitHub Actions から `actions/github-script` を用いて Notion へのアクセスを行おうとした結果、以下のような型エラーが発生しました。
```ts
import type { Client } from '@notionhq/client';

export type NotionClient = Client;

// プロパティ 'query' は型 '{ retrieve: (args: WithAuth<GetDatabasePathParameters>) => Promise<GetDatabaseResponse>; create: (args: WithAuth<CreateDatabaseBodyParameters>) => Promise<...>; update: (args: WithAuth<...>) => Promise<...>; }' に存在しません。
export type NotionDatabaseQueryResult = Awaited<
  ReturnType<NotionClient['databases']['query']>
>;
```

このように修正すれば型エラーは発生しなくなります。
```ts
import type { Client } from '@notionhq/client';

export type NotionClient = Client;

export type NotionDataSourceQueryResult = Awaited<
  ReturnType<NotionClient['dataSources']['query']>
>;
```

#### IDの取得方法の変更
従来のデータベース ID の取得方法は、`290779d04d0280548d2be29e12530de6` の部分を設定すればよかったのですが、新しくデータソース ID という概念が登場しました。
実際にデータベースを開いて、データベース設定 → "データベースを管理する" → "⋯" → "データソース ID をコピー"で取得できます。

![Notionのデータベース設定から「データベースを管理する」を開いたメニュー画面](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/719339eae57cb53383f11e88c947047c.png)

![データソースIDをコピーする操作画面](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/d2db2155007d6497fb0b6f6f124aa9c5.png)

データソース ID は `290779d0-4d02-808a-a37f-000b48c16318` のようなハイフン付きの ID が取得可能です。
以下のようなコードで取得したデータソースへアクセスが可能です。
```ts
const notionToken = process.env.NOTION_TOKEN;
const dataSourceId = process.env.NOTION_DATA_SOURCE_ID;
const notion = new Client({ auth: notionToken });
const response = await notion.dataSources.query({
  data_source_id: dataSourceId,
  page_size: 5,
});
```


## 実装時の注意点

開発時は Claude Code で Context7 等のドキュメント検索ツールを使用していましたが、まだドキュメントの修正が追いついておらず、取得される情報は旧 API バージョンに基づいている場合が多かったです。
特に以下の点に注意する必要があります。
- 例示されている `databases.query` は現在の最新 SDK では利用できない
- `database_id` パラメータは `data_source_id` に置き換える必要がある

## 参考資料

https://developers.notion.com/docs/upgrade-guide-2025-09-03

https://developers.notion.com/docs/upgrade-faqs-2025-09-03
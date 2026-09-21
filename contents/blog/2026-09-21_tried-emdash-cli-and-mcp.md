---
title: EmDash の CLI と MCP の両方で記事を書かせてみる
slug: tried-emdash-cli-and-mcp
date: 2026-09-21
modified_time: 2026-09-21
description: EmDash には CLI と MCP サーバーの両方が最初から入っています。blog-cloudflare テンプレートで作ったサイトを Cloudflare Workers と D1 と R2 で動かし、同じ「記事を作って」という指示を CLI と MCP に渡して、公開状態の違い、認証で必要になるもの、不正な入力がどこでエラーになるかの違いを確かめました。
icon: 🧦
icon_url: /icons/socks_flat.svg
tags:
  - Cloudflare
  - CMS
  - MCP
  - Astro
---
2026 年 4 月に Cloudflare が公開した [EmDash](https://github.com/emdash-cms/emdash) は、Astro を中心にした TypeScript 製の CMS です。以前、マーケティングテンプレートを Cloudflare Workers へデプロイし、管理画面を Cloudflare Access で保護するところまでを[2026 年 4 月の記事](/blog/built-a-blog-site-with-cloudflare-emdash-and-access-control)に書きました。

EmDash には CLI と MCP サーバー[^mcp]が最初から入っており、管理画面を開かずに記事を作る方法が 2 つあります。同じ「記事を作って」という指示を両方に渡したら同じ結果になるのか気になったので、ローカルと本番の両方で確かめました。

この記事では、CLI と MCP に同じ内容で記事の作成を指示して、公開状態、認証で必要になるもの、不正な入力を渡したときの結果がどう違うかを紹介します。

検証した環境は次のとおりです。

| 項目 | 値 |
|---|---|
| emdash | 0.38.0 |
| テンプレート | blog-cloudflare |
| デプロイ先 | Cloudflare Workers (D1 と R2 を使う構成) |
| astro | 7.3.3 |
| wrangler | 4.135.0 |
| Node | 24.14.0 |
| OS | macOS (Darwin 25.6.0) |
| MCP クライアント | Claude Code |
| MCP プロトコル | 2025-11-25 |
| 検証日 | 2026 年 9 月 21 日 |

## EmDash に内蔵されている CLI と MCP サーバー

CLI は `npx emdash` で呼び出します。MCP サーバーのほうはサイトそのものの一部で、リクエストを受け付けるのは `/_emdash/api/mcp` です。MCP のために別のプロセスを起動する必要はありません。

ローカルの開発サーバーに対して両方を呼んでみると、認証の扱いが同じではありませんでした。

```bash
# CLI: localhost なら認証なしで成功する
npx emdash content list posts --json --url http://localhost:4322

# MCP: 同じサイトの MCP エンドポイントは 401
curl -i -X POST http://localhost:4322/_emdash/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

CLI の接続先は、指定しなければ `http://localhost:4321` になります。開発サーバーを 4322 で動かしているので、`--url` で接続先を渡しています。以降の CLI の例でも同じ指定が必要です。

CLI は一覧を返却し、MCP はエラーコード `NOT_AUTHENTICATED` を返却します。401 のレスポンスヘッダーには `WWW-Authenticate: Bearer resource_metadata="…/.well-known/oauth-protected-resource"` が付与されます。

EmDash 側のミドルウェア `src/astro/middleware/auth.ts` を読むと、MCP エンドポイントではセッション認証が参照されず、Bearer トークン以外は 401 になります。ブラウザで管理画面にログイン済みでも、そのセッション Cookie は MCP では使われません。

ローカルで試すためのトークンは `/_emdash/api/setup/dev-bypass?token=1` が発行します。EmDash のトークンにはスコープが付きます。スコープはそのトークンに許可する操作の範囲で、`content:read` なら記事の読み取り、`content:write` なら記事の作成と更新に対応します。dev-bypass が発行するトークンに付くのは content:read / content:write / media:read / media:write / schema:read / schema:write / admin の 7 つで、検証に必要な操作は一通り実行できます。

## ブログテンプレートでサイトを作って Cloudflare Workers にデプロイする

プロジェクトの作成はテンプレートを選ぶだけです。

```bash
pnpm create emdash@latest
```

テンプレートに blog-cloudflare、デプロイ先に Cloudflare Workers を選ぶと、`wrangler.jsonc` に D1 と R2 のバインディングが入った状態で生成されます。

```jsonc wrangler.jsonc
"d1_databases": [{ "binding": "DB", "database_name": "my-emdash-site", "database_id": "…" }],
"r2_buckets": [{ "binding": "MEDIA", "bucket_name": "my-emdash-media" }],
```

テンプレートには seed が付いてきます。seed はコレクションの定義とデモ記事をまとめた初期データで、`seed/seed.json` に入っています。この seed が DB へ入るタイミングは、コレクションの定義とデモ記事とで違いました。

`pnpm dev` の起動ログには `Auto-seeded default collections` が出ます。この時点で `emdash schema list` は posts と pages を返却し、`source` は `seed` です。ところが `emdash content list posts` は `{"items": []}` のままです。`/_emdash/admin` で初期セットアップを終えてから同じコマンドを実行すると、8 件返却されました。

コレクションの定義は開発サーバーの起動時に入り、デモ記事は管理画面の初期セットアップを終えた時点で入ります。2026 年 4 月の記事では「seed は管理画面の初期セットアップ完了をきっかけに反映される」と書きましたが、0.38.0 でこれが当てはまるのはデモ記事だけです。ソースを読むと、起動時の自動 seed は `applySeed(db, seed, { onConflict: "skip" })` を呼んでいて、記事を含めるかどうかを決める `includeContent` の既定値が `false` でした。

本番は `pnpm run deploy` でデプロイします。デプロイ後は、本番の管理画面でも同じ初期セットアップを実行しましょう。

## CLI で記事を作成する

`content create` はコレクションの slug と、フィールドの値を JSON で受け取ります。

```bash
npx emdash content create posts --json --url http://localhost:4322 --data '{
  "title": "CLI から作った記事",
  "content": "# CLI から作った記事\n\n本文です。",
  "excerpt": "CLI から作った記事の要約です。"
}'
```

返ってきた JSON のうち、注目するのは次の 3 行です。

```json
{
  "status": "published",
  "publishedAt": "2026-09-21T01:31:32.432Z",
  "version": 2
}
```

作成を指示しただけで公開まで済んでいます。`liveRevisionId` も設定されました。`version` が 2 になっているのは、作成と公開で書き込みが 2 回発生したためである可能性があります。

管理画面の記事一覧でも、公開済みとして並んでいます。

![管理画面の Posts 一覧。CLI から作った記事のステータスが公開済みになっている](https://pub-151065dba8464e6982571edb9ce95445.r2.dev/images/60ee1e85e71c8ff719e179675d451464.png)

`content create --help` には `--draft` があり、説明は `Keep as draft instead of auto-publishing` (自動公開せずに下書きのままにする) です。指定しなければ自動公開になると、ヘルプの文面からも読み取れます。

## MCP で同じ記事を作らせる

MCP サーバーは HTTP トランスポートで登録します。今回は Claude Code を使用するため、以下のコマンドを実行します。

```bash
claude mcp add --transport http emdash-site http://localhost:4322/_emdash/api/mcp \
  --header "Authorization: Bearer <token>"
```

登録したら、CLI とまったく同じ title と content と excerpt を `content_create` に渡しました。すると、結果が分かれます。

| | CLI `content create` | MCP `content_create` |
|---|---|---|
| status | **published** | **draft** |
| publishedAt | 2026-09-21T01:31:32.432Z | null |
| version | 2 | 1 |
| liveRevisionId | 設定される | null |
| 返ってくる content | Markdown 文字列 | Portable Text[^portabletext] 配列 |

注目するのは status の行です。同じ入力を渡しているのに、CLI で作った記事は公開済み、MCP で作った記事は下書きになります。

理由はツールの説明文に書いてありました。`content_create` の説明には `Items are created as 'draft' by default — use content_publish to make them live.` とあり、`status` パラメータの説明は `Initial status (default 'draft'). Requires publish permission.` です。CLI は公開状態を指定しなければ公開済みになり、MCP は指定しなければ下書きになります。同じ「記事を作る」操作でも、既定値が反対に決められています。

Markdown から Portable Text への変換は両方で実行されます。違うのは返り値の形だけで、MCP でも `content_get` に `markdown: true` を渡すと Markdown 文字列が返却されます。

## 更新のとき必要になるもの

更新には、直前に取得したリビジョンの識別子が必要です。渡さずに実行すると、どちらもエラーになりますが、エラーになる場所が異なります。

CLI は手元の引数解析でエラーになり、`Missing required argument: --rev` と usage の全文を出します。リクエストは送られません。MCP はリクエストが送られたうえで、JSON-RPC のエラー `-32602 Input validation error: … _rev is required: call content_get for this item and pass back the _rev it returns.` が返却されます。MCP 側は次にすべき操作まで文面に書いてあります。

識別子を渡すと、今度は更新後の状態が分かれます。

| | CLI | MCP |
|---|---|---|
| status | **published** | **draft** |
| liveRevisionId | 更新される | 変わらない |
| draftRevisionId | null | 設定される |
| 返り値 | 更新後の値 | `liveData` に公開中の古い値が入る |

CLI は更新してそのまま公開します。MCP は下書きのリビジョンとして保存し、公開中の内容は元のまま残します。作成のときと同じ向きの差です。

## 権限を絞ったトークンで拒否される様子を確認する

トークンは `/_emdash/api/admin/api-tokens` への POST で発行します。セッション Cookie だけで POST すると `{"code":"CSRF_REJECTED","message":"Missing required header"}` が返却され、`X-EmDash-Request: 1` が必要でした。Bearer トークンで認証した場合はこの確認を省略します。ソースのコメントには、トークンは Cookie と違って自動で送られる資格情報ではないため、と書かれています。

content:read だけのトークンを発行して、読み取りと書き込みを試しました。

| | CLI | MCP |
|---|---|---|
| 読み取り | 成功 (2 件取得) | 成功 (`content_list` が items を返す) |
| 書き込み | `ERROR Token lacks required scope: content:write` | `[INSUFFICIENT_SCOPE] Insufficient scope: requires content:write` |
| `tools/list` | — | **59 件** |

最後の行が意外でした。content:read しかないトークンでも `tools/list` は 59 件返却され、admin のトークンで取ったときと件数が変わりません。`tools/list` はスコープで絞られないため、呼べないツールも一覧に並び、実際に呼んだ時点で初めて拒否されます。MCP 側の拒否は `isError: true` と `_meta.code` が `INSUFFICIENT_SCOPE` という形で返却されます。

トークンのスコープは 12 種類あります。これとは別に、ユーザーのロールが 5 種類あります。`@emdash-cms/auth` 0.38.0 から権限の定義を抽出すると、こうなっていました。

| ロール | 権限数 | content:publish_own | content:publish_any |
|---|---:|---|---|
| SUBSCRIBER | 10 | なし | なし |
| **CONTRIBUTOR** | 13 | **なし** | なし |
| **AUTHOR** | 18 | **あり** | なし |
| EDITOR | 33 | あり | あり |
| ADMIN | 47 | あり | あり |

AUTHOR と CONTRIBUTOR の 2 行に注目します。Author には content:publish_own があり、自分の記事を公開できます。Contributor にはこの権限がなく、自分の記事でも公開できません。

この表は権限の定義を読んだ結果で、Author と Contributor のトークンでは試していません。API トークンは発行した本人の権限を引き継ぐ作りになっていて、管理者の画面から別のロールのトークンを発行できないためです。

なお `mcp:tools` というスコープもありますが、これはプラグインが提供する MCP ツール専用です。コアの 59 ツールは content:read や content:write で判定されます。

## どこでエラーになるか確認する

不正な入力を 3 通り渡して、どこでエラーになるかを確認しました。

| 入力 | CLI | MCP | エラーになった場所 |
|---|---|---|---|
| 存在しないフィールドを 2 つ | `ERROR author_name: unknown field on collection 'posts'; published_date: unknown field on collection 'posts'` | `[VALIDATION_ERROR] author_name: unknown field on collection 'posts'; published_date: unknown field on collection 'posts'` | 両方とも EmDash のスキーマ検証 |
| `schedule` の日時に `2026-13-45T99:00:00Z` | `ERROR Invalid scheduled date` | `[VALIDATION_ERROR] Invalid scheduled date` | 両方とも EmDash の日付検証 |
| `update` の `publishedAt` に `2026-13-45T99:00:00Z` | 該当するオプションが CLI にない | `-32602 Input validation error: Invalid arguments for tool content_update: Invalid input at publishedAt` | MCP サーバーの引数検証 |

1 行目では、CLI と MCP で接頭辞が違うだけで、あとの文言が 1 文字も変わりません。どちらも EmDash の同じ検証でエラーになっているためです。

3 行目だけが、EmDash のハンドラーを呼ぶ前にエラーになっています。同じ形の不正な日付なのに、2 行目は EmDash のハンドラーまで渡されます。理由はツールごとの型の書き方です。`content_schedule` の `scheduledAt` は引数のスキーマの上では単なる `string` ですが、`content_update` の `publishedAt` には ISO 8601 の制約が付いています。

この検証を実行しているのは MCP クライアントではありません。クライアントを通さずに `/_emdash/api/mcp` へ直接 POST しても同じ `-32602` が返却されました。文面は `@modelcontextprotocol/sdk` 1.30.0 の `server/mcp.js` にあり、ツールの処理を呼ぶ直前に引数を検証する作りになっています。

不正な入力がエラーになる場所は 3 つに分かれます。CLI は手元の引数解析、MCP は MCP サーバーの引数検証、両方に共通するのが EmDash のスキーマ検証です。ただし MCP が EmDash へ渡す手前でエラーにするのは、そのツールの型に制約が書かれている場合だけです。

## MCP のツールと CLI のコマンドの対応

MCP のコアツールは 59 個です。Administrator のトークンで取得した `tools/list` の件数と、`src/mcp/server.ts` から抽出した件数が一致しました。CLI のトップレベルコマンドは 18 個です。

| 区分 | CLI | MCP | MCP にしかないもの |
|---|---:|---:|---|
| content | 10 | 16 | compare, discard_draft, duplicate, list_trashed, permanent_delete, unschedule |
| schema | 6 | 8 | update_collection, update_field |
| media | 5 | 7 | create, update |
| taxonomy | 3 | 10 | get, create, update, delete, update_term, delete_term, term_translations |
| menu | 2 | 7 | create, update, delete, set_items, translations |
| search | 1 | 1 | なし |
| **byline** | **0** | **6** | 全部 |
| **revision** | **0** | **2** | 全部 |
| **settings** | **0** | **2** | 全部 |

byline、revision、settings は、CLI 側に対応するコマンドがありません。著者情報、リビジョンの操作、サイト設定の読み書きは、MCP からしか実行できません。

逆に CLI にしかないのは init / types / doctor / seed / migrate / export-seed / secrets / auth / login / logout / whoami / plugin の 12 個です。どれもローカルの DB かプロジェクトの運用に関わるもので、コンテンツの操作ではありません。この分かれ方からは、CLI はプロジェクトを組み立てるため、MCP はコンテンツを編集するために用意されていると考えられます。

## 本番での CLI と MCP の認証

本番の MCP エンドポイントにトークンなしで POST すると、ローカルと同じ 401 が `WWW-Authenticate` 付きで返却されます。そこに書かれた URL をたどると、2 つのメタデータを取得できます。

```bash
curl -s https://<your-site>/.well-known/oauth-protected-resource
curl -s https://<your-site>/.well-known/oauth-authorization-server/_emdash
```

前者は保護リソースのメタデータ ([RFC 9728](https://datatracker.ietf.org/doc/html/rfc9728)) で、守られている資源と、その認可を担当するサーバーの場所が書かれています。

- `resource` は MCP エンドポイント (`…/_emdash/api/mcp`) 自身
- `authorization_servers` はサイト自身 (`…/_emdash`) を指す

後者は [RFC 8414](https://datatracker.ietf.org/doc/html/rfc8414) の形式で、その認可サーバーが何に対応しているかが並びます。

- `scopes_supported` に 12 個のスコープが並ぶ (前者にも同じ一覧が入っています)
- `grant_types_supported` は authorization_code とリフレッシュトークンとデバイスコード
- `registration_endpoint` がある。[RFC 7591](https://datatracker.ietf.org/doc/html/rfc7591) の動的クライアント登録に対応している
- `code_challenge_methods_supported` は S256。PKCE[^pkce] が使える
- `token_endpoint_auth_methods_supported` は none。公開クライアントを想定している

EmDash は自身が OAuth 2.0 の認可サーバーになっています。MCP クライアントは個人のトークンを手で貼り付けなくても、サイトの URL を渡すだけで認可の手順に入れます。

> [!WARNING]
> MCP の仕様は 2026-07-28 版で `client_id` の取得方法を 3 つに整理し、クライアントが試す順番を決めました。事前に登録した情報があればそれを使い、無ければクライアント自身の URL をメタデータの置き場所として使う Client ID Metadata Documents を使います。RFC 7591 の動的クライアント登録は非推奨になり、Client ID Metadata Documents に対応していない認可サーバーのための代替として残っています。
> emdash 0.38.0 のソースと認可サーバーメタデータを確認したところ、Client ID Metadata Documents の実装はなく、`client_id_metadata_document_supported` も出ません。`client_id` を取得する方法は、動的クライアント登録か管理画面での事前登録の 2 つです。

CLI も同じ認可サーバーを使います。`emdash login --url https://<your-site>` を実行すると、`POST /_emdash/api/oauth/device/code` が `user_code` と `/_emdash/admin/device` を返却し、CLI はブラウザでの承認を待ちます。承認すると `✔ Logged in as …(admin)` と表示され、トークンが `~/.config/emdash/auth.json` に保存されます。アクセストークンの寿命は 1 時間、リフレッシュトークンは 90 日です。

ローカルでは CLI が無認証、MCP が Bearer トークン必須という非対称でしたが、リモートではどちらも同じ認可サーバーを使います。

この流れで発行されたトークンのスコープは `["admin"]` の 1 つだけです。それでも `content_create` は成功します。`src/auth/scopes.ts` のコメントに `Token-authenticated requests must have the required scope (or "admin")` とあり、admin が他のスコープを兼ねる扱いになっていました。

### ログインに成功した直後に Token is invalid or expired が返却される

本番へ `emdash login` して成功したのに、続けて実行した `emdash whoami --url https://<your-site>` が `ERROR Token is invalid or expired. Run: emdash login` を返却しました。

保存されていた認証情報そのものは正しく、同じトークンを `fetch` で直接送信すると 200 が返却されます。原因はシェルに残っていた `EMDASH_TOKEN` でした。ローカルの検証で使ったトークンで、ローカル DB をリセットしたため無効になっていたものです。CLI がトークンを決める順番は `--token`、`EMDASH_TOKEN`、保存済みの認証情報の順です。環境変数が保存済みより先に選ばれるため、何度ログインし直しても結果は変わりません。

```bash
unset EMDASH_TOKEN
```

これで成功するようになりました。`emdash whoami` の `Auth:` 行が `token` か `stored` かで、どちらを使っているか分かります。

### 本番で同じ指示を出す

ローカルと同じ内容で、本番に CLI と MCP から 1 件ずつ記事を作りました。

| | CLI `content create` | MCP `content_create` |
|---|---|---|
| status | published | draft |
| publishedAt | 2026-09-21T01:57:40.089Z | null |
| version | 2 | 1 |
| **公開 URL** | **200** | **302** |

CLI で作った記事は公開 URL がそのまま 200 を返却し、MCP で作った下書きは 302 を返却して、`/404` へ転送されます。ローカルで確認した差が、そのまま本番の公開状態の差になりました。同じ指示のつもりでも、どちらから作ったかで読者に見えるかどうかが変わります。

ついでに分かったこととして、日本語のタイトルから slug を作ると日本語がそのまま残ります (`/posts/cli-から本番に作った記事`)。CLI と MCP で同じでした。

CLI と MCP のどちらからでも同じコンテンツを操作できますが、既定の公開状態と認証で要求されるものは同じではありません。私は下書きを自分で読んでから公開したいので、エージェントに記事を書かせるときは MCP を使います。

## まとめ

- EmDash の CLI と MCP に同じ内容で記事の作成を指示すると、CLI は published、MCP は draft になる。emdash 0.38.0 では、CLI の `content create` が自動公開、MCP の `content_create` が下書きという既定値で、本番でも公開 URL が 200 と 302 に分かれた
- ローカルでは CLI が localhost で無認証、MCP が Bearer トークン必須という非対称になっている。リモートではどちらも EmDash 自身の OAuth 認可サーバーを使い、デバイスコードと動的クライアント登録と PKCE の S256 に対応している
- デバイスコードで発行されるトークンのスコープは admin の 1 つだけで、これが他のスコープを兼ねる
- `tools/list` はスコープで絞られない。content:read だけのトークンでも 59 件返却され、拒否されるのは実際に呼んだ時点になる
- 不正な入力がエラーになる場所は、CLI が手元の引数解析、MCP が MCP サーバーの引数検証、共通が EmDash のスキーマ検証に分かれる。MCP が EmDash へ渡す手前でエラーにするのは、そのツールの型に制約が書かれている場合だけ
- ロールは 5 種類あり、Author は自分の記事を公開でき、Contributor は自分の記事でも公開できない

## 参考

https://github.com/emdash-cms/emdash

https://docs.emdashcms.com/

https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization

https://datatracker.ietf.org/doc/html/rfc9728

https://datatracker.ietf.org/doc/html/rfc8414

https://datatracker.ietf.org/doc/html/rfc7591

https://datatracker.ietf.org/doc/html/rfc8628

[^mcp]: Model Context Protocol の略。AI のクライアントが外部のサービスと直接やりとりするための仕様です。
[^portabletext]: リッチテキストを JSON の配列として表す形式。見出しや段落をブロックの列として持ちます。
[^pkce]: Proof Key for Code Exchange の略。認可コードを横取りされても、対応する検証用の値がないとトークンに交換できないようにする仕組みです。

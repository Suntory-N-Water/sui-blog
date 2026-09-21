---
title: EmDash の CLI と MCP の両方で記事を書かせてみる
slug: tried-emdash-cli-and-mcp
date: 2026-09-21
modified_time: 2026-09-21
description: EmDash には CLI と MCP サーバーの両方が最初から入っています。blog-cloudflare テンプレートで作ったサイトを Cloudflare Workers と D1 と R2 で動かし、同じ「記事を作って」という指示を CLI と MCP に渡して、公開状態の違い、認証で必要になるもの、不正な入力が止まる場所の違いを確かめました。
icon: 🧦
icon_url: /icons/socks_flat.svg
tags:
  - Cloudflare
  - CMS
  - MCP
  - Astro
---
2026 年 4 月に Cloudflare が公開した [EmDash](https://github.com/emdash-cms/emdash) は、Astro を中心にした TypeScript 製の CMS です。[前回](/blog/built-a-blog-site-with-cloudflare-emdash-and-access-control)はマーケティングテンプレートを Cloudflare Workers へ載せて、管理画面を Cloudflare Access で保護するところまで試しました。

EmDash には CLI と MCP サーバー[^mcp]が最初から入っています。管理画面を開かずに記事を作る方法が 2 つあるわけです。同じ「記事を作って」という指示を両方に渡したら同じ結果になるのか気になったので、ローカルと本番の両方で確かめました。

観測はすべて emdash 0.38.0 のものです。テンプレートは blog-cloudflare、公開先は Cloudflare Workers で、D1 と R2 を使う構成です。0.38.0 より前のバージョンでは、ここで挙げるコマンドやツールの数が違う可能性があります。

## EmDash に内蔵されている CLI と MCP サーバー

CLI は `npx emdash` で呼び出します。トップレベルのコマンドは 18 個で、うち `auth` には `[DEPRECATED]` が付いています。MCP サーバーのほうはサイトそのものの一部で、リクエストを受け付けるのは `/_emdash/api/mcp` です。別のプロセスを立てる必要はありません。

ローカルの開発サーバーに対して両方を呼んでみると、認証の扱いが同じではありませんでした。

```bash
# CLI: localhost なら認証なしで通る
npx emdash content list posts --json

# MCP: 同じサイトの MCP エンドポイントは 401
curl -i -X POST http://localhost:4322/_emdash/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

CLI は一覧を返し、MCP は `{"code":"NOT_AUTHENTICATED"}` を返します。401 のレスポンスヘッダーには `WWW-Authenticate: Bearer resource_metadata="…/.well-known/oauth-protected-resource"` が付きます。

EmDash 側のミドルウェア `src/astro/middleware/auth.ts` を読むと、MCP エンドポイントではセッション認証が参照されず、ベアラートークン以外は 401 になります。ブラウザで管理画面にログイン済みでも、そのセッション Cookie は MCP では使われません。

ローカルで試すためのトークンは `/_emdash/api/setup/dev-bypass?token=1` が発行します。付くスコープは content:read / content:write / media:read / media:write / schema:read / schema:write / admin の 7 つです。

## ブログテンプレートでサイトを作って Cloudflare に載せる

プロジェクトの作成はテンプレートを選ぶだけです。

```bash
pnpm create emdash@latest
```

テンプレートに blog-cloudflare、デプロイ先に Cloudflare Workers を選ぶと、`wrangler.jsonc` に D1 と R2 のバインディングが入った状態で生成されます。

```jsonc wrangler.jsonc
"d1_databases": [{ "binding": "DB", "database_name": "my-emdash-site", "database_id": "…" }],
"r2_buckets": [{ "binding": "MEDIA", "bucket_name": "my-emdash-media" }],
```

`pnpm dev` の起動ログには `Auto-seeded default collections` が出ます。この時点で `emdash schema list` は posts と pages を返し、`source` は `seed` です。ところが `emdash content list posts` は `{"items": []}` のままです。`/_emdash/admin` で初期セットアップを終えてから同じコマンドを実行すると、8 件返ってきました。

前回の記事で書いた「seed は管理画面の初期セットアップ完了をきっかけに反映される」は、コンテンツについては 0.38.0 でも同じでした。スキーマだけは起動時に適用されるように変わっています。ソースを見ると、起動時の自動 seed は `applySeed(db, seed, { onConflict: "skip" })` を呼んでいて、`includeContent` の既定値が `false` です。

本番は `pnpm run deploy` (`astro build && wrangler deploy`) で公開し、本番の管理画面でも同じ初期セットアップを済ませました。ここまでで `GET /` が 200 を返します。以降、本番の URL は `https://<your-site>` と書きます。

## CLI で記事を作らせる

`content create` はコレクションのスラッグと、フィールドの値を JSON で受け取ります。

```bash
npx emdash content create posts --json --data '{
  "title": "CLI から作った記事",
  "content": "# CLI から作った記事\n\n本文です。",
  "excerpt": "CLI から作った記事の要約です。"
}'
```

返ってきた JSON で見るのは 3 行です。

```json
{
  "status": "published",
  "publishedAt": "2026-09-21T01:31:32.432Z",
  "version": 2
}
```

作成を指示しただけで公開まで済んでいます。`liveRevisionId` も設定されました。`version` が 2 になっているのは、作成と公開で書き込みが 2 回発生したためだと考えられます。

`content create --help` を見ると `--draft` があり、説明は `Keep as draft instead of auto-publishing` です。CLI の既定は自動公開だと、ヘルプの文面からも読み取れます。

## MCP で同じ記事を作らせる

MCP サーバーは HTTP トランスポートで登録します。Claude Code なら次の形です。

```bash
claude mcp add --transport http emdash-site http://localhost:4322/_emdash/api/mcp \
  --header "Authorization: Bearer <token>"
```

登録したら `content_create` に、CLI とまったく同じ title と content と excerpt を渡しました。結果が分かれます。

| | CLI `content create` | MCP `content_create` |
|---|---|---|
| status | **published** | **draft** |
| publishedAt | 2026-09-21T01:31:32.432Z | null |
| version | 2 | 1 |
| liveRevisionId | 設定される | null |
| 返ってくる content | Markdown 文字列 | Portable Text[^portabletext] 配列 |

見るのは status の行です。同じ入力を渡しているのに、CLI で作った記事は公開済み、MCP で作った記事は下書きになります。

この結果を取ったのは 2026 年 9 月 21 日、macOS (Darwin 25.6.0) と Node 24.14.0 の上です。emdash 0.38.0、astro 7.3.3、wrangler 4.135.0 を使い、MCP のクライアントは Claude Code、サーバーが応答したプロトコルのバージョンは 2025-11-25 でした。以降の観測も同じ環境です。

理由はツールの説明文に書いてありました。`content_create` の説明には `Items are created as 'draft' by default — use content_publish to make them live.` とあり、`status` パラメータの説明は `Initial status (default 'draft'). Requires publish permission.` です。CLI が自動公開、MCP が下書きで、既定値が逆向きに決められています。

Markdown から Portable Text への変換は両方で実行されます。違うのは返り値の形だけで、MCP でも `content_get` に `markdown: true` を渡すと Markdown 文字列が返ります。

## 更新のとき、両者で必要になるもの

更新には、直前に取得したリビジョンの識別子が要ります。渡さずに実行すると、どちらも HTTP リクエストを出す前に止まりました。止める仕組みは別です。

CLI は引数の解析で止まり、`Missing required argument: --rev` と usage の全文を出します。MCP は JSON-RPC のエラーで止まり、`-32602 Input validation error: … _rev is required: call content_get for this item and pass back the _rev it returns` を返します。MCP 側は次にすべき操作まで文面に書いてあります。

識別子を渡すと、今度は更新後の状態が分かれます。

| | CLI | MCP |
|---|---|---|
| status | published | draft |
| liveRevisionId | 更新される | 変わらない |
| draftRevisionId | null | 設定される |
| 返り値 | 更新後の値 | `liveData` に公開中の古い値が入る |

CLI は更新してそのまま公開します。MCP は下書きのリビジョンに退避させ、公開中の内容は元のまま残します。作成のときと同じ向きの差です。

## 権限を絞ったトークンで拒否されるところを見る

トークンは `/_emdash/api/admin/api-tokens` への POST で発行します。セッション Cookie だけで POST すると `{"code":"CSRF_REJECTED","message":"Missing required header"}` が返り、`X-EmDash-Request: 1` が必要でした。ベアラートークンで認証した場合はこの確認を飛ばします。ソースのコメントには、トークンは Cookie と違って自動で送られる資格情報ではないため、と書かれています。

content:read だけのトークンを発行して、読み取りと書き込みを試しました。

| | CLI | MCP |
|---|---|---|
| 読み取り | 成功 (2 件取得) | 成功 (`content_list` が items を返す) |
| 書き込み | `ERROR Token lacks required scope: content:write` | `[INSUFFICIENT_SCOPE] Insufficient scope: requires content:write` |
| `tools/list` | — | **59 件** |

最後の行が意外でした。content:read しかないトークンでも `tools/list` は 59 件返り、admin のトークンで取ったときと件数が変わりません。`tools/list` はスコープで絞られないため、呼べないツールも一覧に並び、実際に呼んだ時点で初めて拒否されます。MCP 側の拒否は `isError: true` と `_meta.code` が `INSUFFICIENT_SCOPE` という形で返ります。

トークンのスコープは 12 種類あります。これとは別に、ユーザーのロールが 5 種類あります。`@emdash-cms/auth` 0.38.0 から権限の定義を抽出すると、こうなっていました。

| ロール | 権限数 | content:publish_own | content:publish_any |
|---|---:|---|---|
| SUBSCRIBER | 10 | なし | なし |
| **CONTRIBUTOR** | 13 | **なし** | なし |
| **AUTHOR** | 18 | **あり** | なし |
| EDITOR | 33 | あり | あり |
| ADMIN | 47 | あり | あり |

AUTHOR と CONTRIBUTOR の 2 行を見てください。検証の計画として「Author に公開を指示して拒否されるか試す」と書いていましたが、前提が違っていました。Author は自分の記事を公開できます。公開できないのは Contributor のほうです。

Author と Contributor のトークンで実際にどう拒否されるかは確かめられませんでした。API トークンは発行した本人のものになるため、管理者の画面から別ロールのトークンを発行できません。確かめるには、そのロールのユーザーを別途パスキーで登録します。

なお `mcp:tools` というスコープもありますが、これはプラグインが提供する MCP ツール専用です。コアの 59 ツールは content:read や content:write で判定されます。

## わざと壊しにいく

不正な入力を 3 通り渡して、どこで止まるかを見ました。

| 入力 | CLI | MCP | 止まった場所 |
|---|---|---|---|
| 存在しないフィールドを 2 つ | `ERROR author_name: unknown field on collection 'posts'; published_date: unknown field on collection 'posts'` | `[VALIDATION_ERROR] author_name: unknown field on collection 'posts'; published_date: unknown field on collection 'posts'` | 両方ともサーバーのスキーマ検証 |
| `schedule` の日時に `2026-13-45T99:00:00Z` | `ERROR Invalid scheduled date` | `[VALIDATION_ERROR] Invalid scheduled date` | 両方ともサーバー |
| `update` の `publishedAt` に `2026-13-45T99:00:00Z` | 該当するオプションが CLI にない | `-32602 Input validation error: Invalid input at publishedAt` | MCP のクライアント側の JSON Schema |

1 行目では、CLI と MCP で接頭辞が違うだけで、あとの文言が 1 文字も変わりません。どちらもサーバーの同じ検証で止まっているためです。

3 行目だけが手前で止まっています。同じ形の不正な日付なのに、2 行目はサーバーまで送られます。理由はツールごとの型の書き方です。`content_schedule` の `scheduledAt` は JSON Schema の上では単なる `string` ですが、`content_update` の `publishedAt` には ISO 8601 の正規表現が付いています。

不正な入力が止まる場所は 3 つに分かれます。CLI は引数の解析、MCP は JSON Schema、両方に共通するのがサーバーのスキーマ検証です。ただし MCP が手前で止めるのは、そのツールの型に制約が書かれている場合だけです。

## 59 個のツールと CLI のコマンドを並べる

MCP のコアツールは 59 個です。Administrator のトークンで取得した `tools/list` の件数と、`src/mcp/server.ts` から抽出した件数が一致しました。CLI のトップレベルコマンドは 18 個です。

サブコマンドの単位で並べると、こうなります。

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

太字にした 3 行は、CLI 側に対応するコマンドがありません。著者情報、リビジョンの操作、サイト設定の読み書きは、MCP からしか実行できません。

逆に CLI にしかないのは init / types / doctor / seed / migrate / export-seed / secrets / auth / login / logout / whoami / plugin の 12 個です。どれもローカルの DB かプロジェクトの運用に関わるもので、コンテンツの操作ではありません。この分かれ方を見ると、CLI はプロジェクトを組み立てる側、MCP はコンテンツを編集する側に寄せてあります。

## 本番では認証が一本に集まる

本番の MCP エンドポイントにトークンなしで POST すると、ローカルと同じ 401 に `WWW-Authenticate` が付いて返ります。そこに書かれた URL をたどると、2 つのメタデータが取れます。

```bash
curl -s https://<your-site>/.well-known/oauth-protected-resource
curl -s https://<your-site>/.well-known/oauth-authorization-server/_emdash
```

後者は [RFC 8414](https://datatracker.ietf.org/doc/html/rfc8414) の形式でした。読み取れたのは次の内容です。

- `authorization_servers` はサイト自身 (`…/_emdash`) を指す
- `scopes_supported` に 12 個のスコープが並ぶ
- `grant_types_supported` は authorization_code とリフレッシュトークンとデバイスコード
- `registration_endpoint` がある。[RFC 7591](https://datatracker.ietf.org/doc/html/rfc7591) の動的クライアント登録に対応している
- `code_challenge_methods_supported` は S256。PKCE[^pkce] が使える
- `token_endpoint_auth_methods_supported` は none。公開クライアントを想定している

EmDash は自身が OAuth 2.0 の認可サーバーになっています。MCP クライアントは個人のトークンを手で貼り付けなくても、サイトの URL を渡すだけで認可の手順に入れます。

CLI も同じ認可サーバーを使います。`emdash login --url https://<your-site>` を実行すると、`POST /_emdash/api/oauth/device/code` が `user_code` と `/_emdash/admin/device` を返し、CLI はブラウザでの承認を待ちます。承認すると `✔ Logged in as …(admin)` と表示され、トークンが `~/.config/emdash/auth.json` に保存されます。アクセストークンの寿命は 1 時間、リフレッシュトークンは 90 日です。

ローカルでは CLI が無認証、MCP がベアラートークン必須という非対称でしたが、リモートではどちらも同じ認可サーバーに集まります。

この流れで発行されたトークンのスコープは `["admin"]` の 1 つだけです。それでも `content_create` は通ります。`src/auth/scopes.ts` のコメントに `Token-authenticated requests must have the required scope (or "admin")` とあり、admin が他のスコープを兼ねる扱いになっていました。

### ログインに成功した直後に Token is invalid or expired と言われる

本番へ `emdash login` して成功したのに、続けて実行した `emdash whoami --url https://<your-site>` が `ERROR Token is invalid or expired. Run: emdash login` を返しました。

保存されていた認証情報のほうは正しいものでした。SHA-256 が D1 の `_emdash_oauth_tokens.token_hash` と一致し、有効期限の中にあり、同じトークンを `fetch` で直接投げると 200 が返ります。

原因はシェルに残っていた `EMDASH_TOKEN` でした。ローカルの検証で使ったトークンで、ローカル DB をリセットしたため無効になっていたものです。CLI がトークンを決める順番は `--token`、`EMDASH_TOKEN`、保存済みの認証情報の順です。環境変数が保存済みより先に選ばれるため、何度ログインし直しても結果は変わりません。

```bash
unset EMDASH_TOKEN
```

これで通るようになりました。`emdash whoami` の `Auth:` 行が `token` か `stored` かで、どちらを使っているか分かります。

### 本番でも同じ非対称が出る

ローカルと同じ内容で、本番に CLI と MCP から 1 本ずつ記事を作りました。

| | CLI `content create` | MCP `content_create` |
|---|---|---|
| status | published | draft |
| publishedAt | 2026-09-21T01:57:40.089Z | null |
| version | 2 | 1 |
| **公開 URL** | **200** | **302** |

最後の行が結果です。CLI で作った記事は公開 URL がそのまま 200 を返し、MCP で作った下書きは 302 で戻されます。ローカルで見た差が、そのまま本番の公開状態の差になりました。同じ指示のつもりでも、どちらから作ったかで読者に見えるかどうかが変わります。

ついでに分かったこととして、日本語のタイトルからスラッグを作ると日本語がそのまま残ります (`/posts/cli-から本番に作った記事`)。CLI と MCP で同じでした。

今回の検証で確かめられなかったことが 2 つあります。Author と Contributor のロールでの実際の動きと、Cloudflare Access を設定した状態での CLI と MCP の動きです。

## まとめ

- EmDash の CLI と MCP に同じ内容で記事の作成を指示すると、CLI は published、MCP は draft になる。emdash 0.38.0 では、CLI の `content create` が自動公開、MCP の `content_create` が下書きという既定値で、本番でも公開 URL が 200 と 302 に分かれた
- ローカルでは CLI が localhost で無認証、MCP がベアラートークン必須という非対称になっている。リモートではどちらも EmDash 自身の OAuth 認可サーバーを使い、デバイスコードと動的クライアント登録と PKCE の S256 に対応している
- デバイスコードで発行されるトークンのスコープは admin の 1 つだけで、これが他のスコープを兼ねる
- `tools/list` はスコープで絞られない。content:read だけのトークンでも 59 件返り、拒否されるのは実際に呼んだ時点になる
- 不正な入力が止まる場所は、CLI が引数の解析、MCP が JSON Schema、共通がサーバーのスキーマ検証に分かれる。MCP が手前で止めるのは、そのツールの型に制約が書かれている場合だけ
- ロールは 5 種類あり、Author は自分の記事を公開できる。公開できないのは Contributor

CLI と MCP のどちらからでも同じコンテンツを操作できますが、既定の公開状態と認証で要求されるものは同じではありません。エージェントに記事を書かせる構成を組むなら、公開まで任せるのか下書きで止めるのかを先に決めて、それに合うほうを選ぶことになります。

<!-- textlint-disable ja-technical-writing/ja-no-mixed-period -->
今回は以上になります✊️
<!-- textlint-enable ja-technical-writing/ja-no-mixed-period -->

## 参考

https://github.com/emdash-cms/emdash

https://docs.emdashcms.com/

https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization

https://datatracker.ietf.org/doc/html/rfc8414

https://datatracker.ietf.org/doc/html/rfc7591

https://datatracker.ietf.org/doc/html/rfc8628

[^mcp]: Model Context Protocol の略。AI のクライアントが外部のサービスと直接やりとりするための仕様です。
[^portabletext]: リッチテキストを JSON の配列として表す形式。見出しや段落をブロックの列として持ちます。
[^pkce]: Proof Key for Code Exchange の略。認可コードを横取りされても、対応する検証用の値がないとトークンに交換できないようにする仕組みです。

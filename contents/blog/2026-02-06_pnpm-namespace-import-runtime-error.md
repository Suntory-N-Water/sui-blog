---
title: 社内モジュールがpnpmで動かなくなった日
slug: pnpm-namespace-import-runtime-error
date: 2026-02-06
modified_time: 2026-02-06
description: npmからpnpmへの移行で社内モジュールが動かなくなった原因と解決策を紹介。node_modulesの構造の違いによりnamespace importが実行時エラーになる問題を解説します。
icon: 📦
icon_url: /icons/package_flat.svg
tags:
  - pnpm
  - npm
  - Node.js
  - TypeScript
---

Node.jsのパッケージマネージャーは、2010年にnpmが登場して以来、フラットなnode_modules構造による高速化と互換性を重視してきました。しかしこの設計は、package.jsonに記載していない依存パッケージを直接参照できてしまう「ファントム依存」という課題を生みます。2016年に開発が始まったpnpm[^pnpm]は、シンボリックリンクを用いた厳格な依存関係管理によってこの問題を解決しました。

正直なところ、pnpmへの移行は「やった方がよいのはわかっているけど、面倒で後回し」という状態が続いていました。ファントム依存の問題も、実際にはパッケージのバージョンを合わせればたいていは動きますし、最悪トラブルが起きてもどうにかなります。
目の前には他の優先度の高いタスクが山積みで、「今すぐ移行する理由」が見つからなかったのです。

しかし、この緩さが私たちのチームでは無視できない問題を引き起こすようになりました。

私たちのチームでは複数のプロダクトで共通利用される社内パッケージ群を、Google Cloud のArtifact Registry[^artifact-registry]で管理しています。
データ変換処理やGoogle Cloud Storageへのアクセスといった基盤的な機能を提供するパッケージ群ですが、npmを使い続ける中で2つの課題が表面化しました。

1つ目は、異なる社内パッケージが別バージョンのGoogle Cloud Storage関連モジュールに依存することで型定義の衝突が発生し、不要な調査と修正に時間を奪われることです。
2つ目は、npmが生成するフラットなnode_modulesがファントム依存を生み出し、依存関係のブラックボックス化を招いていたことです。
これらの問題を解決するため、pnpmへの移行を決めました。

## なぜpnpmを選んだのか

移行先の検討にあたり、BunやYarnも候補に上がりました。
Bunは実行速度において非常に魅力的でしたが、移行検討時点では私たちのプロジェクトで利用しているPlaywright[^playwright]への公式対応が十分でなかったため、採用を見送りました。

最終的に、npmとの互換性を保ちながらファントム依存を排除し、厳密な依存関係管理を実現できるpnpmを選択しました。
依存関係のブラックボックス化を解消できると考えたからです。

移行作業自体は順調に進みlock fileの再生成や、その他の設定変更も大きな問題なく完了しています。
しかし、モジュールをパッケージ化して動作確認をしたところ、npm環境では正常に動作していた社内モジュールが、pnpm環境に切り替えたとたんに動作しなくなりました。具体的には以下のようなエラーが発生します。

```bash
TypeError: fs.createWriteStream is not a function
    at converter (file:///app/node_modules/.pnpm/@company+utils@x.x.x/node_modules/@company/utils/dist/file/converter.js:8:23)
```

## なぜnpmでは動くのにpnpmで動かないのか

問題のコードは、特別なことをしていません。`import * as` の形式(namespace import)でパッケージ全体を読み込んでいるだけです。

```ts
// エラーが発生するコード
import * as fs from 'fs-extra';
const stream = fs.createWriteStream(path); // TypeError
```

原因は、npmとpnpmのnode_modules構造の違いにあります。

npmは、依存関係をフラットな構造でnode_modulesのトップレベルに巻き上げます。
以下は、npmが実際に作るディレクトリ構造です。

```bash
node_modules/
├── @company/
│   └── utils/
│       ├── package.json          # dependencies: { "fs-extra": "^11.0.0" }
│       └── dist/
│           └── file/
│               └── converter.js
├── fs-extra/                     # <- 巻き上げられてトップレベルに配置
│   ├── package.json
│   └── lib/
│       └── index.js              # createWriteStream 等を提供
└── (その他の依存パッケージ...)
```

プロジェクトのコードから直接 `import * as fs from 'fs-extra'` とすると、package.jsonに書いていないのにnode_modules/fs-extra/へアクセスできてしまいます。
この仕様により、package.jsonに記載していないパッケージ、いわゆる孫依存[^transitive-dep]も、ソースコードからimport/requireできてしまうファントム依存が発生します。
今回のケースでは、npm環境のこの挙動によって、fs-extraがインポート可能になりコードが動作していました。

対して、pnpmはシンボリックリンク(ファイルへのショートカットのようなもの)を用いて、各パッケージが自身のpackage.jsonで宣言した依存関係にのみアクセスできるよう、厳格に隔離されたディレクトリ構造を構築します。

```bash
node_modules/
├── @company/
│   └── utils -> .pnpm/@company+utils@1.0.0/node_modules/@company/utils
│                (シンボリックリンク)
│
└── .pnpm/
    ├── @company+utils@1.0.0/
    │   └── node_modules/
    │       ├── @company/
    │       │   └── utils/               # <- 実体
    │       │       ├── package.json
    │       │       └── dist/
    │       │           └── file/
    │       │               └── converter.js
    │       └── fs-extra/                # <- このパッケージ専用
    │           ├── package.json
    │           └── lib/
    │               └── index.js
    │
    └── fs-extra@11.0.0/
        └── node_modules/
            └── fs-extra/
                └── (実体)
```

プロジェクトのコードから `import * as fs from 'fs-extra'` を実行すると、Node.jsはnode_modules/fs-extraを探しますが、存在しません。
fs-extraの実体は.pnpm/配下にしかないため、モジュールが見つからずエラーになります。
一方で、@company/utilsのコード内から同じimportを実行した場合は、.pnpm/@company+utils@1.0.0/node_modules/fs-extraを探すため、package.jsonに記載があれば正しく解決できます。

pnpmが構築した厳格なディレクトリ構造の下では、シンボリックリンクを介したモジュール解決となるため、namespace importがCommonJSモジュールのエクスポートを正しく展開できないケースがあります。
コンパイルは通っても、実行時にnamespace importで生成されたオブジェクトに期待したメソッドが存在せず、今回のTypeErrorにつながっています。

私が調べた限りでは、tsconfig.json の設定で `esModuleInterop`[^esmoduleinterop] を設定すれば解決するという情報を見かけましたが、今回の問題では解決されませんでした。
`esModuleInterop` は、`import * as x` を `require("x")` と同一視するTypeScriptの挙動を修正し、ES6仕様に準拠した正しいnamespace objectとして扱うためのヘルパーコードを生成するオプションです[^cjs-esm]。しかし、社内パッケージはすでにコンパイル済みのJavaScriptとして配布されているため、利用側のtsconfig.jsonを変更してもパッケージ内部のコンパイル結果には影響せず、問題は解消されませんでした。

## 解決方法

まず、どのファイルに問題があるかを特定する簡単なスクリプトを作成しました。
社内モジュールではnamespace importが多数のファイルに散らばっていたため、手動確認では見落としや修正漏れが発生します。

- 検知対象
  - `import * as [変数名] from '[パッケージ名]'` パターンのimport文
  - 外部ライブラリからのnamespace import
- 除外対象
  - Node.js 標準モジュール(`fs`, `path`, `stream` 等はpnpmでも問題なし)
  - 相対パス(`./utils`, `../config` 等の内部モジュールは問題なし)
  - 絶対パス(`/absolute/path` 等のまれなケースも同様に除外)

スクリプトを実行後、エラー内容をもとにGitHub CopilotやClaude Codeが具体的な修正作業を実行します。

次に、対象ライブラリがCommonJSかESMかを確認します。

```bash
# fs-extraの場合
pnpm view fs-extra type
# → undefined (CommonJSモジュール)

# lodash-esの場合
pnpm view lodash-es type
# → module (ESMモジュール)
```

`type: "module"` がなくてもESMのライブラリもありますが、まれなのでテスト環境で確認するのが手っ取り早いです。
あとは使用するメソッドを明示的にインポートするだけです。

CommonJSモジュールとESMモジュールで修正方法が若干異なります。

```ts
// CommonJSモジュールの場合
// 修正前
import * as fs from 'fs-extra';
const stream = fs.createWriteStream(path);

// 修正後
import fs from 'fs-extra';
const { createWriteStream, ensureDir } = fs;
const stream = createWriteStream(path);

// ESMモジュールの場合
// 修正前
import * as _ from 'lodash-es';
const result = _.map(data, fn);

// 修正後
import { map, filter } from 'lodash-es';
const result = map(data, fn);
```

修正後は、実際にパッケージをインストールし、サンプルリポジトリなどで動作を確認します。
今回の事象はランタイムエラーでのみ発生するため、型チェックだけで済ませず必ず実行して確かめましょう。

## まとめ

- npmのフラットなnode_modules構造は「ファントム依存」を生み出し、意図しないパッケージの参照を許してしまう
- pnpmはシンボリックリンクによる厳格な依存関係管理でこの問題を解決するが、移行時にnamespace import(`import * as`)がCommonJSモジュールに対して実行時エラーを引き起こすケースがある
- この問題はコンパイル時には検出されないため、必ず実行環境での動作確認が必要である
- 対象ライブラリがCommonJSかESMかを確認し、default importやnamed importに書き換えることで解決できる
- `esModuleInterop` はnamespace importの挙動をES6仕様に準拠させるオプションだが、コンパイル済みパッケージには影響しない

## 余談

移行を進めている最中の2025年8月26日、Nx[^nx]において攻撃者によって複数の悪意のあるバージョンが公開される事件が発生しました。
190以上のユーザーや組織が影響を受け、1,000件を超えるシステムから認証情報が流出しています。
直接依存していなくても子パッケージ経由でスクリプトが実行されるケースがあるという事実は、`npm install` という日常的な操作が攻撃の入口になりうることを示しました。
移行判断のタイミングとしては、結果的に良かったと感じています。

## 参考

https://pnpm.io/

https://nodejs.org/api/esm.html

https://github.com/jprichardson/node-fs-extra

https://www.typescriptlang.org/tsconfig/esModuleInterop.html

[^pnpm]: 2016年に開発が開始されたパッケージマネージャー。コンテンツアドレスストレージによるディスク使用量の削減とインストール速度の改善を実現し、シンボリックリンクを用いた厳格な依存関係管理でファントム依存問題も解決する。

[^artifact-registry]: Google Cloudが提供するパッケージ管理サービス。npmパッケージやDockerイメージなどを社内限定で公開・管理できる。

[^playwright]: Webページを自動操作するテストツール。E2Eテスト(ブラウザ上での動作確認)などで使用される。

[^nx]: モノレポ管理のためのビルドツール。複数のプロジェクトを1つのリポジトリで効率的に管理できる。

[^esmoduleinterop]: TypeScriptコンパイラのオプション。CommonJSモジュールをESM形式でインポートする際の互換性を改善する。

[^cjs-esm]: JavaScriptのモジュールシステムの2つの形式。CommonJS(CJS)は `require/module.exports`、ES モジュール(ESM)は `import/export` を使用。

[^transitive-dep]: 直接インストールしたパッケージが依存しているさらにその先のパッケージ。たとえば、プロジェクトがAに依存し、Aがfs-extraに依存している場合、fs-extraはプロジェクトから見た孫依存にあたる。

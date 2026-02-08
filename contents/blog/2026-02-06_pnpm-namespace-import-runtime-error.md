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

Node.jsのパッケージマネージャーは、2010年にnpmが登場して以来、JavaScriptエコシステムの依存関係管理を支えてきました。初期のnpmはネストされたnode_modules構造を採用していましたが、パスの深さやディスク使用量の問題を解消するため、2015年のnpm 3でフラットな構造（ホイスティング）が導入されました[^npm3]。しかしこのフラット化により、package.jsonに記載していない依存パッケージを直接参照できてしまう「ファントム依存」が新たな課題として浮上し、2016年にこれを解決するためpnpmの開発が始まりました[^pnpm]。

正直なところ、pnpmへの移行は「やった方がよいのはわかっているけど、面倒で後回し」という状態が続いていました。ファントム依存の問題も、実際にはパッケージのバージョンを合わせればたいていは動きますし、最悪トラブルが起きてもどうにかなります。
目の前には他の優先度の高いタスクが山積みで、「今すぐ移行する理由」が見つからなかったのです。

しかし、npmの緩さが無視できない問題を引き起こすようになりました。
私たちのチームでは複数のプロダクトで共通利用される社内パッケージ群を、Google Cloud のArtifact Registry[^artifact-registry]で管理しています。
データ変換処理やGoogle Cloud Storageへのアクセスといった基盤的な機能を提供していますが、npmを使い続ける中で依存関係管理に起因する課題を抱えていました。

異なる社内パッケージが別バージョンのGoogle Cloud Storage関連モジュールに依存することで型定義の衝突が発生し、不要な調査と修正に時間を奪われます。
npmが生成するフラットなnode_modulesがファントム依存を生み出し、依存関係のブラックボックス化を招きます。
この問題を解決するため、pnpmへ移行しました。

余談ですが、移行を進めている最中の2025年8月26日、Nx[^nx]において攻撃者によって複数の悪意のあるバージョンが公開される事件が発生しました。
この攻撃で900人以上が被害を受け、API キーなどの機密情報が流出しています。
直接依存していなくても子パッケージ経由でスクリプトが実行されるケースがあるという事実は、`npm install` という日常的な操作が攻撃の入口になることを示しました。
移行判断のタイミングとしては、結果的に良かったと感じています。

## なぜpnpmを選んだのか

移行先の検討にあたり、BunやYarnも候補に上がりました。
Bunは実行速度において非常に魅力的でしたが、移行検討時点では私たちのプロジェクトで利用しているPlaywright[^playwright]への公式対応が十分でなかったため、採用を見送りました。

最終的に、npmとの互換性を保ちながらファントム依存を排除し、厳密な依存関係管理を実現できるpnpmを選択しました。
依存関係のブラックボックス化を解決できると考えたからです。

そして、npmの緩さに隠されていた問題が、pnpmの厳格な環境下で初めて表面化することになります。
npm環境では正常に動作していた社内モジュールが、pnpm環境に切り替えたとたんに動作しなくなりました。以下のようなエラーが発生します。

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
この仕様により、package.jsonに記載していないパッケージ(直接インストールしたパッケージが依存しているさらにその先のパッケージ、いわゆる孫依存)も、ソースコードからimport/requireできてしまうファントム依存が発生します。
今回のケースでは、npm環境のこの挙動によって、fs-extraがインポート可能になりコードが動作していました。

対してpnpmは、シンボリックリンク(ファイルへのショートカットのようなもの)を用いて、各パッケージが自身のpackage.jsonで宣言した依存関係にのみアクセスできるよう、厳格に隔離されたディレクトリ構造を構築します。

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

pnpmが構築した厳格なディレクトリ構造の下では、Node.jsがモジュールを探索するしくみ上、呼び出し元のファイルからfs-extraへのパスを正しく解決できません。
いくらコンパイルが通ったとしても、実行時にモジュールそのものが見つからないため、インポートした結果が期待と異なり、今回のTypeErrorにつながっています。

私が調べた限りでは、tsconfig.json の設定で `esModuleInterop`[^esmoduleinterop] を設定すれば解決するという情報を見かけましたが、今回の問題では解決されませんでした。

`esModuleInterop` はコンパイル時にCommonJSとES モジュール[^cjs-esm]の構文を橋渡しするヘルパーコードを生成しますが、実行時のモジュール解決には影響しません。pnpmが実際のモジュールを正しく解決できなければ効果がないのです。

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

CommonJSモジュールやESMモジュールで若干例が異なります。

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

修正後は、実際にパッケージをインストールし、サンプルリポジトリなどで動作確認を行います。
今回の事象はランタイムエラーでのみ発生するため、型チェックだけではなく必ず動作確認を行いましょう。

## 参考

https://pnpm.io/

https://nodejs.org/api/esm.html

https://github.com/jprichardson/node-fs-extra

https://npm.github.io/how-npm-works-docs/npm3/how-npm3-works.html

---

## 脚注

[^npm3]: 2015年リリース。それまでのネスト構造（各パッケージが自身のnode_modules内に依存を持つ深い入れ子）を廃止し、依存をトップレベルに巻き上げるフラット構造を導入した。Windowsのパス長制限やディスク使用量の問題を解消する一方、ファントム依存という副作用を生んだ。

[^pnpm]: 2016年にRico Sta. Cruzが開発を開始し、2017年にZoltan Kochanによりv1.0がリリースされたパッケージマネージャー。npmのフラット構造によるファントム依存問題を、シンボリックリンクを用いた厳格な依存関係管理で解決する。

[^artifact-registry]: Google Cloudが提供するパッケージ管理サービス。npmパッケージやDockerイメージなどを社内限定で公開・管理できる。

[^playwright]: Webページを自動操作するテストツール。E2Eテスト(ブラウザ上での動作確認)などで使用される。

[^nx]: モノレポ管理のためのビルドツール。複数のプロジェクトを1つのリポジトリで効率的に管理できる。

[^esmoduleinterop]: TypeScriptコンパイラのオプション。CommonJSモジュールをESM形式でインポートする際の互換性を改善する。

[^cjs-esm]: JavaScriptのモジュールシステムの2つの形式。CommonJS(CJS)は `require/module.exports`、ES モジュール(ESM)は `import/export` を使用。

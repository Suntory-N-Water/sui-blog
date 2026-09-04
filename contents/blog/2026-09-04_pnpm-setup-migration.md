---
title: pnpm のセットアップに 7 分かかっていたので pnpm/setup へ移行した
slug: pnpm-setup-migration
date: 2026-09-05
modified_time: 2026-09-05
description: GitHub Actions で pnpm v11 を pnpm/action-setup で入れていたら、セットアップ step だけで 7 分かかっていました。pnpm v11 以降の後継として公式が案内している pnpm/setup へ差し替える手順と、移行時に引っかかる pnpm install の扱い、pnpm v10 以前が対象外である点までを紹介します。
icon: 🔨
icon_url: /icons/hammer_flat.svg
tags:
  - GitHubActions
  - pnpm
---

GitHub Actions で pnpm を使うとき、`pnpm/action-setup` で pnpm を入れて `actions/setup-node` で Node.js を入れる、という 2 つの step を並べる書き方が長く定番でした。CI が遅いと感じたときに疑うのも、たいていはテストやビルドです。セットアップ step にかかった時間をログで確認する機会は、あまりありません。

しかし pnpm v11 の登場によって、この定番の構成には見直しの余地が生まれています。`pnpm/action-setup` は pnpm v11 以降について、[pnpm/setup](https://github.com/pnpm/setup) を後継として案内するようになりました。後継の action は pnpm の実行ファイルを直接取得し、Node.js のインストールも同じ step で担うため、`actions/setup-node` そのものが不要になります。

この記事では、実際にセットアップ step が 7 分かかっていたログを起点に、`pnpm/setup` へ移行する手順と、移行時に引っかかる `pnpm install` の扱いまでを紹介します。

<!-- textlint-disable preset-ja-technical-writing/no-unmatched-pair -->

>[!NOTE]
>2026 年 9 月時点の情報です。移行先として `pnpm/setup` v2.1.0、pnpm は v11.25.0 を対象にしています。`pnpm/setup` は pnpm v11 以降専用のため、v10 以前を使っているリポジトリはそのまま `pnpm/action-setup` を使い続けてください。

<!-- textlint-enable preset-ja-technical-writing/no-unmatched-pair -->

## 7 分かかっていた step

社内の Artifact Registry にライブラリを publish しているプロジェクトで、main へマージしたときに CI がなかなか終わらないことがありました。E2E テストが長いのだろうと思って見にいったところ、時間を使っていたのは [changesets](https://github.com/changesets/changesets)[^changesets] で publish するジョブです。さらに中を開くと、pnpm のセットアップ step が 7 分かかっていました。

```bash
Running self-installer...

added 1 package in 7m

1 package is looking for funding
  run `npm fund` for details

Checking for updates...
Switching pnpm from v11.19.0 to v11.25.0...
Successfully updated pnpm to v11.25.0
Installation Completed!
```

`added 1 package in 7m` の 1 行が 7 分です。`pnpm setup` というコマンドの実行が遅いのではなく、action が pnpm を用意し終えるまでに 7 分かかっていたことがわかります。

この step の末尾には、次の警告も出ていました。

```text
[WARN] Detected a pnpm v10 installation layout at PNPM_HOME.
Run "pnpm setup" to migrate your PATH to the v11 layout.
```

pnpm v10 を使っていないのにこの警告が出るという報告が [action-setup の Issue #281](https://github.com/pnpm/action-setup/issues/281) に上がっており、2026 年 9 月時点でも open のままです。つまりこの警告を見て、workflow に `pnpm setup` の step を足す必要はありません。

## pnpm v11 以降は pnpm/setup が後継

pnpm のメジャーバージョンが 11 に上がったというニュースを見ていたため、バージョン周りが関係していそうだと当たりを付けて調べました。`pnpm/action-setup` の README には、冒頭に次の案内があります。

> **This action has a successor: [`pnpm/setup`](https://github.com/pnpm/setup).**
>
> For pnpm v11 and newer, use [`pnpm/setup`](https://github.com/pnpm/setup) instead. It downloads pnpm's self-contained release binary (no Node.js or npm required) and can install a JavaScript runtime (Node.js, Bun, or Deno) in the same step, replacing `actions/setup-node`.

pnpm v10 以前は引き続き `pnpm/action-setup` を使い、v11 以降は `pnpm/setup` に移る、という切り分けです。
`pnpm/setup` は Node.js、Bun、Deno のいずれかを同じ step でインストールできる仕様のため、`actions/setup-node` の step は削除できます。

7 分の内訳を掘り下げるより、案内されている後継へ移るほうが早いと判断しました。

## 移行前の構成

移行前は次の 2 step です。

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10

- name: Setup Node.js
  uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
  with:
    node-version: "24"
    cache: "pnpm"
```

同じ形を使っているリポジトリは多いはずです。まずは自分の workflow で、セットアップ step の所要時間をログで確認してみましょう。

## pnpm/setup へ置き換える

置き換えた結果が以下です。2 つあった step が 1 つになります。

```yaml
- name: Setup pnpm and Node.js
  uses: pnpm/setup@703c52620218391530e48b9e8870d5c0082e1b9b # v2.1.0
  with:
    runtime: node@24
    cache: true
```

`version` を指定していない点に注意してください。[action.yml](https://github.com/pnpm/setup/blob/main/action.yml) のとおり、`version` を省略すると `package.json` の `devEngines.packageManager` または `packageManager` からバージョンが読まれます。

```json
{
  "packageManager": "pnpm@11.25.0"
}
```

どちらの宣言もない場合や、宣言が pnpm v10 以前を指している場合は、`version: 11.25.0` のように明示します。`pnpm/setup` は pnpm v11 以降しか解決できないため、ここを省略したまま古いバージョンが宣言されていると失敗します。

`cache` の既定値は `false` です。`pnpm/action-setup` から移行するときは指定を忘れやすいため、ストアをキャッシュしたい場合は `cache: true` を明記してください。

### install が二重に実行される場合

移行で唯一引っかかるのが `pnpm install` の扱いです。`pnpm/setup` は `package.json` があるとき、既定で `pnpm install` まで実行します。`install` の既定値が `true` であるためです。

そのため、これまで別の step で install を書いていた場合、そのまま差し替えると install が 2 回実行されます。自前の step を残すなら、action 側の install を止めます。

```diff
  - name: Setup pnpm and Node.js
    uses: pnpm/setup@703c52620218391530e48b9e8870d5c0082e1b9b # v2.1.0
    with:
      runtime: node@24
      cache: true
+     install: false

  - run: pnpm install --frozen-lockfile
```

install を action に任せる場合、`--frozen-lockfile` に相当する挙動は `require-lockfile: true` で指定します。

```yaml
- name: Setup pnpm and Node.js
  uses: pnpm/setup@703c52620218391530e48b9e8870d5c0082e1b9b # v2.1.0
  with:
    runtime: node@24
    cache: true
    require-lockfile: true
```

ただし、install する step に環境変数を渡している場合は `install: false` を選んでください。action 側の install に環境変数を渡す入力がないためです。たとえば Playwright のブラウザダウンロードを抑止する `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` を install 時に渡している構成が該当します。

## 移行時に確認しておく制約

`pnpm/setup` は `pnpm/action-setup` の単純な上位互換ではありません。移行前に次の 3 点を確認しておくと、差し替え後に慌てずに済みます。

- pnpm v11 以降しか扱えないため、v10 以前のリポジトリは `pnpm/action-setup` を使い続ける
- `run_install` にあったオブジェクト形式や配列形式(`recursive`、`cwd`、`args`)は `install` に引き継がれておらず、該当する処理は個別の step に分ける
- `cache_dependency_path` や `package_json_file` などの入力名は、`cache-dependency-path` のようにケバブケースへ変わっている

また `runtime` を指定すると、`pnpm/setup` は `PNPM_CONFIG_GLOBAL_SHIMS` を設定し、そのランタイムの context-aware shim を無効にします。以降の step では、プロジェクト側の宣言ではなく、この step で入れたバージョンがそのまま使われます。挙動を変えたい場合は、workflow 側で同じ環境変数を上書きしてください。

## まとめ

- pnpm v11 以降を GitHub Actions で使う場合、公式が後継として案内している `pnpm/setup` へ移行できる
- `pnpm/setup` は Node.js を同じ step でインストールするため、`actions/setup-node` の step は削除できる
- `package.json` の `packageManager` に pnpm v11 以降が宣言されていれば、`version` の指定を省略できる
- `pnpm/setup` は既定で `pnpm install` まで実行するため、別 step で install しているなら `install: false` を指定する
- install 時に環境変数を渡している構成では、action の install に環境変数を渡せないため自前の step を残す
- CI の実行時間を調べるときは、テストやビルドだけでなくセットアップ step の所要時間も確認する

## 参考

https://github.com/pnpm/setup

https://github.com/pnpm/setup/blob/main/action.yml

https://github.com/pnpm/action-setup

https://github.com/pnpm/action-setup/issues/281

[^changesets]: モノレポでパッケージのバージョン更新とリリースを管理するツール。変更内容をマークダウンで記録しておくと、バージョンの繰り上げと CHANGELOG の生成、レジストリへの publish までをまとめて実行できる。

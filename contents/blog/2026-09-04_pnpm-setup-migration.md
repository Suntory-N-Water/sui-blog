---
title: pnpm のセットアップに 7 分かかっていたので pnpm/setup へ移行した
slug: pnpm-setup-migration
date: 2026-09-04
modified_time: 2026-09-04
description: GitHub Actions で pnpm v11 を pnpm/action-setup で入れていたら、セットアップ step だけで 7 分かかっていました。公式が pnpm v11 以降の後継として案内している pnpm/setup へ差し替えた話と、移行時に引っかかる pnpm install の扱いを書いています。
icon: 🔨
icon_url: /icons/hammer_flat.svg
tags:
  - GitHubActions
  - pnpm
---

GitHub Actions で pnpm を使うとき、`pnpm/action-setup` で pnpm を入れて、`actions/setup-node` で Node.js を入れる。この 2 つを並べる書き方は、しばらく定番でした。私も何も考えずにこの形を使い回しています。

CI が遅いと感じたとき、まず疑うのはテストやビルドではないでしょうか。実際そこが重いことは多いですし、セットアップ step にかかる時間をわざわざログで確認する人は少ないはずです。私もそうでした。

社内のアーティファクトレジストリにライブラリを publish しているプロジェクトで、main へマージしたときに CI がなかなか終わらないことがありました。E2E テストが長いのだろうと思って見にいったら、時間を使っていたのは [changesets](https://github.com/changesets/changesets)[^changesets] で publish するジョブです。さらに中を開くと、pnpm のセットアップ step が 7 分かかっていました。

結論を先に書くと、`pnpm/action-setup` は pnpm v11 以降について公式が後継を案内しています。[pnpm/setup](https://github.com/pnpm/setup) に差し替えたところ、同じ step が数秒で終わるようになりました。

## 7 分かかっていた step

実際のログがこちらです。

```text
Running self-installer...

added 1 package in 7m

1 package is looking for funding
  run `npm fund` for details

Checking for updates...
Switching pnpm from v11.19.0 to v11.25.0...
Successfully updated pnpm to v11.25.0
Installation Completed!
```

`added 1 package in 7m` の 1 行が 7 分です。`pnpm setup` というコマンドが遅いわけではなく、action が pnpm を用意し終えるまでに 7 分かかっていました。

なお、この step の最後にはこんな警告も出ていました。

```text
[WARN] Detected a pnpm v10 installation layout at PNPM_HOME.
Run "pnpm setup" to migrate your PATH to the v11 layout.
```

pnpm v10 を使っていないのにこの警告が出るという報告が [action-setup の Issue #281](https://github.com/pnpm/action-setup/issues/281) に上がっていて、2026 年 9 月時点でまだ open です。この警告を見て workflow に `pnpm setup` を足す必要はありません。

## pnpm v11 以降は pnpm/setup が後継

ちょうど pnpm のメジャーバージョンが 11 に上がったというニュースを見ていたので、どうせバージョン周りだろうと予想がついていました。調べてみると、やはりその線でした。

`pnpm/action-setup` の README には、冒頭にこう書かれています。

> **This action has a successor: [`pnpm/setup`](https://github.com/pnpm/setup).**
>
> For pnpm v11 and newer, use [`pnpm/setup`](https://github.com/pnpm/setup) instead. It downloads pnpm's self-contained release binary (no Node.js or npm required) and can install a JavaScript runtime (Node.js, Bun, or Deno) in the same step, replacing `actions/setup-node`.

pnpm v10 以前は引き続き `pnpm/action-setup` を使い、v11 以降は `pnpm/setup` に移る、という切り分けです。`pnpm/setup` は Node.js も同じ step で入れられるので、`actions/setup-node` の step は削除できます。

一点だけ補足しておくと、私が観測したのは 7 分かかった 1 回だけで、毎回この時間になるのかまでは確認していません。「`pnpm/action-setup` は遅い」と言い切れる材料は持っていない、というのが正直なところです。ただ後継が案内されている以上、原因を掘り下げるより移行したほうが早いと判断しました。

## 移行前の構成

移行前はこんな形でした。

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10

- name: Setup Node.js
  uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
  with:
    node-version: "24"
    cache: "pnpm"
```

どこにでもある構成だと思います。同じ形を使っているなら、一度セットアップ step の所要時間をログで見てみてください。

## pnpm/setup への置き換え

置き換えるとこうなります。

```yaml
- name: Setup pnpm and Node.js
  uses: pnpm/setup@703c52620218391530e48b9e8870d5c0082e1b9b # v2.1.0
  with:
    runtime: node@24
    cache: true
```

`version` を書いていないことに気づいたでしょうか。`package.json` の `packageManager`(または `devEngines.packageManager`)に pnpm v11 以降が書いてあれば、[action.yml の記述](https://github.com/pnpm/setup/blob/main/action.yml)のとおりバージョンはそこから読まれます。宣言がない場合や pnpm v10 以前を指している場合は、`version: 11.25.0` のように明示してください。

```json
{
  "packageManager": "pnpm@11.25.0"
}
```

### install が二重に実行される場合

移行で唯一引っかかるのが `pnpm install` の扱いです。`pnpm/setup` は `package.json` があると、デフォルトで `pnpm install` まで実行します。`install` の既定値が `true` だからです。

そのため、これまで別の step で install を書いていた場合、素直に差し替えるだけでは install が 2 回走ります。

```diff
  - name: Setup pnpm and Node.js
    uses: pnpm/setup@703c52620218391530e48b9e8870d5c0082e1b9b # v2.1.0
    with:
      runtime: node@24
      cache: true
+     install: false

  - run: pnpm install --frozen-lockfile
```

install を action に任せてしまうなら、`--frozen-lockfile` 相当は `require-lockfile: true` で指定できます。逆に、install する step に環境変数を渡している場合は、action 側の install に環境変数を渡す口がないため `install: false` にして自前の step を残すほうが素直です。

```yaml
- name: Setup pnpm and Node.js
  uses: pnpm/setup@703c52620218391530e48b9e8870d5c0082e1b9b # v2.1.0
  with:
    runtime: node@24
    cache: true
    require-lockfile: true
```

## まとめ

- pnpm v11 以降を GitHub Actions で使うなら、公式が後継として案内している `pnpm/setup` に移行できる
- `pnpm/setup` は Node.js も同じ step で入れられるため、`actions/setup-node` の step は削除できる
- `package.json` の `packageManager` に pnpm v11 以降が書いてあれば `version` の指定は省略できる
- `pnpm/setup` は既定で `pnpm install` まで実行するため、別 step で install しているなら `install: false` を付ける
- CI が遅いときは、テストやビルドだけでなくセットアップ step の所要時間も一度見ておくと、思わぬところで時間を使っているのが見つかることがある

「CI が遅い」と感じたとき、私はテストを疑って終わっていました。今回は publish のジョブを開いたことでたまたま見つかりましたが、普段からセットアップ step の時間を見ていれば、もっと早く気づけたはずです。定番だと思って使い続けている action ほど、疑う機会がないのだと反省しています。

## 参考

https://github.com/pnpm/setup

https://github.com/pnpm/action-setup

https://github.com/pnpm/action-setup/issues/281

[^changesets]: モノレポでパッケージのバージョン更新とリリースを管理するツール。変更内容をマークダウンで記録しておくと、バージョンの繰り上げと CHANGELOG の生成、レジストリへの publish までをまとめて実行できる。

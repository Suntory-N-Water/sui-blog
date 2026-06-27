# Markdown 記法とサンプルコードの規約

このファイルは Markdown 表記、ツール固有の記法(GFM の `>[!NOTE]` など)、サンプルコードの品質基準を定める。
**「文体・構成」は扱わない**(それらは `voice-and-tone.md` / `writing-guidelines.md` 側にある)。

## 目次

- [コードブロック](#コードブロック)
- [画像と alt テキスト](#画像と-alt-テキスト)
- [注意喚起ブロックと textlint 回避](#注意喚起ブロックと-textlint-回避)
- [サンプルコードの品質と再現性](#サンプルコードの品質と再現性)

---

## コードブロック

### 言語指定は必須

すべてのコードブロックに言語指定(`js`, `ts`, `sh`, `diff`, `markdown` など)を行う。シンタックスハイライトの有無は読みやすさに直結するため例外を設けない。

````markdown
```ts
const greeting = "hello";
```
````

### 差分は `diff` 構文を使う

コードの差分(変更前後の対比、追加・削除)を示すときは `diff` 構文で `+` / `-` を明示する。

````markdown
```diff
- const oldValue = 1;
+ const newValue = 2;
```
````

NG / OK の対比でロジック全体を示すときは、TypeScript なら `// NG` / `// OK` のコメント区切りも併用してよい(`writing-guidelines.md` の「対比による説明」参照)。

## 画像と alt テキスト

### `image` / `screenshot` のような汎用語は禁止

Markdown の画像記法 `![代替テキスト](url)` の代替テキストは必須。`image`、`screenshot`、`figure` のような汎用語は使わない。**場面と目的を短く**説明する。

```markdown
❌ ![image](./pagefind.png)
❌ ![screenshot](./pagefind.png)
✅ ![Pagefind の検索結果一覧](./pagefind.png)
✅ ![Astro の View Transitions が発火する瞬間のフレーム](./transition.png)
```

スクリーンショットや図解は視覚的な理解を助けるため積極的に活用する。ただし alt テキストで「読者がその画像から何を読み取るべきか」を一言で表す。

## 注意喚起ブロックと textlint 回避

### `>[!CAUTION]` / `>[!NOTE]` で目立たせる

GitHub Flavored Markdown のアラート記法を使うと、注意点や補足情報を視覚的に区別できる。

```markdown
>[!CAUTION]
>本番環境では実行しないでください。

>[!NOTE]
>この挙動は v3 以降で変わりました。
```

### textlint の `no-unmatched-pair` を回避する

`>[!CAUTION]` の `[ ]` は textlint の `preset-ja-technical-writing/no-unmatched-pair` ルールでエラーになる。前後に無効化コメントを挟む。

````markdown
<!-- textlint-disable preset-ja-technical-writing/no-unmatched-pair -->
>[!CAUTION]
>注意事項...
<!-- textlint-enable preset-ja-technical-writing/no-unmatched-pair -->
````

複数のアラートが連続するときは、ブロックごとに enable/disable を挟むより、まとめて disable→enable で囲むほうが読みやすい。

## サンプルコードの品質と再現性

読者の学習体験を最大化するため、掲載するコードは以下の基準を満たすよう努める。

### 1. 再現性への配慮

- 読者が手元でコードを再現できるよう、関連するライブラリのバージョンや実行環境、前提となる設定などを明記する
- 可能であれば、完全なプロジェクトを GitHub リポジトリで公開し、リンクを記載することを推奨する

### 2. 可読性の追求

- 変数名や関数名は、その役割が理解しやすいように命名する
- 記事の本質と関係のない定型的なコードは適宜省略し、読者が最も重要なロジックに集中できるよう配慮する

### 3. セキュリティへの言及

- コード例がセキュリティ上の配慮(API キーの管理など)を必要とする場合、そのリスクと対策について注意喚起を行う
- ハードコードされた API キーや認証情報を含めない。`.env` ファイルや環境変数経由でのアクセスを示す

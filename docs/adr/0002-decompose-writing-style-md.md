# ADR 0002: writing-style.md を 3 スキルに分解する

## Status

Accepted

## Context

`contents/writing-style.md` は、ブログ執筆全体の指針を 1 ファイルで抱えてきた複合ドキュメントである。現在は次の 4 つの責務が同居している。

1. 論調の使い分け(硬め / ふわっと)と記事パターン分類(新仕様解説 / 既存技術活用 / Tips・調査)
2. コンテキストファースト / 共感と裏切り / SCQ + Deep Empathy 型の導入部設計
3. 詳細スタイルガイド(文体、語彙、コードブロック、画像 alt、注意喚起記法、サンプルコード品質)
4. AI 添削時の「地の文リスペクト」(口語表現を残し、過度に整理しない)

ADR 0001 でブログ系スキルを `blog-prewriting` / `blog-drafting` / `blog-revision` の 3 つに分割した。`writing-style.md` の各責務は明らかに別スキルに属しており、複合のまま残すと以下の不都合がある。

- スキル発火の判断材料(`SKILL.md` / `references/*`)から独立して存在するため、どのスキルがいつ参照すべきかが不明確
- `blog-drafting/references/voice-and-tone.md` / `writing-guidelines.md` と一部内容が重複しており、編集時に二重メンテになる
- `blog-revision/SKILL.md` の Step 2 と Error Handling に「writing-style.md 分解 ADR が確定するまで保留」と明記された未完成状態が残っている
- 旧コマンド `.claude/commands/article-structure-review.md` は `writing-style.md` を Read 指示するため、ファイルの去就が決まらないとコマンドの処遇も決まらない

### 解決したい課題

- `writing-style.md` の 4 責務をそれぞれどのスキルに移すかを確定したい
- `blog-drafting` 側の `voice-and-tone.md` / `writing-guidelines.md` との重複をどう解消するかを決めたい
- `.claude/commands/article-structure-review.md` の処遇(削除 / 残す / 統合先)を同時に決めたい
- `blog-revision/SKILL.md` の保留記述を解消できる状態にしたい

### blog-drafting との重複 diff

`writing-style.md` の (3) 詳細スタイルガイドと `blog-drafting/references/` の重なりを項目単位で評価した。

| writing-style.md の項目 | voice-and-tone.md | writing-guidelines.md | 扱い |
|------|---|---|---|
| ですます調、丁寧語 | 既に記載 | - | 重複。新規追記しない |
| 一人称「私」 | 既に記載 | - | 重複。新規追記しない |
| 主観/客観のトーン | 部分的に記載 | - | 重複。差分のみ追記 |
| 接続詞の使い分け | - | - | 新規。voice-and-tone.md に追記 |
| 一次ソースの重視 | - | - | 新規。writing-guidelines.md に追記(prose 系) |
| MECE と文末表現の変化 | - | - | 新規。writing-guidelines.md に追記(prose 系) |
| コードブロック(言語指定 / diff) | - | 末尾に断片あり | 新設 `markdown-conventions.md` に集約 |
| 画像 alt 規約(汎用語禁止) | - | - | 新設 `markdown-conventions.md` に集約 |
| `>[!CAUTION]` + textlint 回避 | - | - | 新設 `markdown-conventions.md` に集約 |
| サンプルコードの再現性 / セキュリティ | - | - | 新設 `markdown-conventions.md` に集約 |

新規追記項目は 7 件。うち「文体の延長」として既存ファイルに自然に吸収できる 3 件(接続詞 / 一次ソース / MECE と文末表現)は `voice-and-tone.md` / `writing-guidelines.md` に追記する。Markdown 記法・ツール固有の 4 件は責務が異なるため、新設 `markdown-conventions.md` に集約する。既存 `writing-guidelines.md` は「構造と表現(prose 寄り)」の責務に絞られており、Markdown 記法を混在させると discoverability が下がるためファイルを分離する。重複項目は記述を破棄して既存に寄せる。

### 検討した選択肢

- 選択肢 A: ADR 0001 のマッピングそのままに 4 つの新規 reference を作成し、ファイル単位で 1 対 1 に分ける
- 選択肢 B: スキル単位で reference をまとめ、`blog-drafting` の重複部分は既存ファイルに統合する
- 選択肢 C: `writing-style.md` をマスタードキュメントとして `contents/` 直下に残し、各スキルから参照させる
- 選択肢 D: 今は (4) だけ `blog-revision` に切り出し、(1)〜(3) は `writing-style.md` に残して再 ADR まで保留する

### 各選択肢の評価

| 観点 | A: 4 ファイル分割 | B: スキル単位統合 | C: マスター残置 | D: 段階移行 |
|------|---|---|---|---|
| ADR 0001 整合 | 高 | 高 | 低(責務が分かれない) | 中(保留が残る) |
| 重複解消 | 中(重複情報のまま分配) | 高(既存に統合) | 低 | 低 |
| スキル discoverability | 中(ファイル増で description 競合の懸念) | 高(必要最小数の reference) | 低 | 低 |
| 編集の二重メンテ | 中 | 低 | 高 | 高 |
| blog-revision 保留解消 | する | する | しない | しない |
| article-structure-review の処遇判断 | 別途必要 | 同時決定可能 | 残す前提 | 別途必要 |
| 移行コスト | 中 | 中 | 低(短期は楽) | 低 |

## Decision

**選択肢 B の改訂版を採用する。`writing-style.md` の 4 責務をスキル単位で再配置し、文体延長部分は `blog-drafting` の既存 reference に追記、Markdown 記法部分は新設 `markdown-conventions.md` に集約する。`writing-style.md` 本体と `article-structure-review.md` は削除する。**

### 1. 分解後のファイル配置

```text
.agents/skills/blog-prewriting/references/
  deep-thinking.md          (既存)
  structural-thinking.md    (既存)
  composition-strategy.md   (新設) ← (1) 論調・記事パターン + (2) SCQ + Deep Empathy / 共感と裏切り

.agents/skills/blog-drafting/references/
  voice-and-tone.md         (既存に追記: 接続詞)
  writing-guidelines.md     (既存に追記: 一次ソース、MECE と文末表現)
  markdown-conventions.md   (新設) ← 画像 alt、`>[!CAUTION]` + textlint 回避、コードブロック詳細、サンプルコード品質
  ai-police-checklist.md    (既存、変更なし)

.agents/skills/blog-revision/references/
  attention-writing.md      (既存)
  japanese-composition.md   (既存)
  voice-preservation.md     (新設) ← (4) AI 添削時の地の文リスペクト

contents/writing-style.md   (削除)
.claude/commands/article-structure-review.md  (削除)
```

### 2. 各 reference の役割

- `blog-prewriting/references/composition-strategy.md`
  - 論調(硬め / ふわっと)の判定基準と、新仕様解説 / 既存技術活用 / Tips・調査の 3 パターン分類
  - コンテキストファーストの原則、SCQ + Deep Empathy 構成、共感と裏切り、アンチパターン
  - `structural-thinking.md` Step 4「構成パターンを選ぶ」から呼び出す前提で書く
- `blog-drafting/references/voice-and-tone.md` への追記
  - 接続詞「しかし / そのため / 一方で」の使い分けだけを 1 セクション追加
- `blog-drafting/references/writing-guidelines.md` への追記
  - 一次ソース併記の原則(prose 寄りなので既存ファイルに追加)
  - MECE と文末表現の変化(箇条書きは語尾統一、通常文は同語尾 3 連続禁止)
- `blog-drafting/references/markdown-conventions.md`(新設)
  - 画像 alt の規約(汎用語禁止、場面と目的を短く)
  - `>[!CAUTION]` / `>[!NOTE]` と textlint `no-unmatched-pair` 回避コメント
  - コードブロックの言語指定と `diff` の使い分け詳細
  - サンプルコードの再現性、可読性、セキュリティ言及
- `blog-revision/references/voice-preservation.md`
  - 音声入力 / 地の文を扱うときの「最小限の修正」原則
  - 保持すべき口語表現と修正すべき誤字の境界(NG / OK 対比)
  - `blog-revision/SKILL.md` の Step 2 推敲モードから「依頼が貼り付け本文や音声入力ベースのとき」に呼び出す

### 3. blog-revision/SKILL.md の保留記述の解消

- Step 2.3 の「writing-style.md の分解 ADR が確定するまで保留」を削除し、`blog-prewriting/references/composition-strategy.md` を参照する記述に置き換える
- Error Handling の同趣旨の記述も置き換える
- 推敲モード Step 2 から、貼り付け本文 / 音声入力ベースのときに `voice-preservation.md` を呼び出すフックを追加する

### 4. article-structure-review.md の処遇

- コマンド本体は削除する
- コマンドが担っていた「コンテキストファースト視点での構成レビュー」は `blog-prewriting` の下書き再構成ワークフロー(`structural-thinking.md` Step 1〜6)と `composition-strategy.md` の組み合わせで代替できる
- 旧コマンドの呼び出しパターン(「この記事の構成をレビューして」「コンテキストファーストに沿っているか見て」)は `blog-prewriting` の description で受けられるよう、必要なら frontmatter にトリガー語を追記する

### 5. 選択理由

- ADR 0001 のスキル分割原則を完全に守れる
- `blog-drafting` 側の追記は文体延長部分のみに絞り、Markdown 記法は新設 `markdown-conventions.md` に独立配置することで、既存 reference の責務(prose 系)を保ちながら discoverability を高められる
- `blog-prewriting` / `blog-revision` には新規 reference が 1 つずつ、`blog-drafting` には 1 つだけ追加され、`SKILL.md` の手順は既存の Step 流れの中で参照できる
- `blog-revision/SKILL.md` の保留状態を、本 ADR の決定と同タイミングで解消できる
- `article-structure-review.md` の責務が `blog-prewriting` の既存ワークフローと重複しているため、削除しても機能損失が起きない

## Consequences

### Positive

- スキル発火の判断材料が `SKILL.md` と `references/*` に閉じる
- `blog-drafting` の重複が解消され、文体ガイドが 1 か所(`voice-and-tone.md` + `writing-guidelines.md`)に集約される
- `blog-revision/SKILL.md` の保留記述が消え、推敲モードのパイプラインが完結する
- `article-structure-review.md` 削除で、`writing-style.md` への依存が無くなる

### Negative

- `composition-strategy.md` と `structural-thinking.md` の境界が紛らわしくなる可能性がある
  - → `structural-thinking.md` Step 4 で `composition-strategy.md` を読む明示的なフックを置く。`composition-strategy.md` は「型と論調判定」だけを担い、構成設計の手順は持たせない
- `voice-and-tone.md` / `writing-guidelines.md` の追記で 1 ファイルあたりの行数が増える(Markdown 記法分は `markdown-conventions.md` 分離で軽減済み)
  - → 既存の目次セクションに新セクションを足し、見出し階層は H2 を維持する
- `blog-drafting/references/` のファイル数が 3 から 4 に増える
  - → ファイル名で責務が即わかる(`voice-and-tone` / `writing-guidelines` / `markdown-conventions` / `ai-police-checklist`)ため、`SKILL.md` 側で「Markdown 表記の判断は markdown-conventions.md を読む」と明示すれば discoverability は維持できる

### Risks

- 旧 `writing-style.md` を直接 Read していた既存のユーザー操作(手打ちで `contents/writing-style.md` を読み込ませる癖など)が破綻する
  - → 削除コミットメッセージで移行先を明示する
- `article-structure-review.md` の呼び出し癖が残っているユーザーがいる場合、削除直後はコマンド未定義エラーになる
  - → `blog-prewriting` の description に「記事の構成をレビュー」相当のトリガー語を含めることでスキル経由で受けられるようにする
- `composition-strategy.md` を構成設計の手順書と取り違える誤読が起きうる
  - → ファイル冒頭に「このファイルは型と判定の参照だけを持ち、手順は `structural-thinking.md` 側にある」と明記する

## 決めていないこと

| 項目 | 決めない理由 | いつ決めるか |
|------|------------|------------|
| `composition-strategy.md` から `structural-thinking.md` への逆方向リンクを張るか | 双方向リンクは循環参照とメンテコストを増やす。一方向で運用し、問題が出てから検討する | 実運用で「構成設計中に論調を見失う」事例が観測されたとき |
| 旧コマンドのトリガー語を `blog-prewriting` の description にどこまで追加するか | 過剰追記は誤発火を増やすため、最小限から始めたい | `article-structure-review.md` 削除後、構成レビュー依頼が `blog-prewriting` で正しく発火するか実観測してから |

## Notes

### 移行手順

1. `composition-strategy.md` を新規作成し、`writing-style.md` の (1)(2) を移植する
2. `voice-preservation.md` を新規作成し、`writing-style.md` の (4) を移植する
3. `markdown-conventions.md` を新規作成し、(3) のうち Markdown 記法系 4 項目を移植する
4. `voice-and-tone.md` に接続詞セクションを追記する
5. `writing-guidelines.md` に「一次ソース」「MECE と文末表現」を追記する
6. `blog-revision/SKILL.md` Step 2.3 と Error Handling の保留記述を更新し、`voice-preservation.md` 呼び出しフックを追加する
7. `blog-prewriting/SKILL.md` の構成設計ワークフローに `composition-strategy.md` 参照を追加する
8. `contents/writing-style.md` と `.claude/commands/article-structure-review.md` を削除する

### 参考資料

- ADR 0001: ブログ系スキルの粒度を執筆フェーズ単位で分割する (`docs/adr/0001-define-blog-skill-granularity.md`)
- `contents/writing-style.md`(削除予定の旧マスタードキュメント)
- `.claude/commands/article-structure-review.md`(削除予定の旧コマンド)
- `.agents/skills/blog-prewriting/SKILL.md`
- `.agents/skills/blog-drafting/SKILL.md`
- `.agents/skills/blog-revision/SKILL.md`

# ADR 0001: ブログ系スキルの粒度を執筆フェーズ単位で分割する

## Status

承認済み

## Context

このリポジトリでは、Codex/Claude 系エージェント向けの個人用スキルを `.agents/skills/` 配下で管理している。現状のブログ系スキルは、執筆前の思考整理、本文執筆、文体調整、AI 生成文の人間化、読み進めやすさの推敲といった複数の責務が近接しており、どのスキルを発火させるべきかが曖昧になりやすい。

特に、エージェントスキルは `SKILL.md` の frontmatter にある `name` と `description` をもとに発火候補が選ばれる。そのため、1 つのスキルに責務を詰め込みすぎると誤発火しやすくなる。一方で、役割を細かく分けすぎると、似た説明文を持つスキルが増え、かえって競合しやすくなる。

今回の判断では、以下のブログ執筆フェーズをどう束ねるかが争点になった。

### 解決したい課題

- 執筆前のテーマ整理、思考深化、構成設計をどこまで 1 スキルに含めるかを決めたい
- 実際の本文執筆と、筆者らしい文体への寄せをどこで扱うかを明確にしたい
- 執筆後の推敲、AI っぽさの除去、校正観点の確認、次の 1 文を読みたくなる推敲を、どの粒度で統合するかを決めたい
- スキルの discoverability を維持しつつ、`SKILL.md` を過度に肥大化させない運用にしたい

### 検討した選択肢

- 選択肢 A: ブログ執筆全体を 1 つの巨大スキルに統合する
- 選択肢 B: 執筆前、執筆中、執筆後をそれぞれ独立したスキルに分け、曖昧依頼用に router を 1 つ追加する
- 選択肢 C: 推敲工程をさらに細分化し、冗長性削除、校正、アテンションライティング適用などを別スキルに分割する

### 各選択肢の評価

| 観点 | 選択肢 A: 1 巨大スキル | 選択肢 B: 3 フェーズ + router | 選択肢 C: 細粒度分割 |
|------|-------------------------|-------------------------------|----------------------|
| discoverability | 低い。説明文が広くなり誤発火しやすい | 高い。意図ごとに説明を書き分けやすい | 中。説明差分を保つのが難しい |
| context の lean さ | 低い。`SKILL.md` が肥大化しやすい | 高い。高レベル手順を分散できる | 中。各 skill は軽いが総数が増える |
| router との相性 | 低い。router 不要だが曖昧性を吸収できない | 高い。曖昧依頼だけ router で受けられる | 中。router が複雑化しやすい |
| 運用コスト | 中。一見少ないが修正影響範囲が広い | 中。責務ごとの更新で済む | 高い。 frontmatter と境界管理が増える |
| ユーザー意図との整合 | 低い。執筆前と推敲後が混ざる | 高い。状態遷移ごとに責務を切れる | 中。明示依頼には強いが通常依頼では過剰 |

## Decision

**ブログ系スキルは、「執筆前」「執筆中」「執筆後」の 3 つの実作業スキルに分ける。将来的に複数スキルが揃った段階で、必要なら曖昧な依頼を受ける router スキルを追加する。**

### 1. 採用する粒度

最終的な責務の分割先として、以下の 3 区分を採用する。

```text
blog-prewriting    -> テーマ整理、思考深化、構成設計
blog-drafting      -> 構成案をもとにした本文執筆、筆者らしい文体への寄せ
blog-revision      -> 推敲、冗長性削除、AI っぽさの除去、校正観点確認、読了率を上げる改善
```

### 2. 各スキルに含める責務

- `blog-prewriting`
  - テーマの明確化
  - 読者定義
  - 核心メッセージの抽出
  - 構成設計
  - 既存の `deep-thinking` と `structural-thinking` は、このスキル内部の分岐として扱う

- `blog-drafting`
  - 構成案から本文を書く
  - 筆者らしい文体、価値観、技術ブログとしての語り口へ寄せる
  - 旧 `writing-me-like-blogs` の新規執筆責務を吸収する

- `blog-revision`
  - 既存草稿の改善のみを扱う
  - AI 生成文の冗長さ除去
  - 校正観点の確認
  - 次の 1 文を読みたくなる流れへの推敲
  - 現時点では旧 `attention-writing` の内容を移設する
  - 将来的には既存の `.claude/skills/` や `.claude/agents/` 配下にある一部の関連 skill / subagent を統合候補として扱う可能性がある
  - どの責務を統合するかは自動で決めず、ユーザーの指示に従って判断する

### 3. router を追加する条件

router は、`blog-drafting` と `blog-revision` が実装され、複数の完成済み skill に対して曖昧な依頼を振り分ける必要が生じた時点でのみ追加する。追加する場合も、実作業を大量に抱えず、分類責務だけを持たせる。

```text
"ブログのネタを考えたい"           -> blog-prewriting
"この構成で記事を書いて"           -> blog-drafting
"この下書きを読まれる形に直して"   -> blog-revision
"ブログを書きたい"                 -> router が状況を見て分類
```

### 4. 選択理由

- スキルの発火は frontmatter 依存であるため、「ユーザー意図 + 成果物の状態遷移」で切ると説明文を最適化しやすい
- 執筆前の `deep-thinking` と `structural-thinking` は、同じ意図の中の分岐であり、別トップレベル skill にする必要が薄い
- 推敲工程は複数の技法を含むが、いずれも `draft -> revised draft` という同じ状態遷移に属するため、トップレベルでは 1 つに束ねる方がよい
- router は複数の完成済み skill が揃ってから追加した方が、progressive disclosure と lean context の原則に沿いやすい

### 5. 実装時の原則

- `mgechev/skills-best-practices` に合わせて、公開する skill 名は完成済みのディレクトリ名と一致させる
- 既存 skill の移行では、本文や reference の内容を勝手に再設計せず、まず既存内容を保持したまま移設する
- `.claude/skills/` や `.claude/agents/` 配下にある既存資産を統合候補として扱う場合も、自動では統合せず、ユーザーの指示に従って判断する
- router は追加しない。完成済み skill だけを公開し、未完成の責務や存在しない skill 名を `SKILL.md` に書かない
- 旧 skill 名を残すと discoverability が競合するため、統合が終わった旧 skill は削除する

## Consequences

### Positive

- 各 skill の `description` を狭く保てるため、誤発火が減りやすい
- `SKILL.md` の責務を限定しやすく、保守時に影響範囲を絞れる
- 執筆前、執筆中、執筆後のどの段階を支援する skill かが明確になる
- 明示依頼は個別 skill が直接受けられる
- 公開 skill 名が `blog-prewriting` / `blog-drafting` / `blog-revision` に揃い、旧名称との競合がなくなる

### Negative

- skill 数が増えるため、命名と説明文の整合を継続的に管理する必要がある
  - → frontmatter レベルで trigger / non-trigger の検証を行う
- 旧 skill 名を参照していた運用メモや個人の癖が残っていると、移行直後は名前の揺れが起こる
  - → ADR と `.claude/skills/` のリンクを新名称へ揃え、旧 skill は残さない

### Risks

- `blog-drafting` と `blog-revision` の境界が曖昧な説明文だと競合する
  - → `draft from outline` と `revise existing draft` の違いを frontmatter に明示する
- `blog-revision` に統合候補を広く見積もりすぎると、どの責務まで含むのかが曖昧になる
  - → 現時点では `attention-writing` の移設に留め、追加統合はユーザーの明示指示がある場合だけ判断する
- router を早すぎる段階で追加すると、存在しない skill への分岐や未完成の責務を書いてしまう
  - → router は複数の完成済み skill が揃うまで作らない

## Notes

### 現在の実装状況

- `blog-prewriting` を追加し、執筆前の思考深化と構成設計を移植済み
- `blog-drafting` を追加し、旧 `writing-me-like-blogs` を本文・reference を含めて移設済み
- `blog-revision` を追加し、旧 `attention-writing` を本文を保持したまま移設済み
- `.claude/skills/` や `.claude/agents/` 配下の関連資産は、現時点では自動統合せず、将来の統合候補として扱う
- `.claude/skills/blog-prewriting` / `.claude/skills/blog-drafting` / `.claude/skills/blog-revision` のシンボリックリンクを配置する
- `writing-me-like-blogs` と `attention-writing` は discoverability 競合を避けるため削除する
- router は未作成のままとし、存在しない skill 名は公開しない

### 次のタスク

1. `blog-drafting` と `blog-revision` の frontmatter について trigger / non-trigger の検証を実施する
2. `blog-revision` に追加で統合したい既存 skill / subagent が出てきた場合は、ユーザー指示に従って統合可否を判断する
3. 実運用で曖昧依頼が十分に多いと分かった場合のみ、完成済み skill だけを振り分け先に持つ router を再検討する

### 参考資料

- `mgechev/skills-best-practices`
- `.agents/skills/blog-prewriting/SKILL.md`
- `.agents/skills/blog-drafting/SKILL.md`
- `.agents/skills/blog-revision/SKILL.md`

---
allowed_tools: Read(*.md), Edit(*.md)
description: "記事のクイズを作成する"
---

`contents/blog/$ARGUMENTS.md` の内容を元にクイズを作成し、ファイルのYAMLフロントマター `selfAssessment` に追加してください。

## 出力形式

```yaml
selfAssessment:
  quizzes:
    - question: "クイズの問題文"
      answers:
        - text: "選択肢1"
          correct: true
          explanation: "正解の理由"
        - text: "選択肢2"
          correct: false
          explanation: "不正解の理由"
        - text: "選択肢3"
          correct: false
          explanation: null
        - text: "選択肢4"
          correct: false
          explanation: null
```

## クイズ作成の指針

- 記事の核心的な内容を理解しているか確認する問題を作成する
- 各クイズには4つの選択肢を用意する
- 正解は1つのみ
- `explanation`は正解の場合は理由を記述、不正解の場合は任意(重要な誤解を解く場合のみ記述)
- 問題数は記事の長さに応じて1〜3問程度

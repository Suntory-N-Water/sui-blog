---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# TypeScript/React コーディング規約

## 型定義
- `interface` ではなく `type` を使用する
- Props の型名は `ComponentNameProps` とする(例: `type HeaderProps = { ... }`)
- `any` は使用禁止。
- 定数オブジェクトには `as const` を付与する

## 関数
- if 文には必ずブロック `{}` を使用する
- パラメータの再代入は禁止
- 関数の引数が 2 つ以上の場合はオブジェクト形式で受け取る
- export する関数・型には JSDoc コメントを記述する

## import
- `@/` エイリアスで `src/` 配下を参照する(例: `import { cn } from '@/lib/utils'`)
- 型のみの import には `import type` を使用する

## React コンポーネント
- クライアントディレクティブの使い分け:
  - `client:load`: すぐに必要な UI(ヘッダー、モーダル)
  - `client:visible`: スクロールで表示されるコンポーネント
  - `client:idle`: 優先度の低いコンポーネント
- UI コンポーネントは `src/components/ui/` の shadcn/ui パターンに従う
- クラス名の結合には `cn()` ユーティリティを使用する(`src/lib/utils.ts`)

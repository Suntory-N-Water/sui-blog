---
description: ビルドエラーから未実装のアイコンを抽出し、icon-config.tsに追加します
argument-hint: [error log]
---

# 目的
提供されたエラーログ（$ARGUMENTS）を解析し、不足しているアイコン定義を `src/components/feature/diagram/icon-config.ts` に追加してください。

# 手順

1.  **抽出**: `$ARGUMENTS` 内のテキストから `received 'xxx'` パターンを検索し、アイコン名（例: `brain`, `sparkles`）を抽出してください。
2.  **変換**: アイコン名をキャメルケースから PascalCase に変換し、Lucideコンポーネント名を決定してください。
    * 基本ルール: `alert` -> `AlertCircle`, `checkSquare` -> `CheckSquare` 等、Lucideの標準的な命名規則に従ってください。
3.  **編集**: `src/components/feature/diagram/icon-config.ts` **のみ**を編集してください。

# 編集ルール（重要）

以下の3箇所すべてに対し、**アルファベット順**を維持して挿入してください。

### 1. インポート定義
`lucide-react` からのインポートに追加してください。
```typescript
import {
  Activity,
  AlertCircle,
  Brain,        // アルファベット順に挿入
  Sparkles,     // アルファベット順に挿入
} from 'lucide-react';
```

### 2. ICON_NAMES 配列
`as const` 配列に追加してください。
```typescript
export const ICON_NAMES = [
  'activity',
  'alert',
  'brain',      // アルファベット順に挿入
  'sparkles',   // アルファベット順に挿入
] as const;
```

### 3. ICON_MAP オブジェクト
`ICON_NAMES` と同じ順序（アルファベット順）でマッピングを追加してください。
```typescript
export const ICON_MAP: Record<IconName, LucideIcon> = {
  activity: Activity,
  alert: AlertCircle,
  brain: Brain,        // 追加
  sparkles: Sparkles,  // 追加
};
```

# エラーログ入力値
$ARGUMENTS
# Design System

## Design Philosophy

**静かな技術書斎** — 読者がコードと文章に没入できる、余計な装飾のない空間。

4 つの原則:

1. **読書体験最優先** — 文字・コードが主役。デザインは「存在を消せるか」で評価する
2. **抑制された色彩** — Primary カラーは最重要アクションのみに使う。配色でリッチさを演出しない
3. **ダークモード対等** — ライト/ダーク は後付けではなく、両方を同等の品質で設計する
4. **マイクロアニメーション限定** — ホバーの色変化・カードのわずかなリフトのみ許可。視線を奪う演出は使わない

---

## Overview

日本語の個人技術ブログ。クリーンでミニマルな読書体験を重視したデザイン。
ライトモードとダークモードの両方をサポートし、コードと文章を美しく並置する。

情報密度を適度に保ちつつ、読者が記事に集中できる落ち着いたトーン。
プライマリカラーはライトモードでディープネイビー、ダークモードでスカイブルーと切り替わり、
コンテキストに応じて主役を張る。

## Colors

### Light Mode

- **Primary** (`hsl(214 100% 27%)` ~ `#003D8A`): CTA、アクティブ状態、リンク、主要なインタラクティブ要素
- **Accent** (`hsl(199 100% 78%)` ~ `#7ADEFF`): フォーカスリング、ハイライト、装飾的アクセント
- **Background** (`hsl(0 0% 98%)` ~ `#FAFAFA`): ページ背景
- **Foreground** (`hsl(0 0% 20%)` ~ `#333333`): 主要テキスト
- **Card** (`hsl(0 0% 100%)` = `#FFFFFF`): カード背景
- **Secondary** (`hsl(220 14% 96%)` ~ `#F1F3F7`): バッジ、セカンダリ背景
- **Muted** (`hsl(220 14% 96%)` ~ `#F1F3F7`): ミュートされた背景
- **Muted-foreground** (`hsl(0 0% 35%)` ~ `#595959`): 補助テキスト、日付、メタ情報
- **Border** (`hsl(0 0% 86%)` ~ `#DBDBDB`): 境界線
- **Destructive** (`hsl(0 84% 60%)` ~ `#F04A44`): エラー、削除操作

### Dark Mode

- **Primary** (`hsl(199 100% 78%)` ~ `#7ADEFF`): CTA、アクティブ状態(ライトモードの Accent と同色になる)
- **Accent** (`hsl(199 100% 78%)` ~ `#7ADEFF`): フォーカスリング
- **Background** (`hsl(0 0% 12%)` ~ `#1F1F1F`): ページ背景
- **Foreground** (`hsl(0 0% 95%)` ~ `#F2F2F2`): 主要テキスト
- **Card** (`hsl(0 0% 15%)` ~ `#262626`): カード背景
- **Secondary** (`hsl(0 0% 20%)` ~ `#333333`): セカンダリ背景
- **Muted** (`hsl(0 0% 20%)` ~ `#333333`): ミュートされた背景
- **Muted-foreground** (`hsl(0 0% 70%)` ~ `#B3B3B3`): 補助テキスト
- **Border** (`hsl(0 0% 28%)` ~ `#474747`): 境界線

### Special

- **Code block background** (light: `#111A1F`, dark: `#151A1E`): コードブロック専用の深い暗色背景
- **Twitter brand** (`#1DA1F2`): Twitter/X のブランドカラー

## Typography

- **UI / 本文フォント**: Noto Sans JP(Google Fonts, `sans-serif`)
- **コード / モノスペース**: PlemolJP35Console(カスタム woff2), `monospace`

見出しはすべて `font-semibold`、`tracking-tight`。
本文・リスト項目は `line-height: 2`(ゆったり)、`letter-spacing: 0.16px`。

### スケール

| 役割 | サイズ | ウェイト |
|---|---|---|
| H1 | `text-3xl` (md: `text-4xl`) | semi-bold |
| H2 | `text-2xl` (md: `text-3xl`) | semi-bold |
| H3 | `text-xl` | semi-bold |
| H4 | `text-lg` | semi-bold |
| Body | `text-base` | regular |
| Small / Meta | `text-sm` | regular |
| Label / Badge | `text-xs` | medium |

### Markdown 見出し装飾

- `h2::before { content: "## " }` — プレフィックスを `muted-foreground/60` で表示
- `h3::before { content: "### " }` — 同上

## Elevation

シャドウは最小限。深さはボーダーと背景色のコントラストで表現する。

- **デフォルト状態**: `shadow-sm`(ごく薄い影)
- **ホバー状態**: `shadow-md`
- **フッター**: `backdrop-blur-lg` + `bg-background/80`(半透明ブラー)
- **画像ズームオーバーレイ**: `bg-black/80` + `backdrop-blur(4px)`

## Border Radius

- **Base (`--radius`)**: `0.5rem` = 8px — ボタン、入力フィールド
- **`-md`**: `calc(0.5rem - 2px)` ~ 6px
- **`-sm`**: `calc(0.5rem - 4px)` ~ 4px
- **`-lg`**: `0.5rem` = 8px — コードブロック、カード内要素
- **カード**: `rounded-xl` = 12px — ブログカードなど大きいコンテナ
- **バッジ・ソーシャルリンク**: `rounded-full`

## Components

### Buttons

- 角丸: `rounded-md` (8px)
- サイズ: default `h-10 px-4 py-2`、sm `h-9 px-3`、lg `h-11 px-8`、icon `size-10`
- バリアント:
  - `default`: primary 背景 + primary-foreground テキスト、ホバーで `bg-primary/70`
  - `outline`: 1px border-input、ホバーで accent 背景
  - `secondary`: secondary 背景、ホバーで `bg-secondary/80`
  - `ghost`: 背景なし、ホバーで accent 背景
  - `link`: primary テキスト、ホバーでアンダーライン
- フォーカス: `ring-2 ring-ring ring-offset-2`

### Cards (ブログカード)

- 角丸: `rounded-xl`
- ボーダー: `border border-border`
- 背景: `bg-card`
- シャドウ: `shadow-sm`
- ホバー: `-translate-y-1`、`shadow-md`、`border-primary/50`
- トランジション: `duration-300`
- アスペクト比サムネイル: `aspect-video`、グラデーション背景 (`from-secondary to-background`)
- アイコンエリア: ホバーで `scale-110`、`duration-500`

### Badges

- 角丸: `rounded-full`
- サイズ: `text-xs`, `px-2 py-0.5`
- バリアント: default(primary)、secondary(薄いグレー)、outline、destructive

### Links(マークダウン内)

- カラー: `text-primary`
- 装飾: `decoration-primary/30`、`underline-offset-4`
- ホバー: `text-primary/80`、`underline`、`decoration-primary/50`

### Inline Code

- 背景: `bg-muted/50`
- ボーダー: `ring-1 ring-border/50`
- 角丸: `rounded`
- パディング: `px-[0.3rem] py-[0.2rem]`
- フォント: `font-mono text-sm font-medium`

### Code Blocks

- 背景: `--code-block-bg`(light: `#111A1F`, dark: `#151A1E`)
- 角丸: `rounded-lg`
- ボーダー: `border border-border/50`
- タイトルバー: `bg-muted/50`、上側にのみ角丸

### Alerts / Callouts (GFM Alerts)

カラーコーディングされた 5 種類:

| 種類 | ライト | ダーク |
|---|---|---|
| Note | `border-blue-400 bg-blue-100` | `border-blue-700 bg-blue-950/40` |
| Tip | `border-green-400 bg-green-100` | `border-green-800 bg-green-950/40` |
| Important | `border-purple-400 bg-purple-100` | `border-purple-800 bg-purple-950/40` |
| Warning | `border-amber-400 bg-amber-100` | `border-amber-800 bg-amber-950/40` |
| Caution | `border-red-400 bg-red-100` | `border-red-800 bg-red-950/40` |

### Social Links (Footer)

- サイズ: `size-10`, `rounded-full`
- ボーダー: `border border-border/50`
- 背景: `bg-secondary/30`
- ホバー: `border-primary/50`、`bg-primary/10`、`text-primary`、`shadow-lg shadow-primary/20`

### Navigation Header

- 背景: `bg-background/80` + `backdrop-blur`
- ボーダー: `border-b border-border/40`

## Layout

- **コンテンツ最大幅**: `max-w-6xl` (1152px)
- **コンテナ最大幅 (2xl)**: 1400px
- **メインパディング**: `px-4` / sm: `px-6` / md: `px-8`、`py-12`

## Effects & Animation

### 設計意図

アニメーションは**機能的な目的がある場合のみ**使用する。リッチさの演出・視線を引くための装飾的エフェクトは使用しない。

### 使用するエフェクト

- `transition-colors` — hover 時の色変化(`duration-200` 〜 `duration-300`)
- `transition-all duration-300` — カードのホバーリフト(`-translate-y-1`)
- `transition-transform duration-500` — カードサムネイル内アイコンのスケール(`scale-110`)
- View Transitions API — ページ遷移(Astro の `<ClientRouter />`)
- `backdrop-blur` — 画像ズームモーダルのオーバーレイ(機能的用途のみ)
- `animation: image-zoom-fade-in` — 画像ズーム時のフェードイン(`opacity` + `scale(0.95→1)`)
- `prefers-reduced-motion` の考慮 — 将来的にアニメーションを追加する場合は必須で対応する

### 使用しないエフェクト

- **Glassmorphism** — `backdrop-blur` をカードやヘッダーの通常背景に使わない(フッターの `backdrop-blur-lg` は既存仕様として例外)
- **グラデーション背景** — カードや UI 要素の通常背景にグラデーションを使わない(サムネイルの `bg-linear-to-br` はアイコン表示用の機能的用途として例外)
- **パルス・点滅** — 機能的理由のない `animate-pulse` は使わない
- **常時ループアニメーション** — 視線を継続的に奪うアニメーションは使わない
- **`transition-all`** — 対象を限定せず全プロパティをトランジションさせない。`transition-colors`, `transition-transform` など対象を明示する

---

## Accessibility

### 設計意図

アクセシビリティは後付けではなく、**可読性・発見可能性・キーボード操作を保証するための設計制約**として扱う。

### Interactive States

- hover だけで状態差を表現しない。`focus-visible`、`aria-current` にも視覚的差分を用意する
- フォーカスリングは `ring-2 ring-ring ring-offset-2` で統一する(`*:focus-visible` にグローバル適用済み)
- `outline: none` で消す場合は、同等以上に明確な代替フォーカス表現を必須とする
- 現在地を示すナビゲーション要素は色だけでなく、線・背景・ウェイトのいずれかと組み合わせる

### 操作対象のサイズ

- ボタン・アイコンボタン・ページネーションのクリック可能領域は **44 × 44 CSS px 以上**を目安にする
- 小さなアイコン単体を押させず、`padding` を含めた操作領域で確保する

### ラベルとセマンティクス

- アイコンのみのボタンには `aria-label` を必須とする(例: `<span class="sr-only">Twitter</span>` で代替も可)
- ページ内の `#main-content` へのスキップリンクは `BaseLayout.astro` に実装済み

### Color & Contrast

- 本文・UI テキストは WCAG AA(4.5:1)を満たすコントラストを前提に配色する
- 状態変化を色だけで伝えない。選択中・エラー・現在地には border、underline、icon、文言のいずれかを併用する

---

## z-index Layering

| Layer | 役割 | 推奨値 |
|---|---|---|
| Base | 通常の本文、カード、画像 | `auto` / `z-0` |
| Raised | カード内の重なり、補助装飾 | `z-10` |
| Sticky | sticky header など常時前面のナビゲーション | `z-40` |
| Overlay | モーダル backdrop、scrim | `z-50` |
| Dialog | モーダル本体、画像ズーム | `z-50`(現在 `image-zoom-dialog` で使用)|
| Ephemeral | toast, tooltip など一時表示 | `z-70` |

- 新たに `z-[9999]` のような ad-hoc な値を追加しない
- `transform`, `filter`, `opacity`, `isolation` は新たな stacking context を生成するため、子要素の重なり順への影響を確認する

---

## Scope Exceptions

以下のページはデザインシステムの**適用対象外**のスタンドアロンページ。

- `src/pages/recap/2025.astro`

年次 Recap ページは独自のビジュアルテーマを持ち、グローバルの Header/Footer とは独立したレイアウトで表示される。このデザインシステムのカラー・タイポグラフィ規約はこれらのページには適用しない。

---

## Do's and Don'ts

- Do: ライトモードでは primary(ネイビー)を最重要アクションのみに使う
- Do: ホバーエフェクトには `transition-all duration-300` を基本とする
- Do: フォーカス状態は必ず `ring-2 ring-ring ring-offset-2` で視覚的に示す
- Do: カードにはホバー時の `hover:-translate-y-1` マイクロアニメーションを付ける
- Don't: ボタンやカードで `rounded-full` と `rounded-md` を混在させない
- Don't: 本文に 2 種類以上のフォントウェイトを同一画面で多用しない
- Don't: シャドウを多用せず、境界線と背景色のコントラストで奥行きを表現する
- Don't: コードブロック専用の暗色背景(`--code-block-bg`)を他の用途に流用しない

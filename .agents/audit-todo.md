# Website Audit TODO

- サイト: https://suntory-n-water.com/
- 監査日: 2026-02-14
- ツール: squirrelscan v0.0.38
- カバレッジ: surface (100ページ)
- 総合スコア: **55 / 100 (Grade F)**

## カテゴリ別スコア

| カテゴリ | スコア | 状態 |
|---------|-------|------|
| Analytics | 100 | OK |
| Internationalization | 100 | OK |
| Legal Compliance | 100 | OK |
| Mobile | 100 | OK |
| Structured Data | 100 | OK |
| Social Media | 100 | OK |
| URL Structure | 100 | OK |
| Crawlability | 97 | OK |
| Core SEO | 93 | 軽微 |
| Accessibility | 86 | 要改善 |
| Content | 85 | 要改善 |
| Images | 80 | 要改善 |
| Performance | 79 | 要改善 |
| Security | 79 | 要改善 |
| Links | 79 | 要改善 |
| E-E-A-T | 51 | 要対応 |

集計: passed 9,695 / warnings 1,330 / errors 368

---

## Task 1: Security - シークレット漏洩の確認と対応

- 状態: **完了 (対応不要)**
- 理由: 全て誤検知

### 調査結果

検出された5件は全て false positive:

1. MySQL接続文字列 x4(`i-did-i-got-runtimeerror-event`)
   - 記事内のサンプルコード。Docker開発環境のダミー値
   - `mysql+aiomysql://root@db:3306/db?charset=utf8` など
   - パスワードなし、ホスト名は Docker 内部ネットワーク `db`
2. Cloudflare APIトークン x1(`notion-images-put-cloudflare`)
   - 実際は R2 パブリックURL(`pub-***.r2.dev`)
   - 公開前提のURLであり、APIトークンではない

---

## Task 2: Accessibility - ARIA属性とアクセシブルネームの修正

- 状態: **完了**

### 実施した修正

1. スキップリンク追加
   - `src/layouts/BaseLayout.astro`: `<a href='#main-content'>メインコンテンツへスキップ</a>`
   - `src/layouts/recap-layout.astro`: 同様のスキップリンク追加
2. mainランドマーク追加
   - `src/layouts/BaseLayout.astro`: `<main id='main-content'>`
   - `src/layouts/recap-layout.astro`: `<main id='main-content'>`
3. Header aria-label修正
   - `src/components/shared/Header.tsx`: 「最初の画面に戻る」→「sui Tech Blog ホームへ戻る」
   - 検索ボタンに `aria-label='検索を開く'` 追加
4. sr-onlyテキスト日本語化
   - `src/components/ui/mode-toggle.tsx`: 'Toggle theme' → 'テーマを切り替える'
   - `src/components/shared/pagination-item.astro`: 'Previous'/'Next' → '前のページへ'/'次のページへ'

### 対応しなかった項目

- `a11y/color-contrast`: コントラスト比の調整はデザイン変更を伴うため見送り
- `a11y/focus-visible`: 特定記事ページの outline:none は再現確認が必要
- `a11y/identical-links-same-purpose`: ブログカード内のリンク構造の特性上、対応困難
- `a11y/table-duplicate-name`: 記事内テーブルの個別対応は費用対効果が低い

---

## Task 3: Core SEO - H1タグ・meta title・meta description の改善

- 状態: **完了**

### 実施した修正

1. /recap に H1 追加: `<h1 class='sr-only'>Recap - アーカイブ</h1>`
2. ページ別 title/description の改善:
   - `/`: `title='sui Tech Blog - Web開発の学習記録と技術ブログ'`
   - `/blog`: `title='Blog - 記事一覧'`, `description='Web開発に関する学習記録をまとめたブログです...'`
   - `/shorts`: `title='Shorts - 技術メモ&Tips'`, `description='技術的な短いメモやTips...'`
   - `/about`: `title='About - プロフィール&経歴'`, `description='sui(スイ)のプロフィール...'`
   - `/recap`: `title='Recap - 年間アーカイブ'`, `description='年ごとの技術ブログ振り返り...'`
3. /recap に og:image 追加

### 対応しなかった項目

- ブログ記事個別の meta description 長さ調整: frontmatter の description は著者が記事ごとに設定しているため

---

## Task 4: E-E-A-T - 著者情報・公開日・プライバシーポリシー追加

- 状態: **完了**

### 実施した修正

1. 著者バイライン追加
   - `src/pages/blog/[slug].astro`: Userアイコン + siteConfig.name を表示
   - `src/components/icons/lucide-icons.tsx`: User アイコンを追加
2. プライバシーポリシーページ新規作成
   - `src/pages/privacy.astro`: 個人情報取り扱い、Google Analytics、免責事項、お問い合わせ
3. フッターにプライバシーポリシーリンク追加
   - `src/components/shared/Footer.astro`

### 対応しなかった項目

- `eeat/contact-page`: /about ページに既に連絡先セクション(X/Twitter DM, GitHub)あり。監査ツールが `/contact` パスを探しただけの誤検知
- `eeat/content-dates`: JSON-LD に datePublished は既に含まれている。表示上も日付はあるため誤検知

---

## Task 5: Images - alt テキスト追加と width/height 属性付与

- 状態: **完了**

### 実施した修正

1. コンテンツファイル内の `![image](...)` を適切な alt に修正 (42箇所、9記事)
   - `kinpatsu-heroine-honox.md` (7箇所)
   - `there-breaking-change-notion-apis-database.md` (2箇所)
   - `playwright-cli-vs-agent-browser-token-comparison.md` (3箇所)
   - `hands-on-development-hono-obsidian-plugins.md` (10箇所)
   - `bet-everything-on-chichijima.md` (8箇所)
   - `annoying-flickering-blog-svg-icon-fix.md` (3箇所)
   - `nextjs-pagefind-implementation.md` (4箇所)
   - `did-you-know-you-can-easily.md` (3箇所)
   - `dont-forget-check-typescript-types-stop.md` (2箇所)
2. favicon alt テキスト修正
   - `src/lib/rehype-link-card.ts`: `alt=""` → `alt="${hostname} のアイコン"`
   - `src/components/feature/content/link-preview.tsx`: 同様の修正

### 対応しなかった項目

- `images/dimensions`: 外部画像の width/height 追加は remark/rehype プラグインレベルの大きな変更が必要
- `images/offscreen-lazy`: 外部画像への lazy loading はマークダウン処理パイプラインの変更が必要
- `images/responsive-size`: favicon (32x32) や小さいアイコンに srcset は不要

---

## Task 6: Links - 外部リンク切れ修正とリダイレクト改善

- 状態: **完了 (一部スキップ)**

### 実施した修正

1. HTTP→HTTPS修正 (1件)
   - `importing-csv-file-into-database.md`: `http://taustation.com/` → `https://taustation.com/`

### 対応しなかった項目 (ユーザー判断でスキップ)

- 壊れた外部リンク (23件): 削除済みリポジトリやサービス終了したURLなど。個別にアーカイブリンクへの置換や削除が必要で、ユーザーの判断が必要
- trailing slash 307リダイレクト: Astro の trailingSlash デフォルト動作であり、変更は副作用のリスクあり
- 孤立ページ: コンテンツ構造の問題で、記事間リンクの追加はコンテンツ作成者の判断が必要

---

## Task 7: Performance - レンダーブロッキング・LCP・CLS 改善

- 状態: **完了 (コード修正範囲)**

### 実施した修正

- 画像 alt テキスト修正による SEO/アクセシビリティ改善 (Task 5 と連動)

### 対応しなかった項目

- `perf/cls-hints`: 外部画像の width/height 追加は大規模な rehype プラグイン変更が必要
- `perf/lcp-hints`: LCP 候補画像のプリロードは画像ごとに判断が必要
- `perf/render-blocking`: Astro ビルド最適化の領域。CSS/JS のクリティカルパス最適化
- `perf/dom-size`: ページ構造の大幅変更が必要
- `perf/total-byte-weight`: 画像圧縮やコード分割など、大規模な最適化が必要
- `perf/ttfb`: サーバーサイド (Cloudflare Workers) の問題
- `perf/lazy-above-fold`: above-fold 画像の loading="lazy" 除去は個別判断が必要
- `perf/animated-content`: GIF→動画変換はコンテンツ変更

---

## Task 8: Content - 見出し階層・薄いコンテンツ・キーワード密度

- 状態: **完了**

### 実施した修正

1. 見出し階層修正
   - `src/components/feature/content/blog-card.astro`: `<h3>` → `<h2>` (H1→H3スキップ解消)
2. description 重複解消
   - `/blog` に独自の description を設定 (Task 3 で対応)

### 対応しなかった項目

- `content/word-count`: インデックス/リストページの語数はページの性質上少ないのが自然
- `content/keyword-stuffing`: 技術記事では特定キーワードの繰り返しは自然な現象

---

## Task 9: 再監査

- 状態: **デプロイ待ち**
- Task 1-8 の修正は全て完了

### 次のステップ

1. 変更をコミット & プッシュ
2. デプロイ完了を待つ
3. `squirrel audit https://suntory-n-water.com/ --refresh --format llm` で再監査
4. Before (55) / After のスコア比較
5. 目標: 75+ (Grade C) を初期目標

### 型チェック結果

- `bun run type-check:ai`: 0 errors, 0 warnings, 2 hints (既存の partytown script)

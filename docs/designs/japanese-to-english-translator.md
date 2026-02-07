# 日本語→英語翻訳機能の設計書

## 概要

Shortsのタイトルを日本語から英語に翻訳してスラグ化する。
`api-translator`依存を削除し、Playwrightで直接Google翻訳を操作。

## 要件

- **入力**: 日本語文字列(Shortsのタイトル、短文)
- **出力**: 英語翻訳 → スラグ化
- **制約**: 日本語→英語のみ、配列・長文対応不要

## 実装

```typescript
#!/usr/bin/env bun

import { chromium } from 'playwright';

async function translateToSlug(japaneseTitle: string): Promise<string> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto('https://translate.google.com/?sl=ja&tl=en&op=translate');

    await page.fill('textarea[jsname="BJE2fc"]', japaneseTitle);

    await page.waitForResponse(r => r.url().includes('_/TranslateWebserverUi'));
    await page.waitForResponse(r => r.url().includes('/log?format=json'));
    await page.waitForTimeout(500);

    const translated = await page.locator('span[jsname="jqKxS"]').innerText();

    // スラグ化
    const slug = translated
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-+|-+$/g, '');

    return slug;
  } finally {
    await browser.close();
  }
}

// CLI
const title = process.argv.slice(2).join(' ');
console.log(await translateToSlug(title));
```

## CI/CD統合

### GitHub Actionsワークフロー

`.github/workflows/create-short.yml`でのPlaywrightセットアップ：

```yaml
- name: Get Playwright version
  id: playwright-version
  run: echo "version=$(node -p \"require('./package.json').devDependencies.playwright\")" >> "$GITHUB_OUTPUT"

- name: Cache Playwright browsers
  uses: actions/cache@v5
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}
    restore-keys: |
      playwright-${{ runner.os }}-

- name: Install Playwright browsers
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: bunx --bun playwright install --with-deps chromium

- name: Install Playwright system dependencies
  if: steps.playwright-cache.outputs.cache-hit == 'true'
  run: bunx --bun playwright install-deps chromium
```

**参考**: `.github/workflows/deploy.yml`の実装パターン(49-55行目)

### ローカル開発

```bash
# Chromiumブラウザのインストール(初回のみ)
bunx playwright install chromium

# テスト実行
bun run scripts/translate-title-to-slug.ts "テストタイトル"
```

## 移行内容

- `api-translator`, `puppeteer`を削除
- `PUPPETEER_ARGS`環境変数削除
- `scripts/translate-title-to-slug.ts`を完全に書き換え

## 実装手順

1. `scripts/translate-title-to-slug.ts`書き換え
2. `package.json`から`api-translator`, `puppeteer`削除(`playwright`は既存)
3. `.github/workflows/create-short.yml`のPuppeteerキャッシュ→Playwrightに変更
4. ローカルテスト(`bunx playwright install chromium`してから)
5. CIテスト
6. コミット履歴をsquash

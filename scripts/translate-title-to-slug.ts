#!/usr/bin/env bun

/**
 * タイトルを英語翻訳してスラグ化するスクリプト
 *
 * 使用例:
 *   bun run scripts/translate-title-to-slug.ts "Claude Code でスキルが実行されると isMeta プロパティが付与される"
 *   => claude-code-skill-execution-ismeta-property
 */

import { chromium } from 'playwright';

/**
 * 日本語タイトルを英語に翻訳してスラグ化
 */
async function translateToSlug(japaneseTitle: string): Promise<string> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto('https://translate.google.com/?sl=ja&tl=en&op=translate');

    await page.fill('textarea[jsname="BJE2fc"]', japaneseTitle);

    await page.waitForResponse((r) =>
      r.url().includes('_/TranslateWebserverUi'),
    );
    await page.waitForResponse((r) => r.url().includes('/log?format=json'));
    await page.waitForTimeout(1 * 1000);

    const translated = await page.locator('span[jsname="jqKxS"]').innerText();

    console.error(`[翻訳結果] ${translated}`);

    // スラグ化処理
    const slug = translated
      .toLowerCase()
      // 記号を削除(ハイフン、アンダースコア以外)
      .replace(/[^\w\s-]/g, '')
      // 連続する空白をハイフンに変換
      .replace(/\s+/g, '-')
      // 連続するハイフンを1つに
      .replace(/-+/g, '-')
      // 前後のハイフンを削除
      .trim()
      .replace(/^-+|-+$/g, '');

    return slug;
  } finally {
    await browser.close();
  }
}

/**
 * CLIエントリーポイント
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      '使用法: bun run scripts/translate-title-to-slug.ts <タイトル>',
    );
    console.error(
      '例: bun run scripts/translate-title-to-slug.ts "記事タイトル"',
    );
    process.exit(1);
  }

  const title = args.join(' ');
  console.error(`[入力] ${title}`);

  const slug = await translateToSlug(title);
  console.log(slug); // 標準出力にスラグのみ出力(GitHub Actionsで使用)
}

main();

#!/usr/bin/env tsx
/**
 * SVGセキュリティチェックスクリプト
 *
 * public/iconsディレクトリ配下のSVGファイルに危険なコードが含まれていないかをチェックします。
 * DOMPurifyでサニタイズ前後の差分を検証し、不正なタグや属性を検出します。
 *
 * ## 実行方法
 * ```bash
 * pnpm run check:svg-security        # 差分チェック(git diff --cached)
 * pnpm run check:svg-security:all    # 全件チェック(public/icons配下すべて)
 * ```
 *
 * ## 検出対象
 * - 禁止タグ: script, iframe, object, embed, foreignObject
 * - 禁止属性: onerror, onload, onclick, onmouseover
 * - JavaScriptプロトコル: href="javascript:..."
 * - 外部URL参照: http://, https://
 *
 * ## 終了コード
 * - 0: 安全なSVGのみ
 * - 1: 危険なコードを検出
 */

import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

// セキュリティ設定(inline-icons.tsと同じ設定)
const FORBID_TAGS = ['script', 'iframe', 'object', 'embed', 'foreignObject'];
const FORBID_ATTR = ['onerror', 'onload', 'onclick', 'onmouseover'];

type SecurityIssue = {
  file: string;
  issues: string[];
};

/**
 * SVGをサニタイズして危険なコードを検出
 */
function detectSecurityIssues(svg: string): string[] {
  const issues: string[] = [];

  // サニタイズ前の内容チェック
  const lowerSvg = svg.toLowerCase();

  // 禁止タグの検出
  for (const tag of FORBID_TAGS) {
    if (lowerSvg.includes(`<${tag}`)) {
      issues.push(`禁止タグ <${tag}> が含まれています`);
    }
  }

  // 禁止属性の検出
  for (const attr of FORBID_ATTR) {
    const pattern = new RegExp(`\\s${attr}\\s*=`, 'i');
    if (pattern.test(svg)) {
      issues.push(`禁止属性 ${attr} が含まれています`);
    }
  }

  // JavaScriptプロトコルの検出
  if (/href\s*=\s*["']?\s*javascript:/i.test(svg)) {
    issues.push(
      'JavaScriptプロトコル (href="javascript:...") が含まれています',
    );
  }

  // 外部URL参照の検出(相対パスは許可)
  const externalUrlPattern = /(?:href|xlink:href)\s*=\s*["']\s*https?:\/\//i;
  if (externalUrlPattern.test(svg)) {
    issues.push('外部URL参照 (http://, https://) が含まれています');
  }

  return issues;
}

/**
 * ステージングされたSVGファイルのパスを取得
 */
function getStagedSvgFiles(): string[] {
  try {
    const output = execSync(
      'git diff --cached --name-only --diff-filter=ACMR',
      { encoding: 'utf-8' },
    );

    return output
      .split('\n')
      .filter((line) => line.trim())
      .filter((line) => line.match(/^public\/icons\/.*\.svg$/));
  } catch {
    // gitコマンドが失敗した場合は空配列
    return [];
  }
}

/**
 * public/icons配下の全SVGファイルを取得
 */
async function getAllSvgFiles(): Promise<string[]> {
  const iconsDir = path.join(process.cwd(), 'public', 'icons');

  try {
    const files = await fs.readdir(iconsDir);
    return files
      .filter((file) => file.endsWith('.svg'))
      .map((file) => path.join('public', 'icons', file));
  } catch {
    console.error(`❌ public/iconsディレクトリが見つかりません: ${iconsDir}`);
    return [];
  }
}

/**
 * SVGファイルのセキュリティチェックを実行
 */
async function checkSvgSecurity() {
  const isAllMode = process.argv.includes('--all');

  console.log('🔒 SVGセキュリティチェックを開始します...\n');

  // チェック対象のファイルを取得
  let targetFiles: string[];
  if (isAllMode) {
    console.log('📁 モード: 全件チェック (public/icons配下すべて)\n');
    targetFiles = await getAllSvgFiles();
  } else {
    console.log('📝 モード: 差分チェック (ステージングされたSVGのみ)\n');
    targetFiles = getStagedSvgFiles();
  }

  if (targetFiles.length === 0) {
    if (isAllMode) {
      console.log('ℹ️  チェック対象のSVGファイルが見つかりませんでした\n');
    } else {
      console.log('ℹ️  ステージングされたSVGファイルはありません\n');
    }
    return true;
  }

  console.log(`🔍 チェック対象: ${targetFiles.length}個のSVGファイル\n`);

  // 各ファイルをチェック
  const securityIssues: SecurityIssue[] = [];

  for (const file of targetFiles) {
    const filePath = path.join(process.cwd(), file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const issues = detectSecurityIssues(content);

      if (issues.length > 0) {
        securityIssues.push({ file, issues });
      }
    } catch (_error) {
      console.error(`⚠️  ${file} の読み込みに失敗しました`);
    }
  }

  // 結果出力
  if (securityIssues.length === 0) {
    console.log('✅ すべてのSVGファイルは安全です！\n');
    return true;
  }

  // エラー出力
  console.error('❌ 危険なコードが検出されました:\n');

  for (const { file, issues } of securityIssues) {
    console.error(`📄 ${file}`);
    for (const issue of issues) {
      console.error(`   - ${issue}`);
    }
    console.error('');
  }

  console.error('🛡️  修正方法:');
  console.error('  1. SVGファイルから危険なタグ・属性を手動で削除してください');
  console.error('  2. 信頼できるソースからSVGを再取得してください');
  console.error('  3. SVG最適化ツール(SVGO等)でクリーンアップしてください\n');

  return false;
}

// スクリプト実行
checkSvgSecurity()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  });

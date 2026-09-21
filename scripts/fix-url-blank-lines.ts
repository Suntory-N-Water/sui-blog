/**
 * URL前後の空行自動修正スクリプト
 *
 * ブログ記事内のURLで前後に空行がないケースを自動修正します。
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

const BLOG_DIR = path.join(process.cwd(), 'contents', 'blog');
const URL_PATTERN = /^https?:\/\/.+$/;

type FixReport = {
  file: string;
  fixedCount: number;
  changes: Array<{
    lineNumber: number;
    url: string;
    action: string;
  }>;
};

/**
 * Markdownファイルを修正
 */
async function fixMarkdownFile(
  filePath: string,
  dryRun = true,
): Promise<FixReport> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  const newLines: string[] = [];
  const changes: FixReport['changes'] = [];
  let fixedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // URLのみの行を検出
    if (URL_PATTERN.test(trimmedLine)) {
      const previousLine = i > 0 ? lines[i - 1] : undefined;
      const nextLine = i < lines.length - 1 ? lines[i + 1] : undefined;

      const hasPreviousBlankLine =
        i === 0 || (previousLine !== undefined && previousLine.trim() === '');
      const hasNextBlankLine =
        i === lines.length - 1 ||
        (nextLine !== undefined && nextLine.trim() === '');

      let action = '';

      // 前に空行がない場合
      if (!hasPreviousBlankLine) {
        // コードブロック内でないことを確認
        const isInCodeBlock =
          previousLine !== undefined &&
          (previousLine.trim().startsWith('```') ||
            previousLine.trim() === '```');

        if (!isInCodeBlock) {
          newLines.push('');
          action += '前に空行追加 ';
          fixedCount++;
        }
      }

      // URL行を追加
      newLines.push(line);

      // 後に空行がない場合
      if (!hasNextBlankLine) {
        // コードブロック内でないことを確認
        const isInCodeBlock =
          nextLine !== undefined &&
          (nextLine.trim().startsWith('```') || nextLine.trim() === '```');

        if (!isInCodeBlock) {
          newLines.push('');
          action += '後に空行追加';
          fixedCount++;
        }
      }

      if (action) {
        changes.push({
          lineNumber: i + 1,
          url: trimmedLine,
          action: action.trim(),
        });
      }
    } else {
      newLines.push(line);
    }
  }

  // ファイルに書き込み(dryRunでない場合)
  if (!dryRun && fixedCount > 0) {
    await fs.writeFile(filePath, newLines.join('\n'), 'utf-8');
  }

  return {
    file: path.basename(filePath),
    fixedCount,
    changes,
  };
}

/**
 * すべてのMarkdownファイルを修正
 */
async function fixAllBlogPosts(dryRun = true) {
  const files = await fs.readdir(BLOG_DIR);
  const markdownFiles = files.filter((file) => file.endsWith('.md'));

  const reports: FixReport[] = [];
  let totalFixed = 0;

  for (const file of markdownFiles) {
    const filePath = path.join(BLOG_DIR, file);
    const report = await fixMarkdownFile(filePath, dryRun);
    if (report.fixedCount > 0) {
      reports.push(report);
      totalFixed += report.fixedCount;
    }
  }

  return { reports, totalFixed };
}

/**
 * レポートを出力
 */
function printReport(
  reports: FixReport[],
  totalFixed: number,
  dryRun: boolean,
) {
  console.log('='.repeat(80));
  console.log(dryRun ? 'URL空行修正プレビュー(Dry Run)' : 'URL空行修正結果');
  console.log('='.repeat(80));
  console.log();

  if (reports.length === 0) {
    console.log('✅ 修正不要: すべてのURLに前後の空行があります');
    return;
  }

  console.log(`📝 修正対象: ${reports.length}ファイル、${totalFixed}箇所\n`);

  for (const report of reports) {
    console.log(`\n📄 ${report.file}`);
    console.log('-'.repeat(80));

    for (const change of report.changes) {
      console.log(`  行 ${change.lineNumber}: ${change.url}`);
      console.log(`  🔧 ${change.action}`);
    }
  }

  console.log('\n'.repeat(2));
  console.log('='.repeat(80));

  if (dryRun) {
    console.log('実際に修正するには、以下のコマンドを実行してください：');
    console.log();
    console.log(
      '  pnpm exec node --experimental-strip-types scripts/fix-url-blank-lines.ts --apply',
    );
    console.log();
  } else {
    console.log('✅ 修正完了！');
    console.log();
  }
}

// コマンドライン引数を解析
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

// 実行
fixAllBlogPosts(dryRun)
  .then(({ reports, totalFixed }) => printReport(reports, totalFixed, dryRun))
  .catch(console.error);

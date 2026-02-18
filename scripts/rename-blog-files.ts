import { readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import matter from 'gray-matter';

const BLOG_DIR = 'contents/blog';

/**
 * ブログファイル名を yyyy-mm-dd_slug.md 形式にリネームし、
 * フロントマターに slug フィールドを追加するスクリプト
 */
function renameBlogFiles() {
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));

  console.log(`Found ${files.length} blog files\n`);

  files.forEach((filename) => {
    const filePath = join(BLOG_DIR, filename);
    const content = readFileSync(filePath, 'utf-8');

    // フロントマターをパース
    const { data, content: markdownContent } = matter(content);

    // 現在のslug(拡張子なしのファイル名)
    const currentSlug = basename(filename, '.md');

    // dateフィールドを取得
    const date = data.date;
    if (!date) {
      console.error(`❌ ${filename}: date field is missing`);
      return;
    }

    // dateをyyyy-mm-dd形式に変換
    const dateObj = new Date(date);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    // 新しいファイル名
    const newFilename = `${dateStr}_${currentSlug}.md`;
    const newFilePath = join(BLOG_DIR, newFilename);

    // フロントマターにslugフィールドを追加
    const updatedData = {
      ...data,
      slug: currentSlug,
    };

    // フロントマターを再構築
    const updatedContent = matter.stringify(markdownContent, updatedData);

    // ファイル名が変わる場合のみリネーム
    if (filename !== newFilename) {
      writeFileSync(filePath, updatedContent, 'utf-8');
      renameSync(filePath, newFilePath);
      console.log(`✅ ${filename} → ${newFilename}`);
    } else {
      // ファイル名が同じ場合でもフロントマターは更新
      writeFileSync(filePath, updatedContent, 'utf-8');
      console.log(`✅ ${filename} (slug added)`);
    }
  });

  console.log(`\n✨ All ${files.length} files processed`);
}

renameBlogFiles();

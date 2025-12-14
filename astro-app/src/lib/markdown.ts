import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { getTagNameFromSlug, getTagSlug } from '@/config/tag-slugs';
import type { Frontmatter, MarkdownData } from '@/types/markdown';
import type { SelfAssessmentData } from '@/types/self-assessment';

const blogDir = path.join(process.cwd(), '..', 'contents', 'blog');

/**
 * ブログ記事の型定義
 *
 * MarkdownDataを拡張し、ブログ記事固有のメタデータを含みます。
 */
export type BlogPost = MarkdownData<{
  /** サムネイル画像のURL */
  thumbnail?: string;
  /** 記事に付与されたタグの配列 */
  tags?: string[];
  /** 記事のアイコン(絵文字またはURL) */
  icon?: string;
  /** 絵文字変換後のアイコンURL(FluentUI Emoji) */
  icon_url?: string;
  /** 記事の理解度チェック用クイズ */
  selfAssessment?: SelfAssessmentData;
}>;

/**
 * 全ブログ記事を日付降順で取得する
 *
 * contents/blog ディレクトリ配下のすべてのMarkdownファイルを読み込み、
 * 日付が新しい順にソートして返します。
 *
 * @returns ブログ記事の配列(日付降順)
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const posts = await getMarkdownData(blogDir);
  return posts.sort(
    (a, b) =>
      new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime(),
  );
}

/**
 * 指定されたタグslugに一致するブログ記事を取得する
 *
 * タグslugからタグ名を逆引きし、そのタグを持つ記事のみをフィルタリングして返します。
 * タグslugが存在しない場合は空配列を返します。
 *
 * @param tagSlug - 検索対象のタグslug(例: 'nextjs', 'typescript')
 * @returns 指定されたタグを持つブログ記事の配列(日付降順)
 */
export async function getBlogPostsByTagSlug(
  tagSlug: string,
): Promise<BlogPost[]> {
  const tagName = getTagNameFromSlug(tagSlug);

  if (!tagName) {
    return [];
  }

  const posts = await getAllBlogPosts();
  return posts.filter((post) => post.metadata.tags?.includes(tagName));
}

/**
 * 全ブログ記事で使用されているタグ名を取得する
 *
 * すべてのブログ記事のメタデータからタグを抽出し、
 * 重複を排除したタグ名の配列を返します。
 *
 * @returns 使用されているタグ名の配列(重複なし)
 */
export async function getAllTags(): Promise<string[]> {
  const posts = await getAllBlogPosts();
  const tags = posts.flatMap((post) => post.metadata.tags ?? []);
  return [...new Set(tags)];
}

/**
 * 全ブログ記事から使用されているタグのslugを取得する
 *
 * すべてのブログ記事のタグをslug形式に変換し、
 * 重複を排除したslug配列を返します。
 * タグページのルーティングやナビゲーション生成に使用されます。
 *
 * @returns タグslugの配列(重複なし)
 */
export async function getAllTagSlugs(): Promise<string[]> {
  const posts = await getAllBlogPosts();
  const tagNames = posts.flatMap((post) => post.metadata.tags ?? []);
  const uniqueTagNames = [...new Set(tagNames)];

  // タグ名をslugに変換(重複排除のため再度Set化)
  const slugs = uniqueTagNames.map(getTagSlug);
  return [...new Set(slugs)];
}

/**
 * 指定されたslugに一致するブログ記事を取得する
 *
 * ブログ記事のslugから単一の記事を検索して返します。
 * 一致する記事がない場合はundefinedを返します。
 *
 * @param slug - 検索対象の記事slug(例: 'add-blog-to-portfolio')
 * @returns 一致したブログ記事、または見つからない場合はundefined
 */
export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | undefined> {
  const posts = await getAllBlogPosts();
  return posts.find((post) => post.slug === slug);
}

/**
 * 指定されたディレクトリ配下のMarkdownファイルをすべて読み込む(内部関数)
 *
 * @template T - メタデータの型
 * @param dir - Markdownファイルが格納されているディレクトリパス
 * @returns MarkdownDataの配列
 */
async function getMarkdownData<T>(dir: string): Promise<MarkdownData<T>[]> {
  const files = await getMarkdownFiles(dir);
  return Promise.all(
    files.map((file) => readMarkdownFile<T>(path.join(dir, file))),
  );
}

/**
 * 指定されたディレクトリ配下の.mdファイルを取得する(内部関数)
 *
 * @param dir - 検索対象のディレクトリパス
 * @returns .mdファイル名の配列
 */
async function getMarkdownFiles(dir: string): Promise<string[]> {
  return (await fs.readdir(dir)).filter((file) => path.extname(file) === '.md');
}

/**
 * Markdownファイルを読み込んでパースする(内部関数)
 *
 * Markdownファイルのfrontmatterとコンテンツを解析し、
 * slugはfrontmatterのslugフィールドを優先し、
 * なければファイル名から抽出します。
 *
 * @template T - メタデータの型
 * @param filePath - 読み込むMarkdownファイルのパス
 * @returns パースされたMarkdownデータ(メタデータ、slug、本文、ファイルパス)
 */
async function readMarkdownFile<T>(filePath: string): Promise<MarkdownData<T>> {
  const rawContent = await fs.readFile(filePath, 'utf-8');
  const { data, content } = matter(rawContent);
  const relativePath = path.relative(process.cwd(), filePath);

  // フロントマターにslugフィールドがあればそれを使用、なければファイル名から抽出
  const slug = (data as Record<string, unknown>).slug as string | undefined;
  const filenameSlug = path.basename(filePath, path.extname(filePath));

  return {
    metadata: data as Frontmatter<T>,
    slug: slug ?? filenameSlug,
    rawContent: content,
    filePath: relativePath,
  };
}

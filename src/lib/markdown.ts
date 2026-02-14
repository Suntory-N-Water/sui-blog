import type { CollectionEntry } from 'astro:content';
import { getCollection, getEntry } from 'astro:content';
import { getTagNameFromSlug, getTagSlug } from '@/config/tag-slugs';

/**
 * Content CollectionsのBlogPost型
 */
export type BlogPost = CollectionEntry<'blog'>;

/**
 * 全ブログ記事を日付降順で取得する
 *
 * Content Collectionsを使用して効率的に記事を取得します。
 * Astroが自動でキャッシュと最適化を行います。
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog');
  return posts.sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
  );
}

/**
 * 指定されたタグslugに一致するブログ記事を取得する
 */
export async function getBlogPostsByTagSlug(tagSlug: string) {
  const tagName = getTagNameFromSlug(tagSlug);

  if (!tagName) {
    return [];
  }

  const posts = await getAllBlogPosts();
  return posts.filter((post) => post.data.tags?.includes(tagName));
}

/**
 * 全ブログ記事で使用されているタグ名を取得する
 */
export async function getAllTags(): Promise<string[]> {
  const posts = await getAllBlogPosts();
  const tags = posts.flatMap((post) => post.data.tags ?? []);
  return [...new Set(tags)];
}

/**
 * 全ブログ記事から使用されているタグのslugを取得する
 */
export async function getAllTagSlugs(): Promise<string[]> {
  const posts = await getAllBlogPosts();
  const tagNames = posts.flatMap((post) => post.data.tags ?? []);
  const uniqueTagNames = [...new Set(tagNames)];

  const slugs = uniqueTagNames.map(getTagSlug);
  return [...new Set(slugs)];
}

/**
 * 指定されたslugに一致するブログ記事を取得する
 */
export async function getBlogPostBySlug(slug: string) {
  return await getEntry('blog', slug);
}

/**
 * Markdown本文から読了時間(分)を計算する
 *
 * 散文以外のコンテンツ(コードブロック、インラインコード、HTMLタグ等)を除外し、
 * 日本語の平均読書速度(1分あたり650文字)で計算する。
 */
export function calculateReadingTime(body: string | undefined): number {
  const CHARS_PER_MINUTE_JA = 650;
  const readableText = (body ?? '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\[\^[^\]]+\]/g, '')
    .replace(/^\[\^[^\]]+\]:.*$/gm, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\n{2,}/g, '\n');
  const charCount = readableText.trim().length;
  return Math.max(1, Math.round(charCount / CHARS_PER_MINUTE_JA));
}

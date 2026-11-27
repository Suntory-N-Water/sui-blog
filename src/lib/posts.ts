import { type CollectionEntry, getCollection } from 'astro:content';
import { assertUniqueTagSlugs, type Tag, toTags } from './tags';

export type Post = CollectionEntry<'posts'>;

export const PER_PAGE = 10;
export const HOME_POST_LIMIT = 6;
const CHARS_PER_MINUTE_JA = 650;

let postsPromise: Promise<Post[]> | undefined;

export function getPosts(): Promise<Post[]> {
  postsPromise ??= getCollection('posts').then((posts) => {
    assertUniqueTagSlugs(posts.flatMap((post) => post.data.tags));
    return posts.sort(
      (a, b) => b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id),
    );
  });
  return postsPromise;
}

export function postTags(post: Post): Tag[] {
  return toTags(post.data.tags);
}

export function updatedAt(post: Post): Date {
  return post.data.modified_time ?? post.data.date;
}

export function postPath(post: Post): string {
  return `/posts/${post.id}`;
}

export type TagSummary = Tag & { count: number };

export function summarizeTags(posts: Post[]): TagSummary[] {
  const summaries = new Map<string, TagSummary>();
  for (const post of posts) {
    for (const tag of postTags(post)) {
      const summary = summaries.get(tag.slug) ?? { ...tag, count: 0 };
      summary.count += 1;
      summaries.set(tag.slug, summary);
    }
  }
  return [...summaries.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ja'),
  );
}

export function readingMinutes(body: string | undefined): number {
  const readableText = (body ?? '')
    .replace(/<details>[\s\S]*?<\/details>/gu, '')
    .replace(/```[\s\S]*?```/gu, '')
    .replace(/`[^`]+`/gu, '')
    .replace(/\[([^\]]*)\]\([^)]+\)/gu, '$1')
    .replace(/<[^>]+>/gu, '')
    .replace(/^\[\^[^\]]+\]:.*$/gmu, '')
    .replace(/\[\^[^\]]+\]/gu, '')
    .replace(/^#+\s*/gmu, '')
    .replace(/\n{2,}/gu, '\n');
  return Math.max(1, Math.round(readableText.trim().length / CHARS_PER_MINUTE_JA));
}

export function relatedPosts(current: Post, posts: Post[], count: number): Post[] {
  const documentFrequency = new Map<string, number>();
  for (const post of posts) {
    for (const tag of new Set(post.data.tags)) {
      documentFrequency.set(tag, (documentFrequency.get(tag) ?? 0) + 1);
    }
  }

  const weightsOf = (tags: string[]) => {
    const weights = new Map<string, number>();
    for (const tag of new Set(tags)) {
      const df = documentFrequency.get(tag) ?? 0;
      weights.set(tag, Math.log((posts.length + 1) / (df + 1)) + 1);
    }
    const norm = Math.hypot(...weights.values());
    if (norm > 0) {
      for (const [tag, weight] of weights) {
        weights.set(tag, weight / norm);
      }
    }
    return weights;
  };

  const currentWeights = weightsOf(current.data.tags);
  return posts
    .filter((post) => post.id !== current.id)
    .map((post) => {
      let similarity = 0;
      for (const [tag, weight] of weightsOf(post.data.tags)) {
        similarity += weight * (currentWeights.get(tag) ?? 0);
      }
      return { post, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, count)
    .map(({ post }) => post);
}

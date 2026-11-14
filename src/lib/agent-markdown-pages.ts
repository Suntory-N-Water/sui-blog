import type { APIContext } from 'astro';
import { getEmDashCollection, getSiteSettings } from 'emdash';
import {
  frontmatter,
  latestDate,
  type MarkdownPage,
  postListItem,
  siteOrigin,
  toDateString,
  usageLines,
} from './agent-markdown';
import { asPost } from './emdash-types';
import { portableTextToMarkdown } from './portable-text-markdown';
import { resolveBlogSiteIdentity } from '../utils/site-identity';

type PageContext = Pick<APIContext, 'site' | 'url' | 'cache'>;

export const HOME_POST_LIMIT = 6;
const ALL_POSTS_LIMIT = 1000;

type ListedPostEntry = Parameters<typeof postListItem>[1] & { data: { updatedAt?: Date } };

export async function homeMarkdown({ site, url, cache }: PageContext): Promise<MarkdownPage> {
  const [{ entries: posts, cacheHint }, settings] = await Promise.all([
    getEmDashCollection('posts', {
      orderBy: { created_at: 'desc' },
      limit: HOME_POST_LIMIT,
    }),
    getSiteSettings(),
  ]);
  if (cache.enabled) {
    cache.set(cacheHint);
  }
  return buildHomeMarkdown({ site, url }, resolveBlogSiteIdentity(settings), posts);
}

export function buildHomeMarkdown(
  { site, url }: Pick<PageContext, 'site' | 'url'>,
  { siteTitle, siteTagline }: { siteTitle: string; siteTagline: string },
  posts: ListedPostEntry[],
): MarkdownPage {
  const origin = siteOrigin(site, url);
  const canonical = `${origin}/`;

  const head = frontmatter({
    title: siteTitle,
    description: siteTagline,
    canonical,
    'last-updated': toDateString(latestDate(posts.map((post) => post.data.updatedAt))),
  });
  const recentPosts =
    posts.length > 0
      ? ['## 最近の記事', '', ...posts.map((post) => postListItem(origin, post)), '']
      : [];
  const lines = [
    `# ${siteTitle}`,
    '',
    `> ${siteTagline}`,
    '',
    '## 使い方',
    '',
    ...usageLines(origin),
    '',
    ...recentPosts,
    '## 主なページ',
    '',
    `- [記事一覧](${origin}/posts.md): すべての記事の題名、公開日、概要`,
    `- [llms.txt](${origin}/llms.txt): サイトの案内と全記事の一覧`,
    `- [RSS](${origin}/rss.xml): 新着記事のフィード`,
    `- [サイトマップ](${origin}/sitemap.xml)`,
    '',
  ];
  return { markdown: `${head}\n${lines.join('\n')}`, canonical };
}

export async function postsMarkdown({ site, url, cache }: PageContext): Promise<MarkdownPage> {
  const origin = siteOrigin(site, url);
  const { entries: posts, cacheHint } = await getEmDashCollection('posts', {
    orderBy: { created_at: 'desc' },
    limit: ALL_POSTS_LIMIT,
  });
  if (cache.enabled) {
    cache.set(cacheHint);
  }
  const canonical = `${origin}/posts`;

  const head = frontmatter({
    title: '記事一覧',
    description: 'すべての記事の一覧',
    canonical,
    'last-updated': toDateString(latestDate(posts.map((post) => post.data.updatedAt))),
  });
  const lines = [
    '# 記事一覧',
    '',
    `全 ${posts.length} 件の記事を新しい順に並べています。各リンクは記事の Markdown 版です。`,
    '',
    ...posts.map((post) => postListItem(origin, post)),
    '',
  ];
  return { markdown: `${head}\n${lines.join('\n')}`, canonical };
}

export function postMarkdown({ site, url }: Pick<PageContext, 'site' | 'url'>, entry: unknown) {
  const post = asPost(entry);
  const canonical = `${siteOrigin(site, url)}/posts/${post.id}`;
  const published = toDateString(post.data.createdAt);
  const head = frontmatter({
    title: post.data.title,
    description: post.data.excerpt ?? '',
    canonical,
    published,
    'last-updated': toDateString(post.data.updatedAt) ?? published,
    date: published,
    tags: (post.data.terms?.tag ?? []).map((tag) => tag.label),
  });
  const body = `# ${post.data.title}\n\n${portableTextToMarkdown(post.data.content)}`;
  return { markdown: `${head}\n${body}`, canonical, id: post.id };
}

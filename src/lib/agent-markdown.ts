import { type Post, postPath, postTags, updatedAt } from './posts';
import { SITE_TAGLINE, SITE_TITLE } from './site';

export const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8';

export function toDateString(date: Date | undefined): string | undefined {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

function latestUpdate(posts: Post[]): string | undefined {
  const latest = posts.reduce<Date | undefined>((current, post) => {
    const date = updatedAt(post);
    return !current || date > current ? date : current;
  }, undefined);
  return toDateString(latest);
}

type FrontmatterValue = string | string[] | undefined;

function frontmatter(fields: Record<string, FrontmatterValue>): string {
  const lines = Object.entries(fields).flatMap(([key, value]) => {
    if (value === undefined) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.length === 0
        ? []
        : [`${key}:`, ...value.map((item) => `  - ${JSON.stringify(item)}`)];
    }
    return [`${key}: ${JSON.stringify(value)}`];
  });
  return `---\n${lines.join('\n')}\n---\n`;
}

export function postListItem(origin: string, post: Post): string {
  const date = toDateString(post.data.date);
  const excerpt = post.data.description ? `: ${post.data.description}` : '';
  return `- ${date} [${post.data.title}](${origin}${postPath(post)}.md)${excerpt}`;
}

export function usageLines(origin: string): string[] {
  return [
    `- 各記事の Markdown 版は、記事の URL の末尾に \`.md\` を付けた ${origin}/posts/{slug}.md で取得できます`,
    `- ホームと記事一覧の Markdown 版は ${origin}/index.md と ${origin}/posts.md にあります`,
    `- 全記事の一覧は ${origin}/llms.txt と ${origin}/sitemap.xml 、新着は ${origin}/rss.xml にあります`,
    '- このサイトは記事を公開するブログです。API、認証、MCP サーバーなどエージェントが操作する機能は提供していません',
  ];
}

export function homeMarkdown(origin: string, posts: Post[]): string {
  const head = frontmatter({
    title: SITE_TITLE,
    description: SITE_TAGLINE,
    canonical: `${origin}/`,
    'last-updated': latestUpdate(posts),
  });
  const recentPosts =
    posts.length > 0
      ? ['## 最近の記事', '', ...posts.map((post) => postListItem(origin, post)), '']
      : [];
  const lines = [
    `# ${SITE_TITLE}`,
    '',
    `> ${SITE_TAGLINE}`,
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
  return `${head}\n${lines.join('\n')}`;
}

export function postsMarkdown(origin: string, posts: Post[]): string {
  const head = frontmatter({
    title: '記事一覧',
    description: 'すべての記事の一覧',
    canonical: `${origin}/posts`,
    'last-updated': latestUpdate(posts),
  });
  const lines = [
    '# 記事一覧',
    '',
    `全 ${posts.length} 件の記事を新しい順に並べています。各リンクは記事の Markdown 版です。`,
    '',
    ...posts.map((post) => postListItem(origin, post)),
    '',
  ];
  return `${head}\n${lines.join('\n')}`;
}

export function postMarkdown(origin: string, post: Post): string {
  const published = toDateString(post.data.date);
  const head = frontmatter({
    title: post.data.title,
    description: post.data.description,
    canonical: `${origin}${postPath(post)}`,
    published,
    'last-updated': toDateString(updatedAt(post)),
    date: published,
    tags: postTags(post).map((tag) => tag.label),
  });
  return `${head}\n# ${post.data.title}\n\n${(post.body ?? '').trim()}\n`;
}

export function markdownResponse(body: string): Response {
  return new Response(body, { headers: { 'Content-Type': MARKDOWN_CONTENT_TYPE } });
}

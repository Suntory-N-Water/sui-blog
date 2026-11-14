export const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8';

export const SITE_LINKS = [
  '</sitemap.xml>; rel="sitemap"; type="application/xml"',
  '</rss.xml>; rel="alternate"; type="application/rss+xml"',
  '</llms.txt>; rel="describedby"; type="text/plain"',
];

export function acceptsMarkdown(accept: string | null): boolean {
  return (accept ?? '').split(',').some((range) => {
    const [type = '', ...params] = range.split(';').map((part) => part.trim().toLowerCase());
    if (type !== 'text/markdown') {
      return false;
    }
    const quality = params.find((param) => param.startsWith('q='));
    return quality === undefined || Number(quality.slice(2)) > 0;
  });
}

export function markdownPathFor(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/u, '') || '/' : pathname;
  if (path === '/') {
    return '/index.md';
  }
  if (path === '/posts') {
    return '/posts.md';
  }
  if (!path.startsWith('/posts/')) {
    return null;
  }
  const slug = path.slice('/posts/'.length);
  if (!slug || slug.includes('/') || slug.endsWith('.md') || slug === 'page' || slug === 'ogp') {
    return null;
  }
  return `${path}.md`;
}

export function siteOrigin(site: URL | undefined, url: URL): string {
  return site?.toString().replace(/\/+$/u, '') || url.origin;
}

export function toDateString(date: Date | undefined): string | undefined {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

export function latestDate(dates: (Date | undefined)[]): Date | undefined {
  return dates.reduce<Date | undefined>(
    (latest, date) => (date && (!latest || date > latest) ? date : latest),
    undefined,
  );
}

type FrontmatterValue = string | string[] | undefined;

export function frontmatter(fields: Record<string, FrontmatterValue>): string {
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

type ListedPost = {
  id: string;
  data: { title?: string; excerpt?: string; createdAt?: Date };
};

export function postListItem(origin: string, post: ListedPost): string {
  const title = post.data.title || 'Untitled';
  const date = toDateString(post.data.createdAt);
  const datePrefix = date ? `${date} ` : '';
  const excerpt = post.data.excerpt ? `: ${post.data.excerpt}` : '';
  return `- ${datePrefix}[${title}](${origin}/posts/${post.id}.md)${excerpt}`;
}

export function usageLines(origin: string): string[] {
  return [
    `- 各ページは、同じ URL に \`Accept: text/markdown\` を付けて要求すると Markdown で取得できます（対象: ホーム ${origin}/ 、記事一覧 ${origin}/posts 、各記事 ${origin}/posts/{slug} ）`,
    `- 記事の Markdown 版は、記事の URL の末尾に \`.md\` を付けた ${origin}/posts/{slug}.md でも取得できます`,
    `- 全記事の一覧は ${origin}/llms.txt と ${origin}/sitemap.xml 、新着は ${origin}/rss.xml にあります`,
    '- このサイトは記事を公開するブログです。API、認証、MCP サーバーなどエージェントが操作する機能は提供していません',
  ];
}

export function notFoundMarkdown(origin: string): string {
  return [
    '# ページが見つかりません',
    '',
    '要求された URL のページはありません。',
    '',
    `- [ホーム](${origin}/)`,
    `- [記事一覧](${origin}/posts)`,
    `- [サイトマップ](${origin}/sitemap.xml)`,
    `- [llms.txt](${origin}/llms.txt)`,
    '',
  ].join('\n');
}

export function markdownResponse(body: string, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', MARKDOWN_CONTENT_TYPE);
  return new Response(body, { ...init, headers });
}

export function addVaryAccept(headers: Headers): void {
  const current = headers.get('Vary');
  const values = current ? current.split(',').map((value) => value.trim().toLowerCase()) : [];
  if (!values.includes('accept') && !values.includes('*')) {
    headers.set('Vary', current ? `${current}, Accept` : 'Accept');
  }
}

export type MarkdownPage = { markdown: string; canonical: string };

export function negotiatedMarkdownResponse({ markdown, canonical }: MarkdownPage): Response {
  const response = markdownResponse(markdown, {
    headers: { Link: [...SITE_LINKS, `<${canonical}>; rel="canonical"`].join(', ') },
  });
  addVaryAccept(response.headers);
  return response;
}

export function directMarkdownResponse(
  { markdown, canonical }: MarkdownPage,
  extraHeaders: Record<string, string> = {},
): Response {
  return markdownResponse(markdown, {
    headers: {
      ...extraHeaders,
      'X-Robots-Tag': 'noindex',
      Link: `<${canonical}>; rel="canonical"`,
    },
  });
}

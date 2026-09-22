import type { APIRoute } from 'astro';
import { getEmDashCollection, getTaxonomyTerms } from 'emdash';
import { postDate } from '../utils/format-date';

type SitemapEntry = {
  path: string;
  lastmod?: Date | null;
  changefreq: string;
  priority: string;
};

export const GET: APIRoute = async ({ site, url }) => {
  const origin = site?.toString().replace(/\/+$/u, '') || url.origin;

  const { entries: posts } = await getEmDashCollection('posts', {
    orderBy: { modified_time: 'desc' },
    limit: 1000,
  });
  const tags = await getTaxonomyTerms('tag', { includeCounts: false });

  const newest = posts[0] ? postDate(posts[0].data) : null;

  const entries: SitemapEntry[] = [
    { path: '/', lastmod: newest, changefreq: 'daily', priority: '1.0' },
    { path: '/blog', lastmod: newest, changefreq: 'daily', priority: '0.9' },
    { path: '/tags', lastmod: newest, changefreq: 'weekly', priority: '0.6' },
    { path: '/search', changefreq: 'monthly', priority: '0.3' },
    ...posts.map((post) => ({
      path: `/blog/${post.id}`,
      lastmod: post.data.updatedAt ?? postDate(post.data),
      changefreq: 'monthly',
      priority: '0.8',
    })),
    ...tags.map((tag) => ({
      path: `/tags/${tag.slug}`,
      changefreq: 'weekly',
      priority: '0.5',
    })),
  ];

  const urls = entries
    .map(({ path, lastmod, changefreq, priority }) => {
      const loc = escapeXml(`${origin}${encodeURI(path)}`);
      const lastmodTag = lastmod
        ? `\n    <lastmod>${lastmod.toISOString()}</lastmod>`
        : '';
      return `  <url>
    <loc>${loc}</loc>${lastmodTag}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

const XML_ESCAPE_PATTERNS = [
  [/&/gu, '&amp;'],
  [/</gu, '&lt;'],
  [/>/gu, '&gt;'],
  [/"/gu, '&quot;'],
  [/'/gu, '&apos;'],
] as const;

function escapeXml(value: string): string {
  let result = value;
  for (const [pattern, replacement] of XML_ESCAPE_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

import type { APIRoute } from 'astro';
import { escapeXml } from '../lib/xml';
import { getPosts, PER_PAGE, postPath, summarizeTags, updatedAt } from '../lib/posts';
import { siteOrigin } from '../lib/site';

type SitemapEntry = {
  path: string;
  lastmod?: Date;
  changefreq: string;
  priority: string;
};

export const GET: APIRoute = async ({ site }) => {
  const origin = siteOrigin(site);
  const posts = await getPosts();
  const newest = posts[0]?.data.date;
  const totalPages = Math.ceil(posts.length / PER_PAGE);

  const entries: SitemapEntry[] = [
    { path: '/', lastmod: newest, changefreq: 'daily', priority: '1.0' },
    { path: '/posts', lastmod: newest, changefreq: 'daily', priority: '0.9' },
    ...Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      path: `/posts/page/${i + 2}`,
      changefreq: 'weekly',
      priority: '0.4',
    })),
    { path: '/tags', lastmod: newest, changefreq: 'weekly', priority: '0.6' },
    ...posts.map((post) => ({
      path: postPath(post),
      lastmod: updatedAt(post),
      changefreq: 'monthly',
      priority: '0.8',
    })),
    ...summarizeTags(posts).map((tag) => ({
      path: `/tags/${tag.slug}`,
      changefreq: 'weekly',
      priority: '0.5',
    })),
  ];

  const urls = entries
    .map(({ path, lastmod, changefreq, priority }) => {
      const loc = escapeXml(`${origin}${encodeURI(path)}`);
      const lastmodTag = lastmod ? `\n    <lastmod>${lastmod.toISOString()}</lastmod>` : '';
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
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

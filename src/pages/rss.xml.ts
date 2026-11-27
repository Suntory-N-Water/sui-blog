import type { APIRoute } from 'astro';
import { escapeXml } from '../lib/xml';
import { getPosts, postPath } from '../lib/posts';
import { SITE_TAGLINE, SITE_TITLE, siteOrigin } from '../lib/site';

const RSS_ITEM_LIMIT = 20;

export const GET: APIRoute = async ({ site }) => {
  const origin = siteOrigin(site);
  const posts = (await getPosts()).slice(0, RSS_ITEM_LIMIT);

  const items = posts
    .map((post) => {
      const postUrl = `${origin}${postPath(post)}`;
      return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
      <description>${escapeXml(post.data.description)}</description>
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <description>${escapeXml(SITE_TAGLINE)}</description>
    <link>${origin}</link>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>ja</language>
    <lastBuildDate>${(posts[0]?.data.date ?? new Date()).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};

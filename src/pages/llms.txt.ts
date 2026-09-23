import type { APIRoute } from 'astro';
import { getEmDashCollection, getSiteSettings } from 'emdash';
import { resolveBlogSiteIdentity } from '../utils/site-identity';

export const GET: APIRoute = async ({ site, url }) => {
  const origin = site?.toString().replace(/\/$/u, '') || url.origin;
  const { siteTitle, siteTagline } = resolveBlogSiteIdentity(
    await getSiteSettings(),
  );
  const { entries: blogs } = await getEmDashCollection('blogs', {
    orderBy: { modified_time: 'desc' },
    limit: 1000,
  });

  const lines = [`# ${siteTitle}`, '', siteTagline, '', '## Blogs', ''];
  for (const blog of blogs) {
    const title = blog.data.title || 'Untitled';
    const excerpt = blog.data.excerpt ? `: ${blog.data.excerpt}` : '';
    lines.push(`- [${title}](${origin}/blog/${blog.id})${excerpt}`);
  }

  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

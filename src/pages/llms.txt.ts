import type { APIRoute } from 'astro';
import { getEmDashCollection, getSiteSettings } from 'emdash';
import { postListItem, siteOrigin, usageLines } from '../lib/agent-markdown';
import { resolveBlogSiteIdentity } from '../utils/site-identity';

export const GET: APIRoute = async ({ site, url }) => {
  const origin = siteOrigin(site, url);
  const { siteTitle, siteTagline } = resolveBlogSiteIdentity(await getSiteSettings());
  const { entries: posts } = await getEmDashCollection('posts', {
    orderBy: { created_at: 'desc' },
    limit: 1000,
  });

  const lines = [
    `# ${siteTitle}`,
    '',
    `> ${siteTagline}`,
    '',
    '## いつ使うか',
    '',
    '- Claude Code などの AI エージェント、Cloudflare Workers、EmDash、Astro、フロントエンド開発について、日本語の検証記事や実装例を探すときに使えます',
    '- 記事は下の「記事」の一覧から選べます',
    '',
    '## 使い方',
    '',
    ...usageLines(origin),
    '',
    '## 主なページ',
    '',
    `- [ホーム](${origin}/index.md): 最近の記事`,
    `- [記事一覧](${origin}/posts.md): すべての記事の題名、公開日、概要`,
    '',
    '## 記事',
    '',
    ...posts.map((post) => postListItem(origin, post)),
  ];

  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

import type { APIRoute } from 'astro';
import { postListItem, usageLines } from '../lib/agent-markdown';
import { getPosts } from '../lib/posts';
import { SITE_TAGLINE, SITE_TITLE, siteOrigin } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const origin = siteOrigin(site);
  const posts = await getPosts();

  const lines = [
    `# ${SITE_TITLE}`,
    '',
    `> ${SITE_TAGLINE}`,
    '',
    '## いつ使うか',
    '',
    '- Claude Code などの AI エージェント、Cloudflare Workers、Astro、フロントエンド開発について、日本語の検証記事や実装例を探すときに使えます',
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
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

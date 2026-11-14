import type { APIRoute } from 'astro';
import { getEmDashEntry } from 'emdash';
import { directMarkdownResponse } from '../../lib/agent-markdown';
import { postMarkdown } from '../../lib/agent-markdown-pages';

export const GET: APIRoute = async (context) => {
  const slug = context.params.slug ?? '';
  const { entry: post, cacheHint } = await getEmDashEntry('posts', slug);
  if (!post) {
    return new Response('Not found', { status: 404 });
  }
  if (context.cache?.enabled) {
    context.cache.set(cacheHint);
  }
  const page = postMarkdown(context, post);
  return directMarkdownResponse(page, {
    'Content-Disposition': `inline; filename="${page.id}.md"`,
  });
};

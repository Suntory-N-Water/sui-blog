import type { APIRoute } from 'astro';
import { homeMarkdown, markdownResponse } from '../lib/agent-markdown';
import { getPosts, HOME_POST_LIMIT } from '../lib/posts';
import { siteOrigin } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getPosts();
  return markdownResponse(homeMarkdown(siteOrigin(site), posts.slice(0, HOME_POST_LIMIT)));
};

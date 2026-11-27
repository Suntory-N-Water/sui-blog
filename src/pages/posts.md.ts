import type { APIRoute } from 'astro';
import { markdownResponse, postsMarkdown } from '../lib/agent-markdown';
import { getPosts } from '../lib/posts';
import { siteOrigin } from '../lib/site';

export const GET: APIRoute = async ({ site }) =>
  markdownResponse(postsMarkdown(siteOrigin(site), await getPosts()));

import type { APIRoute } from 'astro';
import { directMarkdownResponse } from '../lib/agent-markdown';
import { postsMarkdown } from '../lib/agent-markdown-pages';

export const GET: APIRoute = async (context) =>
  directMarkdownResponse(await postsMarkdown(context));

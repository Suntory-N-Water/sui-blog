import type { APIRoute } from 'astro';
import { directMarkdownResponse } from '../lib/agent-markdown';
import { homeMarkdown } from '../lib/agent-markdown-pages';

export const GET: APIRoute = async (context) => directMarkdownResponse(await homeMarkdown(context));

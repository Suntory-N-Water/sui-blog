import { sequence } from 'astro:middleware';
import { agentMarkdown } from './agent-markdown';
import { mediaCache } from './media-cache';

export const onRequest = sequence(agentMarkdown, mediaCache);

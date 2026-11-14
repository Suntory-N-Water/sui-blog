import { defineMiddleware } from 'astro:middleware';
import {
  acceptsMarkdown,
  addVaryAccept,
  markdownPathFor,
  markdownResponse,
  notFoundMarkdown,
  SITE_LINKS,
  siteOrigin,
} from '../lib/agent-markdown';

function withHeaders(response: Response, edit: (headers: Headers) => void): Response {
  const next = new Response(response.body, response);
  edit(next.headers);
  return next;
}

export const agentMarkdown = defineMiddleware(async ({ request, url, site }, next) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next();
  }
  if (url.pathname.startsWith('/_emdash') || url.pathname.startsWith('/_image')) {
    return next();
  }

  const response = await next();
  const wantsMarkdown = acceptsMarkdown(request.headers.get('Accept'));

  if (response.status === 404) {
    if (!wantsMarkdown) {
      return withHeaders(response, addVaryAccept);
    }
    const notFound = markdownResponse(notFoundMarkdown(siteOrigin(site, url)), {
      status: 404,
      headers: { 'Cache-Control': 'private, no-store' },
    });
    addVaryAccept(notFound.headers);
    return notFound;
  }

  const markdownPath = markdownPathFor(url.pathname);
  const isHtml = response.headers.get('Content-Type')?.startsWith('text/html') ?? false;
  if (!markdownPath && !isHtml) {
    return response;
  }

  return withHeaders(response, (headers) => {
    if (markdownPath) {
      addVaryAccept(headers);
    }
    if (isHtml) {
      const links = markdownPath
        ? [...SITE_LINKS, `<${markdownPath}>; rel="alternate"; type="text/markdown"`]
        : SITE_LINKS;
      const current = headers.get('Link');
      headers.set('Link', current ? [current, ...links].join(', ') : links.join(', '));
    }
  });
});

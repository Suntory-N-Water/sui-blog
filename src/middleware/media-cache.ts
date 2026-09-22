import { defineMiddleware } from 'astro:middleware';

const MEDIA_PATH = /^\/(?:_emdash\/api\/media\/file\/|_image)/;

const MEDIA_CACHE_CONTROL = 'public, max-age=3600';

export const mediaCache = defineMiddleware(async ({ request }, next) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next();
  }

  if (!MEDIA_PATH.test(new URL(request.url).pathname)) {
    return next();
  }

  const response = await next();
  if (!response.ok) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', MEDIA_CACHE_CONTROL);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});

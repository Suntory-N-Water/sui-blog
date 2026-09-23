import type { APIRoute } from 'astro';
import { waitUntil } from 'cloudflare:workers';
import { decodeSlug, getEmDashEntry } from 'emdash';
import {
  fetchFallbackOgpImage,
  OGP_CACHE_NAME,
  renderOgpImage,
} from '../../../lib/ogp';
import { asPost } from '../../../lib/emdash-types';

const CACHE_CONTROL =
  'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400';

async function fallbackResponse(origin: string): Promise<Response> {
  try {
    const asset = await fetchFallbackOgpImage(origin);
    return new Response(asset.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    return new Response('Failed to render image', { status: 500 });
  }
}

export const GET: APIRoute = async ({ params, request }) => {
  const origin = new URL(request.url).origin;

  const cache = await caches.open(OGP_CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  try {
    const slug = decodeSlug(params.slug);
    if (!slug) {
      return new Response('Not found', { status: 404 });
    }

    const { entry } = await getEmDashEntry('blogs', slug);
    if (!entry) {
      return new Response('Not found', { status: 404 });
    }

    const post = asPost(entry);
    const image = await renderOgpImage({
      title: post.data.title,
      tags: (post.data.terms?.tag ?? []).map((term) => term.label),
      iconFilename:
        typeof post.data.featured_image === 'object'
          ? post.data.featured_image.filename
          : undefined,
      origin,
    });

    const response = new Response(image as unknown as BodyInit, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': CACHE_CONTROL,
      },
    });
    waitUntil(cache.put(request, response.clone()));
    return response;
  } catch (error) {
    console.error('OGP render failed', error);
    return fallbackResponse(origin);
  }
};

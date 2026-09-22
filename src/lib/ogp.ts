import { env } from 'cloudflare:workers';
import { render } from '@cf-wasm/og';

type VNode = {
  type: string;
  props: {
    style?: Record<string, unknown>;
    children?: string | VNode | VNode[];
  };
};

const FONT_ASSET_PATH = '/fonts/NotoSansJP-SemiBold.ttf';
const FALLBACK_ASSET_PATH = '/opengraph-image.png';
const FONT_FAMILY = 'Noto Sans JP';
const BRAND = '#0066cc';

export const OGP_CACHE_NAME = 'ogp';

let fontPromise: Promise<ArrayBuffer> | undefined;

async function fetchSiteAsset(path: string, origin: string): Promise<Response> {
  const url = new URL(path, origin).toString();
  const response = await env.ASSETS.fetch(url);
  if (!response.ok) {
    throw new Error(`asset ${path} responded ${response.status}`);
  }
  return response;
}

async function loadFont(origin: string): Promise<ArrayBuffer> {
  if (!fontPromise) {
    fontPromise = (async () => {
      const key = new URL(FONT_ASSET_PATH, origin).toString();
      const cache = await caches.open(OGP_CACHE_NAME);
      const cached = await cache.match(key);
      if (cached) {
        return cached.arrayBuffer();
      }
      const buffer = await (
        await fetchSiteAsset(FONT_ASSET_PATH, origin)
      ).arrayBuffer();
      await cache
        .put(
          key,
          new Response(buffer, {
            headers: {
              'Content-Type': 'font/ttf',
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          }),
        )
        .catch(() => undefined);
      return buffer;
    })().catch((error: unknown) => {
      fontPromise = undefined;
      throw error;
    });
  }
  return fontPromise;
}

function card(title: string, excerpt: string): VNode {
  const children: VNode[] = [
    {
      type: 'div',
      props: {
        style: { display: 'flex', flexDirection: 'column' },
        children: [
          {
            type: 'div',
            props: {
              style: {
                width: '96px',
                height: '10px',
                borderRadius: '5px',
                backgroundColor: BRAND,
              },
            },
          },
          {
            type: 'div',
            props: {
              style: {
                marginTop: '20px',
                fontSize: '26px',
                fontWeight: 600,
                color: BRAND,
              },
              children: 'sui Tech Blog',
            },
          },
        ],
      },
    },
    {
      type: 'div',
      props: {
        style: {
          marginTop: '40px',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 3,
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          fontSize: '54px',
          fontWeight: 600,
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
          color: '#202124',
        },
        children: title,
      },
    },
  ];

  if (excerpt) {
    children.push({
      type: 'div',
      props: {
        style: {
          marginTop: 'auto',
          paddingTop: '28px',
          flexShrink: 0,
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          fontSize: '23px',
          lineHeight: 1.6,
          color: '#5f6368',
        },
        children: excerpt,
      },
    });
  }

  return {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        padding: '54px',
        backgroundColor: '#f8fafc',
        fontFamily: FONT_FAMILY,
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              padding: '46px 56px',
              overflow: 'hidden',
              borderRadius: '28px',
              border: '3px solid #d9e2ec',
              backgroundColor: '#ffffff',
            },
            children,
          },
        },
      ],
    },
  };
}

export async function renderOgpImage({
  title,
  excerpt,
  origin,
}: {
  title: string;
  excerpt: string;
  origin: string;
}): Promise<Uint8Array> {
  const data = await loadFont(origin);
  const { image } = await render(card(title, excerpt), {
    width: 1200,
    height: 630,
    fonts: [
      { name: FONT_FAMILY, data, weight: 400, style: 'normal' },
      { name: FONT_FAMILY, data, weight: 600, style: 'normal' },
    ],
  }).asPng();
  return image;
}

export function fetchFallbackOgpImage(origin: string): Promise<Response> {
  return fetchSiteAsset(FALLBACK_ASSET_PATH, origin);
}

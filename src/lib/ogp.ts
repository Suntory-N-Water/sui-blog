import { env } from 'cloudflare:workers';
import { render } from '@cf-wasm/og';

type VNode = {
  type: string;
  props: {
    style?: Record<string, unknown>;
    src?: string;
    alt?: string;
    width?: number;
    height?: number;
    children?: string | VNode | VNode[];
  };
};

const FONT_ASSET_PATH = '/fonts/NotoSansJP-SemiBold.ttf';
const FALLBACK_ASSET_PATH = '/opengraph-image.png';
const AVATAR_URL = 'https://avatars.githubusercontent.com/u/116779921?v=4';
const FONT_FAMILY = 'Noto Sans JP';
const TEXT_COLOR = 'rgba(0,0,0,0.82)';

export const OGP_CACHE_NAME = 'ogp';

let fontPromise: Promise<ArrayBuffer> | undefined;
let avatarPromise: Promise<string | null> | undefined;

async function fetchSiteAsset(path: string, origin: string): Promise<Response> {
  const url = new URL(path, origin).toString();
  const response = await env.ASSETS.fetch(url);
  if (!response.ok) {
    throw new Error(`asset ${path} responded ${response.status}`);
  }
  return response;
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function cached<T>(
  key: string,
  load: () => Promise<Response>,
  decode: (response: Response) => Promise<T>,
): Promise<T> {
  const cache = await caches.open(OGP_CACHE_NAME);
  const hit = await cache.match(key);
  if (hit) {
    return decode(hit);
  }
  const response = await load();
  const buffer = await response.arrayBuffer();
  await cache
    .put(
      key,
      new Response(buffer, {
        headers: {
          'Content-Type':
            response.headers.get('Content-Type') ?? 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      }),
    )
    .catch(() => undefined);
  return decode(new Response(buffer, { headers: response.headers }));
}

function loadFont(origin: string): Promise<ArrayBuffer> {
  if (!fontPromise) {
    fontPromise = cached(
      new URL(FONT_ASSET_PATH, origin).toString(),
      () => fetchSiteAsset(FONT_ASSET_PATH, origin),
      (response) => response.arrayBuffer(),
    ).catch((error: unknown) => {
      fontPromise = undefined;
      throw error;
    });
  }
  return fontPromise;
}

function loadAvatar(): Promise<string | null> {
  if (!avatarPromise) {
    avatarPromise = cached(
      AVATAR_URL,
      async () => {
        const response = await fetch(AVATAR_URL);
        if (!response.ok) {
          throw new Error(`avatar responded ${response.status}`);
        }
        return response;
      },
      async (response) => {
        const type = response.headers.get('Content-Type') ?? 'image/jpeg';
        return `data:${type};base64,${toBase64(await response.arrayBuffer())}`;
      },
    ).catch(() => {
      avatarPromise = undefined;
      return null;
    });
  }
  return avatarPromise;
}

async function loadIcon(
  filename: string | undefined,
  origin: string,
): Promise<string | null> {
  if (!filename) {
    return null;
  }
  try {
    const path = `/icons/${filename}`;
    return await cached(
      new URL(path, origin).toString(),
      () => fetchSiteAsset(path, origin),
      async (response) =>
        `data:image/svg+xml;base64,${toBase64(await response.arrayBuffer())}`,
    );
  } catch {
    return null;
  }
}

function card({
  title,
  tags,
  iconDataUrl,
  avatarDataUrl,
}: {
  title: string;
  tags: string[];
  iconDataUrl: string | null;
  avatarDataUrl: string | null;
}): VNode {
  const cardChildren: VNode[] = [];

  if (iconDataUrl) {
    cardChildren.push({
      type: 'img',
      props: {
        src: iconDataUrl,
        alt: '',
        style: {
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 400,
          height: 400,
          opacity: 0.15,
          objectFit: 'contain',
        },
      },
    });
  }

  const headChildren: VNode[] = [
    {
      type: 'div',
      props: {
        style: {
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 4,
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          fontSize: 64,
          fontWeight: 600,
          color: TEXT_COLOR,
          lineHeight: 1.2,
        },
        children: title,
      },
    },
  ];

  if (tags.length > 0) {
    headChildren.push({
      type: 'div',
      props: {
        style: { display: 'flex', alignItems: 'center', marginTop: 24 },
        children: tags.map((tag) => ({
          type: 'div',
          props: {
            style: {
              fontSize: 24,
              fontWeight: 400,
              color: TEXT_COLOR,
              border: '1px solid #d1d5db',
              padding: '4px 24px',
              borderRadius: 9999,
              marginRight: 12,
              backgroundColor: 'white',
            },
            children: tag,
          },
        })),
      },
    });
  }

  const footerChildren: VNode[] = [];
  if (avatarDataUrl) {
    footerChildren.push({
      type: 'img',
      props: {
        src: avatarDataUrl,
        alt: '',
        width: 60,
        height: 60,
        style: { borderRadius: 9999, marginRight: 24 },
      },
    });
  }
  footerChildren.push({ type: 'div', props: { children: 'sui' } });

  cardChildren.push({
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 48,
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', minHeight: 0 },
            children: headChildren,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 48,
              fontWeight: 400,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              color: TEXT_COLOR,
            },
            children: footerChildren,
          },
        },
      ],
    },
  });

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        width: '100%',
        height: '100%',
        padding: 32,
        fontFamily: FONT_FAMILY,
        background: 'linear-gradient(to bottom right, #9BD4FF, #FFFA9B)',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              position: 'relative',
              width: '100%',
              height: '100%',
              backgroundColor: 'white',
              borderRadius: 16,
              overflow: 'hidden',
            },
            children: cardChildren,
          },
        },
      ],
    },
  };
}

export async function renderOgpImage({
  title,
  tags,
  iconFilename,
  origin,
}: {
  title: string;
  tags: string[];
  iconFilename?: string;
  origin: string;
}): Promise<Uint8Array> {
  const [data, iconDataUrl, avatarDataUrl] = await Promise.all([
    loadFont(origin),
    loadIcon(iconFilename, origin),
    loadAvatar(),
  ]);

  const { image } = await render(
    card({ title, tags, iconDataUrl, avatarDataUrl }),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: FONT_FAMILY, data, weight: 400, style: 'normal' },
        { name: FONT_FAMILY, data, weight: 600, style: 'normal' },
      ],
    },
  ).asPng();
  return image;
}

export function fetchFallbackOgpImage(origin: string): Promise<Response> {
  return fetchSiteAsset(FALLBACK_ASSET_PATH, origin);
}

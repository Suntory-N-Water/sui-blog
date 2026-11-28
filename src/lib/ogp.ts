import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

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

const AVATAR_URL = 'https://avatars.githubusercontent.com/u/116779921?v=4';
const FONT_FAMILY = 'Noto Sans JP';
const TEXT_COLOR = 'rgba(0,0,0,0.82)';
const WIDTH = 1200;
const HEIGHT = 630;

let fontData: Buffer | undefined;
let avatarPromise: Promise<string | null> | undefined;

function loadFont(): Buffer {
  fontData ??= readFileSync(join(process.cwd(), 'public', 'fonts', 'NotoSansJP-SemiBold.ttf'));
  return fontData;
}

function loadAvatar(): Promise<string | null> {
  avatarPromise ??= (async () => {
    try {
      const response = await fetch(AVATAR_URL, { signal: AbortSignal.timeout(10_000) });
      if (!response.ok) {
        return null;
      }
      const type = response.headers.get('Content-Type') ?? 'image/jpeg';
      const body = Buffer.from(await response.arrayBuffer()).toString('base64');
      return `data:${type};base64,${body}`;
    } catch {
      return null;
    }
  })();
  return avatarPromise;
}

function card(options: {
  title: string;
  tags: string[];
  iconDataUrl: string | undefined;
  avatarDataUrl: string | null;
}): VNode {
  const cardChildren: VNode[] = [];

  if (options.iconDataUrl) {
    cardChildren.push({
      type: 'img',
      props: {
        src: options.iconDataUrl,
        alt: '',
        width: 400,
        height: 400,
        style: { position: 'absolute', right: 0, bottom: 0, opacity: 0.15 },
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
        children: options.title,
      },
    },
  ];

  if (options.tags.length > 0) {
    headChildren.push({
      type: 'div',
      props: {
        style: { display: 'flex', alignItems: 'center', marginTop: 24 },
        children: options.tags.map((tag) => ({
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
  if (options.avatarDataUrl) {
    footerChildren.push({
      type: 'img',
      props: {
        src: options.avatarDataUrl,
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

export async function renderOgpImage(options: {
  title: string;
  tags: string[];
  iconDataUrl: string | undefined;
}): Promise<Uint8Array> {
  const data = loadFont();
  const avatarDataUrl = await loadAvatar();
  const svg = await satori(card({ ...options, avatarDataUrl }) as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: FONT_FAMILY, data, weight: 400, style: 'normal' },
      { name: FONT_FAMILY, data, weight: 600, style: 'normal' },
    ],
  });
  return new Uint8Array(
    new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng(),
  );
}

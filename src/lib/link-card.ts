const TEXT_MARKS = new Set([
  'strong',
  'em',
  'code',
  'underline',
  'strike-through',
  'superscript',
  'subscript',
  'highlight',
]);

const FETCH_TIMEOUT_MS = 5000;
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;
const MAX_HEAD_LENGTH = 128 * 1024;
const MAX_CACHED_PREVIEWS = 500;
const USER_AGENT =
  'Mozilla/5.0 (compatible; sui-blog-linkcard/1.0; +https://suntory-n-water.com)';

const BLOCKED_TITLES = new Set([
  'Just a moment...',
  'Attention Required! | Cloudflare',
]);

export type LinkPreview = {
  url: string;
  title: string;
  description: string;
  image: string;
};

type MarkDef = {
  _type?: string;
  _key?: string;
  href?: string;
};

type Child = {
  _type?: string;
  text?: string;
  marks?: string[];
  markType?: string;
  markKey?: string;
  markDef?: MarkDef;
  children?: Child[];
};

type Block = {
  _type?: string;
  style?: string;
  children?: Child[];
  markDefs?: MarkDef[];
};

export function bareLinkHref(node: unknown): string | null {
  const block = node as Block | null;
  if (!block || block._type !== 'block') return null;
  if (block.style && block.style !== 'normal') return null;

  const children = (block.children ?? []).filter(
    (child) => textOf(child).trim() !== '',
  );
  if (children.length !== 1) return null;

  const [child] = children;
  const href =
    child._type === '@span'
      ? markTreeHref(child)
      : spanHref(child, block.markDefs ?? []);

  return href && textOf(child).trim() === href ? href : null;
}

function markTreeHref(child: Child): string | null {
  if (child.markType !== 'link') return null;
  const href = child.markDef?.href;
  return typeof href === 'string' ? href : null;
}

function spanHref(child: Child, markDefs: MarkDef[]): string | null {
  if (child._type !== 'span') return null;
  const linkKey = (child.marks ?? []).find((mark) => !TEXT_MARKS.has(mark));
  if (!linkKey) return null;

  const def = markDefs.find((mark) => mark._key === linkKey);
  if (!def || def._type !== 'link' || typeof def.href !== 'string') return null;
  return def.href;
}

function textOf(child: Child): string {
  if (typeof child.text === 'string') return child.text;
  return (child.children ?? []).map(textOf).join('');
}

const previews = new Map<string, LinkPreview | null>();

export async function getLinkPreview(url: string): Promise<LinkPreview | null> {
  const cached = previews.get(url);
  if (cached !== undefined) return cached;

  const preview = await fetchLinkPreview(url);
  if (previews.size >= MAX_CACHED_PREVIEWS) previews.clear();
  previews.set(url, preview);
  return preview;
}

export async function prefetchLinkPreviews(blocks: unknown): Promise<void> {
  if (!Array.isArray(blocks)) return;

  const urls = new Set<string>();
  for (const block of blocks) {
    const href = bareLinkHref(block);
    if (href && /^https?:\/\//u.test(href)) urls.add(href);
  }

  await Promise.all([...urls].map((url) => getLinkPreview(url)));
}

async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cf: { cacheEverything: true, cacheTtl: CACHE_TTL_SECONDS },
    } as RequestInit);

    if (!response.ok) return null;

    const html = await readDocumentHead(response);
    const title = metaContent(html, 'og:title') ?? titleTag(html);
    if (!title || BLOCKED_TITLES.has(title)) return null;

    return {
      url,
      title: decodeEntities(title),
      description: decodeEntities(
        metaContent(html, 'og:description') ??
          metaContent(html, 'description') ??
          '',
      ),
      image: absoluteUrl(metaContent(html, 'og:image'), url),
    };
  } catch {
    return null;
  }
}

async function readDocumentHead(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return response.text();

  const decoder = new TextDecoder();
  let html = '';
  try {
    while (html.length < MAX_HEAD_LENGTH) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (html.includes('</head>')) break;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return html;
}

function metaContent(html: string, property: string): string | undefined {
  const tag = new RegExp(
    `<meta[^>]*(?:property|name)\\s*=\\s*["']?${property}["']?[^>]*>`,
    'iu',
  ).exec(html)?.[0];
  if (!tag) return undefined;

  const content = /content\s*=\s*(?:["']([^"']*)["']|([^\s>]+))/iu.exec(tag);
  const value = (content?.[1] ?? content?.[2] ?? '').trim();
  return value || undefined;
}

function titleTag(html: string): string | undefined {
  return /<title[^>]*>([\s\S]*?)<\/title>/iu.exec(html)?.[1]?.trim() ||
    undefined;
}

function absoluteUrl(value: string | undefined, base: string): string {
  if (!value) return '';
  try {
    return new URL(value, base).href;
  } catch {
    return '';
  }
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntities(value: string): string {
  return value.replace(
    /&(#x?[0-9a-f]+|[a-z]+);/giu,
    (match, entity: string) => {
      const lower = entity.toLowerCase();
      if (lower.startsWith('#x')) {
        return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
      }
      if (lower.startsWith('#')) {
        return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
      }
      return NAMED_ENTITIES[lower] ?? match;
    },
  );
}

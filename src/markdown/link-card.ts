import { escapeHtml } from './html';
import { internalPostSlug, rewriteInternalHref } from './links';
import { findPost } from './post-lookup';

const FETCH_TIMEOUT_MS = 8000;
const MAX_HEAD_LENGTH = 256 * 1024;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36';
const BLOCKED_TITLES = new Set(['Just a moment...', 'Attention Required! | Cloudflare']);

type LinkPreview = { title: string; image: string };

const previews = new Map<string, Promise<LinkPreview | null>>();

export function getLinkPreview(url: string): Promise<LinkPreview | null> {
  let preview = previews.get(url);
  if (!preview) {
    preview = fetchLinkPreview(url);
    previews.set(url, preview);
  }
  return preview;
}

async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }
    const html = await readDocumentHead(response);
    const title = metaContent(html, 'og:title') ?? titleTag(html);
    if (!title || BLOCKED_TITLES.has(title)) {
      return null;
    }
    return {
      title: decodeEntities(title),
      image: absoluteUrl(metaContent(html, 'og:image'), url),
    };
  } catch {
    return null;
  }
}

async function readDocumentHead(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return response.text();
  }
  const decoder = new TextDecoder();
  let html = '';
  try {
    while (html.length < MAX_HEAD_LENGTH) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      html += decoder.decode(value, { stream: true });
      if (html.includes('</head>')) {
        break;
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return html;
}

function metaContent(html: string, property: string): string | undefined {
  const tag: RegExpExecArray | null = new RegExp(
    `<meta[^>]*(?:property|name)\\s*=\\s*["']?${property}["']?[^>]*>`,
    'iu',
  ).exec(html);
  if (tag === null) {
    return undefined;
  }
  const content: RegExpExecArray | null = /content\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/iu.exec(
    tag[0],
  );
  if (content === null) {
    return undefined;
  }
  const [, doubleQuoted, singleQuoted, bare] = content;
  return (doubleQuoted ?? singleQuoted ?? bare ?? '').trim() || undefined;
}

function titleTag(html: string): string | undefined {
  const match: RegExpExecArray | null = /<title[^>]*>([\s\S]*?)<\/title>/iu.exec(html);
  if (match === null) {
    return undefined;
  }
  return match[1]?.trim() || undefined;
}

function absoluteUrl(value: string | undefined, base: string): string {
  if (!value) {
    return '';
  }
  try {
    const url = new URL(value, base);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
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
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu, (match, entity: string) => {
    const lower = entity.toLowerCase();
    if (lower.startsWith('#x')) {
      return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
    }
    if (lower.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
    }
    return NAMED_ENTITIES[lower] ?? match;
  });
}

function fallback(href: string, label: string, external: boolean): string {
  const target = external ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<p class="link-card-fallback"><a href="${escapeHtml(href)}"${target}>${escapeHtml(label)}</a></p>`;
}

function card(options: {
  href: string;
  title: string;
  displayUrl: string;
  thumbnail: string;
  external: boolean;
}): string {
  const target = options.external ? ' target="_blank" rel="noopener noreferrer"' : '';
  const thumbnail = options.thumbnail
    ? `<span class="link-card-thumbnail">${options.thumbnail}</span>`
    : '';
  return `<a class="link-card" href="${escapeHtml(options.href)}"${target}><span class="link-card-body"><span class="link-card-title">${escapeHtml(options.title)}</span><span class="link-card-url">${escapeHtml(options.displayUrl)}</span></span>${thumbnail}</a>`;
}

export async function renderLinkCard(url: string): Promise<string> {
  const slug = internalPostSlug(url);
  if (slug) {
    const href = rewriteInternalHref(url);
    const post = findPost(slug);
    if (!post) {
      throw new Error(`リンクカードの記事「${slug}」が contents/blog にありません。`);
    }
    const thumbnail = post.iconUrl
      ? `<img src="${escapeHtml(post.iconUrl)}" alt="" loading="lazy" decoding="async" class="link-card-icon">`
      : '';
    return card({ href, title: post.title, displayUrl: href, thumbnail, external: false });
  }

  if (!/^https?:\/\//u.test(url)) {
    return fallback(url, url, false);
  }
  const preview = await getLinkPreview(url);
  if (!preview) {
    return fallback(url, url, true);
  }
  const thumbnail = preview.image
    ? `<img src="${escapeHtml(preview.image)}" alt="" loading="lazy" decoding="async">`
    : '';
  return card({
    href: url,
    title: preview.title,
    displayUrl: new URL(url).hostname.replace(/^www\./u, ''),
    thumbnail,
    external: true,
  });
}

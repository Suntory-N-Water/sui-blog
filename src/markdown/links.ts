const SITE_HOSTS = new Set(['suntory-n-water.com', 'www.suntory-n-water.com']);
const POST_PATH = /^\/(?:blog|posts)\/([^/?#]+)\/?([?#].*)?$/u;

function sitePath(href: string): string | null {
  if (!/^https?:\/\//u.test(href)) {
    return href;
  }
  const url = new URL(href);
  if (!SITE_HOSTS.has(url.hostname)) {
    return null;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

function matchPostPath(path: string): { slug: string; suffix: string } | null {
  const match: RegExpExecArray | null = POST_PATH.exec(path);
  if (match === null) {
    return null;
  }
  const [, slug, suffix] = match;
  if (!slug) {
    return null;
  }
  return { slug, suffix: suffix ?? '' };
}

export function internalPostSlug(href: string): string | null {
  const path = sitePath(href);
  const post = path === null ? null : matchPostPath(path);
  if (post === null || post.slug === 'page' || post.slug === 'ogp') {
    return null;
  }
  return decodeURIComponent(post.slug);
}

export function rewriteInternalHref(href: string): string {
  const path = sitePath(href);
  const post = path === null ? null : matchPostPath(path);
  if (post === null) {
    return href;
  }
  return `/posts/${post.slug}${post.suffix}`;
}

export function isExternalHref(href: string): boolean {
  if (!/^https?:\/\//u.test(href)) {
    return false;
  }
  try {
    return !SITE_HOSTS.has(new URL(href).hostname);
  } catch {
    return false;
  }
}

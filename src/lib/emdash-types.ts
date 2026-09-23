import type { MediaValue } from 'emdash';

export type BlogTag = { slug: string; label: string };

export type PublicBlog = {
  id: string;
  data: {
    id: string;
    title: string;
    excerpt?: string;
    content: unknown;
    featured_image?: MediaValue | string;
    publishedAt?: Date;
    updatedAt?: Date;
    modified_time?: Date | string;
    terms?: { tag: BlogTag[] };
  };
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function asDate(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function asBlog(value: unknown): PublicBlog {
  const root = asRecord(value);
  const raw = asRecord(root.data);
  const rawTerms = asRecord(raw.terms);
  const tags = Array.isArray(rawTerms.tag)
    ? rawTerms.tag.flatMap((item) => {
        const tag = asRecord(item);
        return typeof tag.slug === 'string' && typeof tag.label === 'string'
          ? [{ slug: tag.slug, label: tag.label }]
          : [];
      })
    : [];
  const id =
    typeof root.id === 'string'
      ? root.id
      : typeof raw.id === 'string'
        ? raw.id
        : '';
  return {
    id,
    data: {
      id: typeof raw.id === 'string' ? raw.id : id,
      title: typeof raw.title === 'string' ? raw.title : '',
      excerpt: typeof raw.excerpt === 'string' ? raw.excerpt : undefined,
      content: raw.content,
      featured_image:
        typeof raw.featured_image === 'string' ||
        (typeof raw.featured_image === 'object' && raw.featured_image !== null)
          ? (raw.featured_image as MediaValue | string)
          : undefined,
      publishedAt: asDate(raw.publishedAt),
      updatedAt: asDate(raw.updatedAt),
      modified_time:
        asDate(raw.modified_time) ??
        (typeof raw.modified_time === 'string' ? raw.modified_time : undefined),
      terms: { tag: tags },
    },
  };
}

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

type PostSummary = { title: string; iconUrl?: string };

const BLOG_DIR = join(process.cwd(), 'contents', 'blog');

let summaries: Map<string, PostSummary> | undefined;

function loadSummaries(): Map<string, PostSummary> {
  const found = new Map<string, PostSummary>();
  for (const file of readdirSync(BLOG_DIR)) {
    if (!file.endsWith('.md')) {
      continue;
    }
    const { data } = matter(readFileSync(join(BLOG_DIR, file), 'utf8'));
    if (typeof data.slug === 'string' && typeof data.title === 'string') {
      found.set(data.slug, {
        title: data.title,
        iconUrl: typeof data.icon_url === 'string' ? data.icon_url : undefined,
      });
    }
  }
  return found;
}

export function findPost(slug: string): PostSummary | undefined {
  summaries ??= loadSummaries();
  return summaries.get(slug);
}

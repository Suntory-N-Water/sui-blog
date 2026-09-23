import { env } from 'cloudflare:workers';

type BlogTagRow = {
  id: string;
  slug: string;
  tag: string | null;
};

export async function countPublishedBlogs(): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS total FROM ec_blogs WHERE status = 'published' AND deleted_at IS NULL`,
  ).first<{ total: number }>();
  return row?.total ?? 0;
}

export async function findRelatedBlogSlugs(
  currentId: string,
  count: number,
): Promise<string[]> {
  const { results } = await env.DB.prepare(
    `SELECT p.id AS id, p.slug AS slug, t.slug AS tag
     FROM ec_blogs p
     LEFT JOIN content_taxonomies ct ON ct.collection = 'blogs' AND ct.entry_id = p.id
     LEFT JOIN taxonomies t ON t.id = ct.taxonomy_id AND t.name = 'tag'
     WHERE p.status = 'published' AND p.deleted_at IS NULL
     ORDER BY p.modified_time DESC, p.id`,
  ).all<BlogTagRow>();

  const documents = new Map<string, { slug: string; tags: Set<string> }>();
  for (const row of results) {
    const document = documents.get(row.id) ?? {
      slug: row.slug,
      tags: new Set<string>(),
    };
    if (row.tag) {
      document.tags.add(row.tag);
    }
    documents.set(row.id, document);
  }

  const current = documents.get(currentId);
  if (!current) {
    return [];
  }

  const documentFrequency = new Map<string, number>();
  for (const { tags } of documents.values()) {
    for (const tag of tags) {
      documentFrequency.set(tag, (documentFrequency.get(tag) ?? 0) + 1);
    }
  }

  const total = documents.size;
  const weightsOf = (tags: Set<string>) => {
    const weights = new Map<string, number>();
    for (const tag of tags) {
      const df = documentFrequency.get(tag) ?? 0;
      weights.set(tag, Math.log((total + 1) / (df + 1)) + 1);
    }
    const norm = Math.hypot(...weights.values());
    if (norm > 0) {
      for (const [tag, weight] of weights) {
        weights.set(tag, weight / norm);
      }
    }
    return weights;
  };

  const currentWeights = weightsOf(current.tags);
  const scored: { slug: string; similarity: number }[] = [];
  for (const [id, document] of documents) {
    if (id === currentId) {
      continue;
    }
    let similarity = 0;
    for (const [tag, weight] of weightsOf(document.tags)) {
      similarity += weight * (currentWeights.get(tag) ?? 0);
    }
    scored.push({ slug: document.slug, similarity });
  }

  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, count)
    .map(({ slug }) => slug);
}

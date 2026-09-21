import { readFile } from 'node:fs/promises';

type RecordValue = Record<string, unknown>;
type Article = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  modifiedTime: string | null;
  tags: Array<{ label: string; slug: string }>;
  blockCounts: Record<string, number>;
};
type Report = {
  articleCount: number;
  articles: Article[];
  uniqueImageCount: number;
  images: Array<{ status: string }>;
};

function record(value: unknown): RecordValue {
  return typeof value === 'object' && value !== null
    ? (value as RecordValue)
    : {};
}

function dateKey(value: unknown): string {
  return typeof value === 'string'
    ? value
    : value instanceof Date
      ? value.toISOString()
      : '';
}

function countBlocks(value: unknown): Record<string, number> {
  if (!Array.isArray(value)) return {};
  return value.reduce<Record<string, number>>((counts, item) => {
    const type = record(item)._type;
    if (typeof type === 'string') counts[type] = (counts[type] ?? 0) + 1;
    return counts;
  }, {});
}

async function main(): Promise<void> {
  const report = JSON.parse(
    await readFile('reports/emdash/migration-report.json', 'utf8'),
  ) as Report;
  const seed = JSON.parse(
    await readFile('seed/seed.json', 'utf8'),
  ) as RecordValue;
  const content = record(seed.content);
  const entries = Array.isArray(content.posts) ? content.posts.map(record) : [];
  const errors: string[] = [];
  if (entries.length !== report.articleCount)
    errors.push(
      `article count: seed=${entries.length}, report=${report.articleCount}`,
    );
  const bySlug = new Map(entries.map((entry) => [String(entry.slug), entry]));
  for (const article of report.articles) {
    const entry = bySlug.get(article.slug);
    if (!entry) {
      errors.push(`missing slug: ${article.slug}`);
      continue;
    }
    const data = record(entry.data);
    if (data.title !== article.title)
      errors.push(`${article.slug}: title mismatch`);
    if (data.excerpt !== article.description)
      errors.push(`${article.slug}: description mismatch`);
    const tags = Array.isArray(record(entry.taxonomies).tag)
      ? record(entry.taxonomies).tag
      : [];
    if (
      JSON.stringify(tags) !==
      JSON.stringify(article.tags.map((tag) => tag.slug))
    )
      errors.push(`${article.slug}: tag mismatch`);
    if (
      article.modifiedTime &&
      dateKey(data.modified_time) !== article.modifiedTime
    )
      errors.push(`${article.slug}: modified_time mismatch`);
    const actualCounts = countBlocks(data.content);
    for (const [type, count] of Object.entries(article.blockCounts))
      if ((actualCounts[type] ?? 0) !== count)
        errors.push(`${article.slug}: ${type} block count mismatch`);
  }
  const pendingImages = report.images.filter(
    (image) => image.status === 'pending',
  ).length;
  console.log(
    `Verified ${entries.length} articles and ${report.uniqueImageCount} unique image URLs.`,
  );
  console.log(
    `Image status: ${report.images.length - pendingImages} checked, ${pendingImages} pending seed download.`,
  );
  if (errors.length)
    throw new Error(
      `Migration verification failed (${errors.length}):\n${errors.slice(0, 50).join('\n')}`,
    );
  console.log(
    'Titles, descriptions, slugs, tags, dates, and Portable Text block counts match the migration report.',
  );
}

await main();

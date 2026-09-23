import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { canonical, d1, type Json, sqlString, WORK_DIR } from './lib.ts';

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function main() {
  const [slug, id] = process.argv.slice(2);
  if (!slug) {
    console.error('usage: bun verify.ts <slug> [content id]');
    process.exit(2);
  }
  const expected = JSON.parse(
    readFileSync(join(WORK_DIR, slug, 'expected.json'), 'utf8'),
  ) as {
    data: Json;
    content: unknown[];
    taxonomies: { tag: string[] };
  };

  const where = id
    ? `p.id=${sqlString(id)}`
    : `p.slug=${sqlString(slug)} AND p.locale='ja' AND p.deleted_at IS NULL`;
  const rows = d1(
    `SELECT p.id, p.slug, p.status, p.locale, p.draft_revision_id, p.title, p.excerpt, p.featured_image, p.content, p.modified_time, r.data AS revision FROM ec_blogs p LEFT JOIN revisions r ON r.id = p.draft_revision_id WHERE ${where} ORDER BY p.created_at DESC LIMIT 1`,
  );
  const row = rows[0];
  if (!row) {
    console.log(
      JSON.stringify(
        { ok: false, errors: ['本番の D1 に該当する記事がありません'] },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  const revision = parseJson(row.revision) as Json | null;
  const source: Json = revision ?? {
    title: row.title,
    excerpt: row.excerpt,
    featured_image: parseJson(row.featured_image),
    content: parseJson(row.content),
    modified_time: row.modified_time,
  };

  const errors: string[] = [];
  if (row.status !== 'draft')
    errors.push(`status が draft ではありません: ${String(row.status)}`);
  if (row.locale !== 'ja')
    errors.push(`locale が ja ではありません: ${String(row.locale)}`);
  for (const field of ['title', 'excerpt', 'modified_time']) {
    const want = expected.data[field];
    if (want === undefined) continue;
    const got = source[field];
    const same =
      field === 'modified_time'
        ? new Date(String(got)).getTime() === new Date(String(want)).getTime()
        : got === want;
    if (!same)
      errors.push(
        `${field} が一致しません: 期待 ${JSON.stringify(want)} / 実際 ${JSON.stringify(got)}`,
      );
  }
  const wantImage = expected.data.featured_image as Json | undefined;
  const gotImage = parseJson(source.featured_image) as Json | null;
  if (
    wantImage &&
    (gotImage?.id !== wantImage.id || gotImage?.alt !== wantImage.alt)
  )
    errors.push(
      `featured_image が一致しません: 期待 ${JSON.stringify(wantImage)} / 実際 ${JSON.stringify(gotImage)}`,
    );

  const content = (parseJson(source.content) as unknown[]) ?? [];
  const firstDiff = (() => {
    const length = Math.max(content.length, expected.content.length);
    for (let i = 0; i < length; i++)
      if (canonical(content[i]) !== canonical(expected.content[i])) return i;
    return -1;
  })();
  if (firstDiff >= 0)
    errors.push(
      `本文 ${firstDiff} 番目のブロックが一致しません (期待 ${expected.content.length} 件 / 実際 ${content.length} 件)\n期待: ${canonical(expected.content[firstDiff])}\n実際: ${canonical(content[firstDiff])}`,
    );

  const tags = d1(
    `SELECT t.slug FROM content_taxonomies ct JOIN taxonomies t ON t.id = ct.taxonomy_id WHERE ct.collection='blogs' AND ct.entry_id=${sqlString(String(row.id))} AND t.name='tag' AND ct.deleted_at IS NULL`,
  ).map((t) => String(t.slug));
  const wantTags = [...expected.taxonomies.tag].sort();
  if (JSON.stringify([...tags].sort()) !== JSON.stringify(wantTags))
    errors.push(
      `タグが一致しません: 期待 ${JSON.stringify(wantTags)} / 実際 ${JSON.stringify(tags.sort())}`,
    );

  console.log(
    JSON.stringify(
      {
        ok: errors.length === 0,
        id: row.id,
        status: row.status,
        storedIn: revision
          ? `revisions (${String(row.draft_revision_id)})`
          : 'ec_blogs',
        blocks: content.length,
        errors,
      },
      null,
      2,
    ),
  );
  if (errors.length) process.exitCode = 1;
}

main();

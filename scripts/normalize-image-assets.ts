import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const INTERNAL_MEDIA_PREFIX = '/_emdash/api/media/file/';

const remote = process.argv.includes('--remote');
const target = remote ? '--remote' : '--local';

function query<T>(sql: string): T[] {
  const out = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', 'DB', target, '--json', '--command', sql],
    { encoding: 'utf8', maxBuffer: 1024 * 1024 * 512 },
  );
  return JSON.parse(out)[0].results as T[];
}

function execSqlFile(statements: string[]): void {
  const dir = mkdtempSync(join(tmpdir(), 'emdash-normalize-'));
  const file = join(dir, 'normalize.sql');
  writeFileSync(file, statements.join('\n'));
  execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', 'DB', target, '--file', file],
    { stdio: 'inherit' },
  );
}

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

type MediaValue = {
  id?: string;
  provider?: string;
  meta?: { storageKey?: string };
};

function normalizeAsset(asset: unknown): { _ref: string; url: string } | null {
  if (typeof asset !== 'object' || asset === null) return null;
  if ('_ref' in asset) return null;

  const { id, provider, meta } = asset as MediaValue;
  if (!id) return null;

  const key = meta?.storageKey;
  return {
    _ref: id,
    url: key
      ? `${INTERNAL_MEDIA_PREFIX}${key}`
      : `${INTERNAL_MEDIA_PREFIX}${id}`,
    ...(provider && provider !== 'local' ? { provider } : {}),
  };
}

function normalizeBlocks(value: unknown, counter: { n: number }): boolean {
  if (Array.isArray(value)) {
    let changed = false;
    for (const item of value) {
      if (normalizeBlocks(item, counter)) changed = true;
    }
    return changed;
  }
  if (typeof value !== 'object' || value === null) return false;

  const node = value as Record<string, unknown>;
  let changed = false;

  if (node._type === 'image') {
    const normalized = normalizeAsset(node.asset);
    if (normalized) {
      node.asset = normalized;
      counter.n += 1;
      changed = true;
    }
  }

  for (const child of Object.values(node)) {
    if (normalizeBlocks(child, counter)) changed = true;
  }
  return changed;
}

const counter = { n: 0 };
const statements: string[] = [];

for (const row of query<{ id: string; content: string | null }>(
  'SELECT id, content FROM ec_posts WHERE content IS NOT NULL',
)) {
  const content = JSON.parse(row.content as string);
  if (normalizeBlocks(content, counter)) {
    statements.push(
      `UPDATE ec_posts SET content = ${sqlString(JSON.stringify(content))} WHERE id = ${sqlString(row.id)};`,
    );
  }
}

for (const row of query<{ id: string; data: string }>(
  'SELECT id, data FROM revisions',
)) {
  const data = JSON.parse(row.data);
  if (normalizeBlocks(data, counter)) {
    statements.push(
      `UPDATE revisions SET data = ${sqlString(JSON.stringify(data))} WHERE id = ${sqlString(row.id)};`,
    );
  }
}

if (statements.length === 0) {
  console.log('正規化が必要な画像ブロックはありません。');
} else {
  execSqlFile(statements);
  console.log(
    `画像ブロック ${counter.n} 件を ${statements.length} 行にわたって正規化しました。`,
  );
}

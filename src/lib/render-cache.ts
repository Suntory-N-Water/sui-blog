import { env, waitUntil } from 'cloudflare:workers';

const TABLE = 'render_cache';
const BATCH_SIZE = 90;
const MAX_ENTRIES = 2000;

const entries = new Map<string, string>();

export async function renderCacheKey(
  kind: string,
  ...parts: string[]
): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(parts.join('\0')),
  );
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `${kind}:${hex}`;
}

export function getRenderCache(key: string): string | undefined {
  return entries.get(key);
}

export async function prefetchRenderCache(keys: string[]): Promise<void> {
  const missing = [...new Set(keys)].filter((key) => !entries.has(key));
  const batches: string[][] = [];
  for (let index = 0; index < missing.length; index += BATCH_SIZE) {
    batches.push(missing.slice(index, index + BATCH_SIZE));
  }

  const results = await Promise.all(batches.map(readBatch));
  for (const rows of results) {
    for (const row of rows) {
      remember(row.key, row.value);
    }
  }
}

async function readBatch(
  keys: string[],
): Promise<{ key: string; value: string }[]> {
  try {
    const placeholders = keys.map(() => '?').join(',');
    const { results } = await env.DB.prepare(
      `SELECT key, value FROM ${TABLE} WHERE key IN (${placeholders}) AND expires_at > ?`,
    )
      .bind(...keys, Date.now())
      .all<{ key: string; value: string }>();
    return results;
  } catch {
    return [];
  }
}

export function setRenderCache(
  key: string,
  value: string,
  ttlSeconds: number,
): void {
  remember(key, value);
  waitUntil(
    env.DB.batch([
      env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS ${TABLE} (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires_at INTEGER NOT NULL)`,
      ),
      env.DB.prepare(
        `INSERT INTO ${TABLE} (key, value, expires_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at`,
      ).bind(key, value, Date.now() + ttlSeconds * 1000),
    ])
      .then(() => undefined)
      .catch(() => undefined),
  );
}

function remember(key: string, value: string): void {
  if (entries.size >= MAX_ENTRIES) {
    entries.clear();
  }
  entries.set(key, value);
}

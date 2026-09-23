import { execFileSync } from 'node:child_process';

export type Json = Record<string, unknown>;

export const PROJECT_ROOT = new URL('../../../../', import.meta.url).pathname;
export const WORK_DIR = '/tmp/emdash-draft';

export function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export function d1(sql: string): Json[] {
  const output = execFileSync(
    'npx',
    [
      'wrangler',
      'd1',
      'execute',
      'sui-blog',
      '--remote',
      '--json',
      '--command',
      sql,
    ],
    { cwd: PROJECT_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const parsed = JSON.parse(output) as Array<{ results?: Json[] }>;
  return parsed.flatMap((statement) => statement.results ?? []);
}

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeTextBlock(block: Json): Json {
  const markDefs = Array.isArray(block.markDefs)
    ? (block.markDefs as Json[])
    : [];
  const hrefByKey = new Map(
    markDefs
      .filter((def) => def._type === 'link')
      .map((def) => [def._key as string, `link:${String(def.href ?? '')}`]),
  );
  const extraDefs = markDefs
    .filter(
      (def) =>
        def._type !== 'link' ||
        Object.keys(def).some((k) => !['_key', '_type', 'href'].includes(k)),
    )
    .map((def) => normalize(def));
  const children = Array.isArray(block.children)
    ? (block.children as Json[])
    : [];
  const result: Json = {};
  for (const [key, value] of Object.entries(block)) {
    if (key === '_key' || key === 'markDefs' || key === 'children') continue;
    if (value === undefined) continue;
    result[key] = normalize(value);
  }
  result.children = children.map((child) => {
    const marks = Array.isArray(child.marks) ? (child.marks as string[]) : [];
    const normalized: Json = {};
    for (const [key, value] of Object.entries(child)) {
      if (key === '_key' || key === 'marks' || value === undefined) continue;
      normalized[key] = normalize(value);
    }
    if (marks.length)
      normalized.marks = marks.map((mark) => hrefByKey.get(mark) ?? mark);
    return normalized;
  });
  if (extraDefs.length) result.markDefs = extraDefs;
  return result;
}

export function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => normalize(item));
  if (!isObject(value)) return value;
  if (
    value._type === 'block' ||
    (Array.isArray(value.markDefs) && Array.isArray(value.children))
  )
    return normalizeTextBlock(value);
  const result: Json = {};
  for (const key of Object.keys(value).sort()) {
    const item = value[key];
    if (key === '_key' || item === undefined) continue;
    if (
      (key === 'marks' || key === 'markDefs') &&
      Array.isArray(item) &&
      item.length === 0
    )
      continue;
    result[key] = normalize(item);
  }
  return result;
}

export function canonical(value: unknown): string {
  return JSON.stringify(sortKeys(normalize(value)));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sortKeys(item));
  if (!isObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortKeys(value[key])]),
  );
}

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import chars from '@iconify-json/fluent-emoji-flat/chars.json' with { type: 'json' };
import icons from '@iconify-json/fluent-emoji-flat/icons.json' with { type: 'json' };
import { getIconData, iconToHTML, iconToSVG } from '@iconify/utils';
import matter from 'gray-matter';

const ROOT = join(import.meta.dirname, '..');
const BLOG_DIR = join(ROOT, 'contents', 'blog');
const ICONS_DIR = join(ROOT, 'public', 'icons');

function codepointsOf(emoji: string): string {
  return [...emoji]
    .map((c) => (c.codePointAt(0) ?? 0).toString(16))
    .filter((cp) => cp !== 'fe0f')
    .join('-');
}

function iconNameOf(icon: string): string {
  if (/^https?:\/\//u.test(icon)) {
    return basename(new URL(icon).pathname, '.svg')
      .replace(/_flat(_default)?$/u, '')
      .replaceAll('_', '-');
  }
  const name = (chars as Record<string, string>)[codepointsOf(icon)];
  if (!name) {
    throw new Error(`${icon} に対応する Fluent Emoji Flat のアイコンがありません`);
  }
  return name;
}

function ensureIconFile(name: string): string {
  const base = name.replaceAll('-', '_');
  const existing = [`${base}_flat.svg`, `${base}_flat_default.svg`].find((f) =>
    existsSync(join(ICONS_DIR, f)),
  );
  if (existing) {
    return existing;
  }
  const data = getIconData(icons as Parameters<typeof getIconData>[0], name);
  if (!data) {
    throw new Error(`${name} のアイコンデータがありません`);
  }
  const { attributes, body } = iconToSVG(data, { height: 'auto' });
  const filename = `${base}_flat.svg`;
  mkdirSync(ICONS_DIR, { recursive: true });
  writeFileSync(join(ICONS_DIR, filename), `${iconToHTML(body, attributes)}\n`);
  console.log(`ダウンロードしました: ${filename}`);
  return filename;
}

function withIconUrl(source: string, iconUrl: string): string {
  const end = source.indexOf('\n---', 3);
  const head = source.slice(0, end);
  const rest = source.slice(end);
  const line = `icon_url: ${iconUrl}`;
  if (/^icon_url:.*$/mu.test(head)) {
    return head.replace(/^icon_url:.*$/mu, line) + rest;
  }
  return head.replace(/^(icon:.*)$/mu, `$1\n${line}`) + rest;
}

let updated = 0;
for (const file of readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'))) {
  const path = join(BLOG_DIR, file);
  const source = readFileSync(path, 'utf8');
  const { data } = matter(source);
  const icon = typeof data.icon === 'string' ? data.icon.trim() : '';
  if (!icon) {
    continue;
  }
  const iconUrl = `/icons/${ensureIconFile(iconNameOf(icon))}`;
  if (data.icon_url === iconUrl) {
    continue;
  }
  writeFileSync(path, withIconUrl(source, iconUrl));
  console.log(`icon_url を更新しました: ${file} → ${iconUrl}`);
  updated += 1;
}
console.log(`${updated} 件の記事を更新しました`);

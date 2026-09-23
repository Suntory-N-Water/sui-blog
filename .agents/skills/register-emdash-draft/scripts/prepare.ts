import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

import { markdownToPortableText, portableTextToMarkdown } from 'emdash/client';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import { remarkAlert } from 'remark-github-blockquote-alert';

import { canonical, d1, type Json, sqlString, WORK_DIR } from './lib.ts';

type Node = Json & { type: string; children?: Node[] };
type Span = { _type: 'span'; _key: string; text: string; marks?: string[] };
type Block = Json & { _type: string; _key: string };
type Piece = { kind: 'span'; span: Span } | { kind: 'image'; image: Block };

type ImageRef = { url: string; filename: string; alt: string };
type MediaRow = {
  id: string;
  filename: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  storage_key: string;
};

const ALERT_LABELS: Record<string, string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
};
const ALERT_ALIASES: Record<string, string> = { INFO: 'NOTE', TIPS: 'TIP' };

const processor = remark().use(remarkGfm).use(remarkAlert);

let counter = 0;
const key = (_kind: string) => `p${(++counter).toString(36)}`;

const warnings: string[] = [];
const images: ImageRef[] = [];

const children = (node: Node): Node[] =>
  Array.isArray(node.children) ? node.children : [];
const str = (value: unknown) => (typeof value === 'string' ? value : undefined);

function rewriteLegacyUrl(value: string): string {
  return value.replace(
    /https:\/\/suntory-n-water\.com\/blog\/([\w-]+)/gu,
    '/blog/$1',
  );
}

function filenameOf(url: string): string {
  try {
    return basename(new URL(url, 'https://suntory-n-water.com/').pathname);
  } catch {
    return basename(url);
  }
}

function imageBlock(url: string, alt: string | undefined): Block {
  const ref: ImageRef = {
    url,
    filename: filenameOf(url),
    alt: alt?.trim() ?? '',
  };
  images.push(ref);
  return {
    _type: 'image',
    _key: key('image'),
    $image: ref,
    ...(ref.alt ? { alt: ref.alt } : {}),
  };
}

function span(text: string, marks: string[]): Span {
  return {
    _type: 'span',
    _key: key('span'),
    text,
    ...(marks.length ? { marks } : {}),
  };
}

function inline(
  nodes: Node[],
  marks: string[] = [],
): { pieces: Piece[]; markDefs: Json[] } {
  const pieces: Piece[] = [];
  const markDefs: Json[] = [];
  const push = (text: string, extra: string[] = []) =>
    pieces.push({ kind: 'span', span: span(text, [...marks, ...extra]) });
  for (const node of nodes) {
    switch (node.type) {
      case 'text': {
        const text = rewriteLegacyUrl(str(node.value) ?? '');
        if (text) push(text);
        break;
      }
      case 'break':
        push('\n');
        break;
      case 'inlineCode':
        push(str(node.value) ?? '', ['code']);
        break;
      case 'strong':
      case 'emphasis':
      case 'delete': {
        const mark =
          node.type === 'strong'
            ? 'strong'
            : node.type === 'emphasis'
              ? 'em'
              : 'strike-through';
        const nested = inline(children(node), [...marks, mark]);
        pieces.push(...nested.pieces);
        markDefs.push(...nested.markDefs);
        break;
      }
      case 'link': {
        const href = rewriteLegacyUrl(str(node.url) ?? '');
        if (!href) {
          warnings.push('URL のないリンクを文字列として残しました');
          const nested = inline(children(node), marks);
          pieces.push(...nested.pieces);
          markDefs.push(...nested.markDefs);
          break;
        }
        const linkKey = key('link');
        markDefs.push({
          _type: 'link',
          _key: linkKey,
          href,
          ...(str(node.title) ? { title: node.title } : {}),
        });
        const nested = inline(children(node), [...marks, linkKey]);
        pieces.push(...nested.pieces);
        markDefs.push(...nested.markDefs);
        break;
      }
      case 'image': {
        const url = str(node.url);
        if (url)
          pieces.push({ kind: 'image', image: imageBlock(url, str(node.alt)) });
        break;
      }
      case 'footnoteReference': {
        const id = str(node.label) ?? str(node.identifier) ?? '?';
        if (marks.includes('code'))
          warnings.push(`脚注 [^${id}] がコード内にあります`);
        push(`[^${id}]`);
        break;
      }
      case 'html': {
        const raw = str(node.value) ?? '';
        const src = raw.match(/\bsrc\s*=\s*["']([^"']+)["']/iu)?.[1];
        if (src && /^\s*<img\b/iu.test(raw)) {
          const alt = raw.match(/\balt\s*=\s*["']([^"']*)["']/iu)?.[1];
          pieces.push({ kind: 'image', image: imageBlock(src, alt) });
        } else if (/^\s*<br\s*\/?>\s*$/iu.test(raw)) {
          push('\n');
        } else {
          warnings.push(
            `行内の HTML を文字列として残しました: ${raw.slice(0, 80)}`,
          );
          push(raw);
        }
        break;
      }
      default:
        warnings.push(`未対応の行内要素 ${node.type} を文字列として残しました`);
        if (str(node.value)) push(str(node.value) as string);
    }
  }
  return { pieces, markDefs };
}

function mergeSpans(spans: Span[]): Span[] {
  const merged: Span[] = [];
  for (const current of spans) {
    const last = merged.at(-1);
    if (
      last &&
      (last.marks ?? []).join('\0') === (current.marks ?? []).join('\0')
    ) {
      last.text += current.text;
      continue;
    }
    merged.push({ ...current });
  }
  return merged;
}

function textBlocks(
  nodes: Node[],
  style: string,
  list?: { listItem: string; level: number },
): Block[] {
  const { pieces, markDefs } = inline(nodes);
  const blocks: Block[] = [];
  let spans: Span[] = [];
  const flush = () => {
    if (!spans.length) return;
    const merged = mergeSpans(spans);
    const used = new Set(merged.flatMap((s) => s.marks ?? []));
    const defs = markDefs.filter((def) => used.has(def._key as string));
    blocks.push({
      _type: 'block',
      _key: key('block'),
      style,
      children: merged,
      markDefs: defs,
      ...(list ?? {}),
    });
    spans = [];
  };
  for (const piece of pieces) {
    if (piece.kind === 'image') {
      flush();
      blocks.push(piece.image);
    } else spans.push(piece.span);
  }
  flush();
  return blocks;
}

function tableBlock(node: Node): Block {
  const rows = children(node).map((row, rowIndex) => ({
    _type: 'tableRow',
    _key: key('table-row'),
    cells: children(row).map((cell) => {
      const { pieces, markDefs } = inline(children(cell));
      if (pieces.some((p) => p.kind === 'image'))
        warnings.push('表のセル内の画像は変換できないため省きました');
      if (
        children(cell).some(function hasFootnote(n: Node): boolean {
          return (
            n.type === 'footnoteReference' || children(n).some(hasFootnote)
          );
        })
      )
        warnings.push(
          '表のセル内の脚注参照は番号付きリンクにならず [^id] の文字のまま表示されます',
        );
      const spans = mergeSpans(
        pieces.flatMap((p) => (p.kind === 'span' ? [p.span] : [])),
      );
      return {
        _type: 'tableCell',
        _key: key('table-cell'),
        content: spans.length
          ? spans
          : [{ _type: 'span', _key: key('span'), text: '' }],
        ...(markDefs.length ? { markDefs } : {}),
        ...(rowIndex === 0 ? { isHeader: true } : {}),
      };
    }),
  }));
  return {
    _type: 'table',
    _key: key('table'),
    rows,
    hasHeaderRow: rows.length > 0,
  };
}

function alertLabel(node: Node): string | null {
  const className = (
    (node.data as Json | undefined)?.hProperties as Json | undefined
  )?.className;
  if (!Array.isArray(className)) return null;
  for (const name of className) {
    const kind =
      typeof name === 'string' && name.startsWith('markdown-alert-')
        ? name.slice(15)
        : null;
    if (kind && ALERT_LABELS[kind]) return ALERT_LABELS[kind];
  }
  return null;
}

function stripAlertTitle(nodes: Node[]): Node[] {
  const [first, ...rest] = nodes;
  if (!first) return nodes;
  const className = (
    (first.data as Json | undefined)?.hProperties as Json | undefined
  )?.className;
  const names = Array.isArray(className) ? className : [className];
  return names.includes('markdown-alert-title') ? rest : nodes;
}

function listBlocks(node: Node, level: number): Block[] {
  const listItem = node.ordered === true ? 'number' : 'bullet';
  const result: Block[] = [];
  for (const item of children(node)) {
    for (const child of children(item)) {
      if (child.type === 'paragraph')
        result.push(
          ...textBlocks(children(child), 'normal', { listItem, level }),
        );
      else if (child.type === 'list')
        result.push(...listBlocks(child, level + 1));
      else result.push(...flow([child]));
    }
  }
  return result;
}

const footnoteDefinitions: Array<{ id: string; node: Node }> = [];

function flow(nodes: Node[]): Block[] {
  const result: Block[] = [];
  for (const node of nodes) {
    switch (node.type) {
      case 'heading':
        result.push(
          ...textBlocks(
            children(node),
            `h${Math.min(Math.max(Number(node.depth), 1), 6)}`,
          ),
        );
        break;
      case 'paragraph':
        result.push(...textBlocks(children(node), 'normal'));
        break;
      case 'blockquote': {
        const label = alertLabel(node);
        const inner = label ? stripAlertTitle(children(node)) : children(node);
        if (label)
          result.push({
            _type: 'block',
            _key: key('block'),
            style: 'blockquote',
            children: [span(label, ['strong'])],
            markDefs: [],
          });
        for (const block of flow(inner)) {
          if (block._type === 'block') block.style = 'blockquote';
          result.push(block);
        }
        break;
      }
      case 'list':
        result.push(...listBlocks(node, 1));
        break;
      case 'code': {
        const language = str(node.lang);
        const meta = str(node.meta)?.trim();
        const filename = meta
          ? (/(?:^|\s)title=(?:"([^"]*)"|'([^']*)'|(\S+))/u
              .exec(meta)
              ?.slice(1)
              .find(Boolean) ?? meta.split(/\s+/u)[0])
          : undefined;
        result.push({
          _type: 'code',
          _key: key('code'),
          code: str(node.value) ?? '',
          ...(language ? { language } : {}),
          ...(filename ? { filename } : {}),
        });
        break;
      }
      case 'table':
        result.push(tableBlock(node));
        break;
      case 'thematicBreak':
        result.push({ _type: 'htmlBlock', _key: key('html'), html: '<hr />' });
        break;
      case 'html': {
        const raw = str(node.value) ?? '';
        const src = raw.match(/\bsrc\s*=\s*["']([^"']+)["']/iu)?.[1];
        if (src && /^\s*<img\b/iu.test(raw)) {
          const alt = raw.match(/\balt\s*=\s*["']([^"']*)["']/iu)?.[1];
          result.push(imageBlock(src, alt));
        } else if (raw.trim() && !/^<!--[\s\S]*-->$/u.test(raw.trim())) {
          warnings.push(
            `HTML をそのまま htmlBlock に入れました: ${raw.slice(0, 80)}`,
          );
          result.push({ _type: 'htmlBlock', _key: key('html'), html: raw });
        }
        break;
      }
      case 'footnoteDefinition':
        footnoteDefinitions.push({
          id: str(node.label) ?? str(node.identifier) ?? '?',
          node,
        });
        break;
      case 'definition':
        warnings.push('参照形式のリンク定義は変換されません');
        break;
      default:
        warnings.push(`未対応のブロック ${node.type} をコードとして残しました`);
        result.push({
          _type: 'code',
          _key: key('code'),
          code: String(node.value ?? ''),
          language: 'text',
        });
    }
  }
  return result;
}

function footnoteBlocks(): Block[] {
  return footnoteDefinitions.map(({ id, node }) => {
    const paragraphs = children(node).filter(
      (child) => child.type === 'paragraph',
    );
    if (paragraphs.length !== children(node).length)
      warnings.push(`脚注 [^${id}] の段落以外の要素は省きました`);
    const nodes: Node[] = paragraphs.flatMap((p, index) =>
      index === 0 ? children(p) : [{ type: 'break' }, ...children(p)],
    );
    const [block] = textBlocks(nodes, 'normal');
    const body = (block?.children as Span[] | undefined) ?? [];
    const merged = mergeSpans([span(`[^${id}]: `, []), ...body]);
    return {
      _type: 'block',
      _key: key('block'),
      style: 'normal',
      children: merged,
      markDefs: block?.markDefs ?? [],
    };
  });
}

function toMarkdownLine(block: Block): string | null {
  if (block._type !== 'block' && block._type !== 'code') return null;
  const markdown = portableTextToMarkdown([block as never]).replace(/\n$/u, '');
  if (block._type === 'block' && markdown.includes('\n')) return null;
  const parsed = markdownToPortableText(markdown) as unknown as Block[];
  if (parsed.length !== 1) return null;
  return canonical(parsed[0]) === canonical(block) ? markdown : null;
}

function fence(block: Block): string {
  return `<!--ec:block ${JSON.stringify(block)} -->`;
}

function mediaByFilename(filenames: string[]): Map<string, MediaRow> {
  if (!filenames.length) return new Map();
  const rows = d1(
    `SELECT id, filename, mime_type, width, height, storage_key FROM media WHERE status='ready' AND filename IN (${filenames.map(sqlString).join(',')}) ORDER BY created_at`,
  ) as unknown as MediaRow[];
  return new Map(rows.map((row) => [row.filename, row]));
}

function normalizeDate(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const raw =
    value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/u.test(raw)) return `${raw}T00:00:00.000Z`;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime()))
    throw new Error(`日付として読めません: ${raw}`);
  return parsed.toISOString();
}

function main() {
  const args = process.argv.slice(2);
  const slugOption = args.indexOf('--slug');
  const slugOverride =
    slugOption >= 0 ? args.splice(slugOption, 2)[1] : undefined;
  const input = args[0];
  if (!input) {
    console.error(
      'usage: bun prepare.ts contents/blog/<YYYY-MM-DD>_<slug>.md [--slug <slug>]',
    );
    process.exit(2);
  }
  const sourcePath = resolve(input);
  const parsed = matter(readFileSync(sourcePath, 'utf8'));
  const data = parsed.data as Json;
  const slug =
    slugOverride ??
    String(
      data.slug ??
        basename(sourcePath, '.md').replace(/^\d{4}-\d{2}-\d{2}_/u, ''),
    );
  const title = String(data.title ?? '').trim();
  const excerpt = String(data.description ?? '').trim();
  const errors: string[] = [];
  if (!title) errors.push('frontmatter の title がありません');
  if (!excerpt) errors.push('frontmatter の description がありません');

  const body = parsed.content.replace(
    /^(\s*>\s*)\[!([A-Za-z]+)\]/gmu,
    (match, prefix: string, kind: string) => {
      const alias = ALERT_ALIASES[kind.toUpperCase()];
      return alias ? `${prefix}[!${alias}]` : match;
    },
  );
  const tree = processor.runSync(processor.parse(body)) as unknown as Node;
  const blocks = [...flow(children(tree)), ...footnoteBlocks()];

  const iconFilename =
    typeof data.icon_url === 'string' ? filenameOf(data.icon_url) : undefined;
  const media = mediaByFilename([
    ...new Set([
      ...images.map((i) => i.filename),
      ...(iconFilename ? [iconFilename] : []),
    ]),
  ]);

  const missingImages: ImageRef[] = [];
  for (const block of blocks) {
    const ref = block.$image as ImageRef | undefined;
    if (!ref) continue;
    delete block.$image;
    const row = media.get(ref.filename);
    if (!row) {
      if (!missingImages.some((m) => m.filename === ref.filename))
        missingImages.push(ref);
      continue;
    }
    block.asset = {
      provider: 'local',
      id: row.id,
      ...(ref.alt ? { alt: ref.alt } : {}),
      ...(row.width ? { width: row.width } : {}),
      ...(row.height ? { height: row.height } : {}),
      mimeType: row.mime_type,
      filename: row.filename,
      meta: { storageKey: row.storage_key },
    };
  }

  let featuredImage: Json | undefined;
  let missingIcon: string | undefined;
  if (iconFilename) {
    const row = media.get(iconFilename);
    if (row) featuredImage = { id: row.id, provider: 'local', alt: title };
    else missingIcon = iconFilename;
  } else
    warnings.push('frontmatter に icon_url がないため OGP画像 を設定しません');

  const rawTags = Array.isArray(data.tags)
    ? data.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];
  const tagRows = d1(
    "SELECT slug, label FROM taxonomies WHERE name='tag' AND locale='ja'",
  ) as Array<{
    slug: string;
    label: string;
  }>;
  const tagSlugs: string[] = [];
  const unknownTags: Array<{ label: string; suggestedSlug: string }> = [];
  for (const tag of rawTags) {
    const lower = tag.toLowerCase();
    const row = tagRows.find(
      (r) => r.label.toLowerCase() === lower || r.slug === lower,
    );
    if (row) tagSlugs.push(row.slug);
    else
      unknownTags.push({
        label: tag,
        suggestedSlug: lower
          .replace(/[^a-z0-9]+/gu, '-')
          .replace(/^-|-$/gu, ''),
      });
  }

  const lines: string[] = [];
  let fenced = 0;
  for (const block of blocks) {
    const markdown = toMarkdownLine(block);
    if (markdown === null) fenced += 1;
    lines.push(markdown ?? fence(block));
  }
  const contentMarkdown = `${lines.join('\n\n')}\n`;

  const roundTrip = markdownToPortableText(
    contentMarkdown,
  ) as unknown as Block[];
  if (canonical(roundTrip) !== canonical(blocks))
    errors.push('Markdown に戻した本文を読み直すと元のブロックと一致しません');

  const outDir = join(WORK_DIR, slug);
  mkdirSync(outDir, { recursive: true });
  const payload = {
    slug,
    data: {
      title,
      excerpt,
      ...(featuredImage ? { featured_image: featuredImage } : {}),
      ...(normalizeDate(data.modified_time ?? data.date)
        ? { modified_time: normalizeDate(data.modified_time ?? data.date) }
        : {}),
    },
    taxonomies: { tag: tagSlugs },
  };
  writeFileSync(join(outDir, 'content.md'), contentMarkdown);
  writeFileSync(
    join(outDir, 'payload.json'),
    `${JSON.stringify(payload, null, 2)}\n`,
  );
  writeFileSync(
    join(outDir, 'expected.json'),
    `${JSON.stringify({ ...payload, content: blocks }, null, 2)}\n`,
  );

  const existing = d1(
    `SELECT id, status, deleted_at FROM ec_blogs WHERE slug=${sqlString(slug)} AND locale='ja'`,
  );

  const report = {
    ready:
      errors.length === 0 &&
      missingImages.length === 0 &&
      !missingIcon &&
      unknownTags.length === 0,
    slug,
    files: {
      content: join(outDir, 'content.md'),
      payload: join(outDir, 'payload.json'),
      expected: join(outDir, 'expected.json'),
    },
    blocks: blocks.length,
    fencedBlocks: fenced,
    existingPost: existing[0] ?? null,
    missingImages,
    missingIcon: missingIcon ?? null,
    unknownTags,
    errors,
    warnings,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.ready) process.exitCode = 1;
}

main();

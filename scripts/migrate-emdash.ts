import { createHash } from 'node:crypto';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

import matter from 'gray-matter';
import rehypeStringify from 'rehype-stringify';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import { remarkAlert } from 'remark-github-blockquote-alert';
import remarkRehype from 'remark-rehype';

import { getTagSlug } from '../src/config/tag-slugs.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const CONTENTS_DIR = join(ROOT, 'contents', 'blog');
const SEED_PATH = join(ROOT, 'seed', 'seed.json');
const REPORT_DIR = join(ROOT, 'reports', 'emdash');
const SITE_ORIGIN = process.env.PUBLIC_APP_URL ?? 'https://suntory-n-water.com';

type UnknownRecord = Record<string, unknown>;
type MarkdownNode = UnknownRecord & { type: string };

type PortableTextSpan = {
  _type: 'span';
  _key: string;
  text: string;
  marks?: string[];
};

type PortableTextBlock = UnknownRecord & {
  _type: string;
  _key: string;
};

type ImageReference = {
  url: string;
  alt?: string;
  filename?: string;
  caption?: string;
};

type ImageInventoryItem = ImageReference & {
  articles: string[];
  sources: string[];
  kinds: string[];
  status: 'pending' | 'ok' | 'failed';
  statusCode?: number;
  error?: string;
};

type ArticleReport = {
  source: string;
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  modifiedTime: string | null;
  tags: Array<{ label: string; slug: string }>;
  blockCounts: Record<string, number>;
  imageCount: number;
  unsupported: string[];
  frontmatterFeatures: string[];
  bodySha256: string;
};

type MigrationReport = {
  generatedAt: string;
  sourceDirectory: string;
  articleCount: number;
  articles: ArticleReport[];
  unsupportedTotal: number;
  imageCount: number;
  uniqueImageCount: number;
  images: ImageInventoryItem[];
};

type ConverterContext = {
  slug: string;
  sourcePath: string;
  warnings: string[];
  images: Array<ImageInventoryItem & { source: string; kind: string }>;
  linkCounter: number;
  blockCounter: number;
  footnoteNumbers: Map<string, number>;
  footnoteDefinitions: Map<string, MarkdownNode>;
};

type InlinePiece =
  | { kind: 'span'; span: PortableTextSpan }
  | { kind: 'image'; image: PortableTextBlock };

const processor = remark().use(remarkGfm).use(remarkAlert);
const htmlProcessor = remark()
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStringify);

const ALERT_LABELS: Record<string, string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
};

const ALERT_ALIASES: Record<string, string> = {
  INFO: 'NOTE',
  TIPS: 'TIP',
};

function asRecord(value: unknown): UnknownRecord {
  return typeof value === 'object' && value !== null
    ? (value as UnknownRecord)
    : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asChildren(node: MarkdownNode): MarkdownNode[] {
  return Array.isArray(node.children)
    ? node.children.filter(
        (child): child is MarkdownNode =>
          typeof child === 'object' && child !== null,
      )
    : [];
}

function nodeRaw(node: MarkdownNode, source: string): string {
  const position = asRecord(node.position);
  const start = asRecord(position.start).offset;
  const end = asRecord(position.end).offset;
  if (typeof start === 'number' && typeof end === 'number')
    return source.slice(start, end);
  return asString(node.value) ?? '';
}

function key(context: ConverterContext, prefix: string): string {
  context.blockCounter += 1;
  return `${prefix}-${context.blockCounter}`;
}

function normalizedDate(
  value: unknown,
  field: string,
  sourcePath: string,
): string {
  const raw =
    value instanceof Date ? value.toISOString() : String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T00:00:00.000Z`;
  const parsed = new Date(raw);
  if (!raw || Number.isNaN(parsed.getTime())) {
    throw new Error(
      `${sourcePath}: ${field} must be an ISO date, got ${JSON.stringify(value)}`,
    );
  }
  return parsed.toISOString();
}

function resolveImageUrl(value: string): string | null {
  const raw = value.trim();
  if (!raw || raw.startsWith('data:') || raw.startsWith('blob:')) return null;
  try {
    return new URL(raw, `${SITE_ORIGIN.replace(/\/$/, '')}/`).toString();
  } catch {
    return null;
  }
}

function imageFilename(url: string, fallback: string): string {
  try {
    const name = basename(new URL(url).pathname);
    return name && name !== '/' ? name : fallback;
  } catch {
    return fallback;
  }
}

function addImage(
  context: ConverterContext,
  url: string,
  article: string,
  kind: string,
  alt?: string,
  filename?: string,
): ImageReference | null {
  const resolved = resolveImageUrl(url);
  if (!resolved) {
    context.warnings.push(
      `${kind}: unsupported image URL ${JSON.stringify(url)}`,
    );
    return null;
  }
  const image: ImageReference = {
    url: resolved,
    alt: alt?.trim() || undefined,
    filename:
      filename?.trim() || imageFilename(resolved, `${context.slug}.img`),
  };
  context.images.push({
    ...image,
    articles: [article],
    sources: [context.sourcePath],
    kinds: [kind],
    status: 'pending',
    source: context.sourcePath,
    kind,
  });
  return image;
}

function mediaReference(image: ImageReference): UnknownRecord {
  return {
    $media: {
      url: image.url,
      ...(image.filename ? { filename: image.filename } : {}),
      ...(image.alt ? { alt: image.alt } : {}),
      ...(image.caption ? { caption: image.caption } : {}),
    },
  };
}

function imageBlock(
  context: ConverterContext,
  image: ImageReference,
  alt?: string,
): PortableTextBlock {
  return {
    _type: 'image',
    _key: key(context, 'image'),
    asset: mediaReference(image),
    ...(alt ? { alt } : {}),
  };
}

function markDefKey(context: ConverterContext): string {
  context.linkCounter += 1;
  return `link-${context.linkCounter}`;
}

function footnoteAnchor(identifier: string): string {
  return `fn-${identifier.replace(/[^\w-]+/gu, '-')}`;
}

function footnoteNumber(context: ConverterContext, identifier: string): number {
  const existing = context.footnoteNumbers.get(identifier);
  if (existing) return existing;
  const next = context.footnoteNumbers.size + 1;
  context.footnoteNumbers.set(identifier, next);
  return next;
}

function rewriteLegacyUrl<T extends string | undefined>(value: T): T {
  if (value === undefined) return value;
  return value.replace(
    /https:\/\/suntory-n-water\.com\/blog\/([\w-]+)/gu,
    '/posts/$1',
  ) as T;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;');
}

function footnotesBlock(context: ConverterContext): PortableTextBlock | null {
  for (const [identifier] of context.footnoteDefinitions) {
    if (context.footnoteNumbers.has(identifier)) continue;
    context.warnings.push(
      `footnote ${identifier}: defined without a reference`,
    );
    footnoteNumber(context, identifier);
  }
  const entries = [...context.footnoteNumbers.entries()].sort(
    ([, a], [, b]) => a - b,
  );
  const items = entries.map(([identifier]) => {
    const definition = context.footnoteDefinitions.get(identifier);
    if (!definition) {
      context.warnings.push(
        `footnote ${identifier}: referenced without a definition`,
      );
      return `<li id="${escapeHtml(footnoteAnchor(identifier))}"></li>`;
    }
    const root = { type: 'root', children: definition.children ?? [] };
    const html = htmlProcessor.stringify(
      htmlProcessor.runSync(root as never) as never,
    );
    return `<li id="${escapeHtml(footnoteAnchor(identifier))}">${html}</li>`;
  });
  if (!items.length) return null;
  return htmlBlock(
    context,
    `<section class="footnotes"><h2>脚注</h2><ol>${items.join('')}</ol></section>`,
  );
}

function inlinePieces(
  nodes: MarkdownNode[],
  context: ConverterContext,
  article: string,
  marks: string[] = [],
): { pieces: InlinePiece[]; markDefs: UnknownRecord[] } {
  const pieces: InlinePiece[] = [];
  const markDefs: UnknownRecord[] = [];
  for (const node of nodes) {
    const type = node.type;
    if (type === 'text') {
      const text = rewriteLegacyUrl(asString(node.value)) ?? '';
      if (text)
        pieces.push({
          kind: 'span',
          span: {
            _type: 'span',
            _key: key(context, 'span'),
            text,
            ...(marks.length ? { marks } : {}),
          },
        });
      continue;
    }
    if (type === 'break') {
      pieces.push({
        kind: 'span',
        span: {
          _type: 'span',
          _key: key(context, 'span'),
          text: '\n',
          ...(marks.length ? { marks } : {}),
        },
      });
      continue;
    }
    if (type === 'inlineCode') {
      const text = asString(node.value) ?? '';
      pieces.push({
        kind: 'span',
        span: {
          _type: 'span',
          _key: key(context, 'span'),
          text,
          marks: [...marks, 'code'],
        },
      });
      continue;
    }
    if (type === 'strong' || type === 'emphasis' || type === 'delete') {
      const mark =
        type === 'strong'
          ? 'strong'
          : type === 'emphasis'
            ? 'em'
            : 'strike-through';
      const nested = inlinePieces(asChildren(node), context, article, [
        ...marks,
        mark,
      ]);
      pieces.push(...nested.pieces);
      markDefs.push(...nested.markDefs);
      continue;
    }
    if (type === 'link') {
      const url = rewriteLegacyUrl(asString(node.url));
      if (!url) {
        context.warnings.push(
          'link: missing URL; link text was preserved without a mark',
        );
        const nested = inlinePieces(asChildren(node), context, article, marks);
        pieces.push(...nested.pieces);
        markDefs.push(...nested.markDefs);
        continue;
      }
      const linkKey = markDefKey(context);
      markDefs.push({
        _type: 'link',
        _key: linkKey,
        href: url,
        ...(asString(node.title) ? { title: node.title } : {}),
      });
      const nested = inlinePieces(asChildren(node), context, article, [
        ...marks,
        linkKey,
      ]);
      pieces.push(...nested.pieces);
      markDefs.push(...nested.markDefs);
      continue;
    }
    if (type === 'image') {
      const url = asString(node.url);
      const image = url
        ? addImage(
            context,
            url,
            article,
            'body',
            asString(node.alt),
            imageFilename(url, `${context.slug}.img`),
          )
        : null;
      if (image)
        pieces.push({
          kind: 'image',
          image: imageBlock(context, image, asString(node.alt)),
        });
      else
        context.warnings.push('image: original image syntax was not converted');
      continue;
    }
    if (type === 'footnoteReference') {
      const identifier =
        asString(node.identifier) ?? asString(node.label) ?? '?';
      const linkKey = markDefKey(context);
      markDefs.push({
        _type: 'link',
        _key: linkKey,
        href: `#${footnoteAnchor(identifier)}`,
      });
      pieces.push({
        kind: 'span',
        span: {
          _type: 'span',
          _key: key(context, 'span'),
          text: String(footnoteNumber(context, identifier)),
          marks: [...marks, 'superscript', linkKey],
        },
      });
      continue;
    }
    if (type === 'html') {
      const raw = asString(node.value) ?? '';
      const imageSource = raw.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
      if (imageSource && /^\s*<img\b/i.test(raw)) {
        const alt = raw.match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1];
        const image = addImage(
          context,
          imageSource,
          article,
          'html-img',
          alt,
          imageFilename(imageSource, `${context.slug}.img`),
        );
        if (image)
          pieces.push({
            kind: 'image',
            image: imageBlock(context, image, alt),
          });
        else
          context.warnings.push('image: original HTML image was not converted');
        continue;
      }
      if (/^\s*<br\s*\/?>\s*$/i.test(raw)) {
        pieces.push({
          kind: 'span',
          span: {
            _type: 'span',
            _key: key(context, 'span'),
            text: '\n',
            ...(marks.length ? { marks } : {}),
          },
        });
      } else {
        context.warnings.push(
          `inline HTML preserved as text: ${raw.slice(0, 120)}`,
        );
        pieces.push({
          kind: 'span',
          span: {
            _type: 'span',
            _key: key(context, 'span'),
            text: raw,
            ...(marks.length ? { marks } : {}),
          },
        });
      }
      continue;
    }
    const raw = asString(node.value) ?? '';
    context.warnings.push(
      `unsupported inline node ${type}; source preserved as text`,
    );
    if (raw)
      pieces.push({
        kind: 'span',
        span: {
          _type: 'span',
          _key: key(context, 'span'),
          text: raw,
          ...(marks.length ? { marks } : {}),
        },
      });
  }
  return { pieces, markDefs };
}

function textBlocksFromInline(
  nodes: MarkdownNode[],
  context: ConverterContext,
  article: string,
  style: string,
  listItem?: 'bullet' | 'number',
  level?: number,
): PortableTextBlock[] {
  const { pieces, markDefs } = inlinePieces(nodes, context, article);
  const blocks: PortableTextBlock[] = [];
  let spans: PortableTextSpan[] = [];
  const flush = () => {
    if (!spans.length) return;
    blocks.push({
      _type: 'block',
      _key: key(context, 'block'),
      style,
      children: spans,
      ...(markDefs.length ? { markDefs } : {}),
      ...(listItem ? { listItem, level: level ?? 1 } : {}),
    });
    spans = [];
  };
  for (const piece of pieces) {
    if (piece.kind === 'image') {
      flush();
      blocks.push(piece.image);
    } else {
      spans.push(piece.span);
    }
  }
  flush();
  return blocks;
}

function codeBlock(
  node: MarkdownNode,
  context: ConverterContext,
  source: string,
): PortableTextBlock {
  const language = asString(node.lang);
  const meta = asString(node.meta)?.trim();
  return {
    _type: 'code',
    _key: key(context, 'code'),
    code: asString(node.value) ?? nodeRaw(node, source),
    ...(language ? { language } : {}),
    ...(meta ? { filename: meta.split(/\s+/u)[0] } : {}),
  };
}

function htmlBlock(
  context: ConverterContext,
  html: string,
  reason?: string,
): PortableTextBlock {
  if (reason)
    context.warnings.push(`${reason}: raw HTML was kept in htmlBlock`);
  return { _type: 'htmlBlock', _key: key(context, 'html'), html };
}

function tableBlock(
  node: MarkdownNode,
  context: ConverterContext,
  article: string,
): PortableTextBlock {
  const rows = asChildren(node)
    .filter((row) => row.type === 'tableRow')
    .map((row, rowIndex) => ({
      _type: 'tableRow',
      _key: key(context, 'table-row'),
      cells: asChildren(row)
        .filter((cell) => cell.type === 'tableCell')
        .map((cell) => {
          const inline = inlinePieces(asChildren(cell), context, article);
          const text = inline.pieces
            .filter(
              (piece): piece is { kind: 'span'; span: PortableTextSpan } =>
                piece.kind === 'span',
            )
            .map((piece) => piece.span);
          if (inline.pieces.some((piece) => piece.kind === 'image'))
            context.warnings.push(
              'table image: image was represented by its surrounding cell text',
            );
          return {
            _type: 'tableCell',
            _key: key(context, 'table-cell'),
            content: text.length
              ? text
              : [{ _type: 'span', _key: key(context, 'span'), text: '' }],
            ...(inline.markDefs.length ? { markDefs: inline.markDefs } : {}),
            ...(rowIndex === 0 ? { isHeader: true } : {}),
          };
        }),
    }));
  return {
    _type: 'table',
    _key: key(context, 'table'),
    rows,
    hasHeaderRow: rows.length > 0,
  };
}

function listBlocks(
  node: MarkdownNode,
  context: ConverterContext,
  article: string,
  source: string,
  level: number,
): PortableTextBlock[] {
  const ordered = node.ordered === true;
  const listItem = ordered ? 'number' : 'bullet';
  const result: PortableTextBlock[] = [];
  for (const item of asChildren(node).filter(
    (child) => child.type === 'listItem',
  )) {
    for (const child of asChildren(item)) {
      if (child.type === 'paragraph') {
        result.push(
          ...textBlocksFromInline(
            asChildren(child),
            context,
            article,
            'normal',
            listItem,
            level,
          ),
        );
      } else if (child.type === 'list') {
        result.push(...listBlocks(child, context, article, source, level + 1));
      } else {
        result.push(...flowBlocks([child], context, article, source));
      }
    }
  }
  return result;
}

function normalizeAlertAliases(markdown: string): string {
  return markdown.replace(
    /^(\s*>\s*)\[!([A-Za-z]+)\]/gmu,
    (match, prefix: string, kind: string) => {
      const canonical = ALERT_ALIASES[kind.toUpperCase()];
      if (!canonical) return match;
      return `${prefix}[!${canonical}]`.padEnd(match.length, ' ');
    },
  );
}

function alertLabel(node: MarkdownNode): string | null {
  const className = asRecord(asRecord(node.data).hProperties).className;
  if (!Array.isArray(className)) return null;
  for (const name of className) {
    const kind =
      typeof name === 'string' && name.startsWith('markdown-alert-')
        ? name.slice('markdown-alert-'.length)
        : null;
    if (kind && ALERT_LABELS[kind]) return ALERT_LABELS[kind];
  }
  return null;
}

function alertLabelBlock(
  context: ConverterContext,
  label: string,
): PortableTextBlock {
  return {
    _type: 'block',
    _key: key(context, 'block'),
    style: 'blockquote',
    children: [
      {
        _type: 'span',
        _key: key(context, 'span'),
        text: label,
        marks: ['strong'],
      },
    ],
  };
}

function rawHtmlImage(
  node: MarkdownNode,
  context: ConverterContext,
  article: string,
): PortableTextBlock | null {
  const raw = asString(node.value) ?? '';
  const src = raw.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
  if (!src || !/^\s*<img\b/i.test(raw)) return null;
  const alt = raw.match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1];
  const image = addImage(
    context,
    src,
    article,
    'html-img',
    alt,
    imageFilename(src, `${context.slug}.img`),
  );
  return image ? imageBlock(context, image, alt) : null;
}

function flowBlocks(
  nodes: MarkdownNode[],
  context: ConverterContext,
  article: string,
  source: string,
): PortableTextBlock[] {
  const result: PortableTextBlock[] = [];
  for (const node of nodes) {
    switch (node.type) {
      case 'heading': {
        const depth = Number(node.depth);
        result.push(
          ...textBlocksFromInline(
            asChildren(node),
            context,
            article,
            `h${Math.min(Math.max(depth, 1), 6)}`,
          ),
        );
        break;
      }
      case 'paragraph':
        result.push(
          ...textBlocksFromInline(asChildren(node), context, article, 'normal'),
        );
        break;
      case 'blockquote': {
        const children = asChildren(node);
        const label = alertLabel(node);
        if (label) {
          result.push(alertLabelBlock(context, label));
          children.shift();
        }
        const nested = flowBlocks(children, context, article, source);
        for (const block of nested) {
          if (block._type === 'block' && typeof block.style === 'string')
            block.style = 'blockquote';
          result.push(block);
        }
        break;
      }
      case 'list':
        result.push(...listBlocks(node, context, article, source, 1));
        break;
      case 'code':
        result.push(codeBlock(node, context, source));
        break;
      case 'table':
        result.push(tableBlock(node, context, article));
        break;
      case 'thematicBreak':
        result.push(htmlBlock(context, '<hr />', 'thematic break'));
        break;
      case 'html': {
        const image = rawHtmlImage(node, context, article);
        if (image) result.push(image);
        else {
          const raw = asString(node.value) ?? nodeRaw(node, source);
          if (raw.trim()) result.push(htmlBlock(context, raw, 'HTML'));
        }
        break;
      }
      case 'definition':
        context.warnings.push(
          `${node.type}: reference definition was not rendered by Portable Text`,
        );
        break;
      case 'footnoteDefinition': {
        const identifier =
          asString(node.identifier) ?? asString(node.label) ?? '?';
        context.footnoteDefinitions.set(identifier, node);
        break;
      }
      default: {
        const raw = nodeRaw(node, source);
        context.warnings.push(
          `unsupported block ${node.type}; source was preserved as code`,
        );
        result.push(
          codeBlock(
            { type: 'code', value: raw, lang: 'text' },
            context,
            source,
          ),
        );
      }
    }
  }
  return result;
}

function blockCounts(blocks: PortableTextBlock[]): Record<string, number> {
  return blocks.reduce<Record<string, number>>((counts, block) => {
    counts[block._type] = (counts[block._type] ?? 0) + 1;
    return counts;
  }, {});
}

function tagEntries(
  raw: unknown,
  sourcePath: string,
): Array<{ label: string; slug: string }> {
  if (!Array.isArray(raw))
    throw new Error(`${sourcePath}: tags must be an array`);
  const seen = new Set<string>();
  return raw.map((value) => {
    const label = String(value).trim();
    if (!label) throw new Error(`${sourcePath}: tags contains an empty label`);
    const slug = getTagSlug(label);
    if (seen.has(slug))
      throw new Error(`${sourcePath}: duplicate tag slug ${slug}`);
    seen.add(slug);
    return { label, slug };
  });
}

function parseArticle(fileName: string): {
  seedEntry: UnknownRecord;
  report: ArticleReport;
  images: ConverterContext['images'];
  tags: Array<{ label: string; slug: string }>;
} {
  const sourcePath = join(CONTENTS_DIR, fileName);
  const source = readFileSync(sourcePath, 'utf8');
  const parsed = matter(source);
  const data = parsed.data as UnknownRecord;
  const slug = String(
    data.slug ??
      fileName.replace(/\.md$/u, '').replace(/^\d{4}-\d{2}-\d{2}_/u, ''),
  );
  const title = String(data.title ?? '').trim();
  const description = String(data.description ?? '').trim();
  if (!title || !description)
    throw new Error(`${fileName}: title and description are required`);
  const publishedAt = normalizedDate(data.date, 'date', fileName);
  const modifiedTime = data.modified_time
    ? normalizedDate(data.modified_time, 'modified_time', fileName)
    : null;
  const tags = tagEntries(data.tags, fileName);
  const context: ConverterContext = {
    slug,
    sourcePath: relative(ROOT, sourcePath),
    warnings: [],
    images: [],
    linkCounter: 0,
    blockCounter: 0,
    footnoteNumbers: new Map(),
    footnoteDefinitions: new Map(),
  };
  const body = normalizeAlertAliases(parsed.content);
  const tree = processor.runSync(processor.parse(body));
  const blocks = flowBlocks(
    asChildren(tree as unknown as MarkdownNode),
    context,
    fileName,
    body,
  );
  const footnotes = footnotesBlock(context);
  if (footnotes) blocks.push(footnotes);

  let featuredImage: UnknownRecord | undefined;
  if (typeof data.icon_url === 'string') {
    const image = addImage(
      context,
      data.icon_url,
      fileName,
      'featured-image',
      String(data.title),
    );
    if (image) featuredImage = mediaReference(image);
  }

  const unsupportedFrontmatter: string[] = [];
  if (data.diagram !== undefined) unsupportedFrontmatter.push('diagram');
  if (data.selfAssessment !== undefined)
    unsupportedFrontmatter.push('selfAssessment');
  const bodySha256 = createHash('sha256').update(parsed.content).digest('hex');
  const content = blocks.length
    ? blocks
    : [htmlBlock(context, '<p>本文が空です。</p>', 'empty body')];
  const seedEntry: UnknownRecord = {
    id: `post-${slug}`,
    slug,
    status: 'published',
    data: {
      title,
      excerpt: description,
      ...(featuredImage ? { featured_image: featuredImage } : {}),
      content,
      ...(modifiedTime ? { modified_time: modifiedTime } : {}),
    },
    taxonomies: { tag: tags.map((tag) => tag.slug) },
  };
  const report: ArticleReport = {
    source: relative(ROOT, sourcePath),
    slug,
    title,
    description,
    publishedAt,
    modifiedTime,
    tags,
    blockCounts: blockCounts(content),
    imageCount: context.images.length,
    unsupported: [
      ...unsupportedFrontmatter.map((feature) => `frontmatter:${feature}`),
      ...context.warnings,
    ],
    frontmatterFeatures: unsupportedFrontmatter,
    bodySha256,
  };
  return { seedEntry, report, images: context.images, tags };
}

function mergeImages(
  items: Array<ImageInventoryItem & { source: string; kind: string }>,
): ImageInventoryItem[] {
  const merged = new Map<string, ImageInventoryItem>();
  for (const item of items) {
    const existing = merged.get(item.url);
    if (!existing) {
      merged.set(item.url, {
        url: item.url,
        ...(item.alt ? { alt: item.alt } : {}),
        ...(item.filename ? { filename: item.filename } : {}),
        articles: [...item.articles],
        sources: [item.source],
        kinds: [item.kind],
        status: 'pending',
      });
      continue;
    }
    if (item.alt && !existing.alt) existing.alt = item.alt;
    if (item.filename && !existing.filename) existing.filename = item.filename;
    if (!existing.sources.includes(item.source))
      existing.sources.push(item.source);
    if (!existing.kinds.includes(item.kind)) existing.kinds.push(item.kind);
    for (const article of item.articles)
      if (!existing.articles.includes(article)) existing.articles.push(article);
  }
  return [...merged.values()].sort((left, right) =>
    left.url.localeCompare(right.url),
  );
}

async function checkImage(
  url: string,
): Promise<Pick<ImageInventoryItem, 'status' | 'statusCode' | 'error'>> {
  try {
    let response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        headers: { Range: 'bytes=0-0' },
        redirect: 'follow',
      });
    }
    return response.ok
      ? { status: 'ok', statusCode: response.status }
      : {
          status: 'failed',
          statusCode: response.status,
          error: response.statusText,
        };
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function writeReports(
  seed: UnknownRecord,
  articles: ArticleReport[],
  images: ImageInventoryItem[],
  checkAssets: boolean,
): Promise<void> {
  if (checkAssets) {
    for (const image of images)
      Object.assign(image, await checkImage(image.url));
  }
  await mkdir(join(ROOT, 'seed'), { recursive: true });
  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(SEED_PATH, `${JSON.stringify(seed, null, 2)}\n`);
  const report: MigrationReport = {
    generatedAt: new Date().toISOString(),
    sourceDirectory: 'contents/blog',
    articleCount: articles.length,
    articles,
    unsupportedTotal: articles.reduce(
      (total, article) => total + article.unsupported.length,
      0,
    ),
    imageCount: articles.reduce(
      (total, article) => total + article.imageCount,
      0,
    ),
    uniqueImageCount: images.length,
    images,
  };
  await writeFile(
    join(REPORT_DIR, 'migration-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await writeFile(
    join(REPORT_DIR, 'image-inventory.json'),
    `${JSON.stringify(images, null, 2)}\n`,
  );
  const unsupportedLines = articles.flatMap((article) =>
    article.unsupported.map((warning) => `- ${article.slug}: ${warning}`),
  );
  await writeFile(
    join(REPORT_DIR, 'unsupported.md'),
    [
      '# EmDash 移行時の注意事項',
      '',
      '変換不能な本文を削除せず、Portable Text の `code` / `htmlBlock` またはレポートに残している。',
      '',
      ...(unsupportedLines.length ? unsupportedLines : ['- なし']),
      '',
    ].join('\n'),
  );
}

async function main(): Promise<void> {
  const checkAssets = process.argv.includes('--check-assets');
  const files = (await readdir(CONTENTS_DIR))
    .filter((file) => file.endsWith('.md'))
    .sort();
  const seedEntries: UnknownRecord[] = [];
  const reports: ArticleReport[] = [];
  const allImages: Array<
    ImageInventoryItem & { source: string; kind: string }
  > = [];
  const taxonomies = new Map<string, string>();
  for (const file of files) {
    const parsed = parseArticle(file);
    seedEntries.push(parsed.seedEntry);
    reports.push(parsed.report);
    allImages.push(...parsed.images);
    for (const tag of parsed.tags) taxonomies.set(tag.slug, tag.label);
  }
  const images = mergeImages(allImages);
  const seed: UnknownRecord = {
    $schema: 'https://emdashcms.com/seed.schema.json',
    version: '1',
    meta: {
      name: 'sui Tech Blog',
      description: 'Suntory-N-Water の技術ブログ',
      author: 'Suntory-N-Water',
    },
    settings: {
      title: 'sui Tech Blog',
      tagline: '技術と日々の記録',
      postsPerPage: 10,
      dateFormat: 'yyyy年M月d日',
      timezone: 'Asia/Tokyo',
    },
    collections: [
      {
        slug: 'posts',
        label: '記事',
        labelSingular: '記事',
        description: '公開済みの技術記事',
        supports: ['drafts', 'revisions', 'search', 'seo'],
        urlPattern: '/posts/{slug}',
        routable: true,
        titleField: 'title',
        dateField: 'modified_time',
        admin: { listColumns: ['modified_time'] },
        fields: [
          {
            slug: 'title',
            label: 'タイトル',
            type: 'string',
            required: true,
            searchable: true,
          },
          { slug: 'excerpt', label: '概要', type: 'text' },
          { slug: 'featured_image', label: 'OGP画像', type: 'image' },
          {
            slug: 'content',
            label: '本文',
            type: 'portableText',
            searchable: true,
          },
          {
            slug: 'modified_time',
            label: '更新日時',
            type: 'datetime',
            indexed: true,
          },
        ],
      },
    ],
    taxonomies: [
      {
        name: 'tag',
        label: 'タグ',
        labelSingular: 'タグ',
        hierarchical: false,
        collections: ['posts'],
        terms: [...taxonomies.entries()]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([slug, label]) => ({ slug, label })),
      },
    ],
    content: { posts: seedEntries },
  };
  await writeReports(seed, reports, images, checkAssets);
  const failed = images.filter((image) => image.status === 'failed');
  console.log(
    `EmDash seed generated: ${reports.length} articles, ${images.length} unique images`,
  );
  if (checkAssets)
    console.log(
      `Image check: ${images.length - failed.length} ok, ${failed.length} failed`,
    );
  if (failed.length) process.exitCode = 1;
}

await main();

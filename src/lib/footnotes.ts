const EMDASH_EDIT = Symbol.for('__emdash');
const DEFINITION_PREFIX = 'fn-';
const REFERENCE_PREFIX = 'fnref-';
const FOOTNOTE_ITEM = /<li id="(fn-[^"]*)">([\s\S]*?)<\/li>/gu;
const REFERENCE_MARKER = /\[\^([^\]\s]+)\]/gu;
const DEFINITION_MARKER = /^\[\^([^\]\s]+)\]:[ \t]*/u;

type Json = Record<string, unknown>;

type Span = {
  _type?: string;
  _key?: string;
  text?: string;
  marks?: string[];
};

type MarkDef = {
  _type?: string;
  _key?: string;
  href?: string;
};

type Definition = {
  children: Span[];
  markDefs: MarkDef[];
};

export function withMarkdownFootnotes<T>(content: T): T {
  if (!Array.isArray(content)) {
    return content;
  }
  if (Object.getOwnPropertyDescriptor(content, EMDASH_EDIT)) {
    return content;
  }

  const definitions = new Map<string, Definition>();
  const body: unknown[] = [];
  for (const item of content) {
    const definition = definitionOf(item);
    if (definition) {
      definitions.set(definition.identifier, definition.value);
      continue;
    }
    body.push(item);
  }
  if (definitions.size === 0) {
    return content;
  }

  const order: string[] = [];
  let keyIndex = 0;
  const nextKey = () => `fnauto-${keyIndex++}`;
  const linked = body.map((item) =>
    linkReferences(item, definitions, order, nextKey),
  );
  if (order.length === 0) {
    return content;
  }

  return [...linked, footnoteSection(order, definitions)] as T;
}

function definitionOf(
  item: unknown,
): { identifier: string; value: Definition } | null {
  if (!isPlainObject(item) || item._type !== 'block' || item.listItem) {
    return null;
  }
  const style = item.style;
  if (typeof style === 'string' && style !== 'normal') {
    return null;
  }
  const children = Array.isArray(item.children)
    ? (item.children as Span[])
    : [];
  const [first] = children;
  const text = typeof first?.text === 'string' ? first.text : '';
  const match = DEFINITION_MARKER.exec(text);
  if (!match) {
    return null;
  }
  const rest = text.slice(match[0].length);
  const body = [
    ...(rest ? [{ ...first, text: rest }] : []),
    ...children.slice(1),
  ];
  return {
    identifier: match[1],
    value: {
      children: body,
      markDefs: Array.isArray(item.markDefs)
        ? (item.markDefs as MarkDef[])
        : [],
    },
  };
}

function linkReferences(
  item: unknown,
  definitions: Map<string, Definition>,
  order: string[],
  nextKey: () => string,
): unknown {
  if (!isPlainObject(item) || item._type !== 'block') {
    return item;
  }
  const children = Array.isArray(item.children)
    ? (item.children as Span[])
    : [];
  const markDefs = Array.isArray(item.markDefs)
    ? [...(item.markDefs as MarkDef[])]
    : [];
  let changed = false;
  const next: Span[] = [];

  for (const child of children) {
    const text = typeof child.text === 'string' ? child.text : '';
    const marks = child.marks ?? [];
    if (!text.includes('[^') || marks.includes('code')) {
      next.push(child);
      continue;
    }

    const replaced: Span[] = [];
    let cursor = 0;
    REFERENCE_MARKER.lastIndex = 0;
    for (
      let match = REFERENCE_MARKER.exec(text);
      match;
      match = REFERENCE_MARKER.exec(text)
    ) {
      if (!definitions.has(match[1])) {
        continue;
      }
      const number = numberOf(match[1], order);
      const before = text.slice(cursor, match.index);
      if (before) {
        replaced.push({ ...child, _key: nextKey(), text: before });
      }
      const markKey = nextKey();
      markDefs.push({
        _type: 'link',
        _key: markKey,
        href: `#${DEFINITION_PREFIX}${number}`,
      });
      replaced.push({
        _type: 'span',
        _key: nextKey(),
        text: String(number),
        marks: [...marks, markKey],
      });
      cursor = match.index + match[0].length;
    }

    if (replaced.length === 0) {
      next.push(child);
      continue;
    }
    const rest = text.slice(cursor);
    if (rest) {
      replaced.push({ ...child, _key: nextKey(), text: rest });
    }
    next.push(...replaced);
    changed = true;
  }

  if (!changed) {
    return item;
  }
  return { ...item, children: next, markDefs };
}

function numberOf(identifier: string, order: string[]): number {
  const known = order.indexOf(identifier);
  if (known >= 0) {
    return known + 1;
  }
  order.push(identifier);
  return order.length;
}

function footnoteSection(
  order: string[],
  definitions: Map<string, Definition>,
): Json {
  const items = order
    .map((identifier, index) => {
      const definition = definitions.get(identifier);
      if (!definition) {
        return '';
      }
      return `<li id="${DEFINITION_PREFIX}${index + 1}"><p>${inlineHtml(definition)}</p></li>`;
    })
    .join('');
  return {
    _type: 'htmlBlock',
    _key: 'footnotes-auto',
    html: `<section class="footnotes"><h2>脚注</h2><ol>${items}</ol></section>`,
  };
}

function inlineHtml(definition: Definition): string {
  return definition.children
    .map((child) => {
      let html = escapeHtml(typeof child.text === 'string' ? child.text : '');
      for (const mark of child.marks ?? []) {
        const def = definition.markDefs.find((item) => item._key === mark);
        if (def?._type === 'link' && typeof def.href === 'string') {
          html = `<a href="${escapeHtml(def.href)}">${html}</a>`;
        } else if (mark === 'strong') {
          html = `<strong>${html}</strong>`;
        } else if (mark === 'em') {
          html = `<em>${html}</em>`;
        } else if (mark === 'code') {
          html = `<code>${html}</code>`;
        }
      }
      return html;
    })
    .join('');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function withFootnoteBacklinks<T>(content: T): T {
  if (!Array.isArray(content)) {
    return content;
  }
  if (Object.getOwnPropertyDescriptor(content, EMDASH_EDIT)) {
    return content;
  }

  const references = new Map<string, string[]>();
  const annotated = content.map((block) => annotate(block, references));
  if (references.size === 0) {
    return content;
  }
  return annotated.map((block) => injectBacklinks(block, references)) as T;
}

function isPlainObject(value: unknown): value is Json {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function annotate(value: unknown, references: Map<string, string[]>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => annotate(item, references));
  }
  if (!isPlainObject(value)) {
    return value;
  }
  const next: Json = {};
  for (const [key, item] of Object.entries(value)) {
    next[key] =
      key === 'markDefs'
        ? annotateMarkDefs(item, references)
        : annotate(item, references);
  }
  return next;
}

function annotateMarkDefs(
  value: unknown,
  references: Map<string, string[]>,
): unknown {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.map((def) => {
    if (!isPlainObject(def) || def._type !== 'link') {
      return def;
    }
    const href = def.href;
    if (typeof href !== 'string' || !href.startsWith(`#${DEFINITION_PREFIX}`)) {
      return def;
    }
    const anchor = href.slice(1);
    const identifier = anchor.slice(DEFINITION_PREFIX.length);
    const assigned = references.get(anchor) ?? [];
    const refId =
      assigned.length === 0
        ? `${REFERENCE_PREFIX}${identifier}`
        : `${REFERENCE_PREFIX}${identifier}-${assigned.length + 1}`;
    assigned.push(refId);
    references.set(anchor, assigned);
    return { ...def, refId };
  });
}

function injectBacklinks(
  block: unknown,
  references: Map<string, string[]>,
): unknown {
  if (
    !isPlainObject(block) ||
    block._type !== 'htmlBlock' ||
    typeof block.html !== 'string' ||
    !block.html.includes('class="footnotes"')
  ) {
    return block;
  }
  const html = block.html.replace(
    FOOTNOTE_ITEM,
    (match, anchor: string, body: string) => {
      const backlinks = (references.get(anchor) ?? [])
        .map((refId, index) => backlink(refId, index))
        .join(' ');
      if (!backlinks) {
        return match;
      }
      const inner = body.endsWith('</p>')
        ? `${body.slice(0, -'</p>'.length)} ${backlinks}</p>`
        : `${body} ${backlinks}`;
      return `<li id="${anchor}">${inner}</li>`;
    },
  );
  return { ...block, html };
}

function backlink(refId: string, index: number): string {
  const ordinal =
    index === 0 ? '' : `<span class="footnote-back-index">${index + 1}</span>`;
  const label = index === 0 ? '本文へ戻る' : `本文へ戻る (${index + 1} 箇所目)`;
  return `<a class="footnote-back" href="#${refId}">↩${ordinal}<span class="footnote-back-label">${label}</span></a>`;
}

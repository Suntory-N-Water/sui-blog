const EMDASH_EDIT = Symbol.for('__emdash');
const DEFINITION_PREFIX = 'fn-';
const REFERENCE_PREFIX = 'fnref-';
const FOOTNOTE_ITEM = /<li id="(fn-[^"]*)">([\s\S]*?)<\/li>/gu;

type Json = Record<string, unknown>;

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

type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
  return typeof value === 'object' && value !== null
    ? (value as RecordValue)
    : {};
}

function mediaUrl(value: unknown): string | null {
  const media = record(value);
  if (typeof media.src === 'string' && media.src) {
    return media.src;
  }
  const id = typeof media.id === 'string' ? media.id : undefined;
  const meta = record(media.meta);
  const key = typeof meta.storageKey === 'string' ? meta.storageKey : id;
  return key ? `/_emdash/api/media/file/${encodeURIComponent(key)}` : null;
}

function inlineToMarkdown({
  children,
  markDefs,
}: {
  children: unknown;
  markDefs: unknown;
}): string {
  const defs = Array.isArray(markDefs) ? markDefs.map(record) : [];
  if (!Array.isArray(children)) {
    return '';
  }
  return children
    .map((child) => {
      const span = record(child);
      let text = typeof span.text === 'string' ? span.text : '';
      const marks = Array.isArray(span.marks)
        ? span.marks.filter((mark): mark is string => typeof mark === 'string')
        : [];
      for (const mark of marks) {
        const definition = defs.find((def) => def._key === mark);
        if (
          definition?._type === 'link' &&
          typeof definition.href === 'string'
        ) {
          text = `[${text}](${definition.href})`;
        } else if (mark === 'strong') {
          text = `**${text}**`;
        } else if (mark === 'em') {
          text = `*${text}*`;
        } else if (mark === 'strike-through') {
          text = `~~${text}~~`;
        } else if (mark === 'code') {
          text = `\`${text.replaceAll('`', '\\`')}\``;
        }
      }
      return text;
    })
    .join('');
}

function blockToMarkdown(block: RecordValue): string {
  const type = typeof block._type === 'string' ? block._type : '';
  if (type === 'block') {
    const text = inlineToMarkdown({
      children: block.children,
      markDefs: block.markDefs,
    });
    const style = block.style;
    if (typeof style === 'string' && /^h[1-6]$/u.test(style)) {
      return `${'#'.repeat(Number(style.slice(1)))} ${text}`;
    }
    if (style === 'blockquote') {
      return text
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
    }
    if (block.listItem === 'bullet' || block.listItem === 'number') {
      const level = typeof block.level === 'number' ? block.level : 1;
      const indent = '  '.repeat(Math.max(0, level - 1));
      const marker = block.listItem === 'number' ? '1.' : '-';
      return `${indent}${marker} ${text}`;
    }
    return text;
  }
  if (type === 'code') {
    const language = typeof block.language === 'string' ? block.language : '';
    const filename =
      typeof block.filename === 'string' ? ` ${block.filename}` : '';
    return `\`\`\`${language}${filename}\n${typeof block.code === 'string' ? block.code : ''}\n\`\`\``;
  }
  if (type === 'image') {
    const url = mediaUrl(block.asset);
    if (!url) {
      return '[画像のURLを取得できませんでした]';
    }
    const alt = typeof block.alt === 'string' ? block.alt : '画像';
    return `![${alt}](${url})`;
  }
  if (type === 'htmlBlock') {
    return typeof block.html === 'string' ? block.html : '';
  }
  if (type === 'table') {
    const rows = Array.isArray(block.rows) ? block.rows.map(record) : [];
    const rendered = rows.map((row) => {
      const cells = Array.isArray(row.cells) ? row.cells.map(record) : [];
      return `| ${cells.map((cell) => inlineToMarkdown({ children: cell.content, markDefs: cell.markDefs }).replaceAll('|', '\\|')).join(' | ')} |`;
    });
    if (rendered.length > 0) {
      const columns = Array.isArray(rows[0]?.cells) ? rows[0].cells.length : 1;
      rendered.splice(
        1,
        0,
        `| ${Array.from({ length: columns }, () => '---').join(' | ')} |`,
      );
    }
    return rendered.join('\n');
  }
  return `\`\`\`json\n${JSON.stringify(block, null, 2)}\n\`\`\``;
}

export function portableTextToMarkdown(value: unknown): string {
  if (!Array.isArray(value)) {
    return '';
  }
  const lines: string[] = [];
  let previousWasList = false;
  for (const item of value) {
    const block = record(item);
    const rendered = blockToMarkdown(block).trimEnd();
    if (!rendered) {
      continue;
    }
    const isList = block.listItem === 'bullet' || block.listItem === 'number';
    if (lines.length > 0 && (!isList || !previousWasList)) {
      lines.push('');
    }
    lines.push(rendered);
    previousWasList = isList;
  }
  return `${lines.join('\n').trim()}\n`;
}

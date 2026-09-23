import type { PortableTextBlock } from 'emdash';

const CHARS_PER_MINUTE_JA = 650;
const FOOTNOTE_DEFINITION = /^\[\^[^\]]+\]:/u;
const FOOTNOTE_REFERENCE = /\[\^[^\]]+\]/gu;

type PortableTextSpan = {
  _type: string;
  text?: string;
  marks?: string[];
};

type PortableTextTextBlock = PortableTextBlock & {
  _type: 'block';
  children: PortableTextSpan[];
};

function isTextBlock(block: PortableTextBlock): block is PortableTextTextBlock {
  return block._type === 'block' && Array.isArray(block.children);
}

function blockText(block: PortableTextTextBlock): string {
  return block.children
    .filter(
      (child) =>
        child._type === 'span' &&
        typeof child.text === 'string' &&
        !child.marks?.includes('code'),
    )
    .map((span) => span.text)
    .join('');
}

export function getReadingTime(
  content: PortableTextBlock[] | undefined,
): number {
  if (!Array.isArray(content)) {
    return 1;
  }
  const readableText = content
    .filter(isTextBlock)
    .map(blockText)
    .filter((text) => !FOOTNOTE_DEFINITION.test(text.trimStart()))
    .map((text) => text.replace(FOOTNOTE_REFERENCE, ''))
    .join('\n');
  const charCount = readableText.trim().length;
  return Math.max(1, Math.round(charCount / CHARS_PER_MINUTE_JA));
}

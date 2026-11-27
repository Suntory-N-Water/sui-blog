import type { Element, ElementContent, Root } from 'hast';
import { visit } from 'unist-util-visit';
import { isExternalHref, rewriteInternalHref } from './links';

const FAVICON_SIZE = 16;

function faviconOf(href: string): Element {
  const { hostname } = new URL(href);
  return {
    type: 'element',
    tagName: 'img',
    properties: {
      className: ['link-favicon'],
      src: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=${FAVICON_SIZE * 2}`,
      width: FAVICON_SIZE,
      height: FAVICON_SIZE,
      alt: '',
      loading: 'lazy',
      decoding: 'async',
    },
    children: [],
  };
}

function isWhitespace(node: ElementContent): boolean {
  return node.type === 'text' && node.value.trim() === '';
}

function transformLink(node: Element): void {
  const href = node.properties.href;
  if (typeof href !== 'string') {
    return;
  }
  const rewritten = rewriteInternalHref(href);
  node.properties.href = rewritten;
  if (
    isExternalHref(rewritten) &&
    !node.children.some((child) => child.type === 'element' && child.tagName === 'img')
  ) {
    node.children.unshift(faviconOf(rewritten));
  }
}

function transformImageParagraph(node: Element): void {
  const children = node.children.filter((child) => !isWhitespace(child));
  const [image] = children;
  if (children.length !== 1 || image?.type !== 'element' || image.tagName !== 'img') {
    return;
  }
  image.properties.loading = 'lazy';
  image.properties.decoding = 'async';
  const title = image.properties.title;
  const caption: ElementContent[] =
    typeof title === 'string' && title !== ''
      ? [
          {
            type: 'element',
            tagName: 'figcaption',
            properties: {},
            children: [{ type: 'text', value: title }],
          },
        ]
      : [];
  delete image.properties.title;
  node.tagName = 'figure';
  node.properties = { className: ['article-image'] };
  node.children = [image, ...caption];
}

export function rehypeArticle() {
  return (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'a') {
        transformLink(node);
        return;
      }
      if (node.tagName === 'p') {
        transformImageParagraph(node);
        return;
      }
      if (node.tagName === 'img' && parent?.type === 'element' && parent.tagName !== 'figure') {
        node.properties.loading = 'lazy';
        node.properties.decoding = 'async';
        return;
      }
      if (node.tagName === 'table' && parent && typeof index === 'number') {
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['article-table'] },
          children: [node],
        };
        return 'skip';
      }
      return undefined;
    });
  };
}

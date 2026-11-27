import type { Html, Link, Paragraph, Root, RootContent } from 'mdast';
import { visit } from 'unist-util-visit';
import { transformAlert } from './alert';
import { isMermaid, renderCodeBlock, renderMermaid } from './code';
import { renderLinkCard } from './link-card';

type Replacement = { node: RootContent; render: () => Promise<string> };

function bareLink(node: Paragraph): Link | null {
  const children = node.children.filter(
    (child) => !(child.type === 'text' && child.value.trim() === ''),
  );
  const [only] = children;
  if (children.length !== 1 || only?.type !== 'link') {
    return null;
  }
  const [text] = only.children;
  if (only.children.length !== 1 || text?.type !== 'text') {
    return null;
  }
  return text.value.trim() === only.url ? only : null;
}

export function remarkArticle() {
  return async (tree: Root) => {
    const replacements: Replacement[] = [];

    visit(tree, (node) => {
      if (node.type === 'blockquote') {
        transformAlert(node);
        return;
      }
      if (node.type === 'code') {
        const { value, lang, meta } = node;
        replacements.push({
          node,
          render: () =>
            isMermaid(lang) ? renderMermaid(value) : renderCodeBlock(value, lang, meta?.trim()),
        });
        return 'skip';
      }
      if (node.type === 'paragraph') {
        const link = bareLink(node);
        if (link) {
          replacements.push({ node, render: () => renderLinkCard(link.url) });
          return 'skip';
        }
      }
      return undefined;
    });

    await Promise.all(
      replacements.map(async ({ node, render }) => {
        const html = await render();
        const replaced = node as unknown as Html;
        for (const key of Object.keys(replaced)) {
          if (key !== 'position') {
            delete (replaced as unknown as Record<string, unknown>)[key];
          }
        }
        replaced.type = 'html';
        replaced.value = html;
      }),
    );
  };
}

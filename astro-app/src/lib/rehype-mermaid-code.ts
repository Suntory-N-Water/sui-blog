import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * mermaid コードブロックを <div class="mermaid"> に変換する rehype プラグイン
 */
export function rehypeMermaidCodeToDiv() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (
        node.tagName !== 'pre' ||
        typeof index !== 'number' ||
        !parent ||
        !Array.isArray(parent.children)
      ) {
        return;
      }

      const firstChild = node.children[0] as Element | undefined;
      if (
        !firstChild ||
        firstChild.type !== 'element' ||
        firstChild.tagName !== 'code'
      ) {
        return;
      }

      const className = firstChild.properties?.className;
      const classList = Array.isArray(className)
        ? className
        : typeof className === 'string'
          ? className.split(/\s+/)
          : [];

      const isMermaid = classList.includes('language-mermaid');
      if (!isMermaid) {
        return;
      }

      const textNode = firstChild.children?.[0];
      const codeText =
        textNode && textNode.type === 'text' ? String(textNode.value) : '';

      const mermaidDiv: Element = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['mermaid'],
        },
        children: [
          {
            type: 'text',
            value: codeText,
          },
        ],
      };

      parent.children[index] = mermaidDiv;
    });
  };
}

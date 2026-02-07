import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * コードブロックにコピーボタンを追加するrehypeプラグイン
 */
export function rehypeCodeCopyButton() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (
        node.tagName === 'pre' &&
        typeof index === 'number' &&
        parent &&
        Array.isArray(parent.children)
      ) {
        // preタグを<div class="group relative">でラップ
        const wrapper: Element = {
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['group', 'relative'],
          },
          children: [
            node,
            // コピーボタンラッパー(ビルド時に静的生成)
            {
              type: 'element',
              tagName: 'div',
              properties: {
                className: ['absolute', 'right-3', 'top-3'],
              },
              children: [
                // Copied! メッセージ
                {
                  type: 'element',
                  tagName: 'div',
                  properties: {
                    className: [
                      'copy-message',
                      'absolute',
                      'right-10',
                      'top-0',
                      'z-20',
                      'rounded-md',
                      'bg-muted/60',
                      'px-2',
                      'py-1',
                      'text-xs',
                      'font-medium',
                      'text-foreground',
                      'whitespace-nowrap',
                      'hidden',
                    ],
                  },
                  children: [{ type: 'text', value: 'Copied!' }],
                },
                // コピーボタン
                {
                  type: 'element',
                  tagName: 'button',
                  properties: {
                    'data-copy-button': '', // クライアント側で検出するためのマーカー
                    'aria-label': 'コードをコピー',
                    className: [
                      'z-10',
                      'inline-flex',
                      'items-center',
                      'justify-center',
                      'gap-2',
                      'whitespace-nowrap',
                      'rounded-md',
                      'text-sm',
                      'font-medium',
                      'ring-offset-background',
                      'transition-colors',
                      'focus-visible:outline-none',
                      'focus-visible:ring-2',
                      'focus-visible:ring-ring',
                      'focus-visible:ring-offset-2',
                      'disabled:pointer-events-none',
                      'disabled:opacity-50',
                      '[&_svg]:pointer-events-none',
                      '[&_svg]:size-4',
                      '[&_svg]:shrink-0',
                      'border',
                      'border-input',
                      'bg-background',
                      'hover:bg-accent',
                      'hover:text-accent-foreground',
                      'size-8',
                      'opacity-70',
                      'hover:bg-muted/30',
                      'hover:opacity-100',
                    ],
                  },
                  children: [
                    // Copyアイコン (lucide-react)
                    {
                      type: 'element',
                      tagName: 'svg',
                      properties: {
                        xmlns: 'http://www.w3.org/2000/svg',
                        width: '24',
                        height: '24',
                        viewBox: '0 0 24 24',
                        fill: 'none',
                        stroke: 'currentColor',
                        strokeWidth: '2',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        className: [
                          'lucide',
                          'lucide-copy',
                          'text-muted-foreground',
                        ],
                      },
                      children: [
                        {
                          type: 'element',
                          tagName: 'rect',
                          properties: {
                            width: '14',
                            height: '14',
                            x: '8',
                            y: '8',
                            rx: '2',
                            ry: '2',
                          },
                          children: [],
                        },
                        {
                          type: 'element',
                          tagName: 'path',
                          properties: {
                            d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2',
                          },
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        };

        // 既存のpreのclassNameにpr-12を追加(コピーボタン用の余白)
        const existingClasses = Array.isArray(node.properties?.className)
          ? node.properties.className
          : typeof node.properties?.className === 'string'
            ? [node.properties.className]
            : [];

        node.properties = {
          ...node.properties,
          className: [...existingClasses, 'pr-12'],
        };

        // 親ノードの子要素をラッパーで置き換え
        parent.children[index] = wrapper;
      }
    });
  };
}

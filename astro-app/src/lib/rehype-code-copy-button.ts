import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * コードブロックにコピーボタンのコンテナを追加するrehypeプラグイン
 *
 * 元のCodeBlockコンポーネント(src/components/feature/content/code-block.tsx)と
 * 同じDOM構造を生成：
 * <div class="group relative">
 *   <pre>...</pre>
 *   <div class="copy-button-container" data-copy-button></div>
 * </div>
 *
 * ボタンの実際のレンダリングとイベントハンドリングはクライアント側(useEffect)で実施
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
            // コピーボタンコンテナ(クライアント側で実際のボタンを挿入)
            {
              type: 'element',
              tagName: 'div',
              properties: {
                className: ['copy-button-container'],
                'data-copy-button': '', // クライアント側で検出するためのマーカー
              },
              children: [],
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

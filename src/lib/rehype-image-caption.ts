import type { Element, ElementContent, Root, Text } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * 画像直後の斜体テキストをキャプションに変換するrehypeプラグイン
 *
 * remarkBreaks が有効な環境では、以下の Markdown:
 *   ![](url)
 *   *キャプション*
 *
 * は HAST 上で <p><img><br><em>キャプション</em></p> になる。
 * これを <figure data-image-figure><img><figcaption>キャプション</figcaption></figure>
 * に変換する。
 */
export function rehypeImageCaption() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'p' || !parent || index === undefined) {
        return;
      }

      // 空白テキストノードを除いた意味のある子要素を取得
      const meaningful = node.children.filter(
        (c) => !(c.type === 'text' && (c as Text).value.trim() === ''),
      );

      // 厳密に [img, br, em] の3要素のみを対象とする
      if (meaningful.length !== 3) {
        return;
      }

      const [first, second, third] = meaningful as ElementContent[];

      if (
        !(first.type === 'element' && (first as Element).tagName === 'img') ||
        !(second.type === 'element' && (second as Element).tagName === 'br') ||
        !(third.type === 'element' && (third as Element).tagName === 'em')
      ) {
        return;
      }

      const figure: Element = {
        type: 'element',
        tagName: 'figure',
        properties: { 'data-image-figure': true },
        children: [
          first as Element,
          {
            type: 'element',
            tagName: 'figcaption',
            properties: {},
            children: (third as Element).children,
          },
        ],
      };

      parent.children.splice(index, 1, figure);
    });
  };
}

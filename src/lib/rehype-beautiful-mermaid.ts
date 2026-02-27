import type { RenderOptions } from 'beautiful-mermaid';
import { renderMermaidSVGAsync } from 'beautiful-mermaid';
import type { Element, Root, RootContent, Text } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * ブログのライトモードに合わせたテーマ設定
 * ダークモードは CSS 変数オーバーライドで対応（markdown.css）
 */
const lightTheme: RenderOptions = {
  bg: '#fafafa',
  fg: '#333333',
  accent: '#003f8a',
  muted: '#595959',
  surface: '#f5f5f7',
  border: '#dbdbdb',
  line: '#dbdbdb',
  font: 'noto-sans, sans-serif',
  transparent: true,
  padding: 40,
};

/**
 * mermaid コードブロックを beautiful-mermaid で SVG に変換する rehype プラグイン
 *
 * rehypeAddMermaidClass + rehypeMermaid を置き換える。
 * エラー時は元の <pre> ブロックをそのまま残し、rehypePrettyCode がフォールバックする。
 */
export function rehypeBeautifulMermaid() {
  return async (tree: Root) => {
    const targets: Array<{
      source: string;
      index: number;
      parent: Element | Root;
    }> = [];

    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre' || typeof index !== 'number' || !parent) {
        return;
      }

      const dataLanguage = node.properties?.dataLanguage;
      const firstChild = node.children[0] as Element | undefined;

      let isMermaid = dataLanguage === 'mermaid';
      if (
        !isMermaid &&
        firstChild?.type === 'element' &&
        firstChild.tagName === 'code'
      ) {
        const codeClasses = Array.isArray(firstChild.properties?.className)
          ? firstChild.properties.className
          : [];
        isMermaid = codeClasses.includes('language-mermaid');
      }

      if (!isMermaid) {
        return;
      }

      const codeEl = firstChild as Element;
      const textNode = codeEl?.children?.[0] as Text | undefined;
      const source = textNode?.value?.trim();

      if (!source) {
        return;
      }

      targets.push({
        source,
        index,
        parent: parent as Element | Root,
      });
    });

    if (targets.length === 0) {
      return;
    }

    const results = await Promise.all(
      targets.map(async ({ source }) => {
        try {
          return await renderMermaidSVGAsync(source, lightTheme);
        } catch (error) {
          console.error('[rehype-beautiful-mermaid] Render failed:', error);
          return null;
        }
      }),
    );

    // 逆順で置換（インデックスずれ防止）
    for (let i = targets.length - 1; i >= 0; i--) {
      const svg = results[i];
      if (!svg) {
        continue;
      }

      const { index, parent } = targets[i];
      const htmlNode = {
        type: 'raw' as const,
        value: `<div class="mermaid">${svg}</div>`,
      };

      parent.children.splice(index, 1, htmlNode as unknown as RootContent);
    }
  };
}

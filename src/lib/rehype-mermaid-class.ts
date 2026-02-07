import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * rehype-mermaid用にpreタグにmermaidクラスを追加するプラグイン
 */
export function rehypeAddMermaidClass() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'pre') {
        return;
      }

      // AstroはdataLanguage属性を使う
      const dataLanguage = node.properties?.dataLanguage;

      // codeタグのclassNameもチェック(フォールバック)
      const firstChild = node.children[0] as Element | undefined;
      const codeClassName = firstChild?.properties?.className;
      const codeClassList = Array.isArray(codeClassName)
        ? codeClassName
        : typeof codeClassName === 'string'
          ? codeClassName.split(/\s+/)
          : [];

      const isMermaid =
        dataLanguage === 'mermaid' ||
        codeClassList.includes('language-mermaid');

      if (!isMermaid) {
        return;
      }

      // preタグにmermaidクラスを追加
      const preClassList = Array.isArray(node.properties?.className)
        ? node.properties.className
        : [];

      if (!preClassList.includes('mermaid')) {
        node.properties = {
          ...node.properties,
          className: [...preClassList, 'mermaid'],
        };
      }
    });
  };
}

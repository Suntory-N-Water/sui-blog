import type { Element, Root, RootContent } from 'hast';
import { visit } from 'unist-util-visit';
import { gitHubCodeHandler } from '@/lib/rich-embed/github-code';
import { speakerdeckHandler } from '@/lib/rich-embed/speakerdeck';
import { twitterHandler } from '@/lib/rich-embed/twitter';
import type { EmbedHandler } from '@/lib/rich-embed/types';
import { youtubeHandler } from '@/lib/rich-embed/youtube';

const handlers: EmbedHandler[] = [
  youtubeHandler,
  twitterHandler,
  gitHubCodeHandler,
  speakerdeckHandler,
];

/**
 * 段落ノードが純粋なURLのみを含むかどうかを判定する
 *
 * `<p><a href="url">url</a></p>` の形式(URLのみの段落)を検出する。
 * rehype-link-card.ts と同じロジックだが、既存プラグインへの変更を最小化するため独立実装。
 */
function isPureUrlParagraph(node: Element): boolean {
  if (node.tagName !== 'p' || !node.children) {
    return false;
  }

  const meaningfulChildren = node.children.filter((child) => {
    if (child.type === 'element' && child.tagName === 'br') {
      return false;
    }
    if (child.type === 'text' && /^\s*$/.test(child.value)) {
      return false;
    }
    return true;
  });

  if (meaningfulChildren.length !== 1) {
    return false;
  }

  const child = meaningfulChildren[0];
  if (child.type !== 'element' || child.tagName !== 'a') {
    return false;
  }

  const href = child.properties?.href as string;
  if (href.startsWith('http')) {
    return false;
  }

  if (child.children && child.children.length === 1) {
    const textNode = child.children[0];
    if (textNode.type === 'text' && textNode.value === href) {
      return true;
    }
  }

  return false;
}

/**
 * 対象URLをサービス固有のリッチ埋め込みに変換するrehypeプラグイン
 *
 * rehypeLinkCard の直前に配置し、YouTube / Twitter / GitHub / Speakerdeck の
 * URLを検出して埋め込みに変換する。対象外のURLやエラー時はノードをそのまま残し、
 * 後続の rehypeLinkCard がリンクカードに変換する。
 */
export function rehypeRichEmbed() {
  return async (tree: Root) => {
    const transformations: Array<{
      url: string;
      handler: EmbedHandler;
      index: number;
      parent: Element | Root;
    }> = [];

    visit(tree, 'element', (node: Element, index, parent) => {
      if (!isPureUrlParagraph(node) || !parent || typeof index !== 'number') {
        return;
      }

      const meaningfulChildren = node.children.filter((child) => {
        if (child.type === 'element' && child.tagName === 'br') {
          return false;
        }
        if (child.type === 'text' && /^\s*$/.test(child.value)) {
          return false;
        }
        return true;
      });
      const aTag = meaningfulChildren[0] as Element;
      const url = aTag.properties?.href as string;

      for (const handler of handlers) {
        if (handler.match(url)) {
          transformations.push({
            url,
            handler,
            index,
            parent: parent as Element | Root,
          });
          break;
        }
      }
    });

    // 並列で埋め込みを生成
    const results = await Promise.all(
      transformations.map(async ({ url, handler }) => {
        try {
          return await handler.render(url);
        } catch (error) {
          console.error(
            `[rehype-rich-embed] ${handler.name} error for ${url}:`,
            error,
          );
          return null;
        }
      }),
    );

    // 逆順で置換（インデックスずれ防止）
    for (let i = transformations.length - 1; i >= 0; i--) {
      const nodes = results[i];
      if (!nodes) {
        continue;
      }

      const { index, parent } = transformations[i];
      // RawNode は hast の公式型にないが rehype-stringify が allowDangerousHtml で処理する
      parent.children.splice(index, 1, ...(nodes as RootContent[]));
    }
  };
}

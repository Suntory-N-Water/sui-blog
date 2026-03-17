import DOMPurify from 'dompurify';
import type { Element, Root } from 'hast';
import { JSDOM } from 'jsdom';
import { visit } from 'unist-util-visit';
import { siteConfig } from '@/config/site';
import { getOGData } from '@/lib/fetch-og-metadata';
import { getBlogPostBySlug } from '@/lib/markdown';

// Node.js環境でDOMPurifyを初期化
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * リンクカード表示用のデータ型
 *
 * リンクカードのレンダリングに必要な情報をまとめた型定義。
 * 内部リンクと外部リンクの両方に対応しています。
 */
type LinkCardData = {
  /** リンク先のURL */
  url: string;
  /** ページタイトル */
  title: string;
  /** ページの説明文 */
  description: string;
  /** OG画像のURL(オプション) */
  image?: string;
  /** 内部リンク(ブログ記事)かどうか */
  isInternal: boolean;
  /** データ取得時にエラーが発生したかどうか */
  error: boolean;
};

/**
 * URLが内部ブログリンクかどうかを判定する
 */
function isInternalBlogLink(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // 自サイトのドメインかつ /blog/ パスの場合は内部リンク
    const siteUrlObj = new URL(siteConfig.url);
    if (urlObj.hostname === siteUrlObj.hostname) {
      return urlObj.pathname.startsWith('/blog/');
    }
    return urlObj.pathname.startsWith('/blog/');
  } catch {
    return url.startsWith('/blog/');
  }
}

/**
 * URLからslugを抽出する
 */
function getSlugFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/');
    return parts[parts.length - 1];
  } catch {
    const parts = url.split('/');
    return parts[parts.length - 1];
  }
}

/**
 * リンクカード表示用のデータを取得する
 *
 * 内部ブログリンクの場合はMarkdownファイルから、
 * 外部リンクの場合はOGデータから情報を取得します。
 * エラー時はフォールバック情報を返します。
 *
 * @param url - データ取得対象のURL
 * @returns リンクカード表示用のデータ
 */
async function fetchLinkCardData(url: string): Promise<LinkCardData> {
  const isInternal = !url.startsWith('http') && isInternalBlogLink(url);

  // Internal blog link
  if (isInternal) {
    try {
      const slug = getSlugFromUrl(url);
      const post = await getBlogPostBySlug(slug);

      if (!post) {
        return {
          url,
          title: 'Page Not Found',
          description: 'This page may have been moved or deleted.',
          isInternal: true,
          error: true,
        };
      }

      return {
        url,
        title: post.data.title,
        description: post.data.description || '',
        image: `${siteConfig.url}/blog/ogp/${slug}.png`,
        isInternal: true,
        error: false,
      };
    } catch (error) {
      console.error(`Error fetching internal blog post: ${url}`, error);
      return {
        url,
        title: 'Error',
        description: '',
        isInternal: true,
        error: true,
      };
    }
  }

  // External link
  try {
    const ogData = await getOGData(url);
    // たまにCloudflareなどのサイトでブロッキングがあり、 title が「Just a moment...」になってしまうことがあるため
    // その場合はタイトルを削除する
    const BLOCKED_TITLES = ['Just a moment...'];
    const isBlocked = BLOCKED_TITLES.includes(ogData.title);

    if (!ogData.title || isBlocked) {
      return {
        url,
        title: 'Page Not Found',
        description: 'Failed to fetch link preview.',
        isInternal: false,
        error: true,
      };
    }

    return {
      url,
      title: ogData.title,
      description: ogData.description || '',
      image: ogData.image,
      isInternal: false,
      error: false,
    };
  } catch (error) {
    console.error(`Error fetching OG data for ${url}:`, error);
    return {
      url,
      title: 'Error',
      description: '',
      isInternal: false,
      error: true,
    };
  }
}

/**
 * リンクカードのHTML文字列を生成する
 *
 * LinkCardDataからリンクカードのHTMLを生成します。
 * 内部リンクと外部リンクで表示内容が異なります。
 * セキュリティ: 生成されたHTMLはDOMPurifyでサニタイズされます。
 *
 * @param data - リンクカード表示用のデータ
 * @returns 生成されたサニタイズ済みのHTMLタグ文字列
 */
function createLinkCardHTML(data: LinkCardData): string {
  const { url, title, description, image, isInternal, error } = data;
  const hostname = url.startsWith('http') ? new URL(url).hostname : '';

  const cardClasses = `group my-4 flex overflow-hidden rounded-lg border bg-card transition-all duration-200 hover:bg-accent/5 hover:shadow-md ${
    error ? 'border-border/50 bg-card/50' : ''
  }`;

  const linkAttrs = isInternal
    ? `href="${url}" class="${cardClasses}"`
    : `href="${url}" target="_blank" rel="noopener noreferrer" class="${cardClasses}"`;

  const iconSection = isInternal
    ? `<span class="flex items-center gap-1.5">
        <div class="size-4 rounded-full bg-primary/10">
          <span class="flex size-full items-center justify-center text-[10px] font-bold text-primary">B</span>
        </div>
        <span>Blog Post</span>
      </span>`
    : `<div class="relative size-4 overflow-hidden rounded-full bg-muted">
        <img src="https://www.google.com/s2/favicons?domain=${hostname}&sz=32" alt="${hostname} のアイコン" class="object-cover" loading="lazy" width="16" height="16" style="width: 16px; height: 16px;" />
      </div>
      <span>${hostname.replace(/^www\./, '')}</span>
      <svg class="size-3 text-muted-foreground/70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
      </svg>`;

  const imageSection = image
    ? `<div class="hidden w-[148px] shrink-0 sm:block">
        <div class="relative size-full">
          <img src="${image}" alt="${title}" class="object-cover" loading="lazy" style="position: absolute; height: 100%; width: 100%; inset: 0px; color: transparent;" />
        </div>
      </div>`
    : `<div class="hidden w-[148px] shrink-0 bg-muted/30 sm:block">
        <div class="flex size-full items-center justify-center">
          <span class="text-4xl text-muted-foreground/20">${isInternal ? '📝' : '🔗'}</span>
        </div>
      </div>`;

  const html = `<a ${linkAttrs}>
    <div class="flex flex-1 flex-col gap-2 p-4">
      <div class="flex items-center gap-1">
        <div class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          ${iconSection}
        </div>
      </div>
      <div class="flex-1">
        <h3 class="font-semibold leading-tight text-foreground transition-colors group-hover:text-accent">
          ${error ? 'Page Not Found' : title}
        </h3>
        ${
          description
            ? `<p class="mt-1.5 line-clamp-2 text-sm text-muted-foreground">${description}</p>`
            : ''
        }
      </div>
    </div>
    ${imageSection}
  </a>`;

  // XSS攻撃を防ぐためHTMLをサニタイズ
  return purify.sanitize(html, {
    ALLOWED_TAGS: [
      'a',
      'div',
      'span',
      'h3',
      'p',
      'img',
      'svg',
      'path',
      'polyline',
      'line',
    ],
    ALLOWED_ATTR: [
      'href',
      'target',
      'rel',
      'class',
      'src',
      'alt',
      'loading',
      'width',
      'height',
      'style',
      'xmlns',
      'viewBox',
      'fill',
      'stroke',
      'stroke-width',
      'stroke-linecap',
      'stroke-linejoin',
      'x1',
      'y1',
      'x2',
      'y2',
      'points',
    ],
  });
}

/**
 * 段落ノードが純粋なURLのみを含むかどうかを判定する
 *
 * `<p><a href="url">url</a></p>` の形式(URLのみの段落)を検出します。
 * 空白のみのテキストノードや`<br>`要素は無視され、実質的なコンテンツとして
 * URLリンクのみが含まれている場合にtrueを返します。
 * この形式の段落はリンクカードに変換されます。
 *
 * @param node - 判定対象の要素ノード
 * @returns 純粋なURLのみの段落の場合true
 */
function isPureUrlParagraph(node: Element): boolean {
  // <p><a href="url">url</a></p> の形式を検出
  // 空白のみのテキストノードと<br>要素は無視する
  if (node.tagName !== 'p' || !node.children) {
    return false;
  }

  // 空白のみのテキストノードと<br>要素を除外した子要素を取得
  const meaningfulChildren = node.children.filter((child) => {
    // <br>要素は無視
    if (child.type === 'element' && child.tagName === 'br') {
      return false;
    }
    // 空白のみのテキストノードは無視
    if (child.type === 'text' && /^\s*$/.test(child.value)) {
      return false;
    }
    return true;
  });

  // 実質的な子要素が1つだけであることを確認
  if (meaningfulChildren.length !== 1) {
    return false;
  }

  const child = meaningfulChildren[0];
  if (child.type !== 'element' || child.tagName !== 'a') {
    return false;
  }

  const href = child.properties?.href as string;
  if (!href || !href.startsWith('http')) {
    return false;
  }

  // リンクのテキストがURLと同じか確認
  if (child.children && child.children.length === 1) {
    const textNode = child.children[0];
    if (textNode.type === 'text' && textNode.value === href) {
      return true;
    }
  }

  return false;
}

/**
 * Markdown内の単体URLをリンクカードに変換するrehypeプラグイン
 *
 * `<p><a href="url">url</a></p>` 形式の段落を検出し、
 * OGデータを取得してリンクカード表示に変換します。
 * 内部ブログリンクと外部リンクの両方に対応しています。
 */
export function rehypeLinkCard() {
  return async (tree: Root) => {
    const transformations: Array<{
      node: Element;
      index: number;
      parent: Element;
    }> = [];

    // プレーンURLを含むpタグを検出
    visit(tree, 'element', (node: Element, index, parent) => {
      if (isPureUrlParagraph(node) && parent && typeof index === 'number') {
        transformations.push({
          node,
          index,
          parent: parent as Element,
        });
      }
    });

    // 並列でOG情報を取得
    const linkCardDataPromises = transformations.map(async ({ node }) => {
      const aTag = node.children[0] as Element;
      const url = aTag.properties?.href as string;
      return fetchLinkCardData(url);
    });

    const linkCardDataList = await Promise.all(linkCardDataPromises);

    // HTMLノードに置き換え
    transformations.forEach(({ index, parent }, i) => {
      const linkCardData = linkCardDataList[i];
      const html = createLinkCardHTML(linkCardData);

      const htmlNode = {
        type: 'raw' as const,
        value: html,
      };

      parent.children[index] = htmlNode;
    });
  };
}

import type { EmbedHandler, RawNode } from './types';
import { isTwitterUrl } from './url-matchers';

/**
 * Twitter/X URLを正規化する（x.com → twitter.com）
 */
function normalizeTwitterUrl(url: string): string {
  return url.replace(/^(https?:\/\/)x\.com\//, '$1twitter.com/');
}

export const twitterHandler: EmbedHandler = {
  name: 'Twitter',
  match: isTwitterUrl,
  render: async (url) => {
    const normalizedUrl = normalizeTwitterUrl(url);
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(normalizedUrl)}&omit_script=true&dnt=true`;

    const response = await fetch(oembedUrl);
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { html?: string };
    if (!data.html?.includes('<blockquote')) {
      return null;
    }

    const wrapper: RawNode = {
      type: 'raw',
      value: `<div data-embed-type="twitter" class="embed-twitter">${data.html}</div>`,
    };

    return [wrapper];
  },
};

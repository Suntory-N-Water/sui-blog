import type { EmbedHandler, RawNode } from './types';
import { isSpeakerdeckUrl } from './url-matchers';

export const speakerdeckHandler: EmbedHandler = {
  name: 'Speakerdeck',
  match: isSpeakerdeckUrl,
  render: async (url) => {
    const oembedUrl = `https://speakerdeck.com/oembed.json?url=${encodeURIComponent(url)}`;

    const response = await fetch(oembedUrl);
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { html?: string };
    if (!data.html?.includes('<iframe')) {
      return null;
    }

    const wrapper: RawNode = {
      type: 'raw',
      value: `<div data-embed-type="speakerdeck" class="embed-speakerdeck">${data.html}</div>`,
    };

    return [wrapper];
  },
};

import type { Element } from 'hast';
import type { EmbedHandler } from './types';
import { isYouTubeUrl, YOUTUBE_RE } from './url-matchers';

/**
 * YouTube URLからvideoIdとstart秒数を抽出する
 */
function parseYouTubeUrl(url: string): {
  videoId: string;
  start?: number;
} | null {
  const match = url.match(YOUTUBE_RE);
  if (!match) {
    return null;
  }

  const videoId = match[1];
  let start: number | undefined;

  try {
    const urlObj = new URL(url);
    const startSeconds = urlObj.searchParams.get('t');
    if (startSeconds) {
      start = Number.parseInt(startSeconds, 10);
      if (Number.isNaN(start)) {
        start = undefined;
      }
    }
  } catch {
    // youtu.be 形式で ?t= がない場合は無視
  }

  return { videoId, start };
}

export const youtubeHandler: EmbedHandler = {
  name: 'YouTube',
  match: isYouTubeUrl,
  render: async (url) => {
    const parsed = parseYouTubeUrl(url);
    if (!parsed) {
      return null;
    }

    const { videoId, start } = parsed;
    let embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}`;
    if (start) {
      embedSrc += `?start=${start}`;
    }

    const wrapper: Element = {
      type: 'element',
      tagName: 'div',
      properties: {
        'data-embed-type': 'youtube',
        className: ['embed-youtube'],
      },
      children: [
        {
          type: 'element',
          tagName: 'iframe',
          properties: {
            src: embedSrc,
            title: 'YouTube video player',
            allow:
              'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            allowfullscreen: true,
            loading: 'lazy',
          },
          children: [],
        },
      ],
    };

    return [wrapper];
  },
};

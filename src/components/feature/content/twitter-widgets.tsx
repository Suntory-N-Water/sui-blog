import { useEffect } from 'react';

declare global {
  // biome-ignore lint/style/useConsistentTypeDefinitions: グローバル型拡張にはinterfaceマージが必要
  interface Window {
    twttr?: { widgets: { load: () => void } };
  }
}

/**
 * Twitter widgets.js を遅延ロードし、埋め込みツイートをレンダリングする。
 * 既存の CodeCopyButtons, ImageZoom と同じパターン:
 * - useEffect で DOM を検索
 * - 対象がなければ即 return（ゼロコスト）
 * - return null（UIは oEmbed の blockquote で既に存在）
 */
export function TwitterWidgets() {
  useEffect(() => {
    const tweets = document.querySelectorAll('[data-embed-type="twitter"]');
    if (tweets.length === 0) {
      return;
    }

    if (window.twttr) {
      window.twttr.widgets.load();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return null;
}

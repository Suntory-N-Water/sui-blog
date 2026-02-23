import { useEffect } from 'react';

/**
 * マークダウン記事内の画像にクリックズーム機能を追加する。
 * `<dialog>` のネイティブ API を使用し、Escape キーや背景クリックで閉じる。
 */
export function ImageZoom() {
  useEffect(() => {
    const images = document.querySelectorAll<HTMLImageElement>(
      '.markdown-content img:not(.group img)',
    );

    if (images.length === 0) {
      return;
    }

    const abortController = new AbortController();
    const { signal } = abortController;

    // dialog を1つだけ作成して再利用
    // Tailwind の display 系クラス (flex等) は dialog のデフォルト display:none を上書きするため、
    // レイアウトは CSS 側の [open] セレクタで制御する
    const dialog = document.createElement('dialog');
    dialog.className = 'image-zoom-dialog';

    const zoomedImg = document.createElement('img');
    zoomedImg.className = 'image-zoom-img';
    dialog.appendChild(zoomedImg);

    document.body.appendChild(dialog);

    // dialog の背景クリックで閉じる
    dialog.addEventListener(
      'click',
      (e) => {
        if (e.target === dialog) {
          dialog.close();
        }
      },
      { signal },
    );

    // 画像クリックでも閉じる
    zoomedImg.addEventListener(
      'click',
      () => {
        dialog.close();
      },
      { signal },
    );

    // 各画像にクリックイベントを付与
    for (const img of images) {
      img.addEventListener(
        'click',
        () => {
          // currentSrc はブラウザが srcset/src から実際に選択した完全な URL
          zoomedImg.src = img.currentSrc || img.src;
          zoomedImg.alt = img.alt;
          dialog.showModal();
        },
        { signal },
      );
    }

    return () => {
      abortController.abort();
      dialog.close();
      dialog.remove();
    };
  }, []);

  return null;
}

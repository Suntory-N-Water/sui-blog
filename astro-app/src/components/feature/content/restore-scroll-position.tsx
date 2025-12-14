import { useLayoutEffect } from 'react';
import { BLOG_NAVIGATION_CONSTANTS } from '@/constants';

type Props = {
  pathname: string;
};

/**
 * ブログ一覧ページで、sessionStorageに保存されたスクロール位置を復元する。
 * RememberBlogListPathと組み合わせて使用する。
 */
export function RestoreScrollPosition({ pathname }: Props) {
  // useLayoutEffectでレンダリング前に実行(チラつき防止)
  useLayoutEffect(() => {
    // ブログ一覧ページ以外では何もしない
    if (
      !pathname ||
      (pathname !== '/blog' && !pathname.startsWith('/blog/page/'))
    ) {
      return;
    }

    // 保存されたパスを確認
    const savedPath = window.sessionStorage.getItem(
      BLOG_NAVIGATION_CONSTANTS.LIST_PATH_STORAGE_KEY,
    );

    // 保存されたパスと現在のパスが一致する場合のみ復元
    if (savedPath !== pathname) {
      return;
    }

    // スクロール位置の復元
    const savedScrollPos = window.sessionStorage.getItem(
      BLOG_NAVIGATION_CONSTANTS.SCROLL_POSITION_KEY,
    );

    if (savedScrollPos) {
      const scrollY = Number.parseInt(savedScrollPos, 10);
      if (!Number.isNaN(scrollY)) {
        // 即座にスクロール(チラつき防止のため遅延なし)
        window.scrollTo(0, scrollY);

        // 復元後にsessionStorageをクリア
        window.sessionStorage.removeItem(
          BLOG_NAVIGATION_CONSTANTS.SCROLL_POSITION_KEY,
        );
      }
    }
  }, [pathname]);

  return null;
}

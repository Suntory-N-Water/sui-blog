import { useEffect } from 'react';
import { BLOG_NAVIGATION_CONSTANTS } from '@/constants';

type Props = {
  pathname: string;
};

/**
 * ブログ一覧系ページで、最後に表示したパスを sessionStorage に記録する。
 */
export function RememberBlogListPath({ pathname }: Props) {
  useEffect(() => {
    if (!pathname) {
      return;
    }
    const isBlogListPage =
      pathname === '/blog' || pathname.startsWith('/blog/page/');

    if (isBlogListPage) {
      // ブログ一覧ページにいる時はパスを保存
      window.sessionStorage.setItem(
        BLOG_NAVIGATION_CONSTANTS.LIST_PATH_STORAGE_KEY,
        pathname,
      );

      // リンククリックを監視
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // クリックされた要素またはその親要素がaタグか確認
        const link = target.closest('a');

        if (link?.href) {
          const url = new URL(link.href);
          // /blog/xxx(詳細ページ)へのリンクの場合
          if (
            url.pathname.startsWith('/blog/') &&
            url.pathname !== '/blog' &&
            !url.pathname.startsWith('/blog/page/')
          ) {
            const scrollY = window.scrollY;

            window.sessionStorage.setItem(
              BLOG_NAVIGATION_CONSTANTS.SCROLL_POSITION_KEY,
              String(scrollY),
            );
          }
        }
      };

      document.addEventListener('click', handleClick);

      return () => {
        document.removeEventListener('click', handleClick);
      };
    }
  }, [pathname]);

  return null;
}

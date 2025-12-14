import { useCallback } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { BLOG_NAVIGATION_CONSTANTS } from '@/constants';
import { isBlogListPath } from '@/lib/blog-navigation';

type Props = {
  className?: string;
};

/**
 * ブログ詳細ページで「元の一覧へ戻る」ナビゲーションを提供するボタン。
 * 優先度: 保存済みパス → 自サイト referrer が一覧系 → `/blog` フォールバック。
 */
export function BlogBackButton({ className }: Props) {
  const handleClick = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // 1. 保存してある一覧パスがあれば最優先
    const savedKey = BLOG_NAVIGATION_CONSTANTS.LIST_PATH_STORAGE_KEY;
    const saved = window.sessionStorage.getItem(savedKey);
    if (saved && isBlogListPath(saved)) {
      window.location.href = saved;
      return;
    }

    // 2. referrer が自サイトかつ一覧系ならそこへ push
    const referrer = document.referrer;
    if (referrer) {
      try {
        const currentOrigin = window.location.origin;
        const url = new URL(referrer);
        const refPath = url.pathname + url.search;
        if (url.origin === currentOrigin && isBlogListPath(refPath)) {
          window.location.href = refPath;
          return;
        }
      } catch {
        // 解析失敗時はフォールバックへ
      }
    }

    // 3. どれもなければ /blog
    window.location.href = '/blog';
  }, []);

  return (
    <Button
      type='button'
      variant='ghost'
      className={className ?? 'h-9 px-2'}
      onClick={handleClick}
    >
      <span className='group inline-flex items-center'>
        <Icons.arrowLeft className='mr-2 size-4 transition-transform group-hover:-translate-x-1' />
        ブログ一覧に戻る
      </span>
    </Button>
  );
}

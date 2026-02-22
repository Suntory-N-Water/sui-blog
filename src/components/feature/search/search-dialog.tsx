import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { SEARCH_CONSTANTS } from '@/constants';

/**
 * 検索ダイアログコンポーネント
 *
 * PagefindUIを使用したブログ記事の検索機能を提供します。
 * Cmd+K (Mac) / Ctrl+K (Windows) でダイアログを開くことができます。
 * Header からは `open-search` カスタムイベント経由で開かれます。
 *
 * 公式の推奨アプローチに基づき、dynamic importとwebpackIgnoreを使用して実装しています。
 * これにより、開発環境でのエラーハンドリングとビルド後の正しいパス解決を実現しています。
 *
 * @param pathname - 現在のページパス
 * @see https://pagefind.app/docs/ui/
 * @see https://www.petemillspaugh.com/using-pagefind-with-nextjs
 */
export function SearchDialog({ pathname }: { pathname: string }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pagefindLoaded, setPagefindLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const previousPathnameRef = useRef(pathname);

  // クライアントマウント完了フラグ
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Header の検索ボタンから dispatch される `open-search` カスタムイベントを受け取る
   */
  useEffect(() => {
    const handleOpenSearch = () => setOpen(true);
    document.addEventListener('open-search', handleOpenSearch);
    return () => document.removeEventListener('open-search', handleOpenSearch);
  }, []);

  /**
   * Cmd+K / Ctrl+K でダイアログを開く
   *
   * 外部システム(ブラウザのキーボードイベント)との同期のため、useEffectを使用。
   */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        e.key === SEARCH_CONSTANTS.KEYBOARD_SHORTCUT.key &&
        (e.metaKey || e.ctrlKey)
      ) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  /**
   * Escapeキーでダイアログを閉じる
   *
   * ダイアログが開いているときのみEscapeキーのハンドラーを登録する。
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  /**
   * PagefindUIのロードと初期化
   *
   * 公式推奨のアプローチに基づき、CSSとJSを動的にロード。
   * - CSSを<link>タグで読み込み
   * - JSをdynamic importで読み込み(webpackIgnoreでパスを維持)
   * - try-catchで開発環境のエラーハンドリング
   * - translationsオプションで日本語UIを実現
   * - processResultでURLを正規化
   */
  useEffect(() => {
    async function loadPagefind() {
      if (pagefindLoaded) {
        return;
      }

      try {
        // CSSを読み込み(既に読み込まれていない場合のみ)
        if (!document.querySelector('link[href="/pagefind/pagefind-ui.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = '/pagefind/pagefind-ui.css';
          document.head.appendChild(link);
        }

        // JSを動的にロード
        // 開発モードでは /dist 配下のファイルを参照
        const jsPath = import.meta.env.DEV
          ? '/dist/pagefind/pagefind-ui.js'
          : '/pagefind/pagefind-ui.js';
        await import(/* webpackIgnore: true */ /* @vite-ignore */ jsPath);
        // PagefindUIはグローバルに登録されるため、windowオブジェクトから取得
        if (!window.PagefindUI) {
          console.warn('PagefindUI not found in window object');
          return;
        }

        // PagefindUI インスタンスを生成
        new window.PagefindUI({
          element: '#search',
          bundlePath: '/pagefind/',
          showSubResults: true,
          translations: {
            placeholder: '記事を検索...',
            clear_search: 'クリア',
            load_more: 'さらに読み込む',
            search_label: '検索',
            filters_label: 'フィルター',
            zero_results:
              '[SEARCH_TERM] に一致する記事は見つかりませんでした。',
            many_results: '[SEARCH_TERM] の検索結果([COUNT] 件)',
            one_result: '[SEARCH_TERM] の検索結果([COUNT] 件)',
            alt_search: '[SEARCH_TERM] の検索結果',
            search_suggestion:
              '検索結果が見つかりませんでした。別のキーワードをお試しください。',
            searching: '検索中...',
          },
          processResult: (result: {
            url: string;
            meta: { image?: string };
          }) => {
            if (result.meta.image) {
              result.meta.image = result.meta.image.replaceAll('&amp;', '&');
            }
            return result;
          },
        });

        setPagefindLoaded(true);
      } catch (error) {
        // 開発環境ではPagefindがまだ生成されていない可能性がある
        console.warn('Pagefind not available:', error);
      }
    }

    if (open && !pagefindLoaded) {
      loadPagefind();
    }
  }, [open, pagefindLoaded]);

  /**
   * ダイアログが開くたびに検索入力にフォーカス
   *
   * 外部システム(ブラウザのDOM API)との同期のため、useEffectを使用。
   * PagefindUIが生成するDOMに対してフォーカスを当てる。
   */
  useEffect(() => {
    if (!open || !pagefindLoaded) {
      return;
    }

    const timer = setTimeout(() => {
      document
        .querySelector<HTMLElement>('.pagefind-ui__search-input')
        ?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [open, pagefindLoaded]);

  /**
   * 検索結果クリック時のナビゲーションを制御
   *
   * PagefindUIが生成する結果リンクのクリックを捕捉し、
   * 画面遷移が完了するまでダイアログを開いたままにします。
   */
  useEffect(() => {
    // ダイアログが開いており、PagefindのDOMが生成済みのときのみクリックを拾う
    if (!open || !pagefindLoaded) {
      return;
    }

    const container = searchContainerRef.current;
    // refが未セットの場合の安全装置
    if (!container) {
      return;
    }

    const handleResultClick = (event: MouseEvent) => {
      if (isNavigating) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const anchor = target.closest<HTMLAnchorElement>('a');
      if (!anchor) {
        return;
      }

      event.preventDefault();
      setIsNavigating(true);
      window.location.href = anchor.pathname + anchor.search;
    };

    container.addEventListener('click', handleResultClick);
    return () => container.removeEventListener('click', handleResultClick);
  }, [open, pagefindLoaded, isNavigating]);

  /**
   * ルート変更完了時にダイアログを閉じ、ナビゲーション状態をリセット
   */
  useEffect(() => {
    if (pathname !== previousPathnameRef.current) {
      previousPathnameRef.current = pathname;
      setIsNavigating(false);
      if (open) {
        setOpen(false);
      }
    }
  }, [pathname, open]);

  // サーバー側では document が無いため、マウント前は何も描画しない
  if (!mounted) {
    return null;
  }

  // React Portalを使用してdocument.bodyに直接レンダリング
  // ダイアログを閉じてもアンマウントせず、CSSで非表示にする(PagefindUIのDOMを保持するため)
  return createPortal(
    <div className={open ? '' : 'hidden'}>
      {/* オーバーレイ */}
      <button
        type='button'
        className='fixed inset-0 z-40 bg-black/80 backdrop-blur-sm'
        onClick={() => setOpen(false)}
        aria-label='検索ダイアログを閉じる'
        tabIndex={-1}
      />

      {/* ダイアログコンテンツ */}
      <div className='fixed left-0 right-0 top-0 z-50 mx-auto mt-8 flex max-h-[85vh] min-h-[20rem] max-w-4xl overflow-y-auto rounded-lg border border-border bg-background p-6 pb-8 text-foreground shadow-lg md:mt-16 md:max-h-[75vh]'>
        <div id='search' ref={searchContainerRef} className='w-full' />
      </div>
    </div>,
    document.body,
  );
}

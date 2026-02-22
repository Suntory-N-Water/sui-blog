import { Book, History, Search, User } from 'lucide-react';
import type { ReactElement } from 'react';
import { Icons } from '@/components/icons';
import HamburgerMenu from '@/components/shared/mobile-menu';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { cn } from '@/lib/utils';

type MenuItemLinkProps = {
  href: string;
  title: string;
  icon: ReactElement;
};

const NAVIGATION_LINKS: MenuItemLinkProps[] = [
  {
    href: '/blog/',
    title: 'Blog',
    icon: <Book className='size-5' />,
  },
  {
    href: '/about/',
    title: 'About',
    icon: <User className='size-5' />,
  },
  {
    href: '/tags/',
    title: 'Tags',
    icon: <Icons.tag className='size-5' />,
  },
  {
    href: '/recap/',
    title: 'Recap',
    icon: <History className='size-5' />,
  },
];

type HeaderProps = {
  pathname: string;
};

function openSearch() {
  document.dispatchEvent(new CustomEvent('open-search'));
}

/**
 * アプリケーション全体のヘッダーコンポーネント
 *
 * このコンポーネントはサイトの最上部に固定表示され、ロゴ、ナビゲーションリンク、
 * テーマ切り替えボタン、モバイルメニューを含みます。
 * 現在のページに応じてナビゲーションリンクがアクティブ状態で表示されます。
 *
 * @param pathname - 現在のページパス
 * @returns ヘッダーコンポーネント
 */
export default function Header({ pathname }: HeaderProps) {
  /**
   * 指定されたリンクが現在のページでアクティブかどうかを判定
   *
   * ルートパス('/')の場合は完全一致が必要で、他のページでもハイライトされないようにします。
   * その他のパスは前方一致で判定し、サブページでも親ページのリンクがアクティブになります。
   *
   * @param linkHref - 判定対象のリンクパス(例: '/', '/posts', '/blog')
   * @returns リンクがアクティブな場合はtrue、それ以外はfalse
   */
  function isLinkActive(linkHref: string): boolean {
    // Exact match required for the root path to avoid highlighting on all pages
    if (linkHref === '/') {
      return pathname === linkHref;
    }
    return pathname.startsWith(linkHref);
  }

  return (
    <header className='sticky top-0 z-30 h-16 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm transition-all duration-300'>
      {/* Maintain container and alignment */}
      <div className='container relative mx-auto flex h-full max-w-6xl items-center justify-between px-4'>
        {/* Logo */}
        <a
          href='/'
          className='group flex items-center gap-2 transition-transform duration-300 hover:scale-105'
          aria-label='sui Tech Blog ホームへ戻る'
        >
          <img
            src='/icons/icon.webp'
            alt='ブログサイトのロゴ'
            width={32}
            height={32}
            className='rounded-full'
          />
          <span className='font-bold tracking-tight text-base transition-colors group-hover:text-primary'>
            sui Tech Blog
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className='hidden items-center gap-1 rounded-full border border-border/50 bg-secondary/20 px-2 py-1 backdrop-blur-md md:flex'>
          {NAVIGATION_LINKS.map((link) => (
            <Button
              key={link.href}
              variant='ghost'
              size='sm'
              asChild
              className={cn(
                'rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors',
                isLinkActive(link.href) &&
                  'bg-background text-foreground font-bold',
              )}
            >
              <a href={link.href}>{link.title}</a>
            </Button>
          ))}
        </nav>

        {/* Right side elements: Search, Theme toggle and Mobile Menu */}
        <div className='flex items-center gap-2'>
          {/* Search Buttons */}
          <button
            type='button'
            onClick={openSearch}
            className='hidden h-9 items-center justify-start gap-2 overflow-hidden rounded-lg border border-border/50 bg-secondary/20 px-3 text-sm font-medium text-muted-foreground transition-all hover:border-border/80 hover:bg-secondary/60 hover:text-foreground w-48 lg:w-64 md:inline-flex'
          >
            <Search className='h-4 w-4 transition-transform group-hover:scale-110' />
            <span>Search...</span>
            <kbd className='ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-background/50 px-1.5 font-mono text-[10px] font-medium opacity-100 lg:flex'>
              <span className='text-xs'>⌘</span>K
            </kbd>
          </button>

          <button
            type='button'
            onClick={openSearch}
            className='inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-secondary/20 text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground md:hidden'
            aria-label='Search'
          >
            <Search className='h-4 w-4' />
          </button>

          <div className='inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-secondary/20 text-muted-foreground transition-all hover:border-border/80 hover:bg-secondary/60'>
            <ModeToggle />
          </div>

          {/* Pass updated links to mobile menu */}
          <div className='md:hidden'>
            <HamburgerMenu params={NAVIGATION_LINKS} />
          </div>
        </div>
      </div>
    </header>
  );
}

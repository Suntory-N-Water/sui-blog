import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 検索トリガーボタンコンポーネント
 *
 * ヘッダーに配置される検索機能のトリガーボタンです。
 * デスクトップでは「記事を検索...」とキーボードショートカット(⌘K)を表示し、
 * モバイルでは検索アイコンのみを表示します。
 *
 * @param onClick - ボタンクリック時のハンドラー
 */
export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant='outline'
      className='relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2'
      onClick={onClick}
    >
      <Search className='h-4 w-4 xl:mr-2' aria-hidden='true' />
      <span className='hidden xl:inline-flex'>記事を検索...</span>
      <kbd className='pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-foreground opacity-100 xl:flex'>
        <span className='text-xs text-foreground'>⌘</span>K
      </kbd>
    </Button>
  );
}

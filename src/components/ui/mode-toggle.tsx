import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ダークモードトグルボタン
 * テーマの切り替えボタンを表示します。
 * window.toggleTheme()を呼び出してテーマを切り替えます。
 */
export function ModeToggle() {
  const handleToggle = () => {
    if (typeof window !== 'undefined' && window.toggleTheme) {
      window.toggleTheme();
    }
  };

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={handleToggle}
      aria-label='テーマを切り替える'
    >
      <Sun className='size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
      <Moon className='absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
      <span className='sr-only'>テーマを切り替える</span>
    </Button>
  );
}

// window.toggleTheme の型定義
declare global {
  // biome-ignore lint/style/useConsistentTypeDefinitions: 型拡張のため
  interface Window {
    toggleTheme: () => void;
  }
}

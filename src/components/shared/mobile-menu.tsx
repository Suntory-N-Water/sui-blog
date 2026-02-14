import { Menu } from 'lucide-react';
import type { ReactElement } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

type Props = {
  params: {
    href: string;
    title: string;
    icon: ReactElement;
  }[];
};

/**
 * モバイル用ハンバーガーメニューコンポーネント
 *
 * このコンポーネントはモバイルデバイスで表示されるドロップダウンメニューです。
 * ハンバーガーアイコンをクリックすると、ナビゲーションリンクの一覧が表示されます。
 * デスクトップ表示では非表示になります。
 *
 * @param params - ナビゲーションリンクの配列。各項目はhref(リンク先)、title(表示テキスト)、icon(アイコン)を含みます
 * @returns モバイルメニューコンポーネント
 */
export default function HamburgerMenu({ params }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className='p-1 md:hidden'
        aria-label='メニューを開く'
      >
        <Menu className='size-7' aria-hidden='true' />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='mr-4 w-[200px] py-1.5'>
        {params.map((param) => (
          <a
            className='w-full items-center py-1'
            href={param.href}
            key={param.href}
          >
            <DropdownMenuItem className='flex w-full gap-2 py-2'>
              {param.icon}
              {param.title}
            </DropdownMenuItem>
          </a>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

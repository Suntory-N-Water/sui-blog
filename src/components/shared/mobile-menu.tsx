import { Menu } from 'lucide-react';
import { type ReactElement, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  params: {
    href: string;
    title: string;
    icon: ReactElement;
  }[];
};

export default function HamburgerMenu({ params }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className='relative' ref={menuRef}>
      <button
        type='button'
        className='flex h-11 w-11 items-center justify-center rounded-lg md:hidden'
        aria-label='メニューを開く'
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Menu className='size-7' aria-hidden='true' />
      </button>
      <div
        className={cn(
          'absolute right-0 top-full z-50 mt-1 w-[200px] origin-top-right rounded-md border bg-popover p-1 text-popover-foreground shadow-md transition-all duration-150',
          open
            ? 'scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0',
        )}
        role='menu'
      >
        {params.map((param) => (
          <a
            key={param.href}
            href={param.href}
            role='menuitem'
            className='flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
          >
            {param.icon}
            {param.title}
          </a>
        ))}
      </div>
    </div>
  );
}

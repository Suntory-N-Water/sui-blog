import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

type Props = {
  /**
   * コピーするMarkdownコンテンツ
   */
  content: string;
};

/**
 * Markdownコンテンツをクリップボードにコピーするボタンコンポーネント
 *
 * 生成AIに記事を読み込ませる用途を想定しています。
 * ボタンをクリックするとMarkdownコンテンツがクリップボードにコピーされ、
 * 2秒間チェックマークとコピー完了メッセージが表示されます。
 *
 * @param props - コンポーネントのプロパティ
 * @param props.content - コピーするMarkdownテキスト(ブログ記事のrawContent)
 */
export function MarkdownCopyButton({ content }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    // 2秒後にチェックマークをコピーアイコンに戻す
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={handleCopy}
      className='inline-flex items-center gap-1.5 px-3 text-sm'
    >
      {copied ? (
        <Icons.check className='size-4' />
      ) : (
        <Icons.copy className='size-4' />
      )}
      <span>{copied ? 'コピーしました' : 'Markdownをコピー'}</span>
    </Button>
  );
}

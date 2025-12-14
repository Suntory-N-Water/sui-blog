import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * フォールバック機能付き画像コンポーネントのProps型定義
 */
type ImageWithFallbackProps = {
  /** 画像のURL(オプション) */
  src?: string;
  /** 画像の代替テキスト */
  alt: string;
  /** カスタムCSSクラス名(オプション) */
  className?: string;
};

/**
 * フォールバック機能付き画像コンポーネント
 *
 * 画像の読み込みに失敗した場合やURLが存在しない場合に、
 * デフォルトのプレースホルダーアイコン(🔗)を表示します。
 * リンクカードなどで画像が取得できない場合のフォールバックに使用されます。
 *
 * @param props - 画像コンポーネントのプロパティ
 * @returns 画像要素またはフォールバック要素
 */
export function ImageWithFallback({
  src,
  alt,
  className,
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className='flex size-full items-center justify-center bg-muted/30'>
        <span className='text-4xl text-muted-foreground/20'>🔗</span>
      </div>
    );
  }

  return (
    <img
      src={src || '/placeholder.svg'}
      alt={alt}
      className={cn('object-cover w-full h-full', className)}
      onError={() => setError(true)}
    />
  );
}

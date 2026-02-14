import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 日付を日本語形式(年/月/日)にフォーマットする
 *
 * 入力された日付を日本のタイムゾーン(Asia/Tokyo)で
 * YYYY/M/D形式の文字列に変換します。
 *
 * @param input - フォーマットする日付(文字列またはUnixタイムスタンプ)
 * @returns 日本語形式の日付文字列(例：2025/11/15)
 */
export function formatDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

/**
 * 相対パスを絶対URLに変換する
 */
export function absoluteUrl(path: string) {
  const baseUrl =
    import.meta.env.PUBLIC_APP_URL ??
    import.meta.env.SITE ??
    'http://localhost:4321';
  // 拡張子がないパスには末尾スラッシュを付与
  const normalizedPath =
    path === '/' || /\.\w+$/.test(path) ? path : path.replace(/\/?$/, '/');
  return `${baseUrl}${normalizedPath}`;
}

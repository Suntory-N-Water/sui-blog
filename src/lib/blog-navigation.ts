/**
 * ブログ一覧系のパスかどうかを判定する。
 */
export function isBlogListPath(pathname: string): boolean {
  const [onlyPath] = pathname.split('?');

  if (onlyPath === '/blog/') {
    return true;
  }
  if (onlyPath.startsWith('/blog/page/')) {
    return true;
  }

  return false;
}

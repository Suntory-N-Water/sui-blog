/**
 * ブログ一覧系のパスかどうかを判定する。
 *
 * @example
 * ```ts
 * const ok = isBlogListPath('/blog/page/2'); // true
 * const ng = isBlogListPath('/blog/example-post'); // false
 * ```
 *
 * @param pathname 判定対象のパス(クエリは含まれていても良い)
 * @returns 一覧系パスなら true
 */
export function isBlogListPath(pathname: string): boolean {
  const [onlyPath] = pathname.split('?');

  if (onlyPath === '/blog') {
    return true;
  }
  if (onlyPath.startsWith('/blog/page/')) {
    return true;
  }

  return false;
}
